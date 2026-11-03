"use client";
import { useAction, useMutation } from "convex/react";
import { useState, type FormEvent } from "react";
import { Copy, Mail, MessageCircle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useWorkspace } from "./workspace-shell";
import { Badge, day, humanError, Table } from "./widgets";

export function InvitationsPanel() {
  const { chama, invitations, officer } = useWorkspace();
  const create = useAction(api.invitations.create);
  const revoke = useMutation(api.invitations.revoke);
  const [busy, setBusy] = useState(false);
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [result, setResult] = useState<{
    url: string;
    emailSent: boolean;
    emailError: string | null;
  } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  if (!officer) return null;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    setError("");
    setResult(null);
    setCopied(false);
    try {
      const response = await create({
        chamaId: chama._id,
        email: String(values.get("email") ?? "").trim() || undefined,
        channel,
      });
      setResult(response);
      form.reset();
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="workspace-stack">
      <section className="workspace-card">
        <h2 className="workspace-section-heading">Invite a member</h2>
        <p className="workspace-page-description">
          Chairpersons, treasurers, and secretaries can invite members. Links
          expire after seven days and can be accepted once. Invitees join with
          the member role.
        </p>
        <form onSubmit={submit} className="workspace-form">
          <label className="workspace-field">
            Delivery method
            <select
              value={channel}
              onChange={(e) =>
                setChannel(e.target.value as "email" | "whatsapp")
              }
            >
              <option value="email">Email invitation</option>
              <option value="whatsapp">Share on WhatsApp</option>
            </select>
          </label>
          <label className="workspace-field">
            {channel === "email"
              ? "Recipient email"
              : "Restrict to an email (optional)"}
            <input
              name="email"
              type="email"
              required={channel === "email"}
              placeholder="member@example.com"
            />
          </label>
          <div className="workspace-form-footer">
            <button disabled={busy} className="workspace-button">
              {channel === "email" ? (
                <Mail size={14} />
              ) : (
                <MessageCircle size={14} />
              )}{" "}
              {busy
                ? "Creating invitation…"
                : channel === "email"
                  ? "Create & send email"
                  : "Create shareable link"}
            </button>
          </div>
        </form>
        {error && (
          <p role="alert" className="workspace-error">
            {error}
          </p>
        )}
        {result && (
          <>
            <p
              className={
                result.emailError ? "workspace-error" : "workspace-success"
              }
              role="status"
            >
              {result.emailError ??
                (result.emailSent
                  ? "Invitation email sent."
                  : "Invitation link is ready to share.")}
            </p>
            <div className="workspace-link-box">
              <input readOnly aria-label="Invitation link" value={result.url} />
              <button
                className="workspace-button secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(result.url);
                    setCopied(true);
                  } catch {
                    setError("Select and copy the invitation link manually.");
                  }
                }}
              >
                <Copy size={13} />
                {copied ? "Copied" : "Copy link"}
              </button>
              <a
                className="workspace-button"
                target="_blank"
                rel="noopener noreferrer"
                href={`https://wa.me/?text=${encodeURIComponent(`Join ${chama.name} on SmartChama: ${result.url}`)}`}
              >
                <MessageCircle size={14} />
                Share on WhatsApp
              </a>
            </div>
          </>
        )}
      </section>
      <section className="workspace-card">
        <h2 className="workspace-section-heading">Invitation history</h2>
        <Table
          headings={["Recipient", "Channel", "Status", "Expires", "Action"]}
          rows={invitations.map((invite) => [
            invite.email ?? "Shareable member link",
            invite.channel,
            <Badge
              key="status"
              value={
                invite.expired && invite.status === "pending"
                  ? "expired"
                  : invite.status
              }
            />,
            day(invite.expiresAt),
            invite.status === "pending" && !invite.expired ? (
              <button
                key="revoke"
                className="workspace-button danger small"
                onClick={async () => {
                  try {
                    await revoke({ id: invite._id });
                  } catch (e) {
                    setError(humanError(e));
                  }
                }}
              >
                Revoke
              </button>
            ) : (
              "—"
            ),
          ])}
          empty="No invitations sent yet."
        />
      </section>
    </div>
  );
}
