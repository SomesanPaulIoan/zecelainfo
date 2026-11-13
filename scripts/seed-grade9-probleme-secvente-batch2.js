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

function buildCppTemplate(title) {
  return [
    "#include <bits/stdc++.h>",
    "using namespace std;",
    "",
    "int main() {",
    `  // ${title}`,
    "  // Solutie cu sliding window / prefixe / hash map, dupa caz.",
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

function maxFreq(freq) {
  let m = 0;
  for (const v of freq.values()) m = Math.max(m, v);
  return m;
}

function freqAllEqual(freq) {
  let ref = null;
  for (const v of freq.values()) {
    if (ref === null) ref = v;
    else if (v !== ref) return false;
  }
  return true;
}

function serializeSub(a, l, r) {
  return a.slice(l, r + 1).join(",");
}

const problems = [
  { slug: "secv41-lungime-max-distincte", title: "Lungimea maxima cu valori distincte", statement: "Lungimea celei mai lungi secvente cu valori distincte.", solve: (p) => { const { arr } = parse(p); return `${Math.max(0, ...allSubs(arr).filter((s) => s.freq.size === s.len).map((s) => s.len))}\n`; } },
  { slug: "secv42-numar-subsecvente-fara-egale-consecutive", title: "Numar secvente fara egale consecutive", statement: "Numarul de secvente fara elemente egale consecutive.", solve: (p) => { const { arr } = parse(p); const subs = allSubs(arr); let c = 0; for (const s of subs) { let ok = true; for (let i = s.l + 1; i <= s.r; i += 1) if (arr[i] === arr[i - 1]) { ok = false; break; } if (ok) c += 1; } return `${c}\n`; } },
  { slug: "secv43-lungime-max-fiecare-apare-o-data", title: "Lungime maxima fiecare element apare o data", statement: "Lungimea celei mai lungi secvente in care fiecare element apare o singura data.", solve: (p) => problems[0].solve(p) },
  { slug: "secv44-lungime-max-cu-x-o-singura-data", title: "Lungime maxima cu x exact o data", statement: "Lungimea celei mai lungi secvente in care x apare exact o singura data.", solve: (p) => { const { arr, rest } = parse(p); const x = rest[0]; return `${Math.max(0, ...allSubs(arr).filter((s) => (s.freq.get(x) ?? 0) === 1).map((s) => s.len))}\n`; } },
  { slug: "secv45-numar-subsecvente-cu-cel-putin-un-x", title: "Numar secvente cu cel putin un x", statement: "Numarul de secvente care contin cel putin un x.", solve: (p) => { const { arr, rest } = parse(p); const x = rest[0]; return `${allSubs(arr).filter((s) => (s.freq.get(x) ?? 0) >= 1).length}\n`; } },
  { slug: "secv46-numar-subsecvente-fara-x", title: "Numar secvente fara x", statement: "Numarul de secvente care nu contin x.", solve: (p) => { const { arr, rest } = parse(p); const x = rest[0]; return `${allSubs(arr).filter((s) => (s.freq.get(x) ?? 0) === 0).length}\n`; } },

  { slug: "secv47-lungime-secventa-suma-maxima-kadane", title: "Lungime secventa cu suma maxima", statement: "Lungimea secventei cu suma maxima (Kadane).", solve: (p) => { const { arr } = parse(p); let best = -Infinity; let bestLen = 0; for (const s of allSubs(arr)) if (s.sum > best || (s.sum === best && s.len > bestLen)) { best = s.sum; bestLen = s.len; } return `${bestLen}\n`; } },
  { slug: "secv48-suma-maxima-a-unei-secvente", title: "Suma maxima a unei secvente", statement: "Determinati suma maxima a unei secvente.", solve: (p) => { const { arr } = parse(p); return `${Math.max(...allSubs(arr).map((s) => s.sum))}\n`; } },
  { slug: "secv49-capete-secventa-cu-suma-maxima", title: "Capetele secventei cu suma maxima", statement: "Determinati capetele secventei cu suma maxima (cea mai din stanga la egalitate).", solve: (p) => { const { arr } = parse(p); let best = -Infinity; let bl = 1; let br = 1; for (const s of allSubs(arr)) if (s.sum > best || (s.sum === best && (s.l + 1 < bl || (s.l + 1 === bl && s.r + 1 < br)))) { best = s.sum; bl = s.l + 1; br = s.r + 1; } return `${bl} ${br}\n`; } },
  { slug: "secv50-numar-subsecvente-cu-suma-pozitiva", title: "Numar secvente cu suma pozitiva", statement: "Numarul de secvente cu suma pozitiva.", solve: (p) => { const { arr } = parse(p); return `${allSubs(arr).filter((s) => s.sum > 0).length}\n`; } },
  { slug: "secv51-numar-subsecvente-cu-suma-negativa", title: "Numar secvente cu suma negativa", statement: "Numarul de secvente cu suma negativa.", solve: (p) => { const { arr } = parse(p); return `${allSubs(arr).filter((s) => s.sum < 0).length}\n`; } },
  { slug: "secv52-numar-subsecvente-cu-suma-zero", title: "Numar secvente cu suma 0", statement: "Numarul de secvente cu suma 0.", solve: (p) => { const { arr } = parse(p); return `${allSubs(arr).filter((s) => s.sum === 0).length}\n`; } },
  { slug: "secv53-lungime-max-subsecventa-cu-suma-zero", title: "Lungime maxima secventa cu suma 0", statement: "Lungimea celei mai lungi secvente cu suma 0.", solve: (p) => { const { arr } = parse(p); return `${Math.max(0, ...allSubs(arr).filter((s) => s.sum === 0).map((s) => s.len))}\n`; } },
  { slug: "secv54-numar-subsecvente-suma-divizibila-cu-k", title: "Numar secvente cu suma divizibila cu k", statement: "Numarul de secvente cu suma divizibila cu k.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${allSubs(arr).filter((s) => ((s.sum % k) + k) % k === 0).length}\n`; } },

  { slug: "secv55-lungime-max-produs-pozitiv", title: "Lungime maxima cu produs pozitiv", statement: "Lungimea celei mai lungi secvente cu produs pozitiv.", solve: (p) => { const { arr } = parse(p); return `${Math.max(0, ...allSubs(arr).filter((s) => s.prod > 0).map((s) => s.len))}\n`; } },
  { slug: "secv56-lungime-max-produs-negativ", title: "Lungime maxima cu produs negativ", statement: "Lungimea celei mai lungi secvente cu produs negativ.", solve: (p) => { const { arr } = parse(p); return `${Math.max(0, ...allSubs(arr).filter((s) => s.prod < 0).map((s) => s.len))}\n`; } },
  { slug: "secv57-numar-subsecvente-produs-pozitiv", title: "Numar secvente cu produs pozitiv", statement: "Numarul de secvente cu produs pozitiv.", solve: (p) => { const { arr } = parse(p); return `${allSubs(arr).filter((s) => s.prod > 0).length}\n`; } },
  { slug: "secv58-numar-subsecvente-produs-negativ", title: "Numar secvente cu produs negativ", statement: "Numarul de secvente cu produs negativ.", solve: (p) => { const { arr } = parse(p); return `${allSubs(arr).filter((s) => s.prod < 0).length}\n`; } },
  { slug: "secv59-lungime-max-fara-zero", title: "Lungime maxima fara 0", statement: "Lungimea celei mai lungi secvente fara 0.", solve: (p) => { const { arr } = parse(p); let best = 0; let cur = 0; for (const x of arr) { if (x !== 0) { cur += 1; best = Math.max(best, cur); } else cur = 0; } return `${best}\n`; } },
  { slug: "secv60-numar-subsecvente-fara-zero", title: "Numar secvente fara 0", statement: "Numarul de secvente fara 0.", solve: (p) => { const { arr } = parse(p); let ans = 0; let cur = 0; for (const x of arr) { if (x !== 0) cur += 1; else cur = 0; ans += cur; } return `${ans}\n`; } },

  { slug: "secv61-lungime-max-exact-k-distincte-si-suma-leq-s", title: "Lungime max exact k distincte si suma<=s", statement: "Lungimea maxima pentru exact k distincte si suma <= s.", solve: (p) => { const { arr, rest } = parse(p); const [k, s] = rest; return `${Math.max(0, ...allSubs(arr).filter((x) => x.freq.size === k && x.sum <= s).map((x) => x.len))}\n`; } },
  { slug: "secv62-numar-subsecvente-cel-mult-k-distincte-si-produs-leq-p", title: "Numar secvente cu <=k distincte si produs<=p", statement: "Numarul de secvente cu cel mult k distincte si produs <= p.", solve: (p) => { const { arr, rest } = parse(p); const [k, q] = rest; return `${allSubs(arr).filter((x) => x.freq.size <= k && x.prod <= q).length}\n`; } },
  { slug: "secv63-lungime-max-maxmin-leq-k-si-suma-leq-s", title: "Lungime max cu max-min<=k si suma<=s", statement: "Lungimea maxima cu max-min <= k si suma <= s.", solve: (p) => { const { arr, rest } = parse(p); const [k, s] = rest; return `${Math.max(0, ...allSubs(arr).filter((x) => x.max - x.min <= k && x.sum <= s).map((x) => x.len))}\n`; } },
  { slug: "secv64-numar-subsecvente-exact-k-distincte-toate-pare", title: "Numar secvente exact k distincte toate pare", statement: "Numarul de secvente unde apar exact k valori diferite si toate sunt pare.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${allSubs(arr).filter((x) => x.freq.size === k && Array.from(x.freq.keys()).every((v) => v % 2 === 0)).length}\n`; } },
  { slug: "secv65-lungime-max-fara-duplicate-si-suma-leq-s", title: "Lungime max fara duplicate si suma<=s", statement: "Lungimea maxima fara duplicate si cu suma <= s.", solve: (p) => { const { arr, rest } = parse(p); const s = rest[0]; return `${Math.max(0, ...allSubs(arr).filter((x) => x.freq.size === x.len && x.sum <= s).map((x) => x.len))}\n`; } },

  { slug: "secv66-numar-subsecvente-distincte-consecutive", title: "Numar subsecvente distincte", statement: "Numarul de subsecvente consecutive distincte (ca secventa de valori).", solve: (p) => { const { arr } = parse(p); const set = new Set(); for (let l = 0; l < arr.length; l += 1) for (let r = l; r < arr.length; r += 1) set.add(serializeSub(arr, l, r)); return `${set.size}\n`; } },
  { slug: "secv67-lungime-max-secventa-care-apare-de-cel-putin-2-ori", title: "Lungime max secventa repetata de 2 ori", statement: "Lungimea celei mai lungi secvente care apare de cel putin 2 ori.", solve: (p) => { const { arr } = parse(p); for (let len = arr.length; len >= 1; len -= 1) { const seen = new Map(); for (let l = 0; l + len <= arr.length; l += 1) { const s = serializeSub(arr, l, l + len - 1); seen.set(s, (seen.get(s) ?? 0) + 1); if (seen.get(s) >= 2) return `${len}\n`; } } return "0\n"; } },
  { slug: "secv68-numar-subsecvente-anagrame-vector", title: "Numar secvente anagrame (vector)", statement: "Numarul de perechi de secvente de aceeasi lungime care sunt anagrame (aceleasi frecvente).", solve: (p) => { const { arr } = parse(p); let cnt = 0; for (let l1 = 0; l1 < arr.length; l1 += 1) for (let r1 = l1; r1 < arr.length; r1 += 1) { const len = r1 - l1 + 1; const f1 = new Map(); for (let i = l1; i <= r1; i += 1) f1.set(arr[i], (f1.get(arr[i]) ?? 0) + 1); for (let l2 = l1 + 1; l2 + len - 1 < arr.length; l2 += 1) { const r2 = l2 + len - 1; const f2 = new Map(); for (let i = l2; i <= r2; i += 1) f2.set(arr[i], (f2.get(arr[i]) ?? 0) + 1); if (f1.size !== f2.size) continue; let ok = true; for (const [k, v] of f1.entries()) if ((f2.get(k) ?? 0) !== v) { ok = false; break; } if (ok) cnt += 1; } } return `${cnt}\n`; } },
  { slug: "secv69-lungime-max-cu-frecventa-maxima-leq-k", title: "Lungime max cu frecventa maxima <= k", statement: "Lungimea maxima a unei secvente in care frecventa maxima este <= k.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${Math.max(0, ...allSubs(arr).filter((s) => maxFreq(s.freq) <= k).map((s) => s.len))}\n`; } },
  { slug: "secv70-numar-subsecvente-cu-toate-frecventele-egale", title: "Numar secvente cu frecvente egale", statement: "Numarul de secvente in care toate frecventele valorilor sunt egale.", solve: (p) => { const { arr } = parse(p); return `${allSubs(arr).filter((s) => freqAllEqual(s.freq)).length}\n`; } },

  { slug: "secv71-afiseaza-intervale-maxime-suma-leq-k", title: "Afiseaza intervale maxime valide", statement: "Afisati toate intervalele de lungime maxima cu suma <= k.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; const good = allSubs(arr).filter((s) => s.sum <= k); const best = Math.max(0, ...good.map((s) => s.len)); const out = good.filter((s) => s.len === best).map((s) => `${s.l + 1} ${s.r + 1}`); return `${out.join("\n")}\n`; } },
  { slug: "secv72-cate-secvente-au-lungime-maxima", title: "Cate secvente au lungime maxima", statement: "Determinati cate secvente au lungime maxima dintre cele cu suma <= k.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; const good = allSubs(arr).filter((s) => s.sum <= k); const best = Math.max(0, ...good.map((s) => s.len)); return `${good.filter((s) => s.len === best).length}\n`; } },
  { slug: "secv73-cea-mai-din-stanga-secventa-cu-suma-k", title: "Cea mai din stanga secventa cu proprietate", statement: "Afisati secventa cea mai din stanga cu suma exact k.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; const cand = allSubs(arr).filter((s) => s.sum === k).sort((a, b) => a.l - b.l || a.r - b.r); if (!cand.length) return "0 0\n"; return `${cand[0].l + 1} ${cand[0].r + 1}\n`; } },
  { slug: "secv74-cea-mai-din-dreapta-secventa-cu-suma-k", title: "Cea mai din dreapta secventa cu proprietate", statement: "Afisati secventa cea mai din dreapta cu suma exact k.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; const cand = allSubs(arr).filter((s) => s.sum === k).sort((a, b) => b.r - a.r || b.l - a.l); if (!cand.length) return "0 0\n"; return `${cand[0].l + 1} ${cand[0].r + 1}\n`; } },
  { slug: "secv75-alege-cu-suma-maxima-dintre-cele-cu-lungime-maxima", title: "Dintre multe, alege cu suma maxima", statement: "Daca exista mai multe secvente cu lungime maxima si suma<=k, afisati pe cea cu suma maxima.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; const good = allSubs(arr).filter((s) => s.sum <= k); const bestLen = Math.max(0, ...good.map((s) => s.len)); const cand = good.filter((s) => s.len === bestLen).sort((a, b) => b.sum - a.sum || a.l - b.l); if (!cand.length) return "0 0\n"; return `${cand[0].l + 1} ${cand[0].r + 1}\n`; } },

  { slug: "secv76-two-pointers-numar-subsecvente-suma-leq-k", title: "Two pointers: numar secvente cu suma<=k", statement: "Numarul de subsecvente cu suma <= k.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${allSubs(arr).filter((s) => s.sum <= k).length}\n`; } },
  { slug: "secv77-sliding-window-longest-fara-repetari", title: "Sliding window: longest fara repetari", statement: "Lungimea celei mai lungi secvente fara repetari.", solve: (p) => problems[0].solve(p) },
  { slug: "secv78-sliding-window-longest-cu-k-distincte", title: "Sliding window: longest cu k distincte", statement: "Lungimea celei mai lungi secvente cu exact k distincte.", solve: (p) => problems[21].solve(p) },
  { slug: "secv79-prefix-map-numar-subsecvente-suma-k", title: "Prefix+map: numar secvente cu suma k", statement: "Numarul de subsecvente cu suma exact k.", solve: (p) => problems[17].solve(p) },
  { slug: "secv80-two-pointers-frecventa-maxima-leq-k", title: "Two pointers + frecventa", statement: "Numarul de subsecvente in care frecventa maxima <= k.", solve: (p) => { const { arr, rest } = parse(p); const k = rest[0]; return `${allSubs(arr).filter((s) => maxFreq(s.freq) <= k).length}\n`; } },
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
  "secv44-lungime-max-cu-x-o-singura-data",
  "secv45-numar-subsecvente-cu-cel-putin-un-x",
  "secv46-numar-subsecvente-fara-x",
  "secv54-numar-subsecvente-suma-divizibila-cu-k",
  "secv61-lungime-max-exact-k-distincte-si-suma-leq-s",
  "secv62-numar-subsecvente-cel-mult-k-distincte-si-produs-leq-p",
  "secv63-lungime-max-maxmin-leq-k-si-suma-leq-s",
  "secv64-numar-subsecvente-exact-k-distincte-toate-pare",
  "secv65-lungime-max-fara-duplicate-si-suma-leq-s",
  "secv69-lungime-max-cu-frecventa-maxima-leq-k",
  "secv71-afiseaza-intervale-maxime-suma-leq-k",
  "secv72-cate-secvente-au-lungime-maxima",
  "secv73-cea-mai-din-stanga-secventa-cu-suma-k",
  "secv74-cea-mai-din-dreapta-secventa-cu-suma-k",
  "secv75-alege-cu-suma-maxima-dintre-cele-cu-lungime-maxima",
  "secv76-two-pointers-numar-subsecvente-suma-leq-k",
  "secv78-sliding-window-longest-cu-k-distincte",
  "secv79-prefix-map-numar-subsecvente-suma-k",
  "secv80-two-pointers-frecventa-maxima-leq-k",
]) {
  CASES[slug] = [
    [6, 1, 2, 2, 3, 0, 4, 2, 5],
    [6, -1, -2, 3, 4, -5, 6, 1, 3],
    [7, 1, 1, 1, 2, 2, 3, 3, 2, 4],
    [5, 5, 4, 3, 2, 1, 3, 8],
    [8, 1, 0, 1, 0, 1, 0, 1, 0, 1, 2],
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
    input_format: "Se citeste n, apoi n elemente. Unele cerinte citesc si parametri suplimentari (k, x, s, p).",
    output_format: "Se afiseaza rezultatul cerut.",
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
    console.log(`Seed complete. Upserted ${allProblems.length} probleme-secvente batch2 problems.`);
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
