"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import { BillingProfileCheckoutModal } from "@/components/billing/BillingProfileCheckoutModal";
import { GrileTrialSmsModal } from "@/components/grile/GrileTrialSmsModal";
import {
  getPlanCheckoutLabels,
  GrilePublicSummary,
  GrileSubscriptionPlanGrid,
  PlanCode,
} from "@/components/grile/GrileSubscriptionPlanGrid";
import { GRILE_PACKAGES_ANCHOR, GRILE_PACKAGES_PATH } from "@/lib/grile-packages";
import { track, trackConfirmedPurchase } from "@/lib/track";
type AccessStatusResponse = {
  data: {
    has_access: boolean;
    access_until: string | null;
    trial_used: boolean;
    current_plan_code: string | null;
    trial_available?: boolean;
    trial_unavailable_message?: string | null;
  };
};

type CreatePaymentResponse = {
  data: {
    attempt_id: string;
    checkout_url: string | null;
    direct_paid?: boolean;
  };
};

type ConfirmPaymentResponse = {
  data: {
    ok: boolean;
    payment_status: "paid" | "pending";
    purchase?: { event_id: string; product_code: string; value: number; currency: string };
    has_access?: boolean;
    access_until?: string | null;
    invoice_number?: string | null;
    invoice_url?: string | null;
    local_redirect_url?: string;
  };
};

const PLAN_PRICE_RON: Record<PlanCode, number> = {
  free_24h: 0,
  month_1: 150,
  month_3: 399,
  until_2027: 699,
};

type Props = {
  children: React.ReactNode;
};

export function GrileAccessGate({ children }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, refreshUser } = useAuth();
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<AccessStatusResponse["data"] | null>(null);
  const [selectedPlanCode, setSelectedPlanCode] = useState<PlanCode | null>(null);
  const [billingOpen, setBillingOpen] = useState(false);
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<GrilePublicSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadStatus = async () => {
      if (!user) {
        setStatus(null);
        setChecking(false);
        return;
      }
      setChecking(true);
      try {
        const response = await apiFetch<AccessStatusResponse>("/api/grile/access/status");
        if (cancelled) return;
        setStatus(response.data);
      } catch {
        if (!cancelled) setStatus({ has_access: false, access_until: null, trial_used: false, current_plan_code: null });
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    if (!loading) void loadStatus();
    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  useEffect(() => {
    let cancelled = false;
    if (loading || checking) return;
    if (status?.has_access) return;
    void (async () => {
      setSummaryLoading(true);
      try {
        const response = await apiFetch<{ data: GrilePublicSummary }>("/api/grile/summary");
        if (!cancelled) setSummary(response.data);
      } catch {
        if (!cancelled) setSummary(null);
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading, checking, status?.has_access]);

  useEffect(() => {
    const payment = searchParams.get("payment");
    const attempt = searchParams.get("attempt");
    if (payment !== "success" || !attempt) return;
    let cancelled = false;
    const confirm = async () => {
      setChecking(true);
      try {
        const response = await apiFetch<ConfirmPaymentResponse>("/api/grile/access/confirm-payment", {
          method: "POST",
          body: JSON.stringify({ attemptId: attempt }),
        });
        if (cancelled) return;
        if (response.data.payment_status === "paid") {
          trackConfirmedPurchase(response.data.purchase);
          setPaymentMessage(
            response.data.invoice_number
              ? `Plata confirmata. Factura emisa: ${response.data.invoice_number}.`
              : "Plata confirmata. Accesul la grile este activ.",
          );
          if (user) {
            const statusResponse = await apiFetch<AccessStatusResponse>("/api/grile/access/status");
            if (!cancelled) setStatus(statusResponse.data);
          }
          const onNgrok = typeof window !== "undefined" && window.location.hostname.includes("ngrok");
          if (!cancelled && onNgrok && response.data.local_redirect_url) {
            window.location.href = response.data.local_redirect_url;
            return;
          }
        } else {
          setPaymentMessage("Plata este inca in procesare la Revolut. Reincarca pagina in cateva secunde.");
        }
      } catch {
        if (!cancelled) {
          setPaymentMessage("Nu am putut confirma plata acum. Verifica istoricul si incearca din nou.");
        }
      } finally {
        if (!cancelled) setChecking(false);
        if (!cancelled) router.replace("/grile");
      }
    };
    void confirm();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams, user]);

  const hasAccess = Boolean(status?.has_access);
  const showPlans = !loading && !checking && !hasAccess;

  useEffect(() => {
    if (!showPlans || summaryLoading) return;
    if (window.location.hash !== `#${GRILE_PACKAGES_ANCHOR}`) return;
    document.getElementById(GRILE_PACKAGES_ANCHOR)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showPlans, summaryLoading]);

  const selectedBillingPlan = useMemo(() => getPlanCheckoutLabels(selectedPlanCode), [selectedPlanCode]);

  const selectedPlanPriceRon = selectedPlanCode ? PLAN_PRICE_RON[selectedPlanCode] : 0;

  const openPlanChoice = (planCode: PlanCode) => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(GRILE_PACKAGES_PATH)}`);
      return;
    }
    if (planCode === "free_24h") {
      setTrialModalOpen(true);
      return;
    }
    setSelectedPlanCode(planCode);
    setBillingOpen(true);
  };

  if (loading || checking) {
    return <div className="rounded-xl border border-sky-100 bg-white p-4 text-sm text-slate-600">Se verifica accesul la grile...</div>;
  }

  if (hasAccess) {
    return (
      <>
        {paymentMessage ? (
          <p className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-900">{paymentMessage}</p>
        ) : null}
        {children}
      </>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/80 to-white p-5 shadow-sm sm:p-7">
      {!user ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3">
          <p className="text-sm font-semibold text-sky-950">
            Ca să activezi un abonament ai nevoie de un cont. Alege pachetul și te ducem la login.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/login?next=${encodeURIComponent(GRILE_PACKAGES_PATH)}`}
              className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-100"
            >
              Login
            </Link>
            <Link
              href={`/register?next=${encodeURIComponent(GRILE_PACKAGES_PATH)}`}
              className="rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-amber-200/80 hover:bg-amber-50/60"
            >
              Creează cont
            </Link>
          </div>
        </div>
      ) : null}
      <GrileSubscriptionPlanGrid
        summary={summary}
        summaryLoading={summaryLoading}
        onSelectPlan={openPlanChoice}
      />
      <GrileTrialSmsModal
        open={trialModalOpen}
        onClose={() => setTrialModalOpen(false)}
        onActivated={async () => {
          setTrialModalOpen(false);
          setPaymentMessage("Trial gratuit de 24h activat! Ai acces la tot site-ul: toate grilele și toate cursurile.");
          const statusResponse = await apiFetch<AccessStatusResponse>("/api/grile/access/status");
          setStatus(statusResponse.data);
        }}
      />
      <BillingProfileCheckoutModal
        open={billingOpen}
        fieldIdPrefix="grile-billing"
        discount={
          selectedPlanCode && selectedPlanPriceRon > 0
            ? { scope: "grile", baseAmountRon: selectedPlanPriceRon }
            : undefined
        }
        summary={
          selectedBillingPlan ? (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Achizitionezi</p>
              <p className="mt-1 text-xl font-bold text-sky-950">{selectedBillingPlan.title}</p>
              <p className="mt-0.5 text-sm text-slate-700">{selectedBillingPlan.subtitle}</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {selectedBillingPlan.price}
                <span className="text-base font-semibold text-slate-500"> {selectedBillingPlan.period}</span>
              </p>
            </div>
          ) : null
        }
        submitLabel="Cumpara"
        onClose={() => {
          setBillingOpen(false);
          setSelectedPlanCode(null);
        }}
        onConfirm={async (profile, extras) => {
          if (!selectedPlanCode) throw new Error("missing plan");
          const response = await apiFetch<CreatePaymentResponse>("/api/grile/access/create-payment", {
            method: "POST",
            body: JSON.stringify({
              planCode: selectedPlanCode,
              acceptTerms: true,
              billingProfile: profile,
              discountCode: extras?.discountCode ?? undefined,
            }),
          });
          track({
            name: "begin_checkout",
            eventId: `checkout_${response.data.attempt_id}`,
            productCode: selectedPlanCode,
            value: selectedPlanPriceRon,
          });
          if (response.data.direct_paid || !response.data.checkout_url) {
            setBillingOpen(false);
            setSelectedPlanCode(null);
            setPaymentMessage("Comanda a fost inregistrata cu succes. Accesul la grile este activ (fara plata Revolut).");
            const statusResponse = await apiFetch<AccessStatusResponse>("/api/grile/access/status");
            setStatus(statusResponse.data);
            return;
          }
          window.location.href = response.data.checkout_url;
        }}
      />
    </section>
  );
}
