import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Meditații Informatică 2026–2027 – Grupe Mici pentru Bac și Admitere",
  description:
    "Meditații la informatică cu Paul-Ioan Someșan: grupe de maximum 5 elevi, pregătire pentru Bacalaureat și admitere (UBB, UB, Politehnica, Iași). Înscrieri 2026–2027.",
  path: "/meditatii",
});

export default function MeditatiiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
