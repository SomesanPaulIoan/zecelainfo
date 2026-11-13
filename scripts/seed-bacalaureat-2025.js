const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const LEVEL = "bacalaureat";
const CHAPTER = { id: "bacalaureat-2025", name: "Bacalaureat 2025" };

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

const SRC = "Bacalaureat Informatica MI 2025 (Ministerul Educatiei / CNPEE)";

const problems = [
  // ===================== MODEL 2025 =====================
  {
    slug: "bac-model-2025-3-1",
    subcategoryId: "model-2025",
    title: "Bacalaureat Model 2025, S3.1 - Numere par-oglindite",
    difficulty: "medium",
    tags: ["bacalaureat", "2025", "model", "subiectul3", "cifre"],
    statement:
      "Doua numere se numesc oglindite daca fiecare se obtine din celalalt, prin parcurgerea cifrelor acestuia de la dreapta la stanga. Doua numere se numesc par-oglindite daca numerele obtinute din acestea, prin indepartarea tuturor cifrelor lor impare sau nule, sunt oglindite.\n\n" +
      "Subprogramul pao are trei parametri:\n" +
      "- x si y, prin care primeste cate un numar natural din intervalul [0,10^9];\n" +
      "- rez, prin care furnizeaza valoarea 1, daca x si y sunt par-oglindite, sau valoarea 0, in caz contrar.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca x=814 si y=7003485, sau x=14 si y=700345, dupa apel rez=1, iar daca x=814 si y=7003465, sau x=814 si y=7003845, sau x=15 si y=510, dupa apel rez=0.",
    input_format: "Se citesc de la tastatura x si y.",
    output_format: "Se afiseaza rez: 1 daca x si y sunt par-oglindite, altfel 0.",
    constraints: "0 <= x, y <= 10^9",
    hints: "Din fiecare numar pastrati doar cifrele pare si nenule (in ordinea lor originala); apoi verificati daca sirul obtinut din x este exact inversul sirului obtinut din y. Daca oricare dintre siruri este vid, raspunsul este 0.",
    explanation:
      "Pentru fiecare numar se construieste sirul cifrelor sale pare si nenule, in ordinea aparitiei. Daca oricare dintre cele doua siruri rezultate este vid, numerele nu pot fi par-oglindite (raspuns 0). Altfel, se verifica daca sirul obtinut din x, citit invers, este identic cu sirul obtinut din y; daca da, numerele sunt par-oglindite.\n\n**Complexitate:** O(numar de cifre)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long x, y; cin >> x >> y;
    int rez;
    pao(x, y, rez);
    cout << rez << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

x, y = map(int, input().split())
print(pao(x, y))
`,
    cpp: `string filtered(long long v) {
    string s = to_string(v);
    string r = "";
    for (char c : s) {
        int d = c - '0';
        if (d != 0 && d % 2 == 0) r += c;
    }
    return r;
}
void pao(long long x, long long y, int& rez) {
    string fx = filtered(x), fy = filtered(y);
    if (fx.empty() || fy.empty()) { rez = 0; return; }
    string rfx = fx;
    reverse(rfx.begin(), rfx.end());
    rez = (rfx == fy) ? 1 : 0;
}
`,
    py: `def filtered(v):
    r = []
    for c in str(v):
        d = int(c)
        if d != 0 and d % 2 == 0:
            r.append(c)
    return "".join(r)

def pao(x, y):
    fx, fy = filtered(x), filtered(y)
    if not fx or not fy:
        return 0
    return 1 if fx[::-1] == fy else 0
`,
    tests: ["814 7003485", "14 700345", "814 7003465", "814 7003845", "15 510"],
  },
  {
    slug: "bac-model-2025-3-2",
    subcategoryId: "model-2025",
    title: "Bacalaureat Model 2025, S3.2 - Tablou cu diagonala de multipli",
    difficulty: "medium",
    tags: ["bacalaureat", "2025", "model", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Scrieti un program C/C++ care citeste de la tastatura doua numere naturale din intervalul [2,10^2], k si n (k>=n), si construieste in memorie un tablou bidimensional cu n linii si n coloane, astfel incat parcurgand diagonala principala, de sus in jos, sa se obtina un sir strict crescator format din primii n multipli naturali nenuli ai lui k, si parcurgand fiecare linie a sa, de la stanga la dreapta, sa se obtina cate un sir strict descrescator de numere naturale consecutive.\n\n" +
      "Programul afiseaza pe ecran tabloul obtinut, fiecare linie a tabloului pe cate o linie a ecranului, elementele de pe aceeasi linie fiind separate prin cate un spatiu.\n\n" +
      "Exemplu: pentru k=5 si n=4 se obtine tabloul\n5 4 3 2\n11 10 9 8\n17 16 15 14\n23 22 21 20",
    input_format: "Se citesc k si n.",
    output_format: "Se afiseaza tabloul cu n linii si n coloane.",
    constraints: "2 <= n <= k <= 100",
    hints: "Elementul de pe diagonala principala a liniei i este i*k. Fiecare linie i este un sir strict descrescator de numere naturale consecutive care trece prin valoarea i*k exact pe coloana i.",
    explanation: "Pentru linia i (1<=i<=n), elementul de pe diagonala principala (coloana i) este i*k. Deoarece linia trebuie sa fie un sir strict descrescator de numere consecutive, elementul de pe coloana j al liniei i este i*k + (i-j). Se calculeaza si se afiseaza direct aceasta formula pentru fiecare pozitie.\n\n**Complexitate:** O(n^2)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int k, n; cin >> k >> n;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) {
            cout << (i * k + i - j) << (j < n ? " " : "\\n");
        }
    }
    return 0;
}
`,
    py: `k, n = map(int, input().split())
for i in range(1, n + 1):
    row = [str(i * k + i - j) for j in range(1, n + 1)]
    print(" ".join(row))
`,
    tests: ["5 4", "2 2", "10 3", "100 2", "7 5"],
  },
  {
    slug: "bac-model-2025-3-3",
    subcategoryId: "model-2025",
    title: "Bacalaureat Model 2025, S3.3 - Ultimele doua masini din acelasi an",
    difficulty: "hard",
    tags: ["bacalaureat", "2025", "model", "subiectul3", "eficienta", "fisiere"],
    statement:
      "La o expozitie auto se afla, in sir, masini de epoca, fiecare avand cate un cod, format prin alipirea, in aceasta ordine, a doua numere naturale nenule: identificatorul colectionarului care detine masina, respectiv anul fabricatiei acesteia.\n\n" +
      "Fisierul bac.txt contine numere naturale: pe prima linie un numar x (x in [1880,1950]), reprezentand un an calendaristic, iar pe a doua linie cel mult 10^5 numere din intervalul [10^4,10^9], reprezentand codurile masinilor, in ordinea din sirul in care sunt expuse. Numerele aflate pe aceeasi linie in fisier sunt separate prin cate un spatiu.\n\n" +
      "Se cere sa se afiseze pe ecran identificatorii colectionarilor care detin ultimele doua masini, din sirul celor expuse, ambele fiind fabricate in anul x si aflate in sir pe pozitii consecutive, ca in exemplu. Numerele, nu neaparat distincte, sunt afisate in ordinea in care masinile corespunzatoare apar in sir, separate printr-un spatiu, iar daca nu exista doua astfel de masini, se afiseaza pe ecran mesajul nu exista. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine numerele\n1925\n31885 21925 8931925 31925 121900 11925 31925 151925 61950 201925 121880\natunci pe ecran se afiseaza 3 15",
    input_format: "Fisierul bac.txt: x pe prima linie, sirul de coduri pe a doua.",
    output_format: "Identificatorii colectionarilor pentru ultima pereche consecutiva de masini fabricate in anul x, sau mesajul 'nu exista'.",
    constraints: "cel mult 10^5 coduri, an in [1880,1950]",
    hints: "Anul din cod este format din exact 4 cifre, deci este egal cu code%10000, iar identificatorul colectionarului este code/10000. Parcurgeti sirul o singura data, retinand ultima pereche de pozitii consecutive care au ambele anul x.",
    explanation:
      "Deoarece anul de fabricatie ocupa exact ultimele 4 cifre ale codului (fiind un numar din [1880,1950]), anul unei masini se obtine ca cod%10000, iar identificatorul colectionarului ca cod/10000. Se parcurge sirul o singura data, retinand pentru fiecare pozitie daca anul ei este x; ori de cate ori atat pozitia curenta cat si cea precedenta au anul x, se retine aceasta ca fiind (pana in acel moment) ultima pereche valida. La final se afiseaza identificatorii perechii retinute, sau mesajul cerut daca nu s-a gasit nicio pereche.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    long long x; cin >> x;
    long long code, prevCode = -1;
    bool prevMatch = false;
    long long lastA = -1, lastB = -1;
    bool found = false;
    while (cin >> code) {
        bool match = (code % 10000 == x);
        if (prevMatch && match) { lastA = prevCode; lastB = code; found = true; }
        prevCode = code; prevMatch = match;
    }
    if (!found) { cout << "nu exista\\n"; return 0; }
    cout << (lastA / 10000) << " " << (lastB / 10000) << "\\n";
    return 0;
}
`,
    py: `with open("bac.txt") as f:
    x = int(f.readline())
    data = f.readline().split()
prev_code, prev_match = -1, False
last_a, last_b = -1, -1
found = False
for tok in data:
    code = int(tok)
    match = (code % 10000 == x)
    if prev_match and match:
        last_a, last_b = prev_code, code
        found = True
    prev_code, prev_match = code, match
if not found:
    print("nu exista")
else:
    print(last_a // 10000, last_b // 10000)
`,
    tests: [
      "1925\n31885 21925 8931925 31925 121900 11925 31925 151925 61950 201925 121880",
      "1900\n11880 21900 31900",
      "1900\n21900",
      "1950\n11950 21950 31950",
      (() => {
        const parts = [];
        for (let i = 0; i < 12000; i++) {
          const year = i % 5 === 0 ? 1925 : 1900 + (i % 30);
          parts.push(String((i + 1) * 10000 + year));
        }
        return `1925\n${parts.join(" ")}`;
      })(),
    ],
  },
  // ===================== SIMULARE 2025 =====================
  {
    slug: "bac-simulare-2025-3-1",
    subcategoryId: "simulare-2025",
    title: "Bacalaureat Simulare 2025, S3.1 - Cel mai mare numar harsad",
    difficulty: "medium",
    tags: ["bacalaureat", "2025", "simulare", "subiectul3", "cifre"],
    statement:
      "Un numar 'care aduce bucurie' - harsad (sau numar Niven), este un numar intreg divizibil cu suma cifrelor sale.\n\n" +
      "Subprogramul harsad are doi parametri:\n" +
      "- k, prin care primeste un numar natural (k in [1,10^6]);\n" +
      "- n, prin care furnizeaza cel mai mare numar natural harsad mai mic sau egal cu k.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: pentru k=2027, dupa apel, n=2025 (2+0+2+5=9, iar 2025 este divizibil cu 9).",
    input_format: "Se citeste de la tastatura k.",
    output_format: "Se afiseaza cel mai mare numar harsad <= k.",
    constraints: "1 <= k <= 10^6",
    hints: "Parcurgeti valorile de la k descrescator; pentru fiecare, calculati suma cifrelor si verificati divizibilitatea.",
    explanation: "Se parcurg valorile v de la k descrescator pana la 1; pentru fiecare se calculeaza suma cifrelor sale si se verifica daca v este divizibil cu aceasta suma; primul astfel de v gasit este raspunsul (fiind cel mai mare posibil, deoarece cautarea incepe de la k).\n\n**Complexitate:** O(k * numar de cifre) in cel mai defavorabil caz",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int k; cin >> k;
    int n;
    harsad(k, n);
    cout << n << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

k = int(input())
print(harsad(k))
`,
    cpp: `void harsad(int k, int& n) {
    for (int v = k; v >= 1; v--) {
        int s = 0, t = v;
        while (t > 0) { s += t % 10; t /= 10; }
        if (v % s == 0) { n = v; return; }
    }
}
`,
    py: `def harsad(k):
    for v in range(k, 0, -1):
        s = sum(int(c) for c in str(v))
        if v % s == 0:
            return v
`,
    tests: ["2027", "1", "10", "1000000", "999999"],
  },
  {
    slug: "bac-simulare-2025-3-2",
    subcategoryId: "simulare-2025",
    title: "Bacalaureat Simulare 2025, S3.2 - Cuvinte asemenea cu ultimul",
    difficulty: "medium",
    tags: ["bacalaureat", "2025", "simulare", "subiectul3", "siruri-caractere"],
    statement:
      "Doua cuvinte se numesc asemenea daca sunt distincte si au acelasi numar de vocale. Se considera vocale literele a, e, i, o, u.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura un numar natural n (n in [1,10^2]), apoi n cuvinte, separate prin Enter. Fiecare cuvant este format din cel mult 20 de caractere, numai litere mici ale alfabetului englez. Programul afiseaza pe ecran, separate prin cate un spatiu, toate cuvintele asemenea cu ultimul cuvant citit, sau mesajul nu exista daca nu exista astfel de cuvinte.\n\n" +
      "Exemplu: daca se citesc n=9 si cuvintele mereu, primavara, infloresc, ghioceii, lalelele, si, brandusele, de, primavara, se afiseaza pe ecran, nu neaparat in aceasta ordine, cuvintele lalelele brandusele",
    input_format: "Pe prima linie n. Urmeaza n cuvinte, cate unul pe linie.",
    output_format: "Toate cuvintele asemenea cu ultimul cuvant citit (distincte de acesta ca text, cu acelasi numar de vocale), separate prin spatiu, sau mesajul 'nu exista'.",
    constraints: "1 <= n <= 100, fiecare cuvant are cel mult 20 de caractere",
    hints: "Calculati numarul de vocale al ultimului cuvant citit, apoi parcurgeti toate cuvintele (inclusiv cel putin cele dinaintea ultimului), pastrand doar cele cu acelasi numar de vocale si text diferit de al ultimului cuvant.",
    explanation: "Se citesc toate cele n cuvinte, retinand numarul de vocale al ultimului. Se parcurg apoi toate cuvintele citite, selectand pe cele care au acelasi numar de vocale ca ultimul si al caror text difera de textul ultimului cuvant (chiar daca alt cuvant din lista este identic cu ultimul, acesta este exclus, nefiind distinct de el). Daca nu exista niciun astfel de cuvant, se afiseaza mesajul cerut.\n\n**Complexitate:** O(n * lungimea maxima a unui cuvant)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int countVowels(const string& w) {
    int c = 0;
    for (char ch : w) if (ch == 'a' || ch == 'e' || ch == 'i' || ch == 'o' || ch == 'u') c++;
    return c;
}
int main() {
    int n; cin >> n;
    vector<string> words(n);
    for (auto& w : words) cin >> w;
    string last = words[n - 1];
    int lastV = countVowels(last);
    vector<string> rez;
    for (auto& w : words) if (w != last && countVowels(w) == lastV) rez.push_back(w);
    if (rez.empty()) { cout << "nu exista\\n"; return 0; }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `def count_vowels(w):
    return sum(1 for ch in w if ch in "aeiou")

n = int(input())
words = [input().strip() for _ in range(n)]
last = words[-1]
last_v = count_vowels(last)
rez = [w for w in words if w != last and count_vowels(w) == last_v]
print("nu exista" if not rez else " ".join(rez))
`,
    tests: [
      "9\nmereu\nprimavara\ninfloresc\nghioceii\nlalelele\nsi\nbrandusele\nde\nprimavara",
      "2\nab\nba",
      "3\nab\ncd\nab",
      "1\nabc",
      "4\nbaobab\nabacus\nzebu\nzebu",
    ],
  },
  {
    slug: "bac-simulare-2025-3-3",
    subcategoryId: "simulare-2025",
    title: "Bacalaureat Simulare 2025, S3.3 - Seturi potrivite de bijuterii",
    difficulty: "hard",
    tags: ["bacalaureat", "2025", "simulare", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Pentru o parada a modei sunt pregatite seturi de bijuterii, un set fiind format din cercei si pandantiv, cu cate cel putin doua pietre pretioase si semipretioase. Sunt utilizate noua tipuri de pietre, numerotate de la 1 la 9, iar orice bijuterie are o eticheta, numar natural in care fiecare cifra corespunde unei pietre din montura, in ordinea descrescatoare a importantei in cadrul modelului. Un set este potrivit daca cele mai importante doua pietre ale fiecarei bijuterii din set sunt de acelasi tip, chiar daca nu in aceeasi ordine a importantei.\n\n" +
      "Fisierul bijuterii.in contine numere naturale din intervalul [10,999]: pe prima linie doua numere nc si np, reprezentand numarul de cercei, respectiv de pandantive disponibile, pe a doua linie un sir de nc numere, reprezentand etichetele cerceilor, iar pe a treia linie un sir de np numere, reprezentand etichetele pandantivelor. Numerele aflate pe aceeasi linie a fisierului sunt separate prin cate un spatiu. Se cere sa se afiseze pe ecran mesajul DA, daca se poate forma cel putin un set potrivit de bijuterii, sau mesajul NU, in caz contrar. Proiectati un algoritm eficient din punctul de vedere al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine numerele\n10 11\n497 125 521 497 513 258 491 55 551 16\n21 259 943 77 945 57 52 552 16 17 71\nse afiseaza pe ecran mesajul DA\n(doua dintre cele 14 seturi potrivite se pot forma din cerceii cu eticheta 258 si fiecare dintre pandantivele cu etichetele 259, respectiv 52, pentru toate aceste bijuterii pietrele de tipurile 2 si 5 fiind cele mai importante).",
    input_format: "Fisierul bijuterii.in: nc np pe prima linie, etichetele cerceilor pe a doua, etichetele pandantivelor pe a treia.",
    output_format: "Se afiseaza DA daca exista cel putin un set potrivit, altfel NU.",
    constraints: "etichete in [10,999], fiecare cifra din multimea 1-9",
    hints: "Pentru fiecare bijuterie, extrageti perechea (neordonata) formata din primele doua cifre ale etichetei (cele mai importante doua pietre). Marcati perechile intalnite la cercei si, separat, la pandantive, intr-un tablou de marcaj 9x9, apoi verificati daca exista o pereche comuna.",
    explanation:
      "Pentru fiecare cercel si fiecare pandantiv se extrag primele doua cifre ale etichetei (cele mai importante doua pietre, indiferent daca eticheta are 2 sau 3 cifre) si se formeaza perechea neordonata (min,max) a acestor doua cifre. Se marcheaza intr-un tablou boolean 9x9 perechile intalnite la cercei, respectiv, separat, la pandantive. Un set potrivit exista daca si numai daca exista o pereche marcata simultan in ambele tablouri. Deoarece exista doar 81 de perechi posibile, verificarea finala este O(1), iar constructia tablourilor este O(nc+np).\n\n**Complexitate:** O(nc + np)",
    io: { input_source: "file", input_filename: "bijuterii.in", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
pair<int,int> topPair(int v) {
    string s = to_string(v);
    int d1 = s[0] - '0', d2 = s[1] - '0';
    return {min(d1, d2), max(d1, d2)};
}
int main() {
    freopen("bijuterii.in", "r", stdin);
    int nc, np; cin >> nc >> np;
    bool seenC[10][10] = {false}, seenP[10][10] = {false};
    for (int i = 0; i < nc; i++) { int v; cin >> v; auto pr = topPair(v); seenC[pr.first][pr.second] = true; }
    for (int i = 0; i < np; i++) { int v; cin >> v; auto pr = topPair(v); seenP[pr.first][pr.second] = true; }
    bool ok = false;
    for (int a = 1; a <= 9 && !ok; a++) for (int b = a; b <= 9; b++) if (seenC[a][b] && seenP[a][b]) { ok = true; break; }
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def top_pair(v):
    s = str(v)
    d1, d2 = int(s[0]), int(s[1])
    return (min(d1, d2), max(d1, d2))

with open("bijuterii.in") as f:
    nc, np_ = map(int, f.readline().split())
    cerc = list(map(int, f.readline().split()))
    pand = list(map(int, f.readline().split()))

seen_c = set(top_pair(v) for v in cerc)
seen_p = set(top_pair(v) for v in pand)
print("DA" if seen_c & seen_p else "NU")
`,
    tests: [
      "10 11\n497 125 521 497 513 258 491 55 551 16\n21 259 943 77 945 57 52 552 16 17 71",
      "1 1\n12\n34",
      "1 1\n12\n21",
      "2 2\n99 88\n77 66",
      (() => {
        const nc = 20000, np = 20000;
        const cerc = [];
        const pand = [];
        for (let i = 0; i < nc; i++) cerc.push(String(10 + (i % 90)));
        for (let i = 0; i < np; i++) pand.push(String(910 - (i % 90)));
        return `${nc} ${np}\n${cerc.join(" ")}\n${pand.join(" ")}`;
      })(),
    ],
  },
  // ===================== SESIUNE SPECIALA 2025 =====================
  {
    slug: "bac-speciala-2025-3-1",
    subcategoryId: "speciala-2025",
    title: "Bacalaureat Sesiune Speciala 2025, S3.1 - Cel mai mare divizor patrat perfect",
    difficulty: "medium",
    tags: ["bacalaureat", "2025", "speciala", "subiectul3", "divizori"],
    statement:
      "Subprogramul diviz are un singur parametru, n, prin care primeste un numar natural (n in [1,10^9]). Subprogramul returneaza cel mai mare divizor al lui n care este patrat perfect.\n\n" +
      "Scrieti definitia completa a subprogramului C/C++.\n\n" +
      "Exemplu: pentru n=72 subprogramul returneaza 36, pentru n=16 subprogramul returneaza 16, iar pentru n=15 subprogramul returneaza 1.",
    input_format: "Se citeste de la tastatura n.",
    output_format: "Se afiseaza cel mai mare divizor al lui n care este patrat perfect.",
    constraints: "1 <= n <= 10^9",
    hints: "Descompuneti n in factori primi prin cautare pana la radacina patrata a lui n; pentru fiecare factor prim p cu exponent e, in divizorul-patrat-perfect maxim intra p ridicat la 2*(e/2).",
    explanation: "Se descompune n in factori primi prin trial division pana la sqrt(n); pentru fiecare factor prim p cu exponent e in descompunerea lui n, se retine in rezultat p ridicat la puterea 2*floor(e/2) (partea 'para' a exponentului). Rezultatul final este produsul acestor puteri, fiind cel mai mare divizor patrat perfect al lui n.\n\n**Complexitate:** O(sqrt(n))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    cout << diviz(n) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(diviz(n))
`,
    cpp: `long long diviz(long long n) {
    long long rez = 1;
    for (long long p = 2; p * p <= n; p++) {
        int e = 0;
        while (n % p == 0) { n /= p; e++; }
        int half = e / 2;
        for (int i = 0; i < half; i++) rez *= p * p;
    }
    return rez;
}
`,
    py: `def diviz(n):
    rez = 1
    p = 2
    while p * p <= n:
        e = 0
        while n % p == 0:
            n //= p
            e += 1
        half = e // 2
        rez *= (p * p) ** half
        p += 1
    return rez
`,
    tests: ["72", "16", "15", "1000000000", "1"],
  },
  {
    slug: "bac-speciala-2025-3-2",
    subcategoryId: "speciala-2025",
    title: "Bacalaureat Sesiune Speciala 2025, S3.2 - Cuvinte despartite prin cratime",
    difficulty: "medium",
    tags: ["bacalaureat", "2025", "speciala", "subiectul3", "siruri-caractere"],
    statement:
      "Intr-un text de cel mult 100 de caractere cuvintele sunt formate doar din litere mici ale alfabetului englez si sunt separate prin unul sau mai multe spatii. Textul are cel putin doua cuvinte.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura un text de tipul precizat mai sus si il transforma in memorie prin eliminarea sau inserarea unor spatii si a unor cratime (simbolul -), astfel incat intre oricare doua cuvinte consecutive in text sa fie cate o cratima, incadrata la stanga si la dreapta de cate un spatiu, ca in exemplu. Programul afiseaza pe ecran textul obtinut.\n\n" +
      "Exemplu: pentru textul anul acesta devin student se obtine anul - acesta - devin - student",
    input_format: "Se citeste o linie de text.",
    output_format: "Se afiseaza textul cu cuvintele separate prin ' - '.",
    constraints: "text de cel mult 100 de caractere, cel putin doua cuvinte, separate prin unul sau mai multe spatii",
    hints: "Extrageti cuvintele (impartind textul dupa orice numar de spatii consecutive) si alipiti-le folosind separatorul ' - '.",
    explanation: "Se extrag cuvintele din text (tokenizand dupa spatii, indiferent de cate spatii consecutive separa doua cuvinte), apoi se afiseaza, concatenate, folosind exact separatorul ' - ' intre oricare doua cuvinte consecutive.\n\n**Complexitate:** O(lungimea textului)",
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
    while (ss >> w) words.push_back(w);
    for (size_t i = 0; i < words.size(); i++) {
        cout << words[i];
        if (i + 1 < words.size()) cout << " - ";
    }
    cout << "\\n";
    return 0;
}
`,
    py: `words = input().split()
print(" - ".join(words))
`,
    tests: ["anul acesta devin student", "ab   cd", "a b c d e", "una   doua", "x y"],
  },
  {
    slug: "bac-speciala-2025-3-3",
    subcategoryId: "speciala-2025",
    title: "Bacalaureat Sesiune Speciala 2025, S3.3 - Cele mai multe triunghiuri cu aceeasi ipotenuza",
    difficulty: "hard",
    tags: ["bacalaureat", "2025", "speciala", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul text bac.txt contine un sir de cel mult 10^6 triplete de numere naturale din intervalul [1,10^2], numerele din fiecare triplet reprezentand lungimile laturilor cate unui triunghi. Fiecare triplet se afla pe cate o linie a fisierului, iar numerele care il compun sunt separate prin cate un spatiu.\n\n" +
      "Intr-un triunghi dreptunghic patratul lungimii ipotenuzei este egal cu suma patratelor lungimilor celor doua catete.\n\n" +
      "Se cere sa se afiseze pe ecran numarul maxim de triunghiuri dreptunghice din fisier care au aceeasi lungime a ipotenuzei. Proiectati un algoritm eficient din punctul de vedere al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine numerele\n6 10 6\n7 24 25\n7 25 24\n25 14 13\n8 6 10\n15 20 25\n4 5 3\npe ecran se afiseaza 3 (sunt trei triunghiuri de tipul cerut cu ipotenuza 25: doua au catetele 7, respectiv 24, si unul are catetele 15, respectiv 20).",
    input_format: "Fisierul bac.txt: cate un triplet de numere pe fiecare linie.",
    output_format: "Se afiseaza numarul maxim de triunghiuri dreptunghice cu aceeasi ipotenuza.",
    constraints: "cel mult 10^6 triplete, laturi in [1,100]",
    hints: "Pentru fiecare triplet, sortati cele 3 valori si verificati daca cele mai mici doua, la patrat, insumate, dau patratul celei mai mari (ipotenuza). Numarati aparitiile fiecarei ipotenuze intr-un tablou de marime 101 si retineti maximul.",
    explanation: "Pentru fiecare triplet citit, se sorteaza cele 3 valori crescator; daca suma patratelor primelor doua este egala cu patratul celei de-a treia, tripletul reprezinta un triunghi dreptunghic cu ipotenuza egala cu valoarea cea mai mare. Se numara aparitiile fiecarei valori de ipotenuza intr-un tablou indexat de la 1 la 100 (marginit de constrangeri) si se retine maximul acestor numaratori pe parcursul unei singure treceri prin fisier.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    vector<long long> cnt(101, 0);
    long long a, b, c;
    long long best = 0;
    while (cin >> a >> b >> c) {
        long long v[3] = {a, b, c};
        sort(v, v + 3);
        if (v[0] * v[0] + v[1] * v[1] == v[2] * v[2]) {
            cnt[v[2]]++;
            best = max(best, cnt[v[2]]);
        }
    }
    cout << best << "\\n";
    return 0;
}
`,
    py: `cnt = [0] * 101
best = 0
with open("bac.txt") as f:
    for line in f:
        parts = line.split()
        if not parts:
            continue
        v = sorted(map(int, parts))
        if v[0] ** 2 + v[1] ** 2 == v[2] ** 2:
            cnt[v[2]] += 1
            best = max(best, cnt[v[2]])
print(best)
`,
    tests: [
      "6 10 6\n7 24 25\n7 25 24\n25 14 13\n8 6 10\n15 20 25\n4 5 3",
      "3 4 5",
      "1 1 1",
      "5 12 13\n9 12 15\n6 8 10",
      (() => {
        const lines = [];
        for (let i = 0; i < 30000; i++) lines.push("3 4 5");
        return lines.join("\n");
      })(),
    ],
  },
  // ===================== SESIUNEA VARA 2025 =====================
  {
    slug: "bac-vara-2025-3-1",
    subcategoryId: "vara-2025",
    title: "Bacalaureat Vara 2025, S3.1 - Suma ascendentilor",
    difficulty: "medium",
    tags: ["bacalaureat", "2025", "vara", "subiectul3", "cifre"],
    statement:
      "Numarul natural an este ascendent al numarului natural n, daca oricare dintre cifrele lui an este mai mare sau egala cu cifra unitatilor lui n.\n\n" +
      "Exemplu: oricare dintre numerele 7, 9, 98 sau 7998 este ascendent al lui 827, dar numarul 857 nu este ascendent al lui 827.\n\n" +
      "Subprogramul ascendent are trei parametri:\n" +
      "- n, prin care primeste un numar natural (n in [0,1000));\n" +
      "- x si y, prin care primeste cate un numar natural din intervalul [0,1000) (x<y).\n\n" +
      "Subprogramul returneaza suma ascendentilor lui n din intervalul [x,y], sau valoarea 0, daca nu exista niciun astfel de ascendent. Scrieti definitia completa a subprogramului C/C++.\n\n" +
      "Exemplu: daca n=827, x=9, y=800, subprogramul returneaza 7893 (9+77+78+79+87+88+89+97+98+99+777+778+779+787+788+789+797+798+799=7893).",
    input_format: "Se citesc n, x si y.",
    output_format: "Se afiseaza suma ascendentilor lui n din intervalul [x,y], sau 0 daca nu exista niciunul.",
    constraints: "0 <= n < 1000, 0 <= x < y < 1000",
    hints: "Pentru fiecare valoare an din [x,y], verificati daca toate cifrele lui an sunt >= cifra unitatilor lui n.",
    explanation: "Se determina cifra unitatilor lui n. Pentru fiecare valoare an din intervalul [x,y], se verifica daca toate cifrele sale sunt mai mari sau egale cu aceasta cifra; daca da, an se aduna la suma rezultat.\n\n**Complexitate:** O((y-x) * numar de cifre)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int n, x, y; cin >> n >> x >> y;
    cout << ascendent(n, x, y) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n, x, y = map(int, input().split())
print(ascendent(n, x, y))
`,
    cpp: `long long ascendent(int n, int x, int y) {
    int u = n % 10;
    long long sum = 0;
    for (int an = x; an <= y; an++) {
        int t = an;
        bool ok = true;
        if (t == 0) ok = (0 >= u);
        while (t > 0) { if (t % 10 < u) { ok = false; break; } t /= 10; }
        if (ok) sum += an;
    }
    return sum;
}
`,
    py: `def ascendent(n, x, y):
    u = n % 10
    total = 0
    for an in range(x, y + 1):
        t = an
        ok = True
        if t == 0:
            ok = (0 >= u)
        else:
            while t > 0:
                if t % 10 < u:
                    ok = False
                    break
                t //= 10
        if ok:
            total += an
    return total
`,
    tests: ["827 9 800", "0 0 10", "999 0 999", "100 5 50", "5 900 999"],
  },
  {
    slug: "bac-vara-2025-3-2",
    subcategoryId: "vara-2025",
    title: "Bacalaureat Vara 2025, S3.2 - Cuvinte semioglindite",
    difficulty: "medium",
    tags: ["bacalaureat", "2025", "vara", "subiectul3", "siruri-caractere"],
    statement:
      "Un cuvant semioglindit se obtine dintr-un cuvant cu 2*k (k in [1,10^2]) litere, prin interschimbarea in acesta a secventei formate din primele k litere cu secventa formata din ultimele k litere.\n\n" +
      "Exemplu: din cuvantul platim se obtine cuvantul semioglindit timpla.\n\n" +
      "Intr-un text de cel mult 200 de caractere, cuvintele sunt formate din litere mici ale alfabetului englez si sunt separate prin cate un spatiu. Scrieti un program C/C++ care citeste de la tastatura un text de tipul precizat, pe care il transforma in memorie, prin inlocuirea fiecarui cuvant cu numar par de litere, cu cel semioglindit obtinut din acesta, ca in exemplu. Programul afiseaza pe ecran textul obtinut, sau mesajul nu exista, daca toate cuvintele au numar impar de litere.\n\n" +
      "Exemplu: pentru textul am facut fotografii unei flori mari se afiseaza pe ecran textul ma facut rafiifotog eiun flori rima",
    input_format: "Se citeste o linie de text.",
    output_format: "Textul cu fiecare cuvant de lungime para inlocuit cu semioglinditul sau, sau mesajul 'nu exista' daca toate cuvintele au lungime impara.",
    constraints: "text de cel mult 200 de caractere",
    hints: "Pentru un cuvant de lungime para 2k, semioglinditul se obtine prin swap-ul primelor k litere cu ultimele k litere (concatenare inversa a celor doua jumatati).",
    explanation: "Se parcurg cuvintele textului; pentru fiecare cuvant cu lungime para 2k, se construieste semioglinditul prin concatenarea celei de-a doua jumatati (ultimele k litere) cu prima jumatate (primele k litere); cuvintele cu lungime impara raman neschimbate. Daca niciun cuvant nu are lungime para, se afiseaza mesajul cerut in loc de text.\n\n**Complexitate:** O(lungimea textului)",
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
    bool anyEven = false;
    while (ss >> w) {
        if (w.size() % 2 == 0) {
            anyEven = true;
            int k = (int)w.size() / 2;
            w = w.substr(k, k) + w.substr(0, k);
        }
        words.push_back(w);
    }
    if (!anyEven) { cout << "nu exista\\n"; return 0; }
    for (size_t i = 0; i < words.size(); i++) cout << words[i] << (i + 1 < words.size() ? " " : "\\n");
    return 0;
}
`,
    py: `words = input().split()
any_even = False
rez = []
for w in words:
    if len(w) % 2 == 0:
        any_even = True
        k = len(w) // 2
        w = w[k:] + w[:k]
    rez.append(w)
print("nu exista" if not any_even else " ".join(rez))
`,
    tests: ["am facut fotografii unei flori mari", "abc def", "platim", "ab cd ef", "abcdef"],
  },
  {
    slug: "bac-vara-2025-3-3",
    subcategoryId: "vara-2025",
    title: "Bacalaureat Vara 2025, S3.3 - Muzee convenabile",
    difficulty: "hard",
    tags: ["bacalaureat", "2025", "vara", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Un tanar pasionat de calatorii are o lista cu muzee virtuale si, pentru fiecare, cate un singur interval orar, in care acesta poate fi vizitat online, gratuit. Tanarul dispune zilnic de acelasi interval orar pentru vizite; un muzeu este convenabil daca poate fi vizitat online gratuit in timpul disponibil si daca pentru vizita ii poate aloca cel putin o ora. Muzeele din lista sunt numerotate cu valori naturale consecutive, incepand cu 1, si cel putin unul este convenabil.\n\n" +
      "Fisierul text bac.in contine cel mult 10^5 linii, iar pe fiecare linie cate o pereche de numere, reprezentand limitele cate unui interval orar: pe prima linie intervalul orar de care tanarul dispune zilnic, iar pe fiecare dintre urmatoarele linii, intervalul orar de vizitare gratuita pentru cate un muzeu, in ordinea din lista. Limitele intervalelor sunt ore fixe, numere naturale din intervalul [8,22], iar cele aflate pe aceeasi linie a fisierului sunt in ordine strict crescatoare si sunt separate printr-un spatiu.\n\n" +
      "Se cere sa se afiseze pe ecran, separate printr-un spatiu, doua valori, reprezentand numarul de muzee convenabile, respectiv numarul de ordine al ultimului astfel de muzeu din lista tanarului. Utilizati un algoritm eficient din punctul de vedere al timpului de executare si al memoriei utilizate.\n\n" +
      "Exemplu: daca fisierul contine valorile\n16 19\n15 18\n17 21\n19 21\n18 20\n12 13\natunci pe ecran se afiseaza numerele 3 4 (pot fi vizitate trei muzee cu numerele de ordine 1, 2 si 4, in intervalele 16-18, 17-19, respectiv 18-19).",
    input_format: "Fisierul bac.in: intervalul disponibil pe prima linie, cate un interval de muzeu pe fiecare linie urmatoare.",
    output_format: "Numarul de muzee convenabile si numarul de ordine al ultimului muzeu convenabil.",
    constraints: "cel mult 10^5 muzee, ore in [8,22]",
    hints: "Pentru fiecare muzeu, calculati durata suprapunerii dintre intervalul disponibil si intervalul muzeului: min(sfarsituri)-max(inceputuri). Daca este cel putin 1, muzeul este convenabil.",
    explanation: "Se citeste intervalul disponibil [d1,d2]. Se parcurge apoi fisierul o singura data, iar pentru fiecare muzeu i cu intervalul [a,b] se calculeaza suprapunerea min(d2,b)-max(d1,a); daca aceasta este >=1, muzeul este convenabil: se incrementeaza contorul si se retine i ca ultimul muzeu convenabil gasit pana in acel moment.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.in", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.in", "r", stdin);
    int d1, d2; cin >> d1 >> d2;
    int a, b;
    int count = 0, lastIdx = -1, idx = 0;
    while (cin >> a >> b) {
        idx++;
        int overlap = min(d2, b) - max(d1, a);
        if (overlap >= 1) { count++; lastIdx = idx; }
    }
    cout << count << " " << lastIdx << "\\n";
    return 0;
}
`,
    py: `with open("bac.in") as f:
    d1, d2 = map(int, f.readline().split())
    count, last_idx, idx = 0, -1, 0
    for line in f:
        parts = line.split()
        if not parts:
            continue
        a, b = map(int, parts)
        idx += 1
        overlap = min(d2, b) - max(d1, a)
        if overlap >= 1:
            count += 1
            last_idx = idx
print(count, last_idx)
`,
    tests: [
      "16 19\n15 18\n17 21\n19 21\n18 20\n12 13",
      "8 22\n8 9",
      "10 11\n10 11\n10 11",
      "9 10\n8 9\n10 22",
      (() => {
        const lines = ["8 22"];
        for (let i = 0; i < 30000; i++) lines.push(`${8 + (i % 10)} ${9 + (i % 13)}`);
        return lines.join("\n");
      })(),
    ],
  },
  // ===================== SESIUNEA TOAMNA 2025 =====================
  {
    slug: "bac-toamna-2025-3-1",
    subcategoryId: "toamna-2025",
    title: "Bacalaureat Toamna 2025, S3.1 - Impartirea terenului in parcele",
    difficulty: "medium",
    tags: ["bacalaureat", "2025", "toamna", "subiectul3", "divizori"],
    statement:
      "Un fermier are un teren de forma dreptunghiulara, pe care vrea sa il imparta in parcele de arie egala, astfel incat numarul de parcele si aria sa fie valori naturale, iar numarul de parcele sa fie par si strict mai mic decat aria unei parcele. Subprogramul teren are doi parametri, x si y, prin care primeste doua numere naturale din intervalul [2,100], reprezentand lungimea si latimea terenului, masurate in metri. Subprogramul afiseaza toate solutiile posibile de impartire a terenului, fiecare solutie pe cate o linie a ecranului, sub forma a doua numere, separate prin mesajul parcele de arie si spatii adecvate, unde primul numar reprezinta numarul de parcele obtinute, iar al doilea aria unei parcele corespunzatoare, ca in exemplu. Daca nu exista nicio astfel de solutie, subprogramul afiseaza pe ecran mesajul nu exista. Scrieti definitia completa a subprogramului C/C++.\n\n" +
      "Exemplu: pentru x=6 si y=8, subprogramul afiseaza pe ecran valorile alaturate, nu neaparat in aceasta ordine (terenul poate fi impartit si in 3 parcele de arie 16 sau 8 parcele de arie 6, dar nu corespund cerintei).\n2 parcele de arie 24\n4 parcele de arie 12\n6 parcele de arie 8",
    input_format: "Se citesc x si y.",
    output_format: "Toate perechile (numar de parcele, arie), cate una pe linie, sub forma 'P parcele de arie S', sau mesajul 'nu exista'.",
    constraints: "2 <= x, y <= 100",
    hints: "Aria totala este A=x*y. Cautati divizorii pari P ai lui A astfel incat P < A/P; parcurgeti P doar pana la radacina patrata a lui A, deoarece conditia P<A/P implica P*P<A.",
    explanation: "Se calculeaza aria totala A=x*y. Se parcurg valorile P de la 2 la radacina patrata a lui A (deoarece P<A/P implica P*P<A); pentru fiecare P care divide A, se verifica daca P este par, iar daca da, se afiseaza linia corespunzatoare cu S=A/P. Daca nu se gaseste nicio solutie, se afiseaza mesajul cerut.\n\n**Complexitate:** O(sqrt(x*y))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int x, y; cin >> x >> y;
    teren(x, y);
    return 0;
}
`,
    function_template_python: `__USER_CODE__

x, y = map(int, input().split())
teren(x, y)
`,
    cpp: `void teren(int x, int y) {
    long long A = (long long)x * y;
    bool any = false;
    for (long long p = 2; p * p < A; p++) {
        if (A % p == 0 && p % 2 == 0) {
            any = true;
            cout << p << " parcele de arie " << (A / p) << "\\n";
        }
    }
    if (!any) cout << "nu exista\\n";
}
`,
    py: `def teren(x, y):
    A = x * y
    any_found = False
    p = 2
    while p * p < A:
        if A % p == 0 and p % 2 == 0:
            any_found = True
            print(f"{p} parcele de arie {A // p}")
        p += 1
    if not any_found:
        print("nu exista")
`,
    tests: ["6 8", "2 2", "100 100", "3 5", "7 11"],
  },
  {
    slug: "bac-toamna-2025-3-2",
    subcategoryId: "toamna-2025",
    title: "Bacalaureat Toamna 2025, S3.2 - Inlocuirea coloanei cu minim",
    difficulty: "medium",
    tags: ["bacalaureat", "2025", "toamna", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Scrieti un program C/C++ care citeste de la tastatura doua numere naturale din intervalul [2,10^2], m si n, si elementele unui tablou bidimensional cu m linii si n coloane, numere naturale distincte din intervalul [0,10^9]. Programul modifica tabloul in memorie, inlocuind valorile tuturor elementelor aflate pe coloana care contine numarul minim memorat in tablou cu valoarea elementului aflat pe ultima linie si ultima coloana. Tabloul obtinut este afisat pe ecran, cate o linie a tabloului pe cate o linie a ecranului, elementele fiecarei linii fiind separate prin cate un spatiu.\n\n" +
      "Exemplu: pentru m=3, n=4 si tabloul\n17 12 5 19\n10 16 2 4\n11 21 8 9\nse obtine tabloul\n17 12 9 19\n10 16 9 4\n11 21 9 9",
    input_format: "Se citesc m, n, apoi elementele tabloului cu m linii si n coloane.",
    output_format: "Tabloul dupa inlocuirea coloanei minimului cu valoarea din coltul dreapta-jos.",
    constraints: "2 <= m, n <= 100, elemente distincte in [0,10^9]",
    hints: "Gasiti pozitia (i,j) a valorii minime din tablou; retineti valoarea din coltul dreapta-jos (inainte de orice modificare); inlocuiti toate elementele coloanei j cu aceasta valoare.",
    explanation: "Se parcurge tabloul pentru a gasi coloana in care se afla elementul minim. Se retine valoarea din coltul dreapta-jos al tabloului (linia m, coloana n), inainte de a face vreo modificare. Apoi, pentru fiecare linie, elementul de pe coloana minimului este inlocuit cu aceasta valoare retinuta.\n\n**Complexitate:** O(m*n)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int m, n; cin >> m >> n;
    vector<vector<long long>> a(m + 1, vector<long long>(n + 1));
    for (int i = 1; i <= m; i++) for (int j = 1; j <= n; j++) cin >> a[i][j];
    int minCol = 1;
    long long minVal = a[1][1];
    for (int i = 1; i <= m; i++) for (int j = 1; j <= n; j++) if (a[i][j] < minVal) { minVal = a[i][j]; minCol = j; }
    long long corner = a[m][n];
    for (int i = 1; i <= m; i++) a[i][minCol] = corner;
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) cout << a[i][j] << (j < n ? " " : "\\n");
    }
    return 0;
}
`,
    py: `m, n = map(int, input().split())
a = [[0] * (n + 1) for _ in range(m + 1)]
for i in range(1, m + 1):
    row = list(map(int, input().split()))
    for j in range(1, n + 1):
        a[i][j] = row[j - 1]
min_col, min_val = 1, a[1][1]
for i in range(1, m + 1):
    for j in range(1, n + 1):
        if a[i][j] < min_val:
            min_val, min_col = a[i][j], j
corner = a[m][n]
for i in range(1, m + 1):
    a[i][min_col] = corner
for i in range(1, m + 1):
    print(" ".join(str(a[i][j]) for j in range(1, n + 1)))
`,
    tests: [
      "3 4\n17 12 5 19\n10 16 2 4\n11 21 8 9",
      "2 2\n1 2\n3 0",
      "2 2\n0 1\n2 3",
      "3 3\n9 8 7\n6 5 4\n3 2 1",
      "2 3\n5 1 9\n3 2 8",
    ],
  },
  {
    slug: "bac-toamna-2025-3-3",
    subcategoryId: "toamna-2025",
    title: "Bacalaureat Toamna 2025, S3.3 - Perioade validate de productie",
    difficulty: "hard",
    tags: ["bacalaureat", "2025", "toamna", "subiectul3", "eficienta", "fisiere"],
    statement:
      "La o centrala solara se monitorizeaza stocul zilnic de energie produsa si stocul total calculat pentru fiecare perioada. Zilele de monitorizare sunt numerotate cu valori naturale consecutive, in ordine cronologica, incepand cu ziua 1. O perioada este formata din cel putin doua zile de monitorizare, consecutive, iar stocul total calculat pentru ea este suma stocurilor zilnice corespunzatoare. O zi este validata daca stocul zilnic este cel putin egal cu limita zilnica, minZ; o perioada este validata daca stocul total calculat pentru ea este cel putin egal cu limita stabilita pentru perioade, minP, fiecare zi a perioadei este validata, iar perioada este maximala in raport cu aceasta proprietate (nu i se mai poate adauga nicio zi validata).\n\n" +
      "Fisierul text bac.in contine cel mult 10^6 numere naturale din intervalul [1,10^3]: pe prima linie minZ si minP, reprezentand limitele precizate pentru validare, iar pe a doua linie stocurile zilnice de energie produse in zile consecutive, in ordinea monitorizarii. Numerele aflate pe aceeasi linie a fisierului sunt separate prin cate un spatiu.\n\n" +
      "Se cere sa se afiseze pe ecran, pentru fiecare perioada de productie validata, corespunzatoare datelor din fisier, cate un triplet de numere, reprezentand prima si ultima zi a perioadei, respectiv stocul total calculat pentru ea. Valorile din fiecare triplet se afiseaza pe cate o linie a ecranului, separate prin cate un spatiu, iar daca nu exista nicio astfel de perioada, se afiseaza mesajul nu exista. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine valorile\n10 40\n65 9 20 25 12 14 7 3 11 15 12 8 19 50 21\nse afiseaza pe ecran\n3 6 71\n13 15 90",
    input_format: "Fisierul bac.in: minZ minP pe prima linie, stocurile zilnice pe a doua.",
    output_format: "Cate un triplet (prima zi, ultima zi, stoc total) pentru fiecare perioada validata, sau mesajul 'nu exista'.",
    constraints: "cel mult 10^6 valori, in [1,1000]",
    hints: "O perioada validata este exact un bloc maximal de zile consecutive validate (stoc>=minZ), de lungime cel putin 2, al carui stoc total este >=minP. Parcurgeti sirul o singura data, urmarind inceputul blocului curent de zile validate si suma sa; la fiecare zi nevalidata (sau la finalul fisierului), inchideti blocul curent si verificati daca indeplineste conditiile.",
    explanation: "Se parcurge sirul zilnic o singura data, mentinand inceputul blocului curent de zile consecutive validate (stoc>=minZ) si suma stocurilor din acest bloc. Cand se intalneste o zi nevalidata (sau se ajunge la finalul fisierului), blocul curent se inchide: daca are cel putin 2 zile si suma sa este >=minP, se afiseaza tripletul (prima zi, ultima zi, suma). Un bloc maximal de zile validate reprezinta exact o perioada 'maximala' conform enuntului, deci nu este nevoie sa se ia in considerare subsecvente ale blocului.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.in", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.in", "r", stdin);
    long long minZ, minP; cin >> minZ >> minP;
    long long v;
    long long day = 0, blockStart = -1, blockSum = 0;
    bool any = false;
    vector<pair<long long,pair<long long,long long>>> rez;
    auto closeBlock = [&](long long endDay) {
        if (blockStart != -1) {
            long long len = endDay - blockStart + 1;
            if (len >= 2 && blockSum >= minP) {
                rez.push_back({blockStart, {endDay, blockSum}});
                any = true;
            }
        }
        blockStart = -1; blockSum = 0;
    };
    while (cin >> v) {
        day++;
        if (v >= minZ) {
            if (blockStart == -1) { blockStart = day; blockSum = 0; }
            blockSum += v;
        } else {
            closeBlock(day - 1);
        }
    }
    closeBlock(day);
    if (!any) { cout << "nu exista\\n"; return 0; }
    for (auto& t : rez) cout << t.first << " " << t.second.first << " " << t.second.second << "\\n";
    return 0;
}
`,
    py: `import sys

with open("bac.in") as f:
    min_z, min_p = map(int, f.readline().split())
    data = f.readline().split()

rez = []
block_start, block_sum = -1, 0
day = 0

def close_block(end_day):
    global block_start, block_sum
    if block_start != -1:
        length = end_day - block_start + 1
        if length >= 2 and block_sum >= min_p:
            rez.append((block_start, end_day, block_sum))
    block_start, block_sum = -1, 0

for tok in data:
    v = int(tok)
    day += 1
    if v >= min_z:
        if block_start == -1:
            block_start = day
            block_sum = 0
        block_sum += v
    else:
        close_block(day - 1)
close_block(day)

if not rez:
    print("nu exista")
else:
    for a, b, s in rez:
        print(a, b, s)
`,
    tests: [
      "10 40\n65 9 20 25 12 14 7 3 11 15 12 8 19 50 21",
      "5 5\n1 1 1",
      "1 2\n1 1",
      "10 1000\n10 10 10",
      (() => {
        const lines = ["5 20"];
        const vals = [];
        for (let i = 0; i < 30000; i++) vals.push(String(i % 12 < 6 ? 10 : 1));
        lines.push(vals.join(" "));
        return lines.join("\n");
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
