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

const CHAPTER = { level: "grade9", chapter: "tablouri-bi", sub: "parcurgere-matrici-oarecare" };

const CPP_HEAD = `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n`;
function C(body) {
  return `${CPP_HEAD}int main(){${body}return 0;}\n`;
}

const IN_FMT_MN = "Pe prima linie se afla doua numere naturale m si n (numarul de linii, respectiv de coloane). Urmeaza m linii, fiecare continand n numere intregi, separate prin spatiu.";
const READ_MN_CPP = `long long m,n;cin>>m>>n;vector<vector<long long>> a(m, vector<long long>(n));for(long long i=0;i<m;i++)for(long long j=0;j<n;j++)cin>>a[i][j];`;
const READ_MN_PY = `m, n = map(int, input().split())\na = [list(map(int, input().split())) for _ in range(m)]\n`;

const problems = [
  {
    slug: "suma-elementelor-unei-matrice",
    title: "Suma elementelor unei matrice",
    statement: "Se citeste o matrice cu m linii si n coloane, cu elemente numere intregi. Determinati suma tuturor elementelor matricei.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza un singur numar intreg: suma ceruta.",
    constraints: "1 <= m, n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice", "parcurgere-matrici-oarecare"],
    hints: "Parcurge toate elementele matricei cu doua bucle imbricate si aduna-le.",
    explanation: "Se parcurg toate elementele matricei folosind doua bucle imbricate, adunandu-le intr-o variabila acumulator.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}long long s=0;for(long long i=0;i<m;i++)for(long long j=0;j<n;j++)s+=a[i][j];cout<<s<<"\\n";`),
    py: `${READ_MN_PY}print(sum(sum(row) for row in a))\n`,
    tests: [
      "2 3\n1 2 3\n4 5 6",
      "1 1\n5",
      "3 3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9",
      "1 5\n1 2 3 4 5",
      "5 1\n1\n2\n3\n4\n5",
      "3 4\n0 0 0 0\n0 0 0 0\n0 0 0 0",
      "2 2\n1000 1000\n1000 1000",
      "4 4\n1 -1 2 -2\n3 -3 4 -4\n5 -5 6 -6\n7 -7 8 -8",
    ],
  },
  {
    slug: "suma-pe-fiecare-linie",
    title: "Suma elementelor de pe fiecare linie",
    statement: "Se citeste o matrice cu m linii si n coloane. Determinati, pentru fiecare linie, suma elementelor sale.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza pe o singura linie m numere separate prin spatiu: suma elementelor liniei 1, liniei 2, ..., liniei m.",
    constraints: "1 <= m, n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice", "parcurgere-matrici-oarecare"],
    hints: "Pentru fiecare linie, parcurge coloanele si aduna elementele intr-un contor propriu acelei linii.",
    explanation: "Pentru fiecare linie i se parcurg toate coloanele si se insumeaza elementele; sumele se afiseaza in ordine, separate prin spatiu.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}for(long long i=0;i<m;i++){long long s=0;for(long long j=0;j<n;j++)s+=a[i][j];cout<<s;if(i+1<m)cout<<" ";}cout<<"\\n";`),
    py: `${READ_MN_PY}print(" ".join(str(sum(row)) for row in a))\n`,
    tests: [
      "2 3\n1 2 3\n4 5 6",
      "1 1\n5",
      "3 3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9",
      "1 5\n1 2 3 4 5",
      "5 1\n1\n2\n3\n4\n5",
      "3 4\n0 0 0 0\n1 1 1 1\n2 2 2 2",
      "2 2\n1000 -1000\n-1000 1000",
      "4 4\n1 -1 2 -2\n3 -3 4 -4\n5 -5 6 -6\n7 -7 8 -8",
    ],
  },
  {
    slug: "suma-pe-fiecare-coloana",
    title: "Suma elementelor de pe fiecare coloana",
    statement: "Se citeste o matrice cu m linii si n coloane. Determinati, pentru fiecare coloana, suma elementelor sale.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza pe o singura linie n numere separate prin spatiu: suma elementelor coloanei 1, coloanei 2, ..., coloanei n.",
    constraints: "1 <= m, n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice", "parcurgere-matrici-oarecare"],
    hints: "Pentru fiecare coloana, parcurge liniile si aduna elementele intr-un contor propriu acelei coloane.",
    explanation: "Pentru fiecare coloana j se parcurg toate liniile si se insumeaza elementele; sumele se afiseaza in ordine, separate prin spatiu.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}for(long long j=0;j<n;j++){long long s=0;for(long long i=0;i<m;i++)s+=a[i][j];cout<<s;if(j+1<n)cout<<" ";}cout<<"\\n";`),
    py: `${READ_MN_PY}sums = [sum(a[i][j] for i in range(m)) for j in range(n)]\nprint(" ".join(str(x) for x in sums))\n`,
    tests: [
      "2 3\n1 2 3\n4 5 6",
      "1 1\n5",
      "3 3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9",
      "1 5\n1 2 3 4 5",
      "5 1\n1\n2\n3\n4\n5",
      "3 4\n0 1 2 3\n0 1 2 3\n0 1 2 3",
      "2 2\n1000 -1000\n-1000 1000",
      "4 4\n1 -1 2 -2\n3 -3 4 -4\n5 -5 6 -6\n7 -7 8 -8",
    ],
  },
  {
    slug: "elementul-maxim-dintr-o-matrice",
    title: "Elementul maxim dintr-o matrice",
    statement: "Se citeste o matrice cu m linii si n coloane, indexata de la 1. Determinati valoarea maxima din matrice si pozitia (linie, coloana) primei sale aparitii, parcurgand matricea linie cu linie, de la stanga la dreapta.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza pe o singura linie trei numere separate prin spatiu: valoarea maxima, linia si coloana (1-indexate) primei sale aparitii.",
    constraints: "1 <= m, n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice", "parcurgere-matrici-oarecare"],
    hints: "Parcurge matricea linie cu linie; retine valoarea maxima si pozitia ei, actualizand doar cand gasesti o valoare strict mai mare.",
    explanation: "Se parcurge matricea linie cu linie, retinand valoarea maxima intalnita si pozitia (linie, coloana) la care a aparut prima data; actualizarea se face doar la o valoare strict mai mare, pentru a pastra prima aparitie in caz de egalitate.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}long long best=a[0][0],bi=0,bj=0;for(long long i=0;i<m;i++)for(long long j=0;j<n;j++){if(a[i][j]>best){best=a[i][j];bi=i;bj=j;}}cout<<best<<" "<<(bi+1)<<" "<<(bj+1)<<"\\n";`),
    py: `${READ_MN_PY}best = a[0][0]\nbi, bj = 0, 0\nfor i in range(m):\n    for j in range(n):\n        if a[i][j] > best:\n            best = a[i][j]\n            bi, bj = i, j\nprint(f"{best} {bi+1} {bj+1}")\n`,
    tests: [
      "2 3\n1 2 3\n4 5 6",
      "1 1\n5",
      "3 3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9",
      "1 5\n1 2 3 4 5",
      "5 1\n1\n2\n3\n4\n5",
      "2 2\n5 5\n5 5",
      "3 3\n1 9 2\n9 3 9\n4 5 6",
      "2 4\n1000 -1000 999 1000\n-1 -1 -1 -1",
    ],
  },
  {
    slug: "elementul-minim-dintr-o-matrice",
    title: "Elementul minim dintr-o matrice",
    statement: "Se citeste o matrice cu m linii si n coloane, indexata de la 1. Determinati valoarea minima din matrice si pozitia (linie, coloana) primei sale aparitii, parcurgand matricea linie cu linie, de la stanga la dreapta.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza pe o singura linie trei numere separate prin spatiu: valoarea minima, linia si coloana (1-indexate) primei sale aparitii.",
    constraints: "1 <= m, n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice", "parcurgere-matrici-oarecare"],
    hints: "Parcurge matricea linie cu linie; retine valoarea minima si pozitia ei, actualizand doar cand gasesti o valoare strict mai mica.",
    explanation: "Se parcurge matricea linie cu linie, retinand valoarea minima intalnita si pozitia (linie, coloana) la care a aparut prima data; actualizarea se face doar la o valoare strict mai mica, pentru a pastra prima aparitie in caz de egalitate.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}long long best=a[0][0],bi=0,bj=0;for(long long i=0;i<m;i++)for(long long j=0;j<n;j++){if(a[i][j]<best){best=a[i][j];bi=i;bj=j;}}cout<<best<<" "<<(bi+1)<<" "<<(bj+1)<<"\\n";`),
    py: `${READ_MN_PY}best = a[0][0]\nbi, bj = 0, 0\nfor i in range(m):\n    for j in range(n):\n        if a[i][j] < best:\n            best = a[i][j]\n            bi, bj = i, j\nprint(f"{best} {bi+1} {bj+1}")\n`,
    tests: [
      "2 3\n1 2 3\n4 5 6",
      "1 1\n5",
      "3 3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9",
      "1 5\n1 2 3 4 5",
      "5 1\n1\n2\n3\n4\n5",
      "2 2\n5 5\n5 5",
      "3 3\n1 -9 2\n-9 3 -9\n4 5 6",
      "2 4\n1000 -1000 999 1000\n-1 -1 -1 -1",
    ],
  },
  {
    slug: "suma-elementelor-pare-dintr-o-matrice",
    title: "Suma elementelor pare dintr-o matrice",
    statement: "Se citeste o matrice cu m linii si n coloane. Determinati suma elementelor pare din matrice.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza un singur numar intreg: suma ceruta.",
    constraints: "1 <= m, n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice", "parcurgere-matrici-oarecare", "paritate"],
    hints: "Parcurge toate elementele matricei si aduna la suma doar pe cele care au restul 0 la impartirea cu 2.",
    explanation: "Se parcurg toate elementele matricei; cele cu restul 0 la impartirea cu 2 se aduna la suma acumulator.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}long long s=0;for(long long i=0;i<m;i++)for(long long j=0;j<n;j++)if(a[i][j]%2==0)s+=a[i][j];cout<<s<<"\\n";`),
    py: `${READ_MN_PY}print(sum(x for row in a for x in row if x % 2 == 0))\n`,
    tests: [
      "2 3\n1 2 3\n4 5 6",
      "1 1\n5",
      "1 1\n4",
      "3 3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9",
      "1 5\n1 2 3 4 5",
      "5 1\n1\n2\n3\n4\n5",
      "2 2\n1000 1000\n1000 1000",
      "4 4\n1 -1 2 -2\n3 -3 4 -4\n5 -5 6 -6\n7 -7 8 -8",
    ],
  },
  {
    slug: "suma-elementelor-impare-dintr-o-matrice",
    title: "Suma elementelor impare dintr-o matrice",
    statement: "Se citeste o matrice cu m linii si n coloane. Determinati suma elementelor impare din matrice.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza un singur numar intreg: suma ceruta.",
    constraints: "1 <= m, n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice", "parcurgere-matrici-oarecare", "paritate"],
    hints: "Parcurge toate elementele matricei si aduna la suma doar pe cele care au restul nenul la impartirea cu 2.",
    explanation: "Se parcurg toate elementele matricei; cele cu restul nenul la impartirea cu 2 se aduna la suma acumulator.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}long long s=0;for(long long i=0;i<m;i++)for(long long j=0;j<n;j++)if(a[i][j]%2!=0)s+=a[i][j];cout<<s<<"\\n";`),
    py: `${READ_MN_PY}print(sum(x for row in a for x in row if x % 2 != 0))\n`,
    tests: [
      "2 3\n1 2 3\n4 5 6",
      "1 1\n5",
      "1 1\n4",
      "3 3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9",
      "1 5\n1 2 3 4 5",
      "5 1\n1\n2\n3\n4\n5",
      "2 2\n1000 1000\n1000 1000",
      "4 4\n1 -1 2 -2\n3 -3 4 -4\n5 -5 6 -6\n7 -7 8 -8",
    ],
  },
  {
    slug: "numarul-de-elemente-negative-dintr-o-matrice",
    title: "Numarul de elemente negative dintr-o matrice",
    statement: "Se citeste o matrice cu m linii si n coloane. Determinati cate elemente strict negative contine matricea.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza un singur numar natural: numarul de elemente negative.",
    constraints: "1 <= m, n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice", "parcurgere-matrici-oarecare", "semn"],
    hints: "Parcurge toate elementele matricei si numara-le pe cele strict mai mici decat 0.",
    explanation: "Se parcurg toate elementele matricei, numarand cate dintre ele sunt strict negative.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}long long cnt=0;for(long long i=0;i<m;i++)for(long long j=0;j<n;j++)if(a[i][j]<0)cnt++;cout<<cnt<<"\\n";`),
    py: `${READ_MN_PY}print(sum(1 for row in a for x in row if x < 0))\n`,
    tests: [
      "2 3\n1 -2 3\n-4 5 -6",
      "1 1\n5",
      "1 1\n-4",
      "3 3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9",
      "1 5\n1 2 3 4 5",
      "5 1\n1\n-2\n3\n-4\n5",
      "2 2\n0 0\n0 0",
      "4 4\n1 -1 2 -2\n3 -3 4 -4\n5 -5 6 -6\n7 -7 8 -8",
    ],
  },
  {
    slug: "linia-cu-suma-maxima",
    title: "Linia cu suma maxima",
    statement: "Se citeste o matrice cu m linii si n coloane, indexata de la 1. Determinati indicele liniei ale carei elemente au suma maxima. Daca exista mai multe astfel de linii, afisati indicele primei dintre ele.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza un singur numar natural: indicele (1-indexat) liniei cerute.",
    constraints: "1 <= m, n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "medium",
    tags: ["matrice", "parcurgere-matrici-oarecare"],
    hints: "Calculeaza suma fiecarei linii, apoi parcurge sumele in ordine si retine indicele liniei cu suma maxima, actualizand doar la o suma strict mai mare.",
    explanation: "Se calculeaza suma fiecarei linii, apoi se parcurg aceste sume in ordine, retinand indicele liniei cu suma maxima; actualizarea se face doar la o suma strict mai mare, pentru a pastra prima linie in caz de egalitate.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}vector<long long> rs(m,0);for(long long i=0;i<m;i++)for(long long j=0;j<n;j++)rs[i]+=a[i][j];long long best=rs[0],bi=0;for(long long i=1;i<m;i++)if(rs[i]>best){best=rs[i];bi=i;}cout<<(bi+1)<<"\\n";`),
    py: `${READ_MN_PY}rs = [sum(row) for row in a]\nbest = rs[0]\nbi = 0\nfor i in range(1, m):\n    if rs[i] > best:\n        best = rs[i]\n        bi = i\nprint(bi + 1)\n`,
    tests: [
      "3 3\n1 1 1\n5 5 5\n2 2 2",
      "1 1\n5",
      "3 3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9",
      "1 5\n1 2 3 4 5",
      "5 1\n1\n2\n9\n4\n5",
      "3 2\n5 5\n5 5\n1 1",
      "2 2\n1000 1000\n-1000 -1000",
      "4 4\n1 -1 2 -2\n3 -3 4 -4\n5 -5 6 -6\n7 -7 8 -8",
    ],
  },
  {
    slug: "coloana-cu-suma-maxima",
    title: "Coloana cu suma maxima",
    statement: "Se citeste o matrice cu m linii si n coloane, indexata de la 1. Determinati indicele coloanei ale carei elemente au suma maxima. Daca exista mai multe astfel de coloane, afisati indicele primei dintre ele.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza un singur numar natural: indicele (1-indexat) coloanei cerute.",
    constraints: "1 <= m, n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "medium",
    tags: ["matrice", "parcurgere-matrici-oarecare"],
    hints: "Calculeaza suma fiecarei coloane, apoi parcurge sumele in ordine si retine indicele coloanei cu suma maxima, actualizand doar la o suma strict mai mare.",
    explanation: "Se calculeaza suma fiecarei coloane, apoi se parcurg aceste sume in ordine, retinand indicele coloanei cu suma maxima; actualizarea se face doar la o suma strict mai mare, pentru a pastra prima coloana in caz de egalitate.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}vector<long long> cs(n,0);for(long long j=0;j<n;j++)for(long long i=0;i<m;i++)cs[j]+=a[i][j];long long best=cs[0],bj=0;for(long long j=1;j<n;j++)if(cs[j]>best){best=cs[j];bj=j;}cout<<(bj+1)<<"\\n";`),
    py: `${READ_MN_PY}cs = [sum(a[i][j] for i in range(m)) for j in range(n)]\nbest = cs[0]\nbj = 0\nfor j in range(1, n):\n    if cs[j] > best:\n        best = cs[j]\n        bj = j\nprint(bj + 1)\n`,
    tests: [
      "3 3\n1 5 2\n1 5 2\n1 5 2",
      "1 1\n5",
      "3 3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9",
      "1 5\n1 2 9 4 5",
      "5 1\n1\n2\n9\n4\n5",
      "2 3\n5 5 1\n5 5 1",
      "2 2\n1000 -1000\n1000 -1000",
      "4 4\n1 -1 2 -2\n3 -3 4 -4\n5 -5 6 -6\n7 -7 8 -8",
    ],
  },
  {
    slug: "transpusa-unei-matrice",
    title: "Transpusa unei matrice",
    statement: "Se citeste o matrice cu m linii si n coloane. Afisati transpusa acesteia: o matrice cu n linii si m coloane, in care elementul de pe linia j si coloana i este egal cu elementul de pe linia i si coloana j din matricea initiala.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza n linii, fiecare continand m numere separate prin spatiu: matricea transpusa.",
    constraints: "1 <= m, n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice", "parcurgere-matrici-oarecare"],
    hints: "Pentru fiecare coloana j a matricei initiale, afiseaz-o ca o linie in matricea transpusa.",
    explanation: "Se parcurg coloanele matricei initiale, iar fiecare coloana este afisata ca o linie a matricei transpuse.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}for(long long j=0;j<n;j++){for(long long i=0;i<m;i++){cout<<a[i][j];if(i+1<m)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_MN_PY}for j in range(n):\n    print(" ".join(str(a[i][j]) for i in range(m)))\n`,
    tests: [
      "2 3\n1 2 3\n4 5 6",
      "1 1\n5",
      "3 3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9",
      "1 5\n1 2 3 4 5",
      "5 1\n1\n2\n3\n4\n5",
      "3 2\n1 2\n3 4\n5 6",
      "2 2\n1000 -1000\n-1000 1000",
      "4 3\n1 -1 2\n-2 3 -3\n4 -4 5\n-5 6 -6",
    ],
  },
  {
    slug: "afisarea-conturului-unei-matrice",
    title: "Afisarea conturului unei matrice",
    statement: "Se citeste o matrice cu m linii si n coloane. Afisati elementele aflate pe conturul (marginea) matricei, in ordinea: linia de sus de la stanga la dreapta, coloana din dreapta de sus in jos, linia de jos de la dreapta la stanga, coloana din stanga de jos in sus (fara a repeta niciun element).",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza pe o singura linie elementele conturului, in ordinea specificata, separate prin spatiu.",
    constraints: "1 <= m, n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "medium",
    tags: ["matrice", "parcurgere-matrici-oarecare"],
    hints: "Parcurge pe rand cele patru laturi ale conturului, avand grija sa nu repeti coltul de final al unei laturi la inceputul urmatoarei.",
    explanation: "Se parcurg, in ordine, cele patru laturi ale conturului: linia de sus completa, apoi coloana din dreapta (fara coltul deja afisat), apoi linia de jos de la dreapta la stanga (fara coltul din dreapta, doar daca exista mai mult de o linie), apoi coloana din stanga de jos in sus (fara colturile deja afisate, doar daca exista mai mult de o coloana).\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}vector<long long> res;for(long long j=0;j<n;j++)res.push_back(a[0][j]);for(long long i=1;i<m;i++)res.push_back(a[i][n-1]);if(m>1){for(long long j=n-2;j>=0;j--)res.push_back(a[m-1][j]);}if(n>1){for(long long i=m-2;i>=1;i--)res.push_back(a[i][0]);}for(size_t k=0;k<res.size();k++){cout<<res[k];if(k+1<res.size())cout<<" ";}cout<<"\\n";`),
    py: `${READ_MN_PY}res = []\nfor j in range(n):\n    res.append(a[0][j])\nfor i in range(1, m):\n    res.append(a[i][n-1])\nif m > 1:\n    for j in range(n-2, -1, -1):\n        res.append(a[m-1][j])\nif n > 1:\n    for i in range(m-2, 0, -1):\n        res.append(a[i][0])\nprint(" ".join(str(x) for x in res))\n`,
    tests: [
      "3 3\n1 2 3\n4 5 6\n7 8 9",
      "1 1\n5",
      "1 5\n1 2 3 4 5",
      "5 1\n1\n2\n3\n4\n5",
      "2 2\n1 2\n3 4",
      "4 5\n1 2 3 4 5\n6 7 8 9 10\n11 12 13 14 15\n16 17 18 19 20",
      "2 4\n1 2 3 4\n5 6 7 8",
      "5 2\n1 2\n3 4\n5 6\n7 8\n9 10",
    ],
  },
  {
    slug: "suma-elementelor-de-pe-contur",
    title: "Suma elementelor de pe conturul unei matrice",
    statement: "Se citeste o matrice cu m linii si n coloane. Determinati suma elementelor aflate pe conturul (marginea) matricei, fara a numara de doua ori niciun element.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza un singur numar intreg: suma ceruta.",
    constraints: "1 <= m, n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "medium",
    tags: ["matrice", "parcurgere-matrici-oarecare"],
    hints: "Un element face parte din contur daca se afla pe prima sau ultima linie, sau pe prima sau ultima coloana.",
    explanation: "Se parcurg toate elementele matricei si se aduna la suma doar cele aflate pe prima/ultima linie sau prima/ultima coloana (fiecare element este verificat o singura data, deci nu exista riscul de a-l numara de doua ori).\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}long long s=0;for(long long i=0;i<m;i++)for(long long j=0;j<n;j++){if(i==0||i==m-1||j==0||j==n-1)s+=a[i][j];}cout<<s<<"\\n";`),
    py: `${READ_MN_PY}s = 0\nfor i in range(m):\n    for j in range(n):\n        if i == 0 or i == m-1 or j == 0 or j == n-1:\n            s += a[i][j]\nprint(s)\n`,
    tests: [
      "3 3\n1 2 3\n4 5 6\n7 8 9",
      "1 1\n5",
      "1 5\n1 2 3 4 5",
      "5 1\n1\n2\n3\n4\n5",
      "2 2\n1 2\n3 4",
      "4 5\n1 2 3 4 5\n6 7 8 9 10\n11 12 13 14 15\n16 17 18 19 20",
      "2 4\n1 2 3 4\n5 6 7 8",
      "5 2\n1 2\n3 4\n5 6\n7 8\n9 10",
    ],
  },
  {
    slug: "inversarea-elementelor-de-pe-fiecare-linie",
    title: "Inversarea elementelor de pe fiecare linie",
    statement: "Se citeste o matrice cu m linii si n coloane. Afisati matricea obtinuta prin inversarea ordinii elementelor de pe fiecare linie.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza m linii, fiecare continand n numere separate prin spatiu: matricea cu liniile inversate.",
    constraints: "1 <= m, n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice", "parcurgere-matrici-oarecare"],
    hints: "Pentru fiecare linie, afiseaza elementele in ordine inversa, de la ultima coloana la prima.",
    explanation: "Pentru fiecare linie se parcurg elementele de la ultima coloana la prima si se afiseaza in aceasta ordine.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}for(long long i=0;i<m;i++){for(long long j=n-1;j>=0;j--){cout<<a[i][j];if(j>0)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_MN_PY}for row in a:\n    print(" ".join(str(x) for x in reversed(row)))\n`,
    tests: [
      "2 3\n1 2 3\n4 5 6",
      "1 1\n5",
      "3 3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9",
      "1 5\n1 2 3 4 5",
      "5 1\n1\n2\n3\n4\n5",
      "3 2\n1 2\n3 4\n5 6",
      "2 2\n1000 -1000\n-1000 1000",
      "4 4\n1 -1 2 -2\n3 -3 4 -4\n5 -5 6 -6\n7 -7 8 -8",
    ],
  },
  {
    slug: "inversarea-ordinii-liniilor",
    title: "Inversarea ordinii liniilor unei matrice",
    statement: "Se citeste o matrice cu m linii si n coloane. Afisati matricea obtinuta prin inversarea ordinii liniilor: ultima linie devine prima, penultima devine a doua, si asa mai departe.",
    input_format: IN_FMT_MN,
    output_format: "Afiseaza m linii, fiecare continand n numere separate prin spatiu: matricea cu ordinea liniilor inversata.",
    constraints: "1 <= m, n <= 50, -1000 <= a[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice", "parcurgere-matrici-oarecare"],
    hints: "Afiseaza liniile matricei incepand de la ultima si terminand cu prima.",
    explanation: "Se parcurg liniile matricei in ordine inversa (de la ultima la prima) si se afiseaza fiecare linie asa cum este, neschimbata.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}for(long long i=m-1;i>=0;i--){for(long long j=0;j<n;j++){cout<<a[i][j];if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_MN_PY}for row in reversed(a):\n    print(" ".join(str(x) for x in row))\n`,
    tests: [
      "2 3\n1 2 3\n4 5 6",
      "1 1\n5",
      "3 3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9",
      "1 5\n1 2 3 4 5",
      "5 1\n1\n2\n3\n4\n5",
      "3 2\n1 2\n3 4\n5 6",
      "2 2\n1000 -1000\n-1000 1000",
      "4 4\n1 -1 2 -2\n3 -3 4 -4\n5 -5 6 -6\n7 -7 8 -8",
    ],
  },
  {
    slug: "verifica-daca-o-valoare-exista-in-matrice",
    title: "Verifica daca o valoare exista intr-o matrice",
    statement: "Se citesc o matrice cu m linii si n coloane si un numar intreg x. Verificati daca valoarea x apare cel putin o data in matrice.",
    input_format: "Pe prima linie se afla doua numere naturale m si n. Urmeaza m linii, fiecare continand n numere intregi, separate prin spatiu. Pe ultima linie se afla numarul intreg x.",
    output_format: "Afiseaza DA daca valoarea x apare in matrice, respectiv NU in caz contrar.",
    constraints: "1 <= m, n <= 50, -1000 <= a[i][j] <= 1000, -1000 <= x <= 1000",
    difficulty: "easy",
    tags: ["matrice", "parcurgere-matrici-oarecare"],
    hints: "Parcurge toate elementele matricei si verifica daca vreunul este egal cu x.",
    explanation: "Se parcurg toate elementele matricei, verificand daca vreunul este egal cu x.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}long long x;cin>>x;bool ok=false;for(long long i=0;i<m;i++)for(long long j=0;j<n;j++)if(a[i][j]==x)ok=true;cout<<(ok?"DA":"NU")<<"\\n";`),
    py: `${READ_MN_PY}x = int(input())\nok = any(x == v for row in a for v in row)\nprint("DA" if ok else "NU")\n`,
    tests: [
      "2 3\n1 2 3\n4 5 6\n5",
      "2 3\n1 2 3\n4 5 6\n10",
      "1 1\n5\n5",
      "1 1\n5\n6",
      "3 3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9\n-5",
      "1 5\n1 2 3 4 5\n1",
      "5 1\n1\n2\n3\n4\n5\n5",
      "2 2\n1000 -1000\n-1000 1000\n1000",
    ],
  },
  {
    slug: "inmultirea-matricei-cu-un-scalar",
    title: "Inmultirea unei matrice cu un scalar",
    statement: "Se citesc o matrice cu m linii si n coloane si un numar intreg k. Afisati matricea obtinuta prin inmultirea fiecarui element cu k.",
    input_format: "Pe prima linie se afla doua numere naturale m si n. Urmeaza m linii, fiecare continand n numere intregi, separate prin spatiu. Pe ultima linie se afla numarul intreg k.",
    output_format: "Afiseaza m linii, fiecare continand n numere separate prin spatiu: matricea rezultata.",
    constraints: "1 <= m, n <= 50, -1000 <= a[i][j] <= 1000, -100 <= k <= 100",
    difficulty: "easy",
    tags: ["matrice", "parcurgere-matrici-oarecare"],
    hints: "Parcurge toate elementele matricei si inmulteste-le pe fiecare cu k inainte de a le afisa.",
    explanation: "Se parcurg toate elementele matricei, iar fiecare element este inmultit cu k inainte de afisare.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}long long k;cin>>k;for(long long i=0;i<m;i++){for(long long j=0;j<n;j++){cout<<(a[i][j]*k);if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_MN_PY}k = int(input())\nfor row in a:\n    print(" ".join(str(x * k) for x in row))\n`,
    tests: [
      "2 3\n1 2 3\n4 5 6\n2",
      "1 1\n5\n0",
      "3 3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9\n-1",
      "1 5\n1 2 3 4 5\n10",
      "5 1\n1\n2\n3\n4\n5\n1",
      "3 2\n1 2\n3 4\n5 6\n3",
      "2 2\n1000 -1000\n-1000 1000\n1",
      "4 4\n1 -1 2 -2\n3 -3 4 -4\n5 -5 6 -6\n7 -7 8 -8\n5",
    ],
  },
  {
    slug: "suma-a-doua-matrici",
    title: "Suma a doua matrici",
    statement: "Se citesc doua matrici, fiecare cu m linii si n coloane. Afisati matricea obtinuta prin adunarea celor doua matrici, element cu element.",
    input_format: "Pe prima linie se afla doua numere naturale m si n. Urmeaza m linii cu prima matrice, apoi m linii cu a doua matrice, fiecare linie continand n numere intregi, separate prin spatiu.",
    output_format: "Afiseaza m linii, fiecare continand n numere separate prin spatiu: matricea suma.",
    constraints: "1 <= m, n <= 50, -1000 <= a[i][j], b[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice", "parcurgere-matrici-oarecare"],
    hints: "Citeste ambele matrici, apoi aduna elementele aflate pe aceeasi pozitie din cele doua matrici.",
    explanation: "Se citesc cele doua matrici, apoi se construieste matricea suma, in care fiecare element este suma elementelor aflate pe aceeasi pozitie in cele doua matrici initiale.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}vector<vector<long long>> b(m, vector<long long>(n));for(long long i=0;i<m;i++)for(long long j=0;j<n;j++)cin>>b[i][j];for(long long i=0;i<m;i++){for(long long j=0;j<n;j++){cout<<(a[i][j]+b[i][j]);if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_MN_PY}b = [list(map(int, input().split())) for _ in range(m)]\nfor i in range(m):\n    print(" ".join(str(a[i][j] + b[i][j]) for j in range(n)))\n`,
    tests: [
      "2 3\n1 2 3\n4 5 6\n1 1 1\n1 1 1",
      "1 1\n5\n5",
      "3 3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9\n1 2 3\n4 5 6\n7 8 9",
      "1 5\n1 2 3 4 5\n5 4 3 2 1",
      "5 1\n1\n2\n3\n4\n5\n5\n4\n3\n2\n1",
      "3 2\n1 2\n3 4\n5 6\n0 0\n0 0\n0 0",
      "2 2\n1000 -1000\n-1000 1000\n-1000 1000\n1000 -1000",
      "2 2\n1 1\n1 1\n2 2\n2 2",
    ],
  },
  {
    slug: "verifica-daca-doua-matrici-sunt-egale",
    title: "Verifica daca doua matrici sunt egale",
    statement: "Se citesc doua matrici, fiecare cu m linii si n coloane. Verificati daca cele doua matrici sunt egale, adica au aceeasi valoare pe fiecare pozitie corespunzatoare.",
    input_format: "Pe prima linie se afla doua numere naturale m si n. Urmeaza m linii cu prima matrice, apoi m linii cu a doua matrice, fiecare linie continand n numere intregi, separate prin spatiu.",
    output_format: "Afiseaza DA daca cele doua matrici sunt egale, respectiv NU in caz contrar.",
    constraints: "1 <= m, n <= 50, -1000 <= a[i][j], b[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice", "parcurgere-matrici-oarecare"],
    hints: "Citeste ambele matrici, apoi compara elementele aflate pe aceeasi pozitie din cele doua matrici.",
    explanation: "Se citesc cele doua matrici, apoi se compara element cu element; daca toate perechile de elemente corespunzatoare sunt egale, cele doua matrici sunt egale.\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}vector<vector<long long>> b(m, vector<long long>(n));for(long long i=0;i<m;i++)for(long long j=0;j<n;j++)cin>>b[i][j];bool ok=true;for(long long i=0;i<m;i++)for(long long j=0;j<n;j++)if(a[i][j]!=b[i][j])ok=false;cout<<(ok?"DA":"NU")<<"\\n";`),
    py: `${READ_MN_PY}b = [list(map(int, input().split())) for _ in range(m)]\nok = all(a[i][j] == b[i][j] for i in range(m) for j in range(n))\nprint("DA" if ok else "NU")\n`,
    tests: [
      "2 3\n1 2 3\n4 5 6\n1 2 3\n4 5 6",
      "2 3\n1 2 3\n4 5 6\n1 2 3\n4 5 7",
      "1 1\n5\n5",
      "1 1\n5\n6",
      "3 3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9",
      "1 5\n1 2 3 4 5\n1 2 3 4 5",
      "5 1\n1\n2\n3\n4\n5\n1\n2\n3\n4\n6",
      "2 2\n1000 -1000\n-1000 1000\n1000 -1000\n-1000 1000",
    ],
  },
  {
    slug: "diferenta-a-doua-matrici",
    title: "Diferenta a doua matrici",
    statement: "Se citesc doua matrici, fiecare cu m linii si n coloane. Afisati matricea obtinuta prin scaderea celei de-a doua matrici din prima, element cu element.",
    input_format: "Pe prima linie se afla doua numere naturale m si n. Urmeaza m linii cu prima matrice, apoi m linii cu a doua matrice, fiecare linie continand n numere intregi, separate prin spatiu.",
    output_format: "Afiseaza m linii, fiecare continand n numere separate prin spatiu: matricea diferenta.",
    constraints: "1 <= m, n <= 50, -1000 <= a[i][j], b[i][j] <= 1000",
    difficulty: "easy",
    tags: ["matrice", "parcurgere-matrici-oarecare"],
    hints: "Citeste ambele matrici, apoi scade din elementele primei matrici elementele aflate pe aceeasi pozitie din a doua.",
    explanation: "Se citesc cele doua matrici, apoi se construieste matricea diferenta, in care fiecare element este diferenta dintre elementele aflate pe aceeasi pozitie in cele doua matrici initiale (prima minus a doua).\n\n**Complexitate:** O(m*n)",
    cpp: C(`${READ_MN_CPP}vector<vector<long long>> b(m, vector<long long>(n));for(long long i=0;i<m;i++)for(long long j=0;j<n;j++)cin>>b[i][j];for(long long i=0;i<m;i++){for(long long j=0;j<n;j++){cout<<(a[i][j]-b[i][j]);if(j+1<n)cout<<" ";}cout<<"\\n";}`),
    py: `${READ_MN_PY}b = [list(map(int, input().split())) for _ in range(m)]\nfor i in range(m):\n    print(" ".join(str(a[i][j] - b[i][j]) for j in range(n)))\n`,
    tests: [
      "2 3\n1 2 3\n4 5 6\n1 1 1\n1 1 1",
      "1 1\n5\n5",
      "3 3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9\n1 2 3\n4 5 6\n7 8 9",
      "1 5\n1 2 3 4 5\n5 4 3 2 1",
      "5 1\n1\n2\n3\n4\n5\n5\n4\n3\n2\n1",
      "3 2\n1 2\n3 4\n5 6\n0 0\n0 0\n0 0",
      "2 2\n1000 -1000\n-1000 1000\n-1000 1000\n1000 -1000",
      "2 2\n1 1\n1 1\n2 2\n2 2",
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
