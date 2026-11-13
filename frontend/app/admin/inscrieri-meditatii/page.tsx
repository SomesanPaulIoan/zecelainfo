import { redirect } from "next/navigation";

export default function AdminMeditatiiLeadsRoute() {
  redirect("/dashboard?adminMeditations=1");
}
