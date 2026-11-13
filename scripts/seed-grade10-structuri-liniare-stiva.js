const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade10", chapter: "structuri-liniare", sub: "stiva" };

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
    slug: "stiva-operatii-simulare",
    title: "Simularea operatiilor PUSH si POP pe o stiva",
    difficulty: "easy",
    tags: ["stiva", "stack", "simulare"],
    statement: "Se citesc n operatii asupra unei stive initial vide. Fiecare operatie este de forma 'PUSH x' (adauga x in varful stivei) sau 'POP' (elimina elementul din varful stivei; daca stiva este vida, operatia se ignora). Afisati continutul final al stivei, de la baza spre varf.",
    input_format: IN_FMT_OPERATII + " O operatie PUSH este urmata de valoarea intreaga x.",
    output_format: "Se afiseaza elementele ramase in stiva, de la baza spre varf, separate prin spatiu, pe o singura linie (linie goala daca stiva este vida).",
    constraints: "1 <= n <= 200, valorile x sunt numere intregi",
    hints: "Folositi un vector ca stiva: PUSH adauga la sfarsit, POP elimina ultimul element (daca exista).",
    explanation: "Se simuleaza stiva folosind un vector: la PUSH x se adauga x la finalul vectorului (varful stivei), iar la POP se elimina ultimul element, doar daca vectorul nu este vid. La final, vectorul contine exact elementele stivei, de la baza (inceputul vectorului) spre varf (sfarsitul vectorului).\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> stiva;
    for (int i = 0; i < n; i++) {
        string op; cin >> op;
        if (op == "PUSH") {
            int x; cin >> x;
            stiva.push_back(x);
        } else {
            if (!stiva.empty()) stiva.pop_back();
        }
    }
    for (int i = 0; i < (int)stiva.size(); i++) {
        cout << stiva[i];
        if (i + 1 < (int)stiva.size()) cout << ' ';
    }
    cout << "\\n";
    return 0;
}
`,
    py: `n = int(input())
stiva = []
for _ in range(n):
    parts = input().split()
    if parts[0] == "PUSH":
        stiva.append(int(parts[1]))
    else:
        if stiva:
            stiva.pop()
print(" ".join(map(str, stiva)))
`,
    tests: [
      "5\nPUSH 1\nPUSH 2\nPUSH 3\nPOP\nPUSH 4",
      "3\nPUSH 10\nPUSH 20\nPOP",
      "6\nPUSH 1\nPOP\nPUSH 2\nPOP\nPUSH 3\nPUSH 4",
      "1\nPUSH 5",
      "4\nPUSH 1\nPUSH 2\nPUSH 3\nPOP",
    ],
  },
  {
    slug: "stiva-paranteze-multiple",
    title: "Verificarea corectitudinii parantezelor de mai multe tipuri",
    difficulty: "medium",
    tags: ["stiva", "stack", "paranteze"],
    statement: "Se citeste un sir format doar din caracterele '(', ')', '[', ']', '{' si '}'. Folosind o stiva, verificati daca parantezele sunt corect inchise: fiecare paranteza inchisa trebuie sa corespunda ultimei paranteze deschise si neinchise inca, de acelasi tip.",
    input_format: "Se citeste un sir de caractere, pe o singura linie, format doar din '(', ')', '[', ']', '{', '}'.",
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= lungimea sirului <= 200",
    hints: "Puneti in stiva fiecare paranteza deschisa. La o paranteza inchisa, verificati ca varful stivei este paranteza deschisa corespunzatoare si scoateti-o.",
    explanation: "Se parcurge sirul caracter cu caracter. La o paranteza deschisa, aceasta se adauga in stiva. La o paranteza inchisa, se verifica daca stiva este nevida si daca varful ei este paranteza deschisa corespunzatoare tipului curent; daca da, se scoate din stiva, altfel sirul este incorect. La final, sirul este corect doar daca stiva a ramas vida (toate parantezele deschise au fost inchise).\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    vector<char> stiva;
    bool ok = true;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') stiva.push_back(c);
        else {
            if (stiva.empty()) { ok = false; break; }
            char top = stiva.back(); stiva.pop_back();
            if ((c == ')' && top != '(') || (c == ']' && top != '[') || (c == '}' && top != '{')) { ok = false; break; }
        }
    }
    if (!stiva.empty()) ok = false;
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s = input()
stiva = []
ok = True
pairs = {")": "(", "]": "[", "}": "{"}
for c in s:
    if c in "([{":
        stiva.append(c)
    else:
        if not stiva or stiva[-1] != pairs[c]:
            ok = False
            break
        stiva.pop()
if stiva:
    ok = False
print("DA" if ok else "NU")
`,
    tests: ["([{}])", "([)]", "{[()]}", "(((", "()[]{}"],
  },
  {
    slug: "stiva-evaluare-postfixata",
    title: "Evaluarea unei expresii postfixate (RPN) folosind o stiva",
    difficulty: "medium",
    tags: ["stiva", "stack", "expresii", "rpn"],
    statement: "Se citeste o expresie aritmetica in notatie postfixata (RPN), avand simbolurile (numere si operatori +, -, *, /) separate prin spatiu. Evaluati expresia folosind o stiva si afisati rezultatul. Se garanteaza ca toate impartirile intalnite sunt exacte.",
    input_format: "Se citeste expresia postfixata, pe o singura linie, cu simbolurile separate prin spatiu.",
    output_format: "Se afiseaza valoarea expresiei.",
    constraints: "1 <= numarul de simboluri <= 100",
    hints: "Parcurgeti simbolurile: un numar se pune in stiva; un operator scoate ultimele doua valori din stiva, aplica operatia si pune rezultatul inapoi in stiva.",
    explanation: "Se parcurg simbolurile expresiei in ordine. Daca simbolul este un numar, se adauga in stiva. Daca este un operator, se scot din stiva ultimele doua valori (b, apoi a, in aceasta ordine, deoarece b a fost pusa ultima), se calculeaza a operator b, iar rezultatul se pune inapoi in stiva. La final, stiva contine o singura valoare, rezultatul expresiei.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string linie; getline(cin, linie);
    stringstream ss(linie);
    string tok;
    vector<long long> stiva;
    while (ss >> tok) {
        if (tok == "+" || tok == "-" || tok == "*" || tok == "/") {
            long long b = stiva.back(); stiva.pop_back();
            long long a = stiva.back(); stiva.pop_back();
            long long r;
            if (tok == "+") r = a + b;
            else if (tok == "-") r = a - b;
            else if (tok == "*") r = a * b;
            else r = a / b;
            stiva.push_back(r);
        } else {
            stiva.push_back(stoll(tok));
        }
    }
    cout << stiva.back() << "\\n";
    return 0;
}
`,
    py: `tokens = input().split()
stiva = []
for tok in tokens:
    if tok in ("+", "-", "*", "/"):
        b = stiva.pop()
        a = stiva.pop()
        if tok == "+":
            r = a + b
        elif tok == "-":
            r = a - b
        elif tok == "*":
            r = a * b
        else:
            r = a // b
        stiva.append(r)
    else:
        stiva.append(int(tok))
print(stiva[-1])
`,
    tests: ["3 4 +", "5 1 2 + 4 * + 3 -", "10 2 /", "2 3 4 * +", "6 2 3 + -"],
  },
  {
    slug: "stiva-infix-postfix",
    title: "Conversia unei expresii infixate in expresie postfixata",
    difficulty: "hard",
    tags: ["stiva", "stack", "expresii", "shunting-yard"],
    statement: "Se citeste o expresie aritmetica infixata, cu simbolurile (numere, operatori +, -, *, / si paranteze rotunde) separate prin spatiu. Folosind o stiva, convertiti expresia in notatie postfixata (RPN), respectand precedenta operatorilor (* si / au precedenta mai mare decat + si -) si asociativitatea la stanga.",
    input_format: "Se citeste expresia infixata, pe o singura linie, cu simbolurile separate prin spatiu.",
    output_format: "Se afiseaza expresia postfixata rezultata, cu simbolurile separate prin spatiu.",
    constraints: "1 <= numarul de simboluri <= 100, parantezele sunt corect echilibrate",
    hints: "Algoritmul Shunting-Yard: numerele se trimit direct la iesire; operatorii se pun in stiva dupa ce se scot mai intai din varful stivei toti operatorii cu precedenta cel putin egala; '(' se pune in stiva, iar la ')' se scot din stiva toate simbolurile pana la '(' inclusiv.",
    explanation: "Se foloseste algoritmul Shunting-Yard cu o stiva pentru operatori si paranteze si o lista pentru rezultat: un numar se adauga direct la rezultat; '(' se pune in stiva; la ')' se scot din stiva si se adauga la rezultat toate simbolurile pana cand se intalneste '(' (care se elimina din stiva fara a fi adaugata la rezultat); un operator determina scoaterea din stiva, catre rezultat, a tuturor operatorilor din varful stivei care nu sunt '(' si au precedenta cel putin egala cu a operatorului curent, dupa care operatorul curent este pus in stiva. La final, toate simbolurile ramase in stiva sunt mutate, in ordine, la rezultat.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int precedenta(const string &op) {
    if (op == "+" || op == "-") return 1;
    if (op == "*" || op == "/") return 2;
    return 0;
}
int main() {
    string linie; getline(cin, linie);
    stringstream ss(linie);
    string tok;
    vector<string> stiva;
    vector<string> rez;
    while (ss >> tok) {
        if (tok == "(") {
            stiva.push_back(tok);
        } else if (tok == ")") {
            while (!stiva.empty() && stiva.back() != "(") {
                rez.push_back(stiva.back());
                stiva.pop_back();
            }
            if (!stiva.empty()) stiva.pop_back();
        } else if (tok == "+" || tok == "-" || tok == "*" || tok == "/") {
            while (!stiva.empty() && stiva.back() != "(" && precedenta(stiva.back()) >= precedenta(tok)) {
                rez.push_back(stiva.back());
                stiva.pop_back();
            }
            stiva.push_back(tok);
        } else {
            rez.push_back(tok);
        }
    }
    while (!stiva.empty()) {
        rez.push_back(stiva.back());
        stiva.pop_back();
    }
    for (int i = 0; i < (int)rez.size(); i++) {
        cout << rez[i];
        if (i + 1 < (int)rez.size()) cout << ' ';
    }
    cout << "\\n";
    return 0;
}
`,
    py: `def precedenta(op):
    if op in ("+", "-"):
        return 1
    if op in ("*", "/"):
        return 2
    return 0

tokens = input().split()
stiva = []
rez = []
for tok in tokens:
    if tok == "(":
        stiva.append(tok)
    elif tok == ")":
        while stiva and stiva[-1] != "(":
            rez.append(stiva.pop())
        if stiva:
            stiva.pop()
    elif tok in ("+", "-", "*", "/"):
        while stiva and stiva[-1] != "(" and precedenta(stiva[-1]) >= precedenta(tok):
            rez.append(stiva.pop())
        stiva.append(tok)
    else:
        rez.append(tok)
while stiva:
    rez.append(stiva.pop())
print(" ".join(rez))
`,
    tests: ["3 + 4 * 2", "( 1 + 2 ) * 3", "8 - 2 - 3", "2 * ( 3 + 4 ) - 5", "10 / 2 / 5"],
  },
  {
    slug: "stiva-inversare-sir",
    title: "Inversarea unui sir de caractere folosind o stiva",
    difficulty: "easy",
    tags: ["stiva", "stack", "siruri"],
    statement: "Se citeste un sir de caractere. Folosind o stiva, afisati sirul inversat: puneti pe rand toate caracterele in stiva, apoi scoateti-le si construiti rezultatul.",
    input_format: "Se citeste un sir de caractere, pe o singura linie.",
    output_format: "Se afiseaza sirul inversat, pe o singura linie.",
    constraints: "1 <= lungimea sirului <= 200",
    hints: "Adaugati fiecare caracter in stiva pe rand, apoi scoateti caracterele din stiva (in ordine inversa fata de adaugare) pentru a construi rezultatul.",
    explanation: "Se adauga fiecare caracter al sirului, in ordine, intr-o stiva. Deoarece o stiva scoate elementele in ordinea inversa adaugarii (ultimul intrat, primul iesit), scoaterea succesiva a caracterelor din stiva si adaugarea lor la rezultat produce exact sirul inversat.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    vector<char> stiva;
    for (char c : s) stiva.push_back(c);
    string rez = "";
    while (!stiva.empty()) { rez += stiva.back(); stiva.pop_back(); }
    cout << rez << "\\n";
    return 0;
}
`,
    py: `s = input()
stiva = list(s)
rez = []
while stiva:
    rez.append(stiva.pop())
print("".join(rez))
`,
    tests: ["programare", "abc", "stiva", "a", "12345"],
  },
  {
    slug: "stiva-verificare-palindrom",
    title: "Verificarea unui palindrom folosind o stiva",
    difficulty: "easy",
    tags: ["stiva", "stack", "palindrom"],
    statement: "Se citeste un sir de caractere. Folosind o stiva in care puneti prima jumatate a sirului, verificati daca sirul este palindrom, comparand elementele scoase din stiva cu a doua jumatate a sirului.",
    input_format: "Se citeste un sir de caractere, pe o singura linie.",
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= lungimea sirului <= 200",
    hints: "Puneti primele n/2 caractere in stiva. Apoi, pentru fiecare caracter din a doua jumatate a sirului (sarind peste caracterul din mijloc, daca lungimea este impara), comparati-l cu varful stivei si scoateti-l.",
    explanation: "Se pun in stiva primele n/2 caractere ale sirului. Apoi se parcurge a doua jumatate a sirului (incepand dupa mijloc, daca lungimea este impara) si, pentru fiecare caracter, se compara cu varful stivei; daca sunt egale, se scoate din stiva si se continua, altfel sirul nu este palindrom. Sirul este palindrom daca toate comparatiile reusesc.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int n = s.size();
    vector<char> stiva;
    for (int i = 0; i < n / 2; i++) stiva.push_back(s[i]);
    int start = (n % 2 == 0) ? n / 2 : n / 2 + 1;
    bool ok = true;
    for (int i = start; i < n; i++) {
        if (stiva.empty() || stiva.back() != s[i]) { ok = false; break; }
        stiva.pop_back();
    }
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s = input()
n = len(s)
stiva = list(s[: n // 2])
start = n // 2 if n % 2 == 0 else n // 2 + 1
ok = True
for i in range(start, n):
    if not stiva or stiva[-1] != s[i]:
        ok = False
        break
    stiva.pop()
print("DA" if ok else "NU")
`,
    tests: ["ana", "abba", "abcd", "racecar", "abccba"],
  },
  {
    slug: "stiva-maxim-in-o1",
    title: "Stiva cu determinarea elementului maxim in O(1)",
    difficulty: "medium",
    tags: ["stiva", "stack", "maxim"],
    statement: "Se citesc n operatii asupra unei stive initial vide, de tipul 'PUSH x', 'POP' sau 'MAX'. Operatia MAX trebuie sa afiseze maximul elementelor curente din stiva. Implementati stiva folosind o stiva auxiliara care retine, la fiecare nivel, maximul de pana atunci, astfel incat MAX sa functioneze in O(1). Se garanteaza ca MAX si POP nu se aplica pe o stiva vida.",
    input_format: IN_FMT_OPERATII + " O operatie PUSH este urmata de valoarea intreaga x.",
    output_format: "Pentru fiecare operatie MAX, se afiseaza pe o linie separata maximul curent din stiva.",
    constraints: "1 <= n <= 200, valorile x sunt numere intregi, MAX si POP nu apar cand stiva este vida",
    hints: "Mentineti, pe langa stiva principala, o a doua stiva in care la fiecare PUSH x adaugati maximul dintre x si varful actual al acestei a doua stive.",
    explanation: "Se mentin doua stive: una cu elementele efective, si una auxiliara in care la fiecare PUSH x se adauga maximul dintre x si valoarea de pe varful stivei auxiliare (sau x, daca aceasta este vida). La POP, ambele stive elimina varful. La MAX, se afiseaza varful stivei auxiliare, care contine exact maximul elementelor curente din stiva principala, obtinut in O(1).\n\n**Complexitate:** O(1) per operatie, O(n) total",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> stiva, maxim;
    for (int i = 0; i < n; i++) {
        string op; cin >> op;
        if (op == "PUSH") {
            int x; cin >> x;
            stiva.push_back(x);
            if (maxim.empty() || x > maxim.back()) maxim.push_back(x);
            else maxim.push_back(maxim.back());
        } else if (op == "POP") {
            if (!stiva.empty()) { stiva.pop_back(); maxim.pop_back(); }
        } else {
            cout << maxim.back() << "\\n";
        }
    }
    return 0;
}
`,
    py: `n = int(input())
stiva = []
maxim = []
out = []
for _ in range(n):
    parts = input().split()
    op = parts[0]
    if op == "PUSH":
        x = int(parts[1])
        stiva.append(x)
        maxim.append(x if not maxim or x > maxim[-1] else maxim[-1])
    elif op == "POP":
        if stiva:
            stiva.pop()
            maxim.pop()
    else:
        out.append(str(maxim[-1]))
print("\\n".join(out))
`,
    tests: [
      "6\nPUSH 3\nPUSH 5\nMAX\nPUSH 2\nMAX\nPOP",
      "5\nPUSH 1\nPUSH 2\nPUSH 3\nMAX\nPOP",
      "8\nPUSH 5\nPOP\nPUSH 1\nPUSH 9\nPUSH 4\nMAX\nPOP\nMAX",
      "3\nPUSH 7\nPUSH 7\nMAX",
      "10\nPUSH 4\nPUSH 8\nPUSH 2\nMAX\nPOP\nMAX\nPOP\nMAX\nPUSH 10\nMAX",
    ],
  },
  {
    slug: "stiva-element-mai-mare-dreapta",
    title: "Urmatorul element mai mare din dreapta, folosind o stiva",
    difficulty: "medium",
    tags: ["stiva", "stack", "next-greater-element"],
    statement: "Se citeste un vector de n numere intregi. Pentru fiecare element, determinati primul element mai mare decat el, aflat la dreapta lui (sau -1, daca nu exista un astfel de element).",
    input_format: "Pe prima linie se citeste n. Pe a doua linie se citesc cele n numere.",
    output_format: "Se afiseaza n numere separate prin spatiu: pentru fiecare element, primul element mai mare din dreapta, sau -1.",
    constraints: "1 <= n <= 200",
    hints: "Parcurgeti vectorul si mentineti in stiva indicii elementelor pentru care raspunsul nu a fost inca gasit; cand intalniti un element mai mare decat varful stivei, acela este raspunsul pentru indicele din varf.",
    explanation: "Se parcurge vectorul de la stanga la dreapta, mentinand in stiva indicii elementelor al caror 'urmator element mai mare' nu a fost inca gasit. La fiecare element nou a[i], cat timp stiva este nevida si elementul de la indicele din varful stivei este mai mic decat a[i], acel element si-a gasit raspunsul (a[i]) si indicele se scoate din stiva; apoi indicele i se adauga in stiva. La final, indicii ramasi in stiva nu au un element mai mare in dreapta, deci raspunsul lor ramane -1.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> a(n);
    for (auto &x : a) cin >> x;
    vector<int> rez(n, -1);
    vector<int> stiva;
    for (int i = 0; i < n; i++) {
        while (!stiva.empty() && a[stiva.back()] < a[i]) {
            rez[stiva.back()] = a[i];
            stiva.pop_back();
        }
        stiva.push_back(i);
    }
    for (int i = 0; i < n; i++) {
        cout << rez[i];
        if (i + 1 < n) cout << ' ';
    }
    cout << "\\n";
    return 0;
}
`,
    py: `n = int(input())
a = list(map(int, input().split()))
rez = [-1] * n
stiva = []
for i in range(n):
    while stiva and a[stiva[-1]] < a[i]:
        rez[stiva.pop()] = a[i]
    stiva.append(i)
print(" ".join(map(str, rez)))
`,
    tests: ["4\n2 1 3 4", "5\n4 5 2 25 1", "3\n5 4 3", "1\n10", "6\n1 3 2 4 3 5"],
  },
  {
    slug: "stiva-adancime-maxima-paranteze",
    title: "Adancimea maxima de imbricare a parantezelor",
    difficulty: "easy",
    tags: ["stiva", "stack", "paranteze"],
    statement: "Se citeste un sir format doar din caracterele '(' si ')', corect echilibrat. Folosind o stiva (simulata printr-un contor de adancime), determinati adancimea maxima de imbricare a parantezelor.",
    input_format: "Se citeste un sir de caractere, pe o singura linie, format doar din '(' si ')'.",
    output_format: "Se afiseaza adancimea maxima de imbricare.",
    constraints: "1 <= lungimea sirului <= 200, sirul este corect echilibrat",
    hints: "Mentineti un contor care creste la '(' si scade la ')'; retineti valoarea maxima atinsa de contor.",
    explanation: "Se parcurge sirul, mentinand un contor care reprezinta dimensiunea curenta a stivei de paranteze deschise: creste cu 1 la '(' si scade cu 1 la ')'. Se retine valoarea maxima atinsa de acest contor pe parcursul parcurgerii, care reprezinta adancimea maxima de imbricare.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int adancime = 0, maxAd = 0;
    for (char c : s) {
        if (c == '(') { adancime++; maxAd = max(maxAd, adancime); }
        else if (c == ')') adancime--;
    }
    cout << maxAd << "\\n";
    return 0;
}
`,
    py: `s = input()
adancime = 0
max_ad = 0
for c in s:
    if c == "(":
        adancime += 1
        max_ad = max(max_ad, adancime)
    elif c == ")":
        adancime -= 1
print(max_ad)
`,
    tests: ["(())", "((()))", "()()()", "(()(()))", "()"],
  },
  {
    slug: "stiva-verifica-capacitate",
    title: "Simularea unei stive cu capacitate limitata",
    difficulty: "medium",
    tags: ["stiva", "stack", "capacitate"],
    statement: "Se citeste capacitatea maxima k a unei stive si n operatii de tipul 'PUSH x' sau 'POP'. Daca la PUSH stiva este plina (contine deja k elemente), afisati 'PLIN' si ignorati operatia. Daca la POP stiva este vida, afisati 'GOL' si ignorati operatia. La final, afisati continutul stivei, de la baza spre varf.",
    input_format: "Pe prima linie se citesc k si n. Urmeaza n linii, fiecare continand o operatie ('PUSH x' sau 'POP').",
    output_format: "Pentru fiecare operatie invalida se afiseaza 'PLIN' sau 'GOL' pe o linie separata, in ordinea in care apar. La final, pe o linie separata, se afiseaza elementele ramase in stiva, de la baza spre varf, separate prin spatiu.",
    constraints: "1 <= k <= 100, 1 <= n <= 200",
    hints: "Verificati dimensiunea curenta a stivei fata de k inainte de PUSH, respectiv daca stiva este vida inainte de POP.",
    explanation: "Se simuleaza stiva cu un vector. La 'PUSH x', daca dimensiunea curenta a stivei este egala cu k, se afiseaza 'PLIN' si operatia se ignora; altfel x se adauga in stiva. La 'POP', daca stiva este vida, se afiseaza 'GOL'; altfel se elimina ultimul element. La final se afiseaza continutul stivei, de la baza spre varf.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int k, n; cin >> k >> n;
    vector<int> stiva;
    for (int i = 0; i < n; i++) {
        string op; cin >> op;
        if (op == "PUSH") {
            int x; cin >> x;
            if ((int)stiva.size() == k) cout << "PLIN\\n";
            else stiva.push_back(x);
        } else {
            if (stiva.empty()) cout << "GOL\\n";
            else stiva.pop_back();
        }
    }
    for (int i = 0; i < (int)stiva.size(); i++) {
        cout << stiva[i];
        if (i + 1 < (int)stiva.size()) cout << ' ';
    }
    cout << "\\n";
    return 0;
}
`,
    py: `k, n = map(int, input().split())
stiva = []
out = []
for _ in range(n):
    parts = input().split()
    if parts[0] == "PUSH":
        x = int(parts[1])
        if len(stiva) == k:
            out.append("PLIN")
        else:
            stiva.append(x)
    else:
        if not stiva:
            out.append("GOL")
        else:
            stiva.pop()
out.append(" ".join(map(str, stiva)))
print("\\n".join(out))
`,
    tests: [
      "2 5\nPUSH 1\nPUSH 2\nPUSH 3\nPOP\nPUSH 4",
      "1 4\nPOP\nPUSH 5\nPUSH 6\nPOP",
      "3 3\nPUSH 1\nPUSH 2\nPUSH 3",
      "2 6\nPUSH 1\nPUSH 2\nPUSH 3\nPUSH 4\nPOP\nPOP",
      "5 2\nPOP\nPOP",
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
