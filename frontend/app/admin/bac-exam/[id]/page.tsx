"use client";

import { use } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AdminBacExamBuilder } from "@/components/bac-exam/AdminBacExamBuilder";

export default function AdminBacExamEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireAuth>
      <AdminBacExamBuilder subjectId={id} />
    </RequireAuth>
  );
}
