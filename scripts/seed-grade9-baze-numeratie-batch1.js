const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade9", chapter: "algoritmi-elementari", sub: "baze-de-numeratie" };

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
    slug: "conversie-baza10-in-baza2",
    title: "Conversia unui numar din baza 10 in baza 2",
    difficulty: "easy",
    tags: ["baze-de-numeratie", "binar", "conversie"],
    statement: "Se citeste un numar natural n, scris in baza 10. Determinati reprezentarea sa in baza 2.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza reprezentarea in baza 2 a lui n.",
    constraints: "0 <= n <= 10^18",
    hints: "Impartiti repetat n la 2, retinand resturile; cifrele reprezentarii binare sunt resturile obtinute, in ordine inversa.",
    explanation: "Se imparte repetat n la 2, retinand la fiecare pas restul impartirii (0 sau 1) si inlocuind n cu catul; procesul se opreste cand n devine 0. Resturile obtinute, citite in ordine inversa fata de cea in care au fost generate, formeaza reprezentarea in baza 2 a numarului.\n\n**Complexitate:** O(log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n; cin >> n;
    if (n == 0) { cout << 0 << "\\n"; return 0; }
    string rez = "";
    while (n > 0) { rez += char('0' + n % 2); n /= 2; }
    reverse(rez.begin(), rez.end());
    cout << rez << "\\n";
    return 0;
}
`,
    py: `n = int(input())
if n == 0:
    print(0)
else:
    rez = []
    while n > 0:
        rez.append(str(n % 2))
        n //= 2
    print("".join(reversed(rez)))
`,
    tests: ["0", "5", "10", "255", "1000000"],
  },
  {
    slug: "conversie-baza2-in-baza10",
    title: "Conversia unui numar din baza 2 in baza 10",
    difficulty: "easy",
    tags: ["baze-de-numeratie", "binar", "conversie"],
    statement: "Se citeste un sir de caractere reprezentand un numar in baza 2. Determinati valoarea sa in baza 10.",
    input_format: "Se citeste un sir de cifre binare (0 si 1).",
    output_format: "Se afiseaza valoarea in baza 10.",
    constraints: "1 <= lungimea sirului <= 60",
    hints: "Parcurgeti cifrele de la stanga la dreapta, actualizand valoarea prin val = val*2 + cifra.",
    explanation: "Se parcurg cifrele binare de la stanga la dreapta, mentinand o valoare acumulata: la fiecare cifra, valoarea curenta se dubleaza (inmultire cu baza 2) si se aduna cifra respectiva. La final, valoarea acumulata este numarul in baza 10.\n\n**Complexitate:** O(lungimea sirului)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    long long val = 0;
    for (char c : s) val = val * 2 + (c - '0');
    cout << val << "\\n";
    return 0;
}
`,
    py: `s = input()
val = 0
for c in s:
    val = val * 2 + int(c)
print(val)
`,
    tests: ["0", "101", "1010", "11111111", "1111101000"],
  },
  {
    slug: "conversie-baza10-in-baza16",
    title: "Conversia unui numar din baza 10 in baza 16",
    difficulty: "easy",
    tags: ["baze-de-numeratie", "hexazecimal", "conversie"],
    statement: "Se citeste un numar natural n. Determinati reprezentarea sa in baza 16 (hexazecimala), folosind cifrele 0-9 si literele mari A-F pentru valorile 10-15.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza reprezentarea in baza 16 a lui n.",
    constraints: "0 <= n <= 10^18",
    hints: "Impartiti repetat n la 16, folosind sirul de cifre \"0123456789ABCDEF\" pentru a transforma fiecare rest intr-un caracter.",
    explanation: "Se imparte repetat n la 16, retinand la fiecare pas restul impartirii; fiecare rest (0-15) se transforma in caracterul corespunzator din sirul \"0123456789ABCDEF\". Cifrele hexazecimale obtinute, in ordine inversa fata de generare, formeaza reprezentarea in baza 16.\n\n**Complexitate:** O(log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n; cin >> n;
    if (n == 0) { cout << 0 << "\\n"; return 0; }
    string cifre = "0123456789ABCDEF";
    string rez = "";
    while (n > 0) { rez += cifre[n % 16]; n /= 16; }
    reverse(rez.begin(), rez.end());
    cout << rez << "\\n";
    return 0;
}
`,
    py: `n = int(input())
cifre = "0123456789ABCDEF"
if n == 0:
    print(0)
else:
    rez = []
    while n > 0:
        rez.append(cifre[n % 16])
        n //= 16
    print("".join(reversed(rez)))
`,
    tests: ["0", "255", "16", "4095", "3000000"],
  },
  {
    slug: "conversie-baza16-in-baza10",
    title: "Conversia unui numar din baza 16 in baza 10",
    difficulty: "easy",
    tags: ["baze-de-numeratie", "hexazecimal", "conversie"],
    statement: "Se citeste un sir de caractere reprezentand un numar in baza 16 (cifre 0-9 si litere mari A-F). Determinati valoarea sa in baza 10.",
    input_format: "Se citeste un sir de cifre hexazecimale.",
    output_format: "Se afiseaza valoarea in baza 10.",
    constraints: "1 <= lungimea sirului <= 15",
    hints: "Pentru fiecare caracter, aflati-i valoarea (0-15) cautandu-l in sirul \"0123456789ABCDEF\", apoi actualizati valoarea prin val = val*16 + cifra.",
    explanation: "Se parcurg caracterele hexazecimale de la stanga la dreapta; valoarea fiecarui caracter (0-15) se afla cautandu-l in sirul de referinta \"0123456789ABCDEF\". Se mentine o valoare acumulata, actualizata la fiecare pas prin inmultire cu 16 si adaugarea cifrei curente.\n\n**Complexitate:** O(lungimea sirului)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    string cifre = "0123456789ABCDEF";
    long long val = 0;
    for (char c : s) {
        int d = cifre.find(c);
        val = val * 16 + d;
    }
    cout << val << "\\n";
    return 0;
}
`,
    py: `s = input()
cifre = "0123456789ABCDEF"
val = 0
for c in s:
    val = val * 16 + cifre.index(c)
print(val)
`,
    tests: ["0", "FF", "10", "FFF", "2DC6C0"],
  },
  {
    slug: "conversie-baza10-in-baza8",
    title: "Conversia unui numar din baza 10 in baza 8",
    difficulty: "easy",
    tags: ["baze-de-numeratie", "octal", "conversie"],
    statement: "Se citeste un numar natural n. Determinati reprezentarea sa in baza 8 (octala).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza reprezentarea in baza 8 a lui n.",
    constraints: "0 <= n <= 10^18",
    hints: "Impartiti repetat n la 8, retinand resturile.",
    explanation: "Se imparte repetat n la 8, retinand la fiecare pas restul impartirii (0-7) si inlocuind n cu catul, pana cand n devine 0. Resturile obtinute, in ordine inversa fata de generare, formeaza reprezentarea in baza 8.\n\n**Complexitate:** O(log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n; cin >> n;
    if (n == 0) { cout << 0 << "\\n"; return 0; }
    string rez = "";
    while (n > 0) { rez += char('0' + n % 8); n /= 8; }
    reverse(rez.begin(), rez.end());
    cout << rez << "\\n";
    return 0;
}
`,
    py: `n = int(input())
if n == 0:
    print(0)
else:
    rez = []
    while n > 0:
        rez.append(str(n % 8))
        n //= 8
    print("".join(reversed(rez)))
`,
    tests: ["0", "8", "64", "511", "1000000"],
  },
  {
    slug: "conversie-baza8-in-baza10",
    title: "Conversia unui numar din baza 8 in baza 10",
    difficulty: "easy",
    tags: ["baze-de-numeratie", "octal", "conversie"],
    statement: "Se citeste un sir de caractere reprezentand un numar in baza 8 (cifre 0-7). Determinati valoarea sa in baza 10.",
    input_format: "Se citeste un sir de cifre octale.",
    output_format: "Se afiseaza valoarea in baza 10.",
    constraints: "1 <= lungimea sirului <= 20",
    hints: "Parcurgeti cifrele de la stanga la dreapta, actualizand valoarea prin val = val*8 + cifra.",
    explanation: "Se parcurg cifrele octale de la stanga la dreapta, mentinand o valoare acumulata, actualizata la fiecare pas prin inmultire cu 8 si adaugarea cifrei curente.\n\n**Complexitate:** O(lungimea sirului)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    long long val = 0;
    for (char c : s) val = val * 8 + (c - '0');
    cout << val << "\\n";
    return 0;
}
`,
    py: `s = input()
val = 0
for c in s:
    val = val * 8 + int(c)
print(val)
`,
    tests: ["0", "10", "100", "777", "3641100"],
  },
  {
    slug: "conversie-baza10-in-baza-oarecare",
    title: "Conversia unui numar din baza 10 intr-o baza oarecare",
    difficulty: "medium",
    tags: ["baze-de-numeratie", "conversie"],
    statement: "Se citesc un numar natural n si un numar natural b (2 <= b <= 16), reprezentand o baza de numeratie. Determinati reprezentarea lui n in baza b, folosind cifrele 0-9 si literele mari A-F pentru valorile 10-15.",
    input_format: "Se citesc n si b.",
    output_format: "Se afiseaza reprezentarea lui n in baza b.",
    constraints: "0 <= n <= 10^15, 2 <= b <= 16",
    hints: "Impartiti repetat n la b, folosind sirul \"0123456789ABCDEF\" pentru a transforma fiecare rest intr-un caracter.",
    explanation: "Se imparte repetat n la b, retinand la fiecare pas restul impartirii (0 la b-1), transformat in caracterul corespunzator din sirul \"0123456789ABCDEF\". Cifrele obtinute, in ordine inversa fata de generare, formeaza reprezentarea lui n in baza b.\n\n**Complexitate:** O(log_b n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n, b; cin >> n >> b;
    if (n == 0) { cout << 0 << "\\n"; return 0; }
    string cifre = "0123456789ABCDEF";
    string rez = "";
    while (n > 0) { rez += cifre[n % b]; n /= b; }
    reverse(rez.begin(), rez.end());
    cout << rez << "\\n";
    return 0;
}
`,
    py: `n, b = map(int, input().split())
cifre = "0123456789ABCDEF"
if n == 0:
    print(0)
else:
    rez = []
    while n > 0:
        rez.append(cifre[n % b])
        n //= b
    print("".join(reversed(rez)))
`,
    tests: ["100 2", "255 16", "100 7", "0 5", "35 3"],
  },
  {
    slug: "conversie-baza-oarecare-in-baza10",
    title: "Conversia unui numar dintr-o baza oarecare in baza 10",
    difficulty: "medium",
    tags: ["baze-de-numeratie", "conversie"],
    statement: "Se citesc un sir de caractere reprezentand un numar intr-o baza b (2 <= b <= 16, cifre 0-9 si litere mari A-F) si valoarea lui b. Determinati valoarea numarului in baza 10.",
    input_format: "Se citesc sirul de cifre s si baza b.",
    output_format: "Se afiseaza valoarea in baza 10.",
    constraints: "1 <= lungimea sirului <= 15, 2 <= b <= 16",
    hints: "Pentru fiecare caracter, aflati-i valoarea cautandu-l in sirul \"0123456789ABCDEF\", apoi actualizati valoarea prin val = val*b + cifra.",
    explanation: "Se parcurg caracterele sirului de la stanga la dreapta; valoarea fiecarui caracter se afla cautandu-l in sirul de referinta \"0123456789ABCDEF\". Se mentine o valoare acumulata, actualizata la fiecare pas prin inmultire cu b si adaugarea cifrei curente.\n\n**Complexitate:** O(lungimea sirului)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; long long b; cin >> s >> b;
    string cifre = "0123456789ABCDEF";
    long long val = 0;
    for (char c : s) {
        int d = cifre.find(c);
        val = val * b + d;
    }
    cout << val << "\\n";
    return 0;
}
`,
    py: `s, b = input().split()
b = int(b)
cifre = "0123456789ABCDEF"
val = 0
for c in s:
    val = val * b + cifre.index(c)
print(val)
`,
    tests: ["202 7", "FF 16", "1022 3", "0 5", "1010 2"],
  },
  {
    slug: "conversie-baza2-in-baza16",
    title: "Conversia directa a unui numar din baza 2 in baza 16",
    difficulty: "medium",
    tags: ["baze-de-numeratie", "binar", "hexazecimal"],
    statement: "Se citeste un sir de caractere reprezentand un numar in baza 2. Determinati reprezentarea sa in baza 16, direct, prin gruparea cifrelor binare cate 4 (fara a trece prin baza 10).",
    input_format: "Se citeste un sir de cifre binare.",
    output_format: "Se afiseaza reprezentarea in baza 16.",
    constraints: "1 <= lungimea sirului <= 60",
    hints: "Completati sirul cu zerouri nesemnificative la stanga, pana cand lungimea lui este multiplu de 4, apoi transformati fiecare grup de 4 cifre binare intr-o singura cifra hexazecimala.",
    explanation: "Deoarece 16 = 2^4, fiecare grup de 4 cifre binare corespunde exact unei cifre hexazecimale. Se completeaza sirul binar cu zerouri nesemnificative la stanga pana cand lungimea sa devine multiplu de 4, apoi se imparte in grupuri de cate 4 cifre; fiecare grup este interpretat ca numar binar de 4 biti si transformat in cifra hexazecimala corespunzatoare. La final se elimina eventualele zerouri nesemnificative ramase (pastrand cel putin o cifra).\n\n**Complexitate:** O(lungimea sirului)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    while (s.size() % 4 != 0) s = "0" + s;
    string cifre = "0123456789ABCDEF";
    string rez = "";
    for (int i = 0; i < (int)s.size(); i += 4) {
        int val = 0;
        for (int j = 0; j < 4; j++) val = val * 2 + (s[i + j] - '0');
        rez += cifre[val];
    }
    int start = 0;
    while (start < (int)rez.size() - 1 && rez[start] == '0') start++;
    cout << rez.substr(start) << "\\n";
    return 0;
}
`,
    py: `s = input()
while len(s) % 4 != 0:
    s = "0" + s
cifre = "0123456789ABCDEF"
rez = []
for i in range(0, len(s), 4):
    val = 0
    for j in range(4):
        val = val * 2 + int(s[i + j])
    rez.append(cifre[val])
rez = "".join(rez)
start = 0
while start < len(rez) - 1 and rez[start] == "0":
    start += 1
print(rez[start:])
`,
    tests: ["1010", "11111111", "101", "111101000", "1"],
  },
  {
    slug: "conversie-baza2-in-baza8",
    title: "Conversia directa a unui numar din baza 2 in baza 8",
    difficulty: "medium",
    tags: ["baze-de-numeratie", "binar", "octal"],
    statement: "Se citeste un sir de caractere reprezentand un numar in baza 2. Determinati reprezentarea sa in baza 8, direct, prin gruparea cifrelor binare cate 3 (fara a trece prin baza 10).",
    input_format: "Se citeste un sir de cifre binare.",
    output_format: "Se afiseaza reprezentarea in baza 8.",
    constraints: "1 <= lungimea sirului <= 60",
    hints: "Completati sirul cu zerouri nesemnificative la stanga, pana cand lungimea lui este multiplu de 3, apoi transformati fiecare grup de 3 cifre binare intr-o singura cifra octala.",
    explanation: "Deoarece 8 = 2^3, fiecare grup de 3 cifre binare corespunde exact unei cifre octale. Se completeaza sirul binar cu zerouri nesemnificative la stanga pana cand lungimea sa devine multiplu de 3, apoi se imparte in grupuri de cate 3 cifre; fiecare grup este interpretat ca numar binar de 3 biti si transformat in cifra octala corespunzatoare. La final se elimina eventualele zerouri nesemnificative ramase.\n\n**Complexitate:** O(lungimea sirului)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    while (s.size() % 3 != 0) s = "0" + s;
    string rez = "";
    for (int i = 0; i < (int)s.size(); i += 3) {
        int val = 0;
        for (int j = 0; j < 3; j++) val = val * 2 + (s[i + j] - '0');
        rez += char('0' + val);
    }
    int start = 0;
    while (start < (int)rez.size() - 1 && rez[start] == '0') start++;
    cout << rez.substr(start) << "\\n";
    return 0;
}
`,
    py: `s = input()
while len(s) % 3 != 0:
    s = "0" + s
rez = []
for i in range(0, len(s), 3):
    val = 0
    for j in range(3):
        val = val * 2 + int(s[i + j])
    rez.append(str(val))
rez = "".join(rez)
start = 0
while start < len(rez) - 1 and rez[start] == "0":
    start += 1
print(rez[start:])
`,
    tests: ["1010", "11111111", "101", "111101000", "1"],
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
             $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,$13,$14,$15,$16,$17,$18,$19,$20,'full','exact','published',5
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
  const onlySlugs = process.env.ONLY_SLUGS ? process.env.ONLY_SLUGS.split(",") : null;
  const toRun = onlySlugs ? problems.filter((p) => onlySlugs.includes(p.slug)) : problems;
  const summary = await seedGroup(toRun);

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
