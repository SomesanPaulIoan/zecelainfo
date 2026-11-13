import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { billingProfileActivateSchema } from "./userBillingProfile.service";

export const SMARTBILL_CURRENCY = "RON";

export type RevolutMerchantConfig = {
  baseUrl: string;
  secretKey: string;
  apiVersion: string;
};

export type SmartbillMerchantConfig = {
  baseUrl: string;
  username: string;
  token: string;
  companyVatCode: string;
  seriesName: string;
  taxName: string;
};

export const getRevolutConfig = (): RevolutMerchantConfig => ({
  baseUrl: process.env.REVOLUT_BASE_URL?.trim() || "https://merchant.revolut.com",
  secretKey: process.env.REVOLUT_SECRET_KEY?.trim() || process.env.REVOLUT_SECRET?.trim() || "",
  apiVersion: process.env.REVOLUT_API_VERSION?.trim() || "2025-12-04",
});

/** Revolut pentru firma de meditații (Zece la Examene etc.) — chei separate de platforma principala. */
export const getMeditationsRevolutConfig = (): RevolutMerchantConfig => ({
  baseUrl: process.env.MEDITATIONS_REVOLUT_BASE_URL?.trim() || "https://merchant.revolut.com",
  secretKey: process.env.MEDITATIONS_REVOLUT_SECRET_KEY?.trim() || "",
  apiVersion:
    process.env.MEDITATIONS_REVOLUT_API_VERSION?.trim() ||
    process.env.REVOLUT_API_VERSION?.trim() ||
    "2025-12-04",
});

export const getAppBaseUrl = () => {
  const configured = process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";
  const fallbackPublic = "https://zecelainfo.ro";
  if (!configured) return fallbackPublic;
  try {
    const parsed = new URL(configured);
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
      return fallbackPublic;
    }
    return configured;
  } catch {
    return fallbackPublic;
  }
};

export const getSmartbillConfig = (): SmartbillMerchantConfig => ({
  baseUrl: process.env.SMARTBILL_BASE_URL?.trim() || "https://ws.smartbill.ro/SBORO/api",
  username: process.env.SMARTBILL_USERNAME?.trim() || "",
  token: process.env.SMARTBILL_TOKEN?.trim() || process.env.SMARTBILL_AUTH_TOKEN?.trim() || "",
  companyVatCode: process.env.SMARTBILL_COMPANY_VAT_CODE?.trim() || "",
  seriesName: process.env.SMARTBILL_SERIES_NAME?.trim() || "ZLG",
  taxName: process.env.SMARTBILL_TAX_NAME?.trim() || "Neimpozabil",
});

/** SmartBill pentru firma de meditații — cont / serie separate (ex. ZLI). */
export const getMeditationsSmartbillConfig = (): SmartbillMerchantConfig => ({
  baseUrl:
    process.env.MEDITATIONS_SMARTBILL_BASE_URL?.trim() ||
    process.env.SMARTBILL_BASE_URL?.trim() ||
    "https://ws.smartbill.ro/SBORO/api",
  username: process.env.MEDITATIONS_SMARTBILL_USERNAME?.trim() || "",
  token: process.env.MEDITATIONS_SMARTBILL_TOKEN?.trim() || "",
  companyVatCode: process.env.MEDITATIONS_SMARTBILL_COMPANY_VAT_CODE?.trim() || "",
  seriesName: process.env.MEDITATIONS_SMARTBILL_SERIES_NAME?.trim() || "ZLI",
  taxName: process.env.MEDITATIONS_SMARTBILL_TAX_NAME?.trim() || "Neimpozabil",
});

const revolutPaidStates = new Set(["COMPLETED", "PAID", "SUCCEEDED", "SUCCESS"]);

export async function revolutCreateOrder(
  payload: {
    amountCents: number;
    currency: string;
    description: string;
    redirectUrl: string;
    customer: { name: string; email: string; phone?: string };
    metadata: Record<string, string>;
  },
  merchant: RevolutMerchantConfig = getRevolutConfig(),
) {
  if (!merchant.secretKey) {
    throw new Error("Revolut secret key is missing");
  }
  const requestBody = {
    amount: payload.amountCents,
    currency: payload.currency,
    description: payload.description,
    redirect_url: payload.redirectUrl,
    customer: payload.customer,
    merchant_order_data: payload.metadata,
  };
  const response = await fetch(`${merchant.baseUrl.replace(/\/$/, "")}/api/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${merchant.secretKey}`,
      "Revolut-Api-Version": merchant.apiVersion,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(requestBody),
  });
  const rawText = await response.text();
  const data = (JSON.parse(rawText || "{}") as Record<string, unknown>) ?? null;
  if (!response.ok || !data) {
    throw new Error(
      `Revolut create order failed (${response.status}): ${
        (data?.message as string | undefined) || rawText || "unknown error"
      }`,
    );
  }
  const orderId = String(data.id ?? "");
  const checkoutUrl = String(data.checkout_url ?? data.public_checkout_url ?? data.payment_url ?? "");
  if (!orderId || !checkoutUrl) {
    throw new Error("Revolut create order returned incomplete payload");
  }
  return { orderId, checkoutUrl };
}

export async function revolutFetchOrder(orderId: string, merchant: RevolutMerchantConfig = getRevolutConfig()) {
  if (!merchant.secretKey) {
    throw new Error("Revolut secret key is missing");
  }
  const response = await fetch(`${merchant.baseUrl.replace(/\/$/, "")}/api/1.0/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      Authorization: `Bearer ${merchant.secretKey}`,
      "Revolut-Api-Version": merchant.apiVersion,
      Accept: "application/json",
    },
  });
  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok || !data) {
    throw new Error(`Revolut get order failed (${response.status})`);
  }
  const rawState = String(data.state ?? data.status ?? data.order_status ?? "").toUpperCase();
  return { isPaid: revolutPaidStates.has(rawState), rawState };
}

export type SmartbillProductLine = {
  name: string;
  priceRon: number;
  quantity?: number;
  isService?: boolean;
};

export async function issueSmartbillInvoiceWithProducts(args: {
  billingProfile: z.infer<typeof billingProfileActivateSchema>;
  userEmail: string;
  products: SmartbillProductLine[];
  smartbill?: SmartbillMerchantConfig;
}) {
  const config = args.smartbill ?? getSmartbillConfig();
  if (!config.username || !config.token || !config.companyVatCode) {
    return { invoiceNumber: null, invoiceUrl: null };
  }
  const clientName = args.billingProfile.invoiceOnCompany
    ? `${args.billingProfile.companyName ?? ""} (CUI: ${args.billingProfile.companyCui ?? ""})`
    : `${args.billingProfile.firstName} ${args.billingProfile.lastName}`.trim();
  const products = args.products
    .filter((p) => p.name.trim().length > 0)
    .map((p) => ({
      name: p.name.trim(),
      measuringUnitName: "buc",
      currency: SMARTBILL_CURRENCY,
      quantity: p.quantity ?? 1,
      price: Number(p.priceRon.toFixed(2)),
      isService: p.isService ?? true,
      taxName: config.taxName,
      saveToDb: false,
    }));
  if (products.length === 0) {
    return { invoiceNumber: null, invoiceUrl: null };
  }
  const payload = {
    companyVatCode: config.companyVatCode,
    client: {
      name: clientName,
      vatCode: args.billingProfile.invoiceOnCompany ? args.billingProfile.companyCui ?? "" : "",
      isTaxPayer: false,
      address: `${args.billingProfile.street} ${args.billingProfile.streetNumber}`.trim(),
      city: args.billingProfile.city,
      county: args.billingProfile.county,
      country: "Romania",
      email: args.userEmail,
      saveToDb: false,
    },
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    deliveryDate: new Date().toISOString().slice(0, 10),
    seriesName: config.seriesName,
    isDraft: false,
    products,
  };
  const auth = Buffer.from(`${config.username}:${config.token}`).toString("base64");
  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/invoice/v2`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok || !data) {
    return { invoiceNumber: null, invoiceUrl: null };
  }
  const series = String(data.seriesName ?? data.series ?? config.seriesName);
  const number = String(data.number ?? "");
  if (!number) {
    return { invoiceNumber: null, invoiceUrl: null };
  }
  const invoiceNumber = `${series}-${number}`;
  const invoiceUrl = `${config.baseUrl.replace(/\/$/, "")}/invoice/pdf?cif=${encodeURIComponent(
    config.companyVatCode,
  )}&seriesname=${encodeURIComponent(series)}&number=${encodeURIComponent(number)}`;
  return { invoiceNumber, invoiceUrl };
}

export async function downloadSmartbillInvoicePdf(
  invoiceNumber: string,
  smartbill: SmartbillMerchantConfig = getSmartbillConfig(),
) {
  if (!smartbill.username || !smartbill.token || !smartbill.companyVatCode) {
    throw new Error("SmartBill config missing");
  }
  const trimmed = invoiceNumber.trim();
  if (!trimmed) throw new Error("Invoice number missing");
  const separatorIndex = trimmed.indexOf("-");
  const series = separatorIndex > 0 ? trimmed.slice(0, separatorIndex).trim() : smartbill.seriesName;
  const number = separatorIndex > 0 ? trimmed.slice(separatorIndex + 1).trim() : trimmed;
  if (!number) throw new Error("Invoice number invalid");
  const auth = Buffer.from(`${smartbill.username}:${smartbill.token}`).toString("base64");
  const url = `${smartbill.baseUrl.replace(/\/$/, "")}/invoice/pdf?cif=${encodeURIComponent(
    smartbill.companyVatCode,
  )}&seriesname=${encodeURIComponent(series)}&number=${encodeURIComponent(number)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "*/*",
    },
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!response.ok || buffer.length < 200 || buffer.subarray(0, 5).toString() !== "%PDF-") {
    throw new Error("Failed to download invoice PDF from SmartBill");
  }
  return {
    fileName: `factura-${series}-${number}.pdf`,
    buffer,
  };
}

export function sanitizeInvoiceFileName(input: string) {
  return input.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export async function persistInvoicePdfToDirectory(
  dir: string,
  invoiceNumber: string,
  pdf: { fileName: string; buffer: Buffer },
) {
  await fs.mkdir(dir, { recursive: true });
  const safeName = sanitizeInvoiceFileName(invoiceNumber);
  const fileName = `${safeName}.pdf`;
  const absolutePath = path.join(dir, fileName);
  await fs.writeFile(absolutePath, pdf.buffer);
  return absolutePath;
}

export const GRILE_INVOICES_DIR = path.resolve(__dirname, "../../storage/grile-invoices");
export const COURSE_INVOICES_DIR = path.resolve(__dirname, "../../storage/course-invoices");
export const BAC_INVOICES_DIR = path.resolve(__dirname, "../../storage/bac-invoices");
export const MEDITATIONS_INVOICES_DIR = path.resolve(__dirname, "../../storage/meditations-invoices");
