const { runMain, buildDimChecker } = require("./lib/bac-subiectul2-runner");

const LEVEL = "bacalaureat";
const CHAPTER = { id: "bacalaureat-2023", name: "Bacalaureat 2023" };
const SRC = "Bacalaureat Informatica MI 2023 (Ministerul Educatiei / CNPEE) - Subiectul II";

const IO_STDIN = { input_source: "stdin", output_target: "stdout", input_filename: null, output_filename: null };

const problems = [
  {
    slug: "bac-model-2023-2-2",
    subcategoryId: "model-2023",
    title: "Bacalaureat Model 2023, S2.2 - Echipe sortate dupa rezultat",
    difficulty: "medium",
    tags: ["bacalaureat", "2023", "model", "subiectul2", "structuri", "secventa-instructiuni"],
    statement:
      "Variabila c, declarata alaturat, permite accesul la datele fiecareia dintre cele trei echipe participante la ultima etapa a unui concurs: numele si rezultatul (numar natural din intervalul [0,100]); cele trei echipe au rezultate distincte.\n\n" +
      "struct echipa { char nume[50]; int rezultat; } c[3];\n\n" +
      "Scrieti o secventa de instructiuni in urma executarii careia sa se afiseze pe ecran, separate prin cate un spatiu, numele celor trei echipe, in ordinea descrescatoare a rezultatelor obtinute.",
    input_format: "Se citesc, cate unul pe linie: numele si rezultatul pentru fiecare din cele 3 echipe.",
    output_format: "Numele celor trei echipe, separate prin spatiu, in ordinea descrescatoare a rezultatului.",
    constraints: "Rezultatele sunt distincte.",
    hints: "Sortati tabloul c descrescator dupa rezultat (de exemplu prin selectie), apoi afisati numele.",
    explanation: "Se compara fiecare pereche (i,j) si se interschimba complet elementele c[i], c[j] daca nu sunt in ordine descrescatoare dupa rezultat.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
struct echipa { char nume[50]; int rezultat; } c[3], tmp;
int i, j;
int main() {
    for (i = 0; i < 3; i++) { cin >> c[i].nume >> c[i].rezultat; }
    __USER_CODE__
    return 0;
}
`,
      c: `#include <stdio.h>
struct echipa { char nume[50]; int rezultat; } c[3], tmp;
int i, j;
int main() {
    for (i = 0; i < 3; i++) { scanf("%s %d", c[i].nume, &c[i].rezultat); }
    __USER_CODE__
    return 0;
}
`,
      pascal: `program solution;
type
  echipa = record
    nume: string;
    rezultat: longint;
  end;
var
  c: array[0..2] of echipa;
  tmp: echipa;
  i, j: integer;
begin
  for i := 0 to 2 do begin
    readln(c[i].nume);
    readln(c[i].rezultat);
  end;
  __USER_CODE__
end.
`,
      python: `from types import SimpleNamespace
c = []
for _ in range(3):
    nume = input().strip()
    rezultat = int(input())
    c.append(SimpleNamespace(nume=nume, rezultat=rezultat))
i = j = 0
tmp = None
__USER_CODE__
`,
    },
    solutions: {
      cpp: `for (i = 0; i < 3; i++)
    for (j = i + 1; j < 3; j++)
        if (c[j].rezultat > c[i].rezultat) { tmp = c[i]; c[i] = c[j]; c[j] = tmp; }
for (i = 0; i < 3; i++) cout << c[i].nume << (i < 2 ? " " : "\\n");
`,
      c: `for (i = 0; i < 3; i++)
    for (j = i + 1; j < 3; j++)
        if (c[j].rezultat > c[i].rezultat) { tmp = c[i]; c[i] = c[j]; c[j] = tmp; }
for (i = 0; i < 3; i++) printf("%s%s", c[i].nume, i < 2 ? " " : "\\n");
`,
      pascal: `for i := 0 to 2 do
  for j := i + 1 to 2 do
    if c[j].rezultat > c[i].rezultat then begin
      tmp := c[i]; c[i] := c[j]; c[j] := tmp;
    end;
for i := 0 to 2 do begin
  write(c[i].nume);
  if i < 2 then write(' ') else writeln;
end;
`,
      python: `for i in range(3):
        for j in range(i + 1, 3):
            if c[j].rezultat > c[i].rezultat:
                tmp = c[i]; c[i] = c[j]; c[j] = tmp
print(' '.join(x.nume for x in c))
`,
    },
    tests: ["RomaniaU\n45\nItalia\n78\nSpania\n60", "Alfa\n10\nBeta\n90\nGama\n50", "X\n100\nY\n99\nZ\n1"],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-simulare-2023-2-3",
    subcategoryId: "simulare-2023",
    title: "Bacalaureat Simulare 2023, S2.3 - Tablou 5x5 cu maxime",
    difficulty: "medium",
    tags: ["bacalaureat", "2023", "simulare", "subiectul2", "tablouri-bidimensionale"],
    statement:
      "Variabilele i si j sunt de tip intreg, iar variabila a memoreaza un tablou bidimensional cu 5 linii si 5 coloane, numerotate de la 1 la 5, avand initial toate elementele nule.\n\n" +
      "Fara a utiliza alte variabile decat cele mentionate, scrieti secventa de instructiuni de mai jos, inlocuind punctele de suspensie astfel incat, in urma executarii secventei obtinute, variabila a sa memoreze tabloul:\n\n" +
      "4 3 2 1 0\n4 3 2 1 1\n4 3 2 2 2\n4 3 3 3 3\n4 4 4 4 4\n\n" +
      "for(i=1;i<=5;i++)\n  for(j=1;j<=5;j++)\n    ..................",
    input_format: "Fara date de intrare.",
    output_format: "Cele 5 linii ale tabloului a, elementele separate prin cate un spatiu.",
    constraints: "Dimensiune fixa 5x5, indexare de la 1.",
    hints: "a[i][j] = max(i-1, 5-j).",
    explanation: "Formula max(i-1,5-j) genereaza exact tabloul dat, verificabil pe fiecare linie si coloana.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int a[6][6];
    int i, j;
    for (i = 1; i <= 5; i++)
        for (j = 1; j <= 5; j++)
            __USER_CODE__
    for (i = 1; i <= 5; i++) {
        for (j = 1; j <= 5; j++) cout << a[i][j] << (j < 5 ? " " : "");
        cout << "\\n";
    }
    return 0;
}
`,
      c: `#include <stdio.h>
int main() {
    int a[6][6];
    int i, j;
    for (i = 1; i <= 5; i++)
        for (j = 1; j <= 5; j++)
            __USER_CODE__
    for (i = 1; i <= 5; i++) {
        for (j = 1; j <= 5; j++) printf("%d%s", a[i][j], j < 5 ? " " : "");
        printf("\\n");
    }
    return 0;
}
`,
      pascal: `program solution;
var
  a: array[1..5,1..5] of integer;
  i, j: integer;
begin
  for i := 1 to 5 do
    for j := 1 to 5 do
      __USER_CODE__
  for i := 1 to 5 do begin
    for j := 1 to 5 do begin
      write(a[i,j]);
      if j < 5 then write(' ');
    end;
    writeln;
  end;
end.
`,
      python: `a = [[None]*6 for _ in range(6)]
for i in range(1, 6):
    for j in range(1, 6):
        __USER_CODE__
for i in range(1, 6):
    print(' '.join(str(a[i][j]) for j in range(1, 6)))
`,
    },
    solutions: {
      cpp: `a[i][j] = max(i - 1, 5 - j);
`,
      c: `a[i][j] = (i - 1 > 5 - j) ? (i - 1) : (5 - j);
`,
      pascal: `if i - 1 > 5 - j then a[i,j] := i - 1 else a[i,j] := 5 - j;
`,
      python: `a[i][j] = max(i - 1, 5 - j)
`,
    },
    tests: [""],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-speciala-2023-2-3",
    subcategoryId: "speciala-2023",
    title: "Bacalaureat Speciala 2023, S2.3 - Prefixe terminate cu prima litera",
    difficulty: "medium",
    tags: ["bacalaureat", "2023", "speciala", "subiectul2", "siruri-caractere"],
    statement:
      "Un sir de caractere a este numit prefix al unui sir de caractere b daca este identic cu b sau daca b se obtine din a prin adaugarea la dreapta a unor alte caractere.\n\n" +
      "Variabila k este de tip intreg, iar variabila s permite accesul la un sir de cel mult 20 de caractere. Scrieti secventa de instructiuni de mai jos, inlocuind punctele de suspensie astfel incat, in urma executarii secventei obtinute, sa se afiseze pe ecran, in ordinea descrescatoare a lungimii, separate prin cate un spatiu, toate prefixele sirului accesat prin variabila s, fiecare incheindu-se cu prima litera a sirului s. Declarati eventualele alte variabile utilizate.\n\n" +
      "Exemplu: pentru sirul elemente se afiseaza: elemente eleme ele e\n\n" +
      "for(k=strlen(s)-1;k>=0;k--)\n{..................}",
    input_format: "Se citeste sirul s.",
    output_format: "Prefixele cerute, separate prin spatiu.",
    constraints: "Sir de cel mult 20 de caractere.",
    hints: "Un prefix s[0..k] se afiseaza doar daca s[k]==s[0] (ultimul sau caracter e chiar prima litera a lui s).",
    explanation: "Se parcurge k descrescator de la strlen(s)-1 la 0; daca s[k]==s[0], se afiseaza substringul s[0..k].",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
#include <cstring>
using namespace std;
char s[30];
int k;
int main() {
    cin >> s;
    for (k = strlen(s) - 1; k >= 0; k--)
    {
        __USER_CODE__
    }
    cout << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
#include <string.h>
char s[30];
int k;
int main() {
    scanf("%s", s);
    for (k = strlen(s) - 1; k >= 0; k--)
    {
        __USER_CODE__
    }
    printf("\\n");
    return 0;
}
`,
      pascal: `program solution;
var
  s: string;
  k, t: integer;
begin
  readln(s);
  for k := length(s) - 1 downto 0 do
  begin
    __USER_CODE__
  end;
  writeln;
end.
`,
      python: `s = input().strip()
k = 0
out = []
__USER_CODE__
print(' '.join(out))
`,
    },
    solutions: {
      cpp: `if (s[k] == s[0]) {
    for (int t = 0; t <= k; t++) cout << s[t];
    cout << ' ';
}
`,
      c: `if (s[k] == s[0]) {
    int t;
    for (t = 0; t <= k; t++) printf("%c", s[t]);
    printf(" ");
}
`,
      pascal: `if s[k+1] = s[1] then begin
  for t := 0 to k do write(s[t+1]);
  write(' ');
end;
`,
      python: `for k in range(len(s) - 1, -1, -1):
        if s[k] == s[0]:
            out.append(s[0:k+1])
`,
    },
    tests: ["elemente", "aaaa", "abcabc"],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-toamna-2023-2-3",
    subcategoryId: "toamna-2023",
    title: "Bacalaureat Toamna 2023, S2.3 - Prima litera sau *",
    difficulty: "easy",
    tags: ["bacalaureat", "2023", "toamna", "subiectul2", "structuri", "secventa-instructiuni"],
    statement:
      "Variabila p, declarata alaturat, memoreaza caracteristicile unui produs: denumire si pret.\n\n" +
      "struct produs { char denumire[20]; int pret; } p; char a;\n\n" +
      "Scrieti o secventa de instructiuni C/C++ prin care variabila a memoreaza valoarea primei litere a denumirii produsului, daca acesta are pretul strict mai mic decat 100, sau caracterul * in caz contrar.",
    input_format: "Se citesc denumirea (pe o linie) si pretul (pe linia urmatoare).",
    output_format: "Se afiseaza valoarea variabilei a.",
    constraints: "-",
    hints: "Verificati p.pret < 100 si alegeti p.denumire[0] sau '*'.",
    explanation: "Se compara p.pret cu 100 si se atribuie lui a fie prima litera a denumirii, fie caracterul *.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
struct produs { char denumire[20]; int pret; } p;
char a;
int main() {
    cin >> p.denumire >> p.pret;
    __USER_CODE__
    cout << a << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
struct produs { char denumire[20]; int pret; } p;
char a;
int main() {
    scanf("%s %d", p.denumire, &p.pret);
    __USER_CODE__
    printf("%c\\n", a);
    return 0;
}
`,
      pascal: `program solution;
type
  produs = record
    denumire: string;
    pret: longint;
  end;
var
  p: produs;
  a: char;
begin
  readln(p.denumire);
  readln(p.pret);
  __USER_CODE__
  writeln(a);
end.
`,
      python: `from types import SimpleNamespace
denumire = input().strip()
pret = int(input())
p = SimpleNamespace(denumire=denumire, pret=pret)
a = ''
__USER_CODE__
print(a)
`,
    },
    solutions: {
      cpp: `if (p.pret < 100) a = p.denumire[0]; else a = '*';
`,
      c: `if (p.pret < 100) a = p.denumire[0]; else a = '*';
`,
      pascal: `if p.pret < 100 then a := p.denumire[1] else a := '*';
`,
      python: `a = p.denumire[0] if p.pret < 100 else '*'
`,
    },
    tests: ["Laptop\n2500", "Pix\n5", "Guma\n99"],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-vara-2023-2-2",
    subcategoryId: "vara-2023",
    title: "Bacalaureat Vara 2023, S2.2 - Structura lalea",
    difficulty: "easy",
    tags: ["bacalaureat", "2023", "vara", "subiectul2", "structuri"],
    statement:
      "Variabila f memoreaza, pentru fiecare dintre cele 10 soiuri de lalele care se vand intr-o floarie, caracteristicile acestora: denumirea (sir de maximum 20 de caractere) si stocul, exprimat prin numarul de fire si pretul unui fir, in lei (numere naturale).\n\n" +
      "Scrieti in limbajul C/C++ definitia unei structuri cu eticheta lalea, care sa permita memorarea informatiilor mentionate pentru un soi de lalea, si declarati corespunzator variabila f.\n\n" +
      "Codul de verificare va folosi expresiile f[0].denumire si f[0].stoc.nrFire*f[0].stoc.pretFir.",
    input_format: "Se citesc denumirea (pe o linie), apoi un indice idx, nrFire si pretFir (pe linia urmatoare).",
    output_format: "Se afiseaza f[idx].denumire, f[idx].stoc.nrFire*f[idx].stoc.pretFir si numarul de elemente ale tabloului f, separate prin spatiu.",
    constraints: "-",
    hints: "Aveti nevoie de o structura imbricata: stoc are campurile nrFire si pretFir. Nu uitati ca f trebuie sa aiba exact 10 elemente (idx poate fi si 9).",
    explanation: "Structura lalea contine denumire (sir) si stoc (structura cu nrFire si pretFir, intregi). Verificarea foloseste un indice variabil, inclusiv ultima pozitie valida.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    checkerCode: buildDimChecker([10]),
    templates: {
      cpp: `#include <bits/stdc++.h>
#include <cstring>
using namespace std;
__USER_CODE__
int main() {
    char denTmp[25];
    int idx;
    cin >> denTmp;
    cin >> idx >> f[idx].stoc.nrFire >> f[idx].stoc.pretFir;
    strcpy(f[idx].denumire, denTmp);
    int dim = sizeof(f) / sizeof(f[0]);
    cout << f[idx].denumire << " " << (f[idx].stoc.nrFire * f[idx].stoc.pretFir) << " " << dim << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
#include <string.h>
__USER_CODE__
int main() {
    char denTmp[25];
    int idx;
    scanf("%s", denTmp);
    scanf("%d", &idx);
    scanf("%d %d", &f[idx].stoc.nrFire, &f[idx].stoc.pretFir);
    strcpy(f[idx].denumire, denTmp);
    int dim = (int)(sizeof(f) / sizeof(f[0]));
    printf("%s %d %d\\n", f[idx].denumire, f[idx].stoc.nrFire * f[idx].stoc.pretFir, dim);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
var dim, idx: longint;
    denTmp: string;
begin
  readln(denTmp);
  readln(idx, f[idx].stoc.nrFire, f[idx].stoc.pretFir);
  f[idx].denumire := denTmp;
  dim := High(f) - Low(f) + 1;
  writeln(f[idx].denumire, ' ', f[idx].stoc.nrFire * f[idx].stoc.pretFir, ' ', dim);
end.
`,
    },
    solutions: {
      cpp: `struct stocTip { int nrFire, pretFir; };
struct lalea {
    char denumire[20];
    stocTip stoc;
} f[10];
`,
      c: `struct stocTip { int nrFire, pretFir; };
struct lalea {
    char denumire[20];
    struct stocTip stoc;
} f[10];
`,
      pascal: `type
  stocTip = record
    nrFire, pretFir: longint;
  end;
  lalea = record
    denumire: string;
    stoc: stocTip;
  end;
var
  f: array[0..9] of lalea;
`,
    },
    tests: ["Rosii\n0 100 5", "Albe\n0 40 12", "Galbene\n9 7 3", "Roz\n0 100000 3"],
    time_limit_ms: 1000,
  },
];

runMain(problems, LEVEL, CHAPTER, SRC).catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
