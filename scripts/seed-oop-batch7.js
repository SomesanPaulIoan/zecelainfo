const { runMain } = require("./lib/oop-runner");

const LEVEL = "oop";
const SRC = "Zece la Info - OOP (probleme originale)";
const CH = "oop-compunere-clase";
const SUB = "compunere-obiecte";

const problems = [];

// ---------------- 17. Jucator + Echipa ----------------
problems.push({
  slug: "oop-echipa-jucatori",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Clasele Jucator si Echipa (compunere cu colectie)",
  difficulty: "hard",
  tags: ["oop", "clasa", "compunere", "colectie", "sport"],
  statement:
    "Scrieti DOUA clase:\n\n" +
    "1) Jucator - memoreaza numele (fara spatii) si numarul de goluri marcate:\n" +
    "- constructor(nume, numarGoluri)\n" +
    "- getNume(), getNumarGoluri()\n\n" +
    "2) Echipa - memoreaza numele echipei si o COLECTIE de obiecte Jucator (nu doar numere):\n" +
    "- constructor(nume)\n" +
    "- getNume()\n" +
    "- adaugaJucator(Jucator j) - adauga jucatorul in colectia interna\n" +
    "- totalGoluri() - suma golurilor tuturor jucatorilor din echipa\n" +
    "- golgheterul() - returneaza numele jucatorului cu cele mai multe goluri (la egalitate, primul adaugat); \"-\" daca echipa nu are niciun jucator\n" +
    "- numarJucatori()",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "0 <= numarGoluri <= 1000, cel mult 50 de jucatori intr-o echipa.",
  hints: "Echipa trebuie sa memoreze o colectie (vector/list) de obiecte Jucator, construite din afara si adaugate prin adaugaJucator.",
  explanation: "Prima problema din capitol in care clasa 'container' memoreaza o COLECTIE de obiecte compuse, nu doar 1-2 obiecte fixe - o punte naturala catre sistemele mari din capitolul urmator.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Echipa* e = nullptr;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "NEW") {
            string nume; cin >> nume;
            if (e) delete e;
            e = new Echipa(nume);
            cout << "OK\\n";
        } else if (cmd == "ADDJ") {
            string nume; int goluri;
            cin >> nume >> goluri;
            e->adaugaJucator(Jucator(nume, goluri));
            cout << "OK\\n";
        } else if (cmd == "TOTAL") {
            cout << e->totalGoluri() << "\\n";
        } else if (cmd == "GOLGHETER") {
            cout << e->golgheterul() << "\\n";
        } else if (cmd == "NRJ") {
            cout << e->numarJucatori() << "\\n";
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
            nume = data[i]; i += 1
            e = Echipa(nume)
            out.append("OK")
        elif cmd == "ADDJ":
            nume = data[i]; goluri = int(data[i+1]); i += 2
            e.adaugaJucator(Jucator(nume, goluri))
            out.append("OK")
        elif cmd == "TOTAL":
            out.append(str(e.totalGoluri()))
        elif cmd == "GOLGHETER":
            out.append(str(e.golgheterul()))
        elif cmd == "NRJ":
            out.append(str(e.numarJucatori()))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Jucator {
private:
    string nume;
    int numarGoluri;
public:
    Jucator(string n = "", int g = 0) : nume(n), numarGoluri(g) {}
    string getNume() { return nume; }
    int getNumarGoluri() { return numarGoluri; }
};

class Echipa {
private:
    string nume;
    vector<Jucator> jucatori;
public:
    Echipa(string n) : nume(n) {}
    string getNume() { return nume; }
    void adaugaJucator(Jucator j) { jucatori.push_back(j); }
    int totalGoluri() {
        int s = 0;
        for (auto& j : jucatori) s += j.getNumarGoluri();
        return s;
    }
    string golgheterul() {
        if (jucatori.empty()) return "-";
        int best = 0;
        for (int i = 1; i < (int)jucatori.size(); i++)
            if (jucatori[i].getNumarGoluri() > jucatori[best].getNumarGoluri()) best = i;
        return jucatori[best].getNume();
    }
    int numarJucatori() { return jucatori.size(); }
};
`,
    python: `class Jucator:
    def __init__(self, nume="", numarGoluri=0):
        self.__nume = nume
        self.__numarGoluri = numarGoluri
    def getNume(self):
        return self.__nume
    def getNumarGoluri(self):
        return self.__numarGoluri

class Echipa:
    def __init__(self, nume):
        self.__nume = nume
        self.__jucatori = []
    def getNume(self):
        return self.__nume
    def adaugaJucator(self, j):
        self.__jucatori.append(j)
    def totalGoluri(self):
        return sum(j.getNumarGoluri() for j in self.__jucatori)
    def golgheterul(self):
        if not self.__jucatori:
            return "-"
        best = self.__jucatori[0]
        for j in self.__jucatori[1:]:
            if j.getNumarGoluri() > best.getNumarGoluri():
                best = j
        return best.getNume()
    def numarJucatori(self):
        return len(self.__jucatori)
`,
  },
  tests: [
    "4\nNEW FC-Steaua\nADDJ Popescu 5\nADDJ Ionescu 3\nTOTAL",
    "4\nNEW FC-Steaua\nADDJ Popescu 5\nADDJ Ionescu 8\nGOLGHETER",
    "2\nNEW FCX\nGOLGHETER",
    "3\nNEW FCX\nADDJ A 4\nNRJ",
    "5\nNEW FCX\nADDJ A 3\nADDJ B 3\nGOLGHETER\nTOTAL",
  ],
  testLabels: [
    "adaugare jucatori + totalGoluri agregat",
    "golgheterul alege jucatorul cu cele mai multe goluri",
    "golgheterul pe echipa fara jucatori (-)",
    "numarJucatori de baza",
    "golgheterul la egalitate - primul adaugat castiga",
  ],
});

// ---------------- 18. Ora + Eveniment ----------------
problems.push({
  slug: "oop-eveniment-ora",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Clasele Ora si Eveniment (compunere, suprapunere de intervale)",
  difficulty: "hard",
  tags: ["oop", "clasa", "compunere", "timp", "interval"],
  statement:
    "Scrieti DOUA clase:\n\n" +
    "1) Ora - memoreaza o ora din zi (ore, minute):\n" +
    "- constructor(ore, minute)\n" +
    "- getOre(), getMinute()\n" +
    "- inMinuteTotale() - returneaza ore*60+minute\n\n" +
    "2) Eveniment - memoreaza un titlu (fara spatii) si un interval de timp, retinut ca DOUA obiecte Ora (inceput si sfarsit, presupuse in aceeasi zi, sfarsit dupa inceput):\n" +
    "- constructor(titlu, oreInceput, minInceput, oreSfarsit, minSfarsit) - construieste intern cele doua obiecte Ora\n" +
    "- getTitlu()\n" +
    "- getInceput(), getSfarsit() - returneaza obiectele Ora memorate intern\n" +
    "- durataMinute() - returneaza durata evenimentului in minute (delegare catre inMinuteTotale ale celor doua Ora)\n" +
    "- seSuprapune(Eveniment alt) - returneaza adevarat daca intervalele [inceput,sfarsit) ale celor doua evenimente se suprapun (un eveniment care incepe exact cand celalalt se termina NU se considera suprapunere)",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "0 <= ore <= 23, 0 <= minute <= 59, sfarsitul e strict dupa inceput.",
  hints: "Comparati folosind inMinuteTotale() in loc sa comparati ore si minute separat.",
  explanation: "Al doilea exercitiu de compunere cu doua obiecte de acelasi tip (ca DreptunghiCP+Punct), dar aici testeaza si un algoritm clasic: verificarea suprapunerii a doua intervale, cu limitele tratate corect (interval inchis la stanga, deschis la dreapta).",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Eveniment* e = nullptr;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "NEW") {
            string titlu; int oi, mi, os, ms;
            cin >> titlu >> oi >> mi >> os >> ms;
            if (e) delete e;
            e = new Eveniment(titlu, oi, mi, os, ms);
            cout << "OK\\n";
        } else if (cmd == "DURATA") {
            cout << e->durataMinute() << "\\n";
        } else if (cmd == "INCEPUT") {
            Ora o = e->getInceput();
            cout << o.getOre() << " " << o.getMinute() << "\\n";
        } else if (cmd == "SUPRAPUNE") {
            string titlu; int oi, mi, os, ms;
            cin >> titlu >> oi >> mi >> os >> ms;
            Eveniment alt(titlu, oi, mi, os, ms);
            cout << (e->seSuprapune(alt) ? "DA" : "NU") << "\\n";
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
            titlu = data[i]; oi = int(data[i+1]); mi = int(data[i+2]); os = int(data[i+3]); ms = int(data[i+4]); i += 5
            e = Eveniment(titlu, oi, mi, os, ms)
            out.append("OK")
        elif cmd == "DURATA":
            out.append(str(e.durataMinute()))
        elif cmd == "INCEPUT":
            o = e.getInceput()
            out.append(f"{o.getOre()} {o.getMinute()}")
        elif cmd == "SUPRAPUNE":
            titlu = data[i]; oi = int(data[i+1]); mi = int(data[i+2]); os = int(data[i+3]); ms = int(data[i+4]); i += 5
            alt = Eveniment(titlu, oi, mi, os, ms)
            out.append("DA" if e.seSuprapune(alt) else "NU")
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Ora {
private:
    int ore, minute;
public:
    Ora(int o = 0, int m = 0) : ore(o), minute(m) {}
    int getOre() { return ore; }
    int getMinute() { return minute; }
    int inMinuteTotale() { return ore * 60 + minute; }
};

class Eveniment {
private:
    string titlu;
    Ora inceput, sfarsit;
public:
    Eveniment(string t, int oi, int mi, int os, int ms)
        : titlu(t), inceput(oi, mi), sfarsit(os, ms) {}
    string getTitlu() { return titlu; }
    Ora getInceput() { return inceput; }
    Ora getSfarsit() { return sfarsit; }
    int durataMinute() { return sfarsit.inMinuteTotale() - inceput.inMinuteTotale(); }
    bool seSuprapune(Eveniment alt) {
        bool faraSuprapunere = sfarsit.inMinuteTotale() <= alt.inceput.inMinuteTotale()
            || alt.sfarsit.inMinuteTotale() <= inceput.inMinuteTotale();
        return !faraSuprapunere;
    }
};
`,
    python: `class Ora:
    def __init__(self, ore=0, minute=0):
        self.__ore = ore
        self.__minute = minute
    def getOre(self):
        return self.__ore
    def getMinute(self):
        return self.__minute
    def inMinuteTotale(self):
        return self.__ore * 60 + self.__minute

class Eveniment:
    def __init__(self, titlu, oi, mi, os, ms):
        self.__titlu = titlu
        self.__inceput = Ora(oi, mi)
        self.__sfarsit = Ora(os, ms)
    def getTitlu(self):
        return self.__titlu
    def getInceput(self):
        return self.__inceput
    def getSfarsit(self):
        return self.__sfarsit
    def durataMinute(self):
        return self.__sfarsit.inMinuteTotale() - self.__inceput.inMinuteTotale()
    def seSuprapune(self, alt):
        fara_suprapunere = (self.__sfarsit.inMinuteTotale() <= alt.getInceput().inMinuteTotale()
                             or alt.getSfarsit().inMinuteTotale() <= self.__inceput.inMinuteTotale())
        return not fara_suprapunere
`,
  },
  tests: [
    "2\nNEW Curs 9 0 10 30\nDURATA",
    "2\nNEW Curs 9 0 10 30\nINCEPUT",
    "2\nNEW Curs 9 0 10 30\nSUPRAPUNE Altul 10 0 11 0",
    "2\nNEW Curs 9 0 10 30\nSUPRAPUNE Altul 10 30 11 0",
    "2\nNEW Curs 9 0 10 30\nSUPRAPUNE Altul 8 0 8 30",
  ],
  testLabels: [
    "constructie + durataMinute (compunere de baza)",
    "getInceput returneaza obiectul Ora compus (lant de getteri)",
    "seSuprapune - intervale care se intersecteaza",
    "seSuprapune - limita (se ating exact, nu se considera suprapunere)",
    "seSuprapune - intervale complet separate",
  ],
});

module.exports.problems7 = problems;

if (require.main === module) {
  runMain(problems, LEVEL, SRC);
}
