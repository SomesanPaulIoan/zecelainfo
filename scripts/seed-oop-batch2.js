const { runMain } = require("./lib/oop-runner");

const LEVEL = "oop";
const SRC = "Zece la Info - OOP (probleme originale)";
const CH = "oop-colectii-interne";
const SUB = "validare-si-colectii";

const problems = [];

// ---------------- 4. ListaNote ----------------
problems.push({
  slug: "oop-lista-note",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Clasa ListaNote",
  difficulty: "medium",
  tags: ["oop", "clasa", "colectie", "validare", "medie"],
  statement:
    "Scrieti o clasa ListaNote care memoreaza intern o colectie de note (numere reale) ale unui elev la o materie, cu urmatoarele functionalitati:\n" +
    "- constructor fara parametri (lista incepe goala)\n" +
    "- adaugaNota(double n) - adauga nota n DOAR daca 1 <= n <= 10; returneaza adevarat daca a adaugat, fals altfel\n" +
    "- medie() - returneaza media aritmetica a notelor adaugate; daca lista e goala, returneaza 0\n" +
    "- notaMaxima() - returneaza cea mai mare nota; daca lista e goala, returneaza -1\n" +
    "- notaMinima() - returneaza cea mai mica nota; daca lista e goala, returneaza -1\n" +
    "- numarNote() - returneaza cate note valide au fost adaugate",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "Notele testate au cel mult 2 zecimale.",
  hints: "Nu uitati cazul special: lista goala pentru medie/max/min.",
  explanation: "Clasa gestioneaza o colectie interna (vector/listă) in loc de un singur camp, plus validare la adaugare si cazuri speciale pentru colectia goala.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    cout << fixed << setprecision(2);
    int T;
    cin >> T;
    ListaNote ln;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "ADD") {
            double n; cin >> n;
            cout << (ln.adaugaNota(n) ? 1 : 0) << "\\n";
        } else if (cmd == "MEDIE") {
            cout << ln.medie() << "\\n";
        } else if (cmd == "MAX") {
            cout << ln.notaMaxima() << "\\n";
        } else if (cmd == "MIN") {
            cout << ln.notaMinima() << "\\n";
        } else if (cmd == "COUNT") {
            cout << ln.numarNote() << "\\n";
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
    ln = ListaNote()
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "ADD":
            n = float(data[i]); i += 1
            out.append("1" if ln.adaugaNota(n) else "0")
        elif cmd == "MEDIE":
            out.append(f"{ln.medie():.2f}")
        elif cmd == "MAX":
            out.append(f"{ln.notaMaxima():.2f}")
        elif cmd == "MIN":
            out.append(f"{ln.notaMinima():.2f}")
        elif cmd == "COUNT":
            out.append(str(ln.numarNote()))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class ListaNote {
private:
    vector<double> note;
public:
    bool adaugaNota(double n) {
        if (n < 1 || n > 10) return false;
        note.push_back(n);
        return true;
    }
    double medie() {
        if (note.empty()) return 0;
        double s = 0;
        for (double n : note) s += n;
        return s / note.size();
    }
    double notaMaxima() {
        if (note.empty()) return -1;
        double m = note[0];
        for (double n : note) m = max(m, n);
        return m;
    }
    double notaMinima() {
        if (note.empty()) return -1;
        double m = note[0];
        for (double n : note) m = min(m, n);
        return m;
    }
    int numarNote() { return note.size(); }
};
`,
    python: `class ListaNote:
    def __init__(self):
        self.__note = []
    def adaugaNota(self, n):
        if n < 1 or n > 10:
            return False
        self.__note.append(n)
        return True
    def medie(self):
        if not self.__note:
            return 0
        return sum(self.__note) / len(self.__note)
    def notaMaxima(self):
        if not self.__note:
            return -1
        return max(self.__note)
    def notaMinima(self):
        if not self.__note:
            return -1
        return min(self.__note)
    def numarNote(self):
        return len(self.__note)
`,
  },
  tests: [
    "5\nADD 7\nADD 8\nADD 9\nMEDIE\nCOUNT",
    "3\nADD 0\nADD 11\nCOUNT",
    "5\nADD 4\nADD 9\nADD 6\nMAX\nMIN",
    "3\nMEDIE\nMAX\nMIN",
    "6\nADD 7.5\nADD 8.25\nADD 6.25\nMEDIE\nMAX\nMIN",
  ],
  testLabels: [
    "adaugare valida + medie/count de baza",
    "note invalide (0 si 11) sunt respinse, count ramane 0",
    "max/min pe un set amestecat",
    "cazul special: lista goala (medie=0, max=min=-1)",
    "note cu zecimale",
  ],
});

// ---------------- 5. Stiva ----------------
problems.push({
  slug: "oop-stiva",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Clasa Stiva (LIFO)",
  difficulty: "medium",
  tags: ["oop", "clasa", "stiva", "colectie"],
  statement:
    "Scrieti o clasa Stiva care implementeaza o stiva de numere intregi (structura LIFO - Last In First Out), memorand intern elementele intr-o colectie, cu urmatoarele functionalitati:\n" +
    "- constructor fara parametri (stiva incepe goala)\n" +
    "- push(int x) - adauga x in varful stivei\n" +
    "- pop() - scoate si returneaza elementul din varf (se apeleaza doar cand stiva NU e goala)\n" +
    "- varf() - returneaza (fara sa scoata) elementul din varf (se apeleaza doar cand stiva NU e goala)\n" +
    "- esteGoala() - returneaza adevarat daca stiva nu are elemente\n" +
    "- dimensiune() - returneaza numarul curent de elemente",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre. Programul de test verifica esteGoala() inainte de a apela pop()/varf().",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "-1.000.000.000 <= x <= 1.000.000.000",
  hints: "Nu folositi un tablou de dimensiune fixa - folositi o colectie care creste dinamic (vector/list).",
  explanation: "Introduce o structura de date clasica (LIFO) implementata ca membru intern al clasei, cu esteGoala() ca metoda de garda apelata explicit de programul de test inainte de operatiile care ar fi nedefinite pe o stiva goala.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    Stiva s;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "PUSH") {
            long long x; cin >> x;
            s.push(x);
            cout << "OK\\n";
        } else if (cmd == "POP") {
            if (s.esteGoala()) cout << "GOALA\\n";
            else cout << s.pop() << "\\n";
        } else if (cmd == "VARF") {
            if (s.esteGoala()) cout << "GOALA\\n";
            else cout << s.varf() << "\\n";
        } else if (cmd == "DIM") {
            cout << s.dimensiune() << "\\n";
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
    s = Stiva()
    out = []
    for _ in range(T):
        cmd = data[i]; i += 1
        if cmd == "PUSH":
            x = int(data[i]); i += 1
            s.push(x)
            out.append("OK")
        elif cmd == "POP":
            out.append("GOALA" if s.esteGoala() else str(s.pop()))
        elif cmd == "VARF":
            out.append("GOALA" if s.esteGoala() else str(s.varf()))
        elif cmd == "DIM":
            out.append(str(s.dimensiune()))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class Stiva {
private:
    vector<long long> elemente;
public:
    void push(long long x) { elemente.push_back(x); }
    long long pop() {
        long long x = elemente.back();
        elemente.pop_back();
        return x;
    }
    long long varf() { return elemente.back(); }
    bool esteGoala() { return elemente.empty(); }
    int dimensiune() { return elemente.size(); }
};
`,
    python: `class Stiva:
    def __init__(self):
        self.__elemente = []
    def push(self, x):
        self.__elemente.append(x)
    def pop(self):
        return self.__elemente.pop()
    def varf(self):
        return self.__elemente[-1]
    def esteGoala(self):
        return len(self.__elemente) == 0
    def dimensiune(self):
        return len(self.__elemente)
`,
  },
  tests: [
    "6\nPUSH 1\nPUSH 2\nPUSH 3\nPOP\nPOP\nPOP",
    "1\nPOP",
    "8\nPUSH 5\nVARF\nPUSH 9\nVARF\nDIM\nPOP\nDIM\nVARF",
    "5\nPUSH 1\nPUSH 2\nPOP\nPOP\nPOP",
  ],
  testLabels: [
    "push/pop secvential - verifica ordinea LIFO",
    "pop pe stiva goala imediat dupa constructie",
    "amestec push/varf/pop cu dimensiune urmarita corect",
    "push, push, pop, pop, apoi inca un pop pe stiva golita (limita)",
  ],
});

// ---------------- 6. ContBancar ----------------
problems.push({
  slug: "oop-cont-bancar",
  chapterId: CH,
  subcategoryId: SUB,
  title: "Clasa ContBancar",
  difficulty: "medium",
  tags: ["oop", "clasa", "validare", "cont", "tranzactii"],
  statement:
    "Scrieti o clasa ContBancar care memoreaza soldul curent (numar intreg) al unui cont si numarul de tranzactii reusite efectuate, cu urmatoarele functionalitati:\n" +
    "- constructor cu un parametru: soldInitial (>= 0)\n" +
    "- depune(int suma) - daca suma > 0, adauga suma la sold, incrementeaza numarul de tranzactii si returneaza adevarat; altfel returneaza fals si nu modifica nimic\n" +
    "- retrage(int suma) - daca suma > 0 SI suma <= soldul curent, scade suma din sold, incrementeaza numarul de tranzactii si returneaza adevarat; altfel returneaza fals si nu modifica nimic\n" +
    "- getSold() - returneaza soldul curent\n" +
    "- numarTranzactii() - returneaza numarul de operatii (depuneri+retrageri) reusite de la crearea contului",
  input_format: "Codul vostru este integrat intr-un program de test care citeste comenzi si apeleaza metodele voastre.",
  output_format: "Fiecare comanda produce o linie de output.",
  constraints: "0 <= sold, suma <= 1.000.000.000",
  hints: "numarTranzactii() numara doar operatiile care au REUSIT (au returnat adevarat), nu toate incercarile.",
  explanation: "Combina validare de business logic (fonduri insuficiente) cu un contor intern care trebuie actualizat doar in ramura de succes.",
  langs: ["cpp", "python"],
  templates: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
__USER_CODE__
int main() {
    int T;
    cin >> T;
    ContBancar* c = nullptr;
    while (T--) {
        string cmd;
        cin >> cmd;
        if (cmd == "NEW") {
            long long s; cin >> s;
            if (c) delete c;
            c = new ContBancar(s);
            cout << "OK\\n";
        } else if (cmd == "DEPUNE") {
            long long s; cin >> s;
            bool ok = c->depune(s);
            cout << (ok ? 1 : 0) << " " << c->getSold() << "\\n";
        } else if (cmd == "RETRAGE") {
            long long s; cin >> s;
            bool ok = c->retrage(s);
            cout << (ok ? 1 : 0) << " " << c->getSold() << "\\n";
        } else if (cmd == "TRANZACTII") {
            cout << c->numarTranzactii() << "\\n";
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
            s = int(data[i]); i += 1
            c = ContBancar(s)
            out.append("OK")
        elif cmd == "DEPUNE":
            s = int(data[i]); i += 1
            ok = c.depune(s)
            out.append(f"{1 if ok else 0} {c.getSold()}")
        elif cmd == "RETRAGE":
            s = int(data[i]); i += 1
            ok = c.retrage(s)
            out.append(f"{1 if ok else 0} {c.getSold()}")
        elif cmd == "TRANZACTII":
            out.append(str(c.numarTranzactii()))
    print("\\n".join(out))
main()
`,
  },
  solutions: {
    cpp: `class ContBancar {
private:
    long long sold;
    int tranzactii;
public:
    ContBancar(long long s) : sold(s), tranzactii(0) {}
    bool depune(long long s) {
        if (s <= 0) return false;
        sold += s;
        tranzactii++;
        return true;
    }
    bool retrage(long long s) {
        if (s <= 0 || s > sold) return false;
        sold -= s;
        tranzactii++;
        return true;
    }
    long long getSold() { return sold; }
    int numarTranzactii() { return tranzactii; }
};
`,
    python: `class ContBancar:
    def __init__(self, sold):
        self.__sold = sold
        self.__tranzactii = 0
    def depune(self, s):
        if s <= 0:
            return False
        self.__sold += s
        self.__tranzactii += 1
        return True
    def retrage(self, s):
        if s <= 0 or s > self.__sold:
            return False
        self.__sold -= s
        self.__tranzactii += 1
        return True
    def getSold(self):
        return self.__sold
    def numarTranzactii(self):
        return self.__tranzactii
`,
  },
  tests: [
    "3\nNEW 100\nDEPUNE 50\nTRANZACTII",
    "3\nNEW 100\nRETRAGE 40\nTRANZACTII",
    "3\nNEW 100\nRETRAGE 500\nTRANZACTII",
    "3\nNEW 100\nDEPUNE -10\nTRANZACTII",
    "5\nNEW 1000000000\nDEPUNE 1000000000\nRETRAGE 1500000000\nTRANZACTII\nRETRAGE 500000000",
  ],
  testLabels: [
    "depunere valida creste sold si tranzactii",
    "retragere valida in limita soldului",
    "retragere peste sold e respinsa, sold/tranzactii neschimbate",
    "depunere invalida (suma negativa) e respinsa",
    "valori mari + secventa depune apoi retrage la limita soldului",
  ],
});

module.exports.problems2 = problems;

if (require.main === module) {
  runMain(problems, LEVEL, SRC);
}
