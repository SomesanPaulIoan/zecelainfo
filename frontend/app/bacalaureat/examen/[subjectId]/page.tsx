"use client";

import { use } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { BacExamStudentWorkspace } from "@/components/bac-exam/BacExamStudentWorkspace";

export default function BacExamPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = use(params);
  return (
    <RequireAuth>
      <BacExamStudentWorkspace subjectId={subjectId} />
    </RequireAuth>
  );
}
