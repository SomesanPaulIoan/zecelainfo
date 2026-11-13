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

const CHAPTER = { level: "grade9", chapter: "tablouri-bi", sub: "parcurgere-matrici-patratice" };

const CPP_HEAD = `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n`;
function C(body) {
  return `${CPP_HEAD}int main(){${body}return 0;}\n`;
}

const IN_FMT_N = "Pe prima linie se afla numarul natural n. Urmeaza n linii, fiecare continand n numere intregi, separate prin spatiu.";
const OUT_DA_NU = "Afiseaza DA daca proprietatea este verificata, respectiv NU in caz contrar.";
const READ_N_CPP = `long long n;cin>>n;vector<vector<long long>> a(n, vector<long long>(n));for(long long i=0;i<n;i++)for(long long j=0;j<n;j++)cin>>a[i][j];`;
const READ_N_PY = `n = int(input())\na = [list(map(int, input().split())) for _ in range(n)]\n`;

const problems = [
  {
    slug: "produsul-elementelor-de-pe-diagonala-principala",
    title: "Produsul elementelor de pe diagonala principala",
    statement: "Se citeste o matrice patratica de dimensiune n. Determinati produsul elementelor aflate pe diagonala principala.",
    input_format: IN_FMT_N,
    output_format: "Afiseaza un singur numar intreg: produsul cerut.",
    constraints: "1 <= n <= 10, -10 <= a[i][j] <= 10",
    difficulty: "easy",
    tags: ["matrice-patratica", "diagonala"],
    hints: "Elementele diagonalei principale sunt cele aflate pe pozitiile (i, i), pentru i de la 0 la n-1.",
    explanation: "Se parcurg elementele a[i][i], pentru i de la 0 la n-1, si se inmultesc intre ele.\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_N_CPP}long long p=1;for(long long i=0;i<n;i++)p*=a[i][i];cout<<p<<"\\n";`),
    py: `${READ_N_PY}p = 1\nfor i in range(n):\n    p *= a[i][i]\nprint(p)\n`,
    tests: [
      "3\n1 2 3\n4 5 6\n7 8 9",
      "1\n5",
      "2\n2 0\n0 3",
      "3\n-1 2 3\n4 -5 6\n7 8 -9",
      "4\n1 0 0 0\n0 1 0 0\n0 0 1 0\n0 0 0 1",
      "5\n1 1 1 1 1\n1 2 1 1 1\n1 1 3 1 1\n1 1 1 4 1\n1 1 1 1 5",
      "2\n-2 5\n5 -2",
      "6\n1 0 0 0 0 0\n0 -1 0 0 0 0\n0 0 1 0 0 0\n0 0 0 -1 0 0\n0 0 0 0 1 0\n0 0 0 0 0 -1",
    ],
  },
  {
    slug: "suma-diagonalei-secundare",
    title: "Suma elementelor de pe diagonala secundara",
    statement: "Se citeste o matrice patratica de dimensiune n. Determinati suma elementelor aflate pe diagonala secundara.",
    input_format: IN_FMT_N,
    output_format: "Afiseaza un singur numar intreg: suma ceruta.",
    constraints: "1 <= n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice-patratica", "diagonala"],
    hints: "Elementele diagonalei secundare sunt cele aflate pe pozitiile (i, n-1-i), pentru i de la 0 la n-1.",
    explanation: "Se parcurg elementele a[i][n-1-i], pentru i de la 0 la n-1, si se aduna.\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_N_CPP}long long s=0;for(long long i=0;i<n;i++)s+=a[i][n-1-i];cout<<s<<"\\n";`),
    py: `${READ_N_PY}print(sum(a[i][n-1-i] for i in range(n)))\n`,
    tests: [
      "3\n1 2 3\n4 5 6\n7 8 9",
      "1\n5",
      "2\n2 0\n0 3",
      "3\n-1 2 3\n4 -5 6\n7 8 -9",
      "4\n1 0 0 0\n0 1 0 0\n0 0 1 0\n0 0 0 1",
      "5\n1 1 1 1 1\n1 2 1 1 1\n1 1 3 1 1\n1 1 1 4 1\n1 1 1 1 5",
      "2\n-2 5\n5 -2",
      "6\n1 0 0 0 0 6\n0 -1 0 0 5 0\n0 0 1 4 0 0\n0 0 3 0 0 0\n0 2 0 0 0 0\n1 0 0 0 0 0",
    ],
  },
  {
    slug: "suma-ambelor-diagonale",
    title: "Suma elementelor de pe cele doua diagonale",
    statement: "Se citeste o matrice patratica de dimensiune n. Determinati suma elementelor aflate pe cele doua diagonale (principala si secundara). Daca n este impar, elementul din centru, aflat pe ambele diagonale, se numara o singura data.",
    input_format: IN_FMT_N,
    output_format: "Afiseaza un singur numar intreg: suma ceruta.",
    constraints: "1 <= n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "medium",
    tags: ["matrice-patratica", "diagonala"],
    hints: "Aduna elementele diagonalei principale si ale diagonalei secundare, dar la n impar, elementul central (i == n-1-i) nu trebuie adunat de doua ori.",
    explanation: "Se aduna elementele diagonalei principale a[i][i] pentru toti i; apoi se aduna elementele diagonalei secundare a[i][n-1-i], dar numai pentru pozitiile care nu coincid cu cele deja adunate (adica atunci cand i != n-1-i).\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_N_CPP}long long s=0;for(long long i=0;i<n;i++)s+=a[i][i];for(long long i=0;i<n;i++)if(i!=n-1-i)s+=a[i][n-1-i];cout<<s<<"\\n";`),
    py: `${READ_N_PY}s = sum(a[i][i] for i in range(n))\ns += sum(a[i][n-1-i] for i in range(n) if i != n-1-i)\nprint(s)\n`,
    tests: [
      "3\n1 2 3\n4 5 6\n7 8 9",
      "1\n5",
      "2\n2 0\n0 3",
      "3\n-1 2 3\n4 -5 6\n7 8 -9",
      "4\n1 0 0 0\n0 1 0 0\n0 0 1 0\n0 0 0 1",
      "5\n1 1 1 1 1\n1 2 1 1 1\n1 1 3 1 1\n1 1 1 4 1\n1 1 1 1 5",
      "2\n-2 5\n5 -2",
      "6\n1 0 0 0 0 6\n0 -1 0 0 5 0\n0 0 1 4 0 0\n0 0 3 0 0 0\n0 2 0 0 0 0\n1 0 0 0 0 0",
    ],
  },
  {
    slug: "verifica-daca-o-matrice-este-simetrica",
    title: "Verifica daca o matrice patratica este simetrica",
    statement: "Se citeste o matrice patratica de dimensiune n. Verificati daca matricea este simetrica, adica a[i][j] este egal cu a[j][i], pentru orice i si j.",
    input_format: IN_FMT_N,
    output_format: OUT_DA_NU,
    constraints: "1 <= n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice-patratica", "simetrie"],
    hints: "Compara fiecare element a[i][j] cu elementul sau opus fata de diagonala principala, a[j][i].",
    explanation: "Se parcurg toate perechile (i, j) si se verifica daca a[i][j] este egal cu a[j][i].\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}bool ok=true;for(long long i=0;i<n;i++)for(long long j=0;j<n;j++)if(a[i][j]!=a[j][i])ok=false;cout<<(ok?"DA":"NU")<<"\\n";`),
    py: `${READ_N_PY}ok = all(a[i][j] == a[j][i] for i in range(n) for j in range(n))\nprint("DA" if ok else "NU")\n`,
    tests: [
      "3\n1 2 3\n2 5 6\n3 6 9",
      "3\n1 2 3\n4 5 6\n7 8 9",
      "1\n5",
      "2\n1 2\n2 1",
      "2\n1 2\n3 1",
      "4\n1 2 3 4\n2 5 6 7\n3 6 8 9\n4 7 9 10",
      "4\n0 0 0 0\n0 0 0 0\n0 0 0 0\n0 0 0 1",
      "5\n1 2 3 4 5\n2 1 2 3 4\n3 2 1 2 3\n4 3 2 1 2\n5 4 3 2 1",
    ],
  },
  {
    slug: "verifica-daca-o-matrice-este-antisimetrica",
    title: "Verifica daca o matrice patratica este antisimetrica",
    statement: "Se citeste o matrice patratica de dimensiune n. Verificati daca matricea este antisimetrica, adica a[i][j] este egal cu -a[j][i], pentru orice i si j.",
    input_format: IN_FMT_N,
    output_format: OUT_DA_NU,
    constraints: "1 <= n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "medium",
    tags: ["matrice-patratica", "simetrie"],
    hints: "Compara fiecare element a[i][j] cu opusul elementului simetric fata de diagonala principala, -a[j][i]. Observa ca elementele de pe diagonala principala trebuie sa fie 0.",
    explanation: "Se parcurg toate perechile (i, j) si se verifica daca a[i][j] este egal cu -a[j][i]; conditia implica automat ca elementele de pe diagonala principala trebuie sa fie 0.\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}bool ok=true;for(long long i=0;i<n;i++)for(long long j=0;j<n;j++)if(a[i][j]!=-a[j][i])ok=false;cout<<(ok?"DA":"NU")<<"\\n";`),
    py: `${READ_N_PY}ok = all(a[i][j] == -a[j][i] for i in range(n) for j in range(n))\nprint("DA" if ok else "NU")\n`,
    tests: [
      "3\n0 2 3\n-2 0 6\n-3 -6 0",
      "3\n1 2 3\n4 5 6\n7 8 9",
      "1\n0",
      "1\n5",
      "2\n0 2\n-2 0",
      "2\n0 2\n2 0",
      "4\n0 1 2 3\n-1 0 4 5\n-2 -4 0 6\n-3 -5 -6 0",
      "4\n0 1 2 3\n-1 1 4 5\n-2 -4 0 6\n-3 -5 -6 0",
    ],
  },
  {
    slug: "verifica-daca-o-matrice-este-diagonala",
    title: "Verifica daca o matrice patratica este diagonala",
    statement: "Se citeste o matrice patratica de dimensiune n. Verificati daca matricea este diagonala, adica toate elementele aflate in afara diagonalei principale sunt egale cu 0.",
    input_format: IN_FMT_N,
    output_format: OUT_DA_NU,
    constraints: "1 <= n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice-patratica", "diagonala"],
    hints: "Verifica ca toate elementele a[i][j] cu i diferit de j sunt egale cu 0.",
    explanation: "Se parcurg toate elementele matricei; pentru fiecare pozitie (i, j) cu i diferit de j, se verifica daca elementul este 0.\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}bool ok=true;for(long long i=0;i<n;i++)for(long long j=0;j<n;j++)if(i!=j&&a[i][j]!=0)ok=false;cout<<(ok?"DA":"NU")<<"\\n";`),
    py: `${READ_N_PY}ok = all(a[i][j] == 0 for i in range(n) for j in range(n) if i != j)\nprint("DA" if ok else "NU")\n`,
    tests: [
      "3\n1 0 0\n0 5 0\n0 0 9",
      "3\n1 2 0\n0 5 0\n0 0 9",
      "1\n5",
      "1\n0",
      "2\n1 0\n0 1",
      "2\n1 0\n1 1",
      "4\n1 0 0 0\n0 0 0 0\n0 0 -3 0\n0 0 0 5",
      "4\n1 0 0 0\n0 0 0 0\n0 0 -3 0\n0 0 1 5",
    ],
  },
  {
    slug: "verifica-daca-o-matrice-este-triunghiulara-superior",
    title: "Verifica daca o matrice patratica este triunghiulara superior",
    statement: "Se citeste o matrice patratica de dimensiune n. Verificati daca matricea este triunghiulara superior, adica toate elementele aflate sub diagonala principala sunt egale cu 0.",
    input_format: IN_FMT_N,
    output_format: OUT_DA_NU,
    constraints: "1 <= n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice-patratica"],
    hints: "Verifica ca toate elementele a[i][j] cu i > j sunt egale cu 0.",
    explanation: "Se parcurg toate elementele matricei; pentru fiecare pozitie (i, j) cu i > j (aflata sub diagonala principala), se verifica daca elementul este 0.\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}bool ok=true;for(long long i=0;i<n;i++)for(long long j=0;j<n;j++)if(i>j&&a[i][j]!=0)ok=false;cout<<(ok?"DA":"NU")<<"\\n";`),
    py: `${READ_N_PY}ok = all(a[i][j] == 0 for i in range(n) for j in range(n) if i > j)\nprint("DA" if ok else "NU")\n`,
    tests: [
      "3\n1 2 3\n0 5 6\n0 0 9",
      "3\n1 2 3\n4 5 6\n0 0 9",
      "1\n5",
      "1\n0",
      "2\n1 2\n0 1",
      "2\n1 2\n3 1",
      "4\n1 2 3 4\n0 5 6 7\n0 0 8 9\n0 0 0 10",
      "4\n1 2 3 4\n0 5 6 7\n0 1 8 9\n0 0 0 10",
    ],
  },
  {
    slug: "verifica-daca-o-matrice-este-triunghiulara-inferior",
    title: "Verifica daca o matrice patratica este triunghiulara inferior",
    statement: "Se citeste o matrice patratica de dimensiune n. Verificati daca matricea este triunghiulara inferior, adica toate elementele aflate deasupra diagonalei principale sunt egale cu 0.",
    input_format: IN_FMT_N,
    output_format: OUT_DA_NU,
    constraints: "1 <= n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice-patratica"],
    hints: "Verifica ca toate elementele a[i][j] cu i < j sunt egale cu 0.",
    explanation: "Se parcurg toate elementele matricei; pentru fiecare pozitie (i, j) cu i < j (aflata deasupra diagonalei principale), se verifica daca elementul este 0.\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}bool ok=true;for(long long i=0;i<n;i++)for(long long j=0;j<n;j++)if(i<j&&a[i][j]!=0)ok=false;cout<<(ok?"DA":"NU")<<"\\n";`),
    py: `${READ_N_PY}ok = all(a[i][j] == 0 for i in range(n) for j in range(n) if i < j)\nprint("DA" if ok else "NU")\n`,
    tests: [
      "3\n1 0 0\n4 5 0\n7 8 9",
      "3\n1 2 0\n4 5 0\n7 8 9",
      "1\n5",
      "1\n0",
      "2\n1 0\n2 1",
      "2\n1 2\n3 1",
      "4\n1 0 0 0\n2 5 0 0\n3 6 8 0\n4 7 9 10",
      "4\n1 0 0 0\n2 5 0 0\n3 6 8 1\n4 7 9 10",
    ],
  },
  {
    slug: "suma-elementelor-deasupra-diagonalei-principale",
    title: "Suma elementelor de deasupra diagonalei principale",
    statement: "Se citeste o matrice patratica de dimensiune n. Determinati suma elementelor aflate strict deasupra diagonalei principale (elementele a[i][j] cu i < j).",
    input_format: IN_FMT_N,
    output_format: "Afiseaza un singur numar intreg: suma ceruta.",
    constraints: "1 <= n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice-patratica", "diagonala"],
    hints: "Aduna elementele a[i][j] pentru care i este strict mai mic decat j.",
    explanation: "Se parcurg toate elementele matricei si se aduna la suma cele aflate pe pozitii (i, j) cu i < j.\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}long long s=0;for(long long i=0;i<n;i++)for(long long j=0;j<n;j++)if(i<j)s+=a[i][j];cout<<s<<"\\n";`),
    py: `${READ_N_PY}print(sum(a[i][j] for i in range(n) for j in range(n) if i < j))\n`,
    tests: [
      "3\n1 2 3\n4 5 6\n7 8 9",
      "1\n5",
      "2\n1 2\n3 4",
      "3\n-1 2 3\n4 -5 6\n7 8 -9",
      "4\n1 0 0 0\n0 1 0 0\n0 0 1 0\n0 0 0 1",
      "5\n1 1 1 1 1\n1 2 1 1 1\n1 1 3 1 1\n1 1 1 4 1\n1 1 1 1 5",
      "2\n-2 5\n5 -2",
      "1\n0",
    ],
  },
  {
    slug: "suma-elementelor-sub-diagonala-principala",
    title: "Suma elementelor de sub diagonala principala",
    statement: "Se citeste o matrice patratica de dimensiune n. Determinati suma elementelor aflate strict sub diagonala principala (elementele a[i][j] cu i > j).",
    input_format: IN_FMT_N,
    output_format: "Afiseaza un singur numar intreg: suma ceruta.",
    constraints: "1 <= n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice-patratica", "diagonala"],
    hints: "Aduna elementele a[i][j] pentru care i este strict mai mare decat j.",
    explanation: "Se parcurg toate elementele matricei si se aduna la suma cele aflate pe pozitii (i, j) cu i > j.\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}long long s=0;for(long long i=0;i<n;i++)for(long long j=0;j<n;j++)if(i>j)s+=a[i][j];cout<<s<<"\\n";`),
    py: `${READ_N_PY}print(sum(a[i][j] for i in range(n) for j in range(n) if i > j))\n`,
    tests: [
      "3\n1 2 3\n4 5 6\n7 8 9",
      "1\n5",
      "2\n1 2\n3 4",
      "3\n-1 2 3\n4 -5 6\n7 8 -9",
      "4\n1 0 0 0\n0 1 0 0\n0 0 1 0\n0 0 0 1",
      "5\n1 1 1 1 1\n1 2 1 1 1\n1 1 3 1 1\n1 1 1 4 1\n1 1 1 1 5",
      "2\n-2 5\n5 -2",
      "1\n0",
    ],
  },
  {
    slug: "transpusa-unei-matrice-patratice",
    title: "Transpusa unei matrice patratice",
    statement: "Se citeste o matrice patratica de dimensiune n. Afisati transpusa acesteia, in care elementul de pe linia j si coloana i este egal cu elementul de pe linia i si coloana j din matricea initiala.",
    input_format: IN_FMT_N,
    output_format: "Afiseaza n linii, fiecare continand n numere separate prin spatiu: matricea transpusa.",
    constraints: "1 <= n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice-patratica"],
    hints: "Elementul de pe linia i si coloana j al transpusei este a[j][i] din matricea initiala.",
    explanation: "Se construieste si se afiseaza matricea in care elementul de pe pozitia (i, j) este a[j][i] din matricea originala.\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}for(long long i=0;i<n;i++){for(long long j=0;j<n;j++){cout<<a[j][i];if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_N_PY}for i in range(n):\n    print(" ".join(str(a[j][i]) for j in range(n)))\n`,
    tests: [
      "3\n1 2 3\n4 5 6\n7 8 9",
      "1\n5",
      "2\n1 2\n3 4",
      "3\n-1 2 3\n4 -5 6\n7 8 -9",
      "4\n1 0 0 0\n0 1 0 0\n0 0 1 0\n0 0 0 1",
      "2\n-2 5\n5 -2",
      "5\n1 2 3 4 5\n6 7 8 9 10\n11 12 13 14 15\n16 17 18 19 20\n21 22 23 24 25",
      "1\n0",
    ],
  },
  {
    slug: "rotirea-unei-matrice-cu-90-de-grade",
    title: "Rotirea unei matrice patratice cu 90 de grade",
    statement: "Se citeste o matrice patratica de dimensiune n. Afisati matricea obtinuta prin rotirea acesteia cu 90 de grade in sensul acelor de ceasornic.",
    input_format: IN_FMT_N,
    output_format: "Afiseaza n linii, fiecare continand n numere separate prin spatiu: matricea rotita.",
    constraints: "1 <= n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "medium",
    tags: ["matrice-patratica", "rotire"],
    hints: "La o rotire cu 90 de grade in sensul acelor de ceasornic, elementul de pe pozitia (i, j) din matricea rotita provine din pozitia (n-1-j, i) din matricea initiala.",
    explanation: "Se construieste matricea rotita folosind formula: elementul de pe pozitia (i, j) al matricei rotite este egal cu a[n-1-j][i] din matricea initiala. Aceasta formula se poate verifica usor pe un exemplu 2x2.\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}for(long long i=0;i<n;i++){for(long long j=0;j<n;j++){cout<<a[n-1-j][i];if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_N_PY}for i in range(n):\n    print(" ".join(str(a[n-1-j][i]) for j in range(n)))\n`,
    tests: [
      "2\n1 2\n3 4",
      "1\n5",
      "3\n1 2 3\n4 5 6\n7 8 9",
      "3\n-1 2 3\n4 -5 6\n7 8 -9",
      "4\n1 0 0 0\n0 1 0 0\n0 0 1 0\n0 0 0 1",
      "2\n-2 5\n5 -2",
      "5\n1 2 3 4 5\n6 7 8 9 10\n11 12 13 14 15\n16 17 18 19 20\n21 22 23 24 25",
      "1\n0",
    ],
  },
  {
    slug: "rotirea-unei-matrice-cu-180-de-grade",
    title: "Rotirea unei matrice patratice cu 180 de grade",
    statement: "Se citeste o matrice patratica de dimensiune n. Afisati matricea obtinuta prin rotirea acesteia cu 180 de grade.",
    input_format: IN_FMT_N,
    output_format: "Afiseaza n linii, fiecare continand n numere separate prin spatiu: matricea rotita.",
    constraints: "1 <= n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice-patratica", "rotire"],
    hints: "La o rotire cu 180 de grade, elementul de pe pozitia (i, j) din matricea rotita provine din pozitia (n-1-i, n-1-j) din matricea initiala.",
    explanation: "Se construieste matricea rotita folosind formula: elementul de pe pozitia (i, j) al matricei rotite este egal cu a[n-1-i][n-1-j] din matricea initiala, echivalent cu a inversa atat ordinea liniilor cat si ordinea coloanelor.\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}for(long long i=0;i<n;i++){for(long long j=0;j<n;j++){cout<<a[n-1-i][n-1-j];if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_N_PY}for i in range(n):\n    print(" ".join(str(a[n-1-i][n-1-j]) for j in range(n)))\n`,
    tests: [
      "2\n1 2\n3 4",
      "1\n5",
      "3\n1 2 3\n4 5 6\n7 8 9",
      "3\n-1 2 3\n4 -5 6\n7 8 -9",
      "4\n1 0 0 0\n0 1 0 0\n0 0 1 0\n0 0 0 1",
      "2\n-2 5\n5 -2",
      "5\n1 2 3 4 5\n6 7 8 9 10\n11 12 13 14 15\n16 17 18 19 20\n21 22 23 24 25",
      "1\n0",
    ],
  },
  {
    slug: "verifica-daca-o-matrice-este-identitate",
    title: "Verifica daca o matrice patratica este matricea identitate",
    statement: "Se citeste o matrice patratica de dimensiune n. Verificati daca matricea este matricea identitate, adica are 1 pe diagonala principala si 0 in rest.",
    input_format: IN_FMT_N,
    output_format: OUT_DA_NU,
    constraints: "1 <= n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice-patratica"],
    hints: "Verifica pentru fiecare pozitie (i, j) daca valoarea asteptata este 1 (cand i == j) sau 0 (cand i != j).",
    explanation: "Se parcurg toate elementele matricei si se compara fiecare cu valoarea asteptata: 1 daca i == j, respectiv 0 daca i != j.\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}bool ok=true;for(long long i=0;i<n;i++)for(long long j=0;j<n;j++){long long expected=(i==j)?1:0;if(a[i][j]!=expected)ok=false;}cout<<(ok?"DA":"NU")<<"\\n";`),
    py: `${READ_N_PY}ok = all(a[i][j] == (1 if i == j else 0) for i in range(n) for j in range(n))\nprint("DA" if ok else "NU")\n`,
    tests: [
      "3\n1 0 0\n0 1 0\n0 0 1",
      "3\n1 0 0\n0 2 0\n0 0 1",
      "1\n1",
      "1\n0",
      "2\n1 0\n0 1",
      "2\n1 1\n0 1",
      "4\n1 0 0 0\n0 1 0 0\n0 0 1 0\n0 0 0 1",
      "4\n1 0 0 0\n0 1 0 0\n0 0 1 0\n0 0 1 1",
    ],
  },
  {
    slug: "verifica-daca-o-matrice-este-patrat-magic",
    title: "Verifica daca o matrice patratica este patrat magic",
    statement: "Se citeste o matrice patratica de dimensiune n. In sensul acestei probleme, o matrice este patrat magic daca suma elementelor de pe fiecare linie, suma elementelor de pe fiecare coloana si suma elementelor de pe fiecare din cele doua diagonale sunt toate egale intre ele.",
    input_format: IN_FMT_N,
    output_format: OUT_DA_NU,
    constraints: "1 <= n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "hard",
    tags: ["matrice-patratica", "patrat-magic"],
    hints: "Calculeaza suma primei linii ca referinta, apoi verifica daca toate liniile, toate coloanele si cele doua diagonale au exact aceasta suma.",
    explanation: "Se calculeaza suma primei linii, folosita ca referinta. Se verifica apoi ca toate liniile, toate coloanele si cele doua diagonale au aceeasi suma ca referinta.\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}long long ref=0;for(long long j=0;j<n;j++)ref+=a[0][j];bool ok=true;for(long long i=0;i<n;i++){long long s=0;for(long long j=0;j<n;j++)s+=a[i][j];if(s!=ref)ok=false;}for(long long j=0;j<n;j++){long long s=0;for(long long i=0;i<n;i++)s+=a[i][j];if(s!=ref)ok=false;}long long d1=0,d2=0;for(long long i=0;i<n;i++){d1+=a[i][i];d2+=a[i][n-1-i];}if(d1!=ref||d2!=ref)ok=false;cout<<(ok?"DA":"NU")<<"\\n";`),
    py: `${READ_N_PY}ref = sum(a[0])\nok = True\nfor i in range(n):\n    if sum(a[i]) != ref:\n        ok = False\nfor j in range(n):\n    if sum(a[i][j] for i in range(n)) != ref:\n        ok = False\nd1 = sum(a[i][i] for i in range(n))\nd2 = sum(a[i][n-1-i] for i in range(n))\nif d1 != ref or d2 != ref:\n    ok = False\nprint("DA" if ok else "NU")\n`,
    tests: [
      "3\n2 7 6\n9 5 1\n4 3 8",
      "3\n1 2 3\n4 5 6\n7 8 9",
      "1\n5",
      "2\n1 2\n3 4",
      "4\n16 3 2 13\n5 10 11 8\n9 6 7 12\n4 15 14 1",
      "4\n16 3 2 13\n5 10 11 8\n9 6 7 12\n4 15 14 2",
      "2\n1 1\n1 1",
      "3\n5 5 5\n5 5 5\n5 5 5",
    ],
  },
  {
    slug: "numarul-de-elemente-pare-de-pe-diagonale",
    title: "Numarul de elemente pare de pe cele doua diagonale",
    statement: "Se citeste o matrice patratica de dimensiune n. Determinati cate elemente pare se afla pe cele doua diagonale (principala si secundara), fiecare pozitie fiind numarata o singura data, chiar daca se afla pe ambele diagonale.",
    input_format: IN_FMT_N,
    output_format: "Afiseaza un singur numar natural: numarul de elemente pare gasite.",
    constraints: "1 <= n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "medium",
    tags: ["matrice-patratica", "diagonala", "paritate"],
    hints: "Marcheaza intr-o matrice de marcaje care pozitii apartin celor doua diagonale, apoi numara elementele pare marcate, fara a numara de doua ori pozitia centrala la n impar.",
    explanation: "Se construieste o matrice de marcaje care indica pentru fiecare pozitie daca apartine uneia dintre cele doua diagonale, apoi se numara pozitiile marcate care contin valori pare; folosirea marcajelor evita numararea dubla a pozitiei centrale, la n impar.\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}vector<vector<bool>> onDiag(n, vector<bool>(n,false));for(long long i=0;i<n;i++){onDiag[i][i]=true;onDiag[i][n-1-i]=true;}long long cnt=0;for(long long i=0;i<n;i++)for(long long j=0;j<n;j++)if(onDiag[i][j]&&a[i][j]%2==0)cnt++;cout<<cnt<<"\\n";`),
    py: `${READ_N_PY}on_diag = [[False] * n for _ in range(n)]\nfor i in range(n):\n    on_diag[i][i] = True\n    on_diag[i][n-1-i] = True\ncnt = sum(1 for i in range(n) for j in range(n) if on_diag[i][j] and a[i][j] % 2 == 0)\nprint(cnt)\n`,
    tests: [
      "3\n1 2 3\n4 5 6\n7 8 9",
      "1\n5",
      "1\n4",
      "2\n2 0\n0 3",
      "3\n-1 2 3\n4 -5 6\n7 8 -9",
      "4\n1 0 0 0\n0 1 0 0\n0 0 1 0\n0 0 0 1",
      "5\n2 1 1 1 4\n1 2 1 6 1\n1 1 5 1 1\n1 8 1 2 1\n4 1 1 1 2",
      "1\n0",
    ],
  },
  {
    slug: "elementele-diagonalei-principale-in-ordine-inversa",
    title: "Elementele diagonalei principale in ordine inversa",
    statement: "Se citeste o matrice patratica de dimensiune n. Afisati elementele de pe diagonala principala, incepand de la ultimul (a[n-1][n-1]) pana la primul (a[0][0]).",
    input_format: IN_FMT_N,
    output_format: "Afiseaza pe o singura linie elementele diagonalei principale, in ordine inversa, separate prin spatiu.",
    constraints: "1 <= n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice-patratica", "diagonala"],
    hints: "Parcurge indicii de la n-1 la 0 si afiseaza elementul a[i][i] la fiecare pas.",
    explanation: "Se parcurg indicii i de la n-1 pana la 0, afisand la fiecare pas elementul a[i][i].\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_N_CPP}for(long long i=n-1;i>=0;i--){cout<<a[i][i];if(i>0)cout<<" ";}cout<<"\\n";`),
    py: `${READ_N_PY}print(" ".join(str(a[i][i]) for i in range(n-1, -1, -1)))\n`,
    tests: [
      "3\n1 2 3\n4 5 6\n7 8 9",
      "1\n5",
      "2\n1 2\n3 4",
      "3\n-1 2 3\n4 -5 6\n7 8 -9",
      "4\n1 0 0 0\n0 2 0 0\n0 0 3 0\n0 0 0 4",
      "2\n-2 5\n5 -2",
      "5\n1 2 3 4 5\n6 7 8 9 10\n11 12 13 14 15\n16 17 18 19 20\n21 22 23 24 25",
      "1\n0",
    ],
  },
  {
    slug: "verifica-daca-o-matrice-este-simetrica-fata-de-diagonala-secundara",
    title: "Verifica daca o matrice este simetrica fata de diagonala secundara",
    statement: "Se citeste o matrice patratica de dimensiune n. Verificati daca matricea este simetrica fata de diagonala secundara, adica a[i][j] este egal cu a[n-1-j][n-1-i], pentru orice i si j.",
    input_format: IN_FMT_N,
    output_format: OUT_DA_NU,
    constraints: "1 <= n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "medium",
    tags: ["matrice-patratica", "simetrie", "diagonala"],
    hints: "Compara fiecare element a[i][j] cu elementul situat simetric fata de diagonala secundara, a[n-1-j][n-1-i].",
    explanation: "Se parcurg toate perechile (i, j) si se verifica daca a[i][j] este egal cu a[n-1-j][n-1-i], pozitia simetrica fata de diagonala secundara.\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}bool ok=true;for(long long i=0;i<n;i++)for(long long j=0;j<n;j++)if(a[i][j]!=a[n-1-j][n-1-i])ok=false;cout<<(ok?"DA":"NU")<<"\\n";`),
    py: `${READ_N_PY}ok = all(a[i][j] == a[n-1-j][n-1-i] for i in range(n) for j in range(n))\nprint("DA" if ok else "NU")\n`,
    tests: [
      "3\n1 2 3\n4 5 6\n7 8 1",
      "3\n1 2 3\n4 5 6\n7 8 9",
      "1\n5",
      "2\n1 2\n3 1",
      "2\n1 2\n3 4",
      "4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 1",
      "4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16",
      "1\n0",
    ],
  },
  {
    slug: "verifica-daca-suma-fiecarei-linii-este-egala-cu-suma-fiecarei-coloane",
    title: "Verifica daca suma fiecarei linii este egala cu suma coloanei de acelasi indice",
    statement: "Se citeste o matrice patratica de dimensiune n. Verificati daca, pentru fiecare i, suma elementelor de pe linia i este egala cu suma elementelor de pe coloana i.",
    input_format: IN_FMT_N,
    output_format: OUT_DA_NU,
    constraints: "1 <= n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "medium",
    tags: ["matrice-patratica", "sume"],
    hints: "Calculeaza pentru fiecare i suma liniei i si suma coloanei i, apoi compara-le.",
    explanation: "Se calculeaza suma fiecarei linii si suma fiecarei coloane, apoi se verifica daca, pentru fiecare indice i, cele doua sume corespunzatoare (linia i si coloana i) sunt egale.\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}bool ok=true;for(long long i=0;i<n;i++){long long rs=0,cs=0;for(long long j=0;j<n;j++){rs+=a[i][j];cs+=a[j][i];}if(rs!=cs)ok=false;}cout<<(ok?"DA":"NU")<<"\\n";`),
    py: `${READ_N_PY}ok = True\nfor i in range(n):\n    rs = sum(a[i][j] for j in range(n))\n    cs = sum(a[j][i] for j in range(n))\n    if rs != cs:\n        ok = False\nprint("DA" if ok else "NU")\n`,
    tests: [
      "3\n1 2 3\n2 5 6\n3 6 9",
      "3\n1 2 3\n4 5 6\n7 8 9",
      "1\n5",
      "2\n1 2\n2 1",
      "2\n1 2\n3 4",
      "4\n1 2 3 4\n2 5 6 7\n3 6 8 9\n4 7 9 10",
      "4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16",
      "1\n0",
    ],
  },
  {
    slug: "numarul-de-linii-palindrom",
    title: "Numarul de linii palindrom dintr-o matrice patratica",
    statement: "Se citeste o matrice patratica de dimensiune n. O linie este palindrom daca se citeste la fel de la stanga la dreapta si de la dreapta la stanga. Determinati cate linii palindrom are matricea.",
    input_format: IN_FMT_N,
    output_format: "Afiseaza un singur numar natural: numarul de linii palindrom.",
    constraints: "1 <= n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "medium",
    tags: ["matrice-patratica", "palindrom"],
    hints: "Pentru fiecare linie, compara elementul de pe pozitia j cu cel de pe pozitia n-1-j, pentru toate pozitiile din prima jumatate a liniei.",
    explanation: "Pentru fiecare linie a matricei se verifica daca este palindrom, comparand elementele simetrice fata de mijlocul liniei; se numara cate linii indeplinesc aceasta conditie.\n\n**Complexitate:** O(n^2)",
    cpp: C(`${READ_N_CPP}long long cnt=0;for(long long i=0;i<n;i++){bool ok=true;for(long long j=0;j<n/2;j++)if(a[i][j]!=a[i][n-1-j])ok=false;if(ok)cnt++;}cout<<cnt<<"\\n";`),
    py: `${READ_N_PY}cnt = 0\nfor i in range(n):\n    row = a[i]\n    if row == row[::-1]:\n        cnt += 1\nprint(cnt)\n`,
    tests: [
      "3\n1 2 1\n4 5 6\n7 8 7",
      "3\n1 2 3\n4 5 6\n7 8 9",
      "1\n5",
      "2\n1 1\n1 2",
      "4\n1 2 2 1\n1 2 3 4\n5 5 5 5\n3 1 1 3",
      "2\n-2 5\n5 -2",
      "5\n1 2 3 2 1\n1 2 3 4 5\n7 7 7 7 7\n2 4 6 4 2\n1 0 0 0 1",
      "1\n0",
    ],
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
