const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const LEVEL = "bacalaureat";
const CHAPTER = { id: "bacalaureat-2022", name: "Bacalaureat 2022" };

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

const SRC = "Bacalaureat Informatica MI 2022 (Ministerul Educatiei / CNPEE)";

const problems = [
  // ===================== SESIUNEA VARA 2022 =====================
  {
    slug: "bac-vara-2022-3-1",
    subcategoryId: "vara-2022",
    title: "Bacalaureat Vara 2022, S3.1 - Inlocuirea secventei 22 cu 20",
    difficulty: "medium",
    tags: ["bacalaureat", "2022", "vara", "subiectul3", "cifre"],
    statement:
      "Subprogramul secventa are un singur parametru, n, prin care primeste un numar natural (n in [10,10^9)) in care nu exista secvente de mai mult de doua cifre identice aflate pe pozitii consecutive. Subprogramul inlocuieste in n fiecare secventa 22 cu cate o secventa 20 si furnizeaza, prin acelasi parametru, numarul obtinut. Daca nu se inlocuieste nicio secventa, subprogramul furnizeaza numarul nemodificat.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=202233228, dupa apel n=202033208.",
    input_format: "Se citeste de la tastatura numarul natural n.",
    output_format: "Se afiseaza numarul obtinut dupa inlocuiri.",
    constraints: "10 <= n < 10^9, fara secvente de mai mult de doua cifre identice consecutive",
    hints: "Parcurgeti cifrele lui n (ca text) de la stanga la dreapta; de cate ori intalniti doua cifre 2 consecutive, scrieti in loc '20' si sariti peste ambele; altfel copiati cifra curenta.",
    explanation:
      "Se converteste n la sirul sau de cifre si se parcurge o singura data, de la stanga la dreapta: daca cifra curenta si urmatoarea sunt ambele 2, se scrie in rezultat secventa '20' si se avanseaza cu doua pozitii; altfel se copiaza cifra curenta si se avanseaza cu o pozitie. Deoarece nu exista mai mult de doua cifre 2 consecutive, aceasta parcurgere gliding nu creeaza ambiguitati.\n\n**Complexitate:** O(numar de cifre)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    secventa(n);
    cout << n << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(secventa(n))
`,
    cpp: `void secventa(long long& n) {
    string s = to_string(n);
    string rez;
    size_t i = 0;
    while (i < s.size()) {
        if (i + 1 < s.size() && s[i] == '2' && s[i + 1] == '2') { rez += "20"; i += 2; }
        else { rez += s[i]; i += 1; }
    }
    n = stoll(rez);
}
`,
    py: `def secventa(n):
    s = str(n)
    rez = []
    i = 0
    while i < len(s):
        if i + 1 < len(s) and s[i] == '2' and s[i + 1] == '2':
            rez.append("20")
            i += 2
        else:
            rez.append(s[i])
            i += 1
    return int("".join(rez))
`,
    tests: ["202233228", "10", "2200", "123456789", "22"],
  },
  {
    slug: "bac-vara-2022-3-2",
    subcategoryId: "vara-2022",
    title: "Bacalaureat Vara 2022, S3.2 - Innisiparea parcelelor",
    difficulty: "medium",
    tags: ["bacalaureat", "2022", "vara", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Pentru prevenirea eroziunii la Marea Neagra, autoritatile au hotarat innisiparea unei plaje. Plaja a fost impartita in parcele de forma patrata cu latura de 1 metru, dispuse ca elementele unui tablou bidimensional, retinandu-se nivelul fiecarei parcele, masurat in metri, de la nivelul marii. Innisiparea se realizeaza doar pe acele parcele care au nivelul strict mai mic decat al celei mai joase dintre parcelele vecine cu ea, adaugand nisip, astfel incat cele doua sa aiba acelasi nivel. Doua parcele sunt vecine daca au o latura comuna.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura doua numere naturale din intervalul [2,10^2], m si n, apoi elementele unui tablou bidimensional cu m linii si n coloane, numere naturale din intervalul [1,10], reprezentand nivelurile parcelelor, in ordinea dispunerii acestora pe plaja. Programul afiseaza pe ecran cantitatea totala de nisip adaugata, masurata in metri cubi.\n\n" +
      "Exemplu: pentru m=5, n=4 si tabloul\n5 3 4 6\n7 5 9 3\n6 8 3 9\n4 5 2 3\n3 1 4 4\n" +
      "se afiseaza valoarea 7.",
    input_format: "Se citesc m, n, apoi elementele tabloului cu m linii si n coloane.",
    output_format: "Se afiseaza cantitatea totala de nisip adaugata.",
    constraints: "2 <= m, n <= 100, 1 <= nivel <= 10",
    hints: "Pentru fiecare parcela, determinati nivelul minim dintre vecinii sai existenti (sus, jos, stanga, dreapta); daca nivelul parcelei este strict mai mic decat acest minim, adaugati diferenta la total.",
    explanation:
      "Pentru fiecare celula a tabloului, se calculeaza minimul nivelurilor vecinilor sai existenti (cei aflati efectiv in tablou, la nord, sud, est sau vest). Daca nivelul celulei este strict mai mic decat acest minim, diferenta (minim - nivel) reprezinta cantitatea de nisip adaugata pe acea parcela; se insumeaza aceste diferente pentru toate celulele, folosind valorile ORIGINALE ale tabloului pentru calculul vecinilor (nu cele actualizate).\n\n**Complexitate:** O(m*n)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int m, n; cin >> m >> n;
    vector<vector<int>> a(m, vector<int>(n));
    for (auto& row : a) for (auto& v : row) cin >> v;
    int dr[4] = {-1, 1, 0, 0}, dc[4] = {0, 0, -1, 1};
    long long total = 0;
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            int mn = INT32_MAX; bool any = false;
            for (int d = 0; d < 4; d++) {
                int ni = i + dr[d], nj = j + dc[d];
                if (ni >= 0 && ni < m && nj >= 0 && nj < n) { mn = min(mn, a[ni][nj]); any = true; }
            }
            if (any && a[i][j] < mn) total += (mn - a[i][j]);
        }
    }
    cout << total << "\\n";
    return 0;
}
`,
    py: `m, n = map(int, input().split())
a = [list(map(int, input().split())) for _ in range(m)]
total = 0
for i in range(m):
    for j in range(n):
        neigh = []
        if i > 0: neigh.append(a[i - 1][j])
        if i < m - 1: neigh.append(a[i + 1][j])
        if j > 0: neigh.append(a[i][j - 1])
        if j < n - 1: neigh.append(a[i][j + 1])
        if neigh:
            mn = min(neigh)
            if a[i][j] < mn:
                total += mn - a[i][j]
print(total)
`,
    tests: [
      "5 4\n5 3 4 6\n7 5 9 3\n6 8 3 9\n4 5 2 3\n3 1 4 4",
      "2 2\n1 1\n1 1",
      "2 2\n1 5\n5 5",
      "3 3\n5 5 5\n5 1 5\n5 5 5",
      "2 3\n10 1 10\n1 10 1",
    ],
  },
  {
    slug: "bac-vara-2022-3-3",
    subcategoryId: "vara-2022",
    title: "Bacalaureat Vara 2022, S3.3 - Numarul valorilor distincte dintr-un interval",
    difficulty: "hard",
    tags: ["bacalaureat", "2022", "vara", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul bac.txt contine numere naturale din intervalul [1,10^9], astfel: pe prima linie doua numere, x si y (x<y), iar pe a doua linie un sir de cel mult 10^6 numere, ordonate crescator. Numerele aflate pe aceeasi linie a fisierului sunt separate prin cate un spatiu.\n\n" +
      "Se cere sa se afiseze pe ecran numarul de valori distincte din sirul aflat pe a doua linie a fisierului care apartin intervalului [x,y]. Proiectati un algoritm eficient din punctul de vedere al timpului de executare si al memoriei utilizate.\n\n" +
      "Exemplu: daca fisierul are continutul\n2 9\n1 1 1 2 2 3 5 5 5 5 6 6 7 8 10 10 12 15 21 21\n" +
      "pe ecran se afiseaza 6.",
    input_format: "Fisierul bac.txt: pe prima linie x si y, pe a doua linie sirul crescator.",
    output_format: "Se afiseaza numarul de valori distincte din sir, aflate in intervalul [x,y].",
    constraints: "1 <= x < y <= 10^9, cel mult 10^6 termeni in sir, ordonati crescator",
    hints: "Parcurgeti sirul o singura data; deoarece este ordonat crescator, valorile egale sunt consecutive. Numarati o valoare distincta doar prima data cand o intalniti si doar daca se afla in [x,y].",
    explanation:
      "Deoarece sirul este ordonat crescator, toate aparitiile unei valori sunt grupate consecutiv. Se parcurge sirul o singura data, retinand valoarea precedenta; de fiecare data cand valoarea curenta difera de precedenta SI se afla in intervalul [x,y], se incrementeaza un contor de valori distincte gasite. Nu este nevoie sa se stocheze intregul sir.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    long long x, y; cin >> x >> y;
    long long prev = -1, cnt = 0, v;
    while (cin >> v) {
        if (v != prev) {
            if (v >= x && v <= y) cnt++;
            prev = v;
        }
    }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `with open("bac.txt") as f:
    x, y = map(int, f.readline().split())
    rest = f.readline().split()
prev = -1
cnt = 0
for tok in rest:
    v = int(tok)
    if v != prev:
        if x <= v <= y:
            cnt += 1
        prev = v
print(cnt)
`,
    tests: [
      "2 9\n1 1 1 2 2 3 5 5 5 5 6 6 7 8 10 10 12 15 21 21",
      "1 1000000000\n5",
      "5 5\n1 2 3 4 5 6",
      "100 200\n1 2 3",
      (() => {
        const parts = [];
        for (let v = 1; v <= 10000; v++) { parts.push(String(v)); if (v % 3 === 0) parts.push(String(v)); }
        return `1 10000\n${parts.join(" ")}`;
      })(),
    ],
  },
  // ===================== MODEL 2022 =====================
  {
    slug: "bac-model-2022-3-1",
    subcategoryId: "model-2022",
    title: "Bacalaureat Model 2022, S3.1 - Lungimea minima a unui mozaic",
    difficulty: "medium",
    tags: ["bacalaureat", "2022", "model", "subiectul3", "cmmmc"],
    statement:
      "Pentru gradina publica a orasului se doreste proiectarea unui mozaic de forma dreptunghiulara, format din trei benzi suprapuse, fiecare banda fiind formata din placute intregi, de acelasi tip, montate una dupa alta; oricare doua benzi diferite sunt formate din placute de tipuri diferite.\n\n" +
      "Subprogramul mozaic are trei parametri, x, y si z, prin care primeste trei numere naturale din intervalul [10,200], reprezentand lungimea, exprimata in milimetri, a unei placute de primul tip, de al doilea tip, respectiv de al treilea tip. Subprogramul returneaza un numar natural, reprezentand lungimea minima, exprimata in milimetri, a unui mozaic care sa respecte modelul proiectat.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: pentru x=30, y=40, z=20, subprogramul returneaza valoarea 120.",
    input_format: "Se citesc de la tastatura x, y si z.",
    output_format: "Se afiseaza valoarea returnata de subprogram.",
    constraints: "10 <= x, y, z <= 200",
    hints: "Fiecare banda trebuie sa aiba lungimea totala un multiplu al lungimii placutei sale. Lungimea minima comuna tuturor celor trei benzi este cel mai mic multiplu comun al lui x, y si z.",
    explanation:
      "Lungimea mozaicului trebuie sa fie simultan multiplu de x, y si z (pentru ca fiecare banda sa fie formata din placute intregi); cea mai mica astfel de lungime este exact cel mai mic multiplu comun (cmmmc) al celor trei numere, calculat combinand cmmmc doua cate doua: cmmmc(x,y,z) = cmmmc(cmmmc(x,y),z), unde cmmmc(a,b) = a*b/cmmdc(a,b).\n\n**Complexitate:** O(log(max(x,y,z)))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long x, y, z; cin >> x >> y >> z;
    cout << mozaic(x, y, z) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

x, y, z = map(int, input().split())
print(mozaic(x, y, z))
`,
    cpp: `long long cmmdc(long long a, long long b) { while (b) { a %= b; swap(a, b); } return a; }
long long cmmmc(long long a, long long b) { return a / cmmdc(a, b) * b; }
long long mozaic(long long x, long long y, long long z) {
    return cmmmc(cmmmc(x, y), z);
}
`,
    py: `import math
def mozaic(x, y, z):
    return math.lcm(x, y, z)
`,
    tests: ["30 40 20", "10 10 10", "13 17 19", "200 199 197", "10 20 30"],
  },
  {
    slug: "bac-model-2022-3-2",
    subcategoryId: "model-2022",
    title: "Bacalaureat Model 2022, S3.2 - Numar unic de cifre pentru toate numerele din text",
    difficulty: "medium",
    tags: ["bacalaureat", "2022", "model", "subiectul3", "siruri-caractere"],
    statement:
      "Un text are cel mult 100 de caractere si este format din cuvinte, numere naturale si spatii. Textul contine cel putin un numar, iar cuvintele sunt formate numai din litere mici ale alfabetului englez. Cuvintele si numerele sunt separate prin cate un spatiu.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura un text de tipul precizat si afiseaza pe ecran un numar natural k, daca toate numerele care intra in componenta sa au cate k cifre, sau mesajul NU, in caz contrar.\n\n" +
      "Exemplu: pentru textul la zoo sunt 100 de cocori si 120 de pasari flamingo se afiseaza 3; pentru textul la zoo sunt 100 de cocori si 10 pasari flamingo se afiseaza NU.",
    input_format: "Se citeste de la tastatura o linie de text.",
    output_format: "Se afiseaza numarul k de cifre daca toate numerele din text au acelasi numar de cifre, altfel mesajul 'NU'.",
    constraints: "textul are cel mult 100 de caractere, contine cel putin un numar",
    hints: "Parcurgeti tokenii textului; un token este un numar daca primul sau caracter este cifra. Retineti numarul de cifre al primului numar gasit si verificati ca toate celelalte numere au acelasi numar de cifre.",
    explanation: "Se parcurg tokenii textului (separati prin spatiu); pentru fiecare token al carui prim caracter este o cifra (deci reprezinta un numar), se retine lungimea sa (numarul de cifre). Daca toate aceste lungimi sunt egale, se afiseaza valoarea comuna k; altfel, se afiseaza mesajul 'NU'.\n\n**Complexitate:** O(lungimea textului)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    string tok;
    int k = -1;
    bool ok = true;
    while (ss >> tok) {
        if (isdigit((unsigned char)tok[0])) {
            int len = (int)tok.size();
            if (k == -1) k = len;
            else if (len != k) ok = false;
        }
    }
    if (ok) cout << k << "\\n"; else cout << "NU\\n";
    return 0;
}
`,
    py: `tokens = input().split()
k = -1
ok = True
for tok in tokens:
    if tok[0].isdigit():
        ln = len(tok)
        if k == -1:
            k = ln
        elif ln != k:
            ok = False
print(k if ok else "NU")
`,
    tests: [
      "la zoo sunt 100 de cocori si 120 de pasari flamingo",
      "la zoo sunt 100 de cocori",
      "la zoo sunt 100 de cocori si 10 pasari flamingo",
      "un 5",
      "ab 12 cd 34 ef 56",
    ],
  },
  {
    slug: "bac-model-2022-3-3",
    subcategoryId: "model-2022",
    title: "Bacalaureat Model 2022, S3.3 - Cea mai lunga secventa par-incadrata",
    difficulty: "hard",
    tags: ["bacalaureat", "2022", "model", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Numim secventa par-incadrata a unui sir de numere naturale un subsir al acestuia, format din termeni aflati pe pozitii consecutive in sirul dat, subsir care incepe si se termina cu aceeasi valoare, para. Lungimea secventei este egala cu numarul de termeni ai acesteia.\n\n" +
      "Fisierul bac.txt contine un sir de cel putin doua si cel mult 10^6 numere naturale din intervalul [0,9]. Numerele sunt separate prin cate un spatiu, iar in sir exista cel putin doi termeni pari egali.\n\n" +
      "Se cere sa se determine secventele par-incadrate din acest sir care au lungime maxima si sa se afiseze pe prima linie a ecranului lungimea maxima determinata, iar pe urmatoarea linie, pentru fiecare astfel de secventa, valoarea primului sau termen. Numerele de pe a doua linie sunt afisate in ordine strict crescatoare, separate prin cate un spatiu.\n\n" +
      "Proiectati un algoritm eficient din punctul de vedere al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine numerele 5 1 3 2 4 3 3 2 8 9 7 3 4 6 6 0 8 se afiseaza:\n9\n4 8",
    input_format: "Fisierul bac.txt: un sir de numere naturale din [0,9], separate prin spatiu.",
    output_format: "Pe prima linie lungimea maxima a unei secvente par-incadrate; pe a doua linie, in ordine crescatoare, valorile primului termen al fiecarei astfel de secvente de lungime maxima.",
    constraints: "cel mult 10^6 termeni, valori in [0,9]",
    hints: "Deoarece valorile sunt din [0,9], retineti doar prima si ultima pozitie la care apare fiecare cifra, printr-o singura trecere prin fisier. Pentru fiecare cifra para, lungimea celei mai bune secvente par-incadrate cu acea valoare este ultima_pozitie - prima_pozitie + 1.",
    explanation:
      "Deoarece valorile posibile sunt doar 0..9, se retin, printr-o singura trecere prin fisier, prima si ultima pozitie la care apare fiecare cifra (10 perechi de valori). Pentru fiecare cifra para d care apare, cea mai lunga secventa par-incadrata cu capetele egale cu d are lungimea (ultima aparitie a lui d) - (prima aparitie a lui d) + 1 (folosirea primei si ultimei aparitii maximizeaza distanta). Se determina maximul acestor lungimi peste toate cifrele pare, apoi se colecteaza toate cifrele pare care ating acest maxim, in ordine crescatoare.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    vector<long long> first_(10, -1), last_(10, -1);
    long long idx = 0, v;
    while (cin >> v) {
        idx++;
        if (first_[v] == -1) first_[v] = idx;
        last_[v] = idx;
    }
    long long best = -1;
    vector<int> vals;
    for (int d = 0; d <= 8; d += 2) {
        if (first_[d] != -1) {
            long long span = last_[d] - first_[d] + 1;
            if (span > best) { best = span; vals.clear(); vals.push_back(d); }
            else if (span == best) vals.push_back(d);
        }
    }
    cout << best << "\\n";
    for (size_t i = 0; i < vals.size(); i++) cout << vals[i] << (i + 1 < vals.size() ? " " : "\\n");
    return 0;
}
`,
    py: `first_ = [-1] * 10
last_ = [-1] * 10
idx = 0
with open("bac.txt") as f:
    data = f.read().split()
for tok in data:
    v = int(tok)
    idx += 1
    if first_[v] == -1:
        first_[v] = idx
    last_[v] = idx
best = -1
vals = []
for d in range(0, 9, 2):
    if first_[d] != -1:
        span = last_[d] - first_[d] + 1
        if span > best:
            best = span
            vals = [d]
        elif span == best:
            vals.append(d)
print(best)
print(" ".join(map(str, vals)))
`,
    tests: [
      "5 1 3 2 4 3 3 2 8 9 7 3 4 6 6 0 8",
      "0 0",
      "2 4 2 4",
      "6 1 6",
      (() => {
        const parts = [];
        parts.push("2");
        for (let i = 0; i < 30000; i++) parts.push(String(1 + (i % 2) * 2));
        parts.push("2");
        parts.push("4");
        for (let i = 0; i < 30000; i++) parts.push(String(3));
        parts.push("4");
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== SIMULARE 2022 =====================
  {
    slug: "bac-simulare-2022-3-1",
    subcategoryId: "simulare-2022",
    title: "Bacalaureat Simulare 2022, S3.1 - Cel mai mare numar cu rest 2 la x si y",
    difficulty: "medium",
    tags: ["bacalaureat", "2022", "simulare", "subiectul3", "resturi"],
    statement:
      "Subprogramul rest are patru parametri:\n" +
      "- x, y si n, prin care primeste cate un numar natural din intervalul [1,10^6], x<y<n;\n" +
      "- k, prin care furnizeaza cea mai mare valoare naturala din intervalul [1,n] pentru care atat restul impartirii la x, cat si restul impartirii la y, sunt egale cu 2, sau 0 daca nu exista o astfel de valoare.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: pentru x=10, y=101 si n=3000, subprogramul returneaza numarul 2022.",
    input_format: "Se citesc de la tastatura x, y si n.",
    output_format: "Se afiseaza valoarea k calculata de subprogram.",
    constraints: "1 <= x < y < n <= 10^6",
    hints: "Restul impartirii la x este 2 doar daca x>2; la fel pentru y. Daca ambele conditii sunt posibile, valorile potrivite sunt de forma 2 + t*cmmmc(x,y); gasiti cea mai mare astfel de valoare <= n.",
    explanation:
      "Daca x<=2 sau y<=2, restul 2 este imposibil (restul unei impartiri la m este intotdeauna mai mic decat m), deci k=0. Altfel, valorile cu restul 2 la ambele impartiri sunt exact cele de forma 2 + t*L, unde L = cmmmc(x,y) si t este natural (aceasta rezulta din teorema chinezeasca a resturilor aplicata la congruentele v=2 (mod x) si v=2 (mod y)); cea mai mare astfel de valoare care nu depaseste n se obtine pentru t = (n-2)/L (impartire intreaga), iar valoarea corespunzatoare este 2+t*L.\n\n**Complexitate:** O(log(max(x,y)))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long x, y, n; cin >> x >> y >> n;
    long long k;
    rest(x, y, n, k);
    cout << k << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

x, y, n = map(int, input().split())
print(rest(x, y, n))
`,
    cpp: `long long cmmdc2(long long a, long long b) { while (b) { a %= b; swap(a, b); } return a; }
void rest(long long x, long long y, long long n, long long& k) {
    if (x <= 2 || y <= 2) { k = 0; return; }
    long long L = x / cmmdc2(x, y) * y;
    long long t = (n - 2) / L;
    k = 2 + t * L;
}
`,
    py: `import math
def rest(x, y, n):
    if x <= 2 or y <= 2:
        return 0
    L = math.lcm(x, y)
    t = (n - 2) // L
    return 2 + t * L
`,
    tests: ["10 101 3000", "1 2 100", "3 5 1000000", "999998 999999 1000000", "4 6 50"],
  },
  {
    slug: "bac-simulare-2022-3-2",
    subcategoryId: "simulare-2022",
    title: "Bacalaureat Simulare 2022, S3.2 - Numele invitatilor cu un prenume dat",
    difficulty: "medium",
    tags: ["bacalaureat", "2022", "simulare", "subiectul3", "siruri-caractere"],
    statement:
      "Un text, de cel mult 250 de caractere, reprezinta o lista cu date de identificare ale invitatilor la o petrecere; fiecare invitat are un prenume si un nume, care apar in lista in aceasta ordine, urmate de simbolul ; (punct si virgula). Numele si prenumele sunt formate din cate un singur cuvant, compus din litere mari ale alfabetului englez, si sunt separate printr-un spatiu.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura un text de tipul precizat mai sus apoi, de pe randul urmator, un cuvant, x, si afiseaza pe ecran, separate prin cate un spatiu, numele tuturor invitatilor care au prenumele x, ca in exemplu, sau mesajul NU daca nu exista astfel de invitati.\n\n" +
      "Exemplu: daca lista este DAN MARIS; DANILA PREPELEAC; DAN POPA; EDANA DAN; si cuvantul x este DAN se afiseaza pe ecran MARIS POPA",
    input_format: "Pe prima linie se citeste lista de invitati. Pe a doua linie se citeste cuvantul x.",
    output_format: "Se afiseaza numele invitatilor cu prenumele x, separate prin spatiu, sau mesajul 'NU' daca nu exista niciunul.",
    constraints: "textul are cel mult 250 de caractere",
    hints: "Impartiti textul dupa caracterul ';' pentru a obtine fiecare intrare, apoi impartiti fiecare intrare dupa spatiu pentru a separa prenumele de nume.",
    explanation:
      "Se imparte textul dupa caracterul ';' pentru a obtine cate o secventa 'PRENUME NUME' pentru fiecare invitat (eliminand spatiile suplimentare de la inceputul fiecarei secvente rezultate). Pentru fiecare astfel de secventa, se extrag cele doua cuvinte (prenume si nume); daca prenumele coincide cu x, numele se adauga la rezultat. Daca lista rezultatelor este vida, se afiseaza mesajul 'NU'.\n\n**Complexitate:** O(lungimea textului)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string line;
    getline(cin, line);
    string x;
    cin >> x;
    vector<string> rez;
    stringstream ss(line);
    string entry;
    while (getline(ss, entry, ';')) {
        stringstream es(entry);
        string prenume, nume;
        if (es >> prenume >> nume) {
            if (prenume == x) rez.push_back(nume);
        }
    }
    if (rez.empty()) { cout << "NU\\n"; return 0; }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `line = input()
x = input().strip()
rez = []
for entry in line.split(";"):
    parts = entry.split()
    if len(parts) == 2:
        prenume, nume = parts
        if prenume == x:
            rez.append(nume)
print(" ".join(rez) if rez else "NU")
`,
    tests: [
      "DAN MARIS; DANILA PREPELEAC; DAN POPA; EDANA DAN;\nDAN",
      "ANA IONESCU;\nANA",
      "ANA IONESCU;\nMARIA",
      "ION VASILE; ION POPA; ION GEORGESCU;\nION",
      "MIHAI STAN; ANA DUMITRU;\nMIHAI",
    ],
  },
  {
    slug: "bac-simulare-2022-3-3",
    subcategoryId: "simulare-2022",
    title: "Bacalaureat Simulare 2022, S3.3 - Cea mai mare putere a lui 45 care divide n!",
    difficulty: "hard",
    tags: ["bacalaureat", "2022", "simulare", "subiectul3", "eficienta", "fisiere", "factorial"],
    statement:
      "Se citeste de la tastatura un numar natural, n (n in [1,10^9]), si se cere sa se scrie in fisierul text bac.txt cel mai mare numar natural p cu proprietatea ca numarul 45^p este divizor al numarului obtinut prin evaluarea produsului 1*2*3*...*n.\n\n" +
      "Proiectati un algoritm eficient din punctul de vedere al timpului de executare si al memoriei utilizate.\n\n" +
      "Exemplu: daca n=14, fisierul contine numarul 2 (45^2=2025 este divizor al lui 1*2*3*...*14=87178291200).",
    input_format: "Se citeste de la tastatura numarul natural n.",
    output_format: "Se scrie in fisierul bac.txt cel mai mare p astfel incat 45^p divide n!.",
    constraints: "1 <= n <= 10^9",
    hints: "45 = 3^2 * 5. Calculati exponentul lui 3 (e3) si exponentul lui 5 (e5) in descompunerea lui n! folosind formula lui Legendre (suma catelor la impartirea repetata cu puterile lui 3, respectiv 5). Raspunsul este minimul dintre e3/2 (intreg) si e5.",
    explanation:
      "Deoarece 45 = 3^2 * 5, avem 45^p = 3^(2p) * 5^p; pentru ca 45^p sa divida n!, exponentul lui 3 din n! (notat e3) trebuie sa fie cel putin 2p, iar exponentul lui 5 din n! (notat e5) trebuie sa fie cel putin p. Exponentii e3 si e5 se calculeaza rapid cu formula lui Legendre: exponentul unui numar prim q in n! este suma [n/q] + [n/q^2] + [n/q^3] + ..., pana cand puterea lui q depaseste n (numar logaritmic de termeni). Raspunsul final este minimul dintre e3 impartit intreg la 2 si e5.\n\n**Complexitate:** O(log n)",
    io: { input_source: "stdin", input_filename: null, output_target: "file", output_filename: "bac.txt" },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long exponentPrim(long long n, long long q) {
    long long e = 0, p = q;
    while (p <= n) { e += n / p; if (p > n / q) break; p *= q; }
    return e;
}
int main() {
    long long n; cin >> n;
    long long e3 = exponentPrim(n, 3);
    long long e5 = exponentPrim(n, 5);
    long long p = min(e3 / 2, e5);
    freopen("bac.txt", "w", stdout);
    cout << p << "\\n";
    return 0;
}
`,
    py: `def exponent_prim(n, q):
    e = 0
    p = q
    while p <= n:
        e += n // p
        if p > n // q:
            break
        p *= q
    return e

n = int(input())
e3 = exponent_prim(n, 3)
e5 = exponent_prim(n, 5)
p = min(e3 // 2, e5)
with open("bac.txt", "w") as f:
    f.write(str(p) + "\\n")
`,
    tests: ["14", "1", "1000000000", "44", "100"],
  },
  // ===================== SESIUNE SPECIALA 2022 =====================
  {
    slug: "bac-speciala-2022-3-1",
    subcategoryId: "speciala-2022",
    title: "Bacalaureat Sesiune Speciala 2022, S3.1 - Descompunere n=x^2*y^2 cu x minim",
    difficulty: "medium",
    tags: ["bacalaureat", "2022", "speciala", "subiectul3", "patrate-perfecte"],
    statement:
      "Subprogramul patrate are trei parametri:\n" +
      "- n, prin care primeste un numar natural (n in [2,10^9]);\n" +
      "- x si y, prin care furnizeaza cate un numar natural cu proprietatea ca x^2*y^2=n si 2<=x<y sau valoarea 0, prin fiecare dintre acestea, daca nu exista doua astfel de numere. Daca sunt mai multe astfel de valori, se furnizeaza cele corespunzatoare unei valori minime a lui x.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: pentru n=400, dupa apel, x=2 si y=10, iar pentru n=16 sau n=24, dupa apel, x=0 si y=0.",
    input_format: "Se citeste de la tastatura numarul natural n.",
    output_format: "Se afiseaza x si y, separate printr-un spatiu.",
    constraints: "2 <= n <= 10^9",
    hints: "x^2*y^2=n inseamna (x*y)^2=n, deci n trebuie sa fie patrat perfect; fie m=radical(n). Cautati cel mai mic divizor x>=2 al lui m astfel incat x < m/x.",
    explanation:
      "Din x^2*y^2=n rezulta (xy)^2=n, deci n trebuie sa fie patrat perfect; daca nu este, raspunsul este 0,0. Altfel, fie m=radical intreg al lui n; se cauta cel mai mic divizor x>=2 al lui m, cu proprietatea x < m/x (adica x^2 < m, ceea ce garanteaza x<y unde y=m/x); primul asemenea x gasit, parcurgand divizorii in ordine crescatoare, este solutia cu x minim. Daca nu se gaseste niciun asemenea divizor, raspunsul este 0,0.\n\n**Complexitate:** O(sqrt(n))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    long long x, y;
    patrate(n, x, y);
    cout << x << " " << y << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
x, y = patrate(n)
print(x, y)
`,
    cpp: `void patrate(long long n, long long& x, long long& y) {
    long long m = (long long)sqrtl((long double)n);
    while (m * m > n) m--;
    while ((m + 1) * (m + 1) <= n) m++;
    if (m * m != n) { x = 0; y = 0; return; }
    for (long long d = 2; d * d < m; d++) {
        if (m % d == 0) { x = d; y = m / d; return; }
    }
    x = 0; y = 0;
}
`,
    py: `import math
def patrate(n):
    m = math.isqrt(n)
    if m * m != n:
        return 0, 0
    d = 2
    while d * d < m:
        if m % d == 0:
            return d, m // d
        d += 1
    return 0, 0
`,
    tests: ["400", "16", "24", "1000000000", "144"],
  },
  {
    slug: "bac-speciala-2022-3-2",
    subcategoryId: "speciala-2022",
    title: "Bacalaureat Sesiune Speciala 2022, S3.2 - Eliminarea diagonalei principale",
    difficulty: "medium",
    tags: ["bacalaureat", "2022", "speciala", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Suprafata unei scene a fost impartita in zone dispuse ca elementele unui tablou bidimensional cu numar egal de linii si coloane. Dirijorul hotaraste eliminarea tuturor instrumentelor plasate pe diagonala principala a tabloului si rearanjarea celor pastrate, prin deplasarea unora dintre acestea cu cate o pozitie spre stanga, astfel incat sa nu existe zone intermediare libere.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura numere naturale din intervalul [2,10^2], si anume n si elementele unui tablou bidimensional cu n linii si n coloane, reprezentand numerele de identificare ale instrumentelor. Programul modifica apoi tabloul in memorie corespunzator hotararii dirijorului si afiseaza pe ecran tabloul obtinut, fiecare linie a tabloului pe cate o linie a ecranului, elementele de pe aceeasi linie fiind separate prin cate un spatiu.\n\n" +
      "Exemplu: pentru n=4 si tabloul\n20 30 80 52\n71 93 64 51\n62 81 55 49\n90 65 32 22\n" +
      "se obtine tabloul\n30 80 52\n71 64 51\n62 81 49\n90 65 32",
    input_format: "Se citesc n, apoi elementele tabloului cu n linii si n coloane.",
    output_format: "Se afiseaza tabloul obtinut prin eliminarea elementului de pe diagonala principala din fiecare linie, fiecare linie ramasa (n-1 elemente) pe cate o linie a ecranului.",
    constraints: "2 <= n <= 100",
    hints: "Pentru fiecare linie i, afisati toate elementele, cu exceptia celui de pe coloana i (elementul de pe diagonala principala a acelei linii).",
    explanation: "Pentru fiecare linie i a tabloului, se omite elementul de pe coloana i (aflat pe diagonala principala), iar restul elementelor liniei se afiseaza in ordinea lor originala; deoarece se omite un singur element din mijlocul listei, celelalte raman automat 'lipite', echivalent cu deplasarea spre stanga ceruta.\n\n**Complexitate:** O(n^2)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<vector<long long>> a(n, vector<long long>(n));
    for (auto& row : a) for (auto& v : row) cin >> v;
    for (int i = 0; i < n; i++) {
        vector<long long> rez;
        for (int j = 0; j < n; j++) if (j != i) rez.push_back(a[i][j]);
        for (size_t k = 0; k < rez.size(); k++) cout << rez[k] << (k + 1 < rez.size() ? " " : "\\n");
    }
    return 0;
}
`,
    py: `n = int(input())
a = [list(map(int, input().split())) for _ in range(n)]
for i in range(n):
    rez = [str(a[i][j]) for j in range(n) if j != i]
    print(" ".join(rez))
`,
    tests: [
      "4\n20 30 80 52\n71 93 64 51\n62 81 55 49\n90 65 32 22",
      "2\n1 2\n3 4",
      "3\n1 2 3\n4 5 6\n7 8 9",
      "5\n1 2 3 4 5\n6 7 8 9 10\n11 12 13 14 15\n16 17 18 19 20\n21 22 23 24 25",
      "2\n5 6\n7 8",
    ],
  },
  {
    slug: "bac-speciala-2022-3-3",
    subcategoryId: "speciala-2022",
    title: "Bacalaureat Sesiune Speciala 2022, S3.3 - Cea mai lunga secventa progresiva",
    difficulty: "hard",
    tags: ["bacalaureat", "2022", "speciala", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Numim secventa progresiva a unui sir crescator de numere naturale un subsir al acestuia, format din termeni aflati pe pozitii consecutive in sirul dat, cu proprietatea ca fiecare termen apare in subsir de un numar de ori egal cu valoarea sa. Lungimea secventei este egala cu numarul de termeni ai acesteia.\n\n" +
      "Fisierul bac.txt contine un sir crescator de cel mult 10^6 numere naturale din intervalul [1,10^6], astfel incat orice termen al sirului apare de un numar de ori cel mult egal cu valoarea sa. Numerele sunt separate prin cate un spatiu.\n\n" +
      "Se cere sa se afiseze pe ecran lungimea maxima a unei secvente progresive din sirul aflat in fisier. Proiectati un algoritm eficient din punctul de vedere al timpului de executare si al memoriei utilizate.\n\n" +
      "Exemplu: daca fisierul contine numerele 1 2 2 3 4 4 4 4 6 6 6 6 6 6 7 7 7 8 8 8 8 8 8 8 8 atunci pe ecran se afiseaza valoarea 10.",
    input_format: "Fisierul bac.txt: un sir crescator de numere naturale din [1,10^6].",
    output_format: "Se afiseaza lungimea maxima a unei secvente progresive.",
    constraints: "sirul are cel mult 10^6 termeni, valori in [1, 10^6]",
    hints: "Deoarece sirul este crescator, valorile egale sunt grupate consecutiv. Un grup de valoare v este 'complet' daca apare exact v ori. Mentineti o suma a lungimilor grupurilor complete consecutive; resetati-o la 0 la orice grup incomplet, si retineti maximul acestei sume.",
    explanation:
      "Deoarece sirul este crescator, se poate parcurge o singura data, identificand grupurile de valori egale (fiecare grup fiind contiguu). Un grup cu valoarea v si numarul de aparitii c este 'complet' daca c==v (satisface exact conditia din definitie). Se mentine o suma continua ('streak') a lungimilor grupurilor complete CONSECUTIVE (adiacente in sir); la fiecare grup incomplet, aceasta suma se reseteaza la 0. Raspunsul este maximul acestei sume observat pe parcursul intregii parcurgeri.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    long long curVal = -1, curCount = 0, streak = 0, best = 0, v;
    auto finalize = [&]() {
        if (curVal != -1) {
            if (curCount == curVal) { streak += curCount; best = max(best, streak); }
            else streak = 0;
        }
    };
    while (cin >> v) {
        if (v == curVal) curCount++;
        else { finalize(); curVal = v; curCount = 1; }
    }
    finalize();
    cout << best << "\\n";
    return 0;
}
`,
    py: `cur_val, cur_count, streak, best = -1, 0, 0, 0
def finalize():
    global streak, best
    if cur_val != -1:
        if cur_count == cur_val:
            streak += cur_count
            best = max(best, streak)
        else:
            streak = 0
with open("bac.txt") as f:
    data = f.read().split()
for tok in data:
    v = int(tok)
    if v == cur_val:
        cur_count += 1
    else:
        finalize()
        cur_val, cur_count = v, 1
finalize()
print(best)
`,
    tests: [
      "1 2 2 3 4 4 4 4 6 6 6 6 6 6 7 7 7 8 8 8 8 8 8 8 8",
      "1 1",
      "1 2",
      "5 5 5 5 5",
      (() => {
        const parts = [];
        for (let v = 1; v <= 200; v++) for (let t = 0; t < v; t++) parts.push(String(v));
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== SESIUNEA TOAMNA 2022 =====================
  {
    slug: "bac-toamna-2022-3-1",
    subcategoryId: "toamna-2022",
    title: "Bacalaureat Toamna 2022, S3.1 - Inlocuirea unei cifre pe o pozitie data",
    difficulty: "medium",
    tags: ["bacalaureat", "2022", "toamna", "subiectul3", "cifre"],
    statement:
      "Subprogramul schimb are trei parametri:\n" +
      "- n si x, prin care primeste cate un numar natural (n in [0,10^8], x in [1,9]);\n" +
      "- p, prin care primeste un numar natural reprezentand pozitia unei cifre a numarului n (0<=p). Pozitiile cifrelor sunt numerotate de la dreapta la stanga, astfel: cifra unitatilor este pe pozitia 0, cifra zecilor este pe pozitia 1 s.a.m.d.\n\n" +
      "Subprogramul transforma numarul n, inlocuind cifra de pe pozitia p cu cifra x, si furnizeaza numarul obtinut tot prin parametrul n.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=12587, x=6 si p=3, dupa apel, n=16587.",
    input_format: "Se citesc de la tastatura n, x si p.",
    output_format: "Se afiseaza numarul obtinut dupa inlocuirea cifrei.",
    constraints: "0 <= n <= 10^8, 1 <= x <= 9, 0 <= p, cifra de pe pozitia p a lui n exista",
    hints: "Calculati puterea 10^p; cifra de pe pozitia p este (n/10^p)%10. Adaugati la n diferenta (x - cifra_veche)*10^p.",
    explanation: "Se calculeaza puterea zecii corespunzatoare pozitiei p, put=10^p; cifra actuala de pe acea pozitie este (n/put)%10. Se obtine noua valoare a lui n adaugand la n diferenta dintre noua cifra si cea veche, inmultita cu put: n_nou = n + (x - cifra_veche)*put.\n\n**Complexitate:** O(1) (sau O(p) pentru calculul puterii)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; int x; long long p; cin >> n >> x >> p;
    schimb(n, x, p);
    cout << n << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n, x, p = map(int, input().split())
print(schimb(n, x, p))
`,
    cpp: `void schimb(long long& n, int x, long long p) {
    long long put = 1;
    for (long long i = 0; i < p; i++) put *= 10;
    long long cifraVeche = (n / put) % 10;
    n = n + (x - cifraVeche) * put;
}
`,
    py: `def schimb(n, x, p):
    put = 10 ** p
    cifra_veche = (n // put) % 10
    return n + (x - cifra_veche) * put
`,
    tests: ["12587 6 3", "0 5 0", "100000000 9 8", "999 1 0", "20222022 7 5"],
  },
  {
    slug: "bac-toamna-2022-3-2",
    subcategoryId: "toamna-2022",
    title: "Bacalaureat Toamna 2022, S3.2 - Codificarea parolei cu vocale prietene",
    difficulty: "medium",
    tags: ["bacalaureat", "2022", "toamna", "subiectul3", "siruri-caractere"],
    statement:
      "Se considera o vocala oarecare a alfabetului englez, notata cu v, si o consoana oarecare a alfabetului englez, notata cu c. Litera v se numeste vocala prietena a lui c daca in sirul literelor alfabetului englez, ordonat lexicografic, v il precede pe c, iar intre v si c nu exista nicio vocala. Se considera vocale literele a, e, i, o, u.\n\n" +
      "Exemplu: e este vocala prietena pentru consoanele f, g si h, dar nu este vocala prietena pentru consoanele d si j.\n\n" +
      "Un cuvant de cel mult 50 de caractere, litere mici ale alfabetului englez, cel putin una fiind consoana, reprezinta o parola. Codificarea se face prin inlocuirea fiecarei consoane cu vocala sa prietena.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura un cuvant, reprezentand o parola de tipul precizat si determina, in memorie, forma codificata a acesteia. Programul afiseaza pe ecran parola codificata obtinuta.\n\n" +
      "Exemplu: pentru parola rame se afiseaza oaie, iar pentru parola sport se afiseaza ooooo.",
    input_format: "Se citeste de la tastatura un cuvant (litere mici).",
    output_format: "Se afiseaza cuvantul codificat: fiecare consoana este inlocuita cu vocala sa prietena, vocalele raman neschimbate.",
    constraints: "cuvantul are cel mult 50 de caractere, contine cel putin o consoana",
    hints: "Parcurgeti alfabetul de la 'a' la 'z', retinand ultima vocala intalnita pana la fiecare litera; aceasta este vocala prietena a literei, daca litera este consoana.",
    explanation:
      "Se precalculeaza, pentru fiecare litera a alfabetului, cea mai apropiata vocala care o precede (parcurgand alfabetul de la 'a' la 'z' si retinand ultima vocala vazuta pana la fiecare pozitie); aceasta este exact 'vocala prietena', deoarece este vocala imediat anterioara, deci nicio alta vocala nu se afla intre ele. Apoi, pentru fiecare litera a cuvantului, daca este consoana, se inlocuieste cu vocala prietena precalculata; vocalele raman neschimbate.\n\n**Complexitate:** O(26 + lungimea cuvantului)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string vocale = "aeiou";
    vector<char> prietena(26, '?');
    char ultimaVocala = '?';
    for (int i = 0; i < 26; i++) {
        char c = 'a' + i;
        if (vocale.find(c) != string::npos) { ultimaVocala = c; prietena[i] = c; }
        else prietena[i] = ultimaVocala;
    }
    string w; cin >> w;
    string rez;
    for (char c : w) {
        if (vocale.find(c) != string::npos) rez += c;
        else rez += prietena[c - 'a'];
    }
    cout << rez << "\\n";
    return 0;
}
`,
    py: `vocale = set("aeiou")
prietena = ['?'] * 26
ultima = '?'
for i in range(26):
    c = chr(ord('a') + i)
    if c in vocale:
        ultima = c
        prietena[i] = c
    else:
        prietena[i] = ultima
w = input().strip()
rez = []
for c in w:
    if c in vocale:
        rez.append(c)
    else:
        rez.append(prietena[ord(c) - ord('a')])
print("".join(rez))
`,
    tests: ["rame", "sport", "bcdfg", "aeiou", "xyz"],
  },
  {
    slug: "bac-toamna-2022-3-3",
    subcategoryId: "toamna-2022",
    title: "Bacalaureat Toamna 2022, S3.3 - Secvente paritare de lungime maxima",
    difficulty: "hard",
    tags: ["bacalaureat", "2022", "toamna", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Numim secventa paritara a unui sir de numere naturale un subsir al acestuia, format din termeni cu aceeasi paritate, aflati pe pozitii consecutive in sirul dat. Lungimea secventei este egala cu numarul de termeni ai acesteia.\n\n" +
      "Fisierul bac.txt contine un sir de cel putin doua si cel mult 10^6 numere naturale din intervalul [0,10^9]. Numerele sunt separate prin cate un spatiu, iar in sir exista cel putin doi termeni cu aceeasi paritate pe pozitii consecutive.\n\n" +
      "Se cere sa se afiseze pe ecran numarul secventelor paritare de lungime maxima din sirul aflat in fisier, precum si aceasta lungime maxima. Numerele afisate sunt separate printr-un spatiu.\n\n" +
      "Proiectati un algoritm eficient din punctul de vedere al timpului de executare si al memoriei utilizate.\n\n" +
      "Exemplu: daca fisierul contine numerele 2 3 5 1 7 9 8 4 4 11 15 17 21 11 6 11 15 17 21 11 6 5 2 6 4 0 16 atunci pe ecran se afiseaza valorile 4 5.",
    input_format: "Fisierul bac.txt: un sir de numere naturale din [0,10^9], separate prin spatiu.",
    output_format: "Se afiseaza numarul de secvente paritare de lungime maxima, urmat de aceasta lungime maxima, separate printr-un spatiu.",
    constraints: "cel mult 10^6 termeni",
    hints: "Parcurgeti sirul mentinand lungimea segmentului curent de aceeasi paritate; de fiecare data cand paritatea se schimba (sau la finalul sirului), comparati lungimea segmentului incheiat cu maximul curent.",
    explanation:
      "Se parcurge sirul o singura data, mentinand paritatea si lungimea segmentului curent (maximal) de termeni consecutivi cu aceeasi paritate. De fiecare data cand se citeste un termen cu paritate diferita de a segmentului curent (sau la finalul sirului), segmentul se incheie: daca lungimea sa este mai mare decat maximul retinut, se actualizeaza maximul si contorul devine 1; daca este egala cu maximul, contorul se incrementeaza. Se porneste un nou segment cu noul termen.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    long long v;
    int curParity = -1;
    long long curLen = 0, bestLen = 0, bestCount = 0;
    auto finalize = [&]() {
        if (curLen > 0) {
            if (curLen > bestLen) { bestLen = curLen; bestCount = 1; }
            else if (curLen == bestLen) bestCount++;
        }
    };
    while (cin >> v) {
        int p = (int)(v % 2);
        if (p == curParity) curLen++;
        else { finalize(); curParity = p; curLen = 1; }
    }
    finalize();
    cout << bestCount << " " << bestLen << "\\n";
    return 0;
}
`,
    py: `cur_parity = -1
cur_len = 0
best_len = 0
best_count = 0
def finalize():
    global best_len, best_count
    if cur_len > 0:
        if cur_len > best_len:
            best_len = cur_len
            best_count = 1
        elif cur_len == best_len:
            best_count += 1
with open("bac.txt") as f:
    data = f.read().split()
for tok in data:
    v = int(tok)
    p = v % 2
    if p == cur_parity:
        cur_len += 1
    else:
        finalize()
        cur_parity, cur_len = p, 1
finalize()
print(best_count, best_len)
`,
    tests: [
      "2 3 5 1 7 9 8 4 4 11 15 17 21 11 6 11 15 17 21 11 6 5 2 6 4 0 16",
      "1 2",
      "2 2 2",
      "1 3 5 7",
      (() => {
        const parts = [];
        for (let block = 0; block < 3000; block++) {
          const len = (block % 5) + 1;
          const parity = block % 2;
          for (let t = 0; t < len; t++) parts.push(String(parity === 0 ? 2 : 1));
        }
        return parts.join(" ");
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
