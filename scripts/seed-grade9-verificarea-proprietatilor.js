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
  curriculum_subcategory_id: "verificarea-proprietatilor",
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
    "  // Solutie prin parcurgere si verificare de proprietati.",
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

function parseNArrRest(params) {
  const n = Number(params[0]);
  const arr = params.slice(1, 1 + n).map(Number);
  const rest = params.slice(1 + n).map(Number);
  return { arr, rest, n };
}

const strictInc = (a) => a.every((x, i) => i === 0 || x > a[i - 1]);
const strictDec = (a) => a.every((x, i) => i === 0 || x < a[i - 1]);
const nonDec = (a) => a.every((x, i) => i === 0 || x >= a[i - 1]);
const nonInc = (a) => a.every((x, i) => i === 0 || x <= a[i - 1]);

function localMaxCount(a) {
  let c = 0;
  for (let i = 1; i + 1 < a.length; i += 1) if (a[i] > a[i - 1] && a[i] > a[i + 1]) c += 1;
  return c;
}

function localMinCount(a) {
  let c = 0;
  for (let i = 1; i + 1 < a.length; i += 1) if (a[i] < a[i - 1] && a[i] < a[i + 1]) c += 1;
  return c;
}

function canBeStrictIncByRemovingOne(a) {
  if (strictInc(a)) return true;
  for (let i = 0; i < a.length; i += 1) {
    const b = a.slice(0, i).concat(a.slice(i + 1));
    if (strictInc(b)) return true;
  }
  return false;
}

function canBeConstantByChangingOne(a) {
  const freq = new Map();
  for (const x of a) freq.set(x, (freq.get(x) ?? 0) + 1);
  let best = 0;
  for (const v of freq.values()) best = Math.max(best, v);
  return a.length - best <= 1;
}

function isPeriodic(a) {
  const n = a.length;
  for (let p = 1; p < n; p += 1) {
    if (n % p !== 0) continue;
    let ok = true;
    for (let i = p; i < n; i += 1) {
      if (a[i] !== a[i % p]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

function hasRotationStrictInc(a) {
  const n = a.length;
  for (let r = 0; r < n; r += 1) {
    let ok = true;
    for (let i = 1; i < n; i += 1) {
      const prev = a[(r + i - 1) % n];
      const cur = a[(r + i) % n];
      if (cur <= prev) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

const problems = [
  { slug: "vector-strict-crescator-proprietate", title: "Vector strict crescator", statement: "Verificati daca vectorul este strict crescator.", solve: (p) => (strictInc(parseNArr(p)) ? YES : NO) },
  { slug: "vector-strict-descrescator-proprietate", title: "Vector strict descrescator", statement: "Verificati daca vectorul este strict descrescator.", solve: (p) => (strictDec(parseNArr(p)) ? YES : NO) },
  { slug: "vector-crescator-nestrict-proprietate", title: "Vector crescator ne-strict", statement: "Verificati daca vectorul este crescator (ne-strict).", solve: (p) => (nonDec(parseNArr(p)) ? YES : NO) },
  { slug: "vector-descrescator-nestrict-proprietate", title: "Vector descrescator ne-strict", statement: "Verificati daca vectorul este descrescator (ne-strict).", solve: (p) => (nonInc(parseNArr(p)) ? YES : NO) },
  { slug: "vector-constant-toate-egale", title: "Vector constant", statement: "Verificati daca toate elementele sunt egale.", solve: (p) => { const a = parseNArr(p); return a.every((x) => x === a[0]) ? YES : NO; } },
  { slug: "vector-toate-elementele-diferite", title: "Toate elementele diferite", statement: "Verificati daca toate elementele sunt diferite.", solve: (p) => { const a = parseNArr(p); return new Set(a).size === a.length ? YES : NO; } },
  { slug: "vector-doar-numere-pare", title: "Doar numere pare", statement: "Verificati daca vectorul contine doar numere pare.", solve: (p) => (parseNArr(p).every((x) => x % 2 === 0) ? YES : NO) },
  { slug: "vector-doar-numere-impare", title: "Doar numere impare", statement: "Verificati daca vectorul contine doar numere impare.", solve: (p) => (parseNArr(p).every((x) => Math.abs(x) % 2 === 1) ? YES : NO) },
  { slug: "vector-contine-cel-putin-un-negativ", title: "Contine negativ", statement: "Verificati daca vectorul contine cel putin un element negativ.", solve: (p) => (parseNArr(p).some((x) => x < 0) ? YES : NO) },
  { slug: "vector-contine-pozitive-si-negative", title: "Contine pozitiv si negativ", statement: "Verificati daca vectorul contine atat valori pozitive cat si negative.", solve: (p) => { const a = parseNArr(p); return a.some((x) => x > 0) && a.some((x) => x < 0) ? YES : NO; } },

  { slug: "vector-alternant-ca-semn", title: "Alternant ca semn", statement: "Verificati daca vectorul este alternant ca semn (+,-,+,-...).", solve: (p) => { const a = parseNArr(p); for (let i = 1; i < a.length; i += 1) if (a[i] === 0 || a[i - 1] === 0 || (a[i] > 0) === (a[i - 1] > 0)) return NO; return YES; } },
  { slug: "vector-alternant-ca-paritate", title: "Alternant ca paritate", statement: "Verificati daca vectorul este alternant ca paritate.", solve: (p) => { const a = parseNArr(p); for (let i = 1; i < a.length; i += 1) if (Math.abs(a[i] % 2) === Math.abs(a[i - 1] % 2)) return NO; return YES; } },
  { slug: "vector-diferenta-exact-k", title: "Diferenta exact k", statement: "Verificati daca fiecare element este mai mare decat precedentul cu exact k.", solve: (p) => { const { arr, rest } = parseNArrRest(p); const k = rest[0]; for (let i = 1; i < arr.length; i += 1) if (arr[i] - arr[i - 1] !== k) return NO; return YES; } },
  { slug: "vector-fiecare-multiplu-al-precedentului", title: "Multiplu al precedentului", statement: "Verificati daca fiecare element este multiplu al precedentului.", solve: (p) => { const a = parseNArr(p); for (let i = 1; i < a.length; i += 1) { if (a[i - 1] === 0 || a[i] % a[i - 1] !== 0) return NO; } return YES; } },
  { slug: "vector-progresie-aritmetica", title: "Progresie aritmetica", statement: "Verificati daca diferentele consecutive sunt constante.", solve: (p) => { const a = parseNArr(p); if (a.length <= 2) return YES; const d = a[1] - a[0]; for (let i = 2; i < a.length; i += 1) if (a[i] - a[i - 1] !== d) return NO; return YES; } },
  { slug: "vector-progresie-geometrica", title: "Progresie geometrica", statement: "Verificati daca raportul termenilor consecutivi este constant.", solve: (p) => { const a = parseNArr(p); if (a.length <= 2) return YES; for (let i = 2; i < a.length; i += 1) if (a[i] * a[i - 2] !== a[i - 1] * a[i - 1]) return NO; return YES; } },
  { slug: "vector-tip-fibonacci", title: "Tip Fibonacci", statement: "Verificati daca fiecare element este suma celor doua anterioare.", solve: (p) => { const a = parseNArr(p); for (let i = 2; i < a.length; i += 1) if (a[i] !== a[i - 1] + a[i - 2]) return NO; return YES; } },
  { slug: "vector-urmatorul-cu-cel-mult-k", title: "Crestere cu cel mult k", statement: "Verificati daca fiecare element este mai mic decat urmatorul cu cel mult k.", solve: (p) => { const { arr, rest } = parseNArrRest(p); const k = rest[0]; for (let i = 0; i + 1 < arr.length; i += 1) if (!(arr[i] < arr[i + 1] && arr[i + 1] - arr[i] <= k)) return NO; return YES; } },
  { slug: "vector-are-doua-consecutive-egale", title: "Exista consecutive egale", statement: "Verificati daca exista doua elemente consecutive egale.", solve: (p) => { const a = parseNArr(p); for (let i = 1; i < a.length; i += 1) if (a[i] === a[i - 1]) return YES; return NO; } },
  { slug: "vector-are-doua-consecutive-diferite", title: "Exista consecutive diferite", statement: "Verificati daca exista doua elemente consecutive diferite.", solve: (p) => { const a = parseNArr(p); for (let i = 1; i < a.length; i += 1) if (a[i] !== a[i - 1]) return YES; return NO; } },

  { slug: "vector-forma-munte", title: "Forma de munte", statement: "Verificati daca vectorul are forma de munte (creste apoi scade).", solve: (p) => { const a = parseNArr(p); let i = 1; while (i < a.length && a[i] > a[i - 1]) i += 1; if (i === 1 || i === a.length) return NO; while (i < a.length && a[i] < a[i - 1]) i += 1; return i === a.length ? YES : NO; } },
  { slug: "vector-forma-vale", title: "Forma de vale", statement: "Verificati daca vectorul are forma de vale (scade apoi creste).", solve: (p) => { const a = parseNArr(p); let i = 1; while (i < a.length && a[i] < a[i - 1]) i += 1; if (i === 1 || i === a.length) return NO; while (i < a.length && a[i] > a[i - 1]) i += 1; return i === a.length ? YES : NO; } },
  { slug: "vector-bitonic-fara-egalitati", title: "Vector bitonic", statement: "Verificati daca vectorul este bitonic (creste apoi scade, fara egalitati).", solve: (p) => { const a = parseNArr(p); return strictInc(a) || strictDec(a) ? NO : (problems[20].solve(p) === YES ? YES : NO); } },
  { slug: "vector-unimodal-un-singur-maxim", title: "Vector unimodal", statement: "Verificati daca vectorul are un singur maxim.", solve: (p) => { const a = parseNArr(p); const mx = Math.max(...a); return a.filter((x) => x === mx).length === 1 ? YES : NO; } },
  { slug: "vector-zigzag", title: "Vector zigzag", statement: "Verificati daca vectorul este zigzag (>,<,>,<... intre perechi consecutive).", solve: (p) => { const a = parseNArr(p); if (a.length < 2) return YES; for (let i = 1; i + 1 < a.length; i += 1) { const s1 = Math.sign(a[i] - a[i - 1]); const s2 = Math.sign(a[i + 1] - a[i]); if (s1 === 0 || s2 === 0 || s1 === s2) return NO; } return YES; } },
  { slug: "vector-anti-zigzag", title: "Vector anti-zigzag", statement: "Verificati daca vectorul este anti-zigzag (<,>,<,>...).", solve: (p) => problems[24].solve(p) },
  { slug: "vector-exact-un-maxim-local", title: "Exact un maxim local", statement: "Verificati daca vectorul are exact un maxim local.", solve: (p) => (localMaxCount(parseNArr(p)) === 1 ? YES : NO) },
  { slug: "vector-exact-un-minim-local", title: "Exact un minim local", statement: "Verificati daca vectorul are exact un minim local.", solve: (p) => (localMinCount(parseNArr(p)) === 1 ? YES : NO) },
  { slug: "vector-exista-secventa-crescatoare-lungime-k", title: "Exista secventa crescatoare lungime k", statement: "Verificati daca exista secventa strict crescatoare consecutiva de lungime k.", solve: (p) => { const { arr, rest } = parseNArrRest(p); const k = rest[0]; let cur = 1; let best = 1; for (let i = 1; i < arr.length; i += 1) { cur = arr[i] > arr[i - 1] ? cur + 1 : 1; best = Math.max(best, cur); } return best >= k ? YES : NO; } },
  { slug: "vector-exista-secventa-descrescatoare-lungime-k", title: "Exista secventa descrescatoare lungime k", statement: "Verificati daca exista secventa strict descrescatoare consecutiva de lungime k.", solve: (p) => { const { arr, rest } = parseNArrRest(p); const k = rest[0]; let cur = 1; let best = 1; for (let i = 1; i < arr.length; i += 1) { cur = arr[i] < arr[i - 1] ? cur + 1 : 1; best = Math.max(best, cur); } return best >= k ? YES : NO; } },

  { slug: "vector-palindrom", title: "Vector palindrom", statement: "Verificati daca vectorul este palindrom.", solve: (p) => { const a = parseNArr(p); for (let i = 0; i < a.length / 2; i += 1) if (a[i] !== a[a.length - 1 - i]) return NO; return YES; } },
  { slug: "vector-simetric-fata-de-mijloc", title: "Vector simetric fata de mijloc", statement: "Verificati daca vectorul este simetric fata de mijloc.", solve: (p) => problems[30].solve(p) },
  { slug: "vector-devine-crescator-prin-eliminare-un-element", title: "Devine crescator prin eliminarea unui element", statement: "Verificati daca vectorul poate deveni strict crescator prin eliminarea unui element.", solve: (p) => (canBeStrictIncByRemovingOne(parseNArr(p)) ? YES : NO) },
  { slug: "vector-devine-constant-prin-modificare-un-element", title: "Devine constant prin modificarea unui element", statement: "Verificati daca vectorul poate deveni constant prin modificarea unui element.", solve: (p) => (canBeConstantByChangingOne(parseNArr(p)) ? YES : NO) },
  { slug: "suma-pozitii-pare-egala-cu-suma-pozitii-impare", title: "Sume pozitii pare/impare egale", statement: "Verificati daca suma de pe pozitii pare este egala cu suma de pe pozitii impare (1-indexat).", solve: (p) => { const a = parseNArr(p); let sOdd = 0; let sEven = 0; for (let i = 0; i < a.length; i += 1) if ((i + 1) % 2 === 0) sEven += a[i]; else sOdd += a[i]; return sOdd === sEven ? YES : NO; } },
  { slug: "vector-periodic", title: "Vector periodic", statement: "Verificati daca vectorul este periodic (repeta un sablon de lungime < n).", solve: (p) => (isPeriodic(parseNArr(p)) ? YES : NO) },
  { slug: "vector-rotatie-care-devine-crescator", title: "Exista rotatie strict crescatoare", statement: "Verificati daca exista o rotatie care face vectorul strict crescator.", solve: (p) => (hasRotationStrictInc(parseNArr(p)) ? YES : NO) },
  { slug: "vector-sortat-circular", title: "Vector sortat circular", statement: "Verificati daca vectorul este sortat circular (ne-descrescator dupa o rotatie).", solve: (p) => { const a = parseNArr(p); let drops = 0; for (let i = 0; i < a.length; i += 1) if (a[i] > a[(i + 1) % a.length]) drops += 1; return drops <= 1 ? YES : NO; } },
  { slug: "doua-siruri-direct-proportionale-dupa-rearanjare", title: "Direct proportionale dupa rearanjare", statement: "Se dau doua siruri. Verificati daca sunt direct proportionale dupa rearanjare.", solve: (p) => { const n = Number(p[0]); const a = p.slice(1, 1 + n).map(Number).sort((x, y) => x - y); const b = p.slice(1 + n, 1 + 2 * n).map(Number).sort((x, y) => x - y); let ratioNum = null; let ratioDen = null; for (let i = 0; i < n; i += 1) { if (a[i] === 0 && b[i] === 0) continue; if (a[i] === 0 || b[i] === 0) return NO; if (ratioNum === null) { ratioNum = b[i]; ratioDen = a[i]; } else if (b[i] * ratioDen !== a[i] * ratioNum) return NO; } return YES; } },
  { slug: "doua-siruri-permutari", title: "Un sir este permutarea celuilalt", statement: "Se dau doua siruri. Verificati daca unul este permutarea celuilalt.", solve: (p) => { const n = Number(p[0]); const a = p.slice(1, 1 + n).map(Number).sort((x, y) => x - y); const b = p.slice(1 + n, 1 + 2 * n).map(Number).sort((x, y) => x - y); for (let i = 0; i < n; i += 1) if (a[i] !== b[i]) return NO; return YES; } },
];

const BASE_TESTS = [
  [6, 1, 2, 3, 4, 5, 6],
  [6, 6, 5, 4, 3, 2, 1],
  [6, 2, 2, 2, 2, 2, 2],
  [6, -1, 2, -3, 4, -5, 6],
  [6, 3, 1, 4, 1, 5, 9],
];

const CASES = {};
for (const pr of problems) CASES[pr.slug] = BASE_TESTS.map((x) => [...x]);

CASES["vector-diferenta-exact-k"] = [
  [5, 1, 3, 5, 7, 9, 2],
  [5, 1, 2, 3, 4, 5, 1],
  [5, 5, 5, 5, 5, 5, 0],
  [5, 10, 8, 6, 4, 2, -2],
  [5, 1, 3, 6, 8, 10, 2],
];
CASES["vector-urmatorul-cu-cel-mult-k"] = [
  [5, 1, 2, 3, 4, 5, 2],
  [5, 1, 4, 5, 6, 7, 2],
  [5, 1, 2, 3, 4, 5, 1],
  [5, -5, -4, -3, -2, -1, 2],
  [5, 1, 1, 2, 3, 4, 2],
];
CASES["vector-exista-secventa-crescatoare-lungime-k"] = [
  [7, 1, 2, 3, 1, 2, 3, 4, 4],
  [7, 1, 2, 1, 2, 1, 2, 1, 3],
  [7, 7, 6, 5, 4, 3, 2, 1, 2],
  [7, 1, 2, 3, 4, 5, 6, 7, 7],
  [7, 1, 1, 1, 1, 1, 1, 1, 1],
];
CASES["vector-exista-secventa-descrescatoare-lungime-k"] = [
  [7, 7, 6, 5, 1, 2, 3, 4, 4],
  [7, 1, 2, 1, 2, 1, 2, 1, 3],
  [7, 1, 2, 3, 4, 5, 6, 7, 2],
  [7, 7, 6, 5, 4, 3, 2, 1, 7],
  [7, 5, 5, 5, 5, 5, 5, 5, 2],
];
CASES["doua-siruri-direct-proportionale-dupa-rearanjare"] = [
  [4, 1, 2, 3, 4, 2, 4, 6, 8],
  [4, 1, 2, 3, 4, 2, 5, 6, 8],
  [4, 0, 0, 1, 2, 0, 0, 3, 6],
  [4, -1, -2, 3, 6, -2, -4, 6, 12],
  [4, 1, 1, 2, 2, 3, 3, 6, 6],
];
CASES["doua-siruri-permutari"] = [
  [4, 1, 2, 3, 4, 4, 3, 2, 1],
  [4, 1, 2, 3, 4, 1, 2, 3, 5],
  [4, 1, 1, 2, 2, 2, 1, 1, 2],
  [4, -1, -2, 3, 6, 6, 3, -2, -1],
  [4, 0, 0, 1, 2, 0, 1, 2, 0],
];

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
      "Prima valoare este n, urmeaza elementele vectorului. Unele probleme citesc la final k sau al doilea sir.",
    output_format: "Se afiseaza DA/NU conform cerintei.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    official_solution: buildCppTemplate(problem.title),
    tags: ["clasa9", "verificarea-proprietatilor"],
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
    console.log(`Seed complete. Upserted ${allProblems.length} verificarea-proprietatilor problems.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to seed verificarea-proprietatilor problems:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
