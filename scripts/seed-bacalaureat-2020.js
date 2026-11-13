const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const LEVEL = "bacalaureat";
const CHAPTER = { id: "bacalaureat-2020", name: "Bacalaureat 2020" };

function normalize(text) {
  return (text ?? "").trim().split(/\r?\n/).map((line) => line.trim()).join("\n");
}

async function runCustom(problemId, language, code, stdin) {
  const res = await fetch(`${API}/api/submissions/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problem_id: problemId, language, code, stdin, mode: "custom" }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`run failed: ${JSON.stringify(json)}`);
  return json.data;
}

const SRC = "Bacalaureat Informatica MI 2020 (Ministerul Educatiei / CNPEE)";

const problems = [
  // ===================== SESIUNEA VARA 2020 =====================
  {
    slug: "bac-vara-2020-3-1",
    subcategoryId: "vara-2020",
    title: "Bacalaureat Vara 2020, S3.1 - Suma divizorilor comuni",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "vara", "subiectul3", "divizori"],
    statement:
      "Subprogramul suma are doi parametri, a si b, prin care primeste cate un numar natural din intervalul [1,10^4]. Subprogramul returneaza suma divizorilor naturali comuni lui a si b.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca a=20 si b=12, atunci subprogramul returneaza valoarea 7 (1+2+4=7).",
    input_format: "Se citesc de la tastatura a si b.",
    output_format: "Se afiseaza valoarea returnata de subprogram.",
    constraints: "1 <= a, b <= 10^4",
    hints: "Parcurgeti d de la 1 pana la min(a,b) si adunati d la suma ori de cate ori d divide simultan a si b.",
    explanation:
      "Se parcurg toate valorile posibile d de la 1 pana la minimul dintre a si b (orice divizor comun este cel mult egal cu minimul celor doua numere); pentru fiecare d care divide simultan a si b, se aduna d la suma.\n\n**Complexitate:** O(min(a,b))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int a, b; cin >> a >> b;
    cout << suma(a, b) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

a, b = map(int, input().split())
print(suma(a, b))
`,
    cpp: `int suma(int a, int b) {
    int s = 0;
    int lim = min(a, b);
    for (int d = 1; d <= lim; d++) if (a % d == 0 && b % d == 0) s += d;
    return s;
}
`,
    py: `def suma(a, b):
    s = 0
    for d in range(1, min(a, b) + 1):
        if a % d == 0 and b % d == 0:
            s += d
    return s
`,
    tests: ["20 12", "1 1", "10000 10000", "7 13", "9999 3333"],
  },
  {
    slug: "bac-vara-2020-3-2",
    subcategoryId: "vara-2020",
    title: "Bacalaureat Vara 2020, S3.2 - Rotirea spre stanga a cuvintelor",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "vara", "subiectul3", "siruri-caractere"],
    statement:
      "Numim rotire spre stanga a unui cuvant format din cel putin trei litere operatia prin care prima sa litera se muta la final, iar toate celelalte litere se muta cu o pozitie spre stanga.\n\n" +
      "Exemplu: in urma rotirii spre stanga a cuvantului ilumina se obtine cuvantul luminai.\n\n" +
      "Un text are cel mult 100 de caractere, iar cuvintele sale sunt formate din litere mici ale alfabetului englez si sunt separate prin cate un spatiu. Scrieti un program C/C++ care citeste de la tastatura un text de tipul mentionat mai sus si il transforma in memorie prin rotirea spre stanga a fiecarui cuvant al sau format din cel putin trei litere. Programul afiseaza pe ecran textul obtinut sau mesajul nu exista, daca in text nu exista niciun cuvant de cel putin trei litere.\n\n" +
      "Exemplu: pentru textul un palc mic de scolarite ilumina sala se afiseaza pe ecran un alcp icm de colarites luminai alas",
    input_format: "Se citeste de la tastatura o linie de text (cuvinte separate prin spatiu).",
    output_format: "Se afiseaza textul obtinut prin rotirea spre stanga a fiecarui cuvant cu cel putin 3 litere, sau mesajul 'nu exista' daca niciun cuvant nu are cel putin 3 litere.",
    constraints: "textul are cel mult 100 de caractere",
    hints: "Pentru fiecare cuvant cu cel putin 3 litere, mutati primul caracter la finalul cuvantului. Retineti daca s-a facut macar o rotire, pentru a decide daca afisati textul sau mesajul cerut.",
    explanation:
      "Se citeste textul si se imparte in cuvinte (separate prin spatiu). Pentru fiecare cuvant cu lungimea de cel putin 3, se aplica rotirea (mutarea primului caracter la final, echivalent cu word.substr(1)+word[0]); celelalte cuvinte raman neschimbate. Daca niciun cuvant nu a fost rotit, se afiseaza mesajul cerut in locul textului.\n\n**Complexitate:** O(lungimea textului)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    string w;
    vector<string> words;
    bool any = false;
    while (ss >> w) {
        if ((int)w.size() >= 3) { w = w.substr(1) + w[0]; any = true; }
        words.push_back(w);
    }
    if (!any) { cout << "nu exista\\n"; return 0; }
    for (size_t i = 0; i < words.size(); i++) cout << words[i] << (i + 1 < words.size() ? " " : "\\n");
    return 0;
}
`,
    py: `line = input()
words = line.split()
any_rotated = False
rez = []
for w in words:
    if len(w) >= 3:
        w = w[1:] + w[0]
        any_rotated = True
    rez.append(w)
if not any_rotated:
    print("nu exista")
else:
    print(" ".join(rez))
`,
    tests: [
      "un palc mic de scolarite ilumina sala",
      "ab cd ef",
      "abc",
      "ilumina",
      "a bb ccc dddd",
    ],
  },
  {
    slug: "bac-vara-2020-3-3",
    subcategoryId: "vara-2020",
    title: "Bacalaureat Vara 2020, S3.3 - Verificare sir rearanjabil in palindrom",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "vara", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Un sir finit se numeste palindromic daca parcurgandu-l termen cu termen, de la stanga la dreapta sau de la dreapta la stanga se obtine acelasi sir de valori.\n\n" +
      "Exemplu: sirul 12, 13, 16, 13, 12 este palindromic.\n\n" +
      "Fisierul bac.in contine un sir de cel mult 10^6 numere naturale din intervalul [1,10^3], separate prin cate un spatiu. Se cere sa se afiseze pe ecran mesajul DA, daca numerele din sir pot fi rearanjate, astfel incat sa formeze un sir palindromic, sau mesajul NU in caz contrar. Proiectati un algoritm eficient din punctul de vedere al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine numerele 100 30 100 30 500 30 30 se afiseaza pe ecran DA",
    input_format: "Fisierul bac.in: un sir de numere naturale din [1,1000], separate prin spatiu.",
    output_format: "Se afiseaza 'DA' daca numerele pot fi rearanjate intr-un sir palindromic, altfel 'NU'.",
    constraints: "cel mult 10^6 termeni, fiecare in [1,1000]",
    hints: "Un multiset poate fi aranjat ca palindrom daca si numai daca cel mult o valoare are frecventa impara. Numarati aparitiile fiecarei valori posibile (1..1000) intr-un vector si verificati aceasta conditie.",
    explanation:
      "La fel ca la verificarea daca literele unui cuvant pot forma un palindrom, un multiset de numere poate fi rearanjat intr-un sir palindromic daca si numai daca cel mult o valoare distincta are un numar impar de aparitii (acea valoare, daca exista, ar ocupa pozitia centrala). Deoarece valorile posibile sunt doar 1..1000, se poate numara frecventa fiecareia intr-un vector mic, printr-o singura trecere prin fisier.\n\n**Complexitate:** O(n + 1000)",
    io: { input_source: "file", input_filename: "bac.in", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.in", "r", stdin);
    vector<long long> cnt(1001, 0);
    int v;
    while (cin >> v) cnt[v]++;
    int odd = 0;
    for (int i = 1; i <= 1000; i++) if (cnt[i] % 2 == 1) odd++;
    cout << (odd <= 1 ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `cnt = [0] * 1001
with open("bac.in") as f:
    data = f.read().split()
for tok in data:
    cnt[int(tok)] += 1
odd = sum(1 for i in range(1, 1001) if cnt[i] % 2 == 1)
print("DA" if odd <= 1 else "NU")
`,
    tests: [
      "100 30 100 30 500 30 30",
      "1 2 3",
      "5 5",
      "7",
      (() => {
        const parts = [];
        for (let v = 1; v <= 1000; v++) {
          const times = v === 500 ? 3 : 2;
          for (let t = 0; t < times; t++) parts.push(String(v));
        }
        for (let i = 0; i < 30000; i++) parts.push(String((i % 999) + 1));
        for (let v = 1; v <= 999; v++) parts.push(String(v));
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== MODEL 2020 =====================
  {
    slug: "bac-model-2020-3-1",
    subcategoryId: "model-2020",
    title: "Bacalaureat Model 2020, S3.1 - Duplicarea cifrelor impare",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "model", "subiectul3", "cifre"],
    statement:
      "Subprogramul duplicare are doi parametri:\n" +
      "- n, prin care primeste un numar natural (n in [1,10^4]);\n" +
      "- d, prin care furnizeaza numarul obtinut prin duplicarea fiecarei cifre impare a lui n sau -1 daca acesta nu are nicio cifra impara.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=2019, dupa apel d=201199.",
    input_format: "Se citeste de la tastatura numarul natural n.",
    output_format: "Se afiseaza valoarea d calculata de subprogram.",
    constraints: "1 <= n <= 10^4",
    hints: "Parcurgeti cifrele lui n de la stanga la dreapta (de exemplu convertind n la text); pentru fiecare cifra impara, scrieti-o de doua ori in rezultat, altfel o singura data. Daca nicio cifra nu a fost impara, raspunsul este -1.",
    explanation:
      "Se parcurg cifrele lui n in ordinea in care apar (de la stanga la dreapta), construind un rezultat: fiecare cifra para se copiaza o singura data, iar fiecare cifra impara se copiaza de doua ori consecutiv. Daca n nu are nicio cifra impara, rezultatul este -1; altfel, sirul de cifre construit se interpreteaza ca numarul d.\n\n**Complexitate:** O(numar de cifre)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int n; cin >> n;
    long long d;
    duplicare(n, d);
    cout << d << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(duplicare(n))
`,
    cpp: `void duplicare(int n, long long& d) {
    string s = to_string(n);
    string res = "";
    bool hasOdd = false;
    for (char c : s) {
        int dig = c - '0';
        if (dig % 2 == 1) { res += c; res += c; hasOdd = true; }
        else res += c;
    }
    d = hasOdd ? stoll(res) : -1;
}
`,
    py: `def duplicare(n):
    s = str(n)
    res = []
    has_odd = False
    for c in s:
        if int(c) % 2 == 1:
            res.append(c)
            res.append(c)
            has_odd = True
        else:
            res.append(c)
    return int("".join(res)) if has_odd else -1
`,
    tests: ["2019", "2468", "1", "9999", "10000"],
  },
  {
    slug: "bac-model-2020-3-2",
    subcategoryId: "model-2020",
    title: "Bacalaureat Model 2020, S3.2 - Grupare cuvinte dupa lungime",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "model", "subiectul3", "siruri-caractere"],
    statement:
      "Un text are cel mult 100 de caractere, iar cuvintele sale sunt formate numai din litere mici ale alfabetului englez si sunt separate prin cate un spatiu. Scrieti un program C/C++ care citeste de la tastatura un numar natural n (n in [1,10^2]), apoi un text de tipul precizat mai sus, si afiseaza pe ecran cuvintele acestuia, pe randuri separate, astfel incat primele pozitii sa fie ocupate de multimea formata de cele care au cel putin n litere, iar urmatoarele pozitii, in continuarea acestora, sa fie ocupate de multimea celorlalte cuvinte.\n\n" +
      "Cuvintele din aceeasi multime sunt afisate intr-o ordine oarecare, iar daca una dintre cele doua multimi este vida, se afiseaza pe ecran doar mesajul nu exista.\n\n" +
      "Exemplu: pentru n=5 si textul el mergea tot spre aleea pietruita, datele afisate pot fi: mergea, aleea, pietruita, el, tot, spre (fiecare pe cate un rand).",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citeste textul.",
    output_format:
      "Daca ambele multimi (cuvinte cu cel putin n litere, respectiv cu mai putin de n litere) sunt nevide, se afiseaza mai intai cuvintele din prima multime, apoi cele din a doua, cate unul pe linie (in ordinea din text). Daca una dintre multimi este vida, se afiseaza doar mesajul 'nu exista'.",
    constraints: "1 <= n <= 100, textul are cel mult 100 de caractere",
    hints: "Parcurgeti cuvintele textului si impartiti-le in doua liste, dupa cum au cel putin n litere sau nu. Daca vreuna dintre liste este vida, afisati doar mesajul cerut.",
    explanation:
      "Se citesc cuvintele textului si se impart in doua grupuri, pe baza lungimii lor comparate cu n. Daca oricare dintre cele doua grupuri este vid, se afiseaza doar mesajul 'nu exista' (nu se mai afiseaza continutul celuilalt grup). Altfel, se afiseaza intai toate cuvintele din primul grup (cele cu cel putin n litere), apoi toate din al doilea, fiecare pe cate un rand, pastrand ordinea lor din text.\n\n**Complexitate:** O(lungimea textului)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    cin.ignore();
    string line;
    getline(cin, line);
    stringstream ss(line);
    string w;
    vector<string> g1, g2;
    while (ss >> w) {
        if ((int)w.size() >= n) g1.push_back(w);
        else g2.push_back(w);
    }
    if (g1.empty() || g2.empty()) { cout << "nu exista\\n"; return 0; }
    for (auto& x : g1) cout << x << "\\n";
    for (auto& x : g2) cout << x << "\\n";
    return 0;
}
`,
    py: `n = int(input())
words = input().split()
g1 = [w for w in words if len(w) >= n]
g2 = [w for w in words if len(w) < n]
if not g1 or not g2:
    print("nu exista")
else:
    print("\\n".join(g1 + g2))
`,
    tests: [
      "5\nel mergea tot spre aleea pietruita",
      "1\nab cd",
      "10\nab cd ef",
      "3\nabc de fgh ij",
      "4\nunu doi trei patru cinci",
    ],
  },
  {
    slug: "bac-model-2020-3-3",
    subcategoryId: "model-2020",
    title: "Bacalaureat Model 2020, S3.3 - Numarul valorilor lipsa dintr-un sir",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "model", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul numere.in contine pe prima linie un numar natural n (n in [2,10^9]), iar pe a doua linie un sir de numere naturale din intervalul [1,n]. Numerele din sir sunt ordonate descrescator si sunt separate prin cate un spatiu. Se cere sa se determine numarul valorilor naturale distincte din intervalul [1,n] care NU se gasesc in sirul mentionat mai sus. Numarul determinat se afiseaza pe ecran. Proiectati un algoritm eficient din punctul de vedere al spatiului de memorie si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine numerele\n10\n8 8 8 5 3 3\n" +
      "se afiseaza pe ecran 7 (in sir nu se gasesc valorile 10 9 7 6 4 2 1).",
    input_format: "Fisierul numere.in: pe prima linie n, pe a doua linie sirul descrescator.",
    output_format: "Se afiseaza numarul valorilor din [1,n] care nu apar in sir.",
    constraints: "2 <= n <= 10^9, sirul este ordonat descrescator, cu elemente in [1,n]",
    hints: "Deoarece sirul este deja ordonat descrescator, parcurgeti-l o singura data, numarand valorile distincte intalnite (o valoare noua difera de precedenta). Nu memorati un vector de marime n. Raspunsul este n minus numarul de valori distincte intalnite.",
    explanation:
      "Deoarece sirul este ordonat descrescator, toate aparitiile aceleiasi valori sunt consecutive; se poate numara numarul de valori DISTINCTE parcurgand sirul o singura data si comparand fiecare termen cu precedentul (un termen incepe o noua valoare distincta doar daca difera de precedentul). Nu este nevoie sa se retina un tablou de marime n (care ar putea fi prea mare, pana la 10^9), ci doar cateva variabile: valoarea precedenta si contorul de valori distincte. Raspunsul final este n minus acest contor.\n\n**Complexitate:** O(lungimea sirului) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "numere.in", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("numere.in", "r", stdin);
    long long n; cin >> n;
    long long distinctCount = 0, prev = 0;
    long long v;
    while (cin >> v) {
        if (v != prev) { distinctCount++; prev = v; }
    }
    cout << (n - distinctCount) << "\\n";
    return 0;
}
`,
    py: `with open("numere.in") as f:
    n = int(f.readline())
    rest = f.readline().split()
distinct_count = 0
prev = 0
for tok in rest:
    v = int(tok)
    if v != prev:
        distinct_count += 1
        prev = v
print(n - distinct_count)
`,
    tests: [
      "10\n8 8 8 5 3 3",
      "5\n5 4 3 2 1",
      "1000000000\n1000000000 1",
      "3\n1 1 1",
      (() => {
        const n = 16000;
        const seq = [];
        for (let v = n; v >= 1; v -= 2) { seq.push(v); seq.push(v); }
        return `${n}\n${seq.join(" ")}`;
      })(),
    ],
  },
  // ===================== SESIUNE SPECIALA 2020 =====================
  {
    slug: "bac-speciala-2020-3-1",
    subcategoryId: "speciala-2020",
    title: "Bacalaureat Sesiune Speciala 2020, S3.1 - Cel mai mic multiplu patrat perfect",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "speciala", "subiectul3", "patrate-perfecte"],
    statement:
      "Subprogramul multiplu are un singur parametru, n, prin care primeste un numar natural (n in [1,10^4]). Subprogramul returneaza cel mai mic multiplu nenul al lui n cu proprietatea ca este patrat perfect.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=72 sau n=144, subprogramul returneaza numarul 144 (144=12^2).",
    input_format: "Se citeste de la tastatura numarul natural n.",
    output_format: "Se afiseaza valoarea returnata de subprogram.",
    constraints: "1 <= n <= 10^4",
    hints: "Cautati k=1,2,3,... si verificati de fiecare data daca k*n este patrat perfect (folosind radacina patrata intreaga), oprindu-va la primul k pentru care aceasta se intampla.",
    explanation:
      "Se cauta cel mai mic k>=1 astfel incat k*n sa fie patrat perfect, verificand pe rand k=1,2,3,... prin calculul radacinii patrate intregi a lui k*n si confirmarea ca patratul ei reproduce exact valoarea k*n. Cautarea se opreste la primul k gasit, iar raspunsul este chiar k*n.\n\n**Complexitate:** O(n) in cel mai defavorabil caz",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int n; cin >> n;
    cout << multiplu(n) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(multiplu(n))
`,
    cpp: `bool esteRadicalPerfect(long long m) {
    long long r = (long long)sqrtl((long double)m);
    while (r * r > m) r--;
    while ((r + 1) * (r + 1) <= m) r++;
    return r * r == m;
}
int multiplu(int n) {
    long long k = 1;
    while (true) {
        long long m = k * (long long)n;
        if (esteRadicalPerfect(m)) return (int)m;
        k++;
    }
}
`,
    py: `import math
def is_square(m):
    r = math.isqrt(m)
    return r * r == m

def multiplu(n):
    k = 1
    while True:
        m = k * n
        if is_square(m):
            return m
        k += 1
`,
    tests: ["72", "144", "1", "10000", "2"],
  },
  {
    slug: "bac-speciala-2020-3-2",
    subcategoryId: "speciala-2020",
    title: "Bacalaureat Sesiune Speciala 2020, S3.2 - Majuscule in citate",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "speciala", "subiectul3", "siruri-caractere"],
    statement:
      "Numim citat intr-un text o secventa de caractere din acel text care incepe cu un caracter < si se termina cu un caracter >, celelalte caractere ale secventei fiind diferite de < si >.\n\n" +
      "Un text de cel mult 100 de caractere (litere mici ale alfabetului englez, spatii si caracterele < si >) contine cel putin un citat. Textul nu contine alte caractere < si > decat cele care margineasc citatele, si oricare doua citate nu au nici caractere < si > si nici alte caractere in comun.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura un text de tipul precizat si il transforma in memorie prin inlocuirea tuturor literelor mici cuprinse in citate cu literele mari corespunzatoare, celelalte ramanand nemodificate. Programul afiseaza pe ecran textul obtinut.\n\n" +
      "Exemplu: pentru textul mai bine sa fii un <om de valoare> decat un <om de succes> se afiseaza mai bine sa fii un <OM DE VALOARE> decat un <OM DE SUCCES>",
    input_format: "Se citeste de la tastatura o linie de text.",
    output_format: "Se afiseaza textul transformat, cu literele din interiorul citatelor (marcate prin < si >) transformate in majuscule.",
    constraints: "textul are cel mult 100 de caractere",
    hints: "Parcurgeti textul caracter cu caracter, mentinand o stare 'in interiorul unui citat', activata la intalnirea lui < si dezactivata la intalnirea lui >; convertiti la majuscula orice litera mica intalnita cat timp starea este activa.",
    explanation:
      "Se parcurge textul caracter cu caracter, mentinand un indicator boolean care devine adevarat imediat dupa un caracter < si fals imediat dupa un caracter >. Orice litera mica intalnita in timp ce indicatorul este adevarat se converteste la majuscula; restul caracterelor (inclusiv < si > insele) raman neschimbate.\n\n**Complexitate:** O(lungimea textului)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string line;
    getline(cin, line);
    bool inCitat = false;
    string rez;
    for (char c : line) {
        if (c == '<') { inCitat = true; rez += c; }
        else if (c == '>') { inCitat = false; rez += c; }
        else if (inCitat && c >= 'a' && c <= 'z') rez += (char)toupper(c);
        else rez += c;
    }
    cout << rez << "\\n";
    return 0;
}
`,
    py: `line = input()
in_citat = False
rez = []
for c in line:
    if c == '<':
        in_citat = True
        rez.append(c)
    elif c == '>':
        in_citat = False
        rez.append(c)
    elif in_citat and c.islower():
        rez.append(c.upper())
    else:
        rez.append(c)
print("".join(rez))
`,
    tests: [
      "mai bine sa fii un <om de valoare> decat un <om de succes>",
      "<abc>",
      "text fara nimic <insa> aici da",
      "<a><b><c>",
      "inceput <mij loc> final",
    ],
  },
  {
    slug: "bac-speciala-2020-3-3",
    subcategoryId: "speciala-2020",
    title: "Bacalaureat Sesiune Speciala 2020, S3.3 - Varful cu diferenta minima a vecinilor",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "speciala", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Se numeste varf intr-un sir de numere naturale un termen al sirului care este strict mai mare decat fiecare dintre cei doi termeni vecini cu el, aflati in sir pe pozitia din stanga, respectiv din dreapta sa.\n\n" +
      "Fisierul bac.in contine un sir de cel mult 10^6 numere naturale din intervalul [0,10^9], separate prin cate un spatiu. Se cere sa se afiseze pe ecran varful din sirul aflat in fisier pentru care valoarea absoluta a diferentei dintre cei doi vecini ai sai este minima. Daca exista mai multe astfel de numere, se afiseaza cel mai mare dintre ele, iar daca nu exista niciun varf, se afiseaza pe ecran mesajul nu exista. Proiectati un algoritm eficient din punctul de vedere al timpului de executare si al spatiului de memorie utilizat.\n\n" +
      "Exemplu: daca fisierul contine sirul 2 7 10 5 6 2 1 3 20 17 9 11 7 3 10 6 2 se afiseaza pe ecran 11",
    input_format: "Fisierul bac.in: un sir de numere naturale din [0,10^9], separate prin spatiu.",
    output_format:
      "Se afiseaza valoarea varfului cu diferenta minima intre vecini (cel mai mare, in caz de egalitate), sau mesajul 'nu exista' daca sirul nu are niciun varf.",
    constraints: "cel mult 10^6 termeni, fiecare in [0, 10^9]",
    hints: "Parcurgeti sirul pastrand doar ultimii trei termeni cititi (fara sa stocati tot sirul); de fiecare data cand aveti trei termeni consecutivi, verificati daca cel din mijloc este varf, si actualizati raspunsul cel mai bun gasit pana atunci.",
    explanation:
      "Se parcurge sirul o singura data, pastrand doar ultimele doua valori citite anterior (fara a stoca intregul sir). De fiecare data cand se citeste un nou termen, se poate verifica daca termenul citit cu doua pozitii in urma este varf (comparandu-l cu vecinul din stanga si cu termenul curent citit acum, care ii este vecin din dreapta). Pentru fiecare varf gasit, se actualizeaza raspunsul cel mai bun: se prefera diferenta absoluta mai mica intre vecini, iar la diferente egale, valoarea mai mare a varfului.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.in", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.in", "r", stdin);
    long long p2 = 0, p1 = 0, cur;
    int count = 0;
    long long bestDiff = -1, bestVal = -1;
    while (cin >> cur) {
        count++;
        if (count >= 3) {
            if (p1 > p2 && p1 > cur) {
                long long diff = llabs(p2 - cur);
                if (bestDiff == -1 || diff < bestDiff) { bestDiff = diff; bestVal = p1; }
                else if (diff == bestDiff && p1 > bestVal) bestVal = p1;
            }
        }
        p2 = p1; p1 = cur;
    }
    if (bestVal == -1) cout << "nu exista\\n";
    else cout << bestVal << "\\n";
    return 0;
}
`,
    py: `p2, p1 = 0, 0
count = 0
best_diff, best_val = -1, -1
with open("bac.in") as f:
    data = f.read().split()
for tok in data:
    cur = int(tok)
    count += 1
    if count >= 3:
        if p1 > p2 and p1 > cur:
            diff = abs(p2 - cur)
            if best_diff == -1 or diff < best_diff:
                best_diff, best_val = diff, p1
            elif diff == best_diff and p1 > best_val:
                best_val = p1
    p2, p1 = p1, cur
print("nu exista" if best_val == -1 else best_val)
`,
    tests: [
      "2 7 10 5 6 2 1 3 20 17 9 11 7 3 10 6 2",
      "1 2 1",
      "1 2 3",
      "5 1 5 1 5",
      (() => {
        const parts = [];
        for (let i = 0; i < 40000; i++) {
          const cyc = i % 4;
          if (cyc === 0) parts.push("1");
          else if (cyc === 1) parts.push(String(1000 + (i % 500)));
          else if (cyc === 2) parts.push("1");
          else parts.push("1");
        }
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== SESIUNEA TOAMNA 2020 =====================
  {
    slug: "bac-toamna-2020-3-1",
    subcategoryId: "toamna-2020",
    title: "Bacalaureat Toamna 2020, S3.1 - Al k-lea p-numar dintr-un interval",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "toamna", "subiectul3", "divizori"],
    statement:
      "Un numar natural nenul se numeste p-numar daca are aceeasi paritate cu suma divizorilor sai pozitivi.\n\n" +
      "Exemplu: 10 si 25 sunt p-numere (10 are aceeasi paritate cu 18=1+2+5+10, iar 25 are aceeasi paritate cu 31=1+5+25).\n\n" +
      "Subprogramul kpn are trei parametri, a, b si k, prin care primeste cate un numar natural din intervalul [1,10^6] (a<=b). Subprogramul returneaza cel de-al k-lea p-numar din intervalul [a,b] sau -1, daca nu exista cel putin k astfel de numere in acest interval.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca a=27, b=50 si k=3, atunci subprogramul returneaza 34.",
    input_format: "Se citesc de la tastatura a, b si k.",
    output_format: "Se afiseaza valoarea returnata de subprogram.",
    constraints: "1 <= a <= b <= 10^6, k >= 1",
    hints: "Parcurgeti v de la a la b; pentru fiecare, calculati suma divizorilor sai (prin cautare pana la radacina patrata) si comparati paritatea lui v cu paritatea acestei sume. Numarati p-numerele gasite si opriti-va la al k-lea.",
    explanation:
      "Se parcurg valorile v de la a la b, calculand pentru fiecare suma divizorilor sai pozitivi (folosind o cautare a divizorilor pana la radacina patrata a lui v, adaugand atat d cat si v/d pentru fiecare divizor gasit). Daca paritatea lui v coincide cu paritatea acestei sume, v este un p-numar; se numara aceste aparitii si se returneaza valoarea la care se ajunge la numaratoarea k. Daca intervalul se epuizeaza fara a gasi k astfel de numere, se returneaza -1.\n\n**Complexitate:** O((b-a)*sqrt(b))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    time_limit_ms: 2000,
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long a, b, k; cin >> a >> b >> k;
    cout << kpn(a, b, k) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

a, b, k = map(int, input().split())
print(kpn(a, b, k))
`,
    cpp: `long long sumaDivizori(long long v) {
    long long s = 0;
    for (long long d = 1; d * d <= v; d++) {
        if (v % d == 0) {
            s += d;
            if (d != v / d) s += v / d;
        }
    }
    return s;
}
long long kpn(long long a, long long b, long long k) {
    long long cnt = 0;
    for (long long v = a; v <= b; v++) {
        long long s = sumaDivizori(v);
        if ((v % 2) == (s % 2)) {
            cnt++;
            if (cnt == k) return v;
        }
    }
    return -1;
}
`,
    py: `def suma_divizori(v):
    s = 0
    d = 1
    while d * d <= v:
        if v % d == 0:
            s += d
            if d != v // d:
                s += v // d
        d += 1
    return s

def kpn(a, b, k):
    cnt = 0
    for v in range(a, b + 1):
        s = suma_divizori(v)
        if (v % 2) == (s % 2):
            cnt += 1
            if cnt == k:
                return v
    return -1
`,
    tests: ["27 50 3", "1 10 1", "1 10 100", "1000000 1000000 1", "100 200 5"],
  },
  {
    slug: "bac-toamna-2020-3-2",
    subcategoryId: "toamna-2020",
    title: "Bacalaureat Toamna 2020, S3.2 - Inlocuirea cuvintelor cu oglinda lor",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "toamna", "subiectul3", "siruri-caractere"],
    statement:
      "Doua cuvinte distincte se numesc in oglinda daca fiecare dintre ele se obtine prin citirea literelor celuilalt de la dreapta la stanga.\n\n" +
      "Exemplu: animate si etamina sunt in oglinda, iar pentru cuvantul reper nu exista un cuvant cu care sa fie in oglinda (fiind el insusi un palindrom).\n\n" +
      "Se considera un text cu cel mult 100 de caractere, in care cuvintele sunt formate din litere mici ale alfabetului englez si sunt separate prin cate un spatiu. Scrieti un program C/C++ care citeste de la tastatura un text de tipul mentionat mai sus si il transforma in memorie, inlocuind fiecare cuvant cu numar impar de litere cu acel cuvant cu care el este in oglinda, daca acesta exista. Programul afiseaza pe ecran textul obtinut sau mesajul nu exista, daca in text nu s-a inlocuit niciun cuvant.\n\n" +
      "Exemplu: pentru textul era o selectie reper de desene animate prezenta se obtine textul are o selectie reper de desene etamina prezenta; pentru textul un reper pentru desene se afiseaza pe ecran mesajul nu exista",
    input_format: "Se citeste de la tastatura o linie de text.",
    output_format: "Se afiseaza textul transformat, sau mesajul 'nu exista' daca niciun cuvant nu a fost inlocuit.",
    constraints: "textul are cel mult 100 de caractere",
    hints: "Un cuvant cu numar impar de litere are un cuvant-oglinda (distinct de el) daca si numai daca nu este el insusi un palindrom; in acest caz, cuvantul-oglinda este chiar propriul sau inversat.",
    explanation:
      "Pentru fiecare cuvant din text cu un numar impar de litere, se calculeaza inversul sau (citit de la dreapta la stanga); daca acest invers este diferit de cuvantul original (adica nu este un palindrom), inseamna ca exista un cuvant-oglinda -- si acesta este chiar inversul calculat -- deci cuvantul se inlocuieste cu inversul sau. Cuvintele cu numar par de litere si cuvintele impare care sunt palindroame raman neschimbate. Daca nu s-a facut nicio inlocuire in tot textul, se afiseaza mesajul cerut.\n\n**Complexitate:** O(lungimea textului)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    string w;
    vector<string> words;
    bool any = false;
    while (ss >> w) {
        if ((int)w.size() % 2 == 1) {
            string rev(w.rbegin(), w.rend());
            if (rev != w) { w = rev; any = true; }
        }
        words.push_back(w);
    }
    if (!any) { cout << "nu exista\\n"; return 0; }
    for (size_t i = 0; i < words.size(); i++) cout << words[i] << (i + 1 < words.size() ? " " : "\\n");
    return 0;
}
`,
    py: `words = input().split()
any_replaced = False
rez = []
for w in words:
    if len(w) % 2 == 1:
        rev = w[::-1]
        if rev != w:
            w = rev
            any_replaced = True
    rez.append(w)
if not any_replaced:
    print("nu exista")
else:
    print(" ".join(rez))
`,
    tests: [
      "era o selectie reper de desene animate prezenta",
      "un reper pentru desene",
      "ab ba",
      "abc cba xyz",
      "reper nivel",
    ],
  },
  {
    slug: "bac-toamna-2020-3-3",
    subcategoryId: "toamna-2020",
    title: "Bacalaureat Toamna 2020, S3.3 - Cel mai mic interval care contine termenii de doua cifre",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "toamna", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.txt contine un sir de cel mult 10^6 numere naturale din intervalul [0,10^9], separate prin cate un spatiu.\n\n" +
      "Se cere sa se afiseze pe ecran, separate printr-un spatiu, doua numere naturale a si b (a<b), astfel incat oricare termen al sirului care are exact doua cifre sa apartina intervalului (a,b), iar valoarea expresiei b-a sa fie minima. Daca sirul nu are niciun termen de doua cifre, pe ecran se afiseaza mesajul nu exista.\n\n" +
      "Proiectati un algoritm eficient din punctul de vedere al timpului de executare si al spatiului de memorie utilizat.\n\n" +
      "Exemplu: daca fisierul contine valorile 7 2 40 5 11 15 10 122 18 350 se afiseaza pe ecran numerele 9 41.",
    input_format: "Fisierul bac.txt: un sir de numere naturale din [0,10^9], separate prin spatiu.",
    output_format: "Se afiseaza a si b, separate printr-un spatiu, sau mesajul 'nu exista' daca sirul nu are niciun termen de doua cifre.",
    constraints: "cel mult 10^6 termeni, fiecare in [0, 10^9]",
    hints: "Termenii de doua cifre sunt cei din intervalul [10,99]. Determinati minimul si maximul dintre acestia printr-o singura trecere prin fisier; raspunsul este a = minim-1 si b = maxim+1 (cel mai stramt interval deschis care le contine pe toate).",
    explanation:
      "Se parcurge fisierul o singura data, retinand doar minimul si maximul dintre termenii care au exact doua cifre (adica se afla in [10,99]), fara a stoca intregul sir. Deoarece intervalul (a,b) trebuie sa fie deschis si sa contina strict toti acesti termeni, cea mai stramta astfel de pereche este a = minim-1 si b = maxim+1, ceea ce minimizeaza automat b-a. Daca niciun termen de doua cifre nu a fost gasit, se afiseaza mesajul cerut.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    long long v;
    bool found = false;
    long long mn = 0, mx = 0;
    while (cin >> v) {
        if (v >= 10 && v <= 99) {
            if (!found) { mn = mx = v; found = true; }
            else { mn = min(mn, v); mx = max(mx, v); }
        }
    }
    if (!found) cout << "nu exista\\n";
    else cout << (mn - 1) << " " << (mx + 1) << "\\n";
    return 0;
}
`,
    py: `found = False
mn, mx = 0, 0
with open("bac.txt") as f:
    data = f.read().split()
for tok in data:
    v = int(tok)
    if 10 <= v <= 99:
        if not found:
            mn = mx = v
            found = True
        else:
            mn = min(mn, v)
            mx = max(mx, v)
print("nu exista" if not found else f"{mn - 1} {mx + 1}")
`,
    tests: [
      "7 2 40 5 11 15 10 122 18 350",
      "5 6 7",
      "99",
      "10 99",
      (() => {
        const parts = [];
        for (let i = 0; i < 40000; i++) {
          const cyc = i % 3;
          if (cyc === 0) parts.push(String(10 + (i % 80)));
          else if (cyc === 1) parts.push("500");
          else parts.push("3");
        }
        return parts.join(" ");
      })(),
    ],
  },
];

async function upsertDraft(p) {
  const existing = await pool.query("SELECT id FROM problems WHERE slug = $1", [p.slug]);
  const allowedLanguages = p.solution_mode === "function" ? ["cpp", "python"] : ["cpp", "c", "pascal", "python"];
  const params = [
    p.slug,
    p.title,
    p.statement,
    p.input_format,
    p.output_format,
    p.constraints,
    p.difficulty,
    p.time_limit_ms || 1500,
    p.memory_limit_mb || 64,
    SRC,
    p.tags || [],
    allowedLanguages,
    p.cpp,
    p.hints,
    p.explanation,
    p.cpp,
    p.py,
    LEVEL,
    CHAPTER.id,
    p.subcategoryId,
    p.solution_mode,
    p.io.input_source,
    p.io.output_target,
    p.io.input_filename,
    p.io.output_filename,
    p.function_template_cpp || null,
    p.function_template_python || null,
  ];
  if (existing.rows.length > 0) {
    const id = existing.rows[0].id;
    await pool.query(
      `UPDATE problems SET
         title=$2, statement=$3, input_format=$4, output_format=$5, constraints=$6,
         difficulty=$7, time_limit_ms=$8, memory_limit_mb=$9, source=$10, tags=$11,
         allowed_languages=$12, is_published=false, editorial_status='draft', official_solution=$13,
         hints=$14, explanation=$15, official_solution_cpp=$16, official_solution_python=$17,
         curriculum_level=$18, curriculum_chapter_id=$19, curriculum_subcategory_id=$20,
         solution_mode=$21, input_source=$22, output_target=$23, input_filename=$24, output_filename=$25,
         function_template_cpp=$26, function_template_python=$27,
         checker_mode='exact', updated_at=NOW()
       WHERE id=$1`,
      [id, ...params.slice(1)],
    );
    await pool.query("DELETE FROM test_cases WHERE problem_id = $1", [id]);
    return id;
  }
  const inserted = await pool.query(
    `INSERT INTO problems (
       slug, title, statement, input_format, output_format, constraints,
       difficulty, time_limit_ms, memory_limit_mb, source, tags,
       allowed_languages, is_published, official_solution,
       hints, explanation, official_solution_cpp, official_solution_python,
       curriculum_level, curriculum_chapter_id, curriculum_subcategory_id,
       solution_mode, input_source, output_target, input_filename, output_filename,
       function_template_cpp, function_template_python,
       checker_mode, editorial_status, estimated_minutes
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,false,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,'exact','draft',15
     )
     RETURNING id`,
    params,
  );
  return inserted.rows[0].id;
}

async function finalizePublish(id, testRows) {
  await pool.query("UPDATE problems SET is_published=true, editorial_status='published', updated_at=NOW() WHERE id=$1", [id]);
  for (let i = 0; i < testRows.length; i++) {
    const t = testRows[i];
    await pool.query(
      `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, t.input, t.expected_output, t.is_sample, 10, i + 1],
    );
  }
}

async function seedGroup(list) {
  const summary = [];

  for (const p of list) {
    console.log(`\n=== ${p.slug} ===`);
    try {
      const id = await upsertDraft(p);
      let allOk = true;
      const testRows = [];

      for (let i = 0; i < p.tests.length; i++) {
        const input = p.tests[i];
        const [cppOut, pyOut] = await Promise.all([
          runCustom(id, "cpp", p.cpp, input),
          runCustom(id, "python", p.py, input),
        ]);

        if (cppOut.verdict !== "AC") {
          console.error(`  TEST ${i}: cpp execution failed: ${JSON.stringify(cppOut)} (input len=${input.length})`);
          allOk = false;
          continue;
        }
        if (pyOut.verdict !== "AC") {
          console.error(`  TEST ${i}: python execution failed: ${JSON.stringify(pyOut)} (input len=${input.length})`);
          allOk = false;
          continue;
        }

        const normCpp = normalize(cppOut.stdout);
        const normPy = normalize(pyOut.stdout);
        if (normCpp !== normPy) {
          console.error(`  TEST ${i}: MISMATCH cpp="${normCpp}" python="${normPy}" (input len=${input.length})`);
          allOk = false;
          continue;
        }

        testRows.push({ input, expected_output: `${normCpp}\n`, is_sample: i < 2 });
      }

      if (!allOk) {
        console.error(`!!! ${p.slug} has failing tests - left as DRAFT (is_published=false).`);
        summary.push({ slug: p.slug, ok: false, tests: testRows.length });
        continue;
      }

      await finalizePublish(id, testRows);
      console.log(`published ${p.slug} (${p.difficulty}) with ${testRows.length} tests`);
      summary.push({ slug: p.slug, ok: true, tests: testRows.length });
    } catch (err) {
      console.error(`FAIL ${p.slug}: ${err.stack || err.message}`);
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
