const problems = [
  // ===================== VARIANTA 9 (Testul 9) =====================
  {
    slug: "bac-antrenament-2020-v9-3-1",
    subcategoryId: "antrenament-2020-v9",
    title: "Bacalaureat Antrenament 2020, Varianta 9, S3.1 - Suma cifrelor impare distincte",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "cifre"],
    statement:
      "Subprogramul suma are doi parametri:\n" +
      "- n, prin care primeste un numar natural din intervalul [0,10^9];\n" +
      "- s, prin care furnizeaza suma cifrelor impare distincte din scrierea acestuia.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=4713835, dupa apel s=16 (16=7+1+3+5), iar daca n=48, dupa apel s=0.",
    input_format: "Se citeste de la tastatura n.",
    output_format: "Se afiseaza suma cifrelor impare distincte ale lui n.",
    constraints: "0 <= n <= 10^9",
    hints: "Marcati fiecare cifra impara vazuta intr-un tablou boolean de marime 10; insumati o singura data fiecare cifra impara distincta.",
    explanation: "Se parcurg cifrele lui n; pentru fiecare cifra impara nevazuta pana atunci, se marcheaza ca vazuta si se aduna la suma.\n\n**Complexitate:** O(numar de cifre)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    int s;
    suma(n, s);
    cout << s << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(suma(n))
`,
    cpp: `void suma(long long n, int& s) {
    bool seen[10] = {false};
    s = 0;
    if (n == 0) return;
    while (n > 0) {
        int d = (int)(n % 10);
        if (d % 2 == 1 && !seen[d]) { seen[d] = true; s += d; }
        n /= 10;
    }
}
`,
    py: `def suma(n):
    seen = [False] * 10
    s = 0
    while n > 0:
        d = n % 10
        if d % 2 == 1 and not seen[d]:
            seen[d] = True
            s += d
        n //= 10
    return s
`,
    tests: ["4713835", "48", "0", "1", "999999999"],
  },
  {
    slug: "bac-antrenament-2020-v9-3-2",
    subcategoryId: "antrenament-2020-v9",
    title: "Bacalaureat Antrenament 2020, Varianta 9, S3.2 - Cuvinte care au ultimul cuvant ca prefix",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "siruri-caractere"],
    statement:
      "Un cuvant este prefix al unui alt cuvant daca se obtine din acesta, prin eliminarea ultimelor sale litere.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura un numar natural n (n in [2,20]) si apoi n cuvinte distincte, fiecare fiind format din cel mult 20 de caractere, numai litere mici ale alfabetului englez. Programul afiseaza pe ecran, separate prin cate un spatiu, cuvintele care il au drept prefix pe ultimul cuvant citit. Daca nu exista astfel de cuvinte, se afiseaza pe ecran mesajul nu exista.\n\n" +
      "Exemplu: daca n=6 si se citesc cuvintele raita, grai, raid, raion, straie, rai, pe ecran se afiseaza raita raid raion",
    input_format: "Pe prima linie n. Urmeaza n cuvinte, cate unul pe linie.",
    output_format: "Cuvintele (altele decat ultimul) care incep cu ultimul cuvant citit, sau mesajul 'nu exista'.",
    constraints: "2 <= n <= 20",
    hints: "Ultimul cuvant citit este referinta; verificati pentru fiecare alt cuvant daca incepe cu referinta.",
    explanation: "Se citesc toate cele n cuvinte; ultimul citit este referinta. Se verifica fiecare alt cuvant (diferit de referinta) daca incepe cu referinta (adica referinta este prefixul sau); daca da, se afiseaza. Daca niciunul nu satisface conditia, se afiseaza mesajul cerut.\n\n**Complexitate:** O(n * lungime maxima cuvant)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<string> w(n);
    for (auto& x : w) cin >> x;
    string last = w[n - 1];
    vector<string> rez;
    for (int i = 0; i < n; i++) {
        if (w[i] == last) continue;
        if (w[i].size() >= last.size() && w[i].substr(0, last.size()) == last) rez.push_back(w[i]);
    }
    if (rez.empty()) { cout << "nu exista\\n"; return 0; }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `n = int(input())
w = [input().strip() for _ in range(n)]
last = w[-1]
rez = [x for x in w if x != last and x.startswith(last)]
print("nu exista" if not rez else " ".join(rez))
`,
    tests: [
      "6\nraita\ngrai\nraid\nraion\nstraie\nrai",
      "2\nab\nabc",
      "2\nabc\nab",
      "3\nxx\nyy\nzz",
      "4\ncar\ncarte\ncarton\ncar",
    ],
  },
  {
    slug: "bac-antrenament-2020-v9-3-3",
    subcategoryId: "antrenament-2020-v9",
    title: "Bacalaureat Antrenament 2020, Varianta 9, S3.3 - Lungimea maxima a unei k-secvente",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Numim k-secventa intr-un sir de numere naturale, o succesiune de termeni aflati pe pozitii consecutive in sir, cu proprietatea ca sunt divizibili cu numarul natural nenul k. Lungimea secventei este egala cu numarul de termeni ai sai.\n\n" +
      "Fisierul bac.txt contine numere naturale din intervalul [0,10^9]: pe prima linie un numar nenul k, iar pe a doua linie un sir de cel mult 10^6 numere, separate prin cate un spatiu. Cel putin un termen din sir este divizibil cu k. Se cere sa se afiseze pe ecran doua valori, separate printr-un spatiu, reprezentand lungimea maxima a unei k-secvente din sirul aflat in fisier, respectiv numarul de astfel de secvente. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul are continutul k=5, sirul 2 10 5 20 21 0 10 60 15 3 9 20 20 5 45, se afiseaza 4 2",
    input_format: "Fisierul bac.txt: k pe prima linie, sirul pe a doua.",
    output_format: "Lungimea maxima a unei k-secvente si numarul de astfel de secvente.",
    constraints: "cel mult 10^6 termeni",
    hints: "Parcurgeti sirul o singura data, mentinand lungimea secventei curente de multipli ai lui k; la finalul fiecarei secvente, comparati lungimea cu maximul retinut.",
    explanation: "Se parcurge sirul o singura data, mentinand lungimea secventei curente de termeni divizibili cu k (reset la 0 cand se intalneste un termen nedivizibil). Cand o secventa se incheie (termen nedivizibil sau finalul sirului), lungimea ei finala se compara cu maximul retinut: daca este mai mare, se actualizeaza maximul si contorul de aparitii la 1; daca este egala, se incrementeaza contorul.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    long long k; cin >> k;
    long long v, cur = 0, bestLen = 0, bestCnt = 0;
    auto closeRun = [&]() {
        if (cur > 0) {
            if (cur > bestLen) { bestLen = cur; bestCnt = 1; }
            else if (cur == bestLen) bestCnt++;
        }
        cur = 0;
    };
    while (cin >> v) {
        if (v % k == 0) cur++;
        else closeRun();
    }
    closeRun();
    cout << bestLen << " " << bestCnt << "\\n";
    return 0;
}
`,
    py: `with open("bac.txt") as f:
    k = int(f.readline())
    data = f.readline().split()
cur = 0
best_len = 0
best_cnt = 0

def close_run():
    global cur, best_len, best_cnt
    if cur > 0:
        if cur > best_len:
            best_len, best_cnt = cur, 1
        elif cur == best_len:
            best_cnt += 1
    cur = 0

for tok in data:
    v = int(tok)
    if v % k == 0:
        cur += 1
    else:
        close_run()
close_run()
print(best_len, best_cnt)
`,
    tests: [
      "5\n2 10 5 20 21 0 10 60 15 3 9 20 20 5 45",
      "3\n3 6 9",
      "2\n1 2 4 1 6 8 1",
      "10\n10 20 30 40",
      (() => {
        const parts = [];
        for (let i = 0; i < 20000; i++) parts.push(String(i % 4 === 0 ? i : i * 3 + 1));
        return `2\n${parts.join(" ")}`;
      })(),
    ],
  },
  // ===================== VARIANTA 10 (Testul 10) =====================
  {
    slug: "bac-antrenament-2020-v10-3-1",
    subcategoryId: "antrenament-2020-v10",
    title: "Bacalaureat Antrenament 2020, Varianta 10, S3.1 - Produsul cifrelor pare distincte",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "cifre"],
    statement:
      "Subprogramul produs are doi parametri:\n" +
      "- n, prin care primeste un numar natural (n in [0,10^9]);\n" +
      "- p, prin care furnizeaza produsul cifrelor pare distincte din scrierea acestuia, sau -1 daca nu exista astfel de cifre.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=1622325, dupa apel p=12 (12=6*2), iar daca n=122325, dupa apel p=2.",
    input_format: "Se citeste de la tastatura n.",
    output_format: "Produsul cifrelor pare distincte ale lui n, sau -1 daca nu exista.",
    constraints: "0 <= n <= 10^9",
    hints: "Marcati cifrele pare deja folosite; inmultiti rezultatul cu fiecare cifra para distincta gasita (inclusiv 0, daca apare).",
    explanation: "Se parcurg cifrele lui n; pentru fiecare cifra para nevazuta pana atunci, se marcheaza si se inmulteste in rezultat. Daca nu s-a gasit nicio cifra para, se returneaza -1.\n\n**Complexitate:** O(numar de cifre)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    long long p;
    produs(n, p);
    cout << p << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(produs(n))
`,
    cpp: `void produs(long long n, long long& p) {
    bool seen[10] = {false};
    bool found = false;
    p = 1;
    if (n == 0) { p = 0; return; }
    long long t = n;
    while (t > 0) {
        int d = (int)(t % 10);
        if (d % 2 == 0 && !seen[d]) { seen[d] = true; p *= d; found = true; }
        t /= 10;
    }
    if (!found) p = -1;
}
`,
    py: `def produs(n):
    if n == 0:
        return 0
    seen = [False] * 10
    p = 1
    found = False
    t = n
    while t > 0:
        d = t % 10
        if d % 2 == 0 and not seen[d]:
            seen[d] = True
            p *= d
            found = True
        t //= 10
    return p if found else -1
`,
    tests: ["1622325", "122325", "0", "13579", "2468"],
  },
  {
    slug: "bac-antrenament-2020-v10-3-2",
    subcategoryId: "antrenament-2020-v10",
    title: "Bacalaureat Antrenament 2020, Varianta 10, S3.2 - Inserarea cuvantului succes",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "siruri-caractere"],
    statement:
      "Intr-un text cu cel mult 100 de caractere cuvintele sunt formate din litere mici ale alfabetului englez si sunt separate prin cate un spatiu. Scrieti un program C/C++ care citeste de la tastatura un text de tipul mentionat, pe care il modifica in memorie, inserand cuvantul succes intre oricare doua cuvinte ale sale care se termina cu aceeasi litera. Cuvantul inserat este separat prin cate un spatiu de cuvintele vecine. Textul transformat este afisat pe ecran, iar daca nu exista perechi de astfel de cuvinte, se afiseaza pe ecran mesajul nu exista.\n\n" +
      "Exemplu: daca textul citit este testez validez utilizez date corecte acum se obtine textul testez succes validez succes utilizez date succes corecte acum",
    input_format: "Se citeste o linie de text.",
    output_format: "Textul cu 'succes' inserat intre orice doi vecini cu aceeasi ultima litera, sau mesajul 'nu exista'.",
    constraints: "text de cel mult 100 de caractere",
    hints: "Parcurgeti cuvintele; de fiecare data cand ultima litera a cuvantului curent coincide cu ultima litera a cuvantului anterior, inserati 'succes' inaintea cuvantului curent.",
    explanation: "Se parcurg cuvintele in ordine, construind rezultatul: dupa primul cuvant, pentru fiecare cuvant urmator se verifica daca ultima sa litera coincide cu ultima litera a cuvantului anterior; daca da, se insereaza 'succes' inaintea sa. Daca nicio inserare nu a avut loc, se afiseaza mesajul cerut.\n\n**Complexitate:** O(lungimea textului)",
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
    vector<string> rez;
    bool any = false;
    rez.push_back(words[0]);
    for (size_t i = 1; i < words.size(); i++) {
        if (words[i - 1].back() == words[i].back()) { rez.push_back("succes"); any = true; }
        rez.push_back(words[i]);
    }
    if (!any) { cout << "nu exista\\n"; return 0; }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `words = input().split()
rez = [words[0]]
any_found = False
for i in range(1, len(words)):
    if words[i - 1][-1] == words[i][-1]:
        rez.append("succes")
        any_found = True
    rez.append(words[i])
print("nu exista" if not any_found else " ".join(rez))
`,
    tests: [
      "testez validez utilizez date corecte acum",
      "ab cd",
      "ab ac ad",
      "a b c",
      "aaa aab abc",
    ],
  },
  {
    slug: "bac-antrenament-2020-v10-3-3",
    subcategoryId: "antrenament-2020-v10",
    title: "Bacalaureat Antrenament 2020, Varianta 10, S3.3 - Ratia progresiei aritmetice maxime",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Un sir format din cel putin trei termeni formeaza o progresie aritmetica de ratie r daca diferenta dintre oricare termen al acestuia si cel aflat pe pozitia consecutiva in sir este egala cu r.\n\n" +
      "Fisierul text bac.txt contine un sir de cel putin trei si cel mult 10^6 numere intregi din intervalul [-10^8,10^8]. Numerele sunt separate prin cate un spatiu. Se cere sa se afiseze pe ecran ratia unei secvente din sir cu numar maxim de termeni, secventa care formeaza o progresie aritmetica. Daca exista mai multe astfel de secvente de lungime maxima se afiseaza ratia cea mai mare, iar daca nu exista nicio astfel de secventa, se afiseaza pe ecran mesajul nu exista. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine numerele 4 9 14 19 18 17 8 5 3 1 -1 -3 -5 -7 pe ecran se afiseaza valoarea -2 (corespunzatoare secventei 5 3 1 -1 -3 -5 -7).",
    input_format: "Fisierul bac.txt: un sir de numere intregi, separate prin spatiu.",
    output_format: "Ratia celei mai lungi secvente-progresie-aritmetica (cea mai mare ratie la egalitate de lungime), sau mesajul 'nu exista'.",
    constraints: "cel putin 3, cel mult 10^6 termeni",
    hints: "Calculati diferentele consecutive; grupati-le in 'runde' de valori egale; fiecare runda de lungime L (in diferente) corespunde unei progresii de L+1 termeni cu ratia egala cu diferenta respectiva.",
    explanation: "Se calculeaza, pe parcursul unei singure treceri, diferentele dintre termeni consecutivi. O secventa de diferente consecutive egale, de lungime L, corespunde unei progresii aritmetice de L+1 termeni cu ratia egala cu acea diferenta. Se retine, pe parcurs, cea mai mare lungime de progresie gasita si, la egalitate, ratia cea mai mare. Daca lungimea maxima gasita este sub 3 (adica nicio runda de diferente egale de lungime >=2), se afiseaza mesajul cerut.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    vector<long long> a;
    long long v;
    while (cin >> v) a.push_back(v);
    int n = (int)a.size();
    long long bestLen = 0, bestR = 0;
    bool has = false;
    long long curDiff = a[1] - a[0];
    long long curRun = 1;
    auto closeRun = [&]() {
        long long apLen = curRun + 1;
        if (apLen >= 3) {
            if (apLen > bestLen || (apLen == bestLen && curDiff > bestR)) { bestLen = apLen; bestR = curDiff; has = true; }
        }
    };
    for (int i = 2; i < n; i++) {
        long long diff = a[i] - a[i - 1];
        if (diff == curDiff) curRun++;
        else { closeRun(); curDiff = diff; curRun = 1; }
    }
    closeRun();
    if (!has) cout << "nu exista\\n"; else cout << bestR << "\\n";
    return 0;
}
`,
    py: `with open("bac.txt") as f:
    a = list(map(int, f.read().split()))
n = len(a)
best_len, best_r, has = 0, 0, False
cur_diff = a[1] - a[0]
cur_run = 1

def close_run():
    global best_len, best_r, has
    ap_len = cur_run + 1
    if ap_len >= 3:
        if ap_len > best_len or (ap_len == best_len and cur_diff > best_r):
            best_len, best_r, has = ap_len, cur_diff, True

for i in range(2, n):
    diff = a[i] - a[i - 1]
    if diff == cur_diff:
        cur_run += 1
    else:
        close_run()
        cur_diff, cur_run = diff, 1
close_run()
print("nu exista" if not has else best_r)
`,
    tests: [
      "4 9 14 19 18 17 8 5 3 1 -1 -3 -5 -7",
      "1 2 3",
      "1 2 4",
      "5 3 1",
      (() => {
        const parts = [];
        for (let i = 0; i < 20000; i++) parts.push(String(i * 2));
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== VARIANTA 11 (Testul 11) =====================
  {
    slug: "bac-antrenament-2020-v11-3-1",
    subcategoryId: "antrenament-2020-v11",
    title: "Bacalaureat Antrenament 2020, Varianta 11, S3.1 - Suma patratelor perfecte din interval",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "cifre"],
    statement:
      "Subprogramul patrate are doi parametri, x si y, prin care primeste cate un numar natural (1<=x<=y<=10^9). Subprogramul afiseaza pe ecran o expresie aritmetica reprezentand suma numerelor din intervalul [x,y] care au proprietatea ca sunt patrate perfecte, urmate de valoarea acestei sume. Termenii sumei sunt intr-o ordine oarecare si sunt separati prin cate un simbol plus (+), iar valoarea sumei este precedata de simbolul egal (=). Daca nu exista niciun astfel de termen, se afiseaza pe ecran mesajul nu exista.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca x=10 si y=50 se poate afisa pe ecran 16+25+36+49=126",
    input_format: "Se citesc de la tastatura x si y.",
    output_format: "Expresia sumei patratelor perfecte din [x,y], sau mesajul 'nu exista'.",
    constraints: "1 <= x <= y <= 10^9",
    hints: "Iterati k de la ceil(sqrt(x)) la floor(sqrt(y)) si insumati k*k.",
    explanation: "Se calculeaza k minim astfel incat k*k>=x si se itereaza k crescator cat timp k*k<=y, colectand aceste patrate perfecte. Aceasta bucla are cel mult sqrt(y) pasi, deci este eficienta chiar si pentru y=10^9. Se afiseaza termenii separati prin '+' urmati de '=' si suma lor.\n\n**Complexitate:** O(sqrt(y))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long x, y; cin >> x >> y;
    patrate(x, y);
    return 0;
}
`,
    function_template_python: `__USER_CODE__

x, y = map(int, input().split())
patrate(x, y)
`,
    cpp: `void patrate(long long x, long long y) {
    long long k = (long long)sqrt((double)x);
    while (k * k < x) k++;
    vector<long long> rez;
    long long sum = 0;
    while (k * k <= y) { rez.push_back(k * k); sum += k * k; k++; }
    if (rez.empty()) { cout << "nu exista\\n"; return; }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? "+" : "");
    cout << "=" << sum << "\\n";
}
`,
    py: `import math

def patrate(x, y):
    k = int(math.isqrt(x))
    while k * k < x:
        k += 1
    rez = []
    total = 0
    while k * k <= y:
        rez.append(k * k)
        total += k * k
        k += 1
    if not rez:
        print("nu exista")
    else:
        print("+".join(map(str, rez)) + f"={total}")
`,
    tests: ["10 50", "1 1", "2 3", "1000000000 1000000000", "100 100"],
  },
  {
    slug: "bac-antrenament-2020-v11-3-2",
    subcategoryId: "antrenament-2020-v11",
    title: "Bacalaureat Antrenament 2020, Varianta 11, S3.2 - Capitalizarea cuvintelor",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "siruri-caractere"],
    statement:
      "Intr-un text cu cel mult 100 de caractere, cuvintele sunt formate din litere mici si mari ale alfabetului englez si sunt separate prin cate un spatiu. Scrieti un program C/C++ care citeste de la tastatura un text de tipul precizat, pe care il transforma, astfel incat fiecare cuvant sa aiba prima litera mare, si toate celelalte litere mici. Textul obtinut se afiseaza pe ecran.\n\n" +
      "Exemplu: daca de la tastatura se introduce textul ABIA aSTept sa Merg lA scoala se obtine textul Abia Astept Sa Merg La Scoala",
    input_format: "Se citeste o linie de text.",
    output_format: "Textul cu fiecare cuvant capitalizat (prima litera mare, restul mici).",
    constraints: "text de cel mult 100 de caractere",
    hints: "Pentru fiecare cuvant, transformati toate literele in litere mici, apoi transformati prima litera in litera mare.",
    explanation: "Pentru fiecare cuvant se transforma toate literele in litere mici, apoi se transforma prima litera in litera mare. Cuvintele transformate se afiseaza separate prin spatiu.\n\n**Complexitate:** O(lungimea textului)",
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
        for (auto& c : w) c = tolower((unsigned char)c);
        w[0] = toupper((unsigned char)w[0]);
        rez.push_back(w);
    }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `words = input().split()
rez = [w.lower().capitalize() for w in words]
print(" ".join(rez))
`,
    tests: [
      "ABIA aSTept sa Merg lA scoala",
      "ab",
      "AB CD EF",
      "aB Cd",
      "test TEST test",
    ],
  },
  {
    slug: "bac-antrenament-2020-v11-3-3",
    subcategoryId: "antrenament-2020-v11",
    title: "Bacalaureat Antrenament 2020, Varianta 11, S3.3 - Fiecare numar distinct si numarul aparitiilor",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.txt contine un sir crescator de cel mult 10^6 numere naturale din intervalul [0,10^9], separate prin cate un spatiu. Se cere sa se afiseze pe ecran fiecare numar distinct din sir, urmat de numarul de aparitii ale acestuia in sir. Numerele afisate sunt separate prin cate un spatiu. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul bac.txt contine numerele 0 0 0 5 5 5 5 7 7 11 20 20 se afiseaza 0 3 5 4 7 2 11 1 20 2",
    input_format: "Fisierul bac.txt: un sir crescator de numere naturale, separate prin spatiu.",
    output_format: "Fiecare numar distinct urmat de numarul sau de aparitii, in ordinea din sir.",
    constraints: "cel mult 10^6 termeni, deja sortati crescator",
    hints: "Deoarece sirul este sortat, aparitiile aceleiasi valori sunt consecutive. Parcurgeti o singura data, numarand lungimea fiecarui grup.",
    explanation: "Deoarece sirul este deja sortat crescator, toate aparitiile aceleiasi valori sunt grupate consecutiv. Se parcurge sirul o singura data, numarand lungimea fiecarui grup; cand un grup se incheie, se afiseaza valoarea si numarul de aparitii.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    long long v, prev = -1, cnt = 0;
    bool any = false;
    vector<pair<long long,long long>> rez;
    while (cin >> v) {
        if (v == prev) cnt++;
        else {
            if (any) rez.push_back({prev, cnt});
            prev = v; cnt = 1; any = true;
        }
    }
    if (any) rez.push_back({prev, cnt});
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i].first << " " << rez[i].second << (i + 1 < rez.size() ? " " : "\\n");
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
        if prev is not None:
            rez.append((prev, cnt))
        prev, cnt = v, 1
if prev is not None:
    rez.append((prev, cnt))
print(" ".join(f"{a} {b}" for a, b in rez))
`,
    tests: [
      "0 0 0 5 5 5 5 7 7 11 20 20",
      "1",
      "1 1 1 1",
      "1 2 3 4",
      (() => {
        const parts = [];
        for (let v = 0; v < 5000; v++) { parts.push(String(v)); parts.push(String(v)); parts.push(String(v)); }
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== VARIANTA 12 (Testul 12) =====================
  {
    slug: "bac-antrenament-2020-v12-3-1",
    subcategoryId: "antrenament-2020-v12",
    title: "Bacalaureat Antrenament 2020, Varianta 12, S3.1 - Cea mai mare putere a lui 2",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "cifre"],
    statement:
      "Subprogramul pDoi are un singur parametru, n, prin care primeste un numar natural (n in [1,10^9]). Subprogramul returneaza cea mai mare valoare din intervalul [1,n], cu proprietatea ca este o putere a lui 2.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=20, subprogramul returneaza 16.",
    input_format: "Se citeste de la tastatura n.",
    output_format: "Cea mai mare putere a lui 2, mai mica sau egala cu n.",
    constraints: "1 <= n <= 10^9",
    hints: "Dublati o valoare p pornind de la 1, cat timp p*2<=n.",
    explanation: "Se porneste de la p=1 si se dubleaza repetat, cat timp 2*p<=n; rezultatul final este cea mai mare putere de 2 care nu depaseste n.\n\n**Complexitate:** O(log n)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    cout << pDoi(n) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(pDoi(n))
`,
    cpp: `long long pDoi(long long n) {
    long long p = 1;
    while (p * 2 <= n) p *= 2;
    return p;
}
`,
    py: `def pDoi(n):
    p = 1
    while p * 2 <= n:
        p *= 2
    return p
`,
    tests: ["20", "1", "1000000000", "1024", "1023"],
  },
  {
    slug: "bac-antrenament-2020-v12-3-2",
    subcategoryId: "antrenament-2020-v12",
    title: "Bacalaureat Antrenament 2020, Varianta 12, S3.2 - Eliminarea ultimei vocale din text",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "siruri-caractere"],
    statement:
      "Intr-un text cu cel mult 100 de caractere, cuvintele sunt formate din litere mici ale alfabetului englez si sunt separate prin cate un spatiu. Scrieti un program C/C++ care citeste de la tastatura un text de tipul precizat, pe care il transforma in memorie, eliminand numai ultima vocala care apare in text. Programul afiseaza pe ecran textul obtinut sau mesajul nu exista, daca in text nu exista nicio vocala. Se considera vocale literele a, e, i, o, u.\n\n" +
      "Exemplu: daca se citeste textul cuvantul ritm poate fi tradus rhythm se obtine textul cuvantul ritm poate fi trads rhythm",
    input_format: "Se citeste o linie de text.",
    output_format: "Textul cu ultima vocala (cea mai din dreapta din intreg textul) eliminata, sau mesajul 'nu exista'.",
    constraints: "text de cel mult 100 de caractere",
    hints: "Cautati de la dreapta la stanga in intreg sirul de text (inclusiv spatiile) prima vocala intalnita si eliminati-o.",
    explanation: "Se cauta, parcurgand textul de la ultimul caracter spre primul, prima vocala intalnita (aceasta este ultima vocala din text). Daca este gasita, se elimina acel caracter din text; altfel se afiseaza mesajul cerut.\n\n**Complexitate:** O(lungimea textului)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
bool isVowelV12(char c) { return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u'; }
int main() {
    string line;
    getline(cin, line);
    int idx = -1;
    for (int i = (int)line.size() - 1; i >= 0; i--) if (isVowelV12(line[i])) { idx = i; break; }
    if (idx == -1) { cout << "nu exista\\n"; return 0; }
    line.erase(line.begin() + idx);
    cout << line << "\\n";
    return 0;
}
`,
    py: `def is_vowel_v12(c):
    return c in "aeiou"

line = input()
idx = -1
for i in range(len(line) - 1, -1, -1):
    if is_vowel_v12(line[i]):
        idx = i
        break
if idx == -1:
    print("nu exista")
else:
    print(line[:idx] + line[idx + 1:])
`,
    tests: [
      "cuvantul ritm poate fi tradus rhythm",
      "bcdfg hjklm",
      "a",
      "aeiou",
      "test text txt",
    ],
  },
  {
    slug: "bac-antrenament-2020-v12-3-3",
    subcategoryId: "antrenament-2020-v12",
    title: "Bacalaureat Antrenament 2020, Varianta 12, S3.3 - Termenii sirului 1..10,20,21,42,43,86...",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "eficienta", "fisiere", "siruri"],
    statement:
      "Sirul de mai jos este definit astfel: fn=n daca n<=10, fn=2*fn-1 daca n>10 si n impar, fn=1+fn-1 altfel (n par, n>10).\n" +
      "1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 21, 42, 43, 86....\n\n" +
      "Se citeste de la tastatura un numar natural x (x in [1,10^9]), termen al sirului dat, si se cere sa se scrie in fisierul bac.out, separati prin cate un spatiu, in ordine strict descrescatoare, toti termenii sirului mai mici sau egali cu x. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca valoarea citita de la tastatura este 43 se scriu in fisier numerele 43 42 21 20 10 9 8 7 6 5 4 3 2 1",
    input_format: "Se citeste x de la tastatura.",
    output_format: "Se scriu in fisierul bac.out toti termenii sirului <= x, in ordine descrescatoare.",
    constraints: "1 <= x <= 10^9",
    hints: "Sirul creste rapid (aproape dublare la fiecare 2 pasi dupa n=10), deci numarul de termeni <=x este mic. Generati direct din recurenta.",
    explanation: "Se genereaza termenii sirului direct din definitie, incepand cu f1=1,...,f10=10, apoi continuand cu regula pentru n>10, oprindu-se la primul termen ce depaseste x. Deoarece sirul creste aproape exponential dupa termenul al 10-lea, numarul de termeni generati este mic (cateva zeci) indiferent de x. Lista se scrie inversata (descrescator) in fisier.\n\n**Complexitate:** O(log x) timp si spatiu",
    io: { input_source: "stdin", input_filename: null, output_target: "file", output_filename: "bac.out" },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long x; cin >> x;
    vector<long long> f;
    for (int n = 1; n <= 10; n++) { if (n > x) break; f.push_back(n); }
    int n = (int)f.size() + 1;
    while (!f.empty()) {
        long long next;
        if (n % 2 == 1) next = 2 * f.back();
        else next = 1 + f.back();
        if (next > x) break;
        f.push_back(next);
        n++;
    }
    freopen("bac.out", "w", stdout);
    for (int i = (int)f.size() - 1; i >= 0; i--) cout << f[i] << (i > 0 ? " " : "\\n");
    return 0;
}
`,
    py: `x = int(input())
f = []
for n in range(1, 11):
    if n > x:
        break
    f.append(n)
n = len(f) + 1
while f:
    if n % 2 == 1:
        nxt = 2 * f[-1]
    else:
        nxt = 1 + f[-1]
    if nxt > x:
        break
    f.append(nxt)
    n += 1
f.reverse()
with open("bac.out", "w") as out:
    out.write(" ".join(map(str, f)))
    out.write("\\n")
`,
    tests: ["43", "1", "5", "10", "1000000000"],
  },
];

module.exports = problems;
