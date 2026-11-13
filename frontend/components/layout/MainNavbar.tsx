"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import { EXAMS, grileExamPath } from "@/lib/exams";
import { PACHETE, pachetPath } from "@/lib/pachete";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { PromoBar } from "@/components/marketing/PromoBar";

/** Lista statica randata pe server (vizibila pentru Google); API-ul o actualizeaza dupa hidratare. */
const INITIAL_GRILE_CATEGORIES = EXAMS.map((exam) => ({
  id: `static-${exam.grileSlug}`,
  slug: exam.grileSlug,
  name: exam.grileSlug === "bacalaureat" ? "Bacalaureat" : `Admitere ${exam.shortName}`,
}));

const DROPDOWN_PANEL =
  "pointer-events-none invisible absolute left-0 top-full z-40 rounded-xl border border-sky-100 bg-white p-2 opacity-0 shadow-lg shadow-sky-900/10 ring-1 ring-sky-100/80 transition group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100";
const DROPDOWN_ITEM = "block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-amber-50 hover:text-sky-950 focus-visible:bg-amber-50 focus-visible:outline-none";
const NAV_LINK = "rounded-lg px-2 py-1 hover:bg-sky-50 hover:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300";

type GrileCategory = {
  id: string;
  slug: string;
  name: string;
};

type GrileCategoriesResponse = {
  data: GrileCategory[];
};

export function MainNavbar() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const [grileCategories, setGrileCategories] = useState<GrileCategory[]>(INITIAL_GRILE_CATEGORIES);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGrileOpen, setMobileGrileOpen] = useState(false);
  const [mobileBacOpen, setMobileBacOpen] = useState(false);
  const [mobilePacheteOpen, setMobilePacheteOpen] = useState(false);

  const closeMobileNav = useCallback(() => {
    setMobileOpen(false);
    setMobilePacheteOpen(false);
    setMobileGrileOpen(false);
    setMobileBacOpen(false);
  }, []);

  useEffect(() => {
    closeMobileNav();
  }, [pathname, closeMobileNav]);

  useEffect(() => {
    let isMounted = true;
    void apiFetch<GrileCategoriesResponse>("/api/grile/categories")
      .then((response) => {
        if (isMounted) setGrileCategories(response.data);
      })
      .catch(() => {
        // Pastram lista statica initiala.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-sky-200/70 bg-white/92 backdrop-blur-lg">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6">
        <Link href="/" aria-label="Zece la Info — pagina principală" className="flex shrink-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
          <Image
            src="/assets/zece-la-info-logo.png"
            alt="Zece la Info"
            width={1000}
            height={300}
            sizes="160px"
            loading="eager"
            className="h-9 w-auto shrink-0 sm:h-11 dark:hidden"
          />
          <Image
            src="/assets/zece-la-info-logo-dark.png"
            alt="Zece la Info"
            width={1000}
            height={300}
            sizes="160px"
            loading="eager"
            className="hidden h-9 w-auto shrink-0 sm:h-11 dark:block"
          />
        </Link>

        <nav aria-label="Navigare principală" className="hidden items-center gap-1 text-sm font-medium text-slate-700 lg:flex xl:gap-3">
          <div className="group relative">
            <Link
              href="/pachete"
              className={`inline-flex items-center gap-1 font-semibold text-amber-800 ${NAV_LINK} hover:bg-amber-50 hover:text-amber-900`}
            >
              Oferte
              <span aria-hidden="true" className="text-[10px]">▼</span>
            </Link>
            <div className={`${DROPDOWN_PANEL} w-60`}>
              {PACHETE.map((pachet) => (
                <Link key={pachet.slug} href={pachetPath(pachet.slug)} className={DROPDOWN_ITEM}>
                  {pachet.label}
                </Link>
              ))}
            </div>
          </div>
          <Link href="/cursuri" className={NAV_LINK}>
            Cursuri
          </Link>
          <div className="group relative">
            <Link href="/grile" className={`inline-flex items-center gap-1 ${NAV_LINK}`}>
              Grile
              <span aria-hidden="true" className="text-[10px]">▼</span>
            </Link>
            <div className={`${DROPDOWN_PANEL} w-64`}>
              {grileCategories.map((category) => (
                <Link key={category.id} href={grileExamPath(category.slug)} className={DROPDOWN_ITEM}>
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="group relative">
            <Link href="/bacalaureat" className={`inline-flex items-center gap-1 ${NAV_LINK}`}>
              Bacalaureat
              <span aria-hidden="true" className="text-[10px]">▼</span>
            </Link>
            <div className={`${DROPDOWN_PANEL} w-56`}>
              <Link href="/bacalaureat/arhiva-de-subiecte" className={DROPDOWN_ITEM}>
                Arhiva de Subiecte
              </Link>
              <Link href="/bacalaureat/rezolva-subiecte" className={DROPDOWN_ITEM}>
                Rezolvă Subiecte
              </Link>
              <Link href="/grile/bacalaureat" className={DROPDOWN_ITEM}>
                Grile Bacalaureat
              </Link>
            </div>
          </div>
          <Link href="/problems" className={NAV_LINK}>
            Probleme
          </Link>
          <Link href="/compilator" className={NAV_LINK}>
            Compilator
          </Link>
          <Link href="/meditatii" className={NAV_LINK}>
            Meditații
          </Link>
          {user ? (
            <Link href="/dashboard" className={NAV_LINK}>
              Dashboard
            </Link>
          ) : null}
        </nav>

        <div className="flex min-w-0 shrink-0 items-center justify-end gap-2">
          <ThemeToggle />
          {loading ? (
            <span aria-hidden="true" className="h-8 w-28 animate-pulse rounded-lg bg-sky-50" />
          ) : user ? (
            <>
              <button
                type="button"
                onClick={() => void signOut()}
                className="hidden rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-amber-50 xl:inline-flex"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden min-h-9 items-center rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-amber-50 sm:inline-flex">
                Login
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-9 items-center whitespace-nowrap rounded-lg bg-gradient-to-br from-sky-600 via-sky-700 to-blue-950 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-sky-900/20 ring-1 ring-yellow-300/70 hover:from-sky-500 hover:to-blue-900"
              >
                Creează cont
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="meniu-mobil"
            aria-label={mobileOpen ? "Închide meniul" : "Deschide meniul"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-sky-200 bg-white text-base text-slate-700 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 lg:hidden"
          >
            <span aria-hidden="true">{mobileOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div id="meniu-mobil" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-sky-100 bg-white px-4 pb-4 pt-2 lg:hidden">
          <nav aria-label="Navigare mobilă" className="space-y-1 text-base text-slate-800">
            <Link href="/" onClick={closeMobileNav} className="block rounded-lg px-3 py-2.5 font-medium hover:bg-sky-50">
              Acasă
            </Link>
            <button
              type="button"
              onClick={() => setMobilePacheteOpen((prev) => !prev)}
              aria-expanded={mobilePacheteOpen}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left font-semibold text-amber-800 hover:bg-amber-50"
            >
              Oferte <span aria-hidden="true" className="text-xs">{mobilePacheteOpen ? "▲" : "▼"}</span>
            </button>
            {mobilePacheteOpen ? (
              <div className="ml-2 space-y-1">
                <Link href="/pachete" onClick={closeMobileNav} className="block rounded-lg px-3 py-2.5 hover:bg-amber-50">
                  Toate ofertele
                </Link>
                {PACHETE.map((pachet) => (
                  <Link key={pachet.slug} href={pachetPath(pachet.slug)} onClick={closeMobileNav} className="block rounded-lg px-3 py-2.5 hover:bg-amber-50">
                    {pachet.label}
                  </Link>
                ))}
              </div>
            ) : null}
            <Link href="/cursuri" onClick={closeMobileNav} className="block rounded-lg px-3 py-2.5 font-medium hover:bg-sky-50">
              Cursuri
            </Link>
            <Link href="/problems" onClick={closeMobileNav} className="block rounded-lg px-3 py-2.5 font-medium hover:bg-sky-50">
              Probleme
            </Link>
            <Link href="/compilator" onClick={closeMobileNav} className="block rounded-lg px-3 py-2.5 font-medium hover:bg-sky-50">
              Compilator
            </Link>

            <button
              type="button"
              onClick={() => setMobileGrileOpen((prev) => !prev)}
              aria-expanded={mobileGrileOpen}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left font-medium hover:bg-sky-50"
            >
              Grile <span aria-hidden="true" className="text-xs">{mobileGrileOpen ? "▲" : "▼"}</span>
            </button>
            {mobileGrileOpen ? (
              <div className="ml-2 space-y-1">
                {grileCategories.map((category) => (
                  <Link key={category.id} href={grileExamPath(category.slug)} onClick={closeMobileNav} className="block rounded-lg px-3 py-2.5 hover:bg-amber-50">
                    {category.name}
                  </Link>
                ))}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setMobileBacOpen((prev) => !prev)}
              aria-expanded={mobileBacOpen}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left font-medium hover:bg-sky-50"
            >
              Bacalaureat <span aria-hidden="true" className="text-xs">{mobileBacOpen ? "▲" : "▼"}</span>
            </button>
            {mobileBacOpen ? (
              <div className="ml-2 space-y-1">
                <Link href="/bacalaureat/arhiva-de-subiecte" onClick={closeMobileNav} className="block rounded-lg px-3 py-2.5 hover:bg-amber-50">
                  Arhiva de Subiecte
                </Link>
                <Link href="/bacalaureat/rezolva-subiecte" onClick={closeMobileNav} className="block rounded-lg px-3 py-2.5 hover:bg-amber-50">
                  Rezolvă Subiecte
                </Link>
                <Link href="/grile/bacalaureat" onClick={closeMobileNav} className="block rounded-lg px-3 py-2.5 hover:bg-amber-50">
                  Grile Bacalaureat
                </Link>
              </div>
            ) : null}
            <Link href="/meditatii" onClick={closeMobileNav} className="block rounded-lg px-3 py-2.5 font-medium hover:bg-sky-50">
              Meditații
            </Link>

            {user ? (
              <>
                <Link href="/dashboard" onClick={closeMobileNav} className="block rounded-lg px-3 py-2.5 font-medium hover:bg-sky-50">
                  Dashboard
                </Link>
                <div className="mt-2 border-t border-sky-100 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileNav();
                      void signOut();
                    }}
                    className="block w-full rounded-lg px-3 py-2.5 text-left font-medium text-rose-700 hover:bg-rose-50"
                  >
                    Deconectare
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-2 space-y-1 border-t border-sky-100 pt-2">
                <Link href="/login" onClick={closeMobileNav} className="block rounded-lg px-3 py-2.5 font-medium hover:bg-sky-50">
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={closeMobileNav}
                  className="block rounded-lg bg-gradient-to-br from-sky-600 via-sky-700 to-blue-950 px-3 py-2.5 text-center font-semibold text-white"
                >
                  Creează cont
                </Link>
              </div>
            )}
          </nav>
        </div>
      ) : null}
      <PromoBar />
    </header>
  );
}
