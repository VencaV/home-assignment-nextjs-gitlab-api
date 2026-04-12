import { describe, expect, it } from "vitest";
import { FetchResult, MemberEntry } from "../types/access-data-types";
import { aggregateUsers } from "./aggregate-users";

const createMember = (overrides: Partial<MemberEntry> & { userId: number }): MemberEntry => ({
	userId: overrides.userId,
	name: overrides.name ?? `User ${overrides.userId}`,
	username: overrides.username ?? `user${overrides.userId}`,
	userWebUrl: overrides.userWebUrl ?? `https://gitlab.com/user${overrides.userId}`,
	path: overrides.path ?? "group/path",
	webUrl: overrides.webUrl ?? "https://gitlab.com/group/path",
	accessLevel: overrides.accessLevel ?? "Developer",
	kind: overrides.kind ?? "group",
});

const group = { id: 1, name: "G1", full_path: "g1", web_url: "https://gitlab.com/g1" };
const project = { id: 10, name: "P1", path_with_namespace: "g1/p1", web_url: "https://gitlab.com/g1/p1" };

describe("aggregateUsers", () => {
	it("returns empty array for empty data", () => {
		const data: FetchResult = { groups: [], projects: [] };
		expect(aggregateUsers(data)).toEqual([]);
	});

	it("aggregates a single user from one group", () => {
		const member = createMember({ userId: 1, path: "g1", webUrl: "https://gitlab.com/g1", kind: "group" });
		const data: FetchResult = {
			groups: [{ group, members: [member] }],
			projects: [],
		};
		const users = aggregateUsers(data);
		expect(users).toHaveLength(1);
		expect(users[0]?.groups).toHaveLength(1);
		expect(users[0]?.projects).toHaveLength(0);
	});

	it("merges the same user across groups and projects", () => {
		const groupMember = createMember({ userId: 1, path: "g1", kind: "group" });
		const projectMember = createMember({ userId: 1, path: "g1/p1", kind: "project" });
		const data: FetchResult = {
			groups: [{ group, members: [groupMember] }],
			projects: [{ project, members: [projectMember] }],
		};
		const users = aggregateUsers(data);
		expect(users).toHaveLength(1);
		expect(users[0]?.groups).toHaveLength(1);
		expect(users[0]?.projects).toHaveLength(1);
	});

	it("keeps distinct users separate", () => {
		const m1 = createMember({ userId: 1 });
		const m2 = createMember({ userId: 2 });
		const data: FetchResult = {
			groups: [{ group, members: [m1, m2] }],
			projects: [],
		};
		const users = aggregateUsers(data);
		expect(users).toHaveLength(2);
	});

	it("produces correct membership shape", () => {
		const member = createMember({
			userId: 1,
			path: "g1",
			webUrl: "https://gitlab.com/g1",
			accessLevel: "Maintainer",
			kind: "group",
		});
		const data: FetchResult = {
			groups: [{ group, members: [member] }],
			projects: [],
		};
		const users = aggregateUsers(data);
		expect(users[0]?.groups[0]).toEqual({
			path: "g1",
			webUrl: "https://gitlab.com/g1",
			accessLevel: "Maintainer",
			kind: "group",
		});
	});
});
