"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";

export function AuthButtons() {
  const { loading, refreshAuth } = useAuth();

  if (loading) {
    return (
      <div className="flex h-12 w-full items-center justify-center md:w-[158px]">
        <span className="text-zinc-400">Loading...</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void refreshAuth({ ensureSignedIn: true })}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
      >
        Sign in
      </button>
      <button
        type="button"
        onClick={() => void refreshAuth({ ensureSignedIn: true })}
        className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
      >
        Sign up
      </button>
    </>
  );
}
