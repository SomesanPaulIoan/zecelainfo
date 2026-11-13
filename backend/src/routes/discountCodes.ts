import { Router } from "express";
import { z } from "zod";
import { pgPool } from "../db/postgres";
import {
  applyPercentDiscount,
  ensureDiscountCodesTable,
  resolveActiveDiscountCode,
} from "../services/discountCode.service";

const discountCodesRouter = Router();

const validateDiscountBodySchema = z.object({
  code: z.string().min(1).max(64),
  scope: z.enum(["site", "courses", "grile", "bac_correction"]),
  baseAmountRon: z.number().nonnegative().optional(),
});

discountCodesRouter.post("/validate", async (req, res) => {
  try {
    const parsed = validateDiscountBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Date invalide", code: "INVALID_PAYLOAD" });
      return;
    }
    const resolved = await resolveActiveDiscountCode(pgPool, parsed.data.code, parsed.data.scope);
    if (!resolved.ok) {
      res.json({
        data: {
          valid: false,
          message: resolved.error,
        },
      });
      return;
    }
    const percent = resolved.row.percent_off;
    const base =
      parsed.data.baseAmountRon != null && Number.isFinite(parsed.data.baseAmountRon)
        ? Number(parsed.data.baseAmountRon)
        : null;
    const finalAmountRon = base != null ? applyPercentDiscount(base, percent) : null;
    res.json({
      data: {
        valid: true,
        code: resolved.row.code,
        percent_off: percent,
        scope: resolved.row.scope,
        final_amount_ron: finalAmountRon,
      },
    });
  } catch (error) {
    console.error("discount validate:", error);
    res.status(500).json({ error: "Eroare la validare", code: "INTERNAL_ERROR" });
  }
});

export { discountCodesRouter };
