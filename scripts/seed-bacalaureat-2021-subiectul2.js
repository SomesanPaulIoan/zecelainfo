const { runMain } = require("./lib/bac-subiectul2-runner");

const LEVEL = "bacalaureat";
const CHAPTER = { id: "bacalaureat-2021", name: "Bacalaureat 2021" };
const SRC = "Bacalaureat Informatica MI 2021 (Ministerul Educatiei / CNPEE) - Subiectul II";

const IO_STDIN = { input_source: "stdin", output_target: "stdout", input_filename: null, output_filename: null };

const problems = [
  {
    slug: "bac-toamna-2021-2-3",
    subcategoryId: "toamna-2021",
    title: "Bacalaureat Toamna 2021, S2.3 - Initializare angajat",
    difficulty: "easy",
    tags: ["bacalaureat", "2021", "toamna", "subiectul2", "structuri", "secventa-instructiuni"],
    statement:
      "In declararea alaturata, variabila a memoreaza datele personale ale fiecaruia dintre cei 30 de angajati (codul numeric personal - CNP, anul nasterii) si venitul lunar al acestuia:\n\n" +
      "struct date { char CNP[14]; int anNastere; };\n" +
      "struct angajat { struct date dp; int venit; } a[30];\n\n" +
      "Scrieti o secventa de instructiuni in urma executarii careia pentru primul angajat sa se initializeze anul nasterii cu valoarea 2000, iar venitul cu valoarea 4000.",
    input_format: "Fara date de intrare.",
    output_format: "Se afiseaza a[0].dp.anNastere si a[0].venit, separate printr-un spatiu.",
    constraints: "-",
    hints: "Scrieti direct a[0].dp.anNastere = 2000; si a[0].venit = 4000;",
    explanation: "Se acceseaza campul imbricat dp.anNastere al primului element din tablou si campul venit, atribuindu-le valorile cerute.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
struct date { char CNP[14]; int anNastere; };
struct angajat { date dp; int venit; };
angajat a[30];
int main() {
    __USER_CODE__
    cout << a[0].dp.anNastere << " " << a[0].venit << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
#include <string.h>
struct date { char CNP[14]; int anNastere; };
struct angajat { struct date dp; int venit; };
struct angajat a[30];
int main() {
    __USER_CODE__
    printf("%d %d\\n", a[0].dp.anNastere, a[0].venit);
    return 0;
}
`,
      pascal: `program solution;
type
  tdate = record
    CNP: string[13];
    anNastere: longint;
  end;
  tangajat = record
    dp: tdate;
    venit: longint;
  end;
var
  a: array[0..29] of tangajat;
begin
  __USER_CODE__
  writeln(a[0].dp.anNastere, ' ', a[0].venit);
end.
`,
      python: `from types import SimpleNamespace
def mkdate():
    return SimpleNamespace(CNP='', anNastere=0)
def mkangajat():
    return SimpleNamespace(dp=mkdate(), venit=0)
a = [mkangajat() for _ in range(30)]
__USER_CODE__
print(a[0].dp.anNastere, a[0].venit)
`,
    },
    solutions: {
      cpp: `a[0].dp.anNastere = 2000;
a[0].venit = 4000;
`,
      c: `a[0].dp.anNastere = 2000;
a[0].venit = 4000;
`,
      pascal: `a[0].dp.anNastere := 2000;
a[0].venit := 4000;
`,
      python: `a[0].dp.anNastere = 2000
a[0].venit = 4000
`,
    },
    tests: [""],
    time_limit_ms: 1000,
  },
  {
    slug: "bac-vara-2021-2-3",
    subcategoryId: "vara-2021",
    title: "Bacalaureat Vara 2021, S2.3 - Scadere de fractii",
    difficulty: "medium",
    tags: ["bacalaureat", "2021", "vara", "subiectul2", "structuri", "secventa-instructiuni"],
    statement:
      "In declararea alaturata, variabilele f si fs memoreaza in campurile a si b numaratorul, respectiv numitorul cate unei fractii:\n\n" +
      "struct fractie { int a,b; } f,fs;\n\n" +
      "Fara a utiliza alte variabile, scrieti o secventa de instructiuni care sa memoreze in variabila fs fractia obtinuta prin scaderea din fractia 2020/2021 a fractiei memorate in variabila f.",
    input_format: "Se citesc f.a si f.b.",
    output_format: "Se afiseaza fs.a si fs.b, separate printr-un spatiu.",
    constraints: "f.b este nenul.",
    hints: "2020/2021 - f.a/f.b = (2020*f.b - 2021*f.a) / (2021*f.b), fara simplificare.",
    explanation: "Scaderea a doua fractii fara numitor comun se face prin amplificare incrucisata: fs.a = 2020*f.b - 2021*f.a, fs.b = 2021*f.b.",
    io: IO_STDIN,
    langs: ["cpp", "c", "pascal", "python"],
    templates: {
      cpp: `#include <bits/stdc++.h>
using namespace std;
struct fractie { int a, b; } f, fs;
int main() {
    cin >> f.a >> f.b;
    __USER_CODE__
    cout << fs.a << " " << fs.b << "\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
struct fractie { int a, b; } f, fs;
int main() {
    scanf("%d %d", &f.a, &f.b);
    __USER_CODE__
    printf("%d %d\\n", fs.a, fs.b);
    return 0;
}
`,
      pascal: `program solution;
type
  fractie = record
    a, b: longint;
  end;
var
  f, fs: fractie;
begin
  readln(f.a, f.b);
  __USER_CODE__
  writeln(fs.a, ' ', fs.b);
end.
`,
      python: `from types import SimpleNamespace
fa, fb = map(int, input().split())
f = SimpleNamespace(a=fa, b=fb)
fs = SimpleNamespace(a=0, b=0)
__USER_CODE__
print(fs.a, fs.b)
`,
    },
    solutions: {
      cpp: `fs.a = 2020 * f.b - 2021 * f.a;
fs.b = 2021 * f.b;
`,
      c: `fs.a = 2020 * f.b - 2021 * f.a;
fs.b = 2021 * f.b;
`,
      pascal: `fs.a := 2020 * f.b - 2021 * f.a;
fs.b := 2021 * f.b;
`,
      python: `fs.a = 2020 * f.b - 2021 * f.a
fs.b = 2021 * f.b
`,
    },
    tests: ["1 2", "0 1", "-3 5"],
    time_limit_ms: 1000,
  },
];

runMain(problems, LEVEL, CHAPTER, SRC).catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
