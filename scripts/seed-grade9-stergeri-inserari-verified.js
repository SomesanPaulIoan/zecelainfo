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

function bigTest(n, gen) {
  return `${n}\n${Array.from({ length: n }, (_, i) => gen(i)).join(" ")}`;
}

const CHAPTER = { level: "grade9", chapter: "tablouri-uni", sub: "stergeri-inserari" };

const POZ_NOTE = " Pozitiile se numaroteaza incepand de la 1 (prima pozitie este 1).";

const EFFICIENCY_NOTE =
  " Vectorul poate avea pana la 100000 de elemente, deci solutia trebuie sa fie liniara O(n): construieste vectorul rezultat parcurgand o singura data vectorul initial. O solutie care sterge/insereaza elemente pe rand, cu deplasari repetate ale restului vectorului (O(n^2)), va depasi timpul limita.";

const problems = [
  {
    slug: "stergerea-unui-element-de-pe-o-pozitie-data",
    title: "Stergerea unui element de pe o pozitie data",
    statement: "Se citesc un numar natural n, un vector cu n numere intregi si o pozitie k. Sterge elementul aflat pe pozitia k si afiseaza vectorul obtinut." + POZ_NOTE,
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu. Pe a treia linie se afla pozitia k.",
    output_format: "Afiseaza pe prima linie noul numar de elemente, iar pe a doua linie elementele vectorului obtinut, separate printr-un spatiu.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9, 1 <= k <= n",
    difficulty: "easy",
    tags: ["stergeri-inserari", "stergere"],
    hints: "Construieste un vector nou cu toate elementele, mai putin cel de pe indicele k-1.",
    explanation: "Parcurgi vectorul initial si copiezi in vectorul rezultat toate elementele, sarind peste indicele k-1 (corespunzator pozitiei k). Afisezi noua dimensiune, apoi elementele.\n\n**Complexitate:** O(n)",
    cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int k;cin>>k;vector<long long> r;for(int i=0;i<n;i++)if(i!=k-1)r.push_back(a[i]);cout<<r.size()<<\"\\n\";for(size_t i=0;i<r.size();i++){if(i)cout<<\" \";cout<<r[i];}return 0;}\n",
    py: "n = int(input())\na = list(map(int, input().split()))\nk = int(input())\nr = a[:k - 1] + a[k:]\nprint(len(r))\nprint(\" \".join(map(str, r)))\n",
    tests: [
      "1\n5\n1",
      "5\n1 2 3 4 5\n1",
      "5\n1 2 3 4 5\n5",
      "5\n1 2 3 4 5\n3",
      "4\n10 20 30 40\n2",
      "6\n-1 -2 -3 -4 -5 -6\n4",
      "3\n7 8 9\n1",
      "7\n1 2 3 4 5 6 7\n7",
    ],
  },
  {
    slug: "inserarea-unui-element-pe-o-pozitie-data",
    title: "Inserarea unui element pe o pozitie data",
    statement: "Se citesc un numar natural n, un vector cu n numere intregi, o pozitie k si o valoare x. Insereaza valoarea x astfel incat sa devina noul element de pe pozitia k (elementele care erau de la pozitia k in sus se deplaseaza cu o pozitie spre dreapta). Afiseaza vectorul obtinut." + POZ_NOTE + " Pozitia k poate fi si n+1, caz in care x se adauga la finalul vectorului.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu. Pe a treia linie se afla pozitia k si valoarea x, separate prin spatiu.",
    output_format: "Afiseaza pe prima linie noul numar de elemente, iar pe a doua linie elementele vectorului obtinut, separate printr-un spatiu.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i], x <= 10^9, 1 <= k <= n+1",
    difficulty: "easy",
    tags: ["stergeri-inserari", "inserare"],
    hints: "Copiaza primele k-1 elemente, apoi valoarea x, apoi restul elementelor din vectorul initial.",
    explanation: "Construiesti vectorul rezultat lipind trei bucati: elementele de pe pozitiile 1..k-1, apoi x, apoi elementele de pe pozitiile k..n din vectorul initial. Afisezi noua dimensiune, apoi elementele.\n\n**Complexitate:** O(n)",
    cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int k;long long x;cin>>k>>x;vector<long long> r;for(int i=0;i<k-1;i++)r.push_back(a[i]);r.push_back(x);for(int i=k-1;i<n;i++)r.push_back(a[i]);cout<<r.size()<<\"\\n\";for(size_t i=0;i<r.size();i++){if(i)cout<<\" \";cout<<r[i];}return 0;}\n",
    py: "n = int(input())\na = list(map(int, input().split()))\nk, x = map(int, input().split())\nr = a[:k - 1] + [x] + a[k - 1:]\nprint(len(r))\nprint(\" \".join(map(str, r)))\n",
    tests: [
      "1\n5\n1 9",
      "1\n5\n2 9",
      "5\n1 2 3 4 5\n1 100",
      "5\n1 2 3 4 5\n6 100",
      "5\n1 2 3 4 5\n3 100",
      "4\n10 20 30 40\n2 -5",
      "6\n-1 -2 -3 -4 -5 -6\n4 0",
      "3\n7 8 9\n1 -1",
    ],
  },
  {
    slug: "stergerea-tuturor-elementelor-pare",
    title: "Stergerea tuturor elementelor pare (varianta eficienta)",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Sterge din vector toate elementele pare, pastrand ordinea celor ramase, si afiseaza vectorul obtinut." + EFFICIENCY_NOTE,
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu.",
    output_format: "Afiseaza pe prima linie noul numar de elemente, iar pe a doua linie elementele ramase, separate printr-un spatiu.",
    constraints: "1 <= n <= 100000, -1000 <= a[i] <= 1000",
    difficulty: "medium",
    tags: ["stergeri-inserari", "stergere", "eficienta"],
    hints: "Construieste vectorul rezultat intr-o singura parcurgere, pastrand doar elementele impare (a[i] % 2 != 0). Nu sterge elemente unul cate unul dintr-un vector deja construit.",
    explanation: "Parcurgi vectorul o singura data si copiezi in rezultat doar elementele impare. Astfel eviti recalcularea/deplasarea repetata specifica unei implementari O(n^2).\n\n**Complexitate:** O(n)",
    cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;vector<long long> r;for(int i=0;i<n;i++)if(a[i]%2!=0)r.push_back(a[i]);cout<<r.size()<<\"\\n\";for(size_t i=0;i<r.size();i++){if(i)cout<<\" \";cout<<r[i];}return 0;}\n",
    py: "n = int(input())\na = list(map(int, input().split()))\nr = [x for x in a if x % 2 != 0]\nprint(len(r))\nprint(\" \".join(map(str, r)))\n",
    tests: [
      "1\n4",
      "1\n3",
      "5\n1 2 3 4 5",
      "6\n2 4 6 8 10 12",
      "4\n-2 -3 -4 5",
      "7\n1 2 3 4 5 6 7",
      bigTest(90000, (i) => i % 10),
      bigTest(95000, (i) => (i + 3) % 10),
    ],
    time_limit_ms: 400,
    memory_limit_mb: 128,
  },
  {
    slug: "stergerea-tuturor-elementelor-prime",
    title: "Stergerea tuturor elementelor prime",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Sterge din vector toate elementele care sunt numere prime, pastrand ordinea celor ramase, si afiseaza vectorul obtinut. Numerele mai mici decat 2 nu se considera prime.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu.",
    output_format: "Afiseaza pe prima linie noul numar de elemente, iar pe a doua linie elementele ramase, separate printr-un spatiu.",
    constraints: "1 <= n <= 1000, -1000 <= a[i] <= 1000000",
    difficulty: "medium",
    tags: ["stergeri-inserari", "stergere", "numere-prime"],
    hints: "Scrie o functie care verifica daca un numar este prim (incercand divizori de la 2 pana la radical din numar), apoi pastreaza doar elementele pentru care functia returneaza fals.",
    explanation: "Pentru fiecare element verifici daca este prim printr-o functie de testare a primalitatii; pastrezi in rezultat doar elementele care nu sunt prime.\n\n**Complexitate:** O(n * radical(max))",
    cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nbool isPrime(long long x){if(x<2)return false;for(long long d=2;d*d<=x;d++)if(x%d==0)return false;return true;}\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;vector<long long> r;for(int i=0;i<n;i++)if(!isPrime(a[i]))r.push_back(a[i]);cout<<r.size()<<\"\\n\";for(size_t i=0;i<r.size();i++){if(i)cout<<\" \";cout<<r[i];}return 0;}\n",
    py: "def is_prime(x):\n    if x < 2:\n        return False\n    d = 2\n    while d * d <= x:\n        if x % d == 0:\n            return False\n        d += 1\n    return True\n\nn = int(input())\na = list(map(int, input().split()))\nr = [x for x in a if not is_prime(x)]\nprint(len(r))\nprint(\" \".join(map(str, r)))\n",
    tests: [
      "1\n2",
      "1\n4",
      "5\n2 3 4 5 6",
      "6\n7 8 9 10 11 12",
      "4\n-5 0 1 2",
      "3\n13 17 19",
      "5\n997 998 999 1000 1001",
      "7\n2 3 5 7 11 13 17",
    ],
  },
  {
    slug: "inserarea-dublului-dupa-fiecare-element-impar",
    title: "Inserarea dublului dupa fiecare element impar",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Dupa fiecare element impar din vector, insereaza dublul acelui element. Elementele pare raman neschimbate, fara nimic inserat dupa ele. Afiseaza vectorul obtinut.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu.",
    output_format: "Afiseaza pe prima linie noul numar de elemente, iar pe a doua linie elementele vectorului obtinut, separate printr-un spatiu.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "medium",
    tags: ["stergeri-inserari", "inserare"],
    hints: "Parcurge vectorul si, pentru fiecare element, adauga-l in rezultat; daca este impar, adauga imediat dupa si dublul lui.",
    explanation: "Construiesti rezultatul parcurgand vectorul initial: adaugi elementul curent, iar daca este impar mai adaugi si 2*a[i] imediat dupa.\n\n**Complexitate:** O(n)",
    cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;vector<long long> r;for(int i=0;i<n;i++){r.push_back(a[i]);if(a[i]%2!=0)r.push_back(2*a[i]);}cout<<r.size()<<\"\\n\";for(size_t i=0;i<r.size();i++){if(i)cout<<\" \";cout<<r[i];}return 0;}\n",
    py: "n = int(input())\na = list(map(int, input().split()))\nr = []\nfor v in a:\n    r.append(v)\n    if v % 2 != 0:\n        r.append(2 * v)\nprint(len(r))\nprint(\" \".join(map(str, r)))\n",
    tests: [
      "1\n3",
      "1\n4",
      "5\n1 2 3 4 5",
      "4\n-1 -2 -3 -4",
      "3\n0 0 0",
      "6\n2 4 6 8 10 12",
      "2\n7 8",
      "5\n-5 -5 -5 -5 -5",
    ],
  },
  {
    slug: "inserarea-jumatatii-inaintea-fiecarui-element-par",
    title: "Inserarea jumatatii inaintea fiecarui element par",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Inaintea fiecarui element par din vector, insereaza jumatatea acelui element (elementul impartit exact la 2). Elementele impare raman neschimbate, fara nimic inserat inainte de ele. Afiseaza vectorul obtinut.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu.",
    output_format: "Afiseaza pe prima linie noul numar de elemente, iar pe a doua linie elementele vectorului obtinut, separate printr-un spatiu.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "medium",
    tags: ["stergeri-inserari", "inserare"],
    hints: "Parcurge vectorul si, pentru fiecare element, daca este par, adauga mai intai jumatatea lui (a[i] / 2), apoi adauga elementul curent.",
    explanation: "Construiesti rezultatul parcurgand vectorul initial: daca elementul curent este par, adaugi mai intai a[i]/2 (impartire exacta, deoarece a[i] este par), apoi adaugi a[i]; daca este impar, adaugi doar a[i].\n\n**Complexitate:** O(n)",
    cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;vector<long long> r;for(int i=0;i<n;i++){if(a[i]%2==0)r.push_back(a[i]/2);r.push_back(a[i]);}cout<<r.size()<<\"\\n\";for(size_t i=0;i<r.size();i++){if(i)cout<<\" \";cout<<r[i];}return 0;}\n",
    py: "n = int(input())\na = list(map(int, input().split()))\nr = []\nfor v in a:\n    if v % 2 == 0:\n        r.append(v // 2)\n    r.append(v)\nprint(len(r))\nprint(\" \".join(map(str, r)))\n",
    tests: [
      "1\n4",
      "1\n3",
      "5\n1 2 3 4 5",
      "4\n-2 -4 -6 -8",
      "3\n1 3 5",
      "6\n0 0 0 0 0 0",
      "2\n10 7",
      "5\n-1 -1 -1 -1 -1",
    ],
  },
  {
    slug: "toate-rotatiile-circulare-la-dreapta-ale-unui-sir",
    title: "Toate rotatiile circulare la dreapta ale unui sir",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Afiseaza, cate una pe fiecare linie, toate cele n rotatii circulare la dreapta ale vectorului: pe linia s (1 <= s <= n) se afla vectorul rotit circular la dreapta cu s pozitii. Ultima linie (s = n) contine vectorul initial.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu.",
    output_format: "Afiseaza n linii; pe linia s se afla vectorul rotit circular la dreapta cu s pozitii, elementele fiind separate printr-un spatiu.",
    constraints: "1 <= n <= 8, -1000 <= a[i] <= 1000",
    difficulty: "medium",
    tags: ["stergeri-inserari", "rotatii"],
    hints: "Elementul de pe pozitia j din rotatia cu s pozitii spre dreapta este elementul de pe pozitia (j - s) mod n din vectorul initial.",
    explanation: "Pentru fiecare s de la 1 la n construiesti o linie in care elementul de pe pozitia j este a[(j - s) mod n], folosind aritmetica modulara pentru a ramane in limitele vectorului.\n\n**Complexitate:** O(n^2)",
    cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;for(int s=1;s<=n;s++){for(int j=0;j<n;j++){if(j)cout<<\" \";int idx=((j-s)%n+n)%n;cout<<a[idx];}cout<<\"\\n\";}return 0;}\n",
    py: "n = int(input())\na = list(map(int, input().split()))\nfor s in range(1, n + 1):\n    row = [a[(j - s) % n] for j in range(n)]\n    print(\" \".join(map(str, row)))\n",
    tests: [
      "1\n5",
      "2\n1 2",
      "3\n1 2 3",
      "4\n1 2 3 4",
      "5\n1 2 3 4 5",
      "3\n-1 -2 -3",
      "4\n0 0 1 1",
      "5\n10 20 30 40 50",
    ],
  },
  {
    slug: "toate-rotatiile-circulare-la-stanga-ale-unui-sir",
    title: "Toate rotatiile circulare la stanga ale unui sir",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Afiseaza, cate una pe fiecare linie, toate cele n rotatii circulare la stanga ale vectorului: pe linia s (1 <= s <= n) se afla vectorul rotit circular la stanga cu s pozitii. Ultima linie (s = n) contine vectorul initial.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu.",
    output_format: "Afiseaza n linii; pe linia s se afla vectorul rotit circular la stanga cu s pozitii, elementele fiind separate printr-un spatiu.",
    constraints: "1 <= n <= 8, -1000 <= a[i] <= 1000",
    difficulty: "medium",
    tags: ["stergeri-inserari", "rotatii"],
    hints: "Elementul de pe pozitia j din rotatia cu s pozitii spre stanga este elementul de pe pozitia (j + s) mod n din vectorul initial.",
    explanation: "Pentru fiecare s de la 1 la n construiesti o linie in care elementul de pe pozitia j este a[(j + s) mod n].\n\n**Complexitate:** O(n^2)",
    cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;for(int s=1;s<=n;s++){for(int j=0;j<n;j++){if(j)cout<<\" \";cout<<a[(j+s)%n];}cout<<\"\\n\";}return 0;}\n",
    py: "n = int(input())\na = list(map(int, input().split()))\nfor s in range(1, n + 1):\n    row = [a[(j + s) % n] for j in range(n)]\n    print(\" \".join(map(str, row)))\n",
    tests: [
      "1\n5",
      "2\n1 2",
      "3\n1 2 3",
      "4\n1 2 3 4",
      "5\n1 2 3 4 5",
      "3\n-1 -2 -3",
      "4\n0 0 1 1",
      "5\n10 20 30 40 50",
    ],
  },
  {
    slug: "duplicarea-tuturor-elementelor-pare",
    title: "Duplicarea tuturor elementelor pare (varianta eficienta)",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Pentru fiecare element par din vector, adauga imediat dupa el inca o copie a sa (dubleaza-l ca aparitie); elementele impare raman neschimbate, fara nimic adaugat dupa ele. Afiseaza vectorul obtinut." + EFFICIENCY_NOTE,
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu.",
    output_format: "Afiseaza pe prima linie noul numar de elemente, iar pe a doua linie elementele vectorului obtinut, separate printr-un spatiu.",
    constraints: "1 <= n <= 100000, -1000 <= a[i] <= 1000",
    difficulty: "medium",
    tags: ["stergeri-inserari", "inserare", "eficienta"],
    hints: "Construieste vectorul rezultat intr-o singura parcurgere: adauga elementul curent, iar daca este par mai adauga inca o copie a lui. Nu insera repetat intr-un vector deja construit.",
    explanation: "Parcurgi vectorul o singura data; pentru fiecare element il adaugi in rezultat, iar daca este par mai adaugi inca o data aceeasi valoare. Astfel operatia ramane O(n) in loc de O(n^2).\n\n**Complexitate:** O(n)",
    cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;vector<long long> r;for(int i=0;i<n;i++){r.push_back(a[i]);if(a[i]%2==0)r.push_back(a[i]);}cout<<r.size()<<\"\\n\";for(size_t i=0;i<r.size();i++){if(i)cout<<\" \";cout<<r[i];}return 0;}\n",
    py: "n = int(input())\na = list(map(int, input().split()))\nr = []\nfor v in a:\n    r.append(v)\n    if v % 2 == 0:\n        r.append(v)\nprint(len(r))\nprint(\" \".join(map(str, r)))\n",
    tests: [
      "1\n4",
      "1\n3",
      "5\n1 2 3 4 5",
      "4\n-2 -3 -4 5",
      "3\n0 0 0",
      "6\n1 3 5 7 9 11",
      bigTest(90000, (i) => i % 10),
      bigTest(95000, (i) => (i + 4) % 10),
    ],
    time_limit_ms: 400,
    memory_limit_mb: 128,
  },
  {
    slug: "stergerea-tuturor-elementelor-impare",
    title: "Stergerea tuturor elementelor impare",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Sterge din vector toate elementele impare, pastrand ordinea celor ramase, si afiseaza vectorul obtinut.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu.",
    output_format: "Afiseaza pe prima linie noul numar de elemente, iar pe a doua linie elementele ramase, separate printr-un spatiu.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["stergeri-inserari", "stergere"],
    hints: "Pastreaza doar elementele pare (a[i] % 2 == 0).",
    explanation: "Parcurgi vectorul si copiezi in rezultat doar elementele pare.\n\n**Complexitate:** O(n)",
    cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;vector<long long> r;for(int i=0;i<n;i++)if(a[i]%2==0)r.push_back(a[i]);cout<<r.size()<<\"\\n\";for(size_t i=0;i<r.size();i++){if(i)cout<<\" \";cout<<r[i];}return 0;}\n",
    py: "n = int(input())\na = list(map(int, input().split()))\nr = [x for x in a if x % 2 == 0]\nprint(len(r))\nprint(\" \".join(map(str, r)))\n",
    tests: [
      "1\n3",
      "1\n4",
      "5\n1 2 3 4 5",
      "6\n2 4 6 8 10 12",
      "4\n-2 -3 -4 5",
      "7\n1 2 3 4 5 6 7",
      "3\n0 1 0",
      "8\n1 1 1 1 1 1 1 1",
    ],
  },
  {
    slug: "stergerea-tuturor-elementelor-negative",
    title: "Stergerea tuturor elementelor negative",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Sterge din vector toate elementele strict negative, pastrand ordinea celor ramase, si afiseaza vectorul obtinut.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu.",
    output_format: "Afiseaza pe prima linie noul numar de elemente, iar pe a doua linie elementele ramase, separate printr-un spatiu.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["stergeri-inserari", "stergere"],
    hints: "Pastreaza doar elementele cu a[i] >= 0.",
    explanation: "Parcurgi vectorul si copiezi in rezultat doar elementele care nu sunt negative.\n\n**Complexitate:** O(n)",
    cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;vector<long long> r;for(int i=0;i<n;i++)if(a[i]>=0)r.push_back(a[i]);cout<<r.size()<<\"\\n\";for(size_t i=0;i<r.size();i++){if(i)cout<<\" \";cout<<r[i];}return 0;}\n",
    py: "n = int(input())\na = list(map(int, input().split()))\nr = [x for x in a if x >= 0]\nprint(len(r))\nprint(\" \".join(map(str, r)))\n",
    tests: [
      "1\n-5",
      "1\n5",
      "5\n1 -2 3 -4 5",
      "4\n0 0 0 0",
      "5\n-1 -2 -3 -4 -5",
      "6\n10 -10 20 -20 30 -30",
      "3\n1000000000 -1000000000 0",
      "7\n-1 -2 -3 -4 -5 -6 -7",
    ],
  },
  {
    slug: "stergerea-tuturor-aparitiilor-unei-valori-date",
    title: "Stergerea tuturor aparitiilor unei valori date",
    statement: "Se citesc un numar natural n, un vector cu n numere intregi si un numar intreg x. Sterge din vector toate aparitiile valorii x, pastrand ordinea celorlalte elemente, si afiseaza vectorul obtinut.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu. Pe a treia linie se afla numarul intreg x.",
    output_format: "Afiseaza pe prima linie noul numar de elemente, iar pe a doua linie elementele ramase, separate printr-un spatiu.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i], x <= 10^9",
    difficulty: "easy",
    tags: ["stergeri-inserari", "stergere"],
    hints: "Pastreaza doar elementele diferite de x.",
    explanation: "Parcurgi vectorul si copiezi in rezultat doar elementele diferite de x.\n\n**Complexitate:** O(n)",
    cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&v:a)cin>>v;long long x;cin>>x;vector<long long> r;for(int i=0;i<n;i++)if(a[i]!=x)r.push_back(a[i]);cout<<r.size()<<\"\\n\";for(size_t i=0;i<r.size();i++){if(i)cout<<\" \";cout<<r[i];}return 0;}\n",
    py: "n = int(input())\na = list(map(int, input().split()))\nx = int(input())\nr = [v for v in a if v != x]\nprint(len(r))\nprint(\" \".join(map(str, r)))\n",
    tests: [
      "5\n1 2 3 2 1\n2",
      "5\n1 2 3 4 5\n9",
      "1\n5\n5",
      "6\n7 7 7 7 7 7\n7",
      "4\n-1 -2 -1 -2\n-1",
      "5\n0 0 0 1 0\n0",
      "3\n1000000000 -1000000000 1000000000\n1000000000",
      "7\n1 2 3 4 5 6 7\n4",
    ],
  },
  {
    slug: "stergerea-primei-aparitii-a-unei-valori-date",
    title: "Stergerea primei aparitii a unei valori date",
    statement: "Se citesc un numar natural n, un vector cu n numere intregi si un numar intreg x. Sterge doar prima aparitie a valorii x din vector si afiseaza vectorul obtinut. Daca x nu apare in vector, vectorul ramane neschimbat.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu. Pe a treia linie se afla numarul intreg x.",
    output_format: "Afiseaza pe prima linie noul numar de elemente, iar pe a doua linie elementele vectorului obtinut, separate printr-un spatiu.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i], x <= 10^9",
    difficulty: "medium",
    tags: ["stergeri-inserari", "stergere"],
    hints: "Cauta indicele primei aparitii a lui x, apoi construieste rezultatul sarind doar peste acel indice.",
    explanation: "Gasesti primul indice i pentru care a[i] == x. Daca exista, construiesti rezultatul din toate elementele mai putin cel de pe acest indice; daca nu exista, rezultatul este vectorul initial neschimbat.\n\n**Complexitate:** O(n)",
    cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&v:a)cin>>v;long long x;cin>>x;int idx=-1;for(int i=0;i<n;i++)if(a[i]==x){idx=i;break;}vector<long long> r;for(int i=0;i<n;i++)if(i!=idx)r.push_back(a[i]);cout<<r.size()<<\"\\n\";for(size_t i=0;i<r.size();i++){if(i)cout<<\" \";cout<<r[i];}return 0;}\n",
    py: "n = int(input())\na = list(map(int, input().split()))\nx = int(input())\nr = list(a)\nif x in r:\n    r.remove(x)\nprint(len(r))\nprint(\" \".join(map(str, r)))\n",
    tests: [
      "5\n1 2 3 2 1\n2",
      "5\n1 2 3 4 5\n9",
      "1\n5\n5",
      "6\n7 7 7 7 7 7\n7",
      "4\n-1 -2 -1 -2\n-1",
      "5\n0 0 0 1 0\n0",
      "3\n1000000000 -1000000000 1000000000\n1000000000",
      "7\n1 2 3 4 5 6 7\n4",
    ],
  },
  {
    slug: "stergerea-elementelor-duplicate-dintr-un-vector",
    title: "Stergerea elementelor duplicate dintr-un vector",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Sterge din vector aparitiile suplimentare ale valorilor care se repeta, pastrand pentru fiecare valoare doar prima ei aparitie, in ordinea initiala. Afiseaza vectorul obtinut.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu.",
    output_format: "Afiseaza pe prima linie noul numar de elemente, iar pe a doua linie elementele ramase, separate printr-un spatiu.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "medium",
    tags: ["stergeri-inserari", "stergere", "duplicate"],
    hints: "Parcurge vectorul si pastreaza un element doar daca nu a mai aparut pe vreo pozitie anterioara.",
    explanation: "Parcurgi vectorul cu un indice i si verifici daca a[i] a mai aparut pe vreuna dintre pozitiile 0..i-1; daca nu, il pastrezi in rezultat.\n\n**Complexitate:** O(n^2)",
    cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;vector<long long> r;for(int i=0;i<n;i++){bool vazut=false;for(int j=0;j<i;j++)if(a[j]==a[i]){vazut=true;break;}if(!vazut)r.push_back(a[i]);}cout<<r.size()<<\"\\n\";for(size_t i=0;i<r.size();i++){if(i)cout<<\" \";cout<<r[i];}return 0;}\n",
    py: "n = int(input())\na = list(map(int, input().split()))\nr = []\nvazute = set()\nfor x in a:\n    if x not in vazute:\n        r.append(x)\n        vazute.add(x)\nprint(len(r))\nprint(\" \".join(map(str, r)))\n",
    tests: [
      "1\n5",
      "5\n1 2 2 3 3",
      "5\n1 1 1 1 1",
      "6\n5 4 3 2 1 5",
      "4\n0 0 -1 -1",
      "7\n1 2 1 3 1 4 1",
      "3\n1000000000 1000000000 -1000000000",
      "8\n1 2 3 4 5 6 7 8",
    ],
  },
  {
    slug: "inserarea-unui-element-la-inceputul-vectorului",
    title: "Inserarea unui element la inceputul vectorului",
    statement: "Se citesc un numar natural n, un vector cu n numere intregi si o valoare x. Insereaza x la inceputul vectorului si afiseaza vectorul obtinut.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu. Pe a treia linie se afla numarul intreg x.",
    output_format: "Afiseaza pe prima linie noul numar de elemente, iar pe a doua linie elementele vectorului obtinut, separate printr-un spatiu.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i], x <= 10^9",
    difficulty: "easy",
    tags: ["stergeri-inserari", "inserare"],
    hints: "Afiseaza mai intai x, apoi toate elementele vectorului initial, in ordine.",
    explanation: "Construiesti rezultatul punand x pe prima pozitie, urmat de toate elementele vectorului initial in ordinea lor.\n\n**Complexitate:** O(n)",
    cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&v:a)cin>>v;long long x;cin>>x;cout<<n+1<<\"\\n\"<<x;for(int i=0;i<n;i++)cout<<\" \"<<a[i];return 0;}\n",
    py: "n = int(input())\na = list(map(int, input().split()))\nx = int(input())\nr = [x] + a\nprint(len(r))\nprint(\" \".join(map(str, r)))\n",
    tests: [
      "1\n5\n9",
      "5\n1 2 3 4 5\n0",
      "3\n-1 -2 -3\n100",
      "4\n0 0 0 0\n-5",
      "2\n1000000000 -1000000000\n5",
      "6\n10 20 30 40 50 60\n-1",
      "1\n0\n0",
      "7\n1 2 3 4 5 6 7\n8",
    ],
  },
  {
    slug: "inserarea-unui-element-la-sfarsitul-vectorului",
    title: "Inserarea unui element la sfarsitul vectorului",
    statement: "Se citesc un numar natural n, un vector cu n numere intregi si o valoare x. Insereaza x la sfarsitul vectorului si afiseaza vectorul obtinut.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu. Pe a treia linie se afla numarul intreg x.",
    output_format: "Afiseaza pe prima linie noul numar de elemente, iar pe a doua linie elementele vectorului obtinut, separate printr-un spatiu.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i], x <= 10^9",
    difficulty: "easy",
    tags: ["stergeri-inserari", "inserare"],
    hints: "Afiseaza toate elementele vectorului initial, apoi x la final.",
    explanation: "Construiesti rezultatul punand toate elementele vectorului initial, urmate de x pe ultima pozitie.\n\n**Complexitate:** O(n)",
    cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&v:a)cin>>v;long long x;cin>>x;cout<<n+1<<\"\\n\";for(int i=0;i<n;i++)cout<<a[i]<<\" \";cout<<x;return 0;}\n",
    py: "n = int(input())\na = list(map(int, input().split()))\nx = int(input())\nr = a + [x]\nprint(len(r))\nprint(\" \".join(map(str, r)))\n",
    tests: [
      "1\n5\n9",
      "5\n1 2 3 4 5\n0",
      "3\n-1 -2 -3\n100",
      "4\n0 0 0 0\n-5",
      "2\n1000000000 -1000000000\n5",
      "6\n10 20 30 40 50 60\n-1",
      "1\n0\n0",
      "7\n1 2 3 4 5 6 7\n8",
    ],
  },
  {
    slug: "inserarea-unui-element-intr-un-vector-sortat",
    title: "Inserarea unui element intr-un vector sortat",
    statement: "Se citesc un numar natural n, un vector cu n numere intregi sortat crescator si o valoare x. Insereaza x pe pozitia corecta astfel incat vectorul sa ramana sortat crescator (daca exista deja elemente egale cu x, x se insereaza dupa acestea). Afiseaza vectorul obtinut.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, sortate crescator, separate prin spatiu. Pe a treia linie se afla numarul intreg x.",
    output_format: "Afiseaza pe prima linie noul numar de elemente, iar pe a doua linie elementele vectorului sortat obtinut, separate printr-un spatiu.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i], x <= 10^9",
    difficulty: "medium",
    tags: ["stergeri-inserari", "inserare"],
    hints: "Cauta primul indice de la care elementele vectorului sunt strict mai mari decat x si insereaza x acolo.",
    explanation: "Parcurgi vectorul sortat pana gasesti primul element strict mai mare decat x; acolo insereaza x, astfel incat ordinea crescatoare sa ramana valabila.\n\n**Complexitate:** O(n)",
    cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&v:a)cin>>v;long long x;cin>>x;int idx=n;for(int i=0;i<n;i++)if(a[i]>x){idx=i;break;}vector<long long> r;for(int i=0;i<idx;i++)r.push_back(a[i]);r.push_back(x);for(int i=idx;i<n;i++)r.push_back(a[i]);cout<<r.size()<<\"\\n\";for(size_t i=0;i<r.size();i++){if(i)cout<<\" \";cout<<r[i];}return 0;}\n",
    py: "import bisect\nn = int(input())\na = list(map(int, input().split()))\nx = int(input())\nidx = bisect.bisect_right(a, x)\nr = a[:idx] + [x] + a[idx:]\nprint(len(r))\nprint(\" \".join(map(str, r)))\n",
    tests: [
      "1\n5\n3",
      "1\n5\n7",
      "5\n1 2 3 4 5\n0",
      "5\n1 2 3 4 5\n10",
      "5\n1 2 3 4 5\n3",
      "6\n1 1 1 2 2 3\n1",
      "4\n-5 -3 0 3\n-4",
      "3\n2 2 2\n2",
    ],
  },
  {
    slug: "stergerea-primei-aparitii-a-celui-mai-mare-element",
    title: "Stergerea primei aparitii a celui mai mare element",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Determina valoarea maxima din vector si sterge doar prima ei aparitie. Afiseaza vectorul obtinut.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu.",
    output_format: "Afiseaza pe prima linie noul numar de elemente, iar pe a doua linie elementele vectorului obtinut, separate printr-un spatiu.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["stergeri-inserari", "stergere", "maxime-minime"],
    hints: "Gaseste mai intai valoarea maxima, apoi indicele primei sale aparitii, si sterge doar acel indice.",
    explanation: "Determini maximul vectorului, gasesti primul indice pe care apare, apoi construiesti rezultatul din toate elementele mai putin cel de pe acest indice.\n\n**Complexitate:** O(n)",
    cpp: "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&v:a)cin>>v;long long mx=*max_element(a.begin(),a.end());int idx=-1;for(int i=0;i<n;i++)if(a[i]==mx){idx=i;break;}vector<long long> r;for(int i=0;i<n;i++)if(i!=idx)r.push_back(a[i]);cout<<r.size()<<\"\\n\";for(size_t i=0;i<r.size();i++){if(i)cout<<\" \";cout<<r[i];}return 0;}\n",
    py: "n = int(input())\na = list(map(int, input().split()))\nr = list(a)\nr.remove(max(a))\nprint(len(r))\nprint(\" \".join(map(str, r)))\n",
    tests: [
      "1\n5",
      "5\n1 5 3 5 2",
      "5\n3 3 3 3 3",
      "4\n-1 -2 -3 -4",
      "6\n10 20 30 20 10 5",
      "3\n7 8 9",
      "7\n1 2 3 4 5 6 7",
      "2\n1000000000 -1000000000",
    ],
  },
  {
    slug: "stergerea-primei-aparitii-a-celui-mai-mic-element",
    title: "Stergerea primei aparitii a celui mai mic element",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Determina valoarea minima din vector si sterge doar prima ei aparitie. Afiseaza vectorul obtinut.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu.",
    output_format: "Afiseaza pe prima linie noul numar de elemente, iar pe a doua linie elementele vectorului obtinut, separate printr-un spatiu.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["stergeri-inserari", "stergere", "maxime-minime"],
    hints: "Gaseste mai intai valoarea minima, apoi indicele primei sale aparitii, si sterge doar acel indice.",
    explanation: "Determini minimul vectorului, gasesti primul indice pe care apare, apoi construiesti rezultatul din toate elementele mai putin cel de pe acest indice.\n\n**Complexitate:** O(n)",
    cpp: "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&v:a)cin>>v;long long mn=*min_element(a.begin(),a.end());int idx=-1;for(int i=0;i<n;i++)if(a[i]==mn){idx=i;break;}vector<long long> r;for(int i=0;i<n;i++)if(i!=idx)r.push_back(a[i]);cout<<r.size()<<\"\\n\";for(size_t i=0;i<r.size();i++){if(i)cout<<\" \";cout<<r[i];}return 0;}\n",
    py: "n = int(input())\na = list(map(int, input().split()))\nr = list(a)\nr.remove(min(a))\nprint(len(r))\nprint(\" \".join(map(str, r)))\n",
    tests: [
      "1\n5",
      "5\n1 5 3 5 2",
      "5\n3 3 3 3 3",
      "4\n-1 -2 -3 -4",
      "6\n10 20 30 20 10 5",
      "3\n7 8 9",
      "7\n1 2 3 4 5 6 7",
      "2\n1000000000 -1000000000",
    ],
  },
  {
    slug: "inserarea-unei-valori-intre-fiecare-doua-elemente-consecutive",
    title: "Inserarea unei valori intre fiecare doua elemente consecutive",
    statement: "Se citesc un numar natural n, un vector cu n numere intregi si o valoare x. Insereaza valoarea x intre fiecare doua elemente consecutive ale vectorului (nu se adauga nimic inainte de primul element sau dupa ultimul). Afiseaza vectorul obtinut. Daca n este 1, vectorul ramane neschimbat.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu. Pe a treia linie se afla numarul intreg x.",
    output_format: "Afiseaza pe prima linie noul numar de elemente, iar pe a doua linie elementele vectorului obtinut, separate printr-un spatiu.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i], x <= 10^9",
    difficulty: "medium",
    tags: ["stergeri-inserari", "inserare"],
    hints: "Adauga primul element, apoi pentru fiecare element urmator adauga mai intai x, apoi elementul.",
    explanation: "Adaugi primul element in rezultat, apoi pentru fiecare element urmator adaugi mai intai x si apoi elementul respectiv, astfel incat x sa apara exact intre fiecare doua elemente consecutive.\n\n**Complexitate:** O(n)",
    cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&v:a)cin>>v;long long x;cin>>x;vector<long long> r;if(n>0){r.push_back(a[0]);for(int i=1;i<n;i++){r.push_back(x);r.push_back(a[i]);}}cout<<r.size()<<\"\\n\";for(size_t i=0;i<r.size();i++){if(i)cout<<\" \";cout<<r[i];}return 0;}\n",
    py: "n = int(input())\na = list(map(int, input().split()))\nx = int(input())\nr = []\nif n > 0:\n    r.append(a[0])\n    for i in range(1, n):\n        r.append(x)\n        r.append(a[i])\nprint(len(r))\nprint(\" \".join(map(str, r)))\n",
    tests: [
      "1\n5\n9",
      "2\n1 2\n0",
      "5\n1 2 3 4 5\n9",
      "3\n-1 -2 -3\n100",
      "4\n0 0 0 0\n-5",
      "6\n10 20 30 40 50 60\n-1",
      "1\n0\n0",
      "7\n1 2 3 4 5 6 7\n8",
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
        console.error(`  TEST ${i}: cpp execution failed: ${JSON.stringify(cppOut)} (input len=${input.length})`);
        allOk = false;
        continue;
      }
      if (pyOut.verdict !== "AC") {
        console.error(`  TEST ${i}: python execution failed: ${JSON.stringify(pyOut)} (input len=${input.length})`);
        allOk = false;
        continue;
      }

      const normCpp = normalize(cppOut.stdout);
      const normPy = normalize(pyOut.stdout);
      if (normCpp !== normPy) {
        console.error(`  TEST ${i}: MISMATCH cpp="${normCpp.slice(0, 200)}" python="${normPy.slice(0, 200)}" (input len=${input.length})`);
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
