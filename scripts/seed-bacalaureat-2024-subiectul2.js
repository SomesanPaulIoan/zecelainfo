const { runMain, buildDimChecker } = require("./lib/bac-subiectul2-runner");

const LEVEL = "bacalaureat";
const CHAPTER = { id: "bacalaureat-2024", name: "Bacalaureat 2024" };
const SRC = "Bacalaureat Informatica MI 2024 (Ministerul Educatiei / CNPEE) - Subiectul II";

const IO_STDIN = { input_source: "stdin", output_target: "stdout", input_filename: null, output_filename: null };

const problems = [
  {
    slug: "bac-model-2024-2-2",
    subcategoryId: "model-2024",
    title: "Bacalaureat Model 2024, S2.2 - Structura telefon",
    difficulty: "easy",
    tags: ["bacalaureat", "2024", "model", "subiectul2", "structuri"],
    statement:
      "Variabila t memoreaza simultan, pentru un telefon, urmatoarele date: producatorul (o litera mare a alfabetului englez), frecventa procesorului (numar natural) si dimensiunea, data prin trei valori, reprezentand latimea, grosimea si lungimea, in aceasta ordine, in milimetri (numere reale).\n\n" +
      "Scrieti definitia unei structuri cu eticheta telefon, care permite memorarea datelor despre un telefon, si declarati corespunzator variabila t.\n\n" +
      "Codul de verificare va folosi expresiile t.producator, t.dimensiune[0] si t.frecventa.",
    input_format: "Se citesc producator, frecventa, cele trei valori ale dimensiunii si un indice idx.",
    output_format: "Se afiseaza t.producator, t.frecventa, t.dimensiune[idx] (2 zecimale) si numarul de elemente ale tabloului dimensiune, separate prin spatiu.",
    constraints: "-",
    hints: "dimensiune este un tablou de exact 3 numere reale (idx poate fi si 2).",
    explanation: "Structura telefon: producator (char), frecventa (int), dimensiune (tablou de 3 reali). Verificarea foloseste un indice variabil, inclusiv ultima pozitie valida.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    checkerCode: buildDimChecker([3]),
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int idx;
    cin >> t.producator >> t.frecventa >> t.dimensiune[0] >> t.dimensiune[1] >> t.dimensiune[2] >> idx;
    int dim = sizeof(t.dimensiune) / sizeof(t.dimensiune[0]);
    printf("%c %d %.2f %d\\n", t.producator, t.frecventa, t.dimensiune[idx], dim);
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    int idx;
    scanf(" %c %d %lf %lf %lf %d", &t.producator, &t.frecventa, &t.dimensiune[0], &t.dimensiune[1], &t.dimensiune[2], &idx);
    int dim = (int)(sizeof(t.dimensiune) / sizeof(t.dimensiune[0]));
    printf("%c %d %.2f %d\\n", t.producator, t.frecventa, t.dimensiune[idx], dim);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
var dim, idx: longint;
begin
  read(t.producator, t.frecventa, t.dimensiune[0], t.dimensiune[1], t.dimensiune[2], idx);
  dim := High(t.dimensiune) - Low(t.dimensiune) + 1;
  writeln(t.producator, ' ', t.frecventa, ' ', t.dimensiune[idx]:0:2, ' ', dim);
end.
`,
    },
    solutions: {
      cpp: `struct telefon {
    char producator;
    int frecventa;
    double dimensiune[3];
} t;
`,
      c: `struct telefon {
    char producator;
    int frecventa;
    double dimensiune[3];
} t;
`,
      pascal: `type
  telefon = record
    producator: char;
    frecventa: longint;
    dimensiune: array[0..2] of real;
  end;
var
  t: telefon;
`,
    },
    tests: ["A 2400 70.5 8.2 150.0 0", "Z 3600 68 7 149 0", "M 1800 72.25 9.1 155.3 2", "K 200000000 1.5 2.5 3.5 0"],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-model-2024-2-3",
    subcategoryId: "model-2024",
    title: "Bacalaureat Model 2024, S2.3 - Coloane cu 2024 la capete",
    difficulty: "easy",
    tags: ["bacalaureat", "2024", "model", "subiectul2", "tablouri-bidimensionale"],
    statement:
      "Variabila i este de tip intreg, iar variabila a memoreaza un tablou bidimensional cu 4 linii si 24 de coloane, numerotate incepand cu 0, cu elemente numere intregi. Fara a utiliza alte variabile decat cele mentionate, scrieti o secventa de instructiuni in urma executarii careia sa se afiseze pe ecran, separate prin cate un spatiu, indicii coloanelor cu proprietatea ca atat primul, cat si ultimul lor element, au valoarea 2024.",
    input_format: "Se citesc cele 96 de elemente ale tabloului a (4 linii x 24 coloane).",
    output_format: "Indicii coloanelor cerute, separati printr-un spatiu.",
    constraints: "Elemente numere intregi.",
    hints: "Parcurgeti coloanele cu i si verificati a[0][i]==2024 si a[3][i]==2024.",
    explanation: "Se parcurg cele 24 de coloane; pentru fiecare, se verifica simultan primul (linia 0) si ultimul (linia 3) element.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int a[4][24];
    int i;
    for (int r = 0; r < 4; r++) for (int c = 0; c < 24; c++) cin >> a[r][c];
    __USER_CODE__
    cout << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
int main() {
    int a[4][24];
    int i;
    for (int r = 0; r < 4; r++) for (int c = 0; c < 24; c++) scanf("%d", &a[r][c]);
    __USER_CODE__
    printf("\\n");
    return 0;
}
`,
      pascal: `program solution;
var
  a: array[0..3,0..23] of integer;
  i, r, c: integer;
begin
  for r := 0 to 3 do
    for c := 0 to 23 do
      read(a[r,c]);
  __USER_CODE__
  writeln;
end.
`,
      python: `import sys
data = list(map(int, sys.stdin.read().split()))
a = [data[r*24:(r+1)*24] for r in range(4)]
i = 0
out = []
__USER_CODE__
print(' '.join(out))
`,
    },
    solutions: {
      cpp: `for (i = 0; i < 24; i++)
    if (a[0][i] == 2024 && a[3][i] == 2024)
        cout << i << " ";
`,
      c: `for (i = 0; i < 24; i++)
    if (a[0][i] == 2024 && a[3][i] == 2024)
        printf("%d ", i);
`,
      pascal: `for i := 0 to 23 do
  if (a[0,i] = 2024) and (a[3,i] = 2024) then
    write(i, ' ');
`,
      python: `for i in range(24):
        if a[0][i] == 2024 and a[3][i] == 2024:
            out.append(str(i))
`,
    },
    tests: [
      Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 24 }, (_, c) => {
          if (c === 2 || c === 10) return 2024;
          return r === 0 || r === 3 ? 1 : c;
        }).join(" "),
      ).join("\n"),
      Array.from({ length: 4 }, () => Array.from({ length: 24 }, (_, c) => c).join(" ")).join("\n"),
    ],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-simulare-2024-2-3",
    subcategoryId: "simulare-2024",
    title: "Bacalaureat Simulare 2024, S2.3 - Tablou 5x5 cu dublul minimului",
    difficulty: "medium",
    tags: ["bacalaureat", "2024", "simulare", "subiectul2", "tablouri-bidimensionale"],
    statement:
      "Variabilele i si j sunt de tip intreg, iar variabila a memoreaza un tablou bidimensional cu 5 linii si 5 coloane, numerotate incepand de la 0, avand initial toate elementele egale cu 1.\n\n" +
      "Scrieti secventa de instructiuni C/C++ de mai jos, inlocuind punctele de suspensie cu instructiuni adecvate, astfel incat, in urma executarii secventei obtinute, variabila a sa memoreze tabloul:\n\n" +
      "0 0 0 0 0\n0 2 2 2 2\n0 2 4 4 4\n0 2 4 6 6\n0 2 4 6 8\n\n" +
      "for(i=0;i<5;i++)\n  for(j=0;j<5;j++)\n    ..................",
    input_format: "Fara date de intrare.",
    output_format: "Cele 5 linii ale tabloului a, elementele separate prin cate un spatiu.",
    constraints: "Dimensiune fixa 5x5.",
    hints: "a[i][j] = 2*min(i,j).",
    explanation: "Formula 2*min(i,j) genereaza exact tabloul cerut.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int a[5][5];
    int i, j;
    for (i = 0; i < 5; i++)
        for (j = 0; j < 5; j++)
            __USER_CODE__
    for (i = 0; i < 5; i++) {
        for (j = 0; j < 5; j++) cout << a[i][j] << (j < 4 ? " " : "");
        cout << "\\n";
    }
    return 0;
}
`,
      c: `#include <stdio.h>
int main() {
    int a[5][5];
    int i, j;
    for (i = 0; i < 5; i++)
        for (j = 0; j < 5; j++)
            __USER_CODE__
    for (i = 0; i < 5; i++) {
        for (j = 0; j < 5; j++) printf("%d%s", a[i][j], j < 4 ? " " : "");
        printf("\\n");
    }
    return 0;
}
`,
      pascal: `program solution;
var
  a: array[0..4,0..4] of integer;
  i, j: integer;
begin
  for i := 0 to 4 do
    for j := 0 to 4 do
      __USER_CODE__
  for i := 0 to 4 do begin
    for j := 0 to 4 do begin
      write(a[i,j]);
      if j < 4 then write(' ');
    end;
    writeln;
  end;
end.
`,
      python: `a = [[None]*5 for _ in range(5)]
for i in range(5):
    for j in range(5):
        __USER_CODE__
for i in range(5):
    print(' '.join(str(a[i][j]) for j in range(5)))
`,
    },
    solutions: {
      cpp: `a[i][j] = 2 * min(i, j);
`,
      c: `a[i][j] = 2 * (i < j ? i : j);
`,
      pascal: `if i < j then a[i,j] := 2 * i else a[i,j] := 2 * j;
`,
      python: `a[i][j] = 2 * min(i, j)
`,
    },
    tests: [""],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-speciala-2024-2-3",
    subcategoryId: "speciala-2024",
    title: "Bacalaureat Speciala 2024, S2.3 - Cuvant de doua litere mixt",
    difficulty: "medium",
    tags: ["bacalaureat", "2024", "speciala", "subiectul2", "siruri-caractere"],
    statement:
      "Variabilele c si i sunt de tip intreg, iar variabila s permite memorarea unui sir de cel mult 20 de caractere. Se citesc de la tastatura 10 cuvinte, formate din litere mici ale alfabetului englez si separate prin Enter.\n\n" +
      "Scrieti o secventa de instructiuni astfel incat, in urma executarii acesteia, variabila c sa memoreze valoarea 1 daca exista printre cuvintele citite cel putin unul format din doua litere si care sa contina o vocala si o consoana, sau valoarea 0 altfel. Se considera vocale literele a, e, i, o, u.",
    input_format: "Se citesc 10 cuvinte, cate unul pe linie.",
    output_format: "Valoarea lui c (0 sau 1).",
    constraints: "Cuvinte formate numai din litere mici ale alfabetului englez.",
    hints: "Un cuvant de 2 litere e valid daca exact una dintre cele doua litere e vocala.",
    explanation: "Se citesc si verifica pe rand cele 10 cuvinte; c devine 1 daca gasim macar unul de lungime 2 cu exact o vocala.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
#include <cstring>
using namespace std;
char s[25];
int c, i;
int main() {
    __USER_CODE__
    cout << c << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
#include <string.h>
char s[25];
int c, i;
int main() {
    __USER_CODE__
    printf("%d\\n", c);
    return 0;
}
`,
      pascal: `program solution;
function esteVocala(ch: char): boolean;
begin
  esteVocala := (ch = 'a') or (ch = 'e') or (ch = 'i') or (ch = 'o') or (ch = 'u');
end;
var
  s: string;
  c, i: integer;
begin
  __USER_CODE__
  writeln(c);
end.
`,
      python: `def este_vocala(ch):
    return ch in 'aeiou'
c = 0
i = 0
s = ''
__USER_CODE__
print(c)
`,
    },
    solutions: {
      cpp: `c = 0;
for (i = 1; i <= 10; i++) {
    cin >> s;
    if (strlen(s) == 2) {
        bool v0 = strchr("aeiou", s[0]) != NULL;
        bool v1 = strchr("aeiou", s[1]) != NULL;
        if (v0 != v1) c = 1;
    }
}
`,
      c: `c = 0;
for (i = 1; i <= 10; i++) {
    scanf("%s", s);
    if (strlen(s) == 2) {
        int v0 = strchr("aeiou", s[0]) != NULL;
        int v1 = strchr("aeiou", s[1]) != NULL;
        if (v0 != v1) c = 1;
    }
}
`,
      pascal: `c := 0;
for i := 1 to 10 do begin
  readln(s);
  if length(s) = 2 then
    if esteVocala(s[1]) <> esteVocala(s[2]) then
      c := 1;
end;
`,
      python: `c = 0
for i in range(1, 11):
        s = input().strip()
        if len(s) == 2:
            if este_vocala(s[0]) != este_vocala(s[1]):
                c = 1
`,
    },
    tests: [
      "daca\nau\nplecat\nel\nnu\nprimeste\nsi\ninghetata\nde\nfragi",
      "ana\nbb\nio\ncd\nxyz\naa\nzz\nmama\ntata\ncasa",
      "el\nzz\nyy\nxx\nww\nvv\nuu\ntt\nss\nrr",
    ],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-toamna-2024-2-3",
    subcategoryId: "toamna-2024",
    title: "Bacalaureat Toamna 2024, S2.3 - Interval muzical (terta)",
    difficulty: "medium",
    tags: ["bacalaureat", "2024", "toamna", "subiectul2", "structuri", "secventa-instructiuni"],
    statement:
      "Gama muzicala contine, in aceasta ordine, notele do, re, mi, fa, sol, la, si. Doua note formeaza un interval muzical, iar acesta este numit terta daca, in ordinea din gama, intre cele doua note exista o singura alta nota muzicala.\n\n" +
      "In notatia englezeasca: A=la, B=si, C=do, D=re, E=mi, F=fa, G=sol.\n\n" +
      "Variabila m, declarata alaturat, memoreaza literele corespunzatoare notatiei englezesti pentru doua note care formeaza un interval muzical, date in ordinea din gama:\n\n" +
      "struct interval { char nota1; char nota2; } m;\n\n" +
      "Stiind ca in campul nota1 se memoreaza una dintre literele C, D, E, F sau G, scrieti o secventa de instructiuni C/C++ in urma executarii careia sa se afiseze pe ecran mesajul TERTA, daca intervalul respectiv formeaza o terta, sau mesajul NU, in caz contrar.\n\n" +
      "Exemplu: daca in campul nota1 se memoreaza litera G (pentru nota sol), iar in campul nota2 se memoreaza litera B (pentru nota si), se afiseaza mesajul TERTA.",
    input_format: "Se citesc m.nota1 si m.nota2.",
    output_format: "Se afiseaza TERTA sau NU.",
    constraints: "-",
    hints: "Ordinea gamei in litere englezesti este C D E F G A B; terta = distanta exact 2 in aceasta ordine.",
    explanation: "Se cauta pozitiile celor doua litere in sirul \"CDEFGAB\" si se verifica daca diferenta absoluta este 2.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
#include <cstring>
using namespace std;
struct interval { char nota1, nota2; } m;
int main() {
    cin >> m.nota1 >> m.nota2;
    __USER_CODE__
    return 0;
}
`,
      c: `#include <stdio.h>
#include <string.h>
struct interval { char nota1, nota2; } m;
int main() {
    scanf(" %c %c", &m.nota1, &m.nota2);
    __USER_CODE__
    return 0;
}
`,
      pascal: `program solution;
type
  interval = record
    nota1, nota2: char;
  end;
var
  m: interval;
  ordine, line: string;
  p1, p2: longint;
begin
  readln(line);
  m.nota1 := line[1];
  m.nota2 := line[3];
  __USER_CODE__
end.
`,
      python: `from types import SimpleNamespace
nota1, nota2 = input().split()
m = SimpleNamespace(nota1=nota1, nota2=nota2)
__USER_CODE__
`,
    },
    solutions: {
      cpp: `const char ordine[] = "CDEFGAB";
int p1 = strchr(ordine, m.nota1) - ordine;
int p2 = strchr(ordine, m.nota2) - ordine;
if (abs(p1 - p2) == 2) cout << "TERTA\\n"; else cout << "NU\\n";
`,
      c: `const char ordine[] = "CDEFGAB";
int p1 = strchr(ordine, m.nota1) - ordine;
int p2 = strchr(ordine, m.nota2) - ordine;
if (abs(p1 - p2) == 2) printf("TERTA\\n"); else printf("NU\\n");
`,
      pascal: `ordine := 'CDEFGAB';
p1 := pos(m.nota1, ordine);
p2 := pos(m.nota2, ordine);
if abs(p1 - p2) = 2 then writeln('TERTA') else writeln('NU');
`,
      python: `ordine = 'CDEFGAB'
p1 = ordine.index(m.nota1)
p2 = ordine.index(m.nota2)
print('TERTA' if abs(p1 - p2) == 2 else 'NU')
`,
    },
    tests: ["G B", "C D", "C E"],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-vara-2024-2-3",
    subcategoryId: "vara-2024",
    title: "Bacalaureat Vara 2024, S2.3 - Tablou 9x9 cu doua zone",
    difficulty: "medium",
    tags: ["bacalaureat", "2024", "vara", "subiectul2", "tablouri-bidimensionale"],
    statement:
      "Variabilele i si j sunt de tip intreg, iar variabila a memoreaza un tablou bidimensional cu 9 linii si 9 coloane, numerotate incepand de la 0, avand initial toate elementele nule.\n\n" +
      "Scrieti secventa de instructiuni de mai jos, inlocuind punctele de suspensie cu instructiuni adecvate, astfel incat, in urma executarii secventei obtinute, variabila a sa memoreze tabloul:\n\n" +
      "4 4 4 4 2 2 2 2 2\n4 4 4 2 2 2 2 2 2\n4 4 2 2 2 2 2 2 2\n4 2 2 2 2 2 2 2 2\n2 2 2 2 2 2 2 2 2\n2 2 2 2 2 2 2 4 4\n2 2 2 2 2 2 4 4 4\n2 2 2 2 2 4 4 4 4\n2 2 2 2 4 4 4 4 4\n\n" +
      "for(i=0;i<9;i++)\n  for(j=0;j<9;j++)\n    ..................",
    input_format: "Fara date de intrare.",
    output_format: "Cele 9 linii ale tabloului a, elementele separate prin cate un spatiu.",
    constraints: "Dimensiune fixa 9x9.",
    hints: "a[i][j] = 4 daca i+j<4 sau i+j>=12, altfel 2.",
    explanation: "Doua zone triunghiulare (coltul stanga-sus si coltul dreapta-jos) au valoarea 4, restul 2.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int a[9][9];
    int i, j;
    for (i = 0; i < 9; i++)
        for (j = 0; j < 9; j++)
            __USER_CODE__
    for (i = 0; i < 9; i++) {
        for (j = 0; j < 9; j++) cout << a[i][j] << (j < 8 ? " " : "");
        cout << "\\n";
    }
    return 0;
}
`,
      c: `#include <stdio.h>
int main() {
    int a[9][9];
    int i, j;
    for (i = 0; i < 9; i++)
        for (j = 0; j < 9; j++)
            __USER_CODE__
    for (i = 0; i < 9; i++) {
        for (j = 0; j < 9; j++) printf("%d%s", a[i][j], j < 8 ? " " : "");
        printf("\\n");
    }
    return 0;
}
`,
      pascal: `program solution;
var
  a: array[0..8,0..8] of integer;
  i, j: integer;
begin
  for i := 0 to 8 do
    for j := 0 to 8 do
      __USER_CODE__
  for i := 0 to 8 do begin
    for j := 0 to 8 do begin
      write(a[i,j]);
      if j < 8 then write(' ');
    end;
    writeln;
  end;
end.
`,
      python: `a = [[None]*9 for _ in range(9)]
for i in range(9):
    for j in range(9):
        __USER_CODE__
for i in range(9):
    print(' '.join(str(a[i][j]) for j in range(9)))
`,
    },
    solutions: {
      cpp: `a[i][j] = (i + j < 4 || i + j >= 12) ? 4 : 2;
`,
      c: `a[i][j] = (i + j < 4 || i + j >= 12) ? 4 : 2;
`,
      pascal: `if (i + j < 4) or (i + j >= 12) then a[i,j] := 4 else a[i,j] := 2;
`,
      python: `a[i][j] = 4 if (i + j < 4 or i + j >= 12) else 2
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
