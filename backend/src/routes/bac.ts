import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { pgPool } from "../db/postgres";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  BAC_INVOICES_DIR,
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
import { sendBacCorrectionReadyEmail, sendPurchaseThankYouEmail } from "../services/email.service";
import { ensureGrileTables } from "./grile";

const bacRouter = Router();

const createSubmissionSchema = z.object({
  subject_id: z.number().int().positive(),
});

const MAX_BAC_PDF_BYTES = 30 * 1024 * 1024;

const uploadPdfSchema = z.object({
  file_name: z
    .string()
    .min(3)
    .max(255)
    .refine((name) => /\.pdf$/i.test(name), { message: "Doar fisiere PDF sunt permise." }),
  file_base64: z.string().min(20),
});

const adminCreateBacSubjectSchema = z.object({
  name: z.string().trim().min(3).max(255),
  year: z.number().int().min(2000).max(2100),
  tip: z.enum(["antrenament", "oficial"]),
  profile_id: z.number().int().min(1).max(2),
  video_url: z.union([z.string().url().max(500), z.literal("")]).optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  subject_pdf: uploadPdfSchema,
  barem_pdf: uploadPdfSchema.optional(),
});

const adminUpdateBacSubjectSchema = z.object({
  name: z.string().trim().min(3).max(255).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  tip: z.enum(["antrenament", "oficial"]).optional(),
  profile_id: z.number().int().min(1).max(2).optional(),
  video_url: z.union([z.string().url().max(500), z.literal(""), z.null()]).optional(),
  status: z.enum(["draft", "published"]).optional(),
  subject_pdf: uploadPdfSchema.optional(),
  barem_pdf: uploadPdfSchema.optional(),
});

class BacPdfValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BacPdfValidationError";
  }
}

class BacVimeoValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BacVimeoValidationError";
  }
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
    throw new BacVimeoValidationError("Link Vimeo invalid. Foloseste formatul https://vimeo.com/123456789");
  }
  return `https://player.vimeo.com/video/${videoId}`;
}

function decodeBacUploadBase64(raw: string): { buffer: Buffer; declaredMime: string | null } {
  const trimmed = raw.trim();
  const dataUrlMatch = /^data:([^;]+);base64,(.+)$/is.exec(trimmed);
  if (dataUrlMatch) {
    return { buffer: Buffer.from(dataUrlMatch[2], "base64"), declaredMime: dataUrlMatch[1].trim().toLowerCase() };
  }
  const content = trimmed.includes(",") ? (trimmed.split(",").pop() ?? "") : trimmed;
  return { buffer: Buffer.from(content, "base64"), declaredMime: null };
}

function validateBacPdfBuffer(fileName: string, buffer: Buffer): string {
  const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!safeName || !/\.pdf$/i.test(safeName)) {
    throw new BacPdfValidationError("Doar fisiere PDF sunt permise.");
  }
  if (buffer.length < 5) {
    throw new BacPdfValidationError("Fisierul PDF este gol sau invalid.");
  }
  if (buffer.length > MAX_BAC_PDF_BYTES) {
    throw new BacPdfValidationError("PDF-ul depaseste limita de 30 MB.");
  }
  if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new BacPdfValidationError("Fisierul nu este un PDF valid.");
  }
  return safeName;
}

const createBacCorrectionPaymentSchema = z.object({
  submission_id: z.string().uuid(),
  billingProfile: billingProfileActivateSchema,
  acceptTerms: z.literal(true),
  discountCode: z.string().trim().max(64).optional(),
});

const confirmBacCorrectionPaymentSchema = z.object({
  attemptId: z.string().uuid(),
});

/** Pret corectura simulare BAC (RON), aliniat cu UI si facturare. */
const BAC_CORRECTION_PRICE_LEI = 50;

const saveReviewSchema = z.object({
  feedback: z.string().max(5000).optional(),
  items: z.array(
    z.object({
      rubric_id: z.number().int().positive(),
      awarded_points: z.number().min(0),
      feedback_text: z.string().max(2000).optional(),
    }),
  ),
});

function splitSqlValues(valuesBlock: string) {
  const rows: string[] = [];
  let current = "";
  let inString = false;
  let depth = 0;

  for (let i = 0; i < valuesBlock.length; i += 1) {
    const char = valuesBlock[i];
    const next = valuesBlock[i + 1];

    if (char === "'" && inString && next === "'") {
      current += "''";
      i += 1;
      continue;
    }

    if (char === "'") {
      inString = !inString;
      current += char;
      continue;
    }

    if (!inString && char === "(") {
      depth += 1;
      current += char;
      continue;
    }

    if (!inString && char === ")") {
      depth -= 1;
      current += char;
      if (depth === 0) {
        rows.push(current.trim());
        current = "";
      }
      continue;
    }

    if (!inString && depth === 0) continue;
    current += char;
  }

  return rows;
}

function splitTupleValues(tuple: string) {
  const raw = tuple.trim().replace(/^\(/, "").replace(/\)$/, "");
  const parts: string[] = [];
  let current = "";
  let inString = false;

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    const next = raw[i + 1];

    if (char === "'" && inString && next === "'") {
      current += "''";
      i += 1;
      continue;
    }

    if (char === "'") {
      inString = !inString;
      current += char;
      continue;
    }

    if (!inString && char === ",") {
      parts.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }
  parts.push(current.trim());

  return parts;
}

function parseSqlValue(value: string): string | number | null {
  if (value === "NULL") return null;
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  const asNumber = Number(value);
  return Number.isNaN(asNumber) ? value : asNumber;
}

async function hasReviewerAccess(userId: string) {
  const roleResult = await pgPool.query<{ role: "student" | "professor" | "admin" }>(
    `SELECT role FROM users WHERE id = $1 LIMIT 1`,
    [userId],
  );
  const role = roleResult.rows[0]?.role;
  return role === "professor" || role === "admin";
}

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

function getBacSubjectsUploadDir() {
  return (
    process.env.BAC_SUBJECTS_UPLOAD_DIR?.trim() ||
    path.resolve(process.cwd(), "../frontend/public/uploads/bac-subjects")
  );
}

function getBacSubjectStorageSubdir(tip: string, year: number) {
  return tip === "oficial" ? `oficiale-${year}` : `subiecte-antrenament-${year}`;
}

async function saveBacSubjectPdf(tip: string, year: number, fileName: string, buffer: Buffer): Promise<string> {
  const safeName = validateBacPdfBuffer(fileName, buffer);
  const subdir = getBacSubjectStorageSubdir(tip, year);
  const uploadsDir = path.join(getBacSubjectsUploadDir(), "informatica", subdir);
  await fs.mkdir(uploadsDir, { recursive: true });
  const outputPath = path.join(uploadsDir, safeName);
  await fs.writeFile(outputPath, buffer);
  return `/uploads/bac-subjects/informatica/${subdir}/${safeName}`;
}

async function decodeAndSaveBacSubjectPdf(
  tip: string,
  year: number,
  upload: z.infer<typeof uploadPdfSchema>,
): Promise<string> {
  const { buffer, declaredMime } = decodeBacUploadBase64(upload.file_base64);
  if (declaredMime && declaredMime !== "application/pdf") {
    throw new BacPdfValidationError("Doar fisiere PDF sunt permise.");
  }
  return saveBacSubjectPdf(tip, year, upload.file_name, buffer);
}

async function getNextBacSubjectId(): Promise<number> {
  const result = await pgPool.query<{ next_id: string | number }>(
    `SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM bac_subjects`,
  );
  return Number(result.rows[0]?.next_id ?? 1);
}

async function ensureBacTables() {
  await ensureDiscountCodesTable();
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS bac_subjects (
      id BIGINT PRIMARY KEY,
      name TEXT NOT NULL,
      materie_id INTEGER NOT NULL,
      year SMALLINT,
      tip TEXT NOT NULL CHECK (tip IN ('antrenament', 'oficial')),
      subject_pdf_url TEXT NOT NULL,
      barem_pdf_url TEXT,
      video_url TEXT,
      duration_minutes SMALLINT NOT NULL DEFAULT 180,
      price_lei INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      profile_id INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_bac_subjects_status_year ON bac_subjects(status, year DESC)`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_bac_subjects_profile ON bac_subjects(profile_id)`);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS bac_subject_rubrics (
      id BIGINT PRIMARY KEY,
      subject_id BIGINT NOT NULL REFERENCES bac_subjects(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      title TEXT,
      max_points NUMERIC(6,2) NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
  `);
  await pgPool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_bac_rubric_code ON bac_subject_rubrics(subject_id, code)`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_bac_rubrics_subject ON bac_subject_rubrics(subject_id, sort_order)`);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS bac_subject_submissions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject_id BIGINT NOT NULL REFERENCES bac_subjects(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed')),
      started_at TIMESTAMPTZ,
      finished_at TIMESTAMPTZ,
      uploaded_pdf_path TEXT,
      uploaded_pdf_public_url TEXT,
      uploaded_pdf_name TEXT,
      uploaded_at TIMESTAMPTZ,
      submitted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pgPool.query(`ALTER TABLE bac_subject_submissions ADD COLUMN IF NOT EXISTS uploaded_pdf_public_url TEXT`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_bac_submissions_user_created ON bac_subject_submissions(user_id, created_at DESC)`);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS bac_submission_reviews (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      submission_id UUID NOT NULL UNIQUE REFERENCES bac_subject_submissions(id) ON DELETE CASCADE,
      reviewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      total_score NUMERIC(6,2) NOT NULL DEFAULT 0,
      feedback TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS bac_submission_review_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      review_id UUID NOT NULL REFERENCES bac_submission_reviews(id) ON DELETE CASCADE,
      rubric_id BIGINT NOT NULL REFERENCES bac_subject_rubrics(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      title TEXT,
      max_points NUMERIC(6,2) NOT NULL,
      awarded_points NUMERIC(6,2) NOT NULL DEFAULT 0,
      feedback_text TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
  `);
  await pgPool.query(`ALTER TABLE bac_submission_review_items ADD COLUMN IF NOT EXISTS feedback_text TEXT`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_bac_review_items_review ON bac_submission_review_items(review_id, sort_order)`);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS user_bac_correction_payment_attempts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      submission_id UUID NOT NULL REFERENCES bac_subject_submissions(id) ON DELETE CASCADE,
      subject_id BIGINT NOT NULL REFERENCES bac_subjects(id) ON DELETE CASCADE,
      subject_name TEXT NOT NULL,
      amount NUMERIC(10, 2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'RON',
      invoice_lines JSONB NOT NULL DEFAULT '[]'::jsonb,
      billing_snapshot JSONB NOT NULL,
      terms_accepted_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
      revolut_order_id TEXT UNIQUE,
      revolut_checkout_url TEXT,
      paid_at TIMESTAMPTZ,
      invoice_number TEXT,
      invoice_url TEXT,
      invoice_local_path TEXT,
      invoice_issued_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pgPool.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS uq_bac_correction_payment_submission ON user_bac_correction_payment_attempts(submission_id)`,
  );
  await pgPool.query(
    `CREATE INDEX IF NOT EXISTS idx_bac_correction_payment_user ON user_bac_correction_payment_attempts(user_id, created_at DESC)`,
  );
  await pgPool.query(`ALTER TABLE user_bac_correction_payment_attempts ADD COLUMN IF NOT EXISTS discount_code_id UUID`);
  await pgPool.query(`ALTER TABLE user_bac_correction_payment_attempts ADD COLUMN IF NOT EXISTS discount_percent_applied SMALLINT`);
  await pgPool.query(`ALTER TABLE user_bac_correction_payment_attempts ADD COLUMN IF NOT EXISTS amount_before_discount NUMERIC(10, 2)`);
  await pgPool.query(`ALTER TABLE user_bac_correction_payment_attempts ADD COLUMN IF NOT EXISTS discount_label TEXT`);
}

async function seedSubjectsFromSqlIfNeeded() {
  const existing = await pgPool.query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM bac_subjects`);
  if ((existing.rows[0]?.total ?? 0) > 0) return;

  const sqlPath = path.resolve(process.cwd(), "../Subiecte.sql");
  const sqlText = await fs.readFile(sqlPath, "utf8");
  const insertBlocks = [...sqlText.matchAll(/INSERT INTO `Subiecte`[\s\S]*?VALUES\s*([\s\S]*?);/g)];
  const rowsToInsert: Array<{
    id: number;
    name: string;
    materie_id: number;
    year: number | null;
    tip: string;
    subject_pdf_url: string;
    barem_pdf_url: string | null;
    video_url: string | null;
    duration_minutes: number;
    price_lei: number;
    status: string;
    profile_id: number | null;
  }> = [];

  for (const block of insertBlocks) {
    const valuesBlock = block[1] ?? "";
    const tuples = splitSqlValues(valuesBlock);
    for (const tuple of tuples) {
      const values = splitTupleValues(tuple).map(parseSqlValue);
      if (values.length < 16) continue;
      const materieId = Number(values[2]);
      if (materieId !== 1) continue;
      rowsToInsert.push({
        id: Number(values[0]),
        name: String(values[1]),
        materie_id: materieId,
        year: values[3] == null ? null : Number(values[3]),
        tip: String(values[4]),
        subject_pdf_url: String(values[6]),
        barem_pdf_url: values[7] ? String(values[7]) : null,
        video_url: values[8] ? String(values[8]) : null,
        duration_minutes: Number(values[9] ?? 180),
        price_lei: Number(values[10] ?? 0),
        status: String(values[11] ?? "draft"),
        profile_id: values[15] == null ? null : Number(values[15]),
      });
    }
  }

  for (const row of rowsToInsert) {
    await pgPool.query(
      `INSERT INTO bac_subjects
         (id, name, materie_id, year, tip, subject_pdf_url, barem_pdf_url, video_url, duration_minutes, price_lei, status, profile_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (id) DO NOTHING`,
      [
        row.id,
        row.name,
        row.materie_id,
        row.year,
        row.tip,
        row.subject_pdf_url,
        row.barem_pdf_url,
        row.video_url,
        row.duration_minutes,
        row.price_lei,
        row.status,
        row.profile_id,
      ],
    );
  }
}

async function seedRubricsFromSqlIfNeeded() {
  const sqlCandidates = [
    path.resolve(process.cwd(), "../SubiecteRubrica.sql"),
    path.resolve(process.cwd(), "../SubiectRubrica.sql"),
  ];
  let sqlText = "";
  let loaded = false;
  for (const candidate of sqlCandidates) {
    try {
      const content = await fs.readFile(candidate, "utf8");
      if (!loaded || content.length > sqlText.length) {
        sqlText = content;
        loaded = true;
      }
    } catch {
      // Candidate missing, keep checking the others.
    }
  }
  if (!loaded) return;
  const insertBlocks = [...sqlText.matchAll(/INSERT INTO `SubiectRubrica`[\s\S]*?VALUES\s*([\s\S]*?);/g)];

  for (const block of insertBlocks) {
    const valuesBlock = block[1] ?? "";
    const tuples = splitSqlValues(valuesBlock);
    for (const tuple of tuples) {
      const values = splitTupleValues(tuple).map(parseSqlValue);
      if (values.length < 6) continue;
      const id = Number(values[0]);
      const subjectId = Number(values[1]);
      const code = String(values[2]);
      const title = values[3] ? String(values[3]) : null;
      const maxPoints = Number(values[4] ?? 0);
      const sortOrder = Number(values[5] ?? 0);
      if (!Number.isFinite(id) || !Number.isFinite(subjectId)) continue;

      // Keep only rubrics for subjects that exist in our imported Bac subjects.
      const subjectExists = await pgPool.query(`SELECT id FROM bac_subjects WHERE id = $1 LIMIT 1`, [subjectId]);
      if (!subjectExists.rows[0]) continue;

      await pgPool.query(
        `INSERT INTO bac_subject_rubrics (id, subject_id, code, title, max_points, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE
         SET subject_id = EXCLUDED.subject_id,
             code = EXCLUDED.code,
             title = EXCLUDED.title,
             max_points = EXCLUDED.max_points,
             sort_order = EXCLUDED.sort_order`,
        [id, subjectId, code, title, maxPoints, sortOrder],
      );
    }
  }
}

async function getUnifiedRubricsTemplate() {
  const result = await pgPool.query<{ id: string | number; code: string; title: string | null; max_points: string | number; sort_order: string | number }>(
    `SELECT id, code, title, max_points, sort_order
     FROM bac_subject_rubrics
     ORDER BY sort_order ASC, id ASC
     LIMIT 15`,
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    code: row.code,
    title: row.title,
    max_points: String(row.max_points),
    sort_order: Number(row.sort_order),
  }));
}

let bacBootstrapPromise: Promise<void> | null = null;

async function ensureBacDataReady() {
  if (!bacBootstrapPromise) {
    bacBootstrapPromise = (async () => {
      await ensureBacTables();
      await seedSubjectsFromSqlIfNeeded();
      await seedRubricsFromSqlIfNeeded();
    })().catch((error) => {
      bacBootstrapPromise = null;
      throw error;
    });
  }
  await bacBootstrapPromise;
}

bacRouter.get("/subjects", async (req, res) => {
  try {
    await ensureBacDataReady();

    const year = req.query.year ? Number(req.query.year) : null;
    const tip = typeof req.query.tip === "string" ? req.query.tip : null;
    const profileId = req.query.profile_id ? Number(req.query.profile_id) : null;
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

    const result = await pgPool.query(
      `SELECT id, name, year, tip, subject_pdf_url, barem_pdf_url, video_url, duration_minutes, price_lei, status, profile_id
       FROM bac_subjects
       WHERE materie_id = 1
         AND status = 'published'
         AND ($1::int IS NULL OR year = $1)
         AND ($2::text IS NULL OR tip = $2)
         AND ($3::int IS NULL OR profile_id = $3)
         AND ($4::text = '' OR name ILIKE '%' || $4 || '%')
       ORDER BY year DESC NULLS LAST, id DESC`,
      [year, tip, profileId, search],
    );

    const filtersResult = await pgPool.query(
      `SELECT
          ARRAY_REMOVE(ARRAY_AGG(DISTINCT year ORDER BY year DESC), NULL) AS years,
          ARRAY_REMOVE(ARRAY_AGG(DISTINCT tip), NULL) AS tips,
          ARRAY_REMOVE(ARRAY_AGG(DISTINCT profile_id ORDER BY profile_id), NULL) AS profiles
       FROM bac_subjects
       WHERE materie_id = 1
         AND status = 'published'`,
    );

    res.json({
      data: {
        subjects: result.rows,
        filters: {
          years: filtersResult.rows[0]?.years ?? [],
          tips: filtersResult.rows[0]?.tips ?? [],
          profiles: filtersResult.rows[0]?.profiles ?? [],
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch bac subjects:", error);
    res.status(500).json({ error: "Failed to fetch bac subjects", code: "INTERNAL_ERROR" });
  }
});

bacRouter.get("/subjects/:id", async (req, res) => {
  try {
    await ensureBacDataReady();
    const id = Number(req.params.id);
    const result = await pgPool.query(
      `SELECT id, name, year, tip, subject_pdf_url, barem_pdf_url, video_url, duration_minutes, price_lei, status, profile_id
       FROM bac_subjects
       WHERE id = $1 AND materie_id = 1 AND status = 'published'
       LIMIT 1`,
      [id],
    );

    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: "Subject not found", code: "NOT_FOUND" });
      return;
    }
    res.json({ data: row });
  } catch (error) {
    console.error("Failed to fetch bac subject:", error);
    res.status(500).json({ error: "Failed to fetch bac subject", code: "INTERNAL_ERROR" });
  }
});

bacRouter.get("/subjects/:id/stats", requireAuth, async (req, res) => {
  try {
    await ensureBacDataReady();
    const subjectId = Number(req.params.id);
    if (!Number.isFinite(subjectId) || subjectId <= 0) {
      res.status(400).json({ error: "Invalid subject id", code: "INVALID_SUBJECT_ID" });
      return;
    }

    const subjectExists = await pgPool.query(
      `SELECT id
       FROM bac_subjects
       WHERE id = $1 AND materie_id = 1 AND status = 'published'
       LIMIT 1`,
      [subjectId],
    );
    if (!subjectExists.rows[0]) {
      res.status(404).json({ error: "Subject not found", code: "NOT_FOUND" });
      return;
    }

    const scoresResult = await pgPool.query<{ total_score: number | string }>(
      `SELECT r.total_score
       FROM bac_subject_submissions s
       JOIN bac_submission_reviews r ON r.submission_id = s.id
       WHERE s.subject_id = $1
         AND s.status = 'reviewed'
         AND r.total_score IS NOT NULL`,
      [subjectId],
    );
    const grades = scoresResult.rows
      .map((row) => Number(row.total_score) / 10)
      .filter((value) => Number.isFinite(value))
      .map((value) => Math.max(0, Math.min(10, value)));

    const buckets = [
      { label: "<5", count: 0 },
      { label: "5-6", count: 0 },
      { label: "6-7", count: 0 },
      { label: "7-8", count: 0 },
      { label: "8-9", count: 0 },
      { label: "9-10", count: 0 },
    ];
    for (const grade of grades) {
      if (grade < 5) buckets[0].count += 1;
      else if (grade < 6) buckets[1].count += 1;
      else if (grade < 7) buckets[2].count += 1;
      else if (grade < 8) buckets[3].count += 1;
      else if (grade < 9) buckets[4].count += 1;
      else buckets[5].count += 1;
    }

    const attemptsCount = grades.length;
    const avg = attemptsCount > 0 ? grades.reduce((sum, value) => sum + value, 0) / attemptsCount : null;
    const min = attemptsCount > 0 ? Math.min(...grades) : null;
    const max = attemptsCount > 0 ? Math.max(...grades) : null;

    res.json({
      data: {
        attempts_count: attemptsCount,
        avg_grade: avg,
        min_grade: min,
        max_grade: max,
        buckets,
      },
    });
  } catch (error) {
    console.error("Failed to fetch bac subject stats:", error);
    res.status(500).json({ error: "Failed to fetch subject stats", code: "INTERNAL_ERROR" });
  }
});

bacRouter.post("/submissions", requireAuth, validateBody(createSubmissionSchema), async (req, res) => {
  try {
    await ensureBacDataReady();
    const payload = req.body as z.infer<typeof createSubmissionSchema>;
    const subjectExists = await pgPool.query(`SELECT id FROM bac_subjects WHERE id = $1 AND status = 'published' LIMIT 1`, [payload.subject_id]);
    if (!subjectExists.rows[0]) {
      res.status(404).json({ error: "Subject not found", code: "NOT_FOUND" });
      return;
    }

    const created = await pgPool.query<{ id: string }>(
      `INSERT INTO bac_subject_submissions (user_id, subject_id, started_at)
       VALUES ($1, $2, NOW())
       RETURNING id`,
      [req.user!.id, payload.subject_id],
    );
    res.status(201).json({ data: { id: created.rows[0]?.id, created: true } });
  } catch (error) {
    console.error("Failed to create bac submission:", error);
    res.status(500).json({ error: "Failed to create bac submission", code: "INTERNAL_ERROR" });
  }
});

bacRouter.post("/submissions/:id/upload-pdf", requireAuth, validateBody(uploadPdfSchema), async (req, res) => {
  try {
    await ensureBacDataReady();
    const submissionId = req.params.id;
    const payload = req.body as z.infer<typeof uploadPdfSchema>;

    const owned = await pgPool.query(`SELECT id FROM bac_subject_submissions WHERE id = $1 AND user_id = $2 LIMIT 1`, [submissionId, req.user!.id]);
    if (!owned.rows[0]) {
      res.status(404).json({ error: "Submission not found", code: "NOT_FOUND" });
      return;
    }

    const { buffer, declaredMime } = decodeBacUploadBase64(payload.file_base64);
    if (declaredMime && declaredMime !== "application/pdf") {
      res.status(400).json({ error: "Doar fisiere PDF sunt permise.", code: "INVALID_PDF" });
      return;
    }
    const safeName = validateBacPdfBuffer(payload.file_name, buffer);

    const uploadsDir =
      process.env.BAC_SUBMISSIONS_UPLOAD_DIR?.trim() ||
      path.resolve(process.cwd(), "../frontend/public/uploads/bac-submissions");
    await fs.mkdir(uploadsDir, { recursive: true });
    const outputFileName = `${randomUUID()}_${safeName}`;
    const outputPath = path.join(uploadsDir, outputFileName);

    await fs.writeFile(outputPath, buffer);

    const publicUrl = `/uploads/bac-submissions/${outputFileName}`;

    await pgPool.query(
      `UPDATE bac_subject_submissions
       SET uploaded_pdf_path = $2, uploaded_pdf_public_url = $3, uploaded_pdf_name = $4, uploaded_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $5`,
      [submissionId, outputPath, publicUrl, safeName, req.user!.id],
    );
    res.json({ data: { uploaded: true, file_name: safeName, file_url: publicUrl } });
  } catch (error) {
    if (error instanceof BacPdfValidationError) {
      res.status(400).json({ error: error.message, code: "INVALID_PDF" });
      return;
    }
    console.error("Failed to upload bac pdf:", error);
    res.status(500).json({ error: "Failed to upload pdf", code: "INTERNAL_ERROR" });
  }
});

bacRouter.post("/correction-payments/create", requireAuth, validateBody(createBacCorrectionPaymentSchema), async (req, res) => {
  try {
    await ensureBacDataReady();
    await ensureGrileTables();
    const userId = req.user!.id;
    const body = req.body as z.infer<typeof createBacCorrectionPaymentSchema>;
    const submissionId = body.submission_id;

    const userResult = await pgPool.query<{ email: string }>(`SELECT email FROM users WHERE id = $1 LIMIT 1`, [userId]);
    const userEmail = userResult.rows[0]?.email;
    if (!userEmail) {
      res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
      return;
    }

    const submissionResult = await pgPool.query<{
      uploaded_pdf_path: string | null;
      status: string;
      subject_id: number;
      subject_name: string;
    }>(
      `SELECT s.uploaded_pdf_path, s.status, s.subject_id, b.name AS subject_name
       FROM bac_subject_submissions s
       JOIN bac_subjects b ON b.id = s.subject_id
       WHERE s.id = $1 AND s.user_id = $2
       LIMIT 1`,
      [submissionId, userId],
    );
    const submission = submissionResult.rows[0];
    if (!submission) {
      res.status(404).json({ error: "Submission not found", code: "NOT_FOUND" });
      return;
    }
    if (submission.status !== "draft") {
      res.status(400).json({ error: "Aceasta submisie nu mai poate fi platita pentru corectare.", code: "INVALID_STATUS" });
      return;
    }
    if (!submission.uploaded_pdf_path) {
      res.status(400).json({ error: "Trebuie sa incarci PDF-ul inainte de plata.", code: "MISSING_PDF" });
      return;
    }

    const paidExists = await pgPool.query(`SELECT id FROM user_bac_correction_payment_attempts WHERE submission_id = $1 AND status = 'paid' LIMIT 1`, [
      submissionId,
    ]);
    if (paidExists.rows[0]) {
      res.status(400).json({ error: "Aceasta submisie este deja platita.", code: "ALREADY_PAID" });
      return;
    }

    const billingProfile = body.billingProfile;

    let priceRon = Number(BAC_CORRECTION_PRICE_LEI.toFixed(2));
    let discountCodeId: string | null = null;
    let discountPercentApplied: number | null = null;
    let amountBeforeDiscount: number | null = null;
    let discountLabel: string | null = null;

    const rawDiscount = body.discountCode?.trim();
    if (rawDiscount) {
      const resolved = await resolveActiveDiscountCode(pgPool, rawDiscount, "bac_correction");
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

    if (priceRon <= 0 && !rawDiscount) {
      res.status(400).json({ error: "Pret invalid pentru corectare.", code: "INVALID_PRICE" });
      return;
    }

    const suffix =
      discountLabel && amountBeforeDiscount != null
        ? ` | Cod reducere ${discountLabel}. Lista: ${amountBeforeDiscount.toFixed(2)} RON, platit: ${priceRon.toFixed(2)} RON`
        : "";
    const invoiceLines: SmartbillProductLine[] = [
      {
        name: (`Corectare simulare BAC — ${submission.subject_name}` + suffix).slice(0, 500),
        priceRon,
        quantity: 1,
        isService: true,
      },
    ];

    const appBase = getAppBaseUrl().replace(/\/$/, "");
    const redirectSubjectId = submission.subject_id;
    const redirectUrl = `${appBase}/bacalaureat/subiect/${redirectSubjectId}?payment=success&attempt=`;

    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");
      await persistUserBillingProfile(userId, billingProfile, client);
      await client.query(`DELETE FROM user_bac_correction_payment_attempts WHERE submission_id = $1 AND user_id = $2 AND status = 'pending'`, [
        submissionId,
        userId,
      ]);

      const attemptInsert = await client.query<{ id: string }>(
        `INSERT INTO user_bac_correction_payment_attempts (
           user_id, submission_id, subject_id, subject_name, amount, currency, invoice_lines,
           billing_snapshot, terms_accepted_at, status, updated_at,
           discount_code_id, discount_percent_applied, amount_before_discount, discount_label
         )
         VALUES ($1, $2, $3, $4, $5, 'RON', $6::jsonb, $7::jsonb, NOW(), 'pending', NOW(), $8, $9, $10, $11)
         RETURNING id`,
        [
          userId,
          submissionId,
          submission.subject_id,
          submission.subject_name,
          priceRon,
          JSON.stringify(invoiceLines),
          JSON.stringify(billingProfile),
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
        const updateSubmission = await client.query<{ id: string }>(
          `UPDATE bac_subject_submissions
           SET status = 'submitted', finished_at = NOW(), submitted_at = NOW(), updated_at = NOW()
           WHERE id = $1 AND user_id = $2 AND status = 'draft' AND uploaded_pdf_path IS NOT NULL
           RETURNING id`,
          [submissionId, userId],
        );
        if (updateSubmission.rowCount !== 1) {
          await client.query("ROLLBACK").catch(() => {});
          res.status(409).json({ error: "Nu am putut finaliza: submisia nu mai este in stadiu draft.", code: "CONFLICT" });
          return;
        }
        await client.query(
          `UPDATE user_bac_correction_payment_attempts
           SET status = 'paid', paid_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [attemptId],
        );
        if (discountCodeId) {
          await incrementDiscountCodeUses(client, discountCodeId);
        }
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

      const { orderId, checkoutUrl } = await revolutCreateOrder({
        amountCents: Math.round(priceRon * 100),
        currency: "RON",
        description: `Corectare BAC — ${submission.subject_name}`.slice(0, 240),
        redirectUrl: `${redirectUrl}${encodeURIComponent(attemptId)}`,
        customer: {
          email: userEmail,
          name: `${billingProfile.firstName} ${billingProfile.lastName}`.trim(),
          phone: billingProfile.phone || undefined,
        },
        metadata: {
          attempt_id: attemptId,
          submission_id: submissionId,
          user_id: userId,
          kind: "bac_correction",
        },
      });

      await client.query(
        `UPDATE user_bac_correction_payment_attempts
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
    console.error("Failed to create bac correction payment:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create payment",
      code: "INTERNAL_ERROR",
    });
  }
});

bacRouter.post("/correction-payments/confirm", async (req, res) => {
  try {
    await ensureBacDataReady();
    await ensureGrileTables();
    const parsed = confirmBacCorrectionPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
      return;
    }
    const attemptResult = await pgPool.query<{
      id: string;
      user_id: string;
      submission_id: string;
      subject_id: number;
      amount: number;
      status: string;
      revolut_order_id: string | null;
      invoice_number: string | null;
      invoice_url: string | null;
      paid_at: string | null;
      billing_snapshot: z.infer<typeof billingProfileActivateSchema>;
      invoice_lines: unknown;
      discount_code_id: string | null;
    }>(
      `SELECT
         id,
         user_id,
         submission_id,
         subject_id,
         amount::float8 AS amount,
         status,
         revolut_order_id,
         invoice_number,
         invoice_url,
         paid_at::text,
         billing_snapshot,
         invoice_lines,
         discount_code_id
       FROM user_bac_correction_payment_attempts
       WHERE id = $1
       LIMIT 1`,
      [parsed.data.attemptId],
    );
    const attempt = attemptResult.rows[0];
    if (!attempt) {
      res.status(404).json({ error: "Payment attempt not found", code: "NOT_FOUND" });
      return;
    }
    const userId = attempt.user_id;

    if (attempt.status === "paid") {
      await pgPool.query(
        `UPDATE bac_subject_submissions
         SET status = 'submitted',
             finished_at = COALESCE(finished_at, NOW()),
             submitted_at = COALESCE(submitted_at, NOW()),
             updated_at = NOW()
         WHERE id = $1 AND user_id = $2 AND status = 'draft' AND uploaded_pdf_path IS NOT NULL`,
        [attempt.submission_id, userId],
      );
      res.json({
        data: {
          ok: true,
          payment_status: "paid",
          submission_id: attempt.submission_id,
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

    const userResult = await pgPool.query<{ email: string }>(`SELECT email FROM users WHERE id = $1 LIMIT 1`, [userId]);
    const userEmail = userResult.rows[0]?.email ?? "";

    const lines = Array.isArray(attempt.invoice_lines) ? (attempt.invoice_lines as SmartbillProductLine[]) : [];

    const client = await pgPool.connect();
    let invoiceNumber: string | null = null;
    let invoiceUrl: string | null = null;
    let invoiceLocalPath: string | null = null;
    let bacThankYou: { billing: z.infer<typeof billingProfileActivateSchema>; amount: number; label: string } | null = null;
    try {
      await client.query("BEGIN");
      const locked = await client.query<{
        status: string;
        billing_snapshot: z.infer<typeof billingProfileActivateSchema>;
        invoice_lines: unknown;
        invoice_number: string | null;
        invoice_url: string | null;
        submission_id: string;
        amount: number;
        discount_code_id: string | null;
      }>(
        `SELECT status, billing_snapshot, invoice_lines, invoice_number, invoice_url, submission_id,
                amount::float8 AS amount, discount_code_id
         FROM user_bac_correction_payment_attempts
         WHERE id = $1 AND user_id = $2
         FOR UPDATE`,
        [attempt.id, userId],
      );
      const lockedRow = locked.rows[0];
      if (!lockedRow) {
        await client.query("ROLLBACK").catch(() => {});
        res.status(404).json({ error: "Payment attempt not found", code: "NOT_FOUND" });
        return;
      }
      if (lockedRow.status === "paid") {
        await client.query(
          `UPDATE bac_subject_submissions
           SET status = 'submitted',
               finished_at = COALESCE(finished_at, NOW()),
               submitted_at = COALESCE(submitted_at, NOW()),
               updated_at = NOW()
           WHERE id = $1 AND user_id = $2 AND status = 'draft' AND uploaded_pdf_path IS NOT NULL`,
          [lockedRow.submission_id, userId],
        );
        await client.query("COMMIT");
        res.json({
          data: {
            ok: true,
            payment_status: "paid",
            submission_id: lockedRow.submission_id,
            invoice_number: lockedRow.invoice_number,
            invoice_url: lockedRow.invoice_url,
          },
        });
        return;
      }

      const lockedLines = Array.isArray(lockedRow.invoice_lines)
        ? (lockedRow.invoice_lines as SmartbillProductLine[])
        : lines;

      const paidAmount = Number(lockedRow.amount);
      const skipInvoice = paidAmount <= 0.001;

      const updateSubmission = await client.query<{ id: string }>(
        `UPDATE bac_subject_submissions
         SET status = 'submitted', finished_at = NOW(), submitted_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND user_id = $2 AND status = 'draft' AND uploaded_pdf_path IS NOT NULL
         RETURNING id`,
        [lockedRow.submission_id, userId],
      );
      let submissionPromoted = updateSubmission.rowCount === 1;
      if (!submissionPromoted) {
        const snap = await client.query<{ status: string; uploaded_pdf_path: string | null }>(
          `SELECT status, uploaded_pdf_path FROM bac_subject_submissions WHERE id = $1 AND user_id = $2`,
          [lockedRow.submission_id, userId],
        );
        const s = snap.rows[0];
        if (s?.status === "submitted") {
          submissionPromoted = true;
        } else {
          await client.query("ROLLBACK").catch(() => {});
          const msg =
            !s || s.uploaded_pdf_path == null
              ? "Nu am putut finaliza: lipseste PDF-ul pe submisie."
              : "Nu am putut finaliza plata: submisia nu mai este in stadiu draft.";
          res.status(409).json({ error: msg, code: "CONFLICT" });
          return;
        }
      }

      if (!skipInvoice) {
        const invoice = await issueSmartbillInvoiceWithProducts({
          billingProfile: lockedRow.billing_snapshot,
          userEmail,
          products: lockedLines.map((line) => ({
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
            invoiceLocalPath = await persistInvoicePdfToDirectory(BAC_INVOICES_DIR, invoiceNumber, invoicePdf);
          } catch (invoicePersistError) {
            console.error("Failed to persist local bac correction invoice pdf:", invoicePersistError);
          }
        }
      }

      await client.query(
        `UPDATE user_bac_correction_payment_attempts
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

      const firstLine = lockedLines[0]?.name?.trim();
      bacThankYou = {
        billing: lockedRow.billing_snapshot,
        amount: paidAmount,
        label: firstLine ? `Bacalaureat — ${firstLine}` : "Corectare lucrare Bacalaureat",
      };

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    if (bacThankYou && userEmail.includes("@")) {
      const appBase = getAppBaseUrl().replace(/\/$/, "") || "https://www.zecelainfo.ro";
      void sendPurchaseThankYouEmail({
        to: userEmail,
        customerFirstName: bacThankYou.billing.firstName,
        purchaseLabel: bacThankYou.label,
        amountRon: bacThankYou.amount,
        currency: "RON",
        invoiceNumber,
        invoiceUrl,
        invoicePdfPath: invoiceLocalPath,
        primaryCtaPath: "/bacalaureat",
        appBaseUrl: appBase,
      }).catch((err) => console.error("[bac] thank-you email failed:", err));
    }

    res.json({
      data: {
        ok: true,
        payment_status: "paid",
        submission_id: attempt.submission_id,
        invoice_number: invoiceNumber,
        invoice_url: invoiceUrl,
      },
    });
  } catch (error) {
    console.error("Failed to confirm bac correction payment:", error);
    res.status(500).json({ error: "Failed to confirm payment", code: "INTERNAL_ERROR" });
  }
});

bacRouter.get("/correction-payments/:attemptId/invoice", requireAuth, async (req, res) => {
  try {
    await ensureBacDataReady();
    const userId = req.user!.id;
    const attemptId = String(req.params.attemptId ?? "");
    const attemptResult = await pgPool.query<{
      invoice_number: string | null;
      invoice_local_path: string | null;
    }>(
      `SELECT invoice_number, invoice_local_path
       FROM user_bac_correction_payment_attempts
       WHERE id = $1 AND user_id = $2 AND status = 'paid'
       LIMIT 1`,
      [attemptId, userId],
    );
    const row = attemptResult.rows[0];
    if (!row || !row.invoice_number) {
      res.status(404).json({ error: "Factura nu este disponibila", code: "INVOICE_NOT_AVAILABLE" });
      return;
    }
    if (row.invoice_local_path) {
      try {
        const localBuffer = await fs.readFile(row.invoice_local_path);
        if (localBuffer.length >= 200 && localBuffer.subarray(0, 5).toString() === "%PDF-") {
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="${sanitizeInvoiceFileName(row.invoice_number)}.pdf"`);
          res.status(200).send(localBuffer);
          return;
        }
      } catch {
        // fallback SmartBill
      }
    }
    const pdf = await downloadSmartbillInvoicePdf(row.invoice_number);
    const savedPath = await persistInvoicePdfToDirectory(BAC_INVOICES_DIR, row.invoice_number, pdf);
    await pgPool.query(`UPDATE user_bac_correction_payment_attempts SET invoice_local_path = $2, updated_at = NOW() WHERE id = $1`, [
      attemptId,
      savedPath,
    ]);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${pdf.fileName}"`);
    res.status(200).send(pdf.buffer);
  } catch (error) {
    console.error("Failed to download bac correction invoice:", error);
    res.status(500).json({ error: "Failed to download invoice", code: "INTERNAL_ERROR" });
  }
});

/** @deprecated Foloseste plata Revolut (`/correction-payments/create`). */
bacRouter.post("/submissions/:id/submit", requireAuth, async (_req, res) => {
  res.status(402).json({
    error: "Plata se face prin Revolut din pagina subiectului (trimite spre corectare).",
    code: "PAYMENT_REQUIRED",
  });
});

bacRouter.get("/submissions/my", requireAuth, async (req, res) => {
  try {
    await ensureBacDataReady();
    const result = await pgPool.query(
      `SELECT s.id, s.subject_id, s.status, s.started_at::text, s.finished_at::text, s.uploaded_pdf_name, s.submitted_at::text, b.name AS subject_name, r.total_score
       FROM bac_subject_submissions s
       JOIN bac_subjects b ON b.id = s.subject_id
       LEFT JOIN bac_submission_reviews r ON r.submission_id = s.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC
       LIMIT 100`,
      [req.user!.id],
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Failed to fetch my bac submissions:", error);
    res.status(500).json({ error: "Failed to fetch submissions", code: "INTERNAL_ERROR" });
  }
});

bacRouter.get("/me/corrected-bac-submissions", requireAuth, async (req, res) => {
  try {
    await ensureBacDataReady();
    const result = await pgPool.query(
      `SELECT
         s.id AS submission_id,
         s.subject_id,
         s.status AS submission_status,
         b.name AS subject_name,
         s.submitted_at::text,
         r.total_score::float8 AS total_score,
         r.updated_at::text AS reviewed_at,
         p.id AS payment_attempt_id,
         p.invoice_number,
         p.amount::float8 AS amount_paid
       FROM bac_subject_submissions s
       JOIN bac_subjects b ON b.id = s.subject_id
       LEFT JOIN bac_submission_reviews r ON r.submission_id = s.id
       LEFT JOIN user_bac_correction_payment_attempts p ON p.submission_id = s.id AND p.status = 'paid'
       WHERE s.user_id = $1
         AND (
           s.status = 'reviewed'
           OR (s.status = 'submitted' AND s.submitted_at IS NOT NULL)
         )
       ORDER BY
         CASE WHEN s.status = 'submitted' THEN 0 ELSE 1 END,
         s.submitted_at DESC NULLS LAST,
         r.updated_at DESC NULLS LAST
       LIMIT 200`,
      [req.user!.id],
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Failed to fetch corrected bac submissions:", error);
    res.status(500).json({ error: "Failed to fetch corrected submissions", code: "INTERNAL_ERROR" });
  }
});

bacRouter.get("/subjects/:id/submissions/my", requireAuth, async (req, res) => {
  try {
    await ensureBacDataReady();
    const subjectId = Number(req.params.id);
    const result = await pgPool.query(
      `SELECT
         s.id,
         s.subject_id,
         s.status,
         s.started_at::text,
         s.finished_at::text,
         s.uploaded_pdf_name,
         s.uploaded_pdf_public_url,
         s.submitted_at::text,
         s.created_at::text,
         r.total_score
       FROM bac_subject_submissions s
       LEFT JOIN bac_submission_reviews r ON r.submission_id = s.id
       WHERE s.user_id = $1
         AND s.subject_id = $2
       ORDER BY s.created_at DESC`,
      [req.user!.id, subjectId],
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Failed to fetch subject submissions:", error);
    res.status(500).json({ error: "Failed to fetch subject submissions", code: "INTERNAL_ERROR" });
  }
});

bacRouter.get("/submissions/:id/review", requireAuth, async (req, res) => {
  try {
    await ensureBacDataReady();
    const submissionId = req.params.id;

    const submissionResult = await pgPool.query(
      `SELECT
         s.id,
         s.user_id,
         s.subject_id,
         s.status,
         s.uploaded_pdf_name,
         s.uploaded_pdf_public_url,
         b.name AS subject_name,
         b.subject_pdf_url,
         b.barem_pdf_url
       FROM bac_subject_submissions s
       JOIN bac_subjects b ON b.id = s.subject_id
       WHERE s.id = $1
       LIMIT 1`,
      [submissionId],
    );
    const submission = submissionResult.rows[0];
    if (!submission) {
      res.status(404).json({ error: "Submission not found", code: "NOT_FOUND" });
      return;
    }

    const isOwner = submission.user_id === req.user!.id;
    const reviewerAccess = await hasReviewerAccess(req.user!.id);
    if (!isOwner && !reviewerAccess) {
      res.status(403).json({ error: "Access denied", code: "FORBIDDEN" });
      return;
    }

    const reviewResult = await pgPool.query(
      `SELECT id, total_score, feedback, created_at::text, updated_at::text
       FROM bac_submission_reviews
       WHERE submission_id = $1
       LIMIT 1`,
      [submissionId],
    );
    const review = reviewResult.rows[0] ?? null;
    let items: any[] = [];
    if (review) {
      const itemsResult = await pgPool.query(
        `SELECT rubric_id, code, title, max_points, awarded_points, feedback_text, sort_order
         FROM bac_submission_review_items
         WHERE review_id = $1
         ORDER BY sort_order ASC`,
        [review.id],
      );
      items = itemsResult.rows;
    }

    res.json({
      data: {
        submission,
        review,
        items,
      },
    });
  } catch (error) {
    console.error("Failed to fetch review details:", error);
    res.status(500).json({ error: "Failed to fetch review details", code: "INTERNAL_ERROR" });
  }
});

bacRouter.get("/submissions/pending-review", requireAuth, async (req, res) => {
  try {
    await ensureBacDataReady();
    const reviewerAccess = await hasReviewerAccess(req.user!.id);
    if (!reviewerAccess) {
      res.status(403).json({ error: "Access denied", code: "FORBIDDEN" });
      return;
    }

    const result = await pgPool.query(
      `SELECT
         s.id,
         s.subject_id,
         s.status,
         s.created_at::text,
         s.uploaded_pdf_name,
         s.uploaded_pdf_public_url,
         s.submitted_at::text,
         b.name AS subject_name,
         u.email AS student_email
       FROM bac_subject_submissions s
       JOIN bac_subjects b ON b.id = s.subject_id
       JOIN users u ON u.id = s.user_id
       WHERE s.status IN ('submitted', 'reviewed')
       ORDER BY s.submitted_at DESC NULLS LAST, s.created_at DESC`,
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error("Failed to fetch pending reviews:", error);
    res.status(500).json({ error: "Failed to fetch pending reviews", code: "INTERNAL_ERROR" });
  }
});

bacRouter.get("/submissions/review-queue", requireAuth, async (req, res) => {
  try {
    await ensureBacDataReady();
    const reviewerAccess = await hasReviewerAccess(req.user!.id);
    if (!reviewerAccess) {
      res.status(403).json({ error: "Access denied", code: "FORBIDDEN" });
      return;
    }

    const result = await pgPool.query(
      `SELECT
         s.id,
         s.subject_id,
         s.status,
         s.created_at::text,
         s.submitted_at::text,
         b.name AS subject_name,
         COALESCE(NULLIF(TRIM(u.full_name), ''), u.username, u.email) AS student_full_name,
         u.email AS student_email,
         r.total_score
       FROM bac_subject_submissions s
       JOIN bac_subjects b ON b.id = s.subject_id
       JOIN users u ON u.id = s.user_id
       LEFT JOIN bac_submission_reviews r ON r.submission_id = s.id
       WHERE s.status IN ('submitted', 'reviewed')
       ORDER BY s.submitted_at DESC NULLS LAST, s.created_at DESC`,
    );

    const pending = result.rows.filter((row) => row.status === "submitted");
    const reviewed = result.rows.filter((row) => row.status === "reviewed");

    res.json({ data: { pending, reviewed } });
  } catch (error) {
    console.error("Failed to fetch review queue:", error);
    res.status(500).json({ error: "Failed to fetch review queue", code: "INTERNAL_ERROR" });
  }
});

bacRouter.get("/submissions/:id/review-form", requireAuth, async (req, res) => {
  try {
    await ensureBacDataReady();
    const reviewerAccess = await hasReviewerAccess(req.user!.id);
    if (!reviewerAccess) {
      res.status(403).json({ error: "Access denied", code: "FORBIDDEN" });
      return;
    }

    const submissionId = req.params.id;
    const submissionResult = await pgPool.query(
      `SELECT
         s.id,
         s.subject_id,
         s.status,
         s.uploaded_pdf_name,
         s.uploaded_pdf_public_url,
         b.name AS subject_name,
         b.subject_pdf_url,
         b.barem_pdf_url,
         COALESCE(NULLIF(TRIM(u.full_name), ''), u.username, u.email) AS student_full_name,
         u.email AS student_email
       FROM bac_subject_submissions s
       JOIN bac_subjects b ON b.id = s.subject_id
       JOIN users u ON u.id = s.user_id
       WHERE s.id = $1
       LIMIT 1`,
      [submissionId],
    );
    const submission = submissionResult.rows[0];
    if (!submission) {
      res.status(404).json({ error: "Submission not found", code: "NOT_FOUND" });
      return;
    }

    const rubricsResult = await getUnifiedRubricsTemplate();

    const reviewResult = await pgPool.query(
      `SELECT id, total_score, feedback
       FROM bac_submission_reviews
       WHERE submission_id = $1
       LIMIT 1`,
      [submissionId],
    );
    const review = reviewResult.rows[0] ?? null;
    let reviewItems: any[] = [];
    if (review) {
      const itemsResult = await pgPool.query(
        `SELECT rubric_id, awarded_points, feedback_text
         FROM bac_submission_review_items
         WHERE review_id = $1`,
        [review.id],
      );
      reviewItems = itemsResult.rows;
    }

    res.json({
      data: {
        submission,
        rubrics: rubricsResult,
        review,
        review_items: reviewItems,
      },
    });
  } catch (error) {
    console.error("Failed to fetch review form:", error);
    res.status(500).json({ error: "Failed to fetch review form", code: "INTERNAL_ERROR" });
  }
});

bacRouter.post("/submissions/:id/review", requireAuth, validateBody(saveReviewSchema), async (req, res) => {
  try {
    await ensureBacDataReady();
    const reviewerAccess = await hasReviewerAccess(req.user!.id);
    if (!reviewerAccess) {
      res.status(403).json({ error: "Access denied", code: "FORBIDDEN" });
      return;
    }

    const submissionId = String(req.params.id);
    const payload = req.body as z.infer<typeof saveReviewSchema>;

    const submissionResult = await pgPool.query<{
      id: string;
      subject_id: number;
      user_id: string;
      status: string;
      subject_name: string;
      student_email: string;
      first_name: string | null;
      full_name: string | null;
    }>(
      `SELECT
         s.id,
         s.subject_id,
         s.user_id,
         s.status,
         b.name AS subject_name,
         u.email AS student_email,
         u.first_name,
         u.full_name
       FROM bac_subject_submissions s
       JOIN bac_subjects b ON b.id = s.subject_id
       JOIN users u ON u.id = s.user_id
       WHERE s.id = $1
       LIMIT 1`,
      [submissionId],
    );
    const submission = submissionResult.rows[0];
    if (!submission) {
      res.status(404).json({ error: "Submission not found", code: "NOT_FOUND" });
      return;
    }
    const notifyStudentByEmail = submission.status === "submitted";

    const rubrics = await getUnifiedRubricsTemplate();
    const rubricById = new Map(rubrics.map((rubric) => [rubric.id, rubric]));

    let rubricScoreTotal = 0;
    for (const item of payload.items) {
      const rubric = rubricById.get(item.rubric_id);
      if (!rubric) {
        res.status(400).json({ error: `Rubrica invalida: ${item.rubric_id}`, code: "VALIDATION_ERROR" });
        return;
      }
      const maxPoints = Number(rubric.max_points);
      if (item.awarded_points > maxPoints) {
        res.status(400).json({ error: `Punctajul pentru ${rubric.code} depaseste maximul.`, code: "VALIDATION_ERROR" });
        return;
      }
      rubricScoreTotal += Number(item.awarded_points);
    }
    const totalScore = Math.min(100, rubricScoreTotal + 10);

    const existingReviewResult = await pgPool.query<{ id: string }>(
      `SELECT id
       FROM bac_submission_reviews
       WHERE submission_id = $1
       LIMIT 1`,
      [submissionId],
    );
    const existingReviewId = existingReviewResult.rows[0]?.id ?? null;
    const reviewId = existingReviewId ?? randomUUID();

    if (!existingReviewId) {
      await pgPool.query(
        `INSERT INTO bac_submission_reviews (id, submission_id, reviewer_user_id, total_score, feedback)
         VALUES ($1, $2, $3, $4, $5)`,
        [reviewId, submissionId, req.user!.id, totalScore, payload.feedback?.trim() || null],
      );
    } else {
      await pgPool.query(
        `UPDATE bac_submission_reviews
         SET reviewer_user_id = $2, total_score = $3, feedback = $4, updated_at = NOW()
         WHERE id = $1`,
        [reviewId, req.user!.id, totalScore, payload.feedback?.trim() || null],
      );
      await pgPool.query(`DELETE FROM bac_submission_review_items WHERE review_id = $1`, [reviewId]);
    }

    for (const item of payload.items) {
      const rubric = rubricById.get(item.rubric_id);
      if (!rubric) continue;
      await pgPool.query(
        `INSERT INTO bac_submission_review_items (review_id, rubric_id, code, title, max_points, awarded_points, feedback_text, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [reviewId, item.rubric_id, rubric.code, rubric.title, Number(rubric.max_points), item.awarded_points, item.feedback_text?.trim() || null, rubric.sort_order],
      );
    }

    await pgPool.query(
      `UPDATE bac_subject_submissions
       SET status = 'reviewed', updated_at = NOW()
       WHERE id = $1`,
      [submissionId],
    );

    if (notifyStudentByEmail && submission.student_email.includes("@")) {
      let customerFirstName = submission.first_name?.trim() ?? "";
      if (!customerFirstName && submission.full_name?.trim()) {
        customerFirstName = submission.full_name.trim().split(/\s+/)[0] ?? "";
      }
      const appBase = getAppBaseUrl().replace(/\/$/, "") || "https://www.zecelainfo.ro";
      void sendBacCorrectionReadyEmail({
        to: submission.student_email,
        customerFirstName: customerFirstName || null,
        subjectName: submission.subject_name,
        totalScore,
        subjectId: submission.subject_id,
        submissionId,
        appBaseUrl: appBase,
      }).catch((err) => console.error("[bac] correction-ready email failed:", err));
    }

    res.json({
      data: {
        review_id: reviewId,
        total_score: Number(totalScore.toFixed(2)),
        saved: true,
      },
    });
  } catch (error) {
    console.error("Failed to save review:", error);
    res.status(500).json({ error: "Failed to save review", code: "INTERNAL_ERROR" });
  }
});

bacRouter.get("/submissions/:id", requireAuth, async (req, res) => {
  try {
    await ensureBacDataReady();
    const submissionId = req.params.id;
    const result = await pgPool.query(
      `SELECT
         s.id,
         s.subject_id,
         s.status,
         s.started_at::text,
         s.finished_at::text,
         s.uploaded_pdf_name,
         s.uploaded_pdf_public_url,
         s.submitted_at::text,
         r.total_score,
         b.name AS subject_name,
         b.subject_pdf_url,
         b.barem_pdf_url,
         b.video_url,
         b.duration_minutes
       FROM bac_subject_submissions s
       JOIN bac_subjects b ON b.id = s.subject_id
       LEFT JOIN bac_submission_reviews r ON r.submission_id = s.id
       WHERE s.id = $1
         AND s.user_id = $2
       LIMIT 1`,
      [submissionId, req.user!.id],
    );
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: "Submission not found", code: "NOT_FOUND" });
      return;
    }
    res.json({ data: row });
  } catch (error) {
    console.error("Failed to fetch submission details:", error);
    res.status(500).json({ error: "Failed to fetch submission details", code: "INTERNAL_ERROR" });
  }
});

bacRouter.get("/admin/subjects", requireAuth, requireAdmin, async (_req, res) => {
  try {
    await ensureBacDataReady();
    const result = await pgPool.query(
      `SELECT id, name, year, tip, subject_pdf_url, barem_pdf_url, video_url, duration_minutes, price_lei, status, profile_id, created_at::text
       FROM bac_subjects
       WHERE materie_id = 1
       ORDER BY year DESC NULLS LAST, id DESC`,
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Failed to list admin bac subjects:", error);
    res.status(500).json({ error: "Failed to list bac subjects", code: "INTERNAL_ERROR" });
  }
});

bacRouter.post("/admin/subjects", requireAuth, requireAdmin, validateBody(adminCreateBacSubjectSchema), async (req, res) => {
  try {
    await ensureBacDataReady();
    const payload = req.body as z.infer<typeof adminCreateBacSubjectSchema>;

    const subjectPdfUrl = await decodeAndSaveBacSubjectPdf(payload.tip, payload.year, payload.subject_pdf);
    let baremPdfUrl: string | null = null;
    if (payload.barem_pdf) {
      baremPdfUrl = await decodeAndSaveBacSubjectPdf(payload.tip, payload.year, payload.barem_pdf);
    }

    const nextId = await getNextBacSubjectId();
    const videoUrl = payload.video_url?.trim() ? normalizeVimeoUrl(payload.video_url) : null;

    const created = await pgPool.query(
      `INSERT INTO bac_subjects
         (id, name, materie_id, year, tip, subject_pdf_url, barem_pdf_url, video_url, duration_minutes, price_lei, status, profile_id)
       VALUES ($1, $2, 1, $3, $4, $5, $6, $7, 180, 0, $8, $9)
       RETURNING id, name, year, tip, subject_pdf_url, barem_pdf_url, video_url, duration_minutes, price_lei, status, profile_id, created_at::text`,
      [nextId, payload.name, payload.year, payload.tip, subjectPdfUrl, baremPdfUrl, videoUrl, payload.status, payload.profile_id],
    );

    res.status(201).json({ data: created.rows[0] });
  } catch (error) {
    if (error instanceof BacPdfValidationError) {
      res.status(400).json({ error: error.message, code: "INVALID_PDF" });
      return;
    }
    if (error instanceof BacVimeoValidationError) {
      res.status(400).json({ error: error.message, code: "INVALID_VIMEO_URL" });
      return;
    }
    console.error("Failed to create bac subject:", error);
    res.status(500).json({ error: "Failed to create bac subject", code: "INTERNAL_ERROR" });
  }
});

bacRouter.put("/admin/subjects/:id", requireAuth, requireAdmin, validateBody(adminUpdateBacSubjectSchema), async (req, res) => {
  try {
    await ensureBacDataReady();
    const subjectId = Number(req.params.id);
    if (!Number.isFinite(subjectId) || subjectId <= 0) {
      res.status(400).json({ error: "Invalid subject id", code: "INVALID_SUBJECT_ID" });
      return;
    }

    const existing = await pgPool.query<{
      id: string | number;
      tip: string;
      year: number | null;
    }>(`SELECT id, tip, year FROM bac_subjects WHERE id = $1 AND materie_id = 1 LIMIT 1`, [subjectId]);
    const row = existing.rows[0];
    if (!row) {
      res.status(404).json({ error: "Subject not found", code: "NOT_FOUND" });
      return;
    }

    const payload = req.body as z.infer<typeof adminUpdateBacSubjectSchema>;
    const tip = payload.tip ?? row.tip;
    const year = payload.year ?? Number(row.year);

    let subjectPdfUrl: string | undefined;
    let baremPdfUrl: string | undefined;
    if (payload.subject_pdf) {
      subjectPdfUrl = await decodeAndSaveBacSubjectPdf(tip, year, payload.subject_pdf);
    }
    if (payload.barem_pdf) {
      baremPdfUrl = await decodeAndSaveBacSubjectPdf(tip, year, payload.barem_pdf);
    }

    let videoUrl: string | null | undefined;
    if (payload.video_url === undefined) {
      videoUrl = undefined;
    } else if (payload.video_url === null || payload.video_url === "") {
      videoUrl = null;
    } else {
      videoUrl = normalizeVimeoUrl(payload.video_url);
    }

    const updated = await pgPool.query(
      `UPDATE bac_subjects
       SET name = COALESCE($2, name),
           year = COALESCE($3, year),
           tip = COALESCE($4, tip),
           profile_id = COALESCE($5, profile_id),
           status = COALESCE($6, status),
           video_url = CASE WHEN $7::boolean THEN $8 ELSE video_url END,
           subject_pdf_url = COALESCE($9, subject_pdf_url),
           barem_pdf_url = COALESCE($10, barem_pdf_url)
       WHERE id = $1 AND materie_id = 1
       RETURNING id, name, year, tip, subject_pdf_url, barem_pdf_url, video_url, duration_minutes, price_lei, status, profile_id, created_at::text`,
      [
        subjectId,
        payload.name ?? null,
        payload.year ?? null,
        payload.tip ?? null,
        payload.profile_id ?? null,
        payload.status ?? null,
        videoUrl !== undefined,
        videoUrl ?? null,
        subjectPdfUrl ?? null,
        baremPdfUrl ?? null,
      ],
    );

    res.json({ data: updated.rows[0] });
  } catch (error) {
    if (error instanceof BacPdfValidationError) {
      res.status(400).json({ error: error.message, code: "INVALID_PDF" });
      return;
    }
    if (error instanceof BacVimeoValidationError) {
      res.status(400).json({ error: error.message, code: "INVALID_VIMEO_URL" });
      return;
    }
    console.error("Failed to update bac subject:", error);
    res.status(500).json({ error: "Failed to update bac subject", code: "INTERNAL_ERROR" });
  }
});

export { bacRouter };
