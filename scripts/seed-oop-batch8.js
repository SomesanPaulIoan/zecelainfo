const { runMain } = require("./lib/oop-runner");

const LEVEL = "oop";
const SRC = "Zece la Info - OOP (probleme originale)";
const CH = "oop-sisteme-mari";
const SUB = "sisteme-multi-clasa";

const problems = [];

// ---------------- 20. Garaj (Masina + Client + Garaj) ----------------
problems.push({
  slug: "oop-garaj",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Sistemul Garaj (Masina + Client + Garaj)",
  difficulty: "hard",
  tags: ["oop", "clasa", "sistem", "compunere", "garaj"],
  statement:
    "Scrieti TREI clase:\n\n" +
    "1) Masina - numarInmatriculare (fara spatii), marca (fara spatii):\n" +
    "- constructor(numarInmatriculare, marca); getNumarInmatriculare(); getMarca()\n\n" +
    "2) Client - nume (fara spatii):\n" +
    "- constructor(nume); getNume()\n\n" +
    "3) Garaj - orchestreaza colectiile de masini si clienti, plus asocierea proprietar-masina:\n" +
    "- constructor fara parametri\n" +
    "- adaugaMasina(numarInmatriculare, marca) - returneaza id-ul masinii (0,1,2,...)\n" +
    "- adaugaClient(nume) - returneaza id-ul clientului (0,1,2,...)\n" +
    "- asociazaProprietar(idMasina, idClient) - daca id-urile sunt valide, seteaza (sau INLOCUIESTE) proprietarul masinii cu idClient si returneaza adevarat; altfel returneaza fals\n" +
    "- proprietarMasina(idMasina) - returneaza numele clientului proprietar, sau \"-\" daca masina nu are proprietar sau id-ul e invalid\n" +
    "- numarMasiniClient(idClient) - returneaza cate masini detine curent acel client",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "Cel mult 50 de masini si 50 de clienti intr-un test. Testele includ si id-uri invalide.",
  hints: "asociazaProprietar poate fi apelata de mai multe ori pentru aceeasi masina - de fiecare data INLOCUIESTE proprietarul anterior, nu adauga unul nou.",
  explanation: "Sistem cu 3 clase, similar ca forma cu Biblioteca, dar cu o regula diferita: aici nu exista 'returnare' - proprietarul se poate schimba oricand prin reasociere. Toate metodele valideaza id-urile inainte de a indexa colectiile, ca sa nu produca erori pe id-uri inexistente.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Garaj g;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "ADDMASINA") {
            string nr, marca; cin >> nr >> marca;
            cout << g.adaugaMasina(nr, marca) << "\\n";
        } else if (cmd == "ADDCLIENT") {
            string nume; cin >> nume;
            cout << g.adaugaClient(nume) << "\\n";
        } else if (cmd == "ASOCIAZA") {
            int idM, idC; cin >> idM >> idC;
            cout << (g.asociazaProprietar(idM, idC) ? 1 : 0) << "\\n";
        } else if (cmd == "PROPRIETAR") {
            int idM; cin >> idM;
            cout << g.proprietarMasina(idM) << "\\n";
        } else if (cmd == "NRMASINI") {
            int idC; cin >> idC;
            cout << g.numarMasiniClient(idC) << "\\n";
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
    g = Garaj()
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "ADDMASINA":
            nr = data[i]; marca = data[i+1]; i += 2
            out.append(str(g.adaugaMasina(nr, marca)))
        elif cmd == "ADDCLIENT":
            nume = data[i]; i += 1
            out.append(str(g.adaugaClient(nume)))
        elif cmd == "ASOCIAZA":
            idM = int(data[i]); idC = int(data[i+1]); i += 2
            out.append("1" if g.asociazaProprietar(idM, idC) else "0")
        elif cmd == "PROPRIETAR":
            idM = int(data[i]); i += 1
            out.append(str(g.proprietarMasina(idM)))
        elif cmd == "NRMASINI":
            idC = int(data[i]); i += 1
            out.append(str(g.numarMasiniClient(idC)))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Masina {
private:
    string numarInmatriculare, marca;
public:
    Masina(string nr = "", string m = "") : numarInmatriculare(nr), marca(m) {}
    string getNumarInmatriculare() { return numarInmatriculare; }
    string getMarca() { return marca; }
};

class Client {
private:
    string nume;
public:
    Client(string n = "") : nume(n) {}
    string getNume() { return nume; }
};

class Garaj {
private:
    vector<Masina> masini;
    vector<Client> clienti;
    map<int, int> proprietar;
public:
    int adaugaMasina(string nr, string marca) {
        masini.push_back(Masina(nr, marca));
        return masini.size() - 1;
    }
    int adaugaClient(string nume) {
        clienti.push_back(Client(nume));
        return clienti.size() - 1;
    }
    bool asociazaProprietar(int idMasina, int idClient) {
        if (idMasina < 0 || idMasina >= (int)masini.size()) return false;
        if (idClient < 0 || idClient >= (int)clienti.size()) return false;
        proprietar[idMasina] = idClient;
        return true;
    }
    string proprietarMasina(int idMasina) {
        if (idMasina < 0 || idMasina >= (int)masini.size()) return "-";
        auto it = proprietar.find(idMasina);
        if (it == proprietar.end()) return "-";
        return clienti[it->second].getNume();
    }
    int numarMasiniClient(int idClient) {
        int c = 0;
        for (auto& p : proprietar) if (p.second == idClient) c++;
        return c;
    }
};
`,
    python: `class Masina:
    def __init__(self, nr="", marca=""):
        self.__nr = nr
        self.__marca = marca
    def getNumarInmatriculare(self):
        return self.__nr
    def getMarca(self):
        return self.__marca

class Client:
    def __init__(self, nume=""):
        self.__nume = nume
    def getNume(self):
        return self.__nume

class Garaj:
    def __init__(self):
        self.__masini = []
        self.__clienti = []
        self.__proprietar = {}
    def adaugaMasina(self, nr, marca):
        self.__masini.append(Masina(nr, marca))
        return len(self.__masini) - 1
    def adaugaClient(self, nume):
        self.__clienti.append(Client(nume))
        return len(self.__clienti) - 1
    def asociazaProprietar(self, idMasina, idClient):
        if idMasina < 0 or idMasina >= len(self.__masini):
            return False
        if idClient < 0 or idClient >= len(self.__clienti):
            return False
        self.__proprietar[idMasina] = idClient
        return True
    def proprietarMasina(self, idMasina):
        if idMasina < 0 or idMasina >= len(self.__masini):
            return "-"
        if idMasina not in self.__proprietar:
            return "-"
        return self.__clienti[self.__proprietar[idMasina]].getNume()
    def numarMasiniClient(self, idClient):
        return sum(1 for v in self.__proprietar.values() if v == idClient)
`,
  },
  tests: [
    "4\nADDMASINA B123ABC Dacia\nADDCLIENT Popescu\nASOCIAZA 0 0\nPROPRIETAR 0",
    "2\nADDMASINA B123ABC Dacia\nPROPRIETAR 0",
    "6\nADDMASINA B1 Dacia\nADDCLIENT Popescu\nADDCLIENT Ionescu\nASOCIAZA 0 0\nASOCIAZA 0 1\nPROPRIETAR 0",
    "6\nADDMASINA B1 Dacia\nADDMASINA B2 Dacia\nADDCLIENT Popescu\nASOCIAZA 0 0\nASOCIAZA 1 0\nNRMASINI 0",
    "2\nASOCIAZA 5 5\nPROPRIETAR 5",
  ],
  testLabels: [
    "adauga masina/client + asociere de baza",
    "masina fara proprietar (-)",
    "reasociere - noul proprietar inlocuieste vechiul proprietar",
    "un client cu mai multe masini (numarMasiniClient > 1)",
    "id-uri invalide - fara crash, raspuns implicit",
  ],
});

// ---------------- 21. Turnir (Echipa + Turnir) ----------------
problems.push({
  slug: "oop-turnir",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Sistemul Turnir (Echipa + Turnir)",
  difficulty: "hard",
  tags: ["oop", "clasa", "sistem", "turnir", "clasament"],
  statement:
    "Scrieti DOUA clase:\n\n" +
    "1) Echipa - nume, puncte (incepe cu 0 puncte):\n" +
    "- constructor(nume)\n" +
    "- getNume(), getPuncte()\n" +
    "- adaugaPuncte(int p) - aduna p puncte la totalul echipei\n\n" +
    "2) Turnir - orchestreaza mai multe obiecte Echipa si inregistreaza rezultatele meciurilor:\n" +
    "- constructor fara parametri\n" +
    "- adaugaEchipa(nume) - returneaza id-ul echipei (0,1,2,...)\n" +
    "- inregistreazaMeci(idEchipa1, idEchipa2, scor1, scor2) - daca id-urile sunt valide, acorda puncte dupa regula fotbalului (3 puncte echipei castigatoare, cate 1 punct fiecarei echipe la egal, 0 la infrangere), folosind adaugaPuncte pe cele doua obiecte Echipa; returneaza adevarat. Daca id-urile sunt invalide, returneaza fals si nu modifica nimic.\n" +
    "- puncteEchipa(id) - returneaza punctele curente ale echipei (0 daca id invalid)\n" +
    "- primaEchipa() - returneaza numele echipei cu cele mai multe puncte (la egalitate, prima adaugata); \"-\" daca nu exista nicio echipa",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "0 <= scor <= 100, cel mult 50 de echipe.",
  hints: "inregistreazaMeci trebuie sa modifice DOUA obiecte Echipa diferite dintr-un singur apel - delegati catre adaugaPuncte pe fiecare, nu duplicati logica de calcul al punctelor in Turnir.",
  explanation: "Introduce un tipar nou fata de sistemele anterioare: o singura metoda de orchestrare care muta starea a DOUA obiecte stocate simultan, in loc de un singur obiect per apel.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Turnir t;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "ADDECHIPA") {
            string nume; cin >> nume;
            cout << t.adaugaEchipa(nume) << "\\n";
        } else if (cmd == "MECI") {
            int id1, id2, s1, s2; cin >> id1 >> id2 >> s1 >> s2;
            cout << (t.inregistreazaMeci(id1, id2, s1, s2) ? 1 : 0) << "\\n";
        } else if (cmd == "PUNCTE") {
            int id; cin >> id;
            cout << t.puncteEchipa(id) << "\\n";
        } else if (cmd == "PRIMA") {
            cout << t.primaEchipa() << "\\n";
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
    t = Turnir()
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "ADDECHIPA":
            nume = data[i]; i += 1
            out.append(str(t.adaugaEchipa(nume)))
        elif cmd == "MECI":
            id1 = int(data[i]); id2 = int(data[i+1]); s1 = int(data[i+2]); s2 = int(data[i+3]); i += 4
            out.append("1" if t.inregistreazaMeci(id1, id2, s1, s2) else "0")
        elif cmd == "PUNCTE":
            id_ = int(data[i]); i += 1
            out.append(str(t.puncteEchipa(id_)))
        elif cmd == "PRIMA":
            out.append(str(t.primaEchipa()))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Echipa {
private:
    string nume;
    int puncte;
public:
    Echipa(string n = "") : nume(n), puncte(0) {}
    string getNume() { return nume; }
    int getPuncte() { return puncte; }
    void adaugaPuncte(int p) { puncte += p; }
};

class Turnir {
private:
    vector<Echipa> echipe;
public:
    int adaugaEchipa(string nume) {
        echipe.push_back(Echipa(nume));
        return echipe.size() - 1;
    }
    bool inregistreazaMeci(int id1, int id2, int s1, int s2) {
        if (id1 < 0 || id1 >= (int)echipe.size()) return false;
        if (id2 < 0 || id2 >= (int)echipe.size()) return false;
        if (s1 > s2) {
            echipe[id1].adaugaPuncte(3);
        } else if (s2 > s1) {
            echipe[id2].adaugaPuncte(3);
        } else {
            echipe[id1].adaugaPuncte(1);
            echipe[id2].adaugaPuncte(1);
        }
        return true;
    }
    int puncteEchipa(int id) {
        if (id < 0 || id >= (int)echipe.size()) return 0;
        return echipe[id].getPuncte();
    }
    string primaEchipa() {
        if (echipe.empty()) return "-";
        int best = 0;
        for (int i = 1; i < (int)echipe.size(); i++)
            if (echipe[i].getPuncte() > echipe[best].getPuncte()) best = i;
        return echipe[best].getNume();
    }
};
`,
    python: `class Echipa:
    def __init__(self, nume=""):
        self.__nume = nume
        self.__puncte = 0
    def getNume(self):
        return self.__nume
    def getPuncte(self):
        return self.__puncte
    def adaugaPuncte(self, p):
        self.__puncte += p

class Turnir:
    def __init__(self):
        self.__echipe = []
    def adaugaEchipa(self, nume):
        self.__echipe.append(Echipa(nume))
        return len(self.__echipe) - 1
    def inregistreazaMeci(self, id1, id2, s1, s2):
        if id1 < 0 or id1 >= len(self.__echipe):
            return False
        if id2 < 0 or id2 >= len(self.__echipe):
            return False
        if s1 > s2:
            self.__echipe[id1].adaugaPuncte(3)
        elif s2 > s1:
            self.__echipe[id2].adaugaPuncte(3)
        else:
            self.__echipe[id1].adaugaPuncte(1)
            self.__echipe[id2].adaugaPuncte(1)
        return True
    def puncteEchipa(self, id):
        if id < 0 or id >= len(self.__echipe):
            return 0
        return self.__echipe[id].getPuncte()
    def primaEchipa(self):
        if not self.__echipe:
            return "-"
        best = self.__echipe[0]
        for e in self.__echipe[1:]:
            if e.getPuncte() > best.getPuncte():
                best = e
        return best.getNume()
`,
  },
  tests: [
    "4\nADDECHIPA A\nADDECHIPA B\nMECI 0 1 2 1\nPUNCTE 0",
    "5\nADDECHIPA A\nADDECHIPA B\nMECI 0 1 1 1\nPUNCTE 0\nPUNCTE 1",
    "7\nADDECHIPA A\nADDECHIPA B\nADDECHIPA C\nMECI 0 1 3 0\nMECI 0 2 1 1\nPUNCTE 0\nPRIMA",
    "2\nMECI 0 1 1 0\nPRIMA",
  ],
  testLabels: [
    "meci castigat - 3 puncte echipei castigatoare",
    "meci egal - cate 1 punct fiecarei echipe",
    "o echipa cu mai multe meciuri isi acumuleaza punctele + clasament",
    "id-uri invalide (nicio echipa adaugata) - fara crash",
  ],
});

module.exports.problems8a = problems;

// ---------------- 22. MagazinOnline (Produs + Cos + Client + Magazin) ----------------
const problemsMagazin = [{
  slug: "oop-magazin-online",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Sistemul MagazinOnline (Produs + Cos + Client + Magazin)",
  difficulty: "facultate",
  tags: ["oop", "clasa", "sistem", "compunere", "magazin", "stoc"],
  statement:
    "Scrieti PATRU clase care modeleaza un magazin online, cu compunere pe mai multe niveluri:\n\n" +
    "1) Produs - nume (fara spatii), pret (intreg), stoc (intreg):\n" +
    "- constructor(nume, pret, stoc); getNume(); getPret(); getStoc(); scadeStoc(int cant) - daca stoc>=cant, scade si returneaza adevarat, altfel returneaza fals\n\n" +
    "2) Cos - un cos de cumparaturi, memoreaza intern perechi (idProdus, cantitate):\n" +
    "- constructor fara parametri\n" +
    "- adaugaLinie(idProdus, cantitate) - adauga o linie noua in cos\n" +
    "- linii() - returneaza colectia interna de perechi (idProdus, cantitate) - folosita doar de Magazin, nu de programul de test direct\n" +
    "- goleste() - elimina toate liniile\n\n" +
    "3) Client - nume, si un Cos PROPRIU (compunere 1-la-1, nu colectie):\n" +
    "- constructor(nume); getNume(); getCos() - returneaza obiectul Cos memorat intern\n\n" +
    "4) Magazin - orchestreaza produsele si clientii; TOATE comenzile programului de test trec doar prin Magazin (nu direct prin Cos/Produs):\n" +
    "- constructor fara parametri\n" +
    "- adaugaProdus(nume, pret, stoc) - returneaza id-ul produsului\n" +
    "- adaugaClient(nume) - returneaza id-ul clientului\n" +
    "- adaugaInCos(idClient, idProdus, cantitate) - daca id-urile sunt valide SI stocul curent al produsului este >= cantitate, adauga linia in cosul clientului si returneaza adevarat (NU scade stocul acum - doar verifica ca ar fi posibil); altfel returneaza fals\n" +
    "- totalCos(idClient) - returneaza suma (pret*cantitate) pentru toate liniile din cosul clientului\n" +
    "- finalizeazaComanda(idClient) - RE-VERIFICA, la momentul finalizarii, ca fiecare produs din cos are inca stoc suficient (poate sa nu mai aiba, daca alt client a golit stocul intre timp); daca TOATE produsele au stoc suficient: scade efectiv stocul pentru fiecare, goleste cosul si returneaza adevarat; daca macar UN produs nu mai are stoc suficient: NU modifica nimic (nici stocurile, nici cosul) si returneaza fals\n" +
    "- stocProdus(idProdus) - returneaza stocul curent al produsului",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "Cel mult 20 produse, 20 clienti, 20 linii per cos.",
  hints: "Stocul se verifica DE DOUA ORI: o data (superficial) la adaugaInCos, si din nou (cu adevarat, inainte de a scadea) la finalizeazaComanda - pentru ca intre timp alt client ar fi putut sa cumpere acelasi produs.",
  explanation: "Cel mai bogat sistem din capitol dupa CatalogScolar: 4 clase, 3 niveluri de compunere (Magazin->Client->Cos, Magazin->Produs), si o regula de business reala (verificare de stoc la doua momente diferite) care nu poate fi testata cu o singura comanda - are nevoie de o secventa intreaga ca sa se manifeste.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Magazin m;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "ADDPRODUS") {
            string nume; long long pret, stoc;
            cin >> nume >> pret >> stoc;
            cout << m.adaugaProdus(nume, pret, stoc) << "\\n";
        } else if (cmd == "ADDCLIENT") {
            string nume; cin >> nume;
            cout << m.adaugaClient(nume) << "\\n";
        } else if (cmd == "ADDCOS") {
            int idC, idP; long long cant;
            cin >> idC >> idP >> cant;
            cout << (m.adaugaInCos(idC, idP, cant) ? 1 : 0) << "\\n";
        } else if (cmd == "TOTALCOS") {
            int idC; cin >> idC;
            cout << m.totalCos(idC) << "\\n";
        } else if (cmd == "FINALIZEAZA") {
            int idC; cin >> idC;
            cout << (m.finalizeazaComanda(idC) ? 1 : 0) << "\\n";
        } else if (cmd == "STOC") {
            int idP; cin >> idP;
            cout << m.stocProdus(idP) << "\\n";
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
    m = Magazin()
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "ADDPRODUS":
            nume = data[i]; pret = int(data[i+1]); stoc = int(data[i+2]); i += 3
            out.append(str(m.adaugaProdus(nume, pret, stoc)))
        elif cmd == "ADDCLIENT":
            nume = data[i]; i += 1
            out.append(str(m.adaugaClient(nume)))
        elif cmd == "ADDCOS":
            idC = int(data[i]); idP = int(data[i+1]); cant = int(data[i+2]); i += 3
            out.append("1" if m.adaugaInCos(idC, idP, cant) else "0")
        elif cmd == "TOTALCOS":
            idC = int(data[i]); i += 1
            out.append(str(m.totalCos(idC)))
        elif cmd == "FINALIZEAZA":
            idC = int(data[i]); i += 1
            out.append("1" if m.finalizeazaComanda(idC) else "0")
        elif cmd == "STOC":
            idP = int(data[i]); i += 1
            out.append(str(m.stocProdus(idP)))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Produs {
private:
    string nume;
    long long pret, stoc;
public:
    Produs(string n = "", long long p = 0, long long s = 0) : nume(n), pret(p), stoc(s) {}
    string getNume() { return nume; }
    long long getPret() { return pret; }
    long long getStoc() { return stoc; }
    bool scadeStoc(long long cant) {
        if (stoc < cant) return false;
        stoc -= cant;
        return true;
    }
};

class Cos {
private:
    vector<pair<int, long long>> liniiInterne;
public:
    void adaugaLinie(int idProdus, long long cantitate) {
        liniiInterne.push_back({idProdus, cantitate});
    }
    vector<pair<int, long long>>& linii() { return liniiInterne; }
    void goleste() { liniiInterne.clear(); }
};

class Client {
private:
    string nume;
    Cos cos;
public:
    Client(string n = "") : nume(n) {}
    string getNume() { return nume; }
    Cos& getCos() { return cos; }
};

class Magazin {
private:
    vector<Produs> produse;
    vector<Client> clienti;
public:
    int adaugaProdus(string nume, long long pret, long long stoc) {
        produse.push_back(Produs(nume, pret, stoc));
        return produse.size() - 1;
    }
    int adaugaClient(string nume) {
        clienti.push_back(Client(nume));
        return clienti.size() - 1;
    }
    bool adaugaInCos(int idClient, int idProdus, long long cantitate) {
        if (idClient < 0 || idClient >= (int)clienti.size()) return false;
        if (idProdus < 0 || idProdus >= (int)produse.size()) return false;
        if (produse[idProdus].getStoc() < cantitate) return false;
        clienti[idClient].getCos().adaugaLinie(idProdus, cantitate);
        return true;
    }
    long long totalCos(int idClient) {
        if (idClient < 0 || idClient >= (int)clienti.size()) return 0;
        long long s = 0;
        for (auto& linie : clienti[idClient].getCos().linii())
            s += produse[linie.first].getPret() * linie.second;
        return s;
    }
    bool finalizeazaComanda(int idClient) {
        if (idClient < 0 || idClient >= (int)clienti.size()) return false;
        auto& linii = clienti[idClient].getCos().linii();
        for (auto& linie : linii)
            if (produse[linie.first].getStoc() < linie.second) return false;
        for (auto& linie : linii)
            produse[linie.first].scadeStoc(linie.second);
        clienti[idClient].getCos().goleste();
        return true;
    }
    long long stocProdus(int idProdus) {
        if (idProdus < 0 || idProdus >= (int)produse.size()) return 0;
        return produse[idProdus].getStoc();
    }
};
`,
    python: `class Produs:
    def __init__(self, nume="", pret=0, stoc=0):
        self.__nume = nume
        self.__pret = pret
        self.__stoc = stoc
    def getNume(self):
        return self.__nume
    def getPret(self):
        return self.__pret
    def getStoc(self):
        return self.__stoc
    def scadeStoc(self, cant):
        if self.__stoc < cant:
            return False
        self.__stoc -= cant
        return True

class Cos:
    def __init__(self):
        self.__linii = []
    def adaugaLinie(self, idProdus, cantitate):
        self.__linii.append((idProdus, cantitate))
    def linii(self):
        return self.__linii
    def goleste(self):
        self.__linii = []

class Client:
    def __init__(self, nume=""):
        self.__nume = nume
        self.__cos = Cos()
    def getNume(self):
        return self.__nume
    def getCos(self):
        return self.__cos

class Magazin:
    def __init__(self):
        self.__produse = []
        self.__clienti = []
    def adaugaProdus(self, nume, pret, stoc):
        self.__produse.append(Produs(nume, pret, stoc))
        return len(self.__produse) - 1
    def adaugaClient(self, nume):
        self.__clienti.append(Client(nume))
        return len(self.__clienti) - 1
    def adaugaInCos(self, idClient, idProdus, cantitate):
        if idClient < 0 or idClient >= len(self.__clienti):
            return False
        if idProdus < 0 or idProdus >= len(self.__produse):
            return False
        if self.__produse[idProdus].getStoc() < cantitate:
            return False
        self.__clienti[idClient].getCos().adaugaLinie(idProdus, cantitate)
        return True
    def totalCos(self, idClient):
        if idClient < 0 or idClient >= len(self.__clienti):
            return 0
        s = 0
        for idProdus, cant in self.__clienti[idClient].getCos().linii():
            s += self.__produse[idProdus].getPret() * cant
        return s
    def finalizeazaComanda(self, idClient):
        if idClient < 0 or idClient >= len(self.__clienti):
            return False
        linii = self.__clienti[idClient].getCos().linii()
        for idProdus, cant in linii:
            if self.__produse[idProdus].getStoc() < cant:
                return False
        for idProdus, cant in linii:
            self.__produse[idProdus].scadeStoc(cant)
        self.__clienti[idClient].getCos().goleste()
        return True
    def stocProdus(self, idProdus):
        if idProdus < 0 or idProdus >= len(self.__produse):
            return 0
        return self.__produse[idProdus].getStoc()
`,
  },
  tests: [
    "5\nADDPRODUS Laptop 1000 5\nADDCLIENT Popescu\nADDCOS 0 0 2\nTOTALCOS 0\nSTOC 0",
    "4\nADDPRODUS Laptop 1000 5\nADDCLIENT Popescu\nADDCOS 0 0 10\nTOTALCOS 0",
    "6\nADDPRODUS Laptop 1000 5\nADDCLIENT Popescu\nADDCOS 0 0 2\nFINALIZEAZA 0\nSTOC 0\nTOTALCOS 0",
    "9\nADDPRODUS Laptop 1000 3\nADDCLIENT A\nADDCLIENT B\nADDCOS 0 0 2\nADDCOS 1 0 2\nFINALIZEAZA 0\nSTOC 0\nFINALIZEAZA 1\nSTOC 0",
    "3\nADDPRODUS Mouse 50 10\nADDCLIENT X\nTOTALCOS 0",
  ],
  testLabels: [
    "adaugaInCos valid - stocul NU se scade inca (doar la finalizare)",
    "adaugaInCos cu cantitate mai mare decat stocul e respins",
    "finalizeazaComanda valida - scade stocul, goleste cosul",
    "doi clienti concureaza pe acelasi stoc limitat - al doilea finalizeaza si esueaza la re-verificare",
    "totalCos pe un cos gol",
  ],
}];
module.exports.problems8b = problemsMagazin;

// ---------------- 23. RezervareHotel (Camera + Rezervare + Hotel) ----------------
const problemsHotel = [{
  slug: "oop-rezervare-hotel",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Sistemul RezervareHotel (Camera + Rezervare + Hotel)",
  difficulty: "facultate",
  tags: ["oop", "clasa", "sistem", "hotel", "istoric"],
  statement:
    "Scrieti TREI clase:\n\n" +
    "1) Camera - capacitate (intreg), disponibila (bool, initial adevarat):\n" +
    "- constructor(capacitate); getCapacitate(); esteDisponibila(); seteazaDisponibila(bool val)\n\n" +
    "2) Rezervare - o inregistrare istorica: idCamera, numeClient (fara spatii), nrNopti:\n" +
    "- constructor(idCamera, numeClient, nrNopti); getIdCamera(); getNumeClient(); getNrNopti()\n\n" +
    "3) Hotel - orchestreaza camerele si PASTREAZA UN ISTORIC PERMANENT al tuturor rezervarilor (istoricul NU se sterge niciodata, nici cand o camera e eliberata):\n" +
    "- constructor fara parametri\n" +
    "- adaugaCamera(capacitate) - returneaza id-ul camerei\n" +
    "- rezerva(idCamera, numeClient, nrNopti) - daca id-ul e valid SI camera e disponibila: o marcheaza indisponibila, ADAUGA o Rezervare in istoric si returneaza adevarat; altfel returneaza fals si NU adauga nimic in istoric\n" +
    "- elibereaza(idCamera) - daca id-ul e valid SI camera e indisponibila: o marcheaza disponibila (istoricul ramane neschimbat) si returneaza adevarat; altfel returneaza fals\n" +
    "- camereLibere() - returneaza numarul de camere curent disponibile\n" +
    "- venitTotal(pretPeNoapte) - returneaza suma (nrNopti*pretPeNoapte) pentru TOATE rezervarile din istoric, inclusiv cele ale camerelor deja eliberate\n" +
    "- numarRezervariCamera(idCamera) - returneaza de cate ori apare acea camera in istoric (in total, indiferent daca e curent libera sau ocupata)",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "Cel mult 20 camere, 100 rezervari in istoric.",
  hints: "venitTotal si numarRezervariCamera se calculeaza din ISTORIC (care nu se modifica la eliberare), NU din starea curenta a camerelor.",
  explanation: "Introduce o distinctie noua fata de sistemele anterioare: starea LIVE (disponibila/indisponibila, care se schimba) versus un ISTORIC PERMANENT (care doar creste, niciodata nu se modifica retroactiv) - o distinctie reala si importanta in sistemele OOP (de exemplu intre 'starea curenta a unui cos' si 'istoricul comenzilor').",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Hotel h;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "ADDCAMERA") {
            long long cap; cin >> cap;
            cout << h.adaugaCamera(cap) << "\\n";
        } else if (cmd == "REZERVA") {
            int idCam; string nume; long long nopti;
            cin >> idCam >> nume >> nopti;
            cout << (h.rezerva(idCam, nume, nopti) ? 1 : 0) << "\\n";
        } else if (cmd == "ELIBEREAZA") {
            int idCam; cin >> idCam;
            cout << (h.elibereaza(idCam) ? 1 : 0) << "\\n";
        } else if (cmd == "LIBERE") {
            cout << h.camereLibere() << "\\n";
        } else if (cmd == "VENIT") {
            long long pret; cin >> pret;
            cout << h.venitTotal(pret) << "\\n";
        } else if (cmd == "NRREZ") {
            int idCam; cin >> idCam;
            cout << h.numarRezervariCamera(idCam) << "\\n";
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
    h = Hotel()
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "ADDCAMERA":
            cap = int(data[i]); i += 1
            out.append(str(h.adaugaCamera(cap)))
        elif cmd == "REZERVA":
            idCam = int(data[i]); nume = data[i+1]; nopti = int(data[i+2]); i += 3
            out.append("1" if h.rezerva(idCam, nume, nopti) else "0")
        elif cmd == "ELIBEREAZA":
            idCam = int(data[i]); i += 1
            out.append("1" if h.elibereaza(idCam) else "0")
        elif cmd == "LIBERE":
            out.append(str(h.camereLibere()))
        elif cmd == "VENIT":
            pret = int(data[i]); i += 1
            out.append(str(h.venitTotal(pret)))
        elif cmd == "NRREZ":
            idCam = int(data[i]); i += 1
            out.append(str(h.numarRezervariCamera(idCam)))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Camera {
private:
    long long capacitate;
    bool disponibila;
public:
    Camera(long long c = 0) : capacitate(c), disponibila(true) {}
    long long getCapacitate() { return capacitate; }
    bool esteDisponibila() { return disponibila; }
    void seteazaDisponibila(bool val) { disponibila = val; }
};

class Rezervare {
private:
    int idCamera;
    string numeClient;
    long long nrNopti;
public:
    Rezervare(int idCam, string nume, long long nopti) : idCamera(idCam), numeClient(nume), nrNopti(nopti) {}
    int getIdCamera() { return idCamera; }
    string getNumeClient() { return numeClient; }
    long long getNrNopti() { return nrNopti; }
};

class Hotel {
private:
    vector<Camera> camere;
    vector<Rezervare> istoric;
public:
    int adaugaCamera(long long capacitate) {
        camere.push_back(Camera(capacitate));
        return camere.size() - 1;
    }
    bool rezerva(int idCamera, string numeClient, long long nrNopti) {
        if (idCamera < 0 || idCamera >= (int)camere.size()) return false;
        if (!camere[idCamera].esteDisponibila()) return false;
        camere[idCamera].seteazaDisponibila(false);
        istoric.push_back(Rezervare(idCamera, numeClient, nrNopti));
        return true;
    }
    bool elibereaza(int idCamera) {
        if (idCamera < 0 || idCamera >= (int)camere.size()) return false;
        if (camere[idCamera].esteDisponibila()) return false;
        camere[idCamera].seteazaDisponibila(true);
        return true;
    }
    int camereLibere() {
        int c = 0;
        for (auto& cam : camere) if (cam.esteDisponibila()) c++;
        return c;
    }
    long long venitTotal(long long pretPeNoapte) {
        long long s = 0;
        for (auto& r : istoric) s += r.getNrNopti() * pretPeNoapte;
        return s;
    }
    int numarRezervariCamera(int idCamera) {
        int c = 0;
        for (auto& r : istoric) if (r.getIdCamera() == idCamera) c++;
        return c;
    }
};
`,
    python: `class Camera:
    def __init__(self, capacitate=0):
        self.__capacitate = capacitate
        self.__disponibila = True
    def getCapacitate(self):
        return self.__capacitate
    def esteDisponibila(self):
        return self.__disponibila
    def seteazaDisponibila(self, val):
        self.__disponibila = val

class Rezervare:
    def __init__(self, idCamera, numeClient, nrNopti):
        self.__idCamera = idCamera
        self.__numeClient = numeClient
        self.__nrNopti = nrNopti
    def getIdCamera(self):
        return self.__idCamera
    def getNumeClient(self):
        return self.__numeClient
    def getNrNopti(self):
        return self.__nrNopti

class Hotel:
    def __init__(self):
        self.__camere = []
        self.__istoric = []
    def adaugaCamera(self, capacitate):
        self.__camere.append(Camera(capacitate))
        return len(self.__camere) - 1
    def rezerva(self, idCamera, numeClient, nrNopti):
        if idCamera < 0 or idCamera >= len(self.__camere):
            return False
        if not self.__camere[idCamera].esteDisponibila():
            return False
        self.__camere[idCamera].seteazaDisponibila(False)
        self.__istoric.append(Rezervare(idCamera, numeClient, nrNopti))
        return True
    def elibereaza(self, idCamera):
        if idCamera < 0 or idCamera >= len(self.__camere):
            return False
        if self.__camere[idCamera].esteDisponibila():
            return False
        self.__camere[idCamera].seteazaDisponibila(True)
        return True
    def camereLibere(self):
        return sum(1 for c in self.__camere if c.esteDisponibila())
    def venitTotal(self, pretPeNoapte):
        return sum(r.getNrNopti() * pretPeNoapte for r in self.__istoric)
    def numarRezervariCamera(self, idCamera):
        return sum(1 for r in self.__istoric if r.getIdCamera() == idCamera)
`,
  },
  tests: [
    "4\nADDCAMERA 2\nREZERVA 0 Popescu 3\nLIBERE\nVENIT 100",
    "6\nADDCAMERA 2\nREZERVA 0 Popescu 3\nELIBEREAZA 0\nLIBERE\nVENIT 100\nNRREZ 0",
    "7\nADDCAMERA 2\nREZERVA 0 Popescu 3\nELIBEREAZA 0\nREZERVA 0 Ionescu 2\nVENIT 100\nNRREZ 0\nLIBERE",
    "4\nADDCAMERA 2\nREZERVA 0 Popescu 3\nREZERVA 0 Ionescu 1\nVENIT 100",
    "2\nELIBEREAZA 5\nLIBERE",
  ],
  testLabels: [
    "rezervare de baza - camera ocupata, venit calculat din istoric",
    "eliberare - camera redevine libera, dar venitul din istoric NU scade",
    "rezervare noua dupa eliberare - istoricul acumuleaza (2 rezervari, venit insumat)",
    "rezervare pe camera deja ocupata esueaza - NU intra in istoric (venitul nu creste)",
    "id invalid - fara crash",
  ],
}];
module.exports.problems8c = problemsHotel;

if (require.main === module) {
  runMain([...problems, ...problemsMagazin, ...problemsHotel], LEVEL, SRC);
}
