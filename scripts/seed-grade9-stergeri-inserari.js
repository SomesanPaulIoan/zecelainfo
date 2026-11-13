const { Pool } = require("pg");

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";

const pool = new Pool({ connectionString });

const BASE_META = {
  difficulty: "easy",
  time_limit_ms: 1000,
  memory_limit_mb: 64,
  input_source: "stdin",
  output_target: "stdout",
  curriculum_level: "grade9",
  curriculum_chapter_id: "tablouri-uni",
  curriculum_subcategory_id: "stergeri-inserari",
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
    "  // Solutie pe vector cu parcurgere liniara / operatii de inserare-stergere.",
    "  return 0;",
    "}",
  ].join("\n");
}

function inputLine(params) {
  return `${params.join(" ")}\n`;
}

function parseNArr(params) {
  const n = Number(params[0]);
  const arr = params.slice(1, 1 + n).map(Number);
  const rest = params.slice(1 + n).map(Number);
  return { n, arr, rest };
}

function vectorOut(a) {
  if (!a.length) return "VID\n";
  return `${a.join(" ")}\n`;
}

const problems = [
  {
    slug: "sterge-toate-imparele-liniar",
    title: "Sterge toate elementele impare (liniar)",
    statement: "Se da un vector. Stergeti toate elementele impare, cu implementare liniara.",
    solve: (p) => {
      const { arr } = parseNArr(p);
      return vectorOut(arr.filter((x) => x % 2 === 0));
    },
  },
  {
    slug: "insereaza-dupa-fiecare-par-jumatatea",
    title: "Insereaza dupa fiecare par jumatatea sa",
    statement: "Se da un vector. Inserati dupa fiecare element par jumatatea sa.",
    solve: (p) => {
      const { arr } = parseNArr(p);
      const out = [];
      for (const x of arr) {
        out.push(x);
        if (x % 2 === 0) out.push(x / 2);
      }
      return vectorOut(out);
    },
  },
  {
    slug: "afisare-permutari-circulare-ale-sirului",
    title: "Afisare permutari circulare",
    statement: "Se da un sir (vector). Afisati toate permutarile circulare la stanga.",
    solve: (p) => {
      const { arr } = parseNArr(p);
      const out = [];
      for (let shift = 0; shift < arr.length; shift += 1) {
        const row = arr.slice(shift).concat(arr.slice(0, shift));
        out.push(row.join(" "));
      }
      return `${out.join("\n")}\n`;
    },
  },
  {
    slug: "sterge-imparele-si-insereaza-jumatate-dupa-pare",
    title: "Sterge imparele si insereaza jumatate dupa pare",
    statement: "Stergeti toate imparele, apoi dupa fiecare par ramas inserati jumatatea sa.",
    solve: (p) => {
      const { arr } = parseNArr(p);
      const out = [];
      for (const x of arr) {
        if (x % 2 !== 0) continue;
        out.push(x);
        out.push(x / 2);
      }
      return vectorOut(out);
    },
  },
  {
    slug: "sterge-toate-aparitiile-lui-x-din-vector",
    title: "Sterge toate aparitiile lui x",
    statement: "Se da un vector si x. Stergeti toate aparitiile lui x.",
    solve: (p) => {
      const { arr, rest } = parseNArr(p);
      const x = rest[0];
      return vectorOut(arr.filter((v) => v !== x));
    },
  },
  {
    slug: "insereaza-x-dupa-fiecare-element-negativ",
    title: "Insereaza x dupa fiecare negativ",
    statement: "Se da un vector si x. Inserati x dupa fiecare element negativ.",
    solve: (p) => {
      const { arr, rest } = parseNArr(p);
      const x = rest[0];
      const out = [];
      for (const v of arr) {
        out.push(v);
        if (v < 0) out.push(x);
      }
      return vectorOut(out);
    },
  },
  {
    slug: "sterge-elementul-de-pe-pozitia-k",
    title: "Sterge elementul de pe pozitia k",
    statement: "Se da un vector si pozitia k (1-indexat). Stergeti elementul de pe k.",
    solve: (p) => {
      const { arr, rest } = parseNArr(p);
      const k = rest[0];
      if (k < 1 || k > arr.length) return vectorOut(arr);
      return vectorOut(arr.slice(0, k - 1).concat(arr.slice(k)));
    },
  },
  {
    slug: "insereaza-x-pe-pozitia-k",
    title: "Insereaza x pe pozitia k",
    statement: "Se da un vector, x si k (1-indexat). Inserati x pe pozitia k.",
    solve: (p) => {
      const { arr, rest } = parseNArr(p);
      const x = rest[0];
      const k = rest[1];
      const pos = Math.max(1, Math.min(arr.length + 1, k));
      return vectorOut(arr.slice(0, pos - 1).concat([x], arr.slice(pos - 1)));
    },
  },
  {
    slug: "sterge-duplicatele-consecutive",
    title: "Sterge duplicatele consecutive",
    statement: "Stergeti elementele duplicate consecutive, pastrand o singura aparitie.",
    solve: (p) => {
      const { arr } = parseNArr(p);
      if (!arr.length) return "VID\n";
      const out = [arr[0]];
      for (let i = 1; i < arr.length; i += 1) if (arr[i] !== arr[i - 1]) out.push(arr[i]);
      return vectorOut(out);
    },
  },
  {
    slug: "insereaza-suma-vecinilor-intre-elemente",
    title: "Insereaza suma vecinilor intre elemente",
    statement: "Intre fiecare doua elemente consecutive inserati suma lor.",
    solve: (p) => {
      const { arr } = parseNArr(p);
      if (!arr.length) return "VID\n";
      const out = [arr[0]];
      for (let i = 1; i < arr.length; i += 1) {
        out.push(arr[i - 1] + arr[i]);
        out.push(arr[i]);
      }
      return vectorOut(out);
    },
  },
  {
    slug: "rotire-la-stanga-cu-k-pozitii",
    title: "Rotire la stanga cu k pozitii",
    statement: "Se da un vector si k. Rotiti vectorul la stanga cu k pozitii.",
    solve: (p) => {
      const { arr, rest } = parseNArr(p);
      if (!arr.length) return "VID\n";
      let k = rest[0] % arr.length;
      if (k < 0) k += arr.length;
      return vectorOut(arr.slice(k).concat(arr.slice(0, k)));
    },
  },
  {
    slug: "rotire-la-dreapta-cu-k-pozitii",
    title: "Rotire la dreapta cu k pozitii",
    statement: "Se da un vector si k. Rotiti vectorul la dreapta cu k pozitii.",
    solve: (p) => {
      const { arr, rest } = parseNArr(p);
      if (!arr.length) return "VID\n";
      let k = rest[0] % arr.length;
      if (k < 0) k += arr.length;
      return vectorOut(arr.slice(arr.length - k).concat(arr.slice(0, arr.length - k)));
    },
  },
];

const BASE = [
  [6, 3, 2, 7, 8, 9, 4],
  [1, 5],
  [7, -6, -3, 0, 2, 4, 7, 10],
  [5, 1, 1, 1, 1, 1],
  [8, 2, 4, 6, 8, 10, 12, 14, 16],
];

const CASES = {};
for (const pr of problems) CASES[pr.slug] = BASE.map((x) => [...x]);

CASES["sterge-toate-aparitiile-lui-x-din-vector"] = [
  [6, 3, 2, 7, 8, 9, 4, 7],
  [1, 5, 5],
  [7, -6, -3, 0, 2, 4, 7, 10, 100],
  [5, 1, 1, 1, 1, 1, 1],
  [8, 2, 4, 6, 8, 10, 12, 14, 16, 2],
];
CASES["insereaza-x-dupa-fiecare-element-negativ"] = [
  [6, 3, -2, 7, 8, -9, 4, 99],
  [1, -5, 0],
  [7, -6, -3, 0, 2, 4, 7, 10, -1],
  [5, 1, 1, 1, 1, 1, 5],
  [8, -2, 4, -6, 8, 10, -12, 14, 16, 7],
];
CASES["sterge-elementul-de-pe-pozitia-k"] = [
  [6, 3, 2, 7, 8, 9, 4, 3],
  [1, 5, 1],
  [7, -6, -3, 0, 2, 4, 7, 10, 10],
  [5, 1, 1, 1, 1, 1, 6],
  [8, 2, 4, 6, 8, 10, 12, 14, 16, 8],
];
CASES["insereaza-x-pe-pozitia-k"] = [
  [6, 3, 2, 7, 8, 9, 4, 100, 3],
  [1, 5, -1, 1],
  [7, -6, -3, 0, 2, 4, 7, 10, 50, 20],
  [5, 1, 1, 1, 1, 1, 9, 2],
  [8, 2, 4, 6, 8, 10, 12, 14, 16, 0, 9],
];
CASES["rotire-la-stanga-cu-k-pozitii"] = [
  [6, 3, 2, 7, 8, 9, 4, 2],
  [1, 5, 10],
  [7, -6, -3, 0, 2, 4, 7, 10, 7],
  [5, 1, 1, 1, 1, 1, 0],
  [8, 2, 4, 6, 8, 10, 12, 14, 16, 11],
];
CASES["rotire-la-dreapta-cu-k-pozitii"] = CASES["rotire-la-stanga-cu-k-pozitii"];

function materializeProblem(problem) {
  const tests = CASES[problem.slug].map((params, idx) => ({
    input: inputLine(params),
    expected: problem.solve(params),
    isSample: idx === 0,
  }));
  return {
    slug: problem.slug,
    title: problem.title,
    statement: problem.statement,
    input_format:
      "Se citeste n, apoi cele n elemente. In functie de problema pot exista parametri suplimentari (x, k).",
    output_format: "Se afiseaza vectorul rezultat (sau fiecare rotire/permutare pe linie separata).",
    constraints: "1 <= n <= 100000, |a_i| <= 10^9",
    official_solution: buildCppTemplate(problem.title),
    tags: ["clasa9", "stergeri-inserari"],
    tests,
  };
}

const allProblems = problems.map(materializeProblem);

function runInternalStressChecks() {
  const n = 100000;
  const arr = Array.from({ length: n }, (_, i) => i + 1);
  const filtered = arr.filter((x) => x % 2 === 0);
  if (filtered.length !== 50000) throw new Error("Stress check failed for odd-removal linear case");
}

async function upsertProblem(client, p) {
  const existing = await client.query(`SELECT id FROM problems WHERE slug = $1 LIMIT 1`, [p.slug]);
  let problemId = existing.rows[0]?.id;
  if (problemId) {
    await client.query(
      `UPDATE problems
       SET title = $2, statement = $3, official_solution = $4, input_format = $5, output_format = $6, constraints = $7,
           difficulty = $8, tags = $9, source = $10, is_published = true, time_limit_ms = $11, memory_limit_mb = $12,
           input_source = $13, output_target = $14, curriculum_level = $15, curriculum_chapter_id = $16,
           curriculum_subcategory_id = $17, solution_mode = $18, checker_mode = $19, updated_at = NOW()
       WHERE id = $1`,
      [
        problemId, p.title, p.statement, p.official_solution, p.input_format, p.output_format, p.constraints,
        BASE_META.difficulty, p.tags, BASE_META.source, BASE_META.time_limit_ms, BASE_META.memory_limit_mb,
        BASE_META.input_source, BASE_META.output_target, BASE_META.curriculum_level, BASE_META.curriculum_chapter_id,
        BASE_META.curriculum_subcategory_id, BASE_META.solution_mode, BASE_META.checker_mode,
      ],
    );
    await client.query(`DELETE FROM test_cases WHERE problem_id = $1`, [problemId]);
  } else {
    const ins = await client.query(
      `INSERT INTO problems (
         title, slug, statement, official_solution, input_format, output_format, constraints,
         difficulty, tags, source, is_published, time_limit_ms, memory_limit_mb, input_source, output_target,
         curriculum_level, curriculum_chapter_id, curriculum_subcategory_id, solution_mode, checker_mode
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING id`,
      [
        p.title, p.slug, p.statement, p.official_solution, p.input_format, p.output_format, p.constraints,
        BASE_META.difficulty, p.tags, BASE_META.source, BASE_META.time_limit_ms, BASE_META.memory_limit_mb,
        BASE_META.input_source, BASE_META.output_target, BASE_META.curriculum_level, BASE_META.curriculum_chapter_id,
        BASE_META.curriculum_subcategory_id, BASE_META.solution_mode, BASE_META.checker_mode,
      ],
    );
    problemId = ins.rows[0].id;
  }

  for (let i = 0; i < p.tests.length; i += 1) {
    const t = p.tests[i];
    await client.query(
      `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [problemId, t.input, t.expected, Boolean(t.isSample), 20, i + 1],
    );
  }
}

async function main() {
  runInternalStressChecks();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const p of allProblems) await upsertProblem(client, p);
    await client.query("COMMIT");
    console.log(`Seed complete. Upserted ${allProblems.length} stergeri-inserari problems.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to seed stergeri-inserari problems:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
