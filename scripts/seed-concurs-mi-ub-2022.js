const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "concursuri", chapter: "concurs-mi-ub-2022", sub: "probleme-2022" };

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
    slug: "concurs-mi-ub-2022-amestec-cafele",
    title: "Concurs MI UB 2022 - Amestec de cafele",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2022", "matematica", "simulare"],
    statement:
      "Matei are n cafele. Fiecare cafea are un volum v (in ml, multiplu de 100) si o concentratie procentuala c (un numar intreg intre 1 si 100).\n\nMatei poate amesteca oricare doua cafele: daca amesteca o cafea cu v1 ml si concentratie c1 cu o cafea cu v2 ml si concentratie c2, el obtine o cafea noua cu volumul v1+v2 si concentratia (c1*v1+c2*v2)/(v1+v2).\n\nSatisfactia adusa lui Matei de o cafea cu volumul v si concentratia c este v*c/100.\n\nStiind ca Matei poate amesteca oricate cafele doreste (eventual deloc), care este satisfactia maxima totala pe care o poate obtine?",
    input_format:
      "Pe prima linie se citeste numarul intreg n, numarul de cafele.\nPe urmatoarele n linii se citesc cate doua numere intregi v si c, separate printr-un spatiu, reprezentand volumul (in ml) si concentratia procentuala a fiecarei cafele.",
    output_format: "Se afiseaza un singur numar intreg: satisfactia maxima totala pe care o poate obtine Matei.",
    constraints: "1 <= n <= 10\n100 <= v <= 2000, v multiplu de 100\n1 <= c <= 100",
    hints:
      "Calculati algebric satisfactia amestecului a doua cafele cu volumele v1, v2 si concentratiile c1, c2: (v1+v2) * (c1*v1+c2*v2)/((v1+v2)*100) = (c1*v1+c2*v2)/100, adica exact suma satisfactiilor celor doua cafele initiale (v1*c1/100 + v2*c2/100). Amestecarea nu pierde si nu castiga satisfactie.",
    explanation:
      "Cheia problemei este observatia algebrica din enunt: satisfactia unui amestec a doua cafele este mereu egala cu suma satisfactiilor celor doua cafele initiale, indiferent de ordinea sau gruparea amestecarilor. Prin urmare amestecarea este complet irelevanta pentru rezultatul final, iar satisfactia maxima (de fapt singura valoare posibila) este pur si simplu suma satisfactiilor individuale ale tuturor cafelelor: suma peste toate cafelele a lui v_i * c_i / 100. Algoritmul citeste cele n perechi (v, c) si aduna v/100 * c pentru fiecare, folosind numere intregi (v este garantat multiplu de 100).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    int n; cin >> n;
    long long s = 0;
    for (int i = 0; i < n; i++){
        long long v, c; cin >> v >> c;
        s += (v/100) * c;
    }
    cout << s << "\\n";
}
`,
    py: `n = int(input())
s = 0
for _ in range(n):
    v, c = map(int, input().split())
    s += (v // 100) * c
print(s)
`,
    tests: [
      "5\n100 40\n200 30\n300 10\n500 10\n100 50\n",
      "1\n1000 25\n",
      "2\n100 1\n100 100\n",
      "10\n100 10\n200 20\n300 30\n400 40\n500 50\n600 60\n700 70\n800 80\n900 90\n1000 100\n",
      "10\n2000 100\n2000 100\n2000 100\n2000 100\n2000 100\n2000 100\n2000 100\n2000 100\n2000 100\n2000 100\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2022-furnica-spirala",
    title: "Concurs MI UB 2022 - Furnica in spirala",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2022", "matematica", "recurenta"],
    statement:
      "Se considera o suprafata (matrice) infinita in jos si in dreapta, cu liniile numerotate de sus in jos si coloanele de la stanga la dreapta, incepand de la 1. O furnica exploreaza aceasta suprafata pornind din coltul stanga-sus (1,1), la pasul 1.\n\nDeoarece furnica vrea sa ramana mereu aproape de zona deja explorata, ea extinde succesiv patratul deja parcurs din coltul stanga-sus: la inceput coboara in celula (2,1), apoi merge la dreapta in (2,2), apoi urca in (1,2), completand un patrat 2x2. Pe acesta il extinde mergand la dreapta in (1,3), apoi coborand in (2,3) si (3,3), dupa care se deplaseaza spre stanga in (3,2) si (3,1), completand un patrat 3x3, si tot asa.\n\nSe observa ca la finalul explorarii unui patrat k x k, furnica se afla exact la pasul k^2: daca k este par, ea se afla in coltul (1,k); daca k este impar, se afla in coltul (k,1). Din acel colt, ea extinde patratul catre (k+1)x(k+1) mergand mai intai cu un pas perpendicular pe latura scurta, apoi parcurgand restul marginii noului patrat.\n\nSe da un numar intreg t. Pe ce linie si pe ce coloana se va afla furnica la pasul t?",
    input_format: "Se citeste un singur numar intreg t.",
    output_format:
      "Se afiseaza doua numere intregi, separate printr-un spatiu: linia si coloana pe care se afla furnica la pasul t.",
    constraints: "1 <= t <= 4 * 10^16",
    hints:
      "Gasiti cel mai mare n astfel incat n^2 <= t (radacina patrata intreaga a lui t, calculata exact prin cautare binara). Daca t = n^2 exact, pozitia depinde doar de paritatea lui n: (n,1) daca n impar, (1,n) daca n par. Altfel, calculati rest = t - n^2 (1 <= rest <= 2n) si determinati pe care dintre cele doua segmente de lungime n ale extinderii de la patratul n la patratul n+1 cade acest rest.",
    explanation:
      "Solutia reutilizeaza rationamentul din explicatia oficiala: se cauta cel mai mare n cu n^2 <= t, folosind o radacina patrata intreaga calculata prin cautare binara (nu prin sqrt() in virgula mobila, pentru precizie exacta la valori mari). Daca t = n^2, pozitia e data direct de paritatea lui n. Altfel se calculeaza rest = t - n^2 si se urmareste traiectoria de extindere de la patratul n la patratul n+1: primul pas e perpendicular pe ultima latura parcursa, apoi urmeaza un segment de n pasi de-a lungul noii margini si inca un segment de n pasi de-a lungul laturii opuse, directiile fiind determinate de paritatea lui n. Astfel se afla direct linia si coloana, fara a simula pas cu pas (imposibil pentru t de ordinul 10^16).",
    cpp: `#include <bits/stdc++.h>
using namespace std;

long long isqrt_ll(long long x){
    long long lo = 0, hi = 300000000LL;
    while (lo < hi){
        long long mid = lo + (hi - lo + 1) / 2;
        if (mid * mid <= x) lo = mid; else hi = mid - 1;
    }
    return lo;
}

int main(){
    long long t; cin >> t;
    if (t == 1){ cout << 1 << " " << 1 << "\\n"; return 0; }
    long long n = isqrt_ll(t);
    if (n * n == t){
        if (n % 2 == 0) cout << 1 << " " << n << "\\n";
        else cout << n << " " << 1 << "\\n";
        return 0;
    }
    long long rem = t - n * n;
    if (n % 2 == 1){
        if (rem <= n + 1) cout << (n + 1) << " " << rem << "\\n";
        else cout << (2*n + 2 - rem) << " " << (n + 1) << "\\n";
    } else {
        if (rem <= n + 1) cout << rem << " " << (n + 1) << "\\n";
        else cout << (n + 1) << " " << (2*n + 2 - rem) << "\\n";
    }
}
`,
    py: `def isqrt_ll(x):
    lo, hi = 0, 300000000
    while lo < hi:
        mid = lo + (hi - lo + 1) // 2
        if mid * mid <= x: lo = mid
        else: hi = mid - 1
    return lo

t = int(input())
if t == 1:
    print(1, 1)
else:
    n = isqrt_ll(t)
    if n * n == t:
        if n % 2 == 0: print(1, n)
        else: print(n, 1)
    else:
        rem = t - n * n
        if n % 2 == 1:
            if rem <= n + 1: print(n + 1, rem)
            else: print(2*n + 2 - rem, n + 1)
        else:
            if rem <= n + 1: print(rem, n + 1)
            else: print(n + 1, 2*n + 2 - rem)
`,
    tests: ["1\n", "9\n", "100001\n", "15\n", "40000000000000000\n"],
  },
  {
    slug: "concurs-mi-ub-2022-parola-cautare-binara",
    title: "Concurs MI UB 2022 - Parola prin cautare binara",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2022", "matematica", "cautare-binara"],
    statement:
      "Alex a furat un calculator si incearca sa ii ghiceasca parola. Stie ca parola are o lungime N si este formata din caractere dintr-un alfabet cu L simboluri (de exemplu, literele mici ale alfabetului englez, pentru care L=26). De fiecare data cand introduce o parola gresita, sistemul ii spune daca parola adevarata este mai mica sau mai mare lexicografic decat cea introdusa.\n\nDaca Alex cauta parola in mod optim (folosind o strategie de cautare binara asupra celor L^N parole posibile, ordonate lexicografic), care este numarul minim de incercari suficient pentru a gasi cu certitudine parola, in cel mai rau caz?",
    input_format: "Se citesc pe o singura linie doua numere intregi L si N, separate printr-un spatiu: dimensiunea alfabetului, respectiv lungimea parolei.",
    output_format:
      "Se afiseaza un singur numar intreg: numarul minim de incercari necesare, in cel mai rau caz, pentru a gasi parola printr-o cautare binara optima asupra celor L^N parole posibile.",
    constraints: "2 <= L <= 30\n1 <= N <= 12\nL^N <= 4 * 10^18 (astfel incat numarul de parole posibile sa incapa pe 64 de biti)",
    hints:
      "Parolele ordonate lexicografic pot fi tratate ca o multime de M = L^N valori distincte. O cautare binara clasica pe M elemente ordonate are nevoie, in cel mai rau caz, de exact cel mai mic k astfel incat 2^k >= M (nu logaritmul rotunjit aproximativ, ci valoarea exacta obtinuta comparand puteri ale lui 2 cu M).",
    explanation:
      "Explicatia oficiala arata ca parolele ordonate lexicografic formeaza o multime de M = L^N elemente, iar raspunsul sistemului (mai mic/mai mare) permite o cautare binara clasica. Numarul de incercari necesar in cel mai rau caz pentru o cautare binara intr-o multime ordonata de M elemente este exact cel mai mic k pentru care 2^k >= M (fiecare incercare elimina cel mult jumatate din multimea curenta). Solutia calculeaza M = L^N ca numar intreg exact (constrangerile garanteaza ca incape pe 64 de biti) si apoi cauta, prin incrementare, cel mai mic k cu 2^k >= M, evitand complet erorile de rotunjire ale unui calcul cu logaritmi in virgula mobila.",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    long long L, N; cin >> L >> N;
    long long value = 1;
    for (long long i = 0; i < N; i++) value *= L;
    long long k = 0;
    while ((1LL << k) < value) k++;
    cout << k << "\\n";
}
`,
    py: `L, N = map(int, input().split())
value = 1
for _ in range(N):
    value *= L
k = 0
while (1 << k) < value:
    k += 1
print(k)
`,
    tests: ["26 10\n", "2 1\n", "10 1\n", "30 12\n", "5 12\n"],
  },
  {
    slug: "concurs-mi-ub-2022-servere-cost-minim",
    title: "Concurs MI UB 2022 - Cost minim inchiriere servere",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2022", "programare-dinamica"],
    statement:
      "Alex doreste sa inchirieze servere pentru a acoperi o capacitate totala necesara. Exista 3 tipuri de servere disponibile, fiecare caracterizat de un pret si o capacitate. Alex poate inchiria oricate servere doreste, de oricare tip, in orice combinatie (indiferent daca sunt sau nu de acelasi tip).\n\nCare este costul minim cu care Alex poate inchiria servere astfel incat suma capacitatilor lor sa fie cel putin C?",
    input_format:
      "Pe fiecare dintre primele 3 linii se citesc cate doua numere intregi pret si capacitate, pentru cele 3 tipuri de servere. Pe a patra linie se citeste numarul intreg C, capacitatea minima ceruta.",
    output_format: "Se afiseaza un singur numar intreg: costul minim total.",
    constraints: "1 <= pret <= 1000\n1 <= capacitate <= 1000\n1 <= C <= 20000",
    hints:
      "Definiti dp[x] = costul minim pentru a acoperi o capacitate de cel putin x. Atunci dp[0]=0, iar pentru x>=1, dp[x] = minimul, peste cele 3 tipuri de server, al pretului acelui server plus dp[max(0, x - capacitatea acelui server)] (folosirea unui server de tipul i lasa de acoperit restul x-capacitate_i, sau nimic daca acesta acopera deja tot). Raspunsul este dp[C].",
    explanation:
      "Explicatia oficiala foloseste un rationament greedy specific exemplului dat (foloseste cat mai multe servere de tipul cu cel mai bun raport capacitate/pret, apoi completeaza optim restul). Pentru a obtine un algoritm corect si general, indiferent de preturile si capacitatile date, se foloseste programare dinamica: dp[x] = costul minim pentru a atinge o capacitate totala de cel putin x. Baza este dp[0]=0. Pentru fiecare x de la 1 la C, se incearca fiecare tip de server i: daca il folosim, ramane de acoperit x - capacitate_i (sau 0, daca acest server acopera deja tot), deci dp[x] = min peste i de (pret_i + dp[max(0, x-capacitate_i)]). Raspunsul final este dp[C]. Aceasta tehnica standard de 'knapsack pentru cel putin C' gaseste intotdeauna optimul, indiferent daca strategia greedy 'cat mai multe din cel mai eficient tip' functioneaza sau nu pentru datele de intrare date.",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    long long price[3], cap[3];
    for (int i = 0; i < 3; i++) cin >> price[i] >> cap[i];
    long long C; cin >> C;
    const long long INF = 4e18;
    vector<long long> dp(C+1, INF);
    dp[0] = 0;
    for (long long x = 1; x <= C; x++){
        for (int i = 0; i < 3; i++){
            long long prevIdx = max(0LL, x - cap[i]);
            if (dp[prevIdx] < INF) dp[x] = min(dp[x], price[i] + dp[prevIdx]);
        }
    }
    cout << dp[C] << "\\n";
}
`,
    py: `price = [0,0,0]
cap = [0,0,0]
for i in range(3):
    price[i], cap[i] = map(int, input().split())
C = int(input())
INF = 4 * 10**18
dp = [INF] * (C+1)
dp[0] = 0
for x in range(1, C+1):
    for i in range(3):
        prevIdx = max(0, x - cap[i])
        if dp[prevIdx] < INF:
            cost = price[i] + dp[prevIdx]
            if cost < dp[x]: dp[x] = cost
print(dp[C])
`,
    tests: [
      "2 2\n5 10\n10 23\n1000\n",
      "2 2\n5 10\n10 23\n1\n",
      "3 5\n7 12\n15 30\n100\n",
      "2 2\n5 10\n10 23\n20000\n",
      "4 4\n4 4\n4 4\n17\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2022-permutare-interschimbari",
    title: "Concurs MI UB 2022 - Cea mai mica permutare cu interschimbari",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2022", "greedy", "simulare"],
    statement:
      "Se da o permutare a numerelor de la 1 la n. Se pot efectua cel mult K operatii de interschimbare a doua elemente alaturate (adiacente) din permutare. Care este cea mai mica permutare, in ordine lexicografica, ce poate fi obtinuta folosind cel mult K astfel de interschimbari?",
    input_format:
      "Pe prima linie se citeste numarul intreg n. Pe a doua linie se citesc n numere intregi, reprezentand permutarea initiala. Pe a treia linie se citeste numarul intreg K, numarul maxim de interschimbari alaturate permise.",
    output_format: "Se afiseaza cele n numere ale permutarii finale, separate prin spatiu.",
    constraints: "1 <= n <= 50\npermutarea contine fiecare valoare de la 1 la n exact o data\n0 <= K <= 100",
    hints:
      "Procedati greedy, pozitie cu pozitie de la stanga la dreapta: pentru pozitia curenta, cu bugetul de interschimbari ramas, gasiti cea mai mica valoare ce poate fi adusa acolo (aflata la cel mult 'buget_ramas' pozitii distanta) si aduceti-o folosind exact atatea interschimbari cate sunt necesare (egale cu distanta). Scadeti costul din buget si treceti la pozitia urmatoare.",
    explanation:
      "Solutia reia direct algoritmul greedy descris in explicatia oficiala: pentru a obtine cea mai mica permutare lexicografic, la fiecare pozitie (de la stanga la dreapta) se cauta cea mai mica valoare aflata in fereastra [pozitie, pozitie+buget_ramas] (limitata si la capatul permutarii). Aducerea acelei valori pe pozitia curenta costa exact atatea interschimbari alaturate cate pozitii are de parcurs (distanta), deoarece fiecare interschimbare muta elementul cu o singura pozitie. Se scade costul din bugetul ramas si se trece la pozitia urmatoare. Algoritmul se opreste cand bugetul ajunge la 0 sau s-au parcurs toate pozitiile.",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    int n; cin >> n;
    vector<int> a(n);
    for (auto &x : a) cin >> x;
    int K; cin >> K;
    int remaining = K;
    for (int pos = 0; pos < n && remaining > 0; pos++){
        int windowEnd = min(n-1, pos + remaining);
        int bestIdx = pos;
        for (int j = pos+1; j <= windowEnd; j++) if (a[j] < a[bestIdx]) bestIdx = j;
        int cost = bestIdx - pos;
        if (cost > 0){
            int val = a[bestIdx];
            for (int j = bestIdx; j > pos; j--) a[j] = a[j-1];
            a[pos] = val;
            remaining -= cost;
        }
    }
    for (int i = 0; i < n; i++) cout << a[i] << (i+1 < n ? ' ' : '\\n');
}
`,
    py: `n = int(input())
a = list(map(int, input().split()))
K = int(input())
remaining = K
for pos in range(n):
    if remaining <= 0: break
    windowEnd = min(n-1, pos + remaining)
    bestIdx = pos
    for j in range(pos+1, windowEnd+1):
        if a[j] < a[bestIdx]: bestIdx = j
    cost = bestIdx - pos
    if cost > 0:
        val = a.pop(bestIdx)
        a.insert(pos, val)
        remaining -= cost
print(' '.join(map(str, a)))
`,
    tests: [
      "10\n9 1 2 6 5 4 3 7 10 8\n5\n",
      "5\n5 4 3 2 1\n0\n",
      "1\n1\n5\n",
      "6\n6 5 4 3 2 1\n100\n",
      "50\n50 49 48 47 46 45 44 43 42 41 40 39 38 37 36 35 34 33 32 31 30 29 28 27 26 25 24 23 22 21 20 19 18 17 16 15 14 13 12 11 10 9 8 7 6 5 4 3 2 1\n50\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2022-foc-lemne",
    title: "Concurs MI UB 2022 - Aprinderea lemnelor",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2022", "simulare", "greedy"],
    statement:
      "Alex are o gramada de n bucati de lemn, de dimensiuni diferite, date in ordine crescatoare. Prima bucata are intotdeauna dimensiunea 1 si este chibritul cu care Alex aprinde focul, la momentul t=1.\n\nO bucata de lemn de dimensiune d, aprinsa la momentul t, aprinde la momentul t+1 toate bucatile neaprinse de dimensiune cel mult 2*d.\n\nCare este primul moment de timp la care toate bucatile de lemn sunt aprinse?",
    input_format:
      "Pe prima linie se citeste numarul intreg n. Pe a doua linie se citesc n numere intregi, dimensiunile bucatilor de lemn, date in ordine crescatoare (primul numar este intotdeauna 1).",
    output_format: "Se afiseaza un singur numar intreg: primul moment de timp la care toate bucatile de lemn sunt aprinse.",
    constraints:
      "1 <= n <= 1000\ndimensiunile sunt date in ordine crescatoare (nu neaparat strict)\nprima dimensiune este intotdeauna 1\nse garanteaza ca toate bucatile pot fi aprinse\n1 <= dimensiune <= 10^9",
    hints:
      "Retineti in orice moment cea mai mare dimensiune aprinsa pana atunci (maxAprins). La fiecare pas de timp, toate bucatile neaprinse cu dimensiunea cel mult 2*maxAprins se aprind simultan; actualizati maxAprins la cea mai mare dintre ele si treceti la urmatorul moment de timp, pana cand toate bucatile sunt aprinse.",
    explanation:
      "Solutia reutilizeaza direct tehnica din explicatia oficiala: se retine maxAprins, cea mai mare dimensiune aprinsa pana la momentul curent (initial, doar chibritul de dimensiune 1). La fiecare pas de timp se parcurg, in ordine crescatoare, bucatile inca neaprinse si se aprind toate cele cu dimensiunea cel mult 2*maxAprins (acestea formeaza un bloc consecutiv in sirul sortat, deoarece sirul e deja sortat crescator); maxAprins devine cea mai mare dintre ele, iar timpul creste cu 1. Procesul se repeta pana cand toate bucatile sunt aprinse, moment in care se afiseaza timpul curent.",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    int n; cin >> n;
    vector<long long> s(n);
    for (auto &x : s) cin >> x;
    long long maxLit = s[0];
    int idx = 1;
    long long t = 1;
    while (idx < n){
        t++;
        long long threshold = 2 * maxLit;
        long long newMax = maxLit;
        while (idx < n && s[idx] <= threshold){ newMax = s[idx]; idx++; }
        maxLit = newMax;
    }
    cout << t << "\\n";
}
`,
    py: `n = int(input())
s = list(map(int, input().split()))
maxLit = s[0]
idx = 1
t = 1
while idx < n:
    t += 1
    threshold = 2 * maxLit
    newMax = maxLit
    while idx < n and s[idx] <= threshold:
        newMax = s[idx]
        idx += 1
    maxLit = newMax
print(t)
`,
    tests: [
      "21\n1 2 2 2 3 5 5 5 7 13 14 15 15 25 35 50 50 51 78 99 100\n",
      "1\n1\n",
      "3\n1 2 4\n",
      "6\n1 2 3 6 12 24\n",
      "15\n1 2 4 8 16 32 64 128 256 512 1024 2048 4096 8192 16384\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2022-sticle-apa",
    title: "Concurs MI UB 2022 - Udatul plantei cu sticle",
    difficulty: "hard",
    tags: ["concurs", "mateinfo-ub", "2022", "bfs", "simulare"],
    time_limit_ms: 2500,
    statement:
      "Matei are m sticle, initial goale, cu volumele (capacitatile) date. El poate efectua urmatoarele operatii:\n\n- ia o sticla si o umple complet de la robinet;\n- ia doua sticle si varsa cat de mult poate din prima in a doua, fie pana cand prima sticla se goleste, fie pana cand a doua sticla se umple.\n\nMatei vrea sa obtina o sticla care sa contina exact T litri de apa. Care este numarul minim de operatii necesare pentru a obtine acest lucru? Daca acest lucru nu este posibil, se afiseaza -1.",
    input_format:
      "Pe prima linie se citeste numarul intreg m, numarul de sticle. Pe a doua linie se citesc m numere intregi, capacitatile sticlelor. Pe a treia linie se citeste numarul intreg T, cantitatea dorita.",
    output_format:
      "Se afiseaza un singur numar intreg: numarul minim de operatii necesare pentru ca o sticla sa contina exact T litri, sau -1 daca acest lucru nu este posibil.",
    constraints: "2 <= m <= 4\n1 <= capacitate <= 12\n0 <= T <= capacitatea maxima dintre sticle",
    hints:
      "Fiecare stare a sistemului este data de cantitatile curente din fiecare sticla (un numar intre 0 si capacitate, pentru fiecare sticla). Numarul de stari posibile este mic (produsul capacitatilor+1), deci se poate face o parcurgere in latime (BFS) pornind din starea initiala (toate sticlele goale), generand toate starile accesibile printr-o operatie de umplere sau de turnare, si retinand distanta minima (numarul de operatii) pana la fiecare stare.",
    explanation:
      "Explicatia oficiala demonstreaza ca, pentru capacitati pare, exista un invariant (toate cantitatile raman pare), ceea ce face imposibila obtinerea unei cantitati impare. Solutia generala nu se bazeaza pe identificarea manuala a unui astfel de invariant (care ar putea sa nu existe sau sa fie diferit pentru alte capacitati), ci face o cautare exhaustiva in latime (BFS) in graful starilor posibile: fiecare stare este un tuplu cu cantitatea curenta din fiecare sticla, iar din fiecare stare se genereaza vecinii aplicand fiecare operatie de umplere completa a unei sticle sau de turnare intre doua sticle. Deoarece numarul de stari este mic (produsul capacitatilor+1, marginit de constrangeri), BFS gaseste garantat distanta minima pana la orice stare in care o sticla contine exact T litri, sau determina ca nicio astfel de stare nu este accesibila (caz in care se afiseaza -1). Aceasta abordare descopera automat orice invariant ascuns (precum paritatea), fara a fi nevoie sa fie demonstrat manual.",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    int m; cin >> m;
    vector<int> cap(m);
    for (auto &c : cap) cin >> c;
    int T; cin >> T;
    vector<long long> mult(m);
    long long total = 1;
    for (int i = 0; i < m; i++){ mult[i] = total; total *= (cap[i] + 1); }
    vector<int> dist(total, -1);
    auto encode = [&](vector<int> &amt){
        long long code = 0;
        for (int i = 0; i < m; i++) code += (long long)amt[i] * mult[i];
        return code;
    };
    auto decode = [&](long long code){
        vector<int> amt(m);
        for (int i = 0; i < m; i++){ amt[i] = code % (cap[i] + 1); code /= (cap[i] + 1); }
        return amt;
    };
    vector<int> start(m, 0);
    long long startCode = encode(start);
    dist[startCode] = 0;
    queue<long long> q; q.push(startCode);
    while (!q.empty()){
        long long cur = q.front(); q.pop();
        vector<int> amt = decode(cur);
        for (int i = 0; i < m; i++){
            vector<int> na = amt;
            na[i] = cap[i];
            long long code = encode(na);
            if (dist[code] == -1){ dist[code] = dist[cur] + 1; q.push(code); }
        }
        for (int i = 0; i < m; i++) for (int j = 0; j < m; j++) if (i != j){
            vector<int> na = amt;
            int transfer = min(na[i], cap[j] - na[j]);
            if (transfer > 0){
                na[i] -= transfer; na[j] += transfer;
                long long code = encode(na);
                if (dist[code] == -1){ dist[code] = dist[cur] + 1; q.push(code); }
            }
        }
    }
    long long best = -1;
    for (long long code = 0; code < total; code++){
        if (dist[code] == -1) continue;
        vector<int> amt = decode(code);
        bool ok = false;
        for (int i = 0; i < m; i++) if (amt[i] == T) ok = true;
        if (ok && (best == -1 || dist[code] < best)) best = dist[code];
    }
    cout << best << "\\n";
}
`,
    py: `import sys
from collections import deque

def solve():
    data = sys.stdin.read().split()
    idx = 0
    m = int(data[idx]); idx += 1
    cap = [int(data[idx+i]) for i in range(m)]; idx += m
    T = int(data[idx]); idx += 1

    mult = [0]*m
    total = 1
    for i in range(m):
        mult[i] = total
        total *= (cap[i] + 1)

    dist = [-1]*total

    def encode(amt):
        code = 0
        for i in range(m):
            code += amt[i]*mult[i]
        return code

    def decode(code):
        amt = [0]*m
        for i in range(m):
            amt[i] = code % (cap[i]+1)
            code //= (cap[i]+1)
        return amt

    start = [0]*m
    startCode = encode(start)
    dist[startCode] = 0
    q = deque([startCode])
    while q:
        cur = q.popleft()
        amt = decode(cur)
        for i in range(m):
            na = amt[:]
            na[i] = cap[i]
            code = encode(na)
            if dist[code] == -1:
                dist[code] = dist[cur] + 1
                q.append(code)
        for i in range(m):
            for j in range(m):
                if i != j:
                    na = amt[:]
                    transfer = min(na[i], cap[j]-na[j])
                    if transfer > 0:
                        na[i] -= transfer
                        na[j] += transfer
                        code = encode(na)
                        if dist[code] == -1:
                            dist[code] = dist[cur] + 1
                            q.append(code)

    best = -1
    for code in range(total):
        if dist[code] == -1: continue
        amt = decode(code)
        if T in amt:
            if best == -1 or dist[code] < best:
                best = dist[code]
    print(best)

solve()
`,
    tests: [
      "4\n2 8 10 20\n1\n",
      "2\n3 5\n1\n",
      "2\n4 7\n0\n",
      "2\n4 6\n1\n",
      "3\n2 3 4\n1\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2022-cifra-sir-concatenat",
    title: "Concurs MI UB 2022 - Cifra din sirul concatenat",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2022", "matematica"],
    statement:
      "Se considera sirul infinit obtinut prin alipirea (concatenarea) cifrelor tuturor numerelor naturale nenule, in ordine: 1,2,3,...,9,10,11,12,...\n\nConsiderand sirul indexat de la 0 (primul caracter, '1', este pe pozitia 0), care este cifra aflata pe pozitia P?",
    input_format: "Se citeste un singur numar intreg P.",
    output_format: "Se afiseaza o singura cifra: cea aflata pe pozitia P in sirul descris.",
    constraints: "0 <= P <= 10^17",
    hints:
      "Numarati cate cifre ocupa, in total, toate numerele cu un anumit numar de cifre d (sunt 9*10^(d-1) numere cu d cifre, deci 9*10^(d-1)*d cifre in total). Scadeti succesiv aceste blocuri din P pana gasiti blocul (lungimea d) in care se afla pozitia cautata; apoi identificati exact numarul si cifra din interiorul lui.",
    explanation:
      "Solutia reia exact tehnica din explicatia oficiala: se parcurg blocurile de numere cu d=1,2,3,... cifre, scazand din P numarul de cifre ocupat de fiecare bloc (9*10^(d-1)*d), pana cand P ramas este mai mic decat dimensiunea blocului curent. In acel bloc, numarul cautat este primul numar cu d cifre (10^(d-1)) plus P/d (impartire intreaga), iar cifra ceruta este cea de pe pozitia P%d din reprezentarea zecimala a acelui numar. Toate operatiile folosesc doar numere intregi de tip long long, suficiente pentru P de pana la 10^17.",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    long long p; cin >> p;
    long long len = 1, count = 9, start = 1;
    while (p >= len * count){
        p -= len * count;
        len++;
        count *= 10;
        start *= 10;
    }
    start += p / len;
    string s = to_string(start);
    cout << s[p % len] << "\\n";
}
`,
    py: `p = int(input())
length = 1
count = 9
start = 1
while p >= length * count:
    p -= length * count
    length += 1
    count *= 10
    start *= 10
start += p // length
s = str(start)
print(s[p % length])
`,
    tests: ["21052022\n", "0\n", "9\n", "10\n", "100000000000000000\n"],
  },
  {
    slug: "concurs-mi-ub-2022-palindromuri-fara-cifra",
    title: "Concurs MI UB 2022 - Palindromuri fara o cifra",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2022", "combinatorica"],
    statement:
      "Se cere numarul de palindromuri (numere care se citesc la fel de la stanga la dreapta si de la dreapta la stanga) aflate in intervalul [0, N), care nu contin cifra F in scrierea lor zecimala.",
    input_format:
      "Se citesc pe o singura linie doua numere intregi N si F, separate printr-un spatiu: limita superioara (exclusiva) si cifra interzisa.",
    output_format: "Se afiseaza un singur numar intreg: numarul de palindromuri din intervalul [0,N) care nu contin cifra F.",
    constraints: "1 <= N <= 2 * 10^9\n0 <= F <= 9",
    hints:
      "Numarati palindromurile pe cazuri, dupa numarul de cifre. Un palindrom cu L cifre este determinat complet de prima jumatate a cifrelor sale (jumatatea se oglindeste pentru a forma restul). Generati toate 'prefixele' posibile (fara cifra F si fara 0 pe prima pozitie, daca L>1), construiti palindromul complet si verificati daca este mai mic decat N.",
    explanation:
      "Solutia foloseste ideea centrala din explicatia oficiala (numararea palindromurilor pe cazuri, dupa numarul de cifre L), dar in loc sa faca manual analiza de frontiera pentru ultimul bloc de lungime L (asa cum se face in explicatia oficiala pentru cazul cu 4 cifre 'abba < 2022'), o genereaza si o verifica direct, computational: pentru fiecare L de la 1 la 10, se construiesc toate palindromurile posibile cu L cifre pornind de la prima lor jumatate (un 'prefix' fara cifra F si fara 0 pe prima pozitie cand L>1), se formeaza palindromul complet prin oglindire, iar cele care nu contin cifra F si sunt strict mai mici decat N sunt numarate. Se opreste cand cel mai mic numar cu L cifre este deja >= N, deoarece toate palindromurile de lungimi mai mari ar fi si ele >= N.",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    long long N; int F; cin >> N >> F;
    long long cnt = 0;
    for (int L = 1; L <= 10; L++){
        long long minNumExact = 1;
        for (int k = 1; k < L; k++) minNumExact *= 10;
        if (L == 1) minNumExact = 0;
        if (minNumExact >= N) break;
        if (L == 1){
            for (int d = 0; d <= 9; d++){
                if (d == F) continue;
                if ((long long)d < N) cnt++;
            }
            continue;
        }
        int halfLen = (L + 1) / 2;
        long long minP = 1; for (int k = 1; k < halfLen; k++) minP *= 10;
        long long maxP = 1; for (int k = 0; k < halfLen; k++) maxP *= 10; maxP -= 1;
        for (long long prefix = minP; prefix <= maxP; prefix++){
            string ps = to_string(prefix);
            bool bad = false;
            for (char ch : ps) if (ch - '0' == F) { bad = true; break; }
            if (bad) continue;
            string rev;
            if (L % 2 == 0) rev = ps;
            else rev = ps.substr(0, ps.size() - 1);
            reverse(rev.begin(), rev.end());
            string full = ps + rev;
            long long num = stoll(full);
            if (num < N) cnt++;
        }
    }
    cout << cnt << "\\n";
}
`,
    py: `N, F = map(int, input().split())
cnt = 0
for L in range(1, 11):
    minNumExact = 0 if L == 1 else 10**(L-1)
    if minNumExact >= N:
        break
    if L == 1:
        for d in range(10):
            if d == F: continue
            if d < N: cnt += 1
        continue
    halfLen = (L + 1) // 2
    minP = 10**(halfLen-1)
    maxP = 10**halfLen - 1
    for prefix in range(minP, maxP+1):
        ps = str(prefix)
        if str(F) in ps:
            continue
        if L % 2 == 0:
            rev = ps[::-1]
        else:
            rev = ps[:-1][::-1]
        num = int(ps + rev)
        if num < N:
            cnt += 1
print(cnt)
`,
    tests: ["2022 4\n", "1 5\n", "100 0\n", "2000000000 9\n", "1 0\n"],
  },
  {
    slug: "concurs-mi-ub-2022-numere-cinci-divizori",
    title: "Concurs MI UB 2022 - Numere cu exact 5 divizori",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2022", "teoria-numerelor"],
    statement: "Cate numere naturale nenule mai mici sau egale cu N au exact 5 divizori pozitivi?",
    input_format: "Se citeste un singur numar intreg N.",
    output_format:
      "Se afiseaza un singur numar intreg: numarul de numere naturale din intervalul [1,N] care au exact 5 divizori pozitivi.",
    constraints: "1 <= N <= 4 * 10^18",
    hints:
      "Daca n = p1^a1 * p2^a2 * ... * pk^ak, numarul divizorilor sai este (a1+1)(a2+1)...(ak+1). Pentru ca acest produs sa fie exact 5 (numar prim), singura factorizare posibila este 5=4+1, deci n trebuie sa fie de forma p^4, cu p numar prim. Raspunsul este numarul de numere prime p cu p^4<=N, adica numarul de numere prime pana la radacina de ordinul 4 a lui N.",
    explanation:
      "Solutia reutilizeaza direct rationamentul din explicatia oficiala: un numar are exact 5 divizori doar daca este de forma p^4 cu p prim (deoarece 5 este prim, singura descompunere a numarului de divizori (a+1) este 5=4+1). Se calculeaza B, cea mai mare valoare intreaga cu B^4<=N (radacina a patra intreaga, gasita prin cautare binara folosind aritmetica pe 128 de biti pentru a evita depasirea de capacitate la calculul lui mid^4), apoi se numara, cu ciurul lui Eratostene, cate numere prime exista in intervalul [2,B]. Acesta este raspunsul final.",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    long long N; cin >> N;
    long long lo = 0, hi = 60000;
    while (lo < hi){
        long long mid = lo + (hi - lo + 1) / 2;
        __int128 p4 = (__int128)mid * mid * mid * mid;
        if (p4 <= (__int128)N) lo = mid; else hi = mid - 1;
    }
    long long B = lo;
    if (B < 2){ cout << 0 << "\\n"; return 0; }
    vector<bool> isComposite(B+1, false);
    long long cnt = 0;
    for (long long i = 2; i <= B; i++){
        if (!isComposite[i]){
            cnt++;
            if (i*i <= B) for (long long j = i*i; j <= B; j += i) isComposite[j] = true;
        }
    }
    cout << cnt << "\\n";
}
`,
    py: `N = int(input())
lo, hi = 0, 60000
while lo < hi:
    mid = lo + (hi - lo + 1) // 2
    if mid**4 <= N: lo = mid
    else: hi = mid - 1
B = lo
if B < 2:
    print(0)
else:
    isComposite = [False] * (B+1)
    cnt = 0
    for i in range(2, B+1):
        if not isComposite[i]:
            cnt += 1
            if i*i <= B:
                for j in range(i*i, B+1, i):
                    isComposite[j] = True
    print(cnt)
`,
    tests: ["2000000000\n", "1\n", "16\n", "15\n", "4000000000000000000\n"],
  },
  {
    slug: "concurs-mi-ub-2022-semne-matrice",
    title: "Concurs MI UB 2022 - Semne de linii si coloane",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2022", "bitmask", "matematica"],
    statement:
      "Se da o matrice A cu m linii si n coloane, cu elemente numere intregi. Se pot alege, independent, semnele fiecarei linii si fiecarei coloane (fiecare linie si fiecare coloana poate fi inmultita cu -1 sau lasata neschimbata, in orice combinatie, inclusiv toate sau niciuna).\n\nDupa aplicarea acestor operatii, elementul de pe linia i si coloana j devine r_i * c_j * A[i][j], unde r_i si c_j sunt semnele alese (+1 sau -1) pentru linia i, respectiv coloana j.\n\nCare este suma maxima a elementelor matricei ce poate fi obtinuta in acest fel?",
    input_format:
      "Pe prima linie se citesc doua numere intregi m si n. Pe urmatoarele m linii se citesc cate n numere intregi, elementele matricei.",
    output_format: "Se afiseaza un singur numar intreg: suma maxima obtinabila.",
    constraints: "1 <= m <= 8\n1 <= n <= 10\n|A[i][j]| <= 1000",
    hints:
      "Pentru o alegere fixa a semnelor liniilor, suma coloanei j devine S_j = suma peste i a lui r_i*A[i][j]; apoi semnul coloanei j poate fi ales astfel incat contributia ei sa fie |S_j|. Deci, pentru o alegere fixa a semnelor liniilor, suma maxima obtinabila este |S_1|+...+|S_n|. Incercati toate cele 2^m combinatii posibile de semne pentru linii (m este suficient de mic) si retineti maximul.",
    explanation:
      "Solutia formalizeaza si generalizeaza direct ideea din explicatia oficiala: pentru o alegere fixa a semnelor liniilor r_1,...,r_m, semnul optim al fiecarei coloane j este cel care face contributia ei pozitiva, deci suma maxima pentru acea alegere de semne de linii este |S_1|+|S_2|+...+|S_n|, unde S_j este suma coloanei j dupa aplicarea semnelor de linii. Deoarece semnele liniilor si coloanelor actioneaza independent, este suficient sa incercam toate cele 2^m combinatii posibile de semne pentru linii (m fiind mic, conform constrangerilor) si sa retinem cea mai mare suma obtinuta. Aceasta cautare exhaustiva gaseste garantat optimul global, spre deosebire de explicatia oficiala, care 'ghiceste' o combinatie buna de semne pentru cazul particular dat.",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    int m, n; cin >> m >> n;
    vector<vector<long long>> a(m, vector<long long>(n));
    for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) cin >> a[i][j];
    long long best = -4e18;
    for (int mask = 0; mask < (1 << m); mask++){
        vector<long long> colSum(n, 0);
        for (int i = 0; i < m; i++){
            long long sign = (mask & (1 << i)) ? -1 : 1;
            for (int j = 0; j < n; j++) colSum[j] += sign * a[i][j];
        }
        long long total = 0;
        for (int j = 0; j < n; j++) total += llabs(colSum[j]);
        if (total > best) best = total;
    }
    cout << best << "\\n";
}
`,
    py: `m, n = map(int, input().split())
a = [list(map(int, input().split())) for _ in range(m)]
best = -1
for mask in range(1 << m):
    colSum = [0] * n
    for i in range(m):
        sign = -1 if (mask >> i) & 1 else 1
        for j in range(n):
            colSum[j] += sign * a[i][j]
    total = sum(abs(x) for x in colSum)
    if total > best: best = total
print(best)
`,
    tests: [
      "4 5\n4 -1 6 4 -5\n-2 -33 -12 10 -11\n1 0 3 -1 4\n-99 -98 -40 34 33\n",
      "1 1\n-7\n",
      "3 1\n5\n-3\n2\n",
      "8 10\n-20 -7 6 19 -9 4 17 -11 2 15\n-13 0 13 -15 -2 11 -17 -4 9 -19\n-6 7 20 -8 5 18 -10 3 16 -12\n1 14 -14 -1 12 -16 -3 10 -18 -5\n8 -20 -7 6 19 -9 4 17 -11 2\n15 -13 0 13 -15 -2 11 -17 -4 9\n-19 -6 7 20 -8 5 18 -10 3 16\n-12 1 14 -14 -1 12 -16 -3 10 -18\n",
      "5 5\n0 0 0 0 0\n0 0 0 0 0\n0 0 0 0 0\n0 0 0 0 0\n0 0 0 0 0\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2022-monede-plati",
    title: "Concurs MI UB 2022 - Monedele lui Alex",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2022", "simulare", "greedy"],
    statement:
      "Alex are un numar de monede de 50 de bani si un numar de monede de 10 bani. El plateste, pe rand, o serie de sume (date in bani, multipli de 10), respectand urmatoarea strategie:\n\n- da mai intai cat mai multe monede de 50 de bani are, fara sa depaseasca suma de plata;\n- apoi da cat mai multe monede de 10 bani are, fara sa depaseasca suma ramasa de plata;\n- restul sumei ramase (daca mai este ceva de plata) il achita cu bancnote de 1 leu (100 bani), platind cel mai mic numar intreg de bancnote care acopera suma ramasa.\n\nDaca a platit in plus fata de suma datorata, casierul ii da rest, folosind numarul minim de monede de 50 si 10 bani (presupunand ca acesta are oricate monede disponibile).\n\nDupa ce Alex efectueaza, in ordine, toate platile date, cu cate monede de 50 de bani si cu cate monede de 10 bani ramane?",
    input_format:
      "Pe prima linie se citesc doua numere intregi, numarul initial de monede de 50 de bani si numarul initial de monede de 10 bani ale lui Alex. Pe a doua linie se citeste numarul intreg K, numarul de plati. Pe urmatoarele K linii se citeste cate o suma de plata (in bani, multiplu de 10).",
    output_format:
      "Se afiseaza doua numere intregi, separate printr-un spatiu: numarul final de monede de 50 de bani, respectiv de 10 bani ale lui Alex.",
    constraints:
      "0 <= monede initiale <= 1000\n0 <= K <= 100\n10 <= suma de plata <= 100000, suma este multiplu de 10",
    hints:
      "Simulati exact strategia descrisa, plata cu plata: scadeti cate monede de 50 si de 10 bani poate da Alex (marginit de cate are si de suma ramasa), apoi calculati cate bancnote de 1 leu sunt necesare pentru rest (rotunjind in sus), calculati restul primit inapoi si convertiti-l in monede de 50 si 10 bani folosind cat mai putine monede (impartire intreaga la 50, apoi la 10).",
    explanation:
      "Solutia simuleaza pas cu pas exact algoritmul din explicatia oficiala, generalizat pentru orice numar initial de monede si orice sir de plati: pentru fiecare suma de plata, se scad intai cat mai multe monede de 50 de bani (marginite de stocul curent si de suma ramasa), apoi cat mai multe monede de 10 bani, in acelasi mod. Daca mai ramane ceva de plata dupa epuizarea monedelor folosite, se calculeaza numarul de bancnote de 1 leu necesare (rotunjire in sus la urmatorul multiplu de 100), iar restul primit de la casier (diferenta dintre suma platita cu bancnote si suma ramasa) este convertit in monede de 50 si apoi de 10 bani, folosind cat mai putine monede posibil (impartiri intregi succesive), acestea adaugandu-se la stocul lui Alex.",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    long long c50, c10; cin >> c50 >> c10;
    int K; cin >> K;
    for (int t = 0; t < K; t++){
        long long amount; cin >> amount;
        long long use50 = min(c50, amount / 50);
        c50 -= use50; amount -= use50 * 50;
        long long use10 = min(c10, amount / 10);
        c10 -= use10; amount -= use10 * 10;
        if (amount > 0){
            long long notes = (amount + 99) / 100;
            long long paid = notes * 100;
            long long change = paid - amount;
            long long change50 = change / 50; change %= 50;
            long long change10 = change / 10;
            c50 += change50;
            c10 += change10;
        }
    }
    cout << c50 << " " << c10 << "\\n";
}
`,
    py: `c50, c10 = map(int, input().split())
K = int(input())
for _ in range(K):
    amount = int(input())
    use50 = min(c50, amount // 50)
    c50 -= use50; amount -= use50 * 50
    use10 = min(c10, amount // 10)
    c10 -= use10; amount -= use10 * 10
    if amount > 0:
        notes = (amount + 99) // 100
        paid = notes * 100
        change = paid - amount
        change50 = change // 50; change %= 50
        change10 = change // 10
        c50 += change50
        c10 += change10
print(c50, c10)
`,
    tests: [
      "10 10\n4\n470\n230\n1010\n350\n",
      "5 3\n0\n",
      "2 3\n1\n130\n",
      "0 0\n3\n100\n250\n990\n",
      "1 1\n2\n10\n50\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2022-profit-actiuni",
    title: "Concurs MI UB 2022 - Profit maxim la actiuni",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2022", "greedy", "simulare"],
    statement:
      "Alex urmareste pretul unei actiuni pe o piata timp de L minute. Pretul actiunii la minutul i (1<=i<=L) este dat de formula:\n\n(a*i^3 + b*i^2 + c*i + d) mod M\n\nAlex ar putea, pe parcursul celor L minute, sa cumpere o actiune la un moment dat si sa o vanda la un moment ulterior (sau sa nu tranzactioneze deloc, daca niciun moment de vanzare nu aduce profit). Care este profitul maxim pe care l-ar putea obtine?",
    input_format: "Se citesc pe o singura linie sase numere intregi: a, b, c, d, M si L.",
    output_format:
      "Se afiseaza un singur numar intreg: profitul maxim posibil (0 daca nu exista niciun moment de vanzare mai profitabil decat a nu tranzactiona deloc).",
    constraints: "0 <= a,b,c,d <= 1000\n2 <= M <= 10000\n2 <= L <= 100000",
    hints:
      "Parcurgeti minutele in ordine (1..L), calculand la fiecare pas pretul curent conform formulei date. Retineti cel mai mic pret vazut pana in acel moment (inainte de minutul curent) si, pentru fiecare pret curent, calculati profitul daca ati vinde acum (pret curent minus cel mai mic pret vazut anterior); pastrati maximul dintre aceste profituri (si 0, daca nu ati vrea sa tranzactionati).",
    explanation:
      "Solutia foloseste tehnica standard 'buy low, sell high' descrisa si in explicatia oficiala: se parcurg minutele in ordine crescatoare, retinand cel mai mic pret intalnit pana la momentul curent (exclusiv). La fiecare minut se calculeaza profitul posibil daca actiunea ar fi fost cumparata la acel minim si vanduta acum, actualizand maximul global. Deoarece pretul se calculeaza modulo M, valorile raman marginite, iar calculul lui i^3 si al termenilor formulei se face cu numere intregi pe 64 de biti, fara riscul de depasire pentru L de pana la 100000 si coeficienti de pana la 1000.",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    long long a, b, c, d, M, L; cin >> a >> b >> c >> d >> M >> L;
    long long minPrice = 0, best = 0;
    for (long long i = 1; i <= L; i++){
        long long i2 = i*i, i3 = i2*i;
        long long term = a*i3 + b*i2 + c*i + d;
        long long price = term % M;
        if (i == 1){ minPrice = price; continue; }
        long long profit = price - minPrice;
        if (profit > best) best = profit;
        if (price < minPrice) minPrice = price;
    }
    cout << best << "\\n";
}
`,
    py: `a, b, c, d, M, L = map(int, input().split())
minPrice = 0
best = 0
for i in range(1, L+1):
    i2 = i*i; i3 = i2*i
    term = a*i3 + b*i2 + c*i + d
    price = term % M
    if i == 1:
        minPrice = price
        continue
    profit = price - minPrice
    if profit > best: best = profit
    if price < minPrice: minPrice = price
print(best)
`,
    tests: [
      "1 7 3 84 100 100\n",
      "0 0 0 5 7 2\n",
      "2 0 0 0 1000 10\n",
      "1 1 1 1 97 100000\n",
      "3 5 7 1 2 50\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2022-distanta-numere-speciale",
    title: "Concurs MI UB 2022 - Puterea numerelor speciale",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2022", "teoria-numerelor"],
    time_limit_ms: 2500,
    statement:
      "Se dau K numere 'speciale'. Definim puterea unui numar intreg x ca fiind distanta minima de la x la cel mai apropiat numar special, adica valoarea minima a lui |x-s|, unde s parcurge toate cele K numere speciale.\n\nCate numere x din intervalul [1,N] au puterea un numar prim?",
    input_format:
      "Pe prima linie se citeste numarul intreg K. Pe a doua linie se citesc K numere intregi, numerele speciale. Pe a treia linie se citeste numarul intreg N.",
    output_format: "Se afiseaza un singur numar intreg: numarul de valori x din intervalul [1,N] a caror putere este numar prim.",
    constraints: "1 <= K <= 10\n0 <= numar special <= N\n1 <= N <= 500000",
    hints:
      "Precalculati, cu ciurul lui Eratostene, care numere din intervalul [0,N] sunt prime. Apoi, pentru fiecare x de la 1 la N, calculati distanta minima pana la cel mai apropiat numar special si verificati, cu ciurul precalculat, daca aceasta distanta este prima.",
    explanation:
      "Explicatia oficiala imparte intervalul [1,N] in zone, dupa care numar special este cel mai apropiat, si numara, in fiecare zona, cate distante prime apar, folosind functia pi (numarul de numere prime pana la o valoare data). Solutia generalizata evita impartirea manuala pe zone (care ar trebui refacuta pentru orice alta configuratie de numere speciale) si calculeaza direct, pentru fiecare x din [1,N], distanta minima pana la cel mai apropiat numar special (parcurgand cele K numere speciale), verificand apoi daca aceasta distanta este prima cu ajutorul unui ciur al lui Eratostene precalculat pe intervalul [0,N]. Rezultatul este identic din punct de vedere matematic, dar mult mai simplu de implementat corect pentru orice date de intrare.",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    int K; cin >> K;
    vector<long long> sp(K);
    for (auto &x : sp) cin >> x;
    long long N; cin >> N;
    vector<char> isPrime(N+1, 1);
    isPrime[0] = 0;
    if (N >= 1) isPrime[1] = 0;
    for (long long i = 2; i*i <= N; i++) if (isPrime[i]) for (long long j = i*i; j <= N; j += i) isPrime[j] = 0;
    long long cnt = 0;
    for (long long x = 1; x <= N; x++){
        long long md = 4000000000000000000LL;
        for (int k = 0; k < K; k++){
            long long dist = llabs(x - sp[k]);
            if (dist < md) md = dist;
        }
        if (md <= N && isPrime[md]) cnt++;
    }
    cout << cnt << "\\n";
}
`,
    py: `K = int(input())
sp = list(map(int, input().split()))
N = int(input())
isPrime = [True]*(N+1)
isPrime[0] = False
if N >= 1: isPrime[1] = False
i = 2
while i*i <= N:
    if isPrime[i]:
        for j in range(i*i, N+1, i):
            isPrime[j] = False
    i += 1
cnt = 0
for x in range(1, N+1):
    md = min(abs(x - s) for s in sp)
    if md <= N and isPrime[md]:
        cnt += 1
print(cnt)
`,
    tests: [
      "5\n100 356 440 1137 1901\n2022\n",
      "1\n5\n10\n",
      "1\n0\n1\n",
      "3\n10 50 90\n100\n",
      "10\n1000 50000 100000 150000 200000 250000 300000 350000 400000 450000\n500000\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2022-patrat-fara-arce",
    title: "Concurs MI UB 2022 - Cel mai mare patrat fara arce",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2022", "geometrie", "brute-force"],
    statement:
      "Se considera o suprafata patrata de dimensiune S x S (un patrat cu coltul stanga-jos in (0,0) si coltul dreapta-sus in (S,S)). Pe aceasta suprafata se afla K puncte (arce), date prin coordonatele lor (X_i, Y_i).\n\nSe cere latura maxima a unui patrat, cu laturile paralele cu axele de coordonate, complet inclus in suprafata data, in interiorul caruia sa nu se afle niciun arc (arcele au voie sa se afle pe laturile sau in colturile patratului, dar nu strict in interior).",
    input_format:
      "Pe prima linie se citesc doua numere intregi S si K. Pe urmatoarele K linii se citesc cate doua numere intregi X si Y, coordonatele fiecarui arc.",
    output_format: "Se afiseaza un singur numar intreg: latura maxima a unui astfel de patrat.",
    constraints: "1 <= S <= 100\n1 <= K <= 6\n0 <= X,Y <= S",
    hints:
      "Deoarece S este mic, se poate incerca, pentru fiecare latura posibila L (de la cea mai mare la cea mai mica), fiecare pozitie posibila a coltului stanga-jos (x,y) a patratului, verificand daca vreun arc se afla strict in interior. Prima latura L pentru care exista o pozitie valida este raspunsul.",
    explanation:
      "Explicatia oficiala rezolva geometric cazul particular dat, prin observatii asupra pozitiei punctelor fata de un patrat candidat. Pentru o solutie generala si sigura, indiferent de configuratia arcelor, se foloseste o cautare exhaustiva: pentru fiecare latura L posibila, de la S descrescator la 1, si pentru fiecare pozitie posibila a coltului stanga-jos (x,y) a unui patrat de latura L inclus in suprafata, se verifica daca vreunul dintre cele K arce se afla strict in interiorul patratului (adica X strict intre x si x+L, si Y strict intre y si y+L). Prima latura L pentru care exista o pozitie valabila (fara niciun arc strict in interior) este raspunsul, deoarece se cauta in ordine descrescatoare. Complexitatea (S^3 * K in cel mai rau caz) este suficient de mica pentru constrangerile date.",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    int S, K; cin >> S >> K;
    vector<int> px(K), py(K);
    for (int i = 0; i < K; i++) cin >> px[i] >> py[i];
    for (int L = S; L >= 1; L--){
        bool found = false;
        for (int x = 0; x <= S - L && !found; x++){
            for (int y = 0; y <= S - L && !found; y++){
                bool ok = true;
                for (int k = 0; k < K; k++){
                    if (px[k] > x && px[k] < x+L && py[k] > y && py[k] < y+L){ ok = false; break; }
                }
                if (ok) found = true;
            }
        }
        if (found){ cout << L << "\\n"; return 0; }
    }
    cout << 0 << "\\n";
}
`,
    py: `S, K = map(int, input().split())
pts = [tuple(map(int, input().split())) for _ in range(K)]
ans = 0
for L in range(S, 0, -1):
    found = False
    for x in range(0, S-L+1):
        for y in range(0, S-L+1):
            ok = True
            for (px, py) in pts:
                if px > x and px < x+L and py > y and py < y+L:
                    ok = False
                    break
            if ok:
                found = True
                break
        if found:
            break
    if found:
        ans = L
        break
print(ans)
`,
    tests: [
      "100 5\n48 47\n64 27\n54 28\n80 83\n92 36\n",
      "10 1\n0 0\n",
      "10 1\n5 5\n",
      "50 6\n5 5\n10 40\n25 25\n40 10\n45 45\n2 48\n",
      "1 1\n0 0\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2022-suma-patrate-mod",
    title: "Concurs MI UB 2022 - Suma patratelor modulo M",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2022", "teoria-numerelor", "recurenta"],
    statement:
      "Se considera urmatoarea functie recursiva, care calculeaza produsul a doua numere modulo M folosind dublare si injumatatire:\n\n```cpp\nlong long f(long long a, long long b) {\n    if (a == 0) return 0;\n    else if (a & 1) return (b + f(a ^ 1, b)) % M;\n    else return f(a >> 1, b << 1);\n}\n```\n\nSe poate demonstra ca f(a,b) calculeaza exact (a*b) mod M.\n\nSe considera apoi codul:\n\n```cpp\nlong long suma = 0;\nfor (long long i = 0; i < Count; i++) {\n    suma += f(i, i);\n    suma %= M;\n}\n```\n\nCare este valoarea finala a lui suma, pentru un modul M si un numar de pasi Count date?",
    input_format: "Se citesc pe o singura linie doua numere intregi M si Count.",
    output_format: "Se afiseaza un singur numar intreg: valoarea finala a lui suma.",
    constraints: "2 <= M <= 10^9\n1 <= Count <= 10^11",
    hints:
      "Din felul in care functioneaza f (dublare si injumatatire), se poate demonstra ca f(a,b) = (a*b) mod M. Deci suma finala este (0^2+1^2+...+(Count-1)^2) mod M. Folositi formula inchisa pentru suma primelor patrate: 0^2+1^2+...+(n-1)^2 = (n-1)*n*(2n-1)/6, avand grija la depasirea de capacitate a produsului inainte de impartirea la 6 (folositi un tip pe 128 de biti in C++).",
    explanation:
      "Explicatia oficiala arata ca functia f(a,b) calculeaza exact (a*b) mod M, deci suma acumulata in bucla este echivalenta cu (sum_{i=0}^{Count-1} i^2) mod M (deoarece luarea modulo la fiecare pas al adunarii da acelasi rezultat final ca luarea modulo o singura data, la sfarsit, pentru operatia de adunare). In loc sa se foloseasca un argument de periodicitate specific lui M=137 (care functioneaza doar pentru anumite valori ale lui M), solutia generala calculeaza direct suma primelor Count patrate cu formula inchisa n(n-1)(2n-1)/6 (unde n=Count), aplicand modulo M abia la final. Deoarece produsul n*(n-1)*(2n-1) poate depasi capacitatea unui numar pe 64 de biti pentru Count mare, calculul intermediar se face folosind aritmetica pe 128 de biti in C++ (Python gestioneaza automat numerele mari), iar impartirea la 6 este exacta (produsul a trei numere consecutive de acest tip este mereu divizibil cu 6).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    long long M, Count; cin >> M >> Count;
    __int128 n = Count;
    __int128 prod = n * (n - 1) * (2*n - 1);
    __int128 sum = prod / 6;
    long long ans = (long long)(sum % (__int128)M);
    cout << ans << "\\n";
}
`,
    py: `M, Count = map(int, input().split())
n = Count
prod = n * (n - 1) * (2*n - 1)
total = prod // 6
print(total % M)
`,
    tests: [
      "137 2000000000\n",
      "5 1\n",
      "1000000000 2\n",
      "999999937 100000000000\n",
      "2 10\n",
    ],
  },
  {
    slug: "concurs-mi-ub-2022-turnuri-cuburi",
    title: "Concurs MI UB 2022 - Turnulete din cuburi colorate",
    difficulty: "hard",
    tags: ["concurs", "mateinfo-ub", "2022", "combinatorica"],
    statement:
      "Ema are R cuburi rosii, V cuburi verzi si A cuburi albastre (identice intre ele in cadrul aceleiasi culori). Ea vrea sa construiasca un turnulet folosind toate cuburile, asezate unul peste altul, astfel incat niciun cub verde sa nu fie plasat imediat peste un cub rosu.\n\nIn cate moduri diferite poate construi un astfel de turnulet, folosind toate cuburile? Doua moduri sunt diferite daca sirurile de culori, citite de la primul cub de jos, sunt diferite.",
    input_format: "Se citesc pe o singura linie trei numere intregi: R, V si A.",
    output_format: "Se afiseaza un singur numar intreg: numarul de turnulete valide.",
    constraints: "0 <= R,V,A <= 10\nR+V+A >= 1",
    hints:
      "Fara nicio restrictie, numarul de siruri distincte este (R+V+A)!/(R!V!A!). Folositi principiul includerii-excluderii dupa numarul de aparitii ale blocului consecutiv 'rosu-verde' (cub rosu urmat imediat de cub verde, citind de jos in sus): pentru fiecare k de la 0 la min(R,V), tratati k perechi rosu-verde ca blocuri unite si numarati aranjarile ramase, alternand semnul.",
    explanation:
      "Solutia foloseste exact formula de includere-excludere din explicatia oficiala, generalizata pentru orice R, V si A: N = suma, pentru k de la 0 la min(R,V), a lui (-1)^k * (R+V+A-k)! / (k! * (R-k)! * (V-k)! * A!). Fiecare termen numara aranjarile in care se marcheaza k perechi consecutive 'rosu-verde' ca blocuri unite (ramanand R-k cuburi rosii libere, V-k cuburi verzi libere, A cuburi albastre si k blocuri, in total R+V+A-k obiecte de aranjat). Deoarece factorialele pot deveni foarte mari, calculul intermediar foloseste aritmetica pe 128 de biti in C++ (Python gestioneaza automat numerele mari), impartirile fiind mereu exacte.",
    cpp: `#include <bits/stdc++.h>
using namespace std;
typedef __int128 lll;
lll fact[31];
int main(){
    fact[0] = 1;
    for (int i = 1; i <= 30; i++) fact[i] = fact[i-1] * i;
    long long R, V, A; cin >> R >> V >> A;
    long long total = R + V + A;
    lll N = 0;
    long long kMax = min(R, V);
    for (long long k = 0; k <= kMax; k++){
        lll term = fact[total-k] / (fact[k] * fact[R-k] * fact[V-k] * fact[A]);
        if (k % 2 == 0) N += term; else N -= term;
    }
    long long ans = (long long)N;
    cout << ans << "\\n";
}
`,
    py: `import math
R, V, A = map(int, input().split())
total = R + V + A
N = 0
kMax = min(R, V)
for k in range(0, kMax+1):
    term = math.factorial(total-k) // (math.factorial(k) * math.factorial(R-k) * math.factorial(V-k) * math.factorial(A))
    if k % 2 == 0: N += term
    else: N -= term
print(N)
`,
    tests: ["7 7 8\n", "0 0 1\n", "1 1 0\n", "10 10 10\n", "0 0 10\n"],
  },
  {
    slug: "concurs-mi-ub-2022-sosii-perechi",
    title: "Concurs MI UB 2022 - Perechi de sosii",
    difficulty: "hard",
    tags: ["concurs", "mateinfo-ub", "2022", "programare-dinamica", "combinatorica"],
    time_limit_ms: 5000,
    statement:
      "Doi oameni se numesc sosii daca seamana mult unul cu altul. Relatia de a fi sosie este o relatie de echivalenta (reflexiva, simetrica si tranzitiva), deci imparte un grup de oameni in clase disjuncte, oamenii dintr-o clasa fiind toti sosii intre ei.\n\nO pereche (A,B) se numeste minunata daca A<B si A este sosie cu B. Intr-un grup de N oameni exista exact T perechi minunate.\n\nCare este cea mai mica valoare a lui N pentru care poate exista o astfel de configuratie, cu exact T perechi minunate?",
    input_format: "Se citeste un singur numar intreg T.",
    output_format: "Se afiseaza un singur numar intreg: cea mai mica valoare posibila a lui N.",
    constraints: "1 <= T <= 2500",
    hints:
      "Daca o clasa de echivalenta are k persoane, ea contribuie cu C(k,2)=k*(k-1)/2 perechi minunate. Trebuie gasita partitia unui numar N (cel mai mic posibil) in parti pozitive k_1,...,k_m astfel incat suma C(k_i,2) sa fie exact T. Construiti o relatie de recurenta: pentru a atinge, folosind exact n persoane, un total de t perechi, alegeti dimensiunea ultimei clase k (de la 1 la n) si verificati daca restul de n-k persoane pot atinge t - C(k,2) perechi.",
    explanation:
      "Explicatia oficiala gaseste manual o combinatie buna de clase (o clasa mare, aproape de limita, plus o a doua clasa mica ce completeaza diferenta), demonstrand apoi ca valori mai mici de N nu functioneaza. Solutia generala nu se bazeaza pe gasirea manuala a combinatiei potrivite, ci construieste o programare dinamica de accesibilitate: dp[n][t] = adevarat daca exista o partitie a n persoane in clase de echivalenta astfel incat suma perechilor minunate sa fie exact t. Relatia de recurenta izoleaza dimensiunea k a unei singure clase: dp[n][t] este adevarat daca exista un k intre 1 si n astfel incat C(k,2)<=t si dp[n-k][t-C(k,2)] este adevarat, cu cazul de baza dp[0][0]=adevarat. Se cauta apoi cel mai mic N pentru care dp[N][T] este adevarat, parcurgand N crescator pana la o limita suficient de mare (determinata din faptul ca o singura clasa de marime aproximativ sqrt(2T) acopera deja aproape tot T, plus o marja de siguranta).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    long long T; cin >> T;
    long long m = 1;
    while (m*(m-1)/2 < T) m++;
    long long maxN = m + 30;
    vector<vector<char>> dp(maxN+1, vector<char>(T+1, 0));
    dp[0][0] = 1;
    long long ans = -1;
    for (long long n = 1; n <= maxN; n++){
        for (long long t = 0; t <= T; t++){
            bool ok = false;
            for (long long k = 1; k <= n; k++){
                long long pk = k*(k-1)/2;
                if (pk > t) break;
                if (dp[n-k][t-pk]){ ok = true; break; }
            }
            dp[n][t] = ok;
        }
        if (dp[n][T]){ ans = n; break; }
    }
    cout << ans << "\\n";
}
`,
    py: `T = int(input())
m = 1
while m*(m-1)//2 < T:
    m += 1
maxN = m + 30
dp = [[False]*(T+1) for _ in range(maxN+1)]
dp[0][0] = True
ans = -1
for n in range(1, maxN+1):
    dpn = dp[n]
    for t in range(0, T+1):
        ok = False
        for k in range(1, n+1):
            pk = k*(k-1)//2
            if pk > t:
                break
            if dp[n-k][t-pk]:
                ok = True
                break
        dpn[t] = ok
    if dpn[T]:
        ans = n
        break
print(ans)
`,
    tests: ["2022\n", "1\n", "3\n", "2500\n", "6\n"],
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
