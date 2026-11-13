const { runMain } = require("./lib/oop-runner");

const LEVEL = "oop";
const SRC = "Zece la Info - OOP (probleme originale)";
const CH = "oop-sisteme-mari";
const SUB = "sisteme-multi-clasa";

const problems = [];

// ---------------- 9. Biblioteca ----------------
problems.push({
  slug: "oop-biblioteca",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Sistemul Biblioteca (Carte + Membru + Biblioteca)",
  difficulty: "hard",
  tags: ["oop", "clasa", "sistem", "compunere", "biblioteca"],
  statement:
    "Scrieti TREI clase care modeleaza o biblioteca simpla:\n\n" +
    "1) Carte - memoreaza titlul (fara spatii) si daca este disponibila (initial DA):\n" +
    "- constructor(titlu)\n" +
    "- getTitlu(), esteDisponibila(), seteazaDisponibila(bool val)\n\n" +
    "2) Membru - memoreaza numele (fara spatii) unui membru al bibliotecii:\n" +
    "- constructor(nume)\n" +
    "- getNume()\n\n" +
    "3) Biblioteca - orchestreaza colectiile de carti si membri (memorate intern, adaugate dinamic):\n" +
    "- constructor fara parametri\n" +
    "- adaugaCarte(titlu) - creeaza o noua Carte si returneaza id-ul ei (0, 1, 2, ... in ordinea adaugarii)\n" +
    "- adaugaMembru(nume) - creeaza un nou Membru si returneaza id-ul lui (0, 1, 2, ...)\n" +
    "- imprumuta(idMembru, idCarte) - daca id-urile sunt valide si cartea e disponibila, o marcheaza indisponibila, retine ca a fost imprumutata de idMembru si returneaza adevarat; altfel returneaza fals fara nicio modificare\n" +
    "- returneaza(idMembru, idCarte) - daca cartea e curent indisponibila SI a fost imprumutata exact de idMembru, o marcheaza disponibila si returneaza adevarat; altfel (carte disponibila deja, sau imprumutata de alt membru) returneaza fals fara nicio modificare\n" +
    "- cartiDisponibile() - returneaza numarul de carti curent disponibile\n" +
    "- numarImprumuturi(idMembru) - returneaza cate carti are curent imprumutate membrul idMembru",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "Cel mult 50 de carti si 50 de membri intr-un test.",
  hints: "Biblioteca trebuie sa retina, pentru fiecare carte imprumutata, CINE a imprumutat-o - altfel returneaza() nu poate verifica daca cine returneaza e chiar cel care a imprumutat.",
  explanation: "Sistem cu 3 clase care colaboreaza: Biblioteca detine colectii de Carte si Membru si coordoneaza intre ele, in loc sa puna toata logica intr-o singura clasa mare.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Biblioteca b;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "ADDCARTE") {
            string titlu; cin >> titlu;
            cout << b.adaugaCarte(titlu) << "\\n";
        } else if (cmd == "ADDMEMBRU") {
            string nume; cin >> nume;
            cout << b.adaugaMembru(nume) << "\\n";
        } else if (cmd == "IMPRUMUTA") {
            int m, c; cin >> m >> c;
            cout << (b.imprumuta(m, c) ? 1 : 0) << "\\n";
        } else if (cmd == "RETURNEAZA") {
            int m, c; cin >> m >> c;
            cout << (b.returneaza(m, c) ? 1 : 0) << "\\n";
        } else if (cmd == "DISPONIBILE") {
            cout << b.cartiDisponibile() << "\\n";
        } else if (cmd == "NRIMPRUMUT") {
            int m; cin >> m;
            cout << b.numarImprumuturi(m) << "\\n";
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
    b = Biblioteca()
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "ADDCARTE":
            titlu = data[i]; i += 1
            out.append(str(b.adaugaCarte(titlu)))
        elif cmd == "ADDMEMBRU":
            nume = data[i]; i += 1
            out.append(str(b.adaugaMembru(nume)))
        elif cmd == "IMPRUMUTA":
            m = int(data[i]); c = int(data[i+1]); i += 2
            out.append("1" if b.imprumuta(m, c) else "0")
        elif cmd == "RETURNEAZA":
            m = int(data[i]); c = int(data[i+1]); i += 2
            out.append("1" if b.returneaza(m, c) else "0")
        elif cmd == "DISPONIBILE":
            out.append(str(b.cartiDisponibile()))
        elif cmd == "NRIMPRUMUT":
            m = int(data[i]); i += 1
            out.append(str(b.numarImprumuturi(m)))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Carte {
private:
    string titlu;
    bool disponibila;
public:
    Carte(string t = "") : titlu(t), disponibila(true) {}
    string getTitlu() { return titlu; }
    bool esteDisponibila() { return disponibila; }
    void seteazaDisponibila(bool val) { disponibila = val; }
};

class Membru {
private:
    string nume;
public:
    Membru(string n = "") : nume(n) {}
    string getNume() { return nume; }
};

class Biblioteca {
private:
    vector<Carte> carti;
    vector<Membru> membri;
    map<int, int> imprumutataDe; // idCarte -> idMembru, doar cat timp e indisponibila
public:
    int adaugaCarte(string titlu) {
        carti.push_back(Carte(titlu));
        return carti.size() - 1;
    }
    int adaugaMembru(string nume) {
        membri.push_back(Membru(nume));
        return membri.size() - 1;
    }
    bool imprumuta(int idMembru, int idCarte) {
        if (idMembru < 0 || idMembru >= (int)membri.size()) return false;
        if (idCarte < 0 || idCarte >= (int)carti.size()) return false;
        if (!carti[idCarte].esteDisponibila()) return false;
        carti[idCarte].seteazaDisponibila(false);
        imprumutataDe[idCarte] = idMembru;
        return true;
    }
    bool returneaza(int idMembru, int idCarte) {
        if (idCarte < 0 || idCarte >= (int)carti.size()) return false;
        if (carti[idCarte].esteDisponibila()) return false;
        if (imprumutataDe[idCarte] != idMembru) return false;
        carti[idCarte].seteazaDisponibila(true);
        imprumutataDe.erase(idCarte);
        return true;
    }
    int cartiDisponibile() {
        int c = 0;
        for (auto& carte : carti) if (carte.esteDisponibila()) c++;
        return c;
    }
    int numarImprumuturi(int idMembru) {
        int c = 0;
        for (auto& p : imprumutataDe) if (p.second == idMembru) c++;
        return c;
    }
};
`,
    python: `class Carte:
    def __init__(self, titlu=""):
        self.__titlu = titlu
        self.__disponibila = True
    def getTitlu(self):
        return self.__titlu
    def esteDisponibila(self):
        return self.__disponibila
    def seteazaDisponibila(self, val):
        self.__disponibila = val

class Membru:
    def __init__(self, nume=""):
        self.__nume = nume
    def getNume(self):
        return self.__nume

class Biblioteca:
    def __init__(self):
        self.__carti = []
        self.__membri = []
        self.__imprumutataDe = {}
    def adaugaCarte(self, titlu):
        self.__carti.append(Carte(titlu))
        return len(self.__carti) - 1
    def adaugaMembru(self, nume):
        self.__membri.append(Membru(nume))
        return len(self.__membri) - 1
    def imprumuta(self, idMembru, idCarte):
        if idMembru < 0 or idMembru >= len(self.__membri):
            return False
        if idCarte < 0 or idCarte >= len(self.__carti):
            return False
        if not self.__carti[idCarte].esteDisponibila():
            return False
        self.__carti[idCarte].seteazaDisponibila(False)
        self.__imprumutataDe[idCarte] = idMembru
        return True
    def returneaza(self, idMembru, idCarte):
        if idCarte < 0 or idCarte >= len(self.__carti):
            return False
        if self.__carti[idCarte].esteDisponibila():
            return False
        if self.__imprumutataDe.get(idCarte) != idMembru:
            return False
        self.__carti[idCarte].seteazaDisponibila(True)
        del self.__imprumutataDe[idCarte]
        return True
    def cartiDisponibile(self):
        return sum(1 for c in self.__carti if c.esteDisponibila())
    def numarImprumuturi(self, idMembru):
        return sum(1 for v in self.__imprumutataDe.values() if v == idMembru)
`,
  },
  tests: [
    "6\nADDCARTE Ion\nADDCARTE Baltagul\nADDMEMBRU Popescu\nIMPRUMUTA 0 0\nDISPONIBILE\nNRIMPRUMUT 0",
    "5\nADDCARTE Ion\nADDMEMBRU Popescu\nADDMEMBRU Ionescu\nIMPRUMUTA 0 0\nIMPRUMUTA 1 0",
    "6\nADDCARTE Ion\nADDMEMBRU Popescu\nADDMEMBRU Ionescu\nIMPRUMUTA 0 0\nRETURNEAZA 1 0\nDISPONIBILE",
    "7\nADDCARTE Ion\nADDMEMBRU Popescu\nIMPRUMUTA 0 0\nRETURNEAZA 0 0\nDISPONIBILE\nIMPRUMUTA 0 0\nDISPONIBILE",
    "8\nADDCARTE A\nADDCARTE B\nADDMEMBRU Popescu\nIMPRUMUTA 0 0\nIMPRUMUTA 0 1\nNRIMPRUMUT 0\nRETURNEAZA 0 0\nNRIMPRUMUT 0",
  ],
  testLabels: [
    "adauga carte/membru + imprumuta de baza + disponibile/nrimprumut",
    "imprumuta o carte deja imprumutata de alt membru esueaza",
    "returneaza de catre un membru gresit esueaza, cartea ramane imprumutata",
    "returneaza corect + re-imprumutare dupa returnare",
    "un membru cu mai multe carti imprumutate simultan (nrimprumut > 1)",
  ],
});

module.exports.problems4a = problems;

// ============================================================
// 10. CAPSTONE: CatalogScolar (Nota + Elev + Profesor + Clasa + CatalogScolar)
// ============================================================
const problemsCapstone = [{
  slug: "oop-catalog-scolar",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Sistemul CatalogScolar (Nota + Elev + Profesor + Clasa + CatalogScolar)",
  difficulty: "facultate",
  tags: ["oop", "clasa", "sistem", "compunere", "catalog", "capstone"],
  statement:
    "Scrieti CINCI clase care modeleaza catalogul unei scoli, organizate ierarhic (fiecare clasa 'contine' obiecte din clasa anterioara):\n\n" +
    "1) Nota - o nota la o materie: materie (fara spatii), valoare (intreg 1-10).\n" +
    "- constructor(materie, valoare); getMaterie(); getValoare()\n\n" +
    "2) Profesor - nume (fara spatii), materie predata.\n" +
    "- constructor(nume, materie); getNume(); getMaterie()\n\n" +
    "3) Elev - nume, id (intreg), si o colectie interna de obiecte Nota.\n" +
    "- constructor(nume, id)\n" +
    "- getNume(), getId()\n" +
    "- adaugaNota(materie, valoare) - adauga o Nota DOAR daca 1<=valoare<=10; returneaza adevarat/fals\n" +
    "- mediaGenerala() - media tuturor notelor (0 daca elevul nu are nicio nota)\n" +
    "- mediaLaMaterie(materie) - media notelor doar la materia data (-1 daca elevul nu are nicio nota la acea materie)\n\n" +
    "4) Clasa - nume (ex. 9A), si o colectie interna de obiecte Elev (NU doar id-uri - obiectele Elev efective).\n" +
    "- constructor(nume)\n" +
    "- getNume()\n" +
    "- adaugaElev(Elev e) - adauga elevul in colectia interna\n" +
    "- gasesteElev(id) - returneaza elevul cu acel id (presupus ca exista)\n" +
    "- mediaClasei() - media generala a TUTUROR elevilor din clasa (0 daca nu are elevi)\n" +
    "- elevulCuMediaMaxima() - returneaza numele elevului cu cea mai mare mediaGenerala() (in caz de egalitate, primul adaugat); \"-\" daca nu are elevi\n" +
    "- numarElevi()\n\n" +
    "5) CatalogScolar - orchestreaza mai multe obiecte Clasa si Profesor.\n" +
    "- constructor fara parametri\n" +
    "- adaugaClasa(nume) - creeaza o Clasa noua si returneaza id-ul ei (0,1,2,...)\n" +
    "- adaugaProfesor(nume, materie) - adauga un Profesor in colectia interna\n" +
    "- numarProfesoriLaMaterie(materie) - cati profesori predau acea materie\n" +
    "- adaugaElevInClasa(idClasa, nume, idElev) - creeaza un Elev si il adauga in Clasa cu id-ul idClasa (delegare catre Clasa.adaugaElev)\n" +
    "- adaugaNotaElev(idClasa, idElev, materie, valoare) - gaseste elevul (prin Clasa.gasesteElev) si ii adauga o nota (delegare catre Elev.adaugaNota); returneaza rezultatul lui adaugaNota\n" +
    "- mediaElev(idClasa, idElev) - media generala a elevului cu id-ul idElev din clasa idClasa (delegare prin Clasa.gasesteElev catre Elev.mediaGenerala)\n" +
    "- mediaElevLaMaterie(idClasa, idElev, materie) - media elevului la o materie data (delegare similara catre Elev.mediaLaMaterie)\n" +
    "- mediaClasa(idClasa) - delegare catre Clasa.mediaClasei\n" +
    "- topElevClasa(idClasa) - delegare catre Clasa.elevulCuMediaMaxima\n" +
    "- clasaCuMediaMaxima() - returneaza numele clasei (dintre toate clasele adaugate) cu cea mai mare mediaClasei(); \"-\" daca nu exista nicio clasa",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "Cel mult 20 de clase, 50 de elevi per clasa, 50 de note per elev intr-un test.",
  hints: "Fiecare nivel deleaga catre nivelul de dedesubt in loc sa 'stie' totul: CatalogScolar apeleaza metode pe Clasa, Clasa apeleaza metode pe Elev, Elev apeleaza metode pe Nota (implicit, prin colectia interna).",
  explanation:
    "Cel mai mare exercitiu al capitolului: 4 niveluri de compunere (CatalogScolar -> Clasa -> Elev -> Nota), plus Profesor ca o clasa colaterala. Fiecare test izoleaza un nivel din ierarhie, ca sa se poata acorda punctaj partial chiar daca doar unele niveluri sunt implementate corect.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    cout << fixed << setprecision(2);
    int T;
    cin >> T;
    CatalogScolar cat;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "ADDCLASA") {
            string nume; cin >> nume;
            cout << cat.adaugaClasa(nume) << "\\n";
        } else if (cmd == "ADDPROF") {
            string nume, materie; cin >> nume >> materie;
            cat.adaugaProfesor(nume, materie);
            cout << "OK\\n";
        } else if (cmd == "NRPROF") {
            string materie; cin >> materie;
            cout << cat.numarProfesoriLaMaterie(materie) << "\\n";
        } else if (cmd == "ADDELEV") {
            int idClasa, idElev; string nume;
            cin >> idClasa >> nume >> idElev;
            cat.adaugaElevInClasa(idClasa, nume, idElev);
            cout << "OK\\n";
        } else if (cmd == "NOTA") {
            int idClasa, idElev, valoare; string materie;
            cin >> idClasa >> idElev >> materie >> valoare;
            cout << (cat.adaugaNotaElev(idClasa, idElev, materie, valoare) ? 1 : 0) << "\\n";
        } else if (cmd == "MEDIAELEV") {
            int idClasa, idElev; cin >> idClasa >> idElev;
            cout << cat.mediaElev(idClasa, idElev) << "\\n";
        } else if (cmd == "MEDIAMATERIE") {
            int idClasa, idElev; string materie;
            cin >> idClasa >> idElev >> materie;
            cout << cat.mediaElevLaMaterie(idClasa, idElev, materie) << "\\n";
        } else if (cmd == "MEDIACLASA") {
            int idClasa; cin >> idClasa;
            cout << cat.mediaClasa(idClasa) << "\\n";
        } else if (cmd == "TOPELEV") {
            int idClasa; cin >> idClasa;
            cout << cat.topElevClasa(idClasa) << "\\n";
        } else if (cmd == "TOPCLASA") {
            cout << cat.clasaCuMediaMaxima() << "\\n";
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
    cat = CatalogScolar()
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "ADDCLASA":
            nume = data[i]; i += 1
            out.append(str(cat.adaugaClasa(nume)))
        elif cmd == "ADDPROF":
            nume = data[i]; materie = data[i+1]; i += 2
            cat.adaugaProfesor(nume, materie)
            out.append("OK")
        elif cmd == "NRPROF":
            materie = data[i]; i += 1
            out.append(str(cat.numarProfesoriLaMaterie(materie)))
        elif cmd == "ADDELEV":
            idClasa = int(data[i]); nume = data[i+1]; idElev = int(data[i+2]); i += 3
            cat.adaugaElevInClasa(idClasa, nume, idElev)
            out.append("OK")
        elif cmd == "NOTA":
            idClasa = int(data[i]); idElev = int(data[i+1]); materie = data[i+2]; valoare = int(data[i+3]); i += 4
            out.append("1" if cat.adaugaNotaElev(idClasa, idElev, materie, valoare) else "0")
        elif cmd == "MEDIAELEV":
            idClasa = int(data[i]); idElev = int(data[i+1]); i += 2
            out.append(f"{cat.mediaElev(idClasa, idElev):.2f}")
        elif cmd == "MEDIAMATERIE":
            idClasa = int(data[i]); idElev = int(data[i+1]); materie = data[i+2]; i += 3
            out.append(f"{cat.mediaElevLaMaterie(idClasa, idElev, materie):.2f}")
        elif cmd == "MEDIACLASA":
            idClasa = int(data[i]); i += 1
            out.append(f"{cat.mediaClasa(idClasa):.2f}")
        elif cmd == "TOPELEV":
            idClasa = int(data[i]); i += 1
            out.append(str(cat.topElevClasa(idClasa)))
        elif cmd == "TOPCLASA":
            out.append(str(cat.clasaCuMediaMaxima()))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Nota {
private:
    string materie;
    int valoare;
public:
    Nota(string m = "", int v = 0) : materie(m), valoare(v) {}
    string getMaterie() { return materie; }
    int getValoare() { return valoare; }
};

class Profesor {
private:
    string nume, materie;
public:
    Profesor(string n = "", string m = "") : nume(n), materie(m) {}
    string getNume() { return nume; }
    string getMaterie() { return materie; }
};

class Elev {
private:
    string nume;
    int id;
    vector<Nota> note;
public:
    Elev(string n = "", int i = 0) : nume(n), id(i) {}
    string getNume() { return nume; }
    int getId() { return id; }
    bool adaugaNota(string materie, int valoare) {
        if (valoare < 1 || valoare > 10) return false;
        note.push_back(Nota(materie, valoare));
        return true;
    }
    double mediaGenerala() {
        if (note.empty()) return 0;
        double s = 0;
        for (auto& n : note) s += n.getValoare();
        return s / note.size();
    }
    double mediaLaMaterie(string materie) {
        double s = 0; int cnt = 0;
        for (auto& n : note) if (n.getMaterie() == materie) { s += n.getValoare(); cnt++; }
        if (cnt == 0) return -1;
        return s / cnt;
    }
};

class Clasa {
private:
    string nume;
    vector<Elev> elevi;
public:
    Clasa(string n = "") : nume(n) {}
    string getNume() { return nume; }
    void adaugaElev(Elev e) { elevi.push_back(e); }
    Elev& gasesteElev(int id) {
        for (auto& e : elevi) if (e.getId() == id) return e;
        return elevi[0];
    }
    double mediaClasei() {
        if (elevi.empty()) return 0;
        double s = 0;
        for (auto& e : elevi) s += e.mediaGenerala();
        return s / elevi.size();
    }
    string elevulCuMediaMaxima() {
        if (elevi.empty()) return "-";
        int best = 0;
        for (int i = 1; i < (int)elevi.size(); i++)
            if (elevi[i].mediaGenerala() > elevi[best].mediaGenerala()) best = i;
        return elevi[best].getNume();
    }
    int numarElevi() { return elevi.size(); }
};

class CatalogScolar {
private:
    vector<Clasa> clase;
    vector<Profesor> profesori;
public:
    int adaugaClasa(string nume) {
        clase.push_back(Clasa(nume));
        return clase.size() - 1;
    }
    void adaugaProfesor(string nume, string materie) {
        profesori.push_back(Profesor(nume, materie));
    }
    int numarProfesoriLaMaterie(string materie) {
        int c = 0;
        for (auto& p : profesori) if (p.getMaterie() == materie) c++;
        return c;
    }
    void adaugaElevInClasa(int idClasa, string nume, int idElev) {
        clase[idClasa].adaugaElev(Elev(nume, idElev));
    }
    bool adaugaNotaElev(int idClasa, int idElev, string materie, int valoare) {
        Elev& e = clase[idClasa].gasesteElev(idElev);
        return e.adaugaNota(materie, valoare);
    }
    double mediaElev(int idClasa, int idElev) {
        return clase[idClasa].gasesteElev(idElev).mediaGenerala();
    }
    double mediaElevLaMaterie(int idClasa, int idElev, string materie) {
        return clase[idClasa].gasesteElev(idElev).mediaLaMaterie(materie);
    }
    double mediaClasa(int idClasa) { return clase[idClasa].mediaClasei(); }
    string topElevClasa(int idClasa) { return clase[idClasa].elevulCuMediaMaxima(); }
    string clasaCuMediaMaxima() {
        if (clase.empty()) return "-";
        int best = 0;
        for (int i = 1; i < (int)clase.size(); i++)
            if (clase[i].mediaClasei() > clase[best].mediaClasei()) best = i;
        return clase[best].getNume();
    }
};
`,
    python: `class Nota:
    def __init__(self, materie="", valoare=0):
        self.__materie = materie
        self.__valoare = valoare
    def getMaterie(self):
        return self.__materie
    def getValoare(self):
        return self.__valoare

class Profesor:
    def __init__(self, nume="", materie=""):
        self.__nume = nume
        self.__materie = materie
    def getNume(self):
        return self.__nume
    def getMaterie(self):
        return self.__materie

class Elev:
    def __init__(self, nume="", id=0):
        self.__nume = nume
        self.__id = id
        self.__note = []
    def getNume(self):
        return self.__nume
    def getId(self):
        return self.__id
    def adaugaNota(self, materie, valoare):
        if valoare < 1 or valoare > 10:
            return False
        self.__note.append(Nota(materie, valoare))
        return True
    def mediaGenerala(self):
        if not self.__note:
            return 0
        return sum(n.getValoare() for n in self.__note) / len(self.__note)
    def mediaLaMaterie(self, materie):
        vals = [n.getValoare() for n in self.__note if n.getMaterie() == materie]
        if not vals:
            return -1
        return sum(vals) / len(vals)

class Clasa:
    def __init__(self, nume=""):
        self.__nume = nume
        self.__elevi = []
    def getNume(self):
        return self.__nume
    def adaugaElev(self, e):
        self.__elevi.append(e)
    def gasesteElev(self, id):
        for e in self.__elevi:
            if e.getId() == id:
                return e
        return self.__elevi[0]
    def mediaClasei(self):
        if not self.__elevi:
            return 0
        return sum(e.mediaGenerala() for e in self.__elevi) / len(self.__elevi)
    def elevulCuMediaMaxima(self):
        if not self.__elevi:
            return "-"
        best = self.__elevi[0]
        for e in self.__elevi[1:]:
            if e.mediaGenerala() > best.mediaGenerala():
                best = e
        return best.getNume()
    def numarElevi(self):
        return len(self.__elevi)

class CatalogScolar:
    def __init__(self):
        self.__clase = []
        self.__profesori = []
    def adaugaClasa(self, nume):
        self.__clase.append(Clasa(nume))
        return len(self.__clase) - 1
    def adaugaProfesor(self, nume, materie):
        self.__profesori.append(Profesor(nume, materie))
    def numarProfesoriLaMaterie(self, materie):
        return sum(1 for p in self.__profesori if p.getMaterie() == materie)
    def adaugaElevInClasa(self, idClasa, nume, idElev):
        self.__clase[idClasa].adaugaElev(Elev(nume, idElev))
    def adaugaNotaElev(self, idClasa, idElev, materie, valoare):
        e = self.__clase[idClasa].gasesteElev(idElev)
        return e.adaugaNota(materie, valoare)
    def mediaElev(self, idClasa, idElev):
        return self.__clase[idClasa].gasesteElev(idElev).mediaGenerala()
    def mediaElevLaMaterie(self, idClasa, idElev, materie):
        return self.__clase[idClasa].gasesteElev(idElev).mediaLaMaterie(materie)
    def mediaClasa(self, idClasa):
        return self.__clase[idClasa].mediaClasei()
    def topElevClasa(self, idClasa):
        return self.__clase[idClasa].elevulCuMediaMaxima()
    def clasaCuMediaMaxima(self):
        if not self.__clase:
            return "-"
        best = self.__clase[0]
        for c in self.__clase[1:]:
            if c.mediaClasei() > best.mediaClasei():
                best = c
        return best.getNume()
`,
  },
  tests: [
    "8\nADDCLASA 9A\nADDELEV 0 Popescu 1\nADDELEV 0 Ionescu 2\nNOTA 0 1 Matematica 8\nNOTA 0 1 Matematica 10\nNOTA 0 2 Romana 6\nMEDIAELEV 0 1\nMEDIAELEV 0 2",
    "6\nADDCLASA 9A\nADDELEV 0 Popescu 1\nNOTA 0 1 Matematica 8\nNOTA 0 1 Romana 6\nMEDIAMATERIE 0 1 Matematica\nMEDIAMATERIE 0 1 Informatica",
    "5\nADDCLASA 9A\nADDELEV 0 Popescu 1\nNOTA 0 1 Matematica 11\nNOTA 0 1 Matematica 8\nMEDIAELEV 0 1",
    "8\nADDCLASA 9A\nADDELEV 0 Popescu 1\nADDELEV 0 Ionescu 2\nNOTA 0 1 Matematica 10\nNOTA 0 1 Matematica 10\nNOTA 0 2 Matematica 6\nNOTA 0 2 Matematica 4\nMEDIACLASA 0",
    "9\nADDCLASA 9A\nADDCLASA 9B\nADDELEV 0 Popescu 1\nADDELEV 1 Georgescu 1\nNOTA 0 1 Matematica 5\nNOTA 1 1 Matematica 10\nMEDIACLASA 0\nMEDIACLASA 1\nTOPCLASA",
    "7\nADDCLASA 9A\nADDELEV 0 Popescu 1\nADDELEV 0 Ionescu 2\nNOTA 0 1 Matematica 5\nNOTA 0 2 Matematica 9\nTOPELEV 0\nMEDIAELEV 0 1",
    "4\nADDPROF Georgescu Matematica\nADDPROF Ionescu Matematica\nADDPROF Vasile Romana\nNRPROF Matematica",
    "6\nADDCLASA 9A\nADDELEV 0 Singur 1\nMEDIAELEV 0 1\nTOPELEV 0\nNOTA 0 1 Matematica 7\nMEDIAELEV 0 1",
  ],
  testLabels: [
    "nivel Elev+Nota: adaugare note multiple + mediaGenerala per elev (izoleaza baza ierarhiei)",
    "mediaLaMaterie - filtrare pe materie + materie fara note (-1)",
    "validare: nota invalida (11) respinsa, media calculata doar din notele valide",
    "nivel Clasa: mediaClasei agrega corect media mai multor elevi",
    "nivel CatalogScolar: mai multe clase + TOPCLASA alege clasa cu media cea mai mare",
    "TOPELEV alege elevul cu media maxima in cadrul unei clase",
    "Profesor - numarProfesoriLaMaterie independent de restul ierarhiei",
    "caz limita: elev fara nicio nota (media 0) nu invalideaza restul sistemului dupa ce primeste o nota",
  ],
}];

module.exports.problems4b = problemsCapstone;

if (require.main === module) {
  runMain([...problems, ...problemsCapstone], LEVEL, SRC);
}
