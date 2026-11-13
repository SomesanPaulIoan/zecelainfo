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
  curriculum_chapter_id: "probleme-elementare",
  curriculum_subcategory_id: "operatori-expresii",
  solution_mode: "full",
  checker_mode: "exact",
  source: "Sursa interna",
};

function fixed2(value) {
  return Number(value).toFixed(2);
}

const problems = [
  {
    slug: "suma-cifrelor-numar-3-cifre",
    title: "Suma cifrelor unui numar de 3 cifre",
    statement:
      "Se citeste un numar natural n, format din exact 3 cifre. Sa se afiseze suma cifrelor sale.\n\nExemplu: pentru n = 572, suma cifrelor este 5 + 7 + 2 = 14.",
    official_solution:
      "Observam ca pentru un numar de 3 cifre n, putem extrage cifrele astfel:\n- cifra sutelor: n / 100\n- cifra zecilor: (n / 10) % 10\n- cifra unitatilor: n % 10\n\nSuma ceruta este suma acestor trei valori.\n\nComplexitate: O(1).",
    input_format: "Se citeste un singur numar natural n (100 <= n <= 999).",
    output_format: "Se afiseaza un singur numar natural: suma cifrelor lui n.",
    constraints: "100 <= n <= 999",
    tags: ["clasa9", "operatori-expresii", "cifre"],
    tests: [
      { input: "123\n", expected: "6\n", isSample: true },
      { input: "100\n", expected: "1\n" },
      { input: "909\n", expected: "18\n" },
      { input: "555\n", expected: "15\n" },
      { input: "781\n", expected: "16\n" },
    ],
  },
  {
    slug: "inversul-unui-numar-de-3-cifre",
    title: "Inversul unui numar de 3 cifre",
    statement:
      "Se citeste un numar natural n, format din exact 3 cifre. Afisati numarul obtinut prin inversarea cifrelor.\n\nExemplu: n = 407 -> inversul este 704.",
    official_solution:
      "Extragem cifrele:\n- suta = n / 100\n- zece = (n / 10) % 10\n- unitate = n % 10\n\nNumarul inversat este: unitate * 100 + zece * 10 + suta.\n\nComplexitate: O(1).",
    input_format: "Se citeste un numar natural n (100 <= n <= 999).",
    output_format: "Se afiseaza numarul obtinut prin inversarea cifrelor lui n.",
    constraints: "100 <= n <= 999",
    tags: ["clasa9", "operatori-expresii", "cifre"],
    tests: [
      { input: "123\n", expected: "321\n", isSample: true },
      { input: "100\n", expected: "1\n" },
      { input: "907\n", expected: "709\n" },
      { input: "450\n", expected: "54\n" },
      { input: "999\n", expected: "999\n" },
    ],
  },
  {
    slug: "media-aritmetica-a-doua-numere-reale",
    title: "Media aritmetica a doua numere reale",
    statement:
      "Se citesc doua numere reale a si b. Sa se afiseze media lor aritmetica.\n\nFormula: media = (a + b) / 2.",
    official_solution:
      "Media aritmetica a doua numere reale a si b este (a + b) / 2.\n\nPentru un format predictibil al iesirii, afisam rezultatul cu 2 zecimale fixe.\n\nComplexitate: O(1).",
    input_format: "Se citesc doua numere reale a si b, separate prin spatiu.",
    output_format: "Se afiseaza media aritmetica a numerelor, cu exact 2 zecimale.",
    constraints: "-10^6 <= a, b <= 10^6",
    tags: ["clasa9", "operatori-expresii", "medie", "numere-reale"],
    tests: [
      { input: "4 8\n", expected: "6.00\n", isSample: true },
      { input: "1 2\n", expected: "1.50\n" },
      { input: "-5 7\n", expected: "1.00\n" },
      { input: "0.1 0.2\n", expected: "0.15\n" },
      { input: "-3.5 -2.5\n", expected: "-3.00\n" },
      { input: "1000 0\n", expected: "500.00\n" },
    ],
  },
  {
    slug: "transformare-grade-celsius-in-fahrenheit",
    title: "Transformare din grade Celsius in Fahrenheit",
    statement:
      "Se citeste temperatura C in grade Celsius. Afisati echivalentul in grade Fahrenheit.\n\nFormula de conversie este:\nF = C * 9 / 5 + 32",
    official_solution:
      "Aplicam direct formula de conversie:\nF = C * 9 / 5 + 32.\n\nAfisam rezultatul cu 2 zecimale fixe.\n\nComplexitate: O(1).",
    input_format: "Se citeste un numar real C (temperatura in grade Celsius).",
    output_format: "Se afiseaza temperatura in grade Fahrenheit, cu 2 zecimale.",
    constraints: "-200 <= C <= 200",
    tags: ["clasa9", "operatori-expresii", "conversie", "numere-reale"],
    tests: [
      { input: "0\n", expected: "32.00\n", isSample: true },
      { input: "100\n", expected: "212.00\n" },
      { input: "-40\n", expected: "-40.00\n" },
      { input: "37\n", expected: "98.60\n" },
      { input: "25.5\n", expected: "77.90\n" },
    ],
  },
  {
    slug: "ultima-cifra-a-unui-numar",
    title: "Ultima cifra a unui numar",
    statement:
      "Se citeste un numar natural n. Afisati ultima cifra a numarului.",
    official_solution:
      "Ultima cifra a unui numar natural n se obtine cu operatorul modulo 10:\nultima = n % 10.\n\nComplexitate: O(1).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza ultima cifra a lui n.",
    constraints: "0 <= n <= 10^9",
    tags: ["clasa9", "operatori-expresii", "cifre", "modulo"],
    tests: [
      { input: "127\n", expected: "7\n", isSample: true },
      { input: "90\n", expected: "0\n" },
      { input: "5\n", expected: "5\n" },
      { input: "123456789\n", expected: "9\n" },
      { input: "1000000000\n", expected: "0\n" },
    ],
  },
  {
    slug: "prima-cifra-a-unui-numar-de-3-cifre",
    title: "Prima cifra a unui numar de 3 cifre",
    statement:
      "Se citeste un numar natural n, format din exact 3 cifre. Afisati prima cifra a numarului.",
    official_solution:
      "Pentru un numar de 3 cifre, prima cifra (sutele) este n / 100 (impartire intreaga).\n\nComplexitate: O(1).",
    input_format: "Se citeste un numar natural n (100 <= n <= 999).",
    output_format: "Se afiseaza prima cifra a lui n.",
    constraints: "100 <= n <= 999",
    tags: ["clasa9", "operatori-expresii", "cifre"],
    tests: [
      { input: "572\n", expected: "5\n", isSample: true },
      { input: "100\n", expected: "1\n" },
      { input: "907\n", expected: "9\n" },
      { input: "450\n", expected: "4\n" },
      { input: "999\n", expected: "9\n" },
    ],
  },
  {
    slug: "numar-de-minute-in-secunde",
    title: "Numarul de minute in secunde",
    statement:
      "Se citeste un numar natural m (minute). Afisati cate secunde reprezinta.",
    official_solution:
      "1 minut = 60 secunde.\nPrin urmare, pentru m minute, numarul de secunde este m * 60.\n\nComplexitate: O(1).",
    input_format: "Se citeste un numar natural m.",
    output_format: "Se afiseaza numarul de secunde corespunzator.",
    constraints: "0 <= m <= 10^6",
    tags: ["clasa9", "operatori-expresii", "conversie"],
    tests: [
      { input: "2\n", expected: "120\n", isSample: true },
      { input: "0\n", expected: "0\n" },
      { input: "15\n", expected: "900\n" },
      { input: "123\n", expected: "7380\n" },
      { input: "100000\n", expected: "6000000\n" },
    ],
  },
  {
    slug: "suma-si-produsul-a-doua-numere",
    title: "Suma si produsul a doua numere",
    statement:
      "Se citesc doua numere intregi a si b. Afisati suma lor si produsul lor.",
    official_solution:
      "Calculam direct:\n- suma = a + b\n- produs = a * b\n\nAfisam cele doua valori pe aceeasi linie, separate prin spatiu.\n\nComplexitate: O(1).",
    input_format: "Se citesc doua numere intregi a si b.",
    output_format: "Se afiseaza suma si produsul, in aceasta ordine, separate prin spatiu.",
    constraints: "-10^6 <= a, b <= 10^6",
    tags: ["clasa9", "operatori-expresii", "aritmetica"],
    tests: [
      { input: "3 4\n", expected: "7 12\n", isSample: true },
      { input: "-2 5\n", expected: "3 -10\n" },
      { input: "0 10\n", expected: "10 0\n" },
      { input: "1000 2000\n", expected: "3000 2000000\n" },
      { input: "-7 -8\n", expected: "-15 56\n" },
    ],
  },
  {
    slug: "schimb-de-valori-fara-variabila-auxiliara",
    title: "Schimb de valori fara variabila auxiliara",
    statement:
      "Se citesc doua numere intregi a si b. Afisati valorile lor inversate, fara a folosi variabila auxiliara.\n\nObservatie: la afisare trebuie sa apara mai intai noua valoare a lui a, apoi noua valoare a lui b.",
    official_solution:
      "Putem face schimbul folosind operatii aritmetice:\n1) a = a + b\n2) b = a - b\n3) a = a - b\n\nLa final, valorile sunt inversate.\n\nComplexitate: O(1).",
    input_format: "Se citesc doua numere intregi a si b.",
    output_format: "Se afiseaza valorile inversate, separate prin spatiu.",
    constraints: "-10^6 <= a, b <= 10^6",
    tags: ["clasa9", "operatori-expresii", "swap"],
    tests: [
      { input: "7 11\n", expected: "11 7\n", isSample: true },
      { input: "-5 2\n", expected: "2 -5\n" },
      { input: "0 0\n", expected: "0 0\n" },
      { input: "123 456\n", expected: "456 123\n" },
      { input: "-100 -1\n", expected: "-1 -100\n" },
    ],
  },
  {
    slug: "aria-si-perimetrul-unui-dreptunghi",
    title: "Aria si perimetrul unui dreptunghi",
    statement:
      "Se citesc lungimea L si latimea l ale unui dreptunghi. Afisati aria si perimetrul.\n\nFormule:\nAria = L * l\nPerimetrul = 2 * (L + l)",
    official_solution:
      "Aplicam formulele standard:\n- aria = L * l\n- perimetru = 2 * (L + l)\n\nAfisam valorile cu 2 zecimale.\n\nComplexitate: O(1).",
    input_format: "Se citesc doua numere reale L si l.",
    output_format: "Se afiseaza aria si perimetrul, cu 2 zecimale, separate prin spatiu.",
    constraints: "0 <= L, l <= 10^6",
    tags: ["clasa9", "operatori-expresii", "geometrie", "numere-reale"],
    tests: [
      { input: "3 4\n", expected: "12.00 14.00\n", isSample: true },
      { input: "5 5\n", expected: "25.00 20.00\n" },
      { input: "2.5 10\n", expected: "25.00 25.00\n" },
      { input: "1.2 3.4\n", expected: "4.08 9.20\n" },
      { input: "100 50\n", expected: "5000.00 300.00\n" },
    ],
  },
];

const validators = {
  "suma-cifrelor-numar-3-cifre": (input) => {
    const n = Number(input.trim());
    return `${Math.floor(n / 100) + Math.floor(n / 10) % 10 + (n % 10)}\n`;
  },
  "inversul-unui-numar-de-3-cifre": (input) => {
    const n = Number(input.trim());
    const s = Math.floor(n / 100);
    const z = Math.floor(n / 10) % 10;
    const u = n % 10;
    return `${u * 100 + z * 10 + s}\n`;
  },
  "media-aritmetica-a-doua-numere-reale": (input) => {
    const [a, b] = input.trim().split(/\s+/).map(Number);
    return `${fixed2((a + b) / 2)}\n`;
  },
  "transformare-grade-celsius-in-fahrenheit": (input) => {
    const c = Number(input.trim());
    return `${fixed2((c * 9) / 5 + 32)}\n`;
  },
  "ultima-cifra-a-unui-numar": (input) => {
    const n = Number(input.trim());
    return `${Math.abs(n) % 10}\n`;
  },
  "prima-cifra-a-unui-numar-de-3-cifre": (input) => {
    const n = Number(input.trim());
    return `${Math.floor(n / 100)}\n`;
  },
  "numar-de-minute-in-secunde": (input) => {
    const m = Number(input.trim());
    return `${m * 60}\n`;
  },
  "suma-si-produsul-a-doua-numere": (input) => {
    const [a, b] = input.trim().split(/\s+/).map(Number);
    return `${a + b} ${a * b}\n`;
  },
  "schimb-de-valori-fara-variabila-auxiliara": (input) => {
    const [a, b] = input.trim().split(/\s+/).map(Number);
    return `${b} ${a}\n`;
  },
  "aria-si-perimetrul-unui-dreptunghi": (input) => {
    const [L, l] = input.trim().split(/\s+/).map(Number);
    return `${fixed2(L * l)} ${fixed2(2 * (L + l))}\n`;
  },
};

function assertTests() {
  for (const problem of problems) {
    if (problem.tests.length < 5) {
      throw new Error(`Problem ${problem.slug} has less than 5 tests.`);
    }
    if (!problem.tests.some((test) => test.isSample)) {
      throw new Error(`Problem ${problem.slug} has no sample test.`);
    }
    const validate = validators[problem.slug];
    if (!validate) throw new Error(`No validator for ${problem.slug}`);
    for (const test of problem.tests) {
      const expected = validate(test.input);
      if (expected !== test.expected) {
        throw new Error(
          `Test mismatch for ${problem.slug}. Input: ${JSON.stringify(test.input)} expected ${JSON.stringify(test.expected)} computed ${JSON.stringify(expected)}`,
        );
      }
    }
  }
}

function buildOfficialCppSolution(slug) {
  switch (slug) {
    case "suma-cifrelor-numar-3-cifre":
      return `#include <iostream>
using namespace std;
int main() {
  int n; cin >> n;
  int s = n / 100;
  int z = (n / 10) % 10;
  int u = n % 10;
  cout << (s + z + u);
  return 0;
}`;
    case "inversul-unui-numar-de-3-cifre":
      return `#include <iostream>
using namespace std;
int main() {
  int n; cin >> n;
  int s = n / 100;
  int z = (n / 10) % 10;
  int u = n % 10;
  cout << (u * 100 + z * 10 + s);
  return 0;
}`;
    case "media-aritmetica-a-doua-numere-reale":
      return `#include <iostream>
#include <iomanip>
using namespace std;
int main() {
  double a, b; cin >> a >> b;
  cout << fixed << setprecision(2) << (a + b) / 2.0;
  return 0;
}`;
    case "transformare-grade-celsius-in-fahrenheit":
      return `#include <iostream>
#include <iomanip>
using namespace std;
int main() {
  double c; cin >> c;
  double f = c * 9.0 / 5.0 + 32.0;
  cout << fixed << setprecision(2) << f;
  return 0;
}`;
    case "ultima-cifra-a-unui-numar":
      return `#include <iostream>
using namespace std;
int main() {
  long long n; cin >> n;
  cout << (n % 10 + 10) % 10;
  return 0;
}`;
    case "prima-cifra-a-unui-numar-de-3-cifre":
      return `#include <iostream>
using namespace std;
int main() {
  int n; cin >> n;
  cout << n / 100;
  return 0;
}`;
    case "numar-de-minute-in-secunde":
      return `#include <iostream>
using namespace std;
int main() {
  long long m; cin >> m;
  cout << m * 60;
  return 0;
}`;
    case "suma-si-produsul-a-doua-numere":
      return `#include <iostream>
using namespace std;
int main() {
  long long a, b; cin >> a >> b;
  cout << (a + b) << " " << (a * b);
  return 0;
}`;
    case "schimb-de-valori-fara-variabila-auxiliara":
      return `#include <iostream>
using namespace std;
int main() {
  long long a, b; cin >> a >> b;
  a = a + b;
  b = a - b;
  a = a - b;
  cout << a << " " << b;
  return 0;
}`;
    case "aria-si-perimetrul-unui-dreptunghi":
      return `#include <iostream>
#include <iomanip>
using namespace std;
int main() {
  double L, l; cin >> L >> l;
  double aria = L * l;
  double perimetru = 2 * (L + l);
  cout << fixed << setprecision(2) << aria << " " << perimetru;
  return 0;
}`;
    default:
      return "";
  }
}

async function upsertProblem(client, problem) {
  const existing = await client.query(
    `SELECT id FROM problems WHERE slug = $1 LIMIT 1`,
    [problem.slug],
  );

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
    const inserted = await client.query(
      `INSERT INTO problems (
         title, slug, statement, official_solution, input_format, output_format, constraints,
         difficulty, tags, source, is_published, time_limit_ms, memory_limit_mb,
         input_source, output_target, curriculum_level, curriculum_chapter_id, curriculum_subcategory_id,
         solution_mode, checker_mode
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
    problemId = inserted.rows[0].id;
  }

  for (let i = 0; i < problem.tests.length; i += 1) {
    const test = problem.tests[i];
    await client.query(
      `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [problemId, test.input, test.expected, Boolean(test.isSample), 20, i + 1],
    );
  }

  const officialCode = buildOfficialCppSolution(problem.slug);
  if (officialCode) {
    await client.query(
      `UPDATE problems
       SET function_template = NULL,
           checker_code = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [problemId],
    );
  }

  return { problemId, slug: problem.slug };
}

async function main() {
  assertTests();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = [];
    for (const problem of problems) {
      const item = await upsertProblem(client, problem);
      inserted.push(item);
    }
    await client.query("COMMIT");
    console.log(`Seed complete. Upserted ${inserted.length} problems:`);
    for (const item of inserted) {
      console.log(`- ${item.slug} (${item.problemId})`);
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to seed operatori-expresii problems:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
