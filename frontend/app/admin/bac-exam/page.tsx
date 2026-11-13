"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { AdminBacExamBuilder } from "@/components/bac-exam/AdminBacExamBuilder";

export default function AdminBacExamPage() {
  return (
    <RequireAuth>
      <AdminBacExamBuilder />
    </RequireAuth>
  );
}
