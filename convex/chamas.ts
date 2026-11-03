import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireMembership, requireUser } from "./lib/auth";

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const memberships = await ctx.db
      .query("members")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const groups = await Promise.all(
      memberships
        .filter((m) => m.isActive)
        .map(async (member) => {
          const chama = await ctx.db.get(member.chamaId);
          return chama?.isActive ? { ...chama, role: member.role } : null;
        }),
    );
    return groups.filter((group) => group !== null);
  },
});

export const get = query({
  args: { chamaId: v.id("chamas") },
  handler: async (ctx, { chamaId }) =>
    (await requireMembership(ctx, chamaId)).chama,
});

export const dashboard = query({
  args: { chamaId: v.string() },
  handler: async (ctx, { chamaId: rawId }) => {
    const chamaId = ctx.db.normalizeId("chamas", rawId);
    if (!chamaId) throw new ConvexError("FORBIDDEN");
    const { chama, member } = await requireMembership(ctx, chamaId);
    const [members, contributions, loans, transactions] = await Promise.all([
      ctx.db
        .query("members")
        .withIndex("by_chama", (q) => q.eq("chamaId", chamaId))
        .collect(),
      ctx.db
        .query("contributions")
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
        .take(6),
    ]);
    return {
      chama,
      role: member.role,
      memberName: member.name,
      memberCount: members.filter((m) => m.isActive).length,
      contributionsTotal: contributions
        .filter((c) => c.status === "paid")
        .reduce((sum, c) => sum + c.amount, 0),
      activeLoans: loans.filter((l) =>
        ["disbursed", "active", "defaulted"].includes(l.status),
      ).length,
      recentActivity: transactions.map((t) => ({
        _id: t._id,
        description: t.description,
        amount: t.amount,
        direction: t.direction,
        createdAt: t.createdAt,
      })),
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    contributionAmount: v.number(),
    contributionCycle: v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("quarterly"),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const name = args.name.trim();
    if (
      !name ||
      name.length > 100 ||
      !Number.isFinite(args.contributionAmount) ||
      args.contributionAmount <= 0
    )
      throw new ConvexError("INVALID_CHAMA_DETAILS");
    const now = Date.now();
    const chamaId = await ctx.db.insert("chamas", {
      ...args,
      name,
      totalPool: 0,
      createdBy: user._id,
      createdAt: now,
      isActive: true,
    });
    // Creating an account never grants a role in an existing chama.
    await ctx.db.insert("members", {
      chamaId,
      userId: user._id,
      name: user.name ?? "Member",
      email: user.email!,
      phone: "",
      role: "admin",
      joinedAt: now,
      isActive: true,
    });
    return chamaId;
  },
});
