"use client";
import { useAction, useMutation } from "convex/react";
import { useState, type FormEvent } from "react";
import { Copy, Mail, MessageCircle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useWorkspace } from "./workspace-shell";
import { INVITATION_ROLES, type InvitationRole } from "../../../shared/invitations";
import { roleLabel } from "../../../shared/workspace";
import { Badge, day, humanError, Table } from "./widgets";

export function InvitationsPanel() {
  const { chama, invitations, officer, member } = useWorkspace();
  const create = useAction(api.invitations.create);
  const revoke = useMutation(api.invitations.revoke);
  const [busy, setBusy] = useState(false);
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [result, setResult] = useState<{
    url: string;
    emailSent: boolean;
    emailError: string | null;
    phone: string | null;
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
        email:
          channel === "email"
            ? String(values.get("email") ?? "").trim() || undefined
            : undefined,
        channel,
        phone: channel === "whatsapp" ? String(values.get("phone") ?? "").trim() : undefined,
        role: String(values.get("role") ?? "member") as InvitationRole,
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
          expire after seven days and can be accepted once. Choose the recipient
          and their role before sharing. Email invitations require the matching
          verified account. Keep WhatsApp links private: whoever has the link
          could use it first.
        </p>
        <form onSubmit={submit} className="workspace-form">
          <label className="workspace-field">
            Delivery method
            <select
              value={channel}
              disabled={busy}
              onChange={(e) => {
                setChannel(e.target.value as "email" | "whatsapp");
                setError("");
                setResult(null);
                setCopied(false);
              }}
            >
              <option value="email">Email invitation</option>
              <option value="whatsapp">Share on WhatsApp</option>
            </select>
          </label>
          {channel === "email" ? (
            <label className="workspace-field">
              Recipient email
              <input
                name="email"
                type="email"
                required
                placeholder="member@example.com"
              />
            </label>
          ) : (
            <label className="workspace-field">
              Recipient WhatsApp number
              <input name="phone" type="tel" autoComplete="tel" required
                placeholder="0712 345 678 or +254712345678" />
            </label>
          )}
          <label className="workspace-field">
            Assigned role
            <select name="role" defaultValue="member">
              {(["admin", "chairperson"].includes(member.role) ? INVITATION_ROLES : ["member"]).map(role => (
                <option key={role} value={role}>{roleLabel(role)}</option>
              ))}
            </select>
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
                href={`https://wa.me/${result.phone?.replace(/\D/g, "") ?? ""}?text=${encodeURIComponent(`Join ${chama.name} on SmartChama: ${result.url}`)}`}
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
          headings={["Recipient", "Channel", "Role", "Status", "Expires", "Action"]}
          rows={invitations.map((invite) => [
            invite.email ?? invite.phone ?? "Reissue required",
            invite.channel,
            roleLabel(invite.role),
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
