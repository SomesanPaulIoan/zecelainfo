const problems = [
  // ===================== VARIANTA 17 (Testul 17) =====================
  {
    slug: "bac-antrenament-2020-v17-3-1",
    subcategoryId: "antrenament-2020-v17",
    title: "Bacalaureat Antrenament 2020, Varianta 17, S3.1 - Cea mai mare cifra impara",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "cifre"],
    statement:
      "Subprogramul maxim are un singur parametru, n, prin care primeste un numar natural (n in [0,10^9]). Subprogramul returneaza cea mai mare cifra impara din scrierea acestuia, sau -1 daca nu exista astfel de cifre. Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=5672883, subprogramul returneaza 7.",
    input_format: "Se citeste de la tastatura n.",
    output_format: "Cea mai mare cifra impara din n, sau -1 daca nu exista.",
    constraints: "0 <= n <= 10^9",
    hints: "Parcurgeti cifrele lui n, retinand maximul dintre cele impare.",
    explanation: "Se parcurg cifrele lui n; se retine maximul dintre cifrele impare intalnite. Daca nu s-a gasit nicio cifra impara, se returneaza -1.\n\n**Complexitate:** O(numar de cifre)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    cout << maxim(n) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(maxim(n))
`,
    cpp: `int maxim(long long n) {
    int mx = -1;
    if (n == 0) return -1;
    while (n > 0) {
        int d = (int)(n % 10);
        if (d % 2 == 1 && d > mx) mx = d;
        n /= 10;
    }
    return mx;
}
`,
    py: `def maxim(n):
    mx = -1
    while n > 0:
        d = n % 10
        if d % 2 == 1 and d > mx:
            mx = d
        n //= 10
    return mx
`,
    tests: ["5672883", "0", "2468", "1", "999999999"],
  },
  {
    slug: "bac-antrenament-2020-v17-3-2",
    subcategoryId: "antrenament-2020-v17",
    title: "Bacalaureat Antrenament 2020, Varianta 17, S3.2 - Duplicarea cuvintelor formate numai din vocale",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "siruri-caractere"],
    statement:
      "Intr-un text cu cel mult 100 de caractere cuvintele sunt formate din litere mici ale alfabetului englez si sunt separate prin cate un spatiu. Scrieti un program C/C++ care citeste de la tastatura un text de tipul mentionat, pe care il modifica in memorie, duplicand fiecare cuvant format numai din vocale. Cuvantul duplicat este separat prin cate un spatiu de cuvintele vecine. Textul transformat este afisat pe ecran, iar daca nu exista astfel de cuvinte, se afiseaza pe ecran mesajul nu exista.\n\n" +
      "Exemplu: daca textul citit este oaia aia alba e a ei se obtine textul oaia oaia aia aia alba e e a a ei ei",
    input_format: "Se citeste o linie de text.",
    output_format: "Textul cu fiecare cuvant format numai din vocale duplicat, sau mesajul 'nu exista'.",
    constraints: "text de cel mult 100 de caractere",
    hints: "Pentru fiecare cuvant, verificati daca toate literele sale sunt vocale; daca da, afisati-l de doua ori.",
    explanation: "Pentru fiecare cuvant se verifica daca este format exclusiv din vocale; daca da, se afiseaza de doua ori (separat prin spatiu), altfel o singura data. Daca niciun cuvant nu a fost format exclusiv din vocale, se afiseaza mesajul cerut in loc de text.\n\n**Complexitate:** O(lungimea textului)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
bool isVowelV17(char c) { return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u'; }
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    string w;
    vector<string> rez;
    bool any = false;
    while (ss >> w) {
        bool allVowel = true;
        for (char c : w) if (!isVowelV17(c)) { allVowel = false; break; }
        if (allVowel) { rez.push_back(w); rez.push_back(w); any = true; }
        else rez.push_back(w);
    }
    if (!any) { cout << "nu exista\\n"; return 0; }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `def is_vowel_v17(c):
    return c in "aeiou"

words = input().split()
rez = []
any_found = False
for w in words:
    if all(is_vowel_v17(c) for c in w):
        rez.append(w)
        rez.append(w)
        any_found = True
    else:
        rez.append(w)
print("nu exista" if not any_found else " ".join(rez))
`,
    tests: [
      "oaia aia alba e a ei",
      "abc def",
      "aeiou",
      "a bc a",
      "ei ou io",
    ],
  },
  {
    slug: "bac-antrenament-2020-v17-3-3",
    subcategoryId: "antrenament-2020-v17",
    title: "Bacalaureat Antrenament 2020, Varianta 17, S3.3 - Intervale fara niciun termen al sirului",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul text bac.txt contine numere naturale din intervalul [1,10^4]: pe prima linie un numar n, pe a doua linie un sir de n numere, iar pe fiecare dintre urmatoarele linii, pana la finalul fisierului, cate o pereche de numere, reprezentand extremitatile unui interval inchis. Numerele aflate pe aceeasi linie a fisierului sunt in ordine crescatoare si sunt separate prin cate un spatiu.\n\n" +
      "Se cere sa se afiseze pe ecran numarul de intervale care nu contin niciun termen al sirului aflat pe a doua linie a fisierului. Proiectati un algoritm eficient din punctul de vedere al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine n=5, sirul 4 8 9 16 25, apoi intervalele [1,3],[2,5],[9,15],[5,7],[20,100],[10,12], se afiseaza pe ecran 3.",
    input_format: "Fisierul bac.txt: n pe prima linie, sirul (crescator) pe a doua, cate un interval [a,b] pe fiecare linie urmatoare, pana la EOF.",
    output_format: "Numarul de intervale care nu contin niciun termen al sirului.",
    constraints: "1 <= n <= 10^4, valori in [1,10^4]",
    hints: "Sirul este sortat; pentru fiecare interval [a,b], cautati binar primul element >=a si verificati daca este <=b.",
    explanation: "Deoarece sirul de pe linia 2 este deja sortat crescator, pentru fiecare interval [a,b] se cauta binar cel mai mic element >=a; daca acest element exista si este <=b, intervalul contine un termen al sirului (nu se numara); altfel, intervalul nu contine niciun termen (se numara).\n\n**Complexitate:** O(m log n), unde m este numarul de intervale",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    int n; cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    long long lo, hi;
    int cnt = 0;
    while (cin >> lo >> hi) {
        auto it = lower_bound(a.begin(), a.end(), lo);
        if (it == a.end() || *it > hi) cnt++;
    }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `import bisect

with open("bac.txt") as f:
    n = int(f.readline())
    a = list(map(int, f.readline().split()))
    cnt = 0
    for line in f:
        parts = line.split()
        if not parts:
            continue
        lo, hi = int(parts[0]), int(parts[1])
        idx = bisect.bisect_left(a, lo)
        if idx == len(a) or a[idx] > hi:
            cnt += 1
print(cnt)
`,
    tests: [
      "5\n4 8 9 16 25\n1 3\n2 5\n9 15\n5 7\n20 100\n10 12",
      "1\n5\n1 4\n5 5\n6 10",
      "3\n1 2 3\n1 1\n2 2\n4 5",
      "2\n1 10000\n1 5\n5000 6000\n10001 10001",
      (() => {
        const lines = ["1", "5000"];
        for (let i = 0; i < 5000; i++) lines.push(`${i * 2 + 1} ${i * 2 + 2}`);
        return lines.join("\n");
      })(),
    ],
  },
  // ===================== VARIANTA 18 (Testul 18) =====================
  {
    slug: "bac-antrenament-2020-v18-3-1",
    subcategoryId: "antrenament-2020-v18",
    title: "Bacalaureat Antrenament 2020, Varianta 18, S3.1 - Suma cifrelor pare distincte",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "cifre"],
    statement:
      "Subprogramul suma are doi parametri:\n" +
      "- n, prin care primeste un numar natural din intervalul [0,10^9];\n" +
      "- s, prin care furnizeaza suma cifrelor pare distincte din scrierea acestuia.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=67638825, dupa apel s=16 (16=6+8+2), iar daca n=15, dupa apel s=0.",
    input_format: "Se citeste de la tastatura n.",
    output_format: "Suma cifrelor pare distincte ale lui n.",
    constraints: "0 <= n <= 10^9",
    hints: "Marcati cifrele pare deja folosite; insumati o singura data fiecare cifra para distincta gasita.",
    explanation: "Se parcurg cifrele lui n; pentru fiecare cifra para nevazuta pana atunci, se marcheaza ca vazuta si se aduna la suma.\n\n**Complexitate:** O(numar de cifre)",
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
        if (d % 2 == 0 && !seen[d]) { seen[d] = true; s += d; }
        n /= 10;
    }
}
`,
    py: `def suma(n):
    seen = [False] * 10
    s = 0
    while n > 0:
        d = n % 10
        if d % 2 == 0 and not seen[d]:
            seen[d] = True
            s += d
        n //= 10
    return s
`,
    tests: ["67638825", "15", "0", "2468", "13579"],
  },
  {
    slug: "bac-antrenament-2020-v18-3-2",
    subcategoryId: "antrenament-2020-v18",
    title: "Bacalaureat Antrenament 2020, Varianta 18, S3.2 - Cuvinte care au al k-lea cuvant ca sufix",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "siruri-caractere"],
    statement:
      "Un cuvant este sufix al unui alt cuvant daca se obtine din acesta, prin eliminarea primelor sale litere.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura doua numere naturale n si k (n in [2,20], k in [1,n]) si apoi n cuvinte distincte, fiecare fiind format din cel mult 20 de caractere, numai litere mici ale alfabetului englez. Programul afiseaza pe ecran, separate prin cate un spatiu, cuvintele care il au drept sufix pe al k-lea cuvant citit. Daca nu exista astfel de cuvinte, se afiseaza pe ecran mesajul nu exista.\n\n" +
      "Exemplu: daca n=7, k=3 si se citesc cuvintele isihast, paratirisi, isi, meremetisire, acolisitor, hiritisi, paraponisit, pe ecran se afiseaza paratirisi hiritisi",
    input_format: "Pe prima linie n si k. Urmeaza n cuvinte, cate unul pe linie.",
    output_format: "Cuvintele (diferite de al k-lea) care se termina cu al k-lea cuvant, sau mesajul 'nu exista'.",
    constraints: "2 <= n <= 20, 1 <= k <= n",
    hints: "Al k-lea cuvant este referinta; verificati pentru fiecare alt cuvant daca se termina cu referinta.",
    explanation: "Se citesc toate cele n cuvinte; al k-lea (1-indexat) este referinta. Se verifica fiecare alt cuvant (diferit de referinta) daca se termina cu referinta (adica referinta este sufixul sau); daca da, se afiseaza. Daca niciunul nu satisface conditia, se afiseaza mesajul cerut.\n\n**Complexitate:** O(n * lungime maxima cuvant)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, k; cin >> n >> k;
    vector<string> w(n);
    for (auto& x : w) cin >> x;
    string ref = w[k - 1];
    vector<string> rez;
    for (int i = 0; i < n; i++) {
        if (w[i] == ref) continue;
        if (w[i].size() >= ref.size() && w[i].substr(w[i].size() - ref.size()) == ref) rez.push_back(w[i]);
    }
    if (rez.empty()) { cout << "nu exista\\n"; return 0; }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `n, k = map(int, input().split())
w = [input().strip() for _ in range(n)]
ref = w[k - 1]
rez = [x for x in w if x != ref and x.endswith(ref)]
print("nu exista" if not rez else " ".join(rez))
`,
    tests: [
      "7 3\nisihast\nparatirisi\nisi\nmeremetisire\nacolisitor\nhiritisi\nparaponisit",
      "2 1\nab\nxab",
      "2 2\nxab\nab",
      "3 1\nxx\nyy\nzz",
      "4 2\ncar\ncarte\nscar\ncar",
    ],
  },
  {
    slug: "bac-antrenament-2020-v18-3-3",
    subcategoryId: "antrenament-2020-v18",
    title: "Bacalaureat Antrenament 2020, Varianta 18, S3.3 - Lungimea maxima a unei 10-secvente",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Numim 10-secventa intr-un sir de numere naturale, o succesiune de termeni aflati pe pozitii consecutive in sir, cu proprietatea ca sunt multipli ai numarului 10. Lungimea secventei este egala cu numarul de termeni ai sai.\n\n" +
      "Fisierul bac.txt contine un sir de cel mult 10^6 numere naturale din intervalul [0,10^9], separate prin cate un spatiu. Cel putin un termen din sir este multiplu al lui 10. Se cere sa se afiseze pe ecran doua valori, separate printr-un spatiu, reprezentand lungimea maxima a unei 10-secvente din sirul aflat in fisier, respectiv numarul de 10-secvente cu o astfel de lungime. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul are continutul 7 3 200 100 10 9 6 100 1000 40 1002 20 30, se afiseaza 3 2",
    input_format: "Fisierul bac.txt: un sir de numere naturale, separate prin spatiu.",
    output_format: "Lungimea maxima a unei 10-secvente si numarul de astfel de secvente.",
    constraints: "cel mult 10^6 termeni",
    hints: "Parcurgeti sirul o singura data, mentinand lungimea secventei curente de multipli de 10; la finalul fiecarei secvente, comparati lungimea cu maximul retinut.",
    explanation: "Se parcurge sirul o singura data, mentinand lungimea secventei curente de termeni multipli ai lui 10 (reset la 0 cand se intalneste un termen ne-multiplu). Cand o secventa se incheie, lungimea ei finala se compara cu maximul retinut: daca este mai mare, se actualizeaza maximul si contorul de aparitii la 1; daca este egala, se incrementeaza contorul.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    long long v, cur = 0, bestLen = 0, bestCnt = 0;
    auto closeRun = [&]() {
        if (cur > 0) {
            if (cur > bestLen) { bestLen = cur; bestCnt = 1; }
            else if (cur == bestLen) bestCnt++;
        }
        cur = 0;
    };
    while (cin >> v) {
        if (v % 10 == 0) cur++;
        else closeRun();
    }
    closeRun();
    cout << bestLen << " " << bestCnt << "\\n";
    return 0;
}
`,
    py: `cur = 0
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

with open("bac.txt") as f:
    data = f.read().split()
for tok in data:
    v = int(tok)
    if v % 10 == 0:
        cur += 1
    else:
        close_run()
close_run()
print(best_len, best_cnt)
`,
    tests: [
      "7 3 200 100 10 9 6 100 1000 40 1002 20 30",
      "10 20 30",
      "1 2 3",
      "10 20 5 30 40 50",
      (() => {
        const parts = [];
        for (let i = 0; i < 20000; i++) parts.push(String(i % 5 === 0 ? i * 10 : i * 3 + 1));
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== VARIANTA 19 (Testul 19) =====================
  {
    slug: "bac-antrenament-2020-v19-3-1",
    subcategoryId: "antrenament-2020-v19",
    title: "Bacalaureat Antrenament 2020, Varianta 19, S3.1 - Divizori de aceeasi paritate cu n",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "divizori"],
    statement:
      "Subprogramul paritate are doi parametri:\n" +
      "- n, prin care primeste un numar natural (n in [1,10^9]);\n" +
      "- nr prin care furnizeaza numarul de divizori naturali ai lui n cu aceeasi paritate ca n.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=20, dupa apel nr=4 (divizorii lui 20 sunt 1, 2, 4, 5, 10, 20).",
    input_format: "Se citeste de la tastatura n.",
    output_format: "Numarul de divizori ai lui n cu aceeasi paritate ca n.",
    constraints: "1 <= n <= 10^9",
    hints: "Parcurgeti divizorii d de la 1 la radacina patrata a lui n; pentru fiecare pereche de divizori (d, n/d), verificati paritatea fiecaruia fata de n.",
    explanation: "Se parcurg divizorii d de la 1 la radacina patrata a lui n; pentru fiecare d care divide n, se verifica daca d are aceeasi paritate ca n (daca da, se numara), si daca n/d (cand difera de d) are aceeasi paritate ca n (daca da, se numara si el).\n\n**Complexitate:** O(sqrt(n))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    int nr;
    paritate(n, nr);
    cout << nr << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(paritate(n))
`,
    cpp: `void paritate(long long n, int& nr) {
    nr = 0;
    int par = (int)(n % 2);
    for (long long d = 1; d * d <= n; d++) {
        if (n % d == 0) {
            long long e = n / d;
            if ((d % 2) == par) nr++;
            if (e != d && (e % 2) == par) nr++;
        }
    }
}
`,
    py: `def paritate(n):
    nr = 0
    par = n % 2
    d = 1
    while d * d <= n:
        if n % d == 0:
            e = n // d
            if (d % 2) == par:
                nr += 1
            if e != d and (e % 2) == par:
                nr += 1
        d += 1
    return nr
`,
    tests: ["20", "1", "999999937", "1000000000", "16"],
  },
  {
    slug: "bac-antrenament-2020-v19-3-2",
    subcategoryId: "antrenament-2020-v19",
    title: "Bacalaureat Antrenament 2020, Varianta 19, S3.2 - Linie complementara cu linia k",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Intr-un tablou bidimensional, cu elemente avand valori numai in multimea {0,1}, numim linii 'complementare' doua linii cu proprietatea ca oricare doua elemente ale acestora, aflate pe aceeasi coloana, sunt diferite.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura trei numere naturale m, n si k (m,n in [2,20], k in [1,m]) si elementele unui tablou bidimensional cu m linii si n coloane, numere naturale din multimea {0,1}. Programul afiseaza pe ecran mesajul DA daca exista cel putin o linie 'complementara' cu linia a k-a a acestuia, sau mesajul NU in caz contrar.\n\n" +
      "Exemplu: pentru m=7, n=3, k=2 si tabloul\n0 1 0\n1 1 0\n0 0 0\n0 0 1\n0 0 1\n1 1 1\n0 0 1\nse afiseaza pe ecran mesajul DA.",
    input_format: "Se citesc m, n, k, apoi elementele tabloului.",
    output_format: "DA daca exista o linie complementara cu linia k, altfel NU.",
    constraints: "2 <= m, n <= 20, 1 <= k <= m",
    hints: "Pentru fiecare linie i!=k, verificati daca toate elementele difera de cele corespunzatoare din linia k.",
    explanation: "Se citeste tabloul; pentru fiecare linie i diferita de k, se verifica daca toate elementele sale, comparate coloana cu coloana cu linia k, sunt diferite. Daca se gaseste macar o astfel de linie, se afiseaza DA, altfel NU.\n\n**Complexitate:** O(m*n)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int m, n, k; cin >> m >> n >> k;
    vector<vector<int>> a(m + 1, vector<int>(n + 1));
    for (int i = 1; i <= m; i++) for (int j = 1; j <= n; j++) cin >> a[i][j];
    bool found = false;
    for (int i = 1; i <= m && !found; i++) {
        if (i == k) continue;
        bool ok = true;
        for (int j = 1; j <= n; j++) if (a[i][j] == a[k][j]) { ok = false; break; }
        if (ok) found = true;
    }
    cout << (found ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `m, n, k = map(int, input().split())
a = [[0] * (n + 1) for _ in range(m + 1)]
for i in range(1, m + 1):
    row = list(map(int, input().split()))
    for j in range(1, n + 1):
        a[i][j] = row[j - 1]
found = False
for i in range(1, m + 1):
    if i == k:
        continue
    if all(a[i][j] != a[k][j] for j in range(1, n + 1)):
        found = True
        break
print("DA" if found else "NU")
`,
    tests: [
      "7 3 2\n0 1 0\n1 1 0\n0 0 0\n0 0 1\n0 0 1\n1 1 1\n0 0 1",
      "2 2 1\n0 1\n1 0",
      "2 2 1\n0 1\n0 1",
      "3 2 2\n0 0\n1 1\n0 0",
      "2 3 1\n0 1 0\n1 1 1",
    ],
  },
  {
    slug: "bac-antrenament-2020-v19-3-3",
    subcategoryId: "antrenament-2020-v19",
    title: "Bacalaureat Antrenament 2020, Varianta 19, S3.3 - Numerele pare distincte dintr-un sir sortat",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.txt contine, in ordine crescatoare, cel mult 10^6 numere naturale din intervalul [0,10^9], separate prin cate un spatiu. Se cere sa se afiseze pe ecran, in ordine strict crescatoare, separate prin cate un spatiu, numerele pare distincte care apar in fisier. Daca nu exista niciun astfel de numar, se afiseaza pe ecran mesajul nu exista. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine numerele 5 5 6 7 8 8 8 8 10 15 16 16 25 25 49 pe ecran se afiseaza, in aceasta ordine, numerele 6 8 10 16",
    input_format: "Fisierul bac.txt: un sir crescator de numere naturale, separate prin spatiu.",
    output_format: "Numerele pare distincte din sir, in ordine crescatoare, sau mesajul 'nu exista'.",
    constraints: "cel mult 10^6 termeni, deja sortati crescator",
    hints: "Deoarece sirul este sortat, valorile duplicate sunt consecutive; parcurgeti o singura data, retinand doar prima aparitie a fiecarei valori pare.",
    explanation: "Deoarece sirul este deja sortat crescator, se parcurge o singura data, retinand pentru fiecare valoare noua (diferita de precedenta) daca este para; daca da, se afiseaza (o singura data, la prima aparitie).\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    long long v, prev = -1;
    vector<long long> rez;
    bool first = true;
    while (cin >> v) {
        if (first || v != prev) {
            if (v % 2 == 0) rez.push_back(v);
        }
        prev = v; first = false;
    }
    if (rez.empty()) { cout << "nu exista\\n"; return 0; }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `with open("bac.txt") as f:
    data = f.read().split()
rez = []
prev = None
for tok in data:
    v = int(tok)
    if prev is None or v != prev:
        if v % 2 == 0:
            rez.append(v)
    prev = v
print("nu exista" if not rez else " ".join(map(str, rez)))
`,
    tests: [
      "5 5 6 7 8 8 8 8 10 15 16 16 25 25 49",
      "1 3 5",
      "2 2 2",
      "1 2 3 4 5",
      (() => {
        const parts = [];
        for (let v = 0; v < 10000; v++) { parts.push(String(v)); parts.push(String(v)); }
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== VARIANTA 20 (Testul 20) =====================
  {
    slug: "bac-antrenament-2020-v20-3-1",
    subcategoryId: "antrenament-2020-v20",
    title: "Bacalaureat Antrenament 2020, Varianta 20, S3.1 - Transformare in baza 10 dintr-o baza b",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "cifre"],
    statement:
      "Subprogramul transformareBaza10 are doi parametri, b si n, prin care primeste cate un numar natural (b in [2,10], n in [0,10^9]). Subprogramul returneaza suma tuturor produselor de forma c*b^k, unde c este cifra de pe pozitia k in scrierea numarului n; pozitiile sunt numerotate de la dreapta la stanga, iar cifra unitatilor este pe pozitia 0.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca b=2 si n=10010, subprogramul returneaza 18 (18=1*2^4+0*2^3+0*2^2+1*2^1+0*2^0).",
    input_format: "Se citesc b si n.",
    output_format: "Valoarea in baza 10 obtinuta tratand cifrele lui n ca fiind in baza b.",
    constraints: "2 <= b <= 10, 0 <= n <= 10^9",
    hints: "Extrageti cifrele lui n (in ordinea din stanga spre dreapta) si construiti rezultatul cu formula result = result*b + cifra.",
    explanation: "Se extrag cifrele lui n intr-o lista, apoi se calculeaza rezultatul folosind schema Horner: se initializeaza result=0 si, pentru fiecare cifra (de la cea mai semnificativa la cea mai putin semnificativa), result = result*b + cifra.\n\n**Complexitate:** O(numar de cifre)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long b, n; cin >> b >> n;
    cout << transformareBaza10(b, n) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

b, n = map(int, input().split())
print(transformareBaza10(b, n))
`,
    cpp: `long long transformareBaza10(long long b, long long n) {
    string s = to_string(n);
    long long rez = 0;
    for (char c : s) rez = rez * b + (c - '0');
    return rez;
}
`,
    py: `def transformareBaza10(b, n):
    rez = 0
    for c in str(n):
        rez = rez * b + int(c)
    return rez
`,
    tests: ["2 10010", "10 12345", "2 0", "8 777", "9 88"],
  },
  {
    slug: "bac-antrenament-2020-v20-3-2",
    subcategoryId: "antrenament-2020-v20",
    title: "Bacalaureat Antrenament 2020, Varianta 20, S3.2 - Pastrarea partii intregi a numerelor",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "siruri-caractere"],
    statement:
      "Un text cu cel mult 100 de caractere contine cuvinte si numere, separate prin cate un spatiu. Cuvintele sunt formate numai din litere mici ale alfabetului englez, iar numerele sunt reale, pozitive, cu partea intreaga si partea zecimala separate prin simbolul virgula, sau numai cu partea intreaga. Scrieti un program C/C++ care citeste de la tastatura un text de tipul precizat si il transforma in memorie, inlocuind fiecare numar real cu partea intreaga a acestuia.\n\n" +
      "Exemplu: pentru textul partea intreaga a lui 5,75 este egala cu a lui 5,25 si cu a lui 5 si este 5 se afiseaza pe ecran partea intreaga a lui 5 este egala cu a lui 5 si cu a lui 5 si este 5",
    input_format: "Se citeste o linie de text.",
    output_format: "Textul cu fiecare numar inlocuit cu partea sa intreaga (fara virgula).",
    constraints: "text de cel mult 100 de caractere",
    hints: "Pentru fiecare token care contine virgula, pastrati doar partea de dinaintea virgulei.",
    explanation: "Se parcurg tokenurile textului; pentru fiecare token care contine caracterul ',', se pastreaza doar partea de dinaintea virgulei (partea intreaga). Celelalte tokenuri (cuvinte si numere deja intregi) raman neschimbate.\n\n**Complexitate:** O(lungimea textului)",
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
        size_t pos = w.find(',');
        if (pos != string::npos) w = w.substr(0, pos);
        rez.push_back(w);
    }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `words = input().split()
rez = [w.split(',')[0] for w in words]
print(" ".join(rez))
`,
    tests: [
      "partea intreaga a lui 5,75 este egala cu a lui 5,25 si cu a lui 5 si este 5",
      "1,5 2,5 3,5",
      "a b c",
      "10,99 test",
      "5 6,1 7",
    ],
  },
  {
    slug: "bac-antrenament-2020-v20-3-3",
    subcategoryId: "antrenament-2020-v20",
    title: "Bacalaureat Antrenament 2020, Varianta 20, S3.3 - Suma maxima pe aceeasi paritate",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.txt contine un sir de cel mult 10^6 numere naturale din intervalul [0,10^3], separate prin cate un spatiu. Se cere sa se afiseze pe ecran suma maxima obtinuta adunand numere cu aceeasi paritate, aflate pe pozitii consecutive in sirul aflat in fisier. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul bac.txt contine valorile 10 115 1 5 2 2 2 4 7 3 100 20 2 7 se afiseaza pe ecran numarul 122",
    input_format: "Fisierul bac.txt: un sir de numere naturale, separate prin spatiu.",
    output_format: "Suma maxima a unei secvente contigue cu toti termenii de aceeasi paritate.",
    constraints: "cel mult 10^6 termeni",
    hints: "Parcurgeti sirul o singura data, mentinand suma segmentului curent de aceeasi paritate; resetati cand paritatea se schimba, comparand cu maximul retinut.",
    explanation: "Se parcurge sirul o singura data, mentinand suma segmentului curent de termeni cu aceeasi paritate (reset cand paritatea termenului curent difera de cea a segmentului). La fiecare pas se compara suma segmentului curent cu maximul global retinut.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    long long v, curSum = 0, curPar = -1, best = 0;
    bool first = true;
    while (cin >> v) {
        long long par = v % 2;
        if (first || par != curPar) { curSum = v; curPar = par; first = false; }
        else curSum += v;
        best = max(best, curSum);
    }
    cout << best << "\\n";
    return 0;
}
`,
    py: `cur_sum = 0
cur_par = -1
best = 0
first = True
with open("bac.txt") as f:
    data = f.read().split()
for tok in data:
    v = int(tok)
    par = v % 2
    if first or par != cur_par:
        cur_sum = v
        cur_par = par
        first = False
    else:
        cur_sum += v
    best = max(best, cur_sum)
print(best)
`,
    tests: [
      "10 115 1 5 2 2 2 4 7 3 100 20 2 7",
      "1 3 5",
      "2 4 6",
      "1 2 3 4 5",
      (() => {
        const parts = [];
        for (let i = 0; i < 20000; i++) parts.push(String(i % 6 < 3 ? (i % 6) * 2 : (i % 6)));
        return parts.join(" ");
      })(),
    ],
  },
];

module.exports = problems;
