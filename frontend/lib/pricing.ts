import { apiFetch } from "@/lib/api";

/** Preturile reale din backend (/api/marketing/pricing): o singura sursa pentru toate paginile comerciale. */
export type PublicPricing = {
  access_until: string;
  grile_plans: Array<{
    code: string;
    name: string;
    price_ron: number;
    duration_days: number | null;
    fixed_until: string | null;
  }>;
  bundles: Array<{
    code: string;
    price_ron: number;
    course_slug: string | null;
    course_name: string | null;
    catalog_course_ron: number;
  }>;
};

export async function getPublicPricing(): Promise<PublicPricing | null> {
  try {
    const response = await apiFetch<{ data: PublicPricing }>("/api/marketing/pricing", { cache: "no-store" });
    return response.data;
  } catch (error) {
    console.error("[pricing] failed to load public pricing:", error);
    return null;
  }
}
