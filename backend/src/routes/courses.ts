import { purchaseTrackingPayload, recordConversion } from "../services/marketing.service";
import { Router, type NextFunction, type Request, type Response } from "express";
import { promises as fs } from "node:fs";
import { z } from "zod";
import { pgPool } from "../db/postgres";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  COURSE_INVOICES_DIR,
  downloadSmartbillInvoicePdf,
  getAppBaseUrl,
  issueSmartbillInvoiceWithProducts,
  persistInvoicePdfToDirectory,
  revolutCreateOrder,
  revolutFetchOrder,
  sanitizeInvoiceFileName,
  type SmartbillProductLine,
} from "../services/revolutSmartbill.service";
import {
  applyPercentDiscount,
  ensureDiscountCodesTable,
  incrementDiscountCodeUses,
  resolveActiveDiscountCode,
} from "../services/discountCode.service";
import { billingProfileActivateSchema, persistUserBillingProfile } from "../services/userBillingProfile.service";
import { sendPurchaseThankYouEmail } from "../services/email.service";
import {
  assertExameneLegacyUserImportAllowed,
  ExameneLegacyUserAlreadyImportedError,
  fetchLegacyExameneCourses,
  getExameneLegacyImportLog,
  importLegacyExameneCourses,
  isLegacyCoursesImportConfigured,
} from "../services/coursesLegacyImport.service";
import {
  buildStoredZipFileName,
  decodeUploadBase64,
  persistCourseResourcesZip,
  readCourseResourcesZip,
  removeCourseResourcesZipFile,
  sanitizeZipFileName,
  validateZipBuffer,
} from "../services/courseResources.service";

// Schema setup runs once per process: running the DDL on every request raced when a page
// fired several course endpoints in parallel (DROP/ADD CONSTRAINT -> 42710 -> random 500s).
let coursesTableReady: Promise<void> | null = null;

export function ensureCoursesTable(): Promise<void> {
  if (!coursesTableReady) {
    coursesTableReady = runEnsureCoursesTable().catch((error) => {
      coursesTableReady = null;
      throw error;
    });
  }
  return coursesTableReady;
}

async function runEnsureCoursesTable() {
  await ensureDiscountCodesTable();
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      legacy_id INTEGER NOT NULL UNIQUE,
      category_id INTEGER,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      h1 TEXT,
      author_name TEXT,
      image_url TEXT,
      preview_video_vimeo_id TEXT,
      preview_video_url TEXT,
      resources_url TEXT,
      hook TEXT,
      target_audience TEXT,
      content_summary TEXT,
      requirements TEXT,
      outcomes TEXT,
      bonuses TEXT,
      content_html TEXT,
      price NUMERIC(10, 2),
      sale_price NUMERIC(10, 2),
      currency TEXT NOT NULL DEFAULT 'RON',
      parts_count INTEGER DEFAULT 0,
      hours_total INTEGER,
      level TEXT,
      format TEXT,
      language TEXT,
      is_published BOOLEAN NOT NULL DEFAULT FALSE,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pgPool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS preview_video_vimeo_id TEXT`);
  await pgPool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS preview_video_url TEXT`);
  await pgPool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS resources_zip_path TEXT`);
  await pgPool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS resources_zip_original_name TEXT`);
  await pgPool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS resources_zip_size_bytes BIGINT`);
  await pgPool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS resources_zip_updated_at TIMESTAMPTZ`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_courses_is_published_order ON courses(is_published, order_index, updated_at DESC)`);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS course_parts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      legacy_id INTEGER NOT NULL UNIQUE,
      course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      short_summary TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      hours INTEGER,
      price NUMERIC(10, 2),
      sale_price NUMERIC(10, 2),
      currency TEXT NOT NULL DEFAULT 'RON',
      is_extension BOOLEAN NOT NULL DEFAULT FALSE,
      is_published BOOLEAN NOT NULL DEFAULT FALSE,
      visible_from TIMESTAMPTZ,
      visible_to TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (course_id, order_index),
      UNIQUE (course_id, slug)
    );
  `);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_course_parts_course_pub_order ON course_parts(course_id, is_published, order_index)`);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS course_videos (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      legacy_id INTEGER NOT NULL UNIQUE,
      course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      part_id UUID NOT NULL REFERENCES course_parts(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      vimeo_id TEXT NOT NULL,
      vimeo_url TEXT,
      duration_seconds INTEGER,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_free_preview BOOLEAN NOT NULL DEFAULT FALSE,
      is_published BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (part_id, sort_order)
    );
  `);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_course_videos_course ON course_videos(course_id)`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_course_videos_part ON course_videos(part_id)`);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS course_reviews (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (course_id, user_id)
    );
  `);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_course_reviews_course_updated ON course_reviews(course_id, updated_at DESC)`);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS user_course_part_access (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      course_part_id UUID NOT NULL REFERENCES course_parts(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, course_part_id)
    );
  `);
  await pgPool.query(`ALTER TABLE user_course_part_access ADD COLUMN IF NOT EXISTS access_until TIMESTAMPTZ`);
  // Acces din trial-ul gratuit de 24h: permite vizionarea, dar nu descarcarea resurselor, review-ul sau blocarea cumpararii.
  await pgPool.query(`ALTER TABLE user_course_part_access ADD COLUMN IF NOT EXISTS is_trial BOOLEAN NOT NULL DEFAULT FALSE`);
  await pgPool.query(
    `CREATE INDEX IF NOT EXISTS idx_user_course_part_access_user_course ON user_course_part_access(user_id, course_id)`,
  );
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS user_course_payment_attempts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      course_slug TEXT NOT NULL,
      mode TEXT NOT NULL CHECK (mode IN ('part', 'remaining')),
      part_ids_to_grant UUID[] NOT NULL,
      amount_total NUMERIC(10, 2) NOT NULL,
      amount_subtotal NUMERIC(10, 2),
      amount_discount NUMERIC(10, 2),
      currency TEXT NOT NULL DEFAULT 'RON',
      invoice_lines JSONB NOT NULL,
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
    `CREATE INDEX IF NOT EXISTS idx_user_course_payment_attempts_user_created ON user_course_payment_attempts(user_id, created_at DESC)`,
  );
  await pgPool.query(`ALTER TABLE user_course_payment_attempts ADD COLUMN IF NOT EXISTS discount_code_id UUID`);
  await pgPool.query(`ALTER TABLE user_course_payment_attempts ADD COLUMN IF NOT EXISTS discount_percent_applied SMALLINT`);
  await pgPool.query(`ALTER TABLE user_course_payment_attempts ADD COLUMN IF NOT EXISTS amount_before_discount NUMERIC(10, 2)`);
  await pgPool.query(`ALTER TABLE user_course_payment_attempts ADD COLUMN IF NOT EXISTS discount_label TEXT`);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS courses_legacy_import_log (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      legacy_user_id INTEGER NOT NULL,
      legacy_email TEXT NOT NULL,
      meta JSONB NOT NULL DEFAULT '{}'::jsonb,
      imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pgPool.query(`
    DELETE FROM courses_legacy_import_log a
    USING courses_legacy_import_log b
    WHERE a.legacy_user_id = b.legacy_user_id
      AND (
        a.imported_at > b.imported_at
        OR (a.imported_at = b.imported_at AND a.user_id > b.user_id)
      );
  `);
  await pgPool.query(`
    DELETE FROM courses_legacy_import_log a
    USING courses_legacy_import_log b
    WHERE lower(a.legacy_email) = lower(b.legacy_email)
      AND a.user_id <> b.user_id
      AND (
        a.imported_at > b.imported_at
        OR (a.imported_at = b.imported_at AND a.user_id > b.user_id)
      );
  `);
  await pgPool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_legacy_import_log_legacy_user_id
    ON courses_legacy_import_log (legacy_user_id);
  `);
  await pgPool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_legacy_import_log_legacy_email_lower
    ON courses_legacy_import_log (lower(legacy_email));
  `);
  const modeCheck = await pgPool.query<{ def: string }>(
    `SELECT pg_get_constraintdef(oid) AS def
     FROM pg_constraint
     WHERE conrelid = 'user_course_payment_attempts'::regclass
       AND conname = 'user_course_payment_attempts_mode_check'`,
  );
  if (!modeCheck.rows[0]?.def.includes("legacy_import")) {
    await pgPool.query(`ALTER TABLE user_course_payment_attempts DROP CONSTRAINT IF EXISTS user_course_payment_attempts_mode_check`);
    await pgPool.query(`
      ALTER TABLE user_course_payment_attempts
      ADD CONSTRAINT user_course_payment_attempts_mode_check
      CHECK (mode IN ('part', 'remaining', 'legacy_import'))
    `);
  }
}

export const coursesRouter = Router();

const uploadCourseResourcesZipSchema = z.object({
  file_name: z
    .string()
    .min(3)
    .max(255)
    .refine((name) => /\.zip$/i.test(name), { message: "Doar fisiere ZIP sunt permise." }),
  file_base64: z.string().min(20),
});

async function ensureAdminRole(userId?: string) {
  const roleResult = await pgPool.query<{ role: "student" | "professor" | "admin" }>(
    `SELECT role FROM users WHERE id = $1 LIMIT 1`,
    [userId],
  );
  return roleResult.rows[0]?.role === "admin";
}

async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    next();
  } catch (error) {
    console.error("Failed to verify admin role:", error);
    res.status(500).json({ error: "Internal error", code: "INTERNAL_ERROR" });
  }
}

function courseResourcesZipMeta(row: {
  resources_zip_path: string | null;
  resources_zip_original_name: string | null;
  resources_zip_size_bytes: number | string | null;
  resources_zip_updated_at: string | null;
}) {
  if (!row.resources_zip_path?.trim()) {
    return null;
  }
  return {
    file_name: row.resources_zip_original_name,
    size_bytes: row.resources_zip_size_bytes != null ? Number(row.resources_zip_size_bytes) : null,
    updated_at: row.resources_zip_updated_at,
  };
}

const importLegacyCoursesSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(256),
});

function exameneLegacyImportErrorResponse(error: string): { status: number; code: string; message: string } {
  switch (error) {
    case "invalid_credentials":
      return {
        status: 401,
        code: "INVALID_LEGACY_CREDENTIALS",
        message: "Emailul sau parola contului Zece la Examene sunt gresite. Verifica datele si incearca din nou.",
      };
    case "email_and_password_required":
      return {
        status: 400,
        code: "INVALID_PAYLOAD",
        message: "Emailul si parola sunt obligatorii.",
      };
    case "invalid_json":
      return {
        status: 502,
        code: "LEGACY_API_ERROR",
        message: "Raspuns invalid de la zecelaexamene.ro. Incearca din nou mai tarziu.",
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
        message: "Eroare la exportul de pe zecelaexamene.ro. Incearca din nou mai tarziu.",
      };
    case "import_not_configured":
      return {
        status: 503,
        code: "IMPORT_NOT_CONFIGURED",
        message: "Importul din Zece la Examene nu este configurat pe server.",
      };
    case "legacy_user_already_imported":
      return {
        status: 409,
        code: "LEGACY_USER_ALREADY_IMPORTED",
        message:
          "Acest cont de pe zecelaexamene.ro a fost deja folosit pentru transfer. Fiecare cont vechi poate fi importat o singura data.",
      };
    case "invalid_response":
    case "network_error":
    case "timeout":
      return {
        status: 502,
        code: "LEGACY_API_UNAVAILABLE",
        message: "Nu am putut contacta zecelaexamene.ro. Verifica conexiunea si incearca din nou.",
      };
    default:
      return {
        status: 502,
        code: "LEGACY_IMPORT_FAILED",
        message: "Nu am putut realiza transferul momentan. Te rugam sa incerci din nou sau sa ne contactezi pe WhatsApp.",
      };
  }
}

const upsertReviewSchema = z.object({
  title: z.string().min(3).max(160),
  content: z.string().min(10).max(4000),
  rating: z.number().int().min(1).max(5),
});
const purchasePartSchema = z
  .object({
    partId: z.string().uuid(),
    billingProfile: billingProfileActivateSchema,
    acceptTerms: z.boolean(),
  })
  .refine((data) => data.acceptTerms === true, {
    message: "Trebuie sa accepti termenii si conditiile",
    path: ["acceptTerms"],
  });

const purchaseRemainingSchema = z
  .object({
    billingProfile: billingProfileActivateSchema,
    acceptTerms: z.boolean(),
  })
  .refine((data) => data.acceptTerms === true, {
    message: "Trebuie sa accepti termenii si conditiile",
    path: ["acceptTerms"],
  });

const createCoursePaymentSchema = z
  .discriminatedUnion("mode", [
    z.object({
      mode: z.literal("part"),
      partId: z.string().uuid(),
      billingProfile: billingProfileActivateSchema,
      acceptTerms: z.boolean(),
      discountCode: z.string().trim().max(64).optional(),
    }),
    z.object({
      mode: z.literal("remaining"),
      billingProfile: billingProfileActivateSchema,
      acceptTerms: z.boolean(),
      discountCode: z.string().trim().max(64).optional(),
    }),
  ])
  .refine((data) => data.acceptTerms === true, {
    message: "Trebuie sa accepti termenii si conditiile",
    path: ["acceptTerms"],
  });

const confirmCoursePaymentSchema = z.object({
  attemptId: z.string().uuid(),
});

async function getCourseIdBySlug(slug: string) {
  const courseResult = await pgPool.query<{ id: string }>(
    `SELECT id FROM courses WHERE slug = $1 AND is_published = true LIMIT 1`,
    [slug],
  );
  return courseResult.rows[0]?.id ?? null;
}

function getEffectivePartPrice(part: { sale_price: number | null; price: number | null }) {
  if (part.sale_price != null && Number(part.sale_price) > 0) return Number(part.sale_price);
  return Number(part.price ?? 0);
}

const COURSE_SLUG_BAC = "curs-bacalaureat-informatica-mi";
const COURSE_SLUG_UBB = "curs-admitere-ubb";
const COURSE_SLUG_UB_UNSTPB = "curs-admitere-ub-unstpb";
const COURSE_SLUG_UAIC_TUIASI = "curs-admitere-uaic-tuiasi";

function isBacPracticalModulePart(name: string): boolean {
  const n = name.toLowerCase();
  return /practic|plr|lucrare\s*practic|modul\w*\s*practic|pregatire\s*practic|m3\s*practic/.test(n);
}

/** Preturi fixe pentru cursurile principale (RON); altfel ramane pretul din baza de date. */
export function getCatalogPartPriceRon(
  courseSlug: string,
  part: { name: string; order_index: number; sale_price: number | null; price: number | null },
): number {
  if (courseSlug === COURSE_SLUG_BAC) {
    return isBacPracticalModulePart(part.name) ? 200 : 100;
  }
  if (courseSlug === COURSE_SLUG_UBB || courseSlug === COURSE_SLUG_UB_UNSTPB) {
    return 200;
  }
  if (courseSlug === COURSE_SLUG_UAIC_TUIASI) {
    if (/rezolv/.test(part.name.toLowerCase())) return 150;
    return 200;
  }
  return getEffectivePartPrice(part);
}

/** Partile active ale userului; `paidOnly` exclude accesul din trial-ul gratuit. */
async function getOwnedPartIds(courseId: string, userId: string, { paidOnly = false } = {}) {
  const result = await pgPool.query<{ course_part_id: string }>(
    `SELECT course_part_id
     FROM user_course_part_access
     WHERE course_id = $1
       AND user_id = $2
       AND (access_until IS NULL OR access_until > NOW())
       AND (NOT $3::boolean OR is_trial = false)`,
    [courseId, userId, paidOnly],
  );
  return new Set(result.rows.map((row) => row.course_part_id));
}

/** Linii factura bundle: cate o linie per parte la pretul din catalog, apoi reducerea ca linie separata (pret negativ). */
function buildBundleInvoiceLines(
  courseName: string,
  parts: Array<{ name: string; order_index: number; catalogRon: number }>,
  amountTotalRon: number,
): SmartbillProductLine[] {
  if (parts.length === 0) return [];
  const lines: SmartbillProductLine[] = parts.map((p) => ({
    name: `${courseName} — Partea ${p.order_index}: ${p.name}`,
    priceRon: Number(Number(p.catalogRon).toFixed(2)),
    quantity: 1,
    isService: true,
  }));
  const partsSum = lines.reduce((sum, line) => sum + line.priceRon, 0);
  const targetTotal = Number(amountTotalRon.toFixed(2));
  const discountAmount = Number((partsSum - targetTotal).toFixed(2));
  if (discountAmount > 0.001) {
    lines.push({
      name: "Reducere 25% — bundle parti ramase (acelasi curs)",
      priceRon: -discountAmount,
      quantity: 1,
      isService: true,
    });
  }
  return lines;
}

async function attachPartsAndVideos(courses: any[]) {
  const courseIds = courses.map((row) => row.id);
  const courseSlugById = new Map<string, string>(courses.map((c) => [c.id, String(c.slug ?? "")]));
  const partsResult = courseIds.length
    ? await pgPool.query(
        `SELECT
           id, legacy_id, course_id, slug, name, short_summary, order_index,
           hours, price, sale_price, currency, is_extension, is_published
         FROM course_parts
         WHERE course_id = ANY($1::uuid[]) AND is_published = true
         ORDER BY course_id ASC, order_index ASC`,
        [courseIds],
      )
    : { rows: [] as any[] };

  const partIds = partsResult.rows.map((row) => row.id);
  const videosResult = partIds.length
    ? await pgPool.query(
        `SELECT
           id, legacy_id, course_id, part_id, title, vimeo_id, vimeo_url,
           duration_seconds, sort_order, is_free_preview, is_published
         FROM course_videos
         WHERE part_id = ANY($1::uuid[]) AND is_published = true
         ORDER BY part_id ASC, sort_order ASC`,
        [partIds],
      )
    : { rows: [] as any[] };

  const videosByPart = new Map<string, any[]>();
  for (const video of videosResult.rows) {
    const existing = videosByPart.get(video.part_id) ?? [];
    existing.push(video);
    videosByPart.set(video.part_id, existing);
  }

  const partsByCourse = new Map<string, any[]>();
  for (const part of partsResult.rows) {
    const existing = partsByCourse.get(part.course_id) ?? [];
    const slug = courseSlugById.get(part.course_id) ?? "";
    const catalogRon = getCatalogPartPriceRon(slug, part);
    existing.push({
      ...part,
      price: catalogRon,
      sale_price: null,
      videos: videosByPart.get(part.id) ?? [],
    });
    partsByCourse.set(part.course_id, existing);
  }

  return courses.map((course) => ({
    ...course,
    parts: partsByCourse.get(course.id) ?? [],
  }));
}

coursesRouter.get("/", async (_req, res) => {
  try {
    await ensureCoursesTable();
    const coursesResult = await pgPool.query(
      `SELECT
         id, legacy_id, slug, name, h1, author_name, image_url, preview_video_vimeo_id, preview_video_url, hook,
         price, sale_price, currency, parts_count, hours_total, level, format, language, is_published, order_index
       FROM courses
       WHERE is_published = true
       ORDER BY order_index ASC, updated_at DESC`,
    );
    const payload = await attachPartsAndVideos(coursesResult.rows);
    res.json({ data: payload });
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    res.status(500).json({ error: "Failed to fetch courses", code: "INTERNAL_ERROR" });
  }
});

coursesRouter.get("/me/paid-purchases", requireAuth, async (req, res) => {
  try {
    await ensureCoursesTable();
    const userId = req.user!.id;
    const result = await pgPool.query<{
      id: string;
      course_id: string;
      course_slug: string;
      course_name: string;
      mode: string;
      amount_total: number;
      currency: string;
      part_ids_to_grant: string[];
      paid_at: string | null;
      access_from: string | null;
      access_until: string | null;
      invoice_number: string | null;
    }>(
      `SELECT
         a.id,
         a.course_id,
         a.course_slug,
         c.name AS course_name,
         a.mode,
         a.amount_total::float8 AS amount_total,
         a.currency,
         a.part_ids_to_grant,
         a.paid_at::text AS paid_at,
         (
           SELECT MIN(upa.created_at)::text
           FROM user_course_part_access upa
           WHERE upa.user_id = a.user_id
             AND upa.course_id = a.course_id
             AND upa.course_part_id = ANY(a.part_ids_to_grant)
         ) AS access_from,
         (
           SELECT MAX(upa.access_until)::text
           FROM user_course_part_access upa
           WHERE upa.user_id = a.user_id
             AND upa.course_id = a.course_id
             AND upa.course_part_id = ANY(a.part_ids_to_grant)
         ) AS access_until,
         a.invoice_number
       FROM user_course_payment_attempts a
       JOIN courses c ON c.id = a.course_id
       WHERE a.user_id = $1 AND a.status = 'paid'
       ORDER BY COALESCE(a.paid_at, a.created_at) DESC NULLS LAST`,
      [userId],
    );
    const rows = result.rows.map((row) => ({
      id: row.id,
      course_id: row.course_id,
      course_slug: row.course_slug,
      course_name: row.course_name,
      mode: row.mode,
      parts_count: Array.isArray(row.part_ids_to_grant) ? row.part_ids_to_grant.length : 0,
      amount_total: row.amount_total,
      currency: row.currency,
      paid_at: row.paid_at,
      access_from: row.access_from ?? row.paid_at,
      access_until: row.access_until,
      invoice_number: row.invoice_number,
      has_invoice: Boolean(row.invoice_number),
    }));
    res.json({ data: rows });
  } catch (error) {
    console.error("Failed to fetch course purchase history:", error);
    res.status(500).json({ error: "Failed to fetch purchase history", code: "INTERNAL_ERROR" });
  }
});

coursesRouter.get("/me/paid-purchases/:attemptId/invoice", requireAuth, async (req, res) => {
  try {
    await ensureCoursesTable();
    const userId = req.user!.id;
    const attemptId = String(req.params.attemptId ?? "");
    const attemptResult = await pgPool.query<{
      invoice_number: string | null;
      invoice_local_path: string | null;
    }>(
      `SELECT invoice_number, invoice_local_path
       FROM user_course_payment_attempts
       WHERE id = $1 AND user_id = $2 AND status = 'paid'
       LIMIT 1`,
      [attemptId, userId],
    );
    const attempt = attemptResult.rows[0];
    if (!attempt || !attempt.invoice_number) {
      res.status(404).json({ error: "Factura nu este disponibila", code: "INVOICE_NOT_AVAILABLE" });
      return;
    }
    if (attempt.invoice_local_path) {
      try {
        const localBuffer = await fs.readFile(attempt.invoice_local_path);
        if (localBuffer.length >= 200 && localBuffer.subarray(0, 5).toString() === "%PDF-") {
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${sanitizeInvoiceFileName(attempt.invoice_number)}.pdf"`,
          );
          res.status(200).send(localBuffer);
          return;
        }
      } catch {
        // fallback SmartBill
      }
    }
    const pdf = await downloadSmartbillInvoicePdf(attempt.invoice_number);
    const savedPath = await persistInvoicePdfToDirectory(COURSE_INVOICES_DIR, attempt.invoice_number, pdf);
    await pgPool.query(
      `UPDATE user_course_payment_attempts SET invoice_local_path = $2, updated_at = NOW() WHERE id = $1`,
      [attemptId, savedPath],
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${pdf.fileName}"`);
    res.status(200).send(pdf.buffer);
  } catch (error) {
    console.error("Failed to download course invoice:", error);
    res.status(500).json({ error: "Failed to download invoice", code: "INTERNAL_ERROR" });
  }
});

coursesRouter.get("/import-legacy-courses/status", requireAuth, async (req, res) => {
  try {
    await ensureCoursesTable();
    const log = await getExameneLegacyImportLog(req.user!.id);
    res.json({
      data: {
        configured: isLegacyCoursesImportConfigured(),
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
    console.error("Failed to fetch legacy courses import status:", error);
    res.status(500).json({ error: "Failed to fetch legacy courses import status", code: "INTERNAL_ERROR" });
  }
});

coursesRouter.post("/import-legacy-courses", requireAuth, async (req, res) => {
  try {
    await ensureCoursesTable();
    if (!isLegacyCoursesImportConfigured()) {
      res.status(503).json({
        error: "Import not configured",
        code: "IMPORT_NOT_CONFIGURED",
        message: "Importul din Zece la Examene nu este configurat pe server.",
      });
      return;
    }

    const parsed = importLegacyCoursesSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
      return;
    }

    const exported = await fetchLegacyExameneCourses(parsed.data.email, parsed.data.password);
    if (!exported.success) {
      const mapped = exameneLegacyImportErrorResponse(exported.error);
      res.status(mapped.status).json({ error: mapped.message, code: mapped.code, message: mapped.message });
      return;
    }

    try {
      await assertExameneLegacyUserImportAllowed(req.user!.id, exported.user.id, exported.user.email);
    } catch (claimError) {
      if (claimError instanceof ExameneLegacyUserAlreadyImportedError) {
        const mapped = exameneLegacyImportErrorResponse(claimError.message);
        res.status(mapped.status).json({ error: mapped.message, code: mapped.code, message: mapped.message });
        return;
      }
      throw claimError;
    }

    const stats = await importLegacyExameneCourses(req.user!.id, exported);

    if (stats.parts_granted === 0 && stats.parts_updated === 0) {
      res.json({
        data: {
          stats,
          meta: exported.meta,
          message:
            "Contul a fost verificat, dar nu am gasit cursuri active de transferat. Daca ai cumparat un curs si crezi ca este o eroare, contacteaza-ne pe WhatsApp.",
        },
      });
      return;
    }

    res.json({
      data: {
        stats,
        meta: exported.meta,
        message:
          "Transfer realizat cu succes! Am importat cursurile disponibile din contul tau Zece la Examene. Accesul tau a fost pastrat pana la data de expirare existenta.",
      },
    });
  } catch (error) {
    if (error instanceof ExameneLegacyUserAlreadyImportedError) {
      const mapped = exameneLegacyImportErrorResponse(error.message);
      res.status(mapped.status).json({ error: mapped.message, code: mapped.code, message: mapped.message });
      return;
    }
    console.error("Failed to import legacy examene courses:", error);
    res.status(500).json({ error: "Failed to import legacy courses", code: "INTERNAL_ERROR" });
  }
});

coursesRouter.get("/admin/list", requireAuth, requireAdmin, async (_req, res) => {
  try {
    await ensureCoursesTable();
    const result = await pgPool.query<{
      id: string;
      slug: string;
      name: string;
      is_published: boolean;
      resources_zip_path: string | null;
      resources_zip_original_name: string | null;
      resources_zip_size_bytes: number | string | null;
      resources_zip_updated_at: string | null;
    }>(
      `SELECT
         id, slug, name, is_published,
         resources_zip_path, resources_zip_original_name,
         resources_zip_size_bytes, resources_zip_updated_at::text
       FROM courses
       ORDER BY order_index ASC, name ASC`,
    );
    res.json({
      data: result.rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        is_published: row.is_published,
        resources_zip: courseResourcesZipMeta(row),
      })),
    });
  } catch (error) {
    console.error("Failed to list courses for admin:", error);
    res.status(500).json({ error: "Failed to list courses", code: "INTERNAL_ERROR" });
  }
});

coursesRouter.post(
  "/admin/:courseId/resources-zip",
  requireAuth,
  requireAdmin,
  validateBody(uploadCourseResourcesZipSchema),
  async (req, res) => {
    try {
      await ensureCoursesTable();
      const courseId = String(req.params.courseId ?? "");
      const courseResult = await pgPool.query<{ id: string; slug: string; resources_zip_path: string | null }>(
        `SELECT id, slug, resources_zip_path FROM courses WHERE id = $1 LIMIT 1`,
        [courseId],
      );
      const course = courseResult.rows[0];
      if (!course) {
        res.status(404).json({ error: "Course not found", code: "NOT_FOUND" });
        return;
      }

      const payload = req.body as z.infer<typeof uploadCourseResourcesZipSchema>;
      const safeName = sanitizeZipFileName(payload.file_name);
      const buffer = decodeUploadBase64(payload.file_base64);
      validateZipBuffer(buffer);

      const storedPath = await persistCourseResourcesZip(course.id, buffer);
      await removeCourseResourcesZipFile(
        course.resources_zip_path && course.resources_zip_path !== storedPath ? course.resources_zip_path : null,
      );

      const displayName = buildStoredZipFileName(course.slug, safeName);
      await pgPool.query(
        `UPDATE courses
         SET resources_zip_path = $2,
             resources_zip_original_name = $3,
             resources_zip_size_bytes = $4,
             resources_zip_updated_at = NOW(),
             updated_at = NOW()
         WHERE id = $1`,
        [course.id, storedPath, displayName, buffer.length],
      );

      res.json({
        data: {
          uploaded: true,
          file_name: displayName,
          size_bytes: buffer.length,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload resources zip";
      const isValidation = error instanceof Error && /ZIP|zip|permise|invalid/i.test(message);
      res.status(isValidation ? 400 : 500).json({
        error: message,
        code: isValidation ? "INVALID_ZIP" : "INTERNAL_ERROR",
      });
    }
  },
);

coursesRouter.delete("/admin/:courseId/resources-zip", requireAuth, requireAdmin, async (req, res) => {
  try {
    await ensureCoursesTable();
    const courseId = String(req.params.courseId ?? "");
    const courseResult = await pgPool.query<{ id: string; resources_zip_path: string | null }>(
      `SELECT id, resources_zip_path FROM courses WHERE id = $1 LIMIT 1`,
      [courseId],
    );
    const course = courseResult.rows[0];
    if (!course) {
      res.status(404).json({ error: "Course not found", code: "NOT_FOUND" });
      return;
    }

    await removeCourseResourcesZipFile(course.resources_zip_path);
    await pgPool.query(
      `UPDATE courses
       SET resources_zip_path = NULL,
           resources_zip_original_name = NULL,
           resources_zip_size_bytes = NULL,
           resources_zip_updated_at = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [course.id],
    );

    res.json({ data: { deleted: true } });
  } catch (error) {
    console.error("Failed to delete course resources zip:", error);
    res.status(500).json({ error: "Failed to delete resources zip", code: "INTERNAL_ERROR" });
  }
});

coursesRouter.get("/:slug/resources-zip", requireAuth, async (req, res) => {
  try {
    await ensureCoursesTable();
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const courseResult = await pgPool.query<{
      id: string;
      resources_zip_path: string | null;
      resources_zip_original_name: string | null;
    }>(
      `SELECT id, resources_zip_path, resources_zip_original_name
       FROM courses
       WHERE slug = $1 AND is_published = true
       LIMIT 1`,
      [slug],
    );
    const course = courseResult.rows[0];
    if (!course?.resources_zip_path) {
      res.status(404).json({ error: "Resursele cursului nu sunt disponibile", code: "NOT_FOUND" });
      return;
    }

    const ownedPartIds = await getOwnedPartIds(course.id, req.user!.id, { paidOnly: true });
    if (ownedPartIds.size === 0) {
      res.status(403).json({ error: "Resursele sunt disponibile dupa achizitionarea cursului", code: "FORBIDDEN" });
      return;
    }

    const buffer = await readCourseResourcesZip(course.resources_zip_path);
    validateZipBuffer(buffer);

    const downloadName =
      course.resources_zip_original_name?.trim() || buildStoredZipFileName(slug, "resurse.zip");
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${sanitizeInvoiceFileName(downloadName)}"`);
    res.status(200).send(buffer);
  } catch (error) {
    console.error("Failed to download course resources zip:", error);
    res.status(500).json({ error: "Failed to download resources zip", code: "INTERNAL_ERROR" });
  }
});

coursesRouter.get("/:slug", async (req, res) => {
  try {
    await ensureCoursesTable();
    const { slug } = req.params;
    const courseResult = await pgPool.query(
      `SELECT
         id, legacy_id, slug, name, h1, author_name, image_url, preview_video_vimeo_id, preview_video_url, resources_url, hook,
         target_audience, content_summary, requirements, outcomes, bonuses, content_html,
         price, sale_price, currency, parts_count, hours_total, level, format, language, is_published, order_index
       FROM courses
       WHERE slug = $1 AND is_published = true
       LIMIT 1`,
      [slug],
    );
    if (courseResult.rowCount === 0) {
      return res.status(404).json({ error: "Course not found", code: "NOT_FOUND" });
    }
    const [course] = await attachPartsAndVideos(courseResult.rows);
    return res.json({ data: course });
  } catch (error) {
    console.error("Failed to fetch course by slug:", error);
    return res.status(500).json({ error: "Failed to fetch course", code: "INTERNAL_ERROR" });
  }
});

coursesRouter.get("/:slug/reviews/me", requireAuth, async (req, res) => {
  try {
    await ensureCoursesTable();
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const courseId = await getCourseIdBySlug(slug);
    if (!courseId) {
      return res.status(404).json({ error: "Course not found", code: "NOT_FOUND" });
    }
    const ownedPartIds = await getOwnedPartIds(courseId, req.user!.id, { paidOnly: true });
    if (ownedPartIds.size === 0) {
      return res.status(403).json({ error: "Doar elevii care au cumparat cursul pot lasa review", code: "FORBIDDEN" });
    }
    const result = await pgPool.query(
      `SELECT id, author_name, title, content, rating, created_at, updated_at
       FROM course_reviews
       WHERE course_id = $1 AND user_id = $2
       LIMIT 1`,
      [courseId, req.user?.id],
    );
    return res.json({ data: { can_review: true, review: result.rows[0] ?? null } });
  } catch (error) {
    console.error("Failed to fetch my course review:", error);
    return res.status(500).json({ error: "Failed to fetch review", code: "INTERNAL_ERROR" });
  }
});

coursesRouter.post("/:slug/reviews/me", requireAuth, validateBody(upsertReviewSchema), async (req, res) => {
  try {
    await ensureCoursesTable();
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const courseId = await getCourseIdBySlug(slug);
    if (!courseId) {
      return res.status(404).json({ error: "Course not found", code: "NOT_FOUND" });
    }
    const ownedPartIds = await getOwnedPartIds(courseId, req.user!.id, { paidOnly: true });
    if (ownedPartIds.size === 0) {
      return res.status(403).json({ error: "Doar elevii care au cumparat cursul pot lasa review", code: "FORBIDDEN" });
    }
    const userResult = await pgPool.query<{ username: string; full_name: string | null }>(
      `SELECT username, full_name FROM users WHERE id = $1 LIMIT 1`,
      [req.user?.id],
    );
    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
    }
    const authorName = user.full_name?.trim() || user.username;
    const { title, content, rating } = req.body;
    const result = await pgPool.query(
      `INSERT INTO course_reviews (course_id, user_id, author_name, title, content, rating, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (course_id, user_id)
       DO UPDATE SET author_name = EXCLUDED.author_name, title = EXCLUDED.title, content = EXCLUDED.content, rating = EXCLUDED.rating, updated_at = NOW()
       RETURNING id, author_name, title, content, rating, created_at, updated_at`,
      [courseId, req.user?.id, authorName, title, content, rating],
    );
    return res.json({ data: result.rows[0] });
  } catch (error) {
    console.error("Failed to save course review:", error);
    return res.status(500).json({ error: "Failed to save review", code: "INTERNAL_ERROR" });
  }
});

coursesRouter.delete("/:slug/reviews/me", requireAuth, async (req, res) => {
  try {
    await ensureCoursesTable();
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const courseId = await getCourseIdBySlug(slug);
    if (!courseId) {
      return res.status(404).json({ error: "Course not found", code: "NOT_FOUND" });
    }
    await pgPool.query(
      `DELETE FROM course_reviews
       WHERE course_id = $1 AND user_id = $2`,
      [courseId, req.user!.id],
    );
    return res.json({ data: { deleted: true } });
  } catch (error) {
    console.error("Failed to delete course review:", error);
    return res.status(500).json({ error: "Failed to delete review", code: "INTERNAL_ERROR" });
  }
});

coursesRouter.get("/:slug/access", requireAuth, async (req, res) => {
  try {
    await ensureCoursesTable();
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const courseId = await getCourseIdBySlug(slug);
    if (!courseId) {
      return res.status(404).json({ error: "Course not found", code: "NOT_FOUND" });
    }
    const partsResult = await pgPool.query<{
      id: string;
      name: string;
      order_index: number;
      sale_price: number | null;
      price: number | null;
    }>(
      `SELECT id, name, order_index, sale_price, price
       FROM course_parts
       WHERE course_id = $1 AND is_published = true`,
      [courseId],
    );
    const accessRows = await pgPool.query<{ course_part_id: string; access_until: string | null; is_trial: boolean }>(
      `SELECT course_part_id, access_until::text, is_trial
       FROM user_course_part_access
       WHERE course_id = $1
         AND user_id = $2
         AND (access_until IS NULL OR access_until > NOW())`,
      [courseId, req.user!.id],
    );
    const ownedPartIds = new Set(accessRows.rows.map((row) => row.course_part_id));
    const paidPartIds = new Set(accessRows.rows.filter((row) => !row.is_trial).map((row) => row.course_part_id));
    const courseResourcesResult = await pgPool.query<{
      resources_zip_path: string | null;
      resources_zip_original_name: string | null;
      resources_zip_size_bytes: number | string | null;
      resources_zip_updated_at: string | null;
    }>(
      `SELECT resources_zip_path, resources_zip_original_name, resources_zip_size_bytes, resources_zip_updated_at::text
       FROM courses
       WHERE id = $1
       LIMIT 1`,
      [courseId],
    );
    const resourcesZipMeta = courseResourcesZipMeta(courseResourcesResult.rows[0] ?? {
      resources_zip_path: null,
      resources_zip_original_name: null,
      resources_zip_size_bytes: null,
      resources_zip_updated_at: null,
    });
    const remainingParts = partsResult.rows.filter((part) => !paidPartIds.has(part.id));
    const remainingSubtotal = remainingParts.reduce(
      (sum, part) => sum + getCatalogPartPriceRon(slug, part),
      0,
    );
    const remainingDiscount = remainingSubtotal * 0.25;
    const remainingTotal = Math.max(0, remainingSubtotal - remainingDiscount);
    return res.json({
      data: {
        owned_part_ids: [...ownedPartIds],
        owned_part_access: accessRows.rows.map((row) => ({
          part_id: row.course_part_id,
          access_until: row.access_until,
        })),
        access_duration_months: 12,
        trial_part_ids: accessRows.rows.filter((row) => row.is_trial).map((row) => row.course_part_id),
        has_course_access: ownedPartIds.size > 0,
        can_review: paidPartIds.size > 0,
        resources_zip: paidPartIds.size > 0 ? resourcesZipMeta : null,
        remaining: {
          parts_count: remainingParts.length,
          subtotal: Number(remainingSubtotal.toFixed(2)),
          discount: Number(remainingDiscount.toFixed(2)),
          total: Number(remainingTotal.toFixed(2)),
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch course access:", error);
    return res.status(500).json({ error: "Failed to fetch course access", code: "INTERNAL_ERROR" });
  }
});

coursesRouter.post("/:slug/create-payment", requireAuth, validateBody(createCoursePaymentSchema), async (req, res) => {
  try {
    await ensureCoursesTable();
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const courseRow = await pgPool.query<{ id: string; name: string }>(
      `SELECT id, name FROM courses WHERE slug = $1 AND is_published = true LIMIT 1`,
      [slug],
    );
    const course = courseRow.rows[0];
    if (!course) {
      return res.status(404).json({ error: "Course not found", code: "NOT_FOUND" });
    }
    const courseId = course.id;
    const userId = req.user!.id;
    const userResult = await pgPool.query<{ email: string }>(`SELECT email FROM users WHERE id = $1 LIMIT 1`, [userId]);
    const userEmail = userResult.rows[0]?.email;
    if (!userEmail) {
      return res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
    }

    const body = req.body as z.infer<typeof createCoursePaymentSchema>;
    // Partile deblocate doar din trial se pot cumpara normal.
    const ownedPartIds = await getOwnedPartIds(courseId, userId, { paidOnly: true });

    let partIdsToGrant: string[] = [];
    let amountTotal = 0;
    let amountSubtotal: number | null = null;
    let amountDiscount: number | null = null;
    let invoiceLines: SmartbillProductLine[] = [];
    let description = "";

    if (body.mode === "part") {
      const partResult = await pgPool.query<{
        id: string;
        name: string;
        order_index: number;
        sale_price: number | null;
        price: number | null;
      }>(
        `SELECT id, name, order_index, sale_price, price
         FROM course_parts
         WHERE id = $1 AND course_id = $2 AND is_published = true
         LIMIT 1`,
        [body.partId, courseId],
      );
      const part = partResult.rows[0];
      if (!part) {
        return res.status(404).json({ error: "Course part not found", code: "NOT_FOUND" });
      }
      if (ownedPartIds.has(part.id)) {
        return res.status(400).json({ error: "Detii deja aceasta parte", code: "ALREADY_OWNED" });
      }
      const priceRon = getCatalogPartPriceRon(slug, part);
      if (priceRon <= 0) {
        return res.status(400).json({ error: "Partea nu are pret configurat", code: "INVALID_PRICE" });
      }
      partIdsToGrant = [part.id];
      amountTotal = Number(priceRon.toFixed(2));
      invoiceLines = [
        {
          name: `${course.name} — Partea ${part.order_index}: ${part.name}`,
          priceRon: amountTotal,
          quantity: 1,
          isService: true,
        },
      ];
      description = `${course.name} — partea ${part.order_index}`.slice(0, 240);
    } else {
      const partsResult = await pgPool.query<{
        id: string;
        name: string;
        order_index: number;
        sale_price: number | null;
        price: number | null;
      }>(
        `SELECT id, name, order_index, sale_price, price
         FROM course_parts
         WHERE course_id = $1 AND is_published = true
         ORDER BY order_index ASC`,
        [courseId],
      );
      const remainingParts = partsResult.rows.filter((p) => !ownedPartIds.has(p.id));
      if (remainingParts.length === 0) {
        return res.status(400).json({ error: "Nu mai sunt parti de cumparat", code: "NOTHING_TO_BUY" });
      }
      const subtotal = remainingParts.reduce((sum, p) => sum + getCatalogPartPriceRon(slug, p), 0);
      const discount = subtotal * 0.25;
      const total = Math.max(0, subtotal - discount);
      amountSubtotal = Number(subtotal.toFixed(2));
      amountDiscount = Number(discount.toFixed(2));
      amountTotal = Number(total.toFixed(2));
      if (amountTotal <= 0) {
        return res.status(400).json({ error: "Suma de plata invalida", code: "INVALID_PRICE" });
      }
      partIdsToGrant = remainingParts.map((p) => p.id);
      const catalogParts = remainingParts.map((p) => ({
        name: p.name,
        order_index: p.order_index,
        catalogRon: getCatalogPartPriceRon(slug, p),
      }));
      invoiceLines = buildBundleInvoiceLines(course.name, catalogParts, amountTotal);
      description = `${course.name} — parti ramase (${remainingParts.length})`.slice(0, 240);
    }

    let discountCodeId: string | null = null;
    let discountPercentApplied: number | null = null;
    let amountBeforeDiscount: number | null = null;
    let discountLabel: string | null = null;

    const rawDiscount = body.discountCode?.trim();
    if (rawDiscount) {
      const resolved = await resolveActiveDiscountCode(pgPool, rawDiscount, "courses");
      if (!resolved.ok) {
        return res.status(400).json({ error: resolved.error, code: "INVALID_DISCOUNT_CODE" });
      }
      const percent = resolved.row.percent_off;
      const beforePromo = Number(amountTotal.toFixed(2));
      const afterPromo = applyPercentDiscount(beforePromo, percent);
      amountBeforeDiscount = beforePromo;
      discountPercentApplied = percent;
      discountCodeId = resolved.row.id;
      discountLabel = `${resolved.row.code} (-${percent}%)`;
      const suffix = ` | Cod reducere ${resolved.row.code} (-${percent}%). Lista: ${beforePromo.toFixed(2)} RON, platit: ${afterPromo.toFixed(2)} RON`;
      if (body.mode === "part" && invoiceLines.length === 1) {
        const line0 = invoiceLines[0];
        invoiceLines = [
          {
            ...line0,
            name: `${line0.name}${suffix}`.slice(0, 500),
            priceRon: afterPromo,
          },
        ];
      } else {
        invoiceLines = [
          {
            name: `${course.name} — Acces parti ramase (${partIdsToGrant.length})${suffix}`.slice(0, 500),
            priceRon: afterPromo,
            quantity: 1,
            isService: true,
          },
        ];
      }
      amountTotal = afterPromo;
    }

    const client = await pgPool.connect();
    let attemptId = "";
    try {
      await client.query("BEGIN");
      await persistUserBillingProfile(userId, body.billingProfile, client);
      const attemptInsert = await client.query<{ id: string }>(
        `INSERT INTO user_course_payment_attempts (
           user_id, course_id, course_slug, mode, part_ids_to_grant,
           amount_total, amount_subtotal, amount_discount, currency, invoice_lines,
           status, billing_snapshot, terms_accepted_at, updated_at,
           discount_code_id, discount_percent_applied, amount_before_discount, discount_label
         )
         VALUES ($1, $2, $3, $4, $5::uuid[], $6, $7, $8, $9, $10::jsonb, 'pending', $11::jsonb, NOW(), NOW(),
           $12, $13, $14, $15)
         RETURNING id`,
        [
          userId,
          courseId,
          slug,
          body.mode,
          partIdsToGrant,
          amountTotal,
          amountSubtotal,
          amountDiscount,
          "RON",
          JSON.stringify(invoiceLines),
          JSON.stringify(body.billingProfile),
          discountCodeId,
          discountPercentApplied,
          amountBeforeDiscount,
          discountLabel,
        ],
      );
      attemptId = attemptInsert.rows[0]?.id ?? "";
      if (!attemptId) {
        throw new Error("Failed to create payment attempt");
      }

      if (amountTotal <= 0) {
        for (const partId of partIdsToGrant) {
          await client.query(
            `INSERT INTO user_course_part_access (user_id, course_id, course_part_id, access_until)
             VALUES ($1, $2, $3, NOW() + INTERVAL '12 months')
             ON CONFLICT (user_id, course_part_id)
             DO UPDATE SET access_until = EXCLUDED.access_until, is_trial = FALSE`,
            [userId, courseId, partId],
          );
        }
        await client.query(
          `UPDATE user_course_payment_attempts
           SET status = 'paid', paid_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [attemptId],
        );
        if (discountCodeId) {
          await incrementDiscountCodeUses(client, discountCodeId);
        }
        await client.query("COMMIT");
        return res.json({
          data: {
            attempt_id: attemptId,
            checkout_url: null,
            direct_paid: true,
          },
        });
      }

      const redirectUrl = `${getAppBaseUrl().replace(/\/$/, "")}/cursuri/${encodeURIComponent(slug)}?payment=success&attempt=${encodeURIComponent(attemptId)}`;
      const { orderId, checkoutUrl } = await revolutCreateOrder({
        amountCents: Math.round(amountTotal * 100),
        currency: "RON",
        description,
        redirectUrl,
        customer: {
          email: userEmail,
          name: `${body.billingProfile.firstName} ${body.billingProfile.lastName}`.trim(),
          phone: body.billingProfile.phone || undefined,
        },
        metadata: {
          attempt_id: attemptId,
          course_slug: slug,
          user_id: userId,
          mode: body.mode,
        },
      });

      await client.query(
        `UPDATE user_course_payment_attempts
         SET revolut_order_id = $2, revolut_checkout_url = $3, updated_at = NOW()
         WHERE id = $1`,
        [attemptId, orderId, checkoutUrl],
      );

      await client.query("COMMIT");
      return res.json({
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
    console.error("Failed to create course payment:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create payment",
      code: "INTERNAL_ERROR",
    });
  }
});

coursesRouter.post("/:slug/confirm-payment", async (req, res) => {
  try {
    await ensureCoursesTable();
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const parsed = confirmCoursePaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
    }
    const attemptResult = await pgPool.query<{
      id: string;
      user_id: string;
      course_id: string;
      course_slug: string;
      mode: string;
      part_ids_to_grant: string[];
      amount_total: number;
      status: string;
      revolut_order_id: string | null;
      invoice_number: string | null;
      invoice_url: string | null;
      paid_at: string | null;
      billing_snapshot: z.infer<typeof billingProfileActivateSchema>;
      invoice_lines: SmartbillProductLine[];
      discount_code_id: string | null;
    }>(
      `SELECT
         id,
         user_id,
         course_id,
         course_slug,
         mode,
         part_ids_to_grant,
         amount_total::float8 AS amount_total,
         status,
         revolut_order_id,
         invoice_number,
         invoice_url,
         paid_at::text,
         billing_snapshot,
         invoice_lines,
         discount_code_id
       FROM user_course_payment_attempts
       WHERE id = $1
         AND course_slug = $2
       LIMIT 1`,
      [parsed.data.attemptId, slug],
    );
    const attempt = attemptResult.rows[0];
    if (!attempt) {
      return res.status(404).json({ error: "Payment attempt not found", code: "NOT_FOUND" });
    }
    if (attempt.course_slug !== slug) {
      return res.status(404).json({ error: "Payment attempt not found", code: "NOT_FOUND" });
    }
    const userId = attempt.user_id;

    if (attempt.status === "paid") {
      const grantedPartIds = Array.isArray(attempt.part_ids_to_grant)
        ? (attempt.part_ids_to_grant as string[]).filter(Boolean)
        : [];
      return res.json({
        data: {
          ok: true,
          payment_status: "paid",
          purchase: purchaseTrackingPayload(attempt.id, `${attempt.course_slug}:${attempt.mode}`, Number(attempt.amount_total)),
          invoice_number: attempt.invoice_number,
          invoice_url: attempt.invoice_url,
          granted_part_ids: grantedPartIds,
          local_redirect_url: `http://localhost:3000/cursuri/${encodeURIComponent(slug)}?payment=done`,
        },
      });
    }
    if (!attempt.revolut_order_id) {
      return res.status(400).json({ error: "Missing Revolut order id", code: "MISSING_ORDER_ID" });
    }

    const revolutOrder = await revolutFetchOrder(attempt.revolut_order_id);
    if (!revolutOrder.isPaid) {
      return res.json({
        data: {
          ok: false,
          payment_status: "pending",
          revolut_status: revolutOrder.rawState,
        },
      });
    }

    const userEmailResult = await pgPool.query<{ email: string }>(`SELECT email FROM users WHERE id = $1 LIMIT 1`, [userId]);
    const userEmail = userEmailResult.rows[0]?.email ?? "";

    const client = await pgPool.connect();
    let invoiceNumber: string | null = null;
    let invoiceUrl: string | null = null;
    let invoiceLocalPath: string | null = null;
    let courseThankYou: { billing: z.infer<typeof billingProfileActivateSchema>; amountTotal: number } | null = null;
    let grantedPartIdsOut: string[] = [];
    try {
      await client.query("BEGIN");
      const locked = await client.query<{
        status: string;
        billing_snapshot: z.infer<typeof billingProfileActivateSchema>;
        invoice_lines: SmartbillProductLine[];
        part_ids_to_grant: string[];
        invoice_number: string | null;
        invoice_url: string | null;
        amount_total: number;
        discount_code_id: string | null;
      }>(
        `SELECT status, billing_snapshot, invoice_lines, part_ids_to_grant, invoice_number, invoice_url,
                amount_total::float8 AS amount_total, discount_code_id
         FROM user_course_payment_attempts
         WHERE id = $1 AND user_id = $2
         FOR UPDATE`,
        [attempt.id, userId],
      );
      const lockedRow = locked.rows[0];
      if (!lockedRow) {
        await client.query("ROLLBACK").catch(() => {});
        return res.status(404).json({ error: "Payment attempt not found", code: "NOT_FOUND" });
      }
      if (lockedRow.status === "paid") {
        grantedPartIdsOut = Array.isArray(lockedRow.part_ids_to_grant)
          ? (lockedRow.part_ids_to_grant as string[]).filter(Boolean)
          : [];
        await client.query("COMMIT");
        return res.json({
          data: {
            ok: true,
            payment_status: "paid",
            purchase: purchaseTrackingPayload(attempt.id, `${attempt.course_slug}:${attempt.mode}`, Number(attempt.amount_total)),
            invoice_number: lockedRow.invoice_number,
            invoice_url: lockedRow.invoice_url,
            granted_part_ids: grantedPartIdsOut,
            local_redirect_url: `http://localhost:3000/cursuri/${encodeURIComponent(slug)}?payment=done`,
          },
        });
      }

      const grantedPartIds = Array.isArray(lockedRow.part_ids_to_grant)
        ? (lockedRow.part_ids_to_grant as string[]).filter(Boolean)
        : [];
      if (grantedPartIds.length === 0) {
        await client.query("ROLLBACK").catch(() => {});
        console.error("[courses] confirm-payment: empty part_ids_to_grant for attempt", attempt.id);
        return res.status(500).json({ error: "Invalid payment attempt (no parts)", code: "INVALID_ATTEMPT" });
      }
      grantedPartIdsOut = grantedPartIds;

      const lines = Array.isArray(lockedRow.invoice_lines)
        ? (lockedRow.invoice_lines as SmartbillProductLine[])
        : [];
      const skipInvoice = Number(lockedRow.amount_total) <= 0.001;
      if (!skipInvoice) {
        const invoice = await issueSmartbillInvoiceWithProducts({
          billingProfile: lockedRow.billing_snapshot,
          userEmail,
          products: lines.map((line) => ({
            name: line.name,
            priceRon: Number(line.priceRon),
            quantity: line.quantity ?? 1,
            isService: line.isService ?? true,
          })),
        });
        invoiceNumber = invoice.invoiceNumber;
        invoiceUrl = invoice.invoiceUrl;
        if (invoiceNumber) {
          try {
            const invoicePdf = await downloadSmartbillInvoicePdf(invoiceNumber);
            invoiceLocalPath = await persistInvoicePdfToDirectory(COURSE_INVOICES_DIR, invoiceNumber, invoicePdf);
          } catch (invoicePersistError) {
            console.error("Failed to persist local course invoice pdf:", invoicePersistError);
          }
        }
      }

      for (const partId of grantedPartIds) {
        await client.query(
          `INSERT INTO user_course_part_access (user_id, course_id, course_part_id, access_until)
           VALUES ($1, $2, $3, NOW() + INTERVAL '12 months')
           ON CONFLICT (user_id, course_part_id)
           DO UPDATE SET access_until = EXCLUDED.access_until, is_trial = FALSE`,
          [userId, attempt.course_id, partId],
        );
      }

      await client.query(
        `UPDATE user_course_payment_attempts
         SET status = 'paid',
             paid_at = NOW(),
             invoice_number = $2,
             invoice_url = $3,
             invoice_local_path = $4,
             invoice_issued_at = $5,
             updated_at = NOW()
         WHERE id = $1`,
        [attempt.id, invoiceNumber, invoiceUrl, invoiceLocalPath, invoiceNumber ? new Date().toISOString() : null],
      );

      if (lockedRow.discount_code_id) {
        await incrementDiscountCodeUses(client, lockedRow.discount_code_id);
      }

      courseThankYou = { billing: lockedRow.billing_snapshot, amountTotal: Number(lockedRow.amount_total) };

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    if (courseThankYou) {
      void recordConversion({
        kind: "purchase",
        flow: "curs",
        refId: attempt.id,
        userId,
        productCode: `${attempt.course_slug}:${attempt.mode}`,
        valueRon: courseThankYou.amountTotal,
        pagePath: `/cursuri/${attempt.course_slug}`,
      });
    }

    if (courseThankYou && userEmail.includes("@")) {
      const appBase = getAppBaseUrl().replace(/\/$/, "") || "https://www.zecelainfo.ro";
      const courseTitleResult = await pgPool.query<{ name: string }>(`SELECT name FROM courses WHERE id = $1 LIMIT 1`, [
        attempt.course_id,
      ]);
      const courseTitle = courseTitleResult.rows[0]?.name?.trim() || slug;
      void sendPurchaseThankYouEmail({
        to: userEmail,
        customerFirstName: courseThankYou.billing.firstName,
        purchaseLabel: `Curs — ${courseTitle}`,
        amountRon: courseThankYou.amountTotal,
        currency: "RON",
        invoiceNumber,
        invoiceUrl,
        invoicePdfPath: invoiceLocalPath,
        primaryCtaPath: `/cursuri/${encodeURIComponent(slug)}`,
        appBaseUrl: appBase,
      }).catch((err) => console.error("[courses] thank-you email failed:", err));
    }

    return res.json({
      data: {
        ok: true,
        payment_status: "paid",
        purchase: purchaseTrackingPayload(attempt.id, `${attempt.course_slug}:${attempt.mode}`, Number(attempt.amount_total)),
        invoice_number: invoiceNumber,
        invoice_url: invoiceUrl,
        granted_part_ids: grantedPartIdsOut,
        local_redirect_url: `http://localhost:3000/cursuri/${encodeURIComponent(slug)}?payment=done`,
      },
    });
  } catch (error) {
    console.error("Failed to confirm course payment:", error);
    return res.status(500).json({ error: "Failed to confirm payment", code: "INTERNAL_ERROR" });
  }
});

coursesRouter.post("/:slug/purchase-part", requireAuth, validateBody(purchasePartSchema), async (_req, res) => {
  return res.status(402).json({
    error: "Plata se face prin Revolut din pagina cursului.",
    code: "PAYMENT_REQUIRED",
  });
});

coursesRouter.post("/:slug/purchase-remaining", requireAuth, validateBody(purchaseRemainingSchema), async (_req, res) => {
  return res.status(402).json({
    error: "Plata se face prin Revolut din pagina cursului.",
    code: "PAYMENT_REQUIRED",
  });
});

coursesRouter.get("/:slug/reviews", async (req, res) => {
  try {
    await ensureCoursesTable();
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const courseId = await getCourseIdBySlug(slug);
    if (!courseId) {
      return res.status(404).json({ error: "Course not found", code: "NOT_FOUND" });
    }
    const result = await pgPool.query(
      `SELECT author_name, title, content, rating, updated_at
       FROM course_reviews
       WHERE course_id = $1
       ORDER BY updated_at DESC`,
      [courseId],
    );
    return res.json({ data: result.rows });
  } catch (error) {
    console.error("Failed to fetch course reviews:", error);
    return res.status(500).json({ error: "Failed to fetch reviews", code: "INTERNAL_ERROR" });
  }
});
