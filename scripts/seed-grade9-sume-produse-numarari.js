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
  curriculum_chapter_id: "algoritmi-elementari",
  curriculum_subcategory_id: "sume-produse-numarari",
  solution_mode: "full",
  checker_mode: "exact",
  source: "Sursa interna",
};

function toBigInt(x) {
  return BigInt(String(x).trim());
}

function sum1ToN(n) {
  n = toBigInt(n);
  return (n * (n + 1n)) / 2n;
}

function sumSquares(n) {
  n = toBigInt(n);
  return (n * (n + 1n) * (2n * n + 1n)) / 6n;
}

function sumCubes(n) {
  const s = sum1ToN(n);
  return s * s;
}

function factorial(n) {
  n = Number(n);
  let ans = 1n;
  for (let i = 2n; i <= BigInt(n); i += 1n) ans *= i;
  return ans;
}

function powBigInt(base, exp) {
  let b = toBigInt(base);
  let e = Number(exp);
  let ans = 1n;
  while (e > 0) {
    if (e & 1) ans *= b;
    b *= b;
    e >>= 1;
  }
  return ans;
}

function buildCppTemplate(title) {
  return [
    "#include <bits/stdc++.h>",
    "using namespace std;",
    "",
    "int main() {",
    `  // ${title}`,
    "  // Solutie: formule clasice / bucle de acumulare / numarare.",
    "  return 0;",
    "}",
  ].join("\n");
}

function inputLine(params) {
  return `${params.join(" ")}\n`;
}

const problems = [
  {
    slug: "suma-1-la-n",
    title: "Suma numerelor de la 1 la n",
    statement: "Se citeste n. Afisati suma tuturor numerelor de la 1 la n.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza suma 1 + 2 + ... + n.",
    constraints: "0 <= n <= 10^9",
    solver: ([n]) => `${sum1ToN(n).toString()}\n`,
  },
  {
    slug: "suma-patratelor-1-la-n",
    title: "Suma patratelor de la 1 la n",
    statement: "Se citeste n. Afisati suma tuturor patratelor de la 1 la n.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza 1^2 + 2^2 + ... + n^2.",
    constraints: "0 <= n <= 10^6",
    solver: ([n]) => `${sumSquares(n).toString()}\n`,
  },
  {
    slug: "suma-cuburilor-1-la-n",
    title: "Suma cuburilor de la 1 la n",
    statement: "Se citeste n. Afisati suma tuturor cuburilor de la 1 la n.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza 1^3 + 2^3 + ... + n^3.",
    constraints: "0 <= n <= 10^6",
    solver: ([n]) => `${sumCubes(n).toString()}\n`,
  },
  {
    slug: "suma-i-inmultit-cu-i-plus-1",
    title: "Suma i*(i+1) de la 1 la n",
    statement: "Se citeste n. Calculati 1*2 + 2*3 + ... + n*(n+1).",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza suma ceruta.",
    constraints: "0 <= n <= 10^9",
    solver: ([n]) => {
      n = toBigInt(n);
      const ans = (n * (n + 1n) * (n + 2n)) / 3n;
      return `${ans.toString()}\n`;
    },
  },
  {
    slug: "factorial-n",
    title: "Calculul lui n!",
    statement: "Se citeste n. Calculati n! (factorial).",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza factorialul lui n.",
    constraints: "0 <= n <= 100",
    solver: ([n]) => `${factorial(n).toString()}\n`,
  },
  {
    slug: "suma-progresie-aritmetica",
    title: "Suma unei progresii aritmetice",
    statement: "Se citesc a, d, n. Calculati suma termenilor: a + (a+d) + ... + (a+n*d).",
    input_format: "Se citesc trei numere intregi: a d n.",
    output_format: "Se afiseaza suma (n+1 termeni).",
    constraints: "|a|, |d| <= 10^9, 0 <= n <= 10^9",
    solver: ([a, d, n]) => {
      a = toBigInt(a);
      d = toBigInt(d);
      n = toBigInt(n);
      const cnt = n + 1n;
      const ans = (cnt * (2n * a + n * d)) / 2n;
      return `${ans.toString()}\n`;
    },
  },
  {
    slug: "suma-progresie-geometrica",
    title: "Suma unei progresii geometrice",
    statement: "Se citesc a, r, n. Calculati suma: a + a*r + a*r^2 + ... + a*r^n.",
    input_format: "Se citesc trei numere intregi: a r n.",
    output_format: "Se afiseaza suma (n+1 termeni).",
    constraints: "|a|, |r| <= 20, 0 <= n <= 30",
    solver: ([a, r, n]) => {
      a = toBigInt(a);
      r = toBigInt(r);
      n = Number(n);
      let term = 1n;
      let ans = 0n;
      for (let i = 0; i <= n; i += 1) {
        ans += a * term;
        term *= r;
      }
      return `${ans.toString()}\n`;
    },
  },
  {
    slug: "produs-1-la-n",
    title: "Produsul numerelor de la 1 la n",
    statement: "Se citeste n. Afisati produsul numerelor de la 1 la n.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza produsul 1*2*...*n.",
    constraints: "0 <= n <= 100",
    solver: ([n]) => `${factorial(n).toString()}\n`,
  },
  {
    slug: "suma-numerelor-pare-1-la-n",
    title: "Suma numerelor pare de la 1 la n",
    statement: "Se citeste n. Afisati suma tuturor numerelor pare din [1, n].",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza suma numerelor pare.",
    constraints: "0 <= n <= 10^9",
    solver: ([n]) => {
      const k = toBigInt(n) / 2n;
      return `${(k * (k + 1n)).toString()}\n`;
    },
  },
  {
    slug: "suma-numerelor-impare-1-la-n",
    title: "Suma numerelor impare de la 1 la n",
    statement: "Se citeste n. Afisati suma tuturor numerelor impare din [1, n].",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza suma numerelor impare.",
    constraints: "0 <= n <= 10^9",
    solver: ([n]) => {
      const k = (toBigInt(n) + 1n) / 2n;
      return `${(k * k).toString()}\n`;
    },
  },
  {
    slug: "numar-multipli-k-1-la-n",
    title: "Numarul multiplilor lui k in [1,n]",
    statement: "Se citesc n si k. Determinati cate numere din [1,n] sunt divizibile cu k.",
    input_format: "Se citesc n k.",
    output_format: "Se afiseaza numarul cerut.",
    constraints: "1 <= n <= 10^9, 1 <= k <= 10^9",
    solver: ([n, k]) => `${(toBigInt(n) / toBigInt(k)).toString()}\n`,
  },
  {
    slug: "suma-multipli-k-1-la-n",
    title: "Suma multiplilor lui k in [1,n]",
    statement: "Se citesc n si k. Determinati suma numerelor din [1,n] divizibile cu k.",
    input_format: "Se citesc n k.",
    output_format: "Se afiseaza suma ceruta.",
    constraints: "1 <= n <= 10^9, 1 <= k <= 10^9",
    solver: ([n, k]) => {
      const cnt = toBigInt(n) / toBigInt(k);
      const ans = toBigInt(k) * (cnt * (cnt + 1n) / 2n);
      return `${ans.toString()}\n`;
    },
  },
  {
    slug: "numar-perechi-i-j-cu-i-mai-mic-j",
    title: "Numarul perechilor (i,j) cu 1<=i<j<=n",
    statement: "Se citeste n. Determinati cate perechi (i,j) satisfac 1<=i<j<=n.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza numarul perechilor.",
    constraints: "0 <= n <= 10^9",
    solver: ([n]) => {
      n = toBigInt(n);
      return `${(n * (n - 1n) / 2n).toString()}\n`;
    },
  },
  {
    slug: "numar-perechi-i-j-cu-i-mai-mic-sau-egal-j",
    title: "Numarul perechilor (i,j) cu 1<=i<=j<=n",
    statement: "Se citeste n. Determinati cate perechi (i,j) satisfac 1<=i<=j<=n.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza numarul perechilor.",
    constraints: "0 <= n <= 10^9",
    solver: ([n]) => {
      n = toBigInt(n);
      return `${(n * (n + 1n) / 2n).toString()}\n`;
    },
  },
  {
    slug: "numar-submultimi-ale-unei-multimi-cu-n-elemente",
    title: "Numarul submultimilor unei multimi cu n elemente",
    statement: "Se citeste n. Determinati cate submultimi are o multime cu n elemente.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza 2^n.",
    constraints: "0 <= n <= 60",
    solver: ([n]) => `${powBigInt(2, n).toString()}\n`,
  },
  {
    slug: "suma-factorialelor-1-la-n",
    title: "Suma factorialelor de la 1 la n",
    statement: "Se citeste n. Calculati 1! + 2! + ... + n!.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza suma factorialelor.",
    constraints: "0 <= n <= 30",
    solver: ([n]) => {
      n = Number(n);
      let fact = 1n;
      let ans = 0n;
      for (let i = 1n; i <= BigInt(n); i += 1n) {
        fact *= i;
        ans += fact;
      }
      return `${ans.toString()}\n`;
    },
  },
  {
    slug: "produs-numerelor-impare-1-la-n",
    title: "Produsul numerelor impare din [1,n]",
    statement: "Se citeste n. Determinati produsul tuturor numerelor impare din [1,n].",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza produsul cerut.",
    constraints: "0 <= n <= 100",
    solver: ([n]) => {
      n = Number(n);
      let ans = 1n;
      for (let i = 1; i <= n; i += 2) ans *= BigInt(i);
      return `${ans.toString()}\n`;
    },
  },
  {
    slug: "suma-primelor-n-numere-naturale-pare",
    title: "Suma primelor n numere pare",
    statement: "Se citeste n. Determinati suma primelor n numere pare pozitive.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza suma 2 + 4 + ... + 2n.",
    constraints: "0 <= n <= 10^9",
    solver: ([n]) => {
      n = toBigInt(n);
      return `${(n * (n + 1n)).toString()}\n`;
    },
  },
  {
    slug: "suma-primelor-n-numere-impare",
    title: "Suma primelor n numere impare",
    statement: "Se citeste n. Determinati suma primelor n numere impare pozitive.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza suma 1 + 3 + ... + (2n-1).",
    constraints: "0 <= n <= 10^9",
    solver: ([n]) => {
      n = toBigInt(n);
      return `${(n * n).toString()}\n`;
    },
  },
  {
    slug: "numar-subsecvente-continue-in-vector",
    title: "Numarul subsecventelor continue dintr-un vector de n elemente",
    statement: "Se citeste n. Determinati cate subsecvente continue are un vector cu n elemente.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza numarul total de subsecvente continue.",
    constraints: "0 <= n <= 10^9",
    solver: ([n]) => {
      n = toBigInt(n);
      return `${(n * (n + 1n) / 2n).toString()}\n`;
    },
  },
];

const CASES = {
  "suma-1-la-n": [[0], [1], [5], [10], [100]],
  "suma-patratelor-1-la-n": [[0], [1], [3], [10], [100]],
  "suma-cuburilor-1-la-n": [[0], [1], [3], [10], [100]],
  "suma-i-inmultit-cu-i-plus-1": [[0], [1], [3], [10], [100]],
  "factorial-n": [[0], [1], [5], [10], [20]],
  "suma-progresie-aritmetica": [[1, 1, 3], [5, 2, 0], [10, -1, 5], [3, 3, 4], [-2, 5, 6]],
  "suma-progresie-geometrica": [[1, 2, 3], [5, 1, 10], [3, 0, 7], [2, -1, 5], [2, 3, 6]],
  "produs-1-la-n": [[0], [1], [5], [10], [20]],
  "suma-numerelor-pare-1-la-n": [[0], [1], [2], [10], [101]],
  "suma-numerelor-impare-1-la-n": [[0], [1], [2], [10], [101]],
  "numar-multipli-k-1-la-n": [[10, 2], [10, 3], [1, 1], [100, 25], [99, 100]],
  "suma-multipli-k-1-la-n": [[10, 2], [10, 3], [1, 1], [100, 25], [99, 100]],
  "numar-perechi-i-j-cu-i-mai-mic-j": [[0], [1], [2], [5], [100]],
  "numar-perechi-i-j-cu-i-mai-mic-sau-egal-j": [[0], [1], [2], [5], [100]],
  "numar-submultimi-ale-unei-multimi-cu-n-elemente": [[0], [1], [2], [10], [60]],
  "suma-factorialelor-1-la-n": [[0], [1], [3], [5], [10]],
  "produs-numerelor-impare-1-la-n": [[0], [1], [5], [10], [15]],
  "suma-primelor-n-numere-naturale-pare": [[0], [1], [2], [10], [100]],
  "suma-primelor-n-numere-impare": [[0], [1], [2], [10], [100]],
  "numar-subsecvente-continue-in-vector": [[0], [1], [2], [10], [100]],
};

function materializeProblem(problem) {
  const cases = CASES[problem.slug];
  if (!cases || cases.length < 5) throw new Error(`Missing tests for ${problem.slug}`);
  const tests = cases.map((params, idx) => ({
    input: inputLine(params),
    expected: problem.solver(params),
    isSample: idx === 0,
  }));
  return {
    ...problem,
    tags: ["clasa9", "sume-produse-numarari"],
    official_solution: buildCppTemplate(problem.title),
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
    console.log(`Seed complete. Upserted ${allProblems.length} sume-produse-numarari problems.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to seed sume-produse-numarari problems:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
