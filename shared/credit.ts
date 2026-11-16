/** Internal repayment-history indicator, version 1. Never an approval decision. */
export function creditAssessment(
  contributions: { expected: number; paid: number; dueDate: number; paidAt?: number; status: string }[],
  loans: { totalRepayable: number; amountRepaid: number; dueDate: number; status: string }[],
  now: number,
) {
  const due = contributions.filter(c => c.status !== "waived" && c.dueDate <= now);
  const funded = loans.filter(l => ["active", "disbursed", "repaid", "defaulted"].includes(l.status));
  const completed = due.filter(c => c.paid >= c.expected);
  const onTime = completed.filter(c => c.paidAt !== undefined && c.paidAt <= c.dueDate);
  const expected = due.reduce((s, c) => s + c.expected, 0);
  const received = due.reduce((s, c) => s + Math.min(c.paid, c.expected), 0);
  const overdueLoans = funded.filter(l => l.status === "defaulted" || (l.dueDate < now && l.amountRepaid < l.totalRepayable));
  const factors = [
    { label: "Due contributions paid", points: expected ? Math.round(40 * received / expected) : 0, maximum: 40 },
    { label: "Contributions completed on time", points: due.length ? Math.round(30 * onTime.length / due.length) : 0, maximum: 30 },
    { label: "Loans without overdue balances", points: funded.length ? Math.round(30 * (funded.length - overdueLoans.length) / funded.length) : 0, maximum: 30 },
  ];
  const available = (due.length ? 70 : 0) + (funded.length ? 30 : 0);
  const sufficient = due.length >= 3;
  const score = sufficient && available ? Math.round(100 * factors.reduce((s, f) => s + f.points, 0) / available) : null;
  return { version: "1", score, band: score === null ? "Insufficient history" : score >= 80 ? "Strong history" : score >= 60 ? "Mixed history" : "Needs review", factors, dueContributions: due.length, recordedLoans: funded.length, overdueLoans: overdueLoans.length, overdueContributions: due.filter(c => c.paid < c.expected).length };
}
