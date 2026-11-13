const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "concursuri", chapter: "concurs-mi-ub-2021", sub: "probleme-2021" };

function normalize(text) {
  return (text ?? "").trim().split(/\r?\n/).map((line) => line.trim()).join("\n");
}

async function runCustom(language, code, stdin) {
  const res = await fetch(`${API}/api/submissions/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problem_id: "00000000-0000-0000-0000-000000000000",
      language,
      code,
      stdin,
      mode: "custom",
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`run failed: ${JSON.stringify(json)}`);
  return json.data;
}

const problems = [
  {
    slug: "concurs-mi-ub-2021-cel-mai-mare-numar-divizibil",
    title: "Concurs MI UB 2021 - Cel mai mare numar cu cifre mici",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2021", "teoria-numerelor"],
    statement:
      "Se citesc doua numere naturale n si d.\n\n" +
      "Determinati ultima cifra a celui mai mare numar natural de n cifre care indeplineste simultan urmatoarele conditii:\n" +
      "- toate cifrele sale sunt strict mai mici decat d;\n" +
      "- numarul este divizibil cu d.\n\n" +
      "Se garanteaza ca exista intotdeauna cel putin un astfel de numar (de exemplu, numarul format doar din cifre 0 este mereu divizibil cu d).",
    input_format: "Se citesc pe o singura linie, separate prin spatiu, numerele naturale n si d.",
    output_format: "Se afiseaza un singur numar intreg, reprezentand ultima cifra a numarului cautat.",
    constraints: "1 <= n <= 18\n2 <= d <= 9",
    hints:
      "Cifrele permise sunt 0,1,...,d-1. Pentru a maximiza numarul, primele n-1 cifre trebuie sa fie toate egale cu d-1 (cea mai mare cifra permisa), " +
      "iar doar ultima cifra se alege astfel incat intregul numar sa fie divizibil cu d. Cum resturile modulo d ale unei cifre acopera exact multimea {0,1,...,d-1}, " +
      "exista intotdeauna o alegere valida si unica pentru ultima cifra, fara a fi nevoie sa micsoram vreo cifra anterioara.",
    explanation:
      "Ca in explicatia oficiala pentru cazul n=7, d=7: alegem cifrele de la stanga la dreapta cat mai mari posibil, deci primele n-1 cifre sunt toate d-1. " +
      "Calculam restul modulo d al prefixului (cele n-1 cifre de d-1), simuland inmultirea cu 10 si adaugarea cifrei la fiecare pas, pastrand doar restul modulo d " +
      "(evitam sa lucram cu numere foarte mari). Apoi determinam ultima cifra ca fiind restul necesar pentru ca (prefix*10 + ultima_cifra) sa fie divizibil cu d; " +
      "aceasta valoare cade automat in intervalul [0, d-1], deci este intotdeauna o cifra valida.",
    time_limit_ms: 1000,
    memory_limit_mb: 64,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    long long n, d;
    cin >> n >> d;
    long long prefixMod = 0;
    for (long long i = 0; i < n - 1; i++) {
        prefixMod = (prefixMod * 10 + (d - 1)) % d;
    }
    long long need = (prefixMod * 10) % d;
    long long last = (d - need) % d;
    cout << last << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    n, d = map(int, sys.stdin.read().split())
    prefix_mod = 0
    for _ in range(n - 1):
        prefix_mod = (prefix_mod * 10 + (d - 1)) % d
    need = (prefix_mod * 10) % d
    last = (d - need) % d
    print(last)

main()
`,
    tests: ["7 7\n", "1 5\n", "18 9\n", "3 2\n", "10 3\n"],
  },
  {
    slug: "concurs-mi-ub-2021-schimb-carti-vizita",
    title: "Concurs MI UB 2021 - Schimb de carti de vizita",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2021", "combinatorica"],
    statement:
      "Intr-o sala de conferinta sunt mai multe persoane, fiecare avand o rezerva suficient de mare de carti de vizita. " +
      "Oricare doua persoane pot face schimb de carti de vizita cel mult o data. Se citeste numarul S de schimburi care s-au efectuat " +
      "(nu neaparat toate schimburile posibile). Determinati numarul minim de persoane care se pot afla in sala, astfel incat sa fie posibil " +
      "sa se fi efectuat cel putin S schimburi.",
    input_format: "Se citeste pe o singura linie numarul natural S.",
    output_format: "Se afiseaza un singur numar natural, numarul minim de persoane.",
    constraints: "1 <= S <= 50000000000000 (5 * 10^13)",
    hints:
      "Cu n persoane, numarul maxim de schimburi posibile este C(n,2) = n*(n-1)/2. Trebuie gasit cel mai mic n pentru care n*(n-1)/2 >= S. " +
      "Functia C(n,2) este strict crescatoare in n, deci se poate folosi cautare binara pe valoarea lui n.",
    explanation:
      "Ca in explicatia oficiala: numarul maxim de schimburi cu n persoane este C(n,2)=n(n-1)/2. Cautam cel mai mic n astfel incat n(n-1)/2 >= S. " +
      "Deoarece aceasta expresie este strict crescatoare in n, aplicam cautare binara pe n intr-un interval suficient de larg (de exemplu [1, 4*10^7] pentru " +
      "limitele date), verificand la fiecare pas daca n(n-1)/2 >= S, si retinem cel mai mic n care satisface conditia.",
    time_limit_ms: 1000,
    memory_limit_mb: 64,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    long long s;
    cin >> s;
    long long lo = 1, hi = 400000000LL; // sqrt(2 * 5e13) is about 1e7, margine larga
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        long long val = mid * (mid - 1) / 2;
        if (val >= s) hi = mid; else lo = mid + 1;
    }
    cout << lo << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    s = int(sys.stdin.read().split()[0])
    lo, hi = 1, 400000000
    while lo < hi:
        mid = lo + (hi - lo) // 2
        val = mid * (mid - 1) // 2
        if val >= s:
            hi = mid
        else:
            lo = mid + 1
    print(lo)

main()
`,
    tests: ["23052021\n", "1\n", "2\n", "10\n", "49999999999999\n"],
  },
  {
    slug: "concurs-mi-ub-2021-arbori-partiali",
    title: "Concurs MI UB 2021 - Numarul arborilor partiali",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2021", "grafuri", "combinatorica"],
    statement:
      "Pentru un graf neorientat G, un arbore partial este un subgraf conex, fara cicluri, care contine acelasi numar de noduri ca G " +
      "si doar muchii din G (nu neaparat toate).\n\n" +
      "Se citeste un graf neorientat G cu n noduri (numerotate de la 0 la n-1) si m muchii. Determinati numarul de arbori partiali ai lui G.",
    input_format:
      "Pe prima linie se citesc doua numere naturale n si m. Pe fiecare dintre urmatoarele m linii se citesc doua numere u v (0 <= u, v <= n-1), " +
      "reprezentand o muchie intre nodurile u si v. Graful nu contine muchii multiple sau autobucle.",
    output_format: "Se afiseaza un singur numar natural, numarul de arbori partiali ai grafului.",
    constraints: "2 <= n <= 8\nn-1 <= m <= 15\nGraful dat este conex.",
    hints:
      "Un arbore partial al unui graf cu n noduri are exact n-1 muchii, conexe si fara cicluri. Se pot alege submultimi de exact n-1 muchii dintre cele m " +
      "disponibile si se poate verifica, folosind structura de multimi disjuncte (union-find), daca acea submultime formeaza un arbore (toate unirile reusesc " +
      "fara a crea ciclu si se obtine o singura componenta).",
    explanation:
      "Ca in explicatia oficiala pentru graful cu 5 noduri: orice arbore partial are exact n-1 muchii, deci se aleg submultimi de n-1 muchii dintre cele m. " +
      "Pentru a numara cate din aceste submultimi formeaza intr-adevar un arbore partial, se parcurg toate submultimile de marime n-1 (folosind masti de biti, " +
      "deoarece m este mic), iar pentru fiecare submultime se aplica algoritmul union-find: se adauga muchiile una cate una, iar daca vreo muchie uneste doua " +
      "noduri deja in aceeasi componenta, submultimea contine un ciclu si este invalida. Daca toate cele n-1 muchii se unesc cu succes, submultimea formeaza " +
      "un arbore partial valid si este numarata.",
    time_limit_ms: 1500,
    memory_limit_mb: 64,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int parent[10];

int findp(int x){
    while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
}

int main(){
    int n, m;
    cin >> n >> m;
    vector<int> eu(m), ev(m);
    for (int i = 0; i < m; i++) cin >> eu[i] >> ev[i];

    long long count = 0;
    int need = n - 1;
    for (int mask = 0; mask < (1 << m); mask++) {
        if (__builtin_popcount(mask) != need) continue;
        for (int i = 0; i < n; i++) parent[i] = i;
        bool ok = true;
        int used = 0;
        for (int i = 0; i < m; i++) {
            if (mask & (1 << i)) {
                int ru = findp(eu[i]), rv = findp(ev[i]);
                if (ru == rv) { ok = false; break; }
                parent[ru] = rv;
                used++;
            }
        }
        if (!ok) continue;
        int roots = 0;
        for (int i = 0; i < n; i++) if (findp(i) == i) roots++;
        if (roots == 1) count++;
    }
    cout << count << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx]); idx += 1
    m = int(data[idx]); idx += 1
    eu = [0]*m
    ev = [0]*m
    for i in range(m):
        eu[i] = int(data[idx]); idx += 1
        ev[i] = int(data[idx]); idx += 1

    need = n - 1
    count = 0

    for mask in range(1 << m):
        if bin(mask).count("1") != need:
            continue
        parent = list(range(n))

        def findp(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        ok = True
        for i in range(m):
            if mask & (1 << i):
                ru, rv = findp(eu[i]), findp(ev[i])
                if ru == rv:
                    ok = False
                    break
                parent[ru] = rv
        if not ok:
            continue
        roots = sum(1 for i in range(n) if findp(i) == i)
        if roots == 1:
            count += 1

    print(count)

main()
`,
    tests: [
      "5 6\n1 3\n3 2\n1 4\n4 2\n2 0\n4 0\n",
      "3 3\n0 1\n1 2\n0 2\n",
      "4 6\n0 1\n0 2\n0 3\n1 2\n1 3\n2 3\n",
      "4 3\n0 1\n1 2\n2 3\n",
      "8 12\n0 1\n1 2\n2 3\n3 4\n4 5\n5 6\n6 7\n7 0\n0 4\n1 5\n2 6\n3 7\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2021-pseudo-palindrom",
    title: "Concurs MI UB 2021 - Cel mai mare pseudo-palindrom",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2021", "teoria-numerelor", "simulare"],
    statement:
      "Un numar natural se numeste palindrom daca se citeste la fel de la stanga la dreapta si de la dreapta la stanga.\n\n" +
      "Un numar natural se numeste pseudo-palindrom daca cifrele sale pot fi reordonate astfel incat sa devina palindrom " +
      "(in particular orice palindrom este si pseudo-palindrom).\n\n" +
      "Se citesc doua numere naturale X si M. Fie Y cel mai mare numar pseudo-palindrom mai mic sau egal cu X. " +
      "Determinati restul lui Y la impartirea cu M.",
    input_format: "Se citesc pe o singura linie, separate prin spatiu, numerele naturale X si M.",
    output_format: "Se afiseaza un singur numar intreg, restul lui Y la impartirea cu M.",
    constraints: "1 <= X <= 10000000\n2 <= M <= 1000000007",
    hints:
      "Un numar poate fi rearanjat intr-un palindrom daca si numai daca cel mult o cifra din componenta sa apare de un numar impar de ori. " +
      "Se poate parcurge descrescator, incepand de la X, si testa aceasta conditie pentru fiecare candidat, pana se gaseste primul care o satisface.",
    explanation:
      "Ca in explicatia oficiala pentru X=1000465: se verifica pentru fiecare numar, incepand de la X in jos, daca frecventele cifrelor sale au cel mult " +
      "o valoare impara (conditia necesara si suficienta pentru a putea fi rearanjat intr-un palindrom). Cum aceasta proprietate este suficient de deasa " +
      "printre numerele naturale, cautarea descrescatoare gaseste rapid primul candidat valid Y. Apoi se calculeaza si se afiseaza Y modulo M.",
    time_limit_ms: 2000,
    memory_limit_mb: 64,
    cpp: `#include <bits/stdc++.h>
using namespace std;

bool isPseudoPalindrome(long long x){
    int cnt[10] = {0};
    while (x > 0) {
        cnt[x % 10]++;
        x /= 10;
    }
    int odd = 0;
    for (int i = 0; i < 10; i++) if (cnt[i] % 2 == 1) odd++;
    return odd <= 1;
}

int main(){
    long long X, M;
    cin >> X >> M;
    long long y = X;
    while (!isPseudoPalindrome(y)) y--;
    cout << (y % M) << "\\n";
    return 0;
}
`,
    py: `import sys

def is_pseudo_palindrome(x):
    cnt = [0] * 10
    if x == 0:
        cnt[0] = 1
    while x > 0:
        cnt[x % 10] += 1
        x //= 10
    odd = sum(1 for c in cnt if c % 2 == 1)
    return odd <= 1

def main():
    X, M = map(int, sys.stdin.read().split())
    y = X
    while not is_pseudo_palindrome(y):
        y -= 1
    print(y % M)

main()
`,
    tests: ["1000465 37\n", "1 5\n", "1000000 1000000007\n", "999999 13\n", "123456 7\n"],
  },
  {
    slug: "concurs-mi-ub-2021-creioane-scurtate",
    title: "Concurs MI UB 2021 - Creioane scurtate la doua lungimi",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2021", "optimizare", "simulare"],
    statement:
      "Ionel are n creioane, de lungimi date. El isi doreste ca, la final, creioanele sale sa aiba doar doua lungimi diferite. " +
      "Pentru a realiza acest lucru, poate scurta (prin ascutire) oricare dintre creioane, dar nu le poate lungi (lungimea finala a unui creion nu poate " +
      "depasi lungimea sa initiala).\n\n" +
      "Determinati suma maxima a lungimilor creioanelor pe care Ionel o poate obtine dupa ce efectueaza operatiile, astfel incat la final sa existe " +
      "exact doua lungimi diferite printre cele n creioane.",
    input_format:
      "Pe prima linie se citeste numarul natural n. Pe a doua linie se citesc n numere naturale, reprezentand lungimile initiale ale creioanelor.",
    output_format: "Se afiseaza un singur numar natural, suma maxima obtinuta.",
    constraints:
      "2 <= n <= 2000\n1 <= lungime creion <= 1000000\nSirul lungimilor contine cel putin doua valori distincte.",
    hints:
      "Cel putin unul dintre creioane are lungimea minima din sir; aceasta valoare minima este o alegere optima pentru una dintre cele doua lungimi finale, " +
      "deoarece orice creion poate fi scurtat pana la ea. Pentru cealalta lungime finala, se incearca fiecare valoare distincta mai mare decat minimul, " +
      "considerand ca ea revine creioanelor suficient de lungi, iar restul revin minimului.",
    explanation:
      "Ca in explicatia oficiala pentru cele 10 creioane: sortam lungimile si notam lo minimul sirului (una dintre cele doua lungimi finale este optim sa fie " +
      "chiar lo). Pentru fiecare valoare distincta x din sir, cu x > lo, consideram x ca fiind a doua lungime finala: toate creioanele cu lungimea initiala " +
      ">= x devin x, iar restul devin lo. Suma obtinuta este cnt(x)*x + (n-cnt(x))*lo, unde cnt(x) este numarul de creioane cu lungimea initiala >= x. " +
      "Se calculeaza aceasta suma pentru fiecare x candidat si se retine maximul.",
    time_limit_ms: 1500,
    memory_limit_mb: 64,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    int n;
    cin >> n;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    sort(a.begin(), a.end());
    long long lo = a[0];

    long long best = 0;
    int i = 0;
    while (i < n) {
        long long x = a[i];
        if (x > lo) {
            long long cnt = n - i; // elemente >= x (sirul e sortat, incepe de la pozitia i)
            long long sum = cnt * x + (n - cnt) * lo;
            best = max(best, sum);
        }
        int j = i;
        while (j < n && a[j] == x) j++;
        i = j;
    }
    cout << best << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    a = sorted(int(v) for v in data[1:1+n])
    lo = a[0]

    best = 0
    i = 0
    while i < n:
        x = a[i]
        if x > lo:
            cnt = n - i
            total = cnt * x + (n - cnt) * lo
            best = max(best, total)
        j = i
        while j < n and a[j] == x:
            j += 1
        i = j

    print(best)

main()
`,
    tests: [
      "10\n4 3 7 8 7 4 5 8 13 15\n",
      "2\n1 2\n",
      "4\n5 5 5 9\n",
      "6\n2 2 2 6 6 10\n",
      "15\n1 2 2 3 5 5 8 8 8 13 21 21 34 34 55\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2021-multime-s-libera",
    title: "Concurs MI UB 2021 - Submultime S-libera",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2021", "combinatorica", "backtracking"],
    statement:
      "O multime de numere naturale se numeste S-libera daca nu putem obtine numarul S ca suma a unor elemente distincte din multime " +
      "(fiecare element al multimii poate fi folosit cel mult o data intr-o astfel de suma).\n\n" +
      "Se citesc doua numere naturale N si S. Determinati cardinalul maxim al unei submultimi S-libere a multimii {1, 2, 3, ..., N}.",
    input_format: "Se citesc pe o singura linie, separate prin spatiu, numerele naturale N si S.",
    output_format: "Se afiseaza un singur numar natural, cardinalul maxim cerut.",
    constraints: "1 <= N <= 15\n1 <= S <= 150",
    hints:
      "Se poate rezolva prin backtracking: se parcurg elementele 1,2,...,N in ordine, iar pentru fiecare se decide daca este inclus sau nu in submultime. " +
      "Se pastreaza multimea sumelor obtinute cu elementele deja alese (de exemplu ca un vector de biti); un element poate fi inclus doar daca adaugarea lui " +
      "nu face suma S atinsa. Se exploreaza ambele variante (inclus/exclus) pentru a gasi cardinalul maxim.",
    explanation:
      "Spre deosebire de rationamentul specific facut in explicatia oficiala pentru cazul N=10, S=13 (bazat pe perechi de elemente cu suma 13), " +
      "aici se foloseste un backtracking general si sigur: se retine, pentru submultimea deja construita, vectorul de sume realizabile (o suma este " +
      "realizabila daca exista o submultime a elementelor deja alese care o produce). La fiecare element nou i se incearca includerea (daca suma S nu " +
      "devine realizabila) urmata de recursivitate, apoi se incearca si excluderea; se retine cardinalul maxim obtinut pe tot arborele de decizii. " +
      "Deoarece N este mic, aceasta cautare exhaustiva se termina rapid.",
    time_limit_ms: 2000,
    memory_limit_mb: 64,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int N;
long long S;
int best = 0;

void solve(int idx, int count, bitset<200> reach){
    if (count > best) best = count;
    if (idx > N) return;

    // varianta: includem elementul idx, daca este sigur (nu se atinge suma S)
    bitset<200> shifted = reach << idx;
    shifted[idx] = 1;
    bitset<200> newReach = reach | shifted;
    if (!newReach[S]) solve(idx + 1, count + 1, newReach);

    // varianta: excludem elementul idx
    solve(idx + 1, count, reach);
}

int main(){
    cin >> N >> S;
    bitset<200> reach;
    solve(1, 0, reach);
    cout << best << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

def main():
    N, S = map(int, sys.stdin.read().split())
    best = [0]

    def solve(idx, count, reach):
        if count > best[0]:
            best[0] = count
        if idx > N:
            return

        # varianta: includem elementul idx daca e sigur
        new_reach = reach | (reach << idx) | (1 << idx)
        if not (new_reach >> S) & 1:
            solve(idx + 1, count + 1, new_reach)

        # varianta: excludem elementul idx
        solve(idx + 1, count, reach)

    solve(1, 0, 0)
    print(best[0])

main()
`,
    tests: ["10 13\n", "5 5\n", "15 30\n", "1 1\n", "8 100\n"],
  },
  {
    slug: "concurs-mi-ub-2021-cel-mai-mare-numar-prim",
    title: "Concurs MI UB 2021 - Cel mai mare numar prim cu cifre distincte",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2021", "teoria-numerelor"],
    statement:
      "Se citesc doua numere naturale D si M. Fie n cel mai mare numar natural prim de D cifre, cu toate cifrele distincte. " +
      "Determinati restul impartirii lui n la M.",
    input_format: "Se citesc pe o singura linie, separate prin spatiu, numerele naturale D si M.",
    output_format: "Se afiseaza un singur numar intreg, restul lui n la impartirea cu M.",
    constraints: "2 <= D <= 6\n2 <= M <= 1000000007",
    hints:
      "Se cauta descrescator, incepand de la cel mai mare numar de D cifre (10^D - 1), primul numar care are toate cifrele distincte si este prim. " +
      "Pentru testarea primalitatii este suficient sa se incerce divizori pana la radacina patrata a numarului.",
    explanation:
      "Ca in explicatia oficiala pentru D=5 (unde s-au verificat descrescator candidatii de la 98765 pana s-a gasit 98731, prim): parcurgem descrescator " +
      "toate numerele de D cifre, incepand de la cel mai mare, si pentru fiecare verificam mai intai daca toate cifrele sunt distincte, apoi (doar daca " +
      "aceasta conditie este indeplinita) testam primalitatea prin incercarea divizorilor impari pana la radacina patrata a numarului. Primul numar care " +
      "trece ambele teste este raspunsul cautat n; afisam n modulo M.",
    time_limit_ms: 2000,
    memory_limit_mb: 64,
    cpp: `#include <bits/stdc++.h>
using namespace std;

bool distinctDigits(long long x){
    int seen[10] = {0};
    while (x > 0) {
        int d = x % 10;
        if (seen[d]) return false;
        seen[d] = 1;
        x /= 10;
    }
    return true;
}

bool isPrime(long long x){
    if (x < 2) return false;
    if (x % 2 == 0) return x == 2;
    for (long long i = 3; i * i <= x; i += 2) {
        if (x % i == 0) return false;
    }
    return true;
}

int main(){
    long long D, M;
    cin >> D >> M;
    long long hi = 1;
    for (int i = 0; i < D; i++) hi *= 10;
    hi -= 1;
    long long n = hi;
    while (!(distinctDigits(n) && isPrime(n))) n--;
    cout << (n % M) << "\\n";
    return 0;
}
`,
    py: `import sys

def distinct_digits(x):
    seen = [False] * 10
    while x > 0:
        d = x % 10
        if seen[d]:
            return False
        seen[d] = True
        x //= 10
    return True

def is_prime(x):
    if x < 2:
        return False
    if x % 2 == 0:
        return x == 2
    i = 3
    while i * i <= x:
        if x % i == 0:
            return False
        i += 2
    return True

def main():
    D, M = map(int, sys.stdin.read().split())
    n = 10 ** D - 1
    while not (distinct_digits(n) and is_prime(n)):
        n -= 1
    print(n % M)

main()
`,
    tests: ["5 37\n", "2 7\n", "6 1000000007\n", "3 100\n", "4 13\n"],
  },
  {
    slug: "concurs-mi-ub-2021-pasi-triunghiulari",
    title: "Concurs MI UB 2021 - Numarul minim de pasi",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2021", "cautare-binara", "recurenta"],
    statement:
      "Se poate ajunge de la un numar natural x la un numar natural y (y > x) trecand prin numerele dintre ele, folosind o secventa de pasi. " +
      "Lungimea fiecarui pas poate fi egala cu lungimea pasului anterior, mai mare cu 1 sau mai mica cu 1. Lungimile primului si ultimului pas trebuie " +
      "sa fie egale cu 1.\n\n" +
      "Se citesc doua numere naturale x si y (y > x). Determinati numarul minim de pasi prin care se poate ajunge de la x la y.",
    input_format: "Se citesc pe o singura linie, separate prin spatiu, numerele naturale x si y.",
    output_format: "Se afiseaza un singur numar natural, numarul minim de pasi.",
    constraints: "0 <= x < y <= 2000000000\ny - x <= 1000000000",
    hints:
      "Suma lungimilor pasilor trebuie sa fie exact y - x. Pentru un numar fix de pasi k, lungimea maxima totala parcursa este obtinuta crescand lungimea " +
      "pasului cat mai repede (1,2,3,...) pana la mijloc, apoi scazand-o simetric inapoi la 1. Aceasta suma maxima este o functie strict crescatoare de k, " +
      "deci se poate folosi cautare binara pentru a gasi cel mai mic k pentru care suma maxima este cel putin y - x.",
    explanation:
      "Ca in explicatia oficiala: pentru k pasi, secventa optima de lungimi este 1,2,...,m,(m sau m-1),...,2,1, iar suma maxima posibila este m^2 daca " +
      "k=2m-1 este impar, respectiv m*(m+1) daca k=2m este par (unde m=k/2 sau m=(k+1)/2, dupa caz). Aceasta functie este strict crescatoare in k. " +
      "Cautam prin cautare binara cel mai mic k pentru care suma maxima posibila cu k pasi este cel putin egala cu distanta D=y-x; acesta este numarul " +
      "minim de pasi cerut.",
    time_limit_ms: 1000,
    memory_limit_mb: 64,
    cpp: `#include <bits/stdc++.h>
using namespace std;

long long maxSum(long long k){
    if (k % 2 == 1) {
        long long m = (k + 1) / 2;
        return m * m;
    } else {
        long long m = k / 2;
        return m * (m + 1);
    }
}

int main(){
    long long x, y;
    cin >> x >> y;
    long long D = y - x;
    long long lo = 1, hi = 200000;
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (maxSum(mid) >= D) hi = mid; else lo = mid + 1;
    }
    cout << lo << "\\n";
    return 0;
}
`,
    py: `import sys

def max_sum(k):
    if k % 2 == 1:
        m = (k + 1) // 2
        return m * m
    else:
        m = k // 2
        return m * (m + 1)

def main():
    x, y = map(int, sys.stdin.read().split())
    D = y - x
    lo, hi = 1, 200000
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if max_sum(mid) >= D:
            hi = mid
        else:
            lo = mid + 1
    print(lo)

main()
`,
    tests: ["2021 3110\n", "0 1\n", "5 7\n", "0 1000000000\n", "100 1000100\n"],
  },
  {
    slug: "concurs-mi-ub-2021-postere-perete",
    title: "Concurs MI UB 2021 - Postere pe perete",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2021", "programare-dinamica"],
    statement:
      "Un primar are de acoperit un perete lung de W metri si inalt de 1 metru, pe care vrea sa il impanzeasca cu postere publicitare. " +
      "In acest scop, are la dispozitie n postere, toate de inaltime egala cu 1 metru, avand latimile date.\n\n" +
      "Posterele trebuie asezate de-a lungul peretelui, fara sa se suprapuna si fara sa depaseasca marginile peretelui (fiecare poster poate fi folosit " +
      "cel mult o data). Determinati aria maxima de perete (in m^2) care poate fi acoperita folosind o parte dintre posterele disponibile.",
    input_format:
      "Pe prima linie se citesc doua numere naturale W si n. Pe a doua linie se citesc n numere naturale, reprezentand latimile posterelor.",
    output_format: "Se afiseaza un singur numar natural, aria maxima acoperita.",
    constraints: "1 <= W <= 5000\n1 <= n <= 50\n1 <= latime poster <= W",
    hints:
      "Deoarece inaltimea este 1 pentru toate posterele si pentru perete, problema se reduce la a alege o submultime de latimi a caror suma este cat mai " +
      "mare, dar nu depaseste W. Aceasta este o problema clasica de tip subset-sum, rezolvabila prin programare dinamica: se retine, pentru fiecare suma " +
      "posibila de la 0 la W, daca ea poate fi obtinuta folosind o submultime a posterelor.",
    explanation:
      "Ca in explicatia oficiala pentru cele 8 postere si peretele de 100 m: se cauta submultimea de latimi cu suma maxima ce nu depaseste W. In loc sa " +
      "analizam manual cazuri (cu/fara posterele de 38), folosim o programare dinamica de tip 0/1 knapsack: un vector boolean reachable[0..W] retine, dupa " +
      "procesarea fiecarui poster, care sume sunt realizabile cu o submultime a posterelor procesate pana atunci (actualizat descrescator, de la W la latimea " +
      "posterului curent, pentru a nu folosi acelasi poster de mai multe ori). La final, raspunsul este cea mai mare suma realizabila reachable[s] = true, " +
      "cu s <= W.",
    time_limit_ms: 1500,
    memory_limit_mb: 64,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    int W, n;
    cin >> W >> n;
    vector<int> w(n);
    for (int i = 0; i < n; i++) cin >> w[i];

    vector<char> reachable(W + 1, 0);
    reachable[0] = 1;
    for (int i = 0; i < n; i++) {
        for (int s = W; s >= w[i]; s--) {
            if (reachable[s - w[i]]) reachable[s] = 1;
        }
    }
    int best = 0;
    for (int s = 0; s <= W; s++) if (reachable[s]) best = s;
    cout << best << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    idx = 0
    W = int(data[idx]); idx += 1
    n = int(data[idx]); idx += 1
    widths = [int(v) for v in data[idx:idx+n]]

    reachable = [False] * (W + 1)
    reachable[0] = True
    for width in widths:
        for s in range(W, width - 1, -1):
            if reachable[s - width]:
                reachable[s] = True

    best = 0
    for s in range(W + 1):
        if reachable[s]:
            best = s
    print(best)

main()
`,
    tests: [
      "100 8\n12 27 13 25 26 38 28 38\n",
      "10 3\n3 4 5\n",
      "1 1\n1\n",
      "50 5\n10 10 10 10 10\n",
      "5000 50\n97 45 88 12 63 34 76 21 55 42 19 83 60 71 8 39 92 17 64 50 27 81 46 15 68 33 90 6 58 24 77 41 13 65 30 86 22 53 9 70 37 61 4 95 28 49 16 73 44 100\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2021-triunghi-suma-interioara",
    title: "Concurs MI UB 2021 - Suma din interiorul triunghiului",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2021", "recurenta", "serii"],
    statement:
      "Consideram triunghiul infinit format din numere naturale, in care numarul 1 se afla la nivelul 1, numerele 2 si 3 se afla la nivelul 2, " +
      "numerele 4, 5 si 6 se afla la nivelul 3 si asa mai departe (fiecare nivel i contine i numere consecutive, in continuarea celor de pe nivelul anterior).\n\n" +
      "Pentru un nivel k, interiorul triunghiului oprit la nivelul k contine toate numerele aflate strict in interior, adica cele de pe nivelurile " +
      "3, 4, ..., k-1, fara a include primul si ultimul numar de pe fiecare astfel de nivel (numerele de pe laturile triunghiului).\n\n" +
      "De exemplu, pentru k=5 numerele din interior sunt 5, 8, 9 (suma 22), iar pentru k=7 numerele din interior sunt 5, 8, 9, 12, 13, 14, 17, 18, 19, 20 " +
      "(suma 135).\n\n" +
      "Se citeste un numar natural k. Calculati suma numerelor din interiorul triunghiului care se opreste la nivelul k.",
    input_format: "Se citeste pe o singura linie numarul natural k.",
    output_format: "Se afiseaza un singur numar intreg, suma cautata.",
    constraints: "5 <= k <= 20000",
    hints:
      "Pe nivelul i, primul numar este T(i-1)+1, unde T(m)=m*(m+1)/2. Interiorul unui nivel i (pentru 3 <= i <= k-1) contine numerele de pe pozitiile " +
      "2,3,...,i-1 de pe acel nivel. Suma acestor numere se poate calcula direct, in forma inchisa, pentru fiecare nivel i, apoi insumata pentru " +
      "i de la 3 la k-1.",
    explanation:
      "Ca in explicatia oficiala: suma numerelor interioare de pe nivelul i este egala cu (i-1)*T(i-1) - 1, unde T(i-1) = (i-1)*i/2 este numarul de " +
      "elemente aflate pe nivelurile anterioare lui i (deci si primul numar de pe nivelul i este T(i-1)+1). Insumam aceasta formula pentru fiecare nivel " +
      "i de la 3 la k-1, printr-o simpla parcurgere iterativa (fara a fi nevoie sa dezvoltam formula intr-o expresie polinomiala inchisa in k, ceea ce " +
      "reduce riscul de erori de calcul), obtinand suma totala ceruta.",
    time_limit_ms: 1000,
    memory_limit_mb: 64,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    long long k;
    cin >> k;
    long long S = 0;
    for (long long i = 3; i <= k - 1; i++) {
        long long T = (i - 1) * i / 2;
        long long term = (i - 1) * T - 1;
        S += term;
    }
    cout << S << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    k = int(sys.stdin.read().split()[0])
    S = 0
    for i in range(3, k):
        T = (i - 1) * i // 2
        term = (i - 1) * T - 1
        S += term
    print(S)

main()
`,
    tests: ["5\n", "7\n", "2021\n", "100\n", "20000\n"],
  },
  {
    slug: "concurs-mi-ub-2021-domino-matrice",
    title: "Concurs MI UB 2021 - Domino intr-o matrice divizibila",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2021", "simulare", "teoria-numerelor"],
    statement:
      "Fie A o matrice binara cu R linii si C coloane, numerotate de la 1. Celula din randul i si coloana j contine valoarea 1 daca si numai daca " +
      "numarul C*(i-1)+j se divide cu p sau cu q, altfel contine valoarea 0.\n\n" +
      "Vrem sa plasam un singur domino, piesa de marime 1x2 sau 2x1, in matrice. Domino-ul trebuie sa acopere doua celule vecine, pe orizontala sau " +
      "pe verticala, avand ambele valoarea 0. In cate feluri se poate face acest lucru?",
    input_format: "Se citesc pe o singura linie, separate prin spatiu, numerele naturale R, C, p si q.",
    output_format: "Se afiseaza un singur numar natural, numarul de plasari valide.",
    constraints: "1 <= R, C <= 300\n2 <= p, q <= 50",
    hints:
      "Se poate calcula direct, pentru fiecare celula (i,j), valoarea C*(i-1)+j si testa daca este divizibila cu p sau cu q. Apoi se numara perechile " +
      "de celule vecine (pe orizontala si pe verticala) care au ambele valoarea 0.",
    explanation:
      "Ca in explicatia oficiala pentru matricea 50x50 cu p=7, q=13: in loc sa deducem tipare modulare pe blocuri, simulam direct matricea: pentru " +
      "fiecare celula (i,j) calculam n=C*(i-1)+j si stabilim daca este 'libera' (0), adica nedivizibila nici cu p, nici cu q. Apoi parcurgem toate " +
      "perechile de celule vecine pe orizontala (aceeasi linie, coloane consecutive) si pe verticala (aceeasi coloana, linii consecutive), numarand " +
      "cate dintre aceste perechi au ambele celule libere. Suma celor doua numaratori este raspunsul cautat.",
    time_limit_ms: 2000,
    memory_limit_mb: 128,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    long long R, C, p, q;
    cin >> R >> C >> p >> q;

    vector<vector<char>> free(R + 1, vector<char>(C + 1, 0));
    for (long long i = 1; i <= R; i++) {
        for (long long j = 1; j <= C; j++) {
            long long n = C * (i - 1) + j;
            free[i][j] = !(n % p == 0 || n % q == 0);
        }
    }

    long long count = 0;
    for (long long i = 1; i <= R; i++) {
        for (long long j = 1; j < C; j++) {
            if (free[i][j] && free[i][j + 1]) count++;
        }
    }
    for (long long i = 1; i < R; i++) {
        for (long long j = 1; j <= C; j++) {
            if (free[i][j] && free[i + 1][j]) count++;
        }
    }
    cout << count << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    R, C, p, q = map(int, sys.stdin.read().split())

    free = [[False] * (C + 1) for _ in range(R + 1)]
    for i in range(1, R + 1):
        base = C * (i - 1)
        for j in range(1, C + 1):
            n = base + j
            free[i][j] = not (n % p == 0 or n % q == 0)

    count = 0
    for i in range(1, R + 1):
        row = free[i]
        for j in range(1, C):
            if row[j] and row[j + 1]:
                count += 1
    for i in range(1, R):
        row_a = free[i]
        row_b = free[i + 1]
        for j in range(1, C + 1):
            if row_a[j] and row_b[j]:
                count += 1

    print(count)

main()
`,
    tests: ["50 50 7 13\n", "10 10 2 3\n", "1 50 3 5\n", "50 1 3 5\n", "100 100 7 11\n"],
  },
  {
    slug: "concurs-mi-ub-2021-algoritm-lacom-bancnote",
    title: "Concurs MI UB 2021 - Cel mai mic contraexemplu pentru algoritmul lacom",
    difficulty: "hard",
    tags: ["concurs", "mateinfo-ub", "2021", "programare-dinamica", "algoritm-greedy"],
    statement:
      "Consideram urmatorul algoritm lacom de acoperire a unei sume de bani, folosind bancnotele disponibile:\n\n" +
      "Cat timp suma este neacoperita si exista o bancnota de valoare mai mica sau egala cu suma ramasa, se alege cea mai mare astfel de bancnota, " +
      "se scoate din portofel, si suma ramasa se reduce cu valoarea ei. Daca algoritmul se incheie cu suma 0, a reusit, altfel a esuat.\n\n" +
      "Pentru o configuratie de tipuri de bancnote disponibile (fiecare tip putand fi folosit de oricate ori), poate exista o suma S pentru care " +
      "algoritmul lacom esueaza, desi exista o combinatie de bancnote care acopera exact suma S (adica exista o solutie cu mai putine bancnote decat " +
      "gaseste algoritmul lacom, sau algoritmul lacom se blocheaza complet). O astfel de suma se numeste contraexemplu.\n\n" +
      "Se citesc k tipuri de bancnote (intre care se afla obligatoriu si valoarea 1) si un numar M. Fie S_min cea mai mica suma de acoperit care " +
      "constituie un contraexemplu pentru algoritmul lacom, folosind exact aceste tipuri de bancnote. Determinati restul lui S_min la impartirea cu M.",
    input_format:
      "Pe prima linie se citesc doua numere naturale k si M. Pe a doua linie se citesc k numere naturale distincte, reprezentand valorile bancnotelor " +
      "disponibile (printre care se afla intotdeauna valoarea 1).",
    output_format: "Se afiseaza un singur numar intreg, restul lui S_min la impartirea cu M.",
    constraints:
      "2 <= k <= 10\n1 <= valoare bancnota <= 1000\nValoarea 1 se afla intotdeauna printre bancnotele date.\nSe garanteaza ca S_min exista si este cel mult 3000.",
    hints:
      "Pentru fiecare suma S de la 1 la o limita fixata, se poate calcula: (a) numarul de bancnote folosite de algoritmul lacom, prin simulare directa, " +
      "si (b) numarul minim real de bancnote necesare, printr-o programare dinamica de tip 'schimb de moneda' (coin change) calculata o singura data pentru " +
      "toate sumele pana la limita. Primul S pentru care cele doua valori difera este S_min.",
    explanation:
      "Ca in explicatia oficiala pentru bancnotele romanesti, unde s-a identificat manual contraexemplul S=600 (bancnotele 500,200,200,200): in loc sa " +
      "cautam manual configuratia problematica, calculam programatic, pentru fiecare suma S de la 1 la 3000, doua valori si le comparam. Numarul de " +
      "bancnote folosit de algoritmul lacom se obtine prin simulare directa (la fiecare pas se alege cea mai mare bancnota <= suma ramasa). Numarul minim " +
      "real de bancnote se obtine cu o programare dinamica standard optim[0]=0, optim[s]=1+min(optim[s-bancnota]) peste toate bancnotele <=s. Primul S " +
      "pentru care numarul lacom depaseste numarul optim este S_min cautat.",
    time_limit_ms: 1500,
    memory_limit_mb: 64,
    cpp: `#include <bits/stdc++.h>
using namespace std;

const int LIMIT = 3000;

int main(){
    int k;
    long long M;
    cin >> k >> M;
    vector<long long> denom(k);
    for (int i = 0; i < k; i++) cin >> denom[i];
    sort(denom.begin(), denom.end());

    const long long INF = 4000000000LL;
    vector<long long> optim(LIMIT + 1, INF);
    optim[0] = 0;
    for (int s = 1; s <= LIMIT; s++) {
        for (int i = 0; i < k; i++) {
            if (denom[i] <= s && optim[s - denom[i]] + 1 < optim[s]) {
                optim[s] = optim[s - denom[i]] + 1;
            }
        }
    }

    long long sMin = -1;
    for (int s = 1; s <= LIMIT; s++) {
        long long remaining = s;
        long long greedyCount = 0;
        for (int i = k - 1; i >= 0; i--) {
            while (remaining >= denom[i]) {
                remaining -= denom[i];
                greedyCount++;
            }
        }
        if (greedyCount != optim[s]) {
            sMin = s;
            break;
        }
    }

    cout << (sMin % M) << "\\n";
    return 0;
}
`,
    py: `import sys

LIMIT = 3000

def main():
    data = sys.stdin.read().split()
    idx = 0
    k = int(data[idx]); idx += 1
    M = int(data[idx]); idx += 1
    denom = sorted(int(v) for v in data[idx:idx+k])

    INF = 4000000000
    optim = [INF] * (LIMIT + 1)
    optim[0] = 0
    for s in range(1, LIMIT + 1):
        best = INF
        for d in denom:
            if d <= s and optim[s - d] + 1 < best:
                best = optim[s - d] + 1
        optim[s] = best

    s_min = -1
    for s in range(1, LIMIT + 1):
        remaining = s
        greedy_count = 0
        for d in reversed(denom):
            while remaining >= d:
                remaining -= d
                greedy_count += 1
        if greedy_count != optim[s]:
            s_min = s
            break

    print(s_min % M)

main()
`,
    tests: [
      "3 97\n1 4 6\n",
      "3 1000\n1 3 4\n",
      "3 7\n1 15 25\n",
      "3 13\n1 4 5\n",
      "3 100000\n1 6 10\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2021-date-robuste",
    title: "Concurs MI UB 2021 - Numarul de date robuste dintr-un an",
    difficulty: "hard",
    tags: ["concurs", "mateinfo-ub", "2021", "simulare", "forta-bruta"],
    statement:
      "O data calendaristica are cinci componente: an, luna, zi, ora si minut. Spunem ca o astfel de data este robusta daca putem deduce in mod unic " +
      "la ce data valida se refera o multime de cinci numere, fara sa stim initial corespondenta dintre valori si campurile datei.\n\n" +
      "De exemplu, avand valorile {3,20,30,53,2021}, se stie ca nu poate fi vorba decat de 30.03.2021 20:53 (deoarece 2021 nu poate fi decat anul, 30 nu " +
      "poate fi ora sau minutul unei alte combinatii valide etc.), deci aceasta data este robusta. In schimb, data 23.05.2021 20:53 nu este robusta, " +
      "deoarece multimea {5,20,23,53,2021} poate identifica si alte date, de exemplu 20.05.2021 23:53.\n\n" +
      "Se citeste un numar natural Y, reprezentand un an. Determinati cate date dintre 01.01.Y 00:00 si 31.12.Y 23:59 sunt robuste.\n\n" +
      "O data este valida daca ora este in intervalul [0,23], minutul in [0,59], luna in [1,12], iar ziua este in intervalul corespunzator lunii " +
      "respective, conform calendarului anului Y (tinand cont de anii bisecti).",
    input_format: "Se citeste pe o singura linie numarul natural Y.",
    output_format: "Se afiseaza un singur numar natural, numarul de date robuste din anul Y.",
    constraints: "1900 <= Y <= 2100",
    hints:
      "Se pot parcurge toate datele valide din anul Y (luna, zi, ora, minut) si, pentru fiecare, se construieste multimea (sortata) formata din cele " +
      "cinci valori (Y, luna, zi, ora, minut). O data este robusta daca aceasta multime sortata apare o singura data printre toate datele valide din an.",
    explanation:
      "Ca in codul C++ dat in explicatia oficiala (pentru anul 2021, cu rezultatul 44382): se parcurg toate combinatiile valide de luna, zi, ora si minut " +
      "din anul Y (tinand cont de numarul corect de zile din fiecare luna, inclusiv luna februarie in functie de anii bisecti), se construieste pentru " +
      "fiecare data cheia formata din cele cinci valori (Y, luna, zi, ora, minut) sortate crescator, si se numara de cate ori apare fiecare cheie intr-o " +
      "structura de tip harta (dictionar). La final, se numara cate chei au aparut exact o singura data — acestea corespund datelor robuste.",
    time_limit_ms: 8000,
    memory_limit_mb: 256,
    cpp: `#include <bits/stdc++.h>
using namespace std;

bool isLeap(long long y){
    return (y % 4 == 0 && y % 100 != 0) || (y % 400 == 0);
}

int main(){
    long long Y;
    cin >> Y;

    int zile[13] = {0,31,28,31,30,31,30,31,31,30,31,30,31};
    if (isLeap(Y)) zile[2] = 29;

    unordered_map<long long, int> cnt;
    cnt.reserve(600000);

    const long long BASE = 2200;
    for (int luna = 1; luna <= 12; luna++) {
        for (int zi = 1; zi <= zile[luna]; zi++) {
            for (int ora = 0; ora <= 23; ora++) {
                for (int minut = 0; minut <= 59; minut++) {
                    long long v[5] = {Y, luna, zi, ora, minut};
                    sort(v, v + 5);
                    long long key = 0;
                    for (int t = 0; t < 5; t++) key = key * BASE + v[t];
                    cnt[key]++;
                }
            }
        }
    }

    long long robust = 0;
    for (auto &pr : cnt) {
        if (pr.second == 1) robust++;
    }

    cout << robust << "\\n";
    return 0;
}
`,
    py: `import sys

def is_leap(y):
    return (y % 4 == 0 and y % 100 != 0) or (y % 400 == 0)

def main():
    Y = int(sys.stdin.read().split()[0])

    zile = [0,31,28,31,30,31,30,31,31,30,31,30,31]
    if is_leap(Y):
        zile[2] = 29

    BASE = 2200
    cnt = {}

    for luna in range(1, 13):
        for zi in range(1, zile[luna] + 1):
            for ora in range(24):
                for minut in range(60):
                    v = [Y, luna, zi, ora, minut]
                    v.sort()
                    key = 0
                    for t in v:
                        key = key * BASE + t
                    cnt[key] = cnt.get(key, 0) + 1

    robust = 0
    for c in cnt.values():
        if c == 1:
            robust += 1

    print(robust)

main()
`,
    tests: ["2021\n", "2020\n", "2023\n", "2024\n", "2000\n"],
  },
  {
    slug: "concurs-mi-ub-2021-program-lucru-suprapus",
    title: "Concurs MI UB 2021 - Configuratii de program cu suprapunere comuna",
    difficulty: "hard",
    tags: ["concurs", "mateinfo-ub", "2021", "combinatorica", "aritmetica-modulara"],
    statement:
      "O companie are E angajati. Ziua de lucru urmatoare are un total de N minute (numerotate de la 1 la N). Fiecare angajat i stie exact cate minute " +
      "poate lucra a doua zi; aceste valori sunt date de sirul x_1, x_2, ..., x_E.\n\n" +
      "Un angajat care poate lucra x minute alege un interval continuu de x minute care incepe la un minut fix si este inclus complet in cele N minute " +
      "ale zilei (adica poate incepe la minutul s, cu 1 <= s <= N - x + 1, si acopera minutele s, s+1, ..., s+x-1).\n\n" +
      "Angajatii vor sa isi coordoneze alegerile astfel incat oricare doi dintre ei sa aiba cel putin un minut comun in program (nu neaparat acelasi " +
      "minut comun pentru toti, ci oricare doua intervale, luate separat, sa se intersecteze).\n\n" +
      "Cate configuratii de alegeri satisfac aceasta cerinta? Deoarece raspunsul poate fi foarte mare, se cere restul acestui numar la impartirea cu " +
      "1 000 000 007. O configuratie A difera de o configuratie B daca exista cel putin un angajat care si-a ales un interval diferit in A fata de B.",
    input_format:
      "Pe prima linie se citesc doua numere naturale N si E. Pe a doua linie se citesc E numere naturale, reprezentand numarul de minute pe care le " +
      "poate lucra fiecare angajat.",
    output_format: "Se afiseaza un singur numar natural, numarul de configuratii, modulo 1000000007.",
    constraints: "1 <= N <= 5000\n2 <= E <= 10\n1 <= x_i <= N",
    hints:
      "Pentru intervale pe o dreapta este valabila proprietatea lui Helly in dimensiune 1: daca oricare doua intervale dintr-o familie se intersecteaza " +
      "doua cate doua, atunci toate intervalele au un minut comun tuturor. Se poate deci numara, pentru fiecare minut m posibil, configuratiile in care " +
      "toate intervalele contin minutul m si cel putin unul incepe exact la m (pentru a evita numararea aceleiasi configuratii pentru mai multe valori " +
      "ale lui m); insumand aceste numaratori pentru toate valorile lui m se obtine raspunsul.",
    explanation:
      "Ca in explicatia oficiala pentru cei 7 angajati: pentru un angajat cu lungime x si un minut fix m, numarul de pozitii de start posibile astfel " +
      "incat intervalul sa contina minutul m este a_x(m) = max(0, min(m, N-x+1) - max(1, m-x+1) + 1); dintre acestea, numarul celor care contin m dar " +
      "incep strict inainte de m este b_x(m) = a_x(m) - (1 daca m <= N-x+1, altfel 0). Pentru un m fix, numarul configuratiilor in care toate intervalele " +
      "contin m, iar cel putin unul incepe chiar la m, este produsul lui a_x(m) peste toti angajatii minus produsul lui b_x(m) peste toti angajatii " +
      "(aceasta scadere elimina exact configuratiile in care niciun interval nu incepe la m, evitand dubla numarare intre valori diferite ale lui m). " +
      "Insumand aceasta diferenta pentru m de la 1 la N, modulo 1000000007, se obtine raspunsul final.",
    time_limit_ms: 1500,
    memory_limit_mb: 64,
    cpp: `#include <bits/stdc++.h>
using namespace std;

const long long MOD = 1000000007LL;

int main(){
    long long N, E;
    cin >> N >> E;
    vector<long long> x(E);
    for (int i = 0; i < E; i++) cin >> x[i];

    long long answer = 0;
    for (long long m = 1; m <= N; m++) {
        long long prodA = 1, prodB = 1;
        for (int i = 0; i < E; i++) {
            long long xi = x[i];
            long long hiStart = N - xi + 1;
            long long a = max(0LL, min(m, hiStart) - max(1LL, m - xi + 1) + 1);
            long long b = a - (m <= hiStart ? 1 : 0);
            prodA = (prodA * (a % MOD)) % MOD;
            prodB = (prodB * (b % MOD)) % MOD;
        }
        long long diff = (prodA - prodB) % MOD;
        if (diff < 0) diff += MOD;
        answer = (answer + diff) % MOD;
    }

    cout << answer << "\\n";
    return 0;
}
`,
    py: `import sys

MOD = 1000000007

def main():
    data = sys.stdin.read().split()
    idx = 0
    N = int(data[idx]); idx += 1
    E = int(data[idx]); idx += 1
    xs = [int(v) for v in data[idx:idx+E]]

    answer = 0
    for m in range(1, N + 1):
        prod_a = 1
        prod_b = 1
        for xi in xs:
            hi_start = N - xi + 1
            a = max(0, min(m, hi_start) - max(1, m - xi + 1) + 1)
            b = a - (1 if m <= hi_start else 0)
            prod_a = (prod_a * (a % MOD)) % MOD
            prod_b = (prod_b * (b % MOD)) % MOD
        diff = (prod_a - prod_b) % MOD
        if diff < 0:
            diff += MOD
        answer = (answer + diff) % MOD

    print(answer)

main()
`,
    tests: [
      "1440 7\n480 360 333 1000 285 560 15\n",
      "100 3\n50 60 70\n",
      "10 2\n5 6\n",
      "1440 5\n200 300 400 500 600\n",
      "5000 8\n1000 2000 3000 4000 500 600 700 4999\n",
    ],
  },
];

async function seedGroup(list) {
  const summary = [];

  for (const p of list) {
    console.log(`\n=== ${p.slug} ===`);
    try {
      let allOk = true;
      const testRows = [];

      for (let i = 0; i < p.tests.length; i++) {
        const input = p.tests[i];
        const [cppOut, pyOut] = await Promise.all([runCustom("cpp", p.cpp, input), runCustom("python", p.py, input)]);

        if (cppOut.verdict !== "AC") {
          console.error(`  TEST ${i}: cpp execution failed: ${JSON.stringify(cppOut)} (input=${JSON.stringify(input)})`);
          allOk = false;
          continue;
        }
        if (pyOut.verdict !== "AC") {
          console.error(`  TEST ${i}: python execution failed: ${JSON.stringify(pyOut)} (input=${JSON.stringify(input)})`);
          allOk = false;
          continue;
        }

        const normCpp = normalize(cppOut.stdout);
        const normPy = normalize(pyOut.stdout);
        if (normCpp !== normPy) {
          console.error(`  TEST ${i}: MISMATCH cpp="${normCpp}" python="${normPy}" (input=${JSON.stringify(input)})`);
          allOk = false;
          continue;
        }

        testRows.push({ input, expected_output: `${normCpp}\n`, is_sample: i < 2 });
      }

      if (!allOk) {
        console.error(`!!! ${p.slug} has failing tests - NOT publishing.`);
        summary.push({ slug: p.slug, ok: false, tests: testRows.length });
        continue;
      }

      const existing = await pool.query("SELECT id FROM problems WHERE slug = $1", [p.slug]);
      let problemId;
      if (existing.rows.length > 0) {
        problemId = existing.rows[0].id;
        await pool.query(
          `UPDATE problems SET
             title=$2, statement=$3, input_format=$4, output_format=$5, constraints=$6,
             difficulty=$7, time_limit_ms=$8, memory_limit_mb=$9, source=$10, tags=$11,
             allowed_languages=$12, is_published=true, editorial_status='published', official_solution=$13,
             hints=$14, explanation=$15, official_solution_cpp=$16, official_solution_python=$17,
             curriculum_level=$18, curriculum_chapter_id=$19, curriculum_subcategory_id=$20,
             solution_mode='full', checker_mode='exact', updated_at=NOW()
           WHERE id=$1`,
          [
            problemId,
            p.title,
            p.statement,
            p.input_format,
            p.output_format,
            p.constraints,
            p.difficulty,
            p.time_limit_ms || 1500,
            p.memory_limit_mb || 64,
            "Concurs Mate Info UB",
            p.tags || [],
            ["cpp", "c", "pascal", "python"],
            p.cpp,
            p.hints,
            p.explanation,
            p.cpp,
            p.py,
            CHAPTER.level,
            CHAPTER.chapter,
            CHAPTER.sub,
          ],
        );
        await pool.query("DELETE FROM test_cases WHERE problem_id = $1", [problemId]);
      } else {
        const inserted = await pool.query(
          `INSERT INTO problems (
             slug, title, statement, input_format, output_format, constraints,
             difficulty, time_limit_ms, memory_limit_mb, source, tags,
             allowed_languages, is_published, official_solution,
             hints, explanation, official_solution_cpp, official_solution_python,
             curriculum_level, curriculum_chapter_id, curriculum_subcategory_id,
             solution_mode, checker_mode, editorial_status, estimated_minutes
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,$13,$14,$15,$16,$17,$18,$19,$20,'full','exact','published',5
           )
           RETURNING id`,
          [
            p.slug,
            p.title,
            p.statement,
            p.input_format,
            p.output_format,
            p.constraints,
            p.difficulty,
            p.time_limit_ms || 1500,
            p.memory_limit_mb || 64,
            "Concurs Mate Info UB",
            p.tags || [],
            ["cpp", "c", "pascal", "python"],
            p.cpp,
            p.hints,
            p.explanation,
            p.cpp,
            p.py,
            CHAPTER.level,
            CHAPTER.chapter,
            CHAPTER.sub,
          ],
        );
        problemId = inserted.rows[0].id;
      }

      for (let i = 0; i < testRows.length; i++) {
        const t = testRows[i];
        await pool.query(
          `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index) VALUES ($1,$2,$3,$4,$5,$6)`,
          [problemId, t.input, t.expected_output, t.is_sample, 10, i + 1],
        );
      }

      console.log(`published ${p.slug} (${p.difficulty}) with ${testRows.length} tests`);
      summary.push({ slug: p.slug, ok: true, tests: testRows.length });
    } catch (err) {
      console.error(`FAIL ${p.slug}: ${err.message}`);
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
