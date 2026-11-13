const problems = [
  // ===================== VARIANTA 13 (Testul 13) =====================
  {
    slug: "bac-antrenament-2020-v13-3-1",
    subcategoryId: "antrenament-2020-v13",
    title: "Bacalaureat Antrenament 2020, Varianta 13, S3.1 - Divizorul prim la putere minima",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "divizori"],
    statement:
      "Subprogramul putere are trei parametri:\n" +
      "- n, prin care primeste un numar natural din intervalul [2,10^9];\n" +
      "- d si p, prin care furnizeaza divizorul prim, d, care apare la cea mai mica putere, p, in descompunerea in factori primi a lui n; daca exista mai multi astfel de divizori se afiseaza cel mai mic dintre ei.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=10780, atunci, in urma apelului, d=5 si p=1 (10780=2^2*5*7^2*11).",
    input_format: "Se citeste de la tastatura n.",
    output_format: "Se afiseaza d si p, separate prin spatiu.",
    constraints: "2 <= n <= 10^9",
    hints: "Descompuneti n in factori primi; retineti exponentul minim, iar la egalitate cel mai mic divizor.",
    explanation: "Se descompune n in factori primi prin trial division pana la radacina patrata; daca ramane un rest >1 dupa bucla, este un ultim divizor prim cu exponent 1. Se retine, dintre toti factorii, cel cu exponentul minim, iar la egalitate cel mai mic divizor.\n\n**Complexitate:** O(sqrt(n))",
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
    long long bestD = -1; int bestP = INT32_MAX;
    for (long long f = 2; f * f <= n; f++) {
        if (n % f == 0) {
            int e = 0;
            while (n % f == 0) { n /= f; e++; }
            if (e < bestP || (e == bestP && f < bestD)) { bestP = e; bestD = f; }
        }
    }
    if (n > 1) {
        if (1 < bestP || (1 == bestP && n < bestD)) { bestP = 1; bestD = n; }
    }
    d = bestD; p = bestP;
}
`,
    py: `def putere(n):
    best_d, best_p = -1, float("inf")
    f = 2
    while f * f <= n:
        if n % f == 0:
            e = 0
            while n % f == 0:
                n //= f
                e += 1
            if e < best_p or (e == best_p and f < best_d):
                best_p, best_d = e, f
        f += 1
    if n > 1:
        if 1 < best_p or (1 == best_p and n < best_d):
            best_p, best_d = 1, n
    return best_d, best_p
`,
    tests: ["10780", "2", "999999937", "1000000000", "1024"],
  },
  {
    slug: "bac-antrenament-2020-v13-3-2",
    subcategoryId: "antrenament-2020-v13",
    title: "Bacalaureat Antrenament 2020, Varianta 13, S3.2 - Tablou cu coloane de valori repetate k ori",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Scrieti un program C/C++ care citeste de la tastatura doua numere naturale din intervalul [2,20], n si k, si construieste in memorie un tablou bidimensional cu n*k linii si n coloane, numerotate incepand cu 1, astfel incat fiecare coloana i (i in [1,n]) memoreaza un sir crescator de termeni cu proprietatea ca primul termen este i, fiecare valoare apare in sir de exact k ori si oricare doi termeni alaturati au valori egale sau consecutive.\n\n" +
      "Programul afiseaza pe ecran tabloul construit, fiecare linie a tabloului pe cate o linie a ecranului, cu valorile aflate pe aceeasi linie separate prin cate un spatiu.\n\n" +
      "Exemplu: daca n=4 si k=3, se afiseaza pe ecran tabloul:\n1 2 3 4\n1 2 3 4\n1 2 3 4\n2 3 4 5\n2 3 4 5\n2 3 4 5\n3 4 5 6\n3 4 5 6\n3 4 5 6\n4 5 6 7\n4 5 6 7\n4 5 6 7",
    input_format: "Se citesc n si k.",
    output_format: "Se afiseaza tabloul cu n*k linii si n coloane.",
    constraints: "2 <= n, k <= 20",
    hints: "Elementul de pe linia r, coloana c (1-indexat) este c + floor((r-1)/k).",
    explanation: "Pentru fiecare linie r si coloana c, valoarea este c + floor((r-1)/k), formula care asigura ca fiecare valoare apare de exact k ori consecutiv pe coloana, crescand cu 1 la fiecare k linii.\n\n**Complexitate:** O(n^2*k)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, k; cin >> n >> k;
    for (int r = 1; r <= n * k; r++) {
        for (int c = 1; c <= n; c++) cout << (c + (r - 1) / k) << (c < n ? " " : "\\n");
    }
    return 0;
}
`,
    py: `n, k = map(int, input().split())
for r in range(1, n * k + 1):
    row = [str(c + (r - 1) // k) for c in range(1, n + 1)]
    print(" ".join(row))
`,
    tests: ["4 3", "2 2", "2 20", "20 2", "5 4"],
  },
  {
    slug: "bac-antrenament-2020-v13-3-3",
    subcategoryId: "antrenament-2020-v13",
    title: "Bacalaureat Antrenament 2020, Varianta 13, S3.3 - Termenii sirului de puteri ale lui 2",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "eficienta", "fisiere", "siruri"],
    statement:
      "Sirul de mai jos este definit astfel: f1=1, f2=2, fn=3*fn-1-2*fn-2 (unde n este un numar natural n>=3).\n1, 2, 4, 8, 16, 32....\n\n" +
      "Se citeste de la tastatura un numar natural x (x<=10^9), valoare a unui termen al sirului dat, si se cere sa se scrie in fisierul text bac.txt, in ordine descrescatoare, separati prin cate un spatiu, toti termenii sirului care sunt mai mici sau egali cu x. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca se citeste numarul 16 fisierul bac.txt contine numerele 16 8 4 2 1",
    input_format: "Se citeste x.",
    output_format: "Toti termenii sirului <= x, in ordine descrescatoare, scrisi in bac.txt.",
    constraints: "1 <= x <= 10^9",
    hints: "Sirul este 2^(n-1); genereaza direct din recurenta pana ce termenul depaseste x.",
    explanation: "Sirul dat este de fapt sirul puterilor lui 2 (fn=2^(n-1)), care creste exponential; deci exista cel mult ~30 de termeni <=10^9. Se genereaza direct din recurenta, colectand termenii <=x, apoi se scriu inversati (descrescator) in fisier.\n\n**Complexitate:** O(log x) timp si spatiu",
    io: { input_source: "stdin", input_filename: null, output_target: "file", output_filename: "bac.txt" },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long x; cin >> x;
    vector<long long> f;
    f.push_back(1);
    if (x >= 2) f.push_back(2);
    while (f.size() >= 2) {
        int k = (int)f.size();
        long long next = 3 * f[k - 1] - 2 * f[k - 2];
        if (next > x) break;
        f.push_back(next);
    }
    vector<long long> rez;
    for (long long v : f) if (v <= x) rez.push_back(v);
    freopen("bac.txt", "w", stdout);
    for (int i = (int)rez.size() - 1; i >= 0; i--) cout << rez[i] << (i > 0 ? " " : "\\n");
    return 0;
}
`,
    py: `x = int(input())
f = [1]
if x >= 2:
    f.append(2)
while len(f) >= 2:
    nxt = 3 * f[-1] - 2 * f[-2]
    if nxt > x:
        break
    f.append(nxt)
rez = [v for v in f if v <= x]
rez.reverse()
with open("bac.txt", "w") as out:
    out.write(" ".join(map(str, rez)))
    out.write("\\n")
`,
    tests: ["16", "1", "2", "1000000000", "3"],
  },
  // ===================== VARIANTA 14 (Testul 14) =====================
  {
    slug: "bac-antrenament-2020-v14-3-1",
    subcategoryId: "antrenament-2020-v14",
    title: "Bacalaureat Antrenament 2020, Varianta 14, S3.1 - Divizori pereche de paritate diferita",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "divizori"],
    statement:
      "Doua numere a si b (a<b) sunt numite divizori pereche ai unui numar natural n daca a*b=n.\n\n" +
      "Subprogramul perechi are un singur parametru, n, prin care primeste un numar natural (n in [2,10^9]). Subprogramul afiseaza pe ecran toate perechile distincte de numere naturale cu paritate diferita cu proprietatea ca sunt divizori pereche ai lui n. Fiecare pereche este afisata incadrata intre paranteze drepte, numerele din pereche fiind afisate in ordine strict crescatoare, separate printr-un spatiu, iar daca nu exista astfel de perechi, se afiseaza pe ecran mesajul nu exista. Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=12 se afiseaza pe ecran, nu neaparat in aceasta ordine, [1 12][3 4], iar daca n=9 se afiseaza pe ecran nu exista",
    input_format: "Se citeste de la tastatura n.",
    output_format: "Toate perechile [a b] (a<b, a*b=n, paritate diferita), sau mesajul 'nu exista'.",
    constraints: "2 <= n <= 10^9",
    hints: "Parcurgeti d de la 1 la radacina patrata a lui n; pentru fiecare divizor pereche (d, n/d) cu d<n/d si paritate diferita, afisati-l.",
    explanation: "Se parcurg divizorii d de la 1 la radacina patrata a lui n; pentru fiecare d care divide n, cu e=n/d, daca d<e (distincti) si au paritate diferita, se afiseaza perechea [d e].\n\n**Complexitate:** O(sqrt(n))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    perechi(n);
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
perechi(n)
`,
    cpp: `void perechi(long long n) {
    vector<pair<long long,long long>> rez;
    for (long long d = 1; d * d <= n; d++) {
        if (n % d == 0) {
            long long e = n / d;
            if (d < e && (d % 2) != (e % 2)) rez.push_back({d, e});
        }
    }
    if (rez.empty()) { cout << "nu exista\\n"; return; }
    for (auto& pr : rez) cout << "[" << pr.first << " " << pr.second << "]";
    cout << "\\n";
}
`,
    py: `def perechi(n):
    rez = []
    d = 1
    while d * d <= n:
        if n % d == 0:
            e = n // d
            if d < e and (d % 2) != (e % 2):
                rez.append((d, e))
        d += 1
    if not rez:
        print("nu exista")
    else:
        print("".join(f"[{a} {b}]" for a, b in rez))
`,
    tests: ["12", "9", "2", "1000000000", "999999937"],
  },
  {
    slug: "bac-antrenament-2020-v14-3-2",
    subcategoryId: "antrenament-2020-v14",
    title: "Bacalaureat Antrenament 2020, Varianta 14, S3.2 - Valoarea absoluta a numerelor negative",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "siruri-caractere"],
    statement:
      "Un text are cel mult 100 de caractere si este format din cuvinte si numere, separate prin cate un spatiu. Cuvintele sunt formate numai din litere ale alfabetului englez. Toate numerele sunt reale si sunt formate numai din parte intreaga sau din parte intreaga si parte fractionara, separate prin virgula (,), numerele negative fiind precedate de semnul minus (-). Cel putin unul dintre numerele reale este negativ. Scrieti un program C/C++ care citeste de la tastatura textul, pe care il transforma in memorie, inlocuind fiecare numar negativ cu valoarea sa absoluta. Programul afiseaza apoi pe ecran textul obtinut.\n\n" +
      "Exemplu: pentru textul Modul de -3,24 este 3,24 si modul de -15 este 15 se va afisa pe ecran textul: Modul de 3,24 este 3,24 si modul de 15 este 15",
    input_format: "Se citeste o linie de text.",
    output_format: "Textul cu semnul minus eliminat din fiecare numar negativ.",
    constraints: "text de cel mult 100 de caractere, cel putin un numar negativ",
    hints: "Eliminati primul caracter din orice token care incepe cu '-'.",
    explanation: "Se parcurg tokenurile textului; pentru fiecare token care incepe cu caracterul '-' (numerele negative), se elimina acest prim caracter, obtinand valoarea absoluta. Restul tokenurilor raman neschimbate.\n\n**Complexitate:** O(lungimea textului)",
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
    while (ss >> w) {
        if (w[0] == '-') w = w.substr(1);
        rez.push_back(w);
    }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `words = input().split()
rez = [w[1:] if w[0] == '-' else w for w in words]
print(" ".join(rez))
`,
    tests: [
      "Modul de -3,24 este 3,24 si modul de -15 este 15",
      "-1 -2 -3",
      "a -5 b",
      "-100",
      "x -1,5 y -2 z",
    ],
  },
  {
    slug: "bac-antrenament-2020-v14-3-3",
    subcategoryId: "antrenament-2020-v14",
    title: "Bacalaureat Antrenament 2020, Varianta 14, S3.3 - Cele mai mici trei numere x20",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.in contine un sir de numere naturale distincte, din intervalul [1,10^9]. Numerele din sir sunt separate prin cate un spatiu si cel putin trei dintre ele au penultima cifra 2 si ultima cifra 0.\n\n" +
      "Se cere sa se afiseze pe ecran cele mai mici trei numere din sir cu proprietatea ca au penultima cifra 2 si ultima cifra 0. Numerele determinate sunt afisate in ordine crescatoare, separate prin cate un spatiu. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine numerele 9731 50 112 20 8 16 8520 3 2520 1520 pe ecran se vor afisa, in aceasta ordine, numerele: 20 1520 2520",
    input_format: "Fisierul bac.in: un sir de numere naturale distincte, separate prin spatiu.",
    output_format: "Cele mai mici trei numere cu proprietatea num%100==20, in ordine crescatoare.",
    constraints: "cel putin 3 numere cu proprietatea ceruta",
    hints: "Parcurgeti sirul o singura data, mentinand cele mai mici 3 valori cu num%100==20 intalnite pana la momentul curent.",
    explanation: "Se parcurge sirul o singura data, verificand pentru fiecare numar daca num%100==20; daca da, se actualizeaza (daca este cazul) cele mai mici 3 astfel de valori retinute pana in acel moment. La final, cele 3 valori se afiseaza in ordine crescatoare.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.in", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.in", "r", stdin);
    long long v;
    long long SENTINEL = 2000000000000LL;
    long long a = SENTINEL, b = SENTINEL, c = SENTINEL;
    while (cin >> v) {
        if (v % 100 == 20) {
            if (v < a) { c = b; b = a; a = v; }
            else if (v < b) { c = b; b = v; }
            else if (v < c) { c = v; }
        }
    }
    cout << a << " " << b << " " << c << "\\n";
    return 0;
}
`,
    py: `INF = float("inf")
a, b, c = INF, INF, INF
with open("bac.in") as f:
    data = f.read().split()
for tok in data:
    v = int(tok)
    if v % 100 == 20:
        if v < a:
            c, b, a = b, a, v
        elif v < b:
            c, b = b, v
        elif v < c:
            c = v
print(a, b, c)
`,
    tests: [
      "9731 50 112 20 8 16 8520 3 2520 1520",
      "20 120 220",
      "1000000020 20 120",
      "220 20 120 320 420",
      (() => {
        const parts = [];
        for (let i = 20000; i >= 1; i--) parts.push(String(100 + i * 100 + 20));
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== VARIANTA 15 (Testul 15) =====================
  {
    slug: "bac-antrenament-2020-v15-3-1",
    subcategoryId: "antrenament-2020-v15",
    title: "Bacalaureat Antrenament 2020, Varianta 15, S3.1 - Cel mai mare divizor prim",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "divizori"],
    statement:
      "Subprogramul divPrimMax are doi parametri:\n" +
      "- n, prin care primeste un numar natural (n in [2,10^9]);\n" +
      "- p, prin care furnizeaza cel mai mare divizor prim al lui n.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=2000, in urma apelului p=5, deoarece 2000=2^4*5^3.",
    input_format: "Se citeste de la tastatura n.",
    output_format: "Cel mai mare divizor prim al lui n.",
    constraints: "2 <= n <= 10^9",
    hints: "Factorizati n; nu uitati ca, daca dupa trial division mai ramane un factor >1, acesta este cel mai mare divizor prim (deoarece este mai mare decat radacina patrata a valorii originale ramase).",
    explanation: "Se factorizeaza n prin trial division pana la radacina patrata, retinand cel mai mare prim gasit. Daca dupa bucla mai ramane un rest >1, acesta este neaparat cel mai mare divizor prim (fiind fie n insusi daca e prim, fie un factor prim mai mare decat toti cei gasiti prin trial division).\n\n**Complexitate:** O(sqrt(n))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    long long p;
    divPrimMax(n, p);
    cout << p << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(divPrimMax(n))
`,
    cpp: `void divPrimMax(long long n, long long& p) {
    p = 1;
    for (long long f = 2; f * f <= n; f++) {
        while (n % f == 0) { p = f; n /= f; }
    }
    if (n > 1) p = n;
}
`,
    py: `def divPrimMax(n):
    p = 1
    f = 2
    while f * f <= n:
        while n % f == 0:
            p = f
            n //= f
        f += 1
    if n > 1:
        p = n
    return p
`,
    tests: ["2000", "2", "999999937", "1000000000", "1024"],
  },
  {
    slug: "bac-antrenament-2020-v15-3-2",
    subcategoryId: "antrenament-2020-v15",
    title: "Bacalaureat Antrenament 2020, Varianta 15, S3.2 - Cuvinte cu vocale egale cu consoane",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "siruri-caractere"],
    statement:
      "Intr-un text cu cel mult 100 de caractere, cuvintele sunt formate din litere mici ale alfabetului englez si sunt separate prin cate un spatiu. Scrieti un program C/C++ care citeste de la tastatura un text de tipul mentionat si afiseaza pe ecran numarul de cuvinte ale sale formate dintr-un numar egal de vocale si consoane. Se considera vocale literele din multimea a, e, i, o, u.\n\n" +
      "Exemplu: pentru textul cuvantul consoane are un numar de patru vocale si patru consoane se afiseaza pe ecran 6.",
    input_format: "Se citeste o linie de text.",
    output_format: "Numarul de cuvinte cu vocale==consoane.",
    constraints: "text de cel mult 100 de caractere",
    hints: "Pentru fiecare cuvant, numarati vocalele si consoanele si comparati.",
    explanation: "Se numara, pentru fiecare cuvant, vocalele si consoanele; se numara cuvintele pentru care aceste doua numere sunt egale.\n\n**Complexitate:** O(lungimea textului)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
bool isVowelV15(char c) { return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u'; }
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    string w;
    int cnt = 0;
    while (ss >> w) {
        int v = 0, c = 0;
        for (char ch : w) if (isVowelV15(ch)) v++; else c++;
        if (v == c) cnt++;
    }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `def is_vowel_v15(c):
    return c in "aeiou"

words = input().split()
cnt = 0
for w in words:
    v = sum(1 for ch in w if is_vowel_v15(ch))
    c = len(w) - v
    if v == c:
        cnt += 1
print(cnt)
`,
    tests: [
      "cuvantul consoane are un numar de patru vocale si patru consoane",
      "aa bb",
      "ab cd",
      "a bb ccc dddd",
      "test",
    ],
  },
  {
    slug: "bac-antrenament-2020-v15-3-3",
    subcategoryId: "antrenament-2020-v15",
    title: "Bacalaureat Antrenament 2020, Varianta 15, S3.3 - Numere de 7 cifre cu tipar dat, crescator",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Se citesc de la tastatura doua numere naturale din intervalul [1,81], p1 si p2, si se cere scrierea in fisierul bac.out a tuturor numerelor naturale cu exact 7 cifre, pentru care produsul primelor doua cifre este egal cu p1, cele trei cifre din mijloc sunt egale intre ele, iar produsul ultimelor doua cifre este egal cu p2. Numerele apar in fisier in ordine strict crescatoare, fiecare pe cate o linie. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca p1=12, iar p2=8, atunci 2633324 si 3400018 sunt doua dintre cele 160 de numere cu proprietatea ceruta (2*6=3*4=12 si 2*4=1*8=8).",
    input_format: "Se citesc p1 si p2.",
    output_format: "Se scriu in fisierul bac.out toate numerele de 7 cifre cu tiparul cerut, in ordine crescatoare.",
    constraints: "1 <= p1, p2 <= 81",
    hints: "Enumerati toate perechile (d1,d2) cu d1 in [1,9] si d1*d2=p1, toate perechile (d6,d7) cu d6,d7 in [0,9] si d6*d7=p2, si toate valorile m in [0,9] pentru mijloc; combinati.",
    explanation: "Se enumera toate perechile (d1,d2) cu d1 in [1,9] si d1*d2=p1, toate perechile (d6,d7) cu d6,d7 in [0,9] si d6*d7=p2, si toate valorile m in [0,9] pentru cele trei cifre din mijloc. Se combina fiecare tripleta pentru a forma numarul, se colecteaza, se sorteaza crescator si se scriu in fisier.\n\n**Complexitate:** O(1) - spatiul de cautare este marginit de cifre",
    io: { input_source: "stdin", input_filename: null, output_target: "file", output_filename: "bac.out" },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int p1, p2; cin >> p1 >> p2;
    vector<pair<int,int>> pair1, pair2;
    for (int d1 = 1; d1 <= 9; d1++) for (int d2 = 0; d2 <= 9; d2++) if (d1 * d2 == p1) pair1.push_back({d1, d2});
    for (int d6 = 0; d6 <= 9; d6++) for (int d7 = 0; d7 <= 9; d7++) if (d6 * d7 == p2) pair2.push_back({d6, d7});
    vector<long long> rez;
    for (auto& a : pair1) for (int m = 0; m <= 9; m++) for (auto& b : pair2) {
        long long num = a.first * 1000000LL + a.second * 100000LL + m * 11100LL + b.first * 10 + b.second;
        rez.push_back(num);
    }
    sort(rez.begin(), rez.end());
    freopen("bac.out", "w", stdout);
    for (long long v : rez) cout << v << "\\n";
    return 0;
}
`,
    py: `p1, p2 = map(int, input().split())
pair1 = [(d1, d2) for d1 in range(1, 10) for d2 in range(10) if d1 * d2 == p1]
pair2 = [(d6, d7) for d6 in range(10) for d7 in range(10) if d6 * d7 == p2]
rez = []
for a1, a2 in pair1:
    for m in range(10):
        for b1, b2 in pair2:
            num = a1 * 1000000 + a2 * 100000 + m * 11100 + b1 * 10 + b2
            rez.append(num)
rez.sort()
with open("bac.out", "w") as out:
    for v in rez:
        out.write(f"{v}\\n")
`,
    tests: ["12 8", "1 1", "81 81", "9 9", "16 25"],
  },
  // ===================== VARIANTA 16 (Testul 16) =====================
  {
    slug: "bac-antrenament-2020-v16-3-1",
    subcategoryId: "antrenament-2020-v16",
    title: "Bacalaureat Antrenament 2020, Varianta 16, S3.1 - Numarul divizorilor primi la putere impara",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "divizori"],
    statement:
      "Subprogramul nrDivPrimi are un singur parametru, n, prin care primeste un numar natural (n in [2,10^9]). Subprogramul returneaza numarul divizorilor care, in descompunerea in factori primi a lui n, apar la o putere impara.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=9000, subprogramul returneaza 2 (9000=2^3*3^2*5^3).",
    input_format: "Se citeste de la tastatura n.",
    output_format: "Numarul de factori primi cu exponent impar in descompunerea lui n.",
    constraints: "2 <= n <= 10^9",
    hints: "Factorizati n; numarati cate exponente sunt impare (inclusiv exponentul 1 pentru un eventual factor ramas dupa trial division).",
    explanation: "Se factorizeaza n prin trial division; pentru fiecare factor prim gasit, daca exponentul sau este impar, se incrementeaza contorul. Daca dupa bucla ramane un rest >1, acesta are exponent 1 (impar), deci se numara si el.\n\n**Complexitate:** O(sqrt(n))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    cout << nrDivPrimi(n) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(nrDivPrimi(n))
`,
    cpp: `int nrDivPrimi(long long n) {
    int cnt = 0;
    for (long long f = 2; f * f <= n; f++) {
        if (n % f == 0) {
            int e = 0;
            while (n % f == 0) { n /= f; e++; }
            if (e % 2 == 1) cnt++;
        }
    }
    if (n > 1) cnt++;
    return cnt;
}
`,
    py: `def nrDivPrimi(n):
    cnt = 0
    f = 2
    while f * f <= n:
        if n % f == 0:
            e = 0
            while n % f == 0:
                n //= f
                e += 1
            if e % 2 == 1:
                cnt += 1
        f += 1
    if n > 1:
        cnt += 1
    return cnt
`,
    tests: ["9000", "2", "4", "999999937", "1000000000"],
  },
  {
    slug: "bac-antrenament-2020-v16-3-2",
    subcategoryId: "antrenament-2020-v16",
    title: "Bacalaureat Antrenament 2020, Varianta 16, S3.2 - Tablou cu patrate impare descrescatoare",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Scrieti un program C/C++ care citeste de la tastatura doua numere naturale din intervalul [2,100], n si m, si construieste in memorie un tablou bidimensional cu n linii si m coloane, cu proprietatea ca parcurgandu-l linie cu linie de sus in jos si fiecare linie de la stanga la dreapta, se obtine sirul primelor n*m patrate perfecte impare, ordonat strict descrescator.\n\n" +
      "Elementele tabloului obtinut se afiseaza pe ecran, fiecare linie a tabloului pe cate o linie a ecranului, valorile de pe aceeasi linie fiind separate prin cate un spatiu.\n\n" +
      "Exemplu: pentru n=2, m=3 se obtine tabloul:\n121 81 49\n25 9 1",
    input_format: "Se citesc n si m.",
    output_format: "Se afiseaza tabloul cu n linii si m coloane.",
    constraints: "2 <= n, m <= 100",
    hints: "Pentru pozitia liniara idx (0-indexat, parcurgere linie cu linie), valoarea este (2*(n*m-idx)-1)^2.",
    explanation: "Se numeroteaza pozitiile tabloului linear, de la 0 (parcurgere linie cu linie, stanga-dreapta). Pentru pozitia idx, valoarea este (2*(n*m-idx)-1)^2, formula care produce direct primele n*m patrate impare in ordine strict descrescatoare.\n\n**Complexitate:** O(n*m)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n, m; cin >> n >> m;
    long long total = n * m;
    long long idx = 0;
    for (long long i = 0; i < n; i++) {
        for (long long j = 0; j < m; j++) {
            long long odd = 2 * (total - idx) - 1;
            cout << (odd * odd) << (j + 1 < m ? " " : "\\n");
            idx++;
        }
    }
    return 0;
}
`,
    py: `n, m = map(int, input().split())
total = n * m
idx = 0
for i in range(n):
    row = []
    for j in range(m):
        odd = 2 * (total - idx) - 1
        row.append(str(odd * odd))
        idx += 1
    print(" ".join(row))
`,
    tests: ["2 3", "2 2", "3 3", "5 2", "2 5"],
  },
  {
    slug: "bac-antrenament-2020-v16-3-3",
    subcategoryId: "antrenament-2020-v16",
    title: "Bacalaureat Antrenament 2020, Varianta 16, S3.3 - Cel mai lung sir alternant de paritate din reuniune",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.in contine numere naturale: pe prima linie doua numere din intervalul [1,10^6], m si n, pe a doua linie un sir de m numere din intervalul [1,10^9], iar pe a treia linie un sir de n numere din intervalul [1,10^9]. Numerele aflate pe aceeasi linie a fisierului sunt separate prin cate un spatiu, si ambele siruri sunt ordonate crescator.\n\n" +
      "Se cere sa se afiseze pe ecran, in ordine strict crescatoare, un sir format dintr-un numar maxim de termeni care apartin cel putin unuia dintre cele doua siruri, astfel incat oricare doua elemente aflate pe pozitii consecutive sa fie de paritate diferita. Numerele afisate sunt separate prin cate un spatiu. Proiectati un algoritm eficient din punctul de vedere al timpului de executare.\n\n" +
      "Exemplu: daca fisierul are continutul m=8, n=5, sirul1=2 4 5 8 8 11 14 14, sirul2=3 4 5 5 10, se afiseaza pe ecran 2 3 4 5 8 11 14 sau 2 3 4 5 10 11 14",
    input_format: "Fisierul bac.in: m n pe prima linie, sirul1 pe a doua, sirul2 pe a treia.",
    output_format: "Cel mai lung sir alternant de paritate obtinut din reuniunea celor doua siruri, crescator.",
    constraints: "1 <= m, n <= 10^6",
    hints: "Interclasati cele doua siruri sortate intr-unul singur, eliminati duplicatele, apoi parcurgeti-l greedy: pastrati un element doar daca paritatea sa difera de a ultimului pastrat.",
    explanation: "Se interclaseaza cele doua siruri deja sortate intr-un singur sir sortat, eliminand valorile duplicate (reuniunea, ca multime). Apoi se parcurge acest sir sortat o singura data cu o strategie greedy: se pastreaza un element doar daca paritatea sa este diferita de paritatea ultimului element pastrat (primul element se pastreaza intotdeauna). Aceasta strategie produce cel mai lung subsir alternant de paritate posibil dintr-un sir deja sortat.\n\n**Complexitate:** O(m+n) timp",
    io: { input_source: "file", input_filename: "bac.in", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.in", "r", stdin);
    int m, n; cin >> m >> n;
    vector<long long> a(m), b(n);
    for (auto& x : a) cin >> x;
    for (auto& x : b) cin >> x;
    vector<long long> merged;
    int i = 0, j = 0;
    while (i < m && j < n) {
        if (a[i] <= b[j]) merged.push_back(a[i++]);
        else merged.push_back(b[j++]);
    }
    while (i < m) merged.push_back(a[i++]);
    while (j < n) merged.push_back(b[j++]);
    vector<long long> distinctVals;
    for (long long v : merged) if (distinctVals.empty() || distinctVals.back() != v) distinctVals.push_back(v);
    vector<long long> rez;
    for (long long v : distinctVals) {
        if (rez.empty() || (rez.back() % 2) != (v % 2)) rez.push_back(v);
    }
    for (size_t k = 0; k < rez.size(); k++) cout << rez[k] << (k + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `with open("bac.in") as f:
    m, n = map(int, f.readline().split())
    a = list(map(int, f.readline().split()))
    b = list(map(int, f.readline().split()))
merged = []
i = j = 0
while i < m and j < n:
    if a[i] <= b[j]:
        merged.append(a[i]); i += 1
    else:
        merged.append(b[j]); j += 1
merged.extend(a[i:])
merged.extend(b[j:])
distinct_vals = []
for v in merged:
    if not distinct_vals or distinct_vals[-1] != v:
        distinct_vals.append(v)
rez = []
for v in distinct_vals:
    if not rez or (rez[-1] % 2) != (v % 2):
        rez.append(v)
print(" ".join(map(str, rez)))
`,
    tests: [
      "8 5\n2 4 5 8 8 11 14 14\n3 4 5 5 10",
      "1 1\n2\n3",
      "1 1\n2\n4",
      "3 3\n1 3 5\n2 4 6",
      (() => {
        const a = [];
        const b = [];
        for (let i = 0; i < 5000; i++) a.push(String(i * 2));
        for (let i = 0; i < 5000; i++) b.push(String(i * 2 + 1));
        return `5000 5000\n${a.join(" ")}\n${b.join(" ")}`;
      })(),
    ],
  },
];

module.exports = problems;
