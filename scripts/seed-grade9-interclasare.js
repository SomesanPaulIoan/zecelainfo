const { Pool } = require("pg");

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const pool = new Pool({ connectionString });

const BASE_META = {
  difficulty: "medium",
  time_limit_ms: 1000,
  memory_limit_mb: 128,
  input_source: "stdin",
  output_target: "stdout",
  curriculum_level: "grade9",
  curriculum_chapter_id: "tablouri-uni",
  curriculum_subcategory_id: "interclasare",
  solution_mode: "full",
  checker_mode: "exact",
  source: "Sursa interna",
};

function buildCppTemplate(title) {
  return [
    "#include <bits/stdc++.h>",
    "using namespace std;",
    "",
    "int main() {",
    `  // ${title}`,
    "  // Solutie liniara O(n+m) prin interclasare cu doi indici.",
    "  return 0;",
    "}",
  ].join("\n");
}

function inputLine(params) {
  return `${params.join(" ")}\n`;
}

function parse(params) {
  const n = Number(params[0]);
  const m = Number(params[1]);
  const a = params.slice(2, 2 + n).map(Number);
  const b = params.slice(2 + n, 2 + n + m).map(Number);
  return { a, b };
}

function out(v) {
  if (!v.length) return "VID\n";
  return `${v.join(" ")}\n`;
}

function unionSet(a, b) {
  const r = [];
  let i = 0;
  let j = 0;
  let last = null;
  while (i < a.length || j < b.length) {
    let x;
    if (j >= b.length || (i < a.length && a[i] < b[j])) x = a[i++];
    else if (i >= a.length || b[j] < a[i]) x = b[j++];
    else {
      x = a[i];
      i += 1;
      j += 1;
    }
    if (last !== x) {
      r.push(x);
      last = x;
    }
  }
  return r;
}

function intersectionSet(a, b) {
  const r = [];
  let i = 0;
  let j = 0;
  let last = null;
  while (i < a.length && j < b.length) {
    if (a[i] < b[j]) i += 1;
    else if (b[j] < a[i]) j += 1;
    else {
      if (last !== a[i]) {
        r.push(a[i]);
        last = a[i];
      }
      i += 1;
      j += 1;
    }
  }
  return r;
}

function differenceSet(a, b) {
  const r = [];
  let i = 0;
  let j = 0;
  while (i < a.length) {
    while (j < b.length && b[j] < a[i]) j += 1;
    const x = a[i];
    let inB = false;
    if (j < b.length && b[j] === x) inB = true;
    if (!inB && (r.length === 0 || r[r.length - 1] !== x)) r.push(x);
    i += 1;
  }
  return r;
}

function symDiffSet(a, b) {
  return unionSet(differenceSet(a, b), differenceSet(b, a));
}

function unionMulti(a, b) {
  const r = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (j >= b.length || (i < a.length && a[i] <= b[j])) r.push(a[i++]);
    else r.push(b[j++]);
  }
  return r;
}

function intersectionMulti(a, b) {
  const r = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] < b[j]) i += 1;
    else if (b[j] < a[i]) j += 1;
    else {
      r.push(a[i]);
      i += 1;
      j += 1;
    }
  }
  return r;
}

const problems = [
  {
    slug: "interclasare-reuniune-multimi-sortate",
    title: "Reuniunea a doua multimi sortate",
    statement:
      "Se dau doi vectori sortati crescator. Afisati reuniunea (fara duplicate), in ordine crescatoare, in timp O(n+m).",
    solve: (p) => {
      const { a, b } = parse(p);
      return out(unionSet(a, b));
    },
  },
  {
    slug: "interclasare-intersectie-multimi-sortate",
    title: "Intersectia a doua multimi sortate",
    statement:
      "Se dau doi vectori sortati crescator. Afisati intersectia (fara duplicate), in ordine crescatoare, in timp O(n+m).",
    solve: (p) => {
      const { a, b } = parse(p);
      return out(intersectionSet(a, b));
    },
  },
  {
    slug: "interclasare-diferenta-a-minus-b-multimi-sortate",
    title: "Diferenta A \\ B pentru multimi sortate",
    statement:
      "Se dau doi vectori sortati crescator. Afisati elementele din A care nu apar in B (fara duplicate), in O(n+m).",
    solve: (p) => {
      const { a, b } = parse(p);
      return out(differenceSet(a, b));
    },
  },
  {
    slug: "interclasare-diferenta-simetrica-multimi-sortate",
    title: "Diferenta simetrica pentru multimi sortate",
    statement:
      "Se dau doi vectori sortati crescator. Afisati diferenta simetrica (elementele care apar intr-un singur vector), in O(n+m).",
    solve: (p) => {
      const { a, b } = parse(p);
      return out(symDiffSet(a, b));
    },
  },
  {
    slug: "interclasare-reuniune-multiset-sortat",
    title: "Reuniune (multiset) prin interclasare",
    statement:
      "Se dau doi vectori sortati crescator (cu duplicate). Afisati reuniunea de tip multiset (practic interclasarea completa), in O(n+m).",
    solve: (p) => {
      const { a, b } = parse(p);
      return out(unionMulti(a, b));
    },
  },
  {
    slug: "interclasare-intersectie-multiset-sortat",
    title: "Intersectie (multiset) prin interclasare",
    statement:
      "Se dau doi vectori sortati crescator (cu duplicate). Afisati intersectia de tip multiset (minimul frecventelor), in O(n+m).",
    solve: (p) => {
      const { a, b } = parse(p);
      return out(intersectionMulti(a, b));
    },
  },
];

const CASES = {
  "interclasare-reuniune-multimi-sortate": [
    [5, 6, 1, 2, 2, 5, 9, 2, 3, 5, 7, 9, 10],
    [3, 3, 1, 3, 5, 2, 4, 6],
    [4, 4, 1, 2, 3, 4, 1, 2, 3, 4],
    [5, 2, 1, 1, 1, 1, 1],
    [6, 6, -5, -3, -1, 0, 2, 8, -6, -3, 0, 1, 2, 9],
  ],
  "interclasare-intersectie-multimi-sortate": [
    [5, 6, 1, 2, 2, 5, 9, 2, 3, 5, 7, 9, 10],
    [3, 3, 1, 3, 5, 2, 4, 6],
    [4, 4, 1, 2, 3, 4, 1, 2, 3, 4],
    [5, 2, 1, 1, 1, 1, 1],
    [6, 6, -5, -3, -1, 0, 2, 8, -6, -3, 0, 1, 2, 9],
  ],
  "interclasare-diferenta-a-minus-b-multimi-sortate": [
    [5, 6, 1, 2, 2, 5, 9, 2, 3, 5, 7, 9, 10],
    [3, 3, 1, 3, 5, 2, 4, 6],
    [4, 4, 1, 2, 3, 4, 1, 2, 3, 4],
    [5, 2, 1, 1, 1, 1, 1],
    [6, 6, -5, -3, -1, 0, 2, 8, -6, -3, 0, 1, 2, 9],
  ],
  "interclasare-diferenta-simetrica-multimi-sortate": [
    [5, 6, 1, 2, 2, 5, 9, 2, 3, 5, 7, 9, 10],
    [3, 3, 1, 3, 5, 2, 4, 6],
    [4, 4, 1, 2, 3, 4, 1, 2, 3, 4],
    [5, 2, 1, 1, 1, 1, 1],
    [6, 6, -5, -3, -1, 0, 2, 8, -6, -3, 0, 1, 2, 9],
  ],
  "interclasare-reuniune-multiset-sortat": [
    [5, 6, 1, 2, 2, 5, 9, 2, 3, 5, 7, 9, 10],
    [3, 3, 1, 3, 5, 2, 4, 6],
    [4, 4, 1, 2, 3, 4, 1, 2, 3, 4],
    [5, 2, 1, 1, 1, 1, 1],
    [6, 6, -5, -3, -1, 0, 2, 8, -6, -3, 0, 1, 2, 9],
  ],
  "interclasare-intersectie-multiset-sortat": [
    [5, 6, 1, 2, 2, 5, 9, 2, 3, 5, 7, 9, 10],
    [3, 3, 1, 3, 5, 2, 4, 6],
    [4, 4, 1, 2, 3, 4, 1, 2, 3, 4],
    [5, 2, 1, 1, 1, 1, 1],
    [6, 6, -5, -3, -1, 0, 2, 8, -6, -3, 0, 1, 2, 9],
  ],
};

function runStressCheck100k() {
  const n = 100000;
  const a = Array.from({ length: n }, (_, i) => i * 2);
  const b = Array.from({ length: n }, (_, i) => i * 2 + 1);

  const u = unionSet(a, b);
  if (u.length !== 200000) throw new Error("Stress fail: union size");

  const i = intersectionSet(a, b);
  if (i.length !== 0) throw new Error("Stress fail: intersection size");

  const d = differenceSet(a, b);
  if (d.length !== 100000) throw new Error("Stress fail: difference size");
}

function materialize(problem) {
  const tests = CASES[problem.slug].map((params, idx) => ({
    input: inputLine(params),
    expected: problem.solve(params),
    isSample: idx === 0,
  }));
  return {
    slug: problem.slug,
    title: problem.title,
    statement: problem.statement,
    input_format: "Se citesc n m, apoi vectorul A sortat crescator (n valori), apoi vectorul B sortat crescator (m valori).",
    output_format: "Se afiseaza rezultatul in ordine crescatoare; daca este vid, afisati VID.",
    constraints: "1 <= n,m <= 100000; valorile sunt intregi si vectorii sunt deja sortati.",
    official_solution: buildCppTemplate(problem.title),
    tags: ["clasa9", "interclasare"],
    tests,
  };
}

const allProblems = problems.map(materialize);

async function upsertProblem(client, p) {
  const ex = await client.query(`SELECT id FROM problems WHERE slug=$1 LIMIT 1`, [p.slug]);
  let id = ex.rows[0]?.id;
  if (id) {
    await client.query(
      `UPDATE problems
       SET title=$2, statement=$3, official_solution=$4, input_format=$5, output_format=$6, constraints=$7,
           difficulty=$8, tags=$9, source=$10, is_published=true, time_limit_ms=$11, memory_limit_mb=$12,
           input_source=$13, output_target=$14, curriculum_level=$15, curriculum_chapter_id=$16, curriculum_subcategory_id=$17,
           solution_mode=$18, checker_mode=$19, updated_at=NOW()
       WHERE id=$1`,
      [
        id, p.title, p.statement, p.official_solution, p.input_format, p.output_format, p.constraints,
        BASE_META.difficulty, p.tags, BASE_META.source, BASE_META.time_limit_ms, BASE_META.memory_limit_mb,
        BASE_META.input_source, BASE_META.output_target, BASE_META.curriculum_level, BASE_META.curriculum_chapter_id,
        BASE_META.curriculum_subcategory_id, BASE_META.solution_mode, BASE_META.checker_mode,
      ],
    );
    await client.query(`DELETE FROM test_cases WHERE problem_id=$1`, [id]);
  } else {
    const ins = await client.query(
      `INSERT INTO problems (title, slug, statement, official_solution, input_format, output_format, constraints, difficulty, tags, source, is_published,
       time_limit_ms, memory_limit_mb, input_source, output_target, curriculum_level, curriculum_chapter_id, curriculum_subcategory_id, solution_mode, checker_mode)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING id`,
      [
        p.title, p.slug, p.statement, p.official_solution, p.input_format, p.output_format, p.constraints,
        BASE_META.difficulty, p.tags, BASE_META.source, BASE_META.time_limit_ms, BASE_META.memory_limit_mb,
        BASE_META.input_source, BASE_META.output_target, BASE_META.curriculum_level, BASE_META.curriculum_chapter_id,
        BASE_META.curriculum_subcategory_id, BASE_META.solution_mode, BASE_META.checker_mode,
      ],
    );
    id = ins.rows[0].id;
  }

  for (let i = 0; i < p.tests.length; i += 1) {
    const t = p.tests[i];
    await client.query(
      `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, t.input, t.expected, Boolean(t.isSample), 20, i + 1],
    );
  }
}

async function main() {
  runStressCheck100k();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const p of allProblems) await upsertProblem(client, p);
    await client.query("COMMIT");
    console.log(`Seed complete. Upserted ${allProblems.length} interclasare problems.`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Failed:", e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
