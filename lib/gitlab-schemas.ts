import { z } from "zod";

export const gitlabGroupSchema = z.object({
	id: z.number(),
	name: z.string(),
	full_path: z.string(),
	web_url: z.string(),
});

export const gitlabProjectSchema = z.object({
	id: z.number(),
	name: z.string(),
	path_with_namespace: z.string(),
	web_url: z.string(),
});

export const gitlabMemberSchema = z.object({
	id: z.number(),
	name: z.string(),
	username: z.string(),
	access_level: z.number(),
	web_url: z.string(),
});

export type GitlabGroup = z.infer<typeof gitlabGroupSchema>;
export type GitlabProject = z.infer<typeof gitlabProjectSchema>;
export type GitlabMember = z.infer<typeof gitlabMemberSchema>;

const ACCESS_LEVEL_LABELS: Record<number, string> = {
	10: "Guest",
	20: "Reporter",
	30: "Developer",
	40: "Maintainer",
	50: "Owner",
};

export const accessLevelToLabel = (level: number): string =>
	ACCESS_LEVEL_LABELS[level] ?? `Unknown (${level})`;
