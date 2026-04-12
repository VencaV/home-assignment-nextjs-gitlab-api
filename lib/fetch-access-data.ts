import { FetchResult, GitlabClient, GroupWithMembers, MemberEntry, ProjectWithMembers } from "../types/access-data-types";
import { Membership } from "../types/domain-types";
import {
	accessLevelToLabel, GitlabGroup,
	GitlabMember,
	GitlabProject
} from "./gitlab-schemas";
import { Result } from "./result";
import { fetchInBatches } from "./api-client";


const toMemberEntry = (
	m: GitlabMember,
	path: string,
	webUrl: string,
	kind: Membership["kind"],
): MemberEntry => ({
	userId: m.id,
	name: m.name,
	username: m.username,
	userWebUrl: m.web_url,
	path,
	webUrl,
	accessLevel: accessLevelToLabel(m.access_level),
	kind,
});

const collectAllSubgroups = async (
	client: GitlabClient,
	groupId: number,
): Promise<Result<ReadonlyArray<GitlabGroup>>> => {
	const result = await client.fetchSubgroups(groupId);
	if (Result.isError(result)) {
		return result;
	}

	const childResults = await Promise.all(
		result.data.map((g) => collectAllSubgroups(client, g.id)),
	);
	return Result.map(Result.flattenResults(childResults), (children) => Array.from(result.data).concat(Array.from(children)));
};

const collectAllProjects = async (
	client: GitlabClient,
	groupIds: ReadonlyArray<number>,
): Promise<Result<ReadonlyArray<GitlabProject>>> => {
	const results = await Promise.all(
		groupIds.map((id) => client.fetchGroupProjects(id)),
	);
	return Result.flattenResults(results);
};

const fetchGroupWithMembers = async (
	client: GitlabClient,
	group: GitlabGroup,
): Promise<Result<GroupWithMembers>> => {
	const membersResult = await client.fetchGroupMembers(group.id);
	if (Result.isError(membersResult)) {
		return membersResult;
	}
	const members = membersResult.data.map((m) =>
		toMemberEntry(m, group.full_path, group.web_url, "group"),
	);
	return Result.ok({ group, members });
};

const fetchProjectWithMembers = async (
	client: GitlabClient,
	project: GitlabProject,
): Promise<Result<ProjectWithMembers>> => {
	const membersResult = await client.fetchProjectMembers(project.id);
	if (Result.isError(membersResult)) {
		return membersResult;
	}
	const members = membersResult.data.map((m) =>
		toMemberEntry(m, project.path_with_namespace, project.web_url, "project"),
	);
	return Result.ok({ project, members });
};

export const fetchGroupAccessData = async (
	client: GitlabClient,
	topGroupId: number,
): Promise<Result<FetchResult>> => {
	const topGroupResult = await client.fetchGroup(topGroupId);
	if (Result.isError(topGroupResult)) {
		return topGroupResult;
	}

	const subgroupsResult = await collectAllSubgroups(client, topGroupId);
	if (Result.isError(subgroupsResult)) {
		return subgroupsResult;
	}

	const allGroups: ReadonlyArray<GitlabGroup> = [topGroupResult.data, ...subgroupsResult.data];

	const projectsResult = await collectAllProjects(client, allGroups.map((g) => g.id));
	if (Result.isError(projectsResult)) {
		return projectsResult;
	}

	const [groupResults, projectResults] = await Promise.all([
		fetchInBatches(allGroups, (g) => fetchGroupWithMembers(client, g)),
		fetchInBatches(projectsResult.data, (p) => fetchProjectWithMembers(client, p)),
	]);

	return Result.flatMap(
		Result.collectResults(groupResults),
		(groups) => Result.map(
			Result.collectResults(projectResults),
			(projects) => ({ groups, projects }),
		),
	);
};
