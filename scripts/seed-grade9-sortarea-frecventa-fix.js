const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const API = "http://localhost:4000";

async function runCustom(language, code, stdin) {
  const res = await fetch(`${API}/api/submissions/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problem_id: "00000000-0000-0000-0000-000000000000",
      language,
      code,
      stdin,
      mode: "custom",
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`run failed: ${JSON.stringify(json)}`);
  return json.data;
}

function normalize(text) {
  return text.trim().split(/\r?\n/).map((line) => line.trim()).join("\n");
}

const CHAPTER = { level: "grade9", chapter: "tablouri-uni", sub: "sortarea-vectorilor" };
const STABIL_NOTE = " In caz de egalitate a criteriului de sortare, pastreaza ordinea relativa initiala din vector (sortare stabila).";

const problems = [
  {
    slug: "sortarea-crescatoare-dupa-frecventa-de-aparitie",
    title: "Sortarea crescatoare dupa frecventa de aparitie",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Sorteaza vectorul crescator dupa frecventa de aparitie a fiecarui element in vector (elementele care apar mai rar sunt plasate primele)." + STABIL_NOTE,
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu.",
    output_format: "Afiseaza elementele vectorului sortate crescator dupa frecventa de aparitie, separate printr-un spatiu.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "medium",
    tags: ["sortarea-vectorilor", "frecventa"],
    hints: "Calculeaza pentru fiecare element numarul de aparitii ale valorii sale in tot vectorul, apoi sorteaza stabil dupa acest numar.",
    explanation: "Pentru fiecare element numeri de cate ori apare valoarea lui in tot vectorul (O(n) per element), apoi folosesti un sort stabil comparand dupa aceasta frecventa.\n\n**Complexitate:** O(n^2)",
    cpp: "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <map>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;map<long long,long long> freq;for(auto v:a)freq[v]++;stable_sort(a.begin(),a.end(),[&](long long x,long long y){return freq[x]<freq[y];});for(int i=0;i<n;i++){if(i)cout<<\" \";cout<<a[i];}return 0;}\n",
    py: "n = int(input())\na = list(map(int, input().split()))\nfreq = {}\nfor v in a:\n    freq[v] = freq.get(v, 0) + 1\na.sort(key=lambda v: freq[v])\nprint(\" \".join(map(str, a)))\n",
    tests: [
      "1\n5",
      "5\n1 1 2 2 2",
      "6\n1 2 2 3 3 3",
      "4\n5 5 5 5",
      "6\n-1 -1 -2 -3 -3 -3",
      "3\n1 2 3",
      "7\n1 1 1 2 2 3 3",
      "8\n4 4 4 4 1 1 2 3",
    ],
  },
  {
    slug: "sortarea-descrescatoare-dupa-frecventa-de-aparitie",
    title: "Sortarea descrescatoare dupa frecventa de aparitie",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Sorteaza vectorul descrescator dupa frecventa de aparitie a fiecarui element in vector (elementele care apar mai des sunt plasate primele)." + STABIL_NOTE,
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu.",
    output_format: "Afiseaza elementele vectorului sortate descrescator dupa frecventa de aparitie, separate printr-un spatiu.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "medium",
    tags: ["sortarea-vectorilor", "frecventa"],
    hints: "Calculeaza pentru fiecare element numarul de aparitii ale valorii sale in tot vectorul, apoi sorteaza stabil descrescator dupa acest numar.",
    explanation: "Pentru fiecare element numeri de cate ori apare valoarea lui in tot vectorul, apoi folosesti un sort stabil descrescator comparand dupa aceasta frecventa.\n\n**Complexitate:** O(n^2)",
    cpp: "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <map>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;map<long long,long long> freq;for(auto v:a)freq[v]++;stable_sort(a.begin(),a.end(),[&](long long x,long long y){return freq[x]>freq[y];});for(int i=0;i<n;i++){if(i)cout<<\" \";cout<<a[i];}return 0;}\n",
    py: "n = int(input())\na = list(map(int, input().split()))\nfreq = {}\nfor v in a:\n    freq[v] = freq.get(v, 0) + 1\na.sort(key=lambda v: freq[v], reverse=True)\nprint(\" \".join(map(str, a)))\n",
    tests: [
      "1\n5",
      "5\n1 1 2 2 2",
      "6\n1 2 2 3 3 3",
      "4\n5 5 5 5",
      "6\n-1 -1 -2 -3 -3 -3",
      "3\n1 2 3",
      "7\n1 1 1 2 2 3 3",
      "8\n4 4 4 4 1 1 2 3",
    ],
  },
];

async function seedGroup(problems, chapterInfo) {
  const summary = [];

  for (const p of problems) {
    console.log(`\n=== ${p.slug} ===`);

    const insertResult = await pool.query(
      `INSERT INTO problems (
         slug, title, statement, input_format, output_format, constraints,
         difficulty, time_limit_ms, memory_limit_mb, source, tags,
         allowed_languages, is_published, official_solution,
         hints, explanation, official_solution_cpp, official_solution_python,
         curriculum_level, curriculum_chapter_id, curriculum_subcategory_id,
         solution_mode, checker_mode, editorial_status, estimated_minutes
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,false,$13,$14,$15,$16,$17,$18,$19,$20,'full','exact','draft',5
       )
       RETURNING id`,
      [
        p.slug, p.title, p.statement, p.input_format, p.output_format, p.constraints,
        p.difficulty, 1500, 64, "Zece la Info", p.tags,
        ["cpp", "c", "pascal", "python"], p.cpp, p.hints, p.explanation, p.cpp, p.py,
        chapterInfo.level, chapterInfo.chapter, chapterInfo.sub,
      ],
    );
    const problemId = insertResult.rows[0].id;

    let allOk = true;
    const testRows = [];

    for (let i = 0; i < p.tests.length; i++) {
      const input = p.tests[i];
      const cppOut = await runCustom("cpp", p.cpp, input);
      const pyOut = await runCustom("python", p.py, input);

      if (cppOut.verdict !== "AC") {
        console.error(`  TEST ${i}: cpp execution failed: ${JSON.stringify(cppOut)}`);
        allOk = false;
        continue;
      }
      if (pyOut.verdict !== "AC") {
        console.error(`  TEST ${i}: python execution failed: ${JSON.stringify(pyOut)}`);
        allOk = false;
        continue;
      }

      const normCpp = normalize(cppOut.stdout);
      const normPy = normalize(pyOut.stdout);
      if (normCpp !== normPy) {
        console.error(`  TEST ${i}: MISMATCH cpp="${normCpp}" python="${normPy}" (input=${JSON.stringify(input)})`);
        allOk = false;
        continue;
      }

      testRows.push({ input, expected_output: normCpp, is_sample: i < 2, points: 10, order_index: i });
    }

    if (!allOk) {
      console.error(`!!! ${p.slug} has failing tests - NOT publishing.`);
      summary.push({ slug: p.slug, ok: false, tests: testRows.length });
      continue;
    }

    for (const t of testRows) {
      await pool.query(
        `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [problemId, t.input, t.expected_output, t.is_sample, t.points, t.order_index],
      );
    }

    await pool.query(`UPDATE problems SET is_published = true, editorial_status = 'published' WHERE id = $1`, [problemId]);
    console.log(`published ${p.slug} (${p.difficulty}) with ${testRows.length} tests`);
    summary.push({ slug: p.slug, ok: true, tests: testRows.length });
  }

  return summary;
}

async function main() {
  const summary = await seedGroup(problems, CHAPTER);
  console.log("\n=== SUMMARY ===");
  let okCount = 0;
  for (const s of summary) {
    if (s.ok) okCount++;
    console.log(`${s.ok ? "OK  " : "FAIL"} ${s.slug} (${s.tests} tests)`);
  }
  console.log(`\n${okCount}/${summary.length} published`);
  await pool.end();
}

main().catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
