import { purchaseTrackingPayload, recordConversion } from "../services/marketing.service";
import { type NextFunction, type Request, type Response, Router } from "express";
import type { PoolClient } from "pg";
import { promises as fs } from "node:fs";
import { z } from "zod";
import { pgPool } from "../db/postgres";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  parseQuestionImageUpload,
  persistQuestionImage,
  removeQuestionImageFiles,
} from "../services/grilaQuestionImage.service";
import { GRILE_AI_CONTENT_FORMAT, GRILE_AI_PROMPT_VERSION, normalizeAnswer, processSingleGrilaAI } from "../services/grile-ai.service";
import {
  GRILE_INVOICES_DIR,
  downloadSmartbillInvoicePdf,
  getAppBaseUrl,
  issueSmartbillInvoiceWithProducts,
  persistInvoicePdfToDirectory,
  revolutCreateOrder,
  revolutFetchOrder,
  sanitizeInvoiceFileName,
} from "../services/revolutSmartbill.service";
import {
  applyPercentDiscount,
  ensureDiscountCodesTable,
  incrementDiscountCodeUses,
  resolveActiveDiscountCode,
} from "../services/discountCode.service";
import {
  billingProfileActivateSchema,
  persistUserBillingProfile,
} from "../services/userBillingProfile.service";
import {
  generateSixDigitOtp,
  hashTrialSmsOtp,
  isGrileTrialSmsConfigured,
  normalizePhoneToE164,
  phoneE164ToSmslinkTo,
  smslinkSendTransactionalSms,
  trialSmsCodeMatchesStored,
} from "../services/grileTrialSms.service";
import { sendGrileReportResolutionEmail, sendPurchaseThankYouEmail, sendTrialActivatedEmail } from "../services/email.service";
import {
  assertLegacyUserImportAllowed,
  fetchLegacyGrileProgress,
  getLegacyImportLog,
  importLegacyGrileProgress,
  isLegacyGrileImportConfigured,
  LegacyUserAlreadyImportedError,
} from "../services/grileLegacyImport.service";
import { OFFERS_2027_ACCESS_UNTIL } from "../services/offers2027.service";
import { ensureCoursesTable } from "./courses";

const viewSchema = z.enum(["sources", "chapters"]);
const contentTypeSchema = z.enum(["hint", "short_explanation", "full_explanation", "video"]);

type GrileCategoryRow = {
  id: string;
  slug: string;
  name: string;
};

type GrilaQuestionRow = {
  id: string;
  legacy_id: number;
  image_url: string | null;
  answer: string | null;
  hint: string | null;
  short_explanation: string | null;
  full_explanation: string | null;
  explanation: string | null;
  video_url: string | null;
  difficulty: number | null;
  order_index: number | null;
  variants_count: number | null;
  chapter_names: string[] | null;
};

type ExamQuestionRow = {
  id: string;
  order_index: number | null;
  legacy_id: number;
  image_url: string | null;
  variants_count: number | null;
  answer: string | null;
  hint: string | null;
  short_explanation: string | null;
  full_explanation: string | null;
  explanation: string | null;
  video_url: string | null;
};

type GrilePlanCode = "free_24h" | "month_1" | "month_3" | "until_2027";

const GRILE_FREE_TRIAL_AVAILABLE = true;
const GRILE_FREE_TRIAL_UNAVAILABLE_MESSAGE =
  "Accesul gratuit de 24h este indisponibil momentan, pentru a limita abuzurile. Alege un abonament plătit sau revino mai târziu.";

const GRILE_PLANS: Array<{
  code: GrilePlanCode;
  name: string;
  durationHours: number;
  /** Daca e setat, accesul e extins pana la aceasta data fixa in loc de durationHours de la momentul cumpararii. */
  fixedUntil?: Date;
  isFree: boolean;
  priceRon: number;
}> = [
  { code: "free_24h", name: "Acces gratuit 24h", durationHours: 24, isFree: true, priceRon: 0 },
  { code: "month_1", name: "Abonament 1 luna", durationHours: 24 * 30, isFree: false, priceRon: 150 },
  { code: "month_3", name: "Abonament 3 luni", durationHours: 24 * 90, isFree: false, priceRon: 399 },
  {
    code: "until_2027",
    name: "Acces pana la 1 August 2027",
    durationHours: 0,
    fixedUntil: OFFERS_2027_ACCESS_UNTIL,
    isFree: false,
    priceRon: 699,
  },
];

/** Planurile platite, cu pretul real, pentru paginile publice de preturi (/api/marketing/pricing). */
export function GRILE_PUBLIC_PLANS() {
  return GRILE_PLANS.filter((plan) => !plan.isFree).map((plan) => ({
    code: plan.code,
    name: plan.name,
    price_ron: plan.priceRon,
    duration_days: plan.fixedUntil ? null : Math.round(plan.durationHours / 24),
    fixed_until: plan.fixedUntil ? plan.fixedUntil.toISOString() : null,
  }));
}

function isGrileExamModeExcluded(sourceName: string, categorySlug: string): boolean {
  if (categorySlug === "bacalaureat" || categorySlug === "admitere-atm") return true;
  if (categorySlug === "admitere-ubb" && (/\b2018\b/i.test(sourceName) || /\b2019\b/i.test(sourceName))) return true;
  const normalized = sourceName.toLowerCase();
  if (
    sourceName === "Culegere 115 Grile" ||
    sourceName === "Culegere 230 grile" ||
    sourceName === "Culegere Admitere UBB 2025" ||
    (normalized.includes("culegere 115") && normalized.includes("antrenament ubb")) ||
    (normalized.includes("culegere 230") && normalized.includes("antrenament ubb"))
  ) {
    return true;
  }
  return false;
}

async function upsertGrileExamSourceConfig(sourceId: string, sourceName: string, categorySlug: string) {
  const modeEnabled = !isGrileExamModeExcluded(sourceName, categorySlug);
  const durationSeconds =
    categorySlug === "admitere-ubb" ||
    categorySlug === "admitere-tu-iasi" ||
    (categorySlug === "admitere-ub" && /concurs mate info ub/i.test(sourceName))
      ? 10800
      : 5400;
  const scoringMode = categorySlug === "admitere-ubb" ? "ubb" : "all_or_nothing";
  await pgPool.query(
    `INSERT INTO grile_exam_source_configs (source_id, mode_enabled, duration_seconds, scoring_mode, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (source_id) DO UPDATE
       SET mode_enabled = EXCLUDED.mode_enabled,
           duration_seconds = EXCLUDED.duration_seconds,
           scoring_mode = EXCLUDED.scoring_mode,
           updated_at = NOW()`,
    [sourceId, modeEnabled, durationSeconds, scoringMode],
  );
}

async function persistGrileInvoicePdfLocally(invoiceNumber: string, pdf: { fileName: string; buffer: Buffer }) {
  return persistInvoicePdfToDirectory(GRILE_INVOICES_DIR, invoiceNumber, pdf);
}

async function maybeIssueSmartbillInvoice(args: {
  billingProfile: z.infer<typeof billingProfileActivateSchema>;
  userEmail: string;
  planName: string;
  planCode: GrilePlanCode;
  priceRon: number;
  extraNameSuffix?: string;
}) {
  const base = `${args.planName} (${args.planCode})`;
  const name = args.extraNameSuffix ? `${base}${args.extraNameSuffix}`.slice(0, 400) : base;
  return issueSmartbillInvoiceWithProducts({
    billingProfile: args.billingProfile,
    userEmail: args.userEmail,
    products: [
      {
        name,
        priceRon: Number(args.priceRon.toFixed(2)),
        quantity: 1,
        isService: true,
      },
    ],
  });
}

async function grantGrilePaidPlanInTransaction(
  client: PoolClient,
  userId: string,
  plan: { code: GrilePlanCode; name: string; durationHours: number; fixedUntil?: Date; priceRon: number },
  args: {
    billingSnapshot: z.infer<typeof billingProfileActivateSchema>;
    attemptId: string;
    paidAmount: number;
    invoiceNumber: string | null;
    invoiceUrl: string | null;
    invoiceLocalPath: string | null;
    discountCodeId: string | null;
  },
) {
  const currentResult = await client.query<{ access_until: string | null; trial_used: boolean }>(
    `SELECT access_until::text, trial_used
     FROM user_grile_access
     WHERE user_id = $1
     LIMIT 1
     FOR UPDATE`,
    [userId],
  );
  const current = currentResult.rows[0] ?? { access_until: null, trial_used: false };
  const baseDate =
    current.access_until && new Date(current.access_until).getTime() > Date.now()
      ? new Date(current.access_until)
      : new Date();
  const nextAccessUntil = plan.fixedUntil
    ? new Date(Math.max(plan.fixedUntil.getTime(), baseDate.getTime()))
    : new Date(baseDate.getTime() + plan.durationHours * 60 * 60 * 1000);
  const nextAccessUntilIso = nextAccessUntil.toISOString();

  await client.query(
    `INSERT INTO user_grile_access (user_id, access_until, trial_used, current_plan_code, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET
       access_until = EXCLUDED.access_until,
       trial_used = user_grile_access.trial_used OR EXCLUDED.trial_used,
       current_plan_code = EXCLUDED.current_plan_code,
       updated_at = NOW()`,
    [userId, nextAccessUntilIso, false, plan.code],
  );
  const insertEvent = await client.query<{ id: string }>(
    `INSERT INTO user_grile_access_events (
       user_id, plan_code, plan_name, starts_at, ends_at, is_free, is_paid, paid_amount, currency, invoice_number, invoice_url, invoice_local_path, invoice_issued_at, billing_snapshot, terms_accepted_at
     )
     VALUES ($1, $2, $3, NOW(), $4, FALSE, TRUE, $5, $6, $7, $8, $9, $10, $11::jsonb, NOW())
     RETURNING id`,
    [
      userId,
      plan.code,
      plan.name,
      nextAccessUntilIso,
      Number(args.paidAmount.toFixed(2)),
      "RON",
      args.invoiceNumber,
      args.invoiceUrl,
      args.invoiceLocalPath,
      args.invoiceNumber ? new Date().toISOString() : null,
      JSON.stringify(args.billingSnapshot),
    ],
  );
  const accessEventId = insertEvent.rows[0]?.id ?? null;
  await client.query(
    `UPDATE user_grile_payment_attempts
     SET status = 'paid',
         paid_at = NOW(),
         invoice_number = $2,
         invoice_url = $3,
         invoice_local_path = $4,
         invoice_issued_at = $5,
         updated_at = NOW()
     WHERE id = $1`,
    [args.attemptId, args.invoiceNumber, args.invoiceUrl, args.invoiceLocalPath, args.invoiceNumber ? new Date().toISOString() : null],
  );
  if (args.discountCodeId) {
    await incrementDiscountCodeUses(client, args.discountCodeId);
  }
  return { nextAccessUntilIso, accessEventId };
}

async function ensureAdminRole(userId?: string) {
  const roleResult = await pgPool.query<{ role: "student" | "professor" | "admin" }>(
    `SELECT role FROM users WHERE id = $1 LIMIT 1`,
    [userId],
  );
  const role = roleResult.rows[0]?.role;
  return role && ["professor", "admin"].includes(role);
}

async function ensureStrictAdminRole(userId?: string) {
  const roleResult = await pgPool.query<{ role: "student" | "professor" | "admin" }>(
    `SELECT role FROM users WHERE id = $1 LIMIT 1`,
    [userId],
  );
  return roleResult.rows[0]?.role === "admin";
}

type GrileSourceRow = {
  id: string;
  name: string;
  category_id: string;
  is_published: boolean;
  published_at: string | null;
  order_index: number | null;
  default_variants_count: number;
};

async function getSourceById(sourceId: string): Promise<GrileSourceRow | null> {
  const result = await pgPool.query<GrileSourceRow>(
    `SELECT id, name, category_id, is_published, published_at::text, order_index, default_variants_count
     FROM grile_sources
     WHERE id = $1
     LIMIT 1`,
    [sourceId],
  );
  return result.rows[0] ?? null;
}

async function canViewUnpublishedSource(userId?: string) {
  return ensureStrictAdminRole(userId);
}

async function assertPublishedSourceForPublic(userId: string | undefined, sourceId: string) {
  const source = await getSourceById(sourceId);
  if (!source) {
    return { ok: false as const, status: 404, code: "NOT_FOUND", error: "Source not found" };
  }
  if (source.is_published) {
    return { ok: true as const, source };
  }
  const isAdmin = await canViewUnpublishedSource(userId);
  if (isAdmin) {
    return { ok: true as const, source };
  }
  return { ok: false as const, status: 404, code: "NOT_FOUND", error: "Source not found" };
}

function extractVimeoVideoId(raw: string): string | null {
  const trimmed = raw.trim();
  const patterns = [
    /^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/i,
    /^https?:\/\/player\.vimeo\.com\/video\/(\d+)/i,
    /^(\d+)$/,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(trimmed);
    if (match?.[1]) return match[1];
  }
  return null;
}

function normalizeVimeoUrl(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const videoId = extractVimeoVideoId(trimmed);
  if (!videoId) {
    throw new Error("Link Vimeo invalid. Foloseste formatul https://vimeo.com/123456789");
  }
  return `https://player.vimeo.com/video/${videoId}`;
}

async function allocateNextLegacyId(client: PoolClient): Promise<number> {
  const result = await client.query<{ next_id: number }>(
    `SELECT COALESCE(MAX(legacy_id), 0) + 1 AS next_id FROM grile_questions`,
  );
  return Number(result.rows[0]?.next_id ?? 1);
}

async function allocateNextOrderIndexForSource(client: PoolClient, sourceId: string): Promise<number> {
  const result = await client.query<{ next_index: number }>(
    `SELECT COALESCE(MAX(order_index), 0) + 1 AS next_index
     FROM grile_questions
     WHERE source_id = $1`,
    [sourceId],
  );
  return Number(result.rows[0]?.next_index ?? 1);
}

async function syncQuestionChapters(client: PoolClient, questionId: string, chapterIds: string[]) {
  await client.query(`DELETE FROM grile_question_chapters WHERE question_id = $1`, [questionId]);
  const unique = [...new Set(chapterIds.filter(Boolean))];
  for (const chapterId of unique) {
    await client.query(
      `INSERT INTO grile_question_chapters (question_id, chapter_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [questionId, chapterId],
    );
  }
  const firstChapterId = unique[0] ?? null;
  await client.query(`UPDATE grile_questions SET chapter_id = $2 WHERE id = $1`, [questionId, firstChapterId]);
}

async function userHasActiveGrileAccess(userId: string) {
  const roleResult = await pgPool.query<{ role: "student" | "professor" | "admin" }>(
    `SELECT role FROM users WHERE id = $1 LIMIT 1`,
    [userId],
  );
  const role = roleResult.rows[0]?.role;
  if (role === "admin" || role === "professor") {
    return { hasAccess: true, role };
  }
  const accessResult = await pgPool.query<{ access_until: string | null }>(
    `SELECT access_until::text
     FROM user_grile_access
     WHERE user_id = $1
     LIMIT 1`,
    [userId],
  );
  const accessUntil = accessResult.rows[0]?.access_until ?? null;
  const hasAccess = Boolean(accessUntil && new Date(accessUntil).getTime() > Date.now());
  return { hasAccess, role, accessUntil };
}

function routeParamString(raw: string | string[] | undefined): string {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw[0] ?? "";
  return "";
}

function grileQuestionIdParam(raw: string | string[] | undefined): string {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw[0] ?? "";
  return "";
}

/** Elev in grupa de meditatii poate rezolva grile din temele grupei fara abonament grile separat. */
async function userHasHomeworkQuestionAccess(userId: string, questionId: string): Promise<boolean> {
  if (!questionId) return false;
  try {
    const result = await pgPool.query<{ ok: number }>(
      `SELECT 1 AS ok
       FROM meditation_group_memberships m
       JOIN meditation_homework_assignments a ON a.group_id = m.group_id AND a.kind = 'grile'
       JOIN meditation_homework_grile_items i ON i.assignment_id = a.id AND i.question_id = $2
       WHERE m.user_id = $1
       LIMIT 1`,
      [userId, questionId],
    );
    return Boolean(result.rows[0]?.ok);
  } catch {
    return false;
  }
}

async function requireGrileAccessMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Missing token", code: "UNAUTHORIZED" });
      return;
    }
    const access = await userHasActiveGrileAccess(userId);
    if (access.hasAccess) {
      next();
      return;
    }
    const questionId = grileQuestionIdParam(req.params.questionId);
    if (questionId && (await userHasHomeworkQuestionAccess(userId, questionId))) {
      next();
      return;
    }
    res.status(403).json({ error: "Grile subscription required", code: "GRILE_ACCESS_REQUIRED" });
  } catch (error) {
    console.error("Failed to validate grile access:", error);
    res.status(500).json({ error: "Failed to validate grile access", code: "INTERNAL_ERROR" });
  }
}

let grileTablesEnsured = false;
let grileTablesEnsurePromise: Promise<void> | null = null;

export async function ensureGrileTables() {
  if (grileTablesEnsured) return;
  if (grileTablesEnsurePromise) {
    await grileTablesEnsurePromise;
    return;
  }

  grileTablesEnsurePromise = (async () => {
  await ensureDiscountCodesTable();
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS grile_categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS grile_sources (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      category_id UUID NOT NULL REFERENCES grile_categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (category_id, name)
    );
  `);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS grile_chapters (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      category_id UUID NOT NULL REFERENCES grile_categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (category_id, name)
    );
  `);
  await pgPool.query(`ALTER TABLE grile_sources ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE`);
  await pgPool.query(`ALTER TABLE grile_sources ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ`);
  await pgPool.query(`ALTER TABLE grile_sources ADD COLUMN IF NOT EXISTS default_variants_count INTEGER NOT NULL DEFAULT 4`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_grile_sources_category_id ON grile_sources(category_id)`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_grile_sources_category_published ON grile_sources(category_id, is_published)`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_grile_chapters_category_id ON grile_chapters(category_id)`);

  await pgPool.query(
    `INSERT INTO grile_categories (slug, name)
     VALUES
      ('admitere-ubb', 'Admitere UBB'),
      ('admitere-unstpb', 'Admitere UNSTPB'),
      ('admitere-ub', 'Admitere UB'),
      ('admitere-tu-iasi', 'Admitere TU Iasi'),
      ('admitere-atm', 'Admitere ATM'),
      ('bacalaureat', 'Bacalaureat')
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name`,
  );
  await pgPool.query(
    `INSERT INTO grile_sources (category_id, name)
     SELECT c.id, 'Examen Admitere Vara 2021'
     FROM grile_categories c
     WHERE c.slug = 'admitere-ubb'
     ON CONFLICT (category_id, name) DO NOTHING`,
  );
  await pgPool.query(
    `INSERT INTO grile_chapters (category_id, name)
     SELECT c.id, v.name
     FROM grile_categories c
     CROSS JOIN (VALUES ('Divizibilitate'), ('Cifrele unui Numar')) AS v(name)
     WHERE c.slug = 'admitere-ubb'
     ON CONFLICT (category_id, name) DO NOTHING`,
  );

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS grile_user_question_state (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id UUID NOT NULL REFERENCES grile_questions(id) ON DELETE CASCADE,
      is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
      in_my_list BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, question_id)
    );
  `);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS grile_user_attempts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id UUID NOT NULL REFERENCES grile_questions(id) ON DELETE CASCADE,
      selected_answers TEXT NOT NULL,
      is_correct BOOLEAN NOT NULL,
      attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_grile_attempts_user_question_time ON grile_user_attempts(user_id, question_id, attempted_at DESC)`);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS grile_user_content_feedback (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id UUID NOT NULL REFERENCES grile_questions(id) ON DELETE CASCADE,
      content_type TEXT NOT NULL CHECK (content_type IN ('hint', 'short_explanation', 'full_explanation', 'video')),
      rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, question_id, content_type)
    );
  `);
  await pgPool.query(`
    ALTER TABLE grile_user_content_feedback
    DROP CONSTRAINT IF EXISTS grile_user_content_feedback_content_type_check
  `);
  await pgPool.query(`
    UPDATE grile_user_content_feedback
    SET content_type = 'full_explanation'
    WHERE content_type = 'explanation'
  `);
  await pgPool.query(`
    ALTER TABLE grile_user_content_feedback
    ADD CONSTRAINT grile_user_content_feedback_content_type_check
    CHECK (content_type IN ('hint', 'short_explanation', 'full_explanation', 'video'))
  `);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_grile_feedback_question_type ON grile_user_content_feedback(question_id, content_type)`);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS user_grile_access (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      access_until TIMESTAMPTZ,
      trial_used BOOLEAN NOT NULL DEFAULT FALSE,
      current_plan_code TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS user_grile_access_events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_code TEXT NOT NULL,
      plan_name TEXT NOT NULL,
      starts_at TIMESTAMPTZ NOT NULL,
      ends_at TIMESTAMPTZ NOT NULL,
      is_free BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_user_grile_access_events_user_created ON user_grile_access_events(user_id, created_at DESC)`);
  await pgPool.query(`ALTER TABLE user_grile_access_events ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT FALSE`);
  await pgPool.query(`ALTER TABLE user_grile_access_events ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10, 2)`);
  await pgPool.query(`ALTER TABLE user_grile_access_events ADD COLUMN IF NOT EXISTS currency TEXT`);
  await pgPool.query(`ALTER TABLE user_grile_access_events ADD COLUMN IF NOT EXISTS invoice_number TEXT`);
  await pgPool.query(`ALTER TABLE user_grile_access_events ADD COLUMN IF NOT EXISTS invoice_url TEXT`);
  await pgPool.query(`ALTER TABLE user_grile_access_events ADD COLUMN IF NOT EXISTS invoice_local_path TEXT`);
  await pgPool.query(`ALTER TABLE user_grile_access_events ADD COLUMN IF NOT EXISTS invoice_issued_at TIMESTAMPTZ`);
  await pgPool.query(`ALTER TABLE user_grile_access_events ADD COLUMN IF NOT EXISTS billing_snapshot JSONB`);
  await pgPool.query(`ALTER TABLE user_grile_access_events ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ`);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS user_grile_payment_attempts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_code TEXT NOT NULL,
      plan_name TEXT NOT NULL,
      amount NUMERIC(10, 2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'RON',
      status TEXT NOT NULL DEFAULT 'pending',
      revolut_order_id TEXT UNIQUE,
      revolut_checkout_url TEXT,
      paid_at TIMESTAMPTZ,
      invoice_number TEXT,
      invoice_url TEXT,
      invoice_local_path TEXT,
      invoice_issued_at TIMESTAMPTZ,
      billing_snapshot JSONB NOT NULL,
      terms_accepted_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pgPool.query(
    `CREATE INDEX IF NOT EXISTS idx_user_grile_payment_attempts_user_created ON user_grile_payment_attempts(user_id, created_at DESC)`,
  );
  await pgPool.query(`ALTER TABLE user_grile_payment_attempts ADD COLUMN IF NOT EXISTS invoice_local_path TEXT`);
  await pgPool.query(`ALTER TABLE user_grile_payment_attempts ADD COLUMN IF NOT EXISTS discount_code_id UUID`);
  await pgPool.query(`ALTER TABLE user_grile_payment_attempts ADD COLUMN IF NOT EXISTS discount_percent_applied SMALLINT`);
  await pgPool.query(`ALTER TABLE user_grile_payment_attempts ADD COLUMN IF NOT EXISTS amount_before_discount NUMERIC(10, 2)`);
  await pgPool.query(`ALTER TABLE user_grile_payment_attempts ADD COLUMN IF NOT EXISTS discount_label TEXT`);
  await pgPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`);
  await pgPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT`);
  await pgPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT`);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS user_billing_profiles (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      county TEXT,
      city TEXT,
      street TEXT,
      street_number TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pgPool.query(`ALTER TABLE user_billing_profiles ADD COLUMN IF NOT EXISTS invoice_on_company BOOLEAN NOT NULL DEFAULT FALSE`);
  await pgPool.query(`ALTER TABLE user_billing_profiles ADD COLUMN IF NOT EXISTS company_name TEXT`);
  await pgPool.query(`ALTER TABLE user_billing_profiles ADD COLUMN IF NOT EXISTS company_cui TEXT`);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS grile_question_reports (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      question_id UUID NOT NULL REFERENCES grile_questions(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      source_id UUID REFERENCES grile_sources(id) ON DELETE SET NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
      admin_note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    );
  `);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_grile_reports_status_created ON grile_question_reports(status, created_at DESC)`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_grile_reports_question ON grile_question_reports(question_id)`);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS grile_question_ai_results (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      question_id UUID NOT NULL UNIQUE REFERENCES grile_questions(id) ON DELETE CASCADE,
      official_answer TEXT,
      official_answer_normalized TEXT NOT NULL DEFAULT '',
      model_suggested_answer TEXT,
      model_suggested_answer_normalized TEXT,
      correct_options JSONB NOT NULL DEFAULT '[]'::jsonb,
      extra_correct_options_suspected JSONB NOT NULL DEFAULT '[]'::jsonb,
      official_options_suspected_wrong JSONB NOT NULL DEFAULT '[]'::jsonb,
      agrees_with_official_answer BOOLEAN NOT NULL DEFAULT TRUE,
      needs_human_review BOOLEAN NOT NULL DEFAULT FALSE,
      ocr_confidence SMALLINT NOT NULL DEFAULT 0,
      confidence SMALLINT NOT NULL DEFAULT 0,
      review_reason TEXT,
      transcribed_question TEXT,
      transcribed_options JSONB NOT NULL DEFAULT '[]'::jsonb,
      hint TEXT,
      short_explanation TEXT,
      full_explanation TEXT,
      options_explanation JSONB NOT NULL DEFAULT '[]'::jsonb,
      trap TEXT,
      complexity TEXT,
      difficulty_estimate TEXT,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      student_visible JSONB NOT NULL DEFAULT '{}'::jsonb,
      admin_notes TEXT,
      content_format TEXT NOT NULL DEFAULT 'markdown_latex',
      model_used TEXT,
      prompt_version TEXT NOT NULL DEFAULT 'grile_ai_v1.0',
      raw_ai_response TEXT,
      error_message TEXT,
      processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'done', 'error')),
      generated_at TIMESTAMPTZ,
      reviewed_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
      admin_review_note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_grile_ai_results_needs_review ON grile_question_ai_results(needs_human_review)`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_grile_ai_results_status ON grile_question_ai_results(processing_status)`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_grile_ai_results_generated_at ON grile_question_ai_results(generated_at DESC)`);
  await pgPool.query(`
    UPDATE grile_question_ai_results
    SET reviewed_by_admin = true,
        admin_review_note = COALESCE(NULLIF(admin_review_note, ''), 'Auto-aprobat: confidence 1/1 si acord cu baremul oficial.'),
        updated_at = NOW()
    WHERE reviewed_by_admin = false
      AND confidence = 100
      AND agrees_with_official_answer = true
      AND needs_human_review = false
  `);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS grile_exam_source_configs (
      source_id UUID PRIMARY KEY REFERENCES grile_sources(id) ON DELETE CASCADE,
      mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      duration_seconds INTEGER NOT NULL DEFAULT 10800,
      scoring_mode TEXT NOT NULL DEFAULT 'ubb',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pgPool.query(
    `INSERT INTO grile_exam_source_configs (source_id, mode_enabled, duration_seconds, scoring_mode, updated_at)
     SELECT
       s.id,
       false,
       CASE
         WHEN c.slug = 'admitere-ubb' THEN 10800
         WHEN c.slug = 'admitere-tu-iasi' THEN 10800
         WHEN c.slug = 'admitere-ub' AND s.name ILIKE '%Concurs Mate Info UB%' THEN 10800
         ELSE 5400
       END,
       CASE WHEN c.slug = 'admitere-ubb' THEN 'ubb' ELSE 'all_or_nothing' END,
       NOW()
     FROM grile_sources s
     JOIN grile_categories c ON c.id = s.category_id
     ON CONFLICT (source_id) DO NOTHING`,
  );

  await pgPool.query(
    `UPDATE grile_exam_source_configs cfg
     SET duration_seconds = CASE
           WHEN c.slug = 'admitere-ubb' THEN 10800
           WHEN c.slug = 'admitere-tu-iasi' THEN 10800
           WHEN c.slug = 'admitere-ub' AND s.name ILIKE '%Concurs Mate Info UB%' THEN 10800
           ELSE 5400
         END,
         scoring_mode = CASE WHEN c.slug = 'admitere-ubb' THEN 'ubb' ELSE 'all_or_nothing' END,
         updated_at = NOW()
     FROM grile_sources s
     JOIN grile_categories c ON c.id = s.category_id
     WHERE cfg.source_id = s.id`,
  );

  await pgPool.query(
    `UPDATE grile_exam_source_configs
     SET mode_enabled = true,
         updated_at = NOW()`,
  );

  await pgPool.query(
    `UPDATE grile_exam_source_configs cfg
     SET mode_enabled = false,
         updated_at = NOW()
     FROM grile_sources s
     JOIN grile_categories c ON c.id = s.category_id
     WHERE cfg.source_id = s.id
       AND c.slug = 'admitere-ubb'
       AND (s.name ILIKE '%2018%' OR s.name ILIKE '%2019%')`,
  );

  await pgPool.query(
    `UPDATE grile_exam_source_configs cfg
     SET mode_enabled = false,
         updated_at = NOW()
     FROM grile_sources s
     WHERE cfg.source_id = s.id
       AND (
         s.name IN ('Culegere 115 Grile', 'Culegere 230 grile', 'Culegere Admitere UBB 2025')
         OR s.name ILIKE '%Culegere 115%Antrenament UBB%'
         OR s.name ILIKE '%Culegere 230%Antrenament UBB%'
       )`,
  );

  await pgPool.query(
    `UPDATE grile_exam_source_configs cfg
     SET mode_enabled = false,
         updated_at = NOW()
     FROM grile_sources s
     JOIN grile_categories c ON c.id = s.category_id
     WHERE cfg.source_id = s.id
       AND c.slug IN ('bacalaureat', 'admitere-atm')`,
  );

  await pgPool.query(
    `UPDATE grile_exam_source_configs cfg
     SET mode_enabled = true,
         updated_at = NOW()
     FROM grile_sources s
     JOIN grile_categories c ON c.id = s.category_id
     WHERE cfg.source_id = s.id
       AND c.slug = 'admitere-ub'
       AND (s.name ILIKE '%antrenament%' OR s.name ILIKE '%varianta%')`,
  );

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS grile_exam_attempts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      source_id UUID NOT NULL REFERENCES grile_sources(id) ON DELETE CASCADE,
      scoring_mode TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      question_count INTEGER NOT NULL,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      finished_at TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'in_progress',
      score_without_bonus NUMERIC(8, 2),
      score_total NUMERIC(8, 2),
      bonus_points NUMERIC(8, 2) NOT NULL DEFAULT 10,
      time_spent_seconds INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS grile_exam_attempt_answers (
      attempt_id UUID NOT NULL REFERENCES grile_exam_attempts(id) ON DELETE CASCADE,
      question_id UUID NOT NULL REFERENCES grile_questions(id) ON DELETE CASCADE,
      selected_answers TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (attempt_id, question_id)
    );
  `);

  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_grile_exam_attempts_user_source ON grile_exam_attempts(user_id, source_id, created_at DESC)`);

  await pgPool.query(
    `UPDATE grile_exam_attempts
     SET status = 'abandoned',
         finished_at = COALESCE(finished_at, NOW()),
         time_spent_seconds = COALESCE(time_spent_seconds, duration_seconds)
     WHERE status = 'in_progress'
       AND started_at + make_interval(secs => duration_seconds) <= NOW()`,
  );

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS grile_trial_phone_claims (
      phone_e164 TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_grile_trial_phone_claims_user ON grile_trial_phone_claims(user_id)`);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS grile_trial_sms_send_log (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      last_sent_at TIMESTAMPTZ NOT NULL
    );
  `);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS grile_trial_sms_otps (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      phone_e164 TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pgPool.query(
    `CREATE INDEX IF NOT EXISTS idx_grile_trial_sms_otps_user_phone_created ON grile_trial_sms_otps(user_id, phone_e164, created_at DESC)`,
  );
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS grile_legacy_import_log (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      legacy_user_id INTEGER NOT NULL,
      legacy_email TEXT NOT NULL,
      meta JSONB NOT NULL DEFAULT '{}'::jsonb,
      imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  // Păstrează primul import per cont vechi (înainte de indexul unic).
  await pgPool.query(`
    DELETE FROM grile_legacy_import_log a
    USING grile_legacy_import_log b
    WHERE a.legacy_user_id = b.legacy_user_id
      AND (
        a.imported_at > b.imported_at
        OR (a.imported_at = b.imported_at AND a.user_id > b.user_id)
      );
  `);
  await pgPool.query(`
    DELETE FROM grile_legacy_import_log a
    USING grile_legacy_import_log b
    WHERE lower(a.legacy_email) = lower(b.legacy_email)
      AND a.user_id <> b.user_id
      AND (
        a.imported_at > b.imported_at
        OR (a.imported_at = b.imported_at AND a.user_id > b.user_id)
      );
  `);
  await pgPool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_grile_legacy_import_log_legacy_user_id
    ON grile_legacy_import_log (legacy_user_id);
  `);
  await pgPool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_grile_legacy_import_log_legacy_email_lower
    ON grile_legacy_import_log (lower(legacy_email));
  `);
  })();

  try {
    await grileTablesEnsurePromise;
    grileTablesEnsured = true;
  } finally {
    grileTablesEnsurePromise = null;
  }
}

export const grileRouter = Router();

const activateGrilePlanSchema = z
  .object({
    planCode: z.enum(["free_24h", "month_1", "month_3", "until_2027"]),
    billingProfile: billingProfileActivateSchema.optional(),
    acceptTerms: z.boolean().optional(),
    trialPhone: z.string().trim().max(40).optional(),
    trialSmsCode: z.string().trim().max(12).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.planCode !== "free_24h") return;
    if (data.acceptTerms !== true) {
      ctx.addIssue({
        code: "custom",
        message: "Trebuie sa accepti termenii si conditiile",
        path: ["acceptTerms"],
      });
    }
    if (!data.trialPhone?.trim()) {
      ctx.addIssue({ code: "custom", message: "Numarul de telefon este obligatoriu", path: ["trialPhone"] });
    }
    if (!data.trialSmsCode?.trim()) {
      ctx.addIssue({ code: "custom", message: "Codul din SMS este obligatoriu", path: ["trialSmsCode"] });
    }
  });

const trialSendSmsSchema = z.object({
  rawPhone: z.string().trim().min(8).max(40),
});

const createGrilePaymentSchema = z
  .object({
    planCode: z.enum(["month_1", "month_3", "until_2027"]),
    billingProfile: billingProfileActivateSchema,
    acceptTerms: z.boolean(),
    discountCode: z.string().trim().max(64).optional(),
  })
  .refine((data) => data.acceptTerms === true, {
    message: "Trebuie sa accepti termenii si conditiile",
    path: ["acceptTerms"],
  });

const confirmGrilePaymentSchema = z.object({
  attemptId: z.string().uuid(),
});

const importLegacyProgressSchema = z.object({
  username: z.string().trim().min(1).max(320),
  password: z.string().min(1).max(256),
});

function legacyImportErrorResponse(error: string): { status: number; code: string; message: string } {
  switch (error) {
    case "invalid_credentials":
      return {
        status: 401,
        code: "INVALID_LEGACY_CREDENTIALS",
        message: "Username-ul sau parola de pe zecelagrile.ro nu sunt corecte.",
      };
    case "email_and_password_required":
      return {
        status: 400,
        code: "INVALID_PAYLOAD",
        message: "Username-ul si parola sunt obligatorii.",
      };
    case "invalid_json":
      return {
        status: 502,
        code: "LEGACY_API_ERROR",
        message: "Raspuns invalid de la zecelagrile.ro. Incearca din nou mai tarziu.",
      };
    case "unauthorized":
      return {
        status: 502,
        code: "LEGACY_API_ERROR",
        message: "Serviciul de import nu este disponibil momentan. Contacteaza suportul.",
      };
    case "method_not_allowed":
    case "db_error":
    case "server_error":
      return {
        status: 502,
        code: "LEGACY_API_ERROR",
        message: "Eroare la exportul de pe zecelagrile.ro. Incearca din nou mai tarziu.",
      };
    case "import_not_configured":
      return {
        status: 503,
        code: "IMPORT_NOT_CONFIGURED",
        message: "Importul din Zece la Grile nu este configurat pe server.",
      };
    case "legacy_user_already_imported":
      return {
        status: 409,
        code: "LEGACY_USER_ALREADY_IMPORTED",
        message:
          "Acest cont de pe zecelagrile.ro a fost deja folosit pentru transfer. Fiecare cont vechi poate fi importat o singura data.",
      };
    case "invalid_response":
    case "network_error":
    case "timeout":
      return {
        status: 502,
        code: "LEGACY_API_UNAVAILABLE",
        message: "Nu am putut contacta zecelagrile.ro. Verifica conexiunea si incearca din nou.",
      };
    default:
      return {
        status: 502,
        code: "LEGACY_IMPORT_FAILED",
        message: "Importul a esuat. Incearca din nou sau contacteaza suportul.",
      };
  }
}

grileRouter.get("/import-legacy-progress/status", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const log = await getLegacyImportLog(req.user!.id);
    res.json({
      data: {
        configured: isLegacyGrileImportConfigured(),
        last_import: log
          ? {
              legacy_user_id: log.legacy_user_id,
              legacy_email: log.legacy_email,
              imported_at: log.imported_at,
              meta: log.meta,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Failed to fetch legacy import status:", error);
    res.status(500).json({ error: "Failed to fetch legacy import status", code: "INTERNAL_ERROR" });
  }
});

grileRouter.post("/import-legacy-progress", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    if (!isLegacyGrileImportConfigured()) {
      res.status(503).json({
        error: "Import not configured",
        code: "IMPORT_NOT_CONFIGURED",
        message: "Importul din Zece la Grile nu este configurat pe server.",
      });
      return;
    }

    const parsed = importLegacyProgressSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
      return;
    }

    const exported = await fetchLegacyGrileProgress(parsed.data.username, parsed.data.password);
    if (!exported.success) {
      const mapped = legacyImportErrorResponse(exported.error);
      res.status(mapped.status).json({ error: mapped.message, code: mapped.code, message: mapped.message });
      return;
    }

    try {
      await assertLegacyUserImportAllowed(req.user!.id, exported.user.id, exported.user.email);
    } catch (claimError) {
      if (claimError instanceof LegacyUserAlreadyImportedError) {
        const mapped = legacyImportErrorResponse(claimError.message);
        res.status(mapped.status).json({ error: mapped.message, code: mapped.code, message: mapped.message });
        return;
      }
      throw claimError;
    }

    const stats = await importLegacyGrileProgress(req.user!.id, exported);
    res.json({
      data: {
        stats,
        meta: exported.meta,
      },
    });
  } catch (error) {
    if (error instanceof LegacyUserAlreadyImportedError) {
      const mapped = legacyImportErrorResponse(error.message);
      res.status(mapped.status).json({ error: mapped.message, code: mapped.code, message: mapped.message });
      return;
    }
    console.error("Failed to import legacy grile progress:", error);
    res.status(500).json({ error: "Failed to import legacy progress", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/access/status", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const userId = req.user!.id;
    const access = await userHasActiveGrileAccess(userId);
    const accessResult = await pgPool.query<{
      access_until: string | null;
      trial_used: boolean;
      current_plan_code: string | null;
    }>(
      `SELECT access_until::text, trial_used, current_plan_code
       FROM user_grile_access
       WHERE user_id = $1
       LIMIT 1`,
      [userId],
    );
    const row = accessResult.rows[0] ?? { access_until: null, trial_used: false, current_plan_code: null };
    res.json({
      data: {
        has_access: access.hasAccess,
        access_until: row.access_until,
        trial_used: row.trial_used,
        current_plan_code: row.current_plan_code,
        trial_available: GRILE_FREE_TRIAL_AVAILABLE,
        trial_unavailable_message: GRILE_FREE_TRIAL_AVAILABLE ? null : GRILE_FREE_TRIAL_UNAVAILABLE_MESSAGE,
        plans: GRILE_PLANS.map((plan) => ({
          code: plan.code,
          name: plan.name,
          is_free: plan.isFree,
          available: plan.code !== "free_24h" || GRILE_FREE_TRIAL_AVAILABLE,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to fetch grile access status:", error);
    res.status(500).json({ error: "Failed to fetch grile access status", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/access/history", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const userId = req.user!.id;
    const statusResult = await pgPool.query<{
      access_until: string | null;
      trial_used: boolean;
      current_plan_code: string | null;
      created_at: string | null;
    }>(
      `SELECT access_until::text, trial_used, current_plan_code, created_at::text
       FROM user_grile_access
       WHERE user_id = $1
       LIMIT 1`,
      [userId],
    );
    const eventsResult = await pgPool.query<{
      id: string;
      plan_code: string;
      plan_name: string;
      starts_at: string;
      ends_at: string;
      is_free: boolean;
      is_paid: boolean;
      paid_amount: number | null;
      currency: string | null;
      invoice_number: string | null;
      invoice_url: string | null;
      invoice_local_path: string | null;
      invoice_issued_at: string | null;
      created_at: string;
    }>(
      `SELECT
         id,
         plan_code,
         plan_name,
         starts_at::text,
         ends_at::text,
         is_free,
         is_paid,
         paid_amount::float8 AS paid_amount,
         currency,
         invoice_number,
         invoice_url,
         invoice_local_path,
         invoice_issued_at::text,
         created_at::text
       FROM user_grile_access_events
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [userId],
    );
    const current = statusResult.rows[0] ?? { access_until: null, trial_used: false, current_plan_code: null, created_at: null };
    const events = [...eventsResult.rows];
    const hasCurrentEvent = events.some(
      (event) => event.plan_code === current.current_plan_code && event.ends_at === current.access_until,
    );
    if (current.current_plan_code && current.access_until && !hasCurrentEvent) {
      const plan = GRILE_PLANS.find((item) => item.code === current.current_plan_code);
      const fallbackStart = current.created_at ?? current.access_until;
      events.unshift({
        id: `synthetic-${current.current_plan_code}-${current.access_until}`,
        plan_code: current.current_plan_code,
        plan_name: plan?.name ?? current.current_plan_code,
        starts_at: fallbackStart,
        ends_at: current.access_until,
        is_free: current.current_plan_code === "free_24h",
        is_paid: current.current_plan_code !== "free_24h",
        paid_amount: null,
        currency: null,
        invoice_number: null,
        invoice_url: null,
        invoice_local_path: null,
        invoice_issued_at: null,
        created_at: fallbackStart,
      });
    }
    res.json({
      data: {
        has_access: Boolean(current.access_until && new Date(current.access_until).getTime() > Date.now()),
        access_until: current.access_until,
        trial_used: current.trial_used,
        current_plan_code: current.current_plan_code,
        events,
      },
    });
  } catch (error) {
    console.error("Failed to fetch grile access history:", error);
    res.status(500).json({ error: "Failed to fetch grile access history", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/access/history/:eventId/invoice", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const userId = req.user!.id;
    const eventId = String(req.params.eventId ?? "");
    const eventResult = await pgPool.query<{ invoice_number: string | null; is_paid: boolean; invoice_local_path: string | null }>(
      `SELECT invoice_number, is_paid, invoice_local_path
       FROM user_grile_access_events
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [eventId, userId],
    );
    const event = eventResult.rows[0];
    if (!event) {
      res.status(404).json({ error: "Invoice event not found", code: "NOT_FOUND" });
      return;
    }
    if (!event.is_paid || !event.invoice_number) {
      res.status(404).json({ error: "Invoice not available", code: "INVOICE_NOT_AVAILABLE" });
      return;
    }
    if (event.invoice_local_path) {
      try {
        const localBuffer = await fs.readFile(event.invoice_local_path);
        if (localBuffer.length >= 200 && localBuffer.subarray(0, 5).toString() === "%PDF-") {
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${sanitizeInvoiceFileName(event.invoice_number)}.pdf"`,
          );
          res.status(200).send(localBuffer);
          return;
        }
      } catch {
        // fallback to SmartBill below
      }
    }

    const pdf = await downloadSmartbillInvoicePdf(event.invoice_number);
    const savedPath = await persistGrileInvoicePdfLocally(event.invoice_number, pdf);
    await pgPool.query(
      `UPDATE user_grile_access_events
       SET invoice_local_path = $2
       WHERE id = $1`,
      [eventId, savedPath],
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${pdf.fileName}"`);
    res.status(200).send(pdf.buffer);
  } catch (error) {
    console.error("Failed to download grile invoice:", error);
    res.status(500).json({ error: "Failed to download invoice", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/access/billing-profile", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const userId = req.user!.id;
    const userResult = await pgPool.query<{
      email: string;
      phone: string | null;
      first_name: string | null;
      last_name: string | null;
      full_name: string | null;
    }>(
      `SELECT email, phone, first_name, last_name, full_name
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [userId],
    );
    const billingResult = await pgPool.query<{
      county: string | null;
      city: string | null;
      street: string | null;
      street_number: string | null;
      invoice_on_company: boolean | null;
      company_name: string | null;
      company_cui: string | null;
    }>(
      `SELECT county, city, street, street_number, invoice_on_company, company_name, company_cui
       FROM user_billing_profiles
       WHERE user_id = $1
       LIMIT 1`,
      [userId],
    );
    const user = userResult.rows[0];
    if (!user) {
      res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
      return;
    }
    const billing = billingResult.rows[0] ?? {
      county: null,
      city: null,
      street: null,
      street_number: null,
      invoice_on_company: null,
      company_name: null,
      company_cui: null,
    };
    let firstName = user.first_name ?? "";
    let lastName = user.last_name ?? "";
    if ((!firstName || !lastName) && user.full_name?.trim()) {
      const parts = user.full_name.trim().split(/\s+/);
      firstName = firstName || parts[0] || "";
      lastName = lastName || parts.slice(1).join(" ");
    }
    res.json({
      data: {
        first_name: firstName,
        last_name: lastName,
        email: user.email,
        phone: user.phone ?? "",
        county: billing.county ?? "",
        city: billing.city ?? "",
        street: billing.street ?? "",
        street_number: billing.street_number ?? "",
        invoice_on_company: Boolean(billing.invoice_on_company),
        company_name: billing.company_name ?? "",
        company_cui: billing.company_cui ?? "",
      },
    });
  } catch (error) {
    console.error("Failed to fetch billing profile:", error);
    res.status(500).json({ error: "Failed to fetch billing profile", code: "INTERNAL_ERROR" });
  }
});

grileRouter.put("/access/billing-profile", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const parsed = z.object({ billingProfile: billingProfileActivateSchema }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
      return;
    }
    const userId = req.user!.id;
    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");
      await persistUserBillingProfile(userId, parsed.data.billingProfile, client);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
    res.json({ data: { ok: true } });
  } catch (error) {
    console.error("Failed to save billing profile:", error);
    res.status(500).json({ error: "Failed to save billing profile", code: "INTERNAL_ERROR" });
  }
});

grileRouter.post("/access/create-payment", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const parsed = createGrilePaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
      return;
    }
    const userId = req.user!.id;
    const plan = GRILE_PLANS.find((item) => item.code === parsed.data.planCode);
    if (!plan || plan.isFree) {
      res.status(400).json({ error: "Invalid paid plan", code: "INVALID_PLAN" });
      return;
    }

    const userResult = await pgPool.query<{ email: string }>(`SELECT email FROM users WHERE id = $1 LIMIT 1`, [userId]);
    const userEmail = userResult.rows[0]?.email;
    if (!userEmail) {
      res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
      return;
    }

    let priceRon = Number(plan.priceRon.toFixed(2));
    let discountCodeId: string | null = null;
    let discountPercentApplied: number | null = null;
    let amountBeforeDiscount: number | null = null;
    let discountLabel: string | null = null;

    const rawDiscount = parsed.data.discountCode?.trim();
    if (rawDiscount) {
      const resolved = await resolveActiveDiscountCode(pgPool, rawDiscount, "grile");
      if (!resolved.ok) {
        res.status(400).json({ error: resolved.error, code: "INVALID_DISCOUNT_CODE" });
        return;
      }
      const percent = resolved.row.percent_off;
      const beforePromo = priceRon;
      priceRon = applyPercentDiscount(beforePromo, percent);
      amountBeforeDiscount = beforePromo;
      discountPercentApplied = percent;
      discountCodeId = resolved.row.id;
      discountLabel = `${resolved.row.code} (-${percent}%)`;
    }

    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");
      await persistUserBillingProfile(userId, parsed.data.billingProfile, client);
      const attemptInsert = await client.query<{ id: string }>(
        `INSERT INTO user_grile_payment_attempts (
           user_id, plan_code, plan_name, amount, currency, status, billing_snapshot, terms_accepted_at, updated_at,
           discount_code_id, discount_percent_applied, amount_before_discount, discount_label
         )
         VALUES ($1, $2, $3, $4, $5, 'pending', $6::jsonb, NOW(), NOW(), $7, $8, $9, $10)
         RETURNING id`,
        [
          userId,
          plan.code,
          plan.name,
          priceRon,
          "RON",
          JSON.stringify(parsed.data.billingProfile),
          discountCodeId,
          discountPercentApplied,
          amountBeforeDiscount,
          discountLabel,
        ],
      );
      const attemptId = attemptInsert.rows[0]?.id;
      if (!attemptId) {
        throw new Error("Failed to create payment attempt");
      }

      if (priceRon <= 0) {
        await grantGrilePaidPlanInTransaction(client, userId, plan, {
          billingSnapshot: parsed.data.billingProfile,
          attemptId,
          paidAmount: 0,
          invoiceNumber: null,
          invoiceUrl: null,
          invoiceLocalPath: null,
          discountCodeId,
        });
        await client.query("COMMIT");
        res.json({
          data: {
            attempt_id: attemptId,
            checkout_url: null,
            direct_paid: true,
          },
        });
        return;
      }

      const redirectUrl = `${getAppBaseUrl().replace(/\/$/, "")}/grile?payment=success&attempt=${encodeURIComponent(attemptId)}`;
      const { orderId, checkoutUrl } = await revolutCreateOrder({
        amountCents: Math.round(priceRon * 100),
        currency: "RON",
        description: `${plan.name} - Grile`,
        redirectUrl,
        customer: {
          email: userEmail,
          name: `${parsed.data.billingProfile.firstName} ${parsed.data.billingProfile.lastName}`.trim(),
          phone: parsed.data.billingProfile.phone || undefined,
        },
        metadata: {
          attempt_id: attemptId,
          plan_code: plan.code,
          user_id: userId,
        },
      });

      await client.query(
        `UPDATE user_grile_payment_attempts
         SET revolut_order_id = $2, revolut_checkout_url = $3, updated_at = NOW()
         WHERE id = $1`,
        [attemptId, orderId, checkoutUrl],
      );

      await client.query("COMMIT");
      res.json({
        data: {
          attempt_id: attemptId,
          checkout_url: checkoutUrl,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Failed to create grile payment:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create payment",
      code: "INTERNAL_ERROR",
    });
  }
});

grileRouter.post("/access/confirm-payment", async (req, res) => {
  try {
    await ensureGrileTables();
    const parsed = confirmGrilePaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
      return;
    }
    const authUserId = req.user?.id ?? null;
    const attemptResult = await pgPool.query<{
      id: string;
      user_id: string;
      plan_code: GrilePlanCode;
      plan_name: string;
      amount: number;
      amount_before_discount: number | null;
      discount_percent_applied: number | null;
      discount_label: string | null;
      discount_code_id: string | null;
      status: string;
      revolut_order_id: string | null;
      invoice_number: string | null;
      invoice_url: string | null;
      paid_at: string | null;
      billing_snapshot: z.infer<typeof billingProfileActivateSchema>;
    }>(
      `SELECT id, user_id, plan_code, plan_name,
              amount::float8 AS amount,
              amount_before_discount::float8 AS amount_before_discount,
              discount_percent_applied,
              discount_label,
              discount_code_id,
              status, revolut_order_id, invoice_number, invoice_url, paid_at::text, billing_snapshot
       FROM user_grile_payment_attempts
       WHERE id = $1
         AND ($2::uuid IS NULL OR user_id = $2::uuid)
       LIMIT 1`,
      [parsed.data.attemptId, authUserId],
    );
    const attempt = attemptResult.rows[0];
    if (!attempt) {
      res.status(404).json({ error: "Payment attempt not found", code: "NOT_FOUND" });
      return;
    }
    const userId = attempt.user_id;
    if (attempt.status === "paid") {
      const statusResult = await userHasActiveGrileAccess(userId);
      res.json({
        data: {
          ok: true,
          payment_status: "paid",
          purchase: purchaseTrackingPayload(attempt.id, attempt.plan_code, Number(attempt.amount)),
          has_access: statusResult.hasAccess,
          access_until: statusResult.accessUntil ?? null,
          invoice_number: attempt.invoice_number,
          invoice_url: attempt.invoice_url,
        },
      });
      return;
    }
    if (!attempt.revolut_order_id) {
      res.status(400).json({ error: "Missing Revolut order id", code: "MISSING_ORDER_ID" });
      return;
    }

    const revolutOrder = await revolutFetchOrder(attempt.revolut_order_id);
    if (!revolutOrder.isPaid) {
      res.json({
        data: {
          ok: false,
          payment_status: "pending",
          revolut_status: revolutOrder.rawState,
        },
      });
      return;
    }

    const plan = GRILE_PLANS.find((item) => item.code === attempt.plan_code);
    if (!plan) {
      res.status(400).json({ error: "Invalid plan in payment attempt", code: "INVALID_PLAN" });
      return;
    }

    const userResult = await pgPool.query<{ email: string }>(`SELECT email FROM users WHERE id = $1 LIMIT 1`, [userId]);
    const userEmail = userResult.rows[0]?.email ?? "";

    const client = await pgPool.connect();
    let nextAccessUntilIso = new Date().toISOString();
    let invoiceNumber: string | null = null;
    let invoiceUrl: string | null = null;
    let invoiceLocalPath: string | null = null;
    let grileThankYouPaidAmount: number | null = null;
    let grileThankYouBilling: z.infer<typeof billingProfileActivateSchema> | null = null;
    try {
      await client.query("BEGIN");
      const lockedAttemptResult = await client.query<{
        status: string;
        billing_snapshot: z.infer<typeof billingProfileActivateSchema>;
        amount: number;
        amount_before_discount: number | null;
        discount_label: string | null;
        discount_percent_applied: number | null;
        discount_code_id: string | null;
      }>(
        `SELECT status, billing_snapshot,
                amount::float8 AS amount,
                amount_before_discount::float8 AS amount_before_discount,
                discount_label,
                discount_percent_applied,
                discount_code_id
         FROM user_grile_payment_attempts
         WHERE id = $1 AND user_id = $2
         FOR UPDATE`,
        [attempt.id, userId],
      );
      const lockedAttempt = lockedAttemptResult.rows[0];
      if (!lockedAttempt) {
        await client.query("ROLLBACK").catch(() => {});
        res.status(404).json({ error: "Payment attempt not found", code: "NOT_FOUND" });
        return;
      }
      if (lockedAttempt.status === "paid") {
        await client.query("COMMIT");
      } else {
        const paidAmount = Number(lockedAttempt.amount);
        const skipInvoice = paidAmount <= 0.001;
        let extraSuffix: string | undefined;
        if (lockedAttempt.discount_label != null && lockedAttempt.amount_before_discount != null) {
          extraSuffix = ` | Cod reducere ${lockedAttempt.discount_label}. Lista: ${Number(lockedAttempt.amount_before_discount).toFixed(2)} RON, platit: ${paidAmount.toFixed(2)} RON`;
        }
        if (!skipInvoice) {
          const invoice = await maybeIssueSmartbillInvoice({
            billingProfile: lockedAttempt.billing_snapshot,
            userEmail,
            planName: plan.name,
            planCode: plan.code,
            priceRon: paidAmount,
            extraNameSuffix: extraSuffix,
          });
          invoiceNumber = invoice.invoiceNumber;
          invoiceUrl = invoice.invoiceUrl;
          if (invoiceNumber) {
            try {
              const invoicePdf = await downloadSmartbillInvoicePdf(invoiceNumber);
              invoiceLocalPath = await persistGrileInvoicePdfLocally(invoiceNumber, invoicePdf);
            } catch (invoicePersistError) {
              console.error("Failed to persist local grile invoice pdf:", invoicePersistError);
            }
          }
        }
        const granted = await grantGrilePaidPlanInTransaction(client, userId, plan, {
          billingSnapshot: lockedAttempt.billing_snapshot,
          attemptId: attempt.id,
          paidAmount,
          invoiceNumber,
          invoiceUrl,
          invoiceLocalPath,
          discountCodeId: lockedAttempt.discount_code_id,
        });
        nextAccessUntilIso = granted.nextAccessUntilIso;
        grileThankYouPaidAmount = paidAmount;
        grileThankYouBilling = lockedAttempt.billing_snapshot;
        await client.query("COMMIT");
      }
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    if (grileThankYouBilling) {
      void recordConversion({
        kind: "purchase",
        flow: "grile",
        refId: attempt.id,
        userId,
        productCode: plan.code,
        valueRon: grileThankYouPaidAmount ?? 0,
        pagePath: "/grile",
      });
    }

    if (grileThankYouBilling && userEmail.includes("@")) {
      const appBase = getAppBaseUrl().replace(/\/$/, "") || "https://www.zecelainfo.ro";
      void sendPurchaseThankYouEmail({
        to: userEmail,
        customerFirstName: grileThankYouBilling.firstName,
        purchaseLabel: `${plan.name} — Grile Zece la Info`,
        amountRon: grileThankYouPaidAmount ?? undefined,
        currency: "RON",
        invoiceNumber,
        invoiceUrl,
        invoicePdfPath: invoiceLocalPath,
        primaryCtaPath: "/grile",
        appBaseUrl: appBase,
      }).catch((err) => console.error("[grile] thank-you email failed:", err));
    }

    res.json({
      data: {
        ok: true,
        payment_status: "paid",
        purchase: purchaseTrackingPayload(attempt.id, attempt.plan_code, Number(attempt.amount)),
        has_access: true,
        access_until: nextAccessUntilIso,
        invoice_number: invoiceNumber,
        invoice_url: invoiceUrl,
        local_redirect_url: "http://localhost:3000/grile?payment=done",
      },
    });
  } catch (error) {
    console.error("Failed to confirm grile payment:", error);
    res.status(500).json({ error: "Failed to confirm payment", code: "INTERNAL_ERROR" });
  }
});

grileRouter.post("/access/trial/send-sms", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    if (!GRILE_FREE_TRIAL_AVAILABLE) {
      res.status(403).json({
        error: GRILE_FREE_TRIAL_UNAVAILABLE_MESSAGE,
        code: "TRIAL_UNAVAILABLE",
      });
      return;
    }
    if (!isGrileTrialSmsConfigured()) {
      res.status(503).json({
        error: "SMS (SMSLink) nu e configurat pe server. Adauga SMSLINK_CONNECTION_ID si SMSLINK_CONNECTION_PASSWORD in .env.",
        code: "SMSLINK_NOT_CONFIGURED",
      });
      return;
    }
    const parsed = trialSendSmsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Cerere invalida", code: "INVALID_PAYLOAD" });
      return;
    }
    const phoneE164 = normalizePhoneToE164(parsed.data.rawPhone);
    if (!phoneE164) {
      res.status(400).json({ error: "Numar de telefon invalid", code: "INVALID_PHONE" });
      return;
    }

    const userId = req.user!.id;

    const trialRow = await pgPool.query<{ trial_used: boolean }>(
      `SELECT trial_used FROM user_grile_access WHERE user_id = $1 LIMIT 1`,
      [userId],
    );
    if (trialRow.rows[0]?.trial_used) {
      res.status(400).json({ error: "Trial deja utilizat pe acest cont.", code: "TRIAL_ALREADY_USED" });
      return;
    }

    const usedBy = await pgPool.query<{ user_id: string }>(
      `SELECT user_id FROM grile_trial_phone_claims WHERE phone_e164 = $1 LIMIT 1`,
      [phoneE164],
    );
    if (usedBy.rows[0] && usedBy.rows[0].user_id !== userId) {
      res.status(400).json({
        error: "Acest numar a fost deja folosit pentru trial gratuit pe alt cont.",
        code: "PHONE_TRIAL_ALREADY_USED",
      });
      return;
    }

    const logResult = await pgPool.query<{ last_sent_at: string }>(
      `SELECT last_sent_at::text FROM grile_trial_sms_send_log WHERE user_id = $1`,
      [userId],
    );
    const lastSent = logResult.rows[0]?.last_sent_at;
    if (lastSent && Date.now() - new Date(lastSent).getTime() < 30_000) {
      res.status(429).json({ error: "Poti trimite un nou SMS peste cateva secunde.", code: "RATE_LIMIT_TRIAL_SMS" });
      return;
    }

    const toNational = phoneE164ToSmslinkTo(phoneE164);
    if (!toNational) {
      res.status(400).json({ error: "Numar de telefon invalid", code: "INVALID_PHONE" });
      return;
    }

    const code = generateSixDigitOtp();
    const codeHash = hashTrialSmsOtp(userId, phoneE164, code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await pgPool.query(`DELETE FROM grile_trial_sms_otps WHERE user_id = $1`, [userId]);
    await pgPool.query(
      `INSERT INTO grile_trial_sms_otps (user_id, phone_e164, code_hash, expires_at) VALUES ($1, $2, $3, $4)`,
      [userId, phoneE164, codeHash, expiresAt.toISOString()],
    );

    try {
      await smslinkSendTransactionalSms({
        toNationalDigits: toNational,
        message: `Zece la Info: Codul tau de activare al trial-ului gratuit este: ${code}. Este valabil 10 minute!`,
      });
    } catch (e) {
      console.error("SMSLink send trial SMS:", e);
      await pgPool.query(`DELETE FROM grile_trial_sms_otps WHERE user_id = $1 AND phone_e164 = $2`, [userId, phoneE164]);
      res.status(502).json({ error: "Nu am putut trimite SMS-ul. Incearca din nou.", code: "SMS_SEND_FAILED" });
      return;
    }

    await pgPool.query(
      `INSERT INTO grile_trial_sms_send_log (user_id, last_sent_at)
       VALUES ($1, NOW())
       ON CONFLICT (user_id) DO UPDATE SET last_sent_at = EXCLUDED.last_sent_at`,
      [userId],
    );

    res.json({ data: { ok: true } });
  } catch (error) {
    console.error("Failed to send trial SMS:", error);
    res.status(500).json({ error: "Eroare interna", code: "INTERNAL_ERROR" });
  }
});

grileRouter.post("/access/activate", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const parsed = activateGrilePlanSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
      return;
    }
    const userId = req.user!.id;
    const plan = GRILE_PLANS.find((item) => item.code === parsed.data.planCode);
    if (!plan) {
      res.status(400).json({ error: "Invalid plan", code: "INVALID_PLAN" });
      return;
    }
    const currentResult = await pgPool.query<{
      access_until: string | null;
      trial_used: boolean;
    }>(
      `SELECT access_until::text, trial_used
       FROM user_grile_access
       WHERE user_id = $1
       LIMIT 1`,
      [userId],
    );
    const current = currentResult.rows[0] ?? { access_until: null, trial_used: false };
    if (plan.code === "free_24h" && current.trial_used) {
      res.status(400).json({ error: "Trial deja utilizat", code: "TRIAL_ALREADY_USED" });
      return;
    }
    if (plan.code === "free_24h" && !GRILE_FREE_TRIAL_AVAILABLE) {
      res.status(403).json({
        error: GRILE_FREE_TRIAL_UNAVAILABLE_MESSAGE,
        code: "TRIAL_UNAVAILABLE",
      });
      return;
    }
    if (!plan.isFree) {
      res.status(400).json({ error: "Pentru planurile platite foloseste checkout-ul Revolut", code: "PAYMENT_REQUIRED" });
      return;
    }

    if (!isGrileTrialSmsConfigured()) {
      res.status(503).json({
        error: "SMS (SMSLink) nu e configurat. Adauga SMSLINK_CONNECTION_ID si SMSLINK_CONNECTION_PASSWORD in .env.",
        code: "SMSLINK_NOT_CONFIGURED",
      });
      return;
    }

    const rawPhone = parsed.data.trialPhone!.trim();
    const smsCode = parsed.data.trialSmsCode!.trim();
    const phoneE164 = normalizePhoneToE164(rawPhone);
    if (!phoneE164) {
      res.status(400).json({ error: "Numar de telefon invalid", code: "INVALID_PHONE" });
      return;
    }

    const existingClaim = await pgPool.query<{ user_id: string }>(
      `SELECT user_id FROM grile_trial_phone_claims WHERE phone_e164 = $1 LIMIT 1`,
      [phoneE164],
    );
    const claimOwner = existingClaim.rows[0]?.user_id;
    if (claimOwner && claimOwner !== userId) {
      res.status(400).json({
        error: "Acest numar a fost deja folosit pentru trial gratuit (alt cont).",
        code: "PHONE_TRIAL_ALREADY_USED",
      });
      return;
    }

    const otpResult = await pgPool.query<{ code_hash: string; expires_at: string }>(
      `SELECT code_hash, expires_at::text
       FROM grile_trial_sms_otps
       WHERE user_id = $1 AND phone_e164 = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, phoneE164],
    );
    const otpRow = otpResult.rows[0];
    if (!otpRow || new Date(otpRow.expires_at).getTime() < Date.now()) {
      res.status(400).json({ error: "Cod SMS incorect sau expirat. Cere un nou SMS.", code: "INVALID_SMS_CODE" });
      return;
    }
    if (!trialSmsCodeMatchesStored(otpRow.code_hash, userId, phoneE164, smsCode)) {
      res.status(400).json({ error: "Cod SMS incorect sau expirat.", code: "INVALID_SMS_CODE" });
      return;
    }

    const baseDate =
      current.access_until && new Date(current.access_until).getTime() > Date.now()
        ? new Date(current.access_until)
        : new Date();
    const nextAccessUntil = new Date(baseDate.getTime() + plan.durationHours * 60 * 60 * 1000);
    const startsAt = baseDate;
    const termsAt = parsed.data.acceptTerms ? new Date().toISOString() : null;

    if (plan.code === "free_24h") {
      // Coloana `is_trial` din user_course_part_access e creata de ensureCoursesTable.
      await ensureCoursesTable();
    }
    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");
      if (plan.code === "free_24h") {
        // O singura activare per cont, chiar si la cereri simultane (cu telefoane diferite).
        await client.query(`SELECT pg_advisory_xact_lock(hashtext('grile_trial:' || $1::text))`, [userId]);
        const usedNow = await client.query<{ trial_used: boolean }>(
          `SELECT trial_used FROM user_grile_access WHERE user_id = $1`,
          [userId],
        );
        if (usedNow.rows[0]?.trial_used) {
          await client.query("ROLLBACK");
          res.status(400).json({ error: "Trial deja utilizat", code: "TRIAL_ALREADY_USED" });
          return;
        }
      }
      const locked = await client.query<{ user_id: string }>(
        `SELECT user_id FROM grile_trial_phone_claims WHERE phone_e164 = $1 FOR UPDATE`,
        [phoneE164],
      );
      const lockedOwner = locked.rows[0]?.user_id;
      if (lockedOwner && lockedOwner !== userId) {
        await client.query("ROLLBACK");
        res.status(400).json({
          error: "Acest numar a fost deja folosit pentru trial gratuit (alt cont).",
          code: "PHONE_TRIAL_ALREADY_USED",
        });
        return;
      }
      if (!lockedOwner) {
        await client.query(`INSERT INTO grile_trial_phone_claims (phone_e164, user_id) VALUES ($1, $2)`, [phoneE164, userId]);
      }
      await client.query(`UPDATE users SET phone = $2, updated_at = NOW() WHERE id = $1`, [userId, phoneE164]);
      await client.query(
        `INSERT INTO user_grile_access (user_id, access_until, trial_used, current_plan_code, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET
           access_until = EXCLUDED.access_until,
           trial_used = user_grile_access.trial_used OR EXCLUDED.trial_used,
           current_plan_code = EXCLUDED.current_plan_code,
           updated_at = NOW()`,
        [userId, nextAccessUntil.toISOString(), plan.code === "free_24h", plan.code],
      );
      await client.query(
        `INSERT INTO user_grile_access_events (
           user_id, plan_code, plan_name, starts_at, ends_at, is_free, is_paid, paid_amount, currency, invoice_number, invoice_url, invoice_issued_at, billing_snapshot, terms_accepted_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL, NULL, NULL, NULL, $10)`,
        [
          userId,
          plan.code,
          plan.name,
          startsAt.toISOString(),
          nextAccessUntil.toISOString(),
          plan.isFree,
          !plan.isFree,
          plan.isFree ? null : plan.priceRon,
          plan.isFree ? null : "RON",
          termsAt,
        ],
      );
      if (plan.code === "free_24h") {
        // Trial-ul deschide si toate cursurile publicate pentru 24h. Nu scurtam un acces mai lung deja existent
        // (NULL = acces nelimitat; GREATEST ignora NULL, deci trebuie tratat separat).
        await client.query(
          `INSERT INTO user_course_part_access (user_id, course_id, course_part_id, access_until, is_trial)
           SELECT $1, p.course_id, p.id, NOW() + INTERVAL '24 hours', TRUE
           FROM course_parts p
           JOIN courses c ON c.id = p.course_id
           WHERE p.is_published = true AND c.is_published = true
           ON CONFLICT (user_id, course_part_id)
           DO UPDATE SET access_until = CASE
             WHEN user_course_part_access.access_until IS NULL THEN NULL
             ELSE GREATEST(user_course_part_access.access_until, EXCLUDED.access_until)
           END`,
          [userId],
        );
      }
      await client.query(`DELETE FROM grile_trial_sms_otps WHERE user_id = $1 AND phone_e164 = $2`, [userId, phoneE164]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    if (plan.code === "free_24h") {
      void recordConversion({
        kind: "trial",
        flow: "grile_trial",
        refId: userId,
        userId,
        productCode: "free_24h",
        valueRon: 0,
        pagePath: "/grile",
      });
      void pgPool
        .query<{ email: string; first_name: string | null; last_name: string | null }>(
          `SELECT email, first_name, last_name FROM users WHERE id = $1`,
          [userId],
        )
        .then(({ rows }) => {
          const u = rows[0];
          if (!u) return;
          return sendTrialActivatedEmail({
            to: u.email,
            customerFirstName: u.first_name,
            accessUntilIso: nextAccessUntil.toISOString(),
            appBaseUrl: getAppBaseUrl().replace(/\/$/, "") || "https://www.zecelainfo.ro",
          });
        })
        .catch((err) => console.error("[grile] trial activation email failed:", err));
    }

    res.json({
      data: {
        ok: true,
        has_access: true,
        access_until: nextAccessUntil.toISOString(),
        current_plan_code: plan.code,
      },
    });
  } catch (error) {
    console.error("Failed to activate grile access:", error);
    res.status(500).json({ error: "Failed to activate grile access", code: "INTERNAL_ERROR" });
  }
});

function normalizeAnswerSet(raw: string | null) {
  return new Set((raw ?? "").split("").map((x) => x.trim().toUpperCase()).filter(Boolean));
}

function computeUbbQuestionScore(
  selectedAnswersRaw: string,
  correctAnswersRaw: string | null,
  pointsPerQuestion: number,
) {
  const selected = new Set(selectedAnswersRaw.split("").map((x) => x.trim().toUpperCase()).filter(Boolean));
  const correct = normalizeAnswerSet(correctAnswersRaw);
  if (correct.size === 0) return { score: 0, selected: [...selected], correct: [...correct] };
  const valuePerCorrect = pointsPerQuestion / correct.size;
  let correctHits = 0;
  let wrongHits = 0;
  for (const answer of selected) {
    if (correct.has(answer)) correctHits += 1;
    else wrongHits += 1;
  }
  const raw = correctHits * valuePerCorrect - wrongHits * (0.66 * valuePerCorrect);
  return {
    score: Math.max(0, raw),
    selected: [...selected],
    correct: [...correct],
  };
}

function computeAllOrNothingQuestionScore(
  selectedAnswersRaw: string,
  correctAnswersRaw: string | null,
  pointsPerQuestion: number,
) {
  const selected = new Set(selectedAnswersRaw.split("").map((x) => x.trim().toUpperCase()).filter(Boolean));
  const correct = normalizeAnswerSet(correctAnswersRaw);
  const isExact =
    selected.size === correct.size &&
    [...selected].every((answer) => correct.has(answer));
  return {
    score: isExact ? pointsPerQuestion : 0,
    selected: [...selected],
    correct: [...correct],
  };
}

grileRouter.get("/summary", async (_req, res) => {
  try {
    await ensureGrileTables();
    const summaryResult = await pgPool.query<{
      total_questions: number;
      total_with_video: number;
      total_with_hint: number;
      total_with_explanation: number;
      total_with_hint_and_explanation: number;
      total_with_hint_ai: number;
      total_with_explanation_ai: number;
      total_sources: number;
      total_chapters: number;
      total_categories: number;
      total_correct_attempts: number;
      total_attempts: number;
      users_with_active_premium: number;
    }>(
      `SELECT
         COUNT(*)::int AS total_questions,
         COUNT(*) FILTER (WHERE NULLIF(TRIM(COALESCE(q.video_url, '')), '') IS NOT NULL)::int AS total_with_video,
         COUNT(*) FILTER (
           WHERE NULLIF(
             TRIM(
               COALESCE(
                 NULLIF(q.hint_ai, ''),
                 NULLIF(ai.hint, ''),
                 NULLIF(ai.student_visible->>'hint', ''),
                 q.hint,
                 ''
               )
             ),
             ''
           ) IS NOT NULL
         )::int AS total_with_hint,
         COUNT(*) FILTER (
           WHERE NULLIF(
             TRIM(
               COALESCE(
                 NULLIF(q.explanation_ai, ''),
                 NULLIF(ai.full_explanation, ''),
                 NULLIF(ai.short_explanation, ''),
                 NULLIF(ai.student_visible->>'explanation', ''),
                 q.explanation,
                 ''
               )
             ),
             ''
           ) IS NOT NULL
         )::int AS total_with_explanation,
         COUNT(*) FILTER (
           WHERE NULLIF(
             TRIM(
               COALESCE(
                 NULLIF(q.hint_ai, ''),
                 NULLIF(ai.hint, ''),
                 NULLIF(ai.student_visible->>'hint', ''),
                 q.hint,
                 ''
               )
             ),
             ''
           ) IS NOT NULL
           AND NULLIF(
             TRIM(
               COALESCE(
                 NULLIF(q.explanation_ai, ''),
                 NULLIF(ai.full_explanation, ''),
                 NULLIF(ai.short_explanation, ''),
                 NULLIF(ai.student_visible->>'explanation', ''),
                 q.explanation,
                 ''
               )
             ),
             ''
           ) IS NOT NULL
         )::int AS total_with_hint_and_explanation,
         COUNT(*) FILTER (
           WHERE NULLIF(
             TRIM(
               COALESCE(
                 NULLIF(ai.hint, ''),
                 NULLIF(ai.student_visible->>'hint', ''),
                 NULLIF(q.hint_ai, ''),
                 ''
               )
             ),
             ''
           ) IS NOT NULL
         )::int AS total_with_hint_ai,
         COUNT(*) FILTER (
           WHERE NULLIF(
             TRIM(
               COALESCE(
                 NULLIF(ai.full_explanation, ''),
                 NULLIF(ai.student_visible->>'explanation', ''),
                 NULLIF(q.explanation_ai, ''),
                 ''
               )
             ),
             ''
           ) IS NOT NULL
         )::int AS total_with_explanation_ai,
         (SELECT COUNT(*)::int FROM grile_sources) AS total_sources,
         (SELECT COUNT(*)::int FROM grile_chapters) AS total_chapters,
         (SELECT COUNT(*)::int FROM grile_categories) AS total_categories,
         (SELECT COUNT(*)::int FROM grile_user_attempts WHERE is_correct = true) AS total_correct_attempts,
         (SELECT COUNT(*)::int FROM grile_user_attempts) AS total_attempts,
         (SELECT COUNT(*)::int FROM user_grile_access WHERE access_until IS NOT NULL AND access_until > NOW()) AS users_with_active_premium
       FROM grile_questions q
       LEFT JOIN grile_question_ai_results ai ON ai.question_id = q.id AND ai.reviewed_by_admin = true`,
    );
    res.json({ data: summaryResult.rows[0] });
  } catch (error) {
    console.error("Failed to fetch global grile summary:", error);
    res.status(500).json({ error: "Failed to fetch global grile summary", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/categories", async (_req, res) => {
  try {
    await ensureGrileTables();
    const result = await pgPool.query<GrileCategoryRow>(
      `SELECT id, slug, name
       FROM grile_categories
       ORDER BY name ASC`,
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Failed to fetch grile categories:", error);
    res.status(500).json({ error: "Failed to fetch grile categories", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/categories/:slug", async (req, res) => {
  const selectedView = viewSchema.safeParse(req.query.view);
  const view = selectedView.success ? selectedView.data : "sources";

  try {
    await ensureGrileTables();

    const categoryResult = await pgPool.query<GrileCategoryRow>(
      `SELECT id, slug, name
       FROM grile_categories
       WHERE slug = $1
       LIMIT 1`,
      [req.params.slug],
    );
    const category = categoryResult.rows[0];
    if (!category) {
      res.status(404).json({ error: "Category not found", code: "NOT_FOUND" });
      return;
    }

    const [sourcesResult, chaptersResult] = await Promise.all([
      pgPool.query<{ id: string; name: string; total_questions: number; exam_mode_enabled: boolean }>(
        `SELECT
           s.id,
           s.name,
           COUNT(q.id)::int AS total_questions,
           COALESCE(cfg.mode_enabled, false) AS exam_mode_enabled
         FROM grile_sources s
         LEFT JOIN grile_questions q ON q.source_id = s.id
         LEFT JOIN grile_exam_source_configs cfg ON cfg.source_id = s.id
         WHERE s.category_id = $1
           AND s.is_published = TRUE
         GROUP BY s.id, s.name, s.order_index, cfg.mode_enabled
         ORDER BY s.order_index ASC NULLS LAST, s.name ASC`,
        [category.id],
      ),
      pgPool.query<{ id: string; name: string; total_questions: number }>(
        `SELECT ch.id, ch.name, COUNT(q.id)::int AS total_questions
         FROM grile_chapters ch
         LEFT JOIN grile_question_chapters gqc ON gqc.chapter_id = ch.id
         LEFT JOIN grile_questions q ON q.id = gqc.question_id
         WHERE ch.category_id = $1
         GROUP BY ch.id, ch.name, ch.order_index
         ORDER BY ch.order_index ASC NULLS LAST, ch.name ASC`,
        [category.id],
      ),
    ]);

    res.json({
      data: {
        category,
        view,
        sources: sourcesResult.rows,
        chapters: chaptersResult.rows,
      },
    });
  } catch (error) {
    console.error("Failed to fetch grile category details:", error);
    res.status(500).json({ error: "Failed to fetch grile category details", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/categories/:slug/progress", requireAuth, async (req, res) => {
  const selectedView = viewSchema.safeParse(req.query.view);
  const view = selectedView.success ? selectedView.data : "sources";

  try {
    await ensureGrileTables();
    const categoryResult = await pgPool.query<{ id: string }>(
      `SELECT id FROM grile_categories WHERE slug = $1 LIMIT 1`,
      [req.params.slug],
    );
    const category = categoryResult.rows[0];
    if (!category) {
      res.status(404).json({ error: "Category not found", code: "NOT_FOUND" });
      return;
    }

    if (view === "sources") {
      const result = await pgPool.query<{ item_id: string; solved_count: number }>(
        `SELECT
           s.id AS item_id,
           COUNT(DISTINCT CASE WHEN a.is_correct THEN q.id END)::int AS solved_count
         FROM grile_sources s
         LEFT JOIN grile_questions q ON q.source_id = s.id
         LEFT JOIN grile_user_attempts a
           ON a.question_id = q.id AND a.user_id = $2
         WHERE s.category_id = $1
           AND s.is_published = TRUE
         GROUP BY s.id`,
        [category.id, req.user?.id],
      );
      res.json({ data: { view, progress: result.rows } });
      return;
    }

    const result = await pgPool.query<{ item_id: string; solved_count: number }>(
      `SELECT
         ch.id AS item_id,
         COUNT(DISTINCT CASE WHEN a.is_correct THEN q.id END)::int AS solved_count
       FROM grile_chapters ch
       LEFT JOIN grile_question_chapters gqc ON gqc.chapter_id = ch.id
       LEFT JOIN grile_questions q ON q.id = gqc.question_id
       LEFT JOIN grile_user_attempts a
         ON a.question_id = q.id AND a.user_id = $2
       WHERE ch.category_id = $1
       GROUP BY ch.id`,
      [category.id, req.user?.id],
    );
    res.json({ data: { view, progress: result.rows } });
  } catch (error) {
    console.error("Failed to fetch category progress:", error);
    res.status(500).json({ error: "Failed to fetch category progress", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/categories/:slug/summary", async (req, res) => {
  try {
    await ensureGrileTables();
    const categoryResult = await pgPool.query<{ id: string; slug: string; name: string }>(
      `SELECT id, slug, name
       FROM grile_categories
       WHERE slug = $1
       LIMIT 1`,
      [req.params.slug],
    );
    const category = categoryResult.rows[0];
    if (!category) {
      res.status(404).json({ error: "Category not found", code: "NOT_FOUND" });
      return;
    }

    const summaryResult = await pgPool.query<{
      total_questions: number;
      total_with_video: number;
      total_with_hint: number;
      total_with_explanation: number;
      total_with_hint_ai: number;
      total_with_explanation_ai: number;
    }>(
      `SELECT
         COUNT(*)::int AS total_questions,
         COUNT(*) FILTER (WHERE NULLIF(TRIM(COALESCE(q.video_url, '')), '') IS NOT NULL)::int AS total_with_video,
         COUNT(*) FILTER (
           WHERE NULLIF(
             TRIM(
               COALESCE(
                 NULLIF(q.hint_ai, ''),
                 NULLIF(ai.hint, ''),
                 NULLIF(ai.student_visible->>'hint', ''),
                 q.hint,
                 ''
               )
             ),
             ''
           ) IS NOT NULL
         )::int AS total_with_hint,
         COUNT(*) FILTER (
           WHERE NULLIF(
             TRIM(
               COALESCE(
                 NULLIF(q.explanation_ai, ''),
                 NULLIF(ai.full_explanation, ''),
                 NULLIF(ai.short_explanation, ''),
                 NULLIF(ai.student_visible->>'explanation', ''),
                 q.explanation,
                 ''
               )
             ),
             ''
           ) IS NOT NULL
         )::int AS total_with_explanation,
         COUNT(*) FILTER (
           WHERE NULLIF(
             TRIM(
               COALESCE(
                 NULLIF(ai.hint, ''),
                 NULLIF(ai.student_visible->>'hint', ''),
                 NULLIF(q.hint_ai, ''),
                 ''
               )
             ),
             ''
           ) IS NOT NULL
         )::int AS total_with_hint_ai,
         COUNT(*) FILTER (
           WHERE NULLIF(
             TRIM(
               COALESCE(
                 NULLIF(ai.full_explanation, ''),
                 NULLIF(ai.student_visible->>'explanation', ''),
                 NULLIF(q.explanation_ai, ''),
                 ''
               )
             ),
             ''
           ) IS NOT NULL
         )::int AS total_with_explanation_ai
       FROM grile_questions q
       LEFT JOIN grile_question_ai_results ai ON ai.question_id = q.id AND ai.reviewed_by_admin = true
       WHERE q.category_id = $1`,
      [category.id],
    );

    res.json({
      data: {
        category,
        ...summaryResult.rows[0],
      },
    });
  } catch (error) {
    console.error("Failed to fetch category summary:", error);
    res.status(500).json({ error: "Failed to fetch category summary", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/categories/:slug/solved-summary", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const categoryResult = await pgPool.query<{ id: string }>(
      `SELECT id
       FROM grile_categories
       WHERE slug = $1
       LIMIT 1`,
      [req.params.slug],
    );
    const category = categoryResult.rows[0];
    if (!category) {
      res.status(404).json({ error: "Category not found", code: "NOT_FOUND" });
      return;
    }

    const solvedResult = await pgPool.query<{ solved_questions: number }>(
      `SELECT COUNT(DISTINCT q.id)::int AS solved_questions
       FROM grile_questions q
       JOIN grile_user_attempts a ON a.question_id = q.id
       WHERE q.category_id = $1
         AND a.user_id = $2
         AND a.is_correct = true`,
      [category.id, req.user?.id],
    );

    res.json({
      data: {
        solved_questions: solvedResult.rows[0]?.solved_questions ?? 0,
      },
    });
  } catch (error) {
    console.error("Failed to fetch solved category summary:", error);
    res.status(500).json({ error: "Failed to fetch solved category summary", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/me/my-list/questions", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const result = await pgPool.query<
      GrilaQuestionRow & {
        source_name: string | null;
        category_name: string | null;
        is_flagged: boolean;
        in_my_list: boolean;
        last_attempt_at: string | null;
        has_correct_attempt: boolean;
        has_wrong_attempt: boolean;
      }
    >(
      `SELECT
         q.id,
         q.legacy_id,
         q.image_url,
         q.answer,
         COALESCE(NULLIF(ai.hint, ''), NULLIF(ai.student_visible->>'hint', ''), NULLIF(q.hint_ai, ''), q.hint) AS hint,
         COALESCE(NULLIF(ai.short_explanation, ''), NULLIF(ai.student_visible->>'explanation', ''), NULLIF(q.explanation_ai, ''), q.explanation) AS short_explanation,
         COALESCE(NULLIF(ai.full_explanation, ''), NULLIF(ai.student_visible->>'explanation', ''), NULLIF(q.explanation_ai, ''), q.explanation) AS full_explanation,
         COALESCE(NULLIF(ai.full_explanation, ''), NULLIF(q.explanation_ai, ''), q.explanation) AS explanation,
         q.video_url,
         q.difficulty,
         q.order_index,
         q.variants_count,
         ARRAY_REMOVE(ARRAY_AGG(DISTINCT ch.name), NULL) AS chapter_names,
         s.name AS source_name,
         c.name AS category_name,
         COALESCE(st.is_flagged, false) AS is_flagged,
         COALESCE(st.in_my_list, false) AS in_my_list,
         la.attempted_at::text AS last_attempt_at,
         COALESCE(aggr.has_correct_attempt, false) AS has_correct_attempt,
         COALESCE(aggr.has_wrong_attempt, false) AS has_wrong_attempt
       FROM grile_user_question_state st
       JOIN grile_questions q ON q.id = st.question_id
       LEFT JOIN grile_question_ai_results ai ON ai.question_id = q.id AND ai.reviewed_by_admin = true
       LEFT JOIN grile_question_chapters gqc ON gqc.question_id = q.id
       LEFT JOIN grile_chapters ch ON ch.id = gqc.chapter_id
       LEFT JOIN grile_sources s ON s.id = q.source_id
       LEFT JOIN grile_categories c ON c.id = q.category_id
       LEFT JOIN LATERAL (
         SELECT
           BOOL_OR(a.is_correct) AS has_correct_attempt,
           BOOL_OR(NOT a.is_correct) AS has_wrong_attempt
         FROM grile_user_attempts a
         WHERE a.user_id = $1 AND a.question_id = q.id
       ) aggr ON true
       LEFT JOIN LATERAL (
         SELECT attempted_at, is_correct
         FROM grile_user_attempts a
         WHERE a.user_id = $1 AND a.question_id = q.id
         ORDER BY attempted_at DESC
         LIMIT 1
       ) la ON true
       WHERE st.user_id = $1
         AND st.in_my_list = true
       GROUP BY
         q.id,
         ai.id,
         s.name,
         c.name,
         st.updated_at,
         st.is_flagged,
         st.in_my_list,
         la.attempted_at,
         aggr.has_correct_attempt,
         aggr.has_wrong_attempt
       ORDER BY st.updated_at DESC, q.order_index ASC NULLS LAST, q.legacy_id ASC`,
      [req.user!.id],
    );
    res.json({ data: { questions: result.rows } });
  } catch (error) {
    console.error("Failed to fetch my list questions:", error);
    res.status(500).json({ error: "Failed to fetch my list questions", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/me/flagged/questions", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const result = await pgPool.query<
      GrilaQuestionRow & {
        source_name: string | null;
        category_name: string | null;
        is_flagged: boolean;
        in_my_list: boolean;
        last_attempt_at: string | null;
        has_correct_attempt: boolean;
        has_wrong_attempt: boolean;
      }
    >(
      `SELECT
         q.id,
         q.legacy_id,
         q.image_url,
         q.answer,
         COALESCE(NULLIF(ai.hint, ''), NULLIF(ai.student_visible->>'hint', ''), NULLIF(q.hint_ai, ''), q.hint) AS hint,
         COALESCE(NULLIF(ai.short_explanation, ''), NULLIF(ai.student_visible->>'explanation', ''), NULLIF(q.explanation_ai, ''), q.explanation) AS short_explanation,
         COALESCE(NULLIF(ai.full_explanation, ''), NULLIF(ai.student_visible->>'explanation', ''), NULLIF(q.explanation_ai, ''), q.explanation) AS full_explanation,
         COALESCE(NULLIF(ai.full_explanation, ''), NULLIF(q.explanation_ai, ''), q.explanation) AS explanation,
         q.video_url,
         q.difficulty,
         q.order_index,
         q.variants_count,
         ARRAY_REMOVE(ARRAY_AGG(DISTINCT ch.name), NULL) AS chapter_names,
         s.name AS source_name,
         c.name AS category_name,
         COALESCE(st.is_flagged, false) AS is_flagged,
         COALESCE(st.in_my_list, false) AS in_my_list,
         la.attempted_at::text AS last_attempt_at,
         COALESCE(aggr.has_correct_attempt, false) AS has_correct_attempt,
         COALESCE(aggr.has_wrong_attempt, false) AS has_wrong_attempt
       FROM grile_user_question_state st
       JOIN grile_questions q ON q.id = st.question_id
       LEFT JOIN grile_question_ai_results ai ON ai.question_id = q.id AND ai.reviewed_by_admin = true
       LEFT JOIN grile_question_chapters gqc ON gqc.question_id = q.id
       LEFT JOIN grile_chapters ch ON ch.id = gqc.chapter_id
       LEFT JOIN grile_sources s ON s.id = q.source_id
       LEFT JOIN grile_categories c ON c.id = q.category_id
       LEFT JOIN LATERAL (
         SELECT
           BOOL_OR(a.is_correct) AS has_correct_attempt,
           BOOL_OR(NOT a.is_correct) AS has_wrong_attempt
         FROM grile_user_attempts a
         WHERE a.user_id = $1 AND a.question_id = q.id
       ) aggr ON true
       LEFT JOIN LATERAL (
         SELECT attempted_at, is_correct
         FROM grile_user_attempts a
         WHERE a.user_id = $1 AND a.question_id = q.id
         ORDER BY attempted_at DESC
         LIMIT 1
       ) la ON true
       WHERE st.user_id = $1
         AND st.is_flagged = true
       GROUP BY
         q.id,
         ai.id,
         s.name,
         c.name,
         st.updated_at,
         st.is_flagged,
         st.in_my_list,
         la.attempted_at,
         aggr.has_correct_attempt,
         aggr.has_wrong_attempt
       ORDER BY st.updated_at DESC, q.order_index ASC NULLS LAST, q.legacy_id ASC`,
      [req.user!.id],
    );
    res.json({ data: { questions: result.rows } });
  } catch (error) {
    console.error("Failed to fetch flagged questions:", error);
    res.status(500).json({ error: "Failed to fetch flagged questions", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/dashboard/stats", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const userId = req.user!.id;
    const statsResult = await pgPool.query<{
      attempts_today: number;
      attempts_7d: number;
      attempts_30d: number;
      attempts_total: number;
      correct_attempts_total: number;
      correct_attempts_30d: number;
      solved_today: number;
      solved_7d: number;
      solved_30d: number;
      solved_total: number;
    }>(
      `WITH normal_attempts AS (
         SELECT
           a.question_id,
           a.attempted_at AS event_at,
           a.is_correct AS is_correct
         FROM grile_user_attempts a
         WHERE a.user_id = $1
       ),
       exam_attempts AS (
         SELECT
           ea.question_id,
           att.finished_at AS event_at,
           (
             ARRAY(
               SELECT x FROM unnest(string_to_array(upper(COALESCE(ea.selected_answers, '')), '')) x
               WHERE x <> ''
               ORDER BY x
             ) =
             ARRAY(
               SELECT y FROM unnest(string_to_array(upper(COALESCE(q.answer, '')), '')) y
               WHERE y <> ''
               ORDER BY y
             )
           ) AS is_correct
         FROM grile_exam_attempt_answers ea
         JOIN grile_exam_attempts att ON att.id = ea.attempt_id
         JOIN grile_questions q ON q.id = ea.question_id
         WHERE att.user_id = $1
           AND att.status = 'finished'
           AND att.finished_at IS NOT NULL
       ),
       all_attempts AS (
         SELECT * FROM normal_attempts
         UNION ALL
         SELECT * FROM exam_attempts
       )
       SELECT
         COUNT(*) FILTER (WHERE event_at >= CURRENT_DATE)::int AS attempts_today,
         COUNT(*) FILTER (WHERE event_at >= NOW() - INTERVAL '7 days')::int AS attempts_7d,
         COUNT(*) FILTER (WHERE event_at >= NOW() - INTERVAL '30 days')::int AS attempts_30d,
         COUNT(*)::int AS attempts_total,
         COUNT(*) FILTER (WHERE is_correct = true)::int AS correct_attempts_total,
         COUNT(*) FILTER (WHERE is_correct = true AND event_at >= NOW() - INTERVAL '30 days')::int AS correct_attempts_30d,
         COUNT(DISTINCT question_id) FILTER (WHERE is_correct = true AND event_at >= CURRENT_DATE)::int AS solved_today,
         COUNT(DISTINCT question_id) FILTER (WHERE is_correct = true AND event_at >= NOW() - INTERVAL '7 days')::int AS solved_7d,
         COUNT(DISTINCT question_id) FILTER (WHERE is_correct = true AND event_at >= NOW() - INTERVAL '30 days')::int AS solved_30d,
         COUNT(DISTINCT question_id) FILTER (WHERE is_correct = true)::int AS solved_total
       FROM all_attempts`,
      [userId],
    );
    const row = statsResult.rows[0] ?? {
      attempts_today: 0,
      attempts_7d: 0,
      attempts_30d: 0,
      attempts_total: 0,
      correct_attempts_total: 0,
      correct_attempts_30d: 0,
      solved_today: 0,
      solved_7d: 0,
      solved_30d: 0,
      solved_total: 0,
    };
    const successRateOverall = row.attempts_total > 0 ? (row.correct_attempts_total / row.attempts_total) * 100 : 0;
    const successRate30d = row.attempts_30d > 0 ? (row.correct_attempts_30d / row.attempts_30d) * 100 : 0;
    res.json({
      data: {
        ...row,
        success_rate_overall: Number(successRateOverall.toFixed(2)),
        success_rate_30d: Number(successRate30d.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Failed to fetch grile dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch grile dashboard stats", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/dashboard/exam-attempts", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const userId = req.user!.id;
    const attemptsResult = await pgPool.query<{
      id: string;
      source_id: string;
      source_name: string;
      score_total: number | null;
      score_without_bonus: number | null;
      bonus_points: number | null;
      question_count: number;
      time_spent_seconds: number | null;
      started_at: string;
      finished_at: string | null;
      status: string;
    }>(
      `SELECT
         a.id,
         a.source_id,
         s.name AS source_name,
         a.score_total::float8 AS score_total,
         a.score_without_bonus::float8 AS score_without_bonus,
         a.bonus_points::float8 AS bonus_points,
         a.question_count,
         a.time_spent_seconds,
         a.started_at::text,
         a.finished_at::text,
         a.status
       FROM grile_exam_attempts a
       JOIN grile_sources s ON s.id = a.source_id
       WHERE a.user_id = $1
         AND a.status = 'finished'
       ORDER BY a.finished_at DESC NULLS LAST, a.started_at DESC
       LIMIT 200`,
      [userId],
    );
    res.json({ data: attemptsResult.rows });
  } catch (error) {
    console.error("Failed to fetch dashboard exam attempts:", error);
    res.status(500).json({ error: "Failed to fetch dashboard exam attempts", code: "INTERNAL_ERROR" });
  }
});

grileRouter.delete("/exam-attempts/:attemptId", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const deleteResult = await pgPool.query<{ id: string }>(
      `DELETE FROM grile_exam_attempts
       WHERE id = $1
         AND user_id = $2
       RETURNING id`,
      [req.params.attemptId, req.user!.id],
    );
    if (!deleteResult.rows[0]) {
      res.status(404).json({ error: "Attempt not found", code: "NOT_FOUND" });
      return;
    }
    res.json({ data: { deleted: true, id: deleteResult.rows[0].id } });
  } catch (error) {
    console.error("Failed to delete exam attempt:", error);
    res.status(500).json({ error: "Failed to delete exam attempt", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/sources/:sourceId/questions", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const sourceId = routeParamString(req.params.sourceId);
    const categorySlug = typeof req.query.category === "string" ? req.query.category : null;

    const access = await assertPublishedSourceForPublic(req.user?.id, sourceId);
    if (!access.ok) {
      res.status(access.status).json({ error: access.error, code: access.code });
      return;
    }
    const sourceResult = await pgPool.query<{ id: string; name: string; category_id: string; category_slug: string }>(
      `SELECT s.id, s.name, s.category_id, c.slug AS category_slug
       FROM grile_sources s
       JOIN grile_categories c ON c.id = s.category_id
       WHERE s.id = $1
       LIMIT 1`,
      [sourceId],
    );
    const source = sourceResult.rows[0];
    if (!source) {
      res.status(404).json({ error: "Source not found", code: "NOT_FOUND" });
      return;
    }
    if (categorySlug && categorySlug !== source.category_slug) {
      res.status(400).json({ error: "Source does not belong to category", code: "INVALID_SOURCE_CATEGORY" });
      return;
    }

    const questionsResult = await pgPool.query<GrilaQuestionRow>(
      `SELECT
         q.id,
         q.legacy_id,
         q.image_url,
         q.answer,
         COALESCE(NULLIF(ai.hint, ''), NULLIF(ai.student_visible->>'hint', ''), NULLIF(q.hint_ai, ''), q.hint) AS hint,
         COALESCE(NULLIF(ai.short_explanation, ''), NULLIF(ai.student_visible->>'explanation', ''), NULLIF(q.explanation_ai, ''), q.explanation) AS short_explanation,
         COALESCE(NULLIF(ai.full_explanation, ''), NULLIF(ai.student_visible->>'explanation', ''), NULLIF(q.explanation_ai, ''), q.explanation) AS full_explanation,
         COALESCE(NULLIF(ai.full_explanation, ''), NULLIF(q.explanation_ai, ''), q.explanation) AS explanation,
         q.video_url,
         q.difficulty,
         q.order_index,
         q.variants_count,
         ARRAY_REMOVE(ARRAY_AGG(DISTINCT ch.name), NULL) AS chapter_names
       FROM grile_questions q
      LEFT JOIN grile_question_ai_results ai ON ai.question_id = q.id AND ai.reviewed_by_admin = true
       LEFT JOIN grile_question_chapters gqc ON gqc.question_id = q.id
       LEFT JOIN grile_chapters ch ON ch.id = gqc.chapter_id
       WHERE q.source_id = $1
       GROUP BY q.id, ai.id
       ORDER BY q.order_index ASC NULLS LAST, q.legacy_id ASC`,
      [source.id],
    );

    res.json({
      data: {
        source: {
          id: source.id,
          name: source.name,
          category_slug: source.category_slug,
        },
        category: {
          slug: source.category_slug,
        },
        questions: questionsResult.rows,
      },
    });
  } catch (error) {
    console.error("Failed to fetch grile source questions:", error);
    res.status(500).json({ error: "Failed to fetch grile source questions", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/chapters/:chapterId/questions", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const chapterId = req.params.chapterId;

    const chapterResult = await pgPool.query<{ id: string; name: string; category_id: string; category_slug: string }>(
      `SELECT ch.id, ch.name, ch.category_id, c.slug AS category_slug
       FROM grile_chapters ch
       JOIN grile_categories c ON c.id = ch.category_id
       WHERE ch.id = $1
       LIMIT 1`,
      [chapterId],
    );
    const chapter = chapterResult.rows[0];
    if (!chapter) {
      res.status(404).json({ error: "Chapter not found", code: "NOT_FOUND" });
      return;
    }

    const questionsResult = await pgPool.query<GrilaQuestionRow & { source_name: string | null }>(
      `SELECT
         q.id,
         q.legacy_id,
         q.image_url,
         q.answer,
         COALESCE(NULLIF(ai.hint, ''), NULLIF(ai.student_visible->>'hint', ''), NULLIF(q.hint_ai, ''), q.hint) AS hint,
         COALESCE(NULLIF(ai.short_explanation, ''), NULLIF(ai.student_visible->>'explanation', ''), NULLIF(q.explanation_ai, ''), q.explanation) AS short_explanation,
         COALESCE(NULLIF(ai.full_explanation, ''), NULLIF(ai.student_visible->>'explanation', ''), NULLIF(q.explanation_ai, ''), q.explanation) AS full_explanation,
         COALESCE(NULLIF(ai.full_explanation, ''), NULLIF(q.explanation_ai, ''), q.explanation) AS explanation,
         q.video_url,
         q.difficulty,
         q.order_index,
         q.variants_count,
         ARRAY_REMOVE(ARRAY_AGG(DISTINCT ch_all.name), NULL) AS chapter_names,
         s.name AS source_name
       FROM grile_questions q
      LEFT JOIN grile_question_ai_results ai ON ai.question_id = q.id AND ai.reviewed_by_admin = true
       JOIN grile_question_chapters gqc ON gqc.question_id = q.id
       LEFT JOIN grile_sources s ON s.id = q.source_id
       LEFT JOIN grile_question_chapters gqc_all ON gqc_all.question_id = q.id
       LEFT JOIN grile_chapters ch_all ON ch_all.id = gqc_all.chapter_id
       WHERE gqc.chapter_id = $1
       GROUP BY q.id, s.name, ai.id
       ORDER BY q.order_index ASC NULLS LAST, q.legacy_id ASC`,
      [chapter.id],
    );

    res.json({
      data: {
        chapter: {
          id: chapter.id,
          name: chapter.name,
          category_slug: chapter.category_slug,
        },
        questions: questionsResult.rows,
      },
    });
  } catch (error) {
    console.error("Failed to fetch chapter questions:", error);
    res.status(500).json({ error: "Failed to fetch chapter questions", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/sources/:sourceId/progress", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const sourceId = routeParamString(req.params.sourceId);
    const access = await assertPublishedSourceForPublic(req.user?.id, sourceId);
    if (!access.ok) {
      res.status(access.status).json({ error: access.error, code: access.code });
      return;
    }
    const userId = req.user?.id;
    const questionsResult = await pgPool.query<{ id: string }>(
      `SELECT id FROM grile_questions WHERE source_id = $1`,
      [sourceId],
    );
    const questionIds = questionsResult.rows.map((row) => row.id);
    if (questionIds.length === 0) {
      res.json({ data: [] });
      return;
    }

    const progressResult = await pgPool.query<{
      question_id: string;
      is_flagged: boolean;
      in_my_list: boolean;
      last_attempt_at: string | null;
      last_is_correct: boolean | null;
      has_correct_attempt: boolean;
      has_wrong_attempt: boolean;
    }>(
      `SELECT
         q.id AS question_id,
         COALESCE(s.is_flagged, false) AS is_flagged,
         COALESCE(s.in_my_list, false) AS in_my_list,
         la.attempted_at::text AS last_attempt_at,
         la.is_correct AS last_is_correct,
         COALESCE(aggr.has_correct_attempt, false) AS has_correct_attempt,
         COALESCE(aggr.has_wrong_attempt, false) AS has_wrong_attempt
       FROM grile_questions q
       LEFT JOIN grile_user_question_state s
         ON s.question_id = q.id AND s.user_id = $1
       LEFT JOIN LATERAL (
         SELECT
           BOOL_OR(a.is_correct) AS has_correct_attempt,
           BOOL_OR(NOT a.is_correct) AS has_wrong_attempt
         FROM grile_user_attempts a
         WHERE a.user_id = $1 AND a.question_id = q.id
       ) aggr ON true
       LEFT JOIN LATERAL (
         SELECT attempted_at, is_correct
         FROM grile_user_attempts a
         WHERE a.user_id = $1 AND a.question_id = q.id
         ORDER BY attempted_at DESC
         LIMIT 1
       ) la ON true
       WHERE q.source_id = $2`,
      [userId, sourceId],
    );

    res.json({ data: progressResult.rows });
  } catch (error) {
    console.error("Failed to fetch source progress:", error);
    res.status(500).json({ error: "Failed to fetch source progress", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/chapters/:chapterId/progress", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const chapterId = req.params.chapterId;
    const userId = req.user?.id;
    const chapterResult = await pgPool.query<{ id: string }>(
      `SELECT id FROM grile_chapters WHERE id = $1 LIMIT 1`,
      [chapterId],
    );
    if (!chapterResult.rows[0]) {
      res.status(404).json({ error: "Chapter not found", code: "NOT_FOUND" });
      return;
    }

    const progressResult = await pgPool.query<{
      question_id: string;
      is_flagged: boolean;
      in_my_list: boolean;
      last_attempt_at: string | null;
      last_is_correct: boolean | null;
      has_correct_attempt: boolean;
      has_wrong_attempt: boolean;
    }>(
      `SELECT
         q.id AS question_id,
         COALESCE(s.is_flagged, false) AS is_flagged,
         COALESCE(s.in_my_list, false) AS in_my_list,
         la.attempted_at::text AS last_attempt_at,
         la.is_correct AS last_is_correct,
         COALESCE(aggr.has_correct_attempt, false) AS has_correct_attempt,
         COALESCE(aggr.has_wrong_attempt, false) AS has_wrong_attempt
       FROM grile_questions q
       JOIN grile_question_chapters gqc ON gqc.question_id = q.id
       LEFT JOIN grile_user_question_state s
         ON s.question_id = q.id AND s.user_id = $1
       LEFT JOIN LATERAL (
         SELECT
           BOOL_OR(a.is_correct) AS has_correct_attempt,
           BOOL_OR(NOT a.is_correct) AS has_wrong_attempt
         FROM grile_user_attempts a
         WHERE a.user_id = $1 AND a.question_id = q.id
       ) aggr ON true
       LEFT JOIN LATERAL (
         SELECT attempted_at, is_correct
         FROM grile_user_attempts a
         WHERE a.user_id = $1 AND a.question_id = q.id
         ORDER BY attempted_at DESC
         LIMIT 1
       ) la ON true
       WHERE gqc.chapter_id = $2`,
      [userId, chapterId],
    );

    res.json({ data: progressResult.rows });
  } catch (error) {
    console.error("Failed to fetch chapter progress:", error);
    res.status(500).json({ error: "Failed to fetch chapter progress", code: "INTERNAL_ERROR" });
  }
});

const checkAnswerSchema = z.object({
  selectedAnswers: z.array(z.string().min(1)).default([]),
});

grileRouter.post("/questions/:questionId/check", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const parsed = checkAnswerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
      return;
    }

    const questionId = grileQuestionIdParam(req.params.questionId);
    const questionResult = await pgPool.query<{ id: string; answer: string | null }>(
      `SELECT id, answer FROM grile_questions WHERE id = $1 LIMIT 1`,
      [questionId],
    );
    const question = questionResult.rows[0];
    if (!question) {
      res.status(404).json({ error: "Question not found", code: "NOT_FOUND" });
      return;
    }

    const normalizedSelected = [...parsed.data.selectedAnswers.map((item) => item.toUpperCase().trim()).filter(Boolean)].sort();
    const normalizedExpected = (question.answer ?? "")
      .split("")
      .map((item) => item.toUpperCase().trim())
      .filter(Boolean)
      .sort();
    const isCorrect =
      normalizedExpected.length === normalizedSelected.length &&
      normalizedExpected.every((item, index) => item === normalizedSelected[index]);

    const attemptResult = await pgPool.query<{ attempted_at: string }>(
      `INSERT INTO grile_user_attempts (user_id, question_id, selected_answers, is_correct)
       VALUES ($1, $2, $3, $4)
       RETURNING attempted_at::text`,
      [req.user?.id, question.id, normalizedSelected.join(""), isCorrect],
    );

    res.json({
      data: {
        is_correct: isCorrect,
        expected_answer: question.answer,
        attempted_at: attemptResult.rows[0]?.attempted_at ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to check answer:", error);
    res.status(500).json({ error: "Failed to check answer", code: "INTERNAL_ERROR" });
  }
});

/** Agregate anonime din grile_user_attempts (toti utilizatorii cu acces grile). */
grileRouter.get("/questions/:questionId/community-stats", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const questionId = grileQuestionIdParam(req.params.questionId);
    if (!questionId) {
      res.status(400).json({ error: "Invalid question id", code: "INVALID_PAYLOAD" });
      return;
    }

    const exists = await pgPool.query<{ ok: number }>(
      `SELECT 1 AS ok FROM grile_questions WHERE id = $1 LIMIT 1`,
      [questionId],
    );
    if (!exists.rows[0]) {
      res.status(404).json({ error: "Question not found", code: "NOT_FOUND" });
      return;
    }

    const statsResult = await pgPool.query<{
      total_attempts: number;
      correct_attempts: number;
      users_attempted: number;
      users_first_try_correct: number;
      users_first_try_wrong: number;
      users_ever_correct: number;
    }>(
      `WITH totals AS (
         SELECT
           COUNT(*)::int AS total_attempts,
           COALESCE(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END), 0)::int AS correct_attempts
         FROM grile_user_attempts
         WHERE question_id = $1
       ),
       first_try AS (
         SELECT DISTINCT ON (user_id)
           user_id,
           is_correct AS first_correct
         FROM grile_user_attempts
         WHERE question_id = $1
         ORDER BY user_id, attempted_at ASC, id ASC
       ),
       per_user AS (
         SELECT
           COUNT(*)::int AS users_attempted,
           COUNT(*) FILTER (WHERE first_correct)::int AS users_first_try_correct,
           COUNT(*) FILTER (WHERE NOT first_correct)::int AS users_first_try_wrong
         FROM first_try
       ),
       ever AS (
         SELECT COUNT(DISTINCT user_id)::int AS users_ever_correct
         FROM grile_user_attempts
         WHERE question_id = $1 AND is_correct = true
       )
       SELECT
         totals.total_attempts,
         totals.correct_attempts,
         per_user.users_attempted,
         per_user.users_first_try_correct,
         per_user.users_first_try_wrong,
         ever.users_ever_correct
       FROM totals
       CROSS JOIN per_user
       CROSS JOIN ever`,
      [questionId],
    );

    const row = statsResult.rows[0];
    if (!row) {
      res.status(500).json({ error: "Failed to load stats", code: "INTERNAL_ERROR" });
      return;
    }

    const usersAttempted = row.users_attempted;
    const totalAttempts = row.total_attempts;
    const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 10 : null);

    res.json({
      data: {
        users_attempted: usersAttempted,
        users_first_try_correct: row.users_first_try_correct,
        users_first_try_wrong: row.users_first_try_wrong,
        users_ever_correct: row.users_ever_correct,
        total_attempts: totalAttempts,
        correct_attempts: row.correct_attempts,
        pct_first_try_correct: pct(row.users_first_try_correct, usersAttempted),
        pct_first_try_wrong: pct(row.users_first_try_wrong, usersAttempted),
        pct_success_attempts: pct(row.correct_attempts, totalAttempts),
        pct_users_ever_correct: pct(row.users_ever_correct, usersAttempted),
        avg_attempts_per_user:
          usersAttempted > 0 ? Math.round((totalAttempts / usersAttempted) * 10) / 10 : null,
      },
    });
  } catch (error) {
    console.error("Failed to load community stats:", error);
    res.status(500).json({ error: "Failed to load community stats", code: "INTERNAL_ERROR" });
  }
});

const toggleStateSchema = z.object({
  value: z.boolean(),
});

const saveFeedbackSchema = z.object({
  contentType: contentTypeSchema,
  rating: z.number().int().min(1).max(5),
});
const reportIssueSchema = z.object({
  message: z.string().trim().min(10).max(4000),
});
const adminReportsListSchema = z.object({
  status: z.enum(["open", "resolved"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
const adminResolveReportSchema = z.object({
  adminNote: z.string().trim().max(2000).optional().default(""),
  resolutionMessage: z.string().trim().min(10).max(4000).optional(),
  sendEmail: z.boolean().optional().default(false),
});

const adminPatchQuestionContentSchema = z
  .object({
    answer: z.string().trim().min(1).max(32).optional(),
    hint: z.string().max(100000).optional(),
    short_explanation: z.string().max(100000).optional(),
    full_explanation: z.string().max(100000).optional(),
    video_url: z.string().trim().max(2000).nullable().optional(),
    image_file_name: z
      .string()
      .min(3)
      .max(255)
      .refine((name) => /\.(png|jpe?g|webp|gif)$/i.test(name), {
        message: "Imaginea trebuie sa fie PNG, JPG, WEBP sau GIF.",
      })
      .optional(),
    image_base64: z.string().min(20).optional(),
  })
  .refine(
    (data) => {
      const hasImage = Boolean(data.image_base64 && data.image_file_name);
      const hasImagePairMismatch =
        Boolean(data.image_base64) !== Boolean(data.image_file_name);
      if (hasImagePairMismatch) return false;
      const otherKeys = Object.entries(data).filter(
        ([key, value]) =>
          value !== undefined && key !== "image_file_name" && key !== "image_base64",
      );
      return otherKeys.length > 0 || hasImage;
    },
    {
      message: "Trebuie furnizat cel putin un camp de actualizat sau o imagine noua.",
    },
  );

const ADMIN_QUESTION_CONTENT_SELECT = `
  q.id,
  q.image_url,
  q.answer,
  COALESCE(NULLIF(ai.hint, ''), NULLIF(ai.student_visible->>'hint', ''), NULLIF(q.hint_ai, ''), q.hint) AS hint,
  COALESCE(NULLIF(ai.short_explanation, ''), NULLIF(ai.student_visible->>'explanation', ''), NULLIF(q.explanation_ai, ''), q.explanation) AS short_explanation,
  COALESCE(NULLIF(ai.full_explanation, ''), NULLIF(ai.student_visible->>'explanation', ''), NULLIF(q.explanation_ai, ''), q.explanation) AS full_explanation,
  q.video_url`;

grileRouter.post("/questions/:questionId/flag", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const parsed = toggleStateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
      return;
    }
    await pgPool.query(
      `INSERT INTO grile_user_question_state (user_id, question_id, is_flagged, in_my_list, updated_at)
       VALUES ($1, $2, $3, false, NOW())
       ON CONFLICT (user_id, question_id)
       DO UPDATE SET is_flagged = $3, updated_at = NOW()`,
      [req.user?.id, req.params.questionId, parsed.data.value],
    );
    res.json({ data: { is_flagged: parsed.data.value } });
  } catch (error) {
    console.error("Failed to update flag state:", error);
    res.status(500).json({ error: "Failed to update flag state", code: "INTERNAL_ERROR" });
  }
});

grileRouter.post("/questions/:questionId/my-list", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const parsed = toggleStateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
      return;
    }
    await pgPool.query(
      `INSERT INTO grile_user_question_state (user_id, question_id, is_flagged, in_my_list, updated_at)
       VALUES ($1, $2, false, $3, NOW())
       ON CONFLICT (user_id, question_id)
       DO UPDATE SET in_my_list = $3, updated_at = NOW()`,
      [req.user?.id, req.params.questionId, parsed.data.value],
    );
    res.json({ data: { in_my_list: parsed.data.value } });
  } catch (error) {
    console.error("Failed to update my list state:", error);
    res.status(500).json({ error: "Failed to update my list state", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/questions/:questionId/content-feedback", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const selectedType = contentTypeSchema.safeParse(req.query.contentType);
    if (!selectedType.success) {
      res.status(400).json({ error: "Invalid content type", code: "INVALID_PAYLOAD" });
      return;
    }
    const questionResult = await pgPool.query<{ id: string }>(
      `SELECT id FROM grile_questions WHERE id = $1 LIMIT 1`,
      [req.params.questionId],
    );
    if (!questionResult.rows[0]) {
      res.status(404).json({ error: "Question not found", code: "NOT_FOUND" });
      return;
    }
    const ratingResult = await pgPool.query<{ rating: number }>(
      `SELECT rating
       FROM grile_user_content_feedback
       WHERE user_id = $1
         AND question_id = $2
         AND content_type = $3
       LIMIT 1`,
      [req.user!.id, req.params.questionId, selectedType.data],
    );
    res.json({ data: { content_type: selectedType.data, rating: ratingResult.rows[0]?.rating ?? null } });
  } catch (error) {
    console.error("Failed to fetch content feedback:", error);
    res.status(500).json({ error: "Failed to fetch content feedback", code: "INTERNAL_ERROR" });
  }
});

grileRouter.post("/questions/:questionId/content-feedback", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const parsed = saveFeedbackSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
      return;
    }
    const questionResult = await pgPool.query<{ id: string }>(
      `SELECT id FROM grile_questions WHERE id = $1 LIMIT 1`,
      [req.params.questionId],
    );
    if (!questionResult.rows[0]) {
      res.status(404).json({ error: "Question not found", code: "NOT_FOUND" });
      return;
    }
    await pgPool.query(
      `INSERT INTO grile_user_content_feedback (user_id, question_id, content_type, rating, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, question_id, content_type)
       DO UPDATE SET rating = EXCLUDED.rating, updated_at = NOW()`,
      [req.user!.id, req.params.questionId, parsed.data.contentType, parsed.data.rating],
    );
    res.json({ data: { content_type: parsed.data.contentType, rating: parsed.data.rating } });
  } catch (error) {
    console.error("Failed to save content feedback:", error);
    res.status(500).json({ error: "Failed to save content feedback", code: "INTERNAL_ERROR" });
  }
});

grileRouter.post("/questions/:questionId/report-issue", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const parsed = reportIssueSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
      return;
    }
    const questionResult = await pgPool.query<{ id: string; source_id: string | null }>(
      `SELECT id, source_id
       FROM grile_questions
       WHERE id = $1
       LIMIT 1`,
      [req.params.questionId],
    );
    const question = questionResult.rows[0];
    if (!question) {
      res.status(404).json({ error: "Question not found", code: "NOT_FOUND" });
      return;
    }
    const existingOpenResult = await pgPool.query<{ id: string }>(
      `SELECT id
       FROM grile_question_reports
       WHERE question_id = $1
         AND user_id = $2
         AND status = 'open'
       ORDER BY created_at DESC
       LIMIT 1`,
      [question.id, req.user!.id],
    );
    if (existingOpenResult.rows[0]) {
      const updateResult = await pgPool.query<{ id: string; updated_at: string }>(
        `UPDATE grile_question_reports
         SET message = $2,
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, updated_at::text`,
        [existingOpenResult.rows[0].id, parsed.data.message],
      );
      res.json({ data: { id: updateResult.rows[0]?.id ?? null, updated_at: updateResult.rows[0]?.updated_at ?? null, mode: "updated" } });
      return;
    }
    const insertResult = await pgPool.query<{ id: string; created_at: string }>(
      `INSERT INTO grile_question_reports (question_id, user_id, source_id, message, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'open', NOW(), NOW())
       RETURNING id, created_at::text`,
      [question.id, req.user!.id, question.source_id, parsed.data.message],
    );
    res.json({ data: { id: insertResult.rows[0]?.id ?? null, created_at: insertResult.rows[0]?.created_at ?? null, mode: "created" } });
  } catch (error) {
    console.error("Failed to report grile issue:", error);
    res.status(500).json({ error: "Failed to report issue", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/questions/:questionId/report-issue", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const questionResult = await pgPool.query<{ id: string }>(
      `SELECT id FROM grile_questions WHERE id = $1 LIMIT 1`,
      [req.params.questionId],
    );
    if (!questionResult.rows[0]) {
      res.status(404).json({ error: "Question not found", code: "NOT_FOUND" });
      return;
    }
    const reportResult = await pgPool.query<{ id: string; message: string; status: "open" | "resolved"; updated_at: string }>(
      `SELECT id, message, status, updated_at::text
       FROM grile_question_reports
       WHERE question_id = $1
         AND user_id = $2
       ORDER BY updated_at DESC
       LIMIT 1`,
      [req.params.questionId, req.user!.id],
    );
    const report = reportResult.rows[0] ?? null;
    res.json({ data: report });
  } catch (error) {
    console.error("Failed to fetch report draft:", error);
    res.status(500).json({ error: "Failed to fetch report draft", code: "INTERNAL_ERROR" });
  }
});

const adminAiListQuerySchema = z.object({
  categorySlug: z.string().optional(),
  sourceId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
  difficulty: z.coerce.number().int().min(1).max(10).optional(),
  processingStatus: z.enum(["pending", "processing", "done", "error"]).optional(),
  onlyWithoutAI: z.coerce.boolean().optional(),
  onlyNeedsReview: z.coerce.boolean().optional(),
  onlyErrors: z.coerce.boolean().optional(),
  searchQuestionId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const adminAiProcessSchema = z.object({
  questionId: z.string().uuid(),
  forceRegenerate: z.boolean().default(false),
});

const adminAiBatchSchema = z.object({
  categorySlug: z.string().optional(),
  sourceId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
  difficulty: z.number().int().min(1).max(10).optional(),
  processingStatus: z.enum(["pending", "processing", "done", "error"]).optional(),
  onlyWithoutAI: z.boolean().optional(),
  onlyNeedsReview: z.boolean().optional(),
  onlyErrors: z.boolean().optional(),
  searchQuestionId: z.string().optional(),
  // O singura grila per request — OpenAI poate dura >60s; evita 504 nginx.
  limit: z.number().int().min(1).max(1).default(1),
  forceRegenerate: z.boolean().default(false),
  includeAlreadyGenerated: z.boolean().default(false),
});

const adminReviewSchema = z.object({
  adminReviewNote: z.string().max(4000).optional().default(""),
  clearNeedsHumanReview: z.boolean().optional().default(false),
});

const adminAutoReviewConfidentSchema = z.object({
  categorySlug: z.string().optional(),
  sourceId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
});

function buildAdminAiWhereClause(parsed: z.infer<typeof adminAiListQuerySchema | typeof adminAiBatchSchema>) {
  const clauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (parsed.categorySlug) {
    clauses.push(`q.category_id IN (SELECT id FROM grile_categories WHERE slug = $${idx++})`);
    params.push(parsed.categorySlug);
  }
  if (parsed.sourceId) {
    clauses.push(`q.source_id = $${idx++}`);
    params.push(parsed.sourceId);
  }
  if (parsed.chapterId) {
    clauses.push(`EXISTS (SELECT 1 FROM grile_question_chapters gqc2 WHERE gqc2.question_id = q.id AND gqc2.chapter_id = $${idx++})`);
    params.push(parsed.chapterId);
  }
  if (parsed.difficulty != null) {
    clauses.push(`q.difficulty = $${idx++}`);
    params.push(parsed.difficulty);
  }
  if (parsed.searchQuestionId) {
    clauses.push(`(q.id::text ILIKE $${idx++} OR q.legacy_id::text ILIKE $${idx})`);
    params.push(`%${parsed.searchQuestionId}%`);
    idx += 1;
  }
  if (parsed.onlyWithoutAI) clauses.push(`ai.question_id IS NULL`);
  if (parsed.onlyNeedsReview) clauses.push(`COALESCE(ai.needs_human_review, false) = true`);
  if (parsed.onlyErrors) clauses.push(`COALESCE(ai.processing_status, 'pending') = 'error'`);
  if (parsed.processingStatus) clauses.push(`COALESCE(ai.processing_status, 'pending') = $${idx++}`), params.push(parsed.processingStatus);

  return {
    whereSql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
    nextIndex: idx,
  };
}

const adminCreateSourceSchema = z.object({
  category_slug: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(300),
});

const adminRenameSourceSchema = z.object({
  name: z.string().trim().min(1).max(300),
});

const adminReorderSourcesSchema = z.object({
  source_ids: z.array(z.string().uuid()).min(1).max(500),
});

const adminUpdateSourceVariantsSchema = z.object({
  variants_count: z.number().int().min(2).max(10),
});

const adminBulkQuestionFilesSchema = z.object({
  files: z
    .array(
      z.object({
        file_name: z.string().min(3).max(255),
        file_base64: z.string().min(20),
      }),
    )
    .min(1)
    .max(50),
});

const adminPatchQuestionMetaSchema = z.object({
  answer: z.string().trim().min(1).max(32).optional(),
  video_url: z.string().trim().max(2000).nullable().optional(),
  chapter_ids: z.array(z.string().uuid()).max(20).optional(),
  order_index: z.number().int().min(0).max(100000).optional(),
  variants_count: z.number().int().min(2).max(10).optional(),
});

const adminPatchExamModeSchema = z.object({
  mode_enabled: z.boolean(),
});

grileRouter.get("/admin/categories/:slug/sources", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const allowed = await ensureStrictAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    const categoryResult = await pgPool.query<{ id: string; slug: string; name: string }>(
      `SELECT id, slug, name FROM grile_categories WHERE slug = $1 LIMIT 1`,
      [req.params.slug],
    );
    const category = categoryResult.rows[0];
    if (!category) {
      res.status(404).json({ error: "Category not found", code: "NOT_FOUND" });
      return;
    }
    const sourcesResult = await pgPool.query<{
      id: string;
      name: string;
      is_published: boolean;
      published_at: string | null;
      order_index: number | null;
      default_variants_count: number;
      question_count: number;
      ai_done_count: number;
      exam_mode_enabled: boolean;
    }>(
      `SELECT
         s.id,
         s.name,
         s.is_published,
         s.published_at::text,
         s.order_index,
         s.default_variants_count,
         COUNT(q.id)::int AS question_count,
         COUNT(ai.question_id) FILTER (WHERE ai.processing_status = 'done')::int AS ai_done_count,
         COALESCE(cfg.mode_enabled, false) AS exam_mode_enabled
       FROM grile_sources s
       LEFT JOIN grile_questions q ON q.source_id = s.id
       LEFT JOIN grile_question_ai_results ai ON ai.question_id = q.id
       LEFT JOIN grile_exam_source_configs cfg ON cfg.source_id = s.id
       WHERE s.category_id = $1
       GROUP BY s.id, s.name, s.is_published, s.published_at, s.order_index, s.default_variants_count, cfg.mode_enabled
       ORDER BY s.order_index ASC NULLS LAST, s.name ASC`,
      [category.id],
    );
    const chaptersResult = await pgPool.query<{ id: string; name: string }>(
      `SELECT id, name FROM grile_chapters WHERE category_id = $1 ORDER BY order_index ASC NULLS LAST, name ASC`,
      [category.id],
    );
    res.json({
      data: {
        category,
        sources: sourcesResult.rows,
        chapters: chaptersResult.rows,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin category sources:", error);
    res.status(500).json({ error: "Failed to fetch admin category sources", code: "INTERNAL_ERROR" });
  }
});

grileRouter.patch(
  "/admin/categories/:slug/sources/reorder",
  requireAuth,
  validateBody(adminReorderSourcesSchema),
  async (req, res) => {
    const client = await pgPool.connect();
    try {
      await ensureGrileTables();
      const allowed = await ensureStrictAdminRole(req.user?.id);
      if (!allowed) {
        res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
        return;
      }
      const categoryResult = await pgPool.query<{ id: string }>(
        `SELECT id FROM grile_categories WHERE slug = $1 LIMIT 1`,
        [req.params.slug],
      );
      const category = categoryResult.rows[0];
      if (!category) {
        res.status(404).json({ error: "Category not found", code: "NOT_FOUND" });
        return;
      }
      const body = req.body as z.infer<typeof adminReorderSourcesSchema>;
      const existingResult = await pgPool.query<{ id: string }>(
        `SELECT id FROM grile_sources WHERE category_id = $1`,
        [category.id],
      );
      const existingIds = new Set(existingResult.rows.map((row) => row.id));
      const submittedIds = new Set(body.source_ids);
      const isSameSet =
        submittedIds.size === body.source_ids.length &&
        submittedIds.size === existingIds.size &&
        body.source_ids.every((id) => existingIds.has(id));
      if (!isSameSet) {
        res.status(400).json({
          error: "Lista de surse trimisa nu corespunde exact surselor din aceasta categorie.",
          code: "VALIDATION_ERROR",
        });
        return;
      }
      await client.query("BEGIN");
      for (let index = 0; index < body.source_ids.length; index += 1) {
        await client.query(`UPDATE grile_sources SET order_index = $2 WHERE id = $1`, [
          body.source_ids[index],
          index + 1,
        ]);
      }
      await client.query("COMMIT");
      res.json({ data: { ok: true } });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      console.error("Failed to reorder grile sources:", error);
      res.status(500).json({ error: "Failed to reorder grile sources", code: "INTERNAL_ERROR" });
    } finally {
      client.release();
    }
  },
);

grileRouter.patch(
  "/admin/sources/:sourceId/variants-count",
  requireAuth,
  validateBody(adminUpdateSourceVariantsSchema),
  async (req, res) => {
    const client = await pgPool.connect();
    try {
      await ensureGrileTables();
      const allowed = await ensureStrictAdminRole(req.user?.id);
      if (!allowed) {
        res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
        return;
      }
      const sourceId = routeParamString(req.params.sourceId);
      const source = await getSourceById(sourceId);
      if (!source) {
        res.status(404).json({ error: "Source not found", code: "NOT_FOUND" });
        return;
      }
      const body = req.body as z.infer<typeof adminUpdateSourceVariantsSchema>;
      await client.query("BEGIN");
      await client.query(`UPDATE grile_sources SET default_variants_count = $2 WHERE id = $1`, [
        sourceId,
        body.variants_count,
      ]);
      const updatedQuestions = await client.query(
        `UPDATE grile_questions SET variants_count = $2 WHERE source_id = $1`,
        [sourceId, body.variants_count],
      );
      await client.query("COMMIT");
      res.json({
        data: {
          default_variants_count: body.variants_count,
          updated_questions: updatedQuestions.rowCount ?? 0,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      console.error("Failed to update grile source variants count:", error);
      res.status(500).json({ error: "Failed to update grile source variants count", code: "INTERNAL_ERROR" });
    } finally {
      client.release();
    }
  },
);

grileRouter.post("/admin/sources", requireAuth, validateBody(adminCreateSourceSchema), async (req, res) => {
  try {
    await ensureGrileTables();
    const allowed = await ensureStrictAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    const body = req.body as z.infer<typeof adminCreateSourceSchema>;
    const categoryResult = await pgPool.query<{ id: string }>(
      `SELECT id FROM grile_categories WHERE slug = $1 LIMIT 1`,
      [body.category_slug],
    );
    const category = categoryResult.rows[0];
    if (!category) {
      res.status(404).json({ error: "Category not found", code: "NOT_FOUND" });
      return;
    }
    const orderResult = await pgPool.query<{ next_order: number }>(
      `SELECT COALESCE(MAX(order_index), 0) + 1 AS next_order FROM grile_sources WHERE category_id = $1`,
      [category.id],
    );
    const insertResult = await pgPool.query<{
      id: string;
      name: string;
      is_published: boolean;
      published_at: string | null;
    }>(
      `INSERT INTO grile_sources (category_id, name, order_index, is_published, published_at)
       VALUES ($1, $2, $3, FALSE, NULL)
       RETURNING id, name, is_published, published_at::text`,
      [category.id, body.name, orderResult.rows[0]?.next_order ?? 1],
    );
    const source = insertResult.rows[0];
    await upsertGrileExamSourceConfig(source.id, body.name, body.category_slug);
    res.status(201).json({ data: source });
  } catch (error) {
    const pgCode = (error as { code?: string }).code;
    if (pgCode === "23505") {
      res.status(409).json({ error: "Exista deja o sursa cu acest nume in categorie.", code: "CONFLICT" });
      return;
    }
    console.error("Failed to create grile source:", error);
    res.status(500).json({ error: "Failed to create grile source", code: "INTERNAL_ERROR" });
  }
});

grileRouter.patch(
  "/admin/sources/:sourceId",
  requireAuth,
  validateBody(adminRenameSourceSchema),
  async (req, res) => {
    try {
      await ensureGrileTables();
      const allowed = await ensureStrictAdminRole(req.user?.id);
      if (!allowed) {
        res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
        return;
      }
      const sourceId = routeParamString(req.params.sourceId);
      const body = req.body as z.infer<typeof adminRenameSourceSchema>;
      const updated = await pgPool.query<{ id: string; name: string; is_published: boolean; published_at: string | null }>(
        `UPDATE grile_sources
         SET name = $2
         WHERE id = $1
         RETURNING id, name, is_published, published_at::text`,
        [sourceId, body.name],
      );
      if (!updated.rows[0]) {
        res.status(404).json({ error: "Source not found", code: "NOT_FOUND" });
        return;
      }
      res.json({ data: updated.rows[0] });
    } catch (error) {
      const pgCode = (error as { code?: string }).code;
      if (pgCode === "23505") {
        res.status(409).json({ error: "Exista deja o sursa cu acest nume in categorie.", code: "CONFLICT" });
        return;
      }
      console.error("Failed to rename grile source:", error);
      res.status(500).json({ error: "Failed to rename grile source", code: "INTERNAL_ERROR" });
    }
  },
);

grileRouter.post("/admin/sources/:sourceId/publish", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const allowed = await ensureStrictAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    const updated = await pgPool.query<{ id: string; name: string; is_published: boolean; published_at: string | null }>(
      `UPDATE grile_sources
       SET is_published = TRUE,
           published_at = COALESCE(published_at, NOW())
       WHERE id = $1
       RETURNING id, name, is_published, published_at::text`,
      [routeParamString(req.params.sourceId)],
    );
    if (!updated.rows[0]) {
      res.status(404).json({ error: "Source not found", code: "NOT_FOUND" });
      return;
    }
    res.json({ data: updated.rows[0] });
  } catch (error) {
    console.error("Failed to publish grile source:", error);
    res.status(500).json({ error: "Failed to publish grile source", code: "INTERNAL_ERROR" });
  }
});

grileRouter.post("/admin/sources/:sourceId/unpublish", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const allowed = await ensureStrictAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    const updated = await pgPool.query<{ id: string; name: string; is_published: boolean; published_at: string | null }>(
      `UPDATE grile_sources
       SET is_published = FALSE
       WHERE id = $1
       RETURNING id, name, is_published, published_at::text`,
      [routeParamString(req.params.sourceId)],
    );
    if (!updated.rows[0]) {
      res.status(404).json({ error: "Source not found", code: "NOT_FOUND" });
      return;
    }
    res.json({ data: updated.rows[0] });
  } catch (error) {
    console.error("Failed to unpublish grile source:", error);
    res.status(500).json({ error: "Failed to unpublish grile source", code: "INTERNAL_ERROR" });
  }
});

grileRouter.patch(
  "/admin/sources/:sourceId/exam-mode",
  requireAuth,
  validateBody(adminPatchExamModeSchema),
  async (req, res) => {
    try {
      await ensureGrileTables();
      const allowed = await ensureStrictAdminRole(req.user?.id);
      if (!allowed) {
        res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
        return;
      }
      const sourceId = routeParamString(req.params.sourceId);
      const body = req.body as z.infer<typeof adminPatchExamModeSchema>;
      const sourceResult = await pgPool.query<{ id: string; name: string; category_slug: string }>(
        `SELECT s.id, s.name, c.slug AS category_slug
         FROM grile_sources s
         JOIN grile_categories c ON c.id = s.category_id
         WHERE s.id = $1
         LIMIT 1`,
        [sourceId],
      );
      const source = sourceResult.rows[0];
      if (!source) {
        res.status(404).json({ error: "Source not found", code: "NOT_FOUND" });
        return;
      }
      await upsertGrileExamSourceConfig(source.id, source.name, source.category_slug);
      const updated = await pgPool.query<{ mode_enabled: boolean; duration_seconds: number; scoring_mode: string }>(
        `UPDATE grile_exam_source_configs
         SET mode_enabled = $2,
             updated_at = NOW()
         WHERE source_id = $1
         RETURNING mode_enabled, duration_seconds, scoring_mode`,
        [sourceId, body.mode_enabled],
      );
      if (!updated.rows[0]) {
        res.status(404).json({ error: "Exam config not found", code: "NOT_FOUND" });
        return;
      }
      res.json({
        data: {
          source_id: sourceId,
          exam_mode_enabled: updated.rows[0].mode_enabled,
          duration_seconds: updated.rows[0].duration_seconds,
          scoring_mode: updated.rows[0].scoring_mode,
        },
      });
    } catch (error) {
      console.error("Failed to update grile exam mode:", error);
      res.status(500).json({ error: "Failed to update grile exam mode", code: "INTERNAL_ERROR" });
    }
  },
);

grileRouter.get("/admin/sources/:sourceId/questions", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const allowed = await ensureStrictAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    const source = await getSourceById(routeParamString(req.params.sourceId));
    if (!source) {
      res.status(404).json({ error: "Source not found", code: "NOT_FOUND" });
      return;
    }
    const questionsResult = await pgPool.query<{
      id: string;
      legacy_id: number;
      image_url: string | null;
      answer: string | null;
      video_url: string | null;
      order_index: number | null;
      variants_count: number | null;
      chapter_ids: string[];
      chapter_names: string[];
      ai_processing_status: string | null;
      ai_needs_review: boolean | null;
    }>(
      `SELECT
         q.id,
         q.legacy_id,
         q.image_url,
         q.answer,
         q.video_url,
         q.order_index,
         q.variants_count,
         COALESCE(ARRAY_AGG(DISTINCT gqc.chapter_id) FILTER (WHERE gqc.chapter_id IS NOT NULL), '{}') AS chapter_ids,
         COALESCE(ARRAY_AGG(DISTINCT ch.name) FILTER (WHERE ch.name IS NOT NULL), '{}') AS chapter_names,
         ai.processing_status AS ai_processing_status,
         ai.needs_human_review AS ai_needs_review
       FROM grile_questions q
       LEFT JOIN grile_question_chapters gqc ON gqc.question_id = q.id
       LEFT JOIN grile_chapters ch ON ch.id = gqc.chapter_id
       LEFT JOIN grile_question_ai_results ai ON ai.question_id = q.id
       WHERE q.source_id = $1
       GROUP BY q.id, ai.processing_status, ai.needs_human_review
       ORDER BY q.order_index ASC NULLS LAST, q.legacy_id ASC`,
      [source.id],
    );
    res.json({
      data: {
        source,
        questions: questionsResult.rows,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin source questions:", error);
    res.status(500).json({ error: "Failed to fetch admin source questions", code: "INTERNAL_ERROR" });
  }
});

grileRouter.post(
  "/admin/sources/:sourceId/questions/bulk",
  requireAuth,
  validateBody(adminBulkQuestionFilesSchema),
  async (req, res) => {
    const client = await pgPool.connect();
    try {
      await ensureGrileTables();
      const allowed = await ensureStrictAdminRole(req.user?.id);
      if (!allowed) {
        res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
        return;
      }
      const source = await getSourceById(routeParamString(req.params.sourceId));
      if (!source) {
        res.status(404).json({ error: "Source not found", code: "NOT_FOUND" });
        return;
      }
      const body = req.body as z.infer<typeof adminBulkQuestionFilesSchema>;
      const created: Array<{ id: string; legacy_id: number; image_url: string; order_index: number }> = [];

      await client.query("BEGIN");
      for (const file of body.files) {
        const { buffer } = parseQuestionImageUpload(file.file_name, file.file_base64);
        const legacyId = await allocateNextLegacyId(client);
        const orderIndex = await allocateNextOrderIndexForSource(client, source.id);
        const insertResult = await client.query<{ id: string }>(
          `INSERT INTO grile_questions (
             legacy_id, category_id, source_id, order_index, variants_count, created_at
           )
           VALUES ($1, $2, $3, $4, $5, NOW())
           RETURNING id`,
          [legacyId, source.category_id, source.id, orderIndex, source.default_variants_count ?? 4],
        );
        const questionId = insertResult.rows[0]!.id;
        const imageUrl = await persistQuestionImage(questionId, buffer);
        await client.query(`UPDATE grile_questions SET image_url = $2 WHERE id = $1`, [questionId, imageUrl]);
        created.push({ id: questionId, legacy_id: legacyId, image_url: imageUrl, order_index: orderIndex });
      }
      await client.query("COMMIT");
      res.status(201).json({ data: { created_count: created.length, questions: created } });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      const message = error instanceof Error ? error.message : "Failed to bulk upload questions";
      if (
        message.includes("imagine") ||
        message.includes("Format") ||
        message.includes("Fisierul") ||
        message.includes("depaseste")
      ) {
        res.status(400).json({ error: message, code: "VALIDATION_ERROR" });
        return;
      }
      console.error("Failed to bulk upload grile questions:", error);
      res.status(500).json({ error: "Failed to bulk upload grile questions", code: "INTERNAL_ERROR" });
    } finally {
      client.release();
    }
  },
);

grileRouter.patch(
  "/admin/questions/:questionId/meta",
  requireAuth,
  validateBody(adminPatchQuestionMetaSchema),
  async (req, res) => {
    const client = await pgPool.connect();
    try {
      await ensureGrileTables();
      const allowed = await ensureStrictAdminRole(req.user?.id);
      if (!allowed) {
        res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
        return;
      }
      const questionId = grileQuestionIdParam(req.params.questionId);
      const body = req.body as z.infer<typeof adminPatchQuestionMetaSchema>;
      const exists = await client.query<{ id: string; source_id: string | null; category_id: string }>(
        `SELECT id, source_id, category_id FROM grile_questions WHERE id = $1 LIMIT 1`,
        [questionId],
      );
      const row = exists.rows[0];
      if (!row) {
        res.status(404).json({ error: "Question not found", code: "NOT_FOUND" });
        return;
      }

      let videoUrl: string | null | undefined;
      if (body.video_url !== undefined) {
        videoUrl = normalizeVimeoUrl(body.video_url);
      }

      if (body.chapter_ids) {
        const validChapters = await client.query<{ id: string }>(
          `SELECT id FROM grile_chapters WHERE category_id = $1 AND id = ANY($2::uuid[])`,
          [row.category_id, body.chapter_ids],
        );
        if (validChapters.rowCount !== body.chapter_ids.length) {
          res.status(400).json({ error: "Unul sau mai multe capitole nu apartin categoriei.", code: "VALIDATION_ERROR" });
          return;
        }
      }

      await client.query("BEGIN");
      await client.query(
        `UPDATE grile_questions
         SET answer = COALESCE($2, answer),
             video_url = CASE WHEN $3::boolean THEN $4 ELSE video_url END,
             order_index = COALESCE($5, order_index),
             variants_count = COALESCE($6, variants_count)
         WHERE id = $1`,
        [
          questionId,
          body.answer ? body.answer.trim().toUpperCase() : null,
          body.video_url !== undefined,
          videoUrl ?? null,
          body.order_index ?? null,
          body.variants_count ?? null,
        ],
      );
      if (body.chapter_ids) {
        await syncQuestionChapters(client, questionId, body.chapter_ids);
      }
      await client.query("COMMIT");

      const refreshed = await pgPool.query(
        `SELECT
           q.id,
           q.legacy_id,
           q.image_url,
           q.answer,
           q.video_url,
           q.order_index,
           q.variants_count,
           COALESCE(ARRAY_AGG(DISTINCT gqc.chapter_id) FILTER (WHERE gqc.chapter_id IS NOT NULL), '{}') AS chapter_ids,
           COALESCE(ARRAY_AGG(DISTINCT ch.name) FILTER (WHERE ch.name IS NOT NULL), '{}') AS chapter_names
         FROM grile_questions q
         LEFT JOIN grile_question_chapters gqc ON gqc.question_id = q.id
         LEFT JOIN grile_chapters ch ON ch.id = gqc.chapter_id
         WHERE q.id = $1
         GROUP BY q.id`,
        [questionId],
      );
      res.json({ data: refreshed.rows[0] });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      const message = error instanceof Error ? error.message : "Failed to update question";
      if (message.includes("Vimeo")) {
        res.status(400).json({ error: message, code: "VALIDATION_ERROR" });
        return;
      }
      console.error("Failed to update admin question meta:", error);
      res.status(500).json({ error: "Failed to update question meta", code: "INTERNAL_ERROR" });
    } finally {
      client.release();
    }
  },
);

grileRouter.delete("/admin/questions/:questionId", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const allowed = await ensureStrictAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    const questionId = grileQuestionIdParam(req.params.questionId);
    await removeQuestionImageFiles(questionId);
    const deleted = await pgPool.query(`DELETE FROM grile_questions WHERE id = $1 RETURNING id`, [questionId]);
    if (!deleted.rows[0]) {
      res.status(404).json({ error: "Question not found", code: "NOT_FOUND" });
      return;
    }
    res.json({ data: { ok: true, id: questionId } });
  } catch (error) {
    console.error("Failed to delete grile question:", error);
    res.status(500).json({ error: "Failed to delete grile question", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/admin/reports", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    const parsed = adminReportsListSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query", code: "INVALID_PAYLOAD" });
      return;
    }
    const limit = parsed.data.limit ?? 50;
    const offset = parsed.data.offset ?? 0;
    const params: unknown[] = [];
    let whereSql = "";
    if (parsed.data.status) {
      whereSql = "WHERE r.status = $1";
      params.push(parsed.data.status);
    }
    const rowsResult = await pgPool.query(
      `SELECT
         r.id,
         r.question_id,
         q.legacy_id,
         q.order_index,
         s.name AS source_name,
         r.user_id,
         u.email AS user_email,
         r.message,
         r.status,
         r.admin_note,
         r.created_at::text,
         r.updated_at::text,
         r.resolved_at::text
       FROM grile_question_reports r
       JOIN grile_questions q ON q.id = r.question_id
       LEFT JOIN grile_sources s ON s.id = r.source_id
       LEFT JOIN users u ON u.id = r.user_id
       ${whereSql}
       ORDER BY r.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );
    res.json({ data: { items: rowsResult.rows, limit, offset } });
  } catch (error) {
    console.error("Failed to fetch grile reports:", error);
    res.status(500).json({ error: "Failed to fetch reports", code: "INTERNAL_ERROR" });
  }
});

grileRouter.post("/admin/reports/:reportId/resolve", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    const parsed = adminResolveReportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
      return;
    }
    const result = await pgPool.query<{
      id: string;
      question_id: string;
      report_message: string;
      user_email: string | null;
      source_name: string | null;
      order_index: number | null;
      legacy_id: number | null;
    }>(
      `UPDATE grile_question_reports
       SET status = 'resolved',
           admin_note = CASE WHEN $2 = '' THEN admin_note ELSE $2 END,
           resolved_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, question_id, message AS report_message`,
      [req.params.reportId, parsed.data.adminNote],
    );
    const resolved = result.rows[0];
    if (!resolved) {
      res.status(404).json({ error: "Report not found", code: "NOT_FOUND" });
      return;
    }

    if (parsed.data.sendEmail) {
      if (!parsed.data.resolutionMessage) {
        res.status(400).json({ error: "resolutionMessage este obligatoriu cand sendEmail=true", code: "INVALID_PAYLOAD" });
        return;
      }
      const reportDetailsResult = await pgPool.query<{
        user_email: string | null;
        source_name: string | null;
        order_index: number | null;
        legacy_id: number | null;
      }>(
        `SELECT
           u.email AS user_email,
           s.name AS source_name,
           q.order_index,
           q.legacy_id
         FROM grile_question_reports r
         LEFT JOIN users u ON u.id = r.user_id
         LEFT JOIN grile_questions q ON q.id = r.question_id
         LEFT JOIN grile_sources s ON s.id = r.source_id
         WHERE r.id = $1
         LIMIT 1`,
        [resolved.id],
      );
      const reportDetails = reportDetailsResult.rows[0];
      if (!reportDetails?.user_email) {
        res.status(400).json({ error: "Raportul nu are email utilizator pentru notificare.", code: "MISSING_REPORT_EMAIL" });
        return;
      }
      const questionLabel = `Grila ${reportDetails.order_index ?? "-"} (legacy ${reportDetails.legacy_id ?? "-"})`;
      await sendGrileReportResolutionEmail({
        to: reportDetails.user_email,
        questionLabel,
        sourceName: reportDetails.source_name,
        userReportMessage: resolved.report_message,
        adminResolutionMessage: parsed.data.resolutionMessage,
        appBaseUrl: getAppBaseUrl(),
      });
    }

    res.json({ data: { ok: true, id: resolved.id } });
  } catch (error) {
    console.error("Failed to resolve grile report:", error);
    res.status(500).json({ error: "Failed to resolve report", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/admin/questions/:questionId/content", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const allowed = await ensureStrictAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    const questionId = grileQuestionIdParam(req.params.questionId);
    const result = await pgPool.query(
      `SELECT ${ADMIN_QUESTION_CONTENT_SELECT}
       FROM grile_questions q
       LEFT JOIN grile_question_ai_results ai ON ai.question_id = q.id
       WHERE q.id = $1
       LIMIT 1`,
      [questionId],
    );
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: "Question not found", code: "NOT_FOUND" });
      return;
    }
    res.json({ data: row });
  } catch (error) {
    console.error("Failed to fetch admin question content:", error);
    res.status(500).json({ error: "Failed to fetch question content", code: "INTERNAL_ERROR" });
  }
});

grileRouter.patch(
  "/admin/questions/:questionId/content",
  requireAuth,
  validateBody(adminPatchQuestionContentSchema),
  async (req, res) => {
    try {
      await ensureGrileTables();
      const allowed = await ensureStrictAdminRole(req.user?.id);
      if (!allowed) {
        res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
        return;
      }
      const questionId = grileQuestionIdParam(req.params.questionId);
      const body = req.body as z.infer<typeof adminPatchQuestionContentSchema>;

      const exists = await pgPool.query<{ id: string }>(
        `SELECT id FROM grile_questions WHERE id = $1 LIMIT 1`,
        [questionId],
      );
      if (!exists.rows[0]) {
        res.status(404).json({ error: "Question not found", code: "NOT_FOUND" });
        return;
      }

      const normalizedAnswer = body.answer?.trim().toUpperCase();
      let nextImageUrl: string | null | undefined;
      if (body.image_base64 && body.image_file_name) {
        const { buffer, ext } = parseQuestionImageUpload(body.image_file_name, body.image_base64);
        nextImageUrl = await persistQuestionImage(questionId, buffer, ext);
      }

      let videoUrl: string | null | undefined;
      if (body.video_url !== undefined) {
        videoUrl = normalizeVimeoUrl(body.video_url);
      }

      await pgPool.query(
        `UPDATE grile_questions
         SET answer = COALESCE($2, answer),
             hint = COALESCE($3, hint),
             hint_ai = COALESCE($3, hint_ai),
             explanation = COALESCE($4, explanation),
             explanation_ai = COALESCE($5, explanation_ai),
             video_url = CASE WHEN $6::boolean THEN $7 ELSE video_url END,
             image_url = CASE WHEN $8::boolean THEN $9 ELSE image_url END
         WHERE id = $1`,
        [
          questionId,
          normalizedAnswer ?? null,
          body.hint ?? null,
          body.short_explanation ?? null,
          body.full_explanation ?? null,
          body.video_url !== undefined,
          videoUrl ?? null,
          nextImageUrl !== undefined,
          nextImageUrl ?? null,
        ],
      );

      await pgPool.query(
        `UPDATE grile_question_ai_results
         SET official_answer = COALESCE($2, official_answer),
             hint = COALESCE($3, hint),
             short_explanation = COALESCE($4, short_explanation),
             full_explanation = COALESCE($5, full_explanation),
             updated_at = NOW()
         WHERE question_id = $1`,
        [
          questionId,
          normalizedAnswer ?? null,
          body.hint ?? null,
          body.short_explanation ?? null,
          body.full_explanation ?? null,
        ],
      );

      const refreshed = await pgPool.query(
        `SELECT ${ADMIN_QUESTION_CONTENT_SELECT}
         FROM grile_questions q
         LEFT JOIN grile_question_ai_results ai ON ai.question_id = q.id
         WHERE q.id = $1
         LIMIT 1`,
        [questionId],
      );
      res.json({ data: refreshed.rows[0] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update question content";
      if (
        message.includes("imagine") ||
        message.includes("Format") ||
        message.includes("Fisierul") ||
        message.includes("depaseste") ||
        message.includes("Vimeo")
      ) {
        res.status(400).json({ error: message, code: "VALIDATION_ERROR" });
        return;
      }
      console.error("Failed to update admin question content:", error);
      res.status(500).json({ error: "Failed to update question content", code: "INTERNAL_ERROR" });
    }
  },
);

grileRouter.get("/admin/ai/stats", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    const statsResult = await pgPool.query<{
      total_questions: number;
      ai_generated: number;
      without_ai: number;
      needs_human_review: number;
      processing_error: number;
      processed_today: number;
    }>(
      `SELECT
         COUNT(q.id)::int AS total_questions,
         COUNT(ai.question_id)::int AS ai_generated,
         COUNT(q.id) FILTER (WHERE ai.question_id IS NULL)::int AS without_ai,
         COUNT(q.id) FILTER (WHERE COALESCE(ai.needs_human_review, false) = true)::int AS needs_human_review,
         COUNT(q.id) FILTER (WHERE COALESCE(ai.processing_status, 'pending') = 'error')::int AS processing_error,
         COUNT(q.id) FILTER (WHERE ai.generated_at >= CURRENT_DATE)::int AS processed_today
       FROM grile_questions q
       LEFT JOIN grile_question_ai_results ai ON ai.question_id = q.id`,
    );
    const row = statsResult.rows[0] ?? {
      total_questions: 0,
      ai_generated: 0,
      without_ai: 0,
      needs_human_review: 0,
      processing_error: 0,
      processed_today: 0,
    };
    const completionPercent = row.total_questions > 0 ? Number(((row.ai_generated / row.total_questions) * 100).toFixed(2)) : 0;
    res.json({ data: { ...row, completion_percent: completionPercent } });
  } catch (error) {
    console.error("Failed to fetch grile AI stats:", error);
    res.status(500).json({ error: "Failed to fetch grile AI stats", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/admin/ai/questions", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    const parsed = adminAiListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query", code: "INVALID_PAYLOAD" });
      return;
    }
    const limit = parsed.data.limit ?? 20;
    const offset = parsed.data.offset ?? 0;
    const whereData = buildAdminAiWhereClause(parsed.data);
    const query = `
      SELECT
        q.id,
        q.legacy_id,
        q.image_url,
        q.answer AS official_answer,
        q.difficulty,
        q.variants_count,
        s.name AS source_name,
        (
          SELECT ARRAY_REMOVE(ARRAY_AGG(DISTINCT ch2.name), NULL)
          FROM grile_question_chapters gqc2
          JOIN grile_chapters ch2 ON ch2.id = gqc2.chapter_id
          WHERE gqc2.question_id = q.id
        ) AS chapter_names,
        ai.official_answer_normalized,
        ai.model_suggested_answer_normalized,
        ai.processing_status,
        ai.confidence,
        ai.ocr_confidence,
        ai.needs_human_review,
        ai.generated_at::text,
        ai.error_message,
        ai.reviewed_by_admin
      FROM grile_questions q
      LEFT JOIN grile_sources s ON s.id = q.source_id
      LEFT JOIN grile_question_ai_results ai ON ai.question_id = q.id
      ${whereData.whereSql}
      ORDER BY COALESCE(ai.generated_at, q.created_at) DESC
      LIMIT $${whereData.nextIndex} OFFSET $${whereData.nextIndex + 1}`;

    const totalQuery = `
      SELECT COUNT(*)::int AS total
      FROM grile_questions q
      LEFT JOIN grile_question_ai_results ai ON ai.question_id = q.id
      ${whereData.whereSql}`;

    const [rowsResult, totalResult] = await Promise.all([
      pgPool.query(query, [...whereData.params, limit, offset]),
      pgPool.query<{ total: number }>(totalQuery, whereData.params),
    ]);
    res.json({
      data: {
        items: rowsResult.rows,
        total: totalResult.rows[0]?.total ?? 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Failed to fetch grile AI question list:", error);
    res.status(500).json({ error: "Failed to fetch grile AI question list", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/admin/ai/questions/:questionId", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    const detailsResult = await pgPool.query(
      `SELECT
         q.id AS question_id,
         q.legacy_id,
         q.image_url,
         q.answer AS official_answer,
         s.name AS source_name,
         (
           SELECT ARRAY_REMOVE(ARRAY_AGG(DISTINCT ch2.name), NULL)
           FROM grile_question_chapters gqc2
           JOIN grile_chapters ch2 ON ch2.id = gqc2.chapter_id
           WHERE gqc2.question_id = q.id
         ) AS chapter_names,
         ai.*
       FROM grile_questions q
       LEFT JOIN grile_sources s ON s.id = q.source_id
       LEFT JOIN grile_question_ai_results ai ON ai.question_id = q.id
       WHERE q.id = $1
       LIMIT 1`,
      [req.params.questionId],
    );
    const row = detailsResult.rows[0];
    if (!row) {
      res.status(404).json({ error: "Question not found", code: "NOT_FOUND" });
      return;
    }
    res.json({ data: row });
  } catch (error) {
    console.error("Failed to fetch grile AI details:", error);
    res.status(500).json({ error: "Failed to fetch grile AI details", code: "INTERNAL_ERROR" });
  }
});

grileRouter.post("/admin/ai/process-one", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    const parsed = adminAiProcessSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
      return;
    }
    const result = await processSingleGrilaAI(parsed.data.questionId, parsed.data.forceRegenerate);
    res.json({ data: result });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Failed to process question", code: "PROCESS_FAILED" });
  }
});

grileRouter.post("/admin/ai/process-batch", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    const parsed = adminAiBatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
      return;
    }
    const whereData = buildAdminAiWhereClause(parsed.data);
    const includeAlreadyGeneratedClause = parsed.data.includeAlreadyGenerated
      ? ""
      : `AND (
          ai.question_id IS NULL
          OR COALESCE(ai.processing_status, 'pending') IN ('pending', 'error')
        )`;
    const idsResult = await pgPool.query<{ id: string }>(
      `SELECT q.id
       FROM grile_questions q
       LEFT JOIN grile_question_ai_results ai ON ai.question_id = q.id
       ${whereData.whereSql}
       ${includeAlreadyGeneratedClause}
       ORDER BY COALESCE(ai.generated_at, q.created_at) DESC
       LIMIT $${whereData.nextIndex}`,
      [...whereData.params, parsed.data.limit],
    );
    const results: Array<{ questionId: string; ok: boolean; needsReview?: boolean; error?: string; skipped?: boolean }> = [];
    let successCount = 0;
    let errorCount = 0;
    let needsReviewCount = 0;
    for (const row of idsResult.rows) {
      try {
        const generated = await processSingleGrilaAI(row.id, parsed.data.forceRegenerate || parsed.data.includeAlreadyGenerated);
        if ("skipped" in generated && generated.skipped) {
          results.push({ questionId: row.id, ok: true, skipped: true });
          continue;
        }
        const needsReview = Boolean((generated as { result?: { needs_human_review?: boolean } }).result?.needs_human_review);
        if (needsReview) needsReviewCount += 1;
        successCount += 1;
        results.push({ questionId: row.id, ok: true, needsReview });
      } catch (error) {
        errorCount += 1;
        results.push({ questionId: row.id, ok: false, error: error instanceof Error ? error.message : "Unknown error" });
      }
    }
    res.json({
      data: {
        processedCount: idsResult.rows.length,
        successCount,
        errorCount,
        needsReviewCount,
        results,
        promptVersion: GRILE_AI_PROMPT_VERSION,
        contentFormat: GRILE_AI_CONTENT_FORMAT,
      },
    });
  } catch (error) {
    console.error("Failed to process grile batch:", error);
    res.status(500).json({ error: "Failed to process grile batch", code: "INTERNAL_ERROR" });
  }
});

grileRouter.post("/admin/ai/questions/:questionId/review", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    const parsed = adminReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
      return;
    }
    await pgPool.query(
      `UPDATE grile_question_ai_results
       SET reviewed_by_admin = true,
           admin_review_note = $2,
           needs_human_review = CASE WHEN $3 THEN false ELSE needs_human_review END,
           updated_at = NOW()
       WHERE question_id = $1`,
      [req.params.questionId, parsed.data.adminReviewNote, parsed.data.clearNeedsHumanReview],
    );
    res.json({ data: { ok: true } });
  } catch (error) {
    console.error("Failed to review grile AI result:", error);
    res.status(500).json({ error: "Failed to review grile AI result", code: "INTERNAL_ERROR" });
  }
});

grileRouter.post("/admin/ai/auto-review-confident", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    const parsed = adminAutoReviewConfidentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
      return;
    }

    const params: unknown[] = [];
    const clauses: string[] = [
      "ai.needs_human_review = true",
      "(ai.confidence = 100 OR ai.confidence = 1)",
      "ai.processing_status = 'done'",
      "ai.reviewed_by_admin = false",
    ];
    let idx = 1;

    if (parsed.data.categorySlug) {
      clauses.push(`q.category_id IN (SELECT id FROM grile_categories WHERE slug = $${idx++})`);
      params.push(parsed.data.categorySlug);
    }
    if (parsed.data.sourceId) {
      clauses.push(`q.source_id = $${idx++}`);
      params.push(parsed.data.sourceId);
    }
    if (parsed.data.chapterId) {
      clauses.push(
        `EXISTS (SELECT 1 FROM grile_question_chapters gqc WHERE gqc.question_id = q.id AND gqc.chapter_id = $${idx++})`,
      );
      params.push(parsed.data.chapterId);
    }

    const result = await pgPool.query<{ question_id: string }>(
      `WITH target AS (
         SELECT
           ai.question_id,
           ai.transcribed_question,
           ai.hint,
           ai.short_explanation,
           ai.full_explanation,
           ai.student_visible
         FROM grile_question_ai_results ai
         JOIN grile_questions q ON q.id = ai.question_id
         WHERE ${clauses.join(" AND ")}
       ),
       mark_ai AS (
         UPDATE grile_question_ai_results ai
         SET reviewed_by_admin = true,
             needs_human_review = false,
             admin_review_note = COALESCE(NULLIF(ai.admin_review_note, ''), 'Auto-marcat verificat: confidence 1/1.'),
             updated_at = NOW()
         FROM target t
         WHERE ai.question_id = t.question_id
         RETURNING ai.question_id
       ),
       apply_to_questions AS (
         UPDATE grile_questions q
         SET hint_ai = COALESCE(
               NULLIF(BTRIM(t.hint), ''),
               NULLIF(BTRIM(t.student_visible->>'hint'), ''),
               q.hint_ai
             ),
             explanation_ai = COALESCE(
               NULLIF(BTRIM(t.full_explanation), ''),
               NULLIF(BTRIM(t.short_explanation), ''),
               NULLIF(BTRIM(t.student_visible->>'explanation'), ''),
               q.explanation_ai
             ),
             transcript = COALESCE(
               NULLIF(BTRIM(t.transcribed_question), ''),
               q.transcript
             )
         FROM target t
         WHERE q.id = t.question_id
         RETURNING q.id
       )
       SELECT question_id FROM mark_ai`,
      params,
    );

    res.json({ data: { updatedCount: result.rowCount ?? 0, questionIds: result.rows.map((row) => row.question_id) } });
  } catch (error) {
    console.error("Failed to auto review confident grile AI results:", error);
    res.status(500).json({ error: "Failed to auto review confident results", code: "INTERNAL_ERROR" });
  }
});

grileRouter.delete("/admin/ai/questions/:questionId", requireAuth, async (req, res) => {
  try {
    await ensureGrileTables();
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await pgPool.query(`DELETE FROM grile_question_ai_results WHERE question_id = $1`, [req.params.questionId]);
    res.json({ data: { ok: true } });
  } catch (error) {
    console.error("Failed to reset grile AI result:", error);
    res.status(500).json({ error: "Failed to reset grile AI result", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/sources/:sourceId/exam-config", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const access = await assertPublishedSourceForPublic(req.user?.id, routeParamString(req.params.sourceId));
    if (!access.ok) {
      res.status(access.status).json({ error: access.error, code: access.code });
      return;
    }
    const sourceResult = await pgPool.query<{ id: string; name: string }>(
      `SELECT id, name FROM grile_sources WHERE id = $1 LIMIT 1`,
      [req.params.sourceId],
    );
    const source = sourceResult.rows[0];
    if (!source) {
      res.status(404).json({ error: "Source not found", code: "NOT_FOUND" });
      return;
    }
    const configResult = await pgPool.query<{ mode_enabled: boolean; duration_seconds: number; scoring_mode: string }>(
      `SELECT mode_enabled, duration_seconds, scoring_mode
       FROM grile_exam_source_configs
       WHERE source_id = $1
       LIMIT 1`,
      [source.id],
    );
    const config = configResult.rows[0] ?? { mode_enabled: false, duration_seconds: 10800, scoring_mode: "ubb" };
    res.json({
      data: {
        source: { id: source.id, name: source.name },
        ...config,
      },
    });
  } catch (error) {
    console.error("Failed to fetch exam config:", error);
    res.status(500).json({ error: "Failed to fetch exam config", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/sources/:sourceId/exam-questions", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const access = await assertPublishedSourceForPublic(req.user?.id, routeParamString(req.params.sourceId));
    if (!access.ok) {
      res.status(access.status).json({ error: access.error, code: access.code });
      return;
    }
    const sourceResult = await pgPool.query<{ id: string; name: string }>(
      `SELECT id, name FROM grile_sources WHERE id = $1 LIMIT 1`,
      [req.params.sourceId],
    );
    const source = sourceResult.rows[0];
    if (!source) {
      res.status(404).json({ error: "Source not found", code: "NOT_FOUND" });
      return;
    }
    const configResult = await pgPool.query<{ mode_enabled: boolean; duration_seconds: number; scoring_mode: string }>(
      `SELECT mode_enabled, duration_seconds, scoring_mode
       FROM grile_exam_source_configs
       WHERE source_id = $1
       LIMIT 1`,
      [source.id],
    );
    const config = configResult.rows[0];
    if (!config?.mode_enabled) {
      res.status(403).json({ error: "Exam mode disabled for source", code: "FORBIDDEN" });
      return;
    }
    const questionsResult = await pgPool.query<ExamQuestionRow>(
      `SELECT
         grile_questions.id AS id,
         grile_questions.order_index,
         grile_questions.legacy_id,
         grile_questions.image_url,
         grile_questions.variants_count,
         grile_questions.answer,
         COALESCE(
           NULLIF(ai.hint, ''),
           NULLIF(ai.student_visible->>'hint', ''),
           NULLIF(grile_questions.hint_ai, ''),
           grile_questions.hint
         ) AS hint,
         COALESCE(
           NULLIF(ai.short_explanation, ''),
           NULLIF(ai.student_visible->>'explanation', ''),
           NULLIF(grile_questions.explanation_ai, ''),
           grile_questions.explanation
         ) AS short_explanation,
         COALESCE(
           NULLIF(ai.full_explanation, ''),
           NULLIF(ai.student_visible->>'explanation', ''),
           NULLIF(grile_questions.explanation_ai, ''),
           grile_questions.explanation
         ) AS full_explanation,
         COALESCE(
           NULLIF(ai.full_explanation, ''),
           NULLIF(grile_questions.explanation_ai, ''),
           grile_questions.explanation
         ) AS explanation,
         grile_questions.video_url
       FROM grile_questions
       LEFT JOIN grile_question_ai_results ai ON ai.question_id = grile_questions.id AND ai.reviewed_by_admin = true
       WHERE grile_questions.source_id = $1
       ORDER BY grile_questions.order_index ASC NULLS LAST, grile_questions.legacy_id ASC`,
      [source.id],
    );
    res.json({
      data: {
        source: { id: source.id, name: source.name },
        config,
        questions: questionsResult.rows.map((q) => ({
          id: q.id,
          order_index: q.order_index,
          legacy_id: q.legacy_id,
          image_url: q.image_url,
          variants_count: q.variants_count,
          hint: q.hint,
          short_explanation: q.short_explanation,
          full_explanation: q.full_explanation,
          explanation: q.explanation,
          video_url: q.video_url,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to fetch exam questions:", error);
    res.status(500).json({ error: "Failed to fetch exam questions", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/sources/:sourceId/exam-attempts", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const access = await assertPublishedSourceForPublic(req.user?.id, routeParamString(req.params.sourceId));
    if (!access.ok) {
      res.status(access.status).json({ error: access.error, code: access.code });
      return;
    }
    const sourceResult = await pgPool.query<{ id: string }>(
      `SELECT id FROM grile_sources WHERE id = $1 LIMIT 1`,
      [req.params.sourceId],
    );
    if (!sourceResult.rows[0]) {
      res.status(404).json({ error: "Source not found", code: "NOT_FOUND" });
      return;
    }
    const attemptsResult = await pgPool.query<{
      id: string;
      score_total: number | null;
      score_without_bonus: number | null;
      question_count: number;
      time_spent_seconds: number | null;
      started_at: string;
      finished_at: string | null;
      status: string;
    }>(
      `SELECT
         id,
         score_total::float8 AS score_total,
         score_without_bonus::float8 AS score_without_bonus,
         question_count,
         time_spent_seconds,
         started_at::text,
         finished_at::text,
         status
       FROM grile_exam_attempts
       WHERE source_id = $1
         AND user_id = $2
         AND status = 'finished'
       ORDER BY finished_at DESC NULLS LAST, started_at DESC
       LIMIT 50`,
      [req.params.sourceId, req.user!.id],
    );
    res.json({ data: attemptsResult.rows });
  } catch (error) {
    console.error("Failed to fetch exam attempts:", error);
    res.status(500).json({ error: "Failed to fetch exam attempts", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/exam-attempts/:attemptId/review", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const attemptResult = await pgPool.query<{
      id: string;
      source_id: string;
      scoring_mode: string;
      duration_seconds: number;
      question_count: number;
      started_at: string;
      finished_at: string | null;
      status: string;
      score_total: number | null;
      score_without_bonus: number | null;
      bonus_points: number | null;
      time_spent_seconds: number | null;
    }>(
      `SELECT
         id,
         source_id,
         scoring_mode,
         duration_seconds,
         question_count,
         started_at::text,
         finished_at::text,
         status,
         score_total::float8 AS score_total,
         score_without_bonus::float8 AS score_without_bonus,
         bonus_points::float8 AS bonus_points,
         time_spent_seconds
       FROM grile_exam_attempts
       WHERE id = $1
         AND user_id = $2
       LIMIT 1`,
      [req.params.attemptId, req.user!.id],
    );
    const attempt = attemptResult.rows[0];
    if (!attempt) {
      res.status(404).json({ error: "Attempt not found", code: "NOT_FOUND" });
      return;
    }
    if (attempt.status !== "finished") {
      res.status(400).json({ error: "Attempt is not finished", code: "ATTEMPT_NOT_FINISHED" });
      return;
    }

    const questionsResult = await pgPool.query<ExamQuestionRow>(
      `SELECT id, order_index, legacy_id, image_url, variants_count, answer
       FROM grile_questions
       WHERE source_id = $1
       ORDER BY order_index ASC NULLS LAST, legacy_id ASC`,
      [attempt.source_id],
    );
    const answersResult = await pgPool.query<{ question_id: string; selected_answers: string }>(
      `SELECT question_id, selected_answers
       FROM grile_exam_attempt_answers
       WHERE attempt_id = $1`,
      [attempt.id],
    );
    const answerMap = new Map(answersResult.rows.map((row) => [row.question_id, row.selected_answers]));
    const pointsPerQuestion = questionsResult.rows.length > 0 ? 90 / questionsResult.rows.length : 0;
    const breakdown = questionsResult.rows.map((q, idx) => {
      const selectedRaw = answerMap.get(q.id) ?? "";
      const scoreData =
        attempt.scoring_mode === "ubb"
          ? computeUbbQuestionScore(selectedRaw, q.answer, pointsPerQuestion)
          : computeAllOrNothingQuestionScore(selectedRaw, q.answer, pointsPerQuestion);
      return {
        question_id: q.id,
        order: q.order_index ?? idx + 1,
        selected_answers: scoreData.selected.sort().join(""),
        correct_answers: scoreData.correct.sort().join(""),
        score: Number(scoreData.score.toFixed(2)),
      };
    });

    res.json({
      data: {
        attempt_id: attempt.id,
        source_id: attempt.source_id,
        question_count: questionsResult.rows.length,
        score_without_bonus: Number((attempt.score_without_bonus ?? 0).toFixed(2)),
        bonus_points: Number((attempt.bonus_points ?? 10).toFixed(2)),
        score_total: Number((attempt.score_total ?? 0).toFixed(2)),
        started_at: attempt.started_at,
        finished_at: attempt.finished_at ?? attempt.started_at,
        time_spent_seconds: attempt.time_spent_seconds ?? 0,
        duration_seconds: attempt.duration_seconds,
        breakdown,
      },
    });
  } catch (error) {
    console.error("Failed to fetch exam attempt review:", error);
    res.status(500).json({ error: "Failed to fetch exam attempt review", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/sources/:sourceId/exam-attempts/active", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const access = await assertPublishedSourceForPublic(req.user?.id, routeParamString(req.params.sourceId));
    if (!access.ok) {
      res.status(access.status).json({ error: access.error, code: access.code });
      return;
    }
    const sourceResult = await pgPool.query<{ id: string }>(
      `SELECT id FROM grile_sources WHERE id = $1 LIMIT 1`,
      [req.params.sourceId],
    );
    if (!sourceResult.rows[0]) {
      res.status(404).json({ error: "Source not found", code: "NOT_FOUND" });
      return;
    }
    const activeAttemptResult = await pgPool.query<{
      id: string;
      source_id: string;
      source_name: string;
      started_at: string;
      duration_seconds: number;
      question_count: number;
      scoring_mode: string;
    }>(
      `SELECT a.id, a.source_id, s.name AS source_name, a.started_at::text, a.duration_seconds, a.question_count, a.scoring_mode
       FROM grile_exam_attempts a
       JOIN grile_sources s ON s.id = a.source_id
       WHERE a.user_id = $1
         AND status = 'in_progress'
       ORDER BY a.started_at DESC
       LIMIT 1`,
      [req.user!.id],
    );
    const activeAttempt = activeAttemptResult.rows[0] ?? null;
    res.json({ data: { attempt: activeAttempt } });
  } catch (error) {
    console.error("Failed to fetch active exam attempt:", error);
    res.status(500).json({ error: "Failed to fetch active exam attempt", code: "INTERNAL_ERROR" });
  }
});

grileRouter.get("/exam-attempts/:attemptId/state", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const attemptResult = await pgPool.query<{
      id: string;
      source_id: string;
      status: string;
      duration_seconds: number;
      question_count: number;
      started_at: string;
    }>(
      `SELECT id, source_id, status, duration_seconds, question_count, started_at::text
       FROM grile_exam_attempts
       WHERE id = $1
         AND user_id = $2
       LIMIT 1`,
      [req.params.attemptId, req.user!.id],
    );
    const attempt = attemptResult.rows[0];
    if (!attempt) {
      res.status(404).json({ error: "Attempt not found", code: "NOT_FOUND" });
      return;
    }
    const answersResult = await pgPool.query<{ question_id: string; selected_answers: string }>(
      `SELECT question_id, selected_answers
       FROM grile_exam_attempt_answers
       WHERE attempt_id = $1`,
      [attempt.id],
    );
    res.json({
      data: {
        attempt,
        answers: answersResult.rows,
      },
    });
  } catch (error) {
    console.error("Failed to fetch exam attempt state:", error);
    res.status(500).json({ error: "Failed to fetch exam attempt state", code: "INTERNAL_ERROR" });
  }
});

grileRouter.post("/sources/:sourceId/exam-attempts/start", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const access = await assertPublishedSourceForPublic(req.user?.id, routeParamString(req.params.sourceId));
    if (!access.ok) {
      res.status(access.status).json({ error: access.error, code: access.code });
      return;
    }
    const sourceResult = await pgPool.query<{ id: string; name: string }>(
      `SELECT id, name FROM grile_sources WHERE id = $1 LIMIT 1`,
      [req.params.sourceId],
    );
    const source = sourceResult.rows[0];
    if (!source) {
      res.status(404).json({ error: "Source not found", code: "NOT_FOUND" });
      return;
    }
    const configResult = await pgPool.query<{ mode_enabled: boolean; duration_seconds: number; scoring_mode: string }>(
      `SELECT mode_enabled, duration_seconds, scoring_mode
       FROM grile_exam_source_configs
       WHERE source_id = $1
       LIMIT 1`,
      [source.id],
    );
    const config = configResult.rows[0];
    if (!config?.mode_enabled) {
      res.status(403).json({ error: "Exam mode disabled for source", code: "FORBIDDEN" });
      return;
    }
    const countResult = await pgPool.query<{ question_count: number }>(
      `SELECT COUNT(*)::int AS question_count FROM grile_questions WHERE source_id = $1`,
      [source.id],
    );
    const questionCount = countResult.rows[0]?.question_count ?? 0;
    if (questionCount === 0) {
      res.status(400).json({ error: "No questions in source", code: "INVALID_SOURCE" });
      return;
    }
    const activeAttemptResult = await pgPool.query<{
      id: string;
      source_id: string;
      source_name: string;
      started_at: string;
      duration_seconds: number;
      question_count: number;
    }>(
      `SELECT a.id, a.source_id, s.name AS source_name, a.started_at::text, a.duration_seconds, a.question_count
       FROM grile_exam_attempts a
       JOIN grile_sources s ON s.id = a.source_id
       WHERE a.user_id = $1
         AND a.status = 'in_progress'
       ORDER BY a.started_at DESC
       LIMIT 1`,
      [req.user!.id],
    );
    const activeAttempt = activeAttemptResult.rows[0];
    if (activeAttempt && activeAttempt.source_id !== source.id) {
      res.status(409).json({
        error: "Another exam attempt is already in progress",
        code: "EXAM_ALREADY_IN_PROGRESS",
        data: {
          attempt_id: activeAttempt.id,
          source_id: activeAttempt.source_id,
          source_name: activeAttempt.source_name,
        },
      });
      return;
    }
    if (activeAttempt && activeAttempt.source_id === source.id) {
      res.json({
        data: {
          attempt_id: activeAttempt.id,
          started_at: activeAttempt.started_at,
          duration_seconds: activeAttempt.duration_seconds,
          question_count: activeAttempt.question_count,
          resumed: true,
        },
      });
      return;
    }
    const result = await pgPool.query<{ id: string; started_at: string }>(
      `INSERT INTO grile_exam_attempts (user_id, source_id, scoring_mode, duration_seconds, question_count)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, started_at::text`,
      [req.user!.id, source.id, config.scoring_mode, config.duration_seconds, questionCount],
    );
    res.json({
      data: {
        attempt_id: result.rows[0].id,
        started_at: result.rows[0].started_at,
        duration_seconds: config.duration_seconds,
        question_count: questionCount,
        resumed: false,
      },
    });
  } catch (error) {
    console.error("Failed to start exam attempt:", error);
    res.status(500).json({ error: "Failed to start exam attempt", code: "INTERNAL_ERROR" });
  }
});

const examAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedAnswers: z.array(z.string().min(1)).default([]),
});

grileRouter.post("/exam-attempts/:attemptId/answers", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const parsed = examAnswerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
      return;
    }
    const attemptResult = await pgPool.query<{ id: string; source_id: string; status: string }>(
      `SELECT id, source_id, status
       FROM grile_exam_attempts
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [req.params.attemptId, req.user!.id],
    );
    const attempt = attemptResult.rows[0];
    if (!attempt) {
      res.status(404).json({ error: "Attempt not found", code: "NOT_FOUND" });
      return;
    }
    if (attempt.status !== "in_progress") {
      res.status(400).json({ error: "Attempt already finished", code: "ATTEMPT_FINISHED" });
      return;
    }
    const questionResult = await pgPool.query<{ id: string }>(
      `SELECT id FROM grile_questions WHERE id = $1 AND source_id = $2 LIMIT 1`,
      [parsed.data.questionId, attempt.source_id],
    );
    if (!questionResult.rows[0]) {
      res.status(400).json({ error: "Question not in source", code: "INVALID_QUESTION" });
      return;
    }
    const normalizedSelected = [...parsed.data.selectedAnswers.map((item) => item.toUpperCase().trim()).filter(Boolean)].sort();
    await pgPool.query(
      `INSERT INTO grile_exam_attempt_answers (attempt_id, question_id, selected_answers, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (attempt_id, question_id)
       DO UPDATE SET selected_answers = EXCLUDED.selected_answers, updated_at = NOW()`,
      [attempt.id, parsed.data.questionId, normalizedSelected.join("")],
    );
    res.json({ data: { ok: true } });
  } catch (error) {
    console.error("Failed to save exam answer:", error);
    res.status(500).json({ error: "Failed to save exam answer", code: "INTERNAL_ERROR" });
  }
});

grileRouter.post("/exam-attempts/:attemptId/finish", requireAuth, requireGrileAccessMiddleware, async (req, res) => {
  try {
    await ensureGrileTables();
    const attemptResult = await pgPool.query<{
      id: string;
      source_id: string;
      scoring_mode: string;
      question_count: number;
      duration_seconds: number;
      started_at: string;
      status: string;
    }>(
      `SELECT id, source_id, scoring_mode, question_count, duration_seconds, started_at::text, status
       FROM grile_exam_attempts
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [req.params.attemptId, req.user!.id],
    );
    const attempt = attemptResult.rows[0];
    if (!attempt) {
      res.status(404).json({ error: "Attempt not found", code: "NOT_FOUND" });
      return;
    }
    if (attempt.status !== "in_progress") {
      res.status(400).json({ error: "Attempt already finished", code: "ATTEMPT_FINISHED" });
      return;
    }
    const questionsResult = await pgPool.query<ExamQuestionRow>(
      `SELECT id, order_index, legacy_id, image_url, variants_count, answer
       FROM grile_questions
       WHERE source_id = $1
       ORDER BY order_index ASC NULLS LAST, legacy_id ASC`,
      [attempt.source_id],
    );
    const answersResult = await pgPool.query<{ question_id: string; selected_answers: string }>(
      `SELECT question_id, selected_answers
       FROM grile_exam_attempt_answers
       WHERE attempt_id = $1`,
      [attempt.id],
    );
    const answerMap = new Map(answersResult.rows.map((row) => [row.question_id, row.selected_answers]));
    const pointsPerQuestion = questionsResult.rows.length > 0 ? 90 / questionsResult.rows.length : 0;

    let sum = 0;
    const breakdown = questionsResult.rows.map((q, idx) => {
      const selectedRaw = answerMap.get(q.id) ?? "";
      const scoreData =
        attempt.scoring_mode === "ubb"
          ? computeUbbQuestionScore(selectedRaw, q.answer, pointsPerQuestion)
          : computeAllOrNothingQuestionScore(selectedRaw, q.answer, pointsPerQuestion);
      const selectedAnswersSorted = scoreData.selected.sort().join("");
      const correctAnswersSorted = scoreData.correct.sort().join("");
      const isExactCorrect = selectedAnswersSorted === correctAnswersSorted;
      sum += scoreData.score;
      return {
        question_id: q.id,
        order: q.order_index ?? idx + 1,
        selected_answers: selectedAnswersSorted,
        correct_answers: correctAnswersSorted,
        is_correct: isExactCorrect,
        score: Number(scoreData.score.toFixed(2)),
      };
    });
    const scoreWithoutBonus = Math.max(0, Math.min(90, sum));
    const bonusPoints = 10;
    const scoreTotal = Math.max(0, Math.min(100, scoreWithoutBonus + bonusPoints));
    const now = new Date();
    const startedAt = new Date(attempt.started_at);
    const timeSpentSeconds = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 1000));
    await pgPool.query(
      `UPDATE grile_exam_attempts
       SET status = 'finished',
           finished_at = NOW(),
           score_without_bonus = $2,
           score_total = $3,
           bonus_points = $4,
           time_spent_seconds = $5
       WHERE id = $1`,
      [attempt.id, Number(scoreWithoutBonus.toFixed(2)), Number(scoreTotal.toFixed(2)), bonusPoints, timeSpentSeconds],
    );

    // Persist exam results in standard user attempts so normal mode
    // reflects solved/failed status after finishing an exam.
    for (const item of breakdown) {
      await pgPool.query(
        `INSERT INTO grile_user_attempts (user_id, question_id, selected_answers, is_correct)
         VALUES ($1, $2, $3, $4)`,
        [req.user!.id, item.question_id, item.selected_answers, item.is_correct],
      );
    }

    await pgPool.query(
      `UPDATE grile_exam_attempts
       SET status = 'abandoned',
           finished_at = COALESCE(finished_at, NOW()),
           time_spent_seconds = COALESCE(time_spent_seconds, GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - started_at)))::int))
       WHERE user_id = $1
         AND source_id = $2
         AND status = 'in_progress'
         AND id <> $3`,
      [req.user!.id, attempt.source_id, attempt.id],
    );
    res.json({
      data: {
        attempt_id: attempt.id,
        question_count: questionsResult.rows.length,
        score_without_bonus: Number(scoreWithoutBonus.toFixed(2)),
        bonus_points: bonusPoints,
        score_total: Number(scoreTotal.toFixed(2)),
        started_at: attempt.started_at,
        finished_at: now.toISOString(),
        time_spent_seconds: timeSpentSeconds,
        duration_seconds: attempt.duration_seconds,
        breakdown,
      },
    });
  } catch (error) {
    console.error("Failed to finish exam attempt:", error);
    res.status(500).json({ error: "Failed to finish exam attempt", code: "INTERNAL_ERROR" });
  }
});
