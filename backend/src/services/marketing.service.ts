import { createHash, randomUUID } from "node:crypto";
import type { Request } from "express";
import { pgPool } from "../db/postgres";

/**
 * Masurare funnel (vizite → demo → cont → trial → plata) si atribuire pe campanii.
 *
 * Principii (platforma are si elevi minori):
 * - Nu stocam IP-uri in clar: doar un hash cu sare zilnica, folosit la rate-limit/deduplicare grosiera.
 * - Atribuirea (utm_*) ajunge pe server doar daca vizitatorul a acceptat cookie-urile de statistica (vezi frontend).
 * - ttclid si trimiterea catre TikTok Events API se fac doar cu consimtamant de marketing, salvat pe user.
 * - Catre TikTok nu trimitem niciodata email, telefon, nume sau rezultate scolare.
 */

export const EXAM_KEYS = ["ubb", "ub", "unstpb", "iasi", "bac"] as const;
export type ExamKey = (typeof EXAM_KEYS)[number];

/** Categoria de grile pe care se face demo-ul pentru fiecare examen. */
export const EXAM_GRILE_CATEGORY: Record<ExamKey, string> = {
  ubb: "admitere-ubb",
  ub: "admitere-ub",
  unstpb: "admitere-unstpb",
  iasi: "admitere-tu-iasi",
  bac: "bacalaureat",
};

export function parseExamKey(value: unknown): ExamKey | null {
  return typeof value === "string" && (EXAM_KEYS as readonly string[]).includes(value) ? (value as ExamKey) : null;
}

const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export type UtmFields = Partial<Record<(typeof UTM_FIELDS)[number], string>>;

/** Valorile utm vin din URL-uri publice: le limitam la un set sigur de caractere si la o lungime rezonabila. */
export function cleanUtmValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().toLowerCase().replace(/[^a-z0-9_\-.+ ]/g, "").slice(0, 100);
  return cleaned || null;
}

export function pickUtm(source: Record<string, unknown> | null | undefined): UtmFields {
  const result: UtmFields = {};
  if (!source) return result;
  for (const field of UTM_FIELDS) {
    const value = cleanUtmValue(source[field]);
    if (value) result[field] = value;
  }
  return result;
}

export function clientIp(req: Request): string {
  return (req.ip || req.socket.remoteAddress || "").replace(/^::ffff:/, "");
}

/** Hash cu sare zilnica: suficient pentru limitare de abuz in aceeasi zi, inutil pentru urmarire pe termen lung. */
export function dailyIpHash(req: Request): string {
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.MARKETING_HASH_SALT?.trim() || "zli-mkt";
  return createHash("sha256").update(`${salt}:${day}:${clientIp(req)}`).digest("hex").slice(0, 32);
}

const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|bytespider|pingdom|uptime|curl|wget|python-requests|axios|node-fetch/i;
export function isLikelyBot(req: Request): boolean {
  const ua = req.header("user-agent") ?? "";
  return !ua || BOT_UA.test(ua);
}

let tablesReady: Promise<void> | null = null;

/** Doar tabele noi (CREATE IF NOT EXISTS); nu modifica nimic existent. Memoizat ca sa nu concureze DDL-uri. */
export function ensureMarketingTables(): Promise<void> {
  if (!tablesReady) {
    tablesReady = (async () => {
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS mkt_page_hits_daily (
          day DATE NOT NULL,
          page_group TEXT NOT NULL,
          exam TEXT NOT NULL DEFAULT '',
          utm_source TEXT NOT NULL DEFAULT '',
          utm_campaign TEXT NOT NULL DEFAULT '',
          hits INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (day, page_group, exam, utm_source, utm_campaign)
        );
        CREATE TABLE IF NOT EXISTS user_acquisition (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          utm_source TEXT,
          utm_medium TEXT,
          utm_campaign TEXT,
          utm_content TEXT,
          utm_term TEXT,
          ttclid TEXT,
          landing_path TEXT,
          exam TEXT,
          first_touch_at TIMESTAMPTZ,
          marketing_consent BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS grile_demo_questions (
          exam TEXT NOT NULL,
          question_id UUID NOT NULL REFERENCES grile_questions(id) ON DELETE CASCADE,
          band TEXT NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (exam, question_id)
        );
        CREATE TABLE IF NOT EXISTS demo_sessions (
          id UUID PRIMARY KEY,
          exam TEXT NOT NULL,
          question_ids UUID[] NOT NULL,
          answers JSONB NOT NULL DEFAULT '{}'::jsonb,
          hints_opened UUID[] NOT NULL DEFAULT '{}',
          utm_source TEXT,
          utm_medium TEXT,
          utm_campaign TEXT,
          utm_content TEXT,
          ip_hash TEXT,
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          completed_at TIMESTAMPTZ
        );
        CREATE INDEX IF NOT EXISTS idx_demo_sessions_created ON demo_sessions(created_at DESC);
        CREATE TABLE IF NOT EXISTS mkt_conversions (
          id BIGSERIAL PRIMARY KEY,
          kind TEXT NOT NULL,
          flow TEXT NOT NULL,
          ref_id TEXT NOT NULL,
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          product_code TEXT,
          value_ron NUMERIC(10, 2),
          event_id TEXT NOT NULL,
          tiktok_status TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (flow, ref_id)
        );
        CREATE INDEX IF NOT EXISTS idx_mkt_conversions_created ON mkt_conversions(created_at DESC);
        CREATE TABLE IF NOT EXISTS mkt_ad_spend (
          day DATE NOT NULL,
          utm_source TEXT NOT NULL,
          utm_campaign TEXT NOT NULL DEFAULT '',
          amount_ron NUMERIC(10, 2) NOT NULL,
          note TEXT,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (day, utm_source, utm_campaign)
        );
      `);
    })().catch((error) => {
      tablesReady = null;
      throw error;
    });
  }
  return tablesReady;
}

const PAGE_GROUPS = new Set(["home", "pachete", "pachet", "test-gratuit", "grile", "cursuri", "other"]);

/** Contor agregat pe zi, fara cookie si fara identificator: nu necesita consimtamant. */
export async function recordPageHit(input: { pageGroup: string; exam: string | null; utm: UtmFields }) {
  await ensureMarketingTables();
  const group = PAGE_GROUPS.has(input.pageGroup) ? input.pageGroup : "other";
  await pgPool.query(
    `INSERT INTO mkt_page_hits_daily (day, page_group, exam, utm_source, utm_campaign, hits)
     VALUES ((NOW() AT TIME ZONE 'Europe/Bucharest')::date, $1, $2, $3, $4, 1)
     ON CONFLICT (day, page_group, exam, utm_source, utm_campaign) DO UPDATE SET hits = mkt_page_hits_daily.hits + 1`,
    [group, input.exam ?? "", input.utm.utm_source ?? "", input.utm.utm_campaign ?? ""],
  );
}

/** Prima atingere castiga: daca userul are deja atribuire, nu o suprascriem (doar consimtamantul se actualizeaza). */
export async function saveUserAcquisition(
  userId: string,
  input: { utm: UtmFields; ttclid: string | null; landingPath: string | null; exam: ExamKey | null; firstTouchAt: string | null; marketingConsent: boolean },
) {
  await ensureMarketingTables();
  const firstTouch = input.firstTouchAt && !Number.isNaN(Date.parse(input.firstTouchAt)) ? input.firstTouchAt : null;
  await pgPool.query(
    `INSERT INTO user_acquisition (user_id, utm_source, utm_medium, utm_campaign, utm_content, utm_term, ttclid, landing_path, exam, first_touch_at, marketing_consent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (user_id) DO UPDATE SET
       exam = COALESCE(user_acquisition.exam, EXCLUDED.exam),
       ttclid = CASE WHEN EXCLUDED.marketing_consent THEN COALESCE(user_acquisition.ttclid, EXCLUDED.ttclid) ELSE NULL END,
       marketing_consent = EXCLUDED.marketing_consent,
       updated_at = NOW()`,
    [
      userId,
      input.utm.utm_source ?? null,
      input.utm.utm_medium ?? null,
      input.utm.utm_campaign ?? null,
      input.utm.utm_content ?? null,
      input.utm.utm_term ?? null,
      input.marketingConsent ? input.ttclid : null,
      input.landingPath,
      input.exam,
      firstTouch,
      input.marketingConsent,
    ],
  );
}

export async function setUserExam(userId: string, exam: ExamKey) {
  await ensureMarketingTables();
  await pgPool.query(
    `INSERT INTO user_acquisition (user_id, exam) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET exam = EXCLUDED.exam, updated_at = NOW()`,
    [userId, exam],
  );
}

// ---------------------------------------------------------------------------------------------
// TikTok Events API (server-side). Activ doar daca TIKTOK_PIXEL_ID + TIKTOK_EVENTS_API_TOKEN sunt setate.
// ---------------------------------------------------------------------------------------------

type TikTokEventName = "Purchase" | "StartTrial" | "CompleteRegistration";

function tiktokConfig() {
  const pixelId = process.env.TIKTOK_PIXEL_ID?.trim() ?? "";
  const token = process.env.TIKTOK_EVENTS_API_TOKEN?.trim() ?? "";
  const url = process.env.TIKTOK_EVENTS_API_URL?.trim() || "https://business-api.tiktok.com/open_api/v1.3/event/track/";
  const testEventCode = process.env.TIKTOK_TEST_EVENT_CODE?.trim() || null;
  return { enabled: Boolean(pixelId && token), pixelId, token, url, testEventCode };
}

async function sendTikTokEvent(args: {
  event: TikTokEventName;
  eventId: string;
  ttclid: string | null;
  pageUrl: string;
  properties?: Record<string, unknown>;
}): Promise<string> {
  const config = tiktokConfig();
  if (!config.enabled) return "skipped:not_configured";
  const body: Record<string, unknown> = {
    event_source: "web",
    event_source_id: config.pixelId,
    data: [
      {
        event: args.event,
        event_time: Math.floor(Date.now() / 1000),
        event_id: args.eventId,
        // Intentionat fara email/telefon/external_id (fara Advanced Matching) si fara IP/UA.
        user: args.ttclid ? { ttclid: args.ttclid } : {},
        page: { url: args.pageUrl },
        properties: args.properties ?? {},
      },
    ],
  };
  if (config.testEventCode) body.test_event_code = config.testEventCode;
  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: { "Access-Token": config.token, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    const json = (await response.json().catch(() => null)) as { code?: number; message?: string } | null;
    if (!response.ok || (json && json.code !== 0)) {
      return `error:${response.status}:${json?.message ?? ""}`.slice(0, 200);
    }
    return "sent";
  } catch (error) {
    return `error:${error instanceof Error ? error.message : "unknown"}`.slice(0, 200);
  }
}

function appBaseUrl() {
  return (process.env.APP_BASE_URL?.trim() || "https://www.zecelainfo.ro").replace(/\/$/, "");
}

/**
 * Inregistreaza o conversie o singura data (UNIQUE flow+ref_id) si, doar la prima inregistrare, o trimite la TikTok.
 * Apelata dupa COMMIT-ul care marcheaza plata ca `paid`; la webhook repetat / refresh, INSERT-ul nu mai insereaza nimic,
 * deci nu exista dublare. `eventId` e acelasi pe care frontend-ul il foloseste pentru Pixel (deduplicare TikTok).
 */
export async function recordConversion(args: {
  kind: "purchase" | "trial";
  flow: string;
  refId: string;
  userId: string;
  productCode: string;
  valueRon: number;
  pagePath: string;
}): Promise<void> {
  try {
    await ensureMarketingTables();
    const eventId = conversionEventId(args.kind, args.refId);
    const inserted = await pgPool.query<{ id: string }>(
      `INSERT INTO mkt_conversions (kind, flow, ref_id, user_id, product_code, value_ron, event_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (flow, ref_id) DO NOTHING
       RETURNING id`,
      [args.kind, args.flow, args.refId, args.userId, args.productCode, args.valueRon, eventId],
    );
    const rowId = inserted.rows[0]?.id;
    if (!rowId) return;

    const consent = await pgPool.query<{ marketing_consent: boolean; ttclid: string | null }>(
      `SELECT marketing_consent, ttclid FROM user_acquisition WHERE user_id = $1`,
      [args.userId],
    );
    const row = consent.rows[0];
    let status: string;
    if (!row?.marketing_consent) {
      status = "skipped:no_consent";
    } else if (args.kind === "purchase" && args.valueRon <= 0) {
      status = "skipped:zero_value";
    } else {
      status = await sendTikTokEvent({
        event: args.kind === "purchase" ? "Purchase" : "StartTrial",
        eventId,
        ttclid: row.ttclid,
        pageUrl: `${appBaseUrl()}${args.pagePath}`,
        properties:
          args.kind === "purchase"
            ? {
                currency: "RON",
                value: args.valueRon,
                content_type: "product",
                contents: [{ content_id: args.productCode, quantity: 1, price: args.valueRon }],
              }
            : { content_type: "product", contents: [{ content_id: "free_24h" }] },
      });
    }
    await pgPool.query(`UPDATE mkt_conversions SET tiktok_status = $2 WHERE id = $1`, [rowId, status]);
  } catch (error) {
    // Masurarea nu are voie sa strice o plata sau o activare.
    console.error("[marketing] recordConversion failed:", error);
  }
}

/** Format comun cu frontend-ul (lib/track.ts): `purchase_<attemptId>`, `trial_<userId>`. */
export function conversionEventId(kind: "purchase" | "trial", refId: string): string {
  return `${kind}_${refId}`;
}

export function newDemoSessionId(): string {
  return randomUUID();
}

/** Atasat la raspunsurile confirm-payment cu status `paid`, ca Pixel-ul sa foloseasca acelasi event_id ca serverul. */
export function purchaseTrackingPayload(refId: string, productCode: string, valueRon: number) {
  return { event_id: conversionEventId("purchase", refId), product_code: productCode, value: Number(valueRon), currency: "RON" };
}
