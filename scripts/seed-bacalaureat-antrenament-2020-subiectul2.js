const { runMain, buildDimChecker } = require("./lib/bac-subiectul2-runner");

const LEVEL = "bacalaureat";
const CHAPTER = { id: "bacalaureat-2020", name: "Bacalaureat 2020" };
const SRC = "Bacalaureat Informatica MI - Antrenament 2020 (Ministerul Educatiei) - Subiectul II";

const IO_STDIN = { input_source: "stdin", output_target: "stdout", input_filename: null, output_filename: null };

const problems = [
  // ===================== v1 =====================
  {
    slug: "bac-antrenament-2020-v1-2-2",
    subcategoryId: "antrenament-2020-v1",
    title: "Antrenament 2020 V1, S2.2 - Structura triunghi",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "structuri"],
    statement:
      "Variabila t memoreaza coordonatele reale (abscisa si ordonata), in planul xOy, ale fiecaruia dintre cele trei varfuri A, B si C ale unui triunghi.\n\n" +
      "Scrieti definitia unei structuri cu eticheta triunghi, care permite memorarea datelor precizate, si declarati corespunzator variabila t.\n\n" +
      "Codul de verificare va folosi expresiile t.A.x, t.B.y si t.C.y.",
    input_format: "Se citesc A.x, A.y, B.x, B.y, C.x, C.y.",
    output_format: "Se afiseaza t.A.x, t.B.y si t.C.y (2 zecimale), separate prin spatiu.",
    constraints: "-",
    hints: "Structura triunghi are 3 campuri de tip punct (A, B, C), fiecare cu x si y reali.",
    explanation: "Structura triunghi contine 3 campuri punct, fiecare cu x si y reali.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    cin >> t.A.x >> t.A.y >> t.B.x >> t.B.y >> t.C.x >> t.C.y;
    printf("%.2f %.2f %.2f\\n", t.A.x, t.B.y, t.C.y);
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    scanf("%lf %lf %lf %lf %lf %lf", &t.A.x, &t.A.y, &t.B.x, &t.B.y, &t.C.x, &t.C.y);
    printf("%.2f %.2f %.2f\\n", t.A.x, t.B.y, t.C.y);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
begin
  readln(t.A.x, t.A.y, t.B.x, t.B.y, t.C.x, t.C.y);
  writeln(t.A.x:0:2, ' ', t.B.y:0:2, ' ', t.C.y:0:2);
end.
`,
    },
    solutions: {
      cpp: `struct punct { double x, y; };
struct triunghi {
    punct A, B, C;
} t;
`,
      c: `struct punct { double x, y; };
struct triunghi {
    struct punct A, B, C;
} t;
`,
      pascal: `type
  punct = record
    x, y: real;
  end;
  triunghi = record
    A, B, C: punct;
  end;
var
  t: triunghi;
`,
    },
    tests: ["0 0 4 0 0 3", "1 1 2 2 3 3", "-1 -2 5 6 0 0", "1234567.89 -7654321.12 999999.99 -123456.78 654321.11 -987654.32"],
    time_limit_ms: 1000,
  },
  // ===================== v2 =====================
  {
    slug: "bac-antrenament-2020-v2-2-2",
    subcategoryId: "antrenament-2020-v2",
    title: "Antrenament 2020 V2, S2.2 - Structura specie",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "structuri"],
    statement:
      "Variabila s memoreaza simultan urmatoarele date despre fiecare dintre cele 20 de specii de animale dintr-o rezervatie: un cod, numarul de exemplare din specia respectiva si varstele acestora (maximum 10 exemplare per specie).\n\n" +
      "Scrieti definitia unei structuri cu eticheta specie, care permite memorarea datelor despre o specie, si declarati corespunzator variabila s.\n\n" +
      "Codul de verificare va folosi expresiile s[0].cod, s[0].nrExemplare si s[0].varsta[3].",
    input_format: "Se citesc outerIdx, innerIdx, cod, nrExemplare si varsta[innerIdx] pentru s[outerIdx].",
    output_format: "Se afiseaza s[outerIdx].cod, s[outerIdx].nrExemplare, s[outerIdx].varsta[innerIdx], numarul de elemente ale tabloului s si numarul de elemente ale tabloului varsta, separate prin spatiu.",
    constraints: "-",
    hints: "varsta este un tablou de exact 10 intregi. Nu uitati ca s trebuie sa aiba exact 20 de elemente (outerIdx poate fi si 19, innerIdx poate fi si 9).",
    explanation: "Structura specie: cod (int), nrExemplare (int), varsta (tablou de 10 intregi). Verificarea foloseste indici variabili pe ambele tablouri, inclusiv ultimele pozitii valide, in toate combinatiile.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    checkerCode: buildDimChecker([20, 10]),
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int outerIdx, innerIdx;
    cin >> outerIdx >> innerIdx;
    cin >> s[outerIdx].cod >> s[outerIdx].nrExemplare >> s[outerIdx].varsta[innerIdx];
    int dimS = sizeof(s) / sizeof(s[0]);
    int dimV = sizeof(s[0].varsta) / sizeof(s[0].varsta[0]);
    cout << s[outerIdx].cod << " " << s[outerIdx].nrExemplare << " " << s[outerIdx].varsta[innerIdx] << " " << dimS << " " << dimV << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    int outerIdx, innerIdx;
    scanf("%d %d", &outerIdx, &innerIdx);
    scanf("%d %d %d", &s[outerIdx].cod, &s[outerIdx].nrExemplare, &s[outerIdx].varsta[innerIdx]);
    int dimS = (int)(sizeof(s) / sizeof(s[0]));
    int dimV = (int)(sizeof(s[0].varsta) / sizeof(s[0].varsta[0]));
    printf("%d %d %d %d %d\\n", s[outerIdx].cod, s[outerIdx].nrExemplare, s[outerIdx].varsta[innerIdx], dimS, dimV);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
var outerIdx, innerIdx, dimS, dimV: integer;
begin
  read(outerIdx, innerIdx);
  read(s[outerIdx].cod, s[outerIdx].nrExemplare, s[outerIdx].varsta[innerIdx]);
  dimS := High(s) - Low(s) + 1;
  dimV := High(s[0].varsta) - Low(s[0].varsta) + 1;
  writeln(s[outerIdx].cod, ' ', s[outerIdx].nrExemplare, ' ', s[outerIdx].varsta[innerIdx], ' ', dimS, ' ', dimV);
end.
`,
    },
    solutions: {
      cpp: `struct specie {
    int cod;
    int nrExemplare;
    int varsta[10];
} s[20];
`,
      c: `struct specie {
    int cod;
    int nrExemplare;
    int varsta[10];
} s[20];
`,
      pascal: `type
  specie = record
    cod, nrExemplare: longint;
    varsta: array[0..9] of longint;
  end;
var
  s: array[0..19] of specie;
`,
    },
    tests: [
      "0 0 5 8 4",
      "0 0 1 3 10",
      "0 9 9 10 55",
      "19 0 20 30 1",
      "19 9 99 100 100",
    ],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-antrenament-2020-v2-2-3",
    subcategoryId: "antrenament-2020-v2",
    title: "Antrenament 2020 V2, S2.3 - Tablou cu suma vecinilor",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "tablouri-bidimensionale"],
    statement:
      "Variabilele i si j sunt de tip intreg, iar variabila a memoreaza un tablou bidimensional cu 5 linii si 7 coloane, numerotate incepand de la 0, cu elemente numere intregi, initial toate egale cu 1.\n\n" +
      "Fara a utiliza alte variabile decat cele mentionate, scrieti o secventa de instructiuni prin care se transforma in memorie tabloul, astfel incat orice element aflat pe prima linie sau pe prima coloana sa aiba valoarea 1, si oricare alt element din tablou sa fie egal cu ultima cifra a sumei celor doua elemente alaturate lui, aflate pe aceeasi linie dar pe coloana din stanga, respectiv pe aceeasi coloana, dar pe linia anterioara.",
    input_format: "Fara date de intrare.",
    output_format: "Cele 5 linii ale tabloului a, elementele separate prin cate un spatiu.",
    constraints: "Dimensiune fixa 5x7.",
    hints: "Parcurgeti in ordinea liniilor (i crescator) si coloanelor (j crescator): a[i][j] = (a[i][j-1]+a[i-1][j]) % 10 pentru i>0 si j>0.",
    explanation: "Se parcurge tabloul in ordine de sus in jos si de la stanga la dreapta; fiecare element interior depinde doar de vecinii deja calculati (stanga si sus).",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int a[5][7];
    int i, j;
    for (i = 0; i < 5; i++) for (j = 0; j < 7; j++) a[i][j] = 1;
    __USER_CODE__
    for (i = 0; i < 5; i++) {
        for (j = 0; j < 7; j++) cout << a[i][j] << (j < 6 ? " " : "");
        cout << "\\n";
    }
    return 0;
}
`,
      c: `#include <stdio.h>
int main() {
    int a[5][7];
    int i, j;
    for (i = 0; i < 5; i++) for (j = 0; j < 7; j++) a[i][j] = 1;
    __USER_CODE__
    for (i = 0; i < 5; i++) {
        for (j = 0; j < 7; j++) printf("%d%s", a[i][j], j < 6 ? " " : "");
        printf("\\n");
    }
    return 0;
}
`,
      pascal: `program solution;
var
  a: array[0..4,0..6] of integer;
  i, j: integer;
begin
  for i := 0 to 4 do for j := 0 to 6 do a[i,j] := 1;
  __USER_CODE__
  for i := 0 to 4 do begin
    for j := 0 to 6 do begin
      write(a[i,j]);
      if j < 6 then write(' ');
    end;
    writeln;
  end;
end.
`,
      python: `a = [[1]*7 for _ in range(5)]
i = j = 0
__USER_CODE__
for row in a:
    print(' '.join(map(str, row)))
`,
    },
    solutions: {
      cpp: `for (i = 1; i < 5; i++)
    for (j = 1; j < 7; j++)
        a[i][j] = (a[i][j-1] + a[i-1][j]) % 10;
`,
      c: `for (i = 1; i < 5; i++)
    for (j = 1; j < 7; j++)
        a[i][j] = (a[i][j-1] + a[i-1][j]) % 10;
`,
      pascal: `for i := 1 to 4 do
  for j := 1 to 6 do
    a[i,j] := (a[i,j-1] + a[i-1,j]) mod 10;
`,
      python: `for i in range(1, 5):
        for j in range(1, 7):
            a[i][j] = (a[i][j-1] + a[i-1][j]) % 10
`,
    },
    tests: [""],
    time_limit_ms: 1000,
  },
  // ===================== v3 =====================
  {
    slug: "bac-antrenament-2020-v3-2-2",
    subcategoryId: "antrenament-2020-v3",
    title: "Antrenament 2020 V3, S2.2 - Structura cerc",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "structuri"],
    statement:
      "Variabila fig memoreaza date specifice unui cerc: coordonatele reale (abscisa si ordonata), in planul xOy, ale centrului cercului, precum si lungimea razei acestuia.\n\n" +
      "Scrieti definitia unei structuri cu eticheta cerc, care permite memorarea datelor precizate, si declarati corespunzator variabila fig.\n\n" +
      "Codul de verificare va folosi expresiile fig.centru.x, fig.centru.y si fig.raza.",
    input_format: "Se citesc x, y si raza.",
    output_format: "Se afiseaza fig.centru.x, fig.centru.y si fig.raza (2 zecimale), separate prin spatiu.",
    constraints: "-",
    hints: "Structura imbricata: centru are campurile x si y.",
    explanation: "Structura cerc: centru (structura cu x, y reali) si raza (real).",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    cin >> fig.centru.x >> fig.centru.y >> fig.raza;
    printf("%.2f %.2f %.2f\\n", fig.centru.x, fig.centru.y, fig.raza);
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    scanf("%lf %lf %lf", &fig.centru.x, &fig.centru.y, &fig.raza);
    printf("%.2f %.2f %.2f\\n", fig.centru.x, fig.centru.y, fig.raza);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
begin
  readln(fig.centru.x, fig.centru.y, fig.raza);
  writeln(fig.centru.x:0:2, ' ', fig.centru.y:0:2, ' ', fig.raza:0:2);
end.
`,
    },
    solutions: {
      cpp: `struct punct { double x, y; };
struct cerc {
    punct centru;
    double raza;
} fig;
`,
      c: `struct punct { double x, y; };
struct cerc {
    struct punct centru;
    double raza;
} fig;
`,
      pascal: `type
  punct = record
    x, y: real;
  end;
  cerc = record
    centru: punct;
    raza: real;
  end;
var
  fig: cerc;
`,
    },
    tests: ["3 4 5", "0 0 1", "-2 2.5 7", "1234567.89 -7654321.12 999999.99"],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-antrenament-2020-v3-2-3",
    subcategoryId: "antrenament-2020-v3",
    title: "Antrenament 2020 V3, S2.3 - Eliminare A langa I",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "siruri-caractere"],
    statement:
      "Variabila p este de tip intreg, iar variabila s memoreaza un sir de cel mult 20 de caractere, numai litere mari ale alfabetului englez. Fara a utiliza alte variabile, scrieti o secventa de instructiuni in urma executarii careia sa se afiseze pe ecran toate literele sirului memorat de variabila s, cu exceptia vocalei A, daca in sirul initial aceasta este alaturi de vocala I. Literele se afiseaza in ordinea aparitiei lor in sir.\n\n" +
      "Exemplu: daca sirul memorat in variabila s este ALIANTA sau ALAINTA se va afisa ALINTA.",
    input_format: "Se citeste sirul s.",
    output_format: "Sirul rezultat.",
    constraints: "Cel mult 20 de caractere, doar litere mari.",
    hints: "Un caracter 'A' de pe pozitia p se elimina doar daca vecinul din stanga sau din dreapta este 'I'.",
    explanation: "Se parcurge sirul; fiecare 'A' adiacent cu 'I' (stanga sau dreapta) este omis din afisare, restul caracterelor se afiseaza normal.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
#include <cstring>
using namespace std;
char s[25];
int p;
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
int p;
int main() {
    scanf("%s", s);
    __USER_CODE__
    printf("\\n");
    return 0;
}
`,
      pascal: `program solution;
var
  s: string;
  p: integer;
begin
  readln(s);
  __USER_CODE__
  writeln;
end.
`,
      python: `s = input().strip()
p = 0
out = []
__USER_CODE__
print(''.join(out))
`,
    },
    solutions: {
      cpp: `for (p = 0; p < (int)strlen(s); p++) {
    if (s[p] == 'A') {
        bool adj = (p > 0 && s[p-1] == 'I') || (p + 1 < (int)strlen(s) && s[p+1] == 'I');
        if (!adj) cout << s[p];
    } else cout << s[p];
}
`,
      c: `for (p = 0; p < (int)strlen(s); p++) {
    if (s[p] == 'A') {
        int adj = (p > 0 && s[p-1] == 'I') || (p + 1 < (int)strlen(s) && s[p+1] == 'I');
        if (!adj) printf("%c", s[p]);
    } else printf("%c", s[p]);
}
`,
      pascal: `for p := 1 to length(s) do begin
  if s[p] = 'A' then begin
    if not(((p > 1) and (s[p-1] = 'I')) or ((p < length(s)) and (s[p+1] = 'I'))) then
      write(s[p]);
  end else write(s[p]);
end;
`,
      python: `for p in range(len(s)):
        if s[p] == 'A':
            adj = (p > 0 and s[p-1] == 'I') or (p + 1 < len(s) and s[p+1] == 'I')
            if not adj:
                out.append(s[p])
        else:
            out.append(s[p])
`,
    },
    tests: ["ALIANTA", "ALAINTA", "BINAR"],
    time_limit_ms: 1000,
  },
  // ===================== v4 =====================
  {
    slug: "bac-antrenament-2020-v4-2-2",
    subcategoryId: "antrenament-2020-v4",
    title: "Antrenament 2020 V4, S2.2 - Structura poliedru",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "structuri"],
    statement:
      "Variabila p memoreaza date despre un poliedru regulat: numarul de varfuri, lungimea muchiei si doua unghiuri specifice (dintre o fata si o muchie, respectiv dintre doua fete).\n\n" +
      "Scrieti definitia unei structuri cu eticheta poliedru, care permite memorarea datelor precizate, si declarati corespunzator variabila p.\n\n" +
      "Codul de verificare va folosi expresiile p.NrVarfuri, p.Muchie, p.Unghi.FataMuchie si p.Unghi.FataFata.",
    input_format: "Se citesc NrVarfuri, Muchie, Unghi.FataMuchie si Unghi.FataFata.",
    output_format: "Se afiseaza cele 4 valori, separate prin spatiu (cele reale cu 2 zecimale).",
    constraints: "-",
    hints: "Unghi este un camp de tip structura, cu FataMuchie si FataFata.",
    explanation: "Structura poliedru: NrVarfuri (int), Muchie (real), Unghi (structura cu FataMuchie si FataFata, reale).",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    cin >> p.NrVarfuri >> p.Muchie >> p.Unghi.FataMuchie >> p.Unghi.FataFata;
    printf("%d %.2f %.2f %.2f\\n", p.NrVarfuri, p.Muchie, p.Unghi.FataMuchie, p.Unghi.FataFata);
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    scanf("%d %lf %lf %lf", &p.NrVarfuri, &p.Muchie, &p.Unghi.FataMuchie, &p.Unghi.FataFata);
    printf("%d %.2f %.2f %.2f\\n", p.NrVarfuri, p.Muchie, p.Unghi.FataMuchie, p.Unghi.FataFata);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
begin
  readln(p.NrVarfuri, p.Muchie, p.Unghi.FataMuchie, p.Unghi.FataFata);
  writeln(p.NrVarfuri, ' ', p.Muchie:0:2, ' ', p.Unghi.FataMuchie:0:2, ' ', p.Unghi.FataFata:0:2);
end.
`,
    },
    solutions: {
      cpp: `struct unghiuri { double FataMuchie, FataFata; };
struct poliedru {
    int NrVarfuri;
    double Muchie;
    unghiuri Unghi;
} p;
`,
      c: `struct unghiuri { double FataMuchie, FataFata; };
struct poliedru {
    int NrVarfuri;
    double Muchie;
    struct unghiuri Unghi;
} p;
`,
      pascal: `type
  unghiuri = record
    FataMuchie, FataFata: real;
  end;
  poliedru = record
    NrVarfuri: longint;
    Muchie: real;
    Unghi: unghiuri;
  end;
var
  p: poliedru;
`,
    },
    tests: ["4 1.5 70.53 60.00", "8 2 90 90", "20 3.25 138.19 116.57", "2000000000 1234567.89 999999.99 -654321.12"],
    time_limit_ms: 1000,
  },
  // ===================== v5 =====================
  {
    slug: "bac-antrenament-2020-v5-2-2",
    subcategoryId: "antrenament-2020-v5",
    title: "Antrenament 2020 V5, S2.2 - Structura ecuatie",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "structuri"],
    statement:
      "Variabila s memoreaza simultan numarul de solutii complexe ale unei ecuatii si solutiile propriu-zise (partea reala si partea imaginara, numere reale).\n\n" +
      "Scrieti definitia unei structuri cu eticheta ecuatie, care permite memorarea datelor despre solutiile unei ecuatii, si declarati corespunzator variabila s.\n\n" +
      "Codul de verificare va folosi expresiile s.numar, s.solutie[0].pre si s.solutie[0].pim. Numarul de solutii este un numar natural din intervalul [2,102), deci tabloul solutie trebuie sa aiba cel putin 101 elemente.",
    input_format: "Se citesc numar, un indice idx, apoi pre si pim pentru s.solutie[idx].",
    output_format: "Se afiseaza s.numar, s.solutie[idx].pre, s.solutie[idx].pim (2 zecimale) si numarul de elemente ale tabloului solutie, separate prin spatiu.",
    constraints: "numarul de solutii este in intervalul [2,102)",
    hints: "solutie este un tablou de structuri cu campurile pre si pim, cu cel putin 101 elemente (idx poate fi si 100).",
    explanation: "Structura ecuatie: numar (int) si solutie (tablou de structuri cu pre, pim reali, minim 101 elemente pentru a acoperi intervalul [2,102)). Verificarea foloseste un indice variabil, inclusiv ultima pozitie valida.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    checkerCode: buildDimChecker([101]),
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int idx;
    cin >> s.numar >> idx;
    cin >> s.solutie[idx].pre >> s.solutie[idx].pim;
    int dim = sizeof(s.solutie) / sizeof(s.solutie[0]);
    printf("%d %.2f %.2f %d\\n", s.numar, s.solutie[idx].pre, s.solutie[idx].pim, dim);
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    int idx;
    scanf("%d %d", &s.numar, &idx);
    scanf("%lf %lf", &s.solutie[idx].pre, &s.solutie[idx].pim);
    int dim = (int)(sizeof(s.solutie) / sizeof(s.solutie[0]));
    printf("%d %.2f %.2f %d\\n", s.numar, s.solutie[idx].pre, s.solutie[idx].pim, dim);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
var idx, dim: integer;
begin
  readln(s.numar, idx);
  readln(s.solutie[idx].pre, s.solutie[idx].pim);
  dim := High(s.solutie) - Low(s.solutie) + 1;
  writeln(s.numar, ' ', s.solutie[idx].pre:0:2, ' ', s.solutie[idx].pim:0:2, ' ', dim);
end.
`,
    },
    solutions: {
      cpp: `struct solutieTip { double pre, pim; };
struct ecuatie {
    int numar;
    solutieTip solutie[101];
} s;
`,
      c: `struct solutieTip { double pre, pim; };
struct ecuatie {
    int numar;
    struct solutieTip solutie[101];
} s;
`,
      pascal: `type
  solutieTip = record
    pre, pim: real;
  end;
  ecuatie = record
    numar: longint;
    solutie: array[0..100] of solutieTip;
  end;
var
  s: ecuatie;
`,
    },
    tests: ["2 0\n1 2", "5 0\n0 -5", "99 100\n-3 -4", "2 0\n200000000 1"],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-antrenament-2020-v5-2-3",
    subcategoryId: "antrenament-2020-v5",
    title: "Antrenament 2020 V5, S2.3 - Tablou de paranteze",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "tablouri-bidimensionale"],
    statement:
      "Variabilele i si j sunt de tip intreg, iar variabila a memoreaza un tablou bidimensional cu 6 linii si 6 coloane, numerotate de la 0 la 5, avand initial toate elementele egale cu caracterul @.\n\n" +
      "Fara a utiliza alte variabile, scrieti secventa de instructiuni de mai jos, inlocuind punctele de suspensie, astfel incat, in urma executarii secventei obtinute, variabila a sa memoreze tabloul:\n\n" +
      "( ( ( ) ) )\n* ( ( ) ) *\n* * ( ) * *\n* * ( ) * *\n* ( ( ) ) *\n( ( ( ) ) )\n\n" +
      "for(i=0;i<6;i++)\n  for(j=0;j<6;j++)\n    ..................",
    input_format: "Fara date de intrare.",
    output_format: "Cele 6 linii ale tabloului a, elementele separate prin cate un spatiu.",
    constraints: "Dimensiune fixa 6x6.",
    hints: "r = min(i,5-i); pentru coloana j: daca j<r sau j>5-r => '*'; daca j<3 => '('; altfel => ')'.",
    explanation: "Se calculeaza distanta r fata de marginea (sus/jos) mai apropiata; zona exterioara e '*', iar restul e '(' pentru jumatatea stanga si ')' pentru cea dreapta.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    char a[6][6];
    int i, j;
    for (i = 0; i < 6; i++)
        for (j = 0; j < 6; j++)
            __USER_CODE__
    for (i = 0; i < 6; i++) {
        for (j = 0; j < 6; j++) cout << a[i][j] << (j < 5 ? " " : "");
        cout << "\\n";
    }
    return 0;
}
`,
      c: `#include <stdio.h>
int main() {
    char a[6][6];
    int i, j;
    for (i = 0; i < 6; i++)
        for (j = 0; j < 6; j++)
            __USER_CODE__
    for (i = 0; i < 6; i++) {
        for (j = 0; j < 6; j++) printf("%c%s", a[i][j], j < 5 ? " " : "");
        printf("\\n");
    }
    return 0;
}
`,
      pascal: `program solution;
var
  a: array[0..5,0..5] of char;
  i, j, r: integer;
begin
  for i := 0 to 5 do
    for j := 0 to 5 do
      __USER_CODE__
  for i := 0 to 5 do begin
    for j := 0 to 5 do begin
      write(a[i,j]);
      if j < 5 then write(' ');
    end;
    writeln;
  end;
end.
`,
      python: `a = [[None]*6 for _ in range(6)]
for i in range(6):
    for j in range(6):
        __USER_CODE__
for i in range(6):
    print(' '.join(a[i]))
`,
    },
    solutions: {
      cpp: `{
    int r = min(i, 5 - i);
    if (j < r || j > 5 - r) a[i][j] = '*';
    else if (j < 3) a[i][j] = '('; else a[i][j] = ')';
}
`,
      c: `{
    int r = (i < 5 - i) ? i : 5 - i;
    if (j < r || j > 5 - r) a[i][j] = '*';
    else if (j < 3) a[i][j] = '('; else a[i][j] = ')';
}
`,
      pascal: `begin
  if i < 5 - i then r := i else r := 5 - i;
  if (j < r) or (j > 5 - r) then a[i,j] := '*'
  else if j < 3 then a[i,j] := '(' else a[i,j] := ')';
end;
`,
      python: `r = min(i, 5 - i)
        if j < r or j > 5 - r:
            a[i][j] = '*'
        elif j < 3:
            a[i][j] = '('
        else:
            a[i][j] = ')'
`,
    },
    tests: [""],
    time_limit_ms: 1000,
  },
  // ===================== v6 =====================
  {
    slug: "bac-antrenament-2020-v6-2-3",
    subcategoryId: "antrenament-2020-v6",
    title: "Antrenament 2020 V6, S2.3 - Tablou 4x5 in ordine inversa",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "tablouri-bidimensionale"],
    statement:
      "Variabilele i si j sunt de tip intreg, iar variabila a memoreaza un tablou bidimensional cu 4 linii si 5 coloane, numerotate incepand de la 0, cu elemente numere intregi, initial toate nule.\n\n" +
      "Fara a utiliza alte variabile decat cele mentionate, scrieti o secventa de instructiuni astfel incat, in urma executarii acesteia, variabila a sa memoreze tabloul:\n\n" +
      "16 17 18 19 20\n11 12 13 14 15\n6 7 8 9 10\n1 2 3 4 5",
    input_format: "Fara date de intrare.",
    output_format: "Cele 4 linii ale tabloului a, elementele separate prin cate un spatiu.",
    constraints: "Dimensiune fixa 4x5.",
    hints: "a[i][j] = (3-i)*5 + j + 1.",
    explanation: "Liniile sunt numerotate invers (ultima linie contine cele mai mici valori); formula (3-i)*5+j+1 genereaza direct tabloul.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int a[4][5];
    int i, j;
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
      python: `a = [[0]*5 for _ in range(4)]
i = j = 0
__USER_CODE__
for row in a:
    print(' '.join(map(str, row)))
`,
    },
    solutions: {
      cpp: `for (i = 0; i < 4; i++)
    for (j = 0; j < 5; j++)
        a[i][j] = (3 - i) * 5 + j + 1;
`,
      c: `for (i = 0; i < 4; i++)
    for (j = 0; j < 5; j++)
        a[i][j] = (3 - i) * 5 + j + 1;
`,
      pascal: `for i := 0 to 3 do
  for j := 0 to 4 do
    a[i,j] := (3 - i) * 5 + j + 1;
`,
      python: `for i in range(4):
        for j in range(5):
            a[i][j] = (3 - i) * 5 + j + 1
`,
    },
    tests: [""],
    time_limit_ms: 1000,
  },
  // ===================== v7 =====================
  {
    slug: "bac-antrenament-2020-v7-2-2",
    subcategoryId: "antrenament-2020-v7",
    title: "Antrenament 2020 V7, S2.2 - Structura biblio",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "structuri"],
    statement:
      "Variabila c memoreaza simultan numarul de carti dintr-o biblioteca (numar natural din intervalul [3,102)) si date despre fiecare carte (titlu si autor, siruri de cel mult 20 de caractere).\n\n" +
      "Scrieti definitia unei structuri cu eticheta biblio, care permite memorarea datelor despre o biblioteca, si declarati corespunzator variabila c.\n\n" +
      "Codul de verificare va folosi expresiile c.numar, c.carte[2].titlu si c.carte[2].autor.",
    input_format: "Se citesc numar si un indice idx (linie), apoi pentru cartea de indice idx: titlu (linie), autor (linie).",
    output_format: "Se afiseaza c.numar, c.carte[idx].titlu, c.carte[idx].autor si numarul de elemente ale tabloului carte, separate prin spatiu.",
    constraints: "numarul de carti este in intervalul [3,102)",
    hints: "carte este un tablou de structuri cu campurile titlu si autor, cu cel putin 101 elemente (idx poate fi si 100).",
    explanation: "Structura biblio: numar (int) si carte (tablou de structuri cu titlu, autor siruri, minim 101 elemente pentru a acoperi intervalul [3,102)). Verificarea foloseste un indice variabil, inclusiv ultima pozitie valida.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    checkerCode: buildDimChecker([101]),
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int idx;
    cin >> c.numar >> idx >> c.carte[idx].titlu >> c.carte[idx].autor;
    int dim = sizeof(c.carte) / sizeof(c.carte[0]);
    cout << c.numar << " " << c.carte[idx].titlu << " " << c.carte[idx].autor << " " << dim << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    int idx;
    scanf("%d %d", &c.numar, &idx);
    scanf("%s %s", c.carte[idx].titlu, c.carte[idx].autor);
    int dim = (int)(sizeof(c.carte) / sizeof(c.carte[0]));
    printf("%d %s %s %d\\n", c.numar, c.carte[idx].titlu, c.carte[idx].autor, dim);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
var idx, dim: longint;
begin
  readln(c.numar, idx);
  readln(c.carte[idx].titlu);
  readln(c.carte[idx].autor);
  dim := High(c.carte) - Low(c.carte) + 1;
  writeln(c.numar, ' ', c.carte[idx].titlu, ' ', c.carte[idx].autor, ' ', dim);
end.
`,
    },
    solutions: {
      cpp: `struct carteTip { char titlu[21]; char autor[21]; };
struct biblio {
    int numar;
    carteTip carte[101];
} c;
`,
      c: `struct carteTip { char titlu[21]; char autor[21]; };
struct biblio {
    int numar;
    struct carteTip carte[101];
} c;
`,
      pascal: `type
  carteTip = record
    titlu, autor: string;
  end;
  biblio = record
    numar: longint;
    carte: array[0..100] of carteTip;
  end;
var
  c: biblio;
`,
    },
    tests: ["50 0\nIonPacat\nCamilPetrescu", "10 0\nEnigmaOtiliei\nGCalinescu", "99 100\nMaitreyi\nMEliade"],
    time_limit_ms: 1000,
  },
  // ===================== v10 =====================
  {
    slug: "bac-antrenament-2020-v10-2-2",
    subcategoryId: "antrenament-2020-v10",
    title: "Antrenament 2020 V10, S2.2 - Structura spectacol",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "structuri"],
    statement:
      "Variabila s memoreaza simultan urmatoarele date despre fiecare dintre cele 20 de spectacole dintr-o stagiune: un cod, numarul de actori si varstele acestora (maximum 10 actori per spectacol).\n\n" +
      "Scrieti definitia unei structuri cu eticheta spectacol, care permite memorarea datelor despre un spectacol, si declarati corespunzator variabila s.\n\n" +
      "Codul de verificare va folosi expresiile s[0].cod, s[0].nrActori si s[0].varsta[4].",
    input_format: "Se citesc outerIdx, innerIdx, cod, nrActori si varsta[innerIdx] pentru s[outerIdx].",
    output_format: "Se afiseaza s[outerIdx].cod, s[outerIdx].nrActori, s[outerIdx].varsta[innerIdx], numarul de elemente ale tabloului s si numarul de elemente ale tabloului varsta, separate prin spatiu.",
    constraints: "-",
    hints: "varsta este un tablou de exact 10 intregi. Nu uitati ca s trebuie sa aiba exact 20 de elemente (outerIdx poate fi si 19, innerIdx poate fi si 9).",
    explanation: "Structura spectacol: cod (int), nrActori (int), varsta (tablou de 10 intregi). Verificarea foloseste indici variabili pe ambele tablouri, inclusiv ultimele pozitii valide, in toate combinatiile.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    checkerCode: buildDimChecker([20, 10]),
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int outerIdx, innerIdx;
    cin >> outerIdx >> innerIdx;
    cin >> s[outerIdx].cod >> s[outerIdx].nrActori >> s[outerIdx].varsta[innerIdx];
    int dimS = sizeof(s) / sizeof(s[0]);
    int dimV = sizeof(s[0].varsta) / sizeof(s[0].varsta[0]);
    cout << s[outerIdx].cod << " " << s[outerIdx].nrActori << " " << s[outerIdx].varsta[innerIdx] << " " << dimS << " " << dimV << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    int outerIdx, innerIdx;
    scanf("%d %d", &outerIdx, &innerIdx);
    scanf("%d %d %d", &s[outerIdx].cod, &s[outerIdx].nrActori, &s[outerIdx].varsta[innerIdx]);
    int dimS = (int)(sizeof(s) / sizeof(s[0]));
    int dimV = (int)(sizeof(s[0].varsta) / sizeof(s[0].varsta[0]));
    printf("%d %d %d %d %d\\n", s[outerIdx].cod, s[outerIdx].nrActori, s[outerIdx].varsta[innerIdx], dimS, dimV);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
var outerIdx, innerIdx, dimS, dimV: integer;
begin
  read(outerIdx, innerIdx);
  read(s[outerIdx].cod, s[outerIdx].nrActori, s[outerIdx].varsta[innerIdx]);
  dimS := High(s) - Low(s) + 1;
  dimV := High(s[0].varsta) - Low(s[0].varsta) + 1;
  writeln(s[outerIdx].cod, ' ', s[outerIdx].nrActori, ' ', s[outerIdx].varsta[innerIdx], ' ', dimS, ' ', dimV);
end.
`,
    },
    solutions: {
      cpp: `struct spectacol {
    int cod;
    int nrActori;
    int varsta[10];
} s[20];
`,
      c: `struct spectacol {
    int cod;
    int nrActori;
    int varsta[10];
} s[20];
`,
      pascal: `type
  spectacol = record
    cod, nrActori: longint;
    varsta: array[0..9] of longint;
  end;
var
  s: array[0..19] of spectacol;
`,
    },
    tests: [
      "0 0 7 5 20",
      "0 0 1 10 18",
      "0 9 9 1 30",
      "19 0 20 20 25",
      "19 9 99 10 40",
    ],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-antrenament-2020-v10-2-3",
    subcategoryId: "antrenament-2020-v10",
    title: "Antrenament 2020 V10, S2.3 - Tablou 4x5 crescator pe linii",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "tablouri-bidimensionale"],
    statement:
      "Variabilele i si j sunt de tip intreg, iar variabila a memoreaza un tablou bidimensional cu 4 linii si 5 coloane, numerotate incepand de la 0, cu elemente numere intregi, initial toate nule.\n\n" +
      "Fara a utiliza alte variabile decat cele mentionate, scrieti o secventa de instructiuni astfel incat, in urma executarii acesteia, variabila a sa memoreze tabloul:\n\n" +
      "5 4 3 2 1\n10 9 8 7 6\n15 14 13 12 11\n20 19 18 17 16",
    input_format: "Fara date de intrare.",
    output_format: "Cele 4 linii ale tabloului a, elementele separate prin cate un spatiu.",
    constraints: "Dimensiune fixa 4x5.",
    hints: "a[i][j] = i*5 + (5-j).",
    explanation: "Formula i*5+(5-j) genereaza direct tabloul, fiecare linie descrescand de la stanga la dreapta.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int a[4][5];
    int i, j;
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
      python: `a = [[0]*5 for _ in range(4)]
i = j = 0
__USER_CODE__
for row in a:
    print(' '.join(map(str, row)))
`,
    },
    solutions: {
      cpp: `for (i = 0; i < 4; i++)
    for (j = 0; j < 5; j++)
        a[i][j] = i * 5 + (5 - j);
`,
      c: `for (i = 0; i < 4; i++)
    for (j = 0; j < 5; j++)
        a[i][j] = i * 5 + (5 - j);
`,
      pascal: `for i := 0 to 3 do
  for j := 0 to 4 do
    a[i,j] := i * 5 + (5 - j);
`,
      python: `for i in range(4):
        for j in range(5):
            a[i][j] = i * 5 + (5 - j)
`,
    },
    tests: [""],
    time_limit_ms: 1000,
  },
  // ===================== v11 =====================
  {
    slug: "bac-antrenament-2020-v11-2-2",
    subcategoryId: "antrenament-2020-v11",
    title: "Antrenament 2020 V11, S2.2 - Structura sera",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "structuri"],
    statement:
      "Variabila s memoreaza date specifice despre o sera: numarul de specii de flori (numar natural din intervalul [3,102)) si date despre fiecare specie (denumire stiintifica si denumire populara, siruri de cel mult 20 de caractere).\n\n" +
      "Scrieti definitia unei structuri cu eticheta sera, care permite memorarea datelor despre o sera, si declarati corespunzator variabila s.\n\n" +
      "Codul de verificare va folosi expresiile s.numar, s.specie[3].denumireStiintifica si s.specie[3].denumirePopulara.",
    input_format: "Se citesc numar si un indice idx (linie), apoi pentru specia de indice idx: denumireStiintifica (linie), denumirePopulara (linie).",
    output_format: "Se afiseaza s.numar, s.specie[idx].denumireStiintifica, s.specie[idx].denumirePopulara si numarul de elemente ale tabloului specie, separate prin spatiu.",
    constraints: "numarul de specii este in intervalul [3,102)",
    hints: "specie este un tablou de structuri cu doua campuri sir, cu cel putin 101 elemente (idx poate fi si 100).",
    explanation: "Structura sera: numar (int) si specie (tablou de structuri cu denumireStiintifica, denumirePopulara siruri, minim 101 elemente pentru a acoperi intervalul [3,102)). Verificarea foloseste un indice variabil, inclusiv ultima pozitie valida.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    checkerCode: buildDimChecker([101]),
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int idx;
    cin >> s.numar >> idx >> s.specie[idx].denumireStiintifica >> s.specie[idx].denumirePopulara;
    int dim = sizeof(s.specie) / sizeof(s.specie[0]);
    cout << s.numar << " " << s.specie[idx].denumireStiintifica << " " << s.specie[idx].denumirePopulara << " " << dim << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    int idx;
    scanf("%d %d", &s.numar, &idx);
    scanf("%s %s", s.specie[idx].denumireStiintifica, s.specie[idx].denumirePopulara);
    int dim = (int)(sizeof(s.specie) / sizeof(s.specie[0]));
    printf("%d %s %s %d\\n", s.numar, s.specie[idx].denumireStiintifica, s.specie[idx].denumirePopulara, dim);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
var idx, dim: longint;
begin
  readln(s.numar, idx);
  readln(s.specie[idx].denumireStiintifica);
  readln(s.specie[idx].denumirePopulara);
  dim := High(s.specie) - Low(s.specie) + 1;
  writeln(s.numar, ' ', s.specie[idx].denumireStiintifica, ' ', s.specie[idx].denumirePopulara, ' ', dim);
end.
`,
    },
    solutions: {
      cpp: `struct specieTip { char denumireStiintifica[21]; char denumirePopulara[21]; };
struct sera {
    int numar;
    specieTip specie[101];
} s;
`,
      c: `struct specieTip { char denumireStiintifica[21]; char denumirePopulara[21]; };
struct sera {
    int numar;
    struct specieTip specie[101];
} s;
`,
      pascal: `type
  specieTip = record
    denumireStiintifica, denumirePopulara: string;
  end;
  sera = record
    numar: longint;
    specie: array[0..100] of specieTip;
  end;
var
  s: sera;
`,
    },
    tests: ["10 0\nRosaCanina\nMaces", "5 0\nTulipaGesneriana\nLalea", "99 100\nHelianthusAnnuus\nFloareaSoarelui"],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-antrenament-2020-v11-2-3",
    subcategoryId: "antrenament-2020-v11",
    title: "Antrenament 2020 V11, S2.3 - Produse pe prefixe ale diagonalei",
    difficulty: "hard",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "tablouri-bidimensionale"],
    statement:
      "Variabilele i si p sunt de tip intreg, iar variabila a memoreaza un tablou bidimensional cu 7 linii si 7 coloane, cu elemente numere intregi din intervalul [0,100].\n\n" +
      "Fara a utiliza alte variabile decat cele mentionate, scrieti o secventa de instructiuni astfel incat, in urma executarii acesteia, sa se afiseze, separate prin cate un spatiu, produsul celor 7 elemente situate pe diagonala principala a tabloului, urmat de produsul elementelor situate simultan pe diagonala principala si pe primele 6 linii ale tabloului, si asa mai departe, astfel incat ultimul numar afisat sa fie elementul situat simultan pe diagonala principala si pe prima linie a tabloului.\n\n" +
      "Exemplu: pentru tabloul cu diagonala principala 1, 7, 3, 4, 5, 2, 2 se afiseaza 1680 840 420 84 21 7 1.",
    input_format: "Se citesc cele 49 de elemente ale tabloului a (7 linii x 7 coloane).",
    output_format: "Cele 7 produse-prefix ale diagonalei, in ordine descrescatoare a lungimii, separate prin spatiu.",
    constraints: "Elemente in [0,100].",
    hints: "Pentru fiecare lungime k de la 7 la 1, calculati produsul primelor k elemente ale diagonalei (a[0][0]*a[1][1]*...*a[k-1][k-1]).",
    explanation: "Se calculeaza, pentru fiecare k de la 7 descrescator la 1, produsul primelor k elemente ale diagonalei principale.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int a[7][7];
    int i, p;
    for (int r = 0; r < 7; r++) for (int c = 0; c < 7; c++) cin >> a[r][c];
    __USER_CODE__
    cout << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
int main() {
    int a[7][7];
    int i, p;
    for (int r = 0; r < 7; r++) for (int c = 0; c < 7; c++) scanf("%d", &a[r][c]);
    __USER_CODE__
    printf("\\n");
    return 0;
}
`,
      pascal: `program solution;
var
  a: array[0..6,0..6] of integer;
  i, p, r, c, k: integer;
begin
  for r := 0 to 6 do
    for c := 0 to 6 do
      read(a[r,c]);
  __USER_CODE__
  writeln;
end.
`,
      python: `import sys
data = list(map(int, sys.stdin.read().split()))
a = [data[r*7:(r+1)*7] for r in range(7)]
i = p = 0
out = []
__USER_CODE__
print(' '.join(out))
`,
    },
    solutions: {
      cpp: `for (int k = 7; k >= 1; k--) {
    p = 1;
    for (i = 0; i < k; i++) p *= a[i][i];
    cout << p << (k > 1 ? " " : "");
}
`,
      c: `{
    int k;
    for (k = 7; k >= 1; k--) {
        p = 1;
        for (i = 0; i < k; i++) p *= a[i][i];
        printf("%d%s", p, k > 1 ? " " : "");
    }
}
`,
      pascal: `for k := 7 downto 1 do begin
  p := 1;
  for i := 0 to k - 1 do p := p * a[i,i];
  write(p);
  if k > 1 then write(' ');
end;
`,
      python: `for k in range(7, 0, -1):
        p = 1
        for i in range(k):
            p *= a[i][i]
        out.append(str(p))
`,
    },
    tests: [
      Array.from({ length: 7 }, (_, r) =>
        Array.from({ length: 7 }, (_, c) => (r === c ? [1, 7, 3, 4, 5, 2, 2][r] : 1)).join(" "),
      ).join("\n"),
      Array.from({ length: 7 }, (_, r) => Array.from({ length: 7 }, (_, c) => (r === c ? r + 1 : 0)).join(" ")).join("\n"),
    ],
    time_limit_ms: 1000,
  },
  // ===================== v12 =====================
  {
    slug: "bac-antrenament-2020-v12-2-2",
    subcategoryId: "antrenament-2020-v12",
    title: "Antrenament 2020 V12, S2.2 - Structura flori",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "structuri"],
    statement:
      "Variabila f memoreaza simultan urmatoarele date despre fiecare dintre cele 20 de specii de flori dintr-o florarie: un cod, numarul de varietati si numarul de exemplare din fiecare varietate (maximum 10 varietati).\n\n" +
      "Scrieti definitia unei structuri cu eticheta flori, care permite memorarea datelor despre o specie de flori, si declarati corespunzator variabila f.\n\n" +
      "Codul de verificare va folosi expresiile f[0].cod, f[0].nrVarietati si f[0].nrExemplare[3].",
    input_format: "Se citesc outerIdx, innerIdx, cod, nrVarietati si nrExemplare[innerIdx] pentru f[outerIdx].",
    output_format: "Se afiseaza f[outerIdx].cod, f[outerIdx].nrVarietati, f[outerIdx].nrExemplare[innerIdx], numarul de elemente ale tabloului f si numarul de elemente ale tabloului nrExemplare, separate prin spatiu.",
    constraints: "-",
    hints: "nrExemplare este un tablou de exact 10 intregi. Nu uitati ca f trebuie sa aiba exact 20 de elemente (outerIdx poate fi si 19, innerIdx poate fi si 9).",
    explanation: "Structura flori: cod (int), nrVarietati (int), nrExemplare (tablou de 10 intregi). Verificarea foloseste indici variabili pe ambele tablouri, inclusiv ultimele pozitii valide, in toate combinatiile.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    checkerCode: buildDimChecker([20, 10]),
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int outerIdx, innerIdx;
    cin >> outerIdx >> innerIdx;
    cin >> f[outerIdx].cod >> f[outerIdx].nrVarietati >> f[outerIdx].nrExemplare[innerIdx];
    int dimF = sizeof(f) / sizeof(f[0]);
    int dimN = sizeof(f[0].nrExemplare) / sizeof(f[0].nrExemplare[0]);
    cout << f[outerIdx].cod << " " << f[outerIdx].nrVarietati << " " << f[outerIdx].nrExemplare[innerIdx] << " " << dimF << " " << dimN << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    int outerIdx, innerIdx;
    scanf("%d %d", &outerIdx, &innerIdx);
    scanf("%d %d %d", &f[outerIdx].cod, &f[outerIdx].nrVarietati, &f[outerIdx].nrExemplare[innerIdx]);
    int dimF = (int)(sizeof(f) / sizeof(f[0]));
    int dimN = (int)(sizeof(f[0].nrExemplare) / sizeof(f[0].nrExemplare[0]));
    printf("%d %d %d %d %d\\n", f[outerIdx].cod, f[outerIdx].nrVarietati, f[outerIdx].nrExemplare[innerIdx], dimF, dimN);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
var outerIdx, innerIdx, dimF, dimN: integer;
begin
  read(outerIdx, innerIdx);
  read(f[outerIdx].cod, f[outerIdx].nrVarietati, f[outerIdx].nrExemplare[innerIdx]);
  dimF := High(f) - Low(f) + 1;
  dimN := High(f[0].nrExemplare) - Low(f[0].nrExemplare) + 1;
  writeln(f[outerIdx].cod, ' ', f[outerIdx].nrVarietati, ' ', f[outerIdx].nrExemplare[innerIdx], ' ', dimF, ' ', dimN);
end.
`,
    },
    solutions: {
      cpp: `struct flori {
    int cod;
    int nrVarietati;
    int nrExemplare[10];
} f[20];
`,
      c: `struct flori {
    int cod;
    int nrVarietati;
    int nrExemplare[10];
} f[20];
`,
      pascal: `type
  flori = record
    cod, nrVarietati: longint;
    nrExemplare: array[0..9] of longint;
  end;
var
  f: array[0..19] of flori;
`,
    },
    tests: [
      "0 0 3 5 10",
      "0 0 1 2 100",
      "0 9 9 10 55",
      "19 0 20 10 200",
      "19 9 99 10 999",
    ],
    time_limit_ms: 1000,
  },
  // ===================== v13 =====================
  {
    slug: "bac-antrenament-2020-v13-2-2",
    subcategoryId: "antrenament-2020-v13",
    title: "Antrenament 2020 V13, S2.2 - Structura cerc (raza si centru)",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "structuri"],
    statement:
      "Variabila c memoreaza raza si coordonatele (abscisa si ordonata), in planul xOy, ale centrului unui cerc.\n\n" +
      "Scrieti definitia unei structuri cu eticheta cerc, care permite memorarea datelor precizate, si declarati corespunzator variabila c.\n\n" +
      "Codul de verificare va folosi expresiile c.raza, c.centru.x si c.centru.y.",
    input_format: "Se citesc raza, x si y.",
    output_format: "Se afiseaza c.raza, c.centru.x si c.centru.y (2 zecimale), separate prin spatiu.",
    constraints: "-",
    hints: "centru este un camp de tip structura cu x si y.",
    explanation: "Structura cerc: raza (real) si centru (structura cu x, y reali).",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    cin >> c.raza >> c.centru.x >> c.centru.y;
    printf("%.2f %.2f %.2f\\n", c.raza, c.centru.x, c.centru.y);
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    scanf("%lf %lf %lf", &c.raza, &c.centru.x, &c.centru.y);
    printf("%.2f %.2f %.2f\\n", c.raza, c.centru.x, c.centru.y);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
begin
  readln(c.raza, c.centru.x, c.centru.y);
  writeln(c.raza:0:2, ' ', c.centru.x:0:2, ' ', c.centru.y:0:2);
end.
`,
    },
    solutions: {
      cpp: `struct punct { double x, y; };
struct cerc {
    double raza;
    punct centru;
} c;
`,
      c: `struct punct { double x, y; };
struct cerc {
    double raza;
    struct punct centru;
} c;
`,
      pascal: `type
  punct = record
    x, y: real;
  end;
  cerc = record
    raza: real;
    centru: punct;
  end;
var
  c: cerc;
`,
    },
    tests: ["5 3 4", "1 0 0", "7.5 -2 2.5", "999999.99 1234567.89 -7654321.12"],
    time_limit_ms: 1000,
  },
  // ===================== v14 =====================
  {
    slug: "bac-antrenament-2020-v14-2-2",
    subcategoryId: "antrenament-2020-v14",
    title: "Antrenament 2020 V14, S2.2 - Structura rasa",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "structuri"],
    statement:
      "Variabila r memoreaza simultan urmatoarele date despre fiecare dintre cele 20 de rase de porumbei dintr-o voliera: un cod, numarul de exemplare din rasa respectiva si varstele acestora (maximum 10 exemplare).\n\n" +
      "Scrieti definitia unei structuri cu eticheta rasa, care permite memorarea datelor despre o rasa de porumbei, si declarati corespunzator variabila r.\n\n" +
      "Codul de verificare va folosi expresiile r[0].cod, r[0].nrExemplare si r[0].varsta[3].",
    input_format: "Se citesc outerIdx, innerIdx, cod, nrExemplare si varsta[innerIdx] pentru r[outerIdx].",
    output_format: "Se afiseaza r[outerIdx].cod, r[outerIdx].nrExemplare, r[outerIdx].varsta[innerIdx], numarul de elemente ale tabloului r si numarul de elemente ale tabloului varsta, separate prin spatiu.",
    constraints: "-",
    hints: "varsta este un tablou de exact 10 intregi. Nu uitati ca r trebuie sa aiba exact 20 de elemente (outerIdx poate fi si 19, innerIdx poate fi si 9).",
    explanation: "Structura rasa: cod (int), nrExemplare (int), varsta (tablou de 10 intregi). Verificarea foloseste indici variabili pe ambele tablouri, inclusiv ultimele pozitii valide, in toate combinatiile.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    checkerCode: buildDimChecker([20, 10]),
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int outerIdx, innerIdx;
    cin >> outerIdx >> innerIdx;
    cin >> r[outerIdx].cod >> r[outerIdx].nrExemplare >> r[outerIdx].varsta[innerIdx];
    int dimR = sizeof(r) / sizeof(r[0]);
    int dimV = sizeof(r[0].varsta) / sizeof(r[0].varsta[0]);
    cout << r[outerIdx].cod << " " << r[outerIdx].nrExemplare << " " << r[outerIdx].varsta[innerIdx] << " " << dimR << " " << dimV << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    int outerIdx, innerIdx;
    scanf("%d %d", &outerIdx, &innerIdx);
    scanf("%d %d %d", &r[outerIdx].cod, &r[outerIdx].nrExemplare, &r[outerIdx].varsta[innerIdx]);
    int dimR = (int)(sizeof(r) / sizeof(r[0]));
    int dimV = (int)(sizeof(r[0].varsta) / sizeof(r[0].varsta[0]));
    printf("%d %d %d %d %d\\n", r[outerIdx].cod, r[outerIdx].nrExemplare, r[outerIdx].varsta[innerIdx], dimR, dimV);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
var outerIdx, innerIdx, dimR, dimV: integer;
begin
  read(outerIdx, innerIdx);
  read(r[outerIdx].cod, r[outerIdx].nrExemplare, r[outerIdx].varsta[innerIdx]);
  dimR := High(r) - Low(r) + 1;
  dimV := High(r[0].varsta) - Low(r[0].varsta) + 1;
  writeln(r[outerIdx].cod, ' ', r[outerIdx].nrExemplare, ' ', r[outerIdx].varsta[innerIdx], ' ', dimR, ' ', dimV);
end.
`,
    },
    solutions: {
      cpp: `struct rasa {
    int cod;
    int nrExemplare;
    int varsta[10];
} r[20];
`,
      c: `struct rasa {
    int cod;
    int nrExemplare;
    int varsta[10];
} r[20];
`,
      pascal: `type
  rasa = record
    cod, nrExemplare: longint;
    varsta: array[0..9] of longint;
  end;
var
  r: array[0..19] of rasa;
`,
    },
    tests: [
      "0 0 4 6 1",
      "0 0 2 10 1",
      "0 9 8 1 9",
      "19 0 20 5 3",
      "19 9 99 10 25",
    ],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-antrenament-2020-v14-2-3",
    subcategoryId: "antrenament-2020-v14",
    title: "Antrenament 2020 V14, S2.3 - Tablou cu suma vecinilor (oglindit)",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "tablouri-bidimensionale"],
    statement:
      "Variabilele i si j sunt de tip intreg, iar variabila a memoreaza un tablou bidimensional cu 5 linii si 7 coloane, numerotate incepand de la 0, cu elemente numere intregi, initial toate egale cu 0.\n\n" +
      "Fara a utiliza alte variabile decat cele mentionate, scrieti o secventa de instructiuni prin care se transforma in memorie tabloul, astfel incat orice element aflat pe prima linie sau pe ultima coloana sa aiba valoarea 1, si oricare alt element din tablou sa fie egal cu ultima cifra a sumei celor doua elemente alaturate lui, aflate pe aceeasi linie dar pe coloana din dreapta, respectiv pe aceeasi coloana, dar pe linia anterioara.",
    input_format: "Fara date de intrare.",
    output_format: "Cele 5 linii ale tabloului a, elementele separate prin cate un spatiu.",
    constraints: "Dimensiune fixa 5x7.",
    hints: "Parcurgeti liniile crescator si coloanele descrescator (de la 5 la 0): a[i][j] = (a[i][j+1]+a[i-1][j]) % 10 pentru i>0 si j<6.",
    explanation: "Fiecare element interior depinde de vecinul din dreapta (deja fixat pe ultima coloana sau calculat anterior in parcurgerea descrescatoare) si de vecinul de deasupra.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int a[5][7];
    int i, j;
    for (i = 0; i < 5; i++) for (j = 0; j < 7; j++) a[i][j] = 0;
    for (j = 0; j < 7; j++) a[0][j] = 1;
    for (i = 0; i < 5; i++) a[i][6] = 1;
    __USER_CODE__
    for (i = 0; i < 5; i++) {
        for (j = 0; j < 7; j++) cout << a[i][j] << (j < 6 ? " " : "");
        cout << "\\n";
    }
    return 0;
}
`,
      c: `#include <stdio.h>
int main() {
    int a[5][7];
    int i, j;
    for (i = 0; i < 5; i++) for (j = 0; j < 7; j++) a[i][j] = 0;
    for (j = 0; j < 7; j++) a[0][j] = 1;
    for (i = 0; i < 5; i++) a[i][6] = 1;
    __USER_CODE__
    for (i = 0; i < 5; i++) {
        for (j = 0; j < 7; j++) printf("%d%s", a[i][j], j < 6 ? " " : "");
        printf("\\n");
    }
    return 0;
}
`,
      pascal: `program solution;
var
  a: array[0..4,0..6] of integer;
  i, j: integer;
begin
  for i := 0 to 4 do for j := 0 to 6 do a[i,j] := 0;
  for j := 0 to 6 do a[0,j] := 1;
  for i := 0 to 4 do a[i,6] := 1;
  __USER_CODE__
  for i := 0 to 4 do begin
    for j := 0 to 6 do begin
      write(a[i,j]);
      if j < 6 then write(' ');
    end;
    writeln;
  end;
end.
`,
      python: `a = [[0]*7 for _ in range(5)]
for j in range(7):
    a[0][j] = 1
for i in range(5):
    a[i][6] = 1
i = j = 0
__USER_CODE__
for row in a:
    print(' '.join(map(str, row)))
`,
    },
    solutions: {
      cpp: `for (i = 1; i < 5; i++)
    for (j = 5; j >= 0; j--)
        a[i][j] = (a[i][j+1] + a[i-1][j]) % 10;
`,
      c: `for (i = 1; i < 5; i++)
    for (j = 5; j >= 0; j--)
        a[i][j] = (a[i][j+1] + a[i-1][j]) % 10;
`,
      pascal: `for i := 1 to 4 do
  for j := 5 downto 0 do
    a[i,j] := (a[i,j+1] + a[i-1,j]) mod 10;
`,
      python: `for i in range(1, 5):
        for j in range(5, -1, -1):
            a[i][j] = (a[i][j+1] + a[i-1][j]) % 10
`,
    },
    tests: [""],
    time_limit_ms: 1000,
  },
  // ===================== v15 =====================
  {
    slug: "bac-antrenament-2020-v15-2-3",
    subcategoryId: "antrenament-2020-v15",
    title: "Antrenament 2020 V15, S2.3 - Tablou 4x5 pe coloane",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "tablouri-bidimensionale"],
    statement:
      "Variabilele i si j sunt de tip intreg, iar variabila a memoreaza un tablou bidimensional cu 4 linii si 5 coloane, numerotate incepand de la 0, cu elemente numere intregi, initial toate nule.\n\n" +
      "Fara a utiliza alte variabile decat cele mentionate, scrieti o secventa de instructiuni astfel incat, in urma executarii acesteia, variabila a sa memoreze tabloul:\n\n" +
      "1 5 9 13 17\n2 6 10 14 18\n3 7 11 15 19\n4 8 12 16 20",
    input_format: "Fara date de intrare.",
    output_format: "Cele 4 linii ale tabloului a, elementele separate prin cate un spatiu.",
    constraints: "Dimensiune fixa 4x5.",
    hints: "a[i][j] = j*4 + i + 1.",
    explanation: "Elementele cresc pe coloane, formula j*4+i+1 genereaza direct tabloul.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int a[4][5];
    int i, j;
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
      python: `a = [[0]*5 for _ in range(4)]
i = j = 0
__USER_CODE__
for row in a:
    print(' '.join(map(str, row)))
`,
    },
    solutions: {
      cpp: `for (i = 0; i < 4; i++)
    for (j = 0; j < 5; j++)
        a[i][j] = j * 4 + i + 1;
`,
      c: `for (i = 0; i < 4; i++)
    for (j = 0; j < 5; j++)
        a[i][j] = j * 4 + i + 1;
`,
      pascal: `for i := 0 to 3 do
  for j := 0 to 4 do
    a[i,j] := j * 4 + i + 1;
`,
      python: `for i in range(4):
        for j in range(5):
            a[i][j] = j * 4 + i + 1
`,
    },
    tests: [""],
    time_limit_ms: 1000,
  },
  // ===================== v17 =====================
  {
    slug: "bac-antrenament-2020-v17-2-2",
    subcategoryId: "antrenament-2020-v17",
    title: "Antrenament 2020 V17, S2.2 - Structura obiectiv turistic",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "structuri"],
    statement:
      "Variabila ob memoreaza simultan urmatoarele date despre un obiectiv turistic: un cod si o perioada din an in care se recomanda sa fie vizitat, formata din zile consecutive, intre doua date (ziua si luna de inceput, respectiv ziua si luna finala).\n\n" +
      "Scrieti definitia unei structuri cu eticheta obiectiv, care permite memorarea datelor despre un obiectiv turistic, si declarati corespunzator variabila ob.\n\n" +
      "Codul de verificare va folosi expresiile ob.cod, ob.dataInceput.zi, ob.dataInceput.luna, ob.dataFinal.zi si ob.dataFinal.luna.",
    input_format: "Se citesc cod, dataInceput.zi, dataInceput.luna, dataFinal.zi si dataFinal.luna.",
    output_format: "Se afiseaza cele 5 valori, separate prin spatiu.",
    constraints: "-",
    hints: "dataInceput si dataFinal sunt campuri de tip structura, fiecare cu zi si luna.",
    explanation: "Structura obiectiv: cod (int), dataInceput si dataFinal (structuri cu zi, luna intregi).",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    cin >> ob.cod >> ob.dataInceput.zi >> ob.dataInceput.luna >> ob.dataFinal.zi >> ob.dataFinal.luna;
    cout << ob.cod << " " << ob.dataInceput.zi << " " << ob.dataInceput.luna << " " << ob.dataFinal.zi << " " << ob.dataFinal.luna << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    scanf("%d %d %d %d %d", &ob.cod, &ob.dataInceput.zi, &ob.dataInceput.luna, &ob.dataFinal.zi, &ob.dataFinal.luna);
    printf("%d %d %d %d %d\\n", ob.cod, ob.dataInceput.zi, ob.dataInceput.luna, ob.dataFinal.zi, ob.dataFinal.luna);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
begin
  readln(ob.cod, ob.dataInceput.zi, ob.dataInceput.luna, ob.dataFinal.zi, ob.dataFinal.luna);
  writeln(ob.cod, ' ', ob.dataInceput.zi, ' ', ob.dataInceput.luna, ' ', ob.dataFinal.zi, ' ', ob.dataFinal.luna);
end.
`,
    },
    solutions: {
      cpp: `struct dataTip { int zi, luna; };
struct obiectiv {
    int cod;
    dataTip dataInceput, dataFinal;
} ob;
`,
      c: `struct dataTip { int zi, luna; };
struct obiectiv {
    int cod;
    struct dataTip dataInceput, dataFinal;
} ob;
`,
      pascal: `type
  dataTip = record
    zi, luna: longint;
  end;
  obiectiv = record
    cod: longint;
    dataInceput, dataFinal: dataTip;
  end;
var
  ob: obiectiv;
`,
    },
    tests: ["101 15 6 30 8", "2 1 1 31 12", "50 10 5 20 5", "2000000000 28 2 30 11"],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-antrenament-2020-v17-2-3",
    subcategoryId: "antrenament-2020-v17",
    title: "Antrenament 2020 V17, S2.3 - Tablou 4x5 descrescator pe coloane",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "tablouri-bidimensionale"],
    statement:
      "Variabilele i si j sunt de tip intreg, iar variabila a memoreaza un tablou bidimensional cu 4 linii si 5 coloane, numerotate incepand de la 0, cu elemente numere intregi, initial toate nule.\n\n" +
      "Fara a utiliza alte variabile decat cele mentionate, scrieti o secventa de instructiuni C/C++ astfel incat, in urma executarii acesteia, variabila a sa memoreze tabloul:\n\n" +
      "20 16 12 8 4\n19 15 11 7 3\n18 14 10 6 2\n17 13 9 5 1",
    input_format: "Fara date de intrare.",
    output_format: "Cele 4 linii ale tabloului a, elementele separate prin cate un spatiu.",
    constraints: "Dimensiune fixa 4x5.",
    hints: "a[i][j] = 20 - 4*j - i.",
    explanation: "Fiecare coloana scade cu 4 fata de precedenta, iar in cadrul unei coloane elementele scad cu 1 de sus in jos.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int a[4][5];
    int i, j;
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
      python: `a = [[0]*5 for _ in range(4)]
i = j = 0
__USER_CODE__
for row in a:
    print(' '.join(map(str, row)))
`,
    },
    solutions: {
      cpp: `for (i = 0; i < 4; i++)
    for (j = 0; j < 5; j++)
        a[i][j] = 20 - 4 * j - i;
`,
      c: `for (i = 0; i < 4; i++)
    for (j = 0; j < 5; j++)
        a[i][j] = 20 - 4 * j - i;
`,
      pascal: `for i := 0 to 3 do
  for j := 0 to 4 do
    a[i,j] := 20 - 4 * j - i;
`,
      python: `for i in range(4):
        for j in range(5):
            a[i][j] = 20 - 4 * j - i
`,
    },
    tests: [""],
    time_limit_ms: 1000,
  },
  // ===================== v19 =====================
  {
    slug: "bac-antrenament-2020-v19-2-2",
    subcategoryId: "antrenament-2020-v19",
    title: "Antrenament 2020 V19, S2.2 - Structura proiect",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "structuri"],
    statement:
      "Variabila p memoreaza date despre un proiect: tema (sir de maximum 20 de caractere), numarul surselor de documentare (maximum 10) si, pentru fiecare sursa, denumirea/adresa web (sir de maximum 100 de caractere).\n\n" +
      "Scrieti definitia unei structuri cu eticheta proiect, care permite memorarea datelor precizate pentru un proiect, si declarati corespunzator variabila p.\n\n" +
      "Codul de verificare va folosi expresiile p.tema, p.nrSurse si p.denAdrSursa[0].",
    input_format: "Se citesc tema (linie), nrSurse si un indice idx (linie), apoi denAdrSursa[idx] (linie).",
    output_format: "Se afiseaza p.tema, p.nrSurse, p.denAdrSursa[idx] si numarul de elemente ale tabloului denAdrSursa, separate prin spatiu.",
    constraints: "nrSurse este maximum 10",
    hints: "denAdrSursa este un tablou de siruri, cu exact 10 elemente (idx poate fi si 9).",
    explanation: "Structura proiect: tema (sir), nrSurse (int), denAdrSursa (tablou de siruri, minim 10 elemente). Verificarea foloseste un indice variabil, inclusiv ultima pozitie valida.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    checkerCode: buildDimChecker([10]),
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int idx;
    cin >> p.tema >> p.nrSurse >> idx >> p.denAdrSursa[idx];
    int dim = sizeof(p.denAdrSursa) / sizeof(p.denAdrSursa[0]);
    cout << p.tema << " " << p.nrSurse << " " << p.denAdrSursa[idx] << " " << dim << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    int idx;
    scanf("%s %d %d", p.tema, &p.nrSurse, &idx);
    scanf("%s", p.denAdrSursa[idx]);
    int dim = (int)(sizeof(p.denAdrSursa) / sizeof(p.denAdrSursa[0]));
    printf("%s %d %s %d\\n", p.tema, p.nrSurse, p.denAdrSursa[idx], dim);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
var dim, idx: longint;
begin
  readln(p.tema);
  readln(p.nrSurse, idx);
  readln(p.denAdrSursa[idx]);
  dim := High(p.denAdrSursa) - Low(p.denAdrSursa) + 1;
  writeln(p.tema, ' ', p.nrSurse, ' ', p.denAdrSursa[idx], ' ', dim);
end.
`,
    },
    solutions: {
      cpp: `struct proiect {
    char tema[21];
    int nrSurse;
    char denAdrSursa[10][101];
} p;
`,
      c: `struct proiect {
    char tema[21];
    int nrSurse;
    char denAdrSursa[10][101];
} p;
`,
      pascal: `type
  proiect = record
    tema: string;
    nrSurse: longint;
    denAdrSursa: array[0..9] of string;
  end;
var
  p: proiect;
`,
    },
    tests: ["Robotica\n3 0\nwwwexemplu1ro", "AI\n5 0\nwwwexemplu2ro", "IoT\n10 9\nwwwexemplu3ro"],
    time_limit_ms: 1000,
  },
  // ===================== v20 =====================
  {
    slug: "bac-antrenament-2020-v20-2-2",
    subcategoryId: "antrenament-2020-v20",
    title: "Antrenament 2020 V20, S2.2 - Structura prajitura (ingrediente)",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "structuri"],
    statement:
      "Variabila p memoreaza simultan date specifice pentru prepararea unei prajituri: numarul de ingrediente necesare (numar natural din intervalul [2,20]) si, pentru fiecare ingredient, codul acestuia si cantitatea necesara.\n\n" +
      "Scrieti definitia unei structuri cu eticheta prajitura, care permite memorarea datelor specifice pentru prepararea unei prajituri, si declarati corespunzator variabila p.\n\n" +
      "Codul de verificare va folosi expresiile p.numar, p.ingredient[0].cod si p.ingredient[0].cantitate.",
    input_format: "Se citesc numar, un indice idx, apoi cod si cantitate pentru p.ingredient[idx].",
    output_format: "Se afiseaza p.numar, p.ingredient[idx].cod, p.ingredient[idx].cantitate si numarul de elemente ale tabloului ingredient, separate prin spatiu.",
    constraints: "numarul de ingrediente este in intervalul [2,20]",
    hints: "ingredient este un tablou de structuri cu campurile cod si cantitate, cu exact 20 de elemente (idx poate fi si 19).",
    explanation: "Structura prajitura: numar (int) si ingredient (tablou de structuri cu cod, cantitate intregi, minim 20 de elemente). Verificarea foloseste un indice variabil, inclusiv ultima pozitie valida.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    checkerCode: buildDimChecker([20]),
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int idx;
    cin >> p.numar >> idx;
    cin >> p.ingredient[idx].cod >> p.ingredient[idx].cantitate;
    int dim = sizeof(p.ingredient) / sizeof(p.ingredient[0]);
    cout << p.numar << " " << p.ingredient[idx].cod << " " << p.ingredient[idx].cantitate << " " << dim << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    int idx;
    scanf("%d %d", &p.numar, &idx);
    scanf("%d %d", &p.ingredient[idx].cod, &p.ingredient[idx].cantitate);
    int dim = (int)(sizeof(p.ingredient) / sizeof(p.ingredient[0]));
    printf("%d %d %d %d\\n", p.numar, p.ingredient[idx].cod, p.ingredient[idx].cantitate, dim);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
var dim, idx: longint;
begin
  readln(p.numar, idx, p.ingredient[idx].cod, p.ingredient[idx].cantitate);
  dim := High(p.ingredient) - Low(p.ingredient) + 1;
  writeln(p.numar, ' ', p.ingredient[idx].cod, ' ', p.ingredient[idx].cantitate, ' ', dim);
end.
`,
    },
    solutions: {
      cpp: `struct ingredientTip { int cod; int cantitate; };
struct prajitura {
    int numar;
    ingredientTip ingredient[20];
} p;
`,
      c: `struct ingredientTip { int cod; int cantitate; };
struct prajitura {
    int numar;
    struct ingredientTip ingredient[20];
} p;
`,
      pascal: `type
  ingredientTip = record
    cod, cantitate: longint;
  end;
  prajitura = record
    numar: longint;
    ingredient: array[0..19] of ingredientTip;
  end;
var
  p: prajitura;
`,
    },
    tests: ["5 0 1 200", "2 0 3 50", "20 19 7 1000", "5 0 200000000 1"],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-antrenament-2020-v20-2-3",
    subcategoryId: "antrenament-2020-v20",
    title: "Antrenament 2020 V20, S2.3 - Tablou 7x7 romb de litere",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "antrenament", "subiectul2", "tablouri-bidimensionale"],
    statement:
      "Variabilele i si j sunt de tip intreg, iar variabila a memoreaza un tablou bidimensional cu 7 linii si 7 coloane, numerotate de la 0 la 6, avand initial toate elementele egale cu caracterul *.\n\n" +
      "Fara a utiliza alte variabile, scrieti secventa de instructiuni de mai jos, inlocuind punctele de suspensie astfel incat, in urma executarii secventei obtinute, variabila a sa memoreze tabloul:\n\n" +
      "b a a a a a b\nb b a a a b b\nb b b a b b b\nb b b b b b b\nb b b a b b b\nb b a a a b b\nb a a a a a b\n\n" +
      "for(i=0;i<7;i++)\n  for(j=0;j<7;j++)\n    ..................",
    input_format: "Fara date de intrare.",
    output_format: "Cele 7 linii ale tabloului a, elementele separate prin cate un spatiu.",
    constraints: "Dimensiune fixa 7x7.",
    hints: "r = min(i,6-i); a[i][j] = 'a' daca r+1<=j<=5-r, altfel 'b'.",
    explanation: "Zona in forma de romb (gol in centru) contine 'a', restul contine 'b'; r masoara distanta fata de marginea sus/jos mai apropiata.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    char a[7][7];
    int i, j;
    for (i = 0; i < 7; i++)
        for (j = 0; j < 7; j++)
            __USER_CODE__
    for (i = 0; i < 7; i++) {
        for (j = 0; j < 7; j++) cout << a[i][j] << (j < 6 ? " " : "");
        cout << "\\n";
    }
    return 0;
}
`,
      c: `#include <stdio.h>
int main() {
    char a[7][7];
    int i, j;
    for (i = 0; i < 7; i++)
        for (j = 0; j < 7; j++)
            __USER_CODE__
    for (i = 0; i < 7; i++) {
        for (j = 0; j < 7; j++) printf("%c%s", a[i][j], j < 6 ? " " : "");
        printf("\\n");
    }
    return 0;
}
`,
      pascal: `program solution;
var
  a: array[0..6,0..6] of char;
  i, j, r: integer;
begin
  for i := 0 to 6 do
    for j := 0 to 6 do
      __USER_CODE__
  for i := 0 to 6 do begin
    for j := 0 to 6 do begin
      write(a[i,j]);
      if j < 6 then write(' ');
    end;
    writeln;
  end;
end.
`,
      python: `a = [[None]*7 for _ in range(7)]
for i in range(7):
    for j in range(7):
        __USER_CODE__
for i in range(7):
    print(' '.join(a[i]))
`,
    },
    solutions: {
      cpp: `{
    int r = min(i, 6 - i);
    if (j >= r + 1 && j <= 5 - r) a[i][j] = 'a'; else a[i][j] = 'b';
}
`,
      c: `{
    int r = (i < 6 - i) ? i : 6 - i;
    if (j >= r + 1 && j <= 5 - r) a[i][j] = 'a'; else a[i][j] = 'b';
}
`,
      pascal: `begin
  if i < 6 - i then r := i else r := 6 - i;
  if (j >= r + 1) and (j <= 5 - r) then a[i,j] := 'a' else a[i,j] := 'b';
end;
`,
      python: `r = min(i, 6 - i)
        a[i][j] = 'a' if (r + 1 <= j <= 5 - r) else 'b'
`,
    },
    tests: [""],
    time_limit_ms: 1000,
  },
];

runMain(problems, LEVEL, CHAPTER, SRC).catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
