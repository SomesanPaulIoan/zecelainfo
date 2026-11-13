"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Black Month: bara rosie de sub meniu. Dispare singura dupa 30 noiembrie (ora Romaniei). */
const PROMO_END = Date.parse("2026-12-01T00:00:00+02:00");

/** Pagini full-screen cu inaltimea calculata pe header (editor probleme, compilator) + admin. */
function isHiddenPath(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/compilator") ||
    /^\/problems\/[^/]+/.test(pathname)
  );
}

export function PromoBar() {
  const pathname = usePathname();
  if (Date.now() >= PROMO_END || isHiddenPath(pathname)) return null;

  return (
    <Link
      href="/pachete"
      className="block bg-red-600 px-3 py-1.5 text-center text-xs font-extrabold uppercase tracking-wide text-white hover:bg-red-700 sm:text-sm"
    >
      <span className="sm:hidden">Black Month: -20% cu codul INFO20</span>
      <span className="hidden sm:inline">
        Black Month: 20% reducere la tot până la 30 noiembrie cu codul{" "}
        <span className="rounded bg-white px-1.5 py-0.5 text-red-700">INFO20</span>
      </span>
    </Link>
  );
}
