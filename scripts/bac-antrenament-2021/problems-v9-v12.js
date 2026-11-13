const problems = [
  // ===================== VARIANTA 9 (Testul 9) =====================
  {
    slug: "bac-antrenament-2021-v9-3-1",
    subcategoryId: "antrenament-2021-v9",
    title: "Bacalaureat Antrenament 2021, Varianta 9, S3.1 - Numere divizibile cu k si terminate in k",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "divizori"],
    statement:
      "Subprogramul divizor are patru parametri:\n" +
      "- a, b si k, prin care primeste cate un numar natural (a in [0,1000], b in [a,1000], k in [1,9]);\n" +
      "- nr, prin care furnizeaza numarul de valori naturale din intervalul [a,b] care sunt divizibile cu k si au ultima cifra egala cu k.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca a=3, b=50 si k=4, in urma apelului, nr=3 (pentru numerele 4, 24, 44).",
    input_format: "Se citesc a, b si k.",
    output_format: "Numarul valorilor din [a,b] divizibile cu k si cu ultima cifra k.",
    constraints: "0 <= a <= b <= 1000, 1 <= k <= 9",
    hints: "Parcurgeti v de la a la b, verificand v%k==0 si v%10==k.",
    explanation: "Se parcurg valorile v de la a la b, numarand cate dintre ele sunt simultan divizibile cu k si au ultima cifra egala cu k.\n\n**Complexitate:** O(b-a)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long a, b, k; cin >> a >> b >> k;
    cout << divizor(a, b, k) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

a, b, k = map(int, input().split())
print(divizor(a, b, k))
`,
    cpp: `int divizor(long long a, long long b, long long k) {
    int nr = 0;
    for (long long v = a; v <= b; v++) if (v % k == 0 && v % 10 == k) nr++;
    return nr;
}
`,
    py: `def divizor(a, b, k):
    nr = 0
    for v in range(a, b + 1):
        if v % k == 0 and v % 10 == k:
            nr += 1
    return nr
`,
    tests: ["3 50 4", "0 9 1", "1 1000 9", "100 200 5", "1 1 1"],
  },
  {
    slug: "bac-antrenament-2021-v9-3-2",
    subcategoryId: "antrenament-2021-v9",
    title: "Bacalaureat Antrenament 2021, Varianta 9, S3.2 - Cuvinte cu o singura vocala distincta",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "siruri-caractere"],
    statement:
      "Intr-un text cu cel mult 100 de caractere, cuvintele sunt formate din litere mici ale alfabetului englez si sunt separate prin cate un spatiu. Scrieti un program C/C++ care citeste de la tastatura un text de tipul precizat si afiseaza pe ecran, pe linii separate, toate cuvintele sale care contin o singura vocala distincta. Daca nu exista niciun astfel de cuvant, se afiseaza pe ecran mesajul nu exista. Se considera vocale literele din multimea a, e, i, o, u.\n\n" +
      "Exemplu: pentru textul a plantat cinci lalele visinii sau rosii se afiseaza pe ecran, nu neaparat in aceasta ordine, cuvintele a, plantat, cinci, visinii",
    input_format: "Se citeste o linie de text.",
    output_format: "Cuvintele care contin o singura vocala distincta, cate unul pe linie, sau mesajul 'nu exista'.",
    constraints: "text de cel mult 100 de caractere",
    hints: "Pentru fiecare cuvant, colectati multimea vocalelor distincte prezente; includeti cuvantul daca aceasta multime are exact 1 element.",
    explanation: "Pentru fiecare cuvant se colecteaza multimea vocalelor distincte prezente in el; daca aceasta multime are exact un element, cuvantul se afiseaza pe o linie separata.\n\n**Complexitate:** O(lungimea textului)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
bool isVowelV9(char c) { return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u'; }
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    string w;
    bool any = false;
    while (ss >> w) {
        set<char> vs;
        for (char c : w) if (isVowelV9(c)) vs.insert(c);
        if (vs.size() == 1) { cout << w << "\\n"; any = true; }
    }
    if (!any) cout << "nu exista\\n";
    return 0;
}
`,
    py: `def is_vowel_v9(c):
    return c in "aeiou"

words = input().split()
any_found = False
out = []
for w in words:
    vs = set(c for c in w if is_vowel_v9(c))
    if len(vs) == 1:
        out.append(w)
        any_found = True
print("nu exista" if not any_found else "\\n".join(out))
`,
    tests: [
      "a plantat cinci lalele visinii sau rosii",
      "aeiou",
      "bcdfg",
      "banana kayak",
      "elephant",
    ],
  },
  {
    slug: "bac-antrenament-2021-v9-3-3",
    subcategoryId: "antrenament-2021-v9",
    title: "Bacalaureat Antrenament 2021, Varianta 9, S3.3 - Cel mai mare numar din toate cifrele",
    difficulty: "hard",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul numere.txt contine cel mult 10^5 numere naturale din intervalul [1,10^9], cate unul pe fiecare linie. Se cere sa se afiseze pe ecran cel mai mare numar care se poate forma cu toate cifrele care apar in numerele din fisier.\n\n" +
      "Proiectati un algoritm eficient din punctul de vedere al timpului de executare.\n\n" +
      "Exemplu: daca fisierul are continutul 263, 39628, 79, 887308, se afiseaza 9988887766333220",
    input_format: "Fisierul numere.txt: cate un numar natural pe fiecare linie.",
    output_format: "Cel mai mare numar obtinut prin rearanjarea descrescatoare a tuturor cifrelor din fisier.",
    constraints: "cel mult 10^5 numere",
    hints: "Numarati aparitiile fiecarei cifre (0-9) in toate numerele din fisier, apoi afisati cifrele de la 9 la 0, fiecare repetata de atatea ori cate aparitii are.",
    explanation: "Se parcurge fisierul o singura data, numarand aparitiile fiecarei cifre (0-9) in toate numerele intalnite (tablou cnt[10]). Cel mai mare numar posibil se obtine afisand cifrele in ordine descrescatoare (de la 9 la 0), fiecare repetata de cnt[cifra] ori.\n\n**Complexitate:** O(total cifre) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "numere.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("numere.txt", "r", stdin);
    long long cnt[10] = {0};
    string line;
    while (getline(cin, line)) {
        for (char c : line) if (isdigit((unsigned char)c)) cnt[c - '0']++;
    }
    string rez = "";
    for (int d = 9; d >= 0; d--) rez += string(cnt[d], '0' + d);
    cout << rez << "\\n";
    return 0;
}
`,
    py: `cnt = [0] * 10
with open("numere.txt") as f:
    for line in f:
        for c in line.strip():
            if c.isdigit():
                cnt[int(c)] += 1
rez = "".join(str(d) * cnt[d] for d in range(9, -1, -1))
print(rez)
`,
    tests: [
      "263\n39628\n79\n887308",
      "1",
      "111\n222",
      "9\n8\n7",
      (() => {
        const lines = [];
        for (let i = 0; i < 20000; i++) lines.push(String(100 + (i % 900)));
        return lines.join("\n");
      })(),
    ],
  },
  // ===================== VARIANTA 10 (Testul 10) =====================
  {
    slug: "bac-antrenament-2021-v10-3-1",
    subcategoryId: "antrenament-2021-v10",
    title: "Bacalaureat Antrenament 2021, Varianta 10, S3.1 - Numere in armonie",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "divizori"],
    statement:
      "Numerele naturale x si y sunt numite in armonie daca suma lor apartine intervalului deschis definit de suma divizorilor lui x, respectiv suma divizorilor lui y.\n\n" +
      "Subprogramul armonie are doi parametri, x si y, prin care primeste cate un numar natural din intervalul [1,10^6]. Subprogramul returneaza valoarea 1, daca x si y sunt in armonie, sau valoarea 0 in caz contrar.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca x=8, iar y=12 subprogramul returneaza 1 (S(8)=1+2+4+8=15, S(12)=1+2+3+4+6+12=28, iar 8+12=20 apartine intervalului deschis (15,28)), iar daca x=8 si y=13, subprogramul returneaza 0 (S(8)=15, S(13)=1+13=14, iar 8+13=21 nu apartine intervalului deschis (14,15)).",
    input_format: "Se citesc x si y.",
    output_format: "1 daca x+y este strict intre S(x) si S(y), altfel 0.",
    constraints: "1 <= x, y <= 10^6",
    hints: "Calculati S(x) si S(y) (suma tuturor divizorilor) prin trial division; verificati daca x+y este strict intre minimul si maximul celor doua sume.",
    explanation: "Se calculeaza S(x) si S(y), sumele tuturor divizorilor lui x, respectiv y (prin trial division). Se verifica daca x+y este strict cuprins intre min(S(x),S(y)) si max(S(x),S(y)).\n\n**Complexitate:** O(sqrt(x)+sqrt(y))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

long long sumDivV10(long long v) {
    long long s = 0;
    for (long long d = 1; d * d <= v; d++) {
        if (v % d == 0) { s += d; long long e = v / d; if (e != d) s += e; }
    }
    return s;
}

__USER_CODE__

int main() {
    long long x, y; cin >> x >> y;
    cout << armonie(x, y) << "\\n";
    return 0;
}
`,
    function_template_python: `def sum_div_v10(v):
    s = 0
    d = 1
    while d * d <= v:
        if v % d == 0:
            s += d
            e = v // d
            if e != d:
                s += e
        d += 1
    return s

__USER_CODE__

x, y = map(int, input().split())
print(armonie(x, y))
`,
    cpp: `int armonie(long long x, long long y) {
    long long sx = sumDivV10(x), sy = sumDivV10(y);
    long long lo = min(sx, sy), hi = max(sx, sy);
    long long s = x + y;
    return (s > lo && s < hi) ? 1 : 0;
}
`,
    py: `def armonie(x, y):
    sx, sy = sum_div_v10(x), sum_div_v10(y)
    lo, hi = min(sx, sy), max(sx, sy)
    s = x + y
    return 1 if lo < s < hi else 0
`,
    tests: ["8 12", "8 13", "1 1", "1000000 1", "6 6"],
  },
  {
    slug: "bac-antrenament-2021-v10-3-2",
    subcategoryId: "antrenament-2021-v10",
    title: "Bacalaureat Antrenament 2021, Varianta 10, S3.2 - Valori care filtreaza doua siruri",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "O valoare filtreaza doua siruri daca exista doi termeni care au acea valoare, unul fiind in primul sir, iar celalalt in al doilea sir.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura numere naturale din intervalul [2,20]: m, n si elementele unui tablou bidimensional cu m linii si n coloane, cu proprietatea ca nu exista doua elemente egale situate pe aceeasi linie sau pe aceeasi coloana. Programul afiseaza pe ecran valorile care pot filtra sirul format din primele n-1 elemente de pe prima linie, respectiv sirul format din ultimele m-1 elemente ale ultimei coloane a tabloului. Valorile sunt afisate intr-o ordine oarecare, separate prin cate un spatiu, sau mesajul nu exista, daca nu exista astfel de valori.\n\n" +
      "Exemplu: pentru m=5, n=4 si tabloul\n4 5 7 2\n2 7 3 6\n7 6 4 0\n6 9 8 7\n8 0 5 4\nse afiseaza pe ecran, nu neaparat in aceasta ordine, numerele 4 7",
    input_format: "Se citesc m, n, apoi elementele tabloului.",
    output_format: "Valorile comune primelor n-1 elemente ale liniei 1 si ultimelor m-1 elemente ale coloanei n, sau mesajul 'nu exista'.",
    constraints: "2 <= m, n <= 20",
    hints: "Colectati primele n-1 elemente ale liniei 1 intr-o multime, ultimele m-1 elemente ale coloanei n in alta multime, si afisati intersectia.",
    explanation: "Se colecteaza intr-o multime primele n-1 elemente ale liniei 1 (coloanele 1 la n-1) si intr-o alta multime ultimele m-1 elemente ale coloanei n (liniile 2 la m). Se afiseaza elementele comune celor doua multimi, sau mesajul cerut daca intersectia este vida.\n\n**Complexitate:** O(m+n)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int m, n; cin >> m >> n;
    vector<vector<int>> a(m + 1, vector<int>(n + 1));
    for (int i = 1; i <= m; i++) for (int j = 1; j <= n; j++) cin >> a[i][j];
    set<int> s1, s2;
    for (int j = 1; j <= n - 1; j++) s1.insert(a[1][j]);
    for (int i = 2; i <= m; i++) s2.insert(a[i][n]);
    vector<int> rez;
    for (int v : s1) if (s2.count(v)) rez.push_back(v);
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
s1 = set(a[1][j] for j in range(1, n))
s2 = set(a[i][n] for i in range(2, m + 1))
rez = sorted(s1 & s2)
print("nu exista" if not rez else " ".join(map(str, rez)))
`,
    tests: [
      "5 4\n4 5 7 2\n2 7 3 6\n7 6 4 0\n6 9 8 7\n8 0 5 4",
      "2 2\n1 2\n3 1",
      "2 2\n1 2\n3 4",
      "3 3\n1 2 3\n4 5 6\n7 8 2",
      "2 3\n5 6 7\n1 2 5",
    ],
  },
  {
    slug: "bac-antrenament-2021-v10-3-3",
    subcategoryId: "antrenament-2021-v10",
    title: "Bacalaureat Antrenament 2021, Varianta 10, S3.3 - Cea mai mica pozitie in sirul sortat crescator",
    difficulty: "hard",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.txt contine un sir de cel mult 10^5 numere naturale din intervalul [1,10^9], separate prin cate un spatiu.\n\n" +
      "Se cere sa se afiseze pe ecran cea mai mica pozitie pe care ar putea-o ocupa primul termen al sirului aflat in fisier in sirul format cu aceleasi valori, ordonat crescator. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine numerele 15 7 15 17 6 4 se afiseaza pe ecran 4 (15 se afla pe a patra si pe a cincea pozitie in sirul 4, 6, 7, 15, 15, 17).",
    input_format: "Fisierul bac.txt: un sir de numere naturale, separate prin spatiu.",
    output_format: "Cea mai mica pozitie posibila a primului termen in sirul sortat crescator.",
    constraints: "cel mult 10^5 termeni",
    hints: "Numarati cate valori din intreg sirul sunt STRICT mai mici decat primul termen; raspunsul este acest numar + 1.",
    explanation: "Se citeste primul termen al sirului. Se parcurge apoi intregul sir (o singura trecere), numarand cate valori sunt strict mai mici decat primul termen. Cea mai mica pozitie posibila a primului termen in sirul sortat crescator este acest numar + 1.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    long long first; cin >> first;
    long long v, cntLess = 0;
    while (cin >> v) if (v < first) cntLess++;
    cout << (cntLess + 1) << "\\n";
    return 0;
}
`,
    py: `with open("bac.txt") as f:
    data = list(map(int, f.read().split()))
first = data[0]
cnt_less = sum(1 for v in data[1:] if v < first)
print(cnt_less + 1)
`,
    tests: [
      "15 7 15 17 6 4",
      "5",
      "5 5 5",
      "1 2 3 4 5",
      (() => {
        const parts = ["500"];
        for (let i = 0; i < 20000; i++) parts.push(String(i % 1000));
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== VARIANTA 11 (Testul 11) =====================
  {
    slug: "bac-antrenament-2021-v11-3-1",
    subcategoryId: "antrenament-2021-v11",
    title: "Bacalaureat Antrenament 2021, Varianta 11, S3.1 - Numere impar-oglindite",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "cifre"],
    statement:
      "Doua numere se numesc oglindite daca fiecare se obtine din celalalt, prin parcurgerea cifrelor acestuia de la dreapta la stanga. Doua numere se numesc impar-oglindite daca numerele obtinute din acestea, prin indepartarea tuturor cifrelor lor pare, sunt oglindite.\n\n" +
      "Subprogramul imog are trei parametri:\n" +
      "- x si y, prin care primeste cate un numar natural din intervalul [0,10^9];\n" +
      "- rez, prin care furnizeaza valoarea 1 daca x si y sunt impar-oglindite sau valoarea 0 in caz contrar.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca x=523 si y=84356, dupa apel rez=1, iar daca x=523 si y=84536 sau x=523 si y=84576 sau x=40 si y=86, dupa apel rez=0.",
    input_format: "Se citesc x si y.",
    output_format: "Se afiseaza rez: 1 daca x si y sunt impar-oglindite, altfel 0.",
    constraints: "0 <= x, y <= 10^9",
    hints: "Din fiecare numar pastrati doar cifrele impare (in ordinea lor originala); apoi verificati daca sirul obtinut din x este exact inversul sirului obtinut din y. Daca oricare sir este vid, raspunsul este 0.",
    explanation: "Pentru fiecare numar se construieste sirul cifrelor sale impare, in ordinea aparitiei. Daca oricare dintre cele doua siruri rezultate este vid, numerele nu pot fi impar-oglindite (raspuns 0). Altfel, se verifica daca sirul obtinut din x, citit invers, este identic cu sirul obtinut din y.\n\n**Complexitate:** O(numar de cifre)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long x, y; cin >> x >> y;
    int rez;
    imog(x, y, rez);
    cout << rez << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

x, y = map(int, input().split())
print(imog(x, y))
`,
    cpp: `string filteredOddV11(long long v) {
    string s = to_string(v);
    string r = "";
    for (char c : s) if ((c - '0') % 2 == 1) r += c;
    return r;
}
void imog(long long x, long long y, int& rez) {
    string fx = filteredOddV11(x), fy = filteredOddV11(y);
    if (fx.empty() || fy.empty()) { rez = 0; return; }
    string rfx = fx;
    reverse(rfx.begin(), rfx.end());
    rez = (rfx == fy) ? 1 : 0;
}
`,
    py: `def filtered_odd_v11(v):
    return "".join(c for c in str(v) if int(c) % 2 == 1)

def imog(x, y):
    fx, fy = filtered_odd_v11(x), filtered_odd_v11(y)
    if not fx or not fy:
        return 0
    return 1 if fx[::-1] == fy else 0
`,
    tests: ["523 84356", "523 84536", "523 84576", "40 86", "111 111"],
  },
  {
    slug: "bac-antrenament-2021-v11-3-2",
    subcategoryId: "antrenament-2021-v11",
    title: "Bacalaureat Antrenament 2021, Varianta 11, S3.2 - Interschimbarea liniei k cu coloana k",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Scrieti un program C/C++ care citeste de la tastatura numere naturale: n (n in [2,20]), k (k in [2,n]) si n*n numere din intervalul [0,10^9], elemente ale unui tablou bidimensional cu n linii si n coloane. Programul transforma tabloul in memorie, interschimband sirul elementelor situate pe linia a k-a, in stanga diagonalei principale (parcurse de la stanga la dreapta), cu sirul elementelor situate pe coloana a k-a, deasupra diagonalei principale (parcurse de sus in jos). Elementele tabloului obtinut sunt afisate pe ecran, fiecare linie pe cate o linie a ecranului, cu elementele fiecarei linii separate prin cate un spatiu.\n\n" +
      "Exemplu: pentru n=5, k=4 si tabloul\n2 4 3 5 6\n8 0 9 8 7\n2 6 9 0 5\n6 1 3 6 9\n7 3 9 4 2\nse obtine tabloul\n2 4 3 6 6\n8 0 9 1 7\n2 6 9 3 5\n5 8 0 6 9\n7 3 9 4 2",
    input_format: "Se citesc n, k, apoi elementele tabloului.",
    output_format: "Tabloul dupa interschimbarea segmentelor linia k (stanga diagonalei) si coloana k (deasupra diagonalei).",
    constraints: "2 <= n <= 20, 2 <= k <= n",
    hints: "Extrageti sirul a[k][1..k-1] si sirul a[1..k-1][k]; puneti al doilea in locul primului si invers.",
    explanation: "Se extrag: sirul elementelor liniei k de pe coloanele 1 la k-1 (in stanga diagonalei principale), si sirul elementelor coloanei k de pe liniile 1 la k-1 (deasupra diagonalei principale). Se interschimba cele doua siruri: elementele liniei k primesc valorile fostei coloane k (in ordine), iar elementele coloanei k primesc valorile fostei linii k (in ordine).\n\n**Complexitate:** O(n^2)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, k; cin >> n >> k;
    vector<vector<long long>> a(n + 1, vector<long long>(n + 1));
    for (int i = 1; i <= n; i++) for (int j = 1; j <= n; j++) cin >> a[i][j];
    vector<long long> rowSeg, colSeg;
    for (int j = 1; j <= k - 1; j++) rowSeg.push_back(a[k][j]);
    for (int i = 1; i <= k - 1; i++) colSeg.push_back(a[i][k]);
    for (int j = 1; j <= k - 1; j++) a[k][j] = colSeg[j - 1];
    for (int i = 1; i <= k - 1; i++) a[i][k] = rowSeg[i - 1];
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) cout << a[i][j] << (j < n ? " " : "\\n");
    }
    return 0;
}
`,
    py: `n, k = map(int, input().split())
a = [[0] * (n + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    row = list(map(int, input().split()))
    for j in range(1, n + 1):
        a[i][j] = row[j - 1]
row_seg = [a[k][j] for j in range(1, k)]
col_seg = [a[i][k] for i in range(1, k)]
for j in range(1, k):
    a[k][j] = col_seg[j - 1]
for i in range(1, k):
    a[i][k] = row_seg[i - 1]
for i in range(1, n + 1):
    print(" ".join(str(a[i][j]) for j in range(1, n + 1)))
`,
    tests: [
      "5 4\n2 4 3 5 6\n8 0 9 8 7\n2 6 9 0 5\n6 1 3 6 9\n7 3 9 4 2",
      "2 2\n1 2\n3 4",
      "3 2\n1 2 3\n4 5 6\n7 8 9",
      "3 3\n1 2 3\n4 5 6\n7 8 9",
      "4 3\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16",
    ],
  },
  {
    slug: "bac-antrenament-2021-v11-3-3",
    subcategoryId: "antrenament-2021-v11",
    title: "Bacalaureat Antrenament 2021, Varianta 11, S3.3 - Termenii sirului patratic in ordine inversa",
    difficulty: "hard",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "eficienta", "fisiere", "siruri"],
    statement:
      "Se considera sirul 1, 3, 7, 13, 21, 31, 43 ... definit astfel: f0=1, iar fn=fn-1+2n, daca n>=1.\n\n" +
      "Se citesc de la tastatura doua numere naturale din intervalul [1,10^9], x si y (x<y), reprezentand doi termeni aflati pe pozitii consecutive in sirul dat, si se cere sa se scrie in fisierul text bac.out, separati prin cate un spatiu, toti termenii sirului mai mici sau egali cu y, in ordine inversa a aparitiei lor in sir. Proiectati un algoritm eficient din punctul de vedere al spatiului de memorie si al timpului de executare.\n\n" +
      "Exemplu: daca x=21 si y=31, fisierul contine valorile 31 21 13 7 3 1",
    input_format: "Se citesc x si y.",
    output_format: "Toti termenii sirului <= y, in ordine inversa a aparitiei (descrescator), scrisi in bac.out.",
    constraints: "1 <= x < y <= 10^9",
    hints: "Sirul are crestere patratica (fn=n^2+n+1); genereaza direct din recurenta pana ce termenul depaseste y.",
    explanation: "Se genereaza termenii sirului direct din recurenta (f0=1, fn=fn-1+2n), pastrand cei <=y, oprindu-se la primul termen ce depaseste y. Deoarece termenii cresc patratic (fn=n^2+n+1), numarul de termeni generati pentru y<=10^9 este de ordinul a cateva zeci de mii cel mult, deci algoritmul este eficient. Lista se scrie inversata (in ordinea inversa aparitiei, adica descrescator) in fisier.\n\n**Complexitate:** O(sqrt(y)) timp si spatiu",
    io: { input_source: "stdin", input_filename: null, output_target: "file", output_filename: "bac.out" },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long x, y; cin >> x >> y;
    (void)x;
    vector<long long> f;
    f.push_back(1);
    long long n = 1;
    while (true) {
        long long next = f.back() + 2 * n;
        if (next > y) break;
        f.push_back(next);
        n++;
    }
    freopen("bac.out", "w", stdout);
    for (int i = (int)f.size() - 1; i >= 0; i--) cout << f[i] << (i > 0 ? " " : "\\n");
    return 0;
}
`,
    py: `x, y = map(int, input().split())
f = [1]
n = 1
while True:
    nxt = f[-1] + 2 * n
    if nxt > y:
        break
    f.append(nxt)
    n += 1
f.reverse()
with open("bac.out", "w") as out:
    out.write(" ".join(map(str, f)))
    out.write("\\n")
`,
    tests: ["21 31", "1 3", "1 2", "3 7", "1 1000000000"],
  },
  // ===================== VARIANTA 12 (Testul 12) =====================
  {
    slug: "bac-antrenament-2021-v12-3-1",
    subcategoryId: "antrenament-2021-v12",
    title: "Bacalaureat Antrenament 2021, Varianta 12, S3.1 - Fratele mai mare al unui numar",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "cifre"],
    statement:
      "Un numar y este numit frate mai mare al unui numar x daca x si y au acelasi numar de cifre si fiecare cifra a lui y se poate obtine din cifra aflata pe aceeasi pozitie in x adunand la aceasta valoarea 1.\n\n" +
      "Subprogramul frate are doi parametri:\n" +
      "- x, prin care primeste un numar natural (x in [0,10^9]);\n" +
      "- y, prin care furnizeaza fratele mai mare al lui x, sau -1, daca nu se poate obtine un astfel de numar.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca x=1027, dupa apel y=2138, iar daca x=9027, dupa apel y=-1.",
    input_format: "Se citeste de la tastatura x.",
    output_format: "Fratele mai mare al lui x, sau -1 daca vreo cifra a lui x este 9.",
    constraints: "0 <= x <= 10^9",
    hints: "Daca vreo cifra a lui x este 9, raspunsul este -1; altfel construiti y adaugand 1 la fiecare cifra.",
    explanation: "Se parcurg cifrele lui x; daca vreo cifra este 9 (adaugarea a 1 ar produce o cifra invalida, 10), se returneaza -1. Altfel, se construieste y inlocuind fiecare cifra a lui x cu cifra+1.\n\n**Complexitate:** O(numar de cifre)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long x; cin >> x;
    cout << frate(x) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

x = int(input())
print(frate(x))
`,
    cpp: `long long frate(long long x) {
    string s = to_string(x);
    string r = "";
    for (char c : s) {
        int d = c - '0';
        if (d == 9) return -1;
        r += ('0' + d + 1);
    }
    return stoll(r);
}
`,
    py: `def frate(x):
    s = str(x)
    r = ""
    for c in s:
        d = int(c)
        if d == 9:
            return -1
        r += str(d + 1)
    return int(r)
`,
    tests: ["1027", "9027", "0", "12345678", "8"],
  },
  {
    slug: "bac-antrenament-2021-v12-3-2",
    subcategoryId: "antrenament-2021-v12",
    title: "Bacalaureat Antrenament 2021, Varianta 12, S3.2 - Deplasare circulara dreapta, stanga diagonalei secundare",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Scrieti un program C/C++ care citeste de la tastatura numere naturale: n (n in [2,20]), k (k in [1,n]) si n*n numere din intervalul [0,10^9], elemente ale unui tablou bidimensional cu n linii si n coloane. Programul transforma tabloul in memorie, deplasand circular spre dreapta, cu cate o pozitie, toate elementele situate pe linia a k-a, in stanga diagonalei secundare. Elementele tabloului obtinut sunt afisate pe ecran, fiecare linie pe cate o linie a ecranului, cu elementele fiecarei linii separate prin cate un spatiu.\n\n" +
      "Exemplu: pentru n=5, k=2 si tabloul\n2 3 4 5 6\n2 4 6 8 0\n7 8 9 0 1\n3 5 7 9 1\n7 3 8 5 6\n" +
      "se obtine tabloul\n2 3 4 5 6\n6 2 4 8 0\n7 8 9 0 1\n3 5 7 9 1\n7 3 8 5 6",
    input_format: "Se citesc n, k, apoi elementele tabloului.",
    output_format: "Tabloul dupa deplasarea circulara la dreapta a segmentului din stanga diagonalei secundare de pe linia k.",
    constraints: "2 <= n <= 20, 1 <= k <= n",
    hints: "Segmentul de interes pe linia k este coloanele 1..(n-k) (in stanga coloanei diagonalei secundare, care este n+1-k). Deplasati circular la dreapta acest segment (ultimul element trece la inceput).",
    explanation: "Coloana diagonalei secundare pe linia k este n+1-k, deci segmentul 'in stanga diagonalei secundare' este format din coloanele 1 la n-k. Acest segment este deplasat circular la dreapta cu o pozitie: noul element de pe coloana j (j>1) devine cel vechi de pe coloana j-1, iar noul element de pe coloana 1 devine cel vechi de pe coloana n-k.\n\n**Complexitate:** O(n^2)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, k; cin >> n >> k;
    vector<vector<long long>> a(n + 1, vector<long long>(n + 1));
    for (int i = 1; i <= n; i++) for (int j = 1; j <= n; j++) cin >> a[i][j];
    int segLen = n - k;
    if (segLen >= 1) {
        long long last = a[k][segLen];
        for (int j = segLen; j >= 2; j--) a[k][j] = a[k][j - 1];
        a[k][1] = last;
    }
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) cout << a[i][j] << (j < n ? " " : "\\n");
    }
    return 0;
}
`,
    py: `n, k = map(int, input().split())
a = [[0] * (n + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    row = list(map(int, input().split()))
    for j in range(1, n + 1):
        a[i][j] = row[j - 1]
seg_len = n - k
if seg_len >= 1:
    last = a[k][seg_len]
    for j in range(seg_len, 1, -1):
        a[k][j] = a[k][j - 1]
    a[k][1] = last
for i in range(1, n + 1):
    print(" ".join(str(a[i][j]) for j in range(1, n + 1)))
`,
    tests: [
      "5 2\n2 3 4 5 6\n2 4 6 8 0\n7 8 9 0 1\n3 5 7 9 1\n7 3 8 5 6",
      "2 2\n1 2\n3 4",
      "3 1\n1 2 3\n4 5 6\n7 8 9",
      "3 3\n1 2 3\n4 5 6\n7 8 9",
      "4 2\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16",
    ],
  },
  {
    slug: "bac-antrenament-2021-v12-3-3",
    subcategoryId: "antrenament-2021-v12",
    title: "Bacalaureat Antrenament 2021, Varianta 12, S3.3 - Cea mai mare pozitie in sirul sortat descrescator",
    difficulty: "hard",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.txt contine un sir de cel mult 10^5 numere naturale din intervalul [1,10^9], separate prin cate un spatiu.\n\n" +
      "Se cere sa se afiseze pe ecran cea mai mare pozitie pe care ar putea-o ocupa primul termen al sirului aflat in fisier in sirul format cu aceleasi valori, ordonat descrescator. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul bac.txt contine numerele 15 7 15 17 6 4 21 se afiseaza pe ecran 4 (15 se afla pe a treia si pe a patra pozitie in sirul 21, 17, 15, 15, 7, 6, 4).",
    input_format: "Fisierul bac.txt: un sir de numere naturale, separate prin spatiu.",
    output_format: "Cea mai mare pozitie posibila a primului termen in sirul sortat descrescator.",
    constraints: "cel mult 10^5 termeni",
    hints: "Numarati cate valori din intreg sirul sunt strict mai mari decat primul termen (cntGreater), si cate sunt egale cu primul termen (cntEqual, inclusiv el insusi); raspunsul este cntGreater+cntEqual.",
    explanation: "Se citeste primul termen al sirului. Se parcurge apoi intregul sir (o singura trecere), numarand cate valori sunt strict mai mari decat primul termen (cntGreater) si cate sunt egale cu el, inclusiv el insusi (cntEqual). Cea mai mare pozitie posibila a primului termen in sirul sortat descrescator este cntGreater + cntEqual.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    long long first; cin >> first;
    long long cntGreater = 0, cntEqual = 1;
    long long v;
    while (cin >> v) {
        if (v > first) cntGreater++;
        else if (v == first) cntEqual++;
    }
    cout << (cntGreater + cntEqual) << "\\n";
    return 0;
}
`,
    py: `with open("bac.txt") as f:
    data = list(map(int, f.read().split()))
first = data[0]
cnt_greater = sum(1 for v in data[1:] if v > first)
cnt_equal = 1 + sum(1 for v in data[1:] if v == first)
print(cnt_greater + cnt_equal)
`,
    tests: [
      "15 7 15 17 6 4 21",
      "5",
      "5 5 5",
      "5 4 3 2 1",
      (() => {
        const parts = ["500"];
        for (let i = 0; i < 20000; i++) parts.push(String(i % 1000));
        return parts.join(" ");
      })(),
    ],
  },
];

module.exports = problems;
