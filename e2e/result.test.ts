import { expect, test } from "@playwright/test";

test.describe("Result page", () => {
	test("shows error for missing group ID", async ({ page }) => {
		await page.goto("/result");

		await expect(page.getByRole("heading", { level: 1 })).toHaveText("Error");
		await expect(page.getByText("Invalid or missing group ID.")).toBeVisible();
		await expect(page.getByRole("link", { name: "Go back" })).toHaveAttribute("href", "/");
	});

	test("shows error for non-numeric group ID", async ({ page }) => {
		await page.goto("/result?groupId=abc");

		await expect(page.getByRole("heading", { level: 1 })).toHaveText("Error");
		await expect(page.getByText("Invalid or missing group ID.")).toBeVisible();
	});

	test("shows error for valid numeric group ID without valid setup", async ({ page }) => {
		await page.goto("/result?groupId=12345");

		await expect(page.getByRole("heading", { level: 1 })).toHaveText("Error");
	});

	test("go back link navigates to home", async ({ page }) => {
		await page.goto("/result");

		await page.getByRole("link", { name: "Go back" }).click();
		await page.waitForURL("/");
	});
});
