const problems = [
  // ===================== VARIANTA 1 (Testul 1) =====================
  {
    slug: "bac-antrenament-2021-v1-3-1",
    subcategoryId: "antrenament-2021-v1",
    title: "Bacalaureat Antrenament 2021, Varianta 1, S3.1 - Primele n multipli descrescatori",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "divizori"],
    statement:
      "Subprogramul divX are doi parametri, n si x, prin care primeste cate un numar natural din intervalul [2,50]. Subprogramul afiseaza pe ecran, in ordine descrescatoare, separate prin cate un spatiu, primele n numere naturale nenule divizibile cu x.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=4 si x=15 in urma apelului se afiseaza numerele 60 45 30 15",
    input_format: "Se citesc de la tastatura n si x.",
    output_format: "Primele n multipli nenuli ai lui x, in ordine descrescatoare.",
    constraints: "2 <= n, x <= 50",
    hints: "Multiplii cautati sunt n*x, (n-1)*x, ..., x.",
    explanation: "Se afiseaza, in ordine descrescatoare, multiplii lui x de la n*x pana la x, pas -x.\n\n**Complexitate:** O(n)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int n, x; cin >> n >> x;
    divX(n, x);
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n, x = map(int, input().split())
divX(n, x)
`,
    cpp: `void divX(int n, int x) {
    for (int k = n; k >= 1; k--) cout << k * x << (k > 1 ? " " : "\\n");
}
`,
    py: `def divX(n, x):
    print(" ".join(str(k * x) for k in range(n, 0, -1)))
`,
    tests: ["4 15", "2 2", "50 50", "10 3", "2 50"],
  },
  {
    slug: "bac-antrenament-2021-v1-3-2",
    subcategoryId: "antrenament-2021-v1",
    title: "Bacalaureat Antrenament 2021, Varianta 1, S3.2 - Primul patrat concentric, sens invers acelor de ceasornic",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Scrieti un program C/C++ care citeste de la tastatura numarul natural n (n in [2,100]) si elementele unui tablou bidimensional cu n linii si n coloane, numere naturale din intervalul [0,10^9]. Programul afiseaza pe ecran, separate prin cate un spatiu, elementele primului patrat concentric, parcurs in sens invers al acelor de ceasornic, incepand din coltul sau stanga-sus. Primul patrat concentric este format din prima si ultima linie, prima si ultima coloana a tabloului.\n\n" +
      "Exemplu: pentru n=5 si tabloul\n1 3 1 8 6\n2 9 2 7 4\n3 5 8 5 2\n4 1 6 3 0\n5 6 7 8 9\n" +
      "se afiseaza pe ecran numerele 1 2 3 4 5 6 7 8 9 0 2 4 6 8 1 3",
    input_format: "Se citesc n si elementele tabloului.",
    output_format: "Elementele bordurii tabloului, parcurse in sens invers acelor de ceasornic din coltul stanga-sus.",
    constraints: "2 <= n <= 100",
    hints: "Parcurgeti: coloana 1 de sus in jos, apoi linia n de la stanga la dreapta (fara primul element deja afisat), apoi coloana n de jos in sus (fara ultimul), apoi linia 1 de la dreapta la stanga (fara primul si ultimul).",
    explanation: "Se parcurge borda tabloului in patru segmente: coloana 1 (de sus in jos), linia n (de la stanga la dreapta, sarind primul element deja afisat), coloana n (de jos in sus, sarind ultimul element deja afisat), si linia 1 (de la dreapta la stanga, sarind primul si ultimul element deja afisate).\n\n**Complexitate:** O(n)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<vector<long long>> a(n + 1, vector<long long>(n + 1));
    for (int i = 1; i <= n; i++) for (int j = 1; j <= n; j++) cin >> a[i][j];
    vector<long long> rez;
    for (int i = 1; i <= n; i++) rez.push_back(a[i][1]);
    for (int j = 2; j <= n; j++) rez.push_back(a[n][j]);
    for (int i = n - 1; i >= 1; i--) rez.push_back(a[i][n]);
    for (int j = n - 1; j >= 2; j--) rez.push_back(a[1][j]);
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `n = int(input())
a = [[0] * (n + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    row = list(map(int, input().split()))
    for j in range(1, n + 1):
        a[i][j] = row[j - 1]
rez = []
for i in range(1, n + 1):
    rez.append(a[i][1])
for j in range(2, n + 1):
    rez.append(a[n][j])
for i in range(n - 1, 0, -1):
    rez.append(a[i][n])
for j in range(n - 1, 1, -1):
    rez.append(a[1][j])
print(" ".join(map(str, rez)))
`,
    tests: [
      "5\n1 3 1 8 6\n2 9 2 7 4\n3 5 8 5 2\n4 1 6 3 0\n5 6 7 8 9",
      "2\n1 2\n3 4",
      "3\n1 2 3\n4 5 6\n7 8 9",
      "4\n1 1 1 1\n1 2 2 1\n1 2 2 1\n1 1 1 1",
      "2\n0 0\n0 0",
    ],
  },
  {
    slug: "bac-antrenament-2021-v1-3-3",
    subcategoryId: "antrenament-2021-v1",
    title: "Bacalaureat Antrenament 2021, Varianta 1, S3.3 - Cele mai mari doua numere de doua cifre lipsa",
    difficulty: "hard",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.in contine cel mult 10^6 numere naturale din intervalul [0,10^9], separate prin cate un spatiu. Se cere sa se afiseze pe ecran, in ordine descrescatoare, cele mai mari doua numere de doua cifre distincte care NU se afla in fisier. Numerele afisate sunt separate printr-un spatiu, iar daca nu exista doua astfel de numere, se afiseaza pe ecran mesajul nu exista. Proiectati un algoritm eficient din punctul de vedere al timpului de executare.\n\n" +
      "Exemplu: daca fisierul bac.in contine numerele 40 41 42 43 44 45 46 47 48 50 51 52 se afiseaza pe ecran, in aceasta ordine, numerele 99 98",
    input_format: "Fisierul bac.in: un sir de numere naturale, separate prin spatiu.",
    output_format: "Cele mai mari doua numere de doua cifre care nu apar in fisier, in ordine descrescatoare, sau mesajul 'nu exista'.",
    constraints: "cel mult 10^6 termeni",
    hints: "Marcati intr-un tablou boolean de 90 de elemente (10-99) prezenta fiecarui numar de doua cifre din fisier; apoi cautati de la 99 in jos primele doua valori nemarcate.",
    explanation: "Se parcurge fisierul o singura data, marcand intr-un tablou boolean de dimensiune 90 (pentru valorile 10-99) fiecare numar de doua cifre intalnit. Apoi se parcurg valorile de la 99 in jos pana la 10, colectand primele doua valori nemarcate (care nu apar in fisier); acestea sunt deja in ordine descrescatoare.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.in", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.in", "r", stdin);
    bool present[100] = {false};
    long long v;
    while (cin >> v) if (v >= 10 && v <= 99) present[v] = true;
    vector<int> rez;
    for (int val = 99; val >= 10 && (int)rez.size() < 2; val--) if (!present[val]) rez.push_back(val);
    if (rez.size() < 2) { cout << "nu exista\\n"; return 0; }
    cout << rez[0] << " " << rez[1] << "\\n";
    return 0;
}
`,
    py: `present = [False] * 100
with open("bac.in") as f:
    data = f.read().split()
for tok in data:
    v = int(tok)
    if 10 <= v <= 99:
        present[v] = True
rez = []
for val in range(99, 9, -1):
    if len(rez) >= 2:
        break
    if not present[val]:
        rez.append(val)
if len(rez) < 2:
    print("nu exista")
else:
    print(rez[0], rez[1])
`,
    tests: [
      "40 41 42 43 44 45 46 47 48 50 51 52",
      "10 11 12",
      "97 98 99",
      "50",
      (() => {
        const parts = [];
        for (let v = 10; v <= 97; v++) parts.push(String(v));
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== VARIANTA 2 (Testul 2) =====================
  {
    slug: "bac-antrenament-2021-v2-3-1",
    subcategoryId: "antrenament-2021-v2",
    title: "Bacalaureat Antrenament 2021, Varianta 2, S3.1 - Factori primi la aceeasi putere",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "divizori"],
    statement:
      "Subprogramul factori are doi parametri, n si m, prin care primeste cate un numar natural din intervalul [1,10^9]. Subprogramul returneaza numarul valorilor prime care apar la ACEEASI PUTERE atat in descompunerea in factori primi a lui n, cat si in descompunerea in factori primi a lui m.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=16500 si m=10780, atunci subprogramul returneaza 2 (16500=2^2*3*5^3*11, 10780=2^2*5*7^2*11).",
    input_format: "Se citesc de la tastatura n si m.",
    output_format: "Numarul factorilor primi comuni lui n si m, cu exact acelasi exponent in ambele.",
    constraints: "1 <= n, m <= 10^9",
    hints: "Factorizati n si m intr-un map prim->exponent; numarati primele comune cu exponent egal.",
    explanation: "Se factorizeaza n si m, retinand pentru fiecare exponentul fiecarui factor prim. Se numara primele comune ambelor descompuneri care au acelasi exponent in ambele.\n\n**Complexitate:** O(sqrt(n)+sqrt(m))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n, m; cin >> n >> m;
    cout << factori(n, m) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n, m = map(int, input().split())
print(factori(n, m))
`,
    cpp: `map<long long,int> factorizeV2(long long v) {
    map<long long,int> mp;
    for (long long f = 2; f * f <= v; f++) {
        while (v % f == 0) { mp[f]++; v /= f; }
    }
    if (v > 1) mp[v]++;
    return mp;
}
int factori(long long n, long long m) {
    auto a = factorizeV2(n), b = factorizeV2(m);
    int cnt = 0;
    for (auto& pr : a) {
        auto it = b.find(pr.first);
        if (it != b.end() && it->second == pr.second) cnt++;
    }
    return cnt;
}
`,
    py: `def factorize_v2(v):
    mp = {}
    f = 2
    while f * f <= v:
        while v % f == 0:
            mp[f] = mp.get(f, 0) + 1
            v //= f
        f += 1
    if v > 1:
        mp[v] = mp.get(v, 0) + 1
    return mp

def factori(n, m):
    a, b = factorize_v2(n), factorize_v2(m)
    cnt = 0
    for p, e in a.items():
        if b.get(p) == e:
            cnt += 1
    return cnt
`,
    tests: ["16500 10780", "1 1", "999999937 999999937", "1000000000 1", "1024 1024"],
  },
  {
    slug: "bac-antrenament-2021-v2-3-2",
    subcategoryId: "antrenament-2021-v2",
    title: "Bacalaureat Antrenament 2021, Varianta 2, S3.2 - Tablou V de la diagonala secundara",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Scrieti un program C/C++ care citeste de la tastatura numarul natural n (n in [2,20]) si construieste in memorie un tablou bidimensional cu n linii si n coloane, astfel incat fiecare linie a sa are proprietatile:\n" +
      "- elementul situat pe diagonala secundara are valoarea n;\n" +
      "- incepand de la diagonala secundara, spre stanga, elementele formeaza un sir strict descrescator de numere consecutive, iar incepand de la diagonala secundara, spre dreapta, elementele formeaza tot un sir strict descrescator de numere consecutive.\n\n" +
      "Programul afiseaza pe ecran tabloul construit, fiecare linie pe cate o linie a ecranului, cu elementele aflate pe aceeasi linie separate prin cate un spatiu.\n\n" +
      "Exemplu: daca n=5 se afiseaza pe ecran tabloul:\n1 2 3 4 5\n2 3 4 5 4\n3 4 5 4 3\n4 5 4 3 2\n5 4 3 2 1",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza tabloul cu n linii si n coloane.",
    constraints: "2 <= n <= 20",
    hints: "Elementul de pe linia i, coloana j (1-indexat) este n - abs(j-(n+1-i)).",
    explanation: "Coloana diagonalei secundare pe linia i este n+1-i, iar acolo valoarea este n. Pe masura ce ne indepartam de aceasta coloana (in orice directie), valoarea scade cu 1 pentru fiecare pas: a[i][j] = n - abs(j-(n+1-i)).\n\n**Complexitate:** O(n^2)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) cout << (n - abs(j - (n + 1 - i))) << (j < n ? " " : "\\n");
    }
    return 0;
}
`,
    py: `n = int(input())
for i in range(1, n + 1):
    row = [str(n - abs(j - (n + 1 - i))) for j in range(1, n + 1)]
    print(" ".join(row))
`,
    tests: ["5", "2", "20", "3", "10"],
  },
  {
    slug: "bac-antrenament-2021-v2-3-3",
    subcategoryId: "antrenament-2021-v2",
    title: "Bacalaureat Antrenament 2021, Varianta 2, S3.3 - Secventa maxima ce incepe/incheie cu pozitiv",
    difficulty: "hard",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.in contine un sir de cel mult 10^6 numere intregi din intervalul [-10^9,10^9], separate prin cate un spatiu. Cel putin un numar din sir este pozitiv.\n\n" +
      "Se cere sa se afiseze pe ecran lungimea maxima a unei secvente a sirului care fie incepe, fie se incheie cu un numar pozitiv. O secventa este formata din termeni aflati pe pozitii consecutive in sir, iar lungimea secventei este egala cu numarul de termeni ai acesteia. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine numerele -15 -7 4 -7 21 -5 -200 -26 52 -24 -7 -9 -20 pe ecran se afiseaza 11 (corespunzator secventei 4 -7 21 -5 -200 -26 52 -24 -7 -9 -20).",
    input_format: "Fisierul bac.in: un sir de numere intregi, separate prin spatiu.",
    output_format: "Lungimea maxima a unei secvente ce incepe sau se incheie cu un numar pozitiv.",
    constraints: "cel mult 10^6 termeni, cel putin un numar pozitiv",
    hints: "Fie N numarul total de termeni, p1 pozitia primului pozitiv si p2 pozitia ultimului pozitiv. Raspunsul este max(N-p1+1, p2).",
    explanation: "O secventa ce incepe cu un pozitiv si are lungime maxima porneste la primul pozitiv (pozitia p1) si se intinde pana la finalul sirului: lungime N-p1+1. O secventa ce se incheie cu un pozitiv si are lungime maxima porneste de la inceputul sirului si se intinde pana la ultimul pozitiv (pozitia p2): lungime p2. Raspunsul este maximul acestor doua valori, determinate printr-o singura trecere prin fisier.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.in", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.in", "r", stdin);
    long long v;
    long long n = 0, p1 = -1, p2 = -1;
    while (cin >> v) {
        n++;
        if (v > 0) { if (p1 == -1) p1 = n; p2 = n; }
    }
    cout << max(n - p1 + 1, p2) << "\\n";
    return 0;
}
`,
    py: `with open("bac.in") as f:
    data = f.read().split()
n = len(data)
p1, p2 = -1, -1
for i, tok in enumerate(data, start=1):
    if int(tok) > 0:
        if p1 == -1:
            p1 = i
        p2 = i
print(max(n - p1 + 1, p2))
`,
    tests: [
      "-15 -7 4 -7 21 -5 -200 -26 52 -24 -7 -9 -20",
      "5",
      "5 -1 -2 -3 -4",
      "-1 -2 -3 -4 5",
      (() => {
        const parts = ["1"];
        for (let i = 0; i < 20000; i++) parts.push(String(-(i % 100) - 1));
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== VARIANTA 3 (Testul 3) =====================
  {
    slug: "bac-antrenament-2021-v3-3-1",
    subcategoryId: "antrenament-2021-v3",
    title: "Bacalaureat Antrenament 2021, Varianta 3, S3.1 - Suma divizorilor care nu sunt primi",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "divizori"],
    statement:
      "Subprogramul suma are un singur parametru, n, prin care primeste un numar natural (n in [1,10^6]). Subprogramul returneaza suma divizorilor pozitivi ai lui n care NU sunt primi.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: pentru n=12 subprogramul returneaza 23 (23=1+4+6+12).",
    input_format: "Se citeste de la tastatura n.",
    output_format: "Suma divizorilor lui n care nu sunt numere prime (include 1).",
    constraints: "1 <= n <= 10^6",
    hints: "Enumerati divizorii lui n prin trial division; pentru fiecare, verificati daca este prim (alt trial division mai mic) si adaugati-l la suma doar daca NU este prim.",
    explanation: "Se enumera divizorii lui n prin trial division pana la radacina patrata; pentru fiecare divizor gasit (atat d cat si n/d), se verifica daca este numar prim; daca NU este prim (inclusiv divizorul 1), se aduna la suma.\n\n**Complexitate:** O(sqrt(n) * sqrt(n)) in cel mai defavorabil caz, suficient de rapid pentru n<=10^6",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

bool ePrimV3(long long v) {
    if (v < 2) return false;
    for (long long d = 2; d * d <= v; d++) if (v % d == 0) return false;
    return true;
}

__USER_CODE__

int main() {
    long long n; cin >> n;
    cout << suma(n) << "\\n";
    return 0;
}
`,
    function_template_python: `def e_prim_v3(v):
    if v < 2:
        return False
    d = 2
    while d * d <= v:
        if v % d == 0:
            return False
        d += 1
    return True

__USER_CODE__

n = int(input())
print(suma(n))
`,
    cpp: `long long suma(long long n) {
    long long s = 0;
    for (long long d = 1; d * d <= n; d++) {
        if (n % d == 0) {
            long long e = n / d;
            if (!ePrimV3(d)) s += d;
            if (e != d && !ePrimV3(e)) s += e;
        }
    }
    return s;
}
`,
    py: `def suma(n):
    s = 0
    d = 1
    while d * d <= n:
        if n % d == 0:
            e = n // d
            if not e_prim_v3(d):
                s += d
            if e != d and not e_prim_v3(e):
                s += e
        d += 1
    return s
`,
    tests: ["12", "1", "2", "1000000", "997"],
  },
  {
    slug: "bac-antrenament-2021-v3-3-2",
    subcategoryId: "antrenament-2021-v3",
    title: "Bacalaureat Antrenament 2021, Varianta 3, S3.2 - Locuri rezervate pe primul si ultimul rand",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "O sala de spectacole are mai multe randuri de scaune, toate randurile avand acelasi numar de locuri. O persoana poate rezerva mai multe locuri, dar cel mult cate unul pe un rand. Configuratia salii este memorata ca un tablou bidimensional, in care prima coloana corespunde primului rand de scaune, iar ultima coloana corespunde ultimului rand de scaune. Locurile libere sunt notate cu 0, iar cele rezervate sunt notate cu numere naturale nenule, astfel incat toate locurile rezervate de o persoana sunt notate cu acelasi numar, iar cele rezervate de persoane distincte sunt notate cu numere distincte.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura numerele naturale din intervalul [2,20], m si n, apoi m*n numere naturale din intervalul [0,400], elemente ale tabloului bidimensional cu m linii si n coloane, reprezentand configuratia salii. Programul verifica daca exista persoane care au rezervat locuri atat pe primul, cat si pe ultimul rand al salii, si afiseaza pe ecran numerele cu care sunt notate aceste locuri.\n\n" +
      "Numerele sunt afisate intr-o ordine oarecare, separate prin cate un spatiu, iar daca nu exista astfel de locuri se afiseaza pe ecran mesajul nu exista.\n\n" +
      "Exemplu: pentru m=5, n=4 si tabloul\n3 7 0 0\n0 0 5 8\n6 2 0 1\n0 3 0 6\n8 0 6 4\nse afiseaza pe ecran, nu neaparat in aceasta ordine, numerele 6 8",
    input_format: "Se citesc m, n, apoi elementele tabloului.",
    output_format: "Numerele persoanelor care au rezervat pe ambele coloane 1 si n (0 exclus), sau mesajul 'nu exista'.",
    constraints: "2 <= m, n <= 20",
    hints: "Colectati valorile nenule din coloana1 intr-o multime, valorile nenule din coloana n in alta multime, si afisati intersectia.",
    explanation: "Se colecteaza intr-o multime valorile nenule ale coloanei 1 (primul rand de scaune) si intr-o alta multime valorile nenule ale coloanei n (ultimul rand). Se afiseaza elementele comune celor doua multimi, sau mesajul cerut daca intersectia este vida.\n\n**Complexitate:** O(m)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int m, n; cin >> m >> n;
    vector<vector<int>> a(m + 1, vector<int>(n + 1));
    for (int i = 1; i <= m; i++) for (int j = 1; j <= n; j++) cin >> a[i][j];
    set<int> c1, cn;
    for (int i = 1; i <= m; i++) { if (a[i][1] != 0) c1.insert(a[i][1]); if (a[i][n] != 0) cn.insert(a[i][n]); }
    vector<int> rez;
    for (int v : c1) if (cn.count(v)) rez.push_back(v);
    if (rez.empty()) { cout << "nu exista\\n"; return 0; }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `m, n = map(int, input().split())
a = [[0] * (n + 1) for _ in range(m + 1)]
for i in range(1, m + 1):
    row = list(map(int, input().split()))
    for j in range(1, n + 1):
        a[i][j] = row[j - 1]
c1 = set(a[i][1] for i in range(1, m + 1) if a[i][1] != 0)
cn = set(a[i][n] for i in range(1, m + 1) if a[i][n] != 0)
rez = sorted(c1 & cn)
print("nu exista" if not rez else " ".join(map(str, rez)))
`,
    tests: [
      "5 4\n3 7 0 0\n0 0 5 8\n6 2 0 1\n0 3 0 6\n8 0 6 4",
      "2 2\n1 0\n0 1",
      "2 2\n1 0\n0 0",
      "3 2\n5 5\n0 0\n7 7",
      "2 3\n9 0 0\n0 0 9",
    ],
  },
  {
    slug: "bac-antrenament-2021-v3-3-3",
    subcategoryId: "antrenament-2021-v3",
    title: "Bacalaureat Antrenament 2021, Varianta 3, S3.3 - Pozitii precedate de maxim z-prieteni",
    difficulty: "hard",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Doua numere naturale sunt numite z-prietene daca au aceeasi cifra a zecilor.\n\n" +
      "Fisierul bac.in contine un sir de cel mult 10^6 numere naturale din intervalul [10,10^9], separate prin cate un spatiu. Se cere sa se afiseze pe ecran pozitiile din sir pe care se afla termeni precedati de un numar maxim de valori z-prietene cu ei. Numerele afisate sunt separate prin cate un spatiu. Proiectati un algoritm eficient din punctul de vedere al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine numerele 726 358 98 157 20 49 128 879 659 271 pe ecran se afiseaza numerele 7 9 (termenii 128, respectiv 659 respecta proprietatea ceruta).",
    input_format: "Fisierul bac.in: un sir de numere naturale, separate prin spatiu.",
    output_format: "Pozitiile (1-indexate) precedate de numarul maxim de valori cu aceeasi cifra a zecilor.",
    constraints: "cel mult 10^6 termeni",
    hints: "Mentineti un contor pentru fiecare cifra a zecilor (0-9), reprezentand cate numere cu acea cifra a zecilor au fost vazute STRICT INAINTE de pozitia curenta.",
    explanation: "Se parcurge sirul o singura data, mentinand un tablou de 10 contoare (numarul de aparitii ale fiecarei cifre a zecilor, vazute strict inainte de pozitia curenta). Pentru fiecare pozitie, se citeste contorul corespunzator cifrei zecilor termenului curent; daca acest numar depaseste strict maximul curent, se reseteaza lista de pozitii; daca este egal, se adauga pozitia la lista. Contorul se incrementeaza dupa procesarea fiecarei pozitii.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara (in afara rezultatului)",
    io: { input_source: "file", input_filename: "bac.in", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.in", "r", stdin);
    long long v;
    long long cnt[10] = {0};
    long long pos = 0, best = -1;
    vector<long long> rez;
    while (cin >> v) {
        pos++;
        int d = (int)((v / 10) % 10);
        long long c = cnt[d];
        if (c > best) { best = c; rez.clear(); rez.push_back(pos); }
        else if (c == best) rez.push_back(pos);
        cnt[d]++;
    }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `cnt = [0] * 10
best = -1
rez = []
pos = 0
with open("bac.in") as f:
    data = f.read().split()
for tok in data:
    v = int(tok)
    pos += 1
    d = (v // 10) % 10
    c = cnt[d]
    if c > best:
        best = c
        rez = [pos]
    elif c == best:
        rez.append(pos)
    cnt[d] += 1
print(" ".join(map(str, rez)))
`,
    tests: [
      "726 358 98 157 20 49 128 879 659 271",
      "10",
      "10 20 30",
      "15 25 35 45",
      (() => {
        const parts = [];
        for (let i = 0; i < 20000; i++) parts.push(String(10 + (i % 10) * 10));
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== VARIANTA 4 (Testul 4) =====================
  {
    slug: "bac-antrenament-2021-v4-3-1",
    subcategoryId: "antrenament-2021-v4",
    title: "Bacalaureat Antrenament 2021, Varianta 4, S3.1 - Numarul valorilor lui k pentru distribuirea jetoanelor",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "divizori"],
    statement:
      "Un joc online cu n jetoane poate fi jucat de un grup de k (k>=2) jucatori, numai daca toate cele n jetoane pot fi distribuite in mod egal celor k jucatori.\n\n" +
      "Subprogramul joc are un singur parametru, n, prin care primeste un numar natural (n in [2,10^4]), reprezentand numarul de jetoane ale unui joc de tipul precizat. Subprogramul returneaza numarul valorilor distincte pe care le poate avea k pentru acest joc.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=12, atunci subprogramul returneaza numarul 5 (cele 12 jetoane se pot distribui in mod egal pentru o grupa de 2 jucatori, de 3 jucatori, de 4 jucatori, de 6 jucatori sau de 12 jucatori).",
    input_format: "Se citeste de la tastatura n.",
    output_format: "Numarul divizorilor lui n care sunt >=2.",
    constraints: "2 <= n <= 10^4",
    hints: "Numarati toti divizorii lui n si scadeti 1 (pentru a exclude divizorul 1, care nu satisface k>=2).",
    explanation: "Se numara toti divizorii naturali ai lui n prin trial division; deoarece divizorul 1 nu satisface conditia k>=2, raspunsul este numarul total de divizori minus 1.\n\n**Complexitate:** O(sqrt(n))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    cout << joc(n) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(joc(n))
`,
    cpp: `int joc(long long n) {
    int cnt = 0;
    for (long long d = 1; d * d <= n; d++) {
        if (n % d == 0) { cnt++; long long e = n / d; if (e != d) cnt++; }
    }
    return cnt - 1;
}
`,
    py: `def joc(n):
    cnt = 0
    d = 1
    while d * d <= n:
        if n % d == 0:
            cnt += 1
            e = n // d
            if e != d:
                cnt += 1
        d += 1
    return cnt - 1
`,
    tests: ["12", "2", "10000", "9973", "9801"],
  },
  {
    slug: "bac-antrenament-2021-v4-3-2",
    subcategoryId: "antrenament-2021-v4",
    title: "Bacalaureat Antrenament 2021, Varianta 4, S3.2 - Maximul dintre valorile mai mici de 21, per linie",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Scrieti un program C/C++ care citeste de la tastatura numere naturale din intervalul [2,100]: m, n si elementele unui tablou bidimensional cu m linii si n coloane. Programul afiseaza pe ecran, pentru fiecare linie a sa, cea mai mare dintre valorile strict mai mici decat 21 memorate in aceasta, sau mesajul nu exista, daca nu exista nicio astfel de valoare pe linia respectiva. Numerele, respectiv mesajele, sunt afisate pe linii separate ale ecranului, in ordinea liniilor corespunzatoare din tablou.\n\n" +
      "Exemplu: pentru m=3, n=5 si tabloul\n6 16 21 4 90\n92 26 36 95 80\n5 2 9 7 3\nse afiseaza pe ecran\n16\nnu exista\n9",
    input_format: "Se citesc m, n, apoi elementele tabloului.",
    output_format: "Pentru fiecare linie, maximul valorilor <21, sau 'nu exista', cate o linie per rand din tablou.",
    constraints: "2 <= m, n <= 100",
    hints: "Pentru fiecare linie, parcurgeti elementele si retineti maximul celor strict mai mici decat 21.",
    explanation: "Pentru fiecare linie a tabloului, se parcurg elementele, retinandu-se maximul dintre cele strict mai mici decat 21; daca nu exista nicio astfel de valoare pe linie, se afiseaza mesajul cerut.\n\n**Complexitate:** O(m*n)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int m, n; cin >> m >> n;
    for (int i = 0; i < m; i++) {
        int mx = -1;
        for (int j = 0; j < n; j++) {
            int v; cin >> v;
            if (v < 21 && v > mx) mx = v;
        }
        if (mx == -1) cout << "nu exista\\n"; else cout << mx << "\\n";
    }
    return 0;
}
`,
    py: `m, n = map(int, input().split())
for i in range(m):
    row = list(map(int, input().split()))
    candidates = [v for v in row if v < 21]
    print("nu exista" if not candidates else max(candidates))
`,
    tests: [
      "3 5\n6 16 21 4 90\n92 26 36 95 80\n5 2 9 7 3",
      "2 2\n21 22\n1 2",
      "2 3\n20 20 20\n21 21 21",
      "2 2\n0 1\n2 3",
      "3 2\n25 30\n1 21\n20 5",
    ],
  },
  {
    slug: "bac-antrenament-2021-v4-3-3",
    subcategoryId: "antrenament-2021-v4",
    title: "Bacalaureat Antrenament 2021, Varianta 4, S3.3 - Multipli de 5 aflati in exact unul dintre fisiere",
    difficulty: "hard",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.txt contine numere naturale din intervalul [1,10^5]: pe prima linie un numar n1, pe a doua linie un sir de n1 numere (sirul intai), pe a treia linie un numar n2, iar pe a patra linie un sir de n2 numere (sirul al doilea). Numerele aflate pe aceeasi linie sunt ordonate crescator si sunt separate prin cate un spatiu.\n\n" +
      "Se cere sa se afiseze pe ecran, in ordine crescatoare, separate prin cate un spatiu, numerele divizibile cu 5 care se gasesc doar in unul dintre cele doua siruri. Daca nu exista niciun astfel de numar, se afiseaza pe ecran mesajul nu exista. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine 7, apoi 1 2 3 4 7 20 60, apoi 9, apoi 3 5 7 8 9 10 12 20 24, pe ecran se afiseaza, in aceasta ordine, numerele 5 10 60.",
    input_format: "Fisierul bac.txt: n1 pe linia 1, sirul1 (crescator) pe linia 2, n2 pe linia 3, sirul2 (crescator) pe linia 4.",
    output_format: "Multiplii de 5 aflati in exact unul dintre cele doua siruri, in ordine crescatoare, sau mesajul 'nu exista'.",
    constraints: "1 <= n1, n2 <= 10^5",
    hints: "Extrageti multiplii de 5 din fiecare sir (deja sortati); parcurgeti-i cu doi indici (interclasare) pentru a gasi diferenta simetrica.",
    explanation: "Se extrag, pastrand ordinea, doar multiplii de 5 din fiecare dintre cele doua siruri (deja sortate crescator). Se parcurg cele doua liste rezultate cu tehnica interclasarii (doi indici): la fiecare pas se compara valorile curente; daca sunt egale, ambele se avanseaza fara a afisa (apar in ambele siruri); daca difera, se afiseaza valoarea mai mica (apare doar intr-un sir) si se avanseaza indicele corespunzator.\n\n**Complexitate:** O(n1+n2) timp",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    int n1, n2; cin >> n1;
    vector<long long> a, b;
    for (int i = 0; i < n1; i++) { long long v; cin >> v; if (v % 5 == 0) a.push_back(v); }
    cin >> n2;
    for (int i = 0; i < n2; i++) { long long v; cin >> v; if (v % 5 == 0) b.push_back(v); }
    vector<long long> rez;
    size_t i = 0, j = 0;
    while (i < a.size() && j < b.size()) {
        if (a[i] == b[j]) { i++; j++; }
        else if (a[i] < b[j]) { rez.push_back(a[i]); i++; }
        else { rez.push_back(b[j]); j++; }
    }
    while (i < a.size()) rez.push_back(a[i++]);
    while (j < b.size()) rez.push_back(b[j++]);
    if (rez.empty()) { cout << "nu exista\\n"; return 0; }
    for (size_t k = 0; k < rez.size(); k++) cout << rez[k] << (k + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `with open("bac.txt") as f:
    n1 = int(f.readline())
    a = [v for v in map(int, f.readline().split()) if v % 5 == 0]
    n2 = int(f.readline())
    b = [v for v in map(int, f.readline().split()) if v % 5 == 0]
rez = []
i = j = 0
while i < len(a) and j < len(b):
    if a[i] == b[j]:
        i += 1; j += 1
    elif a[i] < b[j]:
        rez.append(a[i]); i += 1
    else:
        rez.append(b[j]); j += 1
rez.extend(a[i:])
rez.extend(b[j:])
print("nu exista" if not rez else " ".join(map(str, rez)))
`,
    tests: [
      "7\n1 2 3 4 7 20 60\n9\n3 5 7 8 9 10 12 20 24",
      "1\n5\n1\n5",
      "1\n5\n1\n10",
      "2\n5 10\n1\n10",
      "1\n1\n1\n2",
    ],
  },
];

module.exports = problems;
