import { Router } from "express";
import { z } from "zod";
import { pgPool } from "../db/postgres";
import { requireAuth } from "../middleware/auth";
import {
  cleanUtmValue,
  ensureMarketingTables,
  isLikelyBot,
  parseExamKey,
  pickUtm,
  recordPageHit,
  saveUserAcquisition,
  setUserExam,
} from "../services/marketing.service";
import { GRILE_PUBLIC_PLANS } from "./grile";
import { OFFERS_2027_ACCESS_UNTIL, buildOffers2027Catalog } from "../services/offers2027.service";

export const marketingRouter = Router();

// ---------------------------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------------------------

const hitSchema = z.object({
  page: z.string().max(40),
  exam: z.string().max(20).optional().nullable(),
  utm: z.record(z.string(), z.unknown()).optional().nullable(),
});

/** Contor de afisari pe zi; fara cookie, fara IP salvat, fara identificator. */
marketingRouter.post("/hit", async (req, res) => {
  try {
    const parsed = hitSchema.safeParse(req.body);
    if (!parsed.success || isLikelyBot(req)) {
      res.status(204).end();
      return;
    }
    await recordPageHit({
      pageGroup: parsed.data.page,
      exam: parseExamKey(parsed.data.exam ?? null),
      utm: pickUtm(parsed.data.utm ?? undefined),
    });
    res.status(204).end();
  } catch (error) {
    console.error("marketing hit:", error);
    res.status(204).end();
  }
});

let pricingCache: { at: number; data: unknown } | null = null;

/** Preturile reale, dintr-o singura sursa (planurile din backend), ca paginile sa nu le mai hardcodeze. */
marketingRouter.get("/pricing", async (_req, res) => {
  try {
    if (!pricingCache || Date.now() - pricingCache.at > 5 * 60 * 1000) {
      const catalog = await buildOffers2027Catalog();
      pricingCache = {
        at: Date.now(),
        data: {
          access_until: OFFERS_2027_ACCESS_UNTIL.toISOString(),
          grile_plans: GRILE_PUBLIC_PLANS(),
          bundles: catalog
            .filter((item) => item.includes_course)
            .map((item) => ({
              code: item.code,
              price_ron: item.promo_price_ron,
              course_slug: item.course_slug,
              course_name: item.course_name,
              catalog_course_ron: item.catalog_course_ron,
            })),
        },
      };
    }
    res.json({ data: pricingCache.data });
  } catch (error) {
    console.error("marketing pricing:", error);
    res.status(500).json({ error: "Nu am putut incarca preturile.", code: "INTERNAL_ERROR" });
  }
});

// ---------------------------------------------------------------------------------------------
// Utilizator logat
// ---------------------------------------------------------------------------------------------

const attributionSchema = z.object({
  utm: z.record(z.string(), z.unknown()).optional().nullable(),
  ttclid: z.string().max(200).optional().nullable(),
  landingPath: z.string().max(300).optional().nullable(),
  exam: z.string().max(20).optional().nullable(),
  firstTouchAt: z.string().max(40).optional().nullable(),
  marketingConsent: z.boolean().default(false),
  demoSessionId: z.string().uuid().optional().nullable(),
});

/**
 * Trimis de frontend o data dupa login, doar daca vizitatorul a acceptat statisticile.
 * Leaga si sesiunea de demo (daca exista) de cont, pentru rata demo → cont.
 */
marketingRouter.post("/attribution", requireAuth, async (req, res) => {
  try {
    const parsed = attributionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
      return;
    }
    const userId = req.user!.id;
    const ttclid = parsed.data.ttclid?.trim().replace(/[^A-Za-z0-9_\-.]/g, "").slice(0, 200) || null;
    const landing = parsed.data.landingPath?.startsWith("/") ? parsed.data.landingPath.split("?")[0]!.slice(0, 200) : null;
    await saveUserAcquisition(userId, {
      utm: pickUtm(parsed.data.utm ?? undefined),
      ttclid,
      landingPath: landing,
      exam: parseExamKey(parsed.data.exam ?? null),
      firstTouchAt: parsed.data.firstTouchAt ?? null,
      marketingConsent: parsed.data.marketingConsent,
    });
    if (parsed.data.demoSessionId) {
      await pgPool.query(`UPDATE demo_sessions SET user_id = $2 WHERE id = $1 AND user_id IS NULL`, [
        parsed.data.demoSessionId,
        userId,
      ]);
    }
    res.json({ data: { ok: true } });
  } catch (error) {
    console.error("marketing attribution:", error);
    res.status(500).json({ error: "Eroare interna", code: "INTERNAL_ERROR" });
  }
});

/** Retragerea consimtamantului de marketing: sterge ttclid si opreste trimiterile server-side. */
marketingRouter.post("/consent", requireAuth, async (req, res) => {
  try {
    await ensureMarketingTables();
    const marketing = req.body?.marketing === true;
    await pgPool.query(
      `INSERT INTO user_acquisition (user_id, marketing_consent) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET marketing_consent = EXCLUDED.marketing_consent,
         ttclid = CASE WHEN EXCLUDED.marketing_consent THEN user_acquisition.ttclid ELSE NULL END, updated_at = NOW()`,
      [req.user!.id, marketing],
    );
    res.json({ data: { ok: true } });
  } catch (error) {
    console.error("marketing consent:", error);
    res.status(500).json({ error: "Eroare interna", code: "INTERNAL_ERROR" });
  }
});

marketingRouter.put("/me/exam", requireAuth, async (req, res) => {
  const exam = parseExamKey(req.body?.exam);
  if (!exam) {
    res.status(400).json({ error: "Examen invalid", code: "INVALID_EXAM" });
    return;
  }
  try {
    await setUserExam(req.user!.id, exam);
    res.json({ data: { exam } });
  } catch (error) {
    console.error("marketing set exam:", error);
    res.status(500).json({ error: "Eroare interna", code: "INTERNAL_ERROR" });
  }
});

/**
 * Starea comerciala a utilizatorului: nou / trial / trial expirat / doar grile / pachet complet,
 * plus progresul REAL din perioada de trial (fara valori inventate: ce nu masuram nu trimitem).
 */
marketingRouter.get("/me/journey", requireAuth, async (req, res) => {
  try {
    await ensureMarketingTables();
    const userId = req.user!.id;
    const [access, trialEvent, acquisition, bundle, coursePaid] = await Promise.all([
      pgPool.query<{ access_until: string | null; trial_used: boolean; current_plan_code: string | null }>(
        `SELECT access_until::text, trial_used, current_plan_code FROM user_grile_access WHERE user_id = $1`,
        [userId],
      ),
      pgPool.query<{ starts_at: string; ends_at: string }>(
        `SELECT starts_at::text, ends_at::text FROM user_grile_access_events
         WHERE user_id = $1 AND plan_code = 'free_24h' ORDER BY starts_at DESC LIMIT 1`,
        [userId],
      ),
      pgPool.query<{ exam: string | null }>(`SELECT exam FROM user_acquisition WHERE user_id = $1`, [userId]),
      pgPool.query<{ n: number }>(
        `SELECT COUNT(*)::int AS n FROM user_offers_2027_payment_attempts WHERE user_id = $1 AND status = 'paid'`,
        [userId],
      ),
      pgPool.query<{ n: number }>(
        `SELECT COUNT(*)::int AS n FROM user_course_part_access WHERE user_id = $1 AND NOT COALESCE(is_trial, false)`,
        [userId],
      ),
    ]);
    const row = access.rows[0] ?? null;
    const now = Date.now();
    const accessActive = Boolean(row?.access_until && Date.parse(row.access_until) > now);
    const trial = trialEvent.rows[0] ?? null;
    const onTrial = accessActive && row?.current_plan_code === "free_24h";
    const hasPaidGrile = Boolean(row?.current_plan_code && row.current_plan_code !== "free_24h");

    let state: "new" | "trial" | "trial_expired" | "grile" | "complete" | "expired";
    if (bundle.rows[0]!.n > 0 && accessActive) state = "complete";
    else if (onTrial) state = "trial";
    else if (accessActive && hasPaidGrile) state = coursePaid.rows[0]!.n > 0 ? "complete" : "grile";
    else if (row?.trial_used && !hasPaidGrile) state = "trial_expired";
    else if (row && !accessActive && hasPaidGrile) state = "expired";
    else state = "new";

    let trialProgress: null | { grile_attempted: number; grile_correct: number; exam_simulations: number } = null;
    if (trial) {
      const from = trial.starts_at;
      const to = trial.ends_at;
      const [attempts, exams] = await Promise.all([
        pgPool.query<{ attempted: number; correct: number }>(
          `SELECT COUNT(DISTINCT question_id)::int AS attempted,
                  COUNT(DISTINCT question_id) FILTER (WHERE is_correct)::int AS correct
           FROM grile_user_attempts WHERE user_id = $1 AND attempted_at BETWEEN $2 AND $3`,
          [userId, from, to],
        ),
        pgPool.query<{ n: number }>(
          `SELECT COUNT(*)::int AS n FROM grile_exam_attempts WHERE user_id = $1 AND started_at BETWEEN $2 AND $3`,
          [userId, from, to],
        ),
      ]);
      trialProgress = {
        grile_attempted: attempts.rows[0]?.attempted ?? 0,
        grile_correct: attempts.rows[0]?.correct ?? 0,
        exam_simulations: exams.rows[0]?.n ?? 0,
      };
    }

    res.json({
      data: {
        state,
        exam: acquisition.rows[0]?.exam ?? null,
        access_until: row?.access_until ?? null,
        trial_started_at: trial?.starts_at ?? null,
        trial_ends_at: trial?.ends_at ?? null,
        trial_progress: trialProgress,
      },
    });
  } catch (error) {
    console.error("marketing journey:", error);
    res.status(500).json({ error: "Eroare interna", code: "INTERNAL_ERROR" });
  }
});

// ---------------------------------------------------------------------------------------------
// Admin: dashboard de marketing
// ---------------------------------------------------------------------------------------------

async function isAdmin(userId: string) {
  const result = await pgPool.query<{ role: string }>(`SELECT role FROM users WHERE id = $1`, [userId]);
  return result.rows[0]?.role === "admin";
}

/** Grupele de examen din raportare (UB si UNSTPB impart pachetul si cursul). */
const EXAM_GROUP_SQL = (column: string) => `CASE ${column}
  WHEN 'ubb' THEN 'ubb' WHEN 'ub' THEN 'ub_unstpb' WHEN 'unstpb' THEN 'ub_unstpb'
  WHEN 'iasi' THEN 'iasi' WHEN 'bac' THEN 'bac' ELSE NULL END`;

const summarySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.string().max(100).optional(),
  campaign: z.string().max(100).optional(),
  exam: z.enum(["ubb", "ub_unstpb", "iasi", "bac"]).optional(),
});

marketingRouter.get("/admin/summary", requireAuth, async (req, res) => {
  try {
    if (!(await isAdmin(req.user!.id))) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMarketingTables();
    const parsed = summarySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Parametri invalizi", code: "INVALID_QUERY" });
      return;
    }
    const { from, to } = parsed.data;
    const source = parsed.data.source ? cleanUtmValue(parsed.data.source) : null;
    const campaign = parsed.data.campaign ? cleanUtmValue(parsed.data.campaign) : null;
    const exam = parsed.data.exam ?? null;
    // Intervalul e pe zile calendaristice, ora Romaniei, cu capat inclusiv.
    const params = [from, to, source, campaign, exam];
    const range = (col: string) =>
      `${col} >= ($1::date)::timestamp AT TIME ZONE 'Europe/Bucharest' AND ${col} < ($2::date + 1)::timestamp AT TIME ZONE 'Europe/Bucharest'`;
    const acqFilter = (alias: string) =>
      `($3::text IS NULL OR ${alias}.utm_source = $3) AND ($4::text IS NULL OR ${alias}.utm_campaign = $4)`;

    const ordersCte = `
      orders AS (
        SELECT 'grile'::text AS flow, g.user_id, g.plan_code AS product, g.amount::float8 AS value, g.paid_at, NULL::text AS product_exam
        FROM user_grile_payment_attempts g WHERE g.status = 'paid' AND g.amount > 0
        UNION ALL
        SELECT 'pachet', o.user_id, o.offer_code, o.amount_total::float8, o.paid_at,
          CASE o.offer_code WHEN 'ubb_bundle' THEN 'ubb' WHEN 'ub_unstpb_bundle' THEN 'ub_unstpb'
            WHEN 'uaic_tuiasi_bundle' THEN 'iasi' WHEN 'bac_bundle' THEN 'bac' END
        FROM user_offers_2027_payment_attempts o WHERE o.status = 'paid' AND o.amount_total > 0
        UNION ALL
        SELECT 'curs', c.user_id, c.course_slug, c.amount_total::float8, c.paid_at,
          CASE c.course_slug WHEN 'curs-admitere-ubb' THEN 'ubb' WHEN 'curs-admitere-ub-unstpb' THEN 'ub_unstpb'
            WHEN 'curs-admitere-uaic-tuiasi' THEN 'iasi' WHEN 'curs-bacalaureat-informatica-mi' THEN 'bac' END
        FROM user_course_payment_attempts c WHERE c.status = 'paid' AND c.amount_total > 0
      ),
      orders_x AS (
        SELECT o.*, a.utm_source, a.utm_campaign,
          COALESCE(o.product_exam, ${EXAM_GROUP_SQL("a.exam")}) AS exam_group
        FROM orders o LEFT JOIN user_acquisition a ON a.user_id = o.user_id
      ),
      orders_f AS (
        SELECT * FROM orders_x x
        WHERE ${range("x.paid_at")} AND ${acqFilter("x")} AND ($5::text IS NULL OR x.exam_group = $5)
      )`;

    const [visits, demo, registrations, trials, orders, topProducts, byExam, campaigns, spend, attributionCoverage] =
      await Promise.all([
        pgPool.query<{ hits: number }>(
          `SELECT COALESCE(SUM(hits), 0)::int AS hits FROM mkt_page_hits_daily h
           WHERE h.day BETWEEN $1::date AND $2::date
             AND ($3::text IS NULL OR h.utm_source = $3) AND ($4::text IS NULL OR h.utm_campaign = $4)
             AND ($5::text IS NULL OR ${EXAM_GROUP_SQL("NULLIF(h.exam, '')")} = $5)`,
          params,
        ),
        pgPool.query<{ started: number; completed: number; with_account: number }>(
          `SELECT COUNT(*)::int AS started,
                  COUNT(*) FILTER (WHERE completed_at IS NOT NULL)::int AS completed,
                  COUNT(DISTINCT user_id)::int AS with_account
           FROM demo_sessions d
           WHERE COALESCE(d.ip_hash, '') <> 'bot' AND ${range("d.created_at")} AND ${acqFilter("d")}
             AND ($5::text IS NULL OR ${EXAM_GROUP_SQL("d.exam")} = $5)`,
          params,
        ),
        pgPool.query<{ n: number }>(
          `SELECT COUNT(*)::int AS n FROM users u LEFT JOIN user_acquisition a ON a.user_id = u.id
           WHERE u.role = 'student' AND ${range("u.created_at")} AND ${acqFilter("a")}
             AND ($5::text IS NULL OR ${EXAM_GROUP_SQL("a.exam")} = $5)`,
          params,
        ),
        pgPool.query<{ trials: number; converted: number }>(
          `WITH ${ordersCte},
           t AS (
             SELECT e.user_id, MIN(e.starts_at) AS started FROM user_grile_access_events e
             LEFT JOIN user_acquisition a ON a.user_id = e.user_id
             WHERE e.plan_code = 'free_24h' AND ${range("e.starts_at")} AND ${acqFilter("a")}
               AND ($5::text IS NULL OR ${EXAM_GROUP_SQL("a.exam")} = $5)
             GROUP BY e.user_id
           )
           SELECT COUNT(*)::int AS trials,
                  COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM orders_x o WHERE o.user_id = t.user_id AND o.paid_at >= t.started))::int AS converted
           FROM t`,
          params,
        ),
        pgPool.query<{ orders: number; customers: number; revenue: number }>(
          `WITH ${ordersCte}
           SELECT COUNT(*)::int AS orders, COUNT(DISTINCT user_id)::int AS customers, COALESCE(SUM(value), 0)::float8 AS revenue
           FROM orders_f`,
          params,
        ),
        pgPool.query<{ flow: string; product: string; orders: number; revenue: number }>(
          `WITH ${ordersCte}
           SELECT flow, product, COUNT(*)::int AS orders, SUM(value)::float8 AS revenue
           FROM orders_f GROUP BY flow, product ORDER BY revenue DESC LIMIT 15`,
          params,
        ),
        pgPool.query<{ exam_group: string | null; orders: number; revenue: number }>(
          `WITH ${ordersCte}
           SELECT exam_group, COUNT(*)::int AS orders, SUM(value)::float8 AS revenue
           FROM orders_f GROUP BY exam_group ORDER BY revenue DESC`,
          params,
        ),
        pgPool.query<{
          utm_source: string | null;
          utm_campaign: string | null;
          registrations: number;
          trials: number;
          orders: number;
          revenue: number;
        }>(
          `WITH ${ordersCte},
           regs AS (
             SELECT a.utm_source, a.utm_campaign, COUNT(*)::int AS n FROM users u JOIN user_acquisition a ON a.user_id = u.id
             WHERE a.utm_source IS NOT NULL AND ${range("u.created_at")} AND ${acqFilter("a")}
               AND ($5::text IS NULL OR ${EXAM_GROUP_SQL("a.exam")} = $5)
             GROUP BY 1, 2
           ),
           tr AS (
             SELECT a.utm_source, a.utm_campaign, COUNT(DISTINCT e.user_id)::int AS n FROM user_grile_access_events e
             JOIN user_acquisition a ON a.user_id = e.user_id
             WHERE e.plan_code = 'free_24h' AND a.utm_source IS NOT NULL AND ${range("e.starts_at")} AND ${acqFilter("a")}
               AND ($5::text IS NULL OR ${EXAM_GROUP_SQL("a.exam")} = $5)
             GROUP BY 1, 2
           ),
           od AS (
             SELECT utm_source, utm_campaign, COUNT(*)::int AS n, SUM(value)::float8 AS revenue
             FROM orders_f WHERE utm_source IS NOT NULL GROUP BY 1, 2
           ),
           keys AS (SELECT utm_source, utm_campaign FROM regs UNION SELECT utm_source, utm_campaign FROM tr UNION SELECT utm_source, utm_campaign FROM od)
           SELECT k.utm_source, k.utm_campaign,
                  COALESCE(regs.n, 0) AS registrations, COALESCE(tr.n, 0) AS trials,
                  COALESCE(od.n, 0) AS orders, COALESCE(od.revenue, 0)::float8 AS revenue
           FROM keys k
           LEFT JOIN regs ON regs.utm_source IS NOT DISTINCT FROM k.utm_source AND regs.utm_campaign IS NOT DISTINCT FROM k.utm_campaign
           LEFT JOIN tr ON tr.utm_source IS NOT DISTINCT FROM k.utm_source AND tr.utm_campaign IS NOT DISTINCT FROM k.utm_campaign
           LEFT JOIN od ON od.utm_source IS NOT DISTINCT FROM k.utm_source AND od.utm_campaign IS NOT DISTINCT FROM k.utm_campaign
           ORDER BY revenue DESC, registrations DESC LIMIT 50`,
          params,
        ),
        pgPool.query<{ utm_source: string; utm_campaign: string; amount: number }>(
          `SELECT utm_source, utm_campaign, SUM(amount_ron)::float8 AS amount FROM mkt_ad_spend
           WHERE day BETWEEN $1::date AND $2::date AND ($3::text IS NULL OR utm_source = $3) AND ($4::text IS NULL OR utm_campaign = $4)
           GROUP BY 1, 2`,
          [from, to, source, campaign],
        ),
        pgPool.query<{ total: number; attributed: number }>(
          `SELECT COUNT(*)::int AS total, COUNT(a.utm_source)::int AS attributed
           FROM users u LEFT JOIN user_acquisition a ON a.user_id = u.id
           WHERE u.role = 'student' AND ${range("u.created_at")}`,
          [from, to],
        ),
      ]);

    const spendByKey = new Map(spend.rows.map((row) => [`${row.utm_source}|${row.utm_campaign}`, row.amount]));
    const totalSpend = spend.rows.reduce((sum, row) => sum + row.amount, 0);
    const o = orders.rows[0]!;
    const t = trials.rows[0]!;
    const d = demo.rows[0]!;
    const v = visits.rows[0]!.hits;
    const r = registrations.rows[0]!.n;
    const ratio = (num: number, den: number) => (den > 0 ? num / den : null);

    res.json({
      data: {
        filters: { from, to, source, campaign, exam },
        totals: {
          page_views: v,
          demo_started: d.started,
          demo_completed: d.completed,
          demo_with_account: d.with_account,
          registrations: r,
          trials: t.trials,
          trials_converted: t.converted,
          orders: o.orders,
          customers: o.customers,
          revenue_gross_ron: o.revenue,
          revenue_net_ron: null,
          avg_order_ron: o.orders > 0 ? o.revenue / o.orders : null,
          ad_spend_ron: spend.rows.length > 0 ? totalSpend : null,
        },
        rates: {
          visit_to_demo: ratio(d.started, v),
          visit_to_account: ratio(r, v),
          demo_to_account: ratio(d.with_account, d.started),
          account_to_trial: ratio(t.trials, r),
          trial_to_purchase: ratio(t.converted, t.trials),
          visit_to_purchase: ratio(o.customers, v),
          cac_ron: spend.rows.length > 0 && o.customers > 0 ? totalSpend / o.customers : null,
          roas: spend.rows.length > 0 && totalSpend > 0 ? o.revenue / totalSpend : null,
        },
        top_products: topProducts.rows,
        by_exam: byExam.rows,
        campaigns: campaigns.rows.map((row) => {
          const rowSpend = spendByKey.get(`${row.utm_source ?? ""}|${row.utm_campaign ?? ""}`) ?? null;
          return {
            ...row,
            spend_ron: rowSpend,
            cac_ron: rowSpend != null && row.orders > 0 ? rowSpend / row.orders : null,
            roas: rowSpend != null && rowSpend > 0 ? row.revenue / rowSpend : null,
          };
        }),
        attribution_coverage: attributionCoverage.rows[0],
        notes: [
          "Afișările de pagină sunt contorizate fără cookie (nu vizitatori unici) și doar de la data activării.",
          "Atribuirea pe campanii există doar pentru vizitatorii care au acceptat cookie-urile de statistică.",
          "Încasări nete: indisponibile (comisioanele Revolut nu sunt importate). Meditațiile nu sunt incluse.",
        ],
      },
    });
  } catch (error) {
    console.error("marketing admin summary:", error);
    res.status(500).json({ error: "Eroare interna", code: "INTERNAL_ERROR" });
  }
});

const spendSchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  utm_source: z.string().min(1).max(100),
  utm_campaign: z.string().max(100).default(""),
  amount_ron: z.number().min(0).max(1_000_000),
  note: z.string().max(300).optional().nullable(),
});

marketingRouter.get("/admin/ad-spend", requireAuth, async (req, res) => {
  try {
    if (!(await isAdmin(req.user!.id))) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMarketingTables();
    const rows = await pgPool.query(
      `SELECT day::text, utm_source, utm_campaign, amount_ron::float8, note FROM mkt_ad_spend ORDER BY day DESC LIMIT 200`,
    );
    res.json({ data: rows.rows });
  } catch (error) {
    console.error("marketing ad spend list:", error);
    res.status(500).json({ error: "Eroare interna", code: "INTERNAL_ERROR" });
  }
});

marketingRouter.put("/admin/ad-spend", requireAuth, async (req, res) => {
  try {
    if (!(await isAdmin(req.user!.id))) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await ensureMarketingTables();
    const parsed = spendSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Date invalide", code: "INVALID_PAYLOAD" });
      return;
    }
    const sourceValue = cleanUtmValue(parsed.data.utm_source);
    if (!sourceValue) {
      res.status(400).json({ error: "Sursa invalida", code: "INVALID_PAYLOAD" });
      return;
    }
    await pgPool.query(
      `INSERT INTO mkt_ad_spend (day, utm_source, utm_campaign, amount_ron, note) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (day, utm_source, utm_campaign) DO UPDATE SET amount_ron = EXCLUDED.amount_ron, note = EXCLUDED.note, updated_at = NOW()`,
      [parsed.data.day, sourceValue, cleanUtmValue(parsed.data.utm_campaign) ?? "", parsed.data.amount_ron, parsed.data.note ?? null],
    );
    res.json({ data: { ok: true } });
  } catch (error) {
    console.error("marketing ad spend save:", error);
    res.status(500).json({ error: "Eroare interna", code: "INTERNAL_ERROR" });
  }
});
