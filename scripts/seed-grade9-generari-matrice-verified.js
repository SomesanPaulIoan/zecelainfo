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

function normalize(text) {
  return text.trim().split(/\r?\n/).map((line) => line.trim()).join("\n");
}

const CHAPTER = { level: "grade9", chapter: "tablouri-bi", sub: "generari-matrice" };

const CPP_HEAD = `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n`;
function C(body) {
  return `${CPP_HEAD}int main(){${body}return 0;}\n`;
}

const IN_FMT_N = "Pe prima linie se afla numarul natural n.";
const IN_FMT_MN = "Pe prima linie se afla doua numere naturale m si n (numarul de linii, respectiv de coloane).";
const READ_N_CPP = `long long n;cin>>n;`;
const READ_N_PY = `n = int(input())\n`;
const READ_MN_CPP = `long long m,n;cin>>m>>n;`;
const READ_MN_PY = `m, n = map(int, input().split())\n`;

const problems = [
  {
    slug: "genereaza-matricea-identitate",
    title: "Genereaza matricea identitate",
    statement: "Se citeste un numar natural n. Generati si afisati matricea identitate de dimensiune n: o matrice patratica avand 1 pe diagonala principala si 0 in rest.",
    input_format: IN_FMT_N,
    output_format: "Afiseaza n linii, fiecare continand n numere separate prin spatiu: matricea identitate.",
    constraints: "1 <= n <= 50",
    difficulty: "easy",
    tags: ["matrice", "generare-matrice"],
    hints: "Pentru fiecare pozitie (i, j), afiseaza 1 daca i este egal cu j, respectiv 0 in caz contrar.",
    explanation: "Se parcurg toate pozitiile (i, j) ale matricei si se afiseaza 1 pentru pozitiile de pe diagonala principala (i == j), respectiv 0 pentru celelalte.\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}for(long long i=0;i<n;i++){for(long long j=0;j<n;j++){cout<<(i==j?1:0);if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_N_PY}for i in range(n):\n    print(" ".join(str(1 if i == j else 0) for j in range(n)))\n`,
    tests: ["3", "1", "2", "5", "4", "6", "10", "7"],
  },
  {
    slug: "genereaza-tabla-inmultirii",
    title: "Genereaza tabla inmultirii",
    statement: "Se citesc doua numere naturale m si n. Generati si afisati o matrice cu m linii si n coloane, indexata de la 1, in care elementul de pe linia i si coloana j este egal cu produsul i * j.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza m linii, fiecare continand n numere separate prin spatiu: matricea generata.",
    constraints: "1 <= m, n <= 50",
    difficulty: "easy",
    tags: ["matrice", "generare-matrice"],
    hints: "Pentru pozitia (i, j), indexata de la 0 in memorie, valoarea afisata este (i+1) * (j+1).",
    explanation: "Se parcurg toate pozitiile (i, j) ale matricei si se afiseaza produsul (i+1) * (j+1), corespunzator indexarii de la 1.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}for(long long i=0;i<m;i++){for(long long j=0;j<n;j++){cout<<((i+1)*(j+1));if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_MN_PY}for i in range(m):\n    print(" ".join(str((i+1)*(j+1)) for j in range(n)))\n`,
    tests: ["3 3", "1 1", "2 5", "5 2", "4 4", "1 10", "10 1", "6 7"],
  },
  {
    slug: "genereaza-matricea-cu-suma-indicilor",
    title: "Genereaza matricea cu suma indicilor",
    statement: "Se citesc doua numere naturale m si n. Generati si afisati o matrice cu m linii si n coloane, indexata de la 1, in care elementul de pe linia i si coloana j este egal cu suma i + j.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza m linii, fiecare continand n numere separate prin spatiu: matricea generata.",
    constraints: "1 <= m, n <= 50",
    difficulty: "easy",
    tags: ["matrice", "generare-matrice"],
    hints: "Pentru pozitia (i, j), indexata de la 0 in memorie, valoarea afisata este (i+1) + (j+1).",
    explanation: "Se parcurg toate pozitiile (i, j) ale matricei si se afiseaza suma (i+1) + (j+1), corespunzatoare indexarii de la 1.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}for(long long i=0;i<m;i++){for(long long j=0;j<n;j++){cout<<((i+1)+(j+1));if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_MN_PY}for i in range(m):\n    print(" ".join(str((i+1)+(j+1)) for j in range(n)))\n`,
    tests: ["3 3", "1 1", "2 5", "5 2", "4 4", "1 10", "10 1", "6 7"],
  },
  {
    slug: "genereaza-matricea-tabla-de-sah",
    title: "Genereaza o matrice in forma de tabla de sah",
    statement: "Se citesc doua numere naturale m si n. Generati si afisati o matrice cu m linii si n coloane, in care elementele alterneaza intre 0 si 1 ca pe o tabla de sah: elementul de pe linia i si coloana j (indexate de la 0) este 1 daca suma i+j este para, respectiv 0 daca este impara.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza m linii, fiecare continand n numere separate prin spatiu: matricea generata.",
    constraints: "1 <= m, n <= 50",
    difficulty: "easy",
    tags: ["matrice", "generare-matrice"],
    hints: "Verifica paritatea sumei indicilor (i+j) pentru fiecare pozitie.",
    explanation: "Se parcurg toate pozitiile (i, j) ale matricei si se afiseaza 1 daca (i+j) este par, respectiv 0 daca este impar, obtinand modelul alternant specific unei table de sah.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}for(long long i=0;i<m;i++){for(long long j=0;j<n;j++){cout<<((i+j)%2==0?1:0);if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_MN_PY}for i in range(m):\n    print(" ".join(str(1 if (i+j) % 2 == 0 else 0) for j in range(n)))\n`,
    tests: ["3 3", "1 1", "2 5", "5 2", "4 4", "1 10", "10 1", "6 7"],
  },
  {
    slug: "genereaza-matricea-umpluta-crescator-pe-linii",
    title: "Genereaza o matrice umpluta crescator pe linii",
    statement: "Se citesc doua numere naturale m si n. Generati si afisati o matrice cu m linii si n coloane, umpluta cu numerele de la 1 la m*n, in ordine crescatoare, linie cu linie (de la stanga la dreapta pe fiecare linie, apoi trecand la linia urmatoare).",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza m linii, fiecare continand n numere separate prin spatiu: matricea generata.",
    constraints: "1 <= m, n <= 50",
    difficulty: "easy",
    tags: ["matrice", "generare-matrice"],
    hints: "Foloseste un contor care porneste de la 1 si se incrementeaza dupa fiecare element afisat, parcurgand matricea linie cu linie.",
    explanation: "Se foloseste un contor initializat cu 1; se parcurge matricea linie cu linie, iar la fiecare pozitie se afiseaza valoarea curenta a contorului, care apoi se incrementeaza.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}long long val=1;for(long long i=0;i<m;i++){for(long long j=0;j<n;j++){cout<<val++;if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_MN_PY}val = 1\nfor i in range(m):\n    row = []\n    for j in range(n):\n        row.append(val)\n        val += 1\n    print(" ".join(str(x) for x in row))\n`,
    tests: ["3 3", "1 1", "2 5", "5 2", "4 4", "1 10", "10 1", "6 7"],
  },
  {
    slug: "genereaza-matricea-umpluta-crescator-pe-coloane",
    title: "Genereaza o matrice umpluta crescator pe coloane",
    statement: "Se citesc doua numere naturale m si n. Generati si afisati o matrice cu m linii si n coloane, umpluta cu numerele de la 1 la m*n, in ordine crescatoare, coloana cu coloana (de sus in jos pe fiecare coloana, apoi trecand la coloana urmatoare).",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza m linii, fiecare continand n numere separate prin spatiu: matricea generata.",
    constraints: "1 <= m, n <= 50",
    difficulty: "easy",
    tags: ["matrice", "generare-matrice"],
    hints: "Construieste mai intai matricea completand-o coloana cu coloana folosind un contor, apoi afiseaz-o linie cu linie.",
    explanation: "Se construieste matricea completand-o coloana cu coloana (pentru fiecare coloana, se parcurg toate liniile) folosind un contor care porneste de la 1, apoi se afiseaza matricea rezultata linie cu linie.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}vector<vector<long long>> a(m, vector<long long>(n));long long val=1;for(long long j=0;j<n;j++)for(long long i=0;i<m;i++)a[i][j]=val++;for(long long i=0;i<m;i++){for(long long j=0;j<n;j++){cout<<a[i][j];if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_MN_PY}a = [[0] * n for _ in range(m)]\nval = 1\nfor j in range(n):\n    for i in range(m):\n        a[i][j] = val\n        val += 1\nfor i in range(m):\n    print(" ".join(str(a[i][j]) for j in range(n)))\n`,
    tests: ["3 3", "1 1", "2 5", "5 2", "4 4", "1 10", "10 1", "6 7"],
  },
  {
    slug: "genereaza-matricea-umpluta-in-zigzag-pe-linii",
    title: "Genereaza o matrice umpluta in zigzag pe linii",
    statement: "Se citesc doua numere naturale m si n. Generati si afisati o matrice cu m linii si n coloane, umpluta cu numerele de la 1 la m*n astfel: prima linie se umple de la stanga la dreapta, a doua linie de la dreapta la stanga, a treia din nou de la stanga la dreapta, si asa mai departe, alternand sensul la fiecare linie.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza m linii, fiecare continand n numere separate prin spatiu: matricea generata.",
    constraints: "1 <= m, n <= 50",
    difficulty: "medium",
    tags: ["matrice", "generare-matrice"],
    hints: "Pentru liniile cu indice par (0, 2, 4, ...) umple de la stanga la dreapta; pentru cele cu indice impar, umple de la dreapta la stanga.",
    explanation: "Se construieste matricea linie cu linie, folosind un contor care porneste de la 1; pentru liniile cu indice par se parcurg coloanele crescator, iar pentru cele cu indice impar, descrescator.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}vector<vector<long long>> a(m, vector<long long>(n));long long val=1;for(long long i=0;i<m;i++){if(i%2==0){for(long long j=0;j<n;j++)a[i][j]=val++;}else{for(long long j=n-1;j>=0;j--)a[i][j]=val++;}}for(long long i=0;i<m;i++){for(long long j=0;j<n;j++){cout<<a[i][j];if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_MN_PY}a = [[0] * n for _ in range(m)]\nval = 1\nfor i in range(m):\n    if i % 2 == 0:\n        for j in range(n):\n            a[i][j] = val\n            val += 1\n    else:\n        for j in range(n-1, -1, -1):\n            a[i][j] = val\n            val += 1\nfor i in range(m):\n    print(" ".join(str(a[i][j]) for j in range(n)))\n`,
    tests: ["3 3", "1 1", "2 5", "5 2", "4 4", "1 10", "10 1", "6 7"],
  },
  {
    slug: "genereaza-matricea-spirala",
    title: "Genereaza o matrice in spirala",
    statement: "Se citeste un numar natural n. Generati si afisati o matrice patratica de dimensiune n, umpluta cu numerele de la 1 la n*n in spirala, incepand din coltul stanga-sus si avansand in sensul acelor de ceasornic, spre interior.",
    input_format: IN_FMT_N,
    output_format: "Afiseaza n linii, fiecare continand n numere separate prin spatiu: matricea generata.",
    constraints: "1 <= n <= 50",
    difficulty: "hard",
    tags: ["matrice", "generare-matrice", "spirala"],
    hints: "Mentine patru limite (sus, jos, stanga, dreapta) ale zonei neumplute inca si completeaza pe rand latura de sus, latura din dreapta, latura de jos si latura din stanga, ingustand limitele dupa fiecare latura.",
    explanation: "Se mentin patru limite (top, bottom, left, right) care delimiteaza zona inca neumpluta a matricei. Se completeaza, in ordine, latura de sus (de la stanga la dreapta), latura din dreapta (de sus in jos), latura de jos (de la dreapta la stanga, doar daca mai exista o linie neumpluta) si latura din stanga (de jos in sus, doar daca mai exista o coloana neumpluta), ingustand limitele corespunzator dupa fiecare latura, pana cand toata matricea este umpluta.\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}vector<vector<long long>> a(n, vector<long long>(n));long long top=0,bottom=n-1,left=0,right=n-1,val=1;while(top<=bottom&&left<=right){for(long long j=left;j<=right;j++)a[top][j]=val++;top++;for(long long i=top;i<=bottom;i++)a[i][right]=val++;right--;if(top<=bottom){for(long long j=right;j>=left;j--)a[bottom][j]=val++;bottom--;}if(left<=right){for(long long i=bottom;i>=top;i--)a[i][left]=val++;left++;}}for(long long i=0;i<n;i++){for(long long j=0;j<n;j++){cout<<a[i][j];if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_N_PY}a = [[0] * n for _ in range(n)]\ntop, bottom, left, right = 0, n-1, 0, n-1\nval = 1\nwhile top <= bottom and left <= right:\n    for j in range(left, right+1):\n        a[top][j] = val\n        val += 1\n    top += 1\n    for i in range(top, bottom+1):\n        a[i][right] = val\n        val += 1\n    right -= 1\n    if top <= bottom:\n        for j in range(right, left-1, -1):\n            a[bottom][j] = val\n            val += 1\n        bottom -= 1\n    if left <= right:\n        for i in range(bottom, top-1, -1):\n            a[i][left] = val\n            val += 1\n        left += 1\nfor i in range(n):\n    print(" ".join(str(a[i][j]) for j in range(n)))\n`,
    tests: ["3", "1", "2", "4", "5", "6", "7", "10"],
  },
  {
    slug: "genereaza-matricea-spirala-inversa-ca-valori",
    title: "Genereaza o matrice in spirala cu valori descrescatoare",
    statement: "Se citeste un numar natural n. Generati si afisati o matrice patratica de dimensiune n, in care pozitiile sunt parcurse in aceeasi spirala (incepand din coltul stanga-sus, in sensul acelor de ceasornic, spre interior) ca la generarea clasica, dar valorile scrise sunt de la n*n descrescator pana la 1.",
    input_format: IN_FMT_N,
    output_format: "Afiseaza n linii, fiecare continand n numere separate prin spatiu: matricea generata.",
    constraints: "1 <= n <= 50",
    difficulty: "hard",
    tags: ["matrice", "generare-matrice", "spirala"],
    hints: "Foloseste acelasi algoritm de parcurgere in spirala ca la matricea spirala clasica, dar porneste contorul de la n*n si scade-l dupa fiecare pozitie completata.",
    explanation: "Se foloseste acelasi algoritm de parcurgere in spirala (cu cele patru limite top, bottom, left, right) ca la generarea matricei spirala clasice, dar contorul porneste de la n*n si se decrementeaza dupa fiecare pozitie completata, in loc sa porneasca de la 1 si sa creasca.\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}vector<vector<long long>> a(n, vector<long long>(n));long long top=0,bottom=n-1,left=0,right=n-1,val=n*n;while(top<=bottom&&left<=right){for(long long j=left;j<=right;j++)a[top][j]=val--;top++;for(long long i=top;i<=bottom;i++)a[i][right]=val--;right--;if(top<=bottom){for(long long j=right;j>=left;j--)a[bottom][j]=val--;bottom--;}if(left<=right){for(long long i=bottom;i>=top;i--)a[i][left]=val--;left++;}}for(long long i=0;i<n;i++){for(long long j=0;j<n;j++){cout<<a[i][j];if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_N_PY}a = [[0] * n for _ in range(n)]\ntop, bottom, left, right = 0, n-1, 0, n-1\nval = n * n\nwhile top <= bottom and left <= right:\n    for j in range(left, right+1):\n        a[top][j] = val\n        val -= 1\n    top += 1\n    for i in range(top, bottom+1):\n        a[i][right] = val\n        val -= 1\n    right -= 1\n    if top <= bottom:\n        for j in range(right, left-1, -1):\n            a[bottom][j] = val\n            val -= 1\n        bottom -= 1\n    if left <= right:\n        for i in range(bottom, top-1, -1):\n            a[i][left] = val\n            val -= 1\n        left += 1\nfor i in range(n):\n    print(" ".join(str(a[i][j]) for j in range(n)))\n`,
    tests: ["3", "1", "2", "4", "5", "6", "7", "10"],
  },
  {
    slug: "genereaza-matricea-frontiera-1-interior-0",
    title: "Genereaza o matrice cu frontiera de 1 si interior de 0",
    statement: "Se citesc doua numere naturale m si n. Generati si afisati o matrice cu m linii si n coloane, in care elementele aflate pe conturul (marginea) matricei sunt egale cu 1, iar toate celelalte elemente, din interior, sunt egale cu 0.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza m linii, fiecare continand n numere separate prin spatiu: matricea generata.",
    constraints: "1 <= m, n <= 50",
    difficulty: "easy",
    tags: ["matrice", "generare-matrice"],
    hints: "O pozitie (i, j) se afla pe contur daca i este 0 sau m-1, sau daca j este 0 sau n-1.",
    explanation: "Se parcurg toate pozitiile (i, j) ale matricei si se afiseaza 1 daca pozitia se afla pe prima/ultima linie sau prima/ultima coloana, respectiv 0 in caz contrar.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}for(long long i=0;i<m;i++){for(long long j=0;j<n;j++){cout<<((i==0||i==m-1||j==0||j==n-1)?1:0);if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_MN_PY}for i in range(m):\n    print(" ".join(str(1 if (i==0 or i==m-1 or j==0 or j==n-1) else 0) for j in range(n)))\n`,
    tests: ["3 3", "1 1", "2 5", "5 2", "4 4", "1 10", "10 1", "6 7"],
  },
  {
    slug: "genereaza-matricea-frontiera-0-interior-1",
    title: "Genereaza o matrice cu frontiera de 0 si interior de 1",
    statement: "Se citesc doua numere naturale m si n. Generati si afisati o matrice cu m linii si n coloane, in care elementele aflate pe conturul (marginea) matricei sunt egale cu 0, iar toate celelalte elemente, din interior, sunt egale cu 1.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza m linii, fiecare continand n numere separate prin spatiu: matricea generata.",
    constraints: "1 <= m, n <= 50",
    difficulty: "easy",
    tags: ["matrice", "generare-matrice"],
    hints: "O pozitie (i, j) se afla pe contur daca i este 0 sau m-1, sau daca j este 0 sau n-1.",
    explanation: "Se parcurg toate pozitiile (i, j) ale matricei si se afiseaza 0 daca pozitia se afla pe prima/ultima linie sau prima/ultima coloana, respectiv 1 in caz contrar.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}for(long long i=0;i<m;i++){for(long long j=0;j<n;j++){cout<<((i==0||i==m-1||j==0||j==n-1)?0:1);if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_MN_PY}for i in range(m):\n    print(" ".join(str(0 if (i==0 or i==m-1 or j==0 or j==n-1) else 1) for j in range(n)))\n`,
    tests: ["3 3", "1 1", "2 5", "5 2", "4 4", "1 10", "10 1", "6 7"],
  },
  {
    slug: "genereaza-matricea-triunghiul-lui-pascal",
    title: "Genereaza triunghiul lui Pascal sub forma de matrice",
    statement: "Se citeste un numar natural n. Generati si afisati o matrice patratica de dimensiune n, indexata de la 0, in care elementul de pe linia i si coloana j este coeficientul binomial C(i, j) daca j <= i, respectiv 0 daca j > i (obtinand astfel triunghiul lui Pascal, completat cu zerouri pana la o forma patratica).",
    input_format: IN_FMT_N,
    output_format: "Afiseaza n linii, fiecare continand n numere separate prin spatiu: matricea generata.",
    constraints: "1 <= n <= 20",
    difficulty: "medium",
    tags: ["matrice", "generare-matrice", "combinatorica"],
    hints: "Foloseste relatia de recurenta a triunghiului lui Pascal: C(i, j) = C(i-1, j-1) + C(i-1, j), cu C(i, 0) = 1 pentru orice i.",
    explanation: "Se construieste matricea folosind recurenta triunghiului lui Pascal: pentru fiecare linie i, primul element este 1, iar fiecare element urmator a[i][j] este suma a[i-1][j-1] + a[i-1][j] (unde valorile din afara triunghiului sunt considerate 0, datorita initializarii matricei cu 0).\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}vector<vector<long long>> a(n, vector<long long>(n,0));for(long long i=0;i<n;i++){a[i][0]=1;for(long long j=1;j<=i;j++){a[i][j]=a[i-1][j-1]+a[i-1][j];}}for(long long i=0;i<n;i++){for(long long j=0;j<n;j++){cout<<a[i][j];if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_N_PY}a = [[0] * n for _ in range(n)]\nfor i in range(n):\n    a[i][0] = 1\n    for j in range(1, i + 1):\n        a[i][j] = a[i-1][j-1] + a[i-1][j]\nfor i in range(n):\n    print(" ".join(str(a[i][j]) for j in range(n)))\n`,
    tests: ["5", "1", "2", "3", "10", "15", "20", "8"],
  },
  {
    slug: "genereaza-matricea-diagonalelor-constante",
    title: "Genereaza o matrice cu diagonale constante",
    statement: "Se citeste un numar natural n. Generati si afisati o matrice patratica de dimensiune n, indexata de la 0, in care elementul de pe linia i si coloana j este egal cu valoarea absoluta a diferentei i - j (astfel, toate elementele aflate pe aceeasi diagonala au aceeasi valoare).",
    input_format: IN_FMT_N,
    output_format: "Afiseaza n linii, fiecare continand n numere separate prin spatiu: matricea generata.",
    constraints: "1 <= n <= 50",
    difficulty: "easy",
    tags: ["matrice", "generare-matrice", "diagonala"],
    hints: "Pentru fiecare pozitie (i, j), afiseaza distanta dintre i si j, adica |i - j|.",
    explanation: "Se parcurg toate pozitiile (i, j) ale matricei si se afiseaza |i - j|; toate pozitiile aflate pe aceeasi diagonala (paralela cu diagonala principala) au aceeasi diferenta i - j in valoare absoluta, deci aceeasi valoare afisata.\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}for(long long i=0;i<n;i++){for(long long j=0;j<n;j++){long long d=(i>j)?(i-j):(j-i);cout<<d;if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_N_PY}for i in range(n):\n    print(" ".join(str(abs(i - j)) for j in range(n)))\n`,
    tests: ["3", "1", "2", "5", "4", "6", "10", "7"],
  },
  {
    slug: "genereaza-matricea-cu-puteri-ale-lui-2-pe-fiecare-linie",
    title: "Genereaza o matrice cu puteri ale lui 2 pe fiecare linie",
    statement: "Se citesc doua numere naturale m si n. Generati si afisati o matrice cu m linii si n coloane, indexata de la 0, in care fiecare linie contine aceleasi valori: elementul de pe coloana j este 2 la puterea j.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza m linii, fiecare continand n numere separate prin spatiu: matricea generata.",
    constraints: "1 <= m <= 50, 1 <= n <= 30",
    difficulty: "easy",
    tags: ["matrice", "generare-matrice", "puteri"],
    hints: "Precalculeaza puterile lui 2 de la 2^0 pana la 2^(n-1) intr-un vector, apoi afiseaz-o pe fiecare linie.",
    explanation: "Se precalculeaza intr-un vector auxiliar valorile 2^0, 2^1, ..., 2^(n-1), apoi se afiseaza acelasi vector pentru fiecare din cele m linii ale matricei.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}vector<long long> pow2(n);pow2[0]=1;for(long long j=1;j<n;j++)pow2[j]=pow2[j-1]*2;for(long long i=0;i<m;i++){for(long long j=0;j<n;j++){cout<<pow2[j];if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_MN_PY}pow2 = [1] * n\nfor j in range(1, n):\n    pow2[j] = pow2[j-1] * 2\nfor i in range(m):\n    print(" ".join(str(pow2[j]) for j in range(n)))\n`,
    tests: ["3 4", "1 1", "2 5", "5 2", "4 4", "1 10", "10 1", "6 7"],
  },
  {
    slug: "genereaza-matricea-fibonacci-pe-linii",
    title: "Genereaza o matrice umpluta cu termeni Fibonacci",
    statement: "Se citesc doua numere naturale m si n. Generati si afisati o matrice cu m linii si n coloane, umpluta linie cu linie (de la stanga la dreapta, apoi trecand la linia urmatoare) cu primii m*n termeni ai sirului lui Fibonacci, incepand cu F(1) = 1, F(2) = 1.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza m linii, fiecare continand n numere separate prin spatiu: matricea generata.",
    constraints: "1 <= m <= 7, 1 <= n <= 7",
    difficulty: "medium",
    tags: ["matrice", "generare-matrice", "fibonacci"],
    hints: "Precalculeaza primii m*n termeni ai sirului lui Fibonacci intr-un vector, apoi distribuie-i in matrice, linie cu linie.",
    explanation: "Se precalculeaza primii m*n termeni ai sirului lui Fibonacci intr-un vector auxiliar, apoi se distribuie aceste valori in matrice, linie cu linie, folosind un indice care avanseaza dupa fiecare pozitie completata.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}long long total=m*n;vector<long long> fib(total);fib[0]=1;if(total>=2)fib[1]=1;for(long long k=2;k<total;k++)fib[k]=fib[k-1]+fib[k-2];long long idx=0;for(long long i=0;i<m;i++){for(long long j=0;j<n;j++){cout<<fib[idx++];if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_MN_PY}total = m * n\nfib = [0] * total\nfib[0] = 1\nif total >= 2:\n    fib[1] = 1\nfor k in range(2, total):\n    fib[k] = fib[k-1] + fib[k-2]\nidx = 0\nfor i in range(m):\n    row = []\n    for j in range(n):\n        row.append(fib[idx])\n        idx += 1\n    print(" ".join(str(x) for x in row))\n`,
    tests: ["3 3", "1 1", "2 5", "5 2", "4 4", "1 7", "7 1", "6 6"],
  },
  {
    slug: "genereaza-matricea-inelelor-concentrice",
    title: "Genereaza o matrice cu inele concentrice",
    statement: "Se citeste un numar natural n. Generati si afisati o matrice patratica de dimensiune n, indexata de la 0, in care fiecare element are ca valoare numarul inelului concentric din care face parte, numerotat de la 1 pornind de la margine spre centru.",
    input_format: IN_FMT_N,
    output_format: "Afiseaza n linii, fiecare continand n numere separate prin spatiu: matricea generata.",
    constraints: "1 <= n <= 50",
    difficulty: "medium",
    tags: ["matrice", "generare-matrice"],
    hints: "Distanta unei pozitii (i, j) fata de marginea cea mai apropiata este minimul dintre i, j, n-1-i si n-1-j; numarul inelului este aceasta distanta plus 1.",
    explanation: "Pentru fiecare pozitie (i, j), numarul inelului din care face parte este min(i, j, n-1-i, n-1-j) + 1, deoarece aceasta valoare reprezinta cate straturi de margine trebuie indepartate pentru a ajunge la acea pozitie.\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}for(long long i=0;i<n;i++){for(long long j=0;j<n;j++){long long v=min(min(i,j),min(n-1-i,n-1-j))+1;cout<<v;if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_N_PY}for i in range(n):\n    print(" ".join(str(min(i, j, n-1-i, n-1-j) + 1) for j in range(n)))\n`,
    tests: ["3", "1", "2", "5", "4", "6", "10", "7"],
  },
  {
    slug: "genereaza-matricea-cu-restul-sumei-indicilor",
    title: "Genereaza o matrice cu restul sumei indicilor",
    statement: "Se citesc doua numere naturale m si n, si un numar natural nenul k. Generati si afisati o matrice cu m linii si n coloane, indexata de la 0, in care elementul de pe linia i si coloana j este restul impartirii sumei i+j la k.",
    input_format: "Pe prima linie se afla doua numere naturale m si n. Pe a doua linie se afla numarul natural nenul k.",
    output_format: "Afiseaza m linii, fiecare continand n numere separate prin spatiu: matricea generata.",
    constraints: "1 <= m, n <= 50, 1 <= k <= 1000",
    difficulty: "easy",
    tags: ["matrice", "generare-matrice", "divizibilitate"],
    hints: "Pentru fiecare pozitie (i, j), afiseaza (i+j) modulo k.",
    explanation: "Se parcurg toate pozitiile (i, j) ale matricei si se afiseaza restul impartirii sumei i+j la k.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}long long k;cin>>k;for(long long i=0;i<m;i++){for(long long j=0;j<n;j++){cout<<((i+j)%k);if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_MN_PY}k = int(input())\nfor i in range(m):\n    print(" ".join(str((i+j) % k) for j in range(n)))\n`,
    tests: ["3 3\n2", "1 1\n1", "2 5\n3", "5 2\n4", "4 4\n5", "1 10\n1000", "10 1\n7", "6 7\n1"],
  },
  {
    slug: "genereaza-matricea-in-spirala-anti-orara",
    title: "Genereaza o matrice in spirala in sens antiorar",
    statement: "Se citeste un numar natural n. Generati si afisati o matrice patratica de dimensiune n, umpluta cu numerele de la 1 la n*n in spirala, incepand din coltul stanga-sus si avansand in sens antiorar (invers acelor de ceasornic), spre interior.",
    input_format: IN_FMT_N,
    output_format: "Afiseaza n linii, fiecare continand n numere separate prin spatiu: matricea generata.",
    constraints: "1 <= n <= 50",
    difficulty: "hard",
    tags: ["matrice", "generare-matrice", "spirala"],
    hints: "O spirala antiorara este exact transpusa unei spirale orare: genereaza mai intai spirala clasica (orara), apoi afiseaz-o transpusa (schimband liniile cu coloanele).",
    explanation: "Se genereaza mai intai matricea spirala clasica, in sensul acelor de ceasornic, folosind algoritmul cu cele patru limite (top, bottom, left, right). Se observa ca transpusa unei spirale orare este exact o spirala antiorara cu acelasi punct de start, asa ca matricea finala se afiseaza transpusa, fara a mai recalcula o noua parcurgere.\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}vector<vector<long long>> a(n, vector<long long>(n));long long top=0,bottom=n-1,left=0,right=n-1,val=1;while(top<=bottom&&left<=right){for(long long j=left;j<=right;j++)a[top][j]=val++;top++;for(long long i=top;i<=bottom;i++)a[i][right]=val++;right--;if(top<=bottom){for(long long j=right;j>=left;j--)a[bottom][j]=val++;bottom--;}if(left<=right){for(long long i=bottom;i>=top;i--)a[i][left]=val++;left++;}}for(long long i=0;i<n;i++){for(long long j=0;j<n;j++){cout<<a[j][i];if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_N_PY}a = [[0] * n for _ in range(n)]\ntop, bottom, left, right = 0, n-1, 0, n-1\nval = 1\nwhile top <= bottom and left <= right:\n    for j in range(left, right+1):\n        a[top][j] = val\n        val += 1\n    top += 1\n    for i in range(top, bottom+1):\n        a[i][right] = val\n        val += 1\n    right -= 1\n    if top <= bottom:\n        for j in range(right, left-1, -1):\n            a[bottom][j] = val\n            val += 1\n        bottom -= 1\n    if left <= right:\n        for i in range(bottom, top-1, -1):\n            a[i][left] = val\n            val += 1\n        left += 1\nfor i in range(n):\n    print(" ".join(str(a[j][i]) for j in range(n)))\n`,
    tests: ["3", "1", "2", "4", "5", "6", "7", "10"],
  },
  {
    slug: "genereaza-matricea-cu-4-cadrane",
    title: "Genereaza o matrice cu 4 cadrane",
    statement: "Se citesc doua numere naturale pare m si n. Generati si afisati o matrice cu m linii si n coloane, impartita in 4 cadrane egale: cadranul stanga-sus contine numai valoarea 1, cadranul dreapta-sus numai valoarea 2, cadranul stanga-jos numai valoarea 3, iar cadranul dreapta-jos numai valoarea 4.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza m linii, fiecare continand n numere separate prin spatiu: matricea generata.",
    constraints: "2 <= m, n <= 50, m si n sunt numere pare",
    difficulty: "medium",
    tags: ["matrice", "generare-matrice"],
    hints: "Imparte matricea in doua jumatati pe verticala (dupa linia m/2) si doua jumatati pe orizontala (dupa coloana n/2), apoi determina cadranul fiecarei pozitii.",
    explanation: "Se calculeaza jumatatea numarului de linii (m/2) si jumatatea numarului de coloane (n/2); pentru fiecare pozitie (i, j) se determina in care dintre cele 4 cadrane se afla, comparand i cu m/2 si j cu n/2, si se afiseaza valoarea corespunzatoare cadranului.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}long long hm=m/2,hn=n/2;for(long long i=0;i<m;i++){for(long long j=0;j<n;j++){long long v;if(i<hm&&j<hn)v=1;else if(i<hm&&j>=hn)v=2;else if(i>=hm&&j<hn)v=3;else v=4;cout<<v;if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_MN_PY}hm, hn = m // 2, n // 2\nfor i in range(m):\n    row = []\n    for j in range(n):\n        if i < hm and j < hn:\n            v = 1\n        elif i < hm and j >= hn:\n            v = 2\n        elif i >= hm and j < hn:\n            v = 3\n        else:\n            v = 4\n        row.append(v)\n    print(" ".join(str(x) for x in row))\n`,
    tests: ["4 4", "2 2", "2 6", "6 2", "8 4", "2 10", "10 2", "6 8"],
  },
  {
    slug: "genereaza-matricea-simetrica-fata-de-centru",
    title: "Genereaza o matrice simetrica fata de centru",
    statement: "Se citesc doua numere naturale m si n. Generati si afisati o matrice cu m linii si n coloane, in care pozitiile simetrice fata de centrul matricei (pozitia (i, j) si pozitia (m-1-i, n-1-j)) au aceeasi valoare. Valorile se atribuie crescator, incepand de la 1, parcurgand matricea linie cu linie si atribuind aceeasi valoare noua unei pozitii neatribuite inca si perechii sale simetrice.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza m linii, fiecare continand n numere separate prin spatiu: matricea generata.",
    constraints: "1 <= m, n <= 50",
    difficulty: "medium",
    tags: ["matrice", "generare-matrice", "simetrie"],
    hints: "Parcurge matricea linie cu linie; daca o pozitie nu a fost inca atribuita, atribuie-i o valoare noua si atribuie aceeasi valoare si pozitiei sale simetrice fata de centru, daca aceasta nu a fost inca atribuita.",
    explanation: "Se parcurge matricea linie cu linie, mentinand o matrice de marcaje pentru pozitiile deja atribuite. Cand se ajunge la o pozitie neatribuita, i se atribuie o valoare noua, iar aceeasi valoare se atribuie si pozitiei simetrice fata de centrul matricei (m-1-i, n-1-j), daca aceasta nu a fost deja atribuita; contorul de valori avanseaza dupa fiecare pereche (sau pozitie unica, la centrul unei matrice cu dimensiuni impare).\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}vector<vector<long long>> a(m, vector<long long>(n,0));vector<vector<bool>> assigned(m, vector<bool>(n,false));long long c=1;for(long long i=0;i<m;i++){for(long long j=0;j<n;j++){if(!assigned[i][j]){a[i][j]=c;assigned[i][j]=true;long long pi=m-1-i,pj=n-1-j;if(!assigned[pi][pj]){a[pi][pj]=c;assigned[pi][pj]=true;}c++;}}}for(long long i=0;i<m;i++){for(long long j=0;j<n;j++){cout<<a[i][j];if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_MN_PY}a = [[0] * n for _ in range(m)]\nassigned = [[False] * n for _ in range(m)]\nc = 1\nfor i in range(m):\n    for j in range(n):\n        if not assigned[i][j]:\n            a[i][j] = c\n            assigned[i][j] = True\n            pi, pj = m-1-i, n-1-j\n            if not assigned[pi][pj]:\n                a[pi][pj] = c\n                assigned[pi][pj] = True\n            c += 1\nfor i in range(m):\n    print(" ".join(str(a[i][j]) for j in range(n)))\n`,
    tests: ["3 3", "1 1", "2 5", "5 2", "4 4", "1 10", "10 1", "6 7"],
  },
];

async function seedGroup(problems, chapterInfo) {
  const summary = [];

  for (const p of problems) {
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
        p.time_limit_ms || 1500,
        p.memory_limit_mb || 64,
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
  const onlySlugs = process.env.ONLY_SLUGS ? process.env.ONLY_SLUGS.split(",") : null;
  const toRun = onlySlugs ? problems.filter((p) => onlySlugs.includes(p.slug)) : problems;
  const summary = await seedGroup(toRun, CHAPTER);

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
