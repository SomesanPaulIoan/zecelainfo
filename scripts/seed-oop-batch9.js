const { runMain } = require("./lib/oop-runner");

const LEVEL = "oop";
const SRC = "Zece la Info - OOP (probleme originale)";
const CH = "oop-clase-simple";
const SUB = "incapsulare-si-constructori";

const problems = [];

// ---------------- 24. Triunghi ----------------
problems.push({
  slug: "oop-triunghi",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Clasa Triunghi",
  difficulty: "easy",
  tags: ["oop", "clasa", "geometrie", "triunghi"],
  statement:
    "Scrieti o clasa Triunghi care memoreaza cele trei laturi a, b, c (numere intregi pozitive) ale unui triunghi, cu urmatoarele functionalitati:\n" +
    "- constructor cu trei parametri: a, b, c\n" +
    "- getA(), getB(), getC()\n" +
    "- esteValid() - returneaza adevarat daca cele trei laturi pot forma un triunghi (suma oricaror doua laturi e strict mai mare decat a treia)\n" +
    "- perimetru() - returneaza a+b+c\n" +
    "- esteEchilateral() - returneaza adevarat daca toate cele trei laturi sunt egale",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "1 <= a, b, c <= 1.000.000",
  hints: "esteValid() trebuie sa verifice toate cele trei conditii ale inegalitatii triunghiului.",
  explanation: "Clasa simpla cu o metoda de validare geometrica pe starea obiectului (nu pe un parametru al unui setter, ca la Elev/Cerc).",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Triunghi* t = nullptr;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "NEW") {
            long long a, b, c; cin >> a >> b >> c;
            if (t) delete t;
            t = new Triunghi(a, b, c);
            cout << "OK\\n";
        } else if (cmd == "VALID") {
            cout << (t->esteValid() ? "DA" : "NU") << "\\n";
        } else if (cmd == "PERIM") {
            cout << t->perimetru() << "\\n";
        } else if (cmd == "ECHILATERAL") {
            cout << (t->esteEchilateral() ? "DA" : "NU") << "\\n";
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
    t = None
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "NEW":
            a = int(data[i]); b = int(data[i+1]); c = int(data[i+2]); i += 3
            t = Triunghi(a, b, c)
            out.append("OK")
        elif cmd == "VALID":
            out.append("DA" if t.esteValid() else "NU")
        elif cmd == "PERIM":
            out.append(str(t.perimetru()))
        elif cmd == "ECHILATERAL":
            out.append("DA" if t.esteEchilateral() else "NU")
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Triunghi {
private:
    long long a, b, c;
public:
    Triunghi(long long a, long long b, long long c) : a(a), b(b), c(c) {}
    long long getA() { return a; }
    long long getB() { return b; }
    long long getC() { return c; }
    bool esteValid() { return (a + b > c) && (a + c > b) && (b + c > a); }
    long long perimetru() { return a + b + c; }
    bool esteEchilateral() { return a == b && b == c; }
};
`,
    python: `class Triunghi:
    def __init__(self, a, b, c):
        self.__a = a
        self.__b = b
        self.__c = c
    def getA(self):
        return self.__a
    def getB(self):
        return self.__b
    def getC(self):
        return self.__c
    def esteValid(self):
        return self.__a + self.__b > self.__c and self.__a + self.__c > self.__b and self.__b + self.__c > self.__a
    def perimetru(self):
        return self.__a + self.__b + self.__c
    def esteEchilateral(self):
        return self.__a == self.__b and self.__b == self.__c
`,
  },
  tests: [
    "3\nNEW 3 4 5\nVALID\nPERIM",
    "2\nNEW 1 1 10\nVALID",
    "2\nNEW 5 5 5\nECHILATERAL",
    "2\nNEW 5 5 6\nECHILATERAL",
  ],
  testLabels: [
    "triunghi valid + perimetru",
    "triunghi invalid (inegalitatea triunghiului esueaza)",
    "echilateral - caz adevarat",
    "echilateral - caz fals (isoscel)",
  ],
});

// ---------------- 25. Termometru ----------------
problems.push({
  slug: "oop-termometru",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Clasa Termometru",
  difficulty: "easy",
  tags: ["oop", "clasa", "termometru", "stare-interna"],
  statement:
    "Scrieti o clasa Termometru care memoreaza temperatura curenta, precum si cea mai mica si cea mai mare temperatura inregistrate vreodata, cu urmatoarele functionalitati:\n" +
    "- constructor cu un parametru: temperaturaInitiala (aceasta este si prima valoare min/max inregistrata)\n" +
    "- getTemperatura() - returneaza temperatura curenta\n" +
    "- seteazaTemperatura(int t) - actualizeaza temperatura curenta la t SI, daca e cazul, actualizeaza automat minimul/maximul inregistrat (fara nicio validare - orice valoare e acceptata)\n" +
    "- getMinInregistrat(), getMaxInregistrat()",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "-100 <= temperatura <= 100",
  hints: "seteazaTemperatura NU are nicio validare de respins - de fiecare data trebuie doar sa actualizeze si min/max daca e nevoie.",
  explanation: "Diferit de setterii cu validare din problemele anterioare: aici setterul intotdeauna reuseste, dar trebuie sa intretina o stare auxiliara derivata (minimul si maximul de-a lungul timpului).",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Termometru* t = nullptr;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "NEW") {
            int t0; cin >> t0;
            if (t) delete t;
            t = new Termometru(t0);
            cout << "OK\\n";
        } else if (cmd == "SET") {
            int v; cin >> v;
            t->seteazaTemperatura(v);
            cout << "OK\\n";
        } else if (cmd == "GET") {
            cout << t->getTemperatura() << "\\n";
        } else if (cmd == "MIN") {
            cout << t->getMinInregistrat() << "\\n";
        } else if (cmd == "MAX") {
            cout << t->getMaxInregistrat() << "\\n";
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
    t = None
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "NEW":
            t0 = int(data[i]); i += 1
            t = Termometru(t0)
            out.append("OK")
        elif cmd == "SET":
            v = int(data[i]); i += 1
            t.seteazaTemperatura(v)
            out.append("OK")
        elif cmd == "GET":
            out.append(str(t.getTemperatura()))
        elif cmd == "MIN":
            out.append(str(t.getMinInregistrat()))
        elif cmd == "MAX":
            out.append(str(t.getMaxInregistrat()))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Termometru {
private:
    int temperatura, minInreg, maxInreg;
public:
    Termometru(int t0) : temperatura(t0), minInreg(t0), maxInreg(t0) {}
    int getTemperatura() { return temperatura; }
    void seteazaTemperatura(int t) {
        temperatura = t;
        if (t < minInreg) minInreg = t;
        if (t > maxInreg) maxInreg = t;
    }
    int getMinInregistrat() { return minInreg; }
    int getMaxInregistrat() { return maxInreg; }
};
`,
    python: `class Termometru:
    def __init__(self, t0):
        self.__temperatura = t0
        self.__minInreg = t0
        self.__maxInreg = t0
    def getTemperatura(self):
        return self.__temperatura
    def seteazaTemperatura(self, t):
        self.__temperatura = t
        if t < self.__minInreg:
            self.__minInreg = t
        if t > self.__maxInreg:
            self.__maxInreg = t
    def getMinInregistrat(self):
        return self.__minInreg
    def getMaxInregistrat(self):
        return self.__maxInreg
`,
  },
  tests: [
    "2\nNEW 20\nGET",
    "4\nNEW 20\nSET 25\nMAX\nMIN",
    "5\nNEW 20\nSET 5\nSET 30\nMIN\nMAX",
    "3\nNEW 20\nSET 20\nMIN",
  ],
  testLabels: [
    "constructie + get de baza",
    "setare peste maxim - min ramane, max se actualizeaza",
    "setari alternative - min si max se actualizeaza independent",
    "setare la aceeasi valoare - min/max neschimbate",
  ],
});

module.exports.problems9 = problems;

if (require.main === module) {
  runMain(problems, LEVEL, SRC);
}
