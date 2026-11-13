const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade9", chapter: "structuri-repetitive", sub: "structuri-repetitive-general" };

function normalize(text) {
  return (text ?? "").trim().split(/\r?\n/).map((line) => line.trim()).join("\n");
}

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

const problems = [
  {
    slug: "numarul-de-zile-dintre-doua-date-calendaristice",
    title: "Numarul de zile dintre doua date calendaristice",
    difficulty: "medium",
    statement:
      "Se citesc doua date calendaristice (dupa Hristos), fiecare formata din trei numere naturale: ziua, luna si anul, in aceasta ordine. Sa se determine numarul de zile dintre cele doua date, tinand cont de anii bisecti. Un an este bisect daca este divizibil cu 4 dar nu cu 100, sau daca este divizibil cu 400 (de exemplu 2000 si 2024 sunt bisecti, dar 1900 nu este).",
    input_format:
      "Pe prima linie se afla ziua, luna si anul primei date, separate prin spatiu. Pe a doua linie se afla ziua, luna si anul celei de-a doua date, separate prin spatiu.",
    output_format: "Afisati un singur numar natural, reprezentand numarul de zile dintre cele doua date.",
    constraints: "1 <= an <= 9999, ambele date introduse sunt date calendaristice valide (dupa Hristos)",
    tags: ["clasa9", "structuri-repetitive", "date-calendaristice", "ani-bisecti"],
    hints:
      "Transformati fiecare data intr-un numar unic, egal cu numarul de zile scurse de la 1 ianuarie a anului 1 pana la acea data (inclusiv). Pentru asta, parcurgeti cu un for toti anii dinaintea anului curent si adunati 365 sau 366 de zile pentru fiecare (dupa cum e sau nu bisect), apoi parcurgeti cu un for toate lunile dinaintea lunii curente si adunati numarul lor de zile, apoi adaugati ziua curenta. Raspunsul cerut este diferenta, in modul, dintre cele doua numere obtinute.",
    explanation:
      "Cel mai simplu mod de a compara doua date calendaristice este sa transformam fiecare in 'a cata zi este de la inceputul erei noastre' (1 ianuarie anul 1 fiind ziua 1). Pentru o data (z, l, a): parcurgem cu un for toti anii de la 1 la a-1 si adunam 365 (sau 366, daca anul e bisect) pentru fiecare; apoi parcurgem cu un for toate lunile de la 1 la l-1 din anul a si adunam numarul lor de zile (februarie avand 29 de zile daca a e bisect, altfel 28); apoi adaugam z. Facand acelasi calcul pentru ambele date primite, raspunsul este diferenta in modul a celor doua numere obtinute. Un an este bisect daca este divizibil cu 4 dar nu cu 100, sau daca este divizibil cu 400.\n\n**Complexitate:** O(an1 + an2)",
    time_limit_ms: 1000,
    cpp: `#include <bits/stdc++.h>
using namespace std;

bool bisect(int an) {
    return (an % 4 == 0 && an % 100 != 0) || an % 400 == 0;
}

int zileLuna(int luna, int an) {
    int zile[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    if (luna == 2 && bisect(an)) return 29;
    return zile[luna - 1];
}

long long numarZile(int z, int l, int a) {
    long long total = 0;
    for (int an = 1; an < a; an++) {
        total += bisect(an) ? 366 : 365;
    }
    for (int luna = 1; luna < l; luna++) {
        total += zileLuna(luna, a);
    }
    total += z;
    return total;
}

int main() {
    int z1, l1, a1, z2, l2, a2;
    cin >> z1 >> l1 >> a1;
    cin >> z2 >> l2 >> a2;
    long long n1 = numarZile(z1, l1, a1);
    long long n2 = numarZile(z2, l2, a2);
    cout << llabs(n1 - n2) << "\\n";
    return 0;
}
`,
    py: `def bisect(an):
    return (an % 4 == 0 and an % 100 != 0) or an % 400 == 0


def zile_luna(luna, an):
    zile = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    if luna == 2 and bisect(an):
        return 29
    return zile[luna - 1]


def numar_zile(z, l, a):
    total = 0
    for an in range(1, a):
        total += 366 if bisect(an) else 365
    for luna in range(1, l):
        total += zile_luna(luna, a)
    total += z
    return total


import sys

data = sys.stdin.read().split()
z1, l1, a1, z2, l2, a2 = map(int, data[:6])
n1 = numar_zile(z1, l1, a1)
n2 = numar_zile(z2, l2, a2)
print(abs(n1 - n2))
`,
    // Independently cross-checked against Python's datetime.date (proleptic Gregorian, same leap rule).
    tests: [
      "1 1 2024\n1 1 2024",
      "1 3 2023\n10 3 2023",
      "28 2 2023\n1 3 2023",
      "28 2 2024\n1 3 2024",
      "1 3 2023\n1 1 2023",
      "28 2 1900\n1 3 1900",
      "28 2 2000\n1 3 2000",
      "1 1 1\n1 1 2024",
      "31 12 9999\n1 1 1",
      "17 8 2005\n3 11 2026",
      "1 1 1950\n1 1 2033",
      "15 6 1875\n3 11 1999",
      "29 2 1980\n29 2 2060",
      "1 1 1900\n31 12 1980",
    ],
  },
];

async function seedGroup(list) {
  const summary = [];

  for (const p of list) {
    console.log(`\n=== ${p.slug} ===`);
    try {
      let allOk = true;
      const testRows = [];

      for (let i = 0; i < p.tests.length; i++) {
        const input = p.tests[i];
        const [cppOut, pyOut] = await Promise.all([runCustom("cpp", p.cpp, input), runCustom("python", p.py, input)]);

        if (cppOut.verdict !== "AC") {
          console.error(`  TEST ${i}: cpp execution failed: ${JSON.stringify(cppOut)} (input=${JSON.stringify(input)})`);
          allOk = false;
          continue;
        }
        if (pyOut.verdict !== "AC") {
          console.error(`  TEST ${i}: python execution failed: ${JSON.stringify(pyOut)} (input=${JSON.stringify(input)})`);
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

        testRows.push({ input, expected_output: `${normCpp}\n`, is_sample: i < 2 });
      }

      if (!allOk) {
        console.error(`!!! ${p.slug} has failing tests - NOT publishing.`);
        summary.push({ slug: p.slug, ok: false, tests: testRows.length });
        continue;
      }

      const existing = await pool.query("SELECT id FROM problems WHERE slug = $1", [p.slug]);
      let problemId;
      if (existing.rows.length > 0) {
        problemId = existing.rows[0].id;
        await pool.query(
          `UPDATE problems SET
             title=$2, statement=$3, input_format=$4, output_format=$5, constraints=$6,
             difficulty=$7, time_limit_ms=$8, memory_limit_mb=$9, source=$10, tags=$11,
             allowed_languages=$12, is_published=true, editorial_status='published', official_solution=$13,
             hints=$14, explanation=$15, official_solution_cpp=$16, official_solution_python=$17,
             curriculum_level=$18, curriculum_chapter_id=$19, curriculum_subcategory_id=$20,
             solution_mode='full', checker_mode='exact', updated_at=NOW()
           WHERE id=$1`,
          [
            problemId,
            p.title,
            p.statement,
            p.input_format,
            p.output_format,
            p.constraints,
            p.difficulty,
            p.time_limit_ms || 1500,
            p.memory_limit_mb || 64,
            "Sursa interna",
            p.tags || [],
            ["cpp", "c", "pascal", "python"],
            p.cpp,
            p.hints,
            p.explanation,
            p.cpp,
            p.py,
            CHAPTER.level,
            CHAPTER.chapter,
            CHAPTER.sub,
          ],
        );
        await pool.query("DELETE FROM test_cases WHERE problem_id = $1", [problemId]);
      } else {
        const inserted = await pool.query(
          `INSERT INTO problems (
             slug, title, statement, input_format, output_format, constraints,
             difficulty, time_limit_ms, memory_limit_mb, source, tags,
             allowed_languages, is_published, official_solution,
             hints, explanation, official_solution_cpp, official_solution_python,
             curriculum_level, curriculum_chapter_id, curriculum_subcategory_id,
             solution_mode, checker_mode, editorial_status, estimated_minutes
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,$13,$14,$15,$16,$17,$18,$19,$20,'full','exact','published',10
           )
           RETURNING id`,
          [
            p.slug,
            p.title,
            p.statement,
            p.input_format,
            p.output_format,
            p.constraints,
            p.difficulty,
            p.time_limit_ms || 1500,
            p.memory_limit_mb || 64,
            "Sursa interna",
            p.tags || [],
            ["cpp", "c", "pascal", "python"],
            p.cpp,
            p.hints,
            p.explanation,
            p.cpp,
            p.py,
            CHAPTER.level,
            CHAPTER.chapter,
            CHAPTER.sub,
          ],
        );
        problemId = inserted.rows[0].id;
      }

      for (let i = 0; i < testRows.length; i++) {
        const t = testRows[i];
        await pool.query(
          `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index) VALUES ($1,$2,$3,$4,$5,$6)`,
          [problemId, t.input, t.expected_output, t.is_sample, 10, i + 1],
        );
      }

      console.log(`published ${p.slug} (${p.difficulty}) with ${testRows.length} tests`);
      summary.push({ slug: p.slug, ok: true, tests: testRows.length });
    } catch (err) {
      console.error(`FAIL ${p.slug}: ${err.message}`);
      summary.push({ slug: p.slug, ok: false, error: err.message });
    }
  }

  return summary;
}

async function main() {
  const summary = await seedGroup(problems);

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

main().catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
