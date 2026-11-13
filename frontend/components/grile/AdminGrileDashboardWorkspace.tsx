"use client";

import { useState } from "react";
import { AdminGrileAIWorkspace } from "@/components/grile/AdminGrileAIWorkspace";
import { AdminGrileSourcesTab } from "@/components/grile/AdminGrileSourcesTab";

type TabId = "sources" | "ai";

export function AdminGrileDashboardWorkspace() {
  const [tab, setTab] = useState<TabId>("sources");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Admin Grile</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Gestioneaza surse draft/publicate, incarca grile si ruleaza AI pentru indicii si explicatii.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("sources")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === "sources" ? "bg-violet-600 text-white" : "border border-zinc-300 bg-white text-zinc-800"
          }`}
        >
          Gestionare surse
        </button>
        <button
          type="button"
          onClick={() => setTab("ai")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === "ai" ? "bg-violet-600 text-white" : "border border-zinc-300 bg-white text-zinc-800"
          }`}
        >
          AI Grile (review)
        </button>
      </div>

      {tab === "sources" ? <AdminGrileSourcesTab /> : <AdminGrileAIWorkspace />}
    </div>
  );
}
