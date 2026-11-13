const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade9", chapter: "algoritmi-elementari", sub: "generarea-unor-siruri" };

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

const OUT_FMT_DA_NU = "Se afiseaza DA daca proprietatea este adevarata, respectiv NU in caz contrar.";

const problems = [
  {
    slug: "suma-primilor-n-termeni-fibonacci",
    title: "Suma primilor n termeni ai sirului lui Fibonacci",
    difficulty: "easy",
    tags: ["fibonacci", "siruri", "generare"],
    statement: "Se citeste un numar natural n. Determinati suma primilor n termeni ai sirului lui Fibonacci (F(1)=1, F(2)=1, F(k)=F(k-1)+F(k-2) pentru k>=3).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza suma primilor n termeni Fibonacci.",
    constraints: "1 <= n <= 80",
    hints: "Generati primii n termeni ai sirului Fibonacci si insumati-i pe masura ce ii generati.",
    explanation: "Se genereaza primii n termeni ai sirului Fibonacci (F(1)=1, F(2)=1, iar fiecare termen urmator este suma celor doi precedenti) si se insumeaza toate valorile generate.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> f(n + 1);
    f[1] = 1;
    if (n >= 2) f[2] = 1;
    for (int i = 3; i <= n; i++) f[i] = f[i - 1] + f[i - 2];
    long long suma = 0;
    for (int i = 1; i <= n; i++) suma += f[i];
    cout << suma << "\\n";
    return 0;
}
`,
    py: `n = int(input())
f = [0] * (n + 1)
f[1] = 1
if n >= 2:
    f[2] = 1
for i in range(3, n + 1):
    f[i] = f[i - 1] + f[i - 2]
print(sum(f[1:n + 1]))
`,
    tests: ["1", "2", "5", "10", "20"],
  },
  {
    slug: "numarare-fibonacci-mai-mici-decat-n",
    title: "Numarul de termeni Fibonacci mai mici sau egali cu n",
    difficulty: "easy",
    tags: ["fibonacci", "siruri", "generare"],
    statement: "Se citeste un numar natural n. Determinati cati termeni ai sirului lui Fibonacci (F(1)=1, F(2)=1, F(k)=F(k-1)+F(k-2)) sunt mai mici sau egali cu n.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul de termeni Fibonacci mai mici sau egali cu n.",
    constraints: "1 <= n <= 10^15",
    hints: "Generati termenii Fibonacci pe rand, incrementand un contor, pana cand termenul curent depaseste n.",
    explanation: "Se genereaza succesiv termenii sirului Fibonacci, incepand cu F(1)=1 si F(2)=1; de fiecare data cand termenul curent este mai mic sau egal cu n, se incrementeaza un contor si se trece la termenul urmator, pana cand un termen depaseste n.\n\n**Complexitate:** O(log n) (numarul de termeni Fibonacci sub n creste logaritmic)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n; cin >> n;
    long long a = 1, b = 1;
    int cnt = 0;
    while (a <= n) {
        cnt++;
        long long c = a + b;
        a = b;
        b = c;
    }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `n = int(input())
a, b = 1, 1
cnt = 0
while a <= n:
    cnt += 1
    a, b = b, a + b
print(cnt)
`,
    tests: ["1", "10", "100", "1000000000", "1000000000000000"],
  },
  {
    slug: "afisare-fibonacci-pana-la-n-termeni",
    title: "Afisarea primilor n termeni ai sirului lui Fibonacci",
    difficulty: "easy",
    tags: ["fibonacci", "siruri", "generare"],
    statement: "Se citeste un numar natural n. Afisati primii n termeni ai sirului lui Fibonacci (F(1)=1, F(2)=1, F(k)=F(k-1)+F(k-2)).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza primii n termeni Fibonacci, separati prin spatiu, pe o singura linie.",
    constraints: "1 <= n <= 80",
    hints: "Generati termenii pe rand, pornind cu F(1)=1 si F(2)=1, adaugand la fiecare pas suma ultimilor doi termeni.",
    explanation: "Se genereaza si se afiseaza pe rand primii n termeni ai sirului Fibonacci: primii doi termeni sunt ambii 1, iar fiecare termen urmator este suma celor doi termeni anteriori.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> f(n + 1);
    f[1] = 1;
    if (n >= 2) f[2] = 1;
    for (int i = 3; i <= n; i++) f[i] = f[i - 1] + f[i - 2];
    for (int i = 1; i <= n; i++) {
        cout << f[i];
        if (i < n) cout << ' ';
    }
    cout << "\\n";
    return 0;
}
`,
    py: `n = int(input())
f = [0] * (n + 1)
f[1] = 1
if n >= 2:
    f[2] = 1
for i in range(3, n + 1):
    f[i] = f[i - 1] + f[i - 2]
print(" ".join(str(f[i]) for i in range(1, n + 1)))
`,
    tests: ["1", "2", "5", "10", "15"],
  },
  {
    slug: "verificare-termen-fibonacci",
    title: "Verificarea daca un numar este termen al sirului lui Fibonacci",
    difficulty: "medium",
    tags: ["fibonacci", "siruri", "verificare"],
    statement: "Se citeste un numar natural x. Verificati daca x este un termen al sirului lui Fibonacci (F(0)=0, F(1)=1, F(2)=1, F(k)=F(k-1)+F(k-2)).",
    input_format: "Se citeste un numar natural x.",
    output_format: OUT_FMT_DA_NU,
    constraints: "0 <= x <= 10^15",
    hints: "Generati termenii sirului Fibonacci in ordine crescatoare pana cand termenul curent este mai mare sau egal cu x; verificati daca vreunul dintre ei este exact egal cu x.",
    explanation: "Se genereaza termenii sirului Fibonacci in ordine crescatoare, pornind de la F(0)=0 si F(1)=1, oprindu-se atunci cand termenul curent depaseste x. Daca la un moment dat termenul curent este exact egal cu x, x este termen Fibonacci.\n\n**Complexitate:** O(log x)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long x; cin >> x;
    long long a = 0, b = 1;
    bool gasit = (x == 0);
    while (b <= x) {
        if (b == x) { gasit = true; break; }
        long long c = a + b;
        a = b;
        b = c;
    }
    cout << (gasit ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `x = int(input())
a, b = 0, 1
gasit = x == 0
while b <= x:
    if b == x:
        gasit = True
        break
    a, b = b, a + b
print("DA" if gasit else "NU")
`,
    tests: ["0", "1", "4", "8", "144"],
  },
  {
    slug: "suma-fibonacci-pari",
    title: "Suma termenilor pari ai sirului lui Fibonacci, sub o limita data",
    difficulty: "medium",
    tags: ["fibonacci", "siruri", "paritate"],
    statement: "Se citeste un numar natural limita. Determinati suma termenilor sirului lui Fibonacci (F(1)=1, F(2)=1, F(k)=F(k-1)+F(k-2)) care sunt pari si mai mici sau egali cu limita.",
    input_format: "Se citeste un numar natural limita.",
    output_format: "Se afiseaza suma termenilor Fibonacci pari, mai mici sau egali cu limita.",
    constraints: "1 <= limita <= 10^15",
    hints: "Generati termenii Fibonacci pe rand pana depasesc limita, insumand doar termenii pari.",
    explanation: "Se genereaza succesiv termenii sirului Fibonacci, incepand cu F(1)=1 si F(2)=1. Pentru fiecare termen mai mic sau egal cu limita, daca acesta este par, se adauga la suma. Generarea se opreste cand termenul curent depaseste limita.\n\n**Complexitate:** O(log limita)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long limita; cin >> limita;
    long long a = 1, b = 1, suma = 0;
    while (a <= limita) {
        if (a % 2 == 0) suma += a;
        long long c = a + b;
        a = b;
        b = c;
    }
    cout << suma << "\\n";
    return 0;
}
`,
    py: `limita = int(input())
a, b, suma = 1, 1, 0
while a <= limita:
    if a % 2 == 0:
        suma += a
    a, b = b, a + b
print(suma)
`,
    tests: ["10", "100", "4000000", "1", "34"],
  },
  {
    slug: "al-n-lea-termen-lucas",
    title: "Al n-lea termen al sirului lui Lucas",
    difficulty: "easy",
    tags: ["lucas", "siruri", "generare"],
    statement: "Sirul lui Lucas este definit prin L(0)=2, L(1)=1, L(n)=L(n-1)+L(n-2) pentru n>=2 (aceeasi recurenta ca Fibonacci, dar cu alti termeni initiali). Se citeste un numar natural n. Determinati L(n).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza valoarea L(n).",
    constraints: "0 <= n <= 85",
    hints: "Generati sirul iterativ, pornind cu L(0)=2 si L(1)=1, la fel ca la Fibonacci.",
    explanation: "Se genereaza iterativ termenii sirului Lucas, pornind cu L(0)=2 si L(1)=1, fiecare termen urmator fiind suma celor doi anteriori, pana la termenul de rang n.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    long long a = 2, b = 1;
    if (n == 0) { cout << a << "\\n"; return 0; }
    for (int i = 2; i <= n; i++) { long long c = a + b; a = b; b = c; }
    cout << b << "\\n";
    return 0;
}
`,
    py: `n = int(input())
a, b = 2, 1
if n == 0:
    print(a)
else:
    for _ in range(2, n + 1):
        a, b = b, a + b
    print(b)
`,
    tests: ["0", "1", "2", "5", "10"],
  },
  {
    slug: "al-n-lea-termen-tribonacci",
    title: "Al n-lea termen al sirului Tribonacci",
    difficulty: "medium",
    tags: ["tribonacci", "siruri", "generare"],
    statement: "Sirul Tribonacci este definit prin T(0)=0, T(1)=1, T(2)=1, iar T(n)=T(n-1)+T(n-2)+T(n-3) pentru n>=3 (fiecare termen este suma precedentilor trei termeni). Se citeste un numar natural n. Determinati T(n).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza valoarea T(n).",
    constraints: "0 <= n <= 60",
    hints: "Generati sirul iterativ, mentinand ultimii trei termeni.",
    explanation: "Se genereaza iterativ termenii sirului Tribonacci, pornind cu T(0)=0, T(1)=1, T(2)=1, fiecare termen urmator fiind suma precedentilor trei termeni, pana la termenul de rang n.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    if (n == 0) { cout << 0 << "\\n"; return 0; }
    if (n == 1 || n == 2) { cout << 1 << "\\n"; return 0; }
    long long a = 0, b = 1, c = 1;
    for (int i = 3; i <= n; i++) {
        long long d = a + b + c;
        a = b; b = c; c = d;
    }
    cout << c << "\\n";
    return 0;
}
`,
    py: `n = int(input())
if n == 0:
    print(0)
elif n <= 2:
    print(1)
else:
    a, b, c = 0, 1, 1
    for _ in range(3, n + 1):
        a, b, c = b, c, a + b + c
    print(c)
`,
    tests: ["0", "1", "2", "3", "10"],
  },
  {
    slug: "sir-fibonacci-generalizat",
    title: "Sir de tip Fibonacci cu termeni initiali oarecare",
    difficulty: "medium",
    tags: ["fibonacci", "siruri", "recurenta"],
    statement: "Se citesc doua numere intregi a si b (termenii initiali x(1) si x(2)) si un numar natural n. Sirul x este definit prin x(1)=a, x(2)=b, x(k)=x(k-1)+x(k-2) pentru k>=3. Determinati x(n).",
    input_format: "Se citesc a, b si n.",
    output_format: "Se afiseaza valoarea x(n).",
    constraints: "-1000 <= a, b <= 1000, 1 <= n <= 80",
    hints: "Generati sirul iterativ pornind de la a si b, exact ca la Fibonacci, dar cu termenii initiali dati.",
    explanation: "Se genereaza iterativ sirul, pornind cu x(1)=a si x(2)=b, fiecare termen urmator fiind suma celor doi termeni anteriori, pana la termenul de rang n.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long a, b; int n; cin >> a >> b >> n;
    if (n == 1) { cout << a << "\\n"; return 0; }
    if (n == 2) { cout << b << "\\n"; return 0; }
    for (int i = 3; i <= n; i++) { long long c = a + b; a = b; b = c; }
    cout << b << "\\n";
    return 0;
}
`,
    py: `a, b, n = map(int, input().split())
if n == 1:
    print(a)
elif n == 2:
    print(b)
else:
    for _ in range(3, n + 1):
        a, b = b, a + b
    print(b)
`,
    tests: ["1 1 10", "2 3 8", "-5 5 6", "0 1 15", "10 10 5"],
  },
  {
    slug: "numarul-de-aur-aproximare",
    title: "Aproximarea numarului de aur cu ajutorul sirului lui Fibonacci",
    difficulty: "medium",
    tags: ["fibonacci", "siruri", "numar-de-aur"],
    statement: "Se citeste un numar natural n (n >= 2). Determinati raportul F(n) / F(n-1) dintre doi termeni consecutivi ai sirului lui Fibonacci (F(1)=1, F(2)=1, F(k)=F(k-1)+F(k-2)), care aproximeaza numarul de aur pentru n suficient de mare.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza raportul F(n) / F(n-1), cu exact 4 zecimale.",
    constraints: "2 <= n <= 40",
    hints: "Generati F(n-1) si F(n), apoi calculati raportul lor ca numar real, afisat cu 4 zecimale.",
    explanation: "Se genereaza iterativ termenii Fibonacci pana la F(n-1) si F(n), apoi se calculeaza raportul acestora ca numar real. Pe masura ce n creste, acest raport se apropie tot mai mult de numarul de aur, (1+sqrt(5))/2.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    long long a = 1, b = 1;
    for (int i = 3; i <= n; i++) { long long c = a + b; a = b; b = c; }
    double raport = (double)b / (double)a;
    cout << fixed << setprecision(4) << raport << "\\n";
    return 0;
}
`,
    py: `n = int(input())
a, b = 1, 1
for _ in range(3, n + 1):
    a, b = b, a + b
raport = b / a
print(f"{raport:.4f}")
`,
    tests: ["2", "5", "10", "20", "35"],
  },
  {
    slug: "al-n-lea-termen-padovan",
    title: "Al n-lea termen al sirului lui Padovan",
    difficulty: "medium",
    tags: ["padovan", "siruri", "generare"],
    statement: "Sirul lui Padovan este definit prin P(0)=P(1)=P(2)=1, iar P(n)=P(n-2)+P(n-3) pentru n>=3. Se citeste un numar natural n. Determinati P(n).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza valoarea P(n).",
    constraints: "0 <= n <= 80",
    hints: "Generati sirul iterativ, mentinand ultimii trei termeni pentru a calcula formula P(n)=P(n-2)+P(n-3).",
    explanation: "Se genereaza iterativ termenii sirului Padovan, pornind cu P(0)=P(1)=P(2)=1, fiecare termen urmator fiind suma termenilor de doua, respectiv trei pozitii in urma, pana la termenul de rang n.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    if (n <= 2) { cout << 1 << "\\n"; return 0; }
    long long p0 = 1, p1 = 1, p2 = 1;
    for (int i = 3; i <= n; i++) {
        long long p3 = p0 + p1;
        p0 = p1; p1 = p2; p2 = p3;
    }
    cout << p2 << "\\n";
    return 0;
}
`,
    py: `n = int(input())
if n <= 2:
    print(1)
else:
    p0, p1, p2 = 1, 1, 1
    for _ in range(3, n + 1):
        p0, p1, p2 = p1, p2, p0 + p1
    print(p2)
`,
    tests: ["0", "2", "3", "7", "20"],
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
