"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import { GRILE_PACKAGES_PATH } from "@/lib/grile-packages";

type AccessStatusResponse = {
  data: {
    has_access: boolean;
  };
};

/** Paginile in care chiar se rezolva grile; restul (/grile, /grile/<examen>, capitole) raman vizibile tuturor. */
const SOLVING_PATH = /^\/grile\/(source|chapter)\//;
/** Pagini personale, utile doar cu abonament activ. */
const PERSONAL_PATH = /^\/grile\/(intrebarile-mele|lista-mea)(\/|$)/;

/**
 * Cine nu are acces (nelogat sau logat fara abonament) si deschide o sursa / un capitol e trimis direct la
 * pachetele de pe /grile, ca sa poata cumpara. Nu randeaza nimic.
 */
function GrileAccessRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadStatus = async () => {
      if (!user) {
        setHasAccess(false);
        return;
      }
      setHasAccess(null);
      try {
        const response = await apiFetch<AccessStatusResponse>("/api/grile/access/status");
        if (!cancelled) setHasAccess(Boolean(response.data.has_access));
      } catch {
        if (!cancelled) setHasAccess(false);
      }
    };
    if (!loading) void loadStatus();
    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  useEffect(() => {
    if (loading || hasAccess !== false) return;
    const gated = SOLVING_PATH.test(pathname) || (Boolean(user) && PERSONAL_PATH.test(pathname));
    if (gated) router.replace(GRILE_PACKAGES_PATH);
  }, [hasAccess, loading, pathname, router, user]);

  return null;
}

// <Suspense> inveleste doar logica de redirect, nu si continutul paginii:
// altfel serverul trimitea intai footer-ul si apoi continutul (CLS ~0.95) si statusul 200 inainte de un eventual 404.
export default function GrileLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <GrileAccessRedirect />
      </Suspense>
      {children}
    </>
  );
}
