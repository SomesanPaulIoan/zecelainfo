const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade10", chapter: "structuri-liniare", sub: "lee" };

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

const IN_FMT_GRID = "Pe prima linie se citesc n si m, numarul de linii si de coloane ale matricei. Urmeaza n linii, fiecare continand un sir de m caractere.";

const problems = [
  {
    slug: "lee-distanta-minima",
    title: "Distanta minima intr-un labirint (algoritmul Lee)",
    difficulty: "medium",
    tags: ["lee", "bfs", "coada", "labirint"],
    statement: "Se citeste o matrice reprezentand un labirint, cu caracterele '.' (celula libera), '#' (obstacol), 'S' (punctul de start) si 'F' (punctul final). Determinati, folosind algoritmul Lee (o parcurgere in latime cu o coada, pornind din S), numarul minim de pasi necesari pentru a ajunge din S in F, deplasandu-va doar sus, jos, stanga sau dreapta, prin celule libere. Daca F nu poate fi atins, afisati -1.",
    input_format: IN_FMT_GRID,
    output_format: "Se afiseaza numarul minim de pasi din S pana in F, sau -1 daca F nu este accesibil.",
    constraints: "1 <= n, m <= 30, matricea contine exact o celula S si o celula F",
    hints: "Porniti o parcurgere in latime (BFS) din S, folosind o coada; distanta unei celule este distanta vecinului din care a fost descoperita, plus 1.",
    explanation: "Algoritmul Lee este o parcurgere in latime (BFS) pornind din celula S, folosind o coada. Se initializeaza distanta lui S cu 0 si se adauga in coada. La fiecare pas, se extrage o celula din fata cozii si se incearca extinderea catre cele 4 celule vecine (sus, jos, stanga, dreapta); daca o vecina este libera (nu e obstacol) si nu a fost inca vizitata, i se atribuie distanta curenta + 1 si se adauga in coada. Deoarece BFS viziteaza celulele in ordinea crescatoare a distantei, prima data cand F este descoperit, distanta gasita este minima.\n\n**Complexitate:** O(n * m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<string> grid(n);
    for (auto &row : grid) cin >> row;
    int si=-1,sj=-1,fi=-1,fj=-1;
    for (int i=0;i<n;i++) for (int j=0;j<m;j++) {
        if (grid[i][j]=='S') { si=i; sj=j; }
        if (grid[i][j]=='F') { fi=i; fj=j; }
    }
    vector<vector<int>> dist(n, vector<int>(m, -1));
    queue<pair<int,int>> q;
    dist[si][sj]=0;
    q.push({si,sj});
    int di[]={-1,1,0,0}, dj[]={0,0,-1,1};
    while(!q.empty()) {
        auto [ci,cj]=q.front(); q.pop();
        for (int d=0; d<4; d++) {
            int ni=ci+di[d], nj=cj+dj[d];
            if (ni>=0&&ni<n&&nj>=0&&nj<m&&grid[ni][nj]!='#'&&dist[ni][nj]==-1) {
                dist[ni][nj]=dist[ci][cj]+1;
                q.push({ni,nj});
            }
        }
    }
    cout << dist[fi][fj] << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
grid = [input() for _ in range(n)]
si = sj = fi = fj = -1
for i in range(n):
    for j in range(m):
        if grid[i][j] == "S":
            si, sj = i, j
        if grid[i][j] == "F":
            fi, fj = i, j
dist = [[-1] * m for _ in range(n)]
dist[si][sj] = 0
q = deque([(si, sj)])
di = [-1, 1, 0, 0]
dj = [0, 0, -1, 1]
while q:
    ci, cj = q.popleft()
    for d in range(4):
        ni, nj = ci + di[d], cj + dj[d]
        if 0 <= ni < n and 0 <= nj < m and grid[ni][nj] != "#" and dist[ni][nj] == -1:
            dist[ni][nj] = dist[ci][cj] + 1
            q.append((ni, nj))
print(dist[fi][fj])
`,
    tests: ["3 3\nS..\n.#.\n..F", "3 3\nS#.\n###\n.#F", "1 5\nS...F", "3 3\nS..\n...\n..F", "4 4\nS...\n.##.\n.##.\n...F"],
  },
  {
    slug: "lee-afisare-drum",
    title: "Afisarea drumului minim intr-un labirint",
    difficulty: "hard",
    tags: ["lee", "bfs", "coada", "labirint", "reconstructie drum"],
    statement: "Se citeste o matrice reprezentand un labirint, la fel ca in problemele anterioare (caracterele '.', '#', 'S', 'F'). Folosind algoritmul Lee, determinati un drum minim de la S la F si afisati-l ca o succesiune de miscari: 'N' (sus), 'S' (jos), 'V' (stanga), 'E' (dreapta). Daca F nu este accesibil, afisati -1.",
    input_format: IN_FMT_GRID,
    output_format: "Se afiseaza sirul miscarilor drumului minim (fara spatii intre ele), sau -1 daca F nu este accesibil.",
    constraints: "1 <= n, m <= 30, matricea contine exact o celula S si o celula F",
    hints: "Pe langa distanta, retineti pentru fiecare celula directia din care a fost descoperita prima data in BFS; reconstruiti drumul pornind din F si urmand aceste directii inapoi pana la S, apoi inversati-l.",
    explanation: "Se executa algoritmul Lee (BFS) ca in problema anterioara, dar pentru fiecare celula nou descoperita se retine si directia miscarii care a dus la ea. Daca F este accesibil, se reconstruieste drumul pornind din F: se citeste directia retinuta pentru celula curenta, se adauga la drum, iar celula curenta devine cea din care s-a ajuns (aplicand miscarea inversa), pana se ajunge inapoi la S. Drumul construit astfel este in ordine inversa, deci se inverseaza la final pentru a obtine drumul de la S la F.\n\n**Complexitate:** O(n * m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<string> grid(n);
    for (auto &row : grid) cin >> row;
    int si=-1,sj=-1,fi=-1,fj=-1;
    for (int i=0;i<n;i++) for (int j=0;j<m;j++) {
        if (grid[i][j]=='S') { si=i; sj=j; }
        if (grid[i][j]=='F') { fi=i; fj=j; }
    }
    vector<vector<int>> dist(n, vector<int>(m, -1));
    vector<vector<char>> parent(n, vector<char>(m, ' '));
    queue<pair<int,int>> q;
    dist[si][sj]=0;
    q.push({si,sj});
    int di[]={-1,1,0,0}, dj[]={0,0,-1,1};
    char dirChar[]={'N','S','V','E'};
    while(!q.empty()) {
        auto [ci,cj]=q.front(); q.pop();
        for (int d=0; d<4; d++) {
            int ni=ci+di[d], nj=cj+dj[d];
            if (ni>=0&&ni<n&&nj>=0&&nj<m&&grid[ni][nj]!='#'&&dist[ni][nj]==-1) {
                dist[ni][nj]=dist[ci][cj]+1;
                parent[ni][nj]=dirChar[d];
                q.push({ni,nj});
            }
        }
    }
    if (dist[fi][fj]==-1) { cout << -1 << "\\n"; return 0; }
    string drum="";
    int ci=fi, cj=fj;
    while (!(ci==si && cj==sj)) {
        char d = parent[ci][cj];
        drum += d;
        if (d=='N') ci++;
        else if (d=='S') ci--;
        else if (d=='V') cj++;
        else cj--;
    }
    reverse(drum.begin(), drum.end());
    cout << drum << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
grid = [input() for _ in range(n)]
si = sj = fi = fj = -1
for i in range(n):
    for j in range(m):
        if grid[i][j] == "S":
            si, sj = i, j
        if grid[i][j] == "F":
            fi, fj = i, j
dist = [[-1] * m for _ in range(n)]
parent = [[" "] * m for _ in range(n)]
dist[si][sj] = 0
q = deque([(si, sj)])
di = [-1, 1, 0, 0]
dj = [0, 0, -1, 1]
dir_char = ["N", "S", "V", "E"]
while q:
    ci, cj = q.popleft()
    for d in range(4):
        ni, nj = ci + di[d], cj + dj[d]
        if 0 <= ni < n and 0 <= nj < m and grid[ni][nj] != "#" and dist[ni][nj] == -1:
            dist[ni][nj] = dist[ci][cj] + 1
            parent[ni][nj] = dir_char[d]
            q.append((ni, nj))
if dist[fi][fj] == -1:
    print(-1)
else:
    drum = []
    ci, cj = fi, fj
    while not (ci == si and cj == sj):
        d = parent[ci][cj]
        drum.append(d)
        if d == "N":
            ci += 1
        elif d == "S":
            ci -= 1
        elif d == "V":
            cj += 1
        else:
            cj -= 1
    drum.reverse()
    print("".join(drum))
`,
    tests: ["3 3\nS..\n.#.\n..F", "3 3\nS#.\n###\n.#F", "1 5\nS...F", "3 3\nS..\n...\n..F", "4 4\nS...\n.##.\n.##.\n...F"],
  },
  {
    slug: "lee-8-directii",
    title: "Distanta minima intr-un labirint cu 8 directii de deplasare",
    difficulty: "medium",
    tags: ["lee", "bfs", "coada", "labirint", "diagonale"],
    statement: "Se citeste o matrice reprezentand un labirint, la fel ca in problemele anterioare. De data aceasta, deplasarea se poate face in oricare dintre cele 8 directii (inclusiv pe diagonale). Determinati, folosind algoritmul Lee, numarul minim de pasi din S pana in F, sau -1 daca F nu este accesibil.",
    input_format: IN_FMT_GRID,
    output_format: "Se afiseaza numarul minim de pasi din S pana in F, sau -1 daca F nu este accesibil.",
    constraints: "1 <= n, m <= 30, matricea contine exact o celula S si o celula F",
    hints: "Identic cu algoritmul Lee clasic, dar cu 8 directii de deplasare posibile in loc de 4.",
    explanation: "Se aplica acelasi algoritm Lee (BFS din S), dar la fiecare celula se incearca extinderea catre toate cele 8 celule vecine (cele 4 directii clasice plus cele 4 diagonale), fiecare miscare avand cost 1. Prima data cand F este descoperit in BFS, distanta gasita este minima.\n\n**Complexitate:** O(n * m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<string> grid(n);
    for (auto &row : grid) cin >> row;
    int si=-1,sj=-1,fi=-1,fj=-1;
    for (int i=0;i<n;i++) for (int j=0;j<m;j++) {
        if (grid[i][j]=='S') { si=i; sj=j; }
        if (grid[i][j]=='F') { fi=i; fj=j; }
    }
    vector<vector<int>> dist(n, vector<int>(m, -1));
    queue<pair<int,int>> q;
    dist[si][sj]=0;
    q.push({si,sj});
    int di[]={-1,-1,-1,0,0,1,1,1};
    int dj[]={-1,0,1,-1,1,-1,0,1};
    while(!q.empty()) {
        auto [ci,cj]=q.front(); q.pop();
        for (int d=0; d<8; d++) {
            int ni=ci+di[d], nj=cj+dj[d];
            if (ni>=0&&ni<n&&nj>=0&&nj<m&&grid[ni][nj]!='#'&&dist[ni][nj]==-1) {
                dist[ni][nj]=dist[ci][cj]+1;
                q.push({ni,nj});
            }
        }
    }
    cout << dist[fi][fj] << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
grid = [input() for _ in range(n)]
si = sj = fi = fj = -1
for i in range(n):
    for j in range(m):
        if grid[i][j] == "S":
            si, sj = i, j
        if grid[i][j] == "F":
            fi, fj = i, j
dist = [[-1] * m for _ in range(n)]
dist[si][sj] = 0
q = deque([(si, sj)])
di = [-1, -1, -1, 0, 0, 1, 1, 1]
dj = [-1, 0, 1, -1, 1, -1, 0, 1]
while q:
    ci, cj = q.popleft()
    for d in range(8):
        ni, nj = ci + di[d], cj + dj[d]
        if 0 <= ni < n and 0 <= nj < m and grid[ni][nj] != "#" and dist[ni][nj] == -1:
            dist[ni][nj] = dist[ci][cj] + 1
            q.append((ni, nj))
print(dist[fi][fj])
`,
    tests: ["3 3\nS..\n.#.\n..F", "3 3\nS#.\n###\n.#F", "1 5\nS...F", "3 3\nS..\n...\n..F", "4 4\nS...\n.##.\n.##.\n...F"],
  },
  {
    slug: "lee-multi-sursa-distanta",
    title: "Distanta minima pana la cea mai apropiata sursa (BFS multi-sursa)",
    difficulty: "medium",
    tags: ["lee", "bfs", "coada", "multi-sursa"],
    statement: "Se citeste o matrice cu caracterele '.' (celula libera), '#' (obstacol) si '*' (sursa; pot exista mai multe surse). Pornind simultan din toate sursele, determinati pentru fiecare celula distanta minima pana la cea mai apropiata sursa, folosind o singura parcurgere Lee cu toate sursele introduse initial in coada. Celulele obstacol se afiseaza -1.",
    input_format: IN_FMT_GRID,
    output_format: "Se afiseaza n linii, fiecare cu m numere separate prin spatiu, reprezentand distanta minima a fiecarei celule pana la cea mai apropiata sursa (-1 pentru obstacole sau celule inaccesibile).",
    constraints: "1 <= n, m <= 30, exista cel putin o sursa",
    hints: "Initializati coada cu toate celulele sursa, avand distanta 0, apoi rulati o singura parcurgere Lee obisnuita.",
    explanation: "Se introduc initial in coada toate celulele sursa, fiecare cu distanta 0. Se ruleaza apoi o singura parcurgere Lee (BFS) obisnuita, in care fiecare celula libera nevizitata primeste distanta celulei din care a fost descoperita plus 1. Deoarece toate sursele pornesc simultan, distanta finala a fiecarei celule este distanta minima pana la cea mai apropiata dintre ele.\n\n**Complexitate:** O(n * m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<string> grid(n);
    for (auto &row : grid) cin >> row;
    vector<vector<int>> dist(n, vector<int>(m, -1));
    queue<pair<int,int>> q;
    for (int i=0;i<n;i++) for (int j=0;j<m;j++) if (grid[i][j]=='*') { dist[i][j]=0; q.push({i,j}); }
    int di[]={-1,1,0,0}, dj[]={0,0,-1,1};
    while(!q.empty()) {
        auto [ci,cj]=q.front(); q.pop();
        for (int d=0; d<4; d++) {
            int ni=ci+di[d], nj=cj+dj[d];
            if (ni>=0&&ni<n&&nj>=0&&nj<m&&grid[ni][nj]!='#'&&dist[ni][nj]==-1) {
                dist[ni][nj]=dist[ci][cj]+1;
                q.push({ni,nj});
            }
        }
    }
    for (int i=0;i<n;i++) {
        for (int j=0;j<m;j++) {
            cout << dist[i][j];
            if (j+1<m) cout << ' ';
        }
        cout << "\\n";
    }
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
grid = [input() for _ in range(n)]
dist = [[-1] * m for _ in range(n)]
q = deque()
for i in range(n):
    for j in range(m):
        if grid[i][j] == "*":
            dist[i][j] = 0
            q.append((i, j))
di = [-1, 1, 0, 0]
dj = [0, 0, -1, 1]
while q:
    ci, cj = q.popleft()
    for d in range(4):
        ni, nj = ci + di[d], cj + dj[d]
        if 0 <= ni < n and 0 <= nj < m and grid[ni][nj] != "#" and dist[ni][nj] == -1:
            dist[ni][nj] = dist[ci][cj] + 1
            q.append((ni, nj))
for i in range(n):
    print(" ".join(str(dist[i][j]) for j in range(m)))
`,
    tests: [
      "3 3\n*..\n...\n..*",
      "2 4\n*..#\n#..*",
      "1 5\n*...*",
      "3 3\n...\n.*.\n...",
      "4 4\n*..#\n.##.\n.##.\n#..*",
    ],
  },
  {
    slug: "lee-numarare-componente",
    title: "Numararea componentelor conexe dintr-o matrice (flood fill)",
    difficulty: "easy",
    tags: ["lee", "bfs", "coada", "flood-fill", "componente-conexe"],
    statement: "Se citeste o matrice cu caracterele '.' (celula libera) si '#' (obstacol). Determinati numarul de componente conexe formate din celule libere, doua celule fiind considerate direct legate daca sunt vecine pe orizontala sau verticala. Folositi o parcurgere Lee (flood fill) pornind din fiecare celula libera nevizitata.",
    input_format: IN_FMT_GRID,
    output_format: "Se afiseaza numarul de componente conexe de celule libere.",
    constraints: "1 <= n, m <= 30",
    hints: "Parcurgeti toate celulele; de fiecare data cand gasiti o celula libera nevizitata, porniti o parcurgere Lee (BFS) care marcheaza toata componenta ei ca vizitata, si incrementati un contor.",
    explanation: "Se parcurg toate celulele matricei. De fiecare data cand se gaseste o celula libera nevizitata, se incrementeaza contorul de componente si se porneste o parcurgere Lee (BFS) din acea celula, marcand drept vizitate toate celulele libere accesibile din ea (pe orizontala sau verticala), pentru a nu le recontoriza. La final, contorul reprezinta numarul de componente conexe.\n\n**Complexitate:** O(n * m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<string> grid(n);
    for (auto &row : grid) cin >> row;
    vector<vector<bool>> vizitat(n, vector<bool>(m,false));
    int di[]={-1,1,0,0}, dj[]={0,0,-1,1};
    int cnt=0;
    for (int i=0;i<n;i++) for (int j=0;j<m;j++) {
        if (grid[i][j]=='.' && !vizitat[i][j]) {
            cnt++;
            queue<pair<int,int>> q;
            q.push({i,j});
            vizitat[i][j]=true;
            while(!q.empty()) {
                auto [ci,cj]=q.front(); q.pop();
                for (int d=0; d<4; d++) {
                    int ni=ci+di[d], nj=cj+dj[d];
                    if (ni>=0&&ni<n&&nj>=0&&nj<m&&grid[ni][nj]=='.'&&!vizitat[ni][nj]) {
                        vizitat[ni][nj]=true;
                        q.push({ni,nj});
                    }
                }
            }
        }
    }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
grid = [input() for _ in range(n)]
vizitat = [[False] * m for _ in range(n)]
di = [-1, 1, 0, 0]
dj = [0, 0, -1, 1]
cnt = 0
for i in range(n):
    for j in range(m):
        if grid[i][j] == "." and not vizitat[i][j]:
            cnt += 1
            q = deque([(i, j)])
            vizitat[i][j] = True
            while q:
                ci, cj = q.popleft()
                for d in range(4):
                    ni, nj = ci + di[d], cj + dj[d]
                    if 0 <= ni < n and 0 <= nj < m and grid[ni][nj] == "." and not vizitat[ni][nj]:
                        vizitat[ni][nj] = True
                        q.append((ni, nj))
print(cnt)
`,
    tests: ["3 3\n.#.\n#.#\n.#.", "3 3\n...\n.#.\n...", "4 4\n....\n....\n....\n....", "5 5\n#####\n#...#\n#.#.#\n#...#\n#####", "3 5\n.#.#.\n.#.#.\n.#.#."],
  },
  {
    slug: "lee-cea-mai-mare-componenta",
    title: "Dimensiunea celei mai mari componente conexe dintr-o matrice",
    difficulty: "medium",
    tags: ["lee", "bfs", "coada", "flood-fill", "componente-conexe"],
    statement: "Se citeste o matrice cu caracterele '.' (celula libera) si '#' (obstacol). Determinati dimensiunea celei mai mari componente conexe formate din celule libere (doua celule fiind vecine pe orizontala sau verticala), folosind o parcurgere Lee (flood fill) pentru fiecare componenta.",
    input_format: IN_FMT_GRID,
    output_format: "Se afiseaza numarul de celule al celei mai mari componente conexe.",
    constraints: "1 <= n, m <= 30, exista cel putin o celula libera",
    hints: "La fiecare parcurgere Lee dintr-o celula libera nevizitata, numarati cate celule contine componenta descoperita, si retineti maximul.",
    explanation: "Se parcurg toate celulele; pentru fiecare celula libera nevizitata se porneste o parcurgere Lee (BFS), numarand cate celule sunt vizitate in aceasta componenta. Se retine maximul dintre dimensiunile tuturor componentelor descoperite.\n\n**Complexitate:** O(n * m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<string> grid(n);
    for (auto &row : grid) cin >> row;
    vector<vector<bool>> vizitat(n, vector<bool>(m,false));
    int di[]={-1,1,0,0}, dj[]={0,0,-1,1};
    int maxDim=0;
    for (int i=0;i<n;i++) for (int j=0;j<m;j++) {
        if (grid[i][j]=='.' && !vizitat[i][j]) {
            int dim=0;
            queue<pair<int,int>> q;
            q.push({i,j});
            vizitat[i][j]=true;
            while(!q.empty()) {
                auto [ci,cj]=q.front(); q.pop();
                dim++;
                for (int d=0; d<4; d++) {
                    int ni=ci+di[d], nj=cj+dj[d];
                    if (ni>=0&&ni<n&&nj>=0&&nj<m&&grid[ni][nj]=='.'&&!vizitat[ni][nj]) {
                        vizitat[ni][nj]=true;
                        q.push({ni,nj});
                    }
                }
            }
            maxDim = max(maxDim, dim);
        }
    }
    cout << maxDim << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
grid = [input() for _ in range(n)]
vizitat = [[False] * m for _ in range(n)]
di = [-1, 1, 0, 0]
dj = [0, 0, -1, 1]
max_dim = 0
for i in range(n):
    for j in range(m):
        if grid[i][j] == "." and not vizitat[i][j]:
            dim = 0
            q = deque([(i, j)])
            vizitat[i][j] = True
            while q:
                ci, cj = q.popleft()
                dim += 1
                for d in range(4):
                    ni, nj = ci + di[d], cj + dj[d]
                    if 0 <= ni < n and 0 <= nj < m and grid[ni][nj] == "." and not vizitat[ni][nj]:
                        vizitat[ni][nj] = True
                        q.append((ni, nj))
            max_dim = max(max_dim, dim)
print(max_dim)
`,
    tests: ["3 3\n.#.\n#.#\n.#.", "3 3\n...\n.#.\n...", "4 4\n....\n....\n....\n....", "4 5\n..##.\n..##.\n.....\n##...", "3 5\n.#.#.\n.#.#.\n.#.#."],
  },
  {
    slug: "lee-numar-drumuri-minime",
    title: "Numarul de drumuri minime intr-un labirint",
    difficulty: "hard",
    tags: ["lee", "bfs", "coada", "labirint", "numarare drumuri"],
    statement: "Se citeste o matrice reprezentand un labirint, la fel ca in problemele anterioare (caracterele '.', '#', 'S', 'F'). Determinati cate drumuri distincte de lungime minima exista de la S la F, deplasandu-va doar sus, jos, stanga sau dreapta prin celule libere. Daca F nu este accesibil, afisati 0.",
    input_format: IN_FMT_GRID,
    output_format: "Se afiseaza numarul de drumuri minime distincte de la S la F.",
    constraints: "1 <= n, m <= 20, matricea contine exact o celula S si o celula F",
    hints: "Calculati mai intai distantele cu Lee. Apoi, procesand celulele in ordinea distantei (chiar ordinea in care au fost extrase din coada la BFS), propagati catre fiecare vecin aflat la distanta cu exact 1 mai mare numarul de drumuri catre celula curenta.",
    explanation: "Se ruleaza mai intai algoritmul Lee (BFS) din S, retinand distanta fiecarei celule si ordinea in care celulele au fost extrase din coada (aceasta ordine este automat crescatoare dupa distanta). Apoi se calculeaza, pentru fiecare celula, numarul de drumuri minime pana la ea: numarul de drumuri al lui S este 1, iar pentru fiecare celula procesata in ordinea de mai sus, acest numar se adauga la numarul de drumuri al fiecarui vecin aflat la o distanta cu exact 1 mai mare (indiferent daca acel vecin a fost 'descoperit' din aceasta celula sau din alta, pentru a acumula contributiile tuturor predecesorilor posibili). Raspunsul final este numarul de drumuri minime acumulat pentru F.\n\n**Complexitate:** O(n * m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<string> grid(n);
    for (auto &row : grid) cin >> row;
    int si=-1,sj=-1,fi=-1,fj=-1;
    for (int i=0;i<n;i++) for (int j=0;j<m;j++) {
        if (grid[i][j]=='S') { si=i; sj=j; }
        if (grid[i][j]=='F') { fi=i; fj=j; }
    }
    vector<vector<int>> dist(n, vector<int>(m, -1));
    vector<pair<int,int>> ordine;
    queue<pair<int,int>> q;
    dist[si][sj]=0;
    q.push({si,sj});
    int di[]={-1,1,0,0}, dj[]={0,0,-1,1};
    while(!q.empty()) {
        auto [ci,cj]=q.front(); q.pop();
        ordine.push_back({ci,cj});
        for (int d=0; d<4; d++) {
            int ni=ci+di[d], nj=cj+dj[d];
            if (ni>=0&&ni<n&&nj>=0&&nj<m&&grid[ni][nj]!='#'&&dist[ni][nj]==-1) {
                dist[ni][nj]=dist[ci][cj]+1;
                q.push({ni,nj});
            }
        }
    }
    if (dist[fi][fj]==-1) { cout << 0 << "\\n"; return 0; }
    vector<vector<long long>> cnt(n, vector<long long>(m, 0));
    cnt[si][sj]=1;
    for (auto &p : ordine) {
        int ci=p.first, cj=p.second;
        for (int d=0; d<4; d++) {
            int ni=ci+di[d], nj=cj+dj[d];
            if (ni>=0&&ni<n&&nj>=0&&nj<m&&dist[ni][nj]==dist[ci][cj]+1) {
                cnt[ni][nj]+=cnt[ci][cj];
            }
        }
    }
    cout << cnt[fi][fj] << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
grid = [input() for _ in range(n)]
si = sj = fi = fj = -1
for i in range(n):
    for j in range(m):
        if grid[i][j] == "S":
            si, sj = i, j
        if grid[i][j] == "F":
            fi, fj = i, j
dist = [[-1] * m for _ in range(n)]
ordine = []
dist[si][sj] = 0
q = deque([(si, sj)])
di = [-1, 1, 0, 0]
dj = [0, 0, -1, 1]
while q:
    ci, cj = q.popleft()
    ordine.append((ci, cj))
    for d in range(4):
        ni, nj = ci + di[d], cj + dj[d]
        if 0 <= ni < n and 0 <= nj < m and grid[ni][nj] != "#" and dist[ni][nj] == -1:
            dist[ni][nj] = dist[ci][cj] + 1
            q.append((ni, nj))
if dist[fi][fj] == -1:
    print(0)
else:
    cnt = [[0] * m for _ in range(n)]
    cnt[si][sj] = 1
    for ci, cj in ordine:
        for d in range(4):
            ni, nj = ci + di[d], cj + dj[d]
            if 0 <= ni < n and 0 <= nj < m and dist[ni][nj] == dist[ci][cj] + 1:
                cnt[ni][nj] += cnt[ci][cj]
    print(cnt[fi][fj])
`,
    tests: ["3 3\nS..\n...\n..F", "1 5\nS...F", "3 3\nS#.\n...\n.#F", "4 4\nS...\n....\n....\n...F", "2 2\nS.\n.F"],
  },
  {
    slug: "lee-cal-sah",
    title: "Numarul minim de mutari ale calului pe tabla de sah",
    difficulty: "hard",
    tags: ["lee", "bfs", "coada", "sah", "cal"],
    statement: "Se citeste dimensiunea n a unei table de sah (n x n) si coordonatele (0-indexate) unei celule de start si ale unei celule destinatie. Determinati numarul minim de mutari ale calului necesare pentru a ajunge din celula de start in celula destinatie, folosind algoritmul Lee (BFS), unde vecinii unei celule sunt cele (cel mult 8) celule accesibile printr-o mutare de cal.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc x1, y1, x2, y2: linia si coloana celulei de start, apoi linia si coloana celulei destinatie.",
    output_format: "Se afiseaza numarul minim de mutari ale calului.",
    constraints: "1 <= n <= 30, 0 <= x1, y1, x2, y2 <= n - 1",
    hints: "Un cal aflat pe celula (i, j) poate ajunge in cel mult 8 celule de forma (i +- 1, j +- 2) sau (i +- 2, j +- 1). Rulati Lee pornind din celula de start, folosind aceste mutari ca 'vecini'.",
    explanation: "Se aplica algoritmul Lee (BFS) pornind din celula de start, unde 'vecinii' unei celule (i, j) sunt cele pana la 8 celule accesibile printr-o mutare de cal: (i-2,j-1), (i-2,j+1), (i-1,j-2), (i-1,j+2), (i+1,j-2), (i+1,j+2), (i+2,j-1), (i+2,j+1), daca sunt in interiorul tablei. Deoarece toate mutarile au cost 1, prima data cand celula destinatie este descoperita in BFS, distanta gasita este numarul minim de mutari.\n\n**Complexitate:** O(n^2)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    int x1,y1,x2,y2; cin >> x1 >> y1 >> x2 >> y2;
    vector<vector<int>> dist(n, vector<int>(n, -1));
    queue<pair<int,int>> q;
    dist[x1][y1]=0;
    q.push({x1,y1});
    int di[]={-2,-2,-1,-1,1,1,2,2};
    int dj[]={-1,1,-2,2,-2,2,-1,1};
    while(!q.empty()) {
        auto [ci,cj]=q.front(); q.pop();
        for (int d=0; d<8; d++) {
            int ni=ci+di[d], nj=cj+dj[d];
            if (ni>=0&&ni<n&&nj>=0&&nj<n&&dist[ni][nj]==-1) {
                dist[ni][nj]=dist[ci][cj]+1;
                q.push({ni,nj});
            }
        }
    }
    cout << dist[x2][y2] << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n = int(input())
x1, y1, x2, y2 = map(int, input().split())
dist = [[-1] * n for _ in range(n)]
dist[x1][y1] = 0
q = deque([(x1, y1)])
di = [-2, -2, -1, -1, 1, 1, 2, 2]
dj = [-1, 1, -2, 2, -2, 2, -1, 1]
while q:
    ci, cj = q.popleft()
    for d in range(8):
        ni, nj = ci + di[d], cj + dj[d]
        if 0 <= ni < n and 0 <= nj < n and dist[ni][nj] == -1:
            dist[ni][nj] = dist[ci][cj] + 1
            q.append((ni, nj))
print(dist[x2][y2])
`,
    tests: ["8\n0 0 7 7", "8\n0 0 1 2", "5\n0 0 4 4", "1\n0 0 0 0", "6\n0 0 5 5"],
  },
  {
    slug: "lee-timp-propagare-foc",
    title: "Timpul minim de propagare a unui incendiu (BFS multi-sursa)",
    difficulty: "medium",
    tags: ["lee", "bfs", "coada", "multi-sursa", "propagare"],
    statement: "Se citeste o matrice cu caracterele '.' (celula libera), '#' (obstacol, prin care focul nu se propaga) si '*' (celula cu foc; pot exista mai multe). La fiecare unitate de timp, focul se extinde simultan din toate celulele aprinse catre celulele libere vecine pe orizontala si verticala. Determinati timpul minim necesar pentru ca toate celulele libere accesibile sa fie cuprinse de foc, folosind un BFS multi-sursa pornind din toate celulele cu foc. Daca exista cel putin o celula libera care nu poate fi niciodata atinsa de foc, afisati -1.",
    input_format: IN_FMT_GRID,
    output_format: "Se afiseaza timpul minim (numarul de unitati de timp) necesar propagarii complete, sau -1 daca nu este posibila.",
    constraints: "1 <= n, m <= 30, exista cel putin o celula cu foc",
    hints: "Rulati un BFS multi-sursa pornind din toate celulele cu foc; timpul final este cea mai mare distanta calculata. Verificati separat daca a ramas vreo celula libera neatinsa.",
    explanation: "Se initializeaza coada cu toate celulele care au foc, avand distanta (timpul) 0, si se ruleaza o parcurgere Lee obisnuita, propagand focul catre celulele libere vecine neatinse. Timpul total de propagare este maximul distantelor calculate. Daca, dupa parcurgere, mai exista celule libere cu distanta -1 (neatinse), inseamna ca ele sunt izolate de obstacole si raspunsul este -1; altfel, raspunsul este timpul maxim gasit.\n\n**Complexitate:** O(n * m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<string> grid(n);
    for (auto &row : grid) cin >> row;
    vector<vector<int>> dist(n, vector<int>(m, -1));
    queue<pair<int,int>> q;
    for (int i=0;i<n;i++) for (int j=0;j<m;j++) if (grid[i][j]=='*') { dist[i][j]=0; q.push({i,j}); }
    int di[]={-1,1,0,0}, dj[]={0,0,-1,1};
    int maxTimp=0;
    while(!q.empty()) {
        auto [ci,cj]=q.front(); q.pop();
        maxTimp = max(maxTimp, dist[ci][cj]);
        for (int d=0; d<4; d++) {
            int ni=ci+di[d], nj=cj+dj[d];
            if (ni>=0&&ni<n&&nj>=0&&nj<m&&grid[ni][nj]=='.'&&dist[ni][nj]==-1) {
                dist[ni][nj]=dist[ci][cj]+1;
                q.push({ni,nj});
            }
        }
    }
    bool blocat = false;
    for (int i=0;i<n;i++) for (int j=0;j<m;j++) if (grid[i][j]=='.' && dist[i][j]==-1) blocat = true;
    cout << (blocat ? -1 : maxTimp) << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
grid = [input() for _ in range(n)]
dist = [[-1] * m for _ in range(n)]
q = deque()
for i in range(n):
    for j in range(m):
        if grid[i][j] == "*":
            dist[i][j] = 0
            q.append((i, j))
di = [-1, 1, 0, 0]
dj = [0, 0, -1, 1]
max_timp = 0
while q:
    ci, cj = q.popleft()
    max_timp = max(max_timp, dist[ci][cj])
    for d in range(4):
        ni, nj = ci + di[d], cj + dj[d]
        if 0 <= ni < n and 0 <= nj < m and grid[ni][nj] == "." and dist[ni][nj] == -1:
            dist[ni][nj] = dist[ci][cj] + 1
            q.append((ni, nj))
blocat = any(grid[i][j] == "." and dist[i][j] == -1 for i in range(n) for j in range(m))
print(-1 if blocat else max_timp)
`,
    tests: [
      "3 3\n*..\n...\n...",
      "3 3\n*.#\n.#.\n#..",
      "4 4\n*...\n....\n....\n....",
      "2 2\n*.\n..",
      "3 4\n*..*\n....\n....",
    ],
  },
  {
    slug: "lee-obstacol-distrus",
    title: "Drum minim cu posibilitatea de a distruge un singur obstacol",
    difficulty: "hard",
    tags: ["lee", "bfs", "coada", "labirint", "stare extinsa"],
    statement: "Se citeste o matrice reprezentand un labirint, la fel ca in problemele anterioare (caracterele '.', '#', 'S', 'F'). De aceasta data, aveti voie sa distrugeti cel mult un singur obstacol pe parcursul drumului (trecand astfel prin acea celula). Determinati, folosind algoritmul Lee extins cu o stare suplimentara (daca a fost deja folosita distrugerea), numarul minim de pasi din S in F. Daca F nu poate fi atins nici asa, afisati -1.",
    input_format: IN_FMT_GRID,
    output_format: "Se afiseaza numarul minim de pasi din S pana in F, folosind cel mult o distrugere de obstacol, sau -1.",
    constraints: "1 <= n, m <= 25, matricea contine exact o celula S si o celula F",
    hints: "Extindeti starea Lee cu o a treia dimensiune (0 sau 1), reprezentand daca distrugerea a fost deja folosita; dintr-o celula cu starea 0, se poate trece si printr-un obstacol, ajungand in starea 1 la celula respectiva.",
    explanation: "Se extinde algoritmul Lee cu o a treia dimensiune a starii: (linie, coloana, distrugere_folosita). Din starea (i, j, 0), se poate merge catre orice celula libera vecina, pastrand starea 0, sau catre o celula obstacol vecina, trecand in starea 1 (distrugerea a fost folosita). Din starea (i, j, 1), se poate merge doar catre celule libere vecine, pastrand starea 1. Raspunsul este minimul dintre distanta lui F in starea 0 si distanta lui F in starea 1 (daca sunt accesibile).\n\n**Complexitate:** O(n * m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<string> grid(n);
    for (auto &row : grid) cin >> row;
    int si=-1,sj=-1,fi=-1,fj=-1;
    for (int i=0;i<n;i++) for (int j=0;j<m;j++) {
        if (grid[i][j]=='S') { si=i; sj=j; }
        if (grid[i][j]=='F') { fi=i; fj=j; }
    }
    vector<vector<array<int,2>>> dist(n, vector<array<int,2>>(m, {-1,-1}));
    queue<tuple<int,int,int>> q;
    dist[si][sj][0]=0;
    q.push({si,sj,0});
    int di[]={-1,1,0,0}, dj[]={0,0,-1,1};
    while(!q.empty()) {
        auto [ci,cj,cb]=q.front(); q.pop();
        for (int d=0; d<4; d++) {
            int ni=ci+di[d], nj=cj+dj[d];
            if (ni<0||ni>=n||nj<0||nj>=m) continue;
            if (grid[ni][nj]!='#') {
                if (dist[ni][nj][cb]==-1) {
                    dist[ni][nj][cb]=dist[ci][cj][cb]+1;
                    q.push({ni,nj,cb});
                }
            } else if (cb==0) {
                if (dist[ni][nj][1]==-1) {
                    dist[ni][nj][1]=dist[ci][cj][cb]+1;
                    q.push({ni,nj,1});
                }
            }
        }
    }
    int rez = -1;
    if (dist[fi][fj][0]!=-1) rez = dist[fi][fj][0];
    if (dist[fi][fj][1]!=-1 && (rez==-1 || dist[fi][fj][1]<rez)) rez = dist[fi][fj][1];
    cout << rez << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
grid = [input() for _ in range(n)]
si = sj = fi = fj = -1
for i in range(n):
    for j in range(m):
        if grid[i][j] == "S":
            si, sj = i, j
        if grid[i][j] == "F":
            fi, fj = i, j
dist = [[[-1, -1] for _ in range(m)] for _ in range(n)]
dist[si][sj][0] = 0
q = deque([(si, sj, 0)])
di = [-1, 1, 0, 0]
dj = [0, 0, -1, 1]
while q:
    ci, cj, cb = q.popleft()
    for d in range(4):
        ni, nj = ci + di[d], cj + dj[d]
        if ni < 0 or ni >= n or nj < 0 or nj >= m:
            continue
        if grid[ni][nj] != "#":
            if dist[ni][nj][cb] == -1:
                dist[ni][nj][cb] = dist[ci][cj][cb] + 1
                q.append((ni, nj, cb))
        elif cb == 0:
            if dist[ni][nj][1] == -1:
                dist[ni][nj][1] = dist[ci][cj][cb] + 1
                q.append((ni, nj, 1))
rez = -1
if dist[fi][fj][0] != -1:
    rez = dist[fi][fj][0]
if dist[fi][fj][1] != -1 and (rez == -1 or dist[fi][fj][1] < rez):
    rez = dist[fi][fj][1]
print(rez)
`,
    tests: [
      "3 3\nS#.\n.#.\n.#F",
      "3 3\nS..\n.#.\n..F",
      "1 5\nS...F",
      "3 3\nS#.\n###\n.#F",
      "3 3\n.#F\n.#.\nS#.",
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
