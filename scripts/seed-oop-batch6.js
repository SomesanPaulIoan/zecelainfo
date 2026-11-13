const { runMain } = require("./lib/oop-runner");

const LEVEL = "oop";
const SRC = "Zece la Info - OOP (probleme originale)";
const CH = "oop-colectii-interne";
const SUB = "validare-si-colectii";

const problems = [];

// ---------------- 14. Inventar ----------------
problems.push({
  slug: "oop-inventar",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Clasa Inventar",
  difficulty: "medium",
  tags: ["oop", "clasa", "colectie", "map", "inventar"],
  statement:
    "Scrieti o clasa Inventar care memoreaza intern cantitatile disponibile pentru mai multe produse (identificate prin nume, fara spatii), folosind o structura de tip dictionar (map/dictionary), cu urmatoarele functionalitati:\n" +
    "- constructor fara parametri (inventar gol)\n" +
    "- adaugaProdus(nume, cantitate) - daca cantitate > 0: adauga produsul, iar daca produsul exista deja, ADUNA cantitatea la cea existenta; returneaza adevarat. Daca cantitate <= 0, nu face nimic si returneaza fals.\n" +
    "- scoateProdus(nume, cantitate) - daca cantitate > 0 SI produsul exista SI cantitatea curenta este suficienta, scade cantitatea si returneaza adevarat; altfel returneaza fals fara nicio modificare\n" +
    "- cantitateProdus(nume) - returneaza cantitatea curenta a produsului (0 daca produsul nu a fost niciodata adaugat)\n" +
    "- numarProduseDistincte() - returneaza cate produse DIFERITE au fost adaugate vreodata in inventar",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "0 <= cantitati <= 1.000.000.000",
  hints: "Folositi un map<string,long long> (C++) sau un dict (Python) pentru a asocia fiecare nume de produs cu cantitatea lui.",
  explanation: "Prima problema din capitol care foloseste o colectie de tip dictionar (cheie->valoare) in loc de un simplu vector.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Inventar inv;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "ADD") {
            string nume; long long cant; cin >> nume >> cant;
            cout << (inv.adaugaProdus(nume, cant) ? 1 : 0) << "\\n";
        } else if (cmd == "REMOVE") {
            string nume; long long cant; cin >> nume >> cant;
            cout << (inv.scoateProdus(nume, cant) ? 1 : 0) << "\\n";
        } else if (cmd == "QTY") {
            string nume; cin >> nume;
            cout << inv.cantitateProdus(nume) << "\\n";
        } else if (cmd == "COUNT") {
            cout << inv.numarProduseDistincte() << "\\n";
        }
    }
    return 0;
}
`,
    python: `import sys
__USER_CODE__
def main():
    data = sys.stdin.read().split()
    i = 0
    T = int(data[i]); i += 1
    inv = Inventar()
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "ADD":
            nume = data[i]; cant = int(data[i+1]); i += 2
            out.append("1" if inv.adaugaProdus(nume, cant) else "0")
        elif cmd == "REMOVE":
            nume = data[i]; cant = int(data[i+1]); i += 2
            out.append("1" if inv.scoateProdus(nume, cant) else "0")
        elif cmd == "QTY":
            nume = data[i]; i += 1
            out.append(str(inv.cantitateProdus(nume)))
        elif cmd == "COUNT":
            out.append(str(inv.numarProduseDistincte()))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Inventar {
private:
    map<string, long long> cantitati;
public:
    bool adaugaProdus(string nume, long long cantitate) {
        if (cantitate <= 0) return false;
        cantitati[nume] += cantitate;
        return true;
    }
    bool scoateProdus(string nume, long long cantitate) {
        if (cantitate <= 0) return false;
        auto it = cantitati.find(nume);
        if (it == cantitati.end() || it->second < cantitate) return false;
        it->second -= cantitate;
        return true;
    }
    long long cantitateProdus(string nume) {
        auto it = cantitati.find(nume);
        if (it == cantitati.end()) return 0;
        return it->second;
    }
    int numarProduseDistincte() { return cantitati.size(); }
};
`,
    python: `class Inventar:
    def __init__(self):
        self.__cantitati = {}
    def adaugaProdus(self, nume, cantitate):
        if cantitate <= 0:
            return False
        self.__cantitati[nume] = self.__cantitati.get(nume, 0) + cantitate
        return True
    def scoateProdus(self, nume, cantitate):
        if cantitate <= 0:
            return False
        if nume not in self.__cantitati or self.__cantitati[nume] < cantitate:
            return False
        self.__cantitati[nume] -= cantitate
        return True
    def cantitateProdus(self, nume):
        return self.__cantitati.get(nume, 0)
    def numarProduseDistincte(self):
        return len(self.__cantitati)
`,
  },
  tests: [
    "4\nADD mere 10\nADD banane 5\nQTY mere\nCOUNT",
    "3\nADD mere 10\nADD mere 5\nQTY mere",
    "3\nADD mere 10\nREMOVE mere 3\nQTY mere",
    "3\nADD mere 10\nREMOVE mere 20\nQTY mere",
    "2\nQTY portocale\nCOUNT",
  ],
  testLabels: [
    "adaugare produse distincte + qty/count de baza",
    "adaugare repetata a aceluiasi produs se cumuleaza",
    "scoatere valida",
    "scoatere cu cantitate insuficienta e respinsa",
    "interogare pe un produs care nu a fost niciodata adaugat",
  ],
});

// ---------------- 15. Coada ----------------
problems.push({
  slug: "oop-coada",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Clasa Coada (FIFO)",
  difficulty: "medium",
  tags: ["oop", "clasa", "coada", "fifo", "colectie"],
  statement:
    "Scrieti o clasa Coada care implementeaza o coada de numere intregi (structura FIFO - First In First Out), memorand intern elementele intr-o colectie, cu urmatoarele functionalitati:\n" +
    "- constructor fara parametri (coada incepe goala)\n" +
    "- adauga(int x) - adauga x la finalul cozii\n" +
    "- scoate() - scoate si returneaza elementul din fata cozii (se apeleaza doar cand coada NU e goala)\n" +
    "- primul() - returneaza (fara sa scoata) elementul din fata cozii (se apeleaza doar cand coada NU e goala)\n" +
    "- esteGoala() - returneaza adevarat daca coada nu are elemente\n" +
    "- dimensiune() - returneaza numarul curent de elemente",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre. Programul de test verifica esteGoala() inainte de a apela scoate()/primul().",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "-1.000.000.000 <= x <= 1.000.000.000",
  hints: "Este structural asemanatoare cu o Stiva, dar cu ordine FIFO in loc de LIFO - primul element adaugat este primul scos.",
  explanation: "Contrapartea FIFO a Stivei (LIFO) din capitolul anterior - aceleasi operatii de garda (esteGoala), dar ordine de extractie diferita, ceea ce o face un bun exercitiu de comparatie directa.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Coada c;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "ADAUGA") {
            long long x; cin >> x;
            c.adauga(x);
            cout << "OK\\n";
        } else if (cmd == "SCOATE") {
            if (c.esteGoala()) cout << "GOALA\\n";
            else cout << c.scoate() << "\\n";
        } else if (cmd == "PRIMUL") {
            if (c.esteGoala()) cout << "GOALA\\n";
            else cout << c.primul() << "\\n";
        } else if (cmd == "DIM") {
            cout << c.dimensiune() << "\\n";
        }
    }
    return 0;
}
`,
    python: `import sys
__USER_CODE__
def main():
    data = sys.stdin.read().split()
    i = 0
    T = int(data[i]); i += 1
    c = Coada()
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "ADAUGA":
            x = int(data[i]); i += 1
            c.adauga(x)
            out.append("OK")
        elif cmd == "SCOATE":
            out.append("GOALA" if c.esteGoala() else str(c.scoate()))
        elif cmd == "PRIMUL":
            out.append("GOALA" if c.esteGoala() else str(c.primul()))
        elif cmd == "DIM":
            out.append(str(c.dimensiune()))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Coada {
private:
    deque<long long> elemente;
public:
    void adauga(long long x) { elemente.push_back(x); }
    long long scoate() {
        long long x = elemente.front();
        elemente.pop_front();
        return x;
    }
    long long primul() { return elemente.front(); }
    bool esteGoala() { return elemente.empty(); }
    int dimensiune() { return elemente.size(); }
};
`,
    python: `from collections import deque

class Coada:
    def __init__(self):
        self.__elemente = deque()
    def adauga(self, x):
        self.__elemente.append(x)
    def scoate(self):
        return self.__elemente.popleft()
    def primul(self):
        return self.__elemente[0]
    def esteGoala(self):
        return len(self.__elemente) == 0
    def dimensiune(self):
        return len(self.__elemente)
`,
  },
  tests: [
    "6\nADAUGA 1\nADAUGA 2\nADAUGA 3\nSCOATE\nSCOATE\nSCOATE",
    "1\nSCOATE",
    "8\nADAUGA 5\nPRIMUL\nADAUGA 9\nPRIMUL\nDIM\nSCOATE\nDIM\nPRIMUL",
    "5\nADAUGA 1\nADAUGA 2\nSCOATE\nSCOATE\nSCOATE",
  ],
  testLabels: [
    "adauga/scoate secvential - verifica ordinea FIFO",
    "scoate pe coada goala imediat dupa constructie",
    "amestec adauga/primul/scoate cu dimensiune urmarita corect",
    "adauga, adauga, scoate, scoate, apoi inca un scoate pe coada golita (limita)",
  ],
});

// ---------------- 16. Sondaj ----------------
problems.push({
  slug: "oop-sondaj",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Clasa Sondaj",
  difficulty: "medium",
  tags: ["oop", "clasa", "statistica", "frecventa", "sondaj"],
  statement:
    "Scrieti o clasa Sondaj care memoreaza intern raspunsurile la un sondaj de satisfactie (numere intregi de la 1 la 5), cu urmatoarele functionalitati:\n" +
    "- constructor fara parametri\n" +
    "- adaugaRaspuns(int r) - adauga r DOAR daca 1 <= r <= 5; returneaza adevarat/fals\n" +
    "- numarRaspunsuri() - cate raspunsuri valide au fost adaugate\n" +
    "- procentPozitive() - procentul (numar intreg, trunchiat) de raspunsuri cu valoarea >= 4; returneaza 0 daca nu exista niciun raspuns\n" +
    "- raspunsCelMaiFrecvent() - valoarea care apare de cele mai multe ori (la egalitate, valoarea cea mai mica dintre cele cu frecventa maxima); returneaza -1 daca nu exista niciun raspuns",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "0 <= r <= 10 (testat inclusiv in afara intervalului valid [1,5])",
  hints: "Pentru raspunsCelMaiFrecvent, numarati frecventa fiecarei valori (1-5) si alegeti maximul; la egalitate, valoarea mai mica castiga.",
  explanation: "Introduce calcul de frecventa/mod pe o colectie interna - putin mai complex algoritmic decat medie/max/min.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Sondaj s;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "ADD") {
            int r; cin >> r;
            cout << (s.adaugaRaspuns(r) ? 1 : 0) << "\\n";
        } else if (cmd == "COUNT") {
            cout << s.numarRaspunsuri() << "\\n";
        } else if (cmd == "PROCENT") {
            cout << s.procentPozitive() << "\\n";
        } else if (cmd == "MODE") {
            cout << s.raspunsCelMaiFrecvent() << "\\n";
        }
    }
    return 0;
}
`,
    python: `import sys
__USER_CODE__
def main():
    data = sys.stdin.read().split()
    i = 0
    T = int(data[i]); i += 1
    s = Sondaj()
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "ADD":
            r = int(data[i]); i += 1
            out.append("1" if s.adaugaRaspuns(r) else "0")
        elif cmd == "COUNT":
            out.append(str(s.numarRaspunsuri()))
        elif cmd == "PROCENT":
            out.append(str(s.procentPozitive()))
        elif cmd == "MODE":
            out.append(str(s.raspunsCelMaiFrecvent()))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Sondaj {
private:
    vector<int> raspunsuri;
public:
    bool adaugaRaspuns(int r) {
        if (r < 1 || r > 5) return false;
        raspunsuri.push_back(r);
        return true;
    }
    int numarRaspunsuri() { return raspunsuri.size(); }
    int procentPozitive() {
        if (raspunsuri.empty()) return 0;
        int pos = 0;
        for (int r : raspunsuri) if (r >= 4) pos++;
        return (pos * 100) / (int)raspunsuri.size();
    }
    int raspunsCelMaiFrecvent() {
        if (raspunsuri.empty()) return -1;
        int freq[6] = {0, 0, 0, 0, 0, 0};
        for (int r : raspunsuri) freq[r]++;
        int best = 1;
        for (int v = 2; v <= 5; v++) if (freq[v] > freq[best]) best = v;
        return best;
    }
};
`,
    python: `class Sondaj:
    def __init__(self):
        self.__raspunsuri = []
    def adaugaRaspuns(self, r):
        if r < 1 or r > 5:
            return False
        self.__raspunsuri.append(r)
        return True
    def numarRaspunsuri(self):
        return len(self.__raspunsuri)
    def procentPozitive(self):
        if not self.__raspunsuri:
            return 0
        pos = sum(1 for r in self.__raspunsuri if r >= 4)
        return (pos * 100) // len(self.__raspunsuri)
    def raspunsCelMaiFrecvent(self):
        if not self.__raspunsuri:
            return -1
        freq = [0, 0, 0, 0, 0, 0]
        for r in self.__raspunsuri:
            freq[r] += 1
        best = 1
        for v in range(2, 6):
            if freq[v] > freq[best]:
                best = v
        return best
`,
  },
  tests: [
    "5\nADD 5\nADD 4\nADD 3\nCOUNT\nPROCENT",
    "2\nADD 0\nCOUNT",
    "5\nADD 3\nADD 3\nADD 5\nADD 5\nMODE",
    "1\nMODE",
    "4\nADD 5\nADD 5\nADD 1\nMODE",
  ],
  testLabels: [
    "adaugare valida + count/procent de baza",
    "raspuns invalid (0) e respins",
    "mode cu egalitate - alege valoarea mai mica",
    "mode pe sondaj gol (-1)",
    "mode fara egalitate",
  ],
});

module.exports.problems6 = problems;

if (require.main === module) {
  runMain(problems, LEVEL, SRC);
}
