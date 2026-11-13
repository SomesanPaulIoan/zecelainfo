const { runMain } = require("./lib/oop-runner");

const LEVEL = "oop";
const SRC = "Zece la Info - OOP (probleme originale)";
const CH = "oop-clase-simple";
const SUB = "incapsulare-si-constructori";

const problems = [];

// ---------------- 11. Cerc ----------------
problems.push({
  slug: "oop-cerc",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Clasa Cerc",
  difficulty: "easy",
  tags: ["oop", "clasa", "geometrie", "cerc"],
  statement:
    "Scrieti o clasa Cerc care memoreaza raza (numar intreg) unui cerc, cu urmatoarele functionalitati:\n" +
    "- constructor cu un parametru: raza\n" +
    "- getRaza()\n" +
    "- setRaza(int r) - actualizeaza raza DOAR daca r > 0; returneaza adevarat daca a actualizat, fals altfel (raza ramane neschimbata)\n" +
    "- arie() - returneaza aria cercului (pi * raza^2)\n" +
    "- circumferinta() - returneaza circumferinta (2 * pi * raza)\n\n" +
    "Folositi valoarea lui pi din biblioteca standard (M_PI in C++, math.pi in Python).",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output. Valorile reale se afiseaza cu 2 zecimale.",
  constraints: "1 <= raza <= 1.000.000",
  hints: "setRaza trebuie sa respinga valorile <= 0.",
  explanation: "Clasa simpla cu validare pe setter, similara ca forma cu Dreptunghi, dar cu formule ce implica pi.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    cout << fixed << setprecision(2);
    int T;
    cin >> T;
    Cerc* c = nullptr;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "NEW") {
            int r; cin >> r;
            if (c) delete c;
            c = new Cerc(r);
            cout << "OK\\n";
        } else if (cmd == "ARIE") {
            cout << c->arie() << "\\n";
        } else if (cmd == "CIRC") {
            cout << c->circumferinta() << "\\n";
        } else if (cmd == "SETR") {
            int r; cin >> r;
            bool ok = c->setRaza(r);
            cout << (ok ? 1 : 0) << " " << c->getRaza() << "\\n";
        }
    }
    return 0;
}
`,
    python: `import sys, math
__USER_CODE__
def main():
    data = sys.stdin.read().split()
    i = 0
    T = int(data[i]); i += 1
    c = None
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "NEW":
            r = int(data[i]); i += 1
            c = Cerc(r)
            out.append("OK")
        elif cmd == "ARIE":
            out.append(f"{c.arie():.2f}")
        elif cmd == "CIRC":
            out.append(f"{c.circumferinta():.2f}")
        elif cmd == "SETR":
            r = int(data[i]); i += 1
            ok = c.setRaza(r)
            out.append(f"{1 if ok else 0} {c.getRaza()}")
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Cerc {
private:
    int raza;
public:
    Cerc(int r) : raza(r) {}
    int getRaza() { return raza; }
    bool setRaza(int r) {
        if (r <= 0) return false;
        raza = r;
        return true;
    }
    double arie() { return M_PI * raza * raza; }
    double circumferinta() { return 2 * M_PI * raza; }
};
`,
    python: `class Cerc:
    def __init__(self, r):
        self.__raza = r
    def getRaza(self):
        return self.__raza
    def setRaza(self, r):
        if r <= 0:
            return False
        self.__raza = r
        return True
    def arie(self):
        return math.pi * self.__raza * self.__raza
    def circumferinta(self):
        return 2 * math.pi * self.__raza
`,
  },
  tests: [
    "3\nNEW 5\nARIE\nCIRC",
    "2\nNEW 5\nSETR -3",
    "3\nNEW 5\nSETR 10\nARIE",
    "3\nNEW 1\nARIE\nCIRC",
  ],
  testLabels: [
    "constructie + arie/circumferinta de baza",
    "setRaza invalid (<=0) e respins",
    "setRaza valid schimba starea",
    "raza minima (1)",
  ],
});

// ---------------- 12. Fractie ----------------
problems.push({
  slug: "oop-fractie",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Clasa Fractie",
  difficulty: "easy",
  tags: ["oop", "clasa", "fractie", "gcd"],
  statement:
    "Scrieti o clasa Fractie care memoreaza o fractie numarator/numitor (numitor > 0), cu urmatoarele functionalitati:\n" +
    "- constructor cu doi parametri: numarator, numitor\n" +
    "- getNumarator(), getNumitor()\n" +
    "- simplifica() - returneaza un NOU obiect Fractie, reprezentand fractia curenta simplificata (impartita la cel mai mare divizor comun al valorilor absolute), FARA sa modifice fractia curenta\n" +
    "- esteEchivalenta(Fractie alta) - returneaza adevarat daca cele doua fractii reprezinta aceeasi valoare (verificare prin inmultire incrucisata: a*d == b*c)",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "-1000 <= numarator <= 1000, 1 <= numitor <= 1000",
  hints: "simplifica() NU trebuie sa modifice obiectul curent - returneaza un obiect nou.",
  explanation: "La fel ca Vector2D, testeaza ca o metoda care 'transforma' obiectul returneaza de fapt un obiect nou, in loc sa mute starea curenta.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Fractie* f = nullptr;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "NEW") {
            long long a, b; cin >> a >> b;
            if (f) delete f;
            f = new Fractie(a, b);
            cout << "OK\\n";
        } else if (cmd == "SIMPLIFICA") {
            Fractie r = f->simplifica();
            cout << r.getNumarator() << " " << r.getNumitor() << "\\n";
        } else if (cmd == "GET") {
            cout << f->getNumarator() << " " << f->getNumitor() << "\\n";
        } else if (cmd == "ECHIV") {
            long long a2, b2; cin >> a2 >> b2;
            Fractie tmp(a2, b2);
            cout << (f->esteEchivalenta(tmp) ? "DA" : "NU") << "\\n";
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
    f = None
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "NEW":
            a = int(data[i]); b = int(data[i+1]); i += 2
            f = Fractie(a, b)
            out.append("OK")
        elif cmd == "SIMPLIFICA":
            r = f.simplifica()
            out.append(f"{r.getNumarator()} {r.getNumitor()}")
        elif cmd == "GET":
            out.append(f"{f.getNumarator()} {f.getNumitor()}")
        elif cmd == "ECHIV":
            a2 = int(data[i]); b2 = int(data[i+1]); i += 2
            tmp = Fractie(a2, b2)
            out.append("DA" if f.esteEchivalenta(tmp) else "NU")
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Fractie {
private:
    long long numarator, numitor;
public:
    Fractie(long long a, long long b) : numarator(a), numitor(b) {}
    long long getNumarator() { return numarator; }
    long long getNumitor() { return numitor; }
    Fractie simplifica() {
        long long g = __gcd(llabs(numarator), llabs(numitor));
        if (g == 0) g = 1;
        return Fractie(numarator / g, numitor / g);
    }
    bool esteEchivalenta(Fractie alta) {
        return numarator * alta.numitor == alta.numarator * numitor;
    }
};
`,
    python: `import math

class Fractie:
    def __init__(self, a, b):
        self.__numarator = a
        self.__numitor = b
    def getNumarator(self):
        return self.__numarator
    def getNumitor(self):
        return self.__numitor
    def simplifica(self):
        g = math.gcd(abs(self.__numarator), abs(self.__numitor))
        if g == 0:
            g = 1
        return Fractie(self.__numarator // g, self.__numitor // g)
    def esteEchivalenta(self, alta):
        return self.__numarator * alta.getNumitor() == alta.getNumarator() * self.__numitor
`,
  },
  tests: [
    "3\nNEW 4 8\nSIMPLIFICA\nGET",
    "2\nNEW 3 5\nECHIV 6 10",
    "2\nNEW 3 5\nECHIV 6 11",
    "2\nNEW -2 4\nSIMPLIFICA",
  ],
  testLabels: [
    "simplifica returneaza obiect nou, originalul ramane neschimbat",
    "esteEchivalenta pe caz adevarat",
    "esteEchivalenta pe caz fals",
    "simplifica cu numarator negativ",
  ],
});

// ---------------- 13. Produs ----------------
problems.push({
  slug: "oop-produs",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Clasa Produs",
  difficulty: "easy",
  tags: ["oop", "clasa", "produs", "validare"],
  statement:
    "Scrieti o clasa Produs care memoreaza numele (fara spatii), pretul (numar intreg) si cantitatea (numar intreg) unui produs, cu urmatoarele functionalitati:\n" +
    "- constructor cu trei parametri: nume, pret, cantitate\n" +
    "- getNume(), getPret(), getCantitate()\n" +
    "- valoareTotala() - returneaza pret * cantitate\n" +
    "- aplicaReducere(int procent) - daca 0 <= procent <= 100, scade pretul cu procent% din valoarea curenta (calcul in intregi, trunchiat) si returneaza adevarat; altfel returneaza fals si pretul ramane neschimbat",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "0 <= pret, cantitate <= 1.000.000, 0 <= procent <= 1000 (testat inclusiv in afara intervalului valid)",
  hints: "aplicaReducere trebuie sa respinga procentele in afara intervalului [0,100].",
  explanation: "Similar cu Elev.setVarsta, dar validarea se aplica unei operatii de business (reducere de pret) in loc de o simpla atribuire.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Produs* p = nullptr;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "NEW") {
            string nume; long long pret, cant;
            cin >> nume >> pret >> cant;
            if (p) delete p;
            p = new Produs(nume, pret, cant);
            cout << "OK\\n";
        } else if (cmd == "VALOARE") {
            cout << p->valoareTotala() << "\\n";
        } else if (cmd == "REDUCERE") {
            int procent; cin >> procent;
            bool ok = p->aplicaReducere(procent);
            cout << (ok ? 1 : 0) << " " << p->getPret() << "\\n";
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
    p = None
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "NEW":
            nume = data[i]; pret = int(data[i+1]); cant = int(data[i+2]); i += 3
            p = Produs(nume, pret, cant)
            out.append("OK")
        elif cmd == "VALOARE":
            out.append(str(p.valoareTotala()))
        elif cmd == "REDUCERE":
            procent = int(data[i]); i += 1
            ok = p.aplicaReducere(procent)
            out.append(f"{1 if ok else 0} {p.getPret()}")
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Produs {
private:
    string nume;
    long long pret, cantitate;
public:
    Produs(string n, long long pr, long long c) : nume(n), pret(pr), cantitate(c) {}
    string getNume() { return nume; }
    long long getPret() { return pret; }
    long long getCantitate() { return cantitate; }
    long long valoareTotala() { return pret * cantitate; }
    bool aplicaReducere(int procent) {
        if (procent < 0 || procent > 100) return false;
        pret = pret - (pret * procent) / 100;
        return true;
    }
};
`,
    python: `class Produs:
    def __init__(self, nume, pret, cantitate):
        self.__nume = nume
        self.__pret = pret
        self.__cantitate = cantitate
    def getNume(self):
        return self.__nume
    def getPret(self):
        return self.__pret
    def getCantitate(self):
        return self.__cantitate
    def valoareTotala(self):
        return self.__pret * self.__cantitate
    def aplicaReducere(self, procent):
        if procent < 0 or procent > 100:
            return False
        self.__pret = self.__pret - (self.__pret * procent) // 100
        return True
`,
  },
  tests: [
    "2\nNEW Laptop 1000 3\nVALOARE",
    "2\nNEW Laptop 1000 3\nREDUCERE 10",
    "2\nNEW Laptop 1000 3\nREDUCERE 150",
    "3\nNEW Telefon 999 2\nREDUCERE 50\nVALOARE",
  ],
  testLabels: [
    "constructie + valoareTotala",
    "reducere valida schimba pretul",
    "reducere invalida (>100) e respinsa",
    "reducere valida urmata de valoareTotala cu noul pret",
  ],
});

module.exports.problems5 = problems;

if (require.main === module) {
  runMain(problems, LEVEL, SRC);
}
