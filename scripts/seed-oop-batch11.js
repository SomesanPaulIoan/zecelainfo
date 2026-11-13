const { runMain } = require("./lib/oop-runner");

const LEVEL = "oop";
const SRC = "Zece la Info - OOP (probleme originale)";
const CH = "oop-compunere-clase";
const SUB = "compunere-obiecte";

const problems = [];

// ---------------- 30. Autor + Carte ----------------
problems.push({
  slug: "oop-carte-autor",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Clasele Autor si Carte (compunere, comparatie intre instante)",
  difficulty: "hard",
  tags: ["oop", "clasa", "compunere", "carte"],
  statement:
    "Scrieti DOUA clase:\n\n" +
    "1) Autor - nume (fara spatii), tara (fara spatii):\n" +
    "- constructor(nume, tara); getNume(); getTara()\n\n" +
    "2) Carte - titlu, anAparitie, si un obiect Autor compus (nu doar numele autorului ca sir):\n" +
    "- constructor(titlu, anAparitie, numeAutor, taraAutor) - construieste intern obiectul Autor\n" +
    "- getTitlu(), getAnAparitie()\n" +
    "- getAutor() - returneaza obiectul Autor memorat intern\n" +
    "- autorDinAceeasiTara(Carte alta) - returneaza adevarat daca autorul acestei carti si autorul cartii alta sunt din aceeasi tara",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "1000 <= anAparitie <= 2026",
  hints: "autorDinAceeasiTara trebuie sa compare campul tara al celor DOUA obiecte Autor (al lui this si al lui alta), nu doar sa citeasca un singur camp.",
  explanation: "Spre deosebire de Angajat+Data (unde se delega un calcul catre obiectul compus), aici se COMPARA acelasi camp compus intre DOUA instante diferite ale clasei exterioare.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Carte* c = nullptr;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "NEW") {
            string titlu; int an; string numeA, taraA;
            cin >> titlu >> an >> numeA >> taraA;
            if (c) delete c;
            c = new Carte(titlu, an, numeA, taraA);
            cout << "OK\\n";
        } else if (cmd == "AUTOR") {
            Autor a = c->getAutor();
            cout << a.getNume() << " " << a.getTara() << "\\n";
        } else if (cmd == "ACEEASITARA") {
            string titlu; int an; string numeA, taraA;
            cin >> titlu >> an >> numeA >> taraA;
            Carte alta(titlu, an, numeA, taraA);
            cout << (c->autorDinAceeasiTara(alta) ? "DA" : "NU") << "\\n";
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
            titlu = data[i]; an = int(data[i+1]); numeA = data[i+2]; taraA = data[i+3]; i += 4
            c = Carte(titlu, an, numeA, taraA)
            out.append("OK")
        elif cmd == "AUTOR":
            a = c.getAutor()
            out.append(f"{a.getNume()} {a.getTara()}")
        elif cmd == "ACEEASITARA":
            titlu = data[i]; an = int(data[i+1]); numeA = data[i+2]; taraA = data[i+3]; i += 4
            alta = Carte(titlu, an, numeA, taraA)
            out.append("DA" if c.autorDinAceeasiTara(alta) else "NU")
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Autor {
private:
    string nume, tara;
public:
    Autor(string n = "", string t = "") : nume(n), tara(t) {}
    string getNume() { return nume; }
    string getTara() { return tara; }
};

class Carte {
private:
    string titlu;
    int anAparitie;
    Autor autor;
public:
    Carte(string t, int an, string numeAutor, string taraAutor)
        : titlu(t), anAparitie(an), autor(numeAutor, taraAutor) {}
    string getTitlu() { return titlu; }
    int getAnAparitie() { return anAparitie; }
    Autor getAutor() { return autor; }
    bool autorDinAceeasiTara(Carte alta) {
        return autor.getTara() == alta.autor.getTara();
    }
};
`,
    python: `class Autor:
    def __init__(self, nume="", tara=""):
        self.__nume = nume
        self.__tara = tara
    def getNume(self):
        return self.__nume
    def getTara(self):
        return self.__tara

class Carte:
    def __init__(self, titlu, anAparitie, numeAutor, taraAutor):
        self.__titlu = titlu
        self.__anAparitie = anAparitie
        self.__autor = Autor(numeAutor, taraAutor)
    def getTitlu(self):
        return self.__titlu
    def getAnAparitie(self):
        return self.__anAparitie
    def getAutor(self):
        return self.__autor
    def autorDinAceeasiTara(self, alta):
        return self.__autor.getTara() == alta.getAutor().getTara()
`,
  },
  tests: [
    "2\nNEW Ion 1980 Popescu Romania\nAUTOR",
    "2\nNEW Ion 1980 Popescu Romania\nACEEASITARA Baltagul 1970 Sadoveanu Romania",
    "2\nNEW Ion 1980 Popescu Romania\nACEEASITARA Test 1970 Autor2 Franta",
    "3\nNEW Ion 1980 Popescu Romania\nAUTOR\nACEEASITARA Ion 1980 Popescu Romania",
  ],
  testLabels: [
    "constructie + getAutor returneaza obiectul compus",
    "autorDinAceeasiTara - caz adevarat",
    "autorDinAceeasiTara - caz fals",
    "autorDinAceeasiTara comparata cu o carte identica",
  ],
});

// ---------------- 31. Motor + Masina ----------------
problems.push({
  slug: "oop-masina-motor",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Clasele Motor si Masina (compunere, delegare de actiuni)",
  difficulty: "hard",
  tags: ["oop", "clasa", "compunere", "masina", "delegare"],
  statement:
    "Scrieti DOUA clase:\n\n" +
    "1) Motor - putere (cai putere, intreg) si starea pornit/oprit (initial OPRIT):\n" +
    "- constructor(putere); getPutere()\n" +
    "- porneste() - seteaza starea pe pornit\n" +
    "- opreste() - seteaza starea pe oprit\n" +
    "- esteAprins() - returneaza starea curenta\n\n" +
    "2) Masina - marca, si un obiect Motor compus, plus kilometrii parcursi (initial 0):\n" +
    "- constructor(marca, putere) - construieste intern obiectul Motor\n" +
    "- getMarca()\n" +
    "- porneste() - DELEGA catre motor.porneste()\n" +
    "- opreste() - DELEGA catre motor.opreste()\n" +
    "- esteAprinsa() - DELEGA catre motor.esteAprins()\n" +
    "- ruleaza(int km) - DOAR daca masina e aprinsa (esteAprinsa()==adevarat), aduna km la kilometrii parcursi si returneaza adevarat; altfel returneaza fals fara nicio modificare\n" +
    "- getKmParcursi()",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "1 <= putere <= 1000, 0 <= km <= 1.000.000",
  hints: "Masina NU trebuie sa memoreze propriul ei camp 'pornit' - starea reala traieste in obiectul Motor, iar Masina doar delega catre el.",
  explanation: "Introduce delegarea de ACTIUNI (metode care schimba starea, nu doar care citesc o valoare) catre obiectul compus, plus o metoda proprie (ruleaza) a carei logica este conditionata de starea obiectului compus.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Masina* m = nullptr;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "NEW") {
            string marca; int putere;
            cin >> marca >> putere;
            if (m) delete m;
            m = new Masina(marca, putere);
            cout << "OK\\n";
        } else if (cmd == "PORNESTE") {
            m->porneste();
            cout << "OK\\n";
        } else if (cmd == "OPRESTE") {
            m->opreste();
            cout << "OK\\n";
        } else if (cmd == "APRINSA") {
            cout << (m->esteAprinsa() ? "DA" : "NU") << "\\n";
        } else if (cmd == "RULEAZA") {
            long long km; cin >> km;
            cout << (m->ruleaza(km) ? 1 : 0) << "\\n";
        } else if (cmd == "KM") {
            cout << m->getKmParcursi() << "\\n";
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
    m = None
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "NEW":
            marca = data[i]; putere = int(data[i+1]); i += 2
            m = Masina(marca, putere)
            out.append("OK")
        elif cmd == "PORNESTE":
            m.porneste()
            out.append("OK")
        elif cmd == "OPRESTE":
            m.opreste()
            out.append("OK")
        elif cmd == "APRINSA":
            out.append("DA" if m.esteAprinsa() else "NU")
        elif cmd == "RULEAZA":
            km = int(data[i]); i += 1
            out.append("1" if m.ruleaza(km) else "0")
        elif cmd == "KM":
            out.append(str(m.getKmParcursi()))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Motor {
private:
    int putere;
    bool pornit;
public:
    Motor(int p) : putere(p), pornit(false) {}
    int getPutere() { return putere; }
    void porneste() { pornit = true; }
    void opreste() { pornit = false; }
    bool esteAprins() { return pornit; }
};

class Masina {
private:
    string marca;
    Motor motor;
    long long kmParcursi;
public:
    Masina(string m, int putere) : marca(m), motor(putere), kmParcursi(0) {}
    string getMarca() { return marca; }
    void porneste() { motor.porneste(); }
    void opreste() { motor.opreste(); }
    bool esteAprinsa() { return motor.esteAprins(); }
    bool ruleaza(long long km) {
        if (!esteAprinsa()) return false;
        kmParcursi += km;
        return true;
    }
    long long getKmParcursi() { return kmParcursi; }
};
`,
    python: `class Motor:
    def __init__(self, putere):
        self.__putere = putere
        self.__pornit = False
    def getPutere(self):
        return self.__putere
    def porneste(self):
        self.__pornit = True
    def opreste(self):
        self.__pornit = False
    def esteAprins(self):
        return self.__pornit

class Masina:
    def __init__(self, marca, putere):
        self.__marca = marca
        self.__motor = Motor(putere)
        self.__kmParcursi = 0
    def getMarca(self):
        return self.__marca
    def porneste(self):
        self.__motor.porneste()
    def opreste(self):
        self.__motor.opreste()
    def esteAprinsa(self):
        return self.__motor.esteAprins()
    def ruleaza(self, km):
        if not self.esteAprinsa():
            return False
        self.__kmParcursi += km
        return True
    def getKmParcursi(self):
        return self.__kmParcursi
`,
  },
  tests: [
    "3\nNEW Dacia 90\nAPRINSA\nKM",
    "4\nNEW Dacia 90\nPORNESTE\nAPRINSA\nRULEAZA 100",
    "3\nNEW Dacia 90\nRULEAZA 50\nKM",
    "6\nNEW Dacia 90\nPORNESTE\nRULEAZA 50\nOPRESTE\nRULEAZA 30\nKM",
  ],
  testLabels: [
    "stare initiala - motor oprit, 0 km",
    "porneste + aprinsa (delegare de query) + ruleaza reuseste",
    "ruleaza esueaza cand motorul e oprit",
    "porneste, ruleaza, opreste, ruleaza din nou - al doilea ruleaza esueaza",
  ],
});

// ---------------- 32. Abonament + Cont ----------------
problems.push({
  slug: "oop-cont-abonament",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Clasele Abonament si Cont (compunere, conditie combinata)",
  difficulty: "hard",
  tags: ["oop", "clasa", "compunere", "abonament"],
  statement:
    "Scrieti DOUA clase:\n\n" +
    "1) Abonament - tip (\"Basic\" sau \"Premium\") si zileRamase (intreg):\n" +
    "- constructor(tip, zileRamase); getTip(); getZileRamase()\n" +
    "- esteActiv() - returneaza adevarat daca zileRamase > 0\n\n" +
    "2) Cont - nume, si un obiect Abonament compus:\n" +
    "- constructor(nume, tipAbonament, zileRamase) - construieste intern obiectul Abonament\n" +
    "- getNume()\n" +
    "- poateAccesaPremium() - returneaza adevarat DOAR daca abonamentul e de tip \"Premium\" SI este activ (ambele conditii, delegate catre obiectul Abonament)\n" +
    "- zileRamaseAbonament() - delegare catre abonament.getZileRamase()",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "0 <= zileRamase <= 10000",
  hints: "poateAccesaPremium combina DOUA conditii pe acelasi obiect compus (tip si esteActiv) cu SI logic.",
  explanation: "Al treilea exercitiu de delegare din capitol: aici metoda din clasa exterioara combina mai multe interogari pe obiectul compus, in loc sa delege o singura metoda direct.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Cont* c = nullptr;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "NEW") {
            string nume, tip; int zile;
            cin >> nume >> tip >> zile;
            if (c) delete c;
            c = new Cont(nume, tip, zile);
            cout << "OK\\n";
        } else if (cmd == "POATEPREMIUM") {
            cout << (c->poateAccesaPremium() ? "DA" : "NU") << "\\n";
        } else if (cmd == "ZILE") {
            cout << c->zileRamaseAbonament() << "\\n";
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
            nume = data[i]; tip = data[i+1]; zile = int(data[i+2]); i += 3
            c = Cont(nume, tip, zile)
            out.append("OK")
        elif cmd == "POATEPREMIUM":
            out.append("DA" if c.poateAccesaPremium() else "NU")
        elif cmd == "ZILE":
            out.append(str(c.zileRamaseAbonament()))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Abonament {
private:
    string tip;
    int zileRamase;
public:
    Abonament(string t = "Basic", int z = 0) : tip(t), zileRamase(z) {}
    string getTip() { return tip; }
    int getZileRamase() { return zileRamase; }
    bool esteActiv() { return zileRamase > 0; }
};

class Cont {
private:
    string nume;
    Abonament abonament;
public:
    Cont(string n, string tip, int zile) : nume(n), abonament(tip, zile) {}
    string getNume() { return nume; }
    bool poateAccesaPremium() { return abonament.getTip() == "Premium" && abonament.esteActiv(); }
    int zileRamaseAbonament() { return abonament.getZileRamase(); }
};
`,
    python: `class Abonament:
    def __init__(self, tip="Basic", zileRamase=0):
        self.__tip = tip
        self.__zileRamase = zileRamase
    def getTip(self):
        return self.__tip
    def getZileRamase(self):
        return self.__zileRamase
    def esteActiv(self):
        return self.__zileRamase > 0

class Cont:
    def __init__(self, nume, tip, zile):
        self.__nume = nume
        self.__abonament = Abonament(tip, zile)
    def getNume(self):
        return self.__nume
    def poateAccesaPremium(self):
        return self.__abonament.getTip() == "Premium" and self.__abonament.esteActiv()
    def zileRamaseAbonament(self):
        return self.__abonament.getZileRamase()
`,
  },
  tests: [
    "2\nNEW Popescu Premium 10\nPOATEPREMIUM",
    "2\nNEW Popescu Premium 0\nPOATEPREMIUM",
    "2\nNEW Popescu Basic 10\nPOATEPREMIUM",
    "2\nNEW Popescu Basic 5\nZILE",
  ],
  testLabels: [
    "abonament premium activ - acces permis",
    "abonament premium expirat (0 zile) - acces refuzat",
    "abonament basic - acces refuzat indiferent de zile",
    "zileRamaseAbonament delegare simpla",
  ],
});

// ---------------- 33. Culoare + Steag ----------------
problems.push({
  slug: "oop-steag-culoare",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Clasele Culoare si Steag (compunere cu 3 obiecte fixe)",
  difficulty: "hard",
  tags: ["oop", "clasa", "compunere", "steag"],
  statement:
    "Scrieti DOUA clase:\n\n" +
    "1) Culoare - nume (fara spatii):\n" +
    "- constructor(nume); getNume()\n\n" +
    "2) Steag - reprezinta un steag tricolor, memorand TREI obiecte Culoare (nu 3 siruri de caractere):\n" +
    "- constructor(nume1, nume2, nume3) - construieste intern cele trei obiecte Culoare\n" +
    "- getCuloare(int index) - returneaza obiectul Culoare de pe pozitia index (0, 1 sau 2)\n" +
    "- areCuloare(nume) - returneaza adevarat daca ORICARE dintre cele trei culori are acel nume\n" +
    "- descriere() - returneaza un sir de forma \"nume1-nume2-nume3\"",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "index este intotdeauna 0, 1 sau 2.",
  hints: "Steag trebuie sa memoreze exact 3 campuri de tip Culoare (nu un vector) - de exemplu culoare1, culoare2, culoare3.",
  explanation: "Ultimul exercitiu de compunere din capitol: 3 obiecte compuse de acelasi tip, accesibile printr-un index (spre deosebire de DreptunghiCP care avea exact 2, cu nume fixe).",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Steag* s = nullptr;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "NEW") {
            string n1, n2, n3;
            cin >> n1 >> n2 >> n3;
            if (s) delete s;
            s = new Steag(n1, n2, n3);
            cout << "OK\\n";
        } else if (cmd == "GET") {
            int idx; cin >> idx;
            Culoare c = s->getCuloare(idx);
            cout << c.getNume() << "\\n";
        } else if (cmd == "ARE") {
            string nume; cin >> nume;
            cout << (s->areCuloare(nume) ? "DA" : "NU") << "\\n";
        } else if (cmd == "DESCRIERE") {
            cout << s->descriere() << "\\n";
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
    s = None
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "NEW":
            n1 = data[i]; n2 = data[i+1]; n3 = data[i+2]; i += 3
            s = Steag(n1, n2, n3)
            out.append("OK")
        elif cmd == "GET":
            idx = int(data[i]); i += 1
            c = s.getCuloare(idx)
            out.append(c.getNume())
        elif cmd == "ARE":
            nume = data[i]; i += 1
            out.append("DA" if s.areCuloare(nume) else "NU")
        elif cmd == "DESCRIERE":
            out.append(s.descriere())
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Culoare {
private:
    string nume;
public:
    Culoare(string n = "") : nume(n) {}
    string getNume() { return nume; }
};

class Steag {
private:
    Culoare culoare1, culoare2, culoare3;
public:
    Steag(string n1, string n2, string n3) : culoare1(n1), culoare2(n2), culoare3(n3) {}
    Culoare getCuloare(int index) {
        if (index == 0) return culoare1;
        if (index == 1) return culoare2;
        return culoare3;
    }
    bool areCuloare(string nume) {
        return culoare1.getNume() == nume || culoare2.getNume() == nume || culoare3.getNume() == nume;
    }
    string descriere() {
        return culoare1.getNume() + "-" + culoare2.getNume() + "-" + culoare3.getNume();
    }
};
`,
    python: `class Culoare:
    def __init__(self, nume=""):
        self.__nume = nume
    def getNume(self):
        return self.__nume

class Steag:
    def __init__(self, n1, n2, n3):
        self.__culoare1 = Culoare(n1)
        self.__culoare2 = Culoare(n2)
        self.__culoare3 = Culoare(n3)
    def getCuloare(self, index):
        if index == 0:
            return self.__culoare1
        if index == 1:
            return self.__culoare2
        return self.__culoare3
    def areCuloare(self, nume):
        return (self.__culoare1.getNume() == nume or self.__culoare2.getNume() == nume
                or self.__culoare3.getNume() == nume)
    def descriere(self):
        return f"{self.__culoare1.getNume()}-{self.__culoare2.getNume()}-{self.__culoare3.getNume()}"
`,
  },
  tests: [
    "2\nNEW Rosu Galben Albastru\nDESCRIERE",
    "2\nNEW Rosu Galben Albastru\nGET 1",
    "2\nNEW Rosu Galben Albastru\nARE Galben",
    "2\nNEW Rosu Galben Albastru\nARE Verde",
    "2\nNEW Rosu Galben Albastru\nGET 2",
  ],
  testLabels: [
    "descriere concateneaza toate cele 3 culori in ordine",
    "getCuloare pe pozitia din mijloc",
    "areCuloare - caz adevarat",
    "areCuloare - caz fals",
    "getCuloare pe ultima pozitie (limita)",
  ],
});

module.exports.problems11 = problems;

if (require.main === module) {
  runMain(problems, LEVEL, SRC);
}
