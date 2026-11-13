"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import {
  ArrowLeft,
  BookOpenCheck,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Copy,
  FileCode2,
  Gauge,
  Lightbulb,
  ListChecks,
  Lock,
  MemoryStick,
  Pencil,
  Play,
  Send,
  Sparkles,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { CustomExecutionCard } from "@/components/judge/CustomExecutionCard";
import { ResultPanel, type ResultTest } from "@/components/judge/ResultPanel";
import { VerdictBadge } from "@/components/judge/VerdictBadge";
import { MarkdownLatexContent } from "@/components/common/MarkdownLatexContent";
import { CodeBlock } from "@/components/common/CodeBlock";
import { useHideSiteFooter } from "@/components/layout/ChromeContext";
import { useMediaQuery } from "@/lib/useMediaQuery";
import type { SubmissionStatus } from "@/lib/judge-format";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";

type Language = "cpp" | "c" | "pascal" | "python";

type ProblemData = {
  id: string;
  title: string;
  statement: string;
  hints: string;
  explanation: string;
  official_solution_cpp: string;
  official_solution_python: string;
  input_format: string;
  output_format: string;
  constraints: string;
  difficulty: "easy" | "medium" | "hard" | "facultate";
  time_limit_ms: number;
  memory_limit_mb: number;
  tags: string[];
  solution_mode: "full" | "function";
  function_stub_cpp: string | null;
  function_stub_c: string | null;
  function_stub_pascal: string | null;
  function_stub_python: string | null;
  sample_tests: Array<{
    id: string;
    input: string;
    expected_output: string;
    is_sample: boolean;
    points: number;
  }>;
};

type SubmissionResult = {
  id: string;
  status: SubmissionStatus;
  score: number;
  compile_error_message?: string | null;
  test_results: ResultTest[] | null;
};

type SubmissionDetail = SubmissionResult & {
  language: Language;
  code: string;
};

type CustomRunResult = {
  verdict: "AC" | "WA" | "TLE" | "RE" | "CE";
  time_ms: number;
  stdout: string;
  stderr: string;
};

type SubmissionHistoryItem = {
  id: string;
  status: SubmissionStatus;
  score: number;
  language: Language;
  created_at: string;
};

type RosterMember = {
  user_id: string;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  attempts_count: number;
  best_score: number | null;
  last_submitted_at: string | null;
};

type RosterGroup = {
  id: string;
  name: string;
  weekday: number;
  start_time: string;
  end_time: string;
  members_count: number;
  members: RosterMember[];
};

function memberDisplayName(member: RosterMember): string {
  const full = member.full_name?.trim();
  if (full) return full;
  const first = member.first_name?.trim();
  const last = member.last_name?.trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  return member.username || member.email;
}

const starterCode: Record<Language, string> = {
  cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello, World!\";\n    return 0;\n}\n",
  c: "#include <stdio.h>\n\nint main() {\n    return 0;\n}\n",
  pascal: "program solution;\nbegin\nend.\n",
  python: "a, b = map(int, input().split())\nprint(a + b)\n",
};

const FUNCTION_STUB_KEY_BY_LANGUAGE: Record<Language, keyof ProblemData> = {
  cpp: "function_stub_cpp",
  c: "function_stub_c",
  pascal: "function_stub_pascal",
  python: "function_stub_python",
};

function getStarterCode(problem: ProblemData, language: Language): string {
  if (problem.solution_mode === "function") {
    const stub = problem[FUNCTION_STUB_KEY_BY_LANGUAGE[language]] as string | null;
    if (stub) return stub;
  }
  return starterCode[language];
}

const DIFFICULTY_META: Record<ProblemData["difficulty"], { label: string; classes: string }> = {
  easy: { label: "Usoara", classes: "border-emerald-300 bg-emerald-100/80 text-emerald-800" },
  medium: { label: "Medie", classes: "border-amber-300 bg-amber-100/80 text-amber-800" },
  hard: { label: "Grea", classes: "border-rose-300 bg-rose-100/80 text-rose-800" },
  facultate: { label: "Facultate", classes: "border-violet-300 bg-violet-100/80 text-violet-800" },
};

type LeftTab = "statement" | "hints" | "explanation" | "solution" | "submissions" | "roster" | "admin";
type ConsoleTab = "testcase" | "result";

const RESIZE_HANDLE_V = "relative w-1.5 shrink-0 cursor-col-resize bg-zinc-200/80 transition hover:bg-sky-300 active:bg-sky-400";
const RESIZE_HANDLE_H = "relative h-1.5 shrink-0 cursor-row-resize bg-zinc-200/80 transition hover:bg-sky-300 active:bg-sky-400";

export function ProblemWorkspace({
  problem,
  initialHistory,
}: {
  problem: ProblemData;
  initialHistory: SubmissionHistoryItem[];
}) {
  useHideSiteFooter();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const searchParams = useSearchParams();
  const homeworkAssignmentId = searchParams.get("homeworkAssignmentId");
  const backHref = homeworkAssignmentId ? `/dashboard?openProblemsTema=${encodeURIComponent(homeworkAssignmentId)}` : "/problems";
  const backLabel = homeworkAssignmentId ? "Tema" : "Probleme";

  const [problemOverride, setProblemOverride] = useState<Partial<Pick<ProblemData, "title" | "statement" | "hints" | "explanation">>>(
    {},
  );
  const effectiveProblem = useMemo(() => ({ ...problem, ...problemOverride }), [problem, problemOverride]);

  const [adminTitle, setAdminTitle] = useState(problem.title);
  const [adminStatement, setAdminStatement] = useState(problem.statement);
  const [adminHints, setAdminHints] = useState(problem.hints);
  const [adminExplanation, setAdminExplanation] = useState(problem.explanation);
  const [isSavingAdminText, setIsSavingAdminText] = useState(false);
  const [adminTextError, setAdminTextError] = useState<string | null>(null);
  const [adminTextSaved, setAdminTextSaved] = useState(false);

  const [language, setLanguage] = useState<Language>("cpp");
  const [code, setCode] = useState(() => getStarterCode(problem, "cpp"));

  const [leftTab, setLeftTab] = useState<LeftTab>("statement");
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>("testcase");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmissionResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [customInput, setCustomInput] = useState(problem.sample_tests[0]?.input ?? "");
  const [customRunResult, setCustomRunResult] = useState<CustomRunResult | null>(null);
  const [customRunError, setCustomRunError] = useState<string | null>(null);

  const [history, setHistory] = useState<SubmissionHistoryItem[]>(initialHistory);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [showOfficialSolution, setShowOfficialSolution] = useState(false);
  const [codeBeforeOfficialSolution, setCodeBeforeOfficialSolution] = useState<{ code: string; language: Language } | null>(
    null,
  );

  const [rosterLoaded, setRosterLoaded] = useState(false);
  const [roster, setRoster] = useState<RosterGroup[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [studentSubmissions, setStudentSubmissions] = useState<Record<string, SubmissionHistoryItem[]>>({});
  const [studentSubmissionsLoadingId, setStudentSubmissionsLoadingId] = useState<string | null>(null);
  const [studentSubmissionsError, setStudentSubmissionsError] = useState<string | null>(null);
  const [viewingStudentSubmission, setViewingStudentSubmission] = useState<{
    submissionId: string;
    studentName: string;
    score: number;
    createdAt: string;
  } | null>(null);
  const [codeBeforeStudentView, setCodeBeforeStudentView] = useState<{ code: string; language: Language } | null>(null);

  const resultRef = useRef<HTMLDivElement | null>(null);
  const customResultRef = useRef<HTMLDivElement | null>(null);

  const hasSolvedProblem = useMemo(
    () => history.some((submission) => submission.status === "accepted"),
    [history],
  );

  const belowFullScoreAttempts = useMemo(
    () => history.filter((submission) => !["pending", "running"].includes(submission.status) && submission.score < 100).length,
    [history],
  );

  const hintsUnlocked = hasSolvedProblem || belowFullScoreAttempts >= 1;
  const explanationUnlocked = hasSolvedProblem || belowFullScoreAttempts >= 3;

  const difficultyMeta = DIFFICULTY_META[problem.difficulty];

  const refreshHistory = async () => {
    try {
      const response = await apiFetch<{ data: SubmissionHistoryItem[] }>(`/api/submissions/problem/${problem.id}`);
      setHistory(response.data);
      setHistoryError(null);
    } catch {
      // silent fail for history refresh
    }
  };

  // `initialHistory` vine de pe server (RSC), care nu are acces la token-ul de autentificare
  // (traieste doar in localStorage, in browser) — deci e mereu gol acolo. Reincarcam istoricul
  // real aici, in client, de fiecare data cand se deschide o problema, altfel pagina arata
  // "nerezolvata" chiar daca a fost rezolvata intr-o sesiune anterioara.
  useEffect(() => {
    void refreshHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem.id]);

  const loadSubmissionDetail = async (submissionId: string) => {
    setIsLoadingSubmission(true);
    setHistoryError(null);
    setSelectedSubmissionId(submissionId);
    try {
      const response = await apiFetch<{ data: SubmissionDetail }>(`/api/submissions/${submissionId}`);
      setLanguage(response.data.language);
      setCode(response.data.code);
      setShowOfficialSolution(false);
      setCodeBeforeOfficialSolution(null);
      setViewingStudentSubmission(null);
      setCodeBeforeStudentView(null);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "Nu am putut incarca codul submisiei.");
    } finally {
      setIsLoadingSubmission(false);
    }
  };

  const loadRoster = async () => {
    setIsLoadingRoster(true);
    setRosterError(null);
    try {
      const response = await apiFetch<{ data: RosterGroup[] }>(`/api/submissions/admin/problem/${problem.id}/roster`);
      setRoster(response.data);
      setRosterLoaded(true);
      setStudentSubmissions({});
      if (expandedStudentId) void loadStudentSubmissions(expandedStudentId);
    } catch (error) {
      setRosterError(error instanceof Error ? error.message : "Nu am putut incarca lista de elevi.");
    } finally {
      setIsLoadingRoster(false);
    }
  };

  useEffect(() => {
    if (isAdmin && leftTab === "roster" && !rosterLoaded && !isLoadingRoster) {
      void loadRoster();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, leftTab, rosterLoaded]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroupId((current) => (current === groupId ? null : groupId));
  };

  const loadStudentSubmissions = async (userId: string) => {
    setStudentSubmissionsLoadingId(userId);
    setStudentSubmissionsError(null);
    try {
      const response = await apiFetch<{ data: SubmissionHistoryItem[] }>(
        `/api/submissions/admin/problem/${problem.id}/students/${userId}`,
      );
      setStudentSubmissions((prev) => ({ ...prev, [userId]: response.data }));
    } catch (error) {
      setStudentSubmissionsError(error instanceof Error ? error.message : "Nu am putut incarca incercarile elevului.");
    } finally {
      setStudentSubmissionsLoadingId(null);
    }
  };

  const toggleStudent = (userId: string) => {
    const next = expandedStudentId === userId ? null : userId;
    setExpandedStudentId(next);
    if (next && !studentSubmissions[next]) {
      void loadStudentSubmissions(next);
    }
  };

  const loadStudentSubmissionIntoEditor = async (submissionId: string, studentName: string) => {
    setIsLoadingSubmission(true);
    setStudentSubmissionsError(null);
    try {
      const response = await apiFetch<{ data: SubmissionDetail & { created_at: string } }>(
        `/api/submissions/admin/${submissionId}`,
      );
      if (!codeBeforeStudentView) {
        setCodeBeforeStudentView({ code, language });
      }
      setLanguage(response.data.language);
      setCode(response.data.code);
      setShowOfficialSolution(false);
      setViewingStudentSubmission({
        submissionId,
        studentName,
        score: response.data.score,
        createdAt: response.data.created_at,
      });
    } catch (error) {
      setStudentSubmissionsError(error instanceof Error ? error.message : "Nu am putut incarca codul acestei incercari.");
    } finally {
      setIsLoadingSubmission(false);
    }
  };

  const onRestoreCodeBeforeStudentView = () => {
    if (codeBeforeStudentView) {
      setLanguage(codeBeforeStudentView.language);
      setCode(codeBeforeStudentView.code);
    }
    setCodeBeforeStudentView(null);
    setViewingStudentSubmission(null);
  };

  const onLanguageChange = (next: Language) => {
    setViewingStudentSubmission(null);
    setCodeBeforeStudentView(null);
    setLanguage(next);
    setCode(getStarterCode(problem, next));
  };

  const scrollToResult = () => {
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const onSubmit = async () => {
    if (isSubmitting || isRunning) return;
    setConsoleTab("result");
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitResult({ id: "pending", status: "pending", score: 0, test_results: null });

    try {
      const created = await apiFetch<{ data: { submission_id: string } }>("/api/submissions", {
        method: "POST",
        body: JSON.stringify({ problem_id: problem.id, language, code }),
      });

      const submissionId = created.data.submission_id;
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const submission = await apiFetch<{ data: SubmissionResult }>(`/api/submissions/${submissionId}`);
        setSubmitResult(submission.data);
        scrollToResult();
        if (!["pending", "running"].includes(submission.data.status)) {
          await refreshHistory();
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
    } catch (error) {
      setSubmitResult(null);
      setSubmitError(error instanceof Error ? error.message : "Trimiterea a esuat");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRun = async () => {
    if (isRunning || isSubmitting) return;
    setConsoleTab("testcase");
    setIsRunning(true);
    setCustomRunError(null);
    setCustomRunResult(null);

    try {
      const run = await apiFetch<{ data: CustomRunResult }>("/api/submissions/run", {
        method: "POST",
        body: JSON.stringify({ problem_id: problem.id, language, code, stdin: customInput, mode: "custom" }),
      });
      setCustomRunResult(run.data);
    } catch (error) {
      setCustomRunError(error instanceof Error ? error.message : "Rularea a esuat");
    } finally {
      setIsRunning(false);
      requestAnimationFrame(() => customResultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    }
  };

  const onLoadOfficialSolution = (solutionLanguage: "cpp" | "python") => {
    if (!codeBeforeOfficialSolution) {
      setCodeBeforeOfficialSolution({ code, language });
    }
    setLanguage(solutionLanguage);
    setCode(solutionLanguage === "cpp" ? problem.official_solution_cpp : problem.official_solution_python);
    setShowOfficialSolution(true);
    setViewingStudentSubmission(null);
    setCodeBeforeStudentView(null);
  };

  const onRestoreCodeBeforeSolution = () => {
    if (codeBeforeOfficialSolution) {
      setLanguage(codeBeforeOfficialSolution.language);
      setCode(codeBeforeOfficialSolution.code);
    }
    setCodeBeforeOfficialSolution(null);
    setShowOfficialSolution(false);
  };

  const saveAdminText = async () => {
    if (isSavingAdminText) return;
    setIsSavingAdminText(true);
    setAdminTextError(null);
    setAdminTextSaved(false);
    try {
      await apiFetch(`/api/problems/admin/${problem.id}/text`, {
        method: "PUT",
        body: JSON.stringify({
          title: adminTitle,
          statement: adminStatement,
          hints: adminHints,
          explanation: adminExplanation,
        }),
      });
      setProblemOverride({
        title: adminTitle,
        statement: adminStatement,
        hints: adminHints,
        explanation: adminExplanation,
      });
      setAdminTextSaved(true);
    } catch (error) {
      setAdminTextError(error instanceof Error ? error.message : "Nu am putut salva modificarile.");
    } finally {
      setIsSavingAdminText(false);
    }
  };

  // --- left pane content ---

  const statementContent = (
    <div className="space-y-6 p-5">
      <MarkdownLatexContent content={effectiveProblem.statement} className="text-[15px] leading-7 text-zinc-800" />

      <dl className="space-y-4 border-t border-zinc-100 pt-5 text-sm leading-6 text-zinc-700">
        <div>
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Date de intrare</dt>
          <dd className="mt-1">{problem.input_format}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Date de iesire</dt>
          <dd className="mt-1">{problem.output_format}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Restrictii</dt>
          <dd className="mt-1 font-mono text-[13px]">{problem.constraints}</dd>
        </div>
      </dl>

      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Exemple</h2>
        <div className="space-y-3">
          {problem.sample_tests.map((sample, index) => (
            <div key={sample.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
              <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-3.5 py-2">
                <p className="text-xs font-semibold text-zinc-600">Exemplul {index + 1}</p>
                <button
                  type="button"
                  onClick={() => {
                    setCustomInput(sample.input);
                    setConsoleTab("testcase");
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800 transition hover:bg-sky-100"
                >
                  Foloseste ca intrare de test
                </button>
              </div>
              <div className="grid grid-cols-1 gap-0 divide-y divide-zinc-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <ExamplePre label="Intrare" value={sample.input} />
                <ExamplePre label="Iesire" value={sample.expected_output} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const hintsContent = (
    <div className="space-y-4 p-5">
      {hintsUnlocked ? (
        effectiveProblem.hints ? (
          <MarkdownLatexContent content={effectiveProblem.hints} className="text-sm leading-7 text-zinc-800" />
        ) : (
          <p className="text-sm text-zinc-500">Nu exista indicii pentru aceasta problema.</p>
        )
      ) : (
        <LockedPanel
          title="Indiciile sunt blocate"
          description={`Trimite o solutie care obtine sub 100 de puncte pentru a debloca indiciile (${Math.min(
            belowFullScoreAttempts,
            1,
          )}/1 incercari).`}
        />
      )}
    </div>
  );

  const explanationContent = (
    <div className="space-y-4 p-5">
      {explanationUnlocked ? (
        effectiveProblem.explanation ? (
          <MarkdownLatexContent content={effectiveProblem.explanation} className="text-sm leading-7 text-zinc-800" />
        ) : (
          <p className="text-sm text-zinc-500">Nu exista explicatii pentru aceasta problema.</p>
        )
      ) : (
        <LockedPanel
          title="Explicatiile sunt blocate"
          description={`Trimite 3 solutii care obtin sub 100 de puncte pentru a debloca explicatiile (${Math.min(
            belowFullScoreAttempts,
            3,
          )}/3 incercari).`}
        />
      )}
    </div>
  );

  const solutionContent = (
    <div className="space-y-4 p-5">
      {hasSolvedProblem ? (
        <>
          <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2.5 text-sm text-violet-800">
            <Trophy className="h-4 w-4 shrink-0" />
            Ai rezolvat aceasta problema. Solutia oficiala este deblocata.
          </div>
          <SolutionCodeCard
            label="C++"
            language="cpp"
            code={problem.official_solution_cpp}
            isLoaded={showOfficialSolution && language === "cpp" && code === problem.official_solution_cpp}
            onLoad={() => onLoadOfficialSolution("cpp")}
          />
          <SolutionCodeCard
            label="Python"
            language="python"
            code={problem.official_solution_python}
            isLoaded={showOfficialSolution && language === "python" && code === problem.official_solution_python}
            onLoad={() => onLoadOfficialSolution("python")}
          />
          {showOfficialSolution ? (
            <button
              type="button"
              onClick={onRestoreCodeBeforeSolution}
              className="w-full rounded-xl border border-violet-300 bg-white px-4 py-2.5 text-sm font-semibold text-violet-800 shadow-sm transition hover:bg-violet-50"
            >
              Elimina din editor si revino la codul tau
            </button>
          ) : null}
        </>
      ) : (
        <LockedPanel
          title="Solutia oficiala este blocata"
          description="Obtine verdictul Accepted la o trimitere pentru a o debloca."
        />
      )}
    </div>
  );

  const submissionsContent = (
    <div className="space-y-3 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Istoric trimiteri</p>
        <button
          type="button"
          onClick={() => void refreshHistory()}
          className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
        >
          Reincarca
        </button>
      </div>

      {history.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-xs text-zinc-500">
          Nu exista trimiteri inca pentru aceasta problema.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
                <th className="py-2 pl-3 pr-2 font-medium">Verdict</th>
                <th className="py-2 pr-2 font-medium">Scor</th>
                <th className="py-2 pr-2 font-medium">Limbaj</th>
                <th className="py-2 pr-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 10).map((item) => (
                <tr
                  key={item.id}
                  onClick={() => void loadSubmissionDetail(item.id)}
                  className={`cursor-pointer border-b border-zinc-100 text-zinc-700 last:border-b-0 hover:bg-sky-50/70 ${
                    selectedSubmissionId === item.id ? "bg-sky-50" : ""
                  }`}
                >
                  <td className="py-2 pl-3 pr-2">
                    <VerdictBadge verdict={item.status} />
                  </td>
                  <td className="py-2 pr-2 font-semibold">{item.score}</td>
                  <td className="py-2 pr-2 uppercase">{item.language}</td>
                  <td className="py-2 pr-3 text-zinc-500">{new Date(item.created_at).toLocaleString("ro-RO")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {history.length > 10 ? (
        <p className="text-[11px] text-zinc-400">Se afiseaza ultimele 10 din {history.length} trimiteri.</p>
      ) : null}
      {isLoadingSubmission ? <p className="text-xs text-zinc-500">Se incarca codul submisiei...</p> : null}
      {historyError ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">{historyError}</p> : null}
    </div>
  );

  const rosterContent = (
    <div className="space-y-3 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Elevi pe clase</p>
        <button
          type="button"
          onClick={() => void loadRoster()}
          className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
        >
          Reincarca
        </button>
      </div>

      {isLoadingRoster && roster.length === 0 ? <p className="text-xs text-zinc-500">Se incarca clasele...</p> : null}
      {rosterError ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">{rosterError}</p> : null}
      {!isLoadingRoster && !rosterError && roster.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-xs text-zinc-500">
          Nu exista clase de meditatii create.
        </p>
      ) : null}

      <div className="space-y-2">
        {roster.map((group) => (
          <div key={group.id} className="overflow-hidden rounded-xl border border-zinc-200">
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
              <span className="flex items-center gap-1.5">
                {expandedGroupId === group.id ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                )}
                {group.name}
              </span>
              <span className="shrink-0 text-xs font-normal text-zinc-500">{group.members_count} elevi</span>
            </button>

            {expandedGroupId === group.id ? (
              <div className="divide-y divide-zinc-100 border-t border-zinc-200">
                {group.members.length === 0 ? (
                  <p className="px-3.5 py-3 text-xs text-zinc-500">Nu exista elevi in aceasta clasa.</p>
                ) : (
                  group.members.map((member) => (
                    <div key={member.user_id}>
                      <button
                        type="button"
                        onClick={() => toggleStudent(member.user_id)}
                        className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-xs text-zinc-700 transition hover:bg-sky-50/70"
                      >
                        <span className="flex items-center gap-1.5">
                          {expandedStudentId === member.user_id ? (
                            <ChevronDown className="h-3 w-3 shrink-0 text-zinc-400" />
                          ) : (
                            <ChevronRight className="h-3 w-3 shrink-0 text-zinc-400" />
                          )}
                          {memberDisplayName(member)}
                        </span>
                        {member.attempts_count > 0 ? (
                          <span className="flex shrink-0 items-center gap-2 text-zinc-500">
                            <span>{member.attempts_count} incercari</span>
                            <span className="font-semibold text-zinc-800">{member.best_score}p</span>
                          </span>
                        ) : (
                          <span className="shrink-0 text-zinc-400">Nicio incercare</span>
                        )}
                      </button>

                      {expandedStudentId === member.user_id ? (
                        <div className="bg-zinc-50 px-3.5 py-2.5">
                          {studentSubmissionsLoadingId === member.user_id ? (
                            <p className="text-xs text-zinc-500">Se incarca incercarile...</p>
                          ) : (studentSubmissions[member.user_id]?.length ?? 0) === 0 ? (
                            <p className="text-xs text-zinc-500">Nicio incercare la aceasta problema.</p>
                          ) : (
                            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                              <table className="w-full text-left text-[11px]">
                                <thead>
                                  <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
                                    <th className="py-1.5 pl-2.5 pr-2 font-medium">Verdict</th>
                                    <th className="py-1.5 pr-2 font-medium">Scor</th>
                                    <th className="py-1.5 pr-2 font-medium">Limbaj</th>
                                    <th className="py-1.5 pr-2.5 font-medium">Data</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(studentSubmissions[member.user_id] ?? []).map((item) => (
                                    <tr
                                      key={item.id}
                                      onClick={() => void loadStudentSubmissionIntoEditor(item.id, memberDisplayName(member))}
                                      className={`cursor-pointer border-b border-zinc-100 text-zinc-700 last:border-b-0 hover:bg-sky-50/70 ${
                                        viewingStudentSubmission?.submissionId === item.id ? "bg-sky-50" : ""
                                      }`}
                                    >
                                      <td className="py-1.5 pl-2.5 pr-2">
                                        <VerdictBadge verdict={item.status} />
                                      </td>
                                      <td className="py-1.5 pr-2 font-semibold">{item.score}</td>
                                      <td className="py-1.5 pr-2 uppercase">{item.language}</td>
                                      <td className="py-1.5 pr-2.5 text-zinc-500">
                                        {new Date(item.created_at).toLocaleString("ro-RO")}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {studentSubmissionsError ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">{studentSubmissionsError}</p>
      ) : null}
      {isLoadingSubmission ? <p className="text-xs text-zinc-500">Se incarca codul incercarii...</p> : null}
    </div>
  );

  const adminContent = (
    <div className="space-y-4 p-5">
      <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
        <Pencil className="h-4 w-4 shrink-0" />
        Editare rapida (doar admin) — titlu si texte.
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Titlu</span>
        <input
          type="text"
          value={adminTitle}
          onChange={(event) => setAdminTitle(event.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Enunt</span>
        <textarea
          value={adminStatement}
          onChange={(event) => setAdminStatement(event.target.value)}
          className="h-56 w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Indicatii</span>
        <textarea
          value={adminHints}
          onChange={(event) => setAdminHints(event.target.value)}
          className="h-32 w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Explicatii</span>
        <textarea
          value={adminExplanation}
          onChange={(event) => setAdminExplanation(event.target.value)}
          className="h-32 w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </label>

      {adminTextError ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">{adminTextError}</p>
      ) : null}
      {adminTextSaved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700">Salvat.</p>
      ) : null}

      <button
        type="button"
        onClick={() => void saveAdminText()}
        disabled={isSavingAdminText}
        className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSavingAdminText ? "Se salveaza..." : "Salveaza"}
      </button>
    </div>
  );

  const leftTabContent: Record<LeftTab, React.ReactNode> = {
    statement: statementContent,
    hints: hintsContent,
    explanation: explanationContent,
    solution: solutionContent,
    submissions: submissionsContent,
    roster: rosterContent,
    admin: adminContent,
  };

  const leftPane = (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-zinc-200 bg-white px-2 pt-1.5">
        <TabButton icon={BookOpen} label="Enunt" active={leftTab === "statement"} onClick={() => setLeftTab("statement")} />
        <TabButton
          icon={hintsUnlocked ? Lightbulb : Lock}
          label="Indicatii"
          active={leftTab === "hints"}
          onClick={() => setLeftTab("hints")}
        />
        <TabButton
          icon={explanationUnlocked ? BookOpenCheck : Lock}
          label="Explicatii"
          active={leftTab === "explanation"}
          onClick={() => setLeftTab("explanation")}
        />
        <TabButton
          icon={hasSolvedProblem ? FileCode2 : Lock}
          label="Solutie"
          active={leftTab === "solution"}
          onClick={() => setLeftTab("solution")}
        />
        <TabButton icon={ListChecks} label="Submisii" active={leftTab === "submissions"} onClick={() => setLeftTab("submissions")} />
        {isAdmin ? (
          <>
            <TabButton icon={Users} label="Clase" active={leftTab === "roster"} onClick={() => setLeftTab("roster")} />
            <TabButton icon={Pencil} label="Admin" active={leftTab === "admin"} onClick={() => setLeftTab("admin")} />
          </>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{leftTabContent[leftTab]}</div>
    </div>
  );

  // --- right pane: editor toolbar ---

  const editorToolbar = (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-white px-3 py-2">
      <select
        value={language}
        onChange={(event) => onLanguageChange(event.target.value as Language)}
        className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm font-medium text-zinc-800 shadow-sm outline-none focus:border-sky-400"
      >
        <option value="cpp">C++</option>
        <option value="c">C</option>
        <option value="pascal">Pascal</option>
        <option value="python">Python</option>
      </select>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void onRun()}
          disabled={isRunning || isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5" />
          {isRunning ? "Rulez..." : "Ruleaza"}
        </button>
        <button
          type="button"
          onClick={() => void onSubmit()}
          disabled={isSubmitting || isRunning}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 transition hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          {isSubmitting ? "Evaluare..." : "Trimite"}
        </button>
      </div>
    </div>
  );

  const editorArea = (
    <div className="flex h-full min-h-0 flex-col bg-[#1e1e1e]">
      {viewingStudentSubmission ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span>
            Cod elev: <strong>{viewingStudentSubmission.studentName}</strong> — scor {viewingStudentSubmission.score} —{" "}
            {new Date(viewingStudentSubmission.createdAt).toLocaleString("ro-RO")}
          </span>
          <button
            type="button"
            onClick={onRestoreCodeBeforeStudentView}
            className="shrink-0 rounded-lg border border-amber-300 bg-white px-2.5 py-1 font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            Revino la codul tau
          </button>
        </div>
      ) : null}
      {editorToolbar}
      <div className="min-h-0 flex-1">
        <CodeEditor value={code} onChange={setCode} language={language} onRunShortcut={() => void onRun()} />
      </div>
    </div>
  );

  // --- console (testcase / result) ---

  const testcaseContent = (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Intrare (stdin)</p>
        {problem.sample_tests.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {problem.sample_tests.map((sample, index) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => setCustomInput(sample.input)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  customInput === sample.input
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                Caz {index + 1}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <textarea
        value={customInput}
        onChange={(event) => setCustomInput(event.target.value)}
        placeholder="Scrie aici datele de intrare cu care vrei sa testezi codul..."
        className="h-32 w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
      <p className="text-[11px] text-zinc-400">Apasa Ruleaza (sau Ctrl/Cmd + Enter) ca sa rulezi codul cu aceasta intrare.</p>

      <div ref={customResultRef} className="scroll-mt-4 space-y-3">
        {customRunError ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">{customRunError}</p>
        ) : null}
        {customRunResult ? (
          <CustomExecutionCard
            verdict={customRunResult.verdict}
            timeMs={customRunResult.time_ms}
            stdout={customRunResult.stdout}
            stderr={customRunResult.stderr}
          />
        ) : null}
      </div>
    </div>
  );

  const resultContent = (
    <div ref={resultRef} className="space-y-4 p-4">
      {submitError ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{submitError}</p> : null}

      {submitResult ? (
        <ResultPanel
          label="Trimitere oficiala"
          status={submitResult.status}
          score={submitResult.score}
          tests={submitResult.test_results}
          compileErrorMessage={submitResult.compile_error_message}
        />
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
          <Sparkles className="h-6 w-6 text-zinc-400" />
          <p className="text-sm font-medium text-zinc-600">Niciun rezultat inca</p>
          <p className="text-xs text-zinc-500">Apasa Trimite pentru evaluare completa, cu scor.</p>
        </div>
      )}
    </div>
  );

  const consoleArea = (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex shrink-0 items-center gap-1 border-b border-zinc-200 bg-white px-2 pt-1.5">
        <TabButton icon={ListChecks} label="Cazuri de test" active={consoleTab === "testcase"} onClick={() => setConsoleTab("testcase")} />
        <TabButton
          icon={Gauge}
          label="Rezultat"
          active={consoleTab === "result"}
          onClick={() => setConsoleTab("result")}
          badge={
            submitResult?.status === "accepted"
              ? "ok"
              : submitResult && submitResult.status !== "pending" && submitResult.status !== "running"
                ? "fail"
                : undefined
          }
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{consoleTab === "testcase" ? testcaseContent : resultContent}</div>
    </div>
  );

  const rightPane = isDesktop ? (
    <Group orientation="vertical" className="h-full">
      <Panel defaultSize="62" minSize="25">
        {editorArea}
      </Panel>
      <Separator className={RESIZE_HANDLE_H} />
      <Panel defaultSize="38" minSize="20">
        {consoleArea}
      </Panel>
    </Group>
  ) : (
    <div className="flex flex-col">
      <div className="h-[70vh]">{editorArea}</div>
      <div className="h-[70vh] border-t border-zinc-200">{consoleArea}</div>
    </div>
  );

  return (
    <main className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-zinc-50">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={backHref}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </Link>
          <div className="h-4 w-px shrink-0 bg-zinc-200" />
          <h1 className="truncate text-base font-bold text-zinc-900">{effectiveProblem.title}</h1>
          {hasSolvedProblem ? <Trophy className="h-4 w-4 shrink-0 text-emerald-500" /> : null}
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${difficultyMeta.classes}`}>
            {difficultyMeta.label}
          </span>
          <div className="hidden items-center gap-1.5 sm:flex">
            {problem.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" /> {problem.time_limit_ms} ms
          </span>
          <span className="flex items-center gap-1">
            <MemoryStick className="h-3.5 w-3.5" /> {problem.memory_limit_mb} MB
          </span>
        </div>
      </div>

      {isDesktop ? (
        <Group orientation="horizontal" className="min-h-0 flex-1">
          <Panel defaultSize="42" minSize="25">
            {leftPane}
          </Panel>
          <Separator className={RESIZE_HANDLE_V} />
          <Panel defaultSize="58" minSize="35">
            {rightPane}
          </Panel>
        </Group>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="min-h-[60vh] border-b border-zinc-200">{leftPane}</div>
          {rightPane}
        </div>
      )}
    </main>
  );
}

function TabButton({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: "ok" | "fail";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-semibold transition ${
        active ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      {badge ? (
        <span className={`h-1.5 w-1.5 rounded-full ${badge === "ok" ? "bg-emerald-500" : "bg-rose-500"}`} />
      ) : null}
    </button>
  );
}

function LockedPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center">
      <Lock className="h-7 w-7 text-zinc-400" />
      <p className="text-sm font-medium text-zinc-600">{title}</p>
      <p className="text-xs text-zinc-500">{description}</p>
    </div>
  );
}

function SolutionCodeCard({
  label,
  language,
  code,
  isLoaded,
  onLoad,
}: {
  label: string;
  language: "cpp" | "python";
  code: string;
  isLoaded: boolean;
  onLoad: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3.5 py-2">
        <p className="text-xs font-bold text-zinc-700">{label}</p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(code)}
            className="rounded p-1 text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700"
            title="Copiaza"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onLoad}
            disabled={isLoaded}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              isLoaded ? "cursor-default bg-emerald-100 text-emerald-700" : "bg-zinc-900 text-white hover:bg-black"
            }`}
          >
            {isLoaded ? "In editor" : "Incarca in editor"}
          </button>
        </div>
      </div>
      <CodeBlock code={code} language={language} />
    </div>
  );
}

function ExamplePre({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3.5 py-3">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[11px] font-medium text-zinc-500">{label}</p>
        <button
          type="button"
          onClick={() => void navigator.clipboard?.writeText(value)}
          className="rounded p-0.5 text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700"
          title="Copiaza"
        >
          <Copy className="h-3 w-3" />
        </button>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-zinc-800">{value}</pre>
    </div>
  );
}
