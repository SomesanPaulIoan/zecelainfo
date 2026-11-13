const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "concursuri", chapter: "concurs-mi-ub-2023", sub: "probleme-2023" };

function normalize(text) {
  return (text ?? "").trim().split(/\r?\n/).map((line) => line.trim()).join("\n");
}

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

const problems = [
  {
    slug: "concurs-mi-ub-2023-ultima-cifra-factoriale",
    title: "Concurs MI UB 2023 - Ultima cifra a sumei de factoriale",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2023", "teoria-numerelor"],
    statement:
      "Se considera numarul N = 1! + 2! + 3! + ... + n!, unde n este un numar natural dat.\n" +
      "Sa se determine ultima cifra (cifra unitatilor) a numarului N.",
    input_format: "Se citeste de la tastatura un singur numar natural n.",
    output_format: "Se afiseaza pe ecran un singur numar, ultima cifra a sumei N = 1! + 2! + ... + n!.",
    constraints:
      "1 <= n <= 10000\n" +
      "Observatie: pentru orice k >= 5, factorialul k! contine atat factorul 2, cat si factorul 5, deci se termina in cifra 0. " +
      "Prin urmare doar primii cel mult 4 termeni influenteaza ultima cifra a sumei.",
    hints:
      "Nu este nevoie sa calculati factoriale mari: incepand cu 5! = 120, orice factorial se termina in 0, deci nu schimba ultima cifra a sumei. " +
      "Este suficient sa insumati exact primii min(n, 4) termeni.",
    explanation:
      "Pentru orice k >= 5, k! = 1*2*3*4*5*...*k contine factorul 5 si factorul 2, deci este divizibil cu 10 si se termina in cifra 0. " +
      "Asadar termenii 5!, 6!, ..., n! nu influenteaza ultima cifra a sumei N. Este suficient sa calculam exact suma primilor min(n,4) factoriale " +
      "(1! = 1, 2! = 2, 3! = 6, 4! = 24) si sa afisam ultima cifra a acestei sume partiale. Algoritmul: se calculeaza iterativ factorialul curent " +
      "si se aduna la o suma, oprindu-ne la min(n,4), apoi se afiseaza suma modulo 10.",
    cpp:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "int main(){\n" +
      "    long long n; cin >> n;\n" +
      "    long long lim = min(n, 4LL);\n" +
      "    long long fact = 1, sum = 0;\n" +
      "    for (long long k = 1; k <= lim; k++) { fact *= k; sum += fact; }\n" +
      "    cout << (sum % 10) << \"\\n\";\n" +
      "    return 0;\n" +
      "}\n",
    py:
      "n = int(input())\n" +
      "lim = min(n, 4)\n" +
      "fact = 1\n" +
      "s = 0\n" +
      "for k in range(1, lim + 1):\n" +
      "    fact *= k\n" +
      "    s += fact\n" +
      "print(s % 10)\n",
    tests: ["1\n", "2\n", "3\n", "4\n", "10000\n"],
  },
  {
    slug: "concurs-mi-ub-2023-numere-puternice",
    title: "Concurs MI UB 2023 - Numere puternice",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2023", "combinatorica"],
    statement:
      "Un numar natural este numit puternic daca este strict mai mare decat rasturnatul sau (numarul obtinut prin inversarea " +
      "ordinii cifrelor, ignorand eventualele zerouri nesemnificative rezultate la inceput). De exemplu, 10 si 21 sunt numere " +
      "puternice (rasturnatul lui 10 este 1, iar rasturnatul lui 21 este 12), dar 1 si 34 nu sunt.\n" +
      "Dandu-se un numar natural n, sa se determine cate numere puternice exista in intervalul [1, n].",
    input_format: "Se citeste de la tastatura un singur numar natural n.",
    output_format: "Se afiseaza pe ecran numarul de numere puternice din intervalul [1, n].",
    constraints: "1 <= n <= 200000",
    hints:
      "Pentru fiecare numar din intervalul [1, n] se poate calcula direct rasturnatul sau (prin extragerea cifrelor una cate una) " +
      "si compara cu numarul initial. n este suficient de mic pentru ca o parcurgere directa, numar cu numar, sa fie rapida.",
    explanation:
      "Se parcurge fiecare numar i de la 1 la n. Pentru fiecare i se calculeaza rasturnatul sau rev(i), extragand cifrele lui i " +
      "una cate una (i % 10, apoi i / 10) si construind rev = rev*10 + cifra. Daca i > rev(i), numaram i ca fiind puternic. " +
      "Aceasta este exact ideea din explicatia oficiala (compararea unui numar cu prima si ultima sa cifra, respectiv cu " +
      "rasturnatul complet), doar ca aici o aplicam algoritmic pentru fiecare numar in parte, in loc sa numaram pe cazuri dupa " +
      "numarul de cifre.",
    cpp:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "long long reverseNum(long long x){\n" +
      "    long long r = 0;\n" +
      "    while (x > 0) { r = r * 10 + (x % 10); x /= 10; }\n" +
      "    return r;\n" +
      "}\n" +
      "int main(){\n" +
      "    long long n; cin >> n;\n" +
      "    long long cnt = 0;\n" +
      "    for (long long i = 1; i <= n; i++) if (i > reverseNum(i)) cnt++;\n" +
      "    cout << cnt << \"\\n\";\n" +
      "    return 0;\n" +
      "}\n",
    py:
      "def reverse_num(x):\n" +
      "    r = 0\n" +
      "    while x > 0:\n" +
      "        r = r * 10 + (x % 10)\n" +
      "        x //= 10\n" +
      "    return r\n" +
      "\n" +
      "n = int(input())\n" +
      "cnt = 0\n" +
      "for i in range(1, n + 1):\n" +
      "    if i > reverse_num(i):\n" +
      "        cnt += 1\n" +
      "print(cnt)\n",
    tests: ["9\n", "99\n", "999\n", "2023\n", "200000\n"],
  },
  {
    slug: "concurs-mi-ub-2023-doze-reddrink",
    title: "Concurs MI UB 2023 - Dozele de RedDrink",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2023", "simulare"],
    statement:
      "Matei incepe cu n doze pline de RedDrink. In fiecare zi el bea maxim d doze pline (daca nu are d doze la dispozitie, " +
      "bea cate mai are, pana la epuizare). Fiecare doza bauta devine o doza goala. De fiecare data cand aduna cel putin k " +
      "doze goale, el le recicleaza cate k deodata, primind in schimb cate o doza plina pentru fiecare grup de k doze goale " +
      "reciclate (reciclarea se poate repeta de mai multe ori in aceeasi zi, atata timp cat are cel putin k doze goale).\n" +
      "Sa se determine dupa cate zile Matei nu mai are nicio doza plina de baut (adica numarul de zile in care a reusit sa " +
      "bea cel putin o doza).",
    input_format: "Se citesc pe o singura linie, separate prin spatiu, trei numere naturale n, k si d.",
    output_format: "Se afiseaza pe ecran numarul de zile in care Matei a reusit sa bea cel putin o doza.",
    constraints: "5 <= n <= 1000, 2 <= k <= 10, 1 <= d <= 5",
    hints:
      "Simulati zi cu zi: in fiecare zi Matei bea min(d, doze_pline) doze, apoi cat timp are cel putin k doze goale le " +
      "recicleaza (scade k din doze_goale, creste doze_pline cu 1). Opriti simularea cand incepe o zi fara nicio doza plina.",
    explanation:
      "Se simuleaza procesul zi cu zi, exact asa cum este descris in explicatia oficiala: la inceputul fiecarei zile, daca " +
      "Matei nu mai are nicio doza plina, simularea se opreste (raspunsul este numarul de zile simulate pana atunci). Altfel, " +
      "el bea min(d, doze_pline) doze (aceasta este exact regula 'bea 3, daca nu are 3 se multumeste cu 2, daca nu are 2 se " +
      "multumeste cu 1', generalizata la un plafon d), transforma dozele bautele in doze goale, apoi, cat timp are cel putin " +
      "k doze goale, schimba repetat cate k doze goale pe o doza plina. Se numara zilele in care s-a baut macar o doza.",
    cpp:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "int main(){\n" +
      "    long long n, k, d; cin >> n >> k >> d;\n" +
      "    long long full = n, empty = 0, day = 0;\n" +
      "    while (full > 0) {\n" +
      "        day++;\n" +
      "        long long drink = min(d, full);\n" +
      "        full -= drink;\n" +
      "        empty += drink;\n" +
      "        while (empty >= k) { empty -= k; full += 1; }\n" +
      "    }\n" +
      "    cout << day << \"\\n\";\n" +
      "    return 0;\n" +
      "}\n",
    py:
      "n, k, d = map(int, input().split())\n" +
      "full, empty, day = n, 0, 0\n" +
      "while full > 0:\n" +
      "    day += 1\n" +
      "    drink = min(d, full)\n" +
      "    full -= drink\n" +
      "    empty += drink\n" +
      "    while empty >= k:\n" +
      "        empty -= k\n" +
      "        full += 1\n" +
      "print(day)\n",
    tests: ["5 7 3\n", "1 2 1\n", "20 5 3\n", "100 7 3\n", "1000 3 5\n"],
  },
  {
    slug: "concurs-mi-ub-2023-comparatii-puteri",
    title: "Concurs MI UB 2023 - Comparatii de puteri mari",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2023", "teoria-numerelor"],
    statement:
      "Valoarea unei expresii de forma (a < b) este 1 daca expresia este adevarata si 0 daca este falsa.\n" +
      "Se dau k comparatii de forma (a_i^{m_i} < b_i^{n_i}), pentru i de la 0 la k-1, unde a_i, b_i, m_i, n_i sunt numere " +
      "naturale date. Se cere valoarea expresiei:\n" +
      "E = suma, pentru i de la 0 la k-1, de 2^i * (a_i^{m_i} < b_i^{n_i})",
    input_format:
      "Pe prima linie se citeste numarul natural k, numarul de comparatii. Urmeaza k linii, fiecare continand patru numere " +
      "naturale a_i, m_i, b_i, n_i, separate prin spatiu, reprezentand comparatia a_i^{m_i} < b_i^{n_i}.",
    output_format: "Se afiseaza pe ecran valoarea numarului intreg E.",
    constraints: "1 <= k <= 20, 2 <= a_i, b_i <= 999, 1 <= m_i, n_i <= 999",
    hints:
      "Puterile implicate au sute de cifre, deci nu pot fi calculate direct nici macar cu numere pe 64 de biti. " +
      "Folositi faptul ca functia logaritm este strict crescatoare: a^m < b^n este echivalent cu m*ln(a) < n*ln(b).",
    explanation:
      "Se aplica exact ideea din explicatia oficiala: pentru a compara doua puteri foarte mari a^m si b^n, se logaritmeaza " +
      "ambele parti, folosind faptul ca functia ln este strict crescatoare, deci a^m < b^n este echivalent cu m*ln(a) < n*ln(b). " +
      "Pentru fiecare din cele k comparatii se calculeaza aceasta inegalitate folosind numere in virgula mobila cu precizie " +
      "dubla, se obtine o valoare 0 sau 1, iar aceasta se inmulteste cu 2^i si se aduna la suma finala E.",
    cpp:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "int main(){\n" +
      "    int k; cin >> k;\n" +
      "    long long e = 0;\n" +
      "    long long p = 1;\n" +
      "    for (int i = 0; i < k; i++) {\n" +
      "        double a, m, b, n;\n" +
      "        cin >> a >> m >> b >> n;\n" +
      "        double lhs = m * log(a);\n" +
      "        double rhs = n * log(b);\n" +
      "        if (lhs < rhs) e += p;\n" +
      "        p *= 2;\n" +
      "    }\n" +
      "    cout << e << \"\\n\";\n" +
      "    return 0;\n" +
      "}\n",
    py:
      "import math\n" +
      "k = int(input())\n" +
      "e = 0\n" +
      "p = 1\n" +
      "for i in range(k):\n" +
      "    a, m, b, n = map(int, input().split())\n" +
      "    lhs = m * math.log(a)\n" +
      "    rhs = n * math.log(b)\n" +
      "    if lhs < rhs:\n" +
      "        e += p\n" +
      "    p *= 2\n" +
      "print(e)\n",
    tests: [
      "1\n2 10 3 7\n",
      "2\n5 20 7 15\n10 30 20 20\n",
      "3\n123 345 654 274\n345 322 654 294\n923 263 452 284\n",
      "5\n2 2 2 3\n100 50 200 40\n999 999 998 999\n50 100 60 90\n7 200 8 190\n",
      "1\n999 999 998 999\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2023-insule-dimensiuni",
    title: "Concurs MI UB 2023 - Numarul de insule",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2023", "combinatorica"],
    statement:
      "Consideram o matrice infinita in care unele patratele reprezinta fasii de pamant, restul fiind apa. Mai multe fasii " +
      "formeaza o insula daca se poate ajunge de la orice fasie la orice alta fasie din insula mergand doar pe orizontala " +
      "sau verticala, prin fasii adiacente de pamant. O insula poate fi formata si dintr-o singura fasie. Dimensiunea unei " +
      "insule este numarul de fasii care o alcatuiesc.\n" +
      "Se cunosc n fasii de pamant, si pentru fiecare dintre ele se cunoaste dimensiunea insulei din care face parte " +
      "(lista acestor dimensiuni). Sa se afle numarul de insule.",
    input_format:
      "Pe prima linie se citeste numarul natural n. Pe a doua linie se citesc n numere naturale, separate prin spatiu, " +
      "reprezentand, pentru fiecare fasie de pamant, dimensiunea insulei din care face parte.",
    output_format: "Se afiseaza pe ecran numarul total de insule.",
    constraints:
      "1 <= n <= 100000, fiecare valoare din lista este intre 1 si n, iar pentru fiecare valoare v din lista, numarul de " +
      "aparitii ale lui v in lista este intotdeauna un multiplu de v (datele de intrare sunt garantat consistente).",
    hints:
      "Daca exista o insula de dimensiune v, atunci ea contribuie cu exact v aparitii ale valorii v in lista. Deci numarul " +
      "de insule de dimensiune v este (numarul de aparitii ale lui v) / v.",
    explanation:
      "Se numara, pentru fiecare valoare distincta v din lista, de cate ori apare v (folosind un vector de frecventa). " +
      "Conform observatiei din explicatia oficiala, o singura insula de dimensiune v produce exact v aparitii ale valorii v " +
      "in lista, deci numarul de insule de dimensiune v este exact (frecventa lui v) / v. Raspunsul final este suma acestor " +
      "rapoarte pentru toate valorile distincte care apar in lista.",
    cpp:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "int main(){\n" +
      "    int n; cin >> n;\n" +
      "    vector<int> freq(n + 1, 0);\n" +
      "    for (int i = 0; i < n; i++) { int x; cin >> x; freq[x]++; }\n" +
      "    long long islands = 0;\n" +
      "    for (int v = 1; v <= n; v++) if (freq[v] > 0) islands += freq[v] / v;\n" +
      "    cout << islands << \"\\n\";\n" +
      "    return 0;\n" +
      "}\n",
    py:
      "n = int(input())\n" +
      "vals = list(map(int, input().split()))\n" +
      "freq = [0] * (n + 1)\n" +
      "for x in vals:\n" +
      "    freq[x] += 1\n" +
      "islands = 0\n" +
      "for v in range(1, n + 1):\n" +
      "    if freq[v] > 0:\n" +
      "        islands += freq[v] // v\n" +
      "print(islands)\n",
    tests: [
      "1\n1\n",
      "6\n1 1 2 2 3 3\n",
      "10\n1 1 1 2 2 2 2 2 2 2\n",
      "30\n1 1 2 2 2 2 3 3 3 3 3 3 3 3 3 3 3 3 4 4 4 4 4 4 4 4 4 4 4 4\n",
      "20\n5 5 5 5 5 1 1 1 1 1 1 1 1 1 1 5 5 5 5 5\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2023-reciclare-optima",
    title: "Concurs MI UB 2023 - Reciclare optima",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2023", "simulare"],
    statement:
      "Matei vrea sa recicleze n obiecte. Pentru fiecare obiect se cunoaste cate unitati de sticla, cate de plastic si cate " +
      "de hartie contine. Fiecare obiect trebuie aruncat la exact unul din cele 3 tomberoane de reciclare selectiva (sticla, " +
      "plastic, hartie), iar materia prima reciclata pentru un obiect este cantitatea corespunzatoare tomberonului ales.\n" +
      "Sa se afle numarul maxim de unitati de materie prima pe care Matei le poate recicla, alegand optim tomberonul pentru " +
      "fiecare obiect.",
    input_format:
      "Pe prima linie se citeste numarul natural n. Urmeaza n linii, fiecare continand trei numere naturale s, p, h, " +
      "reprezentand unitatile de sticla, plastic, respectiv hartie ale unui obiect.",
    output_format: "Se afiseaza pe ecran numarul maxim de unitati de materie prima ce pot fi reciclate.",
    constraints: "1 <= n <= 1000, 0 <= s, p, h <= 1000",
    hints:
      "Deoarece nu exista limita de capacitate a tomberoanelor, decizia pentru fiecare obiect este independenta de celelalte: " +
      "pentru fiecare obiect se alege tomberonul care ii maximizeaza contributia.",
    explanation:
      "Ca in explicatia oficiala, pentru fiecare obiect se calculeaza maximul dintre cele trei valori (sticla, plastic, " +
      "hartie), deoarece nu exista nicio restrictie asupra numarului de obiecte ce pot fi aruncate in acelasi tomberon, deci " +
      "alegerea optima pentru fiecare obiect este independenta de celelalte. Raspunsul final este suma acestor maxime pentru " +
      "toate cele n obiecte.",
    cpp:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "int main(){\n" +
      "    int n; cin >> n;\n" +
      "    long long total = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        long long s, p, h; cin >> s >> p >> h;\n" +
      "        total += max(s, max(p, h));\n" +
      "    }\n" +
      "    cout << total << \"\\n\";\n" +
      "    return 0;\n" +
      "}\n",
    py:
      "n = int(input())\n" +
      "total = 0\n" +
      "for _ in range(n):\n" +
      "    s, p, h = map(int, input().split())\n" +
      "    total += max(s, p, h)\n" +
      "print(total)\n",
    tests: [
      "1\n4 5 3\n",
      "2\n10 0 5\n3 9 4\n",
      "6\n4 5 3\n10 0 5\n3 9 4\n5 5 5\n1 2 3\n9 9 8\n",
      "4\n0 0 0\n1000 1000 1000\n1 1000 1\n1000 1 1\n",
      "10\n1 2 3\n4 5 6\n7 8 9\n10 9 8\n7 6 5\n4 3 2\n1 0 0\n0 1 0\n0 0 1\n1000 999 998\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2023-oferta-pungi",
    title: "Concurs MI UB 2023 - Oferta optima de pungi",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2023", "simulare"],
    statement:
      "Matei vrea sa cumpere cel putin T pungi de bomboane, fiecare punga costand 1 leu. El are la dispozitie k oferte, " +
      "dintre care trebuie sa aleaga cel mult una (dar o poate folosi de oricate ori). Oferta i este de forma: 'pentru " +
      "fiecare a_i pungi cumparate, urmatoarele b_i sunt gratuite', adica daca plateste (cumpara) x pungi, primeste in plus " +
      "b_i * floor(x / a_i) pungi gratuite, deci primeste in total x + b_i * floor(x / a_i) pungi.\n" +
      "Pentru fiecare oferta, aflati numarul minim de lei pe care Matei trebuie sa il plateasca pentru a obtine in total cel " +
      "putin T pungi, apoi determinati costul minim dintre toate cele k oferte.",
    input_format:
      "Pe prima linie se citesc numerele naturale k si T. Urmeaza k linii, fiecare continand doua numere naturale a_i si b_i, " +
      "reprezentand oferta i.",
    output_format: "Se afiseaza pe ecran costul minim (in lei) necesar pentru a obtine cel putin T pungi, folosind cea mai buna oferta.",
    constraints: "1 <= k <= 6, 1 <= T <= 100000, 1 <= a_i <= 1000, 0 <= b_i <= 1000",
    hints:
      "Pentru o oferta fixata, functia f(x) = x + b*floor(x/a) este crescatoare (nedescrescatoare) in raport cu x, deci " +
      "cea mai mica valoare x pentru care f(x) >= T poate fi gasita prin cautare binara in intervalul [0, T].",
    explanation:
      "Pentru fiecare oferta (a, b) se cauta, exact ca in explicatia oficiala, cel mai mic numar de pungi platite x astfel " +
      "incat x + b*floor(x/a) >= T. Deoarece functia f(x) = x + b*floor(x/a) este nedescrescatoare in x, aceasta valoare " +
      "minima poate fi gasita eficient prin cautare binara pe intervalul [0, T] (in loc de a testa manual cateva valori, " +
      "ca in explicatia originala). Raspunsul final este minimul acestor costuri, calculate pentru fiecare dintre cele k " +
      "oferte.",
    cpp:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "long long f(long long x, long long a, long long b){ return x + b * (x / a); }\n" +
      "int main(){\n" +
      "    long long k, T; cin >> k >> T;\n" +
      "    long long best = -1;\n" +
      "    for (long long i = 0; i < k; i++) {\n" +
      "        long long a, b; cin >> a >> b;\n" +
      "        long long lo = 0, hi = T;\n" +
      "        while (lo < hi) {\n" +
      "            long long mid = (lo + hi) / 2;\n" +
      "            if (f(mid, a, b) >= T) hi = mid; else lo = mid + 1;\n" +
      "        }\n" +
      "        if (best == -1 || lo < best) best = lo;\n" +
      "    }\n" +
      "    cout << best << \"\\n\";\n" +
      "    return 0;\n" +
      "}\n",
    py:
      "def f(x, a, b):\n" +
      "    return x + b * (x // a)\n" +
      "\n" +
      "k, T = map(int, input().split())\n" +
      "best = None\n" +
      "for _ in range(k):\n" +
      "    a, b = map(int, input().split())\n" +
      "    lo, hi = 0, T\n" +
      "    while lo < hi:\n" +
      "        mid = (lo + hi) // 2\n" +
      "        if f(mid, a, b) >= T:\n" +
      "            hi = mid\n" +
      "        else:\n" +
      "            lo = mid + 1\n" +
      "    if best is None or lo < best:\n" +
      "        best = lo\n" +
      "print(best)\n",
    tests: [
      "4 100\n24 12\n15 6\n3 1\n40 20\n",
      "1 10\n3 1\n",
      "2 1\n5 5\n2 100\n",
      "3 500\n24 12\n15 6\n3 1\n",
      "6 100000\n24 12\n15 6\n3 1\n40 20\n100 50\n7 2\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2023-bidoane-apa",
    title: "Concurs MI UB 2023 - Bidoanele de apa",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2023", "teoria-numerelor"],
    statement:
      "Matei are bidoane de a, b si c litri, unde a si b sunt prime intre ele, iar c este garantat un multiplu al lui a. " +
      "Matei poate pune K litri de apa in bidoane daca exista numere naturale x, y, z astfel incat a*x + b*y + c*z = K. " +
      "Care este cel mai mare numar de litri de apa pe care Matei nu il poate pune in bidoane?",
    input_format: "Se citesc pe o singura linie, separate prin spatiu, trei numere naturale a, b si c.",
    output_format: "Se afiseaza pe ecran cel mai mare numar de litri care nu poate fi obtinut folosind bidoanele a, b si c.",
    constraints: "2 <= a, b <= 1000, gcd(a, b) = 1, c este un multiplu al lui a (c = m * a, cu m >= 2)",
    hints:
      "Deoarece c este un multiplu al lui a, orice bidon de c litri poate fi inlocuit (din punctul de vedere al sumei) cu " +
      "mai multe bidoane de a litri. Deci multimea sumelor posibile este identica cu cea obtinuta folosind doar bidoanele " +
      "a si b, iar problema se reduce la teorema resturilor pentru doua numere prime intre ele.",
    explanation:
      "Ca in explicatia oficiala, se observa ca c este un multiplu al lui a, deci orice combinatie care foloseste bidonul " +
      "de c litri poate fi rescrisa echivalent folosind doar bidoane de a litri (c/a bidoane de a litri produc aceeasi " +
      "cantitate). Prin urmare multimea numerelor reprezentabile este exact multimea numerelor de forma a*x + b*y, cu x, y " +
      "naturale. Pentru doua numere a si b prime intre ele, cel mai mare numar nereprezentabil in aceasta forma este dat de " +
      "formula lui Sylvester-Frobenius: a*b - a - b. Se citeste si c doar pentru a confirma consistenta datelor de intrare; " +
      "raspunsul se calculeaza direct din a si b.",
    cpp:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "int main(){\n" +
      "    long long a, b, c; cin >> a >> b >> c;\n" +
      "    cout << (a * b - a - b) << \"\\n\";\n" +
      "    return 0;\n" +
      "}\n",
    py:
      "a, b, c = map(int, input().split())\n" +
      "print(a * b - a - b)\n",
    tests: ["5 7 10\n", "3 8 6\n", "4 9 8\n", "11 13 22\n", "2 999 4\n"],
  },
  {
    slug: "concurs-mi-ub-2023-havel-hakimi",
    title: "Concurs MI UB 2023 - Configuratii realizabile (Havel-Hakimi)",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2023", "grafuri"],
    statement:
      "Netty a primit de la un oracol k configuratii 'magice' pentru interconectarea a n calculatoare dintr-o firma. Fiecare " +
      "configuratie este un sir de n numere naturale, reprezentand, pentru fiecare calculator, cu cate alte calculatoare " +
      "trebuie interconectat. O configuratie este realizabila daca exista un graf neorientat simplu (fara bucle si fara " +
      "muchii multiple) cu n varfuri avand exact acest sir ca sir al gradelor.\n" +
      "Determinati cate dintre cele k configuratii date sunt realizabile.",
    input_format:
      "Pe prima linie se citesc numerele naturale k si n. Urmeaza k linii, fiecare continand n numere naturale, " +
      "reprezentand o configuratie (sirul de grade dorite pentru cele n calculatoare).",
    output_format: "Se afiseaza pe ecran numarul de configuratii realizabile dintre cele k date.",
    constraints: "1 <= k <= 10, 1 <= n <= 200, fiecare grad este intre 0 si n-1",
    hints:
      "Folositi criteriul Havel-Hakimi: sortati sirul descrescator, luati primul element d, eliminati-l si scadeti 1 din " +
      "urmatoarele d elemente; daca la vreun pas apare o valoare negativa sau nu exista suficiente elemente ramase, sirul nu " +
      "este realizabil; daca se ajunge doar la zerouri, sirul este realizabil. De asemenea, suma gradelor trebuie sa fie para.",
    explanation:
      "Pentru fiecare configuratie se aplica exact algoritmul Havel-Hakimi descris in explicatia oficiala: se verifica mai " +
      "intai ca suma gradelor este para (altfel sirul nu poate fi sir de grade al niciunui graf, deoarece suma gradelor este " +
      "de doua ori numarul muchiilor). Apoi, repetat: se sorteaza sirul curent descrescator, se ia primul element d, se " +
      "elimina, si se scade 1 din urmatoarele d elemente ramase; daca la orice pas d depaseste numarul de elemente ramase " +
      "sau rezulta o valoare negativa, configuratia nu este realizabila. Daca procesul se termina cu toate valorile zero, " +
      "configuratia este realizabila. Se numara cate din cele k configuratii trec acest test.",
    cpp:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "bool havelHakimi(vector<int> d){\n" +
      "    long long sum = 0;\n" +
      "    for (int x : d) sum += x;\n" +
      "    if (sum % 2 != 0) return false;\n" +
      "    while (true) {\n" +
      "        sort(d.begin(), d.end(), greater<int>());\n" +
      "        if (d.empty() || d[0] == 0) return true;\n" +
      "        int deg = d[0];\n" +
      "        d.erase(d.begin());\n" +
      "        if (deg > (int)d.size()) return false;\n" +
      "        for (int i = 0; i < deg; i++) {\n" +
      "            d[i]--;\n" +
      "            if (d[i] < 0) return false;\n" +
      "        }\n" +
      "    }\n" +
      "}\n" +
      "int main(){\n" +
      "    int k, n; cin >> k >> n;\n" +
      "    int cnt = 0;\n" +
      "    for (int i = 0; i < k; i++) {\n" +
      "        vector<int> d(n);\n" +
      "        for (int j = 0; j < n; j++) cin >> d[j];\n" +
      "        if (havelHakimi(d)) cnt++;\n" +
      "    }\n" +
      "    cout << cnt << \"\\n\";\n" +
      "    return 0;\n" +
      "}\n",
    py:
      "def havel_hakimi(d):\n" +
      "    d = list(d)\n" +
      "    if sum(d) % 2 != 0:\n" +
      "        return False\n" +
      "    while True:\n" +
      "        d.sort(reverse=True)\n" +
      "        if not d or d[0] == 0:\n" +
      "            return True\n" +
      "        deg = d[0]\n" +
      "        d = d[1:]\n" +
      "        if deg > len(d):\n" +
      "            return False\n" +
      "        for i in range(deg):\n" +
      "            d[i] -= 1\n" +
      "            if d[i] < 0:\n" +
      "                return False\n" +
      "\n" +
      "k, n = map(int, input().split())\n" +
      "cnt = 0\n" +
      "for _ in range(k):\n" +
      "    d = list(map(int, input().split()))\n" +
      "    if havel_hakimi(d):\n" +
      "        cnt += 1\n" +
      "print(cnt)\n",
    tests: [
      "1 1\n0\n",
      "2 4\n1 1 1 1\n3 3 3 1\n",
      "5 10\n5 2 6 4 3 4 2 2 1 1\n5 1 1 4 4 3 5 2 2 2\n6 4 4 3 9 2 2 2 1 1\n6 2 6 2 6 2 6 2 8 2\n7 6 7 3 3 2 2 2 4 4\n",
      "3 6\n2 2 2 2 2 2\n5 5 5 5 5 5\n1 1 1 1 1 1\n",
      "1 200\n2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2023-amestecare-consola",
    title: "Concurs MI UB 2023 - Amestecarea vectorului",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2023", "probabilitati"],
    statement:
      "Se considera un vector v cu n elemente distincte, indexate de la 0 la n-1. Se aplica urmatorul algoritm de amestecare:\n" +
      "pentru i de la 0 la n-1:\n" +
      "    swap(v[i], v[random(n)])\n" +
      "unde swap(a,b) interschimba valorile elementelor a si b, iar random(n) returneaza, cu probabilitate uniforma 1/n, un " +
      "numar aleator intre 0 si n-1 inclusiv.\n" +
      "Stiind ca elementul urmarit se afla initial pe pozitia p0, care este probabilitatea ca, dupa executarea algoritmului, " +
      "elementul urmarit sa se afle pe pozitia p (calculata ca o fractie exacta, redusa la forma ireductibila)?",
    input_format:
      "Se citesc pe o singura linie, separate prin spatiu, trei numere naturale n, p0 si p, reprezentand numarul de " +
      "elemente ale vectorului, pozitia initiala a elementului urmarit, respectiv pozitia finala pentru care se cere " +
      "probabilitatea.",
    output_format: "Se afiseaza pe ecran probabilitatea ceruta, ca fractie ireductibila in formatul 'numarator/numitor'.",
    constraints: "2 <= n <= 6, 0 <= p0 <= n-1, 0 <= p <= n-1",
    hints:
      "Deoarece exista exact n^n secvente egal probabile de valori pentru cele n apeluri random(n), iar n este mic, se poate " +
      "simula exact fiecare dintre cele n^n secvente posibile, numarand de cate ori elementul urmarit ajunge pe pozitia p, " +
      "apoi reducand fractia (numar_favorabile / n^n) la forma ireductibila cu ajutorul celui mai mare divizor comun.",
    explanation:
      "Ca in explicatia oficiala, se urmareste pas cu pas pozitia elementului tinta pe parcursul celor n interschimbari. In " +
      "loc sa se deduca manual, pas cu pas, distributia de probabilitate (asa cum se face in explicatia oficiala pentru " +
      "cazul particular n=3), se genereaza direct, prin forta bruta, toate cele n^n secvente posibile de valori pentru " +
      "random(0), random(1), ..., random(n-1) (fiecare valoare intre 0 si n-1). Pentru fiecare secventa se simuleaza exact " +
      "algoritmul (se aplica cele n interschimbari in ordine) si se verifica daca elementul care a pornit de pe pozitia p0 " +
      "ajunge pe pozitia p. Se numara cate din cele n^n secvente conduc la acest rezultat, iar fractia " +
      "numar_favorabile / n^n se simplifica prin impartire la cel mai mare divizor comun al celor doi termeni.",
    cpp:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "int main(){\n" +
      "    long long n, p0, p; cin >> n >> p0 >> p;\n" +
      "    long long total = 1;\n" +
      "    for (int i = 0; i < n; i++) total *= n;\n" +
      "    long long favorable = 0;\n" +
      "    vector<int> r(n);\n" +
      "    for (long long code = 0; code < total; code++) {\n" +
      "        long long c = code;\n" +
      "        for (int i = 0; i < n; i++) { r[i] = c % n; c /= n; }\n" +
      "        vector<int> v(n);\n" +
      "        for (int i = 0; i < n; i++) v[i] = i;\n" +
      "        for (int i = 0; i < n; i++) swap(v[i], v[r[i]]);\n" +
      "        int pos = -1;\n" +
      "        for (int i = 0; i < n; i++) if (v[i] == p0) pos = i;\n" +
      "        if (pos == p) favorable++;\n" +
      "    }\n" +
      "    long long g = __gcd(favorable, total);\n" +
      "    if (g == 0) g = 1;\n" +
      "    cout << (favorable / g) << \"/\" << (total / g) << \"\\n\";\n" +
      "    return 0;\n" +
      "}\n",
    py:
      "import math\n" +
      "n, p0, p = map(int, input().split())\n" +
      "total = n ** n\n" +
      "favorable = 0\n" +
      "for code in range(total):\n" +
      "    c = code\n" +
      "    r = []\n" +
      "    for i in range(n):\n" +
      "        r.append(c % n)\n" +
      "        c //= n\n" +
      "    v = list(range(n))\n" +
      "    for i in range(n):\n" +
      "        v[i], v[r[i]] = v[r[i]], v[i]\n" +
      "    pos = v.index(p0)\n" +
      "    if pos == p:\n" +
      "        favorable += 1\n" +
      "g = math.gcd(favorable, total)\n" +
      "if g == 0:\n" +
      "    g = 1\n" +
      "print(f\"{favorable // g}/{total // g}\")\n",
    tests: ["3 2 0\n", "2 0 1\n", "4 3 0\n", "6 5 0\n", "3 0 0\n"],
  },
  {
    slug: "concurs-mi-ub-2023-siruri-fara-triplete",
    title: "Concurs MI UB 2023 - Siruri fara triplete de litere egale",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2023", "recurenta"],
    statement:
      "Consideram sirurile de caractere de lungime L care contin doar literele a si b, fara a contine trei aparitii " +
      "consecutive ale aceleiasi litere (adica fara subsirul 'aaa' sau 'bbb'). Cate astfel de siruri de lungime L exista?",
    input_format: "Se citeste de la tastatura un singur numar natural L.",
    output_format: "Se afiseaza pe ecran numarul de siruri valide de lungime L.",
    constraints: "1 <= L <= 80",
    hints:
      "Notati cu T(n) numarul de siruri valide de lungime n. Orice sir valid de lungime n se obtine fie dintr-un sir valid " +
      "de lungime n-1 prin adaugarea unei litere diferite de ultima, fie dintr-un sir valid de lungime n-2 prin adaugarea a " +
      "doua litere identice, diferite de ultima litera a prefixului. Rezulta recurenta T(n) = T(n-1) + T(n-2).",
    explanation:
      "Se foloseste exact recurenta dedusa in explicatia oficiala: T(1) = 2, T(2) = 4, iar pentru n >= 3, T(n) = T(n-1) + " +
      "T(n-2), deoarece orice sir valid de lungime n se obtine fie extinzand cu o litera diferita un sir valid de lungime " +
      "n-1, fie extinzand cu doua litere identice (diferite de ultima litera) un sir valid de lungime n-2. Se calculeaza " +
      "iterativ T(1), T(2), ..., T(L) si se afiseaza T(L).",
    cpp:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "int main(){\n" +
      "    int L; cin >> L;\n" +
      "    if (L == 1) { cout << 2 << \"\\n\"; return 0; }\n" +
      "    unsigned long long a = 2, b = 4;\n" +
      "    if (L == 2) { cout << b << \"\\n\"; return 0; }\n" +
      "    unsigned long long t = 0;\n" +
      "    for (int n = 3; n <= L; n++) { t = a + b; a = b; b = t; }\n" +
      "    cout << b << \"\\n\";\n" +
      "    return 0;\n" +
      "}\n",
    py:
      "L = int(input())\n" +
      "if L == 1:\n" +
      "    print(2)\n" +
      "else:\n" +
      "    a, b = 2, 4\n" +
      "    for n in range(3, L + 1):\n" +
      "        a, b = b, a + b\n" +
      "    print(b)\n",
    tests: ["1\n", "2\n", "10\n", "50\n", "80\n"],
  },
  {
    slug: "concurs-mi-ub-2023-probabilitate-rnd",
    title: "Concurs MI UB 2023 - Probabilitatea functiei rnd",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2023", "probabilitati"],
    statement:
      "Consideram functia de mai jos, unde rnd() returneaza un numar real uniform distribuit intre 0 si 1, iar p1, p2 si p3 " +
      "sunt trei numere naturale intre 1 si 99, reprezentand procente (adica probabilitatile folosite in comparatii sunt " +
      "p1/100, p2/100 si p3/100):\n\n" +
      "bool F() {\n" +
      "    if (rnd() < p1/100.0) return true;\n" +
      "    if (rnd() < p2/100.0) return false;\n" +
      "    return rnd() < p3/100.0;\n" +
      "}\n\n" +
      "Care este probabilitatea ca functia F sa returneze true? Raspunsul trebuie afisat ca numar zecimal cu exact 6 " +
      "zecimale.",
    input_format: "Se citesc pe o singura linie, separate prin spatiu, trei numere naturale p1, p2 si p3 (intre 1 si 99).",
    output_format: "Se afiseaza pe ecran probabilitatea ca F() sa returneze true, ca numar zecimal cu exact 6 zecimale.",
    constraints: "1 <= p1, p2, p3 <= 99",
    hints:
      "Cele trei apeluri ale lui rnd() sunt independente. F() returneaza true daca prima conditie e adevarata (probabilitate " +
      "p1/100), sau daca prima e falsa si a doua e falsa si a treia e adevarata (probabilitate (1-p1/100)*(1-p2/100)*p3/100). " +
      "Pentru a evita erorile de rotunjire, calculati totul cu numere intregi (procente inmultite intre ele), nu cu numere " +
      "in virgula mobila.",
    explanation:
      "Ca in explicatia oficiala, probabilitatea ca F() sa returneze true este suma a doua cazuri disjuncte: (1) prima " +
      "conditie este adevarata, cu probabilitate p1/100; (2) prima conditie este falsa (probabilitate 1-p1/100), a doua " +
      "conditie este falsa (probabilitate 1-p2/100), iar a treia comparatie este adevarata (probabilitate p3/100). Deci " +
      "P(true) = p1/100 + (1-p1/100)*(1-p2/100)*(p3/100). Pentru a garanta un rezultat exact identic intre implementari, " +
      "calculul se face exclusiv cu numere intregi: se calculeaza numaratorul exact peste numitorul comun 100^3 = 1000000, " +
      "folosind formula echivalenta numarator = p1*100*100 + (100-p1)*(100-p2)*p3, apoi se formateaza manual rezultatul ca " +
      "numar zecimal cu exact 6 zecimale.",
    cpp:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "int main(){\n" +
      "    long long p1, p2, p3; cin >> p1 >> p2 >> p3;\n" +
      "    long long num = p1 * 100 * 100 + (100 - p1) * (100 - p2) * p3;\n" +
      "    long long den = 1000000;\n" +
      "    long long ip = num / den;\n" +
      "    long long fp = num % den;\n" +
      "    cout << ip << \".\" << setw(6) << setfill('0') << fp << \"\\n\";\n" +
      "    return 0;\n" +
      "}\n",
    py:
      "p1, p2, p3 = map(int, input().split())\n" +
      "num = p1 * 100 * 100 + (100 - p1) * (100 - p2) * p3\n" +
      "den = 1000000\n" +
      "ip = num // den\n" +
      "fp = num % den\n" +
      "print(f\"{ip}.{fp:06d}\")\n",
    tests: ["50 40 30\n", "10 10 10\n", "99 1 1\n", "1 99 99\n", "75 25 50\n"],
  },
  {
    slug: "concurs-mi-ub-2023-joc-multiplicativ",
    title: "Concurs MI UB 2023 - Jocul multiplicativ",
    difficulty: "hard",
    tags: ["concurs", "mateinfo-ub", "2023", "teoria-jocurilor"],
    statement:
      "X si Y joaca urmatorul joc: se porneste cu numarul p = 1; pe rand, X si Y (incepand cu X) multiplica numarul p cu un " +
      "numar din multimea {2, 3, 4, 5, 6, 7, 8, 9} pe care il aleg. Castiga primul jucator care ajunge cu p >= n, unde n " +
      "este un numar dat. Ambii jucatori joaca optim.\n" +
      "Dandu-se k valori pentru n, determinati pentru cate dintre ele castiga X.",
    input_format:
      "Pe prima linie se citeste numarul natural k. Pe a doua linie se citesc k numere naturale, separate prin spatiu, " +
      "reprezentand valorile lui n pentru care se joaca cate un joc.",
    output_format: "Se afiseaza pe ecran numarul de jocuri (dintre cele k) castigate de X.",
    constraints: "1 <= k <= 15, 2 <= n <= 1000000000000",
    hints:
      "Construiti intervalele de castig/pierdere pornind de la [2,9] (castigator pentru jucatorul la mutare), apoi alternand: " +
      "dupa un interval castigator care se termina la valoarea e, urmeaza intervalul pierzator [e+1, 2e]; dupa un interval " +
      "pierzator care se termina la valoarea e, urmeaza intervalul castigator [e+1, 9e]. Determinati carui interval ii " +
      "apartine fiecare n dat.",
    explanation:
      "Ca in explicatia oficiala, se construiesc iterativ intervale alternante de tip 'castigator' (pentru jucatorul care " +
      "urmeaza sa mute) si 'pierzator', incepand cu [2,9] castigator: daca jucatorul aflat intr-un interval castigator " +
      "poate alege un multiplicator care sa il duca in intervalul pierzator urmator sau peste n, atunci este castigator; " +
      "capatul unui interval castigator se obtine inmultind capatul intervalului pierzator anterior cu 9 (multiplicatorul " +
      "maxim), iar capatul unui interval pierzator se obtine inmultind capatul intervalului castigator anterior cu 2 " +
      "(multiplicatorul minim, deoarece orice mutare din acest interval mic duce automat in intervalul castigator urmator). " +
      "Se genereaza aceste intervale pana cand acopera toate valorile n date, apoi se verifica pentru fiecare n daca se " +
      "afla intr-un interval castigator pentru X (primul, al treilea, al cincilea interval samd.), numarandu-se cate din " +
      "cele k valori sunt castigatoare pentru X.",
    cpp:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "int main(){\n" +
      "    int k; cin >> k;\n" +
      "    vector<long long> ns(k);\n" +
      "    long long maxN = 0;\n" +
      "    for (int i = 0; i < k; i++) { cin >> ns[i]; maxN = max(maxN, ns[i]); }\n" +
      "    vector<pair<long long,long long>> intervals;\n" +
      "    vector<bool> isWin;\n" +
      "    long long lo = 2, hi = 9;\n" +
      "    bool win = true;\n" +
      "    while (lo <= maxN) {\n" +
      "        intervals.push_back({lo, hi});\n" +
      "        isWin.push_back(win);\n" +
      "        long long nlo = hi + 1;\n" +
      "        long long nhi = win ? hi * 2 : hi * 9;\n" +
      "        lo = nlo; hi = nhi;\n" +
      "        win = !win;\n" +
      "    }\n" +
      "    int xwins = 0;\n" +
      "    for (int i = 0; i < k; i++) {\n" +
      "        long long n = ns[i];\n" +
      "        for (size_t j = 0; j < intervals.size(); j++) {\n" +
      "            if (n >= intervals[j].first && n <= intervals[j].second) {\n" +
      "                if (isWin[j]) xwins++;\n" +
      "                break;\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << xwins << \"\\n\";\n" +
      "    return 0;\n" +
      "}\n",
    py:
      "k = int(input())\n" +
      "ns = list(map(int, input().split()))\n" +
      "maxN = max(ns)\n" +
      "intervals = []\n" +
      "lo, hi = 2, 9\n" +
      "win = True\n" +
      "while lo <= maxN:\n" +
      "    intervals.append((lo, hi, win))\n" +
      "    nlo = hi + 1\n" +
      "    nhi = hi * 2 if win else hi * 9\n" +
      "    lo, hi = nlo, nhi\n" +
      "    win = not win\n" +
      "\n" +
      "xwins = 0\n" +
      "for n in ns:\n" +
      "    for (l, h, w) in intervals:\n" +
      "        if l <= n <= h:\n" +
      "            if w:\n" +
      "                xwins += 1\n" +
      "            break\n" +
      "print(xwins)\n",
    tests: [
      "1\n5\n",
      "3\n10 19 163\n",
      "5\n2 9 10 18 19\n",
      "9\n37 89 167 2920 5832 66666 104970 131313 34012226\n",
      "6\n100 100000 5000000000 999999999999 2 9\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2023-tastatura-plimbari",
    title: "Concurs MI UB 2023 - Plimbari pe tastatura numerica",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2023", "grafuri"],
    statement:
      "Matei are o tastatura numerica cu 17 taste: Num, /, *, -, 7, 8, 9, +, 4, 5, 6, 1, 2, 3, Enter, 0, Del, asezate ca pe " +
      "un tastatura numerica obisnuita (tasta 0 este lata si atinge tastele 1 si 2, iar tastele + si Enter sunt inalte si " +
      "ating cate 4, respectiv 3 taste vecine). Doua taste sunt alaturate daca sunt diferite si se ating pe o latura sau " +
      "jumatate de latura (vecinatatea pe diagonala nu conteaza).\n" +
      "Matei apasa in total pe K taste. Prima tasta poate fi oricare dintre cele 17, iar incepand cu a doua apasare, fiecare " +
      "tasta apasata trebuie sa fie alaturata celei apasate anterior. In cate moduri poate Matei apasa pe cele K taste?",
    input_format: "Se citeste de la tastatura un singur numar natural K, numarul total de apasari.",
    output_format: "Se afiseaza pe ecran numarul de moduri in care Matei poate apasa K taste.",
    constraints: "1 <= K <= 30",
    hints:
      "Notati cu d(k, x) numarul de moduri de a face primele k apasari astfel incat a k-a tasta apasata sa fie x. Avem " +
      "d(1, x) = 1 pentru orice tasta x, iar d(k, x) = suma d(k-1, y) pentru toate tastele y vecine cu x. Raspunsul este " +
      "suma d(K, x) pentru toate cele 17 taste x.",
    explanation:
      "Se foloseste graful de adiacenta al tastelor exact asa cum este descris in explicatia oficiala (fiecare tasta este " +
      "un nod, iar doua noduri sunt legate daca tastele corespunzatoare sunt alaturate fizic). Se aplica programare " +
      "dinamica: se porneste cu d(1,x) = 1 pentru fiecare tasta x (prima apasare poate fi oricare), apoi, pentru fiecare " +
      "pas suplimentar pana la K, se calculeaza d(k,x) ca suma valorilor d(k-1,y) pentru toti vecinii y ai lui x (aceasta " +
      "este exact recurenta din explicatia oficiala, generalizata la K apasari in loc de 10). Raspunsul final este suma " +
      "tuturor valorilor d(K,x) pentru cele 17 taste.",
    cpp:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "int main(){\n" +
      "    int K; cin >> K;\n" +
      "    // 0=Num 1=/ 2=* 3=- 4=7 5=8 6=9 7=+ 8=4 9=5 10=6 11=1 12=2 13=3 14=Enter 15=0 16=Del\n" +
      "    vector<vector<int>> adj(17);\n" +
      "    auto addEdge = [&](int a, int b){ adj[a].push_back(b); adj[b].push_back(a); };\n" +
      "    addEdge(0,1); addEdge(0,4);\n" +
      "    addEdge(1,2); addEdge(1,5);\n" +
      "    addEdge(2,3); addEdge(2,6);\n" +
      "    addEdge(3,7);\n" +
      "    addEdge(4,5); addEdge(4,8);\n" +
      "    addEdge(5,6); addEdge(5,9);\n" +
      "    addEdge(6,7); addEdge(6,10);\n" +
      "    addEdge(7,10); addEdge(7,14);\n" +
      "    addEdge(8,9); addEdge(8,11);\n" +
      "    addEdge(9,10); addEdge(9,12);\n" +
      "    addEdge(10,13);\n" +
      "    addEdge(11,12); addEdge(11,15);\n" +
      "    addEdge(12,13); addEdge(12,15);\n" +
      "    addEdge(13,14); addEdge(13,16);\n" +
      "    addEdge(14,16);\n" +
      "    addEdge(15,16);\n" +
      "    vector<unsigned long long> d(17, 1);\n" +
      "    for (int step = 2; step <= K; step++) {\n" +
      "        vector<unsigned long long> nd(17, 0);\n" +
      "        for (int x = 0; x < 17; x++)\n" +
      "            for (int y : adj[x]) nd[x] += d[y];\n" +
      "        d = nd;\n" +
      "    }\n" +
      "    unsigned long long total = 0;\n" +
      "    for (int x = 0; x < 17; x++) total += d[x];\n" +
      "    cout << total << \"\\n\";\n" +
      "    return 0;\n" +
      "}\n",
    py:
      "K = int(input())\n" +
      "# 0=Num 1=/ 2=* 3=- 4=7 5=8 6=9 7=+ 8=4 9=5 10=6 11=1 12=2 13=3 14=Enter 15=0 16=Del\n" +
      "adj = [[] for _ in range(17)]\n" +
      "def add_edge(a, b):\n" +
      "    adj[a].append(b)\n" +
      "    adj[b].append(a)\n" +
      "\n" +
      "add_edge(0,1); add_edge(0,4)\n" +
      "add_edge(1,2); add_edge(1,5)\n" +
      "add_edge(2,3); add_edge(2,6)\n" +
      "add_edge(3,7)\n" +
      "add_edge(4,5); add_edge(4,8)\n" +
      "add_edge(5,6); add_edge(5,9)\n" +
      "add_edge(6,7); add_edge(6,10)\n" +
      "add_edge(7,10); add_edge(7,14)\n" +
      "add_edge(8,9); add_edge(8,11)\n" +
      "add_edge(9,10); add_edge(9,12)\n" +
      "add_edge(10,13)\n" +
      "add_edge(11,12); add_edge(11,15)\n" +
      "add_edge(12,13); add_edge(12,15)\n" +
      "add_edge(13,14); add_edge(13,16)\n" +
      "add_edge(14,16)\n" +
      "add_edge(15,16)\n" +
      "\n" +
      "d = [1] * 17\n" +
      "for step in range(2, K + 1):\n" +
      "    nd = [0] * 17\n" +
      "    for x in range(17):\n" +
      "        for y in adj[x]:\n" +
      "            nd[x] += d[y]\n" +
      "    d = nd\n" +
      "print(sum(d))\n",
    tests: ["1\n", "2\n", "3\n", "10\n", "30\n"],
  },
  {
    slug: "concurs-mi-ub-2023-suma-afisari-recursive",
    title: "Concurs MI UB 2023 - Suma afisarilor unei functii recursive",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2023", "recurenta"],
    statement:
      "Consideram urmatoarea functie recursiva, in care k si t sunt numere naturale suficient de mari incat sa nu apara " +
      "depasire de capacitate:\n\n" +
      "void f(int n, unsigned long long k, unsigned long long t) {\n" +
      "    if (n >= 0)\n" +
      "        if (k <= t) {\n" +
      "            cout << k << \"_\";\n" +
      "            f(n, k+1, t);\n" +
      "        } else\n" +
      "            f(n-1, 1, 2*t);\n" +
      "}\n\n" +
      "Cu cat este egala suma tuturor numerelor afisate pe ecran in urma apelului f(N, 1, 1)?",
    input_format: "Se citeste de la tastatura un singur numar natural N.",
    output_format: "Se afiseaza pe ecran suma tuturor numerelor pe care le-ar afisa apelul f(N, 1, 1).",
    constraints: "0 <= N <= 30",
    hints:
      "Pentru un t fixat, functia afiseaza toate numerele 1,2,...,t, apoi continua cu f(n-1, 1, 2*t). Deci valorile lui t " +
      "sunt 1, 2, 4, ..., 2^N, iar suma totala este suma, pentru i de la 0 la N, a sumei 1+2+...+2^i.",
    explanation:
      "Ca in explicatia oficiala, pentru un apel cu parametrul t fixat, functia afiseaza pe rand toate numerele de la 1 la " +
      "t (cat timp k <= t), apoi apeleaza f(n-1, 1, 2*t), deci t se dubleaza si n scade cu 1. Pornind de la f(N,1,1), " +
      "valorile succesive ale lui t sunt 1, 2, 4, ..., 2^N (in total N+1 valori, corespunzatoare lui n = N, N-1, ..., 0). " +
      "Suma totala afisata este S = suma, pentru i de la 0 la N, a lui (1+2+...+2^i) = 2^i*(2^i+1)/2. Se calculeaza aceasta " +
      "suma direct, printr-o bucla, termen cu termen, folosind numere pe 64 de biti fara semn, evitand astfel orice risc de " +
      "depasire de capacitate pentru N in intervalul dat.",
    cpp:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "int main(){\n" +
      "    int N; cin >> N;\n" +
      "    unsigned long long S = 0;\n" +
      "    unsigned long long p = 1;\n" +
      "    for (int i = 0; i <= N; i++) {\n" +
      "        S += p * (p + 1) / 2;\n" +
      "        p *= 2;\n" +
      "    }\n" +
      "    cout << S << \"\\n\";\n" +
      "    return 0;\n" +
      "}\n",
    py:
      "N = int(input())\n" +
      "S = 0\n" +
      "p = 1\n" +
      "for i in range(N + 1):\n" +
      "    S += p * (p + 1) // 2\n" +
      "    p *= 2\n" +
      "print(S)\n",
    tests: ["0\n", "1\n", "5\n", "15\n", "30\n"],
  },
  {
    slug: "concurs-mi-ub-2023-multipli-forma-speciala",
    title: "Concurs MI UB 2023 - Multipli de forma speciala",
    difficulty: "hard",
    tags: ["concurs", "mateinfo-ub", "2023", "teoria-numerelor"],
    statement:
      "Un numar are forma speciala daca este alcatuit din m cifre de 1 urmate de n cifre de 0 (m >= 1, n >= 1), de exemplu " +
      "111000 (m=3, n=3). Dandu-se un numar natural M (prim cu 30, adica necivizibil cu 2, 3 sau 5) si o limita L, " +
      "determinati cate numere de forma speciala, cu m + n <= L, sunt multipli de M.",
    input_format: "Se citesc pe o singura linie, separate prin spatiu, doua numere naturale M si L.",
    output_format: "Se afiseaza pe ecran numarul de perechi (m, n) valide, cu m+n <= L, pentru care numarul de forma speciala este multiplu de M.",
    constraints: "M este prim cu 30 (necivizibil cu 2, 3 sau 5), 7 <= M <= 5000, 2 <= L <= 100000",
    hints:
      "Numarul cu m cifre de 1 urmate de n cifre de 0 se scrie R(m) * 10^n, unde R(m) = (10^m - 1)/9 este repunitul cu m " +
      "cifre. Deoarece M este prim cu 10 si cu 9, M | R(m)*10^n este echivalent cu 10^m ≡ 1 (mod M), adica m trebuie sa fie " +
      "multiplu al ordinului multiplicativ al lui 10 modulo M.",
    explanation:
      "Se aplica exact rationamentul din explicatia oficiala: numarul cu m cifre de 1 urmate de n cifre de 0 se scrie ca " +
      "R(m)*10^n, unde R(m)=(10^m-1)/9. Deoarece M este prim cu 10 (deci cu factorul 10^n) si prim cu 9 (deoarece M este " +
      "prim cu 3), divizibilitatea cu M a acestui numar este echivalenta cu 10^m ≡ 1 (mod M). In loc sa se factorizeze M " +
      "si sa se combine ordinele modulo fiecare factor prim (ca in explicatia originala, care foloseste teorema chinezeasca " +
      "a resturilor), se calculeaza direct, prin simulare, ordinul multiplicativ al lui 10 modulo M: cel mai mic ord >= 1 " +
      "astfel incat 10^ord ≡ 1 (mod M) (se gaseste prin inmultiri repetate modulo M, garantat sa se termine deoarece " +
      "gcd(10,M)=1). Odata cunoscut ord, m trebuie sa fie un multiplu al lui ord: m = ord*k, pentru k = 1, 2, .... Pentru " +
      "fiecare astfel de m <= L-1 (trebuie sa ramana loc pentru n >= 1), numarul de valori valide pentru n este exact " +
      "L - m. Raspunsul final este suma acestor cantitati pentru toate valorile posibile ale lui k.",
    cpp:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "int main(){\n" +
      "    long long M, L; cin >> M >> L;\n" +
      "    long long r = 10 % M;\n" +
      "    long long ord = 1;\n" +
      "    while (r != 1 % M) { r = (r * 10) % M; ord++; }\n" +
      "    long long total = 0;\n" +
      "    for (long long m = ord; m <= L - 1; m += ord) total += (L - m);\n" +
      "    cout << total << \"\\n\";\n" +
      "    return 0;\n" +
      "}\n",
    py:
      "M, L = map(int, input().split())\n" +
      "r = 10 % M\n" +
      "ord_ = 1\n" +
      "while r != 1 % M:\n" +
      "    r = (r * 10) % M\n" +
      "    ord_ += 1\n" +
      "total = 0\n" +
      "m = ord_\n" +
      "while m <= L - 1:\n" +
      "    total += (L - m)\n" +
      "    m += ord_\n" +
      "print(total)\n",
    tests: ["7 50\n", "11 10\n", "13 20\n", "17 100\n", "2023 15000\n"],
  },
];
async function seedGroup(list) {
  const summary = [];

  for (const p of list) {
    console.log(`\n=== ${p.slug} ===`);
    try {
      let allOk = true;
      const testRows = [];

      for (let i = 0; i < p.tests.length; i++) {
        const input = p.tests[i];
        const [cppOut, pyOut] = await Promise.all([runCustom("cpp", p.cpp, input), runCustom("python", p.py, input)]);

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

        testRows.push({ input, expected_output: `${normCpp}\n`, is_sample: i < 2 });
      }

      if (!allOk) {
        console.error(`!!! ${p.slug} has failing tests - NOT publishing.`);
        summary.push({ slug: p.slug, ok: false, tests: testRows.length });
        continue;
      }

      const existing = await pool.query("SELECT id FROM problems WHERE slug = $1", [p.slug]);
      let problemId;
      if (existing.rows.length > 0) {
        problemId = existing.rows[0].id;
        await pool.query(
          `UPDATE problems SET
             title=$2, statement=$3, input_format=$4, output_format=$5, constraints=$6,
             difficulty=$7, time_limit_ms=$8, memory_limit_mb=$9, source=$10, tags=$11,
             allowed_languages=$12, is_published=true, editorial_status='published', official_solution=$13,
             hints=$14, explanation=$15, official_solution_cpp=$16, official_solution_python=$17,
             curriculum_level=$18, curriculum_chapter_id=$19, curriculum_subcategory_id=$20,
             solution_mode='full', checker_mode='exact', updated_at=NOW()
           WHERE id=$1`,
          [
            problemId,
            p.title,
            p.statement,
            p.input_format,
            p.output_format,
            p.constraints,
            p.difficulty,
            p.time_limit_ms || 1500,
            p.memory_limit_mb || 64,
            "Concurs Mate Info UB",
            p.tags || [],
            ["cpp", "c", "pascal", "python"],
            p.cpp,
            p.hints,
            p.explanation,
            p.cpp,
            p.py,
            CHAPTER.level,
            CHAPTER.chapter,
            CHAPTER.sub,
          ],
        );
        await pool.query("DELETE FROM test_cases WHERE problem_id = $1", [problemId]);
      } else {
        const inserted = await pool.query(
          `INSERT INTO problems (
             slug, title, statement, input_format, output_format, constraints,
             difficulty, time_limit_ms, memory_limit_mb, source, tags,
             allowed_languages, is_published, official_solution,
             hints, explanation, official_solution_cpp, official_solution_python,
             curriculum_level, curriculum_chapter_id, curriculum_subcategory_id,
             solution_mode, checker_mode, editorial_status, estimated_minutes
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,$13,$14,$15,$16,$17,$18,$19,$20,'full','exact','published',5
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
            "Concurs Mate Info UB",
            p.tags || [],
            ["cpp", "c", "pascal", "python"],
            p.cpp,
            p.hints,
            p.explanation,
            p.cpp,
            p.py,
            CHAPTER.level,
            CHAPTER.chapter,
            CHAPTER.sub,
          ],
        );
        problemId = inserted.rows[0].id;
      }

      for (let i = 0; i < testRows.length; i++) {
        const t = testRows[i];
        await pool.query(
          `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index) VALUES ($1,$2,$3,$4,$5,$6)`,
          [problemId, t.input, t.expected_output, t.is_sample, 10, i + 1],
        );
      }

      console.log(`published ${p.slug} (${p.difficulty}) with ${testRows.length} tests`);
      summary.push({ slug: p.slug, ok: true, tests: testRows.length });
    } catch (err) {
      console.error(`FAIL ${p.slug}: ${err.message}`);
      summary.push({ slug: p.slug, ok: false, error: err.message });
    }
  }

  return summary;
}

async function main() {
  const onlySlugs = process.env.ONLY_SLUGS ? process.env.ONLY_SLUGS.split(",") : null;
  const toRun = onlySlugs ? problems.filter((p) => onlySlugs.includes(p.slug)) : problems;
  const summary = await seedGroup(toRun);

  console.log("\n=== SUMMARY ===");
  let okCount = 0;
  for (const s of summary) {
    if (s.ok) okCount++;
    console.log(`${s.ok ? "OK  " : "FAIL"} ${s.slug} (${s.tests || 0} tests)`);
  }
  console.log(`\n${okCount}/${summary.length} publicate cu succes.`);
  if (okCount < summary.length) process.exitCode = 1;

  await pool.end();
}

main().catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
