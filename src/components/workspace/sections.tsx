"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { Download, Printer, ShieldCheck } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import {
  ADMIN_ROLES,
  FINANCE_ROLES,
  SECTION_LABELS,
  roleLabel,
  type WorkspaceSection,
} from "../../../shared/workspace";
import type { Id } from "../../../convex/_generated/dataModel";
import { useWorkspace } from "./workspace-shell";
import { createCsv, createWorkbook } from "@/lib/report-export";
import {
  ActionButton,
  Badge,
  CashFlowChart,
  day,
  FormPanel,
  humanError,
  money,
  paymentFields,
  Stats,
  Table,
} from "./widgets";
import { InvitationsPanel } from "./invitations-panel";

function useAccess() {
  const data = useWorkspace();
  return {
    ...data,
    canFinance: (FINANCE_ROLES as readonly string[]).includes(data.member.role),
    canAdmin: (ADMIN_ROLES as readonly string[]).includes(data.member.role),
  };
}
function RecentTransactions() {
  const { transactions } = useWorkspace();
  return (
    <Table
      headings={[
        "Date",
        "Activity",
        "Method",
        "Reference",
        "Amount",
        "Balance",
      ]}
      rows={transactions.map((t) => [
        day(t.createdAt),
        t.description,
        t.paymentMethod ?? "—",
        t.paymentReference ?? "—",
        `${t.direction === "credit" ? "+" : "−"}${money(t.amount)}`,
        money(t.balance),
      ])}
      empty="No financial transactions recorded yet."
    />
  );
}
function Polls() {
  const { polls, member } = useWorkspace();
  return (
    <div className="workspace-stack">
      {!polls.length && (
        <p className="workspace-empty">
          No group decisions have been opened yet.
        </p>
      )}
      {polls.map((poll) => {
        const total = poll.counts.reduce((a, b) => a + b, 0);
        const closed = poll.closed;
        return (
          <article className="workspace-poll" key={poll._id}>
            <h3>{poll.question}</h3>
            <p>
              {closed ? "Voting closed" : "Voting ends"} · {day(poll.endsAt)} ·{" "}
              {total} votes
              {poll.myVote !== null ? " · Your vote is recorded" : ""}
            </p>
            {poll.options.map((option, index) => (
              <div key={option} className="workspace-poll-option">
                <div>
                  <span>
                    {option} · {poll.counts[index]} votes
                  </span>
                  {!closed && poll.myVote === null && member.isActive && (
                    <ActionButton
                      operation="vote"
                      input={{ id: poll._id, choice: index }}
                    >
                      Vote
                    </ActionButton>
                  )}
                </div>
                <div className="workspace-progress">
                  <span
                    style={{
                      width: `${total ? (poll.counts[index] / total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </article>
        );
      })}
    </div>
  );
}

function Overview() {
  const { chama, stats, transactions, notifications } = useWorkspace();
  return (
    <>
      <div className="workspace-balance">
        <span>Total available group balance</span>
        <strong>{money(chama.totalPool)}</strong>
        <p>Every posted payment is reflected in the transaction ledger.</p>
      </div>
      <Stats
        items={[
          { label: "Recorded contributions", value: money(stats.collected) },
          { label: "Active members", value: String(stats.members) },
          { label: "Outstanding loans", value: money(stats.outstanding) },
          { label: "Contribution arrears", value: money(stats.arrears) },
        ]}
      />
      <div className="workspace-grid">
        <CashFlowChart />
        <section className="workspace-card">
          <h2 className="workspace-section-heading">Alerts & reminders</h2>
          <p className="workspace-page-description">
            {stats.arrears > 0
              ? `${money(stats.arrears)} in outstanding contributions.`
              : "No outstanding contributions."}
          </p>
          <p className="workspace-page-description">
            {notifications.filter((n) => !n.isRead).length} unread notifications
          </p>
          <p className="workspace-page-description">
            Contribution collection rate: {stats.collectionRate}%
          </p>
          <div className="workspace-progress">
            <span style={{ width: `${stats.collectionRate}%` }} />
          </div>
        </section>
      </div>
      <section className="workspace-card workspace-stack">
        <h2 className="workspace-section-heading">Recent activity</h2>
        <Table
          headings={["Date", "Description", "Amount"]}
          rows={transactions
            .slice(0, 6)
            .map((t) => [
              day(t.createdAt),
              t.description,
              `${t.direction === "credit" ? "+" : "−"}${money(t.amount)}`,
            ])}
        />
      </section>
      <section className="workspace-stack">
        <h2 className="workspace-section-heading">Group decisions</h2>
        <Polls />
      </section>
    </>
  );
}

function MemberControls({
  id,
  role,
  active,
}: {
  id: Id<"members">;
  role: string;
  active: boolean;
}) {
  const update = useMutation(api.members.updateAccess);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(nextRole: string, nextActive: boolean) {
    setBusy(true);
    setError("");
    try {
      await update({
        memberId: id,
        role: nextRole as
          | "admin"
          | "chairperson"
          | "treasurer"
          | "secretary"
          | "member",
        isActive: nextActive,
      });
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="workspace-actions">
        <select
          aria-label="Member role"
          disabled={busy}
          value={role}
          onChange={(e) => void save(e.target.value, active)}
        >
          {["admin", "chairperson", "treasurer", "secretary", "member"].map(
            (r) => (
              <option value={r} key={r}>
                {roleLabel(r)}
              </option>
            ),
          )}
        </select>
        <button
          disabled={busy}
          className="workspace-button secondary small"
          onClick={() => {
            if (
              window.confirm(
                `${active ? "Deactivate" : "Reactivate"} this membership?`,
              )
            )
              void save(role, !active);
          }}
        >
          {active ? "Deactivate" : "Reactivate"}
        </button>
      </div>
      {error && (
        <p role="alert" className="workspace-error">
          {error}
        </p>
      )}
    </>
  );
}
function Members() {
  const { members, canAdmin, officer } = useAccess();
  return (
    <>
      <section className="workspace-card">
        <h2 className="workspace-section-heading">Member directory</h2>
        <Table
          headings={[
            "Member",
            "Contact",
            "Role",
            "Status",
            "Joined",
            ...(canAdmin ? ["Manage access"] : []),
          ]}
          rows={members.map((m) => [
            m.name,
            m.email || "Private",
            roleLabel(m.role),
            <Badge key="status" value={m.isActive ? "active" : "inactive"} />,
            day(m.joinedAt),
            ...(canAdmin
              ? [
                  <MemberControls
                    key={m._id}
                    id={m._id}
                    role={m.role}
                    active={m.isActive}
                  />,
                ]
              : []),
          ])}
        />
      </section>
      {officer && (
        <div className="workspace-stack">
          <FormPanel
            title="Update member contact details"
            operation="update_member"
            fields={[
              {
                name: "memberId",
                label: "Member",
                type: "select",
                options: members.map((m) => ({ value: m._id, label: m.name })),
              },
              { name: "name", label: "Display name" },
              { name: "phone", label: "Phone number", optional: true },
            ]}
          />
        </div>
      )}
      <InvitationsPanel />
    </>
  );
}

function Contributions() {
  const { contributions, cycles, members, chama, canFinance } = useAccess();
  return (
    <>
      <section className="workspace-card">
        <div className="workspace-block-title">
          <h2>Contribution records</h2>
          {canFinance && (
            <ActionButton operation="send_reminders" input={{}}>
              Send reminders
            </ActionButton>
          )}
        </div>
        <Table
          headings={[
            "Member",
            "Cycle",
            "Expected",
            "Paid",
            "Arrears",
            "Status",
            ...(canFinance ? ["Actions"] : []),
          ]}
          rows={contributions.map((c) => [
            c.memberName,
            c.cycleName,
            money(c.expected),
            money(c.paid),
            money(c.status === "waived" ? 0 : Math.max(0, c.expected - c.paid)),
            <Badge key="status" value={c.displayStatus} />,
            ...(canFinance
              ? [
                  <span key="actions" className="workspace-actions">
                    {!["paid", "waived"].includes(c.status) && (
                      <>
                        <ActionButton
                          operation="waive_contribution"
                          input={{ id: c._id }}
                          danger
                        >
                          Waive
                        </ActionButton>
                        <ActionButton
                          operation="apply_penalty"
                          input={{ id: c._id, amount: chama.lateFee ?? 0 }}
                          disabled={!chama.lateFee}
                        >
                          Apply late fee
                        </ActionButton>
                      </>
                    )}
                  </span>,
                ]
              : []),
          ])}
        />
      </section>
      {canFinance && (
        <div className="workspace-grid">
          <FormPanel
            title="Open contribution cycle"
            operation="create_cycle"
            button="Create cycle & notify members"
            fields={[
              { name: "name", label: "Cycle name" },
              {
                name: "amount",
                label: "Amount per member (KES)",
                type: "number",
                value: chama.contributionAmount,
              },
              { name: "dueDate", label: "Due date", type: "date" },
            ]}
          />
          <FormPanel
            title="Record a contribution"
            description="Record a payment already received through M-Pesa, bank, or cash."
            operation="record_contribution"
            fields={[
              {
                name: "memberId",
                label: "Member",
                type: "select",
                options: members
                  .filter((m) => m.isActive)
                  .map((m) => ({ value: m._id, label: m.name })),
              },
              {
                name: "cycleId",
                label: "Open cycle",
                type: "select",
                options: cycles
                  .filter((c) => c.status === "open")
                  .map((c) => ({ value: c._id, label: c.name })),
              },
              {
                name: "amount",
                label: "Amount received (KES)",
                type: "number",
              },
              ...paymentFields,
            ]}
          />
        </div>
      )}
      <section className="workspace-card workspace-stack">
        <h2 className="workspace-section-heading">Contribution cycles</h2>
        <Table
          headings={[
            "Cycle",
            "Amount",
            "Due",
            "Status",
            ...(canFinance ? ["Action"] : []),
          ]}
          rows={cycles.map((c) => [
            c.name,
            money(c.contributionAmount),
            day(c.dueDate),
            <Badge key="status" value={c.status} />,
            ...(canFinance
              ? [
                  c.status === "open" ? (
                    <ActionButton
                      key="close"
                      operation="close_cycle"
                      input={{ id: c._id }}
                      danger
                    >
                      Close cycle
                    </ActionButton>
                  ) : (
                    "—"
                  ),
                ]
              : []),
          ])}
        />
      </section>
    </>
  );
}

function Loans() {
  const { loans, chama, member, canAdmin, canFinance } = useAccess();
  const active = loans.filter((l) =>
    ["active", "disbursed", "defaulted"].includes(l.status),
  );
  return (
    <>
      <section className="workspace-card">
        <h2 className="workspace-section-heading">
          Loan applications & balances
        </h2>
        <Table
          headings={[
            "Member / purpose",
            "Principal",
            "Repayable",
            "Remaining",
            "Status",
            "Action",
          ]}
          rows={loans.map((l) => [
            <span key="purpose">
              {l.memberName}
              <br />
              <small>{l.purpose}</small>
            </span>,
            money(l.principalAmount),
            money(l.totalRepayable),
            money(l.remaining),
            <Badge key="status" value={l.status} />,
            <span key="actions" className="workspace-actions">
              {canAdmin &&
                l.status === "pending_approval" &&
                l.memberId !== member._id && (
                  <>
                    <ActionButton
                      operation="approve_loan"
                      input={{ id: l._id }}
                    >
                      Approve
                    </ActionButton>
                    <ActionButton
                      operation="reject_loan"
                      input={{
                        id: l._id,
                        reason:
                          "Please contact the chairperson for review details.",
                      }}
                      danger
                    >
                      Reject
                    </ActionButton>
                  </>
                )}
              {canAdmin &&
                l.status === "pending_approval" &&
                l.memberId === member._id && (
                  <span>Another administrator must review.</span>
                )}
              {canFinance && l.status === "approved" && (
                <ActionButton operation="disburse_loan" input={{ id: l._id }}>
                  Record disbursement
                </ActionButton>
              )}
            </span>,
          ])}
        />
      </section>
      <div className="workspace-grid">
        <FormPanel
          title="Apply for a loan"
          description={`Flat interest: ${chama.interestRate ?? 1}% per month. Total repayment is principal plus monthly interest for the full term.`}
          operation="apply_loan"
          button="Submit application"
          fields={[
            { name: "amount", label: "Principal (KES)", type: "number" },
            {
              name: "months",
              label: "Term (months)",
              type: "number",
              min: 1,
              max: 60,
              step: "1",
              value: chama.loanTermMonths ?? 3,
            },
            {
              name: "purpose",
              label: "Loan purpose",
              type: "textarea",
              full: true,
            },
          ]}
        />
        {canFinance && (
          <FormPanel
            title="Record loan repayment"
            operation="repay_loan"
            fields={[
              {
                name: "id",
                label: "Active loan",
                type: "select",
                options: active.map((l) => ({
                  value: l._id,
                  label: `${l.memberName} · ${l.purpose}`,
                })),
              },
              {
                name: "amount",
                label: "Amount received (KES)",
                type: "number",
              },
              ...paymentFields,
            ]}
          />
        )}
      </div>
      <section className="workspace-stack">
        <h2 className="workspace-section-heading">Repayment schedules</h2>
        {active.map((l) => (
          <details key={l._id} className="workspace-card">
            <summary>
              {l.memberName} · {l.purpose} · {money(l.remaining)} remaining
            </summary>
            <p className="workspace-notice">
              Scheduled instalments are planned amounts. Total recorded
              repayments: {money(l.amountRepaid)}.
            </p>
            <Table
              headings={["Instalment", "Due", "Scheduled amount"]}
              rows={l.schedule.map((row, i) => [
                i + 1,
                day(row.due),
                money(row.amount),
              ])}
            />
          </details>
        ))}
        {!active.length && (
          <p className="workspace-empty">No active repayment schedules.</p>
        )}
      </section>
    </>
  );
}

function Finance() {
  const { chama, expenses, reconciliations, stats, canFinance } = useAccess();
  return (
    <>
      <Stats
        items={[
          { label: "Available balance", value: money(chama.totalPool) },
          { label: "Contributions collected", value: money(stats.collected) },
          { label: "Recorded expenses", value: money(stats.expenses) },
          { label: "Active investments", value: money(stats.invested) },
        ]}
      />
      <div className="workspace-stack">
        <CashFlowChart />
      </div>
      {canFinance && (
        <div className="workspace-grid">
          <FormPanel
            title="Record an expense"
            operation="record_expense"
            fields={[
              { name: "description", label: "Description" },
              {
                name: "category",
                label: "Category",
                type: "select",
                options: ["Transport", "Bank fees", "Office", "Other"].map(
                  (value) => ({ value, label: value }),
                ),
              },
              { name: "amount", label: "Amount paid (KES)", type: "number" },
              ...paymentFields,
            ]}
          />
          <FormPanel
            title="Reconcile group balance"
            description={`Current ledger balance: ${money(chama.totalPool)}. Enter the combined balance verified across your accounts and cash. Differences are recorded for review; they do not change the ledger.`}
            operation="reconcile"
            fields={[
              {
                name: "amount",
                label: "Verified actual balance (KES)",
                type: "number",
                min: 0,
              },
              {
                name: "notes",
                label: "Reconciliation notes",
                type: "textarea",
                full: true,
              },
            ]}
          />
        </div>
      )}
      <div className="workspace-stack">
        <section className="workspace-card">
          <h2 className="workspace-section-heading">Expenses</h2>
          <Table
            headings={["Date", "Description", "Category", "Amount"]}
            rows={expenses.map((e) => [
              day(e.createdAt),
              e.description,
              e.category,
              money(e.amount),
            ])}
          />
        </section>
        {canFinance && (
          <section className="workspace-card">
            <h2 className="workspace-section-heading">
              Reconciliation history
            </h2>
            <Table
              headings={["Date", "Ledger", "Actual", "Difference", "Notes"]}
              rows={reconciliations.map((r) => [
                day(r.createdAt),
                money(r.ledgerBalance),
                money(r.actualBalance),
                money(r.difference),
                r.notes,
              ])}
            />
          </section>
        )}
      </div>
    </>
  );
}

function Investments() {
  const { investments, dividends, canAdmin, canFinance } = useAccess();
  return (
    <>
      <section className="workspace-card">
        <h2 className="workspace-section-heading">Investment portfolio</h2>
        <Table
          headings={[
            "Investment",
            "Type",
            "Principal",
            "Current value",
            "Profit / loss",
            "Status",
            ...(canFinance ? ["Action"] : []),
          ]}
          rows={investments.map((i) => [
            i.name,
            i.type.replaceAll("_", " "),
            money(i.principalAmount),
            money(i.currentValue),
            money(i.currentValue - i.principalAmount),
            <Badge key="status" value={i.status} />,
            ...(canFinance
              ? [
                  i.status === "active" ? (
                    <ActionButton
                      key="close"
                      operation="close_investment"
                      input={{ id: i._id }}
                      danger
                    >
                      Record proceeds & close
                    </ActionButton>
                  ) : (
                    "—"
                  ),
                ]
              : []),
          ])}
        />
      </section>
      <div className="workspace-grid">
        {canAdmin && (
          <FormPanel
            title="Record an approved investment"
            operation="add_investment"
            fields={[
              { name: "name", label: "Investment name" },
              {
                name: "type",
                label: "Type",
                type: "select",
                options: [
                  { value: "tbill", label: "Treasury bill" },
                  { value: "mmf", label: "Money market fund" },
                  { value: "sacco", label: "SACCO" },
                  { value: "real_estate", label: "Real estate" },
                  { value: "stocks", label: "Stocks" },
                  { value: "other", label: "Other" },
                ],
              },
              {
                name: "amount",
                label: "Principal invested (KES)",
                type: "number",
              },
              {
                name: "returnRate",
                label: "Expected annual return (%)",
                type: "number",
                min: 0,
              },
            ]}
          />
        )}{" "}
        {canFinance && (
          <FormPanel
            title="Update valuation"
            operation="value_investment"
            fields={[
              {
                name: "id",
                label: "Active investment",
                type: "select",
                options: investments
                  .filter((i) => i.status === "active")
                  .map((i) => ({ value: i._id, label: i.name })),
              },
              {
                name: "amount",
                label: "Current value (KES)",
                type: "number",
                min: 0,
              },
            ]}
          />
        )}
      </div>
      {canAdmin && (
        <div className="workspace-stack">
          <FormPanel
            title="Record dividend payout"
            description="Records a payout already made, split equally among active members. It reduces available cash and cannot exceed undistributed realized profit from a closed investment."
            operation="record_dividends"
            button="Record equal dividend payout"
            fields={[
              {
                name: "id",
                label: "Closed investment",
                type: "select",
                options: investments
                  .filter((i) => i.status === "withdrawn")
                  .map((i) => ({ value: i._id, label: i.name })),
              },
              {
                name: "amount",
                label: "Total dividend paid (KES)",
                type: "number",
              },
            ]}
          />
        </div>
      )}
      <section className="workspace-card workspace-stack">
        <h2 className="workspace-section-heading">Dividend records</h2>
        <Table
          headings={["Date", "Member", "Amount"]}
          rows={dividends.map((d) => [
            day(d.createdAt),
            d.memberName,
            money(d.amount),
          ])}
        />
      </section>
    </>
  );
}

function Analytics() {
  const { stats, investments, contributions } = useWorkspace();
  const principal = investments.reduce((s, i) => s + i.principalAmount, 0);
  const value = investments.reduce((s, i) => s + i.currentValue, 0);
  return (
    <>
      <Stats
        items={[
          { label: "Collection rate", value: `${stats.collectionRate}%` },
          { label: "Contribution arrears", value: money(stats.arrears) },
          { label: "Loan exposure", value: money(stats.outstanding) },
          {
            label: "Portfolio return",
            value: principal
              ? `${(((value - principal) / principal) * 100).toFixed(1)}%`
              : "0%",
          },
        ]}
      />
      <div className="workspace-stack">
        <CashFlowChart />
        <section className="workspace-card">
          <h2 className="workspace-section-heading">
            Contribution performance
          </h2>
          <Table
            headings={["Member", "Cycle", "Expected", "Received", "Completion"]}
            rows={contributions.map((c) => [
              c.memberName,
              c.cycleName,
              money(c.expected),
              money(c.paid),
              c.status === "waived"
                ? "Waived"
                : `${c.expected ? Math.min(100, Math.round((c.paid / c.expected) * 100)) : 0}%`,
            ])}
          />
        </section>
      </div>
    </>
  );
}

function Reports() {
  const { chama, transactions, contributions, loans, officer, member } =
    useWorkspace();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const start = from ? new Date(`${from}T00:00:00+03:00`).getTime() : 0;
  const end = to ? new Date(`${to}T23:59:59+03:00`).getTime() : Infinity;
  const records = transactions.filter(
    (t) => t.createdAt >= start && t.createdAt <= end,
  );
  const payments = contributions.filter(
    (c) =>
      (c.paidAt ?? c._creationTime) >= start &&
      (c.paidAt ?? c._creationTime) <= end,
  );
  function exportReport(format: "csv" | "xlsx") {
    const rows: (string | number)[][] = officer
      ? [
          [
            "Date",
            "Description",
            "Direction",
            "Method",
            "Reference",
            "Amount KES",
            "Balance KES",
          ],
          ...records.map((t) => [
            day(t.createdAt),
            t.description,
            t.direction,
            t.paymentMethod ?? "",
            t.paymentReference ?? "",
            t.amount,
            t.balance,
          ]),
        ]
      : [
          ["Member", "Cycle", "Expected KES", "Paid KES", "Status"],
          ...payments.map((c) => [
            c.memberName,
            c.cycleName,
            c.expected,
            c.paid,
            c.displayStatus,
          ]),
        ];
    const blob =
      format === "xlsx"
        ? new Blob([createWorkbook(rows)], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          })
        : new Blob([createCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smartchama-statement.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <div className="workspace-report-tools">
        <label className="workspace-field">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="workspace-field">
          To
          <input
            type="date"
            min={from}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button
          className="workspace-button"
          onClick={() => exportReport("xlsx")}
        >
          <Download size={14} /> Export Excel (.xlsx)
        </button>
        <button
          className="workspace-button secondary"
          onClick={() => exportReport("csv")}
        >
          Export CSV
        </button>
        <button
          className="workspace-button secondary"
          onClick={() => window.print()}
        >
          <Printer size={14} />
          Print / save as PDF
        </button>
      </div>
      <div className="workspace-report-heading">
        {chama.name} ·{" "}
        {officer
          ? "Group financial statement"
          : `${member.name} · Member statement`}
      </div>
      <p className="workspace-notice">
        {officer
          ? "Group statement with a running ledger balance. Export an Excel workbook or CSV file. Select Save as PDF in your browser’s print dialog."
          : "Your personal contribution and loan statement. Other members’ financial records are not included."}
      </p>
      <section className="workspace-card workspace-stack">
        <h2 className="workspace-section-heading">
          {officer ? "Financial statement" : "My contribution statement"}
        </h2>
        {officer ? (
          <Table
            headings={["Date", "Description", "Direction", "Amount", "Balance"]}
            rows={records.map((t) => [
              day(t.createdAt),
              t.description,
              t.direction,
              money(t.amount),
              money(t.balance),
            ])}
          />
        ) : (
          <Table
            headings={["Cycle", "Expected", "Paid", "Status"]}
            rows={payments.map((c) => [
              c.cycleName,
              money(c.expected),
              money(c.paid),
              <Badge key="status" value={c.displayStatus} />,
            ])}
          />
        )}
      </section>
      <section className="workspace-card workspace-stack">
        <h2 className="workspace-section-heading">Loan statement</h2>
        <Table
          headings={[
            "Borrower",
            "Principal",
            "Interest / month",
            "Total repayable",
            "Repaid",
            "Remaining",
          ]}
          rows={loans.map((l) => [
            l.memberName,
            money(l.principalAmount),
            `${l.interestRate}%`,
            money(l.totalRepayable),
            money(l.amountRepaid),
            money(l.remaining),
          ])}
        />
      </section>
    </>
  );
}

function Admin() {
  const { canAdmin, officer, member, audit } = useAccess();
  return (
    <>
      {!officer && (
        <p className="workspace-notice">
          Administration is restricted to group officers. You can participate in
          group decisions below.
        </p>
      )}
      {["admin", "chairperson", "secretary"].includes(member.role) && (
        <FormPanel
          title="Create a group vote"
          operation="create_poll"
          button="Open voting"
          fields={[
            { name: "question", label: "Question", full: true },
            {
              name: "options",
              label: "Options (one per line)",
              type: "textarea",
              full: true,
            },
            { name: "endsAt", label: "Voting closes", type: "date" },
          ]}
        />
      )}
      <Polls />
      {canAdmin && (
        <section className="workspace-card workspace-stack">
          <h2 className="workspace-section-heading">Officer audit history</h2>
          <Table
            headings={["Date", "Officer", "Action"]}
            rows={audit.map((e) => [day(e.createdAt), e.actorName, e.action])}
          />
        </section>
      )}
      {officer && <InvitationsPanel />}
    </>
  );
}
function Notifications() {
  const { notifications, officer } = useWorkspace();
  return (
    <>
      <section className="workspace-card">
        <h2 className="workspace-section-heading">Your notifications</h2>
        {!notifications.length && (
          <p className="workspace-empty">You’re all caught up.</p>
        )}
        {notifications.map((n) => (
          <article className="workspace-notification" key={n._id}>
            <ShieldCheck
              size={17}
              className={n.isRead ? "text-zinc-300" : "text-emerald-700"}
            />
            <div>
              <strong>{n.title}</strong>
              <p>{n.message}</p>
              <small>{day(n.createdAt)}</small>
            </div>
            {!n.isRead && (
              <ActionButton operation="mark_read" input={{ id: n._id }}>
                Mark read
              </ActionButton>
            )}
          </article>
        ))}
      </section>
      {officer && (
        <div className="workspace-stack">
          <FormPanel
            title="Group announcement"
            operation="announcement"
            button="Notify all active members"
            fields={[
              { name: "title", label: "Title", full: true },
              {
                name: "message",
                label: "Announcement",
                type: "textarea",
                full: true,
              },
            ]}
          />
        </div>
      )}
    </>
  );
}
function Settings() {
  const { chama, member, canAdmin } = useAccess();
  return (
    <div className="workspace-stack">
      <FormPanel
        title="Your profile"
        operation="update_profile"
        fields={[
          { name: "name", label: "Full name", value: member.name },
          {
            name: "phone",
            label: "Phone number",
            optional: true,
            value: member.phone,
          },
        ]}
      />
      {canAdmin ? (
        <FormPanel
          title="Chama rules & settings"
          description="Changes to the contribution amount apply to new cycles. Existing cycles and loan agreements retain their recorded amounts and rates."
          operation="update_settings"
          fields={[
            { name: "name", label: "Group name", value: chama.name },
            {
              name: "amount",
              label: "Contribution amount (KES)",
              type: "number",
              value: chama.contributionAmount,
            },
            {
              name: "cycle",
              label: "Contribution cycle",
              type: "select",
              value: chama.contributionCycle,
              options: ["weekly", "monthly", "quarterly"].map((value) => ({
                value,
                label: value,
              })),
            },
            {
              name: "interestRate",
              label: "Loan interest per month (%)",
              type: "number",
              min: 0,
              max: 100,
              value: chama.interestRate ?? 1,
            },
            {
              name: "lateFee",
              label: "Late contribution fee (KES)",
              type: "number",
              min: 0,
              value: chama.lateFee ?? 0,
            },
            {
              name: "loanTermMonths",
              label: "Default loan term (months)",
              type: "number",
              min: 1,
              max: 60,
              step: "1",
              value: chama.loanTermMonths ?? 3,
            },
            {
              name: "rules",
              label: "Group rules",
              type: "textarea",
              optional: true,
              full: true,
              value: chama.rules ?? "",
            },
          ]}
        />
      ) : (
        <section className="workspace-card">
          <h2 className="workspace-section-heading">Your chama’s rules</h2>
          <p className="workspace-page-description">
            {chama.rules || "Your chairperson has not added group rules yet."}
          </p>
        </section>
      )}
    </div>
  );
}

const descriptions: Record<WorkspaceSection, string> = {
  dashboard:
    "Your group’s financial position, activity, and decisions in one place.",
  members: "Manage profiles, membership access, and invitations.",
  contributions:
    "Track cycles, received payments, arrears, and contribution obligations.",
  loans:
    "Apply, review, disburse, and record repayments with a clear audit trail.",
  finance: "Monitor money in, money out, expenses, and reconciliation.",
  reports: "Group financial statements and personal member statements.",
  transactions:
    "Recorded M-Pesa, bank, and cash activity. Recording a payment does not initiate a transfer.",
  investments:
    "Portfolio valuations, realized proceeds, and recorded dividend payouts.",
  analytics:
    "Understand cash flow, collection performance, loan exposure, and portfolio returns.",
  admin: "Group decisions, officer permissions, and administrative history.",
  notifications: "Contribution reminders, loan updates, and announcements.",
  settings:
    "Your profile, contribution rules, loan rates, and group preferences.",
};
export function WorkspaceSectionView({
  section,
}: {
  section: WorkspaceSection;
}) {
  const data = useWorkspace();
  const views = {
    dashboard: <Overview />,
    members: <Members />,
    contributions: <Contributions />,
    loans: <Loans />,
    finance: <Finance />,
    reports: <Reports />,
    transactions: (
      <section className="workspace-card">
        <RecentTransactions />
      </section>
    ),
    investments: <Investments />,
    analytics: <Analytics />,
    admin: <Admin />,
    notifications: <Notifications />,
    settings: <Settings />,
  };
  return (
    <section>
      <h1 className="workspace-page-title">
        {section === "dashboard" ? data.chama.name : SECTION_LABELS[section]}
      </h1>
      <p className="workspace-page-description">{descriptions[section]}</p>
      {views[section]}
    </section>
  );
}
