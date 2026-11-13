#!/usr/bin/env node
/**
 * Citește `_config_pay_meditatii.php` din rădăcina repo-ului (lângă create_revolut_order_meditatii.php)
 * și actualizează variabilele MEDITATIONS_* din `backend/.env`.
 *
 * Suportă constante PHP de forma: const NAME = 'value'; sau const NAME = "value";
 *
 * Usage: node scripts/sync-meditations-env-from-php-config.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const configPath = path.join(root, "_config_pay_meditatii.php");
const envPath = path.join(root, "backend", ".env");

const PHP_TO_ENV = [
  ["REVOLUT_BASE", "MEDITATIONS_REVOLUT_BASE_URL"],
  ["REVOLUT_SECRET", "MEDITATIONS_REVOLUT_SECRET_KEY"],
  ["REVOLUT_API_VERSION", "MEDITATIONS_REVOLUT_API_VERSION"],
  ["SMARTBILL_BASE", "MEDITATIONS_SMARTBILL_BASE_URL"],
  ["SMARTBILL_USERNAME", "MEDITATIONS_SMARTBILL_USERNAME"],
  ["SMARTBILL_TOKEN", "MEDITATIONS_SMARTBILL_TOKEN"],
  ["SMARTBILL_COMPANY_VAT_CODE", "MEDITATIONS_SMARTBILL_COMPANY_VAT_CODE"],
  ["SMARTBILL_SERIES_NAME", "MEDITATIONS_SMARTBILL_SERIES_NAME"],
  ["SMARTBILL_TAX_NAME", "MEDITATIONS_SMARTBILL_TAX_NAME"],
];

function parseConstString(php, name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`const\\s+${esc}\\s*=\\s*(['"])([\\s\\S]*?)\\1\\s*;`, "m");
  const m = php.match(re);
  return m ? m[2].replace(/\\'/g, "'").replace(/\\"/g, '"') : null;
}

function parseDefineString(php, name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re1 = new RegExp(`define\\(\\s*['"]${esc}['"]\\s*,\\s*'([^'\\\\]*(?:\\\\.[^'\\\\]*)*)'\\s*\\)`, "m");
  const re2 = new RegExp(`define\\(\\s*['"]${esc}['"]\\s*,\\s*"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"\\s*\\)`, "m");
  const m1 = php.match(re1);
  if (m1) return m1[1].replace(/\\'/g, "'");
  const m2 = php.match(re2);
  if (m2) return m2[1].replace(/\\"/g, '"');
  return null;
}

function parsePhpValue(php, name) {
  return parseConstString(php, name) ?? parseDefineString(php, name);
}

function upsertEnvLines(envText, updates) {
  const lines = envText.replace(/\r\n/g, "\n").split("\n");
  const kept = lines.filter((line) => {
    if (/^MEDITATIONS_[A-Za-z0-9_]+=/.test(line)) return false;
    if (/^#\s*Meditatii — sincronizat din _config_pay_meditatii/.test(line)) return false;
    return true;
  });
  const block = Object.entries(updates)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const trimmed = kept.join("\n").replace(/\s+$/, "");
  return `${trimmed}\n\n# Meditatii — sincronizat din _config_pay_meditatii.php (${new Date().toISOString().slice(0, 10)})\n${block}\n`;
}

/** Valori din _config_pay_meditatii.example.php — nu le scriem în .env */
function isPlaceholderValue(v) {
  const s = String(v).trim();
  if (!s) return true;
  const bad = new Set([
    "sk_...",
    "your-smartbill-token",
    "your-smartbill-email",
    "your_mysql_pass",
    "your_mysql_user",
    "your_mysql_db",
    "smtp-password",
    "00000000",
  ]);
  if (bad.has(s)) return true;
  if (s.startsWith("your_")) return true;
  return false;
}

function main() {
  if (!fs.existsSync(configPath)) {
    console.error(
      `Lipsește fișierul:\n  ${configPath}\n\n` +
        `Copiază _config_pay_meditatii.example.php → _config_pay_meditatii.php și pune valorile reale, apoi rulează din nou acest script.`,
    );
    process.exit(1);
  }
  if (!fs.existsSync(envPath)) {
    console.error(`Lipsește ${envPath}`);
    process.exit(1);
  }

  const php = fs.readFileSync(configPath, "utf8");
  const updates = {};
  const missing = [];
  for (const [phpKey, envKey] of PHP_TO_ENV) {
    const v = parsePhpValue(php, phpKey);
    if (v == null || v.trim() === "") {
      missing.push(phpKey);
      continue;
    }
    if (isPlaceholderValue(v)) {
      missing.push(`${phpKey}(placeholder)`);
      continue;
    }
    updates[envKey] = v;
  }

  if (missing.length) {
    console.warn("Ignorat / lipsă:", missing.join(", "));
  }

  if (Object.keys(updates).length === 0) {
    console.error(
      "Nu s-a putut scrie niciun MEDITATIONS_* în .env: fie constantele lipsesc din PHP, fie sunt încă placeholder-e (vezi _config_pay_meditatii.example.php).",
    );
    process.exit(1);
  }

  const prev = fs.readFileSync(envPath, "utf8");
  const next = upsertEnvLines(prev, updates);
  fs.writeFileSync(envPath, next, "utf8");
  console.log(`Actualizat ${envPath} (${Object.keys(updates).length} variabile MEDITATIONS_*).`);
}

main();
