import { action, internalMutation, mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { z } from "zod";
import { internal } from "./_generated/api";
import { requireMembership, requireUser } from "./lib/auth";
import { normalizePhone } from "../shared/invitations";
import { OFFICERS } from "../shared/workspace";

const invitationRole = v.union(v.literal("member"), v.literal("chairperson"), v.literal("secretary"), v.literal("treasurer"));

export const store = internalMutation({
  args: {
    chamaId: v.id("chamas"),
    token: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(invitationRole),
    channel: v.union(v.literal("email"), v.literal("whatsapp")),
  },
  handler: async (ctx, args) => {
    const { user, member, chama } = await requireMembership(
      ctx,
      args.chamaId,
      OFFICERS,
    );
    const email = args.email?.trim().toLowerCase();
    if (args.channel === "email" && !email)
      throw new ConvexError("EMAIL_REQUIRED");
    if (email) z.email().parse(email);
    const role = args.role ?? "member";
    if (role !== "member" && !["admin", "chairperson"].includes(member.role))
      throw new ConvexError("ONLY_CHAIRPERSON_CAN_ASSIGN_OFFICER_ROLES");
    let phone: string | undefined;
    if (args.channel === "whatsapp") {
      try { phone = normalizePhone(args.phone ?? ""); }
      catch { throw new ConvexError("INVALID_PHONE_NUMBER"); }
    }
    await ctx.db.insert("invitations", {
      ...args,
      email: args.channel === "email" ? email : undefined,
      phone,
      role,
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
    return { chamaName: chama.name, phone };
  },
});

export const create = action({
  args: {
    chamaId: v.id("chamas"),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(invitationRole),
    channel: v.union(v.literal("email"), v.literal("whatsapp")),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    url: string;
    emailSent: boolean;
    emailError: string | null;
    phone: string | null;
  }> => {
    const site = process.env.SITE_URL;
    if (!site) throw new ConvexError("SITE_URL_NOT_CONFIGURED");
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    const { chamaName, phone } = await ctx.runMutation(internal.invitations.store, {
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
      phone: phone ?? null,
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
      invitation.expiresAt <= Date.now() ||
      (invitation.channel === "email" && !invitation.email) ||
      (invitation.channel === "whatsapp" && !invitation.phone)
    )
      return null;
    const chama = await ctx.db.get(invitation.chamaId);
    if (!chama?.isActive) return null;
    return {
      name: chama.name,
      expiresAt: invitation.expiresAt,
      emailRestricted: invitation.channel === "email" && !!invitation.email,
      channel: invitation.channel,
      role: invitation.role ?? "member",
      phoneHint: invitation.phone ? `••••${invitation.phone.slice(-4)}` : null,
    };
  },
});

export const accept = mutation({
  args: { token: v.string(), name: v.string(), phone: v.string() },
  handler: async (ctx, { token, name: rawName, phone: rawPhone }) => {
    const user = await requireUser(ctx);
    const invite = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!invite || invite.status === "revoked" || invite.expiresAt <= Date.now())
      throw new ConvexError("INVITATION_INVALID_OR_EXPIRED");
    if (invite.status === "accepted")
      throw new ConvexError("INVITATION_ALREADY_USED");
    // Never allow older unrestricted links to become a way around new rules.
    if ((invite.channel === "email" && !invite.email) ||
        (invite.channel === "whatsapp" && !invite.phone))
      throw new ConvexError("INVITATION_NEEDS_REISSUE");
    if (invite.channel === "email" && invite.email !== user.email?.trim().toLowerCase())
      throw new ConvexError("SIGN_IN_WITH_THE_INVITED_EMAIL");
    const name = z.string().trim().min(2).max(100).parse(rawName);
    let phone: string;
    try { phone = normalizePhone(rawPhone); }
    catch { throw new ConvexError("INVALID_PHONE_NUMBER"); }
    if (invite.channel === "whatsapp" && phone !== invite.phone)
      throw new ConvexError("USE_THE_INVITED_PHONE_NUMBER");
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
    if (membership) throw new ConvexError("MEMBERSHIP_ALREADY_EXISTS");
    // Recheck the inviter's authority at acceptance as well as creation.
    const inviter = await ctx.db.query("members")
      .withIndex("by_chama_user", q => q.eq("chamaId", invite.chamaId).eq("userId", invite.createdBy))
      .unique();
    const role = invite.role ?? "member";
    if (!inviter?.isActive || !OFFICERS.some(r => r === inviter.role) ||
        (role !== "member" && !["admin", "chairperson"].includes(inviter.role)))
      throw new ConvexError("INVITATION_NEEDS_REISSUE");
    await ctx.db.insert("members", {
        chamaId: invite.chamaId,
        userId: user._id,
        name,
        email: user.email!,
        phone,
        role,
        joinedAt: Date.now(),
        isActive: true,
      });
    await ctx.db.patch(invite._id, {
      status: "accepted",
      acceptedBy: user._id,
      acceptedAt: Date.now(),
    });
    await ctx.db.insert("auditEvents", {
      chamaId: invite.chamaId,
      actorId: user._id,
      actorName: user.name ?? "Member",
      action: `Accepted group invitation as ${role}`,
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
