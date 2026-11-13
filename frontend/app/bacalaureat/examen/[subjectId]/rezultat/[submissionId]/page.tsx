"use client";

import { use } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { BacExamResultsWorkspace } from "@/components/bac-exam/BacExamResultsWorkspace";

export default function BacExamResultsPage({
  params,
}: {
  params: Promise<{ subjectId: string; submissionId: string }>;
}) {
  const { subjectId, submissionId } = use(params);
  return (
    <RequireAuth>
      <BacExamResultsWorkspace subjectId={subjectId} submissionId={submissionId} />
    </RequireAuth>
  );
}
