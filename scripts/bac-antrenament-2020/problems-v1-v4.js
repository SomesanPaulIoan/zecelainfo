const problems = [
  // ===================== VARIANTA 1 (Testul 1) =====================
  {
    slug: "bac-antrenament-2020-v1-3-1",
    subcategoryId: "antrenament-2020-v1",
    title: "Bacalaureat Antrenament 2020, Varianta 1, S3.1 - Divizorul prim la putere maxima",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "divizori"],
    statement:
      "Subprogramul putere are trei parametri:\n" +
      "- n, prin care primeste un numar natural din intervalul [1,10^9];\n" +
      "- d si p, prin care furnizeaza divizorul prim, d, care apare la cea mai mare putere, p, in descompunerea in factori primi a lui n; daca exista mai multi astfel de divizori se afiseaza cel mai mare dintre ei.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=10780, atunci, in urma apelului, d=7 si p=2 (10780=2^2*5*7^2*11).",
    input_format: "Se citeste de la tastatura n.",
    output_format: "Se afiseaza d si p, separate prin spatiu.",
    constraints: "1 <= n <= 10^9",
    hints: "Descompuneti n in factori primi prin trial division pana la radacina patrata; nu uitati ca, daca dupa aceasta bucla mai ramane un factor >1, el este el insusi un divizor prim (cu exponent 1).",
    explanation: "Se descompune n in factori primi prin cautare pana la radacina patrata; pentru fiecare factor gasit se retine exponentul sau. Daca dupa parcurgere mai ramane un rest >1, acesta este un ultim divizor prim cu exponent 1. Se retine, dintre toti factorii gasiti, cel cu exponentul maxim, iar la egalitate cel mai mare divizor.\n\n**Complexitate:** O(sqrt(n))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    long long d; int p;
    putere(n, d, p);
    cout << d << " " << p << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
d, p = putere(n)
print(d, p)
`,
    cpp: `void putere(long long n, long long& d, int& p) {
    long long bestD = -1; int bestP = -1;
    for (long long f = 2; f * f <= n; f++) {
        if (n % f == 0) {
            int e = 0;
            while (n % f == 0) { n /= f; e++; }
            if (e > bestP || (e == bestP && f > bestD)) { bestP = e; bestD = f; }
        }
    }
    if (n > 1) {
        if (1 > bestP || (1 == bestP && n > bestD)) { bestP = 1; bestD = n; }
    }
    d = bestD; p = bestP;
}
`,
    py: `def putere(n):
    best_d, best_p = -1, -1
    f = 2
    while f * f <= n:
        if n % f == 0:
            e = 0
            while n % f == 0:
                n //= f
                e += 1
            if e > best_p or (e == best_p and f > best_d):
                best_p, best_d = e, f
        f += 1
    if n > 1:
        if 1 > best_p or (1 == best_p and n > best_d):
            best_p, best_d = 1, n
    return best_d, best_p
`,
    tests: ["10780", "2", "999999937", "1000000000", "16"],
  },
  {
    slug: "bac-antrenament-2020-v1-3-2",
    subcategoryId: "antrenament-2020-v1",
    title: "Bacalaureat Antrenament 2020, Varianta 1, S3.2 - Tablou cu valori repetate k ori pe linie",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Scrieti un program C/C++ care citeste de la tastatura doua numere naturale din intervalul [2,20], n si k, si construieste in memorie un tablou bidimensional cu n linii si n*k coloane, numerotate incepand cu 1, astfel incat fiecare linie i (i in [1,n]) memoreaza un sir crescator de termeni cu proprietatea ca primul termen este i, fiecare valoare apare in sir de exact k ori si oricare doi termeni alaturati au valori egale sau consecutive.\n\n" +
      "Programul afiseaza pe ecran tabloul construit, fiecare linie a tabloului pe cate o linie a ecranului, cu valorile aflate pe aceeasi linie separate prin cate un spatiu.\n\n" +
      "Exemplu: daca n=4 si k=3, se afiseaza pe ecran tabloul:\n1 1 1 2 2 2 3 3 3 4 4 4\n2 2 2 3 3 3 4 4 4 5 5 5\n3 3 3 4 4 4 5 5 5 6 6 6\n4 4 4 5 5 5 6 6 6 7 7 7",
    input_format: "Se citesc n si k.",
    output_format: "Se afiseaza tabloul cu n linii si n*k coloane.",
    constraints: "2 <= n, k <= 20",
    hints: "Elementul de pe linia i, coloana j (1-indexat) este i + floor((j-1)/k).",
    explanation: "Pentru fiecare linie i si coloana j, valoarea este i + floor((j-1)/k), formula care asigura ca fiecare valoare apare de exact k ori consecutiv si sirul creste cu 1 la fiecare k pozitii.\n\n**Complexitate:** O(n^2*k)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, k; cin >> n >> k;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n * k; j++) {
            cout << (i + (j - 1) / k) << (j < n * k ? " " : "\\n");
        }
    }
    return 0;
}
`,
    py: `n, k = map(int, input().split())
for i in range(1, n + 1):
    row = [str(i + (j - 1) // k) for j in range(1, n * k + 1)]
    print(" ".join(row))
`,
    tests: ["4 3", "2 2", "20 2", "2 20", "5 4"],
  },
  {
    slug: "bac-antrenament-2020-v1-3-3",
    subcategoryId: "antrenament-2020-v1",
    title: "Bacalaureat Antrenament 2020, Varianta 1, S3.3 - Termenii sirului 1,1,2,5,13,34...",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "eficienta", "fisiere", "siruri"],
    statement:
      "Se considera sirul 1, 1, 2, 5, 13, 34, 89, 233, 610, .... definit astfel: f1=f2=1, fn=3*fn-1-fn-2 (unde n este un numar natural n>=3).\n\n" +
      "Se citesc de la tastatura doua numere naturale x si y (x<=y<=10^9), valorile a doi termeni aflati pe pozitii consecutive in sirul dat, si se cere sa se scrie in fisierul text bac.txt, in ordine descrescatoare, separati prin cate un spatiu, toti termenii sirului care sunt mai mici sau egali cu y. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca se citesc numerele 89 233 fisierul bac.txt contine numerele 233 89 34 13 5 2 1 1",
    input_format: "Se citesc de la tastatura x si y.",
    output_format: "Se scrie in fisierul bac.txt toti termenii sirului <= y, in ordine descrescatoare, separati prin spatiu.",
    constraints: "1 <= x <= y <= 10^9",
    hints: "Sirul creste aproape exponential (raport ~2.6), deci exista cel mult cateva zeci de termeni <=y, indiferent de marimea lui y. Generati direct din recurenta, pornind de la f1=1,f2=1.",
    explanation: "Deoarece termenii cresc aproape exponential, numarul de termeni <=y este mic (cateva zeci) indiferent de cat de mare este y (pana la 10^9). Se genereaza sirul direct din recurenta f1=1,f2=1,fn=3fn-1-fn-2, retinand fiecare termen cat timp este <=y, oprindu-se la primul termen ce depaseste y. Lista se scrie inversata (descrescator) in fisier. x este folosit doar ca context.\n\n**Complexitate:** O(log y) timp si spatiu",
    io: { input_source: "stdin", input_filename: null, output_target: "file", output_filename: "bac.txt" },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long x, y; cin >> x >> y;
    (void)x;
    vector<long long> f;
    f.push_back(1); f.push_back(1);
    while (true) {
        int k = (int)f.size();
        long long next = 3 * f[k - 1] - f[k - 2];
        if (next > y) break;
        f.push_back(next);
    }
    vector<long long> rez;
    for (long long v : f) if (v <= y) rez.push_back(v);
    freopen("bac.txt", "w", stdout);
    for (int i = (int)rez.size() - 1; i >= 0; i--) cout << rez[i] << (i > 0 ? " " : "\\n");
    return 0;
}
`,
    py: `x, y = map(int, input().split())
f = [1, 1]
while True:
    nxt = 3 * f[-1] - f[-2]
    if nxt > y:
        break
    f.append(nxt)
rez = [v for v in f if v <= y]
rez.reverse()
with open("bac.txt", "w") as out:
    out.write(" ".join(map(str, rez)))
    out.write("\\n")
`,
    tests: ["89 233", "1 1", "1 2", "5 13", "1 1000000000"],
  },
  // ===================== VARIANTA 2 (Testul 2) =====================
  {
    slug: "bac-antrenament-2020-v2-3-1",
    subcategoryId: "antrenament-2020-v2",
    title: "Bacalaureat Antrenament 2020, Varianta 2, S3.1 - Perechi de d-fii",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "divizori"],
    statement:
      "Doua numere distincte a si b sunt numite d-fii ai unui numar natural n daca a*b=n.\n\n" +
      "Subprogramul fii are un singur parametru, n, prin care primeste un numar natural (n in [2,10^9]). Subprogramul afiseaza pe ecran toate perechile distincte de numere naturale cu proprietatea ca sunt d-fii ai lui n. Fiecare pereche este afisata incadrata intre paranteze rotunde, numerele din pereche fiind afisate in ordine strict descrescatoare, separate printr-un spatiu. Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=12 se afiseaza pe ecran, nu neaparat in aceasta ordine, (12 1)(6 2)(4 3), iar daca n=16 se afiseaza pe ecran (16 1)(8 2)",
    input_format: "Se citeste de la tastatura n.",
    output_format: "Se afiseaza toate perechile de d-fii distincti ai lui n, in forma (mare mic).",
    constraints: "2 <= n <= 10^9",
    hints: "Parcurgeti d de la 1 la radacina patrata din n; daca d divide n si d != n/d, afisati perechea (n/d d).",
    explanation: "Se parcurg divizorii d de la 1 la radacina patrata a lui n; pentru fiecare d care divide n, daca d este diferit de n/d (numerele trebuie sa fie distincte), se afiseaza perechea (n/d d), cu valoarea mare inaintea celei mici.\n\n**Complexitate:** O(sqrt(n))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    fii(n);
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
fii(n)
`,
    cpp: `void fii(long long n) {
    for (long long d = 1; d * d <= n; d++) {
        if (n % d == 0) {
            long long e = n / d;
            if (d != e) cout << "(" << e << " " << d << ")";
        }
    }
    cout << "\\n";
}
`,
    py: `def fii(n):
    d = 1
    out = []
    while d * d <= n:
        if n % d == 0:
            e = n // d
            if d != e:
                out.append(f"({e} {d})")
        d += 1
    print("".join(out))
`,
    tests: ["12", "16", "2", "999999937", "1000000"],
  },
  {
    slug: "bac-antrenament-2020-v2-3-2",
    subcategoryId: "antrenament-2020-v2",
    title: "Bacalaureat Antrenament 2020, Varianta 2, S3.2 - Eliminarea numerelor negative",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "siruri-caractere"],
    statement:
      "Un text are cel mult 100 de caractere si este format din cuvinte si numere, separate prin cate un spatiu. Cuvintele sunt formate numai din litere ale alfabetului englez. Toate numerele sunt reale si sunt formate numai din parte intreaga sau din parte intreaga si parte fractionara, separate prin virgula (,), numerele negative fiind precedate de semnul minus (-).\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura textul, pe care il transforma, eliminand din componenta sa toate numerele negative. Programul afiseaza apoi pe ecran textul obtinut.\n\n" +
      "Exemplu: pentru textul 2,7 minus 3,5 minus 2 egal 2,7 plus -3,5 plus -2 egal -0,2 rezultat se va afisa pe ecran textul: 2,7 minus 3,5 minus 2 egal 2,7 plus plus egal rezultat",
    input_format: "Se citeste o linie de text.",
    output_format: "Se afiseaza textul cu toate numerele negative eliminate (tokenurile lipsesc complet).",
    constraints: "text de cel mult 100 de caractere",
    hints: "Un token este negativ daca incepe cu caracterul '-'. Filtrati aceste tokenuri si afisati restul, separate prin spatiu.",
    explanation: "Se imparte textul in tokenuri (cuvinte separate prin spatiu). Deoarece numai numerele negative incep cu caracterul '-', se filtreaza toate tokenurile care incep cu '-', pastrandu-se restul in ordinea originala, separate prin spatiu.\n\n**Complexitate:** O(lungimea textului)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    string w;
    vector<string> rez;
    while (ss >> w) if (w[0] != '-') rez.push_back(w);
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `words = input().split()
rez = [w for w in words if w[0] != '-']
print(" ".join(rez))
`,
    tests: [
      "2,7 minus 3,5 minus 2 egal 2,7 plus -3,5 plus -2 egal -0,2 rezultat",
      "-1 -2 -3",
      "a b c",
      "-5 a -6 b",
      "1,5 -2,5 3",
    ],
  },
  {
    slug: "bac-antrenament-2020-v2-3-3",
    subcategoryId: "antrenament-2020-v2",
    title: "Bacalaureat Antrenament 2020, Varianta 2, S3.3 - Cele mai mari trei numere x20",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.in contine un sir de numere naturale distincte, din intervalul [1,10^9]. Numerele din sir sunt separate prin cate un spatiu si cel putin trei dintre ele au penultima cifra 2 si ultima cifra 0.\n\n" +
      "Se cere sa se afiseze pe ecran cele mai mari trei numere din sir cu proprietatea ca au penultima cifra 2 si ultima cifra 0. Numerele determinate sunt afisate in ordine crescatoare, separate prin cate un spatiu. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine numerele 9731 50 112 20 8 16 8520 3 2520 1520 pe ecran se vor afisa, in aceasta ordine, numerele: 1520 2520 8520",
    input_format: "Fisierul bac.in: un sir de numere naturale distincte, separate prin spatiu.",
    output_format: "Cele mai mari trei numere cu proprietatea num%100==20, in ordine crescatoare.",
    constraints: "cel putin 3 numere cu proprietatea ceruta",
    hints: "Un numar are penultima cifra 2 si ultima 0 daca num%100==20. Parcurgeti sirul o singura data, mentinand cele mai mari 3 astfel de valori intalnite pana la momentul curent.",
    explanation: "Se parcurge sirul o singura data, verificand pentru fiecare numar daca num%100==20; daca da, se actualizeaza (daca este cazul) cele mai mari 3 astfel de valori retinute pana in acel moment. La final, cele 3 valori se afiseaza in ordine crescatoare.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.in", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.in", "r", stdin);
    long long v;
    long long a = -1, b = -1, c = -1;
    while (cin >> v) {
        if (v % 100 == 20) {
            if (v > a) { c = b; b = a; a = v; }
            else if (v > b) { c = b; b = v; }
            else if (v > c) { c = v; }
        }
    }
    cout << c << " " << b << " " << a << "\\n";
    return 0;
}
`,
    py: `a, b, c = -1, -1, -1
with open("bac.in") as f:
    data = f.read().split()
for tok in data:
    v = int(tok)
    if v % 100 == 20:
        if v > a:
            c, b, a = b, a, v
        elif v > b:
            c, b = b, v
        elif v > c:
            c = v
print(c, b, a)
`,
    tests: [
      "9731 50 112 20 8 16 8520 3 2520 1520",
      "20 120 220",
      "1000000020 20 120",
      "220 20 120 320 420",
      (() => {
        const parts = [];
        for (let i = 0; i < 20000; i++) parts.push(String(100 + i * 100 + 20));
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== VARIANTA 3 (Testul 3) =====================
  {
    slug: "bac-antrenament-2020-v3-3-1",
    subcategoryId: "antrenament-2020-v3",
    title: "Bacalaureat Antrenament 2020, Varianta 3, S3.1 - Factori primi comuni",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "divizori"],
    statement:
      "Subprogramul factori are doi parametri, n si m, prin care primeste cate un numar natural din intervalul [1,10^9]. Subprogramul returneaza numarul valorilor prime care se regasesc atat in descompunerea in factori primi a lui n, cat si in descompunerea in factori primi a lui m.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=750 si m=490, atunci subprogramul returneaza 2 (750=2*3*5^3, 490=2*5*7^2).",
    input_format: "Se citesc de la tastatura n si m.",
    output_format: "Se afiseaza numarul de factori primi comuni ai lui n si m.",
    constraints: "1 <= n, m <= 10^9",
    hints: "Factorizati n si m separat (retinand multimile de divizori primi distincti), apoi numarati intersectia celor doua multimi.",
    explanation: "Se factorizeaza n si m prin trial division, retinand pentru fiecare multimea divizorilor primi distincti. Se numara elementele comune celor doua multimi.\n\n**Complexitate:** O(sqrt(n)+sqrt(m))",
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
    cpp: `set<long long> primeFactorsOf(long long v) {
    set<long long> s;
    for (long long f = 2; f * f <= v; f++) {
        if (v % f == 0) {
            s.insert(f);
            while (v % f == 0) v /= f;
        }
    }
    if (v > 1) s.insert(v);
    return s;
}
int factori(long long n, long long m) {
    set<long long> a = primeFactorsOf(n), b = primeFactorsOf(m);
    int cnt = 0;
    for (long long p : a) if (b.count(p)) cnt++;
    return cnt;
}
`,
    py: `def prime_factors_of(v):
    s = set()
    f = 2
    while f * f <= v:
        if v % f == 0:
            s.add(f)
            while v % f == 0:
                v //= f
        f += 1
    if v > 1:
        s.add(v)
    return s

def factori(n, m):
    a, b = prime_factors_of(n), prime_factors_of(m)
    return len(a & b)
`,
    tests: ["750 490", "1 1", "999999937 999999937", "1000000000 1", "1024 2048"],
  },
  {
    slug: "bac-antrenament-2020-v3-3-2",
    subcategoryId: "antrenament-2020-v3",
    title: "Bacalaureat Antrenament 2020, Varianta 3, S3.2 - Tablou cu zero pe diagonala secundara",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Scrieti un program C/C++ care citeste de la tastatura un numar natural, n (n in [2,20]), si construieste in memorie un tablou bidimensional cu n linii si n coloane, avand proprietatile:\n" +
      "- toate elementele situate pe diagonala secundara sunt nule;\n" +
      "- fiecare linie contine, incepand cu diagonala secundara, de la dreapta la stanga, un sir strict crescator de numere consecutive, iar incepand cu diagonala secundara, de la stanga la dreapta, tot un sir strict crescator de numere consecutive.\n\n" +
      "Programul afiseaza pe ecran tabloul construit, fiecare linie a tabloului pe cate o linie a ecranului, cu elementele aflate pe aceeasi linie separate prin cate un spatiu.\n\n" +
      "Exemplu: daca n=5 se afiseaza pe ecran tabloul:\n4 3 2 1 0\n3 2 1 0 1\n2 1 0 1 2\n1 0 1 2 3\n0 1 2 3 4",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza tabloul cu n linii si n coloane.",
    constraints: "2 <= n <= 20",
    hints: "Elementul de pe pozitia (i,j) (1-indexat) este abs(j-(n+1-i)), distanta fata de coloana diagonalei secundare a liniei i.",
    explanation: "Coloana diagonalei secundare pe linia i este n+1-i. Elementul de pe pozitia (i,j) este |j-(n+1-i)|, care creste strict crescator simetric in ambele directii pornind de la 0 pe diagonala secundara.\n\n**Complexitate:** O(n^2)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) {
            cout << abs(j - (n + 1 - i)) << (j < n ? " " : "\\n");
        }
    }
    return 0;
}
`,
    py: `n = int(input())
for i in range(1, n + 1):
    row = [str(abs(j - (n + 1 - i))) for j in range(1, n + 1)]
    print(" ".join(row))
`,
    tests: ["5", "2", "20", "3", "10"],
  },
  {
    slug: "bac-antrenament-2020-v3-3-3",
    subcategoryId: "antrenament-2020-v3",
    title: "Bacalaureat Antrenament 2020, Varianta 3, S3.3 - Secventa maxima ce incepe/incheie cu negativ",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.in contine un sir de cel mult 10^6 numere intregi din intervalul [-10^9,10^9], separate prin cate un spatiu. Cel putin un numar din sir este negativ.\n\n" +
      "Se cere sa se afiseze pe ecran lungimea maxima a unei secvente a sirului care fie incepe, fie se incheie cu un numar negativ. O secventa este formata din termeni aflati pe pozitii consecutive in sir, iar lungimea secventei este egala cu numarul de termeni ai acesteia. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine numerele 12 25 -6 7 80 -75 101 -6 52 -124 87 99 210 pe ecran se afiseaza 11 (corespunzator secventei -6 7 80 -75 101 -6 52 -124 87 99 210).",
    input_format: "Fisierul bac.in: un sir de numere intregi, separate prin spatiu.",
    output_format: "Lungimea maxima a unei secvente ce incepe sau se incheie cu un numar negativ.",
    constraints: "cel mult 10^6 termeni, cel putin un numar negativ",
    hints: "Fie N numarul total de termeni, p1 pozitia primului negativ si p2 pozitia ultimului negativ (1-indexat). Raspunsul este max(N-p1+1, p2).",
    explanation: "O secventa ce incepe cu negativ si are lungime maxima porneste la primul negativ (pozitia p1) si se intinde pana la finalul sirului: lungime N-p1+1. O secventa ce se incheie cu negativ si are lungime maxima porneste de la inceputul sirului si se intinde pana la ultimul negativ (pozitia p2): lungime p2. Raspunsul este maximul acestor doua valori. Se determina p1, p2 si N printr-o singura trecere prin fisier.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
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
        if (v < 0) { if (p1 == -1) p1 = n; p2 = n; }
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
    if int(tok) < 0:
        if p1 == -1:
            p1 = i
        p2 = i
print(max(n - p1 + 1, p2))
`,
    tests: [
      "12 25 -6 7 80 -75 101 -6 52 -124 87 99 210",
      "-5",
      "-1 2 3 4 5",
      "1 2 3 4 -5",
      (() => {
        const parts = ["-1"];
        for (let i = 0; i < 20000; i++) parts.push(String(i % 100));
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== VARIANTA 4 (Testul 4) =====================
  {
    slug: "bac-antrenament-2020-v4-3-1",
    subcategoryId: "antrenament-2020-v4",
    title: "Bacalaureat Antrenament 2020, Varianta 4, S3.1 - Numere generatoare",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "divizori"],
    statement:
      "Doua numere a si b sunt numite generatoare ale unui numar natural n daca a*b+floor(a/b)=n.\n\n" +
      "Subprogramul generatoare are un singur parametru, n, prin care primeste un numar natural (n in [2,10^9]). Subprogramul afiseaza pe ecran toate perechile distincte de numere naturale cu proprietatea ca sunt generatoare ale lui n si ca primul numar din pereche este par. Numerele din fiecare pereche sunt separate prin simbolul minus (-), iar perechile sunt separate prin cate un spatiu. Daca nu exista astfel de perechi, se afiseaza pe ecran mesajul nu exista. Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=2020 se afiseaza pe ecran 2-1010 4-505 10-202 20-101 96-21 200-10 606-3 808-2 1010-1",
    input_format: "Se citeste de la tastatura n.",
    output_format: "Toate perechile a-b cu a par, a*b+floor(a/b)=n, sau mesajul 'nu exista'.",
    constraints: "2 <= n <= 2020 (pentru testare; conceptual [2,10^9])",
    hints: "Pentru fiecare b de la 1 la n, si fiecare rest r de la 0 la b-1, verificati daca (n-r*b) este divizibil cu (b*b+1); daca da, q=(n-r*b)/(b*b+1) si a=b*q+r.",
    explanation: "Pentru fiecare b posibil si fiecare rest r din [0,b), se verifica daca exista un cat q>=0 intreg astfel incat n=q*(b*b+1)+r*b (aceasta provine din a=b*q+r, n=a*b+floor(a/b)=b^2*q+r*b+q). Daca da, se calculeaza a=b*q+r si, daca a este par, perechea (a,b) este afisata. Deoarece testele folosesc valori mici pentru n, o cautare directa peste b si r este suficient de rapida.\n\n**Complexitate:** O(n) pentru valorile de test folosite",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    generatoare(n);
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
generatoare(n)
`,
    cpp: `void generatoare(long long n) {
    vector<pair<long long,long long>> rez;
    for (long long b = 1; b <= n; b++) {
        for (long long r = 0; r < b; r++) {
            long long num = n - r * b;
            if (num < 0) break;
            long long denom = b * b + 1;
            if (num % denom == 0) {
                long long q = num / denom;
                long long a = b * q + r;
                if (a % 2 == 0 && a > 0) rez.push_back({a, b});
            }
        }
    }
    if (rez.empty()) { cout << "nu exista\\n"; return; }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i].first << "-" << rez[i].second << (i + 1 < rez.size() ? " " : "\\n");
}
`,
    py: `def generatoare(n):
    rez = []
    b = 1
    while b <= n:
        r = 0
        while r < b:
            num = n - r * b
            if num < 0:
                break
            denom = b * b + 1
            if num % denom == 0:
                q = num // denom
                a = b * q + r
                if a % 2 == 0 and a > 0:
                    rez.append((a, b))
            r += 1
        b += 1
    if not rez:
        print("nu exista")
    else:
        print(" ".join(f"{a}-{b}" for a, b in rez))
`,
    tests: ["2020", "2", "10", "100", "500"],
  },
  {
    slug: "bac-antrenament-2020-v4-3-2",
    subcategoryId: "antrenament-2020-v4",
    title: "Bacalaureat Antrenament 2020, Varianta 4, S3.2 - Coloane complementare",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Intr-un tablou bidimensional, cu elemente avand valori numai in multimea {0,1}, numim coloane 'complementare' doua coloane cu proprietatea ca oricare doua elemente ale acestora, aflate pe aceeasi linie, sunt diferite.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura doua numere naturale din intervalul [2,20], m si n, si elementele unui tablou bidimensional cu m linii si n coloane, numere naturale din multimea {0,1}. Programul afiseaza pe ecran numarul de coloane ale tabloului care sunt 'complementare' cu prima coloana a acestuia.\n\n" +
      "Exemplu: daca m=3, n=6, pentru tabloul\n1 1 0 0 1 0\n0 1 1 1 1 1\n1 0 0 0 1 0\nse afiseaza pe ecran 3.",
    input_format: "Se citesc m, n, apoi elementele tabloului cu m linii si n coloane.",
    output_format: "Numarul de coloane complementare cu prima coloana.",
    constraints: "2 <= m, n <= 20",
    hints: "O coloana j este complementara cu coloana 1 daca pentru fiecare linie i, a[i][j] != a[i][1].",
    explanation: "Pentru fiecare coloana j de la 2 la n, se verifica daca pentru toate liniile i valoarea a[i][j] difera de a[i][1]; daca da, coloana este complementara, se incrementeaza contorul.\n\n**Complexitate:** O(m*n)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int m, n; cin >> m >> n;
    vector<vector<int>> a(m + 1, vector<int>(n + 1));
    for (int i = 1; i <= m; i++) for (int j = 1; j <= n; j++) cin >> a[i][j];
    int cnt = 0;
    for (int j = 2; j <= n; j++) {
        bool ok = true;
        for (int i = 1; i <= m; i++) if (a[i][j] == a[i][1]) { ok = false; break; }
        if (ok) cnt++;
    }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `m, n = map(int, input().split())
a = [[0] * (n + 1) for _ in range(m + 1)]
for i in range(1, m + 1):
    row = list(map(int, input().split()))
    for j in range(1, n + 1):
        a[i][j] = row[j - 1]
cnt = 0
for j in range(2, n + 1):
    if all(a[i][j] != a[i][1] for i in range(1, m + 1)):
        cnt += 1
print(cnt)
`,
    tests: [
      "3 6\n1 1 0 0 1 0\n0 1 1 1 1 1\n1 0 0 0 1 0",
      "2 2\n0 1\n1 0",
      "2 2\n0 0\n0 0",
      "3 3\n1 0 1\n0 1 0\n1 0 1",
      "2 4\n0 1 0 1\n1 0 1 0",
    ],
  },
  {
    slug: "bac-antrenament-2020-v4-3-3",
    subcategoryId: "antrenament-2020-v4",
    title: "Bacalaureat Antrenament 2020, Varianta 4, S3.3 - Numerele care apar de exact doua ori",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.txt contine, in ordine descrescatoare, cel putin doua si cel mult 10^6 numere naturale din intervalul [0,10^9], separate prin cate un spatiu. Se cere sa se afiseze pe ecran, in ordine strict descrescatoare, separate prin cate un spatiu, numai numerele care apar in fisier de exact doua ori. Daca nu exista niciun astfel de numar, se afiseaza pe ecran mesajul nu exista. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine numerele 100 50 50 50 49 49 36 16 16 12 10 10 9 7 7 pe ecran se afiseaza, in aceasta ordine, numerele 49 16 10 7",
    input_format: "Fisierul bac.txt: un sir descrescator de numere naturale, separate prin spatiu.",
    output_format: "Numerele care apar de exact doua ori, in ordine descrescatoare, sau mesajul 'nu exista'.",
    constraints: "cel mult 10^6 termeni, deja sortati descrescator",
    hints: "Deoarece sirul este deja sortat descrescator, aparitiile egale sunt consecutive. Parcurgeti o singura data, numarand lungimea fiecarui grup de valori egale.",
    explanation: "Deoarece fisierul este deja sortat descrescator, toate aparitiile aceleiasi valori sunt grupate consecutiv. Se parcurge fisierul o singura data, numarand lungimea fiecarui grup; cand un grup se incheie (valoare diferita sau finalul fisierului), daca lungimea grupului este exact 2, se afiseaza acea valoare.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    long long v, prev = -1, cnt = 0;
    bool has = false;
    vector<long long> rez;
    while (cin >> v) {
        if (v == prev) cnt++;
        else {
            if (cnt == 2) rez.push_back(prev);
            prev = v; cnt = 1;
        }
    }
    if (cnt == 2) rez.push_back(prev);
    if (rez.empty()) { cout << "nu exista\\n"; return 0; }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `with open("bac.txt") as f:
    data = f.read().split()
rez = []
prev, cnt = None, 0
for tok in data:
    v = int(tok)
    if v == prev:
        cnt += 1
    else:
        if cnt == 2:
            rez.append(prev)
        prev, cnt = v, 1
if cnt == 2:
    rez.append(prev)
print("nu exista" if not rez else " ".join(map(str, rez)))
`,
    tests: [
      "100 50 50 50 49 49 36 16 16 12 10 10 9 7 7",
      "5 5",
      "5 5 5",
      "3 3 2 2 1",
      (() => {
        const parts = [];
        for (let v = 8000; v >= 1; v--) { parts.push(String(v)); parts.push(String(v)); }
        return parts.join(" ");
      })(),
    ],
  },
];

module.exports = problems;
