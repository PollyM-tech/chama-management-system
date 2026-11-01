import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireMembership } from "./lib/auth";

const role = v.union(
  v.literal("admin"),
  v.literal("treasurer"),
  v.literal("secretary"),
  v.literal("member"),
);

export const list = query({
  args: { chamaId: v.id("chamas") },
  handler: async (ctx, { chamaId }) => {
    await requireMembership(ctx, chamaId, ["admin", "treasurer", "secretary"]);
    return ctx.db
      .query("members")
      .withIndex("by_chama", (q) => q.eq("chamaId", chamaId))
      .collect();
  },
});

// Only admins can link an existing verified account to their own chama.
export const add = mutation({
  args: { chamaId: v.id("chamas"), email: v.string(), role },
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.chamaId, ["admin"]);
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email.trim().toLowerCase()))
      .unique();
    if (!user?.emailVerificationTime)
      throw new ConvexError("VERIFIED_USER_REQUIRED");
    const existing = await ctx.db
      .query("members")
      .withIndex("by_chama_user", (q) =>
        q.eq("chamaId", args.chamaId).eq("userId", user._id),
      )
      .unique();
    if (existing) throw new ConvexError("MEMBERSHIP_ALREADY_EXISTS");
    return ctx.db.insert("members", {
      chamaId: args.chamaId,
      userId: user._id,
      name: user.name ?? "Member",
      email: user.email!,
      phone: "",
      role: args.role,
      joinedAt: Date.now(),
      isActive: true,
    });
  },
});

export const updateAccess = mutation({
  args: { memberId: v.id("members"), role, isActive: v.boolean() },
  handler: async (ctx, args) => {
    const target = await ctx.db.get(args.memberId);
    if (!target) throw new ConvexError("FORBIDDEN");
    await requireMembership(ctx, target.chamaId, ["admin"]);
    if (
      target.isActive &&
      target.role === "admin" &&
      (!args.isActive || args.role !== "admin")
    ) {
      const admins = await ctx.db
        .query("members")
        .withIndex("by_chama", (q) => q.eq("chamaId", target.chamaId))
        .filter((q) =>
          q.and(
            q.eq(q.field("role"), "admin"),
            q.eq(q.field("isActive"), true),
          ),
        )
        .collect();
      if (admins.length <= 1) throw new ConvexError("LAST_ADMIN_REQUIRED");
    }
    await ctx.db.patch(args.memberId, {
      role: args.role,
      isActive: args.isActive,
    });
  },
});
