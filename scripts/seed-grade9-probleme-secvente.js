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
  curriculum_subcategory_id: "probleme-secvente",
  solution_mode: "full",
  checker_mode: "exact",
  source: "Sursa interna",
};

const YES = "DA\n";
const NO = "NU\n";

function buildCppTemplate(title) {
  return [
    "#include <bits/stdc++.h>",
    "using namespace std;",
    "",
    "int main() {",
    `  // ${title}`,
    "  // Solutie cu parcurgere, two pointers, prefixe sau deque in functie de cerinta.",
    "  return 0;",
    "}",
  ].join("\n");
}

function inputLine(params) {
  return `${params.join(" ")}\n`;
}

function parse(params) {
  const n = Number(params[0]);
  const arr = params.slice(1, 1 + n).map(Number);
  const rest = params.slice(1 + n).map(Number);
  return { n, arr, rest };
}

function allSubs(a) {
  const out = [];
  for (let l = 0; l < a.length; l += 1) {
    let s = 0;
    let p = 1;
    let mx = -Infinity;
    let mn = Infinity;
    const freq = new Map();
    for (let r = l; r < a.length; r += 1) {
      s += a[r];
      p *= a[r];
      mx = Math.max(mx, a[r]);
      mn = Math.min(mn, a[r]);
      freq.set(a[r], (freq.get(a[r]) ?? 0) + 1);
      out.push({ l, r, len: r - l + 1, sum: s, prod: p, max: mx, min: mn, freq: new Map(freq) });
    }
  }
  return out;
}

function longestBy(a, predicate) {
  let best = 0;
  let cur = 0;
  for (const x of a) {
    if (predicate(x)) {
      cur += 1;
      best = Math.max(best, cur);
    } else cur = 0;
  }
  return best;
}

function longestConsecutive(a, cmp) {
  if (!a.length) return 0;
  let best = 1;
  let cur = 1;
  for (let i = 1; i < a.length; i += 1) {
    if (cmp(a[i - 1], a[i])) cur += 1;
    else cur = 1;
    best = Math.max(best, cur);
  }
  return best;
}

function isPal(a, l, r) {
  while (l < r) {
    if (a[l] !== a[r]) return false;
    l += 1;
    r -= 1;
  }
  return true;
}

const problems = [
  { slug: "secv-lungime-max-egale-consecutive", title: "Lungimea maxima de egale consecutive", statement: "Lungimea celei mai lungi secvente de elemente egale consecutive.", solve: (p) => { const { arr } = parse(p); if (!arr.length) return "0\n"; let best = 1; let cur = 1; for (let i = 1; i < arr.length; i += 1) { cur = arr[i] === arr[i - 1] ? cur + 1 : 1; best = Math.max(best, cur); } return `${best}\n`; } },
  { slug: "secv-numar-secvente-egale", title: "Numarul de secvente egale", statement: "Numarul de secvente (blocuri) de elemente egale consecutive.", solve: (p) => { const { arr } = parse(p); if (!arr.length) return "0\n"; let c = 1; for (let i = 1; i < arr.length; i += 1) if (arr[i] !== arr[i - 1]) c += 1; return `${c}\n`; } },
  { slug: "secv-capete-pentru-blocuri-egale", title: "Capete pentru fiecare secventa egala", statement: "Afisati capetele (l,r) pentru fiecare secventa de elemente egale consecutive.", solve: (p) => { const { arr } = parse(p); if (!arr.length) return "\n"; const out = []; let l = 1; for (let i = 2; i <= arr.length; i += 1) { if (i === arr.length || arr[i - 1] !== arr[i]) { out.push(`${l} ${i}`); l = i + 1; } } return `${out.join("\n")}\n`; } },
  { slug: "secv-valoare-cea-mai-lunga-secventa", title: "Valoarea celei mai lungi secvente", statement: "Determinati valoarea care formeaza cea mai lunga secventa de egale consecutive.", solve: (p) => { const { arr } = parse(p); let bestLen = 0; let bestVal = 0; let cur = 0; let last = null; for (const x of arr) { if (x === last) cur += 1; else { cur = 1; last = x; } if (cur > bestLen) { bestLen = cur; bestVal = x; } } return `${bestVal}\n`; } },
  { slug: "secv-lungime-max-pare", title: "Lungimea celei mai lungi secvente de pare", statement: "Lungimea celei mai lungi secvente consecutive de numere pare.", solve: (p) => `${longestBy(parse(p).arr, (x) => x % 2 === 0)}\n` },
  { slug: "secv-lungime-max-impare", title: "Lungimea celei mai lungi secvente de impare", statement: "Lungimea celei mai lungi secvente consecutive de numere impare.", solve: (p) => `${longestBy(parse(p).arr, (x) => Math.abs(x) % 2 === 1)}\n` },
  { slug: "secv-numar-secvente-pozitive", title: "Numarul de secvente pozitive", statement: "Numarul de secvente consecutive de numere pozitive.", solve: (p) => { const { arr } = parse(p); let c = 0; let inRun = false; for (const x of arr) { if (x > 0) { if (!inRun) c += 1; inRun = true; } else inRun = false; } return `${c}\n`; } },
  { slug: "secv-numar-secvente-negative", title: "Numarul de secvente negative", statement: "Numarul de secvente consecutive de numere negative.", solve: (p) => { const { arr } = parse(p); let c = 0; let inRun = false; for (const x of arr) { if (x < 0) { if (!inRun) c += 1; inRun = true; } else inRun = false; } return `${c}\n`; } },
  { slug: "secv-lungime-max-strict-crescatoare-consecutiva", title: "Lungime max strict crescatoare", statement: "Lungimea celei mai lungi secvente strict crescatoare consecutive.", solve: (p) => `${longestConsecutive(parse(p).arr, (a, b) => b > a)}\n` },
  { slug: "secv-lungime-max-strict-descrescatoare-consecutiva", title: "Lungime max strict descrescatoare", statement: "Lungimea celei mai lungi secvente strict descrescatoare consecutive.", solve: (p) => `${longestConsecutive(parse(p).arr, (a, b) => b < a)}\n` },

  { slug: "secv-lungime-max-toate-elem-leq-k", title: "Lungime max cu elemente <= k", statement: "Lungimea celei mai lungi secvente cu toate elementele <= k.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${longestBy(arr, (x) => x <= k)}\n`; } },
  { slug: "secv-lungime-max-toate-elem-geq-k", title: "Lungime max cu elemente >= k", statement: "Lungimea celei mai lungi secvente cu toate elementele >= k.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${longestBy(arr, (x) => x >= k)}\n`; } },
  { slug: "secv-lungime-max-distincte", title: "Lungime max toate elementele distincte", statement: "Lungimea celei mai lungi secvente cu toate elementele distincte.", solve: (p) => { const { arr } = parse(p); let best = 0; for (let l = 0; l < arr.length; l += 1) { const s = new Set(); for (let r = l; r < arr.length; r += 1) { if (s.has(arr[r])) break; s.add(arr[r]); best = Math.max(best, r - l + 1); } } return `${best}\n`; } },
  { slug: "secv-lungime-max-fara-repetate", title: "Lungime max fara repetate", statement: "Lungimea celei mai lungi secvente fara elemente repetate.", solve: (p) => problems[12].solve(p) },
  { slug: "secv-numar-subsecvente-valori-in-interval-a-b", title: "Numar subsecvente cu valori in [a,b]", statement: "Numarul de subsecvente care contin doar valori din [a,b].", solve: (p) => { const { arr, rest } = parse(p); const [a, b] = rest; const subs = allSubs(arr); return `${subs.filter((s) => s.min >= a && s.max <= b).length}\n`; } },
  { slug: "secv-lungime-max-suma-leq-k", title: "Lungime max cu suma <= k", statement: "Lungimea celei mai lungi secvente cu suma <= k.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${Math.max(0, ...allSubs(arr).filter((s) => s.sum <= k).map((s) => s.len))}\n`; } },
  { slug: "secv-lungime-max-suma-eq-k", title: "Lungime max cu suma = k", statement: "Lungimea celei mai lungi secvente cu suma exact k.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${Math.max(0, ...allSubs(arr).filter((s) => s.sum === k).map((s) => s.len))}\n`; } },
  { slug: "secv-numar-subsecvente-suma-eq-k", title: "Numar subsecvente cu suma exact k", statement: "Numarul de secvente cu suma exact k.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${allSubs(arr).filter((s) => s.sum === k).length}\n`; } },
  { slug: "secv-lungime-max-produs-leq-k", title: "Lungime max cu produs <= k", statement: "Lungimea celei mai lungi secvente cu produs <= k.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${Math.max(0, ...allSubs(arr).filter((s) => s.prod <= k).map((s) => s.len))}\n`; } },
  { slug: "secv-numar-subsecvente-produs-leq-k", title: "Numar subsecvente cu produs <= k", statement: "Numarul de secvente cu produs <= k.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${allSubs(arr).filter((s) => s.prod <= k).length}\n`; } },

  { slug: "secv-lungime-max-cel-mult-k-distincte", title: "Lungime max cu cel mult k distincte", statement: "Lungimea celei mai lungi secvente cu cel mult k valori distincte.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${Math.max(0, ...allSubs(arr).filter((s) => s.freq.size <= k).map((s) => s.len))}\n`; } },
  { slug: "secv-lungime-max-exact-k-distincte", title: "Lungime max cu exact k distincte", statement: "Lungimea celei mai lungi secvente cu exact k valori distincte.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${Math.max(0, ...allSubs(arr).filter((s) => s.freq.size === k).map((s) => s.len))}\n`; } },
  { slug: "secv-numar-subsecvente-cel-mult-k-distincte", title: "Numar subsecvente cu cel mult k distincte", statement: "Numarul de secvente cu cel mult k valori distincte.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${allSubs(arr).filter((s) => s.freq.size <= k).length}\n`; } },
  { slug: "secv-numar-subsecvente-exact-k-distincte", title: "Numar subsecvente cu exact k distincte", statement: "Numarul de secvente cu exact k valori distincte.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${allSubs(arr).filter((s) => s.freq.size === k).length}\n`; } },
  { slug: "secv-lungime-max-cu-diferenta-max-min-leq-k", title: "Lungime max cu max-min <= k", statement: "Lungimea celei mai lungi secvente cu max-min <= k.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${Math.max(0, ...allSubs(arr).filter((s) => s.max - s.min <= k).map((s) => s.len))}\n`; } },
  { slug: "secv-numar-subsecvente-cu-diferenta-max-min-leq-k", title: "Numar subsecvente cu max-min <= k", statement: "Numarul de secvente cu max-min <= k.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${allSubs(arr).filter((s) => s.max - s.min <= k).length}\n`; } },
  { slug: "secv-lungime-max-cu-cel-mult-k-impare", title: "Lungime max cu cel mult k impare", statement: "Lungimea celei mai lungi secvente cu cel mult k elemente impare.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${Math.max(0, ...allSubs(arr).filter((s) => Array.from(s.freq.entries()).reduce((cnt, [v, f]) => cnt + (Math.abs(v) % 2 === 1 ? f : 0), 0) <= k).map((s) => s.len))}\n`; } },
  { slug: "secv-lungime-max-cu-cel-mult-k-zerouri", title: "Lungime max cu cel mult k zerouri", statement: "Lungimea celei mai lungi secvente cu cel mult k zerouri.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${Math.max(0, ...allSubs(arr).filter((s) => (s.freq.get(0) ?? 0) <= k).map((s) => s.len))}\n`; } },
  { slug: "secv-numar-subsecvente-cu-cel-mult-k-zerouri", title: "Numar subsecvente cu cel mult k zerouri", statement: "Numarul de secvente cu cel mult k zerouri.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${allSubs(arr).filter((s) => (s.freq.get(0) ?? 0) <= k).length}\n`; } },
  { slug: "secv-lungime-max-suma-leq-k-two-pointers", title: "Lungime max suma <= k (clasic)", statement: "Lungimea celei mai lungi secvente cu suma <= k.", solve: (p) => problems[15].solve(p) },

  { slug: "secv-maxim-pe-ferestre-lungime-k", title: "Maxim pe fiecare secventa de lungime k", statement: "Pentru fiecare secventa de lungime k, determinati maximul.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; const out = []; for (let i = 0; i + k <= arr.length; i += 1) out.push(Math.max(...arr.slice(i, i + k))); return `${out.join(" ")}\n`; } },
  { slug: "secv-minim-pe-ferestre-lungime-k", title: "Minim pe fiecare secventa de lungime k", statement: "Pentru fiecare secventa de lungime k, determinati minimul.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; const out = []; for (let i = 0; i + k <= arr.length; i += 1) out.push(Math.min(...arr.slice(i, i + k))); return `${out.join(" ")}\n`; } },
  { slug: "secv-numar-subsecvente-cu-maxim-leq-k", title: "Numar subsecvente cu maxim <= k", statement: "Numarul de secvente unde maximul este <= k.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${allSubs(arr).filter((s) => s.max <= k).length}\n`; } },
  { slug: "secv-lungime-max-cu-minim-geq-k", title: "Lungime max cu minim >= k", statement: "Lungimea celei mai lungi secvente unde minimul >= k.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${Math.max(0, ...allSubs(arr).filter((s) => s.min >= k).map((s) => s.len))}\n`; } },
  { slug: "secv-numar-subsecvente-maxim-apare-exact-de-doua-ori", title: "Numar subsecvente cu maxim de exact 2 ori", statement: "Numarul de secvente in care maximul apare exact de 2 ori.", solve: (p) => { const { arr } = parse(p); return `${allSubs(arr).filter((s) => (s.freq.get(s.max) ?? 0) === 2).length}\n`; } },
  { slug: "secv-lungime-max-cu-minim-unic", title: "Lungime max cu minim unic", statement: "Lungimea celei mai lungi secvente in care minimul este unic.", solve: (p) => { const { arr } = parse(p); return `${Math.max(0, ...allSubs(arr).filter((s) => (s.freq.get(s.min) ?? 0) === 1).map((s) => s.len))}\n`; } },

  { slug: "secv-lungime-max-palindromica-consecutiva", title: "Lungime max secventa palindromica", statement: "Lungimea celei mai lungi secvente palindromice consecutive.", solve: (p) => { const { arr } = parse(p); let best = 0; for (let l = 0; l < arr.length; l += 1) for (let r = l; r < arr.length; r += 1) if (isPal(arr, l, r)) best = Math.max(best, r - l + 1); return `${best}\n`; } },
  { slug: "secv-numar-secvente-palindromice", title: "Numar secvente palindromice", statement: "Numarul de secvente palindromice consecutive.", solve: (p) => { const { arr } = parse(p); let cnt = 0; for (let l = 0; l < arr.length; l += 1) for (let r = l; r < arr.length; r += 1) if (isPal(arr, l, r)) cnt += 1; return `${cnt}\n`; } },
  { slug: "secv-lungime-max-alternanta-semn", title: "Lungime max alternanta de semn", statement: "Lungimea celei mai lungi secvente alternante (+,-,+,-), fara 0.", solve: (p) => { const { arr } = parse(p); if (!arr.length) return "0\n"; let best = 0; let cur = 0; for (let i = 0; i < arr.length; i += 1) { if (arr[i] === 0) { cur = 0; continue; } if (i > 0 && arr[i - 1] !== 0 && ((arr[i] > 0) !== (arr[i - 1] > 0))) cur += 1; else cur = 1; best = Math.max(best, cur); } return `${best}\n`; } },
  { slug: "secv-lungime-max-zigzag", title: "Lungime max zigzag", statement: "Lungimea celei mai lungi secvente zigzag (> < > < sau < > < >).", solve: (p) => { const { arr } = parse(p); if (!arr.length) return "0\n"; let best = 1; let up = 1; let down = 1; for (let i = 1; i < arr.length; i += 1) { if (arr[i] > arr[i - 1]) { up = down + 1; } else if (arr[i] < arr[i - 1]) { down = up + 1; } best = Math.max(best, up, down); } return `${best}\n`; } },
];

const BASE = [
  [6, 1, 2, 2, 3, 0, 4],
  [6, -1, -2, 3, 4, -5, 6],
  [7, 1, 1, 1, 2, 2, 3, 3],
  [5, 5, 4, 3, 2, 1],
  [8, 1, 0, 1, 0, 1, 0, 1, 0],
];
const CASES = {};
for (const pr of problems) CASES[pr.slug] = BASE.map((t) => [...t]);

for (const slug of [
  "secv-lungime-max-toate-elem-leq-k",
  "secv-lungime-max-toate-elem-geq-k",
  "secv-lungime-max-suma-leq-k",
  "secv-lungime-max-suma-eq-k",
  "secv-numar-subsecvente-suma-eq-k",
  "secv-lungime-max-produs-leq-k",
  "secv-numar-subsecvente-produs-leq-k",
  "secv-lungime-max-cel-mult-k-distincte",
  "secv-lungime-max-exact-k-distincte",
  "secv-numar-subsecvente-cel-mult-k-distincte",
  "secv-numar-subsecvente-exact-k-distincte",
  "secv-lungime-max-cu-diferenta-max-min-leq-k",
  "secv-numar-subsecvente-cu-diferenta-max-min-leq-k",
  "secv-lungime-max-cu-cel-mult-k-impare",
  "secv-lungime-max-cu-cel-mult-k-zerouri",
  "secv-numar-subsecvente-cu-cel-mult-k-zerouri",
  "secv-lungime-max-suma-leq-k-two-pointers",
  "secv-maxim-pe-ferestre-lungime-k",
  "secv-minim-pe-ferestre-lungime-k",
  "secv-numar-subsecvente-cu-maxim-leq-k",
  "secv-lungime-max-cu-minim-geq-k",
]) {
  CASES[slug] = [
    [6, 1, 2, 2, 3, 0, 4, 3],
    [6, -1, -2, 3, 4, -5, 6, 2],
    [7, 1, 1, 1, 2, 2, 3, 3, 4],
    [5, 5, 4, 3, 2, 1, 5],
    [8, 1, 0, 1, 0, 1, 0, 1, 0, 2],
  ];
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
    input_format: "Se citeste n, apoi n numere. Unele probleme mai citesc un parametru k la final.",
    output_format: "Se afiseaza rezultatul numeric sau lista de valori ceruta.",
    constraints: "1 <= n <= 2*10^5",
    official_solution: buildCppTemplate(problem.title),
    tags: ["clasa9", "probleme-secvente"],
    tests,
  };
}

const allProblems = problems.map(materialize);

async function upsertProblem(client, p) {
  const ex = await client.query(`SELECT id FROM problems WHERE slug = $1 LIMIT 1`, [p.slug]);
  let id = ex.rows[0]?.id;
  if (id) {
    await client.query(
      `UPDATE problems SET title=$2, statement=$3, official_solution=$4, input_format=$5, output_format=$6, constraints=$7,
       difficulty=$8, tags=$9, source=$10, is_published=true, time_limit_ms=$11, memory_limit_mb=$12, input_source=$13, output_target=$14,
       curriculum_level=$15, curriculum_chapter_id=$16, curriculum_subcategory_id=$17, solution_mode=$18, checker_mode=$19, updated_at=NOW()
       WHERE id=$1`,
      [
        id, p.title, p.statement, p.official_solution, p.input_format, p.output_format, p.constraints,
        BASE_META.difficulty, p.tags, BASE_META.source, BASE_META.time_limit_ms, BASE_META.memory_limit_mb, BASE_META.input_source, BASE_META.output_target,
        BASE_META.curriculum_level, BASE_META.curriculum_chapter_id, BASE_META.curriculum_subcategory_id, BASE_META.solution_mode, BASE_META.checker_mode,
      ],
    );
    await client.query(`DELETE FROM test_cases WHERE problem_id=$1`, [id]);
  } else {
    const ins = await client.query(
      `INSERT INTO problems (title, slug, statement, official_solution, input_format, output_format, constraints, difficulty, tags, source, is_published,
       time_limit_ms, memory_limit_mb, input_source, output_target, curriculum_level, curriculum_chapter_id, curriculum_subcategory_id, solution_mode, checker_mode)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING id`,
      [
        p.title, p.slug, p.statement, p.official_solution, p.input_format, p.output_format, p.constraints, BASE_META.difficulty, p.tags, BASE_META.source,
        BASE_META.time_limit_ms, BASE_META.memory_limit_mb, BASE_META.input_source, BASE_META.output_target, BASE_META.curriculum_level, BASE_META.curriculum_chapter_id,
        BASE_META.curriculum_subcategory_id, BASE_META.solution_mode, BASE_META.checker_mode,
      ],
    );
    id = ins.rows[0].id;
  }
  for (let i = 0; i < p.tests.length; i += 1) {
    const t = p.tests[i];
    await client.query(
      `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, t.input, t.expected, Boolean(t.isSample), 20, i + 1],
    );
  }
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const p of allProblems) await upsertProblem(client, p);
    await client.query("COMMIT");
    console.log(`Seed complete. Upserted ${allProblems.length} probleme-secvente problems.`);
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
