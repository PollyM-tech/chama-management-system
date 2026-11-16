import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { notFound, redirect } from "next/navigation";
import { api } from "../../convex/_generated/api";
import { groupSectionPath } from "./chama-navigation";

export async function redirectLegacyRecord(table: "members" | "loans", id: string) {
  const token = await convexAuthNextjsToken();
  if (!token) redirect("/sign-in");
  const chamaId = await fetchQuery(api.workspace.legacyRecordGroup, { table, id }, { token });
  if (!chamaId) notFound();
  redirect(groupSectionPath(chamaId, table));
}
