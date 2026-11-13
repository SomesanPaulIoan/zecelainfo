import type { Metadata } from "next";
import { TrialEndedClient } from "@/components/trial/TrialEndedClient";
import { getPublicPricing } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Continuă pregătirea",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function TrialIncheiatPage() {
  const pricing = await getPublicPricing();
  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-[radial-gradient(circle_at_top_right,_var(--glow-amber),_var(--glow-blue)_38%,_var(--glow-blue-deep)_88%)]">
      <TrialEndedClient pricing={pricing} />
    </main>
  );
}
