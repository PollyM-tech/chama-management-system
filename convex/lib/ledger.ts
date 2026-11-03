import { ConvexError } from "convex/values";
import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

export const cents = (value: number) => Math.round(value * 100) / 100;
export async function postTransaction(
  ctx: MutationCtx,
  chamaId: Id<"chamas">,
  userId: Id<"users">,
  entry: {
    amount: number;
    direction: "credit" | "debit";
    type: Doc<"transactions">["type"];
    description: string;
    referenceId?: string;
    paymentMethod?: string;
    paymentReference?: string;
  },
) {
  if (
    !Number.isFinite(entry.amount) ||
    entry.amount <= 0 ||
    entry.amount > 100_000_000
  )
    throw new ConvexError("INVALID_AMOUNT");
  const amount = cents(entry.amount);
  if (amount <= 0) throw new ConvexError("INVALID_AMOUNT");
  if (entry.paymentReference) {
    const duplicate = await ctx.db
      .query("transactions")
      .withIndex("by_chama_reference", (q) =>
        q.eq("chamaId", chamaId).eq("paymentReference", entry.paymentReference),
      )
      .first();
    if (duplicate) throw new ConvexError("PAYMENT_REFERENCE_ALREADY_RECORDED");
  }
  const chama = await ctx.db.get(chamaId);
  if (!chama) throw new ConvexError("FORBIDDEN");
  const balance = cents(
    chama.totalPool + (entry.direction === "credit" ? amount : -amount),
  );
  if (balance < 0) throw new ConvexError("INSUFFICIENT_GROUP_FUNDS");
  await ctx.db.patch(chamaId, { totalPool: balance });
  return ctx.db.insert("transactions", {
    ...entry,
    amount,
    chamaId,
    balance,
    performedBy: userId,
    createdAt: Date.now(),
  });
}

export function addMonths(timestamp: number, months: number) {
  const date = new Date(timestamp);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const last = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return date.getTime();
}
