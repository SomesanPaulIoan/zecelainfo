const problems = [
  // ===================== VARIANTA 5 (Testul 5) =====================
  {
    slug: "bac-antrenament-2021-v5-3-1",
    subcategoryId: "antrenament-2021-v5",
    title: "Bacalaureat Antrenament 2021, Varianta 5, S3.1 - Numar cu toate cifrele identice",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "cifre"],
    statement:
      "Subprogramul identice are un singur parametru, n, prin care primeste un numar natural (n in [10,10^9]). Subprogramul returneaza valoarea 1, daca numarul n are toate cifrele egale, sau valoarea 0 in caz contrar. Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=2222, subprogramul returneaza valoarea 1, iar daca n=212, subprogramul returneaza valoarea 0.",
    input_format: "Se citeste de la tastatura n.",
    output_format: "1 daca toate cifrele lui n sunt egale, altfel 0.",
    constraints: "10 <= n <= 10^9",
    hints: "Comparati fiecare cifra cu prima cifra a lui n.",
    explanation: "Se retine prima cifra a lui n si se verifica daca toate celelalte cifre sunt egale cu aceasta.\n\n**Complexitate:** O(numar de cifre)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    cout << identice(n) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(identice(n))
`,
    cpp: `int identice(long long n) {
    string s = to_string(n);
    for (char c : s) if (c != s[0]) return 0;
    return 1;
}
`,
    py: `def identice(n):
    s = str(n)
    return 1 if all(c == s[0] for c in s) else 0
`,
    tests: ["2222", "212", "11", "999999999", "123456789"],
  },
  {
    slug: "bac-antrenament-2021-v5-3-2",
    subcategoryId: "antrenament-2021-v5",
    title: "Bacalaureat Antrenament 2021, Varianta 5, S3.2 - Ultima cifra a produsului i*j",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Scrieti un program C/C++ care citeste de la tastatura doua numere naturale din intervalul [2,100], m si n, si construieste in memorie un tablou bidimensional cu m linii si n coloane, numerotate incepand cu 1, astfel incat elementul de pe linia i si coloana j primeste ca valoare ultima cifra a produsului i*j.\n\n" +
      "Programul afiseaza pe ecran elementele tabloului obtinut, linie cu linie, fiecare linie pe cate o linie a ecranului, cu valorile aflate pe aceeasi linie separate prin cate un spatiu.\n\n" +
      "Exemplu: daca m=4 si n=5 se afiseaza pe ecran tabloul:\n1 2 3 4 5\n2 4 6 8 0\n3 6 9 2 5\n4 8 2 6 0",
    input_format: "Se citesc m si n.",
    output_format: "Se afiseaza tabloul cu m linii si n coloane.",
    constraints: "2 <= m, n <= 100",
    hints: "a[i][j] = (i*j) % 10.",
    explanation: "Pentru fiecare pozitie (i,j), se calculeaza ultima cifra a produsului i*j prin (i*j)%10.\n\n**Complexitate:** O(m*n)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int m, n; cin >> m >> n;
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) cout << ((i * j) % 10) << (j < n ? " " : "\\n");
    }
    return 0;
}
`,
    py: `m, n = map(int, input().split())
for i in range(1, m + 1):
    row = [str((i * j) % 10) for j in range(1, n + 1)]
    print(" ".join(row))
`,
    tests: ["4 5", "2 2", "100 2", "2 100", "10 10"],
  },
  {
    slug: "bac-antrenament-2021-v5-3-3",
    subcategoryId: "antrenament-2021-v5",
    title: "Bacalaureat Antrenament 2021, Varianta 5, S3.3 - Maximul primelor i valori",
    difficulty: "hard",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.txt contine numere naturale din intervalul [2,10^6]: pe prima linie n, iar pe a doua linie un sir de n numere, separate prin cate un spatiu.\n\n" +
      "Se cere sa se afiseze pe ecran, pentru fiecare numar natural i (i in [1,n]), cea mai mare dintre primele i valori ale sirului aflat in fisier. Numerele afisate sunt separate prin cate un spatiu. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul are continutul n=12, sirul 4 6 3 7 8 1 6 2 7 9 10 8, se afiseaza pe ecran 4 6 6 7 8 8 8 8 8 9 10 10",
    input_format: "Fisierul bac.txt: n pe prima linie, sirul pe a doua.",
    output_format: "Maximul primelor i valori, pentru fiecare i de la 1 la n.",
    constraints: "2 <= n, valori <= 10^6",
    hints: "Mentineti un maxim curent pe parcursul unei singure treceri prin sir, afisandu-l dupa fiecare pas.",
    explanation: "Se parcurge sirul o singura data, mentinand maximul valorilor vazute pana in acel moment (maxim curent). Dupa fiecare element citit, se actualizeaza si se afiseaza maximul curent.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    int n; cin >> n;
    long long v, mx = -1;
    vector<long long> rez;
    for (int i = 0; i < n; i++) { cin >> v; mx = max(mx, v); rez.push_back(mx); }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `with open("bac.txt") as f:
    n = int(f.readline())
    data = list(map(int, f.readline().split()))
rez = []
mx = -1
for v in data:
    mx = max(mx, v)
    rez.append(mx)
print(" ".join(map(str, rez)))
`,
    tests: [
      "12\n4 6 3 7 8 1 6 2 7 9 10 8",
      "2\n5 3",
      "2\n1 5",
      "3\n9 9 9",
      (() => {
        const parts = [];
        for (let i = 0; i < 20000; i++) parts.push(String((i * 37) % 1000000));
        return `20000\n${parts.join(" ")}`;
      })(),
    ],
  },
  // ===================== VARIANTA 6 (Testul 6) =====================
  {
    slug: "bac-antrenament-2021-v6-3-1",
    subcategoryId: "antrenament-2021-v6",
    title: "Bacalaureat Antrenament 2021, Varianta 6, S3.1 - Eliminarea cifrelor egale cu c",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "cifre"],
    statement:
      "Subprogramul numar are trei parametri:\n" +
      "- n si c, prin care primeste cate un numar natural (n in [0,10^9], c in [0,9]);\n" +
      "- m, prin care furnizeaza numarul obtinut din n, prin eliminarea din acesta a tuturor cifrelor egale cu c, sau -1 daca toate cifrele lui n sunt egale cu c. Cifrele nule nesemnificative sunt ignorate.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=50752 sau n=72 si c=5, dupa apel m=72, daca n=500 si c=5, dupa apel m=0, iar daca n=55 si c=5, dupa apel m=-1.",
    input_format: "Se citesc n si c.",
    output_format: "Numarul m obtinut prin eliminarea cifrelor egale cu c din n, sau -1.",
    constraints: "0 <= n <= 10^9, 0 <= c <= 9",
    hints: "Construiti un sir de caractere cu cifrele lui n care nu sunt egale cu c; daca este vid, m=-1; altfel convertiti la numar (elimina automat zerourile nesemnificative).",
    explanation: "Se construieste un sir cu cifrele lui n, in ordine, care nu sunt egale cu c. Daca acest sir este vid (toate cifrele lui n erau egale cu c), m=-1. Altfel, sirul se converteste la un numar intreg, ceea ce elimina automat orice zerouri nesemnificative de la inceput.\n\n**Complexitate:** O(numar de cifre)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; int c; cin >> n >> c;
    cout << numar(n, c) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n, c = map(int, input().split())
print(numar(n, c))
`,
    cpp: `long long numar(long long n, int c) {
    string s = to_string(n);
    string r = "";
    for (char ch : s) if ((ch - '0') != c) r += ch;
    if (r.empty()) return -1;
    return stoll(r);
}
`,
    py: `def numar(n, c):
    s = str(n)
    r = "".join(ch for ch in s if int(ch) != c)
    if not r:
        return -1
    return int(r)
`,
    tests: ["50752 5", "72 5", "500 5", "55 5", "0 5"],
  },
  {
    slug: "bac-antrenament-2021-v6-3-2",
    subcategoryId: "antrenament-2021-v6",
    title: "Bacalaureat Antrenament 2021, Varianta 6, S3.2 - Tablou V complet cu zero pe diagonala secundara",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Scrieti un program C/C++ care citeste de la tastatura un numar natural, n (n in [3,20]), si construieste in memorie un tablou bidimensional cu n linii si n coloane, avand proprietatile:\n" +
      "- toate elementele situate pe diagonala secundara sunt nule;\n" +
      "- prima linie contine un sir strict descrescator de numere consecutive, iar ultima linie contine un sir strict crescator de numere consecutive;\n" +
      "- fiecare dintre celelalte linii contine, incepand cu prima pozitie, pana la diagonala secundara inclusiv, de la stanga la dreapta, un sir strict descrescator de numere consecutive, iar incepand de la diagonala secundara, inclusiv, pana la ultima pozitie, de la stanga la dreapta, un sir strict crescator de numere consecutive.\n\n" +
      "Programul afiseaza pe ecran tabloul construit, fiecare linie pe cate o linie a ecranului, cu elementele separate prin cate un spatiu.\n\n" +
      "Exemplu: daca n=4 se afiseaza pe ecran tabloul:\n3 2 1 0\n2 1 0 1\n1 0 1 2\n0 1 2 3",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza tabloul cu n linii si n coloane.",
    constraints: "3 <= n <= 20",
    hints: "Elementul de pe linia i, coloana j (1-indexat) este abs(j-(n+1-i)).",
    explanation: "Coloana diagonalei secundare pe linia i este n+1-i, unde valoarea este 0. Elementul de pe pozitia (i,j) este distanta absoluta fata de aceasta coloana: abs(j-(n+1-i)). Aceasta formula produce automat prima linie strict descrescatoare (diagonala secundara fiind la coloana n) si ultima linie strict crescatoare (diagonala secundara fiind la coloana 1).\n\n**Complexitate:** O(n^2)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) cout << abs(j - (n + 1 - i)) << (j < n ? " " : "\\n");
    }
    return 0;
}
`,
    py: `n = int(input())
for i in range(1, n + 1):
    row = [str(abs(j - (n + 1 - i))) for j in range(1, n + 1)]
    print(" ".join(row))
`,
    tests: ["4", "3", "20", "5", "10"],
  },
  {
    slug: "bac-antrenament-2021-v6-3-3",
    subcategoryId: "antrenament-2021-v6",
    title: "Bacalaureat Antrenament 2021, Varianta 6, S3.3 - Secventa cu o singura valoare negativa si maxim de pozitive",
    difficulty: "hard",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.in contine un sir de cel putin patru si cel mult 10^5 numere intregi nenule din intervalul [-10^9,10^9], dintre care exact trei sunt negative, iar restul pozitive. Numerele sunt separate prin cate un spatiu. O secventa este formata din termeni aflati pe pozitii consecutive in sir, iar lungimea secventei este egala cu numarul de termeni ai acesteia.\n\n" +
      "Se cere sa se afiseze pe ecran lungimea unei secvente din sirul aflat in fisier care contine o singura valoare negativa si un numar maxim de valori pozitive. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine numerele 15 21 -61 9 870 -23 11 5 8 -81 5 14 pe ecran se afiseaza 6 (corespunzator secventelor 9 870 -23 11 5 8 sau 11 5 8 -81 5 14).",
    input_format: "Fisierul bac.in: un sir de numere intregi nenule, separate prin spatiu, exact trei negative.",
    output_format: "Lungimea maxima a unei secvente cu exact o valoare negativa.",
    constraints: "4 <= n <= 10^5, exact 3 valori negative",
    hints: "Fie p1<p2<p3 pozitiile celor 3 negative. Lungimea maxima pentru fiecare este data de fereastra dintre negativele vecine (sau capetele sirului).",
    explanation: "Se determina, printr-o singura trecere, pozitiile celor trei valori negative p1, p2, p3. Pentru fiecare dintre ele, fereastra maxima ce contine EXACT acea valoare negativa (si niciuna dintre celelalte doua) este marginita de negativele vecine: lungime(p1)=p2-1, lungime(p2)=p3-p1-1, lungime(p3)=n-p2. Raspunsul este maximul acestor trei lungimi.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.in", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.in", "r", stdin);
    vector<long long> negPos;
    long long v, pos = 0;
    long long n = 0;
    while (cin >> v) {
        pos++;
        n = pos;
        if (v < 0) negPos.push_back(pos);
    }
    long long p1 = negPos[0], p2 = negPos[1], p3 = negPos[2];
    long long len1 = p2 - 1;
    long long len2 = p3 - p1 - 1;
    long long len3 = n - p2;
    cout << max({len1, len2, len3}) << "\\n";
    return 0;
}
`,
    py: `with open("bac.in") as f:
    data = f.read().split()
n = len(data)
neg_pos = [i + 1 for i, tok in enumerate(data) if int(tok) < 0]
p1, p2, p3 = neg_pos[0], neg_pos[1], neg_pos[2]
len1 = p2 - 1
len2 = p3 - p1 - 1
len3 = n - p2
print(max(len1, len2, len3))
`,
    tests: [
      "15 21 -61 9 870 -23 11 5 8 -81 5 14",
      "-1 2 3 -4 5 -6",
      "-1 -2 -3 4",
      "1 -2 -3 -4",
      (() => {
        const parts = ["-1"];
        for (let i = 0; i < 10000; i++) parts.push(String(i + 1));
        parts.push("-2");
        for (let i = 0; i < 10000; i++) parts.push(String(i + 1));
        parts.push("-3");
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== VARIANTA 7 (Testul 7) =====================
  {
    slug: "bac-antrenament-2021-v7-3-1",
    subcategoryId: "antrenament-2021-v7",
    title: "Bacalaureat Antrenament 2021, Varianta 7, S3.1 - Afisare in secvente de k numere",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "cifre"],
    statement:
      "Subprogramul afisare are trei parametri:\n" +
      "- x si y, prin care primeste cate un numar natural din intervalul [0,10^6] (x<=y);\n" +
      "- k, prin care primeste un numar natural (k in [2,10^2]).\n\n" +
      "Subprogramul afiseaza pe ecran, in ordine strict crescatoare, numerele din intervalul [x,y], in secvente de cate k, cu exceptia ultimei secvente care poate contine mai putin de k numere. Fiecare secventa se incheie cu cate un simbol *, iar numerele si simbolurile sunt separate prin cate un spatiu.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca x=11, y=21 si k=4 se afiseaza pe ecran numerele: 11 12 13 14 * 15 16 17 18 * 19 20 21 *",
    input_format: "Se citesc x, y si k.",
    output_format: "Numerele din [x,y] grupate cate k, fiecare grup incheiat cu '*'.",
    constraints: "0 <= x <= y <= 10^6, 2 <= k <= 100",
    hints: "Parcurgeti v de la x la y, afisandu-l; la fiecare k numere afisate (sau la finalul intervalului), afisati '*'.",
    explanation: "Se parcurg valorile v de la x la y; se afiseaza fiecare valoare urmata de un spatiu; se mentine un contor al numerelor afisate din grupul curent, iar cand acesta atinge k (sau se ajunge la finalul intervalului), se afiseaza '*' si contorul se reseteaza.\n\n**Complexitate:** O(y-x)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long x, y; int k; cin >> x >> y >> k;
    afisare(x, y, k);
    return 0;
}
`,
    function_template_python: `__USER_CODE__

x, y, k = map(int, input().split())
afisare(x, y, k)
`,
    cpp: `void afisare(long long x, long long y, int k) {
    int cnt = 0;
    for (long long v = x; v <= y; v++) {
        cout << v << " ";
        cnt++;
        if (cnt == k) { cout << "* "; cnt = 0; }
    }
    if (cnt > 0) cout << "* ";
    cout << "\\n";
}
`,
    py: `def afisare(x, y, k):
    out = []
    cnt = 0
    for v in range(x, y + 1):
        out.append(str(v))
        cnt += 1
        if cnt == k:
            out.append("*")
            cnt = 0
    if cnt > 0:
        out.append("*")
    print(" ".join(out))
`,
    tests: ["11 21 4", "1 5 2", "10 10 3", "0 0 2", "1 8 8"],
  },
  {
    slug: "bac-antrenament-2021-v7-3-2",
    subcategoryId: "antrenament-2021-v7",
    title: "Bacalaureat Antrenament 2021, Varianta 7, S3.2 - Tablou cu cifrele lui x pe fiecare linie",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Scrieti un program C/C++ care citeste de la tastatura un numar natural, x (x in [1,10^9]), si construieste in memorie un tablou bidimensional, pentru care atat numarul de linii, cat si numarul de coloane sunt egale cu numarul de cifre ale lui x, iar elementele fiecarei linii au ca valori cifrele lui x, in ordine.\n\n" +
      "Elementele tabloului obtinut sunt afisate pe ecran, linie cu linie, fiecare linie pe cate o linie a ecranului, cu elementele de pe aceeasi linie separate prin cate un spatiu.\n\n" +
      "Exemplu: daca x=1359, se afiseaza tabloul:\n1 3 5 9\n1 3 5 9\n1 3 5 9\n1 3 5 9",
    input_format: "Se citeste x.",
    output_format: "Se afiseaza un tablou d x d (d=numar de cifre ale lui x), fiecare linie fiind cifrele lui x.",
    constraints: "1 <= x <= 10^9",
    hints: "Extrageti cifrele lui x intr-un sir; afisati acest sir de d ori (d fiind numarul de cifre).",
    explanation: "Se extrag cifrele lui x, in ordine, obtinand un sir de d cifre. Se afiseaza acest sir de d ori, pe linii separate, obtinand un tablou d x d.\n\n**Complexitate:** O(d^2)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string x; cin >> x;
    int d = (int)x.size();
    for (int i = 0; i < d; i++) {
        for (int j = 0; j < d; j++) cout << x[j] << (j + 1 < d ? " " : "\\n");
    }
    return 0;
}
`,
    py: `x = input().strip()
d = len(x)
for i in range(d):
    print(" ".join(x[j] for j in range(d)))
`,
    tests: ["1359", "5", "10", "999999999", "1000000000"],
  },
  {
    slug: "bac-antrenament-2021-v7-3-3",
    subcategoryId: "antrenament-2021-v7",
    title: "Bacalaureat Antrenament 2021, Varianta 7, S3.3 - Toate cifrele pare din fisier",
    difficulty: "hard",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.txt contine cel mult 10^6 cifre, separate prin cate un spatiu.\n\n" +
      "Se cere sa se afiseze pe ecran, separate prin cate un spatiu, toate cifrele pare care apar in fisier (cu repetitii, in ordine crescatoare), sau mesajul nu exista, daca nu exista astfel de cifre. Proiectati un algoritm eficient din punctul de vedere al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine cifrele 3 3 0 8 2 1 2 1 3 7 1 5 2 7 1 0 3 2 3 pe ecran se afiseaza, in ordine crescatoare, cifrele 0 0 2 2 2 2 8",
    input_format: "Fisierul bac.txt: cate o cifra pe pozitie, separate prin spatiu.",
    output_format: "Toate cifrele pare din fisier (cu repetitii), in ordine crescatoare, sau mesajul 'nu exista'.",
    constraints: "cel mult 10^6 cifre",
    hints: "Numarati aparitiile fiecarei cifre pare (0,2,4,6,8) intr-un tablou de 10 elemente, apoi afisati fiecare valoare repetata de atatea ori cate aparitii are.",
    explanation: "Se parcurge fisierul o singura data, numarand aparitiile fiecarei cifre in tabloul cnt[0..9]. Apoi se afiseaza, pentru fiecare cifra para de la 0 la 8, valoarea repetata de cnt[cifra] ori - aceasta produce direct ordinea crescatoare ceruta, fara sortare explicita.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    long long cnt[10] = {0};
    int d;
    while (cin >> d) cnt[d]++;
    vector<int> rez;
    for (int v = 0; v <= 8; v += 2) for (long long k = 0; k < cnt[v]; k++) rez.push_back(v);
    if (rez.empty()) { cout << "nu exista\\n"; return 0; }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `cnt = [0] * 10
with open("bac.txt") as f:
    data = f.read().split()
for tok in data:
    cnt[int(tok)] += 1
rez = []
for v in range(0, 9, 2):
    rez.extend([v] * cnt[v])
print("nu exista" if not rez else " ".join(map(str, rez)))
`,
    tests: [
      "3 3 0 8 2 1 2 1 3 7 1 5 2 7 1 0 3 2 3",
      "1 3 5 7 9",
      "2 2 2",
      "0",
      (() => {
        const parts = [];
        for (let i = 0; i < 20000; i++) parts.push(String(i % 10));
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== VARIANTA 8 (Testul 8) =====================
  {
    slug: "bac-antrenament-2021-v8-3-1",
    subcategoryId: "antrenament-2021-v8",
    title: "Bacalaureat Antrenament 2021, Varianta 8, S3.1 - Numarul cu cei mai multi factori primi distincti",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "divizori"],
    statement:
      "Subprogramul nrfp are doi parametri:\n" +
      "- n, prin care primeste un numar natural (n in [2,2000]);\n" +
      "- m, prin care furnizeaza numarul din intervalul inchis [2,n] care are cei mai multi factori primi DISTINCTI; daca exista mai multe numere cu aceasta proprietate, subprogramul il returneaza pe cel mai mare dintre ele.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=100 atunci, in urma apelului, m=90 (90=2*3^2*5 are 3 factori primi distincti - 2, 3 si 5 - numarul maxim posibil pentru valori pana la 100, iar dintre numerele cu aceasta proprietate, 90 este cel mai mare).",
    input_format: "Se citeste de la tastatura n.",
    output_format: "Numarul din [2,n] cu cei mai multi factori primi distincti (cel mai mare, la egalitate).",
    constraints: "2 <= n <= 2000",
    hints: "Pentru fiecare v din [2,n], numarati factorii primi distincti prin trial division; retineti maximul si, la egalitate, valoarea cea mai mare.",
    explanation: "Se parcurg toate valorile v de la 2 la n; pentru fiecare, se numara factorii primi distincti prin trial division (O(sqrt(v))). Se retine valoarea cu cel mai mare numar de factori primi distincti, iar la egalitate, cea mai mare valoare dintre ele.\n\n**Complexitate:** O(n*sqrt(n))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

int nrFactoriDistinctiV8(long long v) {
    int cnt = 0;
    for (long long f = 2; f * f <= v; f++) {
        if (v % f == 0) { cnt++; while (v % f == 0) v /= f; }
    }
    if (v > 1) cnt++;
    return cnt;
}

__USER_CODE__

int main() {
    long long n; cin >> n;
    cout << nrfp(n) << "\\n";
    return 0;
}
`,
    function_template_python: `def nr_factori_distincti_v8(v):
    cnt = 0
    f = 2
    while f * f <= v:
        if v % f == 0:
            cnt += 1
            while v % f == 0:
                v //= f
        f += 1
    if v > 1:
        cnt += 1
    return cnt

__USER_CODE__

n = int(input())
print(nrfp(n))
`,
    cpp: `long long nrfp(long long n) {
    int bestCnt = -1;
    long long bestVal = -1;
    for (long long v = 2; v <= n; v++) {
        int c = nrFactoriDistinctiV8(v);
        if (c > bestCnt || (c == bestCnt && v > bestVal)) { bestCnt = c; bestVal = v; }
    }
    return bestVal;
}
`,
    py: `def nrfp(n):
    best_cnt, best_val = -1, -1
    for v in range(2, n + 1):
        c = nr_factori_distincti_v8(v)
        if c > best_cnt or (c == best_cnt and v > best_val):
            best_cnt, best_val = c, v
    return best_val
`,
    tests: ["100", "2", "30", "210", "2000"],
  },
  {
    slug: "bac-antrenament-2021-v8-3-2",
    subcategoryId: "antrenament-2021-v8",
    title: "Bacalaureat Antrenament 2021, Varianta 8, S3.2 - Suma din zona dintre diagonale si ultima coloana",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Scrieti un program C/C++ care citeste de la tastatura numarul natural n (n in [5,50]) si elementele unui tablou bidimensional cu n linii si n coloane, numere naturale din intervalul [0,100]. Programul afiseaza pe ecran suma numerelor din zona delimitata de cele doua diagonale si ultima coloana a tabloului: zona formata din elementele (i,j) aflate simultan strict la dreapta diagonalei principale (j>i) si la dreapta sau pe diagonala secundara (j>=n+1-i).\n\n" +
      "Exemplu: pentru n=4 si tabloul\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16\nse afiseaza pe ecran 31 (corespunzator elementelor de pe pozitiile (1,4)=4, (2,3)=7, (2,4)=8, (3,4)=12).",
    input_format: "Se citesc n, apoi elementele tabloului.",
    output_format: "Suma elementelor din zona j>i si j>=n+1-i.",
    constraints: "5 <= n <= 50",
    hints: "Pentru fiecare linie i, insumati elementele de pe coloanele j care satisfac simultan j>i si j>=n+1-i.",
    explanation: "Pentru fiecare linie i, se insumeaza elementele de pe coloanele j care satisfac simultan conditiile j>i (strict la dreapta diagonalei principale) si j>=n+1-i (pe sau la dreapta diagonalei secundare).\n\n**Complexitate:** O(n^2)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<vector<long long>> a(n + 1, vector<long long>(n + 1));
    for (int i = 1; i <= n; i++) for (int j = 1; j <= n; j++) cin >> a[i][j];
    long long sum = 0;
    for (int i = 1; i <= n; i++) for (int j = 1; j <= n; j++) if (j > i && j >= n + 1 - i) sum += a[i][j];
    cout << sum << "\\n";
    return 0;
}
`,
    py: `n = int(input())
a = [[0] * (n + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    row = list(map(int, input().split()))
    for j in range(1, n + 1):
        a[i][j] = row[j - 1]
total = 0
for i in range(1, n + 1):
    for j in range(1, n + 1):
        if j > i and j >= n + 1 - i:
            total += a[i][j]
print(total)
`,
    tests: [
      "5\n1 2 3 4 5\n6 7 8 9 10\n11 12 13 14 15\n16 17 18 19 20\n21 22 23 24 25",
      "5\n0 0 0 0 0\n0 0 0 0 0\n0 0 0 0 0\n0 0 0 0 0\n0 0 0 0 1",
      "5\n1 1 1 1 1\n1 1 1 1 1\n1 1 1 1 1\n1 1 1 1 1\n1 1 1 1 1",
      "6\n1 2 3 4 5 6\n7 8 9 10 11 12\n13 14 15 16 17 18\n19 20 21 22 23 24\n25 26 27 28 29 30\n31 32 33 34 35 36",
      "5\n2 2 2 2 2\n2 2 2 2 2\n2 2 2 2 2\n2 2 2 2 2\n2 2 2 2 2",
    ],
  },
  {
    slug: "bac-antrenament-2021-v8-3-3",
    subcategoryId: "antrenament-2021-v8",
    title: "Bacalaureat Antrenament 2021, Varianta 8, S3.3 - Ultimele doua numere impare",
    difficulty: "hard",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.txt contine un sir de cel mult 10^6 numere naturale din intervalul [0,10^9].\n\n" +
      "Se cere sa se determine si sa se afiseze pe ecran, separate printr-un spatiu, ultimele doua numere impare (nu neaparat distincte) din sirul aflat in fisier, sau mesajul nu exista, daca nu exista doua astfel de numere. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine valorile 122 1635 628 1413 1647 900 3001 4252 se afiseaza pe ecran 1647 3001",
    input_format: "Fisierul bac.txt: un sir de numere naturale, separate prin spatiu.",
    output_format: "Ultimele doua numere impare din sir, in ordinea aparitiei, sau mesajul 'nu exista'.",
    constraints: "cel mult 10^6 termeni",
    hints: "Parcurgeti sirul o singura data, mentinand ultimele doua valori impare intalnite pana la momentul curent.",
    explanation: "Se parcurge sirul o singura data, mentinand ultimele doua valori impare intalnite (o pereche alunecatoare); la finalul parcurgerii, daca s-au gasit macar doua, se afiseaza in ordinea aparitiei lor.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    long long v;
    long long last1 = -1, last2 = -1;
    int cnt = 0;
    while (cin >> v) {
        if (v % 2 == 1) { last1 = last2; last2 = v; cnt++; }
    }
    if (cnt < 2) { cout << "nu exista\\n"; return 0; }
    cout << last1 << " " << last2 << "\\n";
    return 0;
}
`,
    py: `last1, last2 = -1, -1
cnt = 0
with open("bac.txt") as f:
    data = f.read().split()
for tok in data:
    v = int(tok)
    if v % 2 == 1:
        last1, last2 = last2, v
        cnt += 1
if cnt < 2:
    print("nu exista")
else:
    print(last1, last2)
`,
    tests: [
      "122 1635 628 1413 1647 900 3001 4252",
      "1 3",
      "2 4 6",
      "1 2 3",
      (() => {
        const parts = [];
        for (let i = 0; i < 30000; i++) parts.push(String(i % 3 === 0 ? i * 2 : i * 2 + 1));
        return parts.join(" ");
      })(),
    ],
  },
];

module.exports = problems;
