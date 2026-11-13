const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade11", chapter: "grafuri", sub: "arbori-radacina" };

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
  // ===================== GRUPA A: STRUCTURA DE BAZA =====================
  {
    slug: "g-arbore-parinte-fiecare-nod",
    title: "Parintele fiecarui nod intr-un arbore cu radacina",
    difficulty: "easy",
    tags: ["grafuri", "arbore", "radacina"],
    statement: "Se da un arbore cu n noduri si radacina r. Determinati parintele fiecarui nod.",
    input_format: "Pe prima linie se citesc n si r. Urmeaza n-1 linii, fiecare cu doua numere x y, reprezentand o muchie a arborelui.",
    output_format: "Se afiseaza n numere separate prin spatiu: parintele nodului 1, 2, ..., n (0 pentru radacina).",
    constraints: "1 <= n <= 100000, 1 <= r <= n",
    hints: "Porniti o parcurgere BFS/DFS din r; de fiecare data cand descoperiti un vecin nou, acesta devine parintele lui in arbore.",
    explanation: "Deoarece structura este un arbore (conex, cu exact n-1 muchii), o parcurgere BFS pornita din radacina r orienteaza implicit fiecare muchie dinspre parinte spre copil: primul nod care descopera un vecin ii devine parinte.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, r; cin >> n >> r;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> parent(n + 1, -1);
    parent[r] = 0;
    queue<int> q; q.push(r);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) if (parent[v] == -1) { parent[v] = u; q.push(v); }
    }
    for (int i = 1; i <= n; i++) cout << parent[i] << (i < n ? " " : "\\n");
    return 0;
}
`,
    py: `from collections import deque
n, r = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
parent = [-1] * (n + 1)
parent[r] = 0
q = deque([r])
while q:
    u = q.popleft()
    for v in adj[u]:
        if parent[v] == -1:
            parent[v] = u
            q.append(v)
print(" ".join(map(str, parent[1:])))
`,
    tests: ["5 1\n1 2\n1 3\n2 4\n2 5", "5 3\n1 2\n1 3\n2 4\n2 5", "1 1", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6", "4 2\n1 2\n2 3\n3 4"],
  },
  {
    slug: "g-arbore-adancime-fiecare-nod",
    title: "Adancimea fiecarui nod intr-un arbore cu radacina",
    difficulty: "easy",
    tags: ["grafuri", "arbore", "radacina"],
    statement: "Se da un arbore cu n noduri si radacina r. Determinati adancimea (nivelul) fiecarui nod fata de radacina.",
    input_format: "Pe prima linie se citesc n si r. Urmeaza n-1 linii, fiecare cu doua numere x y, reprezentand o muchie a arborelui.",
    output_format: "Se afiseaza n numere separate prin spatiu: adancimea nodului 1, 2, ..., n (radacina are adancimea 0).",
    constraints: "1 <= n <= 100000, 1 <= r <= n",
    hints: "Rulati BFS din r; adancimea unui nod nou descoperit este adancimea parintelui plus 1.",
    explanation: "Adancimea unui nod este numarul de muchii de pe drumul unic de la radacina la el; se calculeaza direct printr-o parcurgere BFS din r.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, r; cin >> n >> r;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> depth(n + 1, -1);
    depth[r] = 0;
    queue<int> q; q.push(r);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) if (depth[v] == -1) { depth[v] = depth[u] + 1; q.push(v); }
    }
    for (int i = 1; i <= n; i++) cout << depth[i] << (i < n ? " " : "\\n");
    return 0;
}
`,
    py: `from collections import deque
n, r = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
depth = [-1] * (n + 1)
depth[r] = 0
q = deque([r])
while q:
    u = q.popleft()
    for v in adj[u]:
        if depth[v] == -1:
            depth[v] = depth[u] + 1
            q.append(v)
print(" ".join(map(str, depth[1:])))
`,
    tests: ["5 1\n1 2\n1 3\n2 4\n2 5", "5 3\n1 2\n1 3\n2 4\n2 5", "1 1", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6", "4 2\n1 2\n2 3\n3 4"],
  },
  {
    slug: "g-arbore-numar-copii",
    title: "Numarul de copii ai fiecarui nod",
    difficulty: "easy",
    tags: ["grafuri", "arbore", "radacina"],
    statement: "Se da un arbore cu n noduri si radacina r. Determinati numarul de copii directi ai fiecarui nod.",
    input_format: "Pe prima linie se citesc n si r. Urmeaza n-1 linii, fiecare cu doua numere x y, reprezentand o muchie a arborelui.",
    output_format: "Se afiseaza n numere separate prin spatiu: numarul de copii ai nodului 1, 2, ..., n.",
    constraints: "1 <= n <= 100000, 1 <= r <= n",
    hints: "Determinati parintele fiecarui nod (BFS din r), apoi numarati de cate ori apare fiecare nod ca parinte.",
    explanation: "Copiii unui nod sunt exact vecinii sai (in arborele neorientat) diferiti de parintele sau. Se calculeaza parintele fiecarui nod printr-o parcurgere BFS, apoi se numara aparitiile fiecarui nod ca parinte al altuia.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, r; cin >> n >> r;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> parent(n + 1, -1);
    parent[r] = 0;
    queue<int> q; q.push(r);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) if (parent[v] == -1) { parent[v] = u; q.push(v); }
    }
    vector<int> numCopii(n + 1, 0);
    for (int i = 1; i <= n; i++) if (parent[i] != 0) numCopii[parent[i]]++;
    for (int i = 1; i <= n; i++) cout << numCopii[i] << (i < n ? " " : "\\n");
    return 0;
}
`,
    py: `from collections import deque
n, r = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
parent = [-1] * (n + 1)
parent[r] = 0
q = deque([r])
while q:
    u = q.popleft()
    for v in adj[u]:
        if parent[v] == -1:
            parent[v] = u
            q.append(v)
numCopii = [0] * (n + 1)
for i in range(1, n + 1):
    if parent[i] != 0:
        numCopii[parent[i]] += 1
print(" ".join(map(str, numCopii[1:])))
`,
    tests: ["5 1\n1 2\n1 3\n2 4\n2 5", "5 3\n1 2\n1 3\n2 4\n2 5", "1 1", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6", "4 2\n1 2\n2 3\n3 4"],
  },
  {
    slug: "g-arbore-noduri-frunza",
    title: "Nodurile frunza ale unui arbore cu radacina",
    difficulty: "easy",
    tags: ["grafuri", "arbore", "radacina"],
    statement: "Se da un arbore cu n noduri si radacina r. O frunza este un nod fara copii. Determinati toate nodurile frunza.",
    input_format: "Pe prima linie se citesc n si r. Urmeaza n-1 linii, fiecare cu doua numere x y, reprezentand o muchie a arborelui.",
    output_format: "Pe prima linie se afiseaza numarul de frunze. Pe a doua linie se afiseaza indicii lor, in ordine crescatoare, separati prin spatiu.",
    constraints: "1 <= n <= 100000, 1 <= r <= n",
    hints: "Calculati numarul de copii ai fiecarui nod (ca la problema anterioara); frunzele sunt nodurile cu 0 copii.",
    explanation: "Se calculeaza numarul de copii ai fiecarui nod ca la problema anterioara, apoi se selecteaza cele cu 0 copii; parcurse in ordine 1..n, rezultatul este automat sortat crescator. Daca n = 1, radacina insasi este singura frunza.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, r; cin >> n >> r;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> parent(n + 1, -1);
    parent[r] = 0;
    queue<int> q; q.push(r);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) if (parent[v] == -1) { parent[v] = u; q.push(v); }
    }
    vector<int> numCopii(n + 1, 0);
    for (int i = 1; i <= n; i++) if (parent[i] != 0) numCopii[parent[i]]++;
    vector<int> frunze;
    for (int i = 1; i <= n; i++) if (numCopii[i] == 0) frunze.push_back(i);
    cout << frunze.size() << "\\n";
    for (size_t i = 0; i < frunze.size(); i++) cout << frunze[i] << (i + 1 < frunze.size() ? " " : "\\n");
    return 0;
}
`,
    py: `from collections import deque
n, r = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
parent = [-1] * (n + 1)
parent[r] = 0
q = deque([r])
while q:
    u = q.popleft()
    for v in adj[u]:
        if parent[v] == -1:
            parent[v] = u
            q.append(v)
numCopii = [0] * (n + 1)
for i in range(1, n + 1):
    if parent[i] != 0:
        numCopii[parent[i]] += 1
frunze = [i for i in range(1, n + 1) if numCopii[i] == 0]
print(len(frunze))
print(" ".join(map(str, frunze)))
`,
    tests: ["5 1\n1 2\n1 3\n2 4\n2 5", "5 3\n1 2\n1 3\n2 4\n2 5", "1 1", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6", "4 2\n1 2\n2 3\n3 4"],
  },
  {
    slug: "g-arbore-inaltime",
    title: "Inaltimea unui arbore cu radacina",
    difficulty: "easy",
    tags: ["grafuri", "arbore", "radacina"],
    statement: "Se da un arbore cu n noduri si radacina r. Determinati inaltimea arborelui (adancimea maxima a unui nod).",
    input_format: "Pe prima linie se citesc n si r. Urmeaza n-1 linii, fiecare cu doua numere x y, reprezentand o muchie a arborelui.",
    output_format: "Se afiseaza un singur numar: inaltimea arborelui.",
    constraints: "1 <= n <= 100000, 1 <= r <= n",
    hints: "Calculati adancimea fiecarui nod prin BFS din r si retineti maximul.",
    explanation: "Inaltimea arborelui este cea mai mare adancime intalnita printre toate nodurile, calculata printr-o simpla parcurgere BFS din radacina r.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, r; cin >> n >> r;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> depth(n + 1, -1);
    depth[r] = 0;
    queue<int> q; q.push(r);
    int best = 0;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        best = max(best, depth[u]);
        for (int v : adj[u]) if (depth[v] == -1) { depth[v] = depth[u] + 1; q.push(v); }
    }
    cout << best << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, r = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
depth = [-1] * (n + 1)
depth[r] = 0
q = deque([r])
best = 0
while q:
    u = q.popleft()
    best = max(best, depth[u])
    for v in adj[u]:
        if depth[v] == -1:
            depth[v] = depth[u] + 1
            q.append(v)
print(best)
`,
    tests: ["5 1\n1 2\n1 3\n2 4\n2 5", "5 3\n1 2\n1 3\n2 4\n2 5", "1 1", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6", "4 2\n1 2\n2 3\n3 4"],
  },
  {
    slug: "g-arbore-stramosi-nod",
    title: "Stramosii unui nod",
    difficulty: "medium",
    tags: ["grafuri", "arbore", "radacina"],
    statement: "Se da un arbore cu n noduri si radacina r, si un nod x. Afisati stramosii lui x, in ordine de la parintele sau direct pana la radacina.",
    input_format: "Pe prima linie se citesc n si r. Urmeaza n-1 linii, fiecare cu doua numere x y, reprezentand o muchie a arborelui. Pe ultima linie se citeste nodul x cerut.",
    output_format: "Pe prima linie se afiseaza numarul de stramosi. Pe a doua linie se afiseaza stramosii, incepand cu parintele direct al lui x si terminand cu radacina.",
    constraints: "1 <= n <= 100000, 1 <= r <= n",
    hints: "Calculati parintele fiecarui nod, apoi urcati de la x catre radacina, colectand fiecare parinte intalnit.",
    explanation: "Se calculeaza parintele fiecarui nod printr-o parcurgere BFS din r, apoi se urmareste lantul de parinti incepand de la x pana se ajunge la radacina (al carei parinte este 0), colectand fiecare nod intalnit pe drum.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, r; cin >> n >> r;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> parent(n + 1, -1);
    parent[r] = 0;
    queue<int> q; q.push(r);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) if (parent[v] == -1) { parent[v] = u; q.push(v); }
    }
    int x; cin >> x;
    vector<int> anc;
    int cur = parent[x];
    while (cur != 0) { anc.push_back(cur); cur = parent[cur]; }
    cout << anc.size() << "\\n";
    for (size_t i = 0; i < anc.size(); i++) cout << anc[i] << (i + 1 < anc.size() ? " " : "");
    cout << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, r = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
parent = [-1] * (n + 1)
parent[r] = 0
q = deque([r])
while q:
    u = q.popleft()
    for v in adj[u]:
        if parent[v] == -1:
            parent[v] = u
            q.append(v)
x = int(input())
anc = []
cur = parent[x]
while cur != 0:
    anc.append(cur)
    cur = parent[cur]
print(len(anc))
print(" ".join(map(str, anc)))
`,
    tests: ["6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n6", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n1", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n5", "1 1\n1", "5 3\n1 2\n1 3\n2 4\n2 5\n4"],
  },
  {
    slug: "g-arbore-numar-descendenti",
    title: "Numarul de descendenti ai unui nod",
    difficulty: "medium",
    tags: ["grafuri", "arbore", "radacina"],
    statement: "Se da un arbore cu n noduri si radacina r, si un nod x. Determinati numarul de descendenti ai lui x (nodurile din subarborele sau, excluzand x insusi).",
    input_format: "Pe prima linie se citesc n si r. Urmeaza n-1 linii, fiecare cu doua numere x y, reprezentand o muchie a arborelui. Pe ultima linie se citeste nodul cerut.",
    output_format: "Se afiseaza un singur numar: numarul de descendenti ai nodului cerut.",
    constraints: "1 <= n <= 100000, 1 <= r <= n",
    hints: "Calculati marimea subarborelui fiecarui nod printr-o programare dinamica de tip bottom-up (procesand nodurile in ordinea inversa a descoperirii BFS, care garanteaza ca fiecare copil este procesat inaintea parintelui sau), apoi scadeti 1.",
    explanation: "Marimea subarborelui unui nod se calculeaza recursiv ca 1 plus suma marimilor subarborilor copiilor sai. Procesand nodurile in ordinea inversa a unei parcurgeri BFS (in care parintele apare intotdeauna inaintea copilului), se garanteaza ca fiecare nod este procesat abia dupa toti descendentii sai directi, permitand un calcul iterativ corect fara recursivitate. Numarul de descendenti este marimea subarborelui minus 1 (excluzand nodul insusi).\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, r; cin >> n >> r;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> parent(n + 1, -1);
    vector<int> order;
    parent[r] = 0;
    queue<int> q; q.push(r);
    while (!q.empty()) {
        int u = q.front(); q.pop(); order.push_back(u);
        for (int v : adj[u]) if (parent[v] == -1) { parent[v] = u; q.push(v); }
    }
    vector<long long> size(n + 1, 1);
    for (int i = (int)order.size() - 1; i >= 0; i--) {
        int u = order[i];
        if (parent[u] != 0) size[parent[u]] += size[u];
    }
    int x; cin >> x;
    cout << (size[x] - 1) << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, r = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
parent = [-1] * (n + 1)
order = []
parent[r] = 0
q = deque([r])
while q:
    u = q.popleft()
    order.append(u)
    for v in adj[u]:
        if parent[v] == -1:
            parent[v] = u
            q.append(v)
size = [1] * (n + 1)
for u in reversed(order):
    if parent[u] != 0:
        size[parent[u]] += size[u]
x = int(input())
print(size[x] - 1)
`,
    tests: ["6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n2", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n1", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n5", "1 1\n1", "5 3\n1 2\n1 3\n2 4\n2 5\n1"],
  },
  // ===================== GRUPA B: SUBARBORI SI EULER TOUR =====================
  {
    slug: "g-arbore-marime-subarbore",
    title: "Marimea subarborelui fiecarui nod",
    difficulty: "medium",
    tags: ["grafuri", "arbore", "radacina"],
    statement: "Se da un arbore cu n noduri si radacina r. Determinati marimea subarborelui fiecarui nod (numarul de noduri, inclusiv el insusi).",
    input_format: "Pe prima linie se citesc n si r. Urmeaza n-1 linii, fiecare cu doua numere x y, reprezentand o muchie a arborelui.",
    output_format: "Se afiseaza n numere separate prin spatiu: marimea subarborelui nodului 1, 2, ..., n.",
    constraints: "1 <= n <= 100000, 1 <= r <= n",
    hints: "Procesati nodurile in ordinea inversa a descoperirii BFS din r, adunand marimea fiecarui nod la marimea parintelui sau.",
    explanation: "Marimea subarborelui unui nod este 1 (el insusi) plus suma marimilor subarborilor tuturor copiilor sai. Procesand nodurile in ordinea inversa a descoperirii BFS (unde fiecare copil apare dupa parintele sau, deci in ordine inversa fiecare copil e procesat inaintea parintelui), acumularea se face corect fara recursivitate.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, r; cin >> n >> r;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> parent(n + 1, -1);
    vector<int> order;
    parent[r] = 0;
    queue<int> q; q.push(r);
    while (!q.empty()) {
        int u = q.front(); q.pop(); order.push_back(u);
        for (int v : adj[u]) if (parent[v] == -1) { parent[v] = u; q.push(v); }
    }
    vector<long long> size(n + 1, 1);
    for (int i = (int)order.size() - 1; i >= 0; i--) {
        int u = order[i];
        if (parent[u] != 0) size[parent[u]] += size[u];
    }
    for (int i = 1; i <= n; i++) cout << size[i] << (i < n ? " " : "\\n");
    return 0;
}
`,
    py: `from collections import deque
n, r = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
parent = [-1] * (n + 1)
order = []
parent[r] = 0
q = deque([r])
while q:
    u = q.popleft()
    order.append(u)
    for v in adj[u]:
        if parent[v] == -1:
            parent[v] = u
            q.append(v)
size = [1] * (n + 1)
for u in reversed(order):
    if parent[u] != 0:
        size[parent[u]] += size[u]
print(" ".join(map(str, size[1:])))
`,
    tests: ["5 1\n1 2\n1 3\n2 4\n2 5", "5 3\n1 2\n1 3\n2 4\n2 5", "1 1", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6", "4 2\n1 2\n2 3\n3 4"],
  },
  {
    slug: "g-arbore-suma-subarbore",
    title: "Suma valorilor din subarborele fiecarui nod",
    difficulty: "medium",
    tags: ["grafuri", "arbore", "radacina"],
    statement: "Se da un arbore cu n noduri si radacina r, unde fiecare nod are asociata o valoare. Determinati suma valorilor din subarborele fiecarui nod (inclusiv el insusi).",
    input_format: "Pe prima linie se citesc n si r. Urmeaza n-1 linii, fiecare cu doua numere x y, reprezentand o muchie a arborelui. Pe ultima linie se citesc n numere: valoarea nodului 1, 2, ..., n.",
    output_format: "Se afiseaza n numere separate prin spatiu: suma valorilor din subarborele nodului 1, 2, ..., n.",
    constraints: "1 <= n <= 100000, 1 <= r <= n, -1000 <= valoare <= 1000",
    hints: "Analog cu marimea subarborelui, dar in loc sa adunati 1 pentru fiecare nod, initializati suma cu valoarea proprie a acestuia.",
    explanation: "Se aplica aceeasi tehnica de acumulare bottom-up (procesare in ordinea inversa a descoperirii BFS), dar initializand suma fiecarui nod cu valoarea sa proprie in loc de 1, si adunand suma fiecarui copil la suma parintelui.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, r; cin >> n >> r;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> parent(n + 1, -1);
    vector<int> order;
    parent[r] = 0;
    queue<int> q; q.push(r);
    while (!q.empty()) {
        int u = q.front(); q.pop(); order.push_back(u);
        for (int v : adj[u]) if (parent[v] == -1) { parent[v] = u; q.push(v); }
    }
    vector<long long> val(n + 1);
    for (int i = 1; i <= n; i++) cin >> val[i];
    vector<long long> sum(val);
    for (int i = (int)order.size() - 1; i >= 0; i--) {
        int u = order[i];
        if (parent[u] != 0) sum[parent[u]] += sum[u];
    }
    for (int i = 1; i <= n; i++) cout << sum[i] << (i < n ? " " : "\\n");
    return 0;
}
`,
    py: `from collections import deque
n, r = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
parent = [-1] * (n + 1)
order = []
parent[r] = 0
q = deque([r])
while q:
    u = q.popleft()
    order.append(u)
    for v in adj[u]:
        if parent[v] == -1:
            parent[v] = u
            q.append(v)
val = [0] + list(map(int, input().split()))
sm = val[:]
for u in reversed(order):
    if parent[u] != 0:
        sm[parent[u]] += sm[u]
print(" ".join(map(str, sm[1:])))
`,
    tests: ["5 1\n1 2\n1 3\n2 4\n2 5\n1 2 3 4 5", "5 3\n1 2\n1 3\n2 4\n2 5\n1 2 3 4 5", "1 1\n7", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n1 1 1 1 1 1", "4 2\n1 2\n2 3\n3 4\n-1 2 -3 4"],
  },
  {
    slug: "g-arbore-verificare-stramos",
    title: "Verificarea relatiei de stramos",
    difficulty: "medium",
    tags: ["grafuri", "arbore", "euler-tour"],
    statement: "Se da un arbore cu n noduri si radacina r, si doua noduri a si b. Verificati daca a este stramos al lui b (a este diferit de b si se afla pe drumul de la radacina la b).",
    input_format: "Pe prima linie se citesc n si r. Urmeaza n-1 linii, fiecare cu doua numere x y, reprezentand o muchie a arborelui. Pe ultima linie se citesc a si b.",
    output_format: "Se afiseaza 'DA' daca a este stramos al lui b, altfel 'NU'.",
    constraints: "1 <= n <= 100000, 1 <= r <= n",
    hints: "Calculati, printr-o parcurgere DFS, timpul de intrare (tin) si timpul de iesire (tout) al fiecarui nod. Nodul a este stramos al lui b daca si numai daca tin[a] <= tin[b] si tout[b] <= tout[a], si a != b.",
    explanation: "Un 'Euler tour' al arborelui (o parcurgere DFS ce retine momentul intrarii si al iesirii din fiecare nod) are proprietatea ca intervalul [tin[u], tout[u]] al unui nod u contine, prin includere, exact intervalele tuturor descendentilor sai. Astfel, a este stramos al lui b daca si numai daca intervalul lui a il contine complet pe cel al lui b (si a != b).\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, r; cin >> n >> r;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> tin(n + 1), tout(n + 1), it(n + 1, 0), visited(n + 1, 0);
    int timer = 0;
    vector<int> stack; stack.push_back(r); visited[r] = 1;
    tin[r] = timer++;
    while (!stack.empty()) {
        int u = stack.back();
        if (it[u] < (int)adj[u].size()) {
            int v = adj[u][it[u]++];
            if (!visited[v]) { visited[v] = 1; tin[v] = timer++; stack.push_back(v); }
        } else {
            tout[u] = timer++;
            stack.pop_back();
        }
    }
    int a, b; cin >> a >> b;
    bool anc = (a != b) && (tin[a] <= tin[b]) && (tout[b] <= tout[a]);
    cout << (anc ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `n, r = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
tin = [0] * (n + 1)
tout = [0] * (n + 1)
it = [0] * (n + 1)
visited = [0] * (n + 1)
timer = 0
stack = [r]
visited[r] = 1
tin[r] = timer
timer += 1
while stack:
    u = stack[-1]
    if it[u] < len(adj[u]):
        v = adj[u][it[u]]
        it[u] += 1
        if not visited[v]:
            visited[v] = 1
            tin[v] = timer
            timer += 1
            stack.append(v)
    else:
        tout[u] = timer
        timer += 1
        stack.pop()
a, b = map(int, input().split())
anc = a != b and tin[a] <= tin[b] and tout[b] <= tout[a]
print("DA" if anc else "NU")
`,
    tests: ["6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n1 5", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n3 5", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n5 5", "1 1\n1 1", "5 3\n1 2\n1 3\n2 4\n2 5\n3 4"],
  },
  {
    slug: "g-arbore-nod-in-subarbore",
    title: "Verificarea apartenentei la un subarbore",
    difficulty: "medium",
    tags: ["grafuri", "arbore", "euler-tour"],
    statement: "Se da un arbore cu n noduri si radacina r, apoi q interogari, fiecare cu doua noduri x si y. Pentru fiecare interogare, verificati daca x apartine subarborelui lui y (inclusiv cazul x = y).",
    input_format: "Pe prima linie se citesc n si r. Urmeaza n-1 linii cu cate o muchie. Urmeaza o linie cu q, apoi q linii, fiecare cu doua numere x si y.",
    output_format: "Pentru fiecare interogare se afiseaza 'DA' daca x apartine subarborelui lui y, altfel 'NU'.",
    constraints: "1 <= n <= 100000, 1 <= r <= n, 1 <= q <= 100000",
    hints: "Calculati timpii tin/tout ai unui Euler tour. Nodul x apartine subarborelui lui y daca si numai daca tin[y] <= tin[x] <= tout[y].",
    explanation: "Se calculeaza, printr-o singura parcurgere DFS (Euler tour), intervalul [tin[u], tout[u]] al fiecarui nod, care contine exact intervalele tuturor nodurilor din subarborele sau (inclusiv el insusi). Astfel, fiecare interogare se rezolva in O(1) verificand daca tin[x] se afla in intervalul lui y.\n\n**Complexitate:** O(n + q)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, r; cin >> n >> r;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> tin(n + 1), tout(n + 1), it(n + 1, 0), visited(n + 1, 0);
    int timer = 0;
    vector<int> stack; stack.push_back(r); visited[r] = 1;
    tin[r] = timer++;
    while (!stack.empty()) {
        int u = stack.back();
        if (it[u] < (int)adj[u].size()) {
            int v = adj[u][it[u]++];
            if (!visited[v]) { visited[v] = 1; tin[v] = timer++; stack.push_back(v); }
        } else {
            tout[u] = timer++;
            stack.pop_back();
        }
    }
    int q; cin >> q;
    string out;
    while (q--) {
        int x, y; cin >> x >> y;
        bool in_sub = (tin[y] <= tin[x] && tin[x] <= tout[y]);
        out += in_sub ? "DA" : "NU"; out += "\\n";
    }
    cout << out;
    return 0;
}
`,
    py: `import sys
def main():
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx]); idx += 1
    r = int(data[idx]); idx += 1
    adj = [[] for _ in range(n + 1)]
    for _ in range(n - 1):
        x = int(data[idx]); idx += 1
        y = int(data[idx]); idx += 1
        adj[x].append(y); adj[y].append(x)
    tin = [0] * (n + 1)
    tout = [0] * (n + 1)
    it = [0] * (n + 1)
    visited = [0] * (n + 1)
    timer = 0
    stack = [r]
    visited[r] = 1
    tin[r] = timer
    timer += 1
    while stack:
        u = stack[-1]
        if it[u] < len(adj[u]):
            v = adj[u][it[u]]
            it[u] += 1
            if not visited[v]:
                visited[v] = 1
                tin[v] = timer
                timer += 1
                stack.append(v)
        else:
            tout[u] = timer
            timer += 1
            stack.pop()
    q = int(data[idx]); idx += 1
    out = []
    for _ in range(q):
        x = int(data[idx]); idx += 1
        y = int(data[idx]); idx += 1
        out.append("DA" if tin[y] <= tin[x] <= tout[y] else "NU")
    print("\\n".join(out))
main()
`,
    tests: ["6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n3\n5 2\n6 2\n1 1", "1 1\n1\n1 1", "5 3\n1 2\n1 3\n2 4\n2 5\n2\n4 1\n1 4", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n2\n2 2\n3 1", "4 2\n1 2\n2 3\n3 4\n2\n4 3\n1 3"],
  },
  {
    slug: "g-arbore-frunze-in-subarbore",
    title: "Numarul de frunze dintr-un subarbore",
    difficulty: "medium",
    tags: ["grafuri", "arbore", "radacina"],
    statement: "Se da un arbore cu n noduri si radacina r, si un nod x. Determinati numarul de frunze (ale intregului arbore) care se afla in subarborele lui x.",
    input_format: "Pe prima linie se citesc n si r. Urmeaza n-1 linii cu cate o muchie. Pe ultima linie se citeste nodul cerut.",
    output_format: "Se afiseaza numarul de frunze din subarborele nodului cerut.",
    constraints: "1 <= n <= 100000, 1 <= r <= n",
    hints: "Procesati nodurile in ordinea inversa a descoperirii BFS: daca un nod nu are copii, contorul sau de frunze este 1, altfel este suma contoarelor copiilor.",
    explanation: "Se calculeaza pentru fiecare nod u contorul leafCount[u] = numarul de frunze din subarborele lui u, printr-o programare dinamica bottom-up: daca u este frunza (fara copii), leafCount[u] = 1; altfel, leafCount[u] este suma leafCount ale copiilor sai.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, r; cin >> n >> r;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> parent(n + 1, -1);
    vector<int> order;
    parent[r] = 0;
    queue<int> q; q.push(r);
    while (!q.empty()) {
        int u = q.front(); q.pop(); order.push_back(u);
        for (int v : adj[u]) if (parent[v] == -1) { parent[v] = u; q.push(v); }
    }
    vector<int> numCopii(n + 1, 0);
    for (int i = 1; i <= n; i++) if (parent[i] != 0) numCopii[parent[i]]++;
    vector<long long> leafCount(n + 1);
    for (int i = 1; i <= n; i++) if (numCopii[i] == 0) leafCount[i] = 1;
    for (int i = (int)order.size() - 1; i >= 0; i--) {
        int u = order[i];
        if (parent[u] != 0) leafCount[parent[u]] += leafCount[u];
    }
    int x; cin >> x;
    cout << leafCount[x] << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, r = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
parent = [-1] * (n + 1)
order = []
parent[r] = 0
q = deque([r])
while q:
    u = q.popleft()
    order.append(u)
    for v in adj[u]:
        if parent[v] == -1:
            parent[v] = u
            q.append(v)
numCopii = [0] * (n + 1)
for i in range(1, n + 1):
    if parent[i] != 0:
        numCopii[parent[i]] += 1
leafCount = [1 if numCopii[i] == 0 else 0 for i in range(n + 1)]
for u in reversed(order):
    if parent[u] != 0:
        leafCount[parent[u]] += leafCount[u]
x = int(input())
print(leafCount[x])
`,
    tests: ["6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n1", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n2", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n4", "1 1\n1", "5 3\n1 2\n1 3\n2 4\n2 5\n3"],
  },
  {
    slug: "g-arbore-inaltime-subarbore",
    title: "Inaltimea subarborelui unui nod",
    difficulty: "medium",
    tags: ["grafuri", "arbore", "radacina"],
    statement: "Se da un arbore cu n noduri si radacina r, si un nod x. Determinati inaltimea subarborelui lui x (adancimea maxima relativa la x a unui nod din subarborele sau).",
    input_format: "Pe prima linie se citesc n si r. Urmeaza n-1 linii cu cate o muchie. Pe ultima linie se citeste nodul cerut.",
    output_format: "Se afiseaza inaltimea subarborelui nodului cerut (0 daca este frunza).",
    constraints: "1 <= n <= 100000, 1 <= r <= n",
    hints: "Procesati nodurile in ordinea inversa a descoperirii BFS: inaltimea unui nod fara copii este 0, altfel este 1 plus inaltimea maxima dintre copiii sai.",
    explanation: "Se calculeaza, prin programare dinamica bottom-up, height[u] = 0 daca u este frunza, altfel height[u] = 1 + maximul height[c] pentru toti copiii c ai lui u. Raspunsul este height[x].\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, r; cin >> n >> r;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> parent(n + 1, -1);
    vector<int> order;
    parent[r] = 0;
    queue<int> q; q.push(r);
    while (!q.empty()) {
        int u = q.front(); q.pop(); order.push_back(u);
        for (int v : adj[u]) if (parent[v] == -1) { parent[v] = u; q.push(v); }
    }
    vector<long long> height(n + 1, 0);
    for (int i = (int)order.size() - 1; i >= 0; i--) {
        int u = order[i];
        if (parent[u] != 0) height[parent[u]] = max(height[parent[u]], height[u] + 1);
    }
    int x; cin >> x;
    cout << height[x] << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, r = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
parent = [-1] * (n + 1)
order = []
parent[r] = 0
q = deque([r])
while q:
    u = q.popleft()
    order.append(u)
    for v in adj[u]:
        if parent[v] == -1:
            parent[v] = u
            q.append(v)
height = [0] * (n + 1)
for u in reversed(order):
    if parent[u] != 0:
        height[parent[u]] = max(height[parent[u]], height[u] + 1)
x = int(input())
print(height[x])
`,
    tests: ["6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n1", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n2", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n4", "1 1\n1", "5 3\n1 2\n1 3\n2 4\n2 5\n3"],
  },
  // ===================== GRUPA C: LCA =====================
  {
    slug: "g-arbore-lca-naiv",
    title: "LCA prin urcare directa",
    difficulty: "medium",
    tags: ["grafuri", "arbore", "lca"],
    statement: "Se da un arbore cu n noduri si radacina r, apoi q interogari, fiecare cu doua noduri a si b. Pentru fiecare interogare, determinati cel mai apropiat stramos comun (LCA) al lui a si b.",
    input_format: "Pe prima linie se citesc n si r. Urmeaza n-1 linii cu cate o muchie. Urmeaza o linie cu q, apoi q linii, fiecare cu doua numere a si b.",
    output_format: "Pentru fiecare interogare se afiseaza LCA(a, b).",
    constraints: "1 <= n <= 5000, 1 <= r <= n, 1 <= q <= 5000",
    hints: "Calculati adancimea si parintele fiecarui nod. Pentru fiecare interogare, urcati nodul mai adanc pana ajunge la aceeasi adancime cu celalalt, apoi urcati ambele simultan pana coincid.",
    explanation: "LCA(a, b) se determina egaland mai intai adancimile celor doua noduri (urcand nodul mai adanc catre radacina cu atatia pasi cat este diferenta de adancime), apoi urcand simultan ambele noduri, cate un pas o data, pana cand ajung in acelasi nod -- acel nod este LCA-ul cautat. Aceasta abordare directa are complexitate O(n) in cazul cel mai defavorabil per interogare.\n\n**Complexitate:** O(n) per interogare, O(n*q) total",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, r; cin >> n >> r;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> parent(n + 1, -1), depth(n + 1, -1);
    parent[r] = 0; depth[r] = 0;
    queue<int> q0; q0.push(r);
    while (!q0.empty()) {
        int u = q0.front(); q0.pop();
        for (int v : adj[u]) if (depth[v] == -1) { depth[v] = depth[u] + 1; parent[v] = u; q0.push(v); }
    }
    int q; cin >> q;
    string out;
    while (q--) {
        int a, b; cin >> a >> b;
        while (depth[a] > depth[b]) a = parent[a];
        while (depth[b] > depth[a]) b = parent[b];
        while (a != b) { a = parent[a]; b = parent[b]; }
        out += to_string(a); out += "\\n";
    }
    cout << out;
    return 0;
}
`,
    py: `from collections import deque
n, r = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
parent = [-1] * (n + 1)
depth = [-1] * (n + 1)
parent[r] = 0
depth[r] = 0
q0 = deque([r])
while q0:
    u = q0.popleft()
    for v in adj[u]:
        if depth[v] == -1:
            depth[v] = depth[u] + 1
            parent[v] = u
            q0.append(v)
q = int(input())
out = []
for _ in range(q):
    a, b = map(int, input().split())
    while depth[a] > depth[b]:
        a = parent[a]
    while depth[b] > depth[a]:
        b = parent[b]
    while a != b:
        a = parent[a]
        b = parent[b]
    out.append(str(a))
print("\\n".join(out))
`,
    tests: ["7 1\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n3\n4 5\n4 7\n6 7", "1 1\n1\n1 1", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n2\n4 6\n5 5", "5 3\n1 2\n1 3\n2 4\n2 5\n2\n4 5\n1 4", "8 1\n1 2\n2 3\n3 4\n1 5\n5 6\n6 7\n7 8\n2\n4 8\n3 7"],
  },
  {
    slug: "g-arbore-lca-binary-lifting",
    title: "LCA cu binary lifting",
    difficulty: "hard",
    tags: ["grafuri", "arbore", "lca", "binary-lifting"],
    statement: "Se da un arbore cu n noduri si radacina r, apoi q interogari, fiecare cu doua noduri a si b. Pentru fiecare interogare, determinati cel mai apropiat stramos comun (LCA) al lui a si b, folosind tehnica binary lifting pentru eficienta.",
    input_format: "Pe prima linie se citesc n si r. Urmeaza n-1 linii cu cate o muchie. Urmeaza o linie cu q, apoi q linii, fiecare cu doua numere a si b.",
    output_format: "Pentru fiecare interogare se afiseaza LCA(a, b).",
    constraints: "1 <= n <= 100000, 1 <= r <= n, 1 <= q <= 100000",
    hints: "Precalculati up[k][v] = al (2^k)-lea stramos al lui v, pentru k = 0..log2(n). Pentru fiecare interogare, ridicati mai intai nodul mai adanc la aceeasi adancime folosind salturi binare, apoi cautati binar cea mai mica inaltime la care cele doua noduri devin diferite.",
    explanation: "Binary lifting precalculeaza, pentru fiecare nod si fiecare putere a lui 2, stramosul situat la acea distanta (up[k][v] = up[k-1][up[k-1][v]]), permitand 'saritul' catre orice stramos in O(log n) pasi in loc de O(n). Pentru LCA(a, b): se ridica nodul mai adanc pana la aceeasi adancime folosind biti ai diferentei de adancime, apoi, daca nodurile nu coincid deja, se ridica ambele simultan cu cele mai mari salturi care nu le fac sa coincida -- la final, parintele lor comun direct este LCA-ul.\n\n**Complexitate:** O(n log n) precalcul, O(log n) per interogare",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, r; cin >> n >> r;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    int LOG = 1;
    while ((1 << LOG) < n) LOG++;
    LOG++;
    vector<vector<int>> up(LOG, vector<int>(n + 1, 0));
    vector<int> depth(n + 1, -1);
    depth[r] = 0;
    queue<int> q0; q0.push(r);
    while (!q0.empty()) {
        int u = q0.front(); q0.pop();
        for (int v : adj[u]) if (depth[v] == -1) { depth[v] = depth[u] + 1; up[0][v] = u; q0.push(v); }
    }
    for (int k = 1; k < LOG; k++)
        for (int v = 1; v <= n; v++)
            up[k][v] = up[k - 1][up[k - 1][v]];
    auto lca = [&](int a, int b) {
        if (depth[a] < depth[b]) swap(a, b);
        int diff = depth[a] - depth[b];
        for (int k = 0; k < LOG; k++) if ((diff >> k) & 1) a = up[k][a];
        if (a == b) return a;
        for (int k = LOG - 1; k >= 0; k--) if (up[k][a] != up[k][b]) { a = up[k][a]; b = up[k][b]; }
        return up[0][a];
    };
    int q; cin >> q;
    string out;
    while (q--) {
        int a, b; cin >> a >> b;
        out += to_string(lca(a, b)); out += "\\n";
    }
    cout << out;
    return 0;
}
`,
    py: `import sys
from collections import deque
def main():
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx]); idx += 1
    r = int(data[idx]); idx += 1
    adj = [[] for _ in range(n + 1)]
    for _ in range(n - 1):
        x = int(data[idx]); idx += 1
        y = int(data[idx]); idx += 1
        adj[x].append(y); adj[y].append(x)
    LOG = 1
    while (1 << LOG) < n:
        LOG += 1
    LOG += 1
    up = [[0] * (n + 1) for _ in range(LOG)]
    depth = [-1] * (n + 1)
    depth[r] = 0
    q0 = deque([r])
    while q0:
        u = q0.popleft()
        for v in adj[u]:
            if depth[v] == -1:
                depth[v] = depth[u] + 1
                up[0][v] = u
                q0.append(v)
    for k in range(1, LOG):
        upk, upk1 = up[k], up[k - 1]
        for v in range(1, n + 1):
            upk[v] = upk1[upk1[v]]
    def lca(a, b):
        if depth[a] < depth[b]:
            a, b = b, a
        diff = depth[a] - depth[b]
        k = 0
        while diff:
            if diff & 1:
                a = up[k][a]
            diff >>= 1
            k += 1
        if a == b:
            return a
        for k in range(LOG - 1, -1, -1):
            if up[k][a] != up[k][b]:
                a = up[k][a]
                b = up[k][b]
        return up[0][a]
    q = int(data[idx]); idx += 1
    out = []
    for _ in range(q):
        a = int(data[idx]); idx += 1
        b = int(data[idx]); idx += 1
        out.append(str(lca(a, b)))
    print("\\n".join(out))
main()
`,
    tests: ["7 1\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n3\n4 5\n4 7\n6 7", "1 1\n1\n1 1", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n2\n4 6\n5 5", "5 3\n1 2\n1 3\n2 4\n2 5\n2\n4 5\n1 4", "8 1\n1 2\n2 3\n3 4\n1 5\n5 6\n6 7\n7 8\n2\n4 8\n3 7"],
  },
  {
    slug: "g-arbore-distanta-lca",
    title: "Distanta intre doua noduri folosind LCA",
    difficulty: "hard",
    tags: ["grafuri", "arbore", "lca"],
    statement: "Se da un arbore cu n noduri si radacina r, apoi q interogari, fiecare cu doua noduri a si b. Pentru fiecare interogare, determinati distanta (numarul de muchii) dintre a si b.",
    input_format: "Pe prima linie se citesc n si r. Urmeaza n-1 linii cu cate o muchie. Urmeaza o linie cu q, apoi q linii, fiecare cu doua numere a si b.",
    output_format: "Pentru fiecare interogare se afiseaza distanta dintre a si b.",
    constraints: "1 <= n <= 100000, 1 <= r <= n, 1 <= q <= 100000",
    hints: "Distanta dintre a si b este depth[a] + depth[b] - 2*depth[LCA(a,b)]. Folositi binary lifting pentru a calcula LCA rapid.",
    explanation: "Drumul de la a la b trece obligatoriu prin LCA(a, b): este format din drumul de la a la LCA (de lungime depth[a] - depth[LCA]) urmat de drumul de la LCA la b (de lungime depth[b] - depth[LCA]). Suma acestora da formula distantei: depth[a] + depth[b] - 2*depth[LCA(a,b)].\n\n**Complexitate:** O(n log n) precalcul, O(log n) per interogare",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, r; cin >> n >> r;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    int LOG = 1;
    while ((1 << LOG) < n) LOG++;
    LOG++;
    vector<vector<int>> up(LOG, vector<int>(n + 1, 0));
    vector<int> depth(n + 1, -1);
    depth[r] = 0;
    queue<int> q0; q0.push(r);
    while (!q0.empty()) {
        int u = q0.front(); q0.pop();
        for (int v : adj[u]) if (depth[v] == -1) { depth[v] = depth[u] + 1; up[0][v] = u; q0.push(v); }
    }
    for (int k = 1; k < LOG; k++)
        for (int v = 1; v <= n; v++)
            up[k][v] = up[k - 1][up[k - 1][v]];
    auto lca = [&](int a, int b) {
        if (depth[a] < depth[b]) swap(a, b);
        int diff = depth[a] - depth[b];
        for (int k = 0; k < LOG; k++) if ((diff >> k) & 1) a = up[k][a];
        if (a == b) return a;
        for (int k = LOG - 1; k >= 0; k--) if (up[k][a] != up[k][b]) { a = up[k][a]; b = up[k][b]; }
        return up[0][a];
    };
    int q; cin >> q;
    string out;
    while (q--) {
        int a, b; cin >> a >> b;
        int l = lca(a, b);
        out += to_string(depth[a] + depth[b] - 2 * depth[l]); out += "\\n";
    }
    cout << out;
    return 0;
}
`,
    py: `import sys
from collections import deque
def main():
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx]); idx += 1
    r = int(data[idx]); idx += 1
    adj = [[] for _ in range(n + 1)]
    for _ in range(n - 1):
        x = int(data[idx]); idx += 1
        y = int(data[idx]); idx += 1
        adj[x].append(y); adj[y].append(x)
    LOG = 1
    while (1 << LOG) < n:
        LOG += 1
    LOG += 1
    up = [[0] * (n + 1) for _ in range(LOG)]
    depth = [-1] * (n + 1)
    depth[r] = 0
    q0 = deque([r])
    while q0:
        u = q0.popleft()
        for v in adj[u]:
            if depth[v] == -1:
                depth[v] = depth[u] + 1
                up[0][v] = u
                q0.append(v)
    for k in range(1, LOG):
        upk, upk1 = up[k], up[k - 1]
        for v in range(1, n + 1):
            upk[v] = upk1[upk1[v]]
    def lca(a, b):
        if depth[a] < depth[b]:
            a, b = b, a
        diff = depth[a] - depth[b]
        k = 0
        while diff:
            if diff & 1:
                a = up[k][a]
            diff >>= 1
            k += 1
        if a == b:
            return a
        for k in range(LOG - 1, -1, -1):
            if up[k][a] != up[k][b]:
                a = up[k][a]
                b = up[k][b]
        return up[0][a]
    q = int(data[idx]); idx += 1
    out = []
    for _ in range(q):
        a = int(data[idx]); idx += 1
        b = int(data[idx]); idx += 1
        l = lca(a, b)
        out.append(str(depth[a] + depth[b] - 2 * depth[l]))
    print("\\n".join(out))
main()
`,
    tests: ["7 1\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n3\n4 5\n4 7\n6 7", "1 1\n1\n1 1", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n2\n4 6\n5 5", "5 3\n1 2\n1 3\n2 4\n2 5\n2\n4 5\n1 4", "8 1\n1 2\n2 3\n3 4\n1 5\n5 6\n6 7\n7 8\n2\n4 8\n3 7"],
  },
  {
    slug: "g-arbore-al-k-lea-stramos",
    title: "Al k-lea stramos al unui nod",
    difficulty: "hard",
    tags: ["grafuri", "arbore", "binary-lifting"],
    statement: "Se da un arbore cu n noduri si radacina r, apoi q interogari, fiecare cu un nod x si un numar k. Pentru fiecare interogare, determinati al k-lea stramos al lui x (mergand k pasi catre radacina), sau -1 daca acesta nu exista.",
    input_format: "Pe prima linie se citesc n si r. Urmeaza n-1 linii cu cate o muchie. Urmeaza o linie cu q, apoi q linii, fiecare cu doua numere x si k.",
    output_format: "Pentru fiecare interogare se afiseaza al k-lea stramos al lui x, sau -1 daca k depaseste adancimea lui x.",
    constraints: "1 <= n <= 100000, 1 <= r <= n, 1 <= q <= 100000, 0 <= k <= n",
    hints: "Daca k > adancimea lui x, raspunsul este -1. Altfel, folositi binary lifting: descompuneti k in biti si sariti direct catre stramosul corespunzator.",
    explanation: "Folosind precalcularea binary lifting (up[j][v] = al (2^j)-lea stramos al lui v), orice deplasare de k pasi catre radacina se descompune in suma puterilor de 2 din reprezentarea binara a lui k, aplicand cate un salt up[j] pentru fiecare bit setat al lui k. Daca k depaseste adancimea lui x, un astfel de stramos nu exista.\n\n**Complexitate:** O(n log n) precalcul, O(log n) per interogare",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, r; cin >> n >> r;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    int LOG = 1;
    while ((1 << LOG) < n) LOG++;
    LOG++;
    vector<vector<int>> up(LOG, vector<int>(n + 1, 0));
    vector<int> depth(n + 1, -1);
    depth[r] = 0;
    queue<int> q0; q0.push(r);
    while (!q0.empty()) {
        int u = q0.front(); q0.pop();
        for (int v : adj[u]) if (depth[v] == -1) { depth[v] = depth[u] + 1; up[0][v] = u; q0.push(v); }
    }
    for (int k = 1; k < LOG; k++)
        for (int v = 1; v <= n; v++)
            up[k][v] = up[k - 1][up[k - 1][v]];
    int q; cin >> q;
    string out;
    while (q--) {
        int x, k; cin >> x >> k;
        if (k > depth[x]) { out += "-1\\n"; continue; }
        int cur = x;
        for (int j = 0; j < LOG; j++) if ((k >> j) & 1) cur = up[j][cur];
        out += to_string(cur); out += "\\n";
    }
    cout << out;
    return 0;
}
`,
    py: `import sys
from collections import deque
def main():
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx]); idx += 1
    r = int(data[idx]); idx += 1
    adj = [[] for _ in range(n + 1)]
    for _ in range(n - 1):
        x = int(data[idx]); idx += 1
        y = int(data[idx]); idx += 1
        adj[x].append(y); adj[y].append(x)
    LOG = 1
    while (1 << LOG) < n:
        LOG += 1
    LOG += 1
    up = [[0] * (n + 1) for _ in range(LOG)]
    depth = [-1] * (n + 1)
    depth[r] = 0
    q0 = deque([r])
    while q0:
        u = q0.popleft()
        for v in adj[u]:
            if depth[v] == -1:
                depth[v] = depth[u] + 1
                up[0][v] = u
                q0.append(v)
    for k in range(1, LOG):
        upk, upk1 = up[k], up[k - 1]
        for v in range(1, n + 1):
            upk[v] = upk1[upk1[v]]
    q = int(data[idx]); idx += 1
    out = []
    for _ in range(q):
        x = int(data[idx]); idx += 1
        k = int(data[idx]); idx += 1
        if k > depth[x]:
            out.append("-1")
            continue
        cur = x
        j = 0
        while k:
            if k & 1:
                cur = up[j][cur]
            k >>= 1
            j += 1
        out.append(str(cur))
    print("\\n".join(out))
main()
`,
    tests: ["7 1\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n3\n4 1\n4 2\n4 5", "1 1\n1\n1 1 0", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n2\n5 2\n5 3", "5 3\n1 2\n1 3\n2 4\n2 5\n2\n4 0\n4 2", "8 1\n1 2\n2 3\n3 4\n1 5\n5 6\n6 7\n7 8\n2\n4 3\n8 4"],
  },
  {
    slug: "g-arbore-verificare-pe-drum",
    title: "Verificarea apartenentei unui nod la un drum",
    difficulty: "hard",
    tags: ["grafuri", "arbore", "lca"],
    statement: "Se da un arbore cu n noduri si radacina r, apoi q interogari, fiecare cu trei noduri a, b si x. Pentru fiecare interogare, verificati daca x se afla pe drumul simplu dintre a si b.",
    input_format: "Pe prima linie se citesc n si r. Urmeaza n-1 linii cu cate o muchie. Urmeaza o linie cu q, apoi q linii, fiecare cu trei numere a, b si x.",
    output_format: "Pentru fiecare interogare se afiseaza 'DA' daca x se afla pe drumul dintre a si b, altfel 'NU'.",
    constraints: "1 <= n <= 100000, 1 <= r <= n, 1 <= q <= 100000",
    hints: "Nodul x se afla pe drumul dintre a si b daca si numai daca distanta(a, x) + distanta(x, b) = distanta(a, b). Calculati toate cele trei distante folosind LCA (binary lifting).",
    explanation: "Deoarece intr-un arbore drumul dintre oricare doua noduri este unic, x se afla pe acest drum daca si numai daca suma distantelor de la a la x si de la x la b este exact egala cu distanta directa de la a la b (orice abatere de la drum ar creste suma peste aceasta valoare). Toate cele trei distante se calculeaza rapid folosind formula bazata pe LCA si adancimi.\n\n**Complexitate:** O(n log n) precalcul, O(log n) per interogare",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, r; cin >> n >> r;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    int LOG = 1;
    while ((1 << LOG) < n) LOG++;
    LOG++;
    vector<vector<int>> up(LOG, vector<int>(n + 1, 0));
    vector<int> depth(n + 1, -1);
    depth[r] = 0;
    queue<int> q0; q0.push(r);
    while (!q0.empty()) {
        int u = q0.front(); q0.pop();
        for (int v : adj[u]) if (depth[v] == -1) { depth[v] = depth[u] + 1; up[0][v] = u; q0.push(v); }
    }
    for (int k = 1; k < LOG; k++)
        for (int v = 1; v <= n; v++)
            up[k][v] = up[k - 1][up[k - 1][v]];
    auto lca = [&](int a, int b) {
        if (depth[a] < depth[b]) swap(a, b);
        int diff = depth[a] - depth[b];
        for (int k = 0; k < LOG; k++) if ((diff >> k) & 1) a = up[k][a];
        if (a == b) return a;
        for (int k = LOG - 1; k >= 0; k--) if (up[k][a] != up[k][b]) { a = up[k][a]; b = up[k][b]; }
        return up[0][a];
    };
    auto dist = [&](int a, int b) { int l = lca(a, b); return depth[a] + depth[b] - 2 * depth[l]; };
    int q; cin >> q;
    string out;
    while (q--) {
        int a, b, x; cin >> a >> b >> x;
        bool onPath = (dist(a, x) + dist(x, b) == dist(a, b));
        out += onPath ? "DA" : "NU"; out += "\\n";
    }
    cout << out;
    return 0;
}
`,
    py: `import sys
from collections import deque
def main():
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx]); idx += 1
    r = int(data[idx]); idx += 1
    adj = [[] for _ in range(n + 1)]
    for _ in range(n - 1):
        x = int(data[idx]); idx += 1
        y = int(data[idx]); idx += 1
        adj[x].append(y); adj[y].append(x)
    LOG = 1
    while (1 << LOG) < n:
        LOG += 1
    LOG += 1
    up = [[0] * (n + 1) for _ in range(LOG)]
    depth = [-1] * (n + 1)
    depth[r] = 0
    q0 = deque([r])
    while q0:
        u = q0.popleft()
        for v in adj[u]:
            if depth[v] == -1:
                depth[v] = depth[u] + 1
                up[0][v] = u
                q0.append(v)
    for k in range(1, LOG):
        upk, upk1 = up[k], up[k - 1]
        for v in range(1, n + 1):
            upk[v] = upk1[upk1[v]]
    def lca(a, b):
        if depth[a] < depth[b]:
            a, b = b, a
        diff = depth[a] - depth[b]
        k = 0
        while diff:
            if diff & 1:
                a = up[k][a]
            diff >>= 1
            k += 1
        if a == b:
            return a
        for k in range(LOG - 1, -1, -1):
            if up[k][a] != up[k][b]:
                a = up[k][a]
                b = up[k][b]
        return up[0][a]
    def dist(a, b):
        l = lca(a, b)
        return depth[a] + depth[b] - 2 * depth[l]
    q = int(data[idx]); idx += 1
    out = []
    for _ in range(q):
        a = int(data[idx]); idx += 1
        b = int(data[idx]); idx += 1
        x = int(data[idx]); idx += 1
        onPath = dist(a, x) + dist(x, b) == dist(a, b)
        out.append("DA" if onPath else "NU")
    print("\\n".join(out))
main()
`,
    tests: ["7 1\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n3\n4 7\n1\n4 7\n6\n4 7\n5", "1 1\n1\n1 1 1", "6 1\n1 2\n1 3\n2 4\n2 5\n3 6\n2\n4 6\n2\n4 6\n5", "5 3\n1 2\n1 3\n2 4\n2 5\n2\n4 5\n3\n1 4\n2", "8 1\n1 2\n2 3\n3 4\n1 5\n5 6\n6 7\n7 8\n1\n4 8\n1"],
  },
  // ===================== GRUPA D: DIAMETRU SI PROPRIETATI GLOBALE =====================
  {
    slug: "g-arbore-diametru",
    title: "Diametrul unui arbore",
    difficulty: "medium",
    tags: ["grafuri", "arbore", "diametru"],
    statement: "Se da un arbore cu n noduri (fara radacina desemnata). Determinati diametrul sau: lungimea (in muchii) celui mai lung drum dintre doua noduri.",
    input_format: "Pe prima linie se citeste n. Urmeaza n-1 linii, fiecare cu doua numere x y, reprezentand o muchie a arborelui.",
    output_format: "Se afiseaza diametrul arborelui.",
    constraints: "1 <= n <= 100000",
    hints: "Folositi tehnica dublului BFS: rulati BFS dintr-un nod oarecare pentru a gasi cel mai indepartat nod u, apoi rulati BFS din u; distanta maxima obtinuta este diametrul.",
    explanation: "Spre deosebire de un graf general (unde tehnica nu functioneaza intotdeauna), intr-un arbore tehnica dublului BFS este garantat corecta: pornind dintr-un nod oarecare, cel mai indepartat nod gasit, u, este mereu un capat al unui drum de diametru maxim; rulind apoi BFS din u, cea mai mare distanta obtinuta este exact diametrul arborelui.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
pair<int,int> bfsFar(int s, int n, vector<vector<int>>& adj) {
    vector<int> dist(n + 1, -1);
    dist[s] = 0;
    queue<int> q; q.push(s);
    int far = s;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        if (dist[u] > dist[far]) far = u;
        for (int v : adj[u]) if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); }
    }
    return {far, dist[far]};
}
int main() {
    int n; cin >> n;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    auto [u, d1] = bfsFar(1, n, adj);
    auto [v, d2] = bfsFar(u, n, adj);
    cout << d2 << "\\n";
    return 0;
}
`,
    py: `from collections import deque
def bfs_far(s, n, adj):
    dist = [-1] * (n + 1)
    dist[s] = 0
    q = deque([s])
    far = s
    while q:
        u = q.popleft()
        if dist[u] > dist[far]:
            far = u
        for v in adj[u]:
            if dist[v] == -1:
                dist[v] = dist[u] + 1
                q.append(v)
    return far, dist[far]
n = int(input())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
u, d1 = bfs_far(1, n, adj)
v, d2 = bfs_far(u, n, adj)
print(d2)
`,
    tests: ["5\n1 2\n1 3\n2 4\n2 5", "1", "6\n1 2\n2 3\n3 4\n4 5\n5 6", "7\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7", "4\n1 2\n1 3\n1 4"],
  },
  {
    slug: "g-arbore-diametru-afisare",
    title: "Diametrul unui arbore: afisarea capetelor",
    difficulty: "medium",
    tags: ["grafuri", "arbore", "diametru"],
    statement: "Se da un arbore cu n noduri. Determinati diametrul sau si afisati un drum de diametru maxim (lungimea si cele doua noduri capat).",
    input_format: "Pe prima linie se citeste n. Urmeaza n-1 linii, fiecare cu doua numere x y, reprezentand o muchie a arborelui.",
    output_format: "Se afiseaza trei numere separate prin spatiu: lungimea diametrului, si cele doua noduri capat ale unui drum de aceasta lungime, in ordine crescatoare.",
    constraints: "1 <= n <= 100000",
    hints: "Rulati dublul BFS ca la problema diametrului; primul nod cel mai indepartat gasit si nodul cel mai indepartat de acesta sunt capetele unui drum de diametru maxim.",
    explanation: "La fel ca la problema diametrului, se ruleaza BFS dintr-un nod oarecare pentru a gasi capatul u, apoi BFS din u pentru a gasi celalalt capat v si distanta dintre ele (diametrul). Cele doua noduri gasite se afiseaza in ordine crescatoare, pentru un rezultat determinist.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
pair<int,int> bfsFar(int s, int n, vector<vector<int>>& adj) {
    vector<int> dist(n + 1, -1);
    dist[s] = 0;
    queue<int> q; q.push(s);
    int far = s;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        if (dist[u] > dist[far]) far = u;
        for (int v : adj[u]) if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); }
    }
    return {far, dist[far]};
}
int main() {
    int n; cin >> n;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    auto [u, d1] = bfsFar(1, n, adj);
    auto [v, d2] = bfsFar(u, n, adj);
    cout << d2 << " " << min(u, v) << " " << max(u, v) << "\\n";
    return 0;
}
`,
    py: `from collections import deque
def bfs_far(s, n, adj):
    dist = [-1] * (n + 1)
    dist[s] = 0
    q = deque([s])
    far = s
    while q:
        u = q.popleft()
        if dist[u] > dist[far]:
            far = u
        for v in adj[u]:
            if dist[v] == -1:
                dist[v] = dist[u] + 1
                q.append(v)
    return far, dist[far]
n = int(input())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
u, d1 = bfs_far(1, n, adj)
v, d2 = bfs_far(u, n, adj)
print(d2, min(u, v), max(u, v))
`,
    tests: ["5\n1 2\n1 3\n2 4\n2 5", "1", "6\n1 2\n2 3\n3 4\n4 5\n5 6", "7\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7", "4\n1 2\n1 3\n1 4"],
  },
  {
    slug: "g-arbore-centru",
    title: "Centrul unui arbore",
    difficulty: "hard",
    tags: ["grafuri", "arbore", "diametru"],
    statement: "Centrul unui arbore este format din nodul (sau cele doua noduri) situate la mijlocul unui drum de diametru maxim. Se da un arbore cu n noduri. Determinati centrul sau.",
    input_format: "Pe prima linie se citeste n. Urmeaza n-1 linii, fiecare cu doua numere x y, reprezentand o muchie a arborelui.",
    output_format: "Se afiseaza nodurile centrale, in ordine crescatoare, separate prin spatiu (un nod daca diametrul este par, doua noduri daca diametrul este impar).",
    constraints: "1 <= n <= 100000",
    hints: "Gasiti capetele unui drum de diametru maxim (dublu BFS), reconstruiti drumul complet dintre ele folosind parintii din al doilea BFS, apoi luati nodul (sau cele doua noduri) din mijlocul acestei secvente.",
    explanation: "Se determina un drum de diametru maxim intre doua capete u si v (dublu BFS, retinand parintii in al doilea BFS pentru a reconstrui drumul complet). Acest drum are diametru + 1 noduri. Daca diametrul este par, centrul este nodul de pe pozitia mijlocie (unic); daca este impar, centrul este format din cele doua noduri din mijlocul secventei. Centrul arborelui este o proprietate intrinseca a acestuia, independenta de la ce capat s-a pornit reconstructia drumului.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    auto bfsFar = [&](int s) {
        vector<int> dist(n + 1, -1);
        dist[s] = 0;
        queue<int> q; q.push(s);
        int far = s;
        while (!q.empty()) {
            int u = q.front(); q.pop();
            if (dist[u] > dist[far]) far = u;
            for (int v : adj[u]) if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); }
        }
        return far;
    };
    int u = bfsFar(1);
    int v = bfsFar(u);
    vector<int> dist(n + 1, -1), parent(n + 1, -1);
    dist[u] = 0;
    queue<int> q; q.push(u);
    while (!q.empty()) {
        int cur = q.front(); q.pop();
        for (int w : adj[cur]) if (dist[w] == -1) { dist[w] = dist[cur] + 1; parent[w] = cur; q.push(w); }
    }
    vector<int> path;
    int cur = v;
    while (cur != -1) { path.push_back(cur); cur = parent[cur]; }
    int len = (int)path.size();
    vector<int> centers;
    if (len % 2 == 1) centers.push_back(path[len / 2]);
    else { centers.push_back(path[len / 2 - 1]); centers.push_back(path[len / 2]); }
    sort(centers.begin(), centers.end());
    for (size_t i = 0; i < centers.size(); i++) cout << centers[i] << (i + 1 < centers.size() ? " " : "\\n");
    return 0;
}
`,
    py: `from collections import deque
n = int(input())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
def bfs_far(s):
    dist = [-1] * (n + 1)
    dist[s] = 0
    q = deque([s])
    far = s
    while q:
        u = q.popleft()
        if dist[u] > dist[far]:
            far = u
        for v in adj[u]:
            if dist[v] == -1:
                dist[v] = dist[u] + 1
                q.append(v)
    return far
u = bfs_far(1)
v = bfs_far(u)
dist = [-1] * (n + 1)
parent = [-1] * (n + 1)
dist[u] = 0
q = deque([u])
while q:
    cur = q.popleft()
    for w in adj[cur]:
        if dist[w] == -1:
            dist[w] = dist[cur] + 1
            parent[w] = cur
            q.append(w)
path = []
cur = v
while cur != -1:
    path.append(cur)
    cur = parent[cur]
ln = len(path)
if ln % 2 == 1:
    centers = [path[ln // 2]]
else:
    centers = [path[ln // 2 - 1], path[ln // 2]]
centers.sort()
print(" ".join(map(str, centers)))
`,
    tests: ["5\n1 2\n1 3\n2 4\n2 5", "1", "6\n1 2\n2 3\n3 4\n4 5\n5 6", "7\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7", "4\n1 2\n2 3\n3 4"],
  },
  {
    slug: "g-arbore-excentricitate-nod",
    title: "Excentricitatea unui nod intr-un arbore",
    difficulty: "easy",
    tags: ["grafuri", "arbore", "bfs"],
    statement: "Se da un arbore cu n noduri, si un nod x. Determinati excentricitatea lui x (distanta maxima de la x la orice alt nod al arborelui).",
    input_format: "Pe prima linie se citeste n. Urmeaza n-1 linii, fiecare cu doua numere x y, reprezentand o muchie a arborelui. Pe ultima linie se citeste nodul x cerut.",
    output_format: "Se afiseaza excentricitatea nodului cerut.",
    constraints: "1 <= n <= 100000",
    hints: "Rulati BFS din x si retineti distanta maxima obtinuta.",
    explanation: "Se ruleaza o parcurgere BFS din x, care calculeaza distanta minima (in muchii, unica intr-un arbore) pana la fiecare alt nod; excentricitatea este maximul acestor distante.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    int x; cin >> x;
    vector<int> dist(n + 1, -1);
    dist[x] = 0;
    queue<int> q; q.push(x);
    int best = 0;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        best = max(best, dist[u]);
        for (int v : adj[u]) if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); }
    }
    cout << best << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n = int(input())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
x = int(input())
dist = [-1] * (n + 1)
dist[x] = 0
q = deque([x])
best = 0
while q:
    u = q.popleft()
    best = max(best, dist[u])
    for v in adj[u]:
        if dist[v] == -1:
            dist[v] = dist[u] + 1
            q.append(v)
print(best)
`,
    tests: ["5\n1 2\n1 3\n2 4\n2 5\n1", "1\n1", "6\n1 2\n2 3\n3 4\n4 5\n5 6\n3", "7\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n4", "4\n1 2\n1 3\n1 4\n1"],
  },
  {
    slug: "g-arbore-perechi-la-distanta-k",
    title: "Numarul de perechi de noduri la o distanta data",
    difficulty: "medium",
    tags: ["grafuri", "arbore", "bfs"],
    statement: "Se da un arbore cu n noduri si un numar k. Determinati numarul de perechi de noduri (i, j) cu i < j aflate la distanta exact k in arbore.",
    input_format: "Pe prima linie se citesc n si k. Urmeaza n-1 linii, fiecare cu doua numere x y, reprezentand o muchie a arborelui.",
    output_format: "Se afiseaza numarul de perechi de noduri la distanta exact k.",
    constraints: "1 <= n <= 2000, 0 <= k <= n",
    hints: "Rulati BFS din fiecare nod si numarati de cate ori intalniti un nod la distanta k, apoi impartiti suma la 2 (fiecare pereche este numarata din ambele capete).",
    explanation: "Se ruleaza cate o parcurgere BFS din fiecare nod, numarand nodurile aflate la distanta exact k; sumand aceste numaratori pe toate nodurile, fiecare pereche (i, j) valida este numarata de exact doua ori (o data din perspectiva lui i, o data din perspectiva lui j), deci suma finala se imparte la 2.\n\n**Complexitate:** O(n^2)",
    time_limit_ms: 3000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, k; cin >> n >> k;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    long long total = 0;
    for (int s = 1; s <= n; s++) {
        vector<int> dist(n + 1, -1);
        dist[s] = 0;
        queue<int> q; q.push(s);
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int v : adj[u]) if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); }
        }
        for (int i = 1; i <= n; i++) if (dist[i] == k) total++;
    }
    cout << (total / 2) << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, k = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
total = 0
for s in range(1, n + 1):
    dist = [-1] * (n + 1)
    dist[s] = 0
    q = deque([s])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if dist[v] == -1:
                dist[v] = dist[u] + 1
                q.append(v)
    total += sum(1 for i in range(1, n + 1) if dist[i] == k)
print(total // 2)
`,
    tests: ["5 2\n1 2\n1 3\n2 4\n2 5", "1 0", "6 1\n1 2\n2 3\n3 4\n4 5\n5 6", "7 2\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7", "4 3\n1 2\n1 3\n1 4"],
  },
  // ===================== GRUPA E: PROGRAMARE DINAMICA PE ARBORI =====================
  {
    slug: "g-arbore-suma-distante-nod",
    title: "Suma distantelor de la un nod la toate celelalte",
    difficulty: "easy",
    tags: ["grafuri", "arbore", "bfs"],
    statement: "Se da un arbore cu n noduri si un nod x. Calculati suma distantelor de la x la toate celelalte noduri ale arborelui.",
    input_format: "Pe prima linie se citeste n. Urmeaza n-1 linii, fiecare cu doua numere x y, reprezentand o muchie a arborelui. Pe ultima linie se citeste nodul cerut.",
    output_format: "Se afiseaza suma distantelor de la nodul cerut la toate celelalte noduri.",
    constraints: "1 <= n <= 100000",
    hints: "Rulati BFS din nodul cerut si insumati toate distantele obtinute.",
    explanation: "Se ruleaza BFS din nodul cerut, care calculeaza distanta pana la fiecare alt nod, apoi se insumeaza toate aceste valori.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    int x; cin >> x;
    vector<long long> dist(n + 1, -1);
    dist[x] = 0;
    queue<int> q; q.push(x);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); }
    }
    long long suma = 0;
    for (int i = 1; i <= n; i++) suma += dist[i];
    cout << suma << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n = int(input())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
x = int(input())
dist = [-1] * (n + 1)
dist[x] = 0
q = deque([x])
while q:
    u = q.popleft()
    for v in adj[u]:
        if dist[v] == -1:
            dist[v] = dist[u] + 1
            q.append(v)
print(sum(dist[1:]))
`,
    tests: ["5\n1 2\n1 3\n2 4\n2 5\n1", "1\n1", "6\n1 2\n2 3\n3 4\n4 5\n5 6\n3", "7\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n1", "4\n1 2\n1 3\n1 4\n2"],
  },
  {
    slug: "g-arbore-noduri-la-distanta-k-nod",
    title: "Numarul de noduri la o distanta data fata de un nod",
    difficulty: "easy",
    tags: ["grafuri", "arbore", "bfs"],
    statement: "Se da un arbore cu n noduri, un nod x si un numar k. Determinati numarul de noduri aflate la distanta exact k fata de x.",
    input_format: "Pe prima linie se citeste n. Urmeaza n-1 linii, fiecare cu doua numere x y, reprezentand o muchie a arborelui. Pe ultima linie se citesc x si k.",
    output_format: "Se afiseaza numarul de noduri aflate la distanta exact k fata de x.",
    constraints: "1 <= n <= 100000, 0 <= k <= n",
    hints: "Rulati BFS din x si numarati nodurile cu distanta egala cu k.",
    explanation: "Se ruleaza BFS din x pentru a calcula distanta pana la fiecare nod, apoi se numara cate dintre acestea sunt egale cu k.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    int x, k; cin >> x >> k;
    vector<int> dist(n + 1, -1);
    dist[x] = 0;
    queue<int> q; q.push(x);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); }
    }
    int cnt = 0;
    for (int i = 1; i <= n; i++) if (dist[i] == k) cnt++;
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n = int(input())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
x, k = map(int, input().split())
dist = [-1] * (n + 1)
dist[x] = 0
q = deque([x])
while q:
    u = q.popleft()
    for v in adj[u]:
        if dist[v] == -1:
            dist[v] = dist[u] + 1
            q.append(v)
print(sum(1 for i in range(1, n + 1) if dist[i] == k))
`,
    tests: ["5\n1 2\n1 3\n2 4\n2 5\n1 1", "1\n1 0", "6\n1 2\n2 3\n3 4\n4 5\n5 6\n3 2", "7\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n1 2", "4\n1 2\n1 3\n1 4\n1 1"],
  },
  {
    slug: "g-arbore-multime-independenta-maxima",
    title: "Multimea independenta maxima intr-un arbore",
    difficulty: "hard",
    tags: ["grafuri", "arbore", "dp"],
    statement: "O multime independenta este o submultime de noduri, oricare doua neadiacente. Se da un arbore cu n noduri. Determinati dimensiunea celei mai mari multimi independente.",
    input_format: "Pe prima linie se citeste n. Urmeaza n-1 linii, fiecare cu doua numere x y, reprezentand o muchie a arborelui.",
    output_format: "Se afiseaza dimensiunea celei mai mari multimi independente.",
    constraints: "1 <= n <= 100000",
    hints: "Folositi programare dinamica pe arbore, cu radacina arbitrara (de exemplu, nodul 1): dp[u][0] = raspunsul optim pentru subarborele lui u fara sa il alegeti pe u; dp[u][1] = cu u ales.",
    explanation: "Se alege o radacina arbitrara (nodul 1) si se calculeaza, pentru fiecare nod u, doua valori: dp[u][1] = 1 + suma dp[c][0] pentru toti copiii c (daca u este ales, niciun copil nu mai poate fi ales); dp[u][0] = suma max(dp[c][0], dp[c][1]) pentru toti copiii (daca u nu este ales, fiecare copil este liber sa fie ales sau nu). Calculul se face bottom-up, procesand nodurile in ordinea inversa a descoperirii BFS. Raspunsul final este max(dp[radacina][0], dp[radacina][1]).\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> parent(n + 1, -1), order;
    parent[1] = 0;
    queue<int> q; q.push(1);
    while (!q.empty()) {
        int u = q.front(); q.pop(); order.push_back(u);
        for (int v : adj[u]) if (parent[v] == -1) { parent[v] = u; q.push(v); }
    }
    vector<long long> dp0(n + 1, 0), dp1(n + 1, 1);
    for (int i = (int)order.size() - 1; i >= 0; i--) {
        int u = order[i];
        if (parent[u] != 0) {
            dp0[parent[u]] += max(dp0[u], dp1[u]);
            dp1[parent[u]] += dp0[u];
        }
    }
    cout << max(dp0[1], dp1[1]) << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n = int(input())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
parent = [-1] * (n + 1)
order = []
parent[1] = 0
q = deque([1])
while q:
    u = q.popleft()
    order.append(u)
    for v in adj[u]:
        if parent[v] == -1:
            parent[v] = u
            q.append(v)
dp0 = [0] * (n + 1)
dp1 = [1] * (n + 1)
for u in reversed(order):
    if parent[u] != 0:
        p = parent[u]
        dp0[p] += max(dp0[u], dp1[u])
        dp1[p] += dp0[u]
print(max(dp0[1], dp1[1]))
`,
    tests: ["5\n1 2\n1 3\n2 4\n2 5", "1", "4\n1 2\n2 3\n3 4", "7\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7", "6\n1 2\n1 3\n1 4\n1 5\n1 6"],
  },
  {
    slug: "g-arbore-acoperire-minima-noduri",
    title: "Acoperirea minima de noduri intr-un arbore",
    difficulty: "hard",
    tags: ["grafuri", "arbore", "dp"],
    statement: "O acoperire de noduri este o submultime de noduri astfel incat fiecare muchie are cel putin un capat in submultime. Se da un arbore cu n noduri. Determinati dimensiunea celei mai mici acoperiri de noduri.",
    input_format: "Pe prima linie se citeste n. Urmeaza n-1 linii, fiecare cu doua numere x y, reprezentand o muchie a arborelui.",
    output_format: "Se afiseaza dimensiunea celei mai mici acoperiri de noduri.",
    constraints: "1 <= n <= 100000",
    hints: "Folositi programare dinamica pe arbore: dp[u][0] = costul minim pentru subarborele lui u daca u NU este in acoperire (caz in care toti copiii TREBUIE sa fie in acoperire); dp[u][1] = costul minim daca u este in acoperire (copiii sunt liberi).",
    explanation: "Se alege o radacina arbitrara (nodul 1). Daca un nod u nu face parte din acoperire, fiecare muchie catre un copil c trebuie acoperita de c insusi, deci c este obligatoriu ales: dp[u][0] = suma dp[c][1]. Daca u face parte din acoperire, fiecare copil poate fi ales sau nu, alegandu-se varianta mai ieftina: dp[u][1] = 1 + suma min(dp[c][0], dp[c][1]). Calculul se face bottom-up (ordinea inversa a descoperirii BFS), iar raspunsul final este min(dp[radacina][0], dp[radacina][1]).\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> parent(n + 1, -1), order;
    parent[1] = 0;
    queue<int> q; q.push(1);
    while (!q.empty()) {
        int u = q.front(); q.pop(); order.push_back(u);
        for (int v : adj[u]) if (parent[v] == -1) { parent[v] = u; q.push(v); }
    }
    vector<long long> dp0(n + 1, 0), dp1(n + 1, 1);
    for (int i = (int)order.size() - 1; i >= 0; i--) {
        int u = order[i];
        if (parent[u] != 0) {
            dp0[parent[u]] += dp1[u];
            dp1[parent[u]] += min(dp0[u], dp1[u]);
        }
    }
    cout << min(dp0[1], dp1[1]) << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n = int(input())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
parent = [-1] * (n + 1)
order = []
parent[1] = 0
q = deque([1])
while q:
    u = q.popleft()
    order.append(u)
    for v in adj[u]:
        if parent[v] == -1:
            parent[v] = u
            q.append(v)
dp0 = [0] * (n + 1)
dp1 = [1] * (n + 1)
for u in reversed(order):
    if parent[u] != 0:
        p = parent[u]
        dp0[p] += dp1[u]
        dp1[p] += min(dp0[u], dp1[u])
print(min(dp0[1], dp1[1]))
`,
    tests: ["5\n1 2\n1 3\n2 4\n2 5", "1", "4\n1 2\n2 3\n3 4", "7\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7", "6\n1 2\n1 3\n1 4\n1 5\n1 6"],
  },
  {
    slug: "g-arbore-multime-dominanta-minima",
    title: "Multimea dominanta minima intr-un arbore",
    difficulty: "hard",
    tags: ["grafuri", "arbore", "dp"],
    statement: "O multime dominanta este o submultime de noduri astfel incat fiecare nod al arborelui este fie in submultime, fie adiacent cu un nod din submultime. Se da un arbore cu n noduri. Determinati dimensiunea celei mai mici multimi dominante.",
    input_format: "Pe prima linie se citeste n. Urmeaza n-1 linii, fiecare cu doua numere x y, reprezentand o muchie a arborelui.",
    output_format: "Se afiseaza dimensiunea celei mai mici multimi dominante.",
    constraints: "1 <= n <= 100000",
    hints: "Folositi programare dinamica pe arbore cu 3 stari per nod: ales; nealès dar dominat de un copil ales; nealès si inca nedominat (asteapta sa fie dominat de parinte).",
    explanation: "Pentru fiecare nod u se calculeaza trei valori: dp[u][1] = costul minim daca u este ales (1 plus suma minimului dintre toate cele 3 stari ale copiilor, deoarece ei sunt automat dominati de u); dp[u][2] = costul minim daca u NU este ales si inca nu este dominat (toti copiii trebuie sa fie deja dominati fara ajutorul lui u, deci fiecare copil foloseste min intre starea 'ales' si 'dominat de un copil'); dp[u][0] = costul minim daca u nu este ales dar este deja dominat de un copil (la fel ca dp[u][2], dar se impune ca cel putin un copil sa fie in starea 'ales' -- daca minimul natural nu contine deja niciun copil ales, se forteaza cel mai ieftin copil sa treaca in starea 'ales', platind diferenta de cost). Raspunsul final la radacina este min(dp[radacina][0], dp[radacina][1]) (starea 2 nu este valida la radacina, care nu are parinte care sa o domine).\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
const long long INF = (long long)1e9;
int main() {
    int n; cin >> n;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> parent(n + 1, -1), order;
    vector<vector<int>> children(n + 1);
    parent[1] = 0;
    queue<int> q; q.push(1);
    while (!q.empty()) {
        int u = q.front(); q.pop(); order.push_back(u);
        for (int v : adj[u]) if (parent[v] == -1) { parent[v] = u; children[u].push_back(v); q.push(v); }
    }
    vector<long long> dp0(n + 1, 0), dp1(n + 1, 1), dp2(n + 1, 0);
    for (int i = (int)order.size() - 1; i >= 0; i--) {
        int u = order[i];
        if (children[u].empty()) {
            dp1[u] = 1; dp0[u] = INF; dp2[u] = 0;
            continue;
        }
        long long s1 = 0, s2 = 0;
        long long bestExtra = INF;
        bool anyChosen = false;
        for (int c : children[u]) {
            s1 += min({dp0[c], dp1[c], dp2[c]});
            long long m01 = min(dp0[c], dp1[c]);
            s2 += m01;
            if (dp1[c] <= dp0[c]) anyChosen = true;
            bestExtra = min(bestExtra, dp1[c] - dp0[c]);
        }
        dp1[u] = 1 + s1;
        dp2[u] = s2;
        dp0[u] = anyChosen ? s2 : s2 + bestExtra;
    }
    cout << min(dp0[1], dp1[1]) << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n = int(input())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
parent = [-1] * (n + 1)
order = []
children = [[] for _ in range(n + 1)]
parent[1] = 0
q = deque([1])
while q:
    u = q.popleft()
    order.append(u)
    for v in adj[u]:
        if parent[v] == -1:
            parent[v] = u
            children[u].append(v)
            q.append(v)
INF = 10 ** 9
dp0 = [0] * (n + 1)
dp1 = [1] * (n + 1)
dp2 = [0] * (n + 1)
for u in reversed(order):
    if not children[u]:
        dp1[u] = 1
        dp0[u] = INF
        dp2[u] = 0
        continue
    s1 = 0
    s2 = 0
    bestExtra = INF
    anyChosen = False
    for c in children[u]:
        s1 += min(dp0[c], dp1[c], dp2[c])
        m01 = min(dp0[c], dp1[c])
        s2 += m01
        if dp1[c] <= dp0[c]:
            anyChosen = True
        bestExtra = min(bestExtra, dp1[c] - dp0[c])
    dp1[u] = 1 + s1
    dp2[u] = s2
    dp0[u] = s2 if anyChosen else s2 + bestExtra
print(min(dp0[1], dp1[1]))
`,
    tests: ["5\n1 2\n1 3\n2 4\n2 5", "1", "4\n1 2\n2 3\n3 4", "7\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7", "6\n1 2\n1 3\n1 4\n1 5\n1 6"],
  },
  {
    slug: "g-arbore-diametru-ponderat",
    title: "Diametrul ponderat al unui arbore",
    difficulty: "medium",
    tags: ["grafuri", "arbore", "diametru", "costuri"],
    statement: "Se da un arbore cu n noduri, ale carui muchii au costuri pozitive. Determinati diametrul ponderat: costul total al celui mai 'lung' (din punct de vedere al costului) drum dintre doua noduri.",
    input_format: "Pe prima linie se citeste n. Urmeaza n-1 linii, fiecare cu trei numere x y c, reprezentand o muchie intre x si y cu costul c.",
    output_format: "Se afiseaza diametrul ponderat al arborelui.",
    constraints: "1 <= n <= 100000, 1 <= c <= 10^6",
    hints: "Aplicati tehnica dublului BFS (adaptata pentru costuri, insumand costurile in loc sa incrementati cu 1), care ramane valida pe arbori chiar si cu muchii ponderate.",
    explanation: "Tehnica dublului BFS/DFS ramane valabila si pentru arbori ponderati (cu costuri pozitive): se parcurge o data din nodul 1 pentru a gasi cel mai 'departat' nod u (dupa cost), apoi din u pentru a gasi costul maxim -- acesta este diametrul ponderat. Deoarece arborele are un singur drum intre oricare doua noduri, o simpla parcurgere (fara coada de prioritate) este suficienta pentru a acumula costurile corect.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
pair<int,long long> bfsFar(int s, int n, vector<vector<pair<int,long long>>>& adj) {
    vector<long long> dist(n + 1, -1);
    dist[s] = 0;
    queue<int> q; q.push(s);
    int far = s;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        if (dist[u] > dist[far]) far = u;
        for (auto& [v, w] : adj[u]) if (dist[v] == -1) { dist[v] = dist[u] + w; q.push(v); }
    }
    return {far, dist[far]};
}
int main() {
    int n; cin >> n;
    vector<vector<pair<int,long long>>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; long long c; cin >> x >> y >> c;
        adj[x].push_back({y, c}); adj[y].push_back({x, c});
    }
    auto [u, d1] = bfsFar(1, n, adj);
    auto [v, d2] = bfsFar(u, n, adj);
    cout << d2 << "\\n";
    return 0;
}
`,
    py: `from collections import deque
def bfs_far(s, n, adj):
    dist = [-1] * (n + 1)
    dist[s] = 0
    q = deque([s])
    far = s
    while q:
        u = q.popleft()
        if dist[u] > dist[far]:
            far = u
        for v, w in adj[u]:
            if dist[v] == -1:
                dist[v] = dist[u] + w
                q.append(v)
    return far, dist[far]
n = int(input())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y, c = map(int, input().split())
    adj[x].append((y, c)); adj[y].append((x, c))
u, d1 = bfs_far(1, n, adj)
v, d2 = bfs_far(u, n, adj)
print(d2)
`,
    tests: ["5\n1 2 3\n1 3 5\n2 4 2\n2 5 4", "1", "6\n1 2 1\n2 3 1\n3 4 1\n4 5 1\n5 6 1", "7\n1 2 10\n1 3 20\n2 4 5\n2 5 5\n3 6 15\n3 7 5", "4\n1 2 7\n1 3 7\n1 4 7"],
  },
  {
    slug: "g-arbore-centroid",
    title: "Centroidul unui arbore",
    difficulty: "hard",
    tags: ["grafuri", "arbore", "centroid"],
    statement: "Centroidul unui arbore este un nod a carui eliminare imparte arborele in componente, niciuna avand mai mult de n/2 noduri (impartire intreaga). Se da un arbore cu n noduri. Determinati centroidul (sau cei doi centroizi, daca exista).",
    input_format: "Pe prima linie se citeste n. Urmeaza n-1 linii, fiecare cu doua numere x y, reprezentand o muchie a arborelui.",
    output_format: "Se afiseaza nodurile centroide, in ordine crescatoare, separate prin spatiu (pot fi unul sau doua).",
    constraints: "1 <= n <= 100000",
    hints: "Calculati marimea subarborelui fiecarui nod (cu o radacina arbitrara). Pentru fiecare nod u, cea mai mare componenta rezultata din eliminarea sa este maximul dintre marimile subarborilor copiilor si (n - marimea subarborelui lui u). Centroizii sunt nodurile pentru care aceasta valoare este cel mult n/2.",
    explanation: "Se alege o radacina arbitrara (nodul 1) si se calculeaza marimea subarborelui fiecarui nod prin programare dinamica bottom-up. Pentru un nod u, eliminarea sa produce o componenta pentru fiecare copil (de marime size[copil]) si o componenta 'restul arborelui prin parinte' (de marime n - size[u]). Nodul u este centroid daca toate aceste componente au marimea cel mult n/2 (impartire intreaga). Se demonstreaza ca exista intotdeauna cel putin un centroid, si cel mult doi (caz in care sunt adiacenti).\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> parent(n + 1, -1), order;
    parent[1] = 0;
    queue<int> q; q.push(1);
    while (!q.empty()) {
        int u = q.front(); q.pop(); order.push_back(u);
        for (int v : adj[u]) if (parent[v] == -1) { parent[v] = u; q.push(v); }
    }
    vector<long long> size(n + 1, 1);
    for (int i = (int)order.size() - 1; i >= 0; i--) {
        int u = order[i];
        if (parent[u] != 0) size[parent[u]] += size[u];
    }
    vector<int> maxComp(n + 1, 0);
    for (int u = 1; u <= n; u++) {
        long long best = n - size[u];
        for (int v : adj[u]) if (v != parent[u]) best = max(best, size[v]);
        maxComp[u] = best;
    }
    vector<int> centroids;
    for (int u = 1; u <= n; u++) if (maxComp[u] <= n / 2) centroids.push_back(u);
    sort(centroids.begin(), centroids.end());
    for (size_t i = 0; i < centroids.size(); i++) cout << centroids[i] << (i + 1 < centroids.size() ? " " : "\\n");
    return 0;
}
`,
    py: `from collections import deque
n = int(input())
adj = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
parent = [-1] * (n + 1)
order = []
parent[1] = 0
q = deque([1])
while q:
    u = q.popleft()
    order.append(u)
    for v in adj[u]:
        if parent[v] == -1:
            parent[v] = u
            q.append(v)
size = [1] * (n + 1)
for u in reversed(order):
    if parent[u] != 0:
        size[parent[u]] += size[u]
maxComp = [0] * (n + 1)
for u in range(1, n + 1):
    best = n - size[u]
    for v in adj[u]:
        if v != parent[u]:
            best = max(best, size[v])
    maxComp[u] = best
centroids = [u for u in range(1, n + 1) if maxComp[u] <= n // 2]
print(" ".join(map(str, centroids)))
`,
    tests: ["5\n1 2\n1 3\n2 4\n2 5", "1", "4\n1 2\n2 3\n3 4", "7\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7", "6\n1 2\n1 3\n1 4\n1 5\n1 6"],
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
