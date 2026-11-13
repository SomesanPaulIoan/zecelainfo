import { permanentRedirect } from "next/navigation";
import { pachetPath } from "@/lib/pachete";

/**
 * Ghidurile /admitere-informatica/<exam> au fost unite cu paginile /pachete/<slug> (continutul lor: subiecte, capitole,
 * recenzii, e acum acolo). Redirect permanent ca sa pastram pozitiile din Google.
 */
const PACHET_BY_EXAM: Record<string, string> = {
  ubb: "admitere-ubb",
  ub: "admitere-ub-unstpb",
  unstpb: "admitere-ub-unstpb",
  iasi: "admitere-uaic-tuiasi",
};

type Props = { params: Promise<{ exam: string }> };

export default async function AdmissionGuideRedirect({ params }: Props) {
  const { exam } = await params;
  const slug = PACHET_BY_EXAM[exam];
  permanentRedirect(slug ? pachetPath(slug) : "/pachete");
}
