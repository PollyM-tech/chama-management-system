"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

export function SignOutButton() {
  const { signOut } = useAuthActions();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div>
      <button
        disabled={busy}
        className="min-h-11 px-2 text-sm font-medium text-emerald-800 disabled:opacity-50"
        onClick={async () => {
          setBusy(true);
          setError(false);
          try {
            await signOut();
            window.location.assign("/sign-in");
          } catch {
            setError(true);
            setBusy(false);
          }
        }}
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          Unable to sign out. Try again.
        </p>
      )}
    </div>
  );
}
