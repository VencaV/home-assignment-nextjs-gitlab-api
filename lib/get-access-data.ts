import { cacheLife, cacheTag } from "next/cache";
import { AggregatedUser } from "../types/domain-types";
import { aggregateUsers } from "./aggregate-users";
import { fetchGroupAccessData } from "./fetch-access-data";
import { createGitlabClient } from "./gitlab-client";
import { Result } from "./result";

export const cacheTagForGroup = (groupId: number): string => `access-data-${groupId}`;

const getConfig = () => {
	const accessToken = process.env.GITLAB_ACCESS_TOKEN;
	if (!accessToken) {
		throw new Error("GITLAB_ACCESS_TOKEN is not set.");
	}
	const baseUrl = process.env.GITLAB_BASE_URL ?? "https://gitlab.com/api/v4";
	return { accessToken, baseUrl };
};

export async function getAccessData(
	groupId: number,
): Promise<{ users: ReadonlyArray<AggregatedUser> }> {
	"use cache";
	cacheLife("hours");
	cacheTag(cacheTagForGroup(groupId));

	const { accessToken, baseUrl } = getConfig();

	const client = createGitlabClient({ baseUrl, accessToken });
	const result = await fetchGroupAccessData(client, groupId);

	if (Result.isError(result)) {
		throw new Error(result.error.message);
	}

	return { users: aggregateUsers(result.data) };
}
