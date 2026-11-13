const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const LEVEL = "bacalaureat";
const CHAPTER = { id: "bacalaureat-2021", name: "Bacalaureat 2021" };

function normalize(text) {
  return (text ?? "").trim().split(/\r?\n/).map((line) => line.trim()).join("\n");
}

async function runCustom(problemId, language, code, stdin) {
  const res = await fetch(`${API}/api/submissions/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problem_id: problemId, language, code, stdin, mode: "custom" }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`run failed: ${JSON.stringify(json)}`);
  return json.data;
}

// Fiecare problema: { slug, subcategoryId, title, statement, input_format, output_format, constraints,
//   difficulty, tags, hints, explanation, io: {input_source, input_filename, output_target, output_filename},
//   solution_mode: 'full'|'function', function_template_cpp, function_template_python,
//   cpp, py, tests, time_limit_ms, memory_limit_mb }

const SRC = "Bacalaureat Informatica MI 2021 (Ministerul Educatiei / CNPEE)";

const problems = [
  // ===================== SESIUNEA VARA 2021 =====================
  {
    slug: "bac-vara-2021-3-1",
    subcategoryId: "vara-2021",
    title: "Bacalaureat Vara 2021, S3.1 - Suma divizorilor primi la putere impara",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "vara", "subiectul3", "divizori", "numere-prime"],
    statement:
      "Subprogramul divPrim are doi parametri:\n" +
      "- n, prin care primeste un numar natural (n in [2, 10^9]);\n" +
      "- s, prin care furnizeaza suma divizorilor primi ai lui n care apar la o putere impara in descompunerea in factori primi a acestuia.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemple: pentru n=360, dupa apel s=7 (360=2^3*3^2*5^1, deci s=2+5), iar pentru n=16, dupa apel s=0.",
    input_format: "Se citeste de la tastatura numarul natural n.",
    output_format: "Se afiseaza valoarea s calculata de subprogram.",
    constraints: "2 <= n <= 10^9",
    hints:
      "Descompuneti n in factori primi prin impartiri repetate cu fiecare divizor d de la 2 in sus, cat timp d*d <= n; numarati de cate ori apare fiecare divizor (exponentul sau). Daca exponentul este impar, adaugati divizorul la suma s. La final, daca a mai ramas o valoare n > 1, aceasta este un factor prim la puterea 1 (impara), deci se adauga si ea la s.",
    explanation:
      "Se parcurg divizorii posibili d incepand de la 2; cat timp d*d <= n, se verifica daca d divide n, caz in care se numara exponentul sau (cate impartiri succesive prin d sunt posibile) si se elimina complet din n. Daca exponentul obtinut este impar, d se adauga la suma s. Dupa ce toti divizorii <= sqrt(n) au fost epuizati, daca a mai ramas n > 1, acesta este neaparat un divizor prim ce apare la puterea 1 in descompunerea originala (deci putere impara), asa ca se aduna si el la s.\n\n**Complexitate:** O(sqrt(n))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int n; cin >> n;
    int s;
    divPrim(n, s);
    cout << s << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
s = divPrim(n)
print(s)
`,
    cpp: `void divPrim(int n, int& s) {
    s = 0;
    for (long long d = 2; d * d <= n; d++) {
        if (n % d == 0) {
            int cnt = 0;
            while (n % d == 0) { n /= (int)d; cnt++; }
            if (cnt % 2 == 1) s += (int)d;
        }
    }
    if (n > 1) s += n;
}
`,
    py: `def divPrim(n):
    s = 0
    d = 2
    while d * d <= n:
        if n % d == 0:
            cnt = 0
            while n % d == 0:
                n //= d
                cnt += 1
            if cnt % 2 == 1:
                s += d
        d += 1
    if n > 1:
        s += n
    return s
`,
    tests: ["360", "16", "2", "999999937", "1000000000"],
    time_limit_ms: 2000,
  },
  {
    slug: "bac-vara-2021-3-2",
    subcategoryId: "vara-2021",
    title: "Bacalaureat Vara 2021, S3.2 - Primele k cuvinte terminate in vocala",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "vara", "subiectul3", "siruri-caractere"],
    statement:
      "Scrieti un program C/C++ care citeste de la tastatura doua numere naturale n si k, apoi n cuvinte, separate prin Enter. Fiecare cuvant este format din cel mult 10 caractere, numai litere mici ale alfabetului englez, iar numerele citite sunt din intervalul [1,20].\n\n" +
      "Programul afiseaza pe ecran, pe linii separate, primele k cuvinte dintre cele citite pentru care ultima litera este o vocala, sau doar mesajul nu exista daca nu exista k astfel de cuvinte. Se considera vocale literele a, e, i, o, u.\n\n" +
      "Exemplu: daca se citesc n=5, k=2 si cuvintele norii, cumulus, pluteau, pe, cer, se afiseaza pe ecran:\nnorii\npluteau",
    input_format: "Pe prima linie se citesc n si k. Urmeaza n linii, fiecare continand cate un cuvant.",
    output_format:
      "Daca exista cel putin k cuvinte cu ultima litera vocala, se afiseaza primele k dintre ele (in ordinea citirii), cate unul pe linie. Altfel, se afiseaza doar mesajul 'nu exista'.",
    constraints: "1 <= n,k <= 20, fiecare cuvant are cel mult 10 litere mici ale alfabetului englez",
    hints:
      "Parcurgeti cuvintele in ordinea citirii, verificati ultima litera a fiecaruia (cu ajutorul lungimii cuvantului) si numarati de cate ori ati gasit deja un cuvant potrivit; afisati-l imediat daca numarul gasit este cel mult k. Daca la final nu s-au gasit k cuvinte, afisati mesajul cerut.",
    explanation:
      "Se parcurg cele n cuvinte in ordinea citirii; pentru fiecare, se verifica daca ultima litera (aflata pe pozitia lungime-1) este una dintre a, e, i, o, u. Daca da, se afiseaza cuvantul imediat, cat timp inca nu s-au afisat k cuvinte. Daca dupa parcurgerea tuturor cuvintelor nu s-au gasit k cuvinte potrivite, se afiseaza mesajul 'nu exista' in locul oricarui rezultat partial (mesajul se afiseaza doar daca nu s-au gasit suficiente, nu suplimentar fata de cuvintele deja gasite).\n\n**Complexitate:** O(n)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, k; cin >> n >> k;
    vector<string> cuvinte(n);
    for (auto& c : cuvinte) cin >> c;
    string vocale = "aeiou";
    int gasite = 0;
    vector<string> rez;
    for (auto& c : cuvinte) {
        if (vocale.find(c.back()) != string::npos) {
            rez.push_back(c);
            gasite++;
            if (gasite == k) break;
        }
    }
    if ((int)rez.size() < k) cout << "nu exista\\n";
    else for (auto& c : rez) cout << c << "\\n";
    return 0;
}
`,
    py: `n, k = map(int, input().split())
cuvinte = [input().strip() for _ in range(n)]
vocale = set("aeiou")
rez = []
for c in cuvinte:
    if c[-1] in vocale:
        rez.append(c)
        if len(rez) == k:
            break
if len(rez) < k:
    print("nu exista")
else:
    print("\\n".join(rez))
`,
    tests: [
      "5 2\nnorii\ncumulus\npluteau\npe\ncer",
      "5 3\nnorii\ncumulus\npluteau\npe\ncer",
      "3 1\nabc\ndef\nghi",
      "1 1\na",
      "4 4\nala\nbala\nportocala\ncer",
    ],
  },
  {
    slug: "bac-vara-2021-3-3",
    subcategoryId: "vara-2021",
    title: "Bacalaureat Vara 2021, S3.3 - Ultimii doi termeni consecutivi cu sufix dat",
    difficulty: "hard",
    tags: ["bacalaureat", "2021", "vara", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Numarul natural a se numeste sufix al numarului natural b daca a este egal cu b sau daca b se poate obtine din a prin alipirea la stanga a unor noi cifre.\n\n" +
      "Fisierul bac.txt contine pe prima linie un numar natural x (x in [100,999]), iar pe a doua linie un sir de cel mult 10^5 numere naturale din intervalul [0,10^9]. Numerele din sir sunt separate prin cate un spatiu.\n\n" +
      "Se cere sa se afiseze pe ecran ultimii doi termeni ai sirului, aflati pe pozitii consecutive in acesta, care il au drept sufix pe numarul x. Numerele sunt afisate in ordinea in care apar in sir, separate printr-un spatiu, iar daca nu exista doi astfel de termeni, se afiseaza pe ecran mesajul nu exista. Proiectati un algoritm eficient din punctul de vedere al memoriei utilizate si al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine numerele\n210\n3445 210 893210 1245 1210 3210 15210 67120 20210 12\n" +
      "atunci pe ecran se afiseaza 3210 15210",
    input_format: "Fisierul bac.txt: pe prima linie x, pe a doua linie sirul de numere.",
    output_format:
      "Se afiseaza ultimii doi termeni consecutivi ai sirului care au x ca sufix, separati printr-un spatiu, sau mesajul 'nu exista' daca nu exista o astfel de pereche.",
    constraints: "100 <= x <= 999, cel mult 10^5 termeni in sir, fiecare in [0, 10^9]",
    hints:
      "Nu memorati intregul sir. Parcurgeti-l o singura data, retinand doar termenul curent, termenul anterior si daca acesta din urma avea x ca sufix; de fiecare data cand gasiti doi termeni consecutivi cu proprietatea, actualizati perechea-raspuns (ultima gasita ramane cea corecta la final).",
    explanation:
      "Un algoritm eficient citeste sirul termen cu termen (fara sa il stocheze integral), pastrand doar valoarea anterioara (ant) si daca aceasta avea x ca sufix. La fiecare pas se verifica daca termenul curent (crt) si cel anterior (ant) au amandoi x ca sufix (verificat prin crt % 1000 == x, respectiv ant % 1000 == x, deoarece x are exact 3 cifre); daca da, perechea (ant, crt) devine noul candidat de raspuns, suprascriind orice candidat anterior (astfel se retine automat ULTIMA astfel de pereche gasita). La final, daca s-a gasit vreo pereche, se afiseaza; altfel, mesajul 'nu exista'.\n\n**Complexitate:** O(n) timp, O(1) memorie suplimentara (in afara sirului citit)",
    io: { input_source: "file", input_filename: "bac.txt", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.txt", "r", stdin);
    long long x; cin >> x;
    long long crt, ant;
    bool hasAnt = false, antOk = false;
    long long pu = -1, u = -1;
    while (cin >> crt) {
        bool crtOk = (crt % 1000 == x);
        if (hasAnt && antOk && crtOk) { pu = ant; u = crt; }
        ant = crt; antOk = crtOk; hasAnt = true;
    }
    if (pu == -1) cout << "nu exista\\n";
    else cout << pu << " " << u << "\\n";
    return 0;
}
`,
    py: `with open("bac.txt") as f:
    x = int(f.readline())
    rest = f.readline().split()
pu, u = -1, -1
has_ant = False
ant_ok = False
ant = 0
for tok in rest:
    crt = int(tok)
    crt_ok = (crt % 1000 == x)
    if has_ant and ant_ok and crt_ok:
        pu, u = ant, crt
    ant, ant_ok, has_ant = crt, crt_ok, True
if pu == -1:
    print("nu exista")
else:
    print(pu, u)
`,
    tests: [
      "210\n3445 210 893210 1245 1210 3210 15210 67120 20210 12",
      "999\n1 2 3",
      "100\n100 200 100 100",
      "555\n555 1555 2555 3",
      (() => {
        const x = 777;
        const n = 25000;
        const parts = [String(x)];
        const seq = [];
        for (let i = 0; i < n; i++) {
          if (i === n - 5) seq.push(4777);
          else if (i === n - 4) seq.push(9777);
          else seq.push((i % 37) + 1);
        }
        parts.push(seq.join(" "));
        return parts.join("\n");
      })(),
    ],
  },
  // ===================== MODEL 2021 =====================
  {
    slug: "bac-model-2021-3-1",
    subcategoryId: "model-2021",
    title: "Bacalaureat Model 2021, S3.1 - Cele mai mari doua numere prime sub n",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "model", "subiectul3", "numere-prime"],
    statement:
      "Subprogramul prime are trei parametri:\n" +
      "- n, prin care primeste un numar natural (n in [4, 10^9]);\n" +
      "- x si y, prin care furnizeaza cele mai mari doua numere prime din intervalul [1,n), x<y.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=49, in urma apelului x=43, y=47.",
    input_format: "Se citeste de la tastatura numarul natural n.",
    output_format: "Se afiseaza x si y (in aceasta ordine), separate printr-un spatiu.",
    constraints: "4 <= n <= 10^9",
    hints:
      "Cautati de la n-1 in jos, verificand primalitatea fiecarui candidat prin impartiri de proba pana la radacina sa patrata, pana gasiti doua numere prime.",
    explanation:
      "Se parcurg valorile v = n-1, n-2, ... in ordine descrescatoare, testand primalitatea fiecareia (impartire de proba pana la sqrt(v)), pana se gasesc doua numere prime. Deoarece decalajele dintre numere prime consecutive sub 10^9 sunt mici, aceasta cautare este rapida in practica. Primul numar prim gasit (cel mai apropiat de n) este y (cel mai mare), al doilea gasit este x.\n\n**Complexitate:** O(gap * sqrt(n)) in practica, unde gap este decalajul pana la al doilea numar prim gasit",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    time_limit_ms: 3000,
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int n; cin >> n;
    int x, y;
    prime(n, x, y);
    cout << x << " " << y << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
x, y = prime(n)
print(x, y)
`,
    cpp: `bool esteprim(long long v) {
    if (v < 2) return false;
    for (long long d = 2; d * d <= v; d++) if (v % d == 0) return false;
    return true;
}
void prime(int n, int& x, int& y) {
    long long gasite[2]; int cnt = 0;
    for (long long v = n - 1; v >= 2 && cnt < 2; v--) {
        if (esteprim(v)) gasite[cnt++] = v;
    }
    y = (int)gasite[0];
    x = (int)gasite[1];
}
`,
    py: `def esteprim(v):
    if v < 2:
        return False
    d = 2
    while d * d <= v:
        if v % d == 0:
            return False
        d += 1
    return True

def prime(n):
    gasite = []
    v = n - 1
    while v >= 2 and len(gasite) < 2:
        if esteprim(v):
            gasite.append(v)
        v -= 1
    return gasite[1], gasite[0]
`,
    tests: ["49", "4", "100", "1000000000", "997"],
  },
  {
    slug: "bac-model-2021-3-2",
    subcategoryId: "model-2021",
    title: "Bacalaureat Model 2021, S3.2 - Tablou cu patrate perfecte pare descrescatoare",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "model", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Scrieti un program C/C++ care citeste de la tastatura doua numere naturale din intervalul [2,10^2], m si n, si construieste in memorie un tablou bidimensional cu m linii si n coloane, cu proprietatea ca parcurgandu-l linie cu linie de sus in jos si fiecare linie de la stanga la dreapta, se obtine sirul primelor m*n patrate perfecte pare, ordonat strict descrescator.\n\n" +
      "Elementele tabloului obtinut se afiseaza pe ecran, fiecare linie a tabloului pe cate o linie a ecranului, valorile de pe aceeasi linie fiind separate prin cate un spatiu.\n\n" +
      "Exemplu: pentru m=2, n=3 se obtine tabloul\n100 64 36\n16 4 0",
    input_format: "Se citesc de la tastatura m si n.",
    output_format: "Se afiseaza tabloul obtinut, cate o linie a tabloului pe fiecare linie a ecranului.",
    constraints: "2 <= m, n <= 100",
    hints:
      "Patratele perfecte pare sunt (2k)^2 pentru k=0,1,2,... . Sirul cerut, ordonat descrescator, are m*n termeni: (2*(cnt-1))^2, (2*(cnt-2))^2, ..., (2*1)^2, 0, unde cnt=m*n. Elementul de pe pozitia (linie i, coloana j), 0-indexate, este al (i*n+j)-lea termen al acestui sir.",
    explanation:
      "Sirul patratelor perfecte pare in ordine crescatoare este 0,4,16,36,...,(2k)^2,... . Cerinta il vrea insa descrescator, deci al i-lea element (0-indexat) din sirul descrescator de cnt=m*n termeni este (2*(cnt-1-i))^2. Se calculeaza direct aceasta formula pentru fiecare pozitie din tablou, parcurs linie cu linie, fara a mai fi nevoie de generare/sortare separata.\n\n**Complexitate:** O(m*n)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long m, n; cin >> m >> n;
    long long cnt = m * n;
    for (long long i = 0; i < m; i++) {
        for (long long j = 0; j < n; j++) {
            long long idx = i * n + j;
            long long k = cnt - 1 - idx;
            long long val = (2 * k) * (2 * k);
            cout << val << (j + 1 < n ? " " : "\\n");
        }
    }
    return 0;
}
`,
    py: `m, n = map(int, input().split())
cnt = m * n
for i in range(m):
    row = []
    for j in range(n):
        idx = i * n + j
        k = cnt - 1 - idx
        row.append(str((2 * k) ** 2))
    print(" ".join(row))
`,
    tests: ["2 3", "2 2", "3 3", "100 100", "2 100"],
  },
  {
    slug: "bac-model-2021-3-3",
    subcategoryId: "model-2021",
    title: "Bacalaureat Model 2021, S3.3 - Suma maxima cheltuita pe tip de produs",
    difficulty: "hard",
    tags: ["bacalaureat", "2021", "model", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Fisierul cheltuieli.in are cel mult 10^6 linii, fiecare linie continand cate trei numere naturale din intervalul [1,10^2], reprezentand, in aceasta ordine, date despre cate o achizitie: tipul produsului cumparat, numarul de produse de acest tip cumparate, respectiv pretul unui astfel de produs la acel moment. Numerele aflate pe aceeasi linie sunt separate prin cate un spatiu.\n\n" +
      "Se cere sa se afiseze pe ecran cea mai mare suma cheltuita pentru toate produsele de acelasi tip, precum si numarul de tipuri de produse pentru care s-a obtinut aceasta suma. Proiectati un algoritm eficient din punctul de vedere al timpului de executare.\n\n" +
      "Exemplu: daca fisierul cheltuieli.in are continutul\n4 1 10\n1 16 1\n4 2 8\n2 1 5\n1 5 2\n" +
      "se afiseaza pe ecran: 26 2\n(s-a cheltuit suma maxima 26 pentru produsele de tipul 1 si 4: 26=16*1+5*2=1*10+2*8)",
    input_format: "Fisierul cheltuieli.in: pe fiecare linie, tip, cantitate, pret.",
    output_format: "Se afiseaza suma maxima cheltuita pentru un tip de produs, urmata de numarul de tipuri care ating acest maxim, separate printr-un spatiu.",
    constraints: "cel mult 10^6 linii, tip/cantitate/pret in [1, 100]",
    hints:
      "Tipurile de produse sunt numere din [1,100], deci putin la numar: folositi un vector suma[1..100] pe care il actualizati direct (suma[tip] += cantitate*pret) pe masura ce cititi fiecare linie, fara sa stocati toate liniile.",
    explanation:
      "Deoarece tipul de produs ia doar 100 de valori posibile, se poate mentine un vector auxiliar de numai 100 de elemente, suma[], actualizat direct in timpul citirii fiecarei linii din fisier (suma[tip] += cantitate*pret), intr-o singura trecere O(n). La final se parcurge acest vector mic pentru a determina valoarea maxima si de cate ori este atinsa.\n\n**Complexitate:** O(n + 100), unde n este numarul de linii din fisier",
    io: { input_source: "file", input_filename: "cheltuieli.in", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 3000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("cheltuieli.in", "r", stdin);
    vector<long long> suma(101, 0);
    int tip, cant, pret;
    while (cin >> tip >> cant >> pret) suma[tip] += (long long)cant * pret;
    long long best = 0; int cntBest = 0;
    for (int t = 1; t <= 100; t++) {
        if (suma[t] > best) { best = suma[t]; cntBest = 1; }
        else if (suma[t] == best && suma[t] > 0) cntBest++;
    }
    cout << best << " " << cntBest << "\\n";
    return 0;
}
`,
    py: `import sys
suma = [0] * 101
with open("cheltuieli.in") as f:
    data = f.read().split()
for i in range(0, len(data), 3):
    tip = int(data[i]); cant = int(data[i + 1]); pret = int(data[i + 2])
    suma[tip] += cant * pret
best = 0
cnt_best = 0
for t in range(1, 101):
    if suma[t] > best:
        best = suma[t]
        cnt_best = 1
    elif suma[t] == best and suma[t] > 0:
        cnt_best += 1
print(best, cnt_best)
`,
    tests: [
      "4 1 10\n1 16 1\n4 2 8\n2 1 5\n1 5 2",
      "1 1 1",
      "1 100 100\n2 100 100",
      "1 5 5\n2 5 5\n3 5 5",
      (() => {
        const lines = [];
        for (let i = 0; i < 20000; i++) {
          const tip = (i % 100) + 1;
          lines.push(`${tip} 1 1`);
        }
        lines.push("100 100 100");
        return lines.join("\n");
      })(),
    ],
  },
  // ===================== SIMULARE 2021 =====================
  {
    slug: "bac-simulare-2021-3-1",
    subcategoryId: "simulare-2021",
    title: "Bacalaureat Simulare 2021, S3.1 - Divizorul prim la puterea minima",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "simulare", "subiectul3", "numere-prime"],
    statement:
      "Subprogramul putere are un parametru, n, prin care primeste un numar natural (n in [2,10^9]). Subprogramul returneaza numarul prim care apare la puterea cea mai mica in descompunerea in factori primi a lui n. Daca sunt mai multe astfel de numere, se returneaza cel mai mic dintre acestea.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=880, subprogramul returneaza numarul 5 (880=2^4*5^1*11^1).",
    input_format: "Se citeste de la tastatura numarul natural n.",
    output_format: "Se afiseaza valoarea returnata de subprogram.",
    constraints: "2 <= n <= 10^9",
    hints:
      "Descompuneti n in factori primi, retinand pentru fiecare divizor gasit exponentul sau; urmariti divizorul cu exponentul minim intalnit pana la fiecare pas, iar la exponenti egali pastrati-l pe cel mai mic divizor.",
    explanation:
      "Se descompune n in factori primi prin impartiri repetate cu fiecare divizor d incepand de la 2 (cat timp d*d <= n), numarand exponentul fiecaruia; daca la final a mai ramas n > 1, acesta este un factor prim cu exponentul 1. Pe parcurs se retine divizorul cu exponentul cel mai mic gasit pana in acel moment (la egalitate de exponent, se pastreaza cel mai mic divizor, ceea ce este garantat automat daca divizorii sunt procesati in ordine crescatoare si actualizarea 'cel mai bun' se face doar la o imbunatatire STRICTA a exponentului minim).\n\n**Complexitate:** O(sqrt(n))",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int n; cin >> n;
    cout << putere(n) << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
print(putere(n))
`,
    cpp: `int putere(int n) {
    int bestDiv = -1, bestExp = 2000000000;
    for (long long d = 2; d * d <= n; d++) {
        if (n % d == 0) {
            int cnt = 0;
            while (n % d == 0) { n /= (int)d; cnt++; }
            if (cnt < bestExp) { bestExp = cnt; bestDiv = (int)d; }
        }
    }
    if (n > 1) {
        if (1 < bestExp) { bestExp = 1; bestDiv = n; }
    }
    return bestDiv;
}
`,
    py: `def putere(n):
    best_div, best_exp = -1, float('inf')
    d = 2
    while d * d <= n:
        if n % d == 0:
            cnt = 0
            while n % d == 0:
                n //= d
                cnt += 1
            if cnt < best_exp:
                best_exp, best_div = cnt, d
        d += 1
    if n > 1:
        if 1 < best_exp:
            best_exp, best_div = 1, n
    return best_div
`,
    tests: ["880", "2", "1000000000", "999999937", "64"],
  },
  {
    slug: "bac-simulare-2021-3-2",
    subcategoryId: "simulare-2021",
    title: "Bacalaureat Simulare 2021, S3.2 - Deplasare circulara pe o linie a tabloului",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "simulare", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Scrieti un program C/C++ care citeste de la tastatura numere naturale, in aceasta ordine: n (n in [2,20]), apoi n*n numere din intervalul [0,10^2], elemente ale unui tablou bidimensional cu n linii si n coloane, iar la final valoarea k (k in [2,n]); programul transforma tabloul in memorie, prin deplasarea circulara spre dreapta, cu cate o pozitie, a tuturor valorilor aflate pe linia a k-a, in stanga diagonalei principale.\n\n" +
      "Elementele tabloului obtinut sunt afisate pe ecran, linie cu linie, fiecare linie pe cate o linie a ecranului, cu elementele fiecarei linii separate prin cate un spatiu.",
    input_format: "Se citesc n, apoi n*n elemente ale tabloului (linie cu linie), apoi k.",
    output_format: "Se afiseaza tabloul transformat, o linie a tabloului pe fiecare linie a ecranului.",
    constraints: "2 <= n <= 20, 0 <= elemente <= 100, 2 <= k <= n",
    hints:
      "Elementele din stanga diagonalei principale de pe linia k sunt cele de pe coloanele 1..k-1 (1-indexat). O deplasare circulara la dreapta cu o pozitie inseamna ca ultimul element al acestei secvente devine primul, iar restul se muta cu o pozitie mai la dreapta.",
    explanation:
      "Pe linia k (1-indexata), elementele situate strict la stanga diagonalei principale sunt cele de pe coloanele 1,2,...,k-1. O deplasare circulara la dreapta cu o pozitie a acestei secvente muta ultimul element (de pe coloana k-1) pe prima pozitie (coloana 1), iar fiecare dintre celelalte elemente se muta cu o coloana mai la dreapta. Restul tabloului (inclusiv diagonala si partea dreapta) ramane neschimbat.\n\n**Complexitate:** O(n^2)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<vector<int>> a(n + 1, vector<int>(n + 1));
    for (int i = 1; i <= n; i++) for (int j = 1; j <= n; j++) cin >> a[i][j];
    int k; cin >> k;
    if (k >= 2) {
        int last = a[k][k - 1];
        for (int j = k - 1; j >= 2; j--) a[k][j] = a[k][j - 1];
        a[k][1] = last;
    }
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) cout << a[i][j] << (j < n ? " " : "\\n");
    }
    return 0;
}
`,
    py: `n = int(input())
a = [[0] * (n + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    row = list(map(int, input().split()))
    for j in range(1, n + 1):
        a[i][j] = row[j - 1]
k = int(input())
last = a[k][k - 1]
for j in range(k - 1, 1, -1):
    a[k][j] = a[k][j - 1]
a[k][1] = last
for i in range(1, n + 1):
    print(" ".join(str(a[i][j]) for j in range(1, n + 1)))
`,
    tests: [
      "6\n0 1 4 5 3 2\n0 6 0 7 5 0\n4 0 0 6 0 6\n2 0 0 5 0 0\n3 0 6 4 0 8\n0 6 9 0 0 0\n5",
      "2\n1 2\n3 4\n2",
      "3\n1 2 3\n4 5 6\n7 8 9\n3",
      "3\n1 2 3\n4 5 6\n7 8 9\n2",
      "4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16\n4",
    ],
  },
  {
    slug: "bac-simulare-2021-3-3",
    subcategoryId: "simulare-2021",
    title: "Bacalaureat Simulare 2021, S3.3 - Costul total al elementelor grafice",
    difficulty: "hard",
    tags: ["bacalaureat", "2021", "simulare", "subiectul3", "eficienta", "fisiere"],
    statement:
      "La proiectarea unui site web se utilizeaza elemente grafice realizate pe baza unor modele. Fiecare model este de forma patrata si oricare doua modele distincte au dimensiuni diferite ale laturilor. Toate elementele grafice realizate pe baza unui anumit model au aceeasi forma si aceleasi dimensiuni ca ale acestuia. Pentru fiecare model dintre cele utilizate se plateste o taxa unica de proiectare, de 10 lei, iar pentru fiecare element grafic realizat pe baza acelui model se plateste o suma in lei, egala cu valoarea suprafetei acestuia (aria patratului), calculata in centimetri patrati.\n\n" +
      "Fisierul bac.in contine un sir de cel mult 10^6 numere naturale din intervalul [1,10], separate prin cate un spatiu, reprezentand dimensiunile laturilor tuturor elementelor grafice utilizate, date in centimetri; fiecare termen al sirului corespunde unui element grafic distinct. Se cere sa se afiseze pe ecran suma totala platita pentru asigurarea elementelor grafice necesare. Proiectati un algoritm eficient din punctul de vedere al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine numerele 1 7 2 1 1 2 1 7 2 se afiseaza pe ecran valoarea 144.",
    input_format: "Fisierul bac.in: un sir de numere naturale din [1,10], separate prin spatiu.",
    output_format: "Se afiseaza suma totala platita.",
    constraints: "cel mult 10^6 termeni in sir, fiecare in [1,10]",
    hints:
      "Dimensiunile posibile sunt doar 1..10: numarati, folosind un vector de numai 10 elemente, de cate ori apare fiecare dimensiune; pentru fiecare dimensiune care apare macar o data, adaugati 10 (taxa) plus numar_aparitii*dimensiune^2 la suma totala.",
    explanation:
      "Deoarece laturile posibile sunt doar 1..10, se numara aparitiile fiecarei dimensiuni intr-un vector de 10 elemente, printr-o singura trecere prin fisier. Pentru fiecare dimensiune d care a aparut de cel putin o data, se adauga la totalul platit 10 lei (taxa unica de proiectare) plus cnt[d]*d^2 lei (suma platita pentru toate elementele grafice de acea dimensiune).\n\n**Complexitate:** O(n + 10), unde n este numarul de elemente din fisier",
    io: { input_source: "file", input_filename: "bac.in", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 3000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    freopen("bac.in", "r", stdin);
    vector<long long> cnt(11, 0);
    int v;
    while (cin >> v) cnt[v]++;
    long long total = 0;
    for (int d = 1; d <= 10; d++) {
        if (cnt[d] > 0) total += 10 + cnt[d] * (long long)d * d;
    }
    cout << total << "\\n";
    return 0;
}
`,
    py: `cnt = [0] * 11
with open("bac.in") as f:
    data = f.read().split()
for tok in data:
    cnt[int(tok)] += 1
total = 0
for d in range(1, 11):
    if cnt[d] > 0:
        total += 10 + cnt[d] * d * d
print(total)
`,
    tests: [
      "1 7 2 1 1 2 1 7 2",
      "1",
      "10 10 10",
      "1 2 3 4 5 6 7 8 9 10",
      (() => {
        const parts = [];
        for (let i = 0; i < 70000; i++) parts.push(String((i % 10) + 1));
        return parts.join(" ");
      })(),
    ],
  },
  // ===================== SESIUNE SPECIALA 2021 =====================
  {
    slug: "bac-speciala-2021-3-1",
    subcategoryId: "speciala-2021",
    title: "Bacalaureat Sesiune Speciala 2021, S3.1 - Numere impar-oglindite",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "speciala", "subiectul3", "cifre"],
    statement:
      "Doua numere se numesc oglindite daca fiecare se obtine din celalalt, prin parcurgerea cifrelor acestuia de la dreapta la stanga. Doua numere se numesc impar-oglindite daca numerele obtinute din acestea, prin indepartarea tuturor cifrelor lor pare, sunt oglindite.\n\n" +
      "Subprogramul imog are trei parametri:\n" +
      "- x si y, prin care primeste cate un numar natural din intervalul [0,10^9];\n" +
      "- rez, prin care furnizeaza valoarea 1 daca x si y sunt impar-oglindite sau valoarea 0 in caz contrar.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemple: daca x=523 si y=84356, dupa apel rez=1, iar daca x=523 si y=84536 sau x=523 si y=84576 sau x=40 si y=86, dupa apel rez=0.",
    input_format: "Se citesc de la tastatura x si y.",
    output_format: "Se afiseaza valoarea rez calculata de subprogram.",
    constraints: "0 <= x, y <= 10^9",
    hints:
      "Extrageti cifrele impare (in ordinea aparitiei, de la stanga la dreapta) ale lui x, apoi ale lui y. Doua numere sunt impar-oglindite daca sirul de cifre impare al lui x, citit invers, este identic cu sirul de cifre impare al lui y. Daca vreunul dintre siruri este vid, raspunsul este 0.",
    explanation:
      "Se construieste, pentru fiecare dintre x si y, sirul cifrelor sale impare, in ordinea in care apar de la stanga la dreapta (se poate obtine extragand cifrele de la dreapta la stanga -- prin resturi succesive la impartirea cu 10 -- si inversand rezultatul, sau construind direct sirul prin inserare la inceput). Cele doua numere sunt impar-oglindite daca sirul cifrelor impare ale lui x, parcurs de la dreapta la stanga, coincide exact cu sirul cifrelor impare ale lui y; daca oricare dintre cele doua siruri este vid (numarul nu are nicio cifra impara), raspunsul este 0, chiar daca ambele siruri ar fi vide.\n\n**Complexitate:** O(numar de cifre)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    long long x, y; cin >> x >> y;
    int rez;
    imog(x, y, rez);
    cout << rez << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

x, y = map(int, input().split())
print(imog(x, y))
`,
    cpp: `vector<int> cifreImpare(long long n) {
    vector<int> rev;
    if (n == 0) { if (0 % 2 == 1) rev.push_back(0); return rev; }
    while (n > 0) { int c = n % 10; if (c % 2 == 1) rev.push_back(c); n /= 10; }
    reverse(rev.begin(), rev.end());
    return rev;
}
void imog(long long x, long long y, int& rez) {
    vector<int> cx = cifreImpare(x);
    vector<int> cy = cifreImpare(y);
    if (cx.empty() || cy.empty()) { rez = 0; return; }
    vector<int> cxRev(cx.rbegin(), cx.rend());
    rez = (cxRev == cy) ? 1 : 0;
}
`,
    py: `def cifre_impare(n):
    if n == 0:
        return []
    rev = []
    while n > 0:
        c = n % 10
        if c % 2 == 1:
            rev.append(c)
        n //= 10
    rev.reverse()
    return rev

def imog(x, y):
    cx = cifre_impare(x)
    cy = cifre_impare(y)
    if not cx or not cy:
        return 0
    return 1 if list(reversed(cx)) == cy else 0
`,
    tests: ["523 84356", "523 84536", "523 84576", "40 86", "0 0"],
  },
  {
    slug: "bac-speciala-2021-3-2",
    subcategoryId: "speciala-2021",
    title: "Bacalaureat Sesiune Speciala 2021, S3.2 - Interschimbare triunghi linie/coloana",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "speciala", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Scrieti un program C/C++ care citeste de la tastatura numere naturale: n (n in [2,20]), k (k in [2,n]) si n*n numere din intervalul [0,10^9], elemente ale unui tablou bidimensional cu n linii si n coloane. Programul transforma tabloul in memorie, interschimband sirul elementelor situate pe linia a k-a, in stanga diagonalei principale, parcurse de la stanga la dreapta, cu sirul elementelor situate pe coloana a k-a, deasupra diagonalei principale, parcurse de sus in jos.\n\n" +
      "Elementele tabloului obtinut sunt afisate pe ecran, fiecare linie pe cate o linie a ecranului, cu elementele fiecarei linii separate prin cate un spatiu.",
    input_format: "Se citesc n, k, apoi n*n elemente ale tabloului (linie cu linie).",
    output_format: "Se afiseaza tabloul transformat, o linie a tabloului pe fiecare linie a ecranului.",
    constraints: "2 <= n <= 20, 2 <= k <= n, 0 <= elemente <= 10^9",
    hints:
      "Ambele siruri (linia k la stanga diagonalei, coloana k deasupra diagonalei) au aceeasi lungime k-1. Interschimbati element cu element pe pozitii corespunzatoare: elementul de pe linia k, coloana i, cu elementul de pe linia i, coloana k, pentru i=1..k-1.",
    explanation:
      "Elementele de pe linia k situate la stanga diagonalei principale sunt cele de pe coloanele 1..k-1 ale liniei k, iar elementele de pe coloana k situate deasupra diagonalei sunt cele de pe liniile 1..k-1 ale coloanei k. Ambele secvente au lungimea k-1 si sunt interschimbate pozitie cu pozitie: pentru fiecare i=1..k-1, se schimba intre ele valorile de la (linia k, coloana i) si (linia i, coloana k).\n\n**Complexitate:** O(n^2)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, k; cin >> n >> k;
    vector<vector<long long>> a(n + 1, vector<long long>(n + 1));
    for (int i = 1; i <= n; i++) for (int j = 1; j <= n; j++) cin >> a[i][j];
    for (int i = 1; i <= k - 1; i++) swap(a[k][i], a[i][k]);
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) cout << a[i][j] << (j < n ? " " : "\\n");
    }
    return 0;
}
`,
    py: `n, k = map(int, input().split())
a = [[0] * (n + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    row = list(map(int, input().split()))
    for j in range(1, n + 1):
        a[i][j] = row[j - 1]
for i in range(1, k):
    a[k][i], a[i][k] = a[i][k], a[k][i]
for i in range(1, n + 1):
    print(" ".join(str(a[i][j]) for j in range(1, n + 1)))
`,
    tests: [
      "5 4\n2 4 3 5 6\n8 0 9 8 7\n2 6 9 0 5\n6 1 3 6 9\n7 3 9 4 2",
      "2 2\n1 2\n3 4",
      "3 3\n1 2 3\n4 5 6\n7 8 9",
      "3 2\n1 2 3\n4 5 6\n7 8 9",
      "4 4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16",
    ],
  },
  {
    slug: "bac-speciala-2021-3-3",
    subcategoryId: "speciala-2021",
    title: "Bacalaureat Sesiune Speciala 2021, S3.3 - Termenii sirului pana la y, in ordine inversa",
    difficulty: "hard",
    tags: ["bacalaureat", "2021", "speciala", "subiectul3", "eficienta", "fisiere", "siruri"],
    statement:
      "Se considera sirul 1, 3, 7, 13, 21, 31, 43, ... definit astfel: f0=1, iar fn=fn-1+2n, daca n>=1 (unde n este un numar natural).\n\n" +
      "Se citesc de la tastatura doua numere naturale din intervalul [1,10^9], x si y (x<y), reprezentand doi termeni aflati pe pozitii consecutive in sirul dat, si se cere sa se scrie in fisierul text bac.out, separati prin cate un spatiu, toti termenii sirului mai mici sau egali cu y, in ordine inversa a aparitiei lor in sir. Proiectati un algoritm eficient din punctul de vedere al spatiului de memorie si al timpului de executare.\n\n" +
      "Exemplu: daca x=21 si y=31, fisierul bac.out contine valorile 31 21 13 7 3 1",
    input_format: "Se citesc de la tastatura x si y.",
    output_format: "Se scrie in fisierul bac.out toti termenii sirului <= y, in ordine descrescatoare (inversa aparitiei), separati prin spatiu.",
    constraints: "1 <= x < y <= 10^9",
    hints:
      "Termenul general are forma inchisa fn = n^2+n+1. Determinati cel mai mare n pentru care fn <= y, apoi scrieti termenii direct in ordine descrescatoare, pentru n de la acea valoare maxima pana la 0, fara sa memorati un tablou.",
    explanation:
      "Se observa ca sirul are forma inchisa fn = n^2+n+1 (se verifica usor prin inductie din recurenta data). Se determina, printr-o cautare simpla (crescand n cat timp n^2+n+1 <= y), cea mai mare valoare n_max cu fn_max <= y; apoi se scriu direct in fisier, in ordine descrescatoare, valorile f(n_max), f(n_max-1), ..., f(0), calculate pe loc cu formula, fara a fi nevoie sa se retina un tablou cu toti termenii (algoritm O(1) memorie suplimentara).\n\n**Complexitate:** O(sqrt(y)) timp, O(1) memorie suplimentara",
    io: { input_source: "stdin", input_filename: null, output_target: "file", output_filename: "bac.out" },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long x, y; cin >> x >> y;
    (void)x;
    long long n = 0;
    while ((n + 1) * (n + 1) + (n + 1) + 1 <= y) n++;
    freopen("bac.out", "w", stdout);
    for (long long i = n; i >= 0; i--) {
        cout << (i * i + i + 1);
        if (i > 0) cout << " ";
    }
    cout << "\\n";
    return 0;
}
`,
    py: `x, y = map(int, input().split())
n = 0
while (n + 1) ** 2 + (n + 1) + 1 <= y:
    n += 1
with open("bac.out", "w") as f:
    f.write(" ".join(str(i * i + i + 1) for i in range(n, -1, -1)))
    f.write("\\n")
`,
    tests: ["21 31", "1 3", "1 1000000000", "3 7", "43 43"],
  },
  // ===================== SESIUNEA TOAMNA 2021 =====================
  {
    slug: "bac-toamna-2021-3-1",
    subcategoryId: "toamna-2021",
    title: "Bacalaureat Toamna 2021, S3.1 - Primele n cuburi perfecte descrescator",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "toamna", "subiectul3", "cuburi-perfecte"],
    statement:
      "Un numar natural n se numeste cub perfect daca exista un numar natural b, astfel incat n=b^3. Subprogramul cuburi are un singur parametru, n, prin care primeste un numar natural (n in [1,10^3]). Subprogramul afiseaza pe ecran, separate prin cate un spatiu, in ordine descrescatoare, primele n cuburi perfecte nenule.\n\n" +
      "Scrieti definitia completa a subprogramului.\n\n" +
      "Exemplu: daca n=5 atunci, dupa apel, se afiseaza pe ecran numerele 125 64 27 8 1",
    input_format: "Se citeste de la tastatura numarul natural n.",
    output_format: "Subprogramul insusi afiseaza pe ecran cele n cuburi perfecte nenule, in ordine descrescatoare, separate prin spatiu.",
    constraints: "1 <= n <= 1000",
    hints: "Primele n cuburi perfecte nenule, in ordine crescatoare, sunt 1^3, 2^3, ..., n^3. Afisati-le insa incepand cu n^3 si terminand cu 1^3.",
    explanation:
      "Cele n cuburi perfecte nenule cerute sunt exact 1^3, 2^3, ..., n^3; subprogramul le calculeaza si le afiseaza direct in ordine descrescatoare, incepand de la b=n pana la b=1, fara a fi nevoie sa le stocheze sau sa le sorteze separat.\n\n**Complexitate:** O(n)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "function",
    function_template_cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int n; cin >> n;
    cuburi(n);
    cout << "\\n";
    return 0;
}
`,
    function_template_python: `__USER_CODE__

n = int(input())
cuburi(n)
print()
`,
    cpp: `void cuburi(int n) {
    for (int b = n; b >= 1; b--) {
        cout << (long long)b * b * b;
        if (b > 1) cout << " ";
    }
}
`,
    py: `def cuburi(n):
    print(" ".join(str(b ** 3) for b in range(n, 0, -1)), end="")
`,
    tests: ["5", "1", "10", "1000", "2"],
  },
  {
    slug: "bac-toamna-2021-3-2",
    subcategoryId: "toamna-2021",
    title: "Bacalaureat Toamna 2021, S3.2 - Tablou cu diagonala multipli de k si linii consecutive",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "toamna", "subiectul3", "tablouri-bidimensionale"],
    statement:
      "Scrieti un program C/C++ care citeste de la tastatura doua numere naturale din intervalul [2,10^2], k si n, si construieste in memorie un tablou bidimensional cu n linii si n coloane, astfel incat parcurgand diagonala principala, de sus in jos, sa se obtina un sir strict crescator format din primii n multipli naturali nenuli ai lui k, iar parcurgand fiecare linie a sa, de la stanga la dreapta, sa se obtina cate un sir strict crescator de numere naturale consecutive. Programul afiseaza pe ecran tabloul obtinut, fiecare linie pe cate o linie a ecranului, elementele de pe aceeasi linie fiind separate prin cate un spatiu.\n\n" +
      "Exemplu: pentru k=3 si n=4 se obtine tabloul\n3 4 5 6\n5 6 7 8\n7 8 9 10\n9 10 11 12",
    input_format: "Se citesc de la tastatura k si n.",
    output_format: "Se afiseaza tabloul obtinut, o linie a tabloului pe fiecare linie a ecranului.",
    constraints: "2 <= k, n <= 100",
    hints:
      "Diagonala principala are pe pozitia i (1-indexata) valoarea i*k. Fiecare linie i este un sir de n numere consecutive astfel incat elementul de pe coloana i (diagonala) sa fie exact i*k; deci elementul de pe linia i, coloana j este i*k-i+j.",
    explanation:
      "Elementul de pe diagonala principala a liniei i trebuie sa fie al i-lea multiplu nenul al lui k, adica i*k. Deoarece fiecare linie trebuie sa fie un sir strict crescator de numere consecutive in care elementul de pe coloana i (aflat pe diagonala pentru aceasta linie) este i*k, formula directa pentru elementul de pe linia i, coloana j este M[i][j] = i*k - i + j (se verifica usor ca M[i][i]=i*k, iar valorile cresc cu 1 la fiecare coloana).\n\n**Complexitate:** O(n^2)",
    io: { input_source: "stdin", input_filename: null, output_target: "stdout", output_filename: null },
    solution_mode: "full",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long k, n; cin >> k >> n;
    for (long long i = 1; i <= n; i++) {
        for (long long j = 1; j <= n; j++) {
            long long val = i * k - i + j;
            cout << val << (j < n ? " " : "\\n");
        }
    }
    return 0;
}
`,
    py: `k, n = map(int, input().split())
for i in range(1, n + 1):
    row = [str(i * k - i + j) for j in range(1, n + 1)]
    print(" ".join(row))
`,
    tests: ["3 4", "2 2", "10 3", "100 2", "5 5"],
  },
  {
    slug: "bac-toamna-2021-3-3",
    subcategoryId: "toamna-2021",
    title: "Bacalaureat Toamna 2021, S3.3 - Numarul de perechi asemenea",
    difficulty: "hard",
    tags: ["bacalaureat", "2021", "toamna", "subiectul3", "eficienta", "fisiere"],
    statement:
      "Numim pereche asemenea (x,y) doua numere naturale cu cel putin doua cifre, x si y, cu proprietatea ca ultimele doua cifre ale lui x sunt egale cu ultimele doua cifre ale lui y, dispuse eventual in alta ordine.\n\n" +
      "Fisierul numere.in contine numere naturale din intervalul [10,10^5]: pe prima linie doua numere na si nb, pe a doua linie un sir A de na numere, iar pe a treia linie un sir B de nb numere. Numerele aflate pe aceeasi linie a fisierului sunt separate prin cate un spatiu.\n\n" +
      "Se cere sa se afiseze pe ecran numarul de perechi asemenea (x,y), cu proprietatea ca x este un termen al sirului A, iar y este un termen al sirului B. Proiectati un algoritm eficient din punctul de vedere al timpului de executare.\n\n" +
      "Exemplu: daca fisierul contine\n9 7\n112 20 42 112 5013 824 10012 55 155\n402 1024 321 521 57 6542 255\n" +
      "se afiseaza pe ecran numarul 13.",
    input_format: "Fisierul numere.in: pe prima linie na si nb, pe a doua linie sirul A, pe a treia linie sirul B.",
    output_format: "Se afiseaza numarul de perechi asemenea (x,y) cu x din A si y din B.",
    constraints: "1 <= na, nb, elementele fiecarui sir in [10, 10^5]",
    hints:
      "Pentru fiecare numar retineti doar ultimele doua cifre, ca o pereche neordonata (cheie canonica, de exemplu min*10+max). Numarati de cate ori apare fiecare cheie in A si de cate ori in B, apoi insumati produsele numarului de aparitii pentru fiecare cheie comuna.",
    explanation:
      "Pentru fiecare numar se extrag ultimele doua cifre (d1=cifra zecilor, d2=cifra unitatilor la numar%100) si se construieste o cheie canonica ce ignora ordinea, de exemplu min(d1,d2)*10+max(d1,d2) (100 de chei posibile, de la 0 la 99). Se numara de cate ori apare fiecare cheie printre termenii lui A (vector cntA[100]) si printre termenii lui B (vector cntB[100]), printr-o singura trecere prin fiecare sir. Numarul total de perechi asemenea este suma, pentru fiecare cheie, a produsului cntA[cheie]*cntB[cheie] (fiecare combinatie x din A cu aceeasi cheie ca un y din B formeaza o pereche distincta).\n\n**Complexitate:** O(na + nb)",
    io: { input_source: "file", input_filename: "numere.in", output_target: "stdout", output_filename: null },
    solution_mode: "full",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int cheie(long long v) {
    int ultime = (int)(v % 100);
    int d1 = ultime / 10, d2 = ultime % 10;
    return min(d1, d2) * 10 + max(d1, d2);
}
int main() {
    freopen("numere.in", "r", stdin);
    int na, nb; cin >> na >> nb;
    vector<long long> cntA(100, 0), cntB(100, 0);
    for (int i = 0; i < na; i++) { long long v; cin >> v; cntA[cheie(v)]++; }
    for (int i = 0; i < nb; i++) { long long v; cin >> v; cntB[cheie(v)]++; }
    long long total = 0;
    for (int c = 0; c < 100; c++) total += cntA[c] * cntB[c];
    cout << total << "\\n";
    return 0;
}
`,
    py: `def cheie(v):
    ultime = v % 100
    d1, d2 = ultime // 10, ultime % 10
    return min(d1, d2) * 10 + max(d1, d2)

with open("numere.in") as f:
    na, nb = map(int, f.readline().split())
    A = list(map(int, f.readline().split()))
    B = list(map(int, f.readline().split()))
cntA = [0] * 100
cntB = [0] * 100
for v in A:
    cntA[cheie(v)] += 1
for v in B:
    cntB[cheie(v)] += 1
total = sum(cntA[c] * cntB[c] for c in range(100))
print(total)
`,
    tests: [
      "9 7\n112 20 42 112 5013 824 10012 55 155\n402 1024 321 521 57 6542 255",
      "1 1\n10\n10",
      "1 1\n11\n99",
      "2 2\n99999 12\n21 33",
      (() => {
        const na = 15000, nb = 15000;
        const A = [];
        const B = [];
        for (let i = 0; i < na; i++) A.push(String(1000 + (i % 90) * 11));
        for (let i = 0; i < nb; i++) B.push(String(2000 + (i % 90) * 11));
        return `${na} ${nb}\n${A.join(" ")}\n${B.join(" ")}`;
      })(),
    ],
  },
];

async function upsertDraft(p) {
  const existing = await pool.query("SELECT id FROM problems WHERE slug = $1", [p.slug]);
  const allowedLanguages = p.solution_mode === "function" ? ["cpp", "python"] : ["cpp", "c", "pascal", "python"];
  const params = [
    p.slug,
    p.title,
    p.statement,
    p.input_format,
    p.output_format,
    p.constraints,
    p.difficulty,
    p.time_limit_ms || 1500,
    p.memory_limit_mb || 64,
    SRC,
    p.tags || [],
    allowedLanguages,
    p.cpp,
    p.hints,
    p.explanation,
    p.cpp,
    p.py,
    LEVEL,
    CHAPTER.id,
    p.subcategoryId,
    p.solution_mode,
    p.io.input_source,
    p.io.output_target,
    p.io.input_filename,
    p.io.output_filename,
    p.function_template_cpp || null,
    p.function_template_python || null,
  ];
  if (existing.rows.length > 0) {
    const id = existing.rows[0].id;
    await pool.query(
      `UPDATE problems SET
         title=$2, statement=$3, input_format=$4, output_format=$5, constraints=$6,
         difficulty=$7, time_limit_ms=$8, memory_limit_mb=$9, source=$10, tags=$11,
         allowed_languages=$12, is_published=false, editorial_status='draft', official_solution=$13,
         hints=$14, explanation=$15, official_solution_cpp=$16, official_solution_python=$17,
         curriculum_level=$18, curriculum_chapter_id=$19, curriculum_subcategory_id=$20,
         solution_mode=$21, input_source=$22, output_target=$23, input_filename=$24, output_filename=$25,
         function_template_cpp=$26, function_template_python=$27,
         checker_mode='exact', updated_at=NOW()
       WHERE id=$1`,
      [id, ...params.slice(1)],
    );
    await pool.query("DELETE FROM test_cases WHERE problem_id = $1", [id]);
    return id;
  }
  const inserted = await pool.query(
    `INSERT INTO problems (
       slug, title, statement, input_format, output_format, constraints,
       difficulty, time_limit_ms, memory_limit_mb, source, tags,
       allowed_languages, is_published, official_solution,
       hints, explanation, official_solution_cpp, official_solution_python,
       curriculum_level, curriculum_chapter_id, curriculum_subcategory_id,
       solution_mode, input_source, output_target, input_filename, output_filename,
       function_template_cpp, function_template_python,
       checker_mode, editorial_status, estimated_minutes
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,false,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,'exact','draft',15
     )
     RETURNING id`,
    params,
  );
  return inserted.rows[0].id;
}

async function finalizePublish(id, testRows) {
  await pool.query("UPDATE problems SET is_published=true, editorial_status='published', updated_at=NOW() WHERE id=$1", [id]);
  for (let i = 0; i < testRows.length; i++) {
    const t = testRows[i];
    await pool.query(
      `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, t.input, t.expected_output, t.is_sample, 10, i + 1],
    );
  }
}

async function seedGroup(list) {
  const summary = [];

  for (const p of list) {
    console.log(`\n=== ${p.slug} ===`);
    try {
      const id = await upsertDraft(p);
      let allOk = true;
      const testRows = [];

      for (let i = 0; i < p.tests.length; i++) {
        const input = p.tests[i];
        const [cppOut, pyOut] = await Promise.all([
          runCustom(id, "cpp", p.cpp, input),
          runCustom(id, "python", p.py, input),
        ]);

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
          console.error(`  TEST ${i}: MISMATCH cpp="${normCpp}" python="${normPy}" (input len=${input.length})`);
          allOk = false;
          continue;
        }

        testRows.push({ input, expected_output: `${normCpp}\n`, is_sample: i < 2 });
      }

      if (!allOk) {
        console.error(`!!! ${p.slug} has failing tests - left as DRAFT (is_published=false).`);
        summary.push({ slug: p.slug, ok: false, tests: testRows.length });
        continue;
      }

      await finalizePublish(id, testRows);
      console.log(`published ${p.slug} (${p.difficulty}) with ${testRows.length} tests`);
      summary.push({ slug: p.slug, ok: true, tests: testRows.length });
    } catch (err) {
      console.error(`FAIL ${p.slug}: ${err.stack || err.message}`);
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
