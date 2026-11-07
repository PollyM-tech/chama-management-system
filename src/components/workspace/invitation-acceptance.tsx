"use client";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { Users } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { BrandLogo } from "@/components/brand-logo";
import { roleLabel } from "../../../shared/workspace";
import { groupDashboardPath } from "@/lib/chama-navigation";

export function InvitationAcceptance({ token }: { token: string }) {
  const preview = useQuery(api.invitations.preview, { token });
  const accept = useMutation(api.invitations.accept);
  const { isAuthenticated, isLoading } = useConvexAuth();
  const verifiedSession = useQuery(
    api.auth.isAuthenticated,
    isAuthenticated ? {} : "skip",
  );
  const user = useQuery(api.users.current, verifiedSession ? {} : "skip");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const next = encodeURIComponent(`/join/${token}`);
  return (
    <main className="flex min-h-screen items-center justify-center bg-emerald-50/40 px-4 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <div className="flex justify-center">
          <BrandLogo size="large" />
        </div>
        {preview === undefined || isLoading ? (
          <p role="status">Loading invitation…</p>
        ) : !preview ? (
          <>
            <h1 className="text-2xl font-semibold">
              This invitation is no longer available
            </h1>
            <p className="mt-3 text-sm text-zinc-500">
              Ask your chairperson, secretary, or treasurer for a new link.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-block text-emerald-800"
            >
              Go to your groups
            </Link>
          </>
        ) : (
          <>
            <Users className="mx-auto mb-4 text-emerald-700" size={32} />
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
              You’re invited
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold">
              Join {preview.name}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Complete your details to join. Your role was selected by the
              inviting officer and cannot be changed here.
              {preview.emailRestricted
                ? " Sign in using the email address this invitation was sent to."
                : ""}
            </p>
            {error && (
              <p className="mt-4 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            {verifiedSession ? (
              <form className="mt-6 space-y-4 text-left" onSubmit={async (event) => {
                  event.preventDefault();
                  const details = new FormData(event.currentTarget);
                  setBusy(true);
                  setError("");
                  try {
                    const chamaId = await accept({
                      token,
                      name: String(details.get("name") ?? ""),
                      phone: String(details.get("phone") ?? ""),
                    });
                    window.location.assign(groupDashboardPath(chamaId));
                  } catch (e) {
                    setError(
                      e instanceof Error &&
                        e.message.includes("SIGN_IN_WITH_THE_INVITED_EMAIL")
                        ? "Please sign in using the email address that received this invitation."
                        : e instanceof Error && e.message.includes("USE_THE_INVITED_PHONE_NUMBER")
                          ? "Enter the phone number the invitation was sent to."
                          : e instanceof Error && e.message.includes("MEMBERSHIP_ALREADY_EXISTS")
                            ? "You already belong to this group. Open it from your dashboard."
                            : e instanceof Error && e.message.includes("INVITATION_NEEDS_REISSUE")
                              ? "Ask an officer to issue a new invitation."
                              : "Unable to join. Check your details; the link may be used, expired, or revoked.",
                    );
                    setBusy(false);
                  }
                }}>
                <label className="block text-sm font-medium">
                  Full name
                  <input key={user?._id ?? "loading"} name="name" required minLength={2} maxLength={100}
                    defaultValue={user?.name ?? ""} autoComplete="name"
                    className="mt-2 min-h-11 w-full min-w-0 rounded-lg border border-zinc-300 px-3 py-2 text-base" />
                </label>
                <label className="block text-sm font-medium">
                  Account email
                  <input value={user?.email ?? ""} readOnly type="email"
                    className="mt-2 min-h-11 w-full min-w-0 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-base" />
                </label>
                <label className="block text-sm font-medium">
                  Phone number {preview.phoneHint ? `(ending ${preview.phoneHint.slice(-4)})` : ""}
                  <input name="phone" type="tel" required autoComplete="tel" maxLength={25}
                    placeholder="0712 345 678 or +254712345678"
                    className="mt-2 min-h-11 w-full min-w-0 rounded-lg border border-zinc-300 px-3 py-2 text-base" />
                </label>
                <label className="block text-sm font-medium">
                  Assigned role
                  <input value={roleLabel(preview.role)} readOnly
                    className="mt-2 min-h-11 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-base" />
                </label>
                <p className="text-xs text-zinc-500">This link expires after seven days and closes immediately after you join.</p>
                <button disabled={busy || !user}
                  className="min-h-11 w-full rounded-lg bg-emerald-800 px-6 py-3 font-semibold text-white disabled:opacity-50">
                  {busy ? "Joining…" : "Submit details & join"}
                </button>
              </form>
            ) : (
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  className="rounded-lg bg-emerald-800 px-5 py-3 text-sm font-semibold text-white"
                  href={`/sign-in?next=${next}`}
                >
                  Sign in to join
                </Link>
                <Link
                  className="rounded-lg border border-emerald-700 px-5 py-3 text-sm font-semibold text-emerald-800"
                  href={`/sign-in?flow=signUp&next=${next}`}
                >
                  Create an account
                </Link>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
