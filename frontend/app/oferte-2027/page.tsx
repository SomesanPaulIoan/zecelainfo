import { permanentRedirect } from "next/navigation";

/** Pagina „Oferte 2027” e arhivata (codul vechi: app/_arhiva/oferte-2027); pachetele sunt acum pe /pachete. */
export default function Oferte2027ArchivedPage() {
  permanentRedirect("/pachete");
}
