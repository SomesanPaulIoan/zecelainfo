const { Pool } = require("pg");
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const CLANG_STYLE =
  "{BasedOnStyle: Google, IndentWidth: 4, ColumnLimit: 100, " +
  "AllowShortIfStatementsOnASingleLine: false, AllowShortLoopsOnASingleLine: false, " +
  "AllowShortFunctionsOnASingleLine: Empty, AllowShortBlocksOnASingleLine: false}";

function tmpPath(prefix, ext) {
  return path.join(os.tmpdir(), `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
}

function formatCpp(code) {
  const file = tmpPath("fmt", "cpp");
  fs.writeFileSync(file, code);
  try {
    return execFileSync("clang-format", [`-style=${CLANG_STYLE}`, file], {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
  } finally {
    fs.unlinkSync(file);
  }
}

function syntaxCheckOk(code) {
  const file = tmpPath("check", "cpp");
  fs.writeFileSync(file, code);
  try {
    execFileSync("g++", ["-std=c++17", "-fsyntax-only", file], { encoding: "utf8", stdio: "pipe" });
    return true;
  } catch (err) {
    return false;
  } finally {
    fs.unlinkSync(file);
  }
}

async function main() {
  const { rows } = await pool.query(
    `SELECT id, slug, official_solution_cpp FROM problems WHERE official_solution_cpp IS NOT NULL AND official_solution_cpp != ''`,
  );
  console.log(`Found ${rows.length} problems with a C++ official solution.\n`);

  let updated = 0;
  let unchanged = 0;
  let failedFormat = 0;
  let failedSyntax = 0;
  const failures = [];

  for (const row of rows) {
    let formatted;
    try {
      formatted = formatCpp(row.official_solution_cpp);
    } catch (err) {
      failedFormat++;
      failures.push({ slug: row.slug, stage: "clang-format", detail: String(err.message || err).slice(0, 200) });
      continue;
    }

    if (formatted.trim() === row.official_solution_cpp.trim()) {
      unchanged++;
      continue;
    }

    if (!syntaxCheckOk(formatted)) {
      failedSyntax++;
      failures.push({ slug: row.slug, stage: "g++ -fsyntax-only (post-format)" });
      continue;
    }

    await pool.query(`UPDATE problems SET official_solution = $1, official_solution_cpp = $1 WHERE id = $2`, [
      formatted,
      row.id,
    ]);
    updated++;
    if (updated % 50 === 0) console.log(`  ...${updated} updated so far`);
  }

  console.log("\n=== SUMMARY ===");
  console.log(`Reformatted and updated: ${updated}`);
  console.log(`Already fine (no change needed): ${unchanged}`);
  console.log(`Skipped - clang-format failed: ${failedFormat}`);
  console.log(`Skipped - failed syntax check after format: ${failedSyntax}`);

  if (failures.length) {
    console.log("\nProblems needing manual review:");
    for (const f of failures) console.log(`  - ${f.slug} [${f.stage}]${f.detail ? ": " + f.detail : ""}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
