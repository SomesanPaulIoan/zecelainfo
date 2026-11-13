const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

function normalize(text) {
  return (text ?? "").trim().split(/\r?\n/).map((line) => line.trim()).join("\n");
}

// Builds checker_code for problems whose output ends with N trailing "array size"
// tokens (see mins, in order) that must be >= a stated minimum rather than an exact
// match - real bac grading only requires the array be big enough, not an exact size.
// All tokens before those N are still compared for exact equality against expected_output.
function buildDimChecker(mins) {
  return `
function check({ expectedOutput, actualOutput }) {
  var mins = ${JSON.stringify(mins)};
  var exp = expectedOutput.trim().split(/\\s+/);
  var act = actualOutput.trim().split(/\\s+/);
  if (act.length !== exp.length) return false;
  var dataLen = exp.length - mins.length;
  for (var i = 0; i < dataLen; i++) {
    if (act[i] !== exp[i]) return false;
  }
  for (var i = 0; i < mins.length; i++) {
    var v = parseInt(act[dataLen + i], 10);
    if (!isFinite(v) || v < mins[i]) return false;
  }
  return true;
}
`;
}

async function runCustom(problemId, language, code, stdin) {
  const res = await fetch(`${API}/api/submissions/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problem_id: problemId, language, code, stdin, mode: "custom" }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`run failed: ${JSON.stringify(json)}`);
  return json.data;
}

const TEMPLATE_COL_BY_LANG = {
  cpp: "function_template_cpp",
  c: "function_template_c",
  pascal: "function_template_pascal",
  python: "function_template_python",
};

async function upsertDraft(p, LEVEL, CHAPTER, SRC) {
  const existing = await pool.query("SELECT id FROM problems WHERE slug = $1", [p.slug]);
  const allowedLanguages = p.langs;
  const checkerMode = p.checkerCode ? "custom" : "exact";
  const params = [
    p.slug,
    p.title,
    p.statement,
    p.input_format,
    p.output_format,
    p.constraints,
    p.difficulty,
    p.time_limit_ms || 1500,
    p.memory_limit_mb || 64,
    SRC,
    p.tags || [],
    allowedLanguages,
    p.solutions.cpp,
    p.hints,
    p.explanation,
    p.solutions.cpp,
    p.solutions.python || null,
    LEVEL,
    CHAPTER.id,
    p.subcategoryId,
    "function",
    p.io.input_source,
    p.io.output_target,
    p.io.input_filename,
    p.io.output_filename,
    p.templates.cpp || null,
    p.templates.c || null,
    p.templates.pascal || null,
    p.templates.python || null,
    checkerMode,
    p.checkerCode || null,
  ];
  if (existing.rows.length > 0) {
    const id = existing.rows[0].id;
    await pool.query(
      `UPDATE problems SET
         title=$2, statement=$3, input_format=$4, output_format=$5, constraints=$6,
         difficulty=$7, time_limit_ms=$8, memory_limit_mb=$9, source=$10, tags=$11,
         allowed_languages=$12, is_published=false, editorial_status='draft', official_solution=$13,
         hints=$14, explanation=$15, official_solution_cpp=$16, official_solution_python=$17,
         curriculum_level=$18, curriculum_chapter_id=$19, curriculum_subcategory_id=$20,
         solution_mode=$21, input_source=$22, output_target=$23, input_filename=$24, output_filename=$25,
         function_template_cpp=$26, function_template_c=$27, function_template_pascal=$28, function_template_python=$29,
         checker_mode=$30, checker_code=$31, updated_at=NOW()
       WHERE id=$1`,
      [id, ...params.slice(1)],
    );
    await pool.query("DELETE FROM test_cases WHERE problem_id = $1", [id]);
    return id;
  }
  const inserted = await pool.query(
    `INSERT INTO problems (
       slug, title, statement, input_format, output_format, constraints,
       difficulty, time_limit_ms, memory_limit_mb, source, tags,
       allowed_languages, is_published, official_solution,
       hints, explanation, official_solution_cpp, official_solution_python,
       curriculum_level, curriculum_chapter_id, curriculum_subcategory_id,
       solution_mode, input_source, output_target, input_filename, output_filename,
       function_template_cpp, function_template_c, function_template_pascal, function_template_python,
       checker_mode, checker_code, editorial_status, estimated_minutes
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,false,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,'draft',15
     )
     RETURNING id`,
    params,
  );
  return inserted.rows[0].id;
}

async function finalizePublish(id, testRows) {
  await pool.query("UPDATE problems SET is_published=true, editorial_status='published', updated_at=NOW() WHERE id=$1", [id]);
  for (let i = 0; i < testRows.length; i++) {
    const t = testRows[i];
    await pool.query(
      `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, t.input, t.expected_output, t.is_sample, 10, i + 1],
    );
  }
}

async function seedGroup(list, LEVEL, CHAPTER, SRC) {
  const summary = [];

  for (const p of list) {
    console.log(`\n=== ${p.slug} ===`);
    try {
      const id = await upsertDraft(p, LEVEL, CHAPTER, SRC);
      let allOk = true;
      const testRows = [];
      const refLang = p.langs[0];

      for (let i = 0; i < p.tests.length; i++) {
        const input = p.tests[i];
        const refOut = await runCustom(id, refLang, p.solutions[refLang], input);
        if (refOut.verdict !== "AC") {
          console.error(`  TEST ${i}: ${refLang} execution failed: ${JSON.stringify(refOut)}`);
          allOk = false;
          continue;
        }
        const refNorm = normalize(refOut.stdout);

        let mismatch = false;
        for (const lang of p.langs.slice(1)) {
          const out = await runCustom(id, lang, p.solutions[lang], input);
          if (out.verdict !== "AC") {
            console.error(`  TEST ${i}: ${lang} execution failed: ${JSON.stringify(out)}`);
            mismatch = true;
            continue;
          }
          const norm = normalize(out.stdout);
          if (norm !== refNorm) {
            console.error(`  TEST ${i}: MISMATCH ${refLang}="${refNorm}" ${lang}="${norm}"`);
            mismatch = true;
          }
        }
        if (mismatch) {
          allOk = false;
          continue;
        }

        testRows.push({ input, expected_output: `${refNorm}\n`, is_sample: i < 2 });
      }

      if (!allOk) {
        console.error(`!!! ${p.slug} has failing tests - left as DRAFT (is_published=false).`);
        summary.push({ slug: p.slug, ok: false, tests: testRows.length });
        continue;
      }

      await finalizePublish(id, testRows);
      console.log(`published ${p.slug} (${p.difficulty}) with ${testRows.length} tests, langs=${p.langs.join(",")}`);
      summary.push({ slug: p.slug, ok: true, tests: testRows.length });
    } catch (err) {
      console.error(`FAIL ${p.slug}: ${err.stack || err.message}`);
      summary.push({ slug: p.slug, ok: false, error: err.message });
    }
  }

  return summary;
}

async function runMain(problems, LEVEL, CHAPTER, SRC) {
  const onlySlugs = process.env.ONLY_SLUGS ? process.env.ONLY_SLUGS.split(",") : null;
  const toRun = onlySlugs ? problems.filter((p) => onlySlugs.includes(p.slug)) : problems;
  const summary = await seedGroup(toRun, LEVEL, CHAPTER, SRC);

  console.log("\n=== SUMMARY ===");
  let okCount = 0;
  for (const s of summary) {
    if (s.ok) okCount++;
    console.log(`${s.ok ? "OK  " : "FAIL"} ${s.slug} (${s.tests || 0} tests)`);
  }
  console.log(`\n${okCount}/${summary.length} publicate cu succes.`);
  if (okCount < summary.length) process.exitCode = 1;

  await pool.end();
}

module.exports = { runMain, pool, buildDimChecker };
