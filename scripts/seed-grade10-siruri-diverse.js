const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "grade10", chapter: "siruri-caractere", sub: "siruri-diverse" };

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

const IN_FMT_PROPOZITIE = "Se citeste o propozitie, pe o singura linie, in care cuvintele sunt separate printr-un singur spatiu (fara spatii la inceput sau la sfarsit).";
const IN_FMT_2S = "Pe prima linie se citeste sirul s1. Pe a doua linie se citeste sirul s2.";
const OUT_FMT_DA_NU = "Se afiseaza DA daca proprietatea este adevarata, respectiv NU in caz contrar.";

const problems = [
  {
    slug: "div-title-case",
    title: "Transformarea unei propozitii in Title Case",
    difficulty: "medium",
    tags: ["siruri", "siruri-diverse", "cuvinte", "case"],
    statement: "Se citeste o propozitie formata doar din litere si spatii. Afisati propozitia in care fiecare cuvant incepe cu litera mare, iar toate celelalte litere ale cuvantului sunt litere mici (Title Case).",
    input_format: IN_FMT_PROPOZITIE,
    output_format: "Se afiseaza propozitia transformata, pe o singura linie.",
    constraints: "1 <= lungimea propozitiei <= 200, propozitia contine doar litere si spatii",
    hints: "Un caracter trebuie scris cu litera mare daca este primul caracter al sirului sau este precedat de un spatiu; in caz contrar trebuie scris cu litera mica.",
    explanation: "Se parcurge sirul caracter cu caracter. Daca pozitia curenta este inceputul unui cuvant (primul caracter din sir, sau caracterul anterior este spatiu), litera este adusa la forma mare; altfel, este adusa la forma mica.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    for (int i = 0; i < (int)s.size(); i++) {
        bool inceputCuvant = (i == 0 || s[i - 1] == ' ');
        if (s[i] >= 'a' && s[i] <= 'z' && inceputCuvant) s[i] = s[i] - 'a' + 'A';
        else if (s[i] >= 'A' && s[i] <= 'Z' && !inceputCuvant) s[i] = s[i] - 'A' + 'a';
    }
    cout << s << "\\n";
    return 0;
}
`,
    py: `s = list(input())
for i in range(len(s)):
    inceput_cuvant = (i == 0 or s[i - 1] == " ")
    if "a" <= s[i] <= "z" and inceput_cuvant:
        s[i] = chr(ord(s[i]) - ord("a") + ord("A"))
    elif "A" <= s[i] <= "Z" and not inceput_cuvant:
        s[i] = chr(ord(s[i]) - ord("A") + ord("a"))
print("".join(s))
`,
    tests: ["ana are mere", "PROGRAMARE IN INFORMATICA", "azi E o Zi Buna", "cuvant", "o singura litera A"],
  },
  {
    slug: "div-numar-propozitii",
    title: "Numararea propozitiilor dintr-un text",
    difficulty: "easy",
    tags: ["siruri", "siruri-diverse", "punctuatie"],
    statement: "Se citeste un text. Determinati numarul de propozitii pe care le contine, stiind ca o propozitie se incheie cu unul dintre caracterele '.', '!' sau '?'.",
    input_format: "Se citeste un text, pe o singura linie.",
    output_format: "Se afiseaza numarul de propozitii.",
    constraints: "1 <= lungimea textului <= 200",
    hints: "Numarati cate caractere din text sunt '.', '!' sau '?'.",
    explanation: "Se parcurge textul si se incrementeaza un contor de fiecare data cand caracterul curent este unul dintre semnele terminale de propozitie: '.', '!' sau '?'.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int cnt = 0;
    for (char c : s) if (c == '.' || c == '!' || c == '?') cnt++;
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `s = input()
cnt = 0
for c in s:
    if c == "." or c == "!" or c == "?":
        cnt += 1
print(cnt)
`,
    tests: ["Astazi e o zi buna. Mergem la scoala!", "Ce mai faci? Bine, multumesc.", "Fara semne de punctuatie", "Uau! Chiar asa? Da. Sigur.", "Un singur semn."],
  },
  {
    slug: "div-elimina-punctuatie",
    title: "Eliminarea semnelor de punctuatie dintr-un text",
    difficulty: "easy",
    tags: ["siruri", "siruri-diverse", "punctuatie"],
    statement: "Se citeste un text. Afisati textul obtinut prin eliminarea semnelor de punctuatie ('.', ',', '!', '?', ';', ':', '-', '(' si ')'); celelalte caractere raman neschimbate.",
    input_format: "Se citeste un text, pe o singura linie.",
    output_format: "Se afiseaza textul rezultat, pe o singura linie.",
    constraints: "1 <= lungimea textului <= 200",
    hints: "Construiti rezultatul adaugand doar caracterele care nu se afla in multimea semnelor de punctuatie.",
    explanation: "Se construieste sirul rezultat parcurgand textul si pastrand doar caracterele care nu apartin multimii de semne de punctuatie considerate.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    string punct = ".,!?;:-()";
    string rez = "";
    for (char c : s) if (punct.find(c) == string::npos) rez += c;
    cout << rez << "\\n";
    return 0;
}
`,
    py: `s = input()
punct = ".,!?;:-()"
rez = ""
for c in s:
    if c not in punct:
        rez += c
print(rez)
`,
    tests: ["Buna, ce mai faci?", "Astazi (e o zi) buna!", "Fara-semne: de; punctuatie.", "text simplu", "!!! ??? ..."],
  },
  {
    slug: "div-rle-codificare",
    title: "Codificare Run-Length Encoding (RLE)",
    difficulty: "medium",
    tags: ["siruri", "siruri-diverse", "codificare"],
    statement: "Se citeste un sir de caractere s, format doar din litere mici. Codificati sirul prin metoda Run-Length Encoding: fiecare grup maximal de caractere identice consecutive este inlocuit cu caracterul respectiv urmat de numarul sau de aparitii (de exemplu, 'aaabbc' devine 'a3b2c1').",
    input_format: "Se citeste un sir de caractere s, pe o singura linie.",
    output_format: "Se afiseaza sirul codificat, pe o singura linie.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Parcurgeti sirul identificand grupurile de caractere consecutive identice si afisati, pentru fiecare grup, caracterul urmat de lungimea grupului.",
    explanation: "Se parcurge sirul cu un indice i; pentru fiecare grup maximal de caractere identice consecutive incepand la pozitia i, se determina lungimea grupului (avansand un al doilea indice j cat timp caracterele coincid), apoi se adauga in rezultat caracterul urmat de numarul j-i, iar i devine j.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    string rez = "";
    int i = 0, n = s.size();
    while (i < n) {
        int j = i;
        while (j < n && s[j] == s[i]) j++;
        rez += s[i];
        rez += to_string(j - i);
        i = j;
    }
    cout << rez << "\\n";
    return 0;
}
`,
    py: `s = input()
rez = ""
i, n = 0, len(s)
while i < n:
    j = i
    while j < n and s[j] == s[i]:
        j += 1
    rez += s[i] + str(j - i)
    i = j
print(rez)
`,
    tests: ["aaabbbcc", "aabbccddeeff", "abcdef", "aaaaaaaaaaaa", "aabbaabb"],
  },
  {
    slug: "div-rle-decodificare",
    title: "Decodificare Run-Length Encoding (RLE)",
    difficulty: "medium",
    tags: ["siruri", "siruri-diverse", "codificare"],
    statement: "Se citeste un sir de caractere s, obtinut prin codificare Run-Length Encoding: o succesiune de perechi formate dintr-o litera mica urmata de numarul ei de aparitii (de exemplu, 'a3b2c1'). Decodificati sirul, obtinand sirul original (in exemplul dat, 'aaabbc').",
    input_format: "Se citeste un sir de caractere s, pe o singura linie.",
    output_format: "Se afiseaza sirul decodificat, pe o singura linie.",
    constraints: "1 <= lungimea sirului s <= 200, numerele de aparitii sunt numere naturale nenule",
    hints: "Parcurgeti sirul: cand intalniti o litera, retineti-o, apoi cititi toate cifrele care urmeaza pentru a forma numarul de aparitii, si adaugati litera de atatea ori in rezultat.",
    explanation: "Se parcurge sirul cu un indice i. La fiecare pas, caracterul de la pozitia i este o litera, care se retine; apoi se citesc toate cifrele consecutive care urmeaza (posibil mai multe, pentru numere cu mai multe cifre), formand numarul de aparitii; litera este adaugata in rezultat de atatea ori.\n\n**Complexitate:** O(lungimea rezultatului)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    string rez = "";
    int i = 0, n = s.size();
    while (i < n) {
        char c = s[i]; i++;
        string numar = "";
        while (i < n && s[i] >= '0' && s[i] <= '9') { numar += s[i]; i++; }
        int cnt = stoi(numar);
        for (int k = 0; k < cnt; k++) rez += c;
    }
    cout << rez << "\\n";
    return 0;
}
`,
    py: `s = input()
rez = ""
i, n = 0, len(s)
while i < n:
    c = s[i]
    i += 1
    numar = ""
    while i < n and "0" <= s[i] <= "9":
        numar += s[i]
        i += 1
    cnt = int(numar)
    rez += c * cnt
print(rez)
`,
    tests: ["a3b2c1", "a12", "a1b1c1d1", "x5y5", "m2i4s4p4"],
  },
  {
    slug: "div-paranteze-corecte",
    title: "Verificarea corectitudinii parantezelor rotunde",
    difficulty: "medium",
    tags: ["siruri", "siruri-diverse", "paranteze"],
    statement: "Se citeste un sir de caractere s, format doar din parantezele '(' si ')'. Verificati daca parantezele sunt corect inchise, adica fiecare paranteza deschisa are o paranteza inchisa corespunzatoare, iar la niciun moment numarul de paranteze inchise pana atunci nu depaseste numarul de paranteze deschise.",
    input_format: "Se citeste un sir de caractere s, format doar din caracterele '(' si ')'.",
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Folositi un numarator: incrementati-l la '(' si decrementati-l la ')'; daca la orice moment devine negativ, parantezele nu sunt corecte. La final, numaratorul trebuie sa fie exact 0.",
    explanation: "Se parcurge sirul mentinand un numarator al parantezelor deschise si neinchise inca. La '(' numaratorul creste, la ')' scade; daca numaratorul devine negativ inseamna ca o paranteza a fost inchisa fara sa fi fost deschisa, deci sirul este incorect. La final, sirul este corect doar daca numaratorul a ajuns exact la 0.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int cnt = 0;
    bool ok = true;
    for (char c : s) {
        if (c == '(') cnt++;
        else cnt--;
        if (cnt < 0) ok = false;
    }
    if (cnt != 0) ok = false;
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s = input()
cnt = 0
ok = True
for c in s:
    if c == "(":
        cnt += 1
    else:
        cnt -= 1
    if cnt < 0:
        ok = False
if cnt != 0:
    ok = False
print("DA" if ok else "NU")
`,
    tests: ["(())", "(()", "())(", "()()()", "((()))"],
  },
  {
    slug: "div-pangram",
    title: "Verificare daca un text este pangram",
    difficulty: "easy",
    tags: ["siruri", "siruri-diverse", "alfabet"],
    statement: "Se citeste un text. Verificati daca este pangram, adica daca acesta contine cel putin o data fiecare dintre cele 26 de litere ale alfabetului englez (indiferent de caz).",
    input_format: "Se citeste un text, pe o singura linie.",
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= lungimea textului <= 200",
    hints: "Marcati fiecare litera intalnita (adusa la forma mica) intr-un vector de 26 de elemente, apoi verificati daca toate au fost marcate.",
    explanation: "Se parcurge textul si se marcheaza, intr-un vector de 26 de elemente, fiecare litera intalnita (adusa in prealabil la forma mica). Textul este pangram daca, la final, toate cele 26 de pozitii au fost marcate.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    bool vazut[26] = {false};
    for (char c : s) {
        if (c >= 'a' && c <= 'z') vazut[c - 'a'] = true;
        else if (c >= 'A' && c <= 'Z') vazut[c - 'A'] = true;
    }
    bool ok = true;
    for (int i = 0; i < 26; i++) if (!vazut[i]) ok = false;
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s = input()
vazut = [False] * 26
for c in s:
    if "a" <= c <= "z":
        vazut[ord(c) - ord("a")] = True
    elif "A" <= c <= "Z":
        vazut[ord(c) - ord("A")] = True
print("DA" if all(vazut) else "NU")
`,
    tests: ["The quick brown fox jumps over the lazy dog", "Ana are mere", "Pack my box with five dozen liquor jugs", "abcdefghijklmnopqrstuvwxy", "abcdefghijklmnopqrstuvwxyz"],
  },
  {
    slug: "div-rot13",
    title: "Codificarea ROT13",
    difficulty: "medium",
    tags: ["siruri", "siruri-diverse", "codificare"],
    statement: "Se citeste un sir de caractere s, format doar din litere ale alfabetului englez. Aplicati codificarea ROT13, care deplaseaza circular fiecare litera cu exact 13 pozitii in alfabet, pastrandu-i tipul (mica ramane mica, mare ramane mare). Observatie: aplicarea ROT13 de doua ori consecutiv reface textul original.",
    input_format: "Se citeste un sir de caractere s, pe o singura linie.",
    output_format: "Se afiseaza sirul codificat, pe o singura linie.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Pentru o litera mica c, litera codificata este 'a' + (c - 'a' + 13) % 26; analog pentru litere mari.",
    explanation: "Fiecare litera este deplasata circular cu 13 pozitii in alfabet, folosind aritmetica modulo 26 aplicata pe pozitia relativa a literei fata de inceputul alfabetului sau (mic sau mare).\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    for (char &c : s) {
        if (c >= 'a' && c <= 'z') c = 'a' + (c - 'a' + 13) % 26;
        else if (c >= 'A' && c <= 'Z') c = 'A' + (c - 'A' + 13) % 26;
    }
    cout << s << "\\n";
    return 0;
}
`,
    py: `s = input()
rez = []
for c in s:
    if "a" <= c <= "z":
        c = chr(ord("a") + (ord(c) - ord("a") + 13) % 26)
    elif "A" <= c <= "Z":
        c = chr(ord("A") + (ord(c) - ord("A") + 13) % 26)
    rez.append(c)
print("".join(rez))
`,
    tests: ["Hello", "abcXYZ", "Uryyb", "Programare", "NoBaTa"],
  },
  {
    slug: "div-grupare-anagrame",
    title: "Gruparea cuvintelor anagrame dintr-o lista",
    difficulty: "hard",
    tags: ["siruri", "siruri-diverse", "anagrame", "cuvinte"],
    statement: "Se citesc un numar natural n si n cuvinte, formate doar din litere mici. Grupati cuvintele care sunt anagrame unele altora (contin exact aceleasi litere, in numar egal). Afisati grupurile, cate unul pe linie, in ordinea in care a aparut primul cuvant din fiecare grup; in interiorul unui grup, cuvintele se afiseaza in ordinea in care au aparut, separate prin spatiu.",
    input_format: "Pe prima linie se citeste n. Urmeaza n linii, fiecare continand un cuvant.",
    output_format: "Se afiseaza grupurile de anagrame, cate unul pe linie.",
    constraints: "1 <= n <= 50, 1 <= lungimea fiecarui cuvant <= 20",
    hints: "Asociati fiecarui cuvant o 'cheie' formata din literele sale sortate; cuvintele cu aceeasi cheie sunt anagrame.",
    explanation: "Pentru fiecare cuvant se calculeaza o cheie formata din literele sale sortate crescator; doua cuvinte sunt anagrame daca si numai daca au aceeasi cheie. Se retine, pentru fiecare cheie noua intalnita, ordinea aparitiei, iar cuvintele sunt adaugate in grupul corespunzator cheii lor, in ordinea din text. La final se afiseaza grupurile in ordinea aparitiei primei chei.\n\n**Complexitate:** O(n * l log l), unde l este lungimea maxima a unui cuvant",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n; cin.ignore();
    vector<string> cuvinte(n);
    for (int i = 0; i < n; i++) getline(cin, cuvinte[i]);
    vector<string> ordineChei;
    map<string, vector<string>> grupuri;
    for (auto &w : cuvinte) {
        string cheie = w;
        sort(cheie.begin(), cheie.end());
        if (grupuri.find(cheie) == grupuri.end()) ordineChei.push_back(cheie);
        grupuri[cheie].push_back(w);
    }
    for (auto &cheie : ordineChei) {
        auto &grup = grupuri[cheie];
        for (int i = 0; i < (int)grup.size(); i++) {
            cout << grup[i];
            if (i + 1 < (int)grup.size()) cout << ' ';
        }
        cout << "\\n";
    }
    return 0;
}
`,
    py: `n = int(input())
cuvinte = [input() for _ in range(n)]
grupuri = {}
for w in cuvinte:
    cheie = "".join(sorted(w))
    if cheie not in grupuri:
        grupuri[cheie] = []
    grupuri[cheie].append(w)
for cheie in grupuri:
    print(" ".join(grupuri[cheie]))
`,
    tests: ["6\nceai\naice\nstop\ntops\nopts\nabc", "3\nabc\nbca\ncab", "4\nunu\ndoi\ntrei\npatru", "5\nona\nnoa\naon\nban\nnab", "1\nsolo"],
  },
  {
    slug: "div-cel-mai-frecvent-cuvant",
    title: "Cel mai frecvent cuvant dintr-un text",
    difficulty: "medium",
    tags: ["siruri", "siruri-diverse", "cuvinte", "frecventa"],
    statement: "Se citeste un text. Determinati cuvantul care apare de cele mai multe ori. Daca exista mai multe cuvinte cu frecventa maxima, afisati primul dintre ele, in ordinea aparitiei in text.",
    input_format: IN_FMT_PROPOZITIE,
    output_format: "Se afiseaza cuvantul cu frecventa maxima.",
    constraints: "1 <= lungimea textului <= 200",
    hints: "Calculati frecventa fiecarui cuvant, determinati maximul, apoi gasiti primul cuvant din text care atinge acest maxim.",
    explanation: "Se extrag cuvintele textului si se calculeaza frecventa fiecaruia. Se determina frecventa maxima, apoi se parcurg cuvintele in ordinea din text si se raspunde cu primul cuvant a carui frecventa este egala cu maximul.\n\n**Complexitate:** O(n)",
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
    map<string, int> freq;
    for (auto &w : cuvinte) freq[w]++;
    int mx = 0;
    for (auto &w : cuvinte) mx = max(mx, freq[w]);
    for (auto &w : cuvinte) {
        if (freq[w] == mx) { cout << w << "\\n"; return 0; }
    }
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
freq = {}
for w in cuvinte:
    freq[w] = freq.get(w, 0) + 1
mx = max(freq.values())
for w in cuvinte:
    if freq[w] == mx:
        print(w)
        break
`,
    tests: ["azi e o zi buna azi e frumos", "ana are mere ana are pere ana", "un cuvant unic aici", "da nu da nu da", "programare in c++ este utila programare"],
  },
  {
    slug: "div-al-doilea-cel-mai-frecvent-cuvant",
    title: "Al doilea cel mai frecvent cuvant dintr-un text",
    difficulty: "hard",
    tags: ["siruri", "siruri-diverse", "cuvinte", "frecventa"],
    statement: "Se citeste un text care contine cel putin doua cuvinte distincte. Ordonati cuvintele distincte din text descrescator dupa frecventa lor de aparitie (iar la frecvente egale, in ordinea primei aparitii in text) si afisati al doilea cuvant din aceasta ordine.",
    input_format: IN_FMT_PROPOZITIE,
    output_format: "Se afiseaza al doilea cuvant din ordinea descrisa.",
    constraints: "1 <= lungimea textului <= 200, textul contine cel putin doua cuvinte distincte",
    hints: "Retineti pentru fiecare cuvant distinct frecventa si pozitia primei aparitii, apoi sortati cuvintele distincte descrescator dupa frecventa si crescator dupa pozitia primei aparitii.",
    explanation: "Se calculeaza, pentru fiecare cuvant distinct, frecventa de aparitie si indicele primei aparitii in text. Cuvintele distincte se sorteaza descrescator dupa frecventa, iar la egalitate crescator dupa indicele primei aparitii; se afiseaza cel de-al doilea cuvant din aceasta ordine.\n\n**Complexitate:** O(n log n)",
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
    map<string, int> freq;
    map<string, int> primaPozitie;
    for (int i = 0; i < (int)cuvinte.size(); i++) {
        auto &w = cuvinte[i];
        if (freq.find(w) == freq.end()) primaPozitie[w] = i;
        freq[w]++;
    }
    vector<string> distincte;
    for (auto &p : freq) distincte.push_back(p.first);
    sort(distincte.begin(), distincte.end(), [&](const string &a, const string &b) {
        if (freq[a] != freq[b]) return freq[a] > freq[b];
        return primaPozitie[a] < primaPozitie[b];
    });
    cout << distincte[1] << "\\n";
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
freq = {}
prima_pozitie = {}
for i, w in enumerate(cuvinte):
    if w not in freq:
        prima_pozitie[w] = i
    freq[w] = freq.get(w, 0) + 1
distincte = list(freq.keys())
distincte.sort(key=lambda w: (-freq[w], prima_pozitie[w]))
print(distincte[1])
`,
    tests: ["azi e o zi buna azi e frumos", "ana are mere ana are pere ana", "a b a c a b", "da nu da nu da nu poate", "unu doi doi trei trei trei patru patru"],
  },
  {
    slug: "div-elimina-cuvinte-duplicate",
    title: "Eliminarea cuvintelor duplicate dintr-un text",
    difficulty: "medium",
    tags: ["siruri", "siruri-diverse", "cuvinte", "duplicate"],
    statement: "Se citeste un text. Afisati textul obtinut prin eliminarea cuvintelor duplicate, pastrand doar prima aparitie a fiecarui cuvant distinct, in ordinea originala.",
    input_format: IN_FMT_PROPOZITIE,
    output_format: "Se afiseaza textul rezultat, pe o singura linie.",
    constraints: "1 <= lungimea textului <= 200",
    hints: "Parcurgeti cuvintele in ordine si adaugati in rezultat doar cuvintele care nu au mai fost intalnite anterior.",
    explanation: "Se extrag cuvintele textului in ordine si se marcheaza fiecare cuvant distinct intalnit (de exemplu intr-o multime); un cuvant este adaugat in rezultat doar la prima sa aparitie.\n\n**Complexitate:** O(n)",
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
    set<string> vazute;
    vector<string> rez;
    for (auto &w : cuvinte) {
        if (vazute.find(w) == vazute.end()) {
            vazute.insert(w);
            rez.push_back(w);
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
vazute = set()
rez = []
for w in cuvinte:
    if w not in vazute:
        vazute.add(w)
        rez.append(w)
print(" ".join(rez))
`,
    tests: ["ana are ana are mere mere", "un cuvant unic aici", "da nu da nu da poate", "azi azi azi e o zi buna", "a b c a b c d"],
  },
  {
    slug: "div-inverseaza-fiecare-cuvant",
    title: "Inversarea fiecarui cuvant dintr-o propozitie",
    difficulty: "easy",
    tags: ["siruri", "siruri-diverse", "cuvinte", "inversare"],
    statement: "Se citeste o propozitie. Afisati propozitia in care fiecare cuvant este inversat (literele lui sunt scrise in ordine inversa), dar ordinea cuvintelor in propozitie ramane neschimbata.",
    input_format: IN_FMT_PROPOZITIE,
    output_format: "Se afiseaza propozitia rezultata, pe o singura linie.",
    constraints: "1 <= lungimea propozitiei <= 200",
    hints: "Extrageti cuvintele, inversati fiecare cuvant in parte, apoi afisati-le in aceeasi ordine, separate prin spatiu.",
    explanation: "Se extrag cuvintele propozitiei, pastrand ordinea lor. Fiecare cuvant este inversat individual (caracterele sale sunt parcurse de la ultimul catre primul), iar rezultatul este afisat cu cuvintele inversate, separate printr-un singur spatiu, in ordinea originala a cuvintelor.\n\n**Complexitate:** O(n)",
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
    for (int i = 0; i < (int)cuvinte.size(); i++) {
        string inv = "";
        for (int j = (int)cuvinte[i].size() - 1; j >= 0; j--) inv += cuvinte[i][j];
        cout << inv;
        if (i + 1 < (int)cuvinte.size()) cout << ' ';
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
rez = [w[::-1] for w in cuvinte]
print(" ".join(rez))
`,
    tests: ["ana are mere", "un singur cuvant", "azi e o zi buna", "programare in c plus plus", "a b c d"],
  },
  {
    slug: "div-interclasare-caractere",
    title: "Interclasarea a doua siruri, caracter cu caracter",
    difficulty: "medium",
    tags: ["siruri", "siruri-diverse", "interclasare"],
    statement: "Se citesc doua siruri de caractere s1 si s2. Construiti si afisati sirul obtinut prin alternarea caracterelor celor doua siruri (primul caracter din s1, primul din s2, al doilea din s1, al doilea din s2 s.a.m.d.); daca unul dintre siruri se termina mai devreme, restul caracterelor din celalalt sir se adauga la sfarsit, in ordinea lor.",
    input_format: IN_FMT_2S,
    output_format: "Se afiseaza sirul rezultat, pe o singura linie.",
    constraints: "1 <= lungimea sirurilor <= 200",
    hints: "Folositi doi indici, unul pentru fiecare sir, si adaugati alternativ cate un caracter din fiecare, atat timp cat mai exista caractere in acel sir.",
    explanation: "Se folosesc doi indici i si j, initial 0, si se alterneaza adaugarea unui caracter din s1 (daca mai exista, la pozitia i, apoi i++) cu adaugarea unui caracter din s2 (daca mai exista, la pozitia j, apoi j++), pana cand ambii indici ajung la finalul sirurilor respective.\n\n**Complexitate:** O(n + m)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s1; getline(cin, s1);
    string s2; getline(cin, s2);
    string rez = "";
    int i = 0, j = 0;
    int n = s1.size(), m = s2.size();
    while (i < n || j < m) {
        if (i < n) { rez += s1[i]; i++; }
        if (j < m) { rez += s2[j]; j++; }
    }
    cout << rez << "\\n";
    return 0;
}
`,
    py: `s1 = input()
s2 = input()
rez = ""
i, j = 0, 0
n, m = len(s1), len(s2)
while i < n or j < m:
    if i < n:
        rez += s1[i]
        i += 1
    if j < m:
        rez += s2[j]
        j += 1
print(rez)
`,
    tests: ["abc\nxyz", "ab\nxyzw", "abcde\nx", "a\nb", "programare\ninfo"],
  },
  {
    slug: "div-stergere-un-caracter",
    title: "Verificare daca un sir se obtine prin stergerea unui singur caracter",
    difficulty: "hard",
    tags: ["siruri", "siruri-diverse", "stergere"],
    statement: "Se citesc doua siruri de caractere a si b. Verificati daca b se poate obtine din a prin stergerea exact a unui singur caracter (pastrand ordinea celorlalte caractere).",
    input_format: IN_FMT_2S,
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= lungimea sirurilor <= 200",
    hints: "Daca lungimea lui a nu este exact cu 1 mai mare decat lungimea lui b, raspunsul este NU. Altfel, comparati sirurile cu doi indici, permitand exact o singura 'sarire' peste un caracter din a atunci cand apare o diferenta.",
    explanation: "Daca lungimea lui a nu este exact cu 1 mai mare decat cea a lui b, raspunsul este direct NU. Altfel, se parcurg simultan a si b cu indicii i si j; cand caracterele coincid, ambii indici avanseaza; cand difera, se permite o singura 'sarire' (i avanseaza fara ca j sa avanseze), contorizata separat. Daca se ajunge la o a doua diferenta, sau daca la final nu s-a parcurs tot b, raspunsul este NU.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string a; getline(cin, a);
    string b; getline(cin, b);
    if (a.size() != b.size() + 1) { cout << "NU\\n"; return 0; }
    int i = 0, j = 0, sarituri = 0;
    while (i < (int)a.size() && j < (int)b.size()) {
        if (a[i] == b[j]) { i++; j++; }
        else {
            sarituri++;
            i++;
            if (sarituri > 1) break;
        }
    }
    bool ok = (sarituri <= 1) && (j == (int)b.size());
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `a = input()
b = input()
if len(a) != len(b) + 1:
    print("NU")
else:
    i, j, sarituri = 0, 0, 0
    while i < len(a) and j < len(b):
        if a[i] == b[j]:
            i += 1
            j += 1
        else:
            sarituri += 1
            i += 1
            if sarituri > 1:
                break
    ok = (sarituri <= 1) and (j == len(b))
    print("DA" if ok else "NU")
`,
    tests: ["abcde\nabde", "abcde\nabcd", "abc\nabc", "abc\nxyz", "programare\nprogamare"],
  },
  {
    slug: "div-cel-mai-lung-palindrom",
    title: "Cel mai lung subsir palindromic contiguu dintr-un sir",
    difficulty: "hard",
    tags: ["siruri", "siruri-diverse", "palindrom"],
    statement: "Se citeste un sir de caractere s. Determinati cel mai lung subsir contiguu al lui s care este palindrom. Daca exista mai multe subsiruri de lungime maxima, afisati cel care incepe cel mai devreme in s.",
    input_format: "Se citeste un sir de caractere s, pe o singura linie.",
    output_format: "Se afiseaza cel mai lung subsir palindromic contiguu.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Pentru fiecare pozitie, incercati sa 'extindeti' un palindrom in jurul ei (centrul poate fi un singur caracter, pentru palindroame de lungime impara, sau intre doua caractere, pentru palindroame de lungime para).",
    explanation: "Se foloseste tehnica 'extinderii din centru': pentru fiecare pozitie i din sir se incearca extinderea unui palindrom centrat pe caracterul i (lungime impara) si a unui palindrom centrat intre pozitiile i si i+1 (lungime para), extinzand simetric spre stanga si dreapta atat timp cat caracterele coincid. Se retine cel mai lung palindrom gasit; la lungimi egale se pastreaza primul gasit, deoarece actualizarea se face doar la o lungime strict mai mare.\n\n**Complexitate:** O(n^2)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int n = s.size();
    int bestSt = 0, bestLen = 1;
    for (int i = 0; i < n; i++) {
        int l = i, r = i;
        while (l >= 0 && r < n && s[l] == s[r]) { l--; r++; }
        if (r - l - 1 > bestLen) { bestLen = r - l - 1; bestSt = l + 1; }
        l = i; r = i + 1;
        while (l >= 0 && r < n && s[l] == s[r]) { l--; r++; }
        if (r - l - 1 > bestLen) { bestLen = r - l - 1; bestSt = l + 1; }
    }
    cout << s.substr(bestSt, bestLen) << "\\n";
    return 0;
}
`,
    py: `s = input()
n = len(s)
best_st, best_len = 0, 1
for i in range(n):
    l, r = i, i
    while l >= 0 and r < n and s[l] == s[r]:
        l -= 1
        r += 1
    if r - l - 1 > best_len:
        best_len = r - l - 1
        best_st = l + 1
    l, r = i, i + 1
    while l >= 0 and r < n and s[l] == s[r]:
        l -= 1
        r += 1
    if r - l - 1 > best_len:
        best_len = r - l - 1
        best_st = l + 1
print(s[best_st:best_st + best_len])
`,
    tests: ["babad", "cbbd", "programare", "a", "forgeeksskeegfor"],
  },
  {
    slug: "div-numar-subsiruri-palindrom",
    title: "Numarul de subsiruri palindromice contigue dintr-un sir",
    difficulty: "hard",
    tags: ["siruri", "siruri-diverse", "palindrom"],
    statement: "Se citeste un sir de caractere s. Determinati numarul de subsiruri contigue ale lui s care sunt palindrom (fiecare caracter individual se considera un subsir palindrom de lungime 1).",
    input_format: "Se citeste un sir de caractere s, pe o singura linie.",
    output_format: "Se afiseaza numarul de subsiruri contigue palindromice.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Ca la determinarea celui mai lung palindrom, extindeti din fiecare centru posibil si numarati de fiecare data cand extinderea reuseste.",
    explanation: "Se foloseste aceeasi tehnica de 'extindere din centru' ca la aflarea celui mai lung palindrom: pentru fiecare centru posibil (pe un caracter, pentru lungime impara, sau intre doua caractere, pentru lungime para), de fiecare data cand extinderea simetrica reuseste (caracterele coincid), se gaseste un nou subsir palindrom si se incrementeaza un contor.\n\n**Complexitate:** O(n^2)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int n = s.size();
    long long cnt = 0;
    for (int i = 0; i < n; i++) {
        int l = i, r = i;
        while (l >= 0 && r < n && s[l] == s[r]) { cnt++; l--; r++; }
        l = i; r = i + 1;
        while (l >= 0 && r < n && s[l] == s[r]) { cnt++; l--; r++; }
    }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `s = input()
n = len(s)
cnt = 0
for i in range(n):
    l, r = i, i
    while l >= 0 and r < n and s[l] == s[r]:
        cnt += 1
        l -= 1
        r += 1
    l, r = i, i + 1
    while l >= 0 and r < n and s[l] == s[r]:
        cnt += 1
        l -= 1
        r += 1
print(cnt)
`,
    tests: ["abc", "aaa", "aba", "abba", "programare"],
  },
  {
    slug: "div-poate-forma-palindrom",
    title: "Verificare daca literele unui sir pot forma un palindrom",
    difficulty: "medium",
    tags: ["siruri", "siruri-diverse", "palindrom", "frecventa"],
    statement: "Se citeste un sir de caractere s, format doar din litere mici. Verificati daca literele sale pot fi rearanjate astfel incat sa formeze un palindrom.",
    input_format: "Se citeste un sir de caractere s, pe o singura linie.",
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Un sir de litere poate forma un palindrom daca si numai daca cel mult o litera are frecventa impara.",
    explanation: "Se calculeaza frecventa fiecarei litere din sir, apoi se numara cate litere au frecventa impara. Literele sirului pot fi rearanjate intr-un palindrom daca si numai daca cel mult una dintre ele are frecventa impara (aceasta ar deveni litera centrala, pentru un palindrom de lungime impara).\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int freq[26] = {0};
    for (char c : s) freq[c - 'a']++;
    int impare = 0;
    for (int i = 0; i < 26; i++) if (freq[i] % 2 != 0) impare++;
    cout << (impare <= 1 ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `s = input()
freq = [0] * 26
for c in s:
    freq[ord(c) - ord("a")] += 1
impare = sum(1 for f in freq if f % 2 != 0)
print("DA" if impare <= 1 else "NU")
`,
    tests: ["carrace", "abcabc", "aabbcc", "abc", "aaabbbb"],
  },
  {
    slug: "div-cifru-substitutie-vocale",
    title: "Cifru de substitutie a vocalelor",
    difficulty: "medium",
    tags: ["siruri", "siruri-diverse", "codificare", "vocale"],
    statement: "Se citeste un sir de caractere s, format doar din litere ale alfabetului englez. Codificati sirul inlocuind fiecare vocala cu urmatoarea vocala din sirul circular 'aeiou' (a devine e, e devine i, i devine o, o devine u, iar u devine a), pastrand tipul literei (mica ramane mica, mare ramane mare); consoanele raman neschimbate.",
    input_format: "Se citeste un sir de caractere s, pe o singura linie.",
    output_format: "Se afiseaza sirul codificat, pe o singura linie.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Retineti pozitia vocalei mici in sirul 'aeiou' si inlocuiti-o cu vocala de la pozitia urmatoare, modulo 5.",
    explanation: "Pentru fiecare litera se verifica daca este vocala (aducand-o mental la forma mica pentru verificare). Daca este vocala, se cauta pozitia ei in sirul 'aeiou' si se inlocuieste cu vocala de la pozitia (pozitie + 1) % 5, pastrand tipul original al literei; consoanele si celelalte caractere raman neschimbate.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    string voc = "aeiou";
    for (char &c : s) {
        bool mare = (c >= 'A' && c <= 'Z');
        char mic = mare ? c - 'A' + 'a' : c;
        int poz = voc.find(mic);
        if (poz != (int)string::npos) {
            char nou = voc[(poz + 1) % 5];
            c = mare ? nou - 'a' + 'A' : nou;
        }
    }
    cout << s << "\\n";
    return 0;
}
`,
    py: `s = list(input())
voc = "aeiou"
for i in range(len(s)):
    c = s[i]
    mare = "A" <= c <= "Z"
    mic = chr(ord(c) - ord("A") + ord("a")) if mare else c
    if mic in voc:
        poz = voc.index(mic)
        nou = voc[(poz + 1) % 5]
        s[i] = chr(ord(nou) - ord("a") + ord("A")) if mare else nou
print("".join(s))
`,
    tests: ["programare", "Informatica", "aeiouAEIOU", "bcdfg", "Uleiuri"],
  },
  {
    slug: "div-numar-silabe",
    title: "Numararea aproximativa a silabelor unui cuvant",
    difficulty: "medium",
    tags: ["siruri", "siruri-diverse", "vocale"],
    statement: "Se citeste un cuvant, format doar din litere. Determinati numarul aproximativ de silabe ale sale, considerand ca fiecare grup maximal de vocale consecutive (a, e, i, o, u, mari sau mici) formeaza o silaba.",
    input_format: "Se citeste un cuvant, pe o singura linie.",
    output_format: "Se afiseaza numarul de silabe.",
    constraints: "1 <= lungimea cuvantului <= 200",
    hints: "Incrementati un contor de fiecare data cand caracterul curent este vocala, iar caracterul anterior nu era vocala (sau este primul caracter).",
    explanation: "Se parcurge cuvantul si se incrementeaza un contor de fiecare data cand se intra intr-un nou grup de vocale consecutive, adica atunci cand caracterul curent este vocala, iar caracterul anterior nu este vocala (sau nu exista, fiind inceputul cuvantului).\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
bool eVocala(char c) {
    string voc = "aeiouAEIOU";
    return voc.find(c) != string::npos;
}
int main() {
    string s; getline(cin, s);
    int cnt = 0;
    for (int i = 0; i < (int)s.size(); i++) {
        if (eVocala(s[i]) && (i == 0 || !eVocala(s[i - 1]))) cnt++;
    }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `def e_vocala(c):
    return c in "aeiouAEIOU"

s = input()
cnt = 0
for i in range(len(s)):
    if e_vocala(s[i]) and (i == 0 or not e_vocala(s[i - 1])):
        cnt += 1
print(cnt)
`,
    tests: ["programare", "informatica", "bcdfg", "aeiou", "extraordinar"],
  },
  {
    slug: "div-identificator-valid",
    title: "Verificare daca un sir este un identificator valid",
    difficulty: "easy",
    tags: ["siruri", "siruri-diverse", "verificare"],
    statement: "Se citeste un sir de caractere s. Verificati daca este un identificator valid (ca in majoritatea limbajelor de programare): primul caracter trebuie sa fie o litera sau underscore ('_'), iar toate celelalte caractere trebuie sa fie litere, cifre sau underscore.",
    input_format: "Se citeste un sir de caractere s, pe o singura linie.",
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Verificati separat primul caracter (litera sau underscore) si restul caracterelor (litera, cifra sau underscore).",
    explanation: "Se verifica daca primul caracter al sirului este litera sau underscore, apoi se parcurg toate celelalte caractere verificand ca fiecare este litera, cifra sau underscore.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
bool literaSauUnderscore(char c) { return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_'; }
bool caracterValid(char c) { return literaSauUnderscore(c) || (c >= '0' && c <= '9'); }
int main() {
    string s; getline(cin, s);
    bool ok = literaSauUnderscore(s[0]);
    for (int i = 1; i < (int)s.size(); i++) if (!caracterValid(s[i])) ok = false;
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `def litera_sau_underscore(c):
    return ("a" <= c <= "z") or ("A" <= c <= "Z") or c == "_"

def caracter_valid(c):
    return litera_sau_underscore(c) or ("0" <= c <= "9")

s = input()
ok = litera_sau_underscore(s[0])
for i in range(1, len(s)):
    if not caracter_valid(s[i]):
        ok = False
print("DA" if ok else "NU")
`,
    tests: ["variabila1", "1variabila", "_privat", "nume utilizator", "contor_2026"],
  },
  {
    slug: "div-atoi-propriu",
    title: "Conversia unui sir de cifre in numar (atoi propriu)",
    difficulty: "medium",
    tags: ["siruri", "siruri-diverse", "conversie", "numere"],
    statement: "Se citeste un sir de caractere s, reprezentand un numar intreg, eventual precedat de semnul '+' sau '-', urmat de cifre. Determinati, fara a folosi functii predefinite de conversie, valoarea numerica reprezentata.",
    input_format: "Se citeste un sir de caractere s, pe o singura linie.",
    output_format: "Se afiseaza valoarea numerica.",
    constraints: "1 <= lungimea sirului s <= 12, valoarea reprezentata incape intr-un long long",
    hints: "Retineti semnul daca primul caracter este '+' sau '-', apoi acumulati valoarea inmultind cu 10 si adaugand fiecare cifra noua.",
    explanation: "Daca primul caracter este '+' sau '-', se retine semnul si se sare peste el. Apoi se parcurg cifrele ramase, acumuland valoarea numerica prin formula val = val * 10 + cifra, iar la final se aplica semnul retinut.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int i = 0, semn = 1;
    if (s[0] == '-') { semn = -1; i = 1; }
    else if (s[0] == '+') { i = 1; }
    long long val = 0;
    for (; i < (int)s.size(); i++) val = val * 10 + (s[i] - '0');
    val *= semn;
    cout << val << "\\n";
    return 0;
}
`,
    py: `s = input()
i, semn = 0, 1
if s[0] == "-":
    semn = -1
    i = 1
elif s[0] == "+":
    i = 1
val = 0
while i < len(s):
    val = val * 10 + (ord(s[i]) - ord("0"))
    i += 1
val *= semn
print(val)
`,
    tests: ["12345", "-678", "+42", "0", "-1000000000"],
  },
  {
    slug: "div-itoa-propriu",
    title: "Conversia unui numar in sir de caractere (itoa propriu)",
    difficulty: "medium",
    tags: ["siruri", "siruri-diverse", "conversie", "numere"],
    statement: "Se citeste un numar intreg n. Determinati, fara a folosi functii predefinite de conversie, sirul de caractere care reprezinta acest numar (inclusiv semnul '-', daca n este negativ).",
    input_format: "Se citeste un numar intreg n.",
    output_format: "Se afiseaza sirul de caractere reprezentand numarul.",
    constraints: "-10^9 <= n <= 10^9",
    hints: "Extrageti cifrele numarului (in valoare absoluta) de la ultima catre prima, adaugandu-le intr-un sir, apoi inversati sirul; daca numarul este negativ, adaugati semnul la inceput.",
    explanation: "Se trateaza separat cazul n = 0. Altfel, se retine daca numarul este negativ si se lucreaza cu valoarea sa absoluta, extragand cifrele de la cea mai putin semnificativa la cea mai semnificativa (prin impartiri si resturi repetate la 10) si adaugandu-le intr-un sir; la final, sirul de cifre se inverseaza, iar daca numarul era negativ, se adauga semnul '-' la inceput.\n\n**Complexitate:** O(numarul de cifre)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n; cin >> n;
    if (n == 0) { cout << "0\\n"; return 0; }
    bool neg = n < 0;
    if (neg) n = -n;
    string rez = "";
    while (n > 0) { rez += char('0' + n % 10); n /= 10; }
    if (neg) rez += '-';
    reverse(rez.begin(), rez.end());
    cout << rez << "\\n";
    return 0;
}
`,
    py: `n = int(input())
if n == 0:
    print("0")
else:
    neg = n < 0
    if neg:
        n = -n
    cifre = []
    while n > 0:
        cifre.append(chr(ord("0") + n % 10))
        n //= 10
    if neg:
        cifre.append("-")
    cifre.reverse()
    print("".join(cifre))
`,
    tests: ["12345", "-678", "0", "42", "-1000000000"],
  },
  {
    slug: "div-adunare-numere-mari",
    title: "Adunarea a doua numere mari reprezentate ca siruri",
    difficulty: "hard",
    tags: ["siruri", "siruri-diverse", "numere-mari"],
    statement: "Se citesc doua numere naturale mari a si b (care pot avea foarte multe cifre, prea multe pentru a incapea intr-un tip intreg obisnuit), reprezentate ca siruri de cifre, fara zerouri nesemnificative. Determinati suma lor, ca sir de cifre.",
    input_format: "Pe prima linie se citeste numarul a. Pe a doua linie se citeste numarul b.",
    output_format: "Se afiseaza suma celor doua numere, fara zerouri nesemnificative.",
    constraints: "1 <= numarul de cifre al lui a, b <= 100",
    hints: "Adunati cifrele de la dreapta la stanga, ca la adunarea clasica pe hartie, retinand transportul (carry) intre pozitii.",
    explanation: "Se aduna cele doua numere cifra cu cifra, de la ultima catre prima, mentinand un transport (carry) intre pozitii, exact ca la adunarea invatata la scoala. Rezultatul construit invers se inverseaza la final pentru a obtine ordinea corecta a cifrelor.\n\n**Complexitate:** O(max(len(a), len(b)))",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string a; getline(cin, a);
    string b; getline(cin, b);
    int i = a.size() - 1, j = b.size() - 1, carry = 0;
    string rez = "";
    while (i >= 0 || j >= 0 || carry > 0) {
        int x = (i >= 0) ? a[i] - '0' : 0;
        int y = (j >= 0) ? b[j] - '0' : 0;
        int suma = x + y + carry;
        rez += char('0' + suma % 10);
        carry = suma / 10;
        i--; j--;
    }
    reverse(rez.begin(), rez.end());
    cout << rez << "\\n";
    return 0;
}
`,
    py: `a = input()
b = input()
i, j, carry = len(a) - 1, len(b) - 1, 0
cifre = []
while i >= 0 or j >= 0 or carry > 0:
    x = ord(a[i]) - ord("0") if i >= 0 else 0
    y = ord(b[j]) - ord("0") if j >= 0 else 0
    suma = x + y + carry
    cifre.append(chr(ord("0") + suma % 10))
    carry = suma // 10
    i -= 1
    j -= 1
cifre.reverse()
print("".join(cifre))
`,
    tests: ["123\n456", "999\n1", "123456789123456789\n987654321987654321", "0\n0", "1\n999999999999999999999999999999"],
  },
  {
    slug: "div-comparare-numere-mari",
    title: "Compararea a doua numere mari reprezentate ca siruri",
    difficulty: "medium",
    tags: ["siruri", "siruri-diverse", "numere-mari", "comparare"],
    statement: "Se citesc doua numere naturale mari a si b, reprezentate ca siruri de cifre, fara zerouri nesemnificative. Comparati-le si afisati -1 daca a este mai mic decat b, 0 daca sunt egale, respectiv 1 daca a este mai mare decat b.",
    input_format: "Pe prima linie se citeste numarul a. Pe a doua linie se citeste numarul b.",
    output_format: "Se afiseaza -1, 0 sau 1.",
    constraints: "1 <= numarul de cifre al lui a, b <= 100",
    hints: "Fara zerouri nesemnificative, numarul cu mai multe cifre este mai mare; la lungimi egale, comparati cifrele de la stanga la dreapta.",
    explanation: "Deoarece numerele nu au zerouri nesemnificative, numarul cu mai multe cifre este intotdeauna mai mare. Daca au acelasi numar de cifre, se compara cifrele de la stanga la dreapta, prima diferenta decizand rezultatul.\n\n**Complexitate:** O(numarul de cifre)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string a; getline(cin, a);
    string b; getline(cin, b);
    int rez;
    if (a.size() != b.size()) {
        rez = (a.size() < b.size()) ? -1 : 1;
    } else {
        rez = 0;
        for (int i = 0; i < (int)a.size(); i++) {
            if (a[i] != b[i]) { rez = (a[i] < b[i]) ? -1 : 1; break; }
        }
    }
    cout << rez << "\\n";
    return 0;
}
`,
    py: `a = input()
b = input()
if len(a) != len(b):
    rez = -1 if len(a) < len(b) else 1
else:
    rez = 0
    for i in range(len(a)):
        if a[i] != b[i]:
            rez = -1 if a[i] < b[i] else 1
            break
print(rez)
`,
    tests: ["123\n456", "999\n999", "12345678901234567890\n987", "100\n99", "5\n5"],
  },
  {
    slug: "div-inmultire-cu-cifra",
    title: "Inmultirea unui numar mare cu o cifra",
    difficulty: "hard",
    tags: ["siruri", "siruri-diverse", "numere-mari"],
    statement: "Se citesc un numar natural mare a (reprezentat ca sir de cifre, fara zerouri nesemnificative) si o cifra d (0 <= d <= 9). Determinati produsul dintre a si d, ca sir de cifre, fara zerouri nesemnificative.",
    input_format: "Pe prima linie se citeste numarul a. Pe a doua linie se citeste cifra d.",
    output_format: "Se afiseaza produsul, fara zerouri nesemnificative.",
    constraints: "1 <= numarul de cifre al lui a <= 100, 0 <= d <= 9",
    hints: "Inmultiti fiecare cifra a lui a cu d, de la ultima catre prima, retinand transportul; la final, eliminati eventualele zerouri nesemnificative din rezultat (dar pastrati un singur '0' daca rezultatul este nul).",
    explanation: "Se inmulteste fiecare cifra a numarului a cu d, de la ultima cifra catre prima, mentinand un transport intre pozitii, similar inmultirii invatate la scoala. Dupa inversarea rezultatului, se elimina eventualele zerouri nesemnificative ramase la inceput (de exemplu cand d = 0), pastrand un singur '0' daca tot rezultatul este nul.\n\n**Complexitate:** O(numarul de cifre)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string a; getline(cin, a);
    int d; cin >> d;
    int i = a.size() - 1, carry = 0;
    string rez = "";
    while (i >= 0 || carry > 0) {
        int x = (i >= 0) ? a[i] - '0' : 0;
        int prod = x * d + carry;
        rez += char('0' + prod % 10);
        carry = prod / 10;
        i--;
    }
    reverse(rez.begin(), rez.end());
    int st = 0;
    while (st + 1 < (int)rez.size() && rez[st] == '0') st++;
    cout << rez.substr(st) << "\\n";
    return 0;
}
`,
    py: `a = input()
d = int(input())
i, carry = len(a) - 1, 0
cifre = []
while i >= 0 or carry > 0:
    x = ord(a[i]) - ord("0") if i >= 0 else 0
    prod = x * d + carry
    cifre.append(chr(ord("0") + prod % 10))
    carry = prod // 10
    i -= 1
cifre.reverse()
rez = "".join(cifre)
st = 0
while st + 1 < len(rez) and rez[st] == "0":
    st += 1
print(rez[st:])
`,
    tests: ["123\n4", "999\n9", "123456789123456789\n7", "0\n5", "5\n0"],
  },
  {
    slug: "div-numar-palindrom",
    title: "Verificare daca un numar mare este palindrom",
    difficulty: "easy",
    tags: ["siruri", "siruri-diverse", "numere-mari", "palindrom"],
    statement: "Se citeste un numar natural mare a, reprezentat ca sir de cifre, fara zerouri nesemnificative. Verificati daca a este palindrom (se citeste la fel de la stanga la dreapta si de la dreapta la stanga).",
    input_format: "Se citeste numarul a, ca sir de cifre, pe o singura linie.",
    output_format: OUT_FMT_DA_NU,
    constraints: "1 <= numarul de cifre al lui a <= 200",
    hints: "Comparati cifrele de pe pozitii simetrice, la fel ca la verificarea unui sir palindrom.",
    explanation: "Se compara cifrele de pe pozitii simetrice (i, n-1-i) ale sirului de cifre; numarul este palindrom daca toate aceste perechi de cifre coincid.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string a; getline(cin, a);
    int n = a.size();
    bool ok = true;
    for (int i = 0; i < n / 2; i++) if (a[i] != a[n - 1 - i]) ok = false;
    cout << (ok ? "DA" : "NU") << "\\n";
    return 0;
}
`,
    py: `a = input()
n = len(a)
ok = True
for i in range(n // 2):
    if a[i] != a[n - 1 - i]:
        ok = False
print("DA" if ok else "NU")
`,
    tests: ["12321", "12345", "7", "123321", "1001"],
  },
  {
    slug: "div-prefix-comun-n-cuvinte",
    title: "Cel mai lung prefix comun al mai multor cuvinte",
    difficulty: "medium",
    tags: ["siruri", "siruri-diverse", "prefix", "cuvinte"],
    statement: "Se citesc un numar natural n si n cuvinte. Determinati cel mai lung prefix comun tuturor celor n cuvinte.",
    input_format: "Pe prima linie se citeste n. Urmeaza n linii, fiecare continand un cuvant.",
    output_format: "Se afiseaza cel mai lung prefix comun (eventual sir vid).",
    constraints: "1 <= n <= 50, 1 <= lungimea fiecarui cuvant <= 100",
    hints: "Porniti cu prefixul candidat egal cu primul cuvant, apoi micsorati-l pe rand, comparandu-l cu fiecare cuvant urmator.",
    explanation: "Se initializeaza prefixul curent cu primul cuvant. Pentru fiecare cuvant urmator, se calculeaza prefixul comun dintre prefixul curent si acel cuvant (comparand caracter cu caracter, atat timp cat coincid), iar acesta devine noul prefix curent. La final, prefixul curent este cel mai lung prefix comun tuturor cuvintelor.\n\n**Complexitate:** O(n * lungime_maxima)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n; cin.ignore();
    string prefix; getline(cin, prefix);
    for (int k = 1; k < n; k++) {
        string w; getline(cin, w);
        int i = 0;
        while (i < (int)prefix.size() && i < (int)w.size() && prefix[i] == w[i]) i++;
        prefix = prefix.substr(0, i);
    }
    cout << prefix << "\\n";
    return 0;
}
`,
    py: `n = int(input())
prefix = input()
for _ in range(n - 1):
    w = input()
    i = 0
    while i < len(prefix) and i < len(w) and prefix[i] == w[i]:
        i += 1
    prefix = prefix[:i]
print(prefix)
`,
    tests: ["3\nprogramare\nprogresie\nprogram", "2\nabc\nxyz", "4\nflower\nflow\nflight\nflu", "1\nsolo", "3\ntest\ntest\ntest"],
  },
  {
    slug: "div-cea-mai-rara-litera",
    title: "Litera cea mai rar intalnita dintr-un sir",
    difficulty: "medium",
    tags: ["siruri", "siruri-diverse", "frecventa"],
    statement: "Se citeste un sir de caractere s, format doar din litere mici. Determinati litera care apare cel mai rar (dintre literele care apar cel putin o data). Daca exista mai multe litere cu aceeasi frecventa minima, afisati-o pe cea mai mica in ordine alfabetica.",
    input_format: "Se citeste un sir de caractere s, pe o singura linie.",
    output_format: "Se afiseaza litera cea mai rara.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Calculati frecventa fiecarei litere, apoi parcurgeti literele alfabetului in ordine, de la 'a' la 'z', si determinati minimul dintre frecventele strict pozitive.",
    explanation: "Se calculeaza frecventa fiecarei litere din sir. Se parcurg apoi literele alfabetului in ordine, de la 'a' la 'z', si se retine prima litera intalnita cu frecventa pozitiva minima (parcurgerea in ordine alfabetica asigura, la egalitate, alegerea celei mai mici litere).\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int freq[26] = {0};
    for (char c : s) freq[c - 'a']++;
    int minim = 1000000;
    for (int i = 0; i < 26; i++) if (freq[i] > 0 && freq[i] < minim) minim = freq[i];
    for (int i = 0; i < 26; i++) {
        if (freq[i] == minim) { cout << char('a' + i) << "\\n"; return 0; }
    }
    return 0;
}
`,
    py: `s = input()
freq = [0] * 26
for c in s:
    freq[ord(c) - ord("a")] += 1
minim = min(f for f in freq if f > 0)
for i in range(26):
    if freq[i] == minim:
        print(chr(ord("a") + i))
        break
`,
    tests: ["banana", "abracadabra", "aabbc", "programare", "zzzyx"],
  },
  {
    slug: "div-insereaza-cuvant",
    title: "Inserarea unui cuvant intr-o propozitie",
    difficulty: "medium",
    tags: ["siruri", "siruri-diverse", "cuvinte", "inserare"],
    statement: "Se citesc o propozitie, un cuvant nou si un numar natural k (0 <= k <= numarul de cuvinte din propozitie). Inserati cuvantul nou in propozitie imediat dupa al k-lea cuvant (daca k = 0, cuvantul nou devine primul cuvant al propozitiei).",
    input_format: "Pe prima linie se citeste propozitia. Pe a doua linie se citeste cuvantul nou. Pe a treia linie se citeste numarul k.",
    output_format: "Se afiseaza propozitia rezultata, pe o singura linie.",
    constraints: "1 <= lungimea propozitiei <= 200, 0 <= k <= numarul de cuvinte",
    hints: "Extrageti cuvintele intr-un vector, apoi inserati cuvantul nou pe pozitia de index k a vectorului.",
    explanation: "Se extrag cuvintele propozitiei intr-un vector. Cuvantul nou este inserat pe pozitia de index k (indexare de la 0), impingand la dreapta cuvintele urmatoare; vectorul rezultat este apoi afisat, cuvintele fiind separate printr-un singur spatiu.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    string cuvantNou; getline(cin, cuvantNou);
    int k; cin >> k;
    vector<string> cuvinte;
    string cur = "";
    for (char c : s) {
        if (c == ' ') { cuvinte.push_back(cur); cur = ""; }
        else cur += c;
    }
    cuvinte.push_back(cur);
    cuvinte.insert(cuvinte.begin() + k, cuvantNou);
    for (int i = 0; i < (int)cuvinte.size(); i++) {
        cout << cuvinte[i];
        if (i + 1 < (int)cuvinte.size()) cout << ' ';
    }
    cout << "\\n";
    return 0;
}
`,
    py: `s = input()
cuvant_nou = input()
k = int(input())
cuvinte = []
cur = ""
for c in s:
    if c == " ":
        cuvinte.append(cur)
        cur = ""
    else:
        cur += c
cuvinte.append(cur)
cuvinte.insert(k, cuvant_nou)
print(" ".join(cuvinte))
`,
    tests: ["Ana are mere\nfoarte\n2", "azi e o zi buna\nchiar\n0", "un singur cuvant\nnou\n3", "programare in c\nfoarte\n1", "a b c\nX\n0"],
  },
  {
    slug: "div-sterge-cuvant",
    title: "Stergerea celui de-al k-lea cuvant dintr-o propozitie",
    difficulty: "medium",
    tags: ["siruri", "siruri-diverse", "cuvinte", "stergere"],
    statement: "Se citesc o propozitie si un numar natural k (1 <= k <= numarul de cuvinte din propozitie). Stergeti al k-lea cuvant (numerotat de la 1) din propozitie si afisati rezultatul.",
    input_format: "Pe prima linie se citeste propozitia. Pe a doua linie se citeste numarul k.",
    output_format: "Se afiseaza propozitia rezultata, pe o singura linie (eventual vida, daca propozitia avea un singur cuvant).",
    constraints: "1 <= lungimea propozitiei <= 200, 1 <= k <= numarul de cuvinte",
    hints: "Extrageti cuvintele intr-un vector, apoi eliminati elementul de pe pozitia de index k-1.",
    explanation: "Se extrag cuvintele propozitiei intr-un vector, apoi se elimina elementul de pe pozitia de index k-1 (indexare de la 0). Vectorul ramas este afisat, cuvintele fiind separate printr-un singur spatiu.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int k; cin >> k;
    vector<string> cuvinte;
    string cur = "";
    for (char c : s) {
        if (c == ' ') { cuvinte.push_back(cur); cur = ""; }
        else cur += c;
    }
    cuvinte.push_back(cur);
    cuvinte.erase(cuvinte.begin() + (k - 1));
    for (int i = 0; i < (int)cuvinte.size(); i++) {
        cout << cuvinte[i];
        if (i + 1 < (int)cuvinte.size()) cout << ' ';
    }
    cout << "\\n";
    return 0;
}
`,
    py: `s = input()
k = int(input())
cuvinte = []
cur = ""
for c in s:
    if c == " ":
        cuvinte.append(cur)
        cur = ""
    else:
        cur += c
cuvinte.append(cur)
del cuvinte[k - 1]
print(" ".join(cuvinte))
`,
    tests: ["Ana are foarte multe mere\n3", "un singur cuvant\n2", "azi e o zi buna\n1", "programare in c plus plus\n5", "a b c\n2"],
  },
  {
    slug: "div-inlocuieste-cuvant",
    title: "Inlocuirea celui de-al k-lea cuvant dintr-o propozitie",
    difficulty: "medium",
    tags: ["siruri", "siruri-diverse", "cuvinte", "inlocuire"],
    statement: "Se citesc o propozitie, un numar natural k (1 <= k <= numarul de cuvinte din propozitie) si un cuvant nou. Inlocuiti al k-lea cuvant (numerotat de la 1) din propozitie cu cuvantul nou si afisati rezultatul.",
    input_format: "Pe prima linie se citeste propozitia. Pe a doua linie se citeste numarul k. Pe a treia linie se citeste cuvantul nou.",
    output_format: "Se afiseaza propozitia rezultata, pe o singura linie.",
    constraints: "1 <= lungimea propozitiei <= 200, 1 <= k <= numarul de cuvinte",
    hints: "Extrageti cuvintele intr-un vector, apoi suprascrieti elementul de pe pozitia de index k-1 cu cuvantul nou.",
    explanation: "Se extrag cuvintele propozitiei intr-un vector, apoi elementul de pe pozitia de index k-1 (indexare de la 0) este inlocuit cu cuvantul nou. Vectorul rezultat este afisat, cuvintele fiind separate printr-un singur spatiu.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int k; cin >> k; cin.ignore();
    string cuvantNou; getline(cin, cuvantNou);
    vector<string> cuvinte;
    string cur = "";
    for (char c : s) {
        if (c == ' ') { cuvinte.push_back(cur); cur = ""; }
        else cur += c;
    }
    cuvinte.push_back(cur);
    cuvinte[k - 1] = cuvantNou;
    for (int i = 0; i < (int)cuvinte.size(); i++) {
        cout << cuvinte[i];
        if (i + 1 < (int)cuvinte.size()) cout << ' ';
    }
    cout << "\\n";
    return 0;
}
`,
    py: `s = input()
k = int(input())
cuvant_nou = input()
cuvinte = []
cur = ""
for c in s:
    if c == " ":
        cuvinte.append(cur)
        cur = ""
    else:
        cur += c
cuvinte.append(cur)
cuvinte[k - 1] = cuvant_nou
print(" ".join(cuvinte))
`,
    tests: ["Ana are foarte multe mere\n3\nputine", "un singur cuvant\n2\nnou", "azi e o zi buna\n1\nmaine", "programare in c plus plus\n5\nsharp", "a b c\n2\nX"],
  },
  {
    slug: "div-interschimba-primul-ultimul-cuvant",
    title: "Interschimbarea primului cu ultimul cuvant dintr-o propozitie",
    difficulty: "easy",
    tags: ["siruri", "siruri-diverse", "cuvinte"],
    statement: "Se citeste o propozitie. Afisati propozitia obtinuta prin interschimbarea primului cuvant cu ultimul, restul cuvintelor ramanand neschimbate. Daca propozitia are un singur cuvant, aceasta ramane neschimbata.",
    input_format: IN_FMT_PROPOZITIE,
    output_format: "Se afiseaza propozitia rezultata, pe o singura linie.",
    constraints: "1 <= lungimea propozitiei <= 200",
    hints: "Extrageti cuvintele intr-un vector si interschimbati primul element cu ultimul.",
    explanation: "Se extrag cuvintele propozitiei intr-un vector, apoi se interschimba elementul de pe prima pozitie cu cel de pe ultima pozitie; vectorul rezultat este afisat, cuvintele fiind separate printr-un singur spatiu.\n\n**Complexitate:** O(n)",
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
    swap(cuvinte[0], cuvinte[cuvinte.size() - 1]);
    for (int i = 0; i < (int)cuvinte.size(); i++) {
        cout << cuvinte[i];
        if (i + 1 < (int)cuvinte.size()) cout << ' ';
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
cuvinte[0], cuvinte[-1] = cuvinte[-1], cuvinte[0]
print(" ".join(cuvinte))
`,
    tests: ["Ana are mere rosii", "un singur cuvant", "azi e o zi buna", "programare in c plus plus", "primul ultim"],
  },
  {
    slug: "div-litere-frecventa-impara",
    title: "Numarul de litere care apar de un numar impar de ori",
    difficulty: "easy",
    tags: ["siruri", "siruri-diverse", "frecventa"],
    statement: "Se citeste un sir de caractere s, format doar din litere mici. Determinati cate litere distincte apar de un numar impar de ori in sir.",
    input_format: "Se citeste un sir de caractere s, pe o singura linie.",
    output_format: "Se afiseaza numarul de litere distincte cu frecventa impara.",
    constraints: "1 <= lungimea sirului s <= 200",
    hints: "Calculati frecventa fiecarei litere, apoi numarati cate dintre cele 26 de litere au frecventa impara.",
    explanation: "Se calculeaza frecventa fiecarei litere din sir intr-un vector de 26 de elemente, apoi se numara pentru cate dintre cele 26 de litere frecventa este impara.\n\n**Complexitate:** O(n)",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    int freq[26] = {0};
    for (char c : s) freq[c - 'a']++;
    int cnt = 0;
    for (int i = 0; i < 26; i++) if (freq[i] % 2 != 0) cnt++;
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `s = input()
freq = [0] * 26
for c in s:
    freq[ord(c) - ord("a")] += 1
cnt = sum(1 for f in freq if f % 2 != 0)
print(cnt)
`,
    tests: ["aabbcc", "aabbc", "abcabc", "a", "aabbccdde"],
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
