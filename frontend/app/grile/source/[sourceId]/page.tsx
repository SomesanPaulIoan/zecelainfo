import type { Metadata } from "next";
import { SourceQuestionsView } from "@/components/grile/SourceQuestionsView";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type SourcePageProps = {
  params: Promise<{ sourceId: string }>;
};

export default async function SourcePage({ params }: SourcePageProps) {
  const { sourceId } = await params;
  return <SourceQuestionsView mode="source" id={sourceId} />;
}
