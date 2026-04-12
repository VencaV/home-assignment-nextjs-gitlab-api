import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { apiFetch, fetchInBatches, fetchPaginatedData } from "./api-client";
import { Result } from "./result";

const makeResponse = (body: unknown, headers: Record<string, string> = {}) =>
	new Response(JSON.stringify(body), {
		status: 200,
		headers: { "content-type": "application/json", ...headers },
	});

const makeErrorResponse = (status: number, statusText: string) =>
	new Response(null, { status, statusText });

describe("apiFetch", () => {
	beforeEach(() => {
		vi.spyOn(globalThis, "fetch");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns ok with body and headers on success", async () => {
		const body = { id: 1 };
		vi.mocked(fetch).mockResolvedValueOnce(makeResponse(body));

		const result = await apiFetch("https://example.com/api", { "PRIVATE-TOKEN": "token" });

		expect(Result.isOk(result)).toBe(true);
		if (Result.isOk(result)) {
			expect(result.data.body).toEqual(body);
			expect(result.data.headers).toBeInstanceOf(Headers);
		}
	});

	it("passes headers to fetch", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(makeResponse({}));

		await apiFetch("https://example.com/api", { "PRIVATE-TOKEN": "secret" });

		expect(fetch).toHaveBeenCalledWith(
			"https://example.com/api",
			expect.objectContaining({ headers: { "PRIVATE-TOKEN": "secret" } }),
		);
	});

	it("returns error on non-ok response", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(makeErrorResponse(404, "Not Found"));

		const result = await apiFetch("https://example.com/api/missing", {});

		expect(Result.isError(result)).toBe(true);
		if (Result.isError(result)) {
			expect(result.error.message).toContain("404");
			expect(result.error.message).toContain("Not Found");
			expect(result.error.message).toContain("https://example.com/api/missing");
		}
	});

	it("returns error on 500", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(makeErrorResponse(500, "Internal Server Error"));

		const result = await apiFetch("https://example.com/api", {});

		expect(Result.isError(result)).toBe(true);
		if (Result.isError(result)) {
			expect(result.error.message).toContain("500");
		}
	});
});

describe("fetchPaginatedData", () => {
	const itemSchema = z.object({ id: z.number(), name: z.string() });
	const headers = { "PRIVATE-TOKEN": "token" };

	beforeEach(() => {
		vi.spyOn(globalThis, "fetch");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns all items from a single page", async () => {
		const items = [{ id: 1, name: "A" }, { id: 2, name: "B" }];
		vi.mocked(fetch).mockResolvedValueOnce(makeResponse(items, { "x-total-pages": "1" }));

		const result = await fetchPaginatedData("https://example.com/items", headers, itemSchema, "items");

		expect(Result.isOk(result)).toBe(true);
		if (Result.isOk(result)) {
			expect(result.data).toEqual(items);
		}
	});

	it("fetches all pages and concatenates results", async () => {
		const page1 = [{ id: 1, name: "A" }];
		const page2 = [{ id: 2, name: "B" }];
		const page3 = [{ id: 3, name: "C" }];

		vi.mocked(fetch)
			.mockResolvedValueOnce(makeResponse(page1, { "x-total-pages": "3" }))
			.mockResolvedValueOnce(makeResponse(page2, { "x-total-pages": "3" }))
			.mockResolvedValueOnce(makeResponse(page3, { "x-total-pages": "3" }));

		const result = await fetchPaginatedData("https://example.com/items", headers, itemSchema, "items");

		expect(Result.isOk(result)).toBe(true);
		if (Result.isOk(result)) {
			expect(result.data).toHaveLength(3);
			expect(result.data).toEqual([...page1, ...page2, ...page3]);
		}
		expect(fetch).toHaveBeenCalledTimes(3);
	});

	it("appends pagination params to URL without existing query string", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(makeResponse([], { "x-total-pages": "1" }));

		await fetchPaginatedData("https://example.com/items", headers, itemSchema, "items");

		expect(fetch).toHaveBeenCalledWith(
			"https://example.com/items?per_page=100&page=1",
			expect.anything(),
		);
	});

	it("appends pagination params to URL with existing query string", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(makeResponse([], { "x-total-pages": "1" }));

		await fetchPaginatedData("https://example.com/items?archived=false", headers, itemSchema, "items");

		expect(fetch).toHaveBeenCalledWith(
			"https://example.com/items?archived=false&per_page=100&page=1",
			expect.anything(),
		);
	});

	it("returns error when a page request fails", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(makeErrorResponse(403, "Forbidden"));

		const result = await fetchPaginatedData("https://example.com/items", headers, itemSchema, "items");

		expect(Result.isError(result)).toBe(true);
		if (Result.isError(result)) {
			expect(result.error.message).toContain("403");
		}
	});

	it("returns error when response does not match schema", async () => {
		const invalidItems = [{ id: "not-a-number", name: "A" }];
		vi.mocked(fetch).mockResolvedValueOnce(makeResponse(invalidItems, { "x-total-pages": "1" }));

		const result = await fetchPaginatedData("https://example.com/items", headers, itemSchema, "items");

		expect(Result.isError(result)).toBe(true);
	});

	it("defaults to 1 total page when x-total-pages header is missing", async () => {
		const items = [{ id: 1, name: "A" }];
		vi.mocked(fetch).mockResolvedValueOnce(makeResponse(items));

		const result = await fetchPaginatedData("https://example.com/items", headers, itemSchema, "items");

		expect(Result.isOk(result)).toBe(true);
		if (Result.isOk(result)) {
			expect(result.data).toEqual(items);
		}
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it("stops fetching after a page error mid-pagination", async () => {
		const page1 = [{ id: 1, name: "A" }];

		vi.mocked(fetch)
			.mockResolvedValueOnce(makeResponse(page1, { "x-total-pages": "3" }))
			.mockResolvedValueOnce(makeErrorResponse(500, "Internal Server Error"));

		const result = await fetchPaginatedData("https://example.com/items", headers, itemSchema, "items");

		expect(Result.isError(result)).toBe(true);
		expect(fetch).toHaveBeenCalledTimes(2);
	});
});

describe("fetchInBatches", () => {
	it("processes all items when count is less than or equal to batch size", async () => {
		const items = [1, 2, 3];
		const fn = vi.fn(async (x: number) => x * 2);

		const results = await fetchInBatches(items, fn);

		expect(results).toEqual([2, 4, 6]);
		expect(fn).toHaveBeenCalledTimes(3);
	});

	it("processes items in multiple batches when count exceeds batch size", async () => {
		const items = [1, 2, 3, 4, 5];
		const fn = vi.fn(async (x: number) => x * 10);

		const results = await fetchInBatches(items, fn, 2);

		expect(results).toEqual([10, 20, 30, 40, 50]);
		expect(fn).toHaveBeenCalledTimes(5);
	});

	it("returns results in correct order across batches", async () => {
		const items = ["a", "b", "c", "d"];
		const fn = vi.fn(async (x: string) => x.toUpperCase());

		const results = await fetchInBatches(items, fn, 2);

		expect(results).toEqual(["A", "B", "C", "D"]);
	});

	it("executes batches sequentially, not all at once", async () => {
		const order: number[] = [];
		const items = [1, 2, 3, 4];
		let resolved = 0;
		const fn = vi.fn(async (x: number) => {
			order.push(x);
			resolved++;
			return x;
		});

		await fetchInBatches(items, fn, 2);

		// Batches are sequential: [1,2] then [3,4]
		expect(order).toEqual([1, 2, 3, 4]);
		expect(resolved).toBe(4);
	});

	it("returns empty array for empty input", async () => {
		const fn = vi.fn(async (x: number) => x);

		const results = await fetchInBatches([], fn);

		expect(results).toEqual([]);
		expect(fn).not.toHaveBeenCalled();
	});

	it("uses default batch size of 20", async () => {
		const items = Array.from({ length: 25 }, (_, i) => i);
		let maxSimultaneous = 0;
		let currentActive = 0;

		const fn = vi.fn(async (x: number) => {
			currentActive++;
			maxSimultaneous = Math.max(maxSimultaneous, currentActive);

			await new Promise(res => setTimeout(res, 10));
			currentActive--;
			return x;
		});

		const results = await fetchInBatches(items, fn);

		expect(results).toHaveLength(25);
		expect(maxSimultaneous).toBe(20);
	});

});
