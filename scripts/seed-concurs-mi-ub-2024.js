const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";
const API = process.env.API_BASE ?? "http://localhost:4000";
const pool = new Pool({ connectionString });

const CHAPTER = { level: "concursuri", chapter: "concurs-mi-ub-2024", sub: "probleme-2024" };

function normalize(text) {
  return (text ?? "").trim().split(/\r?\n/).map((line) => line.trim()).join("\n");
}

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

const problems = [
  // ===================== 1. Poduri euleriene =====================
  {
    slug: "concurs-mi-ub-2024-poduri-euleriene",
    title: "Concurs MI UB 2024 - Poduri euleriene",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2024", "grafuri"],
    statement:
      "O harta este formata din mai multe regiuni de uscat (maluri si insule) legate intre ele prin poduri. Regiunile de uscat sunt numerotate de la 1 la n, iar podurile sunt reprezentate ca muchii neorientate intre doua regiuni (pot exista mai multe poduri intre aceleasi doua regiuni). Graful format este conex.\n\nUn turist doreste sa traverseze toate podurile existente, fiecare exact o data (poate incepe si termina traseul in orice regiune). Daca acest lucru nu este posibil cu podurile existente, se pot construi poduri noi (intre oricare doua regiuni, eventual chiar intre regiuni deja legate).\n\nDeterminati numarul minim de poduri noi ce trebuie construite astfel incat sa existe un traseu care sa foloseasca fiecare pod (vechi si nou) exact o data.",
    input_format:
      "Pe prima linie se citesc doua numere intregi n si m, numarul de regiuni si numarul de poduri existente.\nPe urmatoarele m linii se citesc cate doua numere intregi u si v, insemnand ca exista un pod intre regiunile u si v.",
    output_format: "Se afiseaza un singur numar intreg: numarul minim de poduri noi necesare.",
    constraints: "2 <= n <= 12\n1 <= m <= 30\n1 <= u, v <= n\nGraful dat este conex.",
    hints:
      "Un graf conex admite un traseu care foloseste fiecare muchie exact o data (traseu eulerian) daca si numai daca are 0 sau 2 noduri de grad impar. Fiecare pod nou adaugat intre doua noduri de grad impar transforma ambele noduri in noduri de grad par.",
    explanation:
      "Construim gradul fiecarui nod numarand cate poduri il ating. Fie k numarul de noduri cu grad impar (k este intotdeauna par, conform lemei stransgerii mainilor).\n\nDaca k <= 2, graful are deja traseu eulerian, deci raspunsul este 0.\n\nDaca k > 2, fiecare pod nou adaugat intre doua noduri de grad impar le face pe amandoua pare, deci reduce k cu 2. Este nevoie de exact (k-2)/2 poduri pentru a ajunge la k = 2 noduri impare (cazul minim posibil, deoarece nu putem avea un traseu eulerian cu 0 noduri impare fara sa schimbam paritatea unui numar impar de noduri).\n\nFormula finala: raspuns = max(0, (k-2)/2).\n\n**Complexitate:** O(n + m).",
    tags2: undefined,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m;
    cin >> n >> m;
    vector<int> deg(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        deg[u]++;
        deg[v]++;
    }
    int k = 0;
    for (int i = 1; i <= n; i++) if (deg[i] % 2 == 1) k++;
    long long ans = (k > 2) ? (long long)(k - 2) / 2 : 0;
    cout << ans << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx]); idx += 1
    m = int(data[idx]); idx += 1
    deg = [0] * (n + 1)
    for _ in range(m):
        u = int(data[idx]); idx += 1
        v = int(data[idx]); idx += 1
        deg[u] += 1
        deg[v] += 1
    k = sum(1 for i in range(1, n + 1) if deg[i] % 2 == 1)
    ans = (k - 2) // 2 if k > 2 else 0
    print(ans)

main()
`,
    tests: [
      "2 1\n1 2",
      "3 3\n1 2\n2 3\n1 3",
      "5 4\n1 2\n1 3\n1 4\n1 5",
      "5 4\n1 2\n2 3\n3 4\n4 5",
      "7 6\n1 2\n1 3\n1 4\n1 5\n1 6\n1 7",
    ],
  },

  // ===================== 3. Cuvinte similare =====================
  {
    slug: "concurs-mi-ub-2024-cuvinte-similare",
    title: "Concurs MI UB 2024 - Cuvinte similare",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2024", "combinatorica"],
    statement:
      "Se da o lista de n cuvinte, fiecare avand exact L caractere. Doua cuvinte (distincte ca pozitie in lista, chiar daca sunt identice ca text) sunt similare daca difera in exact o singura pozitie, adica se poate schimba exact un caracter din primul cuvant astfel incat sa devina egal cu al doilea. Doua cuvinte identice ca text NU sunt similare (difera in 0 pozitii).\n\nDeterminati cate perechi neordonate de cuvinte similare exista in lista.",
    input_format:
      "Pe prima linie se citesc doua numere intregi n si L.\nPe urmatoarele n linii se citeste cate un cuvant format din exact L litere mici.",
    output_format: "Se afiseaza un singur numar intreg: numarul de perechi neordonate de cuvinte similare.",
    constraints: "1 <= n <= 2000\n1 <= L <= 12",
    hints:
      "Pentru fiecare pozitie p, grupati cuvintele dupa sablonul obtinut prin inlocuirea caracterului de pe pozitia p cu un simbol comun (wildcard). In fiecare grup, doua cuvinte cu acelasi caracter pe pozitia p sunt de fapt identice si nu trebuie numarate.",
    explanation:
      "Pentru fiecare pozitie p de la 0 la L-1, grupam cuvintele dupa sablonul obtinut inlocuind caracterul de pe pozitia p cu un wildcard (adica dupa restul cuvantului, fara pozitia p). Doua cuvinte din acelasi grup difera cel mult in pozitia p.\n\nIn interiorul unui grup de dimensiune total, impartim cuvintele dupa caracterul lor efectiv de pe pozitia p. Daca doua cuvinte au acelasi caracter pe pozitia p si sunt in acelasi grup, ele sunt de fapt identice (0 diferente) si nu trebuie numarate. Daca au caractere diferite pe pozitia p, ele difera exact in pozitia p, deci sunt similare.\n\nNumarul de perechi similare generate de un grup este totalPerechi - perechiCuAcelasiCaracter, unde totalPerechi = C(total, 2), iar perechiCuAcelasiCaracter este suma C(frecventa_caracter, 2) pentru fiecare caracter din grup.\n\nSumam aceasta cantitate pentru toate pozitiile p.\n\n**Complexitate:** O(n * L) folosind tabele de dispersie (hashmap).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, L;
    cin >> n >> L;
    vector<string> w(n);
    for (auto &s : w) cin >> s;
    long long ans = 0;
    for (int p = 0; p < L; p++) {
        unordered_map<string, unordered_map<char, int>> groups;
        for (int i = 0; i < n; i++) {
            string key = w[i];
            key[p] = '*';
            groups[key][w[i][p]]++;
        }
        for (auto &g : groups) {
            long long total = 0;
            for (auto &cc : g.second) total += cc.second;
            long long same = 0;
            for (auto &cc : g.second) same += (long long)cc.second * (cc.second - 1) / 2;
            long long totalPairs = total * (total - 1) / 2;
            ans += totalPairs - same;
        }
    }
    cout << ans << "\\n";
    return 0;
}
`,
    py: `import sys
from collections import defaultdict

def main():
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx]); idx += 1
    L = int(data[idx]); idx += 1
    words = []
    for _ in range(n):
        words.append(data[idx]); idx += 1
    ans = 0
    for p in range(L):
        groups = defaultdict(lambda: defaultdict(int))
        for w in words:
            key = w[:p] + '*' + w[p + 1:]
            groups[key][w[p]] += 1
        for key, cc in groups.items():
            total = sum(cc.values())
            same = sum(v * (v - 1) // 2 for v in cc.values())
            totalPairs = total * (total - 1) // 2
            ans += totalPairs - same
    print(ans)

main()
`,
    tests: [
      "10 4\nmate\nburi\nmute\nmese\ncute\nmare\niute\nsute\nsate\nmuri",
      "4 3\nabc\nabd\nxyz\naec",
      "4 3\naaa\naaa\naab\naba",
      (() => {
        const letters = "abcdefghijklmnopqrstuvwxyz".split("");
        return `26 1\n${letters.join("\n")}`;
      })(),
      (() => {
        const words = [];
        for (let i = 0; i < 100; i++) words.push(String(i).padStart(4, "0"));
        return `100 4\n${words.join("\n")}`;
      })(),
    ],
  },

  // ===================== 4. Arbori de cost minim =====================
  {
    slug: "concurs-mi-ub-2024-arbori-cost-minim",
    title: "Concurs MI UB 2024 - Numarul arborilor partiali de cost minim",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2024", "grafuri"],
    statement:
      "Se da un graf neorientat, conex si ponderat, cu n noduri si m muchii. Determinati cati arbori partiali de cost minim (arbori partiali cu suma costurilor muchiilor minima posibila) are graful.",
    input_format:
      "Pe prima linie se citesc doua numere intregi n si m.\nPe urmatoarele m linii se citesc cate trei numere intregi u, v si w, insemnand ca exista o muchie intre nodurile u si v cu costul w.",
    output_format: "Se afiseaza un singur numar intreg: numarul de arbori partiali de cost minim.",
    constraints: "2 <= n <= 9\nn - 1 <= m <= 16\n1 <= w <= 50\nGraful dat este conex.",
    hints:
      "Deoarece n si m sunt mici, se poate enumera fiecare submultime de n-1 muchii si se poate verifica daca formeaza un arbore (folosind Union-Find) si daca suma costurilor este minima.",
    explanation:
      "Deoarece limitele sunt mici, se pot enumera toate submultimile de n-1 muchii dintre cele m disponibile (in total C(m, n-1) submultimi). Pentru fiecare submultime, se verifica folosind o structura Union-Find daca cele n-1 muchii conecteaza toate cele n noduri fara a forma ciclu (adica formeaza un arbore partial). Daca da, se calculeaza suma costurilor.\n\nSe retine costul minim gasit si se numara cate submultimi valide ating exact acest cost minim. Aceasta metoda de forta bruta este echivalenta cu rationamentul de tip Kruskal folosit pentru identificarea muchiilor obligatorii si a alegerilor posibile intre muchii de cost egal, dar este mai simpla de implementat corect pentru grafuri mici.\n\n**Complexitate:** O(C(m, n-1) * n) folosind Union-Find.",
    cpp: `#include <bits/stdc++.h>
using namespace std;

int par[16];
int find(int x) { return par[x] == x ? x : par[x] = find(par[x]); }

int main() {
    int n, m;
    cin >> n >> m;
    vector<int> eu(m), ev(m), ew(m);
    for (int i = 0; i < m; i++) cin >> eu[i] >> ev[i] >> ew[i];

    int k = n - 1;
    vector<int> idxComb(k);
    for (int i = 0; i < k; i++) idxComb[i] = i;

    long long bestCost = -1;
    long long count = 0;

    while (true) {
        for (int i = 1; i <= n; i++) par[i] = i;
        long long cost = 0;
        int edgesUsed = 0;
        bool ok = true;
        for (int i = 0; i < k; i++) {
            int e = idxComb[i];
            int a = find(eu[e]), b = find(ev[e]);
            if (a == b) { ok = false; break; }
            par[a] = b;
            cost += ew[e];
            edgesUsed++;
        }
        if (ok && edgesUsed == n - 1) {
            if (bestCost == -1 || cost < bestCost) { bestCost = cost; count = 1; }
            else if (cost == bestCost) count++;
        }

        // next combination
        int i = k - 1;
        while (i >= 0 && idxComb[i] == m - k + i) i--;
        if (i < 0) break;
        idxComb[i]++;
        for (int j = i + 1; j < k; j++) idxComb[j] = idxComb[j - 1] + 1;
    }

    cout << count << "\\n";
    return 0;
}
`,
    py: `import sys
from itertools import combinations

def main():
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx]); idx += 1
    m = int(data[idx]); idx += 1
    eu = [0] * m
    ev = [0] * m
    ew = [0] * m
    for i in range(m):
        eu[i] = int(data[idx]); idx += 1
        ev[i] = int(data[idx]); idx += 1
        ew[i] = int(data[idx]); idx += 1

    k = n - 1
    best_cost = -1
    count = 0

    for comb in combinations(range(m), k):
        par = list(range(n + 1))

        def find(x):
            while par[x] != x:
                par[x] = par[par[x]]
                x = par[x]
            return x

        cost = 0
        ok = True
        for e in comb:
            a, b = find(eu[e]), find(ev[e])
            if a == b:
                ok = False
                break
            par[a] = b
            cost += ew[e]
        if ok:
            if best_cost == -1 or cost < best_cost:
                best_cost = cost
                count = 1
            elif cost == best_cost:
                count += 1

    print(count)

main()
`,
    tests: [
      "6 7\n2 3 1\n5 6 1\n1 2 2\n1 4 2\n4 5 2\n2 5 2\n3 6 2",
      "2 1\n1 2 5",
      "4 4\n1 2 1\n2 3 1\n3 4 1\n4 1 1",
      "5 6\n1 2 1\n2 3 2\n3 4 3\n4 5 4\n1 5 10\n2 4 10",
      "8 12\n1 2 1\n1 3 1\n1 5 1\n2 4 1\n2 6 1\n3 4 1\n3 7 1\n5 6 1\n5 7 1\n4 8 1\n6 8 1\n7 8 1",
    ],
  },

  // ===================== 5. Bilete norocoase =====================
  {
    slug: "concurs-mi-ub-2024-bilete-norocoase",
    title: "Concurs MI UB 2024 - Bilete norocoase",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2024", "combinatorica"],
    statement:
      "Un bilet are un cod format din exact 2*L cifre (poate incepe cu 0). Un bilet este norocos daca suma primelor L cifre este egala cu suma ultimelor L cifre.\n\nDeterminati cate coduri de bilet norocoase exista, dintre toate cele 10^(2L) coduri posibile de 2*L cifre.",
    input_format: "Se citeste un singur numar intreg L.",
    output_format: "Se afiseaza un singur numar intreg: numarul de coduri de bilet norocoase.",
    constraints: "1 <= L <= 7",
    hints:
      "Calculati, pentru un bloc de L cifre, numarul n_s de moduri de a obtine suma s (s intre 0 si 9L), folosind programare dinamica. Raspunsul este suma patratelor n_s^2, deoarece primul bloc si al doilea bloc se aleg independent.",
    explanation:
      "Impartim codul in doua blocuri de L cifre. Notam cu n_s numarul de siruri de L cifre (fiecare intre 0 si 9) a caror suma este s. Aceste valori se calculeaza usor cu programare dinamica: dp[0][0] = 1, iar pentru fiecare din cele L cifre adaugate, dp[i][s+d] += dp[i-1][s] pentru fiecare cifra d de la 0 la 9.\n\nUn cod este norocos daca primul bloc are suma s si al doilea bloc are tot suma s, pentru un s oarecare. Pentru o suma fixa s, exista n_s moduri de a alege primul bloc si n_s moduri de a alege al doilea bloc, deci n_s * n_s coduri norocoase cu acea suma.\n\nRaspunsul final este suma peste toate valorile posibile ale sumei s (de la 0 la 9L) a lui n_s^2.\n\n**Complexitate:** O(L^2) pentru calculul programarii dinamice.",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int L;
    cin >> L;
    vector<long long> dp(9 * L + 1, 0);
    dp[0] = 1;
    for (int i = 0; i < L; i++) {
        vector<long long> ndp(9 * L + 1, 0);
        for (int s = 0; s <= 9 * i; s++) {
            if (dp[s] == 0) continue;
            for (int d = 0; d <= 9; d++) ndp[s + d] += dp[s];
        }
        dp = ndp;
    }
    long long ans = 0;
    for (int s = 0; s <= 9 * L; s++) ans += dp[s] * dp[s];
    cout << ans << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    L = int(sys.stdin.read().split()[0])
    dp = [0] * (9 * L + 1)
    dp[0] = 1
    for i in range(L):
        ndp = [0] * (9 * L + 1)
        for s in range(9 * i + 1):
            if dp[s] == 0:
                continue
            for d in range(10):
                ndp[s + d] += dp[s]
        dp = ndp
    ans = sum(dp[s] * dp[s] for s in range(9 * L + 1))
    print(ans)

main()
`,
    tests: ["1", "2", "3", "5", "7"],
  },

  // ===================== 6. Format flotant =====================
  {
    slug: "concurs-mi-ub-2024-format-flotant",
    title: "Concurs MI UB 2024 - Format flotant pe biti",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2024", "reprezentarea-numerelor"],
    statement:
      "Un calculator de jucarie foloseste un format propriu pentru numere reale, format din E biti pentru exponent e si M biti pentru mantisa m. Valoarea reprezentata este m * 2^-e, unde e si m sunt numere naturale a caror reprezentare binara este pastrata pe E, respectiv M biti.\n\nDeterminati cea mai mica valoare nenula reprezentabila in acest format, precum si cea mai mare valoare reprezentabila.",
    input_format: "Se citesc doua numere intregi E si M, separate prin spatiu.",
    output_format:
      "Se afiseaza doua linii:\nPe prima linie, cea mai mica valoare nenula reprezentabila, scrisa ca fractie zecimala exacta.\nPe a doua linie, cea mai mare valoare reprezentabila (numar intreg).",
    constraints: "1 <= E <= 5\n1 <= M <= 60",
    hints:
      "Pentru cea mai mica valoare nenula, alegem m = 1 (cel mai mic m nenul) si e cat mai mare posibil (e = 2^E - 1). Pentru cea mai mare valoare, alegem m maxim (2^M - 1) si e = 0.",
    explanation:
      "Pentru E biti de exponent, e poate lua valori de la 0 la 2^E - 1. Pentru M biti de mantisa, m poate lua valori de la 0 la 2^M - 1.\n\nCea mai mica valoare nenula se obtine minimizand m * 2^-e cu m nenul: alegem cel mai mic m posibil (m = 1) si cel mai mare e posibil (e = 2^E - 1), obtinand 2^-(2^E - 1) = 1 / 2^(2^E - 1). Deoarece numitorul este o putere a lui 2, aceasta valoare are o reprezentare zecimala exacta si finita: 1 / 2^k = 5^k / 10^k, deci se scrie ca 0. urmat de k cifre, obtinute prin calculul lui 5^k (padded cu zerouri la stanga pana la k cifre). Acest calcul necesita numere mari (aritmetica in precizie arbitrara sau simulare cifra cu cifra), deoarece 5^k poate depasi capacitatea unui intreg pe 64 de biti pentru k mare.\n\nCea mai mare valoare se obtine maximizand m * 2^-e: alegem e = 0 (cel mai mic exponent posibil) si m maxim (2^M - 1), obtinand direct valoarea intreaga 2^M - 1.\n\n**Complexitate:** O(2^E) pentru simularea inmultirii cu 5.",
    cpp: `#include <bits/stdc++.h>
using namespace std;

// inmulteste (in loc) un numar mare reprezentat ca string de cifre cu 5
string mulBy5(const string &num) {
    string res;
    int carry = 0;
    for (int i = (int)num.size() - 1; i >= 0; i--) {
        int d = (num[i] - '0') * 5 + carry;
        res.push_back(char('0' + d % 10));
        carry = d / 10;
    }
    while (carry > 0) {
        res.push_back(char('0' + carry % 10));
        carry /= 10;
    }
    reverse(res.begin(), res.end());
    return res;
}

int main() {
    int E, M;
    cin >> E >> M;
    long long k = (1LL << E) - 1;

    string val = "1";
    for (long long i = 0; i < k; i++) val = mulBy5(val);

    string padded = val;
    while ((long long)padded.size() < k) padded = "0" + padded;

    cout << "0." << padded << "\\n";

    unsigned long long largest = (1ULL << M) - 1ULL;
    cout << largest << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    E = int(data[0])
    M = int(data[1])
    k = (1 << E) - 1
    val = 5 ** k
    padded = str(val).zfill(k) if k > 0 else ""
    print("0." + padded)
    largest = (1 << M) - 1
    print(largest)

main()
`,
    tests: ["1 1", "2 4", "3 7", "4 10", "5 20"],
  },

  // ===================== 7. Tastatura circulara =====================
  {
    slug: "concurs-mi-ub-2024-tastatura-circulara",
    title: "Concurs MI UB 2024 - Tastatura circulara",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2024", "simulare"],
    statement:
      "O tastatura circulara contine cifrele de la 0 la 9 in ordine crescatoare, iar un ac indica initial catre o anumita cifra. Tastatura poate face de oricate ori una din urmatoarele doua operatii:\n\n1. sa scrie pe ecran cifra catre care indica in prezent acul;\n2. sa mute acul pe pozitia succesoare (dupa cifra 9 urmeaza din nou cifra 0).\n\nDandu-se pozitia initiala a acului si un sir de cifre care trebuie afisat pe ecran, in aceasta ordine, determinati numarul minim de operatii necesare.",
    input_format:
      "Pe prima linie se citeste un numar intreg p, pozitia initiala a acului (0-9).\nPe a doua linie se citeste un sir de cifre s, sirul care trebuie scris pe ecran.",
    output_format: "Se afiseaza un singur numar intreg: numarul minim de operatii.",
    constraints: "0 <= p <= 9\n1 <= lungimea sirului s <= 2000",
    hints:
      "Pentru fiecare cifra din sir, calculati cate pasi (in sens crescator, circular) sunt necesari pentru a ajunge de la pozitia curenta a acului la cifra respectiva, apoi adaugati o operatie de scriere.",
    explanation:
      "Simulam procesul: pastram pozitia curenta a acului, initial p. Pentru fiecare cifra d din sirul s, calculam numarul de mutari necesare pentru a ajunge de la pozitia curenta la d in sens crescator (circular), adica (d - curent + 10) % 10. Adaugam acest numar la total, apoi adaugam inca o operatie pentru scrierea cifrei. Actualizam pozitia curenta la d si continuam cu urmatoarea cifra.\n\n**Complexitate:** O(lungimea sirului s).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int p;
    string s;
    cin >> p >> s;
    long long ops = 0;
    int cur = p;
    for (char c : s) {
        int d = c - '0';
        int steps = (d - cur + 10) % 10;
        ops += steps + 1;
        cur = d;
    }
    cout << ops << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    p = int(data[0])
    s = data[1]
    ops = 0
    cur = p
    for c in s:
        d = int(c)
        steps = (d - cur + 10) % 10
        ops += steps + 1
        cur = d
    print(ops)

main()
`,
    tests: ["0\n11052024", "0\n0", "5\n5555", "9\n0123456789", "3\n314159265358979323846"],
  },

  // ===================== 8. Conexiuni simultane =====================
  {
    slug: "concurs-mi-ub-2024-conexiuni-simultane",
    title: "Concurs MI UB 2024 - Conexiuni simultane",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2024", "simulare"],
    statement:
      "Intr-un datacenter exista k servere. Serverul i porneste cate o noua conexiune la fiecare p_i secunde (la momentele 0, p_i, 2*p_i, 3*p_i, ...). Fiecare conexiune ramane deschisa exact L secunde de la pornire.\n\nDeterminati numarul maxim de conexiuni (de la toate serverele impreuna) care pot exista simultan deschise, la un moment dat.",
    input_format:
      "Pe prima linie se citesc doua numere intregi k si L.\nPe urmatoarele k linii se citeste cate un numar intreg p_i, perioada serverului i.",
    output_format: "Se afiseaza un singur numar intreg: numarul maxim de conexiuni simultane.",
    constraints: "1 <= k <= 10\n1 <= L <= 10^9\n1 <= p_i <= 10^9",
    hints:
      "Pentru un singur server cu perioada p, numarul maxim de conexiuni active simultan este ceil(L / p) (numarul de porniri succesive care incap intr-o fereastra de lungime L). Serverele sunt independente, deci raspunsurile se aduna.",
    explanation:
      "Pentru un server cu perioada p, conexiunile pornesc la momentele 0, p, 2p, .... O conexiune pornita la momentul t este activa in intervalul [t, t+L). Numarul maxim de porniri consecutive care incap intr-o fereastra de lungime L este ceil(L / p): acestea sunt conexiunile pornite la 0, p, 2p, ..., (ceil(L/p)-1)*p, toate active simultan chiar inainte ca prima sa expire.\n\nDeoarece serverele functioneaza independent, numarul maxim de conexiuni simultane in tot sistemul este suma acestor valori pentru toate cele k servere: suma de ceil(L / p_i) pentru i = 1..k.\n\n**Complexitate:** O(k).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long k, L;
    cin >> k >> L;
    long long ans = 0;
    for (int i = 0; i < k; i++) {
        long long p;
        cin >> p;
        ans += (L + p - 1) / p;
    }
    cout << ans << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    idx = 0
    k = int(data[idx]); idx += 1
    L = int(data[idx]); idx += 1
    ans = 0
    for _ in range(k):
        p = int(data[idx]); idx += 1
        ans += (L + p - 1) // p
    print(ans)

main()
`,
    tests: ["2 300\n17\n21", "1 300\n300", "1 1\n1000000000", "3 60\n7\n11\n13", "5 100000\n3\n5\n7\n11\n13"],
  },

  // ===================== 9. Aliante dupa divizori =====================
  {
    slug: "concurs-mi-ub-2024-aliante-divizori",
    title: "Concurs MI UB 2024 - Aliante dupa numarul de divizori",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2024", "teoria-numerelor"],
    statement:
      "Intr-un joc participa N jucatori, avand ID-uri unice, numere din intervalul [2, N+1]. Doi jucatori formeaza aliante daca ID-urile lor au acelasi numar de divizori. In cadrul unei aliante, orice pereche de membri poate stabili o conexiune securizata bidirectionala.\n\nDeterminati numarul total de conexiuni securizate ce se pot stabili, insumate pe toate aliantele.",
    input_format: "Se citeste un singur numar intreg N.",
    output_format: "Se afiseaza un singur numar intreg: numarul total de conexiuni securizate.",
    constraints: "1 <= N <= 100000",
    hints:
      "Calculati numarul de divizori pentru fiecare ID din [2, N+1] folosind o sita asemanatoare Ciurului lui Eratostene. Grupati ID-urile dupa numarul de divizori si insumati C(dimensiune, 2) pentru fiecare grup.",
    explanation:
      "Calculam numarul de divizori pentru fiecare numar din intervalul [2, N+1] folosind o sita: pentru fiecare d de la 1 la N+1, incrementam contorul de divizori al tuturor multiplilor lui d. Aceasta ruleaza in O((N+1) log(N+1)).\n\nGrupam apoi ID-urile dupa numarul lor de divizori. Pentru fiecare grup de dimensiune s, numarul de conexiuni securizate posibile intre membrii sai este C(s, 2) = s*(s-1)/2.\n\nRaspunsul este suma acestor valori pentru toate grupurile.\n\n**Complexitate:** O(N log N).",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int N;
    cin >> N;
    int upper = N + 1;
    vector<int> divCount(upper + 1, 0);
    for (int d = 1; d <= upper; d++) {
        for (int m = d; m <= upper; m += d) divCount[m]++;
    }
    unordered_map<int, long long> groups;
    for (int id = 2; id <= upper; id++) groups[divCount[id]]++;
    long long ans = 0;
    for (auto &g : groups) ans += g.second * (g.second - 1) / 2;
    cout << ans << "\\n";
    return 0;
}
`,
    py: `import sys
from collections import defaultdict

def main():
    N = int(sys.stdin.read().split()[0])
    upper = N + 1
    div_count = [0] * (upper + 1)
    for d in range(1, upper + 1):
        for m in range(d, upper + 1, d):
            div_count[m] += 1
    groups = defaultdict(int)
    for i in range(2, upper + 1):
        groups[div_count[i]] += 1
    ans = 0
    for s in groups.values():
        ans += s * (s - 1) // 2
    print(ans)

main()
`,
    tests: ["24", "1", "2", "100", "50000"],
  },

  // ===================== 10. Numerele Marei =====================
  {
    slug: "concurs-mi-ub-2024-numere-mara",
    title: "Concurs MI UB 2024 - Numerele favorite ale Marei",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2024", "combinatorica"],
    statement:
      "Marei ii plac numerele scrise in baza b ale caror cifre sunt toate distincte si care nu contin cifra 0 (in baza b, cifrele posibile sunt 0, 1, ..., b-1).\n\nDeterminati cate numere ii plac Marei pentru o baza b data (numerele pot avea intre 1 si b-1 cifre).",
    input_format: "Se citeste un singur numar intreg b.",
    output_format: "Se afiseaza un singur numar intreg: numarul de numere favorite ale Marei in baza b.",
    constraints: "2 <= b <= 14",
    hints:
      "Cifrele disponibile (fara 0) sunt 1, 2, ..., b-1, deci exista b-1 cifre distincte. Numarati, pentru fiecare lungime k de la 1 la b-1, cate numere de k cifre distincte se pot forma (aranjamente).",
    explanation:
      "Cifrele disponibile pentru numerele favorite ale Marei sunt 1, 2, ..., b-1 (fara cifra 0), deci exista b-1 cifre distincte care pot fi folosite, fiecare cel mult o data.\n\nPentru un numar cu exact k cifre (1 <= k <= b-1), numarul de moduri de a alege si aranja k cifre distincte dintre cele b-1 disponibile este aranjamentul A(b-1, k) = (b-1)! / (b-1-k)!.\n\nRaspunsul final este suma acestor aranjamente pentru toate lungimile posibile: suma de A(b-1, k) pentru k = 1..b-1.\n\n**Complexitate:** O(b^2) sau O(b) folosind factoriale precalculate.",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int b;
    cin >> b;
    int n = b - 1;
    long long ans = 0;
    for (int k = 1; k <= n; k++) {
        long long perm = 1;
        for (int i = 0; i < k; i++) perm *= (n - i);
        ans += perm;
    }
    cout << ans << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    b = int(sys.stdin.read().split()[0])
    n = b - 1
    ans = 0
    for k in range(1, n + 1):
        perm = 1
        for i in range(k):
            perm *= (n - i)
        ans += perm
    print(ans)

main()
`,
    tests: ["2", "3", "5", "8", "14"],
  },

  // ===================== 11. Directoare goale =====================
  {
    slug: "concurs-mi-ub-2024-directoare-goale",
    title: "Concurs MI UB 2024 - Directoare goale",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2024", "arbori"],
    statement:
      "Un sistem contine N directoare, fara niciun fisier, organizate intr-o structura arborescenta: directorul 1 este radacina, iar fiecare director de la 2 la N are un director parinte cu un indice mai mic.\n\nUn director este gol daca nu contine niciun alt director (nu are copii in arbore). Determinati cate directoare din cele N sunt goale.",
    input_format:
      "Pe prima linie se citeste numarul intreg N.\nPe a doua linie se citesc N-1 numere intregi, reprezentand, in ordine, parintele directorului 2, parintele directorului 3, ..., parintele directorului N.",
    output_format: "Se afiseaza un singur numar intreg: numarul de directoare goale.",
    constraints: "1 <= N <= 5000\nPentru fiecare i de la 2 la N, parintele lui i este un intreg din [1, i-1].",
    hints:
      "Un director este gol daca nu apare niciodata ca parinte al altui director. Marcati fiecare parinte intalnit si numarati directoarele nemarcate.",
    explanation:
      "Construim un tablou care marcheaza fiecare director care are cel putin un copil (adica apare ca parinte al altui director). Parcurgem lista de parinti data la intrare si marcam fiecare parinte intalnit.\n\nUn director este gol daca nu a fost marcat, adica nu are niciun copil in arbore. Raspunsul este numarul de directoare nemarcate.\n\n**Complexitate:** O(N).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int N;
    cin >> N;
    vector<int> hasChild(N + 1, 0);
    for (int i = 2; i <= N; i++) {
        int par;
        cin >> par;
        hasChild[par] = 1;
    }
    int leaves = 0;
    for (int i = 1; i <= N; i++) if (!hasChild[i]) leaves++;
    cout << leaves << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    idx = 0
    N = int(data[idx]); idx += 1
    has_child = [0] * (N + 1)
    for _ in range(N - 1):
        par = int(data[idx]); idx += 1
        has_child[par] = 1
    leaves = sum(1 for i in range(1, N + 1) if not has_child[i])
    print(leaves)

main()
`,
    tests: [
      "7\n1 1 1 2 2 4",
      "1\n",
      "2\n1",
      (() => {
        const N = 1000;
        const parents = [];
        for (let i = 2; i <= N; i++) parents.push(Math.floor(i / 2));
        return `${N}\n${parents.join(" ")}`;
      })(),
      (() => {
        const N = 5000;
        const parents = [];
        for (let i = 2; i <= N; i++) parents.push(Math.floor(i / 3) === 0 ? 1 : Math.floor(i / 3));
        return `${N}\n${parents.join(" ")}`;
      })(),
    ],
  },

  // ===================== 12. Valize (submultimi) =====================
  {
    slug: "concurs-mi-ub-2024-valize-submultimi",
    title: "Concurs MI UB 2024 - Suma maxima obtinuta in exact doua moduri",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2024", "programare-dinamica"],
    statement:
      "Se dau n valize, cu capacitatile c_1, c_2, ..., c_n litri. Pentru o submultime de valize alese, calculam suma capacitatilor acestora (submultimea vida are suma 0).\n\nDeterminati suma maxima s astfel incat sa existe exact doua submultimi distincte de valize a caror suma a capacitatilor sa fie egala cu s. Daca nu exista nicio astfel de suma, afisati -1.",
    input_format:
      "Pe prima linie se citeste numarul intreg n.\nPe a doua linie se citesc n numere intregi, capacitatile valizelor.",
    output_format:
      "Se afiseaza un singur numar intreg: suma maxima obtinuta in exact doua moduri, sau -1 daca nu exista.",
    constraints: "3 <= n <= 18\n1 <= c_i <= 500",
    hints:
      "Calculati, pentru fiecare suma posibila s, in cate moduri (submultimi) poate fi obtinuta, folosind o programare dinamica de tip rucsac (numarare de submultimi). Apoi cautati cea mai mare suma cu exact 2 moduri.",
    explanation:
      "Folosim o programare dinamica standard pentru numararea submultimilor cu o suma data: dp[0] = 1 initial, iar pentru fiecare valiza de capacitate c, actualizam dp[s] += dp[s - c] pentru s descrescator (de la suma totala pana la c), pentru a nu folosi aceeasi valiza de doua ori.\n\nDupa ce am calculat dp[s] pentru toate sumele posibile s (de la 0 la suma totala a tuturor valizelor), parcurgem sumele in ordine descrescatoare si returnam prima suma pentru care dp[s] este exact 2. Daca nu gasim nicio astfel de suma, raspunsul este -1.\n\n**Complexitate:** O(n * sumaTotala).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n;
    cin >> n;
    vector<int> c(n);
    int total = 0;
    for (auto &x : c) { cin >> x; total += x; }

    vector<long long> dp(total + 1, 0);
    dp[0] = 1;
    for (int i = 0; i < n; i++) {
        for (int s = total; s >= c[i]; s--) {
            dp[s] += dp[s - c[i]];
        }
    }

    int ans = -1;
    for (int s = total; s >= 0; s--) {
        if (dp[s] == 2) { ans = s; break; }
    }
    cout << ans << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx]); idx += 1
    c = []
    for _ in range(n):
        c.append(int(data[idx])); idx += 1
    total = sum(c)

    dp = [0] * (total + 1)
    dp[0] = 1
    for ci in c:
        for s in range(total, ci - 1, -1):
            dp[s] += dp[s - ci]

    ans = -1
    for s in range(total, -1, -1):
        if dp[s] == 2:
            ans = s
            break
    print(ans)

main()
`,
    tests: [
      "6\n14 3 16 8 2 5",
      "3\n1 1 1",
      "5\n1 2 4 8 16",
      "8\n5 5 3 3 2 2 10 20",
      "18\n1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18",
    ],
  },

  // ===================== 13. Secventa modulara =====================
  {
    slug: "concurs-mi-ub-2024-secventa-modulara",
    title: "Concurs MI UB 2024 - Secventa modulara care se termina",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2024", "teoria-numerelor"],
    statement:
      "Pentru un numar intreg X, se considera urmatorul proces:\n\nY := 1\ncat timp Y != 3:\n    Y := (Y * 2) mod X\n\nDeterminati pentru cate valori X din intervalul [L, R] (inclusiv) acest proces se termina (adica Y ajunge sa fie egal cu 3 la un moment dat).",
    input_format: "Se citesc doua numere intregi L si R, separate prin spatiu.",
    output_format: "Se afiseaza un singur numar intreg: numarul de valori X din [L, R] pentru care procesul se termina.",
    constraints: "5 <= L <= R <= 2000\nR - L <= 2000",
    hints:
      "Pentru fiecare X, simulati procesul retinand valorile deja vizitate ale lui Y. Daca Y ajunge la 3, procesul se termina; daca o valoare se repeta fara sa fi atins 3, procesul nu se va termina niciodata.",
    explanation:
      "Pentru fiecare X din intervalul [L, R], simulam procesul pornind de la Y = 1 si aplicand repetat Y := (2*Y) mod X. Deoarece exista doar X valori posibile pentru Y (de la 0 la X-1), daca o valoare se repeta inainte ca Y sa ajunga la 3, inseamna ca procesul a intrat intr-un ciclu care nu contine valoarea 3, deci nu se va termina niciodata.\n\nFolosim un tablou de vizitare de dimensiune X pentru fiecare simulare: oprim simularea fie cand Y devine 3 (caz in care numaram X ca fiind valid), fie cand o valoare se repeta (caz in care X nu este valid).\n\n**Complexitate:** O(suma valorilor X din interval), care este marginita superior de O((R-L)*R).",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int L, R;
    cin >> L >> R;
    int cnt = 0;
    for (int x = L; x <= R; x++) {
        vector<char> viz(x, 0);
        int y = 1;
        while (y != 3 && !viz[y]) {
            viz[y] = 1;
            y = (2 * y) % x;
        }
        if (y == 3) cnt++;
    }
    cout << cnt << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    L = int(data[0])
    R = int(data[1])
    cnt = 0
    for x in range(L, R + 1):
        viz = bytearray(x)
        y = 1
        while y != 3 and not viz[y]:
            viz[y] = 1
            y = (2 * y) % x
        if y == 3:
            cnt += 1
    print(cnt)

main()
`,
    tests: ["5 999", "5 20", "100 100", "1000 2000", "5 2000"],
  },

  // ===================== 14. Piese shuffle =====================
  {
    slug: "concurs-mi-ub-2024-piese-shuffle",
    title: "Concurs MI UB 2024 - Numarul mediu de piese ascultate integral",
    difficulty: "hard",
    tags: ["concurs", "mateinfo-ub", "2024", "probabilitati"],
    statement:
      "Un playlist este format din n piese, avand duratele d_1, d_2, ..., d_n secunde. Se activeaza optiunea shuffle, care amesteca uniform aleator ordinea pieselor, iar apoi acestea sunt ascultate in aceasta ordine, timp de T secunde (o pauza).\n\nO piesa este ascultata integral daca, la momentul inceperii sale, timpul ramas din pauza este cel putin egal cu durata ei.\n\nDeterminati numarul mediu (valoarea asteptata) de piese ascultate integral, ca fractie ireductibila p/q.",
    input_format:
      "Pe prima linie se citesc doua numere intregi n si T.\nPe a doua linie se citesc n numere intregi, duratele pieselor (in secunde).",
    output_format:
      "Se afiseaza numarul mediu de piese ascultate integral, ca fractie ireductibila, in formatul p/q (unde q > 0).",
    constraints: "3 <= n <= 8\n1 <= T <= 5000\n1 <= d_i <= 5000",
    hints:
      "Numarul de piese ascultate integral, pentru o permutare data, este cea mai lunga prefixa a permutarii a carei suma de durate nu depaseste T. Insumati aceasta valoare pe toate cele n! permutari si impartiti la n!.",
    explanation:
      "Pentru fiecare din cele n! permutari posibile ale pieselor, determinam cate piese consecutive de la inceput pot fi ascultate integral: acesta este cel mai lung prefix al permutarii a carui suma de durate este cel mult T.\n\nValoarea asteptata este media acestor valori pe toate permutarile: suma valorilor obtinute pentru fiecare permutare, impartita la n!.\n\nPentru a evita erorile de reprezentare in virgula mobila, calculam suma ca numar intreg (suma_totala) si reprezentam raspunsul ca fractia exacta suma_totala / n!, simplificata la forma ireductibila prin impartire la cel mai mare divizor comun.\n\n**Complexitate:** O(n! * n).",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;

long long gcdll(long long a, long long b) { return b == 0 ? a : gcdll(b, a % b); }

int main() {
    int n;
    long long T;
    cin >> n >> T;
    vector<long long> d(n);
    for (auto &x : d) cin >> x;

    vector<int> idx(n);
    for (int i = 0; i < n; i++) idx[i] = i;
    long long factN = 1;
    for (int i = 2; i <= n; i++) factN *= i;

    long long totalSum = 0;
    do {
        long long cur = 0;
        int cnt = 0;
        for (int i = 0; i < n; i++) {
            cur += d[idx[i]];
            if (cur <= T) cnt++;
            else break;
        }
        totalSum += cnt;
    } while (next_permutation(idx.begin(), idx.end()));

    long long g = gcdll(totalSum, factN);
    if (g == 0) g = 1;
    cout << (totalSum / g) << "/" << (factN / g) << "\\n";
    return 0;
}
`,
    py: `import sys
from itertools import permutations
from math import gcd, factorial

def main():
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx]); idx += 1
    T = int(data[idx]); idx += 1
    d = []
    for _ in range(n):
        d.append(int(data[idx])); idx += 1

    fact_n = factorial(n)
    total_sum = 0
    for perm in permutations(d):
        cur = 0
        cnt = 0
        for x in perm:
            cur += x
            if cur <= T:
                cnt += 1
            else:
                break
        total_sum += cnt

    g = gcd(total_sum, fact_n)
    if g == 0:
        g = 1
    print(f"{total_sum // g}/{fact_n // g}")

main()
`,
    tests: [
      "5 900\n275 205 380 740 340",
      "3 25\n10 20 30",
      "4 50\n5 15 25 35",
      "6 60\n10 10 10 10 10 10",
      "8 100\n10 20 15 25 30 5 35 40",
    ],
  },

  // ===================== 15. Retea de prietenii =====================
  {
    slug: "concurs-mi-ub-2024-retea-prietenii",
    title: "Concurs MI UB 2024 - Numarul de prietenii posibile",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2024", "grafuri"],
    statement:
      "Intr-o firma lucreaza N angajati (numerotati de la 1 la N), avand intre ei m relatii de prietenie reciproca (perechi neordonate). Angajatul cu numarul N si-a facut lista L1 a prietenilor sai directi si lista L2 a prietenilor prietenilor sai, si a constatat ca exact E dintre ceilalti N-1 colegi nu se afla in niciuna dintre aceste doua liste.\n\nDeterminati valoarea minima si valoarea maxima posibila a lui m.",
    input_format: "Se citesc doua numere intregi N si E, separate prin spatiu.",
    output_format: "Se afiseaza doua numere intregi, separate printr-un spatiu: valoarea minima si valoarea maxima ale lui m.",
    constraints: "3 <= N <= 1000\n0 <= E <= N - 2",
    hints:
      "Noteaza cu C = N-1 numarul colegilor angajatului N. Pentru minim, foloseste faptul ca fiecare coleg din L1 sau L2 (in afara de cei E exclusi) are nevoie de cel putin o muchie relevanta. Pentru maxim, porneste de la graful complet si scade muchiile care in mod obligatoriu lipsesc.",
    explanation:
      "Fie C = N - 1 numarul colegilor angajatului N (excluzandu-l pe el insusi). Din enunt, exact C - E dintre acesti colegi apar in L1 U L2.\n\nPentru minim: daca angajatul N are k prieteni directi, sunt necesare k muchii de la N la acestia. Restul de (C - E - k) colegi care apar doar in L2 au nevoie de cel putin o muchie catre un prieten direct al lui N. Suma este k + (C - E - k) = C - E, independenta de k. Deci minimul este m_min = C - E = (N - 1) - E.\n\nPentru maxim: pornim de la graful complet pe N noduri, care are N*(N-1)/2 muchii. Daca angajatul N are k prieteni directi (k >= 1, pentru ca L2 sa poata fi nevida cand E < C), lipsesc muchiile dintre N si cei (C - k) colegi care nu ii sunt prieteni directi, precum si muchiile dintre cei E colegi exclusi si cei k prieteni directi ai lui N (altfel colegii exclusi ar aparea in L2). Numarul de muchii ramase este N*(N-1)/2 - (C - k) - E*k, care se maximizeaza pentru k = 1 (cea mai mica valoare posibila), dand m_max = N*(N-1)/2 - (C - 1) - E = N*(N-1)/2 - (N - 2) - E.\n\n**Complexitate:** O(1).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long N, E;
    cin >> N >> E;
    long long mMin = (N - 1) - E;
    long long mMax = N * (N - 1) / 2 - (N - 2) - E;
    cout << mMin << " " << mMax << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    N = int(data[0])
    E = int(data[1])
    m_min = (N - 1) - E
    m_max = N * (N - 1) // 2 - (N - 2) - E
    print(m_min, m_max)

main()
`,
    tests: ["24 2", "3 0", "5 1", "1000 0", "1000 998"],
  },

  // ===================== 16. Compensatie turneu =====================
  {
    slug: "concurs-mi-ub-2024-compensatie-turneu",
    title: "Concurs MI UB 2024 - Compensatia din turneul cu runda suplimentara",
    difficulty: "easy",
    tags: ["concurs", "mateinfo-ub", "2024", "probabilitati"],
    statement:
      "Intr-un turneu, fondul total de premii este P, impartit intre F finalisti. Inainte de a stabili cei F finalisti, mai raman 2 jucatori care joaca o runda suplimentara pentru ultimul loc in finala (ceilalti F-1 jucatori sunt deja calificati direct).\n\nCei doi jucatori din runda suplimentara sunt compensati cu cate o suma x, platita din fondul total de premii, inainte de runda suplimentara. Determinati suma x astfel incat castigul mediu asteptat sa fie acelasi pentru toti cei F+1 jucatori ramasi (cei F-1 calificati direct si cei 2 din runda suplimentara).",
    input_format: "Se citesc doua numere intregi P si F, separate prin spatiu.",
    output_format: "Se afiseaza un singur numar intreg: suma x.",
    constraints: "2 <= F <= 1000\nP este un multiplu de 2*(F+1)\n1 <= P <= 10^9",
    hints:
      "Dupa plata compensatiei, fondul ramas de 2x mai putin se imparte in mod egal intre cei F finalisti. Scrie ecuatia care egaleaza castigul mediu al unui finalist direct cu castigul mediu al unuia dintre cei doi din runda suplimentara (care primeste x sigur, plus jumatate din castigul de finalist).",
    explanation:
      "Dupa plata compensatiei de 2x (catre cei doi jucatori din runda suplimentara), fondul ramas este P - 2x, impartit in mod egal intre cei F finalisti, deci fiecare finalist castiga in medie (P - 2x) / F.\n\nUn jucator dintre cei F-1 calificati direct are acest castig mediu garantat. Un jucator din runda suplimentara primeste sigur compensatia x, plus, cu probabilitate 1/2 (sansa de a castiga runda suplimentara), castigul de finalist: x + (1/2) * (P - 2x) / F.\n\nEgaland cele doua expresii si rezolvand pentru x, se obtine formula inchisa: x = P / (2 * (F + 1)).\n\n**Complexitate:** O(1).",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long P, F;
    cin >> P >> F;
    long long x = P / (2 * (F + 1));
    cout << x << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    P = int(data[0])
    F = int(data[1])
    x = P // (2 * (F + 1))
    print(x)

main()
`,
    tests: ["10800 4", "100 1", "6000 9", "2716032 10", "202000000 100"],
  },

  // ===================== 17. Secret XOR =====================
  {
    slug: "concurs-mi-ub-2024-secret-xor",
    title: "Concurs MI UB 2024 - Reconstruirea secretului XOR",
    difficulty: "medium",
    tags: ["concurs", "mateinfo-ub", "2024", "simulare"],
    statement:
      "Se considera urmatoarea secventa de cod C++, aplicata asupra unui tablou secret[] de n octeti (numere intre 0 si 255):\n\nfor (int i = 1; i < n; i++)\n    for (int j = 2 * i; j < n; j += i)\n        secret[j] ^= secret[i];\n\nCunoscand tabloul final f[0..n-1] (valorile din secret[] dupa rularea codului), determinati tabloul original o[0..n-1] (valorile din secret[] inainte de rulare).",
    input_format:
      "Pe prima linie se citeste numarul intreg n.\nPe a doua linie se citesc n numere intregi (0-255), tabloul final f[0..n-1].",
    output_format: "Se afiseaza n numere intregi separate prin spatiu: tabloul original reconstituit o[0..n-1].",
    constraints: "1 <= n <= 100000\n0 <= f[i] <= 255",
    hints:
      "Se poate demonstra ca secret[i] folosit in interiorul buclei, la pasul exterior i, este deja valoarea sa finala (nu mai este modificat ulterior). Deci pentru a reface valorile originale, aplicati aceleasi actualizari XOR, dar folosind direct valorile finale f[i] ca sursa.",
    explanation:
      "In bucla data, secret[j] este modificat de fiecare pas exterior i pentru care i divide j si j >= 2*i (adica i este un divizor propriu al lui j, i < j). Se observa ca secret[i] este modificat doar de pasi exteriori i' < i (niciun pas cu i'' > i nu atinge indexul i), deci la momentul in care este folosit in pasul exterior i, secret[i] are deja valoarea sa finala.\n\nAceasta observatie ne permite sa reconstruim direct originalul: pornim cu o[j] = f[j] pentru toti j, apoi pentru fiecare i de la 1 la n-1 si fiecare j = 2i, 3i, ... < n, aplicam o[j] ^= f[i] (folosind valorile finale f, nu cele reconstruite). Deoarece XOR este propria sa inversa, aceasta reface exact valorile originale.\n\n**Complexitate:** O(n log n).",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n;
    cin >> n;
    vector<int> f(n);
    for (auto &x : f) cin >> x;
    vector<int> o = f;
    for (int i = 1; i < n; i++) {
        for (int j = 2 * i; j < n; j += i) {
            o[j] ^= f[i];
        }
    }
    for (int i = 0; i < n; i++) cout << o[i] << (i + 1 < n ? ' ' : '\\n');
    if (n == 0) cout << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx]); idx += 1
    f = []
    for _ in range(n):
        f.append(int(data[idx])); idx += 1
    o = f[:]
    for i in range(1, n):
        j = 2 * i
        while j < n:
            o[j] ^= f[i]
            j += i
    print(" ".join(map(str, o)))

main()
`,
    tests: [
      "12\n109 97 21 4 89 40 62 39 98 72 9 35",
      "1\n200",
      "2\n10 20",
      "5\n1 2 3 4 5",
      (() => {
        const n = 40000;
        const vals = [];
        let seed = 12345;
        for (let i = 0; i < n; i++) {
          seed = (seed * 1103515245 + 12345) & 0x7fffffff;
          vals.push(seed % 256);
        }
        return `${n}\n${vals.join(" ")}`;
      })(),
    ],
  },

  // ===================== 18. Drum probabilist =====================
  {
    slug: "concurs-mi-ub-2024-drum-probabilist",
    title: "Concurs MI UB 2024 - Probabilitatea unui drum minim",
    difficulty: "hard",
    tags: ["concurs", "mateinfo-ub", "2024", "probabilitati"],
    statement:
      "Un baiat porneste din origine (0,0) si trebuie sa ajunga in punctul (X, Y), miscandu-se doar spre dreapta sau in sus (deoarece orice alta directie ar mari durata drumului fata de drumul minim).\n\nProbabilitatea initiala de a merge spre dreapta este pr procente, iar de a merge in sus este pu procente. Dupa fiecare deplasare spre dreapta, probabilitatea de deplasare spre dreapta scade cu 1 procent (iar cea in directia opusa creste, insa acest lucru nu afecteaza un drum minim). Similar pentru deplasarea in sus.\n\nDeterminati probabilitatea exacta ca baiatul sa ajunga in (X, Y) folosind un drum de durata minima (adica exact X pasi la dreapta si Y pasi in sus, in orice ordine), ca fractie zecimala exacta.",
    input_format: "Se citesc patru numere intregi X, Y, pr si pu, separate prin spatii.",
    output_format:
      "Se afiseaza probabilitatea exacta, ca numar zecimal cu exact 2*(X+Y) cifre dupa virgula (fractie zecimala exacta, fara rotunjire).",
    constraints: "1 <= X, Y <= 6\nX + Y <= 12\n1 <= pr, pu <= 99\npr - (X - 1) >= 1\npu - (Y - 1) >= 1",
    hints:
      "Numarul de drumuri minime este C(X+Y, X) (alegerea pozitiilor pasilor spre dreapta). Produsul probabilitatilor este acelasi pentru orice ordine a pasilor, deoarece depinde doar de cate deplasari anterioare s-au facut in aceeasi directie. Foloseste aritmetica exacta (numere intregi) pentru a evita erorile de rotunjire, deoarece toate probabilitatile sunt multipli de 1/100.",
    explanation:
      "Un drum minim din (0,0) in (X,Y) foloseste exact X pasi spre dreapta si Y pasi in sus, in orice ordine; exista C(X+Y, X) astfel de drumuri.\n\nPentru orice ordine a pasilor, probabilitatile succesive ale pasilor spre dreapta sunt pr, pr-1, ..., pr-X+1 (in procente), iar ale pasilor in sus sunt pu, pu-1, ..., pu-Y+1, indiferent de ordinea de intercalare (deoarece scaderea probabilitatii depinde doar de cate deplasari in aceeasi directie s-au facut anterior). Deci probabilitatea unui singur drum minim este produsul acestor procente, impartit la 100^(X+Y).\n\nProbabilitatea totala este C(X+Y, X) inmultit cu acest produs. Pentru a obtine rezultatul exact (fara erori de rotunjire), calculam numaratorul ca numar intreg mare (folosind intregi pe 128 de biti in C++, respectiv intregi cu precizie arbitrara in Python): numarator = C(X+Y,X) * produs_procente_dreapta * produs_procente_sus. Deoarece numitorul este 100^(X+Y) = 10^(2*(X+Y)), rezultatul are o reprezentare zecimala exacta si finita, cu cel mult 2*(X+Y) cifre dupa virgula (se completeaza cu zerouri la stanga daca este nevoie).\n\n**Complexitate:** O(X+Y).",
    time_limit_ms: 2000,
    cpp: `#include <bits/stdc++.h>
using namespace std;

string toDecimal(__int128 num, int digits) {
    string s;
    if (num == 0) s = "0";
    while (num > 0) {
        s.push_back(char('0' + (int)(num % 10)));
        num /= 10;
    }
    reverse(s.begin(), s.end());
    while ((int)s.size() < digits) s = "0" + s;
    return s;
}

int main() {
    long long X, Y, pr, pu;
    cin >> X >> Y >> pr >> pu;

    // binomial C(X+Y, X)
    vector<vector<long long>> C(20, vector<long long>(20, 0));
    for (int i = 0; i < 20; i++) {
        C[i][0] = 1;
        for (int j = 1; j <= i; j++) C[i][j] = C[i - 1][j - 1] + (j <= i - 1 ? C[i - 1][j] : 0);
    }
    long long pathCount = C[X + Y][X];

    __int128 numerator = pathCount;
    long long cur = pr;
    for (int i = 0; i < X; i++) { numerator *= cur; cur--; }
    cur = pu;
    for (int i = 0; i < Y; i++) { numerator *= cur; cur--; }

    int digits = (int)(2 * (X + Y));
    string dec = toDecimal(numerator, digits);
    cout << "0." << dec << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    X = int(data[0])
    Y = int(data[1])
    pr = int(data[2])
    pu = int(data[3])

    from math import comb
    path_count = comb(X + Y, X)

    numerator = path_count
    cur = pr
    for _ in range(X):
        numerator *= cur
        cur -= 1
    cur = pu
    for _ in range(Y):
        numerator *= cur
        cur -= 1

    digits = 2 * (X + Y)
    dec = str(numerator).zfill(digits)
    print("0." + dec)

main()
`,
    tests: ["3 4 40 45", "1 1 50 50", "2 1 60 60", "6 6 50 50", "1 6 90 50"],
  },

  // ===================== 19. Subsecventa 2024 =====================
  {
    slug: "concurs-mi-ub-2024-subsecventa-2024",
    title: "Concurs MI UB 2024 - Numarul de aparitii al unei subsecvente",
    difficulty: "hard",
    tags: ["concurs", "mateinfo-ub", "2024", "programare-dinamica"],
    statement:
      "Se considera sirul finit format prin alipirea in ordine a tuturor cifrelor numerelor naturale nenule mai mici sau egale cu N (adica '123456789101112...N'). Se da si un sablon T, format din cifre.\n\nDeterminati de cate ori apare T ca subsecventa (nu neaparat consecutiva) in sirul obtinut.",
    input_format: "Pe prima linie se citeste numarul intreg N.\nPe a doua linie se citeste sablonul T (sir de cifre).",
    output_format: "Se afiseaza un singur numar intreg: numarul de aparitii ale lui T ca subsecventa.",
    constraints: "10 <= N <= 100000\n1 <= lungimea lui T <= 6",
    hints:
      "Foloseste programare dinamica: pentru fiecare prefix al sablonului T de lungime k, mentine un contor c_k al numarului de subsecvente egale cu acel prefix gasite pana in acel moment, actualizandu-l pe masura ce parcurgi cifrele sirului mare, de la k mare la k mic (pentru a nu folosi aceeasi cifra de doua ori in acelasi prefix).",
    explanation:
      "Notam cu L lungimea sablonului T. Mentinem un tablou c[0..L], unde c[k] reprezinta numarul de moduri de a forma prefixul T[0..k-1] ca subsecventa, folosind cifrele parcurse pana in prezent din sirul mare. Initial c[0] = 1 (subsecventa vida) si c[k] = 0 pentru k > 0.\n\nParcurgem, in ordine, toate cifrele sirului '123...N' (obtinute concatenand reprezentarile zecimale ale numerelor de la 1 la N). Pentru fiecare cifra citita d, parcurgem k de la L la 1 (in ordine descrescatoare, pentru a nu folosi de doua ori aceeasi cifra in acelasi pas): daca T[k-1] == d, atunci c[k] += c[k-1].\n\nLa final, raspunsul este c[L].\n\n**Complexitate:** O(numarul total de cifre din sirul mare * L).",
    time_limit_ms: 2500,
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int N;
    string T;
    cin >> N >> T;
    int L = (int)T.size();
    vector<long long> c(L + 1, 0);
    c[0] = 1;
    for (int x = 1; x <= N; x++) {
        string s = to_string(x);
        for (char ch : s) {
            for (int k = L; k >= 1; k--) {
                if (T[k - 1] == ch) c[k] += c[k - 1];
            }
        }
    }
    cout << c[L] << "\\n";
    return 0;
}
`,
    py: `import sys

def main():
    data = sys.stdin.read().split()
    N = int(data[0])
    T = data[1]
    L = len(T)
    c = [0] * (L + 1)
    c[0] = 1
    for x in range(1, N + 1):
        s = str(x)
        for ch in s:
            for k in range(L, 0, -1):
                if T[k - 1] == ch:
                    c[k] += c[k - 1]
    print(c[L])

main()
`,
    tests: ["2024\n2024", "20\n123", "50\n11", "1000\n99", "100000\n2024"],
  },

  // ===================== 20. Drumuri cu pasi dubli =====================
  {
    slug: "concurs-mi-ub-2024-drumuri-pasi-duble",
    title: "Concurs MI UB 2024 - Drumuri cu pasi de lungime 1 sau 2",
    difficulty: "hard",
    tags: ["concurs", "mateinfo-ub", "2024", "combinatorica"],
    statement:
      "Intr-o matrice bidimensionala infinita, pornind din celula (0,0), se poate face la fiecare mutare un pas de 1 sau 2 pozitii, fie in jos, fie la dreapta: din celula (i,j) se poate ajunge in (i+1,j), (i+2,j), (i,j+1) sau (i,j+2).\n\nDeterminati in cate moduri se poate ajunge din (0,0) in celula (X, Y).",
    input_format: "Se citesc doua numere intregi X si Y, separate prin spatiu.",
    output_format: "Se afiseaza un singur numar intreg: numarul de moduri de a ajunge in (X, Y).",
    constraints: "1 <= X <= 20\n1 <= Y <= 24",
    hints:
      "Separati contributia pe orizontala si verticala: daca se fac h pasi orizontali insumand X, dintre care unii de lungime 2, numarul de moduri de a alege care pasi sunt de lungime 2 este un coeficient binomial. La fel pentru verticala. Apoi, cele h+v mutari (orizontale si verticale) pot fi intercalate in orice ordine.",
    explanation:
      "Presupunem ca se fac h mutari orizontale, care insumeaza X. Daca x dintre ele au lungime 2, atunci 2x + (h-x) = X, deci x = X - h; numarul de moduri de a alege care dintre cele h mutari orizontale au lungime 2 este C(h, X-h). Valorile posibile pentru h sunt de la ceil(X/2) pana la X.\n\nAnalog, pentru v mutari verticale insumand Y, numarul de moduri este C(v, Y-v), cu v de la ceil(Y/2) la Y.\n\nPentru o pereche fixata (h, v), cele h mutari orizontale si v mutari verticale pot fi intercalate in orice ordine in secventa totala de h+v mutari, in C(h+v, h) moduri.\n\nRaspunsul final este suma, pentru toate perechile valide (h, v), a produsului C(h+v, h) * C(h, X-h) * C(v, Y-v).\n\n**Complexitate:** O(X * Y) pentru dubla suma, plus precalcularea coeficientilor binomiali via triunghiul lui Pascal.",
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    long long X, Y;
    cin >> X >> Y;
    int maxN = (int)(X + Y) + 1;
    vector<vector<long long>> C(maxN + 1, vector<long long>(maxN + 1, 0));
    for (int i = 0; i <= maxN; i++) {
        C[i][0] = 1;
        for (int j = 1; j <= i; j++) {
            C[i][j] = C[i - 1][j - 1] + (j <= i - 1 ? C[i - 1][j] : 0);
        }
    }
    long long ans = 0;
    for (long long h = (X + 1) / 2; h <= X; h++) {
        for (long long v = (Y + 1) / 2; v <= Y; v++) {
            ans += C[h + v][h] * C[h][X - h] * C[v][Y - v];
        }
    }
    cout << ans << "\\n";
    return 0;
}
`,
    py: `import sys
from math import comb

def main():
    data = sys.stdin.read().split()
    X = int(data[0])
    Y = int(data[1])
    ans = 0
    for h in range((X + 1) // 2, X + 1):
        for v in range((Y + 1) // 2, Y + 1):
            ans += comb(h + v, h) * comb(h, X - h) * comb(v, Y - v)
    print(ans)

main()
`,
    tests: ["1 1", "2 2", "5 5", "10 8", "20 24"],
  },
];

async function seedGroup(list) {
  const summary = [];

  for (const p of list) {
    console.log(`\n=== ${p.slug} ===`);
    try {
      let allOk = true;
      const testRows = [];

      for (let i = 0; i < p.tests.length; i++) {
        const input = p.tests[i];
        const [cppOut, pyOut] = await Promise.all([runCustom("cpp", p.cpp, input), runCustom("python", p.py, input)]);

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

        testRows.push({ input, expected_output: `${normCpp}\n`, is_sample: i < 2 });
      }

      if (!allOk) {
        console.error(`!!! ${p.slug} has failing tests - NOT publishing.`);
        summary.push({ slug: p.slug, ok: false, tests: testRows.length });
        continue;
      }

      const existing = await pool.query("SELECT id FROM problems WHERE slug = $1", [p.slug]);
      let problemId;
      if (existing.rows.length > 0) {
        problemId = existing.rows[0].id;
        await pool.query(
          `UPDATE problems SET
             title=$2, statement=$3, input_format=$4, output_format=$5, constraints=$6,
             difficulty=$7, time_limit_ms=$8, memory_limit_mb=$9, source=$10, tags=$11,
             allowed_languages=$12, is_published=true, editorial_status='published', official_solution=$13,
             hints=$14, explanation=$15, official_solution_cpp=$16, official_solution_python=$17,
             curriculum_level=$18, curriculum_chapter_id=$19, curriculum_subcategory_id=$20,
             solution_mode='full', checker_mode='exact', updated_at=NOW()
           WHERE id=$1`,
          [
            problemId,
            p.title,
            p.statement,
            p.input_format,
            p.output_format,
            p.constraints,
            p.difficulty,
            p.time_limit_ms || 1500,
            p.memory_limit_mb || 64,
            "Concurs Mate Info UB",
            p.tags || [],
            ["cpp", "c", "pascal", "python"],
            p.cpp,
            p.hints,
            p.explanation,
            p.cpp,
            p.py,
            CHAPTER.level,
            CHAPTER.chapter,
            CHAPTER.sub,
          ],
        );
        await pool.query("DELETE FROM test_cases WHERE problem_id = $1", [problemId]);
      } else {
        const inserted = await pool.query(
          `INSERT INTO problems (
             slug, title, statement, input_format, output_format, constraints,
             difficulty, time_limit_ms, memory_limit_mb, source, tags,
             allowed_languages, is_published, official_solution,
             hints, explanation, official_solution_cpp, official_solution_python,
             curriculum_level, curriculum_chapter_id, curriculum_subcategory_id,
             solution_mode, checker_mode, editorial_status, estimated_minutes
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,$13,$14,$15,$16,$17,$18,$19,$20,'full','exact','published',5
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
            p.time_limit_ms || 1500,
            p.memory_limit_mb || 64,
            "Concurs Mate Info UB",
            p.tags || [],
            ["cpp", "c", "pascal", "python"],
            p.cpp,
            p.hints,
            p.explanation,
            p.cpp,
            p.py,
            CHAPTER.level,
            CHAPTER.chapter,
            CHAPTER.sub,
          ],
        );
        problemId = inserted.rows[0].id;
      }

      for (let i = 0; i < testRows.length; i++) {
        const t = testRows[i];
        await pool.query(
          `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index) VALUES ($1,$2,$3,$4,$5,$6)`,
          [problemId, t.input, t.expected_output, t.is_sample, 10, i + 1],
        );
      }

      console.log(`published ${p.slug} (${p.difficulty}) with ${testRows.length} tests`);
      summary.push({ slug: p.slug, ok: true, tests: testRows.length });
    } catch (err) {
      console.error(`FAIL ${p.slug}: ${err.message}`);
      summary.push({ slug: p.slug, ok: false, error: err.message });
    }
  }

  return summary;
}

async function main() {
  const onlySlugs = process.env.ONLY_SLUGS ? process.env.ONLY_SLUGS.split(",") : null;
  const toRun = onlySlugs ? problems.filter((p) => onlySlugs.includes(p.slug)) : problems;
  const summary = await seedGroup(toRun);

  console.log("\n=== SUMMARY ===");
  let okCount = 0;
  for (const s of summary) {
    if (s.ok) okCount++;
    console.log(`${s.ok ? "OK  " : "FAIL"} ${s.slug} (${s.tests || 0} tests)`);
  }
  console.log(`\n${okCount}/${summary.length} publicate cu succes.`);
  if (okCount < summary.length) process.exitCode = 1;

  await pool.end();
}

main().catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
