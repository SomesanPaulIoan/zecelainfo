import type { Metadata } from "next";

export const SITE_URL = "https://zecelainfo.ro";
export const SITE_NAME = "Zece la Info";

type PageMetadataInput = {
  /** Titlul paginii fara sufixul de brand (se adauga automat), sau titlul complet daca `absoluteTitle` e true. */
  title: string;
  description: string;
  /** Calea canonica, relativa la domeniu (ex. `/grile/admitere-ubb`). */
  path: string;
  absoluteTitle?: boolean;
  images?: string[];
  type?: "website" | "article";
};

/**
 * Metadata completa pentru o pagina publica: title, description, canonical, OpenGraph si Twitter.
 * Next combina metadata intre segmente doar superficial, deci `openGraph`/`twitter` trebuie
 * definite integral pe fiecare pagina — altfel preview-ul de share mosteneste titlul/URL-ul homepage-ului.
 */
export function pageMetadata({ title, description, path, absoluteTitle = false, images, type = "website" }: PageMetadataInput): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "ro_RO",
      type,
      ...(images && images.length > 0 ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(images && images.length > 0 ? { images } : {}),
    },
  };
}

export type BreadcrumbItem = { name: string; path: string };

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path === "/" ? "" : item.path}`,
    })),
  };
}

export function formatRoNumber(value: number): string {
  return new Intl.NumberFormat("ro-RO").format(Math.max(0, Math.floor(value)));
}
