import { z } from "zod";
import { Result } from "./result";
import { FetchSuccess } from "../types/api-types";

const MAX_PER_PAGE = 100;

export const apiFetch = async (
	url: string,
	headers: Record<string, string>,
): Promise<Result<FetchSuccess>> => {
	const response = await fetch(url, { headers });

	if (!response.ok) {
		return Result.error(new Error(`GitLab API error: ${response.status} ${response.statusText} for ${url}`));
	}

	return Result.ok({ body: await response.json(), headers: response.headers });
};

export const fetchPaginatedData = async <T>(
	url: string,
	headers: Record<string, string>,
	schema: z.ZodType<T>,
	context: string,
): Promise<Result<ReadonlyArray<T>>> => {
	const items: T[] = [];
	let page = 1;

	while (true) {
		const separator = url.includes("?") ? "&" : "?";
		const pagedUrl = `${url}${separator}per_page=${MAX_PER_PAGE}&page=${page}`;

		const result = await apiFetch(pagedUrl, headers);
		if (Result.isError(result)) {
			return result;
		}

		const validated = Result.fromZodSafeParse(
			z.array(schema).safeParse(result.data.body),
			`${context} page ${page}`,
		);
		if (Result.isError(validated)) {
			return validated;
		}

		items.push(...validated.data);

		const totalPages = Number(result.data.headers.get("x-total-pages") ?? "1");
		if (page >= totalPages) {
			break;
		}
		page++;
	}

	return Result.ok(items);
};

const DEFAULT_BATCH_SIZE = 20;

export const fetchInBatches = async <T, R>(
	items: ReadonlyArray<T>,
	fn: (item: T) => Promise<R>,
	batchSize = DEFAULT_BATCH_SIZE,
): Promise<R[]> => {
	const results: R[] = [];
	for (let i = 0; i < items.length; i += batchSize) {
		const batch = items.slice(i, i + batchSize);
		results.push(...await Promise.all(batch.map(fn)));
	}
	return results;
};
