import { BacSubmissionReviewWorkspace } from "@/components/bac/BacSubmissionReviewWorkspace";
import { RequireAuth } from "@/components/auth/RequireAuth";

type PageProps = {
  params: Promise<{ id: string; submissionId: string }>;
};

export default async function BacSubmissionReviewPage({ params }: PageProps) {
  const { id, submissionId } = await params;
  return (
    <RequireAuth>
      <BacSubmissionReviewWorkspace subjectId={id} submissionId={submissionId} />
    </RequireAuth>
  );
}
