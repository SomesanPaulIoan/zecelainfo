import { redirect } from "next/navigation";
import { examInfo, isExamKey } from "@/lib/attribution";

// Demo-ul de 5 grile fara cont e oprit (decizie 2026-10-13: oferta gratuita principala e trialul de 24h).
// Codul ramane in components/demo/DemoClient.tsx si backend/src/routes/demo.ts (DEMO_ENABLED=1 il porneste).
// Linkurile vechi duc la oferta examenului, cu activarea trialului deschisa, pastrand parametrii utm/ttclid.
export default async function TestGratuitPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const exam = typeof params.exam === "string" ? params.exam : null;
  const target = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key !== "exam" && typeof value === "string") target.set(key, value);
  }
  // Redirect temporar (307), ca demo-ul sa poata fi repornit fara cache de browser.
  if (!isExamKey(exam)) {
    const query = target.toString();
    redirect(query ? `/pachete?${query}` : "/pachete");
  }
  target.set("activeaza", "1");
  redirect(`/pachete/${examInfo(exam).pachet}?${target.toString()}#test-gratuit`);
}
