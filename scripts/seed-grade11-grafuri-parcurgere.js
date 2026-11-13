const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade11", chapter: "grafuri", sub: "parcurgere-neorientate" };

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
  // ===================== GRUPA A: ORDINE DE PARCURGERE =====================
  {
    slug: "g-parcurgere-bfs-ordine",
    title: "Ordinea de parcurgere BFS",
    difficulty: "easy",
    tags: ["grafuri", "bfs"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, si un nod sursa s. Afisati ordinea in care sunt vizitate nodurile printr-o parcurgere in latime (BFS) pornind din s, alegand la fiecare pas vecinii in ordine crescatoare.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie. Pe ultima linie se citeste s.",
    output_format: "Se afiseaza nodurile vizitate, in ordinea BFS, separate prin spatiu (doar nodurile accesibile din s).",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= s <= n",
    hints: "Sortati listele de adiacenta crescator, apoi folositi o coada: extrageti un nod, marcati-l vizitat si adaugati in coada vecinii nevizitati, in ordine crescatoare.",
    explanation: "BFS foloseste o coada (FIFO): se porneste de la s, se marcheaza vizitat, iar la fiecare extragere din coada se adauga vecinii inca nevizitati, in ordinea listei de adiacenta (sortata crescator pentru determinism). Astfel nodurile sunt vizitate in ordinea distantei lor (in muchii) fata de s.\n\n**Complexitate:** O(n + m log m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    for (int i = 1; i <= n; i++) sort(adj[i].begin(), adj[i].end());
    int s; cin >> s;
    vector<bool> viz(n + 1, false);
    vector<int> order;
    queue<int> q; q.push(s); viz[s] = true;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        order.push_back(u);
        for (int v : adj[u]) if (!viz[v]) { viz[v] = true; q.push(v); }
    }
    for (size_t i = 0; i < order.size(); i++) cout << order[i] << (i + 1 < order.size() ? " " : "\\n");
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
for i in range(1, n + 1):
    adj[i].sort()
s = int(input())
viz = [False] * (n + 1)
viz[s] = True
order = []
q = deque([s])
while q:
    u = q.popleft()
    order.append(u)
    for v in adj[u]:
        if not viz[v]:
            viz[v] = True
            q.append(v)
print(" ".join(map(str, order)))
`,
    tests: ["5 4\n1 2\n1 3\n2 4\n3 5\n1", "6 4\n1 2\n2 3\n4 5\n5 6\n1", "1 0\n1", "4 6\n1 2\n1 3\n1 4\n2 3\n2 4\n3 4\n2", "7 6\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n1"],
  },
  {
    slug: "g-parcurgere-dfs-ordine",
    title: "Ordinea de parcurgere DFS",
    difficulty: "easy",
    tags: ["grafuri", "dfs"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, si un nod sursa s. Afisati ordinea in care sunt vizitate nodurile printr-o parcurgere in adancime (DFS) pornind din s, alegand la fiecare pas cel mai mic vecin nevizitat.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie. Pe ultima linie se citeste s.",
    output_format: "Se afiseaza nodurile vizitate, in ordinea DFS, separate prin spatiu (doar nodurile accesibile din s).",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= s <= n",
    hints: "Simulati recursivitatea DFS folosind o stiva explicita: la extragerea unui nod inca nevizitat, marcati-l vizitat si puneti in stiva vecinii sai nevizitati in ordine descrescatoare (pentru ca extragerea din stiva sa ii proceseze crescator).",
    explanation: "O parcurgere DFS iterativa care replica exact ordinea unei DFS recursive foloseste o stiva: se pun in stiva vecinii unui nod in ordine descrescatoare, astfel incat cel mai mic sa fie extras primul. Un nod este marcat vizitat abia la extragerea din stiva (nu la adaugare), pentru a evita procesarea lui de mai multe ori.\n\n**Complexitate:** O(n + m log m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    for (int i = 1; i <= n; i++) sort(adj[i].begin(), adj[i].end());
    int s; cin >> s;
    vector<bool> viz(n + 1, false);
    vector<int> order;
    vector<int> stack; stack.push_back(s);
    while (!stack.empty()) {
        int u = stack.back(); stack.pop_back();
        if (viz[u]) continue;
        viz[u] = true;
        order.push_back(u);
        for (int i = (int)adj[u].size() - 1; i >= 0; i--) if (!viz[adj[u][i]]) stack.push_back(adj[u][i]);
    }
    for (size_t i = 0; i < order.size(); i++) cout << order[i] << (i + 1 < order.size() ? " " : "\\n");
    return 0;
}
`,
    py: `n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
for i in range(1, n + 1):
    adj[i].sort()
s = int(input())
viz = [False] * (n + 1)
order = []
stack = [s]
while stack:
    u = stack.pop()
    if viz[u]:
        continue
    viz[u] = True
    order.append(u)
    for v in reversed(adj[u]):
        if not viz[v]:
            stack.append(v)
print(" ".join(map(str, order)))
`,
    tests: ["5 4\n1 2\n1 3\n2 4\n3 5\n1", "6 4\n1 2\n2 3\n4 5\n5 6\n1", "1 0\n1", "4 6\n1 2\n1 3\n1 4\n2 3\n2 4\n3 4\n2", "7 6\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n1"],
  },
  {
    slug: "g-parcurgere-bfs-toate-componentele",
    title: "Parcurgere BFS completa a grafului",
    difficulty: "medium",
    tags: ["grafuri", "bfs"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, posibil neconex. Afisati ordinea completa de vizitare a tuturor nodurilor, pornind cate o parcurgere BFS din fiecare nod nevizitat, luate in ordine crescatoare a indicilor.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza toate cele n noduri, in ordinea in care sunt vizitate, separate prin spatiu.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000",
    hints: "Parcurgeti nodurile de la 1 la n; pentru fiecare nod nevizitat, porniti o noua parcurgere BFS din el si continuati acumularea ordinii.",
    explanation: "Pentru a acoperi si nodurile din componente diferite, se parcurg toate nodurile in ordine 1..n si, de cate ori se intalneste un nod inca nevizitat, se porneste o noua parcurgere BFS din el, adaugand rezultatele la ordinea globala.\n\n**Complexitate:** O(n + m log m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    for (int i = 1; i <= n; i++) sort(adj[i].begin(), adj[i].end());
    vector<bool> viz(n + 1, false);
    vector<int> order;
    for (int s = 1; s <= n; s++) {
        if (viz[s]) continue;
        queue<int> q; q.push(s); viz[s] = true;
        while (!q.empty()) {
            int u = q.front(); q.pop();
            order.push_back(u);
            for (int v : adj[u]) if (!viz[v]) { viz[v] = true; q.push(v); }
        }
    }
    for (size_t i = 0; i < order.size(); i++) cout << order[i] << (i + 1 < order.size() ? " " : "\\n");
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
for i in range(1, n + 1):
    adj[i].sort()
viz = [False] * (n + 1)
order = []
for s in range(1, n + 1):
    if viz[s]:
        continue
    viz[s] = True
    q = deque([s])
    while q:
        u = q.popleft()
        order.append(u)
        for v in adj[u]:
            if not viz[v]:
                viz[v] = True
                q.append(v)
print(" ".join(map(str, order)))
`,
    tests: ["6 3\n1 2\n2 3\n4 5", "4 0", "1 0", "6 5\n1 2\n2 3\n3 4\n4 5\n5 6", "7 4\n1 2\n3 4\n5 6\n1 3"],
  },
  {
    slug: "g-parcurgere-dfs-toate-componentele",
    title: "Parcurgere DFS completa a grafului",
    difficulty: "medium",
    tags: ["grafuri", "dfs"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, posibil neconex. Afisati ordinea completa de vizitare a tuturor nodurilor, pornind cate o parcurgere DFS din fiecare nod nevizitat, luate in ordine crescatoare a indicilor.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza toate cele n noduri, in ordinea in care sunt vizitate, separate prin spatiu.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000",
    hints: "Parcurgeti nodurile de la 1 la n; pentru fiecare nod nevizitat, porniti o noua parcurgere DFS (iterativa, cu stiva) din el.",
    explanation: "Analog cu parcurgerea BFS completa, dar folosind tehnica DFS iterativa (stiva, marcare la extragere) pentru fiecare componenta neexplorata inca, in ordinea crescatoare a nodurilor de start.\n\n**Complexitate:** O(n + m log m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    for (int i = 1; i <= n; i++) sort(adj[i].begin(), adj[i].end());
    vector<bool> viz(n + 1, false);
    vector<int> order;
    for (int s = 1; s <= n; s++) {
        if (viz[s]) continue;
        vector<int> stack; stack.push_back(s);
        while (!stack.empty()) {
            int u = stack.back(); stack.pop_back();
            if (viz[u]) continue;
            viz[u] = true;
            order.push_back(u);
            for (int i = (int)adj[u].size() - 1; i >= 0; i--) if (!viz[adj[u][i]]) stack.push_back(adj[u][i]);
        }
    }
    for (size_t i = 0; i < order.size(); i++) cout << order[i] << (i + 1 < order.size() ? " " : "\\n");
    return 0;
}
`,
    py: `n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
for i in range(1, n + 1):
    adj[i].sort()
viz = [False] * (n + 1)
order = []
for s in range(1, n + 1):
    if viz[s]:
        continue
    stack = [s]
    while stack:
        u = stack.pop()
        if viz[u]:
            continue
        viz[u] = True
        order.append(u)
        for v in reversed(adj[u]):
            if not viz[v]:
                stack.append(v)
print(" ".join(map(str, order)))
`,
    tests: ["6 3\n1 2\n2 3\n4 5", "4 0", "1 0", "6 5\n1 2\n2 3\n3 4\n4 5\n5 6", "7 4\n1 2\n3 4\n5 6\n1 3"],
  },
  {
    slug: "g-nivel-bfs",
    title: "Nivelul fiecarui nod fata de o sursa",
    difficulty: "easy",
    tags: ["grafuri", "bfs", "distante"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, si un nod sursa s. Determinati, pentru fiecare nod, distanta minima (numarul de muchii) fata de s.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie. Pe ultima linie se citeste s.",
    output_format: "Se afiseaza n numere separate prin spatiu: distanta de la s la nodul 1, 2, ..., n (-1 daca nodul nu este accesibil din s).",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= s <= n",
    hints: "Folositi BFS: distanta nodului sursa este 0, iar distanta oricarui vecin nou descoperit este distanta nodului curent plus 1.",
    explanation: "Intr-un graf neponderat, BFS garanteaza ca fiecare nod este descoperit exact la distanta sa minima (in numar de muchii) fata de sursa, deoarece se exploreaza nivel cu nivel.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    int s; cin >> s;
    vector<int> dist(n + 1, -1);
    queue<int> q; dist[s] = 0; q.push(s);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); }
    }
    for (int i = 1; i <= n; i++) cout << dist[i] << (i < n ? " " : "\\n");
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
s = int(input())
dist = [-1] * (n + 1)
dist[s] = 0
q = deque([s])
while q:
    u = q.popleft()
    for v in adj[u]:
        if dist[v] == -1:
            dist[v] = dist[u] + 1
            q.append(v)
print(" ".join(map(str, dist[1:])))
`,
    tests: ["5 4\n1 2\n1 3\n2 4\n3 5\n1", "6 4\n1 2\n2 3\n4 5\n5 6\n1", "1 0\n1", "7 6\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n1", "4 2\n1 2\n3 4\n1"],
  },
  {
    slug: "g-arbore-bfs-parinti",
    title: "Arborele BFS si parintii",
    difficulty: "medium",
    tags: ["grafuri", "bfs"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, si un nod sursa s. Construiti arborele BFS pornit din s si determinati parintele fiecarui nod in acest arbore.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie. Pe ultima linie se citeste s.",
    output_format: "Se afiseaza n numere separate prin spatiu: parintele nodului 1, 2, ..., n in arborele BFS (0 pentru radacina s, -1 pentru un nod neaccesibil din s).",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= s <= n",
    hints: "In timpul BFS, atunci cand descoperiti un vecin nou v din nodul u, retineti parinte[v] = u.",
    explanation: "Arborele BFS retine, pentru fiecare nod (in afara de radacina), muchia prin care a fost descoperit prima data in parcurgere; aceasta muchie leaga nodul de parintele sau in arbore.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    int s; cin >> s;
    vector<int> parent(n + 1, -1);
    vector<bool> viz(n + 1, false);
    queue<int> q; viz[s] = true; parent[s] = 0; q.push(s);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) if (!viz[v]) { viz[v] = true; parent[v] = u; q.push(v); }
    }
    for (int i = 1; i <= n; i++) cout << parent[i] << (i < n ? " " : "\\n");
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
s = int(input())
parent = [-1] * (n + 1)
viz = [False] * (n + 1)
viz[s] = True
parent[s] = 0
q = deque([s])
while q:
    u = q.popleft()
    for v in adj[u]:
        if not viz[v]:
            viz[v] = True
            parent[v] = u
            q.append(v)
print(" ".join(map(str, parent[1:])))
`,
    tests: ["5 4\n1 2\n1 3\n2 4\n3 5\n1", "6 4\n1 2\n2 3\n4 5\n5 6\n1", "1 0\n1", "4 6\n1 2\n1 3\n1 4\n2 3\n2 4\n3 4\n2", "4 2\n1 2\n3 4\n1"],
  },
  // ===================== GRUPA B: DISTANTE NEPONDERATE =====================
  {
    slug: "g-distanta-doua-noduri",
    title: "Distanta minima intre doua noduri",
    difficulty: "easy",
    tags: ["grafuri", "bfs", "distante"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, si doua noduri a si b. Determinati distanta minima (numarul minim de muchii) dintre a si b.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie. Pe ultima linie se citesc a si b.",
    output_format: "Se afiseaza distanta minima dintre a si b, sau -1 daca nu exista drum intre ele.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000",
    hints: "Rulati o parcurgere BFS din a si cititi distanta pana la b.",
    explanation: "Se ruleaza BFS din nodul a, care calculeaza distanta minima (in muchii) pana la orice nod accesibil; raspunsul este direct distanta calculata pentru b.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    int a, b; cin >> a >> b;
    vector<int> dist(n + 1, -1);
    queue<int> q; dist[a] = 0; q.push(a);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); }
    }
    cout << dist[b] << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
a, b = map(int, input().split())
dist = [-1] * (n + 1)
dist[a] = 0
q = deque([a])
while q:
    u = q.popleft()
    for v in adj[u]:
        if dist[v] == -1:
            dist[v] = dist[u] + 1
            q.append(v)
print(dist[b])
`,
    tests: ["5 4\n1 2\n1 3\n2 4\n3 5\n1 5", "6 4\n1 2\n2 3\n4 5\n5 6\n1 6", "1 0\n1 1", "4 2\n1 2\n3 4\n1 3", "7 6\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n4 7"],
  },
  {
    slug: "g-excentricitate-nod",
    title: "Excentricitatea unui nod",
    difficulty: "medium",
    tags: ["grafuri", "bfs", "distante"],
    statement: "Excentricitatea unui nod este distanta maxima de la acel nod la orice alt nod accesibil. Se da un graf neorientat simplu cu n noduri si m muchii, si un nod s. Determinati excentricitatea lui s.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie. Pe ultima linie se citeste s.",
    output_format: "Se afiseaza excentricitatea nodului s.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= s <= n",
    hints: "Rulati BFS din s si retineti distanta maxima obtinuta printre nodurile accesibile.",
    explanation: "Se ruleaza BFS din s, obtinand distanta minima de la s la fiecare nod accesibil din componenta sa; excentricitatea este maximul acestor distante.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    int s; cin >> s;
    vector<int> dist(n + 1, -1);
    queue<int> q; dist[s] = 0; q.push(s);
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
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
s = int(input())
dist = [-1] * (n + 1)
dist[s] = 0
q = deque([s])
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
    tests: ["5 4\n1 2\n1 3\n2 4\n3 5\n1", "6 4\n1 2\n2 3\n4 5\n5 6\n1", "1 0\n1", "4 3\n1 2\n2 3\n3 4\n1", "7 6\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n4"],
  },
  {
    slug: "g-diametru-componenta",
    title: "Diametrul componentei conexe",
    difficulty: "medium",
    tags: ["grafuri", "bfs", "distante"],
    statement: "Diametrul unei componente conexe este cea mai mare distanta minima dintre oricare doua noduri ale sale. Se da un graf neorientat simplu cu n noduri si m muchii, si un nod s. Determinati diametrul componentei conexe care il contine pe s.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie. Pe ultima linie se citeste s.",
    output_format: "Se afiseaza diametrul componentei conexe a lui s.",
    constraints: "1 <= n <= 300, 0 <= m <= n*(n-1)/2, 1 <= s <= n",
    hints: "Determinati mai intai toate nodurile din componenta lui s (printr-o parcurgere), apoi rulati cate o parcurgere BFS din fiecare dintre ele, retinand maximul tuturor distantelor obtinute.",
    explanation: "Pentru un graf general (nu neaparat arbore), diametrul unei componente se calculeaza corect rulind BFS din fiecare nod al componentei si retinand cea mai mare distanta gasita; cu n limitat la 300, aceasta abordare O(k*(n+m)) este suficient de rapida.\n\n**Complexitate:** O(n*(n+m))",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    int s; cin >> s;
    vector<int> dist0(n + 1, -1);
    queue<int> q0; dist0[s] = 0; q0.push(s);
    vector<int> comp;
    while (!q0.empty()) {
        int u = q0.front(); q0.pop();
        comp.push_back(u);
        for (int v : adj[u]) if (dist0[v] == -1) { dist0[v] = dist0[u] + 1; q0.push(v); }
    }
    int diam = 0;
    for (int start : comp) {
        vector<int> dist(n + 1, -1);
        queue<int> q; dist[start] = 0; q.push(start);
        while (!q.empty()) {
            int u = q.front(); q.pop();
            diam = max(diam, dist[u]);
            for (int v : adj[u]) if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); }
        }
    }
    cout << diam << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
s = int(input())
dist0 = [-1] * (n + 1)
dist0[s] = 0
q0 = deque([s])
comp = []
while q0:
    u = q0.popleft()
    comp.append(u)
    for v in adj[u]:
        if dist0[v] == -1:
            dist0[v] = dist0[u] + 1
            q0.append(v)
diam = 0
for start in comp:
    dist = [-1] * (n + 1)
    dist[start] = 0
    q = deque([start])
    while q:
        u = q.popleft()
        diam = max(diam, dist[u])
        for v in adj[u]:
            if dist[v] == -1:
                dist[v] = dist[u] + 1
                q.append(v)
print(diam)
`,
    tests: ["5 4\n1 2\n2 3\n3 4\n4 5\n1", "4 4\n1 2\n2 3\n3 4\n4 1\n2", "1 0\n1", "6 5\n1 2\n2 3\n3 4\n4 5\n5 6\n3", "7 6\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n4"],
  },
  {
    slug: "g-noduri-la-distanta",
    title: "Numarul de noduri la o distanta data",
    difficulty: "easy",
    tags: ["grafuri", "bfs", "distante"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, un nod sursa s si un numar k. Determinati cate noduri se afla la distanta exact k fata de s.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie. Pe ultima linie se citesc s si k.",
    output_format: "Se afiseaza numarul de noduri aflate la distanta exact k fata de s.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 0 <= k <= 100000",
    hints: "Calculati distantele prin BFS din s, apoi numarati nodurile cu dist[i] == k.",
    explanation: "Dupa ce se calculeaza distanta minima de la s la fiecare nod prin BFS, raspunsul este pur si simplu numarul de noduri al caror distanta calculata este exact k.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    int s, k; cin >> s >> k;
    vector<int> dist(n + 1, -1);
    queue<int> q; dist[s] = 0; q.push(s);
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
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
s, k = map(int, input().split())
dist = [-1] * (n + 1)
dist[s] = 0
q = deque([s])
while q:
    u = q.popleft()
    for v in adj[u]:
        if dist[v] == -1:
            dist[v] = dist[u] + 1
            q.append(v)
print(sum(1 for i in range(1, n + 1) if dist[i] == k))
`,
    tests: ["5 4\n1 2\n1 3\n2 4\n3 5\n1 2", "6 4\n1 2\n2 3\n4 5\n5 6\n1 0", "1 0\n1 5", "7 6\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n1 2", "4 2\n1 2\n3 4\n1 3"],
  },
  {
    slug: "g-drum-minim-afisare",
    title: "Afisarea unui drum minim",
    difficulty: "medium",
    tags: ["grafuri", "bfs", "distante"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, si doua noduri a si b. Determinati un drum minim (cu numarul minim de muchii) intre a si b si afisati-l.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie. Pe ultima linie se citesc a si b.",
    output_format: "Daca exista drum, pe prima linie se afiseaza lungimea sa (numarul de muchii), iar pe a doua linie nodurile drumului, in ordine, separate prin spatiu. Daca nu exista drum, se afiseaza doar -1.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000",
    hints: "Rulati BFS din a, retinand parintele fiecarui nod descoperit, apoi reconstruiti drumul de la b inapoi la a folosind parintii.",
    explanation: "BFS din a retine, pentru fiecare nod descoperit, parintele prin care a fost atins prima data. Deoarece BFS descopera nodurile in ordinea distantei minime, urmand lantul de parinti de la b pana la a se obtine un drum de lungime minima; acesta se inverseaza pentru afisare in ordinea a -> b.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    for (int i = 1; i <= n; i++) sort(adj[i].begin(), adj[i].end());
    int a, b; cin >> a >> b;
    vector<int> dist(n + 1, -1), parent(n + 1, -1);
    queue<int> q; dist[a] = 0; q.push(a);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) if (dist[v] == -1) { dist[v] = dist[u] + 1; parent[v] = u; q.push(v); }
    }
    if (dist[b] == -1) { cout << -1 << "\\n"; return 0; }
    vector<int> path;
    int cur = b;
    while (cur != -1) { path.push_back(cur); cur = parent[cur]; }
    reverse(path.begin(), path.end());
    cout << dist[b] << "\\n";
    for (size_t i = 0; i < path.size(); i++) cout << path[i] << (i + 1 < path.size() ? " " : "\\n");
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
for i in range(1, n + 1):
    adj[i].sort()
a, b = map(int, input().split())
dist = [-1] * (n + 1)
parent = [-1] * (n + 1)
dist[a] = 0
q = deque([a])
while q:
    u = q.popleft()
    for v in adj[u]:
        if dist[v] == -1:
            dist[v] = dist[u] + 1
            parent[v] = u
            q.append(v)
if dist[b] == -1:
    print(-1)
else:
    path = []
    cur = b
    while cur != -1:
        path.append(cur)
        cur = parent[cur]
    path.reverse()
    print(dist[b])
    print(" ".join(map(str, path)))
`,
    tests: ["5 5\n1 2\n1 3\n2 4\n3 4\n4 5\n1 5", "4 2\n1 2\n3 4\n1 3", "1 0\n1 1", "6 5\n1 2\n2 3\n3 4\n4 5\n5 6\n1 6", "7 6\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n4 7"],
  },
  // ===================== GRUPA C: COMPONENTE CONEXE =====================
  {
    slug: "g-marimea-componentelor",
    title: "Marimile componentelor conexe",
    difficulty: "medium",
    tags: ["grafuri", "componente"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii. Determinati marimile (numarul de noduri) ale tuturor componentelor conexe, afisate in ordine descrescatoare.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza marimile componentelor conexe, in ordine descrescatoare, separate prin spatiu.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000",
    hints: "Pentru fiecare nod nevizitat, porniti o parcurgere BFS/DFS, numarati nodurile atinse, apoi sortati toate marimile descrescator.",
    explanation: "Se identifica fiecare componenta conexa printr-o parcurgere pornita din primul nod nevizitat intalnit, numarand marimea ei; la final, lista marimilor se sorteaza descrescator.\n\n**Complexitate:** O(n log n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<bool> viz(n + 1, false);
    vector<int> sizes;
    for (int s = 1; s <= n; s++) {
        if (viz[s]) continue;
        int cnt = 0;
        queue<int> q; q.push(s); viz[s] = true;
        while (!q.empty()) {
            int u = q.front(); q.pop(); cnt++;
            for (int v : adj[u]) if (!viz[v]) { viz[v] = true; q.push(v); }
        }
        sizes.push_back(cnt);
    }
    sort(sizes.rbegin(), sizes.rend());
    for (size_t i = 0; i < sizes.size(); i++) cout << sizes[i] << (i + 1 < sizes.size() ? " " : "\\n");
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
viz = [False] * (n + 1)
sizes = []
for s in range(1, n + 1):
    if viz[s]:
        continue
    cnt = 0
    viz[s] = True
    q = deque([s])
    while q:
        u = q.popleft()
        cnt += 1
        for v in adj[u]:
            if not viz[v]:
                viz[v] = True
                q.append(v)
    sizes.append(cnt)
sizes.sort(reverse=True)
print(" ".join(map(str, sizes)))
`,
    tests: ["6 3\n1 2\n2 3\n4 5", "4 0", "1 0", "6 5\n1 2\n2 3\n3 4\n4 5\n5 6", "9 5\n1 2\n2 3\n4 5\n6 7\n7 8"],
  },
  {
    slug: "g-cea-mai-mare-componenta",
    title: "Cea mai mare componenta conexa",
    difficulty: "easy",
    tags: ["grafuri", "componente"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii. Determinati numarul de noduri din cea mai mare componenta conexa.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza numarul de noduri din cea mai mare componenta conexa.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000",
    hints: "Calculati marimea fiecarei componente printr-o parcurgere si retineti maximul.",
    explanation: "Se parcurge fiecare componenta conexa (printr-o parcurgere BFS/DFS pornita din fiecare nod inca nevizitat), retinand maximul marimilor obtinute.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<bool> viz(n + 1, false);
    int best = 0;
    for (int s = 1; s <= n; s++) {
        if (viz[s]) continue;
        int cnt = 0;
        queue<int> q; q.push(s); viz[s] = true;
        while (!q.empty()) {
            int u = q.front(); q.pop(); cnt++;
            for (int v : adj[u]) if (!viz[v]) { viz[v] = true; q.push(v); }
        }
        best = max(best, cnt);
    }
    cout << best << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
viz = [False] * (n + 1)
best = 0
for s in range(1, n + 1):
    if viz[s]:
        continue
    cnt = 0
    viz[s] = True
    q = deque([s])
    while q:
        u = q.popleft()
        cnt += 1
        for v in adj[u]:
            if not viz[v]:
                viz[v] = True
                q.append(v)
    best = max(best, cnt)
print(best)
`,
    tests: ["6 3\n1 2\n2 3\n4 5", "4 0", "1 0", "6 5\n1 2\n2 3\n3 4\n4 5\n5 6", "9 5\n1 2\n2 3\n4 5\n6 7\n7 8"],
  },
  {
    slug: "g-eticheta-componente",
    title: "Etichetarea componentelor conexe",
    difficulty: "medium",
    tags: ["grafuri", "componente"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii. Atribuiti fiecarei componente conexe o eticheta (numar), in ordinea in care este intalnita prima data parcurgand nodurile de la 1 la n, incepand cu eticheta 1. Afisati eticheta fiecarui nod.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza n numere separate prin spatiu: eticheta componentei nodului 1, 2, ..., n.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000",
    hints: "Parcurgeti nodurile 1..n; la fiecare nod nevizitat, incrementati eticheta curenta si porniti o parcurgere care marcheaza toate nodurile componentei cu aceasta eticheta.",
    explanation: "Se parcurg nodurile in ordine 1..n; de fiecare data cand se intalneste un nod fara eticheta, se incrementeaza eticheta curenta si se propaga aceasta eticheta la toate nodurile componentei sale printr-o parcurgere BFS/DFS.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> label(n + 1, 0);
    int cur = 0;
    for (int s = 1; s <= n; s++) {
        if (label[s] != 0) continue;
        cur++;
        queue<int> q; q.push(s); label[s] = cur;
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int v : adj[u]) if (label[v] == 0) { label[v] = cur; q.push(v); }
        }
    }
    for (int i = 1; i <= n; i++) cout << label[i] << (i < n ? " " : "\\n");
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
label = [0] * (n + 1)
cur = 0
for s in range(1, n + 1):
    if label[s] != 0:
        continue
    cur += 1
    label[s] = cur
    q = deque([s])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if label[v] == 0:
                label[v] = cur
                q.append(v)
print(" ".join(map(str, label[1:])))
`,
    tests: ["6 3\n1 2\n2 3\n4 5", "4 0", "1 0", "6 5\n1 2\n2 3\n3 4\n4 5\n5 6", "9 5\n1 2\n2 3\n4 5\n6 7\n7 8"],
  },
  {
    slug: "g-noduri-aceeasi-componenta",
    title: "Verificarea apartenentei la aceeasi componenta",
    difficulty: "easy",
    tags: ["grafuri", "componente"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, apoi q perechi de noduri. Pentru fiecare pereche (a, b), verificati daca a si b se afla in aceeasi componenta conexa.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie. Urmeaza o linie cu q, apoi q linii, fiecare cu doua numere a si b.",
    output_format: "Pentru fiecare interogare se afiseaza 'DA' daca a si b sunt in aceeasi componenta, altfel 'NU'.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= q <= 100000",
    hints: "Etichetati mai intai fiecare nod cu indicele componentei sale (printr-o parcurgere), apoi raspundeti la fiecare interogare comparand etichetele.",
    explanation: "Se calculeaza, printr-o singura trecere de parcurgeri BFS/DFS, eticheta componentei fiecarui nod; apoi fiecare interogare se rezolva in O(1) comparand etichetele celor doua noduri.\n\n**Complexitate:** O(n + m + q)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> label(n + 1, 0);
    int cur = 0;
    for (int s = 1; s <= n; s++) {
        if (label[s] != 0) continue;
        cur++;
        queue<int> q; q.push(s); label[s] = cur;
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int v : adj[u]) if (label[v] == 0) { label[v] = cur; q.push(v); }
        }
    }
    int qcnt; cin >> qcnt;
    while (qcnt--) {
        int a, b; cin >> a >> b;
        cout << (label[a] == label[b] ? "DA" : "NU") << "\\n";
    }
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
label = [0] * (n + 1)
cur = 0
for s in range(1, n + 1):
    if label[s] != 0:
        continue
    cur += 1
    label[s] = cur
    q = deque([s])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if label[v] == 0:
                label[v] = cur
                q.append(v)
qcnt = int(input())
out = []
for _ in range(qcnt):
    a, b = map(int, input().split())
    out.append("DA" if label[a] == label[b] else "NU")
print("\\n".join(out))
`,
    tests: ["6 3\n1 2\n2 3\n4 5\n2\n1 3\n1 4", "4 0\n1\n1 2", "1 0\n1\n1 1", "6 5\n1 2\n2 3\n3 4\n4 5\n5 6\n1\n1 6", "9 5\n1 2\n2 3\n4 5\n6 7\n7 8\n2\n1 3\n6 9"],
  },
  {
    slug: "g-numar-perechi-neconectate",
    title: "Numarul de perechi de noduri neconectate",
    difficulty: "medium",
    tags: ["grafuri", "componente"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii. Determinati numarul de perechi de noduri (i, j) cu i < j care nu se afla in aceeasi componenta conexa.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza un singur numar: numarul de perechi neconectate.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000",
    hints: "Numarul total de perechi este n*(n-1)/2. Din acesta se scade, pentru fiecare componenta de marime k, numarul de perechi din interiorul ei, k*(k-1)/2.",
    explanation: "Numarul total de perechi de noduri distincte este n*(n-1)/2. Perechile 'conectate' (in aceeasi componenta) sunt cele din interiorul fiecarei componente; pentru o componenta de marime k acestea sunt k*(k-1)/2. Scazand suma acestora din totalul general se obtine numarul de perechi neconectate.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (long long i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<bool> viz(n + 1, false);
    long long conectate = 0;
    for (int s = 1; s <= n; s++) {
        if (viz[s]) continue;
        long long cnt = 0;
        queue<int> q; q.push(s); viz[s] = true;
        while (!q.empty()) {
            int u = q.front(); q.pop(); cnt++;
            for (int v : adj[u]) if (!viz[v]) { viz[v] = true; q.push(v); }
        }
        conectate += cnt * (cnt - 1) / 2;
    }
    long long total = n * (n - 1) / 2;
    cout << (total - conectate) << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
viz = [False] * (n + 1)
conectate = 0
for s in range(1, n + 1):
    if viz[s]:
        continue
    cnt = 0
    viz[s] = True
    q = deque([s])
    while q:
        u = q.popleft()
        cnt += 1
        for v in adj[u]:
            if not viz[v]:
                viz[v] = True
                q.append(v)
    conectate += cnt * (cnt - 1) // 2
total = n * (n - 1) // 2
print(total - conectate)
`,
    tests: ["6 3\n1 2\n2 3\n4 5", "4 0", "1 0", "6 5\n1 2\n2 3\n3 4\n4 5\n5 6", "9 5\n1 2\n2 3\n4 5\n6 7\n7 8"],
  },
  {
    slug: "g-componenta-unui-nod",
    title: "Nodurile din componenta conexa a unui nod",
    difficulty: "easy",
    tags: ["grafuri", "componente"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, si un nod s. Afisati toate nodurile din componenta conexa a lui s, in ordine crescatoare.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie. Pe ultima linie se citeste s.",
    output_format: "Se afiseaza nodurile componentei conexe a lui s, in ordine crescatoare, separate prin spatiu.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= s <= n",
    hints: "Rulati o parcurgere BFS/DFS din s, colectati nodurile atinse si sortati-le.",
    explanation: "O parcurgere BFS/DFS pornita din s atinge exact nodurile din componenta sa conexa; colectand aceste noduri si sortandu-le crescator se obtine raspunsul.\n\n**Complexitate:** O(n log n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    int s; cin >> s;
    vector<bool> viz(n + 1, false);
    vector<int> comp;
    queue<int> q; q.push(s); viz[s] = true;
    while (!q.empty()) {
        int u = q.front(); q.pop(); comp.push_back(u);
        for (int v : adj[u]) if (!viz[v]) { viz[v] = true; q.push(v); }
    }
    sort(comp.begin(), comp.end());
    for (size_t i = 0; i < comp.size(); i++) cout << comp[i] << (i + 1 < comp.size() ? " " : "\\n");
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
s = int(input())
viz = [False] * (n + 1)
comp = []
viz[s] = True
q = deque([s])
while q:
    u = q.popleft()
    comp.append(u)
    for v in adj[u]:
        if not viz[v]:
            viz[v] = True
            q.append(v)
comp.sort()
print(" ".join(map(str, comp)))
`,
    tests: ["6 3\n1 2\n2 3\n4 5\n1", "4 0\n2", "1 0\n1", "6 5\n1 2\n2 3\n3 4\n4 5\n5 6\n1", "9 5\n1 2\n2 3\n4 5\n6 7\n7 8\n7"],
  },
  // ===================== GRUPA D: BIPARTITIE SI BFS MULTISURSA =====================
  {
    slug: "g-verificare-bipartit",
    title: "Verificarea daca un graf este bipartit",
    difficulty: "medium",
    tags: ["grafuri", "bipartit"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, posibil neconex. Verificati daca graful este bipartit, adica nodurile pot fi colorate cu doua culori astfel incat orice muchie sa lege noduri de culori diferite.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza 'DA' daca graful este bipartit, altfel 'NU'.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000",
    hints: "Colorati fiecare componenta prin BFS: radacina primeste culoarea 0, iar fiecare vecin nou primeste culoarea opusa parintelui sau. Daca un nod deja colorat este intalnit cu aceeasi culoare ca vecinul curent, graful nu este bipartit.",
    explanation: "Se incearca o 2-colorare prin BFS pe fiecare componenta: radacina primeste culoarea 0, iar orice nod nou descoperit primeste culoarea opusa parintelui. Daca in timpul parcurgerii se descopera o muchie catre un nod deja colorat cu aceeasi culoare, exista un ciclu de lungime impara, deci graful nu este bipartit.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> color(n + 1, -1);
    bool bipartit = true;
    for (int s = 1; s <= n; s++) {
        if (color[s] != -1) continue;
        color[s] = 0;
        queue<int> q; q.push(s);
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int v : adj[u]) {
                if (color[v] == -1) { color[v] = 1 - color[u]; q.push(v); }
                else if (color[v] == color[u]) bipartit = false;
            }
        }
    }
    cout << (bipartit ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
color = [-1] * (n + 1)
bipartit = True
for s in range(1, n + 1):
    if color[s] != -1:
        continue
    color[s] = 0
    q = deque([s])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if color[v] == -1:
                color[v] = 1 - color[u]
                q.append(v)
            elif color[v] == color[u]:
                bipartit = False
print("DA" if bipartit else "NU")
`,
    tests: ["4 4\n1 2\n2 3\n3 4\n4 1", "3 3\n1 2\n2 3\n1 3", "1 0", "6 4\n1 2\n2 3\n4 5\n5 6", "5 5\n1 2\n2 3\n3 4\n4 5\n5 1"],
  },
  {
    slug: "g-afisare-partitii-bipartit",
    title: "Afisarea partitiilor unui graf bipartit",
    difficulty: "medium",
    tags: ["grafuri", "bipartit"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, garantat bipartit, posibil neconex. Determinati o 2-colorare valida si afisati cele doua multimi de noduri.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Pe prima linie se afiseaza nodurile din prima multime (culoarea 0), in ordine crescatoare, separate prin spatiu. Pe a doua linie, nodurile din a doua multime (culoarea 1), in ordine crescatoare.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, se garanteaza ca graful este bipartit",
    hints: "Colorati fiecare componenta prin BFS: radacina (cel mai mic nod nevizitat) primeste culoarea 0, iar fiecare vecin nou primeste culoarea opusa parintelui.",
    explanation: "Se coloreaza fiecare componenta printr-o parcurgere BFS pornita din cel mai mic nod nevizitat, atribuindu-i culoarea 0 si alternand culorile pe masura ce se descopera vecini noi. Deoarece graful este garantat bipartit, aceasta colorare este mereu valida; la final nodurile se grupeaza dupa culoare si se afiseaza in ordine crescatoare.\n\n**Complexitate:** O(n log n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> color(n + 1, -1);
    for (int s = 1; s <= n; s++) {
        if (color[s] != -1) continue;
        color[s] = 0;
        queue<int> q; q.push(s);
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int v : adj[u]) if (color[v] == -1) { color[v] = 1 - color[u]; q.push(v); }
        }
    }
    vector<int> a, b;
    for (int i = 1; i <= n; i++) (color[i] == 0 ? a : b).push_back(i);
    for (size_t i = 0; i < a.size(); i++) cout << a[i] << (i + 1 < a.size() ? " " : "");
    cout << "\\n";
    for (size_t i = 0; i < b.size(); i++) cout << b[i] << (i + 1 < b.size() ? " " : "");
    cout << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
color = [-1] * (n + 1)
for s in range(1, n + 1):
    if color[s] != -1:
        continue
    color[s] = 0
    q = deque([s])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if color[v] == -1:
                color[v] = 1 - color[u]
                q.append(v)
a = [i for i in range(1, n + 1) if color[i] == 0]
b = [i for i in range(1, n + 1) if color[i] == 1]
print(" ".join(map(str, a)))
print(" ".join(map(str, b)))
`,
    tests: ["4 4\n1 2\n2 3\n3 4\n4 1", "6 4\n1 2\n2 3\n4 5\n5 6", "1 0", "5 4\n1 2\n2 3\n3 4\n4 5", "4 0"],
  },
  {
    slug: "g-bfs-multisursa",
    title: "BFS multi-sursa",
    difficulty: "medium",
    tags: ["grafuri", "bfs"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, si o multime S de k noduri sursa. Determinati, pentru fiecare nod, distanta minima pana la cel mai apropiat nod din S.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie. Urmeaza o linie cu k, apoi o linie cu cele k noduri din S.",
    output_format: "Se afiseaza n numere separate prin spatiu: distanta minima de la nodul 1, 2, ..., n pana la cel mai apropiat nod din S (-1 daca niciun nod din S nu este accesibil).",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= k <= n",
    hints: "Initializati coada BFS cu toate nodurile din S la distanta 0 in loc de un singur nod sursa.",
    explanation: "BFS multi-sursa functioneaza identic cu BFS obisnuit, doar ca in coada se pun initial toate nodurile din S, fiecare cu distanta 0. Deoarece BFS exploreaza nivel cu nivel, prima data cand un nod este descoperit, aceasta se intampla la distanta minima fata de cel mai apropiat nod sursa.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    int k; cin >> k;
    vector<int> dist(n + 1, -1);
    queue<int> q;
    for (int i = 0; i < k; i++) { int v; cin >> v; if (dist[v] == -1) { dist[v] = 0; q.push(v); } }
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); }
    }
    for (int i = 1; i <= n; i++) cout << dist[i] << (i < n ? " " : "\\n");
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
k = int(input())
S = list(map(int, input().split()))
dist = [-1] * (n + 1)
q = deque()
for v in S:
    if dist[v] == -1:
        dist[v] = 0
        q.append(v)
while q:
    u = q.popleft()
    for v in adj[u]:
        if dist[v] == -1:
            dist[v] = dist[u] + 1
            q.append(v)
print(" ".join(map(str, dist[1:])))
`,
    tests: ["6 5\n1 2\n2 3\n3 4\n4 5\n5 6\n2\n1 6", "5 4\n1 2\n2 3\n3 4\n4 5\n1\n3", "1 0\n1\n1", "7 4\n1 2\n3 4\n5 6\n6 7\n3\n1 4 7", "4 0\n2\n1 3"],
  },
  // ===================== GRUPA E: STRUCTURA AVANSATA (DFS CU TIMPI) =====================
  {
    slug: "g-lungime-cel-mai-scurt-ciclu",
    title: "Lungimea celui mai scurt ciclu",
    difficulty: "hard",
    tags: ["grafuri", "bfs", "cicluri"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii. Determinati lungimea celui mai scurt ciclu din graf (numarul de muchii ale ciclului), sau -1 daca graful nu contine niciun ciclu.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza lungimea celui mai scurt ciclu, sau -1 daca nu exista niciun ciclu.",
    constraints: "1 <= n <= 200, 0 <= m <= n*(n-1)/2",
    hints: "Rulati o parcurgere BFS din fiecare nod. In timpul unei BFS pornite din s, de fiecare data cand se intalneste o muchie (u, v) catre un nod v deja vizitat care nu este parintele lui u, s-a gasit un ciclu de lungime dist[u] + dist[v] + 1.",
    explanation: "Tehnica standard pentru a determina cel mai scurt ciclu (girth) al unui graf neponderat consta in a rula BFS din fiecare nod al grafului. In fiecare astfel de BFS, orice muchie catre un nod deja descoperit, alta decat muchia spre parintele curent, este o muchie 'non-arbore' care inchide un ciclu de lungime dist[u] + dist[v] + 1 fata de radacina BFS-ului curent. Minimul acestor valori peste toate cele n parcurgeri este lungimea celui mai scurt ciclu din graf.\n\n**Complexitate:** O(n*(n+m))",
    time_limit_ms: 3000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    long long best = 1000000000LL;
    for (int s = 1; s <= n; s++) {
        vector<int> dist(n + 1, -1), parent(n + 1, -1);
        dist[s] = 0;
        queue<int> q; q.push(s);
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int v : adj[u]) {
                if (dist[v] == -1) { dist[v] = dist[u] + 1; parent[v] = u; q.push(v); }
                else if (v != parent[u]) best = min(best, (long long)dist[u] + dist[v] + 1);
            }
        }
    }
    cout << (best >= 1000000000LL ? -1 : best) << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y); adj[y].append(x)
best = 10 ** 9
for s in range(1, n + 1):
    dist = [-1] * (n + 1)
    parent = [-1] * (n + 1)
    dist[s] = 0
    q = deque([s])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if dist[v] == -1:
                dist[v] = dist[u] + 1
                parent[v] = u
                q.append(v)
            elif v != parent[u]:
                best = min(best, dist[u] + dist[v] + 1)
print(best if best < 10 ** 9 else -1)
`,
    tests: ["3 3\n1 2\n2 3\n1 3", "5 4\n1 2\n2 3\n3 4\n4 5", "6 6\n1 2\n2 3\n3 1\n4 5\n5 6\n6 4", "1 0", "4 4\n1 2\n2 3\n3 4\n4 1"],
  },
  {
    slug: "g-muchii-punte",
    title: "Muchii punte (bridges)",
    difficulty: "hard",
    tags: ["grafuri", "dfs", "punti"],
    statement: "O muchie este 'punte' daca eliminarea ei creste numarul de componente conexe ale grafului. Se da un graf neorientat simplu cu n noduri si m muchii. Determinati toate muchiile punte.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Pe prima linie se afiseaza numarul de muchii punte. Urmeaza acele muchii, cate una pe linie, sub forma i j (i < j), sortate crescator dupa i, apoi dupa j.",
    constraints: "1 <= n <= 20000, 0 <= m <= 40000",
    hints: "Folositi algoritmul lui Tarjan pentru punti: retineti pentru fiecare nod timpul de descoperire (disc) si cea mai mica valoare disc accesibila fara a folosi muchia spre parinte (low). O muchie (parinte, u) este punte daca low[u] > disc[parinte].",
    explanation: "Se face o parcurgere DFS (implementata iterativ pentru a evita depasirea stivei de recursivitate) retinand pentru fiecare nod timpul de descoperire disc[] si valoarea low[] (cel mai mic disc accesibil din subarborele sau, inclusiv prin cel mult o muchie 'de intoarcere'). O muchie tree (parinte(u), u) este punte exact cand low[u] > disc[parinte(u)], adica subarborele lui u nu poate 'ajunge inapoi' la parinte sau la stramosii sai decat prin aceasta muchie.\n\n**Complexitate:** O(n + m)",
    time_limit_ms: 3000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> disc(n + 1, -1), low(n + 1, 0), parent(n + 1, -1), it(n + 1, 0);
    int timer = 0;
    vector<pair<int,int>> bridges;
    for (int start = 1; start <= n; start++) {
        if (disc[start] != -1) continue;
        vector<int> stack; stack.push_back(start);
        disc[start] = low[start] = timer++;
        while (!stack.empty()) {
            int u = stack.back();
            if (it[u] < (int)adj[u].size()) {
                int v = adj[u][it[u]++];
                if (v == parent[u]) continue;
                if (disc[v] == -1) {
                    parent[v] = u;
                    disc[v] = low[v] = timer++;
                    stack.push_back(v);
                } else {
                    low[u] = min(low[u], disc[v]);
                }
            } else {
                stack.pop_back();
                if (!stack.empty()) {
                    int p = stack.back();
                    low[p] = min(low[p], low[u]);
                    if (low[u] > disc[p]) bridges.push_back({min(u, p), max(u, p)});
                }
            }
        }
    }
    sort(bridges.begin(), bridges.end());
    cout << bridges.size() << "\\n";
    for (auto& e : bridges) cout << e.first << " " << e.second << "\\n";
    return 0;
}
`,
    py: `import sys
def main():
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx]); idx += 1
    m = int(data[idx]); idx += 1
    adj = [[] for _ in range(n + 1)]
    for _ in range(m):
        x = int(data[idx]); idx += 1
        y = int(data[idx]); idx += 1
        adj[x].append(y); adj[y].append(x)
    disc = [-1] * (n + 1)
    low = [0] * (n + 1)
    parent = [-1] * (n + 1)
    it = [0] * (n + 1)
    timer = 0
    bridges = []
    for start in range(1, n + 1):
        if disc[start] != -1:
            continue
        stack = [start]
        disc[start] = low[start] = timer
        timer += 1
        while stack:
            u = stack[-1]
            if it[u] < len(adj[u]):
                v = adj[u][it[u]]
                it[u] += 1
                if v == parent[u]:
                    continue
                if disc[v] == -1:
                    parent[v] = u
                    disc[v] = low[v] = timer
                    timer += 1
                    stack.append(v)
                else:
                    low[u] = min(low[u], disc[v])
            else:
                stack.pop()
                if stack:
                    p = stack[-1]
                    low[p] = min(low[p], low[u])
                    if low[u] > disc[p]:
                        bridges.append((min(u, p), max(u, p)))
    bridges.sort()
    print(len(bridges))
    out = []
    for a, b in bridges:
        out.append(f"{a} {b}")
    if out:
        print("\\n".join(out))
main()
`,
    tests: ["5 4\n1 2\n2 3\n3 4\n4 5", "4 4\n1 2\n2 3\n3 4\n4 1", "6 5\n1 2\n2 3\n1 3\n3 4\n4 5", "1 0", "7 6\n1 2\n2 3\n3 1\n3 4\n4 5\n5 6"],
  },
  {
    slug: "g-noduri-articulatie",
    title: "Noduri de articulatie",
    difficulty: "hard",
    tags: ["grafuri", "dfs", "articulatie"],
    statement: "Un nod de articulatie (punct critic) este un nod a carui eliminare creste numarul de componente conexe ale grafului. Se da un graf neorientat simplu cu n noduri si m muchii. Determinati toate nodurile de articulatie.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Pe prima linie se afiseaza numarul de noduri de articulatie. Pe a doua linie se afiseaza indicii lor, in ordine crescatoare, separati prin spatiu (linie goala daca nu exista).",
    constraints: "1 <= n <= 20000, 0 <= m <= 40000",
    hints: "Folositi acelasi DFS cu disc/low ca la punti. Un nod u (diferit de radacina DFS) este de articulatie daca are un copil c cu low[c] >= disc[u]. Radacina DFS este de articulatie daca are cel putin doi copii in arborele DFS.",
    explanation: "Se refoloseste tehnica disc/low a algoritmului lui Tarjan. Pentru un nod u care nu este radacina parcurgerii sale, daca exista un copil c in arborele DFS cu low[c] >= disc[u], atunci subarborele lui c nu poate ajunge, ocolind pe u, la niciun stramos al lui u (sau la u insusi pe alta cale), deci u este punct critic. Radacina DFS este caz special: este de articulatie doar daca are cel putin doi copii distincti in arborele DFS (eliminand-o, acesti copii ajung in componente separate).\n\n**Complexitate:** O(n + m)",
    time_limit_ms: 3000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<int> disc(n + 1, -1), low(n + 1, 0), parent(n + 1, -1), it(n + 1, 0);
    vector<bool> isArt(n + 1, false);
    int timer = 0;
    for (int start = 1; start <= n; start++) {
        if (disc[start] != -1) continue;
        vector<int> stack; stack.push_back(start);
        disc[start] = low[start] = timer++;
        int childrenRoot = 0;
        while (!stack.empty()) {
            int u = stack.back();
            if (it[u] < (int)adj[u].size()) {
                int v = adj[u][it[u]++];
                if (v == parent[u]) continue;
                if (disc[v] == -1) {
                    parent[v] = u;
                    disc[v] = low[v] = timer++;
                    stack.push_back(v);
                    if (u == start) childrenRoot++;
                } else {
                    low[u] = min(low[u], disc[v]);
                }
            } else {
                stack.pop_back();
                if (!stack.empty()) {
                    int p = stack.back();
                    low[p] = min(low[p], low[u]);
                    if (p != start && low[u] >= disc[p]) isArt[p] = true;
                }
            }
        }
        if (childrenRoot >= 2) isArt[start] = true;
    }
    vector<int> rez;
    for (int i = 1; i <= n; i++) if (isArt[i]) rez.push_back(i);
    cout << rez.size() << "\\n";
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "");
    cout << "\\n";
    return 0;
}
`,
    py: `import sys
def main():
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx]); idx += 1
    m = int(data[idx]); idx += 1
    adj = [[] for _ in range(n + 1)]
    for _ in range(m):
        x = int(data[idx]); idx += 1
        y = int(data[idx]); idx += 1
        adj[x].append(y); adj[y].append(x)
    disc = [-1] * (n + 1)
    low = [0] * (n + 1)
    parent = [-1] * (n + 1)
    it = [0] * (n + 1)
    isArt = [False] * (n + 1)
    timer = 0
    for start in range(1, n + 1):
        if disc[start] != -1:
            continue
        stack = [start]
        disc[start] = low[start] = timer
        timer += 1
        childrenRoot = 0
        while stack:
            u = stack[-1]
            if it[u] < len(adj[u]):
                v = adj[u][it[u]]
                it[u] += 1
                if v == parent[u]:
                    continue
                if disc[v] == -1:
                    parent[v] = u
                    disc[v] = low[v] = timer
                    timer += 1
                    stack.append(v)
                    if u == start:
                        childrenRoot += 1
                else:
                    low[u] = min(low[u], disc[v])
            else:
                stack.pop()
                if stack:
                    p = stack[-1]
                    low[p] = min(low[p], low[u])
                    if p != start and low[u] >= disc[p]:
                        isArt[p] = True
        if childrenRoot >= 2:
            isArt[start] = True
    rez = [i for i in range(1, n + 1) if isArt[i]]
    print(len(rez))
    print(" ".join(map(str, rez)))
main()
`,
    tests: ["5 4\n1 2\n2 3\n3 4\n4 5", "4 4\n1 2\n2 3\n3 4\n4 1", "7 6\n1 2\n2 3\n3 1\n3 4\n4 5\n5 6", "1 0", "6 5\n1 2\n1 3\n1 4\n1 5\n1 6"],
  },
  {
    slug: "g-numar-componente-dupa-eliminare-nod",
    title: "Componente conexe dupa eliminarea unui nod",
    difficulty: "medium",
    tags: ["grafuri", "dfs"],
    statement: "Se da un graf neorientat simplu cu n noduri si m muchii, si un nod v. Determinati numarul de componente conexe ale grafului obtinut prin eliminarea nodului v (si a tuturor muchiilor sale).",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie. Pe ultima linie se citeste v.",
    output_format: "Se afiseaza numarul de componente conexe ale grafului dupa eliminarea nodului v.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= v <= n",
    hints: "Marcati nodul v ca deja 'vizitat' de la inceput, astfel incat sa fie ignorat complet, apoi numarati componentele ca de obicei.",
    explanation: "Simplu marcand nodul v ca vizitat inainte de a incepe, el nu va mai fi niciodata folosit ca punct de start si nici adaugat in nicio parcurgere (fiind deja marcat), ceea ce echivaleaza cu eliminarea sa completa din graf. Se numara apoi componentele conexe ca in problema standard.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    int v; cin >> v;
    vector<bool> viz(n + 1, false);
    viz[v] = true;
    int comp = 0;
    for (int s = 1; s <= n; s++) {
        if (viz[s]) continue;
        comp++;
        queue<int> q; q.push(s); viz[s] = true;
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int w : adj[u]) if (!viz[w]) { viz[w] = true; q.push(w); }
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
    adj[x].append(y); adj[y].append(x)
v = int(input())
viz = [False] * (n + 1)
viz[v] = True
comp = 0
for s in range(1, n + 1):
    if viz[s]:
        continue
    comp += 1
    viz[s] = True
    q = deque([s])
    while q:
        u = q.popleft()
        for w in adj[u]:
            if not viz[w]:
                viz[w] = True
                q.append(w)
print(comp)
`,
    tests: ["5 4\n1 2\n2 3\n3 4\n4 5\n3", "4 4\n1 2\n2 3\n3 4\n4 1\n2", "1 0\n1", "7 6\n1 2\n2 3\n3 1\n3 4\n4 5\n5 6\n3", "6 5\n1 2\n1 3\n1 4\n1 5\n1 6\n1"],
  },
  {
    slug: "g-graf-2-conex",
    title: "Verificarea 2-conexitatii unui graf",
    difficulty: "hard",
    tags: ["grafuri", "dfs", "articulatie"],
    statement: "Un graf cu cel putin 3 noduri este 2-conex (biconex) daca este conex si nu are niciun nod de articulatie (adica ramane conex dupa eliminarea oricarui nod). Se da un graf neorientat simplu cu n noduri si m muchii. Verificati daca este 2-conex.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza 'DA' daca graful este 2-conex, altfel 'NU'.",
    constraints: "3 <= n <= 20000, 0 <= m <= 40000",
    hints: "Verificati mai intai conexitatea printr-o parcurgere. Apoi rulati algoritmul disc/low pentru a determina daca exista vreun nod de articulatie.",
    explanation: "Se verifica intai conexitatea grafului printr-o parcurgere BFS simpla. Apoi se ruleaza acelasi algoritm disc/low folosit pentru determinarea nodurilor de articulatie; graful este 2-conex daca si numai daca este conex si acest algoritm nu gaseste niciun nod de articulatie.\n\n**Complexitate:** O(n + m)",
    time_limit_ms: 3000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y); adj[y].push_back(x);
    }
    vector<bool> vizc(n + 1, false);
    queue<int> qc; qc.push(1); vizc[1] = true; int reached = 1;
    while (!qc.empty()) {
        int u = qc.front(); qc.pop();
        for (int v : adj[u]) if (!vizc[v]) { vizc[v] = true; reached++; qc.push(v); }
    }
    bool conex = (reached == n);

    vector<int> disc(n + 1, -1), low(n + 1, 0), parent(n + 1, -1), it(n + 1, 0);
    bool hasArt = false;
    for (int start = 1; start <= n; start++) {
        if (disc[start] != -1) continue;
        vector<int> stack; stack.push_back(start);
        disc[start] = low[start] = 0;
        int timer = 1;
        int childrenRoot = 0;
        while (!stack.empty()) {
            int u = stack.back();
            if (it[u] < (int)adj[u].size()) {
                int v = adj[u][it[u]++];
                if (v == parent[u]) continue;
                if (disc[v] == -1) {
                    parent[v] = u;
                    disc[v] = low[v] = timer++;
                    stack.push_back(v);
                    if (u == start) childrenRoot++;
                } else {
                    low[u] = min(low[u], disc[v]);
                }
            } else {
                stack.pop_back();
                if (!stack.empty()) {
                    int p = stack.back();
                    low[p] = min(low[p], low[u]);
                    if (p != start && low[u] >= disc[p]) hasArt = true;
                }
            }
        }
        if (childrenRoot >= 2) hasArt = true;
    }
    cout << ((conex && !hasArt) ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `import sys
from collections import deque
def main():
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx]); idx += 1
    m = int(data[idx]); idx += 1
    adj = [[] for _ in range(n + 1)]
    for _ in range(m):
        x = int(data[idx]); idx += 1
        y = int(data[idx]); idx += 1
        adj[x].append(y); adj[y].append(x)

    vizc = [False] * (n + 1)
    vizc[1] = True
    reached = 1
    qc = deque([1])
    while qc:
        u = qc.popleft()
        for v in adj[u]:
            if not vizc[v]:
                vizc[v] = True
                reached += 1
                qc.append(v)
    conex = reached == n

    disc = [-1] * (n + 1)
    low = [0] * (n + 1)
    parent = [-1] * (n + 1)
    it = [0] * (n + 1)
    hasArt = False
    for start in range(1, n + 1):
        if disc[start] != -1:
            continue
        stack = [start]
        disc[start] = low[start] = 0
        timer = 1
        childrenRoot = 0
        while stack:
            u = stack[-1]
            if it[u] < len(adj[u]):
                v = adj[u][it[u]]
                it[u] += 1
                if v == parent[u]:
                    continue
                if disc[v] == -1:
                    parent[v] = u
                    disc[v] = low[v] = timer
                    timer += 1
                    stack.append(v)
                    if u == start:
                        childrenRoot += 1
                else:
                    low[u] = min(low[u], disc[v])
            else:
                stack.pop()
                if stack:
                    p = stack[-1]
                    low[p] = min(low[p], low[u])
                    if p != start and low[u] >= disc[p]:
                        hasArt = True
        if childrenRoot >= 2:
            hasArt = True
    print("DA" if (conex and not hasArt) else "NU")
main()
`,
    tests: ["4 4\n1 2\n2 3\n3 4\n4 1", "5 4\n1 2\n2 3\n3 4\n4 5", "6 6\n1 2\n2 3\n3 1\n3 4\n4 5\n5 3", "6 6\n1 2\n2 3\n3 1\n3 4\n4 5\n5 6", "4 5\n1 2\n2 3\n3 4\n4 1\n1 3"],
  },
  // ===================== GRUPA F: APLICATII PE GRILA =====================
  {
    slug: "g-culoare-flood-fill",
    title: "Flood fill pe o grila",
    difficulty: "easy",
    tags: ["grafuri", "grila", "bfs"],
    statement: "Se da o grila de R linii si C coloane, fiecare celula continand o cifra (culoare). Pornind de la o celula data, recolorati (cu o noua culoare) toate celulele accesibile din ea prin miscari pe orizontala/verticala (sus, jos, stanga, dreapta) prin celule de aceeasi culoare cu cea initiala.",
    input_format: "Pe prima linie se citesc R si C. Urmeaza R linii, fiecare cu C cifre (fara spatii). Pe ultima linie se citesc r, c (linia si coloana celulei de start, 1-indexate) si noua culoare (o cifra).",
    output_format: "Se afiseaza grila dupa recolorare, R linii de cate C cifre.",
    constraints: "1 <= R, C <= 200",
    hints: "Daca noua culoare este identica cu culoarea veche a celulei de start, grila ramane neschimbata. Altfel, folositi BFS/DFS pornind din celula de start, recolorand toate celulele conectate de aceeasi culoare veche.",
    explanation: "Se porneste o parcurgere (BFS sau DFS) din celula (r, c), extinzandu-se doar catre celule vecine (4 directii) care au exact culoarea veche a celulei de start; fiecare celula vizitata este recolorata imediat cu noua culoare. Cazul in care noua culoare coincide cu cea veche trebuie tratat separat, pentru a evita o bucla infinita.\n\n**Complexitate:** O(R*C)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int R, C; cin >> R >> C;
    vector<string> g(R);
    for (auto& row : g) cin >> row;
    int r, c; char nc;
    cin >> r >> c >> nc;
    r--; c--;
    char oldc = g[r][c];
    if (oldc != nc) {
        vector<pair<int,int>> stack; stack.push_back({r, c});
        g[r][c] = nc;
        int dr[4] = {-1, 1, 0, 0}, dc[4] = {0, 0, -1, 1};
        while (!stack.empty()) {
            auto [cr, cc] = stack.back(); stack.pop_back();
            for (int d = 0; d < 4; d++) {
                int nr = cr + dr[d], ncx = cc + dc[d];
                if (nr >= 0 && nr < R && ncx >= 0 && ncx < C && g[nr][ncx] == oldc) {
                    g[nr][ncx] = nc;
                    stack.push_back({nr, ncx});
                }
            }
        }
    }
    for (auto& row : g) cout << row << "\\n";
    return 0;
}
`,
    py: `R, C = map(int, input().split())
g = [list(input()) for _ in range(R)]
r, c, nc = input().split()
r = int(r) - 1
c = int(c) - 1
oldc = g[r][c]
if oldc != nc:
    stack = [(r, c)]
    g[r][c] = nc
    while stack:
        cr, cc = stack.pop()
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nr, ncx = cr + dr, cc + dc
            if 0 <= nr < R and 0 <= ncx < C and g[nr][ncx] == oldc:
                g[nr][ncx] = nc
                stack.append((nr, ncx))
for row in g:
    print("".join(row))
`,
    tests: ["3 3\n111\n101\n111\n1 1 2", "1 1\n5\n1 1 5", "3 3\n123\n456\n789\n2 2 0", "4 4\n1111\n1221\n1221\n1111\n1 1 3", "2 3\n000\n001\n1 1 5"],
  },
  {
    slug: "g-insule-numar",
    title: "Numarul de insule",
    difficulty: "easy",
    tags: ["grafuri", "grila", "bfs"],
    statement: "Se da o grila binara de R linii si C coloane ('1' = teren, '0' = apa). O insula este un grup de celule '1' conectate pe orizontala/verticala. Determinati numarul de insule.",
    input_format: "Pe prima linie se citesc R si C. Urmeaza R linii, fiecare cu C caractere ('0' sau '1'), fara spatii.",
    output_format: "Se afiseaza un singur numar: numarul de insule.",
    constraints: "1 <= R, C <= 500",
    hints: "Parcurgeti toate celulele; de fiecare data cand gasiti o celula '1' nevizitata, incrementati numarul de insule si 'scufundati-o' printr-un BFS/DFS care marcheaza toata insula ca vizitata.",
    explanation: "Se parcurg toate celulele grilei; cand se gaseste o celula cu '1' nevizitata, se porneste o parcurgere BFS/DFS (4 directii) care marcheaza toate celulele conectate ale acelei insule ca vizitate, si se incrementeaza numarul de insule.\n\n**Complexitate:** O(R*C)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int R, C; cin >> R >> C;
    vector<string> g(R);
    for (auto& row : g) cin >> row;
    vector<vector<bool>> viz(R, vector<bool>(C, false));
    int dr[4] = {-1, 1, 0, 0}, dc[4] = {0, 0, -1, 1};
    int islands = 0;
    for (int i = 0; i < R; i++) for (int j = 0; j < C; j++) {
        if (g[i][j] == '1' && !viz[i][j]) {
            islands++;
            vector<pair<int,int>> stack; stack.push_back({i, j});
            viz[i][j] = true;
            while (!stack.empty()) {
                auto [cr, cc] = stack.back(); stack.pop_back();
                for (int d = 0; d < 4; d++) {
                    int nr = cr + dr[d], nc = cc + dc[d];
                    if (nr >= 0 && nr < R && nc >= 0 && nc < C && g[nr][nc] == '1' && !viz[nr][nc]) {
                        viz[nr][nc] = true;
                        stack.push_back({nr, nc});
                    }
                }
            }
        }
    }
    cout << islands << "\\n";
    return 0;
}
`,
    py: `R, C = map(int, input().split())
g = [input() for _ in range(R)]
viz = [[False] * C for _ in range(R)]
islands = 0
for i in range(R):
    for j in range(C):
        if g[i][j] == '1' and not viz[i][j]:
            islands += 1
            stack = [(i, j)]
            viz[i][j] = True
            while stack:
                cr, cc = stack.pop()
                for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    nr, nc = cr + dr, cc + dc
                    if 0 <= nr < R and 0 <= nc < C and g[nr][nc] == '1' and not viz[nr][nc]:
                        viz[nr][nc] = True
                        stack.append((nr, nc))
print(islands)
`,
    tests: ["4 4\n1100\n1100\n0010\n0011", "3 3\n000\n000\n000", "1 5\n11011", "5 5\n11111\n10001\n10101\n10001\n11111", "1 1\n1"],
  },
  {
    slug: "g-cea-mai-mare-insula",
    title: "Cea mai mare insula",
    difficulty: "medium",
    tags: ["grafuri", "grila", "bfs"],
    statement: "Se da o grila binara de R linii si C coloane ('1' = teren, '0' = apa). O insula este un grup de celule '1' conectate pe orizontala/verticala. Determinati numarul de celule al celei mai mari insule.",
    input_format: "Pe prima linie se citesc R si C. Urmeaza R linii, fiecare cu C caractere ('0' sau '1'), fara spatii.",
    output_format: "Se afiseaza un singur numar: dimensiunea celei mai mari insule (0 daca nu exista nicio celula de teren).",
    constraints: "1 <= R, C <= 500",
    hints: "La fel ca la numararea insulelor, dar de data aceasta retineti dimensiunea fiecarei insule descoperite si pastrati maximul.",
    explanation: "Se parcurg toate celulele grilei ca la numararea insulelor, dar de fiecare data cand se porneste o parcurgere BFS/DFS pentru o noua insula, se numara si celulele ei, retinand maximul intre toate insulele gasite.\n\n**Complexitate:** O(R*C)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int R, C; cin >> R >> C;
    vector<string> g(R);
    for (auto& row : g) cin >> row;
    vector<vector<bool>> viz(R, vector<bool>(C, false));
    int dr[4] = {-1, 1, 0, 0}, dc[4] = {0, 0, -1, 1};
    int best = 0;
    for (int i = 0; i < R; i++) for (int j = 0; j < C; j++) {
        if (g[i][j] == '1' && !viz[i][j]) {
            int size = 0;
            vector<pair<int,int>> stack; stack.push_back({i, j});
            viz[i][j] = true;
            while (!stack.empty()) {
                auto [cr, cc] = stack.back(); stack.pop_back();
                size++;
                for (int d = 0; d < 4; d++) {
                    int nr = cr + dr[d], nc = cc + dc[d];
                    if (nr >= 0 && nr < R && nc >= 0 && nc < C && g[nr][nc] == '1' && !viz[nr][nc]) {
                        viz[nr][nc] = true;
                        stack.push_back({nr, nc});
                    }
                }
            }
            best = max(best, size);
        }
    }
    cout << best << "\\n";
    return 0;
}
`,
    py: `R, C = map(int, input().split())
g = [input() for _ in range(R)]
viz = [[False] * C for _ in range(R)]
best = 0
for i in range(R):
    for j in range(C):
        if g[i][j] == '1' and not viz[i][j]:
            size = 0
            stack = [(i, j)]
            viz[i][j] = True
            while stack:
                cr, cc = stack.pop()
                size += 1
                for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    nr, nc = cr + dr, cc + dc
                    if 0 <= nr < R and 0 <= nc < C and g[nr][nc] == '1' and not viz[nr][nc]:
                        viz[nr][nc] = True
                        stack.append((nr, nc))
            best = max(best, size)
print(best)
`,
    tests: ["4 4\n1100\n1100\n0010\n0011", "3 3\n000\n000\n000", "1 5\n11011", "5 5\n11111\n10001\n10101\n10001\n11111", "1 1\n1"],
  },
  {
    slug: "g-labirint-drum-minim",
    title: "Drumul minim intr-un labirint",
    difficulty: "medium",
    tags: ["grafuri", "grila", "bfs"],
    statement: "Se da un labirint de R linii si C coloane ('0' = celula libera, '1' = perete), un punct de start si un punct de sosire. Determinati numarul minim de pasi (miscari sus/jos/stanga/dreapta) pentru a ajunge de la start la sosire, trecand doar prin celule libere.",
    input_format: "Pe prima linie se citesc R si C. Urmeaza R linii, fiecare cu C caractere ('0' sau '1'), fara spatii. Pe ultima linie se citesc r1, c1, r2, c2 (linia si coloana celulei de start, respectiv a celei de sosire, 1-indexate; ambele celule sunt garantat libere).",
    output_format: "Se afiseaza numarul minim de pasi, sau -1 daca sosirea nu este accesibila din start.",
    constraints: "1 <= R, C <= 500",
    hints: "Folositi BFS pornind din celula de start, extinzand doar catre celule libere nevizitate, pana se atinge celula de sosire.",
    explanation: "Labirintul se trateaza ca un graf neponderat implicit, in care fiecare celula libera este un nod, iar muchiile leaga celule libere vecine (4 directii). O parcurgere BFS pornita din celula de start gaseste distanta minima (in pasi) pana la orice alta celula accesibila, inclusiv sosirea.\n\n**Complexitate:** O(R*C)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int R, C; cin >> R >> C;
    vector<string> g(R);
    for (auto& row : g) cin >> row;
    int r1, c1, r2, c2; cin >> r1 >> c1 >> r2 >> c2;
    r1--; c1--; r2--; c2--;
    vector<vector<int>> dist(R, vector<int>(C, -1));
    dist[r1][c1] = 0;
    queue<pair<int,int>> q; q.push({r1, c1});
    int dr[4] = {-1, 1, 0, 0}, dc[4] = {0, 0, -1, 1};
    while (!q.empty()) {
        auto [cr, cc] = q.front(); q.pop();
        for (int d = 0; d < 4; d++) {
            int nr = cr + dr[d], nc = cc + dc[d];
            if (nr >= 0 && nr < R && nc >= 0 && nc < C && g[nr][nc] == '0' && dist[nr][nc] == -1) {
                dist[nr][nc] = dist[cr][cc] + 1;
                q.push({nr, nc});
            }
        }
    }
    cout << dist[r2][c2] << "\\n";
    return 0;
}
`,
    py: `from collections import deque
R, C = map(int, input().split())
g = [input() for _ in range(R)]
r1, c1, r2, c2 = map(int, input().split())
r1 -= 1; c1 -= 1; r2 -= 1; c2 -= 1
dist = [[-1] * C for _ in range(R)]
dist[r1][c1] = 0
q = deque([(r1, c1)])
while q:
    cr, cc = q.popleft()
    for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        nr, nc = cr + dr, cc + dc
        if 0 <= nr < R and 0 <= nc < C and g[nr][nc] == '0' and dist[nr][nc] == -1:
            dist[nr][nc] = dist[cr][cc] + 1
            q.append((nr, nc))
print(dist[r2][c2])
`,
    tests: ["3 3\n000\n010\n000\n1 1 3 3", "3 3\n000\n111\n000\n1 1 3 3", "1 1\n0\n1 1 1 1", "4 4\n0000\n0110\n0110\n0000\n1 1 4 4", "3 4\n0011\n0011\n0000\n1 1 1 4"],
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
