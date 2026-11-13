#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

const DUMP_FILE = path.resolve(process.cwd(), "u247165379_Zecelagrile (1).sql");
const DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";

function extractInsertBlocks(sql, tableName) {
  const marker = `INSERT INTO \`${tableName}\` (`;
  const blocks = [];
  let searchFrom = 0;

  while (true) {
    const start = sql.indexOf(marker, searchFrom);
    if (start === -1) break;

    const colsStart = start + marker.length;
    const colsEnd = sql.indexOf(") VALUES", colsStart);
    if (colsEnd === -1) break;
    const columns = sql
      .slice(colsStart, colsEnd)
      .split(",")
      .map((c) => c.trim().replaceAll("`", ""));

    let i = colsEnd + ") VALUES".length;
    while (i < sql.length && (sql[i] === "\n" || sql[i] === "\r")) i += 1;
    const valuesStart = i;

    let inString = false;
    let escaped = false;
    while (i < sql.length) {
      const ch = sql[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === "\\") {
          escaped = true;
        } else if (ch === "'") {
          inString = false;
        }
        i += 1;
        continue;
      }

      if (ch === "'") {
        inString = true;
        i += 1;
        continue;
      }

      if (ch === ";") {
        const valuesRaw = sql.slice(valuesStart, i);
        blocks.push({ columns, valuesRaw });
        i += 1;
        break;
      }
      i += 1;
    }

    searchFrom = i;
  }

  return blocks;
}

function parseTuples(raw) {
  const tuples = [];
  let i = 0;
  while (i < raw.length) {
    while (i < raw.length && raw[i] !== "(") i += 1;
    if (i >= raw.length) break;
    i += 1;
    const values = [];
    let current = "";
    let inString = false;
    while (i < raw.length) {
      const ch = raw[i];
      const next = raw[i + 1];
      if (inString) {
        if (ch === "\\" && typeof next === "string") {
          current += next;
          i += 2;
          continue;
        }
        if (ch === "'" && next === "'") {
          current += "'";
          i += 2;
          continue;
        }
        if (ch === "'") {
          inString = false;
          i += 1;
          continue;
        }
        current += ch;
        i += 1;
        continue;
      }

      if (ch === "'") {
        inString = true;
        i += 1;
        continue;
      }
      if (ch === ",") {
        values.push(current.trim());
        current = "";
        i += 1;
        continue;
      }
      if (ch === ")") {
        values.push(current.trim());
        i += 1;
        break;
      }
      current += ch;
      i += 1;
    }
    tuples.push(values.map(parseScalar));
  }
  return tuples;
}

function parseScalar(value) {
  if (value === "NULL" || value === "") return null;
  if (/^-?\d+$/.test(value)) return Number(value);
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

function mapRows(blocks) {
  const rows = [];
  for (const block of blocks) {
    const tuples = parseTuples(block.valuesRaw);
    for (const tuple of tuples) {
      const row = {};
      block.columns.forEach((col, idx) => {
        row[col] = tuple[idx] ?? null;
      });
      rows.push(row);
    }
  }
  return rows;
}

function mapCategoryNameAndSlug(rawName) {
  const normalized = String(rawName ?? "").toLowerCase();
  if (normalized.includes("ubb")) return { name: "Admitere UBB", slug: "admitere-ubb" };
  if (normalized.includes("unstpb")) return { name: "Admitere UNSTPB", slug: "admitere-unstpb" };
  if (normalized.includes(" ub")) return { name: "Admitere UB", slug: "admitere-ub" };
  if (normalized.includes("uti")) return { name: "Admitere TU Iasi", slug: "admitere-tu-iasi" };
  if (normalized.includes("atm")) return { name: "Admitere ATM", slug: "admitere-atm" };
  if (normalized.includes("bac")) return { name: "Bacalaureat", slug: "bacalaureat" };
  const fallback = String(rawName ?? "Categorie Informatica").replace(/^Grile Informatica\s*/i, "").trim();
  const slug = fallback.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
  return { name: fallback, slug };
}

async function run() {
  if (!fs.existsSync(DUMP_FILE)) {
    throw new Error(`Dump file missing: ${DUMP_FILE}`);
  }
  const sql = fs.readFileSync(DUMP_FILE, "utf8");
  const categories = mapRows(extractInsertBlocks(sql, "Categories"));
  const sources = mapRows(extractInsertBlocks(sql, "Surse"));
  const chapters = mapRows(extractInsertBlocks(sql, "Capitole"));
  const questions = mapRows(extractInsertBlocks(sql, "Grile"));
  const questionChapters = mapRows(extractInsertBlocks(sql, "CapitoleGrila"));

  const infoCategoryRows = categories.filter((c) => Number(c.Materie) === 1);
  const infoCategoryIds = new Set(infoCategoryRows.map((c) => Number(c.ID)));
  const infoSources = sources.filter((s) => infoCategoryIds.has(Number(s.CategoryID)));
  const infoSourceIds = new Set(infoSources.map((s) => Number(s.ID)));
  const infoChapters = chapters.filter((c) => infoCategoryIds.has(Number(c.CategoryID)));
  const infoChapterIds = new Set(infoChapters.map((c) => Number(c.ID)));
  const infoQuestions = questions.filter((q) => infoCategoryIds.has(Number(q.Category)));
  const infoQuestionIds = new Set(infoQuestions.map((q) => Number(q.ID)));
  const infoQuestionChapters = questionChapters.filter(
    (qc) => infoQuestionIds.has(Number(qc.GrilaID)) && infoChapterIds.has(Number(qc.CapitolID)),
  );

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query(fs.readFileSync(path.resolve(process.cwd(), "database/009_grile_full_import_schema.sql"), "utf8"));

    await client.query("TRUNCATE TABLE grile_question_chapters, grile_questions, grile_sources, grile_chapters, grile_categories RESTART IDENTITY CASCADE");

    const categoryByLegacy = new Map();
    for (const c of infoCategoryRows) {
      const mapped = mapCategoryNameAndSlug(c.Name);
      const result = await client.query(
        `INSERT INTO grile_categories (legacy_id, slug, name)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [Number(c.ID), mapped.slug, mapped.name],
      );
      categoryByLegacy.set(Number(c.ID), result.rows[0].id);
    }

    const sourceByLegacy = new Map();
    for (const s of infoSources) {
      const categoryId = categoryByLegacy.get(Number(s.CategoryID));
      if (!categoryId) continue;
      const result = await client.query(
        `INSERT INTO grile_sources (
           legacy_id, category_id, name, difficulty, order_index, exam_mode, premium, sim_eligible, image_url
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING id`,
        [
          Number(s.ID),
          categoryId,
          s.Name ?? "Sursa fara nume",
          s.Dificulty ?? null,
          s.NrOrdine ?? null,
          Boolean(Number(s.modExamen ?? 0)),
          Boolean(Number(s.premium ?? 0)),
          Boolean(Number(s.SimEligible ?? 0)),
          s.Image ?? null,
        ],
      );
      sourceByLegacy.set(Number(s.ID), result.rows[0].id);
    }

    const chapterByLegacy = new Map();
    for (const c of infoChapters) {
      const categoryId = categoryByLegacy.get(Number(c.CategoryID));
      if (!categoryId) continue;
      const result = await client.query(
        `INSERT INTO grile_chapters (legacy_id, category_id, name, difficulty, order_index, image_url)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id`,
        [Number(c.ID), categoryId, c.Name ?? "Capitol fara nume", c.Dificulty ?? null, c.NrOrdine ?? null, c.Image ?? null],
      );
      chapterByLegacy.set(Number(c.ID), result.rows[0].id);
    }

    const questionByLegacy = new Map();
    for (const q of infoQuestions) {
      const categoryId = categoryByLegacy.get(Number(q.Category));
      if (!categoryId) continue;
      const sourceId = q.Source != null ? sourceByLegacy.get(Number(q.Source)) ?? null : null;
      const chapterId = q.Capitol != null ? chapterByLegacy.get(Number(q.Capitol)) ?? null : null;
      const aiAuditIssues = q.AiAuditIssues ? JSON.parse(String(q.AiAuditIssues)) : null;

      const result = await client.query(
        `INSERT INTO grile_questions (
          legacy_id, category_id, source_id, chapter_id, image_url, answer, hint, hint_ai, explanation, explanation_ai,
          ai_audit_ok, ai_audit_issues, ai_updated_at, transcript, transcript_updated_at, video_url, difficulty, order_index,
          solution_image_url, variants_count
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15,$16,$17,$18,$19,$20
        )
        RETURNING id`,
        [
          Number(q.ID),
          categoryId,
          sourceId,
          chapterId,
          q.Image ?? null,
          q.Answer ?? null,
          q.Hint ?? null,
          q.HintAI ?? null,
          q.Explanation ?? null,
          q.ExplanationAI ?? null,
          q.AiAuditOk == null ? null : Boolean(Number(q.AiAuditOk)),
          aiAuditIssues,
          q.AiUpdatedAt ?? null,
          q.Transcript ?? null,
          q.TranscriptUpdatedAt ?? null,
          q.Video ?? null,
          q.Dificulty ?? null,
          q.NumarOrdine ?? null,
          q.rezolvareImg ?? null,
          q.NumarVarianteRapuns ?? null,
        ],
      );
      questionByLegacy.set(Number(q.ID), result.rows[0].id);
    }

    for (const qc of infoQuestionChapters) {
      const questionId = questionByLegacy.get(Number(qc.GrilaID));
      const chapterId = chapterByLegacy.get(Number(qc.CapitolID));
      if (!questionId || !chapterId) continue;
      await client.query(
        `INSERT INTO grile_question_chapters (question_id, chapter_id)
         VALUES ($1,$2)
         ON CONFLICT DO NOTHING`,
        [questionId, chapterId],
      );
    }

    await client.query("COMMIT");
    console.log(
      JSON.stringify(
        {
          categories: infoCategoryRows.length,
          sources: infoSources.length,
          chapters: infoChapters.length,
          questions: infoQuestions.length,
          questionChapters: infoQuestionChapters.length,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
