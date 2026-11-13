const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade10", chapter: "siruri-caractere", sub: "operatii-cu-siruri" };

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

const IN_FMT_2S = "Pe prima linie se citeste sirul s1. Pe a doua linie se citeste sirul s2.";
const OUT_FMT_DA_NU = "Se afiseaza DA daca proprietatea este adevarata, respectiv NU in caz contrar.";
const IN_FMT_PROPOZITIE = "Se citeste o propozitie, pe o singura linie, in care cuvintele sunt separate printr-un singur spatiu (fara spatii la inceput sau la sfarsit).";

const problems = [
  {
    slug: "op-comparare-lexicografica",
    title: "Compararea lexicografica a doua siruri",
    difficulty: "easy",
    tags: ["siruri", "operatii-cu-siruri", "comparare"],
    statement: "Se citesc doua siruri de caractere s1 si s2. Comparati-le lexicografic (ca in dictionar, pe baza codurilor ASCII ale caracterelor) si afisati -1 daca s1 este mai mic decat s2, 0 daca sunt egale, respectiv 1 daca s1 este mai mare decat s2.",
    input_format: IN_FMT_2S,
    output_format: "Se afiseaza -1, 0 sau 1.",
    constraints: "1 <= lungimea sirurilor <= 200",
    hints: "Comparati caracter cu caracter pana gasiti o diferenta sau pana se termina unul dintre siruri; daca un sir este prefix al celuilalt, cel mai scurt este mai mic.",
    explanation: "Se parcurg simultan cele doua siruri pana la prima pozitie in care caracterele difera sau pana cand se termina unul dintre siruri. Daca s-a gasit o diferenta, rezultatul e dat de compararea celor doua caractere; altfel, sirul mai scurt este considerat mai mic, iar daca ambele s-au terminat simultan, sirurile sunt egale.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s1; getline(cin, s1);
    string s2; getline(cin, s2);
    int n1 = s1.size(), n2 = s2.size();
    int i = 0;
    while (i < n1 && i < n2 && s1[i] == s2[i]) i++;
    int rez;
    if (i == n1 && i == n2) rez = 0;
    else if (i == n1) rez = -1;
    else if (i == n2) rez = 1;
    else rez = (s1[i] < s2[i]) ? -1 : 1;
    cout << rez << "\\n";
    return 0;
}
`,
    py: `s1 = input()
s2 = input()
n1, n2 = len(s1), len(s2)
i = 0
while i < n1 and i < n2 and s1[i] == s2[i]:
    i += 1
if i == n1 and i == n2:
    rez = 0
elif i == n1:
    rez = -1
elif i == n2:
    rez = 1
else:
    rez = -1 if s1[i] < s2[i] else 1
print(rez)
`,
    tests: ["abc\nabd", "abc\nabc", "ab\nabc", "abc\nab", "Zebra\napple"],
  },
  {
    slug: "op-concatenare",
    title: "Concatenarea a doua siruri",
    difficulty: "easy",
    tags: ["siruri", "operatii-cu-siruri", "concatenare"],
    statement: "Se citesc doua siruri de caractere s1 si s2. Construiti si afisati sirul obtinut prin concatenarea lor (s1 urmat de s2).",
    input_format: IN_FMT_2S,
    output_format: "Se afiseaza sirul concatenat, pe o singura linie.",
    constraints: "1 <= lungimea sirurilor <= 200",
    hints: "Construiti sirul rezultat adaugand, pe rand, caracterele lui s1 si apoi caracterele lui s2.",
    explanation: "Se construieste sirul rezultat parcurgand mai intai caracterele lui s1 si adaugandu-le la rezultat, apoi parcurgand caracterele lui s2 si adaugandu-le, de asemenea, la rezultat.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s1; getline(cin, s1);
    string s2; getline(cin, s2);
    string rez = "";
    for (char c : s1) rez += c;
    for (char c : s2) rez += c;
    cout << rez << "\\n";
    return 0;
}
`,
    py: `s1 = input()
s2 = input()
rez = ""
for c in s1:
    rez += c
for c in s2:
    rez += c
print(rez)
`,
    tests: ["Ana \nare mere", "abc\ndef", "Programare\nin C++", "12\n34", "x\ny"],
  },
  {
    slug: "op-copiere-partiala",
    title: "Copierea primelor k caractere ale unui sir",
    difficulty: "easy",
    tags: ["siruri", "operatii-cu-siruri", "copiere"],
    statement: "Se citesc un sir de caractere s si un numar natural k (0 <= k <= lungimea lui s). Copiati primele k caractere ale lui s intr-un sir nou si afisati-l.",
    input_format: "Pe prima linie se citeste sirul s. Pe a doua linie se citeste numarul natural k.",
    output_format: "Se afiseaza sirul rezultat (primele k caractere), pe o singura linie.",
    constraints: "1 <= lungimea sirului s <= 200, 0 <= k <= lungimea sirului s",
    hints: "Parcurgeti primele k pozitii ale lui s si adaugati caracterele intr-un sir nou.",
    explanation: "Se construieste sirul rezultat parcurgand primele k pozitii ale sirului s si copiind caracter cu caracter.\n\n**Complexitate:** O(k)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int k; cin >> k;
    string rez = "";
    for (int i = 0; i < k; i++) rez += s[i];
    cout << rez << "\\n";
    return 0;
}
`,
    py: `s = input()
k = int(input())
rez = ""
for i in range(k):
    rez += s[i]
print(rez)
`,
    tests: ["programare\n4", "informatica\n0", "abc\n3", "Ana are mere\n7", "xyz\n3"],
  },
  {
    slug: "op-cauta-subsir",
    title: "Cautarea primei aparitii a unui subsir (strstr)",
    difficulty: "medium",
    tags: ["siruri", "operatii-cu-siruri", "cautare"],
    statement: "Se citesc un text si un subsir (pattern). Determinati pozitia (indexata de la 0) primei aparitii a subsirului in text. Daca subsirul nu apare in text, afisati -1.",
    input_format: "Pe prima linie se citeste textul. Pe a doua linie se citeste subsirul cautat.",
    output_format: "Se afiseaza pozitia primei aparitii, sau -1 daca subsirul nu apare.",
    constraints: "1 <= lungimea textului <= 200, 1 <= lungimea subsirului <= 200",
    hints: "Pentru fiecare pozitie de start posibila din text, verificati daca subsirul se potriveste caracter cu caracter incepand de acolo.",
    explanation: "Se incearca, pentru fiecare pozitie de start i din text (astfel incat sa mai incapa subsirul), o potrivire caracter cu caracter intre text[i..i+m-1] si subsir. Se opreste la prima potrivire completa gasita.\n\n**Complexitate:** O(n * m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string text; getline(cin, text);
    string pat; getline(cin, pat);
    int n = text.size(), m = pat.size();
    int poz = -1;
    for (int i = 0; i + m <= n; i++) {
        bool ok = true;
        for (int j = 0; j < m; j++) if (text[i + j] != pat[j]) { ok = false; break; }
        if (ok) { poz = i; break; }
    }
    cout << poz << "\\n";
    return 0;
}
`,
    py: `text = input()
pat = input()
n, m = len(text), len(pat)
poz = -1
for i in range(n - m + 1):
    ok = True
    for j in range(m):
        if text[i + j] != pat[j]:
            ok = False
            break
    if ok:
        poz = i
        break
print(poz)
`,
    tests: ["ana are mere\nare", "programare\ngram", "abcabcabc\nbca", "hello\nz", "aaaa\naaaaa"],
  },
  {
    slug: "op-numar-aparitii-subsir",
    title: "Numarul de aparitii ale unui subsir intr-un text",
    difficulty: "medium",
    tags: ["siruri", "operatii-cu-siruri", "cautare"],
    statement: "Se citesc un text si un subsir (pattern). Determinati de cate ori apare subsirul in text (aparitiile se pot suprapune, adica se numara toate pozitiile de start valide la care se potriveste).",
    input_format: "Pe prima linie se citeste textul. Pe a doua linie se citeste subsirul cautat.",
    output_format: "Se afiseaza numarul de aparitii.",
    constraints: "1 <= lungimea textului <= 200, 1 <= lungimea subsirului <= 200",
    hints: "Verificati fiecare pozitie de start posibila, ca la cautarea unui subsir, dar continuati sa numarati toate potrivirile, nu doar prima.",
    explanation: "Pentru fiecare pozitie de start i din text se verifica daca subsirul se potriveste caracter cu caracter incepand de acolo; de fiecare data cand se gaseste o potrivire, se incrementeaza un contor (fara a sari peste caracterele deja folosite, deci aparitiile se pot suprapune).\n\n**Complexitate:** O(n * m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string text; getline(cin, text);
    string pat; getline(cin, pat);
    int n = text.size(), m = pat.size();
    int cnt = 0;
    for (int i = 0; i + m <= n; i++) {
        bool ok = true;
        for (int j = 0; j < m; j++) if (text[i + j] != pat[j]) { ok = false; break; }
        if (ok) cnt++;
    }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `text = input()
pat = input()
n, m = len(text), len(pat)
cnt = 0
for i in range(n - m + 1):
    ok = True
    for j in range(m):
        if text[i + j] != pat[j]:
            ok = False
            break
    if ok:
        cnt += 1
print(cnt)
`,
    tests: ["aaaa\naa", "abababab\nab", "mississippi\nissi", "banana\nna", "xyz\nw"],
  },
  {
    slug: "op-extrage-subsir",
    title: "Extragerea unui subsir dintr-un sir (substr)",
    difficulty: "easy",
    tags: ["siruri", "operatii-cu-siruri", "substring"],
    statement: "Se citesc un sir de caractere s si doua numere naturale poz si lung. Extrageti si afisati subsirul lui s format din lung caractere, incepand de la pozitia poz (indexata de la 0).",
    input_format: "Pe prima linie se citeste sirul s. Pe a doua linie se citesc numerele poz si lung.",
    output_format: "Se afiseaza subsirul extras.",
    constraints: "1 <= lungimea sirului s <= 200, 0 <= poz, 0 <= lung, poz + lung <= lungimea sirului s",
    hints: "Parcurgeti pozitiile de la poz la poz+lung-1 si adaugati caracterele intr-un sir rezultat.",
    explanation: "Se construieste sirul rezultat copiind caracterele de pe pozitiile poz, poz+1, ..., poz+lung-1 din sirul original.\n\n**Complexitate:** O(lung)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int poz, lung; cin >> poz >> lung;
    string rez = "";
    for (int i = 0; i < lung; i++) rez += s[poz + i];
    cout << rez << "\\n";
    return 0;
}
`,
    py: `s = input()
poz, lung = map(int, input().split())
rez = ""
for i in range(lung):
    rez += s[poz + i]
print(rez)
`,
    tests: ["programare\n0 4", "informatica\n4 7", "abcdef\n2 3", "Ana are mere\n4 3", "xyz\n0 3"],
  },
  {
    slug: "op-cauta-caracter",
    title: "Cautarea primei aparitii a unui caracter (strchr)",
    difficulty: "easy",
    tags: ["siruri", "operatii-cu-siruri", "cautare"],
    statement: "Se citesc un sir de caractere s si un caracter c. Determinati pozitia (indexata de la 0) primei aparitii a lui c in s. Daca c nu apare, afisati -1.",
    input_format: "Pe prima linie se citeste sirul s. Pe a doua linie se citeste caracterul c.",
    output_format: "Se afiseaza pozitia primei aparitii, sau -1.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Parcurgeti sirul de la stanga la dreapta si opriti-va la prima pozitie unde apare c.",
    explanation: "Se parcurge sirul de la stanga la dreapta; de indata ce se gaseste caracterul c, se retine pozitia curenta si se opreste cautarea.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    string cs; getline(cin, cs);
    char c = cs[0];
    int poz = -1;
    for (int i = 0; i < (int)s.size(); i++) if (s[i] == c) { poz = i; break; }
    cout << poz << "\\n";
    return 0;
}
`,
    py: `s = input()
c = input()[0]
poz = -1
for i in range(len(s)):
    if s[i] == c:
        poz = i
        break
print(poz)
`,
    tests: ["banana\na", "programare\nz", "abcdef\nc", "Mississippi\nM", "xxxxx\nx"],
  },
  {
    slug: "op-cauta-ultima-pozitie-caracter",
    title: "Cautarea ultimei aparitii a unui caracter (strrchr)",
    difficulty: "easy",
    tags: ["siruri", "operatii-cu-siruri", "cautare"],
    statement: "Se citesc un sir de caractere s si un caracter c. Determinati pozitia (indexata de la 0) ultimei aparitii a lui c in s. Daca c nu apare, afisati -1.",
    input_format: "Pe prima linie se citeste sirul s. Pe a doua linie se citeste caracterul c.",
    output_format: "Se afiseaza pozitia ultimei aparitii, sau -1.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Parcurgeti tot sirul retinand de fiecare data cand gasiti caracterul c cea mai recenta pozitie.",
    explanation: "Se parcurge intreg sirul si, de fiecare data cand se gaseste caracterul c, se actualizeaza pozitia retinuta; la finalul parcurgerii, aceasta este ultima aparitie.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    string cs; getline(cin, cs);
    char c = cs[0];
    int poz = -1;
    for (int i = 0; i < (int)s.size(); i++) if (s[i] == c) poz = i;
    cout << poz << "\\n";
    return 0;
}
`,
    py: `s = input()
c = input()[0]
poz = -1
for i in range(len(s)):
    if s[i] == c:
        poz = i
print(poz)
`,
    tests: ["banana\na", "programare\nz", "abcdef\nc", "Mississippi\ni", "xxxxx\nx"],
  },
  {
    slug: "op-inlocuire-caracter",
    title: "Inlocuirea tuturor aparitiilor unui caracter cu altul",
    difficulty: "easy",
    tags: ["siruri", "operatii-cu-siruri", "inlocuire"],
    statement: "Se citesc un sir de caractere s si doua caractere c1 si c2. Afisati sirul obtinut din s prin inlocuirea tuturor aparitiilor lui c1 cu c2.",
    input_format: "Pe prima linie se citeste sirul s. Pe a doua linie se citeste caracterul c1. Pe a treia linie se citeste caracterul c2.",
    output_format: "Se afiseaza sirul rezultat, pe o singura linie.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Parcurgeti sirul si, pentru fiecare caracter egal cu c1, adaugati c2 in rezultat; altfel, adaugati caracterul original.",
    explanation: "Se construieste sirul rezultat parcurgand sirul original si inlocuind fiecare aparitie a lui c1 cu c2, celelalte caractere ramanand neschimbate.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    string c1s; getline(cin, c1s);
    string c2s; getline(cin, c2s);
    char c1 = c1s[0], c2 = c2s[0];
    for (char &c : s) if (c == c1) c = c2;
    cout << s << "\\n";
    return 0;
}
`,
    py: `s = input()
c1 = input()[0]
c2 = input()[0]
rez = []
for c in s:
    rez.append(c2 if c == c1 else c)
print("".join(rez))
`,
    tests: ["banana\na\no", "programare\nr\nR", "abcabc\nb\nZ", "aaaa\na\nb", "xyz\nq\nw"],
  },
  {
    slug: "op-inlocuire-subsir",
    title: "Inlocuirea tuturor aparitiilor unui subsir cu altul",
    difficulty: "hard",
    tags: ["siruri", "operatii-cu-siruri", "inlocuire"],
    statement: "Se citesc un text, un subsir vechi si un subsir nou. Parcurgand textul de la stanga la dreapta, inlocuiti fiecare aparitie (fara suprapunere) a subsirului vechi cu subsirul nou si afisati rezultatul.",
    input_format: "Pe prima linie se citeste textul. Pe a doua linie se citeste subsirul vechi. Pe a treia linie se citeste subsirul nou.",
    output_format: "Se afiseaza sirul rezultat, pe o singura linie.",
    constraints: "1 <= lungimea textului <= 200, 1 <= lungimea subsirului vechi <= 200",
    hints: "Parcurgeti textul cu un indice i; daca de la pozitia i incepe o potrivire cu subsirul vechi, adaugati subsirul nou in rezultat si avansati i cu lungimea subsirului vechi; altfel, copiati caracterul curent si avansati i cu 1.",
    explanation: "Se parcurge textul cu un singur indice i. Ori de cate ori subsirul vechi se potriveste incepand din pozitia i, se adauga subsirul nou in rezultat si i avanseaza cu lungimea subsirului vechi (astfel incat aparitiile inlocuite sa nu se suprapuna); altfel, se copiaza caracterul curent si i avanseaza cu 1.\n\n**Complexitate:** O(n * m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
bool potriveste(const string &text, int i, const string &pat) {
    int m = pat.size();
    if (i + m > (int)text.size()) return false;
    for (int j = 0; j < m; j++) if (text[i + j] != pat[j]) return false;
    return true;
}
int main() {
    string text; getline(cin, text);
    string vechi; getline(cin, vechi);
    string nou; getline(cin, nou);
    string rez = "";
    int i = 0, n = text.size(), m = vechi.size();
    while (i < n) {
        if (potriveste(text, i, vechi)) {
            rez += nou;
            i += m;
        } else {
            rez += text[i];
            i++;
        }
    }
    cout << rez << "\\n";
    return 0;
}
`,
    py: `def potriveste(text, i, pat):
    m = len(pat)
    if i + m > len(text):
        return False
    return text[i:i + m] == pat

text = input()
vechi = input()
nou = input()
rez = ""
i, n, m = 0, len(text), len(vechi)
while i < n:
    if potriveste(text, i, vechi):
        rez += nou
        i += m
    else:
        rez += text[i]
        i += 1
print(rez)
`,
    tests: ["ana are mere\nare\nnu are", "aaaa\naa\nb", "abcabcabc\nabc\nX", "hello world\nworld\nthere", "mississippi\nis\nX"],
  },
  {
    slug: "op-stergere-subsir",
    title: "Stergerea primei aparitii a unui subsir",
    difficulty: "medium",
    tags: ["siruri", "operatii-cu-siruri", "stergere"],
    statement: "Se citesc un text si un subsir. Determinati pozitia primei aparitii a subsirului in text si, daca exista, afisati textul rezultat prin stergerea acelei aparitii. Daca subsirul nu apare in text, afisati textul neschimbat.",
    input_format: "Pe prima linie se citeste textul. Pe a doua linie se citeste subsirul cautat.",
    output_format: "Se afiseaza sirul rezultat, pe o singura linie.",
    constraints: "1 <= lungimea textului <= 200, 1 <= lungimea subsirului <= 200",
    hints: "Gasiti mai intai pozitia primei aparitii, ca la cautarea unui subsir, apoi construiti rezultatul concatenand partea dinainte si partea de dupa acea aparitie.",
    explanation: "Se cauta prima pozitie la care subsirul se potriveste in text. Daca este gasita, rezultatul se obtine concatenand partea din text dinaintea acelei pozitii cu partea de dupa aparitia subsirului; daca nu este gasita nicio potrivire, textul ramane neschimbat.\n\n**Complexitate:** O(n * m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string text; getline(cin, text);
    string pat; getline(cin, pat);
    int n = text.size(), m = pat.size();
    int poz = -1;
    for (int i = 0; i + m <= n; i++) {
        bool ok = true;
        for (int j = 0; j < m; j++) if (text[i + j] != pat[j]) { ok = false; break; }
        if (ok) { poz = i; break; }
    }
    if (poz == -1) { cout << text << "\\n"; return 0; }
    string rez = text.substr(0, poz) + text.substr(poz + m);
    cout << rez << "\\n";
    return 0;
}
`,
    py: `text = input()
pat = input()
n, m = len(text), len(pat)
poz = -1
for i in range(n - m + 1):
    ok = True
    for j in range(m):
        if text[i + j] != pat[j]:
            ok = False
            break
    if ok:
        poz = i
        break
if poz == -1:
    print(text)
else:
    print(text[:poz] + text[poz + m:])
`,
    tests: ["ana are mere\nare", "abcabcabc\nbc", "hello world\nz", "mississippi\nssi", "aaaa\naa"],
  },
  {
    slug: "op-inserare-subsir",
    title: "Inserarea unui subsir la o pozitie data",
    difficulty: "medium",
    tags: ["siruri", "operatii-cu-siruri", "inserare"],
    statement: "Se citesc un sir de caractere text, un subsir si un numar natural poz (0 <= poz <= lungimea lui text). Inserati subsirul in text incepand de la pozitia poz si afisati rezultatul.",
    input_format: "Pe prima linie se citeste textul. Pe a doua linie se citeste subsirul de inserat. Pe a treia linie se citeste numarul poz.",
    output_format: "Se afiseaza sirul rezultat, pe o singura linie.",
    constraints: "1 <= lungimea textului <= 200, 1 <= lungimea subsirului <= 200, 0 <= poz <= lungimea textului",
    hints: "Rezultatul este format din primele poz caractere ale textului, urmate de subsirul de inserat, urmate de restul textului.",
    explanation: "Sirul rezultat se construieste concatenand partea din text de dinaintea pozitiei poz cu subsirul de inserat, apoi cu partea ramasa din text, de la pozitia poz pana la final.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string text; getline(cin, text);
    string sub; getline(cin, sub);
    int poz; cin >> poz;
    string rez = text.substr(0, poz) + sub + text.substr(poz);
    cout << rez << "\\n";
    return 0;
}
`,
    py: `text = input()
sub = input()
poz = int(input())
rez = text[:poz] + sub + text[poz:]
print(rez)
`,
    tests: ["ana mere\nare \n4", "abcdef\nXYZ\n0", "abcdef\nXYZ\n6", "programare\n-\n7", "xy\nAB\n1"],
  },
  {
    slug: "op-prefix-comun",
    title: "Cel mai lung prefix comun a doua siruri",
    difficulty: "easy",
    tags: ["siruri", "operatii-cu-siruri", "prefix"],
    statement: "Se citesc doua siruri de caractere s1 si s2. Determinati cel mai lung prefix comun al celor doua siruri.",
    input_format: IN_FMT_2S,
    output_format: "Se afiseaza cel mai lung prefix comun (eventual sir vid).",
    constraints: "1 <= lungimea sirurilor <= 200",
    hints: "Comparati caracterele de pe aceeasi pozitie din cele doua siruri, atat timp cat coincid.",
    explanation: "Se parcurg simultan cele doua siruri de la inceput, atat timp cat caracterele de pe aceeasi pozitie coincid si nu s-a depasit lungimea vreunui sir; prefixul comun este format din caracterele parcurse pana la prima diferenta.\n\n**Complexitate:** O(min(n, m))",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s1; getline(cin, s1);
    string s2; getline(cin, s2);
    int i = 0;
    while (i < (int)s1.size() && i < (int)s2.size() && s1[i] == s2[i]) i++;
    cout << s1.substr(0, i) << "\\n";
    return 0;
}
`,
    py: `s1 = input()
s2 = input()
i = 0
while i < len(s1) and i < len(s2) and s1[i] == s2[i]:
    i += 1
print(s1[:i])
`,
    tests: ["programare\nprogresie", "abcdef\nabcxyz", "abc\nxyz", "informatica\ninformatie", "test\ntest"],
  },
  {
    slug: "op-sufix-comun",
    title: "Cel mai lung sufix comun a doua siruri",
    difficulty: "easy",
    tags: ["siruri", "operatii-cu-siruri", "sufix"],
    statement: "Se citesc doua siruri de caractere s1 si s2. Determinati cel mai lung sufix comun al celor doua siruri.",
    input_format: IN_FMT_2S,
    output_format: "Se afiseaza cel mai lung sufix comun (eventual sir vid).",
    constraints: "1 <= lungimea sirurilor <= 200",
    hints: "Comparati caracterele de la finalul celor doua siruri, avansand catre inceput, atat timp cat coincid.",
    explanation: "Se parcurg simultan cele doua siruri de la final catre inceput, atat timp cat caracterele coincid si nu s-a depasit lungimea vreunui sir; sufixul comun este format din caracterele parcurse.\n\n**Complexitate:** O(min(n, m))",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s1; getline(cin, s1);
    string s2; getline(cin, s2);
    int n1 = s1.size(), n2 = s2.size();
    int i = 0;
    while (i < n1 && i < n2 && s1[n1 - 1 - i] == s2[n2 - 1 - i]) i++;
    cout << s1.substr(n1 - i) << "\\n";
    return 0;
}
`,
    py: `s1 = input()
s2 = input()
n1, n2 = len(s1), len(s2)
i = 0
while i < n1 and i < n2 and s1[n1 - 1 - i] == s2[n2 - 1 - i]:
    i += 1
print(s1[n1 - i:] if i > 0 else "")
`,
    tests: ["programare\nprimare", "testing\nrunning", "abc\nxyz", "unbelievable\nincredible", "test\ntest"],
  },
  {
    slug: "op-verifica-prefix",
    title: "Verificare daca un sir incepe cu un prefix dat",
    difficulty: "easy",
    tags: ["siruri", "operatii-cu-siruri", "prefix"],
    statement: "Se citesc un sir de caractere text si un sir prefix. Verificati daca text incepe cu prefix.",
    input_format: "Pe prima linie se citeste textul. Pe a doua linie se citeste prefixul.",
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= lungimea textului <= 200, 1 <= lungimea prefixului <= 200",
    hints: "Daca prefixul este mai lung decat textul, raspunsul este NU. Altfel, comparati primele caractere ale textului cu prefixul.",
    explanation: "Daca lungimea prefixului depaseste lungimea textului, raspunsul este direct NU. Altfel, se compara caracter cu caracter primele caractere ale textului cu prefixul dat.\n\n**Complexitate:** O(m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string text; getline(cin, text);
    string pre; getline(cin, pre);
    if (pre.size() > text.size()) { cout << "NU\\n"; return 0; }
    bool ok = true;
    for (int i = 0; i < (int)pre.size(); i++) if (text[i] != pre[i]) ok = false;
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `text = input()
pre = input()
if len(pre) > len(text):
    print("NU")
else:
    ok = True
    for i in range(len(pre)):
        if text[i] != pre[i]:
            ok = False
    print("DA" if ok else "NU")
`,
    tests: ["programare\nprog", "informatica\ninfo", "abc\nabcd", "test\ntes", "hello\nworld"],
  },
  {
    slug: "op-verifica-sufix",
    title: "Verificare daca un sir se termina cu un sufix dat",
    difficulty: "easy",
    tags: ["siruri", "operatii-cu-siruri", "sufix"],
    statement: "Se citesc un sir de caractere text si un sir sufix. Verificati daca text se termina cu sufix.",
    input_format: "Pe prima linie se citeste textul. Pe a doua linie se citeste sufixul.",
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= lungimea textului <= 200, 1 <= lungimea sufixului <= 200",
    hints: "Daca sufixul este mai lung decat textul, raspunsul este NU. Altfel, comparati ultimele caractere ale textului cu sufixul.",
    explanation: "Daca lungimea sufixului depaseste lungimea textului, raspunsul este direct NU. Altfel, se compara caracter cu caracter ultimele caractere ale textului cu sufixul dat.\n\n**Complexitate:** O(m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string text; getline(cin, text);
    string suf; getline(cin, suf);
    int n = text.size(), m = suf.size();
    if (m > n) { cout << "NU\\n"; return 0; }
    bool ok = true;
    for (int i = 0; i < m; i++) if (text[n - m + i] != suf[i]) ok = false;
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `text = input()
suf = input()
n, m = len(text), len(suf)
if m > n:
    print("NU")
else:
    ok = True
    for i in range(m):
        if text[n - m + i] != suf[i]:
            ok = False
    print("DA" if ok else "NU")
`,
    tests: ["programare\nmare", "informatica\ntica", "abcd\nabcd", "test\ntes", "hello\nworld"],
  },
  {
    slug: "op-numar-cuvinte",
    title: "Numararea cuvintelor dintr-un text",
    difficulty: "easy",
    tags: ["siruri", "operatii-cu-siruri", "cuvinte"],
    statement: "Se citeste o propozitie. Determinati numarul de cuvinte pe care le contine.",
    input_format: IN_FMT_PROPOZITIE,
    output_format: "Se afiseaza numarul de cuvinte.",
    constraints: "1 <= lungimea propozitiei <= 200",
    hints: "Un cuvant nou incepe de fiecare data cand un caracter diferit de spatiu este precedat de un spatiu (sau este primul caracter).",
    explanation: "Se parcurge propozitia si se incrementeaza un contor de fiecare data cand se intra intr-un nou cuvant, adica atunci cand caracterul curent nu este spatiu, iar caracterul anterior era spatiu (sau nu exista, fiind inceputul sirului).\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int cnt = 0;
    for (int i = 0; i < (int)s.size(); i++) {
        if (s[i] != ' ' && (i == 0 || s[i - 1] == ' ')) cnt++;
    }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `s = input()
cnt = 0
for i in range(len(s)):
    if s[i] != " " and (i == 0 or s[i - 1] == " "):
        cnt += 1
print(cnt)
`,
    tests: ["Ana are mere", "un singur cuvant aici", "programare", "a b c d e", "Astazi este o zi frumoasa"],
  },
  {
    slug: "op-desparte-cuvinte",
    title: "Despartirea unui text in cuvinte",
    difficulty: "easy",
    tags: ["siruri", "operatii-cu-siruri", "cuvinte"],
    statement: "Se citeste o propozitie. Afisati fiecare cuvant al propozitiei pe cate o linie separata, in ordinea in care apar.",
    input_format: IN_FMT_PROPOZITIE,
    output_format: "Se afiseaza cuvintele, cate unul pe fiecare linie.",
    constraints: "1 <= lungimea propozitiei <= 200",
    hints: "Construiti cuvantul curent caracter cu caracter; cand intalniti un spatiu, afisati cuvantul acumulat si reincepeti.",
    explanation: "Se parcurge propozitia, construind cuvantul curent caracter cu caracter. Cand se intalneste un spatiu, cuvantul acumulat este afisat si se reia constructia unui nou cuvant. La final, ultimul cuvant acumulat este de asemenea afisat.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    string cuvant = "";
    for (char c : s) {
        if (c == ' ') {
            cout << cuvant << "\\n";
            cuvant = "";
        } else {
            cuvant += c;
        }
    }
    cout << cuvant << "\\n";
    return 0;
}
`,
    py: `s = input()
cuvant = ""
for c in s:
    if c == " ":
        print(cuvant)
        cuvant = ""
    else:
        cuvant += c
print(cuvant)
`,
    tests: ["Ana are mere", "un singur cuvant aici", "programare", "a b c", "Astazi este o zi frumoasa"],
  },
  {
    slug: "op-uneste-cuvinte",
    title: "Alaturarea unor cuvinte cu un delimitator",
    difficulty: "easy",
    tags: ["siruri", "operatii-cu-siruri", "cuvinte"],
    statement: "Se citesc un numar natural n, apoi n cuvinte (cate unul pe linie) si un caracter delimitator. Afisati cele n cuvinte alaturate, separate prin caracterul delimitator (fara delimitator la inceput sau la sfarsit).",
    input_format: "Pe prima linie se citeste n. Urmeaza n linii, fiecare continand un cuvant. Pe ultima linie se citeste caracterul delimitator.",
    output_format: "Se afiseaza sirul rezultat, pe o singura linie.",
    constraints: "1 <= n <= 50, 1 <= lungimea fiecarui cuvant <= 20",
    hints: "Adaugati delimitatorul inaintea fiecarui cuvant, cu exceptia primului.",
    explanation: "Se construieste rezultatul adaugand primul cuvant, apoi, pentru fiecare cuvant urmator, se adauga mai intai delimitatorul si apoi cuvantul respectiv.\n\n**Complexitate:** O(suma lungimilor cuvintelor)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n; cin.ignore();
    vector<string> cuvinte(n);
    for (int i = 0; i < n; i++) getline(cin, cuvinte[i]);
    string ds; getline(cin, ds);
    char delim = ds[0];
    string rez = cuvinte[0];
    for (int i = 1; i < n; i++) {
        rez += delim;
        rez += cuvinte[i];
    }
    cout << rez << "\\n";
    return 0;
}
`,
    py: `n = int(input())
cuvinte = [input() for _ in range(n)]
delim = input()[0]
rez = cuvinte[0]
for i in range(1, n):
    rez += delim + cuvinte[i]
print(rez)
`,
    tests: ["3\nAna\nare\nmere\n-", "1\nsolo\n,", "4\n2026\nse\napropie\nrepede\n_", "2\nda\nnu\n/", "5\na\nb\nc\nd\ne\n,"],
  },
  {
    slug: "op-normalizeaza-spatii",
    title: "Normalizarea spatiilor dintr-un sir",
    difficulty: "medium",
    tags: ["siruri", "operatii-cu-siruri", "spatii"],
    statement: "Se citeste un sir de caractere s, care poate contine spatii multiple consecutive si spatii la inceput sau la sfarsit. Afisati sirul obtinut prin eliminarea spatiilor de la inceput si de la sfarsit si inlocuirea oricarui grup de spatii consecutive din interior cu un singur spatiu.",
    input_format: "Se citeste un sir de caractere s, pe o singura linie.",
    output_format: "Se afiseaza sirul normalizat, pe o singura linie.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Adaugati un spatiu in rezultat doar daca rezultatul nu este vid si ultimul caracter adaugat nu este deja spatiu; la final, eliminati un eventual spatiu ramas la sfarsit.",
    explanation: "Se parcurge sirul caracter cu caracter. Un spatiu este adaugat in rezultat doar daca rezultatul nu este vid (deci nu suntem la inceput) si ultimul caracter adaugat nu este deja spatiu (evitand spatiile consecutive). Daca la final rezultatul se termina cu un spatiu (cazul in care sirul original se termina cu spatii), acesta este eliminat.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    string rez = "";
    for (char c : s) {
        if (c == ' ') {
            if (!rez.empty() && rez.back() != ' ') rez += ' ';
        } else {
            rez += c;
        }
    }
    if (!rez.empty() && rez.back() == ' ') rez.pop_back();
    cout << rez << "\\n";
    return 0;
}
`,
    py: `s = input()
rez = ""
for c in s:
    if c == " ":
        if rez and rez[-1] != " ":
            rez += " "
    else:
        rez += c
if rez and rez[-1] == " ":
    rez = rez[:-1]
print(rez)
`,
    tests: ["  Ana   are    mere  ", "fara spatii extra", "   spatii la inceput", "spatii la final   ", "a     b"],
  },
  {
    slug: "op-trim-spatii",
    title: "Eliminarea spatiilor de la inceputul si sfarsitul unui sir",
    difficulty: "easy",
    tags: ["siruri", "operatii-cu-siruri", "spatii"],
    statement: "Se citeste un sir de caractere s, care poate contine spatii la inceput si/sau la sfarsit. Afisati sirul obtinut prin eliminarea acestor spatii (spatiile din interiorul sirului raman neschimbate).",
    input_format: "Se citeste un sir de caractere s, pe o singura linie.",
    output_format: "Se afiseaza sirul rezultat, pe o singura linie.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Gasiti primul si ultimul caracter care nu sunt spatii si extrageti subsirul dintre ele.",
    explanation: "Se determina cel mai mic indice st pentru care s[st] nu este spatiu si cel mai mare indice dr pentru care s[dr] nu este spatiu, apoi se extrage subsirul dintre aceste doua pozitii, inclusiv.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int st = 0, dr = (int)s.size() - 1;
    while (st <= dr && s[st] == ' ') st++;
    while (dr >= st && s[dr] == ' ') dr--;
    if (st > dr) cout << "\\n";
    else cout << s.substr(st, dr - st + 1) << "\\n";
    return 0;
}
`,
    py: `s = input()
st, dr = 0, len(s) - 1
while st <= dr and s[st] == " ":
    st += 1
while dr >= st and s[dr] == " ":
    dr -= 1
print(s[st:dr + 1] if st <= dr else "")
`,
    tests: ["   Ana are mere", "fara spatii extra   ", "   ambele parti   ", "text", "   "],
  },
  {
    slug: "op-egalitate-fara-case",
    title: "Verificare egalitate a doua siruri, ignorand majuscule/minuscule",
    difficulty: "easy",
    tags: ["siruri", "operatii-cu-siruri", "comparare"],
    statement: "Se citesc doua siruri de caractere s1 si s2, formate doar din litere. Verificati daca sunt egale, ignorand diferenta dintre litere mari si litere mici.",
    input_format: IN_FMT_2S,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= lungimea sirurilor <= 200",
    hints: "Comparati sirurile dupa ce aduceti fiecare litera la forma mica.",
    explanation: "Daca sirurile au lungimi diferite, raspunsul este NU. Altfel, se compara pozitie cu pozitie, aducand fiecare litera la litera mica inainte de comparatie.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
char laMica(char c) { if (c >= 'A' && c <= 'Z') return c - 'A' + 'a'; return c; }
int main() {
    string s1; getline(cin, s1);
    string s2; getline(cin, s2);
    if (s1.size() != s2.size()) { cout << "NU\\n"; return 0; }
    bool ok = true;
    for (int i = 0; i < (int)s1.size(); i++) if (laMica(s1[i]) != laMica(s2[i])) ok = false;
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def la_mica(c):
    if "A" <= c <= "Z":
        return chr(ord(c) - ord("A") + ord("a"))
    return c

s1 = input()
s2 = input()
if len(s1) != len(s2):
    print("NU")
else:
    ok = True
    for i in range(len(s1)):
        if la_mica(s1[i]) != la_mica(s2[i]):
            ok = False
    print("DA" if ok else "NU")
`,
    tests: ["Programare\nprogramare", "ABC\nabd", "Test\ntEsT", "abc\nabcd", "InfoRmatica\ninformatica"],
  },
  {
    slug: "op-numara-siruri-cu-subsir",
    title: "Numarul de siruri dintr-o lista care contin un subsir dat",
    difficulty: "medium",
    tags: ["siruri", "operatii-cu-siruri", "cautare"],
    statement: "Se citesc un numar natural n, apoi n siruri de caractere (cate unul pe linie), apoi un subsir cautat. Determinati pentru cate dintre cele n siruri, subsirul cautat apare cel putin o data.",
    input_format: "Pe prima linie se citeste n. Urmeaza n linii, fiecare continand un sir. Pe ultima linie se citeste subsirul cautat.",
    output_format: "Se afiseaza numarul de siruri care contin subsirul dat.",
    constraints: "1 <= n <= 50, 1 <= lungimea fiecarui sir <= 100, 1 <= lungimea subsirului <= 100",
    hints: "Pentru fiecare dintre cele n siruri, cautati subsirul in el ca la cautarea unui subsir intr-un text.",
    explanation: "Pentru fiecare dintre cele n siruri se aplica o cautare de subsir (verificand fiecare pozitie de start posibila); se numara pentru cate dintre siruri exista cel putin o potrivire.\n\n**Complexitate:** O(n * lungime * lungime_subsir)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
bool contine(const string &text, const string &pat) {
    int n = text.size(), m = pat.size();
    for (int i = 0; i + m <= n; i++) {
        bool ok = true;
        for (int j = 0; j < m; j++) if (text[i + j] != pat[j]) { ok = false; break; }
        if (ok) return true;
    }
    return false;
}
int main() {
    int n; cin >> n; cin.ignore();
    vector<string> siruri(n);
    for (int i = 0; i < n; i++) getline(cin, siruri[i]);
    string pat; getline(cin, pat);
    int cnt = 0;
    for (auto &s : siruri) if (contine(s, pat)) cnt++;
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `def contine(text, pat):
    n, m = len(text), len(pat)
    for i in range(n - m + 1):
        if text[i:i + m] == pat:
            return True
    return False

n = int(input())
siruri = [input() for _ in range(n)]
pat = input()
cnt = 0
for s in siruri:
    if contine(s, pat):
        cnt += 1
print(cnt)
`,
    tests: ["3\nbanana\nprogramare\nananas\nana", "2\nabc\ndef\nz", "4\ncar\ncard\ncards\ndiscard\ncard", "1\nsolo\nsolo", "3\naaa\nbbb\nccc\na"],
  },
  {
    slug: "op-concatenare-n-siruri",
    title: "Concatenarea a n siruri cu un separator",
    difficulty: "easy",
    tags: ["siruri", "operatii-cu-siruri", "concatenare"],
    statement: "Se citesc un numar natural n, apoi n siruri de caractere (cate unul pe linie) si un caracter separator. Afisati cele n siruri concatenate, cu separatorul intre oricare doua siruri consecutive (fara separator la inceput sau la sfarsit).",
    input_format: "Pe prima linie se citeste n. Urmeaza n linii, fiecare continand un sir. Pe ultima linie se citeste caracterul separator.",
    output_format: "Se afiseaza sirul rezultat, pe o singura linie.",
    constraints: "1 <= n <= 50, 1 <= lungimea fiecarui sir <= 20",
    hints: "Adaugati separatorul inaintea fiecarui sir, cu exceptia primului.",
    explanation: "Se construieste rezultatul adaugand primul sir, apoi, pentru fiecare sir urmator, se adauga mai intai separatorul si apoi sirul respectiv.\n\n**Complexitate:** O(suma lungimilor)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n; cin.ignore();
    vector<string> siruri(n);
    for (int i = 0; i < n; i++) getline(cin, siruri[i]);
    string ds; getline(cin, ds);
    char sep = ds[0];
    string rez = siruri[0];
    for (int i = 1; i < n; i++) {
        rez += sep;
        rez += siruri[i];
    }
    cout << rez << "\\n";
    return 0;
}
`,
    py: `n = int(input())
siruri = [input() for _ in range(n)]
sep = input()[0]
rez = siruri[0]
for i in range(1, n):
    rez += sep + siruri[i]
print(rez)
`,
    tests: ["3\n2026\n08\n05\n-", "1\nsolo\n,", "4\nunu\ndoi\ntrei\npatru\n_", "2\nabc\ndef\n/", "5\na\nb\nc\nd\ne\n,"],
  },
  {
    slug: "op-inverseaza-ordinea-cuvintelor",
    title: "Inversarea ordinii cuvintelor dintr-o propozitie",
    difficulty: "medium",
    tags: ["siruri", "operatii-cu-siruri", "cuvinte"],
    statement: "Se citeste o propozitie. Afisati propozitia cu cuvintele in ordine inversa, separate tot printr-un singur spatiu, dar cu literele fiecarui cuvant neschimbate.",
    input_format: IN_FMT_PROPOZITIE,
    output_format: "Se afiseaza propozitia cu cuvintele inversate, pe o singura linie.",
    constraints: "1 <= lungimea propozitiei <= 200",
    hints: "Extrageti mai intai cuvintele intr-un vector, apoi afisati-le in ordine inversa, separate prin spatiu.",
    explanation: "Se extrag cuvintele propozitiei intr-un vector, parcurgand sirul si construind fiecare cuvant pana la urmatorul spatiu. Apoi se afiseaza cuvintele din vector in ordine inversa, separate printr-un singur spatiu.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    vector<string> cuvinte;
    string cur = "";
    for (char c : s) {
        if (c == ' ') { cuvinte.push_back(cur); cur = ""; }
        else cur += c;
    }
    cuvinte.push_back(cur);
    for (int i = (int)cuvinte.size() - 1; i >= 0; i--) {
        cout << cuvinte[i];
        if (i > 0) cout << ' ';
    }
    cout << "\\n";
    return 0;
}
`,
    py: `s = input()
cuvinte = []
cur = ""
for c in s:
    if c == " ":
        cuvinte.append(cur)
        cur = ""
    else:
        cur += c
cuvinte.append(cur)
print(" ".join(reversed(cuvinte)))
`,
    tests: ["Ana are mere", "un singur cuvant", "azi e o zi buna", "programare in c++", "a b c d"],
  },
  {
    slug: "op-interschimba-cuvinte",
    title: "Interschimbarea a doua cuvinte dintr-o propozitie",
    difficulty: "medium",
    tags: ["siruri", "operatii-cu-siruri", "cuvinte"],
    statement: "Se citesc o propozitie si doi indici i si j (1 <= i, j <= numarul de cuvinte din propozitie), reprezentand pozitiile (numerotate de la 1) a doua cuvinte. Afisati propozitia obtinuta prin interschimbarea celor doua cuvinte, restul propozitiei ramanand neschimbat.",
    input_format: "Pe prima linie se citeste propozitia. Pe a doua linie se citesc indicii i si j.",
    output_format: "Se afiseaza propozitia rezultata, pe o singura linie.",
    constraints: "1 <= lungimea propozitiei <= 200, 1 <= i, j <= numarul de cuvinte",
    hints: "Extrageti mai intai toate cuvintele intr-un vector, interschimbati elementele de pe pozitiile i-1 si j-1, apoi afisati vectorul din nou ca propozitie.",
    explanation: "Se extrag cuvintele propozitiei intr-un vector. Se interschimba elementele de pe pozitiile i-1 si j-1 (indexare de la 0), apoi cuvintele sunt afisate din nou, separate printr-un singur spatiu.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int i, j; cin >> i >> j;
    vector<string> cuvinte;
    string cur = "";
    for (char c : s) {
        if (c == ' ') { cuvinte.push_back(cur); cur = ""; }
        else cur += c;
    }
    cuvinte.push_back(cur);
    swap(cuvinte[i - 1], cuvinte[j - 1]);
    for (int k = 0; k < (int)cuvinte.size(); k++) {
        cout << cuvinte[k];
        if (k + 1 < (int)cuvinte.size()) cout << ' ';
    }
    cout << "\\n";
    return 0;
}
`,
    py: `s = input()
i, j = map(int, input().split())
cuvinte = []
cur = ""
for c in s:
    if c == " ":
        cuvinte.append(cur)
        cur = ""
    else:
        cur += c
cuvinte.append(cur)
cuvinte[i - 1], cuvinte[j - 1] = cuvinte[j - 1], cuvinte[i - 1]
print(" ".join(cuvinte))
`,
    tests: ["Ana are mere rosii\n1 4", "azi e o zi buna\n2 5", "un singur cuvant\n1 3", "programare in c plus plus\n2 2", "a b c d e\n1 5"],
  },
  {
    slug: "op-cel-mai-lung-cuvant",
    title: "Cel mai lung cuvant dintr-un text",
    difficulty: "easy",
    tags: ["siruri", "operatii-cu-siruri", "cuvinte"],
    statement: "Se citeste un text. Determinati cel mai lung cuvant al sau. Daca exista mai multe cuvinte de lungime maxima, afisati primul dintre ele.",
    input_format: IN_FMT_PROPOZITIE,
    output_format: "Se afiseaza cel mai lung cuvant.",
    constraints: "1 <= lungimea textului <= 200",
    hints: "Extrageti cuvintele textului si retineti-l pe cel cu lungimea maxima intalnit pana in acel moment.",
    explanation: "Se extrag cuvintele textului, iar pe parcurs se retine cuvantul cu cea mai mare lungime intalnit; la egalitate de lungime, ramane cel intalnit primul, deoarece actualizarea se face doar la o lungime strict mai mare.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    vector<string> cuvinte;
    string cur = "";
    for (char c : s) {
        if (c == ' ') { cuvinte.push_back(cur); cur = ""; }
        else cur += c;
    }
    cuvinte.push_back(cur);
    string rez = cuvinte[0];
    for (auto &c : cuvinte) if (c.size() > rez.size()) rez = c;
    cout << rez << "\\n";
    return 0;
}
`,
    py: `s = input()
cuvinte = []
cur = ""
for c in s:
    if c == " ":
        cuvinte.append(cur)
        cur = ""
    else:
        cur += c
cuvinte.append(cur)
rez = cuvinte[0]
for c in cuvinte:
    if len(c) > len(rez):
        rez = c
print(rez)
`,
    tests: ["Ana are mere rosii", "un singur cuvant lung", "azi e o zi buna", "programare informatica algoritmi", "a bb ccc dd"],
  },
  {
    slug: "op-cel-mai-scurt-cuvant",
    title: "Cel mai scurt cuvant dintr-un text",
    difficulty: "easy",
    tags: ["siruri", "operatii-cu-siruri", "cuvinte"],
    statement: "Se citeste un text. Determinati cel mai scurt cuvant al sau. Daca exista mai multe cuvinte de lungime minima, afisati primul dintre ele.",
    input_format: IN_FMT_PROPOZITIE,
    output_format: "Se afiseaza cel mai scurt cuvant.",
    constraints: "1 <= lungimea textului <= 200",
    hints: "Extrageti cuvintele textului si retineti-l pe cel cu lungimea minima intalnit pana in acel moment.",
    explanation: "Se extrag cuvintele textului, iar pe parcurs se retine cuvantul cu cea mai mica lungime intalnit; la egalitate de lungime, ramane cel intalnit primul, deoarece actualizarea se face doar la o lungime strict mai mica.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    vector<string> cuvinte;
    string cur = "";
    for (char c : s) {
        if (c == ' ') { cuvinte.push_back(cur); cur = ""; }
        else cur += c;
    }
    cuvinte.push_back(cur);
    string rez = cuvinte[0];
    for (auto &c : cuvinte) if (c.size() < rez.size()) rez = c;
    cout << rez << "\\n";
    return 0;
}
`,
    py: `s = input()
cuvinte = []
cur = ""
for c in s:
    if c == " ":
        cuvinte.append(cur)
        cur = ""
    else:
        cur += c
cuvinte.append(cur)
rez = cuvinte[0]
for c in cuvinte:
    if len(c) < len(rez):
        rez = c
print(rez)
`,
    tests: ["Ana are mere rosii", "un singur cuvant lung", "azi e o zi buna", "programare informatica ok algoritmi", "aaa bb c dddd"],
  },
  {
    slug: "op-cuvinte-incep-vocala",
    title: "Numarul de cuvinte care incep cu vocala",
    difficulty: "easy",
    tags: ["siruri", "operatii-cu-siruri", "cuvinte", "vocale"],
    statement: "Se citeste un text. Determinati cate dintre cuvintele sale incep cu o vocala (a, e, i, o, u, mare sau mica).",
    input_format: IN_FMT_PROPOZITIE,
    output_format: "Se afiseaza numarul de cuvinte care incep cu vocala.",
    constraints: "1 <= lungimea textului <= 200",
    hints: "Extrageti cuvintele si verificati primul caracter al fiecaruia.",
    explanation: "Se extrag cuvintele textului, iar pentru fiecare se verifica daca primul caracter apartine multimii vocalelor; se numara cate dintre cuvinte respecta aceasta conditie.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    string voc = "aeiouAEIOU";
    vector<string> cuvinte;
    string cur = "";
    for (char c : s) {
        if (c == ' ') { cuvinte.push_back(cur); cur = ""; }
        else cur += c;
    }
    cuvinte.push_back(cur);
    int cnt = 0;
    for (auto &c : cuvinte) if (voc.find(c[0]) != string::npos) cnt++;
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `s = input()
voc = "aeiouAEIOU"
cuvinte = []
cur = ""
for c in s:
    if c == " ":
        cuvinte.append(cur)
        cur = ""
    else:
        cur += c
cuvinte.append(cur)
cnt = 0
for c in cuvinte:
    if c[0] in voc:
        cnt += 1
print(cnt)
`,
    tests: ["Ana are mere rosii", "un elefant uriias azi", "programare in c plus plus", "Ea este Oana", "Zebra broasca pisica"],
  },
  {
    slug: "op-cuvinte-palindrom",
    title: "Numarul de cuvinte palindrom dintr-un text",
    difficulty: "medium",
    tags: ["siruri", "operatii-cu-siruri", "cuvinte", "palindrom"],
    statement: "Se citeste un text. Determinati cate dintre cuvintele sale sunt palindrom (se citesc la fel de la stanga la dreapta si de la dreapta la stanga).",
    input_format: IN_FMT_PROPOZITIE,
    output_format: "Se afiseaza numarul de cuvinte palindrom.",
    constraints: "1 <= lungimea textului <= 200",
    hints: "Extrageti cuvintele si verificati fiecare in parte daca este palindrom, comparand caracterele simetrice.",
    explanation: "Se extrag cuvintele textului, iar pentru fiecare se verifica daca este palindrom comparand caracterele de pe pozitii simetrice; se numara cate dintre cuvinte sunt palindrom.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
bool ePalindrom(const string &c) {
    int n = c.size();
    for (int i = 0; i < n / 2; i++) if (c[i] != c[n - 1 - i]) return false;
    return true;
}
int main() {
    string s; getline(cin, s);
    vector<string> cuvinte;
    string cur = "";
    for (char c : s) {
        if (c == ' ') { cuvinte.push_back(cur); cur = ""; }
        else cur += c;
    }
    cuvinte.push_back(cur);
    int cnt = 0;
    for (auto &c : cuvinte) if (ePalindrom(c)) cnt++;
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `def e_palindrom(c):
    n = len(c)
    for i in range(n // 2):
        if c[i] != c[n - 1 - i]:
            return False
    return True

s = input()
cuvinte = []
cur = ""
for c in s:
    if c == " ":
        cuvinte.append(cur)
        cur = ""
    else:
        cur += c
cuvinte.append(cur)
cnt = 0
for c in cuvinte:
    if e_palindrom(c):
        cnt += 1
print(cnt)
`,
    tests: ["ana are o oo mere", "capac cutie masa ata", "programare azi", "a bb ccc a", "abcd efgh"],
  },
  {
    slug: "op-subsecventa",
    title: "Verificare daca un sir este subsecventa a altui sir",
    difficulty: "hard",
    tags: ["siruri", "operatii-cu-siruri", "subsecventa"],
    statement: "Se citesc doua siruri de caractere s1 si s2. Verificati daca s1 se poate obtine din s2 prin stergerea unora dintre caracterele sale (nu neaparat consecutive), pastrand ordinea relativa a celor ramase (adica s1 este o subsecventa a lui s2).",
    input_format: IN_FMT_2S,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= lungimea sirurilor <= 200",
    hints: "Folositi doi indici, unul pentru s1 si unul pentru s2; avansati indicele din s2 mereu, iar pe cel din s1 doar cand caracterele coincid.",
    explanation: "Se folosesc doi indici, i pentru s1 si j pentru s2, ambii pornind de la 0. Se parcurge s2 cu j; de fiecare data cand s2[j] == s1[i], indicele i avanseaza. La final, s1 este subsecventa a lui s2 daca i a ajuns sa parcurga tot s1 (i == lungimea lui s1).\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s1; getline(cin, s1);
    string s2; getline(cin, s2);
    int i = 0;
    for (int j = 0; j < (int)s2.size() && i < (int)s1.size(); j++) {
        if (s2[j] == s1[i]) i++;
    }
    cout << (i == (int)s1.size() ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s1 = input()
s2 = input()
i = 0
for j in range(len(s2)):
    if i < len(s1) and s2[j] == s1[i]:
        i += 1
print("DA" if i == len(s1) else "NU")
`,
    tests: ["ace\nabcde", "aec\nabcde", "abc\nabc", "xyz\nabcde", "gksrek\ngeeksforgeeks"],
  },
  {
    slug: "op-cel-mai-lung-subsir-comun-contiguu",
    title: "Cel mai lung subsir comun contiguu a doua siruri",
    difficulty: "hard",
    tags: ["siruri", "operatii-cu-siruri", "subsecventa"],
    statement: "Se citesc doua siruri de caractere s1 si s2. Determinati lungimea celui mai lung subsir comun contiguu (adica cea mai lunga secventa de caractere consecutive care apare, in aceeasi ordine, atat in s1 cat si in s2).",
    input_format: IN_FMT_2S,
    output_format: "Se afiseaza lungimea celui mai lung subsir comun contiguu.",
    constraints: "1 <= lungimea sirurilor <= 200",
    hints: "Construiti un tabel dp[i][j] = lungimea celui mai lung subsir comun contiguu care se termina exact la pozitiile i-1 din s1 si j-1 din s2; daca s1[i-1] != s2[j-1], atunci dp[i][j] = 0.",
    explanation: "Se construieste un tabel dp cu (n+1) x (m+1) valori, unde dp[i][j] reprezinta lungimea celui mai lung subsir comun contiguu care se termina exact la pozitiile i-1 in s1 si j-1 in s2. Daca s1[i-1] == s2[j-1], atunci dp[i][j] = dp[i-1][j-1] + 1, altfel dp[i][j] = 0. Raspunsul este valoarea maxima din tabel.\n\n**Complexitate:** O(n * m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s1; getline(cin, s1);
    string s2; getline(cin, s2);
    int n = s1.size(), m = s2.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    int rez = 0;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (s1[i - 1] == s2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
                rez = max(rez, dp[i][j]);
            }
        }
    }
    cout << rez << "\\n";
    return 0;
}
`,
    py: `s1 = input()
s2 = input()
n, m = len(s1), len(s2)
dp = [[0] * (m + 1) for _ in range(n + 1)]
rez = 0
for i in range(1, n + 1):
    for j in range(1, m + 1):
        if s1[i - 1] == s2[j - 1]:
            dp[i][j] = dp[i - 1][j - 1] + 1
            rez = max(rez, dp[i][j])
print(rez)
`,
    tests: ["abcde\nabfce", "programare\naprograma", "abc\nxyz", "aaaaa\naaa", "abcdxyz\nxyzabcd"],
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
