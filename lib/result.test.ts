import { describe, expect, it } from "vitest";
import { z } from "zod";
import { Result } from "./result";

describe("Result.ok", () => {
	it("creates an ok result", () => {
		const result = Result.ok(42);
		expect(result).toEqual({ status: "ok", data: 42 });
	});
});

describe("Result.error", () => {
	it("creates an error result", () => {
		const err = new Error("fail");
		const result = Result.error(err);
		expect(result).toEqual({ status: "error", error: err });
	});
});

describe("Result.isOk", () => {
	it("returns true for ok", () => {
		expect(Result.isOk(Result.ok(1))).toBe(true);
	});
	it("returns false for error", () => {
		expect(Result.isOk(Result.error(new Error("x")))).toBe(false);
	});
});

describe("Result.isError", () => {
	it("returns true for error", () => {
		expect(Result.isError(Result.error(new Error("x")))).toBe(true);
	});
	it("returns false for ok", () => {
		expect(Result.isError(Result.ok(1))).toBe(false);
	});
});

describe("Result.map", () => {
	it("maps ok value", () => {
		const result = Result.map(Result.ok(2), (x) => x * 3);
		expect(result).toEqual({ status: "ok", data: 6 });
	});
	it("passes through error", () => {
		const err = Result.error(new Error("fail"));
		const result = Result.map(err, () => 42);
		expect(result).toBe(err);
	});
});

describe("Result.flatMap", () => {
	it("flat maps ok value", () => {
		const result = Result.flatMap(Result.ok(2), (x) => Result.ok(x * 3));
		expect(result).toEqual({ status: "ok", data: 6 });
	});
	it("flat maps to error", () => {
		const result = Result.flatMap(Result.ok(2), () => Result.error(new Error("inner")));
		expect(Result.isError(result)).toBe(true);
	});
	it("passes through error", () => {
		const err = Result.error(new Error("fail"));
		const result = Result.flatMap(err, () => Result.ok(42));
		expect(result).toBe(err);
	});
});

describe("Result.fromZodSafeParse", () => {
	const schema = z.object({ name: z.string() });

	it("returns ok for valid parse", () => {
		const parseResult = schema.safeParse({ name: "hello" });
		const result = Result.fromZodSafeParse(parseResult, "test");
		expect(result).toEqual({ status: "ok", data: { name: "hello" } });
	});

	it("returns error for invalid parse", () => {
		const parseResult = schema.safeParse({ name: 123 });
		const result = Result.fromZodSafeParse(parseResult, "test context");
		expect(Result.isError(result)).toBe(true);
		if (Result.isError(result)) {
			expect(result.error.message).toContain("test context");
		}
	});
});
