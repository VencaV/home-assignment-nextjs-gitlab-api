import { apiFetch, fetchPaginatedData } from "./api-client";
import {
	GitlabGroup,
	GitlabMember,
	GitlabProject,
	gitlabGroupSchema,
	gitlabMemberSchema,
	gitlabProjectSchema,
} from "./gitlab-schemas";
import { Result } from "./result";

type GitlabClientConfig = {
	readonly baseUrl: string;
	readonly accessToken: string;
};

export const createGitlabClient = (config: GitlabClientConfig) => {
	const headers = { "PRIVATE-TOKEN": config.accessToken };
	const base = config.baseUrl;

	const fetchSubgroups = (groupId: number) =>
		fetchPaginatedData<GitlabGroup>(`${base}/groups/${groupId}/subgroups`, headers, gitlabGroupSchema, `subgroups of ${groupId}`);

	const fetchGroupProjects = (groupId: number) =>
		fetchPaginatedData<GitlabProject>(`${base}/groups/${groupId}/projects`, headers, gitlabProjectSchema, `projects of group ${groupId}`);

	const fetchGroupMembers = (groupId: number) =>
		fetchPaginatedData<GitlabMember>(`${base}/groups/${groupId}/members`, headers, gitlabMemberSchema, `members of group ${groupId}`);

	const fetchProjectMembers = (projectId: number) =>
		fetchPaginatedData<GitlabMember>(`${base}/projects/${projectId}/members`, headers, gitlabMemberSchema, `members of project ${projectId}`);

	const fetchGroup = async (groupId: number): Promise<Result<GitlabGroup>> => {
		const result = await apiFetch(`${base}/groups/${groupId}`, headers);
		if (Result.isError(result)) {
			return result;
		}
		return Result.fromZodSafeParse(gitlabGroupSchema.safeParse(result.data.body), `group ${groupId}`);
	};

	return { fetchSubgroups, fetchGroupProjects, fetchGroupMembers, fetchProjectMembers, fetchGroup };
};
