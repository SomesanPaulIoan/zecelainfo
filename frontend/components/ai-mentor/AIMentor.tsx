type AIMentorProps = {
  explanation: string;
  hint: string;
  algorithmSuggestion?: string;
};

export function AIMentor({ explanation, hint, algorithmSuggestion }: AIMentorProps) {
  return (
    <section className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h3 className="text-lg font-semibold text-blue-900">AI Mentor</h3>
      <p className="mt-2 text-sm text-blue-950">{explanation}</p>
      <p className="mt-2 text-sm text-blue-950">
        <strong>Indiciu:</strong> {hint}
      </p>
      {algorithmSuggestion ? (
        <p className="mt-2 text-sm text-blue-950">
          <strong>Algoritm recomandat:</strong> {algorithmSuggestion}
        </p>
      ) : null}
    </section>
  );
}
