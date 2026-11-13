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

const CHAPTER = { level: "grade9", chapter: "tablouri-uni", sub: "verificarea-proprietatilor" };

const IN_FMT_1 = "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu.";
const IN_FMT_K = "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu. Pe a treia linie se afla numarul natural nenul k.";
const OUT_FMT = "Afiseaza DA daca proprietatea este verificata, respectiv NU in caz contrar.";

const IS_PRIME_CPP = `bool isPrime(long long x){ if(x<2) return false; for(long long d=2; d*d<=x; d++) if(x%d==0) return false; return true; }\n`;
const IS_PRIME_PY = `def is_prime(x):\n    if x < 2:\n        return False\n    d = 2\n    while d * d <= x:\n        if x % d == 0:\n            return False\n        d += 1\n    return True\n\n`;

const IS_SQUARE_CPP = `bool isSquare(long long x){ if(x<0) return false; long long r=(long long)sqrtl((long double)x); while(r>0 && r*r>x) r--; while((r+1)*(r+1)<=x) r++; return r*r==x; }\n`;
const IS_SQUARE_PY = `import math\ndef is_square(x):\n    if x < 0:\n        return False\n    r = math.isqrt(x)\n    return r * r == x\n\n`;

const problems = [
  {
    slug: "toate-elementele-sunt-pare",
    title: "Toate elementele sunt pare",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Verificati daca toate elementele vectorului sunt pare.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["verificarea-proprietatilor", "paritate"],
    hints: "Un numar este par daca restul impartirii la 2 este 0, indiferent de semnul sau.",
    explanation: "Parcurgi vectorul si verifici ca fiecare element are restul 0 la impartirea cu 2.\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;bool ok=true;for(auto x:a) if(x%2!=0) ok=false;cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nprint("DA" if all(x % 2 == 0 for x in a) else "NU")\n`,
    tests: [
      "5\n2 4 6 8 10",
      "5\n2 4 5 8 10",
      "1\n0",
      "1\n7",
      "4\n-2 -4 6 8",
      "4\n-2 -3 6 8",
      "6\n1000000000 -1000000000 2 4 6 8",
      "3\n2 2 3",
    ],
  },
  {
    slug: "toate-elementele-sunt-impare",
    title: "Toate elementele sunt impare",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Verificati daca toate elementele vectorului sunt impare.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["verificarea-proprietatilor", "paritate"],
    hints: "Un numar este impar daca restul impartirii la 2 este diferit de 0.",
    explanation: "Parcurgi vectorul si verifici ca fiecare element are restul nenul la impartirea cu 2.\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;bool ok=true;for(auto x:a) if(x%2==0) ok=false;cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nprint("DA" if all(x % 2 != 0 for x in a) else "NU")\n`,
    tests: [
      "5\n1 3 5 7 9",
      "5\n1 3 4 7 9",
      "1\n0",
      "1\n7",
      "4\n-1 -3 5 7",
      "4\n-1 -2 5 7",
      "6\n999999999 -999999999 1 3 5 7",
      "3\n1 1 2",
    ],
  },
  {
    slug: "toate-elementele-sunt-prime",
    title: "Toate elementele sunt numere prime",
    statement: "Se citesc un numar natural n si un vector cu n numere naturale. Verificati daca toate elementele vectorului sunt numere prime.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, 0 <= a[i] <= 1000000",
    difficulty: "medium",
    tags: ["verificarea-proprietatilor", "numere-prime"],
    hints: "Un numar este prim daca are exact doi divizori (1 si el insusi); 0 si 1 nu sunt prime.",
    explanation: "Pentru fiecare element verifici daca este prim prin incercarea divizorilor de la 2 pana la radical din numar.\n\n**Complexitate:** O(n * radical(max))",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n${IS_PRIME_CPP}int main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;bool ok=true;for(auto x:a) if(!isPrime(x)) ok=false;cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `${IS_PRIME_PY}n = int(input())\na = list(map(int, input().split()))\nprint("DA" if all(is_prime(x) for x in a) else "NU")\n`,
    tests: [
      "3\n2 3 5",
      "3\n2 3 4",
      "1\n2",
      "1\n1",
      "4\n7 11 13 17",
      "4\n7 11 13 15",
      "5\n97 89 83 79 73",
      "2\n999983 999984",
    ],
  },
  {
    slug: "toate-elementele-sunt-pozitive",
    title: "Toate elementele sunt pozitive",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Verificati daca toate elementele vectorului sunt strict pozitive.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["verificarea-proprietatilor", "semn"],
    hints: "Zero nu este considerat pozitiv.",
    explanation: "Parcurgi vectorul si verifici ca fiecare element este strict mai mare decat 0.\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;bool ok=true;for(auto x:a) if(x<=0) ok=false;cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nprint("DA" if all(x > 0 for x in a) else "NU")\n`,
    tests: [
      "5\n1 2 3 4 5",
      "5\n1 2 0 4 5",
      "1\n1",
      "1\n0",
      "4\n5 5 5 5",
      "4\n5 -5 5 5",
      "3\n1000000000 1 2",
      "1\n-1",
    ],
  },
  {
    slug: "toate-elementele-sunt-negative",
    title: "Toate elementele sunt negative",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Verificati daca toate elementele vectorului sunt strict negative.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["verificarea-proprietatilor", "semn"],
    hints: "Zero nu este considerat negativ.",
    explanation: "Parcurgi vectorul si verifici ca fiecare element este strict mai mic decat 0.\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;bool ok=true;for(auto x:a) if(x>=0) ok=false;cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nprint("DA" if all(x < 0 for x in a) else "NU")\n`,
    tests: [
      "5\n-1 -2 -3 -4 -5",
      "5\n-1 -2 0 -4 -5",
      "1\n-1",
      "1\n0",
      "4\n-5 -5 -5 -5",
      "4\n-5 5 -5 -5",
      "3\n-1000000000 -1 -2",
      "1\n1",
    ],
  },
  {
    slug: "toate-elementele-sunt-multipli-de-k",
    title: "Toate elementele sunt multipli de k",
    statement: "Se citesc un numar natural n, un vector cu n numere intregi si un numar natural nenul k. Verificati daca toate elementele vectorului sunt multipli de k.",
    input_format: IN_FMT_K,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9, 1 <= k <= 1000",
    difficulty: "easy",
    tags: ["verificarea-proprietatilor", "divizibilitate"],
    hints: "Un numar (indiferent de semn) este multiplu de k daca restul impartirii sale la k este 0.",
    explanation: "Parcurgi vectorul si verifici ca fiecare element are restul 0 la impartirea cu k.\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;long long k;cin>>k;bool ok=true;for(auto x:a) if(x%k!=0) ok=false;cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nk = int(input())\nprint("DA" if all(x % k == 0 for x in a) else "NU")\n`,
    tests: [
      "5\n3 6 9 12 15\n3",
      "5\n3 6 10 12 15\n3",
      "1\n0\n5",
      "1\n7\n5",
      "4\n-4 8 -12 16\n4",
      "4\n-4 8 -12 15\n4",
      "3\n1000000000 -1000000000 0\n1000",
      "3\n5 5 5\n5",
    ],
  },
  {
    slug: "toate-elementele-sunt-patrate-perfecte",
    title: "Toate elementele sunt patrate perfecte",
    statement: "Se citesc un numar natural n si un vector cu n numere naturale. Verificati daca toate elementele vectorului sunt patrate perfecte.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, 0 <= a[i] <= 10^12",
    difficulty: "medium",
    tags: ["verificarea-proprietatilor", "patrate-perfecte"],
    hints: "Un numar x este patrat perfect daca exista un intreg r astfel incat r*r == x. Calculeaza radical(x) si verifica valorile vecine pentru a evita erorile de rotunjire.",
    explanation: "Pentru fiecare element calculezi radacina patrata intreaga si verifici daca ridicata la patrat reproduce exact elementul.\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\n#include <cmath>\nusing namespace std;\n${IS_SQUARE_CPP}int main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;bool ok=true;for(auto x:a) if(!isSquare(x)) ok=false;cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `${IS_SQUARE_PY}n = int(input())\na = list(map(int, input().split()))\nprint("DA" if all(is_square(x) for x in a) else "NU")\n`,
    tests: [
      "5\n0 1 4 9 16",
      "5\n0 1 4 9 15",
      "1\n1000000",
      "1\n999999",
      "4\n25 36 49 64",
      "4\n25 36 49 63",
      "3\n999999999999 1000000000000 0",
      "2\n1 1",
    ],
  },
  {
    slug: "exista-un-element-par",
    title: "Exista cel putin un element par",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Verificati daca exista cel putin un element par in vector.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["verificarea-proprietatilor", "paritate"],
    hints: "Este suficient sa gasesti un singur element cu restul 0 la impartirea cu 2.",
    explanation: "Parcurgi vectorul si te opresti la primul element par gasit.\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;bool ok=false;for(auto x:a) if(x%2==0) ok=true;cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nprint("DA" if any(x % 2 == 0 for x in a) else "NU")\n`,
    tests: [
      "5\n1 3 5 7 8",
      "5\n1 3 5 7 9",
      "1\n0",
      "1\n7",
      "4\n-1 -3 -5 -6",
      "4\n-1 -3 -5 -7",
      "3\n999999999 999999998 999999997",
      "3\n1 1 1",
    ],
  },
  {
    slug: "exista-un-element-impar",
    title: "Exista cel putin un element impar",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Verificati daca exista cel putin un element impar in vector.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["verificarea-proprietatilor", "paritate"],
    hints: "Este suficient sa gasesti un singur element cu restul nenul la impartirea cu 2.",
    explanation: "Parcurgi vectorul si te opresti la primul element impar gasit.\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;bool ok=false;for(auto x:a) if(x%2!=0) ok=true;cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nprint("DA" if any(x % 2 != 0 for x in a) else "NU")\n`,
    tests: [
      "5\n2 4 6 8 9",
      "5\n2 4 6 8 10",
      "1\n0",
      "1\n7",
      "4\n-2 -4 -6 -7",
      "4\n-2 -4 -6 -8",
      "3\n999999998 999999996 999999997",
      "3\n2 2 2",
    ],
  },
  {
    slug: "exista-un-element-prim",
    title: "Exista cel putin un element prim",
    statement: "Se citesc un numar natural n si un vector cu n numere naturale. Verificati daca exista cel putin un element prim in vector.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, 0 <= a[i] <= 1000000",
    difficulty: "medium",
    tags: ["verificarea-proprietatilor", "numere-prime"],
    hints: "Verifica pe rand fiecare element daca este prim; este suficient sa gasesti unul singur.",
    explanation: "Parcurgi vectorul si testezi primalitatea fiecarui element, oprindu-te la primul gasit prim.\n\n**Complexitate:** O(n * radical(max))",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n${IS_PRIME_CPP}int main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;bool ok=false;for(auto x:a) if(isPrime(x)) ok=true;cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `${IS_PRIME_PY}n = int(input())\na = list(map(int, input().split()))\nprint("DA" if any(is_prime(x) for x in a) else "NU")\n`,
    tests: [
      "3\n4 6 7",
      "3\n4 6 8",
      "1\n2",
      "1\n1",
      "4\n0 1 4 6",
      "4\n0 1 4 5",
      "2\n999984 999983",
      "3\n1 1 1",
    ],
  },
  {
    slug: "exista-un-multiplu-de-k",
    title: "Exista cel putin un multiplu de k",
    statement: "Se citesc un numar natural n, un vector cu n numere intregi si un numar natural nenul k. Verificati daca exista cel putin un element din vector care este multiplu de k.",
    input_format: IN_FMT_K,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9, 1 <= k <= 1000",
    difficulty: "easy",
    tags: ["verificarea-proprietatilor", "divizibilitate"],
    hints: "Este suficient sa gasesti un singur element cu restul 0 la impartirea cu k.",
    explanation: "Parcurgi vectorul si te opresti la primul multiplu de k gasit.\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;long long k;cin>>k;bool ok=false;for(auto x:a) if(x%k==0) ok=true;cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nk = int(input())\nprint("DA" if any(x % k == 0 for x in a) else "NU")\n`,
    tests: [
      "5\n1 2 4 5 7\n3",
      "5\n1 2 4 5 6\n3",
      "1\n0\n5",
      "1\n7\n5",
      "4\n-1 -2 -3 -5\n4",
      "4\n-1 -2 -3 -4\n4",
      "3\n999999999 1 2\n1000",
      "3\n1 1 1\n1",
    ],
  },
  {
    slug: "exista-elemente-pozitive-si-negative",
    title: "Exista atat elemente pozitive cat si negative",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Verificati daca vectorul contine atat cel putin un element strict pozitiv, cat si cel putin un element strict negativ.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["verificarea-proprietatilor", "semn"],
    hints: "Retine daca ai gasit macar un element pozitiv si daca ai gasit macar un element negativ, apoi verifica ambele conditii.",
    explanation: "Parcurgi vectorul si marchezi separat gasirea unui element pozitiv, respectiv negativ; raspunsul este DA doar daca ambele au fost gasite.\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;bool pos=false,neg=false;for(auto x:a){if(x>0)pos=true;if(x<0)neg=true;}cout<<((pos&&neg)?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nprint("DA" if any(x > 0 for x in a) and any(x < 0 for x in a) else "NU")\n`,
    tests: [
      "5\n1 -2 3 -4 5",
      "5\n1 2 3 4 5",
      "5\n-1 -2 -3 -4 -5",
      "1\n0",
      "3\n0 0 -1",
      "3\n0 0 1",
      "4\n1000000000 -1000000000 0 0",
      "2\n-1 1",
    ],
  },
  {
    slug: "vector-ordonat-crescator",
    title: "Vector ordonat crescator (nedescrescator)",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Verificati daca vectorul este ordonat crescator, adica fiecare element este mai mare sau egal cu precedentul.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["verificarea-proprietatilor", "ordonare"],
    hints: "Compara fiecare element cu cel dinaintea lui: trebuie sa fie mai mare sau egal.",
    explanation: "Parcurgi vectorul de la al doilea element si verifici ca fiecare este >= elementul precedent.\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;bool ok=true;for(int i=1;i<n;i++) if(a[i]<a[i-1]) ok=false;cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nprint("DA" if all(a[i] >= a[i-1] for i in range(1, n)) else "NU")\n`,
    tests: [
      "5\n1 2 3 4 5",
      "5\n1 3 2 4 5",
      "1\n5",
      "4\n2 2 2 2",
      "4\n-5 -3 -1 0",
      "4\n-5 -3 -1 -2",
      "3\n1000000000 1000000000 1000000000",
      "5\n5 4 3 2 1",
    ],
  },
  {
    slug: "vector-ordonat-strict-crescator",
    title: "Vector ordonat strict crescator",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Verificati daca vectorul este strict crescator, adica fiecare element este strict mai mare decat precedentul.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["verificarea-proprietatilor", "ordonare"],
    hints: "Doua elemente consecutive egale incalca proprietatea de strict crescator.",
    explanation: "Parcurgi vectorul de la al doilea element si verifici ca fiecare este strict mai mare decat elementul precedent.\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;bool ok=true;for(int i=1;i<n;i++) if(a[i]<=a[i-1]) ok=false;cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nprint("DA" if all(a[i] > a[i-1] for i in range(1, n)) else "NU")\n`,
    tests: [
      "5\n1 2 3 4 5",
      "5\n1 2 2 4 5",
      "1\n5",
      "4\n2 2 2 2",
      "4\n-5 -3 -1 0",
      "4\n-5 -3 -1 -1",
      "3\n1 1000000000 1000000000",
      "5\n5 4 3 2 1",
    ],
  },
  {
    slug: "vector-ordonat-descrescator",
    title: "Vector ordonat descrescator (necrescator)",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Verificati daca vectorul este ordonat descrescator, adica fiecare element este mai mic sau egal cu precedentul.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["verificarea-proprietatilor", "ordonare"],
    hints: "Compara fiecare element cu cel dinaintea lui: trebuie sa fie mai mic sau egal.",
    explanation: "Parcurgi vectorul de la al doilea element si verifici ca fiecare este <= elementul precedent.\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;bool ok=true;for(int i=1;i<n;i++) if(a[i]>a[i-1]) ok=false;cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nprint("DA" if all(a[i] <= a[i-1] for i in range(1, n)) else "NU")\n`,
    tests: [
      "5\n5 4 3 2 1",
      "5\n5 3 4 2 1",
      "1\n5",
      "4\n2 2 2 2",
      "4\n0 -1 -3 -5",
      "4\n-2 -1 -3 -5",
      "3\n1000000000 1000000000 1000000000",
      "5\n1 2 3 4 5",
    ],
  },
  {
    slug: "vector-ordonat-strict-descrescator",
    title: "Vector ordonat strict descrescator",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Verificati daca vectorul este strict descrescator, adica fiecare element este strict mai mic decat precedentul.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["verificarea-proprietatilor", "ordonare"],
    hints: "Doua elemente consecutive egale incalca proprietatea de strict descrescator.",
    explanation: "Parcurgi vectorul de la al doilea element si verifici ca fiecare este strict mai mic decat elementul precedent.\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;bool ok=true;for(int i=1;i<n;i++) if(a[i]>=a[i-1]) ok=false;cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nprint("DA" if all(a[i] < a[i-1] for i in range(1, n)) else "NU")\n`,
    tests: [
      "5\n5 4 3 2 1",
      "5\n5 4 4 2 1",
      "1\n5",
      "4\n2 2 2 2",
      "4\n0 -1 -3 -5",
      "4\n-2 -1 -3 -5",
      "3\n1000000000 1 1",
      "5\n1 2 3 4 5",
    ],
  },
  {
    slug: "vector-forma-de-munte",
    title: "Vector in forma de munte",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Un vector are forma de munte daca exista o pozitie (nici prima, nici ultima) astfel incat vectorul creste strict pana la acea pozitie, apoi descreste strict pana la final. Verificati daca vectorul dat are forma de munte.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "medium",
    tags: ["verificarea-proprietatilor", "munte"],
    hints: "Urca strict cat timp poti, apoi coboara strict cat timp poti; la final trebuie sa fi ajuns exact la ultimul element, iar varful sa nu fie primul sau ultimul element.",
    explanation: "Avansezi un indice cat timp sirul creste strict (faza de urcare), apoi cat timp descreste strict (faza de coborare). Vectorul e munte daca ambele faze sunt nevide si impreuna acopera tot vectorul.\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;bool ok=true;if(n<3){ok=false;}else{int i=1;while(i<n&&a[i]>a[i-1])i++;if(i==1||i==n)ok=false;else{while(i<n&&a[i]<a[i-1])i++;ok=(i==n);}}cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nok = True\nif n < 3:\n    ok = False\nelse:\n    i = 1\n    while i < n and a[i] > a[i-1]:\n        i += 1\n    if i == 1 or i == n:\n        ok = False\n    else:\n        while i < n and a[i] < a[i-1]:\n            i += 1\n        ok = (i == n)\nprint("DA" if ok else "NU")\n`,
    tests: [
      "5\n1 3 5 4 2",
      "5\n1 2 3 4 5",
      "5\n5 4 3 2 1",
      "1\n5",
      "3\n1 3 2",
      "4\n1 2 2 1",
      "6\n1 2 3 2 3 1",
      "2\n1 2",
    ],
  },
  {
    slug: "vector-forma-de-vale",
    title: "Vector in forma de vale",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Un vector are forma de vale daca exista o pozitie (nici prima, nici ultima) astfel incat vectorul descreste strict pana la acea pozitie, apoi creste strict pana la final. Verificati daca vectorul dat are forma de vale.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "medium",
    tags: ["verificarea-proprietatilor", "vale"],
    hints: "Coboara strict cat timp poti, apoi urca strict cat timp poti; la final trebuie sa fi ajuns exact la ultimul element, iar minimul sa nu fie primul sau ultimul element.",
    explanation: "Avansezi un indice cat timp sirul descreste strict (faza de coborare), apoi cat timp creste strict (faza de urcare). Vectorul e vale daca ambele faze sunt nevide si impreuna acopera tot vectorul.\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;bool ok=true;if(n<3){ok=false;}else{int i=1;while(i<n&&a[i]<a[i-1])i++;if(i==1||i==n)ok=false;else{while(i<n&&a[i]>a[i-1])i++;ok=(i==n);}}cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nok = True\nif n < 3:\n    ok = False\nelse:\n    i = 1\n    while i < n and a[i] < a[i-1]:\n        i += 1\n    if i == 1 or i == n:\n        ok = False\n    else:\n        while i < n and a[i] > a[i-1]:\n            i += 1\n        ok = (i == n)\nprint("DA" if ok else "NU")\n`,
    tests: [
      "5\n5 3 1 2 4",
      "5\n5 4 3 2 1",
      "5\n1 2 3 4 5",
      "1\n5",
      "3\n3 1 2",
      "4\n2 1 1 2",
      "6\n3 2 1 2 1 3",
      "2\n2 1",
    ],
  },
  {
    slug: "vector-zigzag",
    title: "Vector zigzag",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Un vector este zigzag daca fiecare element din interior este fie un maxim local (mai mare decat ambii vecini), fie un minim local (mai mic decat ambii vecini), astfel incat sensul crestere/descrestere alterneaza la fiecare pas. Verificati daca vectorul dat este zigzag.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "medium",
    tags: ["verificarea-proprietatilor", "zigzag"],
    hints: "Calculeaza semnul diferentei intre elemente consecutive; vectorul e zigzag daca niciun semn nu este 0 si semnele alterneaza mereu.",
    explanation: "Pentru fiecare pereche de diferente consecutive verifici ca ambele sunt nenule si de semne opuse.\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint sgn(long long v){return v>0?1:(v<0?-1:0);}\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;bool ok=true;for(int i=1;i+1<n;i++){int s1=sgn(a[i]-a[i-1]);int s2=sgn(a[i+1]-a[i]);if(s1==0||s2==0||s1==s2)ok=false;}cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `def sgn(v):\n    return (v > 0) - (v < 0)\n\nn = int(input())\na = list(map(int, input().split()))\nok = True\nfor i in range(1, n - 1):\n    s1 = sgn(a[i] - a[i-1])\n    s2 = sgn(a[i+1] - a[i])\n    if s1 == 0 or s2 == 0 or s1 == s2:\n        ok = False\nprint("DA" if ok else "NU")\n`,
    tests: [
      "5\n1 3 2 4 1",
      "5\n1 2 3 4 5",
      "1\n5",
      "2\n1 2",
      "4\n1 3 3 1",
      "5\n3 1 4 1 5",
      "6\n5 1 5 1 5 1",
      "3\n1 1 2",
    ],
  },
  {
    slug: "vector-cu-maxim-unic",
    title: "Vector cu maxim unic",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Verificati daca valoarea maxima din vector apare o singura data.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["verificarea-proprietatilor", "extreme"],
    hints: "Determina valoarea maxima, apoi numara de cate ori apare in vector.",
    explanation: "Afli maximul vectorului, apoi numeri aparitiile lui; raspunsul este DA doar daca apare exact o singura data.\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;long long mx=*max_element(a.begin(),a.end());long long cnt=0;for(auto x:a) if(x==mx) cnt++;cout<<(cnt==1?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nmx = max(a)\nprint("DA" if a.count(mx) == 1 else "NU")\n`,
    tests: [
      "5\n1 5 3 2 4",
      "5\n5 1 5 2 3",
      "1\n5",
      "4\n7 7 7 7",
      "4\n-1 -5 -2 -3",
      "4\n-1 -1 -5 -2",
      "3\n1000000000 999999999 1000000000",
      "2\n3 3",
    ],
  },
  {
    slug: "vector-palindrom",
    title: "Vector palindrom",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Verificati daca vectorul este palindrom, adica citit de la stanga la dreapta este identic cu cel citit de la dreapta la stanga.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["verificarea-proprietatilor", "palindrom"],
    hints: "Compara elementul de pe pozitia i cu cel de pe pozitia n-1-i, pentru toate pozitiile din prima jumatate.",
    explanation: "Compari perechile simetrice fata de mijlocul vectorului.\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;bool ok=true;for(int i=0;i<n/2;i++) if(a[i]!=a[n-1-i]) ok=false;cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nprint("DA" if all(a[i] == a[n-1-i] for i in range(n // 2)) else "NU")\n`,
    tests: [
      "5\n1 2 3 2 1",
      "5\n1 2 3 4 1",
      "1\n5",
      "4\n1 2 2 1",
      "4\n1 2 3 1",
      "6\n-1 2 3 3 2 -1",
      "2\n5 5",
      "2\n5 6",
    ],
  },
  {
    slug: "toate-elementele-egale-intre-ele",
    title: "Toate elementele sunt egale intre ele",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Verificati daca toate elementele vectorului sunt egale intre ele (vector constant).",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["verificarea-proprietatilor", "egalitate"],
    hints: "Compara fiecare element cu primul element din vector.",
    explanation: "Parcurgi vectorul si verifici ca fiecare element este egal cu a[0].\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;bool ok=true;for(auto x:a) if(x!=a[0]) ok=false;cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nprint("DA" if all(x == a[0] for x in a) else "NU")\n`,
    tests: [
      "5\n7 7 7 7 7",
      "5\n7 7 8 7 7",
      "1\n5",
      "4\n0 0 0 0",
      "4\n-3 -3 -3 -3",
      "4\n-3 -3 3 -3",
      "3\n1000000000 1000000000 1000000000",
      "2\n1 2",
    ],
  },
  {
    slug: "toate-elementele-sunt-distincte",
    title: "Toate elementele sunt distincte",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Verificati daca toate elementele vectorului sunt distincte doua cate doua (nu exista duplicate).",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["verificarea-proprietatilor", "distincte"],
    hints: "Introdu elementele intr-o multime (set) si compara dimensiunea multimii cu n.",
    explanation: "Daca numarul de valori distincte (dimensiunea multimii) este egal cu n, atunci toate elementele sunt distincte.\n\n**Complexitate:** O(n log n)",
    cpp: `#include <iostream>\n#include <vector>\n#include <set>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;set<long long> s(a.begin(),a.end());cout<<((int)s.size()==n?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nprint("DA" if len(set(a)) == n else "NU")\n`,
    tests: [
      "5\n1 2 3 4 5",
      "5\n1 2 3 2 5",
      "1\n5",
      "4\n-1 0 1 2",
      "4\n-1 0 -1 2",
      "3\n1000000000 -1000000000 0",
      "2\n5 5",
      "6\n1 2 3 4 5 6",
    ],
  },
  {
    slug: "exista-doua-elemente-egale",
    title: "Exista doua elemente egale",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Verificati daca exista cel putin doua elemente egale in vector.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["verificarea-proprietatilor", "duplicate"],
    hints: "Daca numarul de valori distincte este mai mic decat n, inseamna ca exista cel putin o valoare care se repeta.",
    explanation: "Compari dimensiunea multimii valorilor distincte cu n; daca este mai mica, exista un duplicat.\n\n**Complexitate:** O(n log n)",
    cpp: `#include <iostream>\n#include <vector>\n#include <set>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;set<long long> s(a.begin(),a.end());cout<<((int)s.size()<n?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nprint("DA" if len(set(a)) < n else "NU")\n`,
    tests: [
      "5\n1 2 3 2 5",
      "5\n1 2 3 4 5",
      "1\n5",
      "4\n-1 0 -1 2",
      "4\n-1 0 1 2",
      "3\n1000000000 1000000000 0",
      "2\n5 5",
      "6\n1 1 1 1 1 1",
    ],
  },
  {
    slug: "suma-pozitii-pare-egala-cu-suma-pozitii-impare",
    title: "Suma de pe pozitii pare egala cu suma de pe pozitii impare",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi, indexat de la 1. Verificati daca suma elementelor aflate pe pozitii pare este egala cu suma elementelor aflate pe pozitii impare.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["verificarea-proprietatilor", "sume"],
    hints: "Pozitiile sunt 1-indexate: elementul de pe indicele 0 din vector (in memorie) se afla pe pozitia 1 (impara).",
    explanation: "Aduni separat elementele de pe pozitiile pare si cele de pe pozitiile impare (1-indexate), apoi compari cele doua sume.\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;long long sOdd=0,sEven=0;for(int i=0;i<n;i++){int pos=i+1;if(pos%2==0)sEven+=a[i];else sOdd+=a[i];}cout<<(sOdd==sEven?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\ns_odd = sum(a[i] for i in range(n) if (i + 1) % 2 != 0)\ns_even = sum(a[i] for i in range(n) if (i + 1) % 2 == 0)\nprint("DA" if s_odd == s_even else "NU")\n`,
    tests: [
      "4\n1 1 2 2",
      "4\n1 2 3 4",
      "1\n5",
      "2\n3 3",
      "2\n3 4",
      "6\n5 5 5 5 5 5",
      "5\n0 0 0 0 0",
      "6\n1000000000 1000000000 -1000000000 -1000000000 0 0",
    ],
  },
  {
    slug: "numarul-elementelor-pare-egal-cu-numarul-elementelor-impare",
    title: "Numarul elementelor pare egal cu numarul elementelor impare",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Verificati daca numarul elementelor pare din vector este egal cu numarul elementelor impare.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["verificarea-proprietatilor", "paritate"],
    hints: "Numara cate elemente au restul 0 la impartirea cu 2 si cate au restul nenul, apoi compara cele doua numere.",
    explanation: "Parcurgi vectorul, numeri elementele pare si pe cele impare, apoi compari cele doua contoare.\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;long long cEven=0,cOdd=0;for(auto x:a){if(x%2==0)cEven++;else cOdd++;}cout<<(cEven==cOdd?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nc_even = sum(1 for x in a if x % 2 == 0)\nc_odd = n - c_even\nprint("DA" if c_even == c_odd else "NU")\n`,
    tests: [
      "4\n1 2 3 4",
      "4\n1 2 3 5",
      "1\n5",
      "2\n2 4",
      "2\n2 3",
      "6\n1 1 1 2 2 2",
      "5\n0 0 0 0 1",
      "6\n-1 -2 -3 -4 5 6",
    ],
  },
  {
    slug: "vector-alternant-ca-semn",
    title: "Vector alternant ca semn",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi nenule. Verificati daca semnele elementelor alterneaza (pozitiv, negativ, pozitiv, negativ, ... sau invers), fara doua elemente consecutive de acelasi semn.",
    input_format: IN_FMT_1,
    output_format: OUT_FMT,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9, a[i] != 0",
    difficulty: "easy",
    tags: ["verificarea-proprietatilor", "semn"],
    hints: "Compara semnul fiecarui element cu semnul elementului precedent; ele trebuie sa fie mereu diferite.",
    explanation: "Parcurgi vectorul si verifici ca oricare doua elemente consecutive au semne diferite (unul pozitiv, celalalt negativ).\n\n**Complexitate:** O(n)",
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;bool ok=true;for(int i=1;i<n;i++) if((a[i]>0)==(a[i-1]>0)) ok=false;cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nprint("DA" if all((a[i] > 0) != (a[i-1] > 0) for i in range(1, n)) else "NU")\n`,
    tests: [
      "5\n1 -2 3 -4 5",
      "5\n-1 2 -3 4 -5",
      "1\n5",
      "4\n1 -2 -3 4",
      "2\n1 -1",
      "2\n1 2",
      "6\n1000000000 -1 1 -1000000000 5 -5",
      "3\n-1 -2 3",
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
