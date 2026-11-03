"use client";
import { useState, type ReactNode, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../../../convex/_generated/api";
import { useWorkspace } from "./workspace-shell";

export const money = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(value);
export const day = (value: number) =>
  new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeZone: "Africa/Nairobi",
  }).format(value);
export function humanError(error: unknown) {
  const message =
    error instanceof ConvexError
      ? String(error.data)
      : error instanceof Error
        ? error.message
        : "";
  const codes: Record<string, string> = {
    FORBIDDEN: "Your role does not allow this action.",
    INSUFFICIENT_GROUP_FUNDS: "The group has insufficient available funds.",
    PAYMENT_REFERENCE_ALREADY_RECORDED:
      "This payment reference has already been recorded.",
    PAYMENT_EXCEEDS_AMOUNT_DUE:
      "The payment exceeds the member’s remaining contribution.",
    REPAYMENT_EXCEEDS_BALANCE:
      "The repayment exceeds the remaining loan balance.",
    ANOTHER_CHAIRPERSON_MUST_REVIEW_YOUR_LOAN:
      "Another chairperson or administrator must review your own loan.",
    DIVIDENDS_EXCEED_REALIZED_PROFIT:
      "The payout exceeds the investment’s undistributed realized profit.",
    ALREADY_VOTED: "You have already voted in this poll.",
    POLL_CLOSED_OR_INVALID_CHOICE:
      "Voting has closed, or this choice is no longer available.",
    LAST_ADMIN_REQUIRED:
      "Keep at least one active chairperson or administrator.",
    REALIZE_INVESTMENT_FIRST:
      "Record the investment proceeds before recording a dividend payout.",
  };
  for (const [code, text] of Object.entries(codes))
    if (message.includes(code)) return text;
  return "Unable to save. Check the details and try again.";
}
export type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "date" | "textarea" | "select";
  options?: { value: string; label: string }[];
  value?: string | number;
  min?: number;
  max?: number;
  step?: string;
  optional?: boolean;
  full?: boolean;
  hint?: string;
};
export function FormPanel({
  title,
  description,
  operation,
  fields,
  button = "Save record",
}: {
  title: string;
  description?: string;
  operation: string;
  fields: Field[];
  button?: string;
}) {
  const { chama } = useWorkspace();
  const execute = useMutation(api.workspace.execute);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    error?: string;
    success?: string;
  }>({});
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const input: Record<string, string | number | boolean | string[]> = {};
    for (const f of fields) {
      const raw = String(data.get(f.name) ?? "").trim();
      if (f.optional && !raw && !operation.startsWith("update_")) continue;
      input[f.name] =
        f.type === "date"
          ? new Date(`${raw}T23:59:59+03:00`).getTime()
          : f.type === "number"
            ? Number(raw)
            : raw;
    }
    setBusy(true);
    setFeedback({});
    try {
      await execute({ chamaId: chama._id, operation, input });
      setFeedback({ success: "Saved successfully." });
      if (!operation.startsWith("update_")) form.reset();
    } catch (error) {
      setFeedback({ error: humanError(error) });
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="workspace-card workspace-no-print">
      <h2 className="workspace-section-heading">{title}</h2>
      {description && (
        <p className="workspace-page-description">{description}</p>
      )}
      <form className="workspace-form" onSubmit={submit}>
        {fields.map((f) => (
          <label
            className={`workspace-field ${f.full ? "full" : ""}`}
            key={f.name}
          >
            {f.label}
            {f.type === "select" ? (
              <select
                name={f.name}
                required={!f.optional}
                defaultValue={f.value ?? ""}
              >
                <option value="" disabled>
                  Select…
                </option>
                {f.options?.map((o) => (
                  <option value={o.value} key={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                name={f.name}
                required={!f.optional}
                defaultValue={f.value}
                maxLength={5000}
              />
            ) : (
              <input
                name={f.name}
                type={f.type ?? "text"}
                required={!f.optional}
                defaultValue={f.value}
                min={f.min ?? (f.type === "number" ? 0.01 : undefined)}
                max={f.max}
                step={f.step ?? (f.type === "number" ? "0.01" : undefined)}
                maxLength={
                  f.type === "number" || f.type === "date" ? undefined : 500
                }
              />
            )}
            {f.hint && <small>{f.hint}</small>}
          </label>
        ))}
        <div className="workspace-form-footer">
          <button type="submit" disabled={busy} className="workspace-button">
            {busy ? "Saving…" : button}
          </button>
          {feedback.error && (
            <span role="alert" className="workspace-error">
              {feedback.error}
            </span>
          )}
          {feedback.success && (
            <span role="status" className="workspace-success">
              {feedback.success}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
export function ActionButton({
  operation,
  input,
  children,
  danger = false,
  disabled = false,
}: {
  operation: string;
  input: Record<string, string | number | boolean | string[]>;
  children: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}) {
  const { chama } = useWorkspace();
  const execute = useMutation(api.workspace.execute);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <span>
      <button
        type="button"
        disabled={disabled || busy}
        className={`workspace-button small ${danger ? "danger" : "secondary"}`}
        onClick={async () => {
          if (danger && !window.confirm("Confirm this change?")) return;
          setBusy(true);
          setError("");
          try {
            await execute({ chamaId: chama._id, operation, input });
          } catch (e) {
            setError(humanError(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Saving…" : children}
      </button>
      {error && (
        <span role="alert" className="workspace-error">
          {" "}
          {error}
        </span>
      )}
    </span>
  );
}
export function Table({
  headings,
  rows,
  empty = "No records yet.",
}: {
  headings: string[];
  rows: ReactNode[][];
  empty?: string;
}) {
  return rows.length ? (
    <div className="workspace-table-scroll">
      <table className="workspace-table">
        <thead>
          <tr>
            {headings.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p className="workspace-empty">{empty}</p>
  );
}
export function Badge({ value }: { value: string }) {
  return (
    <span
      className={`workspace-badge ${["pending", "pending_approval", "overdue", "defaulted"].includes(value) ? "warning" : ["rejected", "revoked"].includes(value) ? "error" : ""}`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}
export function Stats({
  items,
}: {
  items: { label: string; value: string; note?: string }[];
}) {
  return (
    <div className="workspace-stats">
      {items.map((item) => (
        <article className="workspace-stat" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {item.note && <small>{item.note}</small>}
        </article>
      ))}
    </div>
  );
}
export function CashFlowChart() {
  const { trend } = useWorkspace();
  const maximum = Math.max(1, ...trend.flatMap((m) => [m.income, m.outflow]));
  return (
    <section className="workspace-card">
      <h2 className="workspace-section-heading">Cash flow · Last six months</h2>
      <figure>
        <div
          className="workspace-chart"
          role="img"
          aria-label="Monthly money received and money paid out. Values are listed below each month."
        >
          {trend.map((m) => (
            <div className="workspace-chart-month" key={m.label}>
              <div className="workspace-chart-pair">
                <div
                  title={`Money in: ${money(m.income)}`}
                  className="workspace-chart-bar"
                  style={{ height: `${(m.income / maximum) * 100}%` }}
                />
                <div
                  title={`Money out: ${money(m.outflow)}`}
                  className="workspace-chart-bar outflow"
                  style={{ height: `${(m.outflow / maximum) * 100}%` }}
                />
              </div>
              <span>{m.label}</span>
              <small className="workspace-chart-values">
                {money(m.income)}
                <br />
                {money(m.outflow)}
              </small>
            </div>
          ))}
        </div>
        <figcaption className="workspace-chart-legend">
          <span>
            <i /> Money in
          </span>
          <span>
            <i className="outflow" /> Money out
          </span>
        </figcaption>
      </figure>
    </section>
  );
}
export const paymentFields: Field[] = [
  {
    name: "method",
    label: "Payment method",
    type: "select",
    options: [
      { value: "mpesa", label: "M-Pesa" },
      { value: "bank", label: "Bank transfer" },
      { value: "cash", label: "Cash" },
    ],
  },
  { name: "reference", label: "Receipt / reference", optional: true },
];
