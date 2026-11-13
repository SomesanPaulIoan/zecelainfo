const { runMain } = require("./lib/oop-runner");

const LEVEL = "oop";
const SRC = "Zece la Info - OOP (probleme originale)";
const CH = "oop-compunere-clase";
const SUB = "compunere-obiecte";

const problems = [];

// ---------------- 7. Data + Angajat ----------------
problems.push({
  slug: "oop-angajat-data",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Clasele Data si Angajat (compunere)",
  difficulty: "hard",
  tags: ["oop", "clasa", "compunere", "composition", "data"],
  statement:
    "Scrieti DOUA clase:\n\n" +
    "1) Clasa Data, care memoreaza o data calendaristica (zi, luna, an - toate numere intregi), cu:\n" +
    "- constructor cu trei parametri: zi, luna, an\n" +
    "- getZi(), getLuna(), getAn()\n" +
    "- diferentaAni(Data altaData) - returneaza numarul de ani IMPLINITI intre data curenta si altaData (presupusa mai tarzie sau egala); un an nu se considera implinit daca luna+ziua din altaData nu au ajuns inca la luna+ziua din data curenta (ex: intre 10.05.2015 si 09.05.2020 sunt 4 ani impliniti, nu 5)\n\n" +
    "2) Clasa Angajat, care memoreaza numele (fara spatii), salariul (numar intreg) si data angajarii - data angajarii trebuie memorata ca un OBIECT Data (nu ca 3 campuri separate), cu:\n" +
    "- constructor cu 5 parametri: nume, salariu, zi, luna, an (ultimele 3 folosite pentru a construi obiectul Data intern)\n" +
    "- getNume(), getSalariu()\n" +
    "- getDataAngajarii() - returneaza obiectul Data memorat intern\n" +
    "- vechimeAni(Data dataCurenta) - returneaza vechimea in ani a angajatului, calculata prin delegare catre metoda diferentaAni a obiectului Data intern\n" +
    "- majoreazaSalariu(int procent) - creste salariul cu procent% (calcul in intregi, trunchiat), fara valoare de returnare",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "1 <= zi <= 31, 1 <= luna <= 12, an intreg pozitiv, 0 <= salariu <= 1.000.000.000, 0 <= procent <= 100",
  hints: "Angajat trebuie sa memoreze intern un obiect Data, si sa delegheze catre el pentru calculul vechimii (nu recalculati diferenta direct in Angajat din campuri separate).",
  explanation: "Exercitiu de compunere (composition): Angajat 'are un' Data. vechimeAni pe Angajat trebuie sa apeleze efectiv metoda diferentaAni de pe obiectul Data membru, nu sa duplice logica.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Angajat* a = nullptr;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "NEW") {
            string nume; long long sal; int zi, luna, an;
            cin >> nume >> sal >> zi >> luna >> an;
            if (a) delete a;
            a = new Angajat(nume, sal, zi, luna, an);
            cout << "OK\\n";
        } else if (cmd == "SALARIU") {
            cout << a->getSalariu() << "\\n";
        } else if (cmd == "DATAANGAJARE") {
            Data d = a->getDataAngajarii();
            cout << d.getZi() << " " << d.getLuna() << " " << d.getAn() << "\\n";
        } else if (cmd == "VECHIME") {
            int zi, luna, an; cin >> zi >> luna >> an;
            Data curent(zi, luna, an);
            cout << a->vechimeAni(curent) << "\\n";
        } else if (cmd == "MAJOREAZA") {
            int p; cin >> p;
            a->majoreazaSalariu(p);
            cout << a->getSalariu() << "\\n";
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
    a = None
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "NEW":
            nume = data[i]; sal = int(data[i+1]); zi = int(data[i+2]); luna = int(data[i+3]); an = int(data[i+4]); i += 5
            a = Angajat(nume, sal, zi, luna, an)
            out.append("OK")
        elif cmd == "SALARIU":
            out.append(str(a.getSalariu()))
        elif cmd == "DATAANGAJARE":
            d = a.getDataAngajarii()
            out.append(f"{d.getZi()} {d.getLuna()} {d.getAn()}")
        elif cmd == "VECHIME":
            zi = int(data[i]); luna = int(data[i+1]); an = int(data[i+2]); i += 3
            curent = Data(zi, luna, an)
            out.append(str(a.vechimeAni(curent)))
        elif cmd == "MAJOREAZA":
            p = int(data[i]); i += 1
            a.majoreazaSalariu(p)
            out.append(str(a.getSalariu()))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Data {
private:
    int zi, luna, an;
public:
    Data(int z = 1, int l = 1, int a = 1900) : zi(z), luna(l), an(a) {}
    int getZi() { return zi; }
    int getLuna() { return luna; }
    int getAn() { return an; }
    int diferentaAni(Data altaData) {
        int ani = altaData.an - an;
        if (altaData.luna < luna || (altaData.luna == luna && altaData.zi < zi)) ani--;
        return ani;
    }
};

class Angajat {
private:
    string nume;
    long long salariu;
    Data dataAngajarii;
public:
    Angajat(string n, long long s, int zi, int luna, int an)
        : nume(n), salariu(s), dataAngajarii(zi, luna, an) {}
    string getNume() { return nume; }
    long long getSalariu() { return salariu; }
    Data getDataAngajarii() { return dataAngajarii; }
    int vechimeAni(Data dataCurenta) { return dataAngajarii.diferentaAni(dataCurenta); }
    void majoreazaSalariu(int procent) { salariu = salariu + (salariu * procent) / 100; }
};
`,
    python: `class Data:
    def __init__(self, zi=1, luna=1, an=1900):
        self.__zi = zi
        self.__luna = luna
        self.__an = an
    def getZi(self):
        return self.__zi
    def getLuna(self):
        return self.__luna
    def getAn(self):
        return self.__an
    def diferentaAni(self, altaData):
        ani = altaData.getAn() - self.__an
        if altaData.getLuna() < self.__luna or (altaData.getLuna() == self.__luna and altaData.getZi() < self.__zi):
            ani -= 1
        return ani

class Angajat:
    def __init__(self, nume, salariu, zi, luna, an):
        self.__nume = nume
        self.__salariu = salariu
        self.__dataAngajarii = Data(zi, luna, an)
    def getNume(self):
        return self.__nume
    def getSalariu(self):
        return self.__salariu
    def getDataAngajarii(self):
        return self.__dataAngajarii
    def vechimeAni(self, dataCurenta):
        return self.__dataAngajarii.diferentaAni(dataCurenta)
    def majoreazaSalariu(self, procent):
        self.__salariu = self.__salariu + (self.__salariu * procent) // 100
`,
  },
  tests: [
    "3\nNEW Popescu 3000 10 5 2015\nSALARIU\nDATAANGAJARE",
    "2\nNEW Ionescu 2000 10 5 2015\nVECHIME 9 5 2020",
    "2\nNEW Vasile 2000 10 5 2015\nVECHIME 10 5 2020",
    "2\nNEW Ana 2000 1 1 2020\nMAJOREAZA 10",
    "4\nNEW Radu 1000 1 1 2020\nMAJOREAZA 50\nMAJOREAZA 50\nSALARIU",
  ],
  testLabels: [
    "constructie + salariu + getDataAngajarii (compunere de baza)",
    "vechimeAni cand aniversarea nu a fost inca atinsa (rotunjire in jos)",
    "vechimeAni exact la data aniversarii (limita)",
    "majoreazaSalariu calcul procentual",
    "majorari succesive - starea persista intre apeluri",
  ],
});

// ---------------- 8. Punct + DreptunghiP ----------------
problems.push({
  slug: "oop-dreptunghi-din-puncte",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Clasele Punct si DreptunghiCP (compunere)",
  difficulty: "hard",
  tags: ["oop", "clasa", "compunere", "geometrie", "punct"],
  statement:
    "Scrieti DOUA clase:\n\n" +
    "1) Clasa Punct, care memoreaza doua coordonate intregi x, y, cu:\n" +
    "- constructor cu doi parametri: x, y\n" +
    "- getX(), getY()\n\n" +
    "2) Clasa DreptunghiCP, care reprezinta un dreptunghi cu laturile paralele cu axele, definit prin coltul stanga-jos si coltul dreapta-sus - AMBELE memorate ca obiecte Punct (nu ca 4 numere separate), cu:\n" +
    "- constructor cu 4 parametri: x1, y1 (coltul stanga-jos), x2, y2 (coltul dreapta-sus), cu x1<=x2 si y1<=y2\n" +
    "- arie() - returneaza aria dreptunghiului\n" +
    "- perimetru() - returneaza perimetrul\n" +
    "- contine(Punct p) - returneaza adevarat daca punctul p se afla in interiorul dreptunghiului SAU pe marginea lui (limitele sunt incluse)",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "0 <= x1<=x2<=1.000.000, 0 <= y1<=y2<=1.000.000",
  hints: "DreptunghiCP trebuie sa memoreze doua obiecte Punct (coltul stanga-jos si coltul dreapta-sus), nu 4 int-uri separate.",
  explanation: "Al doilea exercitiu de compunere: DreptunghiCP 'are' doua obiecte Punct. contine() testeaza corectitudinea la limita (incluziv) si cazul degenerat (dreptunghi cu latime sau inaltime 0).",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    DreptunghiCP* d = nullptr;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "NEW") {
            long long x1, y1, x2, y2; cin >> x1 >> y1 >> x2 >> y2;
            if (d) delete d;
            d = new DreptunghiCP(x1, y1, x2, y2);
            cout << "OK\\n";
        } else if (cmd == "ARIE") {
            cout << d->arie() << "\\n";
        } else if (cmd == "PERIMETRU") {
            cout << d->perimetru() << "\\n";
        } else if (cmd == "CONTINE") {
            long long x, y; cin >> x >> y;
            Punct p(x, y);
            cout << (d->contine(p) ? "DA" : "NU") << "\\n";
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
            x1 = int(data[i]); y1 = int(data[i+1]); x2 = int(data[i+2]); y2 = int(data[i+3]); i += 4
            d = DreptunghiCP(x1, y1, x2, y2)
            out.append("OK")
        elif cmd == "ARIE":
            out.append(str(d.arie()))
        elif cmd == "PERIMETRU":
            out.append(str(d.perimetru()))
        elif cmd == "CONTINE":
            x = int(data[i]); y = int(data[i+1]); i += 2
            p = Punct(x, y)
            out.append("DA" if d.contine(p) else "NU")
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Punct {
private:
    long long x, y;
public:
    Punct(long long x = 0, long long y = 0) : x(x), y(y) {}
    long long getX() { return x; }
    long long getY() { return y; }
};

class DreptunghiCP {
private:
    Punct coltStgJos, coltDrSus;
public:
    DreptunghiCP(long long x1, long long y1, long long x2, long long y2)
        : coltStgJos(x1, y1), coltDrSus(x2, y2) {}
    long long arie() {
        return (coltDrSus.getX() - coltStgJos.getX()) * (coltDrSus.getY() - coltStgJos.getY());
    }
    long long perimetru() {
        return 2 * ((coltDrSus.getX() - coltStgJos.getX()) + (coltDrSus.getY() - coltStgJos.getY()));
    }
    bool contine(Punct p) {
        return p.getX() >= coltStgJos.getX() && p.getX() <= coltDrSus.getX()
            && p.getY() >= coltStgJos.getY() && p.getY() <= coltDrSus.getY();
    }
};
`,
    python: `class Punct:
    def __init__(self, x=0, y=0):
        self.__x = x
        self.__y = y
    def getX(self):
        return self.__x
    def getY(self):
        return self.__y

class DreptunghiCP:
    def __init__(self, x1, y1, x2, y2):
        self.__coltStgJos = Punct(x1, y1)
        self.__coltDrSus = Punct(x2, y2)
    def arie(self):
        return (self.__coltDrSus.getX() - self.__coltStgJos.getX()) * (self.__coltDrSus.getY() - self.__coltStgJos.getY())
    def perimetru(self):
        return 2 * ((self.__coltDrSus.getX() - self.__coltStgJos.getX()) + (self.__coltDrSus.getY() - self.__coltStgJos.getY()))
    def contine(self, p):
        return (self.__coltStgJos.getX() <= p.getX() <= self.__coltDrSus.getX()
                and self.__coltStgJos.getY() <= p.getY() <= self.__coltDrSus.getY())
`,
  },
  tests: [
    "3\nNEW 0 0 10 5\nARIE\nPERIMETRU",
    "2\nNEW 0 0 10 5\nCONTINE 5 3",
    "2\nNEW 0 0 10 5\nCONTINE 20 3",
    "5\nNEW 0 0 10 5\nCONTINE 0 0\nCONTINE 10 5\nCONTINE 0 5\nCONTINE 10 0",
    "4\nNEW 3 3 3 8\nARIE\nCONTINE 3 5\nCONTINE 4 5",
  ],
  testLabels: [
    "constructie prin doua puncte + arie/perimetru",
    "contine - punct strict in interior",
    "contine - punct in afara",
    "contine - toate cele 4 colturi (limita inclusiv)",
    "dreptunghi degenerat (latime 0, o linie verticala)",
  ],
});

module.exports.problems3 = problems;

if (require.main === module) {
  runMain(problems, LEVEL, SRC);
}
