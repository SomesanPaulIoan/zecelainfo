const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade9", chapter: "algoritmi-elementari", sub: "generarea-unor-siruri" };

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

const OUT_FMT_DA_NU = "Se afiseaza DA daca proprietatea este adevarata, respectiv NU in caz contrar.";

const problems = [
  {
    slug: "fibonacci-modulo-mare",
    title: "Al n-lea termen Fibonacci modulo p, pentru n foarte mare",
    difficulty: "hard",
    tags: ["fibonacci", "siruri", "exponentiere-matriciala", "modulo"],
    statement: "Se citesc doua numere naturale n si p (p prim sau nu, folosit doar ca modul). Determinati F(n) modulo p, unde F(1)=1, F(2)=1, F(k)=F(k-1)+F(k-2). Deoarece n poate fi foarte mare (F(n) ar avea milioane de cifre), folositi exponentiere matriciala pentru a calcula raspunsul in timp logaritmic.",
    input_format: "Se citesc n si p.",
    output_format: "Se afiseaza F(n) modulo p.",
    constraints: "1 <= n <= 10^18, 2 <= p <= 10^9",
    hints: "Matricea [[1,1],[1,0]] ridicata la puterea n are in coltul din dreapta sus exact F(n). Folositi exponentiere rapida (logaritmica) pentru a ridica matricea la puterea n modulo p.",
    explanation: "Se foloseste identitatea matriciala [[1,1],[1,0]]^n = [[F(n+1),F(n)],[F(n),F(n-1)]]. Se calculeaza aceasta putere matriciala folosind exponentiere rapida (similara cu exponentierea rapida a numerelor, dar cu inmultiri de matrice 2x2 in loc de inmultiri de numere), reducand fiecare element modulo p pentru a mentine valorile mici. Complexitatea O(log n) permite calcularea raspunsului chiar si pentru n de ordinul 10^18.\n\n**Complexitate:** O(log n)",
    time_limit_ms: 1500,
    cpp: `#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
typedef vector<vector<ll>> Mat;
ll MOD;
Mat mul(const Mat &a, const Mat &b) {
    Mat c(2, vector<ll>(2, 0));
    for (int i = 0; i < 2; i++)
        for (int j = 0; j < 2; j++)
            for (int k = 0; k < 2; k++)
                c[i][j] = (c[i][j] + a[i][k] * b[k][j]) % MOD;
    return c;
}
Mat matpow(Mat a, ll p) {
    Mat r = {{1, 0}, {0, 1}};
    while (p > 0) {
        if (p & 1) r = mul(r, a);
        a = mul(a, a);
        p >>= 1;
    }
    return r;
}
int main() {
    ll n; cin >> n >> MOD;
    Mat base = {{1, 1}, {1, 0}};
    Mat r = matpow(base, n);
    cout << r[0][1] % MOD << "\\n";
    return 0;
}
`,
    py: `def mat_mul(a, b, mod):
    return [
        [(a[0][0]*b[0][0]+a[0][1]*b[1][0]) % mod, (a[0][0]*b[0][1]+a[0][1]*b[1][1]) % mod],
        [(a[1][0]*b[0][0]+a[1][1]*b[1][0]) % mod, (a[1][0]*b[0][1]+a[1][1]*b[1][1]) % mod],
    ]

def mat_pow(a, p, mod):
    r = [[1, 0], [0, 1]]
    while p > 0:
        if p & 1:
            r = mat_mul(r, a, mod)
        a = mat_mul(a, a, mod)
        p >>= 1
    return r

n, mod = map(int, input().split())
base = [[1, 1], [1, 0]]
r = mat_pow(base, n, mod)
print(r[0][1] % mod)
`,
    tests: ["10 1000000007", "1 1000000007", "90 998244353", "1000000000000 1000000007", "50 100"],
  },
  {
    slug: "lucas-modulo-mare",
    title: "Al n-lea termen Lucas modulo p, pentru n foarte mare",
    difficulty: "hard",
    tags: ["lucas", "siruri", "exponentiere-matriciala", "modulo"],
    statement: "Se citesc doua numere naturale n si p. Determinati L(n) modulo p, unde L(0)=2, L(1)=1, L(k)=L(k-1)+L(k-2) (sirul lui Lucas). Deoarece n poate fi foarte mare, folositi exponentiere matriciala.",
    input_format: "Se citesc n si p.",
    output_format: "Se afiseaza L(n) modulo p.",
    constraints: "0 <= n <= 10^18, 2 <= p <= 10^9",
    hints: "Folositi aceeasi matrice [[1,1],[1,0]] ca la Fibonacci, ridicata la puterea n-1, inmultita cu vectorul [L(1), L(0)] = [1, 2].",
    explanation: "Se foloseste aceeasi matrice [[1,1],[1,0]] ca la sirul Fibonacci. Daca M^(n-1) are elementele [[m00,m01],[m10,m11]], atunci [L(n), L(n-1)] = M^(n-1) * [L(1), L(0)] = M^(n-1) * [1, 2], deci L(n) = m00*1 + m01*2. Se calculeaza M^(n-1) prin exponentiere matriciala rapida, modulo p. Cazul n=0 se trateaza separat (L(0)=2).\n\n**Complexitate:** O(log n)",
    time_limit_ms: 1500,
    cpp: `#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
typedef vector<vector<ll>> Mat;
ll MOD;
Mat mul(const Mat &a, const Mat &b) {
    Mat c(2, vector<ll>(2, 0));
    for (int i = 0; i < 2; i++)
        for (int j = 0; j < 2; j++)
            for (int k = 0; k < 2; k++)
                c[i][j] = (c[i][j] + a[i][k] * b[k][j]) % MOD;
    return c;
}
Mat matpow(Mat a, ll p) {
    Mat r = {{1, 0}, {0, 1}};
    while (p > 0) {
        if (p & 1) r = mul(r, a);
        a = mul(a, a);
        p >>= 1;
    }
    return r;
}
int main() {
    ll n; cin >> n >> MOD;
    if (n == 0) { cout << 2 % MOD << "\\n"; return 0; }
    Mat base = {{1, 1}, {1, 0}};
    Mat m = matpow(base, n - 1);
    ll Ln = (m[0][0] * 1 + m[0][1] * 2) % MOD;
    cout << Ln << "\\n";
    return 0;
}
`,
    py: `def mat_mul(a, b, mod):
    return [
        [(a[0][0]*b[0][0]+a[0][1]*b[1][0]) % mod, (a[0][0]*b[0][1]+a[0][1]*b[1][1]) % mod],
        [(a[1][0]*b[0][0]+a[1][1]*b[1][0]) % mod, (a[1][0]*b[0][1]+a[1][1]*b[1][1]) % mod],
    ]

def mat_pow(a, p, mod):
    r = [[1, 0], [0, 1]]
    while p > 0:
        if p & 1:
            r = mat_mul(r, a, mod)
        a = mat_mul(a, a, mod)
        p >>= 1
    return r

n, mod = map(int, input().split())
if n == 0:
    print(2 % mod)
else:
    base = [[1, 1], [1, 0]]
    m = mat_pow(base, n - 1, mod)
    ln = (m[0][0] * 1 + m[0][1] * 2) % mod
    print(ln)
`,
    tests: ["0 1000000007", "1 1000000007", "3 1000000007", "90 998244353", "1000000000000 1000000007"],
  },
  {
    slug: "tribonacci-modulo-mare",
    title: "Al n-lea termen Tribonacci modulo p, pentru n foarte mare",
    difficulty: "hard",
    tags: ["tribonacci", "siruri", "exponentiere-matriciala", "modulo"],
    statement: "Se citesc doua numere naturale n si p. Determinati T(n) modulo p, unde T(0)=0, T(1)=1, T(2)=1, T(k)=T(k-1)+T(k-2)+T(k-3) (sirul Tribonacci). Deoarece n poate fi foarte mare, folositi exponentiere matriciala cu o matrice 3x3.",
    input_format: "Se citesc n si p.",
    output_format: "Se afiseaza T(n) modulo p.",
    constraints: "0 <= n <= 10^18, 2 <= p <= 10^9",
    hints: "Folositi matricea 3x3 [[1,1,1],[1,0,0],[0,1,0]], care aplicata vectorului [T(k),T(k-1),T(k-2)] produce [T(k+1),T(k),T(k-1)].",
    explanation: "Se foloseste matricea 3x3 M=[[1,1,1],[1,0,0],[0,1,0]], pentru care M * [T(k),T(k-1),T(k-2)]^T = [T(k+1),T(k),T(k-1)]^T. Pornind de la vectorul [T(2),T(1),T(0)] = [1,1,0], se calculeaza M^(n-2) prin exponentiere matriciala rapida modulo p, iar T(n) este primul element al vectorului rezultat. Cazurile n=0 si n=1 se trateaza separat.\n\n**Complexitate:** O(log n)",
    time_limit_ms: 1500,
    cpp: `#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
typedef vector<vector<ll>> Mat;
ll MOD;
int SZ;
Mat mul(const Mat &a, const Mat &b) {
    Mat c(SZ, vector<ll>(SZ, 0));
    for (int i = 0; i < SZ; i++)
        for (int j = 0; j < SZ; j++)
            for (int k = 0; k < SZ; k++)
                c[i][j] = (c[i][j] + a[i][k] * b[k][j]) % MOD;
    return c;
}
Mat matpow(Mat a, ll p) {
    Mat r(SZ, vector<ll>(SZ, 0));
    for (int i = 0; i < SZ; i++) r[i][i] = 1;
    while (p > 0) {
        if (p & 1) r = mul(r, a);
        a = mul(a, a);
        p >>= 1;
    }
    return r;
}
int main() {
    ll n; cin >> n >> MOD;
    SZ = 3;
    if (n == 0) { cout << 0 % MOD << "\\n"; return 0; }
    if (n == 1) { cout << 1 % MOD << "\\n"; return 0; }
    Mat base = {{1, 1, 1}, {1, 0, 0}, {0, 1, 0}};
    Mat m = matpow(base, n - 2);
    ll Tn = (m[0][0] * 1 + m[0][1] * 1 + m[0][2] * 0) % MOD;
    cout << Tn << "\\n";
    return 0;
}
`,
    py: `def mat_mul(a, b, mod, sz):
    c = [[0] * sz for _ in range(sz)]
    for i in range(sz):
        for j in range(sz):
            s = 0
            for k in range(sz):
                s += a[i][k] * b[k][j]
            c[i][j] = s % mod
    return c

def mat_pow(a, p, mod, sz):
    r = [[1 if i == j else 0 for j in range(sz)] for i in range(sz)]
    while p > 0:
        if p & 1:
            r = mat_mul(r, a, mod, sz)
        a = mat_mul(a, a, mod, sz)
        p >>= 1
    return r

n, mod = map(int, input().split())
if n == 0:
    print(0 % mod)
elif n == 1:
    print(1 % mod)
else:
    base = [[1, 1, 1], [1, 0, 0], [0, 1, 0]]
    m = mat_pow(base, n - 2, mod, 3)
    tn = (m[0][0] * 1 + m[0][1] * 1 + m[0][2] * 0) % mod
    print(tn)
`,
    tests: ["0 1000000007", "1 1000000007", "2 1000000007", "10 1000000007", "1000000000000 1000000007"],
  },
  {
    slug: "a-n-a-cifra-din-concatenarea-numerelor",
    title: "A n-a cifra din concatenarea numerelor naturale 1, 2, 3, ...",
    difficulty: "hard",
    tags: ["siruri", "cifre", "concatenare"],
    statement: "Se formeaza sirul de cifre obtinut prin concatenarea numerelor naturale in ordine: 1, 2, 3, ..., 9, 10, 11, ..., adica '123456789101112...'. Se citeste un numar natural n. Determinati a n-a cifra din acest sir (indexare de la 1), fara a construi efectiv sirul.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza a n-a cifra din sir.",
    constraints: "1 <= n <= 2000000000",
    hints: "Numerele cu d cifre sunt in numar de 9*10^(d-1) si contribuie fiecare cu d cifre. Scadeti succesiv din n lungimile grupurilor de numere cu 1, 2, 3, ... cifre, pana gasiti grupul care contine pozitia n; apoi determinati exact ce numar si ce cifra din acel numar corespund.",
    explanation: "Numerele cu d cifre sunt 9*10^(d-1) la numar, contribuind cu 9*10^(d-1)*d cifre in total la sir. Se scade succesiv aceasta lungime din n, pentru d=1,2,3,..., pana cand n ramane mai mic sau egal cu lungimea grupului curent; acesta este grupul cu d cifre care contine pozitia cautata. In interiorul grupului, numarul cautat este primul numar cu d cifre (10^(d-1)) plus (n-1)/d, iar cifra cautata este cea de pe pozitia (n-1)%d (0-indexata) din reprezentarea acelui numar.\n\n**Complexitate:** O(log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
int main() {
    ll n; cin >> n;
    ll d = 1, count = 9, start = 1;
    while (n > d * count) {
        n -= d * count;
        d++;
        count *= 10;
        start *= 10;
    }
    ll numar = start + (n - 1) / d;
    ll pozitie = (n - 1) % d;
    string s = to_string(numar);
    cout << s[pozitie] << "\\n";
    return 0;
}
`,
    py: `n = int(input())
d, count, start = 1, 9, 1
while n > d * count:
    n -= d * count
    d += 1
    count *= 10
    start *= 10
numar = start + (n - 1) // d
pozitie = (n - 1) % d
s = str(numar)
print(s[pozitie])
`,
    tests: ["1", "9", "10", "11", "190"],
  },
  {
    slug: "lungime-concatenare-primele-n-numere",
    title: "Lungimea concatenarii primelor n numere naturale",
    difficulty: "medium",
    tags: ["siruri", "cifre", "concatenare"],
    statement: "Se citeste un numar natural n. Determinati cate cifre are sirul obtinut prin concatenarea numerelor naturale de la 1 la n (de exemplu, pentru n=11, sirul este '1234567891011', cu 13 cifre).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul total de cifre.",
    constraints: "1 <= n <= 2000000000",
    hints: "Numerele cu d cifre, aflate intre 1 si n, contribuie fiecare cu d cifre; insumati aceste contributii pentru fiecare grup de numere cu 1, 2, 3, ... cifre.",
    explanation: "Se parcurg grupurile de numere cu d=1,2,3,... cifre. Pentru fiecare grup complet continut in intervalul 1..n, se aduna la total intreaga contributie (numarul de numere din grup, inmultit cu d). Cand numerele ramase de numarat sunt mai putine decat dimensiunea grupului curent, se aduna doar contributia lor partiala (numarul ramas inmultit cu d), iar procesul se opreste.\n\n**Complexitate:** O(log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
int main() {
    ll n; cin >> n;
    ll d = 1, countInGroup = 9;
    ll total = 0, ramase = n;
    while (ramase > countInGroup) {
        total += countInGroup * d;
        ramase -= countInGroup;
        d++;
        countInGroup *= 10;
    }
    total += ramase * d;
    cout << total << "\\n";
    return 0;
}
`,
    py: `n = int(input())
d, count_in_group = 1, 9
total, ramase = 0, n
while ramase > count_in_group:
    total += count_in_group * d
    ramase -= count_in_group
    d += 1
    count_in_group *= 10
total += ramase * d
print(total)
`,
    tests: ["9", "10", "11", "15", "1000000000"],
  },
  {
    slug: "sirul-look-and-say",
    title: "Al n-lea termen al sirului 'Look-and-say'",
    difficulty: "medium",
    tags: ["siruri", "generare", "look-and-say"],
    statement: "Sirul 'Look-and-say' incepe cu termenul L(1) = '1'. Fiecare termen urmator se obtine 'citind' termenul precedent: se descrie fiecare grup de cifre identice consecutive prin numarul de aparitii urmat de cifra respectiva. De exemplu: L(1)='1', L(2)='11' (un 1), L(3)='21' (doi 1), L(4)='1211' (un 2, un 1). Se citeste un numar natural n. Afisati termenul L(n).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza termenul L(n), ca sir de cifre.",
    constraints: "1 <= n <= 30",
    hints: "Porniti de la sirul '1' si generati de n-1 ori termenul urmator, grupand caracterele identice consecutive.",
    explanation: "Se porneste cu sirul '1' si se aplica de n-1 ori transformarea: se parcurge sirul curent identificand grupurile maximale de caractere identice consecutive, iar pentru fiecare grup se adauga in noul sir lungimea grupului urmata de caracterul respectiv.\n\n**Complexitate:** O(suma lungimilor termenilor generati), care creste exponential dar ramane gestionabila pentru n <= 30",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    string s = "1";
    for (int iter = 1; iter < n; iter++) {
        string nou = "";
        int i = 0;
        while (i < (int)s.size()) {
            int j = i;
            while (j < (int)s.size() && s[j] == s[i]) j++;
            nou += to_string(j - i);
            nou += s[i];
            i = j;
        }
        s = nou;
    }
    cout << s << "\\n";
    return 0;
}
`,
    py: `n = int(input())
s = "1"
for _ in range(n - 1):
    nou = []
    i = 0
    while i < len(s):
        j = i
        while j < len(s) and s[j] == s[i]:
            j += 1
        nou.append(str(j - i))
        nou.append(s[i])
        i = j
    s = "".join(nou)
print(s)
`,
    tests: ["1", "2", "3", "5", "10"],
  },
  {
    slug: "putere-rapida-modulo",
    title: "Al n-lea termen al sirului 1, 2, 4, 8, 16, ... modulo p",
    difficulty: "medium",
    tags: ["siruri", "exponentiere-rapida", "modulo"],
    statement: "Se considera sirul definit prin a(0)=1, a(k)=2*a(k-1) (adica a(k)=2^k). Se citesc doua numere naturale n si p. Determinati a(n) modulo p, folosind exponentiere rapida (deoarece n poate fi foarte mare, iar 2^n ar avea prea multe cifre pentru a fi calculat direct).",
    input_format: "Se citesc n si p.",
    output_format: "Se afiseaza 2^n modulo p.",
    constraints: "0 <= n <= 10^18, 2 <= p <= 10^9",
    hints: "Folositi exponentiere rapida: 2^n = (2^(n/2))^2 daca n este par, respectiv 2 * 2^(n-1) daca n este impar, reducand modulo p la fiecare pas.",
    explanation: "Se calculeaza 2^n modulo p folosind exponentiere rapida (binara): se porneste cu rezultatul 1 si baza 2; cat timp exponentul este pozitiv, daca bitul curent al exponentului este 1, rezultatul se inmulteste cu baza curenta (modulo p); apoi baza se ridica la patrat (modulo p), iar exponentul se injumatateste (impartire intreaga). Aceasta reduce numarul de inmultiri de la n la O(log n).\n\n**Complexitate:** O(log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
int main() {
    ll n, p; cin >> n >> p;
    ll baza = 2 % p, rez = 1 % p;
    while (n > 0) {
        if (n & 1) rez = (rez * baza) % p;
        baza = (baza * baza) % p;
        n >>= 1;
    }
    cout << rez << "\\n";
    return 0;
}
`,
    py: `n, p = map(int, input().split())
baza, rez = 2 % p, 1 % p
while n > 0:
    if n & 1:
        rez = (rez * baza) % p
    baza = (baza * baza) % p
    n >>= 1
print(rez)
`,
    tests: ["0 1000000007", "10 1000000007", "63 1000000007", "1000000000000 1000000007", "5 100"],
  },
  {
    slug: "verificare-numar-patrat-perfect",
    title: "Verificarea daca un numar este patrat perfect",
    difficulty: "easy",
    tags: ["siruri", "patrate-perfecte", "verificare"],
    statement: "Se citeste un numar natural x. Verificati daca x este patrat perfect, adica daca exista un numar natural r astfel incat r*r = x.",
    input_format: "Se citeste un numar natural x.",
    output_format: OUT_FMT_DA_NU,
    constraints: "0 <= x <= 10^15",
    hints: "Calculati radacina intreaga a lui x si verificati daca patratul ei este exact x.",
    explanation: "Se calculeaza r, radacina patrata intreaga a lui x (cel mai mare numar natural cu r*r <= x), apoi se verifica daca r*r este exact egal cu x.\n\n**Complexitate:** O(log x)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long x; cin >> x;
    long long r = (long long)sqrtl((long double)x);
    while (r * r > x) r--;
    while ((r + 1) * (r + 1) <= x) r++;
    cout << (r * r == x ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `import math
x = int(input())
r = math.isqrt(x)
print("DA" if r * r == x else "NU")
`,
    tests: ["0", "16", "15", "1000000000000", "999999999999999"],
  },
  {
    slug: "al-n-lea-numar-patrat-perfect",
    title: "Al n-lea numar patrat perfect",
    difficulty: "easy",
    tags: ["siruri", "patrate-perfecte", "formula"],
    statement: "Sirul patratelor perfecte este 1, 4, 9, 16, 25, .... Se citeste un numar natural n. Determinati al n-lea numar patrat perfect.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza al n-lea numar patrat perfect.",
    constraints: "1 <= n <= 1000000000",
    hints: "Al n-lea numar patrat perfect este n * n.",
    explanation: "Al n-lea numar din sirul patratelor perfecte (1, 4, 9, 16, ...) este, prin definitie, n la patrat.\n\n**Complexitate:** O(1)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n; cin >> n;
    cout << n * n << "\\n";
    return 0;
}
`,
    py: `n = int(input())
print(n * n)
`,
    tests: ["1", "2", "10", "1000", "1000000000"],
  },
  {
    slug: "numarul-de-cifre-al-lui-fibonacci-n",
    title: "Numarul de cifre al lui F(n), pentru n mare",
    difficulty: "hard",
    tags: ["fibonacci", "siruri", "logaritmi"],
    statement: "Se citeste un numar natural n. Determinati cate cifre are F(n), al n-lea termen al sirului lui Fibonacci (F(1)=1, F(2)=1), fara a calcula efectiv valoarea lui F(n) (care ar putea avea foarte multe cifre).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul de cifre al lui F(n).",
    constraints: "1 <= n <= 1000",
    hints: "Folositi aproximarea F(n) ~ phi^n / sqrt(5), unde phi = (1+sqrt(5))/2 este numarul de aur; numarul de cifre este floor(log10(F(n))) + 1.",
    explanation: "Din formula lui Binet, F(n) este aproximativ egal cu phi^n / sqrt(5), unde phi=(1+sqrt(5))/2. Aplicand logaritm in baza 10, log10(F(n)) ~ n*log10(phi) - 0.5*log10(5). Numarul de cifre ale unui numar natural pozitiv y este floor(log10(y)) + 1, deci se calculeaza aceasta formula si se aplica floor, apoi se adauga 1. Cazurile n=1 si n=2 (F(n)=1, un numar cu o singura cifra) sunt tratate separat pentru robustete.\n\n**Complexitate:** O(1)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n; cin >> n;
    if (n == 1 || n == 2) { cout << 1 << "\\n"; return 0; }
    double phi = (1.0 + sqrt(5.0)) / 2.0;
    double logF = n * log10(phi) - 0.5 * log10(5.0);
    long long cifre = (long long)floor(logF) + 1;
    cout << cifre << "\\n";
    return 0;
}
`,
    py: `import math
n = int(input())
if n == 1 or n == 2:
    print(1)
else:
    phi = (1.0 + math.sqrt(5.0)) / 2.0
    log_f = n * math.log10(phi) - 0.5 * math.log10(5.0)
    cifre = int(math.floor(log_f)) + 1
    print(cifre)
`,
    tests: ["1", "2", "10", "100", "1000"],
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
