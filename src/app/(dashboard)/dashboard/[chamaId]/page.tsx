import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import type { Preloaded } from "convex/react";
import { notFound, redirect } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import { GroupDashboard } from "@/components/dashboard/group-dashboard";

export default async function ChamaDashboardPage({
  params,
}: {
  params: Promise<{ chamaId: string }>;
}) {
  const { chamaId } = await params;
  const token = await convexAuthNextjsToken();
  if (!token) redirect("/sign-in");
  let preloaded: Preloaded<typeof api.chamas.dashboard>;
  try {
    preloaded = await preloadQuery(
      api.chamas.dashboard,
      { chamaId },
      { token },
    );
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
  return <GroupDashboard preloaded={preloaded} />;
}
