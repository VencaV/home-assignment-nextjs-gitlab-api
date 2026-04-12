import { createGitlabClient } from "../lib/gitlab-client";
import { GitlabGroup, GitlabProject } from "../lib/gitlab-schemas";
import { Membership } from "./domain-types";

export type MemberEntry = Membership & {
	readonly userId: number;
	readonly name: string;
	readonly username: string;
	readonly userWebUrl: string;
};

export type GroupWithMembers = {
	readonly group: GitlabGroup;
	readonly members: ReadonlyArray<MemberEntry>;
};

export type ProjectWithMembers = {
	readonly project: GitlabProject;
	readonly members: ReadonlyArray<MemberEntry>;
};

export type FetchResult = {
	readonly groups: ReadonlyArray<GroupWithMembers>;
	readonly projects: ReadonlyArray<ProjectWithMembers>;
};

export type GitlabClient = ReturnType<typeof createGitlabClient>;
