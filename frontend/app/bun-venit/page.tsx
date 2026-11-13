import type { Metadata } from "next";
import { Suspense } from "react";
import { WelcomeClient } from "@/components/trial/WelcomeClient";

export const metadata: Metadata = {
  title: "Bine ai venit",
  robots: { index: false, follow: false },
};

export default function BunVenitPage() {
  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-[radial-gradient(circle_at_top_right,_var(--glow-amber),_var(--glow-blue)_38%,_var(--glow-blue-deep)_88%)]">
      <Suspense fallback={null}>
        <WelcomeClient />
      </Suspense>
    </main>
  );
}
