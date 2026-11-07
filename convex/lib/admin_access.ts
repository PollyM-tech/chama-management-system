import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

// Deployment operators can prepare access; the auth hook only consumes an
// existing, unexpired grant after the exact account email has been verified.
export async function activateAdminAccess(ctx: MutationCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user?.email || !user.emailVerificationTime) return 0;
  const email = user.email.trim().toLowerCase();
  const grants = await ctx.db.query("adminAccessGrants")
    .withIndex("by_email_status", q => q.eq("email", email).eq("status", "pending"))
    .collect();
  let activated = 0;
  for (const grant of grants) {
    if (grant.expiresAt <= Date.now()) continue;
    for (const chamaId of grant.chamaIds) {
      const chama = await ctx.db.get(chamaId);
      if (!chama?.isActive) continue;
      const existing = await ctx.db.query("members")
        .withIndex("by_chama_user", q => q.eq("chamaId", chamaId).eq("userId", userId))
        .unique();
      // An inactive membership is an explicit revocation; a pending invitation
      // must never silently reactivate it.
      if (existing && !existing.isActive) continue;
      if (existing) {
        await ctx.db.patch(existing._id, { role: "admin" });
      } else {
        await ctx.db.insert("members", {
          chamaId, userId, name: user.name ?? "Developer", email,
          phone: user.phone ?? "", role: "admin", isActive: true, joinedAt: Date.now(),
        });
      }
      await ctx.db.insert("auditEvents", {
        chamaId, actorId: userId, actorName: user.name ?? email,
        action: "Activated deployment-approved administrator access", createdAt: Date.now(),
      });
      activated++;
    }
    await ctx.db.patch(grant._id, {
      status: "activated", activatedBy: userId, activatedAt: Date.now(),
    });
  }
  return activated;
}
