import { describe, expect, it } from "vitest";
import { GitlabClient } from "../types/access-data-types";
import { fetchGroupAccessData } from "./fetch-access-data";
import { Result } from "./result";

const createGroup = (id: number, path: string) => ({
	id,
	name: `Group ${id}`,
	full_path: path,
	web_url: `https://gitlab.com/${path}`,
});

const createProject = (id: number, path: string) => ({
	id,
	name: `Project ${id}`,
	path_with_namespace: path,
	web_url: `https://gitlab.com/${path}`,
});

const createMember = (id: number, level: number) => ({
	id,
	name: `User ${id}`,
	username: `user${id}`,
	access_level: level,
	web_url: `https://gitlab.com/user${id}`,
});

const createMockClient = (overrides: Partial<GitlabClient> = {}): GitlabClient => ({
	fetchGroup: () => Promise.resolve(Result.ok(createGroup(1, "top"))),
	fetchSubgroups: () => Promise.resolve(Result.ok([])),
	fetchGroupProjects: () => Promise.resolve(Result.ok([])),
	fetchGroupMembers: () => Promise.resolve(Result.ok([])),
	fetchProjectMembers: () => Promise.resolve(Result.ok([])),
	...overrides,
});

describe("fetchGroupAccessData", () => {
	it("returns empty groups and projects for a group with no subgroups or projects", async () => {
		const client = createMockClient();
		const result = await fetchGroupAccessData(client, 1);

		expect(Result.isOk(result)).toBe(true);
		if (Result.isOk(result)) {
			expect(result.data.groups).toHaveLength(1);
			expect(result.data.groups[0]?.members).toHaveLength(0);
			expect(result.data.projects).toHaveLength(0);
		}
	});

	it("includes top group members", async () => {
		const client = createMockClient({
			fetchGroupMembers: () => Promise.resolve(Result.ok([createMember(10, 30)])),
		});
		const result = await fetchGroupAccessData(client, 1);

		expect(Result.isOk(result)).toBe(true);
		if (Result.isOk(result)) {
			expect(result.data.groups[0]?.members).toHaveLength(1);
			expect(result.data.groups[0]?.members[0]?.accessLevel).toBe("Developer");
		}
	});

	it("collects subgroups recursively", async () => {
		const sub = createGroup(2, "top/sub");
		const client = createMockClient({
			fetchSubgroups: (groupId) => {
				if (groupId === 1) {
					return Promise.resolve(Result.ok([sub]));
				}
				return Promise.resolve(Result.ok([]));
			},
		});
		const result = await fetchGroupAccessData(client, 1);

		expect(Result.isOk(result)).toBe(true);
		if (Result.isOk(result)) {
			expect(result.data.groups).toHaveLength(2);
		}
	});

	it("collects projects with members", async () => {
		const proj = createProject(10, "top/proj");
		const client = createMockClient({
			fetchGroupProjects: () => Promise.resolve(Result.ok([proj])),
			fetchProjectMembers: () => Promise.resolve(Result.ok([createMember(20, 40)])),
		});
		const result = await fetchGroupAccessData(client, 1);

		expect(Result.isOk(result)).toBe(true);
		if (Result.isOk(result)) {
			expect(result.data.projects).toHaveLength(1);
			expect(result.data.projects[0]?.members).toHaveLength(1);
			expect(result.data.projects[0]?.members[0]?.accessLevel).toBe("Maintainer");
		}
	});

	it("propagates fetchGroup error", async () => {
		const client = createMockClient({
			fetchGroup: () => Promise.resolve(Result.error(new Error("not found"))),
		});
		const result = await fetchGroupAccessData(client, 1);

		expect(Result.isError(result)).toBe(true);
		if (Result.isError(result)) {
			expect(result.error.message).toBe("not found");
		}
	});

	it("propagates fetchSubgroups error", async () => {
		const client = createMockClient({
			fetchSubgroups: () => Promise.resolve(Result.error(new Error("sub error"))),
		});
		const result = await fetchGroupAccessData(client, 1);

		expect(Result.isError(result)).toBe(true);
	});

	it("propagates fetchGroupProjects error", async () => {
		const client = createMockClient({
			fetchGroupProjects: () => Promise.resolve(Result.error(new Error("projects error"))),
		});
		const result = await fetchGroupAccessData(client, 1);

		expect(Result.isError(result)).toBe(true);
	});

	it("propagates fetchGroupMembers error", async () => {
		const client = createMockClient({
			fetchGroupMembers: () => Promise.resolve(Result.error(new Error("members error"))),
		});
		const result = await fetchGroupAccessData(client, 1);

		expect(Result.isError(result)).toBe(true);
	});

	it("propagates fetchProjectMembers error", async () => {
		const proj = createProject(10, "top/proj");
		const client = createMockClient({
			fetchGroupProjects: () => Promise.resolve(Result.ok([proj])),
			fetchProjectMembers: () => Promise.resolve(Result.error(new Error("proj members error"))),
		});
		const result = await fetchGroupAccessData(client, 1);

		expect(Result.isError(result)).toBe(true);
	});
});
