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

const OUT_FMT_DA_NU = "Se afiseaza DA daca numarul este divizibil, respectiv NU in caz contrar.";
const IN_FMT_NUMAR_MARE = "Se citeste un numar natural, scris in baza 10, care poate avea foarte multe cifre (prea multe pentru a incapea intr-un tip intreg obisnuit).";

const problems = [
  {
    slug: "divizibilitate-cu-2",
    title: "Criteriul de divizibilitate cu 2",
    difficulty: "easy",
    tags: ["baze-de-numeratie", "divizibilitate", "criterii"],
    statement: "Se citeste un numar natural, posibil foarte mare (dat ca sir de cifre). Verificati daca este divizibil cu 2, aplicand criteriul de divizibilitate: un numar este divizibil cu 2 daca si numai daca ultima sa cifra este para.",
    input_format: IN_FMT_NUMAR_MARE,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= numarul de cifre <= 200",
    hints: "Verificati doar ultima cifra a numarului (ultimul caracter al sirului).",
    explanation: "Se verifica direct criteriul de divizibilitate cu 2: se extrage ultima cifra a numarului (ultimul caracter al sirului) si se verifica daca este para (0, 2, 4, 6 sau 8); acest lucru este echivalent cu divizibilitatea intregului numar cu 2, indiferent cat de mare este acesta.\n\n**Complexitate:** O(1)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    int ultima = s.back() - '0';
    cout << (ultima % 2 == 0 ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s = input()
ultima = int(s[-1])
print("DA" if ultima % 2 == 0 else "NU")
`,
    tests: ["1234", "1235", "0", "999999999999999999999999999999999999", "100000000000000000000000000000000000"],
  },
  {
    slug: "divizibilitate-cu-3",
    title: "Criteriul de divizibilitate cu 3",
    difficulty: "easy",
    tags: ["baze-de-numeratie", "divizibilitate", "criterii"],
    statement: "Se citeste un numar natural, posibil foarte mare. Verificati daca este divizibil cu 3, aplicand criteriul de divizibilitate: un numar este divizibil cu 3 daca si numai daca suma cifrelor sale este divizibila cu 3.",
    input_format: IN_FMT_NUMAR_MARE,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= numarul de cifre <= 200",
    hints: "Insumati toate cifrele numarului si verificati daca suma este divizibila cu 3.",
    explanation: "Se calculeaza suma tuturor cifrelor numarului, apoi se verifica daca aceasta suma este divizibila cu 3; conform criteriului de divizibilitate cu 3, aceasta este echivalent cu divizibilitatea numarului original.\n\n**Complexitate:** O(numarul de cifre)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    long long suma = 0;
    for (char c : s) suma += c - '0';
    cout << (suma % 3 == 0 ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s = input()
suma = sum(int(c) for c in s)
print("DA" if suma % 3 == 0 else "NU")
`,
    tests: ["123", "124", "999999999999999999999999999999999999", "111111111111111111111111111111111111", "10"],
  },
  {
    slug: "divizibilitate-cu-4",
    title: "Criteriul de divizibilitate cu 4",
    difficulty: "medium",
    tags: ["baze-de-numeratie", "divizibilitate", "criterii"],
    statement: "Se citeste un numar natural, posibil foarte mare. Verificati daca este divizibil cu 4, aplicand criteriul de divizibilitate: un numar este divizibil cu 4 daca si numai daca numarul format din ultimele sale doua cifre este divizibil cu 4.",
    input_format: IN_FMT_NUMAR_MARE,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= numarul de cifre <= 200",
    hints: "Extrageti ultimele doua cifre ale numarului (sau doar ultima, daca numarul are o singura cifra) si formati numarul lor.",
    explanation: "Se extrag ultimele doua cifre ale numarului si se formeaza numarul pe care il reprezinta (daca numarul are o singura cifra, se considera doar aceasta); conform criteriului de divizibilitate cu 4, numarul original este divizibil cu 4 daca si numai daca acest numar format din ultimele doua cifre este divizibil cu 4.\n\n**Complexitate:** O(1)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    int n = s.size();
    int ultimele2 = (n == 1) ? (s[0] - '0') : ((s[n - 2] - '0') * 10 + (s[n - 1] - '0'));
    cout << (ultimele2 % 4 == 0 ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s = input()
n = len(s)
ultimele2 = int(s[0]) if n == 1 else int(s[-2:])
print("DA" if ultimele2 % 4 == 0 else "NU")
`,
    tests: ["1236", "1234", "8", "100000000000000000000000000000000012", "100000000000000000000000000000000014"],
  },
  {
    slug: "divizibilitate-cu-5",
    title: "Criteriul de divizibilitate cu 5",
    difficulty: "easy",
    tags: ["baze-de-numeratie", "divizibilitate", "criterii"],
    statement: "Se citeste un numar natural, posibil foarte mare. Verificati daca este divizibil cu 5, aplicand criteriul de divizibilitate: un numar este divizibil cu 5 daca si numai daca ultima sa cifra este 0 sau 5.",
    input_format: IN_FMT_NUMAR_MARE,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= numarul de cifre <= 200",
    hints: "Verificati doar ultima cifra a numarului.",
    explanation: "Se verifica direct criteriul de divizibilitate cu 5: numarul este divizibil cu 5 daca si numai daca ultima sa cifra este 0 sau 5.\n\n**Complexitate:** O(1)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    char ultima = s.back();
    cout << ((ultima == '0' || ultima == '5') ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s = input()
ultima = s[-1]
print("DA" if ultima in ("0", "5") else "NU")
`,
    tests: ["1230", "1235", "1233", "0", "999999999999999999999999999999999995"],
  },
  {
    slug: "divizibilitate-cu-8",
    title: "Criteriul de divizibilitate cu 8",
    difficulty: "medium",
    tags: ["baze-de-numeratie", "divizibilitate", "criterii"],
    statement: "Se citeste un numar natural, posibil foarte mare. Verificati daca este divizibil cu 8, aplicand criteriul de divizibilitate: un numar este divizibil cu 8 daca si numai daca numarul format din ultimele sale trei cifre este divizibil cu 8.",
    input_format: IN_FMT_NUMAR_MARE,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= numarul de cifre <= 200",
    hints: "Extrageti ultimele (cel mult) trei cifre ale numarului si formati numarul lor.",
    explanation: "Se extrag ultimele (cel mult) trei cifre ale numarului (mai putine, daca numarul are sub 3 cifre) si se formeaza numarul pe care il reprezinta; conform criteriului de divizibilitate cu 8, numarul original este divizibil cu 8 daca si numai daca acest numar este divizibil cu 8.\n\n**Complexitate:** O(1)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    int n = s.size();
    string sufix = (n >= 3) ? s.substr(n - 3) : s;
    int val = 0;
    for (char c : sufix) val = val * 10 + (c - '0');
    cout << (val % 8 == 0 ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s = input()
sufix = s[-3:] if len(s) >= 3 else s
val = int(sufix)
print("DA" if val % 8 == 0 else "NU")
`,
    tests: ["1000", "1234", "16", "100000000000000000000000000000000104", "100000000000000000000000000000000103"],
  },
  {
    slug: "divizibilitate-cu-9",
    title: "Criteriul de divizibilitate cu 9",
    difficulty: "easy",
    tags: ["baze-de-numeratie", "divizibilitate", "criterii"],
    statement: "Se citeste un numar natural, posibil foarte mare. Verificati daca este divizibil cu 9, aplicand criteriul de divizibilitate: un numar este divizibil cu 9 daca si numai daca suma cifrelor sale este divizibila cu 9.",
    input_format: IN_FMT_NUMAR_MARE,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= numarul de cifre <= 200",
    hints: "Insumati toate cifrele numarului si verificati daca suma este divizibila cu 9.",
    explanation: "Se calculeaza suma tuturor cifrelor numarului, apoi se verifica daca aceasta suma este divizibila cu 9; conform criteriului de divizibilitate cu 9, aceasta este echivalent cu divizibilitatea numarului original.\n\n**Complexitate:** O(numarul de cifre)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    long long suma = 0;
    for (char c : s) suma += c - '0';
    cout << (suma % 9 == 0 ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s = input()
suma = sum(int(c) for c in s)
print("DA" if suma % 9 == 0 else "NU")
`,
    tests: ["18", "19", "999999999999999999999999999999999999", "123456789", "10"],
  },
  {
    slug: "divizibilitate-cu-11",
    title: "Criteriul de divizibilitate cu 11",
    difficulty: "hard",
    tags: ["baze-de-numeratie", "divizibilitate", "criterii"],
    statement: "Se citeste un numar natural, posibil foarte mare. Verificati daca este divizibil cu 11, aplicand criteriul de divizibilitate: un numar este divizibil cu 11 daca si numai daca diferenta alternanta a cifrelor sale (calculata de la cifra unitatilor, alternand semnul + si -) este divizibila cu 11.",
    input_format: IN_FMT_NUMAR_MARE,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= numarul de cifre <= 200",
    hints: "Parcurgeti cifrele de la ultima catre prima, adunand-le cu semn alternant (+, -, +, -, ...), incepand cu +.",
    explanation: "Se parcurg cifrele numarului de la ultima (cifra unitatilor) catre prima, adunandu-le la o suma cu semn alternant: prima cifra parcursa (ultima din numar) cu semnul +, urmatoarea cu -, si tot asa. Conform criteriului de divizibilitate cu 11, numarul original este divizibil cu 11 daca si numai daca aceasta suma alternanta este divizibila cu 11 (inclusiv 0).\n\n**Complexitate:** O(numarul de cifre)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    long long suma = 0;
    int semn = 1;
    for (int i = (int)s.size() - 1; i >= 0; i--) {
        suma += semn * (long long)(s[i] - '0');
        semn = -semn;
    }
    cout << (suma % 11 == 0 ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s = input()
suma = 0
semn = 1
for c in reversed(s):
    suma += semn * int(c)
    semn = -semn
print("DA" if suma % 11 == 0 else "NU")
`,
    tests: ["121", "123", "1331", "11", "918082"],
  },
  {
    slug: "divizibilitate-cu-25",
    title: "Criteriul de divizibilitate cu 25",
    difficulty: "medium",
    tags: ["baze-de-numeratie", "divizibilitate", "criterii"],
    statement: "Se citeste un numar natural, posibil foarte mare. Verificati daca este divizibil cu 25, aplicand criteriul de divizibilitate: un numar este divizibil cu 25 daca si numai daca numarul format din ultimele sale doua cifre este divizibil cu 25 (adica se termina in 00, 25, 50 sau 75).",
    input_format: IN_FMT_NUMAR_MARE,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= numarul de cifre <= 200",
    hints: "Extrageti ultimele doua cifre ale numarului (sau doar ultima, daca numarul are o singura cifra) si verificati daca formeaza un multiplu de 25.",
    explanation: "Se extrag ultimele doua cifre ale numarului si se formeaza numarul pe care il reprezinta; conform criteriului de divizibilitate cu 25, numarul original este divizibil cu 25 daca si numai daca acest numar format din ultimele doua cifre este divizibil cu 25.\n\n**Complexitate:** O(1)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    int n = s.size();
    int ultimele2 = (n == 1) ? (s[0] - '0') : ((s[n - 2] - '0') * 10 + (s[n - 1] - '0'));
    cout << (ultimele2 % 25 == 0 ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s = input()
n = len(s)
ultimele2 = int(s[0]) if n == 1 else int(s[-2:])
print("DA" if ultimele2 % 25 == 0 else "NU")
`,
    tests: ["1275", "1230", "100000000000000000000000000000000000", "100000000000000000000000000000000050", "13"],
  },
  {
    slug: "cmmdc-euclid-binar",
    title: "Cel mai mare divizor comun, prin algoritmul lui Euclid binar",
    difficulty: "hard",
    tags: ["baze-de-numeratie", "cmmdc", "bitwise"],
    statement: "Se citesc doua numere naturale a si b. Determinati cel mai mare divizor comun al lor, folosind algoritmul lui Euclid binar (algoritmul lui Stein), care foloseste doar operatii pe biti (deplasari si scaderi), fara impartiri.",
    input_format: "Se citesc a si b.",
    output_format: "Se afiseaza cel mai mare divizor comun al lui a si b.",
    constraints: "0 <= a, b <= 10^18, cel putin unul dintre a, b este nenul",
    hints: "Extrageti mai intai factorii comuni de 2 (cat timp ambele numere sunt pare, impartiti-le simultan la 2, numarand de cate ori); apoi, repetat, eliminati factorii de 2 ramasi din fiecare numar si scadeti-le pe cel mai mic din cel mai mare.",
    explanation: "Algoritmul lui Stein foloseste proprietatile: cmmdc(0,b)=b si cmmdc(a,0)=a; daca a si b sunt ambele pare, cmmdc(a,b)=2*cmmdc(a/2,b/2); daca doar unul este par, factorul de 2 poate fi eliminat din el fara a afecta cmmdc; daca ambele sunt impare, cmmdc(a,b)=cmmdc(|a-b|,min(a,b)). Se extrage mai intai numarul de factori comuni de 2 (deplasand ambele numere simultan la dreapta cat timp ambele sunt pare), apoi se elimina factorii de 2 ramasi individual si se aplica repetat scaderea intre numere impare, pana cand unul devine 0; raspunsul este celalalt numar, inmultit inapoi cu factorii comuni de 2 extrasi initial.\n\n**Complexitate:** O(log(min(a,b)))",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long a, b; cin >> a >> b;
    if (a == 0) { cout << b << "\\n"; return 0; }
    if (b == 0) { cout << a << "\\n"; return 0; }
    int shift = 0;
    while (((a | b) & 1) == 0) { a >>= 1; b >>= 1; shift++; }
    while ((a & 1) == 0) a >>= 1;
    while (b != 0) {
        while ((b & 1) == 0) b >>= 1;
        if (a > b) swap(a, b);
        b -= a;
    }
    cout << (a << shift) << "\\n";
    return 0;
}
`,
    py: `a, b = map(int, input().split())
if a == 0:
    print(b)
elif b == 0:
    print(a)
else:
    shift = 0
    while (a | b) & 1 == 0:
        a >>= 1
        b >>= 1
        shift += 1
    while a & 1 == 0:
        a >>= 1
    while b != 0:
        while b & 1 == 0:
            b >>= 1
        if a > b:
            a, b = b, a
        b -= a
    print(a << shift)
`,
    tests: ["48 18", "17 13", "1000000 625", "0 5", "270 192"],
  },
  {
    slug: "numarare-cifre-in-baza-b",
    title: "Numarul de cifre ale unui numar intr-o baza data",
    difficulty: "medium",
    tags: ["baze-de-numeratie", "conversie"],
    statement: "Se citesc un numar natural n si un numar natural b (2 <= b <= 16). Determinati din cate cifre este formata reprezentarea lui n in baza b, fara a construi efectiv sirul de cifre.",
    input_format: "Se citesc n si b.",
    output_format: "Se afiseaza numarul de cifre ale reprezentarii lui n in baza b.",
    constraints: "0 <= n <= 10^18, 2 <= b <= 16",
    hints: "Impartiti repetat n la b, numarand de cate ori se poate face acest lucru pana cand n devine 0 (tratati separat cazul n=0, care are o singura cifra).",
    explanation: "Se imparte repetat n la b, incrementand un contor la fiecare impartire, pana cand n devine 0; numarul de impartiri efectuate este numarul de cifre ale reprezentarii lui n in baza b. Cazul special n=0 este tratat separat, avand o singura cifra ('0').\n\n**Complexitate:** O(log_b n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n, b; cin >> n >> b;
    if (n == 0) { cout << 1 << "\\n"; return 0; }
    int cnt = 0;
    while (n > 0) { cnt++; n /= b; }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `n, b = map(int, input().split())
if n == 0:
    print(1)
else:
    cnt = 0
    while n > 0:
        cnt += 1
        n //= b
    print(cnt)
`,
    tests: ["255 16", "255 2", "1000000 10", "0 5", "1 2"],
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
