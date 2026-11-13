import type { Metadata } from "next";
import { BacSubjectDetailClient, type BacSubject } from "@/components/bac/BacSubjectDetailClient";
import { JsonLd } from "@/components/seo/JsonLd";
import { apiFetch } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";

const SITE_URL = "https://zecelainfo.ro";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const response = await apiFetch<{ data: BacSubject }>(`/api/bacalaureat/subjects/${id}`);
    const subject = response.data;
    return pageMetadata({
      title: subject.name,
      description: `${subject.name} — ${subject.year ?? ""} • ${subject.tip === "oficial" ? "subiect oficial" : "subiect de antrenament"} de bacalaureat la informatică, cu PDF și barem de corectare.`,
      path: `/bacalaureat/subiect/${id}`,
    });
  } catch {
    return {};
  }
}

export default async function BacSubjectPage({ params }: PageProps) {
  const { id } = await params;
  try {
    const response = await apiFetch<{ data: BacSubject }>(`/api/bacalaureat/subjects/${id}`);
    return (
      <>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Arhiva de Subiecte", item: `${SITE_URL}/bacalaureat/arhiva-de-subiecte` },
              { "@type": "ListItem", position: 2, name: response.data.name, item: `${SITE_URL}/bacalaureat/subiect/${id}` },
            ],
          }}
        />
        <BacSubjectDetailClient subjectId={id} initialSubject={response.data} />
      </>
    );
  } catch {
    return (
      <main className="mx-auto max-w-6xl px-6 py-14 text-sm font-semibold text-rose-700">
        Subiectul nu a fost gasit.
      </main>
    );
  }
}
