#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

const ROOT = process.cwd();
const SQL_FILE = path.join(ROOT, "cursuri.sql");
const PARTS_SQL_FILE = path.join(ROOT, "cursuri_parti.sql");
const VIDEOS_SQL_FILE = path.join(ROOT, "cursuri_videouri.sql");
const SCHEMA_FILE = path.join(ROOT, "database/010_courses_schema.sql");
const DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const EXCLUDED_LEGACY_COURSE_IDS = new Set([1]);

function extractInsertBlocks(sql, tableName) {
  const marker = `INSERT INTO \`${tableName}\` (`;
  const blocks = [];
  let cursor = 0;
  while (true) {
    const start = sql.indexOf(marker, cursor);
    if (start === -1) break;
    const colsStart = start + marker.length;
    const colsEnd = sql.indexOf(") VALUES", colsStart);
    if (colsEnd === -1) break;
    const columns = sql
      .slice(colsStart, colsEnd)
      .split(",")
      .map((item) => item.trim().replaceAll("`", ""));
    let i = colsEnd + ") VALUES".length;
    while (i < sql.length && (sql[i] === "\n" || sql[i] === "\r")) i += 1;
    const valuesStart = i;
    let inString = false;
    let escaped = false;
    while (i < sql.length) {
      const ch = sql[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === "'") inString = false;
        i += 1;
        continue;
      }
      if (ch === "'") {
        inString = true;
        i += 1;
        continue;
      }
      if (ch === ";") {
        blocks.push({ columns, valuesRaw: sql.slice(valuesStart, i) });
        i += 1;
        break;
      }
      i += 1;
    }
    cursor = i;
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
  if (/^-?\d+\.\d+$/.test(value)) return Number(value);
  return value;
}

function rowsFromBlocks(blocks) {
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

function mapImagePath(original) {
  if (!original) return null;
  const filename = path.basename(String(original));
  return `/cursuri-images/${filename}`;
}

function asIsoDateTime(value) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(" ", "T");
}

function asNullableText(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

async function run() {
  if (!fs.existsSync(SQL_FILE)) throw new Error("Missing cursuri.sql");
  if (!fs.existsSync(PARTS_SQL_FILE)) throw new Error("Missing cursuri_parti.sql");
  if (!fs.existsSync(VIDEOS_SQL_FILE)) throw new Error("Missing cursuri_videouri.sql");

  const sql = fs.readFileSync(SQL_FILE, "utf8");
  const partsSql = fs.readFileSync(PARTS_SQL_FILE, "utf8");
  const videosSql = fs.readFileSync(VIDEOS_SQL_FILE, "utf8");

  const courseRows = rowsFromBlocks(extractInsertBlocks(sql, "cursuri")).filter(
    (row) => Number(row.CourseCategoryID) === 1 && !EXCLUDED_LEGACY_COURSE_IDS.has(Number(row.ID)),
  );
  const keptCourseLegacyIds = new Set(courseRows.map((row) => Number(row.ID)));

  const partRows = rowsFromBlocks(extractInsertBlocks(partsSql, "cursuri_parti")).filter((row) =>
    keptCourseLegacyIds.has(Number(row.CourseID)),
  );
  const keptPartLegacyIds = new Set(partRows.map((row) => Number(row.ID)));

  const videoRows = rowsFromBlocks(extractInsertBlocks(videosSql, "cursuri_videouri")).filter(
    (row) => keptCourseLegacyIds.has(Number(row.CourseID)) && keptPartLegacyIds.has(Number(row.PartID)),
  );

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query(fs.readFileSync(SCHEMA_FILE, "utf8"));
    await client.query("TRUNCATE TABLE course_videos, course_parts, courses RESTART IDENTITY CASCADE");

    const legacyCourseToId = new Map();
    for (const row of courseRows) {
      const result = await client.query(
        `INSERT INTO courses (
          legacy_id, category_id, slug, name, h1, author_name, image_url, resources_url,
          hook, target_audience, content_summary, requirements, outcomes, bonuses, content_html,
          price, sale_price, currency, parts_count, hours_total, level, format, language, is_published, order_index
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25
        )
        RETURNING id`,
        [
          row.ID,
          row.CourseCategoryID,
          row.Slug,
          row.Nume,
          row.H1,
          row.AutorNume,
          mapImagePath(row.PozaMica),
          row.Resurse,
          row.Hook,
          row.CuiSeAdreseaza,
          row.CeContine,
          row.Cerinte,
          row.Rezultate,
          row.Bonusuri,
          row.ContentHTML,
          row.Price,
          row.SalePrice,
          row.Currency || "RON",
          row.PartsCount || 0,
          row.HoursTotal,
          row.Nivel,
          row.Format,
          row.Limba,
          Boolean(Number(row.IsPublished || 0)),
          row.NrOrdine || 0,
        ],
      );
      legacyCourseToId.set(Number(row.ID), result.rows[0].id);
    }

    const legacyPartToId = new Map();
    for (const row of partRows) {
      const mappedCourseId = legacyCourseToId.get(Number(row.CourseID));
      if (!mappedCourseId) continue;
      const result = await client.query(
        `INSERT INTO course_parts (
          legacy_id, course_id, slug, name, short_summary, order_index, hours, price, sale_price, currency,
          is_extension, is_published, visible_from, visible_to, created_at, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
        )
        RETURNING id`,
        [
          row.ID,
          mappedCourseId,
          asNullableText(row.Slug) || `part-${row.ID}`,
          row.Nume,
          asNullableText(row.ShortSummary),
          row.NrOrdine || 0,
          row.Hours,
          row.Price,
          row.SalePrice,
          row.Currency || "RON",
          Boolean(Number(row.IsExtension || 0)),
          Boolean(Number(row.IsPublished || 0)),
          asIsoDateTime(row.VisibleFrom),
          asIsoDateTime(row.VisibleTo),
          asIsoDateTime(row.CreatedAt),
          asIsoDateTime(row.UpdatedAt),
        ],
      );
      legacyPartToId.set(Number(row.ID), result.rows[0].id);
    }

    for (const row of videoRows) {
      const mappedCourseId = legacyCourseToId.get(Number(row.CourseID));
      const mappedPartId = legacyPartToId.get(Number(row.PartID));
      if (!mappedCourseId || !mappedPartId) continue;
      await client.query(
        `INSERT INTO course_videos (
          legacy_id, course_id, part_id, title, vimeo_id, vimeo_url, duration_seconds, sort_order,
          is_free_preview, is_published, created_at, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
        )`,
        [
          row.ID,
          mappedCourseId,
          mappedPartId,
          row.Titlu,
          String(row.VimeoID),
          asNullableText(row.VimeoUrl),
          row.DurataSec,
          row.SortOrder || 0,
          Boolean(Number(row.IsFreePreview || 0)),
          Boolean(Number(row.IsPublished || 0)),
          asIsoDateTime(row.CreatedAt),
          asIsoDateTime(row.UpdatedAt),
        ],
      );
    }
    await client.query("COMMIT");
    console.log(
      JSON.stringify(
        {
          imported_courses: courseRows.length,
          imported_parts: partRows.length,
          imported_videos: videoRows.length,
          excluded_course_legacy_ids: [...EXCLUDED_LEGACY_COURSE_IDS],
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
