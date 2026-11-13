const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade11", chapter: "grafuri", sub: "grafuri-costuri" };

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
  // ===================== GRUPA A: DIJKSTRA DE BAZA =====================
  {
    slug: "g-dijkstra-distante",
    title: "Dijkstra: distante minime de la o sursa",
    difficulty: "medium",
    tags: ["grafuri", "dijkstra", "costuri"],
    statement: "Se da un graf neorientat cu n noduri si m muchii ponderate (costuri pozitive), si un nod sursa s. Determinati, folosind algoritmul lui Dijkstra, distanta minima de la s la fiecare nod.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c, reprezentand o muchie intre x si y cu costul c. Pe ultima linie se citeste s.",
    output_format: "Se afiseaza n numere separate prin spatiu: distanta minima de la s la nodul 1, 2, ..., n (-1 daca nodul nu este accesibil).",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= c <= 10^6",
    hints: "Folositi un min-heap: extrageti mereu nodul cu distanta curenta minima si relaxati muchiile catre vecinii sai.",
    explanation: "Algoritmul lui Dijkstra mentine, pentru fiecare nod, cea mai buna distanta cunoscuta pana la el, si foloseste un min-heap pentru a extrage mereu nodul nefinalizat cu distanta minima. Deoarece costurile sunt strict pozitive, o data ce un nod este extras cu distanta sa curenta, aceasta este garantat minima (nu mai poate fi imbunatatita ulterior). Intrarile 'vechi' din heap (corespunzand unor distante deja depasite) se ignora la extragere.\n\n**Complexitate:** O((n + m) log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<pair<int,long long>>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; long long c; cin >> x >> y >> c;
        adj[x].push_back({y, c});
        adj[y].push_back({x, c});
    }
    int s; cin >> s;
    vector<long long> dist(n + 1, -1);
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    dist[s] = 0; pq.push({0, s});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (dist[u] != -1 && d > dist[u]) continue;
        for (auto& [v, w] : adj[u]) {
            long long nd = d + w;
            if (dist[v] == -1 || nd < dist[v]) { dist[v] = nd; pq.push({nd, v}); }
        }
    }
    for (int i = 1; i <= n; i++) cout << dist[i] << (i < n ? " " : "\\n");
    return 0;
}
`,
    py: `import heapq
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y, c = map(int, input().split())
    adj[x].append((y, c))
    adj[y].append((x, c))
s = int(input())
dist = [-1] * (n + 1)
dist[s] = 0
pq = [(0, s)]
while pq:
    d, u = heapq.heappop(pq)
    if dist[u] != -1 and d > dist[u]:
        continue
    for v, w in adj[u]:
        nd = d + w
        if dist[v] == -1 or nd < dist[v]:
            dist[v] = nd
            heapq.heappush(pq, (nd, v))
print(" ".join(map(str, dist[1:])))
`,
    tests: ["5 5\n1 2 2\n1 3 5\n2 3 1\n2 4 4\n3 4 1\n1", "4 2\n1 2 3\n3 4 2\n1", "1 0\n1", "6 6\n1 2 7\n1 3 9\n1 6 14\n2 3 10\n3 6 2\n3 4 11\n1", "3 3\n1 2 1\n2 3 1\n1 3 5\n1"],
  },
  {
    slug: "g-dijkstra-distanta-doua-noduri",
    title: "Dijkstra: distanta minima intre doua noduri",
    difficulty: "easy",
    tags: ["grafuri", "dijkstra", "costuri"],
    statement: "Se da un graf neorientat cu n noduri si m muchii ponderate (costuri pozitive), si doua noduri a si b. Determinati costul minim al unui drum de la a la b.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c. Pe ultima linie se citesc a si b.",
    output_format: "Se afiseaza costul minim de la a la b, sau -1 daca nu exista drum.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= c <= 10^6",
    hints: "Rulati Dijkstra din a si cititi rezultatul pentru b.",
    explanation: "Se ruleaza Dijkstra din nodul a, care calculeaza costul minim pana la orice nod accesibil; raspunsul este direct valoarea calculata pentru b.\n\n**Complexitate:** O((n + m) log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<pair<int,long long>>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; long long c; cin >> x >> y >> c;
        adj[x].push_back({y, c});
        adj[y].push_back({x, c});
    }
    int a, b; cin >> a >> b;
    vector<long long> dist(n + 1, -1);
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    dist[a] = 0; pq.push({0, a});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (dist[u] != -1 && d > dist[u]) continue;
        for (auto& [v, w] : adj[u]) {
            long long nd = d + w;
            if (dist[v] == -1 || nd < dist[v]) { dist[v] = nd; pq.push({nd, v}); }
        }
    }
    cout << dist[b] << "\\n";
    return 0;
}
`,
    py: `import heapq
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y, c = map(int, input().split())
    adj[x].append((y, c))
    adj[y].append((x, c))
a, b = map(int, input().split())
dist = [-1] * (n + 1)
dist[a] = 0
pq = [(0, a)]
while pq:
    d, u = heapq.heappop(pq)
    if dist[u] != -1 and d > dist[u]:
        continue
    for v, w in adj[u]:
        nd = d + w
        if dist[v] == -1 or nd < dist[v]:
            dist[v] = nd
            heapq.heappush(pq, (nd, v))
print(dist[b])
`,
    tests: ["5 5\n1 2 2\n1 3 5\n2 3 1\n2 4 4\n3 4 1\n1 4", "4 2\n1 2 3\n3 4 2\n1 4", "1 0\n1 1", "6 6\n1 2 7\n1 3 9\n1 6 14\n2 3 10\n3 6 2\n3 4 11\n1 4", "3 3\n1 2 1\n2 3 1\n1 3 5\n1 3"],
  },
  {
    slug: "g-dijkstra-drum-afisare",
    title: "Dijkstra: afisarea drumului de cost minim",
    difficulty: "medium",
    tags: ["grafuri", "dijkstra", "costuri"],
    statement: "Se da un graf neorientat cu n noduri si m muchii ponderate (costuri pozitive), si doua noduri a si b. Determinati un drum de cost minim de la a la b si afisati-l.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c. Pe ultima linie se citesc a si b.",
    output_format: "Daca exista drum, pe prima linie se afiseaza costul minim, iar pe a doua linie nodurile drumului, in ordine. Daca nu exista drum, se afiseaza doar -1.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= c <= 10^6",
    hints: "Rulati Dijkstra din a, retinand parintele fiecarui nod la fiecare relaxare reusita, apoi reconstruiti drumul de la b inapoi la a.",
    explanation: "Se ruleaza Dijkstra retinand, de fiecare data cand distanta unui nod este imbunatatita, parintele prin care s-a facut acea imbunatatire. La final se reconstruieste drumul urmand lantul de parinti de la b pana la a, apoi se inverseaza pentru afisare.\n\n**Complexitate:** O((n + m) log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<pair<int,long long>>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; long long c; cin >> x >> y >> c;
        adj[x].push_back({y, c});
        adj[y].push_back({x, c});
    }
    int a, b; cin >> a >> b;
    vector<long long> dist(n + 1, -1);
    vector<int> parent(n + 1, -1);
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    dist[a] = 0; pq.push({0, a});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (dist[u] != -1 && d > dist[u]) continue;
        for (auto& [v, w] : adj[u]) {
            long long nd = d + w;
            if (dist[v] == -1 || nd < dist[v]) { dist[v] = nd; parent[v] = u; pq.push({nd, v}); }
        }
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
    py: `import heapq
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y, c = map(int, input().split())
    adj[x].append((y, c))
    adj[y].append((x, c))
a, b = map(int, input().split())
dist = [-1] * (n + 1)
parent = [-1] * (n + 1)
dist[a] = 0
pq = [(0, a)]
while pq:
    d, u = heapq.heappop(pq)
    if dist[u] != -1 and d > dist[u]:
        continue
    for v, w in adj[u]:
        nd = d + w
        if dist[v] == -1 or nd < dist[v]:
            dist[v] = nd
            parent[v] = u
            heapq.heappush(pq, (nd, v))
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
    tests: ["5 5\n1 2 2\n1 3 5\n2 3 1\n2 4 4\n3 4 1\n1 4", "4 2\n1 2 3\n3 4 2\n1 4", "1 0\n1 1", "6 6\n1 2 7\n1 3 9\n1 6 14\n2 3 10\n3 6 2\n3 4 11\n1 4", "3 3\n1 2 1\n2 3 1\n1 3 5\n1 3"],
  },
  {
    slug: "g-dijkstra-orientat",
    title: "Dijkstra pe graf orientat",
    difficulty: "medium",
    tags: ["grafuri", "dijkstra", "costuri", "orientat"],
    statement: "Se da un graf orientat cu n noduri si m muchii orientate ponderate (costuri pozitive), si un nod sursa s. Determinati distanta minima orientata de la s la fiecare nod.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c, reprezentand o muchie orientata de la x catre y cu costul c. Pe ultima linie se citeste s.",
    output_format: "Se afiseaza n numere separate prin spatiu: distanta minima de la s la nodul 1, 2, ..., n (-1 daca inaccesibil).",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= c <= 10^6",
    hints: "Identic cu Dijkstra pe graf neorientat, dar fiecare muchie se adauga o singura data, doar in lista succesorilor lui x.",
    explanation: "Singura diferenta fata de Dijkstra pe graf neorientat este ca fiecare muchie x -> y se adauga o singura data in lista de adiacenta (a lui x), respectand sensul de orientare; restul algoritmului este identic.\n\n**Complexitate:** O((n + m) log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<pair<int,long long>>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; long long c; cin >> x >> y >> c;
        adj[x].push_back({y, c});
    }
    int s; cin >> s;
    vector<long long> dist(n + 1, -1);
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    dist[s] = 0; pq.push({0, s});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (dist[u] != -1 && d > dist[u]) continue;
        for (auto& [v, w] : adj[u]) {
            long long nd = d + w;
            if (dist[v] == -1 || nd < dist[v]) { dist[v] = nd; pq.push({nd, v}); }
        }
    }
    for (int i = 1; i <= n; i++) cout << dist[i] << (i < n ? " " : "\\n");
    return 0;
}
`,
    py: `import heapq
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y, c = map(int, input().split())
    adj[x].append((y, c))
s = int(input())
dist = [-1] * (n + 1)
dist[s] = 0
pq = [(0, s)]
while pq:
    d, u = heapq.heappop(pq)
    if dist[u] != -1 and d > dist[u]:
        continue
    for v, w in adj[u]:
        nd = d + w
        if dist[v] == -1 or nd < dist[v]:
            dist[v] = nd
            heapq.heappush(pq, (nd, v))
print(" ".join(map(str, dist[1:])))
`,
    tests: ["4 4\n1 2 2\n1 3 5\n2 3 1\n3 4 2\n1", "4 4\n1 2 2\n1 3 5\n2 3 1\n3 4 2\n4", "1 0\n1", "5 4\n1 2 1\n2 3 1\n3 4 1\n4 5 1\n1", "6 6\n1 2 7\n1 3 9\n2 3 10\n3 6 2\n3 4 11\n6 4 1\n1"],
  },
  {
    slug: "g-dijkstra-nod-mai-indepartat",
    title: "Nodul cel mai indepartat fata de o sursa",
    difficulty: "medium",
    tags: ["grafuri", "dijkstra", "costuri"],
    statement: "Se da un graf neorientat cu n noduri si m muchii ponderate (costuri pozitive), si un nod sursa s. Determinati nodul accesibil cel mai indepartat (dupa cost) fata de s si costul pana la el. Daca exista mai multe noduri cu acelasi cost maxim, afisati-l pe cel cu indicele cel mai mic.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c. Pe ultima linie se citeste s.",
    output_format: "Se afiseaza doua numere separate prin spatiu: indicele nodului cel mai indepartat si costul pana la el.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= c <= 10^6",
    hints: "Rulati Dijkstra din s, apoi parcurgeti distantele si retineti nodul accesibil cu costul maxim.",
    explanation: "Se ruleaza Dijkstra din s pentru a obtine costul minim pana la fiecare nod accesibil, apoi se parcurg aceste costuri in ordine crescatoare a indicilor, retinand nodul cu costul cel mai mare intalnit (nodul s insusi, cu cost 0, este mereu candidat valid daca nu exista alt nod accesibil).\n\n**Complexitate:** O((n + m) log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<pair<int,long long>>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; long long c; cin >> x >> y >> c;
        adj[x].push_back({y, c});
        adj[y].push_back({x, c});
    }
    int s; cin >> s;
    vector<long long> dist(n + 1, -1);
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    dist[s] = 0; pq.push({0, s});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (dist[u] != -1 && d > dist[u]) continue;
        for (auto& [v, w] : adj[u]) {
            long long nd = d + w;
            if (dist[v] == -1 || nd < dist[v]) { dist[v] = nd; pq.push({nd, v}); }
        }
    }
    int best = s;
    for (int i = 1; i <= n; i++) if (dist[i] != -1 && dist[i] > dist[best]) best = i;
    cout << best << " " << dist[best] << "\\n";
    return 0;
}
`,
    py: `import heapq
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y, c = map(int, input().split())
    adj[x].append((y, c))
    adj[y].append((x, c))
s = int(input())
dist = [-1] * (n + 1)
dist[s] = 0
pq = [(0, s)]
while pq:
    d, u = heapq.heappop(pq)
    if dist[u] != -1 and d > dist[u]:
        continue
    for v, w in adj[u]:
        nd = d + w
        if dist[v] == -1 or nd < dist[v]:
            dist[v] = nd
            heapq.heappush(pq, (nd, v))
best = s
for i in range(1, n + 1):
    if dist[i] != -1 and dist[i] > dist[best]:
        best = i
print(best, dist[best])
`,
    tests: ["5 5\n1 2 2\n1 3 5\n2 3 1\n2 4 4\n3 4 1\n1", "4 2\n1 2 3\n3 4 2\n1", "1 0\n1", "6 6\n1 2 7\n1 3 9\n1 6 14\n2 3 10\n3 6 2\n3 4 11\n1", "3 3\n1 2 1\n2 3 1\n1 3 5\n1"],
  },
  {
    slug: "g-dijkstra-verificare-drum-cost-limitat",
    title: "Verificarea unui drum cu cost limitat",
    difficulty: "easy",
    tags: ["grafuri", "dijkstra", "costuri"],
    statement: "Se da un graf neorientat cu n noduri si m muchii ponderate (costuri pozitive), doua noduri a si b, si un numar k. Verificati daca exista un drum de la a la b cu costul total cel mult k.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c. Pe ultima linie se citesc a, b si k.",
    output_format: "Se afiseaza 'DA' daca exista un drum de cost cel mult k, altfel 'NU'.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= c <= 10^6",
    hints: "Rulati Dijkstra din a si comparati costul minim obtinut pentru b cu k.",
    explanation: "Deoarece Dijkstra calculeaza costul minim posibil de la a la b, este suficient sa se compare aceasta valoare minima cu k: daca cel mai ieftin drum are costul cel mult k, atunci exista un drum care satisface conditia (chiar acesta); daca nu, niciun drum nu poate avea cost mai mic.\n\n**Complexitate:** O((n + m) log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<pair<int,long long>>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; long long c; cin >> x >> y >> c;
        adj[x].push_back({y, c});
        adj[y].push_back({x, c});
    }
    int a, b; long long k; cin >> a >> b >> k;
    vector<long long> dist(n + 1, -1);
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    dist[a] = 0; pq.push({0, a});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (dist[u] != -1 && d > dist[u]) continue;
        for (auto& [v, w] : adj[u]) {
            long long nd = d + w;
            if (dist[v] == -1 || nd < dist[v]) { dist[v] = nd; pq.push({nd, v}); }
        }
    }
    bool ok = (dist[b] != -1 && dist[b] <= k);
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `import heapq
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y, c = map(int, input().split())
    adj[x].append((y, c))
    adj[y].append((x, c))
a, b, k = map(int, input().split())
dist = [-1] * (n + 1)
dist[a] = 0
pq = [(0, a)]
while pq:
    d, u = heapq.heappop(pq)
    if dist[u] != -1 and d > dist[u]:
        continue
    for v, w in adj[u]:
        nd = d + w
        if dist[v] == -1 or nd < dist[v]:
            dist[v] = nd
            heapq.heappush(pq, (nd, v))
ok = dist[b] != -1 and dist[b] <= k
print("DA" if ok else "NU")
`,
    tests: ["5 5\n1 2 2\n1 3 5\n2 3 1\n2 4 4\n3 4 1\n1 4 7", "5 5\n1 2 2\n1 3 5\n2 3 1\n2 4 4\n3 4 1\n1 4 6", "1 0\n1 1 0", "4 2\n1 2 3\n3 4 2\n1 4 100", "3 3\n1 2 1\n2 3 1\n1 3 5\n1 3 2"],
  },
  {
    slug: "g-dijkstra-suma-distante",
    title: "Suma distantelor minime de la o sursa",
    difficulty: "easy",
    tags: ["grafuri", "dijkstra", "costuri"],
    statement: "Se da un graf neorientat cu n noduri si m muchii ponderate (costuri pozitive), si un nod sursa s. Calculati suma costurilor minime de la s la toate celelalte noduri accesibile.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c. Pe ultima linie se citeste s.",
    output_format: "Se afiseaza un singur numar: suma distantelor minime de la s la celelalte noduri accesibile (nodurile inaccesibile nu se numara).",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= c <= 10^6",
    hints: "Rulati Dijkstra din s si insumati toate distantele finite (diferite de -1), inclusiv dist[s] = 0.",
    explanation: "Se ruleaza Dijkstra din s pentru a obtine costul minim pana la fiecare nod, apoi se insumeaza toate valorile calculate care sunt diferite de -1 (nodurile inaccesibile nu contribuie la suma).\n\n**Complexitate:** O((n + m) log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<pair<int,long long>>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; long long c; cin >> x >> y >> c;
        adj[x].push_back({y, c});
        adj[y].push_back({x, c});
    }
    int s; cin >> s;
    vector<long long> dist(n + 1, -1);
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    dist[s] = 0; pq.push({0, s});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (dist[u] != -1 && d > dist[u]) continue;
        for (auto& [v, w] : adj[u]) {
            long long nd = d + w;
            if (dist[v] == -1 || nd < dist[v]) { dist[v] = nd; pq.push({nd, v}); }
        }
    }
    long long suma = 0;
    for (int i = 1; i <= n; i++) if (dist[i] != -1) suma += dist[i];
    cout << suma << "\\n";
    return 0;
}
`,
    py: `import heapq
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y, c = map(int, input().split())
    adj[x].append((y, c))
    adj[y].append((x, c))
s = int(input())
dist = [-1] * (n + 1)
dist[s] = 0
pq = [(0, s)]
while pq:
    d, u = heapq.heappop(pq)
    if dist[u] != -1 and d > dist[u]:
        continue
    for v, w in adj[u]:
        nd = d + w
        if dist[v] == -1 or nd < dist[v]:
            dist[v] = nd
            heapq.heappush(pq, (nd, v))
print(sum(d for d in dist[1:] if d != -1))
`,
    tests: ["5 5\n1 2 2\n1 3 5\n2 3 1\n2 4 4\n3 4 1\n1", "4 2\n1 2 3\n3 4 2\n1", "1 0\n1", "6 6\n1 2 7\n1 3 9\n1 6 14\n2 3 10\n3 6 2\n3 4 11\n1", "3 3\n1 2 1\n2 3 1\n1 3 5\n1"],
  },
  // ===================== GRUPA B: DIJKSTRA CU DINAMICA =====================
  {
    slug: "g-dijkstra-numar-drumuri-minime",
    title: "Numarul de drumuri de cost minim",
    difficulty: "hard",
    tags: ["grafuri", "dijkstra", "dinamica"],
    statement: "Se da un graf neorientat cu n noduri si m muchii ponderate (costuri pozitive), si un nod sursa s. Pentru fiecare nod, determinati numarul de drumuri distincte de cost minim de la s la el.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c. Pe ultima linie se citeste s.",
    output_format: "Se afiseaza n numere separate prin spatiu: numarul de drumuri de cost minim de la s la nodul 1, 2, ..., n, modulo 1000000007 (0 daca nodul nu este accesibil).",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= c <= 10^6",
    hints: "Rulati Dijkstra retinand si un contor cnt[v]. Cand un drum imbunatateste strict distanta lui v, resetati cnt[v] = cnt[u]. Cand un drum ajunge la v cu exact aceeasi distanta minima deja cunoscuta, adaugati cnt[u] la cnt[v].",
    explanation: "Pe langa distanta minima, se mentine un contor cnt[v] = numarul de drumuri de cost minim gasite pana la v. Cand se descopera o distanta strict mai buna prin u, contorul se reseteaza la cnt[u] (drumurile vechi nu mai sunt optime). Cand se descopera un drum catre v cu exact aceeasi distanta minima deja stabilita, contributiile se aduna: cnt[v] += cnt[u]. Deoarece costurile sunt strict pozitive, un nod u cu dist[u] mai mic este mereu procesat (extras din heap) inaintea oricarui v cu dist[v] >= dist[u], deci toate contributiile catre cnt[v] sunt colectate corect inainte ca v sa fie considerat finalizat.\n\n**Complexitate:** O((n + m) log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
const long long MOD = 1000000007;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<pair<int,long long>>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; long long c; cin >> x >> y >> c;
        adj[x].push_back({y, c});
        adj[y].push_back({x, c});
    }
    int s; cin >> s;
    vector<long long> dist(n + 1, -1), cnt(n + 1, 0);
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    dist[s] = 0; cnt[s] = 1; pq.push({0, s});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (dist[u] != -1 && d > dist[u]) continue;
        for (auto& [v, w] : adj[u]) {
            long long nd = d + w;
            if (dist[v] == -1 || nd < dist[v]) { dist[v] = nd; cnt[v] = cnt[u]; pq.push({nd, v}); }
            else if (nd == dist[v]) { cnt[v] = (cnt[v] + cnt[u]) % MOD; }
        }
    }
    for (int i = 1; i <= n; i++) cout << (dist[i] == -1 ? 0 : cnt[i]) << (i < n ? " " : "\\n");
    return 0;
}
`,
    py: `import heapq
MOD = 1000000007
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y, c = map(int, input().split())
    adj[x].append((y, c))
    adj[y].append((x, c))
s = int(input())
dist = [-1] * (n + 1)
cnt = [0] * (n + 1)
dist[s] = 0
cnt[s] = 1
pq = [(0, s)]
while pq:
    d, u = heapq.heappop(pq)
    if dist[u] != -1 and d > dist[u]:
        continue
    for v, w in adj[u]:
        nd = d + w
        if dist[v] == -1 or nd < dist[v]:
            dist[v] = nd
            cnt[v] = cnt[u]
            heapq.heappush(pq, (nd, v))
        elif nd == dist[v]:
            cnt[v] = (cnt[v] + cnt[u]) % MOD
print(" ".join(str(0 if dist[i] == -1 else cnt[i]) for i in range(1, n + 1)))
`,
    tests: ["4 5\n1 2 1\n1 3 1\n2 4 1\n3 4 1\n1 4 3\n1", "4 2\n1 2 3\n3 4 2\n1", "1 0\n1", "5 6\n1 2 1\n1 3 1\n2 4 1\n3 4 1\n4 5 1\n1 3 2\n1", "3 3\n1 2 2\n2 3 2\n1 3 4\n1"],
  },
  {
    slug: "g-dijkstra-numar-drumuri-minime-pereche",
    title: "Numarul de drumuri de cost minim intre doua noduri",
    difficulty: "hard",
    tags: ["grafuri", "dijkstra", "dinamica"],
    statement: "Se da un graf neorientat cu n noduri si m muchii ponderate (costuri pozitive), si doua noduri a si b. Determinati numarul de drumuri distincte de cost minim de la a la b.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c. Pe ultima linie se citesc a si b.",
    output_format: "Se afiseaza numarul de drumuri de cost minim de la a la b, modulo 1000000007 (0 daca b nu este accesibil).",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= c <= 10^6",
    hints: "Identic cu numararea drumurilor minime de la o sursa, dar se citeste doar valoarea pentru b.",
    explanation: "Se aplica aceeasi tehnica de numarare a drumurilor de cost minim (Dijkstra cu un contor cnt[] actualizat prin reset la relaxare stricta si acumulare la egalitate), citind la final doar rezultatul pentru nodul b.\n\n**Complexitate:** O((n + m) log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
const long long MOD = 1000000007;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<pair<int,long long>>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; long long c; cin >> x >> y >> c;
        adj[x].push_back({y, c});
        adj[y].push_back({x, c});
    }
    int a, b; cin >> a >> b;
    vector<long long> dist(n + 1, -1), cnt(n + 1, 0);
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    dist[a] = 0; cnt[a] = 1; pq.push({0, a});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (dist[u] != -1 && d > dist[u]) continue;
        for (auto& [v, w] : adj[u]) {
            long long nd = d + w;
            if (dist[v] == -1 || nd < dist[v]) { dist[v] = nd; cnt[v] = cnt[u]; pq.push({nd, v}); }
            else if (nd == dist[v]) { cnt[v] = (cnt[v] + cnt[u]) % MOD; }
        }
    }
    cout << (dist[b] == -1 ? 0 : cnt[b]) << "\\n";
    return 0;
}
`,
    py: `import heapq
MOD = 1000000007
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y, c = map(int, input().split())
    adj[x].append((y, c))
    adj[y].append((x, c))
a, b = map(int, input().split())
dist = [-1] * (n + 1)
cnt = [0] * (n + 1)
dist[a] = 0
cnt[a] = 1
pq = [(0, a)]
while pq:
    d, u = heapq.heappop(pq)
    if dist[u] != -1 and d > dist[u]:
        continue
    for v, w in adj[u]:
        nd = d + w
        if dist[v] == -1 or nd < dist[v]:
            dist[v] = nd
            cnt[v] = cnt[u]
            heapq.heappush(pq, (nd, v))
        elif nd == dist[v]:
            cnt[v] = (cnt[v] + cnt[u]) % MOD
print(0 if dist[b] == -1 else cnt[b])
`,
    tests: ["4 5\n1 2 1\n1 3 1\n2 4 1\n3 4 1\n1 4 3\n1 4", "4 2\n1 2 3\n3 4 2\n1 4", "1 0\n1 1", "5 6\n1 2 1\n1 3 1\n2 4 1\n3 4 1\n4 5 1\n1 3 2\n1 5", "3 3\n1 2 2\n2 3 2\n1 3 4\n1 3"],
  },
  {
    slug: "g-dijkstra-numar-muchii-pe-drum-minim",
    title: "Numarul minim de muchii pe un drum de cost minim",
    difficulty: "hard",
    tags: ["grafuri", "dijkstra", "dinamica"],
    statement: "Se da un graf neorientat cu n noduri si m muchii ponderate (costuri pozitive), si doua noduri a si b. Dintre toate drumurile de cost minim de la a la b, determinati numarul minim de muchii al unui astfel de drum.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c. Pe ultima linie se citesc a si b.",
    output_format: "Se afiseaza numarul minim de muchii al unui drum de cost minim de la a la b, sau -1 daca nu exista drum.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= c <= 10^6",
    hints: "Rulati Dijkstra pe perechea (cost, numar_muchii), comparata lexicografic: la cost egal, prioritizati mai putine muchii.",
    explanation: "Se generalizeaza Dijkstra pentru a compara starile lexicografic dupa perechea (cost, numar de muchii): un drum este 'mai bun' daca are cost mai mic, sau, la cost egal, mai putine muchii. Deoarece aceasta ordine este o extensie valida a comparatiei standard (a doua componenta se foloseste doar la egalitatea primei), proprietatea de baza a lui Dijkstra (starea extrasa din heap este finala) se pastreaza.\n\n**Complexitate:** O((n + m) log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<pair<int,long long>>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; long long c; cin >> x >> y >> c;
        adj[x].push_back({y, c});
        adj[y].push_back({x, c});
    }
    int a, b; cin >> a >> b;
    const long long INF = (long long)4e18;
    vector<long long> dist(n + 1, INF), hops(n + 1, INF);
    priority_queue<tuple<long long,long long,int>, vector<tuple<long long,long long,int>>, greater<>> pq;
    dist[a] = 0; hops[a] = 0; pq.push({0, 0, a});
    while (!pq.empty()) {
        auto [d, h, u] = pq.top(); pq.pop();
        if (d > dist[u] || (d == dist[u] && h > hops[u])) continue;
        for (auto& [v, w] : adj[u]) {
            long long nd = d + w, nh = h + 1;
            if (nd < dist[v] || (nd == dist[v] && nh < hops[v])) {
                dist[v] = nd; hops[v] = nh; pq.push({nd, nh, v});
            }
        }
    }
    cout << (dist[b] == INF ? -1 : hops[b]) << "\\n";
    return 0;
}
`,
    py: `import heapq
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y, c = map(int, input().split())
    adj[x].append((y, c))
    adj[y].append((x, c))
a, b = map(int, input().split())
INF = float('inf')
dist = [INF] * (n + 1)
hops = [INF] * (n + 1)
dist[a] = 0
hops[a] = 0
pq = [(0, 0, a)]
while pq:
    d, h, u = heapq.heappop(pq)
    if d > dist[u] or (d == dist[u] and h > hops[u]):
        continue
    for v, w in adj[u]:
        nd, nh = d + w, h + 1
        if nd < dist[v] or (nd == dist[v] and nh < hops[v]):
            dist[v] = nd
            hops[v] = nh
            heapq.heappush(pq, (nd, nh, v))
print(-1 if dist[b] == INF else hops[b])
`,
    tests: ["4 5\n1 2 1\n1 3 1\n2 4 1\n3 4 1\n1 4 3\n1 4", "5 5\n1 2 1\n2 3 1\n3 4 1\n1 5 3\n5 4 0\n1 4", "1 0\n1 1", "4 2\n1 2 3\n3 4 2\n1 4", "3 3\n1 2 1\n2 3 1\n1 3 2\n1 3"],
  },
  {
    slug: "g-dijkstra-al-doilea-cel-mai-scurt-drum",
    title: "Al doilea cel mai scurt drum",
    difficulty: "hard",
    tags: ["grafuri", "dijkstra", "dinamica"],
    statement: "Se da un graf neorientat cu n noduri si m muchii ponderate (costuri pozitive), si doua noduri a si b. Determinati costul celui de-al doilea cel mai scurt drum de la a la b, adica a doua cea mai mica valoare distincta dintre costurile tuturor drumurilor posibile (nu neaparat simple) de la a la b.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c. Pe ultima linie se citesc a si b.",
    output_format: "Se afiseaza costul celui de-al doilea cel mai scurt drum, sau -1 daca nu exista.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= c <= 10^6",
    hints: "Mentineti pentru fiecare nod cele mai mici doua costuri DISTINCTE gasite pana la el (dist1 < dist2), permitand fiecarui nod sa fie 'relaxat' de cel mult doua ori in heap.",
    explanation: "Se generalizeaza Dijkstra retinand pentru fiecare nod doua valori: dist1[v] (costul minim) si dist2[v] (al doilea cel mai mic cost, strict mai mare decat dist1[v]). Cand se descopera un drum cu cost strict mai mic decat dist1[v], vechea valoare dist1[v] devine noul candidat pentru dist2[v] (daca e mai mica decat vechiul dist2[v]), iar dist1[v] se actualizeaza; cand se descopera un cost strict intre dist1[v] si dist2[v], doar dist2[v] se actualizeaza. Raspunsul este dist2[b].\n\n**Complexitate:** O((n + m) log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<pair<int,long long>>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; long long c; cin >> x >> y >> c;
        adj[x].push_back({y, c});
        adj[y].push_back({x, c});
    }
    int a, b; cin >> a >> b;
    const long long INF = (long long)4e18;
    vector<long long> dist1(n + 1, INF), dist2(n + 1, INF);
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    dist1[a] = 0; pq.push({0, a});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist2[u]) continue;
        for (auto& [v, w] : adj[u]) {
            long long nd = d + w;
            if (nd < dist1[v]) {
                dist2[v] = dist1[v];
                dist1[v] = nd;
                pq.push({nd, v});
            } else if (dist1[v] < nd && nd < dist2[v]) {
                dist2[v] = nd;
                pq.push({nd, v});
            }
        }
    }
    cout << (dist2[b] == INF ? -1 : dist2[b]) << "\\n";
    return 0;
}
`,
    py: `import heapq
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y, c = map(int, input().split())
    adj[x].append((y, c))
    adj[y].append((x, c))
a, b = map(int, input().split())
INF = float('inf')
dist1 = [INF] * (n + 1)
dist2 = [INF] * (n + 1)
dist1[a] = 0
pq = [(0, a)]
while pq:
    d, u = heapq.heappop(pq)
    if d > dist2[u]:
        continue
    for v, w in adj[u]:
        nd = d + w
        if nd < dist1[v]:
            dist2[v] = dist1[v]
            dist1[v] = nd
            heapq.heappush(pq, (nd, v))
        elif dist1[v] < nd < dist2[v]:
            dist2[v] = nd
            heapq.heappush(pq, (nd, v))
print(-1 if dist2[b] == INF else dist2[b])
`,
    tests: ["4 5\n1 2 1\n1 3 2\n2 4 2\n3 4 1\n1 4 5\n1 4", "3 2\n1 2 1\n2 3 1\n1 3", "1 0\n1 1", "3 3\n1 2 1\n2 3 1\n1 3 1\n1 3", "5 4\n1 2 1\n2 3 1\n3 4 1\n4 5 1\n1 5"],
  },
  {
    slug: "g-dijkstra-noduri-interzise",
    title: "Distanta minima evitand noduri interzise",
    difficulty: "medium",
    tags: ["grafuri", "dijkstra", "costuri"],
    statement: "Se da un graf neorientat cu n noduri si m muchii ponderate (costuri pozitive), doua noduri a si b (garantat neinterzise), si o multime S de noduri interzise. Determinati costul minim al unui drum de la a la b care nu trece prin niciun nod din S.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c. Urmeaza o linie cu a si b, apoi o linie cu k (marimea lui S), apoi o linie cu cele k noduri interzise.",
    output_format: "Se afiseaza costul minim de la a la b evitand nodurile din S, sau -1 daca nu exista un astfel de drum.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= c <= 10^6",
    hints: "Marcati nodurile din S ca 'blocate' si rulati Dijkstra normal, ignorand complet orice extindere catre sau prin aceste noduri.",
    explanation: "Se marcheaza nodurile interzise intr-un vector boolean, iar Dijkstra se ruleaza exact ca de obicei, cu singura modificare ca niciun nod blocat nu este niciodata adaugat in coada sau folosit pentru a relaxa alte noduri -- efectiv, acestea sunt eliminate complet din graf pentru aceasta interogare.\n\n**Complexitate:** O((n + m) log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<pair<int,long long>>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; long long c; cin >> x >> y >> c;
        adj[x].push_back({y, c});
        adj[y].push_back({x, c});
    }
    int a, b; cin >> a >> b;
    int k; cin >> k;
    vector<bool> blocked(n + 1, false);
    for (int i = 0; i < k; i++) { int v; cin >> v; blocked[v] = true; }
    vector<long long> dist(n + 1, -1);
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    dist[a] = 0; pq.push({0, a});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (dist[u] != -1 && d > dist[u]) continue;
        for (auto& [v, w] : adj[u]) {
            if (blocked[v]) continue;
            long long nd = d + w;
            if (dist[v] == -1 || nd < dist[v]) { dist[v] = nd; pq.push({nd, v}); }
        }
    }
    cout << dist[b] << "\\n";
    return 0;
}
`,
    py: `import heapq
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y, c = map(int, input().split())
    adj[x].append((y, c))
    adj[y].append((x, c))
a, b = map(int, input().split())
k = int(input())
blocked = [False] * (n + 1)
if k > 0:
    for v in map(int, input().split()):
        blocked[v] = True
dist = [-1] * (n + 1)
dist[a] = 0
pq = [(0, a)]
while pq:
    d, u = heapq.heappop(pq)
    if dist[u] != -1 and d > dist[u]:
        continue
    for v, w in adj[u]:
        if blocked[v]:
            continue
        nd = d + w
        if dist[v] == -1 or nd < dist[v]:
            dist[v] = nd
            heapq.heappush(pq, (nd, v))
print(dist[b])
`,
    tests: ["5 5\n1 2 2\n1 3 5\n2 3 1\n2 4 4\n3 4 1\n1 4\n1\n2", "5 5\n1 2 2\n1 3 5\n2 3 1\n2 4 4\n3 4 1\n1 4\n0\n", "1 0\n1 1\n0\n", "4 3\n1 2 1\n2 3 1\n3 4 1\n1 4\n1\n2", "6 6\n1 2 1\n2 3 1\n3 6 1\n1 4 1\n4 5 1\n5 6 1\n1 6\n2\n2 4"],
  },
  {
    slug: "g-dijkstra-cel-mai-ieftin-cu-numar-muchii-limitat",
    title: "Cel mai ieftin drum cu numar limitat de muchii",
    difficulty: "hard",
    tags: ["grafuri", "orientat", "bellman-ford", "dinamica"],
    statement: "Se da un graf orientat cu n noduri si m muchii ponderate (costuri pozitive), doua noduri a si b, si un numar k. Determinati costul minim al unui drum de la a la b care foloseste cel mult k muchii.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c, reprezentand o muchie orientata de la x catre y cu costul c. Urmeaza o linie cu a, b si k.",
    output_format: "Se afiseaza costul minim al unui drum de la a la b cu cel mult k muchii, sau -1 daca nu exista.",
    constraints: "1 <= n <= 200, 0 <= m <= 500, 0 <= k <= 50, 1 <= c <= 10^6",
    hints: "Folositi o varianta marginita a algoritmului Bellman-Ford: la fiecare din cele k iteratii, calculati o noua copie a distantelor relaxand toate muchiile pornind DOAR de la valorile iteratiei anterioare (nu actualizate in acelasi pas), pentru a garanta ca fiecare iteratie foloseste cel mult o muchie suplimentara.",
    explanation: "Deoarece Dijkstra nu se preteaza usor la o constrangere pe numarul de muchii folosite, se foloseste o varianta marginita a lui Bellman-Ford: se pastreaza o copie separata a distantelor la inceputul fiecarei iteratii, iar relaxarile din iteratia curenta citesc doar din aceasta copie (nu din valorile deja actualizate in iteratia curenta), garantand ca fiecare iteratie adauga cel mult o muchie noua drumului. Dupa k iteratii, dist[b] contine costul minim folosind cel mult k muchii.\n\n**Complexitate:** O(k * m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<array<long long,3>> edges(m);
    for (auto& e : edges) cin >> e[0] >> e[1] >> e[2];
    int a, b, k; cin >> a >> b >> k;
    const long long INF = (long long)4e18;
    vector<long long> dist(n + 1, INF);
    dist[a] = 0;
    for (int it = 0; it < k; it++) {
        vector<long long> ndist = dist;
        for (auto& e : edges) {
            int x = e[0], y = e[1]; long long w = e[2];
            if (dist[x] != INF && dist[x] + w < ndist[y]) ndist[y] = dist[x] + w;
        }
        dist = ndist;
    }
    cout << (dist[b] == INF ? -1 : dist[b]) << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
edges = [tuple(map(int, input().split())) for _ in range(m)]
a, b, k = map(int, input().split())
INF = float('inf')
dist = [INF] * (n + 1)
dist[a] = 0
for _ in range(k):
    ndist = dist[:]
    for x, y, w in edges:
        if dist[x] != INF and dist[x] + w < ndist[y]:
            ndist[y] = dist[x] + w
    dist = ndist
print(-1 if dist[b] == INF else dist[b])
`,
    tests: ["4 4\n1 2 100\n2 3 100\n3 4 100\n1 4 500\n1 4 2", "4 4\n1 2 100\n2 3 100\n3 4 100\n1 4 500\n1 4 3", "4 4\n1 2 100\n2 3 100\n3 4 100\n1 4 500\n1 4 1", "1 0\n1 1 0", "5 5\n1 2 10\n2 3 10\n3 4 10\n4 5 10\n1 5 45\n1 5 4"],
  },
  // ===================== GRUPA C: BELLMAN-FORD =====================
  {
    slug: "g-bellman-ford-distante",
    title: "Bellman-Ford: distante minime cu costuri posibil negative",
    difficulty: "medium",
    tags: ["grafuri", "orientat", "bellman-ford"],
    statement: "Se da un graf orientat cu n noduri si m muchii ponderate (costurile pot fi negative, dar graful nu contine niciun ciclu de cost negativ accesibil), si un nod sursa s. Determinati, folosind algoritmul Bellman-Ford, distanta minima de la s la fiecare nod.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c, reprezentand o muchie orientata de la x catre y cu costul c (poate fi negativ). Pe ultima linie se citeste s.",
    output_format: "Se afiseaza n numere separate prin spatiu: distanta minima de la s la nodul 1, 2, ..., n ('INF' daca nodul nu este accesibil).",
    constraints: "1 <= n <= 2000, 0 <= m <= 5000, -1000 <= c <= 1000",
    hints: "Relaxati toate cele m muchii, in ordine, timp de n-1 iteratii; daca la o iteratie nicio distanta nu se mai schimba, va puteti opri mai devreme.",
    explanation: "Spre deosebire de Dijkstra, Bellman-Ford functioneaza si cu costuri negative (atata timp cat nu exista cicluri de cost negativ), relaxand repetat TOATE muchiile grafului, de n-1 ori. Dupa n-1 iteratii complete, orice drum simplu optim (cu maxim n-1 muchii) a fost deja descoperit. Se foloseste 'INF' ca marcaj explicit pentru inaccesibil, deoarece -1 ar putea fi confundat cu un cost real negativ.\n\n**Complexitate:** O(n * m)",
    time_limit_ms: 3000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<array<long long,3>> edges(m);
    for (auto& e : edges) cin >> e[0] >> e[1] >> e[2];
    int s; cin >> s;
    const long long INF = (long long)4e18;
    vector<long long> dist(n + 1, INF);
    dist[s] = 0;
    for (int it = 0; it < n - 1; it++) {
        bool changed = false;
        for (auto& e : edges) {
            int x = e[0], y = e[1]; long long w = e[2];
            if (dist[x] != INF && dist[x] + w < dist[y]) { dist[y] = dist[x] + w; changed = true; }
        }
        if (!changed) break;
    }
    for (int i = 1; i <= n; i++) {
        if (dist[i] == INF) cout << "INF";
        else cout << dist[i];
        cout << (i < n ? " " : "\\n");
    }
    return 0;
}
`,
    py: `n, m = map(int, input().split())
edges = [tuple(map(int, input().split())) for _ in range(m)]
s = int(input())
INF = float('inf')
dist = [INF] * (n + 1)
dist[s] = 0
for _ in range(n - 1):
    changed = False
    for x, y, w in edges:
        if dist[x] != INF and dist[x] + w < dist[y]:
            dist[y] = dist[x] + w
            changed = True
    if not changed:
        break
print(" ".join("INF" if dist[i] == INF else str(dist[i]) for i in range(1, n + 1)))
`,
    tests: ["4 4\n1 2 4\n1 3 1\n3 2 -2\n2 4 3\n1", "4 2\n1 2 3\n3 4 -2\n1", "1 0\n1", "5 5\n1 2 2\n2 3 -1\n3 4 2\n1 4 10\n4 5 -3\n1", "3 3\n1 2 5\n2 3 -3\n1 3 1\n1"],
  },
  {
    slug: "g-bellman-ford-verificare-ciclu-negativ-accesibil",
    title: "Verificarea unui ciclu negativ accesibil",
    difficulty: "medium",
    tags: ["grafuri", "orientat", "bellman-ford"],
    statement: "Se da un graf orientat cu n noduri si m muchii ponderate (costurile pot fi negative), si un nod sursa s. Verificati daca exista un ciclu de cost negativ accesibil din s.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c, reprezentand o muchie orientata de la x catre y cu costul c. Pe ultima linie se citeste s.",
    output_format: "Se afiseaza 'DA' daca exista un ciclu de cost negativ accesibil din s, altfel 'NU'.",
    constraints: "1 <= n <= 2000, 0 <= m <= 5000, -1000 <= c <= 1000",
    hints: "Rulati n-1 iteratii de relaxare Bellman-Ford, apoi mai incercati o relaxare suplimentara; daca vreo muchie poate inca relaxa un nod accesibil, exista ciclu negativ.",
    explanation: "Dupa n-1 iteratii de relaxare, toate distantele sunt corecte daca nu exista ciclu negativ accesibil. O a n-a relaxare suplimentara nu ar trebui sa mai schimbe nimic; daca totusi gaseste o muchie (x, y) cu dist[x] finit si dist[x] + cost < dist[y], atunci exista un ciclu de cost negativ accesibil (deoarece imbunatatirea 'infinita' repetata indica prezenta unui astfel de ciclu pe care se poate reveni).\n\n**Complexitate:** O(n * m)",
    time_limit_ms: 3000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<array<long long,3>> edges(m);
    for (auto& e : edges) cin >> e[0] >> e[1] >> e[2];
    int s; cin >> s;
    const long long INF = (long long)4e18;
    vector<long long> dist(n + 1, INF);
    dist[s] = 0;
    for (int it = 0; it < n - 1; it++) {
        for (auto& e : edges) {
            int x = e[0], y = e[1]; long long w = e[2];
            if (dist[x] != INF && dist[x] + w < dist[y]) dist[y] = dist[x] + w;
        }
    }
    bool hasNegCycle = false;
    for (auto& e : edges) {
        int x = e[0], y = e[1]; long long w = e[2];
        if (dist[x] != INF && dist[x] + w < dist[y]) hasNegCycle = true;
    }
    cout << (hasNegCycle ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
edges = [tuple(map(int, input().split())) for _ in range(m)]
s = int(input())
INF = float('inf')
dist = [INF] * (n + 1)
dist[s] = 0
for _ in range(n - 1):
    for x, y, w in edges:
        if dist[x] != INF and dist[x] + w < dist[y]:
            dist[y] = dist[x] + w
hasNegCycle = False
for x, y, w in edges:
    if dist[x] != INF and dist[x] + w < dist[y]:
        hasNegCycle = True
print("DA" if hasNegCycle else "NU")
`,
    tests: ["3 3\n1 2 1\n2 3 -1\n3 2 -1\n1", "3 3\n1 2 1\n2 3 -1\n3 1 1\n1", "1 0\n1", "4 4\n1 2 1\n2 3 1\n3 2 -3\n1 4 5\n1", "5 4\n1 2 1\n2 3 1\n3 4 1\n4 5 1\n1"],
  },
  {
    slug: "g-bellman-ford-distanta-negativa-pereche",
    title: "Bellman-Ford: distanta intre doua noduri cu costuri negative",
    difficulty: "medium",
    tags: ["grafuri", "orientat", "bellman-ford"],
    statement: "Se da un graf orientat cu n noduri si m muchii ponderate (costurile pot fi negative, fara ciclu de cost negativ accesibil din a), si doua noduri a si b. Determinati distanta minima (poate fi negativa) de la a la b.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c. Pe ultima linie se citesc a si b.",
    output_format: "Se afiseaza distanta minima de la a la b, sau 'IMPOSIBIL' daca b nu este accesibil din a.",
    constraints: "1 <= n <= 2000, 0 <= m <= 5000, -1000 <= c <= 1000",
    hints: "Rulati Bellman-Ford din a, apoi verificati valoarea calculata pentru b. Nu folositi -1 pentru cazul 'inaccesibil', deoarece un drum real poate avea exact costul -1.",
    explanation: "Se ruleaza Bellman-Ford standard din a. Deoarece costurile pot fi negative, un cost real de drum ar putea fi -1, deci marcajul de 'inaccesibil' trebuie sa fie un text distinct ('IMPOSIBIL') si nu o valoare numerica ce ar putea fi confundata cu un rezultat valid.\n\n**Complexitate:** O(n * m)",
    time_limit_ms: 3000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<array<long long,3>> edges(m);
    for (auto& e : edges) cin >> e[0] >> e[1] >> e[2];
    int a, b; cin >> a >> b;
    const long long INF = (long long)4e18;
    vector<long long> dist(n + 1, INF);
    dist[a] = 0;
    for (int it = 0; it < n - 1; it++) {
        bool changed = false;
        for (auto& e : edges) {
            int x = e[0], y = e[1]; long long w = e[2];
            if (dist[x] != INF && dist[x] + w < dist[y]) { dist[y] = dist[x] + w; changed = true; }
        }
        if (!changed) break;
    }
    if (dist[b] == INF) cout << "IMPOSIBIL" << "\\n";
    else cout << dist[b] << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
edges = [tuple(map(int, input().split())) for _ in range(m)]
a, b = map(int, input().split())
INF = float('inf')
dist = [INF] * (n + 1)
dist[a] = 0
for _ in range(n - 1):
    changed = False
    for x, y, w in edges:
        if dist[x] != INF and dist[x] + w < dist[y]:
            dist[y] = dist[x] + w
            changed = True
    if not changed:
        break
print("IMPOSIBIL" if dist[b] == INF else dist[b])
`,
    tests: ["4 4\n1 2 4\n1 3 1\n3 2 -2\n2 4 3\n1 4", "4 2\n1 2 3\n3 4 -2\n1 4", "1 0\n1 1", "5 5\n1 2 2\n2 3 -1\n3 4 2\n1 4 10\n4 5 -3\n1 5", "3 3\n1 2 5\n2 3 -3\n1 3 1\n1 3"],
  },
  {
    slug: "g-bellman-ford-numar-iteratii-necesare",
    title: "Numarul de iteratii necesare pentru convergenta",
    difficulty: "medium",
    tags: ["grafuri", "orientat", "bellman-ford"],
    statement: "Se da un graf orientat cu n noduri si m muchii ponderate (fara ciclu de cost negativ), si un nod sursa s. Determinati numarul minim de iteratii complete de relaxare (peste toate cele m muchii) necesare pana cand distantele nu se mai modifica.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c. Pe ultima linie se citeste s.",
    output_format: "Se afiseaza numarul de iteratii in care cel putin o distanta s-a modificat.",
    constraints: "1 <= n <= 2000, 0 <= m <= 5000, -1000 <= c <= 1000",
    hints: "Rulati iteratii de relaxare Bellman-Ford (maxim n-1), numarand doar iteratiile in care s-a produs macar o modificare; opriti-va la prima iteratie care nu modifica nimic.",
    explanation: "Bellman-Ford converge in cel mult n-1 iteratii (deoarece orice drum simplu optim are cel mult n-1 muchii). Numarul REAL de iteratii necesare poate fi insa mai mic, in functie de structura grafului (de exemplu, un graf 'in straturi', unde fiecare iteratie extinde distantele cu exact un strat, converge in atatea iteratii cate straturi exista). Se numara efectiv cate iteratii au produs cel putin o imbunatatire, oprindu-se la prima iteratie 'goala'.\n\n**Complexitate:** O(n * m)",
    time_limit_ms: 3000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<array<long long,3>> edges(m);
    for (auto& e : edges) cin >> e[0] >> e[1] >> e[2];
    int s; cin >> s;
    const long long INF = (long long)4e18;
    vector<long long> dist(n + 1, INF);
    dist[s] = 0;
    int iterations = 0;
    for (int it = 0; it < n - 1; it++) {
        bool changed = false;
        for (auto& e : edges) {
            int x = e[0], y = e[1]; long long w = e[2];
            if (dist[x] != INF && dist[x] + w < dist[y]) { dist[y] = dist[x] + w; changed = true; }
        }
        if (!changed) break;
        iterations++;
    }
    cout << iterations << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
edges = [tuple(map(int, input().split())) for _ in range(m)]
s = int(input())
INF = float('inf')
dist = [INF] * (n + 1)
dist[s] = 0
iterations = 0
for _ in range(n - 1):
    changed = False
    for x, y, w in edges:
        if dist[x] != INF and dist[x] + w < dist[y]:
            dist[y] = dist[x] + w
            changed = True
    if not changed:
        break
    iterations += 1
print(iterations)
`,
    tests: ["5 4\n1 2 1\n2 3 1\n3 4 1\n4 5 1\n1", "4 4\n1 2 4\n1 3 1\n3 2 -2\n2 4 3\n1", "1 0\n1", "4 0\n1", "6 5\n1 2 1\n1 3 1\n1 4 1\n1 5 1\n1 6 1\n1"],
  },
  {
    slug: "g-bellman-ford-drum-negativ-afisare",
    title: "Bellman-Ford: afisarea drumului cu costuri negative",
    difficulty: "hard",
    tags: ["grafuri", "orientat", "bellman-ford"],
    statement: "Se da un graf orientat cu n noduri si m muchii ponderate (costurile pot fi negative, fara ciclu de cost negativ accesibil din a), si doua noduri a si b. Determinati un drum de cost minim de la a la b si afisati-l.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c. Pe ultima linie se citesc a si b.",
    output_format: "Daca b este accesibil din a, pe prima linie se afiseaza costul minim, iar pe a doua linie nodurile drumului, in ordine. Daca nu este accesibil, se afiseaza doar 'IMPOSIBIL'.",
    constraints: "1 <= n <= 2000, 0 <= m <= 5000, -1000 <= c <= 1000",
    hints: "Rulati Bellman-Ford retinand parintele fiecarui nod la fiecare relaxare reusita, apoi reconstruiti drumul urmarind parintii de la b la a.",
    explanation: "Se ruleaza Bellman-Ford ca de obicei, retinand de fiecare data cand distanta unui nod se imbunatateste si parintele prin care s-a facut acea imbunatatire. La final se reconstruieste drumul urmarind lantul de parinti de la b pana la a, apoi se inverseaza.\n\n**Complexitate:** O(n * m)",
    time_limit_ms: 3000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<array<long long,3>> edges(m);
    for (auto& e : edges) cin >> e[0] >> e[1] >> e[2];
    int a, b; cin >> a >> b;
    const long long INF = (long long)4e18;
    vector<long long> dist(n + 1, INF);
    vector<int> parent(n + 1, -1);
    dist[a] = 0;
    for (int it = 0; it < n - 1; it++) {
        bool changed = false;
        for (auto& e : edges) {
            int x = e[0], y = e[1]; long long w = e[2];
            if (dist[x] != INF && dist[x] + w < dist[y]) { dist[y] = dist[x] + w; parent[y] = x; changed = true; }
        }
        if (!changed) break;
    }
    if (dist[b] == INF) { cout << "IMPOSIBIL" << "\\n"; return 0; }
    vector<int> path;
    int cur = b;
    while (cur != -1) { path.push_back(cur); cur = parent[cur]; }
    reverse(path.begin(), path.end());
    cout << dist[b] << "\\n";
    for (size_t i = 0; i < path.size(); i++) cout << path[i] << (i + 1 < path.size() ? " " : "\\n");
    return 0;
}
`,
    py: `n, m = map(int, input().split())
edges = [tuple(map(int, input().split())) for _ in range(m)]
a, b = map(int, input().split())
INF = float('inf')
dist = [INF] * (n + 1)
parent = [-1] * (n + 1)
dist[a] = 0
for _ in range(n - 1):
    changed = False
    for x, y, w in edges:
        if dist[x] != INF and dist[x] + w < dist[y]:
            dist[y] = dist[x] + w
            parent[y] = x
            changed = True
    if not changed:
        break
if dist[b] == INF:
    print("IMPOSIBIL")
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
    tests: ["4 4\n1 2 4\n1 3 1\n3 2 -2\n2 4 3\n1 4", "4 2\n1 2 3\n3 4 -2\n1 4", "1 0\n1 1", "5 5\n1 2 2\n2 3 -1\n3 4 2\n1 4 10\n4 5 -3\n1 5", "3 3\n1 2 5\n2 3 -3\n1 3 1\n1 3"],
  },
  // ===================== GRUPA D: FLOYD-WARSHALL =====================
  {
    slug: "g-floyd-warshall-toate-perechile",
    title: "Floyd-Warshall: distante minime intre toate perechile",
    difficulty: "medium",
    tags: ["grafuri", "orientat", "floyd-warshall"],
    statement: "Se da un graf orientat cu n noduri si m muchii ponderate (costurile pot fi negative, fara ciclu de cost negativ), si un nod sursa s. Determinati distanta minima intre toate perechile de noduri, folosind algoritmul Floyd-Warshall.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c, reprezentand o muchie orientata de la x catre y cu costul c.",
    output_format: "Se afiseaza n linii, fiecare cu n numere separate prin spatiu: distanta minima de la nodul i la nodul j ('INF' daca nu exista drum).",
    constraints: "1 <= n <= 200, 0 <= m <= n*(n-1), -1000 <= c <= 1000",
    hints: "Initializati o matrice n x n cu 0 pe diagonala si INF in rest, apoi setati costul direct pentru fiecare muchie. Aplicati bucla Floyd-Warshall: pentru fiecare nod intermediar k, incercati sa imbunatatiti dist[i][j] via dist[i][k] + dist[k][j].",
    explanation: "Floyd-Warshall calculeaza distantele minime intre toate perechile printr-o programare dinamica ce considera, pe rand, fiecare nod k ca posibil punct intermediar pe drum: dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]). Dupa ce k a parcurs toate cele n valori, matricea contine distantele minime finale, folosind orice combinatie de noduri intermediare.\n\n**Complexitate:** O(n^3)",
    time_limit_ms: 4000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    const long long INF = (long long)1e15;
    vector<vector<long long>> dist(n + 1, vector<long long>(n + 1, INF));
    for (int i = 1; i <= n; i++) dist[i][i] = 0;
    for (int i = 0; i < m; i++) {
        int x, y; long long c; cin >> x >> y >> c;
        if (c < dist[x][y]) dist[x][y] = c;
    }
    for (int k = 1; k <= n; k++)
        for (int i = 1; i <= n; i++)
            for (int j = 1; j <= n; j++)
                if (dist[i][k] < INF && dist[k][j] < INF && dist[i][k] + dist[k][j] < dist[i][j])
                    dist[i][j] = dist[i][k] + dist[k][j];
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) {
            if (dist[i][j] >= INF) cout << "INF";
            else cout << dist[i][j];
            cout << (j < n ? " " : "\\n");
        }
    }
    return 0;
}
`,
    py: `n, m = map(int, input().split())
INF = float('inf')
dist = [[INF] * (n + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    dist[i][i] = 0
for _ in range(m):
    x, y, c = map(int, input().split())
    if c < dist[x][y]:
        dist[x][y] = c
for k in range(1, n + 1):
    for i in range(1, n + 1):
        dik = dist[i][k]
        if dik == INF:
            continue
        for j in range(1, n + 1):
            if dist[k][j] != INF and dik + dist[k][j] < dist[i][j]:
                dist[i][j] = dik + dist[k][j]
for i in range(1, n + 1):
    print(" ".join("INF" if dist[i][j] == INF else str(dist[i][j]) for j in range(1, n + 1)))
`,
    tests: ["4 5\n1 2 3\n1 3 8\n2 4 1\n3 2 4\n4 3 2", "3 2\n1 2 5\n2 3 -2", "1 0", "4 2\n1 2 1\n3 4 1", "3 3\n1 2 4\n2 3 3\n1 3 10"],
  },
  {
    slug: "g-floyd-warshall-diametru-ponderat",
    title: "Diametrul ponderat al unui graf",
    difficulty: "medium",
    tags: ["grafuri", "orientat", "floyd-warshall"],
    statement: "Se da un graf orientat cu n noduri si m muchii ponderate (costuri pozitive). Determinati diametrul ponderat al grafului, adica cea mai mare distanta minima dintre orice doua noduri accesibile intre ele.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c, reprezentand o muchie orientata de la x catre y cu costul c.",
    output_format: "Se afiseaza diametrul ponderat al grafului (0 daca n = 1 sau nu exista nicio pereche accesibila).",
    constraints: "1 <= n <= 200, 0 <= m <= n*(n-1), 1 <= c <= 1000",
    hints: "Calculati toate distantele minime cu Floyd-Warshall, apoi retineti maximul dintre valorile finite (i != j).",
    explanation: "Dupa rularea Floyd-Warshall, se parcurg toate perechile (i, j) cu i != j si distanta finita, retinand maximul acestor distante; aceasta este definitia diametrului ponderat al grafului.\n\n**Complexitate:** O(n^3)",
    time_limit_ms: 4000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    const long long INF = (long long)1e15;
    vector<vector<long long>> dist(n + 1, vector<long long>(n + 1, INF));
    for (int i = 1; i <= n; i++) dist[i][i] = 0;
    for (int i = 0; i < m; i++) {
        int x, y; long long c; cin >> x >> y >> c;
        if (c < dist[x][y]) dist[x][y] = c;
    }
    for (int k = 1; k <= n; k++)
        for (int i = 1; i <= n; i++)
            for (int j = 1; j <= n; j++)
                if (dist[i][k] < INF && dist[k][j] < INF && dist[i][k] + dist[k][j] < dist[i][j])
                    dist[i][j] = dist[i][k] + dist[k][j];
    long long diam = 0;
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= n; j++)
            if (i != j && dist[i][j] < INF) diam = max(diam, dist[i][j]);
    cout << diam << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
INF = float('inf')
dist = [[INF] * (n + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    dist[i][i] = 0
for _ in range(m):
    x, y, c = map(int, input().split())
    if c < dist[x][y]:
        dist[x][y] = c
for k in range(1, n + 1):
    for i in range(1, n + 1):
        dik = dist[i][k]
        if dik == INF:
            continue
        for j in range(1, n + 1):
            if dist[k][j] != INF and dik + dist[k][j] < dist[i][j]:
                dist[i][j] = dik + dist[k][j]
diam = 0
for i in range(1, n + 1):
    for j in range(1, n + 1):
        if i != j and dist[i][j] != INF:
            diam = max(diam, dist[i][j])
print(diam)
`,
    tests: ["4 3\n1 2 3\n2 3 4\n3 4 2", "1 0", "3 0", "4 4\n1 2 1\n2 3 1\n3 4 1\n4 1 1", "5 4\n1 2 10\n2 3 10\n3 4 10\n4 5 10"],
  },
  {
    slug: "g-floyd-warshall-nod-central",
    title: "Nodul central al unui graf ponderat",
    difficulty: "medium",
    tags: ["grafuri", "floyd-warshall"],
    statement: "Excentricitatea unui nod este cea mai mare distanta minima de la el la orice alt nod. Se da un graf neorientat conex cu n noduri si m muchii ponderate (costuri pozitive). Determinati nodul cu excentricitatea minima (nodul 'central') si valoarea acestei excentricitati. Daca exista mai multe, afisati-l pe cel cu indicele cel mai mic.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c, reprezentand o muchie intre x si y cu costul c.",
    output_format: "Se afiseaza doua numere separate prin spatiu: indicele nodului central si excentricitatea sa.",
    constraints: "1 <= n <= 200, 0 <= m <= n*(n-1)/2, 1 <= c <= 1000, graful este conex",
    hints: "Calculati toate distantele minime cu Floyd-Warshall, apoi pentru fiecare nod calculati excentricitatea sa (maximul distantelor catre celelalte noduri) si retineti minimul acestor excentricitati.",
    explanation: "Dupa Floyd-Warshall, excentricitatea nodului i este maximul valorilor dist[i][j] pentru toti j. Nodul central este cel cu cea mai mica astfel de excentricitate; se parcurg nodurile in ordine crescatoare pentru a alege, in caz de egalitate, indicele cel mai mic.\n\n**Complexitate:** O(n^3)",
    time_limit_ms: 4000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    const long long INF = (long long)1e15;
    vector<vector<long long>> dist(n + 1, vector<long long>(n + 1, INF));
    for (int i = 1; i <= n; i++) dist[i][i] = 0;
    for (int i = 0; i < m; i++) {
        int x, y; long long c; cin >> x >> y >> c;
        if (c < dist[x][y]) { dist[x][y] = c; dist[y][x] = c; }
    }
    for (int k = 1; k <= n; k++)
        for (int i = 1; i <= n; i++)
            for (int j = 1; j <= n; j++)
                if (dist[i][k] < INF && dist[k][j] < INF && dist[i][k] + dist[k][j] < dist[i][j])
                    dist[i][j] = dist[i][k] + dist[k][j];
    int best = 1; long long bestEcc = 0;
    for (int j = 1; j <= n; j++) bestEcc = max(bestEcc, dist[1][j]);
    for (int i = 2; i <= n; i++) {
        long long ecc = 0;
        for (int j = 1; j <= n; j++) ecc = max(ecc, dist[i][j]);
        if (ecc < bestEcc) { bestEcc = ecc; best = i; }
    }
    cout << best << " " << bestEcc << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
INF = float('inf')
dist = [[INF] * (n + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    dist[i][i] = 0
for _ in range(m):
    x, y, c = map(int, input().split())
    if c < dist[x][y]:
        dist[x][y] = c
        dist[y][x] = c
for k in range(1, n + 1):
    for i in range(1, n + 1):
        dik = dist[i][k]
        if dik == INF:
            continue
        for j in range(1, n + 1):
            if dist[k][j] != INF and dik + dist[k][j] < dist[i][j]:
                dist[i][j] = dik + dist[k][j]
best = 1
bestEcc = max(dist[1][1:n + 1])
for i in range(2, n + 1):
    ecc = max(dist[i][1:n + 1])
    if ecc < bestEcc:
        bestEcc = ecc
        best = i
print(best, bestEcc)
`,
    tests: ["5 4\n1 2 1\n2 3 1\n3 4 1\n4 5 1", "1 0", "4 4\n1 2 1\n2 3 1\n3 4 1\n4 1 1", "3 3\n1 2 5\n2 3 5\n1 3 5", "6 5\n1 2 1\n1 3 1\n1 4 1\n1 5 1\n1 6 1"],
  },
  {
    slug: "g-floyd-warshall-verificare-ciclu-negativ-global",
    title: "Verificarea existentei unui ciclu negativ (Floyd-Warshall)",
    difficulty: "medium",
    tags: ["grafuri", "orientat", "floyd-warshall"],
    statement: "Se da un graf orientat cu n noduri si m muchii ponderate (costurile pot fi negative). Verificati daca exista, oriunde in graf, un ciclu de cost negativ.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c, reprezentand o muchie orientata de la x catre y cu costul c.",
    output_format: "Se afiseaza 'DA' daca exista un ciclu de cost negativ, altfel 'NU'.",
    constraints: "1 <= n <= 200, 0 <= m <= n*(n-1), -1000 <= c <= 1000, fara autobucle",
    hints: "Rulati Floyd-Warshall complet, apoi verificati daca exista vreun nod i cu dist[i][i] < 0.",
    explanation: "Dupa rularea completa a Floyd-Warshall, valoarea dist[i][i] reprezinta cel mai scurt 'drum' de la i inapoi la i (adica cel mai scurt ciclu ce trece prin i, daca exista unul). Aceasta ramane 0 daca nu exista niciun ciclu de cost negativ care sa treaca prin i; devine negativa daca exista un astfel de ciclu, deoarece algoritmul continua sa gaseasca imbunatatiri pe masura ce parcurge ciclul de mai multe ori (in limita celor n iteratii ale lui k).\n\n**Complexitate:** O(n^3)",
    time_limit_ms: 4000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    const long long INF = (long long)1e15;
    vector<vector<long long>> dist(n + 1, vector<long long>(n + 1, INF));
    for (int i = 1; i <= n; i++) dist[i][i] = 0;
    for (int i = 0; i < m; i++) {
        int x, y; long long c; cin >> x >> y >> c;
        if (c < dist[x][y]) dist[x][y] = c;
    }
    for (int k = 1; k <= n; k++)
        for (int i = 1; i <= n; i++)
            for (int j = 1; j <= n; j++)
                if (dist[i][k] < INF && dist[k][j] < INF && dist[i][k] + dist[k][j] < dist[i][j])
                    dist[i][j] = dist[i][k] + dist[k][j];
    bool neg = false;
    for (int i = 1; i <= n; i++) if (dist[i][i] < 0) neg = true;
    cout << (neg ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
INF = float('inf')
dist = [[INF] * (n + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    dist[i][i] = 0
for _ in range(m):
    x, y, c = map(int, input().split())
    if c < dist[x][y]:
        dist[x][y] = c
for k in range(1, n + 1):
    for i in range(1, n + 1):
        dik = dist[i][k]
        if dik == INF:
            continue
        for j in range(1, n + 1):
            if dist[k][j] != INF and dik + dist[k][j] < dist[i][j]:
                dist[i][j] = dik + dist[k][j]
neg = any(dist[i][i] < 0 for i in range(1, n + 1))
print("DA" if neg else "NU")
`,
    tests: ["3 3\n1 2 1\n2 3 -1\n3 1 -1", "3 3\n1 2 1\n2 3 -1\n3 1 1", "1 0", "4 4\n1 2 1\n2 3 1\n3 2 -3\n1 4 5", "5 4\n1 2 1\n2 3 1\n3 4 1\n4 5 1"],
  },
  // ===================== GRUPA E: ARBORE PARTIAL DE COST MINIM/MAXIM =====================
  {
    slug: "g-prim-cost-minim",
    title: "Arborele partial de cost minim (Prim)",
    difficulty: "medium",
    tags: ["grafuri", "prim", "apm"],
    statement: "Se da un graf neorientat conex cu n noduri si m muchii ponderate (costuri pozitive). Determinati costul total al arborelui partial de cost minim, folosind algoritmul lui Prim.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c, reprezentand o muchie intre x si y cu costul c.",
    output_format: "Se afiseaza costul total al arborelui partial de cost minim.",
    constraints: "1 <= n <= 100000, n-1 <= m <= 100000, 1 <= c <= 10^6, graful este conex",
    hints: "Porniti cu nodul 1 in arbore. La fiecare pas, adaugati in arbore cea mai ieftina muchie care leaga un nod din arbore de unul din afara lui, folosind un min-heap.",
    explanation: "Algoritmul lui Prim construieste arborele partial de cost minim crescand-o incremental: porneste de la un singur nod si, la fiecare pas, adauga cea mai ieftina muchie care conecteaza arborele curent la un nod inca neinclus, folosind un min-heap pentru a gasi rapid aceasta muchie. Corectitudinea se bazeaza pe proprietatea taieturii: cea mai ieftina muchie care traverseaza orice taietura face parte dintr-un APM.\n\n**Complexitate:** O((n + m) log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<pair<int,long long>>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; long long c; cin >> x >> y >> c;
        adj[x].push_back({y, c});
        adj[y].push_back({x, c});
    }
    vector<bool> inMST(n + 1, false);
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    pq.push({0, 1});
    long long total = 0;
    int count = 0;
    while (!pq.empty() && count < n) {
        auto [cost, u] = pq.top(); pq.pop();
        if (inMST[u]) continue;
        inMST[u] = true; total += cost; count++;
        for (auto& [v, w] : adj[u]) if (!inMST[v]) pq.push({w, v});
    }
    cout << total << "\\n";
    return 0;
}
`,
    py: `import heapq
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y, c = map(int, input().split())
    adj[x].append((y, c))
    adj[y].append((x, c))
inMST = [False] * (n + 1)
pq = [(0, 1)]
total = 0
count = 0
while pq and count < n:
    cost, u = heapq.heappop(pq)
    if inMST[u]:
        continue
    inMST[u] = True
    total += cost
    count += 1
    for v, w in adj[u]:
        if not inMST[v]:
            heapq.heappush(pq, (w, v))
print(total)
`,
    tests: ["5 7\n1 2 2\n1 3 3\n2 3 1\n2 4 4\n3 4 5\n4 5 6\n3 5 7", "1 0", "4 3\n1 2 1\n2 3 2\n3 4 3", "4 6\n1 2 1\n1 3 4\n1 4 3\n2 3 2\n2 4 5\n3 4 6", "3 3\n1 2 5\n2 3 5\n1 3 5"],
  },
  {
    slug: "g-prim-afisare-muchii",
    title: "Arborele partial de cost minim: afisarea muchiilor (Prim)",
    difficulty: "medium",
    tags: ["grafuri", "prim", "apm"],
    statement: "Se da un graf neorientat conex cu n noduri si m muchii ponderate (costuri pozitive, graf simplu). Determinati muchiile arborelui partial de cost minim, folosind algoritmul lui Prim.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c, reprezentand o muchie intre x si y cu costul c.",
    output_format: "Se afiseaza n-1 linii, fiecare cu doua numere i j (i < j), reprezentand muchiile arborelui partial de cost minim, sortate crescator dupa i, apoi dupa j.",
    constraints: "1 <= n <= 100000, n-1 <= m <= 100000, 1 <= c <= 10^6, graful este conex si simplu",
    hints: "Rulati Prim ca de obicei, retinand de fiecare data muchia folosita pentru a adauga un nod nou in arbore; la final sortati muchiile pentru afisare determinista.",
    explanation: "Se ruleaza Prim, retinand pentru fiecare nod adaugat in arbore capatul prin care a fost conectat. Muchiile alese (normalizate ca perechi (min, max), pentru a evita ambiguitatea de ordine) se colecteaza si se sorteaza inainte de afisare, garantand un rezultat determinist indiferent de ordinea interna de procesare a lui Prim.\n\n**Complexitate:** O((n + m) log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<pair<int,long long>>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; long long c; cin >> x >> y >> c;
        adj[x].push_back({y, c});
        adj[y].push_back({x, c});
    }
    vector<bool> inMST(n + 1, false);
    priority_queue<tuple<long long,int,int>, vector<tuple<long long,int,int>>, greater<>> pq;
    pq.push({0, 1, -1});
    vector<pair<int,int>> mstEdges;
    int count = 0;
    while (!pq.empty() && count < n) {
        auto [cost, u, from] = pq.top(); pq.pop();
        if (inMST[u]) continue;
        inMST[u] = true; count++;
        if (from != -1) mstEdges.push_back({min(from, u), max(from, u)});
        for (auto& [v, w] : adj[u]) if (!inMST[v]) pq.push({w, v, u});
    }
    sort(mstEdges.begin(), mstEdges.end());
    for (auto& e : mstEdges) cout << e.first << " " << e.second << "\\n";
    return 0;
}
`,
    py: `import heapq
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    x, y, c = map(int, input().split())
    adj[x].append((y, c))
    adj[y].append((x, c))
inMST = [False] * (n + 1)
pq = [(0, 1, -1)]
mstEdges = []
count = 0
while pq and count < n:
    cost, u, frm = heapq.heappop(pq)
    if inMST[u]:
        continue
    inMST[u] = True
    count += 1
    if frm != -1:
        mstEdges.append((min(frm, u), max(frm, u)))
    for v, w in adj[u]:
        if not inMST[v]:
            heapq.heappush(pq, (w, v, u))
mstEdges.sort()
for a, b in mstEdges:
    print(a, b)
`,
    tests: ["5 7\n1 2 2\n1 3 3\n2 3 1\n2 4 4\n3 4 5\n4 5 6\n3 5 7", "1 0", "4 3\n1 2 1\n2 3 2\n3 4 3", "4 6\n1 2 1\n1 3 4\n1 4 3\n2 3 2\n2 4 5\n3 4 6", "3 3\n1 2 5\n2 3 5\n1 3 5"],
  },
  {
    slug: "g-kruskal-afisare-muchii",
    title: "Arborele partial de cost minim: afisarea muchiilor (Kruskal)",
    difficulty: "medium",
    tags: ["grafuri", "kruskal", "apm"],
    statement: "Se da un graf neorientat conex cu n noduri si m muchii ponderate (costuri pozitive, graf simplu). Determinati muchiile arborelui partial de cost minim, folosind algoritmul lui Kruskal.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c, reprezentand o muchie intre x si y cu costul c.",
    output_format: "Se afiseaza n-1 linii, fiecare cu doua numere i j (i < j), reprezentand muchiile arborelui partial de cost minim, sortate crescator dupa i, apoi dupa j.",
    constraints: "1 <= n <= 100000, n-1 <= m <= 100000, 1 <= c <= 10^6, graful este conex si simplu",
    hints: "Sortati muchiile crescator dupa cost (folosind si nodurile ca tie-break pentru determinism), apoi adaugati-le pe rand folosind Union-Find, sarind peste cele care ar forma un ciclu.",
    explanation: "Algoritmul lui Kruskal sorteaza toate muchiile crescator dupa cost si le adauga in arbore una cate una, folosind o structura Union-Find pentru a detecta rapid daca doua noduri sunt deja in aceeasi componenta (caz in care muchia ar forma un ciclu si se ignora). Tie-break-ul explicit pe (x, y) la sortare garanteaza un rezultat determinist chiar si atunci cand exista muchii de cost egal.\n\n**Complexitate:** O(m log m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<int> parent, rnk;
int find(int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); }
void unite(int a, int b) {
    a = find(a); b = find(b);
    if (a == b) return;
    if (rnk[a] < rnk[b]) swap(a, b);
    parent[b] = a;
    if (rnk[a] == rnk[b]) rnk[a]++;
}
int main() {
    int n, m; cin >> n >> m;
    vector<array<long long,3>> edges(m);
    for (auto& e : edges) { cin >> e[1] >> e[2] >> e[0]; }
    sort(edges.begin(), edges.end());
    parent.resize(n + 1); rnk.assign(n + 1, 0);
    for (int i = 1; i <= n; i++) parent[i] = i;
    vector<pair<int,int>> mstEdges;
    for (auto& e : edges) {
        int x = e[1], y = e[2];
        if (find(x) != find(y)) { unite(x, y); mstEdges.push_back({min(x, y), max(x, y)}); }
    }
    sort(mstEdges.begin(), mstEdges.end());
    for (auto& e : mstEdges) cout << e.first << " " << e.second << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
edges = []
for _ in range(m):
    x, y, c = map(int, input().split())
    edges.append((c, x, y))
edges.sort()
parent = list(range(n + 1))
rank_ = [0] * (n + 1)
def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x
def unite(a, b):
    a, b = find(a), find(b)
    if a == b:
        return
    if rank_[a] < rank_[b]:
        a, b = b, a
    parent[b] = a
    if rank_[a] == rank_[b]:
        rank_[a] += 1
mstEdges = []
for c, x, y in edges:
    if find(x) != find(y):
        unite(x, y)
        mstEdges.append((min(x, y), max(x, y)))
mstEdges.sort()
for a, b in mstEdges:
    print(a, b)
`,
    tests: ["5 7\n1 2 2\n1 3 3\n2 3 1\n2 4 4\n3 4 5\n4 5 6\n3 5 7", "1 0", "4 3\n1 2 1\n2 3 2\n3 4 3", "4 6\n1 2 1\n1 3 4\n1 4 3\n2 3 2\n2 4 5\n3 4 6", "3 3\n1 2 5\n2 3 5\n1 3 5"],
  },
  {
    slug: "g-union-find-operatii",
    title: "Structura Union-Find: operatii de unire si interogare",
    difficulty: "easy",
    tags: ["grafuri", "union-find"],
    statement: "Se dau n multimi disjuncte, initial fiecare continand un singur element (1, 2, ..., n). Se dau apoi q operatii, fiecare de unul din tipurile: 'UNITE x y' (uneste multimile care contin x si y) sau 'QUERY x y' (verifica daca x si y se afla in aceeasi multime). Procesati operatiile in ordine.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citeste q. Urmeaza q linii, fiecare de forma '1 x y' (pentru UNITE) sau '2 x y' (pentru QUERY).",
    output_format: "Pentru fiecare operatie de tip QUERY (cod 2), se afiseaza 'DA' daca x si y sunt in aceeasi multime, altfel 'NU'.",
    constraints: "1 <= n <= 100000, 1 <= q <= 200000",
    hints: "Folositi o structura Union-Find (Disjoint Set Union) cu compresie de drum si reuniune dupa rang, pentru a raspunde eficient la fiecare operatie.",
    explanation: "Structura Union-Find (Disjoint Set Union) mentine o padure in care fiecare arbore reprezinta o multime; fiecare nod are un 'parinte', iar radacina arborelui este reprezentantul multimii. Operatia find urmeaza lantul de parinti pana la radacina, comprimand drumul pentru eficienta; unite leaga radacina uneia dintre multimi de radacina celeilalte (dupa rang, pentru a mentine arborii echilibrati). Doua elemente sunt in aceeasi multime daca si numai daca au aceeasi radacina.\n\n**Complexitate:** O(q * alpha(n)), practic aproape O(q)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<int> parent, rnk;
int find(int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); }
void unite(int a, int b) {
    a = find(a); b = find(b);
    if (a == b) return;
    if (rnk[a] < rnk[b]) swap(a, b);
    parent[b] = a;
    if (rnk[a] == rnk[b]) rnk[a]++;
}
int main() {
    int n; cin >> n;
    parent.resize(n + 1); rnk.assign(n + 1, 0);
    for (int i = 1; i <= n; i++) parent[i] = i;
    int q; cin >> q;
    string out;
    for (int i = 0; i < q; i++) {
        int type, x, y; cin >> type >> x >> y;
        if (type == 1) unite(x, y);
        else out += (find(x) == find(y) ? "DA" : "NU"), out += "\\n";
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
    parent = list(range(n + 1))
    rank_ = [0] * (n + 1)
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    def unite(a, b):
        a, b = find(a), find(b)
        if a == b:
            return
        if rank_[a] < rank_[b]:
            a, b = b, a
        parent[b] = a
        if rank_[a] == rank_[b]:
            rank_[a] += 1
    q = int(data[idx]); idx += 1
    out = []
    for _ in range(q):
        t = int(data[idx]); idx += 1
        x = int(data[idx]); idx += 1
        y = int(data[idx]); idx += 1
        if t == 1:
            unite(x, y)
        else:
            out.append("DA" if find(x) == find(y) else "NU")
    print("\\n".join(out))
main()
`,
    tests: ["5\n5\n2 1 2\n1 1 2\n2 1 2\n1 3 4\n2 1 3", "1\n1\n2 1 1", "4\n3\n1 1 2\n1 2 3\n2 1 3", "6\n4\n1 1 2\n1 3 4\n2 1 3\n2 1 2", "3\n2\n2 1 2\n2 2 3"],
  },
  {
    slug: "g-kruskal-cost-maxim",
    title: "Arborele partial de cost maxim",
    difficulty: "medium",
    tags: ["grafuri", "kruskal", "apm"],
    statement: "Se da un graf neorientat conex cu n noduri si m muchii ponderate (costuri pozitive). Determinati costul total al arborelui partial de cost MAXIM.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c, reprezentand o muchie intre x si y cu costul c.",
    output_format: "Se afiseaza costul total al arborelui partial de cost maxim.",
    constraints: "1 <= n <= 100000, n-1 <= m <= 100000, 1 <= c <= 10^6, graful este conex",
    hints: "Aplicati algoritmul lui Kruskal, dar sortati muchiile DESCRESCATOR dupa cost in loc de crescator.",
    explanation: "Arborele partial de cost maxim se obtine cu exact acelasi algoritm Kruskal, doar ca muchiile se sorteaza descrescator dupa cost inainte de a fi adaugate (folosind Union-Find pentru a evita ciclurile); argumentul de corectitudine (proprietatea taieturii) se aplica simetric, alegand de fiecare data cea mai SCUMPA muchie care traverseaza o taietura.\n\n**Complexitate:** O(m log m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<int> parent, rnk;
int find(int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); }
void unite(int a, int b) {
    a = find(a); b = find(b);
    if (a == b) return;
    if (rnk[a] < rnk[b]) swap(a, b);
    parent[b] = a;
    if (rnk[a] == rnk[b]) rnk[a]++;
}
int main() {
    int n, m; cin >> n >> m;
    vector<array<long long,3>> edges(m);
    for (auto& e : edges) cin >> e[1] >> e[2] >> e[0];
    sort(edges.rbegin(), edges.rend());
    parent.resize(n + 1); rnk.assign(n + 1, 0);
    for (int i = 1; i <= n; i++) parent[i] = i;
    long long total = 0;
    for (auto& e : edges) {
        int x = e[1], y = e[2];
        if (find(x) != find(y)) { unite(x, y); total += e[0]; }
    }
    cout << total << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
edges = []
for _ in range(m):
    x, y, c = map(int, input().split())
    edges.append((c, x, y))
edges.sort(reverse=True)
parent = list(range(n + 1))
rank_ = [0] * (n + 1)
def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x
def unite(a, b):
    a, b = find(a), find(b)
    if a == b:
        return
    if rank_[a] < rank_[b]:
        a, b = b, a
    parent[b] = a
    if rank_[a] == rank_[b]:
        rank_[a] += 1
total = 0
for c, x, y in edges:
    if find(x) != find(y):
        unite(x, y)
        total += c
print(total)
`,
    tests: ["5 7\n1 2 2\n1 3 3\n2 3 1\n2 4 4\n3 4 5\n4 5 6\n3 5 7", "1 0", "4 3\n1 2 1\n2 3 2\n3 4 3", "4 6\n1 2 1\n1 3 4\n1 4 3\n2 3 2\n2 4 5\n3 4 6", "3 3\n1 2 5\n2 3 5\n1 3 5"],
  },
  {
    slug: "g-mst-verificare-conexitate",
    title: "Verificarea existentei unui arbore partial",
    difficulty: "easy",
    tags: ["grafuri", "apm"],
    statement: "Un arbore partial de cost minim exista doar daca graful este conex. Se da un graf neorientat cu n noduri si m muchii ponderate (nu neaparat conex). Verificati daca graful admite un arbore partial (adica este conex).",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c, reprezentand o muchie intre x si y cu costul c.",
    output_format: "Se afiseaza 'DA' daca graful este conex (admite arbore partial), altfel 'NU'.",
    constraints: "1 <= n <= 100000, 0 <= m <= 200000, 1 <= c <= 10^6",
    hints: "Ignorati costurile si verificati conexitatea grafului printr-o simpla parcurgere BFS/DFS.",
    explanation: "Existenta unui arbore partial (indiferent de cost) depinde exclusiv de structura grafului, nu de costurile muchiilor: un graf admite arbore partial daca si numai daca este conex. Se verifica aceasta proprietate printr-o simpla parcurgere BFS, ignorand complet costurile.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int x, y; long long c; cin >> x >> y >> c;
        adj[x].push_back(y);
        adj[y].push_back(x);
    }
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
    x, y, c = map(int, input().split())
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
    tests: ["4 3\n1 2 1\n2 3 1\n3 4 1", "4 2\n1 2 1\n3 4 1", "1 0", "5 3\n1 2 1\n2 3 1\n4 5 1", "6 5\n1 2 1\n2 3 1\n3 4 1\n4 5 1\n5 6 1"],
  },
  {
    slug: "g-al-doilea-cel-mai-mic-apm",
    title: "Al doilea cel mai mic arbore partial",
    difficulty: "hard",
    tags: ["grafuri", "apm", "kruskal"],
    statement: "Se da un graf neorientat conex cu n noduri si m muchii ponderate (costuri pozitive, graf simplu). Determinati costul celui de-al doilea cel mai mic arbore partial: cel mai mic cost total al unui arbore partial diferit STRUCTURAL de arborele partial de cost minim (poate avea acelasi cost total, daca exista un al doilea arbore optim distinct).",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere x y c, reprezentand o muchie intre x si y cu costul c.",
    output_format: "Se afiseaza costul celui de-al doilea cel mai mic arbore partial, sau -1 daca graful nu admite decat un singur arbore partial (adica m = n - 1).",
    constraints: "2 <= n <= 200, n-1 <= m <= 500, 1 <= c <= 10^6, graful este conex si simplu",
    hints: "Calculati mai intai APM-ul cu Kruskal. Pentru fiecare muchie care NU face parte din APM, aflati (prin BFS/DFS pe arbore) cea mai costisitoare muchie de pe drumul dintre capetele ei in arbore; inlocuind acea muchie cu cea noua se obtine un arbore candidat. Raspunsul este costul minim dintre toti acesti candidati.",
    explanation: "Adaugarea oricarei muchii care nu e in APM formeaza exact un ciclu cu arborele; eliminand din acest ciclu muchia de cost maxim (alta decat cea nou adaugata) se obtine un alt arbore partial valid. Costul acestui nou arbore este costMST - (costul muchiei maxime eliminate) + (costul muchiei adaugate). Al doilea cel mai mic APM este minimul acestor costuri candidate peste toate muchiile care nu apartin APM-ului original (fiecare astfel de inlocuire da un arbore distinct structural, deoarece foloseste o muchie noua). Daca graful este el insusi un arbore (m = n-1), nu exista nicio muchie de adaugat, deci nu exista un al doilea arbore.\n\n**Complexitate:** O(m * n)",
    time_limit_ms: 4000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<int> parent, rnk;
int find(int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); }
void unite(int a, int b) {
    a = find(a); b = find(b);
    if (a == b) return;
    if (rnk[a] < rnk[b]) swap(a, b);
    parent[b] = a;
    if (rnk[a] == rnk[b]) rnk[a]++;
}
int main() {
    int n, m; cin >> n >> m;
    vector<array<long long,3>> edges(m); // cost, x, y
    for (auto& e : edges) cin >> e[1] >> e[2] >> e[0];
    vector<array<long long,3>> sorted_edges = edges;
    sort(sorted_edges.begin(), sorted_edges.end());
    parent.resize(n + 1); rnk.assign(n + 1, 0);
    for (int i = 1; i <= n; i++) parent[i] = i;
    vector<vector<pair<int,long long>>> tree(n + 1);
    set<pair<int,int>> inMST;
    long long mstCost = 0;
    for (auto& e : sorted_edges) {
        int x = e[1], y = e[2]; long long c = e[0];
        if (find(x) != find(y)) {
            unite(x, y);
            mstCost += c;
            tree[x].push_back({y, c});
            tree[y].push_back({x, c});
            inMST.insert({min(x, y), max(x, y)});
        }
    }
    if ((int)inMST.size() == m) { cout << -1 << "\\n"; return 0; }
    long long best = (long long)4e18;
    for (auto& e : edges) {
        int x = e[1], y = e[2]; long long c = e[0];
        int a = min(x, y), b = max(x, y);
        if (inMST.count({a, b})) continue;
        vector<long long> maxOnPath(n + 1, -1);
        vector<int> par(n + 1, -1);
        queue<int> q; q.push(x); maxOnPath[x] = 0;
        while (!q.empty()) {
            int u = q.front(); q.pop();
            if (u == y) break;
            for (auto& [v, w] : tree[u]) if (maxOnPath[v] == -1) {
                maxOnPath[v] = max(maxOnPath[u], w);
                par[v] = u;
                q.push(v);
            }
        }
        long long candidate = mstCost - maxOnPath[y] + c;
        best = min(best, candidate);
    }
    cout << best << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
edges = []
for _ in range(m):
    x, y, c = map(int, input().split())
    edges.append((c, x, y))
sorted_edges = sorted(edges)
parent = list(range(n + 1))
rank_ = [0] * (n + 1)
def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x
def unite(a, b):
    a, b = find(a), find(b)
    if a == b:
        return
    if rank_[a] < rank_[b]:
        a, b = b, a
    parent[b] = a
    if rank_[a] == rank_[b]:
        rank_[a] += 1
tree = [[] for _ in range(n + 1)]
inMST = set()
mstCost = 0
for c, x, y in sorted_edges:
    if find(x) != find(y):
        unite(x, y)
        mstCost += c
        tree[x].append((y, c))
        tree[y].append((x, c))
        inMST.add((min(x, y), max(x, y)))
if len(inMST) == m:
    print(-1)
else:
    best = float('inf')
    for c, x, y in edges:
        a, b = min(x, y), max(x, y)
        if (a, b) in inMST:
            continue
        maxOnPath = [-1] * (n + 1)
        maxOnPath[x] = 0
        q = deque([x])
        while q:
            u = q.popleft()
            if u == y:
                break
            for v, w in tree[u]:
                if maxOnPath[v] == -1:
                    maxOnPath[v] = max(maxOnPath[u], w)
                    q.append(v)
        candidate = mstCost - maxOnPath[y] + c
        best = min(best, candidate)
    print(best)
`,
    tests: ["4 5\n1 2 1\n2 3 2\n3 4 3\n1 4 4\n1 3 10", "3 2\n1 2 1\n2 3 1", "4 6\n1 2 1\n1 3 1\n1 4 1\n2 3 1\n2 4 1\n3 4 1", "5 6\n1 2 1\n2 3 1\n3 4 1\n4 5 1\n1 5 2\n2 4 2", "2 1\n1 2 5"],
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
