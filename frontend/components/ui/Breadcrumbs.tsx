import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo";

/** Breadcrumbs vizibile + BreadcrumbList JSON-LD din aceeasi sursa, ca sa nu poata diverge. */
export function Breadcrumbs({ items, className = "" }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(items)} />
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs font-semibold text-slate-500">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-1.5">
                {isLast ? (
                  <span aria-current="page" className="text-sky-900">
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link href={item.path} className="rounded hover:text-sky-800 hover:underline">
                      {item.name}
                    </Link>
                    <span aria-hidden="true" className="text-slate-300">
                      /
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
