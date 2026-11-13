const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "concursuri", chapter: "concurs-mi-ub-2025", sub: "probleme-2025" };

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
  // ================= P1 (orig Q1): PIN inclusion-exclusion =================
  {
    slug: "concurs-mi-ub-2025-cod-pin",
    title: "Concurs MI UB 2025 - Codul PIN uitat",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2025", "combinatorica"],
    statement:
      "Mara are un seif care se deschide cu un cod PIN format din exact L cifre, urmate obligatoriu de apasarea unei taste de confirmare fixate dinainte (aceeasi tasta poate sau nu sa apara si in cod). Examinand seiful, Mara observa ca exista amprente doar pe un set de D taste distincte (numerotate de la 1 la D), una dintre ele fiind chiar tasta de confirmare (a D-a, singura care poate proveni doar din apasarea de confirmare). Deoarece codul contine doar cifre corespunzatoare tastelor cu amprenta, iar tastele diferite de cea de confirmare nu au alt motiv sa fi fost apasate, ele trebuie sa apara fiecare cel putin o data in cod. Determinati numarul maxim de combinatii distincte pe care Mara ar trebui sa le incerce.",
    input_format: "Se citesc pe o singura linie doua numere intregi D si L, separate prin spatiu.",
    output_format:
      "Se afiseaza un singur numar intreg: numarul de siruri de lungime L formate cu cele D simboluri, in care fiecare dintre primele D-1 simboluri (cele diferite de tasta de confirmare) apare cel putin o data.",
    constraints: "2 <= D <= 9, 1 <= L <= 18",
    hints:
      "Foloseste principiul includerii-excluderii: din totalul D^L de siruri de lungime L, scazi/aduni pe rand sirurile in care lipsesc anumite submultimi dintre cele D-1 simboluri obligatorii.",
    explanation:
      "Reluam exact rationamentul oficial: totalul sirurilor de lungime L peste un alfabet de D simboluri este D^L. Dintre cele D-1 simboluri obligatorii, pentru fiecare submultime de j simboluri care lipsesc complet din sir, raman D-j simboluri posibile, deci exista C(D-1,j)*(D-j)^L astfel de siruri. Prin principiul includerii-excluderii, raspunsul este suma alternanta: sum_{j=0}^{D-1} (-1)^j * C(D-1,j) * (D-j)^L. Implementarea calculeaza binomialele C(D-1,j) prin triunghiul lui Pascal (D-1 <= 8, deci trivial) si puterea (D-j)^L printr-un simplu produs repetat, valoarea maxima D^L ramanand sub 9^18, deci in limitele lui long long.\n\n**Complexitate:** O(D^2 + D*L).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long D, L;
    cin >> D >> L;
    int n = (int)(D - 1);
    vector<vector<long long>> pas(n + 1, vector<long long>(n + 1, 0));
    for (int i = 0; i <= n; i++) {
        pas[i][0] = 1;
        for (int k = 1; k <= i; k++) pas[i][k] = pas[i - 1][k - 1] + pas[i - 1][k];
    }
    long long ans = 0;
    for (int j = 0; j <= n; j++) {
        long long base = D - j;
        long long p = 1;
        for (int e = 0; e < L; e++) p *= base;
        long long term = pas[n][j] * p;
        if (j % 2 == 0) ans += term; else ans -= term;
    }
    cout << ans << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    D, L = map(int, sys.stdin.read().split())
    n = D - 1
    pas = [[0] * (n + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        pas[i][0] = 1
        for k in range(1, i + 1):
            pas[i][k] = pas[i - 1][k - 1] + pas[i - 1][k]
    ans = 0
    for j in range(n + 1):
        base = D - j
        p = base ** L
        term = pas[n][j] * p
        ans += term if j % 2 == 0 else -term
    print(ans)

main()
`,
    tests: ["4 5", "2 1", "9 1", "3 6", "9 18"],
  },

  // ================= P2 (orig Q2): Eulerian pattern-lock check =================
  {
    slug: "concurs-mi-ub-2025-pattern-lock-eulerian",
    title: "Concurs MI UB 2025 - Pattern-lock eulerian",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2025", "grafuri"],
    statement:
      "Un pattern de deblocare deseneaza pe un ecran cateva segmente intre puncte, respectand urmatoarele reguli: poate porni din orice punct, foloseste doar segmentele desenate, fiecare segment este parcurs cel mult o data, traseul se incheie in punctul de plecare si degetul nu se ridica de pe ecran pe tot parcursul. Se dau T candidati (desene), fiecare descris printr-o multime de puncte si segmente (muchii) intre ele. Pentru fiecare candidat trebuie determinat daca segmentele lui pot fi parcurse printr-un astfel de traseu (un circuit eulerian pe graful format de segmentele desenate, ignorand punctele izolate). Determinati pentru cati dintre cei T candidati acest lucru este posibil.",
    input_format:
      "Pe prima linie se citeste T, numarul de candidati. Pentru fiecare candidat se citesc pe o linie doua numere P si E (numarul de puncte, respectiv de segmente), urmate de E linii, fiecare continand doua numere u v (1-indexate) reprezentand un segment intre punctele u si v.",
    output_format: "Se afiseaza un singur numar intreg: numarul de candidati pentru care exista un traseu valid.",
    constraints: "1 <= T <= 10, 2 <= P <= 15, 1 <= E <= P*(P-1)/2, fiecare segment apare o singura data",
    hints:
      "Un circuit eulerian exista daca si numai daca toate punctele folosite (cu grad nenul) au grad par si apartin aceleiasi componente conexe.",
    explanation:
      "Reluam exact criteriul din explicatia oficiala: segmentele desenate formeaza un circuit eulerian daca si numai daca (1) toate punctele cu cel putin un segment incident apartin aceleiasi componente conexe si (2) fiecare astfel de punct are grad par. Implementarea calculeaza gradul fiecarui punct si foloseste o structura de multimi disjuncte (union-find) pentru a verifica daca toate punctele cu grad nenul se afla in aceeasi componenta.\n\n**Complexitate:** O(T*(P+E)) cu union-find aproape liniar.",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int par[20];
int find(int x) { return par[x] == x ? x : par[x] = find(par[x]); }
void uni(int a, int b) { a = find(a); b = find(b); if (a != b) par[a] = b; }
int main() {
    int T; cin >> T;
    int validCount = 0;
    for (int t = 0; t < T; t++) {
        int P, E; cin >> P >> E;
        vector<int> deg(P + 1, 0);
        for (int i = 1; i <= P; i++) par[i] = i;
        for (int i = 0; i < E; i++) {
            int u, v; cin >> u >> v;
            deg[u]++; deg[v]++;
            uni(u, v);
        }
        bool ok = (E > 0);
        int root = -1;
        for (int i = 1; i <= P && ok; i++) {
            if (deg[i] > 0) {
                if (deg[i] % 2 != 0) { ok = false; break; }
                int r = find(i);
                if (root == -1) root = r;
                else if (root != r) { ok = false; break; }
            }
        }
        if (ok) validCount++;
    }
    cout << validCount << "\\n";
    return 0;
}
`,
    py: `import sys

def find(par, x):
    while par[x] != x:
        par[x] = par[par[x]]
        x = par[x]
    return x

def main():
    data = sys.stdin.read().split()
    idx = 0
    T = int(data[idx]); idx += 1
    valid_count = 0
    for _ in range(T):
        P = int(data[idx]); idx += 1
        E = int(data[idx]); idx += 1
        deg = [0] * (P + 1)
        par = list(range(P + 1))
        for _ in range(E):
            u = int(data[idx]); idx += 1
            v = int(data[idx]); idx += 1
            deg[u] += 1; deg[v] += 1
            ru, rv = find(par, u), find(par, v)
            if ru != rv:
                par[ru] = rv
        ok = E > 0
        root = -1
        for i in range(1, P + 1):
            if not ok:
                break
            if deg[i] > 0:
                if deg[i] % 2 != 0:
                    ok = False
                    break
                r = find(par, i)
                if root == -1:
                    root = r
                elif root != r:
                    ok = False
                    break
        if ok:
            valid_count += 1
    print(valid_count)

main()
`,
    tests: [
      "3\n3 3\n1 2\n2 3\n3 1\n3 2\n1 2\n2 3\n6 6\n1 2\n2 3\n3 1\n4 5\n5 6\n6 4\n",
      "4\n4 4\n1 2\n2 3\n3 4\n4 1\n4 6\n1 2\n1 3\n1 4\n2 3\n2 4\n3 4\n5 6\n1 2\n2 3\n3 1\n1 4\n4 5\n5 1\n2 1\n1 2\n",
      "6\n3 3\n1 2\n2 3\n3 1\n5 6\n1 2\n2 3\n3 1\n1 4\n4 5\n5 1\n4 4\n1 2\n2 3\n3 4\n4 1\n3 2\n1 2\n2 3\n4 6\n1 2\n1 3\n1 4\n2 3\n2 4\n3 4\n6 6\n1 2\n2 3\n3 1\n4 5\n5 6\n6 4\n",
      "2\n3 3\n1 2\n2 3\n3 1\n4 3\n1 2\n1 3\n1 4\n",
      "5\n10 10\n1 2\n2 3\n3 4\n4 5\n5 6\n6 7\n7 8\n8 9\n9 10\n10 1\n10 9\n1 2\n2 3\n3 4\n4 5\n5 6\n6 7\n7 8\n8 9\n9 10\n4 6\n1 2\n1 3\n1 4\n2 3\n2 4\n3 4\n6 6\n1 2\n2 3\n3 1\n4 5\n5 6\n6 4\n4 4\n1 2\n2 3\n3 1\n3 4\n",
    ],
  },

  // ================= P3 (orig Q3): Clipboard length simulation =================
  {
    slug: "concurs-mi-ub-2025-clipboard",
    title: "Concurs MI UB 2025 - Simulare clipboard",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2025", "simulare"],
    statement:
      "Mara porneste de la un text de lungime N si aplica o succesiune de M operatii asupra lui, folosind un clipboard (zona temporara de memorie). Fiecare operatie este de unul din urmatoarele doua tipuri: 'C' - se selecteaza tot textul curent si se copiaza in clipboard (continutul din clipboard devine egal cu lungimea curenta a textului); 'V' - se insereaza (lipeste) la finalul textului curent continutul din clipboard (clipboard-ul nu se goleste dupa lipire). Determinati lungimea finala a textului dupa aplicarea celor M operatii in ordine.",
    input_format:
      "Pe prima linie se citesc doua numere N si M. Pe a doua linie se citesc M cuvinte, fiecare fiind 'C' sau 'V', reprezentand operatiile in ordine.",
    output_format: "Se afiseaza un singur numar intreg: lungimea finala a textului.",
    constraints: "1 <= N <= 1000, 1 <= M <= 40",
    hints:
      "Pastreaza doar doua valori pe tot parcursul simularii: L (lungimea textului curent) si C (lungimea continutului din clipboard); actualizeaza-le direct dupa fiecare operatie.",
    explanation:
      "Urmarim exact metoda din explicatia oficiala: pastram doua variabile, L (lungimea textului) si C (lungimea clipboard-ului), initial L=N si C=0. La operatia 'C', C devine egal cu L (se copiaza tot textul curent). La operatia 'V', L creste cu C (se adauga la final continutul din clipboard, care nu se goleste). Simuland cele M operatii in ordine obtinem lungimea finala.\n\n**Complexitate:** O(M).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long N, M;
    cin >> N >> M;
    long long L = N, C = 0;
    for (int i = 0; i < M; i++) {
        string tok; cin >> tok;
        if (tok == "C") C = L;
        else L = L + C;
    }
    cout << L << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    N = int(data[0]); M = int(data[1])
    L = N
    C = 0
    for i in range(M):
        tok = data[2 + i]
        if tok == "C":
            C = L
        else:
            L = L + C
    print(L)

main()
`,
    tests: [
      "8 6\nC V V C V V\n",
      "1 2\nC V\n",
      "5 1\nV\n",
      "3 8\nC V C V C V C V\n",
      "100 40\nC V C V C V C V C V C V C V C V C V C V C V C V C V C V C V C V C V C V C V C V\n",
    ],
  },

  // ================= P4 (orig Q4): Sliding puzzle solvability (BFS on graph) =================
  {
    slug: "concurs-mi-ub-2025-puzzle-culisant",
    title: "Concurs MI UB 2025 - Puzzle culisant nesolvabil",
    difficulty: "hard",
    tags: ["concurs", "mateinfo-ub", "2025", "grafuri"],
    statement:
      "Un puzzle culisant are N pozitii numerotate de la 1 la N, legate intre ele printr-un graf de M conexiuni directe. In N-1 dintre pozitii se afla piese etichetate distinct, iar o pozitie ramane libera. O mutare consta in deplasarea unei piese dintr-o pozitie vecina (conform grafului) in pozitia libera. Configuratia de referinta are pozitia P libera, iar celelalte pozitii contin piesele etichetate 1, 2, ..., N-1 in ordinea crescatoare a indicelui pozitiei. Se considera toate cele (N-1)! configuratii initiale in care pozitia libera este tot P, iar piesele sunt asezate intr-o ordine oarecare in celelalte pozitii. Determinati din cate astfel de configuratii initiale NU se poate ajunge, printr-o succesiune de mutari, la configuratia de referinta.",
    input_format:
      "Pe prima linie se citesc trei numere N, M si P. Urmeaza M linii, fiecare continand doua numere u v (1-indexate), reprezentand o conexiune directa intre pozitiile u si v.",
    output_format: "Se afiseaza un singur numar intreg: numarul configuratiilor initiale din care puzzle-ul nu poate fi rezolvat.",
    constraints: "3 <= N <= 7, N-1 <= M <= N*(N-1)/2, 1 <= P <= N",
    hints:
      "Mutarile sunt reversibile, deci porneste din configuratia de referinta si exploreaza (BFS/DFS) toate starile la care se poate ajunge; numara apoi cate dintre ele au piesa libera tot in pozitia P.",
    explanation:
      "Reluam ideea din explicatia oficiala: deoarece orice mutare este reversibila, o configuratie initiala este solvabila daca si numai daca poate fi atinsa plecand din configuratia de referinta si aplicand mutari (in orice sens). Facem deci o parcurgere in latime (BFS) pornind din starea de referinta, generand toate starile accesibile prin schimbarea pozitiei libere cu o piesa vecina conform grafului dat. Numaram cate dintre starile accesibile au piesa libera exact in pozitia P (acestea sunt exact configuratiile initiale solvabile). Raspunsul este (N-1)! minus acest numar. Fiecare stare este codificata ca un numar in baza 7 (N <= 7) pentru a putea fi memorata intr-o multime de stari vizitate.\n\n**Complexitate:** O(N! * N) in cel mai defavorabil caz, dar N <= 7 face acest lucru neglijabil.",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int N, M, P;
    cin >> N >> M >> P;
    vector<vector<int>> adj(N + 1);
    for (int i = 0; i < M; i++) {
        int u, v; cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    vector<int> goal(N + 1, 0);
    int lbl = 1;
    for (int pos = 1; pos <= N; pos++) {
        if (pos == P) goal[pos] = 0;
        else { goal[pos] = lbl; lbl++; }
    }
    vector<int> goalVec(goal.begin() + 1, goal.end());
    auto enc = [&](const vector<int>& st) {
        long long code = 0;
        for (int x : st) code = code * 7 + x;
        return code;
    };
    set<long long> visited;
    visited.insert(enc(goalVec));
    queue<vector<int>> q;
    q.push(goalVec);
    long long reachableAtP = 0;
    while (!q.empty()) {
        vector<int> cur = q.front(); q.pop();
        int blankIdx = -1;
        for (int i = 0; i < N; i++) if (cur[i] == 0) blankIdx = i;
        int blankPos = blankIdx + 1;
        if (blankPos == P) reachableAtP++;
        for (int nb : adj[blankPos]) {
            int nbIdx = nb - 1;
            vector<int> nxt = cur;
            swap(nxt[blankIdx], nxt[nbIdx]);
            long long code = enc(nxt);
            if (!visited.count(code)) {
                visited.insert(code);
                q.push(nxt);
            }
        }
    }
    long long total = 1;
    for (int i = 2; i <= N - 1; i++) total *= i;
    cout << (total - reachableAtP) << "\\n";
    return 0;
}
`,
    py: `import sys
from collections import deque

def main():
    data = sys.stdin.read().split()
    idx = 0
    N = int(data[idx]); idx += 1
    M = int(data[idx]); idx += 1
    P = int(data[idx]); idx += 1
    adj = [[] for _ in range(N + 1)]
    for _ in range(M):
        u = int(data[idx]); idx += 1
        v = int(data[idx]); idx += 1
        adj[u].append(v)
        adj[v].append(u)
    goal = [0] * (N + 1)
    lbl = 1
    for pos in range(1, N + 1):
        if pos == P:
            goal[pos] = 0
        else:
            goal[pos] = lbl
            lbl += 1
    goal_vec = tuple(goal[1:])

    def enc(st):
        code = 0
        for x in st:
            code = code * 7 + x
        return code

    visited = set()
    visited.add(enc(goal_vec))
    q = deque([goal_vec])
    reachable_at_p = 0
    while q:
        cur = q.popleft()
        blank_idx = cur.index(0)
        blank_pos = blank_idx + 1
        if blank_pos == P:
            reachable_at_p += 1
        for nb in adj[blank_pos]:
            nb_idx = nb - 1
            nxt = list(cur)
            nxt[blank_idx], nxt[nb_idx] = nxt[nb_idx], nxt[blank_idx]
            nxt = tuple(nxt)
            code = enc(nxt)
            if code not in visited:
                visited.add(code)
                q.append(nxt)

    total = 1
    for i in range(2, N):
        total *= i
    print(total - reachable_at_p)

main()
`,
    tests: [
      "4 4 4\n1 2\n2 3\n1 3\n1 4\n",
      "3 2 2\n1 2\n2 3\n",
      "5 4 1\n1 2\n1 3\n1 4\n1 5\n",
      "5 5 1\n1 2\n2 3\n3 4\n4 5\n5 1\n",
      "7 7 1\n1 2\n2 3\n3 4\n4 5\n5 6\n6 7\n7 1\n1 4\n",
    ],
  },

  // ================= P5 (orig Q5): Catalan number mod M =================
  {
    slug: "concurs-mi-ub-2025-frunza-furnica",
    title: "Concurs MI UB 2025 - Traseele furnicutei",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2025", "combinatorica"],
    statement:
      "Furnicuta se deplaseaza pe o frunza reprezentata printr-o matrice patratica de n x n celule, pornind din coltul stanga-jos si dorind sa ajunga in coltul dreapta-jos, fara sa iasa de pe frunza. La un pas, ea poate urca (de la coltul stanga-jos al unei celule la coltul dreapta-sus) sau coborata (de la coltul stanga-sus la coltul dreapta-jos al unei celule), avansand mereu o coloana spre dreapta. Fie m numarul total de trasee valide. Determinati m modulo M.",
    input_format: "Se citesc pe o singura linie doua numere intregi n si M.",
    output_format: "Se afiseaza un singur numar intreg: restul impartirii lui m la M.",
    constraints: "0 <= n <= 60, 2 <= M <= 10^9",
    hints:
      "Numarul de trasee este exact numarul catalanian C_n; calculeaza-l prin recurenta de convolutie C_k = suma C_i * C_(k-1-i), care evita orice impartire modulara.",
    explanation:
      "Reluam observatia din explicatia oficiala: fiecare traseu are exact n pasi, dintre care jumatate urcari si jumatate coborari, iar nivelul vertical nu poate deveni negativ - aceasta este exact definitia numarului catalanian C_n. Pentru a calcula C_n modulo M fara a folosi inversul modular al lui (n+1) (care ar putea sa nu existe daca M nu e prim), folosim recurenta directa de convolutie: C_0 = 1 si C_k = sum_{i=0}^{k-1} C_i * C_{k-1-i} pentru k >= 1, reducand fiecare termen modulo M pe parcurs.\n\n**Complexitate:** O(n^2).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n, M;
    cin >> n >> M;
    vector<long long> C(n + 1, 0);
    C[0] = 1 % M;
    for (int k = 1; k <= n; k++) {
        long long s = 0;
        for (int i = 0; i < k; i++) s = (s + (C[i] * C[k - 1 - i]) % M) % M;
        C[k] = s;
    }
    cout << C[n] % M << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    n, M = map(int, sys.stdin.read().split())
    C = [0] * (n + 1)
    C[0] = 1 % M
    for k in range(1, n + 1):
        s = 0
        for i in range(k):
            s = (s + C[i] * C[k - 1 - i]) % M
        C[k] = s
    print(C[n] % M)

main()
`,
    tests: ["5 100", "1 1000", "0 50", "10 1000000000", "60 97"],
  },

  // ================= P6 (orig Q6): Conditional probability fraction =================
  {
    slug: "concurs-mi-ub-2025-probabilitate-carti",
    title: "Concurs MI UB 2025 - Probabilitatea celei de-a patra carti",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2025", "probabilitati"],
    statement:
      "Un pachet de carti este ordonat astfel incat un bloc de S carti consecutive apartin aceleiasi culori. Cineva extrage K carti consecutive din pachet, iar primele K-1 s-au dovedit a fi din acea culoare. Care este probabilitatea ca si a K-a carte extrasa sa fie tot din acea culoare?",
    input_format: "Se citesc pe o singura linie doua numere intregi S si K.",
    output_format: "Se afiseaza probabilitatea ca fractie ireductibila, in formatul p/q.",
    constraints: "2 <= K <= S <= 10^9",
    hints:
      "Numara in cate pozitii de start ale secvenzei de K carti primele K-1 cad in bloc, apoi in cate dintre acestea si a K-a carte cade tot in bloc.",
    explanation:
      "Reluam exact rationamentul oficial: pentru ca primele K-1 carti ale secventei sa fie din blocul de S carti, pozitia de start a secventei poate fi oricare dintre primele S-K+2 pozitii relative la bloc (S-K+2 cazuri posibile). Pentru ca si a K-a carte sa fie tot din bloc, secventa de K carti trebuie sa incapa complet in bloc, ceea ce inseamna ca pozitia de start poate fi oricare dintre primele S-K+1 pozitii (S-K+1 cazuri favorabile). Probabilitatea este deci (S-K+1)/(S-K+2); acesti doi termeni sunt intotdeauna numere consecutive, deci fractia e deja ireductibila.\n\n**Complexitate:** O(1) (sau O(log) pentru simplificarea prin cel mai mare divizor comun).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long S, K;
    cin >> S >> K;
    long long num = S - K + 1;
    long long den = S - K + 2;
    long long g = __gcd(num, den);
    num /= g; den /= g;
    cout << num << "/" << den << "\\n";
    return 0;
}
`,
    py: `import sys, math

def main():
    S, K = map(int, sys.stdin.read().split())
    num = S - K + 1
    den = S - K + 2
    g = math.gcd(num, den)
    num //= g
    den //= g
    print(f"{num}/{den}")

main()
`,
    tests: ["13 4", "5 2", "2 2", "1000000 3", "50 50"],
  },

  // ================= P7 (orig Q7): Modular staircase reachability =================
  {
    slug: "concurs-mi-ub-2025-scara-magica",
    title: "Concurs MI UB 2025 - Scara magica",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2025", "teoria-numerelor"],
    statement:
      "O scara magica conecteaza N etaje, numerotate de la 0 la N-1. De la etajul i, urcand sau coborand, se ajunge la etajul (i+S) mod N, respectiv (i-S) mod N, pentru un pas fix S. Pentru fiecare dintre K valori date ale lui N, determinati daca se poate ajunge de la etajul 0 la etajul 1, urcand si/sau coborand de oricate ori.",
    input_format:
      "Pe prima linie se citesc doua numere S si K. Pe a doua linie se citesc K numere, valorile candidate pentru N.",
    output_format:
      "Se afiseaza K cuvinte separate prin spatiu, pe o singura linie: 'DA' daca etajul 1 este accesibil pentru valoarea respectiva a lui N, altfel 'NU'.",
    constraints: "1 <= S <= 10^9, 1 <= K <= 20, 2 <= N <= 10^9",
    hints: "Etajele accesibile din 0 sunt exact multiplii lui S modulo N; etajul 1 e accesibil daca si numai daca cel mai mare divizor comun al lui S si N este 1.",
    explanation:
      "Reluam exact rationamentul oficial, generalizat pentru un pas S in loc de 6: dupa mai multe mutari, etajele accesibile din 0 sunt de forma S*k mod N. Etajul 1 este accesibil daca exista un intreg k astfel incat S*k = 1 (mod N), ceea ce se intampla daca si numai daca S este inversabil modulo N, adica gcd(S,N)=1. Pentru fiecare valoare candidata a lui N verificam aceasta conditie.\n\n**Complexitate:** O(K*log(max(S,N))).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long S, K;
    cin >> S >> K;
    vector<string> res;
    for (int i = 0; i < K; i++) {
        long long N; cin >> N;
        long long g = __gcd(S, N);
        res.push_back(g == 1 ? "DA" : "NU");
    }
    for (size_t i = 0; i < res.size(); i++) {
        if (i) cout << " ";
        cout << res[i];
    }
    cout << "\\n";
    return 0;
}
`,
    py: `import sys, math

def main():
    data = sys.stdin.read().split()
    idx = 0
    S = int(data[idx]); idx += 1
    K = int(data[idx]); idx += 1
    res = []
    for _ in range(K):
        N = int(data[idx]); idx += 1
        g = math.gcd(S, N)
        res.append("DA" if g == 1 else "NU")
    print(" ".join(res))

main()
`,
    tests: [
      "6 5\n2022 2023 2024 2025 2026\n",
      "1 3\n2 5 100\n",
      "4 4\n2 3 4 8\n",
      "7 3\n14 15 21\n",
      "999999937 2\n2 1000000000\n",
    ],
  },

  // ================= P8 (orig Q8): Cyclist race winner =================
  {
    slug: "concurs-mi-ub-2025-cursa-ciclisti",
    title: "Concurs MI UB 2025 - Cursa de biciclete",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2025", "simulare"],
    statement:
      "Un traseu de concurs consta intr-o urcare urmata de o coborare, fiecare reprezentand jumatate din lungimea totala. Se dau C concurenti, fiecare cu viteza medie la urcare vu si viteza medie la coborare vc (in km/h). Determinati indicele (1-indexat, in ordinea din intrare) concurentului care parcurge traseul complet in cel mai scurt timp.",
    input_format:
      "Pe prima linie se citeste C. Urmeaza C linii, fiecare continand doua numere vu si vc pentru concurentul respectiv.",
    output_format: "Se afiseaza un singur numar intreg: indicele concurentului castigator.",
    constraints: "1 <= C <= 20, 1 <= vu, vc <= 1000, se garanteaza un castigator unic",
    hints:
      "Timpul total este proportional cu 1/vu + 1/vc; compara aceasta suma pentru fiecare concurent folosind produs incrucisat, fara numere reale.",
    explanation:
      "Reluam exact formula din explicatia oficiala: timpul total al unui concurent este T = (L/2)*(1/vu + 1/vc), unde L este lungimea totala; cum L/2 e comun tuturor, e suficient sa minimizam 1/vu+1/vc, adica (vu+vc)/(vu*vc). Pentru a compara doua fractii fara erori de rotunjire, folosim produsul incrucisat: concurentul i are timp mai mic decat concurentul j daca (vu_i+vc_i)*(vu_j*vc_j) < (vu_j+vc_j)*(vu_i*vc_i).\n\n**Complexitate:** O(C).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int C; cin >> C;
    vector<long long> vu(C), vc(C);
    for (int i = 0; i < C; i++) cin >> vu[i] >> vc[i];
    int best = 0;
    for (int i = 1; i < C; i++) {
        long long lhs = (vu[i] + vc[i]) * (vu[best] * vc[best]);
        long long rhs = (vu[best] + vc[best]) * (vu[i] * vc[i]);
        if (lhs < rhs) best = i;
    }
    cout << (best + 1) << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    idx = 0
    C = int(data[idx]); idx += 1
    vu = []; vc = []
    for _ in range(C):
        vu.append(int(data[idx])); idx += 1
        vc.append(int(data[idx])); idx += 1
    best = 0
    for i in range(1, C):
        lhs = (vu[i] + vc[i]) * (vu[best] * vc[best])
        rhs = (vu[best] + vc[best]) * (vu[i] * vc[i])
        if lhs < rhs:
            best = i
    print(best + 1)

main()
`,
    tests: [
      "5\n10 100\n12 60\n20 40\n25 30\n32 20\n",
      "2\n5 5\n10 10\n",
      "1\n7 13\n",
      "4\n2 1000\n1000 3\n300 300\n50 900\n",
      "6\n1 1\n2 2\n3 3\n4 4\n5 5\n1000 1000\n",
    ],
  },

  // ================= P9 (orig Q9): Favorite number search =================
  {
    slug: "concurs-mi-ub-2025-numar-preferat",
    title: "Concurs MI UB 2025 - Numarul preferat",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2025", "teoria-numerelor"],
    statement:
      "Se cauta toate numerele de 3 cifre abc (a intre 1 si 9, b si c intre 0 si 9) cu suma cifrelor egala cu S, produsul cifrelor egal cu Pr, si care au acelasi numar de divizori ca rasturnatul lor (numarul obtinut prin inversarea ordinii cifrelor, eventual cu zerouri nesemnificative eliminate). Afisati toate aceste numere, in ordine crescatoare.",
    input_format: "Se citesc pe o singura linie doua numere intregi S si Pr.",
    output_format:
      "Se afiseaza, separate prin spatiu, toate numerele care satisfac conditiile, in ordine crescatoare, sau -1 daca nu exista niciunul.",
    constraints: "1 <= S <= 27, 0 <= Pr <= 729",
    hints:
      "Enumereaza direct toate cele 900 de numere de 3 cifre, verifica suma si produsul cifrelor, apoi compara numarul de divizori ai numarului cu cel al rasturnatului sau.",
    explanation:
      "Deoarece exista doar 900 de numere de 3 cifre, enumeram exhaustiv toate tripletele de cifre (a,b,c) cu a intre 1 si 9, b si c intre 0 si 9, pastrand cele cu suma S si produsul Pr - exact conditiile din enuntul oficial. Pentru fiecare candidat calculam numarul de divizori prin divizare de proba pana la radacina patrata, atat pentru numar cat si pentru rasturnatul sau (obtinut algebric ca 100c+10b+a, ceea ce trateaza automat cazul zerourilor nesemnificative), si pastram doar numerele pentru care cele doua numere de divizori coincid - exact conditia suplimentara folosita in explicatia oficiala pentru a distinge intre candidatii ramasi.\n\n**Complexitate:** O(900 * sqrt(1000)).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int divCount(int n) {
    int cnt = 0;
    for (int i = 1; (long long)i * i <= n; i++) {
        if (n % i == 0) {
            cnt++;
            if (i != n / i) cnt++;
        }
    }
    return cnt;
}
int main() {
    int S, Pr;
    cin >> S >> Pr;
    vector<int> res;
    for (int a = 1; a <= 9; a++) {
        for (int b = 0; b <= 9; b++) {
            for (int c = 0; c <= 9; c++) {
                if (a + b + c == S && a * b * c == Pr) {
                    int num = a * 100 + b * 10 + c;
                    int rev = c * 100 + b * 10 + a;
                    if (divCount(num) == divCount(rev)) res.push_back(num);
                }
            }
        }
    }
    if (res.empty()) {
        cout << -1 << "\\n";
    } else {
        for (size_t i = 0; i < res.size(); i++) {
            if (i) cout << " ";
            cout << res[i];
        }
        cout << "\\n";
    }
    return 0;
}
`,
    py: `import sys

def div_count(n):
    cnt = 0
    i = 1
    while i * i <= n:
        if n % i == 0:
            cnt += 1
            if i != n // i:
                cnt += 1
        i += 1
    return cnt

def main():
    S, Pr = map(int, sys.stdin.read().split())
    res = []
    for a in range(1, 10):
        for b in range(0, 10):
            for c in range(0, 10):
                if a + b + c == S and a * b * c == Pr:
                    num = a * 100 + b * 10 + c
                    rev = c * 100 + b * 10 + a
                    if div_count(num) == div_count(rev):
                        res.append(num)
    if not res:
        print(-1)
    else:
        print(" ".join(map(str, res)))

main()
`,
    tests: ["20 288", "27 1", "4 2", "1 0", "12 50"],
  },

  // ================= P10 (orig Q10): Huffman-style minimal merge cost =================
  {
    slug: "concurs-mi-ub-2025-imbinare-tevi",
    title: "Concurs MI UB 2025 - Imbinarea tevilor",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2025", "combinatorica"],
    statement:
      "Meterul Piperel are N tevi, cu lungimile date, pe care trebuie sa le imbine intr-o singura teava. De fiecare data poate imbina doar doua tevi, iar teava noua se aseaza langa celelalte. Imbinarea a doua tevi cu lungimile x si y are costul x+y si produce o teava de lungime x+y. Calculati costul minim necesar pentru a imbina toate cele N tevi intr-una singura.",
    input_format: "Pe prima linie se citeste N. Pe a doua linie se citesc N numere, lungimile tevilor.",
    output_format: "Se afiseaza un singur numar intreg: costul minim total.",
    constraints: "1 <= N <= 2000, 1 <= lungime <= 10^6",
    hints: "La fiecare pas imbina cele doua tevi cele mai scurte disponibile in acel moment (strategie greedy, similara algoritmului Huffman).",
    explanation:
      "Reluam exact strategia greedy din explicatia oficiala: la fiecare pas se aleg cele doua tevi cu lungimile cele mai mici si se imbina, adaugand costul lor la total, dupa care teava rezultata este pusa inapoi in multime. Implementam aceasta strategie eficient cu un min-heap (coada de prioritati): extragem de doua ori minimul, adunam costul, si reintroducem suma.\n\n**Complexitate:** O(N log N).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int N; cin >> N;
    priority_queue<long long, vector<long long>, greater<long long>> pq;
    for (int i = 0; i < N; i++) {
        long long x; cin >> x;
        pq.push(x);
    }
    long long total = 0;
    while (pq.size() > 1) {
        long long a = pq.top(); pq.pop();
        long long b = pq.top(); pq.pop();
        long long s = a + b;
        total += s;
        pq.push(s);
    }
    cout << total << "\\n";
    return 0;
}
`,
    py: `import sys, heapq

def main():
    data = sys.stdin.read().split()
    N = int(data[0])
    arr = list(map(int, data[1:1 + N]))
    heapq.heapify(arr)
    total = 0
    while len(arr) > 1:
        a = heapq.heappop(arr)
        b = heapq.heappop(arr)
        s = a + b
        total += s
        heapq.heappush(arr, s)
    print(total)

main()
`,
    tests: [
      "10\n7 5 3 2 3 10 7 4 9 6\n",
      "2\n5 8\n",
      "1\n42\n",
      "5\n1 1 1 1 1\n",
      "20\n1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20\n",
    ],
  },

  // ================= P11 (orig Q11): Nim-like card game (DP) =================
  {
    slug: "concurs-mi-ub-2025-joc-carti-nim",
    title: "Concurs MI UB 2025 - Jocul de carti",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2025", "recurenta"],
    statement:
      "Doi jucatori au un pachet cu N carti si joaca alternativ, primul jucator incepand. La fiecare tura, jucatorul curent ia din pachet exact 2, 3 sau 5 carti. Daca la inceputul unei ture raman 0 sau 1 carti, jucatorul respectiv nu are nicio mutare valida si pierde. Ambii jucatori joaca optimal. Se dau K valori initiale ale lui N (cate un joc separat pentru fiecare). Determinati pentru cate dintre aceste jocuri castiga primul jucator.",
    input_format: "Pe prima linie se citeste K. Pe a doua linie se citesc K numere, valorile lui N pentru fiecare joc.",
    output_format: "Se afiseaza un singur numar intreg: numarul de jocuri castigate de primul jucator.",
    constraints: "1 <= K <= 20, 0 <= N <= 10^6",
    hints: "Construieste un tablou win[] de jos in sus: win[n] este adevarat daca exista o mutare (scazand 2, 3 sau 5) care duce la o pozitie win[.] falsa.",
    explanation:
      "Reluam metoda din explicatia oficiala (calculul pozitiilor castigatoare/pierzatoare), dar in loc sa presupunem tiparul periodic observat pentru mutarile {2,3,5}, il calculam direct printr-o programare dinamica: win[0]=win[1]=fals (pozitii pierzatoare, conform enuntului), iar pentru n>=2, win[n] este adevarat daca exista o mutare m din {2,3,5} cu n-m>=0 si win[n-m] fals. Calculam acest tablou pentru toate valorile pana la maximul dintre cele K valori de N, apoi numaram cate dintre cele K jocuri sunt castigatoare.\n\n**Complexitate:** O(max(N)).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int K; cin >> K;
    vector<long long> N(K);
    long long maxN = 0;
    for (int i = 0; i < K; i++) { cin >> N[i]; maxN = max(maxN, N[i]); }
    vector<char> win(maxN + 1, 0);
    int moves[3] = {2, 3, 5};
    for (long long n = 0; n <= maxN; n++) {
        if (n == 0 || n == 1) { win[n] = 0; continue; }
        bool w = false;
        for (int m : moves) {
            if (n - m >= 0 && !win[n - m]) { w = true; break; }
        }
        win[n] = w;
    }
    int cnt = 0;
    for (int i = 0; i < K; i++) if (win[N[i]]) cnt++;
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    K = int(data[0])
    Ns = list(map(int, data[1:1 + K]))
    max_n = max(Ns)
    win = [False] * (max_n + 1)
    moves = [2, 3, 5]
    for n in range(0, max_n + 1):
        if n == 0 or n == 1:
            win[n] = False
            continue
        w = False
        for m in moves:
            if n - m >= 0 and not win[n - m]:
                w = True
                break
        win[n] = w
    cnt = sum(1 for n in Ns if win[n])
    print(cnt)

main()
`,
    tests: [
      "5\n10 20 30 40 50\n",
      "1\n0\n",
      "1\n2\n",
      "7\n0 1 2 7 8 14 15\n",
      "5\n999999 1000000 500000 123456 654321\n",
    ],
  },

  // ================= P12 (orig Q12): Max stock profit =================
  {
    slug: "concurs-mi-ub-2025-profit-caiet",
    title: "Concurs MI UB 2025 - Profitul maxim la caiet",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2025", "simulare"],
    statement:
      "Se cunoaste, pentru urmatoarele N zile, pretul unui caiet. In fiecare zi se poate cumpara un caiet (daca nu se detine niciunul) sau vinde caietul detinut, oricat de des, dar niciodata nu se pot detine 2 caiete simultan. Determinati suma maxima de bani ce poate fi castigata, stiind ca in prima zi nu se detine niciun caiet.",
    input_format: "Pe prima linie se citeste N. Pe a doua linie se citesc N numere, preturile din fiecare zi.",
    output_format: "Se afiseaza un singur numar intreg: profitul maxim posibil.",
    constraints: "1 <= N <= 10^5, 1 <= pret <= 10^6",
    hints: "Profitul maxim se obtine adunand toate cresterile pozitive dintre zile consecutive.",
    explanation:
      "Reluam observatia din explicatia oficiala: pentru a maximiza castigul cand se pot face oricate tranzactii (fara a detine 2 caiete simultan), este suficient sa profitam de fiecare interval in care pretul creste de la o zi la alta. Parcurgem preturile si adunam toate diferentele pozitive dintre zile consecutive.\n\n**Complexitate:** O(N).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int N; cin >> N;
    vector<long long> p(N);
    for (auto &x : p) cin >> x;
    long long profit = 0;
    for (int i = 1; i < N; i++) {
        if (p[i] > p[i - 1]) profit += p[i] - p[i - 1];
    }
    cout << profit << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    N = int(data[0])
    p = list(map(int, data[1:1 + N]))
    profit = 0
    for i in range(1, N):
        if p[i] > p[i - 1]:
            profit += p[i] - p[i - 1]
    print(profit)

main()
`,
    tests: [
      "10\n15 31 5 15 20 5 17 23 10 18\n",
      "1\n50\n",
      "2\n10 20\n",
      "2\n20 10\n",
      "10\n1 1000000 1 1000000 1 1000000 1 1000000 1 1000000\n",
    ],
  },

  // ================= P13 (orig Q13): Temperature threshold filtering =================
  {
    slug: "concurs-mi-ub-2025-senzori-temperatura",
    title: "Concurs MI UB 2025 - Componente supraincalzite",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2025", "simulare"],
    statement:
      "Se citesc N valori de temperatura, cate una pentru fiecare componenta a unui calculator, si un prag X. Determinati cate dintre componente au o temperatura strict mai mare decat X.",
    input_format: "Pe prima linie se citesc N si X. Pe a doua linie se citesc N numere intregi, temperaturile.",
    output_format: "Se afiseaza un singur numar intreg: numarul de componente cu temperatura strict mai mare decat X.",
    constraints: "1 <= N <= 10^5, -100 <= X, temperatura <= 200",
    hints: "Parcurge lista de temperaturi si numara valorile strict mai mari decat pragul.",
    explanation:
      "Reluam exact ideea din explicatia oficiala: parcurgem fiecare valoare de temperatura si incrementam un contor doar daca valoarea este strict mai mare decat pragul X (o valoare egala cu pragul nu se numara).\n\n**Complexitate:** O(N).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int N; long long X;
    cin >> N >> X;
    int cnt = 0;
    for (int i = 0; i < N; i++) {
        long long t; cin >> t;
        if (t > X) cnt++;
    }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    N = int(data[0]); X = int(data[1])
    cnt = 0
    for i in range(N):
        t = int(data[2 + i])
        if t > X:
            cnt += 1
    print(cnt)

main()
`,
    tests: [
      "10 80\n90 45 81 80 79 100 -5 200 81 60\n",
      "1 0\n1\n",
      "5 100\n10 20 30 40 50\n",
      "6 -10\n-20 -5 0 -15 -9 -10\n",
      "20 50\n51 52 53 54 55 56 57 58 59 60 61 62 63 64 65 66 67 68 69 70\n",
    ],
  },

  // ================= P14 (orig Q14): Min max-latency tree branching =================
  {
    slug: "concurs-mi-ub-2025-difuzoare-bluetooth",
    title: "Concurs MI UB 2025 - Retea de difuzoare bluetooth",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2025", "grafuri"],
    statement:
      "Un telefon trebuie conectat, direct sau indirect, la N difuzoare bluetooth. Telefonul si fiecare dispozitiv se pot conecta simultan la cel mult B alte dispozitive, iar fiecare conexiune are o latenta de exact 1 milisecunda. Determinati latenta minima pe care o poate avea, intre telefon si cel mai indepartat difuzor, o retea care conecteaza toate cele N difuzoare.",
    input_format: "Se citesc pe o singura linie doua numere N si B.",
    output_format: "Se afiseaza un singur numar intreg: latenta minima (in milisecunde).",
    constraints: "1 <= N <= 10^15, 2 <= B <= 20",
    hints:
      "Calculeaza, nivel cu nivel, numarul maxim de dispozitive noi ce pot fi conectate la fiecare distanta (fiecare dispozitiv folosit deja o conexiune spre nivelul anterior); acumuleaza pana acoperi toate cele N difuzoare.",
    explanation:
      "Reluam exact metoda de acumulare pe niveluri din explicatia oficiala: la nivelul 1 pot fi conectate cel mult B difuzoare direct la telefon. Fiecare dispozitiv de la un nivel foloseste deja o conexiune spre nivelul anterior, deci ii mai raman cel mult B-1 conexiuni noi; astfel numarul de dispozitive de la nivelul k (k>=2) este cel de la nivelul k-1 inmultit cu B-1. Acumulam aceste cantitati nivel cu nivel pana cand suma atinge sau depaseste N, iar raspunsul este numarul de niveluri parcurse. Cazul B=2 (cresterea liniara) este tratat separat cu formula directa R = ceil(N/2), pentru a evita un numar prea mare de iteratii.\n\n**Complexitate:** O(log_(B-1) N) pentru B >= 3, O(1) pentru B = 2.",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long N, B;
    cin >> N >> B;
    if (B == 2) {
        long long R = (N + 1) / 2;
        cout << R << "\\n";
        return 0;
    }
    long long BIG = (long long)2e18;
    long long level = B;
    long long cumulative = level;
    long long R = 1;
    while (cumulative < N) {
        R++;
        if (level > BIG / (B - 1)) level = BIG;
        else level *= (B - 1);
        if (cumulative > BIG - level) cumulative = BIG;
        else cumulative += level;
    }
    cout << R << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    N, B = map(int, sys.stdin.read().split())
    if B == 2:
        R = (N + 1) // 2
        print(R)
        return
    BIG = 2 * 10 ** 18
    level = B
    cumulative = level
    R = 1
    while cumulative < N:
        R += 1
        if level > BIG // (B - 1):
            level = BIG
        else:
            level *= (B - 1)
        if cumulative > BIG - level:
            cumulative = BIG
        else:
            cumulative += level
    print(R)

main()
`,
    tests: ["40 3", "1 5", "1000000 2", "5000 4", "1000000000000000 20"],
  },

  // ================= P15 (orig Q15): Sum of pairwise distances =================
  {
    slug: "concurs-mi-ub-2025-suma-distante-orase",
    title: "Concurs MI UB 2025 - Suma distantelor dintre orase",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2025", "combinatorica"],
    statement:
      "O tara are n orase, numerotate 1, 2, ..., n, asezate pe o axa. Intre oricare doua orase i si j exista o legatura directa (fie autostrada, fie cale ferata, in functie de o regula oarecare) de lungime |i-j|, iar distanta minima intre doua orase este exact aceasta lungime directa. Calculati suma distantelor dintre toate perechile de orase.",
    input_format: "Se citeste un singur numar intreg n.",
    output_format: "Se afiseaza un singur numar intreg: suma distantelor dintre toate perechile de orase.",
    constraints: "1 <= n <= 2000000",
    hints: "Suma ceruta este suma |i-j| pentru toate perechile 1<=i<j<=n; foloseste formula inchisa n*(n^2-1)/6.",
    explanation:
      "Reluam exact formula din explicatia oficiala: deoarece orice drum intre doua orase are lungime cel putin |i-j| (pe axa numerelor) si aceasta distanta este mereu direct realizabila, distanta minima dintre orasele i si j este |i-j|. Suma tuturor acestor distante este data de formula cunoscuta sum_{1<=i<j<=n} (j-i) = n*(n^2-1)/6. Pentru a evita depasirea de capacitate la calculul produsului intermediar n*(n-1)*(n+1), folosim tipul __int128 in C++ inainte de imparttirea la 6 si de afisare (Python gestioneaza numerele mari automat).\n\n**Complexitate:** O(1).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n;
    cin >> n;
    __int128 res = (__int128)n * (n - 1) * (n + 1) / 6;
    if (res == 0) { cout << 0 << "\\n"; return 0; }
    string s;
    __int128 x = res;
    while (x > 0) { s += char('0' + (int)(x % 10)); x /= 10; }
    reverse(s.begin(), s.end());
    cout << s << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    n = int(sys.stdin.read().strip())
    res = n * (n - 1) * (n + 1) // 6
    print(res)

main()
`,
    tests: ["100000", "2", "1", "3", "2000000"],
  },

  // ================= P16 (orig Q16): Edit-distance equal-pairs with wildcards =================
  {
    slug: "concurs-mi-ub-2025-distanta-editare-perechi",
    title: "Concurs MI UB 2025 - Perechi la aceeasi distanta de editare",
    difficulty: "hard",
    tags: ["concurs", "mateinfo-ub", "2025", "recurenta"],
    statement:
      "Se da un cuvant T si K perechi de cuvinte. Fiecare cuvant al unei perechi poate contine cel mult un caracter '*', care poate fi inlocuit cu orice litera mica a-z. Doua cuvinte dintr-o pereche sunt considerate la aceeasi distanta de T daca exista o modalitate de a inlocui simbolurile '*' (independent, in fiecare cuvant) astfel incat distantele de editare fata de T ale celor doua cuvinte rezultate sa fie egale. Determinati pentru cate din cele K perechi este posibil acest lucru.",
    input_format:
      "Pe prima linie se citeste cuvantul T. Pe a doua linie se citeste K. Urmeaza K linii, fiecare continand doua cuvinte separate prin spatiu, reprezentand o pereche.",
    output_format: "Se afiseaza un singur numar intreg: numarul de perechi valide.",
    constraints: "1 <= K <= 10, 1 <= lungime cuvant, lungime T <= 12, cel mult un '*' per cuvant",
    hints:
      "Pentru un cuvant fara '*' calculeaza direct distanta de editare fata de T; pentru un cuvant cu '*' calculeaza multimea distantelor posibile incercand fiecare din cele 26 de litere, apoi verifica daca cele doua multimi ale perechii au un element comun.",
    explanation:
      "Distanta de editare se calculeaza standard, prin programare dinamica (algoritmul Levenshtein), exact tehnica mentionata implicit in explicatia oficiala. Pentru un cuvant fara simbol '*' distanta fata de T este unica. Pentru un cuvant cu un singur '*' calculam multimea tuturor distantelor posibile, incercand pe rand fiecare din cele 26 de litere in locul lui '*'. O pereche este valida daca multimile de distante posibile ale celor doua cuvinte au cel putin un element comun (exista o alegere a literelor care egaleaza distantele) - exact logica folosita in explicatia oficiala pentru perechile cu wildcard.\n\n**Complexitate:** O(K * 26 * L1 * L2), unde L1, L2 sunt lungimile cuvintelor si ale lui T.",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int editDist(const string& a, const string& b) {
    int n = a.size(), m = b.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    for (int i = 0; i <= n; i++) dp[i][0] = i;
    for (int j = 0; j <= m; j++) dp[0][j] = j;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (a[i - 1] == b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
            else dp[i][j] = 1 + min({dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]});
        }
    }
    return dp[n][m];
}
set<int> possibleDistances(const string& word, const string& target) {
    set<int> res;
    int starPos = -1;
    for (int i = 0; i < (int)word.size(); i++) if (word[i] == '*') { starPos = i; break; }
    if (starPos == -1) {
        res.insert(editDist(word, target));
    } else {
        for (char c = 'a'; c <= 'z'; c++) {
            string w = word;
            w[starPos] = c;
            res.insert(editDist(w, target));
        }
    }
    return res;
}
int main() {
    string T;
    cin >> T;
    int K; cin >> K;
    int count = 0;
    for (int i = 0; i < K; i++) {
        string w1, w2;
        cin >> w1 >> w2;
        set<int> s1 = possibleDistances(w1, T);
        set<int> s2 = possibleDistances(w2, T);
        bool ok = false;
        for (int v : s1) if (s2.count(v)) { ok = true; break; }
        if (ok) count++;
    }
    cout << count << "\\n";
    return 0;
}
`,
    py: `import sys

def edit_dist(a, b):
    n, m = len(a), len(b)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        dp[i][0] = i
    for j in range(m + 1):
        dp[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    return dp[n][m]

def possible_distances(word, target):
    star_pos = word.find('*')
    if star_pos == -1:
        return {edit_dist(word, target)}
    res = set()
    for c in "abcdefghijklmnopqrstuvwxyz":
        w = word[:star_pos] + c + word[star_pos + 1:]
        res.add(edit_dist(w, target))
    return res

def main():
    data = sys.stdin.read().split()
    idx = 0
    T = data[idx]; idx += 1
    K = int(data[idx]); idx += 1
    count = 0
    for _ in range(K):
        w1 = data[idx]; idx += 1
        w2 = data[idx]; idx += 1
        s1 = possible_distances(w1, T)
        s2 = possible_distances(w2, T)
        if s1 & s2:
            count += 1
    print(count)

main()
`,
    tests: [
      "elma\n6\nema alma\nriquelma vero\ndana clema\nfra*a rex*na\nfcsb steaua\nlmx tlma\n",
      "cat\n3\ncat cat\nbat hat\nxy abcdefgh\n",
      "ab\n2\na* *b\ncd a\n",
      "code\n4\ncode code\nco abcdefghijkl\n*ode cade\nxy abcdefghijklmnop\n",
      "programare\n5\nprogram programa\npro*ramare progr*mare\nxyz abcdefghijkl\nprogramare programare\np*ogramar* prog*am*re\n",
    ],
  },

  // ================= P17 (orig Q18): Min transformations 0 -> X =================
  {
    slug: "concurs-mi-ub-2025-transformari-x5",
    title: "Concurs MI UB 2025 - Transformari pana la X",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2025", "recurenta"],
    statement:
      "Pornind de la 0, se pot aplica urmatoarele transformari asupra unui numar curent X: se transforma X in 5*X; sau, daca ultima cifra a lui X este 0 sau 5, se transforma X in X+1, X+2, X+3 sau X+4. Determinati numarul minim de transformari necesare pentru a ajunge de la 0 la un numar dat.",
    input_format: "Se citeste un singur numar intreg, tinta.",
    output_format: "Se afiseaza un singur numar intreg: numarul minim de transformari.",
    constraints: "0 <= tinta <= 10^18",
    hints:
      "Este mai simplu sa mergi invers, de la tinta spre 0: daca numarul curent e multiplu de 5, singura mutare inversa utila e impartirea la 5; altfel, singura mutare inversa este scaderea restului impartirii la 5.",
    explanation:
      "Reluam exact strategia din explicatia oficiala: rezolvam problema mergand invers, de la numarul tinta spre 0. Daca numarul curent n este divizibil cu 5, singura mutare inversa este n -> n/5 (inversul lui X -> 5X). Daca n nu este divizibil cu 5, singura mutare inversa posibila este n -> n - (n mod 5) (inversul unei transformari X -> X+k, unde k = n mod 5, este intotdeauna intre 1 si 4). Simuland aceasta strategie forte pana ajungem la 0 si numarand pasii obtinem raspunsul minim.\n\n**Complexitate:** O(log_5(tinta)).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n;
    cin >> n;
    long long steps = 0;
    while (n > 0) {
        if (n % 5 == 0) n /= 5;
        else n -= n % 5;
        steps++;
    }
    cout << steps << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    n = int(sys.stdin.read().strip())
    steps = 0
    while n > 0:
        if n % 5 == 0:
            n //= 5
        else:
            n -= n % 5
        steps += 1
    print(steps)

main()
`,
    tests: ["202520252025", "0", "1", "13", "1000000000000000000"],
  },

  // ================= P18 (orig Q19): Graph degree-sequence edges + max components =================
  {
    slug: "concurs-mi-ub-2025-graf-grade-clici",
    title: "Concurs MI UB 2025 - Graf cu grade prescrise",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2025", "grafuri"],
    statement:
      "Un graf neorientat simplu are gradul minim 2 si gradul maxim M, iar pentru fiecare r intre 2 si M exista exact r+1 noduri de grad r. Determinati numarul de muchii ale unui astfel de graf, precum si numarul maxim posibil de componente conexe.",
    input_format: "Se citeste un singur numar intreg M.",
    output_format: "Se afiseaza, pe o singura linie, doua numere separate prin spatiu: numarul de muchii, apoi numarul maxim de componente conexe.",
    constraints: "2 <= M <= 100000",
    hints:
      "O realizare concreta a acestei secvente de grade este reuniunea disjuncta de clici K_3, K_4, ..., K_(M+1); foloseste-o pentru a numara direct muchiile si componentele.",
    explanation:
      "Reluam constructia explicita din explicatia oficiala: reuniunea disjuncta de clici K_3, K_4, ..., K_(M+1) are exact gradele cerute (fiecare varf al clicii K_(r+1) are gradul r, iar sunt exact r+1 asemenea varfuri). Numarul de muchii al acestei realizari este suma numarului de muchii al fiecarei clici, C(r+1,2) = r*(r+1)/2, pentru r de la 2 la M (produsul r*(r+1) este mereu par, deci impartirea la 2 este exacta). Numarul maxim de componente conexe este M-1 (numarul de clici din constructie), deoarece orice componenta ce contine un varf de grad r trebuie sa aiba cel putin r+1 noduri, deci nu se pot obtine mai multe componente decat in aceasta constructie.\n\n**Complexitate:** O(M).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long M;
    cin >> M;
    long long edges = 0;
    for (long long r = 2; r <= M; r++) edges += (r * (r + 1)) / 2;
    long long maxComponents = M - 1;
    cout << edges << " " << maxComponents << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    M = int(sys.stdin.read().strip())
    edges = 0
    for r in range(2, M + 1):
        edges += (r * (r + 1)) // 2
    max_components = M - 1
    print(edges, max_components)

main()
`,
    tests: ["2024", "2", "3", "10", "100000"],
  },

  // ================= P19 (orig Q20): Trailing zeros of n! (Legendre) =================
  {
    slug: "concurs-mi-ub-2025-zerouri-factorial",
    title: "Concurs MI UB 2025 - Zerourile factorialului",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2025", "teoria-numerelor"],
    statement:
      "Se da un numar intreg n. Determinati numarul de zerouri de la finalul reprezentarii in baza 10 a lui n! (n factorial).",
    input_format: "Se citeste un singur numar intreg n.",
    output_format: "Se afiseaza un singur numar intreg: numarul de zerouri finale ale lui n!.",
    constraints: "0 <= n <= 10^18",
    hints: "Numarul de zerouri finale este dat de numarul de factori 5 din descompunerea lui n!, deoarece factorii 2 sunt intotdeauna mai multi.",
    explanation:
      "Reluam exact formula lui Legendre din explicatia oficiala: numarul de zerouri finale ale lui n! este Z(n!) = floor(n/5) + floor(n/25) + floor(n/125) + ..., deoarece fiecare zero final corespunde unui factor 10 = 2*5, iar in n! exista intotdeauna mai multi factori 2 decat factori 5. Insumam floor(n/5^k) pentru k=1,2,... cat timp 5^k <= n.\n\n**Complexitate:** O(log_5(n)).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n;
    cin >> n;
    long long zeros = 0;
    long long p = 5;
    while (p <= n) {
        zeros += n / p;
        p *= 5;
    }
    cout << zeros << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    n = int(sys.stdin.read().strip())
    zeros = 0
    p = 5
    while p <= n:
        zeros += n // p
        p *= 5
    print(zeros)

main()
`,
    tests: ["10052025", "1", "25", "100", "1000000000000000000"],
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
