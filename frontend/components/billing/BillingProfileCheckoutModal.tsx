"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  buildBillingProfilePayload,
  emptyBillingForm,
  isPersistableBillingForm,
  type BillingFormSnapshot,
  type BillingProfilePutPayload,
} from "@/lib/billingProfileForm";

function getReadableApiError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  const marker = ": ";
  const markerIndex = error.message.indexOf(marker);
  if (markerIndex < 0) return error.message || fallback;
  const maybeJson = error.message.slice(markerIndex + marker.length);
  try {
    const parsed = JSON.parse(maybeJson) as { error?: string };
    if (parsed?.error?.trim()) return parsed.error.trim();
  } catch {
    // fallback below
  }
  return error.message || fallback;
}

export type DiscountCheckoutScope = "site" | "courses" | "grile" | "bac_correction";

type DiscountValidateResponse = {
  data: {
    valid: boolean;
    message?: string;
    code?: string;
    percent_off?: number;
    final_amount_ron?: number | null;
  };
};

type BillingProfileResponse = {
  data: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    county: string;
    city: string;
    street: string;
    street_number: string;
    invoice_on_company: boolean;
    company_name: string;
    company_cui: string;
  };
};

type Props = {
  open: boolean;
  /** Prefix unic pentru id-uri accesibile (ex. grile-billing, course-purchase) */
  fieldIdPrefix: string;
  summary: ReactNode;
  /** Mesaj afisat sub sumar, inainte de formular (ex. durata accesului la curs). */
  checkoutNotice?: ReactNode;
  submitLabel?: string;
  /** Modal mai ingust si cu spatieri mai mici (ex. corectare BAC). */
  size?: "default" | "compact";
  /** Daca e setat si `baseAmountRon` > 0, afiseaza camp cod + validare la `/api/discount-codes/validate`. */
  discount?: { scope: DiscountCheckoutScope; baseAmountRon: number };
  onClose: () => void;
  onConfirm: (profile: BillingProfilePutPayload, extras?: { discountCode?: string | null }) => Promise<void>;
};

export function BillingProfileCheckoutModal({
  open,
  fieldIdPrefix,
  summary,
  checkoutNotice,
  submitLabel = "Finalizeaza comanda",
  size = "default",
  discount,
  onClose,
  onConfirm,
}: Props) {
  const { user } = useAuth();
  const [billingLoading, setBillingLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [billingForm, setBillingForm] = useState<BillingFormSnapshot>(emptyBillingForm);
  const [discountInput, setDiscountInput] = useState("");
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountValidating, setDiscountValidating] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number; finalRon: number } | null>(null);

  const billingFormRef = useRef(billingForm);
  useEffect(() => {
    billingFormRef.current = billingForm;
  }, [billingForm]);

  const persistBillingDraftSilently = useCallback(async () => {
    const form = billingFormRef.current;
    if (!isPersistableBillingForm(form)) return;
    try {
      await apiFetch<{ data: { ok: boolean } }>("/api/grile/access/billing-profile", {
        method: "PUT",
        body: JSON.stringify({ billingProfile: buildBillingProfilePayload(form) }),
      });
    } catch {
      // autosave silent
    }
  }, []);

  const billingFormSer = useMemo(() => JSON.stringify(billingForm), [billingForm]);

  useEffect(() => {
    if (!open || billingLoading) return;
    const t = window.setTimeout(() => {
      void persistBillingDraftSilently();
    }, 1200);
    return () => window.clearTimeout(t);
  }, [open, billingLoading, billingFormSer, persistBillingDraftSilently]);

  useEffect(() => {
    if (!open) return;
    setDiscountInput("");
    setDiscountError(null);
    setAppliedDiscount(null);
    setDiscountValidating(false);
  }, [open, discount?.scope, discount?.baseAmountRon, fieldIdPrefix]);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    setAcceptTerms(false);
    setBillingError(null);
    setBillingLoading(true);
    void apiFetch<BillingProfileResponse>("/api/grile/access/billing-profile")
      .then((response) => {
        if (cancelled) return;
        setBillingForm({
          firstName: response.data.first_name ?? "",
          lastName: response.data.last_name ?? "",
          email: response.data.email ?? "",
          county: response.data.county ?? "",
          city: response.data.city ?? "",
          street: response.data.street ?? "",
          streetNumber: response.data.street_number ?? "",
          phone: response.data.phone ?? "",
          invoiceOnCompany: Boolean(response.data.invoice_on_company),
          companyName: response.data.company_name ?? "",
          companyCui: response.data.company_cui ?? "",
        });
      })
      .catch(() => {
        if (!cancelled) setBillingError("Nu am putut incarca datele de facturare.");
      })
      .finally(() => {
        if (!cancelled) setBillingLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, user?.id]);

  const closeModal = useCallback(async () => {
    await persistBillingDraftSilently();
    onClose();
  }, [onClose, persistBillingDraftSilently]);

  const showDiscountRow = Boolean(discount && discount.baseAmountRon > 0.0001);

  const handleApplyDiscount = async () => {
    if (!discount || discount.baseAmountRon <= 0) return;
    const raw = discountInput.trim();
    setDiscountError(null);
    if (!raw) {
      setAppliedDiscount(null);
      setDiscountError("Introdu un cod.");
      return;
    }
    setDiscountValidating(true);
    try {
      const response = await apiFetch<DiscountValidateResponse>("/api/discount-codes/validate", {
        method: "POST",
        body: JSON.stringify({
          code: raw,
          scope: discount.scope,
          baseAmountRon: discount.baseAmountRon,
        }),
      });
      if (!response.data.valid) {
        setAppliedDiscount(null);
        setDiscountError(response.data.message ?? "Cod invalid.");
        return;
      }
      const pct = response.data.percent_off ?? 0;
      const fin =
        response.data.final_amount_ron != null && Number.isFinite(response.data.final_amount_ron)
          ? Number(response.data.final_amount_ron)
          : discount.baseAmountRon;
      setAppliedDiscount({
        code: (response.data.code ?? raw).toUpperCase(),
        percent: pct,
        finalRon: fin,
      });
    } catch (error) {
      setAppliedDiscount(null);
      setDiscountError(getReadableApiError(error, "Nu am putut valida codul."));
    } finally {
      setDiscountValidating(false);
    }
  };

  const handleSubmit = async () => {
    if (!acceptTerms) {
      setBillingError("Trebuie sa accepti termenii si conditiile.");
      return;
    }
    if (!isPersistableBillingForm(billingForm)) {
      setBillingError("Completeaza toate campurile obligatorii (inclusiv telefon, minim 6 caractere).");
      return;
    }
    let discountCodeToSend: string | null = null;
    if (showDiscountRow) {
      const typed = discountInput.trim();
      if (typed) {
        if (!appliedDiscount || appliedDiscount.code !== typed.toUpperCase().replace(/\s+/g, "")) {
          setBillingError('Apasa „Aplica” pe codul de reducere sau goleste campul.');
          return;
        }
        discountCodeToSend = appliedDiscount.code;
      }
    }
    setBillingError(null);
    setSubmitting(true);
    try {
      await onConfirm(buildBillingProfilePayload(billingForm), { discountCode: discountCodeToSend });
      onClose();
    } catch (error) {
      setBillingError(getReadableApiError(error, "Operatiunea nu a putut fi finalizata acum. Incearca din nou."));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const id = (suffix: string) => `${fieldIdPrefix}-${suffix}`;
  const compact = size === "compact";

  const overlayClass = compact
    ? "fixed inset-0 z-[200] flex min-h-0 items-center justify-center overflow-y-auto overscroll-contain bg-black/45 px-3 py-8 sm:px-4 sm:py-10"
    : "fixed inset-0 z-[200] flex min-h-0 items-center justify-center overflow-y-auto overscroll-contain bg-black/45 px-3 py-8 sm:px-6 sm:py-10";

  const panelClass = compact
    ? "relative flex w-full max-h-[min(92dvh,calc(100dvh-2rem))] max-w-xl flex-col overflow-hidden rounded-xl border border-sky-100 bg-white shadow-2xl"
    : "relative flex w-full max-h-[min(92dvh,calc(100dvh-2rem))] max-w-3xl flex-col overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-2xl lg:max-w-4xl";

  const panelHeaderClass = "shrink-0 border-b border-sky-100/90 bg-white px-4 py-3 sm:px-5";
  const panelBodyClass =
    "min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y px-4 pb-4 pt-3 [-webkit-overflow-scrolling:touch] sm:px-5 sm:pb-5 sm:pt-4";

  const headerRowClass = "flex items-center justify-between gap-2";
  const titleClass = compact ? "text-base font-bold text-sky-950" : "text-lg font-bold text-sky-950";
  const summaryWrapClass = compact ? "mb-3" : "mb-4";
  const formSpaceClass = compact ? "space-y-2" : "space-y-3";
  const gridGapClass = compact ? "gap-2" : "gap-3";
  const inputPadClass = compact ? "px-3 py-1.5 text-sm" : "px-3 py-2 text-sm";

  const modalTree = (
    <div className={overlayClass}>
      <div className={panelClass} role="dialog" aria-modal="true" aria-labelledby={id("dialog-title")}>
        <div className={panelHeaderClass}>
          <div className={headerRowClass}>
            <h3 id={id("dialog-title")} className={titleClass}>
              Date de facturare
            </h3>
            <button
              type="button"
              onClick={() => void closeModal()}
              className="shrink-0 rounded-lg border border-sky-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-sky-50"
            >
              Inchide
            </button>
          </div>
        </div>
        <div className={panelBodyClass}>
          {summary ? <div className={summaryWrapClass}>{summary}</div> : null}
        {checkoutNotice ? (
          <div className="mb-3 rounded-xl border border-sky-200/90 bg-sky-50/95 px-3 py-2.5 text-sm leading-relaxed text-slate-800 shadow-sm">
            {checkoutNotice}
          </div>
        ) : null}
        {showDiscountRow ? (
          <div className="mb-3 rounded-xl border border-emerald-200/90 bg-emerald-50/90 px-3 py-2.5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Cod reducere</p>
            <p className="mt-0.5 text-xs text-slate-700">
              Pret lista: <span className="font-semibold">{discount!.baseAmountRon.toFixed(2)} RON</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                id={id("discount-code")}
                value={discountInput}
                onChange={(e) => {
                  setDiscountInput(e.target.value);
                  setDiscountError(null);
                }}
                placeholder="ex. START2026"
                className="min-w-[160px] flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => void handleApplyDiscount()}
                disabled={discountValidating}
                className="rounded-lg border border-emerald-600 bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                {discountValidating ? "..." : "Aplica"}
              </button>
            </div>
            {discountError ? <p className="mt-2 text-xs font-medium text-rose-600">{discountError}</p> : null}
            {appliedDiscount ? (
              <p className="mt-2 text-sm font-semibold text-emerald-900">
                Cod <span className="font-mono">{appliedDiscount.code}</span>: {appliedDiscount.percent}% reducere — total estimat{" "}
                <span className="text-slate-900">{appliedDiscount.finalRon.toFixed(2)} RON</span>
                {appliedDiscount.finalRon <= 0.001 ? <span className="block text-xs font-normal text-slate-600">(fara plata Revolut)</span> : null}
              </p>
            ) : null}
          </div>
        ) : null}
        {billingLoading ? <p className="text-sm text-slate-600">Se incarca datele...</p> : null}
        {!billingLoading ? (
          <form
            className={formSpaceClass}
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
          >
            <p className="text-xs text-slate-600">
              Campurile marcate cu <span className="text-rose-600">*</span> sunt obligatorii.
              {billingForm.invoiceOnCompany ? (
                <span> Pentru factura pe firma, si campurile firmei sunt obligatorii.</span>
              ) : null}
            </p>
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridGapClass}`}>
              <div className="min-w-0">
                <label htmlFor={id("first-name")} className="mb-1 block text-xs font-medium text-slate-700">
                  Nume <span className="text-rose-600">*</span>
                </label>
                <input
                  id={id("first-name")}
                  name="firstName"
                  value={billingForm.firstName}
                  onChange={(e) => setBillingForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  className={`w-full rounded-lg border border-sky-200 ${inputPadClass} outline-none focus:border-sky-400`}
                  placeholder="Nume"
                  required
                  autoComplete="family-name"
                />
              </div>
              <div className="min-w-0">
                <label htmlFor={id("last-name")} className="mb-1 block text-xs font-medium text-slate-700">
                  Prenume <span className="text-rose-600">*</span>
                </label>
                <input
                  id={id("last-name")}
                  name="lastName"
                  value={billingForm.lastName}
                  onChange={(e) => setBillingForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  className={`w-full rounded-lg border border-sky-200 ${inputPadClass} outline-none focus:border-sky-400`}
                  placeholder="Prenume"
                  required
                  autoComplete="given-name"
                />
              </div>
              <div className="min-w-0">
                <label htmlFor={id("email")} className="mb-1 block text-xs font-medium text-slate-700">
                  Email <span className="text-rose-600">*</span>
                </label>
                <input
                  id={id("email")}
                  name="email"
                  value={billingForm.email}
                  readOnly
                  className={`w-full rounded-lg border border-sky-100 bg-sky-50 ${inputPadClass} text-slate-600`}
                  placeholder="Email"
                  autoComplete="email"
                  aria-required="true"
                />
              </div>
              <div className="min-w-0">
                <label htmlFor={id("phone")} className="mb-1 block text-xs font-medium text-slate-700">
                  Telefon <span className="text-rose-600">*</span>
                </label>
                <input
                  id={id("phone")}
                  name="phone"
                  value={billingForm.phone}
                  onChange={(e) => setBillingForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className={`w-full rounded-lg border border-sky-200 ${inputPadClass} outline-none focus:border-sky-400`}
                  placeholder="Telefon"
                  required
                  minLength={6}
                  maxLength={32}
                  autoComplete="tel"
                />
              </div>
              <div className="min-w-0">
                <label htmlFor={id("county")} className="mb-1 block text-xs font-medium text-slate-700">
                  Judet <span className="text-rose-600">*</span>
                </label>
                <input
                  id={id("county")}
                  name="county"
                  value={billingForm.county}
                  onChange={(e) => setBillingForm((prev) => ({ ...prev, county: e.target.value }))}
                  className={`w-full rounded-lg border border-sky-200 ${inputPadClass} outline-none focus:border-sky-400`}
                  placeholder="Judet"
                  required
                  autoComplete="address-level1"
                />
              </div>
              <div className="min-w-0">
                <label htmlFor={id("city")} className="mb-1 block text-xs font-medium text-slate-700">
                  Localitate <span className="text-rose-600">*</span>
                </label>
                <input
                  id={id("city")}
                  name="city"
                  value={billingForm.city}
                  onChange={(e) => setBillingForm((prev) => ({ ...prev, city: e.target.value }))}
                  className={`w-full rounded-lg border border-sky-200 ${inputPadClass} outline-none focus:border-sky-400`}
                  placeholder="Localitate"
                  required
                  autoComplete="address-level2"
                />
              </div>
              <div className="min-w-0">
                <label htmlFor={id("street")} className="mb-1 block text-xs font-medium text-slate-700">
                  Strada <span className="text-rose-600">*</span>
                </label>
                <input
                  id={id("street")}
                  name="street"
                  value={billingForm.street}
                  onChange={(e) => setBillingForm((prev) => ({ ...prev, street: e.target.value }))}
                  className={`w-full rounded-lg border border-sky-200 ${inputPadClass} outline-none focus:border-sky-400`}
                  placeholder="Strada"
                  required
                  autoComplete="street-address"
                />
              </div>
              <div className="min-w-0">
                <label htmlFor={id("street-number")} className="mb-1 block text-xs font-medium text-slate-700">
                  Numar <span className="text-rose-600">*</span>
                </label>
                <input
                  id={id("street-number")}
                  name="streetNumber"
                  value={billingForm.streetNumber}
                  onChange={(e) => setBillingForm((prev) => ({ ...prev, streetNumber: e.target.value }))}
                  className={`w-full rounded-lg border border-sky-200 ${inputPadClass} outline-none focus:border-sky-400`}
                  placeholder="Numar"
                  required
                  autoComplete="address-line2"
                />
              </div>
              <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={billingForm.invoiceOnCompany}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setBillingForm((prev) => ({
                      ...prev,
                      invoiceOnCompany: checked,
                      ...(checked ? {} : { companyName: "", companyCui: "" }),
                    }));
                  }}
                  className="mt-0.5"
                />
                <span>Doresc factura pe firma (optional)</span>
              </label>
              {billingForm.invoiceOnCompany ? (
                <>
                  <div className="min-w-0">
                    <label htmlFor={id("company-name")} className="mb-1 block text-xs font-medium text-slate-700">
                      Denumire firma <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id={id("company-name")}
                      name="companyName"
                      value={billingForm.companyName}
                      onChange={(e) => setBillingForm((prev) => ({ ...prev, companyName: e.target.value }))}
                      className={`w-full rounded-lg border border-sky-200 ${inputPadClass} outline-none focus:border-sky-400`}
                      placeholder="Denumire firma"
                      required
                      minLength={2}
                      autoComplete="organization"
                    />
                  </div>
                  <div className="min-w-0">
                    <label htmlFor={id("company-cui")} className="mb-1 block text-xs font-medium text-slate-700">
                      CUI firma <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id={id("company-cui")}
                      name="companyCui"
                      value={billingForm.companyCui}
                      onChange={(e) => setBillingForm((prev) => ({ ...prev, companyCui: e.target.value }))}
                      className={`w-full rounded-lg border border-sky-200 ${inputPadClass} outline-none focus:border-sky-400`}
                      placeholder="CUI firma"
                      required
                      minLength={2}
                      autoComplete="off"
                    />
                  </div>
                </>
              ) : null}
            </div>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                required
                className="mt-0.5"
              />
              <span>
                Accept termenii si conditiile. <span className="text-rose-600">*</span>
              </span>
            </label>
            {billingError ? <p className="text-sm font-semibold text-rose-600">{billingError}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full rounded-xl border border-amber-200/90 bg-amber-50/95 px-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-100 disabled:opacity-60 ${compact ? "py-1.5" : "py-2"}`}
            >
              {submitting ? "Se proceseaza..." : submitLabel}
            </button>
          </form>
        ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(modalTree, document.body);
}
