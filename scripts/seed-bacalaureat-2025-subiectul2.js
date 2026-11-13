const { runMain, buildDimChecker } = require("./lib/bac-subiectul2-runner");

const LEVEL = "bacalaureat";
const CHAPTER = { id: "bacalaureat-2025", name: "Bacalaureat 2025" };
const SRC = "Bacalaureat Informatica MI 2025 (Ministerul Educatiei / CNPEE) - Subiectul II";

const IO_STDIN = { input_source: "stdin", output_target: "stdout", input_filename: null, output_filename: null };

const problems = [
  {
    slug: "bac-model-2025-2-3",
    subcategoryId: "model-2025",
    title: "Bacalaureat Model 2025, S2.3 - Structura epoca (masina)",
    difficulty: "easy",
    tags: ["bacalaureat", "2025", "model", "subiectul2", "structuri"],
    statement:
      "Variabila m memoreaza date despre o masina de epoca: anul fabricatiei si data (ziua si luna) ultimei prezentari in cadrul unei expozitii de profil care a avut loc in anul curent.\n\n" +
      "Scrieti definitia unei structuri, cu eticheta epoca, care sa permita memorarea datelor unei masini de epoca, si declarati variabila m, de acest tip.\n\n" +
      "Codul de verificare va folosi expresiile m.anFabricatie, m.expo.zi si m.expo.luna.",
    input_format: "Se citesc anul fabricatiei si ziua (pe o linie), apoi luna (pe linia urmatoare).",
    output_format: "Se afiseaza m.anFabricatie, m.expo.zi si m.expo.luna, separate prin spatiu.",
    constraints: "-",
    hints: "expo este un camp de tip structura, cu zi (intreg) si luna (sir de caractere).",
    explanation: "Structura epoca: anFabricatie (int), expo (structura cu zi int si luna sir).",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    cin >> m.anFabricatie >> m.expo.zi >> m.expo.luna;
    cout << m.anFabricatie << " " << m.expo.zi << " " << m.expo.luna << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    scanf("%d %d %s", &m.anFabricatie, &m.expo.zi, m.expo.luna);
    printf("%d %d %s\\n", m.anFabricatie, m.expo.zi, m.expo.luna);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
begin
  readln(m.anFabricatie, m.expo.zi);
  readln(m.expo.luna);
  writeln(m.anFabricatie, ' ', m.expo.zi, ' ', m.expo.luna);
end.
`,
    },
    solutions: {
      cpp: `struct dataExpo { int zi; char luna[15]; };
struct epoca {
    int anFabricatie;
    dataExpo expo;
} m;
`,
      c: `struct dataExpo { int zi; char luna[15]; };
struct epoca {
    int anFabricatie;
    struct dataExpo expo;
} m;
`,
      pascal: `type
  dataExpo = record
    zi: longint;
    luna: string;
  end;
  epoca = record
    anFabricatie: longint;
    expo: dataExpo;
  end;
var
  m: epoca;
`,
    },
    tests: ["1932 15\nIunie", "1948 3\nOctombrie", "1901 30\nAprilie"],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-simulare-2025-2-3",
    subcategoryId: "simulare-2025",
    title: "Bacalaureat Simulare 2025, S2.3 - Structura specialist IT",
    difficulty: "easy",
    tags: ["bacalaureat", "2025", "simulare", "subiectul2", "structuri"],
    statement:
      "Variabila s memoreaza date ale fiecaruia dintre cei 30 de specialisti IT ai unei companii: date personale (codul numeric personal - CNP si anul nasterii) si anul angajarii.\n\n" +
      "Scrieti definitia unei structuri, cu eticheta specialist, care sa permita memorarea datelor unui specialist IT, si declarati corespunzator variabila s.\n\n" +
      "Codul de verificare va folosi expresiile s[5].personal.CNP, s[5].personal.anNastere si s[5].anAngajare.",
    input_format: "Se citesc, pe linii separate: CNP (13 cifre), apoi un indice idx, anul nasterii si anul angajarii.",
    output_format: "Se afiseaza s[idx].personal.CNP, s[idx].personal.anNastere, s[idx].anAngajare si numarul de elemente ale tabloului s, separate prin spatiu.",
    constraints: "-",
    hints: "personal este un camp de tip structura, cu CNP (sir) si anNastere (intreg). Nu uitati ca s trebuie sa aiba exact 30 de elemente (idx poate fi si 29).",
    explanation: "Structura specialist: personal (structura cu CNP sir si anNastere int) si anAngajare (int). Verificarea foloseste un indice variabil, inclusiv ultima pozitie valida.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    checkerCode: buildDimChecker([30]),
    templates: {
      cpp: `#include <bits/stdc++.h>
#include <cstring>
using namespace std;
__USER_CODE__
int main() {
    char cnpTmp[20];
    int idx;
    cin >> cnpTmp;
    cin >> idx >> s[idx].personal.anNastere >> s[idx].anAngajare;
    strcpy(s[idx].personal.CNP, cnpTmp);
    int dim = sizeof(s) / sizeof(s[0]);
    cout << s[idx].personal.CNP << " " << s[idx].personal.anNastere << " " << s[idx].anAngajare << " " << dim << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
#include <string.h>
__USER_CODE__
int main() {
    char cnpTmp[20];
    int idx;
    scanf("%s", cnpTmp);
    scanf("%d", &idx);
    scanf("%d %d", &s[idx].personal.anNastere, &s[idx].anAngajare);
    strcpy(s[idx].personal.CNP, cnpTmp);
    int dim = (int)(sizeof(s) / sizeof(s[0]));
    printf("%s %d %d %d\\n", s[idx].personal.CNP, s[idx].personal.anNastere, s[idx].anAngajare, dim);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
var dim, idx: longint;
    cnpTmp: string;
begin
  readln(cnpTmp);
  readln(idx, s[idx].personal.anNastere, s[idx].anAngajare);
  s[idx].personal.CNP := cnpTmp;
  dim := High(s) - Low(s) + 1;
  writeln(s[idx].personal.CNP, ' ', s[idx].personal.anNastere, ' ', s[idx].anAngajare, ' ', dim);
end.
`,
    },
    solutions: {
      cpp: `struct personalTip { char CNP[14]; int anNastere; };
struct specialist {
    personalTip personal;
    int anAngajare;
} s[30];
`,
      c: `struct personalTip { char CNP[14]; int anNastere; };
struct specialist {
    struct personalTip personal;
    int anAngajare;
} s[30];
`,
      pascal: `type
  personalTip = record
    CNP: string;
    anNastere: longint;
  end;
  specialist = record
    personal: personalTip;
    anAngajare: longint;
  end;
var
  s: array[0..29] of specialist;
`,
    },
    tests: ["1850101123456\n0 1985 2010", "2000505987654\n0 2000 2022", "1900101112233\n29 1990 2015"],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-speciala-2025-2-3",
    subcategoryId: "speciala-2025",
    title: "Bacalaureat Speciala 2025, S2.3 - Dreptunghi sau patrat",
    difficulty: "medium",
    tags: ["bacalaureat", "2025", "speciala", "subiectul2", "structuri", "secventa-instructiuni"],
    statement:
      "In declararile alaturate, variabila d memoreaza in campurile A si B coordonatele, in sistemul de coordonate xOy, ale varfurilor din stanga-sus, respectiv din dreapta-jos, ale unui dreptunghi cu laturile paralele cu axele sistemului de coordonate.\n\n" +
      "struct punct { int x, y; };\n" +
      "struct figura { punct A, B; } d;\n\n" +
      "Scrieti o secventa de instructiuni C/C++ in urma executarii careia se afiseaza pe ecran mesajul DA, daca figura corespunzatoare variabilei d este patrat, sau mesajul NU, in caz contrar.",
    input_format: "Se citesc d.A.x, d.A.y, d.B.x, d.B.y.",
    output_format: "Se afiseaza DA sau NU.",
    constraints: "-",
    hints: "Latimea este abs(d.B.x-d.A.x), inaltimea este abs(d.A.y-d.B.y); e patrat daca sunt egale.",
    explanation: "Se compara latimea dreptunghiului cu inaltimea acestuia; daca sunt egale si nenule, figura este patrat.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
struct punct { int x, y; };
struct figura { punct A, B; } d;
int main() {
    cin >> d.A.x >> d.A.y >> d.B.x >> d.B.y;
    __USER_CODE__
    return 0;
}
`,
      c: `#include <stdio.h>
#include <stdlib.h>
struct punct { int x, y; };
struct figura { struct punct A, B; } d;
int main() {
    scanf("%d %d %d %d", &d.A.x, &d.A.y, &d.B.x, &d.B.y);
    __USER_CODE__
    return 0;
}
`,
      pascal: `program solution;
type
  punct = record
    x, y: longint;
  end;
  figura = record
    A, B: punct;
  end;
var
  d: figura;
  latime, inaltime: longint;
begin
  readln(d.A.x, d.A.y, d.B.x, d.B.y);
  __USER_CODE__
end.
`,
      python: `from types import SimpleNamespace
ax, ay, bx, by = map(int, input().split())
d = SimpleNamespace(A=SimpleNamespace(x=ax, y=ay), B=SimpleNamespace(x=bx, y=by))
__USER_CODE__
`,
    },
    solutions: {
      cpp: `int latime = abs(d.B.x - d.A.x);
int inaltime = abs(d.A.y - d.B.y);
if (latime == inaltime) cout << "DA\\n"; else cout << "NU\\n";
`,
      c: `int latime = abs(d.B.x - d.A.x);
int inaltime = abs(d.A.y - d.B.y);
if (latime == inaltime) printf("DA\\n"); else printf("NU\\n");
`,
      pascal: `latime := abs(d.B.x - d.A.x);
inaltime := abs(d.A.y - d.B.y);
if latime = inaltime then writeln('DA') else writeln('NU');
`,
      python: `latime = abs(d.B.x - d.A.x)
inaltime = abs(d.A.y - d.B.y)
print('DA' if latime == inaltime else 'NU')
`,
    },
    tests: ["0 5 5 0", "0 5 8 0", "2 2 6 -2"],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-toamna-2025-2-3",
    subcategoryId: "toamna-2025",
    title: "Bacalaureat Toamna 2025, S2.3 - Structura bijuterie",
    difficulty: "easy",
    tags: ["bacalaureat", "2025", "toamna", "subiectul2", "structuri"],
    statement:
      "Variabila b memoreaza simultan date despre o bijuterie: greutatea acesteia, exprimata in grame, si metalul pretios din care este confectionata (denumirea si pretul unui gram din acel metal). Greutatea bijuteriei si pretul unui gram de metal sunt numere naturale din intervalul [1,10^4], iar denumirea este un sir de maximum 30 de caractere.\n\n" +
      "Scrieti definitia unei structuri cu eticheta bijuterie, care permite memorarea datelor precizate, si declarati corespunzator variabila b.\n\n" +
      "Codul de verificare va folosi expresiile b.metal.denumire si b.greutate*b.metal.pret.",
    input_format: "Se citeste denumirea metalului (pe o linie), apoi pretul si greutatea (pe linia urmatoare).",
    output_format: "Se afiseaza b.metal.denumire si b.greutate*b.metal.pret, separate prin spatiu.",
    constraints: "1 <= greutate, pret <= 10^4",
    hints: "metal este un camp de tip structura, cu denumire (sir) si pret (intreg).",
    explanation: "Structura bijuterie: greutate (int) si metal (structura cu denumire sir si pret int).",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    cin >> b.metal.denumire >> b.metal.pret >> b.greutate;
    cout << b.metal.denumire << " " << (b.greutate * b.metal.pret) << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    scanf("%s %d %d", b.metal.denumire, &b.metal.pret, &b.greutate);
    printf("%s %d\\n", b.metal.denumire, b.greutate * b.metal.pret);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
begin
  readln(b.metal.denumire);
  readln(b.metal.pret, b.greutate);
  writeln(b.metal.denumire, ' ', b.greutate * b.metal.pret);
end.
`,
    },
    solutions: {
      cpp: `struct metalTip { char denumire[31]; int pret; };
struct bijuterie {
    int greutate;
    metalTip metal;
} b;
`,
      c: `struct metalTip { char denumire[31]; int pret; };
struct bijuterie {
    int greutate;
    struct metalTip metal;
} b;
`,
      pascal: `type
  metalTip = record
    denumire: string;
    pret: longint;
  end;
  bijuterie = record
    greutate: longint;
    metal: metalTip;
  end;
var
  b: bijuterie;
`,
    },
    tests: ["Aur\n250 10", "Argint\n5 200", "Platina\n400 3"],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-vara-2025-2-3",
    subcategoryId: "vara-2025",
    title: "Bacalaureat Vara 2025, S2.3 - Structura prajitura",
    difficulty: "easy",
    tags: ["bacalaureat", "2025", "vara", "subiectul2", "structuri"],
    statement:
      "Variabila p memoreaza simultan, pentru un tip de prajitura, codul (un numar natural de doua cifre), pretul (numar real) si un set de trei numere naturale din intervalul [1,10^2], reprezentand informatii specifice, in aceasta ordine: tipul glazurii, tipul cremei principale si numarul de blaturi.\n\n" +
      "Scrieti definitia unei structuri cu eticheta prajitura, care permite memorarea datelor despre o prajitura, si declarati corespunzator variabila p.\n\n" +
      "Codul de verificare va folosi expresiile p.cod, p.pret si p.informatii[0].",
    input_format: "Se citesc cod, pret, cele trei informatii si un indice idx.",
    output_format: "Se afiseaza p.cod, p.pret (2 zecimale), p.informatii[idx] si numarul de elemente ale tabloului informatii, separate prin spatiu.",
    constraints: "10 <= cod <= 99, 1 <= informatii[i] <= 100",
    hints: "informatii este un tablou de exact 3 numere intregi (idx poate fi si 2).",
    explanation: "Structura prajitura: cod (int), pret (real), informatii (tablou de 3 intregi). Verificarea foloseste un indice variabil, inclusiv ultima pozitie valida.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal"],
    checkerCode: buildDimChecker([3]),
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int idx;
    cin >> p.cod >> p.pret >> p.informatii[0] >> p.informatii[1] >> p.informatii[2] >> idx;
    int dim = sizeof(p.informatii) / sizeof(p.informatii[0]);
    printf("%d %.2f %d %d\\n", p.cod, p.pret, p.informatii[idx], dim);
    return 0;
}
`,
      c: `#include <stdio.h>
__USER_CODE__
int main() {
    int idx;
    scanf("%d %lf %d %d %d %d", &p.cod, &p.pret, &p.informatii[0], &p.informatii[1], &p.informatii[2], &idx);
    int dim = (int)(sizeof(p.informatii) / sizeof(p.informatii[0]));
    printf("%d %.2f %d %d\\n", p.cod, p.pret, p.informatii[idx], dim);
    return 0;
}
`,
      pascal: `program solution;
__USER_CODE__
var dim, idx: longint;
begin
  readln(p.cod, p.pret, p.informatii[0], p.informatii[1], p.informatii[2], idx);
  dim := High(p.informatii) - Low(p.informatii) + 1;
  writeln(p.cod, ' ', p.pret:0:2, ' ', p.informatii[idx], ' ', dim);
end.
`,
    },
    solutions: {
      cpp: `struct prajitura {
    int cod;
    double pret;
    int informatii[3];
} p;
`,
      c: `struct prajitura {
    int cod;
    double pret;
    int informatii[3];
} p;
`,
      pascal: `type
  prajitura = record
    cod: longint;
    pret: real;
    informatii: array[0..2] of longint;
  end;
var
  p: prajitura;
`,
    },
    tests: ["25 19.99 1 2 3 0", "10 5.5 100 1 50 0", "99 100 3 3 3 2"],
    time_limit_ms: 1000,
  },
];

runMain(problems, LEVEL, CHAPTER, SRC).catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
