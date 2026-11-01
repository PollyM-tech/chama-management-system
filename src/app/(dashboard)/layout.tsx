import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { api } from "../../../convex/_generated/api";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { BrandLogo } from "@/components/brand-logo";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const token = await convexAuthNextjsToken();
  if (!token) redirect("/sign-in");
  // Call the backend guard here too: a cookie alone does not establish access.
  try {
    await fetchQuery(api.users.current, {}, { token });
  } catch (error) {
    if (
      error instanceof Error &&
      /UNAUTHENTICATED|EMAIL_NOT_VERIFIED/.test(error.message)
    )
      redirect("/sign-in");
    throw error;
  }
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <BrandLogo href="/dashboard" />
        <SignOutButton />
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
