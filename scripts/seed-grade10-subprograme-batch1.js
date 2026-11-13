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
  solution_mode: "function",
  checker_mode: "exact",
  source: "Sursa interna",
};

function digitSum(n) {
  let s = 0;
  n = Math.abs(n);
  while (n > 0) {
    s += n % 10;
    n = Math.floor(n / 10);
  }
  return s;
}

function cmmdc(a, b) {
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function estePrim(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

function numarDivizori(n) {
  let c = 0;
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) {
      c += 1;
      if (i !== n / i) c += 1;
    }
  }
  return c;
}

function reversed(n) {
  let r = 0;
  while (n > 0) {
    r = r * 10 + (n % 10);
    n = Math.floor(n / 10);
  }
  return r;
}

function cifraMaxima(n) {
  let m = 0;
  n = Math.abs(n);
  if (n === 0) return 0;
  while (n > 0) {
    m = Math.max(m, n % 10);
    n = Math.floor(n / 10);
  }
  return m;
}

const problems = [
  // ---------- returneaza-valori ----------
  {
    slug: "subprograme-suma-cifrelor",
    title: "Suma cifrelor unui numar",
    statement:
      "Implementati o functie care primeste un numar natural `n` si intoarce suma cifrelor sale.\n\nImplementati doar functia `sumaCifrelor` — restul programului (citirea lui `n` si afisarea rezultatului) este deja pregatit de platforma.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Suma cifrelor lui n.",
    constraints: "0 <= n <= 10^9",
    curriculum_subcategory_id: "returneaza-valori",
    spec: { name: "sumaCifrelor", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => digitSum(a.n),
    tests: [{ n: 1234 }, { n: 0 }, { n: 7 }, { n: 900000009 }, { n: 111111111 }, { n: 500 }],
    official_cpp: "int sumaCifrelor(int n) {\n    int s = 0;\n    while (n > 0) {\n        s += n % 10;\n        n /= 10;\n    }\n    return s;\n}\n",
    official_python: "def sumaCifrelor(n):\n    s = 0\n    while n > 0:\n        s += n % 10\n        n //= 10\n    return s\n",
  },
  {
    slug: "subprograme-numarul-de-divizori",
    title: "Numarul de divizori ai unui numar",
    statement:
      "Implementati o functie care primeste un numar natural nenul `n` si intoarce cati divizori naturali are `n` (inclusiv 1 si n).",
    input_format: "O linie continand numarul natural n (n >= 1).",
    output_format: "Numarul de divizori ai lui n.",
    constraints: "1 <= n <= 10^6",
    curriculum_subcategory_id: "returneaza-valori",
    spec: { name: "numarDivizori", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => numarDivizori(a.n),
    tests: [{ n: 36 }, { n: 1 }, { n: 97 }, { n: 100 }, { n: 60 }, { n: 999983 }],
    official_cpp:
      "int numarDivizori(int n) {\n    int c = 0;\n    for (int i = 1; (long long)i * i <= n; i++) {\n        if (n % i == 0) {\n            c++;\n            if (i != n / i) c++;\n        }\n    }\n    return c;\n}\n",
    official_python:
      "def numarDivizori(n):\n    c = 0\n    i = 1\n    while i * i <= n:\n        if n % i == 0:\n            c += 1\n            if i != n // i:\n                c += 1\n        i += 1\n    return c\n",
  },
  {
    slug: "subprograme-verifica-numar-prim",
    title: "Verificarea unui numar prim",
    statement:
      "Implementati o functie care primeste un numar natural `n` si intoarce `true` daca `n` este numar prim si `false` in caz contrar.",
    input_format: "O linie continand numarul natural n.",
    output_format: "1 daca n este prim, 0 in caz contrar.",
    constraints: "0 <= n <= 10^6",
    curriculum_subcategory_id: "returneaza-valori",
    spec: { name: "estePrim", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "bool" } },
    solve: (a) => estePrim(a.n),
    tests: [{ n: 97 }, { n: 1 }, { n: 2 }, { n: 100 }, { n: 999983 }, { n: 0 }],
    official_cpp:
      "bool estePrim(int n) {\n    if (n < 2) return false;\n    for (int i = 2; (long long)i * i <= n; i++) {\n        if (n % i == 0) return false;\n    }\n    return true;\n}\n",
    official_python:
      "def estePrim(n):\n    if n < 2:\n        return False\n    i = 2\n    while i * i <= n:\n        if n % i == 0:\n            return False\n        i += 1\n    return True\n",
  },
  {
    slug: "subprograme-cmmdc",
    title: "Cel mai mare divizor comun",
    statement:
      "Implementati o functie care primeste doua numere naturale nenule `a` si `b` si intoarce cel mai mare divizor comun al lor (algoritmul lui Euclid).",
    input_format: "Doua linii, fiecare continand cate un numar natural: a, apoi b.",
    output_format: "Cel mai mare divizor comun al lui a si b.",
    constraints: "1 <= a, b <= 10^9",
    curriculum_subcategory_id: "returneaza-valori",
    spec: {
      name: "cmmdc",
      params: [
        { name: "a", type: "int" },
        { name: "b", type: "int" },
      ],
      returns: { mode: "value", type: "int" },
    },
    solve: (args) => cmmdc(args.a, args.b),
    tests: [
      { a: 24, b: 36 },
      { a: 17, b: 5 },
      { a: 1, b: 1 },
      { a: 100, b: 75 },
      { a: 999999937, b: 2 },
      { a: 48, b: 18 },
    ],
    official_cpp: "int cmmdc(int a, int b) {\n    while (b != 0) {\n        int r = a % b;\n        a = b;\n        b = r;\n    }\n    return a;\n}\n",
    official_python: "def cmmdc(a, b):\n    while b != 0:\n        a, b = b, a % b\n    return a\n",
  },
  {
    slug: "subprograme-rasturnatul-numarului",
    title: "Rasturnatul unui numar",
    statement: "Implementati o functie care primeste un numar natural `n` si intoarce rasturnatul (oglindit) al acestuia.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Rasturnatul lui n.",
    constraints: "0 <= n <= 10^9",
    curriculum_subcategory_id: "returneaza-valori",
    spec: { name: "rasturnat", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => reversed(a.n),
    tests: [{ n: 1234 }, { n: 0 }, { n: 500 }, { n: 7 }, { n: 100000 }, { n: 987654321 }],
    official_cpp: "int rasturnat(int n) {\n    int r = 0;\n    while (n > 0) {\n        r = r * 10 + n % 10;\n        n /= 10;\n    }\n    return r;\n}\n",
    official_python: "def rasturnat(n):\n    r = 0\n    while n > 0:\n        r = r * 10 + n % 10\n        n //= 10\n    return r\n",
  },
  {
    slug: "subprograme-cifra-maxima",
    title: "Cea mai mare cifra a unui numar",
    statement: "Implementati o functie care primeste un numar natural `n` si intoarce cea mai mare cifra a acestuia.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Cea mai mare cifra a lui n.",
    constraints: "0 <= n <= 10^9",
    curriculum_subcategory_id: "returneaza-valori",
    spec: { name: "cifraMaxima", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (a) => cifraMaxima(a.n),
    tests: [{ n: 1234 }, { n: 0 }, { n: 7 }, { n: 900001 }, { n: 111111 }, { n: 87654321 }],
    official_cpp:
      "int cifraMaxima(int n) {\n    int m = 0;\n    while (n > 0) {\n        if (n % 10 > m) m = n % 10;\n        n /= 10;\n    }\n    return m;\n}\n",
    official_python: "def cifraMaxima(n):\n    m = 0\n    while n > 0:\n        m = max(m, n % 10)\n        n //= 10\n    return m\n",
  },

  // ---------- valori-prin-parametri ----------
  {
    slug: "subprograme-minim-si-maxim-a-doua-numere",
    title: "Minimul si maximul a doua numere",
    statement:
      "Implementati o functie care primeste doua numere intregi `a` si `b` si determina minimul si maximul lor prin parametrii de iesire `mn` si `mx`.\n\nIn C++/C/Pascal parametrii de iesire se dau prin referinta/pointer; in Python functia returneaza cele doua valori ca tuplu `(mn, mx)`.",
    input_format: "Doua linii: a, apoi b.",
    output_format: "Minimul si maximul, separate printr-un spatiu.",
    constraints: "-10^9 <= a, b <= 10^9",
    curriculum_subcategory_id: "valori-prin-parametri",
    spec: {
      name: "minMax",
      params: [
        { name: "a", type: "int" },
        { name: "b", type: "int" },
      ],
      returns: {
        mode: "out-params",
        outs: [
          { name: "mn", type: "int" },
          { name: "mx", type: "int" },
        ],
      },
    },
    solve: (args) => ({ mn: Math.min(args.a, args.b), mx: Math.max(args.a, args.b) }),
    tests: [
      { a: 3, b: 8 },
      { a: 8, b: 3 },
      { a: -5, b: 5 },
      { a: 0, b: 0 },
      { a: -100, b: -200 },
      { a: 1000000000, b: -1000000000 },
    ],
    official_cpp: "void minMax(int a, int b, int &mn, int &mx) {\n    mn = a < b ? a : b;\n    mx = a > b ? a : b;\n}\n",
    official_python: "def minMax(a, b):\n    return min(a, b), max(a, b)\n",
  },
  {
    slug: "subprograme-catul-si-restul",
    title: "Catul si restul impartirii",
    statement:
      "Implementati o functie care primeste doi intregi `a` si `b` (b nenul) si determina catul si restul impartirii intregi a lui `a` la `b`, prin parametrii de iesire `cat` si `rest`.",
    input_format: "Doua linii: a, apoi b.",
    output_format: "Catul si restul, separate printr-un spatiu.",
    constraints: "1 <= a <= 10^9, 1 <= b <= 10^9",
    curriculum_subcategory_id: "valori-prin-parametri",
    spec: {
      name: "catSiRest",
      params: [
        { name: "a", type: "int" },
        { name: "b", type: "int" },
      ],
      returns: {
        mode: "out-params",
        outs: [
          { name: "cat", type: "int" },
          { name: "rest", type: "int" },
        ],
      },
    },
    solve: (args) => ({ cat: Math.floor(args.a / args.b), rest: args.a % args.b }),
    tests: [
      { a: 17, b: 5 },
      { a: 100, b: 10 },
      { a: 7, b: 7 },
      { a: 1, b: 3 },
      { a: 999999999, b: 3 },
      { a: 22, b: 7 },
    ],
    official_cpp: "void catSiRest(int a, int b, int &cat, int &rest) {\n    cat = a / b;\n    rest = a % b;\n}\n",
    official_python: "def catSiRest(a, b):\n    return a // b, a % b\n",
  },
  {
    slug: "subprograme-suma-si-produsul-cifrelor",
    title: "Suma si produsul cifrelor unui numar",
    statement:
      "Implementati o functie care primeste un numar natural `n` si determina suma si produsul cifrelor sale, prin parametrii de iesire `suma` si `produs`.",
    input_format: "O linie continand numarul natural n (n >= 1).",
    output_format: "Suma si produsul cifrelor lui n, separate printr-un spatiu.",
    constraints: "1 <= n <= 10^9",
    curriculum_subcategory_id: "valori-prin-parametri",
    spec: {
      name: "sumaSiProdusCifre",
      params: [{ name: "n", type: "int" }],
      returns: {
        mode: "out-params",
        outs: [
          { name: "suma", type: "int" },
          { name: "produs", type: "int" },
        ],
      },
    },
    solve: (a) => {
      let n = a.n;
      let suma = 0;
      let produs = 1;
      while (n > 0) {
        suma += n % 10;
        produs *= n % 10;
        n = Math.floor(n / 10);
      }
      return { suma, produs };
    },
    tests: [{ n: 123 }, { n: 7 }, { n: 100 }, { n: 999 }, { n: 405 }, { n: 111111 }],
    official_cpp:
      "void sumaSiProdusCifre(int n, int &suma, int &produs) {\n    suma = 0;\n    produs = 1;\n    while (n > 0) {\n        suma += n % 10;\n        produs *= n % 10;\n        n /= 10;\n    }\n}\n",
    official_python:
      "def sumaSiProdusCifre(n):\n    suma = 0\n    produs = 1\n    while n > 0:\n        suma += n % 10\n        produs *= n % 10\n        n //= 10\n    return suma, produs\n",
  },
  {
    slug: "subprograme-prima-si-ultima-cifra",
    title: "Prima si ultima cifra a unui numar",
    statement:
      "Implementati o functie care primeste un numar natural nenul `n` si determina prima cifra si ultima cifra ale acestuia, prin parametrii de iesire `prima` si `ultima`.",
    input_format: "O linie continand numarul natural n (n >= 1).",
    output_format: "Prima si ultima cifra ale lui n, separate printr-un spatiu.",
    constraints: "1 <= n <= 10^9",
    curriculum_subcategory_id: "valori-prin-parametri",
    spec: {
      name: "cifreExtreme",
      params: [{ name: "n", type: "int" }],
      returns: {
        mode: "out-params",
        outs: [
          { name: "prima", type: "int" },
          { name: "ultima", type: "int" },
        ],
      },
    },
    solve: (a) => {
      const ultima = a.n % 10;
      let n = a.n;
      while (n >= 10) n = Math.floor(n / 10);
      return { prima: n, ultima };
    },
    tests: [{ n: 1234 }, { n: 7 }, { n: 900001 }, { n: 500 }, { n: 111111 }, { n: 87654321 }],
    official_cpp:
      "void cifreExtreme(int n, int &prima, int &ultima) {\n    ultima = n % 10;\n    while (n >= 10) n /= 10;\n    prima = n;\n}\n",
    official_python:
      "def cifreExtreme(n):\n    ultima = n % 10\n    m = n\n    while m >= 10:\n        m //= 10\n    return m, ultima\n",
  },

  // ---------- prelucreaza-tab-unidimensionale ----------
  {
    slug: "subprograme-suma-elementelor-unui-vector",
    title: "Suma elementelor unui vector",
    statement: "Implementati o functie care primeste un vector de `n` numere intregi si intoarce suma elementelor sale.",
    input_format: "Pe prima linie n, pe a doua linie n numere intregi separate prin spatiu.",
    output_format: "Suma elementelor vectorului.",
    constraints: "1 <= n <= 1000, |a[i]| <= 10^6",
    curriculum_subcategory_id: "prelucreaza-tab-unidimensionale",
    spec: {
      name: "sumaElemente",
      params: [
        { name: "n", type: "int" },
        { name: "a", type: "array<int>", sizeParam: "n" },
      ],
      returns: { mode: "value", type: "int" },
    },
    solve: (args) => args.a.reduce((s, x) => s + x, 0),
    tests: [
      { n: 5, a: [1, 2, 3, 4, 5] },
      { n: 1, a: [42] },
      { n: 4, a: [-1, -2, 3, 4] },
      { n: 6, a: [0, 0, 0, 0, 0, 0] },
      { n: 3, a: [1000000, 1000000, 1000000] },
      { n: 5, a: [-5, -4, -3, -2, -1] },
    ],
    official_cpp:
      "int sumaElemente(int n, vector<int> a) {\n    int s = 0;\n    for (int i = 0; i < n; i++) s += a[i];\n    return s;\n}\n",
    official_python: "def sumaElemente(n, a):\n    return sum(a)\n",
  },
  {
    slug: "subprograme-numarul-elementelor-pare",
    title: "Numarul elementelor pare dintr-un vector",
    statement: "Implementati o functie care primeste un vector de `n` numere intregi si intoarce cate dintre ele sunt pare.",
    input_format: "Pe prima linie n, pe a doua linie n numere intregi separate prin spatiu.",
    output_format: "Numarul elementelor pare din vector.",
    constraints: "1 <= n <= 1000, |a[i]| <= 10^6",
    curriculum_subcategory_id: "prelucreaza-tab-unidimensionale",
    spec: {
      name: "numaraPare",
      params: [
        { name: "n", type: "int" },
        { name: "a", type: "array<int>", sizeParam: "n" },
      ],
      returns: { mode: "value", type: "int" },
    },
    solve: (args) => args.a.filter((x) => x % 2 === 0).length,
    tests: [
      { n: 5, a: [1, 2, 3, 4, 5] },
      { n: 1, a: [1] },
      { n: 4, a: [2, 4, 6, 8] },
      { n: 3, a: [-2, -3, -4] },
      { n: 6, a: [0, 1, 0, 1, 0, 1] },
      { n: 5, a: [1, 3, 5, 7, 9] },
    ],
    official_cpp:
      "int numaraPare(int n, vector<int> a) {\n    int c = 0;\n    for (int i = 0; i < n; i++)\n        if (a[i] % 2 == 0) c++;\n    return c;\n}\n",
    official_python: "def numaraPare(n, a):\n    return sum(1 for x in a if x % 2 == 0)\n",
  },
  {
    slug: "subprograme-elementul-maxim-din-vector",
    title: "Elementul maxim dintr-un vector",
    statement: "Implementati o functie care primeste un vector de `n` numere intregi si intoarce valoarea maxima din vector.",
    input_format: "Pe prima linie n, pe a doua linie n numere intregi separate prin spatiu.",
    output_format: "Valoarea maxima din vector.",
    constraints: "1 <= n <= 1000, |a[i]| <= 10^6",
    curriculum_subcategory_id: "prelucreaza-tab-unidimensionale",
    spec: {
      name: "elementulMaxim",
      params: [
        { name: "n", type: "int" },
        { name: "a", type: "array<int>", sizeParam: "n" },
      ],
      returns: { mode: "value", type: "int" },
    },
    solve: (args) => Math.max(...args.a),
    tests: [
      { n: 5, a: [1, 5, 3, 2, 4] },
      { n: 1, a: [-7] },
      { n: 4, a: [-1, -2, -3, -4] },
      { n: 6, a: [10, 10, 10, 5, 10, 10] },
      { n: 3, a: [1000000, -1000000, 0] },
      { n: 5, a: [5, 4, 3, 2, 1] },
    ],
    official_cpp:
      "int elementulMaxim(int n, vector<int> a) {\n    int m = a[0];\n    for (int i = 1; i < n; i++)\n        if (a[i] > m) m = a[i];\n    return m;\n}\n",
    official_python: "def elementulMaxim(n, a):\n    return max(a)\n",
  },
  {
    slug: "subprograme-cautarea-unui-element-in-vector",
    title: "Cautarea unui element intr-un vector",
    statement:
      "Implementati o functie care primeste un vector de `n` numere intregi si un numar `x` si intoarce `true` daca `x` apare in vector si `false` in caz contrar.",
    input_format: "Pe prima linie n, pe a doua linie n numere intregi separate prin spatiu, pe a treia linie valoarea x.",
    output_format: "1 daca x apare in vector, 0 in caz contrar.",
    constraints: "1 <= n <= 1000, |a[i]|, |x| <= 10^6",
    curriculum_subcategory_id: "prelucreaza-tab-unidimensionale",
    spec: {
      name: "existaElement",
      params: [
        { name: "n", type: "int" },
        { name: "a", type: "array<int>", sizeParam: "n" },
        { name: "x", type: "int" },
      ],
      returns: { mode: "value", type: "bool" },
    },
    solve: (args) => args.a.includes(args.x),
    tests: [
      { n: 5, a: [1, 2, 3, 4, 5], x: 3 },
      { n: 5, a: [1, 2, 3, 4, 5], x: 9 },
      { n: 1, a: [7], x: 7 },
      { n: 4, a: [-1, -2, -3, -4], x: -4 },
      { n: 3, a: [0, 0, 0], x: 1 },
      { n: 6, a: [5, 4, 3, 2, 1, 0], x: 0 },
    ],
    official_cpp:
      "bool existaElement(int n, vector<int> a, int x) {\n    for (int i = 0; i < n; i++)\n        if (a[i] == x) return true;\n    return false;\n}\n",
    official_python: "def existaElement(n, a, x):\n    return x in a\n",
  },
  {
    slug: "subprograme-inversarea-unui-vector",
    title: "Inversarea elementelor unui vector",
    statement:
      "Implementati o functie care primeste un vector de `n` numere intregi si il modifica in loc astfel incat elementele sa apara in ordine inversa.\n\nIn C++/C/Pascal, parametrul vectorului se primeste prin referinta si se modifica direct. In Python, modificati lista pe loc (de exemplu `a.reverse()` sau `a[:] = ...`) — nu redefiniti `a` printr-o simpla atribuire, altfel modificarea nu se va vedea in afara functiei.",
    input_format: "Pe prima linie n, pe a doua linie n numere intregi separate prin spatiu.",
    output_format: "Elementele vectorului, in ordine inversa, separate prin spatiu.",
    constraints: "1 <= n <= 1000, |a[i]| <= 10^6",
    curriculum_subcategory_id: "prelucreaza-tab-unidimensionale",
    spec: {
      name: "inverseazaVector",
      params: [
        { name: "n", type: "int" },
        { name: "a", type: "array<int>", sizeParam: "n" },
      ],
      returns: { mode: "mutate-array", paramName: "a" },
    },
    solve: (args) => [...args.a].reverse(),
    tests: [
      { n: 5, a: [1, 2, 3, 4, 5] },
      { n: 1, a: [9] },
      { n: 4, a: [-1, -2, -3, -4] },
      { n: 6, a: [1, 1, 2, 2, 3, 3] },
      { n: 2, a: [10, 20] },
      { n: 7, a: [7, 6, 5, 4, 3, 2, 1] },
    ],
    official_cpp: "void inverseazaVector(int n, vector<int> &a) {\n    for (int i = 0, j = n - 1; i < j; i++, j--)\n        swap(a[i], a[j]);\n}\n",
    official_python: "def inverseazaVector(n, a):\n    a.reverse()\n",
  },
  {
    slug: "subprograme-inlocuirea-elementelor-negative",
    title: "Inlocuirea elementelor negative cu 0",
    statement:
      "Implementati o functie care primeste un vector de `n` numere intregi si il modifica in loc astfel incat toate elementele negative sa devina 0.",
    input_format: "Pe prima linie n, pe a doua linie n numere intregi separate prin spatiu.",
    output_format: "Elementele vectorului dupa inlocuire, separate prin spatiu.",
    constraints: "1 <= n <= 1000, |a[i]| <= 10^6",
    curriculum_subcategory_id: "prelucreaza-tab-unidimensionale",
    spec: {
      name: "inlocuiesteNegative",
      params: [
        { name: "n", type: "int" },
        { name: "a", type: "array<int>", sizeParam: "n" },
      ],
      returns: { mode: "mutate-array", paramName: "a" },
    },
    solve: (args) => args.a.map((x) => (x < 0 ? 0 : x)),
    tests: [
      { n: 5, a: [1, -2, 3, -4, 5] },
      { n: 1, a: [-9] },
      { n: 4, a: [1, 2, 3, 4] },
      { n: 6, a: [-1, -1, -1, -1, -1, -1] },
      { n: 2, a: [0, -1] },
      { n: 7, a: [-7, 6, -5, 4, -3, 2, -1] },
    ],
    official_cpp: "void inlocuiesteNegative(int n, vector<int> &a) {\n    for (int i = 0; i < n; i++)\n        if (a[i] < 0) a[i] = 0;\n}\n",
    official_python: "def inlocuiesteNegative(n, a):\n    for i in range(n):\n        if a[i] < 0:\n            a[i] = 0\n",
  },

  // ---------- prelucreaza-tab-bidimensionale ----------
  {
    slug: "subprograme-suma-elementelor-unei-matrice",
    title: "Suma elementelor unei matrice",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si intoarce suma elementelor sale.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "Suma elementelor matricei.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000",
    curriculum_subcategory_id: "prelucreaza-tab-bidimensionale",
    spec: {
      name: "sumaMatrice",
      params: [
        { name: "r", type: "int" },
        { name: "c", type: "int" },
        { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" },
      ],
      returns: { mode: "value", type: "int" },
    },
    solve: (args) => args.m.reduce((s, row) => s + row.reduce((rs, x) => rs + x, 0), 0),
    tests: [
      { r: 2, c: 2, m: [[1, 2], [3, 4]] },
      { r: 1, c: 1, m: [[5]] },
      { r: 3, c: 2, m: [[1, -1], [2, -2], [3, -3]] },
      { r: 2, c: 3, m: [[0, 0, 0], [0, 0, 0]] },
      { r: 1, c: 4, m: [[1, 2, 3, 4]] },
      { r: 3, c: 3, m: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] },
    ],
    official_cpp:
      "int sumaMatrice(int r, int c, vector<vector<int>> m) {\n    int s = 0;\n    for (int i = 0; i < r; i++)\n        for (int j = 0; j < c; j++)\n            s += m[i][j];\n    return s;\n}\n",
    official_python: "def sumaMatrice(r, c, m):\n    return sum(sum(row) for row in m)\n",
  },
  {
    slug: "subprograme-suma-diagonalei-principale",
    title: "Suma diagonalei principale a unei matrice patratice",
    statement:
      "Implementati o functie care primeste o matrice patratica cu `n` linii si `n` coloane de numere intregi si intoarce suma elementelor de pe diagonala principala.",
    input_format: "Pe prima linie n. Urmeaza n linii, fiecare cu n numere intregi separate prin spatiu.",
    output_format: "Suma elementelor de pe diagonala principala.",
    constraints: "1 <= n <= 100, |m[i][j]| <= 1000",
    curriculum_subcategory_id: "prelucreaza-tab-bidimensionale",
    spec: {
      name: "sumaDiagonalaPrincipala",
      params: [
        { name: "n", type: "int" },
        { name: "m", type: "matrix<int>", rowsParam: "n", colsParam: "n" },
      ],
      returns: { mode: "value", type: "int" },
    },
    solve: (args) => args.m.reduce((s, row, i) => s + row[i], 0),
    tests: [
      { n: 2, m: [[1, 2], [3, 4]] },
      { n: 1, m: [[9]] },
      { n: 3, m: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] },
      { n: 3, m: [[-1, 0, 0], [0, -2, 0], [0, 0, -3]] },
      { n: 4, m: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]] },
      { n: 2, m: [[0, 100], [100, 0]] },
    ],
    official_cpp:
      "int sumaDiagonalaPrincipala(int n, vector<vector<int>> m) {\n    int s = 0;\n    for (int i = 0; i < n; i++) s += m[i][i];\n    return s;\n}\n",
    official_python: "def sumaDiagonalaPrincipala(n, m):\n    return sum(m[i][i] for i in range(n))\n",
  },
  {
    slug: "subprograme-numarul-elementelor-pozitive-din-matrice",
    title: "Numarul elementelor pozitive dintr-o matrice",
    statement:
      "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si intoarce cate dintre elementele sale sunt strict pozitive.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "Numarul elementelor strict pozitive din matrice.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000",
    curriculum_subcategory_id: "prelucreaza-tab-bidimensionale",
    spec: {
      name: "numaraPozitive",
      params: [
        { name: "r", type: "int" },
        { name: "c", type: "int" },
        { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" },
      ],
      returns: { mode: "value", type: "int" },
    },
    solve: (args) => args.m.reduce((s, row) => s + row.filter((x) => x > 0).length, 0),
    tests: [
      { r: 2, c: 2, m: [[1, -2], [-3, 4]] },
      { r: 1, c: 1, m: [[0]] },
      { r: 3, c: 2, m: [[1, 1], [1, 1], [1, 1]] },
      { r: 2, c: 3, m: [[-1, -2, -3], [-4, -5, -6]] },
      { r: 1, c: 4, m: [[1, 2, 3, 4]] },
      { r: 3, c: 3, m: [[0, 1, -1], [1, 0, -1], [1, -1, 0]] },
    ],
    official_cpp:
      "int numaraPozitive(int r, int c, vector<vector<int>> m) {\n    int cnt = 0;\n    for (int i = 0; i < r; i++)\n        for (int j = 0; j < c; j++)\n            if (m[i][j] > 0) cnt++;\n    return cnt;\n}\n",
    official_python: "def numaraPozitive(r, c, m):\n    return sum(1 for row in m for x in row if x > 0)\n",
  },

  // ---------- subprograme-siruri ----------
  {
    slug: "subprograme-numarul-de-vocale",
    title: "Numarul de vocale dintr-un cuvant",
    statement:
      "Implementati o functie care primeste un cuvant `s` (fara spatii) si intoarce cate vocale (a, e, i, o, u, si corespondentele lor mari) contine.",
    input_format: "O linie continand cuvantul s, format doar din litere, fara spatii.",
    output_format: "Numarul de vocale din cuvant.",
    constraints: "1 <= lungimea lui s <= 200",
    curriculum_subcategory_id: "subprograme-siruri",
    spec: { name: "numaraVocale", params: [{ name: "s", type: "string" }], returns: { mode: "value", type: "int" } },
    solve: (a) => (a.s.match(/[aeiouAEIOU]/g) || []).length,
    tests: [{ s: "informatica" }, { s: "xyz" }, { s: "Bacalaureat" }, { s: "a" }, { s: "PROGRAMARE" }, { s: "abcdefghi" }],
    official_cpp:
      'int numaraVocale(string s) {\n    string voc = "aeiouAEIOU";\n    int c = 0;\n    for (char ch : s)\n        if (voc.find(ch) != string::npos) c++;\n    return c;\n}\n',
    official_python: 'def numaraVocale(s):\n    return sum(1 for ch in s if ch.lower() in "aeiou")\n',
  },
  {
    slug: "subprograme-verifica-palindrom",
    title: "Verificarea unui cuvant palindrom",
    statement:
      "Implementati o functie care primeste un cuvant `s` (fara spatii) si intoarce `true` daca acesta este palindrom (se citeste la fel de la stanga la dreapta si invers) si `false` in caz contrar.",
    input_format: "O linie continand cuvantul s, format doar din litere, fara spatii.",
    output_format: "1 daca s este palindrom, 0 in caz contrar.",
    constraints: "1 <= lungimea lui s <= 200",
    curriculum_subcategory_id: "subprograme-siruri",
    spec: { name: "estePalindrom", params: [{ name: "s", type: "string" }], returns: { mode: "value", type: "bool" } },
    solve: (a) => a.s === a.s.split("").reverse().join(""),
    tests: [{ s: "capac" }, { s: "ana" }, { s: "informatica" }, { s: "a" }, { s: "abccba" }, { s: "abccbb" }],
    official_cpp:
      "bool estePalindrom(string s) {\n    int i = 0, j = (int)s.size() - 1;\n    while (i < j) {\n        if (s[i] != s[j]) return false;\n        i++;\n        j--;\n    }\n    return true;\n}\n",
    official_python: "def estePalindrom(s):\n    return s == s[::-1]\n",
  },
  {
    slug: "subprograme-numarul-de-litere-mari",
    title: "Numarul de litere mari dintr-un cuvant",
    statement:
      "Implementati o functie care primeste un cuvant `s` (fara spatii) si intoarce cate litere mari (majuscule) contine.",
    input_format: "O linie continand cuvantul s, format doar din litere, fara spatii.",
    output_format: "Numarul de litere mari din cuvant.",
    constraints: "1 <= lungimea lui s <= 200",
    curriculum_subcategory_id: "subprograme-siruri",
    spec: { name: "numaraLitereMari", params: [{ name: "s", type: "string" }], returns: { mode: "value", type: "int" } },
    solve: (a) => (a.s.match(/[A-Z]/g) || []).length,
    tests: [{ s: "Bacalaureat" }, { s: "abc" }, { s: "ABC" }, { s: "PoPeScu" }, { s: "a" }, { s: "InformaticaBac" }],
    official_cpp: "int numaraLitereMari(string s) {\n    int c = 0;\n    for (char ch : s)\n        if (isupper(ch)) c++;\n    return c;\n}\n",
    official_python: "def numaraLitereMari(s):\n    return sum(1 for ch in s if ch.isupper())\n",
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
    curriculum_subcategory_id: p.curriculum_subcategory_id,
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
    console.log(`\nGata: ${problems.length} probleme de subprograme (clasa a 10-a) inserate/actualizate.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
