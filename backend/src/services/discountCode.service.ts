import { randomBytes } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { pgPool } from "../db/postgres";

export type DiscountCheckoutScope = "site" | "courses" | "grile" | "bac_correction";

export function normalizeDiscountCodeInput(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export async function ensureDiscountCodesTable(client: Pool | PoolClient = pgPool) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS discount_codes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      code TEXT NOT NULL,
      percent_off SMALLINT NOT NULL CHECK (percent_off >= 5 AND percent_off <= 100),
      scope TEXT NOT NULL CHECK (scope IN ('site', 'courses', 'grile', 'bac_correction')),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      uses_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (code)
    );
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_discount_codes_active_scope ON discount_codes(is_active, scope)`);
}

export type ResolvedDiscountCode = {
  id: string;
  code: string;
  percent_off: number;
  scope: DiscountCheckoutScope;
};

export async function resolveActiveDiscountCode(
  client: Pool | PoolClient,
  rawInput: string | null | undefined,
  checkoutScope: DiscountCheckoutScope,
): Promise<{ ok: true; row: ResolvedDiscountCode } | { ok: false; error: string }> {
  await ensureDiscountCodesTable(client);
  const normalized = normalizeDiscountCodeInput(rawInput ?? "");
  if (!normalized) {
    return { ok: false, error: "Introdu un cod." };
  }
  const result = await client.query<{
    id: string;
    code: string;
    percent_off: number;
    scope: DiscountCheckoutScope;
  }>(
    `SELECT id, code, percent_off, scope
     FROM discount_codes
     WHERE UPPER(TRIM(code)) = $1
       AND is_active = TRUE
     LIMIT 1`,
    [normalized],
  );
  const row = result.rows[0];
  if (!row) {
    return { ok: false, error: "Cod invalid sau inactiv." };
  }
  if (row.scope !== "site" && row.scope !== checkoutScope) {
    return { ok: false, error: "Acest cod nu se poate folosi in acest tip de comanda." };
  }
  return { ok: true, row: { id: row.id, code: row.code, percent_off: row.percent_off, scope: row.scope } };
}

export function applyPercentDiscount(amountRon: number, percentOff: number): number {
  const base = Math.max(0, Number(amountRon));
  const p = Math.min(100, Math.max(0, Math.round(percentOff)));
  return Number(((base * (100 - p)) / 100).toFixed(2));
}

export async function incrementDiscountCodeUses(client: PoolClient, codeId: string) {
  await client.query(`UPDATE discount_codes SET uses_count = uses_count + 1, updated_at = NOW() WHERE id = $1`, [codeId]);
}

export function generateRandomDiscountCode(): string {
  return randomBytes(5).toString("hex").toUpperCase();
}

/** Creeaza codul de reducere pentru elevii inscrisi la meditatii, daca nu exista deja. */
export async function ensureMeditationsSignupDiscountCode(client: Pool | PoolClient = pgPool): Promise<void> {
  await ensureDiscountCodesTable(client);
  await client.query(
    `INSERT INTO discount_codes (code, percent_off, scope)
     VALUES ('MEDITATII2027', 50, 'site')
     ON CONFLICT (code) DO NOTHING`,
  );
}
