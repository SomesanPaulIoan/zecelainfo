const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade11", chapter: "backtracking", sub: "elemente-combinatorica" };

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

const BT_NOTE = "Rezolvati problema obligatoriu prin metoda Backtracking: construiti solutia element cu element (pozitie cu pozitie), iar atunci cand solutia partiala nu mai poate fi extinsa sau este completa, reveniti (backtrack) si incercati o alta alegere.";

const problems = [
  // ===================== A. GENERAREA PERMUTARILOR LEXICOGRAFIC =====================
  {
    slug: "bt-permutari-lexicografic",
    title: "Generarea permutarilor multimii {1,2,...,n} in ordine lexicografica",
    difficulty: "easy",
    tags: ["backtracking", "permutari", "combinatorica"],
    statement: "Se citeste un numar natural n. Generati, folosind metoda Backtracking, toate permutarile multimii {1, 2, ..., n}, in ordine lexicografica.",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza toate cele n! permutari ale multimii {1,...,n}, cate una pe fiecare linie, in ordine lexicografica, cu elementele separate prin spatiu.",
    constraints: "1 <= n <= 8",
    hints: "Construiti permutarea pozitie cu pozitie, intr-un vector a[]. La fiecare pas alegeti, in ordine crescatoare, o valoare neutilizata inca si continuati recursiv. Cand permutarea are n elemente, afisati-o si reveniti (marcati valoarea ca neutilizata).",
    explanation: `${BT_NOTE} Pentru a obtine permutarile in ordine lexicografica, la fiecare pas se incearca valorile disponibile in ordine crescatoare (1, 2, ..., n).\n\n**Complexitate:** O(n! * n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
int a[10];
bool folosit[10];
void bkt(int k) {
    if (k == n) {
        for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\\n');
        return;
    }
    for (int v = 1; v <= n; v++) {
        if (!folosit[v]) {
            folosit[v] = true;
            a[k] = v;
            bkt(k + 1);
            folosit[v] = false;
        }
    }
}
int main() {
    cin >> n;
    bkt(0);
    return 0;
}
`,
    py: `def bkt(a, folosit, n, out):
    if len(a) == n:
        out.append(' '.join(map(str, a)))
        return
    for v in range(1, n + 1):
        if not folosit[v]:
            folosit[v] = True
            a.append(v)
            bkt(a, folosit, n, out)
            a.pop()
            folosit[v] = False

n = int(input())
folosit = [False] * (n + 1)
out = []
bkt([], folosit, n, out)
print('\\n'.join(out))
`,
    tests: ["1", "2", "3", "4"],
  },
  {
    slug: "bt-permutari-litere-cuvant",
    title: "Permutarile literelor unui cuvant cu litere distincte",
    difficulty: "easy",
    tags: ["backtracking", "permutari", "combinatorica", "siruri"],
    statement: "Se citeste un cuvant format din n litere mici ale alfabetului englez, distincte doua cate doua. Generati, folosind metoda Backtracking, toate rearanjarile (permutarile) literelor cuvantului, in ordine lexicografica.",
    input_format: "Se citeste un cuvant format din n litere mici, distincte doua cate doua.",
    output_format: "Se afiseaza toate cele n! rearanjari ale literelor cuvantului dat, cate una pe linie, in ordine lexicografica.",
    constraints: "1 <= n <= 8, literele sunt distincte",
    hints: "Sortati mai intai literele crescator. Apoi construiti fiecare rearanjare folosind aceeasi tehnica de backtracking ca la permutarile numerelor: alegeti pe rand, in ordinea sortata, o litera neutilizata inca.",
    explanation: `${BT_NOTE} Sortarea literelor la inceput este esentiala pentru a garanta ca alegerile facute in backtracking (in ordinea din vectorul sortat) produc rearanjarile in ordine lexicografica.\n\n**Complexitate:** O(n! * n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
char lit[10];
bool folosit[10];
char a[10];
void bkt(int k) {
    if (k == n) {
        for (int i = 0; i < n; i++) cout << a[i];
        cout << "\\n";
        return;
    }
    for (int i = 0; i < n; i++) {
        if (!folosit[i]) {
            folosit[i] = true;
            a[k] = lit[i];
            bkt(k + 1);
            folosit[i] = false;
        }
    }
}
int main() {
    string s; cin >> s;
    n = (int)s.size();
    for (int i = 0; i < n; i++) lit[i] = s[i];
    sort(lit, lit + n);
    bkt(0);
    return 0;
}
`,
    py: `def bkt(k, lit, folosit, a, n, out):
    if k == n:
        out.append(''.join(a))
        return
    for i in range(n):
        if not folosit[i]:
            folosit[i] = True
            a.append(lit[i])
            bkt(k + 1, lit, folosit, a, n, out)
            a.pop()
            folosit[i] = False

s = input().strip()
lit = sorted(s)
n = len(lit)
folosit = [False] * n
out = []
bkt(0, lit, folosit, [], n, out)
print('\\n'.join(out))
`,
    tests: ["a", "ab", "abc", "bca"],
  },
  {
    slug: "bt-permutari-suma-para-pozitii-impare",
    title: "Permutari ale {1,...,n} cu suma para pe pozitiile impare",
    difficulty: "medium",
    tags: ["backtracking", "permutari", "combinatorica", "proprietate"],
    statement: "Se citeste un numar natural n. Numerotam pozitiile unei permutari de la 1 la n. Generati, folosind metoda Backtracking, toate permutarile multimii {1,2,...,n} pentru care suma elementelor aflate pe pozitiile impare (1, 3, 5, ...) este numar par. Permutarile se afiseaza in ordine lexicografica.",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza, cate una pe linie, in ordine lexicografica, toate permutarile care satisfac proprietatea ceruta, cu elementele separate prin spatiu. Daca nu exista nicio astfel de permutare, nu se afiseaza nimic.",
    constraints: "1 <= n <= 9",
    hints: "Generati permutarile ca de obicei, prin backtracking. Abia cand permutarea este completa (are n elemente), calculati suma elementelor de pe pozitiile impare si afisati permutarea doar daca suma este para.",
    explanation: `${BT_NOTE} Verificarea proprietatii (suma pe pozitii impare para) se face doar in frunza recursiei, cand solutia partiala este completa, deoarece proprietatea depinde de toate pozitiile impare simultan.\n\n**Complexitate:** O(n! * n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
int a[10];
bool folosit[10];
void bkt(int k) {
    if (k == n) {
        long long suma = 0;
        for (int i = 0; i < n; i++) if ((i + 1) % 2 == 1) suma += a[i];
        if (suma % 2 == 0) {
            for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\\n');
        }
        return;
    }
    for (int v = 1; v <= n; v++) {
        if (!folosit[v]) {
            folosit[v] = true;
            a[k] = v;
            bkt(k + 1);
            folosit[v] = false;
        }
    }
}
int main() {
    cin >> n;
    bkt(0);
    return 0;
}
`,
    py: `def bkt(a, folosit, n, out):
    if len(a) == n:
        suma = sum(a[i] for i in range(n) if (i + 1) % 2 == 1)
        if suma % 2 == 0:
            out.append(' '.join(map(str, a)))
        return
    for v in range(1, n + 1):
        if not folosit[v]:
            folosit[v] = True
            a.append(v)
            bkt(a, folosit, n, out)
            a.pop()
            folosit[v] = False

n = int(input())
folosit = [False] * (n + 1)
out = []
bkt([], folosit, n, out)
print('\\n'.join(out))
`,
    tests: ["1", "2", "3", "4"],
  },
  {
    slug: "bt-permutare-lexicografic-urmatoare",
    title: "Permutarea lexicografic urmatoare",
    difficulty: "medium",
    tags: ["backtracking", "permutari", "combinatorica"],
    statement: "Se citesc numarul natural n si o permutare a multimii {1,2,...,n}. Determinati, fara a folosi functii predefinite de biblioteca, permutarea imediat urmatoare in ordinea lexicografica. Daca permutarea data este ultima posibila (n, n-1, ..., 1), se considera ca urmatoarea este prima permutare (1, 2, ..., n).",
    input_format: "Pe prima linie se citeste numarul natural n. Pe a doua linie se citesc cele n numere ale permutarii, separate prin spatiu.",
    output_format: "Se afiseaza cele n numere ale permutarii urmatoare, separate prin spatiu.",
    constraints: "1 <= n <= 1000",
    hints: "Cautati de la dreapta la stanga cea mai din dreapta pozitie i pentru care a[i] < a[i+1]. Daca nu exista o astfel de pozitie, permutarea este ultima. Altfel, cautati la dreapta lui i cel mai din dreapta element mai mare decat a[i], interschimbati-le, apoi inversati sufixul de dupa pozitia i.",
    explanation: `Aceasta este o varianta eficienta, alternativa generarii complete prin backtracking, utila cand n este mare si avem nevoie doar de permutarea urmatoare, nu de toate permutarile. Algoritmul: se cauta cea mai din dreapta pozitie i cu a[i] < a[i+1] (punctul de crestere), se interschimba a[i] cu cel mai mic element din sufix mai mare decat a[i], apoi se sorteaza (inverseaza) sufixul ramas, care era descrescator.\n\n**Complexitate:** O(n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    int i = n - 2;
    while (i >= 0 && a[i] >= a[i + 1]) i--;
    if (i < 0) {
        for (int j = 0; j < n; j++) a[j] = j + 1;
    } else {
        int j = n - 1;
        while (a[j] <= a[i]) j--;
        swap(a[i], a[j]);
        reverse(a.begin() + i + 1, a.end());
    }
    for (int k = 0; k < n; k++) cout << a[k] << (k + 1 < n ? ' ' : '\\n');
    return 0;
}
`,
    py: `n = int(input())
a = list(map(int, input().split()))
i = n - 2
while i >= 0 and a[i] >= a[i + 1]:
    i -= 1
if i < 0:
    a = list(range(1, n + 1))
else:
    j = n - 1
    while a[j] <= a[i]:
        j -= 1
    a[i], a[j] = a[j], a[i]
    a[i + 1:] = reversed(a[i + 1:])
print(' '.join(map(str, a)))
`,
    tests: ["3\n1 2 3", "3\n3 2 1", "4\n1 3 4 2", "1\n1", "5\n2 1 5 4 3"],
  },
  {
    slug: "bt-a-k-a-permutare",
    title: "A k-a permutare in ordine lexicografica",
    difficulty: "hard",
    tags: ["backtracking", "permutari", "combinatorica", "eficienta"],
    statement: "Se citesc doua numere naturale n si k. Determinati, fara a genera efectiv toate permutarile, care este a k-a permutare (in ordine lexicografica, numerotata incepand de la 1) a multimii {1,2,...,n}.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si k (1 <= k <= n!).",
    output_format: "Se afiseaza cele n numere ale permutarii cautate, separate prin spatiu.",
    constraints: "1 <= n <= 15, 1 <= k <= n!",
    hints: "Folositi sistemul factorial de numeratie: pentru prima pozitie exista (n-1)! permutari pentru fiecare alegere posibila a primului element, deci alegeti al ((k-1) div (n-1)!)-lea element ramas, actualizati k, si repetati pentru pozitiile urmatoare cu elementele ramase.",
    explanation: `Aceasta este tehnica de \"unranking\": in loc sa generam prin backtracking toate cele n! permutari si sa o alegem pe a k-a (imposibil de rapid pentru n mare), calculam direct permutarea folosind factorialele. La fiecare pozitie, blocul de (n-i)! permutari corespunde alegerii celui de-al i-lea element ramas; impartind (k-1) la acest bloc obtinem indexul elementului de ales.\n\n**Complexitate:** O(n^2) (din stergerea din vector; se poate optimiza la O(n log n))`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; long long k;
    cin >> n >> k;
    k--;
    vector<long long> fact(n + 1);
    fact[0] = 1;
    for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i;
    vector<int> ramase;
    for (int i = 1; i <= n; i++) ramase.push_back(i);
    vector<int> rezultat;
    for (int i = n; i >= 1; i--) {
        long long bloc = fact[i - 1];
        int idx = (int)(k / bloc);
        k %= bloc;
        rezultat.push_back(ramase[idx]);
        ramase.erase(ramase.begin() + idx);
    }
    for (int i = 0; i < n; i++) cout << rezultat[i] << (i + 1 < n ? ' ' : '\\n');
    return 0;
}
`,
    py: `n, k = map(int, input().split())
k -= 1
fact = [1] * (n + 1)
for i in range(1, n + 1):
    fact[i] = fact[i - 1] * i
ramase = list(range(1, n + 1))
rezultat = []
for i in range(n, 0, -1):
    bloc = fact[i - 1]
    idx = k // bloc
    k %= bloc
    rezultat.append(ramase[idx])
    del ramase[idx]
print(' '.join(map(str, rezultat)))
`,
    tests: ["3 1", "3 6", "4 10", "1 1", "5 1"],
  },
  {
    slug: "bt-rangul-unei-permutari",
    title: "Rangul unei permutari in ordine lexicografica",
    difficulty: "hard",
    tags: ["backtracking", "permutari", "combinatorica", "eficienta"],
    statement: "Se citesc numarul natural n si o permutare a multimii {1,2,...,n}. Determinati ce rang (pozitie, numerotata incepand de la 1) ocupa aceasta permutare in sirul tuturor permutarilor multimii {1,...,n}, ordonate lexicografic, fara a genera efectiv toate permutarile.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere ale permutarii.",
    output_format: "Se afiseaza un singur numar: rangul permutarii.",
    constraints: "1 <= n <= 15",
    hints: "Pentru fiecare pozitie i, numarati cate dintre valorile ramase (neutilizate inca) sunt mai mici decat a[i]; acel numar, inmultit cu (n-i-1)!, se aduna la rang. La final adunati 1, deoarece rangul se numeroteaza de la 1.",
    explanation: `Este operatia inversa fata de problema \"A k-a permutare\": pornind de la o permutare data, calculam direct rangul ei folosind codul Lehmer, fara a genera toate permutarile anterioare prin backtracking.\n\n**Complexitate:** O(n^2) (se poate optimiza la O(n log n) cu un arbore de indecsi)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    vector<long long> fact(n + 1);
    fact[0] = 1;
    for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i;
    vector<bool> folosit(n + 1, false);
    long long rang = 0;
    for (int i = 0; i < n; i++) {
        int mai_mici = 0;
        for (int v = 1; v < a[i]; v++) if (!folosit[v]) mai_mici++;
        rang += (long long)mai_mici * fact[n - i - 1];
        folosit[a[i]] = true;
    }
    cout << rang + 1 << "\\n";
    return 0;
}
`,
    py: `n = int(input())
a = list(map(int, input().split()))
fact = [1] * (n + 1)
for i in range(1, n + 1):
    fact[i] = fact[i - 1] * i
folosit = [False] * (n + 1)
rang = 0
for i in range(n):
    mai_mici = sum(1 for v in range(1, a[i]) if not folosit[v])
    rang += mai_mici * fact[n - i - 1]
    folosit[a[i]] = True
print(rang + 1)
`,
    tests: ["3\n1 2 3", "3\n3 2 1", "4\n1 3 4 2", "1\n1", "5\n2 1 5 4 3"],
  },

  // ===================== B. ARANJAMENTE =====================
  {
    slug: "bt-aranjamente-lexicografic",
    title: "Generarea aranjamentelor de n elemente luate cate k",
    difficulty: "easy",
    tags: ["backtracking", "aranjamente", "combinatorica"],
    statement: "Se citesc doua numere naturale n si k (k <= n). Generati, folosind metoda Backtracking, toate aranjamentele multimii {1,2,...,n} luate cate k (submultimi ordonate de k elemente distincte alese din {1,...,n}), in ordine lexicografica.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si k.",
    output_format: "Se afiseaza toate aranjamentele de n luate cate k, cate unul pe linie, in ordine lexicografica, cu elementele separate prin spatiu.",
    constraints: "1 <= k <= n <= 9",
    hints: "Procedati la fel ca la generarea permutarilor, dar opriti constructia solutiei partiale dupa ce s-au ales k elemente (nu neaparat n).",
    explanation: `${BT_NOTE} Diferenta fata de permutari este ca solutia se opreste la k elemente alese, nu la n.\n\n**Complexitate:** O(A(n,k) * k)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, k;
int a[10];
bool folosit[10];
void bkt(int poz) {
    if (poz == k) {
        for (int i = 0; i < k; i++) cout << a[i] << (i + 1 < k ? ' ' : '\\n');
        return;
    }
    for (int v = 1; v <= n; v++) {
        if (!folosit[v]) {
            folosit[v] = true;
            a[poz] = v;
            bkt(poz + 1);
            folosit[v] = false;
        }
    }
}
int main() {
    cin >> n >> k;
    bkt(0);
    return 0;
}
`,
    py: `def bkt(poz, a, folosit, n, k, out):
    if poz == k:
        out.append(' '.join(map(str, a)))
        return
    for v in range(1, n + 1):
        if not folosit[v]:
            folosit[v] = True
            a.append(v)
            bkt(poz + 1, a, folosit, n, k, out)
            a.pop()
            folosit[v] = False

n, k = map(int, input().split())
folosit = [False] * (n + 1)
out = []
bkt(0, [], folosit, n, k, out)
print('\\n'.join(out))
`,
    tests: ["3 2", "4 2", "5 1", "3 3", "4 3"],
  },
  {
    slug: "bt-aranjamente-litere-alfabet",
    title: "Aranjamente de k litere distincte dintr-un alfabet dat",
    difficulty: "easy",
    tags: ["backtracking", "aranjamente", "combinatorica", "siruri"],
    statement: "Se citeste un cuvant cu litere mici distincte, reprezentand alfabetul disponibil (n litere), si un numar natural k (k <= n). Generati, folosind metoda Backtracking, toate cuvintele de lungime k ce se pot forma folosind k litere distincte alese din alfabetul dat, in ordine lexicografica.",
    input_format: "Pe prima linie se citeste alfabetul (un cuvant cu litere mici, distincte). Pe a doua linie se citeste numarul natural k.",
    output_format: "Se afiseaza, cate unul pe linie, toate cuvintele de lungime k obtinute, in ordine lexicografica.",
    constraints: "1 <= k <= n <= 9",
    hints: "Sortati mai intai literele alfabetului. Apoi generati, prin backtracking, toate secventele de k litere distincte, alese in ordine crescatoare la fiecare pas dintre literele inca neutilizate.",
    explanation: `${BT_NOTE} Ca si la aranjamentele numerice, sortarea alfabetului la inceput garanteaza ordinea lexicografica a cuvintelor generate.\n\n**Complexitate:** O(A(n,k) * k)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, k;
char lit[10];
bool folosit[10];
char a[10];
void bkt(int poz) {
    if (poz == k) {
        for (int i = 0; i < k; i++) cout << a[i];
        cout << "\\n";
        return;
    }
    for (int i = 0; i < n; i++) {
        if (!folosit[i]) {
            folosit[i] = true;
            a[poz] = lit[i];
            bkt(poz + 1);
            folosit[i] = false;
        }
    }
}
int main() {
    string s; cin >> s >> k;
    n = (int)s.size();
    for (int i = 0; i < n; i++) lit[i] = s[i];
    sort(lit, lit + n);
    bkt(0);
    return 0;
}
`,
    py: `import sys

def bkt(poz, lit, folosit, a, n, k, out):
    if poz == k:
        out.append(''.join(a))
        return
    for i in range(n):
        if not folosit[i]:
            folosit[i] = True
            a.append(lit[i])
            bkt(poz + 1, lit, folosit, a, n, k, out)
            a.pop()
            folosit[i] = False

data = sys.stdin.read().split()
s = data[0]
k = int(data[1])
lit = sorted(s)
n = len(lit)
folosit = [False] * n
out = []
bkt(0, lit, folosit, [], n, k, out)
print('\\n'.join(out))
`,
    tests: ["abc\n2", "abcd\n3", "xy\n1", "abcde\n2", "ba\n2"],
  },
  {
    slug: "bt-aranjamente-suma-data",
    title: "Aranjamente de n elemente luate cate k cu suma data",
    difficulty: "medium",
    tags: ["backtracking", "aranjamente", "combinatorica", "proprietate"],
    statement: "Se citesc numerele naturale n, k si S. Generati, folosind metoda Backtracking, toate aranjamentele multimii {1,2,...,n} luate cate k pentru care suma elementelor este exact S, in ordine lexicografica.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n, k si S.",
    output_format: "Se afiseaza, cate unul pe linie, in ordine lexicografica, toate aranjamentele de n luate cate k a caror suma este S. Daca nu exista niciunul, nu se afiseaza nimic.",
    constraints: "1 <= k <= n <= 9, 0 <= S <= 100",
    hints: "Generati aranjamentele ca de obicei, mentinand suma partiala a elementelor deja alese. Verificati proprietatea (suma == S) abia cand aranjamentul este complet (are k elemente).",
    explanation: `${BT_NOTE} Suma partiala se transmite ca parametru suplimentar in recursie, pentru a evita recalcularea ei la fiecare pas.\n\n**Complexitate:** O(A(n,k) * k)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, k; long long S;
int a[10];
bool folosit[10];
void bkt(int poz, long long suma) {
    if (poz == k) {
        if (suma == S) {
            for (int i = 0; i < k; i++) cout << a[i] << (i + 1 < k ? ' ' : '\\n');
        }
        return;
    }
    for (int v = 1; v <= n; v++) {
        if (!folosit[v]) {
            folosit[v] = true;
            a[poz] = v;
            bkt(poz + 1, suma + v);
            folosit[v] = false;
        }
    }
}
int main() {
    cin >> n >> k >> S;
    bkt(0, 0);
    return 0;
}
`,
    py: `def bkt(poz, suma, a, folosit, n, k, S, out):
    if poz == k:
        if suma == S:
            out.append(' '.join(map(str, a)))
        return
    for v in range(1, n + 1):
        if not folosit[v]:
            folosit[v] = True
            a.append(v)
            bkt(poz + 1, suma + v, a, folosit, n, k, S, out)
            a.pop()
            folosit[v] = False

n, k, S = map(int, input().split())
folosit = [False] * (n + 1)
out = []
bkt(0, 0, [], folosit, n, k, S, out)
print('\\n'.join(out))
`,
    tests: ["4 2 5", "5 3 10", "3 2 100", "4 1 3", "5 2 3"],
  },
  {
    slug: "bt-aranjamente-multime-numere",
    title: "Aranjamente de k elemente alese dintr-o multime data de numere",
    difficulty: "medium",
    tags: ["backtracking", "aranjamente", "combinatorica"],
    statement: "Se citesc un numar natural n, cele n numere intregi distincte ale unei multimi date, si un numar natural k (k <= n). Generati, folosind metoda Backtracking, toate aranjamentele de k elemente alese din multimea data, in ordine lexicografica (dupa valorile numerelor).",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere intregi, distincte doua cate doua. Pe a treia linie se citeste k.",
    output_format: "Se afiseaza, cate unul pe linie, in ordine lexicografica, toate aranjamentele de k elemente ale multimii date.",
    constraints: "1 <= k <= n <= 9, -1000 <= elemente <= 1000",
    hints: "Sortati mai intai multimea data. Apoi aplicati acelasi backtracking ca la aranjamentele lui {1,...,n}, dar alegand din vectorul sortat in loc de valorile 1,2,...,n.",
    explanation: `${BT_NOTE} Tehnica de backtracking este identica cu cea folosita pentru {1,...,n}; singura diferenta este multimea din care se aleg elementele, care poate fi orice multime de numere distincte, sortata initial.\n\n**Complexitate:** O(A(n,k) * k)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, k;
long long v[10];
long long a[10];
bool folosit[10];
void bkt(int poz) {
    if (poz == k) {
        for (int i = 0; i < k; i++) cout << a[i] << (i + 1 < k ? ' ' : '\\n');
        return;
    }
    for (int i = 0; i < n; i++) {
        if (!folosit[i]) {
            folosit[i] = true;
            a[poz] = v[i];
            bkt(poz + 1);
            folosit[i] = false;
        }
    }
}
int main() {
    cin >> n;
    for (int i = 0; i < n; i++) cin >> v[i];
    sort(v, v + n);
    cin >> k;
    bkt(0);
    return 0;
}
`,
    py: `def bkt(poz, a, folosit, v, n, k, out):
    if poz == k:
        out.append(' '.join(map(str, a)))
        return
    for i in range(n):
        if not folosit[i]:
            folosit[i] = True
            a.append(v[i])
            bkt(poz + 1, a, folosit, v, n, k, out)
            a.pop()
            folosit[i] = False

n = int(input())
v = sorted(map(int, input().split()))
k = int(input())
folosit = [False] * n
out = []
bkt(0, [], folosit, v, n, k, out)
print('\\n'.join(out))
`,
    tests: ["3\n5 -1 2\n2", "4\n1 2 3 4\n1", "3\n7 3 9\n3", "2\n0 5\n2", "4\n-2 -1 0 1\n2"],
  },
  {
    slug: "bt-a-k-lea-aranjament",
    title: "Al k-lea aranjament in ordine lexicografica",
    difficulty: "hard",
    tags: ["backtracking", "aranjamente", "combinatorica", "eficienta"],
    statement: "Se citesc trei numere naturale n, p si k. Determinati, fara a genera efectiv toate aranjamentele, care este al k-lea aranjament (in ordine lexicografica, numerotat incepand de la 1) al multimii {1,2,...,n} luate cate p.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n, p si k (1 <= k <= A(n,p)).",
    output_format: "Se afiseaza cele p numere ale aranjamentului cautat, separate prin spatiu.",
    constraints: "1 <= p <= n <= 12, 1 <= k <= A(n,p)",
    hints: "La fiecare pozitie, cate un bloc de A(m-1, r) aranjamente corespunde alegerii unui anumit element ramas (unde m este numarul de elemente inca disponibile, iar r este numarul de pozitii ramase dupa cea curenta). Impartiti (k-1) la marimea blocului pentru a afla indexul elementului de ales, actualizati restul si repetati.",
    explanation: `Tehnica de \"unranking\" generalizeaza cazul permutarilor complete: la fiecare din cele p pozitii, se alege un element din multimea ramasa astfel incat blocul de A(m-1, r) aranjamente posibile dupa aceasta alegere sa incadreze corect rangul cautat.\n\n**Complexitate:** O(p^2) (din stergerea din vector)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long arrang(int m, int r) {
    long long rez = 1;
    for (int j = 0; j < r; j++) rez *= (m - j);
    return rez;
}
int main() {
    int n, p; long long k;
    cin >> n >> p >> k;
    k--;
    vector<int> pool;
    for (int i = 1; i <= n; i++) pool.push_back(i);
    vector<int> rez;
    for (int i = 0; i < p; i++) {
        int m = (int)pool.size();
        int r = p - i - 1;
        long long bloc = arrang(m - 1, r);
        int idx = (int)(k / bloc);
        k %= bloc;
        rez.push_back(pool[idx]);
        pool.erase(pool.begin() + idx);
    }
    for (int i = 0; i < p; i++) cout << rez[i] << (i + 1 < p ? ' ' : '\\n');
    return 0;
}
`,
    py: `def arrang(m, r):
    rez = 1
    for j in range(r):
        rez *= (m - j)
    return rez

n, p, k = map(int, input().split())
k -= 1
pool = list(range(1, n + 1))
rez = []
for i in range(p):
    m = len(pool)
    r = p - i - 1
    bloc = arrang(m - 1, r)
    idx = k // bloc
    k %= bloc
    rez.append(pool[idx])
    del pool[idx]
print(' '.join(map(str, rez)))
`,
    tests: ["3 2 1", "3 2 6", "4 2 5", "4 4 1", "5 3 1"],
  },

  // ===================== C. COMBINARI =====================
  {
    slug: "bt-combinari-lexicografic",
    title: "Generarea combinarilor de n elemente luate cate k",
    difficulty: "easy",
    tags: ["backtracking", "combinari", "combinatorica"],
    statement: "Se citesc doua numere naturale n si k (k <= n). Generati, folosind metoda Backtracking, toate combinarile multimii {1,2,...,n} luate cate k (submultimi de k elemente distincte), in ordine lexicografica, cu elementele fiecarei combinari afisate in ordine crescatoare.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si k.",
    output_format: "Se afiseaza toate combinarile de n luate cate k, cate una pe linie, in ordine lexicografica, cu elementele in ordine crescatoare, separate prin spatiu.",
    constraints: "1 <= k <= n <= 20",
    hints: "Spre deosebire de aranjamente, la combinari ordinea elementelor nu conteaza, asa ca la fiecare pas alegeti urmatorul element strict mai mare decat ultimul ales (parametrul start), evitand astfel duplicatele.",
    explanation: `${BT_NOTE} Parametrul \"start\" garanteaza ca fiecare combinare este generata o singura data, cu elementele in ordine crescatoare.\n\n**Complexitate:** O(C(n,k) * k)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, k;
int a[25];
void bkt(int poz, int start) {
    if (poz == k) {
        for (int i = 0; i < k; i++) cout << a[i] << (i + 1 < k ? ' ' : '\\n');
        return;
    }
    for (int v = start; v <= n; v++) {
        a[poz] = v;
        bkt(poz + 1, v + 1);
    }
}
int main() {
    cin >> n >> k;
    bkt(0, 1);
    return 0;
}
`,
    py: `def bkt(poz, start, a, n, k, out):
    if poz == k:
        out.append(' '.join(map(str, a)))
        return
    for v in range(start, n + 1):
        a.append(v)
        bkt(poz + 1, v + 1, a, n, k, out)
        a.pop()

n, k = map(int, input().split())
out = []
bkt(0, 1, [], n, k, out)
print('\\n'.join(out))
`,
    tests: ["5 3", "4 2", "6 1", "4 4", "6 6"],
  },
  {
    slug: "bt-combinari-litere-alfabet",
    title: "Combinari de k litere dintr-un alfabet dat",
    difficulty: "easy",
    tags: ["backtracking", "combinari", "combinatorica", "siruri"],
    statement: "Se citeste un cuvant cu litere mici distincte, reprezentand alfabetul disponibil (n litere), si un numar natural k (k <= n). Generati, folosind metoda Backtracking, toate submultimile de k litere ale alfabetului, in ordine lexicografica, cu literele fiecarui grup afisate in ordinea alfabetului.",
    input_format: "Pe prima linie se citeste alfabetul (un cuvant cu litere mici, distincte). Pe a doua linie se citeste numarul natural k.",
    output_format: "Se afiseaza, cate una pe linie, toate combinarile de k litere obtinute, in ordine lexicografica.",
    constraints: "1 <= k <= n <= 20",
    hints: "Sortati alfabetul, apoi alegeti literele in ordine, folosind un parametru start ca la combinarile numerice, pentru a evita generarea aceleiasi submultimi de mai multe ori.",
    explanation: `${BT_NOTE} Aceeasi tehnica ca la combinarile numerice, aplicata literelor alfabetului sortat.\n\n**Complexitate:** O(C(n,k) * k)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, k;
char lit[25];
char a[25];
void bkt(int poz, int start) {
    if (poz == k) {
        for (int i = 0; i < k; i++) cout << a[i];
        cout << "\\n";
        return;
    }
    for (int i = start; i < n; i++) {
        a[poz] = lit[i];
        bkt(poz + 1, i + 1);
    }
}
int main() {
    string s; cin >> s >> k;
    n = (int)s.size();
    for (int i = 0; i < n; i++) lit[i] = s[i];
    sort(lit, lit + n);
    bkt(0, 0);
    return 0;
}
`,
    py: `import sys

def bkt(poz, start, lit, a, n, k, out):
    if poz == k:
        out.append(''.join(a))
        return
    for i in range(start, n):
        a.append(lit[i])
        bkt(poz + 1, i + 1, lit, a, n, k, out)
        a.pop()

data = sys.stdin.read().split()
s = data[0]
k = int(data[1])
lit = sorted(s)
n = len(lit)
out = []
bkt(0, 0, lit, [], n, k, out)
print('\\n'.join(out))
`,
    tests: ["abcd\n2", "abcde\n3", "xy\n1", "abc\n3", "edcba\n2"],
  },
  {
    slug: "bt-combinari-suma-data",
    title: "Combinari de k elemente din {1,...,n} cu suma data",
    difficulty: "medium",
    tags: ["backtracking", "combinari", "combinatorica", "proprietate"],
    statement: "Se citesc numerele naturale n, k si S. Generati, folosind metoda Backtracking, toate combinarile multimii {1,2,...,n} luate cate k pentru care suma elementelor este exact S, in ordine lexicografica.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n, k si S.",
    output_format: "Se afiseaza, cate una pe linie, in ordine lexicografica, toate combinarile de n luate cate k a caror suma este S. Daca nu exista niciuna, nu se afiseaza nimic.",
    constraints: "1 <= k <= n <= 20, 0 <= S <= 200",
    hints: "Generati combinarile ca de obicei (cu parametrul start pentru a evita duplicatele), mentinand suma partiala. Verificati suma == S abia cand combinarea are k elemente.",
    explanation: `${BT_NOTE} La fel ca la aranjamentele cu suma data, dar folosind schema de generare a combinarilor (cu parametrul start), astfel incat fiecare submultime sa fie testata o singura data.\n\n**Complexitate:** O(C(n,k) * k)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, k; long long S;
int a[25];
void bkt(int poz, int start, long long suma) {
    if (poz == k) {
        if (suma == S) {
            for (int i = 0; i < k; i++) cout << a[i] << (i + 1 < k ? ' ' : '\\n');
        }
        return;
    }
    for (int v = start; v <= n; v++) {
        a[poz] = v;
        bkt(poz + 1, v + 1, suma + v);
    }
}
int main() {
    cin >> n >> k >> S;
    bkt(0, 1, 0);
    return 0;
}
`,
    py: `def bkt(poz, start, suma, a, n, k, S, out):
    if poz == k:
        if suma == S:
            out.append(' '.join(map(str, a)))
        return
    for v in range(start, n + 1):
        a.append(v)
        bkt(poz + 1, v + 1, suma + v, a, n, k, S, out)
        a.pop()

n, k, S = map(int, input().split())
out = []
bkt(0, 1, 0, [], n, k, S, out)
print('\\n'.join(out))
`,
    tests: ["5 2 6", "6 3 10", "4 2 100", "5 1 3", "6 2 7"],
  },
  {
    slug: "bt-combinari-vector-dat",
    title: "Submultimi de dimensiune k ale unui vector dat",
    difficulty: "medium",
    tags: ["backtracking", "combinari", "combinatorica"],
    statement: "Se citesc un numar natural n, cele n numere intregi ale unui vector (nu neaparat distincte) si un numar natural k (k <= n). Generati, folosind metoda Backtracking, toate submultimile de k elemente ale vectorului, alegand pozitii (indici) strict crescatoare, in ordinea lexicografica a indicilor alesi.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere intregi ale vectorului. Pe a treia linie se citeste k.",
    output_format: "Se afiseaza, cate una pe linie, toate submultimile de k elemente ale vectorului, in ordinea lexicografica a indicilor alesi.",
    constraints: "1 <= k <= n <= 20, -1000 <= elemente <= 1000",
    hints: "Aplicati aceeasi schema de backtracking ca la combinarile numerice, dar alegeti indici (nu valori) in ordine strict crescatoare, si afisati valorile vectorului aflate la indicii alesi. Nu sortati vectorul: pozitiile trebuie pastrate in ordinea initiala.",
    explanation: `${BT_NOTE} Deosebirea fata de o combinare pe {1,...,n} este ca aici se aleg pozitii (indici) dintr-un vector oarecare, nu chiar valorile 1,2,...,n; vectorul poate contine si valori egale, dar pozitiile alese sunt intotdeauna distincte.\n\n**Complexitate:** O(C(n,k) * k)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, k;
long long v[25];
long long a[25];
void bkt(int poz, int start) {
    if (poz == k) {
        for (int i = 0; i < k; i++) cout << a[i] << (i + 1 < k ? ' ' : '\\n');
        return;
    }
    for (int i = start; i < n; i++) {
        a[poz] = v[i];
        bkt(poz + 1, i + 1);
    }
}
int main() {
    cin >> n;
    for (int i = 0; i < n; i++) cin >> v[i];
    cin >> k;
    bkt(0, 0);
    return 0;
}
`,
    py: `def bkt(poz, start, a, v, n, k, out):
    if poz == k:
        out.append(' '.join(map(str, a)))
        return
    for i in range(start, n):
        a.append(v[i])
        bkt(poz + 1, i + 1, a, v, n, k, out)
        a.pop()

n = int(input())
v = list(map(int, input().split()))
k = int(input())
out = []
bkt(0, 0, [], v, n, k, out)
print('\\n'.join(out))
`,
    tests: ["4\n5 3 3 8\n2", "3\n1 2 3\n2", "5\n9 8 7 6 5\n1", "4\n1 1 1 1\n2", "5\n10 20 30 40 50\n3"],
  },
  {
    slug: "bt-a-k-lea-subset",
    title: "Al k-lea subset in ordine lexicografica",
    difficulty: "hard",
    tags: ["backtracking", "combinari", "combinatorica", "eficienta"],
    statement: "Se citesc trei numere naturale n, p si k. Determinati, fara a genera efectiv toate combinarile, care este al k-lea subset (in ordine lexicografica, numerotat incepand de la 1, cu elementele in ordine crescatoare) de p elemente ale multimii {1,2,...,n}.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n, p si k (1 <= k <= C(n,p)).",
    output_format: "Se afiseaza cele p numere ale subsetului cautat, separate prin spatiu.",
    constraints: "1 <= p <= n <= 30, 1 <= k <= C(n,p)",
    hints: "Alegeti elementele subsetului unul cate unul. Pentru pozitia curenta, incercati candidatii c in ordine crescatoare incepand de la ultimul ales + 1; numarul C(n-c, pozitii_ramase) reprezinta cate subsete incep cu prefixul curent urmat de c. Daca k este cel mult acest numar, alegeti c; altfel scadeti acest numar din k si incercati urmatorul candidat.",
    explanation: `Tehnica de \"unranking\" pentru combinari (sistemul combinatorial de numeratie): la fiecare pas se decide, folosind numarul de combinari posibile C(n-c, r), daca subsetul cautat incepe cu elementul c sau daca trebuie incercat un candidat mai mare.\n\n**Complexitate:** O(p * n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long comb(int m, int r) {
    if (r < 0 || r > m) return 0;
    long long rez = 1;
    for (int j = 1; j <= r; j++) rez = rez * (m - r + j) / j;
    return rez;
}
int main() {
    int n, p; long long k;
    cin >> n >> p >> k;
    vector<int> rez;
    int a = 0;
    for (int i = 0; i < p; i++) {
        int c = a + 1;
        while (true) {
            long long cnt = comb(n - c, p - i - 1);
            if (k <= cnt) {
                rez.push_back(c);
                a = c;
                break;
            } else {
                k -= cnt;
                c++;
            }
        }
    }
    for (int i = 0; i < p; i++) cout << rez[i] << (i + 1 < p ? ' ' : '\\n');
    return 0;
}
`,
    py: `def comb(m, r):
    if r < 0 or r > m:
        return 0
    rez = 1
    for j in range(1, r + 1):
        rez = rez * (m - r + j) // j
    return rez

n, p, k = map(int, input().split())
rez = []
a = 0
for i in range(p):
    c = a + 1
    while True:
        cnt = comb(n - c, p - i - 1)
        if k <= cnt:
            rez.append(c)
            a = c
            break
        else:
            k -= cnt
            c += 1
print(' '.join(map(str, rez)))
`,
    tests: ["5 3 1", "5 3 10", "5 3 5", "6 2 1", "6 2 15"],
  },

  // ===================== D. PERMUTARI CU REPETITII (ANAGRAME) =====================
  {
    slug: "bt-anagrame-distincte",
    title: "Anagramele distincte ale unui cuvant",
    difficulty: "medium",
    tags: ["backtracking", "permutari-cu-repetitii", "anagrame", "combinatorica"],
    statement: "Se citeste un cuvant format din n litere mici (nu neaparat distincte). Generati, folosind metoda Backtracking, toate anagramele distincte ale cuvantului (toate rearanjarile posibile ale literelor, fiecare afisata o singura data), in ordine lexicografica.",
    input_format: "Se citeste un cuvant format din n litere mici ale alfabetului englez.",
    output_format: "Se afiseaza toate anagramele distincte ale cuvantului, cate una pe linie, in ordine lexicografica.",
    constraints: "1 <= n <= 8",
    hints: "Sortati literele cuvantului. La fiecare pas alegeti o litera dintre cele ramase, dar pentru a nu genera aceeasi anagrama de doua ori, nu alegeti o litera identica cu cea de dinaintea ei din vectorul sortat daca litera anterioara nu este deja folosita in solutia curenta (adica ambele provin din acelasi 'grup' de litere identice si trebuie folosite in ordine).",
    explanation: `${BT_NOTE} Cand cuvantul are litere repetate, backtrackingul \"naiv\" (ca la permutari) ar genera aceeasi anagrama de mai multe ori. Regula \"nu alege lit[i] daca lit[i]==lit[i-1] si lit[i-1] nu e inca folosita\" elimina duplicatele, pastrand pentru fiecare grup de litere identice ordinea de utilizare de la stanga la dreapta.\n\n**Complexitate:** O(n! * n) in cel mai defavorabil caz (litere distincte)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
char lit[10];
bool folosit[10];
char a[10];
void bkt(int poz) {
    if (poz == n) {
        for (int i = 0; i < n; i++) cout << a[i];
        cout << "\\n";
        return;
    }
    for (int i = 0; i < n; i++) {
        if (folosit[i]) continue;
        if (i > 0 && lit[i] == lit[i - 1] && !folosit[i - 1]) continue;
        folosit[i] = true;
        a[poz] = lit[i];
        bkt(poz + 1);
        folosit[i] = false;
    }
}
int main() {
    string s; cin >> s;
    n = (int)s.size();
    for (int i = 0; i < n; i++) lit[i] = s[i];
    sort(lit, lit + n);
    bkt(0);
    return 0;
}
`,
    py: `def bkt(poz, lit, folosit, a, n, out):
    if poz == n:
        out.append(''.join(a))
        return
    for i in range(n):
        if folosit[i]:
            continue
        if i > 0 and lit[i] == lit[i - 1] and not folosit[i - 1]:
            continue
        folosit[i] = True
        a.append(lit[i])
        bkt(poz + 1, lit, folosit, a, n, out)
        a.pop()
        folosit[i] = False

s = input().strip()
lit = sorted(s)
n = len(lit)
folosit = [False] * n
out = []
bkt(0, lit, folosit, [], n, out)
print('\\n'.join(out))
`,
    tests: ["a", "aa", "aab", "abc", "aba"],
  },
  {
    slug: "bt-numara-anagrame-distincte",
    title: "Numarul de anagrame distincte ale unui cuvant",
    difficulty: "medium",
    tags: ["backtracking", "permutari-cu-repetitii", "anagrame", "combinatorica", "numarare"],
    statement: "Se citeste un cuvant format din n litere mici (nu neaparat distincte). Determinati, folosind metoda Backtracking (fara a folosi formula cu factoriale), cate anagrame distincte are cuvantul.",
    input_format: "Se citeste un cuvant format din n litere mici ale alfabetului englez.",
    output_format: "Se afiseaza un singur numar: numarul de anagrame distincte ale cuvantului.",
    constraints: "1 <= n <= 10",
    hints: "Folositi acelasi backtracking ca la generarea anagramelor distincte, dar in loc sa afisati fiecare solutie completa, numarati-o.",
    explanation: `${BT_NOTE} Numararea se face exact prin aceeasi generare cu eliminarea duplicatelor ca la problema anterioara, doar ca in loc sa afisam fiecare anagrama o contorizam. Rezultatul coincide cu formula n! / (f1! * f2! * ... ), unde fi sunt frecventele literelor, dar aici este obtinut prin numarare directa.\n\n**Complexitate:** O(n! * n) in cel mai defavorabil caz`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
char lit[12];
bool folosit[12];
long long numar = 0;
void bkt(int poz) {
    if (poz == n) {
        numar++;
        return;
    }
    for (int i = 0; i < n; i++) {
        if (folosit[i]) continue;
        if (i > 0 && lit[i] == lit[i - 1] && !folosit[i - 1]) continue;
        folosit[i] = true;
        bkt(poz + 1);
        folosit[i] = false;
    }
}
int main() {
    string s; cin >> s;
    n = (int)s.size();
    for (int i = 0; i < n; i++) lit[i] = s[i];
    sort(lit, lit + n);
    bkt(0);
    cout << numar << "\\n";
    return 0;
}
`,
    py: `import sys

def bkt(poz, lit, folosit, n, stare):
    if poz == n:
        stare[0] += 1
        return
    for i in range(n):
        if folosit[i]:
            continue
        if i > 0 and lit[i] == lit[i - 1] and not folosit[i - 1]:
            continue
        folosit[i] = True
        bkt(poz + 1, lit, folosit, n, stare)
        folosit[i] = False

s = sys.stdin.readline().strip()
lit = sorted(s)
n = len(lit)
folosit = [False] * n
stare = [0]
bkt(0, lit, folosit, n, stare)
print(stare[0])
`,
    tests: ["a", "aab", "abcd", "aabb", "aaab"],
  },
  {
    slug: "bt-permutari-distincte-multiset-numeric",
    title: "Permutarile distincte ale unui multiset de numere",
    difficulty: "medium",
    tags: ["backtracking", "permutari-cu-repetitii", "combinatorica"],
    statement: "Se citesc un numar natural n si un vector cu n numere intregi, nu neaparat distincte. Generati, folosind metoda Backtracking, toate permutarile distincte ale acestor n numere (fara a repeta aceeasi permutare de mai multe ori), in ordine lexicografica.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere intregi.",
    output_format: "Se afiseaza toate permutarile distincte, cate una pe linie, in ordine lexicografica, cu elementele separate prin spatiu.",
    constraints: "1 <= n <= 8",
    hints: "Sortati vectorul, apoi aplicati aceeasi tehnica de eliminare a duplicatelor ca la anagrame: nu alegeti v[i] daca v[i]==v[i-1] si pozitia i-1 nu este inca folosita.",
    explanation: `${BT_NOTE} Aceeasi idee ca la anagramele unui cuvant cu litere repetate, aplicata unui vector oarecare de numere care poate contine valori egale.\n\n**Complexitate:** O(n! * n) in cel mai defavorabil caz`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
long long v[10];
bool folosit[10];
long long a[10];
void bkt(int poz) {
    if (poz == n) {
        for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\\n');
        return;
    }
    for (int i = 0; i < n; i++) {
        if (folosit[i]) continue;
        if (i > 0 && v[i] == v[i - 1] && !folosit[i - 1]) continue;
        folosit[i] = true;
        a[poz] = v[i];
        bkt(poz + 1);
        folosit[i] = false;
    }
}
int main() {
    cin >> n;
    for (int i = 0; i < n; i++) cin >> v[i];
    sort(v, v + n);
    bkt(0);
    return 0;
}
`,
    py: `def bkt(poz, v, folosit, a, n, out):
    if poz == n:
        out.append(' '.join(map(str, a)))
        return
    for i in range(n):
        if folosit[i]:
            continue
        if i > 0 and v[i] == v[i - 1] and not folosit[i - 1]:
            continue
        folosit[i] = True
        a.append(v[i])
        bkt(poz + 1, v, folosit, a, n, out)
        a.pop()
        folosit[i] = False

n = int(input())
v = sorted(map(int, input().split()))
folosit = [False] * n
out = []
bkt(0, v, folosit, [], n, out)
print('\\n'.join(out))
`,
    tests: ["3\n1 1 2", "2\n5 5", "4\n1 2 2 1", "1\n7", "3\n3 2 1"],
  },
  {
    slug: "bt-a-k-a-anagrama",
    title: "A k-a anagrama in ordine lexicografica",
    difficulty: "hard",
    tags: ["backtracking", "permutari-cu-repetitii", "anagrame", "combinatorica", "eficienta"],
    statement: "Se citesc un cuvant format din n litere mici (nu neaparat distincte) si un numar natural k. Determinati, fara a genera efectiv toate anagramele, care este a k-a anagrama distincta (in ordine lexicografica, numerotata incepand de la 1) a cuvantului dat.",
    input_format: "Pe prima linie se citeste cuvantul. Pe a doua linie se citeste numarul natural k.",
    output_format: "Se afiseaza a k-a anagrama distincta a cuvantului.",
    constraints: "1 <= n <= 12, 1 <= k <= numarul de anagrame distincte ale cuvantului",
    hints: "Pastrati frecventele literelor ramase. Pentru pozitia curenta, incercati literele in ordine alfabetica; pentru fiecare litera c cu frecventa disponibila, calculati cate anagrame incep cu prefixul curent urmat de c, folosind formula (lungime_ramasa-1)! / produsul factorialelor frecventelor ramase dupa alegerea lui c. Daca k este cel mult acest numar, alegeti litera c; altfel scadeti numarul din k si incercati litera urmatoare.",
    explanation: `Tehnica de \"unranking\" pentru permutari cu repetitii: la fiecare pozitie se decide ce litera se plaseaza numarand, pentru fiecare litera candidata (in ordine alfabetica), cate anagrame distincte incep cu prefixul format pana acum urmat de acea litera.\n\n**Complexitate:** O(n * 26) pentru fiecare pozitie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    long long k; cin >> k;
    int n = (int)s.size();
    int freq[26] = {0};
    for (char c : s) freq[c - 'a']++;
    vector<long long> fact(n + 1);
    fact[0] = 1;
    for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i;
    string rezultat = "";
    int ramase = n;
    for (int poz = 0; poz < n; poz++) {
        for (int c = 0; c < 26; c++) {
            if (freq[c] == 0) continue;
            freq[c]--;
            long long denom = 1;
            for (int j = 0; j < 26; j++) denom *= fact[freq[j]];
            long long cnt = fact[ramase - 1] / denom;
            if (k <= cnt) {
                rezultat += (char)('a' + c);
                ramase--;
                break;
            } else {
                k -= cnt;
                freq[c]++;
            }
        }
    }
    cout << rezultat << "\\n";
    return 0;
}
`,
    py: `s = input().strip()
k = int(input())
n = len(s)
freq = [0] * 26
for ch in s:
    freq[ord(ch) - 97] += 1
fact = [1] * (n + 1)
for i in range(1, n + 1):
    fact[i] = fact[i - 1] * i
rezultat = []
ramase = n
for poz in range(n):
    for c in range(26):
        if freq[c] == 0:
            continue
        freq[c] -= 1
        denom = 1
        for j in range(26):
            denom *= fact[freq[j]]
        cnt = fact[ramase - 1] // denom
        if k <= cnt:
            rezultat.append(chr(97 + c))
            ramase -= 1
            break
        else:
            k -= cnt
            freq[c] += 1
print(''.join(rezultat))
`,
    tests: ["aab\n1", "aab\n2", "aab\n3", "aabb\n4", "abc\n3"],
  },

  // ===================== E. PERMUTARI FARA PUNCTE FIXE (DERANJAMENTE) =====================
  {
    slug: "bt-deranjamente",
    title: "Generarea deranjamentelor multimii {1,...,n}",
    difficulty: "medium",
    tags: ["backtracking", "deranjamente", "combinatorica"],
    statement: "Se citeste un numar natural n. Generati, folosind metoda Backtracking, toate deranjamentele multimii {1,2,...,n}, adica toate permutarile in care niciun element nu ramane pe pozitia sa initiala (a[i] != i pentru orice pozitie i de la 1 la n), in ordine lexicografica.",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza toate deranjamentele multimii {1,...,n}, cate unul pe linie, in ordine lexicografica, cu elementele separate prin spatiu. Pentru n=1 nu exista niciun deranjament, deci nu se afiseaza nimic.",
    constraints: "1 <= n <= 9",
    hints: "Folositi acelasi backtracking ca la generarea permutarilor, dar la fiecare pozitie poz (numerotata de la 0) excludeti din alegeri valoarea poz+1, in plus fata de valorile deja folosite.",
    explanation: `${BT_NOTE} Singura diferenta fata de generarea permutarilor obisnuite este restrictia suplimentara a[poz] != poz+1, care garanteaza ca niciun element nu ramane pe pozitia initiala.\n\n**Complexitate:** O(n! * n) in cel mai defavorabil caz`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
int a[10];
bool folosit[10];
void bkt(int poz) {
    if (poz == n) {
        for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\\n');
        return;
    }
    for (int v = 1; v <= n; v++) {
        if (!folosit[v] && v != poz + 1) {
            folosit[v] = true;
            a[poz] = v;
            bkt(poz + 1);
            folosit[v] = false;
        }
    }
}
int main() {
    cin >> n;
    bkt(0);
    return 0;
}
`,
    py: `def bkt(poz, a, folosit, n, out):
    if poz == n:
        out.append(' '.join(map(str, a)))
        return
    for v in range(1, n + 1):
        if not folosit[v] and v != poz + 1:
            folosit[v] = True
            a.append(v)
            bkt(poz + 1, a, folosit, n, out)
            a.pop()
            folosit[v] = False

n = int(input())
folosit = [False] * (n + 1)
out = []
bkt(0, [], folosit, n, out)
print('\\n'.join(out))
`,
    tests: ["1", "2", "3", "4"],
  },
  {
    slug: "bt-numara-deranjamente",
    title: "Numarul de deranjamente ale multimii {1,...,n}",
    difficulty: "medium",
    tags: ["backtracking", "deranjamente", "combinatorica", "numarare"],
    statement: "Se citeste un numar natural n. Determinati, folosind metoda Backtracking (fara a folosi formula de recurenta D(n) = (n-1) * (D(n-1) + D(n-2))), numarul de deranjamente ale multimii {1,2,...,n}.",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza un singur numar: numarul de deranjamente ale multimii {1,...,n}.",
    constraints: "1 <= n <= 10",
    hints: "Folositi acelasi backtracking ca la generarea deranjamentelor, dar in loc sa afisati fiecare solutie completa, numarati-o.",
    explanation: `${BT_NOTE} Numararea foloseste exact aceeasi restrictie a[poz] != poz+1 ca la generare, dar contorizeaza solutiile complete in loc sa le afiseze.\n\n**Complexitate:** O(n! * n) in cel mai defavorabil caz`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
bool folosit[12];
long long numar = 0;
void bkt(int poz) {
    if (poz == n) {
        numar++;
        return;
    }
    for (int v = 1; v <= n; v++) {
        if (!folosit[v] && v != poz + 1) {
            folosit[v] = true;
            bkt(poz + 1);
            folosit[v] = false;
        }
    }
}
int main() {
    cin >> n;
    bkt(0);
    cout << numar << "\\n";
    return 0;
}
`,
    py: `import sys

def bkt(poz, folosit, n, stare):
    if poz == n:
        stare[0] += 1
        return
    for v in range(1, n + 1):
        if not folosit[v] and v != poz + 1:
            folosit[v] = True
            bkt(poz + 1, folosit, n, stare)
            folosit[v] = False

n = int(sys.stdin.readline())
folosit = [False] * (n + 1)
stare = [0]
bkt(0, folosit, n, stare)
print(stare[0])
`,
    tests: ["1", "2", "3", "4", "6"],
  },
  {
    slug: "bt-deranjament-vector-dat",
    title: "Deranjament al elementelor unui vector dat",
    difficulty: "medium",
    tags: ["backtracking", "deranjamente", "combinatorica"],
    statement: "Se citesc un numar natural n si un vector cu n numere intregi distincte. Generati, folosind metoda Backtracking, toate rearanjarile elementelor vectorului in care niciun element nu ramane pe pozitia sa initiala din vector, in ordine lexicografica (dupa valorile elementelor).",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere intregi ale vectorului, distincte doua cate doua.",
    output_format: "Se afiseaza toate rearanjarile-deranjament ale vectorului, cate una pe linie, in ordine lexicografica, cu elementele separate prin spatiu. Daca nu exista niciuna, nu se afiseaza nimic.",
    constraints: "1 <= n <= 9",
    hints: "Sortati valorile pentru a le incerca in ordine lexicografica, dar pastrati vectorul original v[] pentru a sti ce valoare este interzisa pe fiecare pozitie: pe pozitia poz nu poate aparea valoarea v[poz] (valoarea aflata initial acolo).",
    explanation: `${BT_NOTE} Fata de deranjamentele lui {1,...,n}, singura schimbare este ca valoarea interzisa pe pozitia poz nu mai este neaparat poz+1, ci exact v[poz] (valoarea initiala de pe acea pozitie in vectorul citit).\n\n**Complexitate:** O(n! * n) in cel mai defavorabil caz`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
long long v[10];
long long vs[10];
bool folosit[10];
long long a[10];
void bkt(int poz) {
    if (poz == n) {
        for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\\n');
        return;
    }
    for (int i = 0; i < n; i++) {
        if (!folosit[i] && vs[i] != v[poz]) {
            folosit[i] = true;
            a[poz] = vs[i];
            bkt(poz + 1);
            folosit[i] = false;
        }
    }
}
int main() {
    cin >> n;
    for (int i = 0; i < n; i++) { cin >> v[i]; vs[i] = v[i]; }
    sort(vs, vs + n);
    bkt(0);
    return 0;
}
`,
    py: `def bkt(poz, a, folosit, v, vs, n, out):
    if poz == n:
        out.append(' '.join(map(str, a)))
        return
    for i in range(n):
        if not folosit[i] and vs[i] != v[poz]:
            folosit[i] = True
            a.append(vs[i])
            bkt(poz + 1, a, folosit, v, vs, n, out)
            a.pop()
            folosit[i] = False

n = int(input())
v = list(map(int, input().split()))
vs = sorted(v)
folosit = [False] * n
out = []
bkt(0, [], folosit, v, vs, n, out)
print('\\n'.join(out))
`,
    tests: ["3\n1 2 3", "3\n3 1 2", "4\n1 2 3 4", "2\n5 9", "4\n4 3 2 1"],
  },
  {
    slug: "bt-al-k-lea-deranjament",
    title: "Al k-lea deranjament in ordine lexicografica",
    difficulty: "hard",
    tags: ["backtracking", "deranjamente", "combinatorica", "eficienta"],
    statement: "Se citesc doua numere naturale n si k. Determinati, folosind metoda Backtracking cu numarare (fara a genera si stoca efectiv toate deranjamentele), care este al k-lea deranjament (in ordine lexicografica, numerotat incepand de la 1) al multimii {1,2,...,n}.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si k.",
    output_format: "Se afiseaza cele n numere ale deranjamentului cautat, separate prin spatiu.",
    constraints: "2 <= n <= 12, 1 <= k <= D(n) (numarul de deranjamente ale multimii {1,...,n})",
    hints: "Pentru fiecare pozitie ramasa, incercati pe rand valorile disponibile (excluzand valoarea egala cu numarul pozitiei); pentru fiecare alegere, numarati cate deranjamente valide se pot completa pe pozitiile ramase folosind formula de numarare cu incluziune-excluziune Q(r,m) = suma (-1)^j * C(r,j) * (m-j)!, unde m este numarul de pozitii ramase si r este numarul dintre acestea ale caror valoare 'proprie' este inca disponibila. Comparati aceasta numaratoare cu k pentru a decide alegerea, la fel ca la problema 'al k-lea aranjament'.",
    explanation: `Formula Q(r,m) = sum_{j=0}^{r} (-1)^j C(r,j) (m-j)! numara permutarile a m elemente in care r pozitii \"restrictionate\" (fiecare cu cate o singura valoare proprie interzisa, distincta) nu isi primesc valoarea interzisa; este generalizarea directa a formulei clasice a deranjamentelor (cazul r=m). La fiecare pas al backtrackingului, se calculeaza acest numar pentru starea ramasa dupa o alegere tentativa si se compara cu k, exact ca la unranking-ul permutarilor si aranjamentelor.\n\n**Complexitate:** O(n^3)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long fact[15];
long long C(int a, int b) {
    if (b < 0 || b > a) return 0;
    long long rez = 1;
    for (int j = 1; j <= b; j++) rez = rez * (a - b + j) / j;
    return rez;
}
long long Q(int r, int m) {
    long long suma = 0;
    for (int j = 0; j <= r; j++) {
        long long term = C(r, j) * fact[m - j];
        if (j % 2 == 0) suma += term; else suma -= term;
    }
    return suma;
}
int main() {
    int n; long long k;
    cin >> n >> k;
    fact[0] = 1;
    for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i;
    vector<bool> folosit(n + 1, false);
    vector<int> rez(n);
    for (int poz = 0; poz < n; poz++) {
        for (int v = 1; v <= n; v++) {
            if (folosit[v] || v == poz + 1) continue;
            folosit[v] = true;
            int m2 = n - poz - 1;
            int r2 = 0;
            for (int p = poz + 1; p < n; p++) if (!folosit[p + 1]) r2++;
            long long cnt = Q(r2, m2);
            if (k <= cnt) {
                rez[poz] = v;
                break;
            } else {
                k -= cnt;
                folosit[v] = false;
            }
        }
    }
    for (int i = 0; i < n; i++) cout << rez[i] << (i + 1 < n ? ' ' : '\\n');
    return 0;
}
`,
    py: `def C(a, b):
    if b < 0 or b > a:
        return 0
    rez = 1
    for j in range(1, b + 1):
        rez = rez * (a - b + j) // j
    return rez

def Q(r, m, fact):
    suma = 0
    for j in range(r + 1):
        term = C(r, j) * fact[m - j]
        suma += term if j % 2 == 0 else -term
    return suma

n, k = map(int, input().split())
fact = [1] * (n + 1)
for i in range(1, n + 1):
    fact[i] = fact[i - 1] * i
folosit = [False] * (n + 1)
rez = [0] * n
for poz in range(n):
    for v in range(1, n + 1):
        if folosit[v] or v == poz + 1:
            continue
        folosit[v] = True
        m2 = n - poz - 1
        r2 = sum(1 for p in range(poz + 1, n) if not folosit[p + 1])
        cnt = Q(r2, m2, fact)
        if k <= cnt:
            rez[poz] = v
            break
        else:
            k -= cnt
            folosit[v] = False
print(' '.join(map(str, rez)))
`,
    tests: ["2 1", "3 1", "3 2", "4 1", "4 9"],
  },

  // ===================== F. COMBINARI CU REPETITII =====================
  {
    slug: "bt-combinari-repetitie",
    title: "Generarea combinarilor cu repetitie de n elemente luate cate k",
    difficulty: "medium",
    tags: ["backtracking", "combinari-cu-repetitie", "combinatorica"],
    statement: "Se citesc doua numere naturale n si k. Generati, folosind metoda Backtracking, toate combinarile cu repetitie ale multimii {1,2,...,n} luate cate k, adica toate secventele nedescrescatoare a[1] <= a[2] <= ... <= a[k] cu elemente din {1,...,n} (o valoare putand aparea de mai multe ori), in ordine lexicografica.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si k.",
    output_format: "Se afiseaza toate combinarile cu repetitie, cate una pe linie, in ordine lexicografica, cu elementele separate prin spatiu.",
    constraints: "1 <= n <= 10, 1 <= k <= 6",
    hints: "Ca la combinarile obisnuite folositi un parametru start, dar de data aceasta permiteti reluarea aceleiasi valori la pasul urmator: apelul recursiv continua cu start = v (nu v+1), pentru a pastra sirul nedescrescator si a permite repetitii.",
    explanation: `${BT_NOTE} Diferenta esentiala fata de combinarile fara repetitie este ca urmatorul apel recursiv porneste din nou de la valoarea curenta v (nu de la v+1), permitand aceleiasi valori sa fie aleasa de mai multe ori consecutiv.\n\n**Complexitate:** O(C(n+k-1,k) * k)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, k;
int a[10];
void bkt(int poz, int start) {
    if (poz == k) {
        for (int i = 0; i < k; i++) cout << a[i] << (i + 1 < k ? ' ' : '\\n');
        return;
    }
    for (int v = start; v <= n; v++) {
        a[poz] = v;
        bkt(poz + 1, v);
    }
}
int main() {
    cin >> n >> k;
    bkt(0, 1);
    return 0;
}
`,
    py: `def bkt(poz, start, a, n, k, out):
    if poz == k:
        out.append(' '.join(map(str, a)))
        return
    for v in range(start, n + 1):
        a.append(v)
        bkt(poz + 1, v, a, n, k, out)
        a.pop()

n, k = map(int, input().split())
out = []
bkt(0, 1, [], n, k, out)
print('\\n'.join(out))
`,
    tests: ["3 2", "2 3", "4 1", "3 3", "5 2"],
  },
  {
    slug: "bt-combinari-repetitie-litere",
    title: "Combinari cu repetitie de k litere dintr-un alfabet dat",
    difficulty: "medium",
    tags: ["backtracking", "combinari-cu-repetitie", "combinatorica", "siruri"],
    statement: "Se citeste un alfabet (un cuvant cu litere mici distincte) si un numar natural k. Generati, folosind metoda Backtracking, toate cuvintele de lungime k formate din litere ale alfabetului, alese in ordine nedescrescatoare (litera de pe fiecare pozitie este mai mare sau egala cu litera de pe pozitia anterioara), permitand repetarea literelor, in ordine lexicografica.",
    input_format: "Pe prima linie se citeste alfabetul. Pe a doua linie se citeste k.",
    output_format: "Se afiseaza toate cuvintele obtinute, cate unul pe linie, in ordine lexicografica.",
    constraints: "1 <= n <= 10, 1 <= k <= 6",
    hints: "Sortati alfabetul, apoi folositi aceeasi tehnica de la combinarile cu repetitie numerice: apelul recursiv urmator porneste din nou de la indexul literei curente, nu de la indexul urmator.",
    explanation: `${BT_NOTE} La fel ca la combinarile cu repetitie numerice, dar aplicat literelor alfabetului sortat.\n\n**Complexitate:** O(C(n+k-1,k) * k)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, k;
char lit[12];
char a[10];
void bkt(int poz, int start) {
    if (poz == k) {
        for (int i = 0; i < k; i++) cout << a[i];
        cout << "\\n";
        return;
    }
    for (int i = start; i < n; i++) {
        a[poz] = lit[i];
        bkt(poz + 1, i);
    }
}
int main() {
    string s; cin >> s >> k;
    n = (int)s.size();
    for (int i = 0; i < n; i++) lit[i] = s[i];
    sort(lit, lit + n);
    bkt(0, 0);
    return 0;
}
`,
    py: `import sys

def bkt(poz, start, lit, a, n, k, out):
    if poz == k:
        out.append(''.join(a))
        return
    for i in range(start, n):
        a.append(lit[i])
        bkt(poz + 1, i, lit, a, n, k, out)
        a.pop()

data = sys.stdin.read().split()
s = data[0]
k = int(data[1])
lit = sorted(s)
n = len(lit)
out = []
bkt(0, 0, lit, [], n, k, out)
print('\\n'.join(out))
`,
    tests: ["ab\n2", "abc\n2", "xy\n3", "abcd\n1", "ba\n2"],
  },
  {
    slug: "bt-combinari-repetitie-suma-data",
    title: "Combinari cu repetitie de k elemente din {1,...,n} cu suma data",
    difficulty: "medium",
    tags: ["backtracking", "combinari-cu-repetitie", "combinatorica", "proprietate"],
    statement: "Se citesc numerele naturale n, k si S. Generati, folosind metoda Backtracking, toate combinarile cu repetitie ale multimii {1,2,...,n} luate cate k pentru care suma elementelor este exact S, in ordine lexicografica.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n, k si S.",
    output_format: "Se afiseaza, cate una pe linie, in ordine lexicografica, toate combinarile cu repetitie de n luate cate k a caror suma este S. Daca nu exista niciuna, nu se afiseaza nimic.",
    constraints: "1 <= n <= 10, 1 <= k <= 6, 0 <= S <= 60",
    hints: "Generati combinarile cu repetitie ca de obicei, mentinand suma partiala. Verificati suma == S abia cand secventa are k elemente.",
    explanation: `${BT_NOTE} La fel ca la combinarile obisnuite cu suma data, dar folosind schema cu repetitie (start = v, nu v+1) pentru generarea secventelor nedescrescatoare.\n\n**Complexitate:** O(C(n+k-1,k) * k)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, k; long long S;
int a[10];
void bkt(int poz, int start, long long suma) {
    if (poz == k) {
        if (suma == S) {
            for (int i = 0; i < k; i++) cout << a[i] << (i + 1 < k ? ' ' : '\\n');
        }
        return;
    }
    for (int v = start; v <= n; v++) {
        a[poz] = v;
        bkt(poz + 1, v, suma + v);
    }
}
int main() {
    cin >> n >> k >> S;
    bkt(0, 1, 0);
    return 0;
}
`,
    py: `def bkt(poz, start, suma, a, n, k, S, out):
    if poz == k:
        if suma == S:
            out.append(' '.join(map(str, a)))
        return
    for v in range(start, n + 1):
        a.append(v)
        bkt(poz + 1, v, suma + v, a, n, k, S, out)
        a.pop()

n, k, S = map(int, input().split())
out = []
bkt(0, 1, 0, [], n, k, S, out)
print('\\n'.join(out))
`,
    tests: ["4 2 5", "3 3 6", "5 2 20", "4 1 3", "5 3 9"],
  },
  {
    slug: "bt-a-k-a-combinare-repetitie",
    title: "A k-a combinare cu repetitie in ordine lexicografica",
    difficulty: "hard",
    tags: ["backtracking", "combinari-cu-repetitie", "combinatorica", "eficienta"],
    statement: "Se citesc trei numere naturale n, p si k. Determinati, fara a genera efectiv toate combinarile cu repetitie, care este a k-a combinare cu repetitie (in ordine lexicografica, numerotata incepand de la 1) de p elemente ale multimii {1,2,...,n}, adica a k-a secventa nedescrescatoare a[1] <= a[2] <= ... <= a[p] cu elemente din {1,...,n}.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n, p si k (1 <= k <= C(n+p-1,p)).",
    output_format: "Se afiseaza cele p numere ale combinarii cu repetitie cautate, separate prin spatiu.",
    constraints: "1 <= n <= 15, 1 <= p <= 8, 1 <= k <= C(n+p-1,p)",
    hints: "Pentru fiecare pozitie, incercati candidatii c in ordine crescatoare, incepand de la ultima valoare aleasa (initial 1). Numarul de secvente nedescrescatoare ce urmeaza dupa alegerea lui c pentru pozitiile ramase este C((n-c)+r, r), unde r este numarul de pozitii ramase. Comparati acest numar cu k pentru a decide alegerea.",
    explanation: `Tehnica de \"unranking\" pentru combinari cu repetitie: numarul de moduri de a completa r pozitii ramase cu valori nedescrescatoare incepand de la c este C((n-c)+r, r) (o combinare cu repetitie de (n-c+1) valori posibile luate cate r).\n\n**Complexitate:** O(p * n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long comb(long long m, long long r) {
    if (r < 0 || m < 0 || r > m) return 0;
    long long rez = 1;
    for (long long j = 1; j <= r; j++) rez = rez * (m - r + j) / j;
    return rez;
}
int main() {
    int n, p; long long k;
    cin >> n >> p >> k;
    vector<int> rez;
    int start = 1;
    for (int i = 0; i < p; i++) {
        int c = start;
        while (true) {
            int r = p - i - 1;
            long long cnt = comb(n - c + r, r);
            if (k <= cnt) {
                rez.push_back(c);
                start = c;
                break;
            } else {
                k -= cnt;
                c++;
            }
        }
    }
    for (int i = 0; i < p; i++) cout << rez[i] << (i + 1 < p ? ' ' : '\\n');
    return 0;
}
`,
    py: `def comb(m, r):
    if r < 0 or m < 0 or r > m:
        return 0
    rez = 1
    for j in range(1, r + 1):
        rez = rez * (m - r + j) // j
    return rez

n, p, k = map(int, input().split())
rez = []
start = 1
for i in range(p):
    c = start
    while True:
        r = p - i - 1
        cnt = comb(n - c + r, r)
        if k <= cnt:
            rez.append(c)
            start = c
            break
        else:
            k -= cnt
            c += 1
print(' '.join(map(str, rez)))
`,
    tests: ["3 2 1", "3 2 6", "3 2 4", "4 3 1", "5 2 10"],
  },

  // ===================== G. ARANJAMENTE CU REPETITII (PRODUS CARTEZIAN) =====================
  {
    slug: "bt-produs-cartezian-baza",
    title: "Generarea secventelor de lungime k cu elemente din {1,...,n} (produs cartezian)",
    difficulty: "easy",
    tags: ["backtracking", "aranjamente-cu-repetitie", "produs-cartezian", "combinatorica"],
    statement: "Se citesc doua numere naturale n si k. Generati, folosind metoda Backtracking, toate secventele (aranjamente cu repetitie) de lungime k cu elemente din multimea {1,2,...,n}, in care aceeasi valoare poate aparea de mai multe ori pe pozitii diferite, in ordine lexicografica. In total exista n^k astfel de secvente.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si k.",
    output_format: "Se afiseaza toate cele n^k secvente, cate una pe linie, in ordine lexicografica, cu elementele separate prin spatiu.",
    constraints: "1 <= n <= 9, 1 <= k <= 6",
    hints: "La fiecare pozitie alegeti, in ordine crescatoare, orice valoare din {1,...,n}, indiferent daca a mai fost folosita pe pozitiile anterioare (spre deosebire de aranjamente, aici repetitia este permisa).",
    explanation: `${BT_NOTE} Spre deosebire de aranjamentele fara repetitie, aici nu exista niciun vector \"folosit[]\": orice valoare din {1,...,n} poate fi aleasa pe orice pozitie, indiferent de alegerile anterioare.\n\n**Complexitate:** O(n^k * k)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, k;
int a[10];
void bkt(int poz) {
    if (poz == k) {
        for (int i = 0; i < k; i++) cout << a[i] << (i + 1 < k ? ' ' : '\\n');
        return;
    }
    for (int v = 1; v <= n; v++) {
        a[poz] = v;
        bkt(poz + 1);
    }
}
int main() {
    cin >> n >> k;
    bkt(0);
    return 0;
}
`,
    py: `def bkt(poz, a, n, k, out):
    if poz == k:
        out.append(' '.join(map(str, a)))
        return
    for v in range(1, n + 1):
        a.append(v)
        bkt(poz + 1, a, n, k, out)
        a.pop()

n, k = map(int, input().split())
out = []
bkt(0, [], n, k, out)
print('\\n'.join(out))
`,
    tests: ["2 2", "3 2", "2 3", "4 1", "3 3"],
  },
  {
    slug: "bt-cuvinte-alfabet-lungime-k",
    title: "Toate cuvintele de lungime k peste un alfabet dat",
    difficulty: "easy",
    tags: ["backtracking", "aranjamente-cu-repetitie", "produs-cartezian", "combinatorica", "siruri"],
    statement: "Se citeste un alfabet (un cuvant cu litere mici distincte) si un numar natural k. Generati, folosind metoda Backtracking, toate cuvintele de lungime k ce se pot forma folosind literele alfabetului dat, cu posibilitatea repetarii oricarei litere, in ordine lexicografica.",
    input_format: "Pe prima linie se citeste alfabetul. Pe a doua linie se citeste k.",
    output_format: "Se afiseaza toate cuvintele obtinute, cate unul pe linie, in ordine lexicografica.",
    constraints: "1 <= n <= 9, 1 <= k <= 6",
    hints: "Sortati alfabetul. La fiecare pozitie alegeti orice litera din alfabet, in ordine, indiferent daca a mai fost folosita.",
    explanation: `${BT_NOTE} Ca la produsul cartezian numeric, dar peste alfabetul dat: fara vector de literele folosite, orice litera poate aparea de mai multe ori.\n\n**Complexitate:** O(n^k * k)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, k;
char lit[10];
char a[10];
void bkt(int poz) {
    if (poz == k) {
        for (int i = 0; i < k; i++) cout << a[i];
        cout << "\\n";
        return;
    }
    for (int i = 0; i < n; i++) {
        a[poz] = lit[i];
        bkt(poz + 1);
    }
}
int main() {
    string s; cin >> s >> k;
    n = (int)s.size();
    for (int i = 0; i < n; i++) lit[i] = s[i];
    sort(lit, lit + n);
    bkt(0);
    return 0;
}
`,
    py: `import sys

def bkt(poz, lit, a, n, k, out):
    if poz == k:
        out.append(''.join(a))
        return
    for i in range(n):
        a.append(lit[i])
        bkt(poz + 1, lit, a, n, k, out)
        a.pop()

data = sys.stdin.read().split()
s = data[0]
k = int(data[1])
lit = sorted(s)
n = len(lit)
out = []
bkt(0, lit, [], n, k, out)
print('\\n'.join(out))
`,
    tests: ["ab\n2", "abc\n2", "xy\n3", "a\n3", "cba\n2"],
  },
  {
    slug: "bt-produs-cartezian-multimi-diferite",
    title: "Produsul cartezian a m multimi diferite",
    difficulty: "medium",
    tags: ["backtracking", "aranjamente-cu-repetitie", "produs-cartezian", "combinatorica"],
    statement: "Se citeste un numar natural m (numarul de pozitii ale unui cod), apoi, pentru fiecare dintre cele m pozitii, cate un numar natural c (numarul de simboluri disponibile pe acea pozitie) urmat de cele c simboluri posibile (numere intregi), in ordinea in care trebuie incercate. Generati, folosind metoda Backtracking, toate codurile posibile (secvente de m simboluri, cate unul ales de pe fiecare pozitie dintre simbolurile disponibile pentru acea pozitie), in ordinea lexicografica indusa de ordinea simbolurilor citite pe fiecare pozitie.",
    input_format: "Pe prima linie se citeste m. Urmeaza m linii, cate una pentru fiecare pozitie: pe fiecare se citeste c (numarul de simboluri disponibile pe acea pozitie), apoi cele c simboluri.",
    output_format: "Se afiseaza toate codurile posibile, cate unul pe linie, cu simbolurile separate prin spatiu, in ordinea lexicografica indusa de ordinea simbolurilor citite pe fiecare pozitie.",
    constraints: "1 <= m <= 5, 1 <= c <= 5",
    hints: "Retineti pentru fiecare pozitie lista proprie de simboluri disponibile (un vector de vectori). La pozitia poz din backtracking, parcurgeti in ordine simbolurile din lista corespunzatoare pozitiei poz.",
    explanation: `${BT_NOTE} Generalizarea produsului cartezian la m multimi diferite (nu neaparat aceeasi multime {1,...,n} pe fiecare pozitie): fiecare pozitie are propria lista de simboluri, iar ordinea de generare respecta ordinea in care simbolurile au fost citite pentru pozitia respectiva.\n\n**Complexitate:** O((produsul lungimilor listelor) * m)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int m;
vector<vector<long long>> simboluri;
long long a[10];
void bkt(int poz) {
    if (poz == m) {
        for (int i = 0; i < m; i++) cout << a[i] << (i + 1 < m ? ' ' : '\\n');
        return;
    }
    for (long long s : simboluri[poz]) {
        a[poz] = s;
        bkt(poz + 1);
    }
}
int main() {
    cin >> m;
    simboluri.resize(m);
    for (int i = 0; i < m; i++) {
        int c; cin >> c;
        simboluri[i].resize(c);
        for (int j = 0; j < c; j++) cin >> simboluri[i][j];
    }
    bkt(0);
    return 0;
}
`,
    py: `import sys

def bkt(poz, simboluri, m, a, out):
    if poz == m:
        out.append(' '.join(map(str, a)))
        return
    for s in simboluri[poz]:
        a.append(s)
        bkt(poz + 1, simboluri, m, a, out)
        a.pop()

data = sys.stdin.read().split()
idx = 0
m = int(data[idx]); idx += 1
simboluri = []
for i in range(m):
    c = int(data[idx]); idx += 1
    vals = [int(data[idx + j]) for j in range(c)]
    idx += c
    simboluri.append(vals)
out = []
bkt(0, simboluri, m, [], out)
print('\\n'.join(out))
`,
    tests: [
      "2\n2 1 2\n3 5 6 7",
      "1\n3 9 8 7",
      "3\n2 0 1\n2 0 1\n2 0 1",
      "2\n1 4\n1 5",
      "2\n3 1 2 3\n2 10 20",
    ],
  },
  {
    slug: "bt-produs-cartezian-suma-data",
    title: "Secvente cu repetitie din {1,...,n} de lungime k cu suma data",
    difficulty: "medium",
    tags: ["backtracking", "aranjamente-cu-repetitie", "produs-cartezian", "combinatorica", "proprietate"],
    statement: "Se citesc numerele naturale n, k si S. Generati, folosind metoda Backtracking, toate secventele de lungime k cu elemente din multimea {1,2,...,n} (cu repetitii permise) pentru care suma elementelor este exact S, in ordine lexicografica.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n, k si S.",
    output_format: "Se afiseaza, cate una pe linie, in ordine lexicografica, toate secventele a caror suma este S. Daca nu exista niciuna, nu se afiseaza nimic.",
    constraints: "1 <= n <= 9, 1 <= k <= 6, 0 <= S <= 54",
    hints: "Generati secventele ca la produsul cartezian obisnuit, mentinand suma partiala. Verificati suma == S abia cand secventa are k elemente.",
    explanation: `${BT_NOTE} La fel ca la produsul cartezian de baza, dar cu verificarea sumei facuta doar in frunza recursiei.\n\n**Complexitate:** O(n^k * k)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, k; long long S;
int a[10];
void bkt(int poz, long long suma) {
    if (poz == k) {
        if (suma == S) {
            for (int i = 0; i < k; i++) cout << a[i] << (i + 1 < k ? ' ' : '\\n');
        }
        return;
    }
    for (int v = 1; v <= n; v++) {
        a[poz] = v;
        bkt(poz + 1, suma + v);
    }
}
int main() {
    cin >> n >> k >> S;
    bkt(0, 0);
    return 0;
}
`,
    py: `def bkt(poz, suma, a, n, k, S, out):
    if poz == k:
        if suma == S:
            out.append(' '.join(map(str, a)))
        return
    for v in range(1, n + 1):
        a.append(v)
        bkt(poz + 1, suma + v, a, n, k, S, out)
        a.pop()

n, k, S = map(int, input().split())
out = []
bkt(0, 0, [], n, k, S, out)
print('\\n'.join(out))
`,
    tests: ["3 2 4", "2 3 4", "4 2 5", "3 3 9", "2 2 2"],
  },
  {
    slug: "bt-a-k-lea-produs-cartezian",
    title: "Al k-lea element in ordine lexicografica al produsului cartezian",
    difficulty: "hard",
    tags: ["backtracking", "aranjamente-cu-repetitie", "produs-cartezian", "combinatorica", "eficienta"],
    statement: "Se citesc trei numere naturale n, p si k. Determinati, fara a genera efectiv toate secventele, care este a k-a secventa (in ordine lexicografica, numerotata incepand de la 1) de lungime p cu elemente din multimea {1,2,...,n}, cu repetitii permise.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n, p si k (1 <= k <= n^p).",
    output_format: "Se afiseaza cele p numere ale secventei cautate, separate prin spatiu.",
    constraints: "1 <= n <= 20, 1 <= p <= 15, 1 <= k <= n^p",
    hints: "Observati ca cele n^p secvente, in ordine lexicografica, corespund exact reprezentarii numerelor 0, 1, ..., n^p - 1 in baza n, cu exact p cifre (completate cu zerouri la stanga), citite de la cea mai semnificativa la cea mai putin semnificativa cifra; adunati 1 la fiecare cifra pentru a obtine valori din {1,...,n}.",
    explanation: `Aceasta este tehnica de \"unranking\" pentru produsul cartezian: scriem k-1 in baza n folosind exact p cifre. Este echivalent cu a extrage, prin impartiri si resturi succesive la n, cifrele numarului k-1 in baza n, de la cea mai putin semnificativa la cea mai semnificativa, apoi a le plasa in ordine inversa.\n\n**Complexitate:** O(p)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n, p, k;
    cin >> n >> p >> k;
    k--;
    vector<long long> rez(p);
    for (long long i = p - 1; i >= 0; i--) {
        rez[i] = k % n;
        k /= n;
    }
    for (int i = 0; i < p; i++) cout << (rez[i] + 1) << (i + 1 < p ? ' ' : '\\n');
    return 0;
}
`,
    py: `n, p, k = map(int, input().split())
k -= 1
rez = [0] * p
for i in range(p - 1, -1, -1):
    rez[i] = k % n
    k //= n
print(' '.join(str(x + 1) for x in rez))
`,
    tests: ["2 3 1", "2 3 8", "3 2 5", "3 2 1", "4 2 10"],
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
            "Sursa interna",
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
            "Sursa interna",
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
