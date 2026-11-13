/**
 * Review-urile cursurilor preluate de pe vechea platforma (scrise de elevi), afisate pe pagina cursului
 * si pe paginile /pachete. Review-urile noi lasate pe site vin din API (`/api/courses/<slug>/reviews`).
 */

export type CourseReview = {
  author: string;
  date: string;
  title: string;
  content: string;
  rating: number;
};

export const UBB_COURSE_SLUG = "curs-admitere-ubb";
export const UB_UNSTPB_COURSE_SLUG = "curs-admitere-ub-unstpb";
export const BAC_COURSE_SLUG = "curs-bacalaureat-informatica-mi";
export const UAIC_TUIASI_COURSE_SLUG = "curs-admitere-uaic-tuiasi";

export const UBB_REVIEWS: CourseReview[] = [
  {
    author: "Alin Oniga",
    date: "2025-07-05",
    title: 'Un "cheat code" pentru admiterea la UBB',
    content:
      "Am facut cursul de pregatire al lui Paul pentru admiterea la UBB si mi-a placut mult. Serverul de Discord e plin de oameni pasionati care sar sa te ajute, iar Paul raspunde rapid la orice intrebare. Cursul e foarte detaliat, explica tot pas cu pas si are multe exercitii practice. M-a ajutat sa inteleg materia si sa fiu mai increzator la teste. Recomand oricui vrea sa intre la Informatica!",
    rating: 5,
  },
  {
    author: "Carmen Oprinescu",
    date: "2024-07-24",
    title: "Un curs demn de nota 10!",
    content:
      "Cursul este foarte bine structurat si cuprinde tot ceea ce ai nevoie pentru admiterea la UBB, de la elemente de baza pana la cel mai mic amanunt. Explicatiile sunt foarte clare atat in modulul teoretic, cat si in cel practic, unde sunt rezolvate diverse grile dificile si subiecte din anii trecuti. Acest curs m-a ajutat mult in pregatirea pentru examen, am fost admisa la prima optiune aleasa. Recomand cu cea mai mare incredere!",
    rating: 5,
  },
  {
    author: "Mihai Tira",
    date: "2024-07-20",
    title: "Cel mai top material de pregatire pentru UBB",
    content:
      "Cursul contine absolut toate materialele, de la cele mai de baza lucruri, pana la algoritmi avansati/obscuri, toate acestea fiind predate la un nivel foarte accesibil, cu explicatii oferite la fiecare pas. Totusi, pe langa cursul in sine, comunitatea este excelenta si asigura o competitie sanatoasa, prin care iti vei ridica 100% standardele. TL;dR: isi merita banii :)))",
    rating: 5,
  },
  {
    author: "Lupu Petrisor",
    date: "2024-07-03",
    title: "Cea mai eficienta cale pentru pregatirea la informatica",
    content:
      "Cursul a acoperit in detaliu toate temele esentiale pentru examenul de admitere. Materialele de curs au fost bine structurate si actualizate, oferind atat teorie, cat si numeroase exercitii practice. De asemenea, suportul este valabil 24/7, un lucru foarte pretios pentru elevii ce intampina probleme in intelegerea conceptelor. Acestia pot obtine un raspuns imediat atat din partea lui Paul, cat si din partea celorlalti membri ai comunitatii. Recomand cu incredere acest curs celor ce doresc sa isi consolideze cunostintele pentru examene.",
    rating: 5,
  },
  {
    author: "Alex Bancila",
    date: "2024-07-02",
    title: "Extrem de util!",
    content:
      'Cu siguranta merita cumparat daca iti doresti o nota buna in admitere si nu doar pentru UBB, pentru toate universitatile din intreaga tara, deoarece contine intreaga materie care ar fi trebuit predata la liceu, dar de care multi ducem lipsa. Pe scurt, "Zece la Examene" isi merita pe deplin numele.',
    rating: 5,
  },
  {
    author: "Andreea Pui",
    date: "2024-07-02",
    title: "Un curs foarte util si bine structurat!",
    content:
      "Este un curs foarte complex si util atat in pregatirea pentru admitere, cat si pentru a-ti consolida cunostintele dobandite pe parcursul anilor de liceu. Nota 10!",
    rating: 5,
  },
  {
    author: "Patricia Tatar",
    date: "2024-07-02",
    title: "Un curs foarte bun",
    content:
      "Este un curs complex atat pentru incepatori cat si pentru avansati, care mi-a completat cunostintele de la clasa. Cuprinde toata materia necesara admiterii. Teoria este explicata in detaliu, iar grilele te ajuta sa te pregatesti pentru examen. Recomand cu incredere!",
    rating: 5,
  },
  {
    author: "Bogdan Chis",
    date: "2024-07-02",
    title: "Cel mai bun curs pentru pregatirea la informatica",
    content:
      "Invatamantul preuniversitar are multe lacune la informatica. Cu ajutorul acestui curs am reusit sa iau o nota foarte buna in Examenul de Admitere FMI UBB si pot spune ca a fost factorul decisiv. Materialele sunt explicate clar, concis si foarte bine argumentat.",
    rating: 5,
  },
  {
    author: "Razvan Filote",
    date: "2024-07-02",
    title: "Cel mai bun curs pentru admitere",
    content: "Contine toate informatiile necesare pentru a lua o nota buna in examen.",
    rating: 5,
  },
  {
    author: "Alexandru Paval",
    date: "2024-07-02",
    title: "Cursul acesta este o necesitate!",
    content:
      "Am luat o nota mediocra la concursul din primavara, dar dupa ce am parcurs toate cele peste 30 de ore din curs, mi-am crescut nivelul extraordinar de mult intr-un timp scurt. Recomand cu toata caldura acest curs exceptional!",
    rating: 5,
  },
  {
    author: "Alexandru Peter",
    date: "2024-07-02",
    title: "Exceptional pentru pregatire!",
    content:
      "Daca te situezi la un nivel mai slab, dar doresti sa fii admis la UBB, aceasta este una dintre cele mai bune alegeri. Materia este explicata clar, inclusiv algoritmii mai performanti.",
    rating: 5,
  },
  {
    author: "Raluca Popovici",
    date: "2024-07-02",
    title: "Super curs!",
    content:
      "Este un curs foarte bun si merita cumparat! Contine toata materia frumos explicata si grile rezolvate pe intelesul tuturor. Simularile au fost foarte eficiente pentru mine.",
    rating: 5,
  },
  {
    author: "Violeta-Mihaela Ungureanu",
    date: "2024-07-02",
    title: "Un curs exceptional!",
    content:
      "Daca te pregatesti pentru admiterea la UBB sau vrei sa aprofundezi cunostintele de la scoala, cursul acesta este metoda perfecta. Cu ajutorul materialelor din curs si al simularilor am reusit sa iau 10 in concursul Mate-Info UBB.",
    rating: 5,
  },
  {
    author: "Catalin Danis",
    date: "2024-07-02",
    title: "Merita cumparat",
    content:
      "Materia este mult mai stufoasa decat cea de bac, iar acest curs este foarte util in pregatirea pentru admitere. Evident, munca proprie face diferenta, dar fara un curs ca acesta este foarte greu sa inveti totul singur.",
    rating: 5,
  },
  {
    author: "Bogdan Buruian Ilies",
    date: "2024-06-27",
    title: "Un curs de nota 10!",
    content:
      "Daca doresti sa fii pregatit pentru admiterea de la UBB, in acest curs gasesti toate informatiile necesare intr-un mod simplu si practic. Explicatiile sunt net superioare fata de multe surse online.",
    rating: 5,
  },
  {
    author: "Carla Draghiciu",
    date: "2024-05-25",
    title: "Cel mai bun curs!",
    content:
      "Acest curs m-a ajutat enorm sa imi imbunatatesc cunostintele in informatica. In doar doua luni am reusit sa obtin o nota peste 9 la concursul UBB. Cursul si simularile isi merita banii!",
    rating: 5,
  },
  {
    author: "Elena Farcasiu",
    date: "2024-04-12",
    title: "Recomand!",
    content:
      "Cursul este o alegere excelenta pentru cei care doresc o nota cat mai mare la admitere. Este structurat eficient, cuprinde toata materia, iar explicatiile lui Paul sunt clare si asigura intelegerea conceptelor.",
    rating: 5,
  },
  {
    author: "Musama Dana",
    date: "2024-04-09",
    title: "Foarte bun cursul",
    content:
      "Paul explica foarte clar, iar algoritmii si grilele lucrate sunt fix ce se poate da la examen. Grupul de Discord este un avantaj mare. Recomand si simularile de pe platforma.",
    rating: 5,
  },
  {
    author: "Stoicescu Alexia",
    date: "2024-04-08",
    title: "Un curs excelent!",
    content:
      "Totul este foarte bine explicat, ai multe grile pe care poti exersa si o comunitate activa. Cursul m-a ajutat foarte mult sa ma imbunatatesc.",
    rating: 5,
  },
  {
    author: "Ionut Ardelean",
    date: "2024-04-06",
    title: "Un curs foarte bun!",
    content:
      "Cu siguranta, acest curs este un ghid real pentru pregatirea admiterii la UBB. Este plin de informatii esentiale si utile, fiind un instrument valoros pentru rezultate remarcabile.",
    rating: 5,
  },
  {
    author: "Tudor Cucuteanu",
    date: "2024-04-05",
    title: "Cel mai informativ curs pentru admitere",
    content:
      "Acest curs, impreuna cu comunitatea activa, m-au ajutat sa imi imbunatatesc abordarea problemelor si cunostintele in informatica. Acopera toata materia necesara pentru admitere.",
    rating: 5,
  },
  {
    author: "David Tabrea",
    date: "2024-04-04",
    title: "Foarte eficient",
    content:
      "Cu ajutorul acestui curs mi-am imbunatatit nivelul de informatica de la rezultate mediocre la clasa la note peste 9 in subiectele de admitere UBB in mod constant.",
    rating: 5,
  },
  {
    author: "Larisa Lupoaie",
    date: "2024-04-04",
    title: "Merita cumparat",
    content:
      "Cuprinzand materia necesara admiterii la UBB, contine peste 200 de grile care iti testeaza atentia la detalii si cunostintele acumulate. Comunitatea de Discord este activa si utila.",
    rating: 5,
  },
];

export const UB_UNSTPB_REVIEWS: CourseReview[] = [
  {
    author: "Philip Adam",
    date: "2024-04-24",
    title: "Foarte clar si explicit",
    content:
      "Recomand acest curs, am acumulat o multime de informatii noi deja de la primele lectii pe care nu le-as fi intalnit niciodata la meditatii sau la clasa.",
    rating: 5,
  },
  {
    author: "Matei Ardeleanu-Chirica",
    date: "2024-04-14",
    title: "Usor de inteles cu o structura foarte buna",
    content:
      "Potrivit pentru elevii care isi doresc sa treaca cu succes peste examenele UB si UPB, cursul aprofundeaza materia invatata in liceu, dezvoltand capitolele importante pentru admitere. Astfel am aflat cat de multe lucruri importante nu mi-au fost predate sau au fost ignorate de catre profesorul din clasa.",
    rating: 5,
  },
  {
    author: "Mihail Raduta",
    date: "2024-04-12",
    title: "Un curs de cinci stele",
    content:
      "Recomand cu caldura cursul de informatica! Materialele au fost bine structurate si usor de inteles. Experienta mea a fost excelenta si acum simt ca am o baza solida in informatica. 5 stele!",
    rating: 5,
  },
  {
    author: "Rares Fira",
    date: "2024-04-11",
    title: "Cel mai bun curs pentru admiterea la UPB",
    content:
      "Cursul este extrem de bine structurat, lucru care mi-a permis atat sa invat lucruri noi in urma acestuia, cat si sa aprofundez capitole deja recapitulate. Datorita cursului, ma simt mult mai pregatit pentru admitere.",
    rating: 5,
  },
  {
    author: "Catalin Popa",
    date: "2024-04-04",
    title: "Un curs perfect pentru admitere",
    content: "Materia este foarte bine structurata si cu multe elemente in plus pentru posibilele exercitii mai aparte.",
    rating: 5,
  },
];

export const BAC_REVIEWS: CourseReview[] = [
  {
    author: "Alex Horbaniuc",
    date: "2024-07-03",
    title: "Extraordinar",
    content:
      "Am reusit intr-o saptamana sa pun la punct toata materia pentru bac si sa ma descurc sa fac subiecte de peste nota 8. Recomand cu incredere!",
    rating: 5,
  },
  {
    author: "Ionut Ardelean",
    date: "2024-04-06",
    title: "Mi-a schimbat viata.",
    content:
      "Profesoara de la clasa nu a reusit sa imi explice in 4 ani cat a reusit Paul sa-mi explice in aceste ore de curs. L-am pornit ca un elev care ura informatica si am ajuns sa o indragesc pana in punctul in care sa-mi doresc sa fac o facultate in domeniu. Merita fiecare leu acest curs. Recomand din toata inima!",
    rating: 5,
  },
  {
    author: "Dogaru Albert",
    date: "2026-04-26",
    title: "Un profesor de nota zece!",
    content: "Explici incredibil si inteleg cu usurinta lectiile predate de tine!",
    rating: 5,
  },
  {
    author: "Sebastian Irimies",
    date: "2026-04-25",
    title: "Foarte util!",
    content: "Explicatii clare, pe intelesul tuturor, foarte util in pregatirea examenului de Bacalaureat.",
    rating: 5,
  },
];

export const UAIC_TUIASI_REVIEWS: CourseReview[] = [
  {
    author: "Ioana Profir",
    date: "2025-07-17",
    title: "Recomand cu incredere",
    content:
      "Cursul este bine structurat si acopera in profunzime partea teoretica, iar explicatiile sunt clare, logice si usor de urmarit. Materialele sunt bine organizate si complete.",
    rating: 5,
  },
  {
    author: "Doru Sava",
    date: "2024-06-19",
    title: "Placut impresionat!",
    content: "Curs extrem de reusit, foarte bine structurat, iar continutul este impecabil.",
    rating: 5,
  },
];

const REVIEWS_BY_COURSE: Record<string, CourseReview[]> = {
  [UBB_COURSE_SLUG]: UBB_REVIEWS,
  [UB_UNSTPB_COURSE_SLUG]: UB_UNSTPB_REVIEWS,
  [BAC_COURSE_SLUG]: BAC_REVIEWS,
  [UAIC_TUIASI_COURSE_SLUG]: UAIC_TUIASI_REVIEWS,
};

export function getStaticCourseReviews(courseSlug: string): CourseReview[] {
  return REVIEWS_BY_COURSE[courseSlug] ?? [];
}
