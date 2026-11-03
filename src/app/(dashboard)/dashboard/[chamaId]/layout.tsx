import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import type { Preloaded } from "convex/react";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { api } from "../../../../../convex/_generated/api";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

export default async function WorkspaceLayout({
  params,
  children,
}: {
  params: Promise<{ chamaId: string }>;
  children: ReactNode;
}) {
  const { chamaId } = await params;
  const token = await convexAuthNextjsToken();
  if (!token) redirect("/sign-in");
  let preloaded: Preloaded<typeof api.workspace.get>;
  try {
    preloaded = await preloadQuery(api.workspace.get, { chamaId }, { token });
  } catch (error) {
    if (error instanceof Error && error.message.includes("FORBIDDEN"))
      notFound();
    if (
      error instanceof Error &&
      /UNAUTHENTICATED|EMAIL_NOT_VERIFIED/.test(error.message)
    )
      redirect("/sign-in");
    throw error;
  }
  return <WorkspaceShell preloaded={preloaded}>{children}</WorkspaceShell>;
}
