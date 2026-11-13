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
  curriculum_subcategory_id: "prelucreaza-tab-bidimensionale",
  solution_mode: "function",
  checker_mode: "exact",
  source: "Sursa interna",
};

function isPerfectSquare(x) {
  if (x < 0) return false;
  const r = Math.round(Math.sqrt(x));
  return r * r === x;
}

const problems = [
  {
    slug: "subprograme-suma-diagonalei-secundare",
    title: "Suma diagonalei secundare a unei matrice patratice",
    statement: "Implementati o functie care primeste o matrice patratica cu `n` linii si `n` coloane de numere intregi si intoarce suma elementelor de pe diagonala secundara.",
    input_format: "Pe prima linie n. Urmeaza n linii, fiecare cu n numere intregi separate prin spatiu.",
    output_format: "Suma elementelor de pe diagonala secundara.",
    constraints: "1 <= n <= 100, |m[i][j]| <= 1000",
    spec: { name: "sumaDiagonalaSecundara", params: [{ name: "n", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "n", colsParam: "n" }], returns: { mode: "value", type: "int" } },
    solve: (args) => args.m.reduce((s, row, i) => s + row[args.n - 1 - i], 0),
    tests: [{ n: 2, m: [[1, 2], [3, 4]] }, { n: 1, m: [[9]] }, { n: 3, m: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }, { n: 3, m: [[-1, 0, 1], [0, -2, 0], [1, 0, -3]] }, { n: 4, m: [[1, 0, 0, 2], [0, 1, 2, 0], [0, 2, 1, 0], [2, 0, 0, 1]] }, { n: 2, m: [[0, 100], [100, 0]] }],
    official_cpp: "int sumaDiagonalaSecundara(int n, vector<vector<int>> m) {\n    int s = 0;\n    for (int i = 0; i < n; i++) s += m[i][n - 1 - i];\n    return s;\n}\n",
    official_python: "def sumaDiagonalaSecundara(n, m):\n    return sum(m[i][n - 1 - i] for i in range(n))\n",
  },
  {
    slug: "subprograme-suma-ambelor-diagonale",
    title: "Suma elementelor de pe ambele diagonale ale unei matrice patratice",
    statement: "Implementati o functie care primeste o matrice patratica cu `n` linii si `n` coloane de numere intregi si intoarce suma elementelor de pe diagonala principala si diagonala secundara. Daca `n` este impar, elementul din centru (aflat pe ambele diagonale) se numara o singura data.",
    input_format: "Pe prima linie n. Urmeaza n linii, fiecare cu n numere intregi separate prin spatiu.",
    output_format: "Suma elementelor de pe cele doua diagonale.",
    constraints: "1 <= n <= 100, |m[i][j]| <= 1000",
    spec: { name: "sumaAmbelorDiagonale", params: [{ name: "n", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "n", colsParam: "n" }], returns: { mode: "value", type: "int" } },
    solve: (args) => { let s = 0; for (let i = 0; i < args.n; i++) { s += args.m[i][i]; if (i !== args.n - 1 - i) s += args.m[i][args.n - 1 - i]; } return s; },
    tests: [{ n: 2, m: [[1, 2], [3, 4]] }, { n: 1, m: [[9]] }, { n: 3, m: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }, { n: 3, m: [[-1, 0, 1], [0, -2, 0], [1, 0, -3]] }, { n: 4, m: [[1, 0, 0, 2], [0, 1, 2, 0], [0, 2, 1, 0], [2, 0, 0, 1]] }, { n: 5, m: [[1, 0, 0, 0, 1], [0, 1, 0, 1, 0], [0, 0, 5, 0, 0], [0, 1, 0, 1, 0], [1, 0, 0, 0, 1]] }],
    official_cpp: "int sumaAmbelorDiagonale(int n, vector<vector<int>> m) {\n    int s = 0;\n    for (int i = 0; i < n; i++) {\n        s += m[i][i];\n        if (i != n - 1 - i) s += m[i][n - 1 - i];\n    }\n    return s;\n}\n",
    official_python: "def sumaAmbelorDiagonale(n, m):\n    s = 0\n    for i in range(n):\n        s += m[i][i]\n        if i != n - 1 - i:\n            s += m[i][n - 1 - i]\n    return s\n",
  },
  {
    slug: "subprograme-suma-elementelor-de-pe-contur",
    title: "Suma elementelor de pe conturul unei matrice",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si intoarce suma elementelor aflate pe conturul matricei (prima si ultima linie, prima si ultima coloana).",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "Suma elementelor de pe contur.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000",
    spec: { name: "sumaContur", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }], returns: { mode: "value", type: "int" } },
    solve: (args) => { let s = 0; for (let i = 0; i < args.r; i++) for (let j = 0; j < args.c; j++) if (i === 0 || i === args.r - 1 || j === 0 || j === args.c - 1) s += args.m[i][j]; return s; },
    tests: [{ r: 2, c: 2, m: [[1, 2], [3, 4]] }, { r: 1, c: 1, m: [[5]] }, { r: 3, c: 3, m: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }, { r: 1, c: 5, m: [[1, 2, 3, 4, 5]] }, { r: 4, c: 3, m: [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]] }, { r: 3, c: 1, m: [[1], [2], [3]] }],
    official_cpp: "int sumaContur(int r, int c, vector<vector<int>> m) {\n    int s = 0;\n    for (int i = 0; i < r; i++)\n        for (int j = 0; j < c; j++)\n            if (i == 0 || i == r - 1 || j == 0 || j == c - 1) s += m[i][j];\n    return s;\n}\n",
    official_python: "def sumaContur(r, c, m):\n    s = 0\n    for i in range(r):\n        for j in range(c):\n            if i == 0 or i == r - 1 or j == 0 or j == c - 1: s += m[i][j]\n    return s\n",
  },
  {
    slug: "subprograme-suma-elementelor-interioare",
    title: "Suma elementelor interioare ale unei matrice (fara contur)",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si intoarce suma elementelor care nu se afla pe contur (nu sunt pe prima/ultima linie sau prima/ultima coloana).",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "Suma elementelor interioare (0 daca nu exista niciunul).",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000",
    spec: { name: "sumaInterioara", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }], returns: { mode: "value", type: "int" } },
    solve: (args) => { let s = 0; for (let i = 0; i < args.r; i++) for (let j = 0; j < args.c; j++) if (i > 0 && i < args.r - 1 && j > 0 && j < args.c - 1) s += args.m[i][j]; return s; },
    tests: [{ r: 2, c: 2, m: [[1, 2], [3, 4]] }, { r: 1, c: 1, m: [[5]] }, { r: 3, c: 3, m: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }, { r: 4, c: 4, m: [[1, 1, 1, 1], [1, 2, 3, 1], [1, 4, 5, 1], [1, 1, 1, 1]] }, { r: 5, c: 3, m: [[1, 1, 1], [1, 2, 1], [1, 3, 1], [1, 4, 1], [1, 1, 1]] }, { r: 3, c: 1, m: [[1], [2], [3]] }],
    official_cpp: "int sumaInterioara(int r, int c, vector<vector<int>> m) {\n    int s = 0;\n    for (int i = 0; i < r; i++)\n        for (int j = 0; j < c; j++)\n            if (i > 0 && i < r - 1 && j > 0 && j < c - 1) s += m[i][j];\n    return s;\n}\n",
    official_python: "def sumaInterioara(r, c, m):\n    s = 0\n    for i in range(r):\n        for j in range(c):\n            if 0 < i < r - 1 and 0 < j < c - 1: s += m[i][j]\n    return s\n",
  },
  {
    slug: "subprograme-elementul-maxim-din-matrice",
    title: "Elementul maxim dintr-o matrice",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si intoarce valoarea maxima din matrice.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "Valoarea maxima din matrice.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000",
    spec: { name: "elementulMaximMatrice", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }], returns: { mode: "value", type: "int" } },
    solve: (args) => Math.max(...args.m.flat()),
    tests: [{ r: 2, c: 2, m: [[1, 2], [3, 4]] }, { r: 1, c: 1, m: [[-5]] }, { r: 3, c: 3, m: [[1, 2, 3], [4, 9, 6], [7, 8, 5]] }, { r: 2, c: 3, m: [[-1, -2, -3], [-4, -5, -6]] }, { r: 3, c: 2, m: [[1000, -1000], [0, 999], [1, -1]] }, { r: 2, c: 2, m: [[5, 5], [5, 5]] }],
    official_cpp: "int elementulMaximMatrice(int r, int c, vector<vector<int>> m) {\n    int mx = m[0][0];\n    for (int i = 0; i < r; i++)\n        for (int j = 0; j < c; j++)\n            if (m[i][j] > mx) mx = m[i][j];\n    return mx;\n}\n",
    official_python: "def elementulMaximMatrice(r, c, m):\n    return max(max(row) for row in m)\n",
  },
  {
    slug: "subprograme-elementul-minim-din-matrice",
    title: "Elementul minim dintr-o matrice",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si intoarce valoarea minima din matrice.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "Valoarea minima din matrice.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000",
    spec: { name: "elementulMinimMatrice", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }], returns: { mode: "value", type: "int" } },
    solve: (args) => Math.min(...args.m.flat()),
    tests: [{ r: 2, c: 2, m: [[1, 2], [3, 4]] }, { r: 1, c: 1, m: [[-5]] }, { r: 3, c: 3, m: [[1, 2, 3], [4, 0, 6], [7, 8, 5]] }, { r: 2, c: 3, m: [[-1, -2, -3], [-4, -5, -6]] }, { r: 3, c: 2, m: [[1000, -1000], [0, 999], [1, -1]] }, { r: 2, c: 2, m: [[5, 5], [5, 5]] }],
    official_cpp: "int elementulMinimMatrice(int r, int c, vector<vector<int>> m) {\n    int mn = m[0][0];\n    for (int i = 0; i < r; i++)\n        for (int j = 0; j < c; j++)\n            if (m[i][j] < mn) mn = m[i][j];\n    return mn;\n}\n",
    official_python: "def elementulMinimMatrice(r, c, m):\n    return min(min(row) for row in m)\n",
  },
  {
    slug: "subprograme-numarul-elementelor-negative-din-matrice",
    title: "Numarul elementelor negative dintr-o matrice",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si intoarce cate dintre elemente sunt strict negative.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "Numarul elementelor strict negative.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000",
    spec: { name: "numarulElementelorNegative", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }], returns: { mode: "value", type: "int" } },
    solve: (args) => args.m.flat().filter((x) => x < 0).length,
    tests: [{ r: 2, c: 2, m: [[1, -2], [-3, 4]] }, { r: 1, c: 1, m: [[-5]] }, { r: 3, c: 3, m: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }, { r: 2, c: 3, m: [[-1, -2, -3], [-4, -5, -6]] }, { r: 3, c: 2, m: [[1000, -1000], [0, -999], [1, -1]] }, { r: 2, c: 2, m: [[0, 0], [0, 0]] }],
    official_cpp: "int numarulElementelorNegative(int r, int c, vector<vector<int>> m) {\n    int cnt = 0;\n    for (int i = 0; i < r; i++)\n        for (int j = 0; j < c; j++)\n            if (m[i][j] < 0) cnt++;\n    return cnt;\n}\n",
    official_python: "def numarulElementelorNegative(r, c, m):\n    return sum(1 for row in m for x in row if x < 0)\n",
  },
  {
    slug: "subprograme-numarul-elementelor-pare-din-matrice",
    title: "Numarul elementelor pare dintr-o matrice",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si intoarce cate dintre elemente sunt pare.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "Numarul elementelor pare.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000",
    spec: { name: "numarulElementelorPareMatrice", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }], returns: { mode: "value", type: "int" } },
    solve: (args) => args.m.flat().filter((x) => x % 2 === 0).length,
    tests: [{ r: 2, c: 2, m: [[1, 2], [3, 4]] }, { r: 1, c: 1, m: [[7]] }, { r: 3, c: 3, m: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }, { r: 2, c: 3, m: [[-1, -2, -3], [-4, -5, -6]] }, { r: 3, c: 2, m: [[0, 0], [0, 0], [1, 1]] }, { r: 2, c: 2, m: [[2, 4], [6, 8]] }],
    official_cpp: "int numarulElementelorPareMatrice(int r, int c, vector<vector<int>> m) {\n    int cnt = 0;\n    for (int i = 0; i < r; i++)\n        for (int j = 0; j < c; j++)\n            if (m[i][j] % 2 == 0) cnt++;\n    return cnt;\n}\n",
    official_python: "def numarulElementelorPareMatrice(r, c, m):\n    return sum(1 for row in m for x in row if x % 2 == 0)\n",
  },
  {
    slug: "subprograme-numarul-elementelor-impare-din-matrice",
    title: "Numarul elementelor impare dintr-o matrice",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si intoarce cate dintre elemente sunt impare.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "Numarul elementelor impare.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000",
    spec: { name: "numarulElementelorImpareMatrice", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }], returns: { mode: "value", type: "int" } },
    solve: (args) => args.m.flat().filter((x) => x % 2 !== 0).length,
    tests: [{ r: 2, c: 2, m: [[1, 2], [3, 4]] }, { r: 1, c: 1, m: [[7]] }, { r: 3, c: 3, m: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }, { r: 2, c: 3, m: [[-1, -2, -3], [-4, -5, -6]] }, { r: 3, c: 2, m: [[0, 0], [0, 0], [1, 1]] }, { r: 2, c: 2, m: [[2, 4], [6, 8]] }],
    official_cpp: "int numarulElementelorImpareMatrice(int r, int c, vector<vector<int>> m) {\n    int cnt = 0;\n    for (int i = 0; i < r; i++)\n        for (int j = 0; j < c; j++)\n            if (m[i][j] % 2 != 0) cnt++;\n    return cnt;\n}\n",
    official_python: "def numarulElementelorImpareMatrice(r, c, m):\n    return sum(1 for row in m for x in row if x % 2 != 0)\n",
  },
  {
    slug: "subprograme-pozitia-liniei-cu-suma-maxima",
    title: "Pozitia liniei cu suma maxima dintr-o matrice",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si intoarce pozitia (indexata de la 0) liniei cu suma maxima a elementelor. La egalitate se alege prima linie.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "Pozitia (de la 0) liniei cu suma maxima.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000",
    spec: { name: "pozitiaLinieiCuSumaMaxima", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }], returns: { mode: "value", type: "int" } },
    solve: (args) => { const sums = args.m.map((row) => row.reduce((s, x) => s + x, 0)); return sums.indexOf(Math.max(...sums)); },
    tests: [{ r: 2, c: 2, m: [[1, 2], [3, 4]] }, { r: 1, c: 1, m: [[5]] }, { r: 3, c: 3, m: [[9, 9, 9], [1, 1, 1], [5, 5, 5]] }, { r: 2, c: 3, m: [[-1, -2, -3], [-1, -1, -1]] }, { r: 4, c: 1, m: [[3], [1], [3], [2]] }, { r: 3, c: 2, m: [[0, 0], [0, 0], [0, 0]] }],
    official_cpp: "int pozitiaLinieiCuSumaMaxima(int r, int c, vector<vector<int>> m) {\n    int best = 0; long long bestSum = 0;\n    for (int j = 0; j < c; j++) bestSum += m[0][j];\n    for (int i = 1; i < r; i++) {\n        long long s = 0;\n        for (int j = 0; j < c; j++) s += m[i][j];\n        if (s > bestSum) { bestSum = s; best = i; }\n    }\n    return best;\n}\n",
    official_python: "def pozitiaLinieiCuSumaMaxima(r, c, m):\n    sums = [sum(row) for row in m]\n    return sums.index(max(sums))\n",
  },
  {
    slug: "subprograme-pozitia-coloanei-cu-suma-maxima",
    title: "Pozitia coloanei cu suma maxima dintr-o matrice",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si intoarce pozitia (indexata de la 0) coloanei cu suma maxima a elementelor. La egalitate se alege prima coloana.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "Pozitia (de la 0) coloanei cu suma maxima.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000",
    spec: { name: "pozitiaColoaneiCuSumaMaxima", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }], returns: { mode: "value", type: "int" } },
    solve: (args) => { const sums = []; for (let j = 0; j < args.c; j++) { let s = 0; for (let i = 0; i < args.r; i++) s += args.m[i][j]; sums.push(s); } return sums.indexOf(Math.max(...sums)); },
    tests: [{ r: 2, c: 2, m: [[1, 2], [3, 4]] }, { r: 1, c: 1, m: [[5]] }, { r: 3, c: 3, m: [[9, 1, 5], [9, 1, 5], [9, 1, 5]] }, { r: 2, c: 3, m: [[-1, -1, -1], [-2, -1, -3]] }, { r: 1, c: 4, m: [[3, 1, 3, 2]] }, { r: 3, c: 2, m: [[0, 0], [0, 0], [0, 0]] }],
    official_cpp: "int pozitiaColoaneiCuSumaMaxima(int r, int c, vector<vector<int>> m) {\n    int best = 0; long long bestSum = 0;\n    for (int i = 0; i < r; i++) bestSum += m[i][0];\n    for (int j = 1; j < c; j++) {\n        long long s = 0;\n        for (int i = 0; i < r; i++) s += m[i][j];\n        if (s > bestSum) { bestSum = s; best = j; }\n    }\n    return best;\n}\n",
    official_python: "def pozitiaColoaneiCuSumaMaxima(r, c, m):\n    sums = [sum(m[i][j] for i in range(r)) for j in range(c)]\n    return sums.index(max(sums))\n",
  },
  {
    slug: "subprograme-suma-liniei-cu-index-dat",
    title: "Suma elementelor de pe o linie data a unei matrice",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si un index de linie `index` (0 <= index < r) si intoarce suma elementelor de pe acea linie.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu. Pe ultima linie, index.",
    output_format: "Suma elementelor de pe linia index.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000, 0 <= index < r",
    spec: { name: "sumaLinieCuIndex", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }, { name: "index", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (args) => args.m[args.index].reduce((s, x) => s + x, 0),
    tests: [{ r: 2, c: 2, m: [[1, 2], [3, 4]], index: 0 }, { r: 2, c: 2, m: [[1, 2], [3, 4]], index: 1 }, { r: 1, c: 1, m: [[5]], index: 0 }, { r: 3, c: 3, m: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], index: 2 }, { r: 4, c: 2, m: [[1, 1], [2, 2], [3, 3], [4, 4]], index: 3 }, { r: 2, c: 3, m: [[-1, -2, -3], [4, 5, 6]], index: 0 }],
    official_cpp: "int sumaLinieCuIndex(int r, int c, vector<vector<int>> m, int index) {\n    int s = 0;\n    for (int j = 0; j < c; j++) s += m[index][j];\n    return s;\n}\n",
    official_python: "def sumaLinieCuIndex(r, c, m, index):\n    return sum(m[index])\n",
  },
  {
    slug: "subprograme-suma-coloanei-cu-index-dat",
    title: "Suma elementelor de pe o coloana data a unei matrice",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si un index de coloana `index` (0 <= index < c) si intoarce suma elementelor de pe acea coloana.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu. Pe ultima linie, index.",
    output_format: "Suma elementelor de pe coloana index.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000, 0 <= index < c",
    spec: { name: "sumaColoanaCuIndex", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }, { name: "index", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (args) => { let s = 0; for (let i = 0; i < args.r; i++) s += args.m[i][args.index]; return s; },
    tests: [{ r: 2, c: 2, m: [[1, 2], [3, 4]], index: 0 }, { r: 2, c: 2, m: [[1, 2], [3, 4]], index: 1 }, { r: 1, c: 1, m: [[5]], index: 0 }, { r: 3, c: 3, m: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], index: 2 }, { r: 2, c: 4, m: [[1, 2, 3, 4], [5, 6, 7, 8]], index: 3 }, { r: 2, c: 3, m: [[-1, -2, -3], [4, 5, 6]], index: 0 }],
    official_cpp: "int sumaColoanaCuIndex(int r, int c, vector<vector<int>> m, int index) {\n    int s = 0;\n    for (int i = 0; i < r; i++) s += m[i][index];\n    return s;\n}\n",
    official_python: "def sumaColoanaCuIndex(r, c, m, index):\n    return sum(m[i][index] for i in range(r))\n",
  },
  {
    slug: "subprograme-verifica-daca-o-matrice-este-patrat-magic",
    title: "Verificarea daca o matrice este patrat magic",
    statement: "Implementati o functie care primeste o matrice patratica cu `n` linii si `n` coloane de numere intregi si verifica daca este patrat magic (sumele tuturor liniilor, coloanelor si celor doua diagonale sunt egale intre ele).",
    input_format: "Pe prima linie n. Urmeaza n linii, fiecare cu n numere intregi separate prin spatiu.",
    output_format: "1 daca matricea este patrat magic, 0 in caz contrar.",
    constraints: "1 <= n <= 50, |m[i][j]| <= 1000",
    spec: { name: "estePatratMagic", params: [{ name: "n", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "n", colsParam: "n" }], returns: { mode: "value", type: "bool" } },
    solve: (args) => {
      const n = args.n, m = args.m;
      const target = m[0].reduce((s, x) => s + x, 0);
      for (let i = 0; i < n; i++) if (m[i].reduce((s, x) => s + x, 0) !== target) return false;
      for (let j = 0; j < n; j++) { let s = 0; for (let i = 0; i < n; i++) s += m[i][j]; if (s !== target) return false; }
      let d1 = 0, d2 = 0;
      for (let i = 0; i < n; i++) { d1 += m[i][i]; d2 += m[i][n - 1 - i]; }
      return d1 === target && d2 === target;
    },
    tests: [{ n: 3, m: [[2, 7, 6], [9, 5, 1], [4, 3, 8]] }, { n: 1, m: [[5]] }, { n: 3, m: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }, { n: 2, m: [[1, 2], [3, 4]] }, { n: 3, m: [[4, 9, 2], [3, 5, 7], [8, 1, 6]] }, { n: 2, m: [[1, 1], [1, 1]] }],
    official_cpp: "bool estePatratMagic(int n, vector<vector<int>> m) {\n    long long target = 0;\n    for (int j = 0; j < n; j++) target += m[0][j];\n    for (int i = 0; i < n; i++) {\n        long long s = 0;\n        for (int j = 0; j < n; j++) s += m[i][j];\n        if (s != target) return false;\n    }\n    for (int j = 0; j < n; j++) {\n        long long s = 0;\n        for (int i = 0; i < n; i++) s += m[i][j];\n        if (s != target) return false;\n    }\n    long long d1 = 0, d2 = 0;\n    for (int i = 0; i < n; i++) { d1 += m[i][i]; d2 += m[i][n - 1 - i]; }\n    return d1 == target && d2 == target;\n}\n",
    official_python: "def estePatratMagic(n, m):\n    target = sum(m[0])\n    for row in m:\n        if sum(row) != target: return False\n    for j in range(n):\n        if sum(m[i][j] for i in range(n)) != target: return False\n    d1 = sum(m[i][i] for i in range(n))\n    d2 = sum(m[i][n - 1 - i] for i in range(n))\n    return d1 == target and d2 == target\n",
  },
  {
    slug: "subprograme-verifica-daca-o-matrice-este-simetrica",
    title: "Verificarea daca o matrice este simetrica",
    statement: "Implementati o functie care primeste o matrice patratica cu `n` linii si `n` coloane de numere intregi si verifica daca este simetrica (m[i][j] == m[j][i] pentru orice i, j).",
    input_format: "Pe prima linie n. Urmeaza n linii, fiecare cu n numere intregi separate prin spatiu.",
    output_format: "1 daca matricea este simetrica, 0 in caz contrar.",
    constraints: "1 <= n <= 100, |m[i][j]| <= 1000",
    spec: { name: "esteSimetrica", params: [{ name: "n", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "n", colsParam: "n" }], returns: { mode: "value", type: "bool" } },
    solve: (args) => { for (let i = 0; i < args.n; i++) for (let j = 0; j < args.n; j++) if (args.m[i][j] !== args.m[j][i]) return false; return true; },
    tests: [{ n: 3, m: [[1, 2, 3], [2, 5, 6], [3, 6, 9]] }, { n: 1, m: [[5]] }, { n: 3, m: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }, { n: 2, m: [[1, 2], [2, 1]] }, { n: 2, m: [[1, 2], [3, 1]] }, { n: 4, m: [[1, 0, 0, 4], [0, 2, 0, 0], [0, 0, 3, 0], [4, 0, 0, 4]] }],
    official_cpp: "bool esteSimetrica(int n, vector<vector<int>> m) {\n    for (int i = 0; i < n; i++)\n        for (int j = 0; j < n; j++)\n            if (m[i][j] != m[j][i]) return false;\n    return true;\n}\n",
    official_python: "def esteSimetrica(n, m):\n    for i in range(n):\n        for j in range(n):\n            if m[i][j] != m[j][i]: return False\n    return True\n",
  },
  {
    slug: "subprograme-verifica-daca-o-matrice-este-identitate",
    title: "Verificarea daca o matrice este matrice identitate",
    statement: "Implementati o functie care primeste o matrice patratica cu `n` linii si `n` coloane de numere intregi si verifica daca este matrice identitate (1 pe diagonala principala, 0 in rest).",
    input_format: "Pe prima linie n. Urmeaza n linii, fiecare cu n numere intregi separate prin spatiu.",
    output_format: "1 daca matricea este identitate, 0 in caz contrar.",
    constraints: "1 <= n <= 100, |m[i][j]| <= 1000",
    spec: { name: "esteIdentitate", params: [{ name: "n", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "n", colsParam: "n" }], returns: { mode: "value", type: "bool" } },
    solve: (args) => { for (let i = 0; i < args.n; i++) for (let j = 0; j < args.n; j++) { const expected = i === j ? 1 : 0; if (args.m[i][j] !== expected) return false; } return true; },
    tests: [{ n: 2, m: [[1, 0], [0, 1]] }, { n: 1, m: [[1]] }, { n: 1, m: [[0]] }, { n: 3, m: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] }, { n: 3, m: [[1, 0, 0], [0, 2, 0], [0, 0, 1]] }, { n: 2, m: [[0, 0], [0, 0]] }],
    official_cpp: "bool esteIdentitate(int n, vector<vector<int>> m) {\n    for (int i = 0; i < n; i++)\n        for (int j = 0; j < n; j++) {\n            int expected = (i == j) ? 1 : 0;\n            if (m[i][j] != expected) return false;\n        }\n    return true;\n}\n",
    official_python: "def esteIdentitate(n, m):\n    for i in range(n):\n        for j in range(n):\n            expected = 1 if i == j else 0\n            if m[i][j] != expected: return False\n    return True\n",
  },
  {
    slug: "subprograme-verifica-daca-o-matrice-este-diagonala",
    title: "Verificarea daca o matrice este matrice diagonala",
    statement: "Implementati o functie care primeste o matrice patratica cu `n` linii si `n` coloane de numere intregi si verifica daca este matrice diagonala (toate elementele din afara diagonalei principale sunt 0).",
    input_format: "Pe prima linie n. Urmeaza n linii, fiecare cu n numere intregi separate prin spatiu.",
    output_format: "1 daca matricea este diagonala, 0 in caz contrar.",
    constraints: "1 <= n <= 100, |m[i][j]| <= 1000",
    spec: { name: "esteDiagonala", params: [{ name: "n", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "n", colsParam: "n" }], returns: { mode: "value", type: "bool" } },
    solve: (args) => { for (let i = 0; i < args.n; i++) for (let j = 0; j < args.n; j++) if (i !== j && args.m[i][j] !== 0) return false; return true; },
    tests: [{ n: 2, m: [[5, 0], [0, 3]] }, { n: 1, m: [[7]] }, { n: 3, m: [[1, 0, 0], [0, 2, 0], [0, 0, 3]] }, { n: 3, m: [[1, 0, 1], [0, 2, 0], [0, 0, 3]] }, { n: 2, m: [[0, 0], [0, 0]] }, { n: 3, m: [[1, 2, 0], [0, 2, 0], [0, 0, 3]] }],
    official_cpp: "bool esteDiagonala(int n, vector<vector<int>> m) {\n    for (int i = 0; i < n; i++)\n        for (int j = 0; j < n; j++)\n            if (i != j && m[i][j] != 0) return false;\n    return true;\n}\n",
    official_python: "def esteDiagonala(n, m):\n    for i in range(n):\n        for j in range(n):\n            if i != j and m[i][j] != 0: return False\n    return True\n",
  },
  {
    slug: "subprograme-numarul-de-elemente-egale-cu-o-valoare",
    title: "Numarul de elemente dintr-o matrice egale cu o valoare data",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si o valoare `x` si intoarce de cate ori apare `x` in matrice.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu. Pe ultima linie, x.",
    output_format: "Numarul de aparitii ale lui x in matrice.",
    constraints: "1 <= r, c <= 100, |m[i][j]|, |x| <= 1000",
    spec: { name: "numarulDeElementeEgale", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }, { name: "x", type: "int" }], returns: { mode: "value", type: "int" } },
    solve: (args) => args.m.flat().filter((v) => v === args.x).length,
    tests: [{ r: 2, c: 2, m: [[1, 2], [3, 1]], x: 1 }, { r: 1, c: 1, m: [[5]], x: 5 }, { r: 3, c: 3, m: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], x: 10 }, { r: 2, c: 3, m: [[0, 0, 0], [0, 0, 0]], x: 0 }, { r: 3, c: 2, m: [[-1, -1], [-1, 2], [3, -1]], x: -1 }, { r: 2, c: 2, m: [[5, 5], [5, 5]], x: 5 }],
    official_cpp: "int numarulDeElementeEgale(int r, int c, vector<vector<int>> m, int x) {\n    int cnt = 0;\n    for (int i = 0; i < r; i++)\n        for (int j = 0; j < c; j++)\n            if (m[i][j] == x) cnt++;\n    return cnt;\n}\n",
    official_python: "def numarulDeElementeEgale(r, c, m, x):\n    return sum(1 for row in m for v in row if v == x)\n",
  },
  {
    slug: "subprograme-suma-si-numarul-elementelor-mai-mari-decat-o-valoare",
    title: "Suma si numarul elementelor dintr-o matrice mai mari decat o valoare data",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si o valoare `x` si determina suma si numarul elementelor strict mai mari decat `x`, prin parametrii de iesire `suma` si `numar`.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu. Pe ultima linie, x.",
    output_format: "Suma si numarul elementelor mai mari decat x, separate printr-un spatiu.",
    constraints: "1 <= r, c <= 100, |m[i][j]|, |x| <= 1000",
    spec: { name: "sumaSiNumarulMaiMariCaX", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }, { name: "x", type: "int" }], returns: { mode: "out-params", outs: [{ name: "suma", type: "int" }, { name: "numar", type: "int" }] } },
    solve: (args) => { const v = args.m.flat().filter((y) => y > args.x); return { suma: v.reduce((s, y) => s + y, 0), numar: v.length }; },
    tests: [{ r: 2, c: 2, m: [[1, 2], [3, 4]], x: 2 }, { r: 1, c: 1, m: [[5]], x: 10 }, { r: 3, c: 3, m: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], x: 0 }, { r: 2, c: 3, m: [[-1, -2, -3], [-4, -5, -6]], x: -10 }, { r: 3, c: 2, m: [[1000, -1000], [0, 999], [1, -1]], x: 500 }, { r: 2, c: 2, m: [[5, 5], [5, 5]], x: 5 }],
    official_cpp: "void sumaSiNumarulMaiMariCaX(int r, int c, vector<vector<int>> m, int x, int &suma, int &numar) {\n    suma = 0; numar = 0;\n    for (int i = 0; i < r; i++)\n        for (int j = 0; j < c; j++)\n            if (m[i][j] > x) { suma += m[i][j]; numar++; }\n}\n",
    official_python: "def sumaSiNumarulMaiMariCaX(r, c, m, x):\n    v = [y for row in m for y in row if y > x]\n    return sum(v), len(v)\n",
  },
  {
    slug: "subprograme-suma-si-numarul-elementelor-mai-mici-decat-o-valoare",
    title: "Suma si numarul elementelor dintr-o matrice mai mici decat o valoare data",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si o valoare `x` si determina suma si numarul elementelor strict mai mici decat `x`, prin parametrii de iesire `suma` si `numar`.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu. Pe ultima linie, x.",
    output_format: "Suma si numarul elementelor mai mici decat x, separate printr-un spatiu.",
    constraints: "1 <= r, c <= 100, |m[i][j]|, |x| <= 1000",
    spec: { name: "sumaSiNumarulMaiMiciCaX", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }, { name: "x", type: "int" }], returns: { mode: "out-params", outs: [{ name: "suma", type: "int" }, { name: "numar", type: "int" }] } },
    solve: (args) => { const v = args.m.flat().filter((y) => y < args.x); return { suma: v.reduce((s, y) => s + y, 0), numar: v.length }; },
    tests: [{ r: 2, c: 2, m: [[1, 2], [3, 4]], x: 3 }, { r: 1, c: 1, m: [[5]], x: 0 }, { r: 3, c: 3, m: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], x: 100 }, { r: 2, c: 3, m: [[-1, -2, -3], [-4, -5, -6]], x: 0 }, { r: 3, c: 2, m: [[1000, -1000], [0, 999], [1, -1]], x: 500 }, { r: 2, c: 2, m: [[5, 5], [5, 5]], x: 5 }],
    official_cpp: "void sumaSiNumarulMaiMiciCaX(int r, int c, vector<vector<int>> m, int x, int &suma, int &numar) {\n    suma = 0; numar = 0;\n    for (int i = 0; i < r; i++)\n        for (int j = 0; j < c; j++)\n            if (m[i][j] < x) { suma += m[i][j]; numar++; }\n}\n",
    official_python: "def sumaSiNumarulMaiMiciCaX(r, c, m, x):\n    v = [y for row in m for y in row if y < x]\n    return sum(v), len(v)\n",
  },
  {
    slug: "subprograme-minimul-si-maximul-dintr-o-matrice",
    title: "Minimul si maximul dintr-o matrice",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si determina valoarea minima si valoarea maxima din matrice, prin parametrii de iesire `mn` si `mx`.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "Minimul si maximul, separate printr-un spatiu.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000",
    spec: { name: "minSiMaxMatrice", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }], returns: { mode: "out-params", outs: [{ name: "mn", type: "int" }, { name: "mx", type: "int" }] } },
    solve: (args) => { const flat = args.m.flat(); return { mn: Math.min(...flat), mx: Math.max(...flat) }; },
    tests: [{ r: 2, c: 2, m: [[1, 2], [3, 4]] }, { r: 1, c: 1, m: [[5]] }, { r: 3, c: 3, m: [[1, 2, 3], [4, 9, 6], [7, 0, 5]] }, { r: 2, c: 3, m: [[-1, -2, -3], [-4, -5, -6]] }, { r: 3, c: 2, m: [[1000, -1000], [0, 999], [1, -1]] }, { r: 2, c: 2, m: [[5, 5], [5, 5]] }],
    official_cpp: "void minSiMaxMatrice(int r, int c, vector<vector<int>> m, int &mn, int &mx) {\n    mn = m[0][0]; mx = m[0][0];\n    for (int i = 0; i < r; i++)\n        for (int j = 0; j < c; j++) {\n            if (m[i][j] < mn) mn = m[i][j];\n            if (m[i][j] > mx) mx = m[i][j];\n        }\n}\n",
    official_python: "def minSiMaxMatrice(r, c, m):\n    flat = [v for row in m for v in row]\n    return min(flat), max(flat)\n",
  },
  {
    slug: "subprograme-suma-si-numarul-elementelor-pare-din-matrice",
    title: "Suma si numarul elementelor pare dintr-o matrice",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si determina suma si numarul elementelor pare, prin parametrii de iesire `sumaPare` si `numarPare`.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "Suma elementelor pare si numarul lor, separate printr-un spatiu.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000",
    spec: { name: "sumaSiNumarulPareMatrice", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }], returns: { mode: "out-params", outs: [{ name: "sumaPare", type: "int" }, { name: "numarPare", type: "int" }] } },
    solve: (args) => { const v = args.m.flat().filter((x) => x % 2 === 0); return { sumaPare: v.reduce((s, x) => s + x, 0), numarPare: v.length }; },
    tests: [{ r: 2, c: 2, m: [[1, 2], [3, 4]] }, { r: 1, c: 1, m: [[7]] }, { r: 3, c: 3, m: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }, { r: 2, c: 3, m: [[-1, -2, -3], [-4, -5, -6]] }, { r: 3, c: 2, m: [[0, 0], [0, 0], [1, 1]] }, { r: 2, c: 2, m: [[2, 4], [6, 8]] }],
    official_cpp: "void sumaSiNumarulPareMatrice(int r, int c, vector<vector<int>> m, int &sumaPare, int &numarPare) {\n    sumaPare = 0; numarPare = 0;\n    for (int i = 0; i < r; i++)\n        for (int j = 0; j < c; j++)\n            if (m[i][j] % 2 == 0) { sumaPare += m[i][j]; numarPare++; }\n}\n",
    official_python: "def sumaSiNumarulPareMatrice(r, c, m):\n    v = [x for row in m for x in row if x % 2 == 0]\n    return sum(v), len(v)\n",
  },
  {
    slug: "subprograme-suma-si-numarul-elementelor-impare-din-matrice",
    title: "Suma si numarul elementelor impare dintr-o matrice",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si determina suma si numarul elementelor impare, prin parametrii de iesire `sumaImpare` si `numarImpare`.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "Suma elementelor impare si numarul lor, separate printr-un spatiu.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000",
    spec: { name: "sumaSiNumarulImpareMatrice", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }], returns: { mode: "out-params", outs: [{ name: "sumaImpare", type: "int" }, { name: "numarImpare", type: "int" }] } },
    solve: (args) => { const v = args.m.flat().filter((x) => x % 2 !== 0); return { sumaImpare: v.reduce((s, x) => s + x, 0), numarImpare: v.length }; },
    tests: [{ r: 2, c: 2, m: [[1, 2], [3, 4]] }, { r: 1, c: 1, m: [[7]] }, { r: 3, c: 3, m: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }, { r: 2, c: 3, m: [[-1, -2, -3], [-4, -5, -6]] }, { r: 3, c: 2, m: [[0, 0], [0, 0], [1, 1]] }, { r: 2, c: 2, m: [[2, 4], [6, 8]] }],
    official_cpp: "void sumaSiNumarulImpareMatrice(int r, int c, vector<vector<int>> m, int &sumaImpare, int &numarImpare) {\n    sumaImpare = 0; numarImpare = 0;\n    for (int i = 0; i < r; i++)\n        for (int j = 0; j < c; j++)\n            if (m[i][j] % 2 != 0) { sumaImpare += m[i][j]; numarImpare++; }\n}\n",
    official_python: "def sumaSiNumarulImpareMatrice(r, c, m):\n    v = [x for row in m for x in row if x % 2 != 0]\n    return sum(v), len(v)\n",
  },
  {
    slug: "subprograme-numarul-liniilor-cu-suma-pozitiva",
    title: "Numarul liniilor cu suma pozitiva dintr-o matrice",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si intoarce cate linii au suma elementelor strict pozitiva.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "Numarul liniilor cu suma strict pozitiva.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000",
    spec: { name: "numarulLiniilorCuSumaPozitiva", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }], returns: { mode: "value", type: "int" } },
    solve: (args) => args.m.filter((row) => row.reduce((s, x) => s + x, 0) > 0).length,
    tests: [{ r: 2, c: 2, m: [[1, 2], [-3, -4]] }, { r: 1, c: 1, m: [[5]] }, { r: 3, c: 3, m: [[1, 1, 1], [-1, -1, -1], [0, 0, 0]] }, { r: 2, c: 3, m: [[-1, -2, -3], [-4, -5, -6]] }, { r: 3, c: 2, m: [[1, 1], [1, 1], [1, 1]] }, { r: 2, c: 2, m: [[0, 0], [0, 0]] }],
    official_cpp: "int numarulLiniilorCuSumaPozitiva(int r, int c, vector<vector<int>> m) {\n    int cnt = 0;\n    for (int i = 0; i < r; i++) {\n        long long s = 0;\n        for (int j = 0; j < c; j++) s += m[i][j];\n        if (s > 0) cnt++;\n    }\n    return cnt;\n}\n",
    official_python: "def numarulLiniilorCuSumaPozitiva(r, c, m):\n    return sum(1 for row in m if sum(row) > 0)\n",
  },
  {
    slug: "subprograme-numarul-coloanelor-cu-suma-pozitiva",
    title: "Numarul coloanelor cu suma pozitiva dintr-o matrice",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si intoarce cate coloane au suma elementelor strict pozitiva.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "Numarul coloanelor cu suma strict pozitiva.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000",
    spec: { name: "numarulColoanelorCuSumaPozitiva", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }], returns: { mode: "value", type: "int" } },
    solve: (args) => { let cnt = 0; for (let j = 0; j < args.c; j++) { let s = 0; for (let i = 0; i < args.r; i++) s += args.m[i][j]; if (s > 0) cnt++; } return cnt; },
    tests: [{ r: 2, c: 2, m: [[1, -3], [2, -4]] }, { r: 1, c: 1, m: [[5]] }, { r: 3, c: 3, m: [[1, -1, 0], [1, -1, 0], [1, -1, 0]] }, { r: 2, c: 3, m: [[-1, -2, -3], [-4, -5, -6]] }, { r: 3, c: 2, m: [[1, 1], [1, 1], [1, 1]] }, { r: 2, c: 2, m: [[0, 0], [0, 0]] }],
    official_cpp: "int numarulColoanelorCuSumaPozitiva(int r, int c, vector<vector<int>> m) {\n    int cnt = 0;\n    for (int j = 0; j < c; j++) {\n        long long s = 0;\n        for (int i = 0; i < r; i++) s += m[i][j];\n        if (s > 0) cnt++;\n    }\n    return cnt;\n}\n",
    official_python: "def numarulColoanelorCuSumaPozitiva(r, c, m):\n    return sum(1 for j in range(c) if sum(m[i][j] for i in range(r)) > 0)\n",
  },
  {
    slug: "subprograme-diferenta-dintre-suma-maxima-si-suma-minima-a-liniilor",
    title: "Diferenta dintre suma maxima si suma minima a liniilor unei matrice",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si intoarce diferenta dintre suma maxima si suma minima dintre sumele liniilor.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "Diferenta dintre suma maxima si suma minima a liniilor.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000",
    spec: { name: "diferentaSumeLinii", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }], returns: { mode: "value", type: "int" } },
    solve: (args) => { const sums = args.m.map((row) => row.reduce((s, x) => s + x, 0)); return Math.max(...sums) - Math.min(...sums); },
    tests: [{ r: 2, c: 2, m: [[1, 2], [3, 4]] }, { r: 1, c: 1, m: [[5]] }, { r: 3, c: 3, m: [[9, 9, 9], [1, 1, 1], [5, 5, 5]] }, { r: 2, c: 3, m: [[-1, -2, -3], [-1, -1, -1]] }, { r: 4, c: 1, m: [[3], [1], [3], [2]] }, { r: 3, c: 2, m: [[0, 0], [0, 0], [0, 0]] }],
    official_cpp: "int diferentaSumeLinii(int r, int c, vector<vector<int>> m) {\n    long long mn, mx;\n    mn = mx = 0;\n    for (int j = 0; j < c; j++) mn += m[0][j];\n    mx = mn;\n    for (int i = 1; i < r; i++) {\n        long long s = 0;\n        for (int j = 0; j < c; j++) s += m[i][j];\n        if (s < mn) mn = s;\n        if (s > mx) mx = s;\n    }\n    return (int)(mx - mn);\n}\n",
    official_python: "def diferentaSumeLinii(r, c, m):\n    sums = [sum(row) for row in m]\n    return max(sums) - min(sums)\n",
  },
  {
    slug: "subprograme-numarul-liniilor-sortate-crescator",
    title: "Numarul liniilor sortate crescator dintr-o matrice",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si intoarce cate dintre linii sunt sortate crescator (nu neaparat strict).",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "Numarul liniilor sortate crescator.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000",
    spec: { name: "numarulLiniilorSortateCrescator", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }], returns: { mode: "value", type: "int" } },
    solve: (args) => args.m.filter((row) => row.every((x, i) => i === 0 || row[i - 1] <= x)).length,
    tests: [{ r: 2, c: 3, m: [[1, 2, 3], [3, 2, 1]] }, { r: 1, c: 1, m: [[5]] }, { r: 3, c: 3, m: [[1, 2, 3], [4, 5, 6], [9, 8, 7]] }, { r: 2, c: 2, m: [[1, 1], [2, 1]] }, { r: 3, c: 4, m: [[1, 1, 1, 1], [1, 2, 3, 4], [4, 3, 2, 1]] }, { r: 2, c: 1, m: [[1], [2]] }],
    official_cpp: "int numarulLiniilorSortateCrescator(int r, int c, vector<vector<int>> m) {\n    int cnt = 0;\n    for (int i = 0; i < r; i++) {\n        bool ok = true;\n        for (int j = 1; j < c; j++) if (m[i][j] < m[i][j - 1]) { ok = false; break; }\n        if (ok) cnt++;\n    }\n    return cnt;\n}\n",
    official_python: "def numarulLiniilorSortateCrescator(r, c, m):\n    cnt = 0\n    for row in m:\n        if all(row[j - 1] <= row[j] for j in range(1, c)): cnt += 1\n    return cnt\n",
  },
  {
    slug: "subprograme-verifica-daca-toate-liniile-au-suma-egala",
    title: "Verificarea daca toate liniile unei matrice au suma egala",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si verifica daca toate liniile au aceeasi suma.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "1 daca toate liniile au suma egala, 0 in caz contrar.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000",
    spec: { name: "toateLiniileAuSumaEgala", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }], returns: { mode: "value", type: "bool" } },
    solve: (args) => { const target = args.m[0].reduce((s, x) => s + x, 0); return args.m.every((row) => row.reduce((s, x) => s + x, 0) === target); },
    tests: [{ r: 2, c: 2, m: [[1, 2], [2, 1]] }, { r: 1, c: 1, m: [[5]] }, { r: 3, c: 2, m: [[1, 2], [2, 1], [0, 3]] }, { r: 2, c: 3, m: [[1, 2, 3], [3, 2, 2]] }, { r: 3, c: 3, m: [[9, 0, 0], [0, 9, 0], [0, 0, 9]] }, { r: 2, c: 2, m: [[0, 0], [0, 0]] }],
    official_cpp: "bool toateLiniileAuSumaEgala(int r, int c, vector<vector<int>> m) {\n    long long target = 0;\n    for (int j = 0; j < c; j++) target += m[0][j];\n    for (int i = 1; i < r; i++) {\n        long long s = 0;\n        for (int j = 0; j < c; j++) s += m[i][j];\n        if (s != target) return false;\n    }\n    return true;\n}\n",
    official_python: "def toateLiniileAuSumaEgala(r, c, m):\n    target = sum(m[0])\n    return all(sum(row) == target for row in m)\n",
  },
  {
    slug: "subprograme-verifica-daca-toate-coloanele-au-suma-egala",
    title: "Verificarea daca toate coloanele unei matrice au suma egala",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si verifica daca toate coloanele au aceeasi suma.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "1 daca toate coloanele au suma egala, 0 in caz contrar.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000",
    spec: { name: "toateColoaneleAuSumaEgala", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }], returns: { mode: "value", type: "bool" } },
    solve: (args) => { let target = 0; for (let i = 0; i < args.r; i++) target += args.m[i][0]; for (let j = 1; j < args.c; j++) { let s = 0; for (let i = 0; i < args.r; i++) s += args.m[i][j]; if (s !== target) return false; } return true; },
    tests: [{ r: 2, c: 2, m: [[1, 2], [2, 1]] }, { r: 1, c: 1, m: [[5]] }, { r: 2, c: 3, m: [[1, 2, 0], [2, 1, 3]] }, { r: 2, c: 3, m: [[1, 2, 3], [2, 3, 2]] }, { r: 3, c: 3, m: [[9, 0, 0], [0, 9, 0], [0, 0, 9]] }, { r: 2, c: 2, m: [[0, 0], [0, 0]] }],
    official_cpp: "bool toateColoaneleAuSumaEgala(int r, int c, vector<vector<int>> m) {\n    long long target = 0;\n    for (int i = 0; i < r; i++) target += m[i][0];\n    for (int j = 1; j < c; j++) {\n        long long s = 0;\n        for (int i = 0; i < r; i++) s += m[i][j];\n        if (s != target) return false;\n    }\n    return true;\n}\n",
    official_python: "def toateColoaneleAuSumaEgala(r, c, m):\n    target = sum(m[i][0] for i in range(r))\n    for j in range(1, c):\n        if sum(m[i][j] for i in range(r)) != target: return False\n    return True\n",
  },
  {
    slug: "subprograme-numarul-patratelor-perfecte-dintr-o-matrice",
    title: "Numarul patratelor perfecte dintr-o matrice",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si intoarce cate dintre elementele sale (nenegative) sunt patrate perfecte.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "Numarul elementelor care sunt patrate perfecte.",
    constraints: "1 <= r, c <= 100, -1000 <= m[i][j] <= 10000",
    spec: { name: "numarulPatratelorPerfecte", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }], returns: { mode: "value", type: "int" } },
    solve: (args) => args.m.flat().filter((x) => isPerfectSquare(x)).length,
    tests: [{ r: 2, c: 2, m: [[1, 2], [4, 9]] }, { r: 1, c: 1, m: [[16]] }, { r: 3, c: 3, m: [[0, 1, 2], [3, 4, 5], [6, 7, 8]] }, { r: 2, c: 3, m: [[-1, -4, -9], [2, 3, 5]] }, { r: 1, c: 4, m: [[100, 99, 101, 10000]] }, { r: 2, c: 2, m: [[5, 5], [5, 5]] }],
    official_cpp: "#include <cmath>\nbool esteP(long long x) { if (x < 0) return false; long long r = (long long)round(sqrt((double)x)); return r * r == x; }\nint numarulPatratelorPerfecte(int r, int c, vector<vector<int>> m) {\n    int cnt = 0;\n    for (int i = 0; i < r; i++)\n        for (int j = 0; j < c; j++)\n            if (esteP(m[i][j])) cnt++;\n    return cnt;\n}\n",
    official_python: "import math\ndef numarulPatratelorPerfecte(r, c, m):\n    def esteP(x):\n        if x < 0: return False\n        rt = math.isqrt(x)\n        return rt * rt == x\n    return sum(1 for row in m for x in row if esteP(x))\n",
  },
  {
    slug: "subprograme-suma-elementelor-de-deasupra-diagonalei-principale",
    title: "Suma elementelor de deasupra diagonalei principale a unei matrice patratice",
    statement: "Implementati o functie care primeste o matrice patratica cu `n` linii si `n` coloane de numere intregi si intoarce suma elementelor situate strict deasupra diagonalei principale (i < j).",
    input_format: "Pe prima linie n. Urmeaza n linii, fiecare cu n numere intregi separate prin spatiu.",
    output_format: "Suma elementelor de deasupra diagonalei principale (0 daca nu exista).",
    constraints: "1 <= n <= 100, |m[i][j]| <= 1000",
    spec: { name: "sumaDeasupraDiagonalei", params: [{ name: "n", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "n", colsParam: "n" }], returns: { mode: "value", type: "int" } },
    solve: (args) => { let s = 0; for (let i = 0; i < args.n; i++) for (let j = i + 1; j < args.n; j++) s += args.m[i][j]; return s; },
    tests: [{ n: 2, m: [[1, 2], [3, 4]] }, { n: 1, m: [[9]] }, { n: 3, m: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }, { n: 3, m: [[-1, 0, 1], [0, -2, 0], [1, 0, -3]] }, { n: 4, m: [[1, 1, 1, 1], [0, 1, 1, 1], [0, 0, 1, 1], [0, 0, 0, 1]] }, { n: 2, m: [[0, 100], [100, 0]] }],
    official_cpp: "int sumaDeasupraDiagonalei(int n, vector<vector<int>> m) {\n    int s = 0;\n    for (int i = 0; i < n; i++)\n        for (int j = i + 1; j < n; j++) s += m[i][j];\n    return s;\n}\n",
    official_python: "def sumaDeasupraDiagonalei(n, m):\n    return sum(m[i][j] for i in range(n) for j in range(i + 1, n))\n",
  },
  {
    slug: "subprograme-suma-elementelor-de-sub-diagonala-principala",
    title: "Suma elementelor de sub diagonala principala a unei matrice patratice",
    statement: "Implementati o functie care primeste o matrice patratica cu `n` linii si `n` coloane de numere intregi si intoarce suma elementelor situate strict sub diagonala principala (i > j).",
    input_format: "Pe prima linie n. Urmeaza n linii, fiecare cu n numere intregi separate prin spatiu.",
    output_format: "Suma elementelor de sub diagonala principala (0 daca nu exista).",
    constraints: "1 <= n <= 100, |m[i][j]| <= 1000",
    spec: { name: "sumaSubDiagonala", params: [{ name: "n", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "n", colsParam: "n" }], returns: { mode: "value", type: "int" } },
    solve: (args) => { let s = 0; for (let i = 0; i < args.n; i++) for (let j = 0; j < i; j++) s += args.m[i][j]; return s; },
    tests: [{ n: 2, m: [[1, 2], [3, 4]] }, { n: 1, m: [[9]] }, { n: 3, m: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }, { n: 3, m: [[-1, 0, 1], [0, -2, 0], [1, 0, -3]] }, { n: 4, m: [[1, 0, 0, 0], [1, 1, 0, 0], [1, 1, 1, 0], [1, 1, 1, 1]] }, { n: 2, m: [[0, 100], [100, 0]] }],
    official_cpp: "int sumaSubDiagonala(int n, vector<vector<int>> m) {\n    int s = 0;\n    for (int i = 0; i < n; i++)\n        for (int j = 0; j < i; j++) s += m[i][j];\n    return s;\n}\n",
    official_python: "def sumaSubDiagonala(n, m):\n    return sum(m[i][j] for i in range(n) for j in range(i))\n",
  },
  {
    slug: "subprograme-pozitia-maximului-dintr-o-matrice",
    title: "Pozitia elementului maxim dintr-o matrice",
    statement: "Implementati o functie care primeste o matrice cu `r` linii si `c` coloane de numere intregi si determina linia si coloana (indexate de la 0) primei aparitii a elementului maxim, prin parametrii de iesire `linie` si `coloana`.",
    input_format: "Pe prima linie r si c. Urmeaza r linii, fiecare cu c numere intregi separate prin spatiu.",
    output_format: "Linia si coloana (de la 0) primei aparitii a maximului, separate printr-un spatiu.",
    constraints: "1 <= r, c <= 100, |m[i][j]| <= 1000",
    spec: { name: "pozitiaMaximuluiInMatrice", params: [{ name: "r", type: "int" }, { name: "c", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "r", colsParam: "c" }], returns: { mode: "out-params", outs: [{ name: "linie", type: "int" }, { name: "coloana", type: "int" }] } },
    solve: (args) => { let bi = 0, bj = 0; for (let i = 0; i < args.r; i++) for (let j = 0; j < args.c; j++) if (args.m[i][j] > args.m[bi][bj]) { bi = i; bj = j; } return { linie: bi, coloana: bj }; },
    tests: [{ r: 2, c: 2, m: [[1, 2], [3, 4]] }, { r: 1, c: 1, m: [[5]] }, { r: 3, c: 3, m: [[1, 2, 3], [4, 9, 6], [7, 8, 5]] }, { r: 2, c: 3, m: [[-1, -2, -3], [-4, -5, -6]] }, { r: 3, c: 2, m: [[1000, -1000], [1000, 999], [0, 0]] }, { r: 2, c: 2, m: [[5, 5], [5, 5]] }],
    official_cpp: "void pozitiaMaximuluiInMatrice(int r, int c, vector<vector<int>> m, int &linie, int &coloana) {\n    linie = 0; coloana = 0;\n    for (int i = 0; i < r; i++)\n        for (int j = 0; j < c; j++)\n            if (m[i][j] > m[linie][coloana]) { linie = i; coloana = j; }\n}\n",
    official_python: "def pozitiaMaximuluiInMatrice(r, c, m):\n    bi, bj = 0, 0\n    for i in range(r):\n        for j in range(c):\n            if m[i][j] > m[bi][bj]: bi, bj = i, j\n    return bi, bj\n",
  },
  {
    slug: "subprograme-numarul-de-elemente-pare-de-pe-diagonala-principala",
    title: "Numarul elementelor pare de pe diagonala principala a unei matrice patratice",
    statement: "Implementati o functie care primeste o matrice patratica cu `n` linii si `n` coloane de numere intregi si intoarce cate dintre elementele de pe diagonala principala sunt pare.",
    input_format: "Pe prima linie n. Urmeaza n linii, fiecare cu n numere intregi separate prin spatiu.",
    output_format: "Numarul elementelor pare de pe diagonala principala.",
    constraints: "1 <= n <= 100, |m[i][j]| <= 1000",
    spec: { name: "numarulElementelorPareDiagonala", params: [{ name: "n", type: "int" }, { name: "m", type: "matrix<int>", rowsParam: "n", colsParam: "n" }], returns: { mode: "value", type: "int" } },
    solve: (args) => args.m.reduce((s, row, i) => s + (row[i] % 2 === 0 ? 1 : 0), 0),
    tests: [{ n: 2, m: [[1, 2], [3, 4]] }, { n: 1, m: [[9]] }, { n: 3, m: [[2, 2, 3], [4, 5, 6], [7, 8, 4]] }, { n: 3, m: [[-1, 0, 1], [0, -2, 0], [1, 0, -3]] }, { n: 4, m: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]] }, { n: 2, m: [[0, 100], [100, 0]] }],
    official_cpp: "int numarulElementelorPareDiagonala(int n, vector<vector<int>> m) {\n    int cnt = 0;\n    for (int i = 0; i < n; i++) if (m[i][i] % 2 == 0) cnt++;\n    return cnt;\n}\n",
    official_python: "def numarulElementelorPareDiagonala(n, m):\n    return sum(1 for i in range(n) if m[i][i] % 2 == 0)\n",
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
