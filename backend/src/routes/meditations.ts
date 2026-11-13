import { promises as fs } from "node:fs";
import { Router } from "express";
import { z } from "zod";
import { ensureGrileTables } from "./grile";
import { pgPool } from "../db/postgres";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  downloadSmartbillInvoicePdf,
  getAppBaseUrl,
  getMeditationsRevolutConfig,
  getMeditationsSmartbillConfig,
  issueSmartbillInvoiceWithProducts,
  MEDITATIONS_INVOICES_DIR,
  persistInvoicePdfToDirectory,
  revolutCreateOrder,
  revolutFetchOrder,
  sanitizeInvoiceFileName,
} from "../services/revolutSmartbill.service";
import { billingProfileActivateSchema, persistUserBillingProfile } from "../services/userBillingProfile.service";
import {
  sendHomeworkPublishedEmail,
  sendMeditationPaymentReminderEmail,
  sendMeditationSignupConfirmationEmail,
  sendPurchaseThankYouEmail,
} from "../services/email.service";
import { ensureMeditationsSignupDiscountCode } from "../services/discountCode.service";

function routeIdParam(raw: string | string[] | undefined): string {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw[0] ?? "";
  return "";
}

function meditationSessionIdParam(raw: string | string[] | undefined): string {
  return routeIdParam(raw);
}

const createLeadSchema = z.object({
  full_name: z.string().min(3).max(120),
  email: z.string().email().max(160),
  phone: z.string().min(6).max(32),
  grade: z.string().min(1).max(32),
  message: z.string().max(2000).optional(),
});

const createGroupSchema = z.object({
  name: z.string().min(2).max(120),
  weekday: z.number().int().min(1).max(7),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
});

const updateGroupSchema = createGroupSchema;

const assignUserToGroupSchema = z.object({
  group_id: z.string().uuid().nullable(),
});

const createHomeworkSchema = z
  .object({
    kind: z.enum(["grile", "problems"]),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine((body) => body.end_date >= body.start_date, {
    message: "Data de final trebuie sa fie dupa sau egala cu data de inceput",
    path: ["end_date"],
  });

const addGrileHomeworkItemsSchema = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("source"), source_id: z.string().uuid() }),
  z.object({ scope: z.literal("chapter"), chapter_id: z.string().uuid() }),
]);

const addProblemHomeworkItemSchema = z.object({ problem_id: z.string().uuid() });

const createUserSessionSchema = z.object({
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount_lei: z.number().min(0).max(10000).optional(),
  group_id: z.string().uuid().optional(),
});

const paySessionSchema = z
  .object({
    billingProfile: billingProfileActivateSchema,
    acceptTerms: z.boolean(),
  })
  .refine((data) => data.acceptTerms === true, {
    message: "Trebuie sa accepti termenii si conditiile",
    path: ["acceptTerms"],
  });

async function ensureAdminRole(userId?: string) {
  const roleResult = await pgPool.query<{ role: "student" | "professor" | "admin" }>(
    `SELECT role FROM users WHERE id = $1 LIMIT 1`,
    [userId],
  );
  const role = roleResult.rows[0]?.role;
  return role && ["professor", "admin"].includes(role);
}

type MeditationGroupMembershipRow = {
  group_id: string;
  name: string;
  weekday: number;
  start_time: string;
  end_time: string;
  assigned_at: string;
};

const MEDITATION_GROUP_MEMBERSHIP_SELECT = `SELECT
  g.id AS group_id,
  g.name,
  g.weekday,
  to_char(g.start_time, 'HH24:MI') AS start_time,
  to_char(g.end_time, 'HH24:MI') AS end_time,
  m.assigned_at::text AS assigned_at`;

async function ensureMeditationMembershipsMultiGroup() {
  const pk = await pgPool.query<{ col_count: string }>(
    `SELECT COUNT(*)::text AS col_count
     FROM pg_index i
     JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) AND a.attnum > 0
     WHERE i.indrelid = 'meditation_group_memberships'::regclass
       AND i.indisprimary`,
  );
  if (Number(pk.rows[0]?.col_count ?? 0) === 1) {
    await pgPool.query(`ALTER TABLE meditation_group_memberships DROP CONSTRAINT IF EXISTS meditation_group_memberships_pkey`);
    await pgPool.query(
      `ALTER TABLE meditation_group_memberships ADD CONSTRAINT meditation_group_memberships_pkey PRIMARY KEY (user_id, group_id)`,
    );
  }
}

export async function ensureMeditationsTables() {
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS meditations_leads (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      grade TEXT NOT NULL,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pgPool.query(`ALTER TABLE meditations_leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL`);
  await pgPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_meditations_leads_created_at ON meditations_leads(created_at DESC)`);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS meditation_groups (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 1 AND 7),
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_meditation_groups_weekday_start ON meditation_groups(weekday, start_time)`);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS meditation_group_memberships (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      group_id UUID NOT NULL REFERENCES meditation_groups(id) ON DELETE CASCADE,
      assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
      assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_meditation_memberships_group ON meditation_group_memberships(group_id, assigned_at DESC)`);
  await pgPool.query(
    `CREATE INDEX IF NOT EXISTS idx_meditation_memberships_user ON meditation_group_memberships(user_id, assigned_at DESC)`,
  );
  await ensureMeditationMembershipsMultiGroup();
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS meditation_member_sessions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      group_id UUID NOT NULL REFERENCES meditation_groups(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_date DATE NOT NULL,
      amount_lei NUMERIC(10, 2) NOT NULL DEFAULT 150,
      is_paid BOOLEAN NOT NULL DEFAULT FALSE,
      paid_at TIMESTAMPTZ,
      invoice_number TEXT,
      invoice_url TEXT,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (group_id, user_id, session_date)
    );
  `);
  await pgPool.query(`ALTER TABLE meditation_member_sessions ADD COLUMN IF NOT EXISTS revolut_order_id TEXT`);
  await pgPool.query(`ALTER TABLE meditation_member_sessions ADD COLUMN IF NOT EXISTS billing_snapshot JSONB`);
  await pgPool.query(`ALTER TABLE meditation_member_sessions ADD COLUMN IF NOT EXISTS invoice_local_path TEXT`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_meditation_member_sessions_user_date ON meditation_member_sessions(user_id, session_date DESC)`);
  await ensureGrileTables();
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS meditation_homework_assignments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      group_id UUID NOT NULL REFERENCES meditation_groups(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('grile', 'problems')),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      is_current BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by UUID REFERENCES users(id) ON DELETE SET NULL
    );
  `);
  await pgPool.query(
    `CREATE INDEX IF NOT EXISTS idx_meditation_hw_group_kind_current ON meditation_homework_assignments(group_id, kind) WHERE is_current = true`,
  );
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS meditation_homework_grile_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      assignment_id UUID NOT NULL REFERENCES meditation_homework_assignments(id) ON DELETE CASCADE,
      question_id UUID NOT NULL REFERENCES grile_questions(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (assignment_id, question_id)
    );
  `);
  await pgPool.query(
    `CREATE INDEX IF NOT EXISTS idx_meditation_hw_grile_assignment ON meditation_homework_grile_items(assignment_id)`,
  );
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS meditation_homework_problems_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      assignment_id UUID NOT NULL REFERENCES meditation_homework_assignments(id) ON DELETE CASCADE,
      problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (assignment_id, problem_id)
    );
  `);
  await pgPool.query(
    `CREATE INDEX IF NOT EXISTS idx_meditation_hw_problems_assignment ON meditation_homework_problems_items(assignment_id)`,
  );
}

/** Numarul de iteme al unei teme, indiferent de tip (grile sau probleme). */
const HOMEWORK_ITEM_COUNT_SQL = `(
  CASE a.kind
    WHEN 'grile' THEN (SELECT COUNT(*) FROM meditation_homework_grile_items gi WHERE gi.assignment_id = a.id)
    ELSE (SELECT COUNT(*) FROM meditation_homework_problems_items pi WHERE pi.assignment_id = a.id)
  END
)::int`;

export const meditationsRouter = Router();

meditationsRouter.get("/my-sessions", requireAuth, async (req, res) => {
  try {
    await ensureMeditationsTables();
    const userId = req.user!.id;
    const result = await pgPool.query<{
      id: string;
      group_id: string;
      group_name: string;
      weekday: number;
      start_time: string;
      end_time: string;
      session_date: string;
      amount_lei: number;
      is_paid: boolean;
      paid_at: string | null;
      invoice_number: string | null;
      invoice_url: string | null;
    }>(
      `SELECT
         s.id,
         s.group_id,
         g.name AS group_name,
         g.weekday,
         to_char(g.start_time, 'HH24:MI') AS start_time,
         to_char(g.end_time, 'HH24:MI') AS end_time,
         s.session_date::text AS session_date,
         s.amount_lei::float8 AS amount_lei,
         s.is_paid,
         s.paid_at::text AS paid_at,
         s.invoice_number,
         s.invoice_url
       FROM meditation_member_sessions s
       JOIN meditation_groups g ON g.id = s.group_id
       WHERE s.user_id = $1
       ORDER BY s.session_date DESC, g.start_time ASC`,
      [userId],
    );
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Failed to fetch meditation sessions:", error);
    res.status(500).json({ error: "Failed to fetch meditation sessions", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.get("/my-group", requireAuth, async (req, res) => {
  try {
    await ensureMeditationsTables();
    const result = await pgPool.query<MeditationGroupMembershipRow>(
      `${MEDITATION_GROUP_MEMBERSHIP_SELECT}
       FROM meditation_group_memberships m
       JOIN meditation_groups g ON g.id = m.group_id
       WHERE m.user_id = $1
       ORDER BY g.weekday ASC, g.start_time ASC`,
      [req.user!.id],
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Failed to fetch my meditation groups:", error);
    res.status(500).json({ error: "Failed to fetch meditation groups", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.get("/leads", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    const result = await pgPool.query<{
      id: string;
      user_id: string | null;
      full_name: string;
      email: string;
      phone: string;
      grade: string;
      message: string | null;
      status: string;
      created_at: string;
    }>(
      `SELECT id, user_id, full_name, email, phone, grade, message, status, created_at
       FROM meditations_leads
       ORDER BY created_at DESC`,
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Failed to fetch meditation leads:", error);
    res.status(500).json({ error: "Failed to fetch meditation leads", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.delete("/leads/:leadId", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();

    const deleteResult = await pgPool.query<{ id: string }>(
      `DELETE FROM meditations_leads WHERE id = $1 RETURNING id`,
      [req.params.leadId],
    );
    if (!deleteResult.rows[0]) {
      res.status(404).json({ error: "Lead not found", code: "NOT_FOUND" });
      return;
    }

    res.json({ data: { deleted: true } });
  } catch (error) {
    console.error("Failed to delete meditation lead:", error);
    res.status(500).json({ error: "Failed to delete meditation lead", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.get("/admin/groups", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    const groupsResult = await pgPool.query<{
      id: string;
      name: string;
      weekday: number;
      start_time: string;
      end_time: string;
      created_at: string;
      members_count: number;
    }>(
      `SELECT
         g.id,
         g.name,
         g.weekday,
         to_char(g.start_time, 'HH24:MI') AS start_time,
         to_char(g.end_time, 'HH24:MI') AS end_time,
         g.created_at::text,
         COUNT(m.user_id)::int AS members_count
       FROM meditation_groups g
       LEFT JOIN meditation_group_memberships m ON m.group_id = g.id
       GROUP BY g.id
       ORDER BY g.weekday ASC, g.start_time ASC`,
    );
    res.json({ data: groupsResult.rows });
  } catch (error) {
    console.error("Failed to fetch meditation groups:", error);
    res.status(500).json({ error: "Failed to fetch meditation groups", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.get("/admin/groups-with-members", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    await pgPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT`);
    await pgPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT`);

    const result = await pgPool.query<{
      id: string;
      name: string;
      weekday: number;
      start_time: string;
      end_time: string;
      created_at: string;
      members_count: number;
      members: Array<{
        user_id: string;
        email: string;
        username: string;
        first_name: string | null;
        last_name: string | null;
        full_name: string | null;
        last_session_date: string | null;
      }>;
    }>(
      `SELECT
         g.id,
         g.name,
         g.weekday,
         to_char(g.start_time, 'HH24:MI') AS start_time,
         to_char(g.end_time, 'HH24:MI') AS end_time,
         g.created_at::text AS created_at,
         COUNT(m.user_id)::int AS members_count,
         COALESCE(
           json_agg(
             json_build_object(
               'user_id', u.id,
               'email', u.email,
               'username', u.username,
               'first_name', u.first_name,
               'last_name', u.last_name,
               'full_name', u.full_name,
               'last_session_date', (
                 SELECT MAX(ms.session_date)::text
                 FROM meditation_member_sessions ms
                 WHERE ms.user_id = u.id AND ms.group_id = g.id
               )
             ) ORDER BY u.email
           ) FILTER (WHERE u.id IS NOT NULL),
           '[]'::json
         ) AS members
       FROM meditation_groups g
       LEFT JOIN meditation_group_memberships m ON m.group_id = g.id
       LEFT JOIN users u ON u.id = m.user_id
       GROUP BY g.id
       ORDER BY g.weekday ASC, g.start_time ASC`,
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Failed to fetch meditation groups with members:", error);
    res.status(500).json({ error: "Failed to fetch meditation groups with members", code: "INTERNAL_ERROR" });
  }
});

/** Utilizatori cu sedinte neplatite (admin). */
meditationsRouter.get("/admin/unpaid-sessions-stats", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    await pgPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT`);
    await pgPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT`);

    const result = await pgPool.query<{
      user_id: string;
      email: string;
      username: string;
      first_name: string | null;
      last_name: string | null;
      full_name: string | null;
      unpaid_sessions_count: number;
      unpaid_total_lei: number;
    }>(
      `SELECT
         u.id AS user_id,
         u.email,
         u.username,
         u.first_name,
         u.last_name,
         u.full_name,
         COUNT(s.id)::int AS unpaid_sessions_count,
         COALESCE(SUM(s.amount_lei), 0)::float8 AS unpaid_total_lei
       FROM meditation_member_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.is_paid = false
       GROUP BY u.id, u.email, u.username, u.first_name, u.last_name, u.full_name
       HAVING COUNT(s.id) > 0
       ORDER BY unpaid_sessions_count DESC, u.email ASC`,
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Failed to fetch unpaid meditation sessions stats:", error);
    res.status(500).json({ error: "Failed to fetch unpaid sessions stats", code: "INTERNAL_ERROR" });
  }
});

/** Marcheaza cea mai veche sedinta neplatita a unui elev ca platita (admin). */
meditationsRouter.post("/admin/users/:userId/sessions/mark-oldest-paid", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    const targetUserId = req.params.userId;
    const userExists = await pgPool.query(`SELECT id FROM users WHERE id = $1 LIMIT 1`, [targetUserId]);
    if (!userExists.rows[0]) {
      res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
      return;
    }

    const oldestResult = await pgPool.query<{
      id: string;
      session_date: string;
      amount_lei: number;
      group_name: string;
    }>(
      `SELECT s.id, s.session_date::text AS session_date, s.amount_lei::float8 AS amount_lei, g.name AS group_name
       FROM meditation_member_sessions s
       JOIN meditation_groups g ON g.id = s.group_id
       WHERE s.user_id = $1 AND s.is_paid = false
       ORDER BY s.session_date ASC, s.id ASC
       LIMIT 1`,
      [targetUserId],
    );
    const oldest = oldestResult.rows[0];
    if (!oldest) {
      res.status(404).json({ error: "Elevul nu are sedinte neplatite", code: "NO_UNPAID_SESSIONS" });
      return;
    }

    await pgPool.query(
      `UPDATE meditation_member_sessions
       SET is_paid = true, paid_at = NOW()
       WHERE id = $1 AND user_id = $2 AND is_paid = false`,
      [oldest.id, targetUserId],
    );

    res.json({
      data: {
        id: oldest.id,
        session_date: oldest.session_date,
        amount_lei: oldest.amount_lei,
        group_name: oldest.group_name,
        marked_paid: true,
      },
    });
  } catch (error) {
    console.error("Failed to mark oldest unpaid meditation session as paid:", error);
    res.status(500).json({ error: "Failed to mark session as paid", code: "INTERNAL_ERROR" });
  }
});

/** Trimite email de memento plata sedinte neplatite catre un elev (admin). */
meditationsRouter.post("/admin/users/:userId/send-payment-reminder", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    const targetUserId = req.params.userId;

    const userResult = await pgPool.query<{
      email: string;
      first_name: string | null;
      last_name: string | null;
      full_name: string | null;
      username: string;
    }>(
      `SELECT email, first_name, last_name, full_name, username
       FROM users WHERE id = $1 LIMIT 1`,
      [targetUserId],
    );
    const user = userResult.rows[0];
    if (!user) {
      res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
      return;
    }
    if (!user.email?.includes("@")) {
      res.status(400).json({ error: "Elevul nu are o adresa de email valida", code: "INVALID_EMAIL" });
      return;
    }

    const statsResult = await pgPool.query<{
      unpaid_sessions_count: number;
      unpaid_total_lei: number;
      avg_amount_lei: number | null;
    }>(
      `SELECT
         COUNT(s.id)::int AS unpaid_sessions_count,
         COALESCE(SUM(s.amount_lei), 0)::float8 AS unpaid_total_lei,
         AVG(s.amount_lei)::float8 AS avg_amount_lei
       FROM meditation_member_sessions s
       WHERE s.user_id = $1 AND s.is_paid = false`,
      [targetUserId],
    );
    const stats = statsResult.rows[0];
    if (!stats || stats.unpaid_sessions_count < 1) {
      res.status(404).json({ error: "Elevul nu are sedinte neplatite", code: "NO_UNPAID_SESSIONS" });
      return;
    }

    const datesResult = await pgPool.query<{ session_date: string }>(
      `SELECT s.session_date::text AS session_date
       FROM meditation_member_sessions s
       WHERE s.user_id = $1 AND s.is_paid = false
       ORDER BY s.session_date ASC, s.id ASC
       LIMIT 12`,
      [targetUserId],
    );

    const customerFirstName =
      user.first_name?.trim() ||
      user.full_name?.trim().split(/\s+/)[0] ||
      user.username?.trim() ||
      null;

    const appBase = getAppBaseUrl().replace(/\/$/, "") || "https://www.zecelainfo.ro";
    await sendMeditationPaymentReminderEmail({
      to: user.email,
      customerFirstName,
      unpaidSessionsCount: stats.unpaid_sessions_count,
      unpaidTotalLei: stats.unpaid_total_lei,
      sessionPriceLei: stats.avg_amount_lei,
      unpaidSessionDates: datesResult.rows.map((row) => row.session_date),
      appBaseUrl: appBase,
    });

    res.json({
      data: {
        sent: true,
        to: user.email,
        unpaid_sessions_count: stats.unpaid_sessions_count,
        unpaid_total_lei: stats.unpaid_total_lei,
      },
    });
  } catch (error) {
    console.error("Failed to send meditation payment reminder email:", error);
    res.status(500).json({ error: "Failed to send payment reminder email", code: "INTERNAL_ERROR" });
  }
});

/** Agregate grile, probleme (submissions), mod examen — membrii unei grupe (admin). */
meditationsRouter.get("/admin/groups/:groupId/insights", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    const groupId = req.params.groupId;
    const groupExists = await pgPool.query(`SELECT id FROM meditation_groups WHERE id = $1 LIMIT 1`, [groupId]);
    if (!groupExists.rows[0]) {
      res.status(404).json({ error: "Group not found", code: "NOT_FOUND" });
      return;
    }

    const membersResult = await pgPool.query<{
      user_id: string;
      email: string;
      username: string;
      first_name: string | null;
      last_name: string | null;
      full_name: string | null;
    }>(
      `SELECT u.id AS user_id, u.email, u.username, u.first_name, u.last_name, u.full_name
       FROM meditation_group_memberships m
       JOIN users u ON u.id = m.user_id
       WHERE m.group_id = $1
       ORDER BY u.email ASC`,
      [groupId],
    );
    const members = membersResult.rows;
    const userIds = members.map((m) => m.user_id);

    if (userIds.length === 0) {
      res.json({ data: { grile_leaderboard: [], problems_leaderboard: [], exam_attempts: [] } });
      return;
    }

    await ensureGrileTables();

    const problemStatsResult = await pgPool.query<{
      user_id: string;
      solved_7d: number;
      solved_30d: number;
      solved_all: number;
    }>(
      `SELECT
         user_id,
         COUNT(DISTINCT problem_id) FILTER (
           WHERE status = 'accepted' AND created_at >= NOW() - INTERVAL '7 days'
         )::int AS solved_7d,
         COUNT(DISTINCT problem_id) FILTER (
           WHERE status = 'accepted' AND created_at >= NOW() - INTERVAL '30 days'
         )::int AS solved_30d,
         COUNT(DISTINCT problem_id) FILTER (WHERE status = 'accepted')::int AS solved_all
       FROM submissions
       WHERE user_id = ANY($1::uuid[])
       GROUP BY user_id`,
      [userIds],
    );
    const problemStatsMap = new Map(problemStatsResult.rows.map((r) => [r.user_id, r]));

    const problems_leaderboard = members
      .map((m) => {
        const p = problemStatsMap.get(m.user_id);
        return {
          user_id: m.user_id,
          email: m.email,
          username: m.username,
          first_name: m.first_name,
          last_name: m.last_name,
          full_name: m.full_name,
          problems_solved_7d: p?.solved_7d ?? 0,
          problems_solved_30d: p?.solved_30d ?? 0,
          problems_solved_all: p?.solved_all ?? 0,
        };
      })
      .sort((a, b) => b.problems_solved_all - a.problems_solved_all);

    const statsResult = await pgPool.query<{
      user_id: string;
      correct_7d: number;
      correct_30d: number;
      correct_all: number;
    }>(
      `SELECT
         user_id,
         COUNT(*) FILTER (WHERE is_correct AND attempted_at >= NOW() - INTERVAL '7 days')::int AS correct_7d,
         COUNT(*) FILTER (WHERE is_correct AND attempted_at >= NOW() - INTERVAL '30 days')::int AS correct_30d,
         COUNT(*) FILTER (WHERE is_correct)::int AS correct_all
       FROM grile_user_attempts
       WHERE user_id = ANY($1::uuid[])
       GROUP BY user_id`,
      [userIds],
    );
    const statsMap = new Map(statsResult.rows.map((r) => [r.user_id, r]));

    const grile_leaderboard = members
      .map((m) => {
        const s = statsMap.get(m.user_id);
        return {
          user_id: m.user_id,
          email: m.email,
          username: m.username,
          first_name: m.first_name,
          last_name: m.last_name,
          full_name: m.full_name,
          grile_correct_7d: s?.correct_7d ?? 0,
          grile_correct_30d: s?.correct_30d ?? 0,
          grile_correct_all: s?.correct_all ?? 0,
        };
      })
      .sort((a, b) => b.grile_correct_all - a.grile_correct_all);

    const examResult = await pgPool.query<{
      user_id: string;
      id: string;
      source_id: string;
      source_name: string;
      score_total: number | null;
      question_count: number;
      status: string;
      started_at: string;
      finished_at: string | null;
    }>(
      `SELECT
         a.user_id,
         a.id,
         a.source_id,
         s.name AS source_name,
         a.score_total::float8 AS score_total,
         a.question_count,
         a.status,
         a.started_at::text AS started_at,
         a.finished_at::text AS finished_at
       FROM grile_exam_attempts a
       JOIN grile_sources s ON s.id = a.source_id
       WHERE a.user_id = ANY($1::uuid[])
       ORDER BY a.started_at DESC
       LIMIT 2000`,
      [userIds],
    );

    const attemptsByUser = new Map<string, typeof examResult.rows>();
    for (const row of examResult.rows) {
      const list = attemptsByUser.get(row.user_id) ?? [];
      list.push(row);
      attemptsByUser.set(row.user_id, list);
    }

    const exam_attempts = members.map((m) => ({
      user_id: m.user_id,
      email: m.email,
      username: m.username,
      first_name: m.first_name,
      last_name: m.last_name,
      full_name: m.full_name,
      attempts: attemptsByUser.get(m.user_id) ?? [],
    }));

    res.json({ data: { grile_leaderboard, problems_leaderboard, exam_attempts } });
  } catch (error) {
    console.error("Failed to fetch meditation group insights:", error);
    res.status(500).json({ error: "Failed to fetch meditation group insights", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.get("/admin/groups/:groupId/homework", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    const groupId = req.params.groupId;
    const groupExists = await pgPool.query(`SELECT id FROM meditation_groups WHERE id = $1 LIMIT 1`, [groupId]);
    if (!groupExists.rows[0]) {
      res.status(404).json({ error: "Group not found", code: "NOT_FOUND" });
      return;
    }
    const currentKindParsed = z.enum(["grile", "problems"]).safeParse(req.query.kind);
    const currentKind = currentKindParsed.success ? currentKindParsed.data : "grile";
    const currentResult = await pgPool.query<{
      id: string;
      kind: string;
      start_date: string;
      end_date: string;
      item_count: number;
    }>(
      `SELECT
         a.id,
         a.kind,
         a.start_date::text AS start_date,
         a.end_date::text AS end_date,
         ${HOMEWORK_ITEM_COUNT_SQL} AS item_count
       FROM meditation_homework_assignments a
       WHERE a.group_id = $1 AND a.is_current = true AND a.kind = $2
       LIMIT 1`,
      [groupId, currentKind],
    );
    const current = currentResult.rows[0] ?? null;

    const listResult = await pgPool.query<{
      id: string;
      kind: string;
      start_date: string;
      end_date: string;
      is_current: boolean;
      item_count: number;
    }>(
      `SELECT
         a.id,
         a.kind,
         a.start_date::text AS start_date,
         a.end_date::text AS end_date,
         a.is_current,
         ${HOMEWORK_ITEM_COUNT_SQL} AS item_count
       FROM meditation_homework_assignments a
       WHERE a.group_id = $1
       ORDER BY a.start_date DESC, a.id DESC`,
      [groupId],
    );

    res.json({ data: { current, items: listResult.rows } });
  } catch (error) {
    console.error("Failed to fetch meditation group homework:", error);
    res.status(500).json({ error: "Failed to fetch homework", code: "INTERNAL_ERROR" });
  }
});

async function notifyGroupHomeworkPublished(params: {
  groupId: string;
  kind: "grile" | "problems";
  startDate: string;
  endDate: string;
}) {
  const groupResult = await pgPool.query<{ name: string }>(`SELECT name FROM meditation_groups WHERE id = $1 LIMIT 1`, [
    params.groupId,
  ]);
  const groupName = groupResult.rows[0]?.name;
  if (!groupName) return;

  const membersResult = await pgPool.query<{ email: string; first_name: string | null; full_name: string | null }>(
    `SELECT u.email, u.first_name, u.full_name
     FROM meditation_group_memberships m
     JOIN users u ON u.id = m.user_id
     WHERE m.group_id = $1`,
    [params.groupId],
  );

  const appBaseUrl = getAppBaseUrl();
  for (const member of membersResult.rows) {
    const firstName = member.first_name?.trim() || member.full_name?.trim()?.split(/\s+/)[0] || "";
    try {
      await sendHomeworkPublishedEmail({
        to: member.email,
        studentFirstName: firstName,
        groupName,
        kind: params.kind,
        startDate: params.startDate,
        endDate: params.endDate,
        appBaseUrl,
      });
    } catch (emailError) {
      console.error(`Failed to send homework published email to ${member.email}:`, emailError);
    }
  }
}

meditationsRouter.post("/admin/groups/:groupId/homework", requireAuth, validateBody(createHomeworkSchema), async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    const groupId = routeIdParam(req.params.groupId);
    const payload = req.body as z.infer<typeof createHomeworkSchema>;
    const groupExists = await pgPool.query(`SELECT id FROM meditation_groups WHERE id = $1 LIMIT 1`, [groupId]);
    if (!groupExists.rows[0]) {
      res.status(404).json({ error: "Group not found", code: "NOT_FOUND" });
      return;
    }
    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE meditation_homework_assignments
         SET is_current = false
         WHERE group_id = $1 AND kind = $2 AND is_current = true`,
        [groupId, payload.kind],
      );
      const ins = await client.query<{ id: string }>(
        `INSERT INTO meditation_homework_assignments (group_id, kind, start_date, end_date, is_current, created_by)
         VALUES ($1, $2, $3::date, $4::date, true, $5)
         RETURNING id`,
        [groupId, payload.kind, payload.start_date, payload.end_date, req.user?.id ?? null],
      );
      await client.query("COMMIT");
      res.status(201).json({ data: { id: ins.rows[0]?.id, created: true } });
      void notifyGroupHomeworkPublished({
        groupId,
        kind: payload.kind,
        startDate: payload.start_date,
        endDate: payload.end_date,
      }).catch((emailError) => {
        console.error("Failed to send homework published emails:", emailError);
      });
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Failed to create meditation homework:", error);
    res.status(500).json({ error: "Failed to create homework", code: "INTERNAL_ERROR" });
  }
});

const HOMEWORK_GRILE_QUESTION_SELECT = `SELECT
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
  ARRAY_REMOVE(ARRAY_AGG(DISTINCT ch.name), NULL) AS chapter_names`;

async function getHomeworkAssignmentForUser(userId: string, assignmentId: string) {
  return pgPool.query<{
    id: string;
    group_id: string;
    group_name: string;
    start_date: string;
    end_date: string;
    kind: string;
    item_count: number;
  }>(
    `SELECT
       a.id,
       a.group_id::text AS group_id,
       g.name AS group_name,
       a.start_date::text AS start_date,
       a.end_date::text AS end_date,
       a.kind,
       COALESCE(COUNT(i.id), 0)::int AS item_count
     FROM meditation_homework_assignments a
     JOIN meditation_groups g ON g.id = a.group_id
     JOIN meditation_group_memberships m ON m.group_id = a.group_id AND m.user_id = $1
     LEFT JOIN meditation_homework_grile_items i ON i.assignment_id = a.id
     WHERE a.id = $2 AND a.kind = 'grile'
     GROUP BY a.id, g.name`,
    [userId, assignmentId],
  );
}

meditationsRouter.get("/my-homework", requireAuth, async (req, res) => {
  try {
    await ensureMeditationsTables();
    await ensureGrileTables();
    const userId = req.user!.id;
    const rows = await pgPool.query<{
      id: string;
      group_id: string;
      group_name: string;
      start_date: string;
      end_date: string;
      item_count: number;
      solved_since_publish: number;
      is_active: boolean;
    }>(
      `SELECT
         a.id,
         a.group_id::text AS group_id,
         g.name AS group_name,
         a.start_date::text AS start_date,
         a.end_date::text AS end_date,
         COALESCE(COUNT(i.id), 0)::int AS item_count,
         COALESCE(COUNT(DISTINCT i.question_id) FILTER (
           WHERE EXISTS (
             SELECT 1
             FROM grile_user_attempts att
             WHERE att.user_id = $1
               AND att.question_id = i.question_id
               AND att.is_correct = true
               AND att.attempted_at::date >= a.start_date
           )
         ), 0)::int AS solved_since_publish,
         (a.end_date >= CURRENT_DATE) AS is_active
       FROM meditation_group_memberships m
       JOIN meditation_homework_assignments a ON a.group_id = m.group_id AND a.kind = 'grile'
       JOIN meditation_groups g ON g.id = a.group_id
       LEFT JOIN meditation_homework_grile_items i ON i.assignment_id = a.id
       WHERE m.user_id = $1
       GROUP BY a.id, a.group_id, g.name, a.start_date, a.end_date
       ORDER BY a.start_date DESC, g.name ASC`,
      [userId],
    );
    const items = rows.rows.map((row) => ({
      id: row.id,
      group_id: row.group_id,
      group_name: row.group_name,
      start_date: row.start_date,
      end_date: row.end_date,
      item_count: row.item_count,
      solved_since_publish: row.solved_since_publish,
      status: row.is_active ? ("active" as const) : ("expired" as const),
    }));
    res.json({
      data: {
        active: items.filter((item) => item.status === "active"),
        expired: items.filter((item) => item.status === "expired"),
      },
    });
  } catch (error) {
    console.error("Failed to fetch my homework:", error);
    res.status(500).json({ error: "Failed to fetch homework", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.get("/homework/:assignmentId", requireAuth, async (req, res) => {
  try {
    await ensureMeditationsTables();
    await ensureGrileTables();
    const userId = req.user!.id;
    const assignmentId = routeIdParam(req.params.assignmentId);
    const assignmentResult = await getHomeworkAssignmentForUser(userId, assignmentId);
    const assignment = assignmentResult.rows[0];
    if (!assignment) {
      res.status(404).json({ error: "Tema nu a fost gasita sau nu ai acces.", code: "NOT_FOUND" });
      return;
    }
    if (assignment.item_count === 0) {
      res.status(400).json({ error: "Aceasta tema nu contine grile.", code: "EMPTY_HOMEWORK" });
      return;
    }

    const questionsResult = await pgPool.query(
      `${HOMEWORK_GRILE_QUESTION_SELECT}
       FROM meditation_homework_grile_items i
       JOIN grile_questions q ON q.id = i.question_id
       LEFT JOIN grile_question_ai_results ai ON ai.question_id = q.id AND ai.reviewed_by_admin = true
       LEFT JOIN grile_question_chapters gqc ON gqc.question_id = q.id
       LEFT JOIN grile_chapters ch ON ch.id = gqc.chapter_id
       WHERE i.assignment_id = $1
       GROUP BY q.id, ai.id
       ORDER BY q.order_index ASC NULLS LAST, q.legacy_id ASC`,
      [assignmentId],
    );

    res.json({
      data: {
        assignment: {
          id: assignment.id,
          group_id: assignment.group_id,
          group_name: assignment.group_name,
          start_date: assignment.start_date,
          end_date: assignment.end_date,
          item_count: assignment.item_count,
        },
        questions: questionsResult.rows,
      },
    });
  } catch (error) {
    console.error("Failed to fetch homework assignment:", error);
    res.status(500).json({ error: "Failed to fetch homework", code: "INTERNAL_ERROR" });
  }
});

const homeworkStudentFilterSchema = z.enum(["correct", "wrong", "flagged"]);

async function getAdminHomeworkAssignment(assignmentId: string) {
  return pgPool.query<{
    id: string;
    group_id: string;
    group_name: string;
    start_date: string;
    end_date: string;
    item_count: number;
  }>(
    `SELECT
       a.id,
       a.group_id::text AS group_id,
       g.name AS group_name,
       a.start_date::text AS start_date,
       a.end_date::text AS end_date,
       COALESCE(COUNT(i.id), 0)::int AS item_count
     FROM meditation_homework_assignments a
     JOIN meditation_groups g ON g.id = a.group_id
     LEFT JOIN meditation_homework_grile_items i ON i.assignment_id = a.id
     WHERE a.id = $1 AND a.kind = 'grile'
     GROUP BY a.id, g.name`,
    [assignmentId],
  );
}

/** Progres per elev pentru o tema (incercari dupa start_date). */
const HOMEWORK_STUDENT_PROGRESS_SQL = `
  SELECT
    q.id AS question_id,
    COALESCE(s.is_flagged, false) AS is_flagged,
    COALESCE(s.in_my_list, false) AS in_my_list,
    la.attempted_at::text AS last_attempt_at,
    la.is_correct AS last_is_correct,
    COALESCE(aggr.has_correct_attempt, false) AS has_correct_attempt,
    COALESCE(aggr.has_wrong_attempt, false) AS has_wrong_attempt
  FROM meditation_homework_grile_items i
  JOIN grile_questions q ON q.id = i.question_id
  LEFT JOIN grile_user_question_state s ON s.question_id = q.id AND s.user_id = $2
  LEFT JOIN LATERAL (
    SELECT
      BOOL_OR(a.is_correct) AS has_correct_attempt,
      BOOL_OR(NOT a.is_correct) AS has_wrong_attempt
    FROM grile_user_attempts a
    WHERE a.user_id = $2
      AND a.question_id = q.id
      AND a.attempted_at::date >= $3::date
  ) aggr ON true
  LEFT JOIN LATERAL (
    SELECT attempted_at, is_correct
    FROM grile_user_attempts a
    WHERE a.user_id = $2
      AND a.question_id = q.id
      AND a.attempted_at::date >= $3::date
    ORDER BY attempted_at DESC
    LIMIT 1
  ) la ON true
  WHERE i.assignment_id = $1`;

meditationsRouter.get("/admin/homework/:assignmentId/questions", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    await ensureGrileTables();
    const assignmentId = routeIdParam(req.params.assignmentId);
    const assignmentResult = await getAdminHomeworkAssignment(assignmentId);
    const assignment = assignmentResult.rows[0];
    if (!assignment) {
      res.status(404).json({ error: "Tema nu a fost gasita.", code: "NOT_FOUND" });
      return;
    }
    if (assignment.item_count === 0) {
      res.status(400).json({ error: "Aceasta tema nu contine grile.", code: "EMPTY_HOMEWORK" });
      return;
    }

    const questionsResult = await pgPool.query(
      `${HOMEWORK_GRILE_QUESTION_SELECT}
       FROM meditation_homework_grile_items i
       JOIN grile_questions q ON q.id = i.question_id
       LEFT JOIN grile_question_ai_results ai ON ai.question_id = q.id AND ai.reviewed_by_admin = true
       LEFT JOIN grile_question_chapters gqc ON gqc.question_id = q.id
       LEFT JOIN grile_chapters ch ON ch.id = gqc.chapter_id
       WHERE i.assignment_id = $1
       GROUP BY q.id, ai.id
       ORDER BY q.order_index ASC NULLS LAST, q.legacy_id ASC`,
      [assignmentId],
    );

    res.json({
      data: {
        assignment: {
          id: assignment.id,
          group_id: assignment.group_id,
          group_name: assignment.group_name,
          start_date: assignment.start_date,
          end_date: assignment.end_date,
          item_count: assignment.item_count,
        },
        questions: questionsResult.rows,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin homework questions:", error);
    res.status(500).json({ error: "Failed to fetch homework questions", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.get("/admin/homework/:assignmentId/stats", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    await ensureGrileTables();
    const assignmentId = routeIdParam(req.params.assignmentId);
    const assignmentResult = await getAdminHomeworkAssignment(assignmentId);
    const assignment = assignmentResult.rows[0];
    if (!assignment) {
      res.status(404).json({ error: "Tema nu a fost gasita.", code: "NOT_FOUND" });
      return;
    }
    if (assignment.item_count === 0) {
      res.status(400).json({ error: "Aceasta tema nu contine grile.", code: "EMPTY_HOMEWORK" });
      return;
    }

    const studentsResult = await pgPool.query<{
      user_id: string;
      email: string;
      username: string;
      first_name: string | null;
      last_name: string | null;
      full_name: string | null;
      correct_count: number;
      wrong_count: number;
      flagged_count: number;
    }>(
      `SELECT
         u.id AS user_id,
         u.email,
         u.username,
         u.first_name,
         u.last_name,
         u.full_name,
         COALESCE((
           SELECT COUNT(*)::int
           FROM meditation_homework_grile_items i
           WHERE i.assignment_id = $1
             AND EXISTS (
               SELECT 1
               FROM grile_user_attempts a
               WHERE a.user_id = u.id
                 AND a.question_id = i.question_id
                 AND a.is_correct = true
                 AND a.attempted_at::date >= $3::date
             )
         ), 0) AS correct_count,
         COALESCE((
           SELECT COUNT(*)::int
           FROM meditation_homework_grile_items i
           WHERE i.assignment_id = $1
             AND EXISTS (
               SELECT 1
               FROM grile_user_attempts a
               WHERE a.user_id = u.id
                 AND a.question_id = i.question_id
                 AND a.is_correct = false
                 AND a.attempted_at::date >= $3::date
             )
             AND NOT EXISTS (
               SELECT 1
               FROM grile_user_attempts a2
               WHERE a2.user_id = u.id
                 AND a2.question_id = i.question_id
                 AND a2.is_correct = true
                 AND a2.attempted_at::date >= $3::date
             )
         ), 0) AS wrong_count,
         COALESCE((
           SELECT COUNT(*)::int
           FROM meditation_homework_grile_items i
           JOIN grile_user_question_state s ON s.question_id = i.question_id AND s.user_id = u.id
           WHERE i.assignment_id = $1 AND s.is_flagged = true
         ), 0) AS flagged_count
       FROM meditation_group_memberships m
       JOIN users u ON u.id = m.user_id
       WHERE m.group_id = $2
       ORDER BY u.full_name NULLS LAST, u.email ASC`,
      [assignmentId, assignment.group_id, assignment.start_date],
    );

    const total = assignment.item_count;
    const students = studentsResult.rows.map((row) => ({
      user_id: row.user_id,
      email: row.email,
      username: row.username,
      first_name: row.first_name,
      last_name: row.last_name,
      full_name: row.full_name,
      correct_count: row.correct_count,
      wrong_count: row.wrong_count,
      flagged_count: row.flagged_count,
      total_count: total,
      percent_complete: total > 0 ? Math.round((row.correct_count / total) * 100) : 0,
    }));

    res.json({
      data: {
        assignment: {
          id: assignment.id,
          group_id: assignment.group_id,
          group_name: assignment.group_name,
          start_date: assignment.start_date,
          end_date: assignment.end_date,
          item_count: assignment.item_count,
        },
        students,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin homework stats:", error);
    res.status(500).json({ error: "Failed to fetch homework stats", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.get("/admin/homework/:assignmentId/students/:userId/questions", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    await ensureGrileTables();
    const assignmentId = routeIdParam(req.params.assignmentId);
    const studentUserId = routeIdParam(req.params.userId);
    const filterParsed = homeworkStudentFilterSchema.safeParse(req.query.filter);
    if (!filterParsed.success) {
      res.status(400).json({ error: "Filtru invalid (correct, wrong, flagged).", code: "INVALID_FILTER" });
      return;
    }
    const filter = filterParsed.data;

    const assignmentResult = await getAdminHomeworkAssignment(assignmentId);
    const assignment = assignmentResult.rows[0];
    if (!assignment) {
      res.status(404).json({ error: "Tema nu a fost gasita.", code: "NOT_FOUND" });
      return;
    }

    const memberCheck = await pgPool.query(
      `SELECT 1 FROM meditation_group_memberships WHERE group_id = $1 AND user_id = $2 LIMIT 1`,
      [assignment.group_id, studentUserId],
    );
    if (!memberCheck.rows[0]) {
      res.status(404).json({ error: "Elevul nu este in aceasta grupa.", code: "NOT_FOUND" });
      return;
    }

    const studentResult = await pgPool.query<{
      email: string;
      username: string;
      first_name: string | null;
      last_name: string | null;
      full_name: string | null;
    }>(
      `SELECT email, username, first_name, last_name, full_name FROM users WHERE id = $1 LIMIT 1`,
      [studentUserId],
    );
    const student = studentResult.rows[0];
    if (!student) {
      res.status(404).json({ error: "Elev negasit.", code: "NOT_FOUND" });
      return;
    }

    const filterSql =
      filter === "correct"
        ? "p.has_correct_attempt = true"
        : filter === "wrong"
          ? "p.has_wrong_attempt = true AND p.has_correct_attempt = false"
          : "p.is_flagged = true";

    const questionsResult = await pgPool.query(
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
         p.is_flagged,
         p.in_my_list,
         p.last_attempt_at,
         p.last_is_correct,
         p.has_correct_attempt,
         p.has_wrong_attempt
       FROM (${HOMEWORK_STUDENT_PROGRESS_SQL}) p
       JOIN grile_questions q ON q.id = p.question_id
       LEFT JOIN grile_question_ai_results ai ON ai.question_id = q.id AND ai.reviewed_by_admin = true
       LEFT JOIN grile_question_chapters gqc ON gqc.question_id = q.id
       LEFT JOIN grile_chapters ch ON ch.id = gqc.chapter_id
       WHERE ${filterSql}
       GROUP BY q.id, ai.id, p.is_flagged, p.in_my_list, p.last_attempt_at, p.last_is_correct, p.has_correct_attempt, p.has_wrong_attempt
       ORDER BY q.order_index ASC NULLS LAST, q.legacy_id ASC`,
      [assignmentId, studentUserId, assignment.start_date],
    );

    res.json({
      data: {
        assignment: {
          id: assignment.id,
          group_id: assignment.group_id,
          group_name: assignment.group_name,
          start_date: assignment.start_date,
          end_date: assignment.end_date,
          item_count: assignment.item_count,
        },
        student: {
          user_id: studentUserId,
          email: student.email,
          username: student.username,
          first_name: student.first_name,
          last_name: student.last_name,
          full_name: student.full_name,
        },
        filter,
        questions: questionsResult.rows,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin homework student questions:", error);
    res.status(500).json({ error: "Failed to fetch homework questions", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.get("/homework/:assignmentId/progress", requireAuth, async (req, res) => {
  try {
    await ensureMeditationsTables();
    await ensureGrileTables();
    const userId = req.user!.id;
    const assignmentId = routeIdParam(req.params.assignmentId);
    const assignmentResult = await getHomeworkAssignmentForUser(userId, assignmentId);
    const assignment = assignmentResult.rows[0];
    if (!assignment) {
      res.status(404).json({ error: "Tema nu a fost gasita sau nu ai acces.", code: "NOT_FOUND" });
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
       FROM meditation_homework_grile_items i
       JOIN grile_questions q ON q.id = i.question_id
       LEFT JOIN grile_user_question_state s ON s.question_id = q.id AND s.user_id = $1
       LEFT JOIN LATERAL (
         SELECT
           BOOL_OR(a.is_correct) AS has_correct_attempt,
           BOOL_OR(NOT a.is_correct) AS has_wrong_attempt
         FROM grile_user_attempts a
         WHERE a.user_id = $1
           AND a.question_id = q.id
           AND a.attempted_at::date >= $3::date
       ) aggr ON true
       LEFT JOIN LATERAL (
         SELECT attempted_at, is_correct
         FROM grile_user_attempts a
         WHERE a.user_id = $1
           AND a.question_id = q.id
           AND a.attempted_at::date >= $3::date
         ORDER BY attempted_at DESC
         LIMIT 1
       ) la ON true
       WHERE i.assignment_id = $2`,
      [userId, assignmentId, assignment.start_date],
    );

    res.json({ data: progressResult.rows });
  } catch (error) {
    console.error("Failed to fetch homework progress:", error);
    res.status(500).json({ error: "Failed to fetch homework progress", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.get("/my-grile-homework", requireAuth, async (req, res) => {
  try {
    await ensureMeditationsTables();
    const userId = req.user!.id;
    const rowResult = await pgPool.query<{
      id: string;
      start_date: string;
      end_date: string;
      item_count: number;
    }>(
      `SELECT
         a.id,
         a.start_date::text AS start_date,
         a.end_date::text AS end_date,
         COALESCE(COUNT(i.id), 0)::int AS item_count
       FROM meditation_group_memberships m
       JOIN meditation_homework_assignments a
         ON a.group_id = m.group_id AND a.is_current = true AND a.kind = 'grile'
       LEFT JOIN meditation_homework_grile_items i ON i.assignment_id = a.id
       WHERE m.user_id = $1
       GROUP BY a.id, a.start_date, a.end_date
       LIMIT 1`,
      [userId],
    );
    const assignment = rowResult.rows[0] ?? null;
    res.json({ data: { assignment } });
  } catch (error) {
    console.error("Failed to fetch my grile homework:", error);
    res.status(500).json({ error: "Failed to fetch homework", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.get("/admin/grile-homework/current", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    const userId = req.user!.id;
    const rowResult = await pgPool.query<{
      id: string;
      group_id: string;
      group_name: string;
      start_date: string;
      end_date: string;
      item_count: number;
    }>(
      `SELECT
         a.id,
         a.group_id::text AS group_id,
         g.name AS group_name,
         a.start_date::text AS start_date,
         a.end_date::text AS end_date,
         COALESCE(COUNT(i.id), 0)::int AS item_count
       FROM meditation_homework_assignments a
       JOIN meditation_groups g ON g.id = a.group_id
       LEFT JOIN meditation_homework_grile_items i ON i.assignment_id = a.id
       WHERE a.kind = 'grile' AND a.is_current = true AND a.created_by = $1
       GROUP BY a.id, a.group_id, g.name, a.start_date, a.end_date, a.created_at
       ORDER BY a.created_at DESC
       LIMIT 1`,
      [userId],
    );
    const assignment = rowResult.rows[0] ?? null;
    res.json({ data: { assignment } });
  } catch (error) {
    console.error("Failed to fetch admin grile homework:", error);
    res.status(500).json({ error: "Failed to fetch homework", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.post("/my-grile-homework/items", requireAuth, validateBody(addGrileHomeworkItemsSchema), async (req, res) => {
  try {
    await ensureMeditationsTables();
    const userId = req.user!.id;
    const payload = req.body as z.infer<typeof addGrileHomeworkItemsSchema>;

    const assignmentResult = await pgPool.query<{ id: string }>(
      `SELECT a.id
       FROM meditation_group_memberships m
       JOIN meditation_homework_assignments a
         ON a.group_id = m.group_id AND a.is_current = true AND a.kind = 'grile'
       WHERE m.user_id = $1
       LIMIT 1`,
      [userId],
    );
    const assignmentId = assignmentResult.rows[0]?.id;
    if (!assignmentId) {
      res.status(400).json({ error: "Nu exista o tema curenta la grile pentru grupa ta.", code: "NO_CURRENT_HOMEWORK" });
      return;
    }

    let insertSql: string;
    let params: unknown[];
    if (payload.scope === "source") {
      insertSql = `
        INSERT INTO meditation_homework_grile_items (assignment_id, question_id)
        SELECT $1::uuid, q.id
        FROM grile_questions q
        WHERE q.source_id = $2::uuid
        ON CONFLICT (assignment_id, question_id) DO NOTHING
        RETURNING id`;
      params = [assignmentId, payload.source_id];
    } else {
      insertSql = `
        INSERT INTO meditation_homework_grile_items (assignment_id, question_id)
        SELECT $1::uuid, gqc.question_id
        FROM grile_question_chapters gqc
        WHERE gqc.chapter_id = $2::uuid
        ON CONFLICT (assignment_id, question_id) DO NOTHING
        RETURNING id`;
      params = [assignmentId, payload.chapter_id];
    }

    const insertResult = await pgPool.query<{ id: string }>(insertSql, params);
    res.json({ data: { added: insertResult.rowCount ?? insertResult.rows.length } });
  } catch (error) {
    console.error("Failed to add grile homework items:", error);
    res.status(500).json({ error: "Failed to add homework items", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.post("/admin/grile-homework/current/items", requireAuth, validateBody(addGrileHomeworkItemsSchema), async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    const userId = req.user!.id;
    const payload = req.body as z.infer<typeof addGrileHomeworkItemsSchema>;

    const assignmentResult = await pgPool.query<{ id: string }>(
      `SELECT id
       FROM meditation_homework_assignments
       WHERE kind = 'grile' AND is_current = true AND created_by = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId],
    );
    const assignmentId = assignmentResult.rows[0]?.id;
    if (!assignmentId) {
      res
        .status(400)
        .json({ error: "Nu ai nicio tema curenta la grile creata de tine. Creeaza tema din panoul de meditatii.", code: "NO_CURRENT_HOMEWORK" });
      return;
    }

    let insertSql: string;
    let params: unknown[];
    if (payload.scope === "source") {
      insertSql = `
        INSERT INTO meditation_homework_grile_items (assignment_id, question_id)
        SELECT $1::uuid, q.id
        FROM grile_questions q
        WHERE q.source_id = $2::uuid
        ON CONFLICT (assignment_id, question_id) DO NOTHING
        RETURNING id`;
      params = [assignmentId, payload.source_id];
    } else {
      insertSql = `
        INSERT INTO meditation_homework_grile_items (assignment_id, question_id)
        SELECT $1::uuid, gqc.question_id
        FROM grile_question_chapters gqc
        WHERE gqc.chapter_id = $2::uuid
        ON CONFLICT (assignment_id, question_id) DO NOTHING
        RETURNING id`;
      params = [assignmentId, payload.chapter_id];
    }
    const inserted = await pgPool.query(insertSql, params);
    res.status(201).json({ data: { added: inserted.rowCount ?? 0 } });
  } catch (error) {
    console.error("Failed to add admin grile homework items:", error);
    res.status(500).json({ error: "Failed to add homework items", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.get("/admin/problems-homework/current", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    const userId = req.user!.id;
    const rowResult = await pgPool.query<{
      id: string;
      group_id: string;
      group_name: string;
      start_date: string;
      end_date: string;
      item_count: number;
    }>(
      `SELECT
         a.id,
         a.group_id::text AS group_id,
         g.name AS group_name,
         a.start_date::text AS start_date,
         a.end_date::text AS end_date,
         COALESCE(COUNT(i.id), 0)::int AS item_count
       FROM meditation_homework_assignments a
       JOIN meditation_groups g ON g.id = a.group_id
       LEFT JOIN meditation_homework_problems_items i ON i.assignment_id = a.id
       WHERE a.kind = 'problems' AND a.is_current = true AND a.created_by = $1
       GROUP BY a.id, a.group_id, g.name, a.start_date, a.end_date, a.created_at
       ORDER BY a.created_at DESC
       LIMIT 1`,
      [userId],
    );
    const assignment = rowResult.rows[0] ?? null;
    res.json({ data: { assignment } });
  } catch (error) {
    console.error("Failed to fetch admin problems homework:", error);
    res.status(500).json({ error: "Failed to fetch homework", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.post(
  "/admin/problems-homework/current/items",
  requireAuth,
  validateBody(addProblemHomeworkItemSchema),
  async (req, res) => {
    try {
      const allowed = await ensureAdminRole(req.user?.id);
      if (!allowed) {
        res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
        return;
      }
      await ensureMeditationsTables();
      const userId = req.user!.id;
      const payload = req.body as z.infer<typeof addProblemHomeworkItemSchema>;

      const assignmentResult = await pgPool.query<{ id: string }>(
        `SELECT id
         FROM meditation_homework_assignments
         WHERE kind = 'problems' AND is_current = true AND created_by = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId],
      );
      const assignmentId = assignmentResult.rows[0]?.id;
      if (!assignmentId) {
        res.status(400).json({
          error: "Nu ai nicio tema curenta la probleme creata de tine. Creeaza tema din panoul de meditatii.",
          code: "NO_CURRENT_HOMEWORK",
        });
        return;
      }

      const inserted = await pgPool.query<{ id: string }>(
        `INSERT INTO meditation_homework_problems_items (assignment_id, problem_id)
         VALUES ($1::uuid, $2::uuid)
         ON CONFLICT (assignment_id, problem_id) DO NOTHING
         RETURNING id`,
        [assignmentId, payload.problem_id],
      );
      res.status(201).json({ data: { added: inserted.rowCount ?? 0 } });
    } catch (error) {
      console.error("Failed to add admin problem homework item:", error);
      res.status(500).json({ error: "Failed to add homework item", code: "INTERNAL_ERROR" });
    }
  },
);

async function getAdminProblemsHomeworkAssignment(assignmentId: string) {
  return pgPool.query<{
    id: string;
    group_id: string;
    group_name: string;
    start_date: string;
    end_date: string;
    item_count: number;
  }>(
    `SELECT
       a.id,
       a.group_id::text AS group_id,
       g.name AS group_name,
       a.start_date::text AS start_date,
       a.end_date::text AS end_date,
       COALESCE(COUNT(i.id), 0)::int AS item_count
     FROM meditation_homework_assignments a
     JOIN meditation_groups g ON g.id = a.group_id
     LEFT JOIN meditation_homework_problems_items i ON i.assignment_id = a.id
     WHERE a.id = $1 AND a.kind = 'problems'
     GROUP BY a.id, g.name`,
    [assignmentId],
  );
}

/** Matricea pentru admin: pentru fiecare (problema, elev) - toate punctajele obtinute dupa data de inceput a temei. */
meditationsRouter.get("/admin/homework/:assignmentId/problems-stats", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    const assignmentId = routeIdParam(req.params.assignmentId);
    const assignmentResult = await getAdminProblemsHomeworkAssignment(assignmentId);
    const assignment = assignmentResult.rows[0];
    if (!assignment) {
      res.status(404).json({ error: "Tema nu a fost gasita.", code: "NOT_FOUND" });
      return;
    }
    if (assignment.item_count === 0) {
      res.status(400).json({ error: "Aceasta tema nu contine probleme.", code: "EMPTY_HOMEWORK" });
      return;
    }

    const problemsResult = await pgPool.query<{ id: string; slug: string; title: string }>(
      `SELECT p.id, p.slug, p.title
       FROM meditation_homework_problems_items i
       JOIN problems p ON p.id = i.problem_id
       WHERE i.assignment_id = $1
       ORDER BY i.created_at ASC`,
      [assignmentId],
    );

    const studentsResult = await pgPool.query<{
      user_id: string;
      email: string;
      username: string;
      first_name: string | null;
      last_name: string | null;
      full_name: string | null;
    }>(
      `SELECT u.id AS user_id, u.email, u.username, u.first_name, u.last_name, u.full_name
       FROM meditation_group_memberships m
       JOIN users u ON u.id = m.user_id
       WHERE m.group_id = $1
       ORDER BY u.full_name NULLS LAST, u.email ASC`,
      [assignment.group_id],
    );

    const attemptsResult = await pgPool.query<{
      problem_id: string;
      user_id: string;
      score: number;
      created_at: string;
    }>(
      `SELECT s.problem_id::text AS problem_id, s.user_id::text AS user_id, s.score, s.created_at::text AS created_at
       FROM submissions s
       JOIN meditation_homework_problems_items i ON i.problem_id = s.problem_id AND i.assignment_id = $1
       JOIN meditation_group_memberships m ON m.user_id = s.user_id AND m.group_id = $2
       WHERE s.created_at::date >= $3::date
       ORDER BY s.created_at ASC`,
      [assignmentId, assignment.group_id, assignment.start_date],
    );

    const scores: Record<string, Record<string, number[]>> = {};
    for (const attempt of attemptsResult.rows) {
      const byUser = (scores[attempt.problem_id] ??= {});
      const list = (byUser[attempt.user_id] ??= []);
      list.push(attempt.score);
    }

    res.json({
      data: {
        assignment: {
          id: assignment.id,
          group_id: assignment.group_id,
          group_name: assignment.group_name,
          start_date: assignment.start_date,
          end_date: assignment.end_date,
          item_count: assignment.item_count,
        },
        problems: problemsResult.rows,
        students: studentsResult.rows,
        scores,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin problems homework stats:", error);
    res.status(500).json({ error: "Failed to fetch homework stats", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.delete("/admin/homework/:assignmentId/problems-items/:problemId", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    const assignmentId = routeIdParam(req.params.assignmentId);
    const problemId = routeIdParam(req.params.problemId);
    const assignmentResult = await getAdminProblemsHomeworkAssignment(assignmentId);
    if (!assignmentResult.rows[0]) {
      res.status(404).json({ error: "Tema nu a fost gasita.", code: "NOT_FOUND" });
      return;
    }
    const deleted = await pgPool.query(
      `DELETE FROM meditation_homework_problems_items WHERE assignment_id = $1 AND problem_id = $2`,
      [assignmentId, problemId],
    );
    res.json({ data: { removed: deleted.rowCount ?? 0 } });
  } catch (error) {
    console.error("Failed to remove problem from homework:", error);
    res.status(500).json({ error: "Failed to remove homework item", code: "INTERNAL_ERROR" });
  }
});

/** Detaliu per elev pentru o tema de probleme: fiecare problema cu toate incercarile (scor, status, limbaj, data). */
meditationsRouter.get("/admin/homework/:assignmentId/problems-stats/students/:userId", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    const assignmentId = routeIdParam(req.params.assignmentId);
    const studentUserId = routeIdParam(req.params.userId);
    const assignmentResult = await getAdminProblemsHomeworkAssignment(assignmentId);
    const assignment = assignmentResult.rows[0];
    if (!assignment) {
      res.status(404).json({ error: "Tema nu a fost gasita.", code: "NOT_FOUND" });
      return;
    }

    const memberCheck = await pgPool.query(
      `SELECT 1 FROM meditation_group_memberships WHERE group_id = $1 AND user_id = $2 LIMIT 1`,
      [assignment.group_id, studentUserId],
    );
    if (!memberCheck.rows[0]) {
      res.status(404).json({ error: "Elevul nu este in aceasta grupa.", code: "NOT_FOUND" });
      return;
    }

    const studentResult = await pgPool.query<{
      email: string;
      username: string;
      first_name: string | null;
      last_name: string | null;
      full_name: string | null;
    }>(`SELECT email, username, first_name, last_name, full_name FROM users WHERE id = $1 LIMIT 1`, [studentUserId]);
    const student = studentResult.rows[0];
    if (!student) {
      res.status(404).json({ error: "Elev negasit.", code: "NOT_FOUND" });
      return;
    }

    const problemsResult = await pgPool.query<{
      id: string;
      slug: string;
      title: string;
      attempts: Array<{ id: string; score: number; status: string; language: string; created_at: string }> | null;
    }>(
      `SELECT
         p.id,
         p.slug,
         p.title,
         COALESCE(
           (
             SELECT json_agg(json_build_object(
               'id', s.id, 'score', s.score, 'status', s.status, 'language', s.language,
               'created_at', s.created_at::text
             ) ORDER BY s.created_at ASC)
             FROM submissions s
             WHERE s.problem_id = p.id AND s.user_id = $2 AND s.created_at::date >= $3::date
           ),
           '[]'
         ) AS attempts
       FROM meditation_homework_problems_items i
       JOIN problems p ON p.id = i.problem_id
       WHERE i.assignment_id = $1
       ORDER BY i.created_at ASC`,
      [assignmentId, studentUserId, assignment.start_date],
    );

    res.json({
      data: {
        assignment: {
          id: assignment.id,
          group_id: assignment.group_id,
          group_name: assignment.group_name,
          start_date: assignment.start_date,
          end_date: assignment.end_date,
          item_count: assignment.item_count,
        },
        student: {
          user_id: studentUserId,
          email: student.email,
          username: student.username,
          first_name: student.first_name,
          last_name: student.last_name,
          full_name: student.full_name,
        },
        problems: problemsResult.rows,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin problems homework student detail:", error);
    res.status(500).json({ error: "Failed to fetch homework student detail", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.get("/my-problems-homework", requireAuth, async (req, res) => {
  try {
    await ensureMeditationsTables();
    const userId = req.user!.id;
    const rows = await pgPool.query<{
      id: string;
      group_id: string;
      group_name: string;
      start_date: string;
      end_date: string;
      item_count: number;
      solved_since_publish: number;
      is_active: boolean;
    }>(
      `SELECT
         a.id,
         a.group_id::text AS group_id,
         g.name AS group_name,
         a.start_date::text AS start_date,
         a.end_date::text AS end_date,
         COALESCE(COUNT(i.id), 0)::int AS item_count,
         COALESCE(COUNT(DISTINCT i.problem_id) FILTER (
           WHERE EXISTS (
             SELECT 1
             FROM submissions sub
             WHERE sub.user_id = $1
               AND sub.problem_id = i.problem_id
               AND sub.status = 'accepted'
               AND sub.created_at::date >= a.start_date
           )
         ), 0)::int AS solved_since_publish,
         (a.end_date >= CURRENT_DATE) AS is_active
       FROM meditation_group_memberships m
       JOIN meditation_homework_assignments a ON a.group_id = m.group_id AND a.kind = 'problems'
       JOIN meditation_groups g ON g.id = a.group_id
       LEFT JOIN meditation_homework_problems_items i ON i.assignment_id = a.id
       WHERE m.user_id = $1
       GROUP BY a.id, a.group_id, g.name, a.start_date, a.end_date
       ORDER BY a.start_date DESC, g.name ASC`,
      [userId],
    );
    const items = rows.rows.map((row) => ({
      id: row.id,
      group_id: row.group_id,
      group_name: row.group_name,
      start_date: row.start_date,
      end_date: row.end_date,
      item_count: row.item_count,
      solved_since_publish: row.solved_since_publish,
      status: row.is_active ? ("active" as const) : ("expired" as const),
    }));
    res.json({
      data: {
        active: items.filter((item) => item.status === "active"),
        expired: items.filter((item) => item.status === "expired"),
      },
    });
  } catch (error) {
    console.error("Failed to fetch my problems homework:", error);
    res.status(500).json({ error: "Failed to fetch homework", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.get("/problems-homework/:assignmentId", requireAuth, async (req, res) => {
  try {
    await ensureMeditationsTables();
    const userId = req.user!.id;
    const assignmentId = routeIdParam(req.params.assignmentId);
    const assignmentResult = await pgPool.query<{
      id: string;
      group_id: string;
      group_name: string;
      start_date: string;
      end_date: string;
      item_count: number;
    }>(
      `SELECT
         a.id,
         a.group_id::text AS group_id,
         g.name AS group_name,
         a.start_date::text AS start_date,
         a.end_date::text AS end_date,
         COALESCE(COUNT(i.id), 0)::int AS item_count
       FROM meditation_homework_assignments a
       JOIN meditation_groups g ON g.id = a.group_id
       JOIN meditation_group_memberships m ON m.group_id = a.group_id AND m.user_id = $1
       LEFT JOIN meditation_homework_problems_items i ON i.assignment_id = a.id
       WHERE a.id = $2 AND a.kind = 'problems'
       GROUP BY a.id, g.name`,
      [userId, assignmentId],
    );
    const assignment = assignmentResult.rows[0];
    if (!assignment) {
      res.status(404).json({ error: "Tema nu a fost gasita sau nu ai acces.", code: "NOT_FOUND" });
      return;
    }
    if (assignment.item_count === 0) {
      res.status(400).json({ error: "Aceasta tema nu contine probleme.", code: "EMPTY_HOMEWORK" });
      return;
    }

    const problemsResult = await pgPool.query<{
      id: string;
      slug: string;
      title: string;
      difficulty: string;
      solved: boolean;
    }>(
      `SELECT
         p.id,
         p.slug,
         p.title,
         p.difficulty,
         EXISTS (
           SELECT 1 FROM submissions sub
           WHERE sub.user_id = $1
             AND sub.problem_id = p.id
             AND sub.status = 'accepted'
             AND sub.created_at::date >= $3::date
         ) AS solved
       FROM meditation_homework_problems_items i
       JOIN problems p ON p.id = i.problem_id
       WHERE i.assignment_id = $2
       ORDER BY i.created_at ASC`,
      [userId, assignmentId, assignment.start_date],
    );

    res.json({
      data: {
        assignment: {
          id: assignment.id,
          group_id: assignment.group_id,
          group_name: assignment.group_name,
          start_date: assignment.start_date,
          end_date: assignment.end_date,
          item_count: assignment.item_count,
        },
        problems: problemsResult.rows,
      },
    });
  } catch (error) {
    console.error("Failed to fetch problems homework:", error);
    res.status(500).json({ error: "Failed to fetch homework", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.post("/admin/groups", requireAuth, validateBody(createGroupSchema), async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    const payload = req.body as z.infer<typeof createGroupSchema>;
    if (payload.end_time <= payload.start_time) {
      res.status(400).json({ error: "Interval orar invalid", code: "INVALID_TIME_RANGE" });
      return;
    }
    const insertResult = await pgPool.query<{ id: string }>(
      `INSERT INTO meditation_groups (name, weekday, start_time, end_time, created_by)
       VALUES ($1, $2, $3::time, $4::time, $5)
       RETURNING id`,
      [payload.name.trim(), payload.weekday, payload.start_time, payload.end_time, req.user?.id ?? null],
    );
    res.status(201).json({ data: { id: insertResult.rows[0]?.id, created: true } });
  } catch (error) {
    console.error("Failed to create meditation group:", error);
    res.status(500).json({ error: "Failed to create meditation group", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.put("/admin/groups/:groupId", requireAuth, validateBody(updateGroupSchema), async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    const payload = req.body as z.infer<typeof updateGroupSchema>;
    if (payload.end_time <= payload.start_time) {
      res.status(400).json({ error: "Interval orar invalid", code: "INVALID_TIME_RANGE" });
      return;
    }
    const updateResult = await pgPool.query<{ id: string }>(
      `UPDATE meditation_groups
       SET name = $2, weekday = $3, start_time = $4::time, end_time = $5::time
       WHERE id = $1
       RETURNING id`,
      [req.params.groupId, payload.name.trim(), payload.weekday, payload.start_time, payload.end_time],
    );
    if (!updateResult.rows[0]) {
      res.status(404).json({ error: "Group not found", code: "NOT_FOUND" });
      return;
    }
    res.json({ data: { id: updateResult.rows[0].id, updated: true } });
  } catch (error) {
    console.error("Failed to update meditation group:", error);
    res.status(500).json({ error: "Failed to update meditation group", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.delete("/admin/groups/:groupId", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();

    const groupId = req.params.groupId;
    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`DELETE FROM meditation_group_memberships WHERE group_id = $1`, [groupId]);
      const deleteResult = await client.query<{ id: string }>(
        `DELETE FROM meditation_groups
         WHERE id = $1
         RETURNING id`,
        [groupId],
      );
      if (!deleteResult.rows[0]) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Group not found", code: "NOT_FOUND" });
        return;
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    res.json({ data: { deleted: true } });
  } catch (error) {
    console.error("Failed to delete meditation group:", error);
    res.status(500).json({ error: "Failed to delete meditation group", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.get("/admin/users/:userId/group", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    const targetUserId = req.params.userId;
    const result = await pgPool.query<MeditationGroupMembershipRow>(
      `${MEDITATION_GROUP_MEMBERSHIP_SELECT}
       FROM meditation_group_memberships m
       JOIN meditation_groups g ON g.id = m.group_id
       WHERE m.user_id = $1
       ORDER BY g.weekday ASC, g.start_time ASC`,
      [targetUserId],
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Failed to fetch user meditation groups:", error);
    res.status(500).json({ error: "Failed to fetch user meditation groups", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.post("/admin/users/:userId/sessions", requireAuth, validateBody(createUserSessionSchema), async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    const targetUserId = req.params.userId;
    const payload = req.body as z.infer<typeof createUserSessionSchema>;
    const membershipsResult = await pgPool.query<{ group_id: string }>(
      `SELECT group_id FROM meditation_group_memberships WHERE user_id = $1 ORDER BY assigned_at ASC`,
      [targetUserId],
    );
    const memberships = membershipsResult.rows;
    if (memberships.length === 0) {
      res.status(400).json({ error: "Userul nu este asignat la nicio grupa", code: "GROUP_REQUIRED" });
      return;
    }
    let sessionGroupId = payload.group_id ?? null;
    if (sessionGroupId) {
      const allowed = memberships.some((row) => row.group_id === sessionGroupId);
      if (!allowed) {
        res.status(400).json({ error: "Elevul nu face parte din grupa selectata", code: "GROUP_NOT_MEMBER" });
        return;
      }
    } else if (memberships.length === 1) {
      sessionGroupId = memberships[0]!.group_id;
    } else {
      res.status(400).json({
        error: "Elevul este in mai multe grupe. Specifica group_id pentru sedinta.",
        code: "GROUP_ID_REQUIRED",
      });
      return;
    }
    const insertResult = await pgPool.query<{ id: string }>(
      `INSERT INTO meditation_member_sessions (group_id, user_id, session_date, amount_lei, created_by)
       VALUES ($1, $2, $3::date, $4, $5)
       ON CONFLICT (group_id, user_id, session_date)
       DO UPDATE SET amount_lei = EXCLUDED.amount_lei
       RETURNING id`,
      [sessionGroupId, targetUserId, payload.session_date, payload.amount_lei ?? 150, req.user?.id ?? null],
    );
    res.status(201).json({ data: { id: insertResult.rows[0]?.id, created: true } });
  } catch (error) {
    console.error("Failed to create meditation user session:", error);
    res.status(500).json({ error: "Failed to create meditation session", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.put("/admin/users/:userId/group", requireAuth, validateBody(assignUserToGroupSchema), async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    const targetUserId = req.params.userId;
    const userExists = await pgPool.query(`SELECT id FROM users WHERE id = $1 LIMIT 1`, [targetUserId]);
    if (!userExists.rows[0]) {
      res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
      return;
    }
    const payload = req.body as z.infer<typeof assignUserToGroupSchema>;
    if (!payload.group_id) {
      await pgPool.query(`DELETE FROM meditation_group_memberships WHERE user_id = $1`, [targetUserId]);
      res.json({ data: { assigned: false, removed_all: true } });
      return;
    }
    const groupExists = await pgPool.query(`SELECT id FROM meditation_groups WHERE id = $1 LIMIT 1`, [payload.group_id]);
    if (!groupExists.rows[0]) {
      res.status(404).json({ error: "Group not found", code: "NOT_FOUND" });
      return;
    }
    await pgPool.query(
      `INSERT INTO meditation_group_memberships (user_id, group_id, assigned_by, assigned_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, group_id)
       DO UPDATE SET assigned_by = EXCLUDED.assigned_by, assigned_at = NOW()`,
      [targetUserId, payload.group_id, req.user?.id ?? null],
    );
    res.json({ data: { assigned: true, group_id: payload.group_id } });
  } catch (error) {
    console.error("Failed to assign user meditation group:", error);
    res.status(500).json({ error: "Failed to assign meditation group", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.delete("/admin/users/:userId/groups/:groupId", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMeditationsTables();
    const targetUserId = req.params.userId;
    const groupId = req.params.groupId;
    const deleteResult = await pgPool.query(
      `DELETE FROM meditation_group_memberships
       WHERE user_id = $1 AND group_id = $2`,
      [targetUserId, groupId],
    );
    res.json({ data: { removed: (deleteResult.rowCount ?? 0) > 0 } });
  } catch (error) {
    console.error("Failed to remove user from meditation group:", error);
    res.status(500).json({ error: "Failed to remove meditation group membership", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.post("/my-sessions/:sessionId/pay", requireAuth, validateBody(paySessionSchema), async (req, res) => {
  try {
    await ensureMeditationsTables();
    const userId = req.user!.id;
    const sessionId = meditationSessionIdParam(req.params.sessionId);
    const payload = req.body as z.infer<typeof paySessionSchema>;

    const meditationRevolut = getMeditationsRevolutConfig();
    if (!meditationRevolut.secretKey) {
      res.status(503).json({
        error: "Platile pentru meditatii nu sunt configurate momentan.",
        code: "MEDITATIONS_PAYMENTS_NOT_CONFIGURED",
      });
      return;
    }

    const userResult = await pgPool.query<{ email: string }>(`SELECT email FROM users WHERE id = $1 LIMIT 1`, [userId]);
    const userEmail = userResult.rows[0]?.email?.trim() ?? "";
    if (!userEmail) {
      res.status(400).json({ error: "Contul nu are email setat.", code: "EMAIL_REQUIRED" });
      return;
    }

    const sessionResult = await pgPool.query<{
      id: string;
      is_paid: boolean;
      amount_lei: number;
      group_name: string;
      session_date: string;
    }>(
      `SELECT s.id, s.is_paid, s.amount_lei::float8 AS amount_lei, g.name AS group_name, s.session_date::text AS session_date
       FROM meditation_member_sessions s
       JOIN meditation_groups g ON g.id = s.group_id
       WHERE s.id = $1 AND s.user_id = $2
       LIMIT 1`,
      [sessionId, userId],
    );
    const session = sessionResult.rows[0];
    if (!session) {
      res.status(404).json({ error: "Sesiunea nu a fost gasita", code: "NOT_FOUND" });
      return;
    }
    if (session.is_paid) {
      res.json({ data: { paid: true, already_paid: true } });
      return;
    }

    const amountRon = Number(session.amount_lei);
    if (!Number.isFinite(amountRon) || amountRon <= 0) {
      res.status(400).json({ error: "Suma sedintei este invalida.", code: "INVALID_AMOUNT" });
      return;
    }

    const redirectBase = getAppBaseUrl().replace(/\/$/, "");
    const redirectUrl = `${redirectBase}/dashboard?payment=success&meditationSession=${encodeURIComponent(sessionId)}`;

    const client = await pgPool.connect();
    let checkoutUrl: string;
    let orderId: string;
    try {
      await client.query("BEGIN");
      await persistUserBillingProfile(userId, payload.billingProfile, client);
      const { orderId: createdOrderId, checkoutUrl: createdCheckoutUrl } = await revolutCreateOrder(
        {
          amountCents: Math.round(amountRon * 100),
          currency: "RON",
          description: `Meditații — ${session.group_name} (${session.session_date})`,
          redirectUrl,
          customer: {
            email: userEmail,
            name: `${payload.billingProfile.firstName} ${payload.billingProfile.lastName}`.trim(),
            phone: payload.billingProfile.phone || undefined,
          },
          metadata: {
            meditation_session_id: sessionId,
            user_id: userId,
          },
        },
        meditationRevolut,
      );
      orderId = createdOrderId;
      checkoutUrl = createdCheckoutUrl;

      await client.query(
        `UPDATE meditation_member_sessions
         SET revolut_order_id = $3,
             billing_snapshot = $4::jsonb,
             invoice_number = NULL,
             invoice_url = NULL,
             invoice_local_path = NULL
         WHERE id = $1 AND user_id = $2 AND is_paid = false`,
        [sessionId, userId, orderId, JSON.stringify(payload.billingProfile)],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    res.json({
      data: {
        checkout_url: checkoutUrl,
        order_id: orderId,
        amount_lei: amountRon,
      },
    });
  } catch (error) {
    console.error("Failed to pay meditation session:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to pay meditation session",
      code: "INTERNAL_ERROR",
    });
  }
});

meditationsRouter.post("/my-sessions/:sessionId/confirm-payment", requireAuth, async (req, res) => {
  try {
    await ensureMeditationsTables();
    const userId = req.user!.id;
    const sessionId = meditationSessionIdParam(req.params.sessionId);

    const peekResult = await pgPool.query<{
      is_paid: boolean;
      revolut_order_id: string | null;
      invoice_number: string | null;
      invoice_url: string | null;
    }>(
      `SELECT is_paid, revolut_order_id, invoice_number, invoice_url
       FROM meditation_member_sessions
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [sessionId, userId],
    );
    const peek = peekResult.rows[0];
    if (!peek) {
      res.status(404).json({ error: "Sesiunea nu a fost gasita", code: "NOT_FOUND" });
      return;
    }
    if (peek.is_paid) {
      res.json({
        data: {
          ok: true,
          payment_status: "paid" as const,
          already_paid: true,
          invoice_number: peek.invoice_number,
          invoice_url: peek.invoice_url,
        },
      });
      return;
    }
    if (!peek.revolut_order_id) {
      res.status(400).json({ error: "Lipseste comanda Revolut pentru aceasta sesiune.", code: "MISSING_ORDER_ID" });
      return;
    }

    const meditationRevolut = getMeditationsRevolutConfig();
    if (!meditationRevolut.secretKey) {
      res.status(503).json({
        error: "Platile pentru meditatii nu sunt configurate momentan.",
        code: "MEDITATIONS_PAYMENTS_NOT_CONFIGURED",
      });
      return;
    }

    const revolutOrder = await revolutFetchOrder(peek.revolut_order_id, meditationRevolut);
    if (!revolutOrder.isPaid) {
      res.json({
        data: {
          ok: false,
          payment_status: "pending" as const,
          revolut_status: revolutOrder.rawState,
        },
      });
      return;
    }

    const userResult = await pgPool.query<{ email: string }>(`SELECT email FROM users WHERE id = $1 LIMIT 1`, [userId]);
    const userEmail = userResult.rows[0]?.email?.trim() ?? "";

    const client = await pgPool.connect();
    let billingSnapshot: unknown;
    let amountLei = 0;
    let groupName = "";
    let sessionDate = "";
    try {
      await client.query("BEGIN");
      const lockedResult = await client.query<{
        is_paid: boolean;
        billing_snapshot: unknown;
        amount_lei: number;
        group_name: string;
        session_date: string;
        invoice_number: string | null;
        invoice_url: string | null;
      }>(
        `SELECT s.is_paid, s.billing_snapshot, s.amount_lei::float8 AS amount_lei,
                g.name AS group_name, s.session_date::text AS session_date,
                s.invoice_number, s.invoice_url
         FROM meditation_member_sessions s
         JOIN meditation_groups g ON g.id = s.group_id
         WHERE s.id = $1 AND s.user_id = $2
         FOR UPDATE OF s`,
        [sessionId, userId],
      );
      const locked = lockedResult.rows[0];
      if (!locked) {
        await client.query("ROLLBACK").catch(() => {});
        res.status(404).json({ error: "Sesiunea nu a fost gasita", code: "NOT_FOUND" });
        return;
      }
      if (locked.is_paid) {
        await client.query("COMMIT");
        res.json({
          data: {
            ok: true,
            payment_status: "paid" as const,
            already_paid: true,
            invoice_number: locked.invoice_number,
            invoice_url: locked.invoice_url,
          },
        });
        return;
      }

      billingSnapshot = locked.billing_snapshot;
      amountLei = Number(locked.amount_lei);
      groupName = locked.group_name;
      sessionDate = locked.session_date;

      await client.query(
        `UPDATE meditation_member_sessions
         SET is_paid = true, paid_at = NOW()
         WHERE id = $1 AND user_id = $2`,
        [sessionId, userId],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    let invoiceNumber: string | null = null;
    let invoiceUrl: string | null = null;
    let invoiceLocalPath: string | null = null;

    const parsedBilling = billingProfileActivateSchema.safeParse(billingSnapshot);
    if (parsedBilling.success && userEmail) {
      const smartbill = getMeditationsSmartbillConfig();
      const issued = await issueSmartbillInvoiceWithProducts({
        billingProfile: parsedBilling.data,
        userEmail,
        smartbill,
        products: [
          {
            name: `Sedinta meditatii — ${groupName} (${sessionDate})`,
            priceRon: amountLei,
            quantity: 1,
            isService: true,
          },
        ],
      });
      invoiceNumber = issued.invoiceNumber;
      invoiceUrl = issued.invoiceUrl;
      if (invoiceNumber) {
        try {
          const pdf = await downloadSmartbillInvoicePdf(invoiceNumber, smartbill);
          invoiceLocalPath = await persistInvoicePdfToDirectory(MEDITATIONS_INVOICES_DIR, invoiceNumber, pdf);
        } catch (invoiceErr) {
          console.error("Failed to persist meditation invoice PDF:", invoiceErr);
        }
      }
    } else if (!parsedBilling.success) {
      console.warn("Meditation confirm: invalid billing_snapshot, skipping SmartBill", sessionId);
    }

    await pgPool.query(
      `UPDATE meditation_member_sessions
       SET invoice_number = COALESCE($2, invoice_number),
           invoice_url = COALESCE($3, invoice_url),
           invoice_local_path = COALESCE($4, invoice_local_path)
       WHERE id = $1 AND user_id = $5 AND is_paid = true`,
      [sessionId, invoiceNumber, invoiceUrl, invoiceLocalPath, userId],
    );

    if (userEmail.includes("@")) {
      const appBase = getAppBaseUrl().replace(/\/$/, "") || "https://www.zecelainfo.ro";
      const billingFirst = parsedBilling.success ? parsedBilling.data.firstName : null;
      void sendPurchaseThankYouEmail({
        to: userEmail,
        customerFirstName: billingFirst,
        purchaseLabel: `Meditații — ședință (${groupName}, ${sessionDate})`,
        amountRon: amountLei,
        currency: "RON",
        invoiceNumber,
        invoiceUrl,
        invoicePdfPath: invoiceLocalPath,
        primaryCtaPath: "/dashboard",
        appBaseUrl: appBase,
      }).catch((err) => console.error("[meditations] thank-you email failed:", err));
    }

    res.json({
      data: {
        ok: true,
        payment_status: "paid" as const,
        invoice_number: invoiceNumber,
        invoice_url: invoiceUrl,
        local_redirect_url: "http://localhost:3000/dashboard?payment=done",
      },
    });
  } catch (error) {
    console.error("Failed to confirm meditation payment:", error);
    res.status(500).json({ error: "Failed to confirm payment", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.get("/my-sessions/:sessionId/invoice", requireAuth, async (req, res) => {
  try {
    await ensureMeditationsTables();
    const userId = req.user!.id;
    const sessionId = meditationSessionIdParam(req.params.sessionId);
    const result = await pgPool.query<{
      invoice_number: string | null;
      invoice_local_path: string | null;
    }>(
      `SELECT invoice_number, invoice_local_path
       FROM meditation_member_sessions
       WHERE id = $1 AND user_id = $2 AND is_paid = true
       LIMIT 1`,
      [sessionId, userId],
    );
    const row = result.rows[0];
    if (!row || !row.invoice_number) {
      res.status(404).json({ error: "Factura nu este disponibila inca.", code: "INVOICE_NOT_AVAILABLE" });
      return;
    }
    if (row.invoice_local_path) {
      try {
        const localBuffer = await fs.readFile(row.invoice_local_path);
        if (localBuffer.length >= 200 && localBuffer.subarray(0, 5).toString() === "%PDF-") {
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${sanitizeInvoiceFileName(row.invoice_number)}.pdf"`,
          );
          res.status(200).send(localBuffer);
          return;
        }
      } catch {
        // fallback SmartBill
      }
    }
    const pdf = await downloadSmartbillInvoicePdf(row.invoice_number, getMeditationsSmartbillConfig());
    const savedPath = await persistInvoicePdfToDirectory(MEDITATIONS_INVOICES_DIR, row.invoice_number, pdf);
    await pgPool.query(`UPDATE meditation_member_sessions SET invoice_local_path = $2 WHERE id = $1`, [sessionId, savedPath]);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${pdf.fileName}"`);
    res.status(200).send(pdf.buffer);
  } catch (error) {
    console.error("Failed to download meditation invoice:", error);
    res.status(500).json({ error: "Failed to download invoice", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.get("/leads/me", requireAuth, async (req, res) => {
  try {
    await ensureMeditationsTables();
    const existing = await pgPool.query<{ id: string }>(
      `SELECT id FROM meditations_leads WHERE user_id = $1 LIMIT 1`,
      [req.user?.id],
    );
    res.json({ data: { already_registered: existing.rows.length > 0 } });
  } catch (error) {
    console.error("Failed to check meditation lead status:", error);
    res.status(500).json({ error: "Failed to check meditation lead status", code: "INTERNAL_ERROR" });
  }
});

meditationsRouter.post("/leads", requireAuth, validateBody(createLeadSchema), async (req, res) => {
  try {
    await ensureMeditationsTables();

    const existing = await pgPool.query<{ id: string }>(
      `SELECT id FROM meditations_leads WHERE user_id = $1 LIMIT 1`,
      [req.user?.id],
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Te-ai inscris deja la meditatii.", code: "ALREADY_REGISTERED" });
      return;
    }

    const payload = req.body as z.infer<typeof createLeadSchema>;
    const normalizedPhone = payload.phone.trim();
    const result = await pgPool.query<{ id: string }>(
      `INSERT INTO meditations_leads (user_id, full_name, email, phone, grade, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [req.user?.id, payload.full_name.trim(), payload.email.trim().toLowerCase(), normalizedPhone, payload.grade.trim(), payload.message?.trim() || null],
    );
    if (req.user?.id) {
      await pgPool.query(`UPDATE users SET phone = $2 WHERE id = $1`, [req.user.id, normalizedPhone]);
    }

    try {
      await ensureMeditationsSignupDiscountCode();
      await sendMeditationSignupConfirmationEmail({
        to: payload.email.trim().toLowerCase(),
        customerFirstName: payload.full_name.trim().split(/\s+/).slice(1).join(" ") || payload.full_name.trim(),
        preparationFor: payload.grade.trim(),
        appBaseUrl: getAppBaseUrl(),
      });
    } catch (emailError) {
      console.error("Failed to send meditation signup confirmation email:", emailError);
    }

    res.status(201).json({ data: { id: result.rows[0]?.id, created: true } });
  } catch (error) {
    console.error("Failed to create meditation lead:", error);
    res.status(500).json({ error: "Failed to create meditation lead", code: "INTERNAL_ERROR" });
  }
});
