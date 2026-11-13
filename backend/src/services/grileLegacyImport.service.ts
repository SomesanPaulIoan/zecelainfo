import type { PoolClient } from "pg";
import { pgPool } from "../db/postgres";

/** Marchează încercările importate din zecelagrile.ro (re-import șterge doar acestea). */
export const GRILE_LEGACY_IMPORT_SELECTED_ANSWERS = "LEGACY_IMPORT";

const DEFAULT_EXPORT_URL = "https://zecelagrile.ro/api/export-user-progress.php";

export type LegacyExportUser = {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type LegacyExportSubscription = {
  exists: boolean;
  id: number | null;
  status: string | null;
  current_period_end: string | null;
  price_id: string | null;
  is_valid_now: boolean;
};

export type LegacySolvedCorrect = {
  grilaID: number;
  lastSolvedAt: string;
  timesSolved: number;
};

export type LegacySolvedWrong = {
  grilaID: number;
  lastMistakeAt: string;
  mistakeCount: number;
};

export type LegacyGrilaListItem = {
  grilaID: number;
  addedAt: string;
};

export type LegacyExportMeta = {
  correct_count: number;
  wrong_count: number;
  my_list_count: number;
  my_questions_count: number;
  exported_at: string;
};

export type LegacyExportSuccess = {
  success: true;
  user: LegacyExportUser;
  subscription: LegacyExportSubscription;
  solved_correct: LegacySolvedCorrect[];
  solved_wrong: LegacySolvedWrong[];
  my_list: LegacyGrilaListItem[];
  my_questions: LegacyGrilaListItem[];
  meta: LegacyExportMeta;
};

export type LegacyExportFailure = {
  success: false;
  error: string;
  message?: string;
};

export type LegacyExportResponse = LegacyExportSuccess | LegacyExportFailure;

export type LegacyImportStats = {
  attempts_correct_inserted: number;
  attempts_wrong_inserted: number;
  my_list_updated: number;
  my_questions_updated: number;
  subscription_applied: boolean;
  skipped_unknown_grila_ids: number[];
  legacy_user_id: number;
  legacy_email: string;
};

/** Contul zecelagrile.ro a fost deja importat pe alt cont zecelainfo.ro. */
export class LegacyUserAlreadyImportedError extends Error {
  constructor() {
    super("legacy_user_already_imported");
    this.name = "LegacyUserAlreadyImportedError";
  }
}

function legacyExportApiKey(): string {
  return (process.env.ZECE_LA_GRILE_EXPORT_API_KEY ?? "").trim();
}

function legacyExportApiUrl(): string {
  return (process.env.ZECE_LA_GRILE_EXPORT_API_URL ?? DEFAULT_EXPORT_URL).trim();
}

export function isLegacyGrileImportConfigured(): boolean {
  return Boolean(legacyExportApiKey());
}

export function parseLegacyDateTime(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;
  const normalized = value.trim().replace(" ", "T");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** `login` = username sau email cont vechi; API-ul extern îl primește în câmpul `email`. */
export async function fetchLegacyGrileProgress(login: string, password: string): Promise<LegacyExportResponse> {
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
      body: JSON.stringify({ email: login.trim(), password }),
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

    const payload = data as LegacyExportResponse & { http_code?: number };

    if (!payload.success) {
      return payload;
    }

    return payload;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { success: false, error: "timeout" };
    }
    console.error("Legacy grile export request failed:", error);
    return { success: false, error: "network_error" };
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveQuestionIdsByLegacyIds(
  client: PoolClient,
  legacyIds: number[],
): Promise<Map<number, { id: string; answer: string | null }>> {
  const unique = [...new Set(legacyIds.filter((id) => Number.isFinite(id) && id > 0))];
  const map = new Map<number, { id: string; answer: string | null }>();
  if (unique.length === 0) return map;

  const chunkSize = 500;
  for (let offset = 0; offset < unique.length; offset += chunkSize) {
    const chunk = unique.slice(offset, offset + chunkSize);
    const result = await client.query<{ legacy_id: number; id: string; answer: string | null }>(
      `SELECT legacy_id, id, answer
       FROM grile_questions
       WHERE legacy_id = ANY($1::int[])`,
      [chunk],
    );
    for (const row of result.rows) {
      map.set(row.legacy_id, { id: row.id, answer: row.answer });
    }
  }
  return map;
}

async function importSubscription(
  client: PoolClient,
  userId: string,
  subscription: LegacyExportSubscription,
  legacyUser: LegacyExportUser,
): Promise<boolean> {
  if (!subscription.exists || !subscription.is_valid_now || !subscription.current_period_end) {
    return false;
  }

  const endsAt = parseLegacyDateTime(subscription.current_period_end);
  if (!endsAt || endsAt.getTime() <= Date.now()) {
    return false;
  }

  const endsAtIso = endsAt.toISOString();
  const planCode = "legacy_import";
  const planName = "Import Zece la Grile";

  const currentResult = await client.query<{ access_until: string | null }>(
    `SELECT access_until::text
     FROM user_grile_access
     WHERE user_id = $1
     LIMIT 1
     FOR UPDATE`,
    [userId],
  );
  const currentUntil = currentResult.rows[0]?.access_until;
  const currentMs = currentUntil ? new Date(currentUntil).getTime() : 0;
  const nextMs = Math.max(currentMs, endsAt.getTime());
  const nextUntilIso = new Date(nextMs).toISOString();

  await client.query(
    `INSERT INTO user_grile_access (user_id, access_until, trial_used, current_plan_code, updated_at)
     VALUES ($1, $2, false, $3, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET
       access_until = EXCLUDED.access_until,
       current_plan_code = EXCLUDED.current_plan_code,
       updated_at = NOW()`,
    [userId, nextUntilIso, planCode],
  );

  await client.query(
    `INSERT INTO user_grile_access_events (
       user_id, plan_code, plan_name, starts_at, ends_at, is_free, is_paid, billing_snapshot
     )
     VALUES ($1, $2, $3, NOW(), $4, TRUE, FALSE, $5::jsonb)`,
    [
      userId,
      planCode,
      planName,
      nextUntilIso,
      JSON.stringify({
        source: "zecelagrile.ro",
        legacy_user_id: legacyUser.id,
        legacy_subscription_id: subscription.id,
        legacy_status: subscription.status,
        legacy_price_id: subscription.price_id,
      }),
    ],
  );

  return true;
}

async function insertLegacyAttempts(
  client: PoolClient,
  userId: string,
  rows: Array<{ questionId: string; selectedAnswers: string; isCorrect: boolean; attemptedAt: Date }>,
): Promise<number> {
  if (rows.length === 0) return 0;

  const values: unknown[] = [];
  const tuples: string[] = [];
  let param = 1;

  for (const row of rows) {
    tuples.push(`($${param++}, $${param++}, $${param++}, $${param++}, $${param++})`);
    values.push(userId, row.questionId, row.selectedAnswers, row.isCorrect, row.attemptedAt.toISOString());
  }

  await client.query(
    `INSERT INTO grile_user_attempts (user_id, question_id, selected_answers, is_correct, attempted_at)
     VALUES ${tuples.join(", ")}`,
    values,
  );

  return rows.length;
}

async function upsertQuestionStates(
  client: PoolClient,
  userId: string,
  entries: Array<{ questionId: string; isFlagged: boolean; inMyList: boolean; updatedAt: Date }>,
): Promise<{ myList: number; myQuestions: number }> {
  let myList = 0;
  let myQuestions = 0;
  if (entries.length === 0) return { myList, myQuestions };

  for (const entry of entries) {
    if (entry.inMyList) myList += 1;
    if (entry.isFlagged) myQuestions += 1;
    await client.query(
      `INSERT INTO grile_user_question_state (user_id, question_id, is_flagged, in_my_list, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, question_id)
       DO UPDATE SET
         is_flagged = grile_user_question_state.is_flagged OR EXCLUDED.is_flagged,
         in_my_list = grile_user_question_state.in_my_list OR EXCLUDED.in_my_list,
         updated_at = GREATEST(grile_user_question_state.updated_at, EXCLUDED.updated_at)`,
      [userId, entry.questionId, entry.isFlagged, entry.inMyList, entry.updatedAt.toISOString()],
    );
  }

  return { myList, myQuestions };
}

function normalizeLegacyEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getLegacyImportOwnerByLegacyUserId(
  legacyUserId: number,
): Promise<{ user_id: string } | null> {
  const result = await pgPool.query<{ user_id: string }>(
    `SELECT user_id::text
     FROM grile_legacy_import_log
     WHERE legacy_user_id = $1
     LIMIT 1`,
    [legacyUserId],
  );
  return result.rows[0] ?? null;
}

export async function getLegacyImportOwnerByLegacyEmail(
  legacyEmail: string,
): Promise<{ user_id: string; legacy_user_id: number } | null> {
  const normalized = normalizeLegacyEmail(legacyEmail);
  if (!normalized) return null;
  const result = await pgPool.query<{ user_id: string; legacy_user_id: number }>(
    `SELECT user_id::text, legacy_user_id
     FROM grile_legacy_import_log
     WHERE lower(legacy_email) = $1
     LIMIT 1`,
    [normalized],
  );
  return result.rows[0] ?? null;
}

/** Un cont zecelagrile.ro poate fi importat o singură dată (fără re-import). */
export async function assertLegacyUserImportAllowed(
  _userId: string,
  legacyUserId: number,
  legacyEmail: string,
): Promise<void> {
  const byLegacyId = await getLegacyImportOwnerByLegacyUserId(legacyUserId);
  if (byLegacyId) {
    throw new LegacyUserAlreadyImportedError();
  }

  const byEmail = await getLegacyImportOwnerByLegacyEmail(legacyEmail);
  if (byEmail) {
    throw new LegacyUserAlreadyImportedError();
  }
}

export async function importLegacyGrileProgress(
  userId: string,
  payload: LegacyExportSuccess,
): Promise<LegacyImportStats> {
  const client = await pgPool.connect();
  const skipped = new Set<number>();

  try {
    await client.query("BEGIN");

    const existingClaim = await client.query<{ user_id: string }>(
      `SELECT user_id::text
       FROM grile_legacy_import_log
       WHERE legacy_user_id = $1
       LIMIT 1
       FOR UPDATE`,
      [payload.user.id],
    );
    if (existingClaim.rows[0]) {
      throw new LegacyUserAlreadyImportedError();
    }

    const existingClaimByEmail = await client.query<{ user_id: string }>(
      `SELECT user_id::text
       FROM grile_legacy_import_log
       WHERE lower(legacy_email) = $1
       LIMIT 1
       FOR UPDATE`,
      [normalizeLegacyEmail(payload.user.email)],
    );
    if (existingClaimByEmail.rows[0]) {
      throw new LegacyUserAlreadyImportedError();
    }

    await client.query(
      `DELETE FROM grile_user_attempts
       WHERE user_id = $1 AND selected_answers = $2`,
      [userId, GRILE_LEGACY_IMPORT_SELECTED_ANSWERS],
    );

    const allLegacyIds = [
      ...payload.solved_correct.map((item) => item.grilaID),
      ...payload.solved_wrong.map((item) => item.grilaID),
      ...payload.my_list.map((item) => item.grilaID),
      ...payload.my_questions.map((item) => item.grilaID),
    ];
    const questionByLegacy = await resolveQuestionIdsByLegacyIds(client, allLegacyIds);

    const correctRows: Array<{
      questionId: string;
      selectedAnswers: string;
      isCorrect: boolean;
      attemptedAt: Date;
    }> = [];

    for (const item of payload.solved_correct) {
      const question = questionByLegacy.get(item.grilaID);
      if (!question) {
        skipped.add(item.grilaID);
        continue;
      }
      const attemptedAt = parseLegacyDateTime(item.lastSolvedAt) ?? new Date();
      const times = Math.max(1, Math.floor(item.timesSolved ?? 1));
      for (let i = 0; i < times; i += 1) {
        correctRows.push({
          questionId: question.id,
          selectedAnswers: GRILE_LEGACY_IMPORT_SELECTED_ANSWERS,
          isCorrect: true,
          attemptedAt,
        });
      }
    }

    const wrongRows: Array<{
      questionId: string;
      selectedAnswers: string;
      isCorrect: boolean;
      attemptedAt: Date;
    }> = [];

    for (const item of payload.solved_wrong) {
      const question = questionByLegacy.get(item.grilaID);
      if (!question) {
        skipped.add(item.grilaID);
        continue;
      }
      const attemptedAt = parseLegacyDateTime(item.lastMistakeAt) ?? new Date();
      const times = Math.max(1, Math.floor(item.mistakeCount ?? 1));
      for (let i = 0; i < times; i += 1) {
        wrongRows.push({
          questionId: question.id,
          selectedAnswers: GRILE_LEGACY_IMPORT_SELECTED_ANSWERS,
          isCorrect: false,
          attemptedAt,
        });
      }
    }

    const stateByQuestion = new Map<
      string,
      { questionId: string; isFlagged: boolean; inMyList: boolean; updatedAt: Date }
    >();

    for (const item of payload.my_list) {
      const question = questionByLegacy.get(item.grilaID);
      if (!question) {
        skipped.add(item.grilaID);
        continue;
      }
      const updatedAt = parseLegacyDateTime(item.addedAt) ?? new Date();
      const existing = stateByQuestion.get(question.id);
      stateByQuestion.set(question.id, {
        questionId: question.id,
        isFlagged: existing?.isFlagged ?? false,
        inMyList: true,
        updatedAt: existing && existing.updatedAt > updatedAt ? existing.updatedAt : updatedAt,
      });
    }

    for (const item of payload.my_questions) {
      const question = questionByLegacy.get(item.grilaID);
      if (!question) {
        skipped.add(item.grilaID);
        continue;
      }
      const updatedAt = parseLegacyDateTime(item.addedAt) ?? new Date();
      const existing = stateByQuestion.get(question.id);
      stateByQuestion.set(question.id, {
        questionId: question.id,
        isFlagged: true,
        inMyList: existing?.inMyList ?? false,
        updatedAt: existing && existing.updatedAt > updatedAt ? existing.updatedAt : updatedAt,
      });
    }

    const attemptsCorrectInserted = await insertLegacyAttempts(client, userId, correctRows);
    const attemptsWrongInserted = await insertLegacyAttempts(client, userId, wrongRows);
    const stateStats = await upsertQuestionStates(client, userId, [...stateByQuestion.values()]);
    const subscriptionApplied = await importSubscription(client, userId, payload.subscription, payload.user);

    const logInsert = await client.query(
      `INSERT INTO grile_legacy_import_log (
         user_id, legacy_user_id, legacy_email, meta, imported_at, updated_at
       )
       VALUES ($1, $2, $3, $4::jsonb, NOW(), NOW())`,
      [
        userId,
        payload.user.id,
        payload.user.email,
        JSON.stringify({
          ...payload.meta,
          attempts_correct_inserted: attemptsCorrectInserted,
          attempts_wrong_inserted: attemptsWrongInserted,
          skipped_unknown_grila_ids: [...skipped],
        }),
      ],
    );
    if (logInsert.rowCount !== 1) {
      throw new LegacyUserAlreadyImportedError();
    }

    await client.query("COMMIT");

    return {
      attempts_correct_inserted: attemptsCorrectInserted,
      attempts_wrong_inserted: attemptsWrongInserted,
      my_list_updated: stateStats.myList,
      my_questions_updated: stateStats.myQuestions,
      subscription_applied: subscriptionApplied,
      skipped_unknown_grila_ids: [...skipped].sort((a, b) => a - b),
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
      throw new LegacyUserAlreadyImportedError();
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function getLegacyImportLog(userId: string) {
  const result = await pgPool.query<{
    legacy_user_id: number;
    legacy_email: string;
    imported_at: string;
    meta: Record<string, unknown>;
  }>(
    `SELECT legacy_user_id, legacy_email, imported_at::text, meta
     FROM grile_legacy_import_log
     WHERE user_id = $1
     LIMIT 1`,
    [userId],
  );
  return result.rows[0] ?? null;
}
