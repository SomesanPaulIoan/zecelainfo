import type { PoolClient } from "pg";
import type { SmartbillProductLine } from "./revolutSmartbill.service";
import { incrementDiscountCodeUses } from "./discountCode.service";
import type { billingProfileActivateSchema } from "./userBillingProfile.service";
import type { z } from "zod";
import { pgPool } from "../db/postgres";
import { getCatalogPartPriceRon } from "../routes/courses";

/**
 * Pachetele "curs + grile pana la 1 August 2027", cate unul pe examen (paginile /pachete/<examen>).
 * `grile_only` e pastrat pentru platile vechi din /oferte-2027 (arhivata); grilele singure se vand acum prin planul
 * `until_2027` din /api/grile.
 */
export const OFFER_2027_CODES = ["ubb_bundle", "ub_unstpb_bundle", "uaic_tuiasi_bundle", "bac_bundle", "grile_only"] as const;
export type Offer2027Code = (typeof OFFER_2027_CODES)[number];

export const OFFERS_2027_ACCESS_UNTIL = new Date("2027-08-01T20:59:59.999Z");

const COURSE_SLUG_UBB = "curs-admitere-ubb";
const COURSE_SLUG_UB_UNSTPB = "curs-admitere-ub-unstpb";
const COURSE_SLUG_UAIC_TUIASI = "curs-admitere-uaic-tuiasi";
const COURSE_SLUG_BAC = "curs-bacalaureat-informatica-mi";

const PROMO_PRICES_RON: Record<Offer2027Code, number> = {
  ub_unstpb_bundle: 999,
  ubb_bundle: 999,
  uaic_tuiasi_bundle: 999,
  bac_bundle: 999,
  grile_only: 699,
};

const OFFER_META: Record<
  Offer2027Code,
  {
    title: string;
    subtitle: string;
    badge: string | null;
    courseSlug: string | null;
    includesCourse: boolean;
    includesGrile: boolean;
    /** Pagina pe care se intoarce clientul dupa plata Revolut. */
    returnPath: string;
  }
> = {
  ub_unstpb_bundle: {
    title: "Pachet Admitere UB & UNSTPB",
    subtitle: "Curs video complet + toate grilele platformei, până la 1 August 2027",
    badge: null,
    courseSlug: COURSE_SLUG_UB_UNSTPB,
    includesCourse: true,
    includesGrile: true,
    returnPath: "/pachete/admitere-ub-unstpb",
  },
  ubb_bundle: {
    title: "Pachet Admitere UBB",
    subtitle: "Curs video complet + toate grilele platformei, până la 1 August 2027",
    badge: null,
    courseSlug: COURSE_SLUG_UBB,
    includesCourse: true,
    includesGrile: true,
    returnPath: "/pachete/admitere-ubb",
  },
  uaic_tuiasi_bundle: {
    title: "Pachet Admitere UAIC & TU Iași",
    subtitle: "Curs video complet + toate grilele platformei, până la 1 August 2027",
    badge: null,
    courseSlug: COURSE_SLUG_UAIC_TUIASI,
    includesCourse: true,
    includesGrile: true,
    returnPath: "/pachete/admitere-uaic-tuiasi",
  },
  bac_bundle: {
    title: "Pachet Bacalaureat Informatică",
    subtitle: "Curs video complet + toate grilele platformei, până la 1 August 2027",
    badge: null,
    courseSlug: COURSE_SLUG_BAC,
    includesCourse: true,
    includesGrile: true,
    returnPath: "/pachete/bacalaureat",
  },
  grile_only: {
    title: "Pachet Grile 2027",
    subtitle: "Acces la toată platforma de grile, până la 1 August 2027",
    badge: "Doar grile",
    courseSlug: null,
    includesCourse: false,
    includesGrile: true,
    returnPath: "/pachete",
  },
};

export function offer2027ReturnPath(code: Offer2027Code): string {
  return OFFER_META[code]?.returnPath ?? "/pachete";
}

function monthsUntilAccessEnd(from = new Date()): number {
  const diffMs = OFFERS_2027_ACCESS_UNTIL.getTime() - from.getTime();
  if (diffMs <= 0) return 0;
  return Math.max(1, Math.ceil(diffMs / (30 * 24 * 60 * 60 * 1000)));
}

/** Pret catalog grile: combinație optimă de abonamente 6/3/1 luni. */
export function catalogGrilePriceRon(until = OFFERS_2027_ACCESS_UNTIL, from = new Date()): number {
  const months = monthsUntilAccessEnd(from);
  if (until.getTime() <= from.getTime()) return 0;
  let remaining = months;
  let total = 0;
  total += Math.floor(remaining / 6) * 600;
  remaining %= 6;
  total += Math.floor(remaining / 3) * 399;
  remaining %= 3;
  total += remaining * 150;
  return total;
}

export function formatOfferAccessUntilRo(): string {
  return OFFERS_2027_ACCESS_UNTIL.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Bucharest",
  });
}

type CoursePartRow = {
  id: string;
  name: string;
  order_index: number;
  price: number | null;
  sale_price: number | null;
};

async function loadCourseParts(
  courseSlug: string,
): Promise<{ courseId: string; courseName: string; parts: CoursePartRow[]; totalVideoSeconds: number; lessonsCount: number }> {
  const courseResult = await pgPool.query<{ id: string; name: string }>(
    `SELECT id, name FROM courses WHERE slug = $1 AND is_published = true LIMIT 1`,
    [courseSlug],
  );
  const course = courseResult.rows[0];
  if (!course) {
    throw new Error(`Cursul ${courseSlug} nu este disponibil.`);
  }
  const partsResult = await pgPool.query<CoursePartRow>(
    `SELECT id, name, order_index, price::float8 AS price, sale_price::float8 AS sale_price
     FROM course_parts
     WHERE course_id = $1 AND is_published = true
     ORDER BY order_index ASC`,
    [course.id],
  );
  const partIds = partsResult.rows.map((p) => p.id);
  let totalVideoSeconds = 0;
  let lessonsCount = 0;
  if (partIds.length > 0) {
    const videosResult = await pgPool.query<{ total_seconds: string | null; lessons_count: string }>(
      `SELECT COALESCE(SUM(duration_seconds), 0)::bigint AS total_seconds, COUNT(*)::int AS lessons_count
       FROM course_videos
       WHERE part_id = ANY($1::uuid[]) AND is_published = true`,
      [partIds],
    );
    totalVideoSeconds = Number(videosResult.rows[0]?.total_seconds ?? 0);
    lessonsCount = Number(videosResult.rows[0]?.lessons_count ?? 0);
  }
  return { courseId: course.id, courseName: course.name, parts: partsResult.rows, totalVideoSeconds, lessonsCount };
}

async function countTotalGrileQuestions(): Promise<number> {
  const result = await pgPool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM grile_questions`);
  return Number(result.rows[0]?.count ?? 0);
}

export type Offer2027CatalogItem = {
  code: Offer2027Code;
  title: string;
  subtitle: string;
  badge: string | null;
  includes_course: boolean;
  includes_grile: boolean;
  course_slug: string | null;
  course_name: string | null;
  parts_count: number;
  course_hours: number;
  lessons_count: number;
  grile_questions_count: number;
  catalog_course_ron: number;
  catalog_grile_ron: number;
  catalog_total_ron: number;
  promo_price_ron: number;
  savings_ron: number;
  savings_percent: number;
  access_until_label: string;
};

export async function buildOffers2027Catalog(): Promise<Offer2027CatalogItem[]> {
  const grileCatalog = catalogGrilePriceRon();
  const accessLabel = formatOfferAccessUntilRo();
  const totalGrileQuestions = await countTotalGrileQuestions();
  const items: Offer2027CatalogItem[] = [];

  for (const code of Object.keys(PROMO_PRICES_RON) as Offer2027Code[]) {
    const meta = OFFER_META[code];
    const promo = PROMO_PRICES_RON[code];
    let courseCatalog = 0;
    let courseName: string | null = null;
    let partsCount = 0;
    let courseHours = 0;
    let lessonsCount = 0;

    if (meta.courseSlug) {
      const loaded = await loadCourseParts(meta.courseSlug);
      courseName = loaded.courseName;
      partsCount = loaded.parts.length;
      courseCatalog = loaded.parts.reduce((sum, part) => sum + getCatalogPartPriceRon(meta.courseSlug!, part), 0);
      courseHours = Math.floor(loaded.totalVideoSeconds / 3600);
      lessonsCount = loaded.lessonsCount;
    }

    const grilePart = meta.includesGrile ? grileCatalog : 0;
    const catalogTotal = Number((courseCatalog + grilePart).toFixed(2));
    const savings = Number(Math.max(0, catalogTotal - promo).toFixed(2));
    const savingsPercent = catalogTotal > 0 ? Math.round((savings / catalogTotal) * 100) : 0;

    items.push({
      code,
      title: meta.title,
      subtitle: meta.subtitle,
      badge: meta.badge,
      includes_course: meta.includesCourse,
      includes_grile: meta.includesGrile,
      course_slug: meta.courseSlug,
      course_name: courseName,
      parts_count: partsCount,
      course_hours: courseHours,
      lessons_count: lessonsCount,
      grile_questions_count: meta.includesGrile ? totalGrileQuestions : 0,
      catalog_course_ron: Number(courseCatalog.toFixed(2)),
      catalog_grile_ron: Number(grilePart.toFixed(2)),
      catalog_total_ron: catalogTotal,
      promo_price_ron: promo,
      savings_ron: savings,
      savings_percent: savingsPercent,
      access_until_label: accessLabel,
    });
  }

  return items;
}

export type ResolvedOffer2027 = {
  code: Offer2027Code;
  title: string;
  courseId: string | null;
  courseSlug: string | null;
  courseName: string | null;
  partIdsToGrant: string[];
  catalogCourseRon: number;
  catalogGrileRon: number;
  catalogTotalRon: number;
  promoPriceRon: number;
  amountDiscountRon: number;
  invoiceLines: SmartbillProductLine[];
  description: string;
};

export async function resolveOffer2027(offerCode: Offer2027Code): Promise<ResolvedOffer2027> {
  const meta = OFFER_META[offerCode];
  if (!meta) {
    throw new Error("Oferta invalida.");
  }

  const promo = PROMO_PRICES_RON[offerCode];
  const grileCatalog = meta.includesGrile ? catalogGrilePriceRon() : 0;
  let courseId: string | null = null;
  let courseName: string | null = null;
  let courseSlug: string | null = meta.courseSlug;
  let partIds: string[] = [];
  let courseCatalog = 0;
  const invoiceLines: SmartbillProductLine[] = [];

  if (meta.courseSlug) {
    const loaded = await loadCourseParts(meta.courseSlug);
    courseId = loaded.courseId;
    courseName = loaded.courseName;
    if (loaded.parts.length === 0) {
      throw new Error("Cursul nu are parti publicate.");
    }
    partIds = loaded.parts.map((p) => p.id);
    for (const part of loaded.parts) {
      const partPrice = getCatalogPartPriceRon(meta.courseSlug, part);
      courseCatalog += partPrice;
      invoiceLines.push({
        name: `${loaded.courseName} — Partea ${part.order_index}: ${part.name}`,
        priceRon: Number(partPrice.toFixed(2)),
        quantity: 1,
        isService: true,
      });
    }
  }

  if (meta.includesGrile && grileCatalog > 0) {
    invoiceLines.push({
      name: `Abonament grile până la ${formatOfferAccessUntilRo()}`,
      priceRon: Number(grileCatalog.toFixed(2)),
      quantity: 1,
      isService: true,
    });
  }

  const catalogTotal = Number((courseCatalog + grileCatalog).toFixed(2));
  const discountAmount = Number(Math.max(0, catalogTotal - promo).toFixed(2));
  if (discountAmount > 0.001) {
    invoiceLines.push({
      name: `Reducere ${meta.title}`,
      priceRon: -discountAmount,
      quantity: 1,
      isService: true,
    });
  }

  return {
    code: offerCode,
    title: meta.title,
    courseId,
    courseSlug,
    courseName,
    partIdsToGrant: partIds,
    catalogCourseRon: Number(courseCatalog.toFixed(2)),
    catalogGrileRon: Number(grileCatalog.toFixed(2)),
    catalogTotalRon: catalogTotal,
    promoPriceRon: promo,
    amountDiscountRon: discountAmount,
    invoiceLines,
    description: `${meta.title} — curs + grile până la 1 August 2027`.slice(0, 240),
  };
}

export async function grantOffer2027InTransaction(
  client: PoolClient,
  userId: string,
  offer: ResolvedOffer2027,
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
  const accessUntilIso = OFFERS_2027_ACCESS_UNTIL.toISOString();

  if (offer.courseId && offer.partIdsToGrant.length > 0) {
    for (const partId of offer.partIdsToGrant) {
      await client.query(
        `INSERT INTO user_course_part_access (user_id, course_id, course_part_id, access_until)
         VALUES ($1, $2, $3, $4::timestamptz)
         ON CONFLICT (user_id, course_part_id)
         DO UPDATE SET
           access_until = CASE
             WHEN user_course_part_access.access_until IS NULL AND NOT user_course_part_access.is_trial THEN NULL
             ELSE GREATEST(user_course_part_access.access_until, EXCLUDED.access_until)
           END,
           is_trial = FALSE`,
        [userId, offer.courseId, partId, accessUntilIso],
      );
    }
  }

  if (offer.catalogGrileRon > 0 || offer.code === "grile_only") {
    const currentResult = await client.query<{ access_until: string | null }>(
      `SELECT access_until::text
       FROM user_grile_access
       WHERE user_id = $1
       LIMIT 1
       FOR UPDATE`,
      [userId],
    );
    const currentUntil = currentResult.rows[0]?.access_until;
    const nextUntil =
      currentUntil && new Date(currentUntil).getTime() > OFFERS_2027_ACCESS_UNTIL.getTime()
        ? currentUntil
        : accessUntilIso;

    await client.query(
      `INSERT INTO user_grile_access (user_id, access_until, trial_used, current_plan_code, updated_at)
       VALUES ($1, $2, FALSE, 'offers_2027', NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         access_until = GREATEST(user_grile_access.access_until, EXCLUDED.access_until),
         current_plan_code = 'offers_2027',
         updated_at = NOW()`,
      [userId, nextUntil],
    );

    await client.query(
      `INSERT INTO user_grile_access_events (
         user_id, plan_code, plan_name, starts_at, ends_at, is_free, is_paid, paid_amount, currency,
         invoice_number, invoice_url, invoice_local_path, invoice_issued_at, billing_snapshot, terms_accepted_at
       )
       VALUES ($1, 'offers_2027', $2, NOW(), $3, FALSE, TRUE, $4, 'RON', $5, $6, $7, $8, $9::jsonb, NOW())`,
      [
        userId,
        offer.title,
        nextUntil,
        Number(args.paidAmount.toFixed(2)),
        args.invoiceNumber,
        args.invoiceUrl,
        args.invoiceLocalPath,
        args.invoiceNumber ? new Date().toISOString() : null,
        JSON.stringify(args.billingSnapshot),
      ],
    );
  }

  if (args.discountCodeId) {
    await incrementDiscountCodeUses(client, args.discountCodeId);
  }

  return { accessUntilIso };
}

export function isValidOffer2027Code(value: string): value is Offer2027Code {
  return (OFFER_2027_CODES as readonly string[]).includes(value);
}
