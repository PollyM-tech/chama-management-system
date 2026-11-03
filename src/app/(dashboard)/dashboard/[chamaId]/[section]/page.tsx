import { notFound } from "next/navigation";
import {
  WORKSPACE_SECTIONS,
  type WorkspaceSection,
} from "../../../../../../shared/workspace";
import { WorkspaceSectionView } from "@/components/workspace/sections";

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!(WORKSPACE_SECTIONS as readonly string[]).includes(section)) notFound();
  return <WorkspaceSectionView section={section as WorkspaceSection} />;
}
