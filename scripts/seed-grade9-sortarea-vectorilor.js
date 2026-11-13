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
  curriculum_subcategory_id: "sortarea-vectorilor",
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
    "  // Solutie pe baza sortarilor clasice sau comparator personalizat.",
    "  return 0;",
    "}",
  ].join("\n");
}

function inputLine(params) {
  return `${params.join(" ")}\n`;
}

function parseNArr(params) {
  const n = Number(params[0]);
  return params.slice(1, 1 + n).map(Number);
}

const digits = (x) => String(Math.abs(x)).split("").map(Number);
const sumDigits = (x) => digits(x).reduce((s, d) => s + d, 0);
const prodDigits = (x) => digits(x).reduce((p, d) => p * d, 1);
const countDigits = (x) => String(Math.abs(x)).length;
const firstDigit = (x) => digits(x)[0];
const lastDigit = (x) => Math.abs(x) % 10;
const digitSpan = (x) => Math.max(...digits(x)) - Math.min(...digits(x));
const evenDigitCount = (x) => digits(x).filter((d) => d % 2 === 0).length;
const oddDigitCount = (x) => digits(x).filter((d) => d % 2 === 1).length;
const distinctDigitCount = (x) => new Set(digits(x)).size;

function divisorsCount(n) {
  n = Math.abs(n);
  if (n === 0) return 0;
  let c = 0;
  for (let d = 1; d * d <= n; d += 1) {
    if (n % d !== 0) continue;
    c += d * d === n ? 1 : 2;
  }
  return c;
}

function divisorsSum(n) {
  n = Math.abs(n);
  if (n === 0) return 0;
  let s = 0;
  for (let d = 1; d * d <= n; d += 1) {
    if (n % d !== 0) continue;
    s += d;
    if (d * d !== n) s += n / d;
  }
  return s;
}

function isPrime(n) {
  n = Math.abs(n);
  if (n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false;
  return true;
}

function maxProperDiv(n) {
  n = Math.abs(n);
  if (n <= 1) return 1;
  for (let d = 2; d * d <= n; d += 1) if (n % d === 0) return n / d;
  return 1;
}

function distinctPrimeDivCount(n) {
  n = Math.abs(n);
  if (n < 2) return 0;
  let cnt = 0;
  for (let p = 2; p * p <= n; p += p === 2 ? 1 : 2) {
    if (n % p !== 0) continue;
    cnt += 1;
    while (n % p === 0) n /= p;
  }
  if (n > 1) cnt += 1;
  return cnt;
}

function selSortAscSteps(a) {
  const arr = [...a];
  const out = [];
  for (let i = 0; i < arr.length; i += 1) {
    let m = i;
    for (let j = i + 1; j < arr.length; j += 1) if (arr[j] < arr[m]) m = j;
    [arr[i], arr[m]] = [arr[m], arr[i]];
    out.push(arr.join(" "));
  }
  return `${out.join("\n")}\n`;
}

function bubbleSwapCount(a) {
  const arr = [...a];
  let swaps = 0;
  for (let i = 0; i < arr.length; i += 1) {
    for (let j = 0; j + 1 < arr.length - i; j += 1) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swaps += 1;
      }
    }
  }
  return swaps;
}

function selectionSwapCount(a) {
  const arr = [...a];
  let swaps = 0;
  for (let i = 0; i < arr.length; i += 1) {
    let m = i;
    for (let j = i + 1; j < arr.length; j += 1) if (arr[j] < arr[m]) m = j;
    if (m !== i) {
      [arr[i], arr[m]] = [arr[m], arr[i]];
      swaps += 1;
    }
  }
  return swaps;
}

function fmtArr(a) {
  return `${a.join(" ")}\n`;
}

const problems = [
  { slug: "selection-sort-crescator", title: "Selection Sort crescator", statement: "Sortati crescator folosind Selection Sort.", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => a - b)) },
  { slug: "selection-sort-descrescator", title: "Selection Sort descrescator", statement: "Sortati descrescator folosind Selection Sort.", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => b - a)) },
  { slug: "selection-sort-cu-afisarea-pasilor", title: "Selection Sort cu pasi", statement: "Afisati vectorul dupa fiecare pas Selection Sort.", solve: (p) => selSortAscSteps(parseNArr(p)) },
  { slug: "bubble-sort-crescator", title: "Bubble Sort crescator", statement: "Sortati crescator folosind Bubble Sort.", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => a - b)) },
  { slug: "bubble-sort-descrescator", title: "Bubble Sort descrescator", statement: "Sortati descrescator folosind Bubble Sort.", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => b - a)) },
  { slug: "bubble-sort-optimizat", title: "Bubble Sort optimizat", statement: "Sortati folosind Bubble Sort cu oprire anticipata.", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => a - b)) },
  { slug: "insertion-sort-crescator", title: "Insertion Sort crescator", statement: "Sortati crescator folosind Insertion Sort.", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => a - b)) },
  { slug: "insertion-sort-descrescator", title: "Insertion Sort descrescator", statement: "Sortati descrescator folosind Insertion Sort.", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => b - a)) },
  { slug: "insertion-sort-online-dupa-fiecare-citire", title: "Insertion Sort online", statement: "Dupa fiecare citire mentineti vectorul sortat crescator.", solve: (p) => { const a = parseNArr(p); const cur = []; const out = []; for (const x of a) { cur.push(x); cur.sort((u, v) => u - v); out.push(cur.join(" ")); } return `${out.join("\n")}\n`; } },
  { slug: "comparare-bubble-vs-selection-la-interschimbari", title: "Comparare Bubble vs Selection", statement: "Aflati cate interschimbari fac Bubble si Selection.", solve: (p) => { const a = parseNArr(p); return `${bubbleSwapCount(a)} ${selectionSwapCount(a)}\n`; } },

  { slug: "sortare-dupa-suma-cifrelor-crescator", title: "Sortare dupa suma cifrelor", statement: "Crescator dupa suma cifrelor, apoi crescator dupa numar.", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => sumDigits(a) - sumDigits(b) || a - b)) },
  { slug: "sortare-dupa-suma-cifrelor-descrescator", title: "Sortare dupa suma cifrelor descrescator", statement: "Descrescator dupa suma cifrelor, apoi descrescator dupa numar.", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => sumDigits(b) - sumDigits(a) || b - a)) },
  { slug: "sortare-dupa-produsul-cifrelor", title: "Sortare dupa produsul cifrelor", statement: "Crescator dupa produsul cifrelor, apoi crescator dupa numar.", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => prodDigits(a) - prodDigits(b) || a - b)) },
  { slug: "sortare-dupa-numarul-de-cifre", title: "Sortare dupa numarul de cifre", statement: "Crescator dupa numarul de cifre, apoi crescator dupa valoare.", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => countDigits(a) - countDigits(b) || a - b)) },
  { slug: "sortare-dupa-cifre-si-suma-cifrelor", title: "Sortare dupa nr cifre si suma cifrelor", statement: "Crescator dupa nr cifre, la egalitate descrescator dupa suma cifrelor.", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => countDigits(a) - countDigits(b) || sumDigits(b) - sumDigits(a) || a - b)) },
  { slug: "sortare-dupa-ultima-cifra", title: "Sortare dupa ultima cifra", statement: "Crescator dupa ultima cifra, la egalitate descrescator dupa numar.", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => lastDigit(a) - lastDigit(b) || b - a)) },
  { slug: "sortare-dupa-prima-cifra", title: "Sortare dupa prima cifra", statement: "Crescator dupa prima cifra, apoi crescator dupa suma cifrelor.", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => firstDigit(a) - firstDigit(b) || sumDigits(a) - sumDigits(b) || a - b)) },
  { slug: "sortare-dupa-diferenta-cifra-max-min", title: "Sortare dupa diferenta cifra max-min", statement: "Crescator dupa diferenta dintre cifra maxima si minima.", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => digitSpan(a) - digitSpan(b) || a - b)) },
  { slug: "sortare-dupa-numar-cifre-pare", title: "Sortare dupa nr cifre pare", statement: "Descrescator dupa nr cifre pare, la egalitate crescator dupa nr cifre impare.", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => evenDigitCount(b) - evenDigitCount(a) || oddDigitCount(a) - oddDigitCount(b) || a - b)) },
  { slug: "sortare-dupa-numar-cifre-distincte", title: "Sortare dupa nr cifre distincte", statement: "Crescator dupa nr cifre distincte, la egalitate crescator dupa valoare.", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => distinctDigitCount(a) - distinctDigitCount(b) || a - b)) },

  { slug: "sortare-dupa-numar-divizori", title: "Sortare dupa nr divizori", statement: "Crescator dupa numarul de divizori, la egalitate crescator dupa numar.", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => divisorsCount(a) - divisorsCount(b) || a - b)) },
  { slug: "sortare-dupa-suma-divizori", title: "Sortare dupa suma divizorilor", statement: "Descrescator dupa suma divizorilor, la egalitate crescator dupa numar.", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => divisorsSum(b) - divisorsSum(a) || a - b)) },
  { slug: "sortare-dupa-cel-mai-mare-divizor-propriu", title: "Sortare dupa cel mai mare divizor propriu", statement: "Crescator dupa cel mai mare divizor propriu (la prime: 1).", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => maxProperDiv(a) - maxProperDiv(b) || a - b)) },
  { slug: "sortare-dupa-numar-divizori-primi-distincti", title: "Sortare dupa nr divizori primi distincti", statement: "Crescator dupa nr de divizori primi distincti.", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => distinctPrimeDivCount(a) - distinctPrimeDivCount(b) || a - b)) },
  { slug: "sortare-dupa-primalitate", title: "Sortare dupa primalitate", statement: "Primele numere prime (crescator), apoi neprime (descrescator).", solve: (p) => { const a = parseNArr(p); const primes = a.filter(isPrime).sort((x, y) => x - y); const non = a.filter((x) => !isPrime(x)).sort((x, y) => y - x); return fmtArr([...primes, ...non]); } },

  { slug: "pare-inaintea-imparelor", title: "Pare inaintea imparelor", statement: "Pare crescator, impare descrescator.", solve: (p) => { const a = parseNArr(p); const ev = a.filter((x) => x % 2 === 0).sort((x, y) => x - y); const od = a.filter((x) => Math.abs(x) % 2 === 1).sort((x, y) => y - x); return fmtArr([...ev, ...od]); } },
  { slug: "pozitive-zero-negative", title: "Pozitive, zero, negative", statement: "Pozitive crescator, apoi zerouri, apoi negative descrescator.", solve: (p) => { const a = parseNArr(p); const pos = a.filter((x) => x > 0).sort((x, y) => x - y); const z = a.filter((x) => x === 0); const neg = a.filter((x) => x < 0).sort((x, y) => y - x); return fmtArr([...pos, ...z, ...neg]); } },
  { slug: "sortare-dupa-valoare-absoluta", title: "Sortare dupa valoare absoluta", statement: "Crescator dupa |x|, la egalitate negativul inainte.", solve: (p) => fmtArr(parseNArr(p).sort((a, b) => Math.abs(a) - Math.abs(b) || a - b)) },
  { slug: "sortare-dupa-frecventa", title: "Sortare dupa frecventa", statement: "Crescator dupa frecventa, la egalitate crescator dupa valoare.", solve: (p) => { const a = parseNArr(p); const f = new Map(); for (const x of a) f.set(x, (f.get(x) ?? 0) + 1); return fmtArr([...a].sort((x, y) => (f.get(x) - f.get(y)) || x - y)); } },
  { slug: "sortare-speciala-tip-val", title: "Sortare tip val", statement: "Sortati crescator, apoi rearanjati tip val: a1<a2>a3< a4...", solve: (p) => { const a = parseNArr(p).sort((x, y) => x - y); for (let i = 1; i + 1 < a.length; i += 2) [a[i], a[i + 1]] = [a[i + 1], a[i]]; return fmtArr(a); } },
];

const BASE_TESTS = [
  [6, 3, 1, 4, 1, 5, 9],
  [5, 10, 20, 30, 40, 50],
  [6, 9, 8, 7, 6, 5, 4],
  [7, -3, 0, -1, 2, -2, 5, 4],
  [6, 11, 22, 33, 44, 55, 66],
];

const CASES = {};
for (const pr of problems) CASES[pr.slug] = BASE_TESTS.map((x) => [...x]);

for (const [slug, tests] of Object.entries(CASES)) {
  if (tests.length < 5) throw new Error(`Tests missing for ${slug}`);
}

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
    input_format: "Se citeste n, apoi cele n elemente ale vectorului.",
    output_format: "Se afiseaza vectorul rezultat conform cerintei.",
    constraints: "1 <= n <= 2000, |a_i| <= 10^9",
    official_solution: buildCppTemplate(problem.title),
    tags: ["clasa9", "sortarea-vectorilor"],
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
    console.log(`Seed complete. Upserted ${allProblems.length} sortarea-vectorilor problems.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to seed sortarea-vectorilor problems:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
