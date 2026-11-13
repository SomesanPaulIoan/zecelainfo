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
  curriculum_subcategory_id: "cifrele-unui-numar",
  solution_mode: "full",
  checker_mode: "exact",
  source: "Sursa interna",
};

const YES = "DA\n";
const NO = "NU\n";

function normalizeNumString(raw) {
  const cleaned = String(raw).trim().replace(/^0+(?=\d)/, "");
  return cleaned === "" ? "0" : cleaned;
}

function digitsOf(raw) {
  return normalizeNumString(raw).split("").map((x) => Number(x));
}

function fromDigits(ds) {
  if (!ds.length) return "0";
  return normalizeNumString(ds.join(""));
}

function reverseNumberString(raw) {
  return fromDigits(digitsOf(raw).slice().reverse());
}

function isPalindromeString(raw) {
  const s = normalizeNumString(raw);
  return s === s.split("").reverse().join("");
}

function countMap(arr) {
  const m = new Map();
  for (const x of arr) m.set(x, (m.get(x) ?? 0) + 1);
  return m;
}

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

function product(arr) {
  return arr.reduce((a, b) => a * b, 1);
}

function joinWithSpaces(arr) {
  return `${arr.join(" ")}\n`;
}

function buildCppTemplate(description) {
  return [
    "#include <bits/stdc++.h>",
    "using namespace std;",
    "",
    "int main() {",
    `  // ${description}`,
    "  // Implementare pe baza extragerii cifrelor / parcurgerii ca string.",
    "  return 0;",
    "}",
  ].join("\n");
}

function removeFirstDigit(raw) {
  const s = normalizeNumString(raw);
  if (s.length <= 1) return "0";
  return normalizeNumString(s.slice(1));
}

function removeDigit(raw, c) {
  const d = String(c).trim();
  const s = normalizeNumString(raw);
  const out = s
    .split("")
    .filter((ch) => ch !== d)
    .join("");
  return normalizeNumString(out === "" ? "0" : out);
}

function positionsFromLeft(raw) {
  return digitsOf(raw).map((digit, idx) => ({ digit, pos: idx + 1 }));
}

const problems = [
  // A. Operatii de baza pe cifre
  {
    slug: "suma-cifrelor-general",
    title: "Suma cifrelor",
    statement: "Se citeste n. Afisati suma cifrelor.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza suma cifrelor lui n.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${sum(digitsOf(n))}\n`,
  },
  {
    slug: "produsul-cifrelor-general",
    title: "Produsul cifrelor",
    statement: "Se citeste n. Afisati produsul cifrelor.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza produsul cifrelor lui n.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${product(digitsOf(n))}\n`,
  },
  {
    slug: "numar-de-cifre-general",
    title: "Numar de cifre",
    statement: "Se citeste n. Determinati numarul de cifre.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul de cifre din scrierea lui n.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${digitsOf(n).length}\n`,
  },
  {
    slug: "cea-mai-mare-cifra",
    title: "Cea mai mare cifra",
    statement: "Se citeste n. Afisati cea mai mare cifra.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza cea mai mare cifra a lui n.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${Math.max(...digitsOf(n))}\n`,
  },
  {
    slug: "cea-mai-mica-cifra",
    title: "Cea mai mica cifra",
    statement: "Se citeste n. Afisati cea mai mica cifra.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza cea mai mica cifra a lui n.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${Math.min(...digitsOf(n))}\n`,
  },
  {
    slug: "suma-cifrelor-pare",
    title: "Suma cifrelor pare",
    statement: "Se citeste n. Afisati suma cifrelor pare.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza suma cifrelor pare din n.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${sum(digitsOf(n).filter((d) => d % 2 === 0))}\n`,
  },
  {
    slug: "suma-cifrelor-impare",
    title: "Suma cifrelor impare",
    statement: "Se citeste n. Afisati suma cifrelor impare.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza suma cifrelor impare din n.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${sum(digitsOf(n).filter((d) => d % 2 === 1))}\n`,
  },
  {
    slug: "cate-cifre-pare",
    title: "Cate cifre pare",
    statement: "Se citeste n. Determinati cate cifre pare are.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul cifrelor pare din n.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${digitsOf(n).filter((d) => d % 2 === 0).length}\n`,
  },
  {
    slug: "cate-cifre-impare",
    title: "Cate cifre impare",
    statement: "Se citeste n. Determinati cate cifre impare are.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul cifrelor impare din n.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${digitsOf(n).filter((d) => d % 2 === 1).length}\n`,
  },
  {
    slug: "diferenta-suma-pare-impare",
    title: "Diferenta dintre suma cifrelor pare si impare",
    statement: "Se citeste n. Afisati diferenta dintre suma cifrelor pare si suma cifrelor impare.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza valoarea S_pare - S_impare.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const ds = digitsOf(n);
      return `${sum(ds.filter((d) => d % 2 === 0)) - sum(ds.filter((d) => d % 2 === 1))}\n`;
    },
  },

  // B. Extragere si modificare de cifre
  {
    slug: "elimina-ultima-cifra",
    title: "Eliminati ultima cifra",
    statement: "Se citeste n. Eliminati ultima cifra.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul obtinut dupa eliminarea ultimei cifre.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${Math.floor(Number(normalizeNumString(n)) / 10)}\n`,
  },
  {
    slug: "elimina-prima-cifra",
    title: "Eliminati prima cifra",
    statement: "Se citeste n. Eliminati prima cifra.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul obtinut dupa eliminarea primei cifre.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${removeFirstDigit(n)}\n`,
  },
  {
    slug: "elimina-toate-zerourile",
    title: "Eliminati toate aparitiile cifrei 0",
    statement: "Se citeste n. Eliminati toate aparitiile cifrei 0.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul rezultat; daca nu mai ramane nicio cifra, afisati 0.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${removeDigit(n, 0)}\n`,
  },
  {
    slug: "elimina-toate-aparitiile-lui-c",
    title: "Eliminati toate aparitiile unei cifre c",
    statement: "Se citesc n si o cifra c. Eliminati toate aparitiile lui c din n.",
    input_format: "Se citesc n si c (0 <= c <= 9).",
    output_format: "Se afiseaza numarul rezultat; daca nu mai ramane nicio cifra, afisati 0.",
    constraints: "0 <= n <= 10^18",
    solver: ([n, c]) => `${removeDigit(n, c)}\n`,
  },
  {
    slug: "inlocuieste-cifrele-pare-cu-zero",
    title: "Inlocuiti cifrele pare cu 0",
    statement: "Se citeste n. Inlocuiti toate cifrele pare cu 0.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza noul numar obtinut dupa inlocuire.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const out = digitsOf(n).map((d) => (d % 2 === 0 ? 0 : d));
      return `${fromDigits(out)}\n`;
    },
  },
  {
    slug: "inlocuieste-cifrele-impare-cu-unu",
    title: "Inlocuiti cifrele impare cu 1",
    statement: "Se citeste n. Inlocuiti toate cifrele impare cu 1.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza noul numar obtinut dupa inlocuire.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const out = digitsOf(n).map((d) => (d % 2 === 1 ? 1 : d));
      return `${fromDigits(out)}\n`;
    },
  },
  {
    slug: "dubleaza-fiecare-cifra",
    title: "Dublati fiecare cifra",
    statement: "Se citeste n. Dublati fiecare cifra (ex: 123 -> 112233).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul rezultat prin dublarea fiecarei cifre.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${normalizeNumString(digitsOf(n).map((d) => `${d}${d}`).join(""))}\n`,
  },
  {
    slug: "insereaza-zero-intre-cifre",
    title: "Inserati cifra 0 intre fiecare doua cifre",
    statement: "Se citeste n. Inserati cifra 0 intre fiecare doua cifre.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul rezultat.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const ds = digitsOf(n);
      if (ds.length <= 1) return `${ds[0]}\n`;
      let out = "";
      for (let i = 0; i < ds.length; i += 1) {
        out += String(ds[i]);
        if (i < ds.length - 1) out += "0";
      }
      return `${normalizeNumString(out)}\n`;
    },
  },
  {
    slug: "concateneaza-suma-cifrelor-la-final",
    title: "Inserati suma cifrelor la finalul numarului",
    statement: "Se citeste n. Inserati suma cifrelor la finalul numarului.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza concatenarea lui n cu suma cifrelor lui.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const s = normalizeNumString(n);
      const sm = String(sum(digitsOf(n)));
      return `${normalizeNumString(`${s}${sm}`)}\n`;
    },
  },
  {
    slug: "concateneaza-produsul-cifrelor-la-inceput",
    title: "Inserati produsul cifrelor la inceputul numarului",
    statement: "Se citeste n. Inserati produsul cifrelor la inceputul numarului.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza concatenarea produsului cifrelor cu n.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const s = normalizeNumString(n);
      const pr = String(product(digitsOf(n)));
      return `${normalizeNumString(`${pr}${s}`)}\n`;
    },
  },

  // C. Oglindire si palindroame
  {
    slug: "numar-oglindit-general",
    title: "Numarul oglindit",
    statement: "Se citeste n. Afisati numarul oglindit.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza oglinditul lui n.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${reverseNumberString(n)}\n`,
  },
  {
    slug: "verifica-palindrom",
    title: "Verificati daca numarul este palindrom",
    statement: "Se citeste n. Verificati daca este palindrom.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza DA daca n este palindrom, altfel NU.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => (isPalindromeString(n) ? YES : NO),
  },
  {
    slug: "n-plus-oglindit",
    title: "n + oglinditul lui n",
    statement: "Se citeste n. Calculati n + oglinditul(n).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza suma ceruta.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const a = BigInt(normalizeNumString(n));
      const b = BigInt(reverseNumberString(n));
      return `${(a + b).toString()}\n`;
    },
  },
  {
    slug: "concateneaza-cu-oglinditul",
    title: "Concatenarea lui n cu oglinditul sau",
    statement: "Se citeste n. Formati numarul obtinut prin concatenarea lui n cu oglinditul sau.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza concatenarea n || oglinditul(n).",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${normalizeNumString(`${normalizeNumString(n)}${reverseNumberString(n)}`)}\n`,
  },
  {
    slug: "palindrom-prin-eliminarea-unei-cifre",
    title: "Palindrom prin eliminarea unei cifre",
    statement: "Se citeste n. Determinati daca prin eliminarea unei singure cifre numarul devine palindrom.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza DA sau NU.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const s = normalizeNumString(n);
      if (s.length <= 1) return NO;
      for (let i = 0; i < s.length; i += 1) {
        const t = normalizeNumString(`${s.slice(0, i)}${s.slice(i + 1)}`);
        if (t === t.split("").reverse().join("")) return YES;
      }
      return NO;
    },
  },

  // D. Rearanjari si constructii
  {
    slug: "cel-mai-mare-numar-din-cifre",
    title: "Cel mai mare numar posibil din cifrele lui n",
    statement: "Se citeste n. Formati cel mai mare numar posibil din cifrele lui.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul maxim obtinut prin rearanjarea cifrelor.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${fromDigits(digitsOf(n).slice().sort((a, b) => b - a))}\n`,
  },
  {
    slug: "cel-mai-mic-numar-fara-zero-in-fata",
    title: "Cel mai mic numar posibil din cifrele lui n",
    statement: "Se citeste n. Formati cel mai mic numar posibil din cifrele lui, fara zerouri la inceput.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul minim conform cerintei.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const ds = digitsOf(n).slice().sort((a, b) => a - b);
      const firstNonZeroIdx = ds.findIndex((x) => x !== 0);
      if (firstNonZeroIdx === -1) return "0\n";
      const first = ds[firstNonZeroIdx];
      ds.splice(firstNonZeroIdx, 1);
      return `${normalizeNumString([first, ...ds].join(""))}\n`;
    },
  },
  {
    slug: "rearanjare-cifre-crescator",
    title: "Rearanjati cifrele in ordine crescatoare",
    statement: "Se citeste n. Rearanjati cifrele in ordine crescatoare.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul rezultat.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${fromDigits(digitsOf(n).slice().sort((a, b) => a - b))}\n`,
  },
  {
    slug: "rearanjare-cifre-descrescator",
    title: "Rearanjati cifrele in ordine descrescatoare",
    statement: "Se citeste n. Rearanjati cifrele in ordine descrescatoare.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul rezultat.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${fromDigits(digitsOf(n).slice().sort((a, b) => b - a))}\n`,
  },
  {
    slug: "numar-doar-din-cifre-pare",
    title: "Numar format doar din cifrele pare",
    statement: "Se citeste n. Formati un numar doar din cifrele pare ale lui n (in ordinea initiala).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul obtinut, sau 0 daca nu exista cifre pare.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const out = digitsOf(n).filter((d) => d % 2 === 0);
      return `${fromDigits(out)}\n`;
    },
  },

  // E. Proprietati si verificari
  {
    slug: "toate-cifrele-egale",
    title: "Verificati daca toate cifrele sunt egale",
    statement: "Se citeste n. Verificati daca toate cifrele lui n sunt egale.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza DA sau NU.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => (new Set(digitsOf(n)).size <= 1 ? YES : NO),
  },
  {
    slug: "cifre-in-ordine-crescatoare",
    title: "Cifre in ordine crescatoare",
    statement: "Se citeste n. Verificati daca cifrele sunt in ordine crescatoare (ne-stricta).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza DA sau NU.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const ds = digitsOf(n);
      for (let i = 1; i < ds.length; i += 1) if (ds[i] < ds[i - 1]) return NO;
      return YES;
    },
  },
  {
    slug: "cifre-in-ordine-strict-descrescatoare",
    title: "Cifre in ordine strict descrescatoare",
    statement: "Se citeste n. Verificati daca cifrele sunt in ordine strict descrescatoare.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza DA sau NU.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const ds = digitsOf(n);
      for (let i = 1; i < ds.length; i += 1) if (ds[i] >= ds[i - 1]) return NO;
      return YES;
    },
  },
  {
    slug: "doua-cifre-identice-consecutive",
    title: "Exista doua cifre identice consecutive",
    statement: "Se citeste n. Verificati daca exista doua cifre identice consecutive.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza DA sau NU.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const ds = digitsOf(n);
      for (let i = 1; i < ds.length; i += 1) if (ds[i] === ds[i - 1]) return YES;
      return NO;
    },
  },
  {
    slug: "apare-cifra-zero",
    title: "Verificati daca apare cifra 0",
    statement: "Se citeste n. Verificati daca apare cifra 0 in n.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza DA sau NU.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => (digitsOf(n).includes(0) ? YES : NO),
  },
  {
    slug: "toate-cifrele-pare",
    title: "Toate cifrele sunt pare",
    statement: "Se citeste n. Determinati daca toate cifrele sunt pare.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza DA sau NU.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => (digitsOf(n).every((d) => d % 2 === 0) ? YES : NO),
  },
  {
    slug: "exista-cel-putin-o-cifra-impara",
    title: "Exista cel putin o cifra impara",
    statement: "Se citeste n. Determinati daca exista cel putin o cifra impara.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza DA sau NU.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => (digitsOf(n).some((d) => d % 2 === 1) ? YES : NO),
  },

  // F. Operatii mai interesante
  {
    slug: "suma-cifrelor-de-pe-pozitii-pare",
    title: "Suma cifrelor de pe pozitii pare",
    statement: "Se citeste n. Calculati suma cifrelor de pe pozitii pare (pozitiile se numara de la stanga, de la 1).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza suma ceruta.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${sum(positionsFromLeft(n).filter((x) => x.pos % 2 === 0).map((x) => x.digit))}\n`,
  },
  {
    slug: "suma-cifrelor-de-pe-pozitii-impare",
    title: "Suma cifrelor de pe pozitii impare",
    statement: "Se citeste n. Calculati suma cifrelor de pe pozitii impare (pozitiile se numara de la stanga, de la 1).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza suma ceruta.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${sum(positionsFromLeft(n).filter((x) => x.pos % 2 === 1).map((x) => x.digit))}\n`,
  },
  {
    slug: "numar-din-cifrele-de-pe-pozitii-pare",
    title: "Numar format din cifrele de pe pozitii pare",
    statement: "Se citeste n. Formati un numar doar din cifrele aflate pe pozitii pare (de la stanga, de la 1).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul obtinut, sau 0 daca nu exista astfel de pozitii.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const out = positionsFromLeft(n).filter((x) => x.pos % 2 === 0).map((x) => x.digit);
      return `${fromDigits(out)}\n`;
    },
  },
  {
    slug: "numar-din-cifrele-de-pe-pozitii-impare",
    title: "Numar format din cifrele de pe pozitii impare",
    statement: "Se citeste n. Formati un numar doar din cifrele aflate pe pozitii impare (de la stanga, de la 1).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul obtinut.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const out = positionsFromLeft(n).filter((x) => x.pos % 2 === 1).map((x) => x.digit);
      return `${fromDigits(out)}\n`;
    },
  },
  {
    slug: "inverseaza-doar-cifrele-pare",
    title: "Inversati doar cifrele pare",
    statement: "Se citeste n. Inversati doar cifrele pare, pastrand pozitiile cifrelor impare.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul rezultat.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const ds = digitsOf(n);
      const evenDigits = ds.filter((d) => d % 2 === 0).reverse();
      let ptr = 0;
      const out = ds.map((d) => {
        if (d % 2 !== 0) return d;
        const value = evenDigits[ptr];
        ptr += 1;
        return value;
      });
      return `${fromDigits(out)}\n`;
    },
  },
  {
    slug: "sterge-cifre-mai-mici-decat-5",
    title: "Stergeti toate cifrele mai mici decat 5",
    statement: "Se citeste n. Stergeti toate cifrele mai mici decat 5.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul rezultat, sau 0 daca nu ramane nicio cifra.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const out = digitsOf(n).filter((d) => d >= 5);
      return `${fromDigits(out)}\n`;
    },
  },
  {
    slug: "inlocuieste-cifra-cu-patratul-ei",
    title: "Inlocuiti fiecare cifra cu patratul ei",
    statement: "Se citeste n. Inlocuiti fiecare cifra cu patratul ei (ex: 23 -> 49).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza concatenarea patratelor cifrelor in ordinea initiala.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${normalizeNumString(digitsOf(n).map((d) => String(d * d)).join(""))}\n`,
  },

  // G. Tricky
  {
    slug: "suma-cifrelor-egala-cu-produsul-cifrelor",
    title: "Suma cifrelor egala cu produsul cifrelor",
    statement: "Se citeste n. Determinati daca suma cifrelor este egala cu produsul cifrelor.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza DA sau NU.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const ds = digitsOf(n);
      return sum(ds) === product(ds) ? YES : NO;
    },
  },
  {
    slug: "cifra-cea-mai-frecventa",
    title: "Cifra care apare cel mai frecvent",
    statement:
      "Se citeste n. Determinati cifra care apare cel mai frecvent. In caz de egalitate, afisati cifra mai mica.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza o singura cifra.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const m = countMap(digitsOf(n));
      let bestDigit = 0;
      let bestFreq = -1;
      for (let d = 0; d <= 9; d += 1) {
        const f = m.get(d) ?? 0;
        if (f > bestFreq) {
          bestFreq = f;
          bestDigit = d;
        }
      }
      return `${bestDigit}\n`;
    },
  },
  {
    slug: "cate-cifre-distincte",
    title: "Cate cifre distincte are n",
    statement: "Se citeste n. Determinati cate cifre distincte are.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul de cifre distincte din n.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => `${new Set(digitsOf(n)).size}\n`,
  },
  {
    slug: "cel-mai-mare-numar-din-cifre-distincte",
    title: "Cel mai mare numar din cifre distincte",
    statement: "Se citeste n. Formati cel mai mare numar posibil din cifre distincte ale lui n.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul rezultat.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const ds = Array.from(new Set(digitsOf(n))).sort((a, b) => b - a);
      return `${fromDigits(ds)}\n`;
    },
  },
  {
    slug: "exista-cifra-aparitie-exact-de-doua-ori",
    title: "Exista cifra care apare exact de doua ori",
    statement: "Se citeste n. Determinati daca exista o cifra care apare exact de doua ori.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza DA sau NU.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const m = countMap(digitsOf(n));
      for (const v of m.values()) if (v === 2) return YES;
      return NO;
    },
  },
  {
    slug: "cea-mai-lunga-secventa-cifre-egale-consecutive",
    title: "Cea mai lunga secventa de cifre egale consecutive",
    statement: "Se citeste n. Determinati lungimea celei mai lungi secvente de cifre egale consecutive.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza lungimea maxima.",
    constraints: "0 <= n <= 10^18",
    solver: ([n]) => {
      const ds = digitsOf(n);
      let best = 1;
      let cur = 1;
      for (let i = 1; i < ds.length; i += 1) {
        if (ds[i] === ds[i - 1]) cur += 1;
        else cur = 1;
        if (cur > best) best = cur;
      }
      return `${best}\n`;
    },
  },
];

const CASES = {
  "suma-cifrelor-general": [["572"], ["0"], ["1000"], ["90909"], ["99999"]],
  "produsul-cifrelor-general": [["572"], ["0"], ["1111"], ["2305"], ["999"]],
  "numar-de-cifre-general": [["0"], ["7"], ["10"], ["1000"], ["123456789"]],
  "cea-mai-mare-cifra": [["0"], ["572"], ["999"], ["10203"], ["808"]],
  "cea-mai-mica-cifra": [["0"], ["572"], ["999"], ["10203"], ["808"]],
  "suma-cifrelor-pare": [["0"], ["572"], ["13579"], ["24680"], ["90909"]],
  "suma-cifrelor-impare": [["0"], ["572"], ["13579"], ["24680"], ["90909"]],
  "cate-cifre-pare": [["0"], ["572"], ["13579"], ["24680"], ["90909"]],
  "cate-cifre-impare": [["0"], ["572"], ["13579"], ["24680"], ["90909"]],
  "diferenta-suma-pare-impare": [["0"], ["572"], ["13579"], ["24680"], ["90909"]],

  "elimina-ultima-cifra": [["0"], ["7"], ["10"], ["572"], ["1000"]],
  "elimina-prima-cifra": [["0"], ["7"], ["10"], ["572"], ["1000"]],
  "elimina-toate-zerourile": [["0"], ["1000"], ["101203"], ["456"], ["90909"]],
  "elimina-toate-aparitiile-lui-c": [["0", "0"], ["101203", "0"], ["57257", "7"], ["999", "9"], ["12345", "8"]],
  "inlocuieste-cifrele-pare-cu-zero": [["0"], ["572"], ["2468"], ["13579"], ["90909"]],
  "inlocuieste-cifrele-impare-cu-unu": [["0"], ["572"], ["2468"], ["13579"], ["90909"]],
  "dubleaza-fiecare-cifra": [["0"], ["5"], ["123"], ["909"], ["1002"]],
  "insereaza-zero-intre-cifre": [["0"], ["7"], ["12"], ["1234"], ["909"]],
  "concateneaza-suma-cifrelor-la-final": [["0"], ["5"], ["123"], ["909"], ["999"]],
  "concateneaza-produsul-cifrelor-la-inceput": [["0"], ["5"], ["123"], ["909"], ["111"]],

  "numar-oglindit-general": [["0"], ["1200"], ["572"], ["909"], ["100"]],
  "verifica-palindrom": [["0"], ["7"], ["121"], ["12021"], ["123"]],
  "n-plus-oglindit": [["0"], ["7"], ["120"], ["572"], ["999"]],
  "concateneaza-cu-oglinditul": [["0"], ["7"], ["120"], ["572"], ["100"]],
  "palindrom-prin-eliminarea-unei-cifre": [["0"], ["7"], ["1231"], ["12345"], ["1001"]],

  "cel-mai-mare-numar-din-cifre": [["0"], ["572"], ["1002"], ["909"], ["987654321"]],
  "cel-mai-mic-numar-fara-zero-in-fata": [["0"], ["572"], ["1002"], ["909"], ["100000"]],
  "rearanjare-cifre-crescator": [["0"], ["572"], ["1002"], ["909"], ["987654321"]],
  "rearanjare-cifre-descrescator": [["0"], ["572"], ["1002"], ["909"], ["987654321"]],
  "numar-doar-din-cifre-pare": [["0"], ["572"], ["13579"], ["24680"], ["90909"]],

  "toate-cifrele-egale": [["0"], ["7777"], ["1212"], ["999"], ["1000"]],
  "cifre-in-ordine-crescatoare": [["0"], ["1234"], ["1124"], ["1324"], ["9"]],
  "cifre-in-ordine-strict-descrescatoare": [["0"], ["4321"], ["4431"], ["9870"], ["9"]],
  "doua-cifre-identice-consecutive": [["0"], ["1234"], ["1223"], ["9009"], ["111"]],
  "apare-cifra-zero": [["0"], ["1234"], ["1023"], ["9876"], ["900"]],
  "toate-cifrele-pare": [["0"], ["2468"], ["2222"], ["1234"], ["808"]],
  "exista-cel-putin-o-cifra-impara": [["0"], ["2468"], ["2222"], ["1234"], ["808"]],

  "suma-cifrelor-de-pe-pozitii-pare": [["0"], ["1234"], ["572"], ["1000"], ["99999"]],
  "suma-cifrelor-de-pe-pozitii-impare": [["0"], ["1234"], ["572"], ["1000"], ["99999"]],
  "numar-din-cifrele-de-pe-pozitii-pare": [["0"], ["1234"], ["572"], ["1000"], ["99999"]],
  "numar-din-cifrele-de-pe-pozitii-impare": [["0"], ["1234"], ["572"], ["1000"], ["99999"]],
  "inverseaza-doar-cifrele-pare": [["0"], ["123456"], ["572"], ["24680"], ["13579"]],
  "sterge-cifre-mai-mici-decat-5": [["0"], ["1234"], ["572"], ["987654"], ["505050"]],
  "inlocuieste-cifra-cu-patratul-ei": [["0"], ["23"], ["909"], ["572"], ["111"]],

  "suma-cifrelor-egala-cu-produsul-cifrelor": [["0"], ["22"], ["123"], ["111"], ["321"]],
  "cifra-cea-mai-frecventa": [["0"], ["122333"], ["90909"], ["112233"], ["55551"]],
  "cate-cifre-distincte": [["0"], ["122333"], ["90909"], ["112233"], ["123456789"]],
  "cel-mai-mare-numar-din-cifre-distincte": [["0"], ["122333"], ["90909"], ["112233"], ["123456789"]],
  "exista-cifra-aparitie-exact-de-doua-ori": [["0"], ["122333"], ["90909"], ["112233"], ["55551"]],
  "cea-mai-lunga-secventa-cifre-egale-consecutive": [["0"], ["122333"], ["90909"], ["112233"], ["1111222333"]],
};

function paramsToInput(params) {
  return `${params.join(" ")}\n`;
}

function validateAndBuild(problem) {
  const caseList = CASES[problem.slug];
  if (!caseList || caseList.length < 5) throw new Error(`Tests missing for ${problem.slug}`);
  const tests = caseList.map((params, idx) => ({
    input: paramsToInput(params),
    expected: problem.solver(params),
    isSample: idx === 0,
  }));

  for (const t of tests) {
    if (!t.expected.endsWith("\n")) throw new Error(`Expected must end with newline for ${problem.slug}`);
  }

  return {
    slug: problem.slug,
    title: problem.title,
    statement: problem.statement,
    official_solution: buildCppTemplate(problem.title),
    input_format: problem.input_format,
    output_format: problem.output_format,
    constraints: problem.constraints,
    tags: ["clasa9", "cifrele-unui-numar"],
    tests,
  };
}

const materializedProblems = problems.map(validateAndBuild);

async function upsertProblem(client, problem) {
  const existing = await client.query(`SELECT id FROM problems WHERE slug = $1 LIMIT 1`, [problem.slug]);
  let problemId = existing.rows[0]?.id;

  if (problemId) {
    await client.query(
      `UPDATE problems
       SET title = $2,
           statement = $3,
           official_solution = $4,
           input_format = $5,
           output_format = $6,
           constraints = $7,
           difficulty = $8,
           tags = $9,
           source = $10,
           is_published = true,
           time_limit_ms = $11,
           memory_limit_mb = $12,
           input_source = $13,
           output_target = $14,
           curriculum_level = $15,
           curriculum_chapter_id = $16,
           curriculum_subcategory_id = $17,
           solution_mode = $18,
           checker_mode = $19,
           updated_at = NOW()
       WHERE id = $1`,
      [
        problemId,
        problem.title,
        problem.statement,
        problem.official_solution,
        problem.input_format,
        problem.output_format,
        problem.constraints,
        BASE_META.difficulty,
        problem.tags,
        BASE_META.source,
        BASE_META.time_limit_ms,
        BASE_META.memory_limit_mb,
        BASE_META.input_source,
        BASE_META.output_target,
        BASE_META.curriculum_level,
        BASE_META.curriculum_chapter_id,
        BASE_META.curriculum_subcategory_id,
        BASE_META.solution_mode,
        BASE_META.checker_mode,
      ],
    );
    await client.query(`DELETE FROM test_cases WHERE problem_id = $1`, [problemId]);
  } else {
    const insertResult = await client.query(
      `INSERT INTO problems (
        title, slug, statement, official_solution, input_format, output_format, constraints,
        difficulty, tags, source, is_published, time_limit_ms, memory_limit_mb, input_source, output_target,
        curriculum_level, curriculum_chapter_id, curriculum_subcategory_id, solution_mode, checker_mode
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING id`,
      [
        problem.title,
        problem.slug,
        problem.statement,
        problem.official_solution,
        problem.input_format,
        problem.output_format,
        problem.constraints,
        BASE_META.difficulty,
        problem.tags,
        BASE_META.source,
        BASE_META.time_limit_ms,
        BASE_META.memory_limit_mb,
        BASE_META.input_source,
        BASE_META.output_target,
        BASE_META.curriculum_level,
        BASE_META.curriculum_chapter_id,
        BASE_META.curriculum_subcategory_id,
        BASE_META.solution_mode,
        BASE_META.checker_mode,
      ],
    );
    problemId = insertResult.rows[0].id;
  }

  for (let i = 0; i < problem.tests.length; i += 1) {
    const t = problem.tests[i];
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
    for (const p of materializedProblems) {
      await upsertProblem(client, p);
    }
    await client.query("COMMIT");
    console.log(`Seed complete. Upserted ${materializedProblems.length} cifrele-unui-numar problems.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to seed cifrele-unui-numar problems:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
