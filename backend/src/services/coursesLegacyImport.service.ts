import type { PoolClient } from "pg";
import { pgPool } from "../db/postgres";

const DEFAULT_EXPORT_URL = "https://zecelaexamene.ro/api/export-user-courses";

export type ExameneLegacyExportUser = {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type ExameneLegacyCourseAccess = {
  courseID: number;
  partID: number | null;
  expiresAt: string | null;
  isValidNow: boolean;
};

export type ExameneLegacyExportMeta = {
  courses_count: number;
  parts_count: number;
  access_rows_count: number;
  exported_at: string;
};

export type ExameneLegacyExportSuccess = {
  success: true;
  user: ExameneLegacyExportUser;
  courses: unknown[];
  course_access: ExameneLegacyCourseAccess[];
  meta: ExameneLegacyExportMeta;
};

export type ExameneLegacyExportFailure = {
  success: false;
  error: string;
  message?: string;
};

export type ExameneLegacyExportResponse = ExameneLegacyExportSuccess | ExameneLegacyExportFailure;

export type CoursesLegacyImportStats = {
  parts_granted: number;
  parts_updated: number;
  history_rows_inserted: number;
  skipped_unknown_course_ids: number[];
  skipped_unknown_part_ids: number[];
  skipped_expired_rows: number;
  legacy_user_id: number;
  legacy_email: string;
};

/** Contul zecelaexamene.ro a fost deja importat pe alt cont zecelainfo.ro. */
export class ExameneLegacyUserAlreadyImportedError extends Error {
  constructor() {
    super("legacy_user_already_imported");
    this.name = "ExameneLegacyUserAlreadyImportedError";
  }
}

function legacyExportApiKey(): string {
  return (process.env.ZECE_LA_EXAMENE_EXPORT_API_KEY ?? "").trim();
}

function legacyExportApiUrl(): string {
  return (process.env.ZECE_LA_EXAMENE_EXPORT_API_URL ?? DEFAULT_EXPORT_URL).trim();
}

export function isLegacyCoursesImportConfigured(): boolean {
  return Boolean(legacyExportApiKey());
}

export function parseLegacyDateTime(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;
  const normalized = value.trim().replace(" ", "T");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function fetchLegacyExameneCourses(
  email: string,
  password: string,
): Promise<ExameneLegacyExportResponse> {
  const apiKey = legacyExportApiKey();
  if (!apiKey) {
    return { success: false, error: "import_not_configured" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await fetch(legacyExportApiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({ email: email.trim(), password }),
      signal: controller.signal,
    });

    const raw = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(raw) as unknown;
    } catch {
      return { success: false, error: "invalid_response" };
    }

    if (!data || typeof data !== "object") {
      return { success: false, error: "invalid_response" };
    }

    return data as ExameneLegacyExportResponse;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { success: false, error: "timeout" };
    }
    console.error("Legacy examene courses export request failed:", error);
    return { success: false, error: "network_error" };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeLegacyEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isFullCourseAccess(partId: number | null | undefined): boolean {
  return partId === null || partId === undefined || partId === 0;
}

type CourseByLegacy = { id: string; slug: string; name: string };
type PartByLegacy = { id: string; course_id: string };

async function resolveCoursesByLegacyIds(
  client: PoolClient,
  legacyIds: number[],
): Promise<Map<number, CourseByLegacy>> {
  const unique = [...new Set(legacyIds.filter((id) => Number.isFinite(id) && id > 0))];
  const map = new Map<number, CourseByLegacy>();
  if (unique.length === 0) return map;

  const result = await client.query<{ legacy_id: number; id: string; slug: string; name: string }>(
    `SELECT legacy_id, id::text, slug, name
     FROM courses
     WHERE legacy_id = ANY($1::int[])`,
    [unique],
  );
  for (const row of result.rows) {
    map.set(row.legacy_id, { id: row.id, slug: row.slug, name: row.name });
  }
  return map;
}

async function resolvePartsByLegacyIds(
  client: PoolClient,
  legacyIds: number[],
): Promise<Map<number, PartByLegacy>> {
  const unique = [...new Set(legacyIds.filter((id) => Number.isFinite(id) && id > 0))];
  const map = new Map<number, PartByLegacy>();
  if (unique.length === 0) return map;

  const result = await client.query<{ legacy_id: number; id: string; course_id: string }>(
    `SELECT legacy_id, id::text, course_id::text
     FROM course_parts
     WHERE legacy_id = ANY($1::int[])`,
    [unique],
  );
  for (const row of result.rows) {
    map.set(row.legacy_id, { id: row.id, course_id: row.course_id });
  }
  return map;
}

async function listPublishedPartIdsForCourse(client: PoolClient, courseId: string): Promise<string[]> {
  const result = await client.query<{ id: string }>(
    `SELECT id::text
     FROM course_parts
     WHERE course_id = $1 AND is_published = true
     ORDER BY order_index ASC`,
    [courseId],
  );
  return result.rows.map((row) => row.id);
}

function mergeAccessUntilSql(): string {
  return `CASE
    WHEN user_course_part_access.access_until IS NULL OR EXCLUDED.access_until IS NULL THEN NULL
    ELSE GREATEST(user_course_part_access.access_until, EXCLUDED.access_until)
  END`;
}

async function upsertPartAccess(
  client: PoolClient,
  userId: string,
  courseId: string,
  partId: string,
  accessUntilIso: string | null,
): Promise<"inserted" | "updated" | "unchanged"> {
  const existing = await client.query<{ access_until: string | null }>(
    `SELECT access_until::text
     FROM user_course_part_access
     WHERE user_id = $1 AND course_part_id = $2
     LIMIT 1`,
    [userId, partId],
  );

  await client.query(
    `INSERT INTO user_course_part_access (user_id, course_id, course_part_id, access_until)
     VALUES ($1, $2, $3, $4::timestamptz)
     ON CONFLICT (user_id, course_part_id)
     DO UPDATE SET access_until = ${mergeAccessUntilSql()}, is_trial = FALSE`,
    [userId, courseId, partId, accessUntilIso],
  );

  if (!existing.rows[0]) return "inserted";
  return "updated";
}

type CourseGrantBatch = {
  courseId: string;
  courseSlug: string;
  courseName: string;
  partIds: string[];
  accessUntilIso: string | null;
};

function mergeCourseAccessUntil(current: string | null, incoming: string | null): string | null {
  if (current === null || incoming === null) return null;
  return new Date(incoming) > new Date(current) ? incoming : current;
}

function buildCourseGrantBatches(
  grantTargets: Map<string, { courseId: string; accessUntilIso: string | null }>,
  courseById: Map<string, CourseByLegacy>,
): CourseGrantBatch[] {
  const byCourse = new Map<string, CourseGrantBatch>();

  for (const [key, target] of grantTargets) {
    const partId = key.split(":")[1];
    if (!partId) continue;
    const course = courseById.get(target.courseId);
    if (!course) continue;

    const existing = byCourse.get(target.courseId);
    if (!existing) {
      byCourse.set(target.courseId, {
        courseId: target.courseId,
        courseSlug: course.slug,
        courseName: course.name,
        partIds: [partId],
        accessUntilIso: target.accessUntilIso,
      });
      continue;
    }
    if (!existing.partIds.includes(partId)) {
      existing.partIds.push(partId);
    }
    existing.accessUntilIso = mergeCourseAccessUntil(existing.accessUntilIso, target.accessUntilIso);
  }

  return [...byCourse.values()];
}

async function insertLegacyImportPaymentHistory(
  client: PoolClient,
  userId: string,
  batch: CourseGrantBatch,
  legacyUser: ExameneLegacyExportUser,
): Promise<void> {
  const accessUntilLabel = batch.accessUntilIso
    ? new Date(batch.accessUntilIso).toLocaleDateString("ro-RO")
    : "nelimitat";

  await client.query(
    `INSERT INTO user_course_payment_attempts (
       user_id, course_id, course_slug, mode, part_ids_to_grant,
       amount_total, amount_subtotal, amount_discount, currency, invoice_lines,
       status, paid_at, billing_snapshot, terms_accepted_at, updated_at
     )
     VALUES ($1, $2, $3, 'legacy_import', $4::uuid[], 0, 0, 0, 'RON', '[]'::jsonb,
       'paid', NOW(), $5::jsonb, NOW(), NOW())`,
    [
      userId,
      batch.courseId,
      batch.courseSlug,
      batch.partIds,
      JSON.stringify({
        source: "zecelaexamene.ro",
        legacy_user_id: legacyUser.id,
        legacy_email: legacyUser.email,
        label: `Transfer acces cursuri Zece la Examene (pana la ${accessUntilLabel})`,
      }),
    ],
  );
}

export async function getExameneLegacyImportOwnerByLegacyUserId(
  legacyUserId: number,
): Promise<{ user_id: string } | null> {
  const result = await pgPool.query<{ user_id: string }>(
    `SELECT user_id::text
     FROM courses_legacy_import_log
     WHERE legacy_user_id = $1
     LIMIT 1`,
    [legacyUserId],
  );
  return result.rows[0] ?? null;
}

export async function getExameneLegacyImportOwnerByLegacyEmail(
  legacyEmail: string,
): Promise<{ user_id: string; legacy_user_id: number } | null> {
  const normalized = normalizeLegacyEmail(legacyEmail);
  if (!normalized) return null;
  const result = await pgPool.query<{ user_id: string; legacy_user_id: number }>(
    `SELECT user_id::text, legacy_user_id
     FROM courses_legacy_import_log
     WHERE lower(legacy_email) = $1
     LIMIT 1`,
    [normalized],
  );
  return result.rows[0] ?? null;
}

export async function assertExameneLegacyUserImportAllowed(
  _userId: string,
  legacyUserId: number,
  legacyEmail: string,
): Promise<void> {
  const byLegacyId = await getExameneLegacyImportOwnerByLegacyUserId(legacyUserId);
  if (byLegacyId) {
    throw new ExameneLegacyUserAlreadyImportedError();
  }

  const byEmail = await getExameneLegacyImportOwnerByLegacyEmail(legacyEmail);
  if (byEmail) {
    throw new ExameneLegacyUserAlreadyImportedError();
  }
}

export async function importLegacyExameneCourses(
  userId: string,
  payload: ExameneLegacyExportSuccess,
): Promise<CoursesLegacyImportStats> {
  const client = await pgPool.connect();
  const skippedCourses = new Set<number>();
  const skippedParts = new Set<number>();
  let skippedExpired = 0;
  let partsGranted = 0;
  let partsUpdated = 0;
  let historyRowsInserted = 0;

  try {
    await client.query("BEGIN");

    const existingClaim = await client.query<{ user_id: string }>(
      `SELECT user_id::text
       FROM courses_legacy_import_log
       WHERE legacy_user_id = $1
       LIMIT 1
       FOR UPDATE`,
      [payload.user.id],
    );
    if (existingClaim.rows[0]) {
      throw new ExameneLegacyUserAlreadyImportedError();
    }

    const existingClaimByEmail = await client.query<{ user_id: string }>(
      `SELECT user_id::text
       FROM courses_legacy_import_log
       WHERE lower(legacy_email) = $1
       LIMIT 1
       FOR UPDATE`,
      [normalizeLegacyEmail(payload.user.email)],
    );
    if (existingClaimByEmail.rows[0]) {
      throw new ExameneLegacyUserAlreadyImportedError();
    }

    /**
     * E site nou: indiferent daca accesul era expirat sau nu pe zecelaexamene.ro, orice
     * curs gasit in export primeste acces pana la aceeasi data fixa, ca gest de bun-venit.
     */
    const LEGACY_IMPORT_ACCESS_UNTIL_ISO = "2027-10-01T00:00:00.000Z";
    const validRows = payload.course_access;
    skippedExpired = 0;

    /**
     * Pe zecelaexamene.ro, cursul vechi "Bacalaureat Informatica" (legacy id 1) a fost
     * inlocuit de varianta "Bacalaureat Informatica MI" (legacy id 15); doar a doua a fost
     * migrata ca curs propriu-zis in zecelainfo, deci id 1 nu exista in tabela courses. Cele
     * doua cursuri vechi nu au parti analoge intre ele, asa ca orice acces gasit pe oricare
     * din cele doua id-uri (integral sau doar pe o parte) acorda acces integral la cursul nou,
     * cu cea mai mare data de expirare dintre toate randurile gasite.
     */
    const MERGED_LEGACY_COURSE_ALIASES = new Map<number, number>([[1, 15]]);
    const FORCE_FULL_ACCESS_LEGACY_COURSE_IDS = new Set<number>([1, 15]);
    const resolveLegacyCourseId = (rawLegacyCourseId: number): number =>
      MERGED_LEGACY_COURSE_ALIASES.get(rawLegacyCourseId) ?? rawLegacyCourseId;

    const courseLegacyIds = validRows.map((row) => resolveLegacyCourseId(row.courseID));
    const partLegacyIds = validRows
      .map((row) => row.partID)
      .filter((partId): partId is number => !isFullCourseAccess(partId));

    const courseByLegacy = await resolveCoursesByLegacyIds(client, courseLegacyIds);
    const partByLegacy = await resolvePartsByLegacyIds(client, partLegacyIds);

    const partsCacheByCourse = new Map<string, string[]>();
    const grantTargets = new Map<string, { courseId: string; accessUntilIso: string | null }>();

    for (const row of validRows) {
      const rawLegacyCourseId = Number(row.courseID);
      const legacyCourseId = resolveLegacyCourseId(rawLegacyCourseId);
      const course = courseByLegacy.get(legacyCourseId);
      if (!course) {
        skippedCourses.add(legacyCourseId);
        continue;
      }

      const accessUntilIso = LEGACY_IMPORT_ACCESS_UNTIL_ISO;

      if (isFullCourseAccess(row.partID) || FORCE_FULL_ACCESS_LEGACY_COURSE_IDS.has(rawLegacyCourseId)) {
        let partIds = partsCacheByCourse.get(course.id);
        if (!partIds) {
          partIds = await listPublishedPartIdsForCourse(client, course.id);
          partsCacheByCourse.set(course.id, partIds);
        }
        for (const partId of partIds) {
          const key = `${course.id}:${partId}`;
          const existing = grantTargets.get(key);
          if (!existing) {
            grantTargets.set(key, { courseId: course.id, accessUntilIso });
            continue;
          }
          if (accessUntilIso === null || existing.accessUntilIso === null) {
            existing.accessUntilIso = null;
          } else if (existing.accessUntilIso && new Date(accessUntilIso) > new Date(existing.accessUntilIso)) {
            existing.accessUntilIso = accessUntilIso;
          }
        }
        continue;
      }

      const legacyPartId = Number(row.partID);
      const part = partByLegacy.get(legacyPartId);
      if (!part || part.course_id !== course.id) {
        skippedParts.add(legacyPartId);
        continue;
      }

      const key = `${course.id}:${part.id}`;
      const existing = grantTargets.get(key);
      if (!existing) {
        grantTargets.set(key, { courseId: course.id, accessUntilIso });
        continue;
      }
      if (accessUntilIso === null || existing.accessUntilIso === null) {
        existing.accessUntilIso = null;
      } else if (existing.accessUntilIso && new Date(accessUntilIso) > new Date(existing.accessUntilIso)) {
        existing.accessUntilIso = accessUntilIso;
      }
    }

    const courseById = new Map<string, CourseByLegacy>();
    for (const course of courseByLegacy.values()) {
      courseById.set(course.id, course);
    }
    const grantBatches = buildCourseGrantBatches(grantTargets, courseById);

    for (const [key, target] of grantTargets) {
      const partId = key.split(":")[1];
      if (!partId) continue;
      const outcome = await upsertPartAccess(client, userId, target.courseId, partId, target.accessUntilIso);
      if (outcome === "inserted") partsGranted += 1;
      else if (outcome === "updated") partsUpdated += 1;
    }

    for (const batch of grantBatches) {
      if (batch.partIds.length === 0) continue;
      await insertLegacyImportPaymentHistory(client, userId, batch, payload.user);
      historyRowsInserted += 1;
    }

    const logInsert = await client.query(
      `INSERT INTO courses_legacy_import_log (
         user_id, legacy_user_id, legacy_email, meta, imported_at, updated_at
       )
       VALUES ($1, $2, $3, $4::jsonb, NOW(), NOW())`,
      [
        userId,
        payload.user.id,
        payload.user.email,
        JSON.stringify({
          ...payload.meta,
          parts_granted: partsGranted,
          parts_updated: partsUpdated,
          history_rows_inserted: historyRowsInserted,
          skipped_unknown_course_ids: [...skippedCourses].sort((a, b) => a - b),
          skipped_unknown_part_ids: [...skippedParts].sort((a, b) => a - b),
          skipped_expired_rows: skippedExpired,
        }),
      ],
    );
    if (logInsert.rowCount !== 1) {
      throw new ExameneLegacyUserAlreadyImportedError();
    }

    await client.query("COMMIT");

    return {
      parts_granted: partsGranted,
      parts_updated: partsUpdated,
      history_rows_inserted: historyRowsInserted,
      skipped_unknown_course_ids: [...skippedCourses].sort((a, b) => a - b),
      skipped_unknown_part_ids: [...skippedParts].sort((a, b) => a - b),
      skipped_expired_rows: skippedExpired,
      legacy_user_id: payload.user.id,
      legacy_email: payload.user.email,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    ) {
      throw new ExameneLegacyUserAlreadyImportedError();
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function getExameneLegacyImportLog(userId: string) {
  const result = await pgPool.query<{
    legacy_user_id: number;
    legacy_email: string;
    imported_at: string;
    meta: Record<string, unknown>;
  }>(
    `SELECT legacy_user_id, legacy_email, imported_at::text, meta
     FROM courses_legacy_import_log
     WHERE user_id = $1
     LIMIT 1`,
    [userId],
  );
  return result.rows[0] ?? null;
}
