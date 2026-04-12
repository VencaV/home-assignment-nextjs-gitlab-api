import { z } from "zod";

export type Result<T, E = Error> =
  | { status: "ok"; data: T }
  | { status: "error"; error: E };

export const Result = {
	ok: <T>(data: T): Result<T, never> => ({ status: "ok", data }),
	error: <E = Error>(error: E): Result<never, E> => ({ status: "error", error }),
	isOk: <T, E>(result: Result<T, E>): result is { status: "ok"; data: T } => {
		return result.status === "ok";
	},
	isError: <T, E>(result: Result<T, E>): result is { status: "error"; error: E } => {
		return result.status === "error";
	},
	map: <T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> => {
		if (result.status === "error") {
			return result;
		}
		return Result.ok(fn(result.data));
	},
	flatMap: <T, U, E>(result: Result<T, E>, fn: (data: T) => Result<U, E>): Result<U, E> => {
		if (result.status === "error") {
			return result;
		}
		return fn(result.data);
	},
	fromZodSafeParse: <T>(
		parseResult: z.ZodSafeParseResult<T>,
		context: string,
	): Result<T, Error> => {
		if (parseResult.success) {
			return Result.ok(parseResult.data);
		}
		return Result.error(new Error(`${context}:\n${parseResult.error.message}`));
	},
	collectResults: <T>(results: ReadonlyArray<Result<T>>): Result<ReadonlyArray<T>> => {
		const collected: T[] = [];
		for (const result of results) {
			if (Result.isError(result)) {
				return result;
			}
			collected.push(result.data);
		}
		return Result.ok(collected);
	},
	flattenResults: <T>(results: ReadonlyArray<Result<ReadonlyArray<T>>>): Result<ReadonlyArray<T>> => {
		const collected: T[] = [];
		for (const result of results) {
			if (Result.isError(result)) {
				return result;
			}
			collected.push(...result.data);
		}
		return Result.ok(collected);
	},
};
