const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade11", chapter: "grafuri", sub: "grafuri-neorientate-elementar" };

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
  // ===================== GRUPA 1: REPREZENTARE =====================
  {
    slug: "g-lista-adiacenta-din-muchii",
    title: "Lista de adiacenta dintr-o lista de muchii",
    difficulty: "easy",
    tags: ["grafuri", "reprezentare"],
    statement: "Se da un graf neorientat simplu cu n noduri (numerotate de la 1 la n) si m muchii. Construiti si afisati lista de adiacenta a fiecarui nod.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza n linii. Pe linia i se afiseaza i, urmat de ':', apoi vecinii nodului i in ordine crescatoare, separati prin spatiu (daca nodul nu are vecini, se afiseaza doar 'i:').",
    constraints: "1 <= n <= 1000, 0 <= m <= 5000, graful este simplu (fara autobucle si fara muchii multiple)",
    hints: "Folositi un vector de liste (vector<vector<int>>): pentru fiecare muchie x-y adaugati y in lista lui x si x in lista lui y. La final sortati fiecare lista.",
    explanation: "Lista de adiacenta este cea mai folosita reprezentare pentru grafuri rare: fiecare nod retine doar vecinii sai reali, spre deosebire de matricea de adiacenta care retine si absentele. Se parcurg cele m muchii si se adauga fiecare capat in lista celuilalt (graful este neorientat), apoi listele se sorteaza pentru afisare determinista.\n\n**Complexitate:** O(n + m log m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
        adj[y].push_back(x);
    }
    for (int i = 1; i <= n; i++) {
        sort(adj[i].begin(), adj[i].end());
        cout << i << ":";
        for (int v : adj[i]) cout << " " << v;
        cout << "\\n";
    }
    return 0;
}
`,
    py: `n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y)
    adj[y].append(x)
for i in range(1, n + 1):
    adj[i].sort()
    print(str(i) + ":" + "".join(" " + str(v) for v in adj[i]))
`,
    tests: ["4 3\n1 2\n2 3\n3 4", "5 0", "1 0", "6 6\n1 2\n1 3\n1 4\n2 3\n5 6\n4 5", "3 3\n1 2\n2 3\n1 3"],
  },
  {
    slug: "g-matrice-adiacenta-din-muchii",
    title: "Matricea de adiacenta dintr-o lista de muchii",
    difficulty: "easy",
    tags: ["grafuri", "reprezentare"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, dat prin lista muchiilor. Construiti si afisati matricea de adiacenta a grafului.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza n linii, fiecare cu n numere (0 sau 1) separate prin spatiu: elementul de pe linia i si coloana j este 1 daca exista muchie intre i si j, altfel 0.",
    constraints: "1 <= n <= 500, 0 <= m <= n*(n-1)/2, graful este simplu",
    hints: "Alocati o matrice n x n initializata cu 0, apoi pentru fiecare muchie x-y setati mat[x][y] = mat[y][x] = 1.",
    explanation: "Matricea de adiacenta este o reprezentare O(n^2) potrivita pentru grafuri dense sau pentru interogari rapide de tipul 'sunt x si y adiacenti?'. Se initializeaza cu 0 si se marcheaza simetric fiecare muchie citita.\n\n**Complexitate:** O(n^2 + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> mat(n + 1, vector<int>(n + 1, 0));
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        mat[x][y] = 1;
        mat[y][x] = 1;
    }
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) cout << mat[i][j] << (j < n ? " " : "\\n");
    }
    return 0;
}
`,
    py: `n, m = map(int, input().split())
mat = [[0] * (n + 1) for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    mat[x][y] = 1
    mat[y][x] = 1
for i in range(1, n + 1):
    print(" ".join(str(mat[i][j]) for j in range(1, n + 1)))
`,
    tests: ["4 3\n1 2\n2 3\n3 4", "3 0", "1 0", "5 4\n1 2\n1 3\n1 4\n1 5", "3 3\n1 2\n2 3\n1 3"],
  },
  {
    slug: "g-muchii-din-matrice-adiacenta",
    title: "Lista de muchii dintr-o matrice de adiacenta",
    difficulty: "easy",
    tags: ["grafuri", "reprezentare"],
    statement: "Se da un graf neorientat simplu cu n noduri, descris prin matricea de adiacenta (simetrica, cu 0 pe diagonala). Determinati si afisati lista muchiilor grafului.",
    input_format: "Pe prima linie se citeste n. Urmeaza n linii, fiecare cu n numere (0 sau 1), reprezentand matricea de adiacenta.",
    output_format: "Pe prima linie se afiseaza numarul de muchii m. Urmeaza m linii, fiecare cu doua numere i j (i < j), in ordine crescatoare dupa i, apoi dupa j.",
    constraints: "1 <= n <= 500",
    hints: "Parcurgeti doar perechile (i, j) cu i < j, pentru a nu afisa fiecare muchie de doua ori (matricea fiind simetrica).",
    explanation: "Deoarece matricea este simetrica, fiecare muchie apare de doua ori in ea (mat[i][j] si mat[j][i]). Parcurgand doar perechile cu i < j se obtine automat fiecare muchie o singura data, iar ordinea de parcurgere garanteaza afisarea in ordine crescatoare.\n\n**Complexitate:** O(n^2)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<vector<int>> mat(n + 1, vector<int>(n + 1));
    for (int i = 1; i <= n; i++) for (int j = 1; j <= n; j++) cin >> mat[i][j];
    vector<pair<int,int>> edges;
    for (int i = 1; i <= n; i++)
        for (int j = i + 1; j <= n; j++)
            if (mat[i][j] == 1) edges.push_back({i, j});
    cout << edges.size() << "\\n";
    for (auto& e : edges) cout << e.first << " " << e.second << "\\n";
    return 0;
}
`,
    py: `n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
edges = []
for i in range(n):
    for j in range(i + 1, n):
        if mat[i][j] == 1:
            edges.append((i + 1, j + 1))
print(len(edges))
for a, b in edges:
    print(a, b)
`,
    tests: ["4\n0 1 0 0\n1 0 1 0\n0 1 0 1\n0 0 1 0", "3\n0 0 0\n0 0 0\n0 0 0", "1\n0", "4\n0 1 1 1\n1 0 1 1\n1 1 0 1\n1 1 1 0", "2\n0 1\n1 0"],
  },
  {
    slug: "g-lista-adiacenta-din-matrice",
    title: "Lista de adiacenta dintr-o matrice de adiacenta",
    difficulty: "easy",
    tags: ["grafuri", "reprezentare"],
    statement: "Se da un graf neorientat simplu cu n noduri, descris prin matricea de adiacenta. Construiti si afisati lista de adiacenta a fiecarui nod.",
    input_format: "Pe prima linie se citeste n. Urmeaza n linii, fiecare cu n numere (0 sau 1), reprezentand matricea de adiacenta.",
    output_format: "Se afiseaza n linii. Pe linia i se afiseaza i, urmat de ':', apoi vecinii nodului i in ordine crescatoare, separati prin spatiu.",
    constraints: "1 <= n <= 500",
    hints: "Pentru fiecare linie i a matricei, parcurgeti coloanele in ordine crescatoare si adaugati in lista lui i fiecare j pentru care mat[i][j] = 1.",
    explanation: "Parcurgand linia i a matricei in ordinea coloanelor 1..n se obtin direct vecinii nodului i in ordine crescatoare, fara a mai fi nevoie de o sortare ulterioara.\n\n**Complexitate:** O(n^2)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<vector<int>> mat(n + 1, vector<int>(n + 1));
    for (int i = 1; i <= n; i++) for (int j = 1; j <= n; j++) cin >> mat[i][j];
    for (int i = 1; i <= n; i++) {
        cout << i << ":";
        for (int j = 1; j <= n; j++) if (mat[i][j] == 1) cout << " " << j;
        cout << "\\n";
    }
    return 0;
}
`,
    py: `n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
for i in range(1, n + 1):
    neigh = [j for j in range(1, n + 1) if mat[i - 1][j - 1] == 1]
    print(str(i) + ":" + "".join(" " + str(v) for v in neigh))
`,
    tests: ["4\n0 1 0 0\n1 0 1 0\n0 1 0 1\n0 0 1 0", "3\n0 0 0\n0 0 0\n0 0 0", "1\n0", "4\n0 1 1 1\n1 0 1 1\n1 1 0 1\n1 1 1 0", "2\n0 1\n1 0"],
  },
  // ===================== GRUPA 2: GRADE =====================
  {
    slug: "g-gradul-unui-nod",
    title: "Gradul unui nod",
    difficulty: "easy",
    tags: ["grafuri", "grade"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, si un nod x. Determinati gradul nodului x (numarul de muchii incidente).",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie. Pe ultima linie se citeste x.",
    output_format: "Se afiseaza un singur numar: gradul nodului x.",
    constraints: "1 <= n <= 100000, 0 <= m <= 100000, 1 <= x <= n",
    hints: "Numarati de cate ori apare x printre capetele muchiilor, sau tineti direct un vector de grade actualizat la citire.",
    explanation: "Gradul unui nod intr-un graf neorientat este numarul de muchii care il au drept capat. Se poate calcula direct la citire, incrementand grad[x] si grad[y] pentru fiecare muchie x-y.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<int> grad(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        grad[x]++; grad[y]++;
    }
    int x; cin >> x;
    cout << grad[x] << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
grad = [0] * (n + 1)
for _ in range(m):
    x, y = map(int, input().split())
    grad[x] += 1
    grad[y] += 1
x = int(input())
print(grad[x])
`,
    tests: ["5 4\n1 2\n1 3\n1 4\n1 5\n1", "5 4\n1 2\n1 3\n1 4\n1 5\n2", "4 0\n3", "6 6\n1 2\n1 3\n1 4\n2 3\n5 6\n4 5\n5", "1 0\n1"],
  },
  {
    slug: "g-gradul-maxim",
    title: "Nodul cu gradul maxim",
    difficulty: "easy",
    tags: ["grafuri", "grade"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii. Determinati nodul de grad maxim si valoarea gradului sau. Daca exista mai multe noduri cu grad maxim, afisati-l pe cel cu indicele cel mai mic.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza doua numere separate prin spatiu: indicele nodului de grad maxim si valoarea gradului sau.",
    constraints: "1 <= n <= 100000, 0 <= m <= 100000",
    hints: "Calculati vectorul de grade, apoi parcurgeti-l o singura data pentru a gasi maximul si primul indice la care este atins.",
    explanation: "Se calculeaza gradul fiecarui nod ca la problema anterioara, apoi se parcurge vectorul de grade de la 1 la n, retinand primul nod la care se atinge valoarea maxima intalnita pana in acel moment.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<int> grad(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        grad[x]++; grad[y]++;
    }
    int best = 1;
    for (int i = 2; i <= n; i++) if (grad[i] > grad[best]) best = i;
    cout << best << " " << grad[best] << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
grad = [0] * (n + 1)
for _ in range(m):
    x, y = map(int, input().split())
    grad[x] += 1
    grad[y] += 1
best = 1
for i in range(2, n + 1):
    if grad[i] > grad[best]:
        best = i
print(best, grad[best])
`,
    tests: ["5 4\n1 2\n1 3\n1 4\n1 5", "4 0", "1 0", "6 6\n1 2\n1 3\n1 4\n2 3\n5 6\n4 5", "4 3\n2 3\n2 4\n3 4"],
  },
  {
    slug: "g-gradul-minim",
    title: "Nodul cu gradul minim",
    difficulty: "easy",
    tags: ["grafuri", "grade"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii. Determinati nodul de grad minim si valoarea gradului sau. Daca exista mai multe noduri cu grad minim, afisati-l pe cel cu indicele cel mai mic.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza doua numere separate prin spatiu: indicele nodului de grad minim si valoarea gradului sau.",
    constraints: "1 <= n <= 100000, 0 <= m <= 100000",
    hints: "Analog cu gradul maxim, dar comparati pentru minim in loc de maxim.",
    explanation: "Identic ca tehnica cu determinarea gradului maxim, doar ca se retine minimul intalnit pana la fiecare pas si primul indice la care acesta este atins.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<int> grad(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        grad[x]++; grad[y]++;
    }
    int best = 1;
    for (int i = 2; i <= n; i++) if (grad[i] < grad[best]) best = i;
    cout << best << " " << grad[best] << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
grad = [0] * (n + 1)
for _ in range(m):
    x, y = map(int, input().split())
    grad[x] += 1
    grad[y] += 1
best = 1
for i in range(2, n + 1):
    if grad[i] < grad[best]:
        best = i
print(best, grad[best])
`,
    tests: ["5 4\n1 2\n1 3\n1 4\n1 5", "4 0", "1 0", "6 6\n1 2\n1 3\n1 4\n2 3\n5 6\n4 5", "4 3\n2 3\n2 4\n3 4"],
  },
  {
    slug: "g-secventa-grade",
    title: "Secventa gradelor",
    difficulty: "easy",
    tags: ["grafuri", "grade"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii. Afisati secventa gradelor nodurilor, sortata descrescator.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza n numere separate prin spatiu, reprezentand gradele nodurilor, in ordine descrescatoare.",
    constraints: "1 <= n <= 100000, 0 <= m <= 100000",
    hints: "Calculati vectorul de grade, apoi sortati-l descrescator.",
    explanation: "Secventa gradelor este vectorul gradelor tuturor nodurilor asezat descrescator; ea nu identifica nodurile individual, ci doar 'profilul' de conectivitate al grafului.\n\n**Complexitate:** O(n log n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<int> grad(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        grad[x]++; grad[y]++;
    }
    vector<int> seq(grad.begin() + 1, grad.end());
    sort(seq.rbegin(), seq.rend());
    for (int i = 0; i < n; i++) cout << seq[i] << (i + 1 < n ? " " : "\\n");
    return 0;
}
`,
    py: `n, m = map(int, input().split())
grad = [0] * (n + 1)
for _ in range(m):
    x, y = map(int, input().split())
    grad[x] += 1
    grad[y] += 1
seq = sorted(grad[1:], reverse=True)
print(" ".join(map(str, seq)))
`,
    tests: ["5 4\n1 2\n1 3\n1 4\n1 5", "4 0", "1 0", "6 6\n1 2\n1 3\n1 4\n2 3\n5 6\n4 5", "4 6\n1 2\n1 3\n1 4\n2 3\n2 4\n3 4"],
  },
  {
    slug: "g-suma-gradelor",
    title: "Suma gradelor nodurilor",
    difficulty: "easy",
    tags: ["grafuri", "grade"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii. Calculati suma gradelor tuturor nodurilor.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza un singur numar: suma gradelor.",
    constraints: "1 <= n <= 100000, 0 <= m <= 100000",
    hints: "Conform lemei stransurii de maini, suma gradelor este intotdeauna egala cu dublul numarului de muchii, deci raspunsul este 2*m.",
    explanation: "Lema stransurii de maini (handshake lemma) afirma ca suma gradelor tuturor nodurilor unui graf neorientat este egala cu 2*m, deoarece fiecare muchie contribuie cu exact 1 la gradul fiecaruia dintre cele doua capete ale sale. Solutia poate calcula suma direct din vectorul de grade sau, echivalent, returna 2*m.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n, m; cin >> n >> m;
    vector<long long> grad(n + 1, 0);
    for (long long i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        grad[x]++; grad[y]++;
    }
    long long suma = 0;
    for (long long i = 1; i <= n; i++) suma += grad[i];
    cout << suma << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
grad = [0] * (n + 1)
for _ in range(m):
    x, y = map(int, input().split())
    grad[x] += 1
    grad[y] += 1
print(sum(grad))
`,
    tests: ["5 4\n1 2\n1 3\n1 4\n1 5", "4 0", "1 0", "6 6\n1 2\n1 3\n1 4\n2 3\n5 6\n4 5", "4 6\n1 2\n1 3\n1 4\n2 3\n2 4\n3 4"],
  },
  {
    slug: "g-noduri-izolate",
    title: "Numarul de noduri izolate",
    difficulty: "easy",
    tags: ["grafuri", "grade"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii. Determinati numarul de noduri izolate (cu gradul 0) si afisati-le indicii in ordine crescatoare.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Pe prima linie se afiseaza numarul de noduri izolate. Pe a doua linie se afiseaza indicii lor, in ordine crescatoare, separati prin spatiu (linie goala daca nu exista).",
    constraints: "1 <= n <= 100000, 0 <= m <= 100000",
    hints: "Un nod este izolat daca gradul sau este 0, adica nu apare in nicio muchie.",
    explanation: "Se calculeaza gradul fiecarui nod, apoi se selecteaza cele cu grad 0. Parcurgand nodurile in ordine de la 1 la n, lista rezultata este automat sortata crescator.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<int> grad(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        grad[x]++; grad[y]++;
    }
    vector<int> izolate;
    for (int i = 1; i <= n; i++) if (grad[i] == 0) izolate.push_back(i);
    cout << izolate.size() << "\\n";
    for (size_t i = 0; i < izolate.size(); i++) cout << izolate[i] << (i + 1 < izolate.size() ? " " : "");
    cout << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
grad = [0] * (n + 1)
for _ in range(m):
    x, y = map(int, input().split())
    grad[x] += 1
    grad[y] += 1
izolate = [i for i in range(1, n + 1) if grad[i] == 0]
print(len(izolate))
print(" ".join(map(str, izolate)))
`,
    tests: ["5 2\n1 2\n1 3", "4 0", "1 0", "6 6\n1 2\n1 3\n1 4\n2 3\n5 6\n4 5", "4 6\n1 2\n1 3\n1 4\n2 3\n2 4\n3 4"],
  },
  {
    slug: "g-noduri-grad-impar",
    title: "Noduri cu grad impar",
    difficulty: "easy",
    tags: ["grafuri", "grade"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii. Determinati numarul de noduri cu grad impar si afisati-le indicii in ordine crescatoare.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Pe prima linie se afiseaza numarul de noduri cu grad impar. Pe a doua linie se afiseaza indicii lor, in ordine crescatoare, separati prin spatiu (linie goala daca nu exista).",
    constraints: "1 <= n <= 100000, 0 <= m <= 100000",
    hints: "Un corolar al lemei stransurii de maini este ca numarul de noduri cu grad impar este intotdeauna par.",
    explanation: "Se calculeaza gradul fiecarui nod si se selecteaza cele impare. Din lema stransurii de maini (suma gradelor = 2*m, mereu para) rezulta ca numarul de noduri cu grad impar este intotdeauna par, deoarece o suma de numere impare in numar impar ar fi impara.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<int> grad(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        grad[x]++; grad[y]++;
    }
    vector<int> impare;
    for (int i = 1; i <= n; i++) if (grad[i] % 2 == 1) impare.push_back(i);
    cout << impare.size() << "\\n";
    for (size_t i = 0; i < impare.size(); i++) cout << impare[i] << (i + 1 < impare.size() ? " " : "");
    cout << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
grad = [0] * (n + 1)
for _ in range(m):
    x, y = map(int, input().split())
    grad[x] += 1
    grad[y] += 1
impare = [i for i in range(1, n + 1) if grad[i] % 2 == 1]
print(len(impare))
print(" ".join(map(str, impare)))
`,
    tests: ["5 2\n1 2\n1 3", "4 0", "1 0", "6 6\n1 2\n1 3\n1 4\n2 3\n5 6\n4 5", "4 3\n1 2\n2 3\n3 4"],
  },
  {
    slug: "g-graf-regulat",
    title: "Verificarea unui graf regulat",
    difficulty: "medium",
    tags: ["grafuri", "grade"],
    statement: "Un graf este regulat daca toate nodurile sale au acelasi grad. Se da un graf neorientat simplu cu n noduri si m muchii. Verificati daca graful este regulat.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Daca graful este regulat, se afiseaza 'DA' urmat de gradul comun, separate prin spatiu. Altfel, se afiseaza 'NU'.",
    constraints: "1 <= n <= 100000, 0 <= m <= 100000",
    hints: "Calculati gradele si comparati fiecare grad cu gradul primului nod.",
    explanation: "Se calculeaza vectorul de grade si se verifica daca toate valorile sunt egale cu grad[1]. Daca da, graful este regulat cu gradul comun grad[1]; altfel nu este regulat.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<int> grad(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        grad[x]++; grad[y]++;
    }
    bool regulat = true;
    for (int i = 2; i <= n; i++) if (grad[i] != grad[1]) regulat = false;
    if (regulat) cout << "DA " << grad[1] << "\\n";
    else cout << "NU\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
grad = [0] * (n + 1)
for _ in range(m):
    x, y = map(int, input().split())
    grad[x] += 1
    grad[y] += 1
regulat = all(grad[i] == grad[1] for i in range(2, n + 1))
if regulat:
    print("DA", grad[1])
else:
    print("NU")
`,
    tests: ["4 4\n1 2\n2 3\n3 4\n4 1", "4 3\n1 2\n2 3\n3 4", "1 0", "5 5\n1 2\n2 3\n3 4\n4 5\n5 1", "4 6\n1 2\n1 3\n1 4\n2 3\n2 4\n3 4"],
  },
  {
    slug: "g-nod-universal",
    title: "Nod universal",
    difficulty: "medium",
    tags: ["grafuri", "grade"],
    statement: "Un nod este universal daca este adiacent cu toate celelalte noduri ale grafului (adica gradul sau este n-1). Se da un graf neorientat simplu cu n noduri si m muchii. Determinati indicele cel mai mic al unui nod universal, sau -1 daca nu exista niciunul.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza un singur numar: indicele celui mai mic nod universal, sau -1 daca nu exista.",
    constraints: "1 <= n <= 100000, 0 <= m <= 100000",
    hints: "Calculati gradele si cautati primul nod al carui grad este exact n-1.",
    explanation: "Se calculeaza gradul fiecarui nod si se cauta, in ordine crescatoare a indicilor, primul nod cu grad[i] == n-1 (adiacent cu toate celelalte n-1 noduri). Daca niciun nod nu indeplineste conditia, raspunsul este -1.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<int> grad(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        grad[x]++; grad[y]++;
    }
    int rez = -1;
    for (int i = 1; i <= n; i++) if (grad[i] == n - 1) { rez = i; break; }
    cout << rez << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
grad = [0] * (n + 1)
for _ in range(m):
    x, y = map(int, input().split())
    grad[x] += 1
    grad[y] += 1
rez = -1
for i in range(1, n + 1):
    if grad[i] == n - 1:
        rez = i
        break
print(rez)
`,
    tests: ["4 5\n1 2\n1 3\n1 4\n2 3\n2 4", "4 3\n1 2\n2 3\n3 4", "1 0", "4 6\n1 2\n1 3\n1 4\n2 3\n2 4\n3 4", "5 4\n2 1\n2 3\n2 4\n2 5"],
  },
  // ===================== GRUPA 3: ADIACENTA SI VECINI =====================
  {
    slug: "g-verificare-adiacenta",
    title: "Verificarea adiacentei a doua noduri",
    difficulty: "easy",
    tags: ["grafuri", "adiacenta"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, apoi q perechi de noduri. Pentru fiecare pereche (a, b), verificati daca a si b sunt adiacente.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie. Urmeaza o linie cu q, apoi q linii, fiecare cu doua numere a si b.",
    output_format: "Pentru fiecare interogare se afiseaza 'DA' daca a si b sunt adiacente, altfel 'NU'.",
    constraints: "1 <= n <= 2000, 0 <= m <= n*(n-1)/2, 1 <= q <= 100000",
    hints: "Construiti o matrice de adiacenta booleana pentru a raspunde la fiecare interogare in timp O(1).",
    explanation: "Cu n de pana la 2000, o matrice booleana de adiacenta incape confortabil in memorie si permite raspunsul la fiecare interogare in timp constant, simplu prin verificarea mat[a][b].\n\n**Complexitate:** O(n^2 + m + q)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<char>> mat(n + 1, vector<char>(n + 1, 0));
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        mat[x][y] = 1; mat[y][x] = 1;
    }
    int q; cin >> q;
    while (q--) {
        int a, b; cin >> a >> b;
        cout << (mat[a][b] ? "DA" : "NU") << "\\n";
    }
    return 0;
}
`,
    py: `import sys
data = sys.stdin.read().split()
idx = 0
n = int(data[idx]); idx += 1
m = int(data[idx]); idx += 1
adj = [set() for _ in range(n + 1)]
for _ in range(m):
    x = int(data[idx]); idx += 1
    y = int(data[idx]); idx += 1
    adj[x].add(y)
    adj[y].add(x)
q = int(data[idx]); idx += 1
out = []
for _ in range(q):
    a = int(data[idx]); idx += 1
    b = int(data[idx]); idx += 1
    out.append("DA" if b in adj[a] else "NU")
print("\\n".join(out))
`,
    tests: ["4 3\n1 2\n2 3\n3 4\n3\n1 2\n1 3\n2 4", "4 0\n2\n1 2\n3 4", "1 0\n1\n1 1", "5 4\n1 2\n1 3\n1 4\n1 5\n5\n1 2\n2 1\n5 1\n2 3\n1 5", "3 3\n1 2\n2 3\n1 3\n3\n1 2\n2 3\n1 3"],
  },
  {
    slug: "g-vecini-nod",
    title: "Vecinii unui nod",
    difficulty: "easy",
    tags: ["grafuri", "adiacenta"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, si un nod x. Afisati vecinii lui x, in ordine crescatoare.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie. Pe ultima linie se citeste x.",
    output_format: "Se afiseaza vecinii nodului x, in ordine crescatoare, separati prin spatiu (linie goala daca nu are vecini).",
    constraints: "1 <= n <= 100000, 0 <= m <= 100000, 1 <= x <= n",
    hints: "Construiti lista de adiacenta a nodului x si sortati-o.",
    explanation: "Se construieste lista de adiacenta doar pentru nodul cerut (sau pentru toate, daca este mai simplu), apoi se sorteaza crescator inainte de afisare.\n\n**Complexitate:** O(n + m log m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
        adj[y].push_back(x);
    }
    int x; cin >> x;
    sort(adj[x].begin(), adj[x].end());
    for (size_t i = 0; i < adj[x].size(); i++) cout << adj[x][i] << (i + 1 < adj[x].size() ? " " : "");
    cout << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    a, b = map(int, input().split())
    adj[a].append(b)
    adj[b].append(a)
x = int(input())
adj[x].sort()
print(" ".join(map(str, adj[x])))
`,
    tests: ["5 4\n1 2\n1 3\n1 4\n1 5\n1", "5 4\n1 2\n1 3\n1 4\n1 5\n2", "4 0\n3", "6 6\n1 2\n1 3\n1 4\n2 3\n5 6\n4 5\n5", "1 0\n1"],
  },
  {
    slug: "g-vecini-comuni",
    title: "Vecinii comuni a doua noduri",
    difficulty: "medium",
    tags: ["grafuri", "adiacenta"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, si doua noduri a si b. Determinati vecinii comuni ai celor doua noduri, in ordine crescatoare.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie. Pe ultima linie se citesc a si b.",
    output_format: "Se afiseaza vecinii comuni ai lui a si b, in ordine crescatoare, separati prin spatiu (linie goala daca nu exista).",
    constraints: "1 <= n <= 2000, 0 <= m <= n*(n-1)/2",
    hints: "Construiti matricea de adiacenta si parcurgeti toate nodurile de la 1 la n, retinand cele adiacente atat cu a cat si cu b.",
    explanation: "Se construieste matricea de adiacenta, apoi se parcurg toate nodurile v de la 1 la n, selectand cele pentru care mat[a][v] si mat[b][v] sunt ambele adevarate. Parcurgerea in ordine crescatoare garanteaza rezultatul sortat.\n\n**Complexitate:** O(n^2)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<char>> mat(n + 1, vector<char>(n + 1, 0));
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        mat[x][y] = 1; mat[y][x] = 1;
    }
    int a, b; cin >> a >> b;
    vector<int> comuni;
    for (int v = 1; v <= n; v++) if (mat[a][v] && mat[b][v]) comuni.push_back(v);
    for (size_t i = 0; i < comuni.size(); i++) cout << comuni[i] << (i + 1 < comuni.size() ? " " : "");
    cout << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
adj = [set() for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].add(y)
    adj[y].add(x)
a, b = map(int, input().split())
comuni = [v for v in range(1, n + 1) if v in adj[a] and v in adj[b]]
print(" ".join(map(str, comuni)))
`,
    tests: ["5 5\n1 2\n1 3\n2 3\n2 4\n3 4\n2 3", "4 3\n1 2\n1 3\n1 4\n2 3", "4 2\n1 2\n3 4\n1 2", "6 6\n1 2\n1 3\n1 4\n2 3\n5 6\n4 5\n1 5", "1 0\n1 1"],
  },
  {
    slug: "g-numar-vecini-comuni",
    title: "Numarul de vecini comuni",
    difficulty: "medium",
    tags: ["grafuri", "adiacenta"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, apoi q perechi de noduri. Pentru fiecare pereche (a, b), determinati numarul de vecini comuni ai celor doua noduri.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie. Urmeaza o linie cu q, apoi q linii, fiecare cu doua numere a si b.",
    output_format: "Pentru fiecare interogare se afiseaza numarul de vecini comuni, cate unul pe linie.",
    constraints: "1 <= n <= 500, 0 <= m <= n*(n-1)/2, 1 <= q <= 2000",
    hints: "Construiti matricea de adiacenta si, pentru fiecare interogare, numarati nodurile v pentru care mat[a][v] si mat[b][v] sunt ambele adevarate.",
    explanation: "Cu n de pana la 500, se poate raspunde la fiecare interogare printr-o parcurgere O(n) a tuturor nodurilor, verificand adiacenta cu ambele capete folosind matricea de adiacenta.\n\n**Complexitate:** O(n^2 + q*n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<char>> mat(n + 1, vector<char>(n + 1, 0));
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        mat[x][y] = 1; mat[y][x] = 1;
    }
    int q; cin >> q;
    while (q--) {
        int a, b; cin >> a >> b;
        int cnt = 0;
        for (int v = 1; v <= n; v++) if (mat[a][v] && mat[b][v]) cnt++;
        cout << cnt << "\\n";
    }
    return 0;
}
`,
    py: `n, m = map(int, input().split())
adj = [set() for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].add(y)
    adj[y].add(x)
q = int(input())
out = []
for _ in range(q):
    a, b = map(int, input().split())
    out.append(str(len(adj[a] & adj[b])))
print("\\n".join(out))
`,
    tests: ["5 5\n1 2\n1 3\n2 3\n2 4\n3 4\n2\n2 3\n1 4", "4 3\n1 2\n1 3\n1 4\n1\n2 3", "4 2\n1 2\n3 4\n1\n1 2", "1 0\n1\n1 1", "6 6\n1 2\n1 3\n1 4\n2 3\n5 6\n4 5\n2\n1 5\n2 4"],
  },
  // ===================== GRUPA 4: PROPRIETATI SI CURATARE =====================
  {
    slug: "g-verificare-graf-simplu",
    title: "Verificarea unui graf simplu",
    difficulty: "easy",
    tags: ["grafuri", "proprietati"],
    statement: "Se da o lista de m muchii pe n noduri, care poate contine autobucle (muchii de forma x-x) sau muchii multiple (aceeasi pereche de noduri repetata). Verificati daca graful descris este simplu (fara autobucle si fara muchii multiple).",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza 'DA' daca graful este simplu, altfel 'NU'.",
    constraints: "1 <= n <= 100000, 0 <= m <= 100000",
    hints: "O muchie x-y cu x == y este o autobucla. Folositi o structura de tip set pentru a detecta perechile repetate (normalizate ca min-max).",
    explanation: "Se citesc toate muchiile; daca vreuna are x == y, graful nu este simplu (are autobucla). Altfel se normalizeaza fiecare muchie ca perechea (min(x,y), max(x,y)) si se verifica, folosind un set, daca aceeasi pereche apare de mai multe ori.\n\n**Complexitate:** O(m log m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    set<pair<int,int>> vazute;
    bool simplu = true;
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        if (x == y) simplu = false;
        int a = min(x, y), b = max(x, y);
        if (vazute.count({a, b})) simplu = false;
        vazute.insert({a, b});
    }
    cout << (simplu ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
vazute = set()
simplu = True
for _ in range(m):
    x, y = map(int, input().split())
    if x == y:
        simplu = False
    a, b = min(x, y), max(x, y)
    if (a, b) in vazute:
        simplu = False
    vazute.add((a, b))
print("DA" if simplu else "NU")
`,
    tests: ["4 3\n1 2\n2 3\n3 4", "3 1\n1 1", "3 2\n1 2\n2 1", "4 4\n1 2\n2 3\n3 4\n1 2", "1 0"],
  },
  {
    slug: "g-eliminare-duplicate-muchii",
    title: "Curatarea listei de muchii",
    difficulty: "medium",
    tags: ["grafuri", "proprietati"],
    statement: "Se da o lista de m muchii pe n noduri, care poate contine autobucle si muchii multiple. Determinati lista curata de muchii distincte (fara autobucle, fiecare pereche aparand o singura data).",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Pe prima linie se afiseaza numarul de muchii distincte ramase. Urmeaza acele muchii, cate una pe linie, sub forma i j (i < j), sortate crescator dupa i, apoi dupa j.",
    constraints: "1 <= n <= 100000, 0 <= m <= 100000",
    hints: "Ignorati perechile cu x == y si adaugati restul, normalizate ca (min, max), intr-un set pentru a elimina duplicatele.",
    explanation: "Se ignora orice muchie cu x == y (autobucla), iar restul se normalizeaza ca (min(x,y), max(x,y)) si se introduc intr-un set ordonat, care elimina automat duplicatele si pastreaza ordinea crescatoare la afisare.\n\n**Complexitate:** O(m log m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    set<pair<int,int>> muchii;
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        if (x == y) continue;
        muchii.insert({min(x, y), max(x, y)});
    }
    cout << muchii.size() << "\\n";
    for (auto& e : muchii) cout << e.first << " " << e.second << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
muchii = set()
for _ in range(m):
    x, y = map(int, input().split())
    if x == y:
        continue
    muchii.add((min(x, y), max(x, y)))
rez = sorted(muchii)
print(len(rez))
for a, b in rez:
    print(a, b)
`,
    tests: ["4 5\n1 2\n2 3\n3 4\n1 2\n2 1", "3 3\n1 1\n2 2\n1 2", "4 0", "5 6\n1 2\n1 3\n1 2\n2 1\n4 4\n4 5", "1 0"],
  },
  {
    slug: "g-numar-muchii-lipsa",
    title: "Cate muchii pot fi adaugate",
    difficulty: "easy",
    tags: ["grafuri", "proprietati"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii. Determinati cate muchii mai pot fi adaugate pana cand graful devine complet.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza un singur numar: numarul de muchii care mai pot fi adaugate.",
    constraints: "1 <= n <= 100000, 0 <= m <= n*(n-1)/2",
    hints: "Un graf complet cu n noduri are exact n*(n-1)/2 muchii. Raspunsul este diferenta dintre acest numar si m.",
    explanation: "Numarul maxim de muchii al unui graf simplu cu n noduri este n*(n-1)/2 (fiecare pereche de noduri distincte poate fi conectata o singura data). Diferenta fata de m reprezinta cate muchii mai pot fi adaugate pana la completitudine.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n, m; cin >> n >> m;
    for (long long i = 0; i < m; i++) { int x, y; cin >> x >> y; }
    long long maxim = n * (n - 1) / 2;
    cout << (maxim - m) << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
for _ in range(m):
    input()
maxim = n * (n - 1) // 2
print(maxim - m)
`,
    tests: ["4 3\n1 2\n2 3\n3 4", "4 0", "1 0", "5 10\n1 2\n1 3\n1 4\n1 5\n2 3\n2 4\n2 5\n3 4\n3 5\n4 5", "6 6\n1 2\n1 3\n1 4\n2 3\n5 6\n4 5"],
  },
  {
    slug: "g-verificare-graf-complet",
    title: "Verificarea unui graf complet",
    difficulty: "easy",
    tags: ["grafuri", "proprietati"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii. Verificati daca graful este complet (orice doua noduri distincte sunt adiacente).",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza 'DA' daca graful este complet, altfel 'NU'.",
    constraints: "1 <= n <= 300, 0 <= m <= n*(n-1)/2",
    hints: "Un graf simplu cu n noduri este complet daca si numai daca are exact n*(n-1)/2 muchii.",
    explanation: "Deoarece graful este garantat simplu (fara autobucle si fara muchii multiple), este suficient sa se compare numarul de muchii m cu numarul maxim posibil n*(n-1)/2: egalitatea implica faptul ca fiecare pereche de noduri este conectata.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n, m; cin >> n >> m;
    for (long long i = 0; i < m; i++) { int x, y; cin >> x >> y; }
    cout << (m == n * (n - 1) / 2 ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
for _ in range(m):
    input()
print("DA" if m == n * (n - 1) // 2 else "NU")
`,
    tests: ["4 6\n1 2\n1 3\n1 4\n2 3\n2 4\n3 4", "4 3\n1 2\n2 3\n3 4", "1 0", "3 3\n1 2\n2 3\n1 3", "5 9\n1 2\n1 3\n1 4\n1 5\n2 3\n2 4\n2 5\n3 4\n3 5"],
  },
  {
    slug: "g-graf-complement",
    title: "Graful complementar",
    difficulty: "medium",
    tags: ["grafuri", "proprietati"],
    statement: "Graful complementar al unui graf G cu n noduri contine exact muchiile care lipsesc din G (adica perechile de noduri distincte care NU sunt adiacente in G). Se da un graf neorientat simplu cu n noduri si m muchii. Determinati muchiile graful complementar.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Pe prima linie se afiseaza numarul de muchii ale complementului. Urmeaza acele muchii, cate una pe linie, sub forma i j (i < j), sortate crescator dupa i, apoi dupa j.",
    constraints: "1 <= n <= 300, 0 <= m <= n*(n-1)/2",
    hints: "Construiti matricea de adiacenta, apoi parcurgeti toate perechile (i, j) cu i < j si selectati-le pe cele fara muchie in graful original.",
    explanation: "Se construieste matricea de adiacenta a grafului dat, apoi se parcurg toate perechile (i, j) cu i < j; cele care nu sunt marcate ca muchie in graful original formeaza exact muchiile complementului. Parcurgerea in ordine crescatoare garanteaza afisarea sortata.\n\n**Complexitate:** O(n^2)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<char>> mat(n + 1, vector<char>(n + 1, 0));
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        mat[x][y] = 1; mat[y][x] = 1;
    }
    vector<pair<int,int>> comp;
    for (int i = 1; i <= n; i++)
        for (int j = i + 1; j <= n; j++)
            if (!mat[i][j]) comp.push_back({i, j});
    cout << comp.size() << "\\n";
    for (auto& e : comp) cout << e.first << " " << e.second << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
adj = [set() for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].add(y)
    adj[y].add(x)
comp = []
for i in range(1, n + 1):
    for j in range(i + 1, n + 1):
        if j not in adj[i]:
            comp.append((i, j))
print(len(comp))
for a, b in comp:
    print(a, b)
`,
    tests: ["4 3\n1 2\n2 3\n3 4", "4 6\n1 2\n1 3\n1 4\n2 3\n2 4\n3 4", "1 0", "3 0", "5 4\n1 2\n1 3\n1 4\n1 5"],
  },
  {
    slug: "g-verificare-bipartitie-data",
    title: "Verificarea unei partitii bipartite date",
    difficulty: "medium",
    tags: ["grafuri", "bipartit"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, impreuna cu o colorare a nodurilor cu doua culori (0 si 1). Verificati daca aceasta colorare este o bipartitie valida, adica orice muchie leaga un nod de culoare 0 cu unul de culoare 1.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie. Pe ultima linie se citesc n numere: culoarea c[1], c[2], ..., c[n] (0 sau 1).",
    output_format: "Se afiseaza 'DA' daca partitia este valida, altfel 'NU'.",
    constraints: "1 <= n <= 100000, 0 <= m <= 100000",
    hints: "Pentru fiecare muchie x-y, verificati ca c[x] != c[y]. Daca exista o muchie cu ambele capete de aceeasi culoare, partitia nu este valida.",
    explanation: "O partitie bipartita este valida daca si numai daca fiecare muchie 'traverseaza' cele doua clase de culoare, adica are capetele de culori diferite. Se verifica aceasta conditie pentru fiecare muchie citita.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<pair<int,int>> muchii(m);
    for (int i = 0; i < m; i++) cin >> muchii[i].first >> muchii[i].second;
    vector<int> c(n + 1);
    for (int i = 1; i <= n; i++) cin >> c[i];
    bool valid = true;
    for (auto& e : muchii) if (c[e.first] == c[e.second]) valid = false;
    cout << (valid ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
muchii = [tuple(map(int, input().split())) for _ in range(m)]
c = [0] + list(map(int, input().split()))
valid = all(c[x] != c[y] for x, y in muchii)
print("DA" if valid else "NU")
`,
    tests: ["4 4\n1 2\n2 3\n3 4\n4 1\n0 1 0 1", "3 3\n1 2\n2 3\n1 3\n0 1 0", "4 3\n1 2\n2 3\n3 4\n0 1 1 0", "1 0\n0", "5 4\n1 2\n2 3\n3 4\n4 5\n0 1 0 1 0"],
  },
  // ===================== GRUPA 5: CONEXITATE SI ARBORI =====================
  {
    slug: "g-verificare-graf-conex",
    title: "Verificarea conexitatii unui graf",
    difficulty: "medium",
    tags: ["grafuri", "conexitate"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii. Verificati daca graful este conex, adica exista drum intre oricare doua noduri.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza 'DA' daca graful este conex, altfel 'NU'.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000",
    hints: "Porniti o parcurgere (BFS sau DFS) din nodul 1 si verificati daca ati atins toate cele n noduri.",
    explanation: "Se porneste o parcurgere in latime (BFS) din nodul 1 si se numara nodurile vizitate; daca acest numar este egal cu n, atunci exista drum de la nodul 1 catre orice alt nod, deci graful este conex (relatia de conexitate fiind tranzitiva pentru grafuri neorientate).\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
        adj[y].push_back(x);
    }
    vector<bool> viz(n + 1, false);
    queue<int> q;
    q.push(1); viz[1] = true;
    int count = 1;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) if (!viz[v]) { viz[v] = true; count++; q.push(v); }
    }
    cout << (count == n ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y)
    adj[y].append(x)
viz = [False] * (n + 1)
viz[1] = True
cnt = 1
q = deque([1])
while q:
    u = q.popleft()
    for v in adj[u]:
        if not viz[v]:
            viz[v] = True
            cnt += 1
            q.append(v)
print("DA" if cnt == n else "NU")
`,
    tests: ["4 3\n1 2\n2 3\n3 4", "4 2\n1 2\n3 4", "1 0", "6 5\n1 2\n2 3\n3 4\n4 5\n5 6", "5 4\n1 2\n2 3\n4 5\n1 3"],
  },
  {
    slug: "g-numar-componente-conexe",
    title: "Numarul de componente conexe",
    difficulty: "medium",
    tags: ["grafuri", "conexitate"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii. Determinati numarul de componente conexe ale grafului.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza un singur numar: numarul de componente conexe.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000",
    hints: "Porniti cate o parcurgere (BFS/DFS) din fiecare nod nevizitat inca si numarati de cate ori incepeti o noua parcurgere.",
    explanation: "Se parcurge fiecare nod de la 1 la n; daca nu a fost inca vizitat, se porneste o noua parcurgere BFS/DFS din el, marcand toate nodurile atinse, si se incrementeaza numarul de componente. La final, numarul de parcurgeri pornite este numarul de componente conexe.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
        adj[y].push_back(x);
    }
    vector<bool> viz(n + 1, false);
    int comp = 0;
    for (int s = 1; s <= n; s++) {
        if (viz[s]) continue;
        comp++;
        queue<int> q; q.push(s); viz[s] = true;
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int v : adj[u]) if (!viz[v]) { viz[v] = true; q.push(v); }
        }
    }
    cout << comp << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y)
    adj[y].append(x)
viz = [False] * (n + 1)
comp = 0
for s in range(1, n + 1):
    if viz[s]:
        continue
    comp += 1
    q = deque([s])
    viz[s] = True
    while q:
        u = q.popleft()
        for v in adj[u]:
            if not viz[v]:
                viz[v] = True
                q.append(v)
print(comp)
`,
    tests: ["6 3\n1 2\n2 3\n4 5", "4 0", "1 0", "6 5\n1 2\n2 3\n3 4\n4 5\n5 6", "7 4\n1 2\n3 4\n5 6\n1 3"],
  },
  {
    slug: "g-verificare-graf-arbore",
    title: "Verificarea daca un graf este arbore",
    difficulty: "medium",
    tags: ["grafuri", "arbori"],
    statement: "Un graf neorientat cu n noduri este arbore daca este conex si are exact n-1 muchii. Se da un graf neorientat simplu cu n noduri si m muchii. Verificati daca acesta este arbore.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza 'DA' daca graful este arbore, altfel 'NU'.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000",
    hints: "Verificati mai intai daca m == n-1 (conditie necesara). Daca da, verificati si conexitatea printr-o parcurgere.",
    explanation: "Un graf cu n noduri este arbore daca si numai daca este conex si are exact n-1 muchii; oricare dintre cele doua conditii, impreuna cu absenta ciclurilor, o implica pe cealalta pentru un graf cu m = n-1 muchii. Se verifica intai rapid m == n-1, apoi conexitatea printr-o parcurgere BFS.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
        adj[y].push_back(x);
    }
    if (m != n - 1) { cout << "NU\\n"; return 0; }
    vector<bool> viz(n + 1, false);
    queue<int> q; q.push(1); viz[1] = true;
    int cnt = 1;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) if (!viz[v]) { viz[v] = true; cnt++; q.push(v); }
    }
    cout << (cnt == n ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y)
    adj[y].append(x)
if m != n - 1:
    print("NU")
else:
    viz = [False] * (n + 1)
    viz[1] = True
    cnt = 1
    q = deque([1])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if not viz[v]:
                viz[v] = True
                cnt += 1
                q.append(v)
    print("DA" if cnt == n else "NU")
`,
    tests: ["4 3\n1 2\n2 3\n3 4", "4 3\n1 2\n2 3\n1 3", "1 0", "5 4\n1 2\n1 3\n1 4\n1 5", "6 4\n1 2\n2 3\n4 5\n5 6"],
  },
  {
    slug: "g-verificare-graf-padure",
    title: "Verificarea daca un graf este padure",
    difficulty: "medium",
    tags: ["grafuri", "arbori"],
    statement: "O padure este un graf neorientat fara cicluri (fiecare componenta conexa a sa este un arbore). Se da un graf neorientat simplu cu n noduri si m muchii. Verificati daca acesta este o padure.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza 'DA' daca graful este padure, altfel 'NU'.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000",
    hints: "Un graf este padure daca si numai daca numarul de muchii este egal cu n minus numarul de componente conexe.",
    explanation: "Fiecare componenta conexa cu k noduri este arbore (fara cicluri) daca si numai daca are exact k-1 muchii. Insumand pe toate componentele, graful este padure daca si numai daca m = n - (numarul de componente conexe). Se determina numarul de componente printr-o parcurgere si se verifica egalitatea.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
        adj[y].push_back(x);
    }
    vector<bool> viz(n + 1, false);
    int comp = 0;
    for (int s = 1; s <= n; s++) {
        if (viz[s]) continue;
        comp++;
        queue<int> q; q.push(s); viz[s] = true;
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int v : adj[u]) if (!viz[v]) { viz[v] = true; q.push(v); }
        }
    }
    cout << (m == n - comp ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y)
    adj[y].append(x)
viz = [False] * (n + 1)
comp = 0
for s in range(1, n + 1):
    if viz[s]:
        continue
    comp += 1
    q = deque([s])
    viz[s] = True
    while q:
        u = q.popleft()
        for v in adj[u]:
            if not viz[v]:
                viz[v] = True
                q.append(v)
print("DA" if m == n - comp else "NU")
`,
    tests: ["6 3\n1 2\n2 3\n4 5", "4 4\n1 2\n2 3\n3 4\n1 3", "1 0", "6 4\n1 2\n2 3\n4 5\n5 6", "5 5\n1 2\n1 3\n1 4\n1 5\n2 3"],
  },
  {
    slug: "g-subgraf-indus",
    title: "Subgraful indus de o submultime de noduri",
    difficulty: "medium",
    tags: ["grafuri", "proprietati"],
    statement: "Subgraful indus de o submultime S de noduri contine doar nodurile din S si acele muchii ale grafului original ale caror ambele capete apartin lui S. Se da un graf neorientat simplu cu n noduri, m muchii, si o submultime S de k noduri. Determinati muchiile subgrafului indus de S.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie. Urmeaza o linie cu k, apoi o linie cu cele k noduri din S.",
    output_format: "Pe prima linie se afiseaza numarul de muchii ale subgrafului indus. Urmeaza acele muchii, cate una pe linie, sub forma i j (i < j), sortate crescator dupa i, apoi dupa j.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= k <= n",
    hints: "Marcati nodurile din S intr-un vector boolean, apoi parcurgeti muchiile grafului original si pastrati doar pe cele cu ambele capete marcate.",
    explanation: "Se marcheaza apartenenta la S intr-un vector boolean, apoi se parcurg toate muchiile grafului original, retinandu-le pe cele cu ambele capete in S (normalizate ca (min,max) pentru afisare determinista). La final, lista rezultata se sorteaza.\n\n**Complexitate:** O(n + m log m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<pair<int,int>> muchii(m);
    for (int i = 0; i < m; i++) cin >> muchii[i].first >> muchii[i].second;
    int k; cin >> k;
    vector<bool> inS(n + 1, false);
    for (int i = 0; i < k; i++) { int v; cin >> v; inS[v] = true; }
    vector<pair<int,int>> rez;
    for (auto& e : muchii) {
        if (inS[e.first] && inS[e.second]) rez.push_back({min(e.first, e.second), max(e.first, e.second)});
    }
    sort(rez.begin(), rez.end());
    cout << rez.size() << "\\n";
    for (auto& e : rez) cout << e.first << " " << e.second << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
muchii = [tuple(map(int, input().split())) for _ in range(m)]
k = int(input())
S = set(map(int, input().split())) if k > 0 else set()
rez = []
for x, y in muchii:
    if x in S and y in S:
        rez.append((min(x, y), max(x, y)))
rez.sort()
print(len(rez))
for a, b in rez:
    print(a, b)
`,
    tests: ["5 5\n1 2\n2 3\n3 4\n4 5\n1 3\n3\n1 2 3", "5 5\n1 2\n2 3\n3 4\n4 5\n1 3\n2\n2 4", "4 6\n1 2\n1 3\n1 4\n2 3\n2 4\n3 4\n4\n1 2 3 4", "1 0\n1\n1", "6 4\n1 2\n2 3\n4 5\n5 6\n3\n1 4 6"],
  },
  {
    slug: "g-verificare-subgraf",
    title: "Verificarea relatiei de subgraf",
    difficulty: "medium",
    tags: ["grafuri", "proprietati"],
    statement: "Se dau doua grafuri neorientate simple, G1 si G2, cu acelasi numar n de noduri. Verificati daca G1 este subgraf al lui G2, adica fiecare muchie din G1 exista si in G2.",
    input_format: "Pe prima linie se citeste n. Urmeaza m1 (numarul de muchii ale lui G1) si cele m1 muchii, apoi m2 (numarul de muchii ale lui G2) si cele m2 muchii.",
    output_format: "Se afiseaza 'DA' daca G1 este subgraf al lui G2, altfel 'NU'.",
    constraints: "1 <= n <= 100000, 0 <= m1, m2 <= 200000",
    hints: "Construiti multimea muchiilor lui G2 (normalizate ca perechi min-max), apoi verificati ca fiecare muchie a lui G1 se regaseste in aceasta multime.",
    explanation: "Se construieste un set cu toate muchiile lui G2, normalizate ca (min,max). Apoi se verifica, pentru fiecare muchie a lui G1, daca perechea corespunzatoare apartine acestui set; daca toate se regasesc, G1 este subgraf al lui G2.\n\n**Complexitate:** O((m1 + m2) log m2)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    int m1; cin >> m1;
    vector<pair<int,int>> g1(m1);
    for (int i = 0; i < m1; i++) cin >> g1[i].first >> g1[i].second;
    int m2; cin >> m2;
    set<pair<int,int>> g2;
    for (int i = 0; i < m2; i++) {
        int x, y; cin >> x >> y;
        g2.insert({min(x, y), max(x, y)});
    }
    bool ok = true;
    for (auto& e : g1) if (!g2.count({min(e.first, e.second), max(e.first, e.second)})) ok = false;
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `n = int(input())
m1 = int(input())
g1 = [tuple(map(int, input().split())) for _ in range(m1)]
m2 = int(input())
g2 = set()
for _ in range(m2):
    x, y = map(int, input().split())
    g2.add((min(x, y), max(x, y)))
ok = all((min(x, y), max(x, y)) in g2 for x, y in g1)
print("DA" if ok else "NU")
`,
    tests: ["4\n2\n1 2\n2 3\n3\n1 2\n2 3\n3 4", "4\n2\n1 2\n1 4\n2\n1 2\n2 3", "4\n0\n3\n1 2\n2 3\n3 4", "1\n0\n0", "5\n3\n1 2\n2 3\n4 5\n3\n1 2\n2 3\n4 5"],
  },
  {
    slug: "g-triunghiuri-numar",
    title: "Numarul de triunghiuri dintr-un graf",
    difficulty: "medium",
    tags: ["grafuri", "proprietati"],
    statement: "Un triunghi intr-un graf neorientat este o multime de 3 noduri, oricare doua dintre ele fiind adiacente. Se da un graf neorientat simplu cu n noduri si m muchii. Determinati numarul de triunghiuri din graf.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza un singur numar: numarul de triunghiuri.",
    constraints: "1 <= n <= 400, 0 <= m <= n*(n-1)/2",
    hints: "Pentru fiecare muchie (u, v), numarul de triunghiuri care o contin este numarul de vecini comuni ai lui u si v. Sumand aceste valori pe toate muchiile si impartind la 3 (fiecare triunghi este numarat o data pentru fiecare din cele 3 muchii ale sale) se obtine raspunsul.",
    explanation: "Se reprezinta vecinatatea fiecarui nod ca o masca de biti (un intreg pe care bitul j este 1 daca nodurile sunt adiacente). Pentru fiecare muchie (u, v), numarul de vecini comuni se obtine facand SI logic intre mastile lui u si v si numarand bitii de 1. Suma acestor valori pe toate muchiile numara fiecare triunghi de exact 3 ori (o data pentru fiecare muchie a sa), deci raspunsul final se obtine impartind suma la 3.\n\n**Complexitate:** O(n*m / 64) folosind masti de biti",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<bitset<401>> adj(n + 1);
    vector<pair<int,int>> edges(m);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x][y] = 1; adj[y][x] = 1;
        edges[i] = {x, y};
    }
    long long tri = 0;
    for (auto& e : edges) tri += (adj[e.first] & adj[e.second]).count();
    tri /= 3;
    cout << tri << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
adj = [0] * (n + 1)
edges = []
for _ in range(m):
    x, y = map(int, input().split())
    adj[x] |= (1 << y)
    adj[y] |= (1 << x)
    edges.append((x, y))
tri = 0
for x, y in edges:
    tri += bin(adj[x] & adj[y]).count("1")
print(tri // 3)
`,
    tests: ["3 3\n1 2\n2 3\n1 3", "4 3\n1 2\n2 3\n3 4", "4 6\n1 2\n1 3\n1 4\n2 3\n2 4\n3 4", "1 0", "6 9\n1 2\n1 3\n2 3\n3 4\n4 5\n4 6\n5 6\n1 4\n2 5"],
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
