const { Pool } = require("pg");
const { generateArtifacts, buildInputText, buildOutputText, buildSignatureBlock } = require("./lib/subprogram-codegen");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const pool = new Pool({ connectionString });

const BASE_META = {
  difficulty: "easy",
  time_limit_ms: 1000,
  memory_limit_mb: 64,
  input_source: "stdin",
  output_target: "stdout",
  curriculum_level: "grade10",
  curriculum_chapter_id: "subprograme",
  curriculum_subcategory_id: "returneaza-valori",
  solution_mode: "function",
  checker_mode: "exact",
  source: "Sursa interna",
};

// ---------- helpere JS (referinta pentru calculul rezultatelor asteptate) ----------

function cmmdc(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}
function cmmmc(a, b) {
  return (a / cmmdc(a, b)) * b;
}
function digits(n) {
  return String(n).split("").map(Number);
}
function sumaFactorilorPrimi(n) {
  let s = 0;
  let m = n;
  for (let d = 2; d * d <= m; d++) {
    if (m % d === 0) {
      s += d;
      while (m % d === 0) m = Math.floor(m / d);
    }
  }
  if (m > 1) s += m;
  return s;
}
function numarFactoriPrimi(n) {
  let c = 0;
  let m = n;
  for (let d = 2; d * d <= m; d++) {
    if (m % d === 0) {
      c++;
      while (m % d === 0) m = Math.floor(m / d);
    }
  }
  if (m > 1) c++;
  return c;
}
function divizoriList(n) {
  const ds = [];
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) {
      ds.push(i);
      if (i !== n / i) ds.push(n / i);
    }
  }
  return ds;
}
function sumaDivizorilor(n) {
  return divizoriList(n).reduce((s, x) => s + x, 0);
}
function celMaiMicFactorPrim(n) {
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return d;
  return n;
}
function celMaiMareFactorPrim(n) {
  let m = n;
  let best = 1;
  for (let d = 2; d * d <= m; d++) {
    if (m % d === 0) {
      best = d;
      while (m % d === 0) m = Math.floor(m / d);
    }
  }
  if (m > 1) best = m;
  return best;
}
function estePrim(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}
function fibUpTo(n) {
  const f = [0, 1];
  for (let i = 2; i <= n; i++) f.push(f[i - 1] + f[i - 2]);
  return f;
}

const problems = [
  {
    slug: "subprograme-cmmmc",
    title: "Cel mai mic multiplu comun",
    statement: "Implementati o functie care primeste doua numere naturale nenule `a` si `b` si intoarce cel mai mic multiplu comun al lor.",
    input_format: "Doua linii: a, apoi b.",
    output_format: "Cel mai mic multiplu comun al lui a si b.",
    constraints: "1 <= a, b <= 1000",
    spec: {
      name: "cmmmc",
      params: [{ name: "a", type: "int" }, { name: "b", type: "int" }],
      returns: { mode: "value", type: "int" },
    },
    solve: (args) => cmmmc(args.a, args.b),
    tests: [{ a: 4, b: 6 }, { a: 21, b: 6 }, { a: 1, b: 5 }, { a: 7, b: 7 }, { a: 12, b: 18 }, { a: 100, b: 250 }],
    official_cpp: "int cmmmc(int a, int b) {\n    int x = a, y = b, r;\n    while (y != 0) { r = x % y; x = y; y = r; }\n    return (a / x) * b;\n}\n",
    official_python: "def cmmmc(a, b):\n    x, y = a, b\n    while y != 0:\n        x, y = y, x % y\n    return (a // x) * b\n",
  },
  {
    slug: "subprograme-suma-factorilor-primi",
    title: "Suma factorilor primi ai unui numar",
    statement:
      "Implementati o functie care primeste un numar natural `n` (n >= 2) si intoarce suma factorilor primi distincti ai lui n (de exemplu, pentru 360 = 2^3 * 3^2 * 5, suma este 2 + 3 + 5 = 10).",
    input_format: "O linie continand numarul natural n.",
    output_format: "Suma factorilor primi distincti ai lui n.",
    constraints: "2 <= n <= 10^6",
    spec: { name: "sumaFactorilorPrimi", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => sumaFactorilorPrimi(a.n),
    tests: [{ n: 12 }, { n: 360 }, { n: 97 }, { n: 2 }, { n: 1000000 }, { n: 100 }],
    official_cpp:
      "int sumaFactorilorPrimi(int n) {\n    int s = 0;\n    for (int d = 2; (long long)d * d <= n; d++) {\n        if (n % d == 0) {\n            s += d;\n            while (n % d == 0) n /= d;\n        }\n    }\n    if (n > 1) s += n;\n    return s;\n}\n",
    official_python:
      "def sumaFactorilorPrimi(n):\n    s = 0\n    d = 2\n    while d * d <= n:\n        if n % d == 0:\n            s += d\n            while n % d == 0:\n                n //= d\n        d += 1\n    if n > 1:\n        s += n\n    return s\n",
  },
  {
    slug: "subprograme-numarul-factorilor-primi",
    title: "Numarul factorilor primi distincti ai unui numar",
    statement: "Implementati o functie care primeste un numar natural `n` (n >= 2) si intoarce cati factori primi distincti are n.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Numarul factorilor primi distincti ai lui n.",
    constraints: "2 <= n <= 10^6",
    spec: { name: "numarFactoriPrimi", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => numarFactoriPrimi(a.n),
    tests: [{ n: 360 }, { n: 97 }, { n: 2 }, { n: 1000000 }, { n: 30 }, { n: 210 }],
    official_cpp:
      "int numarFactoriPrimi(int n) {\n    int c = 0;\n    for (int d = 2; (long long)d * d <= n; d++) {\n        if (n % d == 0) {\n            c++;\n            while (n % d == 0) n /= d;\n        }\n    }\n    if (n > 1) c++;\n    return c;\n}\n",
    official_python:
      "def numarFactoriPrimi(n):\n    c = 0\n    d = 2\n    while d * d <= n:\n        if n % d == 0:\n            c += 1\n            while n % d == 0:\n                n //= d\n        d += 1\n    if n > 1:\n        c += 1\n    return c\n",
  },
  {
    slug: "subprograme-suma-divizorilor",
    title: "Suma divizorilor unui numar",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si intoarce suma tuturor divizorilor sai (inclusiv 1 si n).",
    input_format: "O linie continand numarul natural n.",
    output_format: "Suma divizorilor lui n.",
    constraints: "1 <= n <= 10^6",
    spec: { name: "sumaDivizorilor", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => sumaDivizorilor(a.n),
    tests: [{ n: 28 }, { n: 1 }, { n: 97 }, { n: 360 }, { n: 100 }, { n: 999983 }],
    official_cpp:
      "int sumaDivizorilor(int n) {\n    int s = 0;\n    for (int i = 1; (long long)i * i <= n; i++) {\n        if (n % i == 0) {\n            s += i;\n            if (i != n / i) s += n / i;\n        }\n    }\n    return s;\n}\n",
    official_python:
      "def sumaDivizorilor(n):\n    s = 0\n    i = 1\n    while i * i <= n:\n        if n % i == 0:\n            s += i\n            if i != n // i:\n                s += n // i\n        i += 1\n    return s\n",
  },
  {
    slug: "subprograme-suma-divizorilor-proprii",
    title: "Suma divizorilor proprii ai unui numar",
    statement:
      "Implementati o functie care primeste un numar natural nenul `n` si intoarce suma divizorilor proprii ai lui n (toti divizorii, mai putin n insusi).",
    input_format: "O linie continand numarul natural n.",
    output_format: "Suma divizorilor proprii ai lui n.",
    constraints: "1 <= n <= 10^6",
    spec: { name: "sumaDivizorilorProprii", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => sumaDivizorilor(a.n) - a.n,
    tests: [{ n: 28 }, { n: 1 }, { n: 97 }, { n: 12 }, { n: 6 }, { n: 100 }],
    official_cpp:
      "int sumaDivizorilorProprii(int n) {\n    int s = 0;\n    for (int i = 1; (long long)i * i <= n; i++) {\n        if (n % i == 0) {\n            s += i;\n            if (i != n / i) s += n / i;\n        }\n    }\n    return s - n;\n}\n",
    official_python:
      "def sumaDivizorilorProprii(n):\n    s = 0\n    i = 1\n    while i * i <= n:\n        if n % i == 0:\n            s += i\n            if i != n // i:\n                s += n // i\n        i += 1\n    return s - n\n",
  },
  {
    slug: "subprograme-verifica-numar-perfect",
    title: "Verificarea unui numar perfect",
    statement:
      "Un numar natural este perfect daca este egal cu suma divizorilor sai proprii (de exemplu, 6 = 1 + 2 + 3). Implementati o functie care verifica daca `n` este numar perfect.",
    input_format: "O linie continand numarul natural n.",
    output_format: "1 daca n este numar perfect, 0 in caz contrar.",
    constraints: "1 <= n <= 10^6",
    spec: { name: "esteNumarPerfect", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "bool" } },
    solve: (a) => sumaDivizorilor(a.n) - a.n === a.n,
    tests: [{ n: 6 }, { n: 28 }, { n: 12 }, { n: 496 }, { n: 1 }, { n: 100 }],
    official_cpp:
      "bool esteNumarPerfect(int n) {\n    int s = 0;\n    for (int i = 1; (long long)i * i <= n; i++) {\n        if (n % i == 0) {\n            s += i;\n            if (i != n / i) s += n / i;\n        }\n    }\n    return s - n == n;\n}\n",
    official_python:
      "def esteNumarPerfect(n):\n    s = 0\n    i = 1\n    while i * i <= n:\n        if n % i == 0:\n            s += i\n            if i != n // i:\n                s += n // i\n        i += 1\n    return s - n == n\n",
  },
  {
    slug: "subprograme-cifra-minima",
    title: "Cea mai mica cifra a unui numar",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si intoarce cea mai mica cifra a acestuia.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Cea mai mica cifra a lui n.",
    constraints: "1 <= n <= 10^9",
    spec: { name: "cifraMinima", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => Math.min(...digits(a.n)),
    tests: [{ n: 1234 }, { n: 7 }, { n: 900001 }, { n: 555 }, { n: 87654321 }, { n: 1000 }],
    official_cpp: "int cifraMinima(int n) {\n    int m = 9;\n    while (n > 0) {\n        if (n % 10 < m) m = n % 10;\n        n /= 10;\n    }\n    return m;\n}\n",
    official_python: "def cifraMinima(n):\n    m = 9\n    while n > 0:\n        m = min(m, n % 10)\n        n //= 10\n    return m\n",
  },
  {
    slug: "subprograme-numarul-cifrelor-pare",
    title: "Numarul cifrelor pare ale unui numar",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si intoarce cate dintre cifrele sale sunt pare.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Numarul cifrelor pare ale lui n.",
    constraints: "1 <= n <= 10^9",
    spec: { name: "numarCifrePare", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => digits(a.n).filter((d) => d % 2 === 0).length,
    tests: [{ n: 1234 }, { n: 7 }, { n: 2468 }, { n: 13579 }, { n: 200000 }, { n: 87654321 }],
    official_cpp:
      "int numarCifrePare(int n) {\n    int c = 0;\n    while (n > 0) {\n        if (n % 10 % 2 == 0) c++;\n        n /= 10;\n    }\n    return c;\n}\n",
    official_python: "def numarCifrePare(n):\n    c = 0\n    while n > 0:\n        if n % 10 % 2 == 0:\n            c += 1\n        n //= 10\n    return c\n",
  },
  {
    slug: "subprograme-numarul-cifrelor-impare",
    title: "Numarul cifrelor impare ale unui numar",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si intoarce cate dintre cifrele sale sunt impare.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Numarul cifrelor impare ale lui n.",
    constraints: "1 <= n <= 10^9",
    spec: { name: "numarCifreImpare", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => digits(a.n).filter((d) => d % 2 !== 0).length,
    tests: [{ n: 1234 }, { n: 7 }, { n: 2468 }, { n: 13579 }, { n: 200000 }, { n: 87654321 }],
    official_cpp:
      "int numarCifreImpare(int n) {\n    int c = 0;\n    while (n > 0) {\n        if (n % 10 % 2 != 0) c++;\n        n /= 10;\n    }\n    return c;\n}\n",
    official_python: "def numarCifreImpare(n):\n    c = 0\n    while n > 0:\n        if n % 10 % 2 != 0:\n            c += 1\n        n //= 10\n    return c\n",
  },
  {
    slug: "subprograme-suma-cifrelor-pare",
    title: "Suma cifrelor pare ale unui numar",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si intoarce suma cifrelor sale pare.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Suma cifrelor pare ale lui n (0 daca nu are nicio cifra para).",
    constraints: "1 <= n <= 10^9",
    spec: { name: "sumaCifrelorPare", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => digits(a.n).filter((d) => d % 2 === 0).reduce((s, x) => s + x, 0),
    tests: [{ n: 1234 }, { n: 7 }, { n: 2468 }, { n: 13579 }, { n: 200000 }, { n: 87654321 }],
    official_cpp:
      "int sumaCifrelorPare(int n) {\n    int s = 0;\n    while (n > 0) {\n        if (n % 10 % 2 == 0) s += n % 10;\n        n /= 10;\n    }\n    return s;\n}\n",
    official_python: "def sumaCifrelorPare(n):\n    s = 0\n    while n > 0:\n        if n % 10 % 2 == 0:\n            s += n % 10\n        n //= 10\n    return s\n",
  },
  {
    slug: "subprograme-suma-cifrelor-impare",
    title: "Suma cifrelor impare ale unui numar",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si intoarce suma cifrelor sale impare.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Suma cifrelor impare ale lui n (0 daca nu are nicio cifra impara).",
    constraints: "1 <= n <= 10^9",
    spec: { name: "sumaCifrelorImpare", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => digits(a.n).filter((d) => d % 2 !== 0).reduce((s, x) => s + x, 0),
    tests: [{ n: 1234 }, { n: 7 }, { n: 2468 }, { n: 13579 }, { n: 200000 }, { n: 87654321 }],
    official_cpp:
      "int sumaCifrelorImpare(int n) {\n    int s = 0;\n    while (n > 0) {\n        if (n % 10 % 2 != 0) s += n % 10;\n        n /= 10;\n    }\n    return s;\n}\n",
    official_python: "def sumaCifrelorImpare(n):\n    s = 0\n    while n > 0:\n        if n % 10 % 2 != 0:\n            s += n % 10\n        n //= 10\n    return s\n",
  },
  {
    slug: "subprograme-stergerea-cifrelor-pare",
    title: "Stergerea cifrelor pare dintr-un numar",
    statement:
      "Implementati o functie care primeste un numar natural nenul `n` si intoarce numarul obtinut prin stergerea tuturor cifrelor pare din scrierea lui `n`, pastrand ordinea cifrelor ramase. Daca toate cifrele sunt sterse, functia intoarce 0.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Numarul obtinut dupa stergerea cifrelor pare.",
    constraints: "1 <= n <= 10^9",
    spec: { name: "stergeCifrelePare", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => {
      const s = String(a.n).split("").filter((ch) => Number(ch) % 2 !== 0).join("");
      return s.length ? Number(s) : 0;
    },
    tests: [{ n: 2046 }, { n: 1234 }, { n: 13579 }, { n: 111 }, { n: 900001 }, { n: 2222 }],
    official_cpp:
      'int stergeCifrelePare(int n) {\n    string s = to_string(n);\n    string r = "";\n    for (char ch : s)\n        if ((ch - \'0\') % 2 != 0) r += ch;\n    if (r.empty()) return 0;\n    return stoi(r);\n}\n',
    official_python: 'def stergeCifrelePare(n):\n    s = "".join(ch for ch in str(n) if int(ch) % 2 != 0)\n    return int(s) if s else 0\n',
  },
  {
    slug: "subprograme-stergerea-cifrelor-impare",
    title: "Stergerea cifrelor impare dintr-un numar",
    statement:
      "Implementati o functie care primeste un numar natural nenul `n` si intoarce numarul obtinut prin stergerea tuturor cifrelor impare din scrierea lui `n`, pastrand ordinea cifrelor ramase. Daca toate cifrele sunt sterse, functia intoarce 0.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Numarul obtinut dupa stergerea cifrelor impare.",
    constraints: "1 <= n <= 10^9",
    spec: { name: "stergeCifreleImpare", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => {
      const s = String(a.n).split("").filter((ch) => Number(ch) % 2 === 0).join("");
      return s.length ? Number(s) : 0;
    },
    tests: [{ n: 1234 }, { n: 13579 }, { n: 2468 }, { n: 111 }, { n: 900001 }, { n: 55 }],
    official_cpp:
      'int stergeCifreleImpare(int n) {\n    string s = to_string(n);\n    string r = "";\n    for (char ch : s)\n        if ((ch - \'0\') % 2 == 0) r += ch;\n    if (r.empty()) return 0;\n    return stoi(r);\n}\n',
    official_python: 'def stergeCifreleImpare(n):\n    s = "".join(ch for ch in str(n) if int(ch) % 2 == 0)\n    return int(s) if s else 0\n',
  },
  {
    slug: "subprograme-inlocuirea-unei-cifre-cu-alta",
    title: "Inlocuirea unei cifre cu alta intr-un numar",
    statement:
      "Implementati o functie care primeste un numar natural nenul `n` si doua cifre `c1` si `c2` si intoarce numarul obtinut prin inlocuirea, in scrierea lui `n`, a fiecarei aparitii a cifrei `c1` cu cifra `c2`.",
    input_format: "Trei linii: n, apoi c1, apoi c2.",
    output_format: "Numarul obtinut dupa inlocuire.",
    constraints: "1 <= n <= 10^9, 0 <= c1, c2 <= 9",
    spec: {
      name: "inlocuiesteCifra",
      params: [{ name: "n", type: "int" }, { name: "c1", type: "int" }, { name: "c2", type: "int" }],
      returns: { mode: "value", type: "int" },
    },
    solve: (a) => {
      const s = String(a.n).split("").map((ch) => (Number(ch) === a.c1 ? String(a.c2) : ch)).join("");
      return Number(s);
    },
    tests: [
      { n: 102, c1: 1, c2: 0 },
      { n: 3553, c1: 5, c2: 1 },
      { n: 1234, c1: 9, c2: 0 },
      { n: 1111, c1: 1, c2: 7 },
      { n: 500, c1: 0, c2: 9 },
      { n: 87654321, c1: 8, c2: 1 },
    ],
    official_cpp:
      "int inlocuiesteCifra(int n, int c1, int c2) {\n    string s = to_string(n);\n    for (char &ch : s)\n        if (ch - '0' == c1) ch = '0' + c2;\n    return stoi(s);\n}\n",
    official_python: "def inlocuiesteCifra(n, c1, c2):\n    s = \"\".join(str(c2) if int(ch) == c1 else ch for ch in str(n))\n    return int(s)\n",
  },
  {
    slug: "subprograme-numarul-aparitiilor-unei-cifre",
    title: "Numarul aparitiilor unei cifre intr-un numar",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si o cifra `c` si intoarce de cate ori apare `c` in scrierea lui `n`.",
    input_format: "Doua linii: n, apoi c.",
    output_format: "Numarul de aparitii ale cifrei c in n.",
    constraints: "1 <= n <= 10^9, 0 <= c <= 9",
    spec: {
      name: "numarAparitiiCifra",
      params: [{ name: "n", type: "int" }, { name: "c", type: "int" }],
      returns: { mode: "value", type: "int" },
    },
    solve: (a) => digits(a.n).filter((d) => d === a.c).length,
    tests: [
      { n: 1231231, c: 1 },
      { n: 1234, c: 9 },
      { n: 55555, c: 5 },
      { n: 102030, c: 0 },
      { n: 999999, c: 9 },
      { n: 87654321, c: 4 },
    ],
    official_cpp:
      "int numarAparitiiCifra(int n, int c) {\n    int cnt = 0;\n    while (n > 0) {\n        if (n % 10 == c) cnt++;\n        n /= 10;\n    }\n    return cnt;\n}\n",
    official_python: "def numarAparitiiCifra(n, c):\n    cnt = 0\n    while n > 0:\n        if n % 10 == c:\n            cnt += 1\n        n //= 10\n    return cnt\n",
  },
  {
    slug: "subprograme-verifica-patrat-perfect",
    title: "Verificarea unui patrat perfect",
    statement: "Implementati o functie care primeste un numar natural `n` si verifica daca acesta este patrat perfect (exista un numar natural k astfel incat k*k = n).",
    input_format: "O linie continand numarul natural n.",
    output_format: "1 daca n este patrat perfect, 0 in caz contrar.",
    constraints: "0 <= n <= 10^9",
    spec: { name: "estePatratPerfect", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "bool" } },
    solve: (a) => {
      const r = Math.floor(Math.sqrt(a.n));
      return [r - 1, r, r + 1].some((k) => k >= 0 && k * k === a.n);
    },
    tests: [{ n: 49 }, { n: 50 }, { n: 1 }, { n: 0 }, { n: 100 }, { n: 99 }],
    official_cpp: "bool estePatratPerfect(int n) {\n    int r = (int)sqrt((double)n);\n    for (int k = max(0, r - 1); k <= r + 1; k++)\n        if (k * k == n) return true;\n    return false;\n}\n",
    official_python: "def estePatratPerfect(n):\n    r = int(n ** 0.5)\n    return any(k * k == n for k in range(max(0, r - 1), r + 2))\n",
  },
  {
    slug: "subprograme-numarul-de-cifre",
    title: "Numarul de cifre al unui numar",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si intoarce numarul de cifre al acestuia.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Numarul de cifre al lui n.",
    constraints: "1 <= n <= 10^9",
    spec: { name: "numarDeCifre", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => digits(a.n).length,
    tests: [{ n: 1234 }, { n: 7 }, { n: 1000000000 }, { n: 10 }, { n: 999999999 }, { n: 100 }],
    official_cpp: "int numarDeCifre(int n) {\n    int c = 0;\n    while (n > 0) {\n        c++;\n        n /= 10;\n    }\n    return c;\n}\n",
    official_python: "def numarDeCifre(n):\n    c = 0\n    while n > 0:\n        c += 1\n        n //= 10\n    return c\n",
  },
  {
    slug: "subprograme-verifica-numar-palindrom",
    title: "Verificarea unui numar palindrom",
    statement:
      "Implementati o functie care primeste un numar natural nenul `n` si verifica daca acesta este palindrom (se citeste la fel de la stanga la dreapta si invers, ca numar).",
    input_format: "O linie continand numarul natural n.",
    output_format: "1 daca n este palindrom, 0 in caz contrar.",
    constraints: "1 <= n <= 10^9",
    spec: { name: "esteNumarPalindrom", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "bool" } },
    solve: (a) => {
      const s = String(a.n);
      return s === s.split("").reverse().join("");
    },
    tests: [{ n: 121 }, { n: 123 }, { n: 7 }, { n: 12321 }, { n: 120 }, { n: 1001 }],
    official_cpp:
      "bool esteNumarPalindrom(int n) {\n    string s = to_string(n);\n    string r = s;\n    reverse(r.begin(), r.end());\n    return s == r;\n}\n",
    official_python: "def esteNumarPalindrom(n):\n    s = str(n)\n    return s == s[::-1]\n",
  },
  {
    slug: "subprograme-verifica-numar-armstrong",
    title: "Verificarea unui numar Armstrong",
    statement:
      "Un numar natural cu k cifre este numar Armstrong (narcisist) daca este egal cu suma cifrelor sale, fiecare ridicata la puterea k (de exemplu, 153 = 1^3 + 5^3 + 3^3). Implementati o functie care verifica daca `n` este numar Armstrong.",
    input_format: "O linie continand numarul natural n.",
    output_format: "1 daca n este numar Armstrong, 0 in caz contrar.",
    constraints: "1 <= n <= 999999",
    spec: { name: "esteNumarArmstrong", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "bool" } },
    solve: (a) => {
      const s = String(a.n);
      const k = s.length;
      const suma = s.split("").reduce((acc, ch) => acc + Number(ch) ** k, 0);
      return suma === a.n;
    },
    tests: [{ n: 153 }, { n: 1634 }, { n: 548834 }, { n: 100 }, { n: 9474 }, { n: 371 }],
    official_cpp:
      "bool esteNumarArmstrong(int n) {\n    string s = to_string(n);\n    int k = (int)s.size();\n    long long suma = 0;\n    for (char ch : s) {\n        long long p = 1;\n        for (int i = 0; i < k; i++) p *= (ch - '0');\n        suma += p;\n    }\n    return suma == n;\n}\n",
    official_python: "def esteNumarArmstrong(n):\n    s = str(n)\n    k = len(s)\n    return sum(int(ch) ** k for ch in s) == n\n",
  },
  {
    slug: "subprograme-cel-mai-mare-divizor-propriu",
    title: "Cel mai mare divizor propriu al unui numar",
    statement:
      "Implementati o functie care primeste un numar natural `n` (n >= 2) si intoarce cel mai mare divizor propriu al lui n (cel mai mare divizor diferit de n).",
    input_format: "O linie continand numarul natural n.",
    output_format: "Cel mai mare divizor propriu al lui n.",
    constraints: "2 <= n <= 10^6",
    spec: { name: "celMaiMareDivizorPropriu", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => a.n / celMaiMicFactorPrim(a.n),
    tests: [{ n: 360 }, { n: 97 }, { n: 2 }, { n: 100 }, { n: 999983 }, { n: 12 }],
    official_cpp:
      "int celMaiMareDivizorPropriu(int n) {\n    for (int d = 2; (long long)d * d <= n; d++)\n        if (n % d == 0) return n / d;\n    return 1;\n}\n",
    official_python: "def celMaiMareDivizorPropriu(n):\n    d = 2\n    while d * d <= n:\n        if n % d == 0:\n            return n // d\n        d += 1\n    return 1\n",
  },
  {
    slug: "subprograme-cel-mai-mic-factor-prim",
    title: "Cel mai mic factor prim al unui numar",
    statement: "Implementati o functie care primeste un numar natural `n` (n >= 2) si intoarce cel mai mic factor prim al lui n.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Cel mai mic factor prim al lui n.",
    constraints: "2 <= n <= 10^6",
    spec: { name: "celMaiMicFactorPrim", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => celMaiMicFactorPrim(a.n),
    tests: [{ n: 360 }, { n: 97 }, { n: 2 }, { n: 999983 }, { n: 15 }, { n: 1000000 }],
    official_cpp: "int celMaiMicFactorPrim(int n) {\n    for (int d = 2; (long long)d * d <= n; d++)\n        if (n % d == 0) return d;\n    return n;\n}\n",
    official_python: "def celMaiMicFactorPrim(n):\n    d = 2\n    while d * d <= n:\n        if n % d == 0:\n            return d\n        d += 1\n    return n\n",
  },
  {
    slug: "subprograme-cel-mai-mare-factor-prim",
    title: "Cel mai mare factor prim al unui numar",
    statement: "Implementati o functie care primeste un numar natural `n` (n >= 2) si intoarce cel mai mare factor prim al lui n.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Cel mai mare factor prim al lui n.",
    constraints: "2 <= n <= 10^6",
    spec: { name: "celMaiMareFactorPrim", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => celMaiMareFactorPrim(a.n),
    tests: [{ n: 360 }, { n: 97 }, { n: 2 }, { n: 999983 }, { n: 13195 }, { n: 1000000 }],
    official_cpp:
      "int celMaiMareFactorPrim(int n) {\n    int best = 1;\n    for (int d = 2; (long long)d * d <= n; d++) {\n        if (n % d == 0) {\n            best = d;\n            while (n % d == 0) n /= d;\n        }\n    }\n    if (n > 1) best = n;\n    return best;\n}\n",
    official_python:
      "def celMaiMareFactorPrim(n):\n    best = 1\n    d = 2\n    while d * d <= n:\n        if n % d == 0:\n            best = d\n            while n % d == 0:\n                n //= d\n        d += 1\n    if n > 1:\n        best = n\n    return best\n",
  },
  {
    slug: "subprograme-produsul-cifrelor",
    title: "Produsul cifrelor unui numar",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si intoarce produsul cifrelor sale.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Produsul cifrelor lui n.",
    constraints: "1 <= n <= 10^9",
    spec: { name: "produsulCifrelor", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => digits(a.n).reduce((p, x) => p * x, 1),
    tests: [{ n: 234 }, { n: 105 }, { n: 7 }, { n: 1111 }, { n: 999 }, { n: 123456 }],
    official_cpp: "int produsulCifrelor(int n) {\n    int p = 1;\n    while (n > 0) {\n        p *= n % 10;\n        n /= 10;\n    }\n    return p;\n}\n",
    official_python: "def produsulCifrelor(n):\n    p = 1\n    while n > 0:\n        p *= n % 10\n        n //= 10\n    return p\n",
  },
  {
    slug: "subprograme-suma-patratelor-cifrelor",
    title: "Suma patratelor cifrelor unui numar",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si intoarce suma patratelor cifrelor sale.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Suma patratelor cifrelor lui n.",
    constraints: "1 <= n <= 10^9",
    spec: { name: "sumaPatratelorCifrelor", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => digits(a.n).reduce((s, x) => s + x * x, 0),
    tests: [{ n: 123 }, { n: 7 }, { n: 999 }, { n: 1111 }, { n: 100 }, { n: 87654321 }],
    official_cpp: "int sumaPatratelorCifrelor(int n) {\n    int s = 0;\n    while (n > 0) {\n        s += (n % 10) * (n % 10);\n        n /= 10;\n    }\n    return s;\n}\n",
    official_python: "def sumaPatratelorCifrelor(n):\n    s = 0\n    while n > 0:\n        s += (n % 10) ** 2\n        n //= 10\n    return s\n",
  },
  {
    slug: "subprograme-numarul-cifrelor-prime",
    title: "Numarul cifrelor prime ale unui numar",
    statement:
      "Implementati o functie care primeste un numar natural nenul `n` si intoarce cate dintre cifrele sale sunt numere prime (adica sunt egale cu 2, 3, 5 sau 7).",
    input_format: "O linie continand numarul natural n.",
    output_format: "Numarul cifrelor prime ale lui n.",
    constraints: "1 <= n <= 10^9",
    spec: { name: "numarCifrePrime", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => digits(a.n).filter((d) => [2, 3, 5, 7].includes(d)).length,
    tests: [{ n: 235071 }, { n: 1111 }, { n: 2357 }, { n: 490 }, { n: 7 }, { n: 87654321 }],
    official_cpp:
      "int numarCifrePrime(int n) {\n    int c = 0;\n    while (n > 0) {\n        int d = n % 10;\n        if (d == 2 || d == 3 || d == 5 || d == 7) c++;\n        n /= 10;\n    }\n    return c;\n}\n",
    official_python: "def numarCifrePrime(n):\n    c = 0\n    while n > 0:\n        if n % 10 in (2, 3, 5, 7):\n            c += 1\n        n //= 10\n    return c\n",
  },
  {
    slug: "subprograme-cel-mai-mare-dintre-trei-numere",
    title: "Cel mai mare dintre trei numere",
    statement: "Implementati o functie care primeste trei numere intregi `a`, `b`, `c` si intoarce valoarea maxima dintre ele.",
    input_format: "Trei linii: a, b, apoi c.",
    output_format: "Maximul dintre a, b si c.",
    constraints: "-10^9 <= a, b, c <= 10^9",
    spec: {
      name: "celMaiMareDintreTrei",
      params: [{ name: "a", type: "int" }, { name: "b", type: "int" }, { name: "c", type: "int" }],
      returns: { mode: "value", type: "int" },
    },
    solve: (args) => Math.max(args.a, args.b, args.c),
    tests: [
      { a: 3, b: 8, c: 5 },
      { a: -1, b: -2, c: -3 },
      { a: 7, b: 7, c: 7 },
      { a: 0, b: -5, c: 5 },
      { a: 1000000000, b: -1000000000, c: 0 },
      { a: 9, b: 2, c: 9 },
    ],
    official_cpp: "int celMaiMareDintreTrei(int a, int b, int c) {\n    int m = a;\n    if (b > m) m = b;\n    if (c > m) m = c;\n    return m;\n}\n",
    official_python: "def celMaiMareDintreTrei(a, b, c):\n    return max(a, b, c)\n",
  },
  {
    slug: "subprograme-cel-mai-mic-dintre-trei-numere",
    title: "Cel mai mic dintre trei numere",
    statement: "Implementati o functie care primeste trei numere intregi `a`, `b`, `c` si intoarce valoarea minima dintre ele.",
    input_format: "Trei linii: a, b, apoi c.",
    output_format: "Minimul dintre a, b si c.",
    constraints: "-10^9 <= a, b, c <= 10^9",
    spec: {
      name: "celMaiMicDintreTrei",
      params: [{ name: "a", type: "int" }, { name: "b", type: "int" }, { name: "c", type: "int" }],
      returns: { mode: "value", type: "int" },
    },
    solve: (args) => Math.min(args.a, args.b, args.c),
    tests: [
      { a: 3, b: 8, c: 5 },
      { a: -1, b: -2, c: -3 },
      { a: 7, b: 7, c: 7 },
      { a: 0, b: -5, c: 5 },
      { a: 1000000000, b: -1000000000, c: 0 },
      { a: 9, b: 2, c: 9 },
    ],
    official_cpp: "int celMaiMicDintreTrei(int a, int b, int c) {\n    int m = a;\n    if (b < m) m = b;\n    if (c < m) m = c;\n    return m;\n}\n",
    official_python: "def celMaiMicDintreTrei(a, b, c):\n    return min(a, b, c)\n",
  },
  {
    slug: "subprograme-suma-primelor-n-numere",
    title: "Suma primelor n numere naturale",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si intoarce suma 1 + 2 + ... + n.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Suma primelor n numere naturale.",
    constraints: "1 <= n <= 100000",
    spec: { name: "sumaPrimelorNNumere", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => (a.n * (a.n + 1)) / 2,
    tests: [{ n: 10 }, { n: 1 }, { n: 100 }, { n: 999 }, { n: 12345 }, { n: 100000 }],
    official_cpp: "int sumaPrimelorNNumere(int n) {\n    int s = 0;\n    for (int i = 1; i <= n; i++) s += i;\n    return s;\n}\n",
    official_python: "def sumaPrimelorNNumere(n):\n    s = 0\n    for i in range(1, n + 1):\n        s += i\n    return s\n",
  },
  {
    slug: "subprograme-suma-patratelor-primelor-n-numere",
    title: "Suma patratelor primelor n numere naturale",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si intoarce suma 1^2 + 2^2 + ... + n^2.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Suma patratelor primelor n numere naturale.",
    constraints: "1 <= n <= 1000",
    spec: { name: "sumaPatratelorPrimelorNNumere", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => {
      let s = 0;
      for (let i = 1; i <= a.n; i++) s += i * i;
      return s;
    },
    tests: [{ n: 10 }, { n: 1 }, { n: 5 }, { n: 100 }, { n: 999 }, { n: 50 }],
    official_cpp: "int sumaPatratelorPrimelorNNumere(int n) {\n    int s = 0;\n    for (int i = 1; i <= n; i++) s += i * i;\n    return s;\n}\n",
    official_python: "def sumaPatratelorPrimelorNNumere(n):\n    s = 0\n    for i in range(1, n + 1):\n        s += i * i\n    return s\n",
  },
  {
    slug: "subprograme-al-n-lea-termen-fibonacci",
    title: "Al n-lea termen din sirul lui Fibonacci",
    statement:
      "Sirul lui Fibonacci este definit prin F(1) = 1, F(2) = 1 si F(k) = F(k-1) + F(k-2) pentru k >= 3. Implementati o functie care primeste un numar natural nenul `n` si intoarce F(n).",
    input_format: "O linie continand numarul natural n.",
    output_format: "Al n-lea termen din sirul lui Fibonacci.",
    constraints: "1 <= n <= 40",
    spec: { name: "termenFibonacci", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => fibUpTo(a.n)[a.n],
    tests: [{ n: 1 }, { n: 2 }, { n: 10 }, { n: 20 }, { n: 40 }, { n: 30 }],
    official_cpp: "int termenFibonacci(int n) {\n    int a = 1, b = 1;\n    for (int i = 3; i <= n; i++) {\n        int c = a + b;\n        a = b;\n        b = c;\n    }\n    return n == 1 ? 1 : b;\n}\n",
    official_python: "def termenFibonacci(n):\n    a, b = 1, 1\n    for _ in range(3, n + 1):\n        a, b = b, a + b\n    return 1 if n == 1 else b\n",
  },
  {
    slug: "subprograme-suma-primilor-n-termeni-fibonacci",
    title: "Suma primilor n termeni din sirul lui Fibonacci",
    statement:
      "Implementati o functie care primeste un numar natural nenul `n` si intoarce suma primilor n termeni din sirul lui Fibonacci (F(1) + F(2) + ... + F(n), unde F(1) = F(2) = 1).",
    input_format: "O linie continand numarul natural n.",
    output_format: "Suma primilor n termeni Fibonacci.",
    constraints: "1 <= n <= 40",
    spec: { name: "sumaPrimilorNTermeniFibonacci", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => {
      const f = fibUpTo(a.n);
      let s = 0;
      for (let i = 1; i <= a.n; i++) s += f[i];
      return s;
    },
    tests: [{ n: 1 }, { n: 2 }, { n: 10 }, { n: 20 }, { n: 40 }, { n: 30 }],
    official_cpp:
      "int sumaPrimilorNTermeniFibonacci(int n) {\n    int a = 1, b = 1, s = (n >= 1 ? 1 : 0) + (n >= 2 ? 1 : 0);\n    for (int i = 3; i <= n; i++) {\n        int c = a + b;\n        a = b;\n        b = c;\n        s += b;\n    }\n    return s;\n}\n",
    official_python:
      "def sumaPrimilorNTermeniFibonacci(n):\n    a, b = 1, 1\n    s = (1 if n >= 1 else 0) + (1 if n >= 2 else 0)\n    for _ in range(3, n + 1):\n        a, b = b, a + b\n        s += b\n    return s\n",
  },
  {
    slug: "subprograme-verifica-numere-prime-gemene",
    title: "Verificarea numerelor prime gemene",
    statement:
      "Doua numere prime `p` si `p + 2` se numesc numere prime gemene. Implementati o functie care primeste un numar natural `n` si verifica daca `n` si `n + 2` sunt ambele numere prime.",
    input_format: "O linie continand numarul natural n.",
    output_format: "1 daca n si n+2 sunt ambele prime, 0 in caz contrar.",
    constraints: "0 <= n <= 10^6",
    spec: { name: "estePrimGeaman", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "bool" } },
    solve: (a) => estePrim(a.n) && estePrim(a.n + 2),
    tests: [{ n: 3 }, { n: 7 }, { n: 11 }, { n: 9 }, { n: 17 }, { n: 100 }],
    official_cpp: "bool estePrim(int n);\n\nbool estePrimGeaman(int n) {\n    return estePrim(n) && estePrim(n + 2);\n}\n\nbool estePrim(int n) {\n    if (n < 2) return false;\n    for (int i = 2; (long long)i * i <= n; i++)\n        if (n % i == 0) return false;\n    return true;\n}\n",
    official_python:
      "def estePrim(n):\n    if n < 2:\n        return False\n    i = 2\n    while i * i <= n:\n        if n % i == 0:\n            return False\n        i += 1\n    return True\n\n\ndef estePrimGeaman(n):\n    return estePrim(n) and estePrim(n + 2)\n",
  },
  {
    slug: "subprograme-numarul-divizorilor-pari",
    title: "Numarul divizorilor pari ai unui numar",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si intoarce cati dintre divizorii sai sunt pari.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Numarul divizorilor pari ai lui n.",
    constraints: "1 <= n <= 10^6",
    spec: { name: "numarDivizoriPari", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => divizoriList(a.n).filter((d) => d % 2 === 0).length,
    tests: [{ n: 360 }, { n: 28 }, { n: 97 }, { n: 1 }, { n: 100 }, { n: 17 }],
    official_cpp:
      "int numarDivizoriPari(int n) {\n    int c = 0;\n    for (int i = 1; (long long)i * i <= n; i++) {\n        if (n % i == 0) {\n            if (i % 2 == 0) c++;\n            int j = n / i;\n            if (j != i && j % 2 == 0) c++;\n        }\n    }\n    return c;\n}\n",
    official_python:
      "def numarDivizoriPari(n):\n    c = 0\n    i = 1\n    while i * i <= n:\n        if n % i == 0:\n            if i % 2 == 0:\n                c += 1\n            j = n // i\n            if j != i and j % 2 == 0:\n                c += 1\n        i += 1\n    return c\n",
  },
  {
    slug: "subprograme-numarul-divizorilor-impari",
    title: "Numarul divizorilor impari ai unui numar",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si intoarce cati dintre divizorii sai sunt impari.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Numarul divizorilor impari ai lui n.",
    constraints: "1 <= n <= 10^6",
    spec: { name: "numarDivizoriImpari", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => divizoriList(a.n).filter((d) => d % 2 !== 0).length,
    tests: [{ n: 360 }, { n: 28 }, { n: 97 }, { n: 1 }, { n: 100 }, { n: 17 }],
    official_cpp:
      "int numarDivizoriImpari(int n) {\n    int c = 0;\n    for (int i = 1; (long long)i * i <= n; i++) {\n        if (n % i == 0) {\n            if (i % 2 != 0) c++;\n            int j = n / i;\n            if (j != i && j % 2 != 0) c++;\n        }\n    }\n    return c;\n}\n",
    official_python:
      "def numarDivizoriImpari(n):\n    c = 0\n    i = 1\n    while i * i <= n:\n        if n % i == 0:\n            if i % 2 != 0:\n                c += 1\n            j = n // i\n            if j != i and j % 2 != 0:\n                c += 1\n        i += 1\n    return c\n",
  },
  {
    slug: "subprograme-suma-divizorilor-pari",
    title: "Suma divizorilor pari ai unui numar",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si intoarce suma divizorilor sai pari.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Suma divizorilor pari ai lui n (0 daca nu are niciun divizor par).",
    constraints: "1 <= n <= 10^6",
    spec: { name: "sumaDivizoriPari", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => divizoriList(a.n).filter((d) => d % 2 === 0).reduce((s, x) => s + x, 0),
    tests: [{ n: 360 }, { n: 28 }, { n: 97 }, { n: 1 }, { n: 100 }, { n: 17 }],
    official_cpp:
      "int sumaDivizoriPari(int n) {\n    int s = 0;\n    for (int i = 1; (long long)i * i <= n; i++) {\n        if (n % i == 0) {\n            if (i % 2 == 0) s += i;\n            int j = n / i;\n            if (j != i && j % 2 == 0) s += j;\n        }\n    }\n    return s;\n}\n",
    official_python:
      "def sumaDivizoriPari(n):\n    s = 0\n    i = 1\n    while i * i <= n:\n        if n % i == 0:\n            if i % 2 == 0:\n                s += i\n            j = n // i\n            if j != i and j % 2 == 0:\n                s += j\n        i += 1\n    return s\n",
  },
  {
    slug: "subprograme-suma-divizorilor-impari",
    title: "Suma divizorilor impari ai unui numar",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si intoarce suma divizorilor sai impari.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Suma divizorilor impari ai lui n.",
    constraints: "1 <= n <= 10^6",
    spec: { name: "sumaDivizoriImpari", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => divizoriList(a.n).filter((d) => d % 2 !== 0).reduce((s, x) => s + x, 0),
    tests: [{ n: 360 }, { n: 28 }, { n: 97 }, { n: 1 }, { n: 100 }, { n: 17 }],
    official_cpp:
      "int sumaDivizoriImpari(int n) {\n    int s = 0;\n    for (int i = 1; (long long)i * i <= n; i++) {\n        if (n % i == 0) {\n            if (i % 2 != 0) s += i;\n            int j = n / i;\n            if (j != i && j % 2 != 0) s += j;\n        }\n    }\n    return s;\n}\n",
    official_python:
      "def sumaDivizoriImpari(n):\n    s = 0\n    i = 1\n    while i * i <= n:\n        if n % i == 0:\n            if i % 2 != 0:\n                s += i\n            j = n // i\n            if j != i and j % 2 != 0:\n                s += j\n        i += 1\n    return s\n",
  },
  {
    slug: "subprograme-verifica-multiplu",
    title: "Verificarea faptului ca un numar este multiplu de altul",
    statement: "Implementati o functie care primeste doua numere intregi `a` si `b` (b nenul) si verifica daca `a` este multiplu de `b`.",
    input_format: "Doua linii: a, apoi b.",
    output_format: "1 daca a este multiplu de b, 0 in caz contrar.",
    constraints: "-10^9 <= a <= 10^9, 1 <= b <= 10^9",
    spec: {
      name: "esteMultiplu",
      params: [{ name: "a", type: "int" }, { name: "b", type: "int" }],
      returns: { mode: "value", type: "bool" },
    },
    solve: (args) => args.a % args.b === 0,
    tests: [
      { a: 12, b: 3 },
      { a: 13, b: 3 },
      { a: 0, b: 5 },
      { a: -12, b: 4 },
      { a: 7, b: 7 },
      { a: 999999999, b: 3 },
    ],
    official_cpp: "bool esteMultiplu(int a, int b) {\n    return a % b == 0;\n}\n",
    official_python: "def esteMultiplu(a, b):\n    return a % b == 0\n",
  },
  {
    slug: "subprograme-diferenta-cifrelor-extreme",
    title: "Diferenta dintre prima si ultima cifra a unui numar",
    statement:
      "Implementati o functie care primeste un numar natural nenul `n` si intoarce diferenta (in valoare absoluta) dintre prima si ultima cifra a lui n.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Diferenta absoluta dintre prima si ultima cifra a lui n.",
    constraints: "1 <= n <= 10^9",
    spec: { name: "diferentaCifrelorExtreme", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => {
      const d = digits(a.n);
      return Math.abs(d[0] - d[d.length - 1]);
    },
    tests: [{ n: 1234 }, { n: 7 }, { n: 900001 }, { n: 500 }, { n: 111111 }, { n: 87654321 }],
    official_cpp:
      "int diferentaCifrelorExtreme(int n) {\n    int ultima = n % 10;\n    int m = n;\n    while (m >= 10) m /= 10;\n    return abs(m - ultima);\n}\n",
    official_python: "def diferentaCifrelorExtreme(n):\n    ultima = n % 10\n    m = n\n    while m >= 10:\n        m //= 10\n    return abs(m - ultima)\n",
  },
  {
    slug: "subprograme-stergerea-ultimei-cifre",
    title: "Stergerea ultimei cifre a unui numar",
    statement: "Implementati o functie care primeste un numar natural `n` si intoarce numarul obtinut prin stergerea ultimei sale cifre.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Numarul obtinut dupa stergerea ultimei cifre (0 daca n avea o singura cifra).",
    constraints: "0 <= n <= 10^9",
    spec: { name: "stergeUltimaCifra", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => Math.floor(a.n / 10),
    tests: [{ n: 1234 }, { n: 7 }, { n: 900001 }, { n: 10 }, { n: 0 }, { n: 87654321 }],
    official_cpp: "int stergeUltimaCifra(int n) {\n    return n / 10;\n}\n",
    official_python: "def stergeUltimaCifra(n):\n    return n // 10\n",
  },
  {
    slug: "subprograme-stergerea-primei-cifre",
    title: "Stergerea primei cifre a unui numar",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si intoarce numarul obtinut prin stergerea primei sale cifre.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Numarul obtinut dupa stergerea primei cifre (0 daca n avea o singura cifra).",
    constraints: "1 <= n <= 10^9",
    spec: { name: "stergePrimaCifra", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => {
      const s = String(a.n).slice(1);
      return s.length ? Number(s) : 0;
    },
    tests: [{ n: 1234 }, { n: 7 }, { n: 900001 }, { n: 10 }, { n: 55 }, { n: 87654321 }],
    official_cpp:
      "int stergePrimaCifra(int n) {\n    string s = to_string(n);\n    if (s.size() == 1) return 0;\n    return stoi(s.substr(1));\n}\n",
    official_python: "def stergePrimaCifra(n):\n    s = str(n)[1:]\n    return int(s) if s else 0\n",
  },
  {
    slug: "subprograme-adaugarea-unei-cifre-la-final",
    title: "Adaugarea unei cifre la finalul unui numar",
    statement: "Implementati o functie care primeste un numar natural `n` si o cifra `c` si intoarce numarul obtinut prin adaugarea cifrei `c` la finalul lui `n`.",
    input_format: "Doua linii: n, apoi c.",
    output_format: "Numarul obtinut dupa adaugarea cifrei c la final.",
    constraints: "0 <= n <= 10^8, 0 <= c <= 9",
    spec: {
      name: "adaugaCifraLaFinal",
      params: [{ name: "n", type: "int" }, { name: "c", type: "int" }],
      returns: { mode: "value", type: "int" },
    },
    solve: (args) => args.n * 10 + args.c,
    tests: [
      { n: 123, c: 4 },
      { n: 0, c: 5 },
      { n: 7, c: 0 },
      { n: 100, c: 9 },
      { n: 999999, c: 1 },
      { n: 8765432, c: 1 },
    ],
    official_cpp: "int adaugaCifraLaFinal(int n, int c) {\n    return n * 10 + c;\n}\n",
    official_python: "def adaugaCifraLaFinal(n, c):\n    return n * 10 + c\n",
  },
  {
    slug: "subprograme-suma-cifrelor-de-pe-pozitii-pare",
    title: "Suma cifrelor de pe pozitiile pare ale unui numar",
    statement:
      "Pozitia unei cifre se numara de la dreapta la stanga, incepand cu pozitia 1 pentru cifra unitatilor. Implementati o functie care primeste un numar natural nenul `n` si intoarce suma cifrelor aflate pe pozitii pare (2, 4, 6, ...).",
    input_format: "O linie continand numarul natural n.",
    output_format: "Suma cifrelor de pe pozitii pare (0 daca n are o singura cifra).",
    constraints: "1 <= n <= 10^9",
    spec: { name: "sumaCifrelorDePePozitiiPare", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => {
      const s = String(a.n).split("").reverse();
      let sum = 0;
      for (let i = 0; i < s.length; i++) if ((i + 1) % 2 === 0) sum += Number(s[i]);
      return sum;
    },
    tests: [{ n: 1234 }, { n: 7 }, { n: 987654321 }, { n: 100 }, { n: 55 }, { n: 918273 }],
    official_cpp:
      "int sumaCifrelorDePePozitiiPare(int n) {\n    int poz = 1, s = 0;\n    while (n > 0) {\n        if (poz % 2 == 0) s += n % 10;\n        n /= 10;\n        poz++;\n    }\n    return s;\n}\n",
    official_python:
      "def sumaCifrelorDePePozitiiPare(n):\n    poz = 1\n    s = 0\n    while n > 0:\n        if poz % 2 == 0:\n            s += n % 10\n        n //= 10\n        poz += 1\n    return s\n",
  },
  {
    slug: "subprograme-suma-cifrelor-de-pe-pozitii-impare",
    title: "Suma cifrelor de pe pozitiile impare ale unui numar",
    statement:
      "Pozitia unei cifre se numara de la dreapta la stanga, incepand cu pozitia 1 pentru cifra unitatilor. Implementati o functie care primeste un numar natural nenul `n` si intoarce suma cifrelor aflate pe pozitii impare (1, 3, 5, ...).",
    input_format: "O linie continand numarul natural n.",
    output_format: "Suma cifrelor de pe pozitii impare.",
    constraints: "1 <= n <= 10^9",
    spec: { name: "sumaCifrelorDePePozitiiImpare", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => {
      const s = String(a.n).split("").reverse();
      let sum = 0;
      for (let i = 0; i < s.length; i++) if ((i + 1) % 2 !== 0) sum += Number(s[i]);
      return sum;
    },
    tests: [{ n: 1234 }, { n: 7 }, { n: 987654321 }, { n: 100 }, { n: 55 }, { n: 918273 }],
    official_cpp:
      "int sumaCifrelorDePePozitiiImpare(int n) {\n    int poz = 1, s = 0;\n    while (n > 0) {\n        if (poz % 2 != 0) s += n % 10;\n        n /= 10;\n        poz++;\n    }\n    return s;\n}\n",
    official_python:
      "def sumaCifrelorDePePozitiiImpare(n):\n    poz = 1\n    s = 0\n    while n > 0:\n        if poz % 2 != 0:\n            s += n % 10\n        n //= 10\n        poz += 1\n    return s\n",
  },
  {
    slug: "subprograme-verifica-cifre-crescatoare",
    title: "Verificarea unui numar cu cifre in ordine crescatoare",
    statement:
      "Implementati o functie care primeste un numar natural nenul `n` si verifica daca cifrele sale, citite de la stanga la dreapta, sunt in ordine strict crescatoare.",
    input_format: "O linie continand numarul natural n.",
    output_format: "1 daca cifrele lui n sunt in ordine strict crescatoare, 0 in caz contrar.",
    constraints: "1 <= n <= 10^9",
    spec: { name: "verificaCifreCrescatoare", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "bool" } },
    solve: (a) => {
      const d = digits(a.n);
      for (let i = 0; i + 1 < d.length; i++) if (!(d[i] < d[i + 1])) return false;
      return true;
    },
    tests: [{ n: 1235 }, { n: 1223 }, { n: 7 }, { n: 123456789 }, { n: 4321 }, { n: 19 }],
    official_cpp:
      "bool verificaCifreCrescatoare(int n) {\n    string s = to_string(n);\n    for (size_t i = 0; i + 1 < s.size(); i++)\n        if (!(s[i] < s[i + 1])) return false;\n    return true;\n}\n",
    official_python: "def verificaCifreCrescatoare(n):\n    s = str(n)\n    return all(s[i] < s[i + 1] for i in range(len(s) - 1))\n",
  },
  {
    slug: "subprograme-verifica-cifre-descrescatoare",
    title: "Verificarea unui numar cu cifre in ordine descrescatoare",
    statement:
      "Implementati o functie care primeste un numar natural nenul `n` si verifica daca cifrele sale, citite de la stanga la dreapta, sunt in ordine strict descrescatoare.",
    input_format: "O linie continand numarul natural n.",
    output_format: "1 daca cifrele lui n sunt in ordine strict descrescatoare, 0 in caz contrar.",
    constraints: "1 <= n <= 10^9",
    spec: { name: "verificaCifreDescrescatoare", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "bool" } },
    solve: (a) => {
      const d = digits(a.n);
      for (let i = 0; i + 1 < d.length; i++) if (!(d[i] > d[i + 1])) return false;
      return true;
    },
    tests: [{ n: 9721 }, { n: 9722 }, { n: 7 }, { n: 987654321 }, { n: 1234 }, { n: 963 }],
    official_cpp:
      "bool verificaCifreDescrescatoare(int n) {\n    string s = to_string(n);\n    for (size_t i = 0; i + 1 < s.size(); i++)\n        if (!(s[i] > s[i + 1])) return false;\n    return true;\n}\n",
    official_python: "def verificaCifreDescrescatoare(n):\n    s = str(n)\n    return all(s[i] > s[i + 1] for i in range(len(s) - 1))\n",
  },
];

async function upsertProblem(client, p) {
  const artifacts = generateArtifacts(p.spec);
  const fullStatement = `${p.statement}\n\n${buildSignatureBlock(p.spec)}`;
  const existing = await client.query("SELECT id FROM problems WHERE slug = $1", [p.slug]);
  const columns = {
    title: p.title,
    slug: p.slug,
    statement: fullStatement,
    official_solution: p.official_cpp,
    official_solution_cpp: p.official_cpp,
    official_solution_python: p.official_python,
    input_format: p.input_format,
    output_format: p.output_format,
    constraints: p.constraints,
    difficulty: p.difficulty || BASE_META.difficulty,
    time_limit_ms: BASE_META.time_limit_ms,
    memory_limit_mb: BASE_META.memory_limit_mb,
    input_source: BASE_META.input_source,
    output_target: BASE_META.output_target,
    curriculum_level: BASE_META.curriculum_level,
    curriculum_chapter_id: BASE_META.curriculum_chapter_id,
    curriculum_subcategory_id: BASE_META.curriculum_subcategory_id,
    solution_mode: BASE_META.solution_mode,
    checker_mode: BASE_META.checker_mode,
    source: BASE_META.source,
    function_signature: JSON.stringify(p.spec),
    function_template_cpp: artifacts.templates.cpp,
    function_template_c: artifacts.templates.c,
    function_template_pascal: artifacts.templates.pascal,
    function_template_python: artifacts.templates.python,
    function_stub_cpp: artifacts.stubs.cpp,
    function_stub_c: artifacts.stubs.c,
    function_stub_pascal: artifacts.stubs.pascal,
    function_stub_python: artifacts.stubs.python,
    is_published: true,
  };

  const jsonbColumns = new Set(["function_signature"]);
  const placeholderFor = (key, idx) => (jsonbColumns.has(key) ? `$${idx}::jsonb` : `$${idx}`);

  let problemId;
  if (existing.rows.length > 0) {
    problemId = existing.rows[0].id;
    const keys = Object.keys(columns);
    const setClause = keys.map((k, i) => `${k} = ${placeholderFor(k, i + 2)}`).join(", ");
    await client.query(`UPDATE problems SET ${setClause}, updated_at = NOW() WHERE id = $1`, [
      problemId,
      ...keys.map((k) => columns[k]),
    ]);
    await client.query("DELETE FROM test_cases WHERE problem_id = $1", [problemId]);
  } else {
    const keys = Object.keys(columns);
    const placeholders = keys.map((k, i) => placeholderFor(k, i + 1)).join(", ");
    const inserted = await client.query(
      `INSERT INTO problems (${keys.join(", ")}) VALUES (${placeholders}) RETURNING id`,
      keys.map((k) => columns[k]),
    );
    problemId = inserted.rows[0].id;
  }

  for (let i = 0; i < p.tests.length; i++) {
    const args = p.tests[i];
    const input = buildInputText(p.spec, args);
    const result = p.solve(args);
    const expectedOutput = buildOutputText(p.spec, result);
    await client.query(
      `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [problemId, input, expectedOutput, i < 2, 10, i + 1],
    );
  }

  console.log(`OK  ${p.slug}  (${p.tests.length} teste)`);
}

async function main() {
  const client = await pool.connect();
  try {
    for (const p of problems) {
      await upsertProblem(client, p);
    }
    console.log(`\nGata: ${problems.length} probleme noi de subprograme "returneaza valori" inserate/actualizate.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
