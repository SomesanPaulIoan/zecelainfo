const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade10", chapter: "divide-et-impera", sub: "dei-sortare" };

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
const OUT_FMT_VEC = "Se afiseaza cele n numere ale vectorului, in ordinea ceruta, separate prin spatiu, pe o singura linie.";

const problems = [
  {
    slug: "dei-sort-mergesort-crescator",
    title: "Merge Sort: sortare crescatoare",
    difficulty: "easy",
    tags: ["divide-et-impera", "sortare", "merge-sort"],
    statement: "Se citeste un vector cu n numere intregi. Sortati vectorul crescator, implementand algoritmul Merge Sort (Divide et Impera): impartiti vectorul in doua jumatati, sortati recursiv fiecare jumatate, apoi interclasati cele doua jumatati sortate.",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_VEC,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Interclasarea (merge) parcurge simultan cele doua jumatati sortate si alege de fiecare data cel mai mic dintre elementele curente.",
    explanation: "Merge Sort este algoritmul Divide et Impera clasic pentru sortare: vectorul este impartit in doua jumatati aproximativ egale, fiecare este sortata recursiv (cazul de baza fiind o secventa cu cel mult un element, deja sortata), iar cele doua jumatati sortate sunt interclasate intr-un vector auxiliar, comparand de fiecare data elementele curente din cele doua jumatati si alegand pe cel mai mic.\n\n**Complexitate:** O(n log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a, tmp;
void mergeSort(int st, int dr) {
    if (st >= dr) return;
    int mij = (st + dr) / 2;
    mergeSort(st, mij);
    mergeSort(mij + 1, dr);
    int i = st, j = mij + 1, k = st;
    while (i <= mij && j <= dr) {
        if (a[i] <= a[j]) tmp[k++] = a[i++];
        else tmp[k++] = a[j++];
    }
    while (i <= mij) tmp[k++] = a[i++];
    while (j <= dr) tmp[k++] = a[j++];
    for (int t = st; t <= dr; t++) a[t] = tmp[t];
}
int main() {
    int n; cin >> n;
    a.resize(n); tmp.resize(n);
    for (auto &x : a) cin >> x;
    mergeSort(0, n - 1);
    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\\n');
    return 0;
}
`,
    py: `def merge_sort(a, st, dr):
    if st >= dr:
        return
    mij = (st + dr) // 2
    merge_sort(a, st, mij)
    merge_sort(a, mij + 1, dr)
    tmp = []
    i, j = st, mij + 1
    while i <= mij and j <= dr:
        if a[i] <= a[j]:
            tmp.append(a[i]); i += 1
        else:
            tmp.append(a[j]); j += 1
    while i <= mij:
        tmp.append(a[i]); i += 1
    while j <= dr:
        tmp.append(a[j]); j += 1
    a[st:dr + 1] = tmp

n = int(input())
a = list(map(int, input().split()))
merge_sort(a, 0, n - 1)
print(" ".join(map(str, a)))
`,
    tests: ["1\n5", "6\n5 3 8 1 9 2", "5\n-3 -1 -2 0 5", "6\n4 4 2 2 1 1", "8\n10 -10 5 -5 0 3 -3 7"],
  },
  {
    slug: "dei-sort-quicksort-crescator",
    title: "Quicksort: sortare crescatoare",
    difficulty: "easy",
    tags: ["divide-et-impera", "sortare", "quicksort"],
    statement: "Se citeste un vector cu n numere intregi. Sortati vectorul crescator, implementand algoritmul Quicksort (Divide et Impera): alegeti un pivot, partitionati vectorul astfel incat elementele mai mici sau egale cu pivotul sa fie inaintea lui, iar cele mai mari dupa el, apoi sortati recursiv cele doua parti.",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_VEC,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Folositi ultimul element al secventei ca pivot si partitionati cu doi indici, ca in schema Lomuto.",
    explanation: "Quicksort este celalalt algoritm clasic de sortare bazat pe Divide et Impera: se alege un pivot (aici, ultimul element al secventei), se partitioneaza secventa astfel incat toate elementele <= pivot sa ajunga inaintea lui, iar restul dupa, apoi se sorteaza recursiv cele doua parti obtinute. Spre deosebire de Merge Sort, Quicksort nu foloseste vector auxiliar pentru sortarea propriu-zisa, ci lucreaza direct 'pe loc' (in-place).\n\n**Complexitate:** O(n log n) in medie, O(n^2) in cazul defavorabil",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
int partitionare(int st, int dr) {
    long long pivot = a[dr];
    int i = st - 1;
    for (int j = st; j < dr; j++) {
        if (a[j] <= pivot) {
            i++;
            swap(a[i], a[j]);
        }
    }
    swap(a[i + 1], a[dr]);
    return i + 1;
}
void quickSort(int st, int dr) {
    if (st >= dr) return;
    int p = partitionare(st, dr);
    quickSort(st, p - 1);
    quickSort(p + 1, dr);
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (auto &x : a) cin >> x;
    quickSort(0, n - 1);
    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\\n');
    return 0;
}
`,
    py: `def partitionare(a, st, dr):
    pivot = a[dr]
    i = st - 1
    for j in range(st, dr):
        if a[j] <= pivot:
            i += 1
            a[i], a[j] = a[j], a[i]
    a[i + 1], a[dr] = a[dr], a[i + 1]
    return i + 1

def quick_sort(a, st, dr):
    if st >= dr:
        return
    p = partitionare(a, st, dr)
    quick_sort(a, st, p - 1)
    quick_sort(a, p + 1, dr)

n = int(input())
a = list(map(int, input().split()))
quick_sort(a, 0, n - 1)
print(" ".join(map(str, a)))
`,
    tests: ["1\n5", "6\n5 3 8 1 9 2", "5\n-3 -1 -2 0 5", "6\n4 4 2 2 1 1", "8\n10 -10 5 -5 0 3 -3 7"],
  },
  {
    slug: "dei-sort-mergesort-descrescator",
    title: "Merge Sort: sortare descrescatoare",
    difficulty: "easy",
    tags: ["divide-et-impera", "sortare", "merge-sort"],
    statement: "Se citeste un vector cu n numere intregi. Sortati vectorul descrescator, implementand algoritmul Merge Sort (Divide et Impera).",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_VEC,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Modificati pasul de interclasare astfel incat sa alegeti de fiecare data elementul mai mare dintre cele doua elemente curente.",
    explanation: "Aceeasi structura Merge Sort ca la sortarea crescatoare, singura schimbare fiind conditia de interclasare: se alege elementul mai mare dintre cele doua elemente curente, nu mai micul.\n\n**Complexitate:** O(n log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a, tmp;
void mergeSort(int st, int dr) {
    if (st >= dr) return;
    int mij = (st + dr) / 2;
    mergeSort(st, mij);
    mergeSort(mij + 1, dr);
    int i = st, j = mij + 1, k = st;
    while (i <= mij && j <= dr) {
        if (a[i] >= a[j]) tmp[k++] = a[i++];
        else tmp[k++] = a[j++];
    }
    while (i <= mij) tmp[k++] = a[i++];
    while (j <= dr) tmp[k++] = a[j++];
    for (int t = st; t <= dr; t++) a[t] = tmp[t];
}
int main() {
    int n; cin >> n;
    a.resize(n); tmp.resize(n);
    for (auto &x : a) cin >> x;
    mergeSort(0, n - 1);
    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\\n');
    return 0;
}
`,
    py: `def merge_sort(a, st, dr):
    if st >= dr:
        return
    mij = (st + dr) // 2
    merge_sort(a, st, mij)
    merge_sort(a, mij + 1, dr)
    tmp = []
    i, j = st, mij + 1
    while i <= mij and j <= dr:
        if a[i] >= a[j]:
            tmp.append(a[i]); i += 1
        else:
            tmp.append(a[j]); j += 1
    while i <= mij:
        tmp.append(a[i]); i += 1
    while j <= dr:
        tmp.append(a[j]); j += 1
    a[st:dr + 1] = tmp

n = int(input())
a = list(map(int, input().split()))
merge_sort(a, 0, n - 1)
print(" ".join(map(str, a)))
`,
    tests: ["1\n5", "6\n5 3 8 1 9 2", "5\n-3 -1 -2 0 5", "6\n4 4 2 2 1 1", "8\n10 -10 5 -5 0 3 -3 7"],
  },
  {
    slug: "dei-sort-quicksort-descrescator",
    title: "Quicksort: sortare descrescatoare",
    difficulty: "easy",
    tags: ["divide-et-impera", "sortare", "quicksort"],
    statement: "Se citeste un vector cu n numere intregi. Sortati vectorul descrescator, implementand algoritmul Quicksort (Divide et Impera).",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_VEC,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Modificati conditia de partitionare astfel incat elementele mai mari sau egale cu pivotul sa ajunga inaintea lui.",
    explanation: "Aceeasi structura Quicksort ca la sortarea crescatoare, singura schimbare fiind conditia de partitionare: elementele mai mari sau egale cu pivotul trec inaintea lui.\n\n**Complexitate:** O(n log n) in medie, O(n^2) in cazul defavorabil",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
int partitionare(int st, int dr) {
    long long pivot = a[dr];
    int i = st - 1;
    for (int j = st; j < dr; j++) {
        if (a[j] >= pivot) {
            i++;
            swap(a[i], a[j]);
        }
    }
    swap(a[i + 1], a[dr]);
    return i + 1;
}
void quickSort(int st, int dr) {
    if (st >= dr) return;
    int p = partitionare(st, dr);
    quickSort(st, p - 1);
    quickSort(p + 1, dr);
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (auto &x : a) cin >> x;
    quickSort(0, n - 1);
    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\\n');
    return 0;
}
`,
    py: `def partitionare(a, st, dr):
    pivot = a[dr]
    i = st - 1
    for j in range(st, dr):
        if a[j] >= pivot:
            i += 1
            a[i], a[j] = a[j], a[i]
    a[i + 1], a[dr] = a[dr], a[i + 1]
    return i + 1

def quick_sort(a, st, dr):
    if st >= dr:
        return
    p = partitionare(a, st, dr)
    quick_sort(a, st, p - 1)
    quick_sort(a, p + 1, dr)

n = int(input())
a = list(map(int, input().split()))
quick_sort(a, 0, n - 1)
print(" ".join(map(str, a)))
`,
    tests: ["1\n5", "6\n5 3 8 1 9 2", "5\n-3 -1 -2 0 5", "6\n4 4 2 2 1 1", "8\n10 -10 5 -5 0 3 -3 7"],
  },
  {
    slug: "dei-sort-mergesort-valoare-absoluta",
    title: "Merge Sort: sortare crescatoare dupa valoarea absoluta",
    difficulty: "medium",
    tags: ["divide-et-impera", "sortare", "merge-sort"],
    statement: "Se citeste un vector cu n numere intregi. Sortati vectorul crescator dupa valoarea absoluta a elementelor, folosind algoritmul Merge Sort (Divide et Impera). Daca doua elemente au aceeasi valoare absoluta, cel cu valoarea mai mica (negativul) trebuie sa apara inaintea celui pozitiv.",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_VEC,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Definiti o 'cheie de comparare' formata din perechea (valoare absoluta, valoare) si comparati elementele dupa aceasta cheie, in loc de valoarea bruta.",
    explanation: "Se foloseste acelasi Merge Sort ca la sortarea simpla, dar comparatia dintre doua elemente x si y nu se mai face direct, ci pe baza cheii (|x|, x): mai intai se compara valorile absolute, iar la egalitate se compara valorile propriu-zise (astfel incat -3 sa apara inaintea lui 3).\n\n**Complexitate:** O(n log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a, tmp;
bool maiMicEgal(long long x, long long y) {
    long long ax = llabs(x), ay = llabs(y);
    if (ax != ay) return ax < ay;
    return x <= y;
}
void mergeSort(int st, int dr) {
    if (st >= dr) return;
    int mij = (st + dr) / 2;
    mergeSort(st, mij);
    mergeSort(mij + 1, dr);
    int i = st, j = mij + 1, k = st;
    while (i <= mij && j <= dr) {
        if (maiMicEgal(a[i], a[j])) tmp[k++] = a[i++];
        else tmp[k++] = a[j++];
    }
    while (i <= mij) tmp[k++] = a[i++];
    while (j <= dr) tmp[k++] = a[j++];
    for (int t = st; t <= dr; t++) a[t] = tmp[t];
}
int main() {
    int n; cin >> n;
    a.resize(n); tmp.resize(n);
    for (auto &x : a) cin >> x;
    mergeSort(0, n - 1);
    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\\n');
    return 0;
}
`,
    py: `def cheie(x):
    return (abs(x), x)

def merge_sort(a, st, dr):
    if st >= dr:
        return
    mij = (st + dr) // 2
    merge_sort(a, st, mij)
    merge_sort(a, mij + 1, dr)
    tmp = []
    i, j = st, mij + 1
    while i <= mij and j <= dr:
        if cheie(a[i]) <= cheie(a[j]):
            tmp.append(a[i]); i += 1
        else:
            tmp.append(a[j]); j += 1
    while i <= mij:
        tmp.append(a[i]); i += 1
    while j <= dr:
        tmp.append(a[j]); j += 1
    a[st:dr + 1] = tmp

n = int(input())
a = list(map(int, input().split()))
merge_sort(a, 0, n - 1)
print(" ".join(map(str, a)))
`,
    tests: ["1\n-4", "5\n3 -1 -5 2 4", "6\n-3 3 -2 2 -1 1", "6\n0 -7 7 -3 3 1", "6\n-10 2 -2 10 1 -1"],
  },
  {
    slug: "dei-sort-quicksort-paritate",
    title: "Quicksort: elementele pare inaintea celor impare",
    difficulty: "medium",
    tags: ["divide-et-impera", "sortare", "quicksort", "paritate"],
    statement: "Se citeste un vector cu n numere intregi. Rearanjati vectorul, folosind algoritmul Quicksort (Divide et Impera), astfel incat toate elementele pare sa apara inaintea celor impare, iar in interiorul fiecarui grup elementele sa fie in ordine crescatoare.",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_VEC,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Definiti o cheie de comparare (rang_paritate, valoare), unde rang_paritate este 0 pentru numere pare si 1 pentru numere impare, apoi comparati elementele dupa aceasta cheie in Quicksort.",
    explanation: "Se foloseste acelasi Quicksort ca la sortarea simpla, dar comparatia dintre doua elemente se face pe baza cheii (rang_paritate, valoare): elementele pare (rang 0) preced intotdeauna elementele impare (rang 1), iar in interiorul aceluiasi rang de paritate ordinea este data de valoare.\n\n**Complexitate:** O(n log n) in medie, O(n^2) in cazul defavorabil",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
pair<long long, long long> cheie(long long x) {
    long long rang = (x % 2 == 0) ? 0 : 1;
    return {rang, x};
}
int partitionare(int st, int dr) {
    auto pivot = cheie(a[dr]);
    int i = st - 1;
    for (int j = st; j < dr; j++) {
        if (cheie(a[j]) <= pivot) {
            i++;
            swap(a[i], a[j]);
        }
    }
    swap(a[i + 1], a[dr]);
    return i + 1;
}
void quickSort(int st, int dr) {
    if (st >= dr) return;
    int p = partitionare(st, dr);
    quickSort(st, p - 1);
    quickSort(p + 1, dr);
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (auto &x : a) cin >> x;
    quickSort(0, n - 1);
    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\\n');
    return 0;
}
`,
    py: `def cheie(x):
    rang = 0 if x % 2 == 0 else 1
    return (rang, x)

def partitionare(a, st, dr):
    pivot = cheie(a[dr])
    i = st - 1
    for j in range(st, dr):
        if cheie(a[j]) <= pivot:
            i += 1
            a[i], a[j] = a[j], a[i]
    a[i + 1], a[dr] = a[dr], a[i + 1]
    return i + 1

def quick_sort(a, st, dr):
    if st >= dr:
        return
    p = partitionare(a, st, dr)
    quick_sort(a, st, p - 1)
    quick_sort(a, p + 1, dr)

n = int(input())
a = list(map(int, input().split()))
quick_sort(a, 0, n - 1)
print(" ".join(map(str, a)))
`,
    tests: ["1\n4", "6\n5 2 8 1 4 3", "5\n-3 -2 -4 5 1", "6\n2 2 2 1 1 1", "7\n9 8 7 6 5 4 3"],
  },
  {
    slug: "dei-sort-mergesort-numar-divizori",
    title: "Merge Sort: sortare dupa numarul de divizori",
    difficulty: "medium",
    tags: ["divide-et-impera", "sortare", "merge-sort", "divizori"],
    statement: "Se citeste un vector cu n numere naturale nenule. Sortati vectorul crescator dupa numarul de divizori naturali ai fiecarui element, folosind algoritmul Merge Sort (Divide et Impera). Daca doua elemente au acelasi numar de divizori, cel mai mic dintre ele trebuie sa apara primul.",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_VEC,
    constraints: "1 <= n <= 1000, 1 <= a[i] <= 1000",
    hints: "Calculati pentru fiecare element numarul lui de divizori (printr-o functie separata, in O(sqrt(a[i]))), apoi folositi cheia (numar_divizori, valoare) in Merge Sort.",
    explanation: "Numarul de divizori ai fiecarui element se calculeaza separat, printr-o parcurgere pana la radacina patrata a valorii. Sortarea propriu-zisa foloseste Merge Sort Divide et Impera, comparand elementele dupa cheia (numar_divizori, valoare), astfel incat la numar egal de divizori sa castige valoarea mai mica.\n\n**Complexitate:** O(n log n + n * sqrt(max(a[i])))",
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long numarDivizori(long long x) {
    long long cnt = 0;
    for (long long d = 1; d * d <= x; d++) {
        if (x % d == 0) {
            cnt++;
            if (d != x / d) cnt++;
        }
    }
    return cnt;
}
vector<long long> a, tmp;
bool maiMicEgal(long long x, long long y) {
    long long nx = numarDivizori(x), ny = numarDivizori(y);
    if (nx != ny) return nx < ny;
    return x <= y;
}
void mergeSort(int st, int dr) {
    if (st >= dr) return;
    int mij = (st + dr) / 2;
    mergeSort(st, mij);
    mergeSort(mij + 1, dr);
    int i = st, j = mij + 1, k = st;
    while (i <= mij && j <= dr) {
        if (maiMicEgal(a[i], a[j])) tmp[k++] = a[i++];
        else tmp[k++] = a[j++];
    }
    while (i <= mij) tmp[k++] = a[i++];
    while (j <= dr) tmp[k++] = a[j++];
    for (int t = st; t <= dr; t++) a[t] = tmp[t];
}
int main() {
    int n; cin >> n;
    a.resize(n); tmp.resize(n);
    for (auto &x : a) cin >> x;
    mergeSort(0, n - 1);
    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\\n');
    return 0;
}
`,
    py: `def numar_divizori(x):
    cnt = 0
    d = 1
    while d * d <= x:
        if x % d == 0:
            cnt += 1
            if d != x // d:
                cnt += 1
        d += 1
    return cnt

def cheie(x):
    return (numar_divizori(x), x)

def merge_sort(a, st, dr):
    if st >= dr:
        return
    mij = (st + dr) // 2
    merge_sort(a, st, mij)
    merge_sort(a, mij + 1, dr)
    tmp = []
    i, j = st, mij + 1
    while i <= mij and j <= dr:
        if cheie(a[i]) <= cheie(a[j]):
            tmp.append(a[i]); i += 1
        else:
            tmp.append(a[j]); j += 1
    while i <= mij:
        tmp.append(a[i]); i += 1
    while j <= dr:
        tmp.append(a[j]); j += 1
    a[st:dr + 1] = tmp

n = int(input())
a = list(map(int, input().split()))
merge_sort(a, 0, n - 1)
print(" ".join(map(str, a)))
`,
    tests: ["1\n7", "5\n12 7 8 9 16", "6\n1 2 3 4 5 6", "4\n17 19 23 29", "6\n36 12 24 18 6 48"],
  },
  {
    slug: "dei-sort-quicksort-ultima-cifra",
    title: "Quicksort: sortare dupa ultima cifra",
    difficulty: "medium",
    tags: ["divide-et-impera", "sortare", "quicksort", "cifre"],
    statement: "Se citeste un vector cu n numere intregi. Sortati vectorul crescator dupa ultima cifra a valorii absolute a fiecarui element, folosind algoritmul Quicksort (Divide et Impera). Daca doua elemente au aceeasi ultima cifra, cel mai mic dintre ele trebuie sa apara primul.",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_VEC,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Cheia de comparare pentru fiecare element x este (|x| % 10, x).",
    explanation: "Se foloseste acelasi Quicksort ca la sortarea simpla, dar comparatia se face pe baza cheii (ultima cifra a lui |x|, x), astfel incat elementele cu aceeasi ultima cifra sa fie ordonate crescator dupa valoare.\n\n**Complexitate:** O(n log n) in medie, O(n^2) in cazul defavorabil",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
pair<long long, long long> cheie(long long x) {
    return {llabs(x) % 10, x};
}
int partitionare(int st, int dr) {
    auto pivot = cheie(a[dr]);
    int i = st - 1;
    for (int j = st; j < dr; j++) {
        if (cheie(a[j]) <= pivot) {
            i++;
            swap(a[i], a[j]);
        }
    }
    swap(a[i + 1], a[dr]);
    return i + 1;
}
void quickSort(int st, int dr) {
    if (st >= dr) return;
    int p = partitionare(st, dr);
    quickSort(st, p - 1);
    quickSort(p + 1, dr);
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (auto &x : a) cin >> x;
    quickSort(0, n - 1);
    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\\n');
    return 0;
}
`,
    py: `def cheie(x):
    return (abs(x) % 10, x)

def partitionare(a, st, dr):
    pivot = cheie(a[dr])
    i = st - 1
    for j in range(st, dr):
        if cheie(a[j]) <= pivot:
            i += 1
            a[i], a[j] = a[j], a[i]
    a[i + 1], a[dr] = a[dr], a[i + 1]
    return i + 1

def quick_sort(a, st, dr):
    if st >= dr:
        return
    p = partitionare(a, st, dr)
    quick_sort(a, st, p - 1)
    quick_sort(a, p + 1, dr)

n = int(input())
a = list(map(int, input().split()))
quick_sort(a, 0, n - 1)
print(" ".join(map(str, a)))
`,
    tests: ["1\n23", "6\n21 34 15 42 13 7", "5\n-11 -22 -33 5 16", "4\n10 20 30 40", "6\n99 88 77 66 55 44"],
  },
  {
    slug: "dei-sort-mergesort-suma-cifre",
    title: "Merge Sort: sortare dupa suma cifrelor",
    difficulty: "medium",
    tags: ["divide-et-impera", "sortare", "merge-sort", "cifre"],
    statement: "Se citeste un vector cu n numere intregi. Sortati vectorul crescator dupa suma cifrelor valorii absolute a fiecarui element, folosind algoritmul Merge Sort (Divide et Impera). Daca doua elemente au aceeasi suma a cifrelor, cel mai mic dintre ele trebuie sa apara primul.",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_VEC,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Calculati suma cifrelor lui |x| printr-o functie separata, apoi folositi cheia (suma_cifre, valoare) in Merge Sort.",
    explanation: "Suma cifrelor fiecarui element se calculeaza separat, extragand cifrele valorii absolute una cate una. Sortarea propriu-zisa foloseste Merge Sort Divide et Impera, comparand elementele dupa cheia (suma_cifre, valoare).\n\n**Complexitate:** O(n log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long sumaCifre(long long x) {
    x = llabs(x);
    long long s = 0;
    while (x > 0) { s += x % 10; x /= 10; }
    return s;
}
vector<long long> a, tmp;
bool maiMicEgal(long long x, long long y) {
    long long sx = sumaCifre(x), sy = sumaCifre(y);
    if (sx != sy) return sx < sy;
    return x <= y;
}
void mergeSort(int st, int dr) {
    if (st >= dr) return;
    int mij = (st + dr) / 2;
    mergeSort(st, mij);
    mergeSort(mij + 1, dr);
    int i = st, j = mij + 1, k = st;
    while (i <= mij && j <= dr) {
        if (maiMicEgal(a[i], a[j])) tmp[k++] = a[i++];
        else tmp[k++] = a[j++];
    }
    while (i <= mij) tmp[k++] = a[i++];
    while (j <= dr) tmp[k++] = a[j++];
    for (int t = st; t <= dr; t++) a[t] = tmp[t];
}
int main() {
    int n; cin >> n;
    a.resize(n); tmp.resize(n);
    for (auto &x : a) cin >> x;
    mergeSort(0, n - 1);
    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\\n');
    return 0;
}
`,
    py: `def suma_cifre(x):
    x = abs(x)
    s = 0
    while x > 0:
        s += x % 10
        x //= 10
    return s

def cheie(x):
    return (suma_cifre(x), x)

def merge_sort(a, st, dr):
    if st >= dr:
        return
    mij = (st + dr) // 2
    merge_sort(a, st, mij)
    merge_sort(a, mij + 1, dr)
    tmp = []
    i, j = st, mij + 1
    while i <= mij and j <= dr:
        if cheie(a[i]) <= cheie(a[j]):
            tmp.append(a[i]); i += 1
        else:
            tmp.append(a[j]); j += 1
    while i <= mij:
        tmp.append(a[i]); i += 1
    while j <= dr:
        tmp.append(a[j]); j += 1
    a[st:dr + 1] = tmp

n = int(input())
a = list(map(int, input().split()))
merge_sort(a, 0, n - 1)
print(" ".join(map(str, a)))
`,
    tests: ["1\n123", "6\n29 38 47 56 91 10", "5\n-19 91 100 5 14", "4\n0 10 100 1", "6\n99 18 27 36 45 9"],
  },
  {
    slug: "dei-sort-quicksort-frecventa",
    title: "Quicksort: sortare descrescatoare dupa frecventa",
    difficulty: "hard",
    tags: ["divide-et-impera", "sortare", "quicksort", "frecventa"],
    statement: "Se citeste un vector cu n numere intregi. Rearanjati vectorul, folosind algoritmul Quicksort (Divide et Impera), astfel incat elementele care apar de mai multe ori in vector sa preceada elementele cu frecventa mai mica. Daca doua elemente au aceeasi frecventa, cel mai mic dintre ele trebuie sa apara primul.",
    input_format: IN_FMT_VEC,
    output_format: OUT_FMT_VEC,
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Calculati mai intai frecventa fiecarei valori (de exemplu intr-un map), apoi folositi cheia (-frecventa, valoare) in Quicksort, astfel incat frecventele mari sa fie 'mici' ca si cheie si sa ajunga primele.",
    explanation: "Se calculeaza mai intai, printr-o parcurgere separata, frecventa fiecarei valori distincte din vector. Sortarea propriu-zisa foloseste Quicksort Divide et Impera, comparand elementele dupa cheia (-frecventa, valoare): frecventa mai mare inseamna cheie mai mica (deci elementul ajunge mai devreme), iar la frecvente egale castiga valoarea mai mica.\n\n**Complexitate:** O(n log n) in medie pentru sortare, plus O(n log n) pentru calculul frecventelor",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
map<long long, long long> frecventa;
pair<long long, long long> cheie(long long x) {
    return {-frecventa[x], x};
}
int partitionare(int st, int dr) {
    auto pivot = cheie(a[dr]);
    int i = st - 1;
    for (int j = st; j < dr; j++) {
        if (cheie(a[j]) <= pivot) {
            i++;
            swap(a[i], a[j]);
        }
    }
    swap(a[i + 1], a[dr]);
    return i + 1;
}
void quickSort(int st, int dr) {
    if (st >= dr) return;
    int p = partitionare(st, dr);
    quickSort(st, p - 1);
    quickSort(p + 1, dr);
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (auto &x : a) { cin >> x; frecventa[x]++; }
    quickSort(0, n - 1);
    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\\n');
    return 0;
}
`,
    py: `def partitionare(a, st, dr, frecventa):
    def cheie(x):
        return (-frecventa[x], x)
    pivot = cheie(a[dr])
    i = st - 1
    for j in range(st, dr):
        if cheie(a[j]) <= pivot:
            i += 1
            a[i], a[j] = a[j], a[i]
    a[i + 1], a[dr] = a[dr], a[i + 1]
    return i + 1

def quick_sort(a, st, dr, frecventa):
    if st >= dr:
        return
    p = partitionare(a, st, dr, frecventa)
    quick_sort(a, st, p - 1, frecventa)
    quick_sort(a, p + 1, dr, frecventa)

n = int(input())
a = list(map(int, input().split()))
frecventa = {}
for x in a:
    frecventa[x] = frecventa.get(x, 0) + 1
quick_sort(a, 0, n - 1, frecventa)
print(" ".join(map(str, a)))
`,
    tests: ["1\n5", "6\n1 2 2 3 3 3", "7\n5 5 1 1 1 9 9", "4\n4 4 4 4", "8\n1 1 2 2 2 3 4 4"],
  },
  {
    slug: "dei-sort-mergesort-numar-inversiuni",
    title: "Merge Sort: numararea inversiunilor",
    difficulty: "hard",
    tags: ["divide-et-impera", "merge-sort", "inversiuni"],
    statement: "Se citeste un vector cu n numere intregi. Determinati numarul de inversiuni ale vectorului, adica numarul de perechi de pozitii (i, j) cu i < j si a[i] > a[j], folosind o varianta a algoritmului Merge Sort (Divide et Impera) care numara inversiunile chiar in timpul interclasarii, fara a compara toate perechile de elemente.",
    input_format: IN_FMT_VEC,
    output_format: "Se afiseaza numarul de inversiuni ale vectorului.",
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9",
    hints: "Cand, in timpul interclasarii, se alege un element din jumatatea dreapta inaintea unui element ramas in jumatatea stanga, toate elementele ramase in jumatatea stanga formeaza cate o inversiune cu el.",
    explanation: "Se modifica Merge Sort astfel incat sa intoarca, pe langa vectorul sortat, si numarul de inversiuni. Inversiunile 'interne' fiecarei jumatati sunt numarate recursiv. Inversiunile 'incrucisate' (un element din stanga mai mare decat unul din dreapta) se numara in timpul interclasarii: de fiecare data cand se alege un element din jumatatea dreapta inaintea celor ramase in stanga, toate cele (mij - i + 1) elemente inca neconsumate din stanga formeaza cate o inversiune cu el, deoarece sunt mai mari decat el si se aflau inaintea lui in vectorul original.\n\n**Complexitate:** O(n log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a, tmp;
long long mergeSort(int st, int dr) {
    if (st >= dr) return 0;
    int mij = (st + dr) / 2;
    long long inv = mergeSort(st, mij) + mergeSort(mij + 1, dr);
    int i = st, j = mij + 1, k = st;
    while (i <= mij && j <= dr) {
        if (a[i] <= a[j]) {
            tmp[k++] = a[i++];
        } else {
            inv += (mij - i + 1);
            tmp[k++] = a[j++];
        }
    }
    while (i <= mij) tmp[k++] = a[i++];
    while (j <= dr) tmp[k++] = a[j++];
    for (int t = st; t <= dr; t++) a[t] = tmp[t];
    return inv;
}
int main() {
    int n; cin >> n;
    a.resize(n); tmp.resize(n);
    for (auto &x : a) cin >> x;
    cout << mergeSort(0, n - 1) << "\\n";
    return 0;
}
`,
    py: `def merge_sort(a, st, dr):
    if st >= dr:
        return 0
    mij = (st + dr) // 2
    inv = merge_sort(a, st, mij) + merge_sort(a, mij + 1, dr)
    tmp = []
    i, j = st, mij + 1
    while i <= mij and j <= dr:
        if a[i] <= a[j]:
            tmp.append(a[i]); i += 1
        else:
            inv += (mij - i + 1)
            tmp.append(a[j]); j += 1
    while i <= mij:
        tmp.append(a[i]); i += 1
    while j <= dr:
        tmp.append(a[j]); j += 1
    a[st:dr + 1] = tmp
    return inv

n = int(input())
a = list(map(int, input().split()))
print(merge_sort(a, 0, n - 1))
`,
    tests: ["1\n5", "5\n5 4 3 2 1", "5\n1 2 3 4 5", "6\n2 4 1 3 5 6", "4\n1 3 2 4"],
  },
  {
    slug: "dei-sort-quicksort-selectie-al-k-lea",
    title: "Quickselect: al k-lea cel mai mic element",
    difficulty: "hard",
    tags: ["divide-et-impera", "quicksort", "quickselect", "selectie"],
    statement: "Se citesc un vector cu n numere intregi si un numar natural k (1 <= k <= n). Determinati al k-lea cel mai mic element din vector (elementul de pe pozitia k, daca vectorul ar fi sortat crescator), folosind algoritmul Quickselect: o varianta Divide et Impera a algoritmului Quicksort care, dupa fiecare partitionare, continua recursiv doar in partea care contine pozitia cautata, fara a mai sorta si cealalta parte.",
    input_format: "Pe prima linie se citeste numarul natural n. Pe a doua linie se citesc cele n numere intregi ale vectorului, separate prin spatiu. Pe a treia linie se citeste numarul natural k (1 <= k <= n).",
    output_format: "Se afiseaza al k-lea cel mai mic element din vector.",
    constraints: "1 <= n <= 100000, -10^9 <= a[i] <= 10^9, 1 <= k <= n",
    hints: "Dupa partitionare, pozitia finala p a pivotului este exact rangul lui in vectorul sortat. Daca k corespunde acestei pozitii, pivotul este raspunsul; altfel, continuati recursiv doar in jumatatea in care s-ar afla pozitia k.",
    explanation: "Quickselect foloseste aceeasi partitionare ca Quicksort, dar, spre deosebire de Quicksort, nu mai apeleaza recursiv pe ambele parti: dupa ce pivotul ajunge pe pozitia finala p, se compara rangul sau (p - st + 1) cu k. Daca sunt egale, pivotul este raspunsul; daca k este mai mic, se continua doar in partea stanga; altfel, se continua doar in partea dreapta, cautand al (k - rang) -lea cel mai mic element din acea parte. Astfel se evita sortarea completa a vectorului.\n\n**Complexitate:** O(n) in medie, O(n^2) in cazul defavorabil",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<long long> a;
int partitionare(int st, int dr) {
    long long pivot = a[dr];
    int i = st - 1;
    for (int j = st; j < dr; j++) {
        if (a[j] <= pivot) {
            i++;
            swap(a[i], a[j]);
        }
    }
    swap(a[i + 1], a[dr]);
    return i + 1;
}
long long quickSelect(int st, int dr, int k) {
    if (st == dr) return a[st];
    int p = partitionare(st, dr);
    int pozitie = p - st + 1;
    if (k == pozitie) return a[p];
    if (k < pozitie) return quickSelect(st, p - 1, k);
    return quickSelect(p + 1, dr, k - pozitie);
}
int main() {
    int n; cin >> n;
    a.resize(n);
    for (auto &x : a) cin >> x;
    int k; cin >> k;
    cout << quickSelect(0, n - 1, k) << "\\n";
    return 0;
}
`,
    py: `def partitionare(a, st, dr):
    pivot = a[dr]
    i = st - 1
    for j in range(st, dr):
        if a[j] <= pivot:
            i += 1
            a[i], a[j] = a[j], a[i]
    a[i + 1], a[dr] = a[dr], a[i + 1]
    return i + 1

def quick_select(a, st, dr, k):
    if st == dr:
        return a[st]
    p = partitionare(a, st, dr)
    pozitie = p - st + 1
    if k == pozitie:
        return a[p]
    if k < pozitie:
        return quick_select(a, st, p - 1, k)
    return quick_select(a, p + 1, dr, k - pozitie)

n = int(input())
a = list(map(int, input().split()))
k = int(input())
print(quick_select(a, 0, n - 1, k))
`,
    tests: ["5\n7 2 9 4 1\n1", "5\n7 2 9 4 1\n5", "5\n7 2 9 4 1\n3", "6\n5 5 5 1 1 9\n4", "1\n42\n1"],
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
