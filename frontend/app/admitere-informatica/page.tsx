import { permanentRedirect } from "next/navigation";

/** Hub-ul de ghiduri de admitere a fost unit cu /pachete (codul vechi: app/_arhiva/admitere-informatica). */
export default function AdmitereInformaticaRedirect() {
  permanentRedirect("/pachete");
}
