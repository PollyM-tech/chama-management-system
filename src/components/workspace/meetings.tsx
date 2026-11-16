"use client";
import { useWorkspace } from "./workspace-shell";
import { ActionButton, FormPanel, Table, type Field } from "./widgets";

const localDateTime = (time: number) => new Date(time + 3 * 3600000).toISOString().slice(0, 16);
const meetingFields = (meeting?: { title: string; location: string; startsAt: number; agenda: string }): Field[] => [
  { name: "title", label: "Meeting title", value: meeting?.title },
  { name: "startsAt", label: "Start (East Africa Time, UTC+3)", type: "datetime-local", value: meeting ? localDateTime(meeting.startsAt) : undefined },
  { name: "location", label: "Venue or online meeting link", value: meeting?.location, full: true },
  { name: "agenda", label: "Agenda", type: "textarea", value: meeting?.agenda, optional: true, full: true },
];

export function Meetings() {
  const { meetings, officer, members } = useWorkspace();
  return <div className="workspace-stack">
    {officer && <FormPanel title="Schedule a meeting" description="Active members receive an in-app notification. All meeting times use East Africa Time." operation="create_meeting" fields={meetingFields()} button="Schedule meeting" />}
    {!meetings.length && <p className="workspace-empty">No meetings scheduled yet.</p>}
    {meetings.map(meeting => <section className="workspace-card" key={meeting._id}>
      <h2 className="workspace-section-heading">{meeting.title}</h2>
      <p>{new Intl.DateTimeFormat("en-KE", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(meeting.startsAt)} (East Africa Time)</p>
      <p>{meeting.location} · {meeting.status}</p>
      <h3>Agenda</h3>
      <p style={{ whiteSpace: "pre-wrap" }}>{meeting.agenda || "No agenda added."}</p>
      {officer && meeting.status === "scheduled" && <div className="workspace-actions">
        <ActionButton operation="complete_meeting" input={{ id: meeting._id }}>Mark completed</ActionButton>
        <ActionButton operation="cancel_meeting" input={{ id: meeting._id }} danger>Cancel meeting</ActionButton>
      </div>}
      {officer && meeting.status === "scheduled" && <details>
        <summary>Edit schedule</summary>
        <FormPanel title="Update meeting" description="Schedule changes notify active members. Meetings can be rescheduled before they start." operation="update_meeting" fixedInput={{ id: meeting._id }} fields={meetingFields(meeting)} button="Update meeting" />
      </details>}
      <details>
        <summary>{officer ? "Attendance register" : "Your attendance"}</summary>
        <Table headings={["Member", "Attendance"]} rows={meeting.attendance.map(a => [a.memberName, a.status === "unrecorded" ? "Not recorded" : a.status])} empty="Attendance has not been recorded for you." />
        {officer && meeting.status !== "cancelled" && <FormPanel title="Record attendance" description="Available from the meeting start time. New active members can be added; existing roster entries are preserved." operation="record_attendance" fixedInput={{ id: meeting._id }} fields={[
          { name: "memberId", label: "Member", type: "select", options: members.filter(m => m.isActive || meeting.attendance.some(a => a.memberId === m._id)).map(m => ({ value: m._id, label: m.name })) },
          { name: "status", label: "Attendance", type: "select", options: [{ value: "present", label: "Present" }, { value: "absent", label: "Absent" }, { value: "excused", label: "Excused" }, { value: "unrecorded", label: "Not recorded" }] },
        ]} />}
      </details>
      <h3>Minutes {meeting.minutesPublished ? "· Published" : "· Draft"}</h3>
      <p style={{ whiteSpace: "pre-wrap" }}>{meeting.minutes || (officer ? "No minutes added." : "Minutes have not been published.")}</p>
      {officer && meeting.status !== "cancelled" && <details>
        <summary>Edit minutes</summary>
        <FormPanel key={`${meeting._id}-${meeting.updatedAt}`} title="Meeting minutes" description="Save a draft after the meeting starts. Complete the meeting before publishing minutes for all members." operation="save_minutes" fixedInput={{ id: meeting._id }} fields={[
          { name: "minutes", label: "Minutes and decisions", type: "textarea", optional: true, full: true, value: meeting.minutes },
          { name: "visibility", label: "Visibility", type: "select", value: meeting.minutesPublished ? "published" : "draft", options: [{ value: "draft", label: "Draft — officers only" }, { value: "published", label: "Published — all members" }] },
        ]} button="Save minutes" />
      </details>}
    </section>)}
  </div>;
}
