const { runMain } = require("./lib/oop-runner");

const LEVEL = "oop";
const SRC = "Zece la Info - OOP (probleme originale)";
const CH = "oop-colectii-interne";
const SUB = "validare-si-colectii";

const problems = [];

// ---------------- 27. Playlist ----------------
problems.push({
  slug: "oop-playlist",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Clasa Playlist",
  difficulty: "medium",
  tags: ["oop", "clasa", "colectie", "unicitate", "playlist"],
  statement:
    "Scrieti o clasa Playlist care memoreaza intern o lista de titluri de melodii (fara spatii), FARA DUPLICATE, cu urmatoarele functionalitati:\n" +
    "- constructor fara parametri\n" +
    "- adaugaMelodie(titlu) - daca titlul NU exista deja in playlist, il adauga la final si returneaza adevarat; daca exista deja, nu face nimic si returneaza fals\n" +
    "- eliminaMelodie(titlu) - daca titlul exista, il elimina si returneaza adevarat; altfel returneaza fals\n" +
    "- contineMelodie(titlu) - returneaza adevarat/fals\n" +
    "- numarMelodii()",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "Cel mult 1000 de operatii.",
  hints: "adaugaMelodie trebuie sa verifice intai daca titlul exista deja (folosind contineMelodie sau o cautare echivalenta).",
  explanation: "Prima colectie din capitol cu o regula de unicitate (fara duplicate) in loc de o regula de interval numeric - un tip diferit de validare la adaugare.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Playlist p;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "ADD") {
            string titlu; cin >> titlu;
            cout << (p.adaugaMelodie(titlu) ? 1 : 0) << "\\n";
        } else if (cmd == "REMOVE") {
            string titlu; cin >> titlu;
            cout << (p.eliminaMelodie(titlu) ? 1 : 0) << "\\n";
        } else if (cmd == "CONTINE") {
            string titlu; cin >> titlu;
            cout << (p.contineMelodie(titlu) ? "DA" : "NU") << "\\n";
        } else if (cmd == "COUNT") {
            cout << p.numarMelodii() << "\\n";
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
    p = Playlist()
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "ADD":
            titlu = data[i]; i += 1
            out.append("1" if p.adaugaMelodie(titlu) else "0")
        elif cmd == "REMOVE":
            titlu = data[i]; i += 1
            out.append("1" if p.eliminaMelodie(titlu) else "0")
        elif cmd == "CONTINE":
            titlu = data[i]; i += 1
            out.append("DA" if p.contineMelodie(titlu) else "NU")
        elif cmd == "COUNT":
            out.append(str(p.numarMelodii()))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Playlist {
private:
    vector<string> melodii;
public:
    bool contineMelodie(string titlu) {
        for (auto& m : melodii) if (m == titlu) return true;
        return false;
    }
    bool adaugaMelodie(string titlu) {
        if (contineMelodie(titlu)) return false;
        melodii.push_back(titlu);
        return true;
    }
    bool eliminaMelodie(string titlu) {
        for (int i = 0; i < (int)melodii.size(); i++) {
            if (melodii[i] == titlu) {
                melodii.erase(melodii.begin() + i);
                return true;
            }
        }
        return false;
    }
    int numarMelodii() { return melodii.size(); }
};
`,
    python: `class Playlist:
    def __init__(self):
        self.__melodii = []
    def contineMelodie(self, titlu):
        return titlu in self.__melodii
    def adaugaMelodie(self, titlu):
        if self.contineMelodie(titlu):
            return False
        self.__melodii.append(titlu)
        return True
    def eliminaMelodie(self, titlu):
        if titlu in self.__melodii:
            self.__melodii.remove(titlu)
            return True
        return False
    def numarMelodii(self):
        return len(self.__melodii)
`,
  },
  tests: [
    "3\nADD Piesa1\nADD Piesa2\nCOUNT",
    "3\nADD Piesa1\nADD Piesa1\nCOUNT",
    "4\nADD Piesa1\nREMOVE Piesa1\nCONTINE Piesa1\nCOUNT",
    "2\nREMOVE Piesa1\nCOUNT",
  ],
  testLabels: [
    "adaugare melodii distincte",
    "adaugare duplicat e respinsa",
    "eliminare valida",
    "eliminare a unei melodii inexistente",
  ],
});

// ---------------- 28. CoadaCapacitate ----------------
problems.push({
  slug: "oop-coada-capacitate",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Clasa CoadaCapacitate (FIFO cu capacitate limitata)",
  difficulty: "medium",
  tags: ["oop", "clasa", "coada", "capacitate", "colectie"],
  statement:
    "Scrieti o clasa CoadaCapacitate care implementeaza o coada FIFO de numere intregi cu o CAPACITATE MAXIMA fixata la creare, cu urmatoarele functionalitati:\n" +
    "- constructor cu un parametru: capacitateMaxima\n" +
    "- adauga(int x) - daca dimensiunea curenta este mai mica decat capacitateMaxima, adauga x la coada si returneaza adevarat; altfel (coada e plina) returneaza fals fara nicio modificare\n" +
    "- scoate() - scoate si returneaza elementul din fata cozii (se apeleaza doar cand coada NU e goala)\n" +
    "- esteGoala()\n" +
    "- esteFull() - returneaza adevarat daca dimensiunea curenta a atins capacitateMaxima\n" +
    "- dimensiune()",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre. Programul de test verifica esteGoala() inainte de a apela scoate().",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "1 <= capacitateMaxima <= 1000",
  hints: "adauga trebuie sa respinga cererea cand coada e deja plina, nu doar sa ignore capacitatea.",
  explanation: "Introduce un al doilea tip de validare la adaugare intr-o colectie: respingere pe baza de CAPACITATE (nu pe baza valorii adaugate, ca la ListaNote/Sondaj, si nu pe baza de duplicat, ca la Playlist).",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    CoadaCapacitate* c = nullptr;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "NEW") {
            int cap; cin >> cap;
            if (c) delete c;
            c = new CoadaCapacitate(cap);
            cout << "OK\\n";
        } else if (cmd == "ADAUGA") {
            long long x; cin >> x;
            cout << (c->adauga(x) ? 1 : 0) << "\\n";
        } else if (cmd == "SCOATE") {
            if (c->esteGoala()) cout << "GOALA\\n";
            else cout << c->scoate() << "\\n";
        } else if (cmd == "FULL") {
            cout << (c->esteFull() ? "DA" : "NU") << "\\n";
        } else if (cmd == "DIM") {
            cout << c->dimensiune() << "\\n";
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
    c = None
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "NEW":
            cap = int(data[i]); i += 1
            c = CoadaCapacitate(cap)
            out.append("OK")
        elif cmd == "ADAUGA":
            x = int(data[i]); i += 1
            out.append("1" if c.adauga(x) else "0")
        elif cmd == "SCOATE":
            out.append("GOALA" if c.esteGoala() else str(c.scoate()))
        elif cmd == "FULL":
            out.append("DA" if c.esteFull() else "NU")
        elif cmd == "DIM":
            out.append(str(c.dimensiune()))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class CoadaCapacitate {
private:
    deque<long long> elemente;
    int capacitateMaxima;
public:
    CoadaCapacitate(int cap) : capacitateMaxima(cap) {}
    bool adauga(long long x) {
        if ((int)elemente.size() >= capacitateMaxima) return false;
        elemente.push_back(x);
        return true;
    }
    long long scoate() {
        long long x = elemente.front();
        elemente.pop_front();
        return x;
    }
    bool esteGoala() { return elemente.empty(); }
    bool esteFull() { return (int)elemente.size() >= capacitateMaxima; }
    int dimensiune() { return elemente.size(); }
};
`,
    python: `from collections import deque

class CoadaCapacitate:
    def __init__(self, cap):
        self.__elemente = deque()
        self.__capacitateMaxima = cap
    def adauga(self, x):
        if len(self.__elemente) >= self.__capacitateMaxima:
            return False
        self.__elemente.append(x)
        return True
    def scoate(self):
        return self.__elemente.popleft()
    def esteGoala(self):
        return len(self.__elemente) == 0
    def esteFull(self):
        return len(self.__elemente) >= self.__capacitateMaxima
    def dimensiune(self):
        return len(self.__elemente)
`,
  },
  tests: [
    "4\nNEW 2\nADAUGA 1\nADAUGA 2\nFULL",
    "5\nNEW 2\nADAUGA 1\nADAUGA 2\nADAUGA 3\nDIM",
    "6\nNEW 2\nADAUGA 1\nADAUGA 2\nSCOATE\nADAUGA 3\nDIM",
    "2\nNEW 3\nSCOATE",
  ],
  testLabels: [
    "umplere pana la capacitate - esteFull devine adevarat",
    "adaugare peste capacitate e respinsa",
    "scoatere elibereaza loc pentru o noua adaugare",
    "scoate pe coada goala imediat dupa constructie",
  ],
});

module.exports.problems10 = problems;

if (require.main === module) {
  runMain(problems, LEVEL, SRC);
}
