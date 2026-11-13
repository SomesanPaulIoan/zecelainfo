import { Suspense } from "react";
import { apiFetch } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";
import { Offers2027PageClient, type Offer2027Code } from "@/components/offers/Offers2027PageClient";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Oferte Admitere 2027 – Curs Video + Grile",
  description:
    "Pachete promoționale pentru admitere 2027: curs video complet + acces la grile până la 1 August 2027. Oferte UB, UNSTPB, UBB.",
  path: "/oferte-2027",
});

type CatalogResponse = {
  data: {
    access_until: string;
    items: Array<{
      code: Offer2027Code;
      title: string;
      subtitle: string;
      badge: string | null;
      includes_course: boolean;
      includes_grile: boolean;
      course_slug: string | null;
      course_name: string | null;
      parts_count: number;
      course_hours: number;
      lessons_count: number;
      grile_questions_count: number;
      catalog_course_ron: number;
      catalog_grile_ron: number;
      catalog_total_ron: number;
      promo_price_ron: number;
      savings_ron: number;
      savings_percent: number;
      access_until_label: string;
    }>;
  };
};

export default async function Oferte2027Page() {
  let initialCatalog: CatalogResponse["data"] | null = null;
  try {
    const response = await apiFetch<CatalogResponse>("/api/offers-2027/catalog");
    initialCatalog = response.data;
  } catch {
    initialCatalog = null;
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 p-10 text-center text-white">Se încarcă...</div>}>
      <Offers2027PageClient initialCatalog={initialCatalog} />
    </Suspense>
  );
}
