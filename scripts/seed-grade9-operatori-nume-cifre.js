const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const API = "http://localhost:4000";

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

const CHAPTER = { level: "grade9", chapter: "probleme-de-baza", sub: "operatori-expresii" };

const problems = [
  {
    slug: "nume-si-prenume",
    title: "Nume si prenume",
    statement:
      "Se citesc un nume si un prenume. Afiseaza prenumele, urmat de un spatiu, urmat de nume.",
    input_format:
      "Pe prima linie se afla numele si prenumele, separate printr-un spatiu (fiecare este un singur cuvant, fara spatii in interior).",
    output_format: "Afiseaza pe o singura linie prenumele, un spatiu, apoi numele.",
    constraints: "Numele si prenumele contin numai litere si au cel mult 30 de caractere fiecare.",
    difficulty: "easy",
    tags: ["operatori-expresii", "siruri", "citire-scriere"],
    hints:
      "Citeste numele si prenumele ca doua cuvinte separate (fiecare fara spatii in interior).\n\nAfiseaza-le pur si simplu in ordine inversa, cu un spatiu intre ele.",
    explanation:
      "Aceasta este o problema introductiva de citire si scriere a sirurilor de caractere.\n\n**Pasi:**\n\n1. Citesti numele intr-o variabila si prenumele in alta variabila.\n2. Afisezi prenumele, apoi un spatiu, apoi numele.\n\n**Complexitate:**\n- Timp: O(1)\n- Memorie: O(1)",
    cpp:
      "#include <iostream>\nusing namespace std;\nint main(){string nume, prenume;cin>>nume>>prenume;cout<<prenume<<\" \"<<nume;return 0;}\n",
    py: "nume, prenume = input().split()\nprint(prenume, nume)\n",
    tests: [
      "Popescu Ion",
      "Ionescu Maria",
      "Georgescu Andrei",
      "Popa Ana",
      "Enache Stefan",
      "Dumitrescu Elena",
      "A B",
      "Vasilescu Alexandru",
    ],
  },
  {
    slug: "operatii-cu-doua-cifre",
    title: "Operatii cu doua cifre",
    statement:
      "Se citesc doua cifre (numere naturale intre 0 si 9), a si b, cu b nenul. Afiseaza, pe o singura linie, separate prin spatiu, in aceasta ordine: suma lor (a + b), diferenta lor (a - b), produsul lor (a * b), catul impartirii intregi a lui a la b (adica [a / b]) si a la puterea b (a^b).",
    input_format: "Pe prima linie se afla doua cifre a si b, separate printr-un spatiu.",
    output_format:
      "Afiseaza pe o singura linie, separate prin spatiu: a + b, a - b, a * b, [a / b] (catul impartirii intregi) si a^b.",
    constraints: "0 <= a <= 9, 1 <= b <= 9",
    difficulty: "easy",
    tags: ["operatori-expresii", "aritmetica", "putere"],
    hints:
      "Foloseste direct operatorii aritmetici +, -, * si / (impartirea intreaga) pentru primele patru valori.\n\nPentru a^b, inmulteste a cu el insusi de b ori, intr-o variabila initializata cu 1 (nu exista operator de ridicare la putere in C/C++/Pascal).",
    explanation:
      "Problema exerseaza operatorii aritmetici de baza.\n\n**Pasi:**\n\n1. Citesti cifrele a si b.\n2. Calculezi si afisezi a + b, a - b, a * b si a / b (impartire intreaga, deoarece a si b sunt numere intregi).\n3. Pentru a^b, cum nu exista un operator de ridicare la putere, folosesti o variabila `put` initializata cu 1 si o inmultesti cu a, de b ori, intr-o bucla.\n\n**Observatie:** deoarece a, b <= 9, cea mai mare valoare posibila este 9^9 = 387420489, care se incadreaza usor intr-un tip intreg pe 32 sau 64 de biti.\n\n**Complexitate:**\n- Timp: O(b)\n- Memorie: O(1)",
    cpp:
      "#include <iostream>\nusing namespace std;\nint main(){long long a,b;cin>>a>>b;long long put=1;for(long long i=0;i<b;i++)put*=a;cout<<(a+b)<<\" \"<<(a-b)<<\" \"<<(a*b)<<\" \"<<(a/b)<<\" \"<<put;return 0;}\n",
    py:
      "a, b = map(int, input().split())\nput = 1\nfor _ in range(b):\n    put *= a\nprint(a + b, a - b, a * b, a // b, put)\n",
    tests: ["5 2", "0 5", "9 9", "9 1", "3 3", "7 9", "1 1", "8 3"],
  },
];

function normalize(text) {
  return text.trim().split(/\r?\n/).map((line) => line.trim()).join("\n");
}

async function seedGroup(problemList, chapterInfo) {
  const summary = [];

  for (const p of problemList) {
    console.log(`\n=== ${p.slug} ===`);

    const insertResult = await pool.query(
      `INSERT INTO problems (
         slug, title, statement, input_format, output_format, constraints,
         difficulty, time_limit_ms, memory_limit_mb, source, tags,
         allowed_languages, is_published, official_solution,
         hints, explanation, official_solution_cpp, official_solution_python,
         curriculum_level, curriculum_chapter_id, curriculum_subcategory_id,
         solution_mode, checker_mode, editorial_status, estimated_minutes
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,false,$13,$14,$15,$16,$17,$18,$19,$20,'full','exact','draft',5
       )
       RETURNING id`,
      [
        p.slug,
        p.title,
        p.statement,
        p.input_format,
        p.output_format,
        p.constraints,
        p.difficulty,
        300,
        64,
        "Zece la Info",
        p.tags,
        ["cpp", "c", "pascal", "python"],
        p.cpp,
        p.hints,
        p.explanation,
        p.cpp,
        p.py,
        chapterInfo.level,
        chapterInfo.chapter,
        chapterInfo.sub,
      ],
    );
    const problemId = insertResult.rows[0].id;

    let allOk = true;
    const testRows = [];

    for (let i = 0; i < p.tests.length; i++) {
      const input = p.tests[i];
      const cppOut = await runCustom("cpp", p.cpp, input);
      const pyOut = await runCustom("python", p.py, input);

      if (cppOut.verdict !== "AC") {
        console.error(`  TEST ${i}: cpp execution failed: ${JSON.stringify(cppOut)} (input=${JSON.stringify(input)})`);
        allOk = false;
        continue;
      }
      if (pyOut.verdict !== "AC") {
        console.error(`  TEST ${i}: python execution failed: ${JSON.stringify(pyOut)} (input=${JSON.stringify(input)})`);
        allOk = false;
        continue;
      }

      const normCpp = normalize(cppOut.stdout);
      const normPy = normalize(pyOut.stdout);
      if (normCpp !== normPy) {
        console.error(`  TEST ${i}: MISMATCH cpp="${normCpp}" python="${normPy}" (input=${JSON.stringify(input)})`);
        allOk = false;
        continue;
      }

      console.log(`  test ${i}: OK -> "${normCpp}"`);
      testRows.push({ input, expected_output: normCpp, is_sample: i < 2, points: 10, order_index: i });
    }

    if (!allOk) {
      console.error(`!!! ${p.slug} has failing tests - NOT publishing.`);
      summary.push({ slug: p.slug, ok: false, tests: testRows.length });
      continue;
    }

    for (const t of testRows) {
      await pool.query(
        `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [problemId, t.input, t.expected_output, t.is_sample, t.points, t.order_index],
      );
    }

    await pool.query(`UPDATE problems SET is_published = true, editorial_status = 'published' WHERE id = $1`, [problemId]);
    console.log(`published ${p.slug} (${p.difficulty}) with ${testRows.length} tests`);
    summary.push({ slug: p.slug, ok: true, tests: testRows.length });
  }

  return summary;
}

async function main() {
  const summary = await seedGroup(problems, CHAPTER);

  console.log("\n=== SUMMARY ===");
  let okCount = 0;
  for (const s of summary) {
    if (s.ok) okCount++;
    console.log(`${s.ok ? "OK  " : "FAIL"} ${s.slug} (${s.tests} tests)`);
  }
  console.log(`\n${okCount}/${summary.length} published`);

  await pool.end();
}

main().catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
