import { ConvexError } from "convex/values";
import { z } from "zod";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { OFFICERS } from "../../shared/workspace";

export async function meetingData(ctx: QueryCtx, chamaId: Id<"chamas">, memberId: Id<"members">, officer: boolean) {
  const meetings = await ctx.db.query("meetings").withIndex("by_chama", q => q.eq("chamaId", chamaId)).collect();
  return Promise.all(meetings.sort((a, b) => b.startsAt - a.startsAt).map(async meeting => {
    const attendance = await ctx.db.query("meetingAttendance").withIndex("by_meeting", q => q.eq("meetingId", meeting._id)).collect();
    return { ...meeting, minutes: officer || meeting.minutesPublished ? meeting.minutes : "", attendance: attendance.filter(a => officer || a.memberId === memberId) };
  }));

}

const details = z.object({
  title: z.string().trim().min(1).max(150),
  location: z.string().trim().min(1).max(500),
  startsAt: z.number().finite().positive().max(8_640_000_000_000_000),
  agenda: z.string().trim().max(5000).default(""),
});

export async function meetingOperation(ctx: MutationCtx, operation: string, input: Record<string, unknown>, member: Doc<"members">) {
  if (!["create_meeting", "update_meeting", "cancel_meeting", "complete_meeting", "record_attendance", "save_minutes"].includes(operation)) return false;
  if (!(OFFICERS as readonly string[]).includes(member.role)) throw new ConvexError("FORBIDDEN");
  const now = Date.now();
  const chamaId = member.chamaId;
  const notifyAll = async (title: string, message: string) => {
    const members = await ctx.db.query("members").withIndex("by_chama", q => q.eq("chamaId", chamaId)).collect();
    for (const m of members.filter(m => m.isActive)) await ctx.db.insert("notifications", {
      chamaId, memberId: m._id, title, message, type: "meeting_reminder", isRead: false, createdAt: now,
    });
  };
  const announcement = (a: { title: string; startsAt: number; location: string }) => `${a.title} · ${new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(a.startsAt)} (East Africa Time) · ${a.location}`;
  if (operation === "create_meeting") {
    const a = details.parse(input);
    if (a.startsAt <= now) throw new ConvexError("MEETING_MUST_BE_IN_FUTURE");
    const meetingId = await ctx.db.insert("meetings", { ...a, chamaId, status: "scheduled", minutes: "", minutesPublished: false, createdBy: member.userId, createdAt: now, updatedAt: now });
    const roster = await ctx.db.query("members").withIndex("by_chama", q => q.eq("chamaId", chamaId)).collect();
    for (const m of roster.filter(m => m.isActive)) await ctx.db.insert("meetingAttendance", { chamaId, meetingId, memberId: m._id, memberName: m.name, status: "unrecorded" });
    await notifyAll("Meeting scheduled", announcement(a));
    return true;
  }
  const raw = z.object({ id: z.string() }).parse(input);
  const id = ctx.db.normalizeId("meetings", raw.id);
  const meeting = id ? await ctx.db.get(id) : null;
  if (!meeting || meeting.chamaId !== chamaId) throw new ConvexError("FORBIDDEN");
  if (meeting.status === "cancelled") throw new ConvexError("MEETING_CANCELLED");
  if (operation === "update_meeting") {
    const a = details.parse(input);
    if (meeting.status !== "scheduled" || meeting.startsAt <= now || a.startsAt <= now) throw new ConvexError("MEETING_MUST_BE_IN_FUTURE");
    await ctx.db.patch(meeting._id, { ...a, updatedAt: now });
    await notifyAll("Meeting updated", announcement(a));
  } else if (operation === "cancel_meeting") {
    if (meeting.status !== "scheduled") throw new ConvexError("MEETING_ALREADY_COMPLETED");
    await ctx.db.patch(meeting._id, { status: "cancelled", updatedAt: now });
    await notifyAll("Meeting cancelled", meeting.title);
  } else if (operation === "complete_meeting") {
    if (meeting.status !== "scheduled" || meeting.startsAt > now) throw new ConvexError("MEETING_NOT_STARTED");
    await ctx.db.patch(meeting._id, { status: "completed", updatedAt: now });
  } else if (operation === "record_attendance") {
    if (meeting.startsAt > now) throw new ConvexError("MEETING_NOT_STARTED");
    const a = z.object({ memberId: z.string(), status: z.enum(["unrecorded", "present", "absent", "excused"]) }).parse(input);
    const memberId = ctx.db.normalizeId("members", a.memberId);
    const target = memberId ? await ctx.db.get(memberId) : null;
    if (!target || target.chamaId !== chamaId) throw new ConvexError("FORBIDDEN");
    const entry = await ctx.db.query("meetingAttendance").withIndex("by_meeting_member", q => q.eq("meetingId", meeting._id).eq("memberId", target._id)).unique();
    if (entry) await ctx.db.patch(entry._id, { status: a.status });
    else {
      if (!target.isActive) throw new ConvexError("FORBIDDEN");
      await ctx.db.insert("meetingAttendance", { chamaId, meetingId: meeting._id, memberId: target._id, memberName: target.name, status: a.status });
    }
    await ctx.db.patch(meeting._id, { updatedAt: now });
  } else if (operation === "save_minutes") {
    const a = z.object({ minutes: z.string().trim().max(20000), visibility: z.enum(["draft", "published"]) }).parse(input);
    if (meeting.startsAt > now) throw new ConvexError("MEETING_NOT_STARTED");
    if (a.visibility === "published" && (meeting.status !== "completed" || !a.minutes)) throw new ConvexError("COMPLETE_MEETING_BEFORE_PUBLISHING");
    await ctx.db.patch(meeting._id, { minutes: a.minutes, minutesPublished: a.visibility === "published", updatedAt: now });
    if (a.visibility === "published" && !meeting.minutesPublished) await notifyAll("Meeting minutes published", meeting.title);
  }
  return true;
}
