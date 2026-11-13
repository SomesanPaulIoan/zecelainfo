const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade10", chapter: "structuri-liniare", sub: "coada" };

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

const IN_FMT_OPERATII = "Pe prima linie se citeste n, numarul de operatii. Urmeaza n linii, fiecare continand o operatie.";
const OUT_FMT_DA_NU = "Se afiseaza DA daca proprietatea este adevarata, respectiv NU in caz contrar.";

const problems = [
  {
    slug: "coada-operatii-simulare",
    title: "Simularea operatiilor ADAUGA si SCOATE pe o coada",
    difficulty: "easy",
    tags: ["coada", "queue", "simulare"],
    statement: "Se citesc n operatii asupra unei cozi initial vide. Fiecare operatie este de forma 'ADAUGA x' (adauga x la sfarsitul cozii) sau 'SCOATE' (elimina elementul din fata cozii; daca coada este vida, operatia se ignora). Afisati continutul final al cozii, de la inceput spre sfarsit.",
    input_format: IN_FMT_OPERATII + " O operatie ADAUGA este urmata de valoarea intreaga x.",
    output_format: "Se afiseaza elementele ramase in coada, de la inceput spre sfarsit, separate prin spatiu, pe o singura linie (linie goala daca coada este vida).",
    constraints: "1 <= n <= 200, valorile x sunt numere intregi",
    hints: "Folositi o structura de tip coada (de exemplu deque): ADAUGA insereaza la sfarsit, SCOATE elimina din fata (daca exista).",
    explanation: "Se simuleaza coada folosind o structura de tip deque: la ADAUGA x se adauga x la sfarsitul cozii, iar la SCOATE se elimina elementul din fata cozii, doar daca aceasta nu este vida. La final, structura contine exact elementele cozii, in ordinea de la primul intrat inca prezent, pana la ultimul adaugat.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    deque<int> coada;
    for (int i = 0; i < n; i++) {
        string op; cin >> op;
        if (op == "ADAUGA") {
            int x; cin >> x;
            coada.push_back(x);
        } else {
            if (!coada.empty()) coada.pop_front();
        }
    }
    bool first = true;
    for (int x : coada) {
        if (!first) cout << ' ';
        cout << x;
        first = false;
    }
    cout << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n = int(input())
coada = deque()
for _ in range(n):
    parts = input().split()
    if parts[0] == "ADAUGA":
        coada.append(int(parts[1]))
    else:
        if coada:
            coada.popleft()
print(" ".join(map(str, coada)))
`,
    tests: [
      "5\nADAUGA 1\nADAUGA 2\nADAUGA 3\nSCOATE\nADAUGA 4",
      "3\nADAUGA 10\nADAUGA 20\nSCOATE",
      "6\nADAUGA 1\nSCOATE\nADAUGA 2\nSCOATE\nADAUGA 3\nADAUGA 4",
      "1\nADAUGA 5",
      "4\nADAUGA 1\nADAUGA 2\nADAUGA 3\nSCOATE",
    ],
  },
  {
    slug: "coada-generare-numere-binare",
    title: "Generarea primelor n reprezentari binare folosind o coada",
    difficulty: "medium",
    tags: ["coada", "queue", "binar"],
    statement: "Determinati primele n numere din sirul reprezentarilor binare ale numerelor naturale 1, 2, 3, ..., folosind o coada: incepeti cu '1' in coada, iar la fiecare pas extrageti elementul din fata cozii, il afisati si adaugati in coada acest element urmat de '0', respectiv urmat de '1'.",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza primele n reprezentari binare generate, separate prin spatiu.",
    constraints: "1 <= n <= 100",
    hints: "La fiecare pas, extrageti fruntea cozii, afisati-o, apoi adaugati in coada doua siruri noi: fruntea extrasa cu '0' adaugat la sfarsit, respectiv cu '1' adaugat la sfarsit.",
    explanation: "Coada este initializata cu sirul '1'. La fiecare dintre cele n pasi, se extrage elementul din fata cozii si se afiseaza; apoi in coada se adauga doua siruri noi, obtinute prin adaugarea caracterului '0', respectiv '1', la sfarsitul sirului extras. Aceasta simuleaza o parcurgere in latime a arborelui binar de reprezentari, generand exact numerele binare 1, 10, 11, 100, 101, ... in ordine crescatoare.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    queue<string> q;
    q.push("1");
    for (int i = 0; i < n; i++) {
        string cur = q.front(); q.pop();
        cout << cur;
        if (i + 1 < n) cout << ' ';
        q.push(cur + "0");
        q.push(cur + "1");
    }
    cout << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n = int(input())
q = deque()
q.append("1")
rez = []
for _ in range(n):
    cur = q.popleft()
    rez.append(cur)
    q.append(cur + "0")
    q.append(cur + "1")
print(" ".join(rez))
`,
    tests: ["1", "5", "10", "3", "8"],
  },
  {
    slug: "coada-primul-negativ-fereastra",
    title: "Primul numar negativ din fiecare fereastra de dimensiune k",
    difficulty: "medium",
    tags: ["coada", "queue", "fereastra-glisanta"],
    statement: "Se citeste un vector de n numere intregi si un numar k. Pentru fiecare fereastra contigua de k elemente consecutive, determinati primul numar negativ din acea fereastra (sau 0, daca fereastra nu contine niciun numar negativ), folosind o coada in care pastrati indicii numerelor negative din fereastra curenta.",
    input_format: "Pe prima linie se citesc n si k. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza cate un numar pentru fiecare dintre cele n-k+1 ferestre, separate prin spatiu.",
    constraints: "1 <= k <= n <= 200",
    hints: "Mentineti in coada indicii elementelor negative din fereastra curenta; la avansarea ferestrei, eliminati din fata cozii indicii care au iesit din fereastra.",
    explanation: "Se mentine o coada cu indicii numerelor negative aflate in fereastra curenta, in ordinea aparitiei. Pentru fiecare pozitie i se adauga indicele i in coada daca a[i] este negativ; cand fereastra are dimensiunea k (i >= k-1), se elimina din fata cozii indicii care au iesit din fereastra curenta (mai mici sau egali cu i-k), iar raspunsul pentru aceasta fereastra este valoarea de la indicele ramas in fata cozii (sau 0, daca aceasta este vida).\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, k; cin >> n >> k;
    vector<int> a(n);
    for (auto &x : a) cin >> x;
    deque<int> coada;
    vector<int> rez;
    for (int i = 0; i < n; i++) {
        if (a[i] < 0) coada.push_back(i);
        if (i >= k - 1) {
            while (!coada.empty() && coada.front() <= i - k) coada.pop_front();
            rez.push_back(coada.empty() ? 0 : a[coada.front()]);
        }
    }
    for (int i = 0; i < (int)rez.size(); i++) {
        cout << rez[i];
        if (i + 1 < (int)rez.size()) cout << ' ';
    }
    cout << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, k = map(int, input().split())
a = list(map(int, input().split()))
coada = deque()
rez = []
for i in range(n):
    if a[i] < 0:
        coada.append(i)
    if i >= k - 1:
        while coada and coada[0] <= i - k:
            coada.popleft()
        rez.append(0 if not coada else a[coada[0]])
print(" ".join(map(str, rez)))
`,
    tests: [
      "8 3\n12 -1 -7 8 -15 30 16 28",
      "5 2\n-1 2 3 -4 5",
      "6 4\n1 2 3 4 5 6",
      "5 1\n-1 -2 -3 -4 -5",
      "7 3\n1 -2 3 4 -5 6 7",
    ],
  },
  {
    slug: "coada-problema-josephus",
    title: "Problema lui Josephus, simulata cu o coada",
    difficulty: "hard",
    tags: ["coada", "queue", "josephus"],
    statement: "Se aseaza n persoane, numerotate de la 1 la n, intr-un cerc. Incepand de la persoana 1, se numara cate k persoane (inclusiv cea de la care se incepe numararea la fiecare runda), iar persoana la care se ajunge este eliminata din cerc; numararea continua de la urmatoarea persoana ramasa. Determinati ordinea in care sunt eliminate persoanele, folosind o coada.",
    input_format: "Se citesc numerele n si k.",
    output_format: "Se afiseaza ordinea eliminarii celor n persoane, separate prin spatiu.",
    constraints: "1 <= k <= n <= 200",
    hints: "Puneti persoanele 1..n intr-o coada. La fiecare runda, mutati k-1 persoane din fata cozii la sfarsitul ei (le 'saltati'), apoi eliminati persoana ramasa in fata.",
    explanation: "Persoanele 1, 2, ..., n sunt puse intr-o coada, in aceasta ordine. La fiecare runda, se extrag din fata cozii k-1 persoane si se pun inapoi la sfarsitul cozii (simuland faptul ca sunt 'sarite' la numarare), apoi persoana ramasa in fata cozii este extrasa si eliminata (adaugata in ordinea de eliminare). Procesul se repeta pana cand coada devine vida.\n\n**Complexitate:** O(n * k)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, k; cin >> n >> k;
    queue<int> coada;
    for (int i = 1; i <= n; i++) coada.push(i);
    vector<int> ordine;
    while (!coada.empty()) {
        for (int i = 0; i < k - 1; i++) {
            int x = coada.front(); coada.pop();
            coada.push(x);
        }
        ordine.push_back(coada.front());
        coada.pop();
    }
    for (int i = 0; i < (int)ordine.size(); i++) {
        cout << ordine[i];
        if (i + 1 < (int)ordine.size()) cout << ' ';
    }
    cout << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, k = map(int, input().split())
coada = deque(range(1, n + 1))
ordine = []
while coada:
    for _ in range(k - 1):
        coada.append(coada.popleft())
    ordine.append(coada.popleft())
print(" ".join(map(str, ordine)))
`,
    tests: ["7 3", "5 2", "1 1", "6 1", "10 4"],
  },
  {
    slug: "coada-interclasare-doua-cozi",
    title: "Interclasarea alternativa a doua cozi",
    difficulty: "easy",
    tags: ["coada", "queue", "interclasare"],
    statement: "Se citesc doua cozi de numere intregi. Construiti si afisati coada obtinuta prin alternarea elementelor celor doua cozi (primul element din prima coada, primul din a doua, al doilea din prima s.a.m.d.); daca una dintre cozi se goleste mai devreme, elementele ramase din cealalta coada se adauga la sfarsit, in ordinea lor.",
    input_format: "Pe prima linie se citesc n si m, numarul de elemente din prima, respectiv a doua coada. Pe a doua linie se citesc cele n elemente ale primei cozi. Pe a treia linie se citesc cele m elemente ale celei de-a doua cozi.",
    output_format: "Se afiseaza coada rezultata, cu elementele separate prin spatiu.",
    constraints: "1 <= n, m <= 100",
    hints: "Extrageti alternativ cate un element din fata fiecarei cozi, atat timp cat mai exista elemente in acea coada.",
    explanation: "Se folosesc doua cozi, construite din datele citite. Cat timp cel putin una dintre ele este nevida, se extrage (daca exista) elementul din fata primei cozi si se adauga in rezultat, apoi se extrage (daca exista) elementul din fata celei de-a doua cozi si se adauga in rezultat.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    queue<int> q1, q2;
    for (int i = 0; i < n; i++) { int x; cin >> x; q1.push(x); }
    for (int i = 0; i < m; i++) { int x; cin >> x; q2.push(x); }
    vector<int> rez;
    while (!q1.empty() || !q2.empty()) {
        if (!q1.empty()) { rez.push_back(q1.front()); q1.pop(); }
        if (!q2.empty()) { rez.push_back(q2.front()); q2.pop(); }
    }
    for (int i = 0; i < (int)rez.size(); i++) {
        cout << rez[i];
        if (i + 1 < (int)rez.size()) cout << ' ';
    }
    cout << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, m = map(int, input().split())
q1 = deque(map(int, input().split()))
q2 = deque(map(int, input().split()))
rez = []
while q1 or q2:
    if q1:
        rez.append(q1.popleft())
    if q2:
        rez.append(q2.popleft())
print(" ".join(map(str, rez)))
`,
    tests: [
      "3 3\n1 2 3\n10 20 30",
      "2 4\n1 2\n10 20 30 40",
      "4 2\n1 2 3 4\n10 20",
      "1 1\n5\n6",
      "5 3\n1 2 3 4 5\n100 200 300",
    ],
  },
  {
    slug: "coada-rotire-coada",
    title: "Rotirea unei cozi cu k pozitii",
    difficulty: "easy",
    tags: ["coada", "queue", "rotire"],
    statement: "Se citeste o coada de n numere intregi si un numar k. Rotiti coada spre stanga cu k pozitii, folosind doar operatii specifice cozii (extragerea elementului din fata si adaugarea lui la sfarsit).",
    input_format: "Pe prima linie se citesc n si k. Pe a doua linie se citesc cele n elemente ale cozii.",
    output_format: "Se afiseaza coada rotita, cu elementele separate prin spatiu.",
    constraints: "1 <= n <= 200, 0 <= k <= 1000",
    hints: "Repetati de k % n ori operatia: extrageti elementul din fata cozii si adaugati-l la sfarsit.",
    explanation: "Rotirea la stanga cu k pozitii este echivalenta cu rotirea cu k % n pozitii (rotirea cu n pozitii reface coada initiala). Se repeta de k % n ori operatia elementara: se extrage elementul din fata cozii si se adauga la sfarsitul ei; dupa aceste repetari, coada reprezinta exact rotatia dorita.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, k; cin >> n >> k;
    queue<int> coada;
    for (int i = 0; i < n; i++) { int x; cin >> x; coada.push(x); }
    k %= n;
    for (int i = 0; i < k; i++) {
        int x = coada.front(); coada.pop();
        coada.push(x);
    }
    bool first = true;
    while (!coada.empty()) {
        if (!first) cout << ' ';
        cout << coada.front();
        coada.pop();
        first = false;
    }
    cout << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, k = map(int, input().split())
coada = deque(map(int, input().split()))
k %= n
for _ in range(k):
    coada.append(coada.popleft())
print(" ".join(map(str, coada)))
`,
    tests: ["5 2\n1 2 3 4 5", "4 1\n10 20 30 40", "6 6\n1 2 3 4 5 6", "3 4\n1 2 3", "5 0\n1 2 3 4 5"],
  },
  {
    slug: "coada-verificare-palindrom-cu-coada-si-stiva",
    title: "Verificarea unui palindrom folosind o coada si o stiva",
    difficulty: "medium",
    tags: ["coada", "queue", "stiva", "palindrom"],
    statement: "Se citeste un sir de caractere. Construiti, din acelasi sir, atat o coada (care pastreaza ordinea originala) cat si o stiva (care inverseaza ordinea). Verificati daca sirul este palindrom comparand, pe rand, fruntea cozii cu varful stivei si extragand cate un element din fiecare, pana cand coada devine vida.",
    input_format: "Se citeste un sir de caractere, pe o singura linie.",
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= lungimea sirului <= 200",
    hints: "Daca sirul este palindrom, caracterul din fata cozii (citit de la stanga la dreapta) coincide mereu cu cel din varful stivei (citit de la dreapta la stanga), la fiecare pas.",
    explanation: "Se construiesc o coada si o stiva, ambele continand toate caracterele sirului, in ordinea din sir. La fiecare pas, se compara fruntea cozii (urmatorul caracter din ordinea normala) cu varful stivei (urmatorul caracter din ordinea inversa); daca difera, sirul nu este palindrom. Daca toate comparatiile, pana la golirea cozii, reusesc, sirul este palindrom.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    queue<char> coada;
    vector<char> stiva;
    for (char c : s) { coada.push(c); stiva.push_back(c); }
    bool ok = true;
    while (!coada.empty()) {
        if (coada.front() != stiva.back()) { ok = false; break; }
        coada.pop();
        stiva.pop_back();
    }
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `from collections import deque
s = input()
coada = deque(s)
stiva = list(s)
ok = True
while coada:
    if coada[0] != stiva[-1]:
        ok = False
        break
    coada.popleft()
    stiva.pop()
print("DA" if ok else "NU")
`,
    tests: ["ana", "abba", "abcd", "racecar", "abccba"],
  },
  {
    slug: "coada-maxim-fereastra-glisanta",
    title: "Maximul din fiecare fereastra glisanta de dimensiune k",
    difficulty: "hard",
    tags: ["coada", "queue", "fereastra-glisanta", "deque"],
    statement: "Se citeste un vector de n numere intregi si un numar k. Pentru fiecare fereastra contigua de k elemente consecutive, determinati maximul acelei ferestre, folosind o coada dubla (deque) in care pastrati indicii unor elemente candidate, in ordine descrescatoare a valorilor.",
    input_format: "Pe prima linie se citesc n si k. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza cate un numar pentru fiecare dintre cele n-k+1 ferestre, separate prin spatiu.",
    constraints: "1 <= k <= n <= 200",
    hints: "Mentineti in coada dubla indicii unor elemente astfel incat valorile lor sa fie in ordine descrescatoare; eliminati din spate indicii elementelor mai mici decat elementul curent, si din fata indicii iesiti din fereastra.",
    explanation: "Se mentine o coada dubla (deque) de indici, astfel incat valorile corespunzatoare sa fie mereu in ordine descrescatoare de la fata la spatele cozii. Pentru fiecare element nou a[i]: se elimina din spatele cozii toti indicii ale caror valori sunt mai mici sau egale cu a[i] (nu mai pot fi maxim, avand un candidat mai bun si mai recent), apoi se adauga i la spate; se elimina din fata cozii indicii iesiti din fereastra curenta. Odata ce fereastra are dimensiunea k, maximul ferestrei este valoarea de la indicele din fata cozii.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, k; cin >> n >> k;
    vector<int> a(n);
    for (auto &x : a) cin >> x;
    deque<int> coada;
    vector<int> rez;
    for (int i = 0; i < n; i++) {
        while (!coada.empty() && a[coada.back()] <= a[i]) coada.pop_back();
        coada.push_back(i);
        if (coada.front() <= i - k) coada.pop_front();
        if (i >= k - 1) rez.push_back(a[coada.front()]);
    }
    for (int i = 0; i < (int)rez.size(); i++) {
        cout << rez[i];
        if (i + 1 < (int)rez.size()) cout << ' ';
    }
    cout << "\\n";
    return 0;
}
`,
    py: `from collections import deque
n, k = map(int, input().split())
a = list(map(int, input().split()))
coada = deque()
rez = []
for i in range(n):
    while coada and a[coada[-1]] <= a[i]:
        coada.pop()
    coada.append(i)
    if coada[0] <= i - k:
        coada.popleft()
    if i >= k - 1:
        rez.append(a[coada[0]])
print(" ".join(map(str, rez)))
`,
    tests: [
      "8 3\n1 3 -1 -3 5 3 6 7",
      "5 2\n1 2 3 4 5",
      "6 1\n5 3 8 1 9 2",
      "4 4\n4 3 2 1",
      "7 3\n9 7 5 3 1 2 4",
    ],
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
