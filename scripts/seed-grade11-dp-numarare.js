const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade11", chapter: "dp", sub: "dp-numarare" };

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
  // ===================== GRUPA A: FIBONACCI / TILING =====================
  {
    slug: "dp-fibonacci",
    title: "Al n-lea termen Fibonacci",
    difficulty: "easy",
    tags: ["dp", "numarare", "fibonacci"],
    statement: "Se citeste un numar natural n. Determinati, folosind Programarea Dinamica (nu recursivitate simpla, care ar recalcula de nenumarate ori aceleasi subprobleme), al n-lea termen al sirului lui Fibonacci, definit prin F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2) pentru n>=2.",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza un singur numar: F(n).",
    constraints: "0 <= n <= 90",
    hints: "Calculati termenii in ordine, de la F(0) si F(1) pana la F(n), retinand fiecare valoare intr-un tablou (sau doar ultimii doi termeni), in loc sa recalculati recursiv aceleasi subprobleme de mai multe ori.",
    explanation: `${DP_NOTE} Recursivitatea 'naiva' pentru Fibonacci recalculeaza acelasi subproblema de exponential de multe ori; calculand termenii o singura data, in ordine crescatoare, si memorandu-i, se obtine un timp liniar.\n\n**Complexitate:** O(n) timp, O(1) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    if (n == 0) { cout << 0 << "\\n"; return 0; }
    unsigned long long a = 0, b = 1;
    for (int i = 2; i <= n; i++) { unsigned long long c = a + b; a = b; b = c; }
    cout << b << "\\n";
    return 0;
}
`,
    py: `n = int(input())
if n == 0:
    print(0)
else:
    a, b = 0, 1
    for i in range(2, n + 1):
        a, b = b, a + b
    print(b)
`,
    tests: ["0", "1", "10", "50", "90"],
  },
  {
    slug: "dp-numar-moduri-scara-1-2",
    title: "Numarul de moduri de a urca o scara cu pasi de 1 sau 2",
    difficulty: "easy",
    tags: ["dp", "numarare", "fibonacci"],
    statement: "Se citeste un numar natural n, reprezentand numarul de trepte ale unei scari. Determinati, folosind Programarea Dinamica, in cate moduri distincte se poate urca scara, stiind ca la fiecare pas se poate urca fie o treapta, fie doua trepte.",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza un singur numar: numarul de moduri de a urca scara.",
    constraints: "0 <= n <= 90",
    hints: "Definiti dp[i] = numarul de moduri de a urca primele i trepte. dp[0]=1 (nu e nevoie de nicio mutare), dp[1]=1, iar dp[i]=dp[i-1]+dp[i-2] pentru i>=2 (ultimul pas facut a fost fie de o treapta, fie de doua).",
    explanation: `${DP_NOTE} Fiecare mod de a urca cele i trepte se termina fie cu un pas de o treapta (dintr-un mod de a urca i-1 trepte), fie cu un pas de doua trepte (dintr-un mod de a urca i-2 trepte); aceasta recurenta este identica structural cu cea a sirului lui Fibonacci.\n\n**Complexitate:** O(n) timp, O(1) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    unsigned long long a = 1, b = 1;
    for (int i = 2; i <= n; i++) { unsigned long long c = a + b; a = b; b = c; }
    cout << (n == 0 ? 1ULL : b) << "\\n";
    return 0;
}
`,
    py: `n = int(input())
if n == 0:
    print(1)
else:
    a, b = 1, 1
    for i in range(2, n + 1):
        a, b = b, a + b
    print(b)
`,
    tests: ["0", "1", "2", "5", "10"],
  },
  {
    slug: "dp-numar-moduri-scara-1-2-3",
    title: "Numarul de moduri de a urca o scara cu pasi de 1, 2 sau 3",
    difficulty: "easy",
    tags: ["dp", "numarare"],
    statement: "Se citeste un numar natural n, reprezentand numarul de trepte ale unei scari. Determinati, folosind Programarea Dinamica, in cate moduri distincte se poate urca scara, stiind ca la fiecare pas se poate urca 1, 2 sau 3 trepte.",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza un singur numar: numarul de moduri de a urca scara.",
    constraints: "0 <= n <= 60",
    hints: "Definiti dp[i] = numarul de moduri de a urca primele i trepte. dp[0]=1, dp[1]=1, dp[2]=2, iar dp[i]=dp[i-1]+dp[i-2]+dp[i-3] pentru i>=3 (dupa tipul ultimului pas facut).",
    explanation: `${DP_NOTE} Generalizare directa a recurentei Fibonacci (numita si 'sirul lui Tribonacci'): fiecare mod de a urca i trepte se obtine dintr-un mod de a urca i-1, i-2 sau i-3 trepte, completat cu un ultim pas corespunzator.\n\n**Complexitate:** O(n) timp, O(1) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<unsigned long long> dp(max(n + 1, 3));
    dp[0] = 1; dp[1] = 1; dp[2] = 2;
    for (int i = 3; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2] + dp[i - 3];
    cout << dp[n] << "\\n";
    return 0;
}
`,
    py: `n = int(input())
dp = [1, 1, 2]
for i in range(3, n + 1):
    dp.append(dp[-1] + dp[-2] + dp[-3])
print(dp[n])
`,
    tests: ["0", "1", "3", "10", "30"],
  },
  {
    slug: "dp-domino-2xn",
    title: "Numarul de moduri de a acoperi un dreptunghi 2xN cu domino",
    difficulty: "medium",
    tags: ["dp", "numarare"],
    statement: "Se citeste un numar natural n. Determinati, folosind Programarea Dinamica, in cate moduri distincte poate fi acoperit complet, fara suprapuneri, un dreptunghi cu 2 linii si n coloane, folosind piese domino de dimensiune 1x2 (asezate orizontal sau vertical).",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza un singur numar: numarul de acoperiri posibile.",
    constraints: "0 <= n <= 90",
    hints: "Definiti dp[i] = numarul de acoperiri ale unui dreptunghi 2xi. Ultima coloana poate fi acoperita fie de o singura piesa verticala (ramanand de acoperit 2x(i-1)), fie de doua piese orizontale care ocupa ultimele doua coloane (ramanand de acoperit 2x(i-2)).",
    explanation: `${DP_NOTE} Recurenta dp[i]=dp[i-1]+dp[i-2] (identica structural cu cea a lui Fibonacci) provine din cele doua moduri posibile de a 'inchide' ultima coloana a dreptunghiului: cu o piesa verticala sau cu doua piese orizontale.\n\n**Complexitate:** O(n) timp, O(1) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    unsigned long long a = 1, b = 1;
    for (int i = 2; i <= n; i++) { unsigned long long c = a + b; a = b; b = c; }
    cout << (n == 0 ? 1ULL : b) << "\\n";
    return 0;
}
`,
    py: `n = int(input())
if n == 0:
    print(1)
else:
    a, b = 1, 1
    for i in range(2, n + 1):
        a, b = b, a + b
    print(b)
`,
    tests: ["0", "1", "2", "3", "10"],
  },
  {
    slug: "dp-domino-3xn",
    title: "Numarul de moduri de a acoperi un dreptunghi 3xN cu domino",
    difficulty: "hard",
    tags: ["dp", "numarare"],
    statement: "Se citeste un numar natural n (par). Determinati, folosind Programarea Dinamica, in cate moduri distincte poate fi acoperit complet, fara suprapuneri, un dreptunghi cu 3 linii si n coloane, folosind piese domino de dimensiune 1x2. Daca n este impar, o astfel de acoperire este imposibila.",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza un singur numar: numarul de acoperiri posibile (0 daca n este impar).",
    constraints: "0 <= n <= 30",
    hints: "Se poate demonstra ca numarul de acoperiri ale unui dreptunghi 3xn (n par) satisface recurenta f(n) = 4*f(n-2) - f(n-4), cu f(0)=1 si f(2)=3. Folositi aceasta recurenta pentru a calcula f(n) prin Programare Dinamica.",
    explanation: `${DP_NOTE} Spre deosebire de dreptunghiul 2xn, la latimea 3 relatia de recurenta directa 'dupa ultima coloana' este mai complexa (necesita analiza mai multor configuratii posibile la marginea acoperirii); rezultatul acestei analize se rezuma insa la o recurenta liniara de ordin superior, f(n)=4f(n-2)-f(n-4), usor de calculat prin Programare Dinamica.\n\n**Complexitate:** O(n) timp, O(1) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    if (n % 2 == 1) { cout << 0 << "\\n"; return 0; }
    vector<long long> f(n + 1, 0);
    f[0] = 1;
    if (n >= 2) f[2] = 3;
    for (int i = 4; i <= n; i += 2) f[i] = 4 * f[i - 2] - f[i - 4];
    cout << f[n] << "\\n";
    return 0;
}
`,
    py: `n = int(input())
if n % 2 == 1:
    print(0)
else:
    f = [0] * (n + 1)
    f[0] = 1
    if n >= 2:
        f[2] = 3
    for i in range(4, n + 1, 2):
        f[i] = 4 * f[i - 2] - f[i - 4]
    print(f[n])
`,
    tests: ["0", "2", "4", "6", "8"],
  },
  {
    slug: "dp-gard-culori",
    title: "Numarul de moduri de a vopsi un gard",
    difficulty: "medium",
    tags: ["dp", "numarare"],
    statement: "Se citesc doua numere naturale n si k. Un gard are n stalpi, fiecare putand fi vopsit cu una dintre cele k culori disponibile. Determinati, folosind Programarea Dinamica, in cate moduri se poate vopsi gardul astfel incat sa nu existe 3 stalpi CONSECUTIVI vopsiti cu aceeasi culoare.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si k.",
    output_format: "Se afiseaza un singur numar: numarul de colorari valide.",
    constraints: "1 <= n <= 25, 2 <= k <= 6",
    hints: "Definiti dp[i] = numarul de colorari valide ale primilor i stalpi. dp[1]=k, dp[2]=k*k. Pentru i>=3, dp[i]=(dp[i-1]+dp[i-2])*(k-1): fiecare colorare valida a primilor i-1 sau i-2 stalpi poate fi extinsa cu un stalp de o culoare diferita de cea imediat precedenta, in (k-1) moduri.",
    explanation: `${DP_NOTE} Formula dp[i]=(dp[i-1]+dp[i-2])*(k-1) provine dintr-o analiza atenta a ultimilor stalpi coloraţi: orice colorare valida a primilor i stalpi se obtine fie dintr-o colorare valida a primilor i-1 (adaugand un stalp de culoare diferita fata de al (i-1)-lea), fie dintr-una a primilor i-2 (adaugand doi stalpi de aceeasi culoare noua, diferita de a (i-2)-a).\n\n**Complexitate:** O(n) timp, O(1) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n, k; cin >> n >> k;
    if (n == 1) { cout << k << "\\n"; return 0; }
    vector<long long> dp(n + 1);
    dp[1] = k; dp[2] = k * k;
    for (long long i = 3; i <= n; i++) dp[i] = (dp[i - 1] + dp[i - 2]) * (k - 1);
    cout << dp[n] << "\\n";
    return 0;
}
`,
    py: `n, k = map(int, input().split())
if n == 1:
    print(k)
else:
    dp = [0] * (n + 1)
    dp[1] = k
    dp[2] = k * k
    for i in range(3, n + 1):
        dp[i] = (dp[i - 1] + dp[i - 2]) * (k - 1)
    print(dp[n])
`,
    tests: ["3 2", "1 5", "2 4", "4 3", "7 2"],
  },
  {
    slug: "dp-siruri-binare-fara-doi-1-numarare",
    title: "Numarul de siruri binare fara doi de 1 consecutivi",
    difficulty: "easy",
    tags: ["dp", "numarare"],
    statement: "Se citeste un numar natural n. Determinati, folosind Programarea Dinamica, cate siruri binare (formate din cifrele 0 si 1) de lungime n NU contin doua cifre de 1 alaturate.",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza un singur numar: numarul de astfel de siruri.",
    constraints: "0 <= n <= 90",
    hints: "Definiti dp0[i] = numarul de siruri valide de lungime i care se termina in 0, si dp1[i] = cele care se termina in 1. dp0[i]=dp0[i-1]+dp1[i-1] (orice sir valid mai scurt poate fi extins cu 0), iar dp1[i]=dp0[i-1] (un sir care se termina in 1 poate fi extins cu 1 doar daca precedentul se termina in 0).",
    explanation: `${DP_NOTE} Cele doua stari (dp0 si dp1) retin ultima cifra plasata, singura informatie relevanta pentru a decide daca urmatoarea cifra poate fi 1; suma lor la fiecare lungime da numarul total de siruri valide de acea lungime.\n\n**Complexitate:** O(n) timp, O(1) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    if (n == 0) { cout << 1 << "\\n"; return 0; }
    unsigned long long dp0 = 1, dp1 = 1;
    for (int i = 2; i <= n; i++) {
        unsigned long long ndp0 = dp0 + dp1, ndp1 = dp0;
        dp0 = ndp0; dp1 = ndp1;
    }
    cout << (dp0 + dp1) << "\\n";
    return 0;
}
`,
    py: `n = int(input())
if n == 0:
    print(1)
else:
    dp0, dp1 = 1, 1
    for i in range(2, n + 1):
        dp0, dp1 = dp0 + dp1, dp0
    print(dp0 + dp1)
`,
    tests: ["1", "2", "3", "10", "50"],
  },

  // ===================== GRUPA B: COMBINATORICA =====================
  {
    slug: "dp-partitii-numar-dp",
    title: "Numarul de partitii ale unui numar (Programare Dinamica)",
    difficulty: "medium",
    tags: ["dp", "numarare", "partitii"],
    statement: "Se citeste un numar natural n. Determinati, folosind Programarea Dinamica, numarul de partitii ale lui n (numarul de moduri de a scrie n ca suma de numere naturale nenule, fara a tine cont de ordinea termenilor).",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza un singur numar: numarul de partitii ale lui n.",
    constraints: "0 <= n <= 300",
    hints: "Definiti dp[s] = numarul de moduri de a obtine suma s folosind 'partile' considerate pana acum. Pornind cu dp[0]=1, parcurgeti fiecare parte posibila (de la 1 la n) si, pentru fiecare, actualizati dp[s]+=dp[s-parte] pentru s CRESCATOR (spre deosebire de rucsacul 0/1), permitand astfel reutilizarea aceleiasi parti de mai multe ori.",
    explanation: `${DP_NOTE} Aceasta este exact tehnica 'numarului de moduri de a obtine o suma cu monede, ordinea nefiind relevanta' (fiecare 'parte' posibila jucand rolul unei valori de moneda disponibile nelimitat), aplicata partilor 1,2,...,n insele; parcurgerea crescatoare a sumelor permite reutilizarea aceleiasi parti de mai multe ori in aceeasi partitie.\n\n**Complexitate:** O(n^2) timp, O(n) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<unsigned long long> dp(n + 1, 0);
    dp[0] = 1;
    for (int part = 1; part <= n; part++)
        for (int s = part; s <= n; s++)
            dp[s] += dp[s - part];
    cout << dp[n] << "\\n";
    return 0;
}
`,
    py: `n = int(input())
dp = [0] * (n + 1)
dp[0] = 1
for part in range(1, n + 1):
    for s in range(part, n + 1):
        dp[s] += dp[s - part]
print(dp[n])
`,
    tests: ["0", "1", "6", "50", "100"],
  },
  {
    slug: "dp-partitii-numar-exact-k-parti-dp",
    title: "Numarul de partitii ale unui numar in exact k parti (DP)",
    difficulty: "medium",
    tags: ["dp", "numarare", "partitii"],
    statement: "Se citesc doua numere naturale n si k. Determinati, folosind Programarea Dinamica, numarul de partitii ale lui n care au exact k termeni.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si k.",
    output_format: "Se afiseaza un singur numar: numarul de partitii ale lui n cu exact k termeni.",
    constraints: "0 <= n <= 300, 0 <= k <= 300",
    hints: "Definiti dp[i][j] = numarul de partitii ale lui i cu exact j termeni. O astfel de partitie fie contine un termen egal cu 1 (eliminandu-l, ramane o partitie a lui i-1 cu j-1 termeni), fie toti termenii sunt cel putin 2 (scazand 1 din fiecare termen, ramane o partitie a lui i-j cu j termeni). Deci dp[i][j] = dp[i-1][j-1] + dp[i-j][j].",
    explanation: `${DP_NOTE} Recurenta dp[i][j]=dp[i-1][j-1]+dp[i-j][j] provine dintr-o clasificare simpla a partitiilor dupa faptul ca au sau nu un termen egal cu 1: primul caz reduce direct numarul de termeni, al doilea reduce toti termenii deodata (echivalent cu a scadea cate 1 din fiecare).\n\n**Complexitate:** O(n*k) timp si memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, k; cin >> n >> k;
    if (k > n || (k == 0 && n > 0)) { cout << 0 << "\\n"; return 0; }
    if (n == 0 && k == 0) { cout << 1 << "\\n"; return 0; }
    vector<vector<unsigned long long>> dp(n + 1, vector<unsigned long long>(k + 1, 0));
    dp[0][0] = 1;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= min(i, k); j++) {
            unsigned long long val = dp[i - 1][j - 1];
            val += dp[i - j][j];
            dp[i][j] = val;
        }
    }
    cout << dp[n][k] << "\\n";
    return 0;
}
`,
    py: `n, k = map(int, input().split())
if k > n or (k == 0 and n > 0):
    print(0)
elif n == 0 and k == 0:
    print(1)
else:
    dp = [[0] * (k + 1) for _ in range(n + 1)]
    dp[0][0] = 1
    for i in range(1, n + 1):
        for j in range(1, min(i, k) + 1):
            dp[i][j] = dp[i - 1][j - 1] + dp[i - j][j]
    print(dp[n][k])
`,
    tests: ["10 3", "6 2", "5 5", "20 4", "7 1"],
  },
  {
    slug: "dp-catalan-paranteze",
    title: "Numarul de secvente de paranteze balansate (Catalan)",
    difficulty: "medium",
    tags: ["dp", "numarare", "catalan"],
    statement: "Se citeste un numar natural n. Determinati, folosind Programarea Dinamica, numarul de secvente corecte (balansate) formate din n perechi de paranteze rotunde (numarul lui Catalan de ordin n).",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza un singur numar: numarul de secvente balansate.",
    constraints: "0 <= n <= 30",
    hints: "O secventa balansata de n perechi se descompune unic astfel: prima paranteza deschisa se inchide undeva pe pozitia 2i+1, incadrand o subsecventa balansata de i perechi, urmata de o subsecventa balansata de restul de n-1-i perechi. Deci C(n) = suma, pentru i de la 0 la n-1, a produsului C(i)*C(n-1-i), cu C(0)=1.",
    explanation: `${DP_NOTE} Aceasta recurenta (C(n) = suma C(i)*C(n-1-i)) este definitia standard a numerelor lui Catalan; fiecare secventa se 'descompune' dupa pozitia unde se inchide prima paranteza deschisa, separand-o intr-o parte 'incadrata' si una 'ramasa'.\n\n**Complexitate:** O(n^2) timp, O(n) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<unsigned long long> C(n + 1, 0);
    C[0] = 1;
    for (int i = 1; i <= n; i++) {
        unsigned long long s = 0;
        for (int j = 0; j < i; j++) s += C[j] * C[i - 1 - j];
        C[i] = s;
    }
    cout << C[n] << "\\n";
    return 0;
}
`,
    py: `n = int(input())
C = [0] * (n + 1)
C[0] = 1
for i in range(1, n + 1):
    s = 0
    for j in range(i):
        s += C[j] * C[i - 1 - j]
    C[i] = s
print(C[n])
`,
    tests: ["0", "1", "3", "10", "20"],
  },
  {
    slug: "dp-arbori-binari-cautare",
    title: "Numarul de arbori binari de cautare distincti",
    difficulty: "medium",
    tags: ["dp", "numarare", "catalan"],
    statement: "Se citeste un numar natural n. Determinati, folosind Programarea Dinamica, numarul de arbori binari de cautare distincti (ca structura) ce se pot forma avand ca noduri valorile 1, 2, ..., n.",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza un singur numar: numarul de arbori binari de cautare distincti.",
    constraints: "0 <= n <= 30",
    hints: "Pentru fiecare alegere a valorii radacinii r (de la 1 la n), subarborele stang va contine valorile 1..r-1, iar cel drept valorile r+1..n; numarul de arbori cu radacina r este produsul dintre numarul de subarbori stangi posibili (dp[r-1]) si cel de subarbori drepti posibili (dp[n-r]). Insumati aceste produse pentru toate valorile posibile ale lui r.",
    explanation: `${DP_NOTE} Deoarece un arbore binar de cautare este determinat de alegerea radacinii si de structura (independenta) a celor doi subarbori, numarul total dp[n] = suma, pentru r de la 1 la n, a produsului dp[r-1]*dp[n-r]; aceasta recurenta este identica (doar redenumita) cu cea a numerelor lui Catalan.\n\n**Complexitate:** O(n^2) timp, O(n) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<unsigned long long> dp(n + 1, 0);
    dp[0] = 1;
    for (int i = 1; i <= n; i++) {
        unsigned long long s = 0;
        for (int r = 1; r <= i; r++) s += dp[r - 1] * dp[i - r];
        dp[i] = s;
    }
    cout << dp[n] << "\\n";
    return 0;
}
`,
    py: `n = int(input())
dp = [0] * (n + 1)
dp[0] = 1
for i in range(1, n + 1):
    s = 0
    for r in range(1, i + 1):
        s += dp[r - 1] * dp[i - r]
    dp[i] = s
print(dp[n])
`,
    tests: ["0", "1", "3", "10", "19"],
  },
  {
    slug: "dp-triangulare-poligon-numar",
    title: "Numarul de triangulari ale unui poligon convex",
    difficulty: "medium",
    tags: ["dp", "numarare", "catalan"],
    statement: "Se citeste un numar natural n (numarul de laturi ale unui poligon convex, n>=3). Determinati, folosind Programarea Dinamica, in cate moduri distincte poate fi impartit poligonul in triunghiuri prin diagonale care nu se intersecteaza in interior (triangulare).",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza un singur numar: numarul de triangulari posibile.",
    constraints: "3 <= n <= 32",
    hints: "Numarul de triangulari ale unui poligon cu n laturi este exact numarul lui Catalan de ordin n-2. Calculati numerele lui Catalan C(0), C(1), ..., C(n-2) folosind recurenta C(m) = suma, pentru i de la 0 la m-1, a produsului C(i)*C(m-1-i), cu C(0)=1.",
    explanation: `${DP_NOTE} Aceasta este o alta aparitie a numerelor lui Catalan: alegerea triunghiului care contine o latura fixata a poligonului imparte restul poligonului in doua bucati mai mici, independente, exact ca la numararea arborilor binari de cautare sau a secventelor de paranteze balansate.\n\n**Complexitate:** O(n^2) timp, O(n) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    int m = n - 2;
    vector<unsigned long long> C(m + 1, 0);
    C[0] = 1;
    for (int i = 1; i <= m; i++) {
        unsigned long long s = 0;
        for (int j = 0; j < i; j++) s += C[j] * C[i - 1 - j];
        C[i] = s;
    }
    cout << C[m] << "\\n";
    return 0;
}
`,
    py: `n = int(input())
m = n - 2
C = [0] * (m + 1)
C[0] = 1
for i in range(1, m + 1):
    s = 0
    for j in range(i):
        s += C[j] * C[i - 1 - j]
    C[i] = s
print(C[m])
`,
    tests: ["3", "4", "5", "10", "22"],
  },
  {
    slug: "dp-combinari-repetitie-dp",
    title: "Numarul de moduri de a imparti obiecte identice intre persoane",
    difficulty: "medium",
    tags: ["dp", "numarare"],
    statement: "Se citesc doua numere naturale n si k. Determinati, folosind Programarea Dinamica, in cate moduri distincte pot fi impartite n obiecte identice intre k persoane, o persoana putand primi 0, 1 sau mai multe obiecte.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si k.",
    output_format: "Se afiseaza un singur numar: numarul de moduri de distribuire.",
    constraints: "0 <= n <= 20, 0 <= k <= 20",
    hints: "Definiti dp[i][j] = numarul de moduri de a distribui i obiecte la j persoane. dp[0][j]=1 pentru orice j (nu exista obiecte de distribuit). dp[i][j] = dp[i][j-1] (persoana j nu primeste niciun obiect) + dp[i-1][j] (persoana j primeste cel putin un obiect, deci 'rezervam' un obiect pentru ea si distribuim restul de i-1 obiecte tot la j persoane).",
    explanation: `${DP_NOTE} Aceasta recurenta dp[i][j] = dp[i][j-1] + dp[i-1][j] este varianta 'stele si bare' rezolvata prin Programare Dinamica in loc de formula combinatorica directa C(n+k-1,k-1): fiecare distribuire fie exclude complet ultima persoana, fie ii aloca acesteia (cel putin) un obiect.\n\n**Complexitate:** O(n*k) timp si memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, k; cin >> n >> k;
    if (k == 0) { cout << (n == 0 ? 1 : 0) << "\\n"; return 0; }
    vector<vector<unsigned long long>> dp(n + 1, vector<unsigned long long>(k + 1, 0));
    for (int j = 0; j <= k; j++) dp[0][j] = 1;
    for (int i = 1; i <= n; i++) {
        dp[i][0] = 0;
        for (int j = 1; j <= k; j++) dp[i][j] = dp[i][j - 1] + dp[i - 1][j];
    }
    cout << dp[n][k] << "\\n";
    return 0;
}
`,
    py: `n, k = map(int, input().split())
if k == 0:
    print(1 if n == 0 else 0)
else:
    dp = [[0] * (k + 1) for _ in range(n + 1)]
    for j in range(k + 1):
        dp[0][j] = 1
    for i in range(1, n + 1):
        dp[i][0] = 0
        for j in range(1, k + 1):
            dp[i][j] = dp[i][j - 1] + dp[i - 1][j]
    print(dp[n][k])
`,
    tests: ["5 3", "0 4", "10 1", "6 6", "15 5"],
  },
  {
    slug: "dp-numar-cai-matrice-obstacole-dp",
    title: "Numarul de drumuri intr-o matrice cu obstacole (Programare Dinamica)",
    difficulty: "easy",
    tags: ["dp", "numarare", "matrice"],
    statement: "Se citesc doua numere naturale n si m, apoi o matrice cu n linii si m coloane, continand valori 0 (celula libera) sau 1 (obstacol). Determinati, folosind Programarea Dinamica, numarul de drumuri de la celula (1,1) la celula (n,m), stiind ca la fiecare pas ne putem deplasa fie la dreapta, fie in jos, fara a trece prin obstacole.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza n linii, fiecare cu m valori (0 sau 1).",
    output_format: "Se afiseaza un singur numar: numarul de drumuri de la (1,1) la (n,m).",
    constraints: "1 <= n, m <= 20",
    hints: "Definiti dp[i][j] = numarul de drumuri de la (1,1) la (i,j). Daca celula (i,j) este obstacol, dp[i][j]=0. Altfel, dp[i][j]=dp[i-1][j]+dp[i][j-1] (cu conventia ca celulele in afara matricei valoreaza 0, iar dp[1][1]=1 daca nu e obstacol).",
    explanation: `${DP_NOTE} Spre deosebire de rezolvarea prin Backtracking (exponentiala), aceasta abordare calculeaza numarul de drumuri catre fiecare celula o singura data, refolosind rezultatele pentru celulele deja calculate; complexitatea devine liniara in numarul de celule.\n\n**Complexitate:** O(n*m) timp si memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> a(n + 1, vector<int>(m + 1, 0));
    for (int i = 1; i <= n; i++) for (int j = 1; j <= m; j++) cin >> a[i][j];
    vector<vector<unsigned long long>> dp(n + 1, vector<unsigned long long>(m + 1, 0));
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (a[i][j] == 1) continue;
            if (i == 1 && j == 1) dp[i][j] = 1;
            else dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
        }
    }
    cout << dp[n][m] << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
a = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    row = list(map(int, input().split()))
    for j in range(1, m + 1):
        a[i][j] = row[j - 1]
dp = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    for j in range(1, m + 1):
        if a[i][j] == 1:
            continue
        if i == 1 and j == 1:
            dp[i][j] = 1
        else:
            dp[i][j] = dp[i - 1][j] + dp[i][j - 1]
print(dp[n][m])
`,
    tests: [
      "2 2\n0 0\n0 0",
      "3 3\n0 0 0\n0 1 0\n0 0 0",
      "3 3\n0 0 0\n1 1 0\n0 0 0",
      "2 3\n0 0 0\n0 0 0",
      "20 20\n" + Array.from({ length: 20 }, () => "0 ".repeat(20).trim()).join("\n"),
    ],
  },
  {
    slug: "dp-stirling-partitii-k-submultimi",
    title: "Numarul lui Stirling de speta a doua (Programare Dinamica)",
    difficulty: "medium",
    tags: ["dp", "numarare"],
    statement: "Se citesc doua numere naturale n si k. Determinati, folosind Programarea Dinamica, numarul de partitii ale multimii {1,2,...,n} in exact k submultimi nevide (numarul lui Stirling de speta a doua, S(n,k)), aplicand recurenta S(n,k) = k*S(n-1,k) + S(n-1,k-1).",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si k.",
    output_format: "Se afiseaza un singur numar: S(n,k).",
    constraints: "0 <= n <= 20, 0 <= k <= 20",
    hints: "Elementul n poate fi adaugat fie intr-una dintre cele k submultimi deja formate din primele n-1 elemente (in k moduri, de unde termenul k*S(n-1,k)), fie poate forma singur o noua submultime (termenul S(n-1,k-1), corespunzator unei partitii a primelor n-1 elemente in k-1 submultimi).",
    explanation: `${DP_NOTE} Recurenta lui Stirling reflecta exact cele doua situatii posibile pentru elementul n intr-o partitie a intregii multimi: fie se alatura uneia dintre submultimile deja existente formate din celelalte n-1 elemente, fie formeaza singur o submultime noua.\n\n**Complexitate:** O(n*k) timp si memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, k; cin >> n >> k;
    vector<vector<unsigned long long>> dp(n + 1, vector<unsigned long long>(k + 1, 0));
    dp[0][0] = 1;
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= min(i, k); j++)
            dp[i][j] = (unsigned long long)j * dp[i - 1][j] + dp[i - 1][j - 1];
    cout << dp[n][k] << "\\n";
    return 0;
}
`,
    py: `n, k = map(int, input().split())
dp = [[0] * (k + 1) for _ in range(n + 1)]
dp[0][0] = 1
for i in range(1, n + 1):
    for j in range(1, min(i, k) + 1):
        dp[i][j] = j * dp[i - 1][j] + dp[i - 1][j - 1]
print(dp[n][k])
`,
    tests: ["5 2", "10 5", "6 3", "20 10", "4 4"],
  },
  {
    slug: "dp-bell-numar-partitii",
    title: "Numarul lui Bell (Programare Dinamica)",
    difficulty: "medium",
    tags: ["dp", "numarare"],
    statement: "Se citeste un numar natural n. Determinati, folosind Programarea Dinamica (triunghiul lui Bell), numarul de partitii ale multimii {1,2,...,n} in submultimi nevide (numarul lui Bell, B(n)).",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza un singur numar: B(n).",
    constraints: "0 <= n <= 20",
    hints: "Construiti triunghiul lui Bell: a[0][0]=1. Pentru fiecare linie i>=1, primul element este ultimul element al liniei precedente (a[i][0]=a[i-1][i-1]), iar fiecare element urmator este suma dintre elementul anterior de pe aceeasi linie si elementul de deasupra lui din linia precedenta (a[i][j]=a[i][j-1]+a[i-1][j-1]). Numarul lui Bell B(n) este a[n][0].",
    explanation: `${DP_NOTE} Triunghiul lui Bell este o constructie DP clasica in care fiecare linie i codifica, indirect, toate numerele lui Stirling de speta a doua pentru n=i; primul element al fiecarei linii este chiar numarul lui Bell cautat.\n\n**Complexitate:** O(n^2) timp si memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<vector<unsigned long long>> a(n + 1, vector<unsigned long long>(n + 1, 0));
    a[0][0] = 1;
    for (int i = 1; i <= n; i++) {
        a[i][0] = a[i - 1][i - 1];
        for (int j = 1; j <= i; j++) a[i][j] = a[i][j - 1] + a[i - 1][j - 1];
    }
    cout << a[n][0] << "\\n";
    return 0;
}
`,
    py: `n = int(input())
a = [[0] * (n + 1) for _ in range(n + 1)]
a[0][0] = 1
for i in range(1, n + 1):
    a[i][0] = a[i - 1][i - 1]
    for j in range(1, i + 1):
        a[i][j] = a[i][j - 1] + a[i - 1][j - 1]
print(a[n][0])
`,
    tests: ["0", "1", "5", "10", "20"],
  },

  // ===================== GRUPA C: SUMA / SUBSETURI =====================
  {
    slug: "dp-numar-submultimi-suma-data",
    title: "Numarul de submultimi cu suma data",
    difficulty: "medium",
    tags: ["dp", "numarare"],
    statement: "Se citesc n numere naturale si o suma S. Determinati, folosind Programarea Dinamica, cate submultimi (alese dupa pozitie, nu dupa valoare) ale celor n numere au suma exact S.",
    input_format: "Pe prima linie se citesc n si S. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza un singur numar: numarul de submultimi cu suma S.",
    constraints: "1 <= n <= 40, 0 <= S <= 10000, 0 <= element <= 10000",
    hints: "Definiti dp[s] = numarul de submultimi (dintre elementele considerate pana acum) cu suma s. dp[0]=1 initial. Pentru fiecare element nou, actualizati dp[s]+=dp[s-element] pentru s DESCRESCATOR (de la S la valoarea elementului), la fel ca la rucsacul 0/1, pentru a numara fiecare element o singura data.",
    explanation: `${DP_NOTE} Este varianta 'de numarare' a problemei existentei unei submultimi cu suma exacta: in loc sa retinem doar daca suma s este posibila, retinem in CATE moduri este posibila, folosind aceeasi schema de actualizare descrescatoare specifica rucsacului 0/1.\n\n**Complexitate:** O(n*S) timp, O(S) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; long long S;
    cin >> n >> S;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    vector<unsigned long long> dp(S + 1, 0);
    dp[0] = 1;
    for (int i = 0; i < n; i++)
        for (long long s = S; s >= a[i]; s--)
            dp[s] += dp[s - a[i]];
    cout << dp[S] << "\\n";
    return 0;
}
`,
    py: `n, S = map(int, input().split())
a = list(map(int, input().split()))
dp = [0] * (S + 1)
dp[0] = 1
for i in range(n):
    for s in range(S, a[i] - 1, -1):
        dp[s] += dp[s - a[i]]
print(dp[S])
`,
    tests: ["6 9\n3 34 4 12 5 2", "5 10\n1 2 3 4 5", "3 0\n1 2 3", "4 6\n1 1 1 3", "1 5\n5"],
  },
  {
    slug: "dp-numar-submultimi-suma-si-marime",
    title: "Numarul de submultimi de dimensiune data cu suma data",
    difficulty: "medium",
    tags: ["dp", "numarare"],
    statement: "Se citesc n numere naturale, un numar k si o suma S. Determinati, folosind Programarea Dinamica, cate submultimi de dimensiune EXACT k au suma exact S.",
    input_format: "Pe prima linie se citesc n, k si S. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza un singur numar: numarul de submultimi cautate.",
    constraints: "1 <= n <= 40, 0 <= k <= n, 0 <= S <= 10000, 0 <= element <= 10000",
    hints: "Definiti dp[c][s] = numarul de submultimi de dimensiune c si suma s, dintre elementele considerate pana acum. Pentru fiecare element nou, actualizati dp[c][s]+=dp[c-1][s-element] pentru c si s DESCRESCATOR (dimensiunea si suma se actualizeaza simultan, descrescator, ca la rucsacul 0/1 cu doua dimensiuni).",
    explanation: `${DP_NOTE} Aceasta problema adauga o a doua dimensiune (numarul de elemente alese) fata de simpla numarare a submultimilor cu suma data; actualizarea descrescatoare pe ambele dimensiuni pastreaza garantia ca fiecare element este folosit cel mult o data.\n\n**Complexitate:** O(n*k*S) timp, O(k*S) memorie`,
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, k; long long S;
    cin >> n >> k >> S;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    vector<vector<unsigned long long>> dp(k + 1, vector<unsigned long long>(S + 1, 0));
    dp[0][0] = 1;
    for (int i = 0; i < n; i++)
        for (int c = min(i + 1, k); c >= 1; c--)
            for (long long s = S; s >= a[i]; s--)
                dp[c][s] += dp[c - 1][s - a[i]];
    cout << dp[k][S] << "\\n";
    return 0;
}
`,
    py: `n, k, S = map(int, input().split())
a = list(map(int, input().split()))
dp = [[0] * (S + 1) for _ in range(k + 1)]
dp[0][0] = 1
for i in range(n):
    for c in range(min(i + 1, k), 0, -1):
        for s in range(S, a[i] - 1, -1):
            dp[c][s] += dp[c - 1][s - a[i]]
print(dp[k][S])
`,
    tests: ["5 2 6\n1 2 3 4 5", "4 0 0\n1 2 3 4", "6 3 10\n1 2 3 4 5 6", "4 2 100\n1 2 3 4", "3 3 6\n1 2 3"],
  },
  {
    slug: "dp-numar-moduri-monede-combinatii",
    title: "Numarul de moduri de a obtine o suma cu monede (combinatii)",
    difficulty: "medium",
    tags: ["dp", "numarare", "monede"],
    statement: "Se citesc m tipuri de monede (valori date, disponibile in cantitate nelimitata) si o suma S. Determinati, folosind Programarea Dinamica, in cate moduri distincte se poate obtine suma S folosind aceste monede, ORDINEA in care sunt folosite monedele nefiind relevanta (doua moduri care folosesc aceleasi cantitati din fiecare tip de moneda sunt considerate identice).",
    input_format: "Pe prima linie se citesc m si S. Pe a doua linie se citesc cele m valori ale monedelor.",
    output_format: "Se afiseaza un singur numar: numarul de moduri de a obtine suma S.",
    constraints: "1 <= m <= 100, 0 <= S <= 10000, 1 <= valoare moneda <= 10000",
    hints: "Definiti dp[s] = numarul de moduri de a obtine suma s. dp[0]=1. Parcurgeti monedele in exterior si sumele CRESCATOR in interior (dp[s]+=dp[s-moneda]): astfel, fiecare combinatie de monede este numarata o singura data, indiferent de ordinea in care ar putea fi folosite monedele.",
    explanation: `${DP_NOTE} Ordinea buclelor este esentiala: parcurgand monedele in bucla EXTERIOARA, o combinatie (de exemplu, o moneda de 1 si una de 2) este numarata o singura data, indiferent daca 'am fi putut' folosi mai intai moneda de 2 si apoi cea de 1 — cele doua ordini nu sunt distinse.\n\n**Complexitate:** O(m*S) timp, O(S) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int m; long long S;
    cin >> m >> S;
    vector<long long> c(m);
    for (auto& x : c) cin >> x;
    vector<unsigned long long> dp(S + 1, 0);
    dp[0] = 1;
    for (int i = 0; i < m; i++)
        for (long long s = c[i]; s <= S; s++)
            dp[s] += dp[s - c[i]];
    cout << dp[S] << "\\n";
    return 0;
}
`,
    py: `m, S = map(int, input().split())
c = list(map(int, input().split()))
dp = [0] * (S + 1)
dp[0] = 1
for i in range(m):
    for s in range(c[i], S + 1):
        dp[s] += dp[s - c[i]]
print(dp[S])
`,
    tests: ["3 4\n1 2 3", "2 5\n1 2", "1 10\n3", "4 10\n1 2 5 10", "3 0\n2 3 5"],
  },
  {
    slug: "dp-numar-moduri-monede-permutari",
    title: "Numarul de moduri de a obtine o suma cu monede (ordinea conteaza)",
    difficulty: "medium",
    tags: ["dp", "numarare", "monede"],
    statement: "Se citesc m tipuri de monede (valori date, disponibile in cantitate nelimitata) si o suma S. Determinati, folosind Programarea Dinamica, in cate secvente ORDONATE distincte de monede se poate obtine suma S (doua secvente care folosesc aceleasi monede, dar intr-o alta ordine, sunt considerate distincte).",
    input_format: "Pe prima linie se citesc m si S. Pe a doua linie se citesc cele m valori ale monedelor.",
    output_format: "Se afiseaza un singur numar: numarul de secvente ordonate ce formeaza suma S.",
    constraints: "1 <= m <= 100, 0 <= S <= 10000, 1 <= valoare moneda <= 10000",
    hints: "Definiti dp[s] = numarul de secvente ordonate de monede cu suma s. dp[0]=1. De data aceasta, parcurgeti sumele in bucla EXTERIOARA (crescator) si monedele in bucla interioara: dp[s] += dp[s-moneda] pentru fiecare tip de moneda. Astfel, aceeasi pereche de monede, folosita in ordini diferite, este numarata de mai multe ori.",
    explanation: `${DP_NOTE} Inversarea ordinii buclelor fata de problema anterioara (suma in exterior, monedele in interior) schimba complet semnificatia numararii: acum, la fiecare suma s, se ia in calcul CARE moneda este folosita ULTIMA, ceea ce distinge intre ordini diferite ale acelorasi monede.\n\n**Complexitate:** O(m*S) timp, O(S) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int m; long long S;
    cin >> m >> S;
    vector<long long> c(m);
    for (auto& x : c) cin >> x;
    vector<unsigned long long> dp(S + 1, 0);
    dp[0] = 1;
    for (long long s = 1; s <= S; s++)
        for (int i = 0; i < m; i++)
            if (c[i] <= s) dp[s] += dp[s - c[i]];
    cout << dp[S] << "\\n";
    return 0;
}
`,
    py: `m, S = map(int, input().split())
c = list(map(int, input().split()))
dp = [0] * (S + 1)
dp[0] = 1
for s in range(1, S + 1):
    for i in range(m):
        if c[i] <= s:
            dp[s] += dp[s - c[i]]
print(dp[S])
`,
    tests: ["3 4\n1 2 3", "2 5\n1 2", "1 10\n3", "4 10\n1 2 5 10", "3 0\n2 3 5"],
  },
  {
    slug: "dp-numar-submultimi-suma-multiplu-m",
    title: "Numarul de submultimi cu suma multiplu de M",
    difficulty: "hard",
    tags: ["dp", "numarare"],
    statement: "Se citesc n numere naturale si un numar natural nenul M. Determinati, folosind Programarea Dinamica, cate submultimi NEVIDE ale celor n numere au suma un multiplu al lui M.",
    input_format: "Pe prima linie se citesc n si M. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza un singur numar: numarul de submultimi nevide cu suma multiplu de M.",
    constraints: "1 <= n <= 40, 1 <= M <= 100, 0 <= element <= 10^9",
    hints: "Definiti dp[r] = numarul de submultimi (dintre elementele considerate pana acum, inclusiv multimea vida) cu suma congruenta cu r modulo M. La adaugarea unui element nou cu restul rm = element mod M, un nou tablou se obtine astfel: ndp[r] = dp[r] (elementul exclus) + dp[(r-rm+M) mod M] (elementul inclus). La final, scadeti 1 din dp[0] pentru a exclude multimea vida.",
    explanation: `${DP_NOTE} Deoarece starea este acum un REST modulo M (nu o suma absoluta), actualizarea nu mai poate fi facuta 'pe loc' descrescator ca la rucsacul obisnuit (resturile 'se invart' ciclic); este necesar un tablou temporar nou la fiecare element, calculat pe baza valorilor VECHI ale lui dp.\n\n**Complexitate:** O(n*M) timp, O(M) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, M; cin >> n >> M;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    vector<unsigned long long> dp(M, 0);
    dp[0] = 1;
    for (int i = 0; i < n; i++) {
        int rm = (int)(a[i] % M);
        vector<unsigned long long> ndp(M, 0);
        for (int r = 0; r < M; r++) {
            int prev = ((r - rm) % M + M) % M;
            ndp[r] = dp[r] + dp[prev];
        }
        dp = ndp;
    }
    cout << (dp[0] - 1) << "\\n";
    return 0;
}
`,
    py: `n, M = map(int, input().split())
a = list(map(int, input().split()))
dp = [0] * M
dp[0] = 1
for i in range(n):
    rm = a[i] % M
    ndp = [0] * M
    for r in range(M):
        prev = (r - rm) % M
        ndp[r] = dp[r] + dp[prev]
    dp = ndp
print(dp[0] - 1)
`,
    tests: ["3 3\n3 6 9", "4 5\n1 2 3 4", "5 2\n1 3 5 7 9", "1 4\n4", "6 3\n1 1 1 1 1 1"],
  },
  {
    slug: "dp-zaruri-suma",
    title: "Numarul de moduri de a obtine o suma aruncand zaruri",
    difficulty: "medium",
    tags: ["dp", "numarare"],
    statement: "Se citesc doua numere naturale n si S. Aruncam n zaruri obisnuite (cu fetele numerotate de la 1 la 6). Determinati, folosind Programarea Dinamica, in cate moduri distincte (tinand cont de ordinea zarurilor) poate rezulta suma totala S.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si S.",
    output_format: "Se afiseaza un singur numar: numarul de moduri de a obtine suma S.",
    constraints: "1 <= n <= 100, 0 <= S <= 600",
    hints: "Definiti dp[i][s] = numarul de moduri de a obtine suma s folosind primele i zaruri. dp[0][0]=1. dp[i][s] = suma dp[i-1][s-f], pentru fiecare fata posibila f de la 1 la 6 (daca s-f>=0).",
    explanation: `${DP_NOTE} Fiecare zar adauga o valoare intre 1 si 6 la suma acumulata; starea dp[i][s] insumeaza toate cele (cel mult 6) moduri posibile de a ajunge la suma s dupa exact i aruncari, pornind de la o suma valida dupa i-1 aruncari.\n\n**Complexitate:** O(n*S) timp, O(S) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; long long S;
    cin >> n >> S;
    vector<unsigned long long> dp(S + 1, 0), ndp;
    dp[0] = 1;
    for (int i = 1; i <= n; i++) {
        ndp.assign(S + 1, 0);
        for (long long s = 1; s <= S; s++) {
            unsigned long long suma = 0;
            for (int f = 1; f <= 6 && f <= s; f++) suma += dp[s - f];
            ndp[s] = suma;
        }
        dp = ndp;
    }
    cout << dp[S] << "\\n";
    return 0;
}
`,
    py: `n, S = map(int, input().split())
dp = [0] * (S + 1)
dp[0] = 1
for i in range(n):
    ndp = [0] * (S + 1)
    for s in range(1, S + 1):
        suma = 0
        for f in range(1, 7):
            if f > s:
                break
            suma += dp[s - f]
        ndp[s] = suma
    dp = ndp
print(dp[S])
`,
    tests: ["2 7", "1 3", "3 10", "2 1", "5 20"],
  },
  {
    slug: "dp-compozitii-parti-marginite-dp",
    title: "Numarul de compozitii cu parti marginite (Programare Dinamica)",
    difficulty: "medium",
    tags: ["dp", "numarare"],
    statement: "Se citesc doua numere naturale n si M. Determinati, folosind Programarea Dinamica, numarul de compozitii ale lui n (moduri de a scrie n ca suma ORDONATA de numere naturale nenule, ordinea termenilor conteaza) in care fiecare termen este cel mult M.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si M.",
    output_format: "Se afiseaza un singur numar: numarul de compozitii ale lui n cu termeni cel mult M.",
    constraints: "0 <= n <= 60, 1 <= M <= 9",
    hints: "Definiti dp[s] = numarul de compozitii ale lui s cu termeni intre 1 si M. dp[0]=1. dp[s] = suma dp[s-p], pentru fiecare parte posibila p de la 1 la min(M,s).",
    explanation: `${DP_NOTE} Spre deosebire de numararea combinatiilor de monede (unde ordinea nu conteaza), aici FIECARE compozitie distincta ca secventa este numarata separat; acest lucru se reflecta in faptul ca se insumeaza direct dp[s-p] pentru fiecare posibila ULTIMA parte p a compozitiei, fara restrictii asupra ordinii partilor anterioare.\n\n**Complexitate:** O(n*M) timp, O(n) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, M; cin >> n >> M;
    vector<unsigned long long> dp(n + 1, 0);
    dp[0] = 1;
    for (int s = 1; s <= n; s++)
        for (int p = 1; p <= min(M, s); p++)
            dp[s] += dp[s - p];
    cout << dp[n] << "\\n";
    return 0;
}
`,
    py: `n, M = map(int, input().split())
dp = [0] * (n + 1)
dp[0] = 1
for s in range(1, n + 1):
    for p in range(1, min(M, s) + 1):
        dp[s] += dp[s - p]
print(dp[n])
`,
    tests: ["4 2", "5 1", "6 3", "10 9", "0 5"],
  },

  // ===================== GRUPA D: SIRURI DE CARACTERE =====================
  {
    slug: "dp-numar-subsecvente-distincte",
    title: "Numarul de subsecvente distincte egale cu un sir dat",
    difficulty: "hard",
    tags: ["dp", "numarare", "siruri"],
    statement: "Se citesc doua siruri de caractere S si T. Determinati, folosind Programarea Dinamica, in cate moduri distincte (dupa pozitii) se poate alege o subsecventa a lui S care sa fie egala cu T.",
    input_format: "Pe prima linie se citeste sirul S. Pe a doua linie se citeste sirul T.",
    output_format: "Se afiseaza un singur numar: numarul de subsecvente ale lui S egale cu T.",
    constraints: "0 <= lungimea S, T <= 1000",
    hints: "Definiti dp[i][j] = numarul de subsecvente ale primelor i caractere din S egale cu primele j caractere din T. dp[i][0]=1 pentru orice i (sirul vid se obtine intotdeauna, in exact un mod). dp[i][j] = dp[i-1][j] (caracterul S[i-1] nu este folosit) + dp[i-1][j-1] daca S[i-1]==T[j-1] (caracterul este folosit pentru a potrivi T[j-1]).",
    explanation: `${DP_NOTE} La fiecare caracter din S, exista intotdeauna optiunea de a NU il folosi (dp[i-1][j]); optiunea de a-l folosi este posibila doar daca el coincide cu urmatorul caracter necesar din T, caz in care se aduna si contributiile dp[i-1][j-1].\n\n**Complexitate:** O(n*m) timp si memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s, t;
    getline(cin, s);
    getline(cin, t);
    int n = s.size(), m = t.size();
    vector<vector<unsigned long long>> dp(n + 1, vector<unsigned long long>(m + 1, 0));
    for (int i = 0; i <= n; i++) dp[i][0] = 1;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            dp[i][j] = dp[i - 1][j];
            if (s[i - 1] == t[j - 1]) dp[i][j] += dp[i - 1][j - 1];
        }
    }
    cout << dp[n][m] << "\\n";
    return 0;
}
`,
    py: `import sys
lines = sys.stdin.read().split('\\n')
s = lines[0] if len(lines) > 0 else ""
t = lines[1] if len(lines) > 1 else ""
n, m = len(s), len(t)
dp = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(n + 1):
    dp[i][0] = 1
for i in range(1, n + 1):
    for j in range(1, m + 1):
        dp[i][j] = dp[i - 1][j]
        if s[i - 1] == t[j - 1]:
            dp[i][j] += dp[i - 1][j - 1]
print(dp[n][m])
`,
    tests: ["rabbbit\nrabbit", "babgbag\nbag", "abc\nabc", "abc\nxyz", "aaaa\naa"],
  },
  {
    slug: "dp-numar-moduri-impartire-cuvinte",
    title: "Numarul de moduri de a imparti un sir in cuvinte dintr-un dictionar",
    difficulty: "medium",
    tags: ["dp", "numarare", "siruri"],
    statement: "Se citesc un sir S si un dictionar cu n cuvinte. Determinati, folosind Programarea Dinamica, in cate moduri distincte poate fi impartit S intr-o secventa de cuvinte din dictionar (un cuvant poate fi folosit de oricate ori).",
    input_format: "Pe prima linie se citeste sirul S. Pe a doua linie se citeste n. Pe a treia linie se citesc cele n cuvinte ale dictionarului.",
    output_format: "Se afiseaza un singur numar: numarul de impartiri posibile.",
    constraints: "1 <= lungimea S <= 1000, 1 <= n <= 1000, 1 <= lungimea unui cuvant <= 20",
    hints: "Definiti dp[i] = numarul de moduri de a imparti prefixul S[0..i) in cuvinte din dictionar. dp[0]=1. dp[i] = suma dp[j], pentru toti j<i cu S[j..i) un cuvant din dictionar.",
    explanation: `${DP_NOTE} Spre deosebire de simpla verificare DA/NU, aici se insumeaza TOATE modurile de a ajunge la pozitia i (nu se opreste la primul gasit), pentru fiecare taietura finala posibila S[j..i) valida.\n\n**Complexitate:** O(lungime(S)^2) timp`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    int n; cin >> n;
    set<string> dict;
    for (int i = 0; i < n; i++) { string w; cin >> w; dict.insert(w); }
    int len = s.size();
    vector<unsigned long long> dp(len + 1, 0);
    dp[0] = 1;
    for (int i = 1; i <= len; i++) {
        for (int j = 0; j < i; j++) {
            if (dict.count(s.substr(j, i - j))) dp[i] += dp[j];
        }
    }
    cout << dp[len] << "\\n";
    return 0;
}
`,
    py: `s = input().strip()
n = int(input())
dict_cuvinte = set(input().split())
length = len(s)
dp = [0] * (length + 1)
dp[0] = 1
for i in range(1, length + 1):
    for j in range(i):
        if s[j:i] in dict_cuvinte:
            dp[i] += dp[j]
print(dp[length])
`,
    tests: [
      "catsanddog\n5\ncats dog sand and cat",
      "aaaaaaa\n2\naaaa aaa",
      "abcd\n2\nab cd",
      "leetcode\n2\nleet code",
      "a\n1\nb",
    ],
  },
  {
    slug: "dp-numar-subsecvente-palindromice-contigue",
    title: "Numarul de subsecvente contigue palindromice",
    difficulty: "medium",
    tags: ["dp", "numarare", "palindrom"],
    statement: "Se citeste un sir de caractere S. Determinati, folosind Programarea Dinamica, cate subsecvente CONTIGUE (substringuri) ale lui S sunt palindromice (doua aparitii ale aceleiasi subsecvente, la pozitii diferite, se numara separat).",
    input_format: "Se citeste sirul S.",
    output_format: "Se afiseaza un singur numar: numarul de subsecvente contigue palindromice.",
    constraints: "1 <= lungimea S <= 2000",
    hints: "Definiti dp[i][j] = adevarat daca S[i..j] este palindrom. dp[i][j] este adevarat daca S[i]==S[j] si (j-i<2 sau dp[i+1][j-1]). Numarati toate perechile (i,j) pentru care dp[i][j] este adevarat.",
    explanation: `${DP_NOTE} Aceasta este exact tehnica folosita la determinarea celei mai lungi subsecvente contigue palindromice, dar in loc sa retinem doar cea mai lunga, numaram TOATE intervalele care satisfac conditia de palindrom.\n\n**Complexitate:** O(n^2) timp si memorie`,
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    int n = s.size();
    vector<vector<bool>> dp(n, vector<bool>(n, false));
    unsigned long long numar = 0;
    for (int i = 0; i < n; i++) { dp[i][i] = true; numar++; }
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            if (s[i] == s[j] && (len == 2 || dp[i + 1][j - 1])) { dp[i][j] = true; numar++; }
        }
    }
    cout << numar << "\\n";
    return 0;
}
`,
    py: `s = input().strip()
n = len(s)
dp = [[False] * n for _ in range(n)]
numar = 0
for i in range(n):
    dp[i][i] = True
    numar += 1
for length in range(2, n + 1):
    for i in range(0, n - length + 1):
        j = i + length - 1
        if s[i] == s[j] and (length == 2 or dp[i + 1][j - 1]):
            dp[i][j] = True
            numar += 1
print(numar)
`,
    tests: ["abc", "aaa", "aabaa", "racecar", "abcba"],
  },
  {
    slug: "dp-decodare-numar-moduri",
    title: "Numarul de moduri de a decoda un sir de cifre",
    difficulty: "medium",
    tags: ["dp", "numarare", "siruri"],
    statement: "Se citeste un sir de cifre. Folosind maparea A=1, B=2, ..., Z=26, un astfel de sir poate reprezenta o codificare a unui mesaj format din litere mari. Determinati, folosind Programarea Dinamica, in cate moduri distincte poate fi decodat sirul (grupand cifrele in numere de 1 sau 2 cifre, fiecare intre 1 si 26, fara zerouri nesemnificative).",
    input_format: "Se citeste sirul de cifre.",
    output_format: "Se afiseaza un singur numar: numarul de decodari posibile (0 daca sirul nu poate fi decodat in niciun mod valid).",
    constraints: "1 <= lungimea sirului <= 1000",
    hints: "Definiti dp[i] = numarul de moduri de a decoda primele i cifre. dp[0]=1. Adaugati la dp[i] valoarea dp[i-1] daca cifra S[i-1] nu este '0' (ultimul grup are o singura cifra), si valoarea dp[i-2] daca cele doua cifre S[i-2..i) formeaza un numar intre 10 si 26 (ultimul grup are doua cifre).",
    explanation: `${DP_NOTE} Fiecare decodare valida se termina fie cu un grup de o singura cifra (nenula), fie cu un grup de doua cifre (intre 10 si 26); dp[i] insumeaza contributiile ambelor cazuri posibile pentru ultimul grup.\n\n**Complexitate:** O(n) timp, O(n) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    int n = s.size();
    vector<unsigned long long> dp(n + 1, 0);
    dp[0] = 1;
    for (int i = 1; i <= n; i++) {
        if (s[i - 1] != '0') dp[i] += dp[i - 1];
        if (i >= 2) {
            int val = (s[i - 2] - '0') * 10 + (s[i - 1] - '0');
            if (val >= 10 && val <= 26) dp[i] += dp[i - 2];
        }
    }
    cout << dp[n] << "\\n";
    return 0;
}
`,
    py: `s = input().strip()
n = len(s)
dp = [0] * (n + 1)
dp[0] = 1
for i in range(1, n + 1):
    if s[i - 1] != '0':
        dp[i] += dp[i - 1]
    if i >= 2:
        val = int(s[i - 2:i])
        if 10 <= val <= 26:
            dp[i] += dp[i - 2]
print(dp[n])
`,
    tests: ["12", "226", "06", "100", "11106"],
  },
  {
    slug: "dp-numar-subsecvente-crescatoare",
    title: "Numarul de subsecvente strict crescatoare",
    difficulty: "medium",
    tags: ["dp", "numarare"],
    statement: "Se citesc n numere. Determinati, folosind Programarea Dinamica, numarul total de subsecvente STRICT crescatoare de lungime cel putin 2 (nu neaparat consecutive) ale sirului.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza un singur numar: numarul de subsecvente strict crescatoare de lungime cel putin 2.",
    constraints: "1 <= n <= 1000, -10^9 <= element <= 10^9",
    hints: "Definiti dp[i] = numarul de subsecvente crescatoare care se termina EXACT pe pozitia i, incluzand si subsecventa formata doar din elementul i insusi (deci dp[i]>=1). dp[i] = 1 + suma dp[j], pentru toti j<i cu a[j]<a[i]. Raspunsul final este suma tuturor dp[i], din care se scade n (pentru a elimina cele n subsecvente banale de lungime 1).",
    explanation: `${DP_NOTE} Fiecare subsecventa crescatoare care se termina in i se obtine fie ca element unic (contributia '1' din dp[i]), fie prin extinderea unei subsecvente crescatoare mai scurte ce se termina intr-un j anterior cu a[j]<a[i]; suma tuturor acestor contributii, minus cele n subsecvente de un singur element, da raspunsul cerut.\n\n**Complexitate:** O(n^2) timp, O(n) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    vector<unsigned long long> dp(n, 1);
    for (int i = 0; i < n; i++)
        for (int j = 0; j < i; j++)
            if (a[j] < a[i]) dp[i] += dp[j];
    unsigned long long total = 0;
    for (auto x : dp) total += x;
    cout << (total - n) << "\\n";
    return 0;
}
`,
    py: `n = int(input())
a = list(map(int, input().split()))
dp = [1] * n
for i in range(n):
    for j in range(i):
        if a[j] < a[i]:
            dp[i] += dp[j]
print(sum(dp) - n)
`,
    tests: ["4\n1 2 3 4", "3\n3 2 1", "5\n1 3 2 4 3", "1\n5", "4\n2 2 2 2"],
  },

  // ===================== GRUPA E: ALTELE =====================
  {
    slug: "dp-numar-drumuri-suma-fixa-matrice",
    title: "Numarul de drumuri intr-o matrice cu suma fixa",
    difficulty: "hard",
    tags: ["dp", "numarare", "matrice"],
    statement: "Se citesc doua numere naturale n si m, o matrice cu n linii si m coloane cu valori intre 0 si 9, si o suma S. Determinati, folosind Programarea Dinamica, numarul de drumuri de la celula (1,1) la celula (n,m) (deplasare doar la dreapta sau in jos) a caror suma a valorilor vizitate este exact S.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza n linii, fiecare cu m valori (0-9). Pe ultima linie se citeste S.",
    output_format: "Se afiseaza un singur numar: numarul de drumuri cu suma S.",
    constraints: "1 <= n, m <= 12, 0 <= valoare <= 9, 0 <= S <= 250",
    hints: "Definiti dp[i][j][s] = numarul de drumuri de la (1,1) la (i,j) cu suma exact s. Pentru fiecare celula, dp[i][j][s] se obtine din dp[i-1][j][s-a[i][j]] si dp[i][j-1][s-a[i][j]] (drumul ajunge in (i,j) fie din celula de deasupra, fie din cea din stanga).",
    explanation: `${DP_NOTE} Fata de simpla numarare a drumurilor, se adauga o a treia dimensiune a starii (suma acumulata pana in acel punct), deoarece raspunsul depinde nu doar de POZITIA in matrice, ci si de VALOAREA sumei intermediare.\n\n**Complexitate:** O(n*m*S) timp si memorie`,
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> a(n + 1, vector<int>(m + 1, 0));
    for (int i = 1; i <= n; i++) for (int j = 1; j <= m; j++) cin >> a[i][j];
    long long S; cin >> S;
    if (S < 0) { cout << 0 << "\\n"; return 0; }
    vector<vector<vector<unsigned long long>>> dp(n + 1, vector<vector<unsigned long long>>(m + 1, vector<unsigned long long>(S + 1, 0)));
    if (a[1][1] <= S) dp[1][1][a[1][1]] = 1;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (i == 1 && j == 1) continue;
            for (long long s = 0; s <= S; s++) {
                long long prevS = s - a[i][j];
                if (prevS < 0) continue;
                unsigned long long val = 0;
                if (i > 1) val += dp[i - 1][j][prevS];
                if (j > 1) val += dp[i][j - 1][prevS];
                dp[i][j][s] = val;
            }
        }
    }
    cout << dp[n][m][S] << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
a = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    row = list(map(int, input().split()))
    for j in range(1, m + 1):
        a[i][j] = row[j - 1]
S = int(input())
if S < 0:
    print(0)
else:
    dp = [[[0] * (S + 1) for _ in range(m + 1)] for _ in range(n + 1)]
    if a[1][1] <= S:
        dp[1][1][a[1][1]] = 1
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if i == 1 and j == 1:
                continue
            for s in range(S + 1):
                prevS = s - a[i][j]
                if prevS < 0:
                    continue
                val = 0
                if i > 1:
                    val += dp[i - 1][j][prevS]
                if j > 1:
                    val += dp[i][j - 1][prevS]
                dp[i][j][s] = val
    print(dp[n][m][S])
`,
    tests: [
      "2 2\n1 2\n3 4\n7",
      "3 3\n1 1 1\n1 1 1\n1 1 1\n5",
      "2 3\n0 0 0\n0 0 0\n0",
      "1 1\n5\n5",
      "3 2\n1 2\n3 4\n5 6\n12",
    ],
  },
  {
    slug: "dp-monede-bancnote-limitate",
    title: "Numarul de moduri de a plati o suma cu bancnote limitate",
    difficulty: "medium",
    tags: ["dp", "numarare", "monede"],
    statement: "Se citesc m tipuri de bancnote, fiecare cu o valoare si o cantitate disponibila LIMITATA, si o suma S. Determinati, folosind Programarea Dinamica, in cate moduri distincte (ordinea nefiind relevanta) se poate obtine exact suma S, fara a depasi cantitatea disponibila din niciun tip de bancnota.",
    input_format: "Pe prima linie se citesc m si S. Urmeaza m linii, fiecare cu doua numere: valoarea si cantitatea disponibila a unui tip de bancnota.",
    output_format: "Se afiseaza un singur numar: numarul de moduri de a obtine suma S.",
    constraints: "1 <= m <= 20, 0 <= S <= 1000, 1 <= valoare <= 1000, 1 <= cantitate <= 50",
    hints: "Tratati fiecare exemplar disponibil al unui tip de bancnota drept un obiect separat, aplicand de 'cantitate' ori actualizarea specifica rucsacului 0/1 (parcurgere descrescatoare a sumelor) pentru acelasi tip de bancnota; astfel, tipul respectiv nu poate fi folosit de mai multe ori decat cantitatea disponibila.",
    explanation: `${DP_NOTE} Limitarea cantitatii disponibile transforma problema intr-un hibrid intre numararea combinatiilor de monede nelimitate si rucsacul 0/1: fiecare 'exemplar' al unei bancnote este tratat ca un obiect distinct, dar toate exemplarele aceluiasi tip au aceeasi valoare.\n\n**Complexitate:** O(S * suma cantitatilor) timp`,
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int m; long long S;
    cin >> m >> S;
    vector<unsigned long long> dp(S + 1, 0);
    dp[0] = 1;
    for (int i = 0; i < m; i++) {
        long long v, c; cin >> v >> c;
        for (long long rep = 0; rep < c; rep++)
            for (long long s = S; s >= v; s--)
                dp[s] += dp[s - v];
    }
    cout << dp[S] << "\\n";
    return 0;
}
`,
    py: `m, S = map(int, input().split())
dp = [0] * (S + 1)
dp[0] = 1
for i in range(m):
    v, c = map(int, input().split())
    for rep in range(c):
        for s in range(S, v - 1, -1):
            dp[s] += dp[s - v]
print(dp[S])
`,
    tests: ["2 6\n2 3\n3 2", "1 5\n1 3", "3 10\n1 2\n2 2\n5 2", "2 0\n3 1\n4 1", "1 4\n2 1"],
  },
  {
    slug: "dp-numar-cai-grid-diagonala",
    title: "Numarul de drumuri intr-o matrice cu deplasare diagonala",
    difficulty: "medium",
    tags: ["dp", "numarare", "matrice"],
    statement: "Se citesc doua numere naturale n si m. Determinati, folosind Programarea Dinamica, numarul de drumuri de la celula (1,1) la celula (n,m), stiind ca la fiecare pas ne putem deplasa la dreapta, in jos, sau pe diagonala (dreapta-jos).",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si m.",
    output_format: "Se afiseaza un singur numar: numarul de drumuri de la (1,1) la (n,m).",
    constraints: "1 <= n, m <= 20",
    hints: "Definiti dp[i][j] = numarul de drumuri de la (1,1) la (i,j). dp[i][j] = dp[i-1][j] + dp[i][j-1] + dp[i-1][j-1] (provenind din celula de deasupra, din stanga, sau de pe diagonala), tratand termenii corespunzatori celulelor din afara matricei ca fiind 0.",
    explanation: `${DP_NOTE} Adaugarea unei a treia directii posibile (diagonala) extinde simplu recurenta cu inca un termen; numerele rezultate sunt cunoscute in combinatorica drept numerele lui Delannoy.\n\n**Complexitate:** O(n*m) timp si memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<unsigned long long>> dp(n + 1, vector<unsigned long long>(m + 1, 0));
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (i == 1 && j == 1) { dp[i][j] = 1; continue; }
            unsigned long long val = 0;
            if (i > 1) val += dp[i - 1][j];
            if (j > 1) val += dp[i][j - 1];
            if (i > 1 && j > 1) val += dp[i - 1][j - 1];
            dp[i][j] = val;
        }
    }
    cout << dp[n][m] << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
dp = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    for j in range(1, m + 1):
        if i == 1 and j == 1:
            dp[i][j] = 1
            continue
        val = 0
        if i > 1:
            val += dp[i - 1][j]
        if j > 1:
            val += dp[i][j - 1]
        if i > 1 and j > 1:
            val += dp[i - 1][j - 1]
        dp[i][j] = val
print(dp[n][m])
`,
    tests: ["2 2", "3 3", "1 5", "5 1", "10 10"],
  },
  {
    slug: "dp-numar-submultimi-suma-para",
    title: "Numarul de submultimi cu suma para",
    difficulty: "medium",
    tags: ["dp", "numarare"],
    statement: "Se citesc n numere naturale. Determinati, folosind Programarea Dinamica, cate submultimi NEVIDE ale celor n numere au suma PARA.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza un singur numar: numarul de submultimi nevide cu suma para.",
    constraints: "1 <= n <= 40, 0 <= element <= 10^9",
    hints: "Retineti doar doua numere: cate submultimi (dintre cele considerate pana acum, inclusiv multimea vida) au suma para, respectiv impara. La adaugarea unui element par, ambele numere se dubleaza (elementul par nu schimba paritatea sumei). La adaugarea unui element impar, noile valori devin egale, fiecare cu suma valorilor vechi (deoarece includerea elementului impar 'inverseaza' paritatea).",
    explanation: `${DP_NOTE} Este un caz particular (mai simplu de urmarit) al problemei generale a numararii submultimilor cu suma multiplu de M, aplicat pentru M=2: starea retine doar paritatea sumei, nu suma completa, ceea ce reduce drastic memoria necesara.\n\n**Complexitate:** O(n) timp, O(1) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    unsigned long long dpEven = 1, dpOdd = 0;
    for (int i = 0; i < n; i++) {
        long long x; cin >> x;
        if (x % 2 == 0) { dpEven *= 2; dpOdd *= 2; }
        else { unsigned long long ne = dpEven + dpOdd; unsigned long long no = dpEven + dpOdd; dpEven = ne; dpOdd = no; }
    }
    cout << (dpEven - 1) << "\\n";
    return 0;
}
`,
    py: `n = int(input())
a = list(map(int, input().split()))
dpEven, dpOdd = 1, 0
for x in a:
    if x % 2 == 0:
        dpEven *= 2
        dpOdd *= 2
    else:
        dpEven, dpOdd = dpEven + dpOdd, dpEven + dpOdd
print(dpEven - 1)
`,
    tests: ["3\n1 2 3", "4\n2 4 6 8", "2\n1 3", "5\n1 1 1 1 1", "1\n7"],
  },
  {
    slug: "dp-partitii-parti-distincte-dp",
    title: "Numarul de partitii cu parti distincte (Programare Dinamica)",
    difficulty: "medium",
    tags: ["dp", "numarare", "partitii"],
    statement: "Se citeste un numar natural n. Determinati, folosind Programarea Dinamica, numarul de partitii ale lui n in care toate partile sunt distincte doua cate doua.",
    input_format: "Se citeste numarul natural n.",
    output_format: "Se afiseaza un singur numar: numarul de partitii cu parti distincte ale lui n.",
    constraints: "0 <= n <= 300",
    hints: "Tratati fiecare parte posibila (1, 2, ..., n) drept un 'obiect' ce poate fi folosit CEL MULT O DATA (spre deosebire de numararea tuturor partitiilor, unde o parte putea fi refolosita). Aplicati deci schema rucsacului 0/1 (parcurgere descrescatoare a sumelor) in loc de cea a monedelor nelimitate.",
    explanation: `${DP_NOTE} Diferenta fata de numararea tuturor partitiilor consta exact in ordinea de parcurgere a sumelor la introducerea fiecarei parti noi: descrescator (ca la rucsacul 0/1) inseamna 'aceasta parte este folosita cel mult o data', ceea ce corespunde exact restrictiei de partitie cu parti distincte.\n\n**Complexitate:** O(n^2) timp, O(n) memorie`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<unsigned long long> dp(n + 1, 0);
    dp[0] = 1;
    for (int part = 1; part <= n; part++)
        for (int s = n; s >= part; s--)
            dp[s] += dp[s - part];
    cout << dp[n] << "\\n";
    return 0;
}
`,
    py: `n = int(input())
dp = [0] * (n + 1)
dp[0] = 1
for part in range(1, n + 1):
    for s in range(n, part - 1, -1):
        dp[s] += dp[s - part]
print(dp[n])
`,
    tests: ["0", "1", "6", "50", "100"],
  },
  {
    slug: "dp-numar-moduri-scara-pas-variabil-k",
    title: "Numarul de moduri de a urca o scara cu pas de cel mult K",
    difficulty: "medium",
    tags: ["dp", "numarare"],
    statement: "Se citesc doua numere naturale n si k. Determinati, folosind Programarea Dinamica, in cate moduri distincte se poate urca o scara cu n trepte, stiind ca la fiecare pas se pot urca intre 1 si k trepte.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale n si k.",
    output_format: "Se afiseaza un singur numar: numarul de moduri de a urca scara.",
    constraints: "0 <= n <= 1000, 1 <= k <= 1000",
    hints: "Definiti dp[i] = numarul de moduri de a urca primele i trepte. dp[0]=1. dp[i] = suma dp[i-p], pentru fiecare pas posibil p de la 1 la min(k,i) (dupa marimea ultimului pas facut).",
    explanation: `${DP_NOTE} Aceasta este generalizarea directa a problemelor 'scara cu pasi de 1 sau 2' (k=2) si 'scara cu pasi de 1, 2 sau 3' (k=3): pentru un k oarecare, dp[i] insumeaza toate cele k contributii posibile, corespunzatoare marimii ultimului pas facut.\n\n**Complexitate:** O(n*k) timp, O(n) memorie`,
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, k; cin >> n >> k;
    vector<unsigned long long> dp(n + 1, 0);
    dp[0] = 1;
    for (int i = 1; i <= n; i++)
        for (int p = 1; p <= min(k, i); p++)
            dp[i] += dp[i - p];
    cout << dp[n] << "\\n";
    return 0;
}
`,
    py: `n, k = map(int, input().split())
dp = [0] * (n + 1)
dp[0] = 1
for i in range(1, n + 1):
    for p in range(1, min(k, i) + 1):
        dp[i] += dp[i - p]
print(dp[n])
`,
    tests: ["5 2", "5 3", "10 1", "20 5", "0 3"],
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
