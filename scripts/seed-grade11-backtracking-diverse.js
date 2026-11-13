const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade11", chapter: "backtracking", sub: "backtracking-diverse" };

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

const BT_NOTE = "Rezolvati problema obligatoriu prin metoda Backtracking: construiti solutia element cu element, iar atunci cand solutia partiala nu mai poate fi extinsa sau este completa, reveniti (backtrack) si incercati o alta alegere.";

const problems = [
  // ===================== A. PARTITIILE UNUI NUMAR =====================
  {
    slug: "bt-partitii-numar",
    title: "Partitiile unui numar",
    difficulty: "easy",
    tags: ["backtracking", "partitii", "combinatorica"],
    statement: "Se citeste un numar natural nenul n. Generati, folosind metoda Backtracking, toate partitiile lui n, adica toate modurile de a scrie n ca suma de numere naturale nenule, fara a tine cont de ordinea termenilor (o valoare poate aparea de mai multe ori in aceeasi partitie). Fiecare partitie se afiseaza cu termenii in ordine descrescatoare, de la cel mai mare la cel mai mic.",
    input_format: "Se citeste numarul natural nenul n.",
    output_format: "Se afiseaza toate partitiile lui n, cate una pe linie, cu termenii in ordine descrescatoare, separati prin spatiu. Partitiile se afiseaza incepand cu cea care are primul termen cel mai mare (partitia n insusi), in ordinea generata de backtracking descrisa in indicatii.",
    constraints: "1 <= n <= 20",
    hints: "Construiti partitia termen cu termen. La fiecare pas alegeti urmatorul termen intre 1 si minimul dintre (termenul anterior ales) si (suma ramasa de descompus), incercand valorile in ordine descrescatoare, pentru a nu genera aceeasi partitie de mai multe ori (o data ca 3+1 si o data ca 1+3).",
    explanation: `${BT_NOTE} Restrictia \"urmatorul termen <= termenul anterior\" garanteaza ca fiecare partitie este generata o singura data, cu termenii in ordine descrescatoare.\n\n**Complexitate:** O(p(n) * n), unde p(n) este numarul de partitii ale lui n`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<int> part;
void bkt(int ramas, int maxParte) {
    if (ramas == 0) {
        for (size_t i = 0; i < part.size(); i++) cout << part[i] << (i + 1 < part.size() ? ' ' : '\\n');
        return;
    }
    for (int p = min(maxParte, ramas); p >= 1; p--) {
        part.push_back(p);
        bkt(ramas - p, p);
        part.pop_back();
    }
}
int main() {
    int n; cin >> n;
    bkt(n, n);
    return 0;
}
`,
    py: `def bkt(ramas, maxParte, part, out):
    if ramas == 0:
        out.append(' '.join(map(str, part)))
        return
    for p in range(min(maxParte, ramas), 0, -1):
        part.append(p)
        bkt(ramas - p, p, part, out)
        part.pop()

n = int(input())
out = []
bkt(n, n, [], out)
print('\\n'.join(out))
`,
    tests: ["1", "2", "4", "5", "6"],
  },
  {
    slug: "bt-numara-partitii-numar",
    title: "Numarul de partitii ale unui numar",
    difficulty: "easy",
    tags: ["backtracking", "partitii", "combinatorica", "numarare"],
    statement: "Se citeste un numar natural nenul n. Determinati, folosind metoda Backtracking, numarul de partitii distincte ale lui n (numarul de moduri de a scrie n ca suma de numere naturale nenule, fara a tine cont de ordinea termenilor).",
    input_format: "Se citeste numarul natural nenul n.",
    output_format: "Se afiseaza un singur numar: numarul de partitii ale lui n.",
    constraints: "1 <= n <= 40",
    hints: "Folositi acelasi backtracking ca la generarea partitiilor, dar in loc sa afisati fiecare partitie completa, numarati-o.",
    explanation: `${BT_NOTE} Numararea foloseste exact aceeasi schema de generare (termen urmator <= termenul anterior), dar contorizeaza solutiile complete in loc sa le afiseze.\n\n**Complexitate:** O(p(n) * n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long numar = 0;
void bkt(int ramas, int maxParte) {
    if (ramas == 0) { numar++; return; }
    for (int p = min(maxParte, ramas); p >= 1; p--) {
        bkt(ramas - p, p);
    }
}
int main() {
    int n; cin >> n;
    bkt(n, n);
    cout << numar << "\\n";
    return 0;
}
`,
    py: `import sys

def bkt(ramas, maxParte, stare):
    if ramas == 0:
        stare[0] += 1
        return
    for p in range(min(maxParte, ramas), 0, -1):
        bkt(ramas - p, p, stare)

n = int(sys.stdin.readline())
stare = [0]
bkt(n, n, stare)
print(stare[0])
`,
    tests: ["1", "4", "10", "20", "30"],
  },
  {
    slug: "bt-partitii-parti-distincte",
    title: "Partitiile unui numar cu parti distincte",
    difficulty: "medium",
    tags: ["backtracking", "partitii", "combinatorica"],
    statement: "Se citeste un numar natural nenul n. Generati, folosind metoda Backtracking, toate partitiile lui n in care toate partile sunt distincte doua cate doua (nicio valoare nu se repeta), cu termenii afisati in ordine descrescatoare.",
    input_format: "Se citeste numarul natural nenul n.",
    output_format: "Se afiseaza toate partitiile cu parti distincte ale lui n, cate una pe linie, cu termenii in ordine descrescatoare, separati prin spatiu.",
    constraints: "1 <= n <= 25",
    hints: "Folositi aceeasi schema ca la partitiile obisnuite, dar urmatorul termen ales trebuie sa fie strict mai mic decat cel anterior (nu doar cel mult egal), pentru a garanta ca nicio valoare nu se repeta.",
    explanation: `${BT_NOTE} Diferenta fata de partitiile obisnuite este restrictia \"urmatorul termen < termenul anterior\" (strict), care elimina posibilitatea repetarii unei valori.\n\n**Complexitate:** O(q(n) * n), unde q(n) este numarul de partitii cu parti distincte ale lui n`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<int> part;
void bkt(int ramas, int maxParte) {
    if (ramas == 0) {
        for (size_t i = 0; i < part.size(); i++) cout << part[i] << (i + 1 < part.size() ? ' ' : '\\n');
        return;
    }
    for (int p = min(maxParte, ramas); p >= 1; p--) {
        part.push_back(p);
        bkt(ramas - p, p - 1);
        part.pop_back();
    }
}
int main() {
    int n; cin >> n;
    bkt(n, n);
    return 0;
}
`,
    py: `def bkt(ramas, maxParte, part, out):
    if ramas == 0:
        out.append(' '.join(map(str, part)))
        return
    for p in range(min(maxParte, ramas), 0, -1):
        part.append(p)
        bkt(ramas - p, p - 1, part, out)
        part.pop()

n = int(input())
out = []
bkt(n, n, [], out)
print('\\n'.join(out))
`,
    tests: ["1", "3", "6", "10", "15"],
  },
  {
    slug: "bt-numara-partitii-parti-distincte",
    title: "Numarul de partitii cu parti distincte",
    difficulty: "medium",
    tags: ["backtracking", "partitii", "combinatorica", "numarare"],
    statement: "Se citeste un numar natural nenul n. Determinati, folosind metoda Backtracking, numarul de partitii ale lui n in care toate partile sunt distincte doua cate doua.",
    input_format: "Se citeste numarul natural nenul n.",
    output_format: "Se afiseaza un singur numar: numarul de partitii cu parti distincte ale lui n.",
    constraints: "1 <= n <= 80",
    hints: "Folositi acelasi backtracking ca la generarea partitiilor cu parti distincte, dar numarati solutiile in loc sa le afisati.",
    explanation: `${BT_NOTE} Se numara solutiile complete obtinute cu restrictia \"urmatorul termen < termenul anterior\".\n\n**Complexitate:** O(q(n) * n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long numar = 0;
void bkt(int ramas, int maxParte) {
    if (ramas == 0) { numar++; return; }
    for (int p = min(maxParte, ramas); p >= 1; p--) {
        bkt(ramas - p, p - 1);
    }
}
int main() {
    int n; cin >> n;
    bkt(n, n);
    cout << numar << "\\n";
    return 0;
}
`,
    py: `import sys

def bkt(ramas, maxParte, stare):
    if ramas == 0:
        stare[0] += 1
        return
    for p in range(min(maxParte, ramas), 0, -1):
        bkt(ramas - p, p - 1, stare)

n = int(sys.stdin.readline())
stare = [0]
bkt(n, n, stare)
print(stare[0])
`,
    tests: ["1", "6", "20", "50", "80"],
  },
  {
    slug: "bt-partitii-exact-k-parti",
    title: "Partitiile unui numar in exact k parti",
    difficulty: "medium",
    tags: ["backtracking", "partitii", "combinatorica"],
    statement: "Se citesc doua numere naturale n si k (k <= n). Generati, folosind metoda Backtracking, toate partitiile lui n care au exact k termeni (numere naturale nenule, nu neaparat distincte), cu termenii afisati in ordine descrescatoare.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si k.",
    output_format: "Se afiseaza toate partitiile lui n cu exact k termeni, cate una pe linie, cu termenii in ordine descrescatoare, separati prin spatiu.",
    constraints: "1 <= k <= n <= 20",
    hints: "La fiecare pas, tineti cont de cate termeni mai trebuie alesi. Limita superioara pentru termenul curent trebuie sa fie astfel incat termenii ramasi (fiecare cel putin 1) sa poata completa suma: alegeti termenul curent intre 1 si min(termenul anterior, suma_ramasa - (numar_termeni_ramasi - 1)).",
    explanation: `${BT_NOTE} Limita superioara \"suma_ramasa - (numar_termeni_ramasi - 1)\" garanteaza ca vor mai ramane suficiente unitati pentru ca fiecare dintre termenii ramasi sa fie cel putin 1.\n\n**Complexitate:** O(p(n,k) * k), unde p(n,k) este numarul de partitii ale lui n in exact k parti`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<int> part;
void bkt(int ramas, int k, int maxParte) {
    if (k == 0) {
        if (ramas == 0) {
            for (size_t i = 0; i < part.size(); i++) cout << part[i] << (i + 1 < part.size() ? ' ' : '\\n');
        }
        return;
    }
    int limSus = min(maxParte, ramas - (k - 1));
    for (int p = limSus; p >= 1; p--) {
        part.push_back(p);
        bkt(ramas - p, k - 1, p);
        part.pop_back();
    }
}
int main() {
    int n, k; cin >> n >> k;
    bkt(n, k, n);
    return 0;
}
`,
    py: `def bkt(ramas, k, maxParte, part, out):
    if k == 0:
        if ramas == 0:
            out.append(' '.join(map(str, part)))
        return
    limSus = min(maxParte, ramas - (k - 1))
    for p in range(limSus, 0, -1):
        part.append(p)
        bkt(ramas - p, k - 1, p, part, out)
        part.pop()

n, k = map(int, input().split())
out = []
bkt(n, k, n, [], out)
print('\\n'.join(out))
`,
    tests: ["6 2", "6 3", "10 4", "5 1", "8 3"],
  },
  {
    slug: "bt-partitii-parti-impare",
    title: "Partitiile unui numar in parti impare",
    difficulty: "medium",
    tags: ["backtracking", "partitii", "combinatorica"],
    statement: "Se citeste un numar natural nenul n. Generati, folosind metoda Backtracking, toate partitiile lui n in care toate partile sunt numere impare (o valoare impara poate aparea de mai multe ori), cu termenii afisati in ordine descrescatoare.",
    input_format: "Se citeste numarul natural nenul n.",
    output_format: "Se afiseaza toate partitiile in parti impare ale lui n, cate una pe linie, cu termenii in ordine descrescatoare, separati prin spatiu.",
    constraints: "1 <= n <= 25",
    hints: "Folositi aceeasi schema ca la partitiile obisnuite, dar alegeti la fiecare pas doar valori impare, cel mult egale cu termenul anterior.",
    explanation: `${BT_NOTE} O curiozitate: conform unei teoreme a lui Euler, numarul de partitii ale lui n in parti impare este mereu egal cu numarul de partitii ale lui n in parti distincte (vezi problema \"Partitiile unui numar cu parti distincte\") — desi partitiile insele sunt, in general, complet diferite.\n\n**Complexitate:** O(q(n) * n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<int> part;
void bkt(int ramas, int maxParte) {
    if (ramas == 0) {
        for (size_t i = 0; i < part.size(); i++) cout << part[i] << (i + 1 < part.size() ? ' ' : '\\n');
        return;
    }
    int limSus = min(maxParte, ramas);
    if (limSus % 2 == 0) limSus--;
    for (int p = limSus; p >= 1; p -= 2) {
        part.push_back(p);
        bkt(ramas - p, p);
        part.pop_back();
    }
}
int main() {
    int n; cin >> n;
    bkt(n, n);
    return 0;
}
`,
    py: `def bkt(ramas, maxParte, part, out):
    if ramas == 0:
        out.append(' '.join(map(str, part)))
        return
    limSus = min(maxParte, ramas)
    if limSus % 2 == 0:
        limSus -= 1
    for p in range(limSus, 0, -2):
        part.append(p)
        bkt(ramas - p, p, part, out)
        part.pop()

n = int(input())
out = []
bkt(n, n, [], out)
print('\\n'.join(out))
`,
    tests: ["1", "4", "7", "10", "15"],
  },
  {
    slug: "bt-partitii-parte-maxima",
    title: "Partitiile unui numar cu partile marginite superior",
    difficulty: "medium",
    tags: ["backtracking", "partitii", "combinatorica"],
    statement: "Se citesc doua numere naturale n si M. Generati, folosind metoda Backtracking, toate partitiile lui n in care fiecare parte este cel mult M, cu termenii afisati in ordine descrescatoare.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si M.",
    output_format: "Se afiseaza toate partitiile lui n cu partile cel mult M, cate una pe linie, cu termenii in ordine descrescatoare, separati prin spatiu.",
    constraints: "1 <= n <= 25, 1 <= M <= n",
    hints: "Folositi exact aceeasi schema ca la generarea partitiilor obisnuite, dar porniti cu limita superioara initiala min(n, M) in loc de n.",
    explanation: `${BT_NOTE} Singura schimbare fata de generarea partitiilor de baza este limita superioara initiala a primului termen, care devine min(n, M).\n\n**Complexitate:** O(p(n,M) * n), unde p(n,M) este numarul de partitii ale lui n cu partile cel mult M`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<int> part;
void bkt(int ramas, int maxParte) {
    if (ramas == 0) {
        for (size_t i = 0; i < part.size(); i++) cout << part[i] << (i + 1 < part.size() ? ' ' : '\\n');
        return;
    }
    for (int p = min(maxParte, ramas); p >= 1; p--) {
        part.push_back(p);
        bkt(ramas - p, p);
        part.pop_back();
    }
}
int main() {
    int n, M; cin >> n >> M;
    bkt(n, min(n, M));
    return 0;
}
`,
    py: `def bkt(ramas, maxParte, part, out):
    if ramas == 0:
        out.append(' '.join(map(str, part)))
        return
    for p in range(min(maxParte, ramas), 0, -1):
        part.append(p)
        bkt(ramas - p, p, part, out)
        part.pop()

n, M = map(int, input().split())
out = []
bkt(n, min(n, M), [], out)
print('\\n'.join(out))
`,
    tests: ["6 3", "6 2", "10 4", "5 5", "8 1"],
  },
  {
    slug: "bt-numara-partitii-exact-k-parti",
    title: "Numarul de partitii ale unui numar in exact k parti",
    difficulty: "hard",
    tags: ["backtracking", "partitii", "combinatorica", "numarare"],
    statement: "Se citesc doua numere naturale n si k (k <= n). Determinati, folosind metoda Backtracking, numarul de partitii ale lui n care au exact k termeni.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si k.",
    output_format: "Se afiseaza un singur numar: numarul de partitii ale lui n cu exact k termeni.",
    constraints: "1 <= k <= n <= 40",
    hints: "Folositi acelasi backtracking ca la generarea partitiilor cu exact k termeni, dar numarati solutiile complete in loc sa le afisati.",
    explanation: `${BT_NOTE} Se numara solutiile complete obtinute cu restrictiile de la problema de generare (numar fix de termeni, fiecare cel mult egal cu precedentul).\n\n**Complexitate:** O(p(n,k) * k)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long numar = 0;
void bkt(int ramas, int k, int maxParte) {
    if (k == 0) {
        if (ramas == 0) numar++;
        return;
    }
    int limSus = min(maxParte, ramas - (k - 1));
    for (int p = limSus; p >= 1; p--) {
        bkt(ramas - p, k - 1, p);
    }
}
int main() {
    int n, k; cin >> n >> k;
    bkt(n, k, n);
    cout << numar << "\\n";
    return 0;
}
`,
    py: `import sys

def bkt(ramas, k, maxParte, stare):
    if k == 0:
        if ramas == 0:
            stare[0] += 1
        return
    limSus = min(maxParte, ramas - (k - 1))
    for p in range(limSus, 0, -1):
        bkt(ramas - p, k - 1, p, stare)

n, k = map(int, sys.stdin.readline().split())
stare = [0]
bkt(n, k, n, stare)
print(stare[0])
`,
    tests: ["10 3", "20 5", "30 4", "15 1", "40 6"],
  },

  // ===================== B. PARTITIILE UNEI MULTIMI =====================
  {
    slug: "bt-partitii-multime",
    title: "Partitiile unei multimi",
    difficulty: "medium",
    tags: ["backtracking", "partitii-multime", "combinatorica"],
    statement: "Se citeste un numar natural n. Generati, folosind metoda Backtracking, toate partitiile multimii {1,2,...,n}, adica toate modurile de a imparti multimea in submultimi nevide, disjuncte doua cate doua, a caror reuniune este multimea intreaga.",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza toate partitiile multimii {1,...,n}, cate una pe linie. Fiecare partitie se afiseaza ca lista submultimilor ei (elementele fiecarei submultimi separate prin spatiu), submultimile fiind separate intre ele prin ' | '.",
    constraints: "1 <= n <= 8",
    hints: "Asociati fiecarui element i (in ordine, de la 1 la n) o eticheta de grup b[i], numerotata de la 0. Pentru a genera fiecare partitie o singura data, element i poate primi orice eticheta deja folosita de un element anterior, sau eticheta imediat urmatoare (una noua), niciodata o eticheta mai mare. Aceasta tehnica se numeste 'sir de crestere restransa'.",
    explanation: `${BT_NOTE} Tehnica sirului de crestere restransa (fiecare element primeste eticheta unui grup existent sau incepe un grup nou, cu eticheta = numarul curent de grupuri) garanteaza ca fiecare partitie a multimii este generata exact o singura data, cu submultimile ordonate dupa cel mai mic element al lor.\n\n**Complexitate:** O(B(n) * n), unde B(n) este numarul lui Bell`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
int b[10];
void afiseaza(int maxB) {
    for (int g = 0; g <= maxB; g++) {
        bool prim = true;
        for (int i = 0; i < n; i++) {
            if (b[i] == g) {
                if (!prim) cout << ' ';
                cout << (i + 1);
                prim = false;
            }
        }
        if (g < maxB) cout << " | ";
    }
    cout << "\\n";
}
void bkt(int poz, int maxCurent) {
    if (poz == n) { afiseaza(maxCurent); return; }
    for (int g = 0; g <= maxCurent + 1; g++) {
        b[poz] = g;
        bkt(poz + 1, max(maxCurent, g));
    }
}
int main() {
    cin >> n;
    bkt(0, -1);
    return 0;
}
`,
    py: `def afiseaza(b, n, maxB, out):
    parti = []
    for g in range(maxB + 1):
        elems = [str(i + 1) for i in range(n) if b[i] == g]
        parti.append(' '.join(elems))
    out.append(' | '.join(parti))

def bkt(poz, maxCurent, b, n, out):
    if poz == n:
        afiseaza(b, n, maxCurent, out)
        return
    for g in range(maxCurent + 2):
        b[poz] = g
        bkt(poz + 1, max(maxCurent, g), b, n, out)

n = int(input())
b = [0] * n
out = []
bkt(0, -1, b, n, out)
print('\\n'.join(out))
`,
    tests: ["1", "2", "3", "4", "5"],
  },
  {
    slug: "bt-numara-partitii-multime",
    title: "Numarul de partitii ale unei multimi",
    difficulty: "medium",
    tags: ["backtracking", "partitii-multime", "combinatorica", "numarare"],
    statement: "Se citeste un numar natural n. Determinati, folosind metoda Backtracking, numarul de partitii ale multimii {1,2,...,n} in submultimi nevide (numarul lui Bell, B(n)).",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza un singur numar: numarul de partitii ale multimii {1,...,n}.",
    constraints: "1 <= n <= 10",
    hints: "Folositi acelasi backtracking cu sir de crestere restransa ca la generarea partitiilor unei multimi, dar numarati solutiile complete in loc sa le afisati.",
    explanation: `${BT_NOTE} Se numara solutiile complete obtinute cu tehnica sirului de crestere restransa.\n\n**Complexitate:** O(B(n) * n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long numar = 0;
void bkt(int poz, int maxCurent, int n) {
    if (poz == n) { numar++; return; }
    for (int g = 0; g <= maxCurent + 1; g++) {
        bkt(poz + 1, max(maxCurent, g), n);
    }
}
int main() {
    int n; cin >> n;
    bkt(0, -1, n);
    cout << numar << "\\n";
    return 0;
}
`,
    py: `import sys

def bkt(poz, maxCurent, n, stare):
    if poz == n:
        stare[0] += 1
        return
    for g in range(maxCurent + 2):
        bkt(poz + 1, max(maxCurent, g), n, stare)

n = int(sys.stdin.readline())
stare = [0]
bkt(0, -1, n, stare)
print(stare[0])
`,
    tests: ["1", "4", "7", "9", "10"],
  },
  {
    slug: "bt-partitii-multime-exact-k-blocuri",
    title: "Partitiile unei multimi in exact k submultimi",
    difficulty: "medium",
    tags: ["backtracking", "partitii-multime", "combinatorica"],
    statement: "Se citesc doua numere naturale n si k (k <= n). Generati, folosind metoda Backtracking, toate partitiile multimii {1,2,...,n} formate din exact k submultimi nevide.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si k.",
    output_format: "Se afiseaza toate partitiile multimii {1,...,n} in exact k submultimi, cate una pe linie, in acelasi format ca la problema 'Partitiile unei multimi'.",
    constraints: "1 <= k <= n <= 8",
    hints: "Folositi tehnica sirului de crestere restransa, dar limitati eticheta maxima permisa la k-1 (pentru a nu depasi k grupuri) si, la finalul construirii, pastrati partitia doar daca s-au folosit exact k grupuri (nu mai putine).",
    explanation: `${BT_NOTE} Marginirea etichetelor la valori din intervalul [0, k-1] garanteaza cel mult k submultimi; verificarea finala (numarul de grupuri folosite efectiv == k) elimina partitiile cu mai putin de k submultimi.\n\n**Complexitate:** O(S(n,k) * n), unde S(n,k) este numarul lui Stirling de speta a doua`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, k;
int b[10];
void afiseaza(int maxB) {
    for (int g = 0; g <= maxB; g++) {
        bool prim = true;
        for (int i = 0; i < n; i++) if (b[i] == g) { if (!prim) cout << ' '; cout << (i + 1); prim = false; }
        if (g < maxB) cout << " | ";
    }
    cout << "\\n";
}
void bkt(int poz, int maxCurent) {
    if (poz == n) {
        if (maxCurent + 1 == k) afiseaza(maxCurent);
        return;
    }
    int limSus = min(maxCurent + 1, k - 1);
    for (int g = 0; g <= limSus; g++) {
        b[poz] = g;
        bkt(poz + 1, max(maxCurent, g));
    }
}
int main() {
    cin >> n >> k;
    bkt(0, -1);
    return 0;
}
`,
    py: `def afiseaza(b, n, maxB, out):
    parti = []
    for g in range(maxB + 1):
        elems = [str(i + 1) for i in range(n) if b[i] == g]
        parti.append(' '.join(elems))
    out.append(' | '.join(parti))

def bkt(poz, maxCurent, b, n, k, out):
    if poz == n:
        if maxCurent + 1 == k:
            afiseaza(b, n, maxCurent, out)
        return
    limSus = min(maxCurent + 1, k - 1)
    for g in range(limSus + 1):
        b[poz] = g
        bkt(poz + 1, max(maxCurent, g), b, n, k, out)

n, k = map(int, input().split())
b = [0] * n
out = []
bkt(0, -1, b, n, k, out)
print('\\n'.join(out))
`,
    tests: ["3 2", "4 2", "5 3", "4 1", "4 4"],
  },
  {
    slug: "bt-numara-partitii-multime-exact-k-blocuri",
    title: "Numarul de partitii ale unei multimi in exact k submultimi",
    difficulty: "hard",
    tags: ["backtracking", "partitii-multime", "combinatorica", "numarare"],
    statement: "Se citesc doua numere naturale n si k (k <= n). Determinati, folosind metoda Backtracking, numarul de partitii ale multimii {1,2,...,n} formate din exact k submultimi nevide (numarul lui Stirling de speta a doua, S(n,k)).",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si k.",
    output_format: "Se afiseaza un singur numar: numarul de partitii ale multimii {1,...,n} in exact k submultimi.",
    constraints: "1 <= k <= n <= 10",
    hints: "Folositi acelasi backtracking ca la generarea partitiilor in exact k submultimi, dar numarati solutiile complete in loc sa le afisati.",
    explanation: `${BT_NOTE} Se numara solutiile complete obtinute cu tehnica sirului de crestere restransa marginit la k etichete.\n\n**Complexitate:** O(S(n,k) * n)`,
    time_limit_ms: 3000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, k;
long long numar = 0;
void bkt(int poz, int maxCurent) {
    if (poz == n) {
        if (maxCurent + 1 == k) numar++;
        return;
    }
    int limSus = min(maxCurent + 1, k - 1);
    for (int g = 0; g <= limSus; g++) {
        bkt(poz + 1, max(maxCurent, g));
    }
}
int main() {
    cin >> n >> k;
    bkt(0, -1);
    cout << numar << "\\n";
    return 0;
}
`,
    py: `import sys

def bkt(poz, maxCurent, n, k, stare):
    if poz == n:
        if maxCurent + 1 == k:
            stare[0] += 1
        return
    limSus = min(maxCurent + 1, k - 1)
    for g in range(limSus + 1):
        bkt(poz + 1, max(maxCurent, g), n, k, stare)

n, k = map(int, sys.stdin.readline().split())
stare = [0]
bkt(0, -1, n, k, stare)
print(stare[0])
`,
    tests: ["5 2", "6 3", "8 4", "9 3", "10 5"],
  },
  {
    slug: "bt-partitii-multime-litere",
    title: "Partitiile unei multimi de litere",
    difficulty: "medium",
    tags: ["backtracking", "partitii-multime", "combinatorica", "siruri"],
    statement: "Se citeste un cuvant cu litere mici, distincte doua cate doua, reprezentand elementele unei multimi. Generati, folosind metoda Backtracking, toate partitiile acestei multimi de litere in submultimi nevide.",
    input_format: "Se citeste un cuvant cu litere mici, distincte.",
    output_format: "Se afiseaza toate partitiile multimii de litere, cate una pe linie, in acelasi format ca la problema 'Partitiile unei multimi' (submultimile separate prin ' | ', literele din fiecare submultime separate prin spatiu).",
    constraints: "1 <= n <= 8 (n = numarul de litere)",
    hints: "Aplicati exact aceeasi tehnica a sirului de crestere restransa ca la partitiile lui {1,...,n}, dar la afisare inlocuiti indicele i+1 cu litera de pe pozitia i din cuvantul citit.",
    explanation: `${BT_NOTE} Tehnica este identica cu cea folosita pentru multimea {1,...,n}; singura schimbare este eticheta afisata pentru fiecare element (litera in loc de numarul de ordine).\n\n**Complexitate:** O(B(n) * n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
string s;
int b[10];
void afiseaza(int maxB) {
    for (int g = 0; g <= maxB; g++) {
        bool prim = true;
        for (int i = 0; i < n; i++) if (b[i] == g) { if (!prim) cout << ' '; cout << s[i]; prim = false; }
        if (g < maxB) cout << " | ";
    }
    cout << "\\n";
}
void bkt(int poz, int maxCurent) {
    if (poz == n) { afiseaza(maxCurent); return; }
    for (int g = 0; g <= maxCurent + 1; g++) {
        b[poz] = g;
        bkt(poz + 1, max(maxCurent, g));
    }
}
int main() {
    cin >> s;
    n = (int)s.size();
    bkt(0, -1);
    return 0;
}
`,
    py: `def afiseaza(b, s, n, maxB, out):
    parti = []
    for g in range(maxB + 1):
        elems = [s[i] for i in range(n) if b[i] == g]
        parti.append(' '.join(elems))
    out.append(' | '.join(parti))

def bkt(poz, maxCurent, b, s, n, out):
    if poz == n:
        afiseaza(b, s, n, maxCurent, out)
        return
    for g in range(maxCurent + 2):
        b[poz] = g
        bkt(poz + 1, max(maxCurent, g), b, s, n, out)

s = input().strip()
n = len(s)
b = [0] * n
out = []
bkt(0, -1, b, s, n, out)
print('\\n'.join(out))
`,
    tests: ["a", "ab", "abc", "wxyz", "abcde"],
  },
  {
    slug: "bt-partitii-multime-blocuri-dimensiune-fixa",
    title: "Partitiile unei multimi in submultimi de dimensiune fixa",
    difficulty: "hard",
    tags: ["backtracking", "partitii-multime", "combinatorica"],
    statement: "Se citesc doua numere naturale n si s, cu n multiplu de s. Generati, folosind metoda Backtracking, toate partitiile multimii {1,2,...,n} in submultimi nevide, fiecare avand exact s elemente.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si s (n multiplu de s).",
    output_format: "Se afiseaza toate partitiile in submultimi de dimensiune s, cate una pe linie, in acelasi format ca la problema 'Partitiile unei multimi'.",
    constraints: "1 <= s <= n <= 9, n multiplu de s",
    hints: "Folositi tehnica sirului de crestere restransa, dar interziceti alaturarea unui element la un grup care are deja s elemente. La final, pastrati partitia doar daca s-au format exact n/s grupuri (garantand ca toate au dimensiunea exacta s).",
    explanation: `${BT_NOTE} Limitarea dimensiunii fiecarui grup la cel mult s elemente, combinata cu verificarea finala a numarului total de grupuri (n/s), garanteaza ca toate submultimile din partitiile afisate au exact s elemente.\n\n**Complexitate:** O(numarul de astfel de partitii * n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, s;
int b[9];
int marime[9];
void afiseaza(int maxB) {
    for (int g = 0; g <= maxB; g++) {
        bool prim = true;
        for (int i = 0; i < n; i++) if (b[i] == g) { if (!prim) cout << ' '; cout << (i + 1); prim = false; }
        if (g < maxB) cout << " | ";
    }
    cout << "\\n";
}
void bkt(int poz, int maxCurent) {
    if (poz == n) {
        if (maxCurent + 1 == n / s) afiseaza(maxCurent);
        return;
    }
    int limSus = maxCurent + 1;
    for (int g = 0; g <= limSus; g++) {
        if (g <= maxCurent && marime[g] == s) continue;
        b[poz] = g;
        marime[g]++;
        bkt(poz + 1, max(maxCurent, g));
        marime[g]--;
    }
}
int main() {
    cin >> n >> s;
    bkt(0, -1);
    return 0;
}
`,
    py: `def afiseaza(b, n, maxB, out):
    parti = []
    for g in range(maxB + 1):
        elems = [str(i + 1) for i in range(n) if b[i] == g]
        parti.append(' '.join(elems))
    out.append(' | '.join(parti))

def bkt(poz, maxCurent, b, marime, n, s, out):
    if poz == n:
        if maxCurent + 1 == n // s:
            afiseaza(b, n, maxCurent, out)
        return
    limSus = maxCurent + 1
    for g in range(limSus + 1):
        if g <= maxCurent and marime[g] == s:
            continue
        b[poz] = g
        marime[g] += 1
        bkt(poz + 1, max(maxCurent, g), b, marime, n, s, out)
        marime[g] -= 1

n, s = map(int, input().split())
b = [0] * n
marime = [0] * n
out = []
bkt(0, -1, b, marime, n, s, out)
print('\\n'.join(out))
`,
    tests: ["4 2", "6 2", "6 3", "4 1", "4 4"],
  },

  // ===================== C. PROBLEMA PARANTEZELOR =====================
  {
    slug: "bt-paranteze-balansate",
    title: "Generarea secventelor de paranteze balansate",
    difficulty: "easy",
    tags: ["backtracking", "paranteze", "combinatorica"],
    statement: "Se citeste un numar natural nenul n. Generati, folosind metoda Backtracking, toate secventele corecte (balansate) formate din n perechi de paranteze rotunde, in ordine lexicografica.",
    input_format: "Se citeste numarul natural nenul n.",
    output_format: "Se afiseaza toate secventele balansate de n perechi de paranteze, cate una pe linie, in ordine lexicografica.",
    constraints: "1 <= n <= 10",
    hints: "Construiti secventa caracter cu caracter, retinand cate paranteze deschise si cate inchise ati folosit pana acum. Puteti adauga o paranteza deschisa daca nu ati folosit inca toate cele n, si puteti adauga o paranteza inchisa doar daca numarul de paranteze inchise este strict mai mic decat numarul celor deschise.",
    explanation: `${BT_NOTE} Incercarea parantezei deschise inaintea celei inchise la fiecare pas garanteaza generarea in ordine lexicografica (deoarece '(' < ')' in ordinea caracterelor). Restrictia \"inchise < deschise\" garanteaza ca secventa ramane mereu valida (nu se inchide o paranteza care nu a fost deschisa).\n\n**Complexitate:** O(Catalan(n) * n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
string cur;
void bkt(int deschise, int inchise) {
    if ((int)cur.size() == 2 * n) {
        cout << cur << "\\n";
        return;
    }
    if (deschise < n) {
        cur.push_back('(');
        bkt(deschise + 1, inchise);
        cur.pop_back();
    }
    if (inchise < deschise) {
        cur.push_back(')');
        bkt(deschise, inchise + 1);
        cur.pop_back();
    }
}
int main() {
    cin >> n;
    bkt(0, 0);
    return 0;
}
`,
    py: `import sys

def bkt(deschise, inchise, n, cur, out):
    if len(cur) == 2 * n:
        out.append(''.join(cur))
        return
    if deschise < n:
        cur.append('(')
        bkt(deschise + 1, inchise, n, cur, out)
        cur.pop()
    if inchise < deschise:
        cur.append(')')
        bkt(deschise, inchise + 1, n, cur, out)
        cur.pop()

n = int(sys.stdin.readline())
out = []
bkt(0, 0, n, [], out)
print('\\n'.join(out))
`,
    tests: ["1", "2", "3", "4", "5"],
  },
  {
    slug: "bt-numara-paranteze-balansate",
    title: "Numarul de secvente de paranteze balansate",
    difficulty: "easy",
    tags: ["backtracking", "paranteze", "combinatorica", "numarare"],
    statement: "Se citeste un numar natural nenul n. Determinati, folosind metoda Backtracking, numarul de secvente corecte (balansate) formate din n perechi de paranteze rotunde (numarul lui Catalan de ordin n).",
    input_format: "Se citeste numarul natural nenul n.",
    output_format: "Se afiseaza un singur numar: numarul de secvente balansate de n perechi de paranteze.",
    constraints: "1 <= n <= 12",
    hints: "Folositi acelasi backtracking ca la generarea secventelor balansate, dar numarati solutiile complete in loc sa le afisati.",
    explanation: `${BT_NOTE} Numararea foloseste aceleasi doua restrictii ca la generare (cel mult n paranteze deschise, niciodata mai multe inchise decat deschise).\n\n**Complexitate:** O(Catalan(n) * n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
long long numar = 0;
void bkt(int deschise, int inchise, int lungime) {
    if (lungime == 2 * n) { numar++; return; }
    if (deschise < n) bkt(deschise + 1, inchise, lungime + 1);
    if (inchise < deschise) bkt(deschise, inchise + 1, lungime + 1);
}
int main() {
    cin >> n;
    bkt(0, 0, 0);
    cout << numar << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

def bkt(deschise, inchise, lungime, n, stare):
    if lungime == 2 * n:
        stare[0] += 1
        return
    if deschise < n:
        bkt(deschise + 1, inchise, lungime + 1, n, stare)
    if inchise < deschise:
        bkt(deschise, inchise + 1, lungime + 1, n, stare)

n = int(sys.stdin.readline())
stare = [0]
bkt(0, 0, 0, n, stare)
print(stare[0])
`,
    tests: ["1", "4", "7", "10", "12"],
  },
  {
    slug: "bt-paranteze-adancime-maxima",
    title: "Secvente de paranteze balansate cu adancime marginita",
    difficulty: "medium",
    tags: ["backtracking", "paranteze", "combinatorica"],
    statement: "Se citesc doua numere naturale n si D. Generati, folosind metoda Backtracking, toate secventele corecte formate din n perechi de paranteze rotunde a caror adancime de imbricare nu depaseste D (adancimea intr-un punct al secventei este numarul de paranteze deschise si neinchise inca pana in acel punct), in ordine lexicografica.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si D.",
    output_format: "Se afiseaza toate secventele balansate cu adancime cel mult D, cate una pe linie, in ordine lexicografica. Daca nu exista nicio astfel de secventa, nu se afiseaza nimic.",
    constraints: "1 <= n <= 10, 1 <= D <= n",
    hints: "Folositi acelasi backtracking ca la generarea secventelor balansate, dar permiteti adaugarea unei paranteze deschise doar daca adancimea curenta (deschise - inchise) este strict mai mica decat D.",
    explanation: `${BT_NOTE} Adancimea curenta a secventei partiale este mereu egala cu (numarul de paranteze deschise) - (numarul de paranteze inchise); restrictia suplimentara \"adancime < D\" la deschidere garanteaza ca adancimea maxima nu depaseste niciodata D.\n\n**Complexitate:** O(numarul de astfel de secvente * n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, D;
string cur;
void bkt(int deschise, int inchise) {
    if ((int)cur.size() == 2 * n) {
        cout << cur << "\\n";
        return;
    }
    int adancime = deschise - inchise;
    if (deschise < n && adancime < D) {
        cur.push_back('(');
        bkt(deschise + 1, inchise);
        cur.pop_back();
    }
    if (inchise < deschise) {
        cur.push_back(')');
        bkt(deschise, inchise + 1);
        cur.pop_back();
    }
}
int main() {
    cin >> n >> D;
    bkt(0, 0);
    return 0;
}
`,
    py: `import sys

def bkt(deschise, inchise, n, D, cur, out):
    if len(cur) == 2 * n:
        out.append(''.join(cur))
        return
    adancime = deschise - inchise
    if deschise < n and adancime < D:
        cur.append('(')
        bkt(deschise + 1, inchise, n, D, cur, out)
        cur.pop()
    if inchise < deschise:
        cur.append(')')
        bkt(deschise, inchise + 1, n, D, cur, out)
        cur.pop()

n, D = map(int, sys.stdin.readline().split())
out = []
bkt(0, 0, n, D, [], out)
print('\\n'.join(out))
`,
    tests: ["3 1", "3 2", "3 3", "4 2", "5 2"],
  },
  {
    slug: "bt-paranteze-doua-tipuri",
    title: "Secvente valide cu doua tipuri de paranteze",
    difficulty: "hard",
    tags: ["backtracking", "paranteze", "combinatorica"],
    statement: "Se citesc doua numere naturale n si m. Generati, folosind metoda Backtracking, toate secventele corecte (valid imbricate) formate din n perechi de paranteze rotunde '(' ')' si m perechi de paranteze patrate '[' ']', in ordinea in care sunt generate incercand, la fiecare pas, in aceasta ordine: deschiderea unei paranteze rotunde, deschiderea unei paranteze patrate, inchiderea unei paranteze rotunde, inchiderea unei paranteze patrate.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si m.",
    output_format: "Se afiseaza toate secventele valide, cate una pe linie, in ordinea de generare descrisa in enunt.",
    constraints: "1 <= n <= 4, 1 <= m <= 3",
    hints: "Mentineti o stiva cu tipurile de paranteze deschise si neinchise inca, in ordinea deschiderii lor. O paranteza de un anumit tip poate fi inchisa doar daca acel tip se afla in varful stivei (este cea mai recent deschisa paranteza neinchisa).",
    explanation: `${BT_NOTE} Folosirea unei stive garanteaza imbricarea corecta: se poate inchide un tip de paranteza doar daca acesta este cel mai recent deschis si inca neinchis, exact ca la verificarea expresiilor cu paranteze.\n\n**Complexitate:** O(numarul de astfel de secvente * (n+m))`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, m;
string cur;
string stiva;
void bkt(int rDes, int rInc, int pDes, int pInc) {
    if ((int)cur.size() == 2 * (n + m)) {
        cout << cur << "\\n";
        return;
    }
    if (rDes < n) {
        cur.push_back('(');
        stiva.push_back('(');
        bkt(rDes + 1, rInc, pDes, pInc);
        stiva.pop_back();
        cur.pop_back();
    }
    if (pDes < m) {
        cur.push_back('[');
        stiva.push_back('[');
        bkt(rDes, rInc, pDes + 1, pInc);
        stiva.pop_back();
        cur.pop_back();
    }
    if (!stiva.empty() && stiva.back() == '(' && rInc < rDes) {
        cur.push_back(')');
        char top = stiva.back();
        stiva.pop_back();
        bkt(rDes, rInc + 1, pDes, pInc);
        stiva.push_back(top);
        cur.pop_back();
    }
    if (!stiva.empty() && stiva.back() == '[' && pInc < pDes) {
        cur.push_back(']');
        char top = stiva.back();
        stiva.pop_back();
        bkt(rDes, rInc, pDes, pInc + 1);
        stiva.push_back(top);
        cur.pop_back();
    }
}
int main() {
    cin >> n >> m;
    bkt(0, 0, 0, 0);
    return 0;
}
`,
    py: `import sys

def bkt(rDes, rInc, pDes, pInc, n, m, cur, stiva, out):
    if len(cur) == 2 * (n + m):
        out.append(''.join(cur))
        return
    if rDes < n:
        cur.append('(')
        stiva.append('(')
        bkt(rDes + 1, rInc, pDes, pInc, n, m, cur, stiva, out)
        stiva.pop()
        cur.pop()
    if pDes < m:
        cur.append('[')
        stiva.append('[')
        bkt(rDes, rInc, pDes + 1, pInc, n, m, cur, stiva, out)
        stiva.pop()
        cur.pop()
    if stiva and stiva[-1] == '(' and rInc < rDes:
        cur.append(')')
        top = stiva.pop()
        bkt(rDes, rInc + 1, pDes, pInc, n, m, cur, stiva, out)
        stiva.append(top)
        cur.pop()
    if stiva and stiva[-1] == '[' and pInc < pDes:
        cur.append(']')
        top = stiva.pop()
        bkt(rDes, rInc, pDes, pInc + 1, n, m, cur, stiva, out)
        stiva.append(top)
        cur.pop()

n, m = map(int, sys.stdin.readline().split())
out = []
bkt(0, 0, 0, 0, n, m, [], [], out)
print('\\n'.join(out))
`,
    tests: ["1 1", "2 1", "1 2", "2 2", "3 1"],
  },

  // ===================== D. ALTE PROBLEME DIVERSE =====================
  {
    slug: "bt-multimea-partilor",
    title: "Multimea partilor unei multimi",
    difficulty: "easy",
    tags: ["backtracking", "submultimi", "combinatorica"],
    statement: "Se citeste un numar natural n. Generati, folosind metoda Backtracking, toate submultimile (partile) multimii {1,2,...,n}, inclusiv multimea vida si multimea intreaga.",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza toate cele 2^n submultimi, cate una pe linie, cu elementele separate prin spatiu (linia corespunzatoare multimii vide este goala). Submultimile se afiseaza in ordinea in care sunt generate incercand, pentru fiecare element de la 1 la n, mai intai excluderea lui, apoi includerea lui.",
    constraints: "1 <= n <= 15",
    hints: "Pentru fiecare element, de la 1 la n, luati pe rand ambele decizii posibile: nu il includeti in submultimea curenta (continuati cu elementul urmator), apoi il includeti (continuati cu elementul urmator). Cand ati decis pentru toate cele n elemente, solutia curenta este completa.",
    explanation: `${BT_NOTE} Aceasta este schema clasica \"include/exclude\": pentru fiecare element se iau ambele decizii posibile, generand astfel toate cele 2^n submultimi posibile, fiecare exact o singura data.\n\n**Complexitate:** O(2^n * n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
vector<int> cur;
void bkt(int poz) {
    if (poz == n + 1) {
        for (size_t i = 0; i < cur.size(); i++) {
            if (i) cout << ' ';
            cout << cur[i];
        }
        cout << "\\n";
        return;
    }
    bkt(poz + 1);
    cur.push_back(poz);
    bkt(poz + 1);
    cur.pop_back();
}
int main() {
    cin >> n;
    bkt(1);
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

def bkt(poz, n, cur, out):
    if poz == n + 1:
        out.append(' '.join(map(str, cur)))
        return
    bkt(poz + 1, n, cur, out)
    cur.append(poz)
    bkt(poz + 1, n, cur, out)
    cur.pop()

n = int(sys.stdin.readline())
out = []
bkt(1, n, [], out)
print('\\n'.join(out))
`,
    tests: ["1", "2", "3", "4", "5"],
  },
  {
    slug: "bt-submultimi-suma-data",
    title: "Submultimi cu suma data",
    difficulty: "easy",
    tags: ["backtracking", "submultimi", "combinatorica", "proprietate"],
    statement: "Se citesc un numar natural n, cele n numere naturale nenule ale unui vector, si un numar natural S. Generati, folosind metoda Backtracking (schema include/exclude), toate submultimile vectorului a caror suma este exact S.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere. Pe a treia linie se citeste S.",
    output_format: "Se afiseaza toate submultimile cu suma S, cate una pe linie, cu elementele separate prin spatiu, in ordinea generata de schema include/exclude (exclude inaintea includerii, pentru fiecare element in ordinea data). Daca S=0, se afiseaza o linie goala (multimea vida).",
    constraints: "1 <= n <= 15, 1 <= v[i] <= 1000, 0 <= S <= 15000",
    hints: "La fiecare element, incercati mai intai sa nu il includeti in submultime, apoi sa il includeti, actualizand suma partiala. Verificati proprietatea (suma == S) doar dupa ce ati decis pentru toate cele n elemente.",
    explanation: `${BT_NOTE} Schema include/exclude testeaza toate cele 2^n submultimi posibile; verificarea sumei se face doar in frunza recursiei, cand decizia pentru toate elementele a fost luata.\n\n**Complexitate:** O(2^n * n)`,
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
long long S;
long long v[16];
vector<long long> cur;
void bkt(int poz, long long suma) {
    if (poz == n) {
        if (suma == S) {
            for (size_t i = 0; i < cur.size(); i++) {
                if (i) cout << ' ';
                cout << cur[i];
            }
            cout << "\\n";
        }
        return;
    }
    bkt(poz + 1, suma);
    cur.push_back(v[poz]);
    bkt(poz + 1, suma + v[poz]);
    cur.pop_back();
}
int main() {
    cin >> n;
    for (int i = 0; i < n; i++) cin >> v[i];
    cin >> S;
    bkt(0, 0);
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

def bkt(poz, suma, v, n, S, cur, out):
    if poz == n:
        if suma == S:
            out.append(' '.join(map(str, cur)))
        return
    bkt(poz + 1, suma, v, n, S, cur, out)
    cur.append(v[poz])
    bkt(poz + 1, suma + v[poz], v, n, S, cur, out)
    cur.pop()

data = sys.stdin.read().split()
n = int(data[0])
v = list(map(int, data[1:1 + n]))
S = int(data[1 + n])
out = []
bkt(0, 0, v, n, S, [], out)
print('\\n'.join(out))
`,
    tests: ["3\n1 2 3\n3", "4\n1 2 3 4\n5", "4\n2 2 2 2\n4", "5\n1 2 4 8 16\n0", "3\n5 5 5\n10"],
  },
  {
    slug: "bt-rucsac-01-maxim",
    title: "Rucsacul 0/1 prin Backtracking",
    difficulty: "medium",
    tags: ["backtracking", "submultimi", "combinatorica", "optimizare"],
    statement: "Se citesc un numar natural n, apoi n perechi (greutate, valoare) reprezentand n obiecte, si o capacitate maxima G. Determinati, folosind metoda Backtracking (fara programare dinamica), valoarea maxima totala ce poate fi obtinuta alegand un subset de obiecte a caror greutate totala nu depaseste G.",
    input_format: "Pe prima linie se citeste n. Urmeaza n linii, fiecare cu doua numere: greutatea si valoarea unui obiect. Pe ultima linie se citeste G.",
    output_format: "Se afiseaza un singur numar: valoarea maxima totala obtinuta.",
    constraints: "1 <= n <= 16, 1 <= greutate, valoare <= 1000, 1 <= G <= 10000",
    hints: "Folositi schema include/exclude: pentru fiecare obiect, incercati atat varianta includerii lui (daca nu se depaseste capacitatea), cat si varianta excluderii. Retineti cea mai mare valoare totala obtinuta intr-o solutie valida (greutate totala <= G) intalnita in parcurgere.",
    explanation: `${BT_NOTE} Spre deosebire de rezolvarea clasica prin programare dinamica, aici se exploreaza efectiv toate cele 2^n submultimi posibile (cu eliminarea ramurilor care depasesc deja capacitatea), retinand valoarea maxima gasita.\n\n**Complexitate:** O(2^n)`,
    time_limit_ms: 2500,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
long long G;
long long gr[20], val[20];
long long maxim = 0;
void bkt(int poz, long long greutateCurenta, long long valoareCurenta) {
    if (greutateCurenta > G) return;
    if (valoareCurenta > maxim) maxim = valoareCurenta;
    if (poz == n) return;
    bkt(poz + 1, greutateCurenta + gr[poz], valoareCurenta + val[poz]);
    bkt(poz + 1, greutateCurenta, valoareCurenta);
}
int main() {
    cin >> n;
    for (int i = 0; i < n; i++) cin >> gr[i] >> val[i];
    cin >> G;
    bkt(0, 0, 0);
    cout << maxim << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

def bkt(poz, greutateCurenta, valoareCurenta, gr, val, n, G, stare):
    if greutateCurenta > G:
        return
    if valoareCurenta > stare[0]:
        stare[0] = valoareCurenta
    if poz == n:
        return
    bkt(poz + 1, greutateCurenta + gr[poz], valoareCurenta + val[poz], gr, val, n, G, stare)
    bkt(poz + 1, greutateCurenta, valoareCurenta, gr, val, n, G, stare)

data = sys.stdin.read().split()
idx = 0
n = int(data[idx]); idx += 1
gr = []
val = []
for i in range(n):
    gr.append(int(data[idx])); idx += 1
    val.append(int(data[idx])); idx += 1
G = int(data[idx])
stare = [0]
bkt(0, 0, 0, gr, val, n, G, stare)
print(stare[0])
`,
    tests: ["3\n2 3\n3 4\n4 5\n5", "4\n1 1\n2 2\n3 3\n4 4\n5", "2\n5 10\n5 10\n5", "3\n1 10\n1 10\n1 10\n2", "1\n5 100\n4"],
  },
  {
    slug: "bt-partitie-echilibrata",
    title: "Impartirea unei multimi in doua submultimi cu sume egale",
    difficulty: "medium",
    tags: ["backtracking", "submultimi", "combinatorica"],
    statement: "Se citesc un numar natural n si cele n numere naturale nenule ale unui vector. Determinati, folosind metoda Backtracking, daca vectorul poate fi impartit in doua submultimi disjuncte cu suma elementelor egala. Daca da, afisati elementele uneia dintre aceste submultimi; daca nu, afisati NU.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere.",
    output_format: "Daca exista o astfel de impartire, se afiseaza elementele unei submultimi cu suma egala cu jumatate din suma totala, separate prin spatiu (prima gasita, in ordinea de cautare descrisa in indicatii). Altfel se afiseaza NU.",
    constraints: "1 <= n <= 20, 1 <= v[i] <= 1000",
    hints: "Daca suma totala este impara, raspunsul este direct NU. Altfel, cautati (schema include/exclude, incercand mai intai includerea elementului curent) o submultime a carei suma partiala atinge exact jumatate din suma totala; opriti cautarea imediat ce ati gasit o astfel de submultime.",
    explanation: `${BT_NOTE} Cautarea se opreste la prima submultime gasita cu suma egala cu jumatate din totalul general; ordinea de incercare (includere inaintea excluderii, elemente parcurse in ordinea din vector) este esentiala pentru ca solutia afisata sa fie deterministe.\n\n**Complexitate:** O(2^n) in cel mai defavorabil caz`,
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
long long v[20];
long long target;
bool gasit = false;
vector<long long> cur;
void bkt(int poz, long long suma) {
    if (gasit) return;
    if (suma == target) {
        for (size_t i = 0; i < cur.size(); i++) {
            if (i) cout << ' ';
            cout << cur[i];
        }
        cout << "\\n";
        gasit = true;
        return;
    }
    if (poz == n || suma > target) return;
    cur.push_back(v[poz]);
    bkt(poz + 1, suma + v[poz]);
    cur.pop_back();
    if (gasit) return;
    bkt(poz + 1, suma);
}
int main() {
    cin >> n;
    long long total = 0;
    for (int i = 0; i < n; i++) { cin >> v[i]; total += v[i]; }
    if (total % 2 != 0) { cout << "NU\\n"; return 0; }
    target = total / 2;
    bkt(0, 0);
    if (!gasit) cout << "NU\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

def bkt(poz, suma, v, n, target, cur, stare):
    if stare['gasit']:
        return
    if suma == target:
        print(' '.join(map(str, cur)))
        stare['gasit'] = True
        return
    if poz == n or suma > target:
        return
    cur.append(v[poz])
    bkt(poz + 1, suma + v[poz], v, n, target, cur, stare)
    cur.pop()
    if stare['gasit']:
        return
    bkt(poz + 1, suma, v, n, target, cur, stare)

data = sys.stdin.read().split()
n = int(data[0])
v = list(map(int, data[1:1 + n]))
total = sum(v)
if total % 2 != 0:
    print("NU")
else:
    target = total // 2
    stare = {'gasit': False}
    bkt(0, 0, v, n, target, [], stare)
    if not stare['gasit']:
        print("NU")
`,
    tests: ["4\n1 5 3 3", "3\n1 2 3", "4\n1 2 3 5", "1\n4", "5\n2 4 6 8 10"],
  },
  {
    slug: "bt-descompunere-produs-factori",
    title: "Descompunerea unui numar in produs de factori",
    difficulty: "medium",
    tags: ["backtracking", "combinatorica", "numere"],
    statement: "Se citeste un numar natural n, n >= 2. Generati, folosind metoda Backtracking, toate descompunerile lui n ca produs de cel putin doi factori, fiecare factor fiind cel putin 2, cu factorii afisati in ordine nedescrescatoare.",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza toate descompunerile lui n in cel putin doi factori (fiecare >= 2), cate una pe linie, cu factorii in ordine nedescrescatoare, separati prin spatiu. Daca n este prim, nu se afiseaza nimic.",
    constraints: "2 <= n <= 1000",
    hints: "Alegeti factorii unul cate unul, in ordine nedescrescatoare: la fiecare pas incercati toti divizorii f ai valorii ramase de descompus, cu f cel putin egal cu ultimul factor ales, apoi continuati recursiv cu valoarea ramasa impartita la f. O descompunere este completa cand valoarea ramasa devine 1, dar se afiseaza doar daca are cel putin doi factori.",
    explanation: `${BT_NOTE} Restrictia \"factorul urmator >= factorul anterior\" garanteaza ca fiecare descompunere multiplicativa este generata o singura data (evita duplicate precum 2*6 si 6*2).\n\n**Complexitate:** O(numarul de descompuneri * numarul de divizori)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<int> fact;
void bkt(int ramas, int minFactor) {
    if (ramas == 1) {
        if (fact.size() >= 2) {
            for (size_t i = 0; i < fact.size(); i++) cout << fact[i] << (i + 1 < fact.size() ? ' ' : '\\n');
        }
        return;
    }
    for (int f = minFactor; f <= ramas; f++) {
        if (ramas % f == 0) {
            fact.push_back(f);
            bkt(ramas / f, f);
            fact.pop_back();
        }
    }
}
int main() {
    int n; cin >> n;
    bkt(n, 2);
    return 0;
}
`,
    py: `def bkt(ramas, minFactor, fact, out):
    if ramas == 1:
        if len(fact) >= 2:
            out.append(' '.join(map(str, fact)))
        return
    for f in range(minFactor, ramas + 1):
        if ramas % f == 0:
            fact.append(f)
            bkt(ramas // f, f, fact, out)
            fact.pop()

n = int(input())
out = []
bkt(n, 2, [], out)
print('\\n'.join(out))
`,
    tests: ["12", "36", "30", "17", "100"],
  },
  {
    slug: "bt-siruri-binare-fara-doi-de-unu",
    title: "Siruri binare fara doi de 1 consecutivi",
    difficulty: "easy",
    tags: ["backtracking", "siruri", "combinatorica"],
    statement: "Se citeste un numar natural n. Generati, folosind metoda Backtracking, toate sirurile binare (formate din cifrele 0 si 1) de lungime n care nu contin doua cifre de 1 alaturate, in ordine lexicografica.",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza toate sirurile binare de lungime n fara doi de 1 consecutivi, cate unul pe linie, in ordine lexicografica.",
    constraints: "1 <= n <= 20",
    hints: "Construiti sirul cifra cu cifra. La fiecare pozitie puteti pune cifra 0 mereu; puteti pune cifra 1 doar daca cifra anterioara nu a fost tot 1.",
    explanation: `${BT_NOTE} Incercarea cifrei 0 inaintea cifrei 1 la fiecare pas garanteaza ordinea lexicografica; restrictia asupra cifrei anterioare evita generarea sirurilor cu doi de 1 alaturati. Numarul total de astfel de siruri este un numar Fibonacci.\n\n**Complexitate:** O(Fibonacci(n) * n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
string cur;
void bkt(int poz, int ultim) {
    if (poz == n) {
        cout << cur << "\\n";
        return;
    }
    cur.push_back('0');
    bkt(poz + 1, 0);
    cur.pop_back();
    if (ultim != 1) {
        cur.push_back('1');
        bkt(poz + 1, 1);
        cur.pop_back();
    }
}
int main() {
    cin >> n;
    bkt(0, 0);
    return 0;
}
`,
    py: `def bkt(poz, ultim, n, cur, out):
    if poz == n:
        out.append(''.join(cur))
        return
    cur.append('0')
    bkt(poz + 1, 0, n, cur, out)
    cur.pop()
    if ultim != 1:
        cur.append('1')
        bkt(poz + 1, 1, n, cur, out)
        cur.pop()

n = int(input())
out = []
bkt(0, 0, n, [], out)
print('\\n'.join(out))
`,
    tests: ["1", "2", "3", "4", "5"],
  },
  {
    slug: "bt-siruri-fara-adiacente-egale",
    title: "Siruri peste un alfabet dat fara doua cifre identice alaturate",
    difficulty: "easy",
    tags: ["backtracking", "siruri", "combinatorica"],
    statement: "Se citesc doua numere naturale n si m. Generati, folosind metoda Backtracking, toate sirurile de lungime n formate din cifrele 0, 1, ..., m-1, in care nu apar doua cifre identice alaturate, in ordine lexicografica.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si m.",
    output_format: "Se afiseaza toate sirurile de lungime n peste alfabetul {0,...,m-1} fara doua cifre identice alaturate, cate unul pe linie, in ordine lexicografica.",
    constraints: "1 <= n <= 10, 2 <= m <= 9",
    hints: "Construiti sirul cifra cu cifra, incercand in ordine crescatoare toate cifrele de la 0 la m-1, cu exceptia cifrei folosite pe pozitia anterioara.",
    explanation: `${BT_NOTE} Generalizare a problemei sirurilor binare fara doi de 1 alaturati: aici orice cifra este interzisa doar daca este identica cu cea aleasa pe pozitia imediat anterioara.\n\n**Complexitate:** O(m * (m-1)^(n-1) * n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, m;
string cur;
void bkt(int poz, int ultim) {
    if (poz == n) {
        cout << cur << "\\n";
        return;
    }
    for (int d = 0; d < m; d++) {
        if (d == ultim) continue;
        cur.push_back('0' + d);
        bkt(poz + 1, d);
        cur.pop_back();
    }
}
int main() {
    cin >> n >> m;
    bkt(0, -1);
    return 0;
}
`,
    py: `def bkt(poz, ultim, n, m, cur, out):
    if poz == n:
        out.append(''.join(cur))
        return
    for d in range(m):
        if d == ultim:
            continue
        cur.append(str(d))
        bkt(poz + 1, d, n, m, cur, out)
        cur.pop()

n, m = map(int, input().split())
out = []
bkt(0, -1, n, m, [], out)
print('\\n'.join(out))
`,
    tests: ["2 2", "3 3", "2 3", "4 2", "1 5"],
  },
  {
    slug: "bt-adaugare-operatori-target",
    title: "Introducerea de operatori intre cifre pentru a obtine un rezultat dat",
    difficulty: "hard",
    tags: ["backtracking", "expresii", "combinatorica"],
    statement: "Se citesc un sir de cifre (reprezentand un numar, ca text) si un numar intreg T. Generati, folosind metoda Backtracking, toate expresiile aritmetice corecte ce se pot obtine inserand operatorii +, - si * intre unele dintre cifrele sirului (fara a schimba ordinea cifrelor, si fara numere cu zero nesemnificativ la inceput), astfel incat valoarea expresiei (calculata respectand prioritatea inmultirii fata de adunare si scadere) sa fie exact T.",
    input_format: "Pe prima linie se citeste sirul de cifre. Pe a doua linie se citeste numarul intreg T.",
    output_format: "Se afiseaza toate expresiile obtinute a caror valoare este T, cate una pe linie, in ordinea in care sunt generate (incercand, la fiecare pozitie, toate lungimile posibile ale urmatorului termen, in ordine crescatoare, si pentru fiecare lungime operatorii in ordinea +, -, *).",
    constraints: "1 <= lungimea sirului de cifre <= 6, -100000 <= T <= 100000",
    hints: "La fiecare pas alegeti urmatorul termen (o secventa de cifre consecutive, fara zero nesemnificativ) si operatorul care il precede. Pentru a evalua corect inmultirea, retineti valoarea ultimului termen adaugat: cand inseriti '*', anulati contributia lui la suma totala si adaugati-o inmultita cu noul termen.",
    explanation: `${BT_NOTE} Trucul pentru a respecta prioritatea inmultirii intr-o evaluare incrementala este pastrarea valorii ultimului termen: la operatorul '*', se scade din total contributia veche a ultimului termen si se aduna produsul acestuia cu noul factor, extinzand astfel corect ultimul termen multiplicativ.\n\n**Complexitate:** O(3^lungime) in cel mai defavorabil caz`,
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
string num;
long long target;
void bkt(int idx, string expr, long long total, long long ultimulTermen) {
    if (idx == (int)num.size()) {
        if (total == target) cout << expr << "\\n";
        return;
    }
    for (int lung = 1; idx + lung <= (int)num.size(); lung++) {
        string parte = num.substr(idx, lung);
        if (parte.size() > 1 && parte[0] == '0') break;
        long long val = stoll(parte);
        if (idx == 0) {
            bkt(idx + lung, parte, val, val);
        } else {
            bkt(idx + lung, expr + "+" + parte, total + val, val);
            bkt(idx + lung, expr + "-" + parte, total - val, -val);
            bkt(idx + lung, expr + "*" + parte, total - ultimulTermen + ultimulTermen * val, ultimulTermen * val);
        }
    }
}
int main() {
    cin >> num >> target;
    bkt(0, "", 0, 0);
    return 0;
}
`,
    py: `import sys

def bkt(idx, expr, total, ultimulTermen, num, target, out):
    if idx == len(num):
        if total == target:
            out.append(expr)
        return
    for lung in range(1, len(num) - idx + 1):
        parte = num[idx:idx + lung]
        if len(parte) > 1 and parte[0] == '0':
            break
        val = int(parte)
        if idx == 0:
            bkt(idx + lung, parte, val, val, num, target, out)
        else:
            bkt(idx + lung, expr + "+" + parte, total + val, val, num, target, out)
            bkt(idx + lung, expr + "-" + parte, total - val, -val, num, target, out)
            bkt(idx + lung, expr + "*" + parte, total - ultimulTermen + ultimulTermen * val, ultimulTermen * val, num, target, out)

data = sys.stdin.read().split()
num = data[0]
target = int(data[1])
out = []
bkt(0, "", 0, 0, num, target, out)
print('\\n'.join(out))
`,
    tests: ["123\n6", "232\n8", "105\n5", "1234\n17", "999\n27"],
  },
  {
    slug: "bt-monede-combinatii-suma",
    title: "Toate modurile de a plati o suma cu monede date",
    difficulty: "medium",
    tags: ["backtracking", "combinari-cu-repetitie", "combinatorica"],
    statement: "Se citesc un numar natural m, cele m valori distincte ale unor monede disponibile in cantitate nelimitata, si o suma S. Generati, folosind metoda Backtracking, toate modurile de a obtine suma S folosind aceste monede (fiecare moneda putand fi folosita de oricate ori).",
    input_format: "Pe prima linie se citeste m. Pe a doua linie se citesc cele m valori ale monedelor. Pe a treia linie se citeste S.",
    output_format: "Se afiseaza toate modurile de a obtine suma S, cate unul pe linie, sub forma 'valoare1:cantitate1 valoare2:cantitate2 ... valoarem:cantitatem' (in ordinea monedelor citite), in ordinea generata de backtracking (numarul de monede de prima valoare crescand de la 0).",
    constraints: "1 <= m <= 4, 1 <= valoare moneda <= 30, 0 <= S <= 30",
    hints: "Pentru fiecare tip de moneda, in ordinea data, alegeti de cate ori il folositi (de la 0 pana la maximul posibil fara a depasi suma ramasa), apoi continuati cu tipul urmator de moneda.",
    explanation: `${BT_NOTE} Spre deosebire de combinarile cu repetitie ale unei multimi {1,...,n}, aici elementele (monedele) au valori arbitrare date, iar solutia este reprezentata prin cate exemplare din fiecare tip se folosesc, nu printr-o secventa de valori.\n\n**Complexitate:** O(numarul de solutii * m)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int m;
long long denom[10];
long long S;
vector<long long> cnt;
void bkt(int idx, long long ramas) {
    if (idx == m) {
        if (ramas == 0) {
            for (int i = 0; i < m; i++) cout << denom[i] << ":" << cnt[i] << (i + 1 < m ? ' ' : '\\n');
        }
        return;
    }
    for (long long c = 0; c * denom[idx] <= ramas; c++) {
        cnt.push_back(c);
        bkt(idx + 1, ramas - c * denom[idx]);
        cnt.pop_back();
    }
}
int main() {
    cin >> m;
    for (int i = 0; i < m; i++) cin >> denom[i];
    cin >> S;
    bkt(0, S);
    return 0;
}
`,
    py: `def bkt(idx, ramas, denom, m, cnt, out):
    if idx == m:
        if ramas == 0:
            out.append(' '.join(f"{denom[i]}:{cnt[i]}" for i in range(m)))
        return
    c = 0
    while c * denom[idx] <= ramas:
        cnt.append(c)
        bkt(idx + 1, ramas - c * denom[idx], denom, m, cnt, out)
        cnt.pop()
        c += 1

import sys
data = sys.stdin.read().split()
m = int(data[0])
denom = list(map(int, data[1:1 + m]))
S = int(data[1 + m])
out = []
bkt(0, S, denom, m, [], out)
print('\\n'.join(out))
`,
    tests: ["2\n1 2\n4", "3\n1 2 5\n5", "2\n2 3\n7", "1\n5\n15", "3\n1 3 4\n6"],
  },
  {
    slug: "bt-numere-cifre-distincte-divizibile",
    title: "Numere formate din cifre date, divizibile cu un numar dat",
    difficulty: "medium",
    tags: ["backtracking", "permutari", "combinatorica", "numere"],
    statement: "Se citesc un numar natural n, cele n cifre distincte date (numere intre 0 si 9), si un numar natural nenul D. Generati, folosind metoda Backtracking, toate numerele care se pot forma folosind fiecare dintre cele n cifre exact o data (fara cifra 0 pe prima pozitie, daca n > 1), care sunt divizibile cu D.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n cifre distincte. Pe a treia linie se citeste D.",
    output_format: "Se afiseaza toate numerele obtinute, divizibile cu D, cate unul pe linie, in ordinea lexicografica generata de backtracking (cifrele incercate in ordinea data la citire).",
    constraints: "1 <= n <= 8, 1 <= D <= 1000",
    hints: "Construiti numarul cifra cu cifra (ca la o permutare a cifrelor), dar retineti restul impartirii la D al numarului construit pana acum, actualizandu-l la fiecare pas cu formula (rest*10 + cifra_noua) % D, pentru a evita lucrul cu numere foarte mari.",
    explanation: `${BT_NOTE} Restul modulo D al unui numar se poate actualiza incremental, cifra cu cifra, cu formula (rest*10 + cifra) % D; astfel se poate verifica divizibilitatea fara a calcula vreodata valoarea intreaga a numarului.\n\n**Complexitate:** O(n! * n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
long long D;
int cifre[8];
bool folosit[8];
vector<int> a;
void bkt(int poz, long long rest) {
    if (poz == n) {
        if (rest == 0) {
            for (int x : a) cout << x;
            cout << "\\n";
        }
        return;
    }
    for (int i = 0; i < n; i++) {
        if (folosit[i]) continue;
        if (poz == 0 && cifre[i] == 0 && n > 1) continue;
        folosit[i] = true;
        a.push_back(cifre[i]);
        bkt(poz + 1, (rest * 10 + cifre[i]) % D);
        a.pop_back();
        folosit[i] = false;
    }
}
int main() {
    cin >> n;
    for (int i = 0; i < n; i++) cin >> cifre[i];
    cin >> D;
    bkt(0, 0);
    return 0;
}
`,
    py: `def bkt(poz, rest, cifre, folosit, n, D, a, out):
    if poz == n:
        if rest == 0:
            out.append(''.join(map(str, a)))
        return
    for i in range(n):
        if folosit[i]:
            continue
        if poz == 0 and cifre[i] == 0 and n > 1:
            continue
        folosit[i] = True
        a.append(cifre[i])
        bkt(poz + 1, (rest * 10 + cifre[i]) % D, cifre, folosit, n, D, a, out)
        a.pop()
        folosit[i] = False

import sys
data = sys.stdin.read().split()
n = int(data[0])
cifre = list(map(int, data[1:1 + n]))
D = int(data[1 + n])
folosit = [False] * n
out = []
bkt(0, 0, cifre, folosit, n, D, [], out)
print('\\n'.join(out))
`,
    tests: ["3\n1 2 3\n3", "3\n1 2 3\n2", "4\n1 2 3 4\n11", "2\n0 5\n5", "1\n7\n7"],
  },
  {
    slug: "bt-submultimi-produs-dat",
    title: "Submultimi cu produsul elementelor dat",
    difficulty: "medium",
    tags: ["backtracking", "submultimi", "combinatorica"],
    statement: "Se citesc un numar natural n, cele n numere naturale nenule ale unui vector, si un numar natural P. Generati, folosind metoda Backtracking (schema include/exclude), toate submultimile vectorului al caror produs al elementelor este exact P (produsul elementelor multimii vide se considera 1).",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere. Pe a treia linie se citeste P.",
    output_format: "Se afiseaza toate submultimile cu produsul P, cate una pe linie, cu elementele separate prin spatiu, in ordinea generata de schema include/exclude (exclude inaintea includerii, pentru fiecare element in ordinea data). Daca multimea vida are produsul P (adica P=1), se afiseaza si o linie goala pentru ea.",
    constraints: "1 <= n <= 15, 1 <= v[i] <= 12, 1 <= P <= 10^9",
    hints: "La fel ca la submultimile cu suma data, dar mentineti produsul partial in loc de suma (produsul multimii vide, inainte de a alege vreun element, este 1).",
    explanation: `${BT_NOTE} Schema include/exclude este identica cu cea de la submultimile cu suma data; singura diferenta este ca se mentine produsul partial (initializat cu 1) in loc de suma partiala (initializata cu 0).\n\n**Complexitate:** O(2^n * n)`,
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
long long P;
long long v[16];
vector<long long> cur;
void bkt(int poz, long long produs) {
    if (poz == n) {
        if (produs == P) {
            for (size_t i = 0; i < cur.size(); i++) {
                if (i) cout << ' ';
                cout << cur[i];
            }
            cout << "\\n";
        }
        return;
    }
    bkt(poz + 1, produs);
    cur.push_back(v[poz]);
    bkt(poz + 1, produs * v[poz]);
    cur.pop_back();
}
int main() {
    cin >> n;
    for (int i = 0; i < n; i++) cin >> v[i];
    cin >> P;
    bkt(0, 1);
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

def bkt(poz, produs, v, n, P, cur, out):
    if poz == n:
        if produs == P:
            out.append(' '.join(map(str, cur)))
        return
    bkt(poz + 1, produs, v, n, P, cur, out)
    cur.append(v[poz])
    bkt(poz + 1, produs * v[poz], v, n, P, cur, out)
    cur.pop()

data = sys.stdin.read().split()
n = int(data[0])
v = list(map(int, data[1:1 + n]))
P = int(data[1 + n])
out = []
bkt(0, 1, v, n, P, [], out)
print('\\n'.join(out))
`,
    tests: ["3\n2 3 4\n6", "4\n1 2 3 4\n24", "3\n2 2 2\n8", "4\n2 3 5 7\n1", "4\n1 1 2 3\n2"],
  },
  {
    slug: "bt-compozitii-numar",
    title: "Compozitiile (sume ordonate) unui numar",
    difficulty: "easy",
    tags: ["backtracking", "combinatorica"],
    statement: "Se citeste un numar natural nenul n. Generati, folosind metoda Backtracking, toate compozitiile lui n, adica toate modurile de a scrie n ca suma ordonata de numere naturale nenule (spre deosebire de partitii, aici ordinea termenilor conteaza: 1+3 si 3+1 sunt compozitii diferite), in ordine lexicografica.",
    input_format: "Se citeste numarul natural nenul n.",
    output_format: "Se afiseaza toate compozitiile lui n, cate una pe linie, in ordine lexicografica, cu termenii separati prin spatiu.",
    constraints: "1 <= n <= 12",
    hints: "Construiti compozitia termen cu termen: la fiecare pas alegeti urmatorul termen intre 1 si suma ramasa (in ordine crescatoare), fara nicio restrictie fata de termenul anterior (spre deosebire de partitii).",
    explanation: `${BT_NOTE} Spre deosebire de partitiile unui numar, aici nu exista nicio restrictie de tipul \"termenul urmator <= termenul anterior\", deoarece ordinea termenilor conteaza: numarul total de compozitii ale lui n este 2^(n-1).\n\n**Complexitate:** O(2^n * n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<int> a;
void bkt(int ramas) {
    if (ramas == 0) {
        for (size_t i = 0; i < a.size(); i++) cout << a[i] << (i + 1 < a.size() ? ' ' : '\\n');
        return;
    }
    for (int p = 1; p <= ramas; p++) {
        a.push_back(p);
        bkt(ramas - p);
        a.pop_back();
    }
}
int main() {
    int n; cin >> n;
    bkt(n);
    return 0;
}
`,
    py: `def bkt(ramas, a, out):
    if ramas == 0:
        out.append(' '.join(map(str, a)))
        return
    for p in range(1, ramas + 1):
        a.append(p)
        bkt(ramas - p, a, out)
        a.pop()

n = int(input())
out = []
bkt(n, [], out)
print('\\n'.join(out))
`,
    tests: ["1", "2", "3", "4", "5"],
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
