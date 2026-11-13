import { BacAdminReviewWorkspace } from "@/components/bac/BacAdminReviewWorkspace";

type PageProps = {
  params: Promise<{
    submissionId: string;
  }>;
};

export default async function BacReviewSubmissionPage({ params }: PageProps) {
  const resolved = await params;
  return <BacAdminReviewWorkspace submissionId={resolved.submissionId} />;
}
