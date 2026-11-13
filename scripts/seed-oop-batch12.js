const { runMain } = require("./lib/oop-runner");

const LEVEL = "oop";
const SRC = "Zece la Info - OOP (probleme originale)";
const CH = "oop-sisteme-mari";
const SUB = "sisteme-multi-clasa";

const problems = [];

// ---------------- 34. ReteaSociala (Utilizator + ReteaSociala) ----------------
problems.push({
  slug: "oop-retea-sociala",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Sistemul ReteaSociala (Utilizator + ReteaSociala)",
  difficulty: "facultate",
  tags: ["oop", "clasa", "sistem", "retea", "prietenie"],
  statement:
    "Scrieti DOUA clase:\n\n" +
    "1) Utilizator - nume (fara spatii):\n" +
    "- constructor(nume); getNume()\n\n" +
    "2) ReteaSociala - orchestreaza utilizatorii si relatiile de prietenie (bidirectionale) dintre ei:\n" +
    "- constructor fara parametri\n" +
    "- adaugaUtilizator(nume) - returneaza id-ul utilizatorului (0,1,2,...)\n" +
    "- adaugaPrietenie(id1, id2) - daca id1 si id2 sunt valide, DIFERITE, si prietenia nu exista deja, o adauga (in AMBELE directii) si returneaza adevarat; altfel returneaza fals fara nicio modificare\n" +
    "- suntPrieteni(id1, id2) - returneaza adevarat/fals\n" +
    "- numarPrieteni(id) - returneaza cati prieteni are utilizatorul (0 daca id invalid)\n" +
    "- prieteniComuni(id1, id2) - returneaza numarul de prieteni comuni ai celor doi utilizatori (0 daca vreun id e invalid)",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "Cel mult 50 de utilizatori.",
  hints: "O prietenie este BIDIRECTIONALA - cand adaugati id1-id2, trebuie sa retineti relatia si din perspectiva lui id1, si din perspectiva lui id2.",
  explanation: "Primul sistem din capitol care modeleaza relatii intre obiecte de ACELASI tip (graf de prietenie), nu o ierarhie stricta parinte-copil ca la celelalte sisteme.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    ReteaSociala r;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "ADDUSER") {
            string nume; cin >> nume;
            cout << r.adaugaUtilizator(nume) << "\\n";
        } else if (cmd == "PRIETENIE") {
            int id1, id2; cin >> id1 >> id2;
            cout << (r.adaugaPrietenie(id1, id2) ? 1 : 0) << "\\n";
        } else if (cmd == "SUNTPRIETENI") {
            int id1, id2; cin >> id1 >> id2;
            cout << (r.suntPrieteni(id1, id2) ? "DA" : "NU") << "\\n";
        } else if (cmd == "NRPRIETENI") {
            int id; cin >> id;
            cout << r.numarPrieteni(id) << "\\n";
        } else if (cmd == "COMUN") {
            int id1, id2; cin >> id1 >> id2;
            cout << r.prieteniComuni(id1, id2) << "\\n";
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
    r = ReteaSociala()
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "ADDUSER":
            nume = data[i]; i += 1
            out.append(str(r.adaugaUtilizator(nume)))
        elif cmd == "PRIETENIE":
            id1 = int(data[i]); id2 = int(data[i+1]); i += 2
            out.append("1" if r.adaugaPrietenie(id1, id2) else "0")
        elif cmd == "SUNTPRIETENI":
            id1 = int(data[i]); id2 = int(data[i+1]); i += 2
            out.append("DA" if r.suntPrieteni(id1, id2) else "NU")
        elif cmd == "NRPRIETENI":
            id_ = int(data[i]); i += 1
            out.append(str(r.numarPrieteni(id_)))
        elif cmd == "COMUN":
            id1 = int(data[i]); id2 = int(data[i+1]); i += 2
            out.append(str(r.prieteniComuni(id1, id2)))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Utilizator {
private:
    string nume;
public:
    Utilizator(string n = "") : nume(n) {}
    string getNume() { return nume; }
};

class ReteaSociala {
private:
    vector<Utilizator> utilizatori;
    map<int, set<int>> prietenii;
public:
    int adaugaUtilizator(string nume) {
        utilizatori.push_back(Utilizator(nume));
        return utilizatori.size() - 1;
    }
    bool valid(int id) { return id >= 0 && id < (int)utilizatori.size(); }
    bool adaugaPrietenie(int id1, int id2) {
        if (!valid(id1) || !valid(id2) || id1 == id2) return false;
        if (prietenii[id1].count(id2)) return false;
        prietenii[id1].insert(id2);
        prietenii[id2].insert(id1);
        return true;
    }
    bool suntPrieteni(int id1, int id2) {
        if (!valid(id1) || !valid(id2)) return false;
        return prietenii[id1].count(id2) > 0;
    }
    int numarPrieteni(int id) {
        if (!valid(id)) return 0;
        return prietenii[id].size();
    }
    int prieteniComuni(int id1, int id2) {
        if (!valid(id1) || !valid(id2)) return 0;
        int c = 0;
        for (int x : prietenii[id1]) if (prietenii[id2].count(x)) c++;
        return c;
    }
};
`,
    python: `class Utilizator:
    def __init__(self, nume=""):
        self.__nume = nume
    def getNume(self):
        return self.__nume

class ReteaSociala:
    def __init__(self):
        self.__utilizatori = []
        self.__prietenii = {}
    def __valid(self, id):
        return 0 <= id < len(self.__utilizatori)
    def adaugaUtilizator(self, nume):
        self.__utilizatori.append(Utilizator(nume))
        idNou = len(self.__utilizatori) - 1
        self.__prietenii[idNou] = set()
        return idNou
    def adaugaPrietenie(self, id1, id2):
        if not self.__valid(id1) or not self.__valid(id2) or id1 == id2:
            return False
        if id2 in self.__prietenii[id1]:
            return False
        self.__prietenii[id1].add(id2)
        self.__prietenii[id2].add(id1)
        return True
    def suntPrieteni(self, id1, id2):
        if not self.__valid(id1) or not self.__valid(id2):
            return False
        return id2 in self.__prietenii[id1]
    def numarPrieteni(self, id):
        if not self.__valid(id):
            return 0
        return len(self.__prietenii[id])
    def prieteniComuni(self, id1, id2):
        if not self.__valid(id1) or not self.__valid(id2):
            return 0
        return len(self.__prietenii[id1] & self.__prietenii[id2])
`,
  },
  tests: [
    "5\nADDUSER A\nADDUSER B\nPRIETENIE 0 1\nSUNTPRIETENI 0 1\nSUNTPRIETENI 1 0",
    "4\nADDUSER A\nADDUSER B\nPRIETENIE 0 1\nPRIETENIE 0 1",
    "6\nADDUSER A\nADDUSER B\nADDUSER C\nPRIETENIE 0 1\nPRIETENIE 0 2\nNRPRIETENI 0",
    "8\nADDUSER A\nADDUSER B\nADDUSER C\nPRIETENIE 0 1\nPRIETENIE 0 2\nPRIETENIE 1 2\nCOMUN 0 1\nNRPRIETENI 2",
    "3\nADDUSER A\nPRIETENIE 0 0\nSUNTPRIETENI 0 0",
  ],
  testLabels: [
    "prietenie bidirectionala - vizibila din ambele perspective",
    "prietenie duplicata e respinsa",
    "un utilizator cu mai multi prieteni",
    "prieteniComuni - intersectie de multimi",
    "auto-prietenie (acelasi id de doua ori) e respinsa",
  ],
});

// ---------------- 35. Vot (Candidat + Alegere) ----------------
problems.push({
  slug: "oop-vot",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Sistemul Vot (Candidat + Alegere)",
  difficulty: "facultate",
  tags: ["oop", "clasa", "sistem", "vot", "alegeri"],
  statement:
    "Scrieti DOUA clase:\n\n" +
    "1) Candidat - nume, voturi (incepe cu 0):\n" +
    "- constructor(nume); getNume(); getVoturi()\n" +
    "- adaugaVot() - aduna 1 la numarul de voturi\n\n" +
    "2) Alegere - orchestreaza candidatii si voturile, IMPIEDICAND votul dublu (fiecare votant identificat printr-un id de votant poate vota o singura data, indiferent pe cine):\n" +
    "- constructor fara parametri\n" +
    "- adaugaCandidat(nume) - returneaza id-ul candidatului (0,1,2,...)\n" +
    "- voteaza(idVotant, idCandidat) - daca idCandidat e valid SI idVotant NU a mai votat niciodata, delegheaza catre candidat.adaugaVot(), marcheaza idVotant ca a votat, si returneaza adevarat; altfel returneaza fals fara nicio modificare\n" +
    "- castigator() - returneaza numele candidatului cu cele mai multe voturi (la egalitate, primul adaugat); \"-\" daca nu exista niciun candidat\n" +
    "- voturiCandidat(id) - returneaza voturile candidatului (0 daca id invalid)\n" +
    "- numarVotanti() - returneaza numarul de votanti DISTINCTI care au votat cu succes",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "id-urile de votant sunt numere intregi oarecare (nu neaparat consecutive).",
  hints: "Memorati intr-o multime (set) toate id-urile de votant care au votat deja cu succes, ca sa puteti respinge un al doilea vot al aceluiasi votant.",
  explanation: "Introduce un nou tip de regula la nivel de sistem: prevenirea unei actiuni repetate pe baza de IDENTITATE (votantul), nu pe baza starii unui singur obiect (ca la Garaj/Biblioteca).",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Alegere a;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "ADDCANDIDAT") {
            string nume; cin >> nume;
            cout << a.adaugaCandidat(nume) << "\\n";
        } else if (cmd == "VOTEAZA") {
            long long idVotant; int idCandidat;
            cin >> idVotant >> idCandidat;
            cout << (a.voteaza(idVotant, idCandidat) ? 1 : 0) << "\\n";
        } else if (cmd == "CASTIGATOR") {
            cout << a.castigator() << "\\n";
        } else if (cmd == "VOTURI") {
            int id; cin >> id;
            cout << a.voturiCandidat(id) << "\\n";
        } else if (cmd == "NRVOTANTI") {
            cout << a.numarVotanti() << "\\n";
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
    a = Alegere()
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "ADDCANDIDAT":
            nume = data[i]; i += 1
            out.append(str(a.adaugaCandidat(nume)))
        elif cmd == "VOTEAZA":
            idVotant = int(data[i]); idCandidat = int(data[i+1]); i += 2
            out.append("1" if a.voteaza(idVotant, idCandidat) else "0")
        elif cmd == "CASTIGATOR":
            out.append(str(a.castigator()))
        elif cmd == "VOTURI":
            id_ = int(data[i]); i += 1
            out.append(str(a.voturiCandidat(id_)))
        elif cmd == "NRVOTANTI":
            out.append(str(a.numarVotanti()))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Candidat {
private:
    string nume;
    int voturi;
public:
    Candidat(string n = "") : nume(n), voturi(0) {}
    string getNume() { return nume; }
    int getVoturi() { return voturi; }
    void adaugaVot() { voturi++; }
};

class Alegere {
private:
    vector<Candidat> candidati;
    set<long long> votantiCareAuVotat;
public:
    int adaugaCandidat(string nume) {
        candidati.push_back(Candidat(nume));
        return candidati.size() - 1;
    }
    bool voteaza(long long idVotant, int idCandidat) {
        if (idCandidat < 0 || idCandidat >= (int)candidati.size()) return false;
        if (votantiCareAuVotat.count(idVotant)) return false;
        candidati[idCandidat].adaugaVot();
        votantiCareAuVotat.insert(idVotant);
        return true;
    }
    string castigator() {
        if (candidati.empty()) return "-";
        int best = 0;
        for (int i = 1; i < (int)candidati.size(); i++)
            if (candidati[i].getVoturi() > candidati[best].getVoturi()) best = i;
        return candidati[best].getNume();
    }
    int voturiCandidat(int id) {
        if (id < 0 || id >= (int)candidati.size()) return 0;
        return candidati[id].getVoturi();
    }
    int numarVotanti() { return votantiCareAuVotat.size(); }
};
`,
    python: `class Candidat:
    def __init__(self, nume=""):
        self.__nume = nume
        self.__voturi = 0
    def getNume(self):
        return self.__nume
    def getVoturi(self):
        return self.__voturi
    def adaugaVot(self):
        self.__voturi += 1

class Alegere:
    def __init__(self):
        self.__candidati = []
        self.__votanti = set()
    def adaugaCandidat(self, nume):
        self.__candidati.append(Candidat(nume))
        return len(self.__candidati) - 1
    def voteaza(self, idVotant, idCandidat):
        if idCandidat < 0 or idCandidat >= len(self.__candidati):
            return False
        if idVotant in self.__votanti:
            return False
        self.__candidati[idCandidat].adaugaVot()
        self.__votanti.add(idVotant)
        return True
    def castigator(self):
        if not self.__candidati:
            return "-"
        best = self.__candidati[0]
        for c in self.__candidati[1:]:
            if c.getVoturi() > best.getVoturi():
                best = c
        return best.getNume()
    def voturiCandidat(self, id):
        if id < 0 or id >= len(self.__candidati):
            return 0
        return self.__candidati[id].getVoturi()
    def numarVotanti(self):
        return len(self.__votanti)
`,
  },
  tests: [
    "4\nADDCANDIDAT A\nADDCANDIDAT B\nVOTEAZA 100 0\nVOTURI 0",
    "5\nADDCANDIDAT A\nVOTEAZA 100 0\nVOTEAZA 100 0\nVOTURI 0\nNRVOTANTI",
    "6\nADDCANDIDAT A\nADDCANDIDAT B\nVOTEAZA 1 0\nVOTEAZA 2 1\nVOTEAZA 3 1\nCASTIGATOR",
    "3\nADDCANDIDAT A\nADDCANDIDAT B\nCASTIGATOR",
    "2\nVOTEAZA 1 0\nCASTIGATOR",
  ],
  testLabels: [
    "vot de baza - delegare catre adaugaVot",
    "vot dublu al aceluiasi votant e respins",
    "castigatorul cu cele mai multe voturi",
    "egalitate (0-0) - primul candidat adaugat castiga",
    "vot cu id de candidat invalid (niciun candidat) - fara crash",
  ],
});

// ---------------- 36. ProgramTV (Emisiune + Canal) ----------------
problems.push({
  slug: "oop-program-tv",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Sistemul ProgramTV (Emisiune + Canal)",
  difficulty: "facultate",
  tags: ["oop", "clasa", "sistem", "program-tv", "interval"],
  statement:
    "Scrieti DOUA clase:\n\n" +
    "1) Emisiune - titlu, ora de inceput (ore, minute) si durata (in minute):\n" +
    "- constructor(titlu, oreInceput, minInceput, durataMinute)\n" +
    "- getTitlu()\n" +
    "- getInceputMinute() - returneaza oreInceput*60+minInceput\n" +
    "- getSfarsitMinute() - returneaza getInceputMinute()+durataMinute\n\n" +
    "2) Canal - nume, si o COLECTIE interna de obiecte Emisiune care formeaza programul zilei:\n" +
    "- constructor(nume)\n" +
    "- adaugaEmisiune(titlu, oreInceput, minInceput, durataMinute) - construieste o Emisiune candidata; daca aceasta s-ar SUPRAPUNE (interval semi-deschis [inceput,sfarsit)) cu ORICARE emisiune deja existenta in program, NU o adauga si returneaza fals; altfel o adauga la program si returneaza adevarat\n" +
    "- numarEmisiuni()\n" +
    "- emisiuneLaOra(ore, minute) - returneaza titlul emisiunii care ruleaza la acel moment exact (inceput <= moment < sfarsit); \"-\" daca nimic nu ruleaza atunci",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "0 <= ore <= 23, 0 <= minute <= 59, 1 <= durataMinute <= 500, cel mult 50 de emisiuni.",
  hints: "adaugaEmisiune trebuie sa verifice suprapunerea fata de TOATE emisiunile deja existente, nu doar fata de ultima adaugata.",
  explanation: "Scaleaza verificarea de suprapunere a doua intervale (introdusa la Eveniment+Ora din capitolul anterior) la o COLECTIE intreaga: fiecare adaugare noua trebuie validata fata de tot ce exista deja, nu doar fata de un singur obiect fix.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Canal* c = nullptr;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "NEW") {
            string nume; cin >> nume;
            if (c) delete c;
            c = new Canal(nume);
            cout << "OK\\n";
        } else if (cmd == "ADD") {
            string titlu; int oi, mi, dur;
            cin >> titlu >> oi >> mi >> dur;
            cout << (c->adaugaEmisiune(titlu, oi, mi, dur) ? 1 : 0) << "\\n";
        } else if (cmd == "COUNT") {
            cout << c->numarEmisiuni() << "\\n";
        } else if (cmd == "LAORA") {
            int oq, mq; cin >> oq >> mq;
            cout << c->emisiuneLaOra(oq, mq) << "\\n";
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
            nume = data[i]; i += 1
            c = Canal(nume)
            out.append("OK")
        elif cmd == "ADD":
            titlu = data[i]; oi = int(data[i+1]); mi = int(data[i+2]); dur = int(data[i+3]); i += 4
            out.append("1" if c.adaugaEmisiune(titlu, oi, mi, dur) else "0")
        elif cmd == "COUNT":
            out.append(str(c.numarEmisiuni()))
        elif cmd == "LAORA":
            oq = int(data[i]); mq = int(data[i+1]); i += 2
            out.append(str(c.emisiuneLaOra(oq, mq)))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Emisiune {
private:
    string titlu;
    int oreInceput, minInceput, durataMinute;
public:
    Emisiune(string t, int oi, int mi, int dur) : titlu(t), oreInceput(oi), minInceput(mi), durataMinute(dur) {}
    string getTitlu() { return titlu; }
    int getInceputMinute() { return oreInceput * 60 + minInceput; }
    int getSfarsitMinute() { return getInceputMinute() + durataMinute; }
};

class Canal {
private:
    string nume;
    vector<Emisiune> program;
public:
    Canal(string n) : nume(n) {}
    bool adaugaEmisiune(string titlu, int oi, int mi, int dur) {
        Emisiune cand(titlu, oi, mi, dur);
        for (auto& e : program) {
            bool faraSuprapunere = cand.getSfarsitMinute() <= e.getInceputMinute()
                || e.getSfarsitMinute() <= cand.getInceputMinute();
            if (!faraSuprapunere) return false;
        }
        program.push_back(cand);
        return true;
    }
    int numarEmisiuni() { return program.size(); }
    string emisiuneLaOra(int ore, int minute) {
        int moment = ore * 60 + minute;
        for (auto& e : program)
            if (e.getInceputMinute() <= moment && moment < e.getSfarsitMinute()) return e.getTitlu();
        return "-";
    }
};
`,
    python: `class Emisiune:
    def __init__(self, titlu, oreInceput, minInceput, durataMinute):
        self.__titlu = titlu
        self.__oreInceput = oreInceput
        self.__minInceput = minInceput
        self.__durataMinute = durataMinute
    def getTitlu(self):
        return self.__titlu
    def getInceputMinute(self):
        return self.__oreInceput * 60 + self.__minInceput
    def getSfarsitMinute(self):
        return self.getInceputMinute() + self.__durataMinute

class Canal:
    def __init__(self, nume):
        self.__nume = nume
        self.__program = []
    def adaugaEmisiune(self, titlu, oi, mi, dur):
        candidata = Emisiune(titlu, oi, mi, dur)
        for e in self.__program:
            fara_suprapunere = (candidata.getSfarsitMinute() <= e.getInceputMinute()
                                 or e.getSfarsitMinute() <= candidata.getInceputMinute())
            if not fara_suprapunere:
                return False
        self.__program.append(candidata)
        return True
    def numarEmisiuni(self):
        return len(self.__program)
    def emisiuneLaOra(self, ore, minute):
        moment = ore * 60 + minute
        for e in self.__program:
            if e.getInceputMinute() <= moment < e.getSfarsitMinute():
                return e.getTitlu()
        return "-"
`,
  },
  tests: [
    "3\nNEW TVR\nADD Stiri 8 0 30\nCOUNT",
    "4\nNEW TVR\nADD Stiri 8 0 30\nADD Film 8 15 60\nCOUNT",
    "4\nNEW TVR\nADD Stiri 8 0 30\nADD Film 8 30 60\nCOUNT",
    "4\nNEW TVR\nADD Stiri 8 0 30\nLAORA 8 15\nLAORA 9 0",
  ],
  testLabels: [
    "adaugare de baza fara conflicte",
    "emisiune noua care se suprapune cu una existenta e respinsa",
    "emisiune care incepe exact cand alta se termina - acceptata (fara suprapunere)",
    "emisiuneLaOra - moment ocupat vs moment liber",
  ],
});

module.exports.problems12 = problems;

if (require.main === module) {
  runMain(problems, LEVEL, SRC);
}
