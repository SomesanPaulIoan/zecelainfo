const { Pool } = require("pg");
const { generateArtifacts, buildInputText, buildOutputText, buildSignatureBlock } = require("./lib/subprogram-codegen");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const BASE_META = {
  difficulty: "easy",
  time_limit_ms: 1000,
  memory_limit_mb: 64,
  input_source: "stdin",
  output_target: "stdout",
  curriculum_level: "grade10",
  curriculum_chapter_id: "subprograme-recursive",
  curriculum_subcategory_id: "subprograme-recursive-baza",
  solution_mode: "function",
  checker_mode: "exact",
  source: "Sursa interna",
};

const PY_BUMP = "import sys\nsys.setrecursionlimit(3000)\n\n";

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
  // ---------- Grup A: numere (12) ----------
  {
    slug: "recursiv-factorial",
    title: "Factorial (recursiv)",
    difficulty: "easy",
    statement: "Implementati recursiv o functie care calculeaza factorialul unui numar natural n (n! = 1*2*...*n, cu 0! = 1).",
    input_format: "Un numar natural n.",
    output_format: "Valoarea n!.",
    constraints: "0 <= n <= 12",
    spec: { name: "factorial", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\n",
    official_python: "def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n",
    tests: [{ n: 0 }, { n: 1 }, { n: 5 }, { n: 10 }, { n: 12 }, { n: 7 }],
  },
  {
    slug: "recursiv-suma-cifrelor",
    title: "Suma cifrelor unui numar (recursiv)",
    difficulty: "easy",
    statement: "Implementati recursiv o functie care calculeaza suma cifrelor unui numar natural n.",
    input_format: "Un numar natural n.",
    output_format: "Suma cifrelor lui n.",
    constraints: "0 <= n <= 10^9",
    spec: { name: "sumaCifrelor", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int sumaCifrelor(int n) {\n    if (n < 10) return n;\n    return n % 10 + sumaCifrelor(n / 10);\n}\n",
    official_python: "def sumaCifrelor(n):\n    if n < 10:\n        return n\n    return n % 10 + sumaCifrelor(n // 10)\n",
    tests: [{ n: 0 }, { n: 7 }, { n: 123 }, { n: 999999999 }, { n: 10 }, { n: 405060 }],
  },
  {
    slug: "recursiv-numarul-de-cifre",
    title: "Numarul de cifre al unui numar (recursiv)",
    difficulty: "easy",
    statement: "Implementati recursiv o functie care calculeaza cate cifre are un numar natural n.",
    input_format: "Un numar natural n.",
    output_format: "Numarul de cifre ale lui n.",
    constraints: "0 <= n <= 10^9",
    spec: { name: "numarulDeCifre", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int numarulDeCifre(int n) {\n    if (n < 10) return 1;\n    return 1 + numarulDeCifre(n / 10);\n}\n",
    official_python: "def numarulDeCifre(n):\n    if n < 10:\n        return 1\n    return 1 + numarulDeCifre(n // 10)\n",
    tests: [{ n: 0 }, { n: 7 }, { n: 42 }, { n: 999999999 }, { n: 1000 }, { n: 5 }],
  },
  {
    slug: "recursiv-cifra-maxima",
    title: "Cifra maxima a unui numar (recursiv)",
    difficulty: "easy",
    statement: "Implementati recursiv o functie care determina cea mai mare cifra a unui numar natural n.",
    input_format: "Un numar natural n.",
    output_format: "Cea mai mare cifra a lui n.",
    constraints: "0 <= n <= 10^9",
    spec: { name: "cifraMaxima", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int cifraMaxima(int n) {\n    if (n < 10) return n;\n    return max(n % 10, cifraMaxima(n / 10));\n}\n",
    official_python: "def cifraMaxima(n):\n    if n < 10:\n        return n\n    return max(n % 10, cifraMaxima(n // 10))\n",
    tests: [{ n: 0 }, { n: 7 }, { n: 1839 }, { n: 111111 }, { n: 987654321 }, { n: 50 }],
  },
  {
    slug: "recursiv-cifra-minima",
    title: "Cifra minima a unui numar (recursiv)",
    difficulty: "easy",
    statement: "Implementati recursiv o functie care determina cea mai mica cifra a unui numar natural n.",
    input_format: "Un numar natural n.",
    output_format: "Cea mai mica cifra a lui n.",
    constraints: "0 <= n <= 10^9",
    spec: { name: "cifraMinima", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int cifraMinima(int n) {\n    if (n < 10) return n;\n    return min(n % 10, cifraMinima(n / 10));\n}\n",
    official_python: "def cifraMinima(n):\n    if n < 10:\n        return n\n    return min(n % 10, cifraMinima(n // 10))\n",
    tests: [{ n: 0 }, { n: 7 }, { n: 1839 }, { n: 555555 }, { n: 987654321 }, { n: 50 }],
  },
  {
    slug: "recursiv-suma-primelor-n",
    title: "Suma primelor n numere naturale (recursiv)",
    difficulty: "easy",
    statement: "Implementati recursiv o functie care calculeaza suma 1 + 2 + ... + n.",
    input_format: "Un numar natural n.",
    output_format: "Suma primelor n numere naturale.",
    constraints: "0 <= n <= 1000",
    spec: { name: "sumaPrimelorN", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int sumaPrimelorN(int n) {\n    if (n == 0) return 0;\n    return n + sumaPrimelorN(n - 1);\n}\n",
    official_python: PY_BUMP + "def sumaPrimelorN(n):\n    if n == 0:\n        return 0\n    return n + sumaPrimelorN(n - 1)\n",
    tests: [{ n: 0 }, { n: 1 }, { n: 10 }, { n: 100 }, { n: 1000 }, { n: 999 }],
  },
  {
    slug: "recursiv-putere",
    title: "Puterea unui numar (recursiv)",
    difficulty: "easy",
    statement: "Implementati recursiv o functie care calculeaza x la puterea n (x^n).",
    input_format: "Doua numere intregi x si n.",
    output_format: "Valoarea x^n.",
    constraints: "-3 <= x <= 3, 0 <= n <= 15",
    spec: { name: "putere", params: [{ name: "x", type: "int" }, { name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int putere(int x, int n) {\n    if (n == 0) return 1;\n    return x * putere(x, n - 1);\n}\n",
    official_python: "def putere(x, n):\n    if n == 0:\n        return 1\n    return x * putere(x, n - 1)\n",
    tests: [{ x: 2, n: 0 }, { x: 2, n: 10 }, { x: -2, n: 5 }, { x: 3, n: 15 }, { x: 0, n: 4 }, { x: -1, n: 7 }],
  },
  {
    slug: "recursiv-cmmdc",
    title: "Cel mai mare divizor comun (recursiv, Euclid)",
    difficulty: "easy",
    statement: "Implementati recursiv, folosind algoritmul lui Euclid, o functie care calculeaza cel mai mare divizor comun a doua numere naturale nenule a si b.",
    input_format: "Doua numere naturale a si b.",
    output_format: "Cel mai mare divizor comun al lui a si b.",
    constraints: "1 <= a, b <= 10^9",
    spec: { name: "cmmdc", params: [{ name: "a", type: "int" }, { name: "b", type: "int" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int cmmdc(int a, int b) {\n    if (b == 0) return a;\n    return cmmdc(b, a % b);\n}\n",
    official_python: "def cmmdc(a, b):\n    if b == 0:\n        return a\n    return cmmdc(b, a % b)\n",
    tests: [{ a: 12, b: 18 }, { a: 7, b: 13 }, { a: 1000000000, b: 4 }, { a: 100, b: 100 }, { a: 17, b: 34 }, { a: 999999937, b: 12 }],
  },
  {
    slug: "recursiv-cmmmc",
    title: "Cel mai mic multiplu comun (recursiv)",
    difficulty: "medium",
    statement: "Implementati recursiv o functie care calculeaza cel mai mic multiplu comun a doua numere naturale nenule a si b, folosind un subprogram recursiv auxiliar pentru cel mai mare divizor comun.",
    input_format: "Doua numere naturale a si b.",
    output_format: "Cel mai mic multiplu comun al lui a si b.",
    constraints: "1 <= a, b <= 1000",
    spec: { name: "cmmmc", params: [{ name: "a", type: "int" }, { name: "b", type: "int" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int cmmdcAux(int a, int b) {\n    if (b == 0) return a;\n    return cmmdcAux(b, a % b);\n}\n\nint cmmmc(int a, int b) {\n    return a / cmmdcAux(a, b) * b;\n}\n",
    official_python: "def cmmdcAux(a, b):\n    if b == 0:\n        return a\n    return cmmdcAux(b, a % b)\n\n\ndef cmmmc(a, b):\n    return a // cmmdcAux(a, b) * b\n",
    tests: [{ a: 4, b: 6 }, { a: 7, b: 13 }, { a: 1000, b: 999 }, { a: 12, b: 12 }, { a: 21, b: 6 }, { a: 1, b: 1000 }],
  },
  {
    slug: "recursiv-rasturnatul-unui-numar",
    title: "Rasturnatul unui numar (recursiv)",
    difficulty: "medium",
    statement: "Implementati recursiv o functie care calculeaza rasturnatul unui numar natural n, folosind un subprogram recursiv auxiliar cu un parametru acumulator.",
    input_format: "Un numar natural n.",
    output_format: "Rasturnatul lui n.",
    constraints: "0 <= n <= 10^9",
    spec: { name: "rasturnatul", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int rasturnatulAux(int n, int rez) {\n    if (n == 0) return rez;\n    return rasturnatulAux(n / 10, rez * 10 + n % 10);\n}\n\nint rasturnatul(int n) {\n    return rasturnatulAux(n, 0);\n}\n",
    official_python: "def rasturnatulAux(n, rez):\n    if n == 0:\n        return rez\n    return rasturnatulAux(n // 10, rez * 10 + n % 10)\n\n\ndef rasturnatul(n):\n    return rasturnatulAux(n, 0)\n",
    tests: [{ n: 0 }, { n: 7 }, { n: 120 }, { n: 123456789 }, { n: 1000 }, { n: 909090 }],
  },
  {
    slug: "recursiv-numar-palindrom",
    title: "Verificarea unui numar palindrom (recursiv)",
    difficulty: "medium",
    statement: "Implementati recursiv o functie care verifica daca un numar natural n este palindrom (se citeste la fel de la stanga la dreapta si de la dreapta la stanga).",
    input_format: "Un numar natural n.",
    output_format: "1 daca n este palindrom, 0 in caz contrar.",
    constraints: "0 <= n <= 10^9",
    spec: { name: "esteNumarPalindrom", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "bool" } },
    official_cpp:
      "int rasturnatAux(int n, int rez) {\n    if (n == 0) return rez;\n    return rasturnatAux(n / 10, rez * 10 + n % 10);\n}\n\nbool esteNumarPalindrom(int n) {\n    return rasturnatAux(n, 0) == n;\n}\n",
    official_python:
      "def rasturnatAux(n, rez):\n    if n == 0:\n        return rez\n    return rasturnatAux(n // 10, rez * 10 + n % 10)\n\n\ndef esteNumarPalindrom(n):\n    return rasturnatAux(n, 0) == n\n",
    tests: [{ n: 0 }, { n: 7 }, { n: 121 }, { n: 123 }, { n: 1234321 }, { n: 1000 }],
  },
  {
    slug: "recursiv-fibonacci",
    title: "Al n-lea termen din sirul lui Fibonacci (recursiv)",
    difficulty: "medium",
    statement: "Implementati recursiv o functie care calculeaza al n-lea termen din sirul lui Fibonacci (F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2)).",
    input_format: "Un numar natural n.",
    output_format: "Al n-lea termen din sirul lui Fibonacci.",
    constraints: "0 <= n <= 25",
    time_limit_ms: 2000,
    spec: { name: "fibonacci", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int fibonacci(int n) {\n    if (n <= 1) return n;\n    return fibonacci(n - 1) + fibonacci(n - 2);\n}\n",
    official_python: "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n - 1) + fibonacci(n - 2)\n",
    tests: [{ n: 0 }, { n: 1 }, { n: 2 }, { n: 10 }, { n: 20 }, { n: 25 }],
  },
  // ---------- Grup B: vectori (12) ----------
  {
    slug: "recursiv-suma-vector",
    title: "Suma elementelor unui vector (recursiv)",
    difficulty: "easy",
    statement: "Implementati recursiv o functie care calculeaza suma elementelor unui vector cu n numere intregi.",
    input_format: "Pe prima linie n, pe a doua linie n numere intregi separate prin spatiu.",
    output_format: "Suma elementelor vectorului.",
    constraints: "0 <= n <= 1000, |a[i]| <= 10^6",
    spec: { name: "sumaVector", params: [{ name: "n", type: "int" }, { name: "a", type: "array<int>", sizeParam: "n" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int sumaVector(int n, vector<int> a) {\n    if (n == 0) return 0;\n    return a[n - 1] + sumaVector(n - 1, a);\n}\n",
    official_python: PY_BUMP + "def sumaVector(n, a):\n    if n == 0:\n        return 0\n    return a[n - 1] + sumaVector(n - 1, a)\n",
    tests: [
      { n: 0, a: [] },
      { n: 1, a: [7] },
      { n: 5, a: [1, 2, 3, 4, 5] },
      { n: 4, a: [-1, -2, 3, 4] },
      { n: 6, a: [1000000, -1000000, 1, 1, 1, 1] },
      { n: 3, a: [-5, -5, -5] },
    ],
  },
  {
    slug: "recursiv-produs-vector",
    title: "Produsul elementelor unui vector (recursiv)",
    difficulty: "easy",
    statement: "Implementati recursiv o functie care calculeaza produsul elementelor unui vector cu n numere intregi.",
    input_format: "Pe prima linie n, pe a doua linie n numere intregi separate prin spatiu.",
    output_format: "Produsul elementelor vectorului.",
    constraints: "1 <= n <= 8, |a[i]| <= 10",
    spec: { name: "produsVector", params: [{ name: "n", type: "int" }, { name: "a", type: "array<int>", sizeParam: "n" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int produsVector(int n, vector<int> a) {\n    if (n == 0) return 1;\n    return a[n - 1] * produsVector(n - 1, a);\n}\n",
    official_python: "def produsVector(n, a):\n    if n == 0:\n        return 1\n    return a[n - 1] * produsVector(n - 1, a)\n",
    tests: [
      { n: 1, a: [7] },
      { n: 5, a: [1, 2, 3, 4, 5] },
      { n: 4, a: [-1, -2, 3, 4] },
      { n: 3, a: [0, 5, 10] },
      { n: 6, a: [-1, -1, -1, -1, -1, -1] },
      { n: 2, a: [10, 10] },
    ],
  },
  {
    slug: "recursiv-numar-elemente-pare",
    title: "Numarul elementelor pare dintr-un vector (recursiv)",
    difficulty: "easy",
    statement: "Implementati recursiv o functie care determina cate elemente pare are un vector cu n numere intregi.",
    input_format: "Pe prima linie n, pe a doua linie n numere intregi separate prin spatiu.",
    output_format: "Numarul elementelor pare din vector.",
    constraints: "0 <= n <= 1000, |a[i]| <= 10^6",
    spec: { name: "numarElementePare", params: [{ name: "n", type: "int" }, { name: "a", type: "array<int>", sizeParam: "n" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int numarElementePare(int n, vector<int> a) {\n    if (n == 0) return 0;\n    return (a[n - 1] % 2 == 0 ? 1 : 0) + numarElementePare(n - 1, a);\n}\n",
    official_python: PY_BUMP + "def numarElementePare(n, a):\n    if n == 0:\n        return 0\n    return (1 if a[n - 1] % 2 == 0 else 0) + numarElementePare(n - 1, a)\n",
    tests: [
      { n: 0, a: [] },
      { n: 1, a: [4] },
      { n: 5, a: [1, 2, 3, 4, 5] },
      { n: 4, a: [-2, -3, -4, -5] },
      { n: 6, a: [1, 1, 1, 1, 1, 1] },
      { n: 3, a: [0, 0, 1] },
    ],
  },
  {
    slug: "recursiv-numar-elemente-impare",
    title: "Numarul elementelor impare dintr-un vector (recursiv)",
    difficulty: "easy",
    statement: "Implementati recursiv o functie care determina cate elemente impare are un vector cu n numere intregi.",
    input_format: "Pe prima linie n, pe a doua linie n numere intregi separate prin spatiu.",
    output_format: "Numarul elementelor impare din vector.",
    constraints: "0 <= n <= 1000, |a[i]| <= 10^6",
    spec: { name: "numarElementeImpare", params: [{ name: "n", type: "int" }, { name: "a", type: "array<int>", sizeParam: "n" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int numarElementeImpare(int n, vector<int> a) {\n    if (n == 0) return 0;\n    return (a[n - 1] % 2 != 0 ? 1 : 0) + numarElementeImpare(n - 1, a);\n}\n",
    official_python: PY_BUMP + "def numarElementeImpare(n, a):\n    if n == 0:\n        return 0\n    return (1 if a[n - 1] % 2 != 0 else 0) + numarElementeImpare(n - 1, a)\n",
    tests: [
      { n: 0, a: [] },
      { n: 1, a: [3] },
      { n: 5, a: [1, 2, 3, 4, 5] },
      { n: 4, a: [-2, -3, -4, -5] },
      { n: 6, a: [2, 2, 2, 2, 2, 2] },
      { n: 3, a: [0, 0, 1] },
    ],
  },
  {
    slug: "recursiv-maxim-vector",
    title: "Maximul dintr-un vector (recursiv)",
    difficulty: "easy",
    statement: "Implementati recursiv o functie care determina valoarea maxima dintr-un vector cu n numere intregi.",
    input_format: "Pe prima linie n, pe a doua linie n numere intregi separate prin spatiu.",
    output_format: "Valoarea maxima din vector.",
    constraints: "1 <= n <= 1000, |a[i]| <= 10^6",
    spec: { name: "maximVector", params: [{ name: "n", type: "int" }, { name: "a", type: "array<int>", sizeParam: "n" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int maximVector(int n, vector<int> a) {\n    if (n == 1) return a[0];\n    return max(a[n - 1], maximVector(n - 1, a));\n}\n",
    official_python: PY_BUMP + "def maximVector(n, a):\n    if n == 1:\n        return a[0]\n    return max(a[n - 1], maximVector(n - 1, a))\n",
    tests: [
      { n: 1, a: [7] },
      { n: 5, a: [5, 1, 3, 2, 4] },
      { n: 4, a: [-1, -2, -3, -4] },
      { n: 6, a: [10, 10, 5, 10, 10, 10] },
      { n: 3, a: [1000000, -1000000, 0] },
      { n: 5, a: [1, 2, 3, 4, 5] },
    ],
  },
  {
    slug: "recursiv-minim-vector",
    title: "Minimul dintr-un vector (recursiv)",
    difficulty: "easy",
    statement: "Implementati recursiv o functie care determina valoarea minima dintr-un vector cu n numere intregi.",
    input_format: "Pe prima linie n, pe a doua linie n numere intregi separate prin spatiu.",
    output_format: "Valoarea minima din vector.",
    constraints: "1 <= n <= 1000, |a[i]| <= 10^6",
    spec: { name: "minimVector", params: [{ name: "n", type: "int" }, { name: "a", type: "array<int>", sizeParam: "n" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int minimVector(int n, vector<int> a) {\n    if (n == 1) return a[0];\n    return min(a[n - 1], minimVector(n - 1, a));\n}\n",
    official_python: PY_BUMP + "def minimVector(n, a):\n    if n == 1:\n        return a[0]\n    return min(a[n - 1], minimVector(n - 1, a))\n",
    tests: [
      { n: 1, a: [7] },
      { n: 5, a: [5, 1, 3, 2, 4] },
      { n: 4, a: [-1, -2, -3, -4] },
      { n: 6, a: [10, 10, 5, 10, 10, 10] },
      { n: 3, a: [1000000, -1000000, 0] },
      { n: 5, a: [5, 4, 3, 2, 1] },
    ],
  },
  {
    slug: "recursiv-vector-sortat-crescator",
    title: "Verificarea daca un vector este sortat crescator (recursiv)",
    difficulty: "medium",
    statement: "Implementati recursiv o functie care verifica daca un vector cu n numere intregi este sortat crescator (nedescrescator).",
    input_format: "Pe prima linie n, pe a doua linie n numere intregi separate prin spatiu.",
    output_format: "1 daca vectorul este sortat crescator, 0 in caz contrar.",
    constraints: "0 <= n <= 1000, |a[i]| <= 10^6",
    spec: { name: "esteSortatCrescator", params: [{ name: "n", type: "int" }, { name: "a", type: "array<int>", sizeParam: "n" }], returns: { mode: "value", type: "bool" } },
    official_cpp: "bool esteSortatCrescator(int n, vector<int> a) {\n    if (n <= 1) return true;\n    return a[n - 2] <= a[n - 1] && esteSortatCrescator(n - 1, a);\n}\n",
    official_python: PY_BUMP + "def esteSortatCrescator(n, a):\n    if n <= 1:\n        return True\n    return a[n - 2] <= a[n - 1] and esteSortatCrescator(n - 1, a)\n",
    tests: [
      { n: 0, a: [] },
      { n: 1, a: [7] },
      { n: 5, a: [1, 2, 2, 3, 4] },
      { n: 4, a: [1, 3, 2, 4] },
      { n: 6, a: [-5, -3, 0, 1, 1, 9] },
      { n: 3, a: [3, 2, 1] },
    ],
  },
  {
    slug: "recursiv-toate-pozitive",
    title: "Verificarea daca toate elementele unui vector sunt pozitive (recursiv)",
    difficulty: "easy",
    statement: "Implementati recursiv o functie care verifica daca toate elementele unui vector cu n numere intregi sunt strict pozitive.",
    input_format: "Pe prima linie n, pe a doua linie n numere intregi separate prin spatiu.",
    output_format: "1 daca toate elementele sunt strict pozitive, 0 in caz contrar.",
    constraints: "0 <= n <= 1000, |a[i]| <= 10^6",
    spec: { name: "toatePozitive", params: [{ name: "n", type: "int" }, { name: "a", type: "array<int>", sizeParam: "n" }], returns: { mode: "value", type: "bool" } },
    official_cpp: "bool toatePozitive(int n, vector<int> a) {\n    if (n == 0) return true;\n    return a[n - 1] > 0 && toatePozitive(n - 1, a);\n}\n",
    official_python: PY_BUMP + "def toatePozitive(n, a):\n    if n == 0:\n        return True\n    return a[n - 1] > 0 and toatePozitive(n - 1, a)\n",
    tests: [
      { n: 0, a: [] },
      { n: 1, a: [5] },
      { n: 1, a: [-5] },
      { n: 5, a: [1, 2, 3, 4, 5] },
      { n: 4, a: [1, 2, 0, 4] },
      { n: 3, a: [1, -2, 3] },
    ],
  },
  {
    slug: "recursiv-numara-aparitii",
    title: "Numarul de aparitii ale unei valori intr-un vector (recursiv)",
    difficulty: "easy",
    statement: "Implementati recursiv o functie care numara de cate ori apare valoarea data valoare intr-un vector cu n numere intregi.",
    input_format: "Pe prima linie n, pe a doua linie n numere intregi separate prin spatiu, pe a treia linie valoarea cautata.",
    output_format: "Numarul de aparitii ale valorii date in vector.",
    constraints: "0 <= n <= 1000, |a[i]|, |valoare| <= 10^6",
    spec: {
      name: "numaraAparitii",
      params: [{ name: "n", type: "int" }, { name: "a", type: "array<int>", sizeParam: "n" }, { name: "valoare", type: "int" }],
      returns: { mode: "value", type: "int" },
    },
    official_cpp: "int numaraAparitii(int n, vector<int> a, int valoare) {\n    if (n == 0) return 0;\n    return (a[n - 1] == valoare ? 1 : 0) + numaraAparitii(n - 1, a, valoare);\n}\n",
    official_python: PY_BUMP + "def numaraAparitii(n, a, valoare):\n    if n == 0:\n        return 0\n    return (1 if a[n - 1] == valoare else 0) + numaraAparitii(n - 1, a, valoare)\n",
    tests: [
      { n: 0, a: [], valoare: 5 },
      { n: 1, a: [5], valoare: 5 },
      { n: 5, a: [1, 2, 1, 2, 1], valoare: 1 },
      { n: 4, a: [-2, -2, -2, -2], valoare: -2 },
      { n: 6, a: [1, 2, 3, 4, 5, 6], valoare: 9 },
      { n: 3, a: [0, 0, 0], valoare: 0 },
    ],
  },
  {
    slug: "recursiv-suma-pozitii-pare",
    title: "Suma elementelor de pe pozitii pare dintr-un vector (recursiv)",
    difficulty: "medium",
    statement: "Implementati recursiv o functie care calculeaza suma elementelor aflate pe pozitii pare (indexate de la 0) intr-un vector cu n numere intregi.",
    input_format: "Pe prima linie n, pe a doua linie n numere intregi separate prin spatiu.",
    output_format: "Suma elementelor de pe pozitii pare.",
    constraints: "0 <= n <= 1000, |a[i]| <= 10^6",
    spec: { name: "sumaPePozitiiPare", params: [{ name: "n", type: "int" }, { name: "a", type: "array<int>", sizeParam: "n" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int sumaPePozitiiPare(int n, vector<int> a) {\n    if (n == 0) return 0;\n    int adaugat = ((n - 1) % 2 == 0) ? a[n - 1] : 0;\n    return adaugat + sumaPePozitiiPare(n - 1, a);\n}\n",
    official_python:
      PY_BUMP + "def sumaPePozitiiPare(n, a):\n    if n == 0:\n        return 0\n    adaugat = a[n - 1] if (n - 1) % 2 == 0 else 0\n    return adaugat + sumaPePozitiiPare(n - 1, a)\n",
    tests: [
      { n: 0, a: [] },
      { n: 1, a: [7] },
      { n: 5, a: [1, 2, 3, 4, 5] },
      { n: 4, a: [-1, -2, 3, 4] },
      { n: 6, a: [1, 1, 1, 1, 1, 1] },
      { n: 3, a: [10, 20, 30] },
    ],
  },
  {
    slug: "recursiv-cauta-valoare",
    title: "Cautarea secventiala a unei valori intr-un vector (recursiv)",
    difficulty: "medium",
    statement:
      "Implementati recursiv o functie care determina pozitia (indexata de la 0) primei aparitii a unei valori date intr-un vector cu n numere intregi, folosind un subprogram recursiv auxiliar cu un parametru index. Daca valoarea nu apare, se returneaza -1.",
    input_format: "Pe prima linie n, pe a doua linie n numere intregi separate prin spatiu, pe a treia linie valoarea cautata.",
    output_format: "Pozitia (de la 0) primei aparitii a valorii, sau -1 daca aceasta nu exista.",
    constraints: "0 <= n <= 1000, |a[i]|, |valoare| <= 10^6",
    spec: {
      name: "cautaValoare",
      params: [{ name: "n", type: "int" }, { name: "a", type: "array<int>", sizeParam: "n" }, { name: "valoare", type: "int" }],
      returns: { mode: "value", type: "int" },
    },
    official_cpp:
      "int cautaValoareAux(vector<int> a, int index, int n, int valoare) {\n    if (index == n) return -1;\n    if (a[index] == valoare) return index;\n    return cautaValoareAux(a, index + 1, n, valoare);\n}\n\nint cautaValoare(int n, vector<int> a, int valoare) {\n    return cautaValoareAux(a, 0, n, valoare);\n}\n",
    official_python:
      PY_BUMP +
      "def cautaValoareAux(a, index, n, valoare):\n    if index == n:\n        return -1\n    if a[index] == valoare:\n        return index\n    return cautaValoareAux(a, index + 1, n, valoare)\n\n\ndef cautaValoare(n, a, valoare):\n    return cautaValoareAux(a, 0, n, valoare)\n",
    tests: [
      { n: 0, a: [], valoare: 5 },
      { n: 1, a: [5], valoare: 5 },
      { n: 5, a: [1, 2, 3, 2, 1], valoare: 2 },
      { n: 4, a: [-2, -2, -2, -2], valoare: -2 },
      { n: 6, a: [1, 2, 3, 4, 5, 6], valoare: 9 },
      { n: 3, a: [0, 0, 1], valoare: 1 },
    ],
  },
  {
    slug: "recursiv-vector-palindrom",
    title: "Verificarea daca un vector este palindrom (recursiv)",
    difficulty: "medium",
    statement:
      "Implementati recursiv o functie care verifica daca un vector cu n numere intregi este palindrom (se citeste la fel de la stanga la dreapta si de la dreapta la stanga), folosind un subprogram recursiv auxiliar cu doi indecsi.",
    input_format: "Pe prima linie n, pe a doua linie n numere intregi separate prin spatiu.",
    output_format: "1 daca vectorul este palindrom, 0 in caz contrar.",
    constraints: "0 <= n <= 1000, |a[i]| <= 10^6",
    spec: { name: "esteVectorPalindrom", params: [{ name: "n", type: "int" }, { name: "a", type: "array<int>", sizeParam: "n" }], returns: { mode: "value", type: "bool" } },
    official_cpp:
      "bool esteVectorPalindromAux(vector<int> a, int i, int j) {\n    if (i >= j) return true;\n    if (a[i] != a[j]) return false;\n    return esteVectorPalindromAux(a, i + 1, j - 1);\n}\n\nbool esteVectorPalindrom(int n, vector<int> a) {\n    return esteVectorPalindromAux(a, 0, n - 1);\n}\n",
    official_python:
      PY_BUMP +
      "def esteVectorPalindromAux(a, i, j):\n    if i >= j:\n        return True\n    if a[i] != a[j]:\n        return False\n    return esteVectorPalindromAux(a, i + 1, j - 1)\n\n\ndef esteVectorPalindrom(n, a):\n    return esteVectorPalindromAux(a, 0, n - 1)\n",
    tests: [
      { n: 0, a: [] },
      { n: 1, a: [7] },
      { n: 5, a: [1, 2, 3, 2, 1] },
      { n: 4, a: [1, 2, 2, 1] },
      { n: 4, a: [1, 2, 3, 4] },
      { n: 6, a: [5, 1, 2, 2, 1, 5] },
    ],
  },
  // ---------- Grup C: siruri de caractere (6) ----------
  {
    slug: "recursiv-lungime-sir",
    title: "Lungimea unui sir de caractere (recursiv)",
    difficulty: "easy",
    statement: "Implementati recursiv o functie care calculeaza lungimea unui sir de caractere s (fara sa folositi strlen/len).",
    input_format: "Un sir de caractere s, fara spatii.",
    output_format: "Lungimea sirului s.",
    constraints: "0 <= lungime(s) <= 200, s contine doar litere mici",
    spec: { name: "lungimeSir", params: [{ name: "s", type: "string" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int lungimeSir(string s) {\n    if (s.empty()) return 0;\n    return 1 + lungimeSir(s.substr(1));\n}\n",
    official_python: "def lungimeSir(s):\n    if s == \"\":\n        return 0\n    return 1 + lungimeSir(s[1:])\n",
    tests: [{ s: "a" }, { s: "abc" }, { s: "informatica" }, { s: "recursivitate" }, { s: "x" }, { s: "abcdefghijklmnop" }],
  },
  {
    slug: "recursiv-numar-vocale",
    title: "Numarul de vocale dintr-un sir (recursiv)",
    difficulty: "easy",
    statement: "Implementati recursiv o functie care numara cate vocale (a, e, i, o, u) contine un sir de caractere s format din litere mici.",
    input_format: "Un sir de caractere s, fara spatii, format din litere mici.",
    output_format: "Numarul de vocale din s.",
    constraints: "0 <= lungime(s) <= 200",
    spec: { name: "numarVocale", params: [{ name: "s", type: "string" }], returns: { mode: "value", type: "int" } },
    official_cpp:
      "int numarVocale(string s) {\n    if (s.empty()) return 0;\n    char c = s[0];\n    int e = (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') ? 1 : 0;\n    return e + numarVocale(s.substr(1));\n}\n",
    official_python:
      "def numarVocale(s):\n    if s == \"\":\n        return 0\n    e = 1 if s[0] in \"aeiou\" else 0\n    return e + numarVocale(s[1:])\n",
    tests: [{ s: "a" }, { s: "bcdfg" }, { s: "informatica" }, { s: "aeiou" }, { s: "xyz" }, { s: "recursivitate" }],
  },
  {
    slug: "recursiv-sir-palindrom",
    title: "Verificarea daca un sir de caractere este palindrom (recursiv)",
    difficulty: "medium",
    statement: "Implementati recursiv o functie care verifica daca un sir de caractere s este palindrom.",
    input_format: "Un sir de caractere s, fara spatii, format din litere mici.",
    output_format: "1 daca s este palindrom, 0 in caz contrar.",
    constraints: "0 <= lungime(s) <= 200",
    spec: { name: "esteSirPalindrom", params: [{ name: "s", type: "string" }], returns: { mode: "value", type: "bool" } },
    official_cpp:
      "bool esteSirPalindrom(string s) {\n    int n = s.size();\n    if (n <= 1) return true;\n    if (s[0] != s[n - 1]) return false;\n    return esteSirPalindrom(s.substr(1, n - 2));\n}\n",
    official_python:
      "def esteSirPalindrom(s):\n    n = len(s)\n    if n <= 1:\n        return True\n    if s[0] != s[n - 1]:\n        return False\n    return esteSirPalindrom(s[1:n - 1])\n",
    tests: [{ s: "a" }, { s: "z" }, { s: "ana" }, { s: "abcba" }, { s: "abcd" }, { s: "capac" }],
  },
  {
    slug: "recursiv-numara-cifre-sir",
    title: "Numarul de cifre dintr-un sir de caractere (recursiv)",
    difficulty: "easy",
    statement: "Implementati recursiv o functie care numara cate caractere cifra (0-9) contine un sir de caractere s.",
    input_format: "Un sir de caractere s, fara spatii.",
    output_format: "Numarul de cifre din s.",
    constraints: "0 <= lungime(s) <= 200",
    spec: { name: "numaraCifreSir", params: [{ name: "s", type: "string" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int numaraCifreSir(string s) {\n    if (s.empty()) return 0;\n    int e = isdigit((unsigned char)s[0]) ? 1 : 0;\n    return e + numaraCifreSir(s.substr(1));\n}\n",
    official_python: "def numaraCifreSir(s):\n    if s == \"\":\n        return 0\n    e = 1 if s[0].isdigit() else 0\n    return e + numaraCifreSir(s[1:])\n",
    tests: [{ s: "a1b2c3" }, { s: "abc" }, { s: "123456" }, { s: "x9y8z7" }, { s: "a" }, { s: "info2026" }],
  },
  {
    slug: "recursiv-numara-litere-mari",
    title: "Numarul de litere mari dintr-un sir de caractere (recursiv)",
    difficulty: "easy",
    statement: "Implementati recursiv o functie care numara cate litere mari contine un sir de caractere s.",
    input_format: "Un sir de caractere s, fara spatii.",
    output_format: "Numarul de litere mari din s.",
    constraints: "0 <= lungime(s) <= 200",
    spec: { name: "numaraLitereMari", params: [{ name: "s", type: "string" }], returns: { mode: "value", type: "int" } },
    official_cpp:
      "int numaraLitereMari(string s) {\n    if (s.empty()) return 0;\n    int e = isupper((unsigned char)s[0]) ? 1 : 0;\n    return e + numaraLitereMari(s.substr(1));\n}\n",
    official_python: "def numaraLitereMari(s):\n    if s == \"\":\n        return 0\n    e = 1 if s[0].isupper() else 0\n    return e + numaraLitereMari(s[1:])\n",
    tests: [{ s: "AbCdEf" }, { s: "abc" }, { s: "ABCDEF" }, { s: "InfoRmatica" }, { s: "a" }, { s: "ZeceLaInfo" }],
  },
  {
    slug: "recursiv-inverseaza-sir",
    title: "Inversarea unui sir de caractere (recursiv)",
    difficulty: "medium",
    statement: "Implementati recursiv o functie care returneaza un sir de caractere s inversat.",
    input_format: "Un sir de caractere s, fara spatii.",
    output_format: "Sirul s, inversat.",
    constraints: "0 <= lungime(s) <= 200",
    spec: { name: "inverseazaSir", params: [{ name: "s", type: "string" }], returns: { mode: "value", type: "string" } },
    official_cpp: "string inverseazaSir(string s) {\n    if (s.empty()) return s;\n    return inverseazaSir(s.substr(1)) + s[0];\n}\n",
    official_python: "def inverseazaSir(s):\n    if s == \"\":\n        return s\n    return inverseazaSir(s[1:]) + s[0]\n",
    tests: [{ s: "a" }, { s: "abc" }, { s: "informatica" }, { s: "recursiv" }, { s: "x" }, { s: "abcdef" }],
  },
  // ---------- Grup D: matematica / diverse (5) ----------
  {
    slug: "recursiv-radacina-digitala",
    title: "Radacina digitala a unui numar (recursiv)",
    difficulty: "medium",
    statement:
      "Radacina digitala a unui numar natural n se obtine prin insumarea repetata a cifrelor lui n, pana cand se obtine un numar format dintr-o singura cifra. Implementati recursiv o functie care calculeaza radacina digitala a lui n, folosind un subprogram recursiv auxiliar pentru suma cifrelor.",
    input_format: "Un numar natural n.",
    output_format: "Radacina digitala a lui n.",
    constraints: "0 <= n <= 10^9",
    spec: { name: "radacinaDigitala", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    official_cpp:
      "int sumaCifrelorAux(int n) {\n    if (n < 10) return n;\n    return n % 10 + sumaCifrelorAux(n / 10);\n}\n\nint radacinaDigitala(int n) {\n    if (n < 10) return n;\n    return radacinaDigitala(sumaCifrelorAux(n));\n}\n",
    official_python:
      "def sumaCifrelorAux(n):\n    if n < 10:\n        return n\n    return n % 10 + sumaCifrelorAux(n // 10)\n\n\ndef radacinaDigitala(n):\n    if n < 10:\n        return n\n    return radacinaDigitala(sumaCifrelorAux(n))\n",
    tests: [{ n: 0 }, { n: 9 }, { n: 38 }, { n: 999999999 }, { n: 12345 }, { n: 100 }],
  },
  {
    slug: "recursiv-numar-divizori",
    title: "Numarul de divizori ai unui numar (recursiv)",
    difficulty: "medium",
    statement: "Implementati recursiv o functie care calculeaza cati divizori naturali are un numar natural nenul n, folosind un subprogram recursiv auxiliar care parcurge divizorii posibili de la 1 la n.",
    input_format: "Un numar natural nenul n.",
    output_format: "Numarul de divizori naturali ai lui n.",
    constraints: "1 <= n <= 2000",
    spec: { name: "numarDivizori", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "int" } },
    official_cpp:
      "int numarDivizoriAux(int n, int d) {\n    if (d > n) return 0;\n    int e = (n % d == 0) ? 1 : 0;\n    return e + numarDivizoriAux(n, d + 1);\n}\n\nint numarDivizori(int n) {\n    return numarDivizoriAux(n, 1);\n}\n",
    official_python:
      PY_BUMP +
      "def numarDivizoriAux(n, d):\n    if d > n:\n        return 0\n    e = 1 if n % d == 0 else 0\n    return e + numarDivizoriAux(n, d + 1)\n\n\ndef numarDivizori(n):\n    return numarDivizoriAux(n, 1)\n",
    tests: [{ n: 1 }, { n: 6 }, { n: 17 }, { n: 360 }, { n: 2000 }, { n: 997 }],
  },
  {
    slug: "recursiv-numar-prim",
    title: "Verificarea daca un numar este prim (recursiv)",
    difficulty: "medium",
    statement:
      "Implementati recursiv o functie care verifica daca un numar natural n este prim, folosind un subprogram recursiv auxiliar care testeaza divizorii posibili de la 2 pana la radical din n.",
    input_format: "Un numar natural n.",
    output_format: "1 daca n este prim, 0 in caz contrar.",
    constraints: "0 <= n <= 10^6",
    spec: { name: "estePrim", params: [{ name: "n", type: "int" }], returns: { mode: "value", type: "bool" } },
    official_cpp:
      "bool estePrimAux(int n, int d) {\n    if ((long long)d * d > n) return true;\n    if (n % d == 0) return false;\n    return estePrimAux(n, d + 1);\n}\n\nbool estePrim(int n) {\n    if (n < 2) return false;\n    return estePrimAux(n, 2);\n}\n",
    official_python:
      PY_BUMP +
      "def estePrimAux(n, d):\n    if d * d > n:\n        return True\n    if n % d == 0:\n        return False\n    return estePrimAux(n, d + 1)\n\n\ndef estePrim(n):\n    if n < 2:\n        return False\n    return estePrimAux(n, 2)\n",
    tests: [{ n: 0 }, { n: 1 }, { n: 2 }, { n: 17 }, { n: 100 }, { n: 999983 }],
  },
  {
    slug: "recursiv-suma-prin-adunare",
    title: "Suma a doua numere prin recursivitate (recursiv)",
    difficulty: "easy",
    statement: "Implementati recursiv o functie care calculeaza suma a doua numere naturale a si b, folosind doar operatii de incrementare/decrementare (fara operatorul +).",
    input_format: "Doua numere naturale a si b.",
    output_format: "Suma a + b.",
    constraints: "0 <= a <= 10^6, 0 <= b <= 1000",
    spec: { name: "sumaRecursivaPrinAdunare", params: [{ name: "a", type: "int" }, { name: "b", type: "int" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int sumaRecursivaPrinAdunare(int a, int b) {\n    if (b == 0) return a;\n    return sumaRecursivaPrinAdunare(a + 1, b - 1);\n}\n",
    official_python:
      PY_BUMP + "def sumaRecursivaPrinAdunare(a, b):\n    if b == 0:\n        return a\n    return sumaRecursivaPrinAdunare(a + 1, b - 1)\n",
    tests: [{ a: 0, b: 0 }, { a: 5, b: 3 }, { a: 1000000, b: 0 }, { a: 0, b: 1000 }, { a: 999, b: 1 }, { a: 100, b: 900 }],
  },
  {
    slug: "recursiv-produs-prin-adunari-repetate",
    title: "Produsul a doua numere prin adunari repetate (recursiv)",
    difficulty: "easy",
    statement: "Implementati recursiv o functie care calculeaza produsul a doua numere naturale a si b, folosind doar adunari repetate (fara operatorul *).",
    input_format: "Doua numere naturale a si b.",
    output_format: "Produsul a * b.",
    constraints: "0 <= a <= 1000, 0 <= b <= 1000",
    spec: { name: "produsPrinAdunariRepetate", params: [{ name: "a", type: "int" }, { name: "b", type: "int" }], returns: { mode: "value", type: "int" } },
    official_cpp: "int produsPrinAdunariRepetate(int a, int b) {\n    if (b == 0) return 0;\n    return a + produsPrinAdunariRepetate(a, b - 1);\n}\n",
    official_python:
      PY_BUMP + "def produsPrinAdunariRepetate(a, b):\n    if b == 0:\n        return 0\n    return a + produsPrinAdunariRepetate(a, b - 1)\n",
    tests: [{ a: 0, b: 0 }, { a: 5, b: 3 }, { a: 1000, b: 0 }, { a: 0, b: 1000 }, { a: 7, b: 6 }, { a: 999, b: 2 }],
  },
];

async function verifyAndUpsert(client, p) {
  const artifacts = generateArtifacts(p.spec);
  const fullCpp = artifacts.templates.cpp.replace("__USER_CODE__", p.official_cpp);
  const fullPython = artifacts.templates.python.replace("__USER_CODE__", p.official_python);

  const testRows = [];
  for (let i = 0; i < p.tests.length; i++) {
    const args = p.tests[i];
    const input = buildInputText(p.spec, args);
    const [cppOut, pyOut] = await Promise.all([runCustom("cpp", fullCpp, input), runCustom("python", fullPython, input)]);
    if (cppOut.verdict !== "AC") throw new Error(`${p.slug} test ${i}: cpp failed: ${JSON.stringify(cppOut)}`);
    if (pyOut.verdict !== "AC") throw new Error(`${p.slug} test ${i}: python failed: ${JSON.stringify(pyOut)}`);
    const normCpp = normalize(cppOut.stdout);
    const normPy = normalize(pyOut.stdout);
    if (normCpp !== normPy) throw new Error(`${p.slug} test ${i}: MISMATCH cpp="${normCpp}" python="${normPy}" input=${JSON.stringify(args)}`);
    testRows.push({ input, expected_output: `${normCpp}\n`, is_sample: i < 2 });
  }

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
    time_limit_ms: p.time_limit_ms || BASE_META.time_limit_ms,
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
    editorial_status: "published",
  };

  const jsonbColumns = new Set(["function_signature"]);
  const placeholderFor = (key, idx) => (jsonbColumns.has(key) ? `$${idx}::jsonb` : `$${idx}`);

  let problemId;
  if (existing.rows.length > 0) {
    problemId = existing.rows[0].id;
    const keys = Object.keys(columns);
    const setClause = keys.map((k, i) => `${k} = ${placeholderFor(k, i + 2)}`).join(", ");
    await client.query(`UPDATE problems SET ${setClause}, updated_at = NOW() WHERE id = $1`, [problemId, ...keys.map((k) => columns[k])]);
    await client.query("DELETE FROM test_cases WHERE problem_id = $1", [problemId]);
  } else {
    const keys = Object.keys(columns);
    const placeholders = keys.map((k, i) => placeholderFor(k, i + 1)).join(", ");
    const inserted = await client.query(`INSERT INTO problems (${keys.join(", ")}) VALUES (${placeholders}) RETURNING id`, keys.map((k) => columns[k]));
    problemId = inserted.rows[0].id;
  }

  for (let i = 0; i < testRows.length; i++) {
    const t = testRows[i];
    await client.query(
      `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index) VALUES ($1, $2, $3, $4, $5, $6)`,
      [problemId, t.input, t.expected_output, t.is_sample, 10, i + 1],
    );
  }

  return problemId;
}

module.exports = { problems, verifyAndUpsert, pool };

if (require.main === module) {
  (async () => {
    const onlySlugs = process.env.ONLY_SLUGS ? process.env.ONLY_SLUGS.split(",") : null;
    const toRun = onlySlugs ? problems.filter((p) => onlySlugs.includes(p.slug)) : problems;
    const client = await pool.connect();
    const results = [];
    try {
      for (const p of toRun) {
        try {
          const id = await verifyAndUpsert(client, p);
          console.log(`OK   ${p.slug} -> ${id}`);
          results.push({ slug: p.slug, ok: true });
        } catch (err) {
          console.error(`FAIL ${p.slug}: ${err.message}`);
          results.push({ slug: p.slug, ok: false, error: err.message });
        }
      }
    } finally {
      client.release();
      await pool.end();
    }
    const okCount = results.filter((r) => r.ok).length;
    console.log(`\n${okCount}/${results.length} publicate cu succes.`);
    if (okCount < results.length) process.exitCode = 1;
  })().catch((err) => {
    console.error("FATAL", err);
    process.exit(1);
  });
}
