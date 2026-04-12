import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGitlabClient } from "./gitlab-client";
import { Result } from "./result";

const BASE_URL = "https://gitlab.example.com/api/v4";
const TOKEN = "test-token";

const makeResponse = (body: unknown, headers: Record<string, string> = {}) =>
	new Response(JSON.stringify(body), {
		status: 200,
		headers: { "content-type": "application/json", ...headers },
	});

const makeErrorResponse = (status: number, statusText: string) =>
	new Response(null, { status, statusText });

describe("createGitlabClient", () => {
	beforeEach(() => {
		vi.spyOn(globalThis, "fetch");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("fetchGroup", () => {
		it("returns parsed group on success", async () => {
			const group = { id: 1, name: "Test", full_path: "test", web_url: "https://gitlab.com/test" };
			vi.mocked(fetch).mockResolvedValueOnce(makeResponse(group));

			const client = createGitlabClient({ baseUrl: BASE_URL, accessToken: TOKEN });
			const result = await client.fetchGroup(1);

			expect(Result.isOk(result)).toBe(true);
			if (Result.isOk(result)) {
				expect(result.data).toEqual(group);
			}
			expect(fetch).toHaveBeenCalledWith(
				`${BASE_URL}/groups/1`,
				expect.objectContaining({ headers: { "PRIVATE-TOKEN": TOKEN } }),
			);
		});

		it("returns error on HTTP failure", async () => {
			vi.mocked(fetch).mockResolvedValueOnce(makeErrorResponse(404, "Not Found"));

			const client = createGitlabClient({ baseUrl: BASE_URL, accessToken: TOKEN });
			const result = await client.fetchGroup(999);

			expect(Result.isError(result)).toBe(true);
			if (Result.isError(result)) {
				expect(result.error.message).toContain("404");
			}
		});

		it("returns error on invalid response shape", async () => {
			vi.mocked(fetch).mockResolvedValueOnce(makeResponse({ wrong: "shape" }));

			const client = createGitlabClient({ baseUrl: BASE_URL, accessToken: TOKEN });
			const result = await client.fetchGroup(1);

			expect(Result.isError(result)).toBe(true);
		});
	});

	describe("fetchSubgroups (pagination)", () => {
		it("fetches a single page", async () => {
			const groups = [{ id: 2, name: "Sub", full_path: "test/sub", web_url: "https://gitlab.com/test/sub" }];
			vi.mocked(fetch).mockResolvedValueOnce(makeResponse(groups, { "x-total-pages": "1" }));

			const client = createGitlabClient({ baseUrl: BASE_URL, accessToken: TOKEN });
			const result = await client.fetchSubgroups(1);

			expect(Result.isOk(result)).toBe(true);
			if (Result.isOk(result)) {
				expect(result.data).toEqual(groups);
			}
		});

		it("fetches multiple pages", async () => {
			const page1 = [{ id: 2, name: "Sub1", full_path: "t/s1", web_url: "https://gitlab.com/t/s1" }];
			const page2 = [{ id: 3, name: "Sub2", full_path: "t/s2", web_url: "https://gitlab.com/t/s2" }];

			vi.mocked(fetch)
				.mockResolvedValueOnce(makeResponse(page1, { "x-total-pages": "2" }))
				.mockResolvedValueOnce(makeResponse(page2, { "x-total-pages": "2" }));

			const client = createGitlabClient({ baseUrl: BASE_URL, accessToken: TOKEN });
			const result = await client.fetchSubgroups(1);

			expect(Result.isOk(result)).toBe(true);
			if (Result.isOk(result)) {
				expect(result.data).toHaveLength(2);
			}
			expect(fetch).toHaveBeenCalledTimes(2);
		});

		it("returns error if a page fails", async () => {
			vi.mocked(fetch).mockResolvedValueOnce(makeErrorResponse(500, "Internal Server Error"));

			const client = createGitlabClient({ baseUrl: BASE_URL, accessToken: TOKEN });
			const result = await client.fetchSubgroups(1);

			expect(Result.isError(result)).toBe(true);
		});
	});

	describe("fetchGroupProjects", () => {
		it("fetches projects for a group", async () => {
			const projects = [{ id: 10, name: "Proj", path_with_namespace: "g/p", web_url: "https://gitlab.com/g/p" }];
			vi.mocked(fetch).mockResolvedValueOnce(makeResponse(projects, { "x-total-pages": "1" }));

			const client = createGitlabClient({ baseUrl: BASE_URL, accessToken: TOKEN });
			const result = await client.fetchGroupProjects(1);

			expect(Result.isOk(result)).toBe(true);
			if (Result.isOk(result)) {
				expect(result.data).toEqual(projects);
			}
		});
	});

	describe("fetchGroupMembers", () => {
		it("fetches members for a group", async () => {
			const members = [{ id: 20, name: "User", username: "user", access_level: 30, web_url: "https://gitlab.com/user" }];
			vi.mocked(fetch).mockResolvedValueOnce(makeResponse(members, { "x-total-pages": "1" }));

			const client = createGitlabClient({ baseUrl: BASE_URL, accessToken: TOKEN });
			const result = await client.fetchGroupMembers(5);

			expect(Result.isOk(result)).toBe(true);
			if (Result.isOk(result)) {
				expect(result.data).toEqual(members);
			}
		});
	});

	describe("fetchProjectMembers", () => {
		it("fetches members for a project", async () => {
			const members = [{ id: 30, name: "Dev", username: "dev", access_level: 40, web_url: "https://gitlab.com/dev" }];
			vi.mocked(fetch).mockResolvedValueOnce(makeResponse(members, { "x-total-pages": "1" }));

			const client = createGitlabClient({ baseUrl: BASE_URL, accessToken: TOKEN });
			const result = await client.fetchProjectMembers(10);

			expect(Result.isOk(result)).toBe(true);
			if (Result.isOk(result)) {
				expect(result.data).toEqual(members);
			}
		});
	});

	describe("fetchPaginatedData validation", () => {
		it("returns error when response has invalid schema", async () => {
			const invalidData = [{ wrong: "shape" }];
			vi.mocked(fetch).mockResolvedValueOnce(makeResponse(invalidData, { "x-total-pages": "1" }));

			const client = createGitlabClient({ baseUrl: BASE_URL, accessToken: TOKEN });
			const result = await client.fetchSubgroups(1);

			expect(Result.isError(result)).toBe(true);
			if (Result.isError(result)) {
				expect(result.error.message).toContain("subgroups of 1 page 1");
			}
		});
	});
});
