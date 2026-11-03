"use client";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { Users } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { BrandLogo } from "@/components/brand-logo";
import { groupDashboardPath } from "@/lib/chama-navigation";

export function InvitationAcceptance({ token }: { token: string }) {
  const preview = useQuery(api.invitations.preview, { token });
  const accept = useMutation(api.invitations.accept);
  const { isAuthenticated, isLoading } = useConvexAuth();
  const verifiedSession = useQuery(
    api.auth.isAuthenticated,
    isAuthenticated ? {} : "skip",
  );
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
              Join as a member to view your contributions, apply for loans, and
              stay updated.
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
              <button
                disabled={busy}
                className="mt-6 rounded-lg bg-emerald-800 px-6 py-3 font-semibold text-white disabled:opacity-50"
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    const chamaId = await accept({ token });
                    window.location.assign(groupDashboardPath(chamaId));
                  } catch (e) {
                    setError(
                      e instanceof Error &&
                        e.message.includes("SIGN_IN_WITH_THE_INVITED_EMAIL")
                        ? "Please sign in using the email address that received this invitation."
                        : "Unable to accept this invitation. It may be used, expired, or your membership may be inactive.",
                    );
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Joining…" : "Accept invitation"}
              </button>
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
