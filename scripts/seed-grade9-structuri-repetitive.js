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
  curriculum_chapter_id: "structuri-repetitive",
  curriculum_subcategory_id: "structuri-repetitive-general",
  solution_mode: "full",
  checker_mode: "exact",
  source: "Sursa interna",
};

const join = (arr) => `${arr.join(" ")}\n`;
const lines = (arr) => `${arr.join("\n")}\n`;
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

const defs = [
  // A
  ["afisare-1-la-n", "Se citeste n. Afisati numerele de la 1 la n.", "n", "Numere separate prin spatiu.", (n) => join(range(1, n)), "for(int i=1;i<=n;i++) cout<<i<<' ';"],
  ["afisare-n-la-1", "Se citeste n. Afisati numerele de la n la 1.", "n", "Numere separate prin spatiu.", (n) => join(range(1, n).reverse()), "for(int i=n;i>=1;i--) cout<<i<<' ';"],
  ["pare-1-la-n", "Se citeste n. Afisati toate numerele pare de la 1 la n.", "n", "Numere pare separate prin spatiu.", (n) => join(range(1, n).filter((x) => x % 2 === 0)), "for(int i=2;i<=n;i+=2) cout<<i<<' ';"],
  ["impare-1-la-n", "Se citeste n. Afisati toate numerele impare de la 1 la n.", "n", "Numere impare separate prin spatiu.", (n) => join(range(1, n).filter((x) => x % 2)), "for(int i=1;i<=n;i+=2) cout<<i<<' ';"],
  ["pare-interval-a-b", "Se citesc a si b. Afisati toate numerele pare din intervalul [a, b].", "a b", "Numere pare separate prin spatiu.", (a, b) => join(range(a, b).filter((x) => x % 2 === 0)), "for(int i=a;i<=b;i++) if(i%2==0) cout<<i<<' ';"],
  ["impare-interval-a-b", "Se citesc a si b. Afisati toate numerele impare din intervalul [a, b].", "a b", "Numere impare separate prin spatiu.", (a, b) => join(range(a, b).filter((x) => x % 2 !== 0)), "for(int i=a;i<=b;i++) if(i%2) cout<<i<<' ';"],
  ["primele-n-pare", "Se citeste n. Afisati primele n numere pare pozitive.", "n", "Numere separate prin spatiu.", (n) => join(Array.from({ length: n }, (_, i) => 2 * (i + 1))), "for(int i=1;i<=n;i++) cout<<2*i<<' ';"],
  ["primele-n-impare", "Se citeste n. Afisati primele n numere impare pozitive.", "n", "Numere separate prin spatiu.", (n) => join(Array.from({ length: n }, (_, i) => 2 * i + 1)), "for(int i=0;i<n;i++) cout<<2*i+1<<' ';"],
  ["patrate-1-la-n", "Se citeste n. Afisati patratele numerelor de la 1 la n.", "n", "Numere separate prin spatiu.", (n) => join(Array.from({ length: n }, (_, i) => (i + 1) ** 2)), "for(int i=1;i<=n;i++) cout<<1LL*i*i<<' ';"],
  ["cuburi-1-la-n", "Se citeste n. Afisati cuburile numerelor de la 1 la n.", "n", "Numere separate prin spatiu.", (n) => join(Array.from({ length: n }, (_, i) => (i + 1) ** 3)), "for(int i=1;i<=n;i++) cout<<1LL*i*i*i<<' ';"],
  ["multiplii-lui-3-pana-la-n", "Se citeste n. Afisati multiplii lui 3 mai mici sau egali cu n.", "n", "Numere separate prin spatiu.", (n) => join(range(1, n).filter((x) => x % 3 === 0)), "for(int i=3;i<=n;i+=3) cout<<i<<' ';"],
  ["divizibile-cu-2-sau-5-pana-la-n", "Se citeste n. Afisati numerele de la 1 la n divizibile cu 2 sau 5.", "n", "Numere separate prin spatiu.", (n) => join(range(1, n).filter((x) => x % 2 === 0 || x % 5 === 0)), "for(int i=1;i<=n;i++) if(i%2==0||i%5==0) cout<<i<<' ';"],
  ["doua-cifre-divizibile-cu-n", "Se citeste n. Afisati toate numerele de doua cifre divizibile cu n.", "n", "Numere separate prin spatiu.", (n) => join(range(10, 99).filter((x) => x % n === 0)), "for(int i=10;i<=99;i++) if(i%n==0) cout<<i<<' ';"],
  ["interval-divizibile-cu-k", "Se citesc a, b, k. Afisati numerele din [a,b] divizibile cu k.", "a b k", "Numere separate prin spatiu.", (a, b, k) => join(range(a, b).filter((x) => x % k === 0)), "for(int i=a;i<=b;i++) if(i%k==0) cout<<i<<' ';"],
  ["sir-urcare-coborare-oglinda", "Se citeste n. Afisati: 1 2 ... n n ... 2 1", "n", "Sirul cerut.", (n) => join([...range(1, n), ...range(1, n).reverse()]), "for(int i=1;i<=n;i++) cout<<i<<' '; for(int i=n;i>=1;i--) cout<<i<<' ';"],
  ["sir-fiecare-numar-de-doua-ori", "Se citeste n. Afisati: 1 1 2 2 ... n n", "n", "Sirul cerut.", (n) => join(Array.from({ length: n }, (_, i) => [i + 1, i + 1]).flat()), "for(int i=1;i<=n;i++) cout<<i<<' '<<i<<' ';"],
  ["sir-numar-repetat-de-valoare", "Se citeste n. Afisati: 1 2 2 3 3 3 ... n repetat de n ori.", "n", "Sirul cerut.", (n) => join(Array.from({ length: n }, (_, i) => Array(i + 1).fill(i + 1)).flat()), "for(int i=1;i<=n;i++) for(int j=1;j<=i;j++) cout<<i<<' ';"],
  ["sir-descrescator-cu-repetitii-crescatoare", "Se citeste n. Afisati: n, n-1 de 2 ori, n-2 de 3 ori ... 1 de n ori.", "n", "Sirul cerut.", (n) => join(Array.from({ length: n }, (_, i) => Array(i + 1).fill(n - i)).flat()), "for(int i=0;i<n;i++) for(int j=0;j<=i;j++) cout<<n-i<<' ';"],
  ["toate-perechile-i-j-1-la-n", "Se citeste n. Afisati toate perechile (i,j), 1<=i,j<=n.", "n", "Cate o pereche pe linie.", (n) => lines(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => `(${i + 1},${j + 1})`)).flat()), "for(int i=1;i<=n;i++) for(int j=1;j<=n;j++) cout<<'('<<i<<','<<j<<\")\\n\";"],
  ["toate-perechile-i-j-cu-i-mai-mic-j", "Se citeste n. Afisati perechile (i,j) cu 1<=i<j<=n.", "n", "Cate o pereche pe linie.", (n) => lines(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => [i + 1, j + 1]).filter(([a, b]) => a < b).map(([a, b]) => `(${a},${b})`)).flat()), "for(int i=1;i<=n;i++) for(int j=i+1;j<=n;j++) cout<<'('<<i<<','<<j<<\")\\n\";"],

  // B
  ["patrat-plin-cu-stelute", "Se citeste n. Afisati un patrat n x n format din *.", "n", "Modelul cerut.", (n) => lines(Array.from({ length: n }, () => "*".repeat(n))), "for(int i=0;i<n;i++){ for(int j=0;j<n;j++) cout<<'*'; cout<<\"\\n\"; }"],
  ["triunghi-dreptunghic-stelute", "Se citeste n. Afisati triunghi dreptunghic crescator din *.", "n", "Modelul cerut.", (n) => lines(Array.from({ length: n }, (_, i) => "*".repeat(i + 1))), "for(int i=1;i<=n;i++){ for(int j=0;j<i;j++) cout<<'*'; cout<<\"\\n\"; }"],
  ["triunghi-dreptunghic-inversat-stelute", "Se citeste n. Afisati triunghi dreptunghic inversat din *.", "n", "Modelul cerut.", (n) => lines(Array.from({ length: n }, (_, i) => "*".repeat(n - i))), "for(int i=n;i>=1;i--){ for(int j=0;j<i;j++) cout<<'*'; cout<<\"\\n\"; }"],
  ["triunghi-dreapta-stelute", "Se citeste n. Afisati triunghi aliniat la dreapta.", "n", "Modelul cerut.", (n) => lines(Array.from({ length: n }, (_, i) => " ".repeat(n - i - 1) + "*".repeat(i + 1))), "for(int i=1;i<=n;i++){ for(int s=0;s<n-i;s++) cout<<' '; for(int j=0;j<i;j++) cout<<'*'; cout<<\"\\n\"; }"],
  ["triunghi-inversat-dreapta-stelute", "Se citeste n. Afisati triunghi inversat aliniat la dreapta.", "n", "Modelul cerut.", (n) => lines(Array.from({ length: n }, (_, i) => " ".repeat(i) + "*".repeat(n - i))), "for(int i=0;i<n;i++){ for(int s=0;s<i;s++) cout<<' '; for(int j=0;j<n-i;j++) cout<<'*'; cout<<\"\\n\"; }"],
  ["patrat-gol-stelute", "Se citeste n. Afisati patrat gol pe interior.", "n", "Modelul cerut.", (n) => lines(Array.from({ length: n }, (_, i) => i === 0 || i === n - 1 ? "*".repeat(n) : `*${" ".repeat(Math.max(0, n - 2))}*`)), "for(int i=0;i<n;i++){ for(int j=0;j<n;j++) cout<<((i==0||i==n-1||j==0||j==n-1)?'*':' '); cout<<\"\\n\"; }"],
  ["dreptunghi-gol-n-m-stelute", "Se citesc n si m. Afisati dreptunghi gol pe interior.", "n m", "Modelul cerut.", (n, m) => lines(Array.from({ length: n }, (_, i) => i === 0 || i === n - 1 ? "*".repeat(m) : `*${" ".repeat(Math.max(0, m - 2))}*`)), "for(int i=0;i<n;i++){ for(int j=0;j<m;j++) cout<<((i==0||i==n-1||j==0||j==m-1)?'*':' '); cout<<\"\\n\"; }"],
  ["diagonala-principala-stelute", "Se citeste n. Afisati diagonala principala intr-un patrat n x n cu *.", "n", "Cate o linie pe rand.", (n) => lines(Array.from({ length: n }, (_, i) => " ".repeat(i) + "*")), "for(int i=0;i<n;i++){ for(int s=0;s<i;s++) cout<<' '; cout<<\"*\\n\"; }"],
  ["diagonala-secundara-stelute", "Se citeste n. Afisati diagonala secundara intr-un patrat n x n cu *.", "n", "Cate o linie pe rand.", (n) => lines(Array.from({ length: n }, (_, i) => " ".repeat(n - i - 1) + "*")), "for(int i=0;i<n;i++){ for(int s=0;s<n-i-1;s++) cout<<' '; cout<<\"*\\n\"; }"],
  ["ambele-diagonale-stelute", "Se citeste n. Afisati ambele diagonale intr-un patrat n x n.", "n", "Modelul cerut.", (n) => lines(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (j === i || j === n - i - 1 ? "*" : " ")).join(""))), "for(int i=0;i<n;i++){ for(int j=0;j<n;j++) cout<<((j==i||j==n-i-1)?'*':' '); cout<<\"\\n\"; }"],
  ["romb-plin-stelute", "Se citeste n. Afisati un romb plin (inaltime 2*n-1).", "n", "Modelul cerut.", (n) => lines([...Array.from({ length: n }, (_, i) => " ".repeat(n - i - 1) + "*".repeat(2 * i + 1)), ...Array.from({ length: n - 1 }, (_, i) => " ".repeat(i + 1) + "*".repeat(2 * (n - i - 2) + 1))]), "for(int i=1;i<=n;i++){ for(int s=0;s<n-i;s++) cout<<' '; for(int j=0;j<2*i-1;j++) cout<<'*'; cout<<\"\\n\";} for(int i=n-1;i>=1;i--){ for(int s=0;s<n-i;s++) cout<<' '; for(int j=0;j<2*i-1;j++) cout<<'*'; cout<<\"\\n\";}"],
  ["romb-gol-stelute", "Se citeste n. Afisati un romb gol pe interior.", "n", "Modelul cerut.", (n) => {
    if (n === 1) return "*\n";
    const up = Array.from({ length: n }, (_, i) => i === 0 ? `${" ".repeat(n - 1)}*` : `${" ".repeat(n - i - 1)}*${" ".repeat(2 * i - 1)}*`);
    const down = Array.from({ length: n - 1 }, (_, i) => {
      const k = n - i - 2;
      return k === 0 ? `${" ".repeat(n - 1)}*` : `${" ".repeat(n - k - 1)}*${" ".repeat(2 * k - 1)}*`;
    });
    return lines([...up, ...down]);
  }, "se construieste cu doua triunghiuri goale"],
  ["piramida-plina-stelute", "Se citeste n. Afisati o piramida plina.", "n", "Modelul cerut.", (n) => lines(Array.from({ length: n }, (_, i) => " ".repeat(n - i - 1) + "*".repeat(2 * i + 1))), "for(int i=1;i<=n;i++){ for(int s=0;s<n-i;s++) cout<<' '; for(int j=0;j<2*i-1;j++) cout<<'*'; cout<<\"\\n\"; }"],
  ["piramida-inversata-stelute", "Se citeste n. Afisati o piramida inversata.", "n", "Modelul cerut.", (n) => lines(Array.from({ length: n }, (_, i) => " ".repeat(i) + "*".repeat(2 * (n - i) - 1))), "for(int i=n;i>=1;i--){ for(int s=0;s<n-i;s++) cout<<' '; for(int j=0;j<2*i-1;j++) cout<<'*'; cout<<\"\\n\"; }"],
  ["x-in-matrice-stelute", "Se citeste n. Afisati un X intr-o matrice n x n.", "n", "Modelul cerut.", (n) => lines(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (j === i || j === n - i - 1 ? "*" : " ")).join(""))), "aceeasi idee ca ambele diagonale"],
  ["contur-si-diagonale-patrat", "Se citeste n. Afisati conturul patratului si ambele diagonale.", "n", "Modelul cerut.", (n) => lines(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === 0 || i === n - 1 || j === 0 || j === n - 1 || i === j || j === n - i - 1 ? "*" : " ")).join(""))), "if pe contur sau diagonale"],

  // C
  ["model-cifre-1-la-i", "Se citeste n. Afisati modelul: 1 / 12 / 123 / ...", "n", "Modelul cerut.", (n) => lines(Array.from({ length: n }, (_, i) => range(1, i + 1).join(""))), "for i linie, for j 1..i"],
  ["model-linie-repeta-indexul", "Se citeste n. Afisati modelul: 1 / 22 / 333 / ...", "n", "Modelul cerut.", (n) => lines(Array.from({ length: n }, (_, i) => String(i + 1).repeat(i + 1))), "for i linie, afisezi i de i ori"],
  ["model-descrescator-de-la-i", "Se citeste n. Afisati: 1 / 21 / 321 / ...", "n", "Modelul cerut.", (n) => lines(Array.from({ length: n }, (_, i) => range(1, i + 1).reverse().join(""))), "for i, for j=i..1"],
  ["model-triunghi-invers-crescator", "Se citeste n. Afisati: 123..n / 123..n-1 / ... / 1", "n", "Modelul cerut.", (n) => lines(Array.from({ length: n }, (_, i) => range(1, n - i).join(""))), "for i=n..1, afisare 1..i"],
  ["patrat-fiecare-linie-numarul-liniei", "Se citeste n. Patrat n x n cu numarul liniei.", "n", "Modelul cerut.", (n) => lines(Array.from({ length: n }, (_, i) => String(i + 1).repeat(n))), "for i, repeat i n ori"],
  ["patrat-fiecare-coloana-numarul-coloanei", "Se citeste n. Patrat n x n cu numarul coloanei.", "n", "Modelul cerut.", (n) => lines(Array.from({ length: n }, () => range(1, n).join(""))), "for i linie, for j col"],
  ["matrice-consecutive-1-la-n-patrat", "Se citeste n. Afisati matrice n x n cu valori consecutive 1..n*n.", "n", "Matrice cu spatii intre valori.", (n) => {
    let cur = 1;
    return lines(Array.from({ length: n }, () => Array.from({ length: n }, () => cur++).join(" ")));
  }, "cur++ in dublu for"],
  ["matrice-consecutive-linie-para-invers", "Se citeste n. Afisati matrice n x n consecutive, liniile pare invers.", "n", "Matrice cu spatii intre valori.", (n) => {
    let cur = 1;
    const rows = [];
    for (let i = 1; i <= n; i++) {
      const row = Array.from({ length: n }, () => cur++);
      if (i % 2 === 0) row.reverse();
      rows.push(row.join(" "));
    }
    return lines(rows);
  }, "inversare pe linii pare"],
  ["model-triunghi-consecutive", "Se citeste n. Afisati modelul: 1 / 23 / 456 / ...", "n", "Modelul cerut.", (n) => {
    let cur = 1;
    const rows = [];
    for (let i = 1; i <= n; i++) {
      rows.push(Array.from({ length: i }, () => cur++).join(""));
    }
    return lines(rows);
  }, "cur++ pe fiecare element"],
  ["tabla-sah-0-1", "Se citeste n. Afisati tabla de sah n x n cu 0 si 1.", "n", "Modelul cerut.", (n) => lines(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => ((i + j) % 2)).join(""))), "valoare=(i+j)%2"],
  ["tabla-sah-steluta-punct", "Se citeste n. Afisati tabla de sah n x n cu * si .", "n", "Modelul cerut.", (n) => lines(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => ((i + j) % 2 === 0 ? "*" : ".")).join(""))), "paritate i+j"],
  ["matrice-element-i-plus-j", "Se citeste n. A(i,j)=i+j pentru i,j de la 1 la n.", "n", "Matrice cu spatii.", (n) => lines(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i + 1 + j + 1).join(" "))), "afisezi i+j"],
  ["matrice-element-i-ori-j", "Se citeste n. A(i,j)=i*j pentru i,j de la 1 la n.", "n", "Matrice cu spatii.", (n) => lines(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i + 1) * (j + 1)).join(" "))), "afisezi i*j"],
  ["matrice-identitate-1-0", "Se citeste n. Matrice n x n cu 1 pe diagonala principala si 0 in rest.", "n", "Matrice cu spatii.", (n) => lines(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)).join(" "))), "if(i==j)1 else 0"],
];

const tests = {
  // A
  "afisare-1-la-n": [[5], [1], [2], [7], [10]],
  "afisare-n-la-1": [[5], [1], [2], [7], [10]],
  "pare-1-la-n": [[10], [1], [2], [7], [12]],
  "impare-1-la-n": [[10], [1], [2], [7], [12]],
  "pare-interval-a-b": [[3, 12], [1, 1], [2, 2], [8, 15], [10, 20]],
  "impare-interval-a-b": [[3, 12], [1, 1], [2, 2], [8, 15], [10, 20]],
  "primele-n-pare": [[5], [1], [2], [7], [10]],
  "primele-n-impare": [[5], [1], [2], [7], [10]],
  "patrate-1-la-n": [[5], [1], [2], [7], [10]],
  "cuburi-1-la-n": [[5], [1], [2], [6], [8]],
  "multiplii-lui-3-pana-la-n": [[10], [2], [3], [17], [30]],
  "divizibile-cu-2-sau-5-pana-la-n": [[15], [1], [2], [9], [20]],
  "doua-cifre-divizibile-cu-n": [[7], [11], [13], [25], [99]],
  "interval-divizibile-cu-k": [[3, 30, 4], [1, 10, 3], [10, 10, 5], [50, 80, 7], [100, 120, 10]],
  "sir-urcare-coborare-oglinda": [[4], [1], [2], [5], [7]],
  "sir-fiecare-numar-de-doua-ori": [[4], [1], [2], [5], [7]],
  "sir-numar-repetat-de-valoare": [[4], [1], [2], [5], [6]],
  "sir-descrescator-cu-repetitii-crescatoare": [[4], [1], [2], [5], [6]],
  "toate-perechile-i-j-1-la-n": [[3], [1], [2], [4], [5]],
  "toate-perechile-i-j-cu-i-mai-mic-j": [[4], [1], [2], [3], [5]],
  // B
  "patrat-plin-cu-stelute": [[4], [1], [2], [3], [5]],
  "triunghi-dreptunghic-stelute": [[4], [1], [2], [3], [5]],
  "triunghi-dreptunghic-inversat-stelute": [[4], [1], [2], [3], [5]],
  "triunghi-dreapta-stelute": [[4], [1], [2], [3], [5]],
  "triunghi-inversat-dreapta-stelute": [[4], [1], [2], [3], [5]],
  "patrat-gol-stelute": [[4], [1], [2], [3], [5]],
  "dreptunghi-gol-n-m-stelute": [[4, 6], [1, 1], [2, 3], [3, 5], [5, 4]],
  "diagonala-principala-stelute": [[4], [1], [2], [3], [5]],
  "diagonala-secundara-stelute": [[4], [1], [2], [3], [5]],
  "ambele-diagonale-stelute": [[4], [1], [2], [3], [5]],
  "romb-plin-stelute": [[4], [1], [2], [3], [5]],
  "romb-gol-stelute": [[4], [1], [2], [3], [5]],
  "piramida-plina-stelute": [[4], [1], [2], [3], [5]],
  "piramida-inversata-stelute": [[4], [1], [2], [3], [5]],
  "x-in-matrice-stelute": [[5], [1], [2], [3], [6]],
  "contur-si-diagonale-patrat": [[5], [1], [2], [3], [6]],
  // C
  "model-cifre-1-la-i": [[4], [1], [2], [3], [5]],
  "model-linie-repeta-indexul": [[4], [1], [2], [3], [5]],
  "model-descrescator-de-la-i": [[4], [1], [2], [3], [5]],
  "model-triunghi-invers-crescator": [[4], [1], [2], [3], [5]],
  "patrat-fiecare-linie-numarul-liniei": [[4], [1], [2], [3], [5]],
  "patrat-fiecare-coloana-numarul-coloanei": [[4], [1], [2], [3], [5]],
  "matrice-consecutive-1-la-n-patrat": [[3], [1], [2], [4], [5]],
  "matrice-consecutive-linie-para-invers": [[4], [1], [2], [3], [5]],
  "model-triunghi-consecutive": [[4], [1], [2], [3], [5]],
  "tabla-sah-0-1": [[4], [1], [2], [3], [5]],
  "tabla-sah-steluta-punct": [[4], [1], [2], [3], [5]],
  "matrice-element-i-plus-j": [[3], [1], [2], [4], [5]],
  "matrice-element-i-ori-j": [[3], [1], [2], [4], [5]],
  "matrice-identitate-1-0": [[4], [1], [2], [3], [5]],
};

function toInput(params) {
  return `${params.join(" ")}\n`;
}

function makeProblem([slug, statement, inFmt, outFmt, solver, cpp]) {
  const t = tests[slug];
  if (!t) throw new Error(`Missing tests for ${slug}`);
  const builtTests = t.map((params, idx) => {
    const expected = solver(...params);
    return {
      input: toInput(params),
      expected,
      isSample: idx === 0,
    };
  });
  return {
    slug,
    title: slug.replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    statement,
    official_solution: `#include <iostream>\nusing namespace std;\n\nint main() {\n  // Solutie C++\n  ${cpp}\n  return 0;\n}`,
    input_format: `Se citesc: ${inFmt}.`,
    output_format: outFmt,
    constraints: "1 <= valori <= limite rezonabile pentru clasa a 9-a",
    tags: ["clasa9", "structuri-repetitive"],
    tests: builtTests,
  };
}

const problems = defs.map(makeProblem);

function assertAll() {
  for (const p of problems) {
    if (p.tests.length < 5) throw new Error(`${p.slug}: tests < 5`);
    if (!p.tests.some((x) => x.isSample)) throw new Error(`${p.slug}: no sample`);
  }
}

async function upsertProblem(client, p) {
  const ex = await client.query(`SELECT id FROM problems WHERE slug = $1 LIMIT 1`, [p.slug]);
  let id = ex.rows[0]?.id;
  if (id) {
    await client.query(
      `UPDATE problems
       SET title=$2, statement=$3, official_solution=$4, input_format=$5, output_format=$6, constraints=$7,
           difficulty=$8, tags=$9, source=$10, is_published=true, time_limit_ms=$11, memory_limit_mb=$12,
           input_source=$13, output_target=$14, curriculum_level=$15, curriculum_chapter_id=$16,
           curriculum_subcategory_id=$17, solution_mode=$18, checker_mode=$19, updated_at=NOW()
       WHERE id=$1`,
      [
        id, p.title, p.statement, p.official_solution, p.input_format, p.output_format, p.constraints,
        BASE_META.difficulty, p.tags, BASE_META.source, BASE_META.time_limit_ms, BASE_META.memory_limit_mb,
        BASE_META.input_source, BASE_META.output_target, BASE_META.curriculum_level, BASE_META.curriculum_chapter_id,
        BASE_META.curriculum_subcategory_id, BASE_META.solution_mode, BASE_META.checker_mode,
      ],
    );
    await client.query(`DELETE FROM test_cases WHERE problem_id = $1`, [id]);
  } else {
    const ins = await client.query(
      `INSERT INTO problems (
         title, slug, statement, official_solution, input_format, output_format, constraints,
         difficulty, tags, source, is_published, time_limit_ms, memory_limit_mb, input_source, output_target,
         curriculum_level, curriculum_chapter_id, curriculum_subcategory_id, solution_mode, checker_mode
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING id`,
      [
        p.title, p.slug, p.statement, p.official_solution, p.input_format, p.output_format, p.constraints,
        BASE_META.difficulty, p.tags, BASE_META.source, BASE_META.time_limit_ms, BASE_META.memory_limit_mb,
        BASE_META.input_source, BASE_META.output_target, BASE_META.curriculum_level, BASE_META.curriculum_chapter_id,
        BASE_META.curriculum_subcategory_id, BASE_META.solution_mode, BASE_META.checker_mode,
      ],
    );
    id = ins.rows[0].id;
  }

  for (let i = 0; i < p.tests.length; i += 1) {
    const t = p.tests[i];
    await client.query(
      `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, t.input, t.expected, Boolean(t.isSample), 20, i + 1],
    );
  }
}

async function main() {
  assertAll();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const p of problems) {
      await upsertProblem(client, p);
    }
    await client.query("COMMIT");
    console.log(`Seed complete. Upserted ${problems.length} structuri-repetitive problems.`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Failed:", e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
