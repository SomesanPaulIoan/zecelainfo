import { getTestVerdictMeta, type TestVerdict } from "@/lib/judge-format";

type TestResult = {
  test_id: string;
  verdict: TestVerdict;
};

export function TestGrid({ tests }: { tests: TestResult[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tests.map((test, index) => {
        const meta = getTestVerdictMeta(test.verdict);
        return (
          <div
            key={test.test_id}
            title={`Test ${index + 1}: ${meta.label}`}
            className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold text-white ${meta.classes.dot}`}
          >
            {index + 1}
          </div>
        );
      })}
    </div>
  );
}
