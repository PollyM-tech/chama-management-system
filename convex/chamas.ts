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
