const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const pool = new Pool({ connectionString });

// Matrix-fill problems whose python template nests __USER_CODE__ 8 spaces deep,
// directly as the body of "for i ... / for j ...": a bare comment there is a
// Python IndentationError, so these need an explicit `pass` line too.
const NESTED_PYTHON_MATRIX_SLUGS = new Set([
  "bac-speciala-2020-2-3",
  "bac-vara-2020-2-3",
  "bac-simulare-2023-2-3",
  "bac-simulare-2024-2-3",
  "bac-vara-2024-2-3",
  "bac-antrenament-2020-v5-2-3",
  "bac-antrenament-2020-v20-2-3",
  "bac-antrenament-2021-v9-2-3",
]);

const STRUCT_STUB = {
  cpp:
    "// Scrieti aici DOAR definitia structurii (struct) ceruta in enunt,\n" +
    "// impreuna cu declararea variabilei mentionate.\n" +
    "// NU scrieti #include, main() sau alt cod - acestea sunt deja asigurate de platforma.\n",
  c:
    "// Scrieti aici DOAR definitia structurii (struct) ceruta in enunt,\n" +
    "// impreuna cu declararea variabilei mentionate.\n" +
    "// NU scrieti #include, main() sau alt cod - acestea sunt deja asigurate de platforma.\n",
  pascal:
    "// Scrieti aici DOAR blocul type (record) si blocul var cerute in enunt.\n" +
    "// NU scrieti program, begin/end. sau alt cod - acestea sunt deja asigurate de platforma.\n",
};

const OTHER_STUB = {
  cpp:
    "// Scrieti aici DOAR fragmentul de cod cerut in enunt (secventa de instructiuni sau formula).\n" +
    "// Variabilele mentionate in enunt sunt deja declarate si citite de platforma.\n",
  c:
    "// Scrieti aici DOAR fragmentul de cod cerut in enunt (secventa de instructiuni sau formula).\n" +
    "// Variabilele mentionate in enunt sunt deja declarate si citite de platforma.\n",
  pascal:
    "// Scrieti aici DOAR fragmentul de cod cerut in enunt (secventa de instructiuni sau formula).\n" +
    "// Variabilele mentionate in enunt sunt deja declarate si citite de platforma.\n",
  python:
    "# Scrieti aici DOAR fragmentul de cod cerut in enunt (secventa de instructiuni sau formula).\n" +
    "# Variabilele mentionate in enunt sunt deja declarate si citite de platforma.",
};

const OTHER_STUB_PYTHON_NESTED =
  "# TODO: scrieti aici formula pentru a[i][j] = ...\n        pass";

async function main() {
  const { rows } = await pool.query(
    `SELECT id, slug, allowed_languages FROM problems
     WHERE slug LIKE 'bac-%-2-2' OR slug LIKE 'bac-%-2-3'`,
  );
  console.log(`Found ${rows.length} problems to patch.`);

  let structCount = 0;
  let otherCount = 0;

  for (const row of rows) {
    const isStruct = !row.allowed_languages.includes("python");
    if (isStruct) {
      structCount++;
      await pool.query(
        `UPDATE problems SET
           function_stub_cpp = $2,
           function_stub_c = $3,
           function_stub_pascal = $4,
           updated_at = NOW()
         WHERE id = $1`,
        [row.id, STRUCT_STUB.cpp, STRUCT_STUB.c, STRUCT_STUB.pascal],
      );
    } else {
      otherCount++;
      const pythonStub = NESTED_PYTHON_MATRIX_SLUGS.has(row.slug) ? OTHER_STUB_PYTHON_NESTED : OTHER_STUB.python;
      await pool.query(
        `UPDATE problems SET
           function_stub_cpp = $2,
           function_stub_c = $3,
           function_stub_pascal = $4,
           function_stub_python = $5,
           updated_at = NOW()
         WHERE id = $1`,
        [row.id, OTHER_STUB.cpp, OTHER_STUB.c, OTHER_STUB.pascal, pythonStub],
      );
    }
    console.log(`patched ${row.slug} (${isStruct ? "struct" : "other"})`);
  }

  console.log(`\nDone. struct=${structCount} other=${otherCount} total=${rows.length}`);
  await pool.end();
}

main().catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
