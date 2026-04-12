"use server";

import { cacheTagForGroup } from "@/lib/get-access-data";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

export const checkAccessAction = async (formData: FormData): Promise<void> => {
	const rawGroupId = formData.get("groupId");
	if (typeof rawGroupId !== "string" || !/^\d+$/.test(rawGroupId)) {
		redirect("/");
	}

	const groupId = Number(rawGroupId);
	const fresh = formData.get("fresh") === "on";

	if (fresh) {
		revalidateTag(cacheTagForGroup(groupId), "hours");
	}

	redirect(`/result?groupId=${groupId}`);
};

export const revalidateAction = async (formData: FormData): Promise<void> => {
	const rawGroupId = formData.get("groupId");
	if (typeof rawGroupId !== "string" || !/^\d+$/.test(rawGroupId)) {
		redirect("/");
	}

	const groupId = Number(rawGroupId);
	revalidateTag(cacheTagForGroup(groupId), "hours");
	redirect(`/result?groupId=${groupId}`);
};
