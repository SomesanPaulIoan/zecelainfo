const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "concursuri", chapter: "concurs-mi-ub-2026", sub: "probleme-2026" };

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
  {
    slug: "concurs-mi-ub-2026-multipli-cmmmc",
    title: "Concurs MI UB 2026 - Multiplii CMMMC pana la n!",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2026", "teoria-numerelor"],
    statement:
      "Se da un numar natural n. Un numar natural k se numeste \"complet divizibil\" daca este divizibil cu toate numerele naturale de la 1 la n (adica se divide simultan cu 1, 2, 3, ..., n).\n\nCerinta: determinati cate numere complet divizibile exista in intervalul [1, n!] (n factorial).",
    input_format: "Se citeste, de pe o singura linie, numarul natural n.",
    output_format: "Se afiseaza, pe o singura linie, numarul de valori complet divizibile din intervalul [1, n!].",
    constraints:
      "2 <= n <= 20\n\nRezultatul se incadreaza in tipul intreg pe 64 de biti.",
    hints:
      "Un numar este divizibil cu toate valorile de la 1 la n daca si numai daca este divizibil cu L = cmmmc(1,2,...,n).\nNumarul de multipli ai lui L cuprinsi intre 1 si n! este exact n!/L, deoarece n! este el insusi multiplu de L.",
    explanation:
      "Se calculeaza L = cmmmc(1,2,...,n) acumuland progresiv cel mai mic multiplu comun (folosind identitatea cmmmc(a,b) = a*b/cel_mai_mare_divizor_comun(a,b)). Deoarece n! este divizibil cu toate numerele de la 1 la n, el este automat divizibil si cu L, deci numarul de multipli ai lui L din intervalul [1, n!] este exact n!/L. Se calculeaza separat n! si se imparte la L.",
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    long long n;
    cin >> n;
    long long L = 1;
    for (long long i = 1; i <= n; i++) {
        long long g = __gcd(L, i);
        L = L / g * i;
    }
    long long f = 1;
    for (long long i = 1; i <= n; i++) f *= i;
    cout << (f / L) << "\\n";
    return 0;
}
`,
    py: `import math

n = int(input())
L = 1
for i in range(1, n + 1):
    L = L * i // math.gcd(L, i)
f = 1
for i in range(1, n + 1):
    f *= i
print(f // L)
`,
    tests: ["3\n", "5\n", "12\n", "16\n", "20\n"],
  },
  {
    slug: "concurs-mi-ub-2026-punti-graf",
    title: "Concurs MI UB 2026 - Eliminarea puntilor dintr-un graf",
    difficulty: "hard",
    tags: ["concurs", "mateinfo-ub", "2026", "grafuri"],
    statement:
      "Se da un graf neorientat conex, cu n noduri (insulite) si m muchii (trunchiuri de copaci ce leaga direct doua insulite). Se doreste adaugarea unui numar minim de muchii noi astfel incat graful rezultat sa ramana conex chiar daca se elimina (se scufunda) oricare dintre muchiile sale.\n\nO muchie a carei eliminare deconecteaza graful se numeste punte. Cerinta este ca, dupa adaugarea muchiilor noi, graful sa nu mai contina nicio punte.\n\nDeterminati numarul minim de muchii noi care trebuie adaugate.",
    input_format:
      "Pe prima linie se citesc doua numere naturale n si m, reprezentand numarul de noduri, respectiv de muchii ale grafului.\nPe fiecare dintre urmatoarele m linii se citesc doua numere u si v, reprezentand o muchie intre nodurile u si v.\nGraful dat este conex, nu contine bucle (muchii de la un nod la el insusi) si nu contine muchii multiple intre aceeasi pereche de noduri.",
    output_format: "Se afiseaza, pe o singura linie, numarul minim de muchii care trebuie adaugate.",
    constraints: "2 <= n <= 2000\nn-1 <= m <= min(n*(n-1)/2, 4000)",
    hints:
      "Se identifica muchiile-punte (folosind algoritmul lui Tarjan, cu timpi de descoperire disc[] si valori low[]).\nSe \"contracta\" fiecare componenta 2-muchie-conexa (formata din nodurile legate intre ele fara punti) intr-un singur nod, obtinand un arbore al puntilor.\nDaca acest arbore are o singura componenta, raspunsul este 0. Altfel, se numara frunzele arborelui (noduri de grad 1) si raspunsul este numarul de frunze impartit la 2, rotunjit in sus, deoarece fiecare muchie noua poate \"repara\" doua frunze simultan.",
    explanation:
      "Se ruleaza un DFS (algoritmul lui Tarjan) pentru a determina care muchii sunt punti: o muchie (u,v), cu v copil al lui u in arborele DFS, este punte daca low[v] > disc[u]. Apoi se grupeaza nodurile in componente 2-muchie-conexe folosind o structura de multimi disjuncte (union-find), unind capetele fiecarei muchii care NU este punte. Contractand fiecare componenta la un singur nod, muchiile-punte formeaza un arbore intre aceste componente. Daca exista o singura componenta, graful este deja fara punti si raspunsul este 0. Altfel se numara nodurile de grad 1 din acest arbore (frunzele) si se calculeaza ceil(frunze/2): fiecare muchie noua adaugata intre doua frunze diferite elimina simultan puntile de pe drumul dintre ele si poate fi aleasa astfel incat sa conecteze si eventualele ramuri ramase, deci acest numar este optim si suficient.",
    cpp: `#include <bits/stdc++.h>
using namespace std;

const int MAXN = 2005, MAXM = 4005;
vector<pair<int,int>> adj[MAXN];
int disc[MAXN], low[MAXN];
bool visited[MAXN];
bool isBridge[MAXM];
int timerCnt = 1;
int par[MAXN];

void dfs(int u, int pe) {
    visited[u] = true;
    disc[u] = low[u] = timerCnt++;
    for (auto &pr : adj[u]) {
        int v = pr.first, eid = pr.second;
        if (eid == pe) continue;
        if (!visited[v]) {
            dfs(v, eid);
            low[u] = min(low[u], low[v]);
            if (low[v] > disc[u]) isBridge[eid] = true;
        } else {
            low[u] = min(low[u], disc[v]);
        }
    }
}

int find(int x) {
    while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; }
    return x;
}

int main(){
    int n, m;
    cin >> n >> m;
    vector<int> U(m), V(m);
    for (int i = 0; i < m; i++) {
        int u, v; cin >> u >> v;
        U[i] = u; V[i] = v;
        adj[u].push_back({v, i});
        adj[v].push_back({u, i});
    }
    dfs(1, -1);
    for (int i = 1; i <= n; i++) par[i] = i;
    for (int i = 0; i < m; i++) {
        if (!isBridge[i]) {
            int ru = find(U[i]), rv = find(V[i]);
            if (ru != rv) par[ru] = rv;
        }
    }
    set<int> comps;
    for (int i = 1; i <= n; i++) comps.insert(find(i));
    if ((int)comps.size() == 1) {
        cout << 0 << "\\n";
        return 0;
    }
    map<int,int> deg;
    for (int i = 0; i < m; i++) {
        if (isBridge[i]) {
            int ru = find(U[i]), rv = find(V[i]);
            deg[ru]++; deg[rv]++;
        }
    }
    int leaves = 0;
    for (int c : comps) {
        int d = deg.count(c) ? deg[c] : 0;
        if (d == 1) leaves++;
    }
    cout << ((leaves + 1) / 2) << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx]); idx += 1
    m = int(data[idx]); idx += 1
    edges = []
    adj = [[] for _ in range(n + 1)]
    for i in range(m):
        u = int(data[idx]); idx += 1
        v = int(data[idx]); idx += 1
        edges.append((u, v))
        adj[u].append((v, i))
        adj[v].append((u, i))

    disc = [0] * (n + 1)
    low = [0] * (n + 1)
    visited = [False] * (n + 1)
    is_bridge = [False] * m
    timer = [1]

    def dfs(root):
        stack = [(root, -1, iter(adj[root]))]
        visited[root] = True
        disc[root] = low[root] = timer[0]; timer[0] += 1
        while stack:
            node, pe, it = stack[-1]
            advanced = False
            for (nxt, eidx) in it:
                if eidx == pe:
                    continue
                if not visited[nxt]:
                    visited[nxt] = True
                    disc[nxt] = low[nxt] = timer[0]; timer[0] += 1
                    stack.append((nxt, eidx, iter(adj[nxt])))
                    advanced = True
                    break
                else:
                    low[node] = min(low[node], disc[nxt])
            if not advanced:
                stack.pop()
                if stack:
                    parent = stack[-1][0]
                    low[parent] = min(low[parent], low[node])
                    if low[node] > disc[parent]:
                        is_bridge[pe] = True

    for i in range(1, n + 1):
        if not visited[i]:
            dfs(i)

    par = list(range(n + 1))

    def find(x):
        while par[x] != x:
            par[x] = par[par[x]]
            x = par[x]
        return x

    for i, (u, v) in enumerate(edges):
        if not is_bridge[i]:
            ru, rv = find(u), find(v)
            if ru != rv:
                par[ru] = rv

    comps = set(find(i) for i in range(1, n + 1))
    if len(comps) == 1:
        print(0)
        return

    deg = {}
    for i, (u, v) in enumerate(edges):
        if is_bridge[i]:
            ru, rv = find(u), find(v)
            deg[ru] = deg.get(ru, 0) + 1
            deg[rv] = deg.get(rv, 0) + 1

    leaves = 0
    for c in comps:
        if deg.get(c, 0) == 1:
            leaves += 1

    print((leaves + 1) // 2)

main()
`,
    tests: [
      "5 4\n1 2\n2 3\n3 4\n4 5\n",
      "5 4\n1 2\n1 3\n1 4\n1 5\n",
      "6 6\n1 2\n2 3\n3 1\n3 4\n4 5\n5 6\n",
      "3 3\n1 2\n2 3\n3 1\n",
      "12 12\n1 2\n2 3\n3 4\n4 5\n5 1\n1 6\n2 7\n3 8\n4 9\n9 10\n10 11\n5 12\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2026-udat-planta",
    title: "Concurs MI UB 2026 - Cresterea optima a plantei",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2026", "programare-dinamica"],
    statement:
      "Lucian are o planta si vrea sa o creasca cu exact T milimetri, respectand urmatoarele reguli:\n\n- daca in ziua curenta uda planta, ea creste cu G milimetri;\n- daca nu o uda, iar in ziua anterioara a udat-o (sau este prima zi), planta scade cu P1 milimetri;\n- daca nu o uda doua zile consecutive, in a doua zi planta scade cu P2 milimetri;\n- planta nu poate ramane neudata 3 zile consecutive (ar muri), deci dupa doua zile neudate consecutiv, urmatoarea zi trebuie sa fie de udare.\n\nCerinta: determinati numarul minim de zile in care Lucian poate obtine o crestere neta a plantei de exact T milimetri (crestere neta = suma variatiilor zilnice, care poate include atat cresteri cat si scaderi, dar suma finala trebuie sa fie exact T).",
    input_format: "Se citesc, pe o singura linie, patru numere naturale: G, P1, P2 si T.",
    output_format:
      "Se afiseaza numarul minim de zile necesar, sau -1 daca acest lucru nu este posibil in cel mult 600 de zile.",
    constraints: "3 <= P1 < P2 <= 150\n1 <= G <= 150, G > P1\n1 <= T <= 500",
    hints:
      "Se modeleaza starea zilei printr-o pereche (crestere_acumulata, numar_de_zile_neudate_consecutiv), acesta din urma putand fi 0, 1 sau 2.\nSe simuleaza zi cu zi (programare dinamica pe multimi de stari), pastrand toate valorile de crestere care pot fi atinse in fiecare stare, pana cand valoarea T apare pentru prima data.",
    explanation:
      "Se face o cautare (DP) pe zile: pentru fiecare zi se pastreaza multimea perechilor (crestere, stare), unde stare este 0 daca ziua anterioara a fost de udare (sau este inceputul), 1 daca a fost prima zi neudata consecutiv, si 2 daca a fost a doua zi neudata consecutiv (caz in care ziua urmatoare este obligatoriu de udare). Din fiecare stare se poate uda planta (crestere += G, stare noua 0) sau, daca starea curenta este 0 sau 1, se poate lasa neudata (crestere -= P1 sau P2, stare noua creste cu 1). Se opreste la prima zi in care valoarea T apare printre crestere-rile posibile, indiferent de stare.",
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    long long g, p1, p2, T;
    cin >> g >> p1 >> p2 >> T;
    if (T == 0) { cout << 0 << "\\n"; return 0; }

    set<pair<long long,int>> cur;
    cur.insert({0, 0});
    const int maxday = 600;
    for (int day = 1; day <= maxday; day++) {
        set<pair<long long,int>> nxt;
        for (auto &pr : cur) {
            long long gr = pr.first;
            int st = pr.second;
            nxt.insert({gr + g, 0});
            if (st == 0) nxt.insert({gr - p1, 1});
            else if (st == 1) nxt.insert({gr - p2, 2});
        }
        cur = nxt;
        bool found = false;
        for (auto &pr : cur) {
            if (pr.first == T) { found = true; break; }
        }
        if (found) { cout << day << "\\n"; return 0; }
    }
    cout << -1 << "\\n";
    return 0;
}
`,
    py: `def main():
    g, p1, p2, T = map(int, input().split())
    if T == 0:
        print(0)
        return

    cur = {(0, 0)}
    maxday = 600
    for day in range(1, maxday + 1):
        nxt = set()
        for (gr, st) in cur:
            nxt.add((gr + g, 0))
            if st == 0:
                nxt.add((gr - p1, 1))
            elif st == 1:
                nxt.add((gr - p2, 2))
        cur = nxt
        if any(gr == T for (gr, st) in cur):
            print(day)
            return
    print(-1)

main()
`,
    tests: ["10 3 5 49\n", "10 3 5 7\n", "7 2 4 7\n", "5 1 2 100\n", "10 3 5 200\n"],
  },
  {
    slug: "concurs-mi-ub-2026-perne-tesut",
    title: "Concurs MI UB 2026 - Perne din resturi de tesut",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2026", "simulare"],
    statement:
      "Lucian are S metri patrati de tesut din care vrea sa faca perne. Pentru o perna de latime N (numar natural, N >= 1) este nevoie de exact 2*N*N metri patrati de tesut.\n\nLucian foloseste tesutul astfel: la fiecare pas, face cea mai mare perna posibila din tesutul ramas, adica alege cel mai mare N natural pentru care 2*N*N este cel mult cantitatea de tesut ramasa, apoi consuma acei 2*N*N metri patrati. Repeta procedeul cu tesutul ramas.\n\nDaca la un moment dat mai ramane tesut, dar acesta este insuficient pentru a face macar o perna de latime 1 (adica mai putin de 2 metri patrati raman si totusi nu e zero), procesul esueaza.\n\nCerinta: determinati numarul total de perne pe care le poate face Lucian, sau afisati -1 daca la un moment dat ramane tesut nefolosit din care nu se mai poate face nicio perna.",
    input_format: "Se citeste, pe o singura linie, numarul natural S.",
    output_format: "Se afiseaza numarul total de perne facute, sau -1 daca nu tot tesutul poate fi folosit.",
    constraints: "1 <= S <= 10^12",
    hints:
      "La fiecare pas se cauta cel mai mare N natural cu 2*N*N <= tesutul ramas (radacina patrata intreaga a jumatatii tesutului ramas, cu ajustare).\nDaca N este 0 (adica a mai ramas tesut, dar mai putin de 2 metri patrati), raspunsul este -1.\nProcesul se termina rapid: la fiecare pas tesutul ramas scade foarte mult (proportional cu radacina din valoarea anterioara), deci numarul de pasi este mic chiar pentru S mare.",
    explanation:
      "Se simuleaza direct procesul descris: cat timp mai exista tesut, se calculeaza cel mai mare N natural astfel incat 2*N*N sa fie cel mult tesutul ramas (folosind radacina patrata intreaga, cu o mica ajustare pentru a compensa erorile de rotunjire), se scade 2*N*N din tesutul ramas si se incrementeaza numarul de perne. Daca la un pas N ar fi 0 desi tesutul ramas este strict pozitiv, inseamna ca ramane un rest ce nu mai poate fi folosit, deci raspunsul este -1. Deoarece tesutul ramas scade foarte rapid (aproximativ ca radacina patrata a valorii anterioare), bucla se termina dupa foarte putini pasi, indiferent cat de mare este S initial.",
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    long long S;
    cin >> S;
    long long rem = S;
    long long cnt = 0;
    while (rem > 0) {
        long long N = (long long)sqrtl((long double)rem / 2.0L);
        while (2 * (N + 1) * (N + 1) <= rem) N++;
        while (N > 0 && 2 * N * N > rem) N--;
        if (N == 0) { cout << -1 << "\\n"; return 0; }
        rem -= 2 * N * N;
        cnt++;
    }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `import math

def main():
    S = int(input())
    rem = S
    cnt = 0
    while rem > 0:
        N = math.isqrt(rem // 2)
        while 2 * (N + 1) * (N + 1) <= rem:
            N += 1
        while N > 0 and 2 * N * N > rem:
            N -= 1
        if N == 0:
            print(-1)
            return
        rem -= 2 * N * N
        cnt += 1
    print(cnt)

main()
`,
    tests: ["1234\n", "1\n", "100\n", "7\n", "1000000000000\n"],
  },
  {
    slug: "concurs-mi-ub-2026-propagare-plante",
    title: "Concurs MI UB 2026 - Propagarea plantelor",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2026", "cautare-binara"],
    statement:
      "Lucian vrea sa obtina P plante complete (numarand si planta originala), pornind de la o singura planta. In fiecare zi, exclusiv din planta originala, poate propaga:\n\n- o bucata de radacina, care devine o planta completa dupa R zile;\n- o creanga, care devine o planta completa dupa B zile.\n\nIn aceeasi zi poate face ambele actiuni (cel mult o bucata de radacina si cel mult o creanga pe zi). Cerinta: determinati numarul minim de zile (numarand si prima zi) in care Lucian poate obtine P plante complete in total.",
    input_format: "Se citesc, pe o singura linie, trei numere naturale: R, B si P.",
    output_format: "Se afiseaza numarul minim de zile necesar.",
    constraints: "1 <= R, B <= 1000000\n2 <= P <= 1000000000000",
    hints:
      "Daca T este numarul total de zile, o bucata de radacina propagata in ziua d devine completa pana in ziua T doar daca d <= T-R, deci numarul maxim de radacini complete este max(0, T-R). Similar pentru crengi, cu B.\nNumarul total de plante dupa T zile este cel mult 1 + max(0,T-R) + max(0,T-B). Aceasta functie este crescatoare in T, deci minimul T cu valoare >= P se gaseste prin cautare binara.",
    explanation:
      "Se observa ca numarul maxim de plante noi complete pana in ziua T este max(0,T-R) (din radacini) plus max(0,T-B) (din crengi), la care se adauga planta originala. Aceasta expresie este monoton crescatoare in T, deci se poate cauta binar cea mai mica valoare T pentru care 1 + max(0,T-R) + max(0,T-B) >= P.",
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    long long R, B, P;
    cin >> R >> B >> P;
    long long lo = 1, hi = P + R + B + 10;
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        long long plants = 1 + max(0LL, mid - R) + max(0LL, mid - B);
        if (plants >= P) hi = mid; else lo = mid + 1;
    }
    cout << lo << "\\n";
    return 0;
}
`,
    py: `def main():
    R, B, P = map(int, input().split())
    lo, hi = 1, P + R + B + 10
    while lo < hi:
        mid = (lo + hi) // 2
        plants = 1 + max(0, mid - R) + max(0, mid - B)
        if plants >= P:
            hi = mid
        else:
            lo = mid + 1
    print(lo)

main()
`,
    tests: ["2 5 10\n", "1 1 2\n", "3 7 50\n", "1 2 1000000\n", "1000000 1000000 2\n"],
  },
  {
    slug: "concurs-mi-ub-2026-calendare-maya",
    title: "Concurs MI UB 2026 - Sincronizarea calendarelor",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2026", "teoria-numerelor"],
    statement:
      "Doua calendare cicice, cu perioadele A, respectiv B zile, arata astazi amandoua ziua 1. Determinati peste cate zile vor arata din nou, simultan, amandoua ziua 1.",
    input_format: "Se citesc, pe o singura linie, doua numere naturale A si B.",
    output_format: "Se afiseaza numarul minim de zile dupa care ambele calendare arata din nou simultan ziua 1.",
    constraints: "1 <= A, B <= 1000000000",
    hints: "Raspunsul este cel mai mic multiplu comun al celor doua perioade, cmmmc(A,B) = A*B/cmmdc(A,B).",
    explanation:
      "Un calendar cu perioada A revine la ziua 1 dupa orice multiplu de A zile, iar celalalt dupa orice multiplu de B zile. Primul moment in care ambele coincid din nou pe ziua 1 este cel mai mic multiplu comun al celor doua perioade, calculat ca A/cmmdc(A,B)*B pentru a evita depasirea de capacitate.",
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    long long A, B;
    cin >> A >> B;
    long long g = __gcd(A, B);
    cout << (A / g * B) << "\\n";
    return 0;
}
`,
    py: `import math

def main():
    A, B = map(int, input().split())
    g = math.gcd(A, B)
    print(A // g * B)

main()
`,
    tests: ["260 365\n", "1 1\n", "12 18\n", "999999937 999999937\n", "123456789 987654321\n"],
  },
  {
    slug: "concurs-mi-ub-2026-grid-pascal",
    title: "Concurs MI UB 2026 - Grila cuantica de tip Pascal",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2026", "combinatorica"],
    statement:
      "Un dispozitiv are forma unui caroiaj patrat cu n linii si n coloane de compartimente. In fiecare compartiment de pe prima linie si din prima coloana se afla o singura particula. Fiecare alt compartiment contine suma particulelor din compartimentele vecine de la vest (aceeasi linie, coloana anterioara) si de la nord (aceeasi coloana, linia anterioara): a(x,y) = a(x-1,y) + a(x,y-1).\n\nUn compartiment este identificat prin perechea (x,y), unde x este linia, iar y este coloana. O pereche (x,y) se afla inaintea perechii (x',y') daca x < x', sau daca x = x' si y < y'.\n\nCerinta: dat k, determinati primul compartiment (in aceasta ordine) in care se obtin exact k particule. Se garanteaza ca exista cel putin un astfel de compartiment in grila de dimensiune n x n.",
    input_format: "Se citesc, pe o singura linie, doua numere naturale n si k.",
    output_format: "Se afiseaza, pe o singura linie, doua numere x si y, separate printr-un spatiu: linia si coloana primului compartiment cu exact k particule.",
    constraints: "2 <= n <= 28\n1 <= k <= valoarea maxima posibila in grila (se garanteaza existenta solutiei)",
    hints:
      "Se construieste intreaga grila folosind exact regula data (a(x,y)=a(x-1,y)+a(x,y-1), cu 1 pe prima linie si prima coloana).\nApoi se parcurge grila in ordinea liniilor (si, in cadrul aceleiasi linii, in ordinea coloanelor), cautand prima celula cu valoarea k.",
    explanation:
      "Se recunoaste ca regula de completare este identica cu cea a triunghiului lui Pascal, valoarea din (x,y) fiind un coeficient binomial. In loc sa se calculeze coeficientul binomial direct (risc de depasire de capacitate pentru valori intermediare), se construieste tabelul complet folosind exact recurenta din enunt, apoi se parcurge tabelul in ordinea ceruta (linie cu linie, iar in cadrul liniei, coloana cu coloana) si se returneaza prima pozitie unde valoarea este exact k.",
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    int n;
    long long k;
    cin >> n >> k;
    vector<vector<long long>> a(n + 1, vector<long long>(n + 1, 0));
    for (int x = 1; x <= n; x++) {
        for (int y = 1; y <= n; y++) {
            if (x == 1 || y == 1) a[x][y] = 1;
            else a[x][y] = a[x-1][y] + a[x][y-1];
        }
    }
    for (int x = 1; x <= n; x++) {
        for (int y = 1; y <= n; y++) {
            if (a[x][y] == k) {
                cout << x << " " << y << "\\n";
                return 0;
            }
        }
    }
    return 0;
}
`,
    py: `def main():
    n, k = map(int, input().split())
    a = [[0] * (n + 1) for _ in range(n + 1)]
    for x in range(1, n + 1):
        for y in range(1, n + 1):
            if x == 1 or y == 1:
                a[x][y] = 1
            else:
                a[x][y] = a[x - 1][y] + a[x][y - 1]
    for x in range(1, n + 1):
        for y in range(1, n + 1):
            if a[x][y] == k:
                print(x, y)
                return

main()
`,
    tests: ["16 817190\n", "4 10\n", "2 1\n", "28 1946939425648112\n", "10 462\n"],
  },
  {
    slug: "concurs-mi-ub-2026-vopsit-scanduri",
    title: "Concurs MI UB 2026 - Vopsitul scandurilor",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2026", "teoria-numerelor"],
    statement:
      "Lucian are un gard format din n scanduri, indexate cu numere naturale de la 1 la n. Pentru fiecare zi i, de la 1 la n, Lucian vopseste toate scandurile cu indicele divizibil cu i. O scandura este numarata de fiecare data cand este vopsita (adica de atatea ori de cate ori indicele ei este divizibil cu un i din intervalul 1..n, adica de atatea ori cati divizori are).\n\nCerinta: determinati numarul total de vopsiri.",
    input_format: "Se citeste, pe o singura linie, numarul natural n.",
    output_format: "Se afiseaza numarul total de vopsiri.",
    constraints: "1 <= n <= 1000000000000 (10^12)",
    time_limit_ms: 2000,
    hints:
      "Numarul total de vopsiri este S = suma, pentru i de la 1 la n, a lui floor(n/i), adica suma numarului de divizori ai tuturor numerelor de la 1 la n.\nAceasta suma se calculeaza eficient (metoda hiperbolei) folosind simetria fata de radacina patrata a lui n: S = 2 * suma_{i=1}^{s} floor(n/i) - s*s, unde s = floor(sqrt(n)).",
    explanation:
      "Numarul de scanduri vopsite in ziua i este floor(n/i) (multiplii lui i cel mult n). Suma totala S = suma_{i=1}^{n} floor(n/i) numara, echivalent, toate perechile (i,j) cu i*j <= n, adica suma numarului de divizori ai fiecarui numar de la 1 la n. Se calculeaza eficient folosind simetria hiperbolei i*j<=n fata de s = floor(sqrt(n)): fiecare pereche (i,j) cu i<=s este numarata direct prin floor(n/i), iar prin simetrie (i si j interschimbate) fiecare pereche este numarata de doua ori, mai putin cele din patratul s x s care sunt numarate de doua ori si trebuie scazute o data. Astfel S = 2*suma_{i=1}^{s} floor(n/i) - s*s.",
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    long long n;
    cin >> n;
    long long s = (long long)sqrtl((long double)n);
    while ((s + 1) * (s + 1) <= n) s++;
    while (s > 0 && s * s > n) s--;
    long long total = 0;
    for (long long i = 1; i <= s; i++) total += n / i;
    long long S = 2 * total - s * s;
    cout << S << "\\n";
    return 0;
}
`,
    py: `import math

def main():
    n = int(input())
    s = math.isqrt(n)
    total = 0
    for i in range(1, s + 1):
        total += n // i
    S = 2 * total - s * s
    print(S)

main()
`,
    tests: ["1000000\n", "1\n", "2\n", "100\n", "1000000000000\n"],
  },
  {
    slug: "concurs-mi-ub-2026-filtrare-stele",
    title: "Concurs MI UB 2026 - Filtrarea stelelor",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2026", "simulare"],
    statement:
      "Un telescop a inregistrat N stele. Fiecare inregistrare are forma \"star-id clasa luminozitate distanta temperatura\", cu valorile despartite prin cate un spatiu, clasa fiind un text format doar din litere mici.\n\nSe da o multime de K clase acceptate, un prag minim de luminozitate Lmin si un interval deschis de temperatura (Tlo, Thi). Cerinta: numarati cate dintre cele N stele indeplinesc simultan urmatoarele conditii:\n\n- clasa stelei se afla printre cele K clase acceptate;\n- luminozitatea este cel putin Lmin;\n- temperatura este strict cuprinsa intre Tlo si Thi (interval deschis, capetele nu se includ).",
    input_format:
      "Pe prima linie: N si K.\nPe a doua linie: cele K clase acceptate, separate prin spatiu.\nPe a treia linie: Lmin.\nPe a patra linie: Tlo si Thi.\nUrmeaza N linii, fiecare de forma: star-id clasa luminozitate distanta temperatura (distanta nu influenteaza rezultatul).",
    output_format: "Se afiseaza un singur numar: cate stele indeplinesc toate cele trei conditii simultan.",
    constraints: "1 <= N <= 200000\n1 <= K <= 10\n0 <= Lmin, distanta, temperatura, Tlo, Thi <= 1000000000",
    hints:
      "Se citeste multimea claselor acceptate intr-o structura cu cautare rapida (multime de siruri de caractere).\nPentru fiecare inregistrare se verifica pe rand cele trei conditii; daca toate sunt indeplinite, se incrementeaza un contor.\nAtentie ca intervalul de temperatura este deschis: se compara cu < si >, nu cu <= si >=.",
    explanation:
      "Se parcurg cele N inregistrari o singura data (complexitate O(N)). Pentru fiecare, se verifica daca (1) clasa apare in multimea claselor acceptate, (2) luminozitatea este cel putin Lmin si (3) temperatura este strict intre Tlo si Thi. Campul distanta este citit dar nu este folosit in verificare. Numarul de inregistrari care indeplinesc simultan toate conditiile este raspunsul.",
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    int n, k;
    cin >> n >> k;
    set<string> allowed;
    for (int i = 0; i < k; i++) {
        string c; cin >> c;
        allowed.insert(c);
    }
    long long lmin;
    cin >> lmin;
    long long tlo, thi;
    cin >> tlo >> thi;
    int cnt = 0;
    for (int i = 0; i < n; i++) {
        string id, cls;
        long long lum, dist, temp;
        cin >> id >> cls >> lum >> dist >> temp;
        if (allowed.count(cls) && lum >= lmin && temp > tlo && temp < thi) cnt++;
    }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `def main():
    import sys
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx]); idx += 1
    k = int(data[idx]); idx += 1
    allowed = set()
    for _ in range(k):
        allowed.add(data[idx]); idx += 1
    lmin = int(data[idx]); idx += 1
    tlo = int(data[idx]); idx += 1
    thi = int(data[idx]); idx += 1
    cnt = 0
    for _ in range(n):
        sid = data[idx]; idx += 1
        cls = data[idx]; idx += 1
        lum = int(data[idx]); idx += 1
        dist = int(data[idx]); idx += 1
        temp = int(data[idx]); idx += 1
        if cls in allowed and lum >= lmin and tlo < temp < thi:
            cnt += 1
    print(cnt)

main()
`,
    tests: [
      "4 2\ngiant supergiant\n500\n2500 20000\nstar-0 giant 583 8272 9358\nstar-1 dwarf 508 99741 15728\nstar-2 subgiant 668 49757 26844\nstar-3 giant 97 63945 1928\n",
      "6 1\ndwarf\n100\n1000 15000\nstar-0 dwarf 94 11125 12831\nstar-1 giant 754 87783 28978\nstar-2 supergiant 258 79423 7953\nstar-3 mainsequence 37 76180 23323\nstar-4 giant 442 83686 13895\nstar-5 mainsequence 973 48767 18831\n",
      "8 3\ngiant supergiant subgiant\n300\n5000 25000\nstar-0 giant 607 71334 5273\nstar-1 supergiant 938 79158 16533\nstar-2 mainsequence 68 79378 1431\nstar-3 subgiant 266 72193 8678\nstar-4 giant 735 61639 18726\nstar-5 mainsequence 488 52054 21940\nstar-6 giant 238 83213 5968\nstar-7 mainsequence 400 97158 1496\n",
      "10 1\nmainsequence\n1\n1000 30000\nstar-0 giant 311 13523 24632\nstar-1 subgiant 491 20313 3952\nstar-2 dwarf 21 52638 19002\nstar-3 supergiant 820 7714 8272\nstar-4 mainsequence 550 47219 10066\nstar-5 giant 847 13918 9576\nstar-6 giant 966 3361 28162\nstar-7 supergiant 820 35619 7338\nstar-8 giant 318 37964 21544\nstar-9 supergiant 89 79411 12056\n",
      "12 2\ngiant supergiant\n500\n2500 20000\nstar-0 mainsequence 262 97228 12748\nstar-1 mainsequence 30 61031 26426\nstar-2 giant 665 6797 6139\nstar-3 dwarf 381 61482 29457\nstar-4 giant 390 71272 4341\nstar-5 mainsequence 256 1719 24959\nstar-6 giant 418 36633 6966\nstar-7 subgiant 164 99868 27120\nstar-8 dwarf 143 80993 21232\nstar-9 subgiant 130 17334 1058\nstar-10 dwarf 215 28244 6434\nstar-11 giant 297 41111 7517\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2026-lant-caractere",
    title: "Concurs MI UB 2026 - Lantul de caractere in grila",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2026", "backtracking"],
    statement:
      "Se da un sir de caractere S, de lungime L, si o grila cu R linii si C coloane (R*C = L), completata cu cate un caracter in fiecare celula. Se doreste sa se verifice daca sirul S poate fi \"citit\" ca un lant continuu in grila: lantul incepe din celula ce contine primul caracter al lui S, iar fiecare caracter urmator din S trebuie sa se afle intr-o celula vecina (pe orizontala, verticala sau diagonala) cu cea a caracterului precedent, folosind fiecare celula a grilei exact o data (deoarece R*C = L).\n\nCerinta: afisati DA daca un astfel de lant exista, sau NU in caz contrar.",
    input_format: "Pe prima linie se citeste sirul S.\nPe a doua linie se citesc R si C.\nUrmeaza R linii, fiecare continand un sir de C caractere (o linie a grilei, fara spatii intre caractere).",
    output_format: "Se afiseaza DA sau NU.",
    constraints: "2 <= L = R*C <= 16\nS si caracterele din grila contin doar cifre si litere mari ale alfabetului englez.",
    hints:
      "Se incearca (backtracking) pornirea lantului din fiecare celula ce contine primul caracter al lui S.\nDin fiecare celula curenta, se incearca deplasarea in oricare din cele pana la 8 celule vecine (pe orizontala, verticala sau diagonala) care nu a fost inca vizitata si contine urmatorul caracter din S.\nDaca se ajunge la ultimul caracter din S, lantul este valid.",
    explanation:
      "Se foloseste o cautare cu revenire (backtracking): pentru fiecare celula ce contine caracterul S[0], se porneste o cautare in adancime care, aflata la caracterul S[i] intr-o celula (r,c), incearca sa avanseze la caracterul S[i+1] intr-una dintre cele cel mult 8 celule vecine nevizitate ale caror continut coincide cu S[i+1]. Deoarece grila are cel mult 16 celule, aceasta cautare este rapida. Daca se reuseste sa se ajunga la ultimul caracter al lui S, raspunsul este DA; altfel, dupa epuizarea tuturor posibilitatilor de pornire, raspunsul este NU.",
    cpp: `#include <bits/stdc++.h>
using namespace std;

string S;
int R, C, L;
vector<string> grid;
vector<vector<bool>> visited;

bool dfs(int r, int c, int idx) {
    if (idx == L - 1) return true;
    visited[r][c] = true;
    for (int dr = -1; dr <= 1; dr++) {
        for (int dc = -1; dc <= 1; dc++) {
            if (dr == 0 && dc == 0) continue;
            int nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < R && nc >= 0 && nc < C && !visited[nr][nc] && grid[nr][nc] == S[idx + 1]) {
                if (dfs(nr, nc, idx + 1)) {
                    visited[r][c] = false;
                    return true;
                }
            }
        }
    }
    visited[r][c] = false;
    return false;
}

int main(){
    cin >> S;
    cin >> R >> C;
    L = S.size();
    grid.resize(R);
    for (int i = 0; i < R; i++) cin >> grid[i];
    visited.assign(R, vector<bool>(C, false));
    bool ok = false;
    for (int r = 0; r < R && !ok; r++) {
        for (int c = 0; c < C && !ok; c++) {
            if (grid[r][c] == S[0]) {
                if (dfs(r, c, 0)) ok = true;
            }
        }
    }
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    S = data[0]
    R = int(data[1]); C = int(data[2])
    grid = data[3:3 + R]
    L = len(S)
    visited = [[False] * C for _ in range(R)]

    def dfs(r, c, idx):
        if idx == L - 1:
            return True
        visited[r][c] = True
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                if dr == 0 and dc == 0:
                    continue
                nr, nc = r + dr, c + dc
                if 0 <= nr < R and 0 <= nc < C and not visited[nr][nc] and grid[nr][nc] == S[idx + 1]:
                    if dfs(nr, nc, idx + 1):
                        visited[r][c] = False
                        return True
        visited[r][c] = False
        return False

    ok = False
    for r in range(R):
        for c in range(C):
            if grid[r][c] == S[0]:
                if dfs(r, c, 0):
                    ok = True
                    break
        if ok:
            break
    print("DA" if ok else "NU")

main()
`,
    tests: [
      "MATEINFOUB2026\n7 2\nMA\nET\nIN\nOF\nUB\n02\n26\n",
      "MATEINFOUB2026\n7 2\nUA\nET\nIN\nOF\nMB\n02\n26\n",
      "ZECELAINFO\n5 2\nZE\nEC\nLA\nNI\nFO\n",
      "ZECELAINFO\n5 2\nFE\nEC\nLA\nNI\nZO\n",
      "ABCDEFGHI\n3 3\nABC\nFED\nGHI\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2026-cifra-secventa",
    title: "Concurs MI UB 2026 - Cifra din secventa infinita",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2026", "simulare"],
    statement:
      "Se construieste un numar (teoretic infinit) prin concatenarea blocurilor B_1, B_2, B_3, ..., unde blocul B_n este concatenarea numerelor naturale de la 1 la n scrise in baza 10 (de exemplu B_1 = \"1\", B_2 = \"12\", B_3 = \"123\", B_4 = \"1234\", B_5=\"12345\", B_10 = \"12345678910\", etc.). Numarul complet este B_1 B_2 B_3 B_4 ... (blocurile fiind scrise unul dupa altul).\n\nPozitiile in acest numar sunt indexate de la 0. Cerinta: dat P, determinati cifra aflata pe pozitia P.",
    input_format: "Se citeste, pe o singura linie, numarul natural P.",
    output_format: "Se afiseaza o singura cifra (0-9): cifra aflata pe pozitia P.",
    constraints: "0 <= P <= 200000000",
    hints:
      "Lungimea blocului B_n satisface |B_n| = |B_{n-1}| + (numarul de cifre ale lui n), deci se poate acumula direct suma lungimilor blocurilor pana se depaseste P, gasind astfel blocul B_m in care se afla pozitia P.\nOdata gasit blocul B_m si offsetul in interiorul lui, se cauta cifra respectiva parcurgand direct numerele 1,2,3,...,m (aceeasi tehnica, aplicata la un nivel mai adanc).\nDeoarece lungimile blocurilor cresc rapid, indicele m ramane mic chiar si pentru P de ordinul sutelor de milioane, deci ambele cautari sunt foarte rapide.",
    explanation:
      "Se cauta mai intai, printr-o simulare directa, indicele blocului m in care cade pozitia P: se acumuleaza suma lungimilor blocurilor B_1, B_2, ... (fiecare |B_n| = |B_{n-1}| + digits(n)) pana cand suma depaseste P, retinand si deplasamentul (offset) in interiorul blocului curent. Apoi, in interiorul blocului B_m = \"123...m\", se cauta cifra de pe pozitia offset printr-o a doua simulare directa, parcurgand numerele 1,2,...,m si numarand cifrele acestora pana se atinge offsetul cerut. Aceasta este exact tehnica standard pentru problema \"a cata cifra\" aplicata de doua ori, o data la nivel de blocuri si o data in interiorul unui bloc.",
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    long long P;
    cin >> P;
    long long total = 0, blocklen = 0;
    long long n = 0, offset = 0;
    while (true) {
        n++;
        blocklen += (long long)to_string(n).size();
        if (total + blocklen > P) {
            offset = P - total;
            break;
        }
        total += blocklen;
    }
    long long ln = 0, k = 0;
    while (true) {
        k++;
        string sk = to_string(k);
        if (ln + (long long)sk.size() > offset) {
            cout << sk[offset - ln] << "\\n";
            return 0;
        }
        ln += (long long)sk.size();
    }
}
`,
    py: `def main():
    P = int(input())
    total = 0
    blocklen = 0
    n = 0
    while True:
        n += 1
        blocklen += len(str(n))
        if total + blocklen > P:
            offset = P - total
            break
        total += blocklen
    ln = 0
    k = 0
    while True:
        k += 1
        sk = str(k)
        if ln + len(sk) > offset:
            print(sk[offset - ln])
            return
        ln += len(sk)

main()
`,
    tests: ["16052026\n", "0\n", "5\n", "123456\n", "200000000\n"],
  },
  {
    slug: "concurs-mi-ub-2026-echipe-constructie",
    title: "Concurs MI UB 2026 - Alegerea a doua echipe de constructie",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2026", "combinatorica"],
    statement:
      "Dan vrea sa isi construiasca o sala noua de bal si a primit oferte de la N echipe de constructori. Echipa i termina lucrarea singura in d_i luni si costa c_i unitati monetare pe luna.\n\nDan trebuie sa angajeze exact doua echipe, care lucreaza simultan de la inceputul pana la sfarsitul lucrarii, fiecare contribuind cu randamentul ei obisnuit (echipa i produce 1/d_i din lucrare pe luna). Daca alege echipele i si j, timpul de finalizare este 1 / (1/d_i + 1/d_j) luni, iar costul total este suma costurilor lunare ale celor doua echipe inmultita cu timpul de finalizare. Bugetul disponibil este buget unitati monetare.\n\nCerinta: determinati timpul minim de finalizare (ca fractie ireductibila p/q) alegand o pereche de echipe al carei cost total nu depaseste bugetul, sau afisati -1 daca nu exista nicio pereche care sa se incadreze in buget.",
    input_format: "Pe prima linie: N si buget.\nUrmeaza N linii, fiecare continand d_i si c_i (durata, respectiv costul lunar al echipei i).",
    output_format: "Se afiseaza timpul minim ca fractie ireductibila p/q, sau -1 daca nu exista o pereche valida.",
    constraints: "2 <= N <= 12\n1 <= d_i, c_i <= 1000\n1 <= buget <= 10000000",
    hints:
      "Se incearca toate perechile de echipe (i,j), sunt cel mult 66 perechi.\nTimpul pentru perechea (i,j) este fractia d_i*d_j / (d_i+d_j); costul total este (c_i+c_j) * timp, comparat cu bugetul fara impartire (inmultire incrucisata) pentru a evita erorile de rotunjire.\nSe retine perechea valida cu timpul minim (comparat tot prin inmultire incrucisata a fractiilor), apoi se simplifica fractia finala prin cel mai mare divizor comun.",
    explanation:
      "Randamentul echipei i este 1/d_i sala/luna, deci pentru doua echipe randamentul combinat este 1/d_i + 1/d_j, iar timpul de finalizare este inversul acestei sume, adica d_i*d_j/(d_i+d_j). Costul total este (c_i+c_j) inmultit cu acest timp; conditia de incadrare in buget, (c_i+c_j)*d_i*d_j/(d_i+d_j) <= buget, se testeaza fara impartire prin inmultire incrucisata: (c_i+c_j)*d_i*d_j <= buget*(d_i+d_j). Se parcurg toate cele C(N,2) perechi, se retine cea cu timpul minim dintre cele valide (comparate tot prin inmultire incrucisata a fractiilor timp), iar rezultatul final se simplifica impartind numaratorul si numitorul la cel mai mare divizor comun al lor.",
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    int n;
    long long budget;
    cin >> n >> budget;
    vector<long long> d(n), c(n);
    for (int i = 0; i < n; i++) cin >> d[i] >> c[i];
    long long bestNum = -1, bestDen = 1;
    bool found = false;
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            long long num = d[i] * d[j];
            long long den = d[i] + d[j];
            if ((c[i] + c[j]) * num <= budget * den) {
                if (!found || num * bestDen < bestNum * den) {
                    bestNum = num; bestDen = den; found = true;
                }
            }
        }
    }
    if (!found) { cout << -1 << "\\n"; return 0; }
    long long g = __gcd(bestNum, bestDen);
    cout << (bestNum / g) << "/" << (bestDen / g) << "\\n";
    return 0;
}
`,
    py: `import math

def main():
    n, budget = map(int, input().split())
    teams = [tuple(map(int, input().split())) for _ in range(n)]
    best = None
    for i in range(n):
        for j in range(i + 1, n):
            di, ci = teams[i]
            dj, cj = teams[j]
            num = di * dj
            den = di + dj
            if (ci + cj) * num <= budget * den:
                if best is None or num * best[1] < best[0] * den:
                    best = (num, den)
    if best is None:
        print(-1)
        return
    num, den = best
    g = math.gcd(num, den)
    print(f"{num // g}/{den // g}")

main()
`,
    tests: [
      "4 12\n2 6\n3 5\n4 3\n5 2\n",
      "2 25\n1 10\n1 10\n",
      "3 1\n5 1\n5 1\n5 1\n",
      "5 15\n10 2\n20 3\n30 4\n6 9\n15 1\n",
      "5 60\n10 2\n20 3\n30 4\n6 9\n15 1\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2026-joc-paianjen",
    title: "Concurs MI UB 2026 - Jocul cu paianjenul",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2026", "teoria-jocurilor"],
    statement:
      "Bogdan si Ștefan joaca M runde ale unui joc. La runda i, se foloseste o hartie cu N celule patratice asezate in linie dreapta, iar pe una din celule se afla un paianjen, pe pozitia P (celulele fiind numerotate de la 1 la N).\n\nBogdan incepe intotdeauna primul fiecare runda. Pe rand, jucatorul aflat la mutare taie hartia in doua bucati, dupa latura unei celule, iar bucata ce contine paianjenul este pasata celuilalt jucator (bucata fara paianjen este aruncata). Jucatorul care nu mai poate taia (adica ramane cu o singura celula, cea a paianjenului, in mana) pierde runda.\n\nAmbii jucatori joaca optim. Cerinta: determinati cate din cele M runde le castiga Bogdan.",
    input_format: "Pe prima linie: M.\nUrmeaza M linii, fiecare continand cate doua numere N si P (dimensiunea hartiei, respectiv pozitia paianjenului).",
    output_format: "Se afiseaza numarul de runde castigate de Bogdan.",
    constraints: "1 <= M <= 1000\n2 <= N <= 1000000000\n1 <= P <= N",
    hints:
      "Se noteaza L = P-1 (numarul de celule din stanga paianjenului) si R = N-P (numarul de celule din dreapta).\nO mutare poate doar sa micsoreze L sau R (taind din partea corespunzatoare), deci jocul se comporta identic cu doua gramezi Nim de dimensiuni L si R.\nPozitia este pierzatoare pentru jucatorul la mutare (Bogdan, care e primul) exact cand L xor R = 0.",
    explanation:
      "Fiecare runda se modeleaza ca un joc Nim cu doua gramezi: L = P-1 celule in stanga paianjenului si R = N-P celule in dreapta. O mutare (o taietura) reduce strict fie L, fie R, la orice valoare nenegativa mai mica, exact ca in Nim cu doua gramezi. Conform teoriei Nim, pozitia este castigatoare pentru jucatorul la mutare daca si numai daca L xor R != 0. Deoarece Bogdan muta primul in fiecare runda, el castiga runda exact atunci cand L xor R != 0; se numara cate din cele M runde satisfac aceasta conditie.",
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    int m;
    cin >> m;
    int wins = 0;
    for (int i = 0; i < m; i++) {
        long long n, p;
        cin >> n >> p;
        long long L = p - 1, R = n - p;
        if ((L ^ R) != 0) wins++;
    }
    cout << wins << "\\n";
    return 0;
}
`,
    py: `def main():
    m = int(input())
    wins = 0
    for _ in range(m):
        n, p = map(int, input().split())
        L = p - 1
        R = n - p
        if (L ^ R) != 0:
            wins += 1
    print(wins)

main()
`,
    tests: [
      "6\n3 2\n4 2\n5 2\n6 3\n7 3\n8 4\n",
      "1\n5 3\n",
      "5\n5 1\n10 8\n9 5\n5 5\n4 4\n",
      "5\n1000000000 500000000\n999999999 123456789\n2 1\n2 2\n1000000000 1\n",
      "8\n5 3\n199 100\n999999999 500000000\n10 7\n1000000000 1\n6 4\n50 50\n1000000000 500000000\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2026-grade-graf",
    title: "Concurs MI UB 2026 - Gradul repetat minim intr-un graf",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2026", "grafuri"],
    statement:
      "Se doreste construirea unui graf simplu neorientat (fara bucle si fara muchii multiple) cu n noduri, fara noduri izolate, in care exact doua noduri au acelasi grad x, iar toate celelalte n-2 noduri au grade distincte doua cate doua si diferite de x.\n\nCerinta: determinati cea mai mica valoare posibila a lui x pentru care un astfel de graf exista.",
    input_format: "Se citeste, pe o singura linie, numarul natural n.",
    output_format: "Se afiseaza valoarea minima posibila a lui x.",
    constraints: "2 <= n <= 5000",
    hints:
      "Intr-un graf simplu cu n noduri, fara noduri izolate, gradele posibile sunt 1,2,...,n-1. Daca exact doua noduri au acelasi grad x si restul sunt distincte, multimea gradelor trebuie sa fie {1,2,...,n-1} plus inca o data x.\nUn astfel de graf contine mereu un nod de grad n-1 (adiacent cu toate celelalte). Eliminandu-l, toate gradele scad cu 1, iar nodul care avea gradul 1 devine izolat si poate fi eliminat si el; problema se reduce la aceeasi problema cu n-2 noduri si gradul repetat x-1.\nRepetand reducerea de x-1 ori, se ajunge la un caz de baza posibil doar cand raman 2 sau 3 noduri cu gradul repetat 1.",
    explanation:
      "Se simuleaza direct reducerea descrisa: pornind de la n noduri si repetand pasul \"scade numarul de noduri cu 2, creste x cu 1\", se opreste cand numarul de noduri ramase devine 2 sau 3 (singurele cazuri de baza posibile pentru gradul repetat 1). Numarul de pasi facuti, plus 1, este valoarea minima a lui x. Aceasta simulare reproduce exact argumentul de reducere din enunt: la fiecare pas se elimina nodul de grad maxim (adiacent cu toate) si nodul ramas cu grad minim (care devine izolat), reducand problema la un graf mai mic cu gradul repetat cu o unitate mai mic.",
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    long long n;
    cin >> n;
    long long rem = n;
    long long x = 0;
    while (rem != 2 && rem != 3) {
        rem -= 2;
        x++;
    }
    cout << (x + 1) << "\\n";
    return 0;
}
`,
    py: `def main():
    n = int(input())
    rem = n
    x = 0
    while rem != 2 and rem != 3:
        rem -= 2
        x += 1
    print(x + 1)

main()
`,
    tests: ["2026\n", "7\n", "4\n", "3\n", "5000\n"],
  },
  {
    slug: "concurs-mi-ub-2026-permutari-fericite",
    title: "Concurs MI UB 2026 - Permutari fericite",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2026", "combinatorica"],
    statement:
      "Se da o multime B = {a, b, c, d} formata din 4 numere intregi distincte. O permutare a lui B este un cvadruplu (a,b,c,d) cu multimea {a,b,c,d} = B; exista in total 4! = 24 de permutari posibile.\n\nSe considera urmatoarele 5 functii de 4 variabile:\n\nf1(a,b,c,d) = a*d - b*c\nf2(a,b,c,d) = a+d-b-c\nf3(a,b,c,d) = (a-b)*(d-c)\nf4(a,b,c,d) = a*b + c*d\nf5(a,b,c,d) = b*b - a*d + c\n\nO functie f_i se numeste \"fericita\" pentru o permutare (a,b,c,d) daca valoarea f_i(a,b,c,d) este egala cu maximul sau cu minimul valorii lui f_i, calculate peste toate cele 24 de permutari ale lui B.\n\nPentru fiecare permutare a lui B se numara cate dintre cele 5 functii sunt fericite pentru ea. Cerinta: determinati cate permutari ale lui B ating numarul maxim de functii fericite.",
    input_format: "Se citesc, pe o singura linie, cele 4 numere intregi distincte ale multimii B.",
    output_format: "Se afiseaza numarul de permutari ale lui B care fac fericite un numar maxim de functii dintre cele 5 date.",
    constraints: "-1000 <= valorile din B <= 1000, toate distincte",
    hints:
      "Se genereaza toate cele 24 de permutari ale lui B.\nPentru fiecare din cele 5 functii, se calculeaza valoarea ei pe toate cele 24 de permutari, retinand minimul si maximul global.\nPentru fiecare permutare, se numara la cate dintre cele 5 functii valoarea obtinuta este egala cu minimul sau maximul global al acelei functii; apoi se determina maximul acestor numaratori si cate permutari il ating.",
    explanation:
      "Problema se rezolva prin simulare completa (brute force), fara nicio formula speciala: se genereaza toate cele 24 de permutari ale multimii B, se evalueaza fiecare dintre cele 5 functii date pe fiecare permutare, se determina minimul si maximul global al fiecarei functii, apoi pentru fiecare permutare se numara la cate functii valoarea ei coincide cu minimul sau maximul global al acelei functii (adica este \"fericita\"). Raspunsul este numarul de permutari care ating maximul acestor numaratori.",
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    vector<long long> B(4);
    for (auto &x : B) cin >> x;
    sort(B.begin(), B.end());
    vector<array<long long,4>> perms;
    do {
        perms.push_back({B[0], B[1], B[2], B[3]});
    } while (next_permutation(B.begin(), B.end()));
    int P = perms.size();
    vector<vector<long long>> vals(5, vector<long long>(P));
    for (int i = 0; i < P; i++) {
        long long a = perms[i][0], b = perms[i][1], c = perms[i][2], d = perms[i][3];
        vals[0][i] = a * d - b * c;
        vals[1][i] = a + d - b - c;
        vals[2][i] = (a - b) * (d - c);
        vals[3][i] = a * b + c * d;
        vals[4][i] = b * b - a * d + c;
    }
    vector<long long> mn(5), mx(5);
    for (int f = 0; f < 5; f++) {
        mn[f] = *min_element(vals[f].begin(), vals[f].end());
        mx[f] = *max_element(vals[f].begin(), vals[f].end());
    }
    vector<int> happy(P, 0);
    for (int f = 0; f < 5; f++)
        for (int i = 0; i < P; i++)
            if (vals[f][i] == mn[f] || vals[f][i] == mx[f]) happy[i]++;
    int mxh = *max_element(happy.begin(), happy.end());
    int cnt = 0;
    for (int h : happy) if (h == mxh) cnt++;
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `from itertools import permutations

def main():
    B = list(map(int, input().split()))
    perms = list(permutations(B))
    P = len(perms)
    vals = [[0] * P for _ in range(5)]
    for i, (a, b, c, d) in enumerate(perms):
        vals[0][i] = a * d - b * c
        vals[1][i] = a + d - b - c
        vals[2][i] = (a - b) * (d - c)
        vals[3][i] = a * b + c * d
        vals[4][i] = b * b - a * d + c
    mn = [min(v) for v in vals]
    mx = [max(v) for v in vals]
    happy = [0] * P
    for f in range(5):
        for i in range(P):
            if vals[f][i] == mn[f] or vals[f][i] == mx[f]:
                happy[i] += 1
    mxh = max(happy)
    print(sum(1 for h in happy if h == mxh))

main()
`,
    tests: ["-1 -5 2 6\n", "1 5 10 0\n", "3 -3 7 -7\n", "100 -100 50 -50\n", "2 4 6 8\n"],
  },
  {
    slug: "concurs-mi-ub-2026-modele-ai",
    title: "Concurs MI UB 2026 - Ordinea optima a modelelor IA",
    difficulty: "hard",
    tags: ["concurs", "mateinfo-ub", "2026", "probabilitati"],
    statement:
      "Alex are de rezolvat un exercitiu si poate apela, contra cost, la N modele IA. Modelul i rezolva exercitiul cu probabilitatea p_i% (independent de celelalte) si costa c_i lei pentru o incercare. Alex plateste costul de fiecare data cand cere unui model sa incerce, indiferent de rezultat. Daca modelul reuseste, Alex se opreste; daca nu reuseste, poate incerca urmatorul model, in orice ordine alege, dar niciodata acelasi model de doua ori.\n\nSe garanteaza ca cel putin unul dintre modele are probabilitate de succes 100%, deci procesul se termina mereu.\n\nCerinta: determinati costul mediu (asteptat) minim pe care il plateste Alex, alegand ordinea optima de incercare a modelelor. Raspunsul se afiseaza ca fractie ireductibila p/q.",
    input_format: "Pe prima linie: N.\nUrmeaza N linii, fiecare continand costul c_i (lei) si probabilitatea p_i (numar intreg intre 1 si 100, reprezentand procente) a modelului i.",
    output_format: "Se afiseaza costul mediu minim, ca fractie ireductibila p/q.",
    constraints: "2 <= N <= 6\n1 <= c_i <= 100\n1 <= p_i <= 100\ncel putin un model are p_i = 100",
    hints:
      "Optimul se obtine incercand modelele in ordinea crescatoare a raportului cost/probabilitate (c_i/p_i); pentru a compara doua rapoarte fara numere reale, se foloseste inmultirea incrucisata c_i*p_j vs c_j*p_i.\nDupa stabilirea ordinii, costul mediu total este suma costurilor fiecarui model inmultite cu probabilitatea ca toate modelele incercate inaintea lui sa fi esuat, adica produsul (1-p_j) pentru toate modelele j incercate anterior.\nPentru a evita erorile de rotunjire, se lucreaza cu fractii exacte (procentele ca numitor comun de puteri ale lui 100) si se simplifica rezultatul final prin cel mai mare divizor comun.",
    explanation:
      "Se foloseste un argument de schimb (exchange argument): pentru doua modele consecutive i si j, ordinea i inaintea lui j este mai buna daca si numai daca c_i/p_i <= c_j/p_j, deci ordinea optima globala sorteaza modelele crescator dupa acest raport (comparat prin inmultire incrucisata, pentru precizie exacta). Odata stabilita ordinea, costul mediu total este suma, pentru fiecare pozitie, a costului modelului respectiv inmultit cu probabilitatea ca toate modelele anterioare sa fi esuat (produsul termenilor (1-p_j/100) pentru modelele j incercate inaintea sa). Deoarece cel putin un model are probabilitate 100%, acest produs devine 0 dupa el, deci suma este finita. Toate calculele se fac cu numere intregi, folosind un numitor comun 100^(N-1), pentru a obtine rezultatul exact ca fractie, apoi se simplifica prin cel mai mare divizor comun.",
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    int n;
    cin >> n;
    vector<long long> c(n), p(n);
    for (int i = 0; i < n; i++) cin >> c[i] >> p[i];
    vector<int> order(n);
    iota(order.begin(), order.end(), 0);
    sort(order.begin(), order.end(), [&](int i, int j) {
        long long lhs = c[i] * p[j];
        long long rhs = c[j] * p[i];
        if (lhs != rhs) return lhs < rhs;
        return i < j;
    });
    long long denom = 1;
    for (int i = 0; i < n - 1; i++) denom *= 100;
    long long numer = 0;
    long long prodfail = 1;
    for (int pos = 0; pos < n; pos++) {
        int mi = order[pos];
        long long scale = 1;
        for (int k = 0; k < n - 1 - pos; k++) scale *= 100;
        numer += c[mi] * prodfail * scale;
        prodfail *= (100 - p[mi]);
    }
    long long g = __gcd(numer, denom);
    cout << (numer / g) << "/" << (denom / g) << "\\n";
    return 0;
}
`,
    py: `import math
import functools

def main():
    n = int(input())
    c = [0] * n
    p = [0] * n
    for i in range(n):
        ci, pi = map(int, input().split())
        c[i] = ci
        p[i] = pi
    order = list(range(n))

    def cmp(i, j):
        lhs = c[i] * p[j]
        rhs = c[j] * p[i]
        if lhs < rhs: return -1
        if lhs > rhs: return 1
        return i - j

    order.sort(key=functools.cmp_to_key(cmp))
    denom = 100 ** (n - 1)
    numer = 0
    prodfail = 1
    for pos, mi in enumerate(order):
        scale = 100 ** (n - 1 - pos)
        numer += c[mi] * prodfail * scale
        prodfail *= (100 - p[mi])
    g = math.gcd(numer, denom)
    print(f"{numer // g}/{denom // g}")

main()
`,
    tests: [
      "5\n4 30\n10 40\n15 70\n20 80\n25 100\n",
      "3\n5 50\n10 100\n3 20\n",
      "4\n8 25\n12 60\n6 10\n20 100\n",
      "6\n2 10\n3 15\n4 20\n5 25\n6 30\n30 100\n",
      "3\n1 50\n1 50\n1 100\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2026-microservicii",
    title: "Concurs MI UB 2026 - Pornirea microserviciilor",
    difficulty: "hard",
    tags: ["concurs", "mateinfo-ub", "2026", "programare-dinamica"],
    statement:
      "O aplicatie este formata din n microservicii, numerotate de la 1 la n. Microserviciul X nu poate fi pornit decat dupa ce toate microserviciile Y, cu Y divizor propriu al lui X (Y < X si X divizibil cu Y), au fost deja pornite.\n\nAplicatia este initial complet oprita. La fiecare minut se porneste exact un microserviciu. Cerinta: determinati in cate moduri diferite pot fi pornite, pe rand, toate cele n microservicii, respectand restrictiile de precedenta.",
    input_format: "Se citeste, pe o singura linie, numarul natural n.",
    output_format: "Se afiseaza numarul de ordini valide de pornire a celor n microservicii.",
    constraints: "1 <= n <= 16",
    hints:
      "Se foloseste o programare dinamica pe submultimi (bitmask): dp[mask] = numarul de moduri de a ajunge in starea in care exact microserviciile din mask au fost pornite.\nO submultime mask este valida doar daca fiecare microserviciu din ea are toti divizorii proprii tot in mask.\nTranzitia adauga, pe rand, cate un microserviciu Y neinclus in mask, pentru care toti divizorii sai proprii se afla deja in mask.",
    explanation:
      "Se precalculeaza pentru fiecare microserviciu Y masca de biti a divizorilor sai proprii (numerele X < Y cu Y divizibil cu X). Se defineste dp[mask] = numarul de secvente valide de pornire care ajung exact la multimea de microservicii pornite mask, cu dp[0]=1. Se parcurg toate mastile in ordine crescatoare; pentru fiecare mask cu dp[mask] > 0, se incearca adaugarea fiecarui microserviciu Y neincsu inca, iar daca toti divizorii proprii ai lui Y sunt deja continuti in mask (verificat printr-un AND pe biti), se adauga dp[mask] la dp[mask | bit(Y)]. Raspunsul final este dp[(1<<n)-1], numarul de moduri de a ajunge la starea in care toate microserviciile sunt pornite.",
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    int n;
    cin >> n;
    vector<int> divmask(n + 1, 0);
    for (int y = 1; y <= n; y++) {
        for (int x = 1; x <= n; x++) {
            if (x != y && y % x == 0) divmask[y] |= (1 << (x - 1));
        }
    }
    int full = (1 << n) - 1;
    vector<long long> dp(1 << n, 0);
    dp[0] = 1;
    for (int mask = 0; mask <= full; mask++) {
        if (dp[mask] == 0) continue;
        for (int y = 1; y <= n; y++) {
            int bit = 1 << (y - 1);
            if (mask & bit) continue;
            if ((mask & divmask[y]) == divmask[y]) {
                dp[mask | bit] += dp[mask];
            }
        }
    }
    cout << dp[full] << "\\n";
    return 0;
}
`,
    py: `def main():
    n = int(input())
    divmask = [0] * (n + 1)
    for y in range(1, n + 1):
        for x in range(1, n + 1):
            if x != y and y % x == 0:
                divmask[y] |= (1 << (x - 1))
    full = (1 << n) - 1
    dp = [0] * (1 << n)
    dp[0] = 1
    for mask in range(full + 1):
        if dp[mask] == 0:
            continue
        for y in range(1, n + 1):
            bit = 1 << (y - 1)
            if mask & bit:
                continue
            if (mask & divmask[y]) == divmask[y]:
                dp[mask | bit] += dp[mask]
    print(dp[full])

main()
`,
    tests: ["1\n", "4\n", "6\n", "10\n", "16\n"],
  },
  {
    slug: "concurs-mi-ub-2026-secvente-divizibile",
    title: "Concurs MI UB 2026 - Secvente cu sume de prefix divizibile",
    difficulty: "hard",
    tags: ["concurs", "mateinfo-ub", "2026", "programare-dinamica"],
    statement:
      "Se aleg 100000 de numere a_1, a_2, ..., a_100000, fiecare din multimea {1, 2, ..., M}. Se noteaza S_i = a_1 + a_2 + ... + a_i suma primilor i termeni. Secventa se numeste valida daca, pentru fiecare i de la 1 la 100000, S_i este divizibil cu i.\n\nCerinta: determinati cate secvente valide exista, pentru un M dat.",
    input_format: "Se citeste, pe o singura linie, numarul natural M.",
    output_format: "Se afiseaza numarul de secvente valide.",
    constraints: "2 <= M <= 14",
    hints:
      "Conditia i | S_i inseamna ca media primilor i termeni, b_i = S_i / i, este un numar intreg din {1,...,M}.\nIntre doua medii consecutive b_{i-1}=x si b_i=y, urmatorul termen este a_i = i*y - (i-1)*x, care trebuie sa fie in {1,...,M}.\nSe arata ca, incepand de la i=M, media nu se mai poate schimba (orice schimbare ar scoate a_i din intervalul valid), deci este suficient sa se numere posibilitatile pentru primele M-1 medii, folosind o programare dinamica pe valoarea mediei curente.",
    explanation:
      "Deoarece fiecare termen a_i este intre 1 si M, media b_i = S_i/i (care este intreaga, din ipoteza de divizibilitate) trebuie sa fie de asemenea in {1,...,M}. Se defineste o programare dinamica dp[x] = numarul de moduri de a ajunge la media x dupa un anumit numar de pasi. Pentru trecerea de la pasul i-1 (media x) la pasul i (media y), noul termen este a_i = i*y - (i-1)*x si trebuie sa fie in intervalul [1,M]. Se demonstreaza ca pentru i >= M, singura tranzitie posibila este cea care pastreaza media neschimbata (y=x), deci evolutia mediei se \"blocheaza\" dupa cel mult M-1 pasi si secventa se poate prelungi apoi in mod unic pana la lungimea 100000. De aceea este suficient sa se calculeze dp dupa exact M-1 pasi (pornind de la dp initial, cu fiecare valoare din {1,...,M} posibila pentru b_1) si sa se insumeze toate valorile ramase.",
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    int M;
    cin >> M;
    vector<long long> dp(M + 1, 0);
    for (int v = 1; v <= M; v++) dp[v] = 1;
    for (int i = 2; i < M; i++) {
        vector<long long> ndp(M + 1, 0);
        for (int x = 1; x <= M; x++) {
            if (dp[x] == 0) continue;
            for (int y = 1; y <= M; y++) {
                long long a = (long long)i * y - (long long)(i - 1) * x;
                if (a >= 1 && a <= M) ndp[y] += dp[x];
            }
        }
        dp = ndp;
    }
    long long total = 0;
    for (int v = 1; v <= M; v++) total += dp[v];
    cout << total << "\\n";
    return 0;
}
`,
    py: `def main():
    M = int(input())
    dp = [0] * (M + 1)
    for v in range(1, M + 1):
        dp[v] = 1
    for i in range(2, M):
        ndp = [0] * (M + 1)
        for x in range(1, M + 1):
            if dp[x] == 0:
                continue
            for y in range(1, M + 1):
                a = i * y - (i - 1) * x
                if 1 <= a <= M:
                    ndp[y] += dp[x]
        dp = ndp
    print(sum(dp))

main()
`,
    tests: ["10\n", "2\n", "5\n", "8\n", "12\n"],
  },
  {
    slug: "concurs-mi-ub-2026-parole-fara-border",
    title: "Concurs MI UB 2026 - Parole fara border",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2026", "combinatorica"],
    statement:
      "Se considera un alfabet cu K litere. O parola (sir de litere din acest alfabet) se numeste speciala daca nu exista nicio secventa nevida si strict mai scurta decat parola intreaga care sa apara atat la inceputul parolei, cat si la finalul ei (adica parola nu are niciun \"border\": niciun prefix propriu nevid nu este egal cu un sufix propriu nevid).\n\nDe exemplu, pentru alfabetul {a,e,i,o,u}, parola \"aeiio\" este speciala, dar \"uueiuu\" nu este speciala, deoarece secventa \"uu\" apare atat la inceput cat si la final.\n\nCerinta: pentru un alfabet cu K litere si o lungime N data, determinati cate parole speciale de lungime N pot fi formate.",
    input_format: "Se citesc, pe o singura linie, doua numere naturale K si N.",
    output_format: "Se afiseaza numarul de parole speciale de lungime N peste un alfabet cu K litere.",
    constraints: "2 <= K <= 10\n1 <= N <= 18\n(se garanteaza ca rezultatele intermediare incap in intregi pe 64 de biti)",
    hints:
      "Se noteaza u_n numarul de parole speciale de lungime n; totalul parolelor de lungime n este K^n.\nO parola nespeciala are cel mai scurt border de o anumita lungime i (1 <= i <= n/2); ea are forma x y x, unde x (de lungime i) este el insusi o parola speciala, iar mijlocul y (de lungime n-2i) este arbitrar.\nRecurenta este u_n = K^n - suma, pentru i de la 1 la floor(n/2), a lui u_i * K^(n-2i).",
    explanation:
      "Se aplica direct recurenta din rationamentul dat: u_n reprezinta numarul de cuvinte fara border de lungime n. Un cuvant care NU este special are un cel-mai-scurt border de o lungime i (intre 1 si n/2); un astfel de cuvant este determinat unic de un prefix-sufix x de lungime i (care trebuie sa fie el insusi fara border, deci exista u_i variante) si de un mijloc y de lungime n-2i, ales arbitrar din cele K^(n-2i) posibilitati. Insumand aceste cazuri pentru toate lungimile posibile de border si scazand din totalul K^n, se obtine formula u_n = K^n - suma_{i=1}^{floor(n/2)} u_i * K^(n-2i). Se calculeaza u_1, u_2, ..., u_N in ordine, folosind valorile deja calculate.",
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    long long K, N;
    cin >> K >> N;
    vector<long long> u(N + 1, 0);
    vector<long long> pw(N + 1, 1);
    for (int i = 1; i <= N; i++) pw[i] = pw[i-1] * K;
    for (int n = 1; n <= N; n++) {
        long long val = pw[n];
        for (int i = 1; i <= n / 2; i++) {
            val -= u[i] * pw[n - 2 * i];
        }
        u[n] = val;
    }
    cout << u[N] << "\\n";
    return 0;
}
`,
    py: `def main():
    K, N = map(int, input().split())
    u = [0] * (N + 1)
    pw = [1] * (N + 1)
    for i in range(1, N + 1):
        pw[i] = pw[i - 1] * K
    for n in range(1, N + 1):
        val = pw[n]
        for i in range(1, n // 2 + 1):
            val -= u[i] * pw[n - 2 * i]
        u[n] = val
    print(u[N])

main()
`,
    tests: ["5 10\n", "2 4\n", "5 5\n", "3 8\n", "10 6\n"],
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
