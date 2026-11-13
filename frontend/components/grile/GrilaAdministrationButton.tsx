"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { GrilaAdminContentModal, type GrilaAdminContent } from "@/components/grile/GrilaAdminContentModal";

type Props = {
  questionId: string;
  onSaved?: (content: GrilaAdminContent) => void;
  className?: string;
};

export function GrilaAdministrationButton({ questionId, onSaved, className = "" }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (user?.role !== "admin" || !questionId) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          "w-full rounded-xl border-2 border-violet-500 bg-gradient-to-r from-violet-200 to-purple-200 px-3 py-2.5 text-base font-extrabold text-violet-950 transition hover:brightness-95"
        }
      >
        Administrare
      </button>
      <GrilaAdminContentModal
        open={open}
        onClose={() => setOpen(false)}
        questionId={questionId}
        onSaved={onSaved}
      />
    </>
  );
}
