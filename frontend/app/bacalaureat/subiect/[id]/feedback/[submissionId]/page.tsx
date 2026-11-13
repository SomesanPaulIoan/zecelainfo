import { BacSubmissionFeedbackClient } from "@/components/bac/BacSubmissionFeedbackClient";
import { RequireAuth } from "@/components/auth/RequireAuth";

type PageProps = {
  params: Promise<{
    id: string;
    submissionId: string;
  }>;
};

export default async function BacSubmissionFeedbackPage({ params }: PageProps) {
  const resolved = await params;
  return (
    <RequireAuth>
      <BacSubmissionFeedbackClient subjectId={resolved.id} submissionId={resolved.submissionId} />
    </RequireAuth>
  );
}
