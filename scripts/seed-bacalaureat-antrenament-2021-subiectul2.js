const { runMain, buildDimChecker } = require("./lib/bac-subiectul2-runner");

const LEVEL = "bacalaureat";
const CHAPTER = { id: "bacalaureat-2021", name: "Bacalaureat 2021" };
const SRC = "Bacalaureat Informatica MI - Antrenament 2021 (Ministerul Educatiei) - Subiectul II";

const IO_STDIN = { input_source: "stdin", output_target: "stdout", input_filename: null, output_filename: null };

const problems = [
  // ===================== v2 =====================
  {
    slug: "bac-antrenament-2021-v2-2-2",
    subcategoryId: "antrenament-2021-v2",
    title: "Antrenament 2021 V2, S2.2 - Structura polinom",
    difficulty: "easy",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul2", "structuri"],
    statement:
      "Variabila p memoreaza simultan gradul unui polinom (numar natural din intervalul [0,102)) si toti coeficientii acestuia (numere reale).\n\n" +
      "Scrieti definitia unei structuri cu eticheta polinom, care permite memorarea datelor despre un polinom, si declarati corespunzator variabila p.\n\n" +
      "Codul de verificare va folosi expresiile p.grad si p.coeficient[grad] (termenul de rang maxim). Deoarece gradul poate fi pana la 101, tabloul coeficient trebuie sa aiba cel putin 102 elemente (indicii 0..grad trebuie sa fie valizi).",
    input_format: "Se citesc grad si coeficient[grad].",
    output_format: "Se afiseaza p.grad, p.coeficient[grad] (2 zecimale) si numarul de elemente ale tabloului coeficient, separate prin spatiu.",
    constraints: "gradul este in intervalul [0,102)",
    hints: "coeficient este un tablou de numere reale, cu cel putin 102 elemente (grad poate fi si 101).",
    explanation: "Structura polinom: grad (int) si coeficient (tablou de reali, minim 102 elemente pentru a acoperi indicii 0..101). Verificarea foloseste chiar gradul variabil ca indice, inclusiv valoarea maxima 101.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    checkerCode: buildDimChecker([102]),
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    cin >> p.grad;
    cin >> p.coeficient[p.grad];
    int dim = sizeof(p.coeficient) / sizeof(p.coeficient[0]);
    printf("%d %.2f %d\\n", p.grad, p.coeficient[p.grad], dim);
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    scanf("%d", &p.grad);
    scanf("%lf", &p.coeficient[p.grad]);
    int dim = (int)(sizeof(p.coeficient) / sizeof(p.coeficient[0]));
    printf("%d %.2f %d\\n", p.grad, p.coeficient[p.grad], dim);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
var dim: longint;
begin
  read(p.grad);
  read(p.coeficient[p.grad]);
  dim := High(p.coeficient) - Low(p.coeficient) + 1;
  writeln(p.grad, ' ', p.coeficient[p.grad]:0:2, ' ', dim);
end.
`,
    },
    solutions: {
      cpp: `struct polinom {
    int grad;
    double coeficient[102];
} p;
`,
      c: `struct polinom {
    int grad;
    double coeficient[102];
} p;
`,
      pascal: `type
  polinom = record
    grad: longint;
    coeficient: array[0..101] of real;
  end;
var
  p: polinom;
`,
    },
    tests: ["3 2.5", "0 10", "101 -1.5", "5 123456789.5"],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-antrenament-2021-v2-2-3",
    subcategoryId: "antrenament-2021-v2",
    title: "Antrenament 2021 V2, S2.3 - Vocale absente dintr-un sir",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul2", "siruri-caractere"],
    statement:
      "Variabila s memoreaza un sir de cel mult 20 de caractere (litere mari si mici ale alfabetului englez). Declarati eventualele alte variabile necesare si scrieti o secventa de instructiuni in urma executarii careia se afiseaza pe ecran vocalele care NU apar in sirul mentionat. Se considera vocale literele a, e, i, o, u, A, E, I, O, U.\n\n" +
      "Exemplu: daca se citeste textul PREafrUMoASA se afiseaza pe ecran, nu neaparat in aceasta ordine, vocalele: euOiI",
    input_format: "Se citeste sirul s.",
    output_format: "Vocalele absente din s, in ordinea aeiouAEIOU (fara spatii intre ele).",
    constraints: "Cel mult 20 de caractere.",
    hints: "Parcurgeti fiecare vocala din multimea aeiouAEIOU si verificati daca apare in s (de exemplu cu strchr).",
    explanation: "Se parcurg cele 10 vocale posibile, in ordine fixa, si se afiseaza doar cele care nu se gasesc deloc in sirul s.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
#include <cstring>
using namespace std;
char s[25];
int main() {
    cin >> s;
    __USER_CODE__
    cout << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
#include <string.h>
char s[25];
int main() {
    scanf("%s", s);
    __USER_CODE__
    printf("\\n");
    return 0;
}
`,
      pascal: `program solution;
var
  s, vocale: string;
  k: integer;
begin
  readln(s);
  __USER_CODE__
  writeln;
end.
`,
      python: `s = input().strip()
out = []
__USER_CODE__
print(''.join(out))
`,
    },
    solutions: {
      cpp: `const char vocale[] = "aeiouAEIOU";
for (int k = 0; k < 10; k++)
    if (strchr(s, vocale[k]) == NULL) cout << vocale[k];
`,
      c: `const char vocale[] = "aeiouAEIOU";
int k;
for (k = 0; k < 10; k++)
    if (strchr(s, vocale[k]) == NULL) printf("%c", vocale[k]);
`,
      pascal: `vocale := 'aeiouAEIOU';
for k := 1 to 10 do
  if pos(vocale[k], s) = 0 then write(vocale[k]);
`,
      python: `vocale = 'aeiouAEIOU'
for ch in vocale:
        if ch not in s:
            out.append(ch)
`,
    },
    tests: ["PREafrUMoASA", "bcdfg", "aeiouAEIOU"],
    time_limit_ms: 1000,
  },
  // ===================== v3 =====================
  {
    slug: "bac-antrenament-2021-v3-2-2",
    subcategoryId: "antrenament-2021-v3",
    title: "Antrenament 2021 V3, S2.2 - Structura muzeu",
    difficulty: "easy",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul2", "structuri"],
    statement:
      "Variabila m memoreaza simultan numarul de exponate dintr-un muzeu (numar natural din intervalul [3,102)) si date despre fiecare exponat (numele si colectia din care face parte, siruri de cel mult 20 de caractere).\n\n" +
      "Scrieti definitia unei structuri cu eticheta muzeu, care permite memorarea datelor despre un muzeu, si declarati corespunzator variabila m.\n\n" +
      "Codul de verificare va folosi expresiile m.numar, m.exponat[2].nume si m.exponat[2].colectie.",
    input_format: "Se citesc numar si un indice idx (linie), apoi pentru exponatul de indice idx: nume (linie), colectie (linie).",
    output_format: "Se afiseaza m.numar, m.exponat[idx].nume, m.exponat[idx].colectie si numarul de elemente ale tabloului exponat, separate prin spatiu.",
    constraints: "numarul de exponate este in intervalul [3,102)",
    hints: "exponat este un tablou de structuri cu doua campuri sir, cu cel putin 101 elemente (idx poate fi si 100).",
    explanation: "Structura muzeu: numar (int) si exponat (tablou de structuri cu nume, colectie siruri, minim 101 elemente). Verificarea foloseste un indice variabil, inclusiv ultima pozitie valida.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    checkerCode: buildDimChecker([101]),
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int idx;
    cin >> m.numar >> idx >> m.exponat[idx].nume >> m.exponat[idx].colectie;
    int dim = sizeof(m.exponat) / sizeof(m.exponat[0]);
    cout << m.numar << " " << m.exponat[idx].nume << " " << m.exponat[idx].colectie << " " << dim << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    int idx;
    scanf("%d %d", &m.numar, &idx);
    scanf("%s %s", m.exponat[idx].nume, m.exponat[idx].colectie);
    int dim = (int)(sizeof(m.exponat) / sizeof(m.exponat[0]));
    printf("%d %s %s %d\\n", m.numar, m.exponat[idx].nume, m.exponat[idx].colectie, dim);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
var dim, idx: longint;
begin
  readln(m.numar, idx);
  readln(m.exponat[idx].nume);
  readln(m.exponat[idx].colectie);
  dim := High(m.exponat) - Low(m.exponat) + 1;
  writeln(m.numar, ' ', m.exponat[idx].nume, ' ', m.exponat[idx].colectie, ' ', dim);
end.
`,
    },
    solutions: {
      cpp: `struct exponatTip { char nume[21]; char colectie[21]; };
struct muzeu {
    int numar;
    exponatTip exponat[101];
} m;
`,
      c: `struct exponatTip { char nume[21]; char colectie[21]; };
struct muzeu {
    int numar;
    struct exponatTip exponat[101];
} m;
`,
      pascal: `type
  exponatTip = record
    nume, colectie: string;
  end;
  muzeu = record
    numar: longint;
    exponat: array[0..100] of exponatTip;
  end;
var
  m: muzeu;
`,
    },
    tests: ["30 0\nVazaGreceasca\nAntichitate", "5 0\nTabloulX\nArtaModerna", "99 100\nStatuiaY\nRenastere"],
    time_limit_ms: 1000,
  },
  // ===================== v4 =====================
  {
    slug: "bac-antrenament-2021-v4-2-2",
    subcategoryId: "antrenament-2021-v4",
    title: "Antrenament 2021 V4, S2.2 - Structura ciocolata",
    difficulty: "easy",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul2", "structuri"],
    statement:
      "Variabila c memoreaza date despre o ciocolata: gramajul si data expirarii (ziua, luna si anul).\n\n" +
      "Scrieti definitia unei structuri cu eticheta ciocolata, care permite memorarea datelor precizate pentru o ciocolata, si declarati corespunzator variabila c.\n\n" +
      "Codul de verificare va folosi expresiile c.gramaj, c.datae.zi, c.datae.luna si c.datae.an.",
    input_format: "Se citesc gramaj, zi, luna si an.",
    output_format: "Se afiseaza cele 4 valori, separate prin spatiu.",
    constraints: "-",
    hints: "datae este un camp de tip structura cu zi, luna, an.",
    explanation: "Structura ciocolata: gramaj (int) si datae (structura cu zi, luna, an intregi).",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    cin >> c.gramaj >> c.datae.zi >> c.datae.luna >> c.datae.an;
    cout << c.gramaj << " " << c.datae.zi << " " << c.datae.luna << " " << c.datae.an << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    scanf("%d %d %d %d", &c.gramaj, &c.datae.zi, &c.datae.luna, &c.datae.an);
    printf("%d %d %d %d\\n", c.gramaj, c.datae.zi, c.datae.luna, c.datae.an);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
begin
  readln(c.gramaj, c.datae.zi, c.datae.luna, c.datae.an);
  writeln(c.gramaj, ' ', c.datae.zi, ' ', c.datae.luna, ' ', c.datae.an);
end.
`,
    },
    solutions: {
      cpp: `struct dataTip { int zi, luna, an; };
struct ciocolata {
    int gramaj;
    dataTip datae;
} c;
`,
      c: `struct dataTip { int zi, luna, an; };
struct ciocolata {
    int gramaj;
    struct dataTip datae;
} c;
`,
      pascal: `type
  dataTip = record
    zi, luna, an: longint;
  end;
  ciocolata = record
    gramaj: longint;
    datae: dataTip;
  end;
var
  c: ciocolata;
`,
    },
    tests: ["100 15 6 2025", "45 1 1 2026", "250 31 12 2024", "2000000000 20 5 2025"],
    time_limit_ms: 1000,
  },
  // ===================== v5 =====================
  {
    slug: "bac-antrenament-2021-v5-2-2",
    subcategoryId: "antrenament-2021-v5",
    title: "Antrenament 2021 V5, S2.2 - Structura carte",
    difficulty: "easy",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul2", "structuri"],
    statement:
      "Variabila c memoreaza simultan urmatoarele date despre o carte dintr-o biblioteca: titlul (sir de maximum 50 de caractere), numele autorului/autorilor (maximum 10 autori) si numarul de exemplare.\n\n" +
      "Scrieti definitia unei structuri cu eticheta carte, care permite memorarea datelor despre o carte, si declarati corespunzator variabila c.\n\n" +
      "Codul de verificare va folosi expresiile c.titlu, c.autor[0] si c.nrExemplare.",
    input_format: "Se citesc titlu (linie), idx si nrExemplare (linie), apoi autor[idx] (linie).",
    output_format: "Se afiseaza c.titlu, c.autor[idx], c.nrExemplare si numarul de elemente ale tabloului autor, separate prin spatiu.",
    constraints: "cel mult 10 autori",
    hints: "autor este un tablou de siruri, cu exact 10 elemente (idx poate fi si 9).",
    explanation: "Structura carte: titlu (sir), autor (tablou de siruri, minim 10 elemente), nrExemplare (int). Verificarea foloseste un indice variabil, inclusiv ultima pozitie valida.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    checkerCode: buildDimChecker([10]),
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int idx;
    cin >> c.titlu >> idx >> c.nrExemplare >> c.autor[idx];
    int dim = sizeof(c.autor) / sizeof(c.autor[0]);
    cout << c.titlu << " " << c.autor[idx] << " " << c.nrExemplare << " " << dim << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    int idx;
    scanf("%s", c.titlu);
    scanf("%d %d", &idx, &c.nrExemplare);
    scanf("%s", c.autor[idx]);
    int dim = (int)(sizeof(c.autor) / sizeof(c.autor[0]));
    printf("%s %s %d %d\\n", c.titlu, c.autor[idx], c.nrExemplare, dim);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
var dim, idx: longint;
begin
  readln(c.titlu);
  readln(idx, c.nrExemplare);
  readln(c.autor[idx]);
  dim := High(c.autor) - Low(c.autor) + 1;
  writeln(c.titlu, ' ', c.autor[idx], ' ', c.nrExemplare, ' ', dim);
end.
`,
    },
    solutions: {
      cpp: `struct carte {
    char titlu[51];
    char autor[10][51];
    int nrExemplare;
} c;
`,
      c: `struct carte {
    char titlu[51];
    char autor[10][51];
    int nrExemplare;
} c;
`,
      pascal: `type
  carte = record
    titlu: string;
    autor: array[0..9] of string;
    nrExemplare: longint;
  end;
var
  c: carte;
`,
    },
    tests: ["Ion\n0 100\nLRebreanu", "Baltagul\n0 50\nMSadoveanu", "Amintiri\n9 30\nICreanga"],
    time_limit_ms: 1000,
  },
  // ===================== v6 =====================
  {
    slug: "bac-antrenament-2021-v6-2-2",
    subcategoryId: "antrenament-2021-v6",
    title: "Antrenament 2021 V6, S2.2 - Structura figura (cerc dupa diametru)",
    difficulty: "easy",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul2", "structuri"],
    statement:
      "Pentru un cerc se memoreaza date specifice: coordonatele reale (abscisa si ordonata), in sistemul de coordonate xOy, ale centrului cercului, precum si lungimea diametrului acestuia.\n\n" +
      "Scrieti definitia unei structuri cu eticheta figura, care permite memorarea datelor specifice ale unui cerc, si declarati corespunzator variabila c.\n\n" +
      "Codul de verificare va folosi expresiile c.centru.x, c.centru.y si c.diametru.",
    input_format: "Se citesc x, y si diametru.",
    output_format: "Se afiseaza c.centru.x, c.centru.y si c.diametru (2 zecimale), separate prin spatiu.",
    constraints: "-",
    hints: "centru este un camp de tip structura cu x, y.",
    explanation: "Structura figura: centru (structura cu x, y reali) si diametru (real).",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    cin >> c.centru.x >> c.centru.y >> c.diametru;
    printf("%.2f %.2f %.2f\\n", c.centru.x, c.centru.y, c.diametru);
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    scanf("%lf %lf %lf", &c.centru.x, &c.centru.y, &c.diametru);
    printf("%.2f %.2f %.2f\\n", c.centru.x, c.centru.y, c.diametru);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
begin
  readln(c.centru.x, c.centru.y, c.diametru);
  writeln(c.centru.x:0:2, ' ', c.centru.y:0:2, ' ', c.diametru:0:2);
end.
`,
    },
    solutions: {
      cpp: `struct punct { double x, y; };
struct figura {
    punct centru;
    double diametru;
} c;
`,
      c: `struct punct { double x, y; };
struct figura {
    struct punct centru;
    double diametru;
} c;
`,
      pascal: `type
  punct = record
    x, y: real;
  end;
  figura = record
    centru: punct;
    diametru: real;
  end;
var
  c: figura;
`,
    },
    tests: ["0 0 10", "3 4 5", "-1.5 2.5 8", "1234567.89 -7654321.12 999999.99"],
    time_limit_ms: 1000,
  },
  // ===================== v7 =====================
  {
    slug: "bac-antrenament-2021-v7-2-2",
    subcategoryId: "antrenament-2021-v7",
    title: "Antrenament 2021 V7, S2.2 - Elev nascut dupa eveniment",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul2", "structuri", "secventa-instructiuni"],
    statement:
      "In declararile alaturate, variabila dataEveniment memoreaza data calendaristica la care s-a desfasurat un anumit eveniment, iar variabila e memoreaza numele si data nasterii unui elev.\n\n" +
      "struct data { int zi, luna, an; } dataEveniment;\n" +
      "struct elev { char nume[30]; data dataNasterii; } e;\n\n" +
      "Scrieti o secventa de instructiuni C/C++ in urma executarii careia sa se afiseze pe ecran mesajul ulterior daca elevul s-a nascut ulterior desfasurarii evenimentului, sau mesajul nu in caz contrar.",
    input_format: "Se citesc dataEveniment (zi luna an), apoi e.dataNasterii (zi luna an).",
    output_format: "Se afiseaza ulterior sau nu.",
    constraints: "-",
    hints: "Comparati (an, luna, zi) ale celor doua date, in aceasta ordine de prioritate.",
    explanation: "Elevul e nascut ulterior daca (an,luna,zi) al datei nasterii este strict mai mare decat cel al datei evenimentului, comparate lexicografic.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
struct dataTip { int zi, luna, an; } dataEveniment;
struct elev { char nume[30]; dataTip dataNasterii; } e;
int main() {
    cin >> dataEveniment.zi >> dataEveniment.luna >> dataEveniment.an;
    cin >> e.dataNasterii.zi >> e.dataNasterii.luna >> e.dataNasterii.an;
    __USER_CODE__
    return 0;
}
`,
      c: `#include <stdio.h>
struct dataTip { int zi, luna, an; } dataEveniment;
struct elev { char nume[30]; struct dataTip dataNasterii; } e;
int main() {
    scanf("%d %d %d", &dataEveniment.zi, &dataEveniment.luna, &dataEveniment.an);
    scanf("%d %d %d", &e.dataNasterii.zi, &e.dataNasterii.luna, &e.dataNasterii.an);
    __USER_CODE__
    return 0;
}
`,
      pascal: `program solution;
type
  dataTip = record
    zi, luna, an: longint;
  end;
  elev = record
    nume: string;
    dataNasterii: dataTip;
  end;
var
  dataEveniment: dataTip;
  e: elev;
  ulterior: boolean;
begin
  readln(dataEveniment.zi, dataEveniment.luna, dataEveniment.an);
  readln(e.dataNasterii.zi, e.dataNasterii.luna, e.dataNasterii.an);
  __USER_CODE__
end.
`,
      python: `from types import SimpleNamespace
ez, el, ea = map(int, input().split())
dataEveniment = SimpleNamespace(zi=ez, luna=el, an=ea)
nz, nl, na = map(int, input().split())
e = SimpleNamespace(dataNasterii=SimpleNamespace(zi=nz, luna=nl, an=na))
__USER_CODE__
`,
    },
    solutions: {
      cpp: `bool ulterior;
if (e.dataNasterii.an != dataEveniment.an) ulterior = e.dataNasterii.an > dataEveniment.an;
else if (e.dataNasterii.luna != dataEveniment.luna) ulterior = e.dataNasterii.luna > dataEveniment.luna;
else ulterior = e.dataNasterii.zi > dataEveniment.zi;
if (ulterior) cout << "ulterior\\n"; else cout << "nu\\n";
`,
      c: `int ulterior;
if (e.dataNasterii.an != dataEveniment.an) ulterior = e.dataNasterii.an > dataEveniment.an;
else if (e.dataNasterii.luna != dataEveniment.luna) ulterior = e.dataNasterii.luna > dataEveniment.luna;
else ulterior = e.dataNasterii.zi > dataEveniment.zi;
if (ulterior) printf("ulterior\\n"); else printf("nu\\n");
`,
      pascal: `if e.dataNasterii.an <> dataEveniment.an then ulterior := e.dataNasterii.an > dataEveniment.an
else if e.dataNasterii.luna <> dataEveniment.luna then ulterior := e.dataNasterii.luna > dataEveniment.luna
else ulterior := e.dataNasterii.zi > dataEveniment.zi;
if ulterior then writeln('ulterior') else writeln('nu');
`,
      python: `if e.dataNasterii.an != dataEveniment.an:
        ulterior = e.dataNasterii.an > dataEveniment.an
elif e.dataNasterii.luna != dataEveniment.luna:
        ulterior = e.dataNasterii.luna > dataEveniment.luna
else:
        ulterior = e.dataNasterii.zi > dataEveniment.zi
print('ulterior' if ulterior else 'nu')
`,
    },
    tests: ["1 1 2020\n15 6 2021", "10 5 2022\n10 5 2022", "20 3 2023\n1 1 2020"],
    time_limit_ms: 1000,
  },
  // ===================== v8 =====================
  {
    slug: "bac-antrenament-2021-v8-2-2",
    subcategoryId: "antrenament-2021-v8",
    title: "Antrenament 2021 V8, S2.2 - Structura clasa",
    difficulty: "easy",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul2", "structuri"],
    statement:
      "Variabila p memoreaza simultan numarul de elevi dintr-o clasa (numar natural din intervalul [2,40]) si, pentru fiecare elev al clasei, media de pe primul semestru precum si media de pe cel de-al doilea semestru (numere reale cu cel mult doua zecimale) la disciplina informatica.\n\n" +
      "Scrieti definitia unei structuri cu eticheta clasa, care permite memorarea datelor despre elevii clasei, si declarati corespunzator variabila p.\n\n" +
      "Codul de verificare va folosi expresiile p.numar, p.elev[0].sem1 si p.elev[0].sem2.",
    input_format: "Se citesc numar, un indice idx, sem1 si sem2 pentru p.elev[idx].",
    output_format: "Se afiseaza p.numar, p.elev[idx].sem1, p.elev[idx].sem2 (2 zecimale) si numarul de elemente ale tabloului elev, separate prin spatiu.",
    constraints: "2 <= numar <= 40",
    hints: "elev este un tablou de structuri cu campurile sem1 si sem2, cu exact 40 de elemente (idx poate fi si 39).",
    explanation: "Structura clasa: numar (int) si elev (tablou de structuri cu sem1, sem2 reale, minim 40 de elemente). Verificarea foloseste un indice variabil, inclusiv ultima pozitie valida.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    checkerCode: buildDimChecker([40]),
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int idx;
    cin >> p.numar >> idx;
    cin >> p.elev[idx].sem1 >> p.elev[idx].sem2;
    int dim = sizeof(p.elev) / sizeof(p.elev[0]);
    printf("%d %.2f %.2f %d\\n", p.numar, p.elev[idx].sem1, p.elev[idx].sem2, dim);
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    int idx;
    scanf("%d %d", &p.numar, &idx);
    scanf("%lf %lf", &p.elev[idx].sem1, &p.elev[idx].sem2);
    int dim = (int)(sizeof(p.elev) / sizeof(p.elev[0]));
    printf("%d %.2f %.2f %d\\n", p.numar, p.elev[idx].sem1, p.elev[idx].sem2, dim);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
var dim, idx: longint;
begin
  readln(p.numar, idx, p.elev[idx].sem1, p.elev[idx].sem2);
  dim := High(p.elev) - Low(p.elev) + 1;
  writeln(p.numar, ' ', p.elev[idx].sem1:0:2, ' ', p.elev[idx].sem2:0:2, ' ', dim);
end.
`,
    },
    solutions: {
      cpp: `struct elevTip { double sem1, sem2; };
struct clasa {
    int numar;
    elevTip elev[40];
} p;
`,
      c: `struct elevTip { double sem1, sem2; };
struct clasa {
    int numar;
    struct elevTip elev[40];
} p;
`,
      pascal: `type
  elevTip = record
    sem1, sem2: real;
  end;
  clasa = record
    numar: longint;
    elev: array[0..39] of elevTip;
  end;
var
  p: clasa;
`,
    },
    tests: ["25 0 9.50 10.00", "30 0 5.25 6.75", "40 39 8 8.5"],
    time_limit_ms: 1000,
  },
  // ===================== v9 =====================
  {
    slug: "bac-antrenament-2021-v9-2-3",
    subcategoryId: "antrenament-2021-v9",
    title: "Antrenament 2021 V9, S2.3 - Tablou 4x5 cu rest la 3",
    difficulty: "easy",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul2", "tablouri-bidimensionale"],
    statement:
      "Variabilele i si j sunt de tip intreg, iar variabila a memoreaza un tablou bidimensional cu 4 linii si 5 coloane, numerotate incepand de la 0, cu elemente numere intregi, initial toate nule.\n\n" +
      "Fara a utiliza alte variabile decat cele mentionate, scrieti secventa de mai jos astfel incat, in urma executarii secventei obtinute, variabila a sa memoreze tabloul:\n\n" +
      "0 1 2 0 1\n1 2 0 1 2\n2 0 1 2 0\n0 1 2 0 1\n\n" +
      "for(i=0;i<4;i++)\n  for(j=0;j<5;j++)\n    .................",
    input_format: "Fara date de intrare.",
    output_format: "Cele 4 linii ale tabloului a, elementele separate prin cate un spatiu.",
    constraints: "Dimensiune fixa 4x5.",
    hints: "a[i][j] = (i+j) % 3.",
    explanation: "Formula (i+j) mod 3 genereaza direct tabloul cerut.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int a[4][5];
    int i, j;
    for (i = 0; i < 4; i++)
        for (j = 0; j < 5; j++)
            __USER_CODE__
    for (i = 0; i < 4; i++) {
        for (j = 0; j < 5; j++) cout << a[i][j] << (j < 4 ? " " : "");
        cout << "\\n";
    }
    return 0;
}
`,
      c: `#include <stdio.h>
int main() {
    int a[4][5];
    int i, j;
    for (i = 0; i < 4; i++)
        for (j = 0; j < 5; j++)
            __USER_CODE__
    for (i = 0; i < 4; i++) {
        for (j = 0; j < 5; j++) printf("%d%s", a[i][j], j < 4 ? " " : "");
        printf("\\n");
    }
    return 0;
}
`,
      pascal: `program solution;
var
  a: array[0..3,0..4] of integer;
  i, j: integer;
begin
  for i := 0 to 3 do
    for j := 0 to 4 do
      __USER_CODE__
  for i := 0 to 3 do begin
    for j := 0 to 4 do begin
      write(a[i,j]);
      if j < 4 then write(' ');
    end;
    writeln;
  end;
end.
`,
      python: `a = [[None]*5 for _ in range(4)]
for i in range(4):
    for j in range(5):
        __USER_CODE__
for i in range(4):
    print(' '.join(str(a[i][j]) for j in range(5)))
`,
    },
    solutions: {
      cpp: `a[i][j] = (i + j) % 3;
`,
      c: `a[i][j] = (i + j) % 3;
`,
      pascal: `a[i,j] := (i + j) mod 3;
`,
      python: `a[i][j] = (i + j) % 3
`,
    },
    tests: [""],
    time_limit_ms: 1000,
  },
  // ===================== v10 =====================
  {
    slug: "bac-antrenament-2021-v10-2-2",
    subcategoryId: "antrenament-2021-v10",
    title: "Antrenament 2021 V10, S2.2 - Structura elev",
    difficulty: "easy",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul2", "structuri"],
    statement:
      "Variabila y memoreaza simultan datele fiecaruia dintre cei 30 de elevi dintr-o clasa: codul de identificare la un examen (numar natural din intervalul [1,1000)) si doua note obtinute (numere reale).\n\n" +
      "Scrieti definitia unei structuri cu eticheta elev, care permite memorarea datelor despre un elev, si declarati corespunzator variabila y.\n\n" +
      "Codul de verificare va folosi expresiile y[2].cod, y[2].nota1 si y[2].nota2.",
    input_format: "Se citesc un indice idx, cod, nota1 si nota2.",
    output_format: "Se afiseaza y[idx].cod, y[idx].nota1, y[idx].nota2 (2 zecimale) si numarul de elemente ale tabloului y, separate prin spatiu.",
    constraints: "1 <= cod < 1000",
    hints: "Structura elev are 3 campuri: cod (int), nota1 si nota2 (reale). Nu uitati ca y trebuie sa aiba exact 30 de elemente (idx poate fi si 29).",
    explanation: "Structura elev: cod (int), nota1 (real), nota2 (real). Verificarea foloseste un indice variabil, inclusiv ultima pozitie valida.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    checkerCode: buildDimChecker([30]),
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int idx;
    cin >> idx;
    cin >> y[idx].cod >> y[idx].nota1 >> y[idx].nota2;
    int dim = sizeof(y) / sizeof(y[0]);
    printf("%d %.2f %.2f %d\\n", y[idx].cod, y[idx].nota1, y[idx].nota2, dim);
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    int idx;
    scanf("%d", &idx);
    scanf("%d %lf %lf", &y[idx].cod, &y[idx].nota1, &y[idx].nota2);
    int dim = (int)(sizeof(y) / sizeof(y[0]));
    printf("%d %.2f %.2f %d\\n", y[idx].cod, y[idx].nota1, y[idx].nota2, dim);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
var dim, idx: longint;
begin
  read(idx);
  readln(y[idx].cod, y[idx].nota1, y[idx].nota2);
  dim := High(y) - Low(y) + 1;
  writeln(y[idx].cod, ' ', y[idx].nota1:0:2, ' ', y[idx].nota2:0:2, ' ', dim);
end.
`,
    },
    solutions: {
      cpp: `struct elev {
    int cod;
    double nota1, nota2;
} y[30];
`,
      c: `struct elev {
    int cod;
    double nota1, nota2;
} y[30];
`,
      pascal: `type
  elev = record
    cod: longint;
    nota1, nota2: real;
  end;
var
  y: array[0..29] of elev;
`,
    },
    tests: ["0 123 9.50 10.00", "0 1 5 6.5", "29 999 7.25 8.75"],
    time_limit_ms: 1000,
  },
  // ===================== v12 =====================
  {
    slug: "bac-antrenament-2021-v12-2-3",
    subcategoryId: "antrenament-2021-v12",
    title: "Antrenament 2021 V12, S2.3 - Consoane si stea in locul vocalelor O, A, U",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "antrenament", "subiectul2", "siruri-caractere"],
    statement:
      "Variabila i este de tip intreg, iar variabila s permite memorarea unui sir cu cel mult 50 de caractere, numai litere mari ale alfabetului englez. Scrieti secventa de mai jos inlocuind punctele de suspensie astfel incat, in urma executarii secventei obtinute, sa se afiseze pe ecran toate consoanele din sir, iar in locul vocalelor din multimea {O,A,U} sa se afiseze simbolul *.\n\n" +
      "Exemplu: daca sirul este CALCULATOARE, se afiseaza C*LC*L*T**RE\n\n" +
      "for(i=0;i<strlen(s);i++)\n  if(.............) cout<<...;\n  else cout<<...;",
    input_format: "Se citeste sirul s.",
    output_format: "Sirul rezultat, cu O, A, U inlocuite prin *.",
    constraints: "Cel mult 50 de caractere, numai litere mari.",
    hints: "Verificati daca litera curenta este una dintre O, A, U (de exemplu cu strchr).",
    explanation: "Se parcurge sirul; caracterele O, A sau U se inlocuiesc cu *, restul se afiseaza neschimbate.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
#include <cstring>
using namespace std;
char s[55];
int i;
int main() {
    cin >> s;
    for (i = 0; i < (int)strlen(s); i++)
        __USER_CODE__
    cout << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
#include <string.h>
char s[55];
int i;
int main() {
    scanf("%s", s);
    for (i = 0; i < (int)strlen(s); i++)
        __USER_CODE__
    printf("\\n");
    return 0;
}
`,
      pascal: `program solution;
var
  s: string;
  i: integer;
begin
  readln(s);
  for i := 1 to length(s) do
    __USER_CODE__
  writeln;
end.
`,
      python: `s = input().strip()
out = []
i = 0
for i in range(len(s)):
        __USER_CODE__
print(''.join(out))
`,
    },
    solutions: {
      cpp: `if (strchr("OAU", s[i]) != NULL) cout << '*'; else cout << s[i];
`,
      c: `if (strchr("OAU", s[i]) != NULL) printf("*"); else printf("%c", s[i]);
`,
      pascal: `if pos(s[i], 'OAU') > 0 then write('*') else write(s[i]);
`,
      python: `out.append('*' if s[i] in 'OAU' else s[i])
`,
    },
    tests: ["CALCULATOARE", "BCDFG", "OAUOAU"],
    time_limit_ms: 1000,
  },
];

runMain(problems, LEVEL, CHAPTER, SRC).catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
