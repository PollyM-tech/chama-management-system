import { describe, expect, test } from "vitest";
import { preferredChamaId } from "./chama-navigation";

describe("post-login group selection", () => {
  test("opens the last selected group when membership is still valid", () => {
    expect(
      preferredChamaId([{ _id: "pamoja" }, { _id: "shikilia" }], "pamoja"),
    ).toBe("pamoja");
  });
  test("opens a sole membership directly", () => {
    expect(preferredChamaId([{ _id: "pamoja" }], null)).toBe("pamoja");
  });
  test("asks the user to choose when there are multiple groups and no valid saved choice", () => {
    const groups = [{ _id: "pamoja" }, { _id: "shikilia" }];
    expect(preferredChamaId(groups, null)).toBeNull();
    expect(preferredChamaId(groups, "removed-membership")).toBeNull();
  });
  test("a stale saved membership cannot override onboarding or a sole valid membership", () => {
    expect(preferredChamaId([], "removed-membership")).toBeNull();
    expect(preferredChamaId([{ _id: "pamoja" }], "removed-membership")).toBe(
      "pamoja",
    );
  });
});
