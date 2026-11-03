import { action, internalMutation, mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { z } from "zod";
import { internal } from "./_generated/api";
import { requireMembership, requireUser } from "./lib/auth";
import { OFFICERS } from "../shared/workspace";

export const store = internalMutation({
  args: {
    chamaId: v.id("chamas"),
    token: v.string(),
    email: v.optional(v.string()),
    channel: v.union(v.literal("email"), v.literal("whatsapp")),
  },
  handler: async (ctx, args) => {
    const { user, chama } = await requireMembership(
      ctx,
      args.chamaId,
      OFFICERS,
    );
    const email = args.email?.trim().toLowerCase();
    if (args.channel === "email" && !email)
      throw new ConvexError("EMAIL_REQUIRED");
    if (email) z.email().parse(email);
    await ctx.db.insert("invitations", {
      ...args,
      email: email || undefined,
      createdBy: user._id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 86400000,
      status: "pending",
    });
    await ctx.db.insert("auditEvents", {
      chamaId: args.chamaId,
      actorId: user._id,
      actorName: user.name ?? "Officer",
      action: `Created ${args.channel} invitation`,
      createdAt: Date.now(),
    });
    return { chamaName: chama.name };
  },
});

export const create = action({
  args: {
    chamaId: v.id("chamas"),
    email: v.optional(v.string()),
    channel: v.union(v.literal("email"), v.literal("whatsapp")),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    url: string;
    emailSent: boolean;
    emailError: string | null;
  }> => {
    const site = process.env.SITE_URL;
    if (!site) throw new ConvexError("SITE_URL_NOT_CONFIGURED");
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    const { chamaName } = await ctx.runMutation(internal.invitations.store, {
      ...args,
      token,
    });
    const url = `${site.replace(/\/$/, "")}/join/${token}`;
    let emailSent = false;
    if (args.channel === "email") {
      const key = process.env.AUTH_RESEND_KEY;
      const from = process.env.AUTH_EMAIL_FROM;
      if (key && from) {
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from,
              to: [args.email!.trim().toLowerCase()],
              subject: `You’re invited to ${chamaName} on SmartChama`,
              text: `You’ve been invited to join ${chamaName}.\n\nAccept your invitation: ${url}\n\nSign in or create and verify your account first. This invitation expires in 7 days and can be used once.\n\nOnly join if you recognize this savings group.`,
            }),
          });
          emailSent = response.ok;
        } catch {
          emailSent = false;
        }
      }
    }
    return {
      url,
      emailSent,
      emailError:
        args.channel === "email" && !emailSent
          ? "Invitation created, but the email could not be delivered. Copy the link to share it, and check your Resend sender configuration."
          : null,
    };
  },
});

export const preview = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    if (!/^[a-f0-9]{64}$/.test(token)) return null;
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (
      !invitation ||
      invitation.status !== "pending" ||
      invitation.expiresAt < Date.now()
    )
      return null;
    const chama = await ctx.db.get(invitation.chamaId);
    if (!chama?.isActive) return null;
    return {
      name: chama.name,
      expiresAt: invitation.expiresAt,
      emailRestricted: !!invitation.email,
    };
  },
});

export const accept = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await requireUser(ctx);
    const invite = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!invite || invite.status === "revoked" || invite.expiresAt < Date.now())
      throw new ConvexError("INVITATION_INVALID_OR_EXPIRED");
    if (invite.status === "accepted") {
      if (invite.acceptedBy === user._id) return invite.chamaId;
      throw new ConvexError("INVITATION_ALREADY_USED");
    }
    if (invite.email && invite.email !== user.email?.toLowerCase())
      throw new ConvexError("SIGN_IN_WITH_THE_INVITED_EMAIL");
    const chama = await ctx.db.get(invite.chamaId);
    if (!chama?.isActive) throw new ConvexError("GROUP_INACTIVE");
    const membership = await ctx.db
      .query("members")
      .withIndex("by_chama_user", (q) =>
        q.eq("chamaId", invite.chamaId).eq("userId", user._id),
      )
      .unique();
    if (membership && !membership.isActive)
      throw new ConvexError("CONTACT_AN_ADMIN_TO_REACTIVATE_MEMBERSHIP");
    if (!membership)
      await ctx.db.insert("members", {
        chamaId: invite.chamaId,
        userId: user._id,
        name: user.name ?? "Member",
        email: user.email!,
        phone: "",
        role: "member",
        joinedAt: Date.now(),
        isActive: true,
      });
    await ctx.db.patch(invite._id, {
      status: "accepted",
      acceptedBy: user._id,
    });
    await ctx.db.insert("auditEvents", {
      chamaId: invite.chamaId,
      actorId: user._id,
      actorName: user.name ?? "Member",
      action: "Accepted group invitation",
      createdAt: Date.now(),
    });
    return invite.chamaId;
  },
});

export const revoke = mutation({
  args: { id: v.id("invitations") },
  handler: async (ctx, { id }) => {
    const invite = await ctx.db.get(id);
    if (!invite) throw new ConvexError("FORBIDDEN");
    await requireMembership(ctx, invite.chamaId, OFFICERS);
    if (invite.status !== "pending")
      throw new ConvexError("INVITATION_ALREADY_CLOSED");
    await ctx.db.patch(id, { status: "revoked" });
  },
});
