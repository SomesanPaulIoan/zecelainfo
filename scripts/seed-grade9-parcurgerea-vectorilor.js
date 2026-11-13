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
  curriculum_subcategory_id: "parcurgerea-vectorilor",
  solution_mode: "full",
  checker_mode: "exact",
  source: "Sursa interna",
};

const NOT_FOUND = "NU EXISTA\n";

function buildCppTemplate(title) {
  return [
    "#include <bits/stdc++.h>",
    "using namespace std;",
    "",
    "int main() {",
    `  // ${title}`,
    "  // Solutie pe baza parcurgerii vectorului o singura data.",
    "  return 0;",
    "}",
  ].join("\n");
}

function inputLine(params) {
  return `${params.join(" ")}\n`;
}

function parseInput(params) {
  const n = Number(params[0]);
  const arr = params.slice(1, 1 + n).map(Number);
  const rest = params.slice(1 + n).map(Number);
  return { n, arr, rest };
}

const problems = [
  { slug: "suma-elementelor-vector", title: "Suma elementelor", statement: "Suma elementelor dintr-un vector.", solver: (p) => `${parseInput(p).arr.reduce((s, x) => s + x, 0)}\n` },
  { slug: "media-aritmetica-elementelor-vector", title: "Media aritmetica", statement: "Media aritmetica a elementelor.", solver: (p) => { const { n, arr } = parseInput(p); return `${(arr.reduce((s, x) => s + x, 0) / n).toFixed(2)}\n`; } },
  { slug: "numarul-elementelor-pare-vector", title: "Numarul elementelor pare", statement: "Numarul elementelor pare.", solver: (p) => `${parseInput(p).arr.filter((x) => x % 2 === 0).length}\n` },
  { slug: "numarul-elementelor-impare-vector", title: "Numarul elementelor impare", statement: "Numarul elementelor impare.", solver: (p) => `${parseInput(p).arr.filter((x) => Math.abs(x) % 2 === 1).length}\n` },
  { slug: "suma-elementelor-pozitii-pare-vector", title: "Suma pozitiilor pare", statement: "Suma elementelor de pe pozitii pare (1-indexat).", solver: (p) => { const { arr } = parseInput(p); let s = 0; for (let i = 1; i < arr.length; i += 2) s += arr[i]; return `${s}\n`; } },
  { slug: "suma-elementelor-pozitii-impare-vector", title: "Suma pozitiilor impare", statement: "Suma elementelor de pe pozitii impare (1-indexat).", solver: (p) => { const { arr } = parseInput(p); let s = 0; for (let i = 0; i < arr.length; i += 2) s += arr[i]; return `${s}\n`; } },
  { slug: "numarul-elementelor-pozitive-vector", title: "Numarul elementelor pozitive", statement: "Numarul elementelor pozitive.", solver: (p) => `${parseInput(p).arr.filter((x) => x > 0).length}\n` },
  { slug: "numarul-elementelor-negative-vector", title: "Numarul elementelor negative", statement: "Numarul elementelor negative.", solver: (p) => `${parseInput(p).arr.filter((x) => x < 0).length}\n` },
  { slug: "produsul-elementelor-vector", title: "Produsul elementelor", statement: "Determinati produsul elementelor.", solver: (p) => { let ans = 1n; for (const x of parseInput(p).arr) ans *= BigInt(x); return `${ans.toString()}\n`; } },
  { slug: "suma-elementelor-mai-mari-decat-k", title: "Suma elementelor > k", statement: "Determinati suma elementelor mai mari decat k.", solver: (p) => { const { arr, rest } = parseInput(p); const k = rest[0]; return `${arr.filter((x) => x > k).reduce((s, x) => s + x, 0)}\n`; } },

  { slug: "suma-elementelor-pare-vector", title: "Suma elementelor pare", statement: "Suma elementelor pare din vector.", solver: (p) => `${parseInput(p).arr.filter((x) => x % 2 === 0).reduce((s, x) => s + x, 0)}\n` },
  { slug: "suma-elementelor-impare-vector", title: "Suma elementelor impare", statement: "Suma elementelor impare din vector.", solver: (p) => `${parseInput(p).arr.filter((x) => Math.abs(x) % 2 === 1).reduce((s, x) => s + x, 0)}\n` },
  { slug: "numarul-elementelor-divizibile-cu-k-vector", title: "Numarul elementelor divizibile cu k", statement: "Numarul elementelor divizibile cu k.", solver: (p) => { const { arr, rest } = parseInput(p); const k = rest[0]; return `${arr.filter((x) => x % k === 0).length}\n`; } },
  { slug: "suma-elementelor-nedivizibile-cu-k-vector", title: "Suma elementelor nedivizibile cu k", statement: "Suma elementelor care NU sunt divizibile cu k.", solver: (p) => { const { arr, rest } = parseInput(p); const k = rest[0]; return `${arr.filter((x) => x % k !== 0).reduce((s, x) => s + x, 0)}\n`; } },
  { slug: "numarul-elementelor-din-interval-a-b-vector", title: "Numarul elementelor din [a,b]", statement: "Numarul elementelor din intervalul [a,b].", solver: (p) => { const { arr, rest } = parseInput(p); const [a, b] = rest; return `${arr.filter((x) => x >= a && x <= b).length}\n`; } },
  { slug: "suma-elementelor-din-interval-a-b-vector", title: "Suma elementelor din [a,b]", statement: "Suma elementelor din intervalul [a,b].", solver: (p) => { const { arr, rest } = parseInput(p); const [a, b] = rest; return `${arr.filter((x) => x >= a && x <= b).reduce((s, x) => s + x, 0)}\n`; } },
  { slug: "primul-element-par-vector", title: "Primul element par", statement: "Determinati primul element par.", solver: (p) => { const v = parseInput(p).arr.find((x) => x % 2 === 0); return v === undefined ? NOT_FOUND : `${v}\n`; } },
  { slug: "ultimul-element-impar-vector", title: "Ultimul element impar", statement: "Determinati ultimul element impar.", solver: (p) => { const a = parseInput(p).arr; for (let i = a.length - 1; i >= 0; i -= 1) if (Math.abs(a[i]) % 2 === 1) return `${a[i]}\n`; return NOT_FOUND; } },
  { slug: "pozitia-primului-element-negativ-vector", title: "Pozitia primului negativ", statement: "Pozitia primului element negativ.", solver: (p) => { const a = parseInput(p).arr; for (let i = 0; i < a.length; i += 1) if (a[i] < 0) return `${i + 1}\n`; return "0\n"; } },
  { slug: "pozitia-ultimului-element-pozitiv-vector", title: "Pozitia ultimului pozitiv", statement: "Pozitia ultimului element pozitiv.", solver: (p) => { const a = parseInput(p).arr; for (let i = a.length - 1; i >= 0; i -= 1) if (a[i] > 0) return `${i + 1}\n`; return "0\n"; } },

  { slug: "numar-elemente-egale-cu-primul-vector", title: "Egal cu primul", statement: "Numarul de elemente egale cu primul element.", solver: (p) => { const { arr } = parseInput(p); return `${arr.filter((x) => x === arr[0]).length}\n`; } },
  { slug: "numar-elemente-egale-cu-ultimul-vector", title: "Egal cu ultimul", statement: "Numarul de elemente egale cu ultimul element.", solver: (p) => { const { arr } = parseInput(p); return `${arr.filter((x) => x === arr[arr.length - 1]).length}\n`; } },
  { slug: "suma-elementelor-mai-mari-decat-precedentul", title: "Suma elementelor > precedent", statement: "Suma elementelor mai mari decat elementul precedent.", solver: (p) => { const { arr } = parseInput(p); let s = 0; for (let i = 1; i < arr.length; i += 1) if (arr[i] > arr[i - 1]) s += arr[i]; return `${s}\n`; } },
  { slug: "numar-elemente-mai-mici-decat-urmatorul", title: "Numar elemente < urmatorul", statement: "Numarul de elemente mai mici decat elementul urmator.", solver: (p) => { const { arr } = parseInput(p); let c = 0; for (let i = 0; i + 1 < arr.length; i += 1) if (arr[i] < arr[i + 1]) c += 1; return `${c}\n`; } },
  { slug: "numar-varfuri-vector", title: "Numarul de varfuri", statement: "Numarul de varfuri (elemente mai mari decat vecinii).", solver: (p) => { const { arr } = parseInput(p); let c = 0; for (let i = 1; i + 1 < arr.length; i += 1) if (arr[i] > arr[i - 1] && arr[i] > arr[i + 1]) c += 1; return `${c}\n`; } },
  { slug: "numar-vai-vector", title: "Numarul de vai", statement: "Numarul de vai (elemente mai mici decat vecinii).", solver: (p) => { const { arr } = parseInput(p); let c = 0; for (let i = 1; i + 1 < arr.length; i += 1) if (arr[i] < arr[i - 1] && arr[i] < arr[i + 1]) c += 1; return `${c}\n`; } },
  { slug: "suma-elementelor-intre-pozitii-x-y-vector", title: "Suma intre pozitii x si y", statement: "Suma elementelor intre doua pozitii x si y (inclusiv).", solver: (p) => { const { arr, rest } = parseInput(p); let [x, y] = rest; x = Math.max(1, Math.min(x, arr.length)); y = Math.max(1, Math.min(y, arr.length)); if (x > y) [x, y] = [y, x]; let s = 0; for (let i = x - 1; i <= y - 1; i += 1) s += arr[i]; return `${s}\n`; } },
  { slug: "numar-elemente-egale-cu-media-vector", title: "Egal cu media vectorului", statement: "Numarul de elemente egale cu media vectorului.", solver: (p) => { const { n, arr } = parseInput(p); const sum = arr.reduce((s, x) => s + x, 0); return `${arr.filter((x) => x * n === sum).length}\n`; } },
  { slug: "toate-elementele-egale-vector", title: "Toate elementele egale", statement: "Determinati daca toate elementele sunt egale.", solver: (p) => { const { arr } = parseInput(p); return arr.every((x) => x === arr[0]) ? "DA\n" : "NU\n"; } },
  { slug: "vector-strict-crescator", title: "Vector strict crescator", statement: "Determinati daca vectorul este strict crescator.", solver: (p) => { const { arr } = parseInput(p); for (let i = 1; i < arr.length; i += 1) if (arr[i] <= arr[i - 1]) return "NU\n"; return "DA\n"; } },

  { slug: "numar-perechi-consecutive-egale-vector", title: "Perechi consecutive egale", statement: "Numarul de perechi consecutive egale.", solver: (p) => { const { arr } = parseInput(p); let c = 0; for (let i = 0; i + 1 < arr.length; i += 1) if (arr[i] === arr[i + 1]) c += 1; return `${c}\n`; } },
  { slug: "numar-perechi-consecutive-aceeasi-paritate-vector", title: "Perechi consecutive aceeasi paritate", statement: "Numarul de perechi consecutive cu aceeasi paritate.", solver: (p) => { const { arr } = parseInput(p); let c = 0; for (let i = 0; i + 1 < arr.length; i += 1) if (Math.abs(arr[i] % 2) === Math.abs(arr[i + 1] % 2)) c += 1; return `${c}\n`; } },
  { slug: "numar-schimbari-de-semn-vector", title: "Numarul de schimbari de semn", statement: "Numarul de schimbari de semn intre elemente consecutive non-zero.", solver: (p) => { const { arr } = parseInput(p); let c = 0; for (let i = 0; i + 1 < arr.length; i += 1) if (arr[i] !== 0 && arr[i + 1] !== 0 && ((arr[i] > 0) !== (arr[i + 1] > 0))) c += 1; return `${c}\n`; } },
  { slug: "suma-diferentelor-absolute-consecutive-vector", title: "Suma diferentelor absolute consecutive", statement: "Suma diferentelor absolute intre elemente consecutive.", solver: (p) => { const { arr } = parseInput(p); let s = 0; for (let i = 0; i + 1 < arr.length; i += 1) s += Math.abs(arr[i + 1] - arr[i]); return `${s}\n`; } },
  { slug: "lungime-maxima-secventa-egale-consecutive-vector", title: "Lungime maxima egale consecutive", statement: "Lungimea celei mai lungi secvente de elemente egale consecutive.", solver: (p) => { const { arr } = parseInput(p); let best = 1; let cur = 1; for (let i = 1; i < arr.length; i += 1) { if (arr[i] === arr[i - 1]) cur += 1; else cur = 1; best = Math.max(best, cur); } return `${best}\n`; } },
  { slug: "lungime-maxima-secventa-strict-crescatoare-vector", title: "Lungime maxima strict crescatoare", statement: "Lungimea celei mai lungi secvente strict crescatoare consecutive.", solver: (p) => { const { arr } = parseInput(p); let best = 1; let cur = 1; for (let i = 1; i < arr.length; i += 1) { if (arr[i] > arr[i - 1]) cur += 1; else cur = 1; best = Math.max(best, cur); } return `${best}\n`; } },
  { slug: "numar-secvente-lungime-2-cu-suma-para-vector", title: "Numar secvente de lungime 2 cu suma para", statement: "Numarul de perechi consecutive cu suma para.", solver: (p) => { const { arr } = parseInput(p); let c = 0; for (let i = 0; i + 1 < arr.length; i += 1) if ((arr[i] + arr[i + 1]) % 2 === 0) c += 1; return `${c}\n`; } },
  { slug: "numar-elemente-mai-mari-decat-suma-anterioara-vector", title: "Elemente > suma anterioara", statement: "Numarul elementelor mai mari decat suma elementelor anterioare.", solver: (p) => { const { arr } = parseInput(p); let pref = 0; let c = 0; for (const x of arr) { if (x > pref) c += 1; pref += x; } return `${c}\n`; } },
  { slug: "suma-elementelor-mai-mici-decat-media-vector", title: "Suma elementelor < media", statement: "Suma elementelor mai mici decat media vectorului.", solver: (p) => { const { n, arr } = parseInput(p); const mean = arr.reduce((s, x) => s + x, 0) / n; return `${arr.filter((x) => x < mean).reduce((s, x) => s + x, 0)}\n`; } },
  { slug: "numar-elemente-egale-cu-prefix-maxim-vector", title: "Numar elemente egale cu prefix max", statement: "Cate elemente sunt egale cu maximul pana la pozitia i.", solver: (p) => { const { arr } = parseInput(p); let mx = -Infinity; let c = 0; for (const x of arr) { if (x > mx) mx = x; if (x === mx) c += 1; } return `${c}\n`; } },
];

const BASE_TESTS = [
  [6, 3, -2, 7, 0, 7, 4],
  [1, 5],
  [5, 2, 2, 2, 2, 2],
  [6, -5, -1, -3, -2, -4, -6],
  [7, 1, 2, 3, 4, 5, 6, 7],
];

const CASES = {};
for (const pr of problems) CASES[pr.slug] = BASE_TESTS.map((t) => [...t]);

CASES["suma-elementelor-mai-mari-decat-k"] = [
  [6, 3, -2, 7, 0, 7, 4, 3],
  [1, 5, 10],
  [5, 2, 2, 2, 2, 2, 1],
  [6, -5, -1, -3, -2, -4, -6, -4],
  [7, 1, 2, 3, 4, 5, 6, 7, 5],
];
CASES["numarul-elementelor-divizibile-cu-k-vector"] = [
  [6, 3, -2, 7, 0, 7, 4, 2],
  [1, 5, 5],
  [5, 2, 2, 2, 2, 2, 2],
  [6, -5, -1, -3, -2, -4, -6, 3],
  [7, 1, 2, 3, 4, 5, 6, 7, 10],
];
CASES["suma-elementelor-nedivizibile-cu-k-vector"] = CASES["numarul-elementelor-divizibile-cu-k-vector"];
CASES["numarul-elementelor-din-interval-a-b-vector"] = [
  [6, 3, -2, 7, 0, 7, 4, 0, 5],
  [1, 5, 5, 5],
  [5, 2, 2, 2, 2, 2, 1, 3],
  [6, -5, -1, -3, -2, -4, -6, -4, -2],
  [7, 1, 2, 3, 4, 5, 6, 7, 10, 20],
];
CASES["suma-elementelor-din-interval-a-b-vector"] = CASES["numarul-elementelor-din-interval-a-b-vector"];
CASES["suma-elementelor-intre-pozitii-x-y-vector"] = [
  [6, 3, -2, 7, 0, 7, 4, 2, 5],
  [1, 5, 1, 1],
  [5, 2, 2, 2, 2, 2, 4, 2],
  [6, -5, -1, -3, -2, -4, -6, 6, 1],
  [7, 1, 2, 3, 4, 5, 6, 7, 3, 3],
];
CASES["al-k-lea-cel-mai-mare-element"] = [
  [6, 2, 3, -2, 7, 0, 7, 4],
  [1, 1, 5],
  [5, 2, 2, 2, 2, 2, 2],
  [6, 3, -5, -1, -3, -2, -4, -6],
  [7, 5, 1, 2, 3, 4, 5, 6, 7],
];

for (const [slug, cases] of Object.entries(CASES)) {
  if (cases.length < 5) throw new Error(`Not enough tests for ${slug}`);
}

function materializeProblem(problem) {
  const tests = CASES[problem.slug].map((params, idx) => ({
    input: inputLine(params),
    expected: problem.solver(params),
    isSample: idx === 0,
  }));
  return {
    slug: problem.slug,
    title: problem.title,
    statement: problem.statement,
    input_format:
      "Prima valoare este n, urmeaza cele n elemente ale vectorului. Unele probleme mai citesc parametri suplimentari la final.",
    output_format: "Se afiseaza rezultatul cerut de problema.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    official_solution: buildCppTemplate(problem.title),
    tags: ["clasa9", "parcurgerea-vectorilor"],
    tests,
  };
}

const allProblems = problems.map(materializeProblem);

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
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const p of allProblems) await upsertProblem(client, p);
    await client.query("COMMIT");
    console.log(`Seed complete. Upserted ${allProblems.length} parcurgerea-vectorilor problems.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to seed parcurgerea-vectorilor problems:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
