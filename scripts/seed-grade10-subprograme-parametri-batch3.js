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
  curriculum_subcategory_id: "valori-prin-parametri",
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

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

function numDivisors(n) {
  let c = 0;
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) {
      c += 1;
      if (i !== n / i) c += 1;
    }
  }
  return c;
}

function sumDivisors(n) {
  let s = 0;
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) {
      s += i;
      if (i !== n / i) s += n / i;
    }
  }
  return s;
}

const problems = [
  {
    slug: "subprograme-suma-si-diferenta-a-doua-numere",
    title: "Suma si diferenta a doua numere",
    statement:
      "Implementati o functie care primeste doua numere intregi `a` si `b` si calculeaza suma si diferenta lor (a - b), prin parametrii de iesire `suma` si `diferenta`.",
    input_format: "Doua linii: a, apoi b.",
    output_format: "Suma si diferenta, separate printr-un spatiu.",
    constraints: "-10^9 <= a, b <= 10^9",
    spec: {
      name: "sumaSiDiferenta",
      params: [{ name: "a", type: "int" }, { name: "b", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "suma", type: "int" }, { name: "diferenta", type: "int" }] },
    },
    solve: (args) => ({ suma: args.a + args.b, diferenta: args.a - args.b }),
    tests: [
      { a: 5, b: 3 }, { a: -5, b: 3 }, { a: 0, b: 0 }, { a: 1000000000, b: 1000000000 }, { a: -1000000000, b: -1000000000 }, { a: 7, b: -7 },
    ],
    official_cpp: "void sumaSiDiferenta(int a, int b, int &suma, int &diferenta) {\n    suma = a + b;\n    diferenta = a - b;\n}\n",
    official_python: "def sumaSiDiferenta(a, b):\n    return a + b, a - b\n",
  },
  {
    slug: "subprograme-patratul-si-cubul-unui-numar",
    title: "Patratul si cubul unui numar",
    statement: "Implementati o functie care primeste un numar intreg `n` si calculeaza patratul si cubul sau, prin parametrii de iesire `patrat` si `cub`.",
    input_format: "O linie continand numarul intreg n.",
    output_format: "Patratul si cubul lui n, separate printr-un spatiu.",
    constraints: "-1000 <= n <= 1000",
    spec: {
      name: "patratSiCub",
      params: [{ name: "n", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "patrat", type: "int" }, { name: "cub", type: "int" }] },
    },
    solve: (a) => ({ patrat: a.n * a.n, cub: a.n * a.n * a.n }),
    tests: [{ n: 3 }, { n: -3 }, { n: 0 }, { n: 1000 }, { n: -1000 }, { n: 1 }],
    official_cpp: "void patratSiCub(int n, int &patrat, int &cub) {\n    patrat = n * n;\n    cub = n * n * n;\n}\n",
    official_python: "def patratSiCub(n):\n    return n * n, n * n * n\n",
  },
  {
    slug: "subprograme-cifra-maxima-si-minima",
    title: "Cifra maxima si cifra minima ale unui numar",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si determina cea mai mare si cea mai mica cifra a sa, prin parametrii de iesire `maxima` si `minima`.",
    input_format: "O linie continand numarul natural n (n >= 1).",
    output_format: "Cifra maxima si cifra minima ale lui n, separate printr-un spatiu.",
    constraints: "1 <= n <= 10^9",
    spec: {
      name: "cifraMaximaSiMinima",
      params: [{ name: "n", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "maxima", type: "int" }, { name: "minima", type: "int" }] },
    },
    solve: (a) => {
      let n = a.n, mx = 0, mn = 9;
      while (n > 0) {
        const d = n % 10;
        if (d > mx) mx = d;
        if (d < mn) mn = d;
        n = Math.floor(n / 10);
      }
      return { maxima: mx, minima: mn };
    },
    tests: [{ n: 1234 }, { n: 7 }, { n: 900001 }, { n: 111111 }, { n: 87654321 }, { n: 500 }],
    official_cpp: "void cifraMaximaSiMinima(int n, int &maxima, int &minima) {\n    maxima = 0;\n    minima = 9;\n    while (n > 0) {\n        int d = n % 10;\n        if (d > maxima) maxima = d;\n        if (d < minima) minima = d;\n        n /= 10;\n    }\n}\n",
    official_python: "def cifraMaximaSiMinima(n):\n    mx, mn = 0, 9\n    while n > 0:\n        d = n % 10\n        if d > mx: mx = d\n        if d < mn: mn = d\n        n //= 10\n    return mx, mn\n",
  },
  {
    slug: "subprograme-numarul-de-cifre-pare-si-impare",
    title: "Numarul de cifre pare si impare ale unui numar",
    statement: "Implementati o functie care primeste un numar natural `n` si determina cate dintre cifrele sale sunt pare si cate sunt impare, prin parametrii de iesire `pare` si `impare`.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Numarul de cifre pare si numarul de cifre impare, separate printr-un spatiu.",
    constraints: "0 <= n <= 10^9",
    spec: {
      name: "cifrePareSiImpare",
      params: [{ name: "n", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "pare", type: "int" }, { name: "impare", type: "int" }] },
    },
    solve: (a) => {
      let n = a.n, pare = 0, impare = 0;
      if (n === 0) return { pare: 1, impare: 0 };
      while (n > 0) {
        if (n % 10 % 2 === 0) pare++; else impare++;
        n = Math.floor(n / 10);
      }
      return { pare, impare };
    },
    tests: [{ n: 1234 }, { n: 0 }, { n: 2468 }, { n: 13579 }, { n: 111111111 }, { n: 900001 }],
    official_cpp: "void cifrePareSiImpare(int n, int &pare, int &impare) {\n    pare = 0; impare = 0;\n    if (n == 0) { pare = 1; return; }\n    while (n > 0) {\n        if ((n % 10) % 2 == 0) pare++; else impare++;\n        n /= 10;\n    }\n}\n",
    official_python: "def cifrePareSiImpare(n):\n    if n == 0:\n        return 1, 0\n    pare, impare = 0, 0\n    while n > 0:\n        if (n % 10) % 2 == 0: pare += 1\n        else: impare += 1\n        n //= 10\n    return pare, impare\n",
  },
  {
    slug: "subprograme-suma-cifrelor-pare-si-impare",
    title: "Suma cifrelor pare si suma cifrelor impare ale unui numar",
    statement: "Implementati o functie care primeste un numar natural `n` si calculeaza suma cifrelor sale pare si suma cifrelor sale impare, prin parametrii de iesire `sumaPare` si `sumaImpare`.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Suma cifrelor pare si suma cifrelor impare, separate printr-un spatiu.",
    constraints: "0 <= n <= 10^9",
    spec: {
      name: "sumaCifrePareSiImpare",
      params: [{ name: "n", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "sumaPare", type: "int" }, { name: "sumaImpare", type: "int" }] },
    },
    solve: (a) => {
      let n = a.n, sp = 0, si = 0;
      while (n > 0) {
        const d = n % 10;
        if (d % 2 === 0) sp += d; else si += d;
        n = Math.floor(n / 10);
      }
      return { sumaPare: sp, sumaImpare: si };
    },
    tests: [{ n: 1234 }, { n: 0 }, { n: 2468 }, { n: 13579 }, { n: 111111111 }, { n: 900001 }],
    official_cpp: "void sumaCifrePareSiImpare(int n, int &sumaPare, int &sumaImpare) {\n    sumaPare = 0; sumaImpare = 0;\n    while (n > 0) {\n        int d = n % 10;\n        if (d % 2 == 0) sumaPare += d; else sumaImpare += d;\n        n /= 10;\n    }\n}\n",
    official_python: "def sumaCifrePareSiImpare(n):\n    sp, si = 0, 0\n    while n > 0:\n        d = n % 10\n        if d % 2 == 0: sp += d\n        else: si += d\n        n //= 10\n    return sp, si\n",
  },
  {
    slug: "subprograme-aria-si-perimetrul-dreptunghiului",
    title: "Aria si perimetrul unui dreptunghi",
    statement: "Implementati o functie care primeste lungimea `l` si latimea `w` ale unui dreptunghi si calculeaza aria si perimetrul sau, prin parametrii de iesire `arie` si `perimetru`.",
    input_format: "Doua linii: l, apoi w.",
    output_format: "Aria si perimetrul, separate printr-un spatiu.",
    constraints: "1 <= l, w <= 10^4",
    spec: {
      name: "ariaSiPerimetrulDreptunghiului",
      params: [{ name: "l", type: "int" }, { name: "w", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "arie", type: "int" }, { name: "perimetru", type: "int" }] },
    },
    solve: (a) => ({ arie: a.l * a.w, perimetru: 2 * (a.l + a.w) }),
    tests: [{ l: 4, w: 5 }, { l: 1, w: 1 }, { l: 10000, w: 1 }, { l: 7, w: 3 }, { l: 100, w: 100 }, { l: 2, w: 9999 }],
    official_cpp: "void ariaSiPerimetrulDreptunghiului(int l, int w, int &arie, int &perimetru) {\n    arie = l * w;\n    perimetru = 2 * (l + w);\n}\n",
    official_python: "def ariaSiPerimetrulDreptunghiului(l, w):\n    return l * w, 2 * (l + w)\n",
  },
  {
    slug: "subprograme-aria-si-perimetrul-patratului",
    title: "Aria si perimetrul unui patrat",
    statement: "Implementati o functie care primeste latura `latura` a unui patrat si calculeaza aria si perimetrul sau, prin parametrii de iesire `arie` si `perimetru`.",
    input_format: "O linie continand latura (numar intreg).",
    output_format: "Aria si perimetrul, separate printr-un spatiu.",
    constraints: "1 <= latura <= 10^4",
    spec: {
      name: "ariaSiPerimetrulPatratului",
      params: [{ name: "latura", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "arie", type: "int" }, { name: "perimetru", type: "int" }] },
    },
    solve: (a) => ({ arie: a.latura * a.latura, perimetru: 4 * a.latura }),
    tests: [{ latura: 5 }, { latura: 1 }, { latura: 10000 }, { latura: 7 }, { latura: 100 }, { latura: 42 }],
    official_cpp: "void ariaSiPerimetrulPatratului(int latura, int &arie, int &perimetru) {\n    arie = latura * latura;\n    perimetru = 4 * latura;\n}\n",
    official_python: "def ariaSiPerimetrulPatratului(latura):\n    return latura * latura, 4 * latura\n",
  },
  {
    slug: "subprograme-aria-si-circumferinta-cercului",
    title: "Aria si circumferinta unui cerc",
    statement: "Implementati o functie care primeste raza `raza` a unui cerc (numar real) si calculeaza aria si circumferinta sa, prin parametrii de iesire `arie` si `circumferinta`. Folositi π = 3.14159265358979323846. Rezultatele se afiseaza cu 2 zecimale.",
    input_format: "O linie continand raza (numar real).",
    output_format: "Aria si circumferinta, separate printr-un spatiu, fiecare cu 2 zecimale.",
    constraints: "0.01 <= raza <= 10^4",
    spec: {
      name: "ariaSiCircumferintaCercului",
      params: [{ name: "raza", type: "real" }],
      returns: { mode: "out-params", outs: [{ name: "arie", type: "real" }, { name: "circumferinta", type: "real" }] },
    },
    solve: (a) => ({ arie: Math.PI * a.raza * a.raza, circumferinta: 2 * Math.PI * a.raza }),
    tests: [{ raza: 1 }, { raza: 2.5 }, { raza: 0.01 }, { raza: 10000 }, { raza: 3.14 }, { raza: 100 }],
    official_cpp: "void ariaSiCircumferintaCercului(double raza, double &arie, double &circumferinta) {\n    const double PI = 3.14159265358979323846;\n    arie = PI * raza * raza;\n    circumferinta = 2 * PI * raza;\n}\n",
    official_python: "import math\ndef ariaSiCircumferintaCercului(raza):\n    return math.pi * raza * raza, 2 * math.pi * raza\n",
  },
  {
    slug: "subprograme-cmmdc-si-cmmmc",
    title: "Cel mai mare divizor comun si cel mai mic multiplu comun",
    statement: "Implementati o functie care primeste doua numere naturale nenule `a` si `b` si calculeaza cel mai mare divizor comun si cel mai mic multiplu comun al lor, prin parametrii de iesire `cmmdc` si `cmmmc`.",
    input_format: "Doua linii: a, apoi b.",
    output_format: "Cmmdc si cmmmc, separate printr-un spatiu.",
    constraints: "1 <= a, b <= 1000",
    spec: {
      name: "cmmdcSiCmmmc",
      params: [{ name: "a", type: "int" }, { name: "b", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "cmmdc", type: "int" }, { name: "cmmmc", type: "int" }] },
    },
    solve: (args) => { const g = gcd(args.a, args.b); return { cmmdc: g, cmmmc: (args.a / g) * args.b }; },
    tests: [{ a: 24, b: 36 }, { a: 17, b: 5 }, { a: 1, b: 1 }, { a: 100, b: 75 }, { a: 48, b: 18 }, { a: 997, b: 991 }],
    official_cpp: "int cmmdcAux(int a, int b) { while (b) { int r = a % b; a = b; b = r; } return a; }\nvoid cmmdcSiCmmmc(int a, int b, int &cmmdc, int &cmmmc) {\n    cmmdc = cmmdcAux(a, b);\n    cmmmc = (a / cmmdc) * b;\n}\n",
    official_python: "def cmmdcSiCmmmc(a, b):\n    x, y = a, b\n    while y:\n        x, y = y, x % y\n    return x, (a // x) * b\n",
  },
  {
    slug: "subprograme-secunde-in-ore-minute-si-secunde",
    title: "Transformarea secundelor in ore, minute si secunde",
    statement: "Implementati o functie care primeste un numar de secunde `secunde` si il transforma in ore, minute si secunde ramase, prin parametrii de iesire `ore`, `minute` si `secunde2`.",
    input_format: "O linie continand numarul natural de secunde.",
    output_format: "Orele, minutele si secundele ramase, separate prin spatiu.",
    constraints: "0 <= secunde <= 10^7",
    spec: {
      name: "secundeInOreMinuteSecunde",
      params: [{ name: "secunde", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "ore", type: "int" }, { name: "minute", type: "int" }, { name: "secunde2", type: "int" }] },
    },
    solve: (a) => { const ore = Math.floor(a.secunde / 3600); const rest = a.secunde % 3600; return { ore, minute: Math.floor(rest / 60), secunde2: rest % 60 }; },
    tests: [{ secunde: 3661 }, { secunde: 0 }, { secunde: 59 }, { secunde: 3600 }, { secunde: 86399 }, { secunde: 10000000 }],
    official_cpp: "void secundeInOreMinuteSecunde(int secunde, int &ore, int &minute, int &secunde2) {\n    ore = secunde / 3600;\n    int rest = secunde % 3600;\n    minute = rest / 60;\n    secunde2 = rest % 60;\n}\n",
    official_python: "def secundeInOreMinuteSecunde(secunde):\n    ore = secunde // 3600\n    rest = secunde % 3600\n    return ore, rest // 60, rest % 60\n",
  },
  {
    slug: "subprograme-minute-in-ore-si-minute",
    title: "Transformarea minutelor in ore si minute",
    statement: "Implementati o functie care primeste un numar de minute `minute` si il transforma in ore si minute ramase, prin parametrii de iesire `ore` si `minute2`.",
    input_format: "O linie continand numarul natural de minute.",
    output_format: "Orele si minutele ramase, separate printr-un spatiu.",
    constraints: "0 <= minute <= 10^6",
    spec: {
      name: "minuteInOreSiMinute",
      params: [{ name: "minute", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "ore", type: "int" }, { name: "minute2", type: "int" }] },
    },
    solve: (a) => ({ ore: Math.floor(a.minute / 60), minute2: a.minute % 60 }),
    tests: [{ minute: 125 }, { minute: 0 }, { minute: 59 }, { minute: 60 }, { minute: 1439 }, { minute: 1000000 }],
    official_cpp: "void minuteInOreSiMinute(int minute, int &ore, int &minute2) {\n    ore = minute / 60;\n    minute2 = minute % 60;\n}\n",
    official_python: "def minuteInOreSiMinute(minute):\n    return minute // 60, minute % 60\n",
  },
  {
    slug: "subprograme-numarul-de-cifre-prime-si-compuse",
    title: "Numarul de cifre prime si compuse ale unui numar",
    statement: "Implementati o functie care primeste un numar natural `n` si determina cate din cifrele sale sunt prime (2, 3, 5, 7) si cate sunt compuse (4, 6, 8, 9), prin parametrii de iesire `prime` si `compuse`. Cifrele 0 si 1 nu se numara la niciuna dintre categorii.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Numarul de cifre prime si numarul de cifre compuse, separate printr-un spatiu.",
    constraints: "0 <= n <= 10^9",
    spec: {
      name: "cifrePrimeSiCompuse",
      params: [{ name: "n", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "prime", type: "int" }, { name: "compuse", type: "int" }] },
    },
    solve: (a) => {
      let n = a.n, prime = 0, compuse = 0;
      const setPrime = new Set([2, 3, 5, 7]);
      const setCompuse = new Set([4, 6, 8, 9]);
      if (n === 0) return { prime: 0, compuse: 0 };
      while (n > 0) {
        const d = n % 10;
        if (setPrime.has(d)) prime++;
        else if (setCompuse.has(d)) compuse++;
        n = Math.floor(n / 10);
      }
      return { prime, compuse };
    },
    tests: [{ n: 1234 }, { n: 0 }, { n: 2357 }, { n: 4689 }, { n: 111111 }, { n: 900001 }],
    official_cpp: "void cifrePrimeSiCompuse(int n, int &prime, int &compuse) {\n    prime = 0; compuse = 0;\n    while (n > 0) {\n        int d = n % 10;\n        if (d == 2 || d == 3 || d == 5 || d == 7) prime++;\n        else if (d == 4 || d == 6 || d == 8 || d == 9) compuse++;\n        n /= 10;\n    }\n}\n",
    official_python: "def cifrePrimeSiCompuse(n):\n    prime, compuse = 0, 0\n    while n > 0:\n        d = n % 10\n        if d in (2, 3, 5, 7): prime += 1\n        elif d in (4, 6, 8, 9): compuse += 1\n        n //= 10\n    return prime, compuse\n",
  },
  {
    slug: "subprograme-suma-patratelor-si-suma-cuburilor",
    title: "Suma patratelor si suma cuburilor a doua numere",
    statement: "Implementati o functie care primeste doua numere intregi `a` si `b` si calculeaza suma patratelor lor si suma cuburilor lor, prin parametrii de iesire `sumaPatrate` si `sumaCuburi`.",
    input_format: "Doua linii: a, apoi b.",
    output_format: "Suma patratelor si suma cuburilor, separate printr-un spatiu.",
    constraints: "-800 <= a, b <= 800",
    spec: {
      name: "sumaPatrateSiCuburi",
      params: [{ name: "a", type: "int" }, { name: "b", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "sumaPatrate", type: "int" }, { name: "sumaCuburi", type: "int" }] },
    },
    solve: (args) => ({ sumaPatrate: args.a * args.a + args.b * args.b, sumaCuburi: args.a ** 3 + args.b ** 3 }),
    tests: [{ a: 2, b: 3 }, { a: -2, b: 3 }, { a: 0, b: 0 }, { a: 800, b: 1 }, { a: -800, b: -800 }, { a: 5, b: -5 }],
    official_cpp: "void sumaPatrateSiCuburi(int a, int b, int &sumaPatrate, int &sumaCuburi) {\n    sumaPatrate = a * a + b * b;\n    sumaCuburi = a * a * a + b * b * b;\n}\n",
    official_python: "def sumaPatrateSiCuburi(a, b):\n    return a * a + b * b, a ** 3 + b ** 3\n",
  },
  {
    slug: "subprograme-minimul-si-maximul-a-trei-numere",
    title: "Minimul si maximul a trei numere",
    statement: "Implementati o functie care primeste trei numere intregi `a`, `b` si `c` si determina minimul si maximul lor, prin parametrii de iesire `mn` si `mx`.",
    input_format: "Trei linii: a, b, apoi c.",
    output_format: "Minimul si maximul, separate printr-un spatiu.",
    constraints: "-10^9 <= a, b, c <= 10^9",
    spec: {
      name: "minMax3",
      params: [{ name: "a", type: "int" }, { name: "b", type: "int" }, { name: "c", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "mn", type: "int" }, { name: "mx", type: "int" }] },
    },
    solve: (args) => ({ mn: Math.min(args.a, args.b, args.c), mx: Math.max(args.a, args.b, args.c) }),
    tests: [{ a: 3, b: 8, c: 1 }, { a: 8, b: 3, c: 8 }, { a: -5, b: 5, c: 0 }, { a: 0, b: 0, c: 0 }, { a: -100, b: -200, c: -50 }, { a: 1000000000, b: -1000000000, c: 0 }],
    official_cpp: "void minMax3(int a, int b, int c, int &mn, int &mx) {\n    mn = min({a, b, c});\n    mx = max({a, b, c});\n}\n",
    official_python: "def minMax3(a, b, c):\n    return min(a, b, c), max(a, b, c)\n",
  },
  {
    slug: "subprograme-suma-si-numarul-divizorilor",
    title: "Suma si numarul divizorilor unui numar",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si calculeaza suma tuturor divizorilor sai si numarul lor, prin parametrii de iesire `suma` si `numar`.",
    input_format: "O linie continand numarul natural n (n >= 1).",
    output_format: "Suma divizorilor si numarul lor, separate printr-un spatiu.",
    constraints: "1 <= n <= 10^6",
    spec: {
      name: "sumaSiNumarulDivizorilor",
      params: [{ name: "n", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "suma", type: "int" }, { name: "numar", type: "int" }] },
    },
    solve: (a) => ({ suma: sumDivisors(a.n), numar: numDivisors(a.n) }),
    tests: [{ n: 36 }, { n: 1 }, { n: 97 }, { n: 100 }, { n: 60 }, { n: 999983 }],
    official_cpp: "void sumaSiNumarulDivizorilor(int n, int &suma, int &numar) {\n    suma = 0; numar = 0;\n    for (int i = 1; (long long)i * i <= n; i++) {\n        if (n % i == 0) {\n            suma += i; numar++;\n            if (i != n / i) { suma += n / i; numar++; }\n        }\n    }\n}\n",
    official_python: "def sumaSiNumarulDivizorilor(n):\n    suma, numar = 0, 0\n    i = 1\n    while i * i <= n:\n        if n % i == 0:\n            suma += i; numar += 1\n            if i != n // i:\n                suma += n // i; numar += 1\n        i += 1\n    return suma, numar\n",
  },
  {
    slug: "subprograme-numarul-de-divizori-pari-si-impari",
    title: "Numarul de divizori pari si impari ai unui numar",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si calculeaza cati dintre divizorii sai sunt pari si cati sunt impari, prin parametrii de iesire `pari` si `impari`.",
    input_format: "O linie continand numarul natural n (n >= 1).",
    output_format: "Numarul de divizori pari si numarul de divizori impari, separate printr-un spatiu.",
    constraints: "1 <= n <= 10^6",
    spec: {
      name: "divizoriPariSiImpari",
      params: [{ name: "n", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "pari", type: "int" }, { name: "impari", type: "int" }] },
    },
    solve: (a) => {
      let pari = 0, impari = 0;
      for (let i = 1; i * i <= a.n; i++) {
        if (a.n % i === 0) {
          for (const d of new Set([i, a.n / i])) { if (d % 2 === 0) pari++; else impari++; }
        }
      }
      return { pari, impari };
    },
    tests: [{ n: 36 }, { n: 1 }, { n: 97 }, { n: 100 }, { n: 60 }, { n: 999983 }],
    official_cpp: "void divizoriPariSiImpari(int n, int &pari, int &impari) {\n    pari = 0; impari = 0;\n    for (int i = 1; (long long)i * i <= n; i++) {\n        if (n % i == 0) {\n            if (i % 2 == 0) pari++; else impari++;\n            int j = n / i;\n            if (j != i) { if (j % 2 == 0) pari++; else impari++; }\n        }\n    }\n}\n",
    official_python: "def divizoriPariSiImpari(n):\n    pari, impari = 0, 0\n    i = 1\n    while i * i <= n:\n        if n % i == 0:\n            for d in {i, n // i}:\n                if d % 2 == 0: pari += 1\n                else: impari += 1\n        i += 1\n    return pari, impari\n",
  },
  {
    slug: "subprograme-cifra-zecilor-si-a-unitatilor",
    title: "Cifra zecilor si cifra unitatilor unui numar",
    statement: "Implementati o functie care primeste un numar natural `n` cu cel mult doua cifre (0 <= n <= 99) si determina cifra zecilor si cifra unitatilor, prin parametrii de iesire `zeci` si `unitati`.",
    input_format: "O linie continand numarul natural n (0 <= n <= 99).",
    output_format: "Cifra zecilor si cifra unitatilor, separate printr-un spatiu.",
    constraints: "0 <= n <= 99",
    spec: {
      name: "cifraZecilorSiUnitatilor",
      params: [{ name: "n", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "zeci", type: "int" }, { name: "unitati", type: "int" }] },
    },
    solve: (a) => ({ zeci: Math.floor(a.n / 10), unitati: a.n % 10 }),
    tests: [{ n: 47 }, { n: 0 }, { n: 9 }, { n: 10 }, { n: 99 }, { n: 50 }],
    official_cpp: "void cifraZecilorSiUnitatilor(int n, int &zeci, int &unitati) {\n    zeci = n / 10;\n    unitati = n % 10;\n}\n",
    official_python: "def cifraZecilorSiUnitatilor(n):\n    return n // 10, n % 10\n",
  },
  {
    slug: "subprograme-aria-si-ipotenuza-triunghiului-dreptunghic",
    title: "Aria si ipotenuza unui triunghi dreptunghic",
    statement: "Implementati o functie care primeste lungimile celor doua catete `a` si `b` ale unui triunghi dreptunghic (numere intregi) si calculeaza aria si ipotenuza sa, prin parametrii de iesire `aria` si `ipotenuza` (numere reale, afisate cu 2 zecimale).",
    input_format: "Doua linii: a, apoi b (catetele).",
    output_format: "Aria si ipotenuza, separate printr-un spatiu, fiecare cu 2 zecimale.",
    constraints: "1 <= a, b <= 10^4",
    spec: {
      name: "ariaSiIpotenuzaTriunghiDreptunghic",
      params: [{ name: "a", type: "int" }, { name: "b", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "aria", type: "real" }, { name: "ipotenuza", type: "real" }] },
    },
    solve: (args) => ({ aria: (args.a * args.b) / 2, ipotenuza: Math.sqrt(args.a * args.a + args.b * args.b) }),
    tests: [{ a: 3, b: 4 }, { a: 1, b: 1 }, { a: 6, b: 8 }, { a: 5, b: 12 }, { a: 10000, b: 1 }, { a: 7, b: 9 }],
    official_cpp: "#include <cmath>\nvoid ariaSiIpotenuzaTriunghiDreptunghic(int a, int b, double &aria, double &ipotenuza) {\n    aria = (a * (double)b) / 2.0;\n    ipotenuza = sqrt((double)a * a + (double)b * b);\n}\n",
    official_python: "import math\ndef ariaSiIpotenuzaTriunghiDreptunghic(a, b):\n    return (a * b) / 2.0, math.sqrt(a * a + b * b)\n",
  },
  {
    slug: "subprograme-tva-si-pretul-final",
    title: "Calculul TVA-ului si al pretului final",
    statement: "Implementati o functie care primeste pretul fara TVA `pret` si cota de TVA `cota` (procent, numere reale) si calculeaza valoarea TVA-ului si pretul final (cu TVA inclus), prin parametrii de iesire `tva` si `pretFinal`.",
    input_format: "Doua linii: pret, apoi cota (procent).",
    output_format: "TVA-ul si pretul final, separate printr-un spatiu, fiecare cu 2 zecimale.",
    constraints: "0 <= pret <= 10^6, 0 <= cota <= 100",
    spec: {
      name: "tvaSiPretFinal",
      params: [{ name: "pret", type: "real" }, { name: "cota", type: "real" }],
      returns: { mode: "out-params", outs: [{ name: "tva", type: "real" }, { name: "pretFinal", type: "real" }] },
    },
    solve: (args) => { const tva = (args.pret * args.cota) / 100; return { tva, pretFinal: args.pret + tva }; },
    tests: [{ pret: 100, cota: 19 }, { pret: 0, cota: 19 }, { pret: 250.5, cota: 9 }, { pret: 1000000, cota: 100 }, { pret: 19.99, cota: 0 }, { pret: 50, cota: 5 }],
    official_cpp: "void tvaSiPretFinal(double pret, double cota, double &tva, double &pretFinal) {\n    tva = (pret * cota) / 100.0;\n    pretFinal = pret + tva;\n}\n",
    official_python: "def tvaSiPretFinal(pret, cota):\n    tva = (pret * cota) / 100.0\n    return tva, pret + tva\n",
  },
  {
    slug: "subprograme-suma-si-produsul-primelor-n-numere-naturale",
    title: "Suma si produsul primelor n numere naturale",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si calculeaza suma si produsul numerelor naturale de la 1 la n, prin parametrii de iesire `suma` si `produs`.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Suma si produsul, separate printr-un spatiu.",
    constraints: "1 <= n <= 12",
    spec: {
      name: "sumaSiProdusulPrimelorN",
      params: [{ name: "n", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "suma", type: "int" }, { name: "produs", type: "int" }] },
    },
    solve: (a) => { let suma = 0, produs = 1; for (let i = 1; i <= a.n; i++) { suma += i; produs *= i; } return { suma, produs }; },
    tests: [{ n: 1 }, { n: 5 }, { n: 12 }, { n: 2 }, { n: 10 }, { n: 7 }],
    official_cpp: "void sumaSiProdusulPrimelorN(int n, int &suma, int &produs) {\n    suma = 0; produs = 1;\n    for (int i = 1; i <= n; i++) { suma += i; produs *= i; }\n}\n",
    official_python: "def sumaSiProdusulPrimelorN(n):\n    suma, produs = 0, 1\n    for i in range(1, n + 1):\n        suma += i\n        produs *= i\n    return suma, produs\n",
  },
  {
    slug: "subprograme-suma-si-produsul-primilor-n-termeni-fibonacci",
    title: "Suma si produsul primilor n termeni Fibonacci",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si calculeaza suma si produsul primilor `n` termeni ai sirului Fibonacci (1, 1, 2, 3, 5, 8, ...), prin parametrii de iesire `suma` si `produs`.",
    input_format: "O linie continand numarul natural n.",
    output_format: "Suma si produsul, separate printr-un spatiu.",
    constraints: "1 <= n <= 10",
    spec: {
      name: "sumaSiProdusulFibonacci",
      params: [{ name: "n", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "suma", type: "int" }, { name: "produs", type: "int" }] },
    },
    solve: (a) => {
      let x = 1, y = 1, suma = 0, produs = 1;
      for (let i = 0; i < a.n; i++) {
        suma += x; produs *= x;
        const nx = x + y; x = y; y = nx;
      }
      return { suma, produs };
    },
    tests: [{ n: 1 }, { n: 2 }, { n: 5 }, { n: 10 }, { n: 3 }, { n: 8 }],
    official_cpp: "void sumaSiProdusulFibonacci(int n, int &suma, int &produs) {\n    long long a = 1, b = 1;\n    suma = 0; produs = 1;\n    for (int i = 0; i < n; i++) {\n        suma += (int)a; produs *= (int)a;\n        long long next = a + b;\n        a = b; b = next;\n    }\n}\n",
    official_python: "def sumaSiProdusulFibonacci(n):\n    a, b = 1, 1\n    suma, produs = 0, 1\n    for _ in range(n):\n        suma += a\n        produs *= a\n        a, b = b, a + b\n    return suma, produs\n",
  },
  {
    slug: "subprograme-minimul-si-maximul-a-trei-numere-reale",
    title: "Minimul si maximul a trei numere reale",
    statement: "Implementati o functie care primeste trei numere reale `x`, `y` si `z` si determina minimul si maximul lor, prin parametrii de iesire `mn` si `mx`.",
    input_format: "Trei linii: x, y, apoi z.",
    output_format: "Minimul si maximul, separate printr-un spatiu, fiecare cu 2 zecimale.",
    constraints: "-10^6 <= x, y, z <= 10^6",
    spec: {
      name: "minMax3Reale",
      params: [{ name: "x", type: "real" }, { name: "y", type: "real" }, { name: "z", type: "real" }],
      returns: { mode: "out-params", outs: [{ name: "mn", type: "real" }, { name: "mx", type: "real" }] },
    },
    solve: (args) => ({ mn: Math.min(args.x, args.y, args.z), mx: Math.max(args.x, args.y, args.z) }),
    tests: [{ x: 3.5, y: 8.25, z: 1.1 }, { x: -5.5, y: 5.5, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 1000000, y: -1000000, z: 0.5 }, { x: 2.71, y: 3.14, z: 1.41 }, { x: -1, y: -2, z: -3 }],
    official_cpp: "void minMax3Reale(double x, double y, double z, double &mn, double &mx) {\n    mn = min({x, y, z});\n    mx = max({x, y, z});\n}\n",
    official_python: "def minMax3Reale(x, y, z):\n    return min(x, y, z), max(x, y, z)\n",
  },
  {
    slug: "subprograme-suma-si-media-a-doua-numere-reale",
    title: "Suma si media a doua numere reale",
    statement: "Implementati o functie care primeste doua numere reale `a` si `b` si calculeaza suma si media lor aritmetica, prin parametrii de iesire `suma` si `medie`.",
    input_format: "Doua linii: a, apoi b.",
    output_format: "Suma si media, separate printr-un spatiu, fiecare cu 2 zecimale.",
    constraints: "-10^6 <= a, b <= 10^6",
    spec: {
      name: "sumaSiMedia",
      params: [{ name: "a", type: "real" }, { name: "b", type: "real" }],
      returns: { mode: "out-params", outs: [{ name: "suma", type: "real" }, { name: "medie", type: "real" }] },
    },
    solve: (args) => ({ suma: args.a + args.b, medie: (args.a + args.b) / 2 }),
    tests: [{ a: 5, b: 3 }, { a: -5, b: 3 }, { a: 0, b: 0 }, { a: 1000000, b: 1000000 }, { a: 2.5, b: 3.5 }, { a: 7.25, b: -7.25 }],
    official_cpp: "void sumaSiMedia(double a, double b, double &suma, double &medie) {\n    suma = a + b;\n    medie = suma / 2.0;\n}\n",
    official_python: "def sumaSiMedia(a, b):\n    s = a + b\n    return s, s / 2.0\n",
  },
  {
    slug: "subprograme-aria-si-diagonala-patratului",
    title: "Aria si diagonala unui patrat",
    statement: "Implementati o functie care primeste latura `latura` a unui patrat (numar intreg) si calculeaza aria (numar intreg) si diagonala sa (numar real, egala cu latura * radical din 2), prin parametrii de iesire `arie` si `diagonala`.",
    input_format: "O linie continand latura (numar intreg).",
    output_format: "Aria si diagonala, separate printr-un spatiu. Diagonala se afiseaza cu 2 zecimale.",
    constraints: "1 <= latura <= 10^4",
    spec: {
      name: "ariaSiDiagonalaPatratului",
      params: [{ name: "latura", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "arie", type: "int" }, { name: "diagonala", type: "real" }] },
    },
    solve: (a) => ({ arie: a.latura * a.latura, diagonala: a.latura * Math.SQRT2 }),
    tests: [{ latura: 1 }, { latura: 5 }, { latura: 10000 }, { latura: 2 }, { latura: 100 }, { latura: 7 }],
    official_cpp: "#include <cmath>\nvoid ariaSiDiagonalaPatratului(int latura, int &arie, double &diagonala) {\n    arie = latura * latura;\n    diagonala = latura * sqrt(2.0);\n}\n",
    official_python: "import math\ndef ariaSiDiagonalaPatratului(latura):\n    return latura * latura, latura * math.sqrt(2)\n",
  },
  {
    slug: "subprograme-numarul-divizorilor-si-suma-cifrelor",
    title: "Numarul divizorilor si suma cifrelor unui numar",
    statement: "Implementati o functie care primeste un numar natural nenul `n` si calculeaza numarul divizorilor sai si suma cifrelor sale, prin parametrii de iesire `divizori` si `sumaCifre`.",
    input_format: "O linie continand numarul natural n (n >= 1).",
    output_format: "Numarul divizorilor si suma cifrelor, separate printr-un spatiu.",
    constraints: "1 <= n <= 10^6",
    spec: {
      name: "divizoriSiSumaCifre",
      params: [{ name: "n", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "divizori", type: "int" }, { name: "sumaCifre", type: "int" }] },
    },
    solve: (a) => ({ divizori: numDivisors(a.n), sumaCifre: digitSum(a.n) }),
    tests: [{ n: 36 }, { n: 1 }, { n: 97 }, { n: 100 }, { n: 999983 }, { n: 123456 }],
    official_cpp: "void divizoriSiSumaCifre(int n, int &divizori, int &sumaCifre) {\n    divizori = 0;\n    for (int i = 1; (long long)i * i <= n; i++) {\n        if (n % i == 0) { divizori++; if (i != n / i) divizori++; }\n    }\n    sumaCifre = 0;\n    int m = n;\n    while (m > 0) { sumaCifre += m % 10; m /= 10; }\n}\n",
    official_python: "def divizoriSiSumaCifre(n):\n    divizori = 0\n    i = 1\n    while i * i <= n:\n        if n % i == 0:\n            divizori += 1\n            if i != n // i: divizori += 1\n        i += 1\n    sumaCifre = sum(int(c) for c in str(n))\n    return divizori, sumaCifre\n",
  },
  {
    slug: "subprograme-paritatea-si-semnul-unui-numar",
    title: "Paritatea si semnul unui numar",
    statement: "Implementati o functie care primeste un numar intreg nenul `n` si determina daca este par si daca este pozitiv, prin parametrii de iesire `par` si `pozitiv`.",
    input_format: "O linie continand numarul intreg nenul n.",
    output_format: "1 daca n este par altfel 0, apoi 1 daca n este pozitiv altfel 0, separate printr-un spatiu.",
    constraints: "-10^9 <= n <= 10^9, n != 0",
    spec: {
      name: "paritateSiSemn",
      params: [{ name: "n", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "par", type: "bool" }, { name: "pozitiv", type: "bool" }] },
    },
    solve: (a) => ({ par: a.n % 2 === 0, pozitiv: a.n > 0 }),
    tests: [{ n: 4 }, { n: -4 }, { n: 7 }, { n: -7 }, { n: 1000000000 }, { n: -1 }],
    official_cpp: "void paritateSiSemn(int n, bool &par, bool &pozitiv) {\n    par = (n % 2 == 0);\n    pozitiv = (n > 0);\n}\n",
    official_python: "def paritateSiSemn(n):\n    return n % 2 == 0, n > 0\n",
  },
  {
    slug: "subprograme-divizibilitatea-cu-3-si-cu-5",
    title: "Verificarea divizibilitatii cu 3 si cu 5",
    statement: "Implementati o functie care primeste un numar intreg `n` si verifica daca este divizibil cu 3 si daca este divizibil cu 5, prin parametrii de iesire `div3` si `div5`.",
    input_format: "O linie continand numarul intreg n.",
    output_format: "1 daca n este divizibil cu 3 altfel 0, apoi 1 daca n este divizibil cu 5 altfel 0, separate printr-un spatiu.",
    constraints: "-10^9 <= n <= 10^9",
    spec: {
      name: "divizibilCu3Si5",
      params: [{ name: "n", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "div3", type: "bool" }, { name: "div5", type: "bool" }] },
    },
    solve: (a) => ({ div3: a.n % 3 === 0, div5: a.n % 5 === 0 }),
    tests: [{ n: 15 }, { n: 9 }, { n: 10 }, { n: 7 }, { n: 0 }, { n: -30 }],
    official_cpp: "void divizibilCu3Si5(int n, bool &div3, bool &div5) {\n    div3 = (n % 3 == 0);\n    div5 = (n % 5 == 0);\n}\n",
    official_python: "def divizibilCu3Si5(n):\n    return n % 3 == 0, n % 5 == 0\n",
  },
  {
    slug: "subprograme-daca-un-numar-este-par-si-prim",
    title: "Verificarea daca un numar este par si daca este prim",
    statement: "Implementati o functie care primeste un numar natural `n` si verifica daca este par si daca este numar prim, prin parametrii de iesire `par` si `prim`.",
    input_format: "O linie continand numarul natural n.",
    output_format: "1 daca n este par altfel 0, apoi 1 daca n este prim altfel 0, separate printr-un spatiu.",
    constraints: "0 <= n <= 10^6",
    spec: {
      name: "parSiPrim",
      params: [{ name: "n", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "par", type: "bool" }, { name: "prim", type: "bool" }] },
    },
    solve: (a) => ({ par: a.n % 2 === 0, prim: isPrime(a.n) }),
    tests: [{ n: 2 }, { n: 4 }, { n: 9 }, { n: 97 }, { n: 0 }, { n: 1 }],
    official_cpp: "bool esteP(int n) { if (n < 2) return false; for (int i = 2; (long long)i * i <= n; i++) if (n % i == 0) return false; return true; }\nvoid parSiPrim(int n, bool &par, bool &prim) {\n    par = (n % 2 == 0);\n    prim = esteP(n);\n}\n",
    official_python: "def parSiPrim(n):\n    def prim(m):\n        if m < 2: return False\n        i = 2\n        while i * i <= m:\n            if m % i == 0: return False\n            i += 1\n        return True\n    return n % 2 == 0, prim(n)\n",
  },
  {
    slug: "subprograme-centimetri-in-metri-si-centimetri",
    title: "Transformarea centimetrilor in metri si centimetri ramasi",
    statement: "Implementati o functie care primeste o lungime `totalCm` exprimata in centimetri si o transforma in metri si centimetri ramasi, prin parametrii de iesire `metri` si `cmRamasi`.",
    input_format: "O linie continand numarul natural totalCm.",
    output_format: "Numarul de metri si centimetrii ramasi, separate printr-un spatiu.",
    constraints: "0 <= totalCm <= 10^7",
    spec: {
      name: "cmInMetriSiCentimetri",
      params: [{ name: "totalCm", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "metri", type: "int" }, { name: "cmRamasi", type: "int" }] },
    },
    solve: (a) => ({ metri: Math.floor(a.totalCm / 100), cmRamasi: a.totalCm % 100 }),
    tests: [{ totalCm: 350 }, { totalCm: 0 }, { totalCm: 99 }, { totalCm: 100 }, { totalCm: 12345 }, { totalCm: 10000000 }],
    official_cpp: "void cmInMetriSiCentimetri(int totalCm, int &metri, int &cmRamasi) {\n    metri = totalCm / 100;\n    cmRamasi = totalCm % 100;\n}\n",
    official_python: "def cmInMetriSiCentimetri(totalCm):\n    return totalCm // 100, totalCm % 100\n",
  },
  {
    slug: "subprograme-suma-si-ultimul-termen-al-unei-progresii-aritmetice",
    title: "Suma si ultimul termen al unei progresii aritmetice",
    statement: "Implementati o functie care primeste primul termen `a1`, ratia `ratie` si numarul de termeni `n` ai unei progresii aritmetice si calculeaza suma celor `n` termeni si ultimul termen, prin parametrii de iesire `suma` si `ultimulTermen`.",
    input_format: "Trei linii: a1, ratie, apoi n.",
    output_format: "Suma termenilor si ultimul termen, separate printr-un spatiu.",
    constraints: "-1000 <= a1, ratie <= 1000, 1 <= n <= 1000",
    spec: {
      name: "sumaSiUltimulTermenPA",
      params: [{ name: "a1", type: "int" }, { name: "ratie", type: "int" }, { name: "n", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "suma", type: "int" }, { name: "ultimulTermen", type: "int" }] },
    },
    solve: (args) => { const ultimulTermen = args.a1 + (args.n - 1) * args.ratie; const suma = (args.n * (args.a1 + ultimulTermen)) / 2; return { suma, ultimulTermen }; },
    tests: [{ a1: 1, ratie: 1, n: 5 }, { a1: 2, ratie: 3, n: 4 }, { a1: 0, ratie: 0, n: 10 }, { a1: -5, ratie: 2, n: 6 }, { a1: 1000, ratie: -1000, n: 2 }, { a1: 1000, ratie: 1000, n: 1000 }],
    official_cpp: "void sumaSiUltimulTermenPA(int a1, int ratie, int n, int &suma, int &ultimulTermen) {\n    ultimulTermen = a1 + (n - 1) * ratie;\n    suma = (n * (a1 + ultimulTermen)) / 2;\n}\n",
    official_python: "def sumaSiUltimulTermenPA(a1, ratie, n):\n    ultimulTermen = a1 + (n - 1) * ratie\n    suma = (n * (a1 + ultimulTermen)) // 2\n    return suma, ultimulTermen\n",
  },
  {
    slug: "subprograme-suprafata-si-volumul-cubului",
    title: "Suprafata si volumul unui cub",
    statement: "Implementati o functie care primeste latura `latura` a unui cub si calculeaza suprafata totala si volumul sau, prin parametrii de iesire `suprafata` si `volum`.",
    input_format: "O linie continand latura (numar intreg).",
    output_format: "Suprafata si volumul, separate printr-un spatiu.",
    constraints: "1 <= latura <= 1000",
    spec: {
      name: "suprafataSiVolumulCubului",
      params: [{ name: "latura", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "suprafata", type: "int" }, { name: "volum", type: "int" }] },
    },
    solve: (a) => ({ suprafata: 6 * a.latura * a.latura, volum: a.latura ** 3 }),
    tests: [{ latura: 1 }, { latura: 2 }, { latura: 1000 }, { latura: 5 }, { latura: 10 }, { latura: 7 }],
    official_cpp: "void suprafataSiVolumulCubului(int latura, int &suprafata, int &volum) {\n    suprafata = 6 * latura * latura;\n    volum = latura * latura * latura;\n}\n",
    official_python: "def suprafataSiVolumulCubului(latura):\n    return 6 * latura * latura, latura ** 3\n",
  },
  {
    slug: "subprograme-suprafata-si-volumul-paralelipipedului",
    title: "Suprafata si volumul unui paralelipiped dreptunghic",
    statement: "Implementati o functie care primeste lungimea `l`, latimea `w` si inaltimea `h` ale unui paralelipiped dreptunghic si calculeaza suprafata totala si volumul sau, prin parametrii de iesire `suprafata` si `volum`.",
    input_format: "Trei linii: l, w, apoi h.",
    output_format: "Suprafata si volumul, separate printr-un spatiu.",
    constraints: "1 <= l, w, h <= 1000",
    spec: {
      name: "suprafataSiVolumulParalelipipedului",
      params: [{ name: "l", type: "int" }, { name: "w", type: "int" }, { name: "h", type: "int" }],
      returns: { mode: "out-params", outs: [{ name: "suprafata", type: "int" }, { name: "volum", type: "int" }] },
    },
    solve: (args) => ({ suprafata: 2 * (args.l * args.w + args.l * args.h + args.w * args.h), volum: args.l * args.w * args.h }),
    tests: [{ l: 2, w: 3, h: 4 }, { l: 1, w: 1, h: 1 }, { l: 1000, w: 1, h: 1 }, { l: 5, w: 5, h: 5 }, { l: 10, w: 20, h: 30 }, { l: 7, w: 3, h: 9 }],
    official_cpp: "void suprafataSiVolumulParalelipipedului(int l, int w, int h, int &suprafata, int &volum) {\n    suprafata = 2 * (l * w + l * h + w * h);\n    volum = l * w * h;\n}\n",
    official_python: "def suprafataSiVolumulParalelipipedului(l, w, h):\n    return 2 * (l * w + l * h + w * h), l * w * h\n",
  },
  {
    slug: "subprograme-distanta-si-mijlocul-unui-segment",
    title: "Distanta si mijlocul unui segment",
    statement: "Implementati o functie care primeste coordonatele a doua puncte `(x1, y1)` si `(x2, y2)` si calculeaza distanta dintre ele si coordonatele mijlocului segmentului, prin parametrii de iesire `distanta`, `mijlocX` si `mijlocY`.",
    input_format: "Patru linii: x1, y1, x2, apoi y2.",
    output_format: "Distanta, mijlocX si mijlocY, separate prin spatiu, fiecare cu 2 zecimale.",
    constraints: "-10^4 <= x1, y1, x2, y2 <= 10^4",
    spec: {
      name: "distantaSiMijloculSegmentului",
      params: [{ name: "x1", type: "real" }, { name: "y1", type: "real" }, { name: "x2", type: "real" }, { name: "y2", type: "real" }],
      returns: { mode: "out-params", outs: [{ name: "distanta", type: "real" }, { name: "mijlocX", type: "real" }, { name: "mijlocY", type: "real" }] },
    },
    solve: (args) => {
      const dx = args.x2 - args.x1, dy = args.y2 - args.y1;
      return { distanta: Math.sqrt(dx * dx + dy * dy), mijlocX: (args.x1 + args.x2) / 2, mijlocY: (args.y1 + args.y2) / 2 };
    },
    tests: [{ x1: 0, y1: 0, x2: 3, y2: 4 }, { x1: 0, y1: 0, x2: 0, y2: 0 }, { x1: -5, y1: -5, x2: 5, y2: 5 }, { x1: 1, y1: 1, x2: 1, y2: 5 }, { x1: 10000, y1: 0, x2: -10000, y2: 0 }, { x1: 2.5, y1: 3.5, x2: -1.5, y2: 0.5 }],
    official_cpp: "#include <cmath>\nvoid distantaSiMijloculSegmentului(double x1, double y1, double x2, double y2, double &distanta, double &mijlocX, double &mijlocY) {\n    double dx = x2 - x1, dy = y2 - y1;\n    distanta = sqrt(dx * dx + dy * dy);\n    mijlocX = (x1 + x2) / 2.0;\n    mijlocY = (y1 + y2) / 2.0;\n}\n",
    official_python: "import math\ndef distantaSiMijloculSegmentului(x1, y1, x2, y2):\n    dx, dy = x2 - x1, y2 - y1\n    return math.sqrt(dx * dx + dy * dy), (x1 + x2) / 2.0, (y1 + y2) / 2.0\n",
  },
  {
    slug: "subprograme-discriminantul-si-numarul-de-radacini-reale",
    title: "Discriminantul si numarul de radacini reale ale unei ecuatii de gradul doi",
    statement: "Implementati o functie care primeste coeficientii `a`, `b`, `c` (a != 0) ai unei ecuatii de gradul doi `a*x^2 + b*x + c = 0` si calculeaza discriminantul si numarul de radacini reale distincte (0, 1 sau 2), prin parametrii de iesire `discriminant` si `numarRadacini`.",
    input_format: "Trei linii: a, b, apoi c (a != 0).",
    output_format: "Discriminantul (2 zecimale) si numarul de radacini reale, separate printr-un spatiu.",
    constraints: "-1000 <= a, b, c <= 1000, a != 0",
    spec: {
      name: "discriminantSiNumarulDeRadacini",
      params: [{ name: "a", type: "real" }, { name: "b", type: "real" }, { name: "c", type: "real" }],
      returns: { mode: "out-params", outs: [{ name: "discriminant", type: "real" }, { name: "numarRadacini", type: "int" }] },
    },
    solve: (args) => {
      const disc = args.b * args.b - 4 * args.a * args.c;
      const numarRadacini = disc > 1e-9 ? 2 : Math.abs(disc) <= 1e-9 ? 1 : 0;
      return { discriminant: disc, numarRadacini };
    },
    tests: [{ a: 1, b: -3, c: 2 }, { a: 1, b: 2, c: 1 }, { a: 1, b: 0, c: 1 }, { a: 2, b: 4, c: -6 }, { a: -1, b: 0, c: 4 }, { a: 1000, b: 0, c: -1000 }],
    official_cpp: "void discriminantSiNumarulDeRadacini(double a, double b, double c, double &discriminant, int &numarRadacini) {\n    discriminant = b * b - 4 * a * c;\n    if (discriminant > 1e-9) numarRadacini = 2;\n    else if (discriminant < -1e-9) numarRadacini = 0;\n    else numarRadacini = 1;\n}\n",
    official_python: "def discriminantSiNumarulDeRadacini(a, b, c):\n    disc = b * b - 4 * a * c\n    if disc > 1e-9: nr = 2\n    elif disc < -1e-9: nr = 0\n    else: nr = 1\n    return disc, nr\n",
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
    is_published: false,
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

  for (let i = 0; i < p.tests.length; i++) {
    const args = p.tests[i];
    const input = buildInputText(p.spec, args);
    const result = p.solve(args);
    const expectedOutput = buildOutputText(p.spec, result);
    await client.query(
      `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index) VALUES ($1, $2, $3, $4, $5, $6)`,
      [problemId, input, expectedOutput, i < 2, 10, i + 1],
    );
  }

  return problemId;
}

module.exports = { problems, upsertProblem, pool };

if (require.main === module) {
  (async () => {
    const client = await pool.connect();
    try {
      for (const p of problems) {
        const id = await upsertProblem(client, p);
        console.log(`INSERTED (unpublished) ${p.slug} -> ${id}`);
      }
      console.log(`\nGata: ${problems.length} probleme inserate ca draft (nepublicate). Ruleaza scriptul de verificare inainte de publicare.`);
    } finally {
      client.release();
      await pool.end();
    }
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
