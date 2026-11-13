const problems = [
  // ===================== VARIANTA 5 (Testul 5) =====================
  {
    slug: "bac-antrenament-2020-v5-3-1",
    subcategoryId: "antrenament-2020-v5",
    title: "Bacalaureat Antrenament 2020, Varianta 5, S3.1 - Cea mai mica baza de numeratie",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "cifre"],
    statement:
      "Un numar este scris in baza de numeratie b (b<=10) daca cifrele sale apartin intervalului [0,b-1].\n\n" +
      "Subprogramul baza are un singur parametru, n, prin care primeste un numar natural (n in [0,10^9]). Subprogramul returneaza cea mai mica baza din intervalul [2,10] careia i-ar putea corespunde scrierea lui n. Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=50731, subprogramul returneaza numarul 8.",
    input_format: "Se citeste de la tastatura n.",
    output_format: "Se afiseaza cea mai mica baza b in [2,10] pentru care toate cifrele lui n sunt < b.",
    constraints: "0 <= n <= 10^9",
    hints: "Determinati cea mai mare cifra din scrierea lui n; raspunsul este max(2, cifra maxima + 1).",
    explanation: "Se determina cifra maxima din scrierea zecimala a lui n. Cea mai mica baza b pentru care toate cifrele lui n sunt valide este cifra maxima + 1, dar niciodata mai mica decat 2.\n\n**Complexitate:** O(numar de cifre)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    cout << baza(n) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(baza(n))
`,
    cpp: `int baza(long long n) {
    if (n == 0) return 2;
    int mx = 0;
    long long t = n;
    while (t > 0) { mx = max(mx, (int)(t % 10)); t /= 10; }
    return max(2, mx + 1);
}
`,
    py: `def baza(n):
    if n == 0:
        return 2
    mx = 0
    t = n
    while t > 0:
        mx = max(mx, t % 10)
        t //= 10
    return max(2, mx + 1)
`,
    tests: ["50731", "0", "1", "999999999", "111"],
  },
  {
    slug: "bac-antrenament-2020-v5-3-2",
    subcategoryId: "antrenament-2020-v5",
    title: "Bacalaureat Antrenament 2020, Varianta 5, S3.2 - Numarul valorilor intregi din text",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "siruri-caractere"],
    statement:
      "Un text cu cel mult 100 de caractere contine cuvinte si numere, separate prin cate un spatiu. Cuvintele sunt formate numai din litere mici ale alfabetului englez, iar numerele sunt reale, pozitive, cu partea zecimala si partea intreaga separate prin simbolul virgula, sau numai cu partea intreaga.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura un text de tipul precizat si afiseaza pe ecran numarul de valori intregi din text.\n\n" +
      "Exemplu: pentru textul grus leucogeranus are 1,40 m inaltime si traieste intre 30 si 40 de ani se afiseaza pe ecran 2",
    input_format: "Se citeste o linie de text.",
    output_format: "Numarul de tokenuri numerice fara virgula (numere intregi).",
    constraints: "text de cel mult 100 de caractere",
    hints: "Un token este un numar daca incepe cu o cifra. Este intreg daca nu contine caracterul ','.",
    explanation: "Se parcurg tokenurile textului; un token este numar daca primul sau caracter este o cifra; dintre acestea, se numara cele care nu contin virgula (numere intregi).\n\n**Complexitate:** O(lungimea textului)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    string w;
    int cnt = 0;
    while (ss >> w) {
        if (isdigit((unsigned char)w[0]) && w.find(',') == string::npos) cnt++;
    }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `words = input().split()
cnt = 0
for w in words:
    if w[0].isdigit() and ',' not in w:
        cnt += 1
print(cnt)
`,
    tests: [
      "grus leucogeranus are 1,40 m inaltime si traieste intre 30 si 40 de ani",
      "5 10 15",
      "a b c",
      "1,5 2,5 3,5",
      "1 2,5 3 4,5 5",
    ],
  },
  {
    slug: "bac-antrenament-2020-v5-3-3",
    subcategoryId: "antrenament-2020-v5",
    title: "Bacalaureat Antrenament 2020, Varianta 5, S3.3 - Suma maxima pe subsecventa (Kadane)",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.txt contine un sir de cel mult 10^6 numere intregi din intervalul [-10^3,10^3], separate prin cate un spatiu. Se cere sa se afiseze pe ecran suma maxima obtinuta adunand numere de pe pozitii consecutive in sirul aflat in fisier. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul bac.txt contine valorile 4 -6 7 2 -1 4 -10 -3 9 2 -2 se afiseaza pe ecran numarul 12",
    input_format: "Fisierul bac.txt: un sir de numere intregi, separate prin spatiu.",
    output_format: "Suma maxima a unei subsecvente contigue.",
    constraints: "cel mult 10^6 termeni",
    hints: "Algoritmul lui Kadane: mentineti suma curenta cur=max(x,cur+x) la fiecare pas, actualizand maximul global.",
    explanation: "Se aplica algoritmul lui Kadane: se parcurge sirul o singura data, mentinand suma maxima a unei subsecvente ce se termina la pozitia curenta (cur = max(valoare_curenta, cur + valoare_curenta)), si actualizand maximul global intalnit.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    long long v;
    long long cur = 0, best = 0;
    bool first = true;
    while (cin >> v) {
        if (first) { cur = v; best = v; first = false; }
        else { cur = max(v, cur + v); best = max(best, cur); }
    }
    cout << best << "\\n";
    return 0;
}
`,
    py: `with open("bac.txt") as f:
    data = f.read().split()
cur = None
best = None
for tok in data:
    v = int(tok)
    if cur is None:
        cur = v
        best = v
    else:
        cur = max(v, cur + v)
        best = max(best, cur)
print(best)
`,
    tests: [
      "4 -6 7 2 -1 4 -10 -3 9 2 -2",
      "-5",
      "1 2 3",
      "-1 -2 -3",
      (() => {
        const parts = [];
        for (let i = 0; i < 30000; i++) parts.push(String((i % 7) - 3));
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== VARIANTA 6 (Testul 6) =====================
  {
    slug: "bac-antrenament-2020-v6-3-1",
    subcategoryId: "antrenament-2020-v6",
    title: "Bacalaureat Antrenament 2020, Varianta 6, S3.1 - Produsul divizorilor primi",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "divizori"],
    statement:
      "Subprogramul prodprim are doi parametri:\n" +
      "- n, prin care primeste un numar natural (n in [2,10^9]);\n" +
      "- p, prin care furnizeaza produsul divizorilor primi ai lui n.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=2000, in urma apelului p=10, deoarece 2000=2^4*5^3.",
    input_format: "Se citeste de la tastatura n.",
    output_format: "Se afiseaza produsul divizorilor primi distincti ai lui n.",
    constraints: "2 <= n <= 10^9",
    hints: "Factorizati n; inmultiti rezultatul cu fiecare prim distinct gasit (o singura data per prim).",
    explanation: "Se factorizeaza n prin trial division; pentru fiecare factor prim distinct gasit se inmulteste rezultatul cu acel prim. Daca dupa bucla mai ramane un factor >1, este un ultim prim de inmultit.\n\n**Complexitate:** O(sqrt(n))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    long long p;
    prodprim(n, p);
    cout << p << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(prodprim(n))
`,
    cpp: `void prodprim(long long n, long long& p) {
    p = 1;
    for (long long f = 2; f * f <= n; f++) {
        if (n % f == 0) { p *= f; while (n % f == 0) n /= f; }
    }
    if (n > 1) p *= n;
}
`,
    py: `def prodprim(n):
    p = 1
    f = 2
    while f * f <= n:
        if n % f == 0:
            p *= f
            while n % f == 0:
                n //= f
        f += 1
    if n > 1:
        p *= n
    return p
`,
    tests: ["2000", "2", "999999937", "1000000000", "1024"],
  },
  {
    slug: "bac-antrenament-2020-v6-3-2",
    subcategoryId: "antrenament-2020-v6",
    title: "Bacalaureat Antrenament 2020, Varianta 6, S3.2 - Cuvinte cu mai multe consoane decat vocale",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "siruri-caractere"],
    statement:
      "Intr-un text cu cel mult 100 de caractere, cuvintele sunt formate din litere mici ale alfabetului englez si sunt separate prin cate un spatiu. Scrieti un program C/C++ care citeste de la tastatura un text de tipul mentionat si afiseaza pe ecran, pe linii separate, toate cuvintele sale pentru care numarul de vocale este strict mai mic decat numarul de consoane. Daca nu exista niciun astfel de cuvant, se afiseaza pe ecran mesajul nu exista. Se considera vocale literele din multimea a, e, i, o, u.\n\n" +
      "Exemplu: pentru textul ei au plantat tamarix ea a adus iasomie se afiseaza pe ecran, nu neaparat in aceasta ordine, cuvintele plantat si tamarix.",
    input_format: "Se citeste o linie de text.",
    output_format: "Cuvintele cu vocale<consoane, cate unul pe linie, sau mesajul 'nu exista'.",
    constraints: "text de cel mult 100 de caractere",
    hints: "Pentru fiecare cuvant, numarati vocalele si consoanele si comparati.",
    explanation: "Pentru fiecare cuvant al textului se numara vocalele si consoanele; daca vocalele sunt strict mai putine decat consoanele, cuvantul se afiseaza pe o linie separata. Daca niciun cuvant nu satisface conditia, se afiseaza mesajul cerut.\n\n**Complexitate:** O(lungimea textului)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
bool isVowel(char c) { return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u'; }
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    string w;
    bool any = false;
    while (ss >> w) {
        int v = 0, c = 0;
        for (char ch : w) if (isVowel(ch)) v++; else c++;
        if (v < c) { cout << w << "\\n"; any = true; }
    }
    if (!any) cout << "nu exista\\n";
    return 0;
}
`,
    py: `def is_vowel(c):
    return c in "aeiou"

words = input().split()
any_found = False
out = []
for w in words:
    v = sum(1 for ch in w if is_vowel(ch))
    c = len(w) - v
    if v < c:
        out.append(w)
        any_found = True
print("nu exista" if not any_found else "\\n".join(out))
`,
    tests: [
      "ei au plantat tamarix ea a adus iasomie",
      "aeiou",
      "bcdfg",
      "ab cd ef",
      "a bb ccc",
    ],
  },
  {
    slug: "bac-antrenament-2020-v6-3-3",
    subcategoryId: "antrenament-2020-v6",
    title: "Bacalaureat Antrenament 2020, Varianta 6, S3.3 - Numere de 7 cifre cu tipar dat",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Se citesc de la tastatura doua numere naturale din intervalul [1,81], p1 si p2, si se cere scrierea in fisierul bac.out a tuturor numerelor naturale cu exact 7 cifre, pentru care produsul primelor doua cifre este egal cu p1, cele trei cifre din mijloc sunt egale intre ele, iar produsul ultimelor doua cifre este egal cu p2. Numerele apar in fisier in ordine strict descrescatoare, fiecare pe cate o linie. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca p1=12, iar p2=8, atunci 2633324 si 3400018 sunt doua dintre cele 160 de numere cu proprietatea ceruta (2*6=3*4=12 si 2*4=1*8=8).",
    input_format: "Se citesc p1 si p2 de la tastatura.",
    output_format: "Se scriu in fisierul bac.out toate numerele de 7 cifre cu tiparul cerut, in ordine descrescatoare.",
    constraints: "1 <= p1, p2 <= 81",
    hints: "Enumerati toate perechile (d1,d2) cu d1 in [1,9] si d1*d2=p1, toate perechile (d6,d7) cu d6,d7 in [0,9] si d6*d7=p2, si toate valorile m in [0,9] pentru mijloc; combinati.",
    explanation: "Deoarece cautarea este marginita la cifre (0-9), se enumera toate perechile (d1,d2) cu d1 in [1,9] (prima cifra nu poate fi 0) si d1*d2=p1, toate perechile (d6,d7) cu d6,d7 in [0,9] si d6*d7=p2, si toate valorile posibile m in [0,9] pentru cele trei cifre din mijloc. Se combina fiecare tripleta pentru a forma numarul, se colecteaza toate valorile, se sorteaza descrescator si se scriu in fisier.\n\n**Complexitate:** O(1) - spatiul de cautare este marginit de cifre (cel mult 9*10*9)",
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
    sort(rez.begin(), rez.end(), greater<long long>());
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
rez.sort(reverse=True)
with open("bac.out", "w") as out:
    for v in rez:
        out.write(f"{v}\\n")
`,
    tests: ["12 8", "1 1", "81 81", "9 9", "16 25"],
  },
  // ===================== VARIANTA 7 (Testul 7) =====================
  {
    slug: "bac-antrenament-2020-v7-3-1",
    subcategoryId: "antrenament-2020-v7",
    title: "Bacalaureat Antrenament 2020, Varianta 7, S3.1 - Puterea la care apare p in n",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "divizori"],
    statement:
      "Subprogramul putere are doi parametri, n si p, prin care primeste cate un numar natural (n in [2,10^9], p in [0,10^9]). Subprogramul returneaza puterea la care apare numarul p in descompunerea in factori primi a lui n, daca p este numar prim, sau valoarea -1 in caz contrar.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=80 si p=2, subprogramul returneaza numarul 4 (80=2^4*5).",
    input_format: "Se citesc de la tastatura n si p.",
    output_format: "Puterea la care apare p in n (daca p este prim), sau -1.",
    constraints: "2 <= n <= 10^9, 0 <= p <= 10^9",
    hints: "Verificati mai intai daca p este prim (trial division pana la radacina patrata a lui p); apoi numarati de cate ori p divide n.",
    explanation: "Se verifica intai daca p este numar prim (prin trial division pana la sqrt(p)); daca nu este, se returneaza -1. Daca p este prim, se numara de cate ori p divide n (impartind repetat n la p).\n\n**Complexitate:** O(sqrt(p) + log_p(n))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

bool ePrimV7(long long v) {
    if (v < 2) return false;
    for (long long d = 2; d * d <= v; d++) if (v % d == 0) return false;
    return true;
}

__USER_CODE__

int main() {
    long long n, p; cin >> n >> p;
    cout << putere(n, p) << "\\n";
    return 0;
}
`,
    function_template_python: `def e_prim_v7(v):
    if v < 2:
        return False
    d = 2
    while d * d <= v:
        if v % d == 0:
            return False
        d += 1
    return True

__USER_CODE__

n, p = map(int, input().split())
print(putere(n, p))
`,
    cpp: `int putere(long long n, long long p) {
    if (!ePrimV7(p)) return -1;
    int cnt = 0;
    while (n % p == 0) { n /= p; cnt++; }
    return cnt;
}
`,
    py: `def putere(n, p):
    if not e_prim_v7(p):
        return -1
    cnt = 0
    while n % p == 0:
        n //= p
        cnt += 1
    return cnt
`,
    tests: ["80 2", "80 5", "80 3", "999999937 999999937", "1000000000 2"],
  },
  {
    slug: "bac-antrenament-2020-v7-3-2",
    subcategoryId: "antrenament-2020-v7",
    title: "Bacalaureat Antrenament 2020, Varianta 7, S3.2 - Valori care polarizeaza doua siruri",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "O valoare k polarizeaza doua siruri daca exista doi termeni care au acea valoare, unul fiind in primul sir, iar celalalt in al doilea sir.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura numere naturale din intervalul [1,20]: m, n si elementele unui tablou bidimensional cu m linii si n coloane, cu proprietatea ca nu exista doua elemente egale situate pe aceeasi linie sau pe aceeasi coloana. Programul afiseaza pe ecran valorile care pot polariza doua siruri, si anume sirul format din elementele de pe prima coloana, respectiv sirul format din elementele ultimei coloane a tabloului.\n\n" +
      "Valorile sunt afisate intr-o ordine oarecare, separate prin cate un spatiu, iar daca nu exista astfel de valori se afiseaza pe ecran mesajul nepolarizate.\n\n" +
      "Exemplu: pentru m=4, n=5 si tabloul\n3 7 1 2 5\n2 4 5 9 6\n6 2 7 8 1\n5 3 2 7 8\nse afiseaza pe ecran, nu neaparat in aceasta ordine, numerele 5 6",
    input_format: "Se citesc m, n, apoi elementele tabloului.",
    output_format: "Valorile comune primei si ultimei coloane, sau mesajul 'nepolarizate'.",
    constraints: "1 <= m, n <= 20",
    hints: "Colectati valorile primei coloane intr-o multime, valorile ultimei coloane in alta multime, si afisati intersectia.",
    explanation: "Se colecteaza intr-o multime valorile primei coloane si intr-o alta multime valorile ultimei coloane; se afiseaza elementele aflate in ambele multimi (intersectia), sau mesajul cerut daca intersectia este vida.\n\n**Complexitate:** O(m)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int m, n; cin >> m >> n;
    vector<vector<int>> a(m + 1, vector<int>(n + 1));
    for (int i = 1; i <= m; i++) for (int j = 1; j <= n; j++) cin >> a[i][j];
    set<int> c1, cn;
    for (int i = 1; i <= m; i++) { c1.insert(a[i][1]); cn.insert(a[i][n]); }
    vector<int> rez;
    for (int v : c1) if (cn.count(v)) rez.push_back(v);
    if (rez.empty()) { cout << "nepolarizate\\n"; return 0; }
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
c1 = set(a[i][1] for i in range(1, m + 1))
cn = set(a[i][n] for i in range(1, m + 1))
rez = sorted(c1 & cn)
print("nepolarizate" if not rez else " ".join(map(str, rez)))
`,
    tests: [
      "4 5\n3 7 1 2 5\n2 4 5 9 6\n6 2 7 8 1\n5 3 2 7 8",
      "2 2\n1 2\n3 4",
      "2 2\n1 2\n2 1",
      "3 3\n1 2 3\n4 5 6\n7 8 9",
      "3 2\n1 2\n3 4\n5 1",
    ],
  },
  {
    slug: "bac-antrenament-2020-v7-3-3",
    subcategoryId: "antrenament-2020-v7",
    title: "Bacalaureat Antrenament 2020, Varianta 7, S3.3 - Suma minima pe subsecventa",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.txt contine un sir de cel mult 10^6 numere intregi din intervalul [-10^3,10^3], separate prin cate un spatiu. Se cere sa se afiseze pe ecran suma minima obtinuta adunand numere de pe pozitii consecutive in sirul aflat in fisier. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul bac.txt contine valorile -4 6 -7 -2 1 -4 10 3 -9 -2 2 se afiseaza pe ecran numarul -12",
    input_format: "Fisierul bac.txt: un sir de numere intregi, separate prin spatiu.",
    output_format: "Suma minima a unei subsecvente contigue.",
    constraints: "cel mult 10^6 termeni",
    hints: "Algoritmul lui Kadane inversat: mentineti cur=min(x,cur+x) la fiecare pas, actualizand minimul global.",
    explanation: "Se aplica varianta minima a algoritmului lui Kadane: se parcurge sirul o singura data, mentinand suma minima a unei subsecvente ce se termina la pozitia curenta (cur = min(valoare_curenta, cur + valoare_curenta)), si actualizand minimul global intalnit.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    long long v, cur = 0, best = 0;
    bool first = true;
    while (cin >> v) {
        if (first) { cur = v; best = v; first = false; }
        else { cur = min(v, cur + v); best = min(best, cur); }
    }
    cout << best << "\\n";
    return 0;
}
`,
    py: `with open("bac.txt") as f:
    data = f.read().split()
cur = None
best = None
for tok in data:
    v = int(tok)
    if cur is None:
        cur = v
        best = v
    else:
        cur = min(v, cur + v)
        best = min(best, cur)
print(best)
`,
    tests: [
      "-4 6 -7 -2 1 -4 10 3 -9 -2 2",
      "5",
      "-1 -2 -3",
      "1 2 3",
      (() => {
        const parts = [];
        for (let i = 0; i < 30000; i++) parts.push(String((i % 7) - 3));
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== VARIANTA 8 (Testul 8) =====================
  {
    slug: "bac-antrenament-2020-v8-3-1",
    subcategoryId: "antrenament-2020-v8",
    title: "Bacalaureat Antrenament 2020, Varianta 8, S3.1 - Suma divizorilor primi",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "divizori"],
    statement:
      "Subprogramul suma are un singur parametru, n, prin care primeste un numar natural (n in [2,10^9]). Subprogramul returneaza suma divizorilor primi ai lui n. Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: pentru n=12 subprogramul returneaza 5 (divizorii primi ai lui 12 sunt 2 si 3).",
    input_format: "Se citeste de la tastatura n.",
    output_format: "Suma divizorilor primi distincti ai lui n.",
    constraints: "2 <= n <= 10^9",
    hints: "Factorizati n si insumati fiecare prim distinct gasit o singura data.",
    explanation: "Se factorizeaza n prin trial division; pentru fiecare factor prim distinct gasit se aduna la suma. Daca dupa bucla mai ramane un factor >1, se aduna si el.\n\n**Complexitate:** O(sqrt(n))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    cout << suma(n) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(suma(n))
`,
    cpp: `long long suma(long long n) {
    long long s = 0;
    for (long long f = 2; f * f <= n; f++) {
        if (n % f == 0) { s += f; while (n % f == 0) n /= f; }
    }
    if (n > 1) s += n;
    return s;
}
`,
    py: `def suma(n):
    s = 0
    f = 2
    while f * f <= n:
        if n % f == 0:
            s += f
            while n % f == 0:
                n //= f
        f += 1
    if n > 1:
        s += n
    return s
`,
    tests: ["12", "2", "999999937", "1000000000", "1024"],
  },
  {
    slug: "bac-antrenament-2020-v8-3-2",
    subcategoryId: "antrenament-2020-v8",
    title: "Bacalaureat Antrenament 2020, Varianta 8, S3.2 - Deplasare circulara pe linia k",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Scrieti un program C/C++ care citeste de la tastatura numere naturale: n (n in [2,20]), k (k in [1,n]) si n*n numere din intervalul [0,10^9], elemente ale unui tablou bidimensional cu n linii si n coloane, numerotate incepand de la 1. Programul transforma tabloul in memorie, deplasand circular spre stanga, cu cate o pozitie, toate elementele situate pe linia k, in stanga diagonalei principale.\n\n" +
      "Elementele tabloului obtinut sunt afisate pe ecran, fiecare linie pe cate o linie a ecranului, cu elementele fiecarei linii separate prin cate un spatiu.\n\n" +
      "Exemplu: pentru n=6, k=4 si tabloul\n1 2 3 4 5 6\n6 7 8 9 0 1\n2 4 6 8 0 2\n1 3 5 7 9 5\n6 2 7 4 5 7\n3 9 4 8 5 7\nse obtine tabloul\n1 2 3 4 5 6\n6 7 8 9 0 1\n2 4 6 8 0 2\n3 5 1 7 9 5\n6 2 7 4 5 7\n3 9 4 8 5 7",
    input_format: "Se citesc n, k, apoi elementele tabloului cu n linii si n coloane.",
    output_format: "Tabloul dupa deplasarea circulara la stanga a segmentului din stanga diagonalei pe linia k.",
    constraints: "2 <= n <= 20, 1 <= k <= n",
    hints: "Segmentul de interes pe linia k este coloanele 1..k-1. Deplasati circular la stanga acest segment (primul element trece la final).",
    explanation: "Se citeste tabloul; pe linia k, segmentul format din coloanele 1 la k-1 (elementele din stanga diagonalei principale) este deplasat circular la stanga cu o pozitie: noul element de pe coloana j (j<k-1) devine cel vechi de pe coloana j+1, iar noul element de pe coloana k-1 devine cel vechi de pe coloana 1. Daca k=1, nu exista niciun element de deplasat.\n\n**Complexitate:** O(n^2)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, k; cin >> n >> k;
    vector<vector<long long>> a(n + 1, vector<long long>(n + 1));
    for (int i = 1; i <= n; i++) for (int j = 1; j <= n; j++) cin >> a[i][j];
    if (k >= 2) {
        long long first = a[k][1];
        for (int j = 1; j < k - 1; j++) a[k][j] = a[k][j + 1];
        a[k][k - 1] = first;
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
if k >= 2:
    first = a[k][1]
    for j in range(1, k - 1):
        a[k][j] = a[k][j + 1]
    a[k][k - 1] = first
for i in range(1, n + 1):
    print(" ".join(str(a[i][j]) for j in range(1, n + 1)))
`,
    tests: [
      "6 4\n1 2 3 4 5 6\n6 7 8 9 0 1\n2 4 6 8 0 2\n1 3 5 7 9 5\n6 2 7 4 5 7\n3 9 4 8 5 7",
      "2 1\n1 2\n3 4",
      "3 2\n1 2 3\n4 5 6\n7 8 9",
      "3 3\n1 2 3\n4 5 6\n7 8 9",
      "4 3\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16",
    ],
  },
  {
    slug: "bac-antrenament-2020-v8-3-3",
    subcategoryId: "antrenament-2020-v8",
    title: "Bacalaureat Antrenament 2020, Varianta 8, S3.3 - Pozitii cu numar maxim de precedenti cu aceeasi ultima cifra",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.in contine un sir de cel mult 10^6 numere naturale din intervalul [0,10^9], separate prin cate un spatiu. Se cere sa se afiseze pe ecran pozitiile din sir pe care se afla termeni precedati de un numar maxim de valori care au cifra unitatilor egala cu cifra unitatilor lor. Numerele afisate sunt separate prin cate un spatiu. Proiectati un algoritm eficient din punctul de vedere al timpului de executare.\n\n" +
      "Exemplu: daca fisierul bac.in contine numerele 112 12 5 25 88 15 2 19 32 179 35 621 pe ecran se afiseaza numerele de mai jos (termenii 32, respectiv 35 respecta proprietatea ceruta): 9 11",
    input_format: "Fisierul bac.in: un sir de numere naturale, separate prin spatiu.",
    output_format: "Pozitiile (1-indexate) cu numarul maxim de precedenti cu aceeasi ultima cifra.",
    constraints: "cel mult 10^6 termeni",
    hints: "Mentineti un contor pentru fiecare cifra 0-9, reprezentand cate numere cu acea ultima cifra au fost vazute pana acum (inainte de pozitia curenta). Actualizati maximul pe parcurs.",
    explanation: "Se parcurge sirul o singura data, mentinand un tablou de 10 contoare (numarul de aparitii ale fiecarei ultime cifre, vazute STRICT INAINTE de pozitia curenta). Pentru fiecare pozitie, se citeste contorul corespunzator ultimei cifre a termenului curent (aceasta este numarul de precedenti cu aceeasi ultima cifra); daca acest numar depaseste strict maximul curent, se reseteaza lista de pozitii cu noua pozitie; daca este egal, se adauga pozitia la lista. Contorul se incrementeaza dupa procesarea fiecarei pozitii.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara (in afara rezultatului)",
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
        int d = (int)(v % 10);
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
    d = v % 10
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
      "112 12 5 25 88 15 2 19 32 179 35 621",
      "1",
      "1 1 1",
      "1 11 21 31",
      (() => {
        const parts = [];
        for (let i = 0; i < 20000; i++) parts.push(String(i % 10));
        return parts.join(" ");
      })(),
    ],
  },
];

module.exports = problems;
