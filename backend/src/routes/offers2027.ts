import { purchaseTrackingPayload, recordConversion } from "../services/marketing.service";
import { Router } from "express";
import { z } from "zod";
import { pgPool } from "../db/postgres";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  applyPercentDiscount,
  resolveActiveDiscountCode,
} from "../services/discountCode.service";
import {
  buildOffers2027Catalog,
  grantOffer2027InTransaction,
  isValidOffer2027Code,
  OFFER_2027_CODES,
  offer2027ReturnPath,
  OFFERS_2027_ACCESS_UNTIL,
  resolveOffer2027,
  type Offer2027Code,
} from "../services/offers2027.service";
import {
  downloadSmartbillInvoicePdf,
  getAppBaseUrl,
  issueSmartbillInvoiceWithProducts,
  persistInvoicePdfToDirectory,
  revolutCreateOrder,
  revolutFetchOrder,
  type SmartbillProductLine,
} from "../services/revolutSmartbill.service";
import { billingProfileActivateSchema, persistUserBillingProfile } from "../services/userBillingProfile.service";
import { sendPurchaseThankYouEmail } from "../services/email.service";
import { ensureCoursesTable } from "./courses";
import { ensureGrileTables } from "./grile";

const offers2027Router = Router();

const OFFERS_INVOICES_DIR = "offers-2027-invoices";

const createOfferPaymentSchema = z.object({
  offerCode: z.enum(OFFER_2027_CODES),
  acceptTerms: z.literal(true),
  billingProfile: billingProfileActivateSchema,
  discountCode: z.string().trim().max(64).optional(),
});

const confirmOfferPaymentSchema = z.object({
  attemptId: z.string().uuid(),
});

async function ensureOffers2027Tables() {
  await ensureCoursesTable();
  await ensureGrileTables();
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS user_offers_2027_payment_attempts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      offer_code TEXT NOT NULL,
      course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
      course_slug TEXT,
      part_ids_to_grant UUID[] NOT NULL DEFAULT '{}',
      grile_access_until TIMESTAMPTZ NOT NULL,
      amount_catalog NUMERIC(10, 2) NOT NULL,
      amount_total NUMERIC(10, 2) NOT NULL,
      amount_discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'RON',
      invoice_lines JSONB NOT NULL DEFAULT '[]'::jsonb,
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
      discount_code_id UUID,
      discount_percent_applied SMALLINT,
      amount_before_discount NUMERIC(10, 2),
      discount_label TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pgPool.query(
    `CREATE INDEX IF NOT EXISTS idx_offers_2027_payment_user_created ON user_offers_2027_payment_attempts(user_id, created_at DESC)`,
  );
}

offers2027Router.get("/catalog", async (_req, res) => {
  try {
    await ensureOffers2027Tables();
    const items = await buildOffers2027Catalog();
    res.json({
      data: {
        access_until: OFFERS_2027_ACCESS_UNTIL.toISOString(),
        items,
      },
    });
  } catch (error) {
    console.error("offers2027 catalog:", error);
    res.status(500).json({ error: "Nu am putut incarca ofertele.", code: "INTERNAL_ERROR" });
  }
});

offers2027Router.post("/create-payment", requireAuth, validateBody(createOfferPaymentSchema), async (req, res) => {
  try {
    await ensureOffers2027Tables();
    const body = req.body as z.infer<typeof createOfferPaymentSchema>;
    const userId = req.user!.id;

    const userResult = await pgPool.query<{ email: string }>(`SELECT email FROM users WHERE id = $1 LIMIT 1`, [userId]);
    const userEmail = userResult.rows[0]?.email;
    if (!userEmail) {
      res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
      return;
    }

    const offer = await resolveOffer2027(body.offerCode);
    let amountTotal = Number(offer.promoPriceRon.toFixed(2));
    let invoiceLines = [...offer.invoiceLines];
    let discountCodeId: string | null = null;
    let discountPercentApplied: number | null = null;
    let amountBeforeDiscount: number | null = null;
    let discountLabel: string | null = null;

    const rawDiscount = body.discountCode?.trim();
    if (rawDiscount) {
      const resolved = await resolveActiveDiscountCode(pgPool, rawDiscount, "site");
      if (!resolved.ok) {
        res.status(400).json({ error: resolved.error, code: "INVALID_DISCOUNT_CODE" });
        return;
      }
      const percent = resolved.row.percent_off;
      const beforePromo = amountTotal;
      amountTotal = applyPercentDiscount(beforePromo, percent);
      amountBeforeDiscount = beforePromo;
      discountPercentApplied = percent;
      discountCodeId = resolved.row.id;
      discountLabel = `${resolved.row.code} (-${percent}%)`;
      const suffix = ` | Cod reducere ${discountLabel}. Lista: ${beforePromo.toFixed(2)} RON, platit: ${amountTotal.toFixed(2)} RON`;
      invoiceLines = [
        {
          name: `${offer.title}${suffix}`.slice(0, 500),
          priceRon: amountTotal,
          quantity: 1,
          isService: true,
        },
      ];
    }

    const client = await pgPool.connect();
    let attemptId = "";
    try {
      await client.query("BEGIN");
      await persistUserBillingProfile(userId, body.billingProfile, client);

      const attemptInsert = await client.query<{ id: string }>(
        `INSERT INTO user_offers_2027_payment_attempts (
           user_id, offer_code, course_id, course_slug, part_ids_to_grant, grile_access_until,
           amount_catalog, amount_total, amount_discount, currency, invoice_lines, status,
           billing_snapshot, terms_accepted_at, updated_at,
           discount_code_id, discount_percent_applied, amount_before_discount, discount_label
         )
         VALUES ($1, $2, $3, $4, $5::uuid[], $6, $7, $8, $9, 'RON', $10::jsonb, 'pending',
           $11::jsonb, NOW(), NOW(), $12, $13, $14, $15)
         RETURNING id`,
        [
          userId,
          offer.code,
          offer.courseId,
          offer.courseSlug,
          offer.partIdsToGrant,
          OFFERS_2027_ACCESS_UNTIL.toISOString(),
          offer.catalogTotalRon,
          amountTotal,
          offer.amountDiscountRon,
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
        await grantOffer2027InTransaction(client, userId, offer, {
          billingSnapshot: body.billingProfile,
          attemptId,
          paidAmount: 0,
          invoiceNumber: null,
          invoiceUrl: null,
          invoiceLocalPath: null,
          discountCodeId,
        });
        await client.query(
          `UPDATE user_offers_2027_payment_attempts
           SET status = 'paid', paid_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [attemptId],
        );
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

      const redirectUrl = `${getAppBaseUrl().replace(/\/$/, "")}${offer2027ReturnPath(offer.code)}?payment=success&attempt=${encodeURIComponent(attemptId)}`;
      const { orderId, checkoutUrl } = await revolutCreateOrder({
        amountCents: Math.round(amountTotal * 100),
        currency: "RON",
        description: offer.description,
        redirectUrl,
        customer: {
          email: userEmail,
          name: `${body.billingProfile.firstName} ${body.billingProfile.lastName}`.trim(),
          phone: body.billingProfile.phone || undefined,
        },
        metadata: {
          attempt_id: attemptId,
          offer_code: offer.code,
          user_id: userId,
        },
      });

      await client.query(
        `UPDATE user_offers_2027_payment_attempts
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
    console.error("offers2027 create-payment:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create payment",
      code: "INTERNAL_ERROR",
    });
  }
});

offers2027Router.post("/confirm-payment", async (req, res) => {
  try {
    await ensureOffers2027Tables();
    const parsed = confirmOfferPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
      return;
    }

    const attemptResult = await pgPool.query<{
      id: string;
      user_id: string;
      offer_code: string;
      course_id: string | null;
      course_slug: string | null;
      part_ids_to_grant: string[];
      amount_total: number;
      status: string;
      revolut_order_id: string | null;
      invoice_number: string | null;
      invoice_url: string | null;
      billing_snapshot: z.infer<typeof billingProfileActivateSchema>;
      invoice_lines: SmartbillProductLine[];
      discount_code_id: string | null;
    }>(
      `SELECT
         id, user_id, offer_code, course_id, course_slug, part_ids_to_grant,
         amount_total::float8 AS amount_total, status, revolut_order_id,
         invoice_number, invoice_url, billing_snapshot, invoice_lines, discount_code_id
       FROM user_offers_2027_payment_attempts
       WHERE id = $1
       LIMIT 1`,
      [parsed.data.attemptId],
    );
    const attempt = attemptResult.rows[0];
    if (!attempt) {
      res.status(404).json({ error: "Payment attempt not found", code: "NOT_FOUND" });
      return;
    }

    if (req.user?.id && req.user.id !== attempt.user_id) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }

    const userId = attempt.user_id;

    if (attempt.status === "paid") {
      res.json({
        data: {
          ok: true,
          payment_status: "paid",
          purchase: purchaseTrackingPayload(attempt.id, attempt.offer_code, Number(attempt.amount_total)),
          invoice_number: attempt.invoice_number,
          invoice_url: attempt.invoice_url,
          offer_code: attempt.offer_code,
          local_redirect_url: `${offer2027ReturnPath(attempt.offer_code as Offer2027Code)}?payment=done`,
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

    if (!isValidOffer2027Code(attempt.offer_code)) {
      res.status(400).json({ error: "Invalid offer in payment attempt", code: "INVALID_OFFER" });
      return;
    }

    const offer = await resolveOffer2027(attempt.offer_code as Offer2027Code);
    const userEmailResult = await pgPool.query<{ email: string }>(`SELECT email FROM users WHERE id = $1 LIMIT 1`, [userId]);
    const userEmail = userEmailResult.rows[0]?.email ?? "";

    const client = await pgPool.connect();
    let invoiceNumber: string | null = null;
    let invoiceUrl: string | null = null;
    let invoiceLocalPath: string | null = null;
    let thankYou: { billing: z.infer<typeof billingProfileActivateSchema>; amountTotal: number } | null = null;
    try {
      await client.query("BEGIN");
      const locked = await client.query<{
        status: string;
        billing_snapshot: z.infer<typeof billingProfileActivateSchema>;
        invoice_lines: SmartbillProductLine[];
        amount_total: number;
        discount_code_id: string | null;
        invoice_number: string | null;
        invoice_url: string | null;
      }>(
        `SELECT status, billing_snapshot, invoice_lines, amount_total::float8 AS amount_total,
                discount_code_id, invoice_number, invoice_url
         FROM user_offers_2027_payment_attempts
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
        await client.query("COMMIT");
        res.json({
          data: {
            ok: true,
            payment_status: "paid",
            purchase: purchaseTrackingPayload(attempt.id, attempt.offer_code, Number(attempt.amount_total)),
            invoice_number: lockedRow.invoice_number,
            invoice_url: lockedRow.invoice_url,
            offer_code: attempt.offer_code,
            local_redirect_url: `${offer2027ReturnPath(attempt.offer_code as Offer2027Code)}?payment=done`,
          },
        });
        return;
      }

      const lines = Array.isArray(lockedRow.invoice_lines) ? (lockedRow.invoice_lines as SmartbillProductLine[]) : [];
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
            invoiceLocalPath = await persistInvoicePdfToDirectory(OFFERS_INVOICES_DIR, invoiceNumber, invoicePdf);
          } catch (invoicePersistError) {
            console.error("offers2027 invoice pdf:", invoicePersistError);
          }
        }
      }

      await grantOffer2027InTransaction(client, userId, offer, {
        billingSnapshot: lockedRow.billing_snapshot,
        attemptId: attempt.id,
        paidAmount: Number(lockedRow.amount_total),
        invoiceNumber,
        invoiceUrl,
        invoiceLocalPath,
        discountCodeId: lockedRow.discount_code_id,
      });

      await client.query(
        `UPDATE user_offers_2027_payment_attempts
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

      thankYou = { billing: lockedRow.billing_snapshot, amountTotal: Number(lockedRow.amount_total) };
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    if (thankYou) {
      void recordConversion({
        kind: "purchase",
        flow: "pachet",
        refId: attempt.id,
        userId,
        productCode: attempt.offer_code,
        valueRon: thankYou.amountTotal,
        pagePath: offer2027ReturnPath(attempt.offer_code as Offer2027Code),
      });
    }

    if (thankYou && userEmail.includes("@")) {
      const appBase = getAppBaseUrl().replace(/\/$/, "") || "https://www.zecelainfo.ro";
      void sendPurchaseThankYouEmail({
        to: userEmail,
        customerFirstName: thankYou.billing.firstName,
        purchaseLabel: `${offer.title} — curs + grile până la 1 August 2027`,
        amountRon: thankYou.amountTotal,
        currency: "RON",
        invoiceNumber,
        invoiceUrl,
        invoicePdfPath: invoiceLocalPath,
        primaryCtaPath: offer.courseSlug ? `/cursuri/${encodeURIComponent(offer.courseSlug)}` : "/grile",
        appBaseUrl: appBase,
      }).catch((err) => console.error("[offers2027] thank-you email failed:", err));
    }

    res.json({
      data: {
        ok: true,
        payment_status: "paid",
        purchase: purchaseTrackingPayload(attempt.id, attempt.offer_code, Number(attempt.amount_total)),
        invoice_number: invoiceNumber,
        invoice_url: invoiceUrl,
        offer_code: attempt.offer_code,
        local_redirect_url: `${offer2027ReturnPath(attempt.offer_code as Offer2027Code)}?payment=done`,
      },
    });
  } catch (error) {
    console.error("offers2027 confirm-payment:", error);
    res.status(500).json({ error: "Failed to confirm payment", code: "INTERNAL_ERROR" });
  }
});

export { offers2027Router };
