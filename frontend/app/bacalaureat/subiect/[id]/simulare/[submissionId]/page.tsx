import { BacSimulationWorkspace } from "@/components/bac/BacSimulationWorkspace";
import { RequireAuth } from "@/components/auth/RequireAuth";

type PageProps = {
  params: Promise<{ id: string; submissionId: string }>;
};

export default async function BacSimulationPage({ params }: PageProps) {
  const { id, submissionId } = await params;
  return (
    <RequireAuth>
      <BacSimulationWorkspace subjectId={id} submissionId={submissionId} />
    </RequireAuth>
  );
}
