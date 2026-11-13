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

const OUT_FMT_DA_NU = "Se afiseaza DA daca proprietatea este adevarata, respectiv NU in caz contrar.";

const problems = [
  {
    slug: "exponentiere-rapida-iterativa",
    title: "Exponentiere rapida (a^n modulo p), varianta iterativa",
    difficulty: "medium",
    tags: ["baze-de-numeratie", "exponentiere-rapida", "modulo"],
    statement: "Se citesc trei numere naturale a, n si p. Determinati a^n modulo p, folosind exponentiere rapida (bazata pe reprezentarea binara a exponentului n), in loc de a inmulti a cu el insusi de n ori.",
    input_format: "Se citesc a, n si p.",
    output_format: "Se afiseaza a^n modulo p.",
    constraints: "0 <= a < 10^9, 0 <= n <= 10^18, 2 <= p <= 10^9",
    hints: "La fiecare pas, daca bitul curent al lui n este 1, inmultiti rezultatul cu baza curenta (modulo p); apoi ridicati baza la patrat (modulo p) si treceti la bitul urmator al lui n (impartire intreaga la 2).",
    explanation: "Exponentierea rapida foloseste reprezentarea binara a exponentului n: a^n = produsul dintre a^(2^k) pentru fiecare bit k al lui n care este 1. Se porneste cu rezultatul 1 si baza a; cat timp n este pozitiv, daca bitul cel mai putin semnificativ al lui n este 1, rezultatul se inmulteste cu baza curenta (modulo p); apoi baza se ridica la patrat (modulo p), iar n se imparte intreg la 2. Aceasta reduce numarul de inmultiri de la n la O(log n).\n\n**Complexitate:** O(log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
int main() {
    ll a, n, p; cin >> a >> n >> p;
    ll baza = a % p, rez = 1 % p;
    while (n > 0) {
        if (n & 1) rez = (rez * baza) % p;
        baza = (baza * baza) % p;
        n >>= 1;
    }
    cout << rez << "\\n";
    return 0;
}
`,
    py: `a, n, p = map(int, input().split())
baza, rez = a % p, 1 % p
while n > 0:
    if n & 1:
        rez = (rez * baza) % p
    baza = (baza * baza) % p
    n >>= 1
print(rez)
`,
    tests: ["2 10 1000", "3 5 100", "7 0 13", "123456789 987654321 1000000007", "2 62 1000000007"],
  },
  {
    slug: "exponentiere-rapida-recursiva",
    title: "Exponentiere rapida (a^n modulo p), varianta recursiva",
    difficulty: "medium",
    tags: ["baze-de-numeratie", "exponentiere-rapida", "modulo", "recursivitate"],
    statement: "Se citesc trei numere naturale a, n si p. Determinati a^n modulo p, implementand exponentierea rapida recursiv: a^n = (a^(n/2))^2 daca n este par, respectiv a * a^(n-1) daca n este impar, cu cazul de baza a^0 = 1.",
    input_format: "Se citesc a, n si p.",
    output_format: "Se afiseaza a^n modulo p.",
    constraints: "0 <= a < 10^9, 0 <= n <= 10^18, 2 <= p <= 10^9",
    hints: "Scrieti o functie recursiva putere(a, n) care calculeaza mai intai jumatate = putere(a, n/2), apoi combina rezultatul prin ridicare la patrat, inmultind suplimentar cu a daca n este impar.",
    explanation: "Se defineste o functie recursiva care calculeaza a^n modulo p: cazul de baza este n=0, cu rezultat 1 modulo p; altfel, se calculeaza mai intai jumatate = a^(n/2) (prin apel recursiv, cu impartire intreaga), apoi rezultatul este jumatate*jumatate modulo p, la care se mai inmulteste cu a modulo p daca n este impar. Adancimea recursiei este O(log n).\n\n**Complexitate:** O(log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
ll p;
ll putere(ll a, ll n) {
    if (n == 0) return 1 % p;
    ll jumatate = putere(a, n / 2);
    ll rez = (jumatate * jumatate) % p;
    if (n % 2 == 1) rez = (rez * (a % p)) % p;
    return rez;
}
int main() {
    ll a, n; cin >> a >> n >> p;
    cout << putere(a, n) << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

def putere(a, n, p):
    if n == 0:
        return 1 % p
    jumatate = putere(a, n // 2, p)
    rez = (jumatate * jumatate) % p
    if n % 2 == 1:
        rez = (rez * (a % p)) % p
    return rez

a, n, p = map(int, input().split())
print(putere(a, n, p))
`,
    tests: ["2 10 1000", "3 5 100", "7 0 13", "123456789 987654321 1000000007", "2 62 1000000007"],
  },
  {
    slug: "numarare-biti-de-1",
    title: "Numararea bitilor de 1 din reprezentarea binara a unui numar",
    difficulty: "easy",
    tags: ["baze-de-numeratie", "binar", "bitwise"],
    statement: "Se citeste un numar natural n. Determinati cati biti de 1 are reprezentarea sa in baza 2 (asa-numitul 'popcount').",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul de biti de 1.",
    constraints: "0 <= n <= 10^18",
    hints: "Verificati repetat ultimul bit al lui n (n modulo 2), incrementand un contor daca este 1, apoi deplasati n cu un bit la dreapta (impartire la 2).",
    explanation: "Se extrage repetat ultimul bit al lui n (restul impartirii la 2); daca acest bit este 1, se incrementeaza un contor. Apoi n se imparte intreg la 2 (echivalent cu o deplasare la dreapta), eliminand bitul deja procesat. Procesul continua pana cand n devine 0.\n\n**Complexitate:** O(log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n; cin >> n;
    int cnt = 0;
    while (n > 0) { cnt += (n & 1); n >>= 1; }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `n = int(input())
cnt = 0
while n > 0:
    cnt += n & 1
    n >>= 1
print(cnt)
`,
    tests: ["7", "8", "255", "1023", "1000000000000"],
  },
  {
    slug: "verificare-putere-a-lui-doi",
    title: "Verificarea daca un numar este putere a lui 2",
    difficulty: "medium",
    tags: ["baze-de-numeratie", "binar", "bitwise"],
    statement: "Se citeste un numar natural n. Verificati daca n este o putere a lui 2 (adica n = 2^k, pentru un k natural), folosind proprietatea ca reprezentarea binara a unei puteri a lui 2 contine exact un singur bit de 1.",
    input_format: "Se citeste un numar natural n.",
    output_format: OUT_FMT_DA_NU,
    constraints: "0 <= n <= 10^18",
    hints: "Un numar n>0 este putere a lui 2 daca si numai daca expresia n & (n-1) este egala cu 0 (aceasta operatie elimina bitul de 1 cel mai putin semnificativ; daca mai ramane vreun bit de 1, n nu era o singura putere de 2).",
    explanation: "Se foloseste proprietatea bitwise: pentru n strict pozitiv, n & (n-1) elimina bitul cel mai putin semnificativ care este 1; daca rezultatul este 0, inseamna ca n avea exact un singur bit de 1 in reprezentarea binara, deci este o putere a lui 2. Cazul n=0 este tratat separat, nefiind o putere a lui 2.\n\n**Complexitate:** O(1)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n; cin >> n;
    bool ok = (n > 0) && ((n & (n - 1)) == 0);
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `n = int(input())
ok = n > 0 and (n & (n - 1)) == 0
print("DA" if ok else "NU")
`,
    tests: ["1", "2", "3", "1024", "1000000000"],
  },
  {
    slug: "codul-gray",
    title: "Codul Gray al unui numar",
    difficulty: "medium",
    tags: ["baze-de-numeratie", "binar", "cod-gray"],
    statement: "Codul Gray al unui numar natural n se calculeaza prin g = n XOR (n impartit la 2, cu deplasare la dreapta). Se citeste un numar natural n. Determinati reprezentarea in baza 2 a codului Gray corespunzator.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza reprezentarea in baza 2 a codului Gray al lui n.",
    constraints: "0 <= n <= 10^18",
    hints: "Calculati g = n XOR (n >> 1), apoi convertiti g in baza 2.",
    explanation: "Codul Gray al lui n se calculeaza direct cu formula g = n XOR (n deplasat cu un bit la dreapta, echivalent cu impartirea intreaga la 2). Doua numere consecutive au coduri Gray care difera printr-un singur bit. Dupa calcularea lui g, acesta se converteste in baza 2 prin impartiri repetate la 2.\n\n**Complexitate:** O(log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n; cin >> n;
    long long g = n ^ (n >> 1);
    if (g == 0) { cout << 0 << "\\n"; return 0; }
    string rez = "";
    while (g > 0) { rez += char('0' + g % 2); g /= 2; }
    reverse(rez.begin(), rez.end());
    cout << rez << "\\n";
    return 0;
}
`,
    py: `n = int(input())
g = n ^ (n >> 1)
if g == 0:
    print(0)
else:
    rez = []
    while g > 0:
        rez.append(str(g % 2))
        g //= 2
    print("".join(reversed(rez)))
`,
    tests: ["0", "1", "2", "5", "8"],
  },
  {
    slug: "complement-fata-de-2",
    title: "Complementul fata de 2 al unui numar, pe un numar dat de biti",
    difficulty: "hard",
    tags: ["baze-de-numeratie", "binar", "complement"],
    statement: "Se citesc un numar natural n si un numar natural k, unde 0 <= n < 2^k. Determinati reprezentarea binara, pe exact k biti (cu eventuale zerouri nesemnificative la stanga), a complementului fata de 2 al lui n (adica reprezentarea pe k biti a lui -n, folosita pentru numere intregi cu semn).",
    input_format: "Se citesc n si k.",
    output_format: "Se afiseaza reprezentarea binara a complementului fata de 2, pe exact k caractere.",
    constraints: "1 <= k <= 40, 0 <= n < 2^k",
    hints: "Complementul fata de 2 al lui n, pe k biti, este (2^k - n) modulo 2^k. Convertiti aceasta valoare in binar, completand cu zerouri la stanga pana la exact k cifre.",
    explanation: "Complementul fata de 2 al lui n, reprezentat pe k biti, se calculeaza ca (2^k - n) modulo 2^k (scaderea modulo 2^k este necesara pentru cazul n=0, cand rezultatul trebuie sa fie 0, nu 2^k). Se converteste aceasta valoare in baza 2, generand exact k cifre (completand cu zerouri nesemnificative la stanga, daca este nevoie), deoarece reprezentarea pe biti are o lungime fixa.\n\n**Complexitate:** O(k)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n, k; cin >> n >> k;
    long long total = 1LL << k;
    long long comp = (total - n) % total;
    string rez = "";
    for (int i = 0; i < k; i++) { rez += char('0' + (comp % 2)); comp /= 2; }
    reverse(rez.begin(), rez.end());
    cout << rez << "\\n";
    return 0;
}
`,
    py: `n, k = map(int, input().split())
total = 1 << k
comp = (total - n) % total
rez = []
for _ in range(k):
    rez.append(str(comp % 2))
    comp //= 2
print("".join(reversed(rez)))
`,
    tests: ["0 4", "5 4", "1 8", "8 4", "0 8"],
  },
  {
    slug: "adunare-in-baza-b",
    title: "Adunarea a doua numere reprezentate intr-o baza data",
    difficulty: "hard",
    tags: ["baze-de-numeratie", "adunare", "conversie"],
    statement: "Se citesc o baza b (2 <= b <= 16) si doua numere, reprezentate ca siruri de cifre in baza b (cifre 0-9 si litere mari A-F). Determinati suma lor, tot ca reprezentare in baza b, fara a converti numerele in baza 10.",
    input_format: "Se citesc, pe aceeasi linie, baza b si cele doua numere (ca siruri de cifre in baza b).",
    output_format: "Se afiseaza suma celor doua numere, in baza b.",
    constraints: "2 <= b <= 16, 1 <= numarul de cifre al fiecarui numar <= 100",
    hints: "Adunati cifrele de la dreapta la stanga, ca la adunarea clasica pe hartie, retinand transportul (carry) intre pozitii; la fiecare pas, suma a doua cifre plus transportul se imparte la b, restul fiind noua cifra iar catul, noul transport.",
    explanation: "Se aduna cele doua numere cifra cu cifra, de la ultima catre prima, mentinand un transport (carry) intre pozitii, la fel ca la adunarea clasica invatata la scoala, dar folosind baza b in loc de 10: la fiecare pas se calculeaza suma valorilor celor doua cifre curente (0 daca unul dintre numere s-a terminat) plus transportul; noua cifra a rezultatului este aceasta suma modulo b, iar noul transport este suma impartita intreg la b. Rezultatul construit invers se inverseaza la final, iar eventualele zerouri nesemnificative se elimina.\n\n**Complexitate:** O(numarul maxim de cifre)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int b; string a1, a2; cin >> b >> a1 >> a2;
    string cifre = "0123456789ABCDEF";
    int i = a1.size() - 1, j = a2.size() - 1, carry = 0;
    string rez = "";
    while (i >= 0 || j >= 0 || carry > 0) {
        int x = (i >= 0) ? (int)cifre.find(a1[i]) : 0;
        int y = (j >= 0) ? (int)cifre.find(a2[j]) : 0;
        int suma = x + y + carry;
        rez += cifre[suma % b];
        carry = suma / b;
        i--; j--;
    }
    reverse(rez.begin(), rez.end());
    int start = 0;
    while (start < (int)rez.size() - 1 && rez[start] == '0') start++;
    cout << rez.substr(start) << "\\n";
    return 0;
}
`,
    py: `parts = input().split()
b, a1, a2 = int(parts[0]), parts[1], parts[2]
cifre = "0123456789ABCDEF"
i, j, carry = len(a1) - 1, len(a2) - 1, 0
rez = []
while i >= 0 or j >= 0 or carry > 0:
    x = cifre.index(a1[i]) if i >= 0 else 0
    y = cifre.index(a2[j]) if j >= 0 else 0
    suma = x + y + carry
    rez.append(cifre[suma % b])
    carry = suma // b
    i -= 1
    j -= 1
rez = "".join(reversed(rez))
start = 0
while start < len(rez) - 1 and rez[start] == "0":
    start += 1
print(rez[start:])
`,
    tests: ["2 1011 110", "16 FF 1", "8 77 1", "10 999 1", "16 A 5"],
  },
  {
    slug: "cea-mai-mica-putere-de-doi",
    title: "Cea mai mica putere a lui 2 mai mare sau egala cu n",
    difficulty: "easy",
    tags: ["baze-de-numeratie", "binar", "puteri-de-doi"],
    statement: "Se citeste un numar natural n. Determinati cea mai mica putere a lui 2 (2^k, pentru un k natural) care este mai mare sau egala cu n.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza cea mai mica putere a lui 2 mai mare sau egala cu n.",
    constraints: "1 <= n <= 10^18",
    hints: "Porniti de la puterea 1 (adica 2^0) si dublati-o repetat, cat timp este mai mica decat n.",
    explanation: "Se porneste cu o putere a lui 2 egala cu 1 (2^0) si se dubleaza repetat (echivalent cu o deplasare de un bit la stanga), cat timp aceasta este strict mai mica decat n. Cand puterea devine mai mare sau egala cu n, procesul se opreste, iar aceasta este raspunsul.\n\n**Complexitate:** O(log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n; cin >> n;
    long long p = 1;
    while (p < n) p <<= 1;
    cout << p << "\\n";
    return 0;
}
`,
    py: `n = int(input())
p = 1
while p < n:
    p <<= 1
print(p)
`,
    tests: ["1", "5", "8", "1000", "1000000000"],
  },
  {
    slug: "verificare-palindrom-in-baza-b",
    title: "Verificarea daca un numar este palindrom intr-o baza data",
    difficulty: "medium",
    tags: ["baze-de-numeratie", "palindrom", "conversie"],
    statement: "Se citesc un numar natural n si o baza b (2 <= b <= 16). Verificati daca reprezentarea lui n in baza b este un palindrom (se citeste la fel de la stanga la dreapta si de la dreapta la stanga).",
    input_format: "Se citesc n si b.",
    output_format: OUT_FMT_DA_NU,
    constraints: "0 <= n <= 10^15, 2 <= b <= 16",
    hints: "Convertiti mai intai n in baza b, obtinand sirul de cifre, apoi verificati daca acest sir este palindrom.",
    explanation: "Se converteste n in reprezentarea sa in baza b (prin impartiri repetate la b, ca in problemele de conversie), obtinand sirul de cifre. Apoi se verifica daca acest sir este palindrom, comparand caracterul de pe pozitia i cu cel de pe pozitia simetrica fata de mijloc, pentru toate pozitiile.\n\n**Complexitate:** O(log_b n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n, b; cin >> n >> b;
    string cifre = "0123456789ABCDEF";
    string s;
    if (n == 0) s = "0";
    else {
        long long m = n;
        while (m > 0) { s += cifre[m % b]; m /= b; }
        reverse(s.begin(), s.end());
    }
    bool ok = true;
    for (int i = 0, j = (int)s.size() - 1; i < j; i++, j--) if (s[i] != s[j]) ok = false;
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `n, b = map(int, input().split())
cifre = "0123456789ABCDEF"
if n == 0:
    s = "0"
else:
    m = n
    rez = []
    while m > 0:
        rez.append(cifre[m % b])
        m //= b
    s = "".join(reversed(rez))
ok = s == s[::-1]
print("DA" if ok else "NU")
`,
    tests: ["9 2", "10 2", "585 10", "17 4", "0 5"],
  },
  {
    slug: "ultima-cifra-putere-mare",
    title: "Ultima cifra a lui a la puterea b, pentru b foarte mare",
    difficulty: "medium",
    tags: ["baze-de-numeratie", "exponentiere-rapida", "modulo"],
    statement: "Se citesc doua numere naturale a si b, unde b poate fi foarte mare. Determinati ultima cifra (in baza 10) a numarului a^b, folosind exponentiere rapida modulo 10, fara a calcula efectiv a^b (care ar putea avea foarte multe cifre).",
    input_format: "Se citesc a si b.",
    output_format: "Se afiseaza ultima cifra a lui a^b.",
    constraints: "0 <= a < 10^9, 0 <= b <= 10^18, daca a=0 atunci b>=1",
    hints: "Ultima cifra a lui a^b este exact a^b modulo 10; calculati aceasta valoare cu exponentiere rapida.",
    explanation: "Ultima cifra a unui numar in baza 10 este exact restul impartirii lui la 10. Se calculeaza a^b modulo 10 folosind exponentiere rapida (aceeasi tehnica bazata pe reprezentarea binara a exponentului), fara a calcula niciodata valoarea completa a lui a^b, care ar putea fi enorma.\n\n**Complexitate:** O(log b)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
int main() {
    ll a, b; cin >> a >> b;
    ll p = 10;
    ll baza = a % p, rez = 1 % p;
    ll n = b;
    while (n > 0) {
        if (n & 1) rez = (rez * baza) % p;
        baza = (baza * baza) % p;
        n >>= 1;
    }
    cout << rez << "\\n";
    return 0;
}
`,
    py: `a, b = map(int, input().split())
p = 10
baza, rez = a % p, 1 % p
n = b
while n > 0:
    if n & 1:
        rez = (rez * baza) % p
    baza = (baza * baza) % p
    n >>= 1
print(rez)
`,
    tests: ["2 10", "7 100", "3 0", "5 999999999", "9 1000000000"],
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
