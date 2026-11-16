import { expect, test } from "vitest";
import { creditAssessment } from "./credit";
const now = 1000;
const paid = { expected: 100, paid: 100, paidAt: 400, dueDate: 500, status: "paid" };
test("requires history and excludes future and waived obligations", () => {
  expect(creditAssessment([], [], now).score).toBeNull();
  expect(creditAssessment([paid, paid, { ...paid, dueDate: 2000 }, { ...paid, status: "waived" }], [], now).score).toBeNull();
});
test("normalizes score without loans, and penalizes overdue loans", () => {
  expect(creditAssessment([paid, paid, paid], [], now).score).toBe(100);
  const result = creditAssessment([paid, paid, paid], [{ totalRepayable: 100, amountRepaid: 50, dueDate: 500, status: "active" }], now);
  expect(result.score).toBe(70);
  expect(result.overdueLoans).toBe(1);
});
test("partial contributions and missing dates do not earn on-time points", () => {
  const c = { ...paid, paid: 50, paidAt: undefined, status: "pending" };
  const result = creditAssessment([c, c, c], [], now);
  expect(result.score).toBe(29);
  expect(result.overdueContributions).toBe(3);
});
