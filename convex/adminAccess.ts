import { internalAction, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { z } from "zod";
import { createAccount } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { activateAdminAccess } from "./lib/admin_access";

// Internal-only: executable with deployment administrator credentials, never
// callable from a browser or an ordinary authenticated application account.
export const prepare = internalMutation({
  args: { email: v.string(), chamaIds: v.array(v.id("chamas")) },
  handler: async (ctx, args) => {
    const email = z.email().parse(args.email.trim().toLowerCase());
    const chamaIds = [...new Set(args.chamaIds)];
    if (!chamaIds.length) throw new ConvexError("GROUP_REQUIRED");
    for (const id of chamaIds) {
      if (!(await ctx.db.get(id))?.isActive) throw new ConvexError("GROUP_INACTIVE");
    }
    const user = await ctx.db.query("users")
      .withIndex("email", q => q.eq("email", email)).unique();
    if (user) {
      for (const chamaId of chamaIds) {
        const member = await ctx.db.query("members")
          .withIndex("by_chama_user", q => q.eq("chamaId", chamaId).eq("userId", user._id)).unique();
        if (member && !member.isActive) throw new ConvexError("INACTIVE_MEMBERSHIP_REQUIRES_EXPLICIT_REACTIVATION");
      }
    }
    const pending = await ctx.db.query("adminAccessGrants")
      .withIndex("by_email_status", q => q.eq("email", email).eq("status", "pending")).collect();
    for (const grant of pending) await ctx.db.patch(grant._id, { status: "revoked" });
    const expiresAt = Date.now() + 7 * 86400000;
    await ctx.db.insert("adminAccessGrants", {
      email, chamaIds, status: "pending", createdAt: Date.now(), expiresAt,
    });
    const activatedGroups = user ? await activateAdminAccess(ctx, user._id) : 0;
    return { email, groupCount: chamaIds.length, activatedGroups,
      status: activatedGroups ? "activated" : "pending_email_verification", expiresAt };
  },
});

export const revokePending = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email: rawEmail }) => {
    const email = rawEmail.trim().toLowerCase();
    const grants = await ctx.db.query("adminAccessGrants")
      .withIndex("by_email_status", q => q.eq("email", email).eq("status", "pending")).collect();
    for (const grant of grants) await ctx.db.patch(grant._id, { status: "revoked" });
    return grants.length;
  },
});

// Generates the credential inside the server: never place it in a command,
// source file, or database profile. Convex Auth stores only the password hash.
export const createDeveloperAccount = internalAction({
  args: { email: v.string(), chamaIds: v.array(v.id("chamas")) },
  handler: async (ctx, args): Promise<{
    email: string; password: string; groupCount: number; emailVerificationRequired: boolean;
  }> => {
    const email = z.email().parse(args.email.trim().toLowerCase());
    const prepared = await ctx.runMutation(internal.adminAccess.prepare, { ...args, email });
    const password = "Sc!" + Array.from(crypto.getRandomValues(new Uint8Array(24)),
      byte => byte.toString(16).padStart(2, "0")).join("");
    // Fails rather than replacing the password of an existing account.
    await createAccount(ctx, {
      provider: "password",
      account: { id: email, secret: password },
      profile: { email, name: "SmartChama Frontend Developer" },
    });
    return { email, password, groupCount: prepared.groupCount, emailVerificationRequired: true };
  },
});
