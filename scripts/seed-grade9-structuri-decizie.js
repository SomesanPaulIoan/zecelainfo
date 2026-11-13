const { Pool } = require("pg");

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";

const pool = new Pool({ connectionString });

const BASE_META = {
  difficulty: "easy",
  time_limit_ms: 1000,
  memory_limit_mb: 64,
  input_source: "stdin",
  output_target: "stdout",
  curriculum_level: "grade9",
  curriculum_chapter_id: "structuri-decizie",
  curriculum_subcategory_id: "structuri-decizie-general",
  solution_mode: "full",
  checker_mode: "exact",
  source: "Sursa interna",
};

const problems = [
  {
    slug: "maximul-dintre-trei-numere-cu-o-singura-decizie",
    title: "Maximul dintre trei numere cu o singura decizie",
    statement:
      "Se citesc trei numere intregi a, b, c. Afisati maximul dintre ele.\n\nCerinta didactica: rezolvarea poate fi gandita cu o singura instructiune if.",
    official_solution:
      "#include <iostream>\nusing namespace std;\nint main(){long long a,b,c;cin>>a>>b>>c; long long mx=a; if(b>mx||c>mx) mx=(b>c?b:c); cout<<mx; return 0;}",
    input_format: "Se citesc trei numere intregi a, b, c.",
    output_format: "Se afiseaza un singur numar: maximul dintre a, b si c.",
    constraints: "-10^9 <= a,b,c <= 10^9",
    tags: ["clasa9", "structuri-decizie", "maxim"],
    tests: [
      { input: "3 7 5\n", expected: "7\n", isSample: true },
      { input: "-1 -5 -3\n", expected: "-1\n" },
      { input: "9 9 1\n", expected: "9\n" },
      { input: "0 0 0\n", expected: "0\n" },
      { input: "12 4 40\n", expected: "40\n" },
    ],
  },
  {
    slug: "minim-si-maxim-din-doua-numere",
    title: "Minim si maxim din doua numere",
    statement: "Se citesc doua numere intregi a si b. Afisati mai intai minimul, apoi maximul.",
    official_solution:
      "#include <iostream>\nusing namespace std;\nint main(){long long a,b;cin>>a>>b; if(a<b) cout<<a<<\" \"<<b; else cout<<b<<\" \"<<a; return 0;}",
    input_format: "Se citesc doua numere intregi a si b.",
    output_format: "Se afiseaza minimul si maximul, separate prin spatiu.",
    constraints: "-10^9 <= a,b <= 10^9",
    tags: ["clasa9", "structuri-decizie", "minim", "maxim"],
    tests: [
      { input: "8 3\n", expected: "3 8\n", isSample: true },
      { input: "-2 5\n", expected: "-2 5\n" },
      { input: "7 7\n", expected: "7 7\n" },
      { input: "0 -1\n", expected: "-1 0\n" },
      { input: "100 20\n", expected: "20 100\n" },
    ],
  },
  {
    slug: "numar-doua-cifre-cu-cifre-identice",
    title: "Numar de doua cifre cu cifre identice",
    statement:
      "Se citeste un numar natural de doua cifre n. Verificati daca cele doua cifre sunt egale.\nAfisati DA sau NU.",
    official_solution:
      "#include <iostream>\nusing namespace std;\nint main(){int n;cin>>n; int z=n/10,u=n%10; cout<<(z==u?\"DA\":\"NU\"); return 0;}",
    input_format: "Se citeste un numar natural n (10 <= n <= 99).",
    output_format: "Afisati DA daca cifrele sunt egale, altfel NU.",
    constraints: "10 <= n <= 99",
    tags: ["clasa9", "structuri-decizie", "cifre"],
    tests: [
      { input: "44\n", expected: "DA\n", isSample: true },
      { input: "10\n", expected: "NU\n" },
      { input: "99\n", expected: "DA\n" },
      { input: "57\n", expected: "NU\n" },
      { input: "11\n", expected: "DA\n" },
    ],
  },
  {
    slug: "cifra-dominanta-numar-3-cifre",
    title: "Cifra dominanta intr-un numar de 3 cifre",
    statement:
      "Se citeste un numar natural n de 3 cifre. Verificati daca cifra sutelor este mai mare decat suma celorlalte doua cifre.\nAfisati DA sau NU.",
    official_solution:
      "#include <iostream>\nusing namespace std;\nint main(){int n;cin>>n; int s=n/100,z=(n/10)%10,u=n%10; cout<<(s>z+u?\"DA\":\"NU\"); return 0;}",
    input_format: "Se citeste n (100 <= n <= 999).",
    output_format: "Afisati DA daca proprietatea este adevarata, altfel NU.",
    constraints: "100 <= n <= 999",
    tags: ["clasa9", "structuri-decizie", "cifre"],
    tests: [
      { input: "931\n", expected: "DA\n", isSample: true },
      { input: "572\n", expected: "NU\n" },
      { input: "900\n", expected: "DA\n" },
      { input: "111\n", expected: "NU\n" },
      { input: "821\n", expected: "DA\n" },
    ],
  },
  {
    slug: "numar-palindrom-3-cifre",
    title: "Numar palindrom de 3 cifre",
    statement:
      "Se citeste un numar natural n de 3 cifre. Verificati daca este palindrom.\nAfisati DA sau NU.",
    official_solution:
      "#include <iostream>\nusing namespace std;\nint main(){int n;cin>>n; int s=n/100,u=n%10; cout<<(s==u?\"DA\":\"NU\"); return 0;}",
    input_format: "Se citeste n (100 <= n <= 999).",
    output_format: "Afisati DA daca n este palindrom, altfel NU.",
    constraints: "100 <= n <= 999",
    tags: ["clasa9", "structuri-decizie", "palindrom"],
    tests: [
      { input: "131\n", expected: "DA\n", isSample: true },
      { input: "572\n", expected: "NU\n" },
      { input: "909\n", expected: "DA\n" },
      { input: "100\n", expected: "NU\n" },
      { input: "777\n", expected: "DA\n" },
    ],
  },
  {
    slug: "paritatea-sumei-cifrelor-3-cifre",
    title: "Paritatea sumei cifrelor",
    statement:
      "Se citeste un numar natural n de 3 cifre. Determinati daca suma cifrelor este para sau impara.\nAfisati PARA sau IMPARA.",
    official_solution:
      "#include <iostream>\nusing namespace std;\nint main(){int n;cin>>n; int s=n/100,z=(n/10)%10,u=n%10; int sum=s+z+u; cout<<(sum%2==0?\"PARA\":\"IMPARA\"); return 0;}",
    input_format: "Se citeste n (100 <= n <= 999).",
    output_format: "Afisati PARA daca suma cifrelor este para, altfel IMPARA.",
    constraints: "100 <= n <= 999",
    tags: ["clasa9", "structuri-decizie", "paritate", "cifre"],
    tests: [
      { input: "572\n", expected: "PARA\n", isSample: true },
      { input: "111\n", expected: "IMPARA\n" },
      { input: "909\n", expected: "PARA\n" },
      { input: "123\n", expected: "PARA\n" },
      { input: "700\n", expected: "IMPARA\n" },
    ],
  },
  {
    slug: "divizibilitate-compusa-2-3-fara-5",
    title: "Divizibilitate compusa",
    statement:
      "Se citeste un numar natural n. Verificati daca este divizibil cu 2 si cu 3, dar nu cu 5.\nAfisati DA sau NU.",
    official_solution:
      "#include <iostream>\nusing namespace std;\nint main(){long long n;cin>>n; cout<<((n%2==0&&n%3==0&&n%5!=0)?\"DA\":\"NU\"); return 0;}",
    input_format: "Se citeste n.",
    output_format: "Afisati DA daca proprietatea este adevarata, altfel NU.",
    constraints: "1 <= n <= 10^12",
    tags: ["clasa9", "structuri-decizie", "divizibilitate"],
    tests: [
      { input: "12\n", expected: "DA\n", isSample: true },
      { input: "30\n", expected: "NU\n" },
      { input: "18\n", expected: "DA\n" },
      { input: "7\n", expected: "NU\n" },
      { input: "60\n", expected: "NU\n" },
    ],
  },
  {
    slug: "an-bisect",
    title: "An bisect",
    statement:
      "Se citeste un an natural. Verificati daca este bisect.\nUn an este bisect daca este divizibil cu 400 sau este divizibil cu 4, dar nu cu 100.\nAfisati DA sau NU.",
    official_solution:
      "#include <iostream>\nusing namespace std;\nint main(){int an;cin>>an; bool b=(an%400==0)||(an%4==0&&an%100!=0); cout<<(b?\"DA\":\"NU\"); return 0;}",
    input_format: "Se citeste anul an.",
    output_format: "Afisati DA daca an este bisect, altfel NU.",
    constraints: "1 <= an <= 3000",
    tags: ["clasa9", "structuri-decizie", "an-bisect"],
    tests: [
      { input: "2024\n", expected: "DA\n", isSample: true },
      { input: "1900\n", expected: "NU\n" },
      { input: "2000\n", expected: "DA\n" },
      { input: "2023\n", expected: "NU\n" },
      { input: "2400\n", expected: "DA\n" },
    ],
  },
  {
    slug: "existenta-unui-triunghi",
    title: "Existenta unui triunghi",
    statement:
      "Se citesc trei lungimi a, b, c. Verificati daca pot forma laturile unui triunghi.\nAfisati DA sau NU.",
    official_solution:
      "#include <iostream>\nusing namespace std;\nint main(){double a,b,c;cin>>a>>b>>c; bool ok=(a+b>c)&&(a+c>b)&&(b+c>a); cout<<(ok?\"DA\":\"NU\"); return 0;}",
    input_format: "Se citesc trei numere reale pozitive a, b, c.",
    output_format: "Afisati DA daca se poate forma triunghi, altfel NU.",
    constraints: "0 < a,b,c <= 10^6",
    tags: ["clasa9", "structuri-decizie", "triunghi"],
    tests: [
      { input: "3 4 5\n", expected: "DA\n", isSample: true },
      { input: "1 2 3\n", expected: "NU\n" },
      { input: "7 10 5\n", expected: "DA\n" },
      { input: "2 2 5\n", expected: "NU\n" },
      { input: "5 5 9\n", expected: "DA\n" },
    ],
  },
  {
    slug: "triunghi-dreptunghic",
    title: "Triunghi dreptunghic",
    statement:
      "Se citesc trei lungimi a, b, c despre care se stie ca formeaza un triunghi.\nVerificati daca triunghiul este dreptunghic.\nAfisati DA sau NU.",
    official_solution:
      "#include <iostream>\n#include <algorithm>\nusing namespace std;\nint main(){double a,b,c;cin>>a>>b>>c; double v[3]={a,b,c}; sort(v,v+3); double eps=1e-9; bool ok=(v[0]*v[0]+v[1]*v[1]-v[2]*v[2]); cout<<((abs(ok)<=eps)?\"DA\":\"NU\"); return 0;}",
    input_format: "Se citesc trei numere reale pozitive a, b, c.",
    output_format: "Afisati DA daca triunghiul este dreptunghic, altfel NU.",
    constraints: "0 < a,b,c <= 10^6",
    tags: ["clasa9", "structuri-decizie", "triunghi", "pitagora"],
    tests: [
      { input: "3 4 5\n", expected: "DA\n", isSample: true },
      { input: "5 12 13\n", expected: "DA\n" },
      { input: "6 8 9\n", expected: "NU\n" },
      { input: "7 24 25\n", expected: "DA\n" },
      { input: "2 2 3\n", expected: "NU\n" },
    ],
  },
  {
    slug: "cea-mai-mare-cifra-dintre-zeci-si-unitati",
    title: "Cea mai mare cifra dintre zeci si unitati",
    statement:
      "Se citeste un numar natural de doua cifre n. Afisati cifra mai mare dintre cifra zecilor si cifra unitatilor.",
    official_solution:
      "#include <iostream>\nusing namespace std;\nint main(){int n;cin>>n; int z=n/10,u=n%10; cout<<(z>u?z:u); return 0;}",
    input_format: "Se citeste n (10 <= n <= 99).",
    output_format: "Se afiseaza cifra mai mare dintre cele doua cifre ale lui n.",
    constraints: "10 <= n <= 99",
    tags: ["clasa9", "structuri-decizie", "cifre"],
    tests: [
      { input: "47\n", expected: "7\n", isSample: true },
      { input: "90\n", expected: "9\n" },
      { input: "22\n", expected: "2\n" },
      { input: "15\n", expected: "5\n" },
      { input: "83\n", expected: "8\n" },
    ],
  },
  {
    slug: "numar-aproape-rotund",
    title: "Numar aproape rotund",
    statement:
      "Se citeste un numar natural n. Verificati daca ultima cifra este 0 sau 5.\nAfisati DA sau NU.",
    official_solution:
      "#include <iostream>\nusing namespace std;\nint main(){long long n;cin>>n; int u=(int)((n%10+10)%10); cout<<((u==0||u==5)?\"DA\":\"NU\"); return 0;}",
    input_format: "Se citeste n.",
    output_format: "Afisati DA daca ultima cifra este 0 sau 5, altfel NU.",
    constraints: "0 <= n <= 10^12",
    tags: ["clasa9", "structuri-decizie", "cifre"],
    tests: [
      { input: "120\n", expected: "DA\n", isSample: true },
      { input: "35\n", expected: "DA\n" },
      { input: "22\n", expected: "NU\n" },
      { input: "0\n", expected: "DA\n" },
      { input: "999999999\n", expected: "NU\n" },
    ],
  },
  {
    slug: "apartenenta-la-interval-inchis",
    title: "Apartenenta la interval",
    statement:
      "Se citeste un numar real x. Verificati daca apartine intervalului [2, 7].\nAfisati DA sau NU.",
    official_solution:
      "#include <iostream>\nusing namespace std;\nint main(){double x;cin>>x; cout<<((x>=2&&x<=7)?\"DA\":\"NU\"); return 0;}",
    input_format: "Se citeste x (numar real).",
    output_format: "Afisati DA daca x apartine [2,7], altfel NU.",
    constraints: "-10^6 <= x <= 10^6",
    tags: ["clasa9", "structuri-decizie", "intervale"],
    tests: [
      { input: "2\n", expected: "DA\n", isSample: true },
      { input: "7\n", expected: "DA\n" },
      { input: "1.999\n", expected: "NU\n" },
      { input: "4.5\n", expected: "DA\n" },
      { input: "8\n", expected: "NU\n" },
    ],
  },
  {
    slug: "apartenenta-la-reuniune-intervale",
    title: "Apartenenta la reuniune de intervale",
    statement:
      "Se citeste un numar real x. Verificati daca apartine multimii [-5, -1] U [3, 10].\nAfisati DA sau NU.",
    official_solution:
      "#include <iostream>\nusing namespace std;\nint main(){double x;cin>>x; bool ok=(x>=-5&&x<=-1)||(x>=3&&x<=10); cout<<(ok?\"DA\":\"NU\"); return 0;}",
    input_format: "Se citeste x (numar real).",
    output_format: "Afisati DA daca x apartine reuniunii, altfel NU.",
    constraints: "-10^6 <= x <= 10^6",
    tags: ["clasa9", "structuri-decizie", "intervale"],
    tests: [
      { input: "-3\n", expected: "DA\n", isSample: true },
      { input: "0\n", expected: "NU\n" },
      { input: "3\n", expected: "DA\n" },
      { input: "10\n", expected: "DA\n" },
      { input: "-5.1\n", expected: "NU\n" },
    ],
  },
  {
    slug: "semnul-produsului-fara-calcul",
    title: "Semnul produsului fara calcularea produsului",
    statement:
      "Se citesc doua numere intregi a si b. Verificati daca produsul lor este pozitiv, fara a calcula direct produsul.\nAfisati DA sau NU.",
    official_solution:
      "#include <iostream>\nusing namespace std;\nint main(){long long a,b;cin>>a>>b; bool ok=(a>0&&b>0)||(a<0&&b<0); cout<<(ok?\"DA\":\"NU\"); return 0;}",
    input_format: "Se citesc doua numere intregi a si b.",
    output_format: "Afisati DA daca produsul este pozitiv, altfel NU.",
    constraints: "-10^9 <= a,b <= 10^9",
    tags: ["clasa9", "structuri-decizie", "semn"],
    tests: [
      { input: "2 3\n", expected: "DA\n", isSample: true },
      { input: "-2 -5\n", expected: "DA\n" },
      { input: "-2 5\n", expected: "NU\n" },
      { input: "0 7\n", expected: "NU\n" },
      { input: "9 -1\n", expected: "NU\n" },
    ],
  },
  {
    slug: "ora-valida",
    title: "Ora valida",
    statement:
      "Se citesc trei numere intregi h, m, s. Verificati daca reprezinta o ora valida.\nConditii: 0<=h<=23, 0<=m<=59, 0<=s<=59.\nAfisati DA sau NU.",
    official_solution:
      "#include <iostream>\nusing namespace std;\nint main(){int h,m,s;cin>>h>>m>>s; bool ok=(0<=h&&h<=23&&0<=m&&m<=59&&0<=s&&s<=59); cout<<(ok?\"DA\":\"NU\"); return 0;}",
    input_format: "Se citesc h, m, s.",
    output_format: "Afisati DA daca ora este valida, altfel NU.",
    constraints: "-100 <= h,m,s <= 100",
    tags: ["clasa9", "structuri-decizie", "validare"],
    tests: [
      { input: "12 30 45\n", expected: "DA\n", isSample: true },
      { input: "24 00 00\n", expected: "NU\n" },
      { input: "23 59 59\n", expected: "DA\n" },
      { input: "0 0 0\n", expected: "DA\n" },
      { input: "10 61 5\n", expected: "NU\n" },
    ],
  },
  {
    slug: "data-valida-simplificata-an-nebisect",
    title: "Data valida simplificata",
    statement:
      "Se citesc ziua z si luna l, pentru un an nebisect. Verificati daca data este valida.\nAfisati DA sau NU.",
    official_solution:
      "#include <iostream>\nusing namespace std;\nint main(){int z,l;cin>>z>>l; int zile[]={0,31,28,31,30,31,30,31,31,30,31,30,31}; bool ok=(l>=1&&l<=12&&z>=1&&z<=zile[l]); cout<<(ok?\"DA\":\"NU\"); return 0;}",
    input_format: "Se citesc doua numere intregi: z si l.",
    output_format: "Afisati DA daca data este valida, altfel NU.",
    constraints: "-100 <= z,l <= 100",
    tags: ["clasa9", "structuri-decizie", "data", "validare"],
    tests: [
      { input: "28 2\n", expected: "DA\n", isSample: true },
      { input: "29 2\n", expected: "NU\n" },
      { input: "31 4\n", expected: "NU\n" },
      { input: "31 12\n", expected: "DA\n" },
      { input: "0 5\n", expected: "NU\n" },
    ],
  },
  {
    slug: "numar-4-cifre-proprietate-pozitii-pare-impare",
    title: "Numar de 4 cifre cu proprietate speciala",
    statement:
      "Se citeste un numar natural n de 4 cifre. Verificati daca suma cifrelor de pe pozitii pare este egala cu suma cifrelor de pe pozitii impare.\nPozitiile se numara de la stanga la dreapta (1,2,3,4).\nAfisati DA sau NU.",
    official_solution:
      "#include <iostream>\nusing namespace std;\nint main(){int n;cin>>n; int a=n/1000,b=(n/100)%10,c=(n/10)%10,d=n%10; cout<<((a+c==b+d)?\"DA\":\"NU\"); return 0;}",
    input_format: "Se citeste n (1000 <= n <= 9999).",
    output_format: "Afisati DA daca proprietatea este indeplinita, altfel NU.",
    constraints: "1000 <= n <= 9999",
    tags: ["clasa9", "structuri-decizie", "cifre"],
    tests: [
      { input: "1331\n", expected: "DA\n", isSample: true },
      { input: "1111\n", expected: "DA\n" },
      { input: "1000\n", expected: "NU\n" },
      { input: "3524\n", expected: "NU\n" },
      { input: "9876\n", expected: "NU\n" },
    ],
  },
  {
    slug: "compararea-a-doua-fractii-fara-impartire-reala",
    title: "Compararea a doua fractii",
    statement:
      "Se citesc a, b, c, d (b si d nenule). Verificati daca fractia a/b este mai mare decat fractia c/d, fara impartire reala.\nAfisati DA sau NU.",
    official_solution:
      "#include <iostream>\nusing namespace std;\nint main(){long long a,b,c,d;cin>>a>>b>>c>>d; cout<<((a*d>c*b)?\"DA\":\"NU\"); return 0;}",
    input_format: "Se citesc patru numere intregi a b c d, cu b!=0 si d!=0.",
    output_format: "Afisati DA daca a/b > c/d, altfel NU.",
    constraints: "-10^6 <= a,b,c,d <= 10^6, b!=0, d!=0",
    tags: ["clasa9", "structuri-decizie", "fractii"],
    tests: [
      { input: "1 2 1 3\n", expected: "DA\n", isSample: true },
      { input: "2 3 3 4\n", expected: "NU\n" },
      { input: "-1 2 -3 4\n", expected: "DA\n" },
      { input: "5 -2 2 -1\n", expected: "NU\n" },
      { input: "7 8 14 16\n", expected: "NU\n" },
    ],
  },
  {
    slug: "punct-intr-un-dreptunghi",
    title: "Punct intr-un dreptunghi",
    statement:
      "Se citesc coordonatele punctului (x, y) si limitele dreptunghiului (x1, y1, x2, y2), cu laturi paralele cu axele.\nVerificati daca punctul este in interiorul sau pe marginea dreptunghiului.\nAfisati DA sau NU.",
    official_solution:
      "#include <iostream>\n#include <algorithm>\nusing namespace std;\nint main(){double x,y,x1,y1,x2,y2;cin>>x>>y>>x1>>y1>>x2>>y2; double xmin=min(x1,x2),xmax=max(x1,x2),ymin=min(y1,y2),ymax=max(y1,y2); bool ok=(x>=xmin&&x<=xmax&&y>=ymin&&y<=ymax); cout<<(ok?\"DA\":\"NU\"); return 0;}",
    input_format: "Se citesc 6 numere reale: x y x1 y1 x2 y2.",
    output_format: "Afisati DA daca punctul apartine dreptunghiului (inclusiv marginea), altfel NU.",
    constraints: "-10^6 <= toate valorile <= 10^6",
    tags: ["clasa9", "structuri-decizie", "geometrie", "plan"],
    tests: [
      { input: "2 3 1 1 4 5\n", expected: "DA\n", isSample: true },
      { input: "0 0 1 1 4 5\n", expected: "NU\n" },
      { input: "1 3 1 1 4 5\n", expected: "DA\n" },
      { input: "3 5 4 5 1 1\n", expected: "DA\n" },
      { input: "4.1 2 1 1 4 5\n", expected: "NU\n" },
    ],
  },
];

const validators = {
  "maximul-dintre-trei-numere-cu-o-singura-decizie": (i) => {
    const [a, b, c] = i.trim().split(/\s+/).map(Number);
    return `${Math.max(a, b, c)}\n`;
  },
  "minim-si-maxim-din-doua-numere": (i) => {
    const [a, b] = i.trim().split(/\s+/).map(Number);
    return `${Math.min(a, b)} ${Math.max(a, b)}\n`;
  },
  "numar-doua-cifre-cu-cifre-identice": (i) => {
    const n = Number(i.trim());
    return `${Math.floor(n / 10) === n % 10 ? "DA" : "NU"}\n`;
  },
  "cifra-dominanta-numar-3-cifre": (i) => {
    const n = Number(i.trim());
    const s = Math.floor(n / 100), z = Math.floor(n / 10) % 10, u = n % 10;
    return `${s > z + u ? "DA" : "NU"}\n`;
  },
  "numar-palindrom-3-cifre": (i) => {
    const n = Number(i.trim());
    return `${Math.floor(n / 100) === n % 10 ? "DA" : "NU"}\n`;
  },
  "paritatea-sumei-cifrelor-3-cifre": (i) => {
    const n = Number(i.trim());
    const s = Math.floor(n / 100) + Math.floor(n / 10) % 10 + n % 10;
    return `${s % 2 === 0 ? "PARA" : "IMPARA"}\n`;
  },
  "divizibilitate-compusa-2-3-fara-5": (i) => {
    const n = Number(i.trim());
    return `${n % 2 === 0 && n % 3 === 0 && n % 5 !== 0 ? "DA" : "NU"}\n`;
  },
  "an-bisect": (i) => {
    const an = Number(i.trim());
    const ok = an % 400 === 0 || (an % 4 === 0 && an % 100 !== 0);
    return `${ok ? "DA" : "NU"}\n`;
  },
  "existenta-unui-triunghi": (i) => {
    const [a, b, c] = i.trim().split(/\s+/).map(Number);
    return `${a + b > c && a + c > b && b + c > a ? "DA" : "NU"}\n`;
  },
  "triunghi-dreptunghic": (i) => {
    const v = i.trim().split(/\s+/).map(Number).sort((x, y) => x - y);
    const ok = Math.abs(v[0] * v[0] + v[1] * v[1] - v[2] * v[2]) <= 1e-9;
    return `${ok ? "DA" : "NU"}\n`;
  },
  "cea-mai-mare-cifra-dintre-zeci-si-unitati": (i) => {
    const n = Number(i.trim());
    return `${Math.max(Math.floor(n / 10), n % 10)}\n`;
  },
  "numar-aproape-rotund": (i) => {
    const n = Number(i.trim());
    const u = ((n % 10) + 10) % 10;
    return `${u === 0 || u === 5 ? "DA" : "NU"}\n`;
  },
  "apartenenta-la-interval-inchis": (i) => {
    const x = Number(i.trim());
    return `${x >= 2 && x <= 7 ? "DA" : "NU"}\n`;
  },
  "apartenenta-la-reuniune-intervale": (i) => {
    const x = Number(i.trim());
    return `${(x >= -5 && x <= -1) || (x >= 3 && x <= 10) ? "DA" : "NU"}\n`;
  },
  "semnul-produsului-fara-calcul": (i) => {
    const [a, b] = i.trim().split(/\s+/).map(Number);
    return `${(a > 0 && b > 0) || (a < 0 && b < 0) ? "DA" : "NU"}\n`;
  },
  "ora-valida": (i) => {
    const [h, m, s] = i.trim().split(/\s+/).map(Number);
    return `${h >= 0 && h <= 23 && m >= 0 && m <= 59 && s >= 0 && s <= 59 ? "DA" : "NU"}\n`;
  },
  "data-valida-simplificata-an-nebisect": (i) => {
    const [z, l] = i.trim().split(/\s+/).map(Number);
    const days = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return `${l >= 1 && l <= 12 && z >= 1 && z <= days[l] ? "DA" : "NU"}\n`;
  },
  "numar-4-cifre-proprietate-pozitii-pare-impare": (i) => {
    const n = Number(i.trim());
    const a = Math.floor(n / 1000), b = Math.floor(n / 100) % 10, c = Math.floor(n / 10) % 10, d = n % 10;
    return `${a + c === b + d ? "DA" : "NU"}\n`;
  },
  "compararea-a-doua-fractii-fara-impartire-reala": (i) => {
    const [a, b, c, d] = i.trim().split(/\s+/).map(Number);
    return `${a * d > c * b ? "DA" : "NU"}\n`;
  },
  "punct-intr-un-dreptunghi": (i) => {
    const [x, y, x1, y1, x2, y2] = i.trim().split(/\s+/).map(Number);
    const xmin = Math.min(x1, x2), xmax = Math.max(x1, x2);
    const ymin = Math.min(y1, y2), ymax = Math.max(y1, y2);
    return `${x >= xmin && x <= xmax && y >= ymin && y <= ymax ? "DA" : "NU"}\n`;
  },
};

function assertTests() {
  for (const problem of problems) {
    if (problem.tests.length < 5) throw new Error(`${problem.slug}: fewer than 5 tests`);
    if (!problem.tests.some((t) => t.isSample)) throw new Error(`${problem.slug}: no sample test`);
    const v = validators[problem.slug];
    if (!v) throw new Error(`${problem.slug}: missing validator`);
    for (const t of problem.tests) {
      const got = v(t.input);
      if (got !== t.expected) {
        throw new Error(`${problem.slug}: invalid expected for input ${JSON.stringify(t.input)}. got ${JSON.stringify(got)} expected ${JSON.stringify(t.expected)}`);
      }
    }
  }
}

async function upsertProblem(client, problem) {
  const existing = await client.query(`SELECT id FROM problems WHERE slug = $1 LIMIT 1`, [problem.slug]);
  let problemId = existing.rows[0]?.id;

  if (problemId) {
    await client.query(
      `UPDATE problems
       SET title = $2, statement = $3, official_solution = $4, input_format = $5, output_format = $6,
           constraints = $7, difficulty = $8, tags = $9, source = $10, is_published = true,
           time_limit_ms = $11, memory_limit_mb = $12, input_source = $13, output_target = $14,
           curriculum_level = $15, curriculum_chapter_id = $16, curriculum_subcategory_id = $17,
           solution_mode = $18, checker_mode = $19, updated_at = NOW()
       WHERE id = $1`,
      [
        problemId,
        problem.title,
        problem.statement,
        problem.official_solution,
        problem.input_format,
        problem.output_format,
        problem.constraints,
        BASE_META.difficulty,
        problem.tags,
        BASE_META.source,
        BASE_META.time_limit_ms,
        BASE_META.memory_limit_mb,
        BASE_META.input_source,
        BASE_META.output_target,
        BASE_META.curriculum_level,
        BASE_META.curriculum_chapter_id,
        BASE_META.curriculum_subcategory_id,
        BASE_META.solution_mode,
        BASE_META.checker_mode,
      ],
    );
    await client.query(`DELETE FROM test_cases WHERE problem_id = $1`, [problemId]);
  } else {
    const ins = await client.query(
      `INSERT INTO problems (
         title, slug, statement, official_solution, input_format, output_format, constraints, difficulty,
         tags, source, is_published, time_limit_ms, memory_limit_mb, input_source, output_target,
         curriculum_level, curriculum_chapter_id, curriculum_subcategory_id, solution_mode, checker_mode
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING id`,
      [
        problem.title,
        problem.slug,
        problem.statement,
        problem.official_solution,
        problem.input_format,
        problem.output_format,
        problem.constraints,
        BASE_META.difficulty,
        problem.tags,
        BASE_META.source,
        BASE_META.time_limit_ms,
        BASE_META.memory_limit_mb,
        BASE_META.input_source,
        BASE_META.output_target,
        BASE_META.curriculum_level,
        BASE_META.curriculum_chapter_id,
        BASE_META.curriculum_subcategory_id,
        BASE_META.solution_mode,
        BASE_META.checker_mode,
      ],
    );
    problemId = ins.rows[0].id;
  }

  for (let i = 0; i < problem.tests.length; i += 1) {
    const t = problem.tests[i];
    await client.query(
      `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [problemId, t.input, t.expected, Boolean(t.isSample), 20, i + 1],
    );
  }
}

async function main() {
  assertTests();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const p of problems) {
      await upsertProblem(client, p);
    }
    await client.query("COMMIT");
    console.log(`Seed complete. Upserted ${problems.length} structuri-decizie problems.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to seed structuri-decizie problems:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
