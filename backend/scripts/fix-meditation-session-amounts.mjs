/**
 * Actualizeaza amount_lei la 150 pentru sedintele cu pret de test (<= 1 lei).
 * Foloseste aceeasi incarcare .env ca serverul: ../../.env apoi backend/.env (override).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(backendRoot, "..");

dotenv.config({ path: path.join(repoRoot, ".env") });
dotenv.config({ path: path.join(backendRoot, ".env"), override: true });

const url = process.env.DATABASE_URL;
if (!url || String(url).trim() === "") {
  console.error("DATABASE_URL lipseste din .env");
  process.exit(1);
}

const sql = `
UPDATE meditation_member_sessions
SET amount_lei = 150
WHERE amount_lei::numeric <= 1
RETURNING id::text, amount_lei::text
`;

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const result = await client.query(sql);
  console.log(`Actualizat ${result.rowCount} rand(uri) la 150 lei.`);
  if (result.rows.length > 0 && result.rows.length <= 20) {
    for (const row of result.rows) {
      console.log(" ", row);
    }
  }
} finally {
  await client.end();
}
