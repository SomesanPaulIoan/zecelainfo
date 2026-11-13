import type { Metadata } from "next";
import { GrileExamPage, grileExamMetadata } from "../grile-exam-page";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ exam: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { exam } = await params;
  return grileExamMetadata(exam, "chapters");
}

export default async function GrileExamChaptersPage({ params }: Props) {
  const { exam } = await params;
  return <GrileExamPage slug={exam} view="chapters" />;
}
