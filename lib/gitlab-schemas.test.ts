import { describe, expect, it } from "vitest";
import { accessLevelToLabel } from "./gitlab-schemas";

describe("accessLevelToLabel", () => {
	it.each([
		[10, "Guest"],
		[20, "Reporter"],
		[30, "Developer"],
		[40, "Maintainer"],
		[50, "Owner"],
	])("maps level %i to %s", (level, expected) => {
		expect(accessLevelToLabel(level)).toBe(expected);
	});

	it("returns Unknown for unrecognized level", () => {
		expect(accessLevelToLabel(99)).toBe("Unknown (99)");
	});
});
