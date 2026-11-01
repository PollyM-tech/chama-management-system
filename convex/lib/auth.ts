import { getAuthSessionId, getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

export type Role = Doc<"members">["role"];

// Read sessions as well as signed identities so revocation takes effect
// immediately, even before an issued JWT expires.
export async function requireUser(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  const sessionId = await getAuthSessionId(ctx);
  if (!userId || !sessionId) throw new ConvexError("UNAUTHENTICATED");
  const [user, session] = await Promise.all([
    ctx.db.get(userId),
    ctx.db.get(sessionId),
  ]);
  if (
    !user ||
    !session ||
    session.userId !== userId ||
    session.expirationTime <= Date.now()
  ) {
    throw new ConvexError("UNAUTHENTICATED");
  }
  if (!user.emailVerificationTime) throw new ConvexError("EMAIL_NOT_VERIFIED");
  return user;
}

export async function requireMembership(
  ctx: QueryCtx,
  chamaId: Id<"chamas">,
  roles?: readonly Role[],
) {
  const user = await requireUser(ctx);
  const [chama, member] = await Promise.all([
    ctx.db.get(chamaId),
    ctx.db
      .query("members")
      .withIndex("by_chama_user", (q) =>
        q.eq("chamaId", chamaId).eq("userId", user._id),
      )
      .unique(),
  ]);
  if (
    !chama?.isActive ||
    !member?.isActive ||
    (roles && !roles.includes(member.role))
  ) {
    throw new ConvexError("FORBIDDEN");
  }
  return { user, member, chama };
}
