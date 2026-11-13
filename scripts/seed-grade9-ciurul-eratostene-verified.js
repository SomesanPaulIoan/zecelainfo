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

const CPP_HEAD = `#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <climits>\nusing namespace std;\n`;
function C(body) {
  return `${CPP_HEAD}int main(){${body}return 0;}\n`;
}

const READ_N_CPP = `long long n;cin>>n;`;
const READ_N_PY = `n = int(input())\n`;
const READ_K_CPP = `long long k;cin>>k;`;
const READ_K_PY = `k = int(input())\n`;

// Standard sieve of Eratosthenes used purely to IDENTIFY primes up to n.
const SIEVE_COMP_CPP = `vector<bool> comp(n+1,false);for(long long p=2;p<=n;p++){if(!comp[p]){for(long long m=p*p;m<=n;m+=p)comp[m]=true;}}`;
const SIEVE_COMP_PY = `comp = [False] * (n + 1)\nfor p in range(2, n + 1):\n    if not comp[p]:\n        for m in range(p * p, n + 1, p):\n            comp[m] = True\n`;

const problems = [
  {
    slug: "ciur-lista-numerelor-prime-pana-la-n",
    title: "Ciurul lui Eratostene: lista numerelor prime pana la n",
    statement: "Se citeste un numar natural n. Folosind ciurul lui Eratostene, determinati si afisati, in ordine crescatoare, toate numerele prime mai mici sau egale cu n.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza pe o singura linie numerele prime gasite, in ordine crescatoare, separate prin spatiu, sau -1 daca nu exista niciun numar prim <= n.",
    constraints: "1 <= n <= 2000",
    difficulty: "easy",
    tags: ["divizibilitate", "ciurul-lui-eratostene"],
    hints: "Foloseste ciurul lui Eratostene: marcheaza ca fiind compuse toate multiplii fiecarui numar prim gasit, incepand de la patratul sau.",
    explanation: "Se construieste un vector de marcaje comp de dimensiune n+1. Pentru fiecare p de la 2 la n, daca p nu a fost marcat ca fiind compus, atunci p este prim, iar toti multiplii sai (incepand de la p*p) sunt marcati ca fiind compusi. La final, numerele nemarcate sunt cele prime.\n\n**Complexitate:** O(n log log n)",
    time_limit_ms: 2000,
    cpp: C(`${READ_N_CPP}${SIEVE_COMP_CPP}vector<long long> primes;for(long long p=2;p<=n;p++)if(!comp[p])primes.push_back(p);if(primes.empty())cout<<-1<<"\\n";else{for(size_t i=0;i<primes.size();i++){cout<<primes[i];if(i+1<primes.size())cout<<" ";}cout<<"\\n";}`),
    py: `${READ_N_PY}${SIEVE_COMP_PY}primes = [p for p in range(2, n + 1) if not comp[p]]\nif not primes:\n    print(-1)\nelse:\n    print(" ".join(str(p) for p in primes))\n`,
    tests: ["10", "1", "2", "3", "1000", "997", "2000", "100"],
  },
  {
    slug: "ciur-cel-mai-mic-factor-prim-al-fiecarui-numar",
    title: "Ciurul lui Eratostene: cel mai mic factor prim al fiecarui numar",
    statement: "Se citeste un numar natural n, cu n >= 2. Folosind o varianta a ciurului lui Eratostene, determinati, pentru fiecare numar de la 2 la n, cel mai mic factor prim al sau.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza pe o singura linie n-1 numere separate prin spatiu: cel mai mic factor prim al numerelor 2, 3, ..., n, in aceasta ordine.",
    constraints: "2 <= n <= 2000",
    difficulty: "medium",
    tags: ["divizibilitate", "ciurul-lui-eratostene"],
    hints: "Parcurge p de la 2 la n; daca inca nu are un factor prim atribuit, atunci p este prim, iar tuturor multiplilor sai care nu au inca un factor prim atribuit li se atribuie p.",
    explanation: "Se construieste un vector spf (smallest prime factor) de dimensiune n+1, initial 0. Pentru fiecare p de la 2 la n, daca spf[p] este inca 0, p este prim; se parcurg apoi multiplii lui p si li se atribuie spf = p, doar celor care nu au inca o valoare atribuita (astfel se retine cel mai mic factor prim).\n\n**Complexitate:** O(n log log n)",
    time_limit_ms: 2000,
    cpp: C(`${READ_N_CPP}vector<long long> spf(n+1,0);for(long long p=2;p<=n;p++){if(spf[p]==0){for(long long m=p;m<=n;m+=p){if(spf[m]==0)spf[m]=p;}}}for(long long i=2;i<=n;i++){cout<<spf[i];if(i<n)cout<<" ";}cout<<"\\n";`),
    py: `${READ_N_PY}spf = [0] * (n + 1)\nfor p in range(2, n + 1):\n    if spf[p] == 0:\n        for m in range(p, n + 1, p):\n            if spf[m] == 0:\n                spf[m] = p\nprint(" ".join(str(spf[i]) for i in range(2, n + 1)))\n`,
    tests: ["10", "2", "3", "20", "1000", "997", "2000", "100"],
  },
  {
    slug: "ciur-cel-mai-mare-factor-prim-al-fiecarui-numar",
    title: "Ciurul lui Eratostene: cel mai mare factor prim al fiecarui numar",
    statement: "Se citeste un numar natural n, cu n >= 2. Folosind o varianta a ciurului lui Eratostene, determinati, pentru fiecare numar de la 2 la n, cel mai mare factor prim al sau.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza pe o singura linie n-1 numere separate prin spatiu: cel mai mare factor prim al numerelor 2, 3, ..., n, in aceasta ordine.",
    constraints: "2 <= n <= 2000",
    difficulty: "medium",
    tags: ["divizibilitate", "ciurul-lui-eratostene"],
    hints: "Parcurge p de la 2 la n in ordine crescatoare; daca p este prim, suprascrie valoarea retinuta pentru toti multiplii sai cu p. Deoarece p creste, ultima suprascriere corespunde celui mai mare factor prim.",
    explanation: "Se construieste un vector lpf (largest prime factor) de dimensiune n+1, initial 0. Pentru fiecare p de la 2 la n, daca lpf[p] este inca 0, p este prim; se parcurg apoi toti multiplii lui p si li se atribuie lpf = p, suprascriind orice valoare anterioara. Deoarece p creste, valoarea finala din lpf[m] este cel mai mare factor prim al lui m.\n\n**Complexitate:** O(n log log n)",
    time_limit_ms: 2000,
    cpp: C(`${READ_N_CPP}vector<long long> lpf(n+1,0);for(long long p=2;p<=n;p++){if(lpf[p]==0){for(long long m=p;m<=n;m+=p){lpf[m]=p;}}}for(long long i=2;i<=n;i++){cout<<lpf[i];if(i<n)cout<<" ";}cout<<"\\n";`),
    py: `${READ_N_PY}lpf = [0] * (n + 1)\nfor p in range(2, n + 1):\n    if lpf[p] == 0:\n        for m in range(p, n + 1, p):\n            lpf[m] = p\nprint(" ".join(str(lpf[i]) for i in range(2, n + 1)))\n`,
    tests: ["10", "2", "3", "20", "1000", "997", "2000", "100"],
  },
  {
    slug: "ciur-numarul-de-factori-primi-distincti-pentru-fiecare-numar",
    title: "Ciurul lui Eratostene: numarul de factori primi distincti ai fiecarui numar",
    statement: "Se citeste un numar natural n. Folosind ciurul lui Eratostene, determinati, pentru fiecare numar de la 1 la n, cati factori primi distincti are.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza pe o singura linie n numere separate prin spatiu: numarul de factori primi distincti ai numerelor 1, 2, ..., n, in aceasta ordine.",
    constraints: "1 <= n <= 2000",
    difficulty: "medium",
    tags: ["divizibilitate", "ciurul-lui-eratostene"],
    hints: "Identifica mai intai numerele prime cu ciurul clasic, apoi, pentru fiecare numar prim p, incrementeaza contorul tuturor multiplilor sai.",
    explanation: "Se identifica numerele prime pana la n folosind ciurul lui Eratostene. Apoi, pentru fiecare numar prim p, se incrementeaza contorul omega al fiecarui multiplu al lui p; astfel, la final, omega[i] contine numarul de factori primi distincti ai lui i.\n\n**Complexitate:** O(n log log n)",
    time_limit_ms: 2000,
    cpp: C(`${READ_N_CPP}${SIEVE_COMP_CPP}vector<long long> omega(n+1,0);for(long long p=2;p<=n;p++){if(!comp[p]){for(long long m=p;m<=n;m+=p)omega[m]++;}}for(long long i=1;i<=n;i++){cout<<omega[i];if(i<n)cout<<" ";}cout<<"\\n";`),
    py: `${READ_N_PY}${SIEVE_COMP_PY}omega = [0] * (n + 1)\nfor p in range(2, n + 1):\n    if not comp[p]:\n        for m in range(p, n + 1, p):\n            omega[m] += 1\nprint(" ".join(str(omega[i]) for i in range(1, n + 1)))\n`,
    tests: ["10", "1", "2", "20", "1000", "997", "2000", "100"],
  },
  {
    slug: "ciur-suma-factorilor-primi-distincti-pentru-fiecare-numar",
    title: "Ciurul lui Eratostene: suma factorilor primi distincti ai fiecarui numar",
    statement: "Se citeste un numar natural n. Folosind ciurul lui Eratostene, determinati, pentru fiecare numar de la 1 la n, suma factorilor sai primi distincti.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza pe o singura linie n numere separate prin spatiu: suma factorilor primi distincti ai numerelor 1, 2, ..., n, in aceasta ordine.",
    constraints: "1 <= n <= 2000",
    difficulty: "medium",
    tags: ["divizibilitate", "ciurul-lui-eratostene"],
    hints: "Identifica mai intai numerele prime cu ciurul clasic, apoi, pentru fiecare numar prim p, aduna p la suma tuturor multiplilor sai.",
    explanation: "Se identifica numerele prime pana la n folosind ciurul lui Eratostene. Apoi, pentru fiecare numar prim p, se aduna p la suma sopf a fiecarui multiplu al lui p; la final, sopf[i] contine suma factorilor primi distincti ai lui i.\n\n**Complexitate:** O(n log log n)",
    time_limit_ms: 2000,
    cpp: C(`${READ_N_CPP}${SIEVE_COMP_CPP}vector<long long> sopf(n+1,0);for(long long p=2;p<=n;p++){if(!comp[p]){for(long long m=p;m<=n;m+=p)sopf[m]+=p;}}for(long long i=1;i<=n;i++){cout<<sopf[i];if(i<n)cout<<" ";}cout<<"\\n";`),
    py: `${READ_N_PY}${SIEVE_COMP_PY}sopf = [0] * (n + 1)\nfor p in range(2, n + 1):\n    if not comp[p]:\n        for m in range(p, n + 1, p):\n            sopf[m] += p\nprint(" ".join(str(sopf[i]) for i in range(1, n + 1)))\n`,
    tests: ["10", "1", "2", "20", "1000", "997", "2000", "100"],
  },
  {
    slug: "ciur-numarul-de-divizori-pentru-fiecare-numar",
    title: "Ciurul divizorilor: numarul de divizori ai fiecarui numar",
    statement: "Se citeste un numar natural n. Folosind un ciur asemanator celui al lui Eratostene, determinati, pentru fiecare numar de la 1 la n, cati divizori naturali are.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza pe o singura linie n numere separate prin spatiu: numarul de divizori ai numerelor 1, 2, ..., n, in aceasta ordine.",
    constraints: "1 <= n <= 2000",
    difficulty: "easy",
    tags: ["divizibilitate", "ciurul-lui-eratostene"],
    hints: "In loc sa marchezi doar multiplii numerelor prime, pentru fiecare d de la 1 la n incrementeaza contorul tuturor multiplilor lui d: fiecare multiplu al lui d il are pe d ca divizor.",
    explanation: "Pentru fiecare d de la 1 la n, d este divizor al tuturor multiplilor sai; se incrementeaza deci contorul cnt al fiecarui multiplu al lui d. Aceasta tehnica, asemanatoare ciurului lui Eratostene, calculeaza numarul de divizori ai tuturor numerelor de la 1 la n intr-o singura trecere agregata.\n\n**Complexitate:** O(n log n)",
    time_limit_ms: 2000,
    cpp: C(`${READ_N_CPP}vector<long long> cnt(n+1,0);for(long long d=1;d<=n;d++){for(long long m=d;m<=n;m+=d)cnt[m]++;}for(long long i=1;i<=n;i++){cout<<cnt[i];if(i<n)cout<<" ";}cout<<"\\n";`),
    py: `${READ_N_PY}cnt = [0] * (n + 1)\nfor d in range(1, n + 1):\n    for m in range(d, n + 1, d):\n        cnt[m] += 1\nprint(" ".join(str(cnt[i]) for i in range(1, n + 1)))\n`,
    tests: ["10", "1", "2", "20", "1000", "997", "2000", "100"],
  },
  {
    slug: "ciur-suma-divizorilor-pentru-fiecare-numar",
    title: "Ciurul divizorilor: suma divizorilor fiecarui numar",
    statement: "Se citeste un numar natural n. Folosind un ciur asemanator celui al lui Eratostene, determinati, pentru fiecare numar de la 1 la n, suma divizorilor sai naturali.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza pe o singura linie n numere separate prin spatiu: suma divizorilor numerelor 1, 2, ..., n, in aceasta ordine.",
    constraints: "1 <= n <= 2000",
    difficulty: "easy",
    tags: ["divizibilitate", "ciurul-lui-eratostene"],
    hints: "Pentru fiecare d de la 1 la n, aduna d la suma fiecarui multiplu al lui d, deoarece d este divizor al acelui multiplu.",
    explanation: "Pentru fiecare d de la 1 la n, se aduna d la suma sig a fiecarui multiplu al lui d; la final sig[i] contine suma tuturor divizorilor lui i.\n\n**Complexitate:** O(n log n)",
    time_limit_ms: 2000,
    cpp: C(`${READ_N_CPP}vector<long long> sig(n+1,0);for(long long d=1;d<=n;d++){for(long long m=d;m<=n;m+=d)sig[m]+=d;}for(long long i=1;i<=n;i++){cout<<sig[i];if(i<n)cout<<" ";}cout<<"\\n";`),
    py: `${READ_N_PY}sig = [0] * (n + 1)\nfor d in range(1, n + 1):\n    for m in range(d, n + 1, d):\n        sig[m] += d\nprint(" ".join(str(sig[i]) for i in range(1, n + 1)))\n`,
    tests: ["10", "1", "2", "20", "1000", "997", "2000", "100"],
  },
  {
    slug: "ciur-functia-phi-pentru-fiecare-numar",
    title: "Ciurul lui Euler: functia phi pentru fiecare numar",
    statement: "Se citeste un numar natural n. Folosind ciurul lui Euler (o varianta a ciurului lui Eratostene), determinati, pentru fiecare numar de la 1 la n, valoarea functiei indicator a lui Euler, phi(i): numarul de numere din intervalul [1, i] care sunt prime cu i.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza pe o singura linie n numere separate prin spatiu: phi(1), phi(2), ..., phi(n), in aceasta ordine.",
    constraints: "1 <= n <= 2000",
    difficulty: "medium",
    tags: ["divizibilitate", "ciurul-lui-eratostene", "functia-phi"],
    hints: "Initializeaza phi[i]=i pentru toti i. Parcurge p de la 2 la n; daca phi[p] este inca egal cu p, atunci p este prim, iar pentru fiecare multiplu al lui p se aplica formula phi[m] -= phi[m] / p.",
    explanation: "Se initializeaza phi[i]=i pentru fiecare i. Se parcurge p de la 2 la n; daca phi[p] nu a fost inca modificat (adica phi[p]==p), atunci p este prim, iar pentru fiecare multiplu m al lui p se aplica formula produsului lui Euler: phi[m] -= phi[m] / p. La final, phi[i] contine valoarea corecta a functiei lui Euler pentru i.\n\n**Complexitate:** O(n log log n)",
    time_limit_ms: 2000,
    cpp: C(`${READ_N_CPP}vector<long long> phi(n+1,0);for(long long i=0;i<=n;i++)phi[i]=i;for(long long p=2;p<=n;p++){if(phi[p]==p){for(long long m=p;m<=n;m+=p){phi[m]-=phi[m]/p;}}}for(long long i=1;i<=n;i++){cout<<phi[i];if(i<n)cout<<" ";}cout<<"\\n";`),
    py: `${READ_N_PY}phi = list(range(n + 1))\nfor p in range(2, n + 1):\n    if phi[p] == p:\n        for m in range(p, n + 1, p):\n            phi[m] -= phi[m] // p\nprint(" ".join(str(phi[i]) for i in range(1, n + 1)))\n`,
    tests: ["10", "1", "2", "20", "1000", "997", "2000", "100"],
  },
  {
    slug: "ciur-suma-functiei-phi-pana-la-n",
    title: "Ciurul lui Euler: suma valorilor functiei phi pana la n",
    statement: "Se citeste un numar natural n. Folosind ciurul lui Euler, determinati suma phi(1) + phi(2) + ... + phi(n), unde phi este functia indicator a lui Euler.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza un singur numar natural: suma ceruta.",
    constraints: "1 <= n <= 100000",
    difficulty: "medium",
    tags: ["divizibilitate", "ciurul-lui-eratostene", "functia-phi"],
    hints: "Calculeaza toate valorile phi(1..n) folosind ciurul lui Euler, apoi insumeaza-le. Suma poate deveni mare, foloseste un tip de date pe 64 de biti.",
    explanation: "Se calculeaza phi(i) pentru toti i de la 1 la n folosind ciurul lui Euler, apoi se insumeaza toate valorile obtinute intr-o variabila pe 64 de biti.\n\n**Complexitate:** O(n log log n)",
    time_limit_ms: 2000,
    cpp: C(`${READ_N_CPP}vector<long long> phi(n+1,0);for(long long i=0;i<=n;i++)phi[i]=i;for(long long p=2;p<=n;p++){if(phi[p]==p){for(long long m=p;m<=n;m+=p){phi[m]-=phi[m]/p;}}}long long total=0;for(long long i=1;i<=n;i++)total+=phi[i];cout<<total<<"\\n";`),
    py: `${READ_N_PY}phi = list(range(n + 1))\nfor p in range(2, n + 1):\n    if phi[p] == p:\n        for m in range(p, n + 1, p):\n            phi[m] -= phi[m] // p\nprint(sum(phi[1:n+1]))\n`,
    tests: ["10", "1", "2", "20", "1000", "997", "100000", "50000"],
  },
  {
    slug: "ciur-numarul-de-numere-libere-de-patrate-pana-la-n",
    title: "Ciur pentru numere libere de patrate",
    statement: "Se citeste un numar natural n. Un numar este liber de patrate daca nu se divide cu niciun patrat perfect mai mare decat 1 (adica niciun factor prim al sau nu apare la puterea a doua sau mai mare). Folosind o varianta a ciurului lui Eratostene, determinati cate numere din intervalul [1, n] sunt libere de patrate.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza un singur numar natural: cate numere din [1, n] sunt libere de patrate.",
    constraints: "1 <= n <= 100000",
    difficulty: "hard",
    tags: ["divizibilitate", "ciurul-lui-eratostene"],
    hints: "Pentru fiecare p de la 2 pana la radical din n, marcheaza toti multiplii lui p*p ca nefiind liberi de patrate.",
    explanation: "Pentru fiecare p de la 2 la radical din n, se marcheaza toti multiplii lui p*p ca nefiind liberi de patrate (indiferent daca p este prim, deoarece patratul unui numar compus este deja acoperit de patratul unui factor prim al sau). La final se numara pozitiile ramase nemarcate.\n\n**Complexitate:** O(n log n)",
    time_limit_ms: 2000,
    cpp: C(`${READ_N_CPP}vector<bool> notSF(n+1,false);for(long long p=2;p*p<=n;p++){long long p2=p*p;for(long long m=p2;m<=n;m+=p2)notSF[m]=true;}long long cnt=0;for(long long i=1;i<=n;i++)if(!notSF[i])cnt++;cout<<cnt<<"\\n";`),
    py: `${READ_N_PY}not_sf = [False] * (n + 1)\np = 2\nwhile p * p <= n:\n    p2 = p * p\n    for m in range(p2, n + 1, p2):\n        not_sf[m] = True\n    p += 1\ncnt = sum(1 for i in range(1, n + 1) if not not_sf[i])\nprint(cnt)\n`,
    tests: ["10", "1", "2", "20", "1000", "997", "100000", "50000"],
  },
  {
    slug: "ciur-numarul-de-perechi-de-numere-prime-gemene",
    title: "Ciurul lui Eratostene: numarul de perechi de numere prime gemene",
    statement: "Se citeste un numar natural n. Doua numere prime p si p+2 formeaza o pereche de numere prime gemene. Folosind ciurul lui Eratostene, determinati cate astfel de perechi exista, cu ambele numere mai mici sau egale cu n.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza un singur numar natural: numarul de perechi de numere prime gemene gasite.",
    constraints: "1 <= n <= 100000",
    difficulty: "medium",
    tags: ["divizibilitate", "ciurul-lui-eratostene"],
    hints: "Determina toate numerele prime pana la n cu ciurul lui Eratostene, apoi verifica pentru fiecare prim p daca p+2 este de asemenea prim si nu depaseste n.",
    explanation: "Se determina numerele prime pana la n cu ciurul lui Eratostene, apoi se parcurg toate numerele prime p cu p+2 <= n si se numara cate dintre ele au si p+2 prim.\n\n**Complexitate:** O(n log log n)",
    time_limit_ms: 2000,
    cpp: C(`${READ_N_CPP}${SIEVE_COMP_CPP}long long cnt=0;for(long long p=2;p+2<=n;p++){if(!comp[p]&&!comp[p+2])cnt++;}cout<<cnt<<"\\n";`),
    py: `${READ_N_PY}${SIEVE_COMP_PY}cnt = 0\nfor p in range(2, n - 1):\n    if not comp[p] and not comp[p + 2]:\n        cnt += 1\nprint(cnt)\n`,
    tests: ["10", "1", "5", "20", "1000", "997", "100000", "50000"],
  },
  {
    slug: "ciur-numarul-de-numere-prime-in-interval",
    title: "Ciurul lui Eratostene: numarul de numere prime intr-un interval",
    statement: "Se citesc un numar natural n si un numar natural q, reprezentand numarul de interogari. Urmeaza q linii, fiecare continand doua numere naturale l si r (1 <= l <= r <= n). Pentru fiecare interogare, folosind ciurul lui Eratostene precalculat, determinati cate numere prime exista in intervalul [l, r].",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla numarul natural q. Urmeaza q linii, fiecare continand doua numere naturale l si r.",
    output_format: "Afiseaza q linii, cate una pentru fiecare interogare, continand numarul de numere prime din intervalul [l, r].",
    constraints: "1 <= n <= 100000, 1 <= q <= 50, 1 <= l <= r <= n",
    difficulty: "medium",
    tags: ["divizibilitate", "ciurul-lui-eratostene", "sume-partiale"],
    hints: "Precalculeaza toate numerele prime pana la n cu ciurul lui Eratostene, apoi construieste un vector de sume partiale ale indicatorului 'este prim', pentru a raspunde la fiecare interogare in O(1).",
    explanation: "Se precalculeaza numerele prime pana la n cu ciurul lui Eratostene, apoi se construieste un vector de sume partiale prefix, unde prefix[i] retine cate numere prime exista in [1, i]. Fiecare interogare se raspunde in O(1) prin prefix[r] - prefix[l-1].\n\n**Complexitate:** O(n log log n + q)",
    time_limit_ms: 2000,
    cpp: `${CPP_HEAD}int main(){long long n;cin>>n;vector<bool> comp(n+1,false);for(long long p=2;p<=n;p++){if(!comp[p]){for(long long m=p*p;m<=n;m+=p)comp[m]=true;}}vector<long long> prefix(n+1,0);for(long long i=1;i<=n;i++){prefix[i]=prefix[i-1]+((i>=2&&!comp[i])?1:0);}long long q;cin>>q;for(long long t=0;t<q;t++){long long l,r;cin>>l>>r;cout<<(prefix[r]-prefix[l-1])<<"\\n";}return 0;}\n`,
    py: `n = int(input())\ncomp = [False] * (n + 1)\nfor p in range(2, n + 1):\n    if not comp[p]:\n        for m in range(p * p, n + 1, p):\n            comp[m] = True\nprefix = [0] * (n + 1)\nfor i in range(1, n + 1):\n    prefix[i] = prefix[i-1] + (1 if (i >= 2 and not comp[i]) else 0)\nq = int(input())\nout = []\nfor _ in range(q):\n    l, r = map(int, input().split())\n    out.append(str(prefix[r] - prefix[l-1]))\nprint("\\n".join(out))\n`,
    tests: [
      "20\n3\n1 20\n10 20\n1 1",
      "1\n1\n1 1",
      "100\n4\n1 100\n50 100\n1 1\n97 97",
      "1000\n3\n1 1000\n500 1000\n2 2",
      "100000\n2\n1 100000\n99000 100000",
      "50\n5\n1 50\n1 10\n11 20\n21 30\n31 50",
      "2\n2\n1 2\n2 2",
      "10\n3\n1 10\n2 2\n4 4",
    ],
  },
  {
    slug: "ciur-numarul-de-numere-cu-exact-k-factori-primi-distincti",
    title: "Ciurul lui Eratostene: numere cu exact k factori primi distincti",
    statement: "Se citesc un numar natural n si un numar natural nenul k. Folosind ciurul lui Eratostene, determinati cate numere din intervalul [1, n] au exact k factori primi distincti.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla numarul natural nenul k.",
    output_format: "Afiseaza un singur numar natural: numarul de valori gasite.",
    constraints: "1 <= n <= 100000, 1 <= k <= 10",
    difficulty: "hard",
    tags: ["divizibilitate", "ciurul-lui-eratostene"],
    hints: "Calculeaza mai intai numarul de factori primi distincti pentru fiecare numar din [1, n], folosind ciurul lui Eratostene, apoi numara cate dintre aceste valori sunt egale cu k.",
    explanation: "Se identifica numerele prime pana la n cu ciurul lui Eratostene, apoi se calculeaza omega(i), numarul de factori primi distincti, pentru fiecare i din [1, n]. La final se numara cate valori omega(i) sunt egale cu k.\n\n**Complexitate:** O(n log log n)",
    time_limit_ms: 2000,
    cpp: C(`long long n;cin>>n;long long k;cin>>k;${SIEVE_COMP_CPP}vector<long long> omega(n+1,0);for(long long p=2;p<=n;p++){if(!comp[p]){for(long long m=p;m<=n;m+=p)omega[m]++;}}long long cnt=0;for(long long i=1;i<=n;i++)if(omega[i]==k)cnt++;cout<<cnt<<"\\n";`),
    py: `n = int(input())\nk = int(input())\n${SIEVE_COMP_PY}omega = [0] * (n + 1)\nfor p in range(2, n + 1):\n    if not comp[p]:\n        for m in range(p, n + 1, p):\n            omega[m] += 1\ncnt = sum(1 for i in range(1, n + 1) if omega[i] == k)\nprint(cnt)\n`,
    tests: ["30\n2", "1\n1", "10\n1", "1000\n3", "997\n1", "100000\n4", "50000\n2", "100\n1"],
  },
  {
    slug: "ciur-suma-numerelor-cu-exact-k-divizori",
    title: "Ciurul divizorilor: suma numerelor cu exact k divizori",
    statement: "Se citesc un numar natural n si un numar natural nenul k. Folosind un ciur asemanator celui al lui Eratostene, determinati suma tuturor numerelor din intervalul [1, n] care au exact k divizori naturali.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla numarul natural nenul k.",
    output_format: "Afiseaza un singur numar natural: suma ceruta (0 daca nu exista niciun astfel de numar).",
    constraints: "1 <= n <= 100000, 1 <= k <= 100",
    difficulty: "medium",
    tags: ["divizibilitate", "ciurul-lui-eratostene"],
    hints: "Calculeaza numarul de divizori ai fiecarui numar din [1, n] folosind ciurul divizorilor, apoi aduna la suma toate valorile i cu exact k divizori.",
    explanation: "Se calculeaza numarul de divizori cnt(i) pentru fiecare i din [1, n], folosind tehnica de tip ciur (pentru fiecare d de la 1 la n, se incrementeaza contorul multiplilor lui d). La final se insumeaza toate valorile i pentru care cnt(i) este exact k.\n\n**Complexitate:** O(n log n)",
    time_limit_ms: 2000,
    cpp: C(`long long n;cin>>n;long long k;cin>>k;vector<long long> cnt(n+1,0);for(long long d=1;d<=n;d++){for(long long m=d;m<=n;m+=d)cnt[m]++;}long long total=0;for(long long i=1;i<=n;i++)if(cnt[i]==k)total+=i;cout<<total<<"\\n";`),
    py: `n = int(input())\nk = int(input())\ncnt = [0] * (n + 1)\nfor d in range(1, n + 1):\n    for m in range(d, n + 1, d):\n        cnt[m] += 1\ntotal = sum(i for i in range(1, n + 1) if cnt[i] == k)\nprint(total)\n`,
    tests: ["30\n2", "1\n1", "10\n4", "1000\n3", "997\n2", "100000\n6", "50000\n8", "100\n100"],
  },
  {
    slug: "ciur-cel-mai-mic-numar-cu-exact-k-divizori-pana-la-n",
    title: "Ciurul divizorilor: cel mai mic numar cu exact k divizori",
    statement: "Se citesc un numar natural n si un numar natural nenul k. Folosind un ciur asemanator celui al lui Eratostene, determinati cel mai mic numar din intervalul [1, n] care are exact k divizori naturali. Daca nu exista un astfel de numar, afisati -1.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla numarul natural nenul k.",
    output_format: "Afiseaza un singur numar intreg: numarul gasit, sau -1 daca nu exista.",
    constraints: "1 <= n <= 100000, 1 <= k <= 100",
    difficulty: "medium",
    tags: ["divizibilitate", "ciurul-lui-eratostene"],
    hints: "Calculeaza numarul de divizori ai fiecarui numar din [1, n] folosind ciurul divizorilor, apoi cauta primul numar, in ordine crescatoare, cu exact k divizori.",
    explanation: "Se calculeaza numarul de divizori cnt(i) pentru fiecare i din [1, n], folosind tehnica de tip ciur. Apoi se parcurg numerele in ordine crescatoare si se retine primul cu exact k divizori.\n\n**Complexitate:** O(n log n)",
    time_limit_ms: 2000,
    cpp: C(`long long n;cin>>n;long long k;cin>>k;vector<long long> cnt(n+1,0);for(long long d=1;d<=n;d++){for(long long m=d;m<=n;m+=d)cnt[m]++;}long long ans=-1;for(long long i=1;i<=n;i++){if(cnt[i]==k){ans=i;break;}}cout<<ans<<"\\n";`),
    py: `n = int(input())\nk = int(input())\ncnt = [0] * (n + 1)\nfor d in range(1, n + 1):\n    for m in range(d, n + 1, d):\n        cnt[m] += 1\nans = -1\nfor i in range(1, n + 1):\n    if cnt[i] == k:\n        ans = i\n        break\nprint(ans)\n`,
    tests: ["30\n2", "1\n1", "10\n4", "1000\n3", "997\n2", "100000\n60", "50000\n1", "100\n100"],
  },
  {
    slug: "ciur-numarul-de-numere-perfecte-pana-la-n",
    title: "Ciurul divizorilor: numarul de numere perfecte pana la n",
    statement: "Se citeste un numar natural n. Un numar natural este perfect daca este egal cu suma divizorilor sai proprii (mai mici decat el insusi). Folosind un ciur asemanator celui al lui Eratostene, determinati cate numere perfecte exista in intervalul [1, n].",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza un singur numar natural: numarul de numere perfecte gasite.",
    constraints: "1 <= n <= 100000",
    difficulty: "medium",
    tags: ["divizibilitate", "ciurul-lui-eratostene"],
    hints: "Calculeaza suma tuturor divizorilor (inclusiv numarul insusi) pentru fiecare numar din [1, n], folosind ciurul divizorilor; un numar i este perfect daca aceasta suma este egala cu 2*i.",
    explanation: "Se calculeaza suma divizorilor sig(i) (incluzand pe i insusi) pentru fiecare i din [1, n], folosind tehnica de tip ciur. Un numar i este perfect daca sig(i) - i == i, adica sig(i) == 2*i. Se numara cate astfel de valori exista.\n\n**Complexitate:** O(n log n)",
    time_limit_ms: 2000,
    cpp: C(`${READ_N_CPP}vector<long long> sig(n+1,0);for(long long d=1;d<=n;d++){for(long long m=d;m<=n;m+=d)sig[m]+=d;}long long cnt=0;for(long long i=1;i<=n;i++)if(sig[i]==2*i)cnt++;cout<<cnt<<"\\n";`),
    py: `${READ_N_PY}sig = [0] * (n + 1)\nfor d in range(1, n + 1):\n    for m in range(d, n + 1, d):\n        sig[m] += d\ncnt = sum(1 for i in range(1, n + 1) if sig[i] == 2 * i)\nprint(cnt)\n`,
    tests: ["10", "1", "6", "28", "1000", "10000", "100000", "50000"],
  },
  {
    slug: "ciur-numar-maxim-de-factori-primi-distincti",
    title: "Ciurul lui Eratostene: numarul maxim de factori primi distincti",
    statement: "Se citeste un numar natural n. Folosind ciurul lui Eratostene, determinati numarul maxim de factori primi distincti pe care il poate avea un numar din intervalul [1, n], precum si cel mai mic numar din acest interval care atinge acest maxim.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza pe o singura linie doua numere naturale separate prin spatiu: numarul maxim de factori primi distincti, respectiv cel mai mic numar din [1, n] care il atinge.",
    constraints: "2 <= n <= 100000",
    difficulty: "hard",
    tags: ["divizibilitate", "ciurul-lui-eratostene"],
    hints: "Calculeaza omega(i), numarul de factori primi distincti, pentru fiecare i din [1, n], folosind ciurul lui Eratostene, apoi cauta maximul si prima pozitie la care apare.",
    explanation: "Se calculeaza omega(i) pentru fiecare i din [1, n], folosind ciurul lui Eratostene pentru identificarea numerelor prime. Se determina apoi maximul acestor valori si, parcurgand in ordine crescatoare, primul i care il atinge.\n\n**Complexitate:** O(n log log n)",
    time_limit_ms: 2000,
    cpp: C(`${READ_N_CPP}${SIEVE_COMP_CPP}vector<long long> omega(n+1,0);for(long long p=2;p<=n;p++){if(!comp[p]){for(long long m=p;m<=n;m+=p)omega[m]++;}}long long best=0,bestI=1;for(long long i=1;i<=n;i++){if(omega[i]>best){best=omega[i];bestI=i;}}cout<<best<<" "<<bestI<<"\\n";`),
    py: `${READ_N_PY}${SIEVE_COMP_PY}omega = [0] * (n + 1)\nfor p in range(2, n + 1):\n    if not comp[p]:\n        for m in range(p, n + 1, p):\n            omega[m] += 1\nbest = 0\nbest_i = 1\nfor i in range(1, n + 1):\n    if omega[i] > best:\n        best = omega[i]\n        best_i = i\nprint(f"{best} {best_i}")\n`,
    tests: ["10", "2", "30", "210", "1000", "997", "100000", "50000"],
  },
  {
    slug: "ciur-suma-celui-mai-mare-factor-prim-pentru-toate-numerele",
    title: "Ciurul lui Eratostene: suma celui mai mare factor prim pentru toate numerele",
    statement: "Se citeste un numar natural n, cu n >= 2. Folosind o varianta a ciurului lui Eratostene, determinati suma celor mai mari factori primi ai tuturor numerelor din intervalul [2, n].",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza un singur numar natural: suma ceruta.",
    constraints: "2 <= n <= 100000",
    difficulty: "medium",
    tags: ["divizibilitate", "ciurul-lui-eratostene"],
    hints: "Calculeaza cel mai mare factor prim al fiecarui numar din [2, n], folosind tehnica de suprascriere descrescatoare a ciurului, apoi insumeaza valorile obtinute.",
    explanation: "Se calculeaza lpf(i), cel mai mare factor prim, pentru fiecare i din [2, n], parcurgand p crescator si suprascriind valoarea retinuta pentru toti multiplii lui p de fiecare data cand p este prim. La final se insumeaza toate valorile lpf(i).\n\n**Complexitate:** O(n log log n)",
    time_limit_ms: 2000,
    cpp: C(`${READ_N_CPP}vector<long long> lpf(n+1,0);for(long long p=2;p<=n;p++){if(lpf[p]==0){for(long long m=p;m<=n;m+=p)lpf[m]=p;}}long long total=0;for(long long i=2;i<=n;i++)total+=lpf[i];cout<<total<<"\\n";`),
    py: `${READ_N_PY}lpf = [0] * (n + 1)\nfor p in range(2, n + 1):\n    if lpf[p] == 0:\n        for m in range(p, n + 1, p):\n            lpf[m] = p\nprint(sum(lpf[2:n+1]))\n`,
    tests: ["10", "2", "3", "20", "1000", "997", "100000", "50000"],
  },
  {
    slug: "ciur-numarul-de-numere-prime-palindrom-pana-la-n",
    title: "Ciurul lui Eratostene: numarul de numere prime palindrom",
    statement: "Se citeste un numar natural n. Un numar este palindrom daca, scris in baza 10, se citeste la fel de la stanga la dreapta si de la dreapta la stanga. Folosind ciurul lui Eratostene, determinati cate numere prime palindrom exista in intervalul [1, n].",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza un singur numar natural: numarul de numere prime palindrom gasite.",
    constraints: "1 <= n <= 100000",
    difficulty: "hard",
    tags: ["divizibilitate", "ciurul-lui-eratostene", "palindrom"],
    hints: "Determina numerele prime pana la n cu ciurul lui Eratostene, apoi, pentru fiecare numar prim, verifica separat daca este palindrom, comparand cifrele sale.",
    explanation: "Se determina numerele prime pana la n cu ciurul lui Eratostene. Pentru fiecare numar prim gasit se verifica daca este palindrom (compara cifrele de la extreme spre mijloc). Se numara cate numere prime indeplinesc ambele conditii.\n\n**Complexitate:** O(n log log n + n * numarul de cifre)",
    time_limit_ms: 2000,
    cpp: C(`${READ_N_CPP}${SIEVE_COMP_CPP}long long cnt=0;for(long long p=2;p<=n;p++){if(!comp[p]){long long x=p,rev=0;while(x>0){rev=rev*10+x%10;x/=10;}if(rev==p)cnt++;}}cout<<cnt<<"\\n";`),
    py: `${READ_N_PY}${SIEVE_COMP_PY}cnt = 0\nfor p in range(2, n + 1):\n    if not comp[p]:\n        s = str(p)\n        if s == s[::-1]:\n            cnt += 1\nprint(cnt)\n`,
    tests: ["10", "1", "2", "20", "1000", "997", "100000", "50000"],
  },
  {
    slug: "ciur-urmatorul-numar-prim",
    title: "Ciurul lui Eratostene: urmatorul numar prim",
    statement: "Se citesc un numar natural n si un numar natural x, cu x <= n, despre care se stie ca exista cel putin un numar prim in intervalul [x, n]. Folosind ciurul lui Eratostene precalculat pana la n, determinati cel mai mic numar prim mai mare sau egal cu x.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla numarul natural x.",
    output_format: "Afiseaza un singur numar natural: cel mai mic numar prim mai mare sau egal cu x.",
    constraints: "2 <= n <= 100000, 1 <= x <= n, exista cel putin un numar prim in intervalul [x, n]",
    difficulty: "easy",
    tags: ["divizibilitate", "ciurul-lui-eratostene"],
    hints: "Precalculeaza numerele prime pana la n cu ciurul lui Eratostene, apoi porneste de la x si avanseaza pana gasesti primul numar marcat ca prim.",
    explanation: "Se precalculeaza numerele prime pana la n cu ciurul lui Eratostene. Apoi se parcurg numerele incepand de la x, in ordine crescatoare, pana la primul numar prim intalnit.\n\n**Complexitate:** O(n log log n)",
    time_limit_ms: 2000,
    cpp: C(`${READ_N_CPP}long long x;cin>>x;${SIEVE_COMP_CPP}long long ans=-1;for(long long v=x;v<=n;v++){if(v>=2&&!comp[v]){ans=v;break;}}cout<<ans<<"\\n";`),
    py: `${READ_N_PY}x = int(input())\n${SIEVE_COMP_PY}ans = -1\nfor v in range(x, n + 1):\n    if v >= 2 and not comp[v]:\n        ans = v\n        break\nprint(ans)\n`,
    tests: ["20\n14", "2\n1", "2\n2", "100\n90", "1000\n990", "997\n990", "100000\n99991", "50\n48"],
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
