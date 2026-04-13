import Fastify, { type FastifyReply } from "fastify";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const PORT = Number(process.env.PORT ?? "3001");
const DATA_DIR = join(import.meta.dirname, "data");

const NUMERIC_ID_PATTERN = /^\d+$/;

const PAGINATION_HEADERS = {
	"x-total-pages": "1",
	"x-page": "1",
	"x-per-page": "100",
};

const loadAllData = (): ReadonlyMap<string, unknown> => {
	const entries = new Map<string, unknown>();
	for (const file of readdirSync(DATA_DIR)) {
		if (!file.endsWith(".json")) {
			continue;
		}
		const key = file.replace(/\.json$/, "");
		entries.set(key, JSON.parse(readFileSync(join(DATA_DIR, file), "utf-8")));
	}
	return entries;
};

const dataStore = loadAllData();

const sendEntry = (reply: FastifyReply, id: string, key: string, paginated: boolean) => {
	if (!NUMERIC_ID_PATTERN.test(id)) {
		return reply.code(400).send({ message: `Invalid ID: ${id}` });
	}
	const entry = dataStore.get(key);
	if (entry === undefined) {
		return reply.code(404).send({ message: "Not found" });
	}
	return paginated ? reply.headers(PAGINATION_HEADERS).send(entry) : reply.send(entry);
};

const server = Fastify({ logger: true });

server.get<{ Params: { groupId: string } }>("/groups/:groupId", (request, reply) =>
	sendEntry(reply, request.params.groupId, `group-${request.params.groupId}`, false),
);

server.get<{ Params: { groupId: string } }>("/groups/:groupId/subgroups", (request, reply) =>
	sendEntry(reply, request.params.groupId, `group-${request.params.groupId}-subgroups`, true),
);

server.get<{ Params: { groupId: string } }>("/groups/:groupId/projects", (request, reply) =>
	sendEntry(reply, request.params.groupId, `group-${request.params.groupId}-projects`, true),
);

server.get<{ Params: { groupId: string } }>("/groups/:groupId/members", (request, reply) =>
	sendEntry(reply, request.params.groupId, `group-${request.params.groupId}-members`, true),
);

server.get<{ Params: { projectId: string } }>("/projects/:projectId/members", (request, reply) =>
	sendEntry(reply, request.params.projectId, `project-${request.params.projectId}-members`, true),
);

server.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
	if (err) {
		server.log.error(err);
		process.exit(1);
	}
});
