"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, user } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      const query = new URLSearchParams();
      if (pathname) query.set("next", pathname);
      query.set("auth_required", "1");
      router.replace(`/login?${query.toString()}`);
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-6 py-12 text-sm text-zinc-500">Se verifica sesiunea...</div>;
  }

  if (!user) return null;
  return <>{children}</>;
}
