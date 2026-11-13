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
  curriculum_subcategory_id: "maxime-minime",
  solution_mode: "full",
  checker_mode: "exact",
  source: "Sursa interna",
};

const NOT_FOUND = "NU EXISTA\n";

function buildCppTemplate(title) {
  return [
    "#include <bits/stdc++.h>",
    "using namespace std;",
    "",
    "int main() {",
    `  // ${title}`,
    "  // Solutie pe baza parcurgerii sirului, mentinere min/max si eventuale frecvente.",
    "  return 0;",
    "}",
  ].join("\n");
}

function inputLine(params) {
  return `${params.join(" ")}\n`;
}

function listFromParams(params) {
  const n = Number(params[0]);
  return params.slice(1, 1 + n).map(Number);
}

function maxSubarraySum(arr) {
  let best = -Infinity;
  let cur = 0;
  for (const x of arr) {
    cur = Math.max(x, cur + x);
    best = Math.max(best, cur);
  }
  return best;
}

const problems = [
  {
    slug: "minimul-din-sir",
    title: "Valoarea minima dintr-un sir",
    statement: "Se citeste un sir de n numere. Determinati valoarea minima.",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Se afiseaza valoarea minima.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => `${Math.min(...listFromParams(p))}\n`,
  },
  {
    slug: "maximul-din-sir",
    title: "Valoarea maxima dintr-un sir",
    statement: "Se citeste un sir de n numere. Determinati valoarea maxima.",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Se afiseaza valoarea maxima.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => `${Math.max(...listFromParams(p))}\n`,
  },
  {
    slug: "minim-si-maxim-din-sir",
    title: "Minim si maxim dintr-un sir",
    statement: "Determinati minimul si maximul dintr-un sir.",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Se afiseaza minimul si maximul, separate prin spatiu.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const a = listFromParams(p);
      return `${Math.min(...a)} ${Math.max(...a)}\n`;
    },
  },
  {
    slug: "minimul-numerelor-pare-din-sir",
    title: "Minimul numerelor pare din sir",
    statement: "Determinati minimul numerelor pare dintr-un sir.",
    input_format: "Pe prima linie n, pe a doua linie n numere intregi.",
    output_format: "Se afiseaza minimul par sau NU EXISTA.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const ev = listFromParams(p).filter((x) => x % 2 === 0);
      return ev.length ? `${Math.min(...ev)}\n` : NOT_FOUND;
    },
  },
  {
    slug: "maximul-numerelor-impare-din-sir",
    title: "Maximul numerelor impare din sir",
    statement: "Determinati maximul numerelor impare dintr-un sir.",
    input_format: "Pe prima linie n, pe a doua linie n numere intregi.",
    output_format: "Se afiseaza maximul impar sau NU EXISTA.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const odd = listFromParams(p).filter((x) => Math.abs(x) % 2 === 1);
      return odd.length ? `${Math.max(...odd)}\n` : NOT_FOUND;
    },
  },
  {
    slug: "minimul-numerelor-pozitive-din-sir",
    title: "Minimul numerelor pozitive din sir",
    statement: "Determinati minimul numerelor pozitive din sir.",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Se afiseaza minimul pozitiv sau NU EXISTA.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const a = listFromParams(p).filter((x) => x > 0);
      return a.length ? `${Math.min(...a)}\n` : NOT_FOUND;
    },
  },
  {
    slug: "maximul-numerelor-negative-din-sir",
    title: "Maximul numerelor negative din sir",
    statement: "Determinati maximul numerelor negative din sir.",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Se afiseaza maximul negativ sau NU EXISTA.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const a = listFromParams(p).filter((x) => x < 0);
      return a.length ? `${Math.max(...a)}\n` : NOT_FOUND;
    },
  },
  {
    slug: "cel-mai-mic-impar-si-cel-mai-mare-par",
    title: "Cel mai mic impar si cel mai mare par",
    statement: "Determinati cel mai mic numar impar si cel mai mare numar par.",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Se afiseaza: min_impar max_par; pentru lipsa afisati NU EXISTA in loc.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const a = listFromParams(p);
      const odd = a.filter((x) => Math.abs(x) % 2 === 1);
      const ev = a.filter((x) => x % 2 === 0);
      const left = odd.length ? String(Math.min(...odd)) : "NU EXISTA";
      const right = ev.length ? String(Math.max(...ev)) : "NU EXISTA";
      return `${left} ${right}\n`;
    },
  },
  {
    slug: "diferenta-dintre-maxim-si-minim",
    title: "Diferenta dintre maxim si minim",
    statement: "Determinati diferenta dintre maxim si minim.",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Se afiseaza max - min.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const a = listFromParams(p);
      return `${Math.max(...a) - Math.min(...a)}\n`;
    },
  },
  {
    slug: "numar-elemente-egale-cu-maximul",
    title: "Cate elemente sunt egale cu maximul",
    statement: "Determinati cate elemente sunt egale cu maximul din sir.",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Se afiseaza numarul aparitiilor maximului.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const a = listFromParams(p);
      const mx = Math.max(...a);
      return `${a.filter((x) => x === mx).length}\n`;
    },
  },
  {
    slug: "cele-mai-mari-doua-numere-distincte",
    title: "Cele mai mari doua numere distincte",
    statement: "Determinati cele mai mari doua numere distincte din sir.",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Se afiseaza cele doua valori in ordine descrescatoare sau NU EXISTA.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const uniq = Array.from(new Set(listFromParams(p))).sort((a, b) => b - a);
      return uniq.length >= 2 ? `${uniq[0]} ${uniq[1]}\n` : NOT_FOUND;
    },
  },
  {
    slug: "cele-mai-mici-doua-numere-distincte",
    title: "Cele mai mici doua numere distincte",
    statement: "Determinati cele mai mici doua numere distincte din sir.",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Se afiseaza cele doua valori in ordine crescatoare sau NU EXISTA.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const uniq = Array.from(new Set(listFromParams(p))).sort((a, b) => a - b);
      return uniq.length >= 2 ? `${uniq[0]} ${uniq[1]}\n` : NOT_FOUND;
    },
  },
  {
    slug: "cele-mai-mari-trei-numere",
    title: "Cele mai mari trei numere",
    statement: "Determinati cele mai mari trei numere din sir (nu neaparat distincte).",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Se afiseaza cele 3 valori in ordine descrescatoare sau NU EXISTA daca n<3.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const a = listFromParams(p);
      if (a.length < 3) return NOT_FOUND;
      a.sort((x, y) => y - x);
      return `${a[0]} ${a[1]} ${a[2]}\n`;
    },
  },
  {
    slug: "al-k-lea-cel-mai-mare-element",
    title: "Al k-lea cel mai mare element",
    statement: "Determinati al k-lea cel mai mare element distinct din sir.",
    input_format: "Pe prima linie n k, pe a doua linie n numere.",
    output_format: "Se afiseaza elementul cerut sau NU EXISTA.",
    constraints: "1 <= n <= 2*10^5, 1 <= k <= n, |a_i| <= 10^9",
    solver: (p) => {
      const n = Number(p[0]);
      const k = Number(p[1]);
      const a = p.slice(2, 2 + n).map(Number);
      const uniq = Array.from(new Set(a)).sort((x, y) => y - x);
      return uniq.length >= k ? `${uniq[k - 1]}\n` : NOT_FOUND;
    },
  },
  {
    slug: "pozitiile-maximului",
    title: "Pozitiile pe care apare valoarea maxima",
    statement: "Determinati pozitiile (1-indexat) pe care apare valoarea maxima.",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Se afiseaza pozitiile in ordine crescatoare, separate prin spatiu.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const a = listFromParams(p);
      const mx = Math.max(...a);
      const pos = [];
      for (let i = 0; i < a.length; i += 1) if (a[i] === mx) pos.push(i + 1);
      return `${pos.join(" ")}\n`;
    },
  },
  {
    slug: "cel-mai-mare-par-si-cel-mai-mic-impar-mesaj",
    title: "Cel mai mare par si cel mai mic impar",
    statement:
      "Determinati cel mai mare numar par si cel mai mic numar impar. Daca nu exista, afisati mesaj corespunzator.",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Afisati max_par min_impar, iar pentru lipsa afisati NU EXISTA.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const a = listFromParams(p);
      const ev = a.filter((x) => x % 2 === 0);
      const odd = a.filter((x) => Math.abs(x) % 2 === 1);
      const left = ev.length ? String(Math.max(...ev)) : "NU EXISTA";
      const right = odd.length ? String(Math.min(...odd)) : "NU EXISTA";
      return `${left} ${right}\n`;
    },
  },
  {
    slug: "cel-mai-mare-produs-din-doua-numere",
    title: "Cel mai mare produs din doua numere",
    statement: "Determinati cel mai mare produs format din doua numere din sir.",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Se afiseaza produsul maxim sau NU EXISTA daca n<2.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const a = listFromParams(p).sort((x, y) => x - y);
      if (a.length < 2) return NOT_FOUND;
      const n = a.length;
      const c1 = BigInt(a[n - 1]) * BigInt(a[n - 2]);
      const c2 = BigInt(a[0]) * BigInt(a[1]);
      return `${(c1 > c2 ? c1 : c2).toString()}\n`;
    },
  },
  {
    slug: "cel-mai-mare-element-cu-aparitie-unica",
    title: "Cel mai mare element care apare o singura data",
    statement: "Determinati cel mai mare element care apare o singura data.",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Se afiseaza valoarea sau NU EXISTA.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const a = listFromParams(p);
      const freq = new Map();
      for (const x of a) freq.set(x, (freq.get(x) ?? 0) + 1);
      const candidates = a.filter((x) => freq.get(x) === 1);
      return candidates.length ? `${Math.max(...candidates)}\n` : NOT_FOUND;
    },
  },
  {
    slug: "diferenta-maxima-cu-i-mai-mic-j",
    title: "Diferenta maxima A[j]-A[i] cu i<j",
    statement: "Determinati diferenta maxima dintre doua elemente, cu i < j.",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Se afiseaza diferenta maxima (poate fi negativa) sau NU EXISTA daca n<2.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const a = listFromParams(p);
      if (a.length < 2) return NOT_FOUND;
      let minSoFar = a[0];
      let best = a[1] - a[0];
      for (let j = 1; j < a.length; j += 1) {
        best = Math.max(best, a[j] - minSoFar);
        minSoFar = Math.min(minSoFar, a[j]);
      }
      return `${best}\n`;
    },
  },
  {
    slug: "cel-mai-mic-peste-media-aritmetica",
    title: "Cel mai mic element mai mare decat media",
    statement: "Determinati cel mai mic element care este mai mare decat media aritmetica a sirului.",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Se afiseaza valoarea ceruta sau NU EXISTA.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const a = listFromParams(p);
      const mean = a.reduce((s, x) => s + x, 0) / a.length;
      const candidates = a.filter((x) => x > mean);
      return candidates.length ? `${Math.min(...candidates)}\n` : NOT_FOUND;
    },
  },
  {
    slug: "maximul-sumelor-subsecventelor-lungime-2",
    title: "Maximul sumelor subsecventelor de lungime 2",
    statement: "Determinati maximul dintre sumele tuturor subsecventelor de lungime 2.",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Se afiseaza maximul A[i]+A[i+1], sau NU EXISTA daca n<2.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const a = listFromParams(p);
      if (a.length < 2) return NOT_FOUND;
      let best = a[0] + a[1];
      for (let i = 1; i + 1 < a.length; i += 1) best = Math.max(best, a[i] + a[i + 1]);
      return `${best}\n`;
    },
  },
  {
    slug: "maximul-produselor-a-3-numere-distincte",
    title: "Maximul produselor a 3 numere distincte",
    statement: "Determinati maximul dintre toate produsele a 3 numere distincte din sir.",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Se afiseaza produsul maxim sau NU EXISTA daca sunt <3 valori distincte.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const uniq = Array.from(new Set(listFromParams(p))).sort((a, b) => a - b);
      if (uniq.length < 3) return NOT_FOUND;
      const n = uniq.length;
      const c1 = BigInt(uniq[n - 1]) * BigInt(uniq[n - 2]) * BigInt(uniq[n - 3]);
      const c2 = BigInt(uniq[0]) * BigInt(uniq[1]) * BigInt(uniq[n - 1]);
      return `${(c1 > c2 ? c1 : c2).toString()}\n`;
    },
  },
  {
    slug: "al-doilea-maxim-fara-sortare",
    title: "Al doilea maxim fara sortare",
    statement: "Determinati al doilea maxim distinct fara a sorta sirul.",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Se afiseaza al doilea maxim distinct sau NU EXISTA.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const uniq = Array.from(new Set(listFromParams(p))).sort((a, b) => b - a);
      return uniq.length >= 2 ? `${uniq[1]}\n` : NOT_FOUND;
    },
  },
  {
    slug: "minimul-absolut-cel-mai-apropiat-de-zero",
    title: "Minimul absolut (cel mai apropiat de 0)",
    statement:
      "Determinati elementul cel mai apropiat de 0. In caz de egalitate (ex: -x si x), alegeti valoarea mai mica.",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Se afiseaza valoarea ceruta.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const a = listFromParams(p);
      let best = a[0];
      for (let i = 1; i < a.length; i += 1) {
        const x = a[i];
        if (Math.abs(x) < Math.abs(best) || (Math.abs(x) === Math.abs(best) && x < best)) best = x;
      }
      return `${best}\n`;
    },
  },
  {
    slug: "maximul-prefixelor",
    title: "Maximul prefixelor",
    statement: "Determinati cea mai mare suma de prefix a sirului.",
    input_format: "Pe prima linie n, pe a doua linie n numere.",
    output_format: "Se afiseaza suma maxima de prefix.",
    constraints: "1 <= n <= 2*10^5, |a_i| <= 10^9",
    solver: (p) => {
      const a = listFromParams(p);
      let s = 0;
      let best = -Infinity;
      for (const x of a) {
        s += x;
        best = Math.max(best, s);
      }
      return `${best}\n`;
    },
  },
];

const CASES = {
  "minimul-din-sir": [[5, 3, 7, -1, 9, 0], [1, 5], [4, 2, 2, 2, 2], [5, -5, -2, -9, 0, 3], [3, 1000000000, -1000000000, 7]],
  "maximul-din-sir": [[5, 3, 7, -1, 9, 0], [1, 5], [4, 2, 2, 2, 2], [5, -5, -2, -9, 0, 3], [3, 1000000000, -1000000000, 7]],
  "minim-si-maxim-din-sir": [[5, 3, 7, -1, 9, 0], [1, 5], [4, 2, 2, 2, 2], [5, -5, -2, -9, 0, 3], [3, 1000000000, -1000000000, 7]],
  "minimul-numerelor-pare-din-sir": [[5, 3, 7, -1, 9, 0], [4, 1, 3, 5, 7], [4, 2, 4, 6, 8], [5, -5, -2, -9, 0, 3], [1, -8]],
  "maximul-numerelor-impare-din-sir": [[5, 3, 7, -1, 9, 0], [4, 2, 4, 6, 8], [4, 1, 3, 5, 7], [5, -5, -2, -9, 0, 3], [1, -8]],
  "minimul-numerelor-pozitive-din-sir": [[5, 3, 7, -1, 9, 0], [4, -2, -4, -6, 0], [4, 1, 3, 5, 7], [5, -5, -2, -9, 0, 3], [1, 100]],
  "maximul-numerelor-negative-din-sir": [[5, 3, 7, -1, 9, 0], [4, 2, 4, 6, 8], [4, -1, -3, -5, -7], [5, -5, -2, -9, 0, 3], [1, -100]],
  "cel-mai-mic-impar-si-cel-mai-mare-par": [[5, 3, 7, -1, 9, 0], [4, 2, 4, 6, 8], [4, 1, 3, 5, 7], [5, -5, -2, -9, 0, 3], [1, 0]],
  "diferenta-dintre-maxim-si-minim": [[5, 3, 7, -1, 9, 0], [1, 5], [4, 2, 2, 2, 2], [5, -5, -2, -9, 0, 3], [3, 1000000000, -1000000000, 7]],
  "numar-elemente-egale-cu-maximul": [[5, 3, 7, -1, 9, 0], [1, 5], [4, 2, 2, 2, 2], [6, 1, 9, 9, 3, 9, 0], [3, -1, -1, -1]],
  "cele-mai-mari-doua-numere-distincte": [[5, 3, 7, -1, 9, 0], [1, 5], [4, 2, 2, 2, 2], [6, 1, 9, 9, 3, 9, 0], [3, -1, -2, -3]],
  "cele-mai-mici-doua-numere-distincte": [[5, 3, 7, -1, 9, 0], [1, 5], [4, 2, 2, 2, 2], [6, 1, 9, 9, 3, 9, 0], [3, -1, -2, -3]],
  "cele-mai-mari-trei-numere": [[5, 3, 7, -1, 9, 0], [2, 5, 6], [4, 2, 2, 2, 2], [6, 1, 9, 9, 3, 9, 0], [3, -1, -2, -3]],
  "al-k-lea-cel-mai-mare-element": [[5, 2, 3, 7, -1, 9, 0], [5, 1, 3, 7, -1, 9, 0], [5, 5, 3, 7, -1, 9, 0], [4, 2, 2, 2, 2, 2], [6, 3, 1, 9, 9, 3, 9, 0]],
  "pozitiile-maximului": [[5, 3, 7, -1, 9, 0], [1, 5], [4, 2, 2, 2, 2], [6, 1, 9, 9, 3, 9, 0], [3, -1, -1, -1]],
  "cel-mai-mare-par-si-cel-mai-mic-impar-mesaj": [[5, 3, 7, -1, 9, 0], [4, 2, 4, 6, 8], [4, 1, 3, 5, 7], [5, -5, -2, -9, 0, 3], [1, 0]],
  "cel-mai-mare-produs-din-doua-numere": [[5, 3, 7, -1, 9, 0], [1, 5], [4, -10, -10, 2, 3], [5, -5, -2, -9, 0, 3], [3, 100000, 99999, -100000]],
  "cel-mai-mare-element-cu-aparitie-unica": [[5, 3, 7, -1, 9, 0], [4, 2, 2, 2, 2], [6, 1, 9, 9, 3, 9, 0], [5, -5, -2, -9, 0, 3], [3, -1, -1, -1]],
  "diferenta-maxima-cu-i-mai-mic-j": [[5, 3, 7, -1, 9, 0], [1, 5], [4, 10, 9, 8, 7], [6, 1, 9, 9, 3, 9, 0], [5, -5, -2, -9, 0, 3]],
  "cel-mai-mic-peste-media-aritmetica": [[5, 3, 7, -1, 9, 0], [1, 5], [4, 2, 2, 2, 2], [6, 1, 9, 9, 3, 9, 0], [5, -5, -2, -9, 0, 3]],
  "maximul-sumelor-subsecventelor-lungime-2": [[5, 3, 7, -1, 9, 0], [1, 5], [4, 2, 2, 2, 2], [6, 1, 9, 9, 3, 9, 0], [5, -5, -2, -9, 0, 3]],
  "maximul-produselor-a-3-numere-distincte": [[5, 3, 7, -1, 9, 0], [2, 5, 6], [4, 2, 2, 2, 2], [6, -10, -9, 3, 4, 5, 6], [3, -1, -2, -3]],
  "al-doilea-maxim-fara-sortare": [[5, 3, 7, -1, 9, 0], [1, 5], [4, 2, 2, 2, 2], [6, 1, 9, 9, 3, 9, 0], [3, -1, -2, -3]],
  "minimul-absolut-cel-mai-apropiat-de-zero": [[5, 3, 7, -1, 9, 0], [1, 5], [4, -2, 2, 3, 4], [6, -10, -9, 3, 4, 5, 6], [3, -1, -2, -3]],
  "maximul-prefixelor": [[5, 3, 7, -1, 9, 0], [1, 5], [4, -2, -3, -1, -4], [6, 1, 9, 9, 3, 9, 0], [5, -5, -2, -9, 0, 3]],
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
    tags: ["clasa9", "maxime-minime"],
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
    console.log(`Seed complete. Upserted ${allProblems.length} maxime-minime problems.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to seed maxime-minime problems:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
