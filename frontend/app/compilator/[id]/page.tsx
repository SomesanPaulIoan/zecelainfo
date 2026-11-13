import { CompilatorProjectLoader } from "./CompilatorProjectLoader";

type CompilatorProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CompilatorProjectPage({ params }: CompilatorProjectPageProps) {
  const { id } = await params;
  return <CompilatorProjectLoader projectId={id} />;
}
