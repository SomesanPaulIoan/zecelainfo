const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade11", chapter: "dp", sub: "dp-definitorii" };

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

const DP_NOTE = "Rezolvati problema obligatoriu prin metoda Programarii Dinamice: definiti clar starile subproblemelor si relatia de recurenta dintre ele, apoi calculati solutiile in ordinea corecta (de la subprobleme mai mici catre cele mai mari), memorand rezultatele intermediare pentru a evita recalcularea lor.";

const problems = [
  // ===================== GRUPA A: 1D PE UN SINGUR SIR =====================
  {
    slug: "dp-treptelor-cost-minim",
    title: "Problema treptelor - costul minim",
    difficulty: "easy",
    tags: ["dp", "1d"],
    statement: "Se citesc n trepte ale unei scari, fiecare cu un cost asociat. Puteti incepe urcarea de pe treapta 0 sau de pe treapta 1 (fara niciun cost initial) si, din orice treapta, puteti urca fie o treapta, fie doua trepte deodata, platind de fiecare data costul treptei pe care ajungeti. Determinati, folosind Programarea Dinamica, costul minim pentru a ajunge dincolo de ultima treapta (dupa treapta n-1).",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n costuri.",
    output_format: "Se afiseaza un singur numar: costul minim total.",
    constraints: "1 <= n <= 100000, 0 <= cost <= 1000",
    hints: "Definiti dp[i] = costul minim pentru a ajunge PE treapta i. dp[i] = cost[i] + min(dp[i-1], dp[i-2]), cu dp[0]=cost[0] si dp[1]=cost[1] (se poate porni gratuit de pe oricare dintre ele). Raspunsul este min(dp[n-1], dp[n-2]), deoarece se poate ajunge dincolo de ultima treapta sarind fie de pe ultima, fie de pe penultima.",
    explanation: `${DP_NOTE} Starea dp[i] retine costul minim de a ajunge exact pe treapta i; recurenta considera cele doua moduri posibile de a ajunge acolo (dintr-un salt de 1 sau de 2 trepte).\n\n**Complexitate:** O(n) timp, O(n) memorie (poate fi redusa la O(1))`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> cost(n);
    for (auto& x : cost) cin >> x;
    if (n == 1) { cout << 0 << "\\n"; return 0; }
    vector<long long> dp(n);
    dp[0] = cost[0]; dp[1] = cost[1];
    for (int i = 2; i < n; i++) dp[i] = cost[i] + min(dp[i - 1], dp[i - 2]);
    cout << min(dp[n - 1], dp[n - 2]) << "\\n";
    return 0;
}
`,
    py: `n = int(input())
cost = list(map(int, input().split()))
if n == 1:
    print(0)
else:
    dp = [0] * n
    dp[0] = cost[0]
    dp[1] = cost[1]
    for i in range(2, n):
        dp[i] = cost[i] + min(dp[i - 1], dp[i - 2])
    print(min(dp[n - 1], dp[n - 2]))
`,
    tests: ["2\n10 15", "3\n10 15 20", "4\n1 100 1 1", "1\n5", "5\n1 2 3 4 5"],
  },
  {
    slug: "dp-suma-maxima-subsecventa-consecutiva",
    title: "Suma maxima a unei subsecvente de elemente consecutive",
    difficulty: "easy",
    tags: ["dp", "1d"],
    statement: "Se citesc n numere intregi. Determinati, folosind Programarea Dinamica, suma maxima a unei subsecvente NEVIDE de elemente CONSECUTIVE (algoritmul lui Kadane).",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza un singur numar: suma maxima a unei subsecvente consecutive.",
    constraints: "1 <= n <= 100000, -10^9 <= element <= 10^9",
    hints: "Definiti dp[i] = suma maxima a unei subsecvente consecutive care se termina EXACT pe pozitia i. dp[i] = a[i] + max(dp[i-1], 0): fie extindeti subsecventa anterioara (daca aduce un plus pozitiv), fie incepeti una noua de la a[i].",
    explanation: `${DP_NOTE} Starea dp[i] fortata sa se termine pe pozitia i permite o recurenta simpla de tip 'extinde sau reincepe'; raspunsul final este maximul tuturor valorilor dp[i].\n\n**Complexitate:** O(n) timp, O(1) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    long long dp = a[0], best = a[0];
    for (int i = 1; i < n; i++) {
        dp = a[i] + max(dp, 0LL);
        best = max(best, dp);
    }
    cout << best << "\\n";
    return 0;
}
`,
    py: `n = int(input())
a = list(map(int, input().split()))
dp = a[0]
best = a[0]
for i in range(1, n):
    dp = a[i] + max(dp, 0)
    best = max(best, dp)
print(best)
`,
    tests: ["5\n-2 1 -3 4 -1", "1\n-5", "4\n-1 -2 -3 -4", "6\n5 4 -1 7 8 2", "3\n1 2 3"],
  },
  {
    slug: "dp-produs-maxim-subsecventa-consecutiva",
    title: "Produsul maxim al unei subsecvente de elemente consecutive",
    difficulty: "medium",
    tags: ["dp", "1d"],
    statement: "Se citesc n numere intregi. Determinati, folosind Programarea Dinamica, produsul maxim al unei subsecvente NEVIDE de elemente CONSECUTIVE.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza un singur numar: produsul maxim al unei subsecvente consecutive.",
    constraints: "1 <= n <= 100000, -20 <= element <= 20",
    hints: "Deoarece produsul a doua numere negative este pozitiv, retineti la fiecare pas atat produsul maxim, cat si produsul minim al unei subsecvente consecutive care se termina pe pozitia curenta; un element negativ poate transforma minimul anterior in noul maxim.",
    explanation: `${DP_NOTE} Spre deosebire de suma maxima, la produs este necesar sa retinem SIMULTAN doua stari (maxim si minim care se termina in pozitia curenta), deoarece inmultirea cu un numar negativ poate transforma minimul intr-un nou maxim.\n\n**Complexitate:** O(n) timp, O(1) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    long long maxEnd = a[0], minEnd = a[0], best = a[0];
    for (int i = 1; i < n; i++) {
        long long x = a[i];
        long long candMax = max({x, x * maxEnd, x * minEnd});
        long long candMin = min({x, x * maxEnd, x * minEnd});
        maxEnd = candMax; minEnd = candMin;
        best = max(best, maxEnd);
    }
    cout << best << "\\n";
    return 0;
}
`,
    py: `n = int(input())
a = list(map(int, input().split()))
maxEnd = minEnd = best = a[0]
for i in range(1, n):
    x = a[i]
    candMax = max(x, x * maxEnd, x * minEnd)
    candMin = min(x, x * maxEnd, x * minEnd)
    maxEnd, minEnd = candMax, candMin
    best = max(best, maxEnd)
print(best)
`,
    tests: ["4\n2 3 -2 4", "3\n-2 0 -1", "5\n2 -5 -2 -4 3", "1\n0", "4\n-1 -2 -3 -4"],
  },
  {
    slug: "dp-profit-maxim-o-tranzactie",
    title: "Profitul maxim dintr-o singura tranzactie",
    difficulty: "easy",
    tags: ["dp", "1d"],
    statement: "Se citesc n preturi ale unei actiuni, cate unul pentru fiecare din n zile consecutive. Determinati, folosind Programarea Dinamica, profitul maxim ce se poate obtine cumparand actiunea intr-o zi si vanzand-o intr-o zi ulterioara (o singura tranzactie completa). Daca nu se poate obtine niciun profit, afisati 0.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n preturi.",
    output_format: "Se afiseaza un singur numar: profitul maxim posibil (sau 0 daca nu exista profit).",
    constraints: "1 <= n <= 100000, 0 <= pret <= 10^9",
    hints: "Parcurgeti preturile, retinand cel mai mic pret intalnit pana in acel moment (cel mai bun moment de cumparare de pana atunci) si actualizand profitul maxim ca diferenta dintre pretul curent si acest minim.",
    explanation: `${DP_NOTE} Starea implicita retinuta este 'cel mai mic pret de cumparare posibil pana in ziua curenta'; profitul maxim daca am vinde in ziua curenta se calculeaza direct din aceasta stare, fara a fi nevoie sa retestam toate zilele anterioare de cumparare.\n\n**Complexitate:** O(n) timp, O(1) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> pret(n);
    for (auto& x : pret) cin >> x;
    long long minPret = pret[0], profit = 0;
    for (int i = 1; i < n; i++) {
        profit = max(profit, pret[i] - minPret);
        minPret = min(minPret, pret[i]);
    }
    cout << profit << "\\n";
    return 0;
}
`,
    py: `n = int(input())
pret = list(map(int, input().split()))
minPret = pret[0]
profit = 0
for i in range(1, n):
    profit = max(profit, pret[i] - minPret)
    minPret = min(minPret, pret[i])
print(profit)
`,
    tests: ["6\n7 1 5 3 6 4", "5\n7 6 4 3 1", "1\n5", "4\n1 2 3 4", "2\n2 1"],
  },
  {
    slug: "dp-suma-maxima-elemente-neconsecutive",
    title: "Suma maxima a unor elemente neconsecutive",
    difficulty: "medium",
    tags: ["dp", "1d"],
    statement: "Se citesc n numere naturale asezate la rand. Determinati, folosind Programarea Dinamica, suma maxima ce se poate obtine alegand o submultime de elemente, astfel incat niciodata doua elemente alese sa nu fie vecine (consecutive) in sirul initial.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza un singur numar: suma maxima obtinuta.",
    constraints: "1 <= n <= 100000, 0 <= element <= 10^4",
    hints: "Definiti dp[i] = suma maxima obtinuta considerand doar primele i elemente. Pentru elementul i, aveti doua optiuni: fie nu il alegeti (dp[i]=dp[i-1]), fie il alegeti, caz in care elementul i-1 nu poate fi ales (dp[i]=dp[i-2]+a[i]). Pastrati maximul dintre cele doua.",
    explanation: `${DP_NOTE} Recurenta dp[i] = max(dp[i-1], dp[i-2] + a[i]) surprinde exact cele doua alegeri posibile pentru fiecare element (inclus sau nu), fara a permite niciodata doua elemente alaturate simultan incluse.\n\n**Complexitate:** O(n) timp, O(1) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    long long prev2 = 0, prev = 0;
    for (int i = 0; i < n; i++) {
        long long cur = max(prev, prev2 + a[i]);
        prev2 = prev; prev = cur;
    }
    cout << prev << "\\n";
    return 0;
}
`,
    py: `n = int(input())
a = list(map(int, input().split()))
prev2 = prev = 0
for i in range(n):
    cur = max(prev, prev2 + a[i])
    prev2, prev = prev, cur
print(prev)
`,
    tests: ["4\n1 2 3 1", "5\n2 7 9 3 1", "1\n5", "2\n5 1", "6\n5 5 10 100 10 5"],
  },
  {
    slug: "dp-suma-maxima-elemente-neconsecutive-circular",
    title: "Suma maxima a unor elemente neconsecutive asezate in cerc",
    difficulty: "hard",
    tags: ["dp", "1d"],
    statement: "Se citesc n numere naturale asezate in CERC (primul si ultimul element sunt considerate vecine). Determinati, folosind Programarea Dinamica, suma maxima ce se poate obtine alegand o submultime de elemente astfel incat niciodata doua elemente vecine (in sensul circular) sa nu fie alese simultan.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza un singur numar: suma maxima obtinuta.",
    constraints: "1 <= n <= 100000, 0 <= element <= 10^4",
    hints: "Daca elementul 1 este ales, elementul n nu mai poate fi ales, si invers; deci raspunsul este maximul dintre rezolvarea problemei liniare (fara caracterul circular) pe elementele 1..n-1, respectiv pe elementele 2..n. Pentru n=1, raspunsul este pur si simplu singurul element.",
    explanation: `${DP_NOTE} Constrangerea circulara este redusa la doua aplicari ale problemei liniare deja cunoscute (suma maxima a unor elemente neconsecutive), fiecare excluzand cate unul dintre cele doua capete care ar putea intra in conflict circular; maximul celor doua rezultate este raspunsul corect.\n\n**Complexitate:** O(n) timp, O(1) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long robLiniar(vector<long long>& a, int lo, int hi) {
    long long prev2 = 0, prev = 0;
    for (int i = lo; i <= hi; i++) {
        long long cur = max(prev, prev2 + a[i]);
        prev2 = prev; prev = cur;
    }
    return prev;
}
int main() {
    int n; cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    if (n == 1) { cout << a[0] << "\\n"; return 0; }
    cout << max(robLiniar(a, 0, n - 2), robLiniar(a, 1, n - 1)) << "\\n";
    return 0;
}
`,
    py: `def rob_liniar(a, lo, hi):
    prev2 = prev = 0
    for i in range(lo, hi + 1):
        cur = max(prev, prev2 + a[i])
        prev2, prev = prev, cur
    return prev

n = int(input())
a = list(map(int, input().split()))
if n == 1:
    print(a[0])
else:
    print(max(rob_liniar(a, 0, n - 2), rob_liniar(a, 1, n - 1)))
`,
    tests: ["4\n1 2 3 1", "1\n5", "3\n1 2 3", "5\n5 5 10 100 10", "2\n5 10"],
  },
  {
    slug: "dp-scm-lungime",
    title: "Subsirul crescator maximal - lungime",
    difficulty: "easy",
    tags: ["dp", "1d", "scm"],
    statement: "Se citesc n numere. Determinati, folosind Programarea Dinamica, lungimea celui mai lung subsir CRESCATOR (strict) al sirului (elementele subsirului pastreaza ordinea din sirul initial, dar nu este obligatoriu sa fie consecutive).",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza un singur numar: lungimea celui mai lung subsir crescator.",
    constraints: "1 <= n <= 1000, -10^9 <= element <= 10^9",
    hints: "Definiti dp[i] = lungimea celui mai lung subsir crescator ce se termina EXACT pe pozitia i. Pentru a calcula dp[i], cautati toate pozitiile j < i cu a[j] < a[i] si luati 1 + maximul dp[j] gasit (sau doar 1, daca nu exista niciun astfel de j).",
    explanation: `${DP_NOTE} Fortarea subsirului sa se termine exact in pozitia i permite o recurenta clara: dp[i] = 1 + max(dp[j]) pentru toti j < i cu a[j] < a[i]. Raspunsul final este maximul tuturor valorilor dp[i].\n\n**Complexitate:** O(n^2) timp, O(n) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    vector<int> dp(n, 1);
    for (int i = 0; i < n; i++)
        for (int j = 0; j < i; j++)
            if (a[j] < a[i]) dp[i] = max(dp[i], dp[j] + 1);
    cout << *max_element(dp.begin(), dp.end()) << "\\n";
    return 0;
}
`,
    py: `n = int(input())
a = list(map(int, input().split()))
dp = [1] * n
for i in range(n):
    for j in range(i):
        if a[j] < a[i]:
            dp[i] = max(dp[i], dp[j] + 1)
print(max(dp))
`,
    tests: ["8\n10 9 2 5 3 7 101 18", "1\n5", "5\n1 2 3 4 5", "5\n5 4 3 2 1", "6\n0 1 0 3 2 3"],
  },
  {
    slug: "dp-scm-afisare",
    title: "Subsirul crescator maximal - afisare",
    difficulty: "medium",
    tags: ["dp", "1d", "scm"],
    statement: "Se citesc n numere. Determinati, folosind Programarea Dinamica, un subsir crescator (strict) de lungime maxima si afisati-l.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza elementele unui subsir crescator de lungime maxima, in ordinea aparitiei lor in sirul initial, separate prin spatiu.",
    constraints: "1 <= n <= 1000, -10^9 <= element <= 10^9",
    hints: "Calculati dp[i] ca la problema lungimii maxime, dar retineti si un vector 'anterior[i]' cu pozitia elementului precedent din cel mai lung subsir crescator ce se termina in i. Reconstruiti subsirul pornind de la pozitia cu dp maxim, urmarind legaturile 'anterior' inapoi.",
    explanation: `${DP_NOTE} Vectorul de legaturi 'anterior' retine, pentru fiecare pozitie, din ce pozitie anterioara a fost 'mostenita' lungimea maxima; parcurgerea acestor legaturi de la pozitia optima finala inapoi pana la inceput reconstruieste un subsir efectiv, nu doar lungimea lui.\n\n**Complexitate:** O(n^2) timp, O(n) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    vector<int> dp(n, 1), anterior(n, -1);
    for (int i = 0; i < n; i++)
        for (int j = 0; j < i; j++)
            if (a[j] < a[i] && dp[j] + 1 > dp[i]) { dp[i] = dp[j] + 1; anterior[i] = j; }
    int best = 0;
    for (int i = 1; i < n; i++) if (dp[i] > dp[best]) best = i;
    vector<long long> rez;
    for (int cur = best; cur != -1; cur = anterior[cur]) rez.push_back(a[cur]);
    reverse(rez.begin(), rez.end());
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? ' ' : '\\n');
    return 0;
}
`,
    py: `n = int(input())
a = list(map(int, input().split()))
dp = [1] * n
anterior = [-1] * n
for i in range(n):
    for j in range(i):
        if a[j] < a[i] and dp[j] + 1 > dp[i]:
            dp[i] = dp[j] + 1
            anterior[i] = j
best = 0
for i in range(1, n):
    if dp[i] > dp[best]:
        best = i
rez = []
cur = best
while cur != -1:
    rez.append(a[cur])
    cur = anterior[cur]
rez.reverse()
print(' '.join(map(str, rez)))
`,
    tests: ["8\n10 9 2 5 3 7 101 18", "1\n5", "5\n1 2 3 4 5", "5\n5 4 3 2 1", "6\n0 1 0 3 2 3"],
  },
  {
    slug: "dp-scm-suma-maxima",
    title: "Subsirul crescator cu suma maxima",
    difficulty: "medium",
    tags: ["dp", "1d", "scm"],
    statement: "Se citesc n numere naturale. Determinati, folosind Programarea Dinamica, suma maxima a elementelor unui subsir CRESCATOR (strict) al sirului (nu neaparat cel mai lung, ci cel cu suma maxima).",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza un singur numar: suma maxima a unui subsir crescator.",
    constraints: "1 <= n <= 1000, 0 <= element <= 10^6",
    hints: "Definiti dp[i] = suma maxima a unui subsir crescator ce se termina EXACT pe pozitia i. dp[i] = a[i] + max(dp[j]) pentru toti j < i cu a[j] < a[i] (sau doar a[i], daca nu exista niciun astfel de j).",
    explanation: `${DP_NOTE} Aceeasi structura de recurenta ca la lungimea maxima a subsirului crescator, dar in loc sa adunam 1 la fiecare pas, adunam valoarea elementului curent, maximizand astfel suma in loc de numarul de elemente.\n\n**Complexitate:** O(n^2) timp, O(n) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    vector<long long> dp(n);
    for (int i = 0; i < n; i++) {
        dp[i] = a[i];
        for (int j = 0; j < i; j++)
            if (a[j] < a[i]) dp[i] = max(dp[i], dp[j] + a[i]);
    }
    cout << *max_element(dp.begin(), dp.end()) << "\\n";
    return 0;
}
`,
    py: `n = int(input())
a = list(map(int, input().split()))
dp = [0] * n
for i in range(n):
    dp[i] = a[i]
    for j in range(i):
        if a[j] < a[i]:
            dp[i] = max(dp[i], dp[j] + a[i])
print(max(dp))
`,
    tests: ["5\n1 101 2 3 100", "1\n5", "5\n1 2 3 4 5", "5\n5 4 3 2 1", "6\n10 5 4 3 2 1"],
  },

  // ===================== GRUPA B: 2D INTRE DOUA SIRURI =====================
  {
    slug: "dp-sclm-lungime",
    title: "Subsirul comun cel mai lung - lungime",
    difficulty: "easy",
    tags: ["dp", "2d", "sclm"],
    statement: "Se citesc doua siruri de caractere A si B. Determinati, folosind Programarea Dinamica, lungimea celui mai lung subsir comun al celor doua siruri (SCLM / LCS) - un subsir care apare, in aceeasi ordine (dar nu neaparat consecutiv), atat in A cat si in B.",
    input_format: "Pe prima linie se citeste sirul A. Pe a doua linie se citeste sirul B.",
    output_format: "Se afiseaza un singur numar: lungimea celui mai lung subsir comun.",
    constraints: "1 <= lungimea A, lungimea B <= 500",
    hints: "Definiti dp[i][j] = lungimea SCLM dintre primele i caractere ale lui A si primele j caractere ale lui B. Daca A[i-1]==B[j-1], dp[i][j]=dp[i-1][j-1]+1; altfel, dp[i][j]=max(dp[i-1][j], dp[i][j-1]).",
    explanation: `${DP_NOTE} Cand ultimele caractere comparate coincid, ele fac parte cu siguranta dintr-un SCLM optim; altfel, SCLM optim ignora ultimul caracter al lui A sau pe cel al lui B (oricare dintre cele doua variante da rezultatul maxim).\n\n**Complexitate:** O(n*m) timp si memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string a, b; cin >> a >> b;
    int n = a.size(), m = b.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++)
            dp[i][j] = (a[i - 1] == b[j - 1]) ? dp[i - 1][j - 1] + 1 : max(dp[i - 1][j], dp[i][j - 1]);
    cout << dp[n][m] << "\\n";
    return 0;
}
`,
    py: `a = input().strip()
b = input().strip()
n, m = len(a), len(b)
dp = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    for j in range(1, m + 1):
        if a[i - 1] == b[j - 1]:
            dp[i][j] = dp[i - 1][j - 1] + 1
        else:
            dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
print(dp[n][m])
`,
    tests: ["ABCBDAB\nBDCABA", "AGGTAB\nGXTXAYB", "ABC\nDEF", "AAAA\nAA", "abcde\nace"],
  },
  {
    slug: "dp-sclm-afisare",
    title: "Subsirul comun cel mai lung - afisare",
    difficulty: "medium",
    tags: ["dp", "2d", "sclm"],
    statement: "Se citesc doua siruri de caractere A si B. Determinati, folosind Programarea Dinamica, un subsir comun de lungime maxima al celor doua siruri si afisati-l.",
    input_format: "Pe prima linie se citeste sirul A. Pe a doua linie se citeste sirul B.",
    output_format: "Se afiseaza un subsir comun de lungime maxima.",
    constraints: "1 <= lungimea A, lungimea B <= 500",
    hints: "Calculati tabloul dp ca la problema lungimii SCLM, apoi reconstruiti subsirul pornind din dp[n][m] inapoi catre dp[0][0]: daca A[i-1]==B[j-1], acel caracter face parte din SCLM (treceti la dp[i-1][j-1]); altfel, deplasati-va spre valoarea mai mare dintre dp[i-1][j] si dp[i][j-1].",
    explanation: `${DP_NOTE} Reconstructia se face parcurgand tabloul dp de la coltul din dreapta-jos inapoi catre origine, urmand exact deciziile care au produs valoarea maxima la fiecare pas.\n\n**Complexitate:** O(n*m) timp si memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string a, b; cin >> a >> b;
    int n = a.size(), m = b.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++)
            dp[i][j] = (a[i - 1] == b[j - 1]) ? dp[i - 1][j - 1] + 1 : max(dp[i - 1][j], dp[i][j - 1]);
    string rez;
    int i = n, j = m;
    while (i > 0 && j > 0) {
        if (a[i - 1] == b[j - 1]) { rez += a[i - 1]; i--; j--; }
        else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
        else j--;
    }
    reverse(rez.begin(), rez.end());
    cout << rez << "\\n";
    return 0;
}
`,
    py: `a = input().strip()
b = input().strip()
n, m = len(a), len(b)
dp = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    for j in range(1, m + 1):
        if a[i - 1] == b[j - 1]:
            dp[i][j] = dp[i - 1][j - 1] + 1
        else:
            dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
rez = []
i, j = n, m
while i > 0 and j > 0:
    if a[i - 1] == b[j - 1]:
        rez.append(a[i - 1])
        i -= 1
        j -= 1
    elif dp[i - 1][j] >= dp[i][j - 1]:
        i -= 1
    else:
        j -= 1
rez.reverse()
print(''.join(rez))
`,
    tests: ["ABCBDAB\nBDCABA", "AGGTAB\nGXTXAYB", "ABC\nDEF", "AAAA\nAA", "abcde\nace"],
  },
  {
    slug: "dp-cea-mai-lunga-subsecventa-comuna-contigua",
    title: "Cea mai lunga subsecventa comuna contigua",
    difficulty: "medium",
    tags: ["dp", "2d"],
    statement: "Se citesc doua siruri de caractere A si B. Determinati, folosind Programarea Dinamica, lungimea celei mai lungi subsecvente CONTIGUE (substring) care apare atat in A, cat si in B.",
    input_format: "Pe prima linie se citeste sirul A. Pe a doua linie se citeste sirul B.",
    output_format: "Se afiseaza un singur numar: lungimea celei mai lungi subsecvente contigue comune.",
    constraints: "1 <= lungimea A, lungimea B <= 1000",
    hints: "Definiti dp[i][j] = lungimea celei mai lungi subsecvente contigue comune care se termina EXACT pe pozitia i-1 din A si j-1 din B. Daca A[i-1]==B[j-1], dp[i][j]=dp[i-1][j-1]+1; altfel dp[i][j]=0 (spre deosebire de subsirul comun, aici o nepotrivire intrerupe complet subsecventa).",
    explanation: `${DP_NOTE} Diferenta esentiala fata de subsirul comun (SCLM) este ca aici dp[i][j] devine 0 la orice nepotrivire, deoarece se cere continuitate stricta; raspunsul final este maximul tuturor valorilor din tabloul dp, nu neaparat dp[n][m].\n\n**Complexitate:** O(n*m) timp si memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string a, b; cin >> a >> b;
    int n = a.size(), m = b.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    int best = 0;
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++) {
            if (a[i - 1] == b[j - 1]) { dp[i][j] = dp[i - 1][j - 1] + 1; best = max(best, dp[i][j]); }
        }
    cout << best << "\\n";
    return 0;
}
`,
    py: `a = input().strip()
b = input().strip()
n, m = len(a), len(b)
dp = [[0] * (m + 1) for _ in range(n + 1)]
best = 0
for i in range(1, n + 1):
    for j in range(1, m + 1):
        if a[i - 1] == b[j - 1]:
            dp[i][j] = dp[i - 1][j - 1] + 1
            best = max(best, dp[i][j])
print(best)
`,
    tests: ["ABABC\nBABCA", "AGGTAB\nGXTXAYB", "ABC\nDEF", "AAAA\nAA", "abcxyz\nxyzabc"],
  },
  {
    slug: "dp-distanta-editare",
    title: "Distanta de editare (Levenshtein)",
    difficulty: "medium",
    tags: ["dp", "2d"],
    statement: "Se citesc doua siruri de caractere A si B. Determinati, folosind Programarea Dinamica, numarul minim de operatii (inserare, stergere sau inlocuire a unui caracter) necesare pentru a transforma sirul A in sirul B.",
    input_format: "Pe prima linie se citeste sirul A. Pe a doua linie se citeste sirul B.",
    output_format: "Se afiseaza un singur numar: distanta minima de editare.",
    constraints: "0 <= lungimea A, lungimea B <= 1000",
    hints: "Definiti dp[i][j] = distanta minima de editare intre primele i caractere ale lui A si primele j caractere ale lui B. Daca A[i-1]==B[j-1], dp[i][j]=dp[i-1][j-1]; altfel, dp[i][j]=1+min(dp[i-1][j] (stergere), dp[i][j-1] (inserare), dp[i-1][j-1] (inlocuire)).",
    explanation: `${DP_NOTE} Cele trei operatii permise corespund direct celor trei tranzitii posibile in recurenta: stergerea unui caracter din A (dp[i-1][j]), inserarea unui caracter nou (dp[i][j-1]) si inlocuirea (dp[i-1][j-1]), plus cazul special in care caracterele coincid deja si nu este nevoie de nicio operatie.\n\n**Complexitate:** O(n*m) timp si memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string a, b;
    getline(cin, a);
    getline(cin, b);
    int n = a.size(), m = b.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    for (int i = 0; i <= n; i++) dp[i][0] = i;
    for (int j = 0; j <= m; j++) dp[0][j] = j;
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++) {
            if (a[i - 1] == b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
            else dp[i][j] = 1 + min({dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]});
        }
    cout << dp[n][m] << "\\n";
    return 0;
}
`,
    py: `import sys
lines = sys.stdin.read().split('\\n')
a = lines[0] if len(lines) > 0 else ""
b = lines[1] if len(lines) > 1 else ""
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
            dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
print(dp[n][m])
`,
    tests: ["horse\nros", "intention\nexecution", "abc\nabc", "\nabc", "kitten\nsitting"],
  },
  {
    slug: "dp-interclasare-siruri",
    title: "Verificarea interclasarii a doua siruri",
    difficulty: "hard",
    tags: ["dp", "2d"],
    statement: "Se citesc trei siruri de caractere S1, S2 si S3. Verificati, folosind Programarea Dinamica, daca S3 este o interclasare (interleaving) a lui S1 si S2, adica S3 se poate obtine combinand toate caracterele lui S1 si toate caracterele lui S2, pastrand ordinea relativa a caracterelor din fiecare sir in parte (dar amestecandu-le liber intre ele).",
    input_format: "Pe prima linie se citeste S1. Pe a doua linie se citeste S2. Pe a treia linie se citeste S3.",
    output_format: "Se afiseaza DA daca S3 este o interclasare a lui S1 si S2, respectiv NU in caz contrar.",
    constraints: "0 <= lungimea S1, S2 <= 500",
    hints: "Daca lungimea S3 nu este egala cu suma lungimilor lui S1 si S2, raspunsul este imediat NU. Altfel, definiti dp[i][j] = adevarat daca primele i+j caractere din S3 se pot forma din primele i caractere ale lui S1 si primele j caractere ale lui S2. dp[i][j] este adevarat daca (dp[i-1][j] si S1[i-1]==S3[i+j-1]) SAU (dp[i][j-1] si S2[j-1]==S3[i+j-1]).",
    explanation: `${DP_NOTE} La fiecare pozitie a lui S3, urmatorul caracter trebuie sa provina fie din S1, fie din S2; starea dp[i][j] retine daca este posibil sa se ajunga la o interclasare valida a primelor i caractere din S1 cu primele j din S2, formand exact primele i+j caractere din S3.\n\n**Complexitate:** O(n*m) timp si memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s1, s2, s3;
    getline(cin, s1);
    getline(cin, s2);
    getline(cin, s3);
    int n = s1.size(), m = s2.size();
    if ((int)s3.size() != n + m) { cout << "NU\\n"; return 0; }
    vector<vector<bool>> dp(n + 1, vector<bool>(m + 1, false));
    dp[0][0] = true;
    for (int i = 0; i <= n; i++) {
        for (int j = 0; j <= m; j++) {
            if (i > 0 && dp[i - 1][j] && s1[i - 1] == s3[i + j - 1]) dp[i][j] = true;
            if (j > 0 && dp[i][j - 1] && s2[j - 1] == s3[i + j - 1]) dp[i][j] = true;
        }
    }
    cout << (dp[n][m] ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `import sys
lines = sys.stdin.read().split('\\n')
s1 = lines[0] if len(lines) > 0 else ""
s2 = lines[1] if len(lines) > 1 else ""
s3 = lines[2] if len(lines) > 2 else ""
n, m = len(s1), len(s2)
if len(s3) != n + m:
    print("NU")
else:
    dp = [[False] * (m + 1) for _ in range(n + 1)]
    dp[0][0] = True
    for i in range(n + 1):
        for j in range(m + 1):
            if i > 0 and dp[i - 1][j] and s1[i - 1] == s3[i + j - 1]:
                dp[i][j] = True
            if j > 0 and dp[i][j - 1] and s2[j - 1] == s3[i + j - 1]:
                dp[i][j] = True
    print("DA" if dp[n][m] else "NU")
`,
    tests: ["aabcc\ndbbca\naadbbcbcac", "aabcc\ndbbca\naadbbbaccc", "\n\n", "abc\n\nabc", "ab\nc\nabc"],
  },
  {
    slug: "dp-word-break-decizie",
    title: "Impartirea unui sir in cuvinte dintr-un dictionar",
    difficulty: "medium",
    tags: ["dp", "1d", "siruri"],
    statement: "Se citesc un sir S si un dictionar cu n cuvinte. Verificati, folosind Programarea Dinamica, daca sirul S poate fi impartit intr-o secventa de unul sau mai multe cuvinte din dictionar (un cuvant poate fi folosit de oricate ori).",
    input_format: "Pe prima linie se citeste sirul S. Pe a doua linie se citeste n. Pe a treia linie se citesc cele n cuvinte ale dictionarului.",
    output_format: "Se afiseaza DA daca S poate fi impartit in cuvinte din dictionar, respectiv NU in caz contrar.",
    constraints: "1 <= lungimea S <= 1000, 1 <= n <= 1000, 1 <= lungimea unui cuvant <= 20",
    hints: "Definiti dp[i] = adevarat daca prefixul S[0..i) poate fi impartit complet in cuvinte din dictionar. dp[0]=adevarat. Pentru fiecare i, cautati un j<i cu dp[j] adevarat si S[j..i) un cuvant din dictionar.",
    explanation: `${DP_NOTE} Starea dp[i] retine doar daca prefixul de lungime i este segmentabil, nu si CUM anume; pentru a o calcula, este suficient sa gasim un singur punct de taiere j valid, nu toate posibilitatile.\n\n**Complexitate:** O(lungime(S)^2) timp (folosind un set de cuvinte pentru cautare rapida)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    int n; cin >> n;
    set<string> dict;
    for (int i = 0; i < n; i++) { string w; cin >> w; dict.insert(w); }
    int len = s.size();
    vector<bool> dp(len + 1, false);
    dp[0] = true;
    for (int i = 1; i <= len; i++) {
        for (int j = 0; j < i; j++) {
            if (dp[j] && dict.count(s.substr(j, i - j))) { dp[i] = true; break; }
        }
    }
    cout << (dp[len] ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s = input().strip()
n = int(input())
dict_cuvinte = set(input().split())
length = len(s)
dp = [False] * (length + 1)
dp[0] = True
for i in range(1, length + 1):
    for j in range(i):
        if dp[j] and s[j:i] in dict_cuvinte:
            dp[i] = True
            break
print("DA" if dp[length] else "NU")
`,
    tests: [
      "leetcode\n2\nleet code",
      "applepenapple\n2\napple pen",
      "catsandog\n5\ncats dog sand and cat",
      "a\n1\nb",
      "aaaaaaa\n2\naaaa aaa",
    ],
  },

  // ===================== GRUPA C: PALINDROMURI =====================
  {
    slug: "dp-cel-mai-lung-subsir-palindromic",
    title: "Cel mai lung subsir palindromic",
    difficulty: "medium",
    tags: ["dp", "palindrom", "interval"],
    statement: "Se citeste un sir de caractere S. Determinati, folosind Programarea Dinamica, lungimea celui mai lung subsir (nu neaparat contiguu) al lui S care este palindrom.",
    input_format: "Se citeste sirul S.",
    output_format: "Se afiseaza un singur numar: lungimea celui mai lung subsir palindromic.",
    constraints: "1 <= lungimea S <= 1000",
    hints: "Definiti dp[i][j] = lungimea celui mai lung subsir palindromic in S[i..j]. Daca S[i]==S[j], dp[i][j]=dp[i+1][j-1]+2 (sau 2, daca j=i+1); altfel, dp[i][j]=max(dp[i+1][j], dp[i][j-1]). Calculati valorile in ordinea crescatoare a lungimii intervalului.",
    explanation: `${DP_NOTE} Aceasta este o problema clasica de tip 'interval DP': subproblemele sunt intervale [i,j] ale sirului, iar recurenta reduce fiecare interval fie la un interval interior mai mic (cand capetele coincid), fie la unul dintre cele doua subintervale obtinute prin eliminarea unui capat.\n\n**Complexitate:** O(n^2) timp si memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    int n = s.size();
    vector<vector<int>> dp(n, vector<int>(n, 0));
    for (int i = 0; i < n; i++) dp[i][i] = 1;
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            if (s[i] == s[j]) dp[i][j] = (len == 2 ? 2 : dp[i + 1][j - 1] + 2);
            else dp[i][j] = max(dp[i + 1][j], dp[i][j - 1]);
        }
    }
    cout << dp[0][n - 1] << "\\n";
    return 0;
}
`,
    py: `s = input().strip()
n = len(s)
dp = [[0] * n for _ in range(n)]
for i in range(n):
    dp[i][i] = 1
for length in range(2, n + 1):
    for i in range(0, n - length + 1):
        j = i + length - 1
        if s[i] == s[j]:
            dp[i][j] = 2 if length == 2 else dp[i + 1][j - 1] + 2
        else:
            dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])
print(dp[0][n - 1])
`,
    tests: ["bbbab", "cbbd", "a", "ac", "character"],
  },
  {
    slug: "dp-cea-mai-lunga-subsecventa-palindromica-contigua",
    title: "Cea mai lunga subsecventa palindromica contigua",
    difficulty: "medium",
    tags: ["dp", "palindrom", "interval"],
    statement: "Se citeste un sir de caractere S. Determinati, folosind Programarea Dinamica, cea mai lunga subsecventa CONTIGUA (substring) a lui S care este palindrom.",
    input_format: "Se citeste sirul S.",
    output_format: "Se afiseaza cea mai lunga subsecventa contigua palindromica (daca exista mai multe de aceeasi lungime maxima, afisati-o pe cea care incepe cea mai devreme).",
    constraints: "1 <= lungimea S <= 1000",
    hints: "Definiti dp[i][j] = adevarat daca S[i..j] este palindrom. dp[i][j] este adevarat daca S[i]==S[j] si (j-i<2 sau dp[i+1][j-1] este adevarat). Calculati in ordinea crescatoare a lungimii intervalului si retineti cel mai lung interval palindromic gasit.",
    explanation: `${DP_NOTE} Spre deosebire de subsirul palindromic (unde se pot omite caractere), aici intervalul trebuie sa fie CONTIGUU; un interval [i,j] este palindrom daca si numai daca capetele coincid si interiorul [i+1,j-1] este la randul lui palindrom.\n\n**Complexitate:** O(n^2) timp si memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    int n = s.size();
    vector<vector<bool>> dp(n, vector<bool>(n, false));
    int bestLen = 1, bestStart = 0;
    for (int i = 0; i < n; i++) dp[i][i] = true;
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            if (s[i] == s[j] && (len == 2 || dp[i + 1][j - 1])) {
                dp[i][j] = true;
                if (len > bestLen) { bestLen = len; bestStart = i; }
            }
        }
    }
    cout << s.substr(bestStart, bestLen) << "\\n";
    return 0;
}
`,
    py: `s = input().strip()
n = len(s)
dp = [[False] * n for _ in range(n)]
bestLen, bestStart = 1, 0
for i in range(n):
    dp[i][i] = True
for length in range(2, n + 1):
    for i in range(0, n - length + 1):
        j = i + length - 1
        if s[i] == s[j] and (length == 2 or dp[i + 1][j - 1]):
            dp[i][j] = True
            if length > bestLen:
                bestLen, bestStart = length, i
print(s[bestStart:bestStart + bestLen])
`,
    tests: ["babad", "cbbd", "a", "ac", "forgeeksskeegfor"],
  },
  {
    slug: "dp-numar-minim-taieturi-palindrom",
    title: "Numarul minim de taieturi pentru partitionare palindromica",
    difficulty: "hard",
    tags: ["dp", "palindrom", "interval"],
    statement: "Se citeste un sir de caractere S. Determinati, folosind Programarea Dinamica, numarul minim de taieturi necesare pentru a imparti S in subsecvente contigue, astfel incat fiecare subsecventa rezultata sa fie palindrom.",
    input_format: "Se citeste sirul S.",
    output_format: "Se afiseaza un singur numar: numarul minim de taieturi.",
    constraints: "1 <= lungimea S <= 1000",
    hints: "Precalculati un tablou isPalin[i][j] care indica daca S[i..j] este palindrom. Apoi definiti dp[i] = numarul minim de taieturi pentru a partitiona prefixul S[0..i]. Daca S[0..i] este el insusi palindrom, dp[i]=0; altfel, dp[i] = 1 + minimul dp[j-1] pentru toti j<=i cu S[j..i] palindrom.",
    explanation: `${DP_NOTE} Precalcularea tuturor intervalelor palindromice (printr-un interval DP separat) transforma problema intr-una liniara: dp[i] cauta cea mai buna 'ultima bucata palindromica' care se termina la pozitia i.\n\n**Complexitate:** O(n^2) timp si memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    int n = s.size();
    vector<vector<bool>> isPalin(n, vector<bool>(n, false));
    for (int i = 0; i < n; i++) isPalin[i][i] = true;
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            if (s[i] == s[j] && (len == 2 || isPalin[i + 1][j - 1])) isPalin[i][j] = true;
        }
    }
    vector<int> dp(n, 0);
    for (int i = 0; i < n; i++) {
        if (isPalin[0][i]) { dp[i] = 0; continue; }
        dp[i] = i;
        for (int j = 1; j <= i; j++)
            if (isPalin[j][i]) dp[i] = min(dp[i], dp[j - 1] + 1);
    }
    cout << dp[n - 1] << "\\n";
    return 0;
}
`,
    py: `s = input().strip()
n = len(s)
isPalin = [[False] * n for _ in range(n)]
for i in range(n):
    isPalin[i][i] = True
for length in range(2, n + 1):
    for i in range(0, n - length + 1):
        j = i + length - 1
        if s[i] == s[j] and (length == 2 or isPalin[i + 1][j - 1]):
            isPalin[i][j] = True
dp = [0] * n
for i in range(n):
    if isPalin[0][i]:
        dp[i] = 0
        continue
    dp[i] = i
    for j in range(1, i + 1):
        if isPalin[j][i]:
            dp[i] = min(dp[i], dp[j - 1] + 1)
print(dp[n - 1])
`,
    tests: ["aab", "a", "aabbc", "racecar", "abcde"],
  },

  // ===================== GRUPA D: RUCSAC FAMILY =====================
  {
    slug: "dp-rucsac-01",
    title: "Rucsacul 0/1",
    difficulty: "medium",
    tags: ["dp", "rucsac"],
    statement: "Se citesc n obiecte, fiecare cu o greutate si o valoare, si capacitatea G a unui rucsac. Fiecare obiect poate fi luat INTREG sau deloc (nu se accepta fractiuni). Determinati, folosind Programarea Dinamica, valoarea maxima ce poate fi transportata fara a depasi capacitatea G.",
    input_format: "Pe prima linie se citesc n si G. Urmeaza n linii, fiecare cu doua numere: greutatea si valoarea unui obiect.",
    output_format: "Se afiseaza un singur numar: valoarea maxima.",
    constraints: "1 <= n <= 500, 1 <= G <= 2000, 1 <= greutate, valoare <= 1000",
    hints: "Definiti dp[c] = valoarea maxima ce poate fi obtinuta cu capacitatea c, folosind obiectele considerate pana acum. Pentru fiecare obiect nou, actualizati dp[c] parcurgand capacitatile DESCRESCATOR (de la G la greutatea obiectului), pentru a nu folosi acelasi obiect de mai multe ori.",
    explanation: `${DP_NOTE} Parcurgerea capacitatilor in ordine descrescatoare, la introducerea fiecarui obiect nou, garanteaza ca fiecare valoare dp[c-greutate] folosita este cea calculata INAINTE de a considera obiectul curent, respectand astfel restrictia 'fiecare obiect cel mult o data'.\n\n**Complexitate:** O(n*G) timp, O(G) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; long long G;
    cin >> n >> G;
    vector<long long> w(n), val(n);
    for (int i = 0; i < n; i++) cin >> w[i] >> val[i];
    vector<long long> dp(G + 1, 0);
    for (int i = 0; i < n; i++)
        for (long long cap = G; cap >= w[i]; cap--)
            dp[cap] = max(dp[cap], dp[cap - w[i]] + val[i]);
    cout << dp[G] << "\\n";
    return 0;
}
`,
    py: `n, G = map(int, input().split())
w = [0] * n
val = [0] * n
for i in range(n):
    w[i], val[i] = map(int, input().split())
dp = [0] * (G + 1)
for i in range(n):
    for cap in range(G, w[i] - 1, -1):
        dp[cap] = max(dp[cap], dp[cap - w[i]] + val[i])
print(dp[G])
`,
    tests: ["3 50\n10 60\n20 100\n30 120", "4 10\n5 10\n4 40\n6 30\n3 50", "1 5\n10 100", "2 5\n2 3\n3 4", "5 8\n1 1\n2 6\n3 10\n4 16\n1 7"],
  },
  {
    slug: "dp-rucsac-01-afisare",
    title: "Rucsacul 0/1 - afisarea obiectelor alese",
    difficulty: "hard",
    tags: ["dp", "rucsac"],
    statement: "Se citesc n obiecte, fiecare cu o greutate si o valoare, si capacitatea G a unui rucsac. Determinati, folosind Programarea Dinamica, un subset de obiecte (fiecare luat intreg sau deloc) de valoare totala maxima, cu greutatea totala cel mult G, si afisati indicii obiectelor alese.",
    input_format: "Pe prima linie se citesc n si G. Urmeaza n linii, fiecare cu doua numere: greutatea si valoarea obiectului cu indicele respectiv.",
    output_format: "Pe prima linie se afiseaza valoarea maxima. Pe a doua linie se afiseaza indicii (numerotati de la 1) obiectelor alese, in ordine crescatoare, separati prin spatiu.",
    constraints: "1 <= n <= 500, 1 <= G <= 2000, 1 <= greutate, valoare <= 1000",
    hints: "Calculati de aceasta data intregul tablou bidimensional dp[i][c] (nu doar varianta comprimata pe o singura linie), pentru a putea reconstrui alegerile facute. Un obiect i a fost ales daca dp[i][c] != dp[i-1][c] pentru capacitatea c la care s-a ajuns.",
    explanation: `${DP_NOTE} Pastrarea intregului tablou dp[i][c] (nu doar a liniei curente) permite, dupa calcul, reconstruirea drumului invers: comparand dp[i][c] cu dp[i-1][c], se poate determina exact daca obiectul i a fost inclus in solutia optima.\n\n**Complexitate:** O(n*G) timp si memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; long long G;
    cin >> n >> G;
    vector<long long> w(n), val(n);
    for (int i = 0; i < n; i++) cin >> w[i] >> val[i];
    vector<vector<long long>> dp(n + 1, vector<long long>(G + 1, 0));
    for (int i = 1; i <= n; i++) {
        for (long long cap = 0; cap <= G; cap++) {
            dp[i][cap] = dp[i - 1][cap];
            if (w[i - 1] <= cap) dp[i][cap] = max(dp[i][cap], dp[i - 1][cap - w[i - 1]] + val[i - 1]);
        }
    }
    vector<int> alese;
    long long cap = G;
    for (int i = n; i >= 1; i--) {
        if (dp[i][cap] != dp[i - 1][cap]) { alese.push_back(i); cap -= w[i - 1]; }
    }
    reverse(alese.begin(), alese.end());
    cout << dp[n][G] << "\\n";
    for (size_t i = 0; i < alese.size(); i++) cout << alese[i] << (i + 1 < alese.size() ? ' ' : '\\n');
    if (alese.empty()) cout << "\\n";
    return 0;
}
`,
    py: `n, G = map(int, input().split())
w = [0] * n
val = [0] * n
for i in range(n):
    w[i], val[i] = map(int, input().split())
dp = [[0] * (G + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    for cap in range(G + 1):
        dp[i][cap] = dp[i - 1][cap]
        if w[i - 1] <= cap:
            dp[i][cap] = max(dp[i][cap], dp[i - 1][cap - w[i - 1]] + val[i - 1])
alese = []
cap = G
for i in range(n, 0, -1):
    if dp[i][cap] != dp[i - 1][cap]:
        alese.append(i)
        cap -= w[i - 1]
alese.reverse()
print(dp[n][G])
print(' '.join(map(str, alese)))
`,
    tests: ["3 50\n10 60\n20 100\n30 120", "4 10\n5 10\n4 40\n6 30\n3 50", "1 5\n10 100", "2 5\n2 3\n3 4", "5 8\n1 1\n2 6\n3 10\n4 16\n1 7"],
  },
  {
    slug: "dp-rucsac-nemarginit",
    title: "Rucsacul cu obiecte in cantitate nelimitata",
    difficulty: "medium",
    tags: ["dp", "rucsac"],
    statement: "Se citesc n tipuri de obiecte, fiecare cu o greutate si o valoare, disponibile in cantitate NELIMITATA, si capacitatea G a unui rucsac. Determinati, folosind Programarea Dinamica, valoarea maxima ce poate fi transportata fara a depasi capacitatea G, un tip de obiect putand fi folosit de oricate ori.",
    input_format: "Pe prima linie se citesc n si G. Urmeaza n linii, fiecare cu doua numere: greutatea si valoarea unui tip de obiect.",
    output_format: "Se afiseaza un singur numar: valoarea maxima.",
    constraints: "1 <= n <= 500, 1 <= G <= 2000, 1 <= greutate, valoare <= 1000",
    hints: "Definiti dp[c] = valoarea maxima obtinuta cu capacitatea c. Spre deosebire de rucsacul 0/1, aici parcurgeti capacitatile CRESCATOR, permitand astfel ca acelasi tip de obiect sa fie reutilizat de mai multe ori in cadrul aceleiasi solutii.",
    explanation: `${DP_NOTE} Parcurgerea capacitatilor in ordine CRESCATOARE (spre deosebire de rucsacul 0/1) permite ca valoarea dp[c-greutate], deja actualizata in aceasta iteratie, sa includa acelasi tip de obiect ales anterior, simuland astfel disponibilitatea nelimitata.\n\n**Complexitate:** O(n*G) timp, O(G) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; long long G;
    cin >> n >> G;
    vector<long long> w(n), val(n);
    for (int i = 0; i < n; i++) cin >> w[i] >> val[i];
    vector<long long> dp(G + 1, 0);
    for (long long cap = 1; cap <= G; cap++)
        for (int i = 0; i < n; i++)
            if (w[i] <= cap) dp[cap] = max(dp[cap], dp[cap - w[i]] + val[i]);
    cout << dp[G] << "\\n";
    return 0;
}
`,
    py: `n, G = map(int, input().split())
w = [0] * n
val = [0] * n
for i in range(n):
    w[i], val[i] = map(int, input().split())
dp = [0] * (G + 1)
for cap in range(1, G + 1):
    for i in range(n):
        if w[i] <= cap:
            dp[cap] = max(dp[cap], dp[cap - w[i]] + val[i])
print(dp[G])
`,
    tests: ["3 10\n5 10\n4 40\n6 30", "2 8\n1 1\n3 4", "1 5\n10 100", "3 100\n1 1\n5 10\n10 22", "2 7\n2 3\n5 8"],
  },
  {
    slug: "dp-submultime-suma-exacta",
    title: "Existenta unei submultimi cu suma exacta",
    difficulty: "medium",
    tags: ["dp", "rucsac"],
    statement: "Se citesc n numere naturale si o suma S. Determinati, folosind Programarea Dinamica, daca exista o submultime a celor n numere a carei suma este exact S.",
    input_format: "Pe prima linie se citesc n si S. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza DA daca exista o astfel de submultime, respectiv NU in caz contrar.",
    constraints: "1 <= n <= 500, 0 <= S <= 100000, 0 <= element <= 100000",
    hints: "Definiti dp[s] = adevarat daca suma s este obtenabila folosind o submultime a elementelor considerate pana acum. dp[0]=adevarat initial. Pentru fiecare element, actualizati dp[s] pentru s DESCRESCATOR (de la S la valoarea elementului), la fel ca la rucsacul 0/1.",
    explanation: `${DP_NOTE} Aceasta este o varianta booleana a rucsacului 0/1 (fara valori, doar existenta unei sume atinse); parcurgerea descrescatoare a sumelor la introducerea fiecarui element garanteaza ca fiecare element este folosit cel mult o data.\n\n**Complexitate:** O(n*S) timp, O(S) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; long long S;
    cin >> n >> S;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    vector<bool> dp(S + 1, false);
    dp[0] = true;
    for (int i = 0; i < n; i++)
        for (long long s = S; s >= a[i]; s--)
            if (dp[s - a[i]]) dp[s] = true;
    cout << (dp[S] ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `n, S = map(int, input().split())
a = list(map(int, input().split()))
dp = [False] * (S + 1)
dp[0] = True
for i in range(n):
    for s in range(S, a[i] - 1, -1):
        if dp[s - a[i]]:
            dp[s] = True
print("DA" if dp[S] else "NU")
`,
    tests: ["6 9\n3 34 4 12 5 2", "5 3\n1 2 3 7 8", "3 0\n1 2 3", "4 100\n1 2 3 4", "1 5\n5"],
  },
  {
    slug: "dp-partitionare-suma-minima",
    title: "Impartirea unei multimi in doua cu diferenta minima",
    difficulty: "hard",
    tags: ["dp", "rucsac"],
    statement: "Se citesc n numere naturale. Determinati, folosind Programarea Dinamica, cea mai mica diferenta posibila intre sumele a doua submultimi disjuncte care impreuna contin toate cele n numere.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza un singur numar: diferenta minima posibila.",
    constraints: "1 <= n <= 500, 0 <= element <= 1000",
    hints: "Calculati (ca la problema submultimii cu suma exacta) toate sumele obtenabile cu o submultime, pana la jumatate din suma totala. Cea mai mare suma obtenabila S1 <= suma_totala/2 determina cealalta submultime cu suma (suma_totala - S1); diferenta minima este suma_totala - 2*S1.",
    explanation: `${DP_NOTE} Deoarece orice submultime si complementara ei impart intreaga suma totala, este suficient sa gasim submultimea cu suma cat mai apropiata de jumatate din total; diferenta minima rezulta direct din aceasta suma optima.\n\n**Complexitate:** O(n*suma_totala) timp, O(suma_totala) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> a(n);
    long long total = 0;
    for (auto& x : a) { cin >> x; total += x; }
    long long jumatate = total / 2;
    vector<bool> dp(jumatate + 1, false);
    dp[0] = true;
    for (int i = 0; i < n; i++)
        for (long long s = jumatate; s >= a[i]; s--)
            if (dp[s - a[i]]) dp[s] = true;
    long long best = 0;
    for (long long s = jumatate; s >= 0; s--) if (dp[s]) { best = s; break; }
    cout << (total - 2 * best) << "\\n";
    return 0;
}
`,
    py: `n = int(input())
a = list(map(int, input().split()))
total = sum(a)
jumatate = total // 2
dp = [False] * (jumatate + 1)
dp[0] = True
for i in range(n):
    for s in range(jumatate, a[i] - 1, -1):
        if dp[s - a[i]]:
            dp[s] = True
best = 0
for s in range(jumatate, -1, -1):
    if dp[s]:
        best = s
        break
print(total - 2 * best)
`,
    tests: ["4\n1 6 11 5", "3\n1 2 3", "1\n7", "5\n3 1 4 2 2", "6\n1 1 1 1 1 1"],
  },
  {
    slug: "dp-monede-numar-minim-general",
    title: "Numarul minim de monede pentru un sistem oarecare",
    difficulty: "medium",
    tags: ["dp", "monede"],
    statement: "Se citesc m tipuri de monede (valori date, disponibile in cantitate nelimitata) si o suma S. Determinati, folosind Programarea Dinamica, numarul minim de monede necesare pentru a obtine exact suma S, indiferent daca sistemul de monede este canonic sau nu. Daca suma S nu poate fi obtinuta, afisati -1.",
    input_format: "Pe prima linie se citesc m si S. Pe a doua linie se citesc cele m valori ale monedelor.",
    output_format: "Se afiseaza un singur numar: numarul minim de monede necesare, sau -1 daca suma S nu poate fi obtinuta.",
    constraints: "1 <= m <= 100, 1 <= S <= 100000, 1 <= valoare moneda <= 100000",
    hints: "Definiti dp[s] = numarul minim de monede pentru a obtine suma s. dp[0]=0. Pentru fiecare s de la 1 la S, incercati fiecare tip de moneda c<=s si actualizati dp[s]=min(dp[s], dp[s-c]+1), daca suma s-c este obtenabila.",
    explanation: `${DP_NOTE} Spre deosebire de metoda Greedy (corecta doar pentru sisteme canonice de monede), Programarea Dinamica exploreaza efectiv toate combinatiile posibile prin subprobleme, garantand raspunsul corect indiferent de sistemul de monede folosit.\n\n**Complexitate:** O(m*S) timp, O(S) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int m; long long S;
    cin >> m >> S;
    vector<long long> c(m);
    for (auto& x : c) cin >> x;
    long long INF = S + 1;
    vector<long long> dp(S + 1, INF);
    dp[0] = 0;
    for (long long s = 1; s <= S; s++)
        for (int i = 0; i < m; i++)
            if (c[i] <= s && dp[s - c[i]] + 1 < dp[s]) dp[s] = dp[s - c[i]] + 1;
    cout << (dp[S] >= INF ? -1 : dp[S]) << "\\n";
    return 0;
}
`,
    py: `m, S = map(int, input().split())
c = list(map(int, input().split()))
INF = S + 1
dp = [INF] * (S + 1)
dp[0] = 0
for s in range(1, S + 1):
    for i in range(m):
        if c[i] <= s and dp[s - c[i]] + 1 < dp[s]:
            dp[s] = dp[s - c[i]] + 1
print(-1 if dp[S] >= INF else dp[S])
`,
    tests: ["3 11\n1 2 5", "2 3\n2 4", "1 10\n3", "4 100\n1 5 10 25", "3 7\n5 4 1"],
  },

  // ===================== GRUPA E: MATRICE / GRID =====================
  {
    slug: "dp-drum-cost-minim-matrice-dp",
    title: "Drumul de cost minim intr-o matrice (Programare Dinamica)",
    difficulty: "easy",
    tags: ["dp", "matrice"],
    statement: "Se citesc doua numere naturale n si m, apoi o matrice de costuri cu n linii si m coloane. Determinati, folosind Programarea Dinamica, costul minim al unui drum de la celula (1,1) la celula (n,m), stiind ca la fiecare pas ne putem deplasa fie la dreapta, fie in jos, iar costul unui drum este suma costurilor tuturor celulelor vizitate.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza n linii, fiecare cu m valori reprezentand costurile celulelor.",
    output_format: "Se afiseaza un singur numar: costul minim al unui drum de la (1,1) la (n,m).",
    constraints: "1 <= n, m <= 1000, 0 <= cost <= 1000",
    hints: "Definiti dp[i][j] = costul minim al unui drum de la (1,1) la (i,j). dp[i][j] = cost[i][j] + min(dp[i-1][j], dp[i][j-1]), avand grija la cazurile in care i=1 sau j=1 (cand exista o singura directie de provenienta posibila).",
    explanation: `${DP_NOTE} Spre deosebire de rezolvarea prin Backtracking (care exploreaza exponential toate drumurile posibile), Programarea Dinamica calculeaza costul minim de a ajunge in fiecare celula o singura data, refolosind rezultatele pentru celulele deja calculate.\n\n**Complexitate:** O(n*m) timp si memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<long long>> cost(n + 1, vector<long long>(m + 1));
    for (int i = 1; i <= n; i++) for (int j = 1; j <= m; j++) cin >> cost[i][j];
    vector<vector<long long>> dp(n + 1, vector<long long>(m + 1, 0));
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (i == 1 && j == 1) dp[i][j] = cost[i][j];
            else if (i == 1) dp[i][j] = dp[i][j - 1] + cost[i][j];
            else if (j == 1) dp[i][j] = dp[i - 1][j] + cost[i][j];
            else dp[i][j] = min(dp[i - 1][j], dp[i][j - 1]) + cost[i][j];
        }
    }
    cout << dp[n][m] << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
cost = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    row = list(map(int, input().split()))
    for j in range(1, m + 1):
        cost[i][j] = row[j - 1]
dp = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    for j in range(1, m + 1):
        if i == 1 and j == 1:
            dp[i][j] = cost[i][j]
        elif i == 1:
            dp[i][j] = dp[i][j - 1] + cost[i][j]
        elif j == 1:
            dp[i][j] = dp[i - 1][j] + cost[i][j]
        else:
            dp[i][j] = min(dp[i - 1][j], dp[i][j - 1]) + cost[i][j]
print(dp[n][m])
`,
    tests: ["2 2\n1 2\n3 4", "3 3\n1 3 1\n1 5 1\n4 2 1", "2 3\n1 1 1\n1 1 1", "1 1\n7", "3 1\n2\n2\n2"],
  },
  {
    slug: "dp-suma-maxima-triunghi",
    title: "Suma maxima pe un drum intr-un triunghi de numere",
    difficulty: "easy",
    tags: ["dp", "matrice"],
    statement: "Se citeste un triunghi de numere cu n linii (linia i contine i numere, 1 <= i <= n). Pornind din varf, la fiecare pas ne putem deplasa catre unul dintre cele doua numere aflate imediat sub cel curent, pe linia urmatoare. Determinati, folosind Programarea Dinamica, suma maxima ce poate fi obtinuta pe un astfel de drum de la varf pana la baza triunghiului.",
    input_format: "Pe prima linie se citeste n. Urmeaza n linii, linia i continand i numere.",
    output_format: "Se afiseaza un singur numar: suma maxima.",
    constraints: "1 <= n <= 1000, -1000 <= numar <= 1000",
    hints: "Calculati de la baza catre varf: dp[i][j] = a[i][j] + max(dp[i+1][j], dp[i+1][j+1]), pornind cu dp pe ultima linie egal chiar cu valorile de pe acea linie. Raspunsul final este dp[1][1].",
    explanation: `${DP_NOTE} Calculand de jos in sus, fiecare celula 'mosteneste' maximul dintre cele doua cai posibile de continuare de pe linia urmatoare; la final, dp[1][1] contine suma maxima a intregului drum de la varf la baza.\n\n**Complexitate:** O(n^2) timp si memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<vector<long long>> a(n + 1);
    for (int i = 1; i <= n; i++) { a[i].resize(i + 1); for (int j = 1; j <= i; j++) cin >> a[i][j]; }
    vector<vector<long long>> dp(n + 1);
    for (int i = 1; i <= n; i++) dp[i].assign(i + 1, 0);
    for (int j = 1; j <= n; j++) dp[n][j] = a[n][j];
    for (int i = n - 1; i >= 1; i--)
        for (int j = 1; j <= i; j++)
            dp[i][j] = a[i][j] + max(dp[i + 1][j], dp[i + 1][j + 1]);
    cout << dp[1][1] << "\\n";
    return 0;
}
`,
    py: `n = int(input())
a = [[]]
for i in range(1, n + 1):
    row = [0] + list(map(int, input().split()))
    a.append(row)
dp = [[0] * (i + 1) for i in range(n + 1)]
for j in range(1, n + 1):
    dp[n][j] = a[n][j]
for i in range(n - 1, 0, -1):
    for j in range(1, i + 1):
        dp[i][j] = a[i][j] + max(dp[i + 1][j], dp[i + 1][j + 1])
print(dp[1][1])
`,
    tests: ["4\n2\n3 4\n6 5 7\n4 1 8 3", "1\n5", "2\n-1\n2 3", "3\n1\n2 3\n4 5 6", "2\n1\n1 1"],
  },
  {
    slug: "dp-cel-mai-lung-drum-crescator-matrice",
    title: "Cel mai lung drum crescator intr-o matrice",
    difficulty: "hard",
    tags: ["dp", "matrice"],
    statement: "Se citesc doua numere naturale n si m si o matrice cu n linii si m coloane. Determinati, folosind Programarea Dinamica, lungimea (numarul de celule) celui mai lung drum strict crescator din matrice, deplasandu-va la fiecare pas intr-o celula vecina (sus, jos, stanga sau dreapta) cu o valoare STRICT mai mare decat cea curenta.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza n linii, fiecare cu m valori.",
    output_format: "Se afiseaza un singur numar: lungimea celui mai lung drum crescator.",
    constraints: "1 <= n, m <= 200, 0 <= valoare <= 10^9",
    hints: "Sortati toate celulele crescator dupa valoare. Parcurgeti-le in aceasta ordine, calculand dp[celula] = 1 + maximul dp[vecin] pentru toti vecinii cu o valoare STRICT mai mica (acestia au fost deja procesati, fiind mai mici).",
    explanation: `${DP_NOTE} Procesarea celulelor in ordinea crescatoare a valorilor lor garanteaza ca, atunci cand se calculeaza dp pentru o celula, toate celulele cu valori mai mici (singurele care pot preceda un drum crescator ce ajunge in celula curenta) au fost deja calculate, eliminand nevoia unei recursivitati cu memorare explicita.\n\n**Complexitate:** O(n*m*log(n*m)) timp`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<long long>> a(n, vector<long long>(m));
    vector<tuple<long long,int,int>> cells;
    for (int i = 0; i < n; i++) for (int j = 0; j < m; j++) { cin >> a[i][j]; cells.push_back({a[i][j], i, j}); }
    sort(cells.begin(), cells.end());
    vector<vector<int>> dp(n, vector<int>(m, 1));
    int dx[4] = {-1, 1, 0, 0}, dy[4] = {0, 0, -1, 1};
    int best = 1;
    for (auto& cell : cells) {
        long long val = get<0>(cell); int i = get<1>(cell), j = get<2>(cell);
        for (int d = 0; d < 4; d++) {
            int ni = i + dx[d], nj = j + dy[d];
            if (ni >= 0 && ni < n && nj >= 0 && nj < m && a[ni][nj] < val) dp[i][j] = max(dp[i][j], dp[ni][nj] + 1);
        }
        best = max(best, dp[i][j]);
    }
    cout << best << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
a = [[0] * m for _ in range(n)]
cells = []
for i in range(n):
    row = list(map(int, input().split()))
    for j in range(m):
        a[i][j] = row[j]
        cells.append((row[j], i, j))
cells.sort()
dp = [[1] * m for _ in range(n)]
dx = [-1, 1, 0, 0]
dy = [0, 0, -1, 1]
best = 1
for val, i, j in cells:
    for d in range(4):
        ni, nj = i + dx[d], j + dy[d]
        if 0 <= ni < n and 0 <= nj < m and a[ni][nj] < val:
            dp[i][j] = max(dp[i][j], dp[ni][nj] + 1)
    best = max(best, dp[i][j])
print(best)
`,
    tests: ["3 3\n9 9 4\n6 6 8\n2 1 1", "3 3\n3 4 5\n3 2 6\n2 2 1", "1 1\n1", "2 2\n1 2\n3 4", "4 4\n1 2 3 4\n8 7 6 5\n9 10 11 12\n16 15 14 13"],
  },
  {
    slug: "dp-patrat-maxim-matrice-binara",
    title: "Cel mai mare patrat de 1-uri dintr-o matrice binara",
    difficulty: "medium",
    tags: ["dp", "matrice"],
    statement: "Se citesc doua numere naturale n si m si o matrice binara (cu valori 0 si 1) cu n linii si m coloane. Determinati, folosind Programarea Dinamica, latura celui mai mare patrat format numai din 1-uri, continut in matrice.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza n linii, fiecare cu m valori (0 sau 1).",
    output_format: "Se afiseaza un singur numar: latura celui mai mare patrat de 1-uri (0 daca nu exista niciun 1 in matrice).",
    constraints: "1 <= n, m <= 1000",
    hints: "Definiti dp[i][j] = latura celui mai mare patrat de 1-uri care are coltul din dreapta-jos exact in celula (i,j). Daca a[i][j]=0, dp[i][j]=0. Altfel, dp[i][j] = 1 + minimul dintre dp[i-1][j], dp[i][j-1] si dp[i-1][j-1] (sau 1, daca celula este pe prima linie sau coloana).",
    explanation: `${DP_NOTE} Un patrat de latura L cu coltul dreapta-jos in (i,j) poate exista numai daca exista deja patrate de latura cel putin L-1 imediat deasupra, la stanga si pe diagonala; minimul acestor trei valori determina cea mai mare latura posibila in acel punct.\n\n**Complexitate:** O(n*m) timp si memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> a(n, vector<int>(m));
    for (int i = 0; i < n; i++) for (int j = 0; j < m; j++) cin >> a[i][j];
    vector<vector<int>> dp(n, vector<int>(m, 0));
    int best = 0;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            if (a[i][j] == 1) {
                if (i == 0 || j == 0) dp[i][j] = 1;
                else dp[i][j] = 1 + min({dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]});
                best = max(best, dp[i][j]);
            }
        }
    }
    cout << best << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
a = [list(map(int, input().split())) for _ in range(n)]
dp = [[0] * m for _ in range(n)]
best = 0
for i in range(n):
    for j in range(m):
        if a[i][j] == 1:
            if i == 0 or j == 0:
                dp[i][j] = 1
            else:
                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
            best = max(best, dp[i][j])
print(best)
`,
    tests: [
      "4 5\n1 0 1 0 0\n1 0 1 1 1\n1 1 1 1 1\n1 0 0 1 0",
      "2 2\n0 0\n0 0",
      "1 1\n1",
      "3 3\n1 1 1\n1 1 1\n1 1 1",
      "3 4\n0 1 1 1\n1 1 1 1\n0 1 1 1",
    ],
  },

  // ===================== GRUPA F: INTERVAL DP =====================
  {
    slug: "dp-inmultire-optima-matrice",
    title: "Parantezarea optima a unui produs de matrice",
    difficulty: "hard",
    tags: ["dp", "interval"],
    statement: "Se citeste un numar natural n si n+1 numere p0, p1, ..., pn, reprezentand dimensiunile a n matrice A1, A2, ..., An, unde matricea Ai are pi-1 linii si pi coloane. Determinati, folosind Programarea Dinamica, numarul minim de inmultiri scalare necesare pentru a calcula produsul A1*A2*...*An, alegand optim ordinea in care se fac inmultirile (parantezarea).",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n+1 valori p0, p1, ..., pn.",
    output_format: "Se afiseaza un singur numar: numarul minim de inmultiri scalare.",
    constraints: "1 <= n <= 100, 1 <= p[i] <= 500",
    hints: "Definiti dp[i][j] = costul minim de a calcula produsul matricelor Ai*A(i+1)*...*Aj. dp[i][i]=0. Pentru i<j, incercati toate pozitiile posibile k (i<=k<j) unde se face ultima inmultire: dp[i][j] = minimul peste toti k al valorii dp[i][k]+dp[k+1][j]+p[i-1]*p[k]*p[j].",
    explanation: `${DP_NOTE} Aceasta este problema clasica de tip 'interval DP': subproblemele sunt sub-secvente de matrice consecutive Ai..Aj, iar recurenta incearca toate punctele posibile unde s-ar putea face ultima inmultire care 'leaga' cele doua jumatati.\n\n**Complexitate:** O(n^3) timp, O(n^2) memorie`,
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> p(n + 1);
    for (auto& x : p) cin >> x;
    const long long INF = 4000000000000000000LL;
    vector<vector<long long>> dp(n + 1, vector<long long>(n + 1, 0));
    for (int len = 2; len <= n; len++) {
        for (int i = 1; i + len - 1 <= n; i++) {
            int j = i + len - 1;
            dp[i][j] = INF;
            for (int k = i; k < j; k++)
                dp[i][j] = min(dp[i][j], dp[i][k] + dp[k + 1][j] + p[i - 1] * p[k] * p[j]);
        }
    }
    cout << dp[1][n] << "\\n";
    return 0;
}
`,
    py: `n = int(input())
p = list(map(int, input().split()))
INF = 4000000000000000000
dp = [[0] * (n + 1) for _ in range(n + 1)]
for length in range(2, n + 1):
    for i in range(1, n - length + 2):
        j = i + length - 1
        dp[i][j] = INF
        for k in range(i, j):
            dp[i][j] = min(dp[i][j], dp[i][k] + dp[k + 1][j] + p[i - 1] * p[k] * p[j])
print(dp[1][n])
`,
    tests: ["3\n10 30 5 60", "1\n10 20", "4\n40 20 30 10 30", "2\n10 20 30", "5\n5 10 3 12 5 50"],
  },
  {
    slug: "dp-cost-minim-taiere-baton",
    title: "Costul minim de taiere a unui baton",
    difficulty: "hard",
    tags: ["dp", "interval"],
    statement: "Se citesc lungimea L a unui baton si n pozitii la care trebuie facute taieturi (numere intre 0 si L). Fiecare taietura are un cost egal cu lungimea bucatii curente de baton pe care se face. Determinati, folosind Programarea Dinamica, costul minim total pentru a efectua toate cele n taieturi, alegand optim ordinea in care se fac.",
    input_format: "Pe prima linie se citesc L si n. Pe a doua linie se citesc cele n pozitii de taiere.",
    output_format: "Se afiseaza un singur numar: costul minim total al taieturilor.",
    constraints: "1 <= L <= 10^6, 0 <= n <= 100, 1 <= pozitie de taiere <= L-1",
    hints: "Adaugati 0 si L ca 'taieturi' suplimentare la capete si sortati toate pozitiile (inclusiv acestea doua). Definiti dp[i][j] = costul minim de a face toate taieturile STRICT intre pozitiile sortate i si j; dp[i][j] = minimul peste toate taieturile k dintre ele al valorii dp[i][k]+dp[k][j]+(pozitie[j]-pozitie[i]), aceasta din urma fiind lungimea bucatii taiate.",
    explanation: `${DP_NOTE} Fiecare taietura facuta 'imparte' bucata curenta in doua bucati mai mici, exact ca la problema parantezarii optime a unui produs de matrice; ordinea taieturilor determina costul total, iar interval DP gaseste ordinea optima considerand, pentru fiecare interval, care taietura s-ar face ultima.\n\n**Complexitate:** O(n^3) timp, O(n^2) memorie`,
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long L; int n;
    cin >> L >> n;
    vector<long long> c(n);
    for (auto& x : c) cin >> x;
    sort(c.begin(), c.end());
    vector<long long> cuts;
    cuts.push_back(0);
    for (auto x : c) cuts.push_back(x);
    cuts.push_back(L);
    int m = cuts.size();
    const long long INF = 4000000000000000000LL;
    vector<vector<long long>> dp(m, vector<long long>(m, 0));
    for (int len = 2; len < m; len++) {
        for (int i = 0; i + len < m; i++) {
            int j = i + len;
            dp[i][j] = INF;
            for (int k = i + 1; k < j; k++)
                dp[i][j] = min(dp[i][j], dp[i][k] + dp[k][j] + (cuts[j] - cuts[i]));
        }
    }
    cout << dp[0][m - 1] << "\\n";
    return 0;
}
`,
    py: `L, n = map(int, input().split())
c = list(map(int, input().split())) if n > 0 else []
c.sort()
cuts = [0] + c + [L]
m = len(cuts)
INF = 4000000000000000000
dp = [[0] * m for _ in range(m)]
for length in range(2, m):
    for i in range(0, m - length):
        j = i + length
        dp[i][j] = INF
        for k in range(i + 1, j):
            dp[i][j] = min(dp[i][j], dp[i][k] + dp[k][j] + (cuts[j] - cuts[i]))
print(dp[0][m - 1])
`,
    tests: ["7 4\n1 3 4 5", "9 3\n2 4 7", "10 1\n5", "5 0\n", "20 5\n2 4 7 10 15"],
  },
  {
    slug: "dp-triangulare-poligon-cost-minim",
    title: "Costul minim de triangulare a unui poligon convex",
    difficulty: "hard",
    tags: ["dp", "interval"],
    statement: "Se citeste un numar natural n (numarul de varfuri ale unui poligon convex, numerotate de la 0 la n-1 in ordinea de pe contur) si cele n 'ponderi' asociate varfurilor. Impartind poligonul in triunghiuri prin diagonale care nu se intersecteaza (triangulare), costul unui triunghi format din varfurile i, j, k este produsul ponderilor lor. Determinati, folosind Programarea Dinamica, costul total minim al unei triangulari complete a poligonului.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n ponderi ale varfurilor.",
    output_format: "Se afiseaza un singur numar: costul minim total al unei triangulari.",
    constraints: "3 <= n <= 100, 1 <= pondere <= 100",
    hints: "Definiti dp[i][j] = costul minim de a triangulariza portiunea de poligon formata din varfurile i, i+1, ..., j (considerata ca un poligon mai mic, cu latura 'de inchidere' de la j la i). dp[i][i+1]=0 (doar o latura, niciun triunghi). Pentru j>i+1, incercati toate varfurile k intre i si j ca 'al treilea varf' al triunghiului ce contine latura (i,j): dp[i][j] = minimul peste k al valorii dp[i][k]+dp[k][j]+pondere[i]*pondere[k]*pondere[j].",
    explanation: `${DP_NOTE} Aceasta problema are exact aceeasi structura de recurenta ca parantezarea optima a unui produs de matrice: fiecare 'taietura' printr-o diagonala imparte poligonul in doua bucati mai mici, iar interval DP incearca toate pozitiile posibile ale celui de-al treilea varf al triunghiului care 'acopera' fiecare interval.\n\n**Complexitate:** O(n^3) timp, O(n^2) memorie`,
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> w(n);
    for (auto& x : w) cin >> x;
    const long long INF = 4000000000000000000LL;
    vector<vector<long long>> dp(n, vector<long long>(n, 0));
    for (int len = 2; len < n; len++) {
        for (int i = 0; i + len < n; i++) {
            int j = i + len;
            dp[i][j] = INF;
            for (int k = i + 1; k < j; k++)
                dp[i][j] = min(dp[i][j], dp[i][k] + dp[k][j] + w[i] * w[k] * w[j]);
        }
    }
    cout << dp[0][n - 1] << "\\n";
    return 0;
}
`,
    py: `n = int(input())
w = list(map(int, input().split()))
INF = 4000000000000000000
dp = [[0] * n for _ in range(n)]
for length in range(2, n):
    for i in range(0, n - length):
        j = i + length
        dp[i][j] = INF
        for k in range(i + 1, j):
            dp[i][j] = min(dp[i][j], dp[i][k] + dp[k][j] + w[i] * w[k] * w[j])
print(dp[0][n - 1])
`,
    tests: ["4\n1 2 3 4", "3\n1 1 1", "5\n1 2 3 4 5", "3\n2 3 5", "5\n5 4 3 2 1"],
  },
  {
    slug: "dp-burst-balloons",
    title: "Spargerea baloanelor pentru profit maxim",
    difficulty: "hard",
    tags: ["dp", "interval"],
    statement: "Se citesc n baloane asezate la rand, fiecare cu o valoare. Cand se sparge balonul de pe pozitia i, se castiga a[stanga]*a[i]*a[dreapta] monede, unde stanga si dreapta sunt cele mai apropiate baloane INCA nesparte de o parte si de alta a lui i (sau valoarea 1, daca nu mai exista niciun balon nespart in acea directie). Determinati, folosind Programarea Dinamica, numarul maxim de monede ce pot fi obtinute spargand toate baloanele, in ordinea optima.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n valori ale baloanelor.",
    output_format: "Se afiseaza un singur numar: numarul maxim de monede obtinute.",
    constraints: "1 <= n <= 100, 0 <= valoare <= 100",
    hints: "Adaugati cate un balon fictiv cu valoarea 1 la fiecare capat al sirului. Definiti dp[i][j] = profitul maxim obtinut spargand TOATE baloanele aflate STRICT intre pozitiile i si j (baloanele i si j raman intacte). Pentru fiecare interval, incercati care balon k (strict intre i si j) este SPART ULTIMUL: dp[i][j] = maximul peste k al valorii dp[i][k]+dp[k][j]+a[i]*a[k]*a[j].",
    explanation: `${DP_NOTE} Alegerea starii ca fiind 'ce balon se sparge ultimul' (nu primul) este trucul esential: la momentul in care balonul k este spart ultimul in intervalul (i,j), vecinii lui ramasi sunt exact i si j (baloanele-limita), indiferent de ordinea in care s-au spart celelalte, ceea ce face posibila o recurenta simpla de tip interval DP.\n\n**Complexitate:** O(n^3) timp, O(n^2) memorie`,
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> a(n + 2);
    a[0] = 1; a[n + 1] = 1;
    for (int i = 1; i <= n; i++) cin >> a[i];
    vector<vector<long long>> dp(n + 2, vector<long long>(n + 2, 0));
    for (int len = 2; len <= n + 1; len++) {
        for (int i = 0; i + len <= n + 1; i++) {
            int j = i + len;
            for (int k = i + 1; k < j; k++)
                dp[i][j] = max(dp[i][j], dp[i][k] + dp[k][j] + a[i] * a[k] * a[j]);
        }
    }
    cout << dp[0][n + 1] << "\\n";
    return 0;
}
`,
    py: `n = int(input())
a = [0] * (n + 2)
a[0] = 1
a[n + 1] = 1
vals = list(map(int, input().split()))
for i in range(1, n + 1):
    a[i] = vals[i - 1]
dp = [[0] * (n + 2) for _ in range(n + 2)]
for length in range(2, n + 2):
    for i in range(0, n + 2 - length):
        j = i + length
        for k in range(i + 1, j):
            dp[i][j] = max(dp[i][j], dp[i][k] + dp[k][j] + a[i] * a[k] * a[j])
print(dp[0][n + 1])
`,
    tests: ["4\n3 1 5 8", "1\n5", "3\n1 5 8", "5\n1 2 3 4 5", "2\n3 5"],
  },

  // ===================== GRUPA G: AVANSATE =====================
  {
    slug: "dp-problema-ouale",
    title: "Problema oualor",
    difficulty: "hard",
    tags: ["dp", "avansat"],
    statement: "Aveti la dispozitie E oua identice si o cladire cu F etaje. Exista un etaj critic (necunoscut) astfel incat un ou aruncat de la orice etaj STRICT sub el nu se sparge, iar un ou aruncat de la acel etaj sau de la unul superior se sparge intotdeauna. Un ou care nu se sparge poate fi refolosit; unul care se sparge, nu. Determinati, folosind Programarea Dinamica, numarul minim de aruncari necesare, in cel mai defavorabil caz, pentru a determina cu certitudine etajul critic.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale E (numarul de oua) si F (numarul de etaje).",
    output_format: "Se afiseaza un singur numar: numarul minim de aruncari necesare in cel mai defavorabil caz.",
    constraints: "1 <= E <= 50, 1 <= F <= 10000",
    hints: "In loc sa cautati direct 'numarul minim de aruncari pentru E oua si F etaje', inversati problema: definiti dp[t][e] = numarul MAXIM de etaje ce pot fi verificate cu certitudine folosind cel mult t aruncari si e oua. dp[t][e] = dp[t-1][e-1] + dp[t-1][e] + 1 (aruncarea curenta fie sparge oul, reducand problema la e-1 oua si t-1 aruncari pentru etajele de dedesubt, fie nu il sparge, ramanand cu e oua si t-1 aruncari pentru etajele de deasupra). Raspunsul este cel mai mic t pentru care dp[t][E] >= F.",
    explanation: `${DP_NOTE} Aceasta 'inversare' a starii (numarul de etaje acoperite in functie de numarul de aruncari, in loc de numarul de aruncari in functie de etaje) transforma o recurenta patratica in numarul de etaje intr-una liniara, mult mai eficienta.\n\n**Complexitate:** O(E*t), unde t este raspunsul cautat (cel mult F)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int E; long long F;
    cin >> E >> F;
    vector<vector<long long>> dp;
    dp.push_back(vector<long long>(E + 1, 0));
    int t = 0;
    while (dp[t][E] < F) {
        t++;
        vector<long long> row(E + 1, 0);
        for (int e = 1; e <= E; e++) row[e] = dp[t - 1][e - 1] + dp[t - 1][e] + 1;
        dp.push_back(row);
    }
    cout << t << "\\n";
    return 0;
}
`,
    py: `E, F = map(int, input().split())
dp = [[0] * (E + 1)]
t = 0
while dp[t][E] < F:
    t += 1
    row = [0] * (E + 1)
    for e in range(1, E + 1):
        row[e] = dp[t - 1][e - 1] + dp[t - 1][e] + 1
    dp.append(row)
print(t)
`,
    tests: ["1 10", "2 100", "2 10", "3 14", "1 1"],
  },
  {
    slug: "dp-profit-maxim-k-tranzactii",
    title: "Profitul maxim din cel mult K tranzactii bursiere",
    difficulty: "hard",
    tags: ["dp", "avansat"],
    statement: "Se citesc n preturi ale unei actiuni (cate unul pentru fiecare din n zile) si un numar natural k. O tranzactie consta intr-o cumparare urmata de o vanzare; nu puteti detine mai mult de o actiune simultan (trebuie sa vindeti inainte de a cumpara din nou). Determinati, folosind Programarea Dinamica, profitul maxim ce se poate obtine facand CEL MULT k tranzactii.",
    input_format: "Pe prima linie se citesc n si k. Pe a doua linie se citesc cele n preturi.",
    output_format: "Se afiseaza un singur numar: profitul maxim posibil.",
    constraints: "1 <= n <= 1000, 1 <= k <= 100, 0 <= pret <= 10^9",
    hints: "Definiti, pentru fiecare numar de tranzactie t (de la 1 la k), doua stari: buy[t] = profitul maxim dupa ce ati cumparat pentru a t-a oara, si sell[t] = profitul maxim dupa ce ati vandut pentru a t-a oara. Parcurgeti zilele actualizand, pentru fiecare t: buy[t]=max(buy[t], sell[t-1]-pret_curent), sell[t]=max(sell[t], buy[t]+pret_curent).",
    explanation: `${DP_NOTE} Starile buy/sell pentru fiecare numar de tranzactie deja efectuate permit actualizarea 'in loc', pe masura parcurgerii zilelor, fara a fi nevoie sa se retina explicit ziua de cumparare/vanzare a fiecarei tranzactii.\n\n**Complexitate:** O(n*k) timp, O(k) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; long long k;
    cin >> n >> k;
    vector<long long> pret(n);
    for (auto& x : pret) cin >> x;
    vector<long long> buy(k + 1, -4000000000000000000LL), sell(k + 1, 0);
    for (int i = 0; i < n; i++) {
        for (long long t = 1; t <= k; t++) {
            buy[t] = max(buy[t], sell[t - 1] - pret[i]);
            sell[t] = max(sell[t], buy[t] + pret[i]);
        }
    }
    cout << sell[k] << "\\n";
    return 0;
}
`,
    py: `n, k = map(int, input().split())
pret = list(map(int, input().split()))
NEG = -4000000000000000000
buy = [NEG] * (k + 1)
sell = [0] * (k + 1)
for i in range(n):
    for t in range(1, k + 1):
        buy[t] = max(buy[t], sell[t - 1] - pret[i])
        sell[t] = max(sell[t], buy[t] + pret[i])
print(sell[k])
`,
    tests: ["6 2\n3 2 6 5 0 3", "5 2\n1 2 3 4 5", "1 1\n5", "4 1\n1 2 3 4", "6 100\n1 2 3 4 5 6"],
  },
  {
    slug: "dp-cel-mai-lung-subsir-aritmetic",
    title: "Cel mai lung subsir aritmetic",
    difficulty: "hard",
    tags: ["dp", "avansat"],
    statement: "Se citesc n numere. Determinati, folosind Programarea Dinamica, lungimea celui mai lung subsir (nu neaparat contiguu) al sirului care formeaza o progresie aritmetica (diferenta dintre termeni consecutivi ai subsirului este constanta).",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza un singur numar: lungimea celui mai lung subsir aritmetic.",
    constraints: "1 <= n <= 500, -10^6 <= element <= 10^6",
    hints: "Pentru fiecare pozitie i, retineti un dictionar dp[i] care asociaza fiecarei diferente posibile d lungimea celui mai lung subsir aritmetic cu acea diferenta, ce se termina in i. Pentru fiecare pereche (j,i) cu j<i, diferenta d=a[i]-a[j]; dp[i][d] = dp[j][d]+1 (daca exista deja o valoare pentru d in dp[j]), sau 2 altfel.",
    explanation: `${DP_NOTE} Starea nu mai este o simpla valoare, ci un dictionar indexat dupa diferenta comuna d, deoarece lungimea maxima depinde de care anume progresie aritmetica (cu ce diferenta) se continua; aceasta este o generalizare a tehnicii folosite la subsirul crescator maximal.\n\n**Complexitate:** O(n^2) timp si memorie`,
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    vector<unordered_map<long long,int>> dp(n);
    int best = 1;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < i; j++) {
            long long d = a[i] - a[j];
            int val = 2;
            auto it = dp[j].find(d);
            if (it != dp[j].end()) val = it->second + 1;
            auto& cur = dp[i][d];
            cur = max(cur, val);
            best = max(best, cur);
        }
    }
    cout << best << "\\n";
    return 0;
}
`,
    py: `n = int(input())
a = list(map(int, input().split()))
dp = [dict() for _ in range(n)]
best = 1
for i in range(n):
    for j in range(i):
        d = a[i] - a[j]
        val = dp[j].get(d, 1) + 1
        if val > dp[i].get(d, 0):
            dp[i][d] = val
        best = max(best, dp[i][d])
print(best)
`,
    tests: ["5\n9 4 7 2 10", "5\n20 1 15 3 10", "1\n5", "4\n3 6 9 12", "5\n5 5 5 5 5"],
  },
  {
    slug: "dp-rucsac-doua-constrangeri",
    title: "Rucsacul cu doua constrangeri",
    difficulty: "hard",
    tags: ["dp", "rucsac", "avansat"],
    statement: "Se citesc n obiecte, fiecare cu o greutate, un volum si o valoare, si o capacitate maxima de greutate G si un volum maxim disponibil V ale unui rucsac. Fiecare obiect poate fi luat intreg sau deloc. Determinati, folosind Programarea Dinamica, valoarea maxima ce poate fi transportata fara a depasi NICIUNA dintre cele doua limite (greutate si volum).",
    input_format: "Pe prima linie se citesc n, G si V. Urmeaza n linii, fiecare cu trei numere: greutatea, volumul si valoarea unui obiect.",
    output_format: "Se afiseaza un singur numar: valoarea maxima.",
    constraints: "1 <= n <= 100, 1 <= G, V <= 100, 1 <= greutate, volum, valoare <= 1000",
    hints: "Generalizati rucsacul 0/1 la doua dimensiuni: dp[g][v] = valoarea maxima folosind capacitatea de greutate g si volumul v. Pentru fiecare obiect, actualizati dp parcurgand ambele dimensiuni DESCRESCATOR, la fel ca la rucsacul 0/1 obisnuit.",
    explanation: `${DP_NOTE} Adaugarea unei a doua constrangeri (volumul) extinde starea la doua dimensiuni; logica de actualizare (parcurgere descrescatoare, pentru a folosi fiecare obiect cel mult o data) ramane identica cu cea de la rucsacul 0/1 clasic, aplicata simultan pe ambele dimensiuni.\n\n**Complexitate:** O(n*G*V) timp, O(G*V) memorie`,
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; long long G, V;
    cin >> n >> G >> V;
    vector<long long> w(n), vol(n), val(n);
    for (int i = 0; i < n; i++) cin >> w[i] >> vol[i] >> val[i];
    vector<vector<long long>> dp(G + 1, vector<long long>(V + 1, 0));
    for (int i = 0; i < n; i++) {
        for (long long cg = G; cg >= w[i]; cg--) {
            for (long long cv = V; cv >= vol[i]; cv--) {
                dp[cg][cv] = max(dp[cg][cv], dp[cg - w[i]][cv - vol[i]] + val[i]);
            }
        }
    }
    cout << dp[G][V] << "\\n";
    return 0;
}
`,
    py: `n, G, V = map(int, input().split())
w = [0] * n
vol = [0] * n
val = [0] * n
for i in range(n):
    w[i], vol[i], val[i] = map(int, input().split())
dp = [[0] * (V + 1) for _ in range(G + 1)]
for i in range(n):
    for cg in range(G, w[i] - 1, -1):
        for cv in range(V, vol[i] - 1, -1):
            dp[cg][cv] = max(dp[cg][cv], dp[cg - w[i]][cv - vol[i]] + val[i])
print(dp[G][V])
`,
    tests: [
      "3 10 10\n2 3 10\n3 4 20\n4 5 30",
      "2 5 5\n1 1 5\n5 5 6",
      "1 3 3\n2 2 10",
      "4 8 8\n1 1 1\n2 2 4\n3 3 9\n4 4 16",
      "3 4 4\n2 2 3\n2 2 3\n2 2 3",
    ],
  },
  {
    slug: "dp-lantul-maxim-perechi",
    title: "Lantul maxim de perechi",
    difficulty: "medium",
    tags: ["dp", "1d"],
    statement: "Se citesc n perechi de numere (a,b), cu a<b pentru fiecare pereche. O pereche (c,d) poate urma dupa perechea (a,b) intr-un lant daca b<c. Determinati, folosind Programarea Dinamica, lungimea maxima a unui lant de perechi ce se poate forma alegand (in orice ordine doriti) o submultime a perechilor date.",
    input_format: "Pe prima linie se citeste n. Urmeaza n linii, fiecare cu doua numere a si b ale unei perechi.",
    output_format: "Se afiseaza un singur numar: lungimea maxima a unui lant de perechi.",
    constraints: "1 <= n <= 1000, -10^6 <= a < b <= 10^6",
    hints: "Sortati perechile crescator dupa prima componenta. Definiti dp[i] = lungimea maxima a unui lant ce se termina EXACT cu perechea i. dp[i] = 1 + maximul dp[j] pentru toti j<i cu a doua componenta a perechii j STRICT mai mica decat prima componenta a perechii i.",
    explanation: `${DP_NOTE} Dupa sortare, aceasta problema are exact aceeasi structura de recurenta ca subsirul crescator maximal, unde 'compatibilitatea' dintre doua perechi (b[j] < a[i]) joaca rolul relatiei de ordine stricta.\n\n**Complexitate:** O(n^2) timp, O(n) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<pair<long long,long long>> p(n);
    for (auto& x : p) cin >> x.first >> x.second;
    sort(p.begin(), p.end());
    vector<int> dp(n, 1);
    for (int i = 0; i < n; i++)
        for (int j = 0; j < i; j++)
            if (p[j].second < p[i].first) dp[i] = max(dp[i], dp[j] + 1);
    cout << *max_element(dp.begin(), dp.end()) << "\\n";
    return 0;
}
`,
    py: `n = int(input())
p = []
for _ in range(n):
    a, b = map(int, input().split())
    p.append((a, b))
p.sort()
dp = [1] * n
for i in range(n):
    for j in range(i):
        if p[j][1] < p[i][0]:
            dp[i] = max(dp[i], dp[j] + 1)
print(max(dp))
`,
    tests: ["3\n1 2\n2 3\n3 4", "4\n-10 -8\n8 9\n-5 0\n6 10", "1\n1 2", "5\n1 2\n3 4\n5 6\n7 8\n2 3", "2\n1 5\n2 3"],
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
