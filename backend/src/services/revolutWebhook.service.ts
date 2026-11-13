import crypto from "node:crypto";
import { pgPool } from "../db/postgres";
import { signAuthToken } from "./auth.service";

/**
 * Finalizare plati Revolut pe server (fara sa depindem de browserul clientului).
 *
 * Pana acum, singurul lucru care marca o plata ca achitata era `confirm-payment`, apelat din browser dupa
 * redirect-ul de la Revolut. Daca userul inchidea tab-ul / pierdea netul, comanda ramanea `pending` desi banii
 * erau incasati. Aici avem doua plase de siguranta care refolosesc EXACT aceleasi endpoint-uri confirm-payment
 * (apelate pe loopback), ca sa nu duplicam a 6-a oara logica "marcheaza platit → acces → factura → email":
 *   1. webhook Revolut `ORDER_COMPLETED` (cate unul pe fiecare cont de merchant: principal + meditatii);
 *   2. job de reconciliere periodic care re-verifica platile pending recente.
 * Endpoint-urile confirm-payment sunt idempotente (SELECT ... FOR UPDATE + verificare status), deci e sigur
 * daca browserul, webhook-ul si job-ul ajung toate la aceeasi comanda.
 */

export type RevolutMerchantKind = "main" | "meditations";

type PaymentTarget = {
  flow: "grile" | "courses" | "bac" | "offers2027" | "meditations";
  path: string;
  body: Record<string, string>;
  authUser?: { id: string; email: string; role: "student" | "professor" | "admin" };
};

const WEBHOOK_TOLERANCE_MS = 5 * 60 * 1000;

export function getRevolutWebhookSecret(merchant: RevolutMerchantKind) {
  return merchant === "main"
    ? process.env.REVOLUT_WEBHOOK_SECRET?.trim() || ""
    : process.env.MEDITATIONS_REVOLUT_WEBHOOK_SECRET?.trim() || "";
}

/** Verifica `Revolut-Signature` (v1=HMAC-SHA256 peste `v1.{timestamp}.{raw body}`) si fereastra de timp. */
export function verifyRevolutWebhookSignature(args: {
  rawBody: Buffer;
  signatureHeader: string | undefined;
  timestampHeader: string | undefined;
  secret: string;
}) {
  const { rawBody, signatureHeader, timestampHeader, secret } = args;
  if (!secret || !signatureHeader || !timestampHeader) return false;
  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > WEBHOOK_TOLERANCE_MS) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`v1.${timestampHeader}.`)
    .update(rawBody)
    .digest("hex");
  const expectedBuf = Buffer.from(`v1=${expected}`);
  // In timpul rotirii secretului Revolut trimite mai multe semnaturi separate prin virgula.
  return signatureHeader.split(",").some((candidate) => {
    const candidateBuf = Buffer.from(candidate.trim());
    return candidateBuf.length === expectedBuf.length && crypto.timingSafeEqual(candidateBuf, expectedBuf);
  });
}

async function findPaymentTarget(merchant: RevolutMerchantKind, orderId: string): Promise<PaymentTarget | null> {
  if (merchant === "meditations") {
    const result = await pgPool.query<{ id: string; user_id: string; email: string; role: string }>(
      `SELECT s.id, s.user_id, u.email, u.role
       FROM meditation_member_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.revolut_order_id = $1
       LIMIT 1`,
      [orderId],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      flow: "meditations",
      path: `/api/meditations/my-sessions/${encodeURIComponent(row.id)}/confirm-payment`,
      body: {},
      authUser: { id: row.user_id, email: row.email, role: row.role as "student" | "professor" | "admin" },
    };
  }

  const result = await pgPool.query<{ flow: PaymentTarget["flow"]; id: string; course_slug: string | null }>(
    `SELECT 'grile' AS flow, id::text, NULL AS course_slug FROM user_grile_payment_attempts WHERE revolut_order_id = $1
     UNION ALL
     SELECT 'courses', id::text, course_slug FROM user_course_payment_attempts WHERE revolut_order_id = $1
     UNION ALL
     SELECT 'bac', id::text, NULL FROM user_bac_correction_payment_attempts WHERE revolut_order_id = $1
     UNION ALL
     SELECT 'offers2027', id::text, NULL FROM user_offers_2027_payment_attempts WHERE revolut_order_id = $1
     LIMIT 1`,
    [orderId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return toAttemptTarget(row.flow, row.id, row.course_slug);
}

function toAttemptTarget(flow: PaymentTarget["flow"], attemptId: string, courseSlug: string | null): PaymentTarget {
  const body = { attemptId };
  switch (flow) {
    case "grile":
      return { flow, path: "/api/grile/access/confirm-payment", body };
    case "courses":
      return { flow, path: `/api/courses/${encodeURIComponent(courseSlug ?? "")}/confirm-payment`, body };
    case "bac":
      return { flow, path: "/api/bacalaureat/correction-payments/confirm", body };
    case "offers2027":
      return { flow, path: "/api/offers-2027/confirm-payment", body };
    default:
      throw new Error(`Unsupported flow ${flow}`);
  }
}

/** Apeleaza endpoint-ul confirm-payment existent pe loopback; intoarce `payment_status` raportat de el. */
async function runConfirm(target: PaymentTarget): Promise<string> {
  const port = Number(process.env.PORT ?? 4000);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (target.authUser) {
    headers.Authorization = `Bearer ${signAuthToken(target.authUser)}`;
  }
  const response = await fetch(`http://127.0.0.1:${port}${target.path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(target.body),
    signal: AbortSignal.timeout(60_000),
  });
  const payload = (await response.json().catch(() => null)) as {
    data?: { payment_status?: string; revolut_status?: string };
    error?: string;
  } | null;
  if (!response.ok) {
    throw new Error(`${target.flow} confirm failed (${response.status}): ${payload?.error ?? "unknown error"}`);
  }
  const status = payload?.data?.payment_status ?? "unknown";
  return payload?.data?.revolut_status ? `${status} (${payload.data.revolut_status})` : status;
}

/** Procesare eveniment webhook: gaseste comanda dupa order_id si ruleaza confirm-payment. */
export async function handleRevolutOrderEvent(merchant: RevolutMerchantKind, event: string, orderId: string) {
  const target = await findPaymentTarget(merchant, orderId);
  if (!target) {
    // Ex.: plati din vechiul sistem / comenzi create direct din dashboard-ul Revolut, sau o comanda de meditatii
    // al carei order id a fost suprascris de o incercare de plata ulterioara.
    console.warn(`[revolut-webhook] ${merchant} ${event} order ${orderId}: no matching payment in DB`);
    return;
  }
  const status = await runConfirm(target);
  console.log(`[revolut-webhook] ${merchant} ${event} order ${orderId} → ${target.flow}: ${status}`);
}

/** Toate platile pending recente (cu comanda Revolut creata) — candidatii pentru reconciliere. */
async function listPendingTargets(): Promise<Array<PaymentTarget & { orderId: string }>> {
  const attempts = await pgPool.query<{
    flow: PaymentTarget["flow"];
    id: string;
    course_slug: string | null;
    revolut_order_id: string;
  }>(
    `SELECT 'grile' AS flow, id::text, NULL AS course_slug, revolut_order_id
       FROM user_grile_payment_attempts
      WHERE status = 'pending' AND revolut_order_id IS NOT NULL
        AND created_at BETWEEN NOW() - INTERVAL '3 days' AND NOW() - INTERVAL '5 minutes'
     UNION ALL
     SELECT 'courses', id::text, course_slug, revolut_order_id
       FROM user_course_payment_attempts
      WHERE status = 'pending' AND revolut_order_id IS NOT NULL
        AND created_at BETWEEN NOW() - INTERVAL '3 days' AND NOW() - INTERVAL '5 minutes'
     UNION ALL
     SELECT 'bac', id::text, NULL, revolut_order_id
       FROM user_bac_correction_payment_attempts
      WHERE status = 'pending' AND revolut_order_id IS NOT NULL
        AND created_at BETWEEN NOW() - INTERVAL '3 days' AND NOW() - INTERVAL '5 minutes'
     UNION ALL
     SELECT 'offers2027', id::text, NULL, revolut_order_id
       FROM user_offers_2027_payment_attempts
      WHERE status = 'pending' AND revolut_order_id IS NOT NULL
        AND created_at BETWEEN NOW() - INTERVAL '3 days' AND NOW() - INTERVAL '5 minutes'`,
  );
  // Sedintele de meditatii nu au timestamp pentru momentul platii; limitam dupa data sedintei.
  const sessions = await pgPool.query<{ id: string; user_id: string; email: string; role: string; revolut_order_id: string }>(
    `SELECT s.id, s.user_id, u.email, u.role, s.revolut_order_id
     FROM meditation_member_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.is_paid = false AND s.revolut_order_id IS NOT NULL
       AND s.session_date >= CURRENT_DATE - INTERVAL '60 days'`,
  );
  return [
    ...attempts.rows.map((row) => ({
      ...toAttemptTarget(row.flow, row.id, row.course_slug),
      orderId: row.revolut_order_id,
    })),
    ...sessions.rows.map((row) => ({
      flow: "meditations" as const,
      path: `/api/meditations/my-sessions/${encodeURIComponent(row.id)}/confirm-payment`,
      body: {},
      authUser: { id: row.user_id, email: row.email, role: row.role as "student" | "professor" | "admin" },
      orderId: row.revolut_order_id,
    })),
  ];
}

export async function reconcilePendingRevolutPayments() {
  let targets: Awaited<ReturnType<typeof listPendingTargets>>;
  try {
    targets = await listPendingTargets();
  } catch (error) {
    // Tabelele sunt create lazy de rute; la un DB proaspat pot lipsi inca.
    console.error("[revolut-reconcile] could not list pending payments:", error);
    return;
  }
  for (const target of targets) {
    try {
      const status = await runConfirm(target);
      if (status.startsWith("paid")) {
        console.log(`[revolut-reconcile] ${target.flow} order ${target.orderId}: finalized (${status})`);
      }
    } catch (error) {
      console.error(`[revolut-reconcile] ${target.flow} order ${target.orderId}:`, error);
    }
  }
}

let reconcileTimer: NodeJS.Timeout | null = null;

export function startRevolutReconciliationJob() {
  if (reconcileTimer || process.env.REVOLUT_RECONCILE_DISABLED === "1") return;
  const intervalMs = 10 * 60 * 1000;
  let running = false;
  const tick = () => {
    if (running) return;
    running = true;
    reconcilePendingRevolutPayments()
      .catch((error) => console.error("[revolut-reconcile] tick failed:", error))
      .finally(() => {
        running = false;
      });
  };
  // Primul tick dupa 1 minut, ca serverul sa fie pornit complet (loopback-ul are nevoie de el).
  setTimeout(tick, 60 * 1000).unref();
  reconcileTimer = setInterval(tick, intervalMs);
  reconcileTimer.unref();
}
