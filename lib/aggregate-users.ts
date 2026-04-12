import { FetchResult, MemberEntry } from "../types/access-data-types";
import { AggregatedUser, Membership } from "../types/domain-types";
import { UserMap, UserRecord } from "../types/user-types";

const transformToMembership = (m: MemberEntry): Membership => ({
	path: m.path,
	webUrl: m.webUrl,
	accessLevel: m.accessLevel,
	kind: m.kind,
});

const ensureUser = (userMap: UserMap, entry: MemberEntry): UserRecord => {
	if (!userMap.has(entry.userId)) {
		userMap.set(entry.userId, {
			name: entry.name,
			username: entry.username,
			webUrl: entry.userWebUrl,
			groups: [],
			projects: [],
		});
	}
	return userMap.get(entry.userId)!;
};

export const aggregateUsers = (data: FetchResult): ReadonlyArray<AggregatedUser> => {
	const userMap: UserMap = new Map();

	for (const { members } of data.groups) {
		for (const m of members) {
			ensureUser(userMap, m).groups.push(transformToMembership(m));
		}
	}

	for (const { members } of data.projects) {
		for (const m of members) {
			ensureUser(userMap, m).projects.push(transformToMembership(m));
		}
	}

	return Array.from(userMap.values());
};
