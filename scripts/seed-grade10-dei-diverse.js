const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade10", chapter: "divide-et-impera", sub: "dei-diverse" };

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

const IN_FMT_VEC = "Pe prima linie se citeste numarul natural n. Pe a doua linie se citesc cele n numere intregi ale vectorului, separate prin spatiu.";
const IN_FMT_VEC_K = "Pe prima linie se citeste numarul natural n. Pe a doua linie se citesc cele n numere intregi ale vectorului, separate prin spatiu. Pe a treia linie se citeste numarul natural nenul k.";
const IN_FMT_VEC_AB = "Pe prima linie se citeste numarul natural n. Pe a doua linie se citesc cele n numere intregi ale vectorului, separate prin spatiu. Pe a treia linie se citesc doua numere intregi a si b (a <= b).";
const OUT_FMT_DA_NU = "Se afiseaza DA daca proprietatea este adevarata, respectiv NU in caz contrar.";
const DEI_NOTE = "Rezolvati problema obligatoriu prin metoda Divide et Impera: impartiti intervalul de indici in doua jumatati aproximativ egale, rezolvati recursiv fiecare jumatate, apoi combinati cele doua rezultate partiale.";

const problems = [
  // ===================== A. PROPRIETATI PE VECTORI (boolean) =====================
  {
    slug: "dei-vector-toate-egale",
    title: "DEI: Toate elementele unui vector sunt egale",
    difficulty: "easy",
    tags: ["divide-et-impera", "vector", "proprietati"],
    statement: "Se citeste un vector cu n numere intregi. Verificati, folosind metoda Divide et Impera, daca toate elementele vectorului sunt egale intre ele.",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Impartiti vectorul in doua jumatati. Fiecare jumatate trebuie sa aiba toate elementele egale, iar ultimul element din stanga trebuie sa fie egal cu primul element din dreapta.",
    explanation: `${DEI_NOTE} O secventa de un singur element este mereu "toate egale". Pentru a combina cele doua jumatati, verificati suplimentar ca a[mij] == a[mij+1], deoarece egalitatea in interiorul fiecarei jumatati nu garanteaza egalitatea intre cele doua grupuri.\n\n**Complexitate:** O(n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
bool toateEgale(int st, int dr) {
    if (st == dr) return true;
    int mij = (st + dr) / 2;
    bool stanga = toateEgale(st, mij);
    bool dreapta = toateEgale(mij + 1, dr);
    return stanga && dreapta && a[mij] == a[mij + 1];
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << (toateEgale(0, n - 1) ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def toate_egale(a, st, dr):
    if st == dr:
        return True
    mij = (st + dr) // 2
    stanga = toate_egale(a, st, mij)
    dreapta = toate_egale(a, mij + 1, dr)
    return stanga and dreapta and a[mij] == a[mij + 1]

n = int(input())
a = list(map(int, input().split()))
print("DA" if toate_egale(a, 0, n - 1) else "NU")
`,
    tests: ["1\n5", "4\n3 3 3 3", "4\n3 3 4 3", "5\n-2 -2 -2 -2 -2", "2\n0 1"],
  },
  {
    slug: "dei-vector-crescator",
    title: "DEI: Vector crescator (nedescrescator)",
    difficulty: "medium",
    tags: ["divide-et-impera", "vector", "proprietati", "sortare"],
    statement: "Se citeste un vector cu n numere intregi. Verificati, folosind metoda Divide et Impera, daca vectorul este crescator (nedescrescator), adica a[i] <= a[i+1] pentru orice pozitie i.",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Verificati recursiv ca fiecare jumatate este crescatoare, apoi verificati ca elementul din mijloc este mai mic sau egal decat urmatorul.",
    explanation: `${DEI_NOTE} O secventa de un singur element este mereu crescatoare. La combinare, in afara de faptul ca ambele jumatati trebuie sa fie crescatoare, este esential ca a[mij] <= a[mij+1], altfel legatura dintre cele doua jumatati s-ar putea sa nu fie respectata.\n\n**Complexitate:** O(n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
bool crescator(int st, int dr) {
    if (st == dr) return true;
    int mij = (st + dr) / 2;
    return crescator(st, mij) && crescator(mij + 1, dr) && a[mij] <= a[mij + 1];
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << (crescator(0, n - 1) ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def crescator(a, st, dr):
    if st == dr:
        return True
    mij = (st + dr) // 2
    return crescator(a, st, mij) and crescator(a, mij + 1, dr) and a[mij] <= a[mij + 1]

n = int(input())
a = list(map(int, input().split()))
print("DA" if crescator(a, 0, n - 1) else "NU")
`,
    tests: ["1\n7", "5\n1 2 2 5 9", "5\n1 3 2 5 9", "4\n-5 -3 -3 0", "3\n5 4 3"],
  },
  {
    slug: "dei-vector-descrescator",
    title: "DEI: Vector descrescator (necrescator)",
    difficulty: "medium",
    tags: ["divide-et-impera", "vector", "proprietati", "sortare"],
    statement: "Se citeste un vector cu n numere intregi. Verificati, folosind metoda Divide et Impera, daca vectorul este descrescator (necrescator), adica a[i] >= a[i+1] pentru orice pozitie i.",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Simetric fata de cazul crescator: verificati recursiv fiecare jumatate si conditia a[mij] >= a[mij+1].",
    explanation: `${DEI_NOTE} Analog problemei vectorului crescator, dar conditia de legatura intre cele doua jumatati devine a[mij] >= a[mij+1].\n\n**Complexitate:** O(n)`,
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
bool descrescator(int st, int dr) {
    if (st == dr) return true;
    int mij = (st + dr) / 2;
    return descrescator(st, mij) && descrescator(mij + 1, dr) && a[mij] >= a[mij + 1];
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << (descrescator(0, n - 1) ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def descrescator(a, st, dr):
    if st == dr:
        return True
    mij = (st + dr) // 2
    return descrescator(a, st, mij) and descrescator(a, mij + 1, dr) and a[mij] >= a[mij + 1]

n = int(input())
a = list(map(int, input().split()))
print("DA" if descrescator(a, 0, n - 1) else "NU")
`,
    tests: ["1\n7", "5\n9 5 5 2 1", "5\n9 5 6 2 1", "3\n1 2 3", "4\n0 0 -1 -5"],
  },
  {
    slug: "dei-vector-monoton",
    title: "DEI: Vector monoton",
    difficulty: "medium",
    tags: ["divide-et-impera", "vector", "proprietati", "sortare"],
    statement: "Se citeste un vector cu n numere intregi. Verificati, folosind metoda Divide et Impera, daca vectorul este monoton, adica este fie crescator (nedescrescator), fie descrescator (necrescator).",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Folositi cele doua functii Divide et Impera de la problemele anterioare (crescator si descrescator) si combinati rezultatele cu SAU.",
    explanation: "Se reutilizeaza cele doua functii recursive Divide et Impera care verifica separat monotonia crescatoare, respectiv descrescatoare, iar raspunsul final este adevarat daca cel putin una dintre ele este adevarata.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
bool crescator(int st, int dr) {
    if (st == dr) return true;
    int mij = (st + dr) / 2;
    return crescator(st, mij) && crescator(mij + 1, dr) && a[mij] <= a[mij + 1];
}
bool descrescator(int st, int dr) {
    if (st == dr) return true;
    int mij = (st + dr) / 2;
    return descrescator(st, mij) && descrescator(mij + 1, dr) && a[mij] >= a[mij + 1];
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    bool ok = crescator(0, n - 1) || descrescator(0, n - 1);
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def crescator(a, st, dr):
    if st == dr:
        return True
    mij = (st + dr) // 2
    return crescator(a, st, mij) and crescator(a, mij + 1, dr) and a[mij] <= a[mij + 1]

def descrescator(a, st, dr):
    if st == dr:
        return True
    mij = (st + dr) // 2
    return descrescator(a, st, mij) and descrescator(a, mij + 1, dr) and a[mij] >= a[mij + 1]

n = int(input())
a = list(map(int, input().split()))
ok = crescator(a, 0, n - 1) or descrescator(a, 0, n - 1)
print("DA" if ok else "NU")
`,
    tests: ["1\n1", "5\n1 3 2 5 4", "4\n1 1 1 1", "4\n5 3 3 1", "4\n1 2 5 3"],
  },
  {
    slug: "dei-vector-alterneaza-paritate",
    title: "DEI: Paritatea elementelor alterneaza",
    difficulty: "medium",
    tags: ["divide-et-impera", "vector", "proprietati", "paritate"],
    statement: "Se citeste un vector cu n numere intregi. Verificati, folosind metoda Divide et Impera, daca paritatea elementelor alterneaza, adica oricare doua elemente vecine au paritati diferite (unul par, celalalt impar).",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "La fel ca la vectorul crescator: verificati recursiv fiecare jumatate, apoi verificati ca a[mij] si a[mij+1] au paritati diferite.",
    explanation: "Proprietatea 'alternanta de paritate' este, la fel ca monotonia, o proprietate locala intre elemente vecine, deci se aplica acelasi tipar Divide et Impera: cele doua jumatati trebuie sa alterneze intern, iar granita dintre ele (a[mij], a[mij+1]) trebuie sa aiba paritati diferite.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
bool alterneaza(int st, int dr) {
    if (st == dr) return true;
    int mij = (st + dr) / 2;
    bool paritateDiferita = ((a[mij] % 2 + 2) % 2) != ((a[mij + 1] % 2 + 2) % 2);
    return alterneaza(st, mij) && alterneaza(mij + 1, dr) && paritateDiferita;
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << (alterneaza(0, n - 1) ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def alterneaza(a, st, dr):
    if st == dr:
        return True
    mij = (st + dr) // 2
    paritate_diferita = (a[mij] % 2) != (a[mij + 1] % 2)
    return alterneaza(a, st, mij) and alterneaza(a, mij + 1, dr) and paritate_diferita

n = int(input())
a = list(map(int, input().split()))
print("DA" if alterneaza(a, 0, n - 1) else "NU")
`,
    tests: ["1\n4", "5\n1 2 3 4 5", "4\n2 4 1 3", "6\n0 1 0 1 0 1", "3\n2 3 5"],
  },
  {
    slug: "dei-vector-alterneaza-semn",
    title: "DEI: Semnul elementelor alterneaza",
    difficulty: "medium",
    tags: ["divide-et-impera", "vector", "proprietati", "semn"],
    statement: "Se citeste un vector cu n numere intregi nenule. Verificati, folosind metoda Divide et Impera, daca semnul elementelor alterneaza, adica oricare doua elemente vecine au semne diferite (unul pozitiv, celalalt negativ).",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9, a[i] != 0",
    hints: "Aceeasi structura ca la alternanta de paritate, dar conditia de legatura devine (a[mij] > 0) != (a[mij+1] > 0).",
    explanation: "Se aplica acelasi tipar Divide et Impera folosit pentru monotonie si alternanta de paritate, doar ca predicatul comparat la granita celor doua jumatati este semnul elementelor.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
bool alterneaza(int st, int dr) {
    if (st == dr) return true;
    int mij = (st + dr) / 2;
    bool semnDiferit = (a[mij] > 0) != (a[mij + 1] > 0);
    return alterneaza(st, mij) && alterneaza(mij + 1, dr) && semnDiferit;
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << (alterneaza(0, n - 1) ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def alterneaza(a, st, dr):
    if st == dr:
        return True
    mij = (st + dr) // 2
    semn_diferit = (a[mij] > 0) != (a[mij + 1] > 0)
    return alterneaza(a, st, mij) and alterneaza(a, mij + 1, dr) and semn_diferit

n = int(input())
a = list(map(int, input().split()))
print("DA" if alterneaza(a, 0, n - 1) else "NU")
`,
    tests: ["1\n5", "4\n1 -2 3 -4", "4\n1 -2 -3 4", "5\n-1 2 -3 4 -5", "3\n1 2 -3"],
  },
  {
    slug: "dei-vector-toate-pare",
    title: "DEI: Toate elementele sunt pare",
    difficulty: "easy",
    tags: ["divide-et-impera", "vector", "proprietati", "paritate"],
    statement: "Se citeste un vector cu n numere intregi. Verificati, folosind metoda Divide et Impera, daca toate elementele sale sunt pare.",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Impartiti vectorul in doua jumatati; proprietatea este adevarata pentru tot vectorul doar daca este adevarata in ambele jumatati (SI logic).",
    explanation: "Fiind o proprietate individuala (nu depinde de relatia dintre elemente vecine), combinarea celor doua jumatati se face simplu prin SI logic, fara conditie suplimentara la granita.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
bool toatePare(int st, int dr) {
    if (st == dr) return a[st] % 2 == 0;
    int mij = (st + dr) / 2;
    return toatePare(st, mij) && toatePare(mij + 1, dr);
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << (toatePare(0, n - 1) ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def toate_pare(a, st, dr):
    if st == dr:
        return a[st] % 2 == 0
    mij = (st + dr) // 2
    return toate_pare(a, st, mij) and toate_pare(a, mij + 1, dr)

n = int(input())
a = list(map(int, input().split()))
print("DA" if toate_pare(a, 0, n - 1) else "NU")
`,
    tests: ["1\n4", "4\n2 4 6 8", "4\n2 4 5 8", "3\n-2 -4 0", "2\n1 2"],
  },
  {
    slug: "dei-vector-toate-impare",
    title: "DEI: Toate elementele sunt impare",
    difficulty: "easy",
    tags: ["divide-et-impera", "vector", "proprietati", "paritate"],
    statement: "Se citeste un vector cu n numere intregi. Verificati, folosind metoda Divide et Impera, daca toate elementele sale sunt impare.",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Aceeasi structura ca la 'toate pare', doar ca predicatul verificat in cazul de baza este a[st] % 2 != 0.",
    explanation: "Combinare simpla prin SI logic intre cele doua jumatati, fara conditie de granita, deoarece proprietatea 'impar' se verifica independent pentru fiecare element.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
bool toateImpare(int st, int dr) {
    if (st == dr) return a[st] % 2 != 0;
    int mij = (st + dr) / 2;
    return toateImpare(st, mij) && toateImpare(mij + 1, dr);
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << (toateImpare(0, n - 1) ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def toate_impare(a, st, dr):
    if st == dr:
        return a[st] % 2 != 0
    mij = (st + dr) // 2
    return toate_impare(a, st, mij) and toate_impare(a, mij + 1, dr)

n = int(input())
a = list(map(int, input().split()))
print("DA" if toate_impare(a, 0, n - 1) else "NU")
`,
    tests: ["1\n3", "4\n1 3 5 7", "4\n1 3 4 7", "3\n-1 -3 -5", "2\n2 3"],
  },
  {
    slug: "dei-vector-toate-nule",
    title: "DEI: Toate elementele sunt egale cu zero",
    difficulty: "easy",
    tags: ["divide-et-impera", "vector", "proprietati"],
    statement: "Se citeste un vector cu n numere intregi. Verificati, folosind metoda Divide et Impera, daca toate elementele sale sunt egale cu 0.",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Impartiti vectorul in doua jumatati si combinati rezultatele prin SI logic.",
    explanation: "Proprietate individuala pe fiecare element, combinata simplu prin SI logic intre cele doua jumatati.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
bool toateNule(int st, int dr) {
    if (st == dr) return a[st] == 0;
    int mij = (st + dr) / 2;
    return toateNule(st, mij) && toateNule(mij + 1, dr);
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << (toateNule(0, n - 1) ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def toate_nule(a, st, dr):
    if st == dr:
        return a[st] == 0
    mij = (st + dr) // 2
    return toate_nule(a, st, mij) and toate_nule(a, mij + 1, dr)

n = int(input())
a = list(map(int, input().split()))
print("DA" if toate_nule(a, 0, n - 1) else "NU")
`,
    tests: ["1\n0", "4\n0 0 0 0", "4\n0 0 1 0", "3\n0 0 0", "2\n0 5"],
  },
  {
    slug: "dei-vector-toate-pozitive",
    title: "DEI: Toate elementele sunt pozitive",
    difficulty: "easy",
    tags: ["divide-et-impera", "vector", "proprietati", "semn"],
    statement: "Se citeste un vector cu n numere intregi. Verificati, folosind metoda Divide et Impera, daca toate elementele sale sunt strict pozitive.",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Cazul de baza verifica a[st] > 0, iar combinarea se face prin SI logic.",
    explanation: "Proprietate individuala pe fiecare element, combinata simplu prin SI logic intre cele doua jumatati.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
bool toatePozitive(int st, int dr) {
    if (st == dr) return a[st] > 0;
    int mij = (st + dr) / 2;
    return toatePozitive(st, mij) && toatePozitive(mij + 1, dr);
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << (toatePozitive(0, n - 1) ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def toate_pozitive(a, st, dr):
    if st == dr:
        return a[st] > 0
    mij = (st + dr) // 2
    return toate_pozitive(a, st, mij) and toate_pozitive(a, mij + 1, dr)

n = int(input())
a = list(map(int, input().split()))
print("DA" if toate_pozitive(a, 0, n - 1) else "NU")
`,
    tests: ["1\n1", "4\n1 2 3 4", "4\n1 -2 3 4", "3\n5 10 100", "2\n0 1"],
  },
  {
    slug: "dei-vector-toate-negative",
    title: "DEI: Toate elementele sunt negative",
    difficulty: "easy",
    tags: ["divide-et-impera", "vector", "proprietati", "semn"],
    statement: "Se citeste un vector cu n numere intregi. Verificati, folosind metoda Divide et Impera, daca toate elementele sale sunt strict negative.",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Cazul de baza verifica a[st] < 0, iar combinarea se face prin SI logic.",
    explanation: "Proprietate individuala pe fiecare element, combinata simplu prin SI logic intre cele doua jumatati.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
bool toateNegative(int st, int dr) {
    if (st == dr) return a[st] < 0;
    int mij = (st + dr) / 2;
    return toateNegative(st, mij) && toateNegative(mij + 1, dr);
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << (toateNegative(0, n - 1) ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def toate_negative(a, st, dr):
    if st == dr:
        return a[st] < 0
    mij = (st + dr) // 2
    return toate_negative(a, st, mij) and toate_negative(a, mij + 1, dr)

n = int(input())
a = list(map(int, input().split()))
print("DA" if toate_negative(a, 0, n - 1) else "NU")
`,
    tests: ["1\n-1", "4\n-1 -2 -3 -4", "4\n-1 2 -3 -4", "3\n-5 -10 -100", "2\n0 -1"],
  },
  {
    slug: "dei-vector-toate-nenule",
    title: "DEI: Toate elementele sunt nenule",
    difficulty: "easy",
    tags: ["divide-et-impera", "vector", "proprietati"],
    statement: "Se citeste un vector cu n numere intregi. Verificati, folosind metoda Divide et Impera, daca toate elementele sale sunt diferite de 0.",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Cazul de baza verifica a[st] != 0, iar combinarea se face prin SI logic.",
    explanation: "Proprietate individuala pe fiecare element, combinata simplu prin SI logic intre cele doua jumatati.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
bool toateNenule(int st, int dr) {
    if (st == dr) return a[st] != 0;
    int mij = (st + dr) / 2;
    return toateNenule(st, mij) && toateNenule(mij + 1, dr);
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << (toateNenule(0, n - 1) ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def toate_nenule(a, st, dr):
    if st == dr:
        return a[st] != 0
    mij = (st + dr) // 2
    return toate_nenule(a, st, mij) and toate_nenule(a, mij + 1, dr)

n = int(input())
a = list(map(int, input().split()))
print("DA" if toate_nenule(a, 0, n - 1) else "NU")
`,
    tests: ["1\n5", "4\n1 -2 3 -4", "4\n1 0 3 -4", "3\n-1 -1 -1", "2\n0 0"],
  },
  {
    slug: "dei-vector-exista-par",
    title: "DEI: Exista cel putin un element par",
    difficulty: "easy",
    tags: ["divide-et-impera", "vector", "proprietati", "paritate"],
    statement: "Se citeste un vector cu n numere intregi. Verificati, folosind metoda Divide et Impera, daca exista cel putin un element par in vector.",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Combinati rezultatele celor doua jumatati prin SAU logic, nu prin SI.",
    explanation: "Spre deosebire de problemele 'toate ...', aici cautam existenta unui element cu o proprietate, deci cele doua jumatati se combina prin SAU logic (este suficient ca proprietatea sa fie adevarata intr-o singura jumatate).\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
bool existaPar(int st, int dr) {
    if (st == dr) return a[st] % 2 == 0;
    int mij = (st + dr) / 2;
    return existaPar(st, mij) || existaPar(mij + 1, dr);
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << (existaPar(0, n - 1) ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def exista_par(a, st, dr):
    if st == dr:
        return a[st] % 2 == 0
    mij = (st + dr) // 2
    return exista_par(a, st, mij) or exista_par(a, mij + 1, dr)

n = int(input())
a = list(map(int, input().split()))
print("DA" if exista_par(a, 0, n - 1) else "NU")
`,
    tests: ["1\n3", "1\n4", "5\n1 3 5 7 9", "5\n1 3 5 7 8", "4\n-3 -5 -2 -7"],
  },
  {
    slug: "dei-vector-exista-negativ",
    title: "DEI: Exista cel putin un element negativ",
    difficulty: "easy",
    tags: ["divide-et-impera", "vector", "proprietati", "semn"],
    statement: "Se citeste un vector cu n numere intregi. Verificati, folosind metoda Divide et Impera, daca exista cel putin un element strict negativ in vector.",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Combinati rezultatele celor doua jumatati prin SAU logic.",
    explanation: "La fel ca la existenta unui element par, cele doua jumatati se combina prin SAU logic.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
bool existaNegativ(int st, int dr) {
    if (st == dr) return a[st] < 0;
    int mij = (st + dr) / 2;
    return existaNegativ(st, mij) || existaNegativ(mij + 1, dr);
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << (existaNegativ(0, n - 1) ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def exista_negativ(a, st, dr):
    if st == dr:
        return a[st] < 0
    mij = (st + dr) // 2
    return exista_negativ(a, st, mij) or exista_negativ(a, mij + 1, dr)

n = int(input())
a = list(map(int, input().split()))
print("DA" if exista_negativ(a, 0, n - 1) else "NU")
`,
    tests: ["1\n3", "1\n-3", "4\n1 2 3 4", "4\n1 -2 3 4", "3\n0 0 -1"],
  },
  {
    slug: "dei-vector-toate-multipli-k",
    title: "DEI: Toate elementele sunt multipli ai lui k",
    difficulty: "medium",
    tags: ["divide-et-impera", "vector", "proprietati", "divizibilitate"],
    statement: "Se citesc un vector cu n numere intregi si un numar natural nenul k. Verificati, folosind metoda Divide et Impera, daca toate elementele vectorului sunt multipli ai lui k.",
    input_format: IN_FMT_VEC_K,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9, 1 <= k <= 10^9",
    hints: "Cazul de baza verifica a[st] % k == 0, iar combinarea se face prin SI logic.",
    explanation: "Proprietate individuala verificata pentru fiecare element (a[i] % k == 0), combinata prin SI logic intre cele doua jumatati ale vectorului.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
long long k;
bool toateMultipli(int st, int dr) {
    if (st == dr) return a[st] % k == 0;
    int mij = (st + dr) / 2;
    return toateMultipli(st, mij) && toateMultipli(mij + 1, dr);
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cin >> k;
    cout << (toateMultipli(0, n - 1) ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def toate_multipli(a, st, dr, k):
    if st == dr:
        return a[st] % k == 0
    mij = (st + dr) // 2
    return toate_multipli(a, st, mij, k) and toate_multipli(a, mij + 1, dr, k)

n = int(input())
a = list(map(int, input().split()))
k = int(input())
print("DA" if toate_multipli(a, 0, n - 1, k) else "NU")
`,
    tests: ["4\n3 6 9 12\n3", "4\n3 6 10 12\n3", "1\n5\n5", "3\n0 0 0\n7", "3\n4 8 16\n4"],
  },
  {
    slug: "dei-vector-toate-in-interval",
    title: "DEI: Toate elementele sunt intr-un interval dat",
    difficulty: "medium",
    tags: ["divide-et-impera", "vector", "proprietati"],
    statement: "Se citesc un vector cu n numere intregi si doua numere intregi a si b (a <= b). Verificati, folosind metoda Divide et Impera, daca toate elementele vectorului apartin intervalului [a, b].",
    input_format: IN_FMT_VEC_AB,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= n <= 100000, -10^9 <= v[i] <= 10^9, -10^9 <= a <= b <= 10^9",
    hints: "Cazul de baza verifica a <= v[st] && v[st] <= b, iar combinarea se face prin SI logic.",
    explanation: "Proprietate individuala verificata pentru fiecare element, combinata prin SI logic intre cele doua jumatati ale vectorului.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> v;
long long a, b;
bool toateInInterval(int st, int dr) {
    if (st == dr) return v[st] >= a && v[st] <= b;
    int mij = (st + dr) / 2;
    return toateInInterval(st, mij) && toateInInterval(mij + 1, dr);
}
int main() {
    int n; cin >> n;
    v.resize(n);
    for (int i = 0; i < n; i++) cin >> v[i];
    cin >> a >> b;
    cout << (toateInInterval(0, n - 1) ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def toate_in_interval(v, st, dr, a, b):
    if st == dr:
        return a <= v[st] <= b
    mij = (st + dr) // 2
    return toate_in_interval(v, st, mij, a, b) and toate_in_interval(v, mij + 1, dr, a, b)

n = int(input())
v = list(map(int, input().split()))
a, b = map(int, input().split())
print("DA" if toate_in_interval(v, 0, n - 1, a, b) else "NU")
`,
    tests: ["4\n2 3 4 5\n1 5", "4\n2 3 6 5\n1 5", "1\n10\n10 10", "3\n-2 0 2\n-5 5", "3\n-2 0 6\n-5 5"],
  },
  {
    slug: "dei-vector-palindrom",
    title: "DEI: Vector palindrom",
    difficulty: "medium",
    tags: ["divide-et-impera", "vector", "proprietati", "palindrom"],
    statement: "Se citeste un vector cu n numere intregi. Verificati, folosind metoda Divide et Impera, daca vectorul este palindrom, adica se citeste la fel din ambele capete.",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Reduceti problema comparand extremele: a[st] == a[dr], apoi aplicati aceeasi verificare pe subvectorul ramas dupa eliminarea celor doua extreme.",
    explanation: "Aceasta este o varianta de Divide et Impera care 'ciupeste' cate un element de la fiecare capat: verificam ca extremele sunt egale, apoi reducem problema la subvectorul (st+1, dr-1). Cazul de baza este cand st >= dr (0 sau 1 elemente ramase, mereu palindrom).\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
bool palindrom(int st, int dr) {
    if (st >= dr) return true;
    if (a[st] != a[dr]) return false;
    return palindrom(st + 1, dr - 1);
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << (palindrom(0, n - 1) ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def palindrom(a, st, dr):
    if st >= dr:
        return True
    if a[st] != a[dr]:
        return False
    return palindrom(a, st + 1, dr - 1)

n = int(input())
a = list(map(int, input().split()))
print("DA" if palindrom(a, 0, n - 1) else "NU")
`,
    tests: ["1\n7", "5\n1 2 3 2 1", "4\n1 2 2 1", "5\n1 2 3 4 5", "2\n5 5", "2\n5 6"],
  },

  // ===================== B. AGREGARI PE VECTORI =====================
  {
    slug: "dei-vector-suma",
    title: "DEI: Suma elementelor unui vector",
    difficulty: "easy",
    tags: ["divide-et-impera", "vector", "suma"],
    statement: "Se citeste un vector cu n numere intregi. Determinati, folosind metoda Divide et Impera, suma elementelor sale.",
    input_format: IN_FMT_VEC,
    output_format: "Se afiseaza suma elementelor vectorului.",
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Suma pe intregul vector este suma pe jumatatea stanga plus suma pe jumatatea dreapta.",
    explanation: "Cazul de baza (un singur element) intoarce chiar valoarea elementului. Combinarea celor doua jumatati se face prin adunarea celor doua sume partiale.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
long long suma(int st, int dr) {
    if (st == dr) return a[st];
    int mij = (st + dr) / 2;
    return suma(st, mij) + suma(mij + 1, dr);
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << suma(0, n - 1) << "\\n";
    return 0;
}
`,
    py: `def suma(a, st, dr):
    if st == dr:
        return a[st]
    mij = (st + dr) // 2
    return suma(a, st, mij) + suma(a, mij + 1, dr)

n = int(input())
a = list(map(int, input().split()))
print(suma(a, 0, n - 1))
`,
    tests: ["1\n5", "4\n1 2 3 4", "5\n-1 -2 3 4 5", "3\n0 0 0", "6\n10 -10 20 -20 5 5"],
  },
  {
    slug: "dei-vector-produs",
    title: "DEI: Produsul elementelor unui vector",
    difficulty: "easy",
    tags: ["divide-et-impera", "vector", "produs"],
    statement: "Se citeste un vector cu n numere intregi. Determinati, folosind metoda Divide et Impera, produsul elementelor sale.",
    input_format: IN_FMT_VEC,
    output_format: "Se afiseaza produsul elementelor vectorului.",
    constraints: "1 <= n <= 12, -6 <= a[i] <= 6",
    hints: "Produsul pe intregul vector este produsul pe jumatatea stanga inmultit cu produsul pe jumatatea dreapta.",
    explanation: "Cazul de baza (un singur element) intoarce chiar valoarea elementului. Combinarea celor doua jumatati se face prin inmultirea celor doua produse partiale.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
long long produs(int st, int dr) {
    if (st == dr) return a[st];
    int mij = (st + dr) / 2;
    return produs(st, mij) * produs(mij + 1, dr);
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << produs(0, n - 1) << "\\n";
    return 0;
}
`,
    py: `def produs(a, st, dr):
    if st == dr:
        return a[st]
    mij = (st + dr) // 2
    return produs(a, st, mij) * produs(a, mij + 1, dr)

n = int(input())
a = list(map(int, input().split()))
print(produs(a, 0, n - 1))
`,
    tests: ["1\n5", "3\n2 3 4", "4\n-1 2 -3 4", "3\n0 5 -2", "5\n1 1 1 1 1", "5\n-1 -1 -1 -1 -1"],
  },
  {
    slug: "dei-vector-maxim",
    title: "DEI: Maximul elementelor unui vector",
    difficulty: "easy",
    tags: ["divide-et-impera", "vector", "maxim"],
    statement: "Se citeste un vector cu n numere intregi. Determinati, folosind metoda Divide et Impera, elementul maxim din vector.",
    input_format: IN_FMT_VEC,
    output_format: "Se afiseaza valoarea maxima din vector.",
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Maximul pe intregul vector este maximul dintre maximul jumatatii stangi si maximul jumatatii drepte.",
    explanation: "Cazul de baza (un singur element) intoarce chiar valoarea elementului. Combinarea se face luand maximul celor doua rezultate partiale.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
long long maxim(int st, int dr) {
    if (st == dr) return a[st];
    int mij = (st + dr) / 2;
    return max(maxim(st, mij), maxim(mij + 1, dr));
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << maxim(0, n - 1) << "\\n";
    return 0;
}
`,
    py: `def maxim(a, st, dr):
    if st == dr:
        return a[st]
    mij = (st + dr) // 2
    return max(maxim(a, st, mij), maxim(a, mij + 1, dr))

n = int(input())
a = list(map(int, input().split()))
print(maxim(a, 0, n - 1))
`,
    tests: ["1\n5", "5\n3 1 4 1 5", "4\n-1 -5 -3 -2", "6\n10 20 5 20 3 1", "3\n-100 0 100"],
  },
  {
    slug: "dei-vector-minim",
    title: "DEI: Minimul elementelor unui vector",
    difficulty: "easy",
    tags: ["divide-et-impera", "vector", "minim"],
    statement: "Se citeste un vector cu n numere intregi. Determinati, folosind metoda Divide et Impera, elementul minim din vector.",
    input_format: IN_FMT_VEC,
    output_format: "Se afiseaza valoarea minima din vector.",
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Minimul pe intregul vector este minimul dintre minimul jumatatii stangi si minimul jumatatii drepte.",
    explanation: "Analog problemei maximului: cazul de baza intoarce elementul, iar combinarea se face luand minimul celor doua rezultate partiale.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
long long minim(int st, int dr) {
    if (st == dr) return a[st];
    int mij = (st + dr) / 2;
    return min(minim(st, mij), minim(mij + 1, dr));
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << minim(0, n - 1) << "\\n";
    return 0;
}
`,
    py: `def minim(a, st, dr):
    if st == dr:
        return a[st]
    mij = (st + dr) // 2
    return min(minim(a, st, mij), minim(a, mij + 1, dr))

n = int(input())
a = list(map(int, input().split()))
print(minim(a, 0, n - 1))
`,
    tests: ["1\n5", "5\n3 1 4 1 5", "4\n-1 -5 -3 -2", "6\n10 20 5 20 3 1", "3\n-100 0 100"],
  },
  {
    slug: "dei-vector-numar-elemente-pare",
    title: "DEI: Numarul elementelor pare dintr-un vector",
    difficulty: "easy",
    tags: ["divide-et-impera", "vector", "paritate", "numarare"],
    statement: "Se citeste un vector cu n numere intregi. Determinati, folosind metoda Divide et Impera, cate dintre elementele sale sunt pare.",
    input_format: IN_FMT_VEC,
    output_format: "Se afiseaza numarul elementelor pare.",
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Numarul de elemente pare din tot vectorul este suma numerelor de elemente pare din cele doua jumatati.",
    explanation: "Cazul de baza intoarce 1 daca elementul este par si 0 in caz contrar. Combinarea se face prin adunarea celor doua numaratori partiale.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
long long numarPare(int st, int dr) {
    if (st == dr) return a[st] % 2 == 0 ? 1 : 0;
    int mij = (st + dr) / 2;
    return numarPare(st, mij) + numarPare(mij + 1, dr);
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << numarPare(0, n - 1) << "\\n";
    return 0;
}
`,
    py: `def numar_pare(a, st, dr):
    if st == dr:
        return 1 if a[st] % 2 == 0 else 0
    mij = (st + dr) // 2
    return numar_pare(a, st, mij) + numar_pare(a, mij + 1, dr)

n = int(input())
a = list(map(int, input().split()))
print(numar_pare(a, 0, n - 1))
`,
    tests: ["1\n4", "1\n3", "5\n1 2 3 4 5", "6\n2 4 6 8 10 12", "5\n-2 -3 -4 -5 -6"],
  },
  {
    slug: "dei-vector-suma-elemente-pare",
    title: "DEI: Suma elementelor pare dintr-un vector",
    difficulty: "medium",
    tags: ["divide-et-impera", "vector", "paritate", "suma"],
    statement: "Se citeste un vector cu n numere intregi. Determinati, folosind metoda Divide et Impera, suma elementelor sale pare (0 daca nu exista niciun element par).",
    input_format: IN_FMT_VEC,
    output_format: "Se afiseaza suma elementelor pare.",
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Cazul de baza intoarce elementul daca este par, altfel 0. Combinarea se face prin adunare.",
    explanation: "Cazul de baza intoarce valoarea elementului daca este par, respectiv 0 daca este impar. Combinarea celor doua jumatati se face prin adunarea sumelor partiale.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
long long sumaPare(int st, int dr) {
    if (st == dr) return a[st] % 2 == 0 ? a[st] : 0;
    int mij = (st + dr) / 2;
    return sumaPare(st, mij) + sumaPare(mij + 1, dr);
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << sumaPare(0, n - 1) << "\\n";
    return 0;
}
`,
    py: `def suma_pare(a, st, dr):
    if st == dr:
        return a[st] if a[st] % 2 == 0 else 0
    mij = (st + dr) // 2
    return suma_pare(a, st, mij) + suma_pare(a, mij + 1, dr)

n = int(input())
a = list(map(int, input().split()))
print(suma_pare(a, 0, n - 1))
`,
    tests: ["1\n4", "1\n3", "5\n1 2 3 4 5", "6\n2 4 6 8 10 12", "5\n-2 -3 -4 -5 -6"],
  },
  {
    slug: "dei-vector-numar-multipli-k",
    title: "DEI: Numarul multiplilor lui k dintr-un vector",
    difficulty: "medium",
    tags: ["divide-et-impera", "vector", "divizibilitate", "numarare"],
    statement: "Se citesc un vector cu n numere intregi si un numar natural nenul k. Determinati, folosind metoda Divide et Impera, cate dintre elementele vectorului sunt multipli ai lui k.",
    input_format: IN_FMT_VEC_K,
    output_format: "Se afiseaza numarul elementelor care sunt multipli ai lui k.",
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9, 1 <= k <= 10^9",
    hints: "Cazul de baza intoarce 1 daca a[st] % k == 0, altfel 0. Combinarea se face prin adunare.",
    explanation: "Cazul de baza intoarce 1 daca elementul este multiplu de k, respectiv 0 in caz contrar. Combinarea celor doua jumatati se face prin adunarea numaratorilor partiali.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
long long k;
long long numarMultipli(int st, int dr) {
    if (st == dr) return a[st] % k == 0 ? 1 : 0;
    int mij = (st + dr) / 2;
    return numarMultipli(st, mij) + numarMultipli(mij + 1, dr);
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cin >> k;
    cout << numarMultipli(0, n - 1) << "\\n";
    return 0;
}
`,
    py: `def numar_multipli(a, st, dr, k):
    if st == dr:
        return 1 if a[st] % k == 0 else 0
    mij = (st + dr) // 2
    return numar_multipli(a, st, mij, k) + numar_multipli(a, mij + 1, dr, k)

n = int(input())
a = list(map(int, input().split()))
k = int(input())
print(numar_multipli(a, 0, n - 1, k))
`,
    tests: ["5\n3 6 9 10 12\n3", "1\n5\n5", "1\n5\n3", "6\n4 8 12 16 20 24\n4", "5\n-3 -6 5 9 10\n3"],
  },
  {
    slug: "dei-vector-al-doilea-maxim",
    title: "DEI: Al doilea cel mai mare element dintr-un vector",
    difficulty: "hard",
    tags: ["divide-et-impera", "vector", "maxim"],
    statement: "Se citeste un vector cu n numere intregi (n >= 2). Determinati, folosind metoda Divide et Impera, valoarea celui de-al doilea cel mai mare element din vector (al doilea element din vector, in ordine descrescatoare a valorilor, elementele duplicate fiind considerate separat).",
    input_format: IN_FMT_VEC,
    output_format: "Se afiseaza a doua cea mai mare valoare din vector.",
    constraints: "2 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Fiecare apel recursiv trebuie sa intoarca nu doar maximul, ci primele doua cele mai mari valori din secventa (o pereche). La combinare, alegeti cele mai mari 2 valori dintre cele 4 candidate obtinute din cele doua jumatati.",
    explanation: "Functia recursiva intoarce o pereche (max1, max2) reprezentand primele doua cele mai mari valori din secventa curenta (max2 = -infinit daca secventa are un singur element). La combinarea celor doua jumatati, se aduna cele 4 candidate (max1 si max2 din stanga, max1 si max2 din dreapta), se sorteaza descrescator si se pastreaza primele doua. Raspunsul final este max2 al intregului vector.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
pair<long long, long long> top2(int st, int dr) {
    if (st == dr) return {a[st], -2000000000000LL};
    int mij = (st + dr) / 2;
    auto L = top2(st, mij);
    auto R = top2(mij + 1, dr);
    vector<long long> v = {L.first, L.second, R.first, R.second};
    sort(v.rbegin(), v.rend());
    return {v[0], v[1]};
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    auto rez = top2(0, n - 1);
    cout << rez.second << "\\n";
    return 0;
}
`,
    py: `def top2(a, st, dr):
    if st == dr:
        return (a[st], float("-inf"))
    mij = (st + dr) // 2
    l1, l2 = top2(a, st, mij)
    r1, r2 = top2(a, mij + 1, dr)
    v = sorted([l1, l2, r1, r2], reverse=True)
    return (v[0], v[1])

n = int(input())
a = list(map(int, input().split()))
rez = top2(a, 0, n - 1)
print(int(rez[1]))
`,
    tests: ["2\n5 3", "4\n5 5 3 1", "5\n1 2 3 4 5", "4\n-1 -2 -3 -4", "6\n10 10 10 5 5 1"],
  },

  // ===================== C. MATRICI =====================
  {
    slug: "dei-matrice-suma",
    title: "DEI: Suma elementelor unei matrici",
    difficulty: "medium",
    tags: ["divide-et-impera", "matrice", "suma"],
    statement: "Se citeste o matrice cu n linii si m coloane, cu elemente numere intregi. Determinati, folosind metoda Divide et Impera, suma tuturor elementelor matricii.",
    input_format: "Pe prima linie se citesc numerele naturale n si m. Urmeaza n linii, fiecare continand m numere intregi, separate prin spatiu.",
    output_format: "Se afiseaza suma elementelor matricii.",
    constraints: "1 <= n, m <= 500, -10^6 <= a[i][j] <= 10^6",
    hints: "Liniarizati matricea intr-un vector cu n*m elemente (parcurs pe linii) si aplicati Divide et Impera pe acest vector, exact ca la suma elementelor unui vector.",
    explanation: "Matricea este privita ca un vector liniarizat cu n*m elemente, obtinut prin parcurgerea ei linie cu linie. Pe acest vector se aplica exact acelasi Divide et Impera folosit la suma elementelor unui vector: impartim indexul liniarizat in doua jumatati, calculam suma pe fiecare si le adunam.\n\n**Complexitate:** O(n*m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> v;
long long suma(int st, int dr) {
    if (st == dr) return v[st];
    int mij = (st + dr) / 2;
    return suma(st, mij) + suma(mij + 1, dr);
}
int main() {
    int n, m; cin >> n >> m;
    v.resize(n * m);
    for (int i = 0; i < n * m; i++) cin >> v[i];
    cout << suma(0, n * m - 1) << "\\n";
    return 0;
}
`,
    py: `def suma(v, st, dr):
    if st == dr:
        return v[st]
    mij = (st + dr) // 2
    return suma(v, st, mij) + suma(v, mij + 1, dr)

n, m = map(int, input().split())
v = []
for _ in range(n):
    v.extend(map(int, input().split()))
print(suma(v, 0, n * m - 1))
`,
    tests: ["2 3\n1 2 3\n4 5 6", "1 1\n7", "3 3\n1 1 1\n1 1 1\n1 1 1", "2 2\n-1 2\n3 -4", "1 4\n10 20 30 40"],
  },
  {
    slug: "dei-matrice-toate-egale",
    title: "DEI: Toate elementele unei matrici sunt egale",
    difficulty: "medium",
    tags: ["divide-et-impera", "matrice", "proprietati"],
    statement: "Se citeste o matrice cu n linii si m coloane, cu elemente numere intregi. Verificati, folosind metoda Divide et Impera, daca toate elementele matricii sunt egale intre ele.",
    input_format: "Pe prima linie se citesc numerele naturale n si m. Urmeaza n linii, fiecare continand m numere intregi, separate prin spatiu.",
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= n, m <= 500, -10^6 <= a[i][j] <= 10^6",
    hints: "Liniarizati matricea intr-un vector cu n*m elemente si aplicati aceeasi verificare Divide et Impera folosita la 'toate elementele unui vector sunt egale'.",
    explanation: "Matricea este liniarizata intr-un vector cu n*m elemente. Se aplica exact tehnica Divide et Impera de la vectori: fiecare jumatate trebuie sa aiba toate elementele egale, iar granita dintre jumatati trebuie sa respecte aceeasi egalitate.\n\n**Complexitate:** O(n*m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> v;
bool toateEgale(int st, int dr) {
    if (st == dr) return true;
    int mij = (st + dr) / 2;
    return toateEgale(st, mij) && toateEgale(mij + 1, dr) && v[mij] == v[mij + 1];
}
int main() {
    int n, m; cin >> n >> m;
    v.resize(n * m);
    for (int i = 0; i < n * m; i++) cin >> v[i];
    cout << (toateEgale(0, n * m - 1) ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def toate_egale(v, st, dr):
    if st == dr:
        return True
    mij = (st + dr) // 2
    return toate_egale(v, st, mij) and toate_egale(v, mij + 1, dr) and v[mij] == v[mij + 1]

n, m = map(int, input().split())
v = []
for _ in range(n):
    v.extend(map(int, input().split()))
print("DA" if toate_egale(v, 0, n * m - 1) else "NU")
`,
    tests: ["2 2\n5 5\n5 5", "2 2\n5 5\n5 4", "1 1\n9", "3 1\n2\n2\n2", "1 3\n1 2 1"],
  },
  {
    slug: "dei-matrice-toate-pozitive",
    title: "DEI: Toate elementele unei matrici sunt pozitive",
    difficulty: "medium",
    tags: ["divide-et-impera", "matrice", "proprietati", "semn"],
    statement: "Se citeste o matrice cu n linii si m coloane, cu elemente numere intregi. Verificati, folosind metoda Divide et Impera, daca toate elementele matricii sunt strict pozitive.",
    input_format: "Pe prima linie se citesc numerele naturale n si m. Urmeaza n linii, fiecare continand m numere intregi, separate prin spatiu.",
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= n, m <= 500, -10^6 <= a[i][j] <= 10^6",
    hints: "Liniarizati matricea si aplicati verificarea Divide et Impera folosita la 'toate elementele unui vector sunt pozitive' (SI logic, fara conditie de granita).",
    explanation: "Matricea este liniarizata intr-un vector, iar proprietatea 'pozitiv' este verificata individual pentru fiecare element, combinarea celor doua jumatati facandu-se prin SI logic.\n\n**Complexitate:** O(n*m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> v;
bool toatePozitive(int st, int dr) {
    if (st == dr) return v[st] > 0;
    int mij = (st + dr) / 2;
    return toatePozitive(st, mij) && toatePozitive(mij + 1, dr);
}
int main() {
    int n, m; cin >> n >> m;
    v.resize(n * m);
    for (int i = 0; i < n * m; i++) cin >> v[i];
    cout << (toatePozitive(0, n * m - 1) ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def toate_pozitive(v, st, dr):
    if st == dr:
        return v[st] > 0
    mij = (st + dr) // 2
    return toate_pozitive(v, st, mij) and toate_pozitive(v, mij + 1, dr)

n, m = map(int, input().split())
v = []
for _ in range(n):
    v.extend(map(int, input().split()))
print("DA" if toate_pozitive(v, 0, n * m - 1) else "NU")
`,
    tests: ["2 2\n1 2\n3 4", "2 2\n1 -2\n3 4", "1 1\n5", "1 1\n-5", "2 3\n1 2 3\n4 5 0"],
  },
  {
    slug: "dei-matrice-maxim",
    title: "DEI: Maximul elementelor unei matrici",
    difficulty: "medium",
    tags: ["divide-et-impera", "matrice", "maxim"],
    statement: "Se citeste o matrice cu n linii si m coloane, cu elemente numere intregi. Determinati, folosind metoda Divide et Impera, elementul maxim din matrice.",
    input_format: "Pe prima linie se citesc numerele naturale n si m. Urmeaza n linii, fiecare continand m numere intregi, separate prin spatiu.",
    output_format: "Se afiseaza valoarea maxima din matrice.",
    constraints: "1 <= n, m <= 500, -10^6 <= a[i][j] <= 10^6",
    hints: "Liniarizati matricea si aplicati Divide et Impera exact ca la maximul unui vector.",
    explanation: "Matricea este liniarizata intr-un vector cu n*m elemente, apoi se aplica tehnica standard de aflare a maximului prin Divide et Impera.\n\n**Complexitate:** O(n*m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> v;
long long maxim(int st, int dr) {
    if (st == dr) return v[st];
    int mij = (st + dr) / 2;
    return max(maxim(st, mij), maxim(mij + 1, dr));
}
int main() {
    int n, m; cin >> n >> m;
    v.resize(n * m);
    for (int i = 0; i < n * m; i++) cin >> v[i];
    cout << maxim(0, n * m - 1) << "\\n";
    return 0;
}
`,
    py: `def maxim(v, st, dr):
    if st == dr:
        return v[st]
    mij = (st + dr) // 2
    return max(maxim(v, st, mij), maxim(v, mij + 1, dr))

n, m = map(int, input().split())
v = []
for _ in range(n):
    v.extend(map(int, input().split()))
print(maxim(v, 0, n * m - 1))
`,
    tests: ["2 2\n1 2\n3 4", "1 1\n-5", "2 3\n-1 -2 -3\n-4 -5 -6", "3 3\n5 1 2\n3 9 4\n0 1 2", "1 4\n7 3 9 2"],
  },
  {
    slug: "dei-matrice-numar-pare",
    title: "DEI: Numarul elementelor pare dintr-o matrice",
    difficulty: "medium",
    tags: ["divide-et-impera", "matrice", "paritate", "numarare"],
    statement: "Se citeste o matrice cu n linii si m coloane, cu elemente numere intregi. Determinati, folosind metoda Divide et Impera, cate dintre elementele matricii sunt pare.",
    input_format: "Pe prima linie se citesc numerele naturale n si m. Urmeaza n linii, fiecare continand m numere intregi, separate prin spatiu.",
    output_format: "Se afiseaza numarul elementelor pare din matrice.",
    constraints: "1 <= n, m <= 500, -10^6 <= a[i][j] <= 10^6",
    hints: "Liniarizati matricea si aplicati Divide et Impera exact ca la numararea elementelor pare dintr-un vector.",
    explanation: "Matricea este liniarizata intr-un vector, iar numararea elementelor pare se face prin acelasi Divide et Impera aplicat vectorilor: cazul de baza intoarce 0 sau 1, iar combinarea se face prin adunare.\n\n**Complexitate:** O(n*m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> v;
long long numarPare(int st, int dr) {
    if (st == dr) return v[st] % 2 == 0 ? 1 : 0;
    int mij = (st + dr) / 2;
    return numarPare(st, mij) + numarPare(mij + 1, dr);
}
int main() {
    int n, m; cin >> n >> m;
    v.resize(n * m);
    for (int i = 0; i < n * m; i++) cin >> v[i];
    cout << numarPare(0, n * m - 1) << "\\n";
    return 0;
}
`,
    py: `def numar_pare(v, st, dr):
    if st == dr:
        return 1 if v[st] % 2 == 0 else 0
    mij = (st + dr) // 2
    return numar_pare(v, st, mij) + numar_pare(v, mij + 1, dr)

n, m = map(int, input().split())
v = []
for _ in range(n):
    v.extend(map(int, input().split()))
print(numar_pare(v, 0, n * m - 1))
`,
    tests: ["2 2\n1 2\n3 4", "2 2\n1 3\n5 7", "2 3\n2 4 6\n1 3 5", "1 1\n2", "1 1\n3"],
  },
  {
    slug: "dei-matrice-diagonala-egale",
    title: "DEI: Elementele diagonalei principale sunt egale",
    difficulty: "medium",
    tags: ["divide-et-impera", "matrice", "proprietati", "diagonala"],
    statement: "Se citeste o matrice patratica cu n linii si n coloane, cu elemente numere intregi. Verificati, folosind metoda Divide et Impera, daca toate elementele de pe diagonala principala sunt egale intre ele.",
    input_format: "Pe prima linie se citeste numarul natural n. Urmeaza n linii, fiecare continand n numere intregi, separate prin spatiu.",
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= n <= 500, -10^6 <= a[i][j] <= 10^6",
    hints: "Construiti un vector cu cele n elemente de pe diagonala principala (a[i][i]) si aplicati Divide et Impera pentru 'toate elementele unui vector sunt egale'.",
    explanation: "Elementele diagonalei principale (a[i][i], pentru i de la 0 la n-1) formeaza un vector de n elemente. Pe acest vector se aplica exact tehnica Divide et Impera folosita pentru verificarea egalitatii tuturor elementelor unui vector.\n\n**Complexitate:** O(n^2) pentru citire, O(n) pentru verificare",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> d;
bool toateEgale(int st, int dr) {
    if (st == dr) return true;
    int mij = (st + dr) / 2;
    return toateEgale(st, mij) && toateEgale(mij + 1, dr) && d[mij] == d[mij + 1];
}
int main() {
    int n; cin >> n;
    d.resize(n);
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            long long x; cin >> x;
            if (i == j) d[i] = x;
        }
    }
    cout << (toateEgale(0, n - 1) ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def toate_egale(d, st, dr):
    if st == dr:
        return True
    mij = (st + dr) // 2
    return toate_egale(d, st, mij) and toate_egale(d, mij + 1, dr) and d[mij] == d[mij + 1]

n = int(input())
d = [0] * n
for i in range(n):
    linie = list(map(int, input().split()))
    d[i] = linie[i]
print("DA" if toate_egale(d, 0, n - 1) else "NU")
`,
    tests: ["3\n5 1 2\n0 5 3\n9 8 5", "3\n5 1 2\n0 6 3\n9 8 5", "1\n7", "2\n3 0\n0 3", "2\n3 0\n0 4"],
  },

  // ===================== D. NUMERE =====================
  {
    slug: "dei-numar-divizori",
    title: "DEI: Numarul divizorilor unui numar",
    difficulty: "medium",
    tags: ["divide-et-impera", "numere", "divizori"],
    statement: "Se citeste un numar natural n. Determinati, folosind metoda Divide et Impera, numarul divizorilor naturali ai lui n (inclusiv 1 si n).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza numarul divizorilor lui n.",
    constraints: "1 <= n <= 5000",
    hints: "Aplicati Divide et Impera nu pe un vector, ci direct pe intervalul de candidati [1, n]: impartiti intervalul in doua, numarati divizorii gasiti in fiecare jumatate si adunati rezultatele.",
    explanation: "Spre deosebire de problemele anterioare, aici Divide et Impera se aplica direct pe intervalul de valori candidate [1, n], nu pe un vector citit din date. Cazul de baza (un singur candidat st) verifica daca n % st == 0. Combinarea celor doua jumatati se face prin adunarea numarului de divizori gasiti in fiecare.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long n;
long long numarDivizori(long long st, long long dr) {
    if (st == dr) return n % st == 0 ? 1 : 0;
    long long mij = (st + dr) / 2;
    return numarDivizori(st, mij) + numarDivizori(mij + 1, dr);
}
int main() {
    cin >> n;
    cout << numarDivizori(1, n) << "\\n";
    return 0;
}
`,
    py: `def numar_divizori(n, st, dr):
    if st == dr:
        return 1 if n % st == 0 else 0
    mij = (st + dr) // 2
    return numar_divizori(n, st, mij) + numar_divizori(n, mij + 1, dr)

n = int(input())
print(numar_divizori(n, 1, n))
`,
    tests: ["1", "6", "12", "17", "5000"],
  },
  {
    slug: "dei-numar-suma-divizori",
    title: "DEI: Suma divizorilor unui numar",
    difficulty: "medium",
    tags: ["divide-et-impera", "numere", "divizori", "suma"],
    statement: "Se citeste un numar natural n. Determinati, folosind metoda Divide et Impera, suma divizorilor naturali ai lui n (inclusiv 1 si n).",
    input_format: "Se citeste un numar natural n.",
    output_format: "Se afiseaza suma divizorilor lui n.",
    constraints: "1 <= n <= 5000",
    hints: "Aplicati Divide et Impera pe intervalul de candidati [1, n]: cazul de baza intoarce st daca st este divizor al lui n, altfel 0, iar combinarea se face prin adunare.",
    explanation: "Divide et Impera se aplica direct pe intervalul [1, n] al candidatilor la divizor. Cazul de baza intoarce valoarea candidatului daca este divizor al lui n, respectiv 0 in caz contrar. Combinarea celor doua jumatati se face prin adunarea sumelor partiale.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long n;
long long sumaDivizori(long long st, long long dr) {
    if (st == dr) return n % st == 0 ? st : 0;
    long long mij = (st + dr) / 2;
    return sumaDivizori(st, mij) + sumaDivizori(mij + 1, dr);
}
int main() {
    cin >> n;
    cout << sumaDivizori(1, n) << "\\n";
    return 0;
}
`,
    py: `def suma_divizori(n, st, dr):
    if st == dr:
        return st if n % st == 0 else 0
    mij = (st + dr) // 2
    return suma_divizori(n, st, mij) + suma_divizori(n, mij + 1, dr)

n = int(input())
print(suma_divizori(n, 1, n))
`,
    tests: ["1", "6", "12", "17", "28"],
  },
  {
    slug: "dei-numar-divizori-interval",
    title: "DEI: Numarul divizorilor unui numar aflati intr-un interval",
    difficulty: "hard",
    tags: ["divide-et-impera", "numere", "divizori"],
    statement: "Se citesc un numar natural n si doua numere naturale a si b (1 <= a <= b <= n). Determinati, folosind metoda Divide et Impera, cati divizori ai lui n se afla in intervalul [a, b].",
    input_format: "Pe prima linie se citeste numarul natural n. Pe a doua linie se citesc doua numere naturale a si b (1 <= a <= b <= n), reprezentand capetele intervalului.",
    output_format: "Se afiseaza numarul divizorilor lui n aflati in intervalul [a, b].",
    constraints: "1 <= n <= 5000, 1 <= a <= b <= n",
    hints: "Aplicati Divide et Impera direct pe intervalul [a, b] dat, la fel ca la numararea divizorilor pe [1, n], doar ca de aceasta data capetele intervalului sunt a si b.",
    explanation: "Aceeasi tehnica de la 'numarul divizorilor unui numar', dar aplicata direct pe intervalul [a, b] primit ca date de intrare, nu neaparat pe intreg intervalul [1, n]. Cazul de baza verifica daca n % st == 0, iar combinarea se face prin adunare.\n\n**Complexitate:** O(b - a)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long n;
long long numarDivizoriInterval(long long st, long long dr) {
    if (st == dr) return n % st == 0 ? 1 : 0;
    long long mij = (st + dr) / 2;
    return numarDivizoriInterval(st, mij) + numarDivizoriInterval(mij + 1, dr);
}
int main() {
    long long a, b; cin >> n; cin >> a >> b;
    cout << numarDivizoriInterval(a, b) << "\\n";
    return 0;
}
`,
    py: `def numar_divizori_interval(n, st, dr):
    if st == dr:
        return 1 if n % st == 0 else 0
    mij = (st + dr) // 2
    return numar_divizori_interval(n, st, mij) + numar_divizori_interval(n, mij + 1, dr)

n = int(input())
a, b = map(int, input().split())
print(numar_divizori_interval(n, a, b))
`,
    tests: ["12\n1 6", "12\n5 12", "100\n1 10", "17\n2 16", "1\n1 1"],
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
