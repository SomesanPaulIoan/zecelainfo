import type { Metadata } from "next";
import { SourceQuestionsView } from "@/components/grile/SourceQuestionsView";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type ChapterPageProps = {
  params: Promise<{ chapterId: string }>;
};

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { chapterId } = await params;
  return <SourceQuestionsView mode="chapter" id={chapterId} />;
}
