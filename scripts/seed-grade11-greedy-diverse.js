const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade11", chapter: "greedy", sub: "greedy-diverse" };

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

const G_NOTE = "Rezolvati problema obligatoriu prin metoda Greedy: la fiecare pas faceti alegerea aparent cea mai buna la momentul respectiv (fara a reveni ulterior asupra ei), demonstrandu-se ca aceasta strategie locala conduce la o solutie optima global.";

const problems = [
  // ===================== GRUPA 1: INTERVALE =====================
  {
    slug: "g-activitati-numar-maxim",
    title: "Numarul maxim de activitati compatibile",
    difficulty: "easy",
    tags: ["greedy", "interval", "activitati"],
    statement: "Se citesc n activitati, fiecare caracterizata printr-un moment de inceput si unul de sfarsit. Doua activitati sunt compatibile daca intervalele lor nu se suprapun (o activitate care se termina exact cand incepe alta este considerata compatibila cu aceasta). Determinati, folosind metoda Greedy, numarul maxim de activitati compatibile doua cate doua ce pot fi selectate.",
    input_format: "Pe prima linie se citeste n. Urmeaza n linii, fiecare cu doua numere: momentul de inceput si cel de sfarsit al unei activitati.",
    output_format: "Se afiseaza un singur numar: numarul maxim de activitati compatibile.",
    constraints: "1 <= n <= 100000, 0 <= inceput < sfarsit <= 10^9",
    hints: "Sortati activitatile crescator dupa momentul de sfarsit. Parcurgeti-le in aceasta ordine si selectati o activitate de fiecare data cand momentul ei de inceput este cel putin egal cu momentul de sfarsit al ultimei activitati deja selectate.",
    explanation: `${G_NOTE} Alegerea greedy consta in a selecta mereu activitatea cu cel mai apropiat moment de sfarsit dintre cele inca disponibile: aceasta lasa cel mai mult timp liber pentru activitatile urmatoare, fiind demonstrabil optima (argument de schimb).\n\n**Complexitate:** O(n log n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<pair<long long,long long>> v(n);
    for (auto& p : v) { long long s, e; cin >> s >> e; p = {e, s}; }
    sort(v.begin(), v.end());
    long long lastEnd = -1;
    int numar = 0;
    for (auto& p : v) {
        long long e = p.first, s = p.second;
        if (s >= lastEnd) { numar++; lastEnd = e; }
    }
    cout << numar << "\\n";
    return 0;
}
`,
    py: `n = int(input())
v = []
for _ in range(n):
    s, e = map(int, input().split())
    v.append((e, s))
v.sort()
lastEnd = -1
numar = 0
for e, s in v:
    if s >= lastEnd:
        numar += 1
        lastEnd = e
print(numar)
`,
    tests: ["3\n1 2\n2 3\n3 4", "4\n1 3\n2 4\n3 5\n0 6", "5\n1 4\n2 3\n3 5\n0 1\n5 7", "2\n1 2\n1 2", "6\n1 2\n3 4\n0 6\n5 7\n8 9\n5 9"],
  },
  {
    slug: "g-activitati-afisare",
    title: "Selectarea unui numar maxim de activitati compatibile",
    difficulty: "easy",
    tags: ["greedy", "interval", "activitati"],
    statement: "Se citesc n activitati, numerotate de la 1 la n, fiecare caracterizata printr-un moment de inceput si unul de sfarsit. Determinati, folosind metoda Greedy, un subset maxim de activitati compatibile doua cate doua (care nu se suprapun) si afisati indicii activitatilor alese.",
    input_format: "Pe prima linie se citeste n. Urmeaza n linii, fiecare cu doua numere: momentul de inceput si cel de sfarsit al activitatii cu indicele respectiv.",
    output_format: "Pe prima linie se afiseaza numarul de activitati alese. Pe a doua linie se afiseaza indicii (numerotati de la 1) ai activitatilor alese, in ordinea selectiei (crescator dupa momentul de sfarsit), separati prin spatiu.",
    constraints: "1 <= n <= 100000, 0 <= inceput < sfarsit <= 10^9",
    hints: "La fel ca la numararea activitatilor compatibile, dar retineti si indicele original al fiecarei activitati pentru a-l putea afisa.",
    explanation: `${G_NOTE} Se aplica aceeasi strategie greedy (sortare dupa sfarsit, selectie daca inceputul >= sfarsitul ultimei alese), retinand de aceasta data si identitatea activitatilor alese, nu doar numarul lor.\n\n**Complexitate:** O(n log n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<tuple<long long,long long,int>> v(n);
    for (int i = 0; i < n; i++) { long long s, e; cin >> s >> e; v[i] = {e, s, i + 1}; }
    sort(v.begin(), v.end());
    long long lastEnd = -1;
    vector<int> alese;
    for (auto& [e, s, idx] : v) {
        if (s >= lastEnd) { alese.push_back(idx); lastEnd = e; }
    }
    cout << alese.size() << "\\n";
    for (size_t i = 0; i < alese.size(); i++) cout << alese[i] << (i + 1 < alese.size() ? ' ' : '\\n');
    return 0;
}
`,
    py: `n = int(input())
v = []
for i in range(n):
    s, e = map(int, input().split())
    v.append((e, s, i + 1))
v.sort()
lastEnd = -1
alese = []
for e, s, idx in v:
    if s >= lastEnd:
        alese.append(idx)
        lastEnd = e
print(len(alese))
print(' '.join(map(str, alese)))
`,
    tests: ["3\n1 2\n2 3\n3 4", "4\n1 3\n2 4\n3 5\n0 6", "5\n1 4\n2 3\n3 5\n0 1\n5 7", "2\n1 2\n1 2", "6\n1 2\n3 4\n0 6\n5 7\n8 9\n5 9"],
  },
  {
    slug: "g-min-eliminare-intervale",
    title: "Numarul minim de intervale de eliminat",
    difficulty: "easy",
    tags: ["greedy", "interval"],
    statement: "Se citesc n intervale. Determinati, folosind metoda Greedy, numarul minim de intervale care trebuie eliminate astfel incat intervalele ramase sa nu se mai suprapuna doua cate doua (un interval care se termina exact cand incepe altul nu este considerat suprapunere).",
    input_format: "Pe prima linie se citeste n. Urmeaza n linii, fiecare cu doua numere: inceputul si sfarsitul unui interval.",
    output_format: "Se afiseaza un singur numar: numarul minim de intervale de eliminat.",
    constraints: "1 <= n <= 100000, 0 <= inceput < sfarsit <= 10^9",
    hints: "Numarul minim de intervale de eliminat este egal cu n minus numarul maxim de intervale compatibile care pot fi pastrate (a se vedea problema selectiei unui numar maxim de activitati compatibile).",
    explanation: `${G_NOTE} Pastrarea unui numar maxim de intervale compatibile (prin acelasi algoritm greedy de selectie a activitatilor) este echivalenta cu eliminarea unui numar minim de intervale; raspunsul este n minus acest maxim.\n\n**Complexitate:** O(n log n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<pair<long long,long long>> v(n);
    for (auto& p : v) { long long s, e; cin >> s >> e; p = {e, s}; }
    sort(v.begin(), v.end());
    long long lastEnd = -1;
    int numar = 0;
    for (auto& p : v) {
        long long e = p.first, s = p.second;
        if (s >= lastEnd) { numar++; lastEnd = e; }
    }
    cout << (n - numar) << "\\n";
    return 0;
}
`,
    py: `n = int(input())
v = []
for _ in range(n):
    s, e = map(int, input().split())
    v.append((e, s))
v.sort()
lastEnd = -1
numar = 0
for e, s in v:
    if s >= lastEnd:
        numar += 1
        lastEnd = e
print(n - numar)
`,
    tests: ["3\n1 2\n2 3\n3 4", "4\n1 3\n2 4\n3 5\n0 6", "5\n1 4\n2 3\n3 5\n0 1\n5 7", "2\n1 2\n1 2", "6\n1 2\n3 4\n0 6\n5 7\n8 9\n5 9"],
  },
  {
    slug: "g-min-sali-necesare",
    title: "Numarul minim de sali necesare",
    difficulty: "medium",
    tags: ["greedy", "interval"],
    statement: "Se citesc n intalniri, fiecare cu un moment de inceput si unul de sfarsit. Determinati, folosind metoda Greedy, numarul minim de sali necesare astfel incat toate intalnirile sa poata avea loc, fara ca doua intalniri suprapuse in timp sa foloseasca aceeasi sala (o intalnire care se termina exact cand incepe alta poate folosi aceeasi sala).",
    input_format: "Pe prima linie se citeste n. Urmeaza n linii, fiecare cu doua numere: inceputul si sfarsitul unei intalniri.",
    output_format: "Se afiseaza un singur numar: numarul minim de sali necesare.",
    constraints: "1 <= n <= 100000, 0 <= inceput < sfarsit <= 10^9",
    hints: "Sortati separat momentele de inceput si cele de sfarsit. Parcurgeti-le simultan (ca la interclasarea a doua siruri sortate): de fiecare data cand un inceput este strict mai mic decat cel mai apropiat sfarsit inca neconsumat, este nevoie de o sala in plus; altfel, o sala se elibereaza.",
    explanation: `${G_NOTE} Numarul de sali necesare la un moment dat este egal cu numarul de intalniri active simultan; parcurgerea sincronizata a inceputurilor si sfarsiturilor sortate determina eficient acest maxim, fara a simula explicit fiecare moment de timp.\n\n**Complexitate:** O(n log n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> s(n), e(n);
    for (int i = 0; i < n; i++) cin >> s[i] >> e[i];
    sort(s.begin(), s.end());
    sort(e.begin(), e.end());
    int i = 0, j = 0, cur = 0, maxR = 0;
    while (i < n) {
        if (s[i] < e[j]) { cur++; i++; maxR = max(maxR, cur); }
        else { cur--; j++; }
    }
    cout << maxR << "\\n";
    return 0;
}
`,
    py: `n = int(input())
s = [0] * n
e = [0] * n
for i in range(n):
    s[i], e[i] = map(int, input().split())
s.sort()
e.sort()
i = j = cur = maxR = 0
while i < n:
    if s[i] < e[j]:
        cur += 1
        i += 1
        maxR = max(maxR, cur)
    else:
        cur -= 1
        j += 1
print(maxR)
`,
    tests: ["3\n1 2\n2 3\n3 4", "3\n1 4\n2 5\n3 6", "4\n0 10\n1 2\n3 4\n5 6", "1\n0 1", "5\n1 5\n2 3\n4 8\n1 2\n6 7"],
  },
  {
    slug: "g-min-sageti-baloane",
    title: "Numarul minim de sageti pentru a sparge toate baloanele",
    difficulty: "medium",
    tags: ["greedy", "interval"],
    statement: "Pe o axa exista n baloane, fiecare reprezentat printr-un interval [inceput, sfarsit]. O sageata trasa vertical la o coordonata x sparge toate baloanele al caror interval contine x (inclusiv capetele). Determinati, folosind metoda Greedy, numarul minim de sageti necesare pentru a sparge toate baloanele.",
    input_format: "Pe prima linie se citeste n. Urmeaza n linii, fiecare cu doua numere: inceputul si sfarsitul intervalului unui balon.",
    output_format: "Se afiseaza un singur numar: numarul minim de sageti necesare.",
    constraints: "1 <= n <= 100000, 0 <= inceput <= sfarsit <= 10^9",
    hints: "Sortati baloanele crescator dupa capatul din dreapta. Trageti o sageata la capatul din dreapta al primului balon nespart; aceasta sageata sparge automat toate baloanele al caror inceput este cel mult egal cu pozitia ei.",
    explanation: `${G_NOTE} Alegerea capatului din dreapta al balonului cu cel mai mic sfarsit (dintre cele inca nesparte) drept pozitie a sagetii maximizeaza numarul de baloane sparte simultan, fiind demonstrabil optima.\n\n**Complexitate:** O(n log n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<pair<long long,long long>> v(n);
    for (auto& p : v) cin >> p.first >> p.second;
    sort(v.begin(), v.end(), [](const pair<long long,long long>& a, const pair<long long,long long>& b) {
        return a.second < b.second;
    });
    long long arrow = 0;
    bool has = false;
    int numar = 0;
    for (auto& p : v) {
        if (!has || p.first > arrow) { numar++; arrow = p.second; has = true; }
    }
    cout << numar << "\\n";
    return 0;
}
`,
    py: `n = int(input())
v = []
for _ in range(n):
    s, e = map(int, input().split())
    v.append((s, e))
v.sort(key=lambda p: p[1])
arrow = 0
has = False
numar = 0
for s, e in v:
    if not has or s > arrow:
        numar += 1
        arrow = e
        has = True
print(numar)
`,
    tests: ["4\n10 16\n2 8\n1 6\n7 12", "1\n1 2", "4\n1 2\n3 4\n5 6\n7 8", "3\n1 5\n2 6\n3 7", "5\n0 3\n2 5\n4 7\n6 9\n8 11"],
  },
  {
    slug: "g-reuniune-intervale",
    title: "Reuniunea unor intervale",
    difficulty: "easy",
    tags: ["greedy", "interval"],
    statement: "Se citesc n intervale. Determinati, folosind o strategie Greedy (sortare urmata de o singura parcurgere), reuniunea acestor intervale sub forma unui numar minim de intervale disjuncte care sa acopere exact aceleasi puncte ca reuniunea intervalelor initiale (doua intervale care se ating intr-un punct se unesc intr-unul singur).",
    input_format: "Pe prima linie se citeste n. Urmeaza n linii, fiecare cu doua numere: inceputul si sfarsitul unui interval.",
    output_format: "Se afiseaza intervalele rezultate in urma reuniunii, in ordine crescatoare, cate unul pe linie, sub forma 'inceput sfarsit'.",
    constraints: "1 <= n <= 100000, 0 <= inceput <= sfarsit <= 10^9",
    hints: "Sortati intervalele crescator dupa inceput. Parcurgeti-le, mentinand intervalul curent 'deschis'; daca urmatorul interval incepe inaintea sau exact la sfarsitul celui curent, extindeti-l; altfel, inchideti intervalul curent si incepeti unul nou.",
    explanation: `${G_NOTE} Sortarea dupa inceput permite parcurgerea intervalelor in ordinea in care ar aparea pe axa, unind cu usurinta orice interval nou cu cel curent daca se suprapun sau se ating.\n\n**Complexitate:** O(n log n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<pair<long long,long long>> v(n);
    for (auto& p : v) cin >> p.first >> p.second;
    sort(v.begin(), v.end());
    vector<pair<long long,long long>> rez;
    for (auto& p : v) {
        if (rez.empty() || p.first > rez.back().second) rez.push_back(p);
        else rez.back().second = max(rez.back().second, p.second);
    }
    for (auto& p : rez) cout << p.first << " " << p.second << "\\n";
    return 0;
}
`,
    py: `n = int(input())
v = []
for _ in range(n):
    s, e = map(int, input().split())
    v.append((s, e))
v.sort()
rez = []
for s, e in v:
    if not rez or s > rez[-1][1]:
        rez.append([s, e])
    else:
        rez[-1][1] = max(rez[-1][1], e)
for s, e in rez:
    print(s, e)
`,
    tests: ["4\n1 3\n2 6\n8 10\n15 18", "3\n1 4\n4 5\n7 8", "1\n1 4", "5\n1 2\n2 3\n3 4\n4 5\n10 11", "3\n1 10\n2 3\n4 5"],
  },
  {
    slug: "g-job-secventiere-numar-maxim",
    title: "Numarul maxim de job-uri finalizate inainte de deadline",
    difficulty: "medium",
    tags: ["greedy", "job-sequencing"],
    statement: "Se citesc n job-uri, fiecare avand un deadline (numar natural) si o durata de executie de exact 1 unitate de timp. O singura masina este disponibila, incepand de la momentul 0, si poate executa un singur job pe unitate de timp. Determinati, folosind metoda Greedy, numarul maxim de job-uri care pot fi finalizate, fiecare inainte de (sau exact la) deadline-ul sau.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n deadline-uri.",
    output_format: "Se afiseaza un singur numar: numarul maxim de job-uri ce pot fi finalizate la timp.",
    constraints: "1 <= n <= 1000, 1 <= deadline <= 1000",
    hints: "Pentru fiecare job (in orice ordine), incercati sa il plasati in cel mai tarziu interval de timp liber, mai mic sau egal cu deadline-ul sau (cautand descrescator de la deadline catre 1). Daca gasiti un asemenea interval, marcati-l ocupat.",
    explanation: `${G_NOTE} Plasarea fiecarui job in cel mai tarziu interval de timp liber inca disponibil, sub deadline-ul sau, pastreaza cat mai multe intervale timpurii libere pentru alte job-uri, garantand un numar maxim de job-uri finalizate la timp, indiferent de ordinea in care sunt procesate job-urile.\n\n**Complexitate:** O(n * maxDeadline)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> deadline(n);
    int maxD = 0;
    for (auto& d : deadline) { cin >> d; maxD = max(maxD, d); }
    vector<bool> ocupat(maxD + 1, false);
    int numar = 0;
    for (int i = 0; i < n; i++) {
        for (int slot = min(deadline[i], maxD); slot >= 1; slot--) {
            if (!ocupat[slot]) { ocupat[slot] = true; numar++; break; }
        }
    }
    cout << numar << "\\n";
    return 0;
}
`,
    py: `n = int(input())
deadline = list(map(int, input().split()))
maxD = max(deadline)
ocupat = [False] * (maxD + 1)
numar = 0
for i in range(n):
    for slot in range(min(deadline[i], maxD), 0, -1):
        if not ocupat[slot]:
            ocupat[slot] = True
            numar += 1
            break
print(numar)
`,
    tests: ["4\n4 1 1 1", "5\n2 1 2 1 1", "3\n1 2 3", "6\n3 3 3 3 3 3", "5\n5 5 5 5 5"],
  },
  {
    slug: "g-job-secventiere-profit",
    title: "Profitul maxim din executia unor job-uri cu deadline",
    difficulty: "hard",
    tags: ["greedy", "job-sequencing"],
    statement: "Se citesc n job-uri, fiecare avand un deadline si un profit; fiecare job dureaza exact 1 unitate de timp, iar o singura masina este disponibila. Determinati, folosind metoda Greedy, profitul maxim total obtinut executand un subset de job-uri, fiecare inainte de (sau exact la) deadline-ul sau.",
    input_format: "Pe prima linie se citeste n. Urmeaza n linii, fiecare cu doua numere: deadline-ul si profitul unui job.",
    output_format: "Se afiseaza un singur numar: profitul maxim total.",
    constraints: "1 <= n <= 1000, 1 <= deadline <= 1000, 0 <= profit <= 10^6",
    hints: "Sortati job-urile descrescator dupa profit. Procesati-le in aceasta ordine si plasati fiecare job in cel mai tarziu interval de timp liber, mai mic sau egal cu deadline-ul sau.",
    explanation: `${G_NOTE} Procesarea job-urilor in ordinea descrescatoare a profitului garanteaza ca cele mai valoroase job-uri obtin prioritate la sloturile de timp disponibile; plasarea in cel mai tarziu slot liber sub deadline pastreaza sloturile timpurii pentru job-urile urmatoare.\n\n**Complexitate:** O(n log n + n * maxDeadline)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> deadline(n);
    vector<long long> profit(n);
    int maxD = 0;
    for (int i = 0; i < n; i++) { cin >> deadline[i] >> profit[i]; maxD = max(maxD, deadline[i]); }
    vector<int> idx(n);
    iota(idx.begin(), idx.end(), 0);
    sort(idx.begin(), idx.end(), [&](int a, int b) { return profit[a] > profit[b]; });
    vector<bool> ocupat(maxD + 1, false);
    long long total = 0;
    for (int id : idx) {
        for (int slot = min(deadline[id], maxD); slot >= 1; slot--) {
            if (!ocupat[slot]) { ocupat[slot] = true; total += profit[id]; break; }
        }
    }
    cout << total << "\\n";
    return 0;
}
`,
    py: `n = int(input())
deadline = [0] * n
profit = [0] * n
for i in range(n):
    deadline[i], profit[i] = map(int, input().split())
maxD = max(deadline)
idx = sorted(range(n), key=lambda i: -profit[i])
ocupat = [False] * (maxD + 1)
total = 0
for id in idx:
    for slot in range(min(deadline[id], maxD), 0, -1):
        if not ocupat[slot]:
            ocupat[slot] = True
            total += profit[id]
            break
print(total)
`,
    tests: [
      "4\n4 20\n1 10\n1 40\n1 30",
      "5\n2 100\n1 19\n2 27\n1 25\n3 15",
      "3\n1 5\n2 6\n2 7",
      "6\n3 10\n3 10\n3 10\n3 10\n3 10\n3 10",
      "5\n5 50\n4 40\n3 30\n2 20\n1 10",
    ],
  },
  {
    slug: "g-min-robinete-udare-gradina",
    title: "Numarul minim de robinete pentru udarea unei gradini",
    difficulty: "hard",
    tags: ["greedy", "interval"],
    statement: "O gradina este reprezentata ca segmentul [0,n] pe o axa. Exista n+1 robinete, robinetul i (0 <= i <= n) fiind situat la pozitia i; daca este deschis, el uda intervalul [i-raza[i], i+raza[i]] (limitat la [0,n]). Determinati, folosind metoda Greedy, numarul minim de robinete ce trebuie deschise pentru a uda intreaga gradina. Daca acest lucru nu este posibil, afisati -1.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n+1 valori raza[0], raza[1], ..., raza[n].",
    output_format: "Se afiseaza un singur numar: numarul minim de robinete necesare, sau -1 daca gradina nu poate fi udata in intregime.",
    constraints: "1 <= n <= 10000, 0 <= raza[i] <= n",
    hints: "Transformati problema intr-una de tip 'salt maxim': pentru fiecare pozitie de start posibila a a gradinii, calculati cea mai indepartata pozitie ce poate fi udata folosind un singur robinet ce acopera acea pozitie. Apoi aplicati o strategie greedy similara jocului de sarituri: avansati mereu catre cea mai indepartata pozitie accesibila, numarand de cate ori este nevoie sa 'schimbati' robinetul curent.",
    explanation: `${G_NOTE} Fiecare robinet acopera un interval [stanga,dreapta]; problema devine echivalenta cu acoperirea segmentului [0,n] cu un numar minim de intervale, rezolvabila cu aceeasi tehnica greedy folosita la problema saritului minim numar de ori pana la capatul unui vector (se avanseaza mereu catre cea mai indepartata pozitie accesibila din intervalul curent).\n\n**Complexitate:** O(n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> r(n + 1);
    for (auto& x : r) cin >> x;
    vector<int> maxReach(n + 1, 0);
    for (int i = 0; i <= n; i++) {
        int l = max(0, i - r[i]), rr = min(n, i + r[i]);
        maxReach[l] = max(maxReach[l], rr);
    }
    int taps = 0, curEnd = 0, farthest = 0;
    bool ok = true;
    for (int i = 0; i < n; i++) {
        if (i > farthest) { ok = false; break; }
        farthest = max(farthest, maxReach[i]);
        if (i == curEnd) {
            taps++;
            curEnd = farthest;
            if (curEnd >= n) break;
        }
    }
    if (!ok || curEnd < n) cout << -1 << "\\n"; else cout << taps << "\\n";
    return 0;
}
`,
    py: `n = int(input())
r = list(map(int, input().split()))
maxReach = [0] * (n + 1)
for i in range(n + 1):
    l = max(0, i - r[i])
    rr = min(n, i + r[i])
    maxReach[l] = max(maxReach[l], rr)
taps = 0
curEnd = 0
farthest = 0
ok = True
for i in range(n):
    if i > farthest:
        ok = False
        break
    farthest = max(farthest, maxReach[i])
    if i == curEnd:
        taps += 1
        curEnd = farthest
        if curEnd >= n:
            break
if not ok or curEnd < n:
    print(-1)
else:
    print(taps)
`,
    tests: ["5\n3 4 1 1 0 0", "3\n0 0 0 0", "7\n1 2 1 0 2 1 0 1", "1\n0 0", "8\n4 0 0 0 0 0 0 0 4"],
  },

  // ===================== GRUPA 2: RUCSAC / ALOCARE =====================
  {
    slug: "g-rucsac-fractionar",
    title: "Rucsacul fractionar",
    difficulty: "medium",
    tags: ["greedy", "rucsac"],
    statement: "Se citesc n obiecte, fiecare cu o greutate si o valoare, si capacitatea G a unui rucsac. Din fiecare obiect se poate lua orice fractiune (nu neaparat intreg obiectul). Determinati, folosind metoda Greedy, valoarea maxima ce poate fi transportata fara a depasi capacitatea G.",
    input_format: "Pe prima linie se citesc n si G. Urmeaza n linii, fiecare cu doua numere: greutatea si valoarea unui obiect.",
    output_format: "Se afiseaza valoarea maxima, sub forma unei fractii ireductibile 'numarator/numitor' (sau doar 'numarator' daca valoarea este intreaga).",
    constraints: "1 <= n <= 1000, 0 <= G <= 10^6, 1 <= greutate, valoare <= 10^6",
    hints: "Sortati obiectele descrescator dupa raportul valoare/greutate. Luati intreg fiecare obiect cat timp incape in capacitatea ramasa; pentru primul obiect care nu mai incape integral, luati exact fractiunea care umple rucsacul, apoi opriti-va.",
    explanation: `${G_NOTE} Ordonarea dupa raportul valoare/greutate (comparat exact, prin inmultire incrucisata, pentru a evita erorile de calcul cu numere reale) garanteaza ca se maximizeaza valoarea per unitate de capacitate folosita la fiecare pas. Rezultatul este calculat si afisat ca fractie exacta, evitand complet aritmetica in virgula mobila.\n\n**Complexitate:** O(n log n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; long long G;
    cin >> n >> G;
    vector<long long> w(n), val(n);
    for (int i = 0; i < n; i++) cin >> w[i] >> val[i];
    vector<int> idx(n);
    iota(idx.begin(), idx.end(), 0);
    sort(idx.begin(), idx.end(), [&](int a, int b) { return val[a] * w[b] > val[b] * w[a]; });
    long long sumaIntreaga = 0, ramasa = G, partialNum = 0, partialDen = 1;
    for (int id : idx) {
        if (ramasa == 0) break;
        if (w[id] <= ramasa) { sumaIntreaga += val[id]; ramasa -= w[id]; }
        else { partialNum = val[id] * ramasa; partialDen = w[id]; ramasa = 0; break; }
    }
    long long num = sumaIntreaga * partialDen + partialNum;
    long long den = partialDen;
    long long g = __gcd(num, den);
    if (g == 0) g = 1;
    num /= g; den /= g;
    if (den == 1) cout << num << "\\n"; else cout << num << "/" << den << "\\n";
    return 0;
}
`,
    py: `import math

n, G = map(int, input().split())
w = [0] * n
val = [0] * n
for i in range(n):
    w[i], val[i] = map(int, input().split())
import functools
def cmp(a, b):
    lhs = val[a] * w[b]
    rhs = val[b] * w[a]
    if lhs > rhs:
        return -1
    if lhs < rhs:
        return 1
    return 0
idx = sorted(range(n), key=functools.cmp_to_key(cmp))
sumaIntreaga = 0
ramasa = G
partialNum = 0
partialDen = 1
for id in idx:
    if ramasa == 0:
        break
    if w[id] <= ramasa:
        sumaIntreaga += val[id]
        ramasa -= w[id]
    else:
        partialNum = val[id] * ramasa
        partialDen = w[id]
        ramasa = 0
        break
num = sumaIntreaga * partialDen + partialNum
den = partialDen
g = math.gcd(num, den)
if g == 0:
    g = 1
num //= g
den //= g
if den == 1:
    print(num)
else:
    print(f"{num}/{den}")
`,
    tests: ["3 50\n10 60\n20 100\n30 120", "2 10\n5 10\n5 10", "1 5\n10 100", "3 25\n10 60\n20 100\n30 120", "2 0\n5 10\n5 10"],
  },
  {
    slug: "g-cumparare-maxima-buget",
    title: "Numarul maxim de produse cumparate cu un buget dat",
    difficulty: "easy",
    tags: ["greedy"],
    statement: "Se citesc n preturi ale unor produse si un buget B. Determinati, folosind metoda Greedy, numarul maxim de produse distincte ce pot fi cumparate fara a depasi bugetul B (fiecare produs poate fi cumparat cel mult o data).",
    input_format: "Pe prima linie se citesc n si B. Pe a doua linie se citesc cele n preturi.",
    output_format: "Se afiseaza un singur numar: numarul maxim de produse ce pot fi cumparate.",
    constraints: "1 <= n <= 100000, 0 <= B, pret <= 10^9",
    hints: "Sortati preturile crescator si cumparati produsele in aceasta ordine, cat timp bugetul ramas permite.",
    explanation: `${G_NOTE} Cumpararea produselor incepand cu cele mai ieftine maximizeaza numarul de produse achizitionate pentru un buget fixat.\n\n**Complexitate:** O(n log n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; long long B;
    cin >> n >> B;
    vector<long long> pret(n);
    for (auto& p : pret) cin >> p;
    sort(pret.begin(), pret.end());
    int numar = 0;
    for (long long p : pret) {
        if (p <= B) { B -= p; numar++; } else break;
    }
    cout << numar << "\\n";
    return 0;
}
`,
    py: `n, B = map(int, input().split())
pret = list(map(int, input().split()))
pret.sort()
numar = 0
for p in pret:
    if p <= B:
        B -= p
        numar += 1
    else:
        break
print(numar)
`,
    tests: ["5 10\n1 12 5 2 3", "3 0\n1 2 3", "4 100\n25 25 25 25", "1 5\n5", "6 20\n7 3 8 2 5 1"],
  },
  {
    slug: "g-distributie-bomboane-copii",
    title: "Distribuirea de prajituri copiilor",
    difficulty: "easy",
    tags: ["greedy"],
    statement: "Se citesc n copii, fiecare cu un factor de lacomie g[i] (copilul i este multumit doar de o prajitura cu marimea cel putin g[i]), si m prajituri, cu marimile s[j]. Fiecare prajitura poate fi oferita unui singur copil. Determinati, folosind metoda Greedy, numarul maxim de copii care pot fi multumiti.",
    input_format: "Pe prima linie se citesc n si m. Pe a doua linie se citesc cele n valori g[i]. Pe a treia linie se citesc cele m valori s[j].",
    output_format: "Se afiseaza un singur numar: numarul maxim de copii multumiti.",
    constraints: "1 <= n, m <= 100000, 1 <= g[i], s[j] <= 10^9",
    hints: "Sortati crescator atat factorii de lacomie cat si marimile prajiturilor. Parcurgeti prajiturile in ordine crescatoare si oferiti-le, pe rand, celui mai putin pretentios copil inca nemultumit a carui cerinta este satisfacuta.",
    explanation: `${G_NOTE} Oferind fiecare prajitura celui mai putin pretentios copil pe care il poate multumi, se evita 'irosirea' prajiturilor mari pe copii usor de multumit, maximizand numarul total de copii multumiti.\n\n**Complexitate:** O(n log n + m log m)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<long long> g(n), s(m);
    for (auto& x : g) cin >> x;
    for (auto& x : s) cin >> x;
    sort(g.begin(), g.end());
    sort(s.begin(), s.end());
    int i = 0, j = 0, numar = 0;
    while (i < n && j < m) {
        if (s[j] >= g[i]) { numar++; i++; j++; }
        else j++;
    }
    cout << numar << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
g = list(map(int, input().split()))
s = list(map(int, input().split()))
g.sort()
s.sort()
i = j = numar = 0
while i < n and j < m:
    if s[j] >= g[i]:
        numar += 1
        i += 1
        j += 1
    else:
        j += 1
print(numar)
`,
    tests: ["3 3\n1 2 3\n1 1 1", "2 3\n1 2\n1 2 3", "4 2\n10 9 8 7\n5 6", "1 1\n5\n5", "5 5\n3 3 3 3 3\n1 1 3 3 3"],
  },
  {
    slug: "g-repartizare-soareci-gauri",
    title: "Repartizarea soarecilor in gauri",
    difficulty: "medium",
    tags: ["greedy"],
    statement: "Se citesc n pozitii ale unor soareci si n pozitii ale unor gauri, pe o axa. Fiecare gaura poate gazdui exact un soarece. Determinati, folosind metoda Greedy, cea mai mica valoare posibila a distantei MAXIME parcurse de vreun soarece, pentru cea mai buna repartizare (asignare) soarece-gaura.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n pozitii ale soarecilor. Pe a treia linie se citesc cele n pozitii ale gaurilor.",
    output_format: "Se afiseaza un singur numar: distanta maxima minima posibila.",
    constraints: "1 <= n <= 100000, -10^9 <= pozitie <= 10^9",
    hints: "Sortati crescator atat pozitiile soarecilor cat si ale gaurilor, apoi asignati-le in ordine (soarecele i-lea catre gaura i-a). Raspunsul este cea mai mare dintre distantele astfel obtinute.",
    explanation: `${G_NOTE} Sortarea si asignarea in ordine minimizeaza distanta maxima parcursa de orice soarece: orice alta asignare ar produce o distanta maxima cel putin la fel de mare (se poate demonstra printr-un argument de schimb: interschimbarea a doua asignari 'incrucisate' nu poate scadea maximul).\n\n**Complexitate:** O(n log n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> soareci(n), gauri(n);
    for (auto& x : soareci) cin >> x;
    for (auto& x : gauri) cin >> x;
    sort(soareci.begin(), soareci.end());
    sort(gauri.begin(), gauri.end());
    long long maxim = 0;
    for (int i = 0; i < n; i++) maxim = max(maxim, llabs(soareci[i] - gauri[i]));
    cout << maxim << "\\n";
    return 0;
}
`,
    py: `n = int(input())
soareci = list(map(int, input().split()))
gauri = list(map(int, input().split()))
soareci.sort()
gauri.sort()
maxim = 0
for i in range(n):
    maxim = max(maxim, abs(soareci[i] - gauri[i]))
print(maxim)
`,
    tests: ["3\n4 -4 2\n4 0 5", "1\n0\n10", "4\n1 2 3 4\n1 2 3 4", "5\n-1 -2 -3 -4 -5\n1 2 3 4 5", "2\n1 5\n10 2"],
  },
  {
    slug: "g-diferenta-minima-alegere",
    title: "Diferenta minima intre elementul maxim si minim ales",
    difficulty: "medium",
    tags: ["greedy"],
    statement: "Se citesc n numere naturale (cantitati de ciocolata din n cutii) si un numar m. Alegeti m dintre cele n cutii, astfel incat diferenta dintre cutia cu cea mai multa ciocolata si cea cu cea mai putina, dintre cele alese, sa fie MINIMA. Afisati aceasta diferenta minima.",
    input_format: "Pe prima linie se citesc n si m. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza un singur numar: diferenta minima posibila.",
    constraints: "1 <= m <= n <= 100000, 0 <= valoare <= 10^9",
    hints: "Sortati crescator valorile. Orice submultime de m cutii cu diferenta minima trebuie sa corespunda unei ferestre de m elemente CONSECUTIVE in sirul sortat; parcurgeti toate aceste ferestre si retineti minimul diferentei dintre capete.",
    explanation: `${G_NOTE} Dupa sortare, alegerea a m elemente consecutive minimizeaza intotdeauna diferenta maxima-minima (orice alta selectie ar 'sari' peste un element, marind inevitabil intervalul acoperit); este suficient sa verificam toate ferestrele de dimensiune m.\n\n**Complexitate:** O(n log n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    sort(a.begin(), a.end());
    long long minDif = a[m - 1] - a[0];
    for (int i = 1; i + m - 1 < n; i++) minDif = min(minDif, a[i + m - 1] - a[i]);
    cout << minDif << "\\n";
    return 0;
}
`,
    py: `n, m = map(int, input().split())
a = list(map(int, input().split()))
a.sort()
minDif = a[m - 1] - a[0]
for i in range(1, n - m + 1):
    minDif = min(minDif, a[i + m - 1] - a[i])
print(minDif)
`,
    tests: ["8 4\n3 4 1 9 56 7 9 12", "5 3\n1 2 3 4 5", "1 1\n10", "6 2\n10 100 300 200 1000 20", "4 4\n5 5 5 5"],
  },
  {
    slug: "g-barci-salvare",
    title: "Numarul minim de barci pentru salvare",
    difficulty: "medium",
    tags: ["greedy"],
    statement: "Se citesc n greutati ale unor persoane si limita maxima de greutate G a unei barci. Fiecare barca poate transporta cel mult 2 persoane, daca suma greutatilor lor nu depaseste G. Determinati, folosind metoda Greedy, numarul minim de barci necesare pentru a transporta toate persoanele.",
    input_format: "Pe prima linie se citesc n si G. Pe a doua linie se citesc cele n greutati (fiecare cel mult G).",
    output_format: "Se afiseaza un singur numar: numarul minim de barci necesare.",
    constraints: "1 <= n <= 100000, 1 <= greutate <= G <= 10^9",
    hints: "Sortati greutatile crescator. Folositi doi indici, unul la inceput si unul la sfarsit: incercati sa urcati impreuna cea mai usoara si cea mai grea persoana ramase; daca suma lor depaseste G, cea mai grea persoana calatoreste singura.",
    explanation: `${G_NOTE} Asocierea celei mai grele persoane inca netransportate cu cea mai usoara (daca este posibil) foloseste cat mai eficient capacitatea fiecarei barci, minimizand numarul de barci necesare.\n\n**Complexitate:** O(n log n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; long long G;
    cin >> n >> G;
    vector<long long> w(n);
    for (auto& x : w) cin >> x;
    sort(w.begin(), w.end());
    int i = 0, j = n - 1, barci = 0;
    while (i <= j) {
        if (i < j && w[i] + w[j] <= G) i++;
        j--;
        barci++;
    }
    cout << barci << "\\n";
    return 0;
}
`,
    py: `n, G = map(int, input().split())
w = list(map(int, input().split()))
w.sort()
i, j, barci = 0, n - 1, 0
while i <= j:
    if i < j and w[i] + w[j] <= G:
        i += 1
    j -= 1
    barci += 1
print(barci)
`,
    tests: ["4 5\n3 2 2 1", "3 3\n3 2 2", "1 10\n5", "5 6\n1 2 2 3 5", "6 4\n1 1 1 1 4 4"],
  },

  // ===================== GRUPA 3: MONEDE / NUMERE =====================
  {
    slug: "g-numar-minim-monede-canonic",
    title: "Numarul minim de monede pentru o suma data",
    difficulty: "easy",
    tags: ["greedy", "monede"],
    statement: "Se citeste o suma naturala S. Folosind sistemul canonic de monede cu valorile 1, 2, 5, 10, 20, 50, 100, 200 si 500 (fiecare valoare disponibila in cantitate nelimitata), determinati, folosind metoda Greedy, numarul minim de monede necesare pentru a obtine exact suma S.",
    input_format: "Se citeste numarul natural S.",
    output_format: "Se afiseaza un singur numar: numarul minim de monede necesare.",
    constraints: "0 <= S <= 10^9",
    hints: "Parcurgeti valorile monedelor in ordine descrescatoare si, pentru fiecare, folositi cate monede de acea valoare incap in suma ramasa.",
    explanation: `${G_NOTE} Pentru un sistem CANONIC de monede (precum cel folosit aici, similar denominatiilor euro), alegerea greedy a celei mai mari monede posibile la fiecare pas produce intotdeauna numarul minim de monede; acest lucru nu este adevarat pentru un sistem oarecare de monede.\n\n**Complexitate:** O(1) (numarul de tipuri de monede este constant)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long S; cin >> S;
    vector<long long> monede = {500, 200, 100, 50, 20, 10, 5, 2, 1};
    long long numar = 0;
    for (long long m : monede) { numar += S / m; S %= m; }
    cout << numar << "\\n";
    return 0;
}
`,
    py: `S = int(input())
monede = [500, 200, 100, 50, 20, 10, 5, 2, 1]
numar = 0
for m in monede:
    numar += S // m
    S %= m
print(numar)
`,
    tests: ["0", "1", "13", "999", "1000000000"],
  },
  {
    slug: "g-rest-bancnote",
    title: "Rest la limonada",
    difficulty: "easy",
    tags: ["greedy", "monede"],
    statement: "La un stand, fiecare pahar de limonada costa 5 lei. Se citesc n clienti, in ordinea sosirii, fiecare platind cu o singura bancnota de 5, 10 sau 20 de lei. Initial standul nu are nicio bancnota. Determinati, folosind metoda Greedy, daca se poate da rest corect fiecarui client, in ordinea sosirii lor.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n bancnote (5, 10 sau 20).",
    output_format: "Se afiseaza DA daca se poate da rest tuturor clientilor, respectiv NU in caz contrar.",
    constraints: "1 <= n <= 100000",
    hints: "Retineti cate bancnote de 5 si cate de 10 aveti la un moment dat. Pentru un client cu bancnota de 10, dati rest o bancnota de 5. Pentru un client cu bancnota de 20, preferati sa dati rest o bancnota de 10 si una de 5 (daca aveti); altfel, dati trei bancnote de 5.",
    explanation: `${G_NOTE} La bancnota de 20, preferarea combinatiei '10+5' fata de 'trei bancnote de 5' pastreaza cat mai multe bancnote de 5 disponibile, acestea fiind cele mai versatile (folosibile atat pentru rest la 10, cat si la 20), maximizand sansele de a putea da rest si clientilor urmatori.\n\n**Complexitate:** O(n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    long long c5 = 0, c10 = 0;
    bool ok = true;
    for (int i = 0; i < n; i++) {
        int b; cin >> b;
        if (!ok) continue;
        if (b == 5) c5++;
        else if (b == 10) {
            if (c5 > 0) { c5--; c10++; } else ok = false;
        } else {
            if (c10 > 0 && c5 > 0) { c10--; c5--; }
            else if (c5 >= 3) c5 -= 3;
            else ok = false;
        }
    }
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `n = int(input())
bancnote = list(map(int, input().split()))
c5 = c10 = 0
ok = True
for b in bancnote:
    if not ok:
        continue
    if b == 5:
        c5 += 1
    elif b == 10:
        if c5 > 0:
            c5 -= 1
            c10 += 1
        else:
            ok = False
    else:
        if c10 > 0 and c5 > 0:
            c10 -= 1
            c5 -= 1
        elif c5 >= 3:
            c5 -= 3
        else:
            ok = False
print("DA" if ok else "NU")
`,
    tests: ["5\n5 5 5 10 20", "3\n5 5 10", "3\n10 10 20", "4\n5 5 10 10", "6\n5 5 5 5 20 20"],
  },
  {
    slug: "g-fractii-egiptene",
    title: "Descompunerea unei fractii in fractii egiptene",
    difficulty: "medium",
    tags: ["greedy", "fractii"],
    statement: "Se citesc doua numere naturale p si q, cu 0 < p < q, reprezentand fractia p/q. Descompuneti aceasta fractie, folosind metoda Greedy (algoritmul lui Fibonacci-Sylvester), intr-o suma de fractii unitare (cu numarator 1) distincte: p/q = 1/a1 + 1/a2 + ... + 1/ak, cu a1 < a2 < ... < ak.",
    input_format: "Se citesc, separate prin spatiu, numerele naturale p si q.",
    output_format: "Se afiseaza valorile a1, a2, ..., ak, separate prin spatiu.",
    constraints: "1 <= p < q <= 100",
    hints: "La fiecare pas, alegeti a = ceil(q/p) (cel mai mic numar natural pentru care 1/a <= p/q) si scadeti 1/a din p/q, obtinand o noua fractie p'/q', pe care o simplificati (impartind la cel mai mare divizor comun) inainte de a repeta procedeul.",
    explanation: `${G_NOTE} La fiecare pas se alege cea mai mare fractie unitara posibila (1/a) care nu depaseste restul curent, garantand ca numaratorul ramas scade strict de la un pas la altul, deci algoritmul se termina intotdeauna intr-un numar finit de pasi.\n\n**Complexitate:** O(p) pasi in cel mai defavorabil caz`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long p, q; cin >> p >> q;
    vector<long long> rez;
    while (p > 0) {
        long long a = (q + p - 1) / p;
        rez.push_back(a);
        long long newP = p * a - q;
        long long newQ = q * a;
        long long g = __gcd(newP, newQ);
        if (g > 0) { newP /= g; newQ /= g; }
        p = newP; q = newQ;
    }
    for (size_t i = 0; i < rez.size(); i++) cout << rez[i] << (i + 1 < rez.size() ? ' ' : '\\n');
    return 0;
}
`,
    py: `import math

p, q = map(int, input().split())
rez = []
while p > 0:
    a = (q + p - 1) // p
    rez.append(a)
    newP = p * a - q
    newQ = q * a
    g = math.gcd(newP, newQ)
    if g > 0:
        newP //= g
        newQ //= g
    p, q = newP, newQ
print(' '.join(map(str, rez)))
`,
    tests: ["1 2", "3 4", "5 6", "2 3", "6 14"],
  },

  // ===================== GRUPA 4: HUFFMAN / MERGE-COST =====================
  {
    slug: "g-huffman-cost-minim",
    title: "Codificarea Huffman - costul minim",
    difficulty: "medium",
    tags: ["greedy", "huffman"],
    statement: "Se citesc n simboluri si frecventele lor de aparitie. Construiti, folosind metoda Greedy (algoritmul lui Huffman: combinati mereu cele doua frecvente minime disponibile intr-un nod nou, cu frecventa egala cu suma lor, pana ramane un singur nod), un cod Huffman optim si determinati costul total al codificarii (suma tuturor sumelor obtinute la fiecare combinare, echivalenta cu lungimea totala, in biti, a mesajului codificat).",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n frecvente.",
    output_format: "Se afiseaza un singur numar: costul total minim al codificarii. Daca n=1, costul este 0.",
    constraints: "1 <= n <= 100000, 1 <= frecventa <= 10^9",
    hints: "Folositi un min-heap (coada de prioritati) continand frecventele. La fiecare pas, extrageti cele doua cele mai mici valori, adunati costul lor la total, si introduceti suma lor inapoi in heap, repetand pana ramane un singur element.",
    explanation: `${G_NOTE} Combinarea mereu a celor doua frecvente minime disponibile este alegerea greedy care minimizeaza costul total de codificare (teorema lui Huffman); aceasta strategie garanteaza ca simbolurile mai rare primesc coduri mai lungi, iar cele mai frecvente, coduri mai scurte.\n\n**Complexitate:** O(n log n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    priority_queue<long long, vector<long long>, greater<long long>> pq;
    for (int i = 0; i < n; i++) { long long f; cin >> f; pq.push(f); }
    if (n == 1) { cout << 0 << "\\n"; return 0; }
    long long total = 0;
    while (pq.size() > 1) {
        long long a = pq.top(); pq.pop();
        long long b = pq.top(); pq.pop();
        long long s = a + b;
        total += s;
        pq.push(s);
    }
    cout << total << "\\n";
    return 0;
}
`,
    py: `import heapq

n = int(input())
frecv = list(map(int, input().split()))
if n == 1:
    print(0)
else:
    heapq.heapify(frecv)
    total = 0
    while len(frecv) > 1:
        a = heapq.heappop(frecv)
        b = heapq.heappop(frecv)
        s = a + b
        total += s
        heapq.heappush(frecv, s)
    print(total)
`,
    tests: ["4\n5 9 12 13", "5\n5 9 12 13 16", "1\n100", "6\n1 1 1 1 1 1", "3\n1 2 4"],
  },
  {
    slug: "g-huffman-afisare-coduri",
    title: "Codificarea Huffman - afisarea codurilor",
    difficulty: "hard",
    tags: ["greedy", "huffman"],
    statement: "Se citesc n simboluri (siruri de caractere distincte) si frecventele lor de aparitie. Construiti, folosind algoritmul Greedy al lui Huffman, un cod binar optim pentru fiecare simbol si afisati-l.",
    input_format: "Pe prima linie se citeste n. Urmeaza n linii, fiecare cu un simbol si frecventa sa.",
    output_format: "Se afiseaza, pentru fiecare simbol (in ordinea citirii), simbolul urmat de codul sau binar, separate printr-un spatiu. Daca n=1, singurul simbol primeste codul '0'.",
    constraints: "2 <= n <= 1000, 1 <= frecventa <= 10^9 (pentru n=1, aceeasi limita pentru frecventa)",
    hints: "Construiti explicit arborele Huffman folosind un min-heap de perechi (frecventa, identificator de nod), unde identificatorii cresc pe masura ce se creeaza noduri noi; in caz de frecvente egale, extrageti nodul cu identificatorul mai mic. Codul unui simbol este drumul de la radacina la frunza sa (stanga='0', dreapta='1').",
    explanation: `${G_NOTE} Pentru ca doua implementari independente sa construiasca EXACT acelasi arbore (si deci aceleasi coduri) atunci cand mai multe frecvente sunt egale, este esential un criteriu de departajare determinist si consistent (aici: identificatorul de nod, atribuit in ordinea crearii nodurilor); fara el, arbori la fel de optimi ca si cost, dar diferiti ca structura, ar putea produce coduri diferite.\n\n**Complexitate:** O(n log n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
struct Nod { long long freq; int id; int stanga = -1, dreapta = -1; int simbol = -1; };
int main() {
    int n; cin >> n;
    vector<string> simb(n);
    vector<long long> frecv(n);
    for (int i = 0; i < n; i++) cin >> simb[i] >> frecv[i];
    vector<Nod> nodes;
    for (int i = 0; i < n; i++) { Nod nd; nd.freq = frecv[i]; nd.id = i; nd.simbol = i; nodes.push_back(nd); }
    if (n == 1) { cout << simb[0] << " 0\\n"; return 0; }
    auto cmp = [&](int a, int b) {
        if (nodes[a].freq != nodes[b].freq) return nodes[a].freq > nodes[b].freq;
        return nodes[a].id > nodes[b].id;
    };
    priority_queue<int, vector<int>, decltype(cmp)> pq(cmp);
    for (int i = 0; i < n; i++) pq.push(i);
    int nextId = n;
    while ((int)pq.size() > 1) {
        int a = pq.top(); pq.pop();
        int b = pq.top(); pq.pop();
        Nod nd; nd.freq = nodes[a].freq + nodes[b].freq; nd.id = nextId++;
        nd.stanga = a; nd.dreapta = b;
        nodes.push_back(nd);
        pq.push(nd.id);
    }
    int root = pq.top();
    vector<string> cod(n);
    vector<pair<int,string>> stiva;
    stiva.push_back({root, ""});
    while (!stiva.empty()) {
        auto pr = stiva.back(); stiva.pop_back();
        int nd = pr.first; string cur = pr.second;
        if (nodes[nd].simbol != -1) { cod[nodes[nd].simbol] = cur; continue; }
        stiva.push_back({nodes[nd].stanga, cur + "0"});
        stiva.push_back({nodes[nd].dreapta, cur + "1"});
    }
    for (int i = 0; i < n; i++) cout << simb[i] << " " << cod[i] << "\\n";
    return 0;
}
`,
    py: `import heapq

n = int(input())
simb = []
frecv = []
for _ in range(n):
    s, f = input().split()
    simb.append(s)
    frecv.append(int(f))

if n == 1:
    print(f"{simb[0]} 0")
else:
    freq = frecv[:]
    stanga = [-1] * n
    dreapta = [-1] * n
    simbol = list(range(n))
    heap = [(freq[i], i) for i in range(n)]
    heapq.heapify(heap)
    nextId = n
    while len(heap) > 1:
        fa, a = heapq.heappop(heap)
        fb, b = heapq.heappop(heap)
        freq.append(fa + fb)
        stanga.append(a)
        dreapta.append(b)
        simbol.append(-1)
        heapq.heappush(heap, (fa + fb, nextId))
        nextId += 1
    root = heap[0][1]
    cod = [""] * n
    stiva = [(root, "")]
    while stiva:
        nd, cur = stiva.pop()
        if simbol[nd] != -1:
            cod[simbol[nd]] = cur
            continue
        stiva.append((stanga[nd], cur + "0"))
        stiva.append((dreapta[nd], cur + "1"))
    out = []
    for i in range(n):
        out.append(f"{simb[i]} {cod[i]}")
    print('\\n'.join(out))
`,
    tests: ["4\na 5\nb 9\nc 12\nd 13", "5\na 5\nb 9\nc 12\nd 13\ne 16", "3\nx 1\ny 1\nz 2", "2\nq 1\nr 100", "6\na 1\nb 1\nc 1\nd 1\ne 1\nf 1"],
  },
  {
    slug: "g-cost-minim-conectare-sfori",
    title: "Costul minim de conectare a unor sfori",
    difficulty: "medium",
    tags: ["greedy", "huffman"],
    statement: "Se citesc n sfori, de lungimi date. Costul de a lipi (uni) doua sfori intr-una singura este egal cu suma lungimilor lor. Determinati, folosind metoda Greedy, costul total minim necesar pentru a uni toate cele n sfori intr-una singura.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n lungimi.",
    output_format: "Se afiseaza un singur numar: costul total minim.",
    constraints: "1 <= n <= 100000, 1 <= lungime <= 10^9",
    hints: "Folositi un min-heap. La fiecare pas, extrageti cele doua cele mai scurte sfori disponibile, lipiti-le (adaugati costul la total) si introduceti sfoara rezultata inapoi in heap, repetand pana ramane o singura sfoara.",
    explanation: `${G_NOTE} Aceasta problema foloseste exact aceeasi strategie greedy ca si codificarea Huffman (uneste mereu cele doua elemente minime disponibile), aplicata insa lipirii sforilor in loc de combinarii frecventelor unui alfabet — este un exemplu clasic al tiparului general numit 'model optim de imbinare'.\n\n**Complexitate:** O(n log n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    priority_queue<long long, vector<long long>, greater<long long>> pq;
    for (int i = 0; i < n; i++) { long long f; cin >> f; pq.push(f); }
    long long total = 0;
    while (pq.size() > 1) {
        long long a = pq.top(); pq.pop();
        long long b = pq.top(); pq.pop();
        long long s = a + b;
        total += s;
        pq.push(s);
    }
    cout << total << "\\n";
    return 0;
}
`,
    py: `import heapq

n = int(input())
lungimi = list(map(int, input().split()))
heapq.heapify(lungimi)
total = 0
while len(lungimi) > 1:
    a = heapq.heappop(lungimi)
    b = heapq.heappop(lungimi)
    s = a + b
    total += s
    heapq.heappush(lungimi, s)
print(total)
`,
    tests: ["4\n4 3 2 6", "3\n1 8 3", "1\n50", "5\n1 2 3 4 5", "6\n1 1 1 1 1 1"],
  },

  // ===================== GRUPA 5: SCHEDULING / DIVERSE =====================
  {
    slug: "g-distributie-bomboane-rating",
    title: "Distribuirea de bomboane dupa rating",
    difficulty: "hard",
    tags: ["greedy"],
    statement: "Se citesc n copii asezati la rand, fiecare cu un rating. Fiecare copil trebuie sa primeasca cel putin o bomboana; un copil cu rating strict mai mare decat un vecin (stanga sau dreapta) trebuie sa primeasca strict mai multe bomboane decat acel vecin. Determinati, folosind metoda Greedy, numarul minim total de bomboane necesare.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n ratinguri.",
    output_format: "Se afiseaza un singur numar: numarul minim total de bomboane.",
    constraints: "1 <= n <= 100000, 0 <= rating <= 10^9",
    hints: "Faceti doua parcurgeri. In prima (de la stanga la dreapta), asigurati-va ca un copil cu rating mai mare decat vecinul din stanga primeste cu o bomboana mai mult decat acesta. In a doua (de la dreapta la stanga), faceti acelasi lucru relativ la vecinul din dreapta, pastrand maximul dintre cele doua cerinte pentru fiecare copil.",
    explanation: `${G_NOTE} Cele doua parcurgeri satisfac independent cate o constrangere directionala (fata de vecinul din stanga, respectiv din dreapta); pastrarea maximului celor doua valori pentru fiecare copil garanteaza satisfacerea simultana a ambelor constrangeri cu numarul minim de bomboane.\n\n**Complexitate:** O(n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> rating(n);
    for (auto& x : rating) cin >> x;
    vector<long long> bomboane(n, 1);
    for (int i = 1; i < n; i++) if (rating[i] > rating[i - 1]) bomboane[i] = bomboane[i - 1] + 1;
    for (int i = n - 2; i >= 0; i--) if (rating[i] > rating[i + 1]) bomboane[i] = max(bomboane[i], bomboane[i + 1] + 1);
    long long total = 0;
    for (auto x : bomboane) total += x;
    cout << total << "\\n";
    return 0;
}
`,
    py: `n = int(input())
rating = list(map(int, input().split()))
bomboane = [1] * n
for i in range(1, n):
    if rating[i] > rating[i - 1]:
        bomboane[i] = bomboane[i - 1] + 1
for i in range(n - 2, -1, -1):
    if rating[i] > rating[i + 1]:
        bomboane[i] = max(bomboane[i], bomboane[i + 1] + 1)
print(sum(bomboane))
`,
    tests: ["3\n1 0 2", "3\n1 2 2", "5\n1 3 4 5 2", "1\n5", "6\n1 2 3 4 5 6"],
  },
  {
    slug: "g-reorganizare-sir-fara-adiacente-egale",
    title: "Reorganizarea unui sir fara caractere adiacente egale",
    difficulty: "hard",
    tags: ["greedy"],
    statement: "Se citeste un sir format din litere mici. Rearanjati literele (folosind toate literele date, exact o data fiecare aparitie) astfel incat sa nu existe doua litere identice alaturate, folosind metoda Greedy: la fiecare pas alegeti litera cu frecventa ramasa cea mai mare dintre cele diferite de ultima litera plasata (la frecvente egale, alegeti litera mai mare din alfabet). Afisati sirul obtinut, sau IMPOSIBIL daca nu exista o astfel de rearanjare.",
    input_format: "Se citeste sirul de litere mici.",
    output_format: "Se afiseaza sirul rearanjat conform regulii Greedy descrise, sau IMPOSIBIL daca nu exista nicio rearanjare valida.",
    constraints: "1 <= lungimea sirului <= 100000",
    hints: "Folositi un max-heap continand perechile (frecventa, litera). La fiecare pas, extrageti litera cu prioritatea maxima, adaugati-o la rezultat, scadeti-i frecventa cu 1, apoi (daca litera plasata la pasul anterior mai are frecventa ramasa pozitiva) reintroduceti-o in heap, pentru a nu fi aleasa din nou imediat.",
    explanation: `${G_NOTE} Plasarea mereu a celei mai frecvente litere ramase (diferita de ultima plasata) 'consuma' cat mai repede literele care ar putea deveni problematice mai tarziu; problema are solutie daca si numai daca frecventa maxima nu depaseste (lungime+1)/2.\n\n**Complexitate:** O(lungime * log(alfabet))`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    int n = (int)s.size();
    map<char,int> cont;
    for (char c : s) cont[c]++;
    priority_queue<pair<int,char>> pq;
    for (auto& pr : cont) pq.push({pr.second, pr.first});
    string res;
    pair<int,char> prev = {0, '#'};
    while (!pq.empty()) {
        auto cur = pq.top(); pq.pop();
        res += cur.second;
        cur.first--;
        if (prev.first > 0) pq.push(prev);
        prev = cur;
    }
    if ((int)res.size() != n) cout << "IMPOSIBIL\\n"; else cout << res << "\\n";
    return 0;
}
`,
    py: `import heapq

s = input().strip()
n = len(s)
cont = {}
for ch in s:
    cont[ch] = cont.get(ch, 0) + 1
heap = [(-f, -ord(ch)) for ch, f in cont.items()]
heapq.heapify(heap)
res = []
prev = None
while heap:
    negf, negord = heapq.heappop(heap)
    f = -negf
    ch = chr(-negord)
    res.append(ch)
    f -= 1
    if prev is not None and prev[0] > 0:
        heapq.heappush(heap, (-prev[0], -ord(prev[1])))
    prev = (f, ch)
if len(res) != n:
    print("IMPOSIBIL")
else:
    print(''.join(res))
`,
    tests: ["aab", "aaab", "aaabbbcc", "a", "aaaa"],
  },
  {
    slug: "g-numar-minim-realimentari",
    title: "Numarul minim de opriri pentru realimentare",
    difficulty: "hard",
    tags: ["greedy"],
    statement: "O masina porneste din pozitia 0 cu o cantitate initiala de combustibil (exprimata in kilometri posibili de parcurs) si trebuie sa ajunga la o destinatie aflata la distanta D. Pe traseu exista n statii de realimentare, fiecare la o pozitie data, unde masina poate alimenta (o singura data) o cantitate data de combustibil, daca ajunge la acea statie. Determinati, folosind metoda Greedy, numarul minim de opriri pentru realimentare necesare pentru a ajunge la destinatie, sau -1 daca aceasta nu este posibila.",
    input_format: "Pe prima linie se citesc D, combustibilul initial si n. Urmeaza n linii, fiecare cu doua numere: pozitia unei statii si cantitatea de combustibil pe care o ofera.",
    output_format: "Se afiseaza un singur numar: numarul minim de opriri, sau -1 daca destinatia nu poate fi atinsa.",
    constraints: "1 <= n <= 100000, 0 <= combustibil initial, D <= 10^9, statiile sunt date in ordinea pozitiilor",
    hints: "Parcurgeti statiile in ordinea pozitiilor (si, la final, destinatia, ca o statie virtuala fara combustibil). Scadeti din rezervor distanta pana la urmatorul punct; daca rezervorul devine negativ, alimentati (virtual) folosind, pe rand, cea mai mare cantitate de combustibil trecuta si nefolosita inca (retinuta intr-un max-heap), pana cand rezervorul redevine nenegativ sau nu mai aveti optiuni.",
    explanation: `${G_NOTE} Alimentarea 'in avans' cu cea mai mare cantitate de combustibil disponibila dintre statiile deja trecute (chiar daca decizia efectiva de a opri acolo este luata retroactiv, doar atunci cand este cu adevarat necesara) este echivalenta cu a opri la statiile cele mai avantajoase, si minimizeaza numarul de opriri.\n\n**Complexitate:** O(n log n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long D, startFuel; int n;
    cin >> D >> startFuel >> n;
    vector<pair<long long,long long>> statii(n);
    for (auto& s : statii) cin >> s.first >> s.second;
    statii.push_back({D, 0});
    priority_queue<long long> heap;
    long long fuel = startFuel, prevPos = 0;
    int stops = 0;
    bool ok = true;
    for (auto& pr : statii) {
        long long pos = pr.first, amt = pr.second;
        fuel -= (pos - prevPos);
        while (fuel < 0 && !heap.empty()) { fuel += heap.top(); heap.pop(); stops++; }
        if (fuel < 0) { ok = false; break; }
        heap.push(amt);
        prevPos = pos;
    }
    cout << (ok ? stops : -1) << "\\n";
    return 0;
}
`,
    py: `import heapq

D, startFuel, n = map(int, input().split())
statii = []
for _ in range(n):
    p, a = map(int, input().split())
    statii.append((p, a))
statii.append((D, 0))
heap = []
fuel = startFuel
prevPos = 0
stops = 0
ok = True
for pos, amt in statii:
    fuel -= (pos - prevPos)
    while fuel < 0 and heap:
        fuel += -heapq.heappop(heap)
        stops += 1
    if fuel < 0:
        ok = False
        break
    heapq.heappush(heap, -amt)
    prevPos = pos
print(stops if ok else -1)
`,
    tests: [
      "100 10 4\n10 60\n20 30\n30 30\n60 40",
      "1 1 0",
      "100 1 1\n50 50",
      "200 50 3\n50 50\n100 50\n150 50",
      "10 10 0",
    ],
  },
  {
    slug: "g-statie-benzina-tur-complet",
    title: "Turul complet al statiilor de benzina",
    difficulty: "medium",
    tags: ["greedy"],
    statement: "Exista n statii de benzina asezate in cerc, numerotate de la 1 la n. Statia i ofera gas[i] combustibil, iar deplasarea de la statia i la statia urmatoare (i+1, sau de la n la 1) consuma cost[i] combustibil. Determinati, folosind metoda Greedy, indicele statiei de pornire din care, avand rezervorul initial gol, se poate parcurge tot circuitul o singura data in sensul dat, fara a ramane fara combustibil. Se garanteaza ca, daca exista, aceasta statie este unica.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n valori gas[i]. Pe a treia linie se citesc cele n valori cost[i].",
    output_format: "Se afiseaza indicele (numerotat de la 1) statiei de pornire, sau -1 daca nu exista o astfel de statie.",
    constraints: "1 <= n <= 100000, 0 <= gas[i], cost[i] <= 10^9",
    hints: "Daca suma totala a lui gas este mai mica decat suma totala a lui cost, nu exista solutie. Altfel, parcurgeti statiile mentinand un rezervor curent; de fiecare data cand acesta devine negativ, statia de pornire nu poate fi niciuna dintre cele parcurse pana acum, deci reincepeti de la statia urmatoare, cu rezervorul resetat la 0.",
    explanation: `${G_NOTE} Daca suma totala de combustibil este suficienta pentru intregul circuit, atunci exact o statie de pornire functioneaza; algoritmul o gaseste observand ca, daca rezervorul devine negativ pornind dintr-o anumita statie, niciuna dintre statiile parcurse pana acolo nu poate fi punctul de pornire corect (deoarece ar acumula acelasi deficit sau unul mai mare), deci se poate 'sari' direct la statia urmatoare drept noua ipoteza de pornire.\n\n**Complexitate:** O(n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> gas(n), cost(n);
    for (auto& x : gas) cin >> x;
    for (auto& x : cost) cin >> x;
    long long total = 0, tank = 0; int start = 0;
    for (int i = 0; i < n; i++) {
        long long diff = gas[i] - cost[i];
        total += diff; tank += diff;
        if (tank < 0) { start = i + 1; tank = 0; }
    }
    if (total < 0) cout << -1 << "\\n"; else cout << (start + 1) << "\\n";
    return 0;
}
`,
    py: `n = int(input())
gas = list(map(int, input().split()))
cost = list(map(int, input().split()))
total = 0
tank = 0
start = 0
for i in range(n):
    diff = gas[i] - cost[i]
    total += diff
    tank += diff
    if tank < 0:
        start = i + 1
        tank = 0
print(-1 if total < 0 else start + 1)
`,
    tests: ["5\n1 2 3 4 5\n3 4 5 1 2", "3\n2 3 4\n3 4 3", "1\n5\n4", "1\n4\n5", "4\n1 1 1 1\n1 1 1 2"],
  },
  {
    slug: "g-impartire-sir-bucati-maxime",
    title: "Impartirea unui sir in cat mai multe bucati",
    difficulty: "medium",
    tags: ["greedy"],
    statement: "Se citeste un sir de litere mici. Impartiti sirul in cat mai multe bucati (subsecvente contigue, consecutive) astfel incat fiecare litera din sir sa apara in cel mult o singura bucata (o litera care apare de mai multe ori in sir trebuie sa se afle in intregime in aceeasi bucata). Determinati, folosind metoda Greedy, lungimile bucatilor obtinute.",
    input_format: "Se citeste sirul de litere mici.",
    output_format: "Se afiseaza lungimile bucatilor obtinute, in ordine, separate prin spatiu.",
    constraints: "1 <= lungimea sirului <= 100000",
    hints: "Calculati, pentru fiecare litera, ultima ei pozitie de aparitie in sir. Parcurgeti sirul mentinand cel mai indepartat 'capat' necesar pentru litera curenta (dintre toate cele intalnite in bucata curenta); cand pozitia curenta atinge acest capat, o bucata se incheie.",
    explanation: `${G_NOTE} Extinderea capatului bucatii curente pana la cea mai indepartata aparitie a oricarei litere deja intalnite in acea bucata garanteaza ca nicio litera nu va mai aparea intr-o bucata ulterioara; inchiderea bucatii imediat ce este posibil maximizeaza numarul de bucati.\n\n**Complexitate:** O(lungime)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    int n = (int)s.size();
    vector<int> ultima(26, -1);
    for (int i = 0; i < n; i++) ultima[s[i] - 'a'] = i;
    vector<int> lungimi;
    int start = 0, capat = 0;
    for (int i = 0; i < n; i++) {
        capat = max(capat, ultima[s[i] - 'a']);
        if (i == capat) { lungimi.push_back(i - start + 1); start = i + 1; }
    }
    for (size_t i = 0; i < lungimi.size(); i++) cout << lungimi[i] << (i + 1 < lungimi.size() ? ' ' : '\\n');
    return 0;
}
`,
    py: `s = input().strip()
n = len(s)
ultima = [-1] * 26
for i in range(n):
    ultima[ord(s[i]) - 97] = i
lungimi = []
start = 0
capat = 0
for i in range(n):
    capat = max(capat, ultima[ord(s[i]) - 97])
    if i == capat:
        lungimi.append(i - start + 1)
        start = i + 1
print(' '.join(map(str, lungimi)))
`,
    tests: ["ababcbacadefegdehijhklij", "eccbbbbdec", "abc", "aaaa", "abcabc"],
  },
  {
    slug: "g-task-scheduler-racire",
    title: "Planificarea task-urilor cu perioada de racire",
    difficulty: "medium",
    tags: ["greedy"],
    statement: "Se citesc n task-uri (fiecare reprezentat printr-o litera indicand tipul sau) si un numar natural k. Intre doua executii ale task-urilor de ACELASI tip trebuie sa treaca cel putin k unitati de timp (CPU-ul poate ramane inactiv o unitate de timp daca niciun task nu poate fi executat in acel moment). Determinati, folosind metoda Greedy, numarul minim de unitati de timp necesare pentru a executa toate task-urile.",
    input_format: "Pe prima linie se citeste sirul de task-uri (litere mari). Pe a doua linie se citeste k.",
    output_format: "Se afiseaza un singur numar: numarul minim de unitati de timp necesare.",
    constraints: "1 <= lungimea sirului <= 100000, 0 <= k <= 100",
    hints: "Fie maxFrecventa frecventa maxima a oricarui tip de task, si numarMaxime cate tipuri de task au aceasta frecventa maxima. Raspunsul este maximul dintre numarul total de task-uri si (maxFrecventa-1)*(k+1) + numarMaxime.",
    explanation: `${G_NOTE} Task-urile cu frecventa maxima determina un 'schelet' de (maxFrecventa-1) intervale de lungime (k+1), care trebuie completate cu celelalte task-uri sau cu timpi de inactivitate; daca numarul total de task-uri depaseste acest schelet, timpul de inactivitate dispare complet si raspunsul este pur si simplu numarul de task-uri.\n\n**Complexitate:** O(lungime)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; long long k;
    cin >> s >> k;
    long long n = (long long)s.size();
    map<char,long long> cont;
    for (char c : s) cont[c]++;
    long long maxFrecventa = 0;
    for (auto& pr : cont) maxFrecventa = max(maxFrecventa, pr.second);
    long long numarMaxime = 0;
    for (auto& pr : cont) if (pr.second == maxFrecventa) numarMaxime++;
    long long rez = max(n, (maxFrecventa - 1) * (k + 1) + numarMaxime);
    cout << rez << "\\n";
    return 0;
}
`,
    py: `s = input().strip()
k = int(input())
n = len(s)
cont = {}
for c in s:
    cont[c] = cont.get(c, 0) + 1
maxFrecventa = max(cont.values())
numarMaxime = sum(1 for f in cont.values() if f == maxFrecventa)
rez = max(n, (maxFrecventa - 1) * (k + 1) + numarMaxime)
print(rez)
`,
    tests: ["AAABBB\n2", "AAAAA\n2", "AAABBB\n0", "ABCDEF\n2", "AAAABBBB\n2"],
  },

  // ===================== GRUPA 6: SORTARE-BAZATA =====================
  {
    slug: "g-cel-mai-mare-numar-concatenare",
    title: "Cel mai mare numar prin concatenare",
    difficulty: "medium",
    tags: ["greedy", "sortare"],
    statement: "Se citesc n numere naturale (posibil cu multe cifre). Determinati, folosind metoda Greedy, cel mai mare numar ce se poate forma concatenand (in orice ordine) cele n numere date.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere, ca siruri de cifre.",
    output_format: "Se afiseaza cel mai mare numar obtinut prin concatenare (fara zerouri nesemnificative, cu exceptia cazului in care rezultatul este 0).",
    constraints: "1 <= n <= 100000, fiecare numar are cel mult 20 de cifre, fara zerouri nesemnificative in reprezentarea de intrare",
    hints: "Sortati numerele (ca siruri de caractere) folosind un comparator personalizat: numarul a trebuie sa fie inaintea lui b daca concatenarea (a urmat de b) este mai mare decat concatenarea (b urmat de a).",
    explanation: `${G_NOTE} Comparatorul 'a+b > b+a' defineste o ordine totala care garanteaza, printr-un argument de schimb, ca aranjarea rezultata produce cea mai mare concatenare posibila: orice interschimbare a doua numere adiacente care nu respecta aceasta relatie ar putea fi doar la fel de buna sau mai rea, niciodata mai buna.\n\n**Complexitate:** O(n log n * L), unde L este lungimea maxima a unui numar`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<string> v(n);
    for (auto& s : v) cin >> s;
    sort(v.begin(), v.end(), [](const string& a, const string& b) { return a + b > b + a; });
    string rez;
    for (auto& s : v) rez += s;
    size_t p = rez.find_first_not_of('0');
    if (p == string::npos) cout << "0\\n"; else cout << rez.substr(p) << "\\n";
    return 0;
}
`,
    py: `import functools

n = int(input())
v = input().split()

def cmp(a, b):
    if a + b > b + a:
        return -1
    if a + b < b + a:
        return 1
    return 0

v.sort(key=functools.cmp_to_key(cmp))
rez = ''.join(v).lstrip('0')
print(rez if rez else "0")
`,
    tests: ["3\n3 30 34", "4\n54 546 548 60", "2\n0 0", "3\n1 12 121", "5\n9 91 910 9109 91099"],
  },
  {
    slug: "g-cel-mai-mic-numar-concatenare",
    title: "Cel mai mic numar prin concatenare",
    difficulty: "medium",
    tags: ["greedy", "sortare"],
    statement: "Se citesc n numere naturale strict pozitive (posibil cu multe cifre, fara zerouri nesemnificative). Determinati, folosind metoda Greedy, cel mai mic numar ce se poate forma concatenand (in orice ordine) cele n numere date.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere, ca siruri de cifre.",
    output_format: "Se afiseaza cel mai mic numar obtinut prin concatenare.",
    constraints: "1 <= n <= 100000, fiecare numar are cel mult 20 de cifre, fara zerouri nesemnificative, toate numerele sunt strict pozitive",
    hints: "Sortati numerele (ca siruri de caractere) folosind comparatorul: numarul a trebuie sa fie inaintea lui b daca concatenarea (a urmat de b) este mai mica decat concatenarea (b urmat de a).",
    explanation: `${G_NOTE} Este varianta simetrica a problemei 'cel mai mare numar prin concatenare', folosind comparatorul invers ('a+b < b+a'); deoarece toate numerele sunt strict pozitive si fara zerouri nesemnificative, rezultatul concatenarii nu poate incepe niciodata cu cifra 0.\n\n**Complexitate:** O(n log n * L), unde L este lungimea maxima a unui numar`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<string> v(n);
    for (auto& s : v) cin >> s;
    sort(v.begin(), v.end(), [](const string& a, const string& b) { return a + b < b + a; });
    string rez;
    for (auto& s : v) rez += s;
    cout << rez << "\\n";
    return 0;
}
`,
    py: `import functools

n = int(input())
v = input().split()

def cmp(a, b):
    if a + b < b + a:
        return -1
    if a + b > b + a:
        return 1
    return 0

v.sort(key=functools.cmp_to_key(cmp))
print(''.join(v))
`,
    tests: ["3\n3 30 34", "4\n54 546 548 60", "3\n1 12 121", "2\n21 2", "5\n9 91 910 9109 91099"],
  },
  {
    slug: "g-maximizare-suma-k-inversari",
    title: "Maximizarea sumei dupa K schimbari de semn",
    difficulty: "medium",
    tags: ["greedy"],
    statement: "Se citesc n numere intregi si un numar natural K. Puteti alege, de exact K ori, un element al vectorului si sa ii schimbati semnul (aceeasi pozitie poate fi aleasa de mai multe ori). Determinati, folosind metoda Greedy, suma maxima posibila a vectorului dupa exact K astfel de operatii.",
    input_format: "Pe prima linie se citesc n si K. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza un singur numar: suma maxima posibila.",
    constraints: "1 <= n <= 100000, 0 <= K <= 10^9, -1000 <= element <= 1000",
    hints: "Sortati crescator vectorul. Cat timp mai aveti operatii disponibile si exista elemente negative, schimbati semnul celui mai mic (mai negativ) element. Daca mai raman operatii dupa ce toate elementele au devenit nenegative, doar paritatea numarului de operatii ramase conteaza: daca este impar, schimbati semnul o singura data elementului cu valoarea absoluta minima.",
    explanation: `${G_NOTE} Schimbarea semnului celui mai negativ element creste suma cu cea mai mare cantitate posibila la fiecare pas; odata ce toate elementele sunt nenegative, orice pereche suplimentara de schimbari de semn asupra aceluiasi element se anuleaza reciproc, deci doar paritatea operatiilor ramase mai poate influenta rezultatul, iar pierderea este minimizata aplicand-o elementului cu cea mai mica valoare absoluta.\n\n**Complexitate:** O(n log n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; long long K;
    cin >> n >> K;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    sort(a.begin(), a.end());
    int i = 0;
    while (i < n && K > 0 && a[i] < 0) { a[i] = -a[i]; K--; i++; }
    long long suma = 0;
    for (auto x : a) suma += x;
    if (K % 2 == 1) {
        int idxMin = 0;
        for (int j = 1; j < n; j++) if (llabs(a[j]) < llabs(a[idxMin])) idxMin = j;
        suma -= 2 * a[idxMin];
    }
    cout << suma << "\\n";
    return 0;
}
`,
    py: `n, K = map(int, input().split())
a = list(map(int, input().split()))
a.sort()
i = 0
while i < n and K > 0 and a[i] < 0:
    a[i] = -a[i]
    K -= 1
    i += 1
suma = sum(a)
if K % 2 == 1:
    idxMin = 0
    for j in range(1, n):
        if abs(a[j]) < abs(a[idxMin]):
            idxMin = j
    suma -= 2 * a[idxMin]
print(suma)
`,
    tests: ["3 1\n-2 1 3", "5 2\n-1 -1 -1 -1 -1", "3 0\n-5 2 3", "4 5\n1 2 3 4", "1 3\n-4"],
  },
  {
    slug: "g-jump-game-posibil",
    title: "Se poate ajunge la finalul vectorului?",
    difficulty: "easy",
    tags: ["greedy"],
    statement: "Se citeste un vector cu n numere naturale, unde a[i] reprezinta lungimea maxima a saltului posibil din pozitia i (pozitiile sunt numerotate de la 0 la n-1). Determinati, folosind metoda Greedy, daca este posibil sa ajungeti de la pozitia 0 la ultima pozitie (n-1).",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza DA daca ultima pozitie este accesibila, respectiv NU in caz contrar.",
    constraints: "1 <= n <= 100000, 0 <= a[i] <= 100000",
    hints: "Parcurgeti vectorul mentinand cea mai indepartata pozitie accesibila pana in acel moment. Daca la un moment dat pozitia curenta depaseste aceasta limita, ultima pozitie nu mai poate fi atinsa.",
    explanation: `${G_NOTE} Mentinerea celei mai indepartate pozitii accesibile, actualizata la fiecare pas, este suficienta pentru a determina accesibilitatea oricarei pozitii, fara a fi nevoie sa se exploreze explicit toate saltuirile posibile.\n\n**Complexitate:** O(n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    long long maxReach = 0;
    bool ok = true;
    for (int i = 0; i < n; i++) {
        if (i > maxReach) { ok = false; break; }
        maxReach = max(maxReach, (long long)i + a[i]);
    }
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `n = int(input())
a = list(map(int, input().split()))
maxReach = 0
ok = True
for i in range(n):
    if i > maxReach:
        ok = False
        break
    maxReach = max(maxReach, i + a[i])
print("DA" if ok else "NU")
`,
    tests: ["5\n2 3 1 1 4", "5\n3 2 1 0 4", "1\n0", "4\n1 1 1 1", "3\n0 1 2"],
  },
  {
    slug: "g-jump-game-minim-salturi",
    title: "Numarul minim de salturi pana la finalul vectorului",
    difficulty: "medium",
    tags: ["greedy"],
    statement: "Se citeste un vector cu n numere naturale, unde a[i] reprezinta lungimea maxima a saltului posibil din pozitia i. Se garanteaza ca ultima pozitie este accesibila din pozitia 0. Determinati, folosind metoda Greedy, numarul minim de salturi necesare pentru a ajunge la ultima pozitie.",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza un singur numar: numarul minim de salturi necesare.",
    constraints: "1 <= n <= 100000, 0 <= a[i] <= 100000, ultima pozitie este garantat accesibila",
    hints: "Mentineti limita curenta a 'razei de actiune' a numarului actual de salturi si cea mai indepartata pozitie accesibila cu inca un salt suplimentar. Cand pozitia curenta atinge limita razei curente, un nou salt este obligatoriu, iar raza se extinde la cea mai indepartata pozitie gasita.",
    explanation: `${G_NOTE} Aceasta este o parcurgere 'pe niveluri' (similara unei parcurgeri in latime implicite): toate pozitiile accesibile cu exact k salturi sunt procesate impreuna, iar limita se extinde la cea mai indepartata pozitie accesibila cu k+1 salturi, garantand numarul minim de salturi.\n\n**Complexitate:** O(n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    long long farthest = 0, curEnd = 0; int jumps = 0;
    for (int i = 0; i < n - 1; i++) {
        farthest = max(farthest, (long long)i + a[i]);
        if (i == curEnd) { jumps++; curEnd = farthest; }
    }
    cout << jumps << "\\n";
    return 0;
}
`,
    py: `n = int(input())
a = list(map(int, input().split()))
farthest = 0
curEnd = 0
jumps = 0
for i in range(n - 1):
    farthest = max(farthest, i + a[i])
    if i == curEnd:
        jumps += 1
        curEnd = farthest
print(jumps)
`,
    tests: ["5\n2 3 1 1 4", "1\n0", "4\n1 1 1 1", "6\n2 3 0 1 4 2", "3\n2 1 1"],
  },

  // ===================== GRUPA 7: GRAFURI =====================
  {
    slug: "g-arbore-partial-minim-kruskal",
    title: "Arborele partial de cost minim (Kruskal)",
    difficulty: "hard",
    tags: ["greedy", "grafuri", "kruskal"],
    statement: "Se citeste un graf neorientat conex, cu n noduri si m muchii ponderate. Determinati, folosind metoda Greedy (algoritmul lui Kruskal), costul total minim al unui arbore partial de cost minim (APM) al grafului.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu trei numere: cele doua noduri (numerotate de la 1 la n) si costul muchiei dintre ele.",
    output_format: "Se afiseaza un singur numar: costul total minim al arborelui partial de cost minim.",
    constraints: "1 <= n <= 1000, n-1 <= m <= 10000, 1 <= cost <= 10^6, graful este conex",
    hints: "Sortati muchiile crescator dupa cost. Parcurgeti-le in aceasta ordine si adaugati o muchie la arbore doar daca cele doua noduri ale ei nu sunt deja in aceeasi componenta conexa (verificati si actualizati acest lucru folosind o structura de multimi disjuncte, cu compresie de drum).",
    explanation: `${G_NOTE} Alegerea greedy a celei mai ieftine muchii care nu formeaza un ciclu este demonstrabil optima (proprietatea taieturii minime): la fiecare pas, aceasta muchie este cea mai ieftina posibila care conecteaza doua componente altfel separate, deci trebuie sa faca parte dintr-un arbore partial de cost minim.\n\n**Complexitate:** O(m log m)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<int> tata, rangul;
int find(int x) { while (tata[x] != x) { tata[x] = tata[tata[x]]; x = tata[x]; } return x; }
bool unite(int a, int b) {
    a = find(a); b = find(b);
    if (a == b) return false;
    if (rangul[a] < rangul[b]) swap(a, b);
    tata[b] = a;
    if (rangul[a] == rangul[b]) rangul[a]++;
    return true;
}
int main() {
    int n, m; cin >> n >> m;
    vector<tuple<long long,int,int>> muchii(m);
    for (int i = 0; i < m; i++) {
        int a, b; long long c; cin >> a >> b >> c;
        muchii[i] = {c, a, b};
    }
    sort(muchii.begin(), muchii.end());
    tata.resize(n + 1); rangul.assign(n + 1, 0);
    for (int i = 1; i <= n; i++) tata[i] = i;
    long long total = 0;
    for (auto& mu : muchii) {
        long long c = get<0>(mu); int a = get<1>(mu), b = get<2>(mu);
        if (unite(a, b)) total += c;
    }
    cout << total << "\\n";
    return 0;
}
`,
    py: `def find(tata, x):
    while tata[x] != x:
        tata[x] = tata[tata[x]]
        x = tata[x]
    return x

def unite(tata, rangul, a, b):
    a, b = find(tata, a), find(tata, b)
    if a == b:
        return False
    if rangul[a] < rangul[b]:
        a, b = b, a
    tata[b] = a
    if rangul[a] == rangul[b]:
        rangul[a] += 1
    return True

n, m = map(int, input().split())
muchii = []
for _ in range(m):
    a, b, c = map(int, input().split())
    muchii.append((c, a, b))
muchii.sort()
tata = list(range(n + 1))
rangul = [0] * (n + 1)
total = 0
for c, a, b in muchii:
    if unite(tata, rangul, a, b):
        total += c
print(total)
`,
    tests: [
      "4 5\n1 2 1\n2 3 2\n3 4 3\n1 3 4\n2 4 5",
      "3 3\n1 2 1\n2 3 2\n1 3 3",
      "2 1\n1 2 7",
      "5 6\n1 2 2\n1 3 3\n2 3 1\n2 4 4\n3 5 5\n4 5 6",
      "6 8\n1 2 4\n1 3 3\n2 3 1\n2 4 2\n3 4 4\n3 5 5\n4 5 1\n4 6 6",
    ],
  },
  {
    slug: "g-numar-minim-muchii-conexiune",
    title: "Numarul minim de muchii pentru a face graful conex",
    difficulty: "medium",
    tags: ["greedy", "grafuri"],
    statement: "Se citeste un graf neorientat cu n noduri si m muchii (nu neaparat conex). Determinati, folosind metoda Greedy (uniune de multimi disjuncte), numarul minim de muchii care trebuie adaugate pentru a face graful conex.",
    input_format: "Pe prima linie se citesc n si m. Urmeaza m linii, fiecare cu doua numere reprezentand o muchie.",
    output_format: "Se afiseaza un singur numar: numarul minim de muchii de adaugat.",
    constraints: "1 <= n <= 100000, 0 <= m <= 100000",
    hints: "Uniti nodurile conectate prin muchiile existente, folosind o structura de multimi disjuncte. Numarul de componente conexe ramase, minus 1, reprezinta numarul minim de muchii de adaugat pentru a le uni pe toate intr-o singura componenta.",
    explanation: `${G_NOTE} Fiecare muchie adaugata poate uni cel mult doua componente conexe distincte intr-una singura; alegerea greedy de a uni mereu cate doua componente diferite (in loc sa se adauge muchii redundante in interiorul aceleiasi componente) este optima si necesita exact (numar_componente - 1) muchii.\n\n**Complexitate:** O((n+m) * alfa(n))`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<int> tata;
int find(int x) { while (tata[x] != x) { tata[x] = tata[tata[x]]; x = tata[x]; } return x; }
void unite(int a, int b) { a = find(a); b = find(b); if (a != b) tata[b] = a; }
int main() {
    int n, m; cin >> n >> m;
    tata.resize(n + 1);
    for (int i = 1; i <= n; i++) tata[i] = i;
    for (int i = 0; i < m; i++) { int a, b; cin >> a >> b; unite(a, b); }
    int componente = 0;
    for (int i = 1; i <= n; i++) if (find(i) == i) componente++;
    cout << (componente - 1) << "\\n";
    return 0;
}
`,
    py: `def find(tata, x):
    while tata[x] != x:
        tata[x] = tata[tata[x]]
        x = tata[x]
    return x

def unite(tata, a, b):
    a, b = find(tata, a), find(tata, b)
    if a != b:
        tata[b] = a

n, m = map(int, input().split())
tata = list(range(n + 1))
for _ in range(m):
    a, b = map(int, input().split())
    unite(tata, a, b)
componente = sum(1 for i in range(1, n + 1) if find(tata, i) == i)
print(componente - 1)
`,
    tests: ["4 2\n1 2\n3 4", "5 0", "6 3\n1 2\n2 3\n4 5", "1 0", "5 4\n1 2\n2 3\n3 4\n4 5"],
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
            "Sursa interna",
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
            "Sursa interna",
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
