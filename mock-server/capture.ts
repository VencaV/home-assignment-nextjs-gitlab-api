/**
 * Captures live GitLab API responses and saves them as mock data files.
 * Strips responses to only the fields the application needs.
 * Anonymizes member data (name, username, web_url) with consistent mapping.
 * Run once: pnpm capture
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = process.env.GITLAB_BASE_URL ?? "https://gitlab.com/api/v4";
const ACCESS_TOKEN = process.env.GITLAB_ACCESS_TOKEN;
const TOP_GROUP_ID = Number(process.env.TOP_GROUP_ID ?? "10975505");
const DATA_DIR = join(import.meta.dirname, "data");

const REAL_ORG_PREFIX = process.env.REAL_ORG_PREFIX ?? "";
const ANON_ORG_PREFIX = "acme-corp";

if (!ACCESS_TOKEN) {
	throw new Error("GITLAB_ACCESS_TOKEN is not set");
}

const HEADERS = { "PRIVATE-TOKEN": ACCESS_TOKEN };
const MAX_PER_PAGE = 100;

type RawGroup = { id: number; name: string; full_path: string; web_url: string };
type RawProject = { id: number; name: string; path_with_namespace: string; web_url: string };
type RawMember = { id: number; name: string; username: string; access_level: number; web_url: string };
type Member = { readonly originalId: number; readonly id: number; readonly name: string; readonly username: string };

const FAKE_NAMES = [
	"Homer Simpson",
	"Montgomery Burns",
	"Apu Nahasapeemapetilon",
	"Ned Flanders",
	"Waylon Smithers",
	"Moe Szyslak",
	"Marge Simpson",
	"Bart Simpson",
	"Lisa Simpson",
	"Maggie Simpson",
];

const FAKE_BASE_ID = 100001;

const createAnonymizer = () => {
	const memberMap = new Map<number, Member>();
	let counter = 0;

	const anonymizeMember = (m: RawMember): RawMember => {
		const existing = memberMap.get(m.id);
		if (existing) {
			return { id: existing.id, name: existing.name, username: existing.username, access_level: m.access_level, web_url: `https://gitlab.com/${existing.username}` };
		}

		const index = counter++;
		const name = FAKE_NAMES[index % FAKE_NAMES.length] ?? `User ${index}`;
		const username = `user_${index + 1}`;
		const id = FAKE_BASE_ID + index;
		memberMap.set(m.id, { originalId: m.id, id, name, username });

		return { id, name, username, access_level: m.access_level, web_url: `https://gitlab.com/${username}` };
	};

	const getMapping = (): ReadonlyMap<number, Member> => memberMap;

	return { anonymizeMember, getMapping };
};

const anonymizePath = (path: string): string =>
	path.replaceAll(REAL_ORG_PREFIX, ANON_ORG_PREFIX);

const pickGroup = (g: RawGroup): RawGroup => ({
	id: g.id, name: g.name, full_path: anonymizePath(g.full_path), web_url: anonymizePath(g.web_url),
});

const pickProject = (p: RawProject): RawProject => ({
	id: p.id, name: p.name, path_with_namespace: anonymizePath(p.path_with_namespace), web_url: anonymizePath(p.web_url),
});

const fetchAllPages = async (url: string): Promise<unknown[]> => {
	const items: unknown[] = [];
	let page = 1;

	while (true) {
		const separator = url.includes("?") ? "&" : "?";
		const pagedUrl = `${url}${separator}per_page=${MAX_PER_PAGE}&page=${page}`;
		const response = await fetch(pagedUrl, { headers: HEADERS });
		if (!response.ok) {
			throw new Error(`HTTP ${response.status} ${response.statusText} for ${pagedUrl}`);
		}
		const pageItems = (await response.json()) as unknown[];
		items.push(...pageItems);

		const totalPages = Number(response.headers.get("x-total-pages") ?? "1");
		if (page >= totalPages) {
			break;
		}
		page++;
	}

	return items;
};

const fetchSingle = async (url: string): Promise<unknown> => {
	const response = await fetch(url, { headers: HEADERS });
	if (!response.ok) {
		throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
	}
	return response.json();
};

const saveJson = (filename: string, data: unknown): void => {
	const path = join(DATA_DIR, filename);
	writeFileSync(path, JSON.stringify(data, null, 2));
	console.log(`Saved: ${filename}`);
};

const collectAllSubgroupIds = async (groupId: number): Promise<number[]> => {
	const subgroups = (await fetchAllPages(`${BASE_URL}/groups/${groupId}/subgroups`) as RawGroup[]).map(pickGroup);
	saveJson(`group-${groupId}-subgroups.json`, subgroups);

	const childIds: number[] = [];
	for (const sg of subgroups) {
		const deeper = await collectAllSubgroupIds(sg.id);
		childIds.push(sg.id, ...deeper);
	}
	return childIds;
};

const run = async (): Promise<void> => {
	mkdirSync(DATA_DIR, { recursive: true });
	const { anonymizeMember, getMapping } = createAnonymizer();

	console.log(`Capturing data for top group ${TOP_GROUP_ID}…`);

	// Top group
	const topGroup = pickGroup(await fetchSingle(`${BASE_URL}/groups/${TOP_GROUP_ID}`) as RawGroup);
	saveJson(`group-${TOP_GROUP_ID}.json`, topGroup);

	// All subgroups (recursive)
	const allSubgroupIds = await collectAllSubgroupIds(TOP_GROUP_ID);
	const allGroupIds = [TOP_GROUP_ID, ...allSubgroupIds];
	console.log(`Found ${allGroupIds.length} groups total`);

	// Members and projects per group; collect project IDs along the way
	const projectIds = new Set<number>();

	for (const groupId of allGroupIds) {
		const [rawMembers, rawProjects] = await Promise.all([
			fetchAllPages(`${BASE_URL}/groups/${groupId}/members`),
			fetchAllPages(`${BASE_URL}/groups/${groupId}/projects`),
		]);
		const members = (rawMembers as RawMember[]).map(anonymizeMember);
		const projects = (rawProjects as RawProject[]).map(pickProject);

		saveJson(`group-${groupId}-members.json`, members);
		saveJson(`group-${groupId}-projects.json`, projects);

		for (const p of projects) {
			projectIds.add(p.id);
		}
	}

	// Members per project
	for (const projectId of projectIds) {
		const rawMembers = await fetchAllPages(`${BASE_URL}/projects/${projectId}/members`);
		saveJson(`project-${projectId}-members.json`, (rawMembers as RawMember[]).map(anonymizeMember));
	}

	console.log(` ${getMapping().size} unique members.`);
	console.log("Done.");
};

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
