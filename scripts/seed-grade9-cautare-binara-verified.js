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

const CHAPTER = { level: "grade9", chapter: "tablouri-uni", sub: "cautare-binara" };

// ---------------------------------------------------------------------------
// Big-input generator for the "efficiency-forced" batch-query problems
// (shared across problems 1-6 so they all get the same stress test).
// ---------------------------------------------------------------------------
function makeLCG(seed) {
  let s = seed >>> 0;
  return function () {
    s = (Math.imul(1103515245, s) + 12345) >>> 0;
    return s;
  };
}

function genBigCase(n, m, maxVal, seed) {
  const rnd = makeLCG(seed);
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(rnd() % maxVal);
  arr.sort((a, b) => a - b);
  const queries = [];
  for (let i = 0; i < m; i++) {
    if (i % 2 === 0) {
      queries.push(arr[rnd() % n]);
    } else {
      queries.push(rnd() % maxVal);
    }
  }
  return { arr, queries };
}

function bigCaseInput(n, m, maxVal, seed) {
  const { arr, queries } = genBigCase(n, m, maxVal, seed);
  return `${n}\n${arr.join(" ")}\n${m}\n${queries.join(" ")}`;
}

// NOTE: array-scan cost depends on element COUNT, not magnitude, so values are
// deliberately kept single-digit to maximize n/m within the /api/submissions/run
// 200000-char stdin cap (see scripts/seed-grade9-interclasare-verified.js's own
// gotcha note) - this is what actually makes the naive O(n*m) linear scan lose
// to compile/parse overhead vs. clearing it decisively. Empirically verified:
// naive ~600ms execution-only vs. official binary search ~85ms, with
// time_limit_ms=250 below - see conversation history for the measurement.
// Stated constraints remain wide (-10^9..10^9) so this is invisible to students.
const BIG_N = 45000;
const BIG_M = 45000;
const BIG_MAXVAL = 10;
const BIG_CASE = bigCaseInput(BIG_N, BIG_M, BIG_MAXVAL, 42);

// Small, hand-inspectable shared cases (base array has duplicates on purpose).
const SB = "1 3 3 3 5 7 9 9 12 20";
const SMALL_1 = `10\n${SB}\n8\n3 9 6 0 25 12 1 20`;
const SMALL_2 = `10\n${SB}\n1\n3`;
const SMALL_3 = `10\n${SB}\n1\n100`;
const SMALL_4 = `10\n${SB}\n1\n-5`;
const SMALL_5 = `1\n42\n3\n42 41 43`;
const BATCH_TESTS = [SMALL_1, SMALL_2, SMALL_3, SMALL_4, SMALL_5, BIG_CASE];

const IN_BATCH = "Pe prima linie se afla numarul natural n. Pe a doua linie se afla n numere intregi, sortate crescator (nu neaparat distincte). Pe a treia linie se afla numarul natural m (numarul de interogari). Pe a patra linie se afla m numere intregi, reprezentand valorile interogate.";
const CONSTR_BATCH = "1 <= n, m <= 10^5, -10^9 <= a[i], x <= 10^9";

const CPP_HEADER = `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main(){ios::sync_with_stdio(false);cin.tie(nullptr);\nint n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long> q(m);for(auto&x:q)cin>>x;\n`;
const PY_HEADER = `import sys, bisect\ndata = sys.stdin.buffer.read().split()\nidx = 0\nn = int(data[idx]); idx += 1\na = list(map(int, data[idx:idx+n])); idx += n\nm = int(data[idx]); idx += 1\nq = list(map(int, data[idx:idx+m])); idx += m\nout = []\n`;

const problems = [
  {
    slug: "apartenenta-mai-multor-valori-la-un-vector-sortat",
    title: "Apartenenta mai multor valori la un vector sortat",
    statement: "Se da un vector sortat crescator si un al doilea vector cu valori de interogat. Pentru fiecare valoare din al doilea vector, verificati daca ea apare in primul vector.",
    input_format: IN_BATCH,
    output_format: "Afiseaza raspunsurile pentru cele m interogari, in ordine, separate printr-un spatiu: DA daca valoarea apare in vector, respectiv NU in caz contrar.",
    constraints: CONSTR_BATCH,
    difficulty: "medium",
    tags: ["cautare-binara", "interogari"],
    hints: "Nu parcurgeti vectorul liniar pentru fiecare interogare - profitati de faptul ca este sortat si cautati fiecare valoare cu cautare binara.",
    explanation: "Deoarece vectorul este sortat, existenta unei valori se poate verifica in O(log n) prin cautare binara, in loc de O(n) prin parcurgere liniara. Cu n si m de pana la 10^5, o solutie care parcurge vectorul liniar pentru fiecare interogare (O(n*m)) depaseste limita de timp; cautarea binara (O(m log n)) incadreaza confortabil.\n\n**Complexitate:** O((n + m) log n)",
    time_limit_ms: 250,
    cpp: CPP_HEADER + `for(int i=0;i<m;i++){if(i)cout<<" ";cout<<(binary_search(a.begin(),a.end(),q[i])?"DA":"NU");}cout<<"\\n";return 0;}\n`,
    py: PY_HEADER + `for x in q:\n    i = bisect.bisect_left(a, x)\n    out.append("DA" if i < n and a[i] == x else "NU")\nprint(" ".join(out))\n`,
    tests: BATCH_TESTS,
  },
  {
    slug: "pozitia-celui-mai-mare-element-mai-mic-decat-x",
    title: "Pozitia celui mai mare element mai mic decat o valoare data",
    statement: "Se da un vector sortat crescator si un al doilea vector cu valori de interogat. Pentru fiecare valoare x din al doilea vector, determinati pozitia (indexata de la 0) celui mai mare element din primul vector care este strict mai mic decat x.",
    input_format: IN_BATCH,
    output_format: "Afiseaza raspunsurile pentru cele m interogari, in ordine, separate printr-un spatiu: pozitia ceruta (indexata de la 0), sau -1 daca nu exista niciun element mai mic decat x.",
    constraints: CONSTR_BATCH,
    difficulty: "medium",
    tags: ["cautare-binara", "interogari"],
    hints: "Cautati binar cea mai din stanga pozitie la care ar putea fi inserata valoarea x pastrand ordinea crescatoare; pozitia ceruta este cu una mai mica decat aceasta.",
    explanation: "Se cauta binar prima pozitie i cu a[i] >= x (marginea inferioara); toate elementele de dinaintea acestei pozitii sunt stricte mai mici decat x, deci raspunsul este i - 1 (sau -1 daca i = 0). Rezolvarea liniara ar fi O(n) per interogare, ceea ce depaseste limita de timp pentru n, m de pana la 10^5.\n\n**Complexitate:** O((n + m) log n)",
    time_limit_ms: 250,
    cpp: CPP_HEADER + `for(int i=0;i<m;i++){if(i)cout<<" ";auto it=lower_bound(a.begin(),a.end(),q[i]);long long pos=(it-a.begin())-1;cout<<pos;}cout<<"\\n";return 0;}\n`,
    py: PY_HEADER + `for x in q:\n    i = bisect.bisect_left(a, x) - 1\n    out.append(str(i))\nprint(" ".join(out))\n`,
    tests: BATCH_TESTS,
  },
  {
    slug: "pozitia-celui-mai-mic-element-mai-mare-decat-x",
    title: "Pozitia celui mai mic element mai mare decat o valoare data",
    statement: "Se da un vector sortat crescator si un al doilea vector cu valori de interogat. Pentru fiecare valoare x din al doilea vector, determinati pozitia (indexata de la 0) celui mai mic element din primul vector care este strict mai mare decat x.",
    input_format: IN_BATCH,
    output_format: "Afiseaza raspunsurile pentru cele m interogari, in ordine, separate printr-un spatiu: pozitia ceruta (indexata de la 0), sau -1 daca nu exista niciun element mai mare decat x.",
    constraints: CONSTR_BATCH,
    difficulty: "medium",
    tags: ["cautare-binara", "interogari"],
    hints: "Cautati binar prima pozitie la care un element este strict mai mare decat x.",
    explanation: "Se cauta binar prima pozitie i cu a[i] > x (marginea superioara). Daca aceasta pozitie exista (i < n), ea este raspunsul; altfel raspunsul este -1. Rezolvarea liniara ar fi O(n) per interogare, ceea ce depaseste limita de timp pentru n, m de pana la 10^5.\n\n**Complexitate:** O((n + m) log n)",
    time_limit_ms: 250,
    cpp: CPP_HEADER + `for(int i=0;i<m;i++){if(i)cout<<" ";auto it=upper_bound(a.begin(),a.end(),q[i]);long long pos=(it==a.end())?-1:(it-a.begin());cout<<pos;}cout<<"\\n";return 0;}\n`,
    py: PY_HEADER + `for x in q:\n    i = bisect.bisect_right(a, x)\n    out.append(str(i) if i < n else "-1")\nprint(" ".join(out))\n`,
    tests: BATCH_TESTS,
  },
  {
    slug: "prima-aparitie-a-unei-valori-in-vector-sortat",
    title: "Prima aparitie a unei valori intr-un vector sortat",
    statement: "Se da un vector sortat crescator (poate contine duplicate) si un al doilea vector cu valori de interogat. Pentru fiecare valoare x din al doilea vector, determinati pozitia (indexata de la 0) primei aparitii a lui x in primul vector.",
    input_format: IN_BATCH,
    output_format: "Afiseaza raspunsurile pentru cele m interogari, in ordine, separate printr-un spatiu: pozitia primei aparitii, sau -1 daca x nu apare in vector.",
    constraints: CONSTR_BATCH,
    difficulty: "medium",
    tags: ["cautare-binara", "interogari"],
    hints: "Cautati binar cea mai din stanga pozitie la care ar putea aparea x; verificati apoi daca elementul de acolo chiar este egal cu x.",
    explanation: "Prima aparitie a lui x, daca exista, se afla exact la marginea inferioara (prima pozitie i cu a[i] >= x): daca a[i] == x, aceea este prima aparitie; altfel x nu apare in vector. Rezolvarea liniara ar fi O(n) per interogare, ceea ce depaseste limita de timp pentru n, m de pana la 10^5.\n\n**Complexitate:** O((n + m) log n)",
    time_limit_ms: 250,
    cpp: CPP_HEADER + `for(int i=0;i<m;i++){if(i)cout<<" ";auto it=lower_bound(a.begin(),a.end(),q[i]);long long pos=(it!=a.end() && *it==q[i])?(it-a.begin()):-1;cout<<pos;}cout<<"\\n";return 0;}\n`,
    py: PY_HEADER + `for x in q:\n    i = bisect.bisect_left(a, x)\n    out.append(str(i) if i < n and a[i] == x else "-1")\nprint(" ".join(out))\n`,
    tests: BATCH_TESTS,
  },
  {
    slug: "ultima-aparitie-a-unei-valori-in-vector-sortat",
    title: "Ultima aparitie a unei valori intr-un vector sortat",
    statement: "Se da un vector sortat crescator (poate contine duplicate) si un al doilea vector cu valori de interogat. Pentru fiecare valoare x din al doilea vector, determinati pozitia (indexata de la 0) ultimei aparitii a lui x in primul vector.",
    input_format: IN_BATCH,
    output_format: "Afiseaza raspunsurile pentru cele m interogari, in ordine, separate printr-un spatiu: pozitia ultimei aparitii, sau -1 daca x nu apare in vector.",
    constraints: CONSTR_BATCH,
    difficulty: "medium",
    tags: ["cautare-binara", "interogari"],
    hints: "Cautati binar prima pozitie la care un element este strict mai mare decat x; ultima aparitie a lui x este cu o pozitie inaintea acesteia.",
    explanation: "Ultima aparitie a lui x, daca exista, se afla imediat inaintea marginii superioare (prima pozitie i cu a[i] > x): pozitia i - 1, daca este valida si contine chiar x. Rezolvarea liniara ar fi O(n) per interogare, ceea ce depaseste limita de timp pentru n, m de pana la 10^5.\n\n**Complexitate:** O((n + m) log n)",
    time_limit_ms: 250,
    cpp: CPP_HEADER + `for(int i=0;i<m;i++){if(i)cout<<" ";auto it=upper_bound(a.begin(),a.end(),q[i]);long long idx=(it-a.begin())-1;long long pos=(idx>=0 && a[idx]==q[i])?idx:-1;cout<<pos;}cout<<"\\n";return 0;}\n`,
    py: PY_HEADER + `for x in q:\n    i = bisect.bisect_right(a, x) - 1\n    out.append(str(i) if i >= 0 and a[i] == x else "-1")\nprint(" ".join(out))\n`,
    tests: BATCH_TESTS,
  },
  {
    slug: "numarul-de-aparitii-ale-unei-valori-in-vector-sortat",
    title: "Numarul de aparitii ale unei valori intr-un vector sortat",
    statement: "Se da un vector sortat crescator (poate contine duplicate) si un al doilea vector cu valori de interogat. Pentru fiecare valoare x din al doilea vector, determinati de cate ori apare x in primul vector.",
    input_format: IN_BATCH,
    output_format: "Afiseaza raspunsurile pentru cele m interogari, in ordine, separate printr-un spatiu: numarul de aparitii ale valorii respective (0 daca nu apare deloc).",
    constraints: CONSTR_BATCH,
    difficulty: "medium",
    tags: ["cautare-binara", "interogari"],
    hints: "Toate aparitiile unei valori intr-un vector sortat sunt consecutive; numarul lor este diferenta dintre pozitia primului element strict mai mare si pozitia primului element mai mare sau egal cu x.",
    explanation: "Deoarece vectorul este sortat, toate aparitiile lui x formeaza un bloc contiguu, delimitat de marginea inferioara (prima pozitie cu a[i] >= x) si marginea superioara (prima pozitie cu a[i] > x); numarul de aparitii este diferenta acestor doua pozitii. Rezolvarea liniara ar fi O(n) per interogare, ceea ce depaseste limita de timp pentru n, m de pana la 10^5.\n\n**Complexitate:** O((n + m) log n)",
    time_limit_ms: 250,
    cpp: CPP_HEADER + `for(int i=0;i<m;i++){if(i)cout<<" ";auto lo=lower_bound(a.begin(),a.end(),q[i]);auto hi=upper_bound(a.begin(),a.end(),q[i]);cout<<(hi-lo);}cout<<"\\n";return 0;}\n`,
    py: PY_HEADER + `for x in q:\n    lo = bisect.bisect_left(a, x)\n    hi = bisect.bisect_right(a, x)\n    out.append(str(hi - lo))\nprint(" ".join(out))\n`,
    tests: BATCH_TESTS,
  },
  {
    slug: "verificarea-patratelor-perfecte-intr-un-interval",
    title: "Verificarea patratelor perfecte intr-un interval",
    statement: "Se da un numar natural N (poate fi foarte mare) si un numar natural K. Pentru fiecare dintre cele K numere consecutive N, N+1, ..., N+K-1, verificati daca este patrat perfect.",
    input_format: "Pe prima linie se afla numarul natural N. Pe a doua linie se afla numarul natural K.",
    output_format: "Afiseaza K raspunsuri, in ordine, separate printr-un spatiu: DA daca N+i este patrat perfect, respectiv NU in caz contrar (pentru i de la 0 la K-1).",
    constraints: "0 <= N <= 10^18, 1 <= K <= 10^5, N + K - 1 <= 10^18",
    difficulty: "medium",
    tags: ["cautare-binara", "patrate-perfecte"],
    hints: "Nu incercati sa gasiti radacina patrata inmultind repetat de la 1 in sus - pentru numere de ordinul 10^18 acest lucru este mult prea lent. Cautati binar radacina patrata intreaga.",
    explanation: "Pentru fiecare valoare V = N+i, se cauta binar cel mai mare numar r cu r*r <= V; V este patrat perfect daca si numai daca r*r == V. Increment loop-ul naiv (incercarea r = 1, 2, 3, ... pana cand r*r depaseste V) necesita pana la sqrt(V) pasi - pentru V de ordinul 10^18 si K = 10^5 valori verificate, aceasta abordare este imposibil de rapida. Cautarea binara reduce fiecare verificare la O(log V), deci intregul interval se verifica in O(K log V). Atentie: pentru V de ordinul 10^18, functiile de radacina patrata in virgula mobila (sqrt/pow) isi pierd precizia (un double retine exact doar intregi pana la aproximativ 9*10^15) si pot da raspunsuri gresite - folositi doar aritmetica intreaga.\n\n**Complexitate:** O(K log V)",
    time_limit_ms: 400,
    cpp: `#include <iostream>\nusing namespace std;\nbool isPerfectSquare(long long v){\n  long long lo=0, hi=2000000000LL;\n  while(lo<hi){ long long mid=lo+(hi-lo+1)/2; if(mid*mid<=v) lo=mid; else hi=mid-1; }\n  return lo*lo==v;\n}\nint main(){\n  long long N; long long K;\n  cin>>N>>K;\n  for(long long i=0;i<K;i++){ if(i) cout<<" "; cout<<(isPerfectSquare(N+i)?"DA":"NU"); }\n  cout<<"\\n";\n  return 0;\n}\n`,
    py: `import sys, math\nN, K = map(int, sys.stdin.read().split())\nout = []\nfor i in range(K):\n    v = N + i\n    r = math.isqrt(v)\n    out.append("DA" if r * r == v else "NU")\nprint(" ".join(out))\n`,
    tests: [
      "0\n5",
      "1\n20",
      "999999999999999998\n5",
      "999999998000000001\n3",
      "1000000000000000000\n1",
      "2\n1",
      "1000000000000000000\n100000",
    ],
  },
  {
    slug: "numarul-de-triunghiuri-formate-din-laturile-unui-vector",
    title: "Numarul de triunghiuri formate din laturile unui vector",
    statement: "Se da un vector cu n numere naturale, reprezentand lungimi de segmente. Determinati in cate moduri se pot alege 3 dintre aceste segmente (dupa pozitie, nu dupa valoare) astfel incat ele sa poata forma un triunghi (cu perimetru nenul, respectand inegalitatea triunghiului).",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla cele n numere ale vectorului, separate prin spatiu.",
    output_format: "Afiseaza un singur numar natural, reprezentand numarul de triplete (dupa pozitie) care pot forma un triunghi.",
    constraints: "1 <= n <= 2500, 1 <= a[i] <= 10^9",
    difficulty: "hard",
    tags: ["cautare-binara", "sortare", "triunghiuri"],
    hints: "Sortati mai intai vectorul. Fixati cele mai mici doua laturi ale tripletului si cautati binar cea mai din dreapta pozitie la care a treia latura (mai mare sau egala) inca respecta inegalitatea triunghiului.",
    explanation: "Dupa sortare crescatoare, un triplet de pozitii i < j < k formeaza un triunghi daca si numai daca a[i] + a[j] > a[k] (celelalte doua inegalitati ale triunghiului sunt automat satisfacute, deoarece a[i] <= a[j] <= a[k]). Pentru fiecare pereche fixata (i, j), toate pozitiile k cu j < k < n si a[k] < a[i]+a[j] sunt valide, iar acestea formeaza un interval contiguu (vectorul e sortat) - se cauta binar (upper_bound) prima pozitie de dupa j la care valoarea nu mai este strict mai mica decat a[i]+a[j], iar numarul de pozitii valide se aduna direct la total. O varianta cu trei bucle imbricate (O(n^3)) este mult prea lenta pentru n = 2500.\n\n**Complexitate:** O(n^2 log n)",
    time_limit_ms: 1500,
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main(){ios::sync_with_stdio(false);cin.tie(nullptr);\n  int n;cin>>n;vector<long long> a(n);for(auto&x:a)cin>>x;\n  sort(a.begin(),a.end());\n  long long total=0;\n  for(int i=0;i<n;i++){\n    for(int j=i+1;j<n;j++){\n      long long sum=a[i]+a[j];\n      auto it=upper_bound(a.begin()+j+1,a.end(),sum-1);\n      long long cnt=it-(a.begin()+j+1);\n      total+=cnt;\n    }\n  }\n  cout<<total<<"\\n";\n  return 0;\n}\n`,
    py: `import sys, bisect\ndata = sys.stdin.buffer.read().split()\nn = int(data[0])\na = sorted(map(int, data[1:1+n]))\ntotal = 0\nfor i in range(n):\n    for j in range(i + 1, n):\n        s = a[i] + a[j]\n        k = bisect.bisect_right(a, s - 1, j + 1, n)\n        total += k - (j + 1)\nprint(total)\n`,
    tests: [
      "3\n4 5 6",
      "3\n1 2 3",
      "4\n2 2 3 4",
      "5\n1 1 1 1 1",
      "6\n10 21 22 100 101 200",
      "1\n5",
      "2\n5 5",
      "500",
    ],
  },
  {
    slug: "radacina-patrata-intreaga-a-unui-numar",
    title: "Radacina patrata intreaga a unui numar",
    statement: "Se da un numar natural N, care poate fi foarte mare. Determinati partea intreaga a radacinii patrate a lui N, adica cel mai mare numar natural r astfel incat r*r <= N.",
    input_format: "Pe prima linie se afla numarul natural N.",
    output_format: "Afiseaza pe o singura linie valoarea lui r.",
    constraints: "0 <= N <= 10^18",
    difficulty: "medium",
    tags: ["cautare-binara", "radacina-patrata"],
    hints: "Raspunsul r se afla undeva intre 0 si 2*10^9. Cautati-l binar: pentru o valoare candidat mid, verificati daca mid*mid <= N.",
    explanation: "Multimea valorilor mid pentru care mid*mid <= N formeaza un prefix de valori consecutive (0, 1, ..., r), deci se poate cauta binar cel mai mare astfel de mid. Functia sqrt() in virgula mobila nu este sigura aici: un double retine exact doar numere intregi de pana la aproximativ 9*10^15, deci pentru N de ordinul 10^18 rotunjirile pot produce un raspuns gresit cu 1. Solutia corecta foloseste exclusiv aritmetica intreaga (long long / int64), inclusiv la calculul mid*mid, care ramane in limitele acestui tip.\n\n**Complexitate:** O(log N)",
    time_limit_ms: 1000,
    cpp: `#include <iostream>\nusing namespace std;\nint main(){\n  long long N;cin>>N;\n  long long lo=0, hi=2000000000LL;\n  while(lo<hi){ long long mid=lo+(hi-lo+1)/2; if(mid*mid<=N) lo=mid; else hi=mid-1; }\n  cout<<lo<<"\\n";\n  return 0;\n}\n`,
    py: `import sys, math\nN = int(sys.stdin.readline())\nprint(math.isqrt(N))\n`,
    tests: [
      "0",
      "1",
      "2",
      "15",
      "16",
      "999999999999999999",
      "1000000000000000000",
      "999999998000000001",
    ],
  },
  {
    slug: "radacina-de-ordin-k-a-unui-numar",
    title: "Radacina intreaga de ordin k a unui numar",
    statement: "Se dau doua numere naturale N (care poate fi foarte mare) si k. Determinati partea intreaga a radacinii de ordin k a lui N, adica cel mai mare numar natural r astfel incat r^k <= N.",
    input_format: "Pe prima linie se afla numerele naturale N si k, separate printr-un spatiu.",
    output_format: "Afiseaza pe o singura linie valoarea lui r.",
    constraints: "0 <= N <= 10^18, 1 <= k <= 10",
    difficulty: "medium",
    tags: ["cautare-binara", "radacini"],
    hints: "Ca si la radacina patrata, cautati binar valoarea lui r. Pentru a verifica un candidat mid, calculati mid^k inmultind pas cu pas si opriti-va imediat ce depaseste N, ca sa evitati depasirea capacitatii tipului de date.",
    explanation: "Multimea valorilor mid cu mid^k <= N formeaza tot un prefix de valori consecutive, deci se poate cauta binar cel mai mare r cu aceasta proprietate. Functia pow() din bibliotecile standard foloseste virgula mobila si poate produce rezultate usor gresite pentru puteri mari - de aceea verificarea 'mid^k <= N' trebuie facuta cu aritmetica intreaga, oprind inmultirea imediat ce produsul partial ar depasi N (altfel mid^k poate depasi enorm capacitatea tipurilor intregi obisnuite pentru mid si k mari).\n\n**Complexitate:** O(k log N)",
    time_limit_ms: 1000,
    cpp: `#include <iostream>\nusing namespace std;\nbool powLE(long long x, long long k, long long N){\n  long long result=1;\n  for(long long i=0;i<k;i++){\n    if(x!=0 && result>N/x) return false;\n    result*=x;\n  }\n  return result<=N;\n}\nint main(){\n  long long N,k;cin>>N>>k;\n  long long lo=0, hi=2000000000LL;\n  while(lo<hi){ long long mid=lo+(hi-lo+1)/2; if(powLE(mid,k,N)) lo=mid; else hi=mid-1; }\n  cout<<lo<<"\\n";\n  return 0;\n}\n`,
    py: `import sys\nN, k = map(int, sys.stdin.readline().split())\nlo, hi = 0, 2000000000\nwhile lo < hi:\n    mid = (lo + hi + 1) // 2\n    if mid ** k <= N:\n        lo = mid\n    else:\n        hi = mid - 1\nprint(lo)\n`,
    tests: [
      "1000000 2",
      "999999 2",
      "1000001 2",
      "1000000000000000000 2",
      "999999999999999999 2",
      "64 6",
      "63 6",
      "1000000000000000000 3",
      "0 5",
      "2 1",
    ],
  },
  {
    slug: "capacitatea-minima-de-transport-in-d-zile",
    title: "Capacitatea minima de transport in D zile",
    statement: "Un vapor trebuie sa transporte n colete, in ordinea data, in cel mult D zile. In fiecare zi, coletele se incarca in ordine (fara a le reordona), fara ca suma greutatilor incarcate intr-o zi sa depaseasca o capacitate fixata a vaporului; fiecare zi in care se transporta ceva trebuie sa contina cel putin un colet. Determinati capacitatea minima a vaporului astfel incat toate cele n colete sa poata fi transportate in cel mult D zile.",
    input_format: "Pe prima linie se afla numerele naturale n si D, separate printr-un spatiu. Pe a doua linie se afla cele n numere naturale reprezentand greutatile coletelor, in ordinea in care trebuie incarcate.",
    output_format: "Afiseaza pe o singura linie capacitatea minima ceruta.",
    constraints: "1 <= D <= n <= 25000, 1 <= greutate <= 10^4",
    difficulty: "hard",
    tags: ["cautare-binara", "cautare-pe-raspuns", "greedy"],
    hints: "Raspunsul (capacitatea minima) se afla undeva intre greutatea celui mai greu colet si suma tuturor greutatilor. Cautati-l binar: pentru o capacitate candidat, simulati incarcarea greedy si numarati in cate zile s-ar termina transportul.",
    explanation: "Daca o capacitate C permite transportul in cel mult D zile, atunci orice capacitate mai mare permite acest lucru la fel de bine (numarul de zile necesare scade monoton cu capacitatea) - deci proprietatea 'este posibil in <= D zile' este monotona in raport cu C, ceea ce face posibila cautarea binara a celei mai mici capacitati valide. Pentru o capacitate data, numarul de zile necesare se determina greedy, in O(n): se incarca fiecare colet in ziua curenta cat timp nu se depaseste capacitatea, altfel se trece la o zi noua. O varianta care incearca pe rand fiecare capacitate posibila, de la greutatea maxima pana la suma totala, verificand-o in O(n), poate ajunge la un interval de incercat de ordinul sumei greutatilor (pana la 25000 * 10^4 = 2.5*10^8) inmultit cu O(n) per verificare - mult prea lent; cautarea binara reduce numarul de capacitati incercate la O(log(suma)).\n\n**Complexitate:** O(n log(suma greutatilor))",
    time_limit_ms: 1000,
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main(){ios::sync_with_stdio(false);cin.tie(nullptr);\n  long long n,D;cin>>n>>D;\n  vector<long long> w(n);\n  long long maxw=0, sum=0;\n  for(auto&x:w){cin>>x; maxw=max(maxw,x); sum+=x;}\n  long long lo=maxw, hi=sum;\n  auto daysNeeded=[&](long long cap)->long long{\n    long long days=1, cur=0;\n    for(long long x: w){\n      if(cur+x>cap){ days++; cur=0; }\n      cur+=x;\n    }\n    return days;\n  };\n  while(lo<hi){\n    long long mid=lo+(hi-lo)/2;\n    if(daysNeeded(mid)<=D) hi=mid; else lo=mid+1;\n  }\n  cout<<lo<<"\\n";\n  return 0;\n}\n`,
    py: `import sys\ndata = sys.stdin.buffer.read().split()\nn, D = int(data[0]), int(data[1])\nw = list(map(int, data[2:2+n]))\nlo, hi = max(w), sum(w)\ndef days_needed(cap):\n    days, cur = 1, 0\n    for x in w:\n        if cur + x > cap:\n            days += 1\n            cur = 0\n        cur += x\n    return days\nwhile lo < hi:\n    mid = (lo + hi) // 2\n    if days_needed(mid) <= D:\n        hi = mid\n    else:\n        lo = mid + 1\nprint(lo)\n`,
    tests: [
      "10 5\n1 2 3 4 5 6 7 8 9 10",
      "6 3\n3 2 2 4 1 4",
      "5 5\n1 1 1 1 1",
      "5 1\n3 1 4 1 5",
      "1 1\n7",
      "4 2\n10 10 10 10",
      "500 100",
    ],
  },
];

function fillBigWeightsTest(n, D) {
  const rnd = makeLCG(777);
  const w = [];
  for (let i = 0; i < n; i++) w.push(1 + (rnd() % 10000));
  return `${n} ${D}\n${w.join(" ")}`;
}

// Patch in the generated big test cases that reference helper functions
// (kept out of the literal array above for readability).
problems.find((p) => p.slug === "numarul-de-triunghiuri-formate-din-laturile-unui-vector").tests[7] = (() => {
  const rnd = makeLCG(99);
  const n = 2500;
  const a = [];
  for (let i = 0; i < n; i++) a.push(1 + (rnd() % 1000000000));
  return `${n}\n${a.join(" ")}`;
})();

problems.find((p) => p.slug === "capacitatea-minima-de-transport-in-d-zile").tests[6] = fillBigWeightsTest(25000, 500);

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
        console.error(`  TEST ${i}: cpp execution failed: verdict=${cppOut.verdict} stderr=${(cppOut.stderr||"").slice(0,300)}`);
        allOk = false;
        continue;
      }
      if (pyOut.verdict !== "AC") {
        console.error(`  TEST ${i}: python execution failed: verdict=${pyOut.verdict} stderr=${(pyOut.stderr||"").slice(0,300)}`);
        allOk = false;
        continue;
      }

      const normCpp = normalize(cppOut.stdout);
      const normPy = normalize(pyOut.stdout);
      if (normCpp !== normPy) {
        console.error(`  TEST ${i}: MISMATCH cpp="${normCpp.slice(0,200)}" python="${normPy.slice(0,200)}"`);
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
  console.log(`BIG_CASE length: ${BIG_CASE.length} chars`);
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
