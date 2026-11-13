import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProblemGate } from "./ProblemGate";
import { PublicProblemView } from "./PublicProblemView";
import { JsonLd } from "@/components/seo/JsonLd";
import { apiFetch } from "@/lib/api";

const SITE_URL = "https://zecelainfo.ro";

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "usoara",
  medium: "medie",
  hard: "grea",
  facultate: "facultate",
};

function excerptFromStatement(statement: string): string {
  const plain = statement
    .replace(/[#*`_>[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > 160 ? `${plain.slice(0, 157)}...` : plain;
}

type ProblemPageProps = {
  params: Promise<{ slug: string }>;
};

type ProblemResponse = {
  data: {
    id: string;
    title: string;
    statement: string;
    hints?: string | null;
    explanation?: string | null;
    official_solution_cpp?: string | null;
    official_solution_python?: string | null;
    input_format: string;
    output_format: string;
    constraints: string;
    difficulty: "easy" | "medium" | "hard" | "facultate";
    time_limit_ms: number;
    memory_limit_mb: number;
    tags: string[];
    solution_mode?: "full" | "function";
    function_stub_cpp?: string | null;
    function_stub_c?: string | null;
    function_stub_pascal?: string | null;
    function_stub_python?: string | null;
    sample_tests: Array<{
      id: string;
      input: string;
      expected_output: string;
      is_sample: boolean;
      points: number;
    }>;
  };
};

export async function generateMetadata({ params }: ProblemPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const response = await apiFetch<ProblemResponse>(`/api/problems/${slug}`);
    const problem = response.data;
    const difficulty = DIFFICULTY_LABEL[problem.difficulty] ?? problem.difficulty;
    return {
      title: `${problem.title} — problema de informatică (dificultate ${difficulty})`,
      description: excerptFromStatement(problem.statement),
      alternates: { canonical: `/problems/${slug}` },
    };
  } catch {
    return {};
  }
}

export default async function ProblemDetailsPage({ params }: ProblemPageProps) {
  const { slug } = await params;
  let response: ProblemResponse;

  try {
    response = await apiFetch<ProblemResponse>(`/api/problems/${slug}`);
  } catch {
    notFound();
  }

  // Pagina e publica: serverul randeaza doar enuntul (PublicProblemView). Token-ul traieste
  // doar in localStorage, asa ca editorul + datele protejate (indicatii, solutii, istoric)
  // se incarca in client, prin ProblemGate, doar pentru utilizatorii autentificati.
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Probleme", item: `${SITE_URL}/problems` },
            { "@type": "ListItem", position: 2, name: response.data.title, item: `${SITE_URL}/problems/${slug}` },
          ],
        }}
      />
      <ProblemGate
        slug={slug}
        publicView={<PublicProblemView problem={response.data} slug={slug} />}
      />
    </>
  );
}
