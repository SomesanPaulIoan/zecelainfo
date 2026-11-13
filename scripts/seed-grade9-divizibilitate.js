const { Pool } = require("pg");

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";

const pool = new Pool({ connectionString });

const BASE_META = {
  difficulty: "easy",
  time_limit_ms: 1000,
  memory_limit_mb: 64,
  input_source: "stdin",
  output_target: "stdout",
  curriculum_level: "grade9",
  curriculum_chapter_id: "algoritmi-elementari",
  curriculum_subcategory_id: "divizibilitate",
  solution_mode: "full",
  checker_mode: "exact",
  source: "Sursa interna",
};

const YES = "DA\n";
const NO = "NU\n";

function toBigInt(n) {
  return BigInt(String(n).trim());
}

function isPrime(n) {
  n = Number(n);
  if (n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false;
  return true;
}

function divisors(n) {
  n = Number(n);
  const small = [];
  const large = [];
  for (let d = 1; d * d <= n; d += 1) {
    if (n % d === 0) {
      small.push(d);
      if (d * d !== n) large.push(n / d);
    }
  }
  return [...small, ...large.reverse()];
}

function factorize(n) {
  n = Number(n);
  const out = [];
  for (let p = 2; p * p <= n; p += p === 2 ? 1 : 2) {
    if (n % p !== 0) continue;
    let e = 0;
    while (n % p === 0) {
      n /= p;
      e += 1;
    }
    out.push([p, e]);
  }
  if (n > 1) out.push([n, 1]);
  return out;
}

function gcd(a, b) {
  a = Math.abs(Number(a));
  b = Math.abs(Number(b));
  while (b !== 0) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a;
}

function lcm(a, b) {
  a = Number(a);
  b = Number(b);
  if (a === 0 || b === 0) return 0;
  return (a / gcd(a, b)) * b;
}

function isSquare(n) {
  n = Number(n);
  if (n < 0) return false;
  const r = Math.floor(Math.sqrt(n));
  return r * r === n;
}

function isCube(n) {
  n = Number(n);
  if (n < 0) return false;
  const r = Math.round(Math.cbrt(n));
  return r * r * r === n;
}

function exponentInFactorial(n, p) {
  n = Number(n);
  p = Number(p);
  let ans = 0;
  while (n > 0) {
    n = Math.floor(n / p);
    ans += n;
  }
  return ans;
}

function trailingZerosFactorial(n) {
  return exponentInFactorial(n, 5);
}

function lastNonZeroDigitFactorial(n) {
  n = Number(n);
  let x = 1n;
  for (let i = 2n; i <= BigInt(n); i += 1n) {
    x *= i;
    while (x % 10n === 0n) x /= 10n;
    x %= 100000000n;
  }
  return Number(x % 10n);
}

function lastTwoNonZeroDigitsFactorial(n) {
  n = Number(n);
  let x = 1n;
  for (let i = 2n; i <= BigInt(n); i += 1n) {
    x *= i;
    while (x % 10n === 0n) x /= 10n;
    x %= 100000000000n;
  }
  const val = Number(x % 100n);
  return val.toString().padStart(2, "0");
}

function vp(x, p) {
  x = Math.abs(Number(x));
  if (x === 0) return 0;
  let e = 0;
  while (x % p === 0) {
    x /= p;
    e += 1;
  }
  return e;
}

function formatFactorization(n) {
  n = Number(n);
  if (n <= 1) return "1\n";
  const f = factorize(n);
  return `${f.map(([p, e]) => `${p}^${e}`).join(" * ")}\n`;
}

function inputLine(params) {
  return `${params.join(" ")}\n`;
}

function buildCppTemplate(title) {
  return [
    "#include <bits/stdc++.h>",
    "using namespace std;",
    "",
    "int main() {",
    `  // ${title}`,
    "  // Solutie bazata pe bucle, divizori, primalitate, gcd/lcm sau factorizare.",
    "  return 0;",
    "}",
  ].join("\n");
}

const problems = [
  // A
  {
    slug: "afisare-toti-divizorii-pozitivi",
    title: "Afisati toti divizorii pozitivi ai lui n",
    statement: "Se citeste n. Afisati toti divizorii pozitivi ai lui n in ordine crescatoare.",
    input_format: "Se citeste n.",
    output_format: "Divizorii separati prin spatiu.",
    constraints: "1 <= n <= 10^9",
    solver: ([n]) => `${divisors(n).join(" ")}\n`,
  },
  {
    slug: "suma-divizorilor-pozitivi",
    title: "Suma divizorilor pozitivi",
    statement: "Se citeste n. Determinati suma divizorilor pozitivi ai lui n.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza suma.",
    constraints: "1 <= n <= 10^9",
    solver: ([n]) => `${divisors(n).reduce((a, b) => a + b, 0)}\n`,
  },
  {
    slug: "numarul-divizorilor-pozitivi",
    title: "Numarul divizorilor pozitivi",
    statement: "Se citeste n. Determinati numarul divizorilor pozitivi ai lui n.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza numarul divizorilor.",
    constraints: "1 <= n <= 10^9",
    solver: ([n]) => `${divisors(n).length}\n`,
  },
  {
    slug: "produsul-divizorilor-pozitivi",
    title: "Produsul divizorilor pozitivi",
    statement: "Se citeste n. Determinati produsul divizorilor pozitivi ai lui n.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza produsul.",
    constraints: "1 <= n <= 10^6",
    solver: ([n]) => {
      let prod = 1n;
      for (const d of divisors(n)) prod *= BigInt(d);
      return `${prod.toString()}\n`;
    },
  },
  {
    slug: "verificare-numar-prim",
    title: "Verificare numar prim",
    statement: "Se citeste n. Verificati daca n este numar prim.",
    input_format: "Se citeste n.",
    output_format: "DA sau NU.",
    constraints: "0 <= n <= 10^9",
    solver: ([n]) => (isPrime(n) ? YES : NO),
  },
  {
    slug: "verificare-patrat-perfect",
    title: "Verificare patrat perfect",
    statement: "Se citeste n. Verificati daca n este patrat perfect.",
    input_format: "Se citeste n.",
    output_format: "DA sau NU.",
    constraints: "0 <= n <= 10^12",
    solver: ([n]) => (isSquare(n) ? YES : NO),
  },
  {
    slug: "verificare-cub-perfect",
    title: "Verificare cub perfect",
    statement: "Se citeste n. Verificati daca n este cub perfect.",
    input_format: "Se citeste n.",
    output_format: "DA sau NU.",
    constraints: "0 <= n <= 10^12",
    solver: ([n]) => (isCube(n) ? YES : NO),
  },
  {
    slug: "cel-mai-mare-divizor-propriu",
    title: "Cel mai mare divizor propriu",
    statement: "Se citeste n. Determinati cel mai mare divizor propriu al lui n.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza divizorul (pentru n=1 afisati 0).",
    constraints: "1 <= n <= 10^9",
    solver: ([n]) => {
      n = Number(n);
      if (n === 1) return "0\n";
      return `${n / (divisors(n)[1] ?? n)}\n`;
    },
  },
  {
    slug: "cel-mai-mic-divizor-propriu",
    title: "Cel mai mic divizor propriu",
    statement: "Se citeste n. Determinati cel mai mic divizor propriu al lui n.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza divizorul (pentru n=1 afisati 0).",
    constraints: "1 <= n <= 10^9",
    solver: ([n]) => {
      n = Number(n);
      if (n === 1) return "0\n";
      for (let d = 2; d * d <= n; d += 1) if (n % d === 0) return `${d}\n`;
      return "1\n";
    },
  },
  {
    slug: "verificare-numar-perfect",
    title: "Verificare numar perfect",
    statement: "Se citeste n. Verificati daca n este numar perfect.",
    input_format: "Se citeste n.",
    output_format: "DA sau NU.",
    constraints: "1 <= n <= 10^8",
    solver: ([n]) => {
      n = Number(n);
      const s = divisors(n).filter((d) => d !== n).reduce((a, b) => a + b, 0);
      return s === n ? YES : NO;
    },
  },
  // B
  {
    slug: "afisare-prime-interval",
    title: "Afisati numerele prime din interval",
    statement: "Se citesc a si b. Afisati toate numerele prime din [a,b].",
    input_format: "Se citesc a b.",
    output_format: "Numerele prime separate prin spatiu (sau linie goala).",
    constraints: "1 <= a <= b <= 10^6",
    solver: ([a, b]) => {
      const out = [];
      for (let x = Number(a); x <= Number(b); x += 1) if (isPrime(x)) out.push(x);
      return `${out.join(" ")}\n`;
    },
  },
  {
    slug: "numar-prime-interval",
    title: "Cate numere prime sunt in interval",
    statement: "Se citesc a si b. Determinati cate numere prime sunt in [a,b].",
    input_format: "Se citesc a b.",
    output_format: "Se afiseaza numarul de prime.",
    constraints: "1 <= a <= b <= 10^6",
    solver: ([a, b]) => {
      let cnt = 0;
      for (let x = Number(a); x <= Number(b); x += 1) if (isPrime(x)) cnt += 1;
      return `${cnt}\n`;
    },
  },
  {
    slug: "cel-mai-mic-prim-mai-mare-decat-n",
    title: "Cel mai mic numar prim mai mare decat n",
    statement: "Se citeste n. Determinati cel mai mic numar prim strict mai mare decat n.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza primul prim > n.",
    constraints: "0 <= n <= 10^6",
    solver: ([n]) => {
      let x = Number(n) + 1;
      while (!isPrime(x)) x += 1;
      return `${x}\n`;
    },
  },
  {
    slug: "cel-mai-mare-prim-mai-mic-decat-n",
    title: "Cel mai mare numar prim mai mic decat n",
    statement: "Se citeste n. Determinati cel mai mare numar prim strict mai mic decat n.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza rezultatul, sau -1 daca nu exista.",
    constraints: "0 <= n <= 10^6",
    solver: ([n]) => {
      for (let x = Number(n) - 1; x >= 2; x -= 1) if (isPrime(x)) return `${x}\n`;
      return "-1\n";
    },
  },
  {
    slug: "suma-a-doua-prime",
    title: "n ca suma de doua numere prime",
    statement: "Se citeste n. Verificati daca n se poate scrie ca suma de doua numere prime.",
    input_format: "Se citeste n.",
    output_format: "DA sau NU.",
    constraints: "1 <= n <= 10^6",
    solver: ([n]) => {
      n = Number(n);
      for (let p = 2; p <= n; p += 1) if (isPrime(p) && isPrime(n - p)) return YES;
      return NO;
    },
  },
  {
    slug: "numere-cu-exact-3-divizori",
    title: "Cate numere au exact 3 divizori",
    statement: "Se citesc a si b. Determinati cate numere din [a,b] au exact 3 divizori.",
    input_format: "Se citesc a b.",
    output_format: "Se afiseaza numarul cerut.",
    constraints: "1 <= a <= b <= 10^6",
    solver: ([a, b]) => {
      let cnt = 0;
      for (let x = Number(a); x <= Number(b); x += 1) if (divisors(x).length === 3) cnt += 1;
      return `${cnt}\n`;
    },
  },
  {
    slug: "numere-cu-exact-5-divizori",
    title: "Cate numere au exact 5 divizori",
    statement: "Se citesc a si b. Determinati cate numere din [a,b] au exact 5 divizori.",
    input_format: "Se citesc a b.",
    output_format: "Se afiseaza numarul cerut.",
    constraints: "1 <= a <= b <= 10^6",
    solver: ([a, b]) => {
      let cnt = 0;
      for (let x = Number(a); x <= Number(b); x += 1) if (divisors(x).length === 5) cnt += 1;
      return `${cnt}\n`;
    },
  },
  {
    slug: "numere-cu-numar-impar-de-divizori",
    title: "Numere cu numar impar de divizori",
    statement: "Se citesc a si b. Determinati cate numere din [a,b] au numar impar de divizori.",
    input_format: "Se citesc a b.",
    output_format: "Se afiseaza numarul cerut.",
    constraints: "1 <= a <= b <= 10^9",
    solver: ([a, b]) => {
      let cnt = 0;
      for (let x = Number(a); x <= Number(b); x += 1) if (isSquare(x)) cnt += 1;
      return `${cnt}\n`;
    },
  },
  {
    slug: "patrate-perfecte-cu-radacina-prima",
    title: "Patrate perfecte cu radacina prima",
    statement: "Se citesc a si b. Determinati cate numere din [a,b] sunt patrate perfecte cu radacina prima.",
    input_format: "Se citesc a b.",
    output_format: "Se afiseaza numarul cerut.",
    constraints: "1 <= a <= b <= 10^9",
    solver: ([a, b]) => {
      let cnt = 0;
      for (let x = Number(a); x <= Number(b); x += 1) {
        if (!isSquare(x)) continue;
        const r = Math.floor(Math.sqrt(x));
        if (isPrime(r)) cnt += 1;
      }
      return `${cnt}\n`;
    },
  },
  {
    slug: "perechi-prime-gemene-interval",
    title: "Perechi de numere prime gemene in interval",
    statement: "Se citesc a si b. Determinati cate perechi de prime gemene exista in [a,b].",
    input_format: "Se citesc a b.",
    output_format: "Se afiseaza numarul de perechi (p, p+2).",
    constraints: "1 <= a <= b <= 10^6",
    solver: ([a, b]) => {
      let cnt = 0;
      const L = Number(a);
      const R = Number(b);
      for (let p = L; p + 2 <= R; p += 1) if (isPrime(p) && isPrime(p + 2)) cnt += 1;
      return `${cnt}\n`;
    },
  },
  // C
  {
    slug: "descompunere-in-factori-primi",
    title: "Descompunere in factori primi",
    statement: "Se citeste n. Descompuneti n in factori primi.",
    input_format: "Se citeste n.",
    output_format: "Afisati sub forma p^e * ... (pentru n=1 afisati 1).",
    constraints: "1 <= n <= 10^9",
    solver: ([n]) => formatFactorization(n),
  },
  {
    slug: "numar-factori-primi-distincti",
    title: "Numarul factorilor primi distincti",
    statement: "Se citeste n. Determinati numarul factorilor primi distincti ai lui n.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza numarul cerut.",
    constraints: "1 <= n <= 10^9",
    solver: ([n]) => `${factorize(n).length}\n`,
  },
  {
    slug: "suma-factori-primi-distincti",
    title: "Suma factorilor primi distincti",
    statement: "Se citeste n. Determinati suma factorilor primi distincti ai lui n.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza suma ceruta.",
    constraints: "1 <= n <= 10^9",
    solver: ([n]) => `${factorize(n).reduce((a, [p]) => a + p, 0)}\n`,
  },
  {
    slug: "exponent-maxim-factorizare",
    title: "Exponentul maxim din factorizare",
    statement: "Se citeste n. Determinati exponentul maxim din descompunerea in factori primi.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza exponentul maxim (pentru n=1 afisati 0).",
    constraints: "1 <= n <= 10^9",
    solver: ([n]) => {
      const f = factorize(n);
      return `${f.length ? Math.max(...f.map(([, e]) => e)) : 0}\n`;
    },
  },
  {
    slug: "exponent-minim-nenul-factorizare",
    title: "Exponentul minim nenul din factorizare",
    statement: "Se citeste n. Determinati exponentul minim nenul din factorizare.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza exponentul minim (pentru n=1 afisati 0).",
    constraints: "1 <= n <= 10^9",
    solver: ([n]) => {
      const f = factorize(n);
      return `${f.length ? Math.min(...f.map(([, e]) => e)) : 0}\n`;
    },
  },
  {
    slug: "numar-divizori-prin-factorizare",
    title: "Numarul divizorilor folosind factorizarea",
    statement: "Se citeste n. Folosind factorizarea, calculati numarul divizorilor lui n.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza numarul divizorilor.",
    constraints: "1 <= n <= 10^9",
    solver: ([n]) => `${factorize(n).reduce((a, [, e]) => a * (e + 1), 1)}\n`,
  },
  {
    slug: "suma-divizori-prin-factorizare",
    title: "Suma divizorilor folosind factorizarea",
    statement: "Se citeste n. Folosind factorizarea, calculati suma divizorilor lui n.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza suma divizorilor.",
    constraints: "1 <= n <= 10^9",
    solver: ([n]) => {
      let ans = 1n;
      for (const [p, e] of factorize(n)) {
        let block = 0n;
        let cur = 1n;
        for (let i = 0; i <= e; i += 1) {
          block += cur;
          cur *= BigInt(p);
        }
        ans *= block;
      }
      return `${ans.toString()}\n`;
    },
  },
  {
    slug: "numar-liber-de-patrate",
    title: "Verificare numar liber de patrate",
    statement: "Se citeste n. Determinati daca n este liber de patrate.",
    input_format: "Se citeste n.",
    output_format: "DA sau NU.",
    constraints: "1 <= n <= 10^9",
    solver: ([n]) => (factorize(n).every(([, e]) => e === 1) ? YES : NO),
  },
  {
    slug: "radicalul-lui-n",
    title: "Radicalul lui n",
    statement: "Se citeste n. Determinati radicalul lui n (produsul factorilor primi distincti).",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza radicalul (rad(1)=1).",
    constraints: "1 <= n <= 10^9",
    solver: ([n]) => {
      const f = factorize(n);
      if (!f.length) return "1\n";
      let ans = 1n;
      for (const [p] of f) ans *= BigInt(p);
      return `${ans.toString()}\n`;
    },
  },
  {
    slug: "multiplicator-minim-pentru-patrat-perfect",
    title: "Multiplicator minim pentru a obtine patrat perfect",
    statement: "Se citeste n. Determinati cel mai mic k astfel incat n*k sa fie patrat perfect.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza k.",
    constraints: "1 <= n <= 10^9",
    solver: ([n]) => {
      let k = 1n;
      for (const [p, e] of factorize(n)) if (e % 2 === 1) k *= BigInt(p);
      return `${k.toString()}\n`;
    },
  },
  // D
  {
    slug: "cmmdc-a-b",
    title: "cmmdc(a,b)",
    statement: "Se citesc a si b. Determinati cmmdc(a,b).",
    input_format: "Se citesc a b.",
    output_format: "Se afiseaza cmmdc.",
    constraints: "0 <= a,b <= 10^9",
    solver: ([a, b]) => `${gcd(a, b)}\n`,
  },
  {
    slug: "cmmmc-a-b",
    title: "cmmmc(a,b)",
    statement: "Se citesc a si b. Determinati cmmmc(a,b).",
    input_format: "Se citesc a b.",
    output_format: "Se afiseaza cmmmc.",
    constraints: "0 <= a,b <= 10^9",
    solver: ([a, b]) => `${lcm(a, b)}\n`,
  },
  {
    slug: "cmmdc-a-b-c",
    title: "cmmdc(a,b,c)",
    statement: "Se citesc a, b, c. Determinati cmmdc(a,b,c).",
    input_format: "Se citesc a b c.",
    output_format: "Se afiseaza cmmdc.",
    constraints: "0 <= a,b,c <= 10^9",
    solver: ([a, b, c]) => `${gcd(gcd(a, b), c)}\n`,
  },
  {
    slug: "cmmmc-a-b-c",
    title: "cmmmc(a,b,c)",
    statement: "Se citesc a, b, c. Determinati cmmmc(a,b,c).",
    input_format: "Se citesc a b c.",
    output_format: "Se afiseaza cmmmc.",
    constraints: "0 <= a,b,c <= 10^6",
    solver: ([a, b, c]) => `${lcm(lcm(a, b), c)}\n`,
  },
  {
    slug: "prime-intre-ele",
    title: "Verificare prime intre ele",
    statement: "Se citesc a si b. Verificati daca sunt prime intre ele.",
    input_format: "Se citesc a b.",
    output_format: "DA sau NU.",
    constraints: "0 <= a,b <= 10^9",
    solver: ([a, b]) => (gcd(a, b) === 1 ? YES : NO),
  },
  {
    slug: "cmmdc-al-unui-sir",
    title: "cmmdc-ul tuturor numerelor din sir",
    statement: "Se citeste n, apoi n numere naturale. Determinati cmmdc-ul tuturor numerelor.",
    input_format: "Pe prima linie n. Pe a doua linie cele n numere.",
    output_format: "Se afiseaza cmmdc-ul.",
    constraints: "1 <= n <= 1000, valori <= 10^9",
    solver: ([n, ...arr]) => {
      const k = Number(n);
      let g = Number(arr[0]);
      for (let i = 1; i < k; i += 1) g = gcd(g, arr[i]);
      return `${g}\n`;
    },
  },
  {
    slug: "cmmmc-al-unui-sir",
    title: "cmmmc-ul tuturor numerelor din sir",
    statement: "Se citeste n, apoi n numere naturale. Determinati cmmmc-ul tuturor numerelor.",
    input_format: "Pe prima linie n. Pe a doua linie cele n numere.",
    output_format: "Se afiseaza cmmmc-ul.",
    constraints: "1 <= n <= 30, valori <= 10^5",
    solver: ([n, ...arr]) => {
      const k = Number(n);
      let L = Number(arr[0]);
      for (let i = 1; i < k; i += 1) L = lcm(L, arr[i]);
      return `${L}\n`;
    },
  },
  {
    slug: "cate-numere-prime-cu-a-in-interval",
    title: "Cate numere sunt prime cu a",
    statement: "Se citesc a si b. Determinati cate numere x din [a,b] sunt prime cu a.",
    input_format: "Se citesc a b.",
    output_format: "Se afiseaza numarul cerut.",
    constraints: "1 <= a <= b <= 10^6",
    solver: ([a, b]) => {
      let cnt = 0;
      a = Number(a);
      for (let x = a; x <= Number(b); x += 1) if (gcd(a, x) === 1) cnt += 1;
      return `${cnt}\n`;
    },
  },
  {
    slug: "numar-divizori-comuni-a-b",
    title: "Numarul divizorilor comuni",
    statement: "Se citesc a si b. Determinati cati divizori comuni au cele doua numere.",
    input_format: "Se citesc a b.",
    output_format: "Se afiseaza numarul divizorilor comuni.",
    constraints: "1 <= a,b <= 10^9",
    solver: ([a, b]) => `${divisors(gcd(a, b)).length}\n`,
  },
  {
    slug: "cel-mai-mare-divizor-al-lui-a-prim-cu-b",
    title: "Cel mai mare divizor al lui a prim cu b",
    statement: "Se citesc a si b. Determinati cel mai mare numar care divide pe a si este prim cu b.",
    input_format: "Se citesc a b.",
    output_format: "Se afiseaza rezultatul.",
    constraints: "1 <= a,b <= 10^9",
    solver: ([a, b]) => {
      a = Number(a);
      const fb = factorize(b).map(([p]) => p);
      let ans = 1n;
      for (const [p, e] of factorize(a)) {
        if (fb.includes(p)) continue;
        ans *= BigInt(p) ** BigInt(e);
      }
      return `${ans.toString()}\n`;
    },
  },
  // E
  {
    slug: "cate-zerouri-la-final-are-factorial",
    title: "Cate zerouri are n!",
    statement: "Se citeste n. Determinati in cate zerouri se termina n!.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza numarul de zerouri finale.",
    constraints: "0 <= n <= 10^9",
    solver: ([n]) => `${trailingZerosFactorial(n)}\n`,
  },
  {
    slug: "exponentul-lui-p-in-factorial",
    title: "Exponentul lui p in n!",
    statement: "Se citesc n si p (p prim). Determinati exponentul lui p in n!.",
    input_format: "Se citesc n p.",
    output_format: "Se afiseaza exponentul.",
    constraints: "0 <= n <= 10^9, p prim",
    solver: ([n, p]) => `${exponentInFactorial(n, p)}\n`,
  },
  {
    slug: "exponentul-lui-2-in-factorial",
    title: "Exponentul lui 2 in n!",
    statement: "Se citeste n. Determinati exponentul lui 2 in n!.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza exponentul.",
    constraints: "0 <= n <= 10^9",
    solver: ([n]) => `${exponentInFactorial(n, 2)}\n`,
  },
  {
    slug: "exponentul-lui-5-in-factorial",
    title: "Exponentul lui 5 in n!",
    statement: "Se citeste n. Determinati exponentul lui 5 in n!.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza exponentul.",
    constraints: "0 <= n <= 10^9",
    solver: ([n]) => `${exponentInFactorial(n, 5)}\n`,
  },
  {
    slug: "ultima-cifra-nenula-factorial",
    title: "Ultima cifra nenula a lui n!",
    statement: "Se citeste n. Determinati ultima cifra nenula a lui n!.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza cifra ceruta.",
    constraints: "0 <= n <= 20000",
    solver: ([n]) => `${lastNonZeroDigitFactorial(n)}\n`,
  },
  {
    slug: "ultimele-doua-cifre-nenule-factorial",
    title: "Ultimele doua cifre nenule ale lui n!",
    statement: "Se citeste n. Determinati ultimele doua cifre nenule ale lui n!.",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza exact doua cifre.",
    constraints: "0 <= n <= 20000",
    solver: ([n]) => `${lastTwoNonZeroDigitsFactorial(n)}\n`,
  },
  {
    slug: "zerouri-finale-produs-sir",
    title: "Zerouri finale in produsul unui sir",
    statement: "Se citeste n, apoi n numere naturale. Determinati cate zerouri are la final produsul lor.",
    input_format: "Pe prima linie n. Pe a doua linie cele n numere.",
    output_format: "Se afiseaza numarul de zerouri finale.",
    constraints: "1 <= n <= 10^5, valori <= 10^9",
    solver: ([n, ...arr]) => {
      const k = Number(n);
      let e2 = 0;
      let e5 = 0;
      for (let i = 0; i < k; i += 1) {
        e2 += vp(arr[i], 2);
        e5 += vp(arr[i], 5);
      }
      return `${Math.min(e2, e5)}\n`;
    },
  },
  {
    slug: "ultima-cifra-nenula-produs-sir",
    title: "Ultima cifra nenula a produsului unui sir",
    statement: "Se citeste n, apoi n numere naturale. Determinati ultima cifra nenula a produsului lor.",
    input_format: "Pe prima linie n. Pe a doua linie cele n numere.",
    output_format: "Se afiseaza cifra ceruta.",
    constraints: "1 <= n <= 10^5, valori <= 10^9",
    solver: ([n, ...arr]) => {
      const k = Number(n);
      let e2 = 0;
      let e5 = 0;
      let x = 1n;
      for (let i = 0; i < k; i += 1) {
        let v = BigInt(arr[i]);
        while (v % 2n === 0n) {
          e2 += 1;
          v /= 2n;
        }
        while (v % 5n === 0n) {
          e5 += 1;
          v /= 5n;
        }
        x = (x * v) % 100000000n;
      }
      const m = Math.min(e2, e5);
      e2 -= m;
      e5 -= m;
      for (let i = 0; i < e2; i += 1) x = (x * 2n) % 100000000n;
      for (let i = 0; i < e5; i += 1) x = (x * 5n) % 100000000n;
      return `${Number(x % 10n)}\n`;
    },
  },
  {
    slug: "zerouri-finale-produs-interval",
    title: "Zerouri finale in produsul intervalului",
    statement: "Se citesc a si b. Determinati cate zerouri are la final produsul tuturor numerelor din [a,b].",
    input_format: "Se citesc a b.",
    output_format: "Se afiseaza numarul de zerouri finale.",
    constraints: "1 <= a <= b <= 10^6",
    solver: ([a, b]) => {
      let e2 = 0;
      let e5 = 0;
      for (let x = Number(a); x <= Number(b); x += 1) {
        e2 += vp(x, 2);
        e5 += vp(x, 5);
      }
      return `${Math.min(e2, e5)}\n`;
    },
  },
  {
    slug: "k-minim-zerouri-in-factorial",
    title: "k minim de zerouri pentru n!",
    statement: "Se citeste n. Determinati k, numarul de zerouri finale ale lui n! (adica cel mai mare k pentru care n! se termina in cel putin k zerouri).",
    input_format: "Se citeste n.",
    output_format: "Se afiseaza k.",
    constraints: "0 <= n <= 10^9",
    solver: ([n]) => `${trailingZerosFactorial(n)}\n`,
  },
];

const CASES = {
  // A
  "afisare-toti-divizorii-pozitivi": [[1], [12], [13], [36], [100]],
  "suma-divizorilor-pozitivi": [[1], [12], [13], [36], [100]],
  "numarul-divizorilor-pozitivi": [[1], [12], [13], [36], [100]],
  "produsul-divizorilor-pozitivi": [[1], [12], [13], [36], [100]],
  "verificare-numar-prim": [[0], [1], [2], [17], [21]],
  "verificare-patrat-perfect": [[0], [1], [16], [18], [1000000]],
  "verificare-cub-perfect": [[0], [1], [27], [28], [1000000]],
  "cel-mai-mare-divizor-propriu": [[1], [2], [13], [36], [100]],
  "cel-mai-mic-divizor-propriu": [[1], [2], [13], [36], [100]],
  "verificare-numar-perfect": [[1], [6], [28], [12], [496]],
  // B
  "afisare-prime-interval": [[1, 10], [14, 16], [2, 2], [20, 30], [90, 100]],
  "numar-prime-interval": [[1, 10], [14, 16], [2, 2], [20, 30], [90, 100]],
  "cel-mai-mic-prim-mai-mare-decat-n": [[0], [1], [2], [14], [100]],
  "cel-mai-mare-prim-mai-mic-decat-n": [[0], [2], [3], [14], [100]],
  "suma-a-doua-prime": [[1], [2], [4], [17], [26]],
  "numere-cu-exact-3-divizori": [[1, 10], [1, 100], [10, 30], [50, 200], [500, 1000]],
  "numere-cu-exact-5-divizori": [[1, 20], [1, 100], [10, 300], [300, 800], [1, 1000]],
  "numere-cu-numar-impar-de-divizori": [[1, 10], [1, 100], [10, 30], [50, 200], [500, 1000]],
  "patrate-perfecte-cu-radacina-prima": [[1, 10], [1, 100], [10, 1000], [1000, 10000], [1, 100000]],
  "perechi-prime-gemene-interval": [[1, 10], [10, 30], [30, 50], [50, 100], [100, 200]],
  // C
  "descompunere-in-factori-primi": [[1], [2], [12], [360], [99991]],
  "numar-factori-primi-distincti": [[1], [2], [12], [360], [99991]],
  "suma-factori-primi-distincti": [[1], [2], [12], [360], [99991]],
  "exponent-maxim-factorizare": [[1], [2], [12], [360], [1024]],
  "exponent-minim-nenul-factorizare": [[1], [2], [12], [360], [1024]],
  "numar-divizori-prin-factorizare": [[1], [2], [12], [360], [1024]],
  "suma-divizori-prin-factorizare": [[1], [2], [12], [360], [1024]],
  "numar-liber-de-patrate": [[1], [2], [12], [30], [72]],
  "radicalul-lui-n": [[1], [2], [12], [360], [1024]],
  "multiplicator-minim-pentru-patrat-perfect": [[1], [2], [12], [360], [1024]],
  // D
  "cmmdc-a-b": [[0, 0], [12, 18], [17, 19], [100, 25], [270, 192]],
  "cmmmc-a-b": [[0, 5], [12, 18], [17, 19], [100, 25], [270, 192]],
  "cmmdc-a-b-c": [[0, 0, 0], [12, 18, 24], [17, 19, 23], [100, 25, 75], [270, 192, 66]],
  "cmmmc-a-b-c": [[0, 5, 10], [12, 18, 24], [17, 19, 23], [100, 25, 75], [8, 9, 21]],
  "prime-intre-ele": [[1, 1], [12, 18], [17, 19], [14, 25], [100, 35]],
  "cmmdc-al-unui-sir": [[3, 12, 18, 24], [4, 7, 11, 13, 17], [5, 100, 50, 25, 75, 125], [1, 0], [3, 0, 10, 20]],
  "cmmmc-al-unui-sir": [[3, 12, 18, 24], [4, 7, 11, 13, 17], [5, 4, 6, 8, 10, 12], [1, 0], [3, 0, 10, 20]],
  "cate-numere-prime-cu-a-in-interval": [[1, 10], [10, 20], [12, 30], [17, 30], [100, 150]],
  "numar-divizori-comuni-a-b": [[12, 18], [17, 19], [100, 25], [270, 192], [1, 999]],
  "cel-mai-mare-divizor-al-lui-a-prim-cu-b": [[12, 18], [17, 19], [100, 25], [270, 192], [360, 84]],
  // E
  "cate-zerouri-la-final-are-factorial": [[0], [5], [10], [25], [100]],
  "exponentul-lui-p-in-factorial": [[0, 2], [10, 2], [10, 5], [25, 5], [100, 3]],
  "exponentul-lui-2-in-factorial": [[0], [5], [10], [25], [100]],
  "exponentul-lui-5-in-factorial": [[0], [5], [10], [25], [100]],
  "ultima-cifra-nenula-factorial": [[0], [1], [5], [10], [25]],
  "ultimele-doua-cifre-nenule-factorial": [[0], [1], [5], [10], [25]],
  "zerouri-finale-produs-sir": [[3, 2, 5, 10], [4, 1, 2, 3, 4], [5, 25, 4, 8, 10, 20], [1, 7], [3, 100, 1000, 5]],
  "ultima-cifra-nenula-produs-sir": [[3, 2, 5, 10], [4, 1, 2, 3, 4], [5, 25, 4, 8, 10, 20], [1, 7], [3, 100, 1000, 5]],
  "zerouri-finale-produs-interval": [[1, 5], [1, 10], [10, 20], [25, 30], [90, 110]],
  "k-minim-zerouri-in-factorial": [[0], [5], [10], [25], [100]],
};

function materializeProblem(problem) {
  const cases = CASES[problem.slug];
  if (!cases || cases.length < 5) throw new Error(`Missing tests for ${problem.slug}`);
  const tests = cases.map((params, idx) => ({
    input: inputLine(params),
    expected: problem.solver(params),
    isSample: idx === 0,
  }));
  return {
    ...problem,
    tags: ["clasa9", "divizibilitate"],
    official_solution: buildCppTemplate(problem.title),
    tests,
  };
}

const allProblems = problems.map(materializeProblem);

async function upsertProblem(client, p) {
  const existing = await client.query(`SELECT id FROM problems WHERE slug = $1 LIMIT 1`, [p.slug]);
  let problemId = existing.rows[0]?.id;
  if (problemId) {
    await client.query(
      `UPDATE problems
       SET title = $2, statement = $3, official_solution = $4, input_format = $5, output_format = $6, constraints = $7,
           difficulty = $8, tags = $9, source = $10, is_published = true, time_limit_ms = $11, memory_limit_mb = $12,
           input_source = $13, output_target = $14, curriculum_level = $15, curriculum_chapter_id = $16,
           curriculum_subcategory_id = $17, solution_mode = $18, checker_mode = $19, updated_at = NOW()
       WHERE id = $1`,
      [
        problemId, p.title, p.statement, p.official_solution, p.input_format, p.output_format, p.constraints,
        BASE_META.difficulty, p.tags, BASE_META.source, BASE_META.time_limit_ms, BASE_META.memory_limit_mb,
        BASE_META.input_source, BASE_META.output_target, BASE_META.curriculum_level, BASE_META.curriculum_chapter_id,
        BASE_META.curriculum_subcategory_id, BASE_META.solution_mode, BASE_META.checker_mode,
      ],
    );
    await client.query(`DELETE FROM test_cases WHERE problem_id = $1`, [problemId]);
  } else {
    const ins = await client.query(
      `INSERT INTO problems (
         title, slug, statement, official_solution, input_format, output_format, constraints,
         difficulty, tags, source, is_published, time_limit_ms, memory_limit_mb, input_source, output_target,
         curriculum_level, curriculum_chapter_id, curriculum_subcategory_id, solution_mode, checker_mode
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING id`,
      [
        p.title, p.slug, p.statement, p.official_solution, p.input_format, p.output_format, p.constraints,
        BASE_META.difficulty, p.tags, BASE_META.source, BASE_META.time_limit_ms, BASE_META.memory_limit_mb,
        BASE_META.input_source, BASE_META.output_target, BASE_META.curriculum_level, BASE_META.curriculum_chapter_id,
        BASE_META.curriculum_subcategory_id, BASE_META.solution_mode, BASE_META.checker_mode,
      ],
    );
    problemId = ins.rows[0].id;
  }

  for (let i = 0; i < p.tests.length; i += 1) {
    const t = p.tests[i];
    await client.query(
      `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [problemId, t.input, t.expected, Boolean(t.isSample), 20, i + 1],
    );
  }
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const p of allProblems) await upsertProblem(client, p);
    await client.query("COMMIT");
    console.log(`Seed complete. Upserted ${allProblems.length} divizibilitate problems.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to seed divizibilitate problems:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
