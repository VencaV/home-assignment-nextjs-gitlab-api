import { expect, test } from "@playwright/test";

test.describe("Home page", () => {
	test("renders heading and form", async ({ page }) => {
		await page.goto("/");

		await expect(page.getByRole("heading", { level: 1 })).toHaveText("🔐 GitLab Access Checker");
		await expect(page.locator("#groupId")).toBeVisible();
		await expect(page.getByRole("button", { name: "Check Access 🔍" })).toBeVisible();
		await expect(page.locator(".cache-notice")).toBeVisible();
	});

	test("group ID input is required", async ({ page }) => {
		await page.goto("/");

		const input = page.locator("#groupId");
		await expect(input).toHaveAttribute("required", "");
	});

	test("submitting with valid group ID navigates to result page", async ({ page }) => {
		await page.goto("/");

		await page.locator("#groupId").fill("12345");
		await page.getByRole("button", { name: "Check Access 🔍" }).click();

		await page.waitForURL(/\/result\?groupId=12345/);
		expect(page.url()).toContain("/result?groupId=12345");
	});
});
