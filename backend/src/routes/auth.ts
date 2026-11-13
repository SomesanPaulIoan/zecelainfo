import { Router } from "express";
import { randomUUID } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { pgPool } from "../db/postgres";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  generateOtpCode,
  hashPassword,
  signAuthToken,
  verifyPassword,
} from "../services/auth.service";
import { isSmtpConfigured, sendOtpEmail, sendTemporaryPasswordEmail } from "../services/email.service";
import { ensureGrileTables } from "./grile";
import { ensureCoursesTable } from "./courses";
import {
  ensureDiscountCodesTable,
  generateRandomDiscountCode,
  normalizeDiscountCodeInput,
} from "../services/discountCode.service";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3).max(32),
  full_name: z.string().min(3).max(120).optional(),
  // Fara "role": zod elimina campurile necunoscute, deci un rol trimis in request e ignorat.
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
const sendOtpSchema = z.object({
  email: z.string().email(),
});
const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});
const forgotPasswordSchema = z.object({
  email: z.string().email(),
});
const changePasswordSchema = z
  .object({
    current_password: z.string().min(6),
    new_password: z.string().min(6),
    confirm_password: z.string().min(6),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Parolele noi nu coincid",
    path: ["confirm_password"],
  });
const googleLoginSchema = z.object({
  id_token: z.string().min(10),
});

const adminGrantGrileAccessSchema = z.object({
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
});

const adminGrantCourseAccessSchema = z
  .object({
    course_slug: z.string().min(1),
    grant_mode: z.enum(["all_parts", "selected_parts"]),
    part_ids: z.array(z.string().uuid()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.grant_mode === "selected_parts" && (!data.part_ids || data.part_ids.length === 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["part_ids"],
        message: "Selecteaza cel putin o parte de curs",
      });
    }
  });

const adminCreateDiscountCodeSchema = z.object({
  percent_off: z.number().int().min(5).max(100),
  scope: z.enum(["site", "courses", "grile", "bac_correction"]),
  code: z.string().min(1).max(64).optional().nullable(),
});

export const authRouter = Router();
const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

async function ensureUsersNameColumns() {
  await pgPool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS first_name TEXT,
      ADD COLUMN IF NOT EXISTS last_name TEXT
  `);
}

async function ensureAdminRole(userId?: string) {
  const roleResult = await pgPool.query<{ role: "student" | "professor" | "admin" }>(
    `SELECT role FROM users WHERE id = $1 LIMIT 1`,
    [userId],
  );
  return roleResult.rows[0]?.role === "admin";
}

authRouter.post("/register", validateBody(registerSchema), async (req, res) => {
  const { email, password, username, full_name } = req.body;
  // Inregistrarea publica creeaza doar elevi. Rolurile admin/profesor se dau doar de un admin, niciodata din request.
  const role = "student";
  try {
    const existing = await pgPool.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [email]);
    if (existing.rows.length > 0) {
      res.status(400).json({ error: "Email sau username deja folosit", code: "REGISTER_FAILED" });
      return;
    }
    // Username-ul vine din „prenume.nume”: doi elevi cu acelasi nume nu trebuie blocati, primesc un sufix.
    let uniqueUsername: string = username;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const taken = await pgPool.query(`SELECT 1 FROM users WHERE username = $1 LIMIT 1`, [uniqueUsername]);
      if (taken.rows.length === 0) break;
      uniqueUsername = `${String(username).slice(0, 27)}.${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const userId = randomUUID();
    const passwordHash = await hashPassword(password);
    await pgPool.query(
      `INSERT INTO users (id, email, username, full_name, role, password_hash, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, false)`,
      [userId, email, uniqueUsername, full_name?.trim() || null, role, passwordHash],
    );

    const code = generateOtpCode();
    await pgPool.query(
      `INSERT INTO email_otps (email, code, purpose, expires_at)
       VALUES ($1, $2, 'auth', NOW() + INTERVAL '10 minutes')`,
      [email, code],
    );

    await sendOtpEmail(email, code);

    res.status(201).json({
      data: {
        user: { id: userId, email, username: uniqueUsername, full_name: full_name?.trim() || null, role, email_verified: false },
        message: "Cont creat. Verifica emailul cu codul OTP.",
      },
    });
  } catch (error) {
    console.error("Register failed:", error);
    res.status(400).json({ error: "Register failed", code: "REGISTER_FAILED" });
  }
});

authRouter.post("/login", validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pgPool.query<{
      id: string;
      email: string;
      username: string;
      full_name: string | null;
      role: "student" | "professor" | "admin";
      password_hash: string | null;
      email_verified: boolean;
    }>(
      `SELECT id, email, username, full_name, role, password_hash, email_verified
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email],
    );
    const user = result.rows[0];
    if (!user || !user.password_hash) {
      res.status(401).json({ error: "Email sau parola invalida", code: "UNAUTHORIZED" });
      return;
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      res.status(401).json({ error: "Email sau parola invalida", code: "UNAUTHORIZED" });
      return;
    }

    if (!user.email_verified) {
      res.status(403).json({
        error: "Contul nu este confirmat. Verifica OTP.",
        code: "EMAIL_NOT_VERIFIED",
      });
      return;
    }

    const token = signAuthToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          full_name: user.full_name,
          role: user.role,
          email_verified: user.email_verified,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(401).json({ error: "Login failed", code: "UNAUTHORIZED" });
  }
});

authRouter.post("/logout", requireAuth, async (_req, res) => {
  res.json({ data: { ok: true } });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  try {
    const result = await pgPool.query(
      `SELECT id, email, username, full_name, role, email_verified, created_at, phone
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [req.user?.id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
      return;
    }
    res.json({ data: result.rows[0] });
  } catch {
    res.status(500).json({ error: "Failed to load profile", code: "INTERNAL_ERROR" });
  }
});

authRouter.get("/admin/users", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }

    await ensureUsersNameColumns();

    const rawSearch = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const params: unknown[] = [];
    let whereSql = "";

    if (rawSearch) {
      params.push(`%${rawSearch}%`);
      whereSql = `
        WHERE (
          COALESCE(first_name, '') ILIKE $1 OR
          COALESCE(last_name, '') ILIKE $1 OR
          COALESCE(full_name, '') ILIKE $1 OR
          email ILIKE $1
        )
      `;
    }

    const result = await pgPool.query(
      `SELECT
         id,
         email,
         username,
         role,
         email_verified,
         created_at,
         full_name,
         first_name,
         last_name
       FROM users
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT 500`,
      params,
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error("Failed to fetch admin users:", error);
    res.status(500).json({ error: "Failed to fetch admin users", code: "INTERNAL_ERROR" });
  }
});

authRouter.get("/admin/users/:userId/access", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }

    await ensureUsersNameColumns();
    await ensureGrileTables();
    await ensureCoursesTable();

    const targetUserId = req.params.userId;
    const userResult = await pgPool.query<{
      id: string;
      email: string;
      username: string;
      role: "student" | "professor" | "admin";
      full_name: string | null;
      first_name: string | null;
      last_name: string | null;
    }>(
      `SELECT id, email, username, role, full_name, first_name, last_name
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [targetUserId],
    );
    const target = userResult.rows[0];
    if (!target) {
      res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
      return;
    }

    const grileStatusResult = await pgPool.query<{
      access_until: string | null;
      trial_used: boolean;
      current_plan_code: string | null;
    }>(
      `SELECT access_until::text, trial_used, current_plan_code
       FROM user_grile_access
       WHERE user_id = $1
       LIMIT 1`,
      [targetUserId],
    );
    const grileEventsResult = await pgPool.query<{
      id: string;
      plan_code: string;
      plan_name: string;
      starts_at: string;
      ends_at: string;
      is_free: boolean;
      is_paid: boolean;
      created_at: string;
    }>(
      `SELECT id, plan_code, plan_name, starts_at::text, ends_at::text, is_free, is_paid, created_at::text
       FROM user_grile_access_events
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [targetUserId],
    );

    const courseAccessResult = await pgPool.query<{
      course_id: string;
      course_name: string;
      course_slug: string;
      course_part_id: string;
      course_part_name: string;
      part_order_index: number;
      granted_at: string;
    }>(
      `SELECT
         c.id AS course_id,
         c.name AS course_name,
         c.slug AS course_slug,
         p.id AS course_part_id,
         p.name AS course_part_name,
         p.order_index AS part_order_index,
         a.created_at::text AS granted_at
       FROM user_course_part_access a
       JOIN courses c ON c.id = a.course_id
       JOIN course_parts p ON p.id = a.course_part_id
       WHERE a.user_id = $1
       ORDER BY c.name ASC, p.order_index ASC`,
      [targetUserId],
    );

    const groupedCourses = new Map<
      string,
      { course_id: string; course_slug: string; course_name: string; parts: Array<{ id: string; name: string; order_index: number; granted_at: string }> }
    >();
    for (const row of courseAccessResult.rows) {
      const key = row.course_id;
      const current = groupedCourses.get(key) ?? {
        course_id: row.course_id,
        course_slug: row.course_slug,
        course_name: row.course_name,
        parts: [],
      };
      current.parts.push({
        id: row.course_part_id,
        name: row.course_part_name,
        order_index: row.part_order_index,
        granted_at: row.granted_at,
      });
      groupedCourses.set(key, current);
    }

    const grileStatus = grileStatusResult.rows[0] ?? {
      access_until: null,
      trial_used: false,
      current_plan_code: null,
    };

    res.json({
      data: {
        user: target,
        grile: {
          has_access: Boolean(grileStatus.access_until && new Date(grileStatus.access_until).getTime() > Date.now()),
          access_until: grileStatus.access_until,
          trial_used: grileStatus.trial_used,
          current_plan_code: grileStatus.current_plan_code,
          events: grileEventsResult.rows,
        },
        courses: Array.from(groupedCourses.values()),
      },
    });
  } catch (error) {
    console.error("Failed to fetch user admin access:", error);
    res.status(500).json({ error: "Failed to fetch user access", code: "INTERNAL_ERROR" });
  }
});

authRouter.post("/admin/users/:userId/grile-access", requireAuth, validateBody(adminGrantGrileAccessSchema), async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }

    await ensureGrileTables();
    const targetUserId = req.params.userId;
    const startsAt = new Date(req.body.starts_at);
    const endsAt = new Date(req.body.ends_at);
    if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime())) {
      res.status(400).json({ error: "Interval invalid", code: "INVALID_INTERVAL" });
      return;
    }
    if (endsAt.getTime() <= startsAt.getTime()) {
      res.status(400).json({ error: "Data de final trebuie sa fie dupa inceput", code: "INVALID_INTERVAL" });
      return;
    }
    // Schema curenta foloseste doar access_until pentru gating; suportam acordari care incep acum sau in trecut.
    if (startsAt.getTime() > Date.now()) {
      res.status(400).json({ error: "Data de inceput trebuie sa fie acum sau in trecut", code: "UNSUPPORTED_FUTURE_START" });
      return;
    }

    const userExists = await pgPool.query(`SELECT id FROM users WHERE id = $1 LIMIT 1`, [targetUserId]);
    if (!userExists.rows[0]) {
      res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
      return;
    }

    await pgPool.query(
      `INSERT INTO user_grile_access (user_id, access_until, trial_used, current_plan_code, updated_at)
       VALUES ($1, $2, false, 'admin_manual', NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         access_until = CASE
           WHEN user_grile_access.access_until IS NULL OR user_grile_access.access_until < EXCLUDED.access_until
             THEN EXCLUDED.access_until
           ELSE user_grile_access.access_until
         END,
         current_plan_code = 'admin_manual',
         updated_at = NOW()`,
      [targetUserId, endsAt.toISOString()],
    );

    await pgPool.query(
      `INSERT INTO user_grile_access_events (
         user_id, plan_code, plan_name, starts_at, ends_at, is_free, is_paid, paid_amount, currency, invoice_number, invoice_url, invoice_issued_at, billing_snapshot, terms_accepted_at
       )
       VALUES ($1, 'admin_manual', 'Acordat manual de admin', $2, $3, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NOW())`,
      [targetUserId, startsAt.toISOString(), endsAt.toISOString()],
    );

    res.json({
      data: {
        ok: true,
        granted_until: endsAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to grant admin grile access:", error);
    res.status(500).json({ error: "Failed to grant grile access", code: "INTERNAL_ERROR" });
  }
});

authRouter.post("/admin/users/:userId/course-access", requireAuth, validateBody(adminGrantCourseAccessSchema), async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }

    await ensureCoursesTable();
    const targetUserId = req.params.userId;
    const userExists = await pgPool.query(`SELECT id FROM users WHERE id = $1 LIMIT 1`, [targetUserId]);
    if (!userExists.rows[0]) {
      res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
      return;
    }

    const courseResult = await pgPool.query<{ id: string }>(
      `SELECT id
       FROM courses
       WHERE slug = $1 AND is_published = true
       LIMIT 1`,
      [req.body.course_slug],
    );
    const course = courseResult.rows[0];
    if (!course) {
      res.status(404).json({ error: "Course not found", code: "NOT_FOUND" });
      return;
    }

    const partsResult = await pgPool.query<{ id: string }>(
      `SELECT id
       FROM course_parts
       WHERE course_id = $1 AND is_published = true`,
      [course.id],
    );
    const allPartIds = new Set(partsResult.rows.map((row) => row.id));
    const requestedPartIds =
      req.body.grant_mode === "all_parts" ? [...allPartIds] : (req.body.part_ids ?? []).filter((id: string) => allPartIds.has(id));

    if (requestedPartIds.length === 0) {
      res.status(400).json({ error: "Nu exista parti valide pentru acordare", code: "NO_VALID_PARTS" });
      return;
    }

    for (const partId of requestedPartIds) {
      await pgPool.query(
        `INSERT INTO user_course_part_access (user_id, course_id, course_part_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, course_part_id) DO UPDATE
           SET access_until = NULL, is_trial = FALSE
           WHERE user_course_part_access.is_trial`,
        [targetUserId, course.id, partId],
      );
    }

    res.json({
      data: {
        ok: true,
        granted_parts: requestedPartIds.length,
      },
    });
  } catch (error) {
    console.error("Failed to grant admin course access:", error);
    res.status(500).json({ error: "Failed to grant course access", code: "INTERNAL_ERROR" });
  }
});

authRouter.delete("/admin/users/:userId/grile-access", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureGrileTables();
    const targetUserId = req.params.userId;
    await pgPool.query(
      `INSERT INTO user_grile_access (user_id, access_until, trial_used, current_plan_code, updated_at)
       VALUES ($1, NULL, false, NULL, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET access_until = NULL, current_plan_code = NULL, updated_at = NOW()`,
      [targetUserId],
    );
    res.json({ data: { ok: true } });
  } catch (error) {
    console.error("Failed to revoke grile access:", error);
    res.status(500).json({ error: "Failed to revoke grile access", code: "INTERNAL_ERROR" });
  }
});

authRouter.delete("/admin/users/:userId/course-access", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureCoursesTable();
    const targetUserId = req.params.userId;
    const courseSlug = typeof req.query.course_slug === "string" ? req.query.course_slug.trim() : "";
    if (!courseSlug) {
      res.status(400).json({ error: "course_slug este obligatoriu", code: "MISSING_COURSE_SLUG" });
      return;
    }

    const courseResult = await pgPool.query<{ id: string }>(
      `SELECT id FROM courses WHERE slug = $1 LIMIT 1`,
      [courseSlug],
    );
    const course = courseResult.rows[0];
    if (!course) {
      res.status(404).json({ error: "Course not found", code: "NOT_FOUND" });
      return;
    }

    const deleteResult = await pgPool.query<{ count: number }>(
      `WITH deleted AS (
         DELETE FROM user_course_part_access
         WHERE user_id = $1 AND course_id = $2
         RETURNING id
       )
       SELECT COUNT(*)::int AS count FROM deleted`,
      [targetUserId, course.id],
    );
    res.json({ data: { ok: true, removed: deleteResult.rows[0]?.count ?? 0 } });
  } catch (error) {
    console.error("Failed to revoke course access:", error);
    res.status(500).json({ error: "Failed to revoke course access", code: "INTERNAL_ERROR" });
  }
});

authRouter.get("/admin/discount-codes", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureDiscountCodesTable();
    const result = await pgPool.query<{
      id: string;
      code: string;
      percent_off: number;
      scope: string;
      is_active: boolean;
      uses_count: number;
      created_at: string;
    }>(
      `SELECT id, code, percent_off, scope, is_active, uses_count, created_at::text
       FROM discount_codes
       ORDER BY created_at DESC`,
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("admin list discount codes:", error);
    res.status(500).json({ error: "Nu am putut incarca codurile.", code: "INTERNAL_ERROR" });
  }
});

authRouter.post("/admin/discount-codes", requireAuth, validateBody(adminCreateDiscountCodeSchema), async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureDiscountCodesTable();
    const { percent_off, scope, code: rawCode } = req.body as z.infer<typeof adminCreateDiscountCodeSchema>;
    let candidate =
      typeof rawCode === "string" && rawCode.trim().length > 0 ? normalizeDiscountCodeInput(rawCode) : generateRandomDiscountCode();
    if (!candidate) {
      candidate = generateRandomDiscountCode();
    }
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const inserted = await pgPool.query<{
          id: string;
          code: string;
          percent_off: number;
          scope: string;
          is_active: boolean;
          uses_count: number;
          created_at: string;
        }>(
          `INSERT INTO discount_codes (code, percent_off, scope)
           VALUES ($1, $2, $3)
           RETURNING id, code, percent_off, scope, is_active, uses_count, created_at::text`,
          [candidate, percent_off, scope],
        );
        res.status(201).json({ data: inserted.rows[0] });
        return;
      } catch (insertError: unknown) {
        const code = typeof insertError === "object" && insertError && "code" in insertError ? String((insertError as { code?: string }).code) : "";
        if (code === "23505" && !rawCode?.trim()) {
          candidate = generateRandomDiscountCode();
          continue;
        }
        if (code === "23505") {
          res.status(400).json({ error: "Acest cod exista deja.", code: "DUPLICATE_CODE" });
          return;
        }
        throw insertError;
      }
    }
    res.status(500).json({ error: "Nu am putut genera un cod unic.", code: "INTERNAL_ERROR" });
  } catch (error) {
    console.error("admin create discount code:", error);
    res.status(500).json({ error: "Nu am putut crea codul.", code: "INTERNAL_ERROR" });
  }
});

authRouter.delete("/admin/discount-codes/:id", requireAuth, async (req, res) => {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureDiscountCodesTable();
    const id = typeof req.params.id === "string" ? req.params.id.trim() : "";
    if (!id) {
      res.status(400).json({ error: "ID invalid", code: "INVALID_PAYLOAD" });
      return;
    }
    const del = await pgPool.query(`DELETE FROM discount_codes WHERE id = $1::uuid`, [id]);
    if (del.rowCount === 0) {
      res.status(404).json({ error: "Codul nu exista.", code: "NOT_FOUND" });
      return;
    }
    res.json({ data: { ok: true } });
  } catch (error) {
    console.error("admin delete discount code:", error);
    res.status(500).json({ error: "Nu am putut sterge codul.", code: "INTERNAL_ERROR" });
  }
});

authRouter.post("/send-otp", validateBody(sendOtpSchema), async (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  try {
    const userResult = await pgPool.query<{ id: string; email_verified: boolean }>(
      `SELECT id, email_verified FROM users WHERE email = $1 LIMIT 1`,
      [email],
    );
    const user = userResult.rows[0];
    if (!user) {
      res.status(404).json({ error: "Cont inexistent pentru acest email.", code: "NOT_FOUND" });
      return;
    }
    if (user.email_verified) {
      res.status(400).json({
        error: "Contul este deja confirmat. Poti face login.",
        code: "EMAIL_ALREADY_VERIFIED",
      });
      return;
    }

    const recentOtp = await pgPool.query<{ created_at: string }>(
      `SELECT created_at::text
       FROM email_otps
       WHERE email = $1 AND purpose = 'auth'
       ORDER BY created_at DESC
       LIMIT 1`,
      [email],
    );
    const lastSentAt = recentOtp.rows[0]?.created_at;
    if (lastSentAt && Date.now() - new Date(lastSentAt).getTime() < 60_000) {
      res.status(429).json({
        error: "Poti cere un cod nou peste cateva secunde.",
        code: "OTP_RATE_LIMIT",
      });
      return;
    }

    await pgPool.query(
      `UPDATE email_otps
       SET used_at = NOW()
       WHERE email = $1 AND purpose = 'auth' AND used_at IS NULL`,
      [email],
    );

    const code = generateOtpCode();
    await pgPool.query(
      `INSERT INTO email_otps (email, code, purpose, expires_at)
       VALUES ($1, $2, 'auth', NOW() + INTERVAL '10 minutes')`,
      [email, code],
    );

    await sendOtpEmail(email, code);
    res.json({
      data: {
        ok: true,
        message: isSmtpConfigured()
          ? "Cod OTP trimis pe email. Este valabil 10 minute."
          : "Cod OTP generat local (SMTP neconfigurat, vezi log backend). Valabil 10 minute.",
      },
    });
  } catch (error) {
    console.error("Send OTP failed:", error);
    res.status(500).json({ error: "Nu am putut trimite codul acum.", code: "INTERNAL_ERROR" });
  }
});

authRouter.post("/google-login", validateBody(googleLoginSchema), async (req, res) => {
  if (!googleClient) {
    res.status(400).json({
      error: "Google login is not configured",
      code: "GOOGLE_NOT_CONFIGURED",
    });
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: req.body.id_token,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();
    const email = payload?.email;
    const emailVerified = payload?.email_verified;
    const name = payload?.name ?? "";

    if (!email || !emailVerified) {
      res.status(401).json({ error: "Invalid Google account", code: "UNAUTHORIZED" });
      return;
    }

    let userResult = await pgPool.query<{
      id: string;
      email: string;
      username: string;
      full_name: string | null;
      role: "student" | "professor" | "admin";
      email_verified: boolean;
    }>(
      `SELECT id, email, username, full_name, role, email_verified
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email],
    );

    let user = userResult.rows[0];
    const isNewUser = !user;
    if (!user) {
      const id = randomUUID();
      const username = `google_${email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20)}_${Math.floor(
        1000 + Math.random() * 9000,
      )}`;
      await pgPool.query(
        `INSERT INTO users (id, email, username, full_name, role, email_verified)
         VALUES ($1, $2, $3, $4, 'student', true)`,
        [id, email, username, name || null],
      );
      userResult = await pgPool.query(
        `SELECT id, email, username, full_name, role, email_verified FROM users WHERE id = $1 LIMIT 1`,
        [id],
      );
      user = userResult.rows[0];
    } else if (!user.email_verified) {
      await pgPool.query(`UPDATE users SET email_verified = true WHERE id = $1`, [user.id]);
      user.email_verified = true;
    }

    const token = signAuthToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      data: {
        user,
        token,
        is_new_user: isNewUser,
      },
    });
  } catch (error) {
    console.error("Google login failed:", error);
    res.status(401).json({ error: "Google login failed", code: "UNAUTHORIZED" });
  }
});

authRouter.post("/verify-otp", validateBody(verifyOtpSchema), async (req, res) => {
  const { email, code } = req.body;
  try {
    const otp = await pgPool.query<{
      id: string;
      email: string;
      code: string;
      expires_at: string;
      used_at: string | null;
    }>(
      `SELECT id, email, code, expires_at, used_at
       FROM email_otps
       WHERE email = $1 AND code = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, code],
    );
    const row = otp.rows[0];
    if (!row) {
      res.status(400).json({ error: "Cod invalid", code: "INVALID_OTP" });
      return;
    }
    if (row.used_at) {
      res.status(400).json({ error: "Cod deja folosit", code: "INVALID_OTP" });
      return;
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      res.status(400).json({ error: "Cod expirat", code: "INVALID_OTP" });
      return;
    }

    await pgPool.query(`UPDATE email_otps SET used_at = NOW() WHERE id = $1`, [row.id]);
    await pgPool.query(`UPDATE users SET email_verified = true WHERE email = $1`, [email]);

    const userResult = await pgPool.query<{
      id: string;
      email: string;
      username: string;
      full_name: string | null;
      role: "student" | "professor" | "admin";
      email_verified: boolean;
    }>(
      `SELECT id, email, username, full_name, role, email_verified FROM users WHERE email = $1 LIMIT 1`,
      [email],
    );
    const user = userResult.rows[0];
    if (!user) {
      res.status(404).json({ error: "Cont inexistent", code: "NOT_FOUND" });
      return;
    }

    const token = signAuthToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      data: {
        ok: true,
        user,
        token,
      },
    });
  } catch (error) {
    console.error("Verify OTP failed:", error);
    res.status(500).json({ error: "Verify OTP failed", code: "INTERNAL_ERROR" });
  }
});

authRouter.post("/forgot-password", validateBody(forgotPasswordSchema), async (req, res) => {
  const { email } = req.body;
  try {
    const userResult = await pgPool.query<{ id: string }>(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [email],
    );
    const user = userResult.rows[0];
    // Always respond with success to avoid revealing which emails exist.
    if (!user) {
      res.json({
        data: {
          ok: true,
          message: "Daca exista cont pentru acest email, am trimis o parola provizorie.",
        },
      });
      return;
    }

    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const temporaryPassword = Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
    const passwordHash = await hashPassword(temporaryPassword);
    await pgPool.query(
      `UPDATE users
       SET password_hash = $2
       WHERE id = $1`,
      [user.id, passwordHash],
    );
    await sendTemporaryPasswordEmail(email, temporaryPassword);

    res.json({
      data: {
        ok: true,
        message: "Daca exista cont pentru acest email, am trimis o parola provizorie.",
      },
    });
  } catch (error) {
    console.error("Forgot password failed:", error);
    res.status(500).json({ error: "Nu am putut procesa cererea acum.", code: "INTERNAL_ERROR" });
  }
});

authRouter.post("/change-password", requireAuth, validateBody(changePasswordSchema), async (req, res) => {
  const { current_password, new_password } = req.body as z.infer<typeof changePasswordSchema>;
  try {
    const userId = req.user!.id;
    const userResult = await pgPool.query<{ id: string; password_hash: string | null }>(
      `SELECT id, password_hash
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [userId],
    );
    const user = userResult.rows[0];
    if (!user || !user.password_hash) {
      res.status(404).json({ error: "Utilizatorul nu exista.", code: "NOT_FOUND" });
      return;
    }

    const ok = await verifyPassword(current_password, user.password_hash);
    if (!ok) {
      res.status(400).json({ error: "Parola veche este incorecta.", code: "INVALID_CURRENT_PASSWORD" });
      return;
    }

    const newHash = await hashPassword(new_password);
    await pgPool.query(
      `UPDATE users
       SET password_hash = $2
       WHERE id = $1`,
      [userId, newHash],
    );

    res.json({ data: { ok: true, message: "Parola a fost actualizata cu succes." } });
  } catch (error) {
    console.error("Change password failed:", error);
    res.status(500).json({ error: "Nu am putut actualiza parola.", code: "INTERNAL_ERROR" });
  }
});
