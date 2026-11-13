const { runMain, buildDimChecker } = require("./lib/bac-subiectul2-runner");

const LEVEL = "bacalaureat";
const CHAPTER = { id: "bacalaureat-2020", name: "Bacalaureat 2020" };
const SRC = "Bacalaureat Informatica MI 2020 (Ministerul Educatiei / CNPEE) - Subiectul II";

const IO_STDIN = { input_source: "stdin", output_target: "stdout", input_filename: null, output_filename: null };

const problems = [
  // ===================== MODEL 2020 =====================
  {
    slug: "bac-model-2020-2-2",
    subcategoryId: "model-2020",
    title: "Bacalaureat Model 2020, S2.2 - Structura parcare",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "model", "subiectul2", "structuri"],
    statement:
      "Variabila p memoreaza, pentru fiecare dintre cele 20 de zone de parcare ale unui oras, urmatoarele date specifice: identificatorul zonei, numarul de locuri inchiriate pe parcursul lunii curente, precum si pretul practicat in zona respectiva pentru inchirierea unui loc pentru o luna.\n\n" +
      "Scrieti definitia unei structuri cu eticheta parcare, care sa permita memorarea datelor specifice unei zone de parcare, si declarati corespunzator variabila p.\n\n" +
      "Codul de verificare va folosi expresiile p[0].id (identificatorul primei zone) si p[0].numar*p[0].pret (suma obtinuta din inchirierea tuturor locurilor din prima zona).",
    input_format: "Se citesc, separate prin spatiu: un indice idx, apoi id, numar si pret pentru p[idx].",
    output_format: "Se afiseaza p[idx].id, p[idx].numar*p[idx].pret si numarul de elemente ale tabloului p, separate printr-un spatiu.",
    constraints: "Toate valorile sunt numere naturale.",
    hints: "Campurile trebuie sa se numeasca exact id, numar si pret, la fel ca in expresiile din enunt. Nu uitati ca p trebuie sa aiba exact 20 de elemente (idx poate fi si 19).",
    explanation:
      "Structura parcare are 3 campuri intregi: id, numar si pret. Variabila p este un tablou de 20 de elemente de acest tip. Verificarea foloseste un indice variabil (nu doar 0) si citeste inclusiv ultima pozitie valida, ca sa se verifice atat numele campurilor cat si dimensiunea reala a tabloului.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    checkerCode: buildDimChecker([20]),
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int idx;
    cin >> idx;
    cin >> p[idx].id >> p[idx].numar >> p[idx].pret;
    int dim = sizeof(p) / sizeof(p[0]);
    cout << p[idx].id << " " << (p[idx].numar * p[idx].pret) << " " << dim << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    int idx;
    scanf("%d", &idx);
    scanf("%d %d %d", &p[idx].id, &p[idx].numar, &p[idx].pret);
    int dim = (int)(sizeof(p) / sizeof(p[0]));
    printf("%d %d %d\\n", p[idx].id, p[idx].numar * p[idx].pret, dim);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
var dim, idx: longint;
begin
  read(idx);
  readln(p[idx].id, p[idx].numar, p[idx].pret);
  dim := High(p) - Low(p) + 1;
  writeln(p[idx].id, ' ', p[idx].numar * p[idx].pret, ' ', dim);
end.
`,
    },
    solutions: {
      cpp: `struct parcare {
    int id;
    int numar;
    int pret;
} p[20];
`,
      c: `struct parcare {
    int id;
    int numar;
    int pret;
} p[20];
`,
      pascal: `type
  parcare = record
    id, numar, pret: longint;
  end;
var
  p: array[0..19] of parcare;
`,
    },
    tests: ["0 7 40 25", "0 1 5 12", "19 20 5 99", "0 2000000000 1 1"],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-model-2020-2-3",
    subcategoryId: "model-2020",
    title: "Bacalaureat Model 2020, S2.3 - Linii cu 2020 la capete",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "model", "subiectul2", "tablouri-bidimensionale"],
    statement:
      "Variabila i este de tip intreg, iar variabila a memoreaza un tablou bidimensional cu 5 linii si 7 coloane, numerotate incepand cu 0, cu elemente numere intregi. Fara a utiliza alte variabile decat cele mentionate, scrieti o secventa de instructiuni in urma executarii careia sa se afiseze pe ecran, separate prin cate un spatiu, indicii liniilor cu proprietatea ca primul sau ultimul lor element are valoarea 2020.",
    input_format: "Se citesc cele 35 de elemente ale tabloului a (5 linii x 7 coloane), in ordinea liniilor.",
    output_format: "Indicii liniilor cerute, separati printr-un spatiu (sau nimic, daca nu exista astfel de linii).",
    constraints: "Elemente numere intregi.",
    hints: "Parcurgeti liniile cu variabila i si verificati a[i][0]==2020 sau a[i][6]==2020.",
    explanation: "Se parcurg cele 5 linii; pentru fiecare, se verifica primul (coloana 0) si ultimul (coloana 6) element.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int a[5][7];
    int i;
    for (int r = 0; r < 5; r++) for (int c = 0; c < 7; c++) cin >> a[r][c];
    __USER_CODE__
    cout << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
int main() {
    int a[5][7];
    int i;
    for (int r = 0; r < 5; r++) for (int c = 0; c < 7; c++) scanf("%d", &a[r][c]);
    __USER_CODE__
    printf("\\n");
    return 0;
}
`,
      pascal: `program solution;
var
  a: array[0..4,0..6] of integer;
  i, r, c: integer;
begin
  for r := 0 to 4 do
    for c := 0 to 6 do
      read(a[r,c]);
  __USER_CODE__
  writeln;
end.
`,
      python: `import sys
data = list(map(int, sys.stdin.read().split()))
a = [data[r*7:(r+1)*7] for r in range(5)]
i = 0
out = []
__USER_CODE__
print(' '.join(out))
`,
    },
    solutions: {
      cpp: `for (i = 0; i < 5; i++)
    if (a[i][0] == 2020 || a[i][6] == 2020)
        cout << i << " ";
`,
      c: `for (i = 0; i < 5; i++)
    if (a[i][0] == 2020 || a[i][6] == 2020)
        printf("%d ", i);
`,
      pascal: `for i := 0 to 4 do
  if (a[i,0] = 2020) or (a[i,6] = 2020) then
    write(i, ' ');
`,
      python: `for i in range(5):
        if a[i][0] == 2020 or a[i][6] == 2020:
            out.append(str(i))
`,
    },
    tests: [
      "2020 1 2 3 4 5 6\n1 2 3 4 5 6 2020\n1 2 3 4 5 6 7\n5 5 5 5 5 5 5\n2020 2 3 4 5 6 2020",
      "0 0 0 0 0 0 0\n1 1 1 1 1 1 1\n2 2 2 2 2 2 2\n3 3 3 3 3 3 3\n4 4 4 4 4 4 4",
      "2020 1 1 1 1 1 1\n2020 2 2 2 2 2 2\n2020 3 3 3 3 3 3\n2020 4 4 4 4 4 4\n2020 5 5 5 5 5 5",
    ],
    time_limit_ms: 1000,
  },
  // ===================== SPECIALA 2020 =====================
  {
    slug: "bac-speciala-2020-2-2",
    subcategoryId: "speciala-2020",
    title: "Bacalaureat Speciala 2020, S2.2 - Structura figura (cerc)",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "speciala", "subiectul2", "structuri"],
    statement:
      "Variabila c memoreaza date specifice unui cerc: coordonatele reale (abscisa si ordonata), in planul xOy, ale centrului cercului, precum si lungimea razei acestuia.\n\n" +
      "Scrieti definitia unei structuri cu eticheta figura, care permite memorarea datelor precizate, si declarati corespunzator variabila c.\n\n" +
      "Codul de verificare va folosi expresiile c.centru.x, c.centru.y si c.raza.",
    input_format: "Se citesc, separate prin spatiu, x, y si raza.",
    output_format: "Se afiseaza c.centru.x, c.centru.y si c.raza, fiecare cu doua zecimale, separate prin spatiu.",
    constraints: "Valori reale.",
    hints: "Aveti nevoie de o structura imbricata: centru are campurile x si y, iar figura are campurile centru si raza.",
    explanation: "Structura figura contine un camp centru de tip structura (cu x si y reale) si un camp raza real.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    cin >> c.centru.x >> c.centru.y >> c.raza;
    printf("%.2f %.2f %.2f\\n", c.centru.x, c.centru.y, c.raza);
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    scanf("%lf %lf %lf", &c.centru.x, &c.centru.y, &c.raza);
    printf("%.2f %.2f %.2f\\n", c.centru.x, c.centru.y, c.raza);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
begin
  readln(c.centru.x, c.centru.y, c.raza);
  writeln(c.centru.x:0:2, ' ', c.centru.y:0:2, ' ', c.raza:0:2);
end.
`,
    },
    solutions: {
      cpp: `struct punct { double x, y; };
struct figura {
    punct centru;
    double raza;
} c;
`,
      c: `struct punct { double x, y; };
struct figura {
    struct punct centru;
    double raza;
} c;
`,
      pascal: `type
  punct = record
    x, y: real;
  end;
  figura = record
    centru: punct;
    raza: real;
  end;
var
  c: figura;
`,
    },
    tests: ["3 4 5", "-2.5 1.5 10", "0 0 1", "1234567.89 -7654321.12 999999.99"],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-speciala-2020-2-3",
    subcategoryId: "speciala-2020",
    title: "Bacalaureat Speciala 2020, S2.3 - Tablou triunghiular de litere",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "speciala", "subiectul2", "tablouri-bidimensionale"],
    statement:
      "Variabilele i si j sunt de tip intreg, iar variabila m memoreaza un tablou bidimensional cu 7 linii si 7 coloane, numerotate de la 0 la 6, cu elemente de tip char. Initial, fiecare element memoreaza caracterul *. Fara a utiliza alte variabile, scrieti secventa de mai jos, inlocuind punctele de suspensie astfel incat, in urma executarii secventei obtinute, variabila m sa memoreze tabloul:\n\n" +
      "a b c d e f g\n+ a b c d e f\n+ + a b c d e\n+ + + a b c d\n+ + + + a b c\n+ + + + + a b\n+ + + + + + a\n\n" +
      "for(i=0;i<7;i++)\n  for(j=0;j<7;j++)\n    ..................",
    input_format: "Fara date de intrare.",
    output_format: "Cele 7 linii ale tabloului m, elementele fiecarei linii separate prin cate un spatiu.",
    constraints: "Dimensiune fixa 7x7.",
    hints: "Pe si sub diagonala principala (j<i) apare '+'; pe si deasupra diagonalei (j>=i) apare litera 'a'+(j-i).",
    explanation: "Formula m[i][j] = (j<i) ? '+' : ('a'+(j-i)) genereaza exact tabloul cerut.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    char m[7][7];
    int i, j;
    for (i = 0; i < 7; i++)
        for (j = 0; j < 7; j++)
            __USER_CODE__
    for (i = 0; i < 7; i++) {
        for (j = 0; j < 7; j++) cout << m[i][j] << (j < 6 ? " " : "");
        cout << "\\n";
    }
    return 0;
}
`,
      c: `#include <stdio.h>
int main() {
    char m[7][7];
    int i, j;
    for (i = 0; i < 7; i++)
        for (j = 0; j < 7; j++)
            __USER_CODE__
    for (i = 0; i < 7; i++) {
        for (j = 0; j < 7; j++) printf("%c%s", m[i][j], j < 6 ? " " : "");
        printf("\\n");
    }
    return 0;
}
`,
      pascal: `program solution;
var
  m: array[0..6,0..6] of char;
  i, j: integer;
begin
  for i := 0 to 6 do
    for j := 0 to 6 do
      __USER_CODE__
  for i := 0 to 6 do begin
    for j := 0 to 6 do begin
      write(m[i,j]);
      if j < 6 then write(' ');
    end;
    writeln;
  end;
end.
`,
      python: `m = [[None]*7 for _ in range(7)]
for i in range(7):
    for j in range(7):
        __USER_CODE__
for i in range(7):
    print(' '.join(m[i]))
`,
    },
    solutions: {
      cpp: `if (j < i) m[i][j] = '+'; else m[i][j] = 'a' + (j - i);
`,
      c: `if (j < i) m[i][j] = '+'; else m[i][j] = 'a' + (j - i);
`,
      pascal: `if j < i then m[i,j] := '+' else m[i,j] := chr(ord('a') + j - i);
`,
      python: `m[i][j] = '+' if j < i else chr(ord('a') + j - i)
`,
    },
    tests: [""],
    time_limit_ms: 1000,
  },
  // ===================== TOAMNA 2020 =====================
  {
    slug: "bac-toamna-2020-2-2",
    subcategoryId: "toamna-2020",
    title: "Bacalaureat Toamna 2020, S2.2 - Structura procesor",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "toamna", "subiectul2", "structuri"],
    statement:
      "Variabila p memoreaza simultan, pentru fiecare dintre cele 20 de tipuri de procesoare dintr-un depozit, urmatoarele date: producatorul (o litera mare a alfabetului englez), frecventa procesorului (numar natural) si pretul produsului (numar real).\n\n" +
      "Scrieti definitia unei structuri cu eticheta procesor, care permite memorarea datelor despre un procesor, si declarati corespunzator variabila p.\n\n" +
      "Codul de verificare va folosi expresiile p[0].producator, p[0].frecventa si p[0].pret.",
    input_format: "Se citesc producator (litera), frecventa (intreg), pret (real) si un indice idx, in aceasta ordine.",
    output_format: "Se afiseaza p[idx].producator, p[idx].frecventa, p[idx].pret (2 zecimale) si numarul de elemente ale tabloului p, separate prin spatiu.",
    constraints: "-",
    hints: "Campurile trebuie sa se numeasca exact producator, frecventa si pret. Nu uitati ca p trebuie sa aiba exact 20 de elemente (idx poate fi si 19).",
    explanation: "Structura procesor: producator (char), frecventa (int), pret (real). Verificarea foloseste un indice variabil, inclusiv ultima pozitie valida, ca sa se testeze si dimensiunea reala a tabloului.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    checkerCode: buildDimChecker([20]),
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    char prodTmp; int freqTmp; double pretTmp; int idx;
    cin >> prodTmp >> freqTmp >> pretTmp >> idx;
    p[idx].producator = prodTmp; p[idx].frecventa = freqTmp; p[idx].pret = pretTmp;
    int dim = sizeof(p) / sizeof(p[0]);
    printf("%c %d %.2f %d\\n", p[idx].producator, p[idx].frecventa, p[idx].pret, dim);
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    char prodTmp; int freqTmp; double pretTmp; int idx;
    scanf(" %c %d %lf %d", &prodTmp, &freqTmp, &pretTmp, &idx);
    p[idx].producator = prodTmp; p[idx].frecventa = freqTmp; p[idx].pret = pretTmp;
    int dim = (int)(sizeof(p) / sizeof(p[0]));
    printf("%c %d %.2f %d\\n", p[idx].producator, p[idx].frecventa, p[idx].pret, dim);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
var dim, idx, freqTmp: longint;
    prodTmp: char;
    pretTmp: real;
begin
  read(prodTmp, freqTmp, pretTmp, idx);
  p[idx].producator := prodTmp; p[idx].frecventa := freqTmp; p[idx].pret := pretTmp;
  dim := High(p) - Low(p) + 1;
  writeln(p[idx].producator, ' ', p[idx].frecventa, ' ', p[idx].pret:0:2, ' ', dim);
end.
`,
    },
    solutions: {
      cpp: `struct procesor {
    char producator;
    int frecventa;
    double pret;
} p[20];
`,
      c: `struct procesor {
    char producator;
    int frecventa;
    double pret;
} p[20];
`,
      pascal: `type
  procesor = record
    producator: char;
    frecventa: longint;
    pret: real;
  end;
var
  p: array[0..19] of procesor;
`,
    },
    tests: ["A 3200 199.99 0", "Z 1000 0.5 0", "M 4500 1200 19", "K 2000000000 1.5 0"],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-toamna-2020-2-3",
    subcategoryId: "toamna-2020",
    title: "Bacalaureat Toamna 2020, S2.3 - Sortarea elementelor pare de pe o coloana",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "toamna", "subiectul2", "tablouri-bidimensionale"],
    statement:
      "Variabilele i, j si k sunt de tip intreg, iar variabila a memoreaza un tablou bidimensional cu 6 linii si 4 coloane, numerotate incepand de la 0, cu elemente numere naturale din intervalul [0,50].\n\n" +
      "Scrieti o secventa de instructiuni in urma executarii careia sa se rearanjeze elementele pare situate pe coloana a 3-a (indexul 2) a tabloului, astfel incat acestea sa fie ordonate crescator, de sus in jos, in cadrul aceleiasi coloane, iar celelalte elemente ale tabloului sa isi pastreze pozitiile.",
    input_format: "Se citesc cele 24 de elemente ale tabloului a (6 linii x 4 coloane).",
    output_format: "Tabloul a dupa rearanjare, 6 linii, elementele fiecarei linii separate prin spatiu.",
    constraints: "Elemente in [0,50].",
    hints: "Pastreaza pozitiile elementelor impare si ale celor de pe alte coloane; ordoneaza doar valorile pare de pe coloana 2, in pozitiile lor originale.",
    explanation: "Se compara perechi de linii i<j; daca ambele au valori pare pe coloana 2 si nu sunt in ordine crescatoare, se interschimba.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int a[6][4];
    int i, j, k;
    for (int r = 0; r < 6; r++) for (int c = 0; c < 4; c++) cin >> a[r][c];
    __USER_CODE__
    for (i = 0; i < 6; i++) {
        for (j = 0; j < 4; j++) cout << a[i][j] << (j < 3 ? " " : "");
        cout << "\\n";
    }
    return 0;
}
`,
      c: `#include <stdio.h>
int main() {
    int a[6][4];
    int i, j, k;
    for (int r = 0; r < 6; r++) for (int c = 0; c < 4; c++) scanf("%d", &a[r][c]);
    __USER_CODE__
    for (i = 0; i < 6; i++) {
        for (j = 0; j < 4; j++) printf("%d%s", a[i][j], j < 3 ? " " : "");
        printf("\\n");
    }
    return 0;
}
`,
      pascal: `program solution;
var
  a: array[0..5,0..3] of integer;
  i, j, k, r, c: integer;
begin
  for r := 0 to 5 do
    for c := 0 to 3 do
      read(a[r,c]);
  __USER_CODE__
  for i := 0 to 5 do begin
    for j := 0 to 3 do begin
      write(a[i,j]);
      if j < 3 then write(' ');
    end;
    writeln;
  end;
end.
`,
      python: `import sys
data = list(map(int, sys.stdin.read().split()))
a = [data[r*4:(r+1)*4] for r in range(6)]
i = j = k = 0
__USER_CODE__
for row in a:
    print(' '.join(map(str, row)))
`,
    },
    solutions: {
      cpp: `for (i = 0; i < 6; i++)
    for (j = i + 1; j < 6; j++)
        if (a[i][2] % 2 == 0 && a[j][2] % 2 == 0 && a[i][2] > a[j][2]) {
            k = a[i][2]; a[i][2] = a[j][2]; a[j][2] = k;
        }
`,
      c: `for (i = 0; i < 6; i++)
    for (j = i + 1; j < 6; j++)
        if (a[i][2] % 2 == 0 && a[j][2] % 2 == 0 && a[i][2] > a[j][2]) {
            k = a[i][2]; a[i][2] = a[j][2]; a[j][2] = k;
        }
`,
      pascal: `for i := 0 to 5 do
  for j := i + 1 to 5 do
    if (a[i,2] mod 2 = 0) and (a[j,2] mod 2 = 0) and (a[i,2] > a[j,2]) then begin
      k := a[i,2]; a[i,2] := a[j,2]; a[j,2] := k;
    end;
`,
      python: `for i in range(6):
        for j in range(i + 1, 6):
            if a[i][2] % 2 == 0 and a[j][2] % 2 == 0 and a[i][2] > a[j][2]:
                a[i][2], a[j][2] = a[j][2], a[i][2]
`,
    },
    tests: [
      "2 3 4 5\n8 7 8 5\n1 3 5 7\n3 0 2 9\n3 5 1 6\n7 3 0 2",
      "10 1 50 1\n2 2 0 2\n3 3 48 3\n4 4 2 4\n5 5 6 5\n6 6 4 6",
      "1 1 1 1\n2 2 3 2\n3 3 5 3\n4 4 7 4\n5 5 9 5\n6 6 11 6",
    ],
    time_limit_ms: 1000,
  },
  // ===================== VARA 2020 =====================
  {
    slug: "bac-vara-2020-2-2",
    subcategoryId: "vara-2020",
    title: "Bacalaureat Vara 2020, S2.2 - Structura calculator",
    difficulty: "easy",
    tags: ["bacalaureat", "2020", "vara", "subiectul2", "structuri"],
    statement:
      "Variabila c memoreaza, pentru un calculator, capacitatea memoriei (interne si externe), masurata in GB, si o litera, corespunzatoare tipului monitorului acestuia.\n\n" +
      "Scrieti definitia unei structuri cu eticheta calculator, care permite memorarea datelor despre un calculator, si declarati corespunzator variabila c.\n\n" +
      "Codul de verificare va folosi expresiile c.monitor, c.memorie.interna si c.memorie.externa.",
    input_format: "Se citesc monitor (litera), memorie interna si memorie externa (intregi din [1,10^6]).",
    output_format: "Se afiseaza c.monitor, c.memorie.interna si c.memorie.externa, separate prin spatiu.",
    constraints: "1 <= memorie <= 10^6",
    hints: "Aveti nevoie de o structura imbricata: memorie are campurile interna si externa.",
    explanation: "Structura calculator contine monitor (char) si memorie (structura cu interna si externa, intregi).",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    cin >> c.monitor >> c.memorie.interna >> c.memorie.externa;
    cout << c.monitor << " " << c.memorie.interna << " " << c.memorie.externa << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    scanf(" %c %d %d", &c.monitor, &c.memorie.interna, &c.memorie.externa);
    printf("%c %d %d\\n", c.monitor, c.memorie.interna, c.memorie.externa);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
begin
  read(c.monitor, c.memorie.interna, c.memorie.externa);
  writeln(c.monitor, ' ', c.memorie.interna, ' ', c.memorie.externa);
end.
`,
    },
    solutions: {
      cpp: `struct memorieTip { int interna, externa; };
struct calculator {
    char monitor;
    memorieTip memorie;
} c;
`,
      c: `struct memorieTip { int interna, externa; };
struct calculator {
    char monitor;
    struct memorieTip memorie;
} c;
`,
      pascal: `type
  memorieTip = record
    interna, externa: longint;
  end;
  calculator = record
    monitor: char;
    memorie: memorieTip;
  end;
var
  c: calculator;
`,
    },
    tests: ["S 500 2000", "L 1 1000000", "T 999999 1"],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-vara-2020-2-3",
    subcategoryId: "vara-2020",
    title: "Bacalaureat Vara 2020, S2.3 - Tablou de simboluri > si <",
    difficulty: "medium",
    tags: ["bacalaureat", "2020", "vara", "subiectul2", "tablouri-bidimensionale"],
    statement:
      "Variabilele i si j sunt de tip intreg, iar variabila a memoreaza un tablou bidimensional cu 9 linii si 9 coloane, numerotate de la 0 la 8, avand initial toate elementele egale cu simbolul egal (=).\n\n" +
      "Scrieti secventa de mai jos, inlocuind punctele de suspensie, astfel incat, in urma executarii secventei obtinute, variabila a sa memoreze tabloul in care primele 5 linii sunt formate numai din '>', iar incepand cu linia 5 apare un grup simetric de '<' centrat pe coloana 4, care creste cu cate o pozitie la fiecare linie (linia 5 are un singur '<' pe coloana 4, linia 8 are '<' pe coloanele 1-7), restul elementelor fiind '>'.\n\n" +
      "for(i=0;i<9;i++)\n  for(j=0;j<9;j++)\n    ..................",
    input_format: "Fara date de intrare.",
    output_format: "Cele 9 linii ale tabloului a, elementele fiecarei linii separate prin cate un spatiu.",
    constraints: "Dimensiune fixa 9x9.",
    hints: "a[i][j] = '<' daca i>=5 si |j-4|<=i-5, altfel '>'. Formula abs(j-4)<=i-5 acopera automat si liniile 0-4 (unde e mereu falsa).",
    explanation: "Se foloseste o singura conditie abs(j-4)<=i-5 care determina zona in forma de V centrata pe coloana 4, incepand cu linia 5.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    char a[9][9];
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
#include <stdlib.h>
int main() {
    char a[9][9];
    int i, j;
    for (i = 0; i < 9; i++)
        for (j = 0; j < 9; j++)
            __USER_CODE__
    for (i = 0; i < 9; i++) {
        for (j = 0; j < 9; j++) printf("%c%s", a[i][j], j < 8 ? " " : "");
        printf("\\n");
    }
    return 0;
}
`,
      pascal: `program solution;
var
  a: array[0..8,0..8] of char;
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
    print(' '.join(a[i]))
`,
    },
    solutions: {
      cpp: `a[i][j] = (abs(j - 4) <= i - 5) ? '<' : '>';
`,
      c: `a[i][j] = (abs(j - 4) <= i - 5) ? '<' : '>';
`,
      pascal: `if abs(j - 4) <= i - 5 then a[i,j] := '<' else a[i,j] := '>';
`,
      python: `a[i][j] = '<' if abs(j - 4) <= i - 5 else '>'
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
