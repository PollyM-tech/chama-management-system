import { expect, test } from "vitest";
import { authEmailError } from "./auth-errors";
test("email failures explain recovery without exposing backend details", () => {
  expect(authEmailError(new Error("AUTH_EMAIL_SENDER_REJECTED"))).toContain("email service");
  expect(authEmailError(new Error("AUTH_EMAIL_DELIVERY_FAILED"))).toContain("signing in");
  expect(authEmailError(new Error("AUTH_EMAIL_RATE_LIMITED"))).toContain("Wait a few minutes");
  expect(authEmailError(new Error("Invalid credentials"))).toBeNull();
});
