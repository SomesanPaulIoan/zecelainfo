const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade11", chapter: "grafuri", sub: "grafuri-orientate-diverse" };

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
  // ===================== GRUPA A: REPREZENTARE SI GRADE ORIENTATE =====================
  {
    slug: "g-grad-intrare-nod",
    title: "Gradul de intrare al unui nod",
    difficulty: "easy",
    tags: ["grafuri", "orientat", "grade"],
    statement: "Se da un graf orientat simplu cu n noduri (numerotate de la 1 la n) si m muchii orientate. Determinati gradul de intrare al unui nod x (numarul de muchii care intra in x).",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere x y, reprezentand o muchie orientata de la x catre y. Pe ultima linie se citeste nodul cerut.",
    output_format: "Se afiseaza un singur numar: gradul de intrare al nodului cerut.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, fara autobucle",
    hints: "Numarati de cate ori apare nodul ca destinatie a unei muchii.",
    explanation: "Gradul de intrare al unui nod intr-un graf orientat este numarul de muchii care il au drept destinatie. Se calculeaza incrementand indeg[y] pentru fiecare muchie x -> y citita.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<int> indeg(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        indeg[y]++;
    }
    int q; cin >> q;
    cout << indeg[q] << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
indeg = [0] * (n + 1)
for _ in range(m):
    x, y = map(int, input().split())
    indeg[y] += 1
q = int(input())
print(indeg[q])
`,
    tests: ["4 4\n1 2\n1 3\n2 3\n3 4\n3", "4 4\n1 2\n1 3\n2 3\n3 4\n1", "1 0\n1", "5 3\n1 2\n1 3\n1 4\n5", "6 6\n1 2\n2 3\n3 1\n3 4\n4 5\n5 6\n1"],
  },
  {
    slug: "g-grad-iesire-nod",
    title: "Gradul de iesire al unui nod",
    difficulty: "easy",
    tags: ["grafuri", "orientat", "grade"],
    statement: "Se da un graf orientat simplu cu n noduri si m muchii orientate. Determinati gradul de iesire al unui nod x (numarul de muchii care pornesc din x).",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere x y, reprezentand o muchie orientata de la x catre y. Pe ultima linie se citeste nodul cerut.",
    output_format: "Se afiseaza un singur numar: gradul de iesire al nodului cerut.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, fara autobucle",
    hints: "Numarati de cate ori apare nodul ca origine a unei muchii.",
    explanation: "Gradul de iesire al unui nod este numarul de muchii care il au drept origine. Se calculeaza incrementand outdeg[x] pentru fiecare muchie x -> y citita.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<int> outdeg(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        outdeg[x]++;
    }
    int q; cin >> q;
    cout << outdeg[q] << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
outdeg = [0] * (n + 1)
for _ in range(m):
    x, y = map(int, input().split())
    outdeg[x] += 1
q = int(input())
print(outdeg[q])
`,
    tests: ["4 4\n1 2\n1 3\n2 3\n3 4\n3", "4 4\n1 2\n1 3\n2 3\n3 4\n1", "1 0\n1", "5 3\n1 2\n1 3\n1 4\n1", "6 6\n1 2\n2 3\n3 1\n3 4\n4 5\n5 6\n5"],
  },
  {
    slug: "g-noduri-sursa",
    title: "Nodurile sursa ale unui graf orientat",
    difficulty: "easy",
    tags: ["grafuri", "orientat", "grade"],
    statement: "Un nod sursa este un nod cu gradul de intrare 0. Se da un graf orientat simplu cu n noduri si m muchii orientate. Determinati toate nodurile sursa.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere x y, reprezentand o muchie orientata de la x catre y.",
    output_format: "Pe prima linie se afiseaza numarul de noduri sursa. Pe a doua linie se afiseaza indicii lor, in ordine crescatoare, separati prin spatiu (linie goala daca nu exista).",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, fara autobucle",
    hints: "Calculati gradul de intrare al fiecarui nod si selectati-le pe cele cu valoarea 0.",
    explanation: "Se calculeaza gradul de intrare al fiecarui nod, apoi se selecteaza cele cu grad 0; parcurgand nodurile in ordine 1..n rezultatul este automat sortat crescator.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<int> indeg(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        indeg[y]++;
    }
    vector<int> surse;
    for (int i = 1; i <= n; i++) if (indeg[i] == 0) surse.push_back(i);
    cout << surse.size() << "\\n";
    for (size_t i = 0; i < surse.size(); i++) cout << surse[i] << (i + 1 < surse.size() ? " " : "");
    cout << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
indeg = [0] * (n + 1)
for _ in range(m):
    x, y = map(int, input().split())
    indeg[y] += 1
surse = [i for i in range(1, n + 1) if indeg[i] == 0]
print(len(surse))
print(" ".join(map(str, surse)))
`,
    tests: ["4 3\n1 2\n1 3\n2 4", "4 0", "1 0", "6 5\n1 2\n2 3\n1 4\n5 6\n4 6", "5 4\n1 2\n2 3\n3 4\n4 5"],
  },
  {
    slug: "g-noduri-destinatie",
    title: "Nodurile destinatie ale unui graf orientat",
    difficulty: "easy",
    tags: ["grafuri", "orientat", "grade"],
    statement: "Un nod destinatie este un nod cu gradul de iesire 0. Se da un graf orientat simplu cu n noduri si m muchii orientate. Determinati toate nodurile destinatie.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere x y, reprezentand o muchie orientata de la x catre y.",
    output_format: "Pe prima linie se afiseaza numarul de noduri destinatie. Pe a doua linie se afiseaza indicii lor, in ordine crescatoare, separati prin spatiu (linie goala daca nu exista).",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, fara autobucle",
    hints: "Calculati gradul de iesire al fiecarui nod si selectati-le pe cele cu valoarea 0.",
    explanation: "Se calculeaza gradul de iesire al fiecarui nod, apoi se selecteaza cele cu grad 0, parcurse in ordine crescatoare.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<int> outdeg(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        outdeg[x]++;
    }
    vector<int> dest;
    for (int i = 1; i <= n; i++) if (outdeg[i] == 0) dest.push_back(i);
    cout << dest.size() << "\\n";
    for (size_t i = 0; i < dest.size(); i++) cout << dest[i] << (i + 1 < dest.size() ? " " : "");
    cout << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
outdeg = [0] * (n + 1)
for _ in range(m):
    x, y = map(int, input().split())
    outdeg[x] += 1
dest = [i for i in range(1, n + 1) if outdeg[i] == 0]
print(len(dest))
print(" ".join(map(str, dest)))
`,
    tests: ["4 3\n1 2\n1 3\n2 4", "4 0", "1 0", "6 5\n1 2\n2 3\n1 4\n5 6\n4 6", "5 4\n1 2\n2 3\n3 4\n4 5"],
  },
  {
    slug: "g-lista-adiacenta-orientata",
    title: "Lista de adiacenta a unui graf orientat",
    difficulty: "easy",
    tags: ["grafuri", "orientat", "reprezentare"],
    statement: "Se da un graf orientat simplu cu n noduri si m muchii orientate. Construiti si afisati lista succesorilor fiecarui nod.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere x y, reprezentand o muchie orientata de la x catre y.",
    output_format: "Se afiseaza n linii. Pe linia i se afiseaza i, urmat de ':', apoi succesorii nodului i in ordine crescatoare, separati prin spatiu.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, fara autobucle",
    hints: "Construiti lista de succesori adaugand y in lista lui x pentru fiecare muchie x -> y, apoi sortati fiecare lista.",
    explanation: "Spre deosebire de graful neorientat, la un graf orientat fiecare muchie x -> y se adauga doar in lista lui x (nu si in cea a lui y), deoarece relatia nu este simetrica.\n\n**Complexitate:** O(n + m log m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
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
for i in range(1, n + 1):
    adj[i].sort()
    print(str(i) + ":" + "".join(" " + str(v) for v in adj[i]))
`,
    tests: ["4 4\n1 2\n1 3\n2 3\n3 4", "4 0", "1 0", "5 3\n1 2\n1 3\n1 4", "6 6\n1 2\n2 3\n3 1\n3 4\n4 5\n5 6"],
  },
  // ===================== GRUPA B: ACCESIBILITATE ORIENTATA =====================
  {
    slug: "g-verificare-drum-orientat",
    title: "Verificarea existentei unui drum orientat",
    difficulty: "easy",
    tags: ["grafuri", "orientat", "bfs"],
    statement: "Se da un graf orientat simplu cu n noduri si m muchii orientate, si doua noduri a si b. Verificati daca exista un drum orientat de la a la b.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie orientata. Pe ultima linie se citesc a si b.",
    output_format: "Se afiseaza 'DA' daca exista drum orientat de la a la b, altfel 'NU'.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000",
    hints: "Rulati BFS/DFS din a, urmand doar muchiile in sensul lor de orientare, si verificati daca b este atins.",
    explanation: "Se ruleaza o parcurgere BFS din a, folosind doar lista de succesori (muchii parcurse in sensul lor de orientare); daca b apare printre nodurile atinse, exista drum orientat de la a la b. Cazul a == b este trivial adevarat (drumul vid).\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
    }
    int a, b; cin >> a >> b;
    vector<bool> viz(n + 1, false);
    queue<int> q; q.push(a); viz[a] = true;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) if (!viz[v]) { viz[v] = true; q.push(v); }
    }
    cout << (viz[b] ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y)
a, b = map(int, input().split())
viz = [False] * (n + 1)
viz[a] = True
q = deque([a])
while q:
    u = q.popleft()
    for v in adj[u]:
        if not viz[v]:
            viz[v] = True
            q.append(v)
print("DA" if viz[b] else "NU")
`,
    tests: ["4 3\n1 2\n2 3\n3 4\n1 4", "4 3\n1 2\n2 3\n3 4\n4 1", "1 0\n1 1", "5 4\n1 2\n2 3\n3 4\n4 5\n1 3", "6 6\n1 2\n2 3\n3 1\n3 4\n4 5\n5 6\n6 2"],
  },
  {
    slug: "g-distanta-orientata",
    title: "Distanta minima orientata",
    difficulty: "easy",
    tags: ["grafuri", "orientat", "bfs"],
    statement: "Se da un graf orientat simplu cu n noduri si m muchii orientate, si doua noduri a si b. Determinati distanta minima orientata (numarul minim de muchii) de la a la b.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie orientata. Pe ultima linie se citesc a si b.",
    output_format: "Se afiseaza distanta minima de la a la b, sau -1 daca b nu este accesibil din a.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000",
    hints: "Rulati BFS din a, urmand doar muchiile in sensul lor de orientare.",
    explanation: "BFS pe graful orientat, folosind doar lista de succesori, calculeaza distanta minima (in muchii) de la a la orice nod accesibil, exact ca in cazul neorientat, doar ca extinderea se face respectand orientarea muchiilor.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
    }
    int a, b; cin >> a >> b;
    vector<int> dist(n + 1, -1);
    dist[a] = 0;
    queue<int> q; q.push(a);
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
    adj[x].append(y)
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
    tests: ["4 3\n1 2\n2 3\n3 4\n1 4", "4 3\n1 2\n2 3\n3 4\n4 1", "1 0\n1 1", "5 4\n1 2\n2 3\n3 4\n4 5\n1 3", "6 6\n1 2\n2 3\n3 1\n3 4\n4 5\n5 6\n6 5"],
  },
  {
    slug: "g-noduri-accesibile",
    title: "Nodurile accesibile dintr-un nod",
    difficulty: "medium",
    tags: ["grafuri", "orientat", "bfs"],
    statement: "Se da un graf orientat simplu cu n noduri si m muchii orientate, si un nod s. Determinati toate nodurile accesibile din s (inclusiv s), in ordine crescatoare.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie orientata. Pe ultima linie se citeste s.",
    output_format: "Se afiseaza nodurile accesibile din s, in ordine crescatoare, separate prin spatiu.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= s <= n",
    hints: "Rulati o parcurgere BFS/DFS din s pe muchiile orientate si colectati nodurile atinse.",
    explanation: "O parcurgere BFS pornita din s, urmand doar muchiile in sensul lor de orientare, atinge exact multimea nodurilor accesibile din s; aceasta multime se sorteaza crescator pentru afisare.\n\n**Complexitate:** O(n log n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
    }
    int s; cin >> s;
    vector<bool> viz(n + 1, false);
    vector<int> rez;
    queue<int> q; q.push(s); viz[s] = true;
    while (!q.empty()) {
        int u = q.front(); q.pop(); rez.push_back(u);
        for (int v : adj[u]) if (!viz[v]) { viz[v] = true; q.push(v); }
    }
    sort(rez.begin(), rez.end());
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? " " : "\\n");
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y)
s = int(input())
viz = [False] * (n + 1)
rez = []
viz[s] = True
q = deque([s])
while q:
    u = q.popleft()
    rez.append(u)
    for v in adj[u]:
        if not viz[v]:
            viz[v] = True
            q.append(v)
rez.sort()
print(" ".join(map(str, rez)))
`,
    tests: ["5 4\n1 2\n1 3\n2 4\n3 4\n1", "4 3\n1 2\n2 3\n3 4\n3", "1 0\n1", "6 5\n1 2\n2 3\n3 1\n3 4\n4 5\n2", "5 0\n3"],
  },
  {
    slug: "g-numar-noduri-accesibile",
    title: "Numarul de noduri accesibile",
    difficulty: "easy",
    tags: ["grafuri", "orientat", "bfs"],
    statement: "Se da un graf orientat simplu cu n noduri si m muchii orientate, si un nod s. Determinati numarul de noduri accesibile din s (inclusiv s).",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie orientata. Pe ultima linie se citeste s.",
    output_format: "Se afiseaza un singur numar: numarul de noduri accesibile din s.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= s <= n",
    hints: "Rulati BFS din s si numarati nodurile vizitate.",
    explanation: "Se ruleaza BFS din s pe muchiile orientate si se numara nodurile atinse (inclusiv s insusi).\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
    }
    int s; cin >> s;
    vector<bool> viz(n + 1, false);
    int cnt = 0;
    queue<int> q; q.push(s); viz[s] = true;
    while (!q.empty()) {
        int u = q.front(); q.pop(); cnt++;
        for (int v : adj[u]) if (!viz[v]) { viz[v] = true; q.push(v); }
    }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y)
s = int(input())
viz = [False] * (n + 1)
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
print(cnt)
`,
    tests: ["5 4\n1 2\n1 3\n2 4\n3 4\n1", "4 3\n1 2\n2 3\n3 4\n3", "1 0\n1", "6 5\n1 2\n2 3\n3 1\n3 4\n4 5\n2", "5 0\n3"],
  },
  {
    slug: "g-perechi-accesibile-reciproc",
    title: "Verificarea accesibilitatii reciproce",
    difficulty: "medium",
    tags: ["grafuri", "orientat", "bfs"],
    statement: "Se da un graf orientat simplu cu n noduri si m muchii orientate, apoi q perechi de noduri. Pentru fiecare pereche (a, b), verificati daca a este accesibil din b SI b este accesibil din a.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie orientata. Urmeaza o linie cu q, apoi q linii, fiecare cu doua numere a si b.",
    output_format: "Pentru fiecare interogare se afiseaza 'DA' daca a si b sunt accesibile reciproc, altfel 'NU'.",
    constraints: "1 <= n <= 1000, 0 <= m <= 2000, 1 <= q <= 200",
    hints: "Pentru fiecare interogare, rulati doua parcurgeri BFS: una din a (verificati daca atinge b) si una din b (verificati daca atinge a).",
    explanation: "Doua noduri sunt accesibile reciproc daca exista drum orientat in ambele directii intre ele. Se verifica direct prin cate o parcurgere BFS pornita din fiecare capat al perechii interogate.\n\n**Complexitate:** O(q*(n+m))",
    cpp: `#include <bits/stdc++.h>
using namespace std;
bool reach(int s, int t, int n, vector<vector<int>>& adj) {
    vector<bool> viz(n + 1, false);
    queue<int> q; q.push(s); viz[s] = true;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        if (u == t) return true;
        for (int v : adj[u]) if (!viz[v]) { viz[v] = true; q.push(v); }
    }
    return viz[t];
}
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
    }
    int qcnt; cin >> qcnt;
    while (qcnt--) {
        int a, b; cin >> a >> b;
        bool ok = reach(a, b, n, adj) && reach(b, a, n, adj);
        cout << (ok ? "DA" : "NU") << "\\n";
    }
    return 0;
}
`,
    py: `from collections import deque
def reach(s, t, n, adj):
    viz = [False] * (n + 1)
    viz[s] = True
    q = deque([s])
    while q:
        u = q.popleft()
        if u == t:
            return True
        for v in adj[u]:
            if not viz[v]:
                viz[v] = True
                q.append(v)
    return viz[t]
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y)
qcnt = int(input())
out = []
for _ in range(qcnt):
    a, b = map(int, input().split())
    ok = reach(a, b, n, adj) and reach(b, a, n, adj)
    out.append("DA" if ok else "NU")
print("\\n".join(out))
`,
    tests: ["4 4\n1 2\n2 3\n3 1\n3 4\n2\n1 3\n1 4", "1 0\n1\n1 1", "5 4\n1 2\n2 3\n3 4\n4 5\n1\n1 5", "6 6\n1 2\n2 3\n3 1\n4 5\n5 6\n6 4\n2\n1 3\n1 4", "3 2\n1 2\n2 3\n1\n1 3"],
  },
  // ===================== GRUPA C: CICLURI SI DAG =====================
  {
    slug: "g-verificare-ciclu-orientat",
    title: "Verificarea existentei unui ciclu orientat",
    difficulty: "medium",
    tags: ["grafuri", "orientat", "dfs", "cicluri"],
    statement: "Se da un graf orientat simplu cu n noduri si m muchii orientate. Verificati daca graful contine vreun ciclu orientat.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere x y, reprezentand o muchie orientata de la x catre y.",
    output_format: "Se afiseaza 'DA' daca graful contine un ciclu, altfel 'NU'.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000",
    hints: "Folositi o parcurgere DFS cu 3 stari pentru fiecare nod: nevizitat, 'in curs de procesare' (pe stiva curenta de recursivitate) si 'complet procesat'. Un ciclu exista daca se intalneste o muchie catre un nod 'in curs de procesare'.",
    explanation: "Tehnica standard de detectie a ciclurilor intr-un graf orientat foloseste 3 culori: alb (nevizitat), gri (aflat curent pe drumul DFS activ) si negru (complet procesat, impreuna cu tot subarborele sau). O muchie catre un nod gri indica un ciclu (deoarece exista deja un drum de la acel nod, prin stiva curenta, inapoi la el insusi); o muchie catre un nod negru este o muchie 'de inainte' sau 'incrucisata', care nu creeaza ciclu.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
    }
    vector<int> color(n + 1, 0), it(n + 1, 0);
    bool hasCycle = false;
    for (int start = 1; start <= n; start++) {
        if (color[start] != 0) continue;
        vector<int> stack; stack.push_back(start);
        color[start] = 1;
        while (!stack.empty()) {
            int u = stack.back();
            if (it[u] < (int)adj[u].size()) {
                int v = adj[u][it[u]++];
                if (color[v] == 0) { color[v] = 1; stack.push_back(v); }
                else if (color[v] == 1) hasCycle = true;
            } else {
                color[u] = 2;
                stack.pop_back();
            }
        }
    }
    cout << (hasCycle ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y)
color = [0] * (n + 1)
it = [0] * (n + 1)
hasCycle = False
for start in range(1, n + 1):
    if color[start] != 0:
        continue
    stack = [start]
    color[start] = 1
    while stack:
        u = stack[-1]
        if it[u] < len(adj[u]):
            v = adj[u][it[u]]
            it[u] += 1
            if color[v] == 0:
                color[v] = 1
                stack.append(v)
            elif color[v] == 1:
                hasCycle = True
        else:
            color[u] = 2
            stack.pop()
print("DA" if hasCycle else "NU")
`,
    tests: ["3 3\n1 2\n2 3\n3 1", "4 3\n1 2\n2 3\n3 4", "1 0", "5 5\n1 2\n2 3\n3 4\n4 5\n5 3", "6 5\n1 2\n2 3\n1 3\n4 5\n5 6"],
  },
  {
    slug: "g-verificare-existenta-ciclu-prin-nod",
    title: "Verificarea existentei unui ciclu printr-un nod dat",
    difficulty: "medium",
    tags: ["grafuri", "orientat", "bfs", "cicluri"],
    statement: "Se da un graf orientat simplu cu n noduri si m muchii orientate, si un nod s. Verificati daca s se afla pe vreun ciclu orientat.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie orientata. Pe ultima linie se citeste s.",
    output_format: "Se afiseaza 'DA' daca s se afla pe un ciclu orientat, altfel 'NU'.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= s <= n",
    hints: "Determinati multimea R a nodurilor accesibile din s. Nodul s se afla pe un ciclu daca si numai daca exista o muchie u -> s cu u in R.",
    explanation: "Daca s se afla pe un ciclu, atunci exista un drum s -> ... -> u -> s, deci u este accesibil din s (u apartine multimii R calculate prin BFS din s) si exista muchia u -> s. Reciproc, daca un asemenea u exista, drumul s -> ... -> u urmat de muchia u -> s formeaza un ciclu ce trece prin s. Se calculeaza R printr-o parcurgere si se verifica toate muchiile care intra in s.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    vector<pair<int,int>> edges(m);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
        edges[i] = {x, y};
    }
    int s; cin >> s;
    vector<bool> R(n + 1, false);
    queue<int> q; q.push(s); R[s] = true;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) if (!R[v]) { R[v] = true; q.push(v); }
    }
    bool onCycle = false;
    for (auto& e : edges) if (e.second == s && R[e.first]) onCycle = true;
    cout << (onCycle ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
edges = []
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y)
    edges.append((x, y))
s = int(input())
R = [False] * (n + 1)
R[s] = True
q = deque([s])
while q:
    u = q.popleft()
    for v in adj[u]:
        if not R[v]:
            R[v] = True
            q.append(v)
onCycle = any(y == s and R[x] for x, y in edges)
print("DA" if onCycle else "NU")
`,
    tests: ["3 3\n1 2\n2 3\n3 1\n2", "4 3\n1 2\n2 3\n3 4\n1", "1 0\n1", "5 5\n1 2\n2 3\n3 4\n4 5\n5 3\n2", "6 5\n1 2\n2 3\n1 3\n4 5\n5 6\n4"],
  },
  {
    slug: "g-lungime-cel-mai-scurt-ciclu-orientat",
    title: "Cel mai scurt ciclu orientat printr-un nod",
    difficulty: "hard",
    tags: ["grafuri", "orientat", "bfs", "cicluri"],
    statement: "Se da un graf orientat simplu cu n noduri si m muchii orientate, si un nod s. Determinati lungimea celui mai scurt ciclu orientat care trece prin s (numarul de muchii ale ciclului), sau -1 daca nu exista niciunul.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie orientata. Pe ultima linie se citeste s.",
    output_format: "Se afiseaza lungimea celui mai scurt ciclu care trece prin s, sau -1 daca nu exista.",
    constraints: "1 <= n <= 300, 0 <= m <= n*(n-1)",
    hints: "Pentru fiecare succesor direct v al lui s, calculati (prin BFS) distanta minima orientata de la v inapoi la s; candidatul de ciclu are lungimea 1 + aceasta distanta. Raspunsul este minimul peste toti succesorii directi ai lui s.",
    explanation: "Orice ciclu care trece prin s foloseste o prima muchie s -> v catre un succesor direct v, urmata de un drum minim de la v inapoi la s. Pentru fiecare astfel de v se calculeaza prin BFS distanta minima orientata pana la s; adaugand 1 pentru muchia initiala s -> v se obtine lungimea celui mai scurt ciclu ce foloseste acel v ca prim pas. Minimul acestor valori peste toti succesorii directi ai lui s da lungimea celui mai scurt ciclu total prin s.\n\n**Complexitate:** O(outdeg(s) * (n + m))",
    time_limit_ms: 3000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
    }
    int s; cin >> s;
    long long best = 1000000000LL;
    for (int v : adj[s]) {
        vector<int> dist(n + 1, -1);
        dist[v] = 0;
        queue<int> q; q.push(v);
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int w : adj[u]) if (dist[w] == -1) { dist[w] = dist[u] + 1; q.push(w); }
        }
        if (dist[s] != -1) best = min(best, (long long)dist[s] + 1);
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
    adj[x].append(y)
s = int(input())
best = 10 ** 9
for v in adj[s]:
    dist = [-1] * (n + 1)
    dist[v] = 0
    q = deque([v])
    while q:
        u = q.popleft()
        for w in adj[u]:
            if dist[w] == -1:
                dist[w] = dist[u] + 1
                q.append(w)
    if dist[s] != -1:
        best = min(best, dist[s] + 1)
print(best if best < 10 ** 9 else -1)
`,
    tests: ["3 3\n1 2\n2 3\n3 1\n1", "4 4\n1 2\n2 3\n3 4\n4 1\n2", "5 5\n1 2\n2 3\n3 1\n1 4\n4 5\n1", "1 0\n1", "6 7\n1 2\n2 3\n3 1\n1 3\n4 5\n5 6\n6 4\n1"],
  },
  {
    slug: "g-verificare-dag-prin-grade",
    title: "Verificarea DAG prin algoritmul lui Kahn",
    difficulty: "medium",
    tags: ["grafuri", "orientat", "dag"],
    statement: "Un DAG (graf orientat aciclic) este un graf orientat fara niciun ciclu. Se da un graf orientat simplu cu n noduri si m muchii orientate. Verificati daca este DAG, folosind eliminarea repetata a nodurilor cu gradul de intrare 0 (algoritmul lui Kahn).",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere x y, reprezentand o muchie orientata de la x catre y.",
    output_format: "Se afiseaza 'DA' daca graful este DAG, altfel 'NU'.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000",
    hints: "Puneti intr-o coada toate nodurile cu gradul de intrare 0. Extrageti repetat un nod, decrementati gradul de intrare al succesorilor sai, si adaugati in coada orice succesor care ajunge la gradul 0. Daca la final toate nodurile au fost extrase, graful este DAG.",
    explanation: "Algoritmul lui Kahn 'elimina' iterativ nodurile fara predecesori ramasi. Daca graful este DAG, acest proces poate elimina toate cele n noduri (fiecare DAG are mereu cel putin un nod cu gradul de intrare 0 la fiecare pas). Daca insa la un moment dat nu mai exista niciun nod cu grad de intrare 0 desi nu au fost eliminate toate nodurile, ramasitele formeaza un ciclu, deci graful nu este DAG.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    vector<int> indeg(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
        indeg[y]++;
    }
    queue<int> q;
    for (int i = 1; i <= n; i++) if (indeg[i] == 0) q.push(i);
    int processed = 0;
    while (!q.empty()) {
        int u = q.front(); q.pop(); processed++;
        for (int v : adj[u]) { indeg[v]--; if (indeg[v] == 0) q.push(v); }
    }
    cout << (processed == n ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
indeg = [0] * (n + 1)
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y)
    indeg[y] += 1
q = deque(i for i in range(1, n + 1) if indeg[i] == 0)
processed = 0
while q:
    u = q.popleft()
    processed += 1
    for v in adj[u]:
        indeg[v] -= 1
        if indeg[v] == 0:
            q.append(v)
print("DA" if processed == n else "NU")
`,
    tests: ["4 3\n1 2\n2 3\n3 4", "3 3\n1 2\n2 3\n3 1", "1 0", "6 6\n1 2\n2 3\n1 3\n4 5\n5 6\n4 6", "5 5\n1 2\n2 3\n3 4\n4 5\n5 2"],
  },
  // ===================== GRUPA D: SORTARE TOPOLOGICA =====================
  {
    slug: "g-sortare-topologica-kahn",
    title: "Sortare topologica cu algoritmul lui Kahn",
    difficulty: "medium",
    tags: ["grafuri", "orientat", "sortare-topologica"],
    statement: "Se da un graf orientat simplu cu n noduri si m muchii orientate. Determinati o ordine topologica a nodurilor folosind algoritmul lui Kahn, alegand la fiecare pas, dintre nodurile disponibile (grad de intrare 0), pe cel cu indicele cel mai mic.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere x y, reprezentand o muchie orientata de la x catre y.",
    output_format: "Daca graful contine un ciclu (nu are ordine topologica), se afiseaza -1. Altfel, se afiseaza cele n noduri in ordinea topologica obtinuta, separate prin spatiu.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000",
    hints: "Folositi un min-heap in loc de o coada simpla, pentru a alege mereu cel mai mic nod disponibil dintre cele cu grad de intrare 0.",
    explanation: "Algoritmul lui Kahn produce o ordine topologica extragand repetat noduri cu grad de intrare 0. Pentru a obtine un rezultat determinist (cel mai mic din punct de vedere lexicografic), nodurile disponibile la fiecare pas se retin intr-un min-heap, extragandu-se mereu cel cu indicele minim. Daca nu toate nodurile pot fi extrase, graful contine un ciclu.\n\n**Complexitate:** O(n log n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    vector<int> indeg(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
        indeg[y]++;
    }
    priority_queue<int, vector<int>, greater<int>> pq;
    for (int i = 1; i <= n; i++) if (indeg[i] == 0) pq.push(i);
    vector<int> order;
    while (!pq.empty()) {
        int u = pq.top(); pq.pop();
        order.push_back(u);
        for (int v : adj[u]) { indeg[v]--; if (indeg[v] == 0) pq.push(v); }
    }
    if ((int)order.size() != n) { cout << -1 << "\\n"; return 0; }
    for (size_t i = 0; i < order.size(); i++) cout << order[i] << (i + 1 < order.size() ? " " : "\\n");
    return 0;
}
`,
    py: `import heapq
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
indeg = [0] * (n + 1)
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y)
    indeg[y] += 1
heap = [i for i in range(1, n + 1) if indeg[i] == 0]
heapq.heapify(heap)
order = []
while heap:
    u = heapq.heappop(heap)
    order.append(u)
    for v in adj[u]:
        indeg[v] -= 1
        if indeg[v] == 0:
            heapq.heappush(heap, v)
if len(order) != n:
    print(-1)
else:
    print(" ".join(map(str, order)))
`,
    tests: ["4 3\n1 2\n1 3\n3 4", "3 3\n1 2\n2 3\n3 1", "1 0", "6 5\n5 2\n5 6\n4 6\n4 1\n2 3", "5 4\n1 2\n1 3\n2 4\n3 4"],
  },
  {
    slug: "g-sortare-topologica-dfs",
    title: "Sortare topologica cu DFS",
    difficulty: "medium",
    tags: ["grafuri", "orientat", "sortare-topologica"],
    statement: "Se da un graf orientat simplu cu n noduri si m muchii orientate. Determinati o ordine topologica a nodurilor folosind parcurgerea DFS (post-ordine inversata), pornind parcurgerile in ordine crescatoare a nodurilor de start si alegand la fiecare pas cel mai mic succesor nevizitat.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere x y, reprezentand o muchie orientata de la x catre y.",
    output_format: "Daca graful contine un ciclu, se afiseaza -1. Altfel, se afiseaza cele n noduri in ordinea topologica obtinuta, separate prin spatiu.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000",
    hints: "Rulati DFS (folosind culori pentru a detecta ciclurile) pentru fiecare nod nevizitat, in ordine crescatoare; la finalizarea completa a unui nod, adaugati-l intr-o lista de postordine. Ordinea topologica este aceasta lista, inversata.",
    explanation: "Intr-o parcurgere DFS a unui DAG, un nod este complet 'finalizat' (toti succesorii sai au fost deja finalizati) inaintea oricarui nod care il precede in ordinea topologica; de aceea lista de finalizare, citita invers, formeaza o ordine topologica valida. Ciclurile se detecteaza in acelasi timp folosind cele 3 culori (alb/gri/negru).\n\n**Complexitate:** O(n + m log m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
    }
    for (int i = 1; i <= n; i++) sort(adj[i].begin(), adj[i].end());
    vector<int> color(n + 1, 0), it(n + 1, 0);
    vector<int> post;
    bool hasCycle = false;
    for (int start = 1; start <= n; start++) {
        if (color[start] != 0) continue;
        vector<int> stack; stack.push_back(start);
        color[start] = 1;
        while (!stack.empty()) {
            int u = stack.back();
            if (it[u] < (int)adj[u].size()) {
                int v = adj[u][it[u]++];
                if (color[v] == 0) { color[v] = 1; stack.push_back(v); }
                else if (color[v] == 1) hasCycle = true;
            } else {
                color[u] = 2;
                post.push_back(u);
                stack.pop_back();
            }
        }
    }
    if (hasCycle) { cout << -1 << "\\n"; return 0; }
    reverse(post.begin(), post.end());
    for (size_t i = 0; i < post.size(); i++) cout << post[i] << (i + 1 < post.size() ? " " : "\\n");
    return 0;
}
`,
    py: `n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y)
for i in range(1, n + 1):
    adj[i].sort()
color = [0] * (n + 1)
it = [0] * (n + 1)
post = []
hasCycle = False
for start in range(1, n + 1):
    if color[start] != 0:
        continue
    stack = [start]
    color[start] = 1
    while stack:
        u = stack[-1]
        if it[u] < len(adj[u]):
            v = adj[u][it[u]]
            it[u] += 1
            if color[v] == 0:
                color[v] = 1
                stack.append(v)
            elif color[v] == 1:
                hasCycle = True
        else:
            color[u] = 2
            post.append(u)
            stack.pop()
if hasCycle:
    print(-1)
else:
    post.reverse()
    print(" ".join(map(str, post)))
`,
    tests: ["4 3\n1 2\n1 3\n3 4", "3 3\n1 2\n2 3\n3 1", "1 0", "6 6\n5 6\n5 1\n6 1\n6 2\n1 3\n2 4", "5 4\n1 2\n1 3\n2 4\n3 4"],
  },
  {
    slug: "g-verificare-ordine-topologica-data",
    title: "Verificarea unei ordini topologice date",
    difficulty: "easy",
    tags: ["grafuri", "orientat", "sortare-topologica"],
    statement: "Se da un graf orientat simplu cu n noduri si m muchii orientate, si o permutare a nodurilor 1..n. Verificati daca aceasta permutare este o ordine topologica valida.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie orientata. Pe ultima linie se citesc n numere, reprezentand permutarea propusa.",
    output_format: "Se afiseaza 'DA' daca permutarea este o ordine topologica valida, altfel 'NU'.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000",
    hints: "O ordine este valida daca, pentru fiecare muchie x -> y, nodul x apare inaintea nodului y in permutare.",
    explanation: "Se retine, pentru fiecare nod, pozitia sa in permutarea data. O permutare este ordine topologica valida daca si numai daca, pentru fiecare muchie x -> y a grafului, pozitia lui x este strict mai mica decat pozitia lui y.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<pair<int,int>> edges(m);
    for (int i = 0; i < m; i++) cin >> edges[i].first >> edges[i].second;
    vector<int> pos(n + 1);
    for (int i = 0; i < n; i++) { int v; cin >> v; pos[v] = i; }
    bool valid = true;
    for (auto& e : edges) if (pos[e.first] >= pos[e.second]) valid = false;
    cout << (valid ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
edges = [tuple(map(int, input().split())) for _ in range(m)]
perm = list(map(int, input().split()))
pos = [0] * (n + 1)
for i, v in enumerate(perm):
    pos[v] = i
valid = all(pos[x] < pos[y] for x, y in edges)
print("DA" if valid else "NU")
`,
    tests: ["4 3\n1 2\n1 3\n3 4\n1 2 3 4", "4 3\n1 2\n1 3\n3 4\n1 3 4 2", "1 0\n1", "5 4\n1 2\n1 3\n2 4\n3 4\n1 3 2 4 5", "5 4\n1 2\n1 3\n2 4\n3 4\n1 2 4 3 5"],
  },
  {
    slug: "g-unica-ordine-topologica",
    title: "Verificarea unicitatii ordinii topologice",
    difficulty: "medium",
    tags: ["grafuri", "orientat", "sortare-topologica"],
    statement: "Se da un graf orientat aciclic (DAG) cu n noduri si m muchii orientate. Verificati daca acesta are o singura ordine topologica posibila.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere x y, reprezentand o muchie orientata de la x catre y.",
    output_format: "Se afiseaza 'DA' daca exista o singura ordine topologica, altfel 'NU'.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, graful este garantat DAG (fara cicluri)",
    hints: "Rulati algoritmul lui Kahn cu o coada. Ordinea topologica este unica daca si numai daca, la fiecare pas, exista exact un nod disponibil (cu grad de intrare 0) in coada.",
    explanation: "Daca la un pas al algoritmului lui Kahn exista cel putin doua noduri disponibile simultan (grad de intrare 0), ele pot fi alese in oricare ordine, deci exista cel putin doua ordini topologice distincte. Ordinea este unica exact atunci cand, la fiecare pas, multimea nodurilor disponibile are marimea 1 (graful contine, de fapt, un 'drum Hamiltonian' in sensul ordinii topologice).\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    vector<int> indeg(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
        indeg[y]++;
    }
    queue<int> q;
    for (int i = 1; i <= n; i++) if (indeg[i] == 0) q.push(i);
    bool unique = true;
    int processed = 0;
    while (!q.empty()) {
        if (q.size() > 1) unique = false;
        int u = q.front(); q.pop(); processed++;
        for (int v : adj[u]) { indeg[v]--; if (indeg[v] == 0) q.push(v); }
    }
    if (processed != n) unique = false;
    cout << (unique ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
indeg = [0] * (n + 1)
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y)
    indeg[y] += 1
q = deque(i for i in range(1, n + 1) if indeg[i] == 0)
unique = True
processed = 0
while q:
    if len(q) > 1:
        unique = False
    u = q.popleft()
    processed += 1
    for v in adj[u]:
        indeg[v] -= 1
        if indeg[v] == 0:
            q.append(v)
if processed != n:
    unique = False
print("DA" if unique else "NU")
`,
    tests: ["4 3\n1 2\n2 3\n3 4", "4 2\n1 2\n3 4", "1 0", "5 4\n1 2\n1 3\n2 4\n3 4", "6 5\n1 2\n2 3\n3 4\n4 5\n5 6"],
  },
  {
    slug: "g-numar-noduri-inainte-nod",
    title: "Numarul de noduri care preced un nod",
    difficulty: "medium",
    tags: ["grafuri", "orientat", "dag"],
    statement: "Se da un graf orientat aciclic (DAG) cu n noduri si m muchii orientate, si un nod x. Determinati numarul de noduri care trebuie sa apara inaintea lui x in orice ordine topologica (adica numarul de stramosi ai lui x, de la care x este accesibil).",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie orientata. Pe ultima linie se citeste x.",
    output_format: "Se afiseaza un singur numar: numarul de stramosi ai lui x.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= x <= n, graful este garantat DAG",
    hints: "Construiti graful invers (transpus) si rulati BFS din x pe acesta; nodurile atinse (fara x insusi) sunt exact stramosii lui x.",
    explanation: "Un nod u este stramos al lui x daca si numai daca x este accesibil din u pe graful original, echivalent cu u fiind accesibil din x pe graful transpus (cu toate muchiile inversate). Se construieste graful transpus si se ruleaza BFS din x, numarand nodurile atinse, mai putin x insusi.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> radj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        radj[y].push_back(x);
    }
    int x; cin >> x;
    vector<bool> viz(n + 1, false);
    int cnt = 0;
    queue<int> q; q.push(x); viz[x] = true;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : radj[u]) if (!viz[v]) { viz[v] = true; cnt++; q.push(v); }
    }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
radj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    radj[y].append(x)
x = int(input())
viz = [False] * (n + 1)
cnt = 0
viz[x] = True
q = deque([x])
while q:
    u = q.popleft()
    for v in radj[u]:
        if not viz[v]:
            viz[v] = True
            cnt += 1
            q.append(v)
print(cnt)
`,
    tests: ["4 3\n1 2\n2 3\n3 4\n4", "4 3\n1 2\n2 3\n3 4\n1", "1 0\n1", "5 4\n1 2\n1 3\n2 4\n3 4\n4", "6 5\n1 2\n2 3\n1 4\n4 5\n5 6\n6"],
  },
  // ===================== GRUPA E: APLICATII DAG (DRUMURI) =====================
  {
    slug: "g-lungime-cel-mai-lung-drum-dag",
    title: "Cel mai lung drum intr-un DAG",
    difficulty: "medium",
    tags: ["grafuri", "orientat", "dag", "dp"],
    statement: "Se da un graf orientat aciclic (DAG) cu n noduri si m muchii orientate. Determinati lungimea (numarul de muchii) celui mai lung drum orientat din graf.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere x y, reprezentand o muchie orientata de la x catre y.",
    output_format: "Se afiseaza un singur numar: lungimea celui mai lung drum.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, graful este garantat DAG",
    hints: "Procesati nodurile in ordine topologica (algoritmul lui Kahn) si calculati dp[v] = cea mai lunga distanta pana la v, actualizand dp[v] = max(dp[v], dp[u] + 1) pentru fiecare muchie u -> v procesata.",
    explanation: "Intr-un DAG, cea mai lunga distanta pana la fiecare nod se poate calcula printr-o programare dinamica pe ordinea topologica: cand se proceseaza un nod u (extras din algoritmul lui Kahn, deci toti predecesorii sai au fost deja procesati), se propaga dp[u] + 1 catre fiecare succesor v. Raspunsul final este maximul valorilor dp obtinute.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    vector<int> indeg(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
        indeg[y]++;
    }
    vector<long long> dp(n + 1, 0);
    queue<int> q;
    for (int i = 1; i <= n; i++) if (indeg[i] == 0) q.push(i);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) {
            dp[v] = max(dp[v], dp[u] + 1);
            indeg[v]--;
            if (indeg[v] == 0) q.push(v);
        }
    }
    cout << *max_element(dp.begin() + 1, dp.end()) << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
indeg = [0] * (n + 1)
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y)
    indeg[y] += 1
dp = [0] * (n + 1)
q = deque(i for i in range(1, n + 1) if indeg[i] == 0)
while q:
    u = q.popleft()
    for v in adj[u]:
        dp[v] = max(dp[v], dp[u] + 1)
        indeg[v] -= 1
        if indeg[v] == 0:
            q.append(v)
print(max(dp[1:]))
`,
    tests: ["5 4\n1 2\n2 3\n3 4\n4 5", "4 3\n1 2\n1 3\n1 4", "1 0", "6 6\n1 2\n1 3\n2 4\n3 4\n4 5\n4 6", "5 0"],
  },
  {
    slug: "g-numar-drumuri-dag",
    title: "Numarul de drumuri intr-un DAG",
    difficulty: "medium",
    tags: ["grafuri", "orientat", "dag", "dp"],
    statement: "Se da un graf orientat aciclic (DAG) cu n noduri si m muchii orientate, si doua noduri a si b. Determinati numarul de drumuri orientate distincte de la a la b (drumul de lungime 0, daca a = b, se numara ca 1 drum).",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie orientata. Pe ultima linie se citesc a si b.",
    output_format: "Se afiseaza numarul de drumuri distincte de la a la b.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, graful este garantat DAG, raspunsul incape pe 64 de biti",
    hints: "Procesati nodurile in ordine topologica pornind de la a (cnt[a] = 1, restul 0) si propagati cnt[v] += cnt[u] pentru fiecare muchie u -> v.",
    explanation: "Se initializeaza cnt[a] = 1 (exista exact un drum trivial de la a la el insusi) si restul valorilor cu 0. Procesand nodurile in ordine topologica (algoritmul lui Kahn), pentru fiecare muchie u -> v se aduna la cnt[v] valoarea cnt[u]: fiecare drum de la a la u se extinde intr-un drum distinct de la a la v. La final, cnt[b] este numarul cautat.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    vector<int> indeg(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
        indeg[y]++;
    }
    int a, b; cin >> a >> b;
    vector<long long> cnt(n + 1, 0);
    cnt[a] = 1;
    queue<int> q;
    for (int i = 1; i <= n; i++) if (indeg[i] == 0) q.push(i);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) {
            cnt[v] += cnt[u];
            indeg[v]--;
            if (indeg[v] == 0) q.push(v);
        }
    }
    cout << cnt[b] << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
indeg = [0] * (n + 1)
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y)
    indeg[y] += 1
a, b = map(int, input().split())
cnt = [0] * (n + 1)
cnt[a] = 1
q = deque(i for i in range(1, n + 1) if indeg[i] == 0)
while q:
    u = q.popleft()
    for v in adj[u]:
        cnt[v] += cnt[u]
        indeg[v] -= 1
        if indeg[v] == 0:
            q.append(v)
print(cnt[b])
`,
    tests: ["4 4\n1 2\n1 3\n2 4\n3 4\n1 4", "4 3\n1 2\n2 3\n3 4\n1 4", "1 0\n1 1", "5 6\n1 2\n1 3\n2 4\n3 4\n4 5\n1 5\n1 5", "5 4\n1 2\n1 3\n2 4\n3 4\n1 5"],
  },
  {
    slug: "g-drum-maxim-lungime-afisare",
    title: "Afisarea celui mai lung drum dintr-un DAG",
    difficulty: "hard",
    tags: ["grafuri", "orientat", "dag", "dp"],
    statement: "Se da un graf orientat aciclic (DAG) cu n noduri si m muchii orientate. Determinati un drum orientat de lungime maxima (numar de muchii) si afisati-l.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere x y, reprezentand o muchie orientata de la x catre y.",
    output_format: "Pe prima linie se afiseaza lungimea celui mai lung drum. Pe a doua linie se afiseaza nodurile drumului, in ordine.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, graful este garantat DAG",
    hints: "Ca la problema lungimii celui mai lung drum, dar retineti si parintele fiecarui nod in DP: daca dp[u] + 1 > dp[v], actualizati dp[v] si parinte[v] = u. Reconstruiti drumul de la nodul cu dp maxim, urmarind parintii.",
    explanation: "Se ruleaza aceeasi programare dinamica pe ordinea topologica, dar de fiecare data cand dp[v] este imbunatatit (dp[u] + 1 > dp[v]) se retine si parinte[v] = u. La final se cauta nodul cu valoarea dp maxima (cel mai mic index in caz de egalitate, pentru determinism) si se reconstruieste drumul urmand lantul de parinti pana la un nod fara parinte (inceputul drumului), apoi se inverseaza.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    vector<int> indeg(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
        indeg[y]++;
    }
    vector<long long> dp(n + 1, 0);
    vector<int> parent(n + 1, -1);
    queue<int> q;
    for (int i = 1; i <= n; i++) if (indeg[i] == 0) q.push(i);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) {
            if (dp[u] + 1 > dp[v]) { dp[v] = dp[u] + 1; parent[v] = u; }
            indeg[v]--;
            if (indeg[v] == 0) q.push(v);
        }
    }
    int best = 1;
    for (int i = 2; i <= n; i++) if (dp[i] > dp[best]) best = i;
    vector<int> path;
    int cur = best;
    while (cur != -1) { path.push_back(cur); cur = parent[cur]; }
    reverse(path.begin(), path.end());
    cout << dp[best] << "\\n";
    for (size_t i = 0; i < path.size(); i++) cout << path[i] << (i + 1 < path.size() ? " " : "\\n");
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
indeg = [0] * (n + 1)
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y)
    indeg[y] += 1
dp = [0] * (n + 1)
parent = [-1] * (n + 1)
q = deque(i for i in range(1, n + 1) if indeg[i] == 0)
while q:
    u = q.popleft()
    for v in adj[u]:
        if dp[u] + 1 > dp[v]:
            dp[v] = dp[u] + 1
            parent[v] = u
        indeg[v] -= 1
        if indeg[v] == 0:
            q.append(v)
best = 1
for i in range(2, n + 1):
    if dp[i] > dp[best]:
        best = i
path = []
cur = best
while cur != -1:
    path.append(cur)
    cur = parent[cur]
path.reverse()
print(dp[best])
print(" ".join(map(str, path)))
`,
    tests: ["5 4\n1 2\n2 3\n3 4\n4 5", "4 3\n1 2\n1 3\n1 4", "1 0", "6 6\n1 2\n1 3\n2 4\n3 4\n4 5\n4 6", "5 0"],
  },
  {
    slug: "g-numar-noduri-terminale-accesibile",
    title: "Numarul de noduri terminale accesibile",
    difficulty: "easy",
    tags: ["grafuri", "orientat", "bfs"],
    statement: "Un nod terminal este un nod fara succesori (grad de iesire 0). Se da un graf orientat simplu cu n noduri si m muchii orientate, si un nod s. Determinati numarul de noduri terminale accesibile din s.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii cu cate o muchie orientata. Pe ultima linie se citeste s.",
    output_format: "Se afiseaza un singur numar: numarul de noduri terminale accesibile din s.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= s <= n",
    hints: "Calculati gradul de iesire al fiecarui nod, apoi rulati BFS din s si numarati nodurile atinse care au gradul de iesire 0.",
    explanation: "Se calculeaza mai intai gradul de iesire al fiecarui nod. Apoi se ruleaza o parcurgere BFS din s pe muchiile orientate, numarand, printre nodurile atinse, cate au gradul de iesire 0 (adica sunt noduri terminale, fara continuare).\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    vector<int> outdeg(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
        outdeg[x]++;
    }
    int s; cin >> s;
    vector<bool> viz(n + 1, false);
    int cnt = 0;
    queue<int> q; q.push(s); viz[s] = true;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        if (outdeg[u] == 0) cnt++;
        for (int v : adj[u]) if (!viz[v]) { viz[v] = true; q.push(v); }
    }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
outdeg = [0] * (n + 1)
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y)
    outdeg[x] += 1
s = int(input())
viz = [False] * (n + 1)
cnt = 0
viz[s] = True
q = deque([s])
while q:
    u = q.popleft()
    if outdeg[u] == 0:
        cnt += 1
    for v in adj[u]:
        if not viz[v]:
            viz[v] = True
            q.append(v)
print(cnt)
`,
    tests: ["5 4\n1 2\n2 3\n2 4\n1 5\n1", "4 3\n1 2\n1 3\n1 4\n1", "1 0\n1", "6 5\n1 2\n2 3\n2 4\n1 5\n5 6\n1", "5 0\n3"],
  },
  {
    slug: "g-nivel-topologic",
    title: "Nivelul topologic al fiecarui nod",
    difficulty: "medium",
    tags: ["grafuri", "orientat", "dag", "dp"],
    statement: "Se da un graf orientat aciclic (DAG) cu n noduri si m muchii orientate. Pentru fiecare nod, determinati 'nivelul' sau: cea mai lunga distanta (numar de muchii) de la orice nod sursa (fara predecesori) pana la el.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere x y, reprezentand o muchie orientata de la x catre y.",
    output_format: "Se afiseaza n numere separate prin spatiu: nivelul nodului 1, 2, ..., n.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, graful este garantat DAG",
    hints: "Procesati nodurile in ordine topologica (Kahn) si calculati dp[v] = max(dp[v], dp[u] + 1) pentru fiecare muchie u -> v.",
    explanation: "Nivelul unui nod reprezinta cea mai lunga distanta de la orice sursa pana la el, calculata exact prin aceeasi programare dinamica pe ordinea topologica folosita pentru lungimea celui mai lung drum, dar afisand de data aceasta valorile dp pentru toate nodurile, nu doar maximul lor.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    vector<int> indeg(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
        indeg[y]++;
    }
    vector<long long> dp(n + 1, 0);
    queue<int> q;
    for (int i = 1; i <= n; i++) if (indeg[i] == 0) q.push(i);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) {
            dp[v] = max(dp[v], dp[u] + 1);
            indeg[v]--;
            if (indeg[v] == 0) q.push(v);
        }
    }
    for (int i = 1; i <= n; i++) cout << dp[i] << (i < n ? " " : "\\n");
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
indeg = [0] * (n + 1)
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y)
    indeg[y] += 1
dp = [0] * (n + 1)
q = deque(i for i in range(1, n + 1) if indeg[i] == 0)
while q:
    u = q.popleft()
    for v in adj[u]:
        dp[v] = max(dp[v], dp[u] + 1)
        indeg[v] -= 1
        if indeg[v] == 0:
            q.append(v)
print(" ".join(map(str, dp[1:])))
`,
    tests: ["5 4\n1 2\n2 3\n3 4\n4 5", "4 3\n1 2\n1 3\n1 4", "1 0", "6 6\n1 2\n1 3\n2 4\n3 4\n4 5\n4 6", "5 0"],
  },
  // ===================== GRUPA F: COMPONENTE TARE CONEXE =====================
  {
    slug: "g-kosaraju-numar-scc",
    title: "Numarul de componente tare conexe (Kosaraju)",
    difficulty: "hard",
    tags: ["grafuri", "orientat", "scc", "kosaraju"],
    statement: "O componenta tare conexa (CTC) a unui graf orientat este o multime maximala de noduri, oricare doua fiind accesibile reciproc. Se da un graf orientat simplu cu n noduri si m muchii orientate. Determinati numarul de componente tare conexe, folosind algoritmul lui Kosaraju.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere x y, reprezentand o muchie orientata de la x catre y.",
    output_format: "Se afiseaza un singur numar: numarul de componente tare conexe.",
    constraints: "1 <= n <= 20000, 0 <= m <= 40000",
    hints: "Algoritmul lui Kosaraju: (1) faceti o parcurgere DFS pe graful original, retinand ordinea de finalizare a nodurilor; (2) construiti graful transpus (muchii inversate); (3) parcurgeti nodurile in ordinea inversa a finalizarii, pornind cate o noua parcurgere DFS pe graful transpus din fiecare nod inca nevizitat -- fiecare astfel de parcurgere descopera exact o componenta tare conexa.",
    explanation: "Algoritmul lui Kosaraju se bazeaza pe observatia ca, daca se parcurg nodurile in ordinea descrescatoare a timpului de finalizare al unei DFS pe graful original si se ruleaza DFS pe graful transpus, fiecare noua parcurgere descopera exact o componenta tare conexa completa, fara a 'scapa' in alta componenta (deoarece muchiile catre componente deja procesate ar necesita finalizare mai tarzie in DFS-ul original, contradictie). Se implementeaza cu doua parcurgeri DFS iterative pentru a evita depasirea stivei de recursivitate.\n\n**Complexitate:** O(n + m)",
    time_limit_ms: 3000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1), radj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
        radj[y].push_back(x);
    }
    vector<bool> viz(n + 1, false);
    vector<int> it(n + 1, 0), finishOrder;
    for (int start = 1; start <= n; start++) {
        if (viz[start]) continue;
        vector<int> stack; stack.push_back(start); viz[start] = true;
        while (!stack.empty()) {
            int u = stack.back();
            if (it[u] < (int)adj[u].size()) {
                int v = adj[u][it[u]++];
                if (!viz[v]) { viz[v] = true; stack.push_back(v); }
            } else {
                finishOrder.push_back(u);
                stack.pop_back();
            }
        }
    }
    vector<bool> viz2(n + 1, false);
    int sccCount = 0;
    for (int i = (int)finishOrder.size() - 1; i >= 0; i--) {
        int start = finishOrder[i];
        if (viz2[start]) continue;
        sccCount++;
        vector<int> stack2; stack2.push_back(start); viz2[start] = true;
        while (!stack2.empty()) {
            int u = stack2.back(); stack2.pop_back();
            for (int v : radj[u]) if (!viz2[v]) { viz2[v] = true; stack2.push_back(v); }
        }
    }
    cout << sccCount << "\\n";
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
    radj = [[] for _ in range(n + 1)]
    for _ in range(m):
        x = int(data[idx]); idx += 1
        y = int(data[idx]); idx += 1
        adj[x].append(y)
        radj[y].append(x)
    viz = [False] * (n + 1)
    it = [0] * (n + 1)
    finishOrder = []
    for start in range(1, n + 1):
        if viz[start]:
            continue
        stack = [start]
        viz[start] = True
        while stack:
            u = stack[-1]
            if it[u] < len(adj[u]):
                v = adj[u][it[u]]
                it[u] += 1
                if not viz[v]:
                    viz[v] = True
                    stack.append(v)
            else:
                finishOrder.append(u)
                stack.pop()
    viz2 = [False] * (n + 1)
    sccCount = 0
    for start in reversed(finishOrder):
        if viz2[start]:
            continue
        sccCount += 1
        stack2 = [start]
        viz2[start] = True
        while stack2:
            u = stack2.pop()
            for v in radj[u]:
                if not viz2[v]:
                    viz2[v] = True
                    stack2.append(v)
    print(sccCount)
main()
`,
    tests: ["4 4\n1 2\n2 1\n3 4\n4 3", "3 3\n1 2\n2 3\n3 1", "4 3\n1 2\n2 3\n3 4", "1 0", "6 7\n1 2\n2 3\n3 1\n3 4\n4 5\n5 6\n6 4"],
  },
  {
    slug: "g-kosaraju-eticheta-scc",
    title: "Etichetarea componentelor tare conexe",
    difficulty: "hard",
    tags: ["grafuri", "orientat", "scc", "kosaraju"],
    statement: "Se da un graf orientat simplu cu n noduri si m muchii orientate. Atribuiti fiecarei componente tare conexe o eticheta, in ordinea in care este descoperita de algoritmul lui Kosaraju, incepand cu eticheta 1. Afisati eticheta fiecarui nod.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere x y, reprezentand o muchie orientata de la x catre y.",
    output_format: "Se afiseaza n numere separate prin spatiu: eticheta componentei tare conexe a nodului 1, 2, ..., n.",
    constraints: "1 <= n <= 20000, 0 <= m <= 40000",
    hints: "Rulati algoritmul lui Kosaraju ca la problema anterioara, dar in loc sa numarati doar componentele, marcati fiecare nod descoperit in a doua parcurgere cu eticheta componentei curente.",
    explanation: "Se aplica algoritmul lui Kosaraju (DFS pe graful original pentru ordinea de finalizare, apoi DFS pe graful transpus in ordinea inversa a finalizarii); de data aceasta, in loc sa se numere doar cate parcurgeri se pornesc in a doua etapa, fiecare nod descoperit intr-o astfel de parcurgere primeste eticheta componentei curente.\n\n**Complexitate:** O(n + m)",
    time_limit_ms: 3000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1), radj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
        radj[y].push_back(x);
    }
    vector<bool> viz(n + 1, false);
    vector<int> it(n + 1, 0), finishOrder;
    for (int start = 1; start <= n; start++) {
        if (viz[start]) continue;
        vector<int> stack; stack.push_back(start); viz[start] = true;
        while (!stack.empty()) {
            int u = stack.back();
            if (it[u] < (int)adj[u].size()) {
                int v = adj[u][it[u]++];
                if (!viz[v]) { viz[v] = true; stack.push_back(v); }
            } else {
                finishOrder.push_back(u);
                stack.pop_back();
            }
        }
    }
    vector<int> label(n + 1, 0);
    int cur = 0;
    for (int i = (int)finishOrder.size() - 1; i >= 0; i--) {
        int start = finishOrder[i];
        if (label[start] != 0) continue;
        cur++;
        vector<int> stack2; stack2.push_back(start); label[start] = cur;
        while (!stack2.empty()) {
            int u = stack2.back(); stack2.pop_back();
            for (int v : radj[u]) if (label[v] == 0) { label[v] = cur; stack2.push_back(v); }
        }
    }
    for (int i = 1; i <= n; i++) cout << label[i] << (i < n ? " " : "\\n");
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
    radj = [[] for _ in range(n + 1)]
    for _ in range(m):
        x = int(data[idx]); idx += 1
        y = int(data[idx]); idx += 1
        adj[x].append(y)
        radj[y].append(x)
    viz = [False] * (n + 1)
    it = [0] * (n + 1)
    finishOrder = []
    for start in range(1, n + 1):
        if viz[start]:
            continue
        stack = [start]
        viz[start] = True
        while stack:
            u = stack[-1]
            if it[u] < len(adj[u]):
                v = adj[u][it[u]]
                it[u] += 1
                if not viz[v]:
                    viz[v] = True
                    stack.append(v)
            else:
                finishOrder.append(u)
                stack.pop()
    label = [0] * (n + 1)
    cur = 0
    for start in reversed(finishOrder):
        if label[start] != 0:
            continue
        cur += 1
        stack2 = [start]
        label[start] = cur
        while stack2:
            u = stack2.pop()
            for v in radj[u]:
                if label[v] == 0:
                    label[v] = cur
                    stack2.append(v)
    print(" ".join(map(str, label[1:])))
main()
`,
    tests: ["4 4\n1 2\n2 1\n3 4\n4 3", "3 3\n1 2\n2 3\n3 1", "4 3\n1 2\n2 3\n3 4", "1 0", "6 7\n1 2\n2 3\n3 1\n3 4\n4 5\n5 6\n6 4"],
  },
  {
    slug: "g-tarjan-numar-scc",
    title: "Numarul de componente tare conexe (Tarjan)",
    difficulty: "hard",
    tags: ["grafuri", "orientat", "scc", "tarjan"],
    statement: "Se da un graf orientat simplu cu n noduri si m muchii orientate. Determinati numarul de componente tare conexe, folosind algoritmul lui Tarjan (o singura parcurgere DFS cu disc/low si o stiva).",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere x y, reprezentand o muchie orientata de la x catre y.",
    output_format: "Se afiseaza un singur numar: numarul de componente tare conexe.",
    constraints: "1 <= n <= 20000, 0 <= m <= 40000",
    hints: "Mentineti pentru fiecare nod timpul de descoperire disc[] si low[] (cel mai mic disc accesibil ramanand in aceeasi componenta), plus o stiva separata cu nodurile 'active'. Un nod u incheie o noua componenta tare conexa exact cand low[u] == disc[u]; in acel moment se extrag din stiva toate nodurile pana la u inclusiv.",
    explanation: "Algoritmul lui Tarjan face o singura parcurgere DFS, mentinand o stiva auxiliara cu nodurile aflate inca 'in discutie'. Fiecare nod primeste disc[] (timpul de descoperire) si low[] (cel mai mic disc accesibil din subarborele sau, folosind si muchii catre noduri aflate pe stiva). Un nod u este 'radacina' unei componente tare conexe exact cand low[u] == disc[u]; atunci toate nodurile de pe stiva pana la u (inclusiv) formeaza acea componenta si sunt extrase.\n\n**Complexitate:** O(n + m)",
    time_limit_ms: 3000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
    }
    vector<int> disc(n + 1, -1), low(n + 1, 0), it(n + 1, 0);
    vector<bool> onStack(n + 1, false);
    vector<int> tstack;
    int timer = 0, sccCount = 0;
    for (int start = 1; start <= n; start++) {
        if (disc[start] != -1) continue;
        vector<int> callStack; callStack.push_back(start);
        while (!callStack.empty()) {
            int u = callStack.back();
            if (disc[u] == -1) {
                disc[u] = low[u] = timer++;
                tstack.push_back(u); onStack[u] = true;
            }
            bool recursed = false;
            while (it[u] < (int)adj[u].size()) {
                int v = adj[u][it[u]++];
                if (disc[v] == -1) { callStack.push_back(v); recursed = true; break; }
                else if (onStack[v]) low[u] = min(low[u], disc[v]);
            }
            if (recursed) continue;
            callStack.pop_back();
            if (!callStack.empty()) {
                int p = callStack.back();
                low[p] = min(low[p], low[u]);
            }
            if (low[u] == disc[u]) {
                sccCount++;
                while (true) {
                    int w = tstack.back(); tstack.pop_back();
                    onStack[w] = false;
                    if (w == u) break;
                }
            }
        }
    }
    cout << sccCount << "\\n";
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
        adj[x].append(y)
    disc = [-1] * (n + 1)
    low = [0] * (n + 1)
    it = [0] * (n + 1)
    onStack = [False] * (n + 1)
    tstack = []
    timer = 0
    sccCount = 0
    for start in range(1, n + 1):
        if disc[start] != -1:
            continue
        callStack = [start]
        while callStack:
            u = callStack[-1]
            if disc[u] == -1:
                disc[u] = low[u] = timer
                timer += 1
                tstack.append(u)
                onStack[u] = True
            recursed = False
            while it[u] < len(adj[u]):
                v = adj[u][it[u]]
                it[u] += 1
                if disc[v] == -1:
                    callStack.append(v)
                    recursed = True
                    break
                elif onStack[v]:
                    low[u] = min(low[u], disc[v])
            if recursed:
                continue
            callStack.pop()
            if callStack:
                p = callStack[-1]
                low[p] = min(low[p], low[u])
            if low[u] == disc[u]:
                sccCount += 1
                while True:
                    w = tstack.pop()
                    onStack[w] = False
                    if w == u:
                        break
    print(sccCount)
main()
`,
    tests: ["4 4\n1 2\n2 1\n3 4\n4 3", "3 3\n1 2\n2 3\n3 1", "4 3\n1 2\n2 3\n3 4", "1 0", "6 7\n1 2\n2 3\n3 1\n3 4\n4 5\n5 6\n6 4"],
  },
  {
    slug: "g-verificare-tare-conex",
    title: "Verificarea daca un graf orientat este tare conex",
    difficulty: "medium",
    tags: ["grafuri", "orientat", "scc"],
    statement: "Un graf orientat este tare conex daca exista drum orientat intre oricare doua noduri, in ambele sensuri. Se da un graf orientat simplu cu n noduri si m muchii orientate. Verificati daca este tare conex.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere x y, reprezentand o muchie orientata de la x catre y.",
    output_format: "Se afiseaza 'DA' daca graful este tare conex, altfel 'NU'.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000",
    hints: "Graful este tare conex daca si numai daca toate nodurile sunt accesibile din nodul 1 SI toate nodurile pot ajunge la nodul 1 (verificat printr-o parcurgere pe graful transpus).",
    explanation: "Daca toate nodurile sunt accesibile din nodul 1 (parcurgere pe graful original) si nodul 1 este accesibil din toate nodurile (echivalent cu o parcurgere din nodul 1 pe graful transpus care atinge toate nodurile), atunci oricare doua noduri u si v sunt accesibile reciproc: se poate merge de la u la 1 (pe drumul invers catre 1) si de la 1 la v, si simetric. Deci este suficient sa se verifice aceste doua parcurgeri, fara a testa toate perechile.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int reach_count(int s, int n, vector<vector<int>>& adj) {
    vector<bool> viz(n + 1, false);
    queue<int> q; q.push(s); viz[s] = true;
    int cnt = 1;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) if (!viz[v]) { viz[v] = true; cnt++; q.push(v); }
    }
    return cnt;
}
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1), radj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
        radj[y].push_back(x);
    }
    bool ok = (reach_count(1, n, adj) == n) && (reach_count(1, n, radj) == n);
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `from collections import deque
def reach_count(s, n, adj):
    viz = [False] * (n + 1)
    viz[s] = True
    cnt = 1
    q = deque([s])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if not viz[v]:
                viz[v] = True
                cnt += 1
                q.append(v)
    return cnt
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
radj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y = map(int, input().split())
    adj[x].append(y)
    radj[y].append(x)
ok = reach_count(1, n, adj) == n and reach_count(1, n, radj) == n
print("DA" if ok else "NU")
`,
    tests: ["3 3\n1 2\n2 3\n3 1", "4 3\n1 2\n2 3\n3 4", "1 0", "4 5\n1 2\n2 3\n3 1\n3 4\n4 1", "5 5\n1 2\n2 3\n3 1\n4 5\n5 4"],
  },
  {
    slug: "g-marimea-celei-mai-mari-scc",
    title: "Marimea celei mai mari componente tare conexe",
    difficulty: "hard",
    tags: ["grafuri", "orientat", "scc"],
    statement: "Se da un graf orientat simplu cu n noduri si m muchii orientate. Determinati numarul de noduri din cea mai mare componenta tare conexa.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere x y, reprezentand o muchie orientata de la x catre y.",
    output_format: "Se afiseaza un singur numar: dimensiunea celei mai mari componente tare conexe.",
    constraints: "1 <= n <= 20000, 0 <= m <= 40000",
    hints: "Determinati eticheta componentei tare conexe a fiecarui nod (algoritmul lui Kosaraju), apoi numarati marimea fiecarei etichete si retineti maximul.",
    explanation: "Se calculeaza mai intai eticheta componentei tare conexe a fiecarui nod, exact ca la problema de etichetare. Apoi se numara cate noduri au fiecare eticheta, iar raspunsul este maximul acestor numaratori.\n\n**Complexitate:** O(n + m)",
    time_limit_ms: 3000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1), radj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
        radj[y].push_back(x);
    }
    vector<bool> viz(n + 1, false);
    vector<int> it(n + 1, 0), finishOrder;
    for (int start = 1; start <= n; start++) {
        if (viz[start]) continue;
        vector<int> stack; stack.push_back(start); viz[start] = true;
        while (!stack.empty()) {
            int u = stack.back();
            if (it[u] < (int)adj[u].size()) {
                int v = adj[u][it[u]++];
                if (!viz[v]) { viz[v] = true; stack.push_back(v); }
            } else {
                finishOrder.push_back(u);
                stack.pop_back();
            }
        }
    }
    vector<int> label(n + 1, 0);
    int cur = 0;
    vector<int> sizes;
    for (int i = (int)finishOrder.size() - 1; i >= 0; i--) {
        int start = finishOrder[i];
        if (label[start] != 0) continue;
        cur++;
        int sz = 0;
        vector<int> stack2; stack2.push_back(start); label[start] = cur;
        while (!stack2.empty()) {
            int u = stack2.back(); stack2.pop_back(); sz++;
            for (int v : radj[u]) if (label[v] == 0) { label[v] = cur; stack2.push_back(v); }
        }
        sizes.push_back(sz);
    }
    cout << *max_element(sizes.begin(), sizes.end()) << "\\n";
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
    radj = [[] for _ in range(n + 1)]
    for _ in range(m):
        x = int(data[idx]); idx += 1
        y = int(data[idx]); idx += 1
        adj[x].append(y)
        radj[y].append(x)
    viz = [False] * (n + 1)
    it = [0] * (n + 1)
    finishOrder = []
    for start in range(1, n + 1):
        if viz[start]:
            continue
        stack = [start]
        viz[start] = True
        while stack:
            u = stack[-1]
            if it[u] < len(adj[u]):
                v = adj[u][it[u]]
                it[u] += 1
                if not viz[v]:
                    viz[v] = True
                    stack.append(v)
            else:
                finishOrder.append(u)
                stack.pop()
    label = [0] * (n + 1)
    cur = 0
    sizes = []
    for start in reversed(finishOrder):
        if label[start] != 0:
            continue
        cur += 1
        sz = 0
        stack2 = [start]
        label[start] = cur
        while stack2:
            u = stack2.pop()
            sz += 1
            for v in radj[u]:
                if label[v] == 0:
                    label[v] = cur
                    stack2.append(v)
        sizes.append(sz)
    print(max(sizes))
main()
`,
    tests: ["4 4\n1 2\n2 1\n3 4\n4 3", "3 3\n1 2\n2 3\n3 1", "4 3\n1 2\n2 3\n3 4", "1 0", "6 7\n1 2\n2 3\n3 1\n3 4\n4 5\n5 6\n6 4"],
  },
  {
    slug: "g-numar-muchii-graf-condensat",
    title: "Numarul de muchii ale grafului condensat",
    difficulty: "hard",
    tags: ["grafuri", "orientat", "scc"],
    statement: "Graful condensat al unui graf orientat se obtine comprimand fiecare componenta tare conexa intr-un singur nod; exista o muchie de la componenta A la componenta B (A != B) daca exista cel putin o muchie originala de la un nod din A la un nod din B. Se da un graf orientat simplu cu n noduri si m muchii orientate. Determinati numarul de muchii ale grafului condensat.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere x y, reprezentand o muchie orientata de la x catre y.",
    output_format: "Se afiseaza un singur numar: numarul de muchii ale grafului condensat.",
    constraints: "1 <= n <= 20000, 0 <= m <= 40000",
    hints: "Determinati eticheta componentei tare conexe a fiecarui nod. Pentru fiecare muchie originala x -> y cu eticheta(x) != eticheta(y), adaugati perechea (eticheta(x), eticheta(y)) intr-o multime pentru a elimina duplicatele; raspunsul este dimensiunea acestei multimi.",
    explanation: "Se calculeaza eticheta componentei tare conexe a fiecarui nod (algoritmul lui Kosaraju). Graful condensat este intotdeauna un DAG (nu poate avea cicluri intre componente, altfel acestea s-ar fi unit intr-o singura componenta tare conexa). Se parcurg toate muchiile originale, pastrand doar cele care leaga componente diferite, si se numara perechile distincte de etichete (folosind o multime pentru a elimina duplicatele provenite din mai multe muchii originale intre aceleasi doua componente).\n\n**Complexitate:** O(n + m log m)",
    time_limit_ms: 3000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1), radj(n + 1);
    vector<pair<int,int>> edges(m);
    for (int i = 0; i < m; i++) {
        int x, y; cin >> x >> y;
        adj[x].push_back(y);
        radj[y].push_back(x);
        edges[i] = {x, y};
    }
    vector<bool> viz(n + 1, false);
    vector<int> it(n + 1, 0), finishOrder;
    for (int start = 1; start <= n; start++) {
        if (viz[start]) continue;
        vector<int> stack; stack.push_back(start); viz[start] = true;
        while (!stack.empty()) {
            int u = stack.back();
            if (it[u] < (int)adj[u].size()) {
                int v = adj[u][it[u]++];
                if (!viz[v]) { viz[v] = true; stack.push_back(v); }
            } else {
                finishOrder.push_back(u);
                stack.pop_back();
            }
        }
    }
    vector<int> label(n + 1, 0);
    int cur = 0;
    for (int i = (int)finishOrder.size() - 1; i >= 0; i--) {
        int start = finishOrder[i];
        if (label[start] != 0) continue;
        cur++;
        vector<int> stack2; stack2.push_back(start); label[start] = cur;
        while (!stack2.empty()) {
            int u = stack2.back(); stack2.pop_back();
            for (int v : radj[u]) if (label[v] == 0) { label[v] = cur; stack2.push_back(v); }
        }
    }
    set<pair<int,int>> condensed;
    for (auto& e : edges) if (label[e.first] != label[e.second]) condensed.insert({label[e.first], label[e.second]});
    cout << condensed.size() << "\\n";
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
    radj = [[] for _ in range(n + 1)]
    edges = []
    for _ in range(m):
        x = int(data[idx]); idx += 1
        y = int(data[idx]); idx += 1
        adj[x].append(y)
        radj[y].append(x)
        edges.append((x, y))
    viz = [False] * (n + 1)
    it = [0] * (n + 1)
    finishOrder = []
    for start in range(1, n + 1):
        if viz[start]:
            continue
        stack = [start]
        viz[start] = True
        while stack:
            u = stack[-1]
            if it[u] < len(adj[u]):
                v = adj[u][it[u]]
                it[u] += 1
                if not viz[v]:
                    viz[v] = True
                    stack.append(v)
            else:
                finishOrder.append(u)
                stack.pop()
    label = [0] * (n + 1)
    cur = 0
    for start in reversed(finishOrder):
        if label[start] != 0:
            continue
        cur += 1
        stack2 = [start]
        label[start] = cur
        while stack2:
            u = stack2.pop()
            for v in radj[u]:
                if label[v] == 0:
                    label[v] = cur
                    stack2.append(v)
    condensed = set()
    for x, y in edges:
        if label[x] != label[y]:
            condensed.add((label[x], label[y]))
    print(len(condensed))
main()
`,
    tests: ["4 4\n1 2\n2 1\n3 4\n4 3", "3 3\n1 2\n2 3\n3 1", "4 3\n1 2\n2 3\n3 4", "1 0", "7 8\n1 2\n2 3\n3 1\n3 4\n4 5\n5 6\n6 4\n4 7"],
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
