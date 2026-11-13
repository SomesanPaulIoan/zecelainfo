import express from "express";
import {
  getRevolutWebhookSecret,
  handleRevolutOrderEvent,
  verifyRevolutWebhookSignature,
  type RevolutMerchantKind,
} from "../services/revolutWebhook.service";

/**
 * Webhook-uri Revolut Merchant (cate unul pe cont): `/api/payments/revolut/webhook/main` si `/meditations`.
 * Montat in index.ts INAINTE de express.json(), pentru ca semnatura se calculeaza pe body-ul brut.
 */
export const revolutWebhooksRouter = express.Router();

const handledEvents = new Set(["ORDER_COMPLETED"]);

revolutWebhooksRouter.post(
  "/webhook/:merchant",
  express.raw({ type: "*/*", limit: "1mb" }),
  (req, res) => {
    const merchant = req.params.merchant as RevolutMerchantKind;
    if (merchant !== "main" && merchant !== "meditations") {
      res.status(404).json({ error: "Unknown merchant", code: "NOT_FOUND" });
      return;
    }
    const secret = getRevolutWebhookSecret(merchant);
    if (!secret) {
      res.status(503).json({ error: "Webhook not configured", code: "NOT_CONFIGURED" });
      return;
    }
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    const valid = verifyRevolutWebhookSignature({
      rawBody,
      signatureHeader: req.header("revolut-signature"),
      timestampHeader: req.header("revolut-request-timestamp"),
      secret,
    });
    if (!valid) {
      console.warn(`[revolut-webhook] ${merchant}: invalid signature`);
      res.status(401).json({ error: "Invalid signature", code: "INVALID_SIGNATURE" });
      return;
    }

    let event = "";
    let orderId = "";
    try {
      const payload = JSON.parse(rawBody.toString("utf8")) as { event?: unknown; order_id?: unknown };
      event = String(payload.event ?? "");
      orderId = String(payload.order_id ?? "");
    } catch {
      res.status(400).json({ error: "Invalid JSON", code: "INVALID_PAYLOAD" });
      return;
    }

    // Raspundem imediat; confirm-payment (SmartBill + email) poate dura cateva secunde. Daca procesarea
    // esueaza, job-ul de reconciliere reia comanda in maxim 10 minute.
    res.status(204).end();
    if (!handledEvents.has(event) || !orderId) return;
    handleRevolutOrderEvent(merchant, event, orderId).catch((error) =>
      console.error(`[revolut-webhook] ${merchant} ${event} order ${orderId} failed:`, error),
    );
  },
);
