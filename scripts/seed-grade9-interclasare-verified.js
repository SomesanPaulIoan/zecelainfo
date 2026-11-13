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

const CHAPTER = { level: "grade9", chapter: "tablouri-uni", sub: "interclasare" };

const IN_2ARR_ASC = "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, sortate crescator (nu neaparat distincte). Pe a treia linie se afla numarul natural m. Pe a patra linie se afla m numere intregi, sortate crescator (nu neaparat distincte).";
const IN_2ARR_DESC = "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, sortate descrescator (nu neaparat distincte). Pe a treia linie se afla numarul natural m. Pe a patra linie se afla m numere intregi, sortate descrescator (nu neaparat distincte).";
const IN_3ARR_ASC = "Pe prima linie se afla n si urmeaza pe linia urmatoare cei n termeni ai primului vector (sortat crescator). Analog, pe liniile 3-4 se afla m si al doilea vector, iar pe liniile 5-6 se afla p si al treilea vector (ambele sortate crescator).";
const IN_2SETS = "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, distincte doua cate doua si sortate crescator (multimea A). Pe a treia linie se afla numarul natural m. Pe a patra linie se afla m numere intregi, distincte doua cate doua si sortate crescator (multimea B).";
const IN_2MULTISET = "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere naturale, nu neaparat distincte si nu neaparat sortate (multisetul A). Pe a treia linie se afla numarul natural m. Pe a patra linie se afla m numere naturale, nu neaparat distincte si nu neaparat sortate (multisetul B).";

const OUT_LIST_MINUS1 = "Afiseaza elementele rezultate, in ordine crescatoare, separate printr-un spatiu. Daca rezultatul este multimea vida, afiseaza -1.";
const OUT_LIST_ASC = "Afiseaza elementele vectorului interclasat, in ordine crescatoare, separate printr-un spatiu.";
const OUT_LIST_DESC = "Afiseaza elementele vectorului interclasat, in ordine descrescatoare, separate printr-un spatiu.";
const OUT_COUNT = "Afiseaza un singur numar natural, reprezentand raspunsul cerut.";
const OUT_YESNO = "Afiseaza DA daca proprietatea este verificata, respectiv NU in caz contrar.";

const problems = [
  {
    slug: "interclasarea-clasica-a-doi-vectori-sortati-crescator",
    title: "Interclasarea clasica a doi vectori sortati crescator",
    statement: "Se dau doi vectori, fiecare sortat crescator (pot contine si duplicate). Interclasati cei doi vectori intr-un singur vector sortat crescator, care sa contina toate elementele celor doi vectori initiali (inclusiv duplicatele).",
    input_format: IN_2ARR_ASC,
    output_format: OUT_LIST_ASC,
    constraints: "1 <= n, m <= 1000, -10^9 <= a[i], b[i] <= 10^9",
    difficulty: "easy",
    tags: ["interclasare", "doi-pointeri"],
    hints: "Foloseste tehnica celor doi pointeri: compara elementele curente din cei doi vectori si avanseaza mereu in vectorul cu elementul mai mic, fara sa mai fie nevoie sa sortezi din nou la final.",
    explanation: "Parcurgi simultan cei doi vectori cu doi indici, alegand la fiecare pas elementul mai mic dintre cele doua elemente curente; cand un vector se termina, adaugi restul celuilalt. Aceasta este interclasarea clasica, pasul de baza din algoritmul MergeSort.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <iterator>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long> b(m);for(auto&x:b)cin>>x;vector<long long> res;merge(a.begin(),a.end(),b.begin(),b.end(),back_inserter(res));for(size_t k=0;k<res.size();k++){if(k)cout<<" ";cout<<res[k];}cout<<"\\n";return 0;}\n`,
    py: `import heapq\nn = int(input()); a = list(map(int, input().split()))\nm = int(input()); b = list(map(int, input().split()))\nres = list(heapq.merge(a, b))\nprint(" ".join(map(str, res)))\n`,
    tests: [
      "5\n1 3 5 7 9\n5\n2 4 6 8 10",
      "3\n1 1 2\n4\n1 2 2 3",
      "1\n5\n1\n5",
      "4\n-5 -3 -1 0\n3\n-4 -2 2",
      "1\n1000000000\n1\n-1000000000",
      "5\n1 2 3 4 5\n1\n0",
      "2\n0 0\n2\n0 0",
      "6\n1 1 1 1 1 1\n1\n1",
    ],
  },
  {
    slug: "interclasarea-clasica-a-doi-vectori-sortati-descrescator",
    title: "Interclasarea clasica a doi vectori sortati descrescator",
    statement: "Se dau doi vectori, fiecare sortat descrescator (pot contine si duplicate). Interclasati cei doi vectori intr-un singur vector sortat descrescator, care sa contina toate elementele celor doi vectori initiali (inclusiv duplicatele).",
    input_format: IN_2ARR_DESC,
    output_format: OUT_LIST_DESC,
    constraints: "1 <= n, m <= 1000, -10^9 <= a[i], b[i] <= 10^9",
    difficulty: "easy",
    tags: ["interclasare", "doi-pointeri"],
    hints: "Aceeasi tehnica a celor doi pointeri, dar de data aceasta alegi la fiecare pas elementul mai mare dintre cele doua elemente curente.",
    explanation: "Parcurgi simultan cei doi vectori cu doi indici, alegand la fiecare pas elementul mai mare dintre cele doua elemente curente.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <iterator>\n#include <functional>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long> b(m);for(auto&x:b)cin>>x;vector<long long> res;merge(a.begin(),a.end(),b.begin(),b.end(),back_inserter(res),greater<long long>());for(size_t k=0;k<res.size();k++){if(k)cout<<" ";cout<<res[k];}cout<<"\\n";return 0;}\n`,
    py: `import heapq\nn = int(input()); a = list(map(int, input().split()))\nm = int(input()); b = list(map(int, input().split()))\nres = list(heapq.merge(a, b, reverse=True))\nprint(" ".join(map(str, res)))\n`,
    tests: [
      "5\n9 7 5 3 1\n5\n10 8 6 4 2",
      "3\n2 1 1\n4\n3 2 2 1",
      "1\n5\n1\n5",
      "4\n0 -1 -3 -5\n3\n2 -2 -4",
      "1\n1000000000\n1\n-1000000000",
      "5\n5 4 3 2 1\n1\n0",
      "2\n0 0\n2\n0 0",
      "6\n1 1 1 1 1 1\n1\n1",
    ],
  },
  {
    slug: "interclasarea-clasica-a-trei-vectori-sortati-crescator",
    title: "Interclasarea clasica a trei vectori sortati crescator",
    statement: "Se dau trei vectori, fiecare sortat crescator (pot contine si duplicate). Interclasati cei trei vectori intr-un singur vector sortat crescator, care sa contina toate elementele celor trei vectori initiali.",
    input_format: IN_3ARR_ASC,
    output_format: OUT_LIST_ASC,
    constraints: "1 <= n, m, p <= 1000, -10^9 <= elemente <= 10^9",
    difficulty: "medium",
    tags: ["interclasare", "doi-pointeri"],
    hints: "Interclaseaza primii doi vectori intr-un rezultat intermediar, apoi interclaseaza acel rezultat cu al treilea vector, folosind de doua ori tehnica celor doi pointeri.",
    explanation: "Aplici interclasarea clasica de doua ori: intai intre primii doi vectori, obtinand un vector intermediar sortat, apoi intre acest vector intermediar si al treilea vector.\n\n**Complexitate:** O(n + m + p)",
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <iterator>\nusing namespace std;\nvector<long long> mergeTwo(const vector<long long>&a, const vector<long long>&b){vector<long long> r;merge(a.begin(),a.end(),b.begin(),b.end(),back_inserter(r));return r;}\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long> b(m);for(auto&x:b)cin>>x;int p;cin>>p;vector<long long> c(p);for(auto&x:c)cin>>x;vector<long long> ab=mergeTwo(a,b);vector<long long> res=mergeTwo(ab,c);for(size_t k=0;k<res.size();k++){if(k)cout<<" ";cout<<res[k];}cout<<"\\n";return 0;}\n`,
    py: `import heapq\nn = int(input()); a = list(map(int, input().split()))\nm = int(input()); b = list(map(int, input().split()))\np = int(input()); c = list(map(int, input().split()))\nres = list(heapq.merge(a, b, c))\nprint(" ".join(map(str, res)))\n`,
    tests: [
      "3\n1 4 7\n3\n2 5 8\n3\n3 6 9",
      "2\n1 1\n2\n1 1\n2\n1 1",
      "1\n5\n1\n3\n1\n1",
      "4\n-5 -3 -1 0\n2\n-4 2\n3\n-2 1 3",
      "1\n1000000000\n1\n0\n1\n-1000000000",
      "3\n1 2 3\n1\n0\n1\n100",
      "2\n0 0\n2\n0 0\n2\n0 0",
      "5\n1 1 2 2 3\n1\n2\n1\n2",
    ],
  },
  {
    slug: "reuniunea-a-doua-multimi-sortate",
    title: "Reuniunea a doua multimi",
    statement: "Se dau doua multimi de numere intregi, A si B, fiecare reprezentata printr-un vector cu elemente distincte, sortat crescator. Determinati reuniunea A U B.",
    input_format: IN_2SETS,
    output_format: OUT_LIST_ASC,
    constraints: "1 <= n, m <= 1000, -10^9 <= a[i], b[i] <= 10^9",
    difficulty: "easy",
    tags: ["interclasare", "multimi", "reuniune"],
    hints: "Interclaseaza cei doi vectori ca la o interclasare clasica, dar de fiecare data cand cele doua elemente curente sunt egale, adaugi valoarea o singura data.",
    explanation: "Parcurgi simultan cele doua multimi (deja sortate si fara duplicate) cu doi indici: daca elementele curente sunt egale, adaugi valoarea o singura data si avansezi ambii indici; altfel adaugi elementul mai mic si avansezi doar indicele corespunzator.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <iterator>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long> b(m);for(auto&x:b)cin>>x;vector<long long> aa=a,bb=b;sort(aa.begin(),aa.end());aa.erase(unique(aa.begin(),aa.end()),aa.end());sort(bb.begin(),bb.end());bb.erase(unique(bb.begin(),bb.end()),bb.end());vector<long long> res;set_union(aa.begin(),aa.end(),bb.begin(),bb.end(),back_inserter(res));if(res.empty()){cout<<-1<<"\\n";}else{for(size_t k=0;k<res.size();k++){if(k)cout<<" ";cout<<res[k];}cout<<"\\n";}return 0;}\n`,
    py: `n = int(input()); a = list(map(int, input().split()))\nm = int(input()); b = list(map(int, input().split()))\nres = sorted(set(a) | set(b))\nprint(-1 if not res else " ".join(map(str, res)))\n`,
    tests: [
      "5\n1 2 3 4 5\n5\n4 5 6 7 8",
      "3\n1 2 3\n3\n4 5 6",
      "1\n5\n1\n5",
      "4\n-5 -3 -1 0\n4\n-4 -2 0 2",
      "1\n-1000000000\n1\n1000000000",
      "2\n1 2\n2\n1 2",
      "3\n1 3 5\n3\n2 4 6",
      "5\n-2 -1 0 1 2\n1\n0",
    ],
  },
  {
    slug: "intersectia-a-doua-multimi-sortate",
    title: "Intersectia a doua multimi",
    statement: "Se dau doua multimi de numere intregi, A si B, fiecare reprezentata printr-un vector cu elemente distincte, sortat crescator. Determinati intersectia A ^ B (elementele comune celor doua multimi).",
    input_format: IN_2SETS,
    output_format: OUT_LIST_MINUS1,
    constraints: "1 <= n, m <= 1000, -10^9 <= a[i], b[i] <= 10^9",
    difficulty: "easy",
    tags: ["interclasare", "multimi", "intersectie"],
    hints: "Parcurge cele doua multimi sortate cu doi pointeri: cand elementele curente sunt egale, acea valoare face parte din intersectie.",
    explanation: "Parcurgi simultan cele doua multimi cu doi indici: daca elementele curente sunt egale, adaugi valoarea in rezultat si avansezi ambii indici; altfel avansezi doar indicele corespunzator elementului mai mic.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <iterator>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long> b(m);for(auto&x:b)cin>>x;vector<long long> aa=a,bb=b;sort(aa.begin(),aa.end());aa.erase(unique(aa.begin(),aa.end()),aa.end());sort(bb.begin(),bb.end());bb.erase(unique(bb.begin(),bb.end()),bb.end());vector<long long> res;set_intersection(aa.begin(),aa.end(),bb.begin(),bb.end(),back_inserter(res));if(res.empty()){cout<<-1<<"\\n";}else{for(size_t k=0;k<res.size();k++){if(k)cout<<" ";cout<<res[k];}cout<<"\\n";}return 0;}\n`,
    py: `n = int(input()); a = list(map(int, input().split()))\nm = int(input()); b = list(map(int, input().split()))\nres = sorted(set(a) & set(b))\nprint(-1 if not res else " ".join(map(str, res)))\n`,
    tests: [
      "5\n1 2 3 4 5\n5\n4 5 6 7 8",
      "3\n1 2 3\n3\n4 5 6",
      "1\n5\n1\n5",
      "4\n-5 -3 -1 0\n4\n-4 -3 0 2",
      "1\n-1000000000\n1\n1000000000",
      "2\n1 2\n2\n1 2",
      "5\n1 2 3 4 5\n3\n2 4 6",
      "5\n-2 -1 0 1 2\n1\n0",
    ],
  },
  {
    slug: "diferenta-multimilor-a-minus-b",
    title: "Diferenta multimilor A - B",
    statement: "Se dau doua multimi de numere intregi, A si B, fiecare reprezentata printr-un vector cu elemente distincte, sortat crescator. Determinati diferenta A - B (elementele din A care nu se afla in B).",
    input_format: IN_2SETS,
    output_format: OUT_LIST_MINUS1,
    constraints: "1 <= n, m <= 1000, -10^9 <= a[i], b[i] <= 10^9",
    difficulty: "easy",
    tags: ["interclasare", "multimi", "diferenta"],
    hints: "Parcurge cele doua multimi cu doi pointeri; un element din A intra in rezultat doar daca nu are corespondent egal in B.",
    explanation: "Parcurgi simultan cele doua multimi cu doi indici: daca elementul curent din A este mai mic decat cel din B, il adaugi in rezultat (nu exista in B) si avansezi in A; daca sunt egale, avansezi ambii indici (elementul exista in B, deci nu intra in rezultat); altfel avansezi doar in B.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <iterator>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long> b(m);for(auto&x:b)cin>>x;vector<long long> aa=a,bb=b;sort(aa.begin(),aa.end());aa.erase(unique(aa.begin(),aa.end()),aa.end());sort(bb.begin(),bb.end());bb.erase(unique(bb.begin(),bb.end()),bb.end());vector<long long> res;set_difference(aa.begin(),aa.end(),bb.begin(),bb.end(),back_inserter(res));if(res.empty()){cout<<-1<<"\\n";}else{for(size_t k=0;k<res.size();k++){if(k)cout<<" ";cout<<res[k];}cout<<"\\n";}return 0;}\n`,
    py: `n = int(input()); a = list(map(int, input().split()))\nm = int(input()); b = list(map(int, input().split()))\nres = sorted(set(a) - set(b))\nprint(-1 if not res else " ".join(map(str, res)))\n`,
    tests: [
      "5\n1 2 3 4 5\n5\n4 5 6 7 8",
      "3\n1 2 3\n3\n4 5 6",
      "1\n5\n1\n5",
      "4\n-5 -3 -1 0\n4\n-4 -3 0 2",
      "1\n-1000000000\n1\n1000000000",
      "2\n1 2\n2\n1 2",
      "5\n1 2 3 4 5\n3\n2 4 6",
      "5\n-2 -1 0 1 2\n1\n0",
    ],
  },
  {
    slug: "diferenta-multimilor-b-minus-a",
    title: "Diferenta multimilor B - A",
    statement: "Se dau doua multimi de numere intregi, A si B, fiecare reprezentata printr-un vector cu elemente distincte, sortat crescator. Determinati diferenta B - A (elementele din B care nu se afla in A).",
    input_format: IN_2SETS,
    output_format: OUT_LIST_MINUS1,
    constraints: "1 <= n, m <= 1000, -10^9 <= a[i], b[i] <= 10^9",
    difficulty: "easy",
    tags: ["interclasare", "multimi", "diferenta"],
    hints: "Este exact ca diferenta A - B, dar cu rolurile celor doi vectori inversate.",
    explanation: "Parcurgi simultan cele doua multimi cu doi indici, de data aceasta adaugand in rezultat elementele din B care nu au corespondent egal in A.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <iterator>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long> b(m);for(auto&x:b)cin>>x;vector<long long> aa=a,bb=b;sort(aa.begin(),aa.end());aa.erase(unique(aa.begin(),aa.end()),aa.end());sort(bb.begin(),bb.end());bb.erase(unique(bb.begin(),bb.end()),bb.end());vector<long long> res;set_difference(bb.begin(),bb.end(),aa.begin(),aa.end(),back_inserter(res));if(res.empty()){cout<<-1<<"\\n";}else{for(size_t k=0;k<res.size();k++){if(k)cout<<" ";cout<<res[k];}cout<<"\\n";}return 0;}\n`,
    py: `n = int(input()); a = list(map(int, input().split()))\nm = int(input()); b = list(map(int, input().split()))\nres = sorted(set(b) - set(a))\nprint(-1 if not res else " ".join(map(str, res)))\n`,
    tests: [
      "5\n1 2 3 4 5\n5\n4 5 6 7 8",
      "3\n1 2 3\n3\n4 5 6",
      "1\n5\n1\n5",
      "4\n-5 -3 -1 0\n4\n-4 -3 0 2",
      "1\n-1000000000\n1\n1000000000",
      "2\n1 2\n2\n1 2",
      "3\n2 4 6\n5\n1 2 3 4 5",
      "1\n0\n5\n-2 -1 0 1 2",
    ],
  },
  {
    slug: "diferenta-simetrica-a-doua-multimi",
    title: "Diferenta simetrica a doua multimi",
    statement: "Se dau doua multimi de numere intregi, A si B, fiecare reprezentata printr-un vector cu elemente distincte, sortat crescator. Determinati diferenta simetrica A Delta B (elementele care apartin exact uneia dintre cele doua multimi).",
    input_format: IN_2SETS,
    output_format: OUT_LIST_MINUS1,
    constraints: "1 <= n, m <= 1000, -10^9 <= a[i], b[i] <= 10^9",
    difficulty: "medium",
    tags: ["interclasare", "multimi", "diferenta-simetrica"],
    hints: "Diferenta simetrica contine elementele care se afla in exact una dintre multimi: cele care difera atunci cand parcurgi cu doi pointeri, dar nu si cele egale.",
    explanation: "Parcurgi simultan cele doua multimi cu doi indici: cand elementele curente difera, adaugi elementul mai mic in rezultat si avansezi indicele corespunzator; cand sunt egale, avansezi ambii indici fara sa adaugi nimic (elementul se afla in ambele multimi, deci nu face parte din diferenta simetrica).\n\n**Complexitate:** O(n + m)",
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <iterator>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long> b(m);for(auto&x:b)cin>>x;vector<long long> aa=a,bb=b;sort(aa.begin(),aa.end());aa.erase(unique(aa.begin(),aa.end()),aa.end());sort(bb.begin(),bb.end());bb.erase(unique(bb.begin(),bb.end()),bb.end());vector<long long> res;set_symmetric_difference(aa.begin(),aa.end(),bb.begin(),bb.end(),back_inserter(res));if(res.empty()){cout<<-1<<"\\n";}else{for(size_t k=0;k<res.size();k++){if(k)cout<<" ";cout<<res[k];}cout<<"\\n";}return 0;}\n`,
    py: `n = int(input()); a = list(map(int, input().split()))\nm = int(input()); b = list(map(int, input().split()))\nres = sorted(set(a) ^ set(b))\nprint(-1 if not res else " ".join(map(str, res)))\n`,
    tests: [
      "5\n1 2 3 4 5\n5\n4 5 6 7 8",
      "3\n1 2 3\n3\n4 5 6",
      "1\n5\n1\n5",
      "4\n-5 -3 -1 0\n4\n-4 -3 0 2",
      "1\n-1000000000\n1\n1000000000",
      "2\n1 2\n2\n1 2",
      "5\n1 2 3 4 5\n3\n2 4 6",
      "5\n-2 -1 0 1 2\n1\n0",
    ],
  },
  {
    slug: "reuniunea-a-doua-multiseturi",
    title: "Reuniunea a doua multiseturi",
    statement: "Se dau doua multiseturi de numere naturale A si B (elementele pot fi repetate). Multiplicitatea unei valori in reuniunea a doua multiseturi este maximul dintre multiplicitatile ei in A si in B. Determinati reuniunea multiseturilor A si B, afisand fiecare valoare de tot atatea ori cat este multiplicitatea ei rezultata.",
    input_format: IN_2MULTISET,
    output_format: OUT_LIST_MINUS1,
    constraints: "1 <= n, m <= 1000, 0 <= a[i], b[i] <= 1000000",
    difficulty: "medium",
    tags: ["interclasare", "multiseturi"],
    hints: "Numara de cate ori apare fiecare valoare in A si in B (foloseste o structura de tip map/dictionar), apoi pentru fiecare valoare distincta pastreaza maximul celor doua numaratori.",
    explanation: "Construiesti cate o structura de frecventa pentru A si pentru B, apoi pentru fiecare valoare distincta care apare in cel putin unul dintre multiseturi calculezi maximul celor doua frecvente si afisezi valoarea de atatea ori, in ordine crescatoare a valorilor.\n\n**Complexitate:** O((n + m) log(n + m))",
    cpp: `#include <iostream>\n#include <vector>\n#include <map>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long> b(m);for(auto&x:b)cin>>x;map<long long,long long> fa,fb;for(auto x:a)fa[x]++;for(auto x:b)fb[x]++;map<long long,long long> res=fa;for(auto&kv:fb) res[kv.first]=max(res[kv.first],kv.second);vector<long long> out;for(auto&kv:res) for(long long t=0;t<kv.second;t++) out.push_back(kv.first);if(out.empty()){cout<<-1<<"\\n";}else{for(size_t k=0;k<out.size();k++){if(k)cout<<" ";cout<<out[k];}cout<<"\\n";}return 0;}\n`,
    py: `from collections import Counter\nn = int(input()); a = list(map(int, input().split()))\nm = int(input()); b = list(map(int, input().split()))\nfa = Counter(a); fb = Counter(b)\nout = []\nfor v in sorted(set(fa) | set(fb)):\n    c = max(fa.get(v, 0), fb.get(v, 0))\n    out.extend([v] * c)\nprint(-1 if not out else " ".join(map(str, out)))\n`,
    tests: [
      "3\n1 1 2\n3\n1 2 2",
      "4\n5 5 5 5\n3\n5 5 5",
      "1\n7\n1\n9",
      "5\n1 2 2 3 3\n5\n2 3 3 4 4",
      "1\n0\n1\n0",
      "3\n1000000 1000000 1\n2\n1000000 2",
      "4\n1 1 1 1\n1\n1",
      "3\n1 2 3\n3\n1 2 3",
    ],
  },
  {
    slug: "intersectia-a-doua-multiseturi",
    title: "Intersectia a doua multiseturi",
    statement: "Se dau doua multiseturi de numere naturale A si B (elementele pot fi repetate). Multiplicitatea unei valori in intersectia a doua multiseturi este minimul dintre multiplicitatile ei in A si in B. Determinati intersectia multiseturilor A si B, afisand fiecare valoare de tot atatea ori cat este multiplicitatea ei rezultata.",
    input_format: IN_2MULTISET,
    output_format: OUT_LIST_MINUS1,
    constraints: "1 <= n, m <= 1000, 0 <= a[i], b[i] <= 1000000",
    difficulty: "medium",
    tags: ["interclasare", "multiseturi"],
    hints: "O valoare face parte din intersectie doar daca apare in ambele multiseturi; multiplicitatea ei in rezultat este minimul celor doua numaratori.",
    explanation: "Construiesti frecventele pentru A si pentru B, apoi pentru fiecare valoare care apare in ambele multiseturi calculezi minimul celor doua frecvente si afisezi valoarea de atatea ori, in ordine crescatoare.\n\n**Complexitate:** O((n + m) log(n + m))",
    cpp: `#include <iostream>\n#include <vector>\n#include <map>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long> b(m);for(auto&x:b)cin>>x;map<long long,long long> fa,fb;for(auto x:a)fa[x]++;for(auto x:b)fb[x]++;vector<long long> out;for(auto&kv:fa){auto it=fb.find(kv.first);if(it!=fb.end()){long long c=min(kv.second,it->second);for(long long t=0;t<c;t++) out.push_back(kv.first);}}if(out.empty()){cout<<-1<<"\\n";}else{for(size_t k=0;k<out.size();k++){if(k)cout<<" ";cout<<out[k];}cout<<"\\n";}return 0;}\n`,
    py: `from collections import Counter\nn = int(input()); a = list(map(int, input().split()))\nm = int(input()); b = list(map(int, input().split()))\nfa = Counter(a); fb = Counter(b)\nout = []\nfor v in sorted(set(fa) & set(fb)):\n    c = min(fa[v], fb[v])\n    out.extend([v] * c)\nprint(-1 if not out else " ".join(map(str, out)))\n`,
    tests: [
      "3\n1 1 2\n3\n1 2 2",
      "4\n5 5 5 5\n3\n5 5 5",
      "1\n7\n1\n9",
      "5\n1 2 2 3 3\n5\n2 3 3 4 4",
      "1\n0\n1\n0",
      "3\n1000000 1000000 1\n2\n1000000 2",
      "4\n1 1 1 1\n1\n1",
      "3\n1 2 3\n3\n1 2 3",
    ],
  },
  {
    slug: "suma-a-doua-multiseturi",
    title: "Suma a doua multiseturi",
    statement: "Se dau doua multiseturi de numere naturale A si B (elementele pot fi repetate). Multiplicitatea unei valori in suma a doua multiseturi este suma multiplicitatilor ei in A si in B. Determinati suma multiseturilor A si B, afisand fiecare valoare de tot atatea ori cat este multiplicitatea ei rezultata.",
    input_format: IN_2MULTISET,
    output_format: OUT_LIST_MINUS1,
    constraints: "1 <= n, m <= 1000, 0 <= a[i], b[i] <= 1000000",
    difficulty: "easy",
    tags: ["interclasare", "multiseturi"],
    hints: "Suma a doua multiseturi este pur si simplu reuniunea tuturor elementelor lor (fiecare valoare apare de atatea ori cat apare in total in A si in B).",
    explanation: "Construiesti frecventele pentru A si pentru B, apoi pentru fiecare valoare distincta aduni cele doua frecvente si afisezi valoarea de atatea ori, in ordine crescatoare. Practic este echivalent cu a concatena si sorta cei doi vectori.\n\n**Complexitate:** O((n + m) log(n + m))",
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long> b(m);for(auto&x:b)cin>>x;vector<long long> out=a;out.insert(out.end(),b.begin(),b.end());sort(out.begin(),out.end());for(size_t k=0;k<out.size();k++){if(k)cout<<" ";cout<<out[k];}cout<<"\\n";return 0;}\n`,
    py: `n = int(input()); a = list(map(int, input().split()))\nm = int(input()); b = list(map(int, input().split()))\nout = sorted(a + b)\nprint(" ".join(map(str, out)))\n`,
    tests: [
      "3\n1 1 2\n3\n1 2 2",
      "4\n5 5 5 5\n3\n5 5 5",
      "1\n7\n1\n9",
      "5\n1 2 2 3 3\n5\n2 3 3 4 4",
      "1\n0\n1\n0",
      "3\n1000000 1000000 1\n2\n1000000 2",
      "4\n1 1 1 1\n1\n1",
      "3\n1 2 3\n3\n1 2 3",
    ],
  },
  {
    slug: "diferenta-a-doua-multiseturi-a-minus-b",
    title: "Diferenta a doua multiseturi A - B",
    statement: "Se dau doua multiseturi de numere naturale A si B (elementele pot fi repetate). Multiplicitatea unei valori in diferenta A - B este multiplicitatea ei in A, diminuata cu multiplicitatea ei in B (dar nu mai putin de 0). Determinati diferenta multiseturilor A - B, afisand fiecare valoare de tot atatea ori cat este multiplicitatea ei rezultata.",
    input_format: IN_2MULTISET,
    output_format: OUT_LIST_MINUS1,
    constraints: "1 <= n, m <= 1000, 0 <= a[i], b[i] <= 1000000",
    difficulty: "medium",
    tags: ["interclasare", "multiseturi"],
    hints: "Pentru fiecare valoare din A, scade din multiplicitatea ei in A multiplicitatea ei in B; daca rezultatul este negativ, considera-l 0.",
    explanation: "Construiesti frecventele pentru A si pentru B, apoi pentru fiecare valoare distincta din A calculezi diferenta dintre frecventa ei in A si cea in B (minim 0) si afisezi valoarea de atatea ori, in ordine crescatoare.\n\n**Complexitate:** O((n + m) log(n + m))",
    cpp: `#include <iostream>\n#include <vector>\n#include <map>\n#include <algorithm>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long> b(m);for(auto&x:b)cin>>x;map<long long,long long> fa,fb;for(auto x:a)fa[x]++;for(auto x:b)fb[x]++;vector<long long> out;for(auto&kv:fa){long long c=max(0LL,kv.second-fb[kv.first]);for(long long t=0;t<c;t++) out.push_back(kv.first);}if(out.empty()){cout<<-1<<"\\n";}else{for(size_t k=0;k<out.size();k++){if(k)cout<<" ";cout<<out[k];}cout<<"\\n";}return 0;}\n`,
    py: `from collections import Counter\nn = int(input()); a = list(map(int, input().split()))\nm = int(input()); b = list(map(int, input().split()))\nfa = Counter(a); fb = Counter(b)\nout = []\nfor v in sorted(fa):\n    c = max(0, fa[v] - fb.get(v, 0))\n    out.extend([v] * c)\nprint(-1 if not out else " ".join(map(str, out)))\n`,
    tests: [
      "3\n1 1 2\n3\n1 2 2",
      "4\n5 5 5 5\n3\n5 5 5",
      "1\n7\n1\n9",
      "5\n1 2 2 3 3\n5\n2 3 3 4 4",
      "1\n0\n1\n0",
      "3\n1000000 1000000 1\n2\n1000000 2",
      "4\n1 1 1 1\n1\n1",
      "3\n1 2 3\n3\n1 2 3",
    ],
  },
  {
    slug: "cardinalul-reuniunii-a-doua-multimi",
    title: "Cardinalul reuniunii a doua multimi",
    statement: "Se dau doua multimi de numere intregi, A si B, fiecare reprezentata printr-un vector cu elemente distincte, sortat crescator. Determinati numarul de elemente al reuniunii A U B.",
    input_format: IN_2SETS,
    output_format: OUT_COUNT,
    constraints: "1 <= n, m <= 1000, -10^9 <= a[i], b[i] <= 10^9",
    difficulty: "easy",
    tags: ["interclasare", "multimi", "reuniune"],
    hints: "Nu este nevoie sa construiesti efectiv reuniunea; numara direct cate valori distincte apar in cel putin una dintre cele doua multimi.",
    explanation: "Calculezi reuniunea celor doua multimi (de exemplu prin interclasare cu doi pointeri) si afisezi doar numarul ei de elemente.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <iterator>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long> b(m);for(auto&x:b)cin>>x;vector<long long> aa=a,bb=b;sort(aa.begin(),aa.end());aa.erase(unique(aa.begin(),aa.end()),aa.end());sort(bb.begin(),bb.end());bb.erase(unique(bb.begin(),bb.end()),bb.end());vector<long long> res;set_union(aa.begin(),aa.end(),bb.begin(),bb.end(),back_inserter(res));cout<<res.size()<<"\\n";return 0;}\n`,
    py: `n = int(input()); a = list(map(int, input().split()))\nm = int(input()); b = list(map(int, input().split()))\nprint(len(set(a) | set(b)))\n`,
    tests: [
      "5\n1 2 3 4 5\n5\n4 5 6 7 8",
      "3\n1 2 3\n3\n4 5 6",
      "1\n5\n1\n5",
      "4\n-5 -3 -1 0\n4\n-4 -2 0 2",
      "1\n-1000000000\n1\n1000000000",
      "2\n1 2\n2\n1 2",
      "3\n1 3 5\n3\n2 4 6",
      "5\n-2 -1 0 1 2\n1\n0",
    ],
  },
  {
    slug: "cardinalul-intersectiei-a-doua-multimi",
    title: "Cardinalul intersectiei a doua multimi",
    statement: "Se dau doua multimi de numere intregi, A si B, fiecare reprezentata printr-un vector cu elemente distincte, sortat crescator. Determinati numarul de elemente comune celor doua multimi (cardinalul intersectiei A ^ B).",
    input_format: IN_2SETS,
    output_format: OUT_COUNT,
    constraints: "1 <= n, m <= 1000, -10^9 <= a[i], b[i] <= 10^9",
    difficulty: "easy",
    tags: ["interclasare", "multimi", "intersectie"],
    hints: "Numara direct cate valori apar in ambele multimi, fara sa mai construiesti explicit vectorul intersectiei.",
    explanation: "Calculezi intersectia celor doua multimi (de exemplu prin doi pointeri) si afisezi doar numarul ei de elemente; daca nu exista elemente comune, raspunsul este 0.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <iterator>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long> b(m);for(auto&x:b)cin>>x;vector<long long> aa=a,bb=b;sort(aa.begin(),aa.end());aa.erase(unique(aa.begin(),aa.end()),aa.end());sort(bb.begin(),bb.end());bb.erase(unique(bb.begin(),bb.end()),bb.end());vector<long long> res;set_intersection(aa.begin(),aa.end(),bb.begin(),bb.end(),back_inserter(res));cout<<res.size()<<"\\n";return 0;}\n`,
    py: `n = int(input()); a = list(map(int, input().split()))\nm = int(input()); b = list(map(int, input().split()))\nprint(len(set(a) & set(b)))\n`,
    tests: [
      "5\n1 2 3 4 5\n5\n4 5 6 7 8",
      "3\n1 2 3\n3\n4 5 6",
      "1\n5\n1\n5",
      "4\n-5 -3 -1 0\n4\n-4 -3 0 2",
      "1\n-1000000000\n1\n1000000000",
      "2\n1 2\n2\n1 2",
      "5\n1 2 3 4 5\n3\n2 4 6",
      "5\n-2 -1 0 1 2\n1\n0",
    ],
  },
  {
    slug: "numarul-de-elemente-doar-in-multimea-a",
    title: "Numarul de elemente care apar doar in multimea A",
    statement: "Se dau doua multimi de numere intregi, A si B, fiecare reprezentata printr-un vector cu elemente distincte, sortat crescator. Determinati cate elemente din A nu se afla si in B (cardinalul diferentei A - B).",
    input_format: IN_2SETS,
    output_format: OUT_COUNT,
    constraints: "1 <= n, m <= 1000, -10^9 <= a[i], b[i] <= 10^9",
    difficulty: "easy",
    tags: ["interclasare", "multimi", "diferenta"],
    hints: "Numara elementele din A care nu au corespondent egal in B.",
    explanation: "Calculezi diferenta A - B (de exemplu prin doi pointeri) si afisezi doar numarul ei de elemente.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <iterator>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long> b(m);for(auto&x:b)cin>>x;vector<long long> aa=a,bb=b;sort(aa.begin(),aa.end());aa.erase(unique(aa.begin(),aa.end()),aa.end());sort(bb.begin(),bb.end());bb.erase(unique(bb.begin(),bb.end()),bb.end());vector<long long> res;set_difference(aa.begin(),aa.end(),bb.begin(),bb.end(),back_inserter(res));cout<<res.size()<<"\\n";return 0;}\n`,
    py: `n = int(input()); a = list(map(int, input().split()))\nm = int(input()); b = list(map(int, input().split()))\nprint(len(set(a) - set(b)))\n`,
    tests: [
      "5\n1 2 3 4 5\n5\n4 5 6 7 8",
      "3\n1 2 3\n3\n4 5 6",
      "1\n5\n1\n5",
      "4\n-5 -3 -1 0\n4\n-4 -3 0 2",
      "1\n-1000000000\n1\n1000000000",
      "2\n1 2\n2\n1 2",
      "5\n1 2 3 4 5\n3\n2 4 6",
      "5\n-2 -1 0 1 2\n1\n0",
    ],
  },
  {
    slug: "numarul-de-elemente-doar-in-multimea-b",
    title: "Numarul de elemente care apar doar in multimea B",
    statement: "Se dau doua multimi de numere intregi, A si B, fiecare reprezentata printr-un vector cu elemente distincte, sortat crescator. Determinati cate elemente din B nu se afla si in A (cardinalul diferentei B - A).",
    input_format: IN_2SETS,
    output_format: OUT_COUNT,
    constraints: "1 <= n, m <= 1000, -10^9 <= a[i], b[i] <= 10^9",
    difficulty: "easy",
    tags: ["interclasare", "multimi", "diferenta"],
    hints: "Numara elementele din B care nu au corespondent egal in A.",
    explanation: "Calculezi diferenta B - A (de exemplu prin doi pointeri) si afisezi doar numarul ei de elemente.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <iterator>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long> b(m);for(auto&x:b)cin>>x;vector<long long> aa=a,bb=b;sort(aa.begin(),aa.end());aa.erase(unique(aa.begin(),aa.end()),aa.end());sort(bb.begin(),bb.end());bb.erase(unique(bb.begin(),bb.end()),bb.end());vector<long long> res;set_difference(bb.begin(),bb.end(),aa.begin(),aa.end(),back_inserter(res));cout<<res.size()<<"\\n";return 0;}\n`,
    py: `n = int(input()); a = list(map(int, input().split()))\nm = int(input()); b = list(map(int, input().split()))\nprint(len(set(b) - set(a)))\n`,
    tests: [
      "5\n1 2 3 4 5\n5\n4 5 6 7 8",
      "3\n1 2 3\n3\n4 5 6",
      "1\n5\n1\n5",
      "4\n-5 -3 -1 0\n4\n-4 -3 0 2",
      "1\n-1000000000\n1\n1000000000",
      "2\n1 2\n2\n1 2",
      "3\n2 4 6\n5\n1 2 3 4 5",
      "1\n0\n5\n-2 -1 0 1 2",
    ],
  },
  {
    slug: "numarul-de-elemente-din-diferenta-simetrica",
    title: "Numarul de elemente din diferenta simetrica",
    statement: "Se dau doua multimi de numere intregi, A si B, fiecare reprezentata printr-un vector cu elemente distincte, sortat crescator. Determinati cate elemente apartin exact uneia dintre cele doua multimi (cardinalul diferentei simetrice A Delta B).",
    input_format: IN_2SETS,
    output_format: OUT_COUNT,
    constraints: "1 <= n, m <= 1000, -10^9 <= a[i], b[i] <= 10^9",
    difficulty: "medium",
    tags: ["interclasare", "multimi", "diferenta-simetrica"],
    hints: "Diferenta simetrica se poate obtine si ca (marimea reuniunii) minus (marimea intersectiei).",
    explanation: "Calculezi diferenta simetrica a celor doua multimi (de exemplu prin doi pointeri, sau ca dimensiunea reuniunii minus dimensiunea intersectiei) si afisezi numarul ei de elemente.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <iterator>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long> b(m);for(auto&x:b)cin>>x;vector<long long> aa=a,bb=b;sort(aa.begin(),aa.end());aa.erase(unique(aa.begin(),aa.end()),aa.end());sort(bb.begin(),bb.end());bb.erase(unique(bb.begin(),bb.end()),bb.end());vector<long long> res;set_symmetric_difference(aa.begin(),aa.end(),bb.begin(),bb.end(),back_inserter(res));cout<<res.size()<<"\\n";return 0;}\n`,
    py: `n = int(input()); a = list(map(int, input().split()))\nm = int(input()); b = list(map(int, input().split()))\nprint(len(set(a) ^ set(b)))\n`,
    tests: [
      "5\n1 2 3 4 5\n5\n4 5 6 7 8",
      "3\n1 2 3\n3\n4 5 6",
      "1\n5\n1\n5",
      "4\n-5 -3 -1 0\n4\n-4 -3 0 2",
      "1\n-1000000000\n1\n1000000000",
      "2\n1 2\n2\n1 2",
      "5\n1 2 3 4 5\n3\n2 4 6",
      "5\n-2 -1 0 1 2\n1\n0",
    ],
  },
  {
    slug: "multimile-sunt-egale",
    title: "Verificati daca doua multimi sunt egale",
    statement: "Se dau doua multimi de numere intregi, A si B, fiecare reprezentata printr-un vector cu elemente distincte, sortat crescator. Verificati daca cele doua multimi sunt egale (contin exact aceleasi elemente).",
    input_format: IN_2SETS,
    output_format: OUT_YESNO,
    constraints: "1 <= n, m <= 1000, -10^9 <= a[i], b[i] <= 10^9",
    difficulty: "easy",
    tags: ["interclasare", "multimi", "egalitate"],
    hints: "Doua multimi sortate si fara duplicate sunt egale daca si numai daca au acelasi numar de elemente si elementele coincid pe fiecare pozitie.",
    explanation: "Daca n != m, multimile nu pot fi egale. Altfel, compari element cu element cele doua vectori sortati.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long> b(m);for(auto&x:b)cin>>x;vector<long long> aa=a,bb=b;sort(aa.begin(),aa.end());aa.erase(unique(aa.begin(),aa.end()),aa.end());sort(bb.begin(),bb.end());bb.erase(unique(bb.begin(),bb.end()),bb.end());cout<<((aa==bb)?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input()); a = list(map(int, input().split()))\nm = int(input()); b = list(map(int, input().split()))\nprint("DA" if sorted(set(a)) == sorted(set(b)) else "NU")\n`,
    tests: [
      "3\n1 2 3\n3\n1 2 3",
      "3\n1 2 3\n3\n1 2 4",
      "1\n5\n1\n5",
      "4\n-2 -1 0 1\n4\n-2 -1 0 1",
      "3\n1 2 3\n4\n1 2 3 4",
      "2\n1 2\n2\n2 1",
      "1\n-1000000000\n1\n1000000000",
      "5\n1 2 3 4 5\n5\n5 4 3 2 1",
    ],
  },
  {
    slug: "multimea-a-este-submultime-a-multimii-b",
    title: "Verificati daca A este submultime a lui B",
    statement: "Se dau doua multimi de numere intregi, A si B, fiecare reprezentata printr-un vector cu elemente distincte, sortat crescator. Verificati daca A este submultime a lui B, adica fiecare element din A se afla si in B.",
    input_format: IN_2SETS,
    output_format: OUT_YESNO,
    constraints: "1 <= n, m <= 1000, -10^9 <= a[i], b[i] <= 10^9",
    difficulty: "easy",
    tags: ["interclasare", "multimi", "submultime"],
    hints: "Pentru fiecare element din A, verifica daca exista in B (de exemplu prin cautare binara, deoarece B este sortat).",
    explanation: "Pentru fiecare element al lui A cauti (binar, deoarece B este sortat) daca se afla in B; daca toate elementele lui A sunt gasite, A este submultime a lui B.\n\n**Complexitate:** O(n log m)",
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long> b(m);for(auto&x:b)cin>>x;vector<long long> aa=a,bb=b;sort(aa.begin(),aa.end());aa.erase(unique(aa.begin(),aa.end()),aa.end());sort(bb.begin(),bb.end());bb.erase(unique(bb.begin(),bb.end()),bb.end());bool ok=includes(bb.begin(),bb.end(),aa.begin(),aa.end());cout<<(ok?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input()); a = list(map(int, input().split()))\nm = int(input()); b = list(map(int, input().split()))\nprint("DA" if set(a) <= set(b) else "NU")\n`,
    tests: [
      "3\n1 2 3\n5\n1 2 3 4 5",
      "3\n1 2 6\n5\n1 2 3 4 5",
      "1\n5\n1\n5",
      "2\n-2 -1\n4\n-2 -1 0 1",
      "5\n1 2 3 4 5\n3\n1 2 3",
      "1\n0\n3\n-1 0 1",
      "1\n-1000000000\n2\n-1000000000 1000000000",
      "3\n1 2 3\n3\n4 5 6",
    ],
  },
  {
    slug: "multimile-sunt-disjuncte",
    title: "Verificati daca doua multimi sunt disjuncte",
    statement: "Se dau doua multimi de numere intregi, A si B, fiecare reprezentata printr-un vector cu elemente distincte, sortat crescator. Verificati daca cele doua multimi sunt disjuncte, adica nu au niciun element comun.",
    input_format: IN_2SETS,
    output_format: OUT_YESNO,
    constraints: "1 <= n, m <= 1000, -10^9 <= a[i], b[i] <= 10^9",
    difficulty: "easy",
    tags: ["interclasare", "multimi", "disjuncte"],
    hints: "Doua multimi sunt disjuncte daca intersectia lor este vida; poti verifica acest lucru cu doi pointeri, fara sa mai construiesti explicit intersectia.",
    explanation: "Parcurgi cele doua multimi cu doi pointeri, cautand un element comun; daca gasesti unul, multimile nu sunt disjuncte.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <iterator>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long> b(m);for(auto&x:b)cin>>x;vector<long long> aa=a,bb=b;sort(aa.begin(),aa.end());aa.erase(unique(aa.begin(),aa.end()),aa.end());sort(bb.begin(),bb.end());bb.erase(unique(bb.begin(),bb.end()),bb.end());vector<long long> inter;set_intersection(aa.begin(),aa.end(),bb.begin(),bb.end(),back_inserter(inter));cout<<(inter.empty()?"DA":"NU")<<"\\n";return 0;}\n`,
    py: `n = int(input()); a = list(map(int, input().split()))\nm = int(input()); b = list(map(int, input().split()))\nprint("DA" if set(a).isdisjoint(set(b)) else "NU")\n`,
    tests: [
      "3\n1 2 3\n3\n4 5 6",
      "3\n1 2 3\n3\n3 4 5",
      "1\n5\n1\n5",
      "1\n5\n1\n6",
      "4\n-2 -1 0 1\n4\n2 3 4 5",
      "2\n1 2\n2\n1 2",
      "1\n-1000000000\n1\n1000000000",
      "5\n1 2 3 4 5\n3\n2 4 6",
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
