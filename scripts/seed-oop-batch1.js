const { runMain } = require("./lib/oop-runner");

const LEVEL = "oop";
const SRC = "Zece la Info - OOP (probleme originale)";

const CH_SIMPLE = "oop-clase-simple";
const CH_COLECTII = "oop-colectii-interne";
const CH_COMPUNERE = "oop-compunere-clase";
const CH_SISTEME = "oop-sisteme-mari";

const problems = [];

// ============================================================
// CAPITOL 1: CLASE SIMPLE (incapsulare, constructor, getteri/setteri)
// ============================================================

// ---------------- 1. Dreptunghi ----------------
problems.push({
  slug: "oop-dreptunghi",
  chapterId: CH_SIMPLE,
  subcategoryId: "incapsulare-si-constructori",
  title: "Clasa Dreptunghi",
  difficulty: "easy",
  tags: ["oop", "clasa", "incapsulare", "constructor"],
  statement:
    "Scrieti o clasa Dreptunghi care memoreaza latura lungime si latura latime (numere intregi), cu urmatoarele functionalitati:\n" +
    "- constructor cu doi parametri: lungime, latime\n" +
    "- getLungime() si getLatime() - returneaza valorile curente\n" +
    "- setLungime(int l) si setLatime(int l) - modifica valorile\n" +
    "- arie() - returneaza aria (lungime * latime)\n" +
    "- perimetru() - returneaza perimetrul (2 * (lungime + latime))\n" +
    "- esteAtrat() - returneaza adevarat daca dreptunghiul este de fapt un patrat (lungime == latime)\n\n" +
    "Campurile trebuie sa fie private, accesul facandu-se doar prin metodele descrise.",
  input_format: "Nu se citesc date direct de catre clasa - codul vostru va fi integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda din programul de test produce o linie de output, conform descrierii comenzilor.",
  constraints: "1 <= lungime, latime <= 1.000.000.000",
  hints: "Nu uitati sa faceti campurile private si sa oferiti getteri/setteri pentru ele.",
  explanation: "Clasa are doua campuri intregi private si cinci metode publice simple, fara logica speciala.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Dreptunghi* d = nullptr;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "NEW") {
            int l, w; cin >> l >> w;
            if (d) delete d;
            d = new Dreptunghi(l, w);
            cout << "OK\\n";
        } else if (cmd == "ARIE") {
            cout << d->arie() << "\\n";
        } else if (cmd == "PERIMETRU") {
            cout << d->perimetru() << "\\n";
        } else if (cmd == "PATRAT") {
            cout << (d->esteAtrat() ? "DA" : "NU") << "\\n";
        } else if (cmd == "SETL") {
            int l; cin >> l;
            d->setLungime(l);
            cout << "OK\\n";
        } else if (cmd == "SETW") {
            int w; cin >> w;
            d->setLatime(w);
            cout << "OK\\n";
        } else if (cmd == "GET") {
            cout << d->getLungime() << " " << d->getLatime() << "\\n";
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
    d = None
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "NEW":
            l = int(data[i]); w = int(data[i+1]); i += 2
            d = Dreptunghi(l, w)
            out.append("OK")
        elif cmd == "ARIE":
            out.append(str(d.arie()))
        elif cmd == "PERIMETRU":
            out.append(str(d.perimetru()))
        elif cmd == "PATRAT":
            out.append("DA" if d.esteAtrat() else "NU")
        elif cmd == "SETL":
            l = int(data[i]); i += 1
            d.setLungime(l)
            out.append("OK")
        elif cmd == "SETW":
            w = int(data[i]); i += 1
            d.setLatime(w)
            out.append("OK")
        elif cmd == "GET":
            out.append(f"{d.getLungime()} {d.getLatime()}")
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Dreptunghi {
private:
    int lungime, latime;
public:
    Dreptunghi(int l, int w) : lungime(l), latime(w) {}
    int getLungime() { return lungime; }
    int getLatime() { return latime; }
    void setLungime(int l) { lungime = l; }
    void setLatime(int w) { latime = w; }
    long long arie() { return (long long)lungime * latime; }
    long long perimetru() { return 2LL * (lungime + latime); }
    bool esteAtrat() { return lungime == latime; }
};
`,
    python: `class Dreptunghi:
    def __init__(self, l, w):
        self.__lungime = l
        self.__latime = w
    def getLungime(self):
        return self.__lungime
    def getLatime(self):
        return self.__latime
    def setLungime(self, l):
        self.__lungime = l
    def setLatime(self, w):
        self.__latime = w
    def arie(self):
        return self.__lungime * self.__latime
    def perimetru(self):
        return 2 * (self.__lungime + self.__latime)
    def esteAtrat(self):
        return self.__lungime == self.__latime
`,
  },
  tests: [
    "3\nNEW 5 3\nARIE\nPERIMETRU",
    "2\nNEW 4 4\nPATRAT",
    "5\nNEW 2 2\nPATRAT\nSETW 7\nPATRAT\nGET",
    "3\nNEW 1000000000 1000000000\nARIE\nPERIMETRU",
  ],
  testLabels: [
    "constructie + arie/perimetru (uz de baza)",
    "esteAtrat pe caz adevarat",
    "setteri schimba starea + esteAtrat devine fals",
    "valori mari (verifica tipul folosit pentru arie)",
  ],
});

// ---------------- 2. Vector2D ----------------
problems.push({
  slug: "oop-vector2d",
  chapterId: CH_SIMPLE,
  subcategoryId: "incapsulare-si-constructori",
  title: "Clasa Vector2D",
  difficulty: "easy",
  tags: ["oop", "clasa", "vector", "geometrie"],
  statement:
    "Scrieti o clasa Vector2D care memoreaza doua coordonate reale x si y, cu urmatoarele functionalitati:\n" +
    "- constructor cu doi parametri: x, y\n" +
    "- getX() si getY()\n" +
    "- modul() - returneaza lungimea vectorului (radical(x*x+y*y))\n" +
    "- aduna(Vector2D alt) - returneaza un NOU obiect Vector2D reprezentand suma dintre vectorul curent si alt, FARA sa modifice vectorul curent\n" +
    "- inmultesteScalar(double k) - returneaza un NOU obiect Vector2D reprezentand vectorul curent inmultit cu scalarul k, FARA sa modifice vectorul curent\n" +
    "- egal(Vector2D alt) - returneaza adevarat daca cele doua vectoare au aceleasi coordonate",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "Coordonatele sunt numere reale, alese astfel incat rezultatele sa fie exacte pana la 2 zecimale.",
  hints: "aduna si inmultesteScalar NU trebuie sa modifice obiectul curent - trebuie sa returneze un vector nou.",
  explanation: "Cea mai frecventa greseala e ca aduna()/inmultesteScalar() modifica obiectul curent in loc sa returneze un obiect nou; testele verifica explicit ca vectorul original ramane neschimbat dupa apel.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    cout << fixed << setprecision(2);
    int T;
    cin >> T;
    Vector2D* v = nullptr;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "NEW") {
            double x, y; cin >> x >> y;
            if (v) delete v;
            v = new Vector2D(x, y);
            cout << "OK\\n";
        } else if (cmd == "MODUL") {
            cout << v->modul() << "\\n";
        } else if (cmd == "ADD") {
            double x2, y2; cin >> x2 >> y2;
            Vector2D tmp(x2, y2);
            Vector2D r = v->aduna(tmp);
            cout << r.getX() << " " << r.getY() << "\\n";
        } else if (cmd == "SCALAR") {
            double k; cin >> k;
            Vector2D r = v->inmultesteScalar(k);
            cout << r.getX() << " " << r.getY() << "\\n";
        } else if (cmd == "EGAL") {
            double x2, y2; cin >> x2 >> y2;
            Vector2D tmp(x2, y2);
            cout << (v->egal(tmp) ? "DA" : "NU") << "\\n";
        } else if (cmd == "GET") {
            cout << v->getX() << " " << v->getY() << "\\n";
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
    v = None
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "NEW":
            x = float(data[i]); y = float(data[i+1]); i += 2
            v = Vector2D(x, y)
            out.append("OK")
        elif cmd == "MODUL":
            out.append(f"{v.modul():.2f}")
        elif cmd == "ADD":
            x2 = float(data[i]); y2 = float(data[i+1]); i += 2
            r = v.aduna(Vector2D(x2, y2))
            out.append(f"{r.getX():.2f} {r.getY():.2f}")
        elif cmd == "SCALAR":
            k = float(data[i]); i += 1
            r = v.inmultesteScalar(k)
            out.append(f"{r.getX():.2f} {r.getY():.2f}")
        elif cmd == "EGAL":
            x2 = float(data[i]); y2 = float(data[i+1]); i += 2
            out.append("DA" if v.egal(Vector2D(x2, y2)) else "NU")
        elif cmd == "GET":
            out.append(f"{v.getX():.2f} {v.getY():.2f}")
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Vector2D {
private:
    double x, y;
public:
    Vector2D(double x = 0, double y = 0) : x(x), y(y) {}
    double getX() { return x; }
    double getY() { return y; }
    double modul() { return sqrt(x * x + y * y); }
    Vector2D aduna(Vector2D alt) { return Vector2D(x + alt.x, y + alt.y); }
    Vector2D inmultesteScalar(double k) { return Vector2D(x * k, y * k); }
    bool egal(Vector2D alt) { return fabs(x - alt.x) < 1e-9 && fabs(y - alt.y) < 1e-9; }
};
`,
    python: `import math

class Vector2D:
    def __init__(self, x=0.0, y=0.0):
        self.__x = x
        self.__y = y
    def getX(self):
        return self.__x
    def getY(self):
        return self.__y
    def modul(self):
        return math.sqrt(self.__x * self.__x + self.__y * self.__y)
    def aduna(self, alt):
        return Vector2D(self.__x + alt.getX(), self.__y + alt.getY())
    def inmultesteScalar(self, k):
        return Vector2D(self.__x * k, self.__y * k)
    def egal(self, alt):
        return abs(self.__x - alt.getX()) < 1e-9 and abs(self.__y - alt.getY()) < 1e-9
`,
  },
  tests: [
    "2\nNEW 3 4\nMODUL",
    "4\nNEW 1 2\nADD 3 4\nGET\nMODUL",
    "3\nNEW 2 3\nSCALAR 2\nGET",
    "4\nNEW 1 1\nEGAL 1 1\nEGAL 1 2\nGET",
  ],
  testLabels: [
    "constructie + modul (triunghi 3-4-5)",
    "aduna returneaza obiect nou, originalul ramane neschimbat",
    "inmultesteScalar returneaza obiect nou",
    "egal pe caz adevarat si fals",
  ],
});

// ---------------- 3. Elev (simplu) ----------------
problems.push({
  slug: "oop-elev-simplu",
  chapterId: CH_SIMPLE,
  subcategoryId: "incapsulare-si-constructori",
  title: "Clasa Elev - date de baza",
  difficulty: "easy",
  tags: ["oop", "clasa", "validare", "elev"],
  statement:
    "Scrieti o clasa Elev care memoreaza numele (sir de caractere fara spatii) si varsta (numar intreg) unui elev, cu urmatoarele functionalitati:\n" +
    "- constructor cu doi parametri: nume, varsta\n" +
    "- getNume() si getVarsta()\n" +
    "- setVarsta(int v) - actualizeaza varsta DOAR daca 6 <= v <= 25; in caz contrar varsta ramane neschimbata; metoda returneaza adevarat daca actualizarea a avut loc, fals altfel\n" +
    "- esteMajor() - returneaza adevarat daca varsta >= 18\n" +
    "- afiseaza() - returneaza un sir de forma \"nume (varsta ani)\", de exemplu \"Popescu (17 ani)\"",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "1 <= varsta initiala <= 100",
  hints: "setVarsta trebuie sa respinga valorile in afara intervalului [6,25] si sa pastreze vechea valoare.",
  explanation: "Introduce validarea in setter: metoda decide singura daca accepta sau respinge noua valoare, in loc sa faca update necontrolat.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Elev* e = nullptr;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "NEW") {
            string nume; int v;
            cin >> nume >> v;
            if (e) delete e;
            e = new Elev(nume, v);
            cout << "OK\\n";
        } else if (cmd == "MAJOR") {
            cout << (e->esteMajor() ? "DA" : "NU") << "\\n";
        } else if (cmd == "SETV") {
            int v; cin >> v;
            bool ok = e->setVarsta(v);
            cout << (ok ? 1 : 0) << " " << e->getVarsta() << "\\n";
        } else if (cmd == "AFISEAZA") {
            cout << e->afiseaza() << "\\n";
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
    e = None
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "NEW":
            nume = data[i]; v = int(data[i+1]); i += 2
            e = Elev(nume, v)
            out.append("OK")
        elif cmd == "MAJOR":
            out.append("DA" if e.esteMajor() else "NU")
        elif cmd == "SETV":
            v = int(data[i]); i += 1
            ok = e.setVarsta(v)
            out.append(f"{1 if ok else 0} {e.getVarsta()}")
        elif cmd == "AFISEAZA":
            out.append(e.afiseaza())
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Elev {
private:
    string nume;
    int varsta;
public:
    Elev(string n, int v) : nume(n), varsta(v) {}
    string getNume() { return nume; }
    int getVarsta() { return varsta; }
    bool setVarsta(int v) {
        if (v < 6 || v > 25) return false;
        varsta = v;
        return true;
    }
    bool esteMajor() { return varsta >= 18; }
    string afiseaza() { return nume + " (" + to_string(varsta) + " ani)"; }
};
`,
    python: `class Elev:
    def __init__(self, nume, varsta):
        self.__nume = nume
        self.__varsta = varsta
    def getNume(self):
        return self.__nume
    def getVarsta(self):
        return self.__varsta
    def setVarsta(self, v):
        if v < 6 or v > 25:
            return False
        self.__varsta = v
        return True
    def esteMajor(self):
        return self.__varsta >= 18
    def afiseaza(self):
        return f"{self.__nume} ({self.__varsta} ani)"
`,
  },
  tests: [
    "2\nNEW Popescu 20\nMAJOR",
    "2\nNEW Ionescu 15\nMAJOR",
    "3\nNEW Vasile 17\nSETV 18\nMAJOR",
    "2\nNEW Ana 17\nSETV 40",
    "2\nNEW Popescu 17\nAFISEAZA",
  ],
  testLabels: [
    "constructie + esteMajor (adevarat)",
    "esteMajor (fals)",
    "setVarsta valid schimba starea",
    "setVarsta invalid (in afara [6,25]) e respins, varsta ramane veche",
    "afiseaza formateaza corect sirul",
  ],
});

module.exports.problems1 = problems;
module.exports.LEVEL = LEVEL;
module.exports.SRC = SRC;
