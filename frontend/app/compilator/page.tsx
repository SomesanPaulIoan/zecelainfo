import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PlaygroundWorkspace } from "@/components/playground/PlaygroundWorkspace";

export const metadata: Metadata = pageMetadata({
  title: "Compilator Online C++, C, Pascal și Python",
  description: "Scrie și rulează cod C++, C, Pascal sau Python direct din browser, fără instalare. Compilator online gratuit pentru elevi.",
  path: "/compilator",
});

export default function CompilatorPage() {
  return (
    <>
      <h1 className="sr-only">Compilator online C++, C, Pascal și Python</h1>
      <PlaygroundWorkspace />
    </>
  );
}
