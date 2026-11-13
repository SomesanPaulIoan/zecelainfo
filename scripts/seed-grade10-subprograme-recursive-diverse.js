const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade10", chapter: "subprograme-recursive", sub: "subprograme-recursive-diverse" };

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
    slug: "recursiv-div-hanoi-mutari",
    title: "Turnurile din Hanoi - numarul si lista mutarilor",
    difficulty: "medium",
    statement:
      "Se citeste un numar natural n, reprezentand numarul de discuri din jocul Turnurile din Hanoi (tijele se numesc A, B si C, iar toate discurile trebuie mutate de pe tija A pe tija C, folosind tija B ca ajutor). Scrieti un program care, folosind un subprogram recursiv, afiseaza mai intai numarul minim de mutari necesare, apoi fiecare mutare in parte, in ordine, sub forma 'X Y' (discul de deasupra tijei X se muta pe tija Y).",
    input_format: "Un numar natural n.",
    output_format: "Pe prima linie numarul minim de mutari, apoi cate o mutare pe linie, sub forma 'X Y'.",
    constraints: "0 <= n <= 10",
    difficulty_: "medium",
    tags: ["recursivitate", "hanoi"],
    hints: "Pentru a muta n discuri de pe X pe Z (folosind Y), mutati mai intai n-1 discuri de pe X pe Y, apoi discul ramas de pe X pe Z, apoi cele n-1 discuri de pe Y pe Z.",
    explanation:
      "Se aplica direct algoritmul clasic recursiv: hanoi(n, sursa, aux, dest) muta n-1 discuri pe tija auxiliara, afiseaza mutarea discului mare, apoi muta cele n-1 discuri de pe tija auxiliara pe destinatie. Numarul minim de mutari este 2^n - 1.\n\n**Complexitate:** O(2^n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
void hanoi(int n, char sursa, char auxiliar, char destinatie) {
    if (n == 0) return;
    hanoi(n - 1, sursa, destinatie, auxiliar);
    cout << sursa << " " << destinatie << "\\n";
    hanoi(n - 1, auxiliar, sursa, destinatie);
}
int main() {
    int n; cin >> n;
    cout << ((1 << n) - 1) << "\\n";
    hanoi(n, 'A', 'B', 'C');
    return 0;
}
`,
    py: `def hanoi(n, sursa, auxiliar, destinatie, mutari):
    if n == 0:
        return
    hanoi(n - 1, sursa, destinatie, auxiliar, mutari)
    mutari.append(f"{sursa} {destinatie}")
    hanoi(n - 1, auxiliar, sursa, destinatie, mutari)

n = int(input())
print((1 << n) - 1)
mutari = []
hanoi(n, "A", "B", "C", mutari)
print("\\n".join(mutari))
`,
    tests: ["0", "1", "2", "3", "4", "10"],
  },
  {
    slug: "recursiv-div-hanoi-tija-auxiliara",
    title: "Turnurile din Hanoi - mutarile care implica tija auxiliara",
    difficulty: "medium",
    tags: ["recursivitate", "hanoi"],
    statement:
      "Se citeste un numar natural n, reprezentand numarul de discuri din jocul Turnurile din Hanoi (mutare de pe tija A pe tija C, folosind tija B ca ajutor). Scrieti un program care, folosind un subprogram recursiv, determina si afiseaza cate dintre mutarile totale au tija B implicata (ca sursa sau ca destinatie), apoi afiseaza aceste mutari, in ordine.",
    input_format: "Un numar natural n.",
    output_format: "Pe prima linie numarul mutarilor care implica tija B, apoi cate o mutare pe linie, sub forma 'X Y'.",
    constraints: "0 <= n <= 10",
    hints: "Generati toate mutarile ca la Hanoi clasic, dar retineti doar cele in care sursa sau destinatia este 'B'.",
    explanation: "Se genereaza recursiv toate mutarile ca la algoritmul clasic Hanoi, retinandu-se doar cele in care tija B apare ca sursa sau ca destinatie.\n\n**Complexitate:** O(2^n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
vector<string> mutariB;
void hanoi(int n, char sursa, char auxiliar, char destinatie) {
    if (n == 0) return;
    hanoi(n - 1, sursa, destinatie, auxiliar);
    if (sursa == 'B' || destinatie == 'B') {
        mutariB.push_back(string(1, sursa) + " " + string(1, destinatie));
    }
    hanoi(n - 1, auxiliar, sursa, destinatie);
}
int main() {
    int n; cin >> n;
    hanoi(n, 'A', 'B', 'C');
    cout << mutariB.size() << "\\n";
    for (auto &m : mutariB) cout << m << "\\n";
    return 0;
}
`,
    py: `def hanoi(n, sursa, auxiliar, destinatie, mutariB):
    if n == 0:
        return
    hanoi(n - 1, sursa, destinatie, auxiliar, mutariB)
    if sursa == "B" or destinatie == "B":
        mutariB.append(f"{sursa} {destinatie}")
    hanoi(n - 1, auxiliar, sursa, destinatie, mutariB)

n = int(input())
mutariB = []
hanoi(n, "A", "B", "C", mutariB)
print(len(mutariB))
print("\\n".join(mutariB))
`,
    tests: ["0", "1", "2", "3", "4", "10"],
  },
  {
    slug: "recursiv-div-par-impar-mutual",
    title: "Paritate prin recursivitate mutuala",
    difficulty: "medium",
    tags: ["recursivitate", "recursivitate-mutuala"],
    statement:
      "Se citeste un numar natural n. Scrieti un program care determina daca n este par, folosind doua subprograme recursive care se apeleaza reciproc: unul verifica daca un numar este par (esteParMutual), celalalt daca este impar (esteImparMutual).",
    input_format: "Un numar natural n.",
    output_format: "1 daca n este par, 0 daca n este impar.",
    constraints: "0 <= n <= 1000",
    hints: "esteParMutual(0) este adevarat; esteParMutual(n) = esteImparMutual(n-1). Similar pentru esteImparMutual.",
    explanation: "Cele doua subprograme se definesc reciproc: esteParMutual(n) este adevarat daca esteImparMutual(n-1) este adevarat, si invers, cu cazurile de baza esteParMutual(0)=adevarat, esteImparMutual(0)=fals.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
bool esteImparMutual(int n);
bool esteParMutual(int n) {
    if (n == 0) return true;
    return esteImparMutual(n - 1);
}
bool esteImparMutual(int n) {
    if (n == 0) return false;
    return esteParMutual(n - 1);
}
int main() {
    int n; cin >> n;
    cout << (esteParMutual(n) ? 1 : 0) << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(3000)

def esteParMutual(n):
    if n == 0:
        return True
    return esteImparMutual(n - 1)

def esteImparMutual(n):
    if n == 0:
        return False
    return esteParMutual(n - 1)

n = int(input())
print(1 if esteParMutual(n) else 0)
`,
    tests: ["0", "1", "2", "999", "1000", "7"],
  },
  {
    slug: "recursiv-div-siruri-mutuale-ab",
    title: "Doua siruri definite prin recursivitate mutuala",
    difficulty: "medium",
    tags: ["recursivitate", "recursivitate-mutuala"],
    statement:
      "Se definesc doua siruri de numere intregi, prin recursivitate mutuala: A(0) = 1, B(0) = 0, iar pentru n >= 1: A(n) = n + B(n-1), B(n) = n - A(n-1). Se citeste un numar natural n; scrieti un program care calculeaza si afiseaza A(n) si B(n), separate printr-un spatiu.",
    input_format: "Un numar natural n.",
    output_format: "Valorile A(n) si B(n), separate printr-un spatiu.",
    constraints: "0 <= n <= 1000",
    hints: "Implementati cele doua subprograme A(n) si B(n) astfel incat fiecare sa il apeleze pe celalalt pentru n-1.",
    explanation: "A si B se apeleaza reciproc: A(n) foloseste B(n-1), iar B(n) foloseste A(n-1). Cazurile de baza sunt A(0)=1 si B(0)=0.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long A(int n);
long long B(int n);
long long A(int n) {
    if (n == 0) return 1;
    return n + B(n - 1);
}
long long B(int n) {
    if (n == 0) return 0;
    return n - A(n - 1);
}
int main() {
    int n; cin >> n;
    cout << A(n) << " " << B(n) << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(3000)

def A(n):
    if n == 0:
        return 1
    return n + B(n - 1)

def B(n):
    if n == 0:
        return 0
    return n - A(n - 1)

n = int(input())
print(A(n), B(n))
`,
    tests: ["0", "1", "2", "5", "10", "1000"],
  },
  {
    slug: "recursiv-div-tribonacci",
    title: "Al n-lea termen din sirul lui Tribonacci",
    difficulty: "medium",
    tags: ["recursivitate", "siruri-recursive"],
    statement:
      "Sirul lui Tribonacci este definit astfel: T(0) = 0, T(1) = 0, T(2) = 1, iar T(n) = T(n-1) + T(n-2) + T(n-3) pentru n >= 3. Se citeste un numar natural n; scrieti un program care calculeaza recursiv T(n).",
    input_format: "Un numar natural n.",
    output_format: "Valoarea T(n).",
    constraints: "0 <= n <= 22",
    time_limit_ms: 3000,
    hints: "Tratati explicit cazurile n=0, n=1 si n=2, apoi aplicati direct relatia de recurenta.",
    explanation: "Se aplica direct definitia recursiva a sirului, cu cele trei cazuri de baza T(0), T(1), T(2).\n\n**Complexitate:** exponentiala, O(3^n) in cazul cel mai defavorabil",
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long tribonacci(int n) {
    if (n == 0) return 0;
    if (n == 1) return 0;
    if (n == 2) return 1;
    return tribonacci(n - 1) + tribonacci(n - 2) + tribonacci(n - 3);
}
int main() {
    int n; cin >> n;
    cout << tribonacci(n) << "\\n";
    return 0;
}
`,
    py: `def tribonacci(n):
    if n == 0:
        return 0
    if n == 1:
        return 0
    if n == 2:
        return 1
    return tribonacci(n - 1) + tribonacci(n - 2) + tribonacci(n - 3)

n = int(input())
print(tribonacci(n))
`,
    tests: ["0", "1", "2", "10", "20", "22"],
  },
  {
    slug: "recursiv-div-numere-catalan",
    title: "Numarul lui Catalan de rang n",
    difficulty: "hard",
    tags: ["recursivitate", "combinatorica"],
    statement:
      "Numerele lui Catalan sunt definite astfel: C(0) = 1, iar C(n) = suma produselor C(i) * C(n-1-i), pentru i de la 0 la n-1, pentru n >= 1. Se citeste un numar natural n; scrieti un program care calculeaza recursiv C(n).",
    input_format: "Un numar natural n.",
    output_format: "Valoarea C(n).",
    constraints: "0 <= n <= 10",
    time_limit_ms: 3000,
    hints: "Implementati direct relatia de recurenta, insumand produsele C(i) * C(n-1-i) intr-un ciclu, unde fiecare C se calculeaza printr-un apel recursiv.",
    explanation: "Se aplica direct definitia recursiva; pentru fiecare n, se insumeaza produsele C(i) * C(n-1-i) pentru toate valorile posibile ale lui i.\n\n**Complexitate:** exponentiala fara memoizare",
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long catalan(int n) {
    if (n == 0) return 1;
    long long s = 0;
    for (int i = 0; i < n; i++) s += catalan(i) * catalan(n - 1 - i);
    return s;
}
int main() {
    int n; cin >> n;
    cout << catalan(n) << "\\n";
    return 0;
}
`,
    py: `def catalan(n):
    if n == 0:
        return 1
    s = 0
    for i in range(n):
        s += catalan(i) * catalan(n - 1 - i)
    return s

n = int(input())
print(catalan(n))
`,
    tests: ["0", "1", "2", "5", "8", "10"],
  },
  {
    slug: "recursiv-div-urcare-scara",
    title: "Numarul de moduri de a urca o scara",
    difficulty: "medium",
    tags: ["recursivitate", "combinatorica"],
    statement:
      "O persoana urca o scara cu n trepte, putand face la fiecare pas fie 1 treapta, fie 2 trepte. Se citeste numarul natural n; scrieti un program care calculeaza recursiv in cate moduri distincte poate urca persoana toata scara.",
    input_format: "Un numar natural n.",
    output_format: "Numarul de moduri distincte de a urca scara.",
    constraints: "0 <= n <= 28",
    time_limit_ms: 3000,
    hints: "Notati cu m(n) numarul de moduri de a urca n trepte. m(n) = m(n-1) + m(n-2), cu m(0) = 1.",
    explanation: "Ultimul pas facut poate fi de 1 sau de 2 trepte, deci m(n) = m(n-1) + m(n-2), cu conventia m(0)=1 (un singur mod: nu mai faci niciun pas) si m(negativ)=0.\n\n**Complexitate:** exponentiala fara memoizare",
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long numarModuri(int n) {
    if (n < 0) return 0;
    if (n == 0) return 1;
    return numarModuri(n - 1) + numarModuri(n - 2);
}
int main() {
    int n; cin >> n;
    cout << numarModuri(n) << "\\n";
    return 0;
}
`,
    py: `def numarModuri(n):
    if n < 0:
        return 0
    if n == 0:
        return 1
    return numarModuri(n - 1) + numarModuri(n - 2)

n = int(input())
print(numarModuri(n))
`,
    tests: ["0", "1", "2", "5", "10", "28"],
  },
  {
    slug: "recursiv-div-plata-suma-monede",
    title: "Numarul de moduri de a plati o suma cu monede date",
    difficulty: "hard",
    tags: ["recursivitate", "combinatorica"],
    statement:
      "Se citesc un numar natural S (suma de platit), un numar natural m si apoi m valori reprezentand tipurile de monede disponibile (fiecare tip de moneda poate fi folosit de oricate ori). Scrieti un program care calculeaza recursiv, folosind un subprogram cu doi parametri (suma ramasa si indexul tipului de moneda curent), in cate moduri distincte (fara a tine cont de ordinea monedelor) se poate obtine suma S folosind monedele date.",
    input_format: "Pe prima linie S si m, pe a doua linie cele m valori ale monedelor, separate prin spatiu.",
    output_format: "Numarul de moduri distincte de a obtine suma S.",
    constraints: "0 <= S <= 30, 1 <= m <= 5, 1 <= valoare_moneda <= 30",
    hints: "numarModuri(suma, index) = numarModuri(suma - moneda[index], index) + numarModuri(suma, index+1), cu cazurile de baza suma==0 (1 mod) si suma<0 sau index==m (0 moduri).",
    explanation:
      "La fiecare pas se decide fie folosirea inca o data a monedei curente (ramanand la acelasi index), fie trecerea la urmatorul tip de moneda (fara sa se mai foloseasca cea curenta). Suma 0 inseamna un mod valid gasit; suma negativa sau epuizarea tipurilor de monede inseamna esec.\n\n**Complexitate:** O(S * m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int m;
vector<int> monede;
long long numarModuriPlata(int suma, int index) {
    if (suma == 0) return 1;
    if (suma < 0 || index == m) return 0;
    return numarModuriPlata(suma - monede[index], index) + numarModuriPlata(suma, index + 1);
}
int main() {
    int S; cin >> S >> m;
    monede.resize(m);
    for (int i = 0; i < m; i++) cin >> monede[i];
    cout << numarModuriPlata(S, 0) << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(5000)

def numarModuriPlata(suma, index, monede, m):
    if suma == 0:
        return 1
    if suma < 0 or index == m:
        return 0
    return numarModuriPlata(suma - monede[index], index, monede, m) + numarModuriPlata(suma, index + 1, monede, m)

S, m = map(int, input().split())
monede = list(map(int, input().split()))
print(numarModuriPlata(S, 0, monede, m))
`,
    tests: ["0 2\n1 2", "5 2\n1 2", "10 3\n1 2 5", "7 1\n3", "30 3\n5 10 25", "3 3\n1 2 5"],
  },
  {
    slug: "recursiv-div-cmmdc-trei-numere",
    title: "Cel mai mare divizor comun a trei numere",
    difficulty: "easy",
    tags: ["recursivitate", "numere"],
    statement:
      "Se citesc trei numere naturale nenule a, b si c. Scrieti un program care, folosind un subprogram recursiv pentru cel mai mare divizor comun a doua numere (algoritmul lui Euclid), calculeaza cel mai mare divizor comun al celor trei numere.",
    input_format: "Trei numere naturale a, b si c.",
    output_format: "Cel mai mare divizor comun al numerelor a, b si c.",
    constraints: "1 <= a, b, c <= 10^9",
    hints: "cmmdc(a, b, c) = cmmdc(cmmdc(a, b), c).",
    explanation: "Se calculeaza mai intai cel mai mare divizor comun al primelor doua numere, folosind algoritmul lui Euclid implementat recursiv, apoi cel mai mare divizor comun al rezultatului cu al treilea numar.\n\n**Complexitate:** O(log(min(a,b,c)))",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int cmmdc(int a, int b) {
    if (b == 0) return a;
    return cmmdc(b, a % b);
}
int main() {
    int a, b, c; cin >> a >> b >> c;
    cout << cmmdc(cmmdc(a, b), c) << "\\n";
    return 0;
}
`,
    py: `def cmmdc(a, b):
    if b == 0:
        return a
    return cmmdc(b, a % b)

a, b, c = map(int, input().split())
print(cmmdc(cmmdc(a, b), c))
`,
    tests: ["12 18 24", "7 13 5", "1000000000 4 8", "100 100 100", "17 34 51", "999999937 12 6"],
  },
  {
    slug: "recursiv-div-siruri-anagrame",
    title: "Verificarea daca doua siruri sunt anagrame",
    difficulty: "medium",
    tags: ["recursivitate", "siruri"],
    statement:
      "Se citesc doua siruri de caractere s1 si s2, formate din litere mici. Scrieti un program care, folosind un subprogram recursiv ce elimina la fiecare pas prima litera din s1 si o aparitie a acesteia din s2 (daca exista), verifica daca cele doua siruri sunt anagrame (contin aceleasi litere, cu aceleasi frecvente, indiferent de ordine).",
    input_format: "Pe prima linie sirul s1, pe a doua linie sirul s2.",
    output_format: "1 daca cele doua siruri sunt anagrame, 0 in caz contrar.",
    constraints: "0 <= lungime(s1), lungime(s2) <= 200",
    hints: "Daca s1 este vid, cele doua siruri sunt anagrame doar daca si s2 este vid. Altfel, cauta prima litera din s1 in s2; daca nu exista, sirurile nu sunt anagrame.",
    explanation:
      "La fiecare pas se cauta in s2 prima aparitie a caracterului s1[0]; daca nu exista, sirurile nu pot fi anagrame. Daca exista, se elimina acel caracter din s2 si prima litera din s1, apoi se continua recursiv. Cazul de baza: s1 vid implica anagrame doar daca s2 este si el vid.\n\n**Complexitate:** O(lungime^2)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
bool suntAnagrame(string s1, string s2) {
    if (s1.empty()) return s2.empty();
    size_t pos = s2.find(s1[0]);
    if (pos == string::npos) return false;
    return suntAnagrame(s1.substr(1), s2.substr(0, pos) + s2.substr(pos + 1));
}
int main() {
    string s1, s2; cin >> s1 >> s2;
    cout << (suntAnagrame(s1, s2) ? 1 : 0) << "\\n";
    return 0;
}
`,
    py: `def suntAnagrame(s1, s2):
    if s1 == "":
        return s2 == ""
    pos = s2.find(s1[0])
    if pos == -1:
        return False
    return suntAnagrame(s1[1:], s2[:pos] + s2[pos + 1:])

s1 = input().strip()
s2 = input().strip()
print(1 if suntAnagrame(s1, s2) else 0)
`,
    tests: ["abc\ncba", "abc\nabd", "aabbcc\nabcabc", "aabbcc\naabbcd", "a\na", "listen\nsilent"],
  },
  {
    slug: "recursiv-div-elimina-caracter",
    title: "Eliminarea unui caracter dintr-un sir",
    difficulty: "easy",
    tags: ["recursivitate", "siruri"],
    statement:
      "Se citesc un sir de caractere s si un caracter c. Scrieti un program care, folosind un subprogram recursiv, elimina toate aparitiile caracterului c din sirul s si afiseaza sirul rezultat.",
    input_format: "Pe prima linie sirul s, pe a doua linie caracterul c.",
    output_format: "Sirul s, cu toate aparitiile lui c eliminate.",
    constraints: "0 <= lungime(s) <= 200, c este o litera mica",
    hints: "Daca s este vid, rezultatul e vid. Altfel, daca primul caracter este c, continua fara el; altfel pastreaza-l si continua recursiv cu restul sirului.",
    explanation: "Se parcurge sirul caracter cu caracter, prin recursivitate; caracterele egale cu c nu se adauga la rezultat, celelalte se pastreaza.\n\n**Complexitate:** O(lungime^2)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
string eliminaCaracter(string s, char c) {
    if (s.empty()) return s;
    if (s[0] == c) return eliminaCaracter(s.substr(1), c);
    return s[0] + eliminaCaracter(s.substr(1), c);
}
int main() {
    string s; char c;
    cin >> s >> c;
    cout << eliminaCaracter(s, c) << "\\n";
    return 0;
}
`,
    py: `def eliminaCaracter(s, c):
    if s == "":
        return s
    if s[0] == c:
        return eliminaCaracter(s[1:], c)
    return s[0] + eliminaCaracter(s[1:], c)

s = input().strip()
c = input().strip()
print(eliminaCaracter(s, c))
`,
    tests: ["programare\np", "abcabc\nb", "aaaa\na", "xyz\nq", "a\na", "recursivitate\nr"],
  },
  {
    slug: "recursiv-div-sir-doar-cifre",
    title: "Verificarea daca un sir contine doar cifre",
    difficulty: "easy",
    tags: ["recursivitate", "siruri"],
    statement: "Se citeste un sir de caractere s. Scrieti un program care, folosind un subprogram recursiv, verifica daca sirul contine doar caractere cifra (0-9).",
    input_format: "Un sir de caractere s, fara spatii.",
    output_format: "1 daca s contine doar cifre, 0 in caz contrar.",
    constraints: "1 <= lungime(s) <= 200",
    hints: "Un sir vid este considerat format doar din cifre (caz de baza). Altfel, verifica primul caracter si continua recursiv cu restul.",
    explanation: "Se verifica recursiv, caracter cu caracter, daca fiecare este o cifra; daca un caracter nu e cifra, rezultatul este fals imediat.\n\n**Complexitate:** O(lungime)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
bool doarCifre(string s) {
    if (s.empty()) return true;
    if (!isdigit((unsigned char)s[0])) return false;
    return doarCifre(s.substr(1));
}
int main() {
    string s; cin >> s;
    cout << (doarCifre(s) ? 1 : 0) << "\\n";
    return 0;
}
`,
    py: `def doarCifre(s):
    if s == "":
        return True
    if not s[0].isdigit():
        return False
    return doarCifre(s[1:])

s = input().strip()
print(1 if doarCifre(s) else 0)
`,
    tests: ["12345", "12a45", "007", "0", "999999999999999", "1a2b3c"],
  },
  {
    slug: "recursiv-div-conversie-baza-2",
    title: "Conversia unui numar in baza 2",
    difficulty: "medium",
    tags: ["recursivitate", "baze-numeratie"],
    statement:
      "Se citeste un numar natural n. Scrieti un program care afiseaza, folosind un subprogram recursiv, reprezentarea in baza 2 a lui n (fara zerouri nesemnificative, exceptand cazul n=0, cand se afiseaza 0).",
    input_format: "Un numar natural n.",
    output_format: "Reprezentarea in baza 2 a lui n.",
    constraints: "0 <= n <= 10^9",
    hints: "Afiseaza mai intai reprezentarea lui n/2, apoi ultima cifra binara n%2.",
    explanation: "Se afiseaza recursiv catul impartirii la 2, iar la revenirea din recursivitate se afiseaza restul impartirii (cifra binara curenta), obtinandu-se astfel cifrele in ordinea corecta.\n\n**Complexitate:** O(log n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
void afiseazaBinar(int n) {
    if (n == 0) return;
    afiseazaBinar(n / 2);
    cout << (n % 2);
}
int main() {
    int n; cin >> n;
    if (n == 0) cout << 0;
    else afiseazaBinar(n);
    cout << "\\n";
    return 0;
}
`,
    py: `def afiseazaBinar(n, cifre):
    if n == 0:
        return
    afiseazaBinar(n // 2, cifre)
    cifre.append(str(n % 2))

n = int(input())
if n == 0:
    print(0)
else:
    cifre = []
    afiseazaBinar(n, cifre)
    print("".join(cifre))
`,
    tests: ["0", "1", "2", "10", "255", "1000000000"],
  },
  {
    slug: "recursiv-div-conversie-baza-b",
    title: "Conversia unui numar intr-o baza data",
    difficulty: "medium",
    tags: ["recursivitate", "baze-numeratie"],
    statement:
      "Se citesc doua numere naturale n si b (2 <= b <= 16). Scrieti un program care afiseaza, folosind un subprogram recursiv, reprezentarea lui n in baza b, folosind cifrele 0-9 si literele mari A-F pentru cifrele 10-15.",
    input_format: "Doua numere naturale n si b.",
    output_format: "Reprezentarea lui n in baza b.",
    constraints: "0 <= n <= 10^9, 2 <= b <= 16",
    hints: "Afiseaza mai intai reprezentarea lui n/b, apoi cifra corespunzatoare lui n%b (folosind literele A-F pentru valori peste 9).",
    explanation: "Similar cu conversia in baza 2: se afiseaza recursiv catul impartirii la b, iar la revenire se afiseaza cifra curenta (n%b), transformata in litera daca este mai mare decat 9.\n\n**Complexitate:** O(log_b n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
void afiseazaInBaza(int n, int b) {
    if (n == 0) return;
    afiseazaInBaza(n / b, b);
    int cifra = n % b;
    if (cifra < 10) cout << cifra;
    else cout << (char)('A' + cifra - 10);
}
int main() {
    int n, b; cin >> n >> b;
    if (n == 0) cout << 0;
    else afiseazaInBaza(n, b);
    cout << "\\n";
    return 0;
}
`,
    py: `def afiseazaInBaza(n, b, cifre):
    if n == 0:
        return
    afiseazaInBaza(n // b, b, cifre)
    cifra = n % b
    if cifra < 10:
        cifre.append(str(cifra))
    else:
        cifre.append(chr(ord('A') + cifra - 10))

n, b = map(int, input().split())
if n == 0:
    print(0)
else:
    cifre = []
    afiseazaInBaza(n, b, cifre)
    print("".join(cifre))
`,
    tests: ["0 2", "255 16", "1000000000 16", "10 2", "31 16", "100 8"],
  },
  {
    slug: "recursiv-div-suma-cifre-baza-b",
    title: "Suma cifrelor unui numar scris intr-o baza data",
    difficulty: "medium",
    tags: ["recursivitate", "baze-numeratie"],
    statement:
      "Se citesc doua numere naturale n si b (2 <= b <= 16). Scrieti un program care calculeaza recursiv suma cifrelor reprezentarii lui n in baza b (cifrele fiind considerate ca valori numerice, indiferent de baza).",
    input_format: "Doua numere naturale n si b.",
    output_format: "Suma cifrelor lui n, scris in baza b.",
    constraints: "0 <= n <= 10^9, 2 <= b <= 16",
    hints: "sumaCifreBaza(n, b) = n%b + sumaCifreBaza(n/b, b), cu cazul de baza n=0.",
    explanation: "Se aplica aceeasi idee ca la suma cifrelor in baza 10, folosind impartirea si restul la b in loc de 10.\n\n**Complexitate:** O(log_b n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int sumaCifreBaza(int n, int b) {
    if (n == 0) return 0;
    return n % b + sumaCifreBaza(n / b, b);
}
int main() {
    int n, b; cin >> n >> b;
    cout << sumaCifreBaza(n, b) << "\\n";
    return 0;
}
`,
    py: `def sumaCifreBaza(n, b):
    if n == 0:
        return 0
    return n % b + sumaCifreBaza(n // b, b)

n, b = map(int, input().split())
print(sumaCifreBaza(n, b))
`,
    tests: ["0 2", "255 16", "1000000000 2", "10 2", "31 16", "100 8"],
  },
  {
    slug: "recursiv-div-sir-definit-neconventional",
    title: "Tabel de valori pentru un sir definit recursiv",
    difficulty: "hard",
    tags: ["recursivitate", "siruri-recursive"],
    statement:
      "Se defineste sirul: f(0) = 0, f(1) = 1, iar f(n) = 2*f(n-1) - f(n-2) + 1 pentru n >= 2. Se citeste un numar natural n; scrieti un program care afiseaza, cate o valoare pe linie, termenii f(0), f(1), ..., f(n), fiecare calculat printr-un subprogram recursiv.",
    input_format: "Un numar natural n.",
    output_format: "Valorile f(0), f(1), ..., f(n), cate una pe linie.",
    constraints: "0 <= n <= 18",
    time_limit_ms: 2000,
    hints: "Implementati direct relatia de recurenta data, cu cele doua cazuri de baza f(0) si f(1); apoi apelati subprogramul pentru fiecare valoare de la 0 la n.",
    explanation: "Se aplica direct definitia recursiva pentru fiecare termen cerut. Deoarece nu se foloseste memoizare, numarul de apeluri creste exponential cu n.\n\n**Complexitate:** exponentiala fara memoizare",
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long f(int n) {
    if (n == 0) return 0;
    if (n == 1) return 1;
    return 2 * f(n - 1) - f(n - 2) + 1;
}
int main() {
    int n; cin >> n;
    for (int i = 0; i <= n; i++) cout << f(i) << "\\n";
    return 0;
}
`,
    py: `def f(n):
    if n == 0:
        return 0
    if n == 1:
        return 1
    return 2 * f(n - 1) - f(n - 2) + 1

n = int(input())
for i in range(n + 1):
    print(f(i))
`,
    tests: ["0", "1", "2", "5", "10", "18"],
  },
  {
    slug: "recursiv-div-numar-submultimi",
    title: "Numarul de submultimi ale unei multimi cu n elemente",
    difficulty: "easy",
    tags: ["recursivitate", "combinatorica"],
    statement:
      "Se citeste un numar natural n. Scrieti un program care calculeaza recursiv (fara operatorul de ridicare la putere si fara bucle pentru inmultire repetata), folosind relatia 2^n = 2 * 2^(n-1) cu 2^0 = 1, numarul de submultimi ale unei multimi cu n elemente.",
    input_format: "Un numar natural n.",
    output_format: "Numarul de submultimi ale unei multimi cu n elemente.",
    constraints: "0 <= n <= 40",
    hints: "numarSubmultimi(0) = 1, numarSubmultimi(n) = 2 * numarSubmultimi(n-1).",
    explanation: "Fiecare element nou adaugat multimii dubleaza numarul de submultimi posibile (fiecare submultime existenta se poate extinde cu sau fara noul element), de unde relatia de recurenta.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long numarSubmultimi(int n) {
    if (n == 0) return 1;
    return 2 * numarSubmultimi(n - 1);
}
int main() {
    int n; cin >> n;
    cout << numarSubmultimi(n) << "\\n";
    return 0;
}
`,
    py: `def numarSubmultimi(n):
    if n == 0:
        return 1
    return 2 * numarSubmultimi(n - 1)

n = int(input())
print(numarSubmultimi(n))
`,
    tests: ["0", "1", "5", "20", "32", "40"],
  },
  {
    slug: "recursiv-div-ackermann",
    title: "Functia lui Ackermann (valori mici)",
    difficulty: "hard",
    tags: ["recursivitate", "functii-recursive"],
    statement:
      "Functia lui Ackermann este definita astfel: A(m, 0) = A(m-1, 1) pentru m > 0; A(0, n) = n + 1; A(m, n) = A(m-1, A(m, n-1)) pentru m > 0 si n > 0. Se citesc doua numere naturale m si n; scrieti un program care calculeaza recursiv A(m, n). Functia creste extrem de rapid, deci valorile lui m si n vor fi mici.",
    input_format: "Doua numere naturale m si n.",
    output_format: "Valoarea A(m, n).",
    constraints: "0 <= m <= 3, 0 <= n <= 6",
    time_limit_ms: 2000,
    hints: "Tratati separat cele trei cazuri din definitie, in ordine: m=0, apoi n=0, apoi cazul general.",
    explanation: "Se implementeaza direct definitia matematica a functiei, cu cele trei ramuri de recursivitate. Pentru valori mici ale lui m si n, numarul de apeluri ramane gestionabil, dar creste foarte rapid pentru valori putin mai mari.\n\n**Complexitate:** neelementara, creste extrem de rapid cu m si n",
    cpp: `#include <bits/stdc++.h>
using namespace std;
long long ackermann(int m, int n) {
    if (m == 0) return n + 1;
    if (n == 0) return ackermann(m - 1, 1);
    return ackermann(m - 1, ackermann(m, n - 1));
}
int main() {
    int m, n; cin >> m >> n;
    cout << ackermann(m, n) << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(10000)

def ackermann(m, n):
    if m == 0:
        return n + 1
    if n == 0:
        return ackermann(m - 1, 1)
    return ackermann(m - 1, ackermann(m, n - 1))

m, n = map(int, input().split())
print(ackermann(m, n))
`,
    tests: ["0 0", "1 2", "2 3", "3 3", "3 4", "3 6"],
  },
  {
    slug: "recursiv-div-numara-prime-interval",
    title: "Numararea numerelor prime dintr-un interval",
    difficulty: "medium",
    tags: ["recursivitate", "numere-prime"],
    statement:
      "Se citesc doua numere naturale a si b (a <= b). Scrieti un program care, folosind doi subprogrami recursivi (unul care verifica daca un numar este prim, celalalt care parcurge recursiv intervalul [a, b]), numara cate numere prime se afla in intervalul [a, b].",
    input_format: "Doua numere naturale a si b.",
    output_format: "Numarul de numere prime din intervalul [a, b].",
    constraints: "0 <= a <= b <= 100000, b - a <= 2000",
    hints: "Subprogramul de parcurgere apeleaza subprogramul de testare a primalitatii pentru numarul curent, apoi se apeleaza recursiv pentru numarul urmator.",
    explanation: "Se combina doi subprogrami recursivi: unul testeaza daca un numar este prim (verificand divizorii pana la radical din numar), celalalt parcurge recursiv intervalul, insumand rezultatele testului de primalitate.\n\n**Complexitate:** O((b-a) * sqrt(b))",
    cpp: `#include <bits/stdc++.h>
using namespace std;
bool estePrimAux(int n, int d) {
    if ((long long)d * d > n) return true;
    if (n % d == 0) return false;
    return estePrimAux(n, d + 1);
}
bool estePrim(int n) {
    if (n < 2) return false;
    return estePrimAux(n, 2);
}
int numaraPrimeInterval(int curent, int b) {
    if (curent > b) return 0;
    return (estePrim(curent) ? 1 : 0) + numaraPrimeInterval(curent + 1, b);
}
int main() {
    int a, b; cin >> a >> b;
    cout << numaraPrimeInterval(a, b) << "\\n";
    return 0;
}
`,
    py: `import sys
sys.setrecursionlimit(3000)

def estePrimAux(n, d):
    if d * d > n:
        return True
    if n % d == 0:
        return False
    return estePrimAux(n, d + 1)

def estePrim(n):
    if n < 2:
        return False
    return estePrimAux(n, 2)

def numaraPrimeInterval(curent, b):
    if curent > b:
        return 0
    return (1 if estePrim(curent) else 0) + numaraPrimeInterval(curent + 1, b)

a, b = map(int, input().split())
print(numaraPrimeInterval(a, b))
`,
    tests: ["2 20", "1 1", "10 10", "100 200", "1 100", "98000 98500"],
  },
  {
    slug: "recursiv-div-cel-mai-lung-prefix-comun",
    title: "Cel mai lung prefix comun a doua siruri",
    difficulty: "easy",
    tags: ["recursivitate", "siruri"],
    statement: "Se citesc doua siruri de caractere s1 si s2. Scrieti un program care determina recursiv lungimea celui mai lung prefix comun al celor doua siruri (cel mai lung inceput identic).",
    input_format: "Pe prima linie sirul s1, pe a doua linie sirul s2.",
    output_format: "Lungimea celui mai lung prefix comun al celor doua siruri.",
    constraints: "0 <= lungime(s1), lungime(s2) <= 200",
    hints: "Daca unul dintre siruri e vid sau primele caractere difera, prefixul comun se opreste aici; altfel, continua recursiv cu restul sirurilor.",
    explanation: "Se compara recursiv primele caractere ale celor doua siruri; cat timp sunt egale, se continua cu restul sirurilor, incrementand lungimea prefixului comun.\n\n**Complexitate:** O(min(lungime(s1), lungime(s2)))",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int celMaiLungPrefixComun(string s1, string s2) {
    if (s1.empty() || s2.empty()) return 0;
    if (s1[0] != s2[0]) return 0;
    return 1 + celMaiLungPrefixComun(s1.substr(1), s2.substr(1));
}
int main() {
    string s1, s2; cin >> s1 >> s2;
    cout << celMaiLungPrefixComun(s1, s2) << "\\n";
    return 0;
}
`,
    py: `def celMaiLungPrefixComun(s1, s2):
    if s1 == "" or s2 == "":
        return 0
    if s1[0] != s2[0]:
        return 0
    return 1 + celMaiLungPrefixComun(s1[1:], s2[1:])

s1 = input().strip()
s2 = input().strip()
print(celMaiLungPrefixComun(s1, s2))
`,
    tests: ["abcdef\nabcxyz", "abc\nxyz", "aaaa\naaab", "hello\nhello", "a\nb", "informatica\ninformatie"],
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
