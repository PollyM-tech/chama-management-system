import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { z } from "zod";
import { requireMembership } from "./lib/auth";
import { ADMIN_ROLES, FINANCE_ROLES, OFFICERS } from "../shared/workspace";
import { addMonths, cents, postTransaction } from "./lib/ledger";
import type { TableNames, Doc } from "./_generated/dataModel";

const amount = z.coerce
  .number()
  .finite()
  .min(0.01)
  .max(100_000_000)
  .transform(cents);
const text = z.string().trim().min(1).max(500);
const date = z.coerce.number().finite().positive();
const method = z.enum(["mpesa", "bank", "cash"]);

export const get = query({
  args: { chamaId: v.string() },
  handler: async (ctx, args) => {
    const chamaId = ctx.db.normalizeId("chamas", args.chamaId);
    if (!chamaId) throw new ConvexError("FORBIDDEN");
    const { chama, member } = await requireMembership(ctx, chamaId);
    const officer = (OFFICERS as readonly string[]).includes(member.role);
    const [
      members,
      cycles,
      contributions,
      payments,
      loans,
      transactions,
      investments,
      expenses,
      dividends,
      polls,
      reconciliations,
      invitations,
      audit,
    ] = await Promise.all([
      ctx.db
        .query("members")
        .withIndex("by_chama", (q) => q.eq("chamaId", chamaId))
        .collect(),
      ctx.db
        .query("cycles")
        .withIndex("by_chama", (q) => q.eq("chamaId", chamaId))
        .collect(),
      ctx.db
        .query("contributions")
        .withIndex("by_chama", (q) => q.eq("chamaId", chamaId))
        .collect(),
      ctx.db
        .query("contributionPayments")
        .withIndex("by_chama", (q) => q.eq("chamaId", chamaId))
        .collect(),
      ctx.db
        .query("loans")
        .withIndex("by_chama", (q) => q.eq("chamaId", chamaId))
        .collect(),
      ctx.db
        .query("transactions")
        .withIndex("by_chama_date", (q) => q.eq("chamaId", chamaId))
        .order("desc")
        .collect(),
      ctx.db
        .query("investments")
        .withIndex("by_chama", (q) => q.eq("chamaId", chamaId))
        .collect(),
      ctx.db
        .query("expenses")
        .withIndex("by_chama", (q) => q.eq("chamaId", chamaId))
        .collect(),
      ctx.db
        .query("dividends")
        .withIndex("by_chama", (q) => q.eq("chamaId", chamaId))
        .collect(),
      ctx.db
        .query("polls")
        .withIndex("by_chama", (q) => q.eq("chamaId", chamaId))
        .collect(),
      ctx.db
        .query("reconciliations")
        .withIndex("by_chama", (q) => q.eq("chamaId", chamaId))
        .collect(),
      officer
        ? ctx.db
            .query("invitations")
            .withIndex("by_chama", (q) => q.eq("chamaId", chamaId))
            .collect()
        : [],
      officer
        ? ctx.db
            .query("auditEvents")
            .withIndex("by_chama", (q) => q.eq("chamaId", chamaId))
            .order("desc")
            .take(100)
        : [],
    ]);
    const names = new Map(members.map((m) => [m._id, m.name]));
    const cycleNames = new Map(cycles.map((c) => [c._id, c.name]));
    const collected = cents(
      payments.reduce((n, p) => n + p.amount, 0) +
        contributions
          .filter(
            (c) =>
              c.status === "paid" &&
              !payments.some(
                (p) => p.memberId === c.memberId && p.cycleId === c.cycleId,
              ),
          )
          .reduce((n, c) => n + c.amount, 0),
    );
    const enrichedContributions = contributions.map((c) => ({
      ...c,
      memberName: names.get(c.memberId) ?? "Member",
      cycleName: cycleNames.get(c.cycleId) ?? "Cycle",
      expected:
        c.expectedAmount ??
        cycles.find((cy) => cy._id === c.cycleId)?.contributionAmount ??
        c.amount,
      paid:
        c.expectedAmount !== undefined || c.status === "paid" ? c.amount : 0,
      displayStatus:
        c.status === "pending" && c.dueDate < Date.now() ? "overdue" : c.status,
    }));
    const collectible = enrichedContributions.filter(
      (c) => c.status !== "waived",
    );
    const totalExpected = collectible.reduce((sum, c) => sum + c.expected, 0);
    const totalReceived = collectible.reduce(
      (sum, c) => sum + Math.min(c.paid, c.expected),
      0,
    );
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_member", (q) => q.eq("memberId", member._id))
      .order("desc")
      .take(100);
    const pollData = await Promise.all(
      polls.map(async (poll) => {
        const votes = await ctx.db
          .query("votes")
          .withIndex("by_poll", (q) => q.eq("pollId", poll._id))
          .collect();
        return {
          ...poll,
          closed: poll.endsAt <= Date.now(),
          counts: poll.options.map(
            (_, i) => votes.filter((vote) => vote.choice === i).length,
          ),
          myVote:
            votes.find((vote) => vote.memberId === member._id)?.choice ?? null,
        };
      }),
    );
    const trend = Array.from({ length: 6 }, (_, i) => {
      const now = new Date(Date.now() + 3 * 3600000);
      const start =
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + i, 1) -
        3 * 3600000;
      const end =
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 4 + i, 1) -
        3 * 3600000;
      const items = transactions.filter(
        (t) => t.createdAt >= start && t.createdAt < end,
      );
      return {
        label: new Intl.DateTimeFormat("en-KE", {
          month: "short",
          timeZone: "Africa/Nairobi",
        }).format(start + 3 * 3600000),
        income: cents(
          items
            .filter((t) => t.direction === "credit")
            .reduce((s, t) => s + t.amount, 0),
        ),
        outflow: cents(
          items
            .filter((t) => t.direction === "debit")
            .reduce((s, t) => s + t.amount, 0),
        ),
      };
    });
    return {
      chama,
      member,
      officer,
      members: members.map((m) => ({
        _id: m._id,
        name: m.name,
        role: m.role,
        isActive: m.isActive,
        joinedAt: m.joinedAt,
        email: officer || m._id === member._id ? m.email : "",
        phone: officer || m._id === member._id ? m.phone : "",
      })),
      cycles,
      contributions: enrichedContributions.filter(
        (c) => officer || c.memberId === member._id,
      ),
      loans: loans
        .filter((l) => officer || l.memberId === member._id)
        .map((l) => ({
          ...l,
          memberName: names.get(l.memberId) ?? "Member",
          remaining: cents(l.totalRepayable - l.amountRepaid),
          schedule: Array.from({ length: l.termMonths ?? 1 }, (_, i) => ({
            due: addMonths(l.disbursedAt ?? l._creationTime, i + 1),
            amount:
              i === (l.termMonths ?? 1) - 1
                ? cents(
                    l.totalRepayable -
                      cents(l.totalRepayable / (l.termMonths ?? 1)) * i,
                  )
                : cents(l.totalRepayable / (l.termMonths ?? 1)),
          })),
        })),
      transactions: transactions.map((t) => ({
        ...t,
        performedBy: officer ? t.performedBy : "",
      })),
      investments,
      expenses,
      dividends: dividends
        .filter((d) => officer || d.memberId === member._id)
        .map((d) => ({ ...d, memberName: names.get(d.memberId) ?? "Member" })),
      polls: pollData,
      reconciliations: officer ? reconciliations : [],
      invitations: invitations.map((invite) => ({
        _id: invite._id,
        email: invite.email,
        phone: invite.phone,
        role: invite.role ?? "member",
        channel: invite.channel,
        status: invite.status,
        expiresAt: invite.expiresAt,
        expired: invite.expiresAt < Date.now(),
      })),
      audit,
      notifications,
      trend,
      stats: {
        collected,
        members: members.filter((m) => m.isActive).length,
        arrears: cents(
          enrichedContributions
            .filter((c) => c.status !== "waived")
            .reduce((s, c) => s + Math.max(0, c.expected - c.paid), 0),
        ),
        outstanding: cents(
          loans
            .filter((l) =>
              ["active", "disbursed", "defaulted"].includes(l.status),
            )
            .reduce((s, l) => s + l.totalRepayable - l.amountRepaid, 0),
        ),
        invested: cents(
          investments
            .filter((i) => i.status === "active")
            .reduce((s, i) => s + i.currentValue, 0),
        ),
        expenses: cents(expenses.reduce((s, e) => s + e.amount, 0)),
        collectionRate: totalExpected
          ? Math.round((totalReceived / totalExpected) * 100)
          : 0,
      },
    };
  },
});

export const execute = mutation({
  args: {
    chamaId: v.id("chamas"),
    operation: v.string(),
    input: v.record(
      v.string(),
      v.union(v.string(), v.number(), v.boolean(), v.array(v.string())),
    ),
  },
  handler: async (ctx, { chamaId, operation, input }) => {
    const { user, member, chama } = await requireMembership(ctx, chamaId);
    const check = (roles: readonly string[]) => {
      if (!roles.includes(member.role)) throw new ConvexError("FORBIDDEN");
    };
    const scoped = async <T extends TableNames>(table: T, raw: string) => {
      const id = ctx.db.normalizeId(table, raw);
      if (!id) throw new ConvexError("INVALID_RECORD");
      const record = await ctx.db.get(id);
      if (!record || !("chamaId" in record) || record.chamaId !== chamaId)
        throw new ConvexError("FORBIDDEN");
      return record as Doc<T>;
    };
    const notify = async (
      memberId: typeof member._id,
      title: string,
      message: string,
      type: Doc<"notifications">["type"] = "general",
    ) =>
      ctx.db.insert("notifications", {
        chamaId,
        memberId,
        title,
        message,
        type,
        isRead: false,
        createdAt: Date.now(),
      });
    const audit = async () =>
      ctx.db.insert("auditEvents", {
        chamaId,
        actorId: user._id,
        actorName: member.name,
        action: operation.replaceAll("_", " "),
        createdAt: Date.now(),
      });
    if (operation === "create_cycle") {
      check(FINANCE_ROLES);
      const a = z.object({ name: text, amount, dueDate: date }).parse(input);
      if (a.dueDate <= Date.now())
        throw new ConvexError("DUE_DATE_MUST_BE_IN_FUTURE");
      const cycleId = await ctx.db.insert("cycles", {
        chamaId,
        name: a.name,
        contributionAmount: a.amount,
        startDate: Date.now(),
        dueDate: a.dueDate,
        status: "open",
      });
      const members = await ctx.db
        .query("members")
        .withIndex("by_chama", (q) => q.eq("chamaId", chamaId))
        .collect();
      for (const m of members.filter((m) => m.isActive)) {
        await ctx.db.insert("contributions", {
          chamaId,
          cycleId,
          memberId: m._id,
          amount: 0,
          expectedAmount: a.amount,
          dueDate: a.dueDate,
          status: "pending",
          recordedBy: user._id,
        });
        await notify(
          m._id,
          "Contribution cycle opened",
          `${a.name}: KES ${a.amount} is due.`,
          "contribution_due",
        );
      }
    } else if (operation === "record_contribution") {
      check(FINANCE_ROLES);
      const a = z
        .object({
          memberId: text,
          cycleId: text,
          amount,
          method,
          reference: z.string().trim().max(100).optional(),
        })
        .parse(input);
      const target = await scoped("members", a.memberId);
      const cycle = await scoped("cycles", a.cycleId);
      if (!target.isActive || cycle.status !== "open")
        throw new ConvexError("CYCLE_OR_MEMBER_INACTIVE");
      const previous = await ctx.db
        .query("contributions")
        .withIndex("by_member_cycle", (q) =>
          q.eq("memberId", target._id).eq("cycleId", cycle._id),
        )
        .unique();
      const paid =
        previous?.expectedAmount !== undefined || previous?.status === "paid"
          ? previous.amount
          : 0;
      const expected = previous?.expectedAmount ?? cycle.contributionAmount;
      if (previous?.status === "waived" || a.amount > cents(expected - paid))
        throw new ConvexError("PAYMENT_EXCEEDS_AMOUNT_DUE");
      const paymentId = await ctx.db.insert("contributionPayments", {
        chamaId,
        memberId: target._id,
        cycleId: cycle._id,
        amount: a.amount,
        paymentMethod: a.method,
        reference: a.reference || undefined,
        recordedBy: user._id,
        createdAt: Date.now(),
      });
      await postTransaction(ctx, chamaId, user._id, {
        amount: a.amount,
        direction: "credit",
        type: "contribution",
        description: `${target.name} · ${cycle.name}`,
        referenceId: paymentId,
        paymentMethod: a.method,
        paymentReference: a.reference || undefined,
      });
      const patch = {
        amount: cents(paid + a.amount),
        expectedAmount: expected,
        paidAt: Date.now(),
        status:
          cents(paid + a.amount) >= expected
            ? ("paid" as const)
            : ("pending" as const),
        paymentMethod: a.method,
        recordedBy: user._id,
      };
      if (previous) await ctx.db.patch(previous._id, patch);
      else
        await ctx.db.insert("contributions", {
          ...patch,
          chamaId,
          memberId: target._id,
          cycleId: cycle._id,
          dueDate: cycle.dueDate,
        });
      await notify(
        target._id,
        "Contribution recorded",
        `KES ${a.amount} recorded for ${cycle.name}.`,
      );
    } else if (operation === "close_cycle") {
      check(FINANCE_ROLES);
      const a = z.object({ id: text }).parse(input);
      const cycle = await scoped("cycles", a.id);
      await ctx.db.patch(cycle._id, { status: "closed" });
    } else if (
      operation === "waive_contribution" ||
      operation === "apply_penalty"
    ) {
      check(FINANCE_ROLES);
      const a = z.object({ id: text, amount: amount.optional() }).parse(input);
      const c = await scoped("contributions", a.id);
      if (c.status === "paid" || c.status === "waived")
        throw new ConvexError("CONTRIBUTION_ALREADY_SETTLED");
      if (operation === "waive_contribution")
        await ctx.db.patch(c._id, { status: "waived" });
      else {
        const cycle = await ctx.db.get(c.cycleId);
        await ctx.db.patch(c._id, {
          expectedAmount: cents(
            (c.expectedAmount ?? cycle!.contributionAmount) +
              (a.amount ?? chama.lateFee ?? 0),
          ),
        });
      }
    } else if (operation === "apply_loan") {
      const a = z
        .object({
          amount,
          purpose: text,
          months: z.coerce.number().int().min(1).max(60),
        })
        .parse(input);
      const rate = chama.interestRate ?? 1;
      const total = cents(a.amount * (1 + (rate * a.months) / 100));
      await ctx.db.insert("loans", {
        chamaId,
        memberId: member._id,
        principalAmount: a.amount,
        interestRate: rate,
        totalRepayable: total,
        amountRepaid: 0,
        dueDate: addMonths(Date.now(), a.months),
        purpose: a.purpose,
        status: "pending_approval",
        termMonths: a.months,
      });
    } else if (
      ["approve_loan", "reject_loan", "disburse_loan", "repay_loan"].includes(
        operation,
      )
    ) {
      check(
        operation === "approve_loan" || operation === "reject_loan"
          ? ADMIN_ROLES
          : FINANCE_ROLES,
      );
      const a = z
        .object({
          id: text,
          amount: amount.optional(),
          method: method.optional(),
          reference: z.string().trim().max(100).optional(),
          reason: z.string().trim().max(500).optional(),
        })
        .parse(input);
      const loan = await scoped("loans", a.id);
      if (operation === "approve_loan" || operation === "reject_loan") {
        if (loan.status !== "pending_approval")
          throw new ConvexError("LOAN_ALREADY_REVIEWED");
        if (loan.memberId === member._id)
          throw new ConvexError("ANOTHER_CHAIRPERSON_MUST_REVIEW_YOUR_LOAN");
        await ctx.db.patch(loan._id, {
          status: operation === "approve_loan" ? "approved" : "rejected",
          approvedBy: user._id,
          rejectedReason: a.reason,
        });
        await notify(
          loan.memberId,
          operation === "approve_loan" ? "Loan approved" : "Loan declined",
          operation === "approve_loan"
            ? "Your loan is approved and awaiting disbursement."
            : (a.reason ?? "Contact your chairperson for details."),
          "loan_approved",
        );
      } else if (operation === "disburse_loan") {
        if (loan.status !== "approved")
          throw new ConvexError("LOAN_NOT_APPROVED");
        await postTransaction(ctx, chamaId, user._id, {
          amount: loan.principalAmount,
          direction: "debit",
          type: "loan_disbursement",
          description: `Loan disbursement · ${loan.purpose}`,
          referenceId: loan._id,
          paymentMethod: a.method ?? "bank",
          paymentReference: a.reference || undefined,
        });
        await ctx.db.patch(loan._id, {
          status: "active",
          disbursedAt: Date.now(),
          dueDate: addMonths(Date.now(), loan.termMonths ?? 1),
        });
      } else {
        if (
          !["active", "disbursed", "defaulted"].includes(loan.status) ||
          !a.amount
        )
          throw new ConvexError("LOAN_NOT_ACTIVE");
        if (a.amount > cents(loan.totalRepayable - loan.amountRepaid))
          throw new ConvexError("REPAYMENT_EXCEEDS_BALANCE");
        const id = await ctx.db.insert("loanRepayments", {
          loanId: loan._id,
          memberId: loan.memberId,
          amount: a.amount,
          paidAt: Date.now(),
          paymentMethod: a.method ?? "cash",
          mpesaTransactionId: a.reference,
          recordedBy: user._id,
        });
        await postTransaction(ctx, chamaId, user._id, {
          amount: a.amount,
          direction: "credit",
          type: "loan_repayment",
          description: `Loan repayment · ${loan.purpose}`,
          referenceId: id,
          paymentMethod: a.method ?? "cash",
          paymentReference: a.reference || undefined,
        });
        const repaid = cents(loan.amountRepaid + a.amount);
        await ctx.db.patch(loan._id, {
          amountRepaid: repaid,
          status: repaid >= loan.totalRepayable ? "repaid" : "active",
        });
      }
    } else if (operation === "record_expense") {
      check(FINANCE_ROLES);
      const a = z
        .object({
          amount,
          description: text,
          category: text,
          method,
          reference: z.string().trim().max(100).optional(),
        })
        .parse(input);
      const id = await ctx.db.insert("expenses", {
        chamaId,
        amount: a.amount,
        description: a.description,
        category: a.category,
        recordedBy: user._id,
        createdAt: Date.now(),
      });
      await postTransaction(ctx, chamaId, user._id, {
        amount: a.amount,
        direction: "debit",
        type: "withdrawal",
        description: `Expense: ${a.description}`,
        referenceId: id,
        paymentMethod: a.method,
        paymentReference: a.reference || undefined,
      });
    } else if (operation === "reconcile") {
      check(FINANCE_ROLES);
      const a = z
        .object({
          amount: z.coerce.number().finite().min(0).max(100_000_000),
          notes: text,
        })
        .parse(input);
      await ctx.db.insert("reconciliations", {
        chamaId,
        actualBalance: a.amount,
        ledgerBalance: chama.totalPool,
        difference: cents(a.amount - chama.totalPool),
        notes: a.notes,
        recordedBy: user._id,
        createdAt: Date.now(),
      });
    } else if (operation === "add_investment") {
      check(ADMIN_ROLES);
      const a = z
        .object({
          name: text,
          amount,
          type: z.enum([
            "tbill",
            "mmf",
            "sacco",
            "real_estate",
            "stocks",
            "other",
          ]),
          returnRate: z.coerce.number().min(0).max(1000),
        })
        .parse(input);
      const id = await ctx.db.insert("investments", {
        chamaId,
        name: a.name,
        type: a.type,
        principalAmount: a.amount,
        currentValue: a.amount,
        returnRate: a.returnRate,
        startDate: Date.now(),
        status: "active",
      });
      await postTransaction(ctx, chamaId, user._id, {
        amount: a.amount,
        direction: "debit",
        type: "investment",
        description: `Investment: ${a.name}`,
        referenceId: id,
      });
    } else if (
      operation === "value_investment" ||
      operation === "close_investment"
    ) {
      check(FINANCE_ROLES);
      const a = z
        .object({
          id: text,
          amount: z.coerce.number().finite().min(0).max(100_000_000).optional(),
        })
        .parse(input);
      const investment = await scoped("investments", a.id);
      if (investment.status !== "active")
        throw new ConvexError("INVESTMENT_ALREADY_CLOSED");
      if (operation === "value_investment") {
        if (a.amount === undefined) throw new ConvexError("VALUE_REQUIRED");
        await ctx.db.patch(investment._id, { currentValue: cents(a.amount) });
      } else {
        if (investment.currentValue > 0)
          await postTransaction(ctx, chamaId, user._id, {
            amount: investment.currentValue,
            direction: "credit",
            type: "interest_earned",
            description: `Investment proceeds: ${investment.name}`,
            referenceId: investment._id,
          });
        await ctx.db.patch(investment._id, { status: "withdrawn" });
      }
    } else if (operation === "record_dividends") {
      check(ADMIN_ROLES);
      const a = z.object({ id: text, amount }).parse(input);
      const investment = await scoped("investments", a.id);
      if (investment.status !== "withdrawn")
        throw new ConvexError("REALIZE_INVESTMENT_FIRST");
      const previous = await ctx.db
        .query("dividends")
        .withIndex("by_investment", (q) => q.eq("investmentId", investment._id))
        .collect();
      const profit = cents(
        investment.currentValue -
          investment.principalAmount -
          previous.reduce((s, d) => s + d.amount, 0),
      );
      if (a.amount > profit)
        throw new ConvexError("DIVIDENDS_EXCEED_REALIZED_PROFIT");
      const members = (
        await ctx.db
          .query("members")
          .withIndex("by_chama", (q) => q.eq("chamaId", chamaId))
          .collect()
      ).filter((m) => m.isActive);
      if (!members.length || Math.floor(a.amount * 100) < members.length)
        throw new ConvexError("DIVIDEND_TOO_SMALL");
      const each = Math.floor((a.amount * 100) / members.length);
      const remainder = Math.round(a.amount * 100) - each * members.length;
      for (let i = 0; i < members.length; i++)
        await ctx.db.insert("dividends", {
          chamaId,
          investmentId: investment._id,
          memberId: members[i]._id,
          amount: (each + (i < remainder ? 1 : 0)) / 100,
          recordedBy: user._id,
          createdAt: Date.now(),
        });
      await postTransaction(ctx, chamaId, user._id, {
        amount: a.amount,
        direction: "debit",
        type: "withdrawal",
        description: `Equal dividend payout: ${investment.name}`,
        referenceId: investment._id,
      });
    } else if (operation === "create_poll") {
      check(["admin", "chairperson", "secretary"]);
      const a = z
        .object({
          question: text,
          options: z
            .string()
            .transform((s) =>
              s
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            )
            .pipe(z.array(text).min(2).max(8)),
          endsAt: date,
        })
        .parse(input);
      if (
        new Set(a.options).size !== a.options.length ||
        a.endsAt <= Date.now()
      )
        throw new ConvexError("INVALID_POLL");
      await ctx.db.insert("polls", {
        ...a,
        chamaId,
        createdBy: user._id,
        createdAt: Date.now(),
      });
    } else if (operation === "vote") {
      const a = z
        .object({ id: text, choice: z.coerce.number().int().min(0) })
        .parse(input);
      const poll = await scoped("polls", a.id);
      if (poll.endsAt <= Date.now() || a.choice >= poll.options.length)
        throw new ConvexError("POLL_CLOSED_OR_INVALID_CHOICE");
      if (
        await ctx.db
          .query("votes")
          .withIndex("by_poll_member", (q) =>
            q.eq("pollId", poll._id).eq("memberId", member._id),
          )
          .first()
      )
        throw new ConvexError("ALREADY_VOTED");
      await ctx.db.insert("votes", {
        pollId: poll._id,
        memberId: member._id,
        choice: a.choice,
      });
    } else if (operation === "announcement" || operation === "send_reminders") {
      check(OFFICERS);
      const a = z
        .object({ title: text.optional(), message: text.optional() })
        .parse(input);
      if (operation === "announcement") {
        if (!a.title || !a.message)
          throw new ConvexError("TITLE_AND_MESSAGE_REQUIRED");
        const members = await ctx.db
          .query("members")
          .withIndex("by_chama", (q) => q.eq("chamaId", chamaId))
          .collect();
        for (const m of members.filter((m) => m.isActive))
          await notify(m._id, a.title, a.message);
      } else {
        const pending = await ctx.db
          .query("contributions")
          .withIndex("by_chama", (q) => q.eq("chamaId", chamaId))
          .collect();
        for (const c of pending.filter((c) =>
          ["pending", "overdue"].includes(c.status),
        ))
          await notify(
            c.memberId,
            "Contribution reminder",
            "Please review your outstanding contribution in SmartChama.",
            "contribution_due",
          );
      }
    } else if (operation === "mark_read") {
      const a = z.object({ id: text }).parse(input);
      const n = await scoped("notifications", a.id);
      if (n.memberId !== member._id) throw new ConvexError("FORBIDDEN");
      await ctx.db.patch(n._id, { isRead: true });
    } else if (operation === "update_settings") {
      check(ADMIN_ROLES);
      const a = z
        .object({
          name: text,
          amount,
          cycle: z.enum(["weekly", "monthly", "quarterly"]),
          interestRate: z.coerce.number().min(0).max(100),
          lateFee: z.coerce.number().min(0).max(100000),
          loanTermMonths: z.coerce.number().int().min(1).max(60),
          rules: z.string().max(5000),
        })
        .parse(input);
      await ctx.db.patch(chamaId, {
        name: a.name,
        contributionAmount: a.amount,
        contributionCycle: a.cycle,
        interestRate: a.interestRate,
        lateFee: a.lateFee,
        loanTermMonths: a.loanTermMonths,
        rules: a.rules,
      });
    } else if (operation === "update_member") {
      check(OFFICERS);
      const a = z
        .object({
          memberId: text,
          name: z.string().trim().min(1).max(100),
          phone: z.string().trim().max(30),
        })
        .parse(input);
      const target = await scoped("members", a.memberId);
      await ctx.db.patch(target._id, { name: a.name, phone: a.phone });
    } else if (operation === "update_profile") {
      const a = z
        .object({ name: text, phone: z.string().trim().max(30) })
        .parse(input);
      await ctx.db.patch(member._id, a);
      await ctx.db.patch(user._id, { name: a.name });
    } else throw new ConvexError("UNKNOWN_OPERATION");
    await audit();
    return { success: true };
  },
});
