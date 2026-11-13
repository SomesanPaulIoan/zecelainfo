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

const CHAPTER = { level: "grade9", chapter: "tablouri-uni", sub: "vectori-frecventa" };

const IN_FMT_1 = "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu.";
const IN_FMT_K = "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu. Pe a treia linie se afla numarul natural nenul k.";
const OUT_NUM = "Afiseaza un singur numar natural.";

const CPP_HEAD = `#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <climits>\n#include <map>\n#include <unordered_map>\nusing namespace std;\n`;
function C(body) {
  return `${CPP_HEAD}int main(){${body}return 0;}\n`;
}
function CH(helpers, body) {
  return `${CPP_HEAD}${helpers}int main(){${body}return 0;}\n`;
}

const READ_NA_CPP = `int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;`;
const READ_NA_PY = `n = int(input())\na = list(map(int, input().split()))\n`;
const READ_K_CPP = `long long k;cin>>k;`;
const READ_K_PY = `k = int(input())\n`;
const READ_FREQ_CPP = `unordered_map<long long,long long> freq;for(auto x:a)freq[x]++;`;
const READ_FREQ_PY = `freq = {}\nfor x in a:\n    freq[x] = freq.get(x, 0) + 1\n`;

const IS_PRIME_CPP = `bool isPrime(long long x){ if(x<2) return false; for(long long d=2; d*d<=x; d++) if(x%d==0) return false; return true; }\n`;
const IS_PRIME_PY = `def is_prime(x):\n    if x < 2:\n        return False\n    d = 2\n    while d * d <= x:\n        if x % d == 0:\n            return False\n        d += 1\n    return True\n\n`;

const problems = [
  {
    slug: "frecventa-unei-valori-date",
    title: "Frecventa unei valori date",
    statement: "Se citesc un numar natural n, un vector cu n numere intregi si un numar intreg x. Determinati de cate ori apare valoarea x in vector.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, separate prin spatiu. Pe a treia linie se afla numarul intreg x.",
    output_format: OUT_NUM,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9, -10^9 <= x <= 10^9",
    difficulty: "easy",
    tags: ["frecventa"],
    hints: "Parcurge vectorul si numara de cate ori intalnesti valoarea x.",
    explanation: "Se parcurge vectorul o singura data si se numara aparitiile valorii x.\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_NA_CPP}long long x;cin>>x;long long cnt=0;for(auto v:a)if(v==x)cnt++;cout<<cnt<<"\\n";`),
    py: `${READ_NA_PY}x = int(input())\ncnt = sum(1 for v in a if v == x)\nprint(cnt)\n`,
    tests: [
      "6\n1 2 3 2 2 4\n2",
      "5\n1 2 3 4 5\n7",
      "5\n7 7 7 7 7\n7",
      "1\n5\n5",
      "1\n5\n6",
      "8\n-1 -1 2 3 -1 4 -1 5\n-1",
      "6\n1000000000 1 2 1000000000 3 1000000000\n1000000000",
      "7\n0 0 0 1 1 0 2\n0",
    ],
  },
  {
    slug: "valoarea-cu-frecventa-maxima",
    title: "Valoarea cu frecventa maxima",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Determinati valoarea care apare cel mai des in vector. Daca exista mai multe valori cu aceeasi frecventa maxima, afisati cea mai mica dintre ele.",
    input_format: IN_FMT_1,
    output_format: "Afiseaza un singur numar intreg: valoarea ceruta.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["frecventa"],
    hints: "Calculeaza frecventa fiecarei valori distincte, apoi parcurge valorile distincte in ordine crescatoare pentru a alege deterministic cea mai mica valoare cu frecventa maxima.",
    explanation: "Se calculeaza frecventa fiecarei valori distincte, apoi valorile distincte se sorteaza crescator si se parcurg in aceasta ordine, retinand prima valoare care atinge frecventa maxima (folosind comparatie stricta).\n\n**Complexitate:** O(n log n)",
    cpp: C(`${READ_NA_CPP}${READ_FREQ_CPP}vector<long long> vals;for(auto&kv:freq)vals.push_back(kv.first);sort(vals.begin(),vals.end());long long best=vals[0],bestF=freq[vals[0]];for(auto v:vals){if(freq[v]>bestF){bestF=freq[v];best=v;}}cout<<best<<"\\n";`),
    py: `${READ_NA_PY}${READ_FREQ_PY}vals = sorted(freq.keys())\nbest = vals[0]\nbest_f = freq[vals[0]]\nfor v in vals:\n    if freq[v] > best_f:\n        best_f = freq[v]\n        best = v\nprint(best)\n`,
    tests: [
      "6\n1 2 2 3 3 3",
      "5\n1 2 3 4 5",
      "5\n7 7 7 7 7",
      "1\n5",
      "6\n2 1 2 1 3 3",
      "8\n-1 -1 2 3 -1 4 -1 5",
      "6\n1000000000 1 2 1000000000 3 1000000000",
      "7\n0 0 0 1 1 0 2",
    ],
  },
  {
    slug: "valoarea-cu-frecventa-minima",
    title: "Valoarea cu frecventa minima",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Determinati valoarea care apare cel mai rar in vector. Daca exista mai multe valori cu aceeasi frecventa minima, afisati cea mai mica dintre ele.",
    input_format: IN_FMT_1,
    output_format: "Afiseaza un singur numar intreg: valoarea ceruta.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["frecventa"],
    hints: "Calculeaza frecventa fiecarei valori distincte, apoi parcurge valorile distincte in ordine crescatoare pentru a alege deterministic cea mai mica valoare cu frecventa minima.",
    explanation: "Se calculeaza frecventa fiecarei valori distincte, apoi valorile distincte se sorteaza crescator si se parcurg in aceasta ordine, retinand prima valoare care scade strict frecventa minima.\n\n**Complexitate:** O(n log n)",
    cpp: C(`${READ_NA_CPP}${READ_FREQ_CPP}vector<long long> vals;for(auto&kv:freq)vals.push_back(kv.first);sort(vals.begin(),vals.end());long long best=vals[0],bestF=freq[vals[0]];for(auto v:vals){if(freq[v]<bestF){bestF=freq[v];best=v;}}cout<<best<<"\\n";`),
    py: `${READ_NA_PY}${READ_FREQ_PY}vals = sorted(freq.keys())\nbest = vals[0]\nbest_f = freq[vals[0]]\nfor v in vals:\n    if freq[v] < best_f:\n        best_f = freq[v]\n        best = v\nprint(best)\n`,
    tests: [
      "6\n1 2 2 3 3 3",
      "5\n1 2 3 4 5",
      "5\n7 7 7 7 7",
      "1\n5",
      "6\n2 1 2 1 3 3",
      "8\n-1 -1 2 3 -1 4 -1 5",
      "6\n1000000000 1 2 1000000000 3 1000000000",
      "7\n0 0 0 1 1 0 2",
    ],
  },
  {
    slug: "numarul-de-valori-distincte",
    title: "Numarul de valori distincte",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Determinati cate valori distincte apar in vector.",
    input_format: IN_FMT_1,
    output_format: OUT_NUM,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["frecventa"],
    hints: "Retine valorile intr-o structura care elimina automat duplicatele (multime sau tabela de frecventa).",
    explanation: "Se construieste o tabela de frecventa a valorilor din vector; numarul de valori distincte este numarul de chei din tabela.\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_NA_CPP}${READ_FREQ_CPP}cout<<(long long)freq.size()<<"\\n";`),
    py: `${READ_NA_PY}${READ_FREQ_PY}print(len(freq))\n`,
    tests: [
      "6\n1 2 2 3 3 3",
      "5\n1 2 3 4 5",
      "5\n7 7 7 7 7",
      "1\n5",
      "6\n2 1 2 1 3 3",
      "8\n-1 -1 2 3 -1 4 -1 5",
      "6\n1000000000 1 2 1000000000 3 1000000000",
      "7\n0 0 0 1 1 0 2",
    ],
  },
  {
    slug: "numarul-de-elemente-care-apar-o-singura-data",
    title: "Numarul de valori care apar o singura data",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Determinati cate valori distincte din vector apar exact o singura data (nu se repeta).",
    input_format: IN_FMT_1,
    output_format: OUT_NUM,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["frecventa"],
    hints: "Calculeaza frecventa fiecarei valori si numara cate dintre ele au frecventa egala cu 1.",
    explanation: "Se construieste tabela de frecventa, apoi se numara valorile distincte a caror frecventa este exact 1.\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_NA_CPP}${READ_FREQ_CPP}long long cnt=0;for(auto&kv:freq)if(kv.second==1)cnt++;cout<<cnt<<"\\n";`),
    py: `${READ_NA_PY}${READ_FREQ_PY}cnt = sum(1 for v in freq.values() if v == 1)\nprint(cnt)\n`,
    tests: [
      "6\n1 2 2 3 3 3",
      "5\n1 2 3 4 5",
      "5\n7 7 7 7 7",
      "1\n5",
      "6\n2 1 2 1 3 3",
      "8\n-1 -1 2 3 -1 4 -1 5",
      "6\n1000000000 1 2 1000000000 3 1000000000",
      "7\n0 0 0 1 1 0 2",
    ],
  },
  {
    slug: "numarul-de-elemente-cu-frecventa-exact-k",
    title: "Numarul de valori cu frecventa exact k",
    statement: "Se citesc un numar natural n, un vector cu n numere intregi si un numar natural nenul k. Determinati cate valori distincte din vector au frecventa exact egala cu k.",
    input_format: IN_FMT_K,
    output_format: OUT_NUM,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9, 1 <= k <= 1000",
    difficulty: "easy",
    tags: ["frecventa"],
    hints: "Calculeaza frecventa fiecarei valori si numara cate dintre ele au frecventa egala cu k.",
    explanation: "Se construieste tabela de frecventa, apoi se numara valorile distincte a caror frecventa este exact k.\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_NA_CPP}${READ_K_CPP}${READ_FREQ_CPP}long long cnt=0;for(auto&kv:freq)if(kv.second==k)cnt++;cout<<cnt<<"\\n";`),
    py: `${READ_NA_PY}${READ_K_PY}${READ_FREQ_PY}cnt = sum(1 for v in freq.values() if v == k)\nprint(cnt)\n`,
    tests: [
      "6\n1 2 2 3 3 3\n3",
      "5\n1 2 3 4 5\n1",
      "5\n7 7 7 7 7\n5",
      "1\n5\n1",
      "6\n2 1 2 1 3 3\n2",
      "8\n-1 -1 2 3 -1 4 -1 5\n4",
      "6\n1000000000 1 2 1000000000 3 1000000000\n3",
      "7\n0 0 0 1 1 0 2\n1",
    ],
  },
  {
    slug: "primul-element-care-se-repeta",
    title: "Primul element care se repeta",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Determinati prima valoare, in ordinea aparitiei in vector, care se mai repeta undeva mai departe (sau mai devreme) in vector. Daca nu exista nicio valoare repetata, afisati -1.",
    input_format: IN_FMT_1,
    output_format: "Afiseaza un singur numar intreg: valoarea gasita, sau -1 daca nu exista.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["frecventa"],
    hints: "Calculeaza mai intai frecventa fiecarei valori, apoi parcurge vectorul de la stanga la dreapta si opreste-te la primul element a carui frecventa este cel putin 2.",
    explanation: "Se calculeaza frecventa fiecarei valori pe tot vectorul, apoi se parcurge vectorul de la stanga la dreapta, oprindu-ne la primul element a carui frecventa totala este cel putin 2.\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_NA_CPP}${READ_FREQ_CPP}long long ans=-1;for(int i=0;i<n;i++){if(freq[a[i]]>=2){ans=a[i];break;}}cout<<ans<<"\\n";`),
    py: `${READ_NA_PY}${READ_FREQ_PY}ans = -1\nfor v in a:\n    if freq[v] >= 2:\n        ans = v\n        break\nprint(ans)\n`,
    tests: [
      "6\n1 2 3 2 4 3",
      "5\n1 2 3 4 5",
      "5\n7 7 7 7 7",
      "1\n5",
      "6\n2 1 2 1 3 3",
      "8\n5 -1 2 3 -1 4 6 5",
      "6\n1000000000 1 2 3 4 1000000000",
      "7\n0 1 2 3 4 5 6",
    ],
  },
  {
    slug: "primul-element-unic",
    title: "Primul element unic",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Determinati prima valoare, in ordinea aparitiei in vector, care apare exact o singura data in tot vectorul. Daca nu exista nicio astfel de valoare, afisati -1.",
    input_format: IN_FMT_1,
    output_format: "Afiseaza un singur numar intreg: valoarea gasita, sau -1 daca nu exista.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["frecventa"],
    hints: "Calculeaza mai intai frecventa fiecarei valori, apoi parcurge vectorul de la stanga la dreapta si opreste-te la primul element a carui frecventa este exact 1.",
    explanation: "Se calculeaza frecventa fiecarei valori pe tot vectorul, apoi se parcurge vectorul de la stanga la dreapta, oprindu-ne la primul element a carui frecventa totala este exact 1.\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_NA_CPP}${READ_FREQ_CPP}long long ans=-1;for(int i=0;i<n;i++){if(freq[a[i]]==1){ans=a[i];break;}}cout<<ans<<"\\n";`),
    py: `${READ_NA_PY}${READ_FREQ_PY}ans = -1\nfor v in a:\n    if freq[v] == 1:\n        ans = v\n        break\nprint(ans)\n`,
    tests: [
      "6\n1 2 3 2 4 3",
      "5\n1 2 3 4 5",
      "5\n7 7 7 7 7",
      "1\n5",
      "6\n2 1 2 1 3 3",
      "8\n5 -1 2 3 -1 4 6 5",
      "6\n1000000000 1 2 3 4 1000000000",
      "7\n0 1 2 3 4 5 6",
    ],
  },
  {
    slug: "toate-elementele-cu-frecventa-exact-k",
    title: "Toate valorile cu frecventa exact k",
    statement: "Se citesc un numar natural n, un vector cu n numere intregi si un numar natural nenul k. Afisati, in ordine crescatoare, toate valorile distincte din vector care au frecventa exact egala cu k. Daca nu exista nicio astfel de valoare, afisati -1.",
    input_format: IN_FMT_K,
    output_format: "Afiseaza pe o singura linie valorile gasite, in ordine crescatoare, separate prin spatiu, sau -1 daca nu exista nicio astfel de valoare.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9, 1 <= k <= 1000",
    difficulty: "easy",
    tags: ["frecventa"],
    hints: "Calculeaza frecventa fiecarei valori, retine intr-o lista valorile cu frecventa exact k, apoi sorteaz-o crescator.",
    explanation: "Se construieste tabela de frecventa, se retin in o lista valorile distincte cu frecventa exact k, iar lista se sorteaza crescator inainte de afisare.\n\n**Complexitate:** O(n log n)",
    cpp: C(`${READ_NA_CPP}${READ_K_CPP}${READ_FREQ_CPP}vector<long long> vals;for(auto&kv:freq)if(kv.second==k)vals.push_back(kv.first);sort(vals.begin(),vals.end());if(vals.empty()){cout<<-1<<"\\n";}else{for(size_t i=0;i<vals.size();i++){cout<<vals[i];if(i+1<vals.size())cout<<" ";}cout<<"\\n";}`),
    py: `${READ_NA_PY}${READ_K_PY}${READ_FREQ_PY}vals = sorted(v for v in freq if freq[v] == k)\nif not vals:\n    print(-1)\nelse:\n    print(" ".join(str(v) for v in vals))\n`,
    tests: [
      "6\n1 2 2 3 3 3\n2",
      "5\n1 2 3 4 5\n1",
      "5\n7 7 7 7 7\n5",
      "1\n5\n1",
      "6\n2 1 2 1 3 3\n2",
      "8\n-1 -1 2 3 -1 4 -1 5\n4",
      "6\n1000000000 1 2 1000000000 3 1000000000\n3",
      "9\n1 1 2 2 3 3 4 4 5\n2",
    ],
  },
  {
    slug: "diferenta-dintre-frecventa-maxima-si-minima",
    title: "Diferenta dintre frecventa maxima si frecventa minima",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Determinati diferenta dintre frecventa cea mai mare si frecventa cea mai mica, printre frecventele valorilor distincte din vector.",
    input_format: IN_FMT_1,
    output_format: OUT_NUM,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["frecventa"],
    hints: "Calculeaza frecventa fiecarei valori distincte, apoi scade cea mai mica frecventa din cea mai mare.",
    explanation: "Se construieste tabela de frecventa, apoi se determina maximul si minimul dintre valorile de frecventa si se calculeaza diferenta lor.\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_NA_CPP}${READ_FREQ_CPP}long long mx=LLONG_MIN,mn=LLONG_MAX;for(auto&kv:freq){mx=max(mx,kv.second);mn=min(mn,kv.second);}cout<<(mx-mn)<<"\\n";`),
    py: `${READ_NA_PY}${READ_FREQ_PY}vals = list(freq.values())\nprint(max(vals) - min(vals))\n`,
    tests: [
      "6\n1 2 2 3 3 3",
      "5\n1 2 3 4 5",
      "5\n7 7 7 7 7",
      "1\n5",
      "6\n2 1 2 1 3 3",
      "8\n-1 -1 2 3 -1 4 -1 5",
      "6\n1000000000 1 2 1000000000 3 1000000000",
      "9\n1 1 2 2 3 3 4 4 5",
    ],
  },
  {
    slug: "elementul-majoritar",
    title: "Elementul majoritar",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Determinati elementul majoritar din vector, adica valoarea care apare de mai mult de n/2 ori. Daca un astfel de element nu exista, afisati -1.",
    input_format: IN_FMT_1,
    output_format: "Afiseaza un singur numar intreg: elementul majoritar, sau -1 daca nu exista.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "medium",
    tags: ["frecventa"],
    hints: "Calculeaza frecventa fiecarei valori distincte si verifica daca vreuna dintre ele depaseste n/2. Un astfel de element, daca exista, este unic.",
    explanation: "Se construieste tabela de frecventa; elementul majoritar, daca exista, este singura valoare a carei frecventa depaseste n/2 (nu pot exista doua astfel de valori simultan).\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_NA_CPP}${READ_FREQ_CPP}long long ans=-1;for(auto&kv:freq)if(kv.second>n/2)ans=kv.first;cout<<ans<<"\\n";`),
    py: `${READ_NA_PY}${READ_FREQ_PY}ans = -1\nfor v, f in freq.items():\n    if f > n // 2:\n        ans = v\nprint(ans)\n`,
    tests: [
      "7\n1 1 1 1 2 3 1",
      "5\n1 2 3 4 5",
      "5\n7 7 7 7 7",
      "1\n5",
      "6\n2 1 2 1 3 3",
      "9\n5 5 5 5 1 2 3 4 5",
      "6\n1000000000 1000000000 1000000000 1 2 1000000000",
      "4\n1 1 2 2",
    ],
  },
  {
    slug: "exista-element-cu-frecventa-egala-cu-jumatate",
    title: "Exista un element cu frecventa egala cu jumatate din n",
    statement: "Se citesc un numar natural par n si un vector cu n numere intregi. Verificati daca exista o valoare in vector a carei frecventa este exact egala cu n/2.",
    input_format: IN_FMT_1,
    output_format: "Afiseaza DA daca exista o astfel de valoare, respectiv NU in caz contrar.",
    constraints: "2 <= n <= 1000, n numar par, -10^9 <= a[i] <= 10^9",
    difficulty: "medium",
    tags: ["frecventa"],
    hints: "Calculeaza frecventa fiecarei valori distincte si verifica daca vreuna dintre ele este exact egala cu n/2.",
    explanation: "Se construieste tabela de frecventa si se verifica daca exista o valoare a carei frecventa este exact n/2.\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_NA_CPP}${READ_FREQ_CPP}bool ok=false;for(auto&kv:freq)if(kv.second==n/2)ok=true;cout<<(ok?"DA":"NU")<<"\\n";`),
    py: `${READ_NA_PY}${READ_FREQ_PY}ok = any(f == n // 2 for f in freq.values())\nprint("DA" if ok else "NU")\n`,
    tests: [
      "6\n1 1 1 2 3 4",
      "6\n1 2 3 4 5 6",
      "4\n7 7 7 7",
      "2\n5 5",
      "8\n1 1 1 1 2 3 4 5",
      "10\n1 1 1 1 1 2 3 4 5 6",
      "6\n1000000000 1000000000 1000000000 1 2 3",
      "4\n1 2 1 2",
    ],
  },
  {
    slug: "al-doilea-cel-mai-frecvent-element",
    title: "Al doilea cel mai frecvent element",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Ordonati valorile distincte descrescator dupa frecventa lor, iar la frecvente egale, crescator dupa valoare. Determinati a doua valoare din aceasta ordine. Daca vectorul contine o singura valoare distincta, afisati -1.",
    input_format: IN_FMT_1,
    output_format: "Afiseaza un singur numar intreg: valoarea ceruta, sau -1 daca nu exista.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "medium",
    tags: ["frecventa"],
    hints: "Construieste perechi (valoare, frecventa) pentru fiecare valoare distincta, sorteaza-le descrescator dupa frecventa (si crescator dupa valoare la egalitate), apoi alege a doua pereche.",
    explanation: "Se construieste o lista de perechi (valoare, frecventa) pentru fiecare valoare distincta, sortata descrescator dupa frecventa si crescator dupa valoare in caz de egalitate; raspunsul este valoarea de pe a doua pozitie din aceasta lista.\n\n**Complexitate:** O(n log n)",
    cpp: C(`${READ_NA_CPP}${READ_FREQ_CPP}vector<pair<long long,long long>> items;for(auto&kv:freq)items.push_back({kv.first,kv.second});sort(items.begin(),items.end(),[](const pair<long long,long long>&x,const pair<long long,long long>&y){if(x.second!=y.second)return x.second>y.second;return x.first<y.first;});if(items.size()<2)cout<<-1<<"\\n";else cout<<items[1].first<<"\\n";`),
    py: `${READ_NA_PY}${READ_FREQ_PY}items = sorted(freq.items(), key=lambda kv: (-kv[1], kv[0]))\nif len(items) < 2:\n    print(-1)\nelse:\n    print(items[1][0])\n`,
    tests: [
      "9\n1 1 1 2 2 3 3 3 3",
      "5\n1 2 3 4 5",
      "5\n7 7 7 7 7",
      "1\n5",
      "6\n2 1 2 1 3 3",
      "8\n-1 -1 2 3 -1 4 -1 5",
      "6\n1000000000 1 2 1000000000 3 1000000000",
      "9\n1 1 2 2 3 3 4 4 5",
    ],
  },
  {
    slug: "toate-frecventele-sunt-egale",
    title: "Toate frecventele sunt egale",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Verificati daca toate valorile distincte din vector au aceeasi frecventa.",
    input_format: IN_FMT_1,
    output_format: "Afiseaza DA daca toate frecventele sunt egale, respectiv NU in caz contrar.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["frecventa"],
    hints: "Calculeaza frecventa fiecarei valori distincte si compara-le pe toate cu frecventa primului element din vector.",
    explanation: "Se construieste tabela de frecventa si se verifica daca toate valorile din tabela sunt egale intre ele.\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_NA_CPP}${READ_FREQ_CPP}long long ref=freq[a[0]];bool ok=true;for(auto&kv:freq)if(kv.second!=ref)ok=false;cout<<(ok?"DA":"NU")<<"\\n";`),
    py: `${READ_NA_PY}${READ_FREQ_PY}ref = freq[a[0]]\nok = all(f == ref for f in freq.values())\nprint("DA" if ok else "NU")\n`,
    tests: [
      "6\n1 1 2 2 3 3",
      "5\n1 2 3 4 5",
      "5\n7 7 7 7 7",
      "1\n5",
      "6\n2 1 2 1 3 3",
      "7\n1 1 2 2 3 3 3",
      "6\n1000000000 1 2 1000000000 3 1000000000",
      "9\n1 1 1 2 2 2 3 3 3",
    ],
  },
  {
    slug: "numarul-de-perechi-de-elemente-egale",
    title: "Numarul de perechi de elemente egale",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Determinati numarul de perechi de pozitii (i, j), cu i < j, pentru care a[i] este egal cu a[j].",
    input_format: IN_FMT_1,
    output_format: OUT_NUM,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "medium",
    tags: ["frecventa", "numarare"],
    hints: "Pentru fiecare valoare distincta cu frecventa f, numarul de perechi egale formate cu acea valoare este f*(f-1)/2.",
    explanation: "Se calculeaza frecventa fiecarei valori distincte, iar pentru fiecare valoare cu frecventa f se aduna la raspuns f*(f-1)/2, numarul de moduri de a alege doua pozitii cu acea valoare.\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_NA_CPP}${READ_FREQ_CPP}long long ans=0;for(auto&kv:freq){long long f=kv.second;ans+=f*(f-1)/2;}cout<<ans<<"\\n";`),
    py: `${READ_NA_PY}${READ_FREQ_PY}ans = sum(f * (f - 1) // 2 for f in freq.values())\nprint(ans)\n`,
    tests: [
      "6\n1 1 2 2 3 3",
      "5\n1 2 3 4 5",
      "5\n7 7 7 7 7",
      "1\n5",
      "6\n2 1 2 1 3 3",
      "7\n1 1 2 2 3 3 3",
      "6\n1000000000 1 2 1000000000 3 1000000000",
      "9\n1 1 1 2 2 2 3 3 3",
    ],
  },
  {
    slug: "vectorul-poate-fi-impartit-in-perechi",
    title: "Vectorul poate fi impartit in perechi egale",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Verificati daca elementele vectorului pot fi grupate in perechi de valori egale, adica fiecare valoare distincta apare de un numar par de ori.",
    input_format: IN_FMT_1,
    output_format: "Afiseaza DA daca vectorul poate fi impartit in perechi, respectiv NU in caz contrar.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "easy",
    tags: ["frecventa"],
    hints: "Calculeaza frecventa fiecarei valori distincte si verifica daca toate sunt numere pare.",
    explanation: "Se construieste tabela de frecventa si se verifica daca toate frecventele sunt pare.\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_NA_CPP}${READ_FREQ_CPP}bool ok=true;for(auto&kv:freq)if(kv.second%2!=0)ok=false;cout<<(ok?"DA":"NU")<<"\\n";`),
    py: `${READ_NA_PY}${READ_FREQ_PY}ok = all(f % 2 == 0 for f in freq.values())\nprint("DA" if ok else "NU")\n`,
    tests: [
      "6\n1 1 2 2 3 3",
      "5\n1 2 3 4 5",
      "4\n7 7 7 7",
      "2\n5 5",
      "6\n2 1 2 1 3 3",
      "7\n1 1 2 2 3 3 3",
      "8\n1000000000 1 2 1000000000 3 1000000000 2 3",
      "1\n5",
    ],
  },
  {
    slug: "numarul-de-valori-cu-frecventa-prima",
    title: "Numarul de valori cu frecventa numar prim",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Determinati cate valori distincte din vector au frecventa un numar prim.",
    input_format: IN_FMT_1,
    output_format: OUT_NUM,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "medium",
    tags: ["frecventa", "numere-prime"],
    hints: "Calculeaza frecventa fiecarei valori distincte, apoi verifica pentru fiecare daca frecventa este un numar prim.",
    explanation: "Se construieste tabela de frecventa, apoi se numara valorile distincte a caror frecventa este un numar prim.\n\n**Complexitate:** O(n * radical(n))",
    cpp: CH(IS_PRIME_CPP, `${READ_NA_CPP}${READ_FREQ_CPP}long long cnt=0;for(auto&kv:freq)if(isPrime(kv.second))cnt++;cout<<cnt<<"\\n";`),
    py: `${IS_PRIME_PY}${READ_NA_PY}${READ_FREQ_PY}cnt = sum(1 for f in freq.values() if is_prime(f))\nprint(cnt)\n`,
    tests: [
      "6\n1 1 2 2 3 3",
      "5\n1 2 3 4 5",
      "5\n7 7 7 7 7",
      "1\n5",
      "7\n2 1 2 1 3 3 3",
      "9\n5 5 1 2 3 4 6 6 6",
      "6\n1000000000 1 2 1000000000 3 1000000000",
      "10\n1 1 1 2 2 2 3 3 3 3",
    ],
  },
  {
    slug: "vector-caracteristic-cifre",
    title: "Vectorul caracteristic al cifrelor",
    statement: "Se citesc un numar natural n si un vector cu n numere naturale, fiecare cuprins intre 0 si 9. Afisati vectorul caracteristic de frecvente: de cate ori apare fiecare cifra de la 0 la 9 in vector.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere naturale intre 0 si 9, separate prin spatiu.",
    output_format: "Afiseaza pe o singura linie 10 numere naturale separate prin spatiu: de cate ori apare in vector fiecare cifra, in ordine, de la 0 la 9.",
    constraints: "1 <= n <= 1000, 0 <= a[i] <= 9",
    difficulty: "easy",
    tags: ["frecventa", "vector-caracteristic"],
    hints: "Foloseste un vector auxiliar de 10 contoare, cate unul pentru fiecare cifra de la 0 la 9.",
    explanation: "Se foloseste un vector auxiliar cnt de 10 elemente, initial 0; pentru fiecare element din vector se incrementeaza cnt[element], apoi se afiseaza cnt in ordine.\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_NA_CPP}vector<long long> cnt(10,0);for(auto x:a)cnt[x]++;for(int d=0;d<10;d++){cout<<cnt[d];if(d<9)cout<<" ";}cout<<"\\n";`),
    py: `${READ_NA_PY}cnt = [0] * 10\nfor x in a:\n    cnt[x] += 1\nprint(" ".join(str(c) for c in cnt))\n`,
    tests: [
      "6\n1 2 2 3 3 3",
      "5\n0 0 0 0 0",
      "10\n0 1 2 3 4 5 6 7 8 9",
      "1\n5",
      "6\n9 9 9 9 9 9",
      "8\n1 1 1 1 2 2 2 2",
      "9\n5 5 5 1 2 3 6 6 6",
      "12\n0 0 1 1 2 2 3 3 4 4 5 5",
    ],
  },
  {
    slug: "cea-mai-frecventa-cifra-dintr-un-vector",
    title: "Cea mai frecventa cifra dintr-un vector",
    statement: "Se citesc un numar natural n si un vector cu n numere naturale, fiecare cuprins intre 0 si 9. Determinati cifra care apare cel mai des in vector. Daca exista mai multe cifre cu aceeasi frecventa maxima, afisati cea mai mica dintre ele.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere naturale intre 0 si 9, separate prin spatiu.",
    output_format: "Afiseaza un singur numar natural: cifra ceruta.",
    constraints: "1 <= n <= 1000, 0 <= a[i] <= 9",
    difficulty: "easy",
    tags: ["frecventa", "vector-caracteristic"],
    hints: "Foloseste un vector auxiliar de 10 contoare, apoi parcurge cifrele in ordine de la 0 la 9 pentru a alege deterministic cea mai mica cifra cu frecventa maxima.",
    explanation: "Se foloseste un vector auxiliar de 10 contoare pentru cifrele 0-9; se parcurg apoi cifrele in ordine crescatoare si se retine prima care atinge frecventa maxima.\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_NA_CPP}vector<long long> cnt(10,0);for(auto x:a)cnt[x]++;long long best=0;for(int d=1;d<10;d++)if(cnt[d]>cnt[best])best=d;cout<<best<<"\\n";`),
    py: `${READ_NA_PY}cnt = [0] * 10\nfor x in a:\n    cnt[x] += 1\nbest = 0\nfor d in range(1, 10):\n    if cnt[d] > cnt[best]:\n        best = d\nprint(best)\n`,
    tests: [
      "6\n1 2 2 3 3 3",
      "5\n0 0 0 0 0",
      "10\n0 1 2 3 4 5 6 7 8 9",
      "1\n5",
      "6\n9 9 9 9 9 9",
      "8\n1 1 1 1 2 2 2 2",
      "9\n5 5 5 1 2 3 6 6 6",
      "12\n0 0 1 1 2 2 3 3 4 4 5 5",
    ],
  },
  {
    slug: "elementul-lipsa-dintr-o-permutare",
    title: "Elementul lipsa dintr-o permutare",
    statement: "Se citesc un numar natural n si un vector cu n numere naturale distincte, cuprinse intre 1 si n+1, despre care se stie ca reprezinta toate numerele din acest interval, mai putin unul singur. Determinati numarul lipsa.",
    input_format: IN_FMT_1,
    output_format: "Afiseaza un singur numar natural: valoarea lipsa.",
    constraints: "1 <= n <= 1000, valorile vectorului sunt n numere distincte din multimea {1, 2, ..., n+1}",
    difficulty: "medium",
    tags: ["frecventa", "vector-caracteristic"],
    hints: "Foloseste un vector caracteristic (de prezenta) de dimensiune n+2, marcheaza fiecare valoare intalnita, apoi cauta valoarea din intervalul 1..n+1 care nu a fost marcata.",
    explanation: "Se foloseste un vector caracteristic seen de dimensiune n+2, initial fals; pentru fiecare element din vector se marcheaza seen[element]=adevarat; apoi se cauta in intervalul 1..n+1 prima valoare nemarcata.\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_NA_CPP}vector<bool> seen(n+2,false);for(auto x:a)seen[x]=true;long long ans=-1;for(int v=1;v<=n+1;v++)if(!seen[v]){ans=v;break;}cout<<ans<<"\\n";`),
    py: `${READ_NA_PY}seen = [False] * (n + 2)\nfor x in a:\n    seen[x] = True\nans = -1\nfor v in range(1, n + 2):\n    if not seen[v]:\n        ans = v\n        break\nprint(ans)\n`,
    tests: [
      "4\n1 2 4 5",
      "1\n2",
      "1\n1",
      "5\n1 2 3 4 5",
      "5\n2 3 4 5 6",
      "6\n7 1 3 5 6 2",
      "3\n1 2 3",
      "9\n1 2 3 4 5 6 7 8",
    ],
  },
  {
    slug: "elementul-duplicat-dintr-un-vector",
    title: "Elementul duplicat dintr-un vector",
    statement: "Se citesc un numar natural n si un vector cu n numere naturale, cuprinse intre 1 si n-1, despre care se stie ca exact o valoare apare de doua ori, iar toate celelalte apar o singura data. Determinati valoarea care se repeta.",
    input_format: IN_FMT_1,
    output_format: "Afiseaza un singur numar natural: valoarea care se repeta.",
    constraints: "2 <= n <= 1000, valorile vectorului sunt din multimea {1, 2, ..., n-1}, exact o valoare apare de doua ori",
    difficulty: "medium",
    tags: ["frecventa", "vector-caracteristic"],
    hints: "Foloseste un vector de contoare de dimensiune n, numara aparitiile fiecarei valori, apoi cauta valoarea cu contorul egal cu 2.",
    explanation: "Se foloseste un vector de contoare cnt de dimensiune n; pentru fiecare element se incrementeaza cnt[element]; apoi se cauta valoarea din intervalul 1..n-1 al carei contor este exact 2.\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_NA_CPP}vector<long long> cnt(n,0);for(auto x:a)cnt[x]++;long long ans=-1;for(int v=1;v<n;v++)if(cnt[v]==2){ans=v;break;}cout<<ans<<"\\n";`),
    py: `${READ_NA_PY}cnt = [0] * n\nfor x in a:\n    cnt[x] += 1\nans = -1\nfor v in range(1, n):\n    if cnt[v] == 2:\n        ans = v\n        break\nprint(ans)\n`,
    tests: [
      "5\n1 2 4 3 2",
      "2\n1 1",
      "4\n3 1 3 2",
      "6\n1 2 3 4 5 3",
      "3\n1 1 2",
      "7\n6 1 2 3 4 5 6",
      "5\n4 4 1 2 3",
      "8\n1 2 3 4 5 6 7 4",
    ],
  },
  {
    slug: "toate-elementele-duplicate",
    title: "Toate valorile care se repeta",
    statement: "Se citesc un numar natural n si un vector cu n numere naturale, cuprinse intre 1 si n. Afisati, in ordine crescatoare, toate valorile care apar de mai mult de o data in vector. Daca nu exista nicio astfel de valoare, afisati -1.",
    input_format: IN_FMT_1,
    output_format: "Afiseaza pe o singura linie valorile gasite, in ordine crescatoare, separate prin spatiu, sau -1 daca nu exista.",
    constraints: "1 <= n <= 1000, 1 <= a[i] <= n",
    difficulty: "medium",
    tags: ["frecventa", "vector-caracteristic"],
    hints: "Foloseste un vector de contoare de dimensiune n+1, numara aparitiile fiecarei valori, apoi listeaza valorile cu contorul cel putin 2.",
    explanation: "Se foloseste un vector de contoare cnt de dimensiune n+1; pentru fiecare element se incrementeaza cnt[element]; apoi se listeaza, in ordine crescatoare, toate valorile din intervalul 1..n cu contorul cel putin 2.\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_NA_CPP}vector<long long> cnt(n+1,0);for(auto x:a)cnt[x]++;vector<long long> dups;for(int v=1;v<=n;v++)if(cnt[v]>=2)dups.push_back(v);if(dups.empty())cout<<-1<<"\\n";else{for(size_t i=0;i<dups.size();i++){cout<<dups[i];if(i+1<dups.size())cout<<" ";}cout<<"\\n";}`),
    py: `${READ_NA_PY}cnt = [0] * (n + 1)\nfor x in a:\n    cnt[x] += 1\ndups = [v for v in range(1, n + 1) if cnt[v] >= 2]\nif not dups:\n    print(-1)\nelse:\n    print(" ".join(str(v) for v in dups))\n`,
    tests: [
      "6\n1 2 2 3 4 4",
      "5\n1 2 3 4 5",
      "4\n1 1 1 1",
      "1\n1",
      "6\n3 1 2 3 1 2",
      "7\n5 5 5 1 2 3 4",
      "8\n1 2 3 4 5 6 7 8",
      "9\n1 1 2 2 3 3 4 4 5",
    ],
  },
  {
    slug: "verifica-daca-vectorul-contine-numere-consecutive",
    title: "Verifica daca valorile din vector sunt numere consecutive",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Verificati daca multimea valorilor distincte din vector formeaza un interval de numere intregi consecutive, fara nicio valoare lipsa, indiferent de ordinea sau de numarul de aparitii ale fiecarei valori.",
    input_format: IN_FMT_1,
    output_format: "Afiseaza DA daca valorile distincte sunt consecutive, respectiv NU in caz contrar.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "medium",
    tags: ["frecventa"],
    hints: "Determina valoarea minima, valoarea maxima si numarul de valori distincte; daca (maxim - minim + 1) este egal cu numarul de valori distincte, atunci acestea sunt consecutive.",
    explanation: "Se determina valoarea minima si maxima dintre valorile distincte, precum si numarul lor; daca diferenta dintre maxim si minim, plus 1, este egala cu numarul de valori distincte, atunci nu exista goluri intre ele.\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_NA_CPP}${READ_FREQ_CPP}long long mn=LLONG_MAX,mx=LLONG_MIN;for(auto&kv:freq){mn=min(mn,kv.first);mx=max(mx,kv.first);}long long distinctCount=(long long)freq.size();bool ok=((mx-mn+1)==distinctCount);cout<<(ok?"DA":"NU")<<"\\n";`),
    py: `${READ_NA_PY}${READ_FREQ_PY}mn = min(freq.keys())\nmx = max(freq.keys())\nok = (mx - mn + 1) == len(freq)\nprint("DA" if ok else "NU")\n`,
    tests: [
      "5\n3 1 2 5 4",
      "5\n1 2 4 5 6",
      "6\n2 3 2 4 3 5",
      "1\n7",
      "4\n-2 -1 0 1",
      "4\n-2 -1 0 2",
      "6\n1000000000 999999999 999999998 999999997 999999996 999999995",
      "3\n5 5 5",
    ],
  },
  {
    slug: "verifica-daca-doua-vectoare-sunt-anagrame",
    title: "Verifica daca doua vectoare au aceleasi frecvente",
    statement: "Se citesc un numar natural n si doua vectoare, fiecare cu n numere intregi. Verificati daca cele doua vectoare contin aceleasi valori, fiecare cu aceeasi frecventa (adica unul este o rearanjare a celuilalt).",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi (primul vector). Pe a treia linie se afla n numere intregi (al doilea vector).",
    output_format: "Afiseaza DA daca cele doua vectoare au aceleasi frecvente, respectiv NU in caz contrar.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i], b[i] <= 10^9",
    difficulty: "medium",
    tags: ["frecventa"],
    hints: "Construieste o singura tabela de frecventa: incrementeaz-o pentru primul vector si decrementeaz-o pentru al doilea; daca la final toate valorile sunt 0, cele doua vectoare au aceleasi frecvente.",
    explanation: "Se construieste o tabela de frecventa in care se aduna 1 pentru fiecare element din primul vector si se scade 1 pentru fiecare element din al doilea vector; daca la final toate valorile din tabela sunt 0, cele doua vectoare contin aceleasi elemente cu aceleasi frecvente.\n\n**Complexitate:** O(n)",
    cpp: `${CPP_HEAD}int main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;vector<long long> b(n);for(auto&x:b)cin>>x;unordered_map<long long,long long> freq;for(auto x:a)freq[x]++;for(auto x:b)freq[x]--;bool ok=true;for(auto&kv:freq)if(kv.second!=0)ok=false;cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input())\na = list(map(int, input().split()))\nb = list(map(int, input().split()))\nfreq = {}\nfor x in a:\n    freq[x] = freq.get(x, 0) + 1\nfor x in b:\n    freq[x] = freq.get(x, 0) - 1\nprint("DA" if all(v == 0 for v in freq.values()) else "NU")\n`,
    tests: [
      "5\n1 2 3 4 5\n5 4 3 2 1",
      "5\n1 2 3 4 5\n1 2 3 4 6",
      "4\n1 1 2 2\n1 2 1 2",
      "1\n5\n5",
      "1\n5\n6",
      "6\n1 1 2 3 3 3\n3 3 1 1 3 2",
      "6\n1000000000 1 2 3 4 5\n5 4 3 2 1 1000000000",
      "4\n1 2 2 3\n1 2 3 3",
    ],
  },
  {
    slug: "numarul-minim-de-eliminari-pentru-frecvente-distincte",
    title: "Numarul minim de eliminari pentru frecvente distincte",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Determinati numarul minim de elemente care trebuie eliminate din vector astfel incat, printre valorile ramase, oricare doua valori distincte sa aiba frecvente diferite intre ele (frecventa 0, adica eliminarea completa a unei valori, este permisa).",
    input_format: IN_FMT_1,
    output_format: OUT_NUM,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "hard",
    tags: ["frecventa", "greedy"],
    hints: "Sorteaza descrescator frecventele valorilor distincte. Parcurge-le in aceasta ordine si, daca frecventa curenta este deja folosita de o valoare procesata anterior, micsoreaz-o (elimina cate un element) pana ajunge la o frecventa nefolosita sau la 0.",
    explanation: "Se calculeaza frecventa fiecarei valori distincte si se sorteaza descrescator. Se parcurg apoi aceste frecvente, retinand intr-un vector de marcaje frecventele deja folosite; daca frecventa curenta este deja folosita, se micsoreaza (echivalent cu eliminarea unui element din vector) pana devine 0 sau o valoare neinca folosita.\n\n**Complexitate:** O(n)",
    cpp: C(`${READ_NA_CPP}${READ_FREQ_CPP}vector<long long> freqs;for(auto&kv:freq)freqs.push_back(kv.second);sort(freqs.rbegin(),freqs.rend());vector<bool> used(n+2,false);long long deletions=0;for(auto f:freqs){while(f>0&&used[f]){f--;deletions++;}if(f>0)used[f]=true;}cout<<deletions<<"\\n";`),
    py: `${READ_NA_PY}${READ_FREQ_PY}freqs = sorted(freq.values(), reverse=True)\nused = [False] * (n + 2)\ndeletions = 0\nfor f in freqs:\n    while f > 0 and used[f]:\n        f -= 1\n        deletions += 1\n    if f > 0:\n        used[f] = True\nprint(deletions)\n`,
    tests: [
      "8\n1 1 1 2 2 3 3 3",
      "5\n1 2 3 4 5",
      "5\n7 7 7 7 7",
      "1\n5",
      "6\n2 1 2 1 3 3",
      "9\n1 1 2 2 3 3 4 4 4",
      "10\n1 1 1 2 2 2 3 3 3 3",
      "12\n1 1 1 1 2 2 2 2 3 3 3 3",
    ],
  },
  {
    slug: "numarul-minim-de-eliminari-pentru-frecvente-egale",
    title: "Numarul minim de eliminari pentru frecvente egale",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Determinati numarul minim de elemente care trebuie eliminate astfel incat toate valorile distincte ramase in vector sa aiba exact aceeasi frecventa (o valoare poate fi eliminata complet din vector).",
    input_format: IN_FMT_1,
    output_format: OUT_NUM,
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "hard",
    tags: ["frecventa"],
    hints: "Pentru fiecare frecventa tinta posibila t, intre 1 si frecventa maxima, calculeaza cate elemente pot fi pastrate: pentru fiecare valoare cu frecventa cel putin t se pastreaza exact t elemente din ea, altfel se elimina complet. Alege t care maximizeaza numarul de elemente pastrate.",
    explanation: "Pentru fiecare frecventa candidata t (de la 1 la frecventa maxima), se calculeaza cate elemente ar ramane in vector daca fiecare valoare cu frecventa >= t este redusa la exact t aparitii, iar valorile cu frecventa < t sunt eliminate complet. Se alege t care maximizeaza numarul de elemente pastrate, iar raspunsul este n minus acest maxim.\n\n**Complexitate:** O(n * numarul de valori distincte)",
    cpp: C(`${READ_NA_CPP}${READ_FREQ_CPP}vector<long long> freqs;for(auto&kv:freq)freqs.push_back(kv.second);long long maxF=0;for(auto f:freqs)maxF=max(maxF,f);long long bestKept=0;for(long long t=1;t<=maxF;t++){long long kept=0;for(auto f:freqs)if(f>=t)kept+=t;bestKept=max(bestKept,kept);}cout<<((long long)n-bestKept)<<"\\n";`),
    py: `${READ_NA_PY}${READ_FREQ_PY}freqs = list(freq.values())\nmax_f = max(freqs)\nbest_kept = 0\nfor t in range(1, max_f + 1):\n    kept = sum(t for f in freqs if f >= t)\n    best_kept = max(best_kept, kept)\nprint(n - best_kept)\n`,
    tests: [
      "8\n1 1 1 2 2 3 3 3",
      "5\n1 2 3 4 5",
      "5\n7 7 7 7 7",
      "1\n5",
      "6\n2 1 2 1 3 3",
      "9\n1 1 2 2 3 3 4 4 4",
      "10\n1 1 1 2 2 2 3 3 3 3",
      "12\n1 1 1 1 2 2 3 4 4 4 4 4",
    ],
  },
  {
    slug: "cel-mai-frecvent-rest-la-impartirea-cu-k",
    title: "Cel mai frecvent rest la impartirea cu k",
    statement: "Se citesc un numar natural n, un vector cu n numere intregi si un numar natural nenul k. Determinati restul (dintre 0 si k-1) care apare cel mai des printre resturile impartirii elementelor vectorului la k. Daca exista mai multe resturi cu aceeasi frecventa maxima, afisati cel mai mic dintre ele.",
    input_format: IN_FMT_K,
    output_format: "Afiseaza un singur numar natural: restul cerut.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9, 1 <= k <= 1000",
    difficulty: "medium",
    tags: ["frecventa", "divizibilitate"],
    hints: "Foloseste un vector de k contoare, cate unul pentru fiecare rest posibil de la 0 la k-1; nu uita sa normalizezi resturile negative.",
    explanation: "Se foloseste un vector de contoare de dimensiune k; pentru fiecare element se calculeaza restul normalizat la impartirea cu k si se incrementeaza contorul corespunzator; apoi se parcurg resturile in ordine crescatoare pentru a determina deterministic restul cu frecventa maxima.\n\n**Complexitate:** O(n + k)",
    cpp: C(`${READ_NA_CPP}${READ_K_CPP}vector<long long> cnt(k,0);for(auto x:a){long long r=((x%k)+k)%k;cnt[r]++;}long long best=0;for(long long r=1;r<k;r++)if(cnt[r]>cnt[best])best=r;cout<<best<<"\\n";`),
    py: `${READ_NA_PY}${READ_K_PY}cnt = [0] * k\nfor x in a:\n    r = x % k\n    cnt[r] += 1\nbest = 0\nfor r in range(1, k):\n    if cnt[r] > cnt[best]:\n        best = r\nprint(best)\n`,
    tests: [
      "6\n1 2 3 4 5 6\n3",
      "5\n1 1 1 1 1\n2",
      "5\n5 5 5 5 5\n5",
      "1\n7\n3",
      "6\n-1 -2 -3 -4 -5 -6\n3",
      "7\n10 11 12 13 14 15 16\n7",
      "6\n1000000000 -1000000000 2 -2 3 -3\n4",
      "9\n1 2 1 2 1 2 3 3 3\n4",
    ],
  },
  {
    slug: "lista-valorilor-in-ordinea-descrescatoare-a-frecventei",
    title: "Lista valorilor in ordinea descrescatoare a frecventei",
    statement: "Se citesc un numar natural n si un vector cu n numere intregi. Afisati valorile distincte din vector ordonate descrescator dupa frecventa lor; la frecvente egale, valorile se ordoneaza crescator.",
    input_format: IN_FMT_1,
    output_format: "Afiseaza pe o singura linie valorile distincte, in ordinea ceruta, separate prin spatiu.",
    constraints: "1 <= n <= 1000, -10^9 <= a[i] <= 10^9",
    difficulty: "medium",
    tags: ["frecventa", "sortare"],
    hints: "Construieste perechi (valoare, frecventa) pentru fiecare valoare distincta si sorteaza-le dupa criteriul cerut, folosind doar valorile precalculate ale frecventei, nu recalculand-o in timpul sortarii.",
    explanation: "Se construieste o lista de perechi (valoare, frecventa), calculate o singura data inainte de sortare, apoi se sorteaza descrescator dupa frecventa si crescator dupa valoare in caz de egalitate.\n\n**Complexitate:** O(n log n)",
    cpp: C(`${READ_NA_CPP}${READ_FREQ_CPP}vector<pair<long long,long long>> items;for(auto&kv:freq)items.push_back({kv.first,kv.second});sort(items.begin(),items.end(),[](const pair<long long,long long>&x,const pair<long long,long long>&y){if(x.second!=y.second)return x.second>y.second;return x.first<y.first;});for(size_t i=0;i<items.size();i++){cout<<items[i].first;if(i+1<items.size())cout<<" ";}cout<<"\\n";`),
    py: `${READ_NA_PY}${READ_FREQ_PY}items = sorted(freq.items(), key=lambda kv: (-kv[1], kv[0]))\nprint(" ".join(str(v) for v, f in items))\n`,
    tests: [
      "9\n1 1 1 2 2 3 3 3 3",
      "5\n1 2 3 4 5",
      "5\n7 7 7 7 7",
      "1\n5",
      "6\n2 1 2 1 3 3",
      "8\n-1 -1 2 3 -1 4 -1 5",
      "6\n1000000000 1 2 1000000000 3 1000000000",
      "9\n1 1 2 2 3 3 4 4 5",
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
