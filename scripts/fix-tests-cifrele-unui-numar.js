/**
 * Regenereaza testele ascunse pentru subcategoria grade9 `cifrele-unui-numar`, astfel incat:
 *  - TOATE input-urile respecta restrictiile din enunt (inainte existau n-uri de 10 cifre peste 10^9, care nici nu
 *    incap in `int`, deci picau solutii corecte);
 *  - valorile sunt distribuite pe tot intervalul valid (pe toate lungimile, nu doar capete + numere mici);
 *  - la problemele DA/NU, cazurile DA si NU sunt echilibrate si pe numere mari.
 * Testele-exemplu (is_sample) raman neschimbate (apar in enunt); se valideaza doar.
 * Raspunsurile se calculeaza rulând solutiile oficiale C++ si Python prin /api/submissions/run; un test se accepta
 * doar daca ambele dau acelasi rezultat.
 *
 * Rulare (din containerul backend, unde sunt DATABASE_URL si API-ul):
 *   docker cp scripts/fix-tests-cifrele-unui-numar.js zecelainfo-backend-1:/app/
 *   docker exec zecelainfo-backend-1 node /app/fix-tests-cifrele-unui-numar.js           # dry-run
 *   docker exec zecelainfo-backend-1 node /app/fix-tests-cifrele-unui-numar.js --apply   # scrie in DB
 */
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const API = "http://localhost:4000";
const APPLY = process.argv.includes("--apply");
const HIDDEN_COUNT = 8;

// ---------- PRNG determinist (rezultate reproductibile) ----------
let seed = 20261013;
function rand() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const randInt = (a, b) => a + Math.floor(rand() * (b - a + 1));
/** Numar aleator cu exact `len` cifre, in [lo, hi]. */
function randomOfLength(len, lo, hi) {
  const a = Math.max(lo, len === 1 ? 0 : 10 ** (len - 1));
  const b = Math.min(hi, 10 ** len - 1);
  return a > b ? null : randInt(a, b);
}

// ---------- predicate pentru problemele DA/NU ----------
const digits = (n) => String(n).split("").map(Number);
const isPal10 = (n) => String(n) === String(n).split("").reverse().join("");
const isPal2 = (n) => {
  const b = n.toString(2);
  return b === b.split("").reverse().join("");
};
const isDistinct = (n) => new Set(String(n)).size === String(n).length;
function isHappy(n) {
  const seen = new Set();
  while (n !== 1 && !seen.has(n)) {
    seen.add(n);
    n = digits(n).reduce((s, d) => s + d * d, 0);
  }
  return n === 1;
}
const ARMSTRONG = [1, 2, 3, 4, 5, 6, 7, 8, 9, 153, 370, 371, 407, 1634, 8208, 9474, 54748, 92727, 93084, 548834, 1741725,
  4210818, 9800817, 9926315, 24678050, 24678051, 88593477, 146511208, 472335975, 534494836, 912985153];
const isArmstrong = (n) => ARMSTRONG.includes(n);

/** Gaseste un numar de lungime `len` in [lo,hi] cu predicate(n) === want. */
function findOfLength(len, lo, hi, predicate, want) {
  if (predicate === isArmstrong && want) {
    const pool_ = ARMSTRONG.filter((n) => String(n).length === len && n >= lo && n <= hi);
    return pool_.length ? pool_[randInt(0, pool_.length - 1)] : null;
  }
  if (predicate === isPal10 && want) {
    const half = Math.ceil(len / 2);
    for (let i = 0; i < 50; i++) {
      const h = String(randomOfLength(half, 0, 10 ** half - 1) ?? 0).padStart(half, "0");
      if (len > 1 && h[0] === "0") continue;
      const s = h + h.slice(0, len - half).split("").reverse().join("");
      const n = Number(s);
      if (n >= lo && n <= hi) return n;
    }
    return null;
  }
  if (predicate === isPal2 && want) {
    // palindrom binar cu numar de biti ales astfel incat valoarea sa aiba `len` cifre zecimale
    for (let i = 0; i < 5000; i++) {
      const bits = randInt(Math.max(1, Math.floor((len - 1) * 3.33)), Math.ceil(len * 3.33));
      const half = Math.ceil(bits / 2);
      let h = "1";
      for (let k = 1; k < half; k++) h += rand() < 0.5 ? "0" : "1";
      const b = h + h.slice(0, bits - half).split("").reverse().join("");
      const n = parseInt(b, 2);
      if (String(n).length === len && n >= lo && n <= hi) return n;
    }
    return null;
  }
  if (predicate === isDistinct && want) {
    for (let i = 0; i < 1000; i++) {
      const pool_ = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => rand() - 0.5);
      if (pool_[0] === 0 && len > 1) continue;
      const n = Number(pool_.slice(0, len).join(""));
      if (n >= lo && n <= hi && String(n).length === len) return n;
    }
    return null;
  }
  for (let i = 0; i < 200000; i++) {
    const n = randomOfLength(len, lo, hi);
    if (n === null) return null;
    if (predicate(n) === want) return n;
  }
  return null;
}

// ---------- configurare per problema ----------
// lo/hi = restrictiile din enunt; digitParam = se citeste si o cifra c (0..9); predicate = problema DA/NU;
// specials = cazuri relevante specifice (trebuie sa fie valide).
const MAX = 1000000000;
const PROBLEMS = {
  "cea-mai-mare-cifra-a-unui-numar": { lo: 0, hi: MAX, specials: [102030405, 888888888] },
  // exemplul 1029384756 depasea restrictia; 908070605 arata la fel ca zerourile se ignora (raspuns 5, nu 0)
  "cea-mai-mica-cifra-nenula-a-unui-numar": {
    lo: 1, hi: MAX, specials: [900000009, 3300000], replaceSamples: { "1029384756": "908070605" },
  },
  "cel-mai-mare-numar-obtinut-prin-eliminarea-unei-cifre": { lo: 10, hi: MAX, specials: [10, 987654321, 100200300] },
  "cifra-de-control-a-unui-numar": { lo: 0, hi: MAX, specials: [999999999, 19] },
  "duplicarea-cifrelor-impare-ale-unui-numar": { lo: 1, hi: MAX, specials: [999999999, 246802468] },
  "duplicarea-cifrelor-pare-ale-unui-numar": { lo: 1, hi: MAX, specials: [888888888, 135791357] },
  "duplicarea-cifrelor-prime-ale-unui-numar": { lo: 1, hi: MAX, specials: [777777777, 146891046] },
  "eliminarea-unei-cifre-dintr-un-numar": {
    lo: 1, hi: MAX, digitParam: true,
    specials: ["555555555 5", "1000000000 0", "1000000000 1", "123456789 0"],
  },
  "numar-palindrom-in-baza-2": { lo: 1, hi: MAX, predicate: isPal2, specials: [MAX] },
  "numararea-aparitiilor-unei-cifre-intr-un-numar": {
    lo: 1, hi: MAX, digitParam: true,
    specials: ["1000000000 0", "999999999 9", "123456789 0"],
  },
  "numarul-de-cifre-al-unui-numar": { lo: 0, hi: MAX, specials: [MAX, 999999999, 10] },
  "numarul-de-cifre-impare-dintr-un-numar": { lo: 1, hi: MAX, specials: [MAX, 975319753] },
  "numarul-de-cifre-pare-dintr-un-numar": { lo: 1, hi: MAX, specials: [MAX, 864208642] },
  "numarul-de-cifre-prime-dintr-un-numar": { lo: 1, hi: MAX, specials: [MAX, 235723572] },
  "numarul-lui-armstrong": { lo: 1, hi: 999999999, predicate: isArmstrong, specials: [999999999] },
  "produsul-cifrelor-nenule-ale-unui-numar": { lo: 1, hi: MAX, specials: [MAX, 999999999] },
  "produsul-cifrelor-unui-numar": { lo: 0, hi: MAX, specials: [MAX, 999999999] },
  "rasturnatul-unui-numar": { lo: 0, hi: MAX, specials: [MAX, 120000000, 999999999] },
  "sorteaza-cifrele-unui-numar-crescator": { lo: 0, hi: MAX, specials: [MAX, 907050301] },
  "suma-cifrelor-impare-ale-unui-numar": { lo: 0, hi: MAX, specials: [MAX, 999999999] },
  "suma-cifrelor-pare-ale-unui-numar": { lo: 0, hi: MAX, specials: [MAX, 888888888] },
  "suma-cifrelor-prime-dintr-un-numar": { lo: 1, hi: MAX, specials: [MAX, 777777777] },
  "suma-cifrelor-unui-numar": { lo: 0, hi: MAX, specials: [MAX, 999999999] },
  "verifica-daca-toate-cifrele-unui-numar-sunt-distincte": { lo: 0, hi: MAX, predicate: isDistinct, specials: [MAX] },
  "verifica-daca-un-numar-e-happy-number": { lo: 1, hi: MAX, predicate: isHappy, specials: [MAX] },
  "verifica-daca-un-numar-e-palindrom-numeric": { lo: 0, hi: MAX, predicate: isPal10, specials: [MAX, 999999999] },
};

function parseInput(cfg, input) {
  const parts = input.trim().split(/\s+/).map(Number);
  return cfg.digitParam ? { n: parts[0], c: parts[1], count: parts.length } : { n: parts[0], count: parts.length };
}
function isValid(cfg, input) {
  const { n, c, count } = parseInput(cfg, input);
  if (count !== (cfg.digitParam ? 2 : 1) || !Number.isInteger(n) || n < cfg.lo || n > cfg.hi) return false;
  if (cfg.digitParam && !(Number.isInteger(c) && c >= 0 && c <= 9)) return false;
  return true;
}

function buildHidden(cfg, sampleInputs) {
  const out = [];
  const seen = new Set(sampleInputs.map((s) => s.trim()));
  const push = (input) => {
    const s = String(input).trim();
    if (out.length >= HIDDEN_COUNT || seen.has(s) || !isValid(cfg, s)) return false;
    seen.add(s);
    out.push(s);
    return true;
  };
  const withDigit = (n, absent = false) => {
    const ds = [...new Set(String(n).split(""))];
    if (absent) {
      const missing = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !ds.includes(String(d)));
      return missing.length ? `${n} ${missing[randInt(0, missing.length - 1)]}` : `${n} ${ds[0]}`;
    }
    return `${n} ${ds[randInt(0, ds.length - 1)]}`;
  };

  for (const special of cfg.specials ?? []) push(special);
  // capatul de jos al intervalului, daca nu e deja printre exemple
  push(cfg.digitParam ? `${cfg.lo} ${String(cfg.lo)[0]}` : cfg.lo);

  // restul: valori pe toate lungimile, de la 2 cifre pana la lungimea maxima permisa
  const maxLen = String(cfg.hi).length === 10 ? 9 : String(cfg.hi).length;
  const lengths = [];
  for (let len = 2; len <= maxLen; len++) lengths.push(len);
  let want = true;
  let guard = 0;
  while (out.length < HIDDEN_COUNT && guard++ < 200) {
    // prioritate numerelor lungi: parcurgem lungimile de la mare la mica, ciclic
    const len = lengths[lengths.length - 1 - ((guard - 1) % lengths.length)];
    let n;
    if (cfg.predicate) {
      n = findOfLength(len, cfg.lo, cfg.hi, cfg.predicate, want);
      if (n === null) continue;
      if (push(n)) want = !want;
      continue;
    }
    n = randomOfLength(len, cfg.lo, cfg.hi);
    if (n === null) continue;
    push(cfg.digitParam ? withDigit(n, guard % 4 === 0) : n);
  }
  return out;
}

// ---------- rulare prin judge ----------
async function runCustom(language, code, stdin) {
  const res = await fetch(`${API}/api/submissions/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problem_id: "00000000-0000-0000-0000-000000000000", language, code, stdin, mode: "custom" }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`run failed: ${JSON.stringify(json)}`);
  return json.data;
}
const normalize = (text) => String(text ?? "").trim().split(/\r?\n/).map((line) => line.trim()).join("\n");
const outputOf = (data) => normalize(data.stdout ?? data.output ?? "");

async function main() {
  const { rows: problems } = await pool.query(
    `SELECT id, slug, constraints, official_solution_cpp, official_solution_python
     FROM problems WHERE curriculum_subcategory_id = 'cifrele-unui-numar' ORDER BY slug`,
  );
  let ok = 0;
  const failures = [];
  for (const problem of problems) {
    const cfg = PROBLEMS[problem.slug];
    if (!cfg) {
      failures.push(`${problem.slug}: lipseste configurarea`);
      continue;
    }
    const { rows: tests } = await pool.query(
      `SELECT input, expected_output, is_sample, order_index FROM test_cases WHERE problem_id = $1 ORDER BY order_index`,
      [problem.id],
    );
    const samples = tests
      .filter((t) => t.is_sample)
      .map((t) => {
        const replacement = cfg.replaceSamples?.[t.input.trim()];
        return replacement ? { ...t, oldInput: t.input, input: replacement, expected_output: undefined } : t;
      });
    const invalidOld = tests.filter((t) => !isValid(cfg, t.input)).map((t) => t.input);
    const badSamples = samples.filter((t) => !isValid(cfg, t.input));
    if (badSamples.length) {
      failures.push(`${problem.slug}: exemple invalide ${badSamples.map((t) => t.input).join(", ")}`);
      continue;
    }

    const hidden = buildHidden(cfg, samples.map((t) => t.input));
    if (hidden.length !== HIDDEN_COUNT) {
      failures.push(`${problem.slug}: am generat doar ${hidden.length} teste`);
      continue;
    }

    const results = [];
    let agree = true;
    // verificam si exemplele: raspunsul salvat trebuie sa coincida cu solutia oficiala
    const replacedSamples = [];
    for (const t of [
      ...samples.map((s) => ({ input: s.input, stored: s.expected_output, sample: s })),
      ...hidden.map((input) => ({ input })),
    ]) {
      const [cpp, py] = await Promise.all([
        runCustom("cpp", problem.official_solution_cpp, t.input),
        runCustom("python", problem.official_solution_python, t.input),
      ]);
      const a = outputOf(cpp);
      const b = outputOf(py);
      if (a !== b || a === "") {
        agree = false;
        failures.push(`${problem.slug}: cpp/python difera pe "${t.input}": cpp=${JSON.stringify(a)} py=${JSON.stringify(b)}`);
        break;
      }
      if (t.stored !== undefined && normalize(t.stored) !== a) {
        agree = false;
        failures.push(`${problem.slug}: exemplul "${t.input}" are raspunsul salvat ${JSON.stringify(t.stored)}, oficial ${JSON.stringify(a)}`);
        break;
      }
      if (t.sample && t.sample.oldInput !== undefined) replacedSamples.push({ ...t.sample, output: a });
      else if (!t.sample) results.push({ input: t.input, output: a });
    }
    if (!agree) continue;

    const answers = results.map((r) => r.output);
    console.log(
      `\n# ${problem.slug}  [${cfg.lo}..${cfg.hi}${cfg.digitParam ? ", c 0..9" : ""}]` +
        (invalidOld.length ? `\n  teste vechi INVALIDE: ${invalidOld.join(", ")}` : "") +
        replacedSamples.map((r) => `\n  EXEMPLU inlocuit: ${r.oldInput} -> ${r.input} (raspuns ${r.output})`).join("") +
        `\n  noi: ${results.map((r) => `${r.input} -> ${r.output.replace(/\n/g, " / ")}`).join(" ; ")}` +
        (cfg.predicate ? `\n  distributie raspunsuri: ${JSON.stringify(answers.reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {}))}` : ""),
    );

    if (APPLY) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(`DELETE FROM test_cases WHERE problem_id = $1 AND is_sample = false`, [problem.id]);
        for (const r of replacedSamples) {
          await client.query(
            `UPDATE test_cases SET input = $3, expected_output = $4
             WHERE problem_id = $1 AND is_sample = true AND input = $2`,
            [problem.id, r.oldInput, r.input, r.output],
          );
        }
        const startIndex = samples.reduce((m, s) => Math.max(m, s.order_index), -1) + 1;
        for (let i = 0; i < results.length; i++) {
          await client.query(
            `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index)
             VALUES ($1, $2, $3, false, 10, $4)`,
            [problem.id, results[i].input, results[i].output, startIndex + i],
          );
        }
        await client.query(`UPDATE problems SET updated_at = NOW() WHERE id = $1`, [problem.id]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    }
    ok++;
  }
  console.log(`\n${APPLY ? "APLICAT" : "DRY-RUN"}: ${ok}/${problems.length} probleme OK`);
  if (failures.length) console.log("PROBLEME:\n  " + failures.join("\n  "));
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
