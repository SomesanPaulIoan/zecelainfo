import { promises as fs } from "node:fs";
import path from "node:path";
import { pgPool } from "../db/postgres";

let bootstrapPromise: Promise<void> | null = null;

function getMigrationCandidates(): string[] {
  const distDir = __dirname;
  const appRoot = path.resolve(distDir, "..");

  return [
    path.join(appRoot, "database", "021_bac_exam_auto_grading.sql"),
    path.resolve(appRoot, "..", "database", "021_bac_exam_auto_grading.sql"),
    path.resolve(process.cwd(), "database", "021_bac_exam_auto_grading.sql"),
    path.resolve(process.cwd(), "../database", "021_bac_exam_auto_grading.sql"),
  ];
}

async function readMigrationSql(): Promise<string> {
  for (const candidate of getMigrationCandidates()) {
    try {
      return await fs.readFile(candidate, "utf8");
    } catch {
      // try next candidate
    }
  }
  throw new Error(
    `Nu am gasit migratia bac_exam (021_bac_exam_auto_grading.sql). Cautat in: ${getMigrationCandidates().join(", ")}`,
  );
}

export async function ensureBacExamTables() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const sql = await readMigrationSql();
      await pgPool.query(sql);
    })().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }
  await bootstrapPromise;
}
