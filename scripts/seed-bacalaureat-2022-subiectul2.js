const { runMain } = require("./lib/bac-subiectul2-runner");

const LEVEL = "bacalaureat";
const CHAPTER = { id: "bacalaureat-2022", name: "Bacalaureat 2022" };
const SRC = "Bacalaureat Informatica MI 2022 (Ministerul Educatiei / CNPEE) - Subiectul II";

const IO_STDIN = { input_source: "stdin", output_target: "stdout", input_filename: null, output_filename: null };

const problems = [
  {
    slug: "bac-model-2022-2-3",
    subcategoryId: "model-2022",
    title: "Bacalaureat Model 2022, S2.3 - Structura zbor",
    difficulty: "easy",
    tags: ["bacalaureat", "2022", "model", "subiectul2", "structuri"],
    statement:
      "Variabila z memoreaza date referitoare la un zbor al unui avion, derulat in totalitate in aceeasi zi, pe teritoriul Romaniei: codul zborului, momentul de timp corespunzator aterizarii (ora si minutul) si durata zborului, exprimata in minute.\n\n" +
      "Scrieti definitia unei structuri cu eticheta zbor, care sa permita memorarea datelor referitoare la un zbor de tipul precizat, si declarati corespunzator variabila z.\n\n" +
      "Codul de verificare va folosi expresiile z.cod si (60*z.aterizare.ora+z.aterizare.minut-z.durata)/60.",
    input_format: "Se citesc cod, ora aterizarii, minutul aterizarii si durata (minute).",
    output_format: "Se afiseaza z.cod si ora de decolare calculata, separate prin spatiu.",
    constraints: "Zborul se desfasoara integral in aceeasi zi.",
    hints: "Structura zbor are un camp imbricat aterizare (cu ora si minut) plus cod si durata.",
    explanation: "Structura zbor: cod (int), aterizare (record cu ora, minut), durata (int).",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    cin >> z.cod >> z.aterizare.ora >> z.aterizare.minut >> z.durata;
    cout << z.cod << " " << (60 * z.aterizare.ora + z.aterizare.minut - z.durata) / 60 << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    scanf("%d %d %d %d", &z.cod, &z.aterizare.ora, &z.aterizare.minut, &z.durata);
    printf("%d %d\\n", z.cod, (60 * z.aterizare.ora + z.aterizare.minut - z.durata) / 60);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
begin
  readln(z.cod, z.aterizare.ora, z.aterizare.minut, z.durata);
  writeln(z.cod, ' ', (60 * z.aterizare.ora + z.aterizare.minut - z.durata) div 60);
end.
`,
    },
    solutions: {
      cpp: `struct timp { int ora, minut; };
struct zbor {
    int cod;
    timp aterizare;
    int durata;
} z;
`,
      c: `struct timp { int ora, minut; };
struct zbor {
    int cod;
    struct timp aterizare;
    int durata;
} z;
`,
      pascal: `type
  timp = record
    ora, minut: longint;
  end;
  zbor = record
    cod: longint;
    aterizare: timp;
    durata: longint;
  end;
var
  z: zbor;
`,
    },
    tests: ["101 10 30 90", "7 0 15 15", "999 23 59 1", "2000000000 12 0 0"],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-simulare-2022-2-3",
    subcategoryId: "simulare-2022",
    title: "Bacalaureat Simulare 2022, S2.3 - Romburi de flori",
    difficulty: "hard",
    tags: ["bacalaureat", "2022", "simulare", "subiectul2", "tablouri-bidimensionale"],
    statement:
      "Intr-o sera se folosesc vase patrate, care contin cate o singura floare (lalea, frezie sau narcisa). Vasele sunt asezate pe trei randuri si sunt aliniate. Patru flori de acelasi tip formeaza un romb daca vasele in care se afla sunt dispuse in jurul unui alt vas, cu care fiecare are in comun cate o latura.\n\n" +
      "Variabilele j si ok sunt intregi, iar variabila a este un tablou bidimensional cu 3 linii si 15 coloane, cu elemente de tip char, in care fiecare linie memoreaza succesiunea de flori aflate pe un rand al serei ('L' lalele, 'F' frezii, 'N' narcise).\n\n" +
      "Scrieti o secventa de instructiuni astfel incat, in urma executarii acesteia, variabila ok sa aiba valoarea 1 daca florile formeaza cel putin un romb, sau valoarea 0 in caz contrar.",
    input_format: "Se citesc cele 3 linii x 15 coloane ale tabloului a (caractere separate prin spatiu).",
    output_format: "Valoarea lui ok (0 sau 1).",
    constraints: "3 linii, 15 coloane.",
    hints: "Centrul unui romb poate fi doar pe linia din mijloc (indexul 1), pe o coloana j din intervalul [1,13]; verificati daca a[0][j], a[2][j], a[1][j-1], a[1][j+1] sunt toate egale.",
    explanation: "Se parcurge coloana j intre 1 si 13; pentru fiecare, se verifica daca cei 4 vecini ai vasului central (i=1,j) contin aceeasi floare; daca da, ok devine 1.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    char a[3][15];
    int j, ok;
    for (int r = 0; r < 3; r++) for (int c = 0; c < 15; c++) cin >> a[r][c];
    __USER_CODE__
    cout << ok << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
int main() {
    char a[3][15];
    int j, ok;
    for (int r = 0; r < 3; r++) for (int c = 0; c < 15; c++) scanf(" %c", &a[r][c]);
    __USER_CODE__
    printf("%d\\n", ok);
    return 0;
}
`,
      pascal: `program solution;
var
  a: array[0..2,0..14] of char;
  j, ok, r, c: integer;
  line: string;
begin
  for r := 0 to 2 do begin
    readln(line);
    for c := 0 to 14 do
      a[r,c] := line[c*2+1];
  end;
  __USER_CODE__
  writeln(ok);
end.
`,
      python: `import sys
tokens = sys.stdin.read().split()
a = [tokens[r*15:(r+1)*15] for r in range(3)]
j = ok = 0
__USER_CODE__
print(ok)
`,
    },
    solutions: {
      cpp: `ok = 0;
for (j = 1; j < 14; j++)
    if (a[0][j] == a[2][j] && a[1][j-1] == a[0][j] && a[1][j+1] == a[0][j])
        ok = 1;
`,
      c: `ok = 0;
for (j = 1; j < 14; j++)
    if (a[0][j] == a[2][j] && a[1][j-1] == a[0][j] && a[1][j+1] == a[0][j])
        ok = 1;
`,
      pascal: `ok := 0;
for j := 1 to 13 do
  if (a[0,j] = a[2,j]) and (a[1,j-1] = a[0,j]) and (a[1,j+1] = a[0,j]) then
    ok := 1;
`,
      python: `ok = 0
for j in range(1, 14):
        if a[0][j] == a[2][j] == a[1][j-1] == a[1][j+1]:
            ok = 1
`,
    },
    tests: [
      "L L L L L L L F L L L L L L L\nL L L L L L F L F L L L L L L\nL L L L L L L F L L L L L L L",
      "L F N L F N L F N L F N L F N\nN L F N L F N L F N L F N L F\nF N L F N L F N L F N L F N L",
    ],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-speciala-2022-2-3",
    subcategoryId: "speciala-2022",
    title: "Bacalaureat Speciala 2022, S2.3 - Venit total sali de spectacole",
    difficulty: "easy",
    tags: ["bacalaureat", "2022", "speciala", "subiectul2", "structuri", "secventa-instructiuni"],
    statement:
      "Pentru o sala de spectacole se memoreaza urmatoarele informatii specifice: numarul de locuri disponibile si pretul biletului pentru un loc. Variabilele i si s sunt intregi, iar variabila t memoreaza informatiile specifice pentru fiecare dintre cele 15 sali de spectacole dintr-un oras:\n\n" +
      "struct sala { int nrLocuri; int pret; } t[15];\n\n" +
      "Scrieti o secventa de instructiuni in urma executarii careia variabila s sa memoreze suma totala obtinuta in urma vanzarii biletelor pentru un festival care s-ar desfasura simultan in toate salile, iar acestea ar fi ocupate complet.",
    input_format: "Se citesc, pentru fiecare din cele 15 sali, nrLocuri si pret.",
    output_format: "Se afiseaza s.",
    constraints: "-",
    hints: "s este suma produselor nrLocuri*pret pentru toate cele 15 sali.",
    explanation: "Se parcurg cele 15 sali cu i si se aduna la s produsul t[i].nrLocuri*t[i].pret.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
struct sala { int nrLocuri; int pret; } t[15];
int main() {
    int i, s;
    for (i = 0; i < 15; i++) cin >> t[i].nrLocuri >> t[i].pret;
    __USER_CODE__
    cout << s << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
struct sala { int nrLocuri; int pret; } t[15];
int main() {
    int i, s;
    for (i = 0; i < 15; i++) scanf("%d %d", &t[i].nrLocuri, &t[i].pret);
    __USER_CODE__
    printf("%d\\n", s);
    return 0;
}
`,
      pascal: `program solution;
type
  sala = record
    nrLocuri, pret: longint;
  end;
var
  t: array[0..14] of sala;
  i, s: longint;
begin
  for i := 0 to 14 do
    readln(t[i].nrLocuri, t[i].pret);
  __USER_CODE__
  writeln(s);
end.
`,
      python: `from types import SimpleNamespace
t = []
for _ in range(15):
    nl, pr = map(int, input().split())
    t.append(SimpleNamespace(nrLocuri=nl, pret=pr))
i = s = 0
__USER_CODE__
print(s)
`,
    },
    solutions: {
      cpp: `s = 0;
for (i = 0; i < 15; i++) s += t[i].nrLocuri * t[i].pret;
`,
      c: `s = 0;
for (i = 0; i < 15; i++) s += t[i].nrLocuri * t[i].pret;
`,
      pascal: `s := 0;
for i := 0 to 14 do s := s + t[i].nrLocuri * t[i].pret;
`,
      python: `s = 0
for i in range(15):
        s += t[i].nrLocuri * t[i].pret
`,
    },
    tests: [
      Array.from({ length: 15 }, (_, i) => `${100 + i} ${10 + i}`).join("\n"),
      Array.from({ length: 15 }, () => `50 20`).join("\n"),
    ],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-toamna-2022-2-3",
    subcategoryId: "toamna-2022",
    title: "Bacalaureat Toamna 2022, S2.3 - Clasificare temperatura",
    difficulty: "easy",
    tags: ["bacalaureat", "2022", "toamna", "subiectul2", "structuri", "secventa-instructiuni"],
    statement:
      "Variabila x, declarata alaturat, memoreaza simultan un an calendaristic si temperatura medie a aerului, masurata in grade Celsius, inregistrata in Bucuresti in anul respectiv:\n\n" +
      "struct meteo { int an, temperatura; } x;\n\n" +
      "Scrieti o secventa de instructiuni in urma executarii careia sa se afiseze pe ecran mesajul CALDUROS daca temperatura mentionata a fost strict mai mare decat 11 grade C, mesajul RACOROS daca temperatura mentionata a fost strict mai mica decat 10 grade C, sau mesajul NORMAL in orice alt caz.",
    input_format: "Se citesc x.an si x.temperatura.",
    output_format: "Se afiseaza CALDUROS, RACOROS sau NORMAL.",
    constraints: "-",
    hints: "Verificati intai temperatura>11, apoi temperatura<10, altfel NORMAL.",
    explanation: "Se compara x.temperatura cu pragurile 11 si 10 si se afiseaza mesajul corespunzator.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
struct meteo { int an, temperatura; } x;
int main() {
    cin >> x.an >> x.temperatura;
    __USER_CODE__
    return 0;
}
`,
      c: `#include <stdio.h>
struct meteo { int an, temperatura; } x;
int main() {
    scanf("%d %d", &x.an, &x.temperatura);
    __USER_CODE__
    return 0;
}
`,
      pascal: `program solution;
type
  meteo = record
    an, temperatura: longint;
  end;
var
  x: meteo;
begin
  readln(x.an, x.temperatura);
  __USER_CODE__
end.
`,
      python: `from types import SimpleNamespace
an, temperatura = map(int, input().split())
x = SimpleNamespace(an=an, temperatura=temperatura)
__USER_CODE__
`,
    },
    solutions: {
      cpp: `if (x.temperatura > 11) cout << "CALDUROS\\n";
else if (x.temperatura < 10) cout << "RACOROS\\n";
else cout << "NORMAL\\n";
`,
      c: `if (x.temperatura > 11) printf("CALDUROS\\n");
else if (x.temperatura < 10) printf("RACOROS\\n");
else printf("NORMAL\\n");
`,
      pascal: `if x.temperatura > 11 then writeln('CALDUROS')
else if x.temperatura < 10 then writeln('RACOROS')
else writeln('NORMAL');
`,
      python: `if x.temperatura > 11:
        print('CALDUROS')
elif x.temperatura < 10:
        print('RACOROS')
else:
        print('NORMAL')
`,
    },
    tests: ["2020 15", "2021 5", "2022 10", "2023 11", "2024 12"],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-vara-2022-2-3",
    subcategoryId: "vara-2022",
    title: "Bacalaureat Vara 2022, S2.3 - Nume urmat de an",
    difficulty: "medium",
    tags: ["bacalaureat", "2022", "vara", "subiectul2", "siruri-caractere"],
    statement:
      "Variabilele s si id permit accesul la cate un sir de maximum 50 de caractere, sirul accesat prin id fiind initial vid, iar cel accesat prin s memorand, in aceasta ordine, separate printr-un spatiu, prenumele si numele unei persoane, fiecare fiind format numai din litere ale alfabetului englez.\n\n" +
      "Scrieti o secventa de instructiuni astfel incat, in urma executarii acesteia, sirul accesat prin id sa memoreze numele persoanei mentionate, urmat de 2022. Declarati corespunzator eventualele alte variabile utilizate.\n\n" +
      "Exemplu: daca sirul accesat prin variabila s este \"Ana Popescu\" atunci sirul accesat prin variabila id este \"Popescu2022\".",
    input_format: "Se citeste o linie continand prenumele si numele, separate printr-un spatiu.",
    output_format: "Se afiseaza sirul id.",
    constraints: "Prenumele si numele contin doar litere ale alfabetului englez.",
    hints: "Gasiti pozitia spatiului din s, apoi extrageti sub-sirul de dupa acesta si adaugati 2022.",
    explanation: "Se localizeaza spatiul din sir, se copiaza numele (partea de dupa spatiu) in id, apoi se concateneaza sirul \"2022\".",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
#include <cstring>
using namespace std;
char s[60], id[60];
int p;
int main() {
    string line;
    getline(cin, line);
    strcpy(s, line.c_str());
    strcpy(id, "");
    __USER_CODE__
    cout << id << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
#include <string.h>
char s[60], id[60];
int p;
int main() {
    fgets(s, sizeof(s), stdin);
    s[strcspn(s, "\\n")] = 0;
    strcpy(id, "");
    __USER_CODE__
    printf("%s\\n", id);
    return 0;
}
`,
      pascal: `program solution;
var
  s, id: string;
  p: longint;
begin
  readln(s);
  id := '';
  __USER_CODE__
  writeln(id);
end.
`,
      python: `s = input()
id_ = ''
p = 0
__USER_CODE__
print(id_)
`,
    },
    solutions: {
      cpp: `p = strchr(s, ' ') - s;
strcpy(id, s + p + 1);
strcat(id, "2022");
`,
      c: `p = strchr(s, ' ') - s;
strcpy(id, s + p + 1);
strcat(id, "2022");
`,
      pascal: `p := pos(' ', s);
id := copy(s, p + 1, length(s) - p) + '2022';
`,
      python: `p = s.index(' ')
id_ = s[p+1:] + '2022'
`,
    },
    tests: ["Ana Popescu", "Ion Vasilescu", "Maria Georgescu"],
    time_limit_ms: 1000,
  },
];

runMain(problems, LEVEL, CHAPTER, SRC).catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
