const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const API = "http://localhost:4000";

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

function lastNonZeroDigitBig(bigVal) {
  let s = bigVal.toString().replace(/0+$/, "");
  return s.length === 0 ? "0" : s[s.length - 1];
}

const CHIF = { level: "grade9", chapter: "algoritmi-elementari", sub: "cifrele-unui-numar" };
const CDIV = { level: "grade9", chapter: "algoritmi-elementari", sub: "divizibilitate" };

const cifreProblems = [
  {
    slug: "produsul-cifrelor-unui-numar",
    title: "Produsul cifrelor unui numar",
    statement: "Se citeste un numar natural n. Afiseaza produsul tuturor cifrelor lui n.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza produsul cifrelor lui n. Daca cel putin una dintre cifre este 0, produsul este 0.",
    constraints: "0 <= n <= 1000000000",
    difficulty: "easy",
    tags: ["cifrele-unui-numar"],
    hints: "Extrage fiecare cifra si inmulteste-o intr-o variabila produs, initializata cu 1. Cazul special n = 0 are o singura cifra, 0, deci produsul este 0.",
    explanation: "Parcurgi cifrele lui n cu o bucla, inmultind fiecare cifra intr-o variabila produs. Cazul n = 0 se trateaza separat, deoarece bucla nu s-ar executa deloc.\n\n**Complexitate:** O(numarul de cifre)",
    cpp: "#include <iostream>\nusing namespace std;\nint main(){long long n;cin>>n;if(n==0){cout<<0;return 0;}long long p=1;while(n>0){p*=n%10;n/=10;}cout<<p;return 0;}\n",
    py: "n = int(input())\nif n == 0:\n    print(0)\nelse:\n    p = 1\n    while n > 0:\n        p *= n % 10\n        n //= 10\n    print(p)\n",
    tests: ["0", "123", "105", "999", "1000000000", "7", "111", "10"],
  },
  {
    slug: "cifra-de-control-a-unui-numar",
    title: "Cifra de control a unui numar",
    statement:
      "Se citeste un numar natural n. Cifra de control a lui n este restul impartirii sumei cifrelor lui n la 10. Afiseaza cifra de control.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza cifra de control a lui n.",
    constraints: "0 <= n <= 1000000000",
    difficulty: "easy",
    tags: ["cifrele-unui-numar"],
    hints: "Calculeaza mai intai suma cifrelor lui n, apoi afiseaza restul impartirii acestei sume la 10.",
    explanation: "Calculezi suma cifrelor lui n cu o bucla, apoi afisezi suma % 10.\n\n**Complexitate:** O(numarul de cifre)",
    cpp:
      "#include <iostream>\nusing namespace std;\nint main(){long long n;cin>>n;long long suma=0;long long temp=n;while(temp>0){suma+=temp%10;temp/=10;}cout<<suma%10;return 0;}\n",
    py: "n = int(input())\nsuma = 0\ntemp = n\nwhile temp > 0:\n    suma += temp % 10\n    temp //= 10\nprint(suma % 10)\n",
    tests: ["0", "123", "999", "1000000000", "55", "19", "100", "987654321"],
  },
  {
    slug: "eliminarea-unei-cifre-dintr-un-numar",
    title: "Eliminarea unei cifre dintr-un numar",
    statement:
      "Se citesc un numar natural n si o cifra c. Elimina toate aparitiile cifrei c din scrierea lui n, pastrand ordinea celorlalte cifre, si afiseaza numarul obtinut. Daca dupa eliminare nu mai ramane nicio cifra, afiseaza 0.",
    input_format: "Pe prima linie se afla numarul natural n, apoi cifra c, separate prin spatiu.",
    output_format: "Afiseaza numarul obtinut dupa eliminarea tuturor aparitiilor cifrei c, sau 0 daca nu mai ramane nicio cifra.",
    constraints: "1 <= n <= 1000000000, 0 <= c <= 9",
    difficulty: "medium",
    tags: ["cifrele-unui-numar"],
    hints:
      "Parcurge cifrele lui n in ordinea in care apar (de la stanga la dreapta) si pastreaza doar cifrele diferite de c, construind astfel numarul rezultat.",
    explanation: "Parcurgi cifrele lui n, in ordinea din scriere, si construiesti un nou numar folosind doar cifrele diferite de c. Daca nu ramane nicio cifra, raspunsul este 0.\n\n**Complexitate:** O(numarul de cifre)",
    cpp:
      "#include <iostream>\n#include <string>\nusing namespace std;\nint main(){long long n,c;cin>>n>>c;string s=to_string(n);string rez=\"\";for(char ch:s){if((ch-'0')!=c)rez+=ch;}if(rez.empty())cout<<0;else cout<<stoll(rez);return 0;}\n",
    py:
      "n, c = map(int, input().split())\ns = str(n)\nrez = \"\".join(ch for ch in s if int(ch) != c)\nprint(0 if rez == \"\" else int(rez))\n",
    tests: ["105 0", "999 9", "12345 3", "5 5", "1000000000 0", "121212 1", "87654321 5", "10 1"],
  },
  {
    slug: "suma-cifrelor-impare-ale-unui-numar",
    title: "Suma cifrelor impare ale unui numar",
    statement: "Se citeste un numar natural n. Afiseaza suma cifrelor impare ale lui n.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza suma cifrelor impare ale lui n. Daca n nu are nicio cifra impara, afiseaza 0.",
    constraints: "0 <= n <= 1000000000",
    difficulty: "easy",
    tags: ["cifrele-unui-numar"],
    hints: "Extrage fiecare cifra a lui n pe rand si aduna-o la suma doar daca este impara.",
    explanation: "Parcurgi cifrele lui n cu o bucla; de fiecare data cand cifra curenta este impara, o adaugi la suma.\n\n**Complexitate:** O(numarul de cifre)",
    cpp:
      "#include <iostream>\nusing namespace std;\nint main(){long long n;cin>>n;long long suma=0;while(n>0){long long c=n%10;if(c%2!=0)suma+=c;n/=10;}cout<<suma;return 0;}\n",
    py: "n = int(input())\nsuma = 0\nwhile n > 0:\n    c = n % 10\n    if c % 2 != 0:\n        suma += c\n    n //= 10\nprint(suma)\n",
    tests: ["13579", "2468", "0", "1000000001", "97531", "2222", "111", "864209"],
  },
  {
    slug: "numarul-de-cifre-impare-dintr-un-numar",
    title: "Numarul de cifre impare dintr-un numar",
    statement: "Se citeste un numar natural nenul n. Afiseaza cate dintre cifrele lui n sunt impare.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza numarul de cifre impare ale lui n.",
    constraints: "1 <= n <= 1000000000",
    difficulty: "easy",
    tags: ["cifrele-unui-numar"],
    hints: "Parcurge cifrele lui n si numara-le pe cele pentru care restul impartirii la 2 este diferit de 0.",
    explanation: "Parcurgi cifrele lui n cu o bucla, incrementand un contor de fiecare data cand cifra curenta este impara.\n\n**Complexitate:** O(numarul de cifre)",
    cpp: "#include <iostream>\nusing namespace std;\nint main(){long long n;cin>>n;long long cnt=0;while(n>0){if((n%10)%2!=0)cnt++;n/=10;}cout<<cnt;return 0;}\n",
    py: "n = int(input())\ncnt = 0\nwhile n > 0:\n    if (n % 10) % 2 != 0:\n        cnt += 1\n    n //= 10\nprint(cnt)\n",
    tests: ["13579", "2468", "1000000000", "1029384756", "7", "222", "97531", "10"],
  },
  {
    slug: "duplicarea-cifrelor-pare-ale-unui-numar",
    title: "Duplicarea cifrelor pare ale unui numar",
    statement:
      "Se citeste un numar natural nenul n. Construieste un nou sir de cifre in care fiecare cifra para a lui n apare de doua ori consecutiv, iar fiecare cifra impara ramane neschimbata, pastrand ordinea initiala a cifrelor lui n. Afiseaza sirul obtinut.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza sirul de cifre rezultat, ca un singur text, fara spatii intre cifre.",
    constraints: "1 <= n <= 1000000000",
    difficulty: "medium",
    tags: ["cifrele-unui-numar"],
    hints: "Parcurge cifrele lui n in ordine si construieste rezultatul: pentru fiecare cifra para, adaug-o de doua ori; pentru fiecare cifra impara, adaug-o o singura data.",
    explanation: "Parcurgi cifrele lui n, in ordinea din scriere, si construiesti rezultatul adaugand fiecare cifra para de doua ori, iar fiecare cifra impara o singura data. Rezultatul este tratat ca un sir de caractere, nu ca un numar, pentru ca poate avea mai multe cifre decat incape intr-un tip numeric.\n\n**Complexitate:** O(numarul de cifre)",
    cpp:
      "#include <iostream>\n#include <string>\nusing namespace std;\nint main(){long long n;cin>>n;string s=to_string(n);string rez=\"\";for(char ch:s){int d=ch-'0';if(d%2==0){rez+=ch;rez+=ch;}else{rez+=ch;}}cout<<rez;return 0;}\n",
    py:
      "n = int(input())\ns = str(n)\nrez = \"\"\nfor ch in s:\n    d = int(ch)\n    if d % 2 == 0:\n        rez += ch * 2\n    else:\n        rez += ch\nprint(rez)\n",
    tests: ["123", "2468", "1357", "2222222222", "1", "2", "1029384756", "9999999999"],
  },
  {
    slug: "duplicarea-cifrelor-impare-ale-unui-numar",
    title: "Duplicarea cifrelor impare ale unui numar",
    statement:
      "Se citeste un numar natural nenul n. Construieste un nou sir de cifre in care fiecare cifra impara a lui n apare de doua ori consecutiv, iar fiecare cifra para ramane neschimbata, pastrand ordinea initiala a cifrelor lui n. Afiseaza sirul obtinut.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza sirul de cifre rezultat, ca un singur text, fara spatii intre cifre.",
    constraints: "1 <= n <= 1000000000",
    difficulty: "medium",
    tags: ["cifrele-unui-numar"],
    hints: "Parcurge cifrele lui n in ordine si construieste rezultatul: pentru fiecare cifra impara, adaug-o de doua ori; pentru fiecare cifra para, adaug-o o singura data.",
    explanation: "Parcurgi cifrele lui n, in ordinea din scriere, si construiesti rezultatul adaugand fiecare cifra impara de doua ori, iar fiecare cifra para o singura data.\n\n**Complexitate:** O(numarul de cifre)",
    cpp:
      "#include <iostream>\n#include <string>\nusing namespace std;\nint main(){long long n;cin>>n;string s=to_string(n);string rez=\"\";for(char ch:s){int d=ch-'0';if(d%2!=0){rez+=ch;rez+=ch;}else{rez+=ch;}}cout<<rez;return 0;}\n",
    py:
      "n = int(input())\ns = str(n)\nrez = \"\"\nfor ch in s:\n    d = int(ch)\n    if d % 2 != 0:\n        rez += ch * 2\n    else:\n        rez += ch\nprint(rez)\n",
    tests: ["123", "2468", "1357", "1111111111", "1", "2", "1029384756", "8888888888"],
  },
  {
    slug: "duplicarea-cifrelor-prime-ale-unui-numar",
    title: "Duplicarea cifrelor prime ale unui numar",
    statement:
      "Se citeste un numar natural nenul n. O cifra este considerata prima daca este 2, 3, 5 sau 7. Construieste un nou sir de cifre in care fiecare cifra prima a lui n apare de doua ori consecutiv, iar celelalte cifre raman neschimbate, pastrand ordinea initiala. Afiseaza sirul obtinut.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza sirul de cifre rezultat, ca un singur text, fara spatii intre cifre.",
    constraints: "1 <= n <= 1000000000",
    difficulty: "medium",
    tags: ["cifrele-unui-numar"],
    hints: "O cifra este prima daca este una dintre 2, 3, 5 sau 7. Parcurge cifrele lui n si dubleaza-le doar pe acestea.",
    explanation: "Parcurgi cifrele lui n, in ordine, si construiesti rezultatul adaugand fiecare cifra prima (2, 3, 5 sau 7) de doua ori, iar celelalte cifre o singura data.\n\n**Complexitate:** O(numarul de cifre)",
    cpp:
      "#include <iostream>\n#include <string>\nusing namespace std;\nbool eprima(int d){return d==2||d==3||d==5||d==7;}\nint main(){long long n;cin>>n;string s=to_string(n);string rez=\"\";for(char ch:s){int d=ch-'0';if(eprima(d)){rez+=ch;rez+=ch;}else{rez+=ch;}}cout<<rez;return 0;}\n",
    py:
      "def eprima(d):\n    return d in (2, 3, 5, 7)\n\nn = int(input())\ns = str(n)\nrez = \"\"\nfor ch in s:\n    d = int(ch)\n    if eprima(d):\n        rez += ch * 2\n    else:\n        rez += ch\nprint(rez)\n",
    tests: ["123", "2357", "1468", "2222222222", "1", "8", "1029384756", "7777777777"],
  },
  {
    slug: "verifica-daca-toate-cifrele-unui-numar-sunt-distincte",
    title: "Verifica daca toate cifrele unui numar sunt distincte",
    statement: "Se citeste un numar natural n. Verifica daca toate cifrele lui n sunt distincte doua cate doua (nu se repeta niciuna).",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza DA daca toate cifrele lui n sunt distincte, sau NU in caz contrar.",
    constraints: "0 <= n <= 1000000000",
    difficulty: "medium",
    tags: ["cifrele-unui-numar"],
    hints: "Retine, pentru fiecare cifra de la 0 la 9, daca a mai fost intalnita, folosind un tablou de 10 valori booleene. Daca intalnesti o cifra deja vazuta, cifrele nu sunt toate distincte.",
    explanation: "Parcurgi cifrele lui n cu o bucla, retinand intr-un tablou de 10 pozitii care cifre ai mai intalnit. Daca la un pas intalnesti o cifra deja marcata, raspunsul este NU; altfel, dupa parcurgerea completa, raspunsul este DA.\n\n**Complexitate:** O(numarul de cifre)",
    cpp:
      "#include <iostream>\nusing namespace std;\nint main(){long long n;cin>>n;bool vazuta[10]={false};bool distincte=true;long long temp=n;while(temp>0){long long c=temp%10;if(vazuta[c])distincte=false;vazuta[c]=true;temp/=10;}cout<<(distincte?\"DA\":\"NU\");return 0;}\n",
    py:
      "n = int(input())\nvazuta = [False] * 10\ndistincte = True\ntemp = n\nwhile temp > 0:\n    c = temp % 10\n    if vazuta[c]:\n        distincte = False\n    vazuta[c] = True\n    temp //= 10\nprint(\"DA\" if distincte else \"NU\")\n",
    tests: ["0", "123456789", "1123", "9876543210", "11", "1000000000", "102", "192837465"],
  },
  {
    slug: "numarul-de-cifre-prime-dintr-un-numar",
    title: "Numarul de cifre prime dintr-un numar",
    statement:
      "Se citeste un numar natural nenul n. O cifra este considerata prima daca este 2, 3, 5 sau 7. Afiseaza cate dintre cifrele lui n sunt cifre prime.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza numarul de cifre prime din scrierea lui n.",
    constraints: "1 <= n <= 1000000000",
    difficulty: "easy",
    tags: ["cifrele-unui-numar", "numere-prime"],
    hints: "Parcurge cifrele lui n si numara-le pe cele egale cu 2, 3, 5 sau 7.",
    explanation: "Parcurgi cifrele lui n cu o bucla, incrementand un contor de fiecare data cand cifra curenta este 2, 3, 5 sau 7.\n\n**Complexitate:** O(numarul de cifre)",
    cpp:
      "#include <iostream>\nusing namespace std;\nbool eprima(long long d){return d==2||d==3||d==5||d==7;}\nint main(){long long n;cin>>n;long long cnt=0;while(n>0){if(eprima(n%10))cnt++;n/=10;}cout<<cnt;return 0;}\n",
    py: "def eprima(d):\n    return d in (2, 3, 5, 7)\n\nn = int(input())\ncnt = 0\nwhile n > 0:\n    if eprima(n % 10):\n        cnt += 1\n    n //= 10\nprint(cnt)\n",
    tests: ["2357", "1468", "1000000000", "2222222222", "1", "7", "192837465", "9999999999"],
  },
  {
    slug: "suma-cifrelor-prime-dintr-un-numar",
    title: "Suma cifrelor prime dintr-un numar",
    statement: "Se citeste un numar natural nenul n. O cifra este considerata prima daca este 2, 3, 5 sau 7. Afiseaza suma cifrelor prime ale lui n.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza suma cifrelor prime ale lui n. Daca n nu are nicio cifra prima, afiseaza 0.",
    constraints: "1 <= n <= 1000000000",
    difficulty: "easy",
    tags: ["cifrele-unui-numar", "numere-prime"],
    hints: "Parcurge cifrele lui n si aduna-le doar pe cele egale cu 2, 3, 5 sau 7.",
    explanation: "Parcurgi cifrele lui n cu o bucla; de fiecare data cand cifra curenta este 2, 3, 5 sau 7, o adaugi la suma.\n\n**Complexitate:** O(numarul de cifre)",
    cpp:
      "#include <iostream>\nusing namespace std;\nbool eprima(long long d){return d==2||d==3||d==5||d==7;}\nint main(){long long n;cin>>n;long long suma=0;while(n>0){long long c=n%10;if(eprima(c))suma+=c;n/=10;}cout<<suma;return 0;}\n",
    py:
      "def eprima(d):\n    return d in (2, 3, 5, 7)\n\nn = int(input())\nsuma = 0\nwhile n > 0:\n    c = n % 10\n    if eprima(c):\n        suma += c\n    n //= 10\nprint(suma)\n",
    tests: ["2357", "1468", "1000000000", "2222222222", "1", "7", "192837465", "9999999999"],
  },
  {
    slug: "cel-mai-mare-numar-obtinut-prin-eliminarea-unei-cifre",
    title: "Cel mai mare numar obtinut prin eliminarea unei cifre",
    statement:
      "Se citeste un numar natural n, care are cel putin doua cifre. Alegand o singura pozitie din care elimini o cifra, determina cea mai mare valoare pe care o poti obtine.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza cea mai mare valoare care poate fi obtinuta prin eliminarea unei singure cifre din n.",
    constraints: "10 <= n <= 1000000000",
    difficulty: "hard",
    tags: ["cifrele-unui-numar"],
    hints:
      "Incearca, pe rand, sa elimini fiecare pozitie din scrierea lui n, calculeaza numarul obtinut in fiecare caz si retine valoarea maxima gasita.",
    explanation: "Pentru fiecare pozitie din scrierea lui n, construiesti numarul obtinut prin eliminarea acelei pozitii si il compari cu maximul retinut pana atunci. Dupa ce ai incercat toate pozitiile, maximul retinut este raspunsul.\n\n**Complexitate:** O(numarul de cifre la patrat)",
    cpp:
      "#include <iostream>\n#include <string>\nusing namespace std;\nint main(){long long n;cin>>n;string s=to_string(n);long long best=-1;for(size_t i=0;i<s.size();i++){string t=s.substr(0,i)+s.substr(i+1);long long val=stoll(t);if(val>best)best=val;}cout<<best;return 0;}\n",
    py:
      "n = int(input())\ns = str(n)\nbest = -1\nfor i in range(len(s)):\n    t = s[:i] + s[i + 1:]\n    val = int(t)\n    if val > best:\n        best = val\nprint(best)\n",
    tests: ["1234", "99", "1000000000", "1099", "5150", "10", "192837465", "1111111111"],
  },
  {
    slug: "sorteaza-cifrele-unui-numar-crescator",
    title: "Sorteaza cifrele unui numar crescator",
    statement: "Se citeste un numar natural n. Afiseaza cifrele lui n, sortate crescator, separate printr-un spatiu.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza cifrele lui n, in ordine crescatoare, separate printr-un spatiu.",
    constraints: "0 <= n <= 1000000000",
    difficulty: "medium",
    tags: ["cifrele-unui-numar", "sortare"],
    hints: "Extrage toate cifrele lui n intr-un tablou, apoi sorteaza-l crescator.",
    explanation: "Extragi toate cifrele lui n si le retii intr-un tablou, apoi il sortezi crescator si il afisezi.\n\n**Complexitate:** O(numarul de cifre * log(numarul de cifre))",
    cpp:
      "#include <iostream>\n#include <string>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main(){long long n;cin>>n;string s=to_string(n);vector<int> cifre;for(char ch:s)cifre.push_back(ch-'0');sort(cifre.begin(),cifre.end());for(size_t i=0;i<cifre.size();i++){cout<<cifre[i];if(i+1<cifre.size())cout<<\" \";}return 0;}\n",
    py: "n = int(input())\ndigits = [int(ch) for ch in str(n)]\ndigits.sort()\nprint(\" \".join(map(str, digits)))\n",
    tests: ["0", "4213", "999", "1000000000", "192837465", "5", "1100", "987654321"],
  },
];

const divProblems = [
  {
    slug: "produsul-divizorilor-unui-numar",
    title: "Produsul divizorilor unui numar",
    statement: "Se citeste un numar natural n. Afiseaza produsul tuturor divizorilor lui n (inclusiv 1 si n).",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza produsul divizorilor lui n.",
    constraints: "1 <= n <= 150",
    difficulty: "medium",
    tags: ["divizibilitate", "divizori"],
    hints: "Parcurge toate numerele d de la 1 la n si, pentru fiecare divizor gasit, inmulteste-l intr-o variabila produs.",
    explanation: "Parcurgi toate valorile d de la 1 la n; de fiecare data cand n % d == 0, inmultesti d in variabila produs.\n\n**Complexitate:** O(n)",
    cpp: "#include <iostream>\nusing namespace std;\nint main(){long long n;cin>>n;long long p=1;for(long long d=1;d<=n;d++)if(n%d==0)p*=d;cout<<p;return 0;}\n",
    py: "n = int(input())\np = 1\nfor d in range(1, n + 1):\n    if n % d == 0:\n        p *= d\nprint(p)\n",
    tests: ["1", "6", "12", "150", "100", "7", "36", "120"],
  },
  {
    slug: "clasificarea-unui-numar-dupa-divizori",
    title: "Clasificarea unui numar dupa suma divizorilor proprii",
    statement:
      "Se citeste un numar natural n. Calculeaza suma divizorilor sai proprii (toti divizorii, cu exceptia lui n insusi) si clasifica n astfel: DEFICIENT daca suma este mai mica decat n, PERFECT daca suma este egala cu n, sau ABUNDENT daca suma este mai mare decat n.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza DEFICIENT, PERFECT sau ABUNDENT, dupa caz.",
    constraints: "1 <= n <= 100000",
    difficulty: "medium",
    tags: ["divizibilitate", "divizori"],
    hints: "Calculeaza suma divizorilor proprii ai lui n (de la 1 la n-1, cei care impart exact pe n), apoi compara suma cu n.",
    explanation: "Aduni toti divizorii proprii ai lui n (de la 1 la n-1), apoi compari suma obtinuta cu n pentru a determina categoria.\n\n**Complexitate:** O(n)",
    cpp:
      "#include <iostream>\nusing namespace std;\nint main(){long long n;cin>>n;long long suma=0;for(long long d=1;d<n;d++)if(n%d==0)suma+=d;if(suma<n)cout<<\"DEFICIENT\";else if(suma==n)cout<<\"PERFECT\";else cout<<\"ABUNDENT\";return 0;}\n",
    py:
      "n = int(input())\nsuma = 0\nfor d in range(1, n):\n    if n % d == 0:\n        suma += d\nif suma < n:\n    print(\"DEFICIENT\")\nelif suma == n:\n    print(\"PERFECT\")\nelse:\n    print(\"ABUNDENT\")\n",
    tests: ["6", "28", "8", "12", "1", "96", "100000", "97"],
  },
  {
    slug: "numar-aproape-prim",
    title: "Verifica daca un numar este aproape prim (semiprim)",
    statement:
      "Se citeste un numar natural n, mai mare sau egal cu 2. Un numar este aproape prim (semiprim) daca se poate scrie ca produsul a exact doi factori primi, nu neaparat distincti (de exemplu, 4 = 2*2 si 6 = 2*3 sunt aproape prime). Verifica daca n este aproape prim.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza DA daca n este aproape prim, sau NU in caz contrar.",
    constraints: "2 <= n <= 1000000000",
    difficulty: "hard",
    tags: ["divizibilitate", "numere-prime"],
    hints:
      "Descompune n in factori primi, ca la o factorizare obisnuita, dar numara de data aceasta cate exemplare de factori primi are n in total (cu multiplicitate). Daca totalul este exact 2, n este aproape prim.",
    explanation: "Numeri toti factorii primi ai lui n, cu multiplicitate (adica un factor care apare de doua ori se numara de doua ori), folosind impartiri repetate pentru fiecare divizor candidat. Daca numarul total de factori este exact 2, n este semiprim.\n\n**Complexitate:** O(radical(n))",
    cpp:
      "#include <iostream>\nusing namespace std;\nint main(){long long n;cin>>n;long long temp=n;long long cnt=0;for(long long d=2;d*d<=temp;d++){while(temp%d==0){cnt++;temp/=d;}}if(temp>1)cnt++;cout<<((cnt==2)?\"DA\":\"NU\");return 0;}\n",
    py:
      "n = int(input())\ntemp = n\ncnt = 0\nd = 2\nwhile d * d <= temp:\n    while temp % d == 0:\n        cnt += 1\n        temp //= d\n    d += 1\nif temp > 1:\n    cnt += 1\nprint(\"DA\" if cnt == 2 else \"NU\")\n",
    tests: ["4", "6", "9", "12", "997", "999999937", "1000000000", "25"],
  },
  {
    slug: "factorii-primi-distincti-ai-unui-numar",
    title: "Factorii primi distincti ai unui numar",
    statement: "Se citeste un numar natural n, mai mare sau egal cu 2. Afiseaza toti factorii primi distincti ai lui n, in ordine crescatoare.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza factorii primi distincti ai lui n, in ordine crescatoare, separati printr-un spatiu.",
    constraints: "2 <= n <= 1000000000",
    difficulty: "medium",
    tags: ["divizibilitate", "numere-prime"],
    hints: "Parcurge divizorii candidati de la 2 in sus; de fiecare data cand gasesti un divizor prim al valorii ramase, afiseaza-l o singura data, apoi elimina-l complet inainte sa treci mai departe.",
    explanation: "Parcurgi divizorii candidati d de la 2 in sus. De fiecare data cand d divide exact valoarea ramasa, il adaugi o singura data la rezultat si il elimini complet (prin impartiri repetate) inainte sa treci la urmatorul candidat. Daca la final mai ramane o valoare mai mare decat 1, aceasta este ea insasi un factor prim.\n\n**Complexitate:** O(radical(n))",
    cpp:
      "#include <iostream>\n#include <string>\nusing namespace std;\nint main(){long long n;cin>>n;string rez=\"\";long long temp=n;for(long long d=2;d*d<=temp;d++){if(temp%d==0){if(!rez.empty())rez+=\" \";rez+=to_string(d);while(temp%d==0)temp/=d;}}if(temp>1){if(!rez.empty())rez+=\" \";rez+=to_string(temp);}cout<<rez;return 0;}\n",
    py:
      "n = int(input())\nrez = []\ntemp = n\nd = 2\nwhile d * d <= temp:\n    if temp % d == 0:\n        rez.append(str(d))\n        while temp % d == 0:\n            temp //= d\n    d += 1\nif temp > 1:\n    rez.append(str(temp))\nprint(\" \".join(rez))\n",
    tests: ["12", "2", "997", "1000000000", "360", "17", "1024", "999999937"],
  },
  {
    slug: "suma-factorilor-primi-distincti-ai-unui-numar",
    title: "Suma factorilor primi distincti ai unui numar",
    statement: "Se citeste un numar natural n, mai mare sau egal cu 2. Afiseaza suma factorilor primi distincti ai lui n.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza suma factorilor primi distincti ai lui n.",
    constraints: "2 <= n <= 1000000000",
    difficulty: "medium",
    tags: ["divizibilitate", "numere-prime"],
    hints: "Descompune n in factori primi, dar aduna fiecare factor prim distinct o singura data la suma, indiferent de cate ori apare in descompunere.",
    explanation: "Parcurgi divizorii candidati d de la 2 in sus; de fiecare data cand d divide exact valoarea ramasa, adaugi d o singura data la suma si il elimini complet. Daca la final mai ramane o valoare mai mare decat 1, o adaugi si pe aceasta la suma.\n\n**Complexitate:** O(radical(n))",
    cpp:
      "#include <iostream>\nusing namespace std;\nint main(){long long n;cin>>n;long long suma=0;long long temp=n;for(long long d=2;d*d<=temp;d++){if(temp%d==0){suma+=d;while(temp%d==0)temp/=d;}}if(temp>1)suma+=temp;cout<<suma;return 0;}\n",
    py:
      "n = int(input())\nsuma = 0\ntemp = n\nd = 2\nwhile d * d <= temp:\n    if temp % d == 0:\n        suma += d\n        while temp % d == 0:\n            temp //= d\n    d += 1\nif temp > 1:\n    suma += temp\nprint(suma)\n",
    tests: ["12", "2", "997", "1000000000", "360", "17", "1024", "999999937"],
  },
  {
    slug: "produsul-factorilor-primi-distincti-ai-unui-numar",
    title: "Produsul factorilor primi distincti ai unui numar (radicalul lui n)",
    statement: "Se citeste un numar natural n, mai mare sau egal cu 2. Afiseaza produsul factorilor primi distincti ai lui n.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza produsul factorilor primi distincti ai lui n.",
    constraints: "2 <= n <= 1000000000",
    difficulty: "medium",
    tags: ["divizibilitate", "numere-prime"],
    hints: "Descompune n in factori primi, dar inmulteste fiecare factor prim distinct o singura data in produs, indiferent de cate ori apare in descompunere.",
    explanation: "Parcurgi divizorii candidati d de la 2 in sus; de fiecare data cand d divide exact valoarea ramasa, inmultesti d o singura data in produs si il elimini complet. Daca la final mai ramane o valoare mai mare decat 1, o inmultesti si pe aceasta. Produsul factorilor primi distincti ai lui n nu poate depasi n, deci nu exista risc de depasire.\n\n**Complexitate:** O(radical(n))",
    cpp:
      "#include <iostream>\nusing namespace std;\nint main(){long long n;cin>>n;long long p=1;long long temp=n;for(long long d=2;d*d<=temp;d++){if(temp%d==0){p*=d;while(temp%d==0)temp/=d;}}if(temp>1)p*=temp;cout<<p;return 0;}\n",
    py:
      "n = int(input())\np = 1\ntemp = n\nd = 2\nwhile d * d <= temp:\n    if temp % d == 0:\n        p *= d\n        while temp % d == 0:\n            temp //= d\n    d += 1\nif temp > 1:\n    p *= temp\nprint(p)\n",
    tests: ["12", "2", "997", "1000000000", "360", "17", "1024", "999999937"],
  },
  {
    slug: "numarul-de-factori-primi-distincti-ai-unui-numar",
    title: "Numarul de factori primi distincti ai unui numar",
    statement: "Se citeste un numar natural n, mai mare sau egal cu 2. Afiseaza numarul de factori primi distincti ai lui n.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza numarul de factori primi distincti ai lui n.",
    constraints: "2 <= n <= 1000000000",
    difficulty: "medium",
    tags: ["divizibilitate", "numere-prime"],
    hints: "Descompune n in factori primi si numara-i pe cei distincti, o singura data pentru fiecare, indiferent de exponent.",
    explanation: "Parcurgi divizorii candidati d de la 2 in sus; de fiecare data cand d divide exact valoarea ramasa, incrementezi contorul si il elimini complet. Daca la final mai ramane o valoare mai mare decat 1, mai incrementezi contorul o data.\n\n**Complexitate:** O(radical(n))",
    cpp:
      "#include <iostream>\nusing namespace std;\nint main(){long long n;cin>>n;long long cnt=0;long long temp=n;for(long long d=2;d*d<=temp;d++){if(temp%d==0){cnt++;while(temp%d==0)temp/=d;}}if(temp>1)cnt++;cout<<cnt;return 0;}\n",
    py:
      "n = int(input())\ncnt = 0\ntemp = n\nd = 2\nwhile d * d <= temp:\n    if temp % d == 0:\n        cnt += 1\n        while temp % d == 0:\n            temp //= d\n    d += 1\nif temp > 1:\n    cnt += 1\nprint(cnt)\n",
    tests: ["12", "2", "997", "1000000000", "360", "17", "1024", "999999937"],
  },
  {
    slug: "verifica-daca-doua-numere-sunt-prietene",
    title: "Verifica daca doua numere sunt prietene (amicale)",
    statement:
      "Se citesc doua numere naturale a si b. Doua numere sunt prietene (amicale) daca suma divizorilor proprii ai lui a este egala cu b, si suma divizorilor proprii ai lui b este egala cu a. Verifica daca a si b sunt numere prietene.",
    input_format: "Pe prima linie se afla doua numere naturale a si b, separate prin spatiu.",
    output_format: "Afiseaza DA daca a si b sunt numere prietene, sau NU in caz contrar.",
    constraints: "1 <= a, b <= 100000",
    difficulty: "hard",
    tags: ["divizibilitate", "divizori"],
    hints: "Calculeaza suma divizorilor proprii ai lui a si suma divizorilor proprii ai lui b, apoi verifica cele doua conditii incrucisate.",
    explanation: "Calculezi suma divizorilor proprii ai lui a (numeste-o sa) si suma divizorilor proprii ai lui b (numeste-o sb), apoi verifici daca sa == b si sb == a in acelasi timp.\n\n**Complexitate:** O(a + b)",
    cpp:
      "#include <iostream>\nusing namespace std;\nlong long sumaProprie(long long x){long long s=0;for(long long d=1;d<x;d++)if(x%d==0)s+=d;return s;}\nint main(){long long a,b;cin>>a>>b;long long sa=sumaProprie(a),sb=sumaProprie(b);cout<<((sa==b&&sb==a)?\"DA\":\"NU\");return 0;}\n",
    py:
      "def suma_proprie(x):\n    return sum(d for d in range(1, x) if x % d == 0)\n\na, b = map(int, input().split())\nsa = suma_proprie(a)\nsb = suma_proprie(b)\nprint(\"DA\" if sa == b and sb == a else \"NU\")\n",
    tests: ["220 284", "284 220", "6 28", "100 100", "1184 1210", "1210 1184", "12 20", "1 1"],
  },
  {
    slug: "cel-mai-mare-divizor-comun-a-trei-numere",
    title: "Cel mai mare divizor comun a trei numere",
    statement: "Se citesc trei numere naturale a, b si c. Afiseaza cel mai mare divizor comun al celor trei.",
    input_format: "Pe prima linie se afla trei numere naturale a, b si c, separate prin spatii.",
    output_format: "Afiseaza cel mai mare divizor comun al lui a, b si c.",
    constraints: "1 <= a, b, c <= 1000000000",
    difficulty: "easy",
    tags: ["divizibilitate", "cmmdc"],
    hints: "Calculeaza mai intai cmmdc-ul dintre a si b, folosind algoritmul lui Euclid, apoi calculeaza cmmdc-ul dintre rezultatul obtinut si c.",
    explanation: "Aplici algoritmul lui Euclid pentru a si b, obtinand g1 = cmmdc(a, b), apoi aplici din nou algoritmul lui Euclid pentru g1 si c, obtinand raspunsul final cmmdc(g1, c).\n\n**Complexitate:** O(log(min(a, b, c)))",
    cpp:
      "#include <iostream>\nusing namespace std;\nlong long cmmdc(long long a,long long b){while(b!=0){long long t=b;b=a%b;a=t;}return a;}\nint main(){long long a,b,c;cin>>a>>b>>c;cout<<cmmdc(cmmdc(a,b),c);return 0;}\n",
    py:
      "def cmmdc(a, b):\n    while b != 0:\n        a, b = b, a % b\n    return a\n\na, b, c = map(int, input().split())\nprint(cmmdc(cmmdc(a, b), c))\n",
    tests: ["12 18 24", "7 13 5", "1000000000 1 1", "100 100 100", "48 18 12", "1 1 1", "17 5 3", "60 90 30"],
  },
  {
    slug: "cel-mai-mic-multiplu-comun-a-trei-numere",
    title: "Cel mai mic multiplu comun a trei numere",
    statement: "Se citesc trei numere naturale a, b si c. Afiseaza cel mai mic multiplu comun al celor trei.",
    input_format: "Pe prima linie se afla trei numere naturale a, b si c, separate prin spatii.",
    output_format: "Afiseaza cel mai mic multiplu comun al lui a, b si c.",
    constraints: "1 <= a, b, c <= 1000",
    difficulty: "medium",
    tags: ["divizibilitate", "cmmmc"],
    hints: "Calculeaza mai intai cmmmc-ul dintre a si b, folosind cmmdc-ul lor, apoi calculeaza cmmmc-ul dintre rezultatul obtinut si c.",
    explanation: "Calculezi m1 = cmmmc(a, b) = a / cmmdc(a, b) * b, apoi raspunsul final este cmmmc(m1, c) = m1 / cmmdc(m1, c) * c.\n\n**Complexitate:** O(log(min(a, b, c)))",
    cpp:
      "#include <iostream>\nusing namespace std;\nlong long cmmdc(long long a,long long b){while(b!=0){long long t=b;b=a%b;a=t;}return a;}\nlong long cmmmc(long long a,long long b){return a/cmmdc(a,b)*b;}\nint main(){long long a,b,c;cin>>a>>b>>c;cout<<cmmmc(cmmmc(a,b),c);return 0;}\n",
    py:
      "def cmmdc(a, b):\n    while b != 0:\n        a, b = b, a % b\n    return a\n\ndef cmmmc(a, b):\n    return a // cmmdc(a, b) * b\n\na, b, c = map(int, input().split())\nprint(cmmmc(cmmmc(a, b), c))\n",
    tests: ["4 6 8", "7 13 5", "1000 1 1", "12 18 6", "1 1 1", "21 6 14", "100 100 100", "9 6 4"],
  },
  {
    slug: "numere-coprime",
    title: "Verifica daca doua numere sunt coprime",
    statement: "Se citesc doua numere naturale nenule a si b. Verifica daca sunt coprime (prime intre ele), adica daca cel mai mare divizor comun al lor este 1.",
    input_format: "Pe prima linie se afla doua numere naturale a si b, separate prin spatiu.",
    output_format: "Afiseaza DA daca a si b sunt coprime, sau NU in caz contrar.",
    constraints: "1 <= a, b <= 1000000000",
    difficulty: "easy",
    tags: ["divizibilitate", "cmmdc"],
    hints: "Calculeaza cmmdc(a, b) folosind algoritmul lui Euclid. Numerele sunt coprime daca si numai daca acest cmmdc este 1.",
    explanation: "Aplici algoritmul lui Euclid pentru a calcula cmmdc(a, b), apoi verifici daca rezultatul este 1.\n\n**Complexitate:** O(log(min(a, b)))",
    cpp:
      "#include <iostream>\nusing namespace std;\nint main(){long long a,b;cin>>a>>b;long long x=a,y=b;while(y!=0){long long t=y;y=x%y;x=t;}cout<<((x==1)?\"DA\":\"NU\");return 0;}\n",
    py: "a, b = map(int, input().split())\nx, y = a, b\nwhile y != 0:\n    x, y = y, x % y\nprint(\"DA\" if x == 1 else \"NU\")\n",
    tests: ["7 13", "6 9", "1 1000000000", "1000000000 1000000000", "17 5", "100 200", "9 16", "12 35"],
  },
  {
    slug: "cate-zerouri-la-finalul-produsului-a-n-numere",
    title: "Cate zerouri sunt la finalul produsului a n numere",
    statement:
      "Se citesc un numar natural n si apoi n numere naturale nenule. Fara sa calculezi produsul lor (care poate fi extrem de mare), determina in cate cifre de 0 se termina acel produs.",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla cele n numere.",
    output_format: "Afiseaza numarul de cifre de 0 de la finalul produsului celor n numere.",
    constraints: "1 <= n <= 1000, 1 <= numar <= 1000000000",
    difficulty: "hard",
    tags: ["divizibilitate", "numere-prime"],
    hints:
      "Un numar de 0 la finalul unui produs apare dintr-o pereche de factori 2 si 5. Numara, pentru toate numerele impreuna, de cate ori apare factorul 2 si de cate ori apare factorul 5 in descompunerile lor; raspunsul este minimul dintre cele doua totaluri.",
    explanation: "Pentru fiecare numar din secventa, extragi de cate ori se imparte exact la 2 si de cate ori se imparte exact la 5, adaugand aceste valori la doua totaluri separate. Numarul de zerouri de la finalul produsului este minimul dintre totalul de factori 2 si totalul de factori 5, deoarece fiecare pereche (2, 5) produce exact un zero.\n\n**Complexitate:** O(n * log(valoare maxima))",
    cpp:
      "#include <iostream>\nusing namespace std;\nint main(){long long n;cin>>n;long long total2=0,total5=0;for(long long i=0;i<n;i++){long long x;cin>>x;while(x%2==0){total2++;x/=2;}while(x%5==0){total5++;x/=5;}}cout<<min(total2,total5);return 0;}\n",
    py:
      "n = int(input())\nvals = list(map(int, input().split()))\ntotal2 = 0\ntotal5 = 0\nfor x in vals:\n    while x % 2 == 0:\n        total2 += 1\n        x //= 2\n    while x % 5 == 0:\n        total5 += 1\n        x //= 5\nprint(min(total2, total5))\n",
    tests: [
      "3\n10 20 30",
      "1\n1000000000",
      "4\n2 2 5 5",
      "2\n3 7",
      "5\n5 5 5 5 5",
      "3\n8 8 8",
      "1\n1",
      "6\n2 4 6 8 10 12",
    ],
  },
  {
    slug: "numarul-de-zerouri-de-la-finalul-lui-n-factorial",
    title: "Numarul de zerouri de la finalul lui n factorial",
    statement:
      "Se citeste un numar natural n. Determina in cate cifre de 0 se termina n! (n factorial), fara sa calculezi efectiv valoarea lui n!.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza numarul de cifre de 0 de la finalul lui n!.",
    constraints: "0 <= n <= 100000",
    difficulty: "easy",
    tags: ["divizibilitate", "factorial"],
    hints:
      "Ia, pe rand, fiecare numar de la 1 la n si numara de cate ori se imparte exact la 2, respectiv la 5, adaugand aceste valori la doua totaluri separate. Raspunsul este minimul dintre cele doua totaluri.",
    explanation: "Pentru fiecare numar i de la 1 la n, numeri de cate ori se imparte exact la 2 (adaugand la totalul de factori 2) si de cate ori se imparte exact la 5 (adaugand la totalul de factori 5). Numarul de zerouri de la finalul lui n! este minimul dintre cele doua totaluri.\n\n**Complexitate:** O(n * log(n))",
    cpp:
      "#include <iostream>\nusing namespace std;\nint main(){long long n;cin>>n;long long total2=0,total5=0;for(long long i=1;i<=n;i++){long long x=i;while(x%2==0){total2++;x/=2;}x=i;while(x%5==0){total5++;x/=5;}}cout<<min(total2,total5);return 0;}\n",
    py:
      "n = int(input())\ntotal2 = 0\ntotal5 = 0\nfor i in range(1, n + 1):\n    x = i\n    while x % 2 == 0:\n        total2 += 1\n        x //= 2\n    x = i\n    while x % 5 == 0:\n        total5 += 1\n        x //= 5\nprint(min(total2, total5))\n",
    tests: ["0", "1", "5", "10", "25", "100", "5000", "100000"],
  },
  {
    slug: "numarul-de-zerouri-de-la-finalul-lui-n-factorial-pentru-n-mare",
    title: "Numarul de zerouri de la finalul lui n factorial, pentru n foarte mare (formula lui Legendre)",
    statement:
      "Se citeste un numar natural n, care poate fi foarte mare. Determina in cate cifre de 0 se termina n! (n factorial). Deoarece n poate fi de ordinul 10^15, o abordare care parcurge fiecare numar de la 1 la n este mult prea lenta.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza numarul de cifre de 0 de la finalul lui n!.",
    constraints: "0 <= n <= 1000000000000000",
    difficulty: "hard",
    tags: ["divizibilitate", "factorial"],
    hints:
      "Foloseste formula lui Legendre pentru a calcula direct exponentul lui 5 in descompunerea in factori primi a lui n!: aduna n/5 + n/25 + n/125 + ... (impartiri intregi), pana cand puterea lui 5 depaseste n. Deoarece exponentul lui 2 in n! este mereu mai mare sau egal cu exponentul lui 5, numarul de zerouri este exact exponentul lui 5.",
    explanation: "Formula lui Legendre calculeaza direct exponentul unui numar prim p in descompunerea lui n!, ca suma n/p + n/p^2 + n/p^3 + ... (impartiri intregi), fara sa parcurga fiecare numar de la 1 la n. Aplicand formula pentru p = 5, obtii direct numarul de zerouri de la finalul lui n!, deoarece factorul 5 este mereu mai rar decat factorul 2 in produsul 1 * 2 * ... * n.\n\n**Complexitate:** O(log_5(n))",
    cpp:
      "#include <iostream>\nusing namespace std;\nint main(){long long n;cin>>n;long long total=0;long long divizor=5;while(n/divizor>=1){total+=n/divizor;divizor*=5;}cout<<total;return 0;}\n",
    py: "n = int(input())\ntotal = 0\ndivizor = 5\nwhile n // divizor >= 1:\n    total += n // divizor\n    divizor *= 5\nprint(total)\n",
    tests: ["0", "5", "100", "5000", "1000000000", "1000000000000", "999999999999999", "1000000000000000"],
  },
  {
    slug: "ultima-cifra-nenula-a-produsului-a-n-numere",
    title: "Ultima cifra nenula a produsului a n numere",
    statement:
      "Se citesc un numar natural n si apoi n numere naturale nenule. Fara sa calculezi produsul lor (care poate fi extrem de mare), determina ultima cifra nenula a acelui produs (adica ultima cifra dupa ce elimini toate zerourile de la final).",
    input_format: "Pe prima linie se afla numarul natural n. Pe a doua linie se afla cele n numere.",
    output_format: "Afiseaza ultima cifra nenula a produsului celor n numere.",
    constraints: "1 <= n <= 100, 1 <= numar <= 1000000",
    difficulty: "hard",
    tags: ["divizibilitate", "cifrele-unui-numar"],
    hints:
      "Elimina din fiecare numar toti factorii 2 si toti factorii 5, numarand de cate ori ai facut asta pentru fiecare (in doua totaluri separate). Inmulteste ce ramane din fiecare numar (dupa eliminare) intr-un produs calculat modulo 10. La final, daca ai eliminat mai multi factori 2 decat 5, inmulteste inapoi in produs diferenta de factori 2; altfel, inmulteste inapoi diferenta de factori 5.",
    explanation:
      "Pentru fiecare numar, elimini complet factorii 2 si factorii 5, numarand totalul lor separat (total2 si total5), si inmultesti ce a ramas din numar (calculat modulo 10) intr-un produs, tot modulo 10. La final, numarul de factori 2 sau 5 care nu au avut pereche (diferenta |total2 - total5|) trebuie inmultita inapoi in produs, folosind baza corespunzatoare (2 daca au fost mai multi factori 2, sau 5 daca au fost mai multi factori 5), tot modulo 10.\n\n**Complexitate:** O(n * log(valoare maxima))",
    cpp:
      "#include <iostream>\nusing namespace std;\nint main(){long long n;cin>>n;long long total2=0,total5=0;long long rez=1;for(long long i=0;i<n;i++){long long x;cin>>x;while(x%2==0){total2++;x/=2;}while(x%5==0){total5++;x/=5;}rez=(rez*(x%10))%10;}long long diff=total2-total5;if(diff>0){for(long long i=0;i<diff;i++)rez=(rez*2)%10;}else if(diff<0){for(long long i=0;i<(-diff);i++)rez=(rez*5)%10;}cout<<rez;return 0;}\n",
    py:
      "n = int(input())\nvals = list(map(int, input().split()))\ntotal2 = 0\ntotal5 = 0\nrez = 1\nfor x in vals:\n    while x % 2 == 0:\n        total2 += 1\n        x //= 2\n    while x % 5 == 0:\n        total5 += 1\n        x //= 5\n    rez = (rez * (x % 10)) % 10\ndiff = total2 - total5\nif diff > 0:\n    for _ in range(diff):\n        rez = (rez * 2) % 10\nelif diff < 0:\n    for _ in range(-diff):\n        rez = (rez * 5) % 10\nprint(rez)\n",
    tests: [
      "2\n4 25",
      "2\n6 15",
      "3\n2 2 2",
      "2\n5 5",
      "4\n3 3 3 3",
      "3\n10 10 10",
      "1\n1000000",
      "5\n7 11 13 17 19",
    ],
    bruteForce: "productLastNonZero",
  },
  {
    slug: "ultima-cifra-nenula-a-lui-n-factorial",
    title: "Ultima cifra nenula a lui n factorial",
    statement: "Se citeste un numar natural n. Determina ultima cifra nenula a lui n! (n factorial), fara sa calculezi efectiv valoarea lui n!.",
    input_format: "Pe prima linie se afla numarul natural n.",
    output_format: "Afiseaza ultima cifra nenula a lui n!.",
    constraints: "0 <= n <= 2000",
    difficulty: "hard",
    tags: ["divizibilitate", "cifrele-unui-numar", "factorial"],
    hints:
      "Aplica aceeasi idee ca la ultima cifra nenula a unui produs de numere, dar de data aceasta pentru secventa 1, 2, ..., n: elimina factorii 2 si 5 din fiecare numar, acumuland produsul ramas modulo 10, apoi inmulteste inapoi la final diferenta de factori 2 sau 5 neperechi.",
    explanation: "Aplici algoritmul de la ultima cifra nenula a unui produs, dar folosind ca numere chiar valorile 1, 2, ..., n. Elimini factorii 2 si 5 din fiecare, acumulezi produsul ramas modulo 10, apoi inmultesti inapoi in produs excesul de factori 2 sau 5 ramas neperechiat.\n\n**Complexitate:** O(n * log(n))",
    cpp:
      "#include <iostream>\nusing namespace std;\nint main(){long long n;cin>>n;long long total2=0,total5=0;long long rez=1;for(long long i=1;i<=n;i++){long long x=i;while(x%2==0){total2++;x/=2;}while(x%5==0){total5++;x/=5;}rez=(rez*(x%10))%10;}long long diff=total2-total5;if(diff>0){for(long long i=0;i<diff;i++)rez=(rez*2)%10;}else if(diff<0){for(long long i=0;i<(-diff);i++)rez=(rez*5)%10;}cout<<rez;return 0;}\n",
    py:
      "n = int(input())\ntotal2 = 0\ntotal5 = 0\nrez = 1\nfor i in range(1, n + 1):\n    x = i\n    while x % 2 == 0:\n        total2 += 1\n        x //= 2\n    while x % 5 == 0:\n        total5 += 1\n        x //= 5\n    rez = (rez * (x % 10)) % 10\ndiff = total2 - total5\nif diff > 0:\n    for _ in range(diff):\n        rez = (rez * 2) % 10\nelif diff < 0:\n    for _ in range(-diff):\n        rez = (rez * 5) % 10\nprint(rez)\n",
    tests: ["0", "1", "5", "10", "13", "25", "100", "2000"],
    bruteForce: "factorialLastNonZero",
  },
];

function normalize(text) {
  return text.trim().split(/\r?\n/).map((line) => line.trim()).join("\n");
}

function bruteForceCheck(p, input, claimedOutput) {
  if (p.bruteForce === "productLastNonZero") {
    const lines = input.split("\n");
    const nums = lines[1].split(" ").map((s) => BigInt(s));
    const product = nums.reduce((acc, x) => acc * x, 1n);
    const expected = lastNonZeroDigitBig(product);
    if (expected !== claimedOutput) {
      throw new Error(`BRUTE FORCE MISMATCH for ${p.slug}: input=${JSON.stringify(input)} algorithm=${claimedOutput} bruteforce=${expected}`);
    }
  } else if (p.bruteForce === "factorialLastNonZero") {
    const n = parseInt(input, 10);
    let fact = 1n;
    for (let i = 1; i <= n; i++) fact *= BigInt(i);
    const expected = lastNonZeroDigitBig(fact);
    if (expected !== claimedOutput) {
      throw new Error(`BRUTE FORCE MISMATCH for ${p.slug}: input=${JSON.stringify(input)} algorithm=${claimedOutput} bruteforce=${expected}`);
    }
  }
}

async function seedGroup(problems, chapterInfo) {
  const summary = [];

  for (const p of problems) {
    console.log(`\n=== ${p.slug} ===`);

    const insertResult = await pool.query(
      `INSERT INTO problems (
         slug, title, statement, input_format, output_format, constraints,
         difficulty, time_limit_ms, memory_limit_mb, source, tags,
         allowed_languages, is_published, official_solution,
         hints, explanation, official_solution_cpp, official_solution_python,
         curriculum_level, curriculum_chapter_id, curriculum_subcategory_id,
         solution_mode, checker_mode, editorial_status, estimated_minutes
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,false,$13,$14,$15,$16,$17,$18,$19,$20,'full','exact','draft',5
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
        1500,
        64,
        "Zece la Info",
        p.tags,
        ["cpp", "c", "pascal", "python"],
        p.cpp,
        p.hints,
        p.explanation,
        p.cpp,
        p.py,
        chapterInfo.level,
        chapterInfo.chapter,
        chapterInfo.sub,
      ],
    );
    const problemId = insertResult.rows[0].id;

    let allOk = true;
    const testRows = [];

    for (let i = 0; i < p.tests.length; i++) {
      const input = p.tests[i];
      const cppOut = await runCustom("cpp", p.cpp, input);
      const pyOut = await runCustom("python", p.py, input);

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

      if (p.bruteForce) {
        try {
          bruteForceCheck(p, input, normCpp);
          console.log(`  test ${i}: OK + brute-force verified -> "${normCpp.slice(0, 60)}"`);
        } catch (err) {
          console.error(`  ${err.message}`);
          allOk = false;
          continue;
        }
      }

      testRows.push({ input, expected_output: normCpp, is_sample: i < 2, points: 10, order_index: i });
    }

    if (!allOk) {
      console.error(`!!! ${p.slug} has failing tests - NOT publishing.`);
      summary.push({ slug: p.slug, ok: false, tests: testRows.length });
      continue;
    }

    for (const t of testRows) {
      await pool.query(
        `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [problemId, t.input, t.expected_output, t.is_sample, t.points, t.order_index],
      );
    }

    await pool.query(`UPDATE problems SET is_published = true, editorial_status = 'published' WHERE id = $1`, [problemId]);
    console.log(`published ${p.slug} (${p.difficulty}) with ${testRows.length} tests`);
    summary.push({ slug: p.slug, ok: true, tests: testRows.length });
  }

  return summary;
}

async function main() {
  const s1 = await seedGroup(cifreProblems, CHIF);
  const s2 = await seedGroup(divProblems, CDIV);
  const summary = [...s1, ...s2];

  console.log("\n=== SUMMARY ===");
  let okCount = 0;
  for (const s of summary) {
    if (s.ok) okCount++;
    console.log(`${s.ok ? "OK  " : "FAIL"} ${s.slug} (${s.tests} tests)`);
  }
  console.log(`\n${okCount}/${summary.length} published`);

  await pool.end();
}

main().catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
