// Seed: 20 probleme de cautare binara (grade9 / tablouri-uni / cautare-binara),
// inspirate din categoria pbinfo "Cautare binara", cu enunturi reformulate si
// solutii oficiale scrise de la zero.
//
// Verificare pentru fiecare problema:
//   1. solutia oficiala C++ si cea Python dau acelasi rezultat pe toate testele (verdict AC);
//   2. o solutie naiva (fara cautare binara) da acelasi rezultat pe testele mici;
//   3. solutia naiva depaseste clar limita de timp pe testele mari (marcate cu big: true);
//   4. solutiile oficiale raman comod sub limita de timp pe testele mari.
// Doar daca toate conditiile sunt indeplinite problema este publicata.
//
// Rulare (vezi memoria proiectului):
//   docker run --rm --network zecelainfo_default -v "/root/Zece la Info":/work -w /work \
//     -e DATABASE_URL=... -e API_BASE=http://backend:4000 node:22-alpine \
//     node scripts/seed-grade9-cautare-binara-pbinfo.js
//   Optional: ONLY_SLUGS=slug1,slug2  DRY_RUN=1 (nu scrie in DB)

const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const DRY_RUN = process.env.DRY_RUN === "1";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade9", chapter: "tablouri-uni", sub: "cautare-binara" };
const RUN_LIMIT_MS = 3000; // limita fixa a endpoint-ului /api/submissions/run (mode custom)

function normalize(text) {
  return (text ?? "").trim().split(/\r?\n/).map((line) => line.trim()).join("\n");
}

// Rulare locala, in imaginea judge-ului (aceleasi compilatoare / flag-uri ca evaluarea reala).
// Endpoint-ul /api/submissions/run limiteaza stdin la 200 000 de caractere, prea putin pentru testele mari.
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "cbseed-"));
const prepared = new Map();

function prepare(language, code) {
  const key = `${language}:${crypto.createHash("sha1").update(code).digest("hex")}`;
  if (prepared.has(key)) return prepared.get(key);
  const dir = fs.mkdtempSync(path.join(WORK, "p-"));
  let res;
  if (language === "cpp") {
    fs.writeFileSync(path.join(dir, "main.cpp"), code);
    const c = spawnSync("/usr/bin/g++", ["-O2", "-std=c++17", "main.cpp", "-o", "solution"], { cwd: dir, encoding: "utf8" });
    res = c.status === 0 ? { cmd: path.join(dir, "solution"), args: [] } : { ce: c.stderr };
  } else {
    fs.writeFileSync(path.join(dir, "main.py"), code);
    res = { cmd: "/usr/bin/python3", args: [path.join(dir, "main.py")] };
  }
  prepared.set(key, res);
  return res;
}

async function runCustom(language, code, stdin) {
  const p = prepare(language, code);
  if (p.ce) return { verdict: "CE", time_ms: 0, stdout: "", stderr: p.ce };
  const t0 = process.hrtime.bigint();
  const r = spawnSync(p.cmd, p.args, { input: stdin, timeout: RUN_LIMIT_MS, killSignal: "SIGKILL", maxBuffer: 512 * 1024 * 1024, encoding: "utf8" });
  const time_ms = Math.round(Number(process.hrtime.bigint() - t0) / 1e6);
  if (r.error && r.error.code === "ETIMEDOUT") return { verdict: "TLE", time_ms, stdout: "", stderr: "" };
  if (r.signal === "SIGKILL" && time_ms >= RUN_LIMIT_MS) return { verdict: "TLE", time_ms, stdout: "", stderr: "" };
  if (r.status !== 0) return { verdict: "RE", time_ms, stdout: r.stdout || "", stderr: r.stderr || String(r.error || "") };
  return { verdict: "AC", time_ms, stdout: r.stdout, stderr: r.stderr };
}

// ---------------------------------------------------------------------------
// Generatoare deterministe
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function R(seed) {
  const r = mulberry32(seed);
  const int = (lo, hi) => {
    const span = hi - lo + 1;
    if (span <= 4294967296) return lo + Math.floor(r() * span);
    const big = Math.floor(r() * 2 ** 21) * 2 ** 32 + Math.floor(r() * 2 ** 32);
    return lo + (big % span);
  };
  const arr = (n, lo, hi) => Array.from({ length: n }, () => int(lo, hi));
  const pick = (a) => a[Math.floor(r() * a.length)];
  return { r, int, arr, pick };
}
const asc = (a) => [...a].sort((x, y) => x - y);
const distinctSorted = (g, n, lo, hi) => {
  const s = new Set();
  while (s.size < n) s.add(g.int(lo, hi));
  return asc([...s]);
};
const J = (a) => a.join(" ");

// ===========================================================================
// PROBLEME
// ===========================================================================
const CB_NOTE =
  "Problema este gandita pentru a fi rezolvata cu ajutorul cautarii binare: testele mari sunt construite astfel incat o solutie care parcurge liniar datele pentru fiecare interogare (sau care incearca pe rand toate valorile posibile ale raspunsului) sa depaseasca limita de timp.";

const problems = [];

// ---------------------------------------------------------------------------
// 1. Fabrica (pbinfo #536)
// ---------------------------------------------------------------------------
problems.push({
  slug: "cb-brutaria-timp-minim-de-coacere",
  title: "Brutaria - timpul minim de coacere",
  difficulty: "medium",
  time_limit_ms: 1000,
  tags: ["cautare binara", "cautare binara pe raspuns"],
  statement:
    "O brutarie are n cuptoare care pot functiona in paralel. Cuptorul cu numarul i coace o tava de cozonaci in exact t_i minute; imediat ce o tava este gata, brutarul baga in cuptor urmatoarea, fara nicio pauza. Toate cuptoarele pornesc in acelasi moment (minutul 0), iar o tava se numara doar daca a fost coapta complet.\n\nPentru o comanda mare, brutaria are nevoie de cel putin M tavi de cozonaci. Determinati numarul minim de minute T dupa care cuptoarele, impreuna, au copt cel putin M tavi.",
  input_format: "Pe prima linie se afla numerele n si M. Pe a doua linie se afla n numere naturale nenule: t_1, t_2, ..., t_n (timpii de coacere ai cuptoarelor).",
  output_format: "Se afiseaza un singur numar natural: numarul minim de minute T.",
  constraints: "1 <= n <= 10 000\n1 <= t_i <= 10 000\n1 <= M <= 1 000 000 000",
  hints:
    "Dupa T minute, cuptorul i a copt [T / t_i] tavi (impartire intreaga). Numarul total de tavi coapte creste odata cu T, deci puteti cauta binar cel mai mic T pentru care totalul atinge M. Atentie: T poate depasi 2^31, folositi tipul long long.",
  explanation: `${CB_NOTE}\n\nFunctia cnt(T) = suma [T / t_i] este crescatoare in T. Raspunsul se afla in intervalul [1, M * min(t_i)] (cel mai rapid cuptor, singur, ar reusi in acest timp). Se cauta binar cel mai mic T cu cnt(T) >= M; calculul lui cnt se poate opri imediat ce suma atinge M, evitand astfel si depasirile.\n\n**Complexitate:** O(n log(M * max t))`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int n;
long long M;
vector<long long> t;

bool ajunge(long long T) {
    long long total = 0;
    for (int i = 0; i < n; i++) {
        total += T / t[i];
        if (total >= M) return true;
    }
    return false;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n >> M;
    t.resize(n);
    long long tmin = 1000000;
    for (int i = 0; i < n; i++) { cin >> t[i]; tmin = min(tmin, t[i]); }
    long long st = 1, dr = M * tmin, rez = dr;
    while (st <= dr) {
        long long mij = st + (dr - st) / 2;
        if (ajunge(mij)) { rez = mij; dr = mij - 1; }
        else st = mij + 1;
    }
    cout << rez << "\\n";
    return 0;
}
`,
  py: `import sys

def main():
    data = sys.stdin.buffer.read().split()
    n, M = int(data[0]), int(data[1])
    t = [int(x) for x in data[2:2 + n]]

    def ajunge(T):
        total = 0
        for v in t:
            total += T // v
            if total >= M:
                return True
        return False

    st, dr = 1, M * min(t)
    rez = dr
    while st <= dr:
        mij = (st + dr) // 2
        if ajunge(mij):
            rez = mij
            dr = mij - 1
        else:
            st = mij + 1
    print(rez)

main()
`,
  naive: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; long long M; cin >> n >> M;
    vector<long long> t(n);
    for (auto& x : t) cin >> x;
    for (long long T = 1;; T++) {
        long long total = 0;
        for (int i = 0; i < n; i++) total += T / t[i];
        if (total >= M) { cout << T << "\\n"; return 0; }
    }
}
`,
  tests: (() => {
    const T = [];
    T.push({ input: "3 10\n2 3 5" });
    T.push({ input: "4 7\n4 4 4 4" });
    T.push({ input: "1 1\n1" });
    T.push({ input: "1 1\n10000" });
    T.push({ input: "1 37\n7" });
    T.push({ input: "5 1\n9 8 7 6 5" });
    T.push({ input: "2 100\n1 10000" });
    const g = R(101);
    T.push({ input: `6 50\n${J(g.arr(6, 1, 20))}` });
    T.push({ input: `20 1000\n${J(g.arr(20, 1, 100))}` });
    T.push({ input: `10000 1000000000\n${J(g.arr(10000, 1, 10000))}`, big: true });
    T.push({ input: `10000 1000000000\n${J(Array(10000).fill(10000))}`, big: true });
    T.push({ input: `1 1000000000\n10000`, big: true });
    return T;
  })(),
});

// ---------------------------------------------------------------------------
// 2. Maraton (pbinfo #1594)
// ---------------------------------------------------------------------------
problems.push({
  slug: "cb-drone-ajunse-la-depozit",
  title: "Drone ajunse la depozit",
  difficulty: "medium",
  time_limit_ms: 1000,
  tags: ["cautare binara", "sortare", "interogari"],
  statement:
    "O firma de curierat foloseste N drone. La momentul 0, drona i se afla la X_i metri de depozit si zboara direct spre el cu viteza constanta de Y_i metri pe secunda. Spunem ca drona a ajuns la depozit la secunda t daca in cele t secunde a parcurs cel putin X_i metri.\n\nDispecerul pune Q intrebari de forma: \"cate drone au ajuns la depozit pana la secunda t (inclusiv)?\". Raspundeti la fiecare intrebare.",
  input_format:
    "Pe prima linie se afla N. Pe fiecare dintre urmatoarele N linii se afla doua numere naturale X_i si Y_i (distanta si viteza dronei i). Pe linia urmatoare se afla Q, iar pe urmatoarele Q linii cate un numar natural t.",
  output_format: "Se afiseaza Q linii; linia k contine raspunsul la a k-a intrebare.",
  constraints: "1 <= N, Q <= 200 000\n1 <= X_i <= 1 000 000 000\n1 <= Y_i <= 1 000\n1 <= t <= 1 000 000 000",
  hints:
    "Pentru fiecare drona calculati secunda intreaga la care ajunge: s_i = [(X_i + Y_i - 1) / Y_i] (rotunjire in sus). Sortati aceste valori; raspunsul la o intrebare t este numarul de valori s_i <= t, care se afla cu o cautare binara.",
  explanation: `${CB_NOTE}\n\nDrona i a ajuns la secunda t exact cand t * Y_i >= X_i, adica t >= s_i = ceil(X_i / Y_i). Dupa sortarea valorilor s_i, numarul celor <= t este pozitia primei valori > t (upper bound), gasita prin cautare binara.\n\n**Complexitate:** O((N + Q) log N)`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> s(n);
    for (int i = 0; i < n; i++) {
        long long x, y;
        cin >> x >> y;
        s[i] = (x + y - 1) / y;
    }
    sort(s.begin(), s.end());
    int q;
    cin >> q;
    string out;
    while (q--) {
        long long t;
        cin >> t;
        // prima pozitie cu s[poz] > t
        int st = 0, dr = n - 1, poz = n;
        while (st <= dr) {
            int mij = (st + dr) / 2;
            if (s[mij] > t) { poz = mij; dr = mij - 1; }
            else st = mij + 1;
        }
        out += to_string(poz);
        out += '\\n';
    }
    cout << out;
    return 0;
}
`,
  py: `import sys
from bisect import bisect_right

def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    s = []
    p = 1
    for _ in range(n):
        x = int(data[p]); y = int(data[p + 1]); p += 2
        s.append((x + y - 1) // y)
    s.sort()
    q = int(data[p]); p += 1
    out = [str(bisect_right(s, int(data[p + k]))) for k in range(q)]
    sys.stdout.write("\\n".join(out) + "\\n")

main()
`,
  naive: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> x(n), y(n);
    for (int i = 0; i < n; i++) cin >> x[i] >> y[i];
    int q; cin >> q;
    while (q--) {
        long long t; cin >> t;
        int c = 0;
        for (int i = 0; i < n; i++) if (t * y[i] >= x[i]) c++;
        cout << c << "\\n";
    }
}
`,
  tests: (() => {
    const T = [];
    const mk = (runners, qs) => `${runners.length}\n${runners.map((p) => p.join(" ")).join("\n")}\n${qs.length}\n${qs.join("\n")}`;
    T.push({ input: mk([[90, 3], [15, 4], [100, 7], [30, 1], [50, 10]], [5, 30, 4, 15, 1]) });
    T.push({ input: mk([[10, 5], [20, 10], [7, 7]], [1, 2, 3]) });
    T.push({ input: mk([[1, 1]], [1, 1000000000]) });
    T.push({ input: mk([[1000000000, 1]], [999999999, 1000000000, 1]) });
    T.push({ input: mk([[1000, 1000], [999, 1000], [1001, 1000]], [1, 2]) });
    const g = R(202);
    {
      const rs = Array.from({ length: 50 }, () => [g.int(1, 500), g.int(1, 20)]);
      T.push({ input: mk(rs, g.arr(50, 1, 600)) });
    }
    {
      const rs = Array.from({ length: 2000 }, () => [g.int(1, 1000000000), g.int(1, 1000)]);
      T.push({ input: mk(rs, g.arr(2000, 1, 2000000)) });
    }
    for (const seed of [1, 2]) {
      const h = R(2020 + seed);
      const rs = Array.from({ length: 200000 }, () => [h.int(1, 1000000000), h.int(1, 1000)]);
      const qs = Array.from({ length: 200000 }, (_, i) => (i % 2 ? h.int(1, 1000000000) : h.int(1, 3000000)));
      T.push({ input: mk(rs, qs), big: true });
    }
    return T;
  })(),
});

// ---------------------------------------------------------------------------
// 3. Summit (pbinfo #1865)
// ---------------------------------------------------------------------------
problems.push({
  slug: "cb-element-egal-cu-o-suma-de-prefix",
  title: "Elemente egale cu o suma de prefix",
  difficulty: "medium",
  time_limit_ms: 1000,
  tags: ["cautare binara", "sume partiale"],
  statement:
    "Se da un sir a_1, a_2, ..., a_n de numere naturale nenule. Numim suma de prefix de lungime k valoarea a_1 + a_2 + ... + a_k.\n\nPentru fiecare element a_i al sirului, determinati lungimea k a sumei de prefix egale cu a_i, sau 0 daca nicio suma de prefix nu este egala cu a_i.",
  input_format: "Pe prima linie se afla n, iar pe a doua linie cele n numere ale sirului.",
  output_format:
    "Se afiseaza pe o singura linie n numere separate prin cate un spatiu: al i-lea numar este lungimea k a sumei de prefix egale cu a_i, sau 0 daca nu exista.",
  constraints: "2 <= n <= 200 000\n1 <= a_i <= 2 000 000 000",
  hints:
    "Deoarece toate elementele sunt nenule, sumele de prefix sunt strict crescatoare, deci pentru o valoare data exista cel mult un k potrivit, iar acesta poate fi gasit prin cautare binara in vectorul sumelor de prefix. Sumele pot depasi 2^31 (folositi long long).",
  explanation: `${CB_NOTE}\n\nSe construieste vectorul S[k] = a_1 + ... + a_k, care este strict crescator. Pentru fiecare a_i se cauta binar valoarea a_i in S; daca este gasita pe pozitia k, raspunsul este k, altfel 0.\n\n**Complexitate:** O(n log n)`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> a(n + 1), S(n + 1, 0);
    for (int i = 1; i <= n; i++) { cin >> a[i]; S[i] = S[i - 1] + a[i]; }
    string out;
    for (int i = 1; i <= n; i++) {
        int st = 1, dr = n, k = 0;
        while (st <= dr) {
            int mij = (st + dr) / 2;
            if (S[mij] == a[i]) { k = mij; break; }
            if (S[mij] < a[i]) st = mij + 1;
            else dr = mij - 1;
        }
        out += to_string(k);
        out += (i < n ? ' ' : '\\n');
    }
    cout << out;
    return 0;
}
`,
  py: `import sys
from bisect import bisect_left

def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    a = [int(x) for x in data[1:1 + n]]
    S = [0] * (n + 1)
    for i in range(n):
        S[i + 1] = S[i] + a[i]
    rez = []
    for v in a:
        k = bisect_left(S, v, 1)
        rez.append(k if k <= n and S[k] == v else 0)
    print(" ".join(map(str, rez)))

main()
`,
  naive: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    for (int i = 0; i < n; i++) {
        long long s = 0; int k = 0;
        for (int j = 0; j < n; j++) {
            s += a[j];
            if (s == a[i]) { k = j + 1; break; }
            if (s > a[i]) break;
        }
        cout << k << (i + 1 < n ? ' ' : '\\n');
    }
}
`,
  tests: (() => {
    const T = [];
    T.push({ input: "6\n2 3 5 1 11 10" });
    T.push({ input: "4\n1 1 2 4" });
    T.push({ input: "2\n1 1" });
    T.push({ input: "2\n5 3" });
    T.push({ input: "3\n2000000000 2000000000 2000000000" });
    T.push({ input: "5\n1 2 4 8 16" });
    const g = R(303);
    {
      const a = g.arr(30, 1, 5);
      let s = 0;
      const S = a.map((v) => (s += v));
      for (let i = 0; i < 30; i += 3) a[i] = g.pick(S);
      T.push({ input: `30\n${J(a)}` });
    }
    // Teste mari: jumatate valori mici, jumatate egale (sau aproape egale) cu sume de prefix
    // din prima jumatate -> o cautare liniara cu oprire timpurie tot face ~n/4 pasi pe element.
    for (const seed of [1, 2]) {
      const h = R(3030 + seed);
      const n = 200000, half = 100000;
      const a = h.arr(half, 1, 3);
      let s = 0;
      const S = a.map((v) => (s += v));
      for (let i = half; i < n; i++) {
        const v = S[h.int(half / 2, half - 1)];
        a.push(i % 3 === 0 ? v + 1 : v);
      }
      T.push({ input: `${n}\n${J(a)}`, big: true });
    }
    {
      const h = R(3039);
      const a = h.arr(200000, 1, 2000000000);
      T.push({ input: `200000\n${J(a)}` });
    }
    return T;
  })(),
});

// ---------------------------------------------------------------------------
// 4. Ghiozdan (pbinfo #2131)
// ---------------------------------------------------------------------------
problems.push({
  slug: "cb-sticla-de-apa-capacitate-minima",
  title: "Drumetia - capacitatea minima a sticlei",
  difficulty: "hard",
  time_limit_ms: 1000,
  tags: ["cautare binara", "cautare binara pe raspuns"],
  statement:
    "Ana pleaca in drumetie de la kilometrul 0 si trebuie sa ajunga la cabana aflata la kilometrul d. Pe traseu se afla k izvoare, la kilometrii a_1 < a_2 < ... < a_k. Ana are o sticla care incape g portii de apa si pleaca de acasa cu sticla plina. Pentru fiecare kilometru parcurs, Ana bea o portie de apa; daca sticla este goala, parcurge acel kilometru insetata. La fiecare izvor isi umple sticla pana la capacitatea maxima.\n\nAna accepta sa parcurga insetata cel mult t kilometri in total. Determinati capacitatea minima g a sticlei pentru care acest lucru este posibil.",
  input_format:
    "Pe prima linie se afla numerele d, k si t. Pe a doua linie se afla k numere naturale strict crescatoare: pozitiile izvoarelor (daca k = 0, linia este goala).",
  output_format: "Se afiseaza un singur numar natural: capacitatea minima g (poate fi si 0).",
  constraints: "1 <= d <= 1 000 000 000\n0 <= k <= 200 000\n0 < a_1 < a_2 < ... < a_k < d\n0 <= t <= d",
  hints:
    "Pozitiile 0, a_1, ..., a_k, d impart drumul in k + 1 portiuni. Pe o portiune de lungime L, cu sticla de capacitate g, Ana merge insetata max(0, L - g) kilometri. Totalul kilometrilor insetati scade cand g creste, deci se poate cauta binar cel mai mic g potrivit.",
  explanation: `${CB_NOTE}\n\nFie L_0, ..., L_k lungimile portiunilor dintre punctele de alimentare. Pentru o capacitate g, kilometrii insetati sunt sete(g) = suma max(0, L_j - g), functie descrescatoare in g. Raspunsul este in intervalul [0, max L_j] si se gaseste prin cautare binara: cel mai mic g cu sete(g) <= t.\n\n**Complexitate:** O(k log d)`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

vector<long long> L;
long long t;

bool merge_bine(long long g) {
    long long sete = 0;
    for (long long x : L) {
        if (x > g) sete += x - g;
        if (sete > t) return false;
    }
    return true;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    long long d;
    int k;
    cin >> d >> k >> t;
    long long prev = 0, mx = 0;
    for (int i = 0; i < k; i++) {
        long long a;
        cin >> a;
        L.push_back(a - prev);
        prev = a;
    }
    L.push_back(d - prev);
    for (long long x : L) mx = max(mx, x);
    long long st = 0, dr = mx, rez = mx;
    while (st <= dr) {
        long long mij = (st + dr) / 2;
        if (merge_bine(mij)) { rez = mij; dr = mij - 1; }
        else st = mij + 1;
    }
    cout << rez << "\\n";
    return 0;
}
`,
  py: `import sys
from bisect import bisect_right

def main():
    data = sys.stdin.buffer.read().split()
    d, k, t = int(data[0]), int(data[1]), int(data[2])
    poz = [0] + [int(x) for x in data[3:3 + k]] + [d]
    L = sorted(poz[i + 1] - poz[i] for i in range(len(poz) - 1))
    m = len(L)
    suf = [0] * (m + 1)
    for i in range(m - 1, -1, -1):
        suf[i] = suf[i + 1] + L[i]

    def sete(g):
        i = bisect_right(L, g)
        return suf[i] - g * (m - i)

    st, dr = 0, L[-1]
    rez = dr
    while st <= dr:
        mij = (st + dr) // 2
        if sete(mij) <= t:
            rez = mij
            dr = mij - 1
        else:
            st = mij + 1
    print(rez)

main()
`,
  naive: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long d, t; int k; cin >> d >> k >> t;
    vector<long long> L; long long prev = 0;
    for (int i = 0; i < k; i++) { long long a; cin >> a; L.push_back(a - prev); prev = a; }
    L.push_back(d - prev);
    for (long long g = 0;; g++) {
        long long s = 0;
        for (long long x : L) if (x > g) s += x - g;
        if (s <= t) { cout << g << "\\n"; return 0; }
    }
}
`,
  tests: (() => {
    const T = [];
    T.push({ input: "10 2 3\n4 7" });
    T.push({ input: "12 3 0\n2 5 11" });
    T.push({ input: "5 0 5\n" });
    T.push({ input: "5 0 0\n" });
    T.push({ input: "1 0 0\n" });
    T.push({ input: "1000000000 0 0\n" });
    T.push({ input: "1000000000 1 999999999\n1" });
    const g = R(404);
    {
      const pos = distinctSorted(g, 15, 1, 99);
      T.push({ input: `100 15 7\n${J(pos)}` });
    }
    {
      const pos = distinctSorted(g, 40, 1, 999);
      T.push({ input: `1000 40 0\n${J(pos)}` });
    }
    // Mari: izvoarele grupate la inceput, cabana foarte departe -> raspuns uriash
    for (const seed of [1, 2]) {
      const h = R(4040 + seed);
      const pos = distinctSorted(h, 200000, 1, 50000000);
      T.push({ input: `1000000000 200000 ${seed === 1 ? 0 : 123456789}\n${J(pos)}`, big: true });
    }
    {
      const h = R(4049);
      const pos = distinctSorted(h, 200000, 1, 999999999);
      T.push({ input: `1000000000 200000 300000000\n${J(pos)}`, noNaive: true });
    }
    return T;
  })(),
});

// ---------------------------------------------------------------------------
// 5. pow2 (pbinfo #2239)
// ---------------------------------------------------------------------------
problems.push({
  slug: "cb-perechi-cu-suma-putere-a-lui-2",
  title: "Perechi cu suma putere a lui 2",
  difficulty: "medium",
  time_limit_ms: 1500,
  tags: ["cautare binara", "sortare", "puteri ale lui 2"],
  statement:
    "Se da un sir de n numere naturale nenule a_1, a_2, ..., a_n. Determinati cate perechi de indici (i, j), cu i < j, au proprietatea ca a_i + a_j este o putere a lui 2 (adica una dintre valorile 1, 2, 4, 8, 16, ...).",
  input_format: "Pe prima linie se afla n, iar pe a doua linie cele n numere ale sirului.",
  output_format: "Se afiseaza un singur numar: numarul de perechi cerut.",
  constraints: "2 <= n <= 100 000\n1 <= a_i <= 1 000 000 000",
  hints:
    "Sortati sirul. Pentru fiecare element a_i si fiecare putere a lui 2, P (cel mult 31 de valori), numarati cate elemente aflate dupa pozitia i sunt egale cu P - a_i; numarul de aparitii ale unei valori intr-un vector sortat se afla cu doua cautari binare. Rezultatul poate depasi 2^31.",
  explanation: `${CB_NOTE}\n\nSuma a doua elemente este cel mult 2 * 10^9 < 2^31, deci exista doar 31 de puteri posibile (2^1 ... 2^31). Dupa sortare, pentru fiecare i si fiecare putere P, numarul de indici j > i cu a_j = P - a_i este diferenta dintre pozitia primului element > P - a_i si pozitia primului element >= P - a_i, cautate in portiunea de dupa i.\n\n**Complexitate:** O(31 * n log n)`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

vector<long long> a;
int n;

// prima pozitie din [st, n) cu a[poz] >= v (sau > v daca strict = true)
int prima(int st, long long v, bool strict) {
    int dr = n - 1, rez = n;
    while (st <= dr) {
        int mij = (st + dr) / 2;
        bool ok = strict ? (a[mij] > v) : (a[mij] >= v);
        if (ok) { rez = mij; dr = mij - 1; }
        else st = mij + 1;
    }
    return rez;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n;
    a.resize(n);
    for (auto& x : a) cin >> x;
    sort(a.begin(), a.end());
    long long total = 0;
    for (int i = 0; i < n; i++) {
        for (long long P = 2; P <= (1LL << 31); P *= 2) {
            long long v = P - a[i];
            if (v < a[i]) continue;
            total += prima(i + 1, v, true) - prima(i + 1, v, false);
        }
    }
    cout << total << "\\n";
    return 0;
}
`,
  py: `import sys
from bisect import bisect_left, bisect_right

def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    a = sorted(int(x) for x in data[1:1 + n])
    puteri = [1 << e for e in range(1, 32)]
    total = 0
    for i in range(n):
        x = a[i]
        for P in puteri:
            v = P - x
            if v < x:
                continue
            st = bisect_left(a, v, i + 1)
            if st < n and a[st] == v:
                total += bisect_right(a, v, st) - st
    print(total)

main()
`,
  naive: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    long long c = 0;
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++) {
            long long s = a[i] + a[j];
            if ((s & (s - 1)) == 0) c++;
        }
    cout << c << "\\n";
}
`,
  tests: (() => {
    const T = [];
    T.push({ input: "5\n1 3 5 7 9" });
    T.push({ input: "4\n2 2 2 6" });
    T.push({ input: "2\n1 1" });
    T.push({ input: "2\n1 2" });
    T.push({ input: "3\n1000000000 1000000000 73741824" });
    const g = R(505);
    T.push({ input: `40\n${J(g.arr(40, 1, 40))}` });
    T.push({ input: `500\n${J(g.arr(500, 1, 1000))}` });
    T.push({ input: `100000\n${J(Array(100000).fill(1))}`, big: true });
    {
      const h = R(5051);
      // perechi construite special ca suma sa fie putere a lui 2
      const a = h.arr(100000, 1, 500000000);
      for (let i = 0; i < 60000; i += 2) a[i + 1] = 2 ** h.int(30, 30) - a[i];
      T.push({ input: `100000\n${J(a)}`, big: true });
    }
    {
      const h = R(5052);
      T.push({ input: `100000\n${J(h.arr(100000, 1, 1 << 16))}`, big: true });
    }
    return T;
  })(),
});

// ---------------------------------------------------------------------------
// 6. ssplit (pbinfo #2273)
// ---------------------------------------------------------------------------
problems.push({
  slug: "cb-impartirea-sirului-in-trei-secvente",
  title: "Impartirea unui sir in trei secvente echilibrate",
  difficulty: "hard",
  time_limit_ms: 1000,
  tags: ["cautare binara", "sume partiale"],
  statement:
    "Se da un sir de n numere naturale nenule a_1, a_2, ..., a_n. Sirul trebuie taiat in trei secvente consecutive si nevide, alegand doi indici i < j: prima secventa este a_1, ..., a_i, a doua este a_{i+1}, ..., a_j, iar a treia este a_{j+1}, ..., a_n.\n\nPentru o taiere, notam cu D diferenta dintre cea mai mare si cea mai mica dintre cele trei sume ale secventelor. Determinati taierea pentru care D este minim. Daca exista mai multe astfel de taieri, se alege cea cu i minim, iar dintre acestea cea cu j minim.",
  input_format: "Pe prima linie se afla n, iar pe a doua linie cele n numere ale sirului.",
  output_format: "Se afiseaza cei doi indici i si j, separati printr-un spatiu.",
  constraints: "3 <= n <= 200 000\n1 <= a_k <= 10 000",
  hints:
    "Folositi sume de prefix S. Fixati i; suma primei secvente este S[i]. Sumele celorlalte doua secvente sunt B = S[j] - S[i] (crescatoare in j) si C = S[n] - S[j] (descrescatoare in j). Cea mai buna alegere a lui j se afla chiar in jurul locului in care B si C se intalnesc, iar acest loc se gaseste prin cautare binara in S.",
  explanation: `${CB_NOTE}\n\nPentru i fixat, cand j creste, B creste strict si C scade strict, deci max(B, C) scade si apoi creste, iar min(B, C) creste si apoi scade, cu punctul de intoarcere exact unde B si C se intalnesc. De aceea D(i, j) = max(A, B, C) - min(A, B, C) este minim pentru unul dintre cei doi indici vecini acestui punct: j1 = cel mai mare j cu S[j] - S[i] <= S[n] - S[j] (adica 2 * S[j] <= S[n] + S[i]) si j1 + 1. j1 se gaseste prin cautare binara in S. Se parcurg valorile lui i crescator si, pentru fiecare, candidatii j crescator, actualizand rezultatul doar la o imbunatatire stricta, ceea ce respecta regula de departajare.\n\n**Complexitate:** O(n log n)`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> S(n + 1, 0);
    for (int k = 1; k <= n; k++) { long long x; cin >> x; S[k] = S[k - 1] + x; }
    long long best = 4000000000000000000LL;
    int bi = 1, bj = 2;
    for (int i = 1; i <= n - 2; i++) {
        // cel mai mare j din [i+1, n-1] cu 2*S[j] <= S[n] + S[i]
        int st = i + 1, dr = n - 1, j1 = i;
        while (st <= dr) {
            int mij = (st + dr) / 2;
            if (2 * S[mij] <= S[n] + S[i]) { j1 = mij; st = mij + 1; }
            else dr = mij - 1;
        }
        for (int j = j1; j <= j1 + 1; j++) {
            if (j < i + 1 || j > n - 1) continue;
            long long A = S[i], B = S[j] - S[i], C = S[n] - S[j];
            long long D = max(A, max(B, C)) - min(A, min(B, C));
            if (D < best) { best = D; bi = i; bj = j; }
        }
    }
    cout << bi << " " << bj << "\\n";
    return 0;
}
`,
  py: `import sys
from bisect import bisect_right

def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    S = [0] * (n + 1)
    for k in range(1, n + 1):
        S[k] = S[k - 1] + int(data[k])
    total = S[n]
    best = None
    bi = bj = 0
    for i in range(1, n - 1):
        A = S[i]
        j1 = bisect_right(S, (total + A) // 2, i + 1, n) - 1
        for j in (j1, j1 + 1):
            if j < i + 1 or j > n - 1:
                continue
            B = S[j] - A
            C = total - S[j]
            D = max(A, B, C) - min(A, B, C)
            if best is None or D < best:
                best = D
                bi, bj = i, j
    print(bi, bj)

main()
`,
  naive: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> S(n + 1, 0);
    for (int k = 1; k <= n; k++) { long long x; cin >> x; S[k] = S[k - 1] + x; }
    long long best = 4000000000000000000LL; int bi = 0, bj = 0;
    for (int i = 1; i <= n - 2; i++)
        for (int j = i + 1; j <= n - 1; j++) {
            long long A = S[i], B = S[j] - S[i], C = S[n] - S[j];
            long long D = max(A, max(B, C)) - min(A, min(B, C));
            if (D < best) { best = D; bi = i; bj = j; }
        }
    cout << bi << " " << bj << "\\n";
}
`,
  tests: (() => {
    const T = [];
    T.push({ input: "8\n2 4 1 3 6 2 2 5" });
    T.push({ input: "5\n1 1 1 1 1" });
    T.push({ input: "3\n1 1 1" });
    T.push({ input: "3\n10000 1 10000" });
    T.push({ input: "4\n1 10000 1 1" });
    T.push({ input: "6\n5 1 1 1 1 5" });
    const g = R(606);
    for (let k = 0; k < 6; k++) {
      const n = g.int(3, 14);
      T.push({ input: `${n}\n${J(g.arr(n, 1, k < 3 ? 3 : 20))}` });
    }
    T.push({ input: `300\n${J(g.arr(300, 1, 10000))}` });
    for (const seed of [1, 2]) {
      const h = R(6060 + seed);
      T.push({ input: `200000\n${J(h.arr(200000, 1, seed === 1 ? 10000 : 3))}`, big: true });
    }
    return T;
  })(),
});

// ---------------------------------------------------------------------------
// 7. cb (pbinfo #2276)
// ---------------------------------------------------------------------------
problems.push({
  slug: "cb-cate-numere-intr-un-interval",
  title: "Cate numere se afla intr-un interval",
  difficulty: "easy",
  time_limit_ms: 1000,
  tags: ["cautare binara", "sortare", "interogari"],
  statement:
    "Se da un sir de n numere naturale (nu neaparat ordonat) si T intrebari. Fiecare intrebare este un interval inchis [x, y]: cate numere din sir au valoarea cuprinsa intre x si y, inclusiv capetele?",
  input_format:
    "Pe prima linie se afla n si T. Pe a doua linie se afla cele n numere ale sirului. Pe fiecare dintre urmatoarele T linii se afla doua numere x si y, cu x <= y.",
  output_format: "Se afiseaza T linii; linia k contine raspunsul la a k-a intrebare.",
  constraints: "1 <= n, T <= 200 000\n0 <= a_i <= 2 000 000 000\n0 <= x <= y <= 2 000 000 000",
  hints:
    "Sortati sirul o singura data. Pentru un interval [x, y], raspunsul este (pozitia primului element > y) - (pozitia primului element >= x); ambele pozitii se afla prin cautare binara. Atentie: valorile pot depasi limita tipului int pe 32 de biti cu semn.",
  explanation: `${CB_NOTE}\n\nDupa sortare, elementele cu valori in [x, y] formeaza o secventa continua. Inceputul ei este primul indice cu a >= x (lower bound), iar sfarsitul (exclusiv) este primul indice cu a > y (upper bound).\n\n**Complexitate:** O((n + T) log n)`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

vector<long long> a;

// prima pozitie cu a[poz] > v (strict) sau a[poz] >= v
int prima(long long v, bool strict) {
    int st = 0, dr = (int)a.size() - 1, rez = a.size();
    while (st <= dr) {
        int mij = (st + dr) / 2;
        if (strict ? a[mij] > v : a[mij] >= v) { rez = mij; dr = mij - 1; }
        else st = mij + 1;
    }
    return rez;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, T;
    cin >> n >> T;
    a.resize(n);
    for (auto& x : a) cin >> x;
    sort(a.begin(), a.end());
    string out;
    while (T--) {
        long long x, y;
        cin >> x >> y;
        out += to_string(prima(y, true) - prima(x, false));
        out += '\\n';
    }
    cout << out;
    return 0;
}
`,
  py: `import sys
from bisect import bisect_left, bisect_right

def main():
    data = sys.stdin.buffer.read().split()
    n, T = int(data[0]), int(data[1])
    a = sorted(int(v) for v in data[2:2 + n])
    p = 2 + n
    out = []
    for _ in range(T):
        x = int(data[p]); y = int(data[p + 1]); p += 2
        out.append(str(bisect_right(a, y) - bisect_left(a, x)))
    sys.stdout.write("\\n".join(out) + "\\n")

main()
`,
  naive: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, T; cin >> n >> T;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    while (T--) {
        long long x, y; cin >> x >> y;
        int c = 0;
        for (int i = 0; i < n; i++) if (a[i] >= x && a[i] <= y) c++;
        cout << c << "\\n";
    }
}
`,
  tests: (() => {
    const T = [];
    const mk = (a, qs) => `${a.length} ${qs.length}\n${J(a)}\n${qs.map((q) => q.join(" ")).join("\n")}`;
    T.push({ input: mk([7, 2, 9, 4, 4, 12, 0, 7], [[3, 8], [0, 0], [13, 100], [4, 4], [0, 2000000000], [5, 6]]) });
    T.push({ input: mk([5, 5, 5], [[5, 5], [0, 4], [6, 6]]) });
    T.push({ input: mk([0], [[0, 0], [1, 1]]) });
    T.push({ input: mk([2000000000, 0, 2000000000], [[2000000000, 2000000000], [0, 1999999999], [1, 2]]) });
    const g = R(707);
    {
      const a = g.arr(60, 0, 100);
      const qs = Array.from({ length: 60 }, () => { const x = g.int(0, 110), y = g.int(0, 110); return [Math.min(x, y), Math.max(x, y)]; });
      T.push({ input: mk(a, qs) });
    }
    {
      const a = g.arr(3000, 0, 2000000000);
      const qs = Array.from({ length: 3000 }, () => { const x = g.int(0, 2000000000), y = g.int(0, 2000000000); return [Math.min(x, y), Math.max(x, y)]; });
      T.push({ input: mk(a, qs) });
    }
    for (const seed of [1, 2]) {
      const h = R(7070 + seed);
      const a = h.arr(200000, 0, seed === 1 ? 2000000000 : 1000);
      const lim = seed === 1 ? 2000000000 : 1100;
      const qs = Array.from({ length: 200000 }, () => { const x = h.int(0, lim), y = h.int(0, lim); return [Math.min(x, y), Math.max(x, y)]; });
      T.push({ input: mk(a, qs), big: true });
    }
    return T;
  })(),
});

// ---------------------------------------------------------------------------
// 8. cb2 (pbinfo #2443)
// ---------------------------------------------------------------------------
problems.push({
  slug: "cb-prefix-maxim-cu-doua-conditii",
  title: "Cel mai lung prefix cu doua conditii",
  difficulty: "medium",
  time_limit_ms: 1000,
  tags: ["cautare binara", "sume partiale", "interogari"],
  statement:
    "Se da un sir de n numere naturale nenule a_1, a_2, ..., a_n si Q intrebari. Fiecare intrebare contine doua numere x si s. Raspunsul la intrebare este cel mai mare numar p (0 <= p <= n) cu proprietatea ca primele p elemente ale sirului sunt toate mai mici sau egale cu x, iar suma lor este mai mica sau egala cu s. Raspundeti la toate intrebarile.",
  input_format:
    "Pe prima linie se afla n. Pe a doua linie se afla cele n numere ale sirului. Pe a treia linie se afla Q, iar pe fiecare dintre urmatoarele Q linii cate doua numere x si s.",
  output_format: "Se afiseaza Q linii; linia k contine raspunsul la a k-a intrebare.",
  constraints: "1 <= n, Q <= 200 000\n1 <= a_i <= 1 000 000 000\n1 <= x <= 1 000 000 000\n1 <= s <= 1 000 000 000 000 000",
  hints:
    "Calculati maximul fiecarui prefix (vector crescator) si suma fiecarui prefix (vector strict crescator). Fiecare dintre cele doua conditii este indeplinita de un prefix al acestor vectori, iar lungimea maxima se gaseste prin cautare binara. Raspunsul este minimul celor doua lungimi.",
  explanation: `${CB_NOTE}\n\nFie MX[p] = max(a_1..a_p) si S[p] = a_1 + ... + a_p. Ambele sunt monotone, deci conditia MX[p] <= x este adevarata pentru p = 0..p1, iar S[p] <= s pentru p = 0..p2. p1 si p2 se gasesc prin cautare binara, iar raspunsul este min(p1, p2).\n\n**Complexitate:** O((n + Q) log n)`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int n;

// cel mai mare p din [0, n] cu v[p] <= lim (v crescator, v[0] = 0)
int ultim(const vector<long long>& v, long long lim) {
    int st = 0, dr = n, rez = 0;
    while (st <= dr) {
        int mij = (st + dr) / 2;
        if (v[mij] <= lim) { rez = mij; st = mij + 1; }
        else dr = mij - 1;
    }
    return rez;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n;
    vector<long long> MX(n + 1, 0), S(n + 1, 0);
    for (int i = 1; i <= n; i++) {
        long long a;
        cin >> a;
        MX[i] = max(MX[i - 1], a);
        S[i] = S[i - 1] + a;
    }
    int q;
    cin >> q;
    string out;
    while (q--) {
        long long x, s;
        cin >> x >> s;
        out += to_string(min(ultim(MX, x), ultim(S, s)));
        out += '\\n';
    }
    cout << out;
    return 0;
}
`,
  py: `import sys
from bisect import bisect_right

def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    MX = [0] * (n + 1)
    S = [0] * (n + 1)
    for i in range(1, n + 1):
        a = int(data[i])
        MX[i] = MX[i - 1] if MX[i - 1] > a else a
        S[i] = S[i - 1] + a
    q = int(data[n + 1])
    p = n + 2
    out = []
    for _ in range(q):
        x = int(data[p]); s = int(data[p + 1]); p += 2
        p1 = bisect_right(MX, x) - 1
        p2 = bisect_right(S, s) - 1
        out.append(str(p1 if p1 < p2 else p2))
    sys.stdout.write("\\n".join(out) + "\\n")

main()
`,
  naive: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> a(n);
    for (auto& v : a) cin >> v;
    int q; cin >> q;
    while (q--) {
        long long x, s; cin >> x >> s;
        long long sum = 0; int p = 0;
        while (p < n && a[p] <= x && sum + a[p] <= s) { sum += a[p]; p++; }
        cout << p << "\\n";
    }
}
`,
  tests: (() => {
    const T = [];
    const mk = (a, qs) => `${a.length}\n${J(a)}\n${qs.length}\n${qs.map((q) => q.join(" ")).join("\n")}`;
    T.push({ input: mk([3, 1, 4, 1, 5, 9, 2, 6], [[4, 100], [9, 20], [2, 50], [10, 3], [10, 31], [100, 1000]]) });
    T.push({ input: mk([5, 5, 5, 5], [[5, 15], [4, 100], [5, 20]]) });
    T.push({ input: mk([1], [[1, 1], [1, 0 + 1], [1000000000, 1000000000000000]]) });
    T.push({ input: mk([1000000000, 1], [[999999999, 1000000000000000], [1000000000, 1000000000], [1000000000, 1000000001]]) });
    const g = R(808);
    {
      const a = g.arr(40, 1, 30);
      T.push({ input: mk(a, Array.from({ length: 40 }, () => [g.int(1, 35), g.int(1, 700)])) });
    }
    {
      const a = g.arr(3000, 1, 1000000000);
      T.push({ input: mk(a, Array.from({ length: 3000 }, () => [g.int(1, 1000000000), g.int(1, 1000000000000000)])) });
    }
    for (const seed of [1, 2]) {
      const h = R(8080 + seed);
      const a = h.arr(200000, 1, seed === 1 ? 1000 : 1000000000);
      const qs = Array.from({ length: 200000 }, (_, i) => [i % 4 ? 1000000000 : h.int(1, 1000000000), i % 4 ? 1000000000000000 : h.int(1, 1000000000000000)]);
      T.push({ input: mk(a, qs), big: true });
    }
    return T;
  })(),
});

// ---------------------------------------------------------------------------
// 9. spower2 (pbinfo #2621)
// ---------------------------------------------------------------------------
problems.push({
  slug: "cb-cel-mai-mic-numar-suma-de-doua-puteri-ale-lui-2",
  title: "Suma de doua puteri distincte ale lui 2",
  difficulty: "medium",
  time_limit_ms: 1000,
  tags: ["cautare binara", "precalculare", "puteri ale lui 2"],
  statement:
    "Spunem ca un numar natural este dublu-putere daca se poate scrie ca suma a doua puteri distincte ale lui 2, adica sub forma 2^x + 2^y, cu x != y (de exemplu 3 = 1 + 2, 10 = 2 + 8, 1040 = 16 + 1024).\n\nSe da un sir de n numere naturale. Pentru fiecare element A al sirului, determinati cel mai mic numar dublu-putere care este mai mare sau egal cu A.",
  input_format: "Pe prima linie se afla n, iar pe a doua linie cele n numere ale sirului.",
  output_format: "Se afiseaza pe o singura linie n numere separate prin cate un spatiu: raspunsurile pentru elementele sirului, in ordinea citirii.",
  constraints: "1 <= n <= 200 000\n0 <= A < 1 000 000 000",
  hints:
    "Numerele dublu-putere care ne intereseaza sunt putine: 2^x + 2^y cu 0 <= x < y <= 30 (465 de valori). Generati-le, sortati-le, apoi pentru fiecare A gasiti prin cautare binara primul element >= A.",
  explanation: `${CB_NOTE}\n\nCel mai mare raspuns posibil este 2^29 + 2^30 > 10^9, deci ajung exponentii pana la 30. Se precalculeaza vectorul sortat al celor 465 de valori 2^x + 2^y, iar pentru fiecare A se cauta binar primul element >= A. O solutie care creste A pas cu pas pana gaseste un numar cu exact doi biti de 1 poate face sute de milioane de pasi pentru un singur element.\n\n**Complexitate:** O(n log 465)`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    vector<long long> v;
    for (int x = 0; x <= 30; x++)
        for (int y = x + 1; y <= 30; y++)
            v.push_back((1LL << x) + (1LL << y));
    sort(v.begin(), v.end());
    int n;
    cin >> n;
    string out;
    for (int i = 0; i < n; i++) {
        long long A;
        cin >> A;
        int st = 0, dr = (int)v.size() - 1, poz = dr;
        while (st <= dr) {
            int mij = (st + dr) / 2;
            if (v[mij] >= A) { poz = mij; dr = mij - 1; }
            else st = mij + 1;
        }
        out += to_string(v[poz]);
        out += (i + 1 < n ? ' ' : '\\n');
    }
    cout << out;
    return 0;
}
`,
  py: `import sys
from bisect import bisect_left

def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    v = sorted((1 << x) + (1 << y) for x in range(31) for y in range(x + 1, 31))
    rez = [v[bisect_left(v, int(a))] for a in data[1:1 + n]]
    print(" ".join(map(str, rez)))

main()
`,
  naive: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    for (int i = 0; i < n; i++) {
        long long A; cin >> A;
        while (__builtin_popcountll(A) != 2) A++;
        cout << A << (i + 1 < n ? ' ' : '\\n');
    }
}
`,
  tests: (() => {
    const T = [];
    T.push({ input: "7\n13 7 6 20 2 33 100" });
    T.push({ input: "4\n0 1 3 4" });
    T.push({ input: "1\n999999999" });
    T.push({ input: "3\n536870913 805306368 805306369" });
    const g = R(909);
    T.push({ input: `100\n${J(g.arr(100, 0, 5000))}` });
    T.push({ input: `1000\n${J(g.arr(1000, 0, 999999999))}`, big: true });
    {
      const h = R(9091);
      // Valori aflate imediat dupa un numar dublu-putere mare -> goluri uriase
      const a = Array.from({ length: 200000 }, (_, i) => (i % 2 ? h.int(0, 999999999) : 2 ** 29 + 2 ** h.int(25, 28) + h.int(1, 1000)));
      T.push({ input: `200000\n${J(a)}`, big: true });
    }
    {
      const h = R(9092);
      T.push({ input: `200000\n${J(h.arr(200000, 0, 999999999))}`, big: true });
    }
    return T;
  })(),
});

// ---------------------------------------------------------------------------
// 10. clase (pbinfo #2644)
// ---------------------------------------------------------------------------
problems.push({
  slug: "cb-chei-si-lacate",
  title: "Chei si lacate",
  difficulty: "easy",
  time_limit_ms: 1000,
  tags: ["cautare binara", "interogari"],
  statement:
    "Un paznic are de verificat n lacate. Fiecare lacat are inscriptionat un cod numeric, iar codurile lacatelor sunt distincte si sunt date in ordine crescatoare. Paznicul are la el un inel cu m chei, cu coduri distincte doua cate doua. O cheie deschide un lacat daca si numai daca are exact acelasi cod ca lacatul.\n\nDeterminati cate lacate pot fi deschise cu cheile de pe inel.",
  input_format:
    "Pe prima linie se afla n. Pe a doua linie se afla n numere naturale strict crescatoare: codurile lacatelor. Pe a treia linie se afla m. Pe a patra linie se afla m numere naturale distincte: codurile cheilor.",
  output_format: "Se afiseaza un singur numar: cate lacate pot fi deschise.",
  constraints: "1 <= n, m <= 200 000\nToate codurile sunt numere naturale nenule mai mici sau egale cu 1 000 000 000 000.",
  hints:
    "Pentru fiecare cheie, cautati binar codul ei in vectorul (deja sortat) al codurilor lacatelor. Valorile depasesc tipul int: folositi long long.",
  explanation: `${CB_NOTE}\n\nDeoarece codurile din fiecare vector sunt distincte, fiecare lacat poate fi deschis de cel mult o cheie si fiecare cheie deschide cel mult un lacat. Raspunsul este numarul de chei al caror cod se gaseste in vectorul lacatelor; fiecare verificare se face prin cautare binara.\n\n**Complexitate:** O(m log n)`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> c(n);
    for (auto& x : c) cin >> x;
    int m;
    cin >> m;
    int rez = 0;
    for (int k = 0; k < m; k++) {
        long long p;
        cin >> p;
        int st = 0, dr = n - 1;
        while (st <= dr) {
            int mij = (st + dr) / 2;
            if (c[mij] == p) { rez++; break; }
            if (c[mij] < p) st = mij + 1;
            else dr = mij - 1;
        }
    }
    cout << rez << "\\n";
    return 0;
}
`,
  py: `import sys
from bisect import bisect_left

def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    c = [int(x) for x in data[1:1 + n]]
    m = int(data[1 + n])
    rez = 0
    for x in data[2 + n:2 + n + m]:
        p = int(x)
        i = bisect_left(c, p)
        if i < n and c[i] == p:
            rez += 1
    print(rez)

main()
`,
  naive: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> c(n);
    for (auto& x : c) cin >> x;
    int m; cin >> m; int r = 0;
    for (int k = 0; k < m; k++) {
        long long p; cin >> p;
        for (int i = 0; i < n; i++) if (c[i] == p) { r++; break; }
    }
    cout << r << "\\n";
}
`,
  tests: (() => {
    const T = [];
    const mk = (c, p) => `${c.length}\n${J(c)}\n${p.length}\n${J(p)}`;
    T.push({ input: mk([12, 18, 22, 25, 29, 31], [25, 30, 12, 40, 31]) });
    T.push({ input: mk([5, 10], [1, 2, 3]) });
    T.push({ input: mk([1], [1]) });
    T.push({ input: mk([1000000000000], [999999999999, 1000000000000]) });
    const g = R(1010);
    {
      const c = distinctSorted(g, 50, 1, 120);
      const p = [...new Set(g.arr(80, 1, 130))];
      T.push({ input: mk(c, p) });
    }
    for (const seed of [1, 2]) {
      const h = R(10100 + seed);
      const c = distinctSorted(h, 200000, 1, 1000000000000);
      const pSet = new Set();
      while (pSet.size < 200000) pSet.add(h.r() < 0.5 ? h.pick(c) : h.int(1, 1000000000000));
      const p = [...pSet];
      T.push({ input: mk(c, p), big: true });
    }
    return T;
  })(),
});

// ---------------------------------------------------------------------------
// 11. cb3 (pbinfo #2789)
// ---------------------------------------------------------------------------
problems.push({
  slug: "cb-numar-maxim-de-elemente-cu-suma-limitata",
  title: "Numarul maxim de elemente cu suma limitata",
  difficulty: "medium",
  time_limit_ms: 1000,
  tags: ["cautare binara", "sortare", "sume partiale", "interogari"],
  statement:
    "Se da un sir de n numere naturale nenule si Q intrebari. Pentru fiecare intrebare se da un numar S si trebuie sa determinati cel mai mare numar de elemente ale sirului (fiecare element poate fi ales cel mult o data) a caror suma este mai mica sau egala cu S.",
  input_format: "Pe prima linie se afla n si Q. Pe a doua linie se afla cele n numere ale sirului. Pe urmatoarele Q linii se afla cate un numar S.",
  output_format: "Se afiseaza Q linii; linia k contine raspunsul la a k-a intrebare.",
  constraints: "1 <= n <= 100 000\n1 <= Q <= 200 000\n1 <= a_i < 1 000 000\n1 <= S <= 100 000 000 000",
  hints:
    "Pentru a lua cat mai multe elemente, este optim sa le luam pe cele mai mici. Sortati sirul si calculati sumele de prefix; raspunsul pentru S este cel mai mare k cu suma primelor k elemente <= S, gasit prin cautare binara.",
  explanation: `${CB_NOTE}\n\nDaca un set de k elemente are suma <= S, atunci si cele mai mici k elemente ale sirului au suma <= S. Deci raspunsul este cel mai mare k cu P[k] <= S, unde P sunt sumele de prefix ale sirului sortat crescator. Vectorul P este strict crescator, asa ca acest k se afla prin cautare binara.\n\n**Complexitate:** O(n log n + Q log n)`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    cin >> n >> q;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    sort(a.begin(), a.end());
    vector<long long> P(n + 1, 0);
    for (int i = 1; i <= n; i++) P[i] = P[i - 1] + a[i - 1];
    string out;
    while (q--) {
        long long S;
        cin >> S;
        int st = 0, dr = n, k = 0;
        while (st <= dr) {
            int mij = (st + dr) / 2;
            if (P[mij] <= S) { k = mij; st = mij + 1; }
            else dr = mij - 1;
        }
        out += to_string(k);
        out += '\\n';
    }
    cout << out;
    return 0;
}
`,
  py: `import sys
from bisect import bisect_right

def main():
    data = sys.stdin.buffer.read().split()
    n, q = int(data[0]), int(data[1])
    a = sorted(int(x) for x in data[2:2 + n])
    P = [0] * (n + 1)
    for i in range(n):
        P[i + 1] = P[i] + a[i]
    out = [str(bisect_right(P, int(s)) - 1) for s in data[2 + n:2 + n + q]]
    sys.stdout.write("\\n".join(out) + "\\n")

main()
`,
  naive: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, q; cin >> n >> q;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    sort(a.begin(), a.end());
    while (q--) {
        long long S; cin >> S;
        long long s = 0; int k = 0;
        while (k < n && s + a[k] <= S) { s += a[k]; k++; }
        cout << k << "\\n";
    }
}
`,
  tests: (() => {
    const T = [];
    const mk = (a, qs) => `${a.length} ${qs.length}\n${J(a)}\n${qs.join("\n")}`;
    T.push({ input: mk([6, 2, 9, 1, 4], [7, 1, 100, 13, 3, 22]) });
    T.push({ input: mk([5, 5, 5], [4, 5, 14, 15]) });
    T.push({ input: mk([999999], [1, 999999, 100000000000]) });
    const g = R(1111);
    T.push({ input: mk(g.arr(50, 1, 30), g.arr(50, 1, 800)) });
    T.push({ input: mk(g.arr(5000, 1, 999999), g.arr(5000, 1, 100000000000)) });
    for (const seed of [1, 2]) {
      const h = R(11110 + seed);
      const a = h.arr(100000, 1, 999999);
      const qs = Array.from({ length: 200000 }, (_, i) => (i % 5 ? h.int(10000000000, 100000000000) : h.int(1, 100000000000)));
      T.push({ input: mk(a, qs), big: true });
    }
    return T;
  })(),
});

// ---------------------------------------------------------------------------
// 12. cautafibo (pbinfo #2969)
// ---------------------------------------------------------------------------
problems.push({
  slug: "cb-cati-termeni-fibonacci",
  title: "Cati termeni Fibonacci contine sirul",
  difficulty: "easy",
  time_limit_ms: 1000,
  tags: ["cautare binara", "fibonacci", "precalculare"],
  statement:
    "Sirul lui Fibonacci incepe cu 1, 1, iar fiecare termen urmator este suma celor doi termeni dinaintea lui: 1, 1, 2, 3, 5, 8, 13, 21, ...\n\nSe da un sir de n numere naturale nenule. Determinati cate dintre ele sunt termeni ai sirului lui Fibonacci. Daca o valoare apare de mai multe ori, fiecare aparitie se numara.",
  input_format: "Pe prima linie se afla n, iar pe a doua linie cele n numere.",
  output_format: "Se afiseaza un singur numar: cate dintre cele n numere sunt termeni Fibonacci.",
  constraints: "1 <= n <= 200 000\nFiecare numar are cel mult 10 cifre (1 <= x < 10 000 000 000).",
  hints:
    "Termenii Fibonacci mai mici de 10^10 sunt doar aproximativ 50. Generati-i o singura data intr-un vector (care va fi crescator), apoi verificati fiecare numar citit prin cautare binara in acest vector. Folositi long long.",
  explanation: `${CB_NOTE.replace("testele mari sunt construite", "chiar daca vectorul de cautat este mic, exercitiul are ca scop folosirea cautarii binare; testele mari sunt construite")}\n\nSe genereaza termenii Fibonacci < 10^10 (vector strict crescator, fara a doua aparitie a lui 1) si, pentru fiecare numar citit, se verifica prin cautare binara daca apare in acest vector.\n\n**Complexitate:** O(n log 50)`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    vector<long long> f = {1, 2};
    while (f[f.size() - 1] + f[f.size() - 2] < 10000000000LL)
        f.push_back(f[f.size() - 1] + f[f.size() - 2]);
    int n;
    cin >> n;
    int rez = 0;
    for (int i = 0; i < n; i++) {
        long long x;
        cin >> x;
        int st = 0, dr = (int)f.size() - 1;
        while (st <= dr) {
            int mij = (st + dr) / 2;
            if (f[mij] == x) { rez++; break; }
            if (f[mij] < x) st = mij + 1;
            else dr = mij - 1;
        }
    }
    cout << rez << "\\n";
    return 0;
}
`,
  py: `import sys
from bisect import bisect_left

def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    f = [1, 2]
    while f[-1] + f[-2] < 10 ** 10:
        f.append(f[-1] + f[-2])
    rez = 0
    for tok in data[1:1 + n]:
        x = int(tok)
        i = bisect_left(f, x)
        if i < len(f) and f[i] == x:
            rez += 1
    print(rez)

main()
`,
  naive: null,
  tests: (() => {
    const T = [];
    T.push({ input: "12\n4 13 21 1 22 34 8 1 9 144 100 2" });
    T.push({ input: "3\n6 7 10" });
    T.push({ input: "1\n1" });
    T.push({ input: "3\n7778742049 9999999999 4807526976" });
    const g = R(1212);
    const fib = [1, 2];
    while (fib[fib.length - 1] + fib[fib.length - 2] < 1e10) fib.push(fib[fib.length - 1] + fib[fib.length - 2]);
    T.push({ input: `200\n${J(Array.from({ length: 200 }, (_, i) => (i % 2 ? g.pick(fib) : g.int(1, 1000))))}` });
    T.push({ input: `200000\n${J(Array.from({ length: 200000 }, (_, i) => (i % 3 ? g.int(1, 9999999999) : g.pick(fib) + (i % 2))))}` });
    return T;
  })(),
});

// ---------------------------------------------------------------------------
// 13. SecvMaxVal (pbinfo #3163)
// ---------------------------------------------------------------------------
problems.push({
  slug: "cb-secventa-de-lungime-maxima-cu-suma-limitata",
  title: "Secventa de lungime maxima cu suma limitata",
  difficulty: "hard",
  time_limit_ms: 1000,
  tags: ["cautare binara", "sume partiale", "secvente"],
  statement:
    "Se da un sir de n numere naturale a_1, a_2, ..., a_n si un numar natural V. Determinati lungimea maxima a unei secvente (elemente aflate pe pozitii consecutive) a carei suma este mai mica sau egala cu V. Daca nicio secventa nevida nu are aceasta proprietate, afisati 0.",
  input_format: "Pe prima linie se afla n si V. Pe a doua linie se afla cele n numere ale sirului.",
  output_format: "Se afiseaza un singur numar: lungimea maxima ceruta.",
  constraints: "1 <= n <= 200 000\n0 <= a_i < 1 000 000 000\n1 <= V <= 1 000 000 000 000 000 000",
  hints:
    "Fie P[k] suma primelor k elemente (P[0] = 0); deoarece elementele sunt naturale, P este crescator. Secventa a_{l+1}..a_r are suma P[r] - P[l]. Pentru fiecare capat drept r, cel mai mic l bun este primul indice cu P[l] >= P[r] - V, care se gaseste prin cautare binara.",
  explanation: `${CB_NOTE}\n\nPentru r fixat, conditia P[r] - P[l] <= V este echivalenta cu P[l] >= P[r] - V; deoarece P este crescator, indicii l buni formeaza un sufix al intervalului [0, r], iar cel mai mic dintre ei se afla prin cautare binara. Lungimea candidata este r - l, iar raspunsul este maximul acestor lungimi. (Problema se poate rezolva si cu tehnica celor doi pointeri.)\n\n**Complexitate:** O(n log n)`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long V;
    cin >> n >> V;
    vector<long long> P(n + 1, 0);
    for (int i = 1; i <= n; i++) { long long x; cin >> x; P[i] = P[i - 1] + x; }
    int best = 0;
    for (int r = 1; r <= n; r++) {
        long long prag = P[r] - V;
        int st = 0, dr = r, l = r;
        while (st <= dr) {
            int mij = (st + dr) / 2;
            if (P[mij] >= prag) { l = mij; dr = mij - 1; }
            else st = mij + 1;
        }
        best = max(best, r - l);
    }
    cout << best << "\\n";
    return 0;
}
`,
  py: `import sys
from bisect import bisect_left

def main():
    data = sys.stdin.buffer.read().split()
    n, V = int(data[0]), int(data[1])
    P = [0] * (n + 1)
    for i in range(1, n + 1):
        P[i] = P[i - 1] + int(data[1 + i])
    best = 0
    for r in range(1, n + 1):
        l = bisect_left(P, P[r] - V, 0, r)
        if r - l > best:
            best = r - l
    print(best)

main()
`,
  naive: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; long long V; cin >> n >> V;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    int best = 0;
    for (int i = 0; i < n; i++) {
        long long s = 0;
        for (int j = i; j < n; j++) {
            s += a[j];
            if (s > V) break;
            best = max(best, j - i + 1);
        }
    }
    cout << best << "\\n";
}
`,
  tests: (() => {
    const T = [];
    T.push({ input: "7 10\n6 3 2 4 8 1 1" });
    T.push({ input: "4 3\n5 7 4 9" });
    T.push({ input: "1 1\n0" });
    T.push({ input: "1 5\n5" });
    T.push({ input: "5 1\n0 0 1 0 0" });
    T.push({ input: "3 1000000000000000000\n999999999 999999999 999999999" });
    const g = R(1313);
    for (let k = 0; k < 3; k++) {
      const n = g.int(5, 30);
      T.push({ input: `${n} ${g.int(1, 60)}\n${J(g.arr(n, 0, 20))}` });
    }
    T.push({ input: `3000 ${g.int(1, 100000000000)}\n${J(g.arr(3000, 0, 999999999))}` });
    {
      const h = R(13131);
      T.push({ input: `200000 1000000000000000000\n${J(h.arr(200000, 0, 999999999))}`, big: true });
    }
    {
      const h = R(13132);
      T.push({ input: `200000 50000000000000\n${J(h.arr(200000, 0, 999999999))}`, big: true });
    }
    return T;
  })(),
});

// ---------------------------------------------------------------------------
// 14. Invers (pbinfo #3260)
// ---------------------------------------------------------------------------
problems.push({
  slug: "cb-inversarea-unei-functii-crescatoare",
  title: "Inversarea unei functii crescatoare",
  difficulty: "medium",
  time_limit_ms: 500,
  tags: ["cautare binara", "numere reale", "functii monotone"],
  statement:
    "Consideram functia f(x) = sin(x) + sin(2x) + x, unde x este exprimat in radiani. Pe intervalul [0, 1) functia f este strict crescatoare si ia valori de la 0 pana la aproximativ 2.75.\n\nSe da un numar real y din intervalul [0, 2.7]. Dintre toate numerele x din [0, 1) care au cel mult 8 zecimale (adica x = k / 100 000 000, cu k natural, 0 <= k < 100 000 000), determinati-l pe cel pentru care f(x) este cel mai apropiat de y. Daca doua valori ale lui x sunt la fel de apropiate, se alege cea mai mica.",
  input_format: "Se citeste numarul real y.",
  output_format: "Se afiseaza valoarea x gasita, cu exact 8 zecimale (de exemplu 0.12345678).",
  constraints: "0 <= y <= 2.7\ny are cel mult 6 zecimale\nCalculul lui f se face in tipul double, ca f(k / 100000000.0).",
  hints:
    "Cautati binar dupa k intreg in [0, 10^8 - 1]: gasiti cel mai mic k cu f(k / 10^8) >= y. Raspunsul este fie acest k, fie k - 1; comparati distantele |f - y| pentru cele doua valori. Pentru afisare, scrieti k cu 8 cifre (completand cu zerouri la stanga) dupa \"0.\".",
  explanation: `${CB_NOTE}\n\nO cautare liniara peste toate cele 10^8 valori posibile ale lui k ar insemna 10^8 evaluari de sinus, mult prea lent. Fiind strict crescatoare, f permite cautarea binara a celui mai mic k cu f(k / 10^8) >= y (in aproximativ 27 de pasi). Cel mai apropiat x este fie acest k, fie predecesorul lui; la egalitate se pastreaza cel mai mic. Lucrand cu k intreg, evitam problemele de rotunjire la afisare.\n\n**Complexitate:** O(log 10^8)`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

double f(long long k) {
    double x = k / 100000000.0;
    return sin(x) + sin(2 * x) + x;
}

int main() {
    double y;
    cin >> y;
    long long st = 0, dr = 99999999, k = 99999999;
    while (st <= dr) {
        long long mij = (st + dr) / 2;
        if (f(mij) >= y) { k = mij; dr = mij - 1; }
        else st = mij + 1;
    }
    if (k > 0 && fabs(f(k - 1) - y) <= fabs(f(k) - y)) k--;
    printf("0.%08lld\\n", k);
    return 0;
}
`,
  py: `import math

def f(k):
    x = k / 100000000.0
    return math.sin(x) + math.sin(2 * x) + x

y = float(input())
st, dr, k = 0, 99999999, 99999999
while st <= dr:
    mij = (st + dr) // 2
    if f(mij) >= y:
        k = mij
        dr = mij - 1
    else:
        st = mij + 1
if k > 0 and abs(f(k - 1) - y) <= abs(f(k) - y):
    k -= 1
print("0.%08d" % k)
`,
  naive: `#include <bits/stdc++.h>
using namespace std;
int main() {
    double y; cin >> y;
    long long best = 0; double bd = 1e18;
    for (long long k = 0; k < 100000000; k++) {
        double x = k / 100000000.0;
        double d = fabs(sin(x) + sin(2 * x) + x - y);
        if (d < bd) { bd = d; best = k; }
    }
    printf("0.%08lld\\n", best);
}
`,
  tests: (() => {
    const T = [];
    const ys = ["1.5", "0.5", "0", "2.7", "0.000001", "1.34", "2.123456", "0.987654", "2.5", "1"];
    ys.forEach((y, i) => T.push({ input: y, big: i === 3 || i === 8 }));
    return T;
  })(),
  naiveSmallSkip: true, // naiva face 10^8 evaluari: o rulam doar pe testele marcate mari
});

// ---------------------------------------------------------------------------
// 15. Intervale6 (pbinfo #3939)
// ---------------------------------------------------------------------------
problems.push({
  slug: "cb-intervale-fara-elemente-din-sir",
  title: "Intervale care nu contin elemente din sir",
  difficulty: "medium",
  time_limit_ms: 1000,
  tags: ["cautare binara", "intervale", "interogari"],
  statement:
    "Se da un sir de n numere naturale ordonat crescator si T intervale inchise [x, y]. Determinati cate dintre aceste intervale nu contin niciun element al sirului.",
  input_format:
    "Pe prima linie se afla n. Pe a doua linie se afla cele n numere ale sirului, in ordine crescatoare. Pe a treia linie se afla T, iar pe urmatoarele T linii cate doua numere x si y, cu x <= y.",
  output_format: "Se afiseaza un singur numar: cate intervale nu contin niciun element al sirului.",
  constraints: "1 <= n <= 100 000\n1 <= T <= 200 000\nToate numerele sunt naturale, cuprinse intre 1 si 1 000 000 000.\nSirul poate contine valori egale.",
  hints:
    "Un interval [x, y] contine un element al sirului daca si numai daca cel mai mic element >= x exista si este <= y. Acest element se gaseste prin cautare binara.",
  explanation: `${CB_NOTE}\n\nPentru fiecare interval se cauta binar primul element al sirului care este >= x. Daca nu exista sau este > y, intervalul nu contine niciun element si se numara.\n\n**Complexitate:** O(T log n)`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto& v : a) cin >> v;
    int T;
    cin >> T;
    int rez = 0;
    while (T--) {
        long long x, y;
        cin >> x >> y;
        int st = 0, dr = n - 1, poz = n;
        while (st <= dr) {
            int mij = (st + dr) / 2;
            if (a[mij] >= x) { poz = mij; dr = mij - 1; }
            else st = mij + 1;
        }
        if (poz == n || a[poz] > y) rez++;
    }
    cout << rez << "\\n";
    return 0;
}
`,
  py: `import sys
from bisect import bisect_left

def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    a = [int(v) for v in data[1:1 + n]]
    T = int(data[1 + n])
    p = 2 + n
    rez = 0
    for _ in range(T):
        x = int(data[p]); y = int(data[p + 1]); p += 2
        i = bisect_left(a, x)
        if i == n or a[i] > y:
            rez += 1
    print(rez)

main()
`,
  naive: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> a(n);
    for (auto& v : a) cin >> v;
    int T; cin >> T; int r = 0;
    while (T--) {
        long long x, y; cin >> x >> y;
        bool gasit = false;
        for (int i = 0; i < n && a[i] <= y; i++) if (a[i] >= x) { gasit = true; break; }
        if (!gasit) r++;
    }
    cout << r << "\\n";
}
`,
  tests: (() => {
    const T = [];
    const mk = (a, qs) => `${a.length}\n${J(a)}\n${qs.length}\n${qs.map((q) => q.join(" ")).join("\n")}`;
    T.push({ input: mk([3, 7, 7, 12, 20], [[1, 2], [4, 6], [7, 7], [13, 19], [21, 50], [8, 12], [1, 100]]) });
    T.push({ input: mk([10], [[10, 10], [9, 9], [11, 11]]) });
    T.push({ input: mk([1, 1000000000], [[2, 999999999], [1, 1], [1000000000, 1000000000]]) });
    const g = R(1515);
    {
      const a = asc(g.arr(30, 1, 100));
      const qs = Array.from({ length: 60 }, () => { const x = g.int(1, 110), y = g.int(1, 110); return [Math.min(x, y), Math.max(x, y)]; });
      T.push({ input: mk(a, qs) });
    }
    {
      const a = asc(g.arr(3000, 1, 1000000000));
      const qs = Array.from({ length: 3000 }, () => { const x = g.int(1, 1000000000); return [x, Math.min(1000000000, x + g.int(0, 1000000))]; });
      T.push({ input: mk(a, qs) });
    }
    for (const seed of [1, 2]) {
      const h = R(15150 + seed);
      const a = asc(h.arr(100000, 1, 1000000000));
      const qs = Array.from({ length: 200000 }, () => { const x = h.int(500000000, 1000000000); return [x, Math.min(1000000000, x + h.int(0, seed === 1 ? 5000 : 100000))]; });
      T.push({ input: mk(a, qs), big: true });
    }
    return T;
  })(),
});

// ---------------------------------------------------------------------------
// 16. araci (pbinfo #4237)
// ---------------------------------------------------------------------------
problems.push({
  slug: "cb-taierea-betelor-lungime-maxima",
  title: "Taierea betelor in bucati egale",
  difficulty: "medium",
  time_limit_ms: 1000,
  tags: ["cautare binara", "cautare binara pe raspuns"],
  statement:
    "Un gradinar are n bete de lungimi naturale si are nevoie de cel putin A bucati de aceeasi lungime L (numar natural) pentru a sustine rasadurile. Din fiecare bat se pot taia oricate bucati de lungime L, iar resturile mai scurte de L se arunca; bucatile nu se pot lipi intre ele.\n\nDeterminati cea mai mare lungime L pentru care se pot obtine cel putin A bucati.",
  input_format: "Pe prima linie se afla n si A. Pe a doua linie se afla cele n lungimi ale betelor.",
  output_format: "Se afiseaza un singur numar: lungimea maxima L.",
  constraints: "1 <= n <= 100 000\n1 <= lungimea unui bat <= 1 000 000 000\n1 <= A <= 1 000 000 000\nSe garanteaza ca suma lungimilor este cel putin A (deci L = 1 este mereu posibil).",
  hints:
    "Pentru o lungime L, numarul de bucati obtinute este suma [lungime_i / L], care scade cand L creste. Cautati binar cea mai mare valoare L pentru care aceasta suma este cel putin A.",
  explanation: `${CB_NOTE}\n\nFunctia buc(L) = suma [lungime_i / L] este descrescatoare. Raspunsul se afla in [1, max lungime] si este cel mai mare L cu buc(L) >= A. Calculul sumei se poate opri imediat ce atinge A.\n\n**Complexitate:** O(n log max)`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int n;
long long A;
vector<long long> b;

bool ajunge(long long L) {
    long long buc = 0;
    for (int i = 0; i < n; i++) {
        buc += b[i] / L;
        if (buc >= A) return true;
    }
    return false;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n >> A;
    b.resize(n);
    long long mx = 0;
    for (auto& x : b) { cin >> x; mx = max(mx, x); }
    long long st = 1, dr = mx, rez = 1;
    while (st <= dr) {
        long long mij = (st + dr) / 2;
        if (ajunge(mij)) { rez = mij; st = mij + 1; }
        else dr = mij - 1;
    }
    cout << rez << "\\n";
    return 0;
}
`,
  py: `import sys

def main():
    data = sys.stdin.buffer.read().split()
    n, A = int(data[0]), int(data[1])
    b = [int(x) for x in data[2:2 + n]]
    st, dr, rez = 1, max(b), 1
    while st <= dr:
        mij = (st + dr) // 2
        if sum(x // mij for x in b) >= A:
            rez = mij
            st = mij + 1
        else:
            dr = mij - 1
    print(rez)

main()
`,
  naive: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; long long A; cin >> n >> A;
    vector<long long> b(n); long long mx = 0;
    for (auto& x : b) { cin >> x; mx = max(mx, x); }
    for (long long L = mx; L >= 1; L--) {
        long long s = 0;
        for (int i = 0; i < n; i++) s += b[i] / L;
        if (s >= A) { cout << L << "\\n"; return 0; }
    }
}
`,
  tests: (() => {
    const T = [];
    T.push({ input: "4 9\n15 8 22 11" });
    T.push({ input: "3 3\n7 7 7" });
    T.push({ input: "1 1\n1" });
    T.push({ input: "1 1\n1000000000" });
    T.push({ input: "1 1000000000\n1000000000" });
    T.push({ input: "2 3\n10 1" });
    const g = R(1616);
    T.push({ input: `20 ${g.int(1, 200)}\n${J(g.arr(20, 1, 100))}` });
    T.push({ input: `500 1000\n${J(g.arr(500, 1, 100000))}` });
    {
      const h = R(16161);
      T.push({ input: `100000 1000000000\n${J(h.arr(100000, 1, 1000000000))}`, big: true });
    }
    {
      const h = R(16162);
      const a = h.arr(100000, 1, 1000);
      a[0] = 1000000000;
      T.push({ input: `100000 30000000\n${J(a)}`, big: true });
    }
    return T;
  })(),
});

// ---------------------------------------------------------------------------
// 17. perechiAB (pbinfo #4265)
// ---------------------------------------------------------------------------
problems.push({
  slug: "cb-perechi-cu-suma-intr-un-interval",
  title: "Perechi cu suma intr-un interval",
  difficulty: "hard",
  time_limit_ms: 1000,
  tags: ["cautare binara", "sortare", "perechi"],
  statement:
    "Se da un sir de n numere naturale nenule v_1, v_2, ..., v_n si doua numere naturale A <= B. Determinati cate perechi de indici (i, j), cu i < j, au proprietatea ca A <= v_i + v_j <= B.",
  input_format: "Pe prima linie se afla n. Pe a doua linie se afla cele n numere ale sirului. Pe a treia linie se afla A si B.",
  output_format: "Se afiseaza un singur numar: numarul de perechi cerut.",
  constraints: "2 <= n <= 200 000\n1 <= v_i <= 1 000 000 000\n1 <= A <= B <= 2 000 000 000",
  hints:
    "Ordinea elementelor nu influenteaza raspunsul, deci puteti sorta sirul. Pentru fiecare i, valorile v_j bune (cu j > i) sunt cele din intervalul [A - v_i, B - v_i]; numarul lor in portiunea de dupa i se afla cu doua cautari binare. Rezultatul poate depasi 2^31.",
  explanation: `${CB_NOTE}\n\nDupa sortare, pentru fiecare pozitie i se numara elementele de pe pozitiile i+1..n-1 cu valori in [A - v_i, B - v_i]: diferenta dintre pozitia primului element > B - v_i si pozitia primului element >= A - v_i, ambele cautate binar in portiunea de dupa i. Suma acestor numere este raspunsul.\n\n**Complexitate:** O(n log n)`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

vector<long long> v;
int n;

// prima pozitie din [st, n) cu v[poz] >= x (sau > x daca strict)
int prima(int st, long long x, bool strict) {
    int dr = n - 1, rez = n;
    while (st <= dr) {
        int mij = (st + dr) / 2;
        if (strict ? v[mij] > x : v[mij] >= x) { rez = mij; dr = mij - 1; }
        else st = mij + 1;
    }
    return rez;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n;
    v.resize(n);
    for (auto& x : v) cin >> x;
    long long A, B;
    cin >> A >> B;
    sort(v.begin(), v.end());
    long long total = 0;
    for (int i = 0; i < n; i++)
        total += prima(i + 1, B - v[i], true) - prima(i + 1, A - v[i], false);
    cout << total << "\\n";
    return 0;
}
`,
  py: `import sys
from bisect import bisect_left, bisect_right

def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    v = sorted(int(x) for x in data[1:1 + n])
    A, B = int(data[1 + n]), int(data[2 + n])
    total = 0
    for i in range(n):
        x = v[i]
        total += bisect_right(v, B - x, i + 1) - bisect_left(v, A - x, i + 1)
    print(total)

main()
`,
  naive: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> v(n);
    for (auto& x : v) cin >> x;
    long long A, B; cin >> A >> B;
    long long c = 0;
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++) {
            long long s = v[i] + v[j];
            if (s >= A && s <= B) c++;
        }
    cout << c << "\\n";
}
`,
  tests: (() => {
    const T = [];
    T.push({ input: "6\n4 1 7 3 5 2\n6 9" });
    T.push({ input: "4\n5 5 5 5\n10 10" });
    T.push({ input: "2\n1 1\n3 5" });
    T.push({ input: "2\n1000000000 1000000000\n1 2000000000" });
    T.push({ input: "3\n1 2 3\n1 2" });
    const g = R(1717);
    for (let k = 0; k < 3; k++) {
      const n = g.int(2, 40);
      const a = g.int(1, 60), b = g.int(1, 60);
      T.push({ input: `${n}\n${J(g.arr(n, 1, 30))}\n${Math.min(a, b)} ${Math.max(a, b)}` });
    }
    T.push({ input: `3000\n${J(g.arr(3000, 1, 1000000000))}\n700000000 1300000000` });
    {
      const h = R(17171);
      T.push({ input: `200000\n${J(h.arr(200000, 1, 1000000000))}\n500000000 1500000000`, big: true });
    }
    {
      const h = R(17172);
      T.push({ input: `200000\n${J(h.arr(200000, 1, 1000))}\n1 2000000000`, big: true });
    }
    return T;
  })(),
});

// ---------------------------------------------------------------------------
// 18. cerculete (pbinfo #4469)
// ---------------------------------------------------------------------------
problems.push({
  slug: "cb-case-in-raza-antenei",
  title: "Case in raza antenei",
  difficulty: "medium",
  time_limit_ms: 1000,
  tags: ["cautare binara", "sortare", "geometrie"],
  statement:
    "Intr-un sat, harta este un sistem de coordonate in care antena de telefonie se afla in originea O(0, 0), iar fiecare dintre cele n case are coordonate intregi. Antena poate functiona pe m niveluri de putere; la fiecare nivel ea acopera toate casele aflate la o distanta mai mica sau egala cu o anumita raza (casele aflate exact la distanta egala cu raza sunt acoperite).\n\nPentru fiecare nivel de putere, determinati cate case sunt acoperite de antena.",
  input_format:
    "Pe prima linie se afla n. Pe fiecare dintre urmatoarele n linii se afla coordonatele x si y ale unei case. Pe linia urmatoare se afla m, iar pe ultima linie cele m raze corespunzatoare nivelurilor de putere.",
  output_format: "Se afiseaza pe o singura linie m numere separate prin cate un spatiu: numarul de case acoperite pentru fiecare raza, in ordinea citirii.",
  constraints: "1 <= n, m <= 200 000\n-1 000 000 <= x, y <= 1 000 000\n1 <= raza <= 1 000 000 000",
  hints:
    "Evitati radicalii: casa (x, y) este acoperita de raza r exact cand x*x + y*y <= r*r. Calculati pentru fiecare casa valoarea x*x + y*y (long long), sortati aceste valori, iar pentru fiecare raza numarati prin cautare binara cate sunt <= r*r.",
  explanation: `${CB_NOTE}\n\nComparand patratele distantelor (numere intregi de pana la 2 * 10^12) cu r^2 (pana la 10^18, inca in long long), evitam erorile de precizie ale numerelor reale. Dupa sortarea patratelor distantelor, raspunsul pentru o raza este pozitia primului element > r^2.\n\n**Complexitate:** O((n + m) log n)`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> d(n);
    for (int i = 0; i < n; i++) {
        long long x, y;
        cin >> x >> y;
        d[i] = x * x + y * y;
    }
    sort(d.begin(), d.end());
    int m;
    cin >> m;
    string out;
    for (int k = 0; k < m; k++) {
        long long r;
        cin >> r;
        long long r2 = r * r;
        int st = 0, dr = n - 1, poz = n;
        while (st <= dr) {
            int mij = (st + dr) / 2;
            if (d[mij] > r2) { poz = mij; dr = mij - 1; }
            else st = mij + 1;
        }
        out += to_string(poz);
        out += (k + 1 < m ? ' ' : '\\n');
    }
    cout << out;
    return 0;
}
`,
  py: `import sys
from bisect import bisect_right

def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    d = []
    p = 1
    for _ in range(n):
        x = int(data[p]); y = int(data[p + 1]); p += 2
        d.append(x * x + y * y)
    d.sort()
    m = int(data[p]); p += 1
    rez = [bisect_right(d, int(r) * int(r)) for r in data[p:p + m]]
    print(" ".join(map(str, rez)))

main()
`,
  naive: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> d(n);
    for (int i = 0; i < n; i++) { long long x, y; cin >> x >> y; d[i] = x * x + y * y; }
    int m; cin >> m;
    for (int k = 0; k < m; k++) {
        long long r; cin >> r; int c = 0;
        for (int i = 0; i < n; i++) if (d[i] <= r * r) c++;
        cout << c << (k + 1 < m ? ' ' : '\\n');
    }
}
`,
  tests: (() => {
    const T = [];
    const mk = (pts, rs) => `${pts.length}\n${pts.map((p) => p.join(" ")).join("\n")}\n${rs.length}\n${J(rs)}`;
    T.push({ input: mk([[3, 4], [0, 6], [-1, -1], [5, 0], [-6, 8], [2, -3]], [5, 1, 10, 3, 6]) });
    T.push({ input: mk([[0, 0]], [1]) });
    T.push({ input: mk([[1000000, 1000000], [-1000000, -1000000]], [1414213, 1414214, 1000000000]) });
    T.push({ input: mk([[0, 1], [1, 0], [0, -1], [-1, 0]], [1, 1, 1]) });
    const g = R(1818);
    {
      const pts = Array.from({ length: 60 }, () => [g.int(-20, 20), g.int(-20, 20)]);
      T.push({ input: mk(pts, g.arr(40, 1, 30)) });
    }
    for (const seed of [1, 2]) {
      const h = R(18180 + seed);
      const pts = Array.from({ length: 200000 }, () => [h.int(-1000000, 1000000), h.int(-1000000, 1000000)]);
      T.push({ input: mk(pts, h.arr(200000, 1, seed === 1 ? 1500000 : 1000000000)), big: true });
    }
    return T;
  })(),
});

// ---------------------------------------------------------------------------
// 19. mingi (pbinfo #4471)
// ---------------------------------------------------------------------------
problems.push({
  slug: "cb-pe-ce-rand-este-locul",
  title: "Pe ce rand este locul",
  difficulty: "medium",
  time_limit_ms: 1000,
  tags: ["cautare binara", "sume partiale", "interogari"],
  statement:
    "Intr-o sala de spectacole sunt n randuri, numerotate de la 1 la n, iar randul i are c_i scaune. Locurile din sala sunt numerotate consecutiv, incepand cu 1: mai intai scaunele de pe randul 1, apoi cele de pe randul 2 si asa mai departe, pana la ultimul scaun de pe randul n.\n\nLa intrare, k spectatori isi arata biletele, pe care este scris doar numarul locului. Pentru fiecare bilet, determinati pe ce rand se afla locul respectiv.",
  input_format:
    "Pe prima linie se afla n. Pe a doua linie se afla numerele de scaune c_1, ..., c_n ale randurilor. Pe a treia linie se afla k, iar pe a patra linie numerele de loc de pe cele k bilete.",
  output_format: "Se afiseaza pe o singura linie k numere separate prin cate un spatiu: randurile corespunzatoare biletelor, in ordinea citirii.",
  constraints: "1 <= n, k <= 200 000\n1 <= c_i <= 10 000\nFiecare loc de pe bilete exista in sala (numarul lui este cel mult c_1 + ... + c_n).",
  hints:
    "Fie S[i] = c_1 + ... + c_i. Locul b se afla pe randul i daca S[i-1] < b <= S[i], adica i este prima pozitie cu S[i] >= b. Vectorul S este strict crescator, deci aceasta pozitie se gaseste prin cautare binara.",
  explanation: `${CB_NOTE}\n\nRandul i contine locurile S[i-1]+1 ... S[i]. Pentru un loc b, randul este cel mai mic i cu S[i] >= b (lower bound in vectorul sumelor de prefix).\n\n**Complexitate:** O((n + k) log n)`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> S(n + 1, 0);
    for (int i = 1; i <= n; i++) { long long c; cin >> c; S[i] = S[i - 1] + c; }
    int k;
    cin >> k;
    string out;
    for (int q = 0; q < k; q++) {
        long long b;
        cin >> b;
        int st = 1, dr = n, cutie = n;
        while (st <= dr) {
            int mij = (st + dr) / 2;
            if (S[mij] >= b) { cutie = mij; dr = mij - 1; }
            else st = mij + 1;
        }
        out += to_string(cutie);
        out += (q + 1 < k ? ' ' : '\\n');
    }
    cout << out;
    return 0;
}
`,
  py: `import sys
from bisect import bisect_left

def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    S = [0] * (n + 1)
    for i in range(1, n + 1):
        S[i] = S[i - 1] + int(data[i])
    k = int(data[n + 1])
    rez = [bisect_left(S, int(b), 1) for b in data[n + 2:n + 2 + k]]
    print(" ".join(map(str, rez)))

main()
`,
  naive: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> c(n);
    for (auto& x : c) cin >> x;
    int k; cin >> k;
    for (int q = 0; q < k; q++) {
        long long b; cin >> b;
        long long s = 0; int i = 0;
        while (s + c[i] < b) { s += c[i]; i++; }
        cout << i + 1 << (q + 1 < k ? ' ' : '\\n');
    }
}
`,
  tests: (() => {
    const T = [];
    const mk = (c, b) => `${c.length}\n${J(c)}\n${b.length}\n${J(b)}`;
    T.push({ input: mk([4, 2, 6, 3, 1], [1, 5, 7, 12, 13, 16, 15]) });
    T.push({ input: mk([1, 1, 1], [3, 2, 1]) });
    T.push({ input: mk([10000], [1, 10000, 5000]) });
    const g = R(1919);
    {
      const c = g.arr(30, 1, 10);
      const tot = c.reduce((s, v) => s + v, 0);
      T.push({ input: mk(c, g.arr(50, 1, tot)) });
    }
    for (const seed of [1, 2]) {
      const h = R(19190 + seed);
      const c = h.arr(200000, 1, 10000);
      const tot = c.reduce((s, v) => s + v, 0);
      const b = Array.from({ length: 200000 }, (_, i) => (i % 4 ? h.int(Math.floor(tot / 2), tot) : h.int(1, tot)));
      T.push({ input: mk(c, b), big: true });
    }
    return T;
  })(),
});

// ---------------------------------------------------------------------------
// 20. CB_par_impar (pbinfo #4353)
// ---------------------------------------------------------------------------
problems.push({
  slug: "cb-pare-in-prima-jumatate-impare-in-a-doua",
  title: "Pare in prima jumatate, impare in a doua",
  difficulty: "medium",
  time_limit_ms: 1000,
  tags: ["cautare binara", "paritate", "interogari"],
  statement:
    "Se da un vector x cu n elemente numere naturale, ordonat crescator, unde n este par, si un vector y cu m elemente numere naturale. Determinati:\n- a = cate elemente pare ale vectorului y apar printre primele n/2 elemente ale lui x;\n- b = cate elemente impare ale vectorului y apar printre ultimele n/2 elemente ale lui x.\n\nFiecare element al lui y se analizeaza separat (daca o valoare apare de mai multe ori in y, fiecare aparitie se numara).",
  input_format: "Pe prima linie se afla n. Pe a doua linie se afla elementele lui x. Pe a treia linie se afla m. Pe a patra linie se afla elementele lui y.",
  output_format: "Se afiseaza numerele a si b, separate printr-un spatiu.",
  constraints: "2 <= n <= 200 000, n par\n1 <= m <= 200 000\n0 <= elementele vectorilor < 1 000 000 000\nVectorul x poate contine valori egale.",
  hints:
    "Ambele jumatati ale lui x sunt la randul lor sortate. Pentru fiecare element din y, in functie de paritate, cautati-l binar fie in x[1..n/2], fie in x[n/2+1..n].",
  explanation: `${CB_NOTE}\n\nSe scrie o functie de cautare binara care primeste capetele portiunii in care se cauta. Pentru un element par din y se cauta in prima jumatate a lui x, iar pentru unul impar in a doua jumatate.\n\n**Complexitate:** O(m log n)`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

vector<long long> x;

bool cauta(int st, int dr, long long v) {
    while (st <= dr) {
        int mij = (st + dr) / 2;
        if (x[mij] == v) return true;
        if (x[mij] < v) st = mij + 1;
        else dr = mij - 1;
    }
    return false;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    x.resize(n);
    for (auto& v : x) cin >> v;
    int m;
    cin >> m;
    int a = 0, b = 0;
    for (int i = 0; i < m; i++) {
        long long y;
        cin >> y;
        if (y % 2 == 0) { if (cauta(0, n / 2 - 1, y)) a++; }
        else { if (cauta(n / 2, n - 1, y)) b++; }
    }
    cout << a << " " << b << "\\n";
    return 0;
}
`,
  py: `import sys
from bisect import bisect_left

def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    x = [int(v) for v in data[1:1 + n]]
    m = int(data[1 + n])
    h = n // 2
    a = b = 0
    for tok in data[2 + n:2 + n + m]:
        y = int(tok)
        if y % 2 == 0:
            i = bisect_left(x, y, 0, h)
            if i < h and x[i] == y:
                a += 1
        else:
            i = bisect_left(x, y, h, n)
            if i < n and x[i] == y:
                b += 1
    print(a, b)

main()
`,
  naive: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> x(n);
    for (auto& v : x) cin >> v;
    int m; cin >> m; int a = 0, b = 0;
    for (int i = 0; i < m; i++) {
        long long y; cin >> y;
        bool g = false;
        if (y % 2 == 0) { for (int j = 0; j < n / 2; j++) if (x[j] == y) { g = true; break; } if (g) a++; }
        else { for (int j = n / 2; j < n; j++) if (x[j] == y) { g = true; break; } if (g) b++; }
    }
    cout << a << " " << b << "\\n";
}
`,
  tests: (() => {
    const T = [];
    const mk = (x, y) => `${x.length}\n${J(x)}\n${y.length}\n${J(y)}`;
    T.push({ input: mk([2, 3, 4, 8, 9, 11, 14, 15], [4, 9, 15, 3, 8, 14, 4, 20]) });
    T.push({ input: mk([1, 2], [1, 2]) });
    T.push({ input: mk([5, 5, 5, 5], [5, 5, 4]) });
    T.push({ input: mk([0, 0, 6, 6, 6, 7], [0, 6, 7, 1]) });
    const g = R(2020);
    {
      const x = asc(g.arr(40, 0, 60));
      T.push({ input: mk(x, g.arr(60, 0, 65)) });
    }
    for (const seed of [1, 2]) {
      const h = R(20200 + seed);
      const x = asc(h.arr(200000, 0, 999999999));
      const y = Array.from({ length: 200000 }, () => (h.r() < 0.6 ? h.pick(x) : h.int(0, 999999999)));
      T.push({ input: mk(x, y), big: true });
    }
    return T;
  })(),
});

// ===========================================================================
// Verificare + inserare
// ===========================================================================
async function verify(p) {
  const testRows = [];
  const issues = [];
  let maxCpp = 0, maxPy = 0;
  const limit = p.time_limit_ms;

  for (let i = 0; i < p.tests.length; i++) {
    const { input, big } = p.tests[i];
    const runs = [runCustom("cpp", p.cpp, input), runCustom("python", p.py, input)];
    const wantNaive = p.naive && !p.tests[i].noNaive && (big || !p.naiveSmallSkip);
    if (wantNaive) runs.push(runCustom("cpp", p.naive, input));
    const [c, py, nv] = await Promise.all(runs);

    if (c.verdict !== "AC") { issues.push(`test ${i}: cpp ${c.verdict} ${(c.stderr || "").slice(0, 300)}`); continue; }
    if (py.verdict !== "AC") { issues.push(`test ${i}: python ${py.verdict} ${(py.stderr || "").slice(0, 300)}`); continue; }
    const oc = normalize(c.stdout), op = normalize(py.stdout);
    if (oc !== op) { issues.push(`test ${i}: MISMATCH cpp="${oc.slice(0, 120)}" py="${op.slice(0, 120)}"`); continue; }
    maxCpp = Math.max(maxCpp, c.time_ms || 0);
    maxPy = Math.max(maxPy, py.time_ms || 0);

    let naiveInfo = "";
    if (nv) {
      if (!big) {
        if (nv.verdict !== "AC" || normalize(nv.stdout) !== oc) issues.push(`test ${i}: naiva difera pe test mic (${nv.verdict}) naive="${normalize(nv.stdout).slice(0, 120)}" oficial="${oc.slice(0, 120)}"`);
      } else {
        const slow = nv.verdict === "TLE" || (nv.time_ms || 0) >= 2 * limit;
        naiveInfo = ` naiva=${nv.verdict}/${nv.time_ms}ms`;
        if (!slow) issues.push(`test ${i}: solutia naiva NU depaseste limita (${nv.verdict}, ${nv.time_ms}ms, limita ${limit}ms)`);
      }
    }
    if (big && ((c.time_ms || 0) > limit / 2 || (py.time_ms || 0) > limit * 0.8)) {
      issues.push(`test ${i}: solutie oficiala prea lenta (cpp ${c.time_ms}ms, py ${py.time_ms}ms, limita ${limit}ms)`);
    }
    console.log(`  test ${i}${big ? " [mare]" : ""}: ok cpp=${c.time_ms}ms py=${py.time_ms}ms${naiveInfo} (${input.length} car.)`);
    testRows.push({ input, expected_output: `${oc}\n`, is_sample: i < 2 });
  }
  return { testRows, issues, maxCpp, maxPy };
}

async function upsert(p, testRows) {
  const vals = [
    p.slug, p.title, p.statement, p.input_format, p.output_format, p.constraints, p.difficulty,
    p.time_limit_ms, p.memory_limit_mb || 128, "Zece la Info", p.tags, ["cpp", "c", "pascal", "python"],
    p.cpp, p.hints, p.explanation, p.cpp, p.py, CHAPTER.level, CHAPTER.chapter, CHAPTER.sub,
  ];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query("SELECT id FROM problems WHERE slug = $1", [p.slug]);
    let id;
    if (existing.rows.length) {
      id = existing.rows[0].id;
      await client.query(
        `UPDATE problems SET title=$2, statement=$3, input_format=$4, output_format=$5, constraints=$6,
           difficulty=$7, time_limit_ms=$8, memory_limit_mb=$9, source=$10, tags=$11, allowed_languages=$12,
           is_published=true, editorial_status='published', official_solution=$13, hints=$14, explanation=$15,
           official_solution_cpp=$16, official_solution_python=$17, curriculum_level=$18,
           curriculum_chapter_id=$19, curriculum_subcategory_id=$20, solution_mode='full', checker_mode='exact',
           updated_at=NOW()
         WHERE slug=$1`,
        vals,
      );
      await client.query("DELETE FROM test_cases WHERE problem_id = $1", [id]);
    } else {
      const ins = await client.query(
        `INSERT INTO problems (slug, title, statement, input_format, output_format, constraints, difficulty,
           time_limit_ms, memory_limit_mb, source, tags, allowed_languages, is_published, official_solution,
           hints, explanation, official_solution_cpp, official_solution_python, curriculum_level,
           curriculum_chapter_id, curriculum_subcategory_id, solution_mode, checker_mode, editorial_status,
           estimated_minutes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,$13,$14,$15,$16,$17,$18,$19,$20,'full','exact','published',20)
         RETURNING id`,
        vals,
      );
      id = ins.rows[0].id;
    }
    for (let i = 0; i < testRows.length; i++) {
      const t = testRows[i];
      await client.query(
        `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index) VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, t.input, t.expected_output, t.is_sample, 10, i + 1],
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function main() {
  const only = process.env.ONLY_SLUGS ? process.env.ONLY_SLUGS.split(",") : null;
  const list = only ? problems.filter((p) => only.includes(p.slug)) : problems;
  const summary = [];
  for (const p of list) {
    console.log(`\n=== ${p.slug} (limita ${p.time_limit_ms}ms, ${p.tests.length} teste) ===`);
    try {
      const { testRows, issues, maxCpp, maxPy } = await verify(p);
      if (issues.length) {
        issues.forEach((s) => console.error(`  !! ${s}`));
        summary.push({ slug: p.slug, ok: false });
        continue;
      }
      if (!DRY_RUN) await upsert(p, testRows);
      console.log(`  ${DRY_RUN ? "VERIFICAT (dry run)" : "PUBLICAT"}: ${testRows.length} teste, max cpp ${maxCpp}ms, max py ${maxPy}ms`);
      summary.push({ slug: p.slug, ok: true, tests: testRows.length });
    } catch (e) {
      console.error(`  FAIL ${e.message}`);
      summary.push({ slug: p.slug, ok: false });
    }
  }
  console.log("\n=== SUMMARY ===");
  for (const s of summary) console.log(`${s.ok ? "OK  " : "FAIL"} ${s.slug}${s.tests ? ` (${s.tests} teste)` : ""}`);
  console.log(`\n${summary.filter((s) => s.ok).length}/${summary.length} ${DRY_RUN ? "verificate" : "publicate"}`);
  await pool.end();
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
