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
    slug: "al-n-lea-termen-pell",
    title: "Al n-lea termen al sirului lui Pell",
    difficulty: "medium",
    tags: ["pell", "siruri", "generare"],
    statement: "Sirul lui Pell este definit prin P(0)=0, P(1)=1, P(n)=2*P(n-1)+P(n-2) pentru n>=2. Se citeste un numar natural n. Determinati P(n).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza valoarea P(n).",
    constraints: "0 <= n <= 40",
    hints: "Generati sirul iterativ, pornind cu P(0)=0 si P(1)=1, aplicand formula P(n)=2*P(n-1)+P(n-2).",
    explanation: "Se genereaza iterativ termenii sirului Pell, pornind cu P(0)=0 si P(1)=1, fiecare termen urmator fiind dublul termenului anterior plus termenul de dinaintea acestuia, pana la termenul de rang n.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    if (n == 0) { cout << 0 << "\\n"; return 0; }
    long long a = 0, b = 1;
    for (int i = 2; i <= n; i++) { long long c = 2 * b + a; a = b; b = c; }
    cout << b << "\\n";
    return 0;
}
`,
    py: `n = int(input())
if n == 0:
    print(0)
else:
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, 2 * b + a
    print(b)
`,
    tests: ["0", "1", "2", "5", "12"],
  },
  {
    slug: "al-n-lea-numar-catalan",
    title: "Al n-lea numar Catalan",
    difficulty: "hard",
    tags: ["catalan", "siruri", "combinatorica"],
    statement: "Numerele Catalan sunt definite prin C(0)=1 si C(n) = C(n-1) * 2 * (2n-1) / (n+1) pentru n>=1. Se citeste un numar natural n. Determinati C(n).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza valoarea C(n).",
    constraints: "0 <= n <= 30",
    hints: "Aplicati direct formula recurenta C(n) = C(n-1) * 2 * (2n-1) / (n+1), care produce mereu un rezultat intreg.",
    explanation: "Se aplica formula recurenta C(n) = C(n-1) * 2 * (2n-1) / (n+1), pornind de la C(0)=1. Aceasta formula este echivalenta cu C(n) = combinari(2n, n) / (n+1), dar evita calculul direct al factorialelor foarte mari, iar impartirea este intotdeauna exacta.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    long long c = 1;
    for (int i = 1; i <= n; i++) c = c * 2 * (2 * i - 1) / (i + 1);
    cout << c << "\\n";
    return 0;
}
`,
    py: `n = int(input())
c = 1
for i in range(1, n + 1):
    c = c * 2 * (2 * i - 1) // (i + 1)
print(c)
`,
    tests: ["0", "1", "3", "5", "15"],
  },
  {
    slug: "suma-patratelor-primelor-n-numere",
    title: "Suma patratelor primelor n numere naturale",
    difficulty: "easy",
    tags: ["siruri", "patrate", "formula"],
    statement: "Se citeste un numar natural n. Determinati suma 1^2 + 2^2 + 3^2 + ... + n^2, folosind formula inchisa n*(n+1)*(2n+1)/6.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza suma patratelor primelor n numere naturale.",
    constraints: "1 <= n <= 2000000",
    hints: "Aplicati direct formula n*(n+1)*(2n+1)/6, fara sa parcurgeti toate numerele de la 1 la n.",
    explanation: "Suma patratelor primelor n numere naturale are formula inchisa n*(n+1)*(2n+1)/6, care se poate calcula direct, in timp constant, fara a parcurge efectiv toate numerele (esential pentru n foarte mare).\n\n**Complexitate:** O(1)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n; cin >> n;
    __int128 suma = (__int128)n * (n + 1) * (2 * n + 1) / 6;
    cout << (long long)suma << "\\n";
    return 0;
}
`,
    py: `n = int(input())
suma = n * (n + 1) * (2 * n + 1) // 6
print(suma)
`,
    tests: ["1", "3", "10", "1000", "2000000"],
  },
  {
    slug: "al-n-lea-numar-triunghiular",
    title: "Al n-lea numar triunghiular",
    difficulty: "easy",
    tags: ["siruri", "numere-triunghiulare", "formula"],
    statement: "Numerele triunghiulare sunt 1, 3, 6, 10, 15, ..., unde al n-lea numar triunghiular este T(n) = 1 + 2 + ... + n. Se citeste un numar natural n. Determinati T(n), folosind formula inchisa.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza valoarea T(n).",
    constraints: "1 <= n <= 2000000000",
    hints: "Folositi formula T(n) = n*(n+1)/2.",
    explanation: "Al n-lea numar triunghiular reprezinta suma primelor n numere naturale, care are formula inchisa T(n) = n*(n+1)/2, calculabila direct in timp constant.\n\n**Complexitate:** O(1)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n; cin >> n;
    cout << n * (n + 1) / 2 << "\\n";
    return 0;
}
`,
    py: `n = int(input())
print(n * (n + 1) // 2)
`,
    tests: ["1", "2", "5", "100", "2000000000"],
  },
  {
    slug: "verificare-numar-triunghiular",
    title: "Verificarea daca un numar este triunghiular",
    difficulty: "medium",
    tags: ["siruri", "numere-triunghiulare", "verificare"],
    statement: "Se citeste un numar natural x. Verificati daca x este un numar triunghiular, adica daca exista un numar natural n astfel incat x = n*(n+1)/2.",
    input_format: "Se citeste un numar natural x.",
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= x <= 10^15",
    hints: "Numarul x este triunghiular daca si numai daca 8x+1 este patrat perfect. Alternativ, cautati binar valoarea n.",
    explanation: "Se cauta, prin cautare binara, cel mai mare n pentru care n*(n+1)/2 <= x; x este triunghiular daca si numai daca pentru acest n avem exact n*(n+1)/2 = x.\n\n**Complexitate:** O(log x)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long x; cin >> x;
    long long lo = 1, hi = 2000000000LL;
    while (lo < hi) {
        long long mid = lo + (hi - lo + 1) / 2;
        if (mid * (mid + 1) / 2 <= x) lo = mid;
        else hi = mid - 1;
    }
    bool ok = (lo * (lo + 1) / 2 == x);
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `x = int(input())
lo, hi = 1, 2000000000
while lo < hi:
    mid = lo + (hi - lo + 1) // 2
    if mid * (mid + 1) // 2 <= x:
        lo = mid
    else:
        hi = mid - 1
ok = lo * (lo + 1) // 2 == x
print("DA" if ok else "NU")
`,
    tests: ["1", "10", "15", "21", "22"],
  },
  {
    slug: "al-n-lea-termen-sir-crescator-grupuri",
    title: "Al n-lea termen al sirului 1, 1 2, 1 2 3, 1 2 3 4, ...",
    difficulty: "hard",
    tags: ["siruri", "generare", "cautare-binara", "grupuri"],
    statement: "Se considera sirul obtinut prin concatenarea grupurilor 1; 1, 2; 1, 2, 3; 1, 2, 3, 4; ... (grupul k contine numerele de la 1 la k, in ordine): 1, 1, 2, 1, 2, 3, 1, 2, 3, 4, .... Se citeste un numar natural n. Determinati al n-lea termen al acestui sir (indexare de la 1).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza al n-lea termen al sirului.",
    constraints: "1 <= n <= 1000000000",
    hints: "Grupul k ocupa pozitiile de la S(k-1)+1 la S(k), unde S(k)=k*(k+1)/2. Cautati binar cel mai mic k pentru care S(k) >= n; raspunsul este n - S(k-1).",
    explanation: "Grupul k contine k termeni (numerele 1, 2, ..., k), deci suma lungimilor primelor k grupuri este S(k) = k*(k+1)/2 (numar triunghiular). Se cauta binar cel mai mic k astfel incat S(k) >= n (adica grupul k contine pozitia n); pozitia n se afla in interiorul grupului k la distanta n - S(k-1) de inceputul lui, iar cum grupul k contine chiar valorile 1, 2, ..., k in ordine, aceasta distanta este exact valoarea cautata.\n\n**Complexitate:** O(log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n; cin >> n;
    long long lo = 1, hi = 2000000000LL;
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (mid * (mid + 1) / 2 >= n) hi = mid;
        else lo = mid + 1;
    }
    long long k = lo;
    long long sk1 = (k - 1) * k / 2;
    cout << (n - sk1) << "\\n";
    return 0;
}
`,
    py: `n = int(input())
lo, hi = 1, 2000000000
while lo < hi:
    mid = (lo + hi) // 2
    if mid * (mid + 1) // 2 >= n:
        hi = mid
    else:
        lo = mid + 1
k = lo
sk1 = (k - 1) * k // 2
print(n - sk1)
`,
    tests: ["1", "2", "3", "6", "1000000000"],
  },
  {
    slug: "suma-primilor-n-termeni-sir-crescator-grupuri",
    title: "Suma primilor n termeni ai sirului 1, 1 2, 1 2 3, 1 2 3 4, ...",
    difficulty: "hard",
    tags: ["siruri", "generare", "cautare-binara", "grupuri"],
    statement: "Se considera acelasi sir ca in problema anterioara (grupul k contine numerele de la 1 la k, in ordine): 1, 1, 2, 1, 2, 3, 1, 2, 3, 4, .... Se citeste un numar natural n. Determinati suma primilor n termeni ai sirului, fara a-i genera efectiv pe toti.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza suma primilor n termeni ai sirului.",
    constraints: "1 <= n <= 1000000000",
    hints: "Determinati mai intai grupul k in care se afla pozitia n (ca in problema anterioara). Suma completa a primelor k-1 grupuri se calculeaza cu formula numerelor tetraedrale, iar la aceasta se adauga suma partiala a grupului k, pana la pozitia n.",
    explanation: "Se determina, ca in problema anterioara, grupul k caruia ii apartine pozitia n si pozitia p a lui n in interiorul grupului (p = n - S(k-1), unde S(m)=m(m+1)/2). Suma tuturor termenilor din primele k-1 grupuri complete este suma numerelor triunghiulare S(1)+S(2)+...+S(k-1), care are formula inchisa (k-1)*k*(k+1)/6 (numar tetraedral). La aceasta se adauga suma partiala a grupului k, adica 1+2+...+p = p*(p+1)/2.\n\n**Complexitate:** O(log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n; cin >> n;
    long long lo = 1, hi = 2000000000LL;
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (mid * (mid + 1) / 2 >= n) hi = mid;
        else lo = mid + 1;
    }
    long long k = lo;
    long long m = k - 1;
    long long sumaCompleta = m * (m + 1) * (m + 2) / 6;
    long long pozitie = n - m * (m + 1) / 2;
    long long sumaPartiala = pozitie * (pozitie + 1) / 2;
    cout << (sumaCompleta + sumaPartiala) << "\\n";
    return 0;
}
`,
    py: `n = int(input())
lo, hi = 1, 2000000000
while lo < hi:
    mid = (lo + hi) // 2
    if mid * (mid + 1) // 2 >= n:
        hi = mid
    else:
        lo = mid + 1
k = lo
m = k - 1
suma_completa = m * (m + 1) * (m + 2) // 6
pozitie = n - m * (m + 1) // 2
suma_partiala = pozitie * (pozitie + 1) // 2
print(suma_completa + suma_partiala)
`,
    tests: ["1", "3", "6", "10", "1000000000"],
  },
  {
    slug: "al-n-lea-termen-sir-descrescator-grupuri",
    title: "Al n-lea termen al sirului 1, 2 1, 3 2 1, 4 3 2 1, ...",
    difficulty: "hard",
    tags: ["siruri", "generare", "cautare-binara", "grupuri"],
    statement: "Se considera sirul obtinut prin concatenarea grupurilor 1; 2, 1; 3, 2, 1; 4, 3, 2, 1; ... (grupul k contine numerele de la k la 1, in ordine descrescatoare): 1, 2, 1, 3, 2, 1, 4, 3, 2, 1, .... Se citeste un numar natural n. Determinati al n-lea termen al acestui sir.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza al n-lea termen al sirului.",
    constraints: "1 <= n <= 1000000000",
    hints: "La fel ca la sirul crescator, determinati grupul k si pozitia p in interiorul lui; de data aceasta, valoarea de pe pozitia p este k - p + 1 (deoarece grupul e in ordine descrescatoare).",
    explanation: "Se determina, la fel ca la sirul crescator, grupul k caruia ii apartine pozitia n (cel mai mic k cu S(k)=k(k+1)/2 >= n) si pozitia p = n - S(k-1) in interiorul grupului. De data aceasta grupul contine valorile k, k-1, ..., 1 in aceasta ordine, deci valoarea de pe pozitia p (1-indexata) este k - p + 1.\n\n**Complexitate:** O(log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n; cin >> n;
    long long lo = 1, hi = 2000000000LL;
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (mid * (mid + 1) / 2 >= n) hi = mid;
        else lo = mid + 1;
    }
    long long k = lo;
    long long sk1 = (k - 1) * k / 2;
    long long p = n - sk1;
    cout << (k - p + 1) << "\\n";
    return 0;
}
`,
    py: `n = int(input())
lo, hi = 1, 2000000000
while lo < hi:
    mid = (lo + hi) // 2
    if mid * (mid + 1) // 2 >= n:
        hi = mid
    else:
        lo = mid + 1
k = lo
sk1 = (k - 1) * k // 2
p = n - sk1
print(k - p + 1)
`,
    tests: ["1", "2", "3", "7", "1000000000"],
  },
  {
    slug: "al-n-lea-termen-sir-repetitii-k-ori",
    title: "Al n-lea termen al sirului 1, 2 2, 3 3 3, 4 4 4 4, ...",
    difficulty: "hard",
    tags: ["siruri", "generare", "cautare-binara", "grupuri"],
    statement: "Se considera sirul in care fiecare numar natural k apare de exact k ori, in ordine: 1, 2, 2, 3, 3, 3, 4, 4, 4, 4, .... Se citeste un numar natural n. Determinati al n-lea termen al acestui sir.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza al n-lea termen al sirului.",
    constraints: "1 <= n <= 1000000000",
    hints: "Numarul k ocupa pozitiile de la S(k-1)+1 la S(k), unde S(k)=k*(k+1)/2. Cautati binar cel mai mic k pentru care S(k) >= n; acesta este chiar raspunsul.",
    explanation: "La fel ca in problemele anterioare, se cauta binar cel mai mic k astfel incat S(k) = k*(k+1)/2 >= n. Deoarece grupul k contine k copii ale valorii k (pozitiile S(k-1)+1 pana la S(k)), pozitia n cade in acest grup, iar valoarea de pe orice pozitie din el este chiar k.\n\n**Complexitate:** O(log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n; cin >> n;
    long long lo = 1, hi = 2000000000LL;
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (mid * (mid + 1) / 2 >= n) hi = mid;
        else lo = mid + 1;
    }
    cout << lo << "\\n";
    return 0;
}
`,
    py: `n = int(input())
lo, hi = 1, 2000000000
while lo < hi:
    mid = (lo + hi) // 2
    if mid * (mid + 1) // 2 >= n:
        hi = mid
    else:
        lo = mid + 1
print(lo)
`,
    tests: ["1", "2", "3", "6", "1000000000"],
  },
  {
    slug: "sirul-lui-recaman",
    title: "Al n-lea termen al sirului lui Recaman",
    difficulty: "medium",
    tags: ["recaman", "siruri", "generare"],
    statement: "Sirul lui Recaman este definit prin a(0)=0, iar pentru n>=1: a(n) = a(n-1) - n, daca aceasta valoare este pozitiva si nu a mai aparut anterior in sir; altfel, a(n) = a(n-1) + n. Se citeste un numar natural n. Determinati a(n).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza valoarea a(n).",
    constraints: "0 <= n <= 100000",
    hints: "Generati sirul pas cu pas, retinand intr-o multime toate valorile deja folosite, pentru a verifica rapid daca a(n-1)-n a mai aparut.",
    explanation: "Se genereaza sirul iterativ, pastrand o multime (set) cu toate valorile aparute pana acum. La fiecare pas, se calculeaza candidatul a(n-1) - n; daca acesta este pozitiv si nu se afla in multime, devine a(n); altfel, a(n) = a(n-1) + n. Noua valoare se adauga in multime.\n\n**Complexitate:** O(n log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> a(n + 1);
    set<long long> folosite;
    a[0] = 0;
    folosite.insert(0);
    for (int i = 1; i <= n; i++) {
        long long candidat = a[i - 1] - i;
        if (candidat > 0 && folosite.find(candidat) == folosite.end()) a[i] = candidat;
        else a[i] = a[i - 1] + i;
        folosite.insert(a[i]);
    }
    cout << a[n] << "\\n";
    return 0;
}
`,
    py: `n = int(input())
a = [0] * (n + 1)
folosite = {0}
for i in range(1, n + 1):
    candidat = a[i - 1] - i
    if candidat > 0 and candidat not in folosite:
        a[i] = candidat
    else:
        a[i] = a[i - 1] + i
    folosite.add(a[i])
print(a[n])
`,
    tests: ["0", "1", "5", "6", "20"],
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
