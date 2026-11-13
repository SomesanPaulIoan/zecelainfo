const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const LEVEL = "bacalaureat";
const CHAPTER = { id: "bacalaureat-2023", name: "Bacalaureat 2023" };

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

const SRC = "Bacalaureat Informatica MI 2023 (Ministerul Educatiei / CNPEE)";

const problems = [
  // ===================== SESIUNEA VARA 2023 =====================
  {
    slug: "bac-vara-2023-3-1",
    subcategoryId: "vara-2023",
    title: "Bacalaureat Vara 2023, S3.1 - Numar abundent",
    difficulty: "hard",
    tags: ["bacalaureat", "2023", "vara", "subiectul3", "divizori"],
    statement:
      "Un numar natural nenul, n, se numeste numar abundent daca S(n)/n>S(k)/k, pentru orice numar natural nenul k (k<=n-1), unde s-a notat cu S(i) suma divizorilor pozitivi ai numarului natural nenul i.\n\n" +
      "Subprogramul abundent are un singur parametru, n, prin care primeste un numar natural (n in [2,10^6]). Subprogramul returneaza valoarea 1, daca n este un numar abundent, sau valoarea 0, in caz contrar.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: pentru n=6, subprogramul returneaza valoarea 1 (S(6)/6=2, iar cel mai mare raport obtinut pentru valori strict mai mici decat 6 este S(4)/4=1.75), iar pentru n=7 sau n=8, subprogramul returneaza valoarea 0.",
    input_format: "Se citeste de la tastatura numarul natural n.",
    output_format: "Se afiseaza 1 daca n este numar abundent, altfel 0.",
    constraints: "2 <= n <= 10^6",
    hints: "Calculati S(i) pentru toate valorile i=1..n printr-un ciur de sumare a divizorilor (pentru fiecare d=1..n, adaugati d la S(m) pentru toti multiplii m ai lui d), apoi verificati daca raportul S(n)/n este strict mai mare decat toate rapoartele S(k)/k pentru k<n, comparand prin inmultire incrucisata (fara imparitre in virgula mobila).",
    explanation:
      "Se calculeaza S(i) pentru toate valorile i de la 1 la n printr-un ciur asemanator ciurului lui Eratostene: pentru fiecare d de la 1 la n, se adauga d la S(m) pentru fiecare multiplu m al lui d (aceasta este echivalent cu a insuma toti divizorii fiecarui numar, in O(n log n) in loc de O(n*sqrt(n))). Apoi se determina raportul maxim S(k)/k pentru k=1..n-1, comparand fractiile prin inmultire incrucisata (S(k)*bestK vs bestS*k) pentru a evita erorile de precizie ale numerelor reale. n este abundent daca si numai daca S(n)/n este strict mai mare decat acest maxim.\n\n**Complexitate:** O(n log n)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    time_limit_ms: 3000,
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int n; cin >> n;
    cout << abundent(n) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(abundent(n))
`,
    cpp: `int abundent(int n) {
    vector<long long> S(n + 1, 0);
    for (int d = 1; d <= n; d++)
        for (int m = d; m <= n; m += d)
            S[m] += d;
    long long bestS = S[1], bestK = 1;
    for (int k = 2; k <= n - 1; k++) {
        if (S[k] * bestK > bestS * (long long)k) { bestS = S[k]; bestK = k; }
    }
    if (n == 1) return 0;
    return (S[n] * bestK > bestS * (long long)n) ? 1 : 0;
}
`,
    py: `def abundent(n):
    S = [0] * (n + 1)
    for d in range(1, n + 1):
        for m in range(d, n + 1, d):
            S[m] += d
    best_s, best_k = S[1], 1
    for k in range(2, n):
        if S[k] * best_k > best_s * k:
            best_s, best_k = S[k], k
    return 1 if S[n] * best_k > best_s * n else 0
`,
    tests: ["6", "7", "8", "12", "24"],
  },
  {
    slug: "bac-vara-2023-3-2",
    subcategoryId: "vara-2023",
    title: "Bacalaureat Vara 2023, S3.2 - Talvegul unui rau",
    difficulty: "medium",
    tags: ["bacalaureat", "2023", "vara", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Pentru a identifica punctele in care se concentreaza apa in albia unui rau, se determina talvegul acesteia - linia care uneste punctele cele mai adanci ale albiei. In acest scop s-au stabilit ns sectiuni transversale pe cursul apei, numerotate incepand de la 1, si in cadrul fiecarei sectiuni s-a masurat adancimea apei in np puncte, numerotate incepand de la 1. Din fiecare sectiune, in ordine, se include in talveg cel mai adanc punct al acesteia, iar daca in sectiune sunt mai multe puncte aflate la aceeasi adancime, maxima, se va lua in considerare doar primul dintre ele.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura doua numere naturale, ns si np (ns in [1,10^3], np in [1,50]), si cele ns*np elemente ale unui tablou bidimensional, valori naturale din intervalul [0,10^2]. Fiecare linie a tabloului corespunde cate unei sectiuni, iar valorile memorate pe linie reprezinta adancimile celor np puncte stabilite pentru acea sectiune. Programul afiseaza pe ecran, pentru fiecare sectiune, o pereche formata din numarul de ordine al sectiunii si numarul de ordine al punctului sau care s-a inclus in talveg. Numerele din fiecare pereche sunt afisate separate prin caracterul : (doua puncte), iar fiecare pereche este urmata de un spatiu.\n\n" +
      "Exemplu: pentru ns=6, np=4 si tabloul\n2 4 5 3\n2 6 6 3\n1 5 2 5\n1 3 3 3\n3 4 3 5\n0 1 2 1\n" +
      "se afiseaza pe ecran valorile: 1:3 2:2 3:2 4:2 5:4 6:3",
    input_format: "Se citesc ns, np, apoi elementele tabloului cu ns linii si np coloane.",
    output_format: "Se afiseaza, pentru fiecare sectiune, perechea 'nrSectiune:nrPunct', separate prin spatiu.",
    constraints: "1 <= ns <= 1000, 1 <= np <= 50, 0 <= adancime <= 100",
    hints: "Pentru fiecare linie (sectiune), gasiti pozitia (1-indexata) primei aparitii a valorii maxime din acea linie.",
    explanation: "Pentru fiecare sectiune (linie a tabloului), se cauta valoarea maxima si indicele (1-indexat) primei sale aparitii pe acea linie; se afiseaza perechea numarul sectiunii si acest indice.\n\n**Complexitate:** O(ns*np)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int ns, np; cin >> ns >> np;
    for (int i = 1; i <= ns; i++) {
        int best = -1, bestIdx = -1;
        for (int j = 1; j <= np; j++) {
            int v; cin >> v;
            if (v > best) { best = v; bestIdx = j; }
        }
        cout << i << ":" << bestIdx << " ";
    }
    cout << "\\n";
    return 0;
}
`,
    py: `ns, np = map(int, input().split())
out = []
for i in range(1, ns + 1):
    row = list(map(int, input().split()))
    best = max(row)
    idx = row.index(best) + 1
    out.append(f"{i}:{idx}")
print(" ".join(out) + " ")
`,
    tests: [
      "6 4\n2 4 5 3\n2 6 6 3\n1 5 2 5\n1 3 3 3\n3 4 3 5\n0 1 2 1",
      "1 1\n5",
      "2 3\n1 1 1\n5 5 5",
      "3 2\n0 0\n1 0\n0 1",
      "2 5\n1 2 3 4 5\n5 4 3 2 1",
    ],
  },
  {
    slug: "bac-vara-2023-3-3",
    subcategoryId: "vara-2023",
    title: "Bacalaureat Vara 2023, S3.3 - Valori de doua cifre egale ca prefix si sufix",
    difficulty: "hard",
    tags: ["bacalaureat", "2023", "vara", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Un numar natural x este numit prefix al unui numar natural y daca se obtine din acesta prin eliminarea a cel putin unei cifre de la dreapta sa, si este numit sufix al lui y daca se obtine din acesta prin eliminarea a cel putin unei cifre de la stanga sa.\n\n" +
      "Exemplu: 15 este prefix pentru 154 sau 1521, este sufix pentru 3415 sau 5115, dar nu este nici prefix, nici sufix pentru 15.\n\n" +
      "Fisierul bac.txt contine maximum 10^6 numere naturale din intervalul [10,10^4), separate prin cate un spatiu. Se cere sa se afiseze pe ecran numarul valorilor de doua cifre care apar de acelasi numar de ori ca sufix, respectiv ca prefix al numerelor din sirul aflat in fisier. Proiectati un algoritm eficient din punctul de vedere al timpului de executare.\n\n" +
      "Exemplu: daca fisierul are continutul 342 1684 2134 5434 111 98 98 3405 3412 7016 8634 1010 102 310 se afiseaza pe ecran: 4 (pentru valorile 10, 11, 16, 34).",
    input_format: "Fisierul bac.txt: numere naturale din [10,10^4), separate prin spatiu.",
    output_format: "Se afiseaza numarul valorilor de doua cifre v pentru care numarul de aparitii ca prefix este egal (si nenul) cu numarul de aparitii ca sufix, printre numerele din sir.",
    constraints: "cel mult 10^6 numere, fiecare in [10,10^4)",
    hints: "Pentru fiecare numar cu cel putin 3 cifre, calculati valoarea de 2 cifre formata din primele sale doua cifre (prefixul) si valoarea formata din ultimele sale doua cifre (sufixul, daca este >=10); numarati aparitiile in doua tablouri de dimensiune 100.",
    explanation:
      "Pentru fiecare numar din fisier cu cel putin 3 cifre (adica valoare >=100), se calculeaza prefixul de 2 cifre (reducand repetat numarul prin impartire la 10 pana ajunge sub 100) si se incrementeaza contorul de prefixe pentru acea valoare; separat, se calculeaza sufixul de 2 cifre (numar%100) si, daca acesta este >=10 (fara zero nesemnificativ), se incrementeaza contorul de sufixe. La final, se numara cate valori v din [10,99] au contorul de prefix egal cu cel de sufix, ambele nenule.\n\n**Complexitate:** O(n) timp",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    vector<long long> pref(100, 0), suf(100, 0);
    long long v;
    while (cin >> v) {
        if (v >= 100) {
            long long t = v;
            while (t >= 100) t /= 10;
            pref[t]++;
            long long s = v % 100;
            if (s >= 10) suf[s]++;
        }
    }
    int cnt = 0;
    for (int d = 10; d <= 99; d++) if (pref[d] == suf[d] && pref[d] > 0) cnt++;
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `pref = [0] * 100
suf = [0] * 100
with open("bac.txt") as f:
    data = f.read().split()
for tok in data:
    v = int(tok)
    if v >= 100:
        t = v
        while t >= 100:
            t //= 10
        pref[t] += 1
        s = v % 100
        if s >= 10:
            suf[s] += 1
cnt = 0
for d in range(10, 100):
    if pref[d] == suf[d] and pref[d] > 0:
        cnt += 1
print(cnt)
`,
    tests: [
      "342 1684 2134 5434 111 98 98 3405 3412 7016 8634 1010 102 310",
      "100 200",
      "1234",
      "10 10",
      (() => {
        const parts = [];
        for (let i = 0; i < 15000; i++) {
          const p = 10 + (i % 90);
          const s = 10 + ((i + 7) % 90);
          parts.push(String(p * 100 + s));
        }
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== MODEL 2023 =====================
  {
    slug: "bac-model-2023-3-1",
    subcategoryId: "model-2023",
    title: "Bacalaureat Model 2023, S3.1 - Verificare cifre din multimea {2,3}",
    difficulty: "medium",
    tags: ["bacalaureat", "2023", "model", "subiectul3", "cifre"],
    statement:
      "Subprogramul DoiTrei are un parametru, n, prin care primeste un numar natural (n in [0,10^9]). Subprogramul returneaza valoarea 1 daca toate cifrele lui n sunt din multimea {2,3} sau valoarea 0 in caz contrar.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=22323 sau n=3, atunci subprogramul returneaza 1, iar daca n=2023 atunci subprogramul returneaza 0.",
    input_format: "Se citeste de la tastatura numarul natural n.",
    output_format: "Se afiseaza 1 daca toate cifrele lui n sunt 2 sau 3, altfel 0.",
    constraints: "0 <= n <= 10^9",
    hints: "Parcurgeti cifrele lui n (inclusiv cazul special n=0) si verificati ca fiecare este 2 sau 3.",
    explanation: "Se extrag cifrele lui n prin impartiri si resturi succesive la 10; daca oricare dintre ele nu este 2 sau 3, raspunsul este 0. Cazul special n=0 are o singura cifra, 0, care nu este in multimea {2,3}, deci raspunsul este 0.\n\n**Complexitate:** O(numar de cifre)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    cout << DoiTrei(n) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(DoiTrei(n))
`,
    cpp: `int DoiTrei(long long n) {
    if (n == 0) return 0;
    while (n > 0) {
        int c = n % 10;
        if (c != 2 && c != 3) return 0;
        n /= 10;
    }
    return 1;
}
`,
    py: `def DoiTrei(n):
    if n == 0:
        return 0
    while n > 0:
        c = n % 10
        if c != 2 and c != 3:
            return 0
        n //= 10
    return 1
`,
    tests: ["22323", "3", "2023", "0", "222222222"],
  },
  {
    slug: "bac-model-2023-3-2",
    subcategoryId: "model-2023",
    title: "Bacalaureat Model 2023, S3.2 - Carusele fara tobogan vecin",
    difficulty: "medium",
    tags: ["bacalaureat", "2023", "model", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Suprafata unui loc de joaca pentru copii este impartita in n*n zone patrate dispuse pe n randuri si n coloane, in fiecare zona fiind plasat un tobogan (cod 0), un leagan (cod 1), un balansoar (cod 2) sau un carusel (cod 3).\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura un numar natural, n (n in [1,10^2]), si cele n*n elemente ale unui tablou bidimensional cu codurile zonelor. Programul determina zonele destinate plasarii cate unui carusel, care NU au nicio latura comuna cu o zona cu tobogan si, pentru fiecare dintre acestea, afiseaza pe ecran numarul de ordine al randului pe care se afla. Numerele afisate sunt separate prin cate un spatiu, iar daca nu exista nicio astfel de zona, se afiseaza pe ecran mesajul nu exista.\n\n" +
      "Exemplu: pentru n=6 si tabloul\n2 0 0 2 1 3\n3 1 3 1 2 0\n2 1 3 3 2 0\n0 2 1 3 1 1\n3 1 2 0 0 2\n0 0 0 2 1 3\n" +
      "se afiseaza pe ecran, nu neaparat in aceasta ordine, numerele: 2 3 3 6.",
    input_format: "Se citesc n, apoi elementele tabloului cu n linii si n coloane.",
    output_format: "Se afiseaza numerele randurilor zonelor cu carusel fara vecin tobogan, separate prin spatiu, sau 'nu exista' daca nu exista niciuna.",
    constraints: "1 <= n <= 100",
    hints: "Pentru fiecare zona cu cod 3, verificati daca niciunul dintre vecinii sai existenti (sus, jos, stanga, dreapta) nu are codul 0.",
    explanation: "Se parcurg toate zonele; pentru fiecare zona cu cod 3 (carusel), se verifica daca niciunul dintre vecinii sai directi existenti (nord, sud, est, vest) nu are codul 0 (tobogan); daca aceasta conditie este indeplinita, se afiseaza numarul randului acelei zone (o data pentru fiecare astfel de zona, chiar daca apar mai multe pe acelasi rand).\n\n**Complexitate:** O(n^2)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<vector<int>> a(n, vector<int>(n));
    for (auto& row : a) for (auto& v : row) cin >> v;
    int dr[4] = {-1, 1, 0, 0}, dc[4] = {0, 0, -1, 1};
    vector<int> rez;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            if (a[i][j] != 3) continue;
            bool ok = true;
            for (int d = 0; d < 4; d++) {
                int ni = i + dr[d], nj = j + dc[d];
                if (ni >= 0 && ni < n && nj >= 0 && nj < n && a[ni][nj] == 0) ok = false;
            }
            if (ok) rez.push_back(i + 1);
        }
    }
    if (rez.empty()) { cout << "nu exista\\n"; return 0; }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `n = int(input())
a = [list(map(int, input().split())) for _ in range(n)]
rez = []
for i in range(n):
    for j in range(n):
        if a[i][j] != 3:
            continue
        ok = True
        for di, dj in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ni, nj = i + di, j + dj
            if 0 <= ni < n and 0 <= nj < n and a[ni][nj] == 0:
                ok = False
        if ok:
            rez.append(i + 1)
print(" ".join(map(str, rez)) if rez else "nu exista")
`,
    tests: [
      "6\n2 0 0 2 1 3\n3 1 3 1 2 0\n2 1 3 3 2 0\n0 2 1 3 1 1\n3 1 2 0 0 2\n0 0 0 2 1 3",
      "1\n3",
      "1\n0",
      "2\n0 3\n1 1",
      "3\n3 3 3\n3 3 3\n3 3 3",
    ],
  },
  {
    slug: "bac-model-2023-3-3",
    subcategoryId: "model-2023",
    title: "Bacalaureat Model 2023, S3.3 - Sir p-ordonat",
    difficulty: "hard",
    tags: ["bacalaureat", "2023", "model", "subiectul3", "eficienta", "fisiere"],
    statement:
      "O pereche de numere naturale (x,y) se numeste p-ordonata daca x si y au paritate diferita, cu x>y, sau daca x si y au aceeasi paritate.\n\n" +
      "Exemplu: (7,4), (8,7), (7,9) sunt perechi p-ordonate, dar (7,8), (8,9) nu sunt perechi p-ordonate.\n\n" +
      "Un sir, format din 2*n numere naturale, se numeste p-ordonat daca perechile de forma (x,y) sunt p-ordonate, pentru orice x, dintre primii n termeni ai sirului, si orice y, dintre ultimii n termeni ai sirului.\n\n" +
      "Fisierul bac.txt contine numere naturale din intervalul [0,10^6]: pe prima linie un numar nenul, n, iar pe a doua linie un sir de 2*n numere. Se cere sa se afiseze pe ecran mesajul DA, in cazul in care sirul aflat in fisier este p-ordonat, sau mesajul NU, in caz contrar. Proiectati un algoritm eficient din punctul de vedere al timpului de executare si al memoriei utilizate.\n\n" +
      "Exemplu: pentru sirul 22 37 21 8 15 2 3 14 4 5 (n=5) se afiseaza pe ecran mesajul DA.",
    input_format: "Fisierul bac.txt: pe prima linie n, pe a doua linie sirul de 2n numere.",
    output_format: "Se afiseaza 'DA' daca sirul este p-ordonat, altfel 'NU'.",
    constraints: "1 <= n, valori in [0,10^6]",
    hints: "Sirul este p-ordonat daca si numai daca: minimul termenilor pari din prima jumatate este mai mare decat maximul termenilor impari din a doua jumatate, SI minimul termenilor impari din prima jumatate este mai mare decat maximul termenilor pari din a doua jumatate (conditiile lipsa fiind vacuu adevarate).",
    explanation:
      "Conditia ceruta priveste doar perechile de paritate DIFERITA (perechile de aceeasi paritate sunt mereu valide). Pentru ca toate perechile (x par din prima jumatate, y impar din a doua jumatate) sa satisfaca x>y, este necesar si suficient ca cel mai mic x par din prima jumatate sa fie strict mai mare decat cel mai mare y impar din a doua jumatate. Simetric, pentru perechile (x impar din prima jumatate, y par din a doua jumatate), este necesar ca cel mai mic x impar din prima jumatate sa fie strict mai mare decat cel mai mare y par din a doua jumatate. Se calculeaza aceste patru extreme (minPar1, minImpar1, maxPar2, maxImpar2) printr-o singura parcurgere a sirului, iar daca una dintre categorii lipseste, conditia corespunzatoare este automat satisfacuta.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    long long n; cin >> n;
    long long minParFirst = -1, minImparFirst = -1;
    long long maxParSecond = -1, maxImparSecond = -1;
    for (long long i = 0; i < n; i++) {
        long long v; cin >> v;
        if (v % 2 == 0) { if (minParFirst == -1 || v < minParFirst) minParFirst = v; }
        else { if (minImparFirst == -1 || v < minImparFirst) minImparFirst = v; }
    }
    for (long long i = 0; i < n; i++) {
        long long v; cin >> v;
        if (v % 2 == 0) { if (v > maxParSecond) maxParSecond = v; }
        else { if (v > maxImparSecond) maxImparSecond = v; }
    }
    bool ok1 = (minParFirst == -1 || maxImparSecond == -1 || minParFirst > maxImparSecond);
    bool ok2 = (minImparFirst == -1 || maxParSecond == -1 || minImparFirst > maxParSecond);
    cout << ((ok1 && ok2) ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `with open("bac.txt") as f:
    n = int(f.readline())
    vals = list(map(int, f.readline().split()))
first = vals[:n]
second = vals[n:2 * n]
minParFirst = min([v for v in first if v % 2 == 0], default=-1)
minImparFirst = min([v for v in first if v % 2 == 1], default=-1)
maxParSecond = max([v for v in second if v % 2 == 0], default=-1)
maxImparSecond = max([v for v in second if v % 2 == 1], default=-1)
ok1 = minParFirst == -1 or maxImparSecond == -1 or minParFirst > maxImparSecond
ok2 = minImparFirst == -1 or maxParSecond == -1 or minImparFirst > maxParSecond
print("DA" if (ok1 and ok2) else "NU")
`,
    tests: [
      "5\n22 37 21 8 15 2 3 14 4 5",
      "5\n22 36 20 8 14 44 42 4 2 5",
      "1\n2 2",
      "1\n1 2",
      (() => {
        const n = 15000;
        const first = [];
        const second = [];
        for (let i = 0; i < n; i++) first.push(String(1000 + (i % 500) * 2));
        for (let i = 0; i < n; i++) second.push(String(1 + (i % 500) * 2));
        return `${n}\n${first.join(" ")} ${second.join(" ")}`;
      })(),
    ],
  },
  // ===================== SIMULARE 2023 =====================
  {
    slug: "bac-simulare-2023-3-1",
    subcategoryId: "simulare-2023",
    title: "Bacalaureat Simulare 2023, S3.1 - Numere cu trei divizori impari",
    difficulty: "medium",
    tags: ["bacalaureat", "2023", "simulare", "subiectul3", "divizori"],
    statement:
      "Subprogramul NrImp are trei parametri:\n" +
      "- x si y, prin care primeste cate un numar natural (2<=x<y<=10^9);\n" +
      "- nr, prin care furnizeaza numarul valorilor naturale din intervalul [x,y] cu trei divizori pozitivi impari.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca x=4 si y=50, dupa apel nr=6 (pentru valorile 9, 18, 25, 36, 49, 50).",
    input_format: "Se citesc de la tastatura x si y.",
    output_format: "Se afiseaza numarul de valori din [x,y] cu exact trei divizori pozitivi impari.",
    constraints: "2 <= x < y <= 10^9, y-x moderat (pentru testare)",
    hints: "Un numar are exact trei divizori impari daca si numai daca 'partea impara' a sa (numarul ramas dupa eliminarea tuturor factorilor de 2) este patratul unui numar prim impar.",
    explanation:
      "Divizorii impari ai unui numar n sunt exact divizorii 'partii impare' a lui n (n dupa eliminarea repetata a factorului 2). Partea impara are exact 3 divizori daca si numai daca este de forma p^2 pentru un numar prim p (obligatoriu impar, deoarece partea impara e impara). Pentru fiecare valoare din [x,y], se elimina factorii de 2, se calculeaza radacina patrata intreaga a restului si se verifica daca ridicata la patrat reproduce exact acel rest, si daca radacina este un numar prim.\n\n**Complexitate:** O((y-x)*sqrt(y))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    time_limit_ms: 3000,
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long x, y; cin >> x >> y;
    long long nr;
    NrImp(x, y, nr);
    cout << nr << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

x, y = map(int, input().split())
print(NrImp(x, y))
`,
    cpp: `bool ePrim(long long v) {
    if (v < 2) return false;
    for (long long d = 2; d * d <= v; d++) if (v % d == 0) return false;
    return true;
}
void NrImp(long long x, long long y, long long& nr) {
    nr = 0;
    for (long long n = x; n <= y; n++) {
        long long odd = n;
        while (odd % 2 == 0) odd /= 2;
        long long r = (long long)sqrtl((long double)odd);
        while (r * r > odd) r--;
        while ((r + 1) * (r + 1) <= odd) r++;
        if (r * r == odd && ePrim(r)) nr++;
    }
}
`,
    py: `def e_prim(v):
    if v < 2:
        return False
    d = 2
    while d * d <= v:
        if v % d == 0:
            return False
        d += 1
    return True

def NrImp(x, y):
    import math
    nr = 0
    for n in range(x, y + 1):
        odd = n
        while odd % 2 == 0:
            odd //= 2
        r = math.isqrt(odd)
        if r * r == odd and e_prim(r):
            nr += 1
    return nr
`,
    tests: ["4 50", "2 10", "9 9", "100 300", "2 2000"],
  },
  {
    slug: "bac-simulare-2023-3-2",
    subcategoryId: "simulare-2023",
    title: "Bacalaureat Simulare 2023, S3.2 - Denumire stiintifica prescurtata",
    difficulty: "medium",
    tags: ["bacalaureat", "2023", "simulare", "subiectul3", "siruri-caractere"],
    statement:
      "Intr-un text de cel mult 100 de caractere cuvintele sunt separate prin cate un spatiu si sunt formate din litere mari ale alfabetului englez, iar daca sunt scrise prescurtat sunt urmate de caracterul . (punct). Textul reprezinta denumirea stiintifica a unei pasari si doar cuvintele din multimea {FAMILIA, GENUL, SPECIA}, specifice sistemului de clasificare a organismelor, sunt mereu prescurtate, prin eliminarea ultimelor lor litere, si apar mereu in aceasta ordine (familie, gen, specie).\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura un text de tipul precizat si construieste in memorie, apoi afiseaza pe ecran denumirea stiintifica, in care pentru cuvintele specifice sistemului de clasificare a organismelor se pastreaza doar primele trei litere, scrise cu litere mici, si urmate de punct.\n\n" +
      "Exemplu: pentru textul FAMIL. PHASIANIDAE GEN. MELEAGRIS SP. GALLOPAVO sau pentru textul FAM. PHASIANIDAE G. MELEAGRIS SPECI. GALLOPAVO se obtine fam. PHASIANIDAE gen. MELEAGRIS spe. GALLOPAVO",
    input_format: "Se citeste de la tastatura o linie de text.",
    output_format: "Se afiseaza textul transformat: primul, al doilea si al treilea cuvant prescurtat (terminat in punct) devin, in aceasta ordine, 'fam.', 'gen.', 'spe.'; celelalte cuvinte raman neschimbate.",
    constraints: "textul are cel mult 100 de caractere, contine exact trei cuvinte prescurtate, in ordinea familie-gen-specie",
    hints: "Parcurgeti tokenii textului, numarand de cate ori intalniti un cuvant care se termina cu punct; al k-lea astfel de cuvant se inlocuieste cu forma fixa corespunzatoare (fam./gen./spe.), indiferent de literele ramase in prescurtarea originala.",
    explanation:
      "Deoarece denumirea stiintifica respecta mereu ordinea familie-gen-specie, iar doar aceste trei cuvinte sunt prescurtate (terminate in punct), este suficient sa se numere aparitiile cuvintelor terminate in punct, in ordinea intalnirii lor in text: primul devine 'fam.', al doilea 'gen.', al treilea 'spe.', indiferent de cate litere efective a pastrat prescurtarea originala (unele prescurtari pot pastra chiar mai putin de 3 litere, ca in cazul SP.). Cuvintele care nu se termina in punct (numele stiintifice propriu-zise) raman neschimbate.\n\n**Complexitate:** O(lungimea textului)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    string tok;
    vector<string> fixed = {"fam.", "gen.", "spe."};
    int idx = 0;
    vector<string> rez;
    while (ss >> tok) {
        if (!tok.empty() && tok.back() == '.') {
            rez.push_back(idx < 3 ? fixed[idx] : tok);
            idx++;
        } else rez.push_back(tok);
    }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `line = input()
tokens = line.split()
fixed = ["fam.", "gen.", "spe."]
idx = 0
rez = []
for tok in tokens:
    if tok.endswith("."):
        rez.append(fixed[idx] if idx < 3 else tok)
        idx += 1
    else:
        rez.append(tok)
print(" ".join(rez))
`,
    tests: [
      "FAMIL. PHASIANIDAE GEN. MELEAGRIS SP. GALLOPAVO",
      "FAM. PHASIANIDAE G. MELEAGRIS SPECI. GALLOPAVO",
      "F. AAA G. BBB S. CCC",
      "FAMILI. UNU GENU. DOI SPECI. TREI",
      "FA. X GE. Y SP. Z",
    ],
  },
  {
    slug: "bac-simulare-2023-3-3",
    subcategoryId: "simulare-2023",
    title: "Bacalaureat Simulare 2023, S3.3 - Pasii reprezentativi",
    difficulty: "hard",
    tags: ["bacalaureat", "2023", "simulare", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Pentru a studia un metal, s-a urmarit comportamentul sau intr-o succesiune de pasi, la fiecare pas metalul fiind supus unei anumite temperaturi. Pasii sunt numerotati cu valori naturale consecutive, incepand de la 1. Un pas se numeste reprezentativ daca la niciunul dintre pasii anteriori nu este utilizata o temperatura strict mai mare decat la acest pas. Daca exista o secventa de pasi consecutivi la care se utilizeaza aceeasi temperatura, se considera reprezentativ doar primul pas din secventa.\n\n" +
      "Fisierul bac.txt contine cel mult 10^6 numere naturale din intervalul [0,10^4], separate prin cate un spatiu, reprezentand temperaturile la care este supus metalul, in ordinea pasilor corespunzatori. Se cere sa se afiseze pe ecran, separati prin cate un spatiu, pasii reprezentativi pentru datele din fisier. Proiectati un algoritm eficient din punctul de vedere al timpului de executare si al spatiului de memorie utilizat.\n\n" +
      "Exemplu: daca fisierul contine numerele 7 4 9 10 10 10 3 9 2 10 10 8 2 30 se afiseaza pe ecran 1 3 4 10 14",
    input_format: "Fisierul bac.txt: un sir de numere naturale din [0,10^4], separate prin spatiu.",
    output_format: "Se afiseaza numerele de ordine ale pasilor reprezentativi, in ordine crescatoare, separate prin spatiu.",
    constraints: "cel mult 10^6 termeni",
    hints: "Mentineti temperatura maxima observata pana la pasul precedent si temperatura pasului precedent. Un pas este reprezentativ daca temperatura sa este cel putin egala cu maximul anterior SI difera de temperatura pasului precedent (sau este primul pas).",
    explanation:
      "Se parcurge sirul o singura data, retinand temperatura maxima observata STRICT INAINTE de pasul curent si temperatura pasului imediat precedent. Pasul curent este reprezentativ daca temperatura sa este cel putin egala cu acest maxim anterior (adica niciun pas anterior nu are o temperatura strict mai mare) SI daca aceasta temperatura difera de cea a pasului imediat precedent (altfel, pasul curent este o continuare a unei secvente de pasi cu aceeasi temperatura, iar doar primul din secventa este reprezentativ). Dupa verificare, maximul si temperatura precedenta se actualizeaza cu valoarea curenta.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    long long runningMax = -1, prevTemp = -1;
    long long pos = 0, v;
    vector<long long> rez;
    while (cin >> v) {
        pos++;
        if (v >= runningMax && v != prevTemp) rez.push_back(pos);
        if (v > runningMax) runningMax = v;
        prevTemp = v;
    }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `running_max = -1
prev_temp = -1
pos = 0
rez = []
with open("bac.txt") as f:
    data = f.read().split()
for tok in data:
    v = int(tok)
    pos += 1
    if v >= running_max and v != prev_temp:
        rez.append(pos)
    if v > running_max:
        running_max = v
    prev_temp = v
print(" ".join(map(str, rez)))
`,
    tests: [
      "7 4 9 10 10 10 3 9 2 10 10 8 2 30",
      "5",
      "1 1 1 1",
      "1 2 3 4 5",
      (() => {
        const parts = [];
        for (let i = 0; i < 20000; i++) parts.push(String((i % 100) + 1));
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== SESIUNE SPECIALA 2023 =====================
  {
    slug: "bac-speciala-2023-3-1",
    subcategoryId: "speciala-2023",
    title: "Bacalaureat Sesiune Speciala 2023, S3.1 - Baza minima a unei puteri",
    difficulty: "medium",
    tags: ["bacalaureat", "2023", "speciala", "subiectul3", "puteri"],
    statement:
      "Subprogramul Putere are trei parametri:\n" +
      "- n, prin care primeste un numar natural (n in [2,10^9]);\n" +
      "- x si p, prin care furnizeaza doua numere naturale cu proprietatea ca n=x^p, iar x este cel mai mic numar cu aceasta proprietate.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=16 atunci, dupa apel, x=2 si p=4, daca n=216 atunci, dupa apel, x=6 si p=3, iar daca n=12 atunci, dupa apel, x=12 si p=1.",
    input_format: "Se citeste de la tastatura numarul natural n.",
    output_format: "Se afiseaza x si p, separate printr-un spatiu.",
    constraints: "2 <= n <= 10^9",
    hints: "Cautati cel mai mare exponent p pentru care n este o putere perfecta p (adica exista un numar intreg x cu x^p=n); acel p maxim da automat cel mai mic x posibil.",
    explanation:
      "Cu cat exponentul p este mai mare, cu atat baza x=n^(1/p) este mai mica; deci trebuie gasit cel mai mare p pentru care n este o putere p perfecta. Se incearca p descrescator, de la aproximativ log2(n) pana la 1, iar pentru fiecare p se cauta prin injumatatire (cautare binara) un x intreg cu x^p=n exact (folosind o functie de ridicare la putere care se opreste devreme daca rezultatul depaseste n, pentru a evita depasirea de capacitate). Primul p (cel mai mare) pentru care se gaseste un asemenea x da solutia; p=1 (cu x=n) functioneaza intotdeauna ca ultima optiune.\n\n**Complexitate:** O(log(n) * log(n) * log(n))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    long long x, p;
    Putere(n, x, p);
    cout << x << " " << p << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
x, p = Putere(n)
print(x, p)
`,
    cpp: `long long powCapped(long long base, long long exp, long long cap) {
    long long r = 1;
    for (long long i = 0; i < exp; i++) {
        r *= base;
        if (r > cap) return cap + 1;
    }
    return r;
}
void Putere(long long n, long long& x, long long& p) {
    int maxP = 1;
    while ((1LL << (maxP + 1)) <= n) maxP++;
    for (int cand = maxP; cand >= 1; cand--) {
        long long lo = 1, hi = n, found = -1;
        while (lo <= hi) {
            long long mid = lo + (hi - lo) / 2;
            long long val = powCapped(mid, cand, n);
            if (val == n) { found = mid; break; }
            else if (val < n) lo = mid + 1;
            else hi = mid - 1;
        }
        if (found != -1) { x = found; p = cand; return; }
    }
    x = n; p = 1;
}
`,
    py: `def pow_capped(base, exp, cap):
    r = 1
    for _ in range(exp):
        r *= base
        if r > cap:
            return cap + 1
    return r

def Putere(n):
    max_p = 1
    while (1 << (max_p + 1)) <= n:
        max_p += 1
    for cand in range(max_p, 0, -1):
        lo, hi, found = 1, n, -1
        while lo <= hi:
            mid = (lo + hi) // 2
            val = pow_capped(mid, cand, n)
            if val == n:
                found = mid
                break
            elif val < n:
                lo = mid + 1
            else:
                hi = mid - 1
        if found != -1:
            return found, cand
    return n, 1
`,
    tests: ["16", "216", "12", "1000000000", "2"],
  },
  {
    slug: "bac-speciala-2023-3-2",
    subcategoryId: "speciala-2023",
    title: "Bacalaureat Sesiune Speciala 2023, S3.2 - Zona de expunere a florilor",
    difficulty: "medium",
    tags: ["bacalaureat", "2023", "speciala", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "La o expozitie sunt prezentate mai multe tipuri de flori, fiecare avand un anumit cod. Zona de expunere este organizata pe n randuri, fiecare avand cate n parcele. Pe primul rand sunt expuse n tipuri de flori distincte. Celelalte parcele sunt ocupate astfel: toate parcelele aflate in dreapta diagonalei secundare sunt ocupate de gazon (cod -1); fiecare parcela aflata pe diagonala secundara sau in stanga acesteia contine flori cu un cod de cel mult doua cifre, obtinut din ultimele doua cifre ale sumei codurilor florilor aflate in doua parcele de pe randul anterior: cea de pe aceeasi coloana, respectiv cea de pe coloana din dreapta sa.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura un numar natural, n (n in [2,20]), apoi n numere naturale distincte din intervalul [0,10^2), reprezentand codurile florilor de pe primul rand. Programul construieste in memorie tabloul si il afiseaza pe ecran, fiecare linie pe cate o linie a ecranului, elementele separate prin cate un spatiu.\n\n" +
      "Exemplu: pentru n=5 si codurile 90, 10, 4, 27, 30 se obtine tabloul\n90 10 4 27 30\n0 14 31 57 -1\n14 45 88 -1 -1\n59 33 -1 -1 -1\n92 -1 -1 -1 -1",
    input_format: "Se citesc n, apoi n coduri (primul rand).",
    output_format: "Se afiseaza tabloul complet cu n linii, fiecare pe cate o linie a ecranului.",
    constraints: "2 <= n <= 20, coduri distincte in [0,100)",
    hints: "Pe randul i (i>=2), coloanele j<=n-i+1 se calculeaza ca (cod[i-1][j]+cod[i-1][j+1]) modulo 100; restul coloanelor (j>n-i+1) sunt gazon (-1).",
    explanation: "Pentru fiecare rand i de la 2 la n, se calculeaza fiecare coloana j <= n-i+1 (pe sau la stanga diagonalei secundare pentru acel rand) ca suma codurilor de pe randul anterior, de pe aceeasi coloana si coloana urmatoare, luata modulo 100 (ultimele doua cifre; o valoare sub 10 se stocheaza si afiseaza ca atare, fara zero nesemnificativ, deoarece este pastrata ca numar intreg, nu ca text). Coloanele j > n-i+1 primesc codul -1 (gazon).\n\n**Complexitate:** O(n^2)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<vector<long long>> a(n + 1, vector<long long>(n + 1, -1));
    for (int j = 1; j <= n; j++) cin >> a[1][j];
    for (int i = 2; i <= n; i++) {
        int limit = n - i + 1;
        for (int j = 1; j <= limit; j++) a[i][j] = (a[i - 1][j] + a[i - 1][j + 1]) % 100;
    }
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) cout << a[i][j] << (j < n ? " " : "\\n");
    }
    return 0;
}
`,
    py: `n = int(input())
codes = list(map(int, input().split()))
a = [[-1] * (n + 1) for _ in range(n + 1)]
for j in range(1, n + 1):
    a[1][j] = codes[j - 1]
for i in range(2, n + 1):
    limit = n - i + 1
    for j in range(1, limit + 1):
        a[i][j] = (a[i - 1][j] + a[i - 1][j + 1]) % 100
for i in range(1, n + 1):
    print(" ".join(str(a[i][j]) for j in range(1, n + 1)))
`,
    tests: [
      "5\n90 10 4 27 30",
      "2\n5 7",
      "3\n1 2 3",
      "4\n99 1 50 25",
      "2\n0 0",
    ],
  },
  {
    slug: "bac-speciala-2023-3-3",
    subcategoryId: "speciala-2023",
    title: "Bacalaureat Sesiune Speciala 2023, S3.3 - Cel mai mic si cel mai mare p pentru p-interval",
    difficulty: "hard",
    tags: ["bacalaureat", "2023", "speciala", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Intervalul [x,y] se numeste p-interval pentru un sir de valori intregi, daca oricare dintre primii p termeni ai sirului apartine intervalului, iar numarul de valori intregi distincte din interval este minim (adica [x,y]=[minimul primilor p termeni, maximul primilor p termeni]).\n\n" +
      "Fisierul bac.in contine un sir de cel mult 10^6 numere intregi din intervalul [-10^9,10^9], separate prin cate un spatiu. Se cere sa se afiseze pe ecran cea mai mica si cea mai mare valoare a lui p (p>=2) cu proprietatea ca (p-1)-intervalul este identic cu p-intervalul pentru sirul aflat in fisier. Valorile afisate pot fi egale, iar daca nu exista nicio astfel de valoare, pe ecran se afiseaza mesajul nu exista.\n\n" +
      "Exemplu: daca fisierul contine numerele 2 7 1 8 3 10 6 -3 -2 13, se afiseaza pe ecran 5 9. Daca fisierul contine numerele 2 7 1 0 8 10 -3 13, se afiseaza pe ecran nu exista.",
    input_format: "Fisierul bac.in: un sir de numere intregi din [-10^9,10^9], separate prin spatiu.",
    output_format: "Se afiseaza cel mai mic si cel mai mare p (p>=2) cu proprietatea ceruta, separate printr-un spatiu, sau mesajul 'nu exista'.",
    constraints: "cel mult 10^6 termeni",
    hints: "Parcurgeti sirul, mentinand minimul si maximul termenilor vazuti pana la fiecare pas; termenul de pe pozitia p (p>=2) 'nu schimba' intervalul daca se afla deja in [min,max] al primilor p-1 termeni.",
    explanation:
      "Se parcurge sirul o singura data, mentinand minimul si maximul primilor i termeni vazuti pana la fiecare pas i. Pentru pasul p (p>=2), (p-1)-intervalul este [min,max] al primilor p-1 termeni; daca termenul p se afla deja in acest interval (nu il extinde), atunci p-intervalul coincide cu (p-1)-intervalul, deci p este o valoare valida. Se actualizeaza minimul si maximul cu noul termen (indiferent daca a extins sau nu intervalul) si se continua. La final, se raporteaza cel mai mic si cel mai mare p valid gasit, sau mesajul cerut daca nu exista niciunul.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara",
    io: { input_source: "file", input_filename: "bac.in", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.in", "r", stdin);
    long long v;
    bool has = false;
    long long mn = 0, mx = 0;
    long long pos = 0;
    long long minP = -1, maxP = -1;
    while (cin >> v) {
        pos++;
        if (!has) { mn = mx = v; has = true; }
        else {
            if (pos >= 2 && v >= mn && v <= mx) {
                if (minP == -1) minP = pos;
                maxP = pos;
            }
            mn = min(mn, v); mx = max(mx, v);
        }
    }
    if (minP == -1) cout << "nu exista\\n";
    else cout << minP << " " << maxP << "\\n";
    return 0;
}
`,
    py: `mn, mx = 0, 0
has = False
pos = 0
min_p, max_p = -1, -1
with open("bac.in") as f:
    data = f.read().split()
for tok in data:
    v = int(tok)
    pos += 1
    if not has:
        mn = mx = v
        has = True
    else:
        if pos >= 2 and mn <= v <= mx:
            if min_p == -1:
                min_p = pos
            max_p = pos
        mn = min(mn, v)
        mx = max(mx, v)
print("nu exista" if min_p == -1 else f"{min_p} {max_p}")
`,
    tests: [
      "2 7 1 8 3 10 6 -3 -2 13",
      "2 7 1 0 8 10 -3 13",
      "5 5",
      "1 2",
      (() => {
        const parts = [];
        for (let i = 0; i < 20000; i++) parts.push(String((i % 500) - 250));
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== SESIUNEA TOAMNA 2023 =====================
  {
    slug: "bac-toamna-2023-3-1",
    subcategoryId: "toamna-2023",
    title: "Bacalaureat Toamna 2023, S3.1 - Divizori impari neprimi",
    difficulty: "medium",
    tags: ["bacalaureat", "2023", "toamna", "subiectul3", "divizori"],
    statement:
      "Subprogramul DNPI are un singur parametru, n, prin care primeste un numar natural (n in [1,10^9]), si afiseaza pe ecran, separati prin cate un spatiu, toti divizorii pozitivi impari ai lui n care NU sunt primi.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=90, se afiseaza pe ecran, nu neaparat in aceasta ordine, numerele 1 9 15 45",
    input_format: "Se citeste de la tastatura numarul natural n.",
    output_format: "Subprogramul insusi afiseaza pe ecran divizorii impari neprimi ai lui n, separati prin spatiu.",
    constraints: "1 <= n <= 10^9",
    hints: "Determinati toti divizorii lui n (in O(sqrt(n))), pastrati-i doar pe cei impari, apoi eliminati dintre acestia numerele prime (1 nu e prim, deci se pastreaza).",
    explanation: "Se determina toti divizorii lui n prin cautare pana la radacina sa patrata (pentru fiecare d care divide n, atat d cat si n/d sunt divizori). Dintre acestia se pastreaza doar cei impari, apoi se elimina cei care sunt numere prime (verificat prin incercare de divizori pana la radacina patrata a fiecaruia); 1 nu este considerat prim, deci ramane in rezultat daca este divizor.\n\n**Complexitate:** O(sqrt(n) * sqrt(n)) in cel mai defavorabil caz",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long n; cin >> n;
    DNPI(n);
    cout << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
DNPI(n)
print()
`,
    cpp: `bool ePrimDNPI(long long v) {
    if (v < 2) return false;
    for (long long d = 2; d * d <= v; d++) if (v % d == 0) return false;
    return true;
}
void DNPI(long long n) {
    vector<long long> divs;
    for (long long d = 1; d * d <= n; d++) {
        if (n % d == 0) {
            divs.push_back(d);
            if (d != n / d) divs.push_back(n / d);
        }
    }
    sort(divs.begin(), divs.end());
    bool first = true;
    for (long long d : divs) {
        if (d % 2 == 1 && !ePrimDNPI(d)) {
            if (!first) cout << " ";
            cout << d;
            first = false;
        }
    }
}
`,
    py: `def e_prim_dnpi(v):
    if v < 2:
        return False
    d = 2
    while d * d <= v:
        if v % d == 0:
            return False
        d += 1
    return True

def DNPI(n):
    divs = []
    d = 1
    while d * d <= n:
        if n % d == 0:
            divs.append(d)
            if d != n // d:
                divs.append(n // d)
        d += 1
    divs.sort()
    rez = [str(x) for x in divs if x % 2 == 1 and not e_prim_dnpi(x)]
    print(" ".join(rez), end="")
`,
    tests: ["90", "1", "2", "45", "1000000000"],
  },
  {
    slug: "bac-toamna-2023-3-2",
    subcategoryId: "toamna-2023",
    title: "Bacalaureat Toamna 2023, S3.2 - Patratul de valoare maxima",
    difficulty: "medium",
    tags: ["bacalaureat", "2023", "toamna", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Un joc foloseste o tabla dreptunghiulara, cu celule dispuse pe m linii si n coloane, fiecare celula continand un numar natural. Numim patrat de valoare p patru celule ale tablei, situate pe doua linii consecutive si pe doua coloane consecutive, cu proprietatea ca suma valorilor inscrise in aceste celule este egala cu p.\n\n" +
      "Scrieti un program C/C++ care citeste de la tastatura doua numere naturale din intervalul [2,20], m si n, apoi elementele unui tablou bidimensional cu m linii si n coloane, numere naturale din intervalul [0,10^4]. Programul determina un patrat de valoare maxima al tablei si afiseaza pe ecran aceasta valoare.\n\n" +
      "Exemplu: pentru m=5, n=4 si tabloul\n1 1 2 30\n3 10 1 2\n1 13 12 1\n1 2 3 1\n7 1 20 1\n" +
      "se afiseaza pe ecran valoarea 36.",
    input_format: "Se citesc m, n, apoi elementele tabloului cu m linii si n coloane.",
    output_format: "Se afiseaza suma maxima a unui patrat de 2x2 celule adiacente.",
    constraints: "2 <= m, n <= 20, 0 <= valoare <= 10^4",
    hints: "Parcurgeti toate pozitiile posibile ale coltului stanga-sus al unui patrat 2x2 si calculati suma celor 4 celule, retinand maximul.",
    explanation: "Se parcurg toate perechile de linii consecutive (i,i+1) si coloane consecutive (j,j+1), calculand suma celor 4 celule a[i][j]+a[i][j+1]+a[i+1][j]+a[i+1][j+1]; se retine maximul acestor sume peste toate pozitiile posibile.\n\n**Complexitate:** O(m*n)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int m, n; cin >> m >> n;
    vector<vector<long long>> a(m, vector<long long>(n));
    for (auto& row : a) for (auto& v : row) cin >> v;
    long long best = 0;
    for (int i = 0; i + 1 < m; i++) {
        for (int j = 0; j + 1 < n; j++) {
            long long s = a[i][j] + a[i][j + 1] + a[i + 1][j] + a[i + 1][j + 1];
            best = max(best, s);
        }
    }
    cout << best << "\\n";
    return 0;
}
`,
    py: `m, n = map(int, input().split())
a = [list(map(int, input().split())) for _ in range(m)]
best = 0
for i in range(m - 1):
    for j in range(n - 1):
        s = a[i][j] + a[i][j + 1] + a[i + 1][j] + a[i + 1][j + 1]
        best = max(best, s)
print(best)
`,
    tests: [
      "5 4\n1 1 2 30\n3 10 1 2\n1 13 12 1\n1 2 3 1\n7 1 20 1",
      "2 2\n1 2\n3 4",
      "2 2\n0 0\n0 0",
      "3 3\n1 1 1\n1 100 1\n1 1 1",
      "2 3\n5 5 5\n5 5 5",
    ],
  },
  {
    slug: "bac-toamna-2023-3-3",
    subcategoryId: "toamna-2023",
    title: "Bacalaureat Toamna 2023, S3.3 - Numarul maxim de perechi egale",
    difficulty: "hard",
    tags: ["bacalaureat", "2023", "toamna", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul date.in contine pe prima linie doua numere naturale din intervalul [1,10^6], m si n, iar pe urmatoarele doua linii numere naturale din intervalul [0,10^2): pe a doua linie un sir A, de m numere, iar pe a treia linie un sir B, de n numere.\n\n" +
      "Se cere sa se afiseze pe ecran numarul maxim de perechi de forma (pa,pb) (pa in [1,m], pb in [1,n]), cu proprietatea ca termenul de pe pozitia pa din sirul A are aceeasi valoare cu termenul de pe pozitia pb din sirul B si ca fiecare pozitie, corespunzatoare sirului A, respectiv sirului B, apare in cel mult o pereche. Proiectati un algoritm eficient din punctul de vedere al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine\n8 9\n1 0 4 1 5 3 5 5\n1 1 1 7 5 3 5 3 0\n" +
      "se afiseaza pe ecran 6.",
    input_format: "Fisierul date.in: m si n pe prima linie, sirul A pe a doua, sirul B pe a treia.",
    output_format: "Se afiseaza numarul maxim de perechi (pa,pb) cu valori egale, fiecare pozitie folosita cel mult o data.",
    constraints: "1 <= m, n <= 10^6, valori in [0,100)",
    hints: "Numarati de cate ori apare fiecare valoare v (0..99) in A si in B; numarul maxim de perechi folosind valoarea v este minimul dintre cele doua numaratori. Insumati aceste minime peste toate valorile.",
    explanation:
      "Deoarece valorile posibile sunt doar 0..99, se calculeaza, printr-o singura trecere prin fiecare sir, numarul de aparitii ale fiecarei valori in A (cntA[v]) si in B (cntB[v]). Pentru o valoare data v, numarul maxim de perechi distincte care o folosesc este min(cntA[v], cntB[v]) (fiecare pereche foloseste o pozitie din A si una din B cu aceasta valoare, iar pozitiile nu se pot refolosi). Numarul total maxim de perechi este suma acestor minime peste toate cele 100 de valori posibile.\n\n**Complexitate:** O(m + n)",
    io: { input_source: "file", input_filename: "date.in", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("date.in", "r", stdin);
    long long m, n; cin >> m >> n;
    vector<long long> cntA(100, 0), cntB(100, 0);
    for (long long i = 0; i < m; i++) { int v; cin >> v; cntA[v]++; }
    for (long long i = 0; i < n; i++) { int v; cin >> v; cntB[v]++; }
    long long total = 0;
    for (int v = 0; v < 100; v++) total += min(cntA[v], cntB[v]);
    cout << total << "\\n";
    return 0;
}
`,
    py: `with open("date.in") as f:
    m, n = map(int, f.readline().split())
    A = list(map(int, f.readline().split()))
    B = list(map(int, f.readline().split()))
cntA = [0] * 100
cntB = [0] * 100
for v in A:
    cntA[v] += 1
for v in B:
    cntB[v] += 1
total = sum(min(cntA[v], cntB[v]) for v in range(100))
print(total)
`,
    tests: [
      "8 9\n1 0 4 1 5 3 5 5\n1 1 1 7 5 3 5 3 0",
      "1 1\n5\n5",
      "1 1\n5\n6",
      "3 3\n1 1 1\n1 1 1",
      (() => {
        const m = 20000, n = 20000;
        const A = [];
        const B = [];
        for (let i = 0; i < m; i++) A.push(String(i % 100));
        for (let i = 0; i < n; i++) B.push(String((i + 50) % 100));
        return `${m} ${n}\n${A.join(" ")}\n${B.join(" ")}`;
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
