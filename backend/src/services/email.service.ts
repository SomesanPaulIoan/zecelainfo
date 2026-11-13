import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

/** Dotenv înainte de orice citire SMTP: la import, `index.ts` încă nu a rulat `dotenv.config`. */
const servicesDir = __dirname;
const rootEnvPath = path.resolve(servicesDir, "../../../.env");
const backendEnvPath = path.resolve(servicesDir, "../../.env");
dotenv.config({ path: rootEnvPath });
dotenv.config({ path: backendEnvPath, override: true });

function extractDisplayNameFromFromHeader(fromHeader: string): string | null {
  const t = fromHeader.trim();
  const m = t.match(/^(.+?)\s*<[^>]+>\s*$/);
  if (!m) return null;
  const name = m[1].trim().replace(/^["']|["']$/g, "");
  return name || null;
}

/**
 * Expeditor efectiv. Pe Gmail SMTP, From trebuie să fie contul autentificat — ignorăm SMTP_FROM vechi
 * (ex. noreply@zecelaexamene.ro pe alt host), păstrând doar numele afișat dacă există.
 */
function resolveSmtpFrom(): string {
  const user = process.env.SMTP_USER?.trim() ?? "";
  const fromEnv = process.env.SMTP_FROM?.trim() ?? "";
  const host = (process.env.SMTP_HOST ?? "").toLowerCase();

  const gmailMailbox =
    user.endsWith("@gmail.com") || user.endsWith("@googlemail.com");
  const gmailHost = host.includes("smtp.gmail.com");

  if ((gmailMailbox || gmailHost) && user) {
    const display = extractDisplayNameFromFromHeader(fromEnv) ?? "Zece la Info";
    return `${display} <${user}>`;
  }

  if (fromEnv) return fromEnv;
  if (user) return user;
  return "noreply@zecelainfo.local";
}

function resolveReplyTo(): string | undefined {
  const explicit = process.env.SMTP_REPLY_TO?.trim();
  if (explicit) return explicit;
  const user = process.env.SMTP_USER?.trim();
  return user || undefined;
}

function getPaymentsBccEmail(): string {
  return process.env.PAYMENTS_BCC_EMAIL?.trim() || "paul.somesan02@gmail.com";
}

let transporterCache: nodemailer.Transporter | null | undefined;

function getTransporter(): nodemailer.Transporter | null {
  if (transporterCache !== undefined) {
    return transporterCache;
  }
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT ?? 587);
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  if (!smtpHost || !smtpUser || !smtpPass) {
    transporterCache = null;
    return null;
  }
  transporterCache = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
  return transporterCache;
}

if (process.env.SMTP_HOST?.trim()) {
  console.log(
    `[email] smtp host=${process.env.SMTP_HOST} user=${process.env.SMTP_USER ?? "-"} from=${resolveSmtpFrom()}`,
  );
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const subject = "Cod OTP zecelainfo.ro";
  const text = `Codul tau de verificare este: ${code}. Expira in 10 minute.`;
  const html = `<p>Codul tau de verificare este: <strong>${code}</strong></p><p>Expira in 10 minute.</p>`;

  const transport = getTransporter();
  if (!transport) {
    console.log(`[auth] OTP for ${email}: ${code}`);
    return;
  }

  try {
    await transport.sendMail({
      from: resolveSmtpFrom(),
      replyTo: resolveReplyTo(),
      to: email,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error("[auth] SMTP send failed:", error);
    throw error;
  }
}

export async function sendTemporaryPasswordEmail(email: string, temporaryPassword: string): Promise<void> {
  const subject = "Parola provizorie zecelainfo.ro";
  const text = `Parola ta provizorie este: ${temporaryPassword}. Dupa autentificare, schimba parola din Dashboard.`;
  const html = `
    <p>Parola ta provizorie este: <strong>${temporaryPassword}</strong></p>
    <p>Dupa autentificare, schimba parola din Dashboard pentru securitatea contului.</p>
  `;

  const transport = getTransporter();
  if (!transport) {
    console.log(`[auth] Temporary password for ${email}: ${temporaryPassword}`);
    return;
  }

  try {
    await transport.sendMail({
      from: resolveSmtpFrom(),
      replyTo: resolveReplyTo(),
      to: email,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error("[auth] SMTP send failed:", error);
    throw error;
  }
}

export function isSmtpConfigured(): boolean {
  return Boolean(getTransporter());
}

export type PurchaseThankYouPayload = {
  to: string;
  customerFirstName?: string | null;
  purchaseLabel: string;
  amountRon?: number | null;
  currency?: string;
  invoiceNumber?: string | null;
  invoiceUrl?: string | null;
  /** Cale locală către PDF-ul facturii (dacă există), atașat la email */
  invoicePdfPath?: string | null;
  /** Link către zona site-ului după autentificare (ex. /grile, /dashboard) */
  primaryCtaPath: string;
  /** Bază site, ex. https://www.zecelainfo.ro */
  appBaseUrl: string;
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeInvoiceFileName(invoiceNumber: string) {
  const base = invoiceNumber.replace(/[^\w.-]+/g, "_").slice(0, 80);
  return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
}

/** Email de mulțumire după plată: HTML prietenos, factură atașată dacă e disponibilă, BCC implicit. */
export async function sendPurchaseThankYouEmail(payload: PurchaseThankYouPayload): Promise<void> {
  const to = payload.to.trim();
  if (!to || !to.includes("@")) {
    console.warn("[payments] skip thank-you email: invalid recipient");
    return;
  }

  const appBase = payload.appBaseUrl.replace(/\/$/, "");
  const ctaUrl = `${appBase}${payload.primaryCtaPath.startsWith("/") ? "" : "/"}${payload.primaryCtaPath}`;
  const greeting = payload.customerFirstName?.trim() ? `Bună, ${escapeHtml(payload.customerFirstName.trim())}!` : "Bună!";
  const amountLine =
    payload.amountRon != null && Number.isFinite(payload.amountRon)
      ? `${Number(payload.amountRon).toFixed(2)} ${(payload.currency ?? "RON").toUpperCase()}`
      : null;

  const attachments: { filename: string; content: Buffer; contentType: string }[] = [];
  if (payload.invoicePdfPath && payload.invoiceNumber) {
    try {
      const buf = await fs.readFile(payload.invoicePdfPath);
      if (buf.length >= 5 && buf.subarray(0, 5).toString() === "%PDF-") {
        attachments.push({
          filename: safeInvoiceFileName(payload.invoiceNumber),
          content: buf,
          contentType: "application/pdf",
        });
      }
    } catch (e) {
      console.error("[payments] could not read invoice PDF for email:", e);
    }
  }

  const subject = `Îți mulțumim pentru plată — ${payload.purchaseLabel.slice(0, 60)}`;

  const invoiceMeta =
    payload.invoiceNumber != null
      ? `<p style="margin:12px 0 0;font-size:14px;color:#64748b;">Număr factură: <strong style="color:#0f172a;">${escapeHtml(payload.invoiceNumber)}</strong></p>`
      : "";

  const html = `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f9ff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(180deg,#e0f2fe 0%,#fffbeb 100%);padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 50px -24px rgba(2,132,199,0.35);border:1px solid #bae6fd;">
        <tr>
          <td style="padding:28px 28px 8px;background:linear-gradient(135deg,#0c4a6e 0%,#0369a1 50%,#0ea5e9 100%);color:#fff;">
            <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.9;">Zece la Info</p>
            <h1 style="margin:10px 0 0;font-size:22px;line-height:1.25;font-weight:800;">Mulțumim pentru încredere!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px 32px;">
            <p style="margin:0;font-size:17px;line-height:1.55;color:#0f172a;">${greeting}</p>
            <p style="margin:16px 0 0;font-size:15px;line-height:1.65;color:#334155;">
              Am înregistrat plata ta pentru <strong style="color:#0c4a6e;">${escapeHtml(payload.purchaseLabel)}</strong>.
              ${amountLine ? ` Suma plătită: <strong>${escapeHtml(amountLine)}</strong>.` : ""}
            </p>
            <p style="margin:16px 0 0;font-size:15px;line-height:1.65;color:#334155;">
              Ne bucurăm că ești alături de noi. Dacă ai întrebări despre acces sau facturare, răspundem cu drag pe email sau WhatsApp.
            </p>
            ${invoiceMeta}
            ${attachments.length > 0 ? `<p style="margin:16px 0 0;font-size:15px;line-height:1.55;color:#334155;"><strong>Factura PDF</strong> este atașată acestui mesaj — o poți salva oricând.</p>` : ""}
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 0;">
              <tr>
                <td style="border-radius:14px;background:linear-gradient(90deg,#facc15 0%,#fbbf24 100%);">
                  <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:14px 22px;font-size:15px;font-weight:800;color:#0f172a;text-decoration:none;">Deschide platforma</a>
                </td>
              </tr>
            </table>
            <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#94a3b8;">
              Cu stimă,<br/><strong>Echipa Zece la Info</strong><br/>
              <a href="${escapeHtml(appBase)}" style="color:#0369a1;">${escapeHtml(appBase.replace(/^https?:\/\//, ""))}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textLines = [
    "Zece la Info — Mulțumim pentru încredere!",
    "",
    payload.customerFirstName?.trim() ? `Bună, ${payload.customerFirstName.trim()}!` : "Bună!",
    "",
    `Am înregistrat plata ta pentru: ${payload.purchaseLabel}.`,
    amountLine ? `Sumă: ${amountLine}.` : "",
    payload.invoiceNumber ? `Factură: ${payload.invoiceNumber}.` : "",
    attachments.length > 0 ? "Factura PDF este atașată acestui email." : "",
    "",
    `Deschide platforma: ${ctaUrl}`,
    "",
    "Cu stimă, echipa Zece la Info",
  ]
    .filter(Boolean)
    .join("\n");

  const bcc = getPaymentsBccEmail();
  const mailOptions: nodemailer.SendMailOptions = {
    from: resolveSmtpFrom(),
    replyTo: resolveReplyTo(),
    to,
    bcc,
    subject,
    text: textLines,
    html,
    attachments: attachments.length > 0 ? attachments : undefined,
  };

  const transport = getTransporter();
  if (!transport) {
    console.log(`[payments] thank-you email (SMTP off) to=${to} bcc=${bcc} subject=${subject}`);
    return;
  }

  try {
    await transport.sendMail(mailOptions);
  } catch (error) {
    console.error("[payments] thank-you SMTP send failed:", error);
    throw error;
  }
}

export type BacCorrectionReadyPayload = {
  to: string;
  customerFirstName?: string | null;
  subjectName: string;
  totalScore: number;
  subjectId: number | string;
  submissionId: string;
  appBaseUrl: string;
};

/** Email trimis elevului când lucrarea de bac a fost corectată. */
export async function sendBacCorrectionReadyEmail(payload: BacCorrectionReadyPayload): Promise<void> {
  const to = payload.to.trim();
  if (!to || !to.includes("@")) {
    console.warn("[bac] skip correction-ready email: invalid recipient");
    return;
  }

  const appBase = payload.appBaseUrl.replace(/\/$/, "");
  const feedbackPath = `/bacalaureat/subiect/${payload.subjectId}/feedback/${payload.submissionId}`;
  const feedbackUrl = `${appBase}${feedbackPath}`;
  const subjectPageUrl = `${appBase}/bacalaureat/subiect/${payload.subjectId}`;
  const scoreFormatted = Number(payload.totalScore).toFixed(2);
  const greeting = payload.customerFirstName?.trim()
    ? `Bună, ${escapeHtml(payload.customerFirstName.trim())}!`
    : "Bună!";
  const subjectNameHtml = escapeHtml(payload.subjectName.trim() || "subiectul de bac");

  const subject = `Lucrarea ta a fost corectată — nota ${scoreFormatted} / 100`;

  const html = `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f9ff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(180deg,#e0f2fe 0%,#ecfdf5 55%,#fffbeb 100%);padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:580px;background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 24px 56px -28px rgba(2,132,199,0.4);border:1px solid #bae6fd;">
        <tr>
          <td style="padding:30px 30px 10px;background:linear-gradient(135deg,#0c4a6e 0%,#0369a1 45%,#0ea5e9 100%);color:#fff;">
            <p style="margin:0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.92;">Zece la Info · Bacalaureat</p>
            <h1 style="margin:12px 0 0;font-size:24px;line-height:1.25;font-weight:800;">Lucrarea ta a fost corectată!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 30px 34px;">
            <p style="margin:0;font-size:17px;line-height:1.55;color:#0f172a;">${greeting}</p>
            <p style="margin:16px 0 0;font-size:15px;line-height:1.65;color:#334155;">
              Am terminat corectura pentru <strong style="color:#0c4a6e;">${subjectNameHtml}</strong>.
              Mai jos găsești nota ta; pe site poți vedea punctajul detaliat pentru fiecare exercițiu, împreună cu observațiile noastre.
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0 0;border-radius:18px;background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%);border:1px solid #6ee7b7;">
              <tr>
                <td style="padding:22px 24px;text-align:center;">
                  <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#047857;">Nota ta</p>
                  <p style="margin:8px 0 0;font-size:42px;line-height:1;font-weight:900;color:#065f46;">${escapeHtml(scoreFormatted)}<span style="font-size:20px;font-weight:700;color:#059669;"> / 100</span></p>
                </td>
              </tr>
            </table>
            <p style="margin:20px 0 0;font-size:15px;line-height:1.65;color:#334155;">
              Intră pe platformă pentru feedback complet: punctaj pe fiecare cerință, comentarii per exercițiu și mesajul general de la corector.
            </p>
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 0;">
              <tr>
                <td style="border-radius:14px;background:linear-gradient(90deg,#facc15 0%,#fbbf24 100%);">
                  <a href="${escapeHtml(feedbackUrl)}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:800;color:#0f172a;text-decoration:none;">Vezi feedback detaliat</a>
                </td>
              </tr>
            </table>
            <p style="margin:18px 0 0;font-size:13px;line-height:1.55;color:#64748b;">
              Sau deschide pagina subiectului: <a href="${escapeHtml(subjectPageUrl)}" style="color:#0369a1;font-weight:600;">${escapeHtml(subjectPageUrl.replace(/^https?:\/\//, ""))}</a>
            </p>
            <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#94a3b8;">
              Cu stimă,<br/><strong>Echipa Zece la Info</strong><br/>
              <a href="${escapeHtml(appBase)}" style="color:#0369a1;">${escapeHtml(appBase.replace(/^https?:\/\//, ""))}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textLines = [
    "Zece la Info — Lucrarea ta de bac a fost corectată!",
    "",
    payload.customerFirstName?.trim() ? `Bună, ${payload.customerFirstName.trim()}!` : "Bună!",
    "",
    `Subiect: ${payload.subjectName.trim() || "Bacalaureat"}.`,
    `Nota ta: ${scoreFormatted} / 100.`,
    "",
    "Pe site poți vedea punctajul detaliat pentru fiecare exercițiu și observațiile de la corector.",
    "",
    `Vezi feedback detaliat: ${feedbackUrl}`,
    `Pagina subiectului: ${subjectPageUrl}`,
    "",
    "Cu stimă, echipa Zece la Info",
  ].join("\n");

  const transport = getTransporter();
  if (!transport) {
    console.log(`[bac] correction-ready email (SMTP off) to=${to} score=${scoreFormatted}`);
    return;
  }

  try {
    await transport.sendMail({
      from: resolveSmtpFrom(),
      replyTo: resolveReplyTo(),
      to,
      subject,
      text: textLines,
      html,
    });
  } catch (error) {
    console.error("[bac] correction-ready SMTP send failed:", error);
    throw error;
  }
}

export type MeditationPaymentReminderPayload = {
  to: string;
  customerFirstName?: string | null;
  unpaidSessionsCount: number;
  unpaidTotalLei: number;
  sessionPriceLei?: number | null;
  /** Date ISO (YYYY-MM-DD) ale ședințelor neplătite, cele mai vechi primele */
  unpaidSessionDates?: string[];
  appBaseUrl: string;
};

/** Email elegant către elev cu memento pentru plata ședințelor de meditații. */
export async function sendMeditationPaymentReminderEmail(
  payload: MeditationPaymentReminderPayload,
): Promise<void> {
  const to = payload.to.trim();
  if (!to || !to.includes("@")) {
    console.warn("[meditations] skip payment reminder email: invalid recipient");
    return;
  }

  const appBase = payload.appBaseUrl.replace(/\/$/, "");
  const dashboardUrl = `${appBase}/dashboard`;
  const greeting = payload.customerFirstName?.trim()
    ? `Bună, ${escapeHtml(payload.customerFirstName.trim())},`
    : "Bună,";
  const sessionsCount = Math.max(0, Math.floor(payload.unpaidSessionsCount));
  const totalLei = Math.max(0, Number(payload.unpaidTotalLei) || 0);
  const totalFormatted = `${totalLei.toFixed(0)} lei`;
  const sessionsLabel =
    sessionsCount === 1 ? "1 ședință neplătită" : `${sessionsCount} ședințe neplătite`;
  const sessionPrice =
    payload.sessionPriceLei != null && Number.isFinite(payload.sessionPriceLei)
      ? `${Number(payload.sessionPriceLei).toFixed(0)} lei`
      : "150 lei";
  const whatsappDisplay = "0744 218 696";
  const whatsappUrl = "https://wa.me/40744218696";

  const dates = (payload.unpaidSessionDates ?? [])
    .map((d) => d.trim())
    .filter(Boolean)
    .slice(0, 8);
  const datesHtml =
    dates.length > 0
      ? `<ul style="margin:12px 0 0;padding:0 0 0 20px;font-size:14px;line-height:1.6;color:#475569;">
          ${dates
            .map((d) => {
              const formatted = (() => {
                try {
                  return new Date(`${d}T12:00:00`).toLocaleDateString("ro-RO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });
                } catch {
                  return d;
                }
              })();
              return `<li style="margin:4px 0;">${escapeHtml(formatted)}</li>`;
            })
            .join("")}
          ${sessionsCount > dates.length ? `<li style="margin:4px 0;color:#64748b;">… și alte ${sessionsCount - dates.length} ședințe</li>` : ""}
        </ul>`
      : "";

  const subject =
    sessionsCount === 1
      ? "Kind Reminder — o ședință de meditații de plătit"
      : `Kind Reminder — ${sessionsCount} ședințe de meditații de plătit`;

  const html = `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px -20px rgba(15,23,42,0.18);border:1px solid #e2e8f0;">
        <tr>
          <td style="padding:28px 28px 12px;background:linear-gradient(135deg,#0c4a6e 0%,#0369a1 100%);color:#fff;">
            <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.9;">Zece la Info · Meditații</p>
            <h1 style="margin:10px 0 0;font-size:22px;line-height:1.3;font-weight:700;">Kind Reminder</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:26px 28px 32px;">
            <p style="margin:0;font-size:16px;line-height:1.55;color:#0f172a;">${greeting}</p>
            <p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#334155;">
              Îți scriu pentru a-ți reaminti că în contul tău de pe Zece la Info sunt înregistrate
              <strong style="color:#0c4a6e;">${escapeHtml(sessionsLabel)}</strong>,
              în valoare totală de <strong style="color:#0c4a6e;">${escapeHtml(totalFormatted)}</strong>.
            </p>
            <p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:#334155;">
              Te rog să efectuezi plata cât mai curând, direct din platformă. Poți achita ședințele din
              contul tău, în secțiunea dedicată meditațiilor.
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0 0;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
              <tr>
                <td style="padding:18px 20px;">
                  <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;">Rezumat</p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:12px;">
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#475569;border-bottom:1px solid #e2e8f0;">Ședințe restante</td>
                      <td style="padding:6px 0;font-size:14px;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #e2e8f0;">${escapeHtml(String(sessionsCount))}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#475569;border-bottom:1px solid #e2e8f0;">Tarif per ședință</td>
                      <td style="padding:6px 0;font-size:14px;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #e2e8f0;">${escapeHtml(sessionPrice)}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0 0;font-size:14px;font-weight:600;color:#0f172a;">Total de achitat</td>
                      <td style="padding:8px 0 0;font-size:18px;font-weight:700;color:#0c4a6e;text-align:right;">${escapeHtml(totalFormatted)}</td>
                    </tr>
                  </table>
                  ${datesHtml}
                </td>
              </tr>
            </table>
            <p style="margin:18px 0 0;font-size:14px;line-height:1.65;color:#64748b;">
              Dacă ai efectuat deja plata sau întâmpini probleme tehnice, te rog să-mi scrii pe WhatsApp la
              <a href="${escapeHtml(whatsappUrl)}" style="color:#0369a1;font-weight:600;text-decoration:none;">${escapeHtml(whatsappDisplay)}</a>.
            </p>
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 0;">
              <tr>
                <td style="border-radius:10px;background:#0369a1;">
                  <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Plătesc din platformă</a>
                </td>
              </tr>
            </table>
            <p style="margin:16px 0 0;font-size:13px;line-height:1.55;color:#94a3b8;">
              Link direct: <a href="${escapeHtml(dashboardUrl)}" style="color:#0369a1;">${escapeHtml(dashboardUrl.replace(/^https?:\/\//, ""))}</a>
            </p>
            <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#475569;">
              Cu prietenie,<br/>
              <strong>Paul Somesan</strong>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const datesText =
    dates.length > 0
      ? [
          "",
          "Ședințe neplătite (date):",
          ...dates.map((d) => {
            try {
              return `  • ${new Date(`${d}T12:00:00`).toLocaleDateString("ro-RO")}`;
            } catch {
              return `  • ${d}`;
            }
          }),
        ].join("\n")
      : "";

  const textLines = [
    "Zece la Info — Kind Reminder (meditații)",
    "",
    payload.customerFirstName?.trim() ? `Bună, ${payload.customerFirstName.trim()},` : "Bună,",
    "",
    `Îți scriu pentru a-ți reaminti că în contul tău sunt înregistrate ${sessionsLabel}, în valoare totală de ${totalFormatted}.`,
    "Te rog să efectuezi plata cât mai curând, direct din platformă.",
    `Tarif per ședință: ${sessionPrice}.`,
    datesText,
    "",
    `Plată din platformă: ${dashboardUrl}`,
    "",
    `Dacă ai efectuat deja plata sau întâmpini probleme tehnice, te rog să-mi scrii pe WhatsApp la ${whatsappDisplay}.`,
    "",
    "Cu prietenie,",
    "Paul Somesan",
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  const transport = getTransporter();
  if (!transport) {
    console.log(`[meditations] payment reminder email (SMTP off) to=${to} subject=${subject}`);
    return;
  }

  try {
    await transport.sendMail({
      from: resolveSmtpFrom(),
      replyTo: resolveReplyTo(),
      to,
      subject,
      text: textLines,
      html,
    });
  } catch (error) {
    console.error("[meditations] payment reminder SMTP send failed:", error);
    throw error;
  }
}

export type MeditationSignupConfirmationPayload = {
  to: string;
  customerFirstName?: string | null;
  preparationFor: string;
  appBaseUrl: string;
};

/** Email trimis imediat dupa inscrierea la meditatii: confirmare inscriere. */
export async function sendMeditationSignupConfirmationEmail(
  payload: MeditationSignupConfirmationPayload,
): Promise<void> {
  const to = payload.to.trim();
  if (!to || !to.includes("@")) {
    console.warn("[meditations] skip signup confirmation email: invalid recipient");
    return;
  }

  const greeting = payload.customerFirstName?.trim()
    ? `Bună, ${escapeHtml(payload.customerFirstName.trim())}!`
    : "Bună!";
  const preparationFor = escapeHtml(payload.preparationFor.trim() || "examen");

  const subject = "Te-ai înscris la meditații!";

  const html = `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f9ff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(180deg,#e0f2fe 0%,#fffbeb 100%);padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:580px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 50px -24px rgba(2,132,199,0.35);border:1px solid #bae6fd;">
        <tr>
          <td style="padding:28px 28px 8px;background:linear-gradient(135deg,#0c4a6e 0%,#0369a1 50%,#0ea5e9 100%);color:#fff;">
            <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.9;">Zece la Info · Meditații</p>
            <h1 style="margin:10px 0 0;font-size:22px;line-height:1.25;font-weight:800;">Înscriere confirmată!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px 32px;">
            <p style="margin:0;font-size:17px;line-height:1.55;color:#0f172a;">${greeting}</p>
            <p style="margin:16px 0 0;font-size:15px;line-height:1.65;color:#334155;">
              Am înregistrat cu succes înscrierea ta la meditațiile de informatică, pentru pregătirea la
              <strong style="color:#0c4a6e;">${preparationFor}</strong>. Mă bucur că ai ales să lucrăm împreună!
            </p>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0 0;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
              <tr>
                <td style="padding:18px 20px;">
                  <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;">Despre meditații</p>
                  <ul style="margin:12px 0 0;padding:0 0 0 20px;font-size:14px;line-height:1.7;color:#334155;">
                    <li>Grupe de maximum 5 elevi, formate după un test inițial.</li>
                    <li>În septembrie–ianuarie se recapitulează și se aprofundează materia de liceu.</li>
                    <li>Ulterior se lucrează pe subiecte oficiale: grile de admitere sau subiecte de bacalaureat.</li>
                    <li>Temă săptămânală, cu feedback constant și monitorizare a progresului.</li>
                    <li>O ședință durează 2 ore, are loc o dată pe săptămână și costă 150 lei.</li>
                  </ul>
                </td>
              </tr>
            </table>

            <p style="margin:20px 0 0;font-size:15px;line-height:1.65;color:#334155;">
              <strong style="color:#0c4a6e;">Ce urmează:</strong> în scurt timp te voi contacta pentru un test
              inițial, pe baza căruia se vor forma grupele de pregătire.
            </p>

            <p style="margin:24px 0 0;font-size:15px;line-height:1.65;color:#334155;">
              Mult succes în pregătire!
            </p>
            <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#475569;">
              Toate cele bune,<br/>
              <strong>Paul-Ioan Someșan</strong>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textLines = [
    "Zece la Info — Înscriere confirmată!",
    "",
    payload.customerFirstName?.trim() ? `Bună, ${payload.customerFirstName.trim()}!` : "Bună!",
    "",
    `Am înregistrat cu succes înscrierea ta la meditațiile de informatică, pentru pregătirea la ${payload.preparationFor.trim() || "examen"}.`,
    "",
    "Despre meditații:",
    "- Grupe de maximum 5 elevi, formate după un test inițial.",
    "- În septembrie-ianuarie se recapituleaza si se aprofundeaza materia de liceu.",
    "- Ulterior se lucreaza pe subiecte oficiale: grile de admitere sau subiecte de bacalaureat.",
    "- Tema saptamanala, cu feedback constant si monitorizare a progresului.",
    "- O sedinta dureaza 2 ore, are loc o data pe saptamana si costa 150 lei.",
    "",
    "Ce urmeaza: in scurt timp te voi contacta pentru un test initial, pe baza caruia se vor forma grupele de pregatire.",
    "",
    "Mult succes in pregatire!",
    "",
    "Toate cele bune,",
    "Paul-Ioan Somesan",
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  const transport = getTransporter();
  if (!transport) {
    console.log(`[meditations] signup confirmation email (SMTP off) to=${to} subject=${subject}`);
    return;
  }

  try {
    await transport.sendMail({
      from: resolveSmtpFrom(),
      replyTo: resolveReplyTo(),
      to,
      subject,
      text: textLines,
      html,
    });
  } catch (error) {
    console.error("[meditations] signup confirmation SMTP send failed:", error);
    throw error;
  }
}

export type GrileReportResolutionEmailPayload = {
  to: string;
  questionLabel: string;
  sourceName?: string | null;
  userReportMessage: string;
  adminResolutionMessage: string;
  appBaseUrl: string;
};

export async function sendGrileReportResolutionEmail(payload: GrileReportResolutionEmailPayload): Promise<void> {
  const to = payload.to.trim();
  if (!to || !to.includes("@")) return;

  const appBase = payload.appBaseUrl.replace(/\/$/, "");
  const subject = "Solutionare Raport Greseala";
  const safeQuestionLabel = escapeHtml(payload.questionLabel.trim() || "Grila");
  const safeSource = escapeHtml(payload.sourceName?.trim() || "Sursa necunoscuta");
  const safeUserMessage = escapeHtml(payload.userReportMessage.trim() || "-");
  const safeAdminMessage = escapeHtml(payload.adminResolutionMessage.trim());

  const html = `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f9ff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;background:linear-gradient(180deg,#e0f2fe 0%,#fffbeb 100%);">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:620px;background:#fff;border:1px solid #bae6fd;border-radius:18px;overflow:hidden;box-shadow:0 22px 50px -26px rgba(2,132,199,0.4);">
        <tr>
          <td style="padding:24px 24px 10px;background:linear-gradient(135deg,#0c4a6e 0%,#0369a1 50%,#0ea5e9 100%);color:#fff;">
            <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.9;">Zece la Info · Grile</p>
            <h1 style="margin:10px 0 2px;font-size:22px;line-height:1.25;font-weight:800;">Solutionare raport greseala</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:22px 24px 28px;">
            <p style="margin:0;font-size:16px;line-height:1.65;color:#0f172a;">
              Iti multumim frumos pentru implicare si pentru ca ne-ai semnalat o posibila problema la <strong>${safeQuestionLabel}</strong>.
            </p>
            <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#334155;">
              Sursa: <strong>${safeSource}</strong>
            </p>
            <div style="margin:18px 0 0;padding:12px 14px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b;">Mesajul tau</p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#1e293b;white-space:pre-wrap;">${safeUserMessage}</p>
            </div>
            <div style="margin:12px 0 0;padding:12px 14px;border:1px solid #c7d2fe;border-radius:12px;background:#eef2ff;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#4338ca;">Raspuns administratie</p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#1e1b4b;white-space:pre-wrap;">${safeAdminMessage}</p>
            </div>
            <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#334155;">
              Cu apreciere,<br/>
              <strong>Paul Somesan</strong><br/>
              Echipa Zece la Info
            </p>
            <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">
              Platforma: <a href="${escapeHtml(appBase)}" style="color:#0369a1;">${escapeHtml(appBase.replace(/^https?:\/\//, ""))}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    "Solutionare Raport Greseala",
    "",
    `Grila: ${payload.questionLabel}`,
    `Sursa: ${payload.sourceName ?? "Sursa necunoscuta"}`,
    "",
    "Mesajul tau:",
    payload.userReportMessage,
    "",
    "Raspuns administratie:",
    payload.adminResolutionMessage,
    "",
    "Cu apreciere,",
    "Paul Somesan",
    "Echipa Zece la Info",
  ].join("\n");

  const transport = getTransporter();
  if (!transport) {
    console.log(`[grile] report resolution email (SMTP off) to=${to}`);
    return;
  }
  await transport.sendMail({
    from: resolveSmtpFrom(),
    replyTo: resolveReplyTo(),
    to,
    subject,
    text,
    html,
  });
}

export type HomeworkPublishedEmailPayload = {
  to: string;
  studentFirstName: string;
  groupName: string;
  kind: "grile" | "problems";
  startDate: string;
  endDate: string;
  appBaseUrl: string;
};

export async function sendHomeworkPublishedEmail(payload: HomeworkPublishedEmailPayload): Promise<void> {
  const to = payload.to.trim();
  if (!to || !to.includes("@")) return;

  const appBase = payload.appBaseUrl.replace(/\/$/, "");
  const dashboardUrl = `${appBase}/dashboard?section=classes`;
  const kindLabel = payload.kind === "grile" ? "grile" : "probleme";
  const subject = `Tema noua de ${kindLabel} - ${payload.groupName}`;
  const safeFirstName = escapeHtml(payload.studentFirstName.trim() || "Salut");
  const safeGroupName = escapeHtml(payload.groupName.trim());
  const safeStart = escapeHtml(payload.startDate);
  const safeEnd = escapeHtml(payload.endDate);

  const html = `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f9ff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;background:linear-gradient(180deg,#e0f2fe 0%,#fffbeb 100%);">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:620px;background:#fff;border:1px solid #bae6fd;border-radius:18px;overflow:hidden;box-shadow:0 22px 50px -26px rgba(2,132,199,0.4);">
        <tr>
          <td style="padding:24px 24px 10px;background:linear-gradient(135deg,#0c4a6e 0%,#0369a1 50%,#0ea5e9 100%);color:#fff;">
            <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.9;">Zece la Info · Meditatii</p>
            <h1 style="margin:10px 0 2px;font-size:22px;line-height:1.25;font-weight:800;">Tema noua de ${kindLabel}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:22px 24px 28px;">
            <p style="margin:0;font-size:16px;line-height:1.65;color:#0f172a;">Salut, ${safeFirstName}!</p>
            <p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#334155;">
              A fost publicata o tema noua de <strong>${kindLabel}</strong> pentru grupa <strong>${safeGroupName}</strong>,
              valabila in perioada <strong>${safeStart}</strong> – <strong>${safeEnd}</strong>.
            </p>
            <p style="margin:18px 0 0;">
              <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;padding:11px 20px;border-radius:12px;background:linear-gradient(90deg,#fbbf24,#f59e0b);color:#1e293b;font-weight:800;text-decoration:none;font-size:14px;">
                Vezi tema in Temele mele
              </a>
            </p>
            <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#334155;">
              Spor la treaba!<br/>
              Echipa Zece la Info
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Salut, ${payload.studentFirstName.trim() || ""}!`,
    "",
    `A fost publicata o tema noua de ${kindLabel} pentru grupa ${payload.groupName}, valabila in perioada ${payload.startDate} - ${payload.endDate}.`,
    "",
    `Vezi tema: ${dashboardUrl}`,
    "",
    "Echipa Zece la Info",
  ].join("\n");

  const transport = getTransporter();
  if (!transport) {
    console.log(`[meditations] homework published email (SMTP off) to=${to}`);
    return;
  }
  await transport.sendMail({
    from: resolveSmtpFrom(),
    replyTo: resolveReplyTo(),
    to,
    subject,
    text,
    html,
  });
}

export type TrialActivatedEmailPayload = {
  to: string;
  customerFirstName?: string | null;
  /** Momentul expirarii accesului gratuit (ISO). */
  accessUntilIso: string;
  appBaseUrl: string;
};

/** Email trimis dupa activarea trialului gratuit de 24h: acces la toate cursurile si toate grilele. */
export async function sendTrialActivatedEmail(payload: TrialActivatedEmailPayload): Promise<void> {
  const to = payload.to.trim();
  if (!to || !to.includes("@")) return;

  const appBase = payload.appBaseUrl.replace(/\/$/, "");
  const greeting = payload.customerFirstName?.trim() ? `Bună, ${escapeHtml(payload.customerFirstName.trim())}!` : "Bună!";
  const untilLabel = new Date(payload.accessUntilIso).toLocaleString("ro-RO", {
    timeZone: "Europe/Bucharest",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  const subject = "Ai acces gratuit 24 de ore la tot site-ul Zece la Info";
  const links = [
    { label: "Toate grilele", path: "/grile" },
    { label: "Toate cursurile video", path: "/cursuri" },
  ];

  const html = `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f9ff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(180deg,#e0f2fe 0%,#fffbeb 100%);padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 50px -24px rgba(2,132,199,0.35);border:1px solid #bae6fd;">
        <tr>
          <td style="padding:28px 28px 8px;background:linear-gradient(135deg,#0c4a6e 0%,#0369a1 50%,#0ea5e9 100%);color:#fff;">
            <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.9;">Zece la Info</p>
            <h1 style="margin:10px 0 0;font-size:22px;line-height:1.25;font-weight:800;">Accesul tău gratuit de 24h a pornit!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px 32px;">
            <p style="margin:0;font-size:17px;line-height:1.55;color:#0f172a;">${greeting}</p>
            <p style="margin:16px 0 0;font-size:15px;line-height:1.65;color:#334155;">
              Pentru următoarele <strong>24 de ore</strong> ai acces la <strong style="color:#0c4a6e;">tot site-ul</strong>:
              toate cursurile video și toate grilele (admitere și Bacalaureat), cu explicații.
            </p>
            <p style="margin:16px 0 0;font-size:15px;line-height:1.65;color:#334155;">
              Accesul gratuit expiră pe <strong>${escapeHtml(untilLabel)}</strong>. După aceea progresul tău rămâne salvat.
            </p>
            <ul style="margin:16px 0 0;padding-left:20px;font-size:15px;line-height:1.8;color:#334155;">
              ${links.map((l) => `<li><a href="${escapeHtml(appBase + l.path)}" style="color:#0369a1;font-weight:700;">${l.label}</a></li>`).join("")}
            </ul>
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 0;">
              <tr>
                <td style="border-radius:14px;background:linear-gradient(90deg,#facc15 0%,#fbbf24 100%);">
                  <a href="${escapeHtml(appBase + "/bun-venit")}" style="display:inline-block;padding:14px 22px;font-size:15px;font-weight:800;color:#0f172a;text-decoration:none;">Începe acum</a>
                </td>
              </tr>
            </table>
            <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#94a3b8;">
              Testul gratuit se poate activa o singură dată per cont și per număr de telefon.<br/><br/>
              Spor la învățat,<br/><strong>Echipa Zece la Info</strong><br/>
              <a href="${escapeHtml(appBase)}" style="color:#0369a1;">${escapeHtml(appBase.replace(/^https?:\/\//, ""))}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    "Zece la Info — Accesul tău gratuit de 24h a pornit!",
    "",
    payload.customerFirstName?.trim() ? `Bună, ${payload.customerFirstName.trim()}!` : "Bună!",
    "",
    "Pentru următoarele 24 de ore ai acces la tot site-ul: toate cursurile video și toate grilele.",
    `Accesul gratuit expiră pe ${untilLabel}. După aceea progresul tău rămâne salvat.`,
    "",
    ...links.map((l) => `${l.label}: ${appBase}${l.path}`),
    "",
    "Testul gratuit se poate activa o singură dată per cont și per număr de telefon.",
    "",
    "Spor la învățat, echipa Zece la Info",
  ].join("\n");

  const transport = getTransporter();
  if (!transport) {
    console.log(`[trial] activation email (SMTP off) to=${to}`);
    return;
  }
  await transport.sendMail({ from: resolveSmtpFrom(), replyTo: resolveReplyTo(), to, subject, text, html });
}
