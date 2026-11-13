const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade11", chapter: "backtracking", sub: "backtracking-plan" };

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

const BT_NOTE = "Rezolvati problema obligatoriu prin metoda Backtracking: construiti solutia pas cu pas, iar atunci cand solutia partiala nu mai poate fi extinsa sau este completa, reveniti (backtrack) si incercati o alta alegere.";

const problems = [
  // ===================== A. DRUMURI INTR-O MATRICE =====================
  {
    slug: "bt-numar-drumuri-matrice-simplu",
    title: "Numarul de drumuri intr-o matrice",
    difficulty: "easy",
    tags: ["backtracking", "matrice", "drumuri", "combinatorica"],
    statement: "Se citesc doua numere naturale n si m. Determinati, folosind metoda Backtracking, numarul de drumuri diferite de la celula (1,1) la celula (n,m) a unei matrice cu n linii si m coloane, stiind ca la fiecare pas ne putem deplasa fie o celula la dreapta, fie o celula in jos.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si m.",
    output_format: "Se afiseaza un singur numar: numarul de drumuri de la (1,1) la (n,m).",
    constraints: "1 <= n, m <= 12",
    hints: "Construiti drumul pas cu pas, pornind din (1,1): la fiecare celula, incercati sa va deplasati la dreapta (daca nu ati depasit coloana m) si in jos (daca nu ati depasit linia n). Cand ajungeti in (n,m), ati gasit un drum complet.",
    explanation: `${BT_NOTE} La fiecare celula exista cel mult doua alegeri (dreapta si jos); recursivitatea se opreste cand se ajunge in celula (n,m).\n\n**Complexitate:** O(2^(n+m))`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, m;
long long numar = 0;
void bkt(int i, int j) {
    if (i == n && j == m) { numar++; return; }
    if (i < n) bkt(i + 1, j);
    if (j < m) bkt(i, j + 1);
}
int main() {
    cin >> n >> m;
    bkt(1, 1);
    cout << numar << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

def bkt(i, j, n, m, stare):
    if i == n and j == m:
        stare[0] += 1
        return
    if i < n:
        bkt(i + 1, j, n, m, stare)
    if j < m:
        bkt(i, j + 1, n, m, stare)

n, m = map(int, input().split())
stare = [0]
bkt(1, 1, n, m, stare)
print(stare[0])
`,
    tests: ["2 2", "3 3", "4 5", "1 5", "5 1"],
  },
  {
    slug: "bt-numar-drumuri-matrice-obstacole",
    title: "Numarul de drumuri intr-o matrice cu obstacole",
    difficulty: "medium",
    tags: ["backtracking", "matrice", "drumuri", "combinatorica"],
    statement: "Se citesc doua numere naturale n si m, apoi o matrice cu n linii si m coloane, continand valori 0 (celula libera) sau 1 (obstacol). Determinati, folosind metoda Backtracking, numarul de drumuri de la celula (1,1) la celula (n,m), stiind ca la fiecare pas ne putem deplasa fie la dreapta, fie in jos, fara a trece prin celule obstacol.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza n linii, fiecare cu m valori (0 sau 1).",
    output_format: "Se afiseaza un singur numar: numarul de drumuri de la (1,1) la (n,m) care nu trec prin obstacole. Daca (1,1) sau (n,m) este obstacol, se afiseaza 0.",
    constraints: "1 <= n, m <= 12",
    hints: "La fel ca la problema fara obstacole, dar opriti imediat o ramura a backtrackingului daca celula curenta este obstacol.",
    explanation: `${BT_NOTE} Singura schimbare fata de varianta fara obstacole este verificarea, la intrarea in fiecare celula, ca aceasta nu este marcata drept obstacol.\n\n**Complexitate:** O(2^(n+m))`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, m;
int a[13][13];
long long numar = 0;
void bkt(int i, int j) {
    if (a[i][j] == 1) return;
    if (i == n && j == m) { numar++; return; }
    if (i < n) bkt(i + 1, j);
    if (j < m) bkt(i, j + 1);
}
int main() {
    cin >> n >> m;
    for (int i = 1; i <= n; i++) for (int j = 1; j <= m; j++) cin >> a[i][j];
    bkt(1, 1);
    cout << numar << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

def bkt(i, j, n, m, a, stare):
    if a[i][j] == 1:
        return
    if i == n and j == m:
        stare[0] += 1
        return
    if i < n:
        bkt(i + 1, j, n, m, a, stare)
    if j < m:
        bkt(i, j + 1, n, m, a, stare)

data = sys.stdin.read().split()
idx = 0
n = int(data[idx]); idx += 1
m = int(data[idx]); idx += 1
a = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    for j in range(1, m + 1):
        a[i][j] = int(data[idx]); idx += 1
stare = [0]
bkt(1, 1, n, m, a, stare)
print(stare[0])
`,
    tests: [
      "2 2\n0 0\n0 0",
      "3 3\n0 0 0\n0 1 0\n0 0 0",
      "3 3\n0 0 0\n1 1 0\n0 0 0",
      "2 3\n0 0 0\n0 0 0",
      "1 1\n0",
    ],
  },
  {
    slug: "bt-toate-drumurile-labirint",
    title: "Toate drumurile intr-un labirint",
    difficulty: "medium",
    tags: ["backtracking", "matrice", "labirint", "drumuri"],
    statement: "Se citesc doua numere naturale n si m, o matrice cu n linii si m coloane continand valori 0 (celula libera) sau 1 (obstacol), si coordonatele unei celule de start (si,sj) si ale unei celule de final (fi,fj). Generati, folosind metoda Backtracking, toate drumurile simple (fara a trece de doua ori prin aceeasi celula) de la start la final, deplasandu-va cu un pas in una din cele 4 directii (sus, jos, stanga, dreapta) intre celule libere.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza n linii, fiecare cu m valori (0 sau 1). Pe ultima linie se citesc si, sj, fi, fj.",
    output_format: "Se afiseaza toate drumurile gasite, cate unul pe linie, ca succesiune de coordonate 'linie,coloana' separate prin spatiu, in ordinea in care sunt generate incercand la fiecare pas directiile in ordinea: sus, jos, stanga, dreapta.",
    constraints: "1 <= n, m <= 4",
    hints: "Marcati celula curenta ca vizitata, incercati pe rand cele 4 directii catre o celula libera si nevizitata, apoi la revenire (backtrack) demarcati celula ca nevizitata. Cand ajungeti in celula finala, afisati drumul construit pana atunci.",
    explanation: `${BT_NOTE} Marcarea si demarcarea celulelor vizitate la avansare/revenire este esentiala pentru a genera doar drumuri simple (fara a trece de doua ori prin aceeasi celula).\n\n**Complexitate:** O(numarul de drumuri * (n*m))`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, m;
int a[6][6];
bool vizitat[6][6];
int si, sj, fi, fj;
vector<pair<int,int>> drum;
int dx[4] = {-1, 1, 0, 0};
int dy[4] = {0, 0, -1, 1};
void afiseaza() {
    for (size_t k = 0; k < drum.size(); k++) {
        cout << drum[k].first << "," << drum[k].second;
        if (k + 1 < drum.size()) cout << " ";
    }
    cout << "\\n";
}
void bkt(int i, int j) {
    if (i == fi && j == fj) { afiseaza(); return; }
    for (int d = 0; d < 4; d++) {
        int ni = i + dx[d], nj = j + dy[d];
        if (ni < 1 || ni > n || nj < 1 || nj > m) continue;
        if (a[ni][nj] == 1 || vizitat[ni][nj]) continue;
        vizitat[ni][nj] = true;
        drum.push_back({ni, nj});
        bkt(ni, nj);
        drum.pop_back();
        vizitat[ni][nj] = false;
    }
}
int main() {
    cin >> n >> m;
    for (int i = 1; i <= n; i++) for (int j = 1; j <= m; j++) cin >> a[i][j];
    cin >> si >> sj >> fi >> fj;
    vizitat[si][sj] = true;
    drum.push_back({si, sj});
    bkt(si, sj);
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

dx = [-1, 1, 0, 0]
dy = [0, 0, -1, 1]

def bkt(i, j, n, m, a, vizitat, fi, fj, drum, out):
    if i == fi and j == fj:
        out.append(' '.join(f"{p[0]},{p[1]}" for p in drum))
        return
    for d in range(4):
        ni, nj = i + dx[d], j + dy[d]
        if ni < 1 or ni > n or nj < 1 or nj > m:
            continue
        if a[ni][nj] == 1 or vizitat[ni][nj]:
            continue
        vizitat[ni][nj] = True
        drum.append((ni, nj))
        bkt(ni, nj, n, m, a, vizitat, fi, fj, drum, out)
        drum.pop()
        vizitat[ni][nj] = False

data = sys.stdin.read().split()
idx = 0
n = int(data[idx]); idx += 1
m = int(data[idx]); idx += 1
a = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    for j in range(1, m + 1):
        a[i][j] = int(data[idx]); idx += 1
si = int(data[idx]); idx += 1
sj = int(data[idx]); idx += 1
fi = int(data[idx]); idx += 1
fj = int(data[idx]); idx += 1
vizitat = [[False] * (m + 1) for _ in range(n + 1)]
vizitat[si][sj] = True
out = []
bkt(si, sj, n, m, a, vizitat, fi, fj, [(si, sj)], out)
print('\\n'.join(out))
`,
    tests: [
      "2 2\n0 0\n0 0\n1 1 2 2",
      "3 3\n0 0 0\n0 0 0\n0 0 0\n1 1 3 3",
      "3 3\n0 0 0\n0 1 0\n0 0 0\n1 1 3 3",
      "1 1\n0\n1 1 1 1",
      "4 1\n0\n0\n0\n0\n1 1 4 1",
    ],
  },
  {
    slug: "bt-lungime-minima-drum-backtracking",
    title: "Lungimea minima a unui drum, calculata prin Backtracking",
    difficulty: "medium",
    tags: ["backtracking", "matrice", "labirint", "drumuri", "optimizare"],
    statement: "Se citesc doua numere naturale n si m, o matrice cu n linii si m coloane continand valori 0 (celula libera) sau 1 (obstacol), si coordonatele unei celule de start (si,sj) si ale unei celule de final (fi,fj). Determinati, folosind metoda Backtracking (generand drumurile posibile si retinand cea mai mica lungime intalnita, fara a folosi parcurgerea in latime BFS), lungimea minima (numarul minim de pasi) a unui drum de la start la final, deplasandu-va cu un pas in una din cele 4 directii intre celule libere, fara a trece de doua ori prin aceeasi celula.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza n linii, fiecare cu m valori (0 sau 1). Pe ultima linie se citesc si, sj, fi, fj.",
    output_format: "Se afiseaza un singur numar: lungimea minima a unui drum de la start la final. Daca nu exista niciun drum, se afiseaza -1.",
    constraints: "1 <= n, m <= 6",
    hints: "Generati toate drumurile simple posibile (ca la problema anterioara), dar in loc sa le afisati, retineti cea mai mica lungime intalnita cand ajungeti la celula finala. Pentru eficienta, opriti o ramura imediat ce lungimea ei curenta atinge sau depaseste cea mai buna lungime gasita pana atunci.",
    explanation: `${BT_NOTE} Taierea ramurilor care nu mai pot imbunatati cel mai bun rezultat gasit pana atunci (lungime_curenta >= minimul gasit) este o optimizare tipica de backtracking, care reduce mult timpul de executie fara a afecta corectitudinea.\n\n**Complexitate:** O(numarul de drumuri simple * (n*m)) in cel mai defavorabil caz`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, m;
int a[7][7];
bool vizitat[7][7];
int si, sj, fi, fj;
int dx[4] = {-1, 1, 0, 0};
int dy[4] = {0, 0, -1, 1};
long long minim = -1;
void bkt(int i, int j, int lungime) {
    if (minim != -1 && lungime >= minim) return;
    if (i == fi && j == fj) {
        if (minim == -1 || lungime < minim) minim = lungime;
        return;
    }
    for (int d = 0; d < 4; d++) {
        int ni = i + dx[d], nj = j + dy[d];
        if (ni < 1 || ni > n || nj < 1 || nj > m) continue;
        if (a[ni][nj] == 1 || vizitat[ni][nj]) continue;
        vizitat[ni][nj] = true;
        bkt(ni, nj, lungime + 1);
        vizitat[ni][nj] = false;
    }
}
int main() {
    cin >> n >> m;
    for (int i = 1; i <= n; i++) for (int j = 1; j <= m; j++) cin >> a[i][j];
    cin >> si >> sj >> fi >> fj;
    vizitat[si][sj] = true;
    bkt(si, sj, 0);
    cout << minim << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

dx = [-1, 1, 0, 0]
dy = [0, 0, -1, 1]

def bkt(i, j, lungime, n, m, a, vizitat, fi, fj, stare):
    if stare[0] != -1 and lungime >= stare[0]:
        return
    if i == fi and j == fj:
        if stare[0] == -1 or lungime < stare[0]:
            stare[0] = lungime
        return
    for d in range(4):
        ni, nj = i + dx[d], j + dy[d]
        if ni < 1 or ni > n or nj < 1 or nj > m:
            continue
        if a[ni][nj] == 1 or vizitat[ni][nj]:
            continue
        vizitat[ni][nj] = True
        bkt(ni, nj, lungime + 1, n, m, a, vizitat, fi, fj, stare)
        vizitat[ni][nj] = False

data = sys.stdin.read().split()
idx = 0
n = int(data[idx]); idx += 1
m = int(data[idx]); idx += 1
a = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    for j in range(1, m + 1):
        a[i][j] = int(data[idx]); idx += 1
si = int(data[idx]); idx += 1
sj = int(data[idx]); idx += 1
fi = int(data[idx]); idx += 1
fj = int(data[idx]); idx += 1
vizitat = [[False] * (m + 1) for _ in range(n + 1)]
vizitat[si][sj] = True
stare = [-1]
bkt(si, sj, 0, n, m, a, vizitat, fi, fj, stare)
print(stare[0])
`,
    tests: [
      "2 2\n0 0\n0 0\n1 1 2 2",
      "3 3\n0 0 0\n0 0 0\n0 0 0\n1 1 3 3",
      "3 3\n0 0 0\n0 1 0\n0 0 0\n1 1 3 3",
      "3 3\n0 1 0\n1 1 0\n0 0 0\n1 1 3 3",
      "1 1\n0\n1 1 1 1",
    ],
  },
  {
    slug: "bt-drum-cost-minim-matrice",
    title: "Drumul de cost minim intr-o matrice",
    difficulty: "medium",
    tags: ["backtracking", "matrice", "drumuri", "optimizare"],
    statement: "Se citesc doua numere naturale n si m, apoi o matrice de costuri cu n linii si m coloane. Determinati, folosind metoda Backtracking, costul minim al unui drum de la celula (1,1) la celula (n,m), stiind ca la fiecare pas ne putem deplasa fie la dreapta, fie in jos, iar costul unui drum este suma costurilor tuturor celulelor vizitate (inclusiv (1,1) si (n,m)).",
    input_format: "Pe prima linie se citesc n si m. Urmeaza n linii, fiecare cu m valori intregi reprezentand costurile celulelor.",
    output_format: "Se afiseaza un singur numar: costul minim al unui drum de la (1,1) la (n,m).",
    constraints: "1 <= n, m <= 12, -1000 <= cost <= 1000",
    hints: "Generati toate drumurile posibile (dreapta/jos), mentinand costul acumulat pana la celula curenta, si retineti cel mai mic cost total intalnit atunci cand ajungeti in (n,m).",
    explanation: `${BT_NOTE} Costul partial se transmite ca parametru al recursiei; minimul se actualizeaza doar cand se ajunge efectiv in celula finala.\n\n**Complexitate:** O(2^(n+m))`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, m;
long long cost[13][13];
long long minim;
bool gasit = false;
void bkt(int i, int j, long long costCurent) {
    if (i == n && j == m) {
        if (!gasit || costCurent < minim) { minim = costCurent; gasit = true; }
        return;
    }
    if (i < n) bkt(i + 1, j, costCurent + cost[i + 1][j]);
    if (j < m) bkt(i, j + 1, costCurent + cost[i][j + 1]);
}
int main() {
    cin >> n >> m;
    for (int i = 1; i <= n; i++) for (int j = 1; j <= m; j++) cin >> cost[i][j];
    bkt(1, 1, cost[1][1]);
    cout << minim << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

def bkt(i, j, costCurent, n, m, cost, stare):
    if i == n and j == m:
        if not stare['gasit'] or costCurent < stare['minim']:
            stare['minim'] = costCurent
            stare['gasit'] = True
        return
    if i < n:
        bkt(i + 1, j, costCurent + cost[i + 1][j], n, m, cost, stare)
    if j < m:
        bkt(i, j + 1, costCurent + cost[i][j + 1], n, m, cost, stare)

data = sys.stdin.read().split()
idx = 0
n = int(data[idx]); idx += 1
m = int(data[idx]); idx += 1
cost = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    for j in range(1, m + 1):
        cost[i][j] = int(data[idx]); idx += 1
stare = {'gasit': False, 'minim': 0}
bkt(1, 1, cost[1][1], n, m, cost, stare)
print(stare['minim'])
`,
    tests: [
      "2 2\n1 2\n3 4",
      "3 3\n1 3 1\n1 5 1\n4 2 1",
      "2 3\n1 1 1\n1 1 1",
      "1 1\n7",
      "3 1\n2\n2\n2",
    ],
  },
  {
    slug: "bt-numar-drumuri-lungime-k",
    title: "Numarul de drumuri de lungime data intre doua celule",
    difficulty: "medium",
    tags: ["backtracking", "matrice", "drumuri", "combinatorica"],
    statement: "Se citesc doua numere naturale n si m, o matrice cu n linii si m coloane continand valori 0 (celula libera) sau 1 (obstacol), coordonatele unei celule de start (si,sj), ale unei celule de final (fi,fj), si un numar natural k. Determinati, folosind metoda Backtracking, numarul de drumuri de lungime exact k (exact k pasi) de la start la final, deplasandu-va cu un pas in una din cele 4 directii intre celule libere (o celula poate fi vizitata de mai multe ori in acelasi drum).",
    input_format: "Pe prima linie se citesc n si m. Urmeaza n linii, fiecare cu m valori (0 sau 1). Pe ultima linie se citesc si, sj, fi, fj, k.",
    output_format: "Se afiseaza un singur numar: numarul de drumuri de lungime exact k de la start la final.",
    constraints: "1 <= n, m <= 6, 0 <= k <= 8",
    hints: "Construiti drumul pas cu pas; opriti-va (verificati daca ati ajuns la celula finala) exact dupa k pasi. Spre deosebire de problemele anterioare, aici NU marcati celulele ca vizitate, deoarece o celula poate fi traversata de mai multe ori.",
    explanation: `${BT_NOTE} Deoarece se numara drumuri de o lungime FIXA (nu neaparat simple), nu este nevoie sa interzicem revizitarea celulelor; recursivitatea se opreste dupa exact k pasi, moment in care se verifica daca ne aflam in celula finala.\n\n**Complexitate:** O(4^k)`,
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, m, k;
int a[7][7];
int si, sj, fi, fj;
int dx[4] = {-1, 1, 0, 0};
int dy[4] = {0, 0, -1, 1};
long long numar = 0;
void bkt(int i, int j, int pasi) {
    if (pasi == k) {
        if (i == fi && j == fj) numar++;
        return;
    }
    for (int d = 0; d < 4; d++) {
        int ni = i + dx[d], nj = j + dy[d];
        if (ni < 1 || ni > n || nj < 1 || nj > m) continue;
        if (a[ni][nj] == 1) continue;
        bkt(ni, nj, pasi + 1);
    }
}
int main() {
    cin >> n >> m;
    for (int i = 1; i <= n; i++) for (int j = 1; j <= m; j++) cin >> a[i][j];
    cin >> si >> sj >> fi >> fj >> k;
    bkt(si, sj, 0);
    cout << numar << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

dx = [-1, 1, 0, 0]
dy = [0, 0, -1, 1]

def bkt(i, j, pasi, k, n, m, a, fi, fj, stare):
    if pasi == k:
        if i == fi and j == fj:
            stare[0] += 1
        return
    for d in range(4):
        ni, nj = i + dx[d], j + dy[d]
        if ni < 1 or ni > n or nj < 1 or nj > m:
            continue
        if a[ni][nj] == 1:
            continue
        bkt(ni, nj, pasi + 1, k, n, m, a, fi, fj, stare)

data = sys.stdin.read().split()
idx = 0
n = int(data[idx]); idx += 1
m = int(data[idx]); idx += 1
a = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    for j in range(1, m + 1):
        a[i][j] = int(data[idx]); idx += 1
si = int(data[idx]); idx += 1
sj = int(data[idx]); idx += 1
fi = int(data[idx]); idx += 1
fj = int(data[idx]); idx += 1
k = int(data[idx]); idx += 1
stare = [0]
bkt(si, sj, 0, k, n, m, a, fi, fj, stare)
print(stare[0])
`,
    tests: [
      "3 3\n0 0 0\n0 0 0\n0 0 0\n1 1 3 3 4",
      "2 2\n0 0\n0 0\n1 1 2 2 2",
      "3 3\n0 0 0\n0 0 0\n0 0 0\n1 1 1 1 2",
      "3 3\n0 1 0\n0 0 0\n0 0 0\n1 1 3 3 4",
      "2 2\n0 0\n0 0\n1 1 2 2 3",
    ],
  },
  {
    slug: "bt-cel-mai-lung-drum-simplu",
    title: "Cel mai lung drum simplu intre doua celule",
    difficulty: "hard",
    tags: ["backtracking", "matrice", "drumuri", "optimizare"],
    statement: "Se citesc doua numere naturale n si m, o matrice cu n linii si m coloane continand valori 0 (celula libera) sau 1 (obstacol), si coordonatele unei celule de start (si,sj) si ale unei celule de final (fi,fj). Determinati, folosind metoda Backtracking, lungimea celui mai lung drum SIMPLU (fara a trece de doua ori prin aceeasi celula) de la start la final, deplasandu-va cu un pas in una din cele 4 directii intre celule libere.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza n linii, fiecare cu m valori (0 sau 1). Pe ultima linie se citesc si, sj, fi, fj.",
    output_format: "Se afiseaza un singur numar: lungimea (numarul de pasi) celui mai lung drum simplu de la start la final. Daca nu exista niciun drum, se afiseaza -1.",
    constraints: "1 <= n, m <= 4",
    hints: "La fel ca la lungimea minima, dar retineti cea mai mare lungime intalnita in loc de cea mai mica; aici nu se poate opri o ramura mai devreme pe baza celui mai bun rezultat gasit, deoarece cautam maximul.",
    explanation: `${BT_NOTE} Spre deosebire de problema lungimii minime, aici nu exista o taiere similara bazata pe rezultatul optim gasit pana atunci (orice drum partial ar putea, teoretic, deveni cel mai lung), deci se exploreaza efectiv toate drumurile simple posibile.\n\n**Complexitate:** O(numarul de drumuri simple * (n*m))`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, m;
int a[5][5];
bool vizitat[5][5];
int si, sj, fi, fj;
int dx[4] = {-1, 1, 0, 0};
int dy[4] = {0, 0, -1, 1};
long long maxim = -1;
void bkt(int i, int j, int lungime) {
    if (i == fi && j == fj) {
        if (lungime > maxim) maxim = lungime;
        return;
    }
    for (int d = 0; d < 4; d++) {
        int ni = i + dx[d], nj = j + dy[d];
        if (ni < 1 || ni > n || nj < 1 || nj > m) continue;
        if (a[ni][nj] == 1 || vizitat[ni][nj]) continue;
        vizitat[ni][nj] = true;
        bkt(ni, nj, lungime + 1);
        vizitat[ni][nj] = false;
    }
}
int main() {
    cin >> n >> m;
    for (int i = 1; i <= n; i++) for (int j = 1; j <= m; j++) cin >> a[i][j];
    cin >> si >> sj >> fi >> fj;
    vizitat[si][sj] = true;
    bkt(si, sj, 0);
    cout << maxim << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

dx = [-1, 1, 0, 0]
dy = [0, 0, -1, 1]

def bkt(i, j, lungime, n, m, a, vizitat, fi, fj, stare):
    if i == fi and j == fj:
        if lungime > stare[0]:
            stare[0] = lungime
        return
    for d in range(4):
        ni, nj = i + dx[d], j + dy[d]
        if ni < 1 or ni > n or nj < 1 or nj > m:
            continue
        if a[ni][nj] == 1 or vizitat[ni][nj]:
            continue
        vizitat[ni][nj] = True
        bkt(ni, nj, lungime + 1, n, m, a, vizitat, fi, fj, stare)
        vizitat[ni][nj] = False

data = sys.stdin.read().split()
idx = 0
n = int(data[idx]); idx += 1
m = int(data[idx]); idx += 1
a = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    for j in range(1, m + 1):
        a[i][j] = int(data[idx]); idx += 1
si = int(data[idx]); idx += 1
sj = int(data[idx]); idx += 1
fi = int(data[idx]); idx += 1
fj = int(data[idx]); idx += 1
vizitat = [[False] * (m + 1) for _ in range(n + 1)]
vizitat[si][sj] = True
stare = [-1]
bkt(si, sj, 0, n, m, a, vizitat, fi, fj, stare)
print(stare[0])
`,
    tests: [
      "2 2\n0 0\n0 0\n1 1 2 2",
      "3 3\n0 0 0\n0 0 0\n0 0 0\n1 1 3 3",
      "3 3\n0 0 0\n0 1 0\n0 0 0\n1 1 3 3",
      "1 1\n0\n1 1 1 1",
      "3 3\n0 1 0\n1 1 0\n0 0 0\n1 1 3 3",
    ],
  },

  // ===================== B. SUDOKU =====================
  {
    slug: "bt-rezolva-sudoku-9x9",
    title: "Rezolvarea unui Sudoku 9x9",
    difficulty: "hard",
    tags: ["backtracking", "sudoku", "matrice"],
    statement: "Se citeste o grila Sudoku 9x9, partial completata (0 inseamna celula libera, iar o valoare de la 1 la 9 inseamna o cifra deja fixata). Rezolvati grila, folosind metoda Backtracking, astfel incat fiecare linie, fiecare coloana si fiecare careu 3x3 (dintre cele 9 careuri ale grilei) sa contina fiecare cifra de la 1 la 9 exact o data.",
    input_format: "Se citesc 9 linii, fiecare cu 9 valori (0-9), reprezentand grila initiala.",
    output_format: "Se afiseaza grila completata, 9 linii cu cate 9 valori separate prin spatiu.",
    constraints: "Grila are 9x9 celule si este garantat rezolvabila.",
    hints: "Parcurgeti celulele in ordine (linie cu linie); pentru fiecare celula libera, incercati pe rand cifrele de la 1 la 9 si verificati daca cifra respecta regulile (nu mai apare pe linie, pe coloana sau in careul 3x3 curent). Daca o alegere duce la un blocaj mai departe, reveniti si incercati urmatoarea cifra.",
    explanation: `${BT_NOTE} Sudoku este un exemplu clasic de problema de satisfacere a constrangerilor rezolvata prin backtracking: se incearca fiecare cifra posibila pentru fiecare celula libera, iar recursivitatea se opreste la prima solutie completa gasita.\n\n**Complexitate:** O(9^(numarul de celule libere)) in cel mai defavorabil caz`,
    time_limit_ms: 5000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int grila[9][9];
bool valid(int lin, int col, int val) {
    for (int i = 0; i < 9; i++) {
        if (grila[lin][i] == val) return false;
        if (grila[i][col] == val) return false;
    }
    int lb = (lin / 3) * 3, cb = (col / 3) * 3;
    for (int i = 0; i < 3; i++)
        for (int j = 0; j < 3; j++)
            if (grila[lb + i][cb + j] == val) return false;
    return true;
}
bool bkt(int poz) {
    if (poz == 81) return true;
    int lin = poz / 9, col = poz % 9;
    if (grila[lin][col] != 0) return bkt(poz + 1);
    for (int val = 1; val <= 9; val++) {
        if (valid(lin, col, val)) {
            grila[lin][col] = val;
            if (bkt(poz + 1)) return true;
            grila[lin][col] = 0;
        }
    }
    return false;
}
int main() {
    for (int i = 0; i < 9; i++) for (int j = 0; j < 9; j++) cin >> grila[i][j];
    bkt(0);
    for (int i = 0; i < 9; i++) {
        for (int j = 0; j < 9; j++) cout << grila[i][j] << (j + 1 < 9 ? ' ' : '\\n');
    }
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

def valid(grila, lin, col, val):
    for i in range(9):
        if grila[lin][i] == val:
            return False
        if grila[i][col] == val:
            return False
    lb, cb = (lin // 3) * 3, (col // 3) * 3
    for i in range(3):
        for j in range(3):
            if grila[lb + i][cb + j] == val:
                return False
    return True

def bkt(poz, grila):
    if poz == 81:
        return True
    lin, col = poz // 9, poz % 9
    if grila[lin][col] != 0:
        return bkt(poz + 1, grila)
    for val in range(1, 10):
        if valid(grila, lin, col, val):
            grila[lin][col] = val
            if bkt(poz + 1, grila):
                return True
            grila[lin][col] = 0
    return False

data = sys.stdin.read().split()
grila = [[int(data[i * 9 + j]) for j in range(9)] for i in range(9)]
bkt(0, grila)
out = []
for i in range(9):
    out.append(' '.join(map(str, grila[i])))
print('\\n'.join(out))
`,
    tests: [
      "5 0 4 6 0 8 9 0 2\n0 7 2 0 9 5 0 4 8\n1 9 0 3 4 0 5 6 0\n8 0 9 7 0 1 4 0 3\n0 2 6 0 5 3 0 9 1\n7 1 0 9 2 0 8 5 0\n9 0 1 5 0 7 2 8 4\n2 8 7 4 1 9 6 3 5\n3 4 5 2 8 6 1 7 9",
      "5 3 0 6 7 0 9 1 2\n6 0 2 1 0 5 3 4 8\n1 9 8 0 4 2 0 6 7\n0 5 9 7 6 0 4 2 3\n4 2 6 8 0 3 7 0 1\n7 1 0 9 2 4 8 5 0\n9 6 1 0 3 7 2 8 4\n0 8 7 4 1 9 6 0 5\n3 4 5 2 8 0 1 7 9",
      "0 3 4 6 0 8 9 1 2\n6 7 0 1 9 5 0 4 8\n1 9 8 3 0 2 5 0 7\n8 0 9 7 6 1 0 2 3\n4 2 6 0 5 3 7 9 0\n7 0 3 9 2 0 8 5 6\n9 6 0 5 3 7 2 0 4\n2 8 7 0 1 9 6 3 0\n0 4 5 2 0 6 1 7 9",
      "5 3 4 0 7 8 9 1 2\n6 7 2 1 9 5 3 0 8\n0 9 8 3 4 2 5 6 7\n8 5 0 7 6 1 4 2 3\n4 2 6 8 5 0 7 9 1\n7 1 3 0 2 4 8 5 6\n9 6 1 5 0 7 2 8 4\n2 8 7 4 1 9 0 3 5\n3 4 5 2 8 6 1 0 9",
      "5 3 4 6 7 8 9 1 2\n6 7 2 1 9 5 3 4 8\n1 9 8 3 4 2 5 6 7\n8 5 9 7 6 1 4 2 3\n4 2 6 8 5 3 7 9 1\n7 1 3 9 2 4 8 5 6\n9 6 1 5 3 7 2 8 4\n2 8 7 4 1 9 6 3 5\n0 0 0 0 0 0 0 0 0",
    ],
  },
  {
    slug: "bt-rezolva-sudoku-4x4",
    title: "Rezolvarea unui Sudoku 4x4",
    difficulty: "medium",
    tags: ["backtracking", "sudoku", "matrice"],
    statement: "Se citeste o grila Sudoku 4x4, partial completata (0 inseamna celula libera, iar o valoare de la 1 la 4 inseamna o cifra deja fixata). Rezolvati grila, folosind metoda Backtracking, astfel incat fiecare linie, fiecare coloana si fiecare careu 2x2 sa contina fiecare cifra de la 1 la 4 exact o data.",
    input_format: "Se citesc 4 linii, fiecare cu 4 valori (0-4), reprezentand grila initiala.",
    output_format: "Se afiseaza grila completata, 4 linii cu cate 4 valori separate prin spatiu.",
    constraints: "Grila are 4x4 celule si este garantat rezolvabila.",
    hints: "Aceeasi tehnica ca la Sudoku 9x9, adaptata la dimensiunea 4x4 (cifre de la 1 la 4, careuri de 2x2).",
    explanation: `${BT_NOTE} Este o varianta redusa a problemei Sudoku 9x9, utila pentru a intelege mai usor tehnica inainte de a o aplica la grila completa.\n\n**Complexitate:** O(4^(numarul de celule libere)) in cel mai defavorabil caz`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int grila[4][4];
bool valid(int lin, int col, int val) {
    for (int i = 0; i < 4; i++) {
        if (grila[lin][i] == val) return false;
        if (grila[i][col] == val) return false;
    }
    int lb = (lin / 2) * 2, cb = (col / 2) * 2;
    for (int i = 0; i < 2; i++)
        for (int j = 0; j < 2; j++)
            if (grila[lb + i][cb + j] == val) return false;
    return true;
}
bool bkt(int poz) {
    if (poz == 16) return true;
    int lin = poz / 4, col = poz % 4;
    if (grila[lin][col] != 0) return bkt(poz + 1);
    for (int val = 1; val <= 4; val++) {
        if (valid(lin, col, val)) {
            grila[lin][col] = val;
            if (bkt(poz + 1)) return true;
            grila[lin][col] = 0;
        }
    }
    return false;
}
int main() {
    for (int i = 0; i < 4; i++) for (int j = 0; j < 4; j++) cin >> grila[i][j];
    bkt(0);
    for (int i = 0; i < 4; i++) {
        for (int j = 0; j < 4; j++) cout << grila[i][j] << (j + 1 < 4 ? ' ' : '\\n');
    }
    return 0;
}
`,
    py: `def valid(grila, lin, col, val):
    for i in range(4):
        if grila[lin][i] == val:
            return False
        if grila[i][col] == val:
            return False
    lb, cb = (lin // 2) * 2, (col // 2) * 2
    for i in range(2):
        for j in range(2):
            if grila[lb + i][cb + j] == val:
                return False
    return True

def bkt(poz, grila):
    if poz == 16:
        return True
    lin, col = poz // 4, poz % 4
    if grila[lin][col] != 0:
        return bkt(poz + 1, grila)
    for val in range(1, 5):
        if valid(grila, lin, col, val):
            grila[lin][col] = val
            if bkt(poz + 1, grila):
                return True
            grila[lin][col] = 0
    return False

import sys
data = sys.stdin.read().split()
grila = [[int(data[i * 4 + j]) for j in range(4)] for i in range(4)]
bkt(0, grila)
out = []
for i in range(4):
    out.append(' '.join(map(str, grila[i])))
print('\\n'.join(out))
`,
    tests: [
      "1 0 3 4\n3 4 1 0\n0 1 4 3\n4 3 0 1",
      "0 2 3 4\n3 0 1 2\n2 1 0 3\n4 3 2 0",
      "1 2 0 0\n3 4 1 2\n2 1 4 3\n0 0 2 1",
      "0 0 0 4\n3 4 1 2\n2 1 4 3\n4 3 2 1",
      "1 2 3 4\n3 4 1 2\n2 1 4 3\n4 3 2 0",
    ],
  },
  {
    slug: "bt-numara-solutii-sudoku",
    title: "Numarul de solutii ale unui Sudoku",
    difficulty: "hard",
    tags: ["backtracking", "sudoku", "matrice", "numarare"],
    statement: "Se citeste o grila Sudoku 9x9, partial completata (0 inseamna celula libera). Determinati, folosind metoda Backtracking, in cate moduri diferite poate fi completata grila astfel incat fiecare linie, fiecare coloana si fiecare careu 3x3 sa contina fiecare cifra de la 1 la 9 exact o data.",
    input_format: "Se citesc 9 linii, fiecare cu 9 valori (0-9), reprezentand grila initiala.",
    output_format: "Se afiseaza un singur numar: numarul de completari valide ale grilei.",
    constraints: "Grila are 9x9 celule si are un numar mic de celule libere (deci un numar mic de completari posibile).",
    hints: "Folositi acelasi backtracking ca la rezolvarea Sudoku-ului, dar, spre deosebire de rezolvare (care se opreste la prima solutie gasita), continuati cautarea in toate ramurile pentru a numara toate solutiile complete.",
    explanation: `${BT_NOTE} Diferenta esentiala fata de simpla rezolvare este ca aici NU ne oprim la prima solutie gasita: continuam explorarea tuturor alegerilor posibile pentru a numara toate completarile valide. O grila Sudoku cu suficient de multe cifre date are, de regula, o singura solutie, dar algoritmul functioneaza corect indiferent de numarul real de solutii.\n\n**Complexitate:** O(9^(numarul de celule libere)) in cel mai defavorabil caz`,
    time_limit_ms: 5000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int grila[9][9];
long long numar = 0;
bool valid(int lin, int col, int val) {
    for (int i = 0; i < 9; i++) {
        if (grila[lin][i] == val) return false;
        if (grila[i][col] == val) return false;
    }
    int lb = (lin / 3) * 3, cb = (col / 3) * 3;
    for (int i = 0; i < 3; i++)
        for (int j = 0; j < 3; j++)
            if (grila[lb + i][cb + j] == val) return false;
    return true;
}
void bkt(int poz) {
    if (poz == 81) { numar++; return; }
    int lin = poz / 9, col = poz % 9;
    if (grila[lin][col] != 0) { bkt(poz + 1); return; }
    for (int val = 1; val <= 9; val++) {
        if (valid(lin, col, val)) {
            grila[lin][col] = val;
            bkt(poz + 1);
            grila[lin][col] = 0;
        }
    }
}
int main() {
    for (int i = 0; i < 9; i++) for (int j = 0; j < 9; j++) cin >> grila[i][j];
    bkt(0);
    cout << numar << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

def valid(grila, lin, col, val):
    for i in range(9):
        if grila[lin][i] == val:
            return False
        if grila[i][col] == val:
            return False
    lb, cb = (lin // 3) * 3, (col // 3) * 3
    for i in range(3):
        for j in range(3):
            if grila[lb + i][cb + j] == val:
                return False
    return True

def bkt(poz, grila, stare):
    if poz == 81:
        stare[0] += 1
        return
    lin, col = poz // 9, poz % 9
    if grila[lin][col] != 0:
        bkt(poz + 1, grila, stare)
        return
    for val in range(1, 10):
        if valid(grila, lin, col, val):
            grila[lin][col] = val
            bkt(poz + 1, grila, stare)
            grila[lin][col] = 0

data = sys.stdin.read().split()
grila = [[int(data[i * 9 + j]) for j in range(9)] for i in range(9)]
stare = [0]
bkt(0, grila, stare)
print(stare[0])
`,
    tests: [
      "0 3 4 6 7 8 9 1 2\n6 7 2 1 9 5 3 4 8\n1 9 8 3 4 2 5 6 7\n8 5 9 7 6 1 4 2 3\n4 2 6 8 5 3 7 9 1\n7 1 3 9 2 4 8 5 6\n9 6 1 5 3 7 2 8 4\n2 8 7 4 1 9 6 3 5\n3 4 5 2 8 6 1 7 9",
      "0 3 4 6 7 8 9 1 2\n6 0 2 1 9 5 3 4 8\n1 9 8 3 4 2 5 6 7\n8 5 9 7 6 1 4 2 3\n4 2 6 8 5 3 7 9 1\n7 1 3 9 2 4 8 5 6\n9 6 1 5 3 7 2 8 4\n2 8 7 4 1 9 6 3 5\n3 4 5 2 8 6 1 7 9",
      "5 3 4 6 7 8 9 1 2\n6 7 2 1 9 5 3 4 8\n1 9 8 3 4 2 5 6 7\n8 5 9 7 6 1 4 2 3\n0 2 6 8 5 3 7 9 1\n7 1 3 9 2 4 8 5 6\n9 6 1 5 3 7 2 8 4\n2 8 7 4 1 9 6 3 5\n3 4 5 2 8 6 1 7 0",
      "0 3 0 6 0 8 9 1 2\n6 7 2 1 9 5 3 4 8\n1 9 8 3 4 2 5 6 7\n8 5 9 7 6 1 4 2 3\n4 2 6 8 5 3 7 9 1\n7 1 3 9 2 4 8 5 6\n9 6 1 5 3 7 2 8 4\n2 8 7 4 1 9 6 3 5\n3 4 5 2 8 6 1 7 9",
      "5 3 4 6 7 8 9 1 2\n6 7 2 1 9 5 3 4 8\n1 9 8 3 4 2 5 6 7\n8 5 9 7 6 1 4 2 3\n4 2 6 8 5 3 7 9 1\n7 1 3 9 2 4 8 5 6\n9 6 1 5 3 7 2 8 4\n2 8 7 4 1 9 6 3 5\n3 4 5 2 8 6 1 0 9",
    ],
  },

  // ===================== C. TURUL CALULUI =====================
  {
    slug: "bt-tur-cal-deschis",
    title: "Turul deschis al calului",
    difficulty: "hard",
    tags: ["backtracking", "calul", "matrice"],
    statement: "Se citesc un numar natural n (dimensiunea unei table de sah n x n) si coordonatele unei celule de start (si,sj). Determinati, folosind metoda Backtracking, un traseu al calului (mutari in forma literei L, ca la sah) care sa viziteze fiecare celula a tablei exact o data, pornind din celula data (turul deschis al calului: nu este obligatoriu sa se poata reveni la celula de start).",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n, si si sj.",
    output_format: "Daca exista un astfel de traseu, se afiseaza succesiunea celor n*n celule vizitate, ca perechi 'linie,coloana' separate prin spatiu. Altfel se afiseaza NU EXISTA.",
    constraints: "5 <= n <= 8",
    hints: "La fiecare pas, dintre cele cel mult 8 mutari posibile ale calului catre celule nevizitate aflate pe tabla, alegeti mai intai celula cu cele mai putine mutari ulterioare posibile (regula lui Warnsdorff) — aceasta euristica de ordonare a alegerilor in backtracking reduce drastic numarul de reveniri necesare pentru a gasi un traseu complet.",
    explanation: `${BT_NOTE} Fara nicio euristica de ordonare, backtrackingul pentru turul calului poate deveni foarte lent chiar si pe table de dimensiuni moderate. Regula lui Warnsdorff (alege, dintre mutarile posibile, cea care duce la celula cu cele mai putine continuari posibile) este o euristica de ordonare a alegerilor — nu schimba corectitudinea algoritmului de backtracking, doar face ca prima solutie sa fie gasita mult mai repede.\n\n**Complexitate:** exponentiala in cazul cel mai defavorabil, dar foarte rapida in practica cu euristica lui Warnsdorff`,
    time_limit_ms: 4000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
bool vizitat[10][10];
vector<pair<int,int>> drum;
int dx[8] = {-2,-2,-1,-1,1,1,2,2};
int dy[8] = {-1,1,-2,2,-2,2,-1,1};
int gradAcces(int x, int y) {
    int g = 0;
    for (int d = 0; d < 8; d++) {
        int nx = x + dx[d], ny = y + dy[d];
        if (nx >= 1 && nx <= n && ny >= 1 && ny <= n && !vizitat[nx][ny]) g++;
    }
    return g;
}
bool bkt(int x, int y) {
    if ((int)drum.size() == n * n) return true;
    vector<tuple<int,int,int>> candidati;
    for (int d = 0; d < 8; d++) {
        int nx = x + dx[d], ny = y + dy[d];
        if (nx >= 1 && nx <= n && ny >= 1 && ny <= n && !vizitat[nx][ny]) {
            candidati.push_back({gradAcces(nx, ny), nx, ny});
        }
    }
    sort(candidati.begin(), candidati.end());
    for (auto& c : candidati) {
        int nx = get<1>(c), ny = get<2>(c);
        vizitat[nx][ny] = true;
        drum.push_back({nx, ny});
        if (bkt(nx, ny)) return true;
        drum.pop_back();
        vizitat[nx][ny] = false;
    }
    return false;
}
int main() {
    int si, sj;
    cin >> n >> si >> sj;
    vizitat[si][sj] = true;
    drum.push_back({si, sj});
    bool ok = bkt(si, sj);
    if (!ok) { cout << "NU EXISTA\\n"; return 0; }
    for (size_t i = 0; i < drum.size(); i++) {
        cout << drum[i].first << "," << drum[i].second;
        if (i + 1 < drum.size()) cout << " ";
    }
    cout << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

dx = [-2, -2, -1, -1, 1, 1, 2, 2]
dy = [-1, 1, -2, 2, -2, 2, -1, 1]

def gradAcces(x, y, n, vizitat):
    g = 0
    for d in range(8):
        nx, ny = x + dx[d], y + dy[d]
        if 1 <= nx <= n and 1 <= ny <= n and not vizitat[nx][ny]:
            g += 1
    return g

def bkt(x, y, n, vizitat, drum):
    if len(drum) == n * n:
        return True
    candidati = []
    for d in range(8):
        nx, ny = x + dx[d], y + dy[d]
        if 1 <= nx <= n and 1 <= ny <= n and not vizitat[nx][ny]:
            candidati.append((gradAcces(nx, ny, n, vizitat), nx, ny))
    candidati.sort()
    for g, nx, ny in candidati:
        vizitat[nx][ny] = True
        drum.append((nx, ny))
        if bkt(nx, ny, n, vizitat, drum):
            return True
        drum.pop()
        vizitat[nx][ny] = False
    return False

n, si, sj = map(int, sys.stdin.readline().split())
vizitat = [[False] * (n + 1) for _ in range(n + 1)]
vizitat[si][sj] = True
drum = [(si, sj)]
ok = bkt(si, sj, n, vizitat, drum)
if not ok:
    print("NU EXISTA")
else:
    print(' '.join(f"{p[0]},{p[1]}" for p in drum))
`,
    tests: ["5 1 1", "6 1 1", "7 1 1", "8 1 1", "6 3 4"],
  },
  {
    slug: "bt-tur-cal-tabla-dreptunghiulara",
    title: "Turul calului pe o tabla dreptunghiulara",
    difficulty: "hard",
    tags: ["backtracking", "calul", "matrice"],
    statement: "Se citesc doua numere naturale n si m (dimensiunile unei table cu n linii si m coloane) si coordonatele unei celule de start (si,sj). Determinati, folosind metoda Backtracking, un traseu al calului care sa viziteze fiecare celula a tablei exact o data, pornind din celula data. Nu toate tablele dreptunghiulare admit un astfel de traseu.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n, m, si si sj.",
    output_format: "Daca exista un astfel de traseu, se afiseaza succesiunea celor n*m celule vizitate, ca perechi 'linie,coloana' separate prin spatiu. Altfel se afiseaza NU EXISTA.",
    constraints: "3 <= n, m <= 8, n * m <= 48",
    hints: "Aceeasi tehnica ca la turul calului pe tabla patrata (backtracking cu euristica lui Warnsdorff pentru alegerea ordinii mutarilor), doar ca limitele tablei difera pe linii (n) si coloane (m).",
    explanation: `${BT_NOTE} Algoritmul este identic cu cel de la tabla patrata; se schimba doar limitele de validitate ale coordonatelor (linia intre 1 si n, coloana intre 1 si m). Este cunoscut faptul ca unele table dreptunghiulare (de exemplu cele cu 3 linii si putine coloane) nu admit niciun tur al calului.\n\n**Complexitate:** exponentiala in cazul cel mai defavorabil, dar foarte rapida in practica cu euristica lui Warnsdorff`,
    time_limit_ms: 4000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, m;
bool vizitat[10][10];
vector<pair<int,int>> drum;
int dx[8] = {-2,-2,-1,-1,1,1,2,2};
int dy[8] = {-1,1,-2,2,-2,2,-1,1};
int gradAcces(int x, int y) {
    int g = 0;
    for (int d = 0; d < 8; d++) {
        int nx = x + dx[d], ny = y + dy[d];
        if (nx >= 1 && nx <= n && ny >= 1 && ny <= m && !vizitat[nx][ny]) g++;
    }
    return g;
}
bool bkt(int x, int y) {
    if ((int)drum.size() == n * m) return true;
    vector<tuple<int,int,int>> candidati;
    for (int d = 0; d < 8; d++) {
        int nx = x + dx[d], ny = y + dy[d];
        if (nx >= 1 && nx <= n && ny >= 1 && ny <= m && !vizitat[nx][ny]) {
            candidati.push_back({gradAcces(nx, ny), nx, ny});
        }
    }
    sort(candidati.begin(), candidati.end());
    for (auto& c : candidati) {
        int nx = get<1>(c), ny = get<2>(c);
        vizitat[nx][ny] = true;
        drum.push_back({nx, ny});
        if (bkt(nx, ny)) return true;
        drum.pop_back();
        vizitat[nx][ny] = false;
    }
    return false;
}
int main() {
    int si, sj;
    cin >> n >> m >> si >> sj;
    vizitat[si][sj] = true;
    drum.push_back({si, sj});
    bool ok = bkt(si, sj);
    if (!ok) { cout << "NU EXISTA\\n"; return 0; }
    for (size_t i = 0; i < drum.size(); i++) {
        cout << drum[i].first << "," << drum[i].second;
        if (i + 1 < drum.size()) cout << " ";
    }
    cout << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

dx = [-2, -2, -1, -1, 1, 1, 2, 2]
dy = [-1, 1, -2, 2, -2, 2, -1, 1]

def gradAcces(x, y, n, m, vizitat):
    g = 0
    for d in range(8):
        nx, ny = x + dx[d], y + dy[d]
        if 1 <= nx <= n and 1 <= ny <= m and not vizitat[nx][ny]:
            g += 1
    return g

def bkt(x, y, n, m, vizitat, drum):
    if len(drum) == n * m:
        return True
    candidati = []
    for d in range(8):
        nx, ny = x + dx[d], y + dy[d]
        if 1 <= nx <= n and 1 <= ny <= m and not vizitat[nx][ny]:
            candidati.append((gradAcces(nx, ny, n, m, vizitat), nx, ny))
    candidati.sort()
    for g, nx, ny in candidati:
        vizitat[nx][ny] = True
        drum.append((nx, ny))
        if bkt(nx, ny, n, m, vizitat, drum):
            return True
        drum.pop()
        vizitat[nx][ny] = False
    return False

n, m, si, sj = map(int, sys.stdin.readline().split())
vizitat = [[False] * (m + 1) for _ in range(n + 1)]
vizitat[si][sj] = True
drum = [(si, sj)]
ok = bkt(si, sj, n, m, vizitat, drum)
if not ok:
    print("NU EXISTA")
else:
    print(' '.join(f"{p[0]},{p[1]}" for p in drum))
`,
    tests: ["3 4 1 1", "4 5 1 1", "5 6 1 1", "6 6 2 2", "3 10 1 1"],
  },
  {
    slug: "bt-numar-mutari-cal-k-pasi",
    title: "Numarul de drumuri ale calului de lungime data intre doua celule",
    difficulty: "hard",
    tags: ["backtracking", "calul", "matrice", "combinatorica"],
    statement: "Se citesc un numar natural n (dimensiunea unei table de sah n x n), coordonatele unei celule de start (si,sj), coordonatele unei celule destinatie (fi,fj) si un numar natural k. Determinati, folosind metoda Backtracking, in cate moduri diferite poate ajunge un cal (mutari in forma literei L, ca la sah) din celula de start in celula destinatie folosind exact k mutari (aceeasi celula poate fi vizitata de mai multe ori in acelasi traseu).",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n, si, sj, fi, fj si k.",
    output_format: "Se afiseaza un singur numar: numarul de traiectorii ale calului de lungime exact k de la (si,sj) la (fi,fj).",
    constraints: "1 <= n <= 8, 0 <= k <= 6",
    hints: "Construiti traiectoria mutare cu mutare. La fiecare pas incercati, pe rand, toate cele cel mult 8 mutari posibile ale calului care raman pe tabla. Dupa exact k mutari, verificati daca v-ati oprit in celula destinatie.",
    explanation: `${BT_NOTE} Deoarece se cere o lungime FIXA a traiectoriei (nu un traseu simplu care sa nu repete celule), nu este nevoie de niciun vector de celule vizitate: aceeasi celula poate fi traversata de mai multe ori. Recursivitatea se opreste dupa exact k mutari, moment in care se verifica daca pozitia curenta coincide cu destinatia.\n\n**Complexitate:** O(8^k)`,
    time_limit_ms: 2500,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, k;
int si, sj, fi, fj;
int dx[8] = {-2,-2,-1,-1,1,1,2,2};
int dy[8] = {-1,1,-2,2,-2,2,-1,1};
long long numar = 0;
void bkt(int x, int y, int pas) {
    if (pas == k) {
        if (x == fi && y == fj) numar++;
        return;
    }
    for (int d = 0; d < 8; d++) {
        int nx = x + dx[d], ny = y + dy[d];
        if (nx >= 1 && nx <= n && ny >= 1 && ny <= n) bkt(nx, ny, pas + 1);
    }
}
int main() {
    cin >> n >> si >> sj >> fi >> fj >> k;
    bkt(si, sj, 0);
    cout << numar << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

dx = [-2, -2, -1, -1, 1, 1, 2, 2]
dy = [-1, 1, -2, 2, -2, 2, -1, 1]

def bkt(x, y, pas, n, k, fi, fj, stare):
    if pas == k:
        if x == fi and y == fj:
            stare[0] += 1
        return
    for d in range(8):
        nx, ny = x + dx[d], y + dy[d]
        if 1 <= nx <= n and 1 <= ny <= n:
            bkt(nx, ny, pas + 1, n, k, fi, fj, stare)

n, si, sj, fi, fj, k = map(int, sys.stdin.readline().split())
stare = [0]
bkt(si, sj, 0, n, k, fi, fj, stare)
print(stare[0])
`,
    tests: ["8 1 1 3 2 3", "8 4 4 4 4 2", "8 1 1 8 8 6", "5 1 1 5 5 4", "6 3 3 3 3 2"],
  },

  // ===================== D. ALTE PROBLEME IN PLAN =====================
  {
    slug: "bt-regine-genereaza",
    title: "Problema celor n regine",
    difficulty: "medium",
    tags: ["backtracking", "regine", "matrice"],
    statement: "Se citeste un numar natural n. Generati, folosind metoda Backtracking, toate modurile de a aseza n regine pe o tabla de sah n x n astfel incat oricare doua regine sa nu se atace reciproc (sa nu se afle pe aceeasi linie, aceeasi coloana sau aceeasi diagonala).",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza toate solutiile, cate una pe linie: pentru fiecare solutie se afiseaza cele n numere de coloana ocupate de regine (regina de pe linia i se afla pe coloana a[i]), separate prin spatiu, in ordinea in care sunt generate (linie cu linie, coloane incercate in ordine crescatoare).",
    constraints: "1 <= n <= 9",
    hints: "Asezati regina linie cu linie. Pentru fiecare linie, incercati pe rand coloanele de la 1 la n si verificati daca regina ar intra in conflict (aceeasi coloana sau aceeasi diagonala) cu o regina asezata deja pe o linie anterioara.",
    explanation: `${BT_NOTE} Retinerea coloanelor si diagonalelor deja ocupate (folosind vectori booleeni indexati dupa coloana, respectiv dupa suma si diferenta liniei si coloanei) permite verificarea rapida a conflictelor la fiecare alegere.\n\n**Complexitate:** O(n!) in cel mai defavorabil caz`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
int col[10];
bool colFolosit[10], diag1[20], diag2[20];
void afiseaza() {
    for (int i = 1; i <= n; i++) cout << col[i] << (i < n ? ' ' : '\\n');
}
void bkt(int linie) {
    if (linie == n + 1) { afiseaza(); return; }
    for (int c = 1; c <= n; c++) {
        if (!colFolosit[c] && !diag1[linie + c] && !diag2[linie - c + n]) {
            colFolosit[c] = diag1[linie + c] = diag2[linie - c + n] = true;
            col[linie] = c;
            bkt(linie + 1);
            colFolosit[c] = diag1[linie + c] = diag2[linie - c + n] = false;
        }
    }
}
int main() {
    cin >> n;
    bkt(1);
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

def bkt(linie, n, col, colFolosit, diag1, diag2, out):
    if linie == n + 1:
        out.append(' '.join(str(col[i]) for i in range(1, n + 1)))
        return
    for c in range(1, n + 1):
        if not colFolosit[c] and not diag1[linie + c] and not diag2[linie - c + n]:
            colFolosit[c] = diag1[linie + c] = diag2[linie - c + n] = True
            col[linie] = c
            bkt(linie + 1, n, col, colFolosit, diag1, diag2, out)
            colFolosit[c] = diag1[linie + c] = diag2[linie - c + n] = False

n = int(sys.stdin.readline())
col = [0] * (n + 1)
colFolosit = [False] * (n + 1)
diag1 = [False] * (2 * n + 1)
diag2 = [False] * (2 * n + 1)
out = []
bkt(1, n, col, colFolosit, diag1, diag2, out)
print('\\n'.join(out))
`,
    tests: ["1", "4", "5", "6", "8"],
  },
  {
    slug: "bt-regine-numara",
    title: "Numarul de solutii ale problemei celor n regine",
    difficulty: "medium",
    tags: ["backtracking", "regine", "matrice", "numarare"],
    statement: "Se citeste un numar natural n. Determinati, folosind metoda Backtracking, in cate moduri se pot aseza n regine pe o tabla de sah n x n astfel incat oricare doua regine sa nu se atace reciproc.",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza un singur numar: numarul de asezari valide ale celor n regine.",
    constraints: "1 <= n <= 12",
    hints: "Folositi acelasi backtracking ca la generarea solutiilor problemei reginelor, dar numarati solutiile complete in loc sa le afisati.",
    explanation: `${BT_NOTE} Se numara solutiile complete obtinute cu aceleasi restrictii (coloana, diagonala principala, diagonala secundara) ca la problema de generare.\n\n**Complexitate:** O(n!) in cel mai defavorabil caz`,
    time_limit_ms: 3000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n;
bool colFolosit[13], diag1[26], diag2[26];
long long numar = 0;
void bkt(int linie) {
    if (linie == n + 1) { numar++; return; }
    for (int c = 1; c <= n; c++) {
        if (!colFolosit[c] && !diag1[linie + c] && !diag2[linie - c + n]) {
            colFolosit[c] = diag1[linie + c] = diag2[linie - c + n] = true;
            bkt(linie + 1);
            colFolosit[c] = diag1[linie + c] = diag2[linie - c + n] = false;
        }
    }
}
int main() {
    cin >> n;
    bkt(1);
    cout << numar << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

def bkt(linie, n, colFolosit, diag1, diag2, stare):
    if linie == n + 1:
        stare[0] += 1
        return
    for c in range(1, n + 1):
        if not colFolosit[c] and not diag1[linie + c] and not diag2[linie - c + n]:
            colFolosit[c] = diag1[linie + c] = diag2[linie - c + n] = True
            bkt(linie + 1, n, colFolosit, diag1, diag2, stare)
            colFolosit[c] = diag1[linie + c] = diag2[linie - c + n] = False

n = int(sys.stdin.readline())
colFolosit = [False] * (n + 1)
diag1 = [False] * (2 * n + 1)
diag2 = [False] * (2 * n + 1)
stare = [0]
bkt(1, n, colFolosit, diag1, diag2, stare)
print(stare[0])
`,
    tests: ["1", "4", "6", "8", "10"],
  },
  {
    slug: "bt-cautare-cuvant-grila",
    title: "Cautarea unui cuvant intr-o grila de litere",
    difficulty: "medium",
    tags: ["backtracking", "matrice", "siruri"],
    statement: "Se citesc doua numere naturale n si m, o grila de n linii si m coloane cu litere mari, si un cuvant. Determinati, folosind metoda Backtracking, daca cuvantul se poate forma pornind de la o celula a grilei si deplasandu-va, la fiecare pas, la o celula adiacenta (sus, jos, stanga sau dreapta), fara a folosi aceeasi celula de doua ori, astfel incat literele intalnite, in ordine, sa formeze exact cuvantul dat.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza n linii, fiecare cu un sir de m litere mari (fara spatii). Pe ultima linie se citeste cuvantul cautat.",
    output_format: "Se afiseaza DA daca cuvantul poate fi format, respectiv NU in caz contrar.",
    constraints: "1 <= n, m <= 10, 1 <= lungimea cuvantului <= 12",
    hints: "Incercati fiecare celula a grilei a carei litera coincide cu prima litera a cuvantului drept punct de plecare. Din fiecare astfel de celula, cautati recursiv, prin backtracking, litera urmatoare printre vecinii nevizitati.",
    explanation: `${BT_NOTE} Cautarea se opreste imediat ce s-a gasit un drum valid care formeaza intregul cuvant, incercand pe rand toate celulele de start posibile si, din fiecare, toate directiile posibile.\n\n**Complexitate:** O(n * m * 4^lungime_cuvant) in cel mai defavorabil caz`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, m;
char grila[11][11];
bool vizitat[11][11];
string cuvant;
int dx[4] = {-1, 1, 0, 0};
int dy[4] = {0, 0, -1, 1};
bool bkt(int x, int y, int poz) {
    if (poz == (int)cuvant.size()) return true;
    for (int d = 0; d < 4; d++) {
        int nx = x + dx[d], ny = y + dy[d];
        if (nx >= 1 && nx <= n && ny >= 1 && ny <= m && !vizitat[nx][ny] && grila[nx][ny] == cuvant[poz]) {
            vizitat[nx][ny] = true;
            if (bkt(nx, ny, poz + 1)) return true;
            vizitat[nx][ny] = false;
        }
    }
    return false;
}
int main() {
    cin >> n >> m;
    for (int i = 1; i <= n; i++) {
        string r; cin >> r;
        for (int j = 1; j <= m; j++) grila[i][j] = r[j - 1];
    }
    cin >> cuvant;
    bool gasit = false;
    for (int i = 1; i <= n && !gasit; i++) {
        for (int j = 1; j <= m && !gasit; j++) {
            if (grila[i][j] == cuvant[0]) {
                vizitat[i][j] = true;
                if (bkt(i, j, 1)) gasit = true;
                vizitat[i][j] = false;
            }
        }
    }
    cout << (gasit ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

dx = [-1, 1, 0, 0]
dy = [0, 0, -1, 1]

def bkt(x, y, poz, n, m, grila, vizitat, cuvant):
    if poz == len(cuvant):
        return True
    for d in range(4):
        nx, ny = x + dx[d], y + dy[d]
        if 1 <= nx <= n and 1 <= ny <= m and not vizitat[nx][ny] and grila[nx][ny] == cuvant[poz]:
            vizitat[nx][ny] = True
            if bkt(nx, ny, poz + 1, n, m, grila, vizitat, cuvant):
                return True
            vizitat[nx][ny] = False
    return False

data = sys.stdin.read().split()
idx = 0
n = int(data[idx]); idx += 1
m = int(data[idx]); idx += 1
grila = [[''] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    r = data[idx]; idx += 1
    for j in range(1, m + 1):
        grila[i][j] = r[j - 1]
cuvant = data[idx]
vizitat = [[False] * (m + 1) for _ in range(n + 1)]
gasit = False
for i in range(1, n + 1):
    if gasit:
        break
    for j in range(1, m + 1):
        if gasit:
            break
        if grila[i][j] == cuvant[0]:
            vizitat[i][j] = True
            if bkt(i, j, 1, n, m, grila, vizitat, cuvant):
                gasit = True
            vizitat[i][j] = False
print("DA" if gasit else "NU")
`,
    tests: [
      "3 4\nABCE\nSFCS\nADEE\nABCCED",
      "3 4\nABCE\nSFCS\nADEE\nSEE",
      "2 2\nAB\nCD\nAC",
      "1 4\nABCD\nABC",
      "2 2\nAA\nAA\nAAAA",
    ],
  },
  {
    slug: "bt-acoperire-domino",
    title: "Numarul de acoperiri cu piese domino",
    difficulty: "hard",
    tags: ["backtracking", "matrice", "acoperire", "numarare"],
    statement: "Se citesc doua numere naturale n si m, apoi o matrice cu n linii si m coloane continand valori 0 (celula libera) sau 1 (celula blocata). Determinati, folosind metoda Backtracking, numarul de moduri in care celulele libere pot fi acoperite complet cu piese domino de dimensiune 1x2 (orizontale sau verticale), fara suprapuneri si fara a acoperi celule blocate.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza n linii, fiecare cu m valori (0 sau 1).",
    output_format: "Se afiseaza un singur numar: numarul de acoperiri complete posibile. Daca numarul de celule libere este impar, raspunsul este 0.",
    constraints: "1 <= n, m <= 5",
    hints: "Gasiti, in ordinea liniilor si coloanelor, prima celula libera neacoperita inca. Incercati sa o acoperiti impreuna cu vecinul din dreapta (daca este liber si neacoperit) sau cu vecinul de dedesubt (daca este liber si neacoperit), continuand recursiv; daca niciuna dintre variante nu este posibila, aceasta ramura nu duce la nicio acoperire completa.",
    explanation: `${BT_NOTE} Cautand mereu prima celula neacoperita (in ordinea liniilor), fiecare acoperire completa este numarata o singura data, deoarece la fiecare pas exista o alegere unica de 'prima celula ramasa de acoperit'.\n\n**Complexitate:** O(2^(n*m)) in cel mai defavorabil caz`,
    time_limit_ms: 3000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, m;
int a[6][6];
bool acoperit[6][6];
long long numar = 0;
void bkt() {
    int fi = -1, fj = -1;
    for (int i = 1; i <= n && fi == -1; i++) {
        for (int j = 1; j <= m; j++) {
            if (a[i][j] == 0 && !acoperit[i][j]) { fi = i; fj = j; break; }
        }
    }
    if (fi == -1) { numar++; return; }
    if (fj + 1 <= m && a[fi][fj + 1] == 0 && !acoperit[fi][fj + 1]) {
        acoperit[fi][fj] = acoperit[fi][fj + 1] = true;
        bkt();
        acoperit[fi][fj] = acoperit[fi][fj + 1] = false;
    }
    if (fi + 1 <= n && a[fi + 1][fj] == 0 && !acoperit[fi + 1][fj]) {
        acoperit[fi][fj] = acoperit[fi + 1][fj] = true;
        bkt();
        acoperit[fi][fj] = acoperit[fi + 1][fj] = false;
    }
}
int main() {
    cin >> n >> m;
    for (int i = 1; i <= n; i++) for (int j = 1; j <= m; j++) cin >> a[i][j];
    bkt();
    cout << numar << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

def bkt(n, m, a, acoperit, stare):
    fi, fj = -1, -1
    for i in range(1, n + 1):
        if fi != -1:
            break
        for j in range(1, m + 1):
            if a[i][j] == 0 and not acoperit[i][j]:
                fi, fj = i, j
                break
    if fi == -1:
        stare[0] += 1
        return
    if fj + 1 <= m and a[fi][fj + 1] == 0 and not acoperit[fi][fj + 1]:
        acoperit[fi][fj] = acoperit[fi][fj + 1] = True
        bkt(n, m, a, acoperit, stare)
        acoperit[fi][fj] = acoperit[fi][fj + 1] = False
    if fi + 1 <= n and a[fi + 1][fj] == 0 and not acoperit[fi + 1][fj]:
        acoperit[fi][fj] = acoperit[fi + 1][fj] = True
        bkt(n, m, a, acoperit, stare)
        acoperit[fi][fj] = acoperit[fi + 1][fj] = False

data = sys.stdin.read().split()
idx = 0
n = int(data[idx]); idx += 1
m = int(data[idx]); idx += 1
a = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    for j in range(1, m + 1):
        a[i][j] = int(data[idx]); idx += 1
acoperit = [[False] * (m + 1) for _ in range(n + 1)]
stare = [0]
bkt(n, m, a, acoperit, stare)
print(stare[0])
`,
    tests: [
      "2 2\n0 0\n0 0",
      "2 3\n0 0 0\n0 0 0",
      "3 3\n0 0 0\n0 1 0\n0 0 0",
      "4 4\n0 0 0 0\n0 0 0 0\n0 0 0 0\n0 0 0 0",
      "5 1\n0\n0\n0\n0\n0",
    ],
  },
  {
    slug: "bt-labirint-iesiri-multiple",
    title: "Labirint cu iesiri multiple",
    difficulty: "medium",
    tags: ["backtracking", "matrice", "labirint"],
    statement: "Se citesc doua numere naturale n si m, o matrice cu n linii si m coloane continand valori 0 (celula libera) sau 1 (obstacol), si coordonatele unei celule de start (si,sj). Determinati, folosind metoda Backtracking, la cate celule aflate pe marginea matricei (prima linie, ultima linie, prima coloana sau ultima coloana) se poate ajunge din celula de start, deplasandu-va la fiecare pas la o celula adiacenta (sus, jos, stanga sau dreapta) libera. O celula se numara o singura data, indiferent de cate drumuri exista catre ea.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza n linii, fiecare cu m valori (0 sau 1). Pe ultima linie se citesc si si sj.",
    output_format: "Se afiseaza un singur numar: cate celule de pe marginea matricei sunt accesibile din celula de start.",
    constraints: "1 <= n, m <= 20",
    hints: "Marcati celula de start ca vizitata, apoi vizitati recursiv (prin backtracking) toti vecinii liberi si nevizitati, marcandu-i la randul lor ca vizitati (fara a le demarca la revenire, deoarece de aceasta data ne intereseaza multimea celulelor accesibile, nu drumurile individuale). La final, numarati celulele vizitate aflate pe marginea matricei.",
    explanation: `${BT_NOTE} Spre deosebire de problemele de numarare/generare a drumurilor, aici nu se demarcheaza celulele vizitate la revenire, deoarece scopul este determinarea MULTIMII celulelor accesibile (fiecare conteaza o singura data), nu enumerarea drumurilor catre ele.\n\n**Complexitate:** O(n*m)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int n, m;
int a[21][21];
bool vizitat[21][21];
int dx[4] = {-1, 1, 0, 0};
int dy[4] = {0, 0, -1, 1};
void bkt(int x, int y) {
    vizitat[x][y] = true;
    for (int d = 0; d < 4; d++) {
        int nx = x + dx[d], ny = y + dy[d];
        if (nx >= 1 && nx <= n && ny >= 1 && ny <= m && !vizitat[nx][ny] && a[nx][ny] == 0) {
            bkt(nx, ny);
        }
    }
}
int main() {
    cin >> n >> m;
    for (int i = 1; i <= n; i++) for (int j = 1; j <= m; j++) cin >> a[i][j];
    int si, sj; cin >> si >> sj;
    bkt(si, sj);
    int numar = 0;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (vizitat[i][j] && (i == 1 || i == n || j == 1 || j == m)) numar++;
        }
    }
    cout << numar << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

dx = [-1, 1, 0, 0]
dy = [0, 0, -1, 1]

def bkt(x, y, n, m, a, vizitat):
    vizitat[x][y] = True
    for d in range(4):
        nx, ny = x + dx[d], y + dy[d]
        if 1 <= nx <= n and 1 <= ny <= m and not vizitat[nx][ny] and a[nx][ny] == 0:
            bkt(nx, ny, n, m, a, vizitat)

data = sys.stdin.read().split()
idx = 0
n = int(data[idx]); idx += 1
m = int(data[idx]); idx += 1
a = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    for j in range(1, m + 1):
        a[i][j] = int(data[idx]); idx += 1
si = int(data[idx]); idx += 1
sj = int(data[idx]); idx += 1
vizitat = [[False] * (m + 1) for _ in range(n + 1)]
bkt(si, sj, n, m, a, vizitat)
numar = 0
for i in range(1, n + 1):
    for j in range(1, m + 1):
        if vizitat[i][j] and (i == 1 or i == n or j == 1 or j == m):
            numar += 1
print(numar)
`,
    tests: [
      "3 3\n0 0 0\n0 0 0\n0 0 0\n2 2",
      "3 3\n0 1 0\n1 1 1\n0 1 0\n1 1",
      "4 4\n0 0 0 0\n0 1 1 0\n0 1 1 0\n0 0 0 0\n1 1",
      "1 5\n0 0 0 0 0\n1 3",
      "5 5\n0 0 0 0 0\n0 1 1 1 0\n0 1 0 1 0\n0 1 1 1 0\n0 0 0 0 0\n3 3",
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
