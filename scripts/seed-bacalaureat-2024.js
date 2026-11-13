const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const LEVEL = "bacalaureat";
const CHAPTER = { id: "bacalaureat-2024", name: "Bacalaureat 2024" };

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

const SRC = "Bacalaureat Informatica MI 2024 (Ministerul Educatiei / CNPEE)";

const problems = [
  // ===================== SESIUNEA VARA 2024 =====================
  {
    slug: "bac-vara-2024-3-1",
    subcategoryId: "vara-2024",
    title: "Bacalaureat Vara 2024, S3.1 - Cel mai mic numar major impar",
    difficulty: "medium",
    tags: ["bacalaureat", "2024", "vara", "subiectul3", "divizori"],
    statement:
      "Un numar natural se numeste major impar daca suma divizorilor sai proprii impari este strict mai mare decat suma divizorilor sai proprii pari. Divizorii proprii ai unui numar sunt divizorii sai naturali diferiti de 1 si de el insusi.\n\n" +
      "Exemplu: 18 este numar major impar (divizorii sai proprii pari sunt 2, 6, cei impari 3, 9, iar 3+9>2+6).\n\n" +
      "Subprogramul majImp are doi parametri, a si b, prin care primeste cate un numar natural (2<=a<=b<=10^4). Subprogramul returneaza cel mai mic numar major impar din intervalul [a,b], sau valoarea 0, daca in interval nu exista un astfel de numar.\n\n" +
      "Scrieti in C/C++ definitia completa a subprogramului.\n\n" +
      "Exemplu: daca a=16, b=30, atunci subprogramul returneaza 18.",
    input_format: "Se citesc de la tastatura a si b.",
    output_format: "Se afiseaza cel mai mic numar major impar din [a,b], sau 0 daca nu exista.",
    constraints: "2 <= a <= b <= 10^4",
    hints: "Pentru fiecare n din [a,b], determinati divizorii proprii (excluzand 1 si n), insumati separat cei pari si cei impari, si verificati conditia.",
    explanation: "Se parcurg valorile n de la a la b; pentru fiecare, se determina divizorii proprii (divizorii naturali diferiti de 1 si de n) prin cautare pana la radacina patrata, insumandu-i separat pe cei pari si pe cei impari; daca suma impara este strict mai mare, n este major impar si se returneaza imediat (fiind primul, deci cel mai mic, gasit).\n\n**Complexitate:** O((b-a)*sqrt(b))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int a, b; cin >> a >> b;
    cout << majImp(a, b) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

a, b = map(int, input().split())
print(majImp(a, b))
`,
    cpp: `int majImp(int a, int b) {
    for (int n = a; n <= b; n++) {
        long long sumOdd = 0, sumEven = 0;
        for (int d = 2; d * d <= n; d++) {
            if (n % d == 0) {
                int d2 = n / d;
                if (d != n) { if (d % 2 == 1) sumOdd += d; else sumEven += d; }
                if (d2 != d && d2 != n) { if (d2 % 2 == 1) sumOdd += d2; else sumEven += d2; }
            }
        }
        if (sumOdd > sumEven) return n;
    }
    return 0;
}
`,
    py: `def majImp(a, b):
    for n in range(a, b + 1):
        sum_odd, sum_even = 0, 0
        d = 2
        while d * d <= n:
            if n % d == 0:
                d2 = n // d
                if d != n:
                    if d % 2 == 1: sum_odd += d
                    else: sum_even += d
                if d2 != d and d2 != n:
                    if d2 % 2 == 1: sum_odd += d2
                    else: sum_even += d2
            d += 1
        if sum_odd > sum_even:
            return n
    return 0
`,
    tests: ["16 30", "2 4", "2 2", "9999 10000", "100 200"],
  },
  {
    slug: "bac-vara-2024-3-2",
    subcategoryId: "vara-2024",
    title: "Bacalaureat Vara 2024, S3.2 - Cuvinte de lungime egala",
    difficulty: "medium",
    tags: ["bacalaureat", "2024", "vara", "subiectul3", "siruri-caractere"],
    statement:
      "Intr-un text, de cel mult 100 de caractere, cuvintele sunt formate din litere ale alfabetului englez si sunt separate prin cate un spatiu. Textul are cel putin doua cuvinte.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura un text de tipul precizat mai sus si afiseaza pe ecran mesajul DA si un numar natural n, separate printr-un spatiu, daca toate cuvintele din text au cate n litere, sau mesajul NU in cazul in care nu toate cuvintele au acelasi numar de litere.\n\n" +
      "Exemplu: daca textul citit este Ana are cel mai bun mar se afiseaza pe ecran DA 3, iar daca textul citit este Ana are cel mai dulce mar se afiseaza pe ecran NU",
    input_format: "Se citeste de la tastatura o linie de text.",
    output_format: "Se afiseaza 'DA n' daca toate cuvintele au n litere, altfel 'NU'.",
    constraints: "textul are cel mult 100 de caractere, cel putin doua cuvinte",
    hints: "Comparati lungimea fiecarui cuvant cu lungimea primului cuvant.",
    explanation: "Se retine lungimea primului cuvant si se verifica daca toate celelalte cuvinte au aceeasi lungime; daca da, se afiseaza 'DA' urmat de acea lungime comuna, altfel 'NU'.\n\n**Complexitate:** O(lungimea textului)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    string w;
    int n = -1;
    bool ok = true;
    while (ss >> w) {
        if (n == -1) n = (int)w.size();
        else if ((int)w.size() != n) ok = false;
    }
    if (ok) cout << "DA " << n << "\\n"; else cout << "NU\\n";
    return 0;
}
`,
    py: `words = input().split()
n = len(words[0])
ok = all(len(w) == n for w in words)
print(f"DA {n}" if ok else "NU")
`,
    tests: ["Ana are cel mai bun mar", "Ana are cel mai dulce mar", "ab cd ef", "a bb", "unu doi trei"],
  },
  {
    slug: "bac-vara-2024-3-3",
    subcategoryId: "vara-2024",
    title: "Bacalaureat Vara 2024, S3.3 - Scara de lungime maxima",
    difficulty: "hard",
    tags: ["bacalaureat", "2024", "vara", "subiectul3", "eficienta", "fisiere"],
    statement:
      "De-a lungul unui traseu montan este utilizata o succesiune de marcaje turistice, care trebuie urmate in acea ordine. Pentru fiecare marcaj se cunoaste cota (inaltimea, masurata in metri) la care este plasat. Numim scara intr-un traseu o secventa de marcaje aflate pe pozitii consecutive in cadrul traseului, care au drept cote numere consecutive, ordonate strict crescator. O scara este formata din cel putin doua marcaje, iar lungimea acesteia este egala cu numarul de marcaje care o compun.\n\n" +
      "Fisierul bac.txt contine un sir de cel mult 10^6 numere naturale din intervalul [10,10^4], separate prin cate un spatiu, reprezentand cotele marcajelor turistice din cadrul unui traseu. Se cere sa se afiseze pe ecran, separate prin cate un spatiu, in ordine strict crescatoare, cotele corespunzatoare marcajelor unei scari de lungime maxima pe acest traseu. Daca exista mai multe astfel de scari, se afiseaza doar cotele corespunzatoare uneia dintre ele, iar daca nu exista nicio scara, pe ecran se afiseaza mesajul nu exista. Proiectati un algoritm eficient din punctul de vedere al timpului de executare si al spatiului de memorie utilizat.\n\n" +
      "Exemplu: daca fisierul contine numerele 500 600 601 405 569 570 700 701 625 626 627 520 atunci pe ecran se afiseaza 625 626 627",
    input_format: "Fisierul bac.txt: un sir de numere naturale din [10,10^4], separate prin spatiu.",
    output_format: "Se afiseaza cotele marcajelor unei scari de lungime maxima, in ordine crescatoare, sau mesajul 'nu exista' daca nu exista nicio scara.",
    constraints: "cel mult 10^6 termeni",
    hints: "Parcurgeti sirul o singura data, mentinand inceputul si lungimea 'scarii' curente (secventa de consecutive crescatoare terminata in termenul curent); ori de cate ori lungimea curenta depaseste strict cea mai buna gasita pana atunci, actualizati raspunsul.",
    explanation:
      "Se parcurge sirul o singura data, mentinand valoarea de start si lungimea 'scarii' care se termina la termenul curent: daca termenul curent este cu exact 1 mai mare decat precedentul, scara curenta se extinde; altfel, incepe o noua scara de lungime 1 la acest termen. Ori de cate ori lungimea scarii curente creste STRICT peste cea mai buna gasita pana atunci (si este de cel putin 2 termeni), se retine ca noul raspuns cel mai bun (valoarea de inceput si lungimea). La final, daca s-a gasit vreo scara de lungime >=2, se afiseaza secventa corespunzatoare (usor de reconstruit, fiind numere consecutive incepand de la valoarea retinuta); altfel, mesajul cerut.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    long long v, prev = -1000;
    long long curStart = 0, curLen = 0, bestStart = -1, bestLen = 0;
    while (cin >> v) {
        if (v == prev + 1) curLen++;
        else { curStart = v; curLen = 1; }
        if (curLen >= 2 && curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
        prev = v;
    }
    if (bestLen < 2) { cout << "nu exista\\n"; return 0; }
    for (long long i = 0; i < bestLen; i++) cout << (bestStart + i) << (i + 1 < bestLen ? " " : "\\n");
    return 0;
}
`,
    py: `prev = -1000
cur_start, cur_len = 0, 0
best_start, best_len = -1, 0
with open("bac.txt") as f:
    data = f.read().split()
for tok in data:
    v = int(tok)
    if v == prev + 1:
        cur_len += 1
    else:
        cur_start, cur_len = v, 1
    if cur_len >= 2 and cur_len > best_len:
        best_len, best_start = cur_len, cur_start
    prev = v
if best_len < 2:
    print("nu exista")
else:
    print(" ".join(str(best_start + i) for i in range(best_len)))
`,
    tests: [
      "500 600 601 405 569 570 700 701 625 626 627 520",
      "10 11",
      "10 20 30",
      "100 101 102 103 200 201",
      (() => {
        const parts = [];
        for (let i = 0; i < 15000; i++) {
          if (i % 20 < 3) parts.push(String(1000 + (i % 20)));
          else parts.push(String(9999 - (i % 7)));
        }
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== MODEL 2024 =====================
  {
    slug: "bac-model-2024-3-1",
    subcategoryId: "model-2024",
    title: "Bacalaureat Model 2024, S3.1 - Produsul divizorilor comuni",
    difficulty: "medium",
    tags: ["bacalaureat", "2024", "model", "subiectul3", "divizori"],
    statement:
      "Subprogramul produs are doi parametri, a si b, prin care primeste cate un numar natural din intervalul [1,10^3]. Subprogramul returneaza produsul divizorilor naturali comuni lui a si b.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca a=20 si b=12, atunci subprogramul returneaza valoarea 8 (1*2*4=8).",
    input_format: "Se citesc de la tastatura a si b.",
    output_format: "Se afiseaza produsul divizorilor comuni lui a si b.",
    constraints: "1 <= a, b <= 10^3",
    hints: "Parcurgeti d de la 1 la min(a,b) si inmultiti rezultatul cu d ori de cate ori d divide simultan a si b.",
    explanation: "Se parcurg valorile d de la 1 la min(a,b), inmultind rezultatul cu d de fiecare data cand d divide simultan a si b (adica este un divizor comun).\n\n**Complexitate:** O(min(a,b))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int a, b; cin >> a >> b;
    cout << produs(a, b) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

a, b = map(int, input().split())
print(produs(a, b))
`,
    cpp: `long long produs(int a, int b) {
    long long p = 1;
    int lim = min(a, b);
    for (int d = 1; d <= lim; d++) if (a % d == 0 && b % d == 0) p *= d;
    return p;
}
`,
    py: `def produs(a, b):
    p = 1
    for d in range(1, min(a, b) + 1):
        if a % d == 0 and b % d == 0:
            p *= d
    return p
`,
    tests: ["20 12", "7 13", "1 1", "999 333", "100 100"],
  },
  {
    slug: "bac-model-2024-3-2",
    subcategoryId: "model-2024",
    title: "Bacalaureat Model 2024, S3.2 - Cuvinte scurte si lungi",
    difficulty: "medium",
    tags: ["bacalaureat", "2024", "model", "subiectul3", "siruri-caractere"],
    statement:
      "Un text are cel mult 100 de caractere, iar cuvintele sale sunt formate numai din litere mici ale alfabetului englez, sunt distincte si sunt separate prin cate un spatiu. Scrieti un program C/C++ care citeste de la tastatura un numar natural n (n in [1,10^2]), apoi un text de tipul precizat mai sus, si afiseaza pe ecran cuvinte ale acestuia, pe doua linii separate, astfel incat prima linie sa contina multimea cuvintelor care au mai putin de n litere, iar a doua linie sa contina multimea cuvintelor care au mai mult de n litere. Cuvintele de pe fiecare linie sunt afisate intr-o ordine oarecare, iar daca una dintre cele doua multimi este vida, se afiseaza pe ecran doar mesajul nu exista.\n\n" +
      "Exemplu: pentru n=3 si textul era o apa rece si cu gust bun se poate afisa pe ecran textul:\no si cu\nrece gust",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citeste textul.",
    output_format: "Doua linii: cuvintele cu mai putin de n litere, apoi cele cu mai mult de n litere (cuvintele cu exact n litere se ignora); sau 'nu exista' daca oricare dintre cele doua multimi este vida.",
    constraints: "1 <= n <= 100, textul are cel mult 100 de caractere",
    hints: "Impartiti cuvintele in doua grupuri dupa cum lungimea lor este strict mai mica sau strict mai mare decat n (cele egale cu n se ignora complet).",
    explanation: "Se parcurg cuvintele textului, plasandu-le in doua liste: cele cu lungime < n si cele cu lungime > n (cuvintele cu lungime exact n nu apar in niciuna dintre liste). Daca oricare dintre cele doua liste este vida, se afiseaza doar mesajul cerut; altfel, se afiseaza prima lista pe o linie si a doua lista pe linia urmatoare.\n\n**Complexitate:** O(lungimea textului)",
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
    vector<string> lt, gt;
    while (ss >> w) {
        if ((int)w.size() < n) lt.push_back(w);
        else if ((int)w.size() > n) gt.push_back(w);
    }
    if (lt.empty() || gt.empty()) { cout << "nu exista\\n"; return 0; }
    for (size_t i = 0; i < lt.size(); i++) cout << lt[i] << (i + 1 < lt.size() ? " " : "\\n");
    for (size_t i = 0; i < gt.size(); i++) cout << gt[i] << (i + 1 < gt.size() ? " " : "\\n");
    return 0;
}
`,
    py: `n = int(input())
words = input().split()
lt = [w for w in words if len(w) < n]
gt = [w for w in words if len(w) > n]
if not lt or not gt:
    print("nu exista")
else:
    print(" ".join(lt))
    print(" ".join(gt))
`,
    tests: [
      "3\nera o apa rece si cu gust bun",
      "1\nab cd",
      "10\nab cd ef",
      "4\na b c",
      "2\nla mi mia miau",
    ],
  },
  {
    slug: "bac-model-2024-3-3",
    subcategoryId: "model-2024",
    title: "Bacalaureat Model 2024, S3.3 - Preturile premiilor",
    difficulty: "hard",
    tags: ["bacalaureat", "2024", "model", "subiectul3", "eficienta", "fisiere"],
    statement:
      "La un concurs se acorda premiile I, al II-lea si al III-lea. Fiecare premiant este recompensat cu cate o carte, care are un pret egal pentru toti cei cu acelasi premiu. Preturile carților alese pentru premiile I, al II-lea si al III-lea sunt stabilite astfel incat sa fie in ordine strict descrescatoare, iar pentru fiecare premiu sa se ia in considerare cel mai mare pret pentru care exista suficiente carti propuse, in conditiile precizate.\n\n" +
      "Fisierul bac.txt contine pe prima linie trei numere naturale din intervalul [1,20], n1, n2 si n3, reprezentand numarul concurentilor care primesc premiile I, al II-lea, respectiv al III-lea, iar pe a doua linie un sir de cel mult 10^6 numere naturale din intervalul [10,10^3], separate prin cate un spatiu, fiecare numar reprezentand pretul unei carti propuse pentru premiere.\n\n" +
      "Se cere sa se afiseze pe ecran, separate prin cate un spatiu, in ordine strict descrescatoare, preturile cartilor alese, corespunzatoare celor trei premii, iar daca nu exista trei astfel de preturi, se afiseaza mesajul nu exista.\n\n" +
      "Exemplu: daca fisierul contine 3 2 4 si sirul 500 100 25 100 200 100 20 10 200 100 75 52 52 15 52 20 20 10 30 20 15 100 se afiseaza 100 52 20.",
    input_format: "Fisierul bac.txt: n1 n2 n3 pe prima linie, sirul de preturi pe a doua.",
    output_format: "Cele trei preturi alese, in ordine strict descrescatoare, sau mesajul 'nu exista'.",
    constraints: "1 <= n1, n2, n3 <= 20, preturi in [10, 1000]",
    hints: "Numarati aparitiile fiecarui pret posibil (interval mic, [10,1000]). Alegeti cel mai mare pret cu cel putin n1 aparitii pentru premiul I; apoi, printre preturile mai mici, cel mai mare cu cel putin n2 aparitii pentru premiul al II-lea; apoi similar pentru premiul al III-lea.",
    explanation:
      "Deoarece preturile sunt marginite la intervalul [10,1000], se numara aparitiile fiecarui pret posibil printr-o singura trecere prin fisier (vector de dimensiune 1000). Apoi se cauta, parcurgand preturile posibile descrescator: cel mai mare pret p1 cu cel putin n1 aparitii (premiul I); continuand descrescator de la p1-1, cel mai mare pret p2 cu cel putin n2 aparitii (premiul al II-lea); continuand de la p2-1, cel mai mare pret p3 cu cel putin n3 aparitii (premiul al III-lea). Daca oricare dintre cele trei cautari esueaza, se afiseaza mesajul cerut.\n\n**Complexitate:** O(n + 1000)",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    int n1, n2, n3; cin >> n1 >> n2 >> n3;
    vector<long long> cnt(1001, 0);
    int v;
    while (cin >> v) cnt[v]++;
    auto findBelow = [&](int limit, int need) -> int {
        for (int p = limit; p >= 10; p--) if (cnt[p] >= need) return p;
        return -1;
    };
    int p1 = findBelow(1000, n1);
    if (p1 == -1) { cout << "nu exista\\n"; return 0; }
    int p2 = findBelow(p1 - 1, n2);
    if (p2 == -1) { cout << "nu exista\\n"; return 0; }
    int p3 = findBelow(p2 - 1, n3);
    if (p3 == -1) { cout << "nu exista\\n"; return 0; }
    cout << p1 << " " << p2 << " " << p3 << "\\n";
    return 0;
}
`,
    py: `with open("bac.txt") as f:
    n1, n2, n3 = map(int, f.readline().split())
    data = f.readline().split()
cnt = [0] * 1001
for tok in data:
    cnt[int(tok)] += 1

def find_below(limit, need):
    for p in range(limit, 9, -1):
        if cnt[p] >= need:
            return p
    return -1

p1 = find_below(1000, n1)
if p1 == -1:
    print("nu exista")
else:
    p2 = find_below(p1 - 1, n2)
    if p2 == -1:
        print("nu exista")
    else:
        p3 = find_below(p2 - 1, n3)
        if p3 == -1:
            print("nu exista")
        else:
            print(p1, p2, p3)
`,
    tests: [
      "3 2 4\n500 100 25 100 200 100 20 10 200 100 75 52 52 15 52 20 20 10 30 20 15 100",
      "1 1 1\n10 20 30",
      "5 5 5\n10 20 30",
      "2 2 2\n10 10 10 10",
      (() => {
        const lines = [];
        const vals = [];
        for (let i = 0; i < 40000; i++) vals.push(String(10 + (i % 990)));
        lines.push("5 5 5");
        lines.push(vals.join(" "));
        return lines.join("\n");
      })(),
    ],
  },
  // ===================== SIMULARE 2024 =====================
  {
    slug: "bac-simulare-2024-3-1",
    subcategoryId: "simulare-2024",
    title: "Bacalaureat Simulare 2024, S3.1 - Duplicarea cifrelor impare (Impare)",
    difficulty: "medium",
    tags: ["bacalaureat", "2024", "simulare", "subiectul3", "cifre"],
    statement:
      "Subprogramul Impare are un parametru, n, prin care primeste un numar natural (n in [1,10^4]). Subprogramul returneaza numarul obtinut prin duplicarea fiecarei cifre impare a lui n sau -1 daca acesta nu are nicio cifra impara.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=3361, subprogramul returneaza 3333611.",
    input_format: "Se citeste de la tastatura numarul natural n.",
    output_format: "Se afiseaza numarul obtinut, sau -1 daca nu exista nicio cifra impara.",
    constraints: "1 <= n <= 10^4",
    hints: "Parcurgeti cifrele lui n de la stanga la dreapta; scrieti fiecare cifra impara de doua ori, iar cifrele pare o singura data.",
    explanation: "Se parcurg cifrele lui n in ordinea aparitiei, construind rezultatul: fiecare cifra impara se scrie de doua ori consecutiv, fiecare cifra para o singura data. Daca nicio cifra nu este impara, rezultatul este -1.\n\n**Complexitate:** O(numar de cifre)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int n; cin >> n;
    cout << Impare(n) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(Impare(n))
`,
    cpp: `long long Impare(int n) {
    string s = to_string(n);
    string res = "";
    bool hasOdd = false;
    for (char c : s) {
        int dig = c - '0';
        if (dig % 2 == 1) { res += c; res += c; hasOdd = true; }
        else res += c;
    }
    return hasOdd ? stoll(res) : -1;
}
`,
    py: `def Impare(n):
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
    tests: ["3361", "2468", "1", "9999", "10000"],
  },
  {
    slug: "bac-simulare-2024-3-2",
    subcategoryId: "simulare-2024",
    title: "Bacalaureat Simulare 2024, S3.2 - Generarea unei fraze din sablon",
    difficulty: "medium",
    tags: ["bacalaureat", "2024", "simulare", "subiectul3", "siruri-caractere"],
    statement:
      "Un sablon este un text in care cuvintele sunt separate prin cate un spatiu si sunt formate fie numai din litere mici si mari ale alfabetului englez, fie numai din caractere *, in ultimul caz numindu-se cuvinte generice. Lungimea unui cuvant este egala cu numarul de caractere care il compun.\n\n" +
      "Un computer genereaza o fraza pe baza unui astfel de sablon, prin inlocuirea fiecarui cuvant generic cu unul dintre cuvintele de aceeasi lungime, preluat dintr-o lista data.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura un numar natural, n (n in [1,100]), si o lista de n cuvinte (fiecare pe cate o linie), urmata de un sablon de tipul precizat. Programul obtine in memorie si apoi afiseaza pe ecran una dintre frazele care pot fi generate pe baza sablonului si a listei citite (inlocuind fiecare cuvant generic cu primul cuvant din lista avand lungimea potrivita) sau mesajul imposibil daca nu se poate genera o astfel de fraza.\n\n" +
      "Exemplu: daca n=6, lista de cuvinte este rece, placuta, acasa, calduta, innorata, soare, iar sablonul este *** o vreme ******* si ************ se afiseaza pe ecran mesajul imposibil (nu exista niciun cuvant din lista cu 3 litere).",
    input_format: "Pe prima linie n. Urmeaza n linii cu cate un cuvant. Pe ultima linie se citeste sablonul.",
    output_format: "Fraza generata (inlocuind fiecare cuvant generic cu primul cuvant potrivit din lista, in ordinea din lista), sau mesajul 'imposibil' daca vreun cuvant generic nu are corespondent de aceeasi lungime in lista.",
    constraints: "1 <= n <= 100, fiecare cuvant din lista are cel mult 10 litere, sablonul are cel mult 100 de caractere",
    hints: "Pentru fiecare cuvant generic (format doar din *) din sablon, cautati in lista, in ordine, primul cuvant a carui lungime este egala cu numarul de caractere * din acel cuvant generic.",
    explanation: "Se citeste lista de cuvinte, apoi sablonul se imparte in cuvinte (tokeni). Pentru fiecare token format numai din caracterul *, se cauta in lista (in ordinea citirii) primul cuvant a carui lungime este egala cu lungimea tokenului; daca este gasit, tokenul este inlocuit cu acel cuvant; altfel, intreaga operatie esueaza si se afiseaza mesajul 'imposibil'. Celelalte tokenuri (cuvinte obisnuite) raman neschimbate.\n\n**Complexitate:** O(n * lungimea sablonului)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    cin.ignore();
    vector<string> lista(n);
    for (auto& w : lista) getline(cin, w);
    string sablon;
    getline(cin, sablon);
    stringstream ss(sablon);
    string tok;
    vector<string> rez;
    bool ok = true;
    while (ss >> tok) {
        bool generic = true;
        for (char c : tok) if (c != '*') generic = false;
        if (generic) {
            int len = (int)tok.size();
            string found = "";
            bool has = false;
            for (auto& w : lista) if ((int)w.size() == len) { found = w; has = true; break; }
            if (!has) { ok = false; break; }
            rez.push_back(found);
        } else rez.push_back(tok);
    }
    if (!ok) { cout << "imposibil\\n"; return 0; }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `n = int(input())
lista = [input().strip() for _ in range(n)]
sablon = input()
tokens = sablon.split()
rez = []
ok = True
for tok in tokens:
    if all(c == '*' for c in tok):
        length = len(tok)
        found = None
        for w in lista:
            if len(w) == length:
                found = w
                break
        if found is None:
            ok = False
            break
        rez.append(found)
    else:
        rez.append(tok)
print("imposibil" if not ok else " ".join(rez))
`,
    tests: [
      "6\nrece\nplacuta\nacasa\ncalduta\ninnorata\nsoare\nEra o vreme ******* si ***** din belsug *****",
      "6\nrece\nplacuta\nacasa\ncalduta\ninnorata\nsoare\n*** o vreme ******* si ************",
      "2\nab\ncd\n** x **",
      "1\nabc\n*** *** ***",
      "3\nx\nyy\nzzz\n* ** ***",
    ],
  },
  {
    slug: "bac-simulare-2024-3-3",
    subcategoryId: "simulare-2024",
    title: "Bacalaureat Simulare 2024, S3.3 - Verificarea unui sir de tip api",
    difficulty: "hard",
    tags: ["bacalaureat", "2024", "simulare", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Un sir se numeste de tip api daca numarul de aparitii ale fiecarui termen este mai mic sau egal cu acel termen si are o paritate egala cu a acestuia.\n\n" +
      "Fisierul bac.in contine un sir de cel mult 10^6 numere naturale din intervalul [1,10^3], separate prin cate un spatiu. Se cere sa se afiseze pe ecran mesajul DA, daca sirul este de tip api, sau mesajul NU in caz contrar. Proiectati un algoritm eficient din punctul de vedere al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine numerele 6 27 2 6 27 6 6 14 14 2 27 se afiseaza pe ecran DA.",
    input_format: "Fisierul bac.in: un sir de numere naturale din [1,1000], separate prin spatiu.",
    output_format: "Se afiseaza 'DA' daca sirul este de tip api, altfel 'NU'.",
    constraints: "cel mult 10^6 termeni, valori in [1,1000]",
    hints: "Numarati aparitiile fiecarei valori posibile (interval mic, [1,1000]), apoi verificati pentru fiecare valoare intalnita daca numarul de aparitii este cel mult egal cu valoarea si are aceeasi paritate.",
    explanation: "Deoarece valorile posibile sunt marginite la [1,1000], se numara aparitiile fiecarei valori printr-o singura trecere prin fisier. Apoi se parcurg valorile 1..1000 care au aparut macar o data, verificand pentru fiecare ca numarul de aparitii sa fie cel mult egal cu valoarea insasi si sa aiba aceeasi paritate; daca oricare valoare incalca aceasta conditie, raspunsul este NU.\n\n**Complexitate:** O(n + 1000)",
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
    bool ok = true;
    for (int val = 1; val <= 1000; val++) {
        if (cnt[val] == 0) continue;
        if (cnt[val] > val || (cnt[val] % 2) != (val % 2)) ok = false;
    }
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `cnt = [0] * 1001
with open("bac.in") as f:
    data = f.read().split()
for tok in data:
    cnt[int(tok)] += 1
ok = True
for val in range(1, 1001):
    if cnt[val] == 0:
        continue
    if cnt[val] > val or (cnt[val] % 2) != (val % 2):
        ok = False
print("DA" if ok else "NU")
`,
    tests: [
      "6 27 2 6 27 6 6 14 14 2 27",
      "1",
      "3 3 3 3",
      "2 2 2",
      (() => {
        const parts = [];
        for (let v = 2; v <= 1000; v += 2) { parts.push(String(v)); parts.push(String(v)); }
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== SESIUNE SPECIALA 2024 =====================
  {
    slug: "bac-speciala-2024-3-1",
    subcategoryId: "speciala-2024",
    title: "Bacalaureat Sesiune Speciala 2024, S3.1 - Verificare aglomerare de fulgi",
    difficulty: "medium",
    tags: ["bacalaureat", "2024", "speciala", "subiectul3", "cifre"],
    statement:
      "La un laborator sunt studiate aglomerari de fulgi de nea formate din cate noua cristale de patru tipuri diferite date (notate cu 1, 2, 3 sau 4), astfel incat din fiecare tip sa existe cel putin cate un cristal. O astfel de aglomerare de fulgi a fost reprezentata printr-un numar natural, in care fiecare cifra reprezinta tipul unui cristal.\n\n" +
      "Subprogramul fulg are un parametru, n, prin care primeste un numar natural (n in [0,10^9)). Subprogramul returneaza valoarea 1, daca prin n este reprezentata o aglomerare de fulgi de nea dintre cele studiate, sau 0 in caz contrar.\n\n" +
      "Scrieti in C/C++ definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=112243413 subprogramul returneaza 1, iar daca n=12314 sau n=112253513 sau n=112243457 sau n=111122223, subprogramul returneaza 0.",
    input_format: "Se citeste de la tastatura numarul natural n.",
    output_format: "Se afiseaza 1 daca n reprezinta o aglomerare valida de fulgi, altfel 0.",
    constraints: "0 <= n < 10^9",
    hints: "Numarul trebuie sa aiba exact 9 cifre, fiecare din multimea {1,2,3,4}, si toate cele 4 valori trebuie sa apara macar o data.",
    explanation: "Se verifica intai ca n are exact 9 cifre; apoi se parcurg cifrele, verificand ca fiecare este in multimea {1,2,3,4} si retinand care dintre cele 4 tipuri au aparut macar o data; raspunsul este 1 doar daca toate conditiile sunt indeplinite si toate cele 4 tipuri apar.\n\n**Complexitate:** O(numar de cifre)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    cout << fulg(n) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(fulg(n))
`,
    cpp: `int fulg(long long n) {
    string s = to_string(n);
    if (s.size() != 9) return 0;
    vector<bool> seen(5, false);
    for (char c : s) {
        if (c < '1' || c > '4') return 0;
        seen[c - '0'] = true;
    }
    for (int t = 1; t <= 4; t++) if (!seen[t]) return 0;
    return 1;
}
`,
    py: `def fulg(n):
    s = str(n)
    if len(s) != 9:
        return 0
    seen = [False] * 5
    for c in s:
        if c < '1' or c > '4':
            return 0
        seen[int(c)] = True
    for t in range(1, 5):
        if not seen[t]:
            return 0
    return 1
`,
    tests: ["112243413", "12314", "112253513", "112243457", "111122223"],
  },
  {
    slug: "bac-speciala-2024-3-2",
    subcategoryId: "speciala-2024",
    title: "Bacalaureat Sesiune Speciala 2024, S3.2 - Cea mai mica valoare generata",
    difficulty: "medium",
    tags: ["bacalaureat", "2024", "speciala", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Fiind date doua numere naturale a si b, numim valoare generata de a si b un numar obtinut din a prin alipirea la stanga sau la dreapta sa a cifrelor lui b, in ordinea in care apar in acesta.\n\n" +
      "Exemplu: daca a=123 si b=45, se pot obtine doua numere generate de acestea: 12345 si 45123.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura doua numere naturale din intervalul [2,50], m si n, si construieste in memorie un tablou bidimensional cu m linii, numerotate de la 1 la m, si n coloane, numerotate de la 1 la n, in care fiecare element este egal cu cea mai mica valoare generata de numerele de ordine ale liniei, respectiv coloanei pe care se afla.\n\n" +
      "Programul afiseaza pe ecran tabloul obtinut, fiecare linie a tabloului pe cate o linie a ecranului, elementele fiecarei linii fiind separate prin cate un spatiu.\n\n" +
      "Exemplu: pentru m=5 si n=4 se obtine tabloul\n11 12 13 14\n12 22 23 24\n13 23 33 34\n14 24 34 44\n15 25 35 45",
    input_format: "Se citesc m si n.",
    output_format: "Se afiseaza tabloul cu m linii si n coloane.",
    constraints: "2 <= m, n <= 50",
    hints: "Pentru celula (i,j), calculati concatenarea 'i urmat de j' si 'j urmat de i' ca numere, si pastrati minimul.",
    explanation: "Pentru fiecare celula (i,j), se calculeaza cele doua valori generate posibile: concatenarea cifrelor lui i urmate de cifrele lui j, si concatenarea cifrelor lui j urmate de cifrele lui i (interpretate ca numere), retinandu-se minimul acestora.\n\n**Complexitate:** O(m*n)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int m, n; cin >> m >> n;
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            long long v1 = stoll(to_string(i) + to_string(j));
            long long v2 = stoll(to_string(j) + to_string(i));
            cout << min(v1, v2) << (j < n ? " " : "\\n");
        }
    }
    return 0;
}
`,
    py: `m, n = map(int, input().split())
for i in range(1, m + 1):
    row = []
    for j in range(1, n + 1):
        v1 = int(str(i) + str(j))
        v2 = int(str(j) + str(i))
        row.append(str(min(v1, v2)))
    print(" ".join(row))
`,
    tests: ["5 4", "2 2", "10 3", "3 10", "50 2"],
  },
  {
    slug: "bac-speciala-2024-3-3",
    subcategoryId: "speciala-2024",
    title: "Bacalaureat Sesiune Speciala 2024, S3.3 - Primul si ultimul numar cu cifra maxima",
    difficulty: "hard",
    tags: ["bacalaureat", "2024", "speciala", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul numere.in contine un sir de cel mult 10^6 numere naturale din intervalul [0,99]. Numerele din fisier sunt separate prin cate un spatiu.\n\n" +
      "Se cere sa se determine primul si ultimul numar din sir care contin cea mai mare cifra ce apare in scrierea numerelor din fisier. Numerele determinate se afiseaza pe ecran, in ordinea aparitiei lor in sir, separate printr-un spatiu. Daca nu exista doua astfel de numere pe pozitii distincte, se afiseaza pe ecran mesajul nu exista. Proiectati un algoritm eficient din punctul de vedere al timpului de executare si al spatiului de memorie utilizat.\n\n" +
      "Exemplu: daca fisierul contine numerele 34 5 38 30 87 70 11 8 82 25 se afiseaza pe ecran 38 82; daca fisierul contine numerele 34 5 38 30 87 70 11 8 38 25 se afiseaza pe ecran 38 38; iar daca fisierul contine numerele 34 5 38 30 se afiseaza pe ecran nu exista.",
    input_format: "Fisierul numere.in: un sir de numere naturale din [0,99], separate prin spatiu.",
    output_format: "Primul si ultimul numar (pe pozitii distincte) care contin cea mai mare cifra din intregul fisier, sau mesajul 'nu exista'.",
    constraints: "cel mult 10^6 termeni",
    hints: "Parcurgeti fisierul o data pentru a afla cifra maxima ce apare oriunde; parcurgeti-l din nou pentru a gasi prima si ultima pozitie a unui numar care contine acea cifra.",
    explanation: "Se parcurge fisierul o prima data pentru a determina cifra maxima ce apare in scrierea oricarui numar din sir (fara a stoca sirul). Se parcurge apoi fisierul a doua oara, retinand pozitia primului si a ultimului numar care contine aceasta cifra maxima. Daca ambele pozitii exista si sunt distincte, se afiseaza numerele corespunzatoare; altfel, mesajul cerut.\n\n**Complexitate:** O(n) timp (doua treceri), O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "numere.in", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int maxDigitOf(int v) {
    int best = 0;
    if (v == 0) return 0;
    while (v > 0) { best = max(best, v % 10); v /= 10; }
    return best;
}
int main() {
    freopen("numere.in", "r", stdin);
    int v;
    int maxDigit = -1;
    while (cin >> v) maxDigit = max(maxDigit, maxDigitOf(v));
    freopen("numere.in", "r", stdin);
    cin.clear();
    long long pos = 0, firstPos = -1, lastPos = -1, firstVal = -1, lastVal = -1;
    while (cin >> v) {
        pos++;
        if (maxDigitOf(v) == maxDigit) {
            if (firstPos == -1) { firstPos = pos; firstVal = v; }
            lastPos = pos; lastVal = v;
        }
    }
    if (firstPos == -1 || firstPos == lastPos) cout << "nu exista\\n";
    else cout << firstVal << " " << lastVal << "\\n";
    return 0;
}
`,
    py: `def max_digit_of(v):
    if v == 0:
        return 0
    best = 0
    while v > 0:
        best = max(best, v % 10)
        v //= 10
    return best

with open("numere.in") as f:
    data = f.read().split()
max_digit = -1
for tok in data:
    max_digit = max(max_digit, max_digit_of(int(tok)))
first_pos, last_pos, first_val, last_val = -1, -1, -1, -1
pos = 0
for tok in data:
    v = int(tok)
    pos += 1
    if max_digit_of(v) == max_digit:
        if first_pos == -1:
            first_pos, first_val = pos, v
        last_pos, last_val = pos, v
if first_pos == -1 or first_pos == last_pos:
    print("nu exista")
else:
    print(first_val, last_val)
`,
    tests: [
      "34 5 38 30 87 70 11 8 82 25",
      "34 5 38 30 87 70 11 8 38 25",
      "34 5 38 30",
      "99",
      (() => {
        const parts = [];
        for (let i = 0; i < 30000; i++) parts.push(String(i % 100));
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== SESIUNEA TOAMNA 2024 =====================
  {
    slug: "bac-toamna-2024-3-1",
    subcategoryId: "toamna-2024",
    title: "Bacalaureat Toamna 2024, S3.1 - Numar moderat",
    difficulty: "medium",
    tags: ["bacalaureat", "2024", "toamna", "subiectul3", "numere-prime"],
    statement:
      "Un numar natural nenul, n, se numeste moderat daca este egal cu produsul a doua numere prime, iar acestea sunt consecutive in sirul numerelor prime (2, 3, 5, 7, 11, 13, 17...).\n\n" +
      "Subprogramul moderat are un singur parametru, n, prin care primeste un numar natural (n in [1,10^5]). Subprogramul returneaza valoarea 1, daca n este un numar moderat, sau valoarea 0, in caz contrar.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=35, subprogramul returneaza 1 (35=5*7), iar daca n=18 sau n=55 sau n=4, subprogramul returneaza 0.",
    input_format: "Se citeste de la tastatura numarul natural n.",
    output_format: "Se afiseaza 1 daca n este numar moderat, altfel 0.",
    constraints: "1 <= n <= 10^5",
    hints: "Determinati cel mai mic divizor prim p al lui n; verificati ca n/p este de asemenea prim si ca este exact urmatorul numar prim dupa p.",
    explanation: "Se determina cel mai mic divizor al lui n, p (prin cautare de la 2 in sus); daca p==n, n este prim si nu poate fi moderat. Altfel, se calculeaza q=n/p si se verifica daca q este prim; daca da, se cauta urmatorul numar prim strict dupa p si se verifica daca acesta este exact q -- caz in care n este moderat.\n\n**Complexitate:** O(sqrt(n)) pentru determinarea factorilor, plus cautarea urmatorului prim",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int n; cin >> n;
    cout << moderat(n) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(moderat(n))
`,
    cpp: `bool ePrimM(long long v) {
    if (v < 2) return false;
    for (long long d = 2; d * d <= v; d++) if (v % d == 0) return false;
    return true;
}
int moderat(int n) {
    int p = -1;
    for (int d = 2; (long long)d * d <= n; d++) { if (n % d == 0) { p = d; break; } }
    if (p == -1) return 0;
    int q = n / p;
    if (!ePrimM(q)) return 0;
    int cand = p + 1;
    while (!ePrimM(cand)) cand++;
    return (cand == q) ? 1 : 0;
}
`,
    py: `def e_prim_m(v):
    if v < 2:
        return False
    d = 2
    while d * d <= v:
        if v % d == 0:
            return False
        d += 1
    return True

def moderat(n):
    p = -1
    d = 2
    while d * d <= n:
        if n % d == 0:
            p = d
            break
        d += 1
    if p == -1:
        return 0
    q = n // p
    if not e_prim_m(q):
        return 0
    cand = p + 1
    while not e_prim_m(cand):
        cand += 1
    return 1 if cand == q else 0
`,
    tests: ["35", "18", "55", "4", "9409"],
  },
  {
    slug: "bac-toamna-2024-3-2",
    subcategoryId: "toamna-2024",
    title: "Bacalaureat Toamna 2024, S3.2 - Tunderea gazonului",
    difficulty: "medium",
    tags: ["bacalaureat", "2024", "toamna", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "O gradina este impartita in parcele patrate identice, dispuse pe randuri succesive. Toate parcelele de pe un rand contin acelasi tip de plante (doar flori sau doar gazon) si oricare doua randuri alaturate contin tipuri diferite de plante, pe primul rand fiind gazon. Fiecare parcela cu flori trebuie sa fie mai inalta cu cel putin un decimetru decat oricare dintre parcelele cu gazon de pe randul vecin anterior. S-a hotarat tunderea parcelelor cu gazon prea inalte, astfel incat ele sa fie aduse la inaltimea maxima permisa.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura doua numere naturale din intervalul [2,10^2], m si n, apoi elementele unui tablou bidimensional cu m linii si n coloane, numere naturale din intervalul [2,10], reprezentand inaltimile parcelelor (randul 1 fiind gazon, apoi alternand flori/gazon). Programul modifica apoi tabloul in memorie corespunzator tunderii gazonului si afiseaza pe ecran tabloul obtinut, fiecare linie pe cate o linie a ecranului.\n\n" +
      "Exemplu: pentru m=4, n=6 si tabloul\n6 2 3 7 9 4\n7 8 5 9 8 5\n8 7 2 6 2 9\n7 2 5 9 3 8\n" +
      "se obtine tabloul\n4 2 3 4 4 4\n7 8 5 9 8 5\n1 1 1 1 1 1\n7 2 5 9 3 8",
    input_format: "Se citesc m, n, apoi elementele tabloului cu m linii si n coloane.",
    output_format: "Se afiseaza tabloul dupa tunderea gazonului.",
    constraints: "2 <= m, n <= 100, 2 <= inaltime <= 10",
    hints: "Randurile pare (2,4,6,...) contin flori. Pentru fiecare astfel de rand, calculati inaltimea minima a florilor si limitati (tundeti) fiecare parcela din randul de gazon precedent la cel mult (aceasta minima - 1).",
    explanation: "Randurile impare (1,3,5,...) contin gazon, cele pare (2,4,6,...) contin flori (alternanta incepand cu gazon pe randul 1). Pentru fiecare rand cu flori i, se calculeaza inaltimea minima a florilor de pe acel rand; inaltimea maxima permisa pentru gazonul de pe randul anterior (i-1) este aceasta minima minus 1. Orice parcela de gazon de pe randul i-1 care depaseste aceasta valoare se tunde (se reduce) la valoarea maxima permisa; celelalte raman neschimbate. Randurile cu flori nu se modifica.\n\n**Complexitate:** O(m*n)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int m, n; cin >> m >> n;
    vector<vector<int>> a(m + 1, vector<int>(n + 1));
    for (int i = 1; i <= m; i++) for (int j = 1; j <= n; j++) cin >> a[i][j];
    for (int i = 2; i <= m; i += 2) {
        int mn = INT32_MAX;
        for (int j = 1; j <= n; j++) mn = min(mn, a[i][j]);
        int maxAllowed = mn - 1;
        for (int j = 1; j <= n; j++) if (a[i - 1][j] > maxAllowed) a[i - 1][j] = maxAllowed;
    }
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
for i in range(2, m + 1, 2):
    mn = min(a[i][j] for j in range(1, n + 1))
    max_allowed = mn - 1
    for j in range(1, n + 1):
        if a[i - 1][j] > max_allowed:
            a[i - 1][j] = max_allowed
for i in range(1, m + 1):
    print(" ".join(str(a[i][j]) for j in range(1, n + 1)))
`,
    tests: [
      "4 6\n6 2 3 7 9 4\n7 8 5 9 8 5\n8 7 2 6 2 9\n7 2 5 9 3 8",
      "2 2\n5 5\n10 10",
      "2 3\n2 2 2\n3 3 3",
      "3 2\n2 2\n10 10\n2 2",
      "2 2\n9 9\n2 2",
    ],
  },
  {
    slug: "bac-toamna-2024-3-3",
    subcategoryId: "toamna-2024",
    title: "Bacalaureat Toamna 2024, S3.3 - Termenii sirului pana la z, descrescator",
    difficulty: "hard",
    tags: ["bacalaureat", "2024", "toamna", "subiectul3", "eficienta", "fisiere", "siruri"],
    statement:
      "Sirul 0, 0, 1, 4, 13, 38, 105, 280, 729, ... este definit astfel: f1=f2=0, f3=1, fn=4*fn-1-3*fn-2-2*fn-3 (unde n este un numar natural, n>=4).\n\n" +
      "Se citesc de la tastatura trei numere naturale x, y si z (x<=y<z<=10^9), valorile a trei termeni aflati pe pozitii consecutive in sirul dat, si se cere sa se scrie in fisierul bac.txt, in ordine descrescatoare, separati prin cate un spatiu, toti termenii sirului care sunt mai mici sau egali cu z. Proiectati un algoritm eficient din punctul de vedere al timpului de executare si al spatiului de memorie utilizat.\n\n" +
      "Exemplu: daca se citesc numerele 38 105 280 fisierul contine numerele 280 105 38 13 4 1 0 0",
    input_format: "Se citesc de la tastatura x, y si z.",
    output_format: "Se scrie in fisierul bac.txt toti termenii sirului <= z, in ordine descrescatoare, separati prin spatiu.",
    constraints: "0 <= x <= y < z <= 10^9",
    hints: "Sirul creste foarte rapid (aproximativ de 2.7 ori la fiecare pas), deci exista cel mult cateva zeci de termeni <= z, indiferent cat de mare este z. Generati termenii direct din recurenta, incepand cu f1=0,f2=0,f3=1, oprindu-va cand un termen depaseste z.",
    explanation:
      "Deoarece termenii sirului cresc aproape exponential (raportul dintre termeni succesivi tinde spre aproximativ 2.7), numarul de termeni cu valoarea cel mult z este mic (cel mult cateva zeci), indiferent de cat de mare este z (pana la 10^9). Se genereaza sirul direct din recurenta data, pornind de la f1=0, f2=0, f3=1, retinand fiecare termen cat timp este <= z si oprindu-se la primul termen care il depaseste. Lista rezultata (deja in ordinea generarii, deci crescatoare) se scrie inversata (descrescator) in fisier. x si y sunt folositi doar ca context (confirma pozitia in sir), algoritmul recalculeaza sirul direct din definitie.\n\n**Complexitate:** O(log z) timp si spatiu",
    io: { input_source: "stdin", input_filename: null, output_target: "file", output_filename: "bac.txt" },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long x, y, z; cin >> x >> y >> z;
    (void)x; (void)y;
    vector<long long> f;
    f.push_back(0); f.push_back(0); f.push_back(1);
    while (true) {
        int k = (int)f.size();
        long long next = 4 * f[k - 1] - 3 * f[k - 2] - 2 * f[k - 3];
        if (next > z) break;
        f.push_back(next);
    }
    vector<long long> rez;
    for (long long v : f) if (v <= z) rez.push_back(v);
    freopen("bac.txt", "w", stdout);
    for (int i = (int)rez.size() - 1; i >= 0; i--) cout << rez[i] << (i > 0 ? " " : "\\n");
    return 0;
}
`,
    py: `x, y, z = map(int, input().split())
f = [0, 0, 1]
while True:
    nxt = 4 * f[-1] - 3 * f[-2] - 2 * f[-3]
    if nxt > z:
        break
    f.append(nxt)
rez = [v for v in f if v <= z]
rez.reverse()
with open("bac.txt", "w") as out:
    out.write(" ".join(map(str, rez)))
    out.write("\\n")
`,
    tests: ["38 105 280", "0 0 1", "0 0 0", "1 4 13", "0 0 1000000000"],
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
