const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade10", chapter: "siruri-caractere", sub: "prelucrari-elementare-siruri" };

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

const IN_FMT_S = "Se citeste un sir de caractere s, pe o singura linie.";
const IN_FMT_S_LETTERE = "Se citeste un sir de caractere s, pe o singura linie, format doar din litere ale alfabetului englez (mari si/sau mici).";
const OUT_FMT_DA_NU = "Se afiseaza DA daca proprietatea este adevarata, respectiv NU in caz contrar.";

const problems = [
  {
    slug: "elem-lungime",
    title: "Lungimea unui sir de caractere",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "lungime"],
    statement: "Se citeste un sir de caractere s. Determinati, parcurgand sirul caracter cu caracter, numarul de caractere ale acestuia.",
    input_format: IN_FMT_S,
    output_format: "Se afiseaza numarul de caractere ale sirului.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Parcurgeti sirul cu un contor care se incrementeaza pentru fiecare caracter intalnit.",
    explanation: "Se parcurge sirul de la stanga la dreapta, incrementand un contor pentru fiecare caracter. Valoarea finala a contorului este lungimea sirului.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int cnt = 0;
    for (char c : s) cnt++;
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `s = input()
cnt = 0
for c in s:
    cnt += 1
print(cnt)
`,
    tests: ["a", "abc", "Ana are mere", "1234567890", "Ceva Text cu Spatii Multiple"],
  },
  {
    slug: "elem-numar-vocale",
    title: "Numarul de vocale dintr-un sir",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "vocale"],
    statement: "Se citeste un sir de caractere s. Determinati cate dintre caracterele sale sunt vocale (a, e, i, o, u, indiferent daca sunt scrise cu litera mare sau mica).",
    input_format: IN_FMT_S,
    output_format: "Se afiseaza numarul de vocale din sir.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Verificati pentru fiecare caracter daca apartine multimii {a,e,i,o,u,A,E,I,O,U}.",
    explanation: "Se parcurge sirul si se incrementeaza un contor de fiecare data cand caracterul curent este una dintre vocalele a, e, i, o, u (mare sau mica).\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    string voc = "aeiouAEIOU";
    int cnt = 0;
    for (char c : s) if (voc.find(c) != string::npos) cnt++;
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `s = input()
voc = "aeiouAEIOU"
cnt = 0
for c in s:
    if c in voc:
        cnt += 1
print(cnt)
`,
    tests: ["Ana are mere", "bcdfg", "AEIOUaeiou", "Programare", "xyz"],
  },
  {
    slug: "elem-numar-consoane",
    title: "Numarul de consoane dintr-un sir",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "consoane"],
    statement: "Se citeste un sir de caractere s. Determinati cate dintre caracterele sale sunt consoane (litere care nu sunt vocale).",
    input_format: IN_FMT_S,
    output_format: "Se afiseaza numarul de consoane din sir.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Un caracter este consoana daca este litera si nu se afla in multimea vocalelor.",
    explanation: "Se parcurge sirul si se incrementeaza un contor pentru fiecare caracter care este litera (mare sau mica) si nu apartine multimii vocalelor.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    string voc = "aeiouAEIOU";
    int cnt = 0;
    for (char c : s) {
        bool litera = (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
        if (litera && voc.find(c) == string::npos) cnt++;
    }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `s = input()
voc = "aeiouAEIOU"
cnt = 0
for c in s:
    litera = ("a" <= c <= "z") or ("A" <= c <= "Z")
    if litera and c not in voc:
        cnt += 1
print(cnt)
`,
    tests: ["Ana are mere", "bcdfg", "AEIOUaeiou", "Programare", "12345"],
  },
  {
    slug: "elem-numar-cifre",
    title: "Numarul de cifre dintr-un sir",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "cifre"],
    statement: "Se citeste un sir de caractere s. Determinati cate dintre caracterele sale sunt cifre.",
    input_format: IN_FMT_S,
    output_format: "Se afiseaza numarul de cifre din sir.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Un caracter c este cifra daca '0' <= c <= '9'.",
    explanation: "Se parcurge sirul si se incrementeaza un contor pentru fiecare caracter aflat intre '0' si '9'.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int cnt = 0;
    for (char c : s) if (c >= '0' && c <= '9') cnt++;
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `s = input()
cnt = 0
for c in s:
    if "0" <= c <= "9":
        cnt += 1
print(cnt)
`,
    tests: ["Anul 2026", "abc", "12345", "Nota10 la Info2", "a1b2c3"],
  },
  {
    slug: "elem-numar-majuscule",
    title: "Numarul de litere mari dintr-un sir",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "majuscule"],
    statement: "Se citeste un sir de caractere s. Determinati cate dintre caracterele sale sunt litere mari (majuscule).",
    input_format: IN_FMT_S,
    output_format: "Se afiseaza numarul de litere mari din sir.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Un caracter c este litera mare daca 'A' <= c <= 'Z'.",
    explanation: "Se parcurge sirul si se incrementeaza un contor pentru fiecare caracter aflat intre 'A' si 'Z'.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int cnt = 0;
    for (char c : s) if (c >= 'A' && c <= 'Z') cnt++;
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `s = input()
cnt = 0
for c in s:
    if "A" <= c <= "Z":
        cnt += 1
print(cnt)
`,
    tests: ["Ana Are Mere", "abcdef", "TOTUL MARE", "MixCase Text", "123"],
  },
  {
    slug: "elem-numar-minuscule",
    title: "Numarul de litere mici dintr-un sir",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "minuscule"],
    statement: "Se citeste un sir de caractere s. Determinati cate dintre caracterele sale sunt litere mici (minuscule).",
    input_format: IN_FMT_S,
    output_format: "Se afiseaza numarul de litere mici din sir.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Un caracter c este litera mica daca 'a' <= c <= 'z'.",
    explanation: "Se parcurge sirul si se incrementeaza un contor pentru fiecare caracter aflat intre 'a' si 'z'.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int cnt = 0;
    for (char c : s) if (c >= 'a' && c <= 'z') cnt++;
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `s = input()
cnt = 0
for c in s:
    if "a" <= c <= "z":
        cnt += 1
print(cnt)
`,
    tests: ["Ana Are Mere", "abcdef", "TOTUL MARE", "MixCase Text", "123"],
  },
  {
    slug: "elem-numar-spatii",
    title: "Numarul de spatii dintr-un sir",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "spatii"],
    statement: "Se citeste un sir de caractere s. Determinati cate caractere spatiu contine.",
    input_format: IN_FMT_S,
    output_format: "Se afiseaza numarul de spatii din sir.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Un caracter este spatiu daca este egal cu ' '.",
    explanation: "Se parcurge sirul si se incrementeaza un contor pentru fiecare caracter egal cu spatiu.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int cnt = 0;
    for (char c : s) if (c == ' ') cnt++;
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `s = input()
cnt = 0
for c in s:
    if c == " ":
        cnt += 1
print(cnt)
`,
    tests: ["Ana are mere", "fara spatii intre cuvinte aici", "abc", "a b c d e", "   "],
  },
  {
    slug: "elem-numar-caractere-speciale",
    title: "Numarul de caractere speciale dintr-un sir",
    difficulty: "medium",
    tags: ["siruri", "prelucrari-elementare", "caractere-speciale"],
    statement: "Se citeste un sir de caractere s. Determinati cate dintre caracterele sale nu sunt nici litere, nici cifre, nici spatii (de exemplu: . , ! ? etc.).",
    input_format: IN_FMT_S,
    output_format: "Se afiseaza numarul de caractere speciale din sir.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Verificati pentru fiecare caracter ca nu este litera, nu este cifra si nu este spatiu.",
    explanation: "Se parcurge sirul si se incrementeaza un contor pentru fiecare caracter care nu se incadreaza in categoria literelor, cifrelor sau spatiilor.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int cnt = 0;
    for (char c : s) {
        bool litera = (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
        bool cifra = (c >= '0' && c <= '9');
        if (!litera && !cifra && c != ' ') cnt++;
    }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `s = input()
cnt = 0
for c in s:
    litera = ("a" <= c <= "z") or ("A" <= c <= "Z")
    cifra = "0" <= c <= "9"
    if not litera and not cifra and c != " ":
        cnt += 1
print(cnt)
`,
    tests: ["Buna, ce mai faci?", "Fara caractere speciale", "1+1=2!", "abc.def,ghi", "@#$%"],
  },
  {
    slug: "elem-la-majuscule",
    title: "Conversia unui sir in litere mari",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "conversie"],
    statement: "Se citeste un sir de caractere s. Afisati sirul obtinut prin transformarea tuturor literelor mici in litere mari; celelalte caractere raman neschimbate.",
    input_format: IN_FMT_S,
    output_format: "Se afiseaza sirul rezultat, pe o singura linie.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "O litera mica c se transforma in litera mare cu formula c - 'a' + 'A'.",
    explanation: "Se parcurge sirul si, pentru fiecare caracter aflat intre 'a' si 'z', se calculeaza litera mare corespunzatoare cu formula c - 'a' + 'A'; celelalte caractere se copiaza nemodificate.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    for (char &c : s) if (c >= 'a' && c <= 'z') c = c - 'a' + 'A';
    cout << s << "\\n";
    return 0;
}
`,
    py: `s = input()
rez = []
for c in s:
    if "a" <= c <= "z":
        c = chr(ord(c) - ord("a") + ord("A"))
    rez.append(c)
print("".join(rez))
`,
    tests: ["Ana are mere", "abcdef", "TOTUL MARE", "MixCase 123", "cuvant"],
  },
  {
    slug: "elem-la-minuscule",
    title: "Conversia unui sir in litere mici",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "conversie"],
    statement: "Se citeste un sir de caractere s. Afisati sirul obtinut prin transformarea tuturor literelor mari in litere mici; celelalte caractere raman neschimbate.",
    input_format: IN_FMT_S,
    output_format: "Se afiseaza sirul rezultat, pe o singura linie.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "O litera mare c se transforma in litera mica cu formula c - 'A' + 'a'.",
    explanation: "Se parcurge sirul si, pentru fiecare caracter aflat intre 'A' si 'Z', se calculeaza litera mica corespunzatoare cu formula c - 'A' + 'a'; celelalte caractere se copiaza nemodificate.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    for (char &c : s) if (c >= 'A' && c <= 'Z') c = c - 'A' + 'a';
    cout << s << "\\n";
    return 0;
}
`,
    py: `s = input()
rez = []
for c in s:
    if "A" <= c <= "Z":
        c = chr(ord(c) - ord("A") + ord("a"))
    rez.append(c)
print("".join(rez))
`,
    tests: ["Ana are mere", "abcdef", "TOTUL MARE", "MixCase 123", "CUVANT"],
  },
  {
    slug: "elem-inverseaza-case",
    title: "Inversarea majuscule/minuscule dintr-un sir",
    difficulty: "medium",
    tags: ["siruri", "prelucrari-elementare", "conversie"],
    statement: "Se citeste un sir de caractere s. Afisati sirul obtinut prin transformarea fiecarei litere mari in litera mica si a fiecarei litere mici in litera mare; celelalte caractere raman neschimbate.",
    input_format: IN_FMT_S,
    output_format: "Se afiseaza sirul rezultat, pe o singura linie.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Tratati separat cele doua cazuri: litera mica -> mare, litera mare -> mica; restul caracterelor raman la fel.",
    explanation: "Se parcurge sirul si se aplica transformarea corespunzatoare in functie de tipul fiecarui caracter: litera mica devine mare, litera mare devine mica, iar restul caracterelor raman neschimbate.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    for (char &c : s) {
        if (c >= 'a' && c <= 'z') c = c - 'a' + 'A';
        else if (c >= 'A' && c <= 'Z') c = c - 'A' + 'a';
    }
    cout << s << "\\n";
    return 0;
}
`,
    py: `s = input()
rez = []
for c in s:
    if "a" <= c <= "z":
        c = chr(ord(c) - ord("a") + ord("A"))
    elif "A" <= c <= "Z":
        c = chr(ord(c) - ord("A") + ord("a"))
    rez.append(c)
print("".join(rez))
`,
    tests: ["Ana Are Mere", "abcDEF", "TOTUL mare", "MixCase 123", "cuvant"],
  },
  {
    slug: "elem-capitalizat",
    title: "Verificarea corectitudinii scrierii unui cuvant cu majuscula initiala",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "case"],
    statement: "Se citeste un sir de caractere s, format doar din litere, reprezentand un cuvant. Verificati daca acesta este scris corect cu majuscula initiala, adica primul caracter este litera mare, iar toate celelalte caractere sunt litere mici.",
    input_format: IN_FMT_S_LETTERE,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Verificati separat primul caracter (trebuie sa fie mare) si toate celelalte (trebuie sa fie mici).",
    explanation: "Se verifica daca primul caracter al sirului este litera mare, apoi se parcurg toate celelalte caractere verificand ca sunt litere mici.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    bool ok = (s[0] >= 'A' && s[0] <= 'Z');
    for (int i = 1; i < (int)s.size(); i++) if (!(s[i] >= 'a' && s[i] <= 'z')) ok = false;
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s = input()
ok = "A" <= s[0] <= "Z"
for i in range(1, len(s)):
    if not ("a" <= s[i] <= "z"):
        ok = False
print("DA" if ok else "NU")
`,
    tests: ["Programare", "programare", "PROGRAMARE", "ProGramare", "A"],
  },
  {
    slug: "elem-doar-litere",
    title: "Verificare daca un sir contine doar litere",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "verificare"],
    statement: "Se citeste un sir de caractere s. Verificati daca toate caracterele sale sunt litere (mari sau mici).",
    input_format: IN_FMT_S,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Verificati pentru fiecare caracter daca se afla in intervalul 'a'-'z' sau 'A'-'Z'.",
    explanation: "Se parcurge sirul si se verifica pentru fiecare caracter daca este litera; daca se gaseste un caracter care nu este litera, raspunsul este NU.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    bool ok = true;
    for (char c : s) if (!((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z'))) ok = false;
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s = input()
ok = True
for c in s:
    if not (("a" <= c <= "z") or ("A" <= c <= "Z")):
        ok = False
print("DA" if ok else "NU")
`,
    tests: ["Programare", "Text123", "abcXYZ", "cuvant cu spatiu", "InformaticaC"],
  },
  {
    slug: "elem-doar-cifre",
    title: "Verificare daca un sir contine doar cifre",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "verificare"],
    statement: "Se citeste un sir de caractere s. Verificati daca toate caracterele sale sunt cifre.",
    input_format: IN_FMT_S,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Verificati pentru fiecare caracter daca se afla in intervalul '0'-'9'.",
    explanation: "Se parcurge sirul si se verifica pentru fiecare caracter daca este cifra; daca se gaseste un caracter care nu este cifra, raspunsul este NU.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    bool ok = true;
    for (char c : s) if (!(c >= '0' && c <= '9')) ok = false;
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s = input()
ok = True
for c in s:
    if not ("0" <= c <= "9"):
        ok = False
print("DA" if ok else "NU")
`,
    tests: ["123456", "12a456", "2026", "0", "12 34"],
  },
  {
    slug: "elem-doar-vocale",
    title: "Verificare daca un sir este format doar din vocale",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "vocale"],
    statement: "Se citeste un sir de caractere s. Verificati daca toate caracterele sale sunt vocale (a, e, i, o, u, mari sau mici).",
    input_format: IN_FMT_S,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Verificati pentru fiecare caracter daca apartine multimii {a,e,i,o,u,A,E,I,O,U}.",
    explanation: "Se parcurge sirul si se verifica pentru fiecare caracter daca este vocala; daca se gaseste un caracter care nu este vocala, raspunsul este NU.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    string voc = "aeiouAEIOU";
    bool ok = true;
    for (char c : s) if (voc.find(c) == string::npos) ok = false;
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s = input()
voc = "aeiouAEIOU"
ok = True
for c in s:
    if c not in voc:
        ok = False
print("DA" if ok else "NU")
`,
    tests: ["aeiou", "AEIOUaeiou", "Ana", "eu", "programare"],
  },
  {
    slug: "elem-inversare",
    title: "Inversarea unui sir de caractere",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "inversare"],
    statement: "Se citeste un sir de caractere s. Afisati sirul obtinut prin inversarea ordinii caracterelor sale.",
    input_format: IN_FMT_S,
    output_format: "Se afiseaza sirul inversat, pe o singura linie.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Construiti sirul rezultat parcurgand s de la ultimul caracter catre primul.",
    explanation: "Se construieste sirul rezultat parcurgand sirul original de la ultima pozitie catre prima si adaugand fiecare caracter la rezultat.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    string rez = "";
    for (int i = (int)s.size() - 1; i >= 0; i--) rez += s[i];
    cout << rez << "\\n";
    return 0;
}
`,
    py: `s = input()
rez = ""
for i in range(len(s) - 1, -1, -1):
    rez += s[i]
print(rez)
`,
    tests: ["Ana are mere", "abcdef", "a", "12345", "Programare in C++"],
  },
  {
    slug: "elem-numar-aparitii-caracter",
    title: "Numarul de aparitii ale unui caracter dat",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "cautare"],
    statement: "Se citesc un sir de caractere s si un caracter c. Determinati de cate ori apare caracterul c in sirul s.",
    input_format: "Pe prima linie se citeste sirul s. Pe a doua linie se citeste caracterul c.",
    output_format: "Se afiseaza numarul de aparitii ale lui c in s.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Parcurgeti sirul si incrementati un contor de fiecare data cand caracterul curent este egal cu c.",
    explanation: "Se parcurge sirul si se incrementeaza un contor de fiecare data cand caracterul curent coincide cu caracterul cautat c.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    string cs; getline(cin, cs);
    char c = cs[0];
    int cnt = 0;
    for (char x : s) if (x == c) cnt++;
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `s = input()
c = input()[0]
cnt = 0
for x in s:
    if x == c:
        cnt += 1
print(cnt)
`,
    tests: ["banana\na", "abracadabra\na", "Mississippi\ns", "aaaaaa\na", "abcdef\nz"],
  },
  {
    slug: "elem-prim-caracter-neregasit",
    title: "Primul caracter care nu se repeta",
    difficulty: "medium",
    tags: ["siruri", "prelucrari-elementare", "frecventa"],
    statement: "Se citeste un sir de caractere s. Determinati primul caracter din sir care apare o singura data. Daca nu exista un astfel de caracter, afisati -1.",
    input_format: IN_FMT_S,
    output_format: "Se afiseaza primul caracter care apare o singura data, sau -1 daca nu exista.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Calculati mai intai frecventa fiecarui caracter, apoi parcurgeti sirul in ordine si opriti-va la primul caracter cu frecventa 1.",
    explanation: "Se calculeaza frecventa fiecarui caracter din sir (de exemplu intr-un vector indexat dupa codul ASCII), apoi se parcurge sirul in ordinea originala si se raspunde cu primul caracter a carui frecventa este exact 1.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int freq[256] = {0};
    for (char c : s) freq[(unsigned char)c]++;
    for (char c : s) {
        if (freq[(unsigned char)c] == 1) {
            cout << c << "\\n";
            return 0;
        }
    }
    cout << -1 << "\\n";
    return 0;
}
`,
    py: `s = input()
freq = {}
for c in s:
    freq[c] = freq.get(c, 0) + 1
for c in s:
    if freq[c] == 1:
        print(c)
        break
else:
    print(-1)
`,
    tests: ["swiss", "aabbcc", "abcabcd", "z", "aabbccddeeffg"],
  },
  {
    slug: "elem-cel-mai-frecvent-caracter",
    title: "Cel mai frecvent caracter dintr-un sir",
    difficulty: "medium",
    tags: ["siruri", "prelucrari-elementare", "frecventa"],
    statement: "Se citeste un sir de caractere s. Determinati caracterul cu cea mai mare frecventa de aparitie. Daca exista mai multe caractere cu frecventa maxima, afisati primul dintre ele, in ordinea aparitiei in sir.",
    input_format: IN_FMT_S,
    output_format: "Se afiseaza caracterul cu frecventa maxima.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Calculati frecventa fiecarui caracter, determinati maximul, apoi gasiti primul caracter din sir care atinge acest maxim.",
    explanation: "Se calculeaza frecventa fiecarui caracter, se determina frecventa maxima, apoi se parcurge sirul in ordine si se raspunde cu primul caracter a carui frecventa este egala cu maximul.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int freq[256] = {0};
    for (char c : s) freq[(unsigned char)c]++;
    int mx = 0;
    for (char c : s) mx = max(mx, freq[(unsigned char)c]);
    for (char c : s) {
        if (freq[(unsigned char)c] == mx) {
            cout << c << "\\n";
            return 0;
        }
    }
    return 0;
}
`,
    py: `s = input()
freq = {}
for c in s:
    freq[c] = freq.get(c, 0) + 1
mx = max(freq.values())
for c in s:
    if freq[c] == mx:
        print(c)
        break
`,
    tests: ["banana", "aabbcc", "abracadabra", "zzzyyx", "programare"],
  },
  {
    slug: "elem-elimina-vocale",
    title: "Eliminarea vocalelor dintr-un sir",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "vocale"],
    statement: "Se citeste un sir de caractere s. Afisati sirul obtinut prin eliminarea tuturor vocalelor (a, e, i, o, u, mari sau mici).",
    input_format: IN_FMT_S,
    output_format: "Se afiseaza sirul rezultat, pe o singura linie (eventual vid).",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Construiti sirul rezultat adaugand doar caracterele care nu sunt vocale.",
    explanation: "Se construieste sirul rezultat parcurgand sirul original si pastrand doar caracterele care nu sunt vocale.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    string voc = "aeiouAEIOU";
    string rez = "";
    for (char c : s) if (voc.find(c) == string::npos) rez += c;
    cout << rez << "\\n";
    return 0;
}
`,
    py: `s = input()
voc = "aeiouAEIOU"
rez = ""
for c in s:
    if c not in voc:
        rez += c
print(rez)
`,
    tests: ["Ana are mere", "programare", "aeiou", "bcdfg", "Informatica"],
  },
  {
    slug: "elem-elimina-caracter",
    title: "Eliminarea tuturor aparitiilor unui caracter dat",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "eliminare"],
    statement: "Se citesc un sir de caractere s si un caracter c. Afisati sirul obtinut din s prin eliminarea tuturor aparitiilor caracterului c.",
    input_format: "Pe prima linie se citeste sirul s. Pe a doua linie se citeste caracterul c.",
    output_format: "Se afiseaza sirul rezultat, pe o singura linie (eventual vid).",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Construiti sirul rezultat adaugand doar caracterele diferite de c.",
    explanation: "Se construieste sirul rezultat parcurgand sirul original si pastrand doar caracterele diferite de caracterul c dat.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    string cs; getline(cin, cs);
    char c = cs[0];
    string rez = "";
    for (char x : s) if (x != c) rez += x;
    cout << rez << "\\n";
    return 0;
}
`,
    py: `s = input()
c = input()[0]
rez = ""
for x in s:
    if x != c:
        rez += x
print(rez)
`,
    tests: ["banana\na", "Mississippi\ns", "abcabc\nb", "aaaa\na", "programare\nr"],
  },
  {
    slug: "elem-comprimare-consecutive",
    title: "Eliminarea caracterelor consecutive identice",
    difficulty: "medium",
    tags: ["siruri", "prelucrari-elementare", "compresie"],
    statement: "Se citeste un sir de caractere s. Afisati sirul obtinut prin pastrarea unei singure aparitii din fiecare grup de caractere identice consecutive (de exemplu, 'aaabbbcc' devine 'abc').",
    input_format: IN_FMT_S,
    output_format: "Se afiseaza sirul rezultat, pe o singura linie.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Adaugati un caracter in rezultat doar daca este diferit de caracterul anterior din sirul original.",
    explanation: "Se parcurge sirul si se adauga un caracter in sirul rezultat doar daca este diferit de caracterul de dinaintea lui (sau daca este primul caracter din sir).\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    string rez = "";
    for (int i = 0; i < (int)s.size(); i++) {
        if (i == 0 || s[i] != s[i - 1]) rez += s[i];
    }
    cout << rez << "\\n";
    return 0;
}
`,
    py: `s = input()
rez = ""
for i in range(len(s)):
    if i == 0 or s[i] != s[i - 1]:
        rez += s[i]
print(rez)
`,
    tests: ["aaabbbcc", "aabbccddeeff", "abcdef", "aaaaaaa", "aabbaabb"],
  },
  {
    slug: "elem-numar-distincte",
    title: "Numarul de caractere distincte dintr-un sir",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "distincte"],
    statement: "Se citeste un sir de caractere s. Determinati cate caractere distincte contine.",
    input_format: IN_FMT_S,
    output_format: "Se afiseaza numarul de caractere distincte.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Marcati fiecare caracter intalnit intr-un vector de aparitie (de exemplu indexat dupa codul ASCII), apoi numarati cate au fost marcate.",
    explanation: "Se marcheaza fiecare caracter intalnit intr-un vector boolean indexat dupa codul ASCII, apoi se numara cate valori distincte au fost marcate ca aparute.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    bool aparut[256] = {false};
    for (char c : s) aparut[(unsigned char)c] = true;
    int cnt = 0;
    for (int i = 0; i < 256; i++) if (aparut[i]) cnt++;
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `s = input()
distincte = set()
for c in s:
    distincte.add(c)
print(len(distincte))
`,
    tests: ["banana", "abcdef", "aaaa", "Mississippi", "abcabcabc"],
  },
  {
    slug: "elem-toate-distincte",
    title: "Verificare daca toate caracterele unui sir sunt distincte",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "distincte"],
    statement: "Se citeste un sir de caractere s. Verificati daca toate caracterele sale sunt distincte doua cate doua.",
    input_format: IN_FMT_S,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Numarati caracterele distincte si comparati cu lungimea sirului.",
    explanation: "Sirul are toate caracterele distincte daca si numai daca numarul caracterelor distincte este egal cu lungimea sirului.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    bool aparut[256] = {false};
    int distincte = 0;
    for (char c : s) {
        if (!aparut[(unsigned char)c]) { aparut[(unsigned char)c] = true; distincte++; }
    }
    cout << (distincte == (int)s.size() ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s = input()
distincte = set(s)
print("DA" if len(distincte) == len(s) else "NU")
`,
    tests: ["abcdef", "abcabc", "a", "Programare", "12345"],
  },
  {
    slug: "elem-suma-ascii",
    title: "Suma codurilor ASCII ale caracterelor unui sir",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "ascii"],
    statement: "Se citeste un sir de caractere s. Determinati suma codurilor ASCII ale caracterelor sale.",
    input_format: IN_FMT_S,
    output_format: "Se afiseaza suma codurilor ASCII.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Codul ASCII al unui caracter c se obtine prin conversia sa la intreg.",
    explanation: "Se parcurge sirul si se aduna codul ASCII (valoarea numerica) al fiecarui caracter.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    long long suma = 0;
    for (char c : s) suma += (int)(unsigned char)c;
    cout << suma << "\\n";
    return 0;
}
`,
    py: `s = input()
suma = 0
for c in s:
    suma += ord(c)
print(suma)
`,
    tests: ["A", "abc", "Ana are mere", "12345", "Informatica"],
  },
  {
    slug: "elem-min-caracter",
    title: "Cel mai mic caracter dintr-un sir",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "minim"],
    statement: "Se citeste un sir de caractere s. Determinati caracterul cu cel mai mic cod ASCII din sir.",
    input_format: IN_FMT_S,
    output_format: "Se afiseaza caracterul minim.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Comparati direct caracterele intre ele, la fel ca la determinarea minimului unui vector de numere.",
    explanation: "Se parcurge sirul retinand caracterul minim intalnit pana la momentul curent, comparand caracterele direct dupa codul lor ASCII.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    char mn = s[0];
    for (char c : s) if (c < mn) mn = c;
    cout << mn << "\\n";
    return 0;
}
`,
    py: `s = input()
mn = s[0]
for c in s:
    if c < mn:
        mn = c
print(mn)
`,
    tests: ["banana", "zyxwv", "Programare", "12345", "aAbBcC"],
  },
  {
    slug: "elem-max-caracter",
    title: "Cel mai mare caracter dintr-un sir",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "maxim"],
    statement: "Se citeste un sir de caractere s. Determinati caracterul cu cel mai mare cod ASCII din sir.",
    input_format: IN_FMT_S,
    output_format: "Se afiseaza caracterul maxim.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Comparati direct caracterele intre ele, la fel ca la determinarea maximului unui vector de numere.",
    explanation: "Se parcurge sirul retinand caracterul maxim intalnit pana la momentul curent, comparand caracterele direct dupa codul lor ASCII.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    char mx = s[0];
    for (char c : s) if (c > mx) mx = c;
    cout << mx << "\\n";
    return 0;
}
`,
    py: `s = input()
mx = s[0]
for c in s:
    if c > mx:
        mx = c
print(mx)
`,
    tests: ["banana", "zyxwv", "Programare", "12345", "aAbBcC"],
  },
  {
    slug: "elem-palindrom-fara-case",
    title: "Verificare palindrom ignorand diferenta majuscule/minuscule",
    difficulty: "medium",
    tags: ["siruri", "prelucrari-elementare", "palindrom"],
    statement: "Se citeste un sir de caractere s. Verificati daca sirul este palindrom, ignorand diferenta dintre litere mari si litere mici (de exemplu, 'AnA' este considerat palindrom).",
    input_format: IN_FMT_S,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Aduceti fiecare caracter comparat la litera mica inainte de a-l compara cu simetricul sau.",
    explanation: "Se compara, pentru fiecare pereche de pozitii simetrice (i, n-1-i), caracterele aduse in prealabil la litere mici; daca toate perechile coincid, sirul este palindrom.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
char laMica(char c) { if (c >= 'A' && c <= 'Z') return c - 'A' + 'a'; return c; }
int main() {
    string s; getline(cin, s);
    int n = s.size();
    bool ok = true;
    for (int i = 0; i < n / 2; i++) if (laMica(s[i]) != laMica(s[n - 1 - i])) ok = false;
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def la_mica(c):
    if "A" <= c <= "Z":
        return chr(ord(c) - ord("A") + ord("a"))
    return c

s = input()
n = len(s)
ok = True
for i in range(n // 2):
    if la_mica(s[i]) != la_mica(s[n - 1 - i]):
        ok = False
print("DA" if ok else "NU")
`,
    tests: ["AnA", "Ana", "RaceCar", "Programare", "AbaAbA"],
  },
  {
    slug: "elem-inverseaza-doar-vocale",
    title: "Inversarea doar a vocalelor dintr-un sir",
    difficulty: "hard",
    tags: ["siruri", "prelucrari-elementare", "vocale"],
    statement: "Se citeste un sir de caractere s, format doar din litere ale alfabetului englez. Afisati sirul obtinut prin inversarea ordinii vocalelor din sir, in timp ce toate celelalte litere (consoanele) raman pe pozitiile lor initiale.",
    input_format: IN_FMT_S_LETTERE,
    output_format: "Se afiseaza sirul rezultat, pe o singura linie.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Folositi doi indici, unul pornind de la inceput si unul de la sfarsit, care avanseaza doar cand gasesc o vocala; cand ambii indici indica vocale, interschimbati-le.",
    explanation: "Se folosesc doi indici, i pornind de la inceputul sirului si j de la sfarsit. Fiecare indice avanseaza (respectiv retrogradeaza) pana gaseste o vocala. Cand ambii indica vocale, cele doua vocale se interschimba, apoi ambii indici avanseaza unul spre celalalt, pana cand i >= j.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    string voc = "aeiouAEIOU";
    int i = 0, j = (int)s.size() - 1;
    while (i < j) {
        while (i < j && voc.find(s[i]) == string::npos) i++;
        while (i < j && voc.find(s[j]) == string::npos) j--;
        if (i < j) {
            swap(s[i], s[j]);
            i++; j--;
        }
    }
    cout << s << "\\n";
    return 0;
}
`,
    py: `s = list(input())
voc = "aeiouAEIOU"
i, j = 0, len(s) - 1
while i < j:
    while i < j and s[i] not in voc:
        i += 1
    while i < j and s[j] not in voc:
        j -= 1
    if i < j:
        s[i], s[j] = s[j], s[i]
        i += 1
        j -= 1
print("".join(s))
`,
    tests: ["programare", "Informatica", "bcdfg", "aeiou", "leetcode"],
  },
  {
    slug: "elem-rotatie-stanga",
    title: "Deplasarea circulara la stanga a unui sir",
    difficulty: "medium",
    tags: ["siruri", "prelucrari-elementare", "rotatie"],
    statement: "Se citesc un sir de caractere s si un numar natural k (0 <= k <= lungimea lui s). Afisati sirul obtinut prin deplasarea circulara la stanga a caracterelor lui s cu k pozitii (primele k caractere ajung la sfarsit).",
    input_format: "Pe prima linie se citeste sirul s. Pe a doua linie se citeste numarul natural k.",
    output_format: "Se afiseaza sirul rezultat, pe o singura linie.",
    constraints: "1 <= lungimea sirului s <= 200, 0 <= k <= lungimea sirului s",
    hints: "Rezultatul este format din caracterele de pe pozitiile k, k+1, ..., n-1, urmate de caracterele de pe pozitiile 0, 1, ..., k-1.",
    explanation: "Sirul rezultat se construieste concatenand subsirul format din caracterele de la pozitia k pana la final cu subsirul format din primele k caractere.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int k; cin >> k;
    string rez = s.substr(k) + s.substr(0, k);
    cout << rez << "\\n";
    return 0;
}
`,
    py: `s = input()
k = int(input())
rez = s[k:] + s[:k]
print(rez)
`,
    tests: ["abcdef\n2", "programare\n0", "abcdef\n6", "informatica\n5", "abc\n1"],
  },
  {
    slug: "elem-rotatie-dreapta",
    title: "Deplasarea circulara la dreapta a unui sir",
    difficulty: "medium",
    tags: ["siruri", "prelucrari-elementare", "rotatie"],
    statement: "Se citesc un sir de caractere s si un numar natural k (0 <= k <= lungimea lui s). Afisati sirul obtinut prin deplasarea circulara la dreapta a caracterelor lui s cu k pozitii (ultimele k caractere ajung la inceput).",
    input_format: "Pe prima linie se citeste sirul s. Pe a doua linie se citeste numarul natural k.",
    output_format: "Se afiseaza sirul rezultat, pe o singura linie.",
    constraints: "1 <= lungimea sirului s <= 200, 0 <= k <= lungimea sirului s",
    hints: "Rezultatul este format din ultimele k caractere ale lui s, urmate de restul caracterelor, in ordinea originala.",
    explanation: "Sirul rezultat se construieste concatenand subsirul format din ultimele k caractere cu subsirul format din primele n-k caractere.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int k; cin >> k;
    int n = s.size();
    string rez = s.substr(n - k) + s.substr(0, n - k);
    cout << rez << "\\n";
    return 0;
}
`,
    py: `s = input()
k = int(input())
n = len(s)
rez = s[n - k:] + s[:n - k]
print(rez)
`,
    tests: ["abcdef\n2", "programare\n0", "abcdef\n6", "informatica\n5", "abc\n1"],
  },
  {
    slug: "elem-anagrame",
    title: "Verificare daca doua siruri sunt anagrame",
    difficulty: "medium",
    tags: ["siruri", "prelucrari-elementare", "anagrame"],
    statement: "Se citesc doua siruri de caractere s1 si s2, formate doar din litere mici ale alfabetului englez. Verificati daca cele doua siruri sunt anagrame, adica sunt formate din aceleasi litere, in numere egale, indiferent de ordine.",
    input_format: "Pe prima linie se citeste sirul s1. Pe a doua linie se citeste sirul s2.",
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= lungimea sirurilor <= 200",
    hints: "Daca sirurile au lungimi diferite, nu pot fi anagrame. Altfel, comparati frecventele fiecarei litere din cele doua siruri.",
    explanation: "Se calculeaza frecventa fiecarei litere din cele doua siruri (de exemplu in doua vectoare de dimensiune 26). Sirurile sunt anagrame daca si numai daca au aceeasi lungime si frecventele corespunzatoare sunt egale pentru fiecare litera.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s1; getline(cin, s1);
    string s2; getline(cin, s2);
    if (s1.size() != s2.size()) { cout << "NU\\n"; return 0; }
    int f1[26] = {0}, f2[26] = {0};
    for (char c : s1) f1[c - 'a']++;
    for (char c : s2) f2[c - 'a']++;
    bool ok = true;
    for (int i = 0; i < 26; i++) if (f1[i] != f2[i]) ok = false;
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s1 = input()
s2 = input()
if len(s1) != len(s2):
    print("NU")
else:
    f1 = [0] * 26
    f2 = [0] * 26
    for c in s1:
        f1[ord(c) - ord("a")] += 1
    for c in s2:
        f2[ord(c) - ord("a")] += 1
    print("DA" if f1 == f2 else "NU")
`,
    tests: ["ceai\naice", "programare\nprogramare", "abc\nabd", "listen\nsilent", "aab\naba"],
  },
  {
    slug: "elem-este-rotatie",
    title: "Verificare daca un sir este o rotatie a altui sir",
    difficulty: "medium",
    tags: ["siruri", "prelucrari-elementare", "rotatie"],
    statement: "Se citesc doua siruri de caractere s1 si s2. Verificati daca s2 se poate obtine dintr-o deplasare circulara (rotatie) a lui s1.",
    input_format: "Pe prima linie se citeste sirul s1. Pe a doua linie se citeste sirul s2.",
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= lungimea sirurilor <= 200",
    hints: "Daca s1 si s2 au aceeasi lungime, verificati daca s2 apare ca subsir contiguu in s1+s1.",
    explanation: "Daca lungimile difera, raspunsul este NU direct. Altfel, se construieste sirul dublu s1+s1 si se verifica, printr-o cautare manuala de subsir contiguu, daca s2 apare in acest sir dublu; orice rotatie a lui s1 apare ca subsir contiguu in s1+s1.\n\n**Complexitate:** O(n^2)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s1; getline(cin, s1);
    string s2; getline(cin, s2);
    if (s1.size() != s2.size()) { cout << "NU\\n"; return 0; }
    string dublu = s1 + s1;
    int n = s2.size();
    bool gasit = false;
    for (int i = 0; i + n <= (int)dublu.size(); i++) {
        bool egal = true;
        for (int j = 0; j < n; j++) if (dublu[i + j] != s2[j]) { egal = false; break; }
        if (egal) { gasit = true; break; }
    }
    cout << (gasit ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s1 = input()
s2 = input()
if len(s1) != len(s2):
    print("NU")
else:
    dublu = s1 + s1
    n = len(s2)
    gasit = False
    for i in range(len(dublu) - n + 1):
        egal = True
        for j in range(n):
            if dublu[i + j] != s2[j]:
                egal = False
                break
        if egal:
            gasit = True
            break
    print("DA" if gasit else "NU")
`,
    tests: ["abcde\ncdeab", "abcde\nabced", "waterbottle\nerbottlewat", "abc\nabc", "abc\ncab"],
  },
  {
    slug: "elem-numar-cifre-pare",
    title: "Numarul de cifre pare dintr-un sir",
    difficulty: "easy",
    tags: ["siruri", "prelucrari-elementare", "cifre", "paritate"],
    statement: "Se citeste un sir de caractere s, care poate contine litere, cifre si alte caractere. Determinati cate dintre caracterele sale sunt cifre pare (0, 2, 4, 6 sau 8).",
    input_format: IN_FMT_S,
    output_format: "Se afiseaza numarul de cifre pare din sir.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Un caracter este cifra para daca este cifra si valoarea sa numerica este para.",
    explanation: "Se parcurge sirul si se incrementeaza un contor pentru fiecare caracter care este cifra si a carui valoare numerica (c - '0') este para.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int cnt = 0;
    for (char c : s) {
        if (c >= '0' && c <= '9' && (c - '0') % 2 == 0) cnt++;
    }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `s = input()
cnt = 0
for c in s:
    if "0" <= c <= "9" and (ord(c) - ord("0")) % 2 == 0:
        cnt += 1
print(cnt)
`,
    tests: ["Nota10 la Info2026", "13579", "02468", "abc", "a1b3c5d7e9f0"],
  },
  {
    slug: "elem-cezar-codificare",
    title: "Codificarea Caesar a unui sir",
    difficulty: "medium",
    tags: ["siruri", "prelucrari-elementare", "codificare"],
    statement: "Se citesc un sir de caractere s, format doar din litere ale alfabetului englez, si un numar natural k (0 <= k <= 25). Codificati sirul folosind cifrul lui Caesar: fiecare litera este inlocuita cu litera aflata la k pozitii mai departe in alfabet (circular, pastrand tipul literei: mica ramane mica, mare ramane mare).",
    input_format: "Pe prima linie se citeste sirul s. Pe a doua linie se citeste numarul natural k.",
    output_format: "Se afiseaza sirul codificat, pe o singura linie.",
    constraints: "1 <= lungimea sirului s <= 200, 0 <= k <= 25",
    hints: "Pentru o litera mica c, litera codificata este 'a' + (c - 'a' + k) % 26; analog pentru litere mari, cu 'A'.",
    explanation: "Fiecare litera este deplasata circular cu k pozitii in alfabet, folosind aritmetica modulo 26 aplicata pe pozitia relativa a literei fata de inceputul alfabetului sau (mic sau mare), pentru a pastra tipul literei.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int k; cin >> k;
    for (char &c : s) {
        if (c >= 'a' && c <= 'z') c = 'a' + (c - 'a' + k) % 26;
        else if (c >= 'A' && c <= 'Z') c = 'A' + (c - 'A' + k) % 26;
    }
    cout << s << "\\n";
    return 0;
}
`,
    py: `s = input()
k = int(input())
rez = []
for c in s:
    if "a" <= c <= "z":
        c = chr(ord("a") + (ord(c) - ord("a") + k) % 26)
    elif "A" <= c <= "Z":
        c = chr(ord("A") + (ord(c) - ord("A") + k) % 26)
    rez.append(c)
print("".join(rez))
`,
    tests: ["abc\n1", "xyz\n3", "HelloWorld\n5", "Programare\n0", "AtaqueZebra\n25"],
  },
  {
    slug: "elem-cezar-decodificare",
    title: "Decodificarea Caesar a unui sir",
    difficulty: "medium",
    tags: ["siruri", "prelucrari-elementare", "codificare"],
    statement: "Se citesc un sir de caractere s, format doar din litere ale alfabetului englez, obtinut prin codificarea Caesar cu cheia k, si numarul k (0 <= k <= 25). Decodificati sirul, obtinand textul original.",
    input_format: "Pe prima linie se citeste sirul codificat s. Pe a doua linie se citeste numarul natural k.",
    output_format: "Se afiseaza sirul decodificat, pe o singura linie.",
    constraints: "1 <= lungimea sirului s <= 200, 0 <= k <= 25",
    hints: "Decodificarea este echivalenta cu o codificare Caesar cu cheia (26 - k) % 26.",
    explanation: "Decodificarea unui text cifrat Caesar cu cheia k se obtine aplicand aceeasi deplasare circulara, dar in sens invers, ceea ce este echivalent cu o codificare Caesar folosind cheia (26 - k) % 26.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int k; cin >> k;
    k = (26 - k % 26) % 26;
    for (char &c : s) {
        if (c >= 'a' && c <= 'z') c = 'a' + (c - 'a' + k) % 26;
        else if (c >= 'A' && c <= 'Z') c = 'A' + (c - 'A' + k) % 26;
    }
    cout << s << "\\n";
    return 0;
}
`,
    py: `s = input()
k = int(input())
k = (26 - k % 26) % 26
rez = []
for c in s:
    if "a" <= c <= "z":
        c = chr(ord("a") + (ord(c) - ord("a") + k) % 26)
    elif "A" <= c <= "Z":
        c = chr(ord("A") + (ord(c) - ord("A") + k) % 26)
    rez.append(c)
print("".join(rez))
`,
    tests: ["bcd\n1", "abc\n3", "MjqqtBtwqi\n5", "Programare\n0", "ZsZptfYfmwZ\n25"],
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
