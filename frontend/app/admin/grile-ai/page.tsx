import { redirect } from "next/navigation";

export default function AdminGrileAIPage() {
  redirect("/dashboard?adminGrile=1");
}
