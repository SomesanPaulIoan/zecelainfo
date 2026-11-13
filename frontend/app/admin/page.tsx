"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { apiFetch } from "@/lib/api";
import { taxonomy, levelOptions, type ProblemLevel } from "@/lib/problem-taxonomy";

type ImportDraftPayload = {
  title: string;
  slug: string;
  statement: string;
  official_solution: string;
  input_format: string;
  output_format: string;
  constraints: string;
  difficulty: "easy" | "medium" | "hard" | "facultate";
  time_limit_ms: number;
  memory_limit_mb: number;
  tags: string[];
  source?: string;
  input_source: "stdin" | "file";
  output_target: "stdout" | "file";
  input_filename?: string;
  output_filename?: string;
  curriculum_level: ProblemLevel;
  curriculum_chapter_id: string;
  curriculum_subcategory_id: string;
  solution_mode: "full" | "function";
  function_template?: string;
  checker_mode: "exact" | "custom";
  checker_code?: string;
  tests: Array<{
    input: string;
    expected_output: string;
    is_sample: boolean;
    points: number;
    order_index: number;
  }>;
};

type ImportDraft = {
  id: string;
  payload: ImportDraftPayload;
  validation_report: {
    is_valid: boolean;
    summary: string;
    checks: Array<{ key: string; ok: boolean; message: string }>;
  };
  status: "draft" | "approved" | "rejected";
  created_problem_id?: string | null;
  created_at: string;
};

type AdminProblemListItem = {
  id: string;
  title: string;
  slug: string;
  difficulty: "easy" | "medium" | "hard" | "facultate";
  tags: string[];
  is_published: boolean;
  curriculum_level: ProblemLevel | null;
  curriculum_chapter_id: string | null;
  curriculum_subcategory_id: string | null;
  created_at: string;
};

type AdminProblemDetails = {
  id: string;
  title: string;
  slug: string;
  statement: string;
  official_solution: string | null;
  input_format: string;
  output_format: string;
  constraints: string;
  difficulty: "easy" | "medium" | "hard" | "facultate";
  time_limit_ms: number;
  memory_limit_mb: number;
  tags: string[];
  input_source: "stdin" | "file";
  output_target: "stdout" | "file";
  input_filename: string | null;
  output_filename: string | null;
  curriculum_level: ProblemLevel;
  curriculum_chapter_id: string;
  curriculum_subcategory_id: string;
  solution_mode: "full" | "function";
  function_template: string | null;
  checker_mode: "exact" | "custom";
  checker_code: string | null;
  tests: Array<{
    input: string;
    expected_output: string;
    is_sample: boolean;
    points: number;
    order_index: number;
  }>;
};

type TestCaseForm = {
  input: string;
  expected_output: string;
  is_sample: boolean;
  points: number;
  order_index: number;
};

type CodeLanguage = "cpp" | "c" | "pascal" | "python";

type ProblemFormState = {
  title: string;
  slug: string;
  statement: string;
  official_solution: string;
  input_format: string;
  output_format: string;
  constraints: string;
  difficulty: "easy" | "medium" | "hard" | "facultate";
  time_limit_ms: number;
  memory_limit_mb: number;
  source: string;
  input_source: "stdin" | "file";
  output_target: "stdout" | "file";
  input_filename: string;
  output_filename: string;
  solution_mode: "full" | "function";
  function_template: string;
  checker_mode: "exact" | "custom";
  checker_code: string;
  level: ProblemLevel;
  chapterId: string;
  subcategoryId: string;
  extraTags: string;
  tests: TestCaseForm[];
};

function buildPayloadFromForm(form: ProblemFormState): ImportDraftPayload {
  const tags = Array.from(
    new Set(
      form.extraTags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  );

  return {
    title: form.title.trim(),
    slug: form.slug.trim(),
    statement: form.statement.trim(),
    official_solution: form.official_solution.trim(),
    input_format: form.input_format.trim(),
    output_format: form.output_format.trim(),
    constraints: form.constraints.trim(),
    difficulty: form.difficulty,
    time_limit_ms: Number(form.time_limit_ms),
    memory_limit_mb: Number(form.memory_limit_mb),
    tags,
    source: form.source.trim(),
    input_source: form.input_source,
    output_target: form.output_target,
    input_filename: form.input_source === "file" ? form.input_filename.trim() : undefined,
    output_filename: form.output_target === "file" ? form.output_filename.trim() : undefined,
    curriculum_level: form.level,
    curriculum_chapter_id: form.chapterId,
    curriculum_subcategory_id: form.subcategoryId,
    solution_mode: form.solution_mode,
    function_template: form.solution_mode === "function" ? form.function_template : undefined,
    checker_mode: form.checker_mode,
    checker_code: form.checker_mode === "custom" ? form.checker_code : undefined,
    tests: form.tests.map((test, index) => ({
      input: test.input,
      expected_output: test.expected_output,
      is_sample: test.is_sample,
      points: Number(test.points),
      order_index: index + 1,
    })),
  };
}

const sourceOptions = [
  "Sursa interna",
  "Bacalaureat",
  "Olimpiada Judeteana",
  "Olimpiada Nationala",
  "Infoarena",
  "Codeforces",
  "AtCoder",
  "Manual / Culegere",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isProblemLevel(value: unknown): value is ProblemLevel {
  return (
    value === "grade9" ||
    value === "grade10" ||
    value === "grade11" ||
    value === "bacalaureat" ||
    value === "oop" ||
    value === "concursuri"
  );
}

function getSafeLevel(value: unknown): ProblemLevel {
  return isProblemLevel(value) ? value : "grade9";
}

function getSafeChapter(level: ProblemLevel, chapterId?: string | null) {
  const chapters = taxonomy[level] ?? [];
  const fallback = chapters[0];
  const selected = chapterId ? chapters.find((entry) => entry.id === chapterId) : undefined;
  return { chapters, chapter: selected ?? fallback };
}

function getDefaultFormState(): ProblemFormState {
  const defaultLevel: ProblemLevel = "grade9";
  const defaultChapter = taxonomy[defaultLevel][0];
  const defaultSubcategory = defaultChapter.subcategories[0];

  return {
    title: "",
    slug: "",
    statement: "",
    official_solution: "",
    input_format: "",
    output_format: "",
    constraints: "",
    difficulty: "medium",
    time_limit_ms: 1000,
    memory_limit_mb: 128,
    source: sourceOptions[0],
    input_source: "stdin",
    output_target: "stdout",
    input_filename: "bac.in",
    output_filename: "bac.out",
    solution_mode: "full",
    function_template: "",
    checker_mode: "exact",
    checker_code: "",
    level: defaultLevel,
    chapterId: defaultChapter.id,
    subcategoryId: defaultSubcategory.id,
    extraTags: "",
    tests: [
      {
        input: "",
        expected_output: "",
        is_sample: true,
        points: 10,
        order_index: 1,
      },
    ],
  };
}

function extractApiErrorMessage(raw: string): string {
  const jsonStart = raw.indexOf("{");
  if (jsonStart === -1) {
    return raw;
  }

  try {
    const parsed = JSON.parse(raw.slice(jsonStart)) as {
      error?: string;
      details?: {
        fieldErrors?: Record<string, string[]>;
      };
    };
    const fieldErrors = parsed.details?.fieldErrors ?? {};
    const flattened = Object.entries(fieldErrors).flatMap(([key, messages]) => messages.map((message) => `${key}: ${message}`));
    if (flattened.length > 0) {
      return `${parsed.error ?? "Date invalide"} - ${flattened.join(" | ")}`;
    }
    return parsed.error ?? raw;
  } catch {
    return raw;
  }
}

export default function AdminPage() {
  const [form, setForm] = useState<ProblemFormState>(getDefaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drafts, setDrafts] = useState<ImportDraft[]>([]);
  const [expandedDrafts, setExpandedDrafts] = useState<string[]>([]);
  const [adminProblems, setAdminProblems] = useState<AdminProblemListItem[]>([]);
  const [isLoadingAdminProblems, setIsLoadingAdminProblems] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [jsonImportInput, setJsonImportInput] = useState("");
  const [officialLanguage, setOfficialLanguage] = useState<CodeLanguage>("cpp");
  const [isTestingOfficial, setIsTestingOfficial] = useState(false);
  const [officialTestResult, setOfficialTestResult] = useState<{
    status: string;
    score: number;
    is_full_score: boolean;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const draftCountText = useMemo(() => `${drafts.length} draft-uri`, [drafts.length]);
  const { chapters: chapterOptions, chapter: selectedChapter } = getSafeChapter(form.level, form.chapterId);
  const subcategoryOptions = selectedChapter?.subcategories ?? [];

  useEffect(() => {
    void loadDrafts();
    void loadAdminProblems();
  }, []);

  useEffect(() => {
    const payload = buildPayloadFromForm(form);
    setJsonImportInput(JSON.stringify({ payload }, null, 2));
  }, [form]);

  const loadDrafts = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await apiFetch<{ data: ImportDraft[] }>("/api/problems/import-drafts");
      setDrafts(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut incarca draft-urile");
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadAdminProblems = async () => {
    setIsLoadingAdminProblems(true);
    try {
      const response = await apiFetch<{ data: AdminProblemListItem[] }>("/api/problems/admin/list");
      setAdminProblems(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut incarca lista de probleme.");
    } finally {
      setIsLoadingAdminProblems(false);
    }
  };

  const startEditingProblem = async (problemId: string) => {
    setError(null);
    setMessage(null);
    try {
      const response = await apiFetch<{ data: AdminProblemDetails }>(`/api/problems/admin/${problemId}`);
      const problem = response.data;
      const safeLevel = getSafeLevel(problem.curriculum_level);
      const { chapter } = getSafeChapter(safeLevel, problem.curriculum_chapter_id);
      if (!chapter || chapter.subcategories.length === 0) {
        throw new Error("Taxonomia este incompleta pentru nivelul selectat.");
      }
      const safeSubcategory = problem.curriculum_subcategory_id ?? chapter.subcategories[0]?.id ?? "";
      setForm((prev) => ({
        ...prev,
        title: problem.title,
        slug: problem.slug,
        statement: problem.statement,
        official_solution: problem.official_solution ?? "",
        input_format: problem.input_format,
        output_format: problem.output_format,
        constraints: problem.constraints,
        difficulty: problem.difficulty,
        time_limit_ms: problem.time_limit_ms,
        memory_limit_mb: problem.memory_limit_mb,
        input_source: problem.input_source,
        output_target: problem.output_target,
        input_filename: problem.input_filename ?? "bac.in",
        output_filename: problem.output_filename ?? "bac.out",
        solution_mode: problem.solution_mode,
        function_template: problem.function_template ?? "",
        checker_mode: problem.checker_mode ?? "exact",
        checker_code: problem.checker_code ?? "",
        level: safeLevel,
        chapterId: chapter.id,
        subcategoryId: chapter.subcategories.find((entry) => entry.id === safeSubcategory)?.id ?? chapter.subcategories[0].id,
        extraTags: (problem.tags ?? []).join(", "),
        tests:
          problem.tests?.length > 0
            ? problem.tests.map((test, index) => ({
                input: test.input,
                expected_output: test.expected_output,
                is_sample: Boolean(test.is_sample),
                points: Number(test.points ?? 0),
                order_index: Number(test.order_index ?? index + 1),
              }))
            : prev.tests,
      }));
      setEditingProblemId(problem.id);
      setMessage(`Editezi problema: ${problem.title}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut incarca problema pentru editare.");
    }
  };

  const createDraft = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      if (form.title.trim().length < 3) {
        throw new Error("Titlul trebuie sa aiba minim 3 caractere.");
      }
      if (form.slug.trim().length < 3) {
        throw new Error("Slug-ul trebuie sa aiba minim 3 caractere.");
      }
      if (form.statement.trim().length < 10) {
        throw new Error("Enuntul trebuie sa aiba minim 10 caractere.");
      }
      if (form.official_solution.trim().length < 10) {
        throw new Error("Solutia oficiala trebuie sa aiba minim 10 caractere.");
      }
      if (form.source.trim().length < 2) {
        throw new Error("Sursa trebuie sa aiba minim 2 caractere.");
      }
      if (form.input_source === "file" && form.input_filename.trim().length === 0) {
        throw new Error("Daca input-ul este din fisier, completeaza numele fisierului de input.");
      }
      if (form.output_target === "file" && form.output_filename.trim().length === 0) {
        throw new Error("Daca output-ul este in fisier, completeaza numele fisierului de output.");
      }
      if (form.solution_mode === "function" && form.function_template.trim().length < 10) {
        throw new Error("In modul functie, completeaza codul template (minim 10 caractere).");
      }
      if (form.checker_mode === "custom" && form.checker_code.trim().length < 10) {
        throw new Error("Pentru checker custom completeaza codul verificatorului (minim 10 caractere).");
      }
      if (!Number.isFinite(form.time_limit_ms) || Number(form.time_limit_ms) <= 0) {
        throw new Error("Time limit trebuie sa fie un numar pozitiv.");
      }
      if (!Number.isFinite(form.memory_limit_mb) || Number(form.memory_limit_mb) <= 0) {
        throw new Error("Memory limit trebuie sa fie un numar pozitiv.");
      }
      if (form.tests.length === 0) {
        throw new Error("Adauga cel putin un test.");
      }
      if (!form.tests.some((test) => test.is_sample)) {
        throw new Error("Trebuie minim un test marcat ca sample.");
      }
      if (form.tests.some((test) => test.input.trim().length === 0 || test.expected_output.trim().length === 0)) {
        throw new Error("Fiecare test trebuie sa aiba input si expected output completate.");
      }
      if (form.tests.some((test) => !Number.isFinite(test.points) || Number(test.points) < 0)) {
        throw new Error("Punctajul fiecarui test trebuie sa fie >= 0.");
      }

      const payloadData = buildPayloadFromForm(form);
      const payload: { payload: ImportDraftPayload } = {
        payload: payloadData,
      };

      await apiFetch("/api/problems/import-draft", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage("Draft creat cu succes. Verifica raportul de validare si apoi aproba publicarea.");
      setForm(getDefaultFormState());
      await loadDrafts();
    } catch (err) {
      if (err instanceof Error) {
        setError(extractApiErrorMessage(err.message));
      } else {
        setError("Eroare la creare draft");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveProblemEdit = async () => {
    if (!editingProblemId) return;
    setIsSavingEdit(true);
    setError(null);
    setMessage(null);
    try {
      const payloadData = buildPayloadFromForm(form);
      await apiFetch(`/api/problems/admin/${editingProblemId}`, {
        method: "PUT",
        body: JSON.stringify(payloadData),
      });
      setMessage("Problema a fost actualizata cu succes.");
      await loadAdminProblems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut salva modificarile problemei.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const importJsonIntoForm = () => {
    setError(null);
    setMessage(null);
    try {
      const parsed = JSON.parse(jsonImportInput) as ImportDraftPayload | { payload: ImportDraftPayload };
      const payload = "payload" in parsed ? parsed.payload : parsed;

      const level = getSafeLevel(payload.curriculum_level);
      const { chapter } = getSafeChapter(level, payload.curriculum_chapter_id);
      if (!chapter || chapter.subcategories.length === 0) {
        throw new Error("Taxonomia este incompleta pentru nivelul selectat.");
      }
      const subcategoryId = payload.curriculum_subcategory_id ?? chapter.subcategories[0].id;
      const subcategory = chapter.subcategories.find((entry) => entry.id === subcategoryId) ?? chapter.subcategories[0];

      setForm((prev) => ({
        ...prev,
        title: payload.title ?? "",
        slug: payload.slug ?? "",
        statement: payload.statement ?? "",
        official_solution: payload.official_solution ?? "",
        input_format: payload.input_format ?? "",
        output_format: payload.output_format ?? "",
        constraints: payload.constraints ?? "",
        difficulty: payload.difficulty ?? "medium",
        time_limit_ms: Number(payload.time_limit_ms ?? 1000),
        memory_limit_mb: Number(payload.memory_limit_mb ?? 128),
        source: payload.source ?? "Sursa interna",
        input_source: payload.input_source ?? "stdin",
        output_target: payload.output_target ?? "stdout",
        input_filename: payload.input_filename ?? "bac.in",
        output_filename: payload.output_filename ?? "bac.out",
        solution_mode: payload.solution_mode ?? "full",
        function_template: payload.function_template ?? "",
        checker_mode: payload.checker_mode ?? "exact",
        checker_code: payload.checker_code ?? "",
        level,
        chapterId: chapter.id,
        subcategoryId: subcategory.id,
        extraTags: (payload.tags ?? []).join(", "),
        tests:
          payload.tests?.length > 0
            ? payload.tests.map((test, index) => ({
                input: test.input ?? "",
                expected_output: test.expected_output ?? "",
                is_sample: Boolean(test.is_sample),
                points: Number(test.points ?? 0),
                order_index: Number(test.order_index ?? index + 1),
              }))
            : prev.tests,
      }));
      setMessage("Formular completat din JSON.");
    } catch (err) {
      setError(err instanceof Error ? `JSON invalid: ${err.message}` : "JSON invalid.");
    }
  };

  const deleteProblem = async () => {
    if (!editingProblemId) return;
    const confirmDelete = window.confirm("Sigur vrei sa stergi aceasta problema? Actiunea este ireversibila.");
    if (!confirmDelete) return;

    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/api/problems/admin/${editingProblemId}`, {
        method: "DELETE",
      });
      setMessage("Problema a fost stearsa.");
      setEditingProblemId(null);
      setForm(getDefaultFormState());
      await loadAdminProblems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut sterge problema.");
    }
  };

  const testOfficialSolution = async () => {
    setIsTestingOfficial(true);
    setError(null);
    setOfficialTestResult(null);
    try {
      const payloadData = buildPayloadFromForm(form);
      const response = await apiFetch<{
        data: { status: string; score: number; is_full_score: boolean };
      }>("/api/problems/admin/test-official", {
        method: "POST",
        body: JSON.stringify({
          language: officialLanguage,
          official_solution: form.official_solution,
          payload: payloadData,
        }),
      });
      setOfficialTestResult(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut testa solutia oficiala.");
    } finally {
      setIsTestingOfficial(false);
    }
  };

  const approveDraft = async (draftId: string) => {
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/api/problems/import-drafts/${draftId}/approve`, { method: "POST" });
      setMessage("Draft aprobat si publicat.");
      await loadDrafts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare la aprobare");
    }
  };

  const rejectDraft = async (draftId: string) => {
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/api/problems/import-drafts/${draftId}/reject`, { method: "POST" });
      setMessage("Draft respins.");
      await loadDrafts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare la respingere");
    }
  };

  const togglePreview = (draftId: string) => {
    setExpandedDrafts((prev) => (prev.includes(draftId) ? prev.filter((id) => id !== draftId) : [...prev, draftId]));
  };

  const setField = <K extends keyof ProblemFormState>(key: K, value: ProblemFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addTestCase = () => {
    setForm((prev) => ({
      ...prev,
      tests: [
        ...prev.tests,
        {
          input: "",
          expected_output: "",
          is_sample: false,
          points: 0,
          order_index: prev.tests.length + 1,
        },
      ],
    }));
  };

  const removeTestCase = (index: number) => {
    setForm((prev) => ({
      ...prev,
      tests: prev.tests.filter((_, idx) => idx !== index).map((test, idx) => ({ ...test, order_index: idx + 1 })),
    }));
  };

  const updateTestCase = <K extends keyof TestCaseForm>(index: number, key: K, value: TestCaseForm[K]) => {
    setForm((prev) => ({
      ...prev,
      tests: prev.tests.map((test, idx) => (idx === index ? { ...test, [key]: value } : test)),
    }));
  };

  return (
    <RequireAuth>
      <main className="min-h-screen bg-gradient-to-b from-violet-50/50 via-white to-zinc-100/80">
        <section id="admin-probleme" className="mx-auto max-w-7xl scroll-mt-24 px-6 pb-6 pt-10">
          <div className="rounded-3xl border border-violet-200/60 bg-white/90 p-6 shadow-xl shadow-violet-100/40 backdrop-blur">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard Admin - Adaugare Probleme</h1>
            <p className="mt-2 text-sm text-zinc-600">Completeaza formularul manual, adauga testele dorite, apoi valideaza draftul pentru publicare.</p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 pb-12 xl:grid-cols-[1.35fr_1fr]">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-900">Import rapid JSON in formular</p>
              <p className="mt-1 text-xs text-zinc-600">Accepta format direct sau obiect cu cheia `payload`.</p>
              <textarea
                value={jsonImportInput}
                onChange={(event) => setJsonImportInput(event.target.value)}
                placeholder='Ex: {"payload":{"title":"...","tests":[...]}}'
                className="mt-2 h-24 w-full rounded-xl border border-zinc-300 bg-white p-2 font-mono text-xs text-slate-900 outline-none ring-violet-400 focus:ring-2"
              />
              <div className="mt-2">
                <button
                  type="button"
                  onClick={importJsonIntoForm}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100"
                >
                  Importa JSON in formular
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-zinc-700">
                Titlu problema
                <input
                  value={form.title}
                  onChange={(event) => {
                    const title = event.target.value;
                    setField("title", title);
                    if (!form.slug.trim()) {
                      setField("slug", slugify(title));
                    }
                  }}
                  placeholder="Ex: Interogari simple"
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
                />
              </label>
              <label className="text-sm font-medium text-zinc-700">
                Slug
                <div className="mt-1 flex gap-2">
                  <input
                    value={form.slug}
                    onChange={(event) => setField("slug", slugify(event.target.value))}
                    placeholder="interogari-simple"
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
                  />
                  <button
                    type="button"
                    onClick={() => setField("slug", slugify(form.title))}
                    className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    Auto
                  </button>
                </div>
              </label>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm font-medium text-zinc-700">
                Nivel
                <select
                  value={form.level}
                  onChange={(event) => {
                    const level = event.target.value as ProblemLevel;
                    const chapter = taxonomy[level]?.[0];
                    if (!chapter || chapter.subcategories.length === 0) {
                      return;
                    }
                    setForm((prev) => ({
                      ...prev,
                      level,
                      chapterId: chapter.id,
                      subcategoryId: chapter.subcategories[0].id,
                    }));
                  }}
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
                >
                  {levelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-zinc-700">
                Capitol
                <select
                  value={form.chapterId}
                  onChange={(event) => {
                    const chapterId = event.target.value;
                    const chapter = chapterOptions.find((entry) => entry.id === chapterId) ?? chapterOptions[0];
                    if (!chapter || chapter.subcategories.length === 0) {
                      return;
                    }
                    setForm((prev) => ({
                      ...prev,
                      chapterId,
                      subcategoryId: chapter.subcategories[0].id,
                    }));
                  }}
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
                >
                  {chapterOptions.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-zinc-700">
                Subcategorie
                <select
                  value={form.subcategoryId}
                  onChange={(event) => setField("subcategoryId", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
                >
                  {subcategoryOptions.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-zinc-700">
                Dificultate
                <select
                  value={form.difficulty}
                  onChange={(event) => setField("difficulty", event.target.value as ProblemFormState["difficulty"])}
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="facultate">Facultate</option>
                </select>
              </label>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="text-sm font-medium text-zinc-700">
                Sursa
                <select
                  value={form.source}
                  onChange={(event) => setField("source", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
                >
                  {sourceOptions.map((sourceOption) => (
                    <option key={sourceOption} value={sourceOption}>
                      {sourceOption}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-zinc-700">
                Time limit (ms)
                <input
                  type="number"
                  min={1}
                  value={form.time_limit_ms}
                  onChange={(event) => setField("time_limit_ms", Number(event.target.value))}
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
                />
              </label>
              <label className="text-sm font-medium text-zinc-700">
                Memory limit (MB)
                <input
                  type="number"
                  min={1}
                  value={form.memory_limit_mb}
                  onChange={(event) => setField("memory_limit_mb", Number(event.target.value))}
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
                />
              </label>
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-900">Configuratie I/O problema</p>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-zinc-700">
                  Input citit din
                  <select
                    value={form.input_source}
                    onChange={(event) => setField("input_source", event.target.value as "stdin" | "file")}
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
                  >
                    <option value="stdin">Consola (stdin)</option>
                    <option value="file">Fisier</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-zinc-700">
                  Output scris in
                  <select
                    value={form.output_target}
                    onChange={(event) => setField("output_target", event.target.value as "stdout" | "file")}
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
                  >
                    <option value="stdout">Consola (stdout)</option>
                    <option value="file">Fisier</option>
                  </select>
                </label>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-zinc-700">
                  Nume fisier input
                  <input
                    value={form.input_filename}
                    onChange={(event) => setField("input_filename", event.target.value)}
                    disabled={form.input_source !== "file"}
                    placeholder="ex: bac.in"
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2 disabled:bg-zinc-100"
                  />
                </label>
                <label className="text-sm font-medium text-zinc-700">
                  Nume fisier output
                  <input
                    value={form.output_filename}
                    onChange={(event) => setField("output_filename", event.target.value)}
                    disabled={form.output_target !== "file"}
                    placeholder="ex: bac.out"
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2 disabled:bg-zinc-100"
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-zinc-600">
                Exemple suportate: stdin {"->"} stdout, fisier {"->"} fisier, fisier {"->"} stdout, stdin {"->"} fisier.
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-900">Mod evaluare cod</p>
              <label className="mt-3 block text-sm font-medium text-zinc-700">
                Tip solutie trimisa de utilizator
                <select
                  value={form.solution_mode}
                  onChange={(event) => setField("solution_mode", event.target.value as "full" | "function")}
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
                >
                  <option value="full">Program complet (ca pana acum)</option>
                  <option value="function">Implementare functie (codul user-ului e inserat in template)</option>
                </select>
              </label>
              {form.solution_mode === "function" ? (
                <label className="mt-3 block text-sm font-medium text-zinc-700">
                  Template cod pentru testare
                  <textarea
                    value={form.function_template}
                    onChange={(event) => setField("function_template", event.target.value)}
                    placeholder={"Exemplu:\nint sumNr(int a, int b);\nint main(){/* teste */}\n__USER_CODE__"}
                    className="mt-1 h-44 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 font-mono text-xs outline-none ring-violet-400 focus:ring-2"
                  />
                  <span className="mt-1 block text-xs text-zinc-600">
                    Daca folosesti markerul <code>__USER_CODE__</code>, codul utilizatorului e inserat exact acolo.
                    Daca nu exista marker, codul utilizatorului se adauga la finalul template-ului.
                  </span>
                </label>
              ) : null}
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-900">Verificare raspuns</p>
              <label className="mt-2 block text-sm font-medium text-zinc-700">
                Tip verificare
                <select
                  value={form.checker_mode}
                  onChange={(event) => setField("checker_mode", event.target.value as "exact" | "custom")}
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
                >
                  <option value="exact">Exact match (expected_output)</option>
                  <option value="custom">Checker custom JavaScript</option>
                </select>
              </label>
              {form.checker_mode === "custom" ? (
                <label className="mt-3 block text-sm font-medium text-zinc-700">
                  Cod checker JS (trebuie sa defineasca functia <code>check</code>)
                  <textarea
                    value={form.checker_code}
                    onChange={(event) => setField("checker_code", event.target.value)}
                    placeholder={"function check({ input, expectedOutput, actualOutput }) {\n  return actualOutput.trim() === expectedOutput.trim();\n}"}
                    className="mt-1 h-40 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 font-mono text-xs outline-none ring-violet-400 focus:ring-2"
                  />
                </label>
              ) : null}
            </div>

            <label className="mt-4 block text-sm font-medium text-zinc-700">
              Tag-uri extra (separate prin virgula)
              <input
                value={form.extraTags}
                onChange={(event) => setField("extraTags", event.target.value)}
                placeholder="ex: binary-search, vectori, interogari"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
              />
            </label>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <label className="text-sm font-medium text-zinc-700">
                Enunt
                <textarea
                  value={form.statement}
                  onChange={(event) => setField("statement", event.target.value)}
                  className="mt-1 h-40 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
                />
              </label>
              <label className="text-sm font-medium text-zinc-700">
                Format input
                <textarea
                  value={form.input_format}
                  onChange={(event) => setField("input_format", event.target.value)}
                  className="mt-1 h-24 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
                />
              </label>
              <label className="text-sm font-medium text-zinc-700">
                Format output
                <textarea
                  value={form.output_format}
                  onChange={(event) => setField("output_format", event.target.value)}
                  className="mt-1 h-24 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
                />
              </label>
              <label className="text-sm font-medium text-zinc-700">
                Constrangeri
                <textarea
                  value={form.constraints}
                  onChange={(event) => setField("constraints", event.target.value)}
                  className="mt-1 h-24 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
                />
              </label>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-900">Teste ({form.tests.length})</p>
                <button
                  type="button"
                  onClick={addTestCase}
                  className="rounded-xl bg-violet-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-800"
                >
                  + Adauga test
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {form.tests.map((test, index) => (
                  <div key={`test-${index}`} className="rounded-xl border border-zinc-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Test #{index + 1}</p>
                      {form.tests.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeTestCase(index)}
                          className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                        >
                          Sterge
                        </button>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      <label className="text-xs font-medium text-zinc-700">
                        Input
                        <textarea
                          value={test.input}
                          onChange={(event) => updateTestCase(index, "input", event.target.value)}
                          className="mt-1 h-24 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-2 py-1.5 font-mono text-xs outline-none ring-violet-400 focus:ring-2"
                        />
                      </label>
                      <label className="text-xs font-medium text-zinc-700">
                        Expected output
                        <textarea
                          value={test.expected_output}
                          onChange={(event) => updateTestCase(index, "expected_output", event.target.value)}
                          className="mt-1 h-24 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-2 py-1.5 font-mono text-xs outline-none ring-violet-400 focus:ring-2"
                        />
                      </label>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-700">
                        <input
                          type="checkbox"
                          checked={test.is_sample}
                          onChange={(event) => updateTestCase(index, "is_sample", event.target.checked)}
                          className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                        />
                        Sample test
                      </label>
                      <label className="text-xs font-medium text-zinc-700">
                        Puncte
                        <input
                          type="number"
                          min={0}
                          value={test.points}
                          onChange={(event) => updateTestCase(index, "points", Number(event.target.value))}
                          className="ml-2 w-20 rounded-lg border border-zinc-300 px-2 py-1 text-xs outline-none ring-violet-400 focus:ring-2"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-900">Solutie oficiala (editor avansat)</p>
                <div className="flex items-center gap-2">
                  <select
                    value={officialLanguage}
                    onChange={(event) => setOfficialLanguage(event.target.value as CodeLanguage)}
                    className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs"
                  >
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                    <option value="pascal">Pascal</option>
                    <option value="python">Python</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void testOfficialSolution()}
                    disabled={isTestingOfficial}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isTestingOfficial ? "Testez..." : "Testeaza pe toate testele (100p)"}
                  </button>
                </div>
              </div>
              <CodeEditor value={form.official_solution} onChange={(value) => setField("official_solution", value)} language={officialLanguage} />
              {officialTestResult ? (
                <p
                  className={`mt-3 rounded-lg border p-2 text-xs ${
                    officialTestResult.is_full_score
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  Rezultat test oficial: {officialTestResult.status} - scor {officialTestResult.score}/100
                </p>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {editingProblemId ? (
                <>
                  <button
                    type="button"
                    onClick={() => void saveProblemEdit()}
                    disabled={isSavingEdit}
                    className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-50"
                  >
                    {isSavingEdit ? "Se salveaza..." : "Salveaza modificarile problemei"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProblemId(null);
                      setForm(getDefaultFormState());
                      setMessage("Ai iesit din modul editare.");
                    }}
                    className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                  >
                    Iesi din editare
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteProblem()}
                    className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                  >
                    Sterge problema
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => void createDraft()}
                  disabled={isSubmitting}
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
                >
                  {isSubmitting ? "Se valideaza..." : "Valideaza si salveaza draft"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setForm(getDefaultFormState())}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
              >
                Reset formular
              </button>
            </div>
            {message ? <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">{message}</p> : null}
            {error ? <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null}
          </div>

          <section className="h-fit rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-5 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-800">Dashboard editare probleme existente</p>
                <button
                  type="button"
                  onClick={() => void loadAdminProblems()}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Refresh probleme
                </button>
              </div>
              {isLoadingAdminProblems ? (
                <p className="mt-2 text-xs text-zinc-500">Se incarca problemele...</p>
              ) : (
                <div className="mt-3 max-h-72 space-y-2 overflow-auto">
                  {adminProblems.map((problem) => (
                    <button
                      key={problem.id}
                      type="button"
                      onClick={() => void startEditingProblem(problem.id)}
                      className={`w-full rounded-lg border p-2 text-left text-xs transition hover:bg-white ${
                        editingProblemId === problem.id ? "border-violet-300 bg-violet-50" : "border-zinc-200 bg-white"
                      }`}
                    >
                      <p className="font-semibold text-zinc-900">{problem.title}</p>
                      <p className="text-zinc-600">
                        {problem.slug} • {problem.curriculum_level ?? "fara nivel"} / {problem.curriculum_chapter_id ?? "-"} / {problem.curriculum_subcategory_id ?? "-"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-800">Draft-uri import ({draftCountText})</p>
              <button
                type="button"
                onClick={() => void loadDrafts()}
                disabled={isRefreshing}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
              >
                {isRefreshing ? "Se incarca..." : "Reincarca"}
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {drafts.length === 0 ? (
                <p className="text-sm text-zinc-500">Nu exista draft-uri inca.</p>
              ) : (
                drafts.map((draft) => (
                  <div key={draft.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{draft.payload.title}</p>
                        <p className="text-xs text-zinc-600">
                          slug: {draft.payload.slug} • status: {draft.status} • {new Date(draft.created_at).toLocaleString("ro-RO")}
                        </p>
                      </div>
                      {draft.status === "draft" ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => togglePreview(draft.id)}
                            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                          >
                            {expandedDrafts.includes(draft.id) ? "Ascunde preview" : "Preview"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void approveDraft(draft.id)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                          >
                            Aproba si publica
                          </button>
                          <button
                            type="button"
                            onClick={() => void rejectDraft(draft.id)}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
                          >
                            Respinge
                          </button>
                        </div>
                      ) : (
                        <span className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs text-zinc-700">{draft.status}</span>
                      )}
                    </div>
                    <p className={`mt-2 text-xs font-medium ${draft.validation_report?.is_valid ? "text-emerald-700" : "text-rose-700"}`}>
                      {draft.validation_report?.summary ?? "Fara raport"}
                    </p>
                    <div className="mt-2 space-y-1">
                      {draft.validation_report?.checks?.map((check) => (
                        <p key={check.key} className={`text-xs ${check.ok ? "text-emerald-700" : "text-rose-700"}`}>
                          {check.ok ? "✓" : "✗"} {check.message}
                        </p>
                      ))}
                    </div>

                    {expandedDrafts.includes(draft.id) ? (
                      <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Preview draft</p>
                        <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-zinc-700 md:grid-cols-2">
                          <p>
                            <span className="font-medium">Dificultate:</span> {draft.payload.difficulty}
                          </p>
                          <p>
                            <span className="font-medium">Limite:</span> {draft.payload.time_limit_ms} ms / {draft.payload.memory_limit_mb} MB
                          </p>
                          <p>
                            <span className="font-medium">Sursa:</span> {draft.payload.source ?? "Sursa interna"}
                          </p>
                          <p>
                            <span className="font-medium">Teste:</span> {draft.payload.tests.length} (sample: {draft.payload.tests.filter((t) => t.is_sample).length})
                          </p>
                        </div>
                        <p className="mt-3 text-xs font-medium text-zinc-600">Enunt</p>
                        <pre className="mt-1 whitespace-pre-wrap rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-800">
                          {draft.payload.statement}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>
        </section>
        <section id="admin-marketing" className="mx-auto max-w-7xl scroll-mt-24 px-6 pb-6">
          <div className="rounded-2xl border border-sky-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-sky-950">Marketing și conversii</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Funnel vizite → demo → cont → trial → plată, vânzări pe campanii și examene, cost reclame, CAC și ROAS.
            </p>
            <a
              href="/admin/marketing"
              className="mt-3 inline-flex rounded-lg border border-sky-200 px-3 py-2 text-sm font-medium text-sky-800 hover:bg-sky-50"
            >
              Deschide dashboard-ul de marketing
            </a>
          </div>
        </section>
        <section id="admin-subiecte-bac" className="mx-auto max-w-7xl scroll-mt-24 px-6 pb-6">
          <div className="rounded-2xl border border-sky-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-sky-950">Admin Subiecte BAC</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Adauga subiecte noi de bac (an, profil, PDF subiect + barem). Apare in arhiva si la rezolvare subiecte.
            </p>
            <a
              href="/admin/subiecte-bac"
              className="mt-3 inline-flex rounded-lg border border-sky-200 px-3 py-2 text-sm font-medium text-sky-800 hover:bg-sky-50"
            >
              Deschide Admin Subiecte BAC (PDF)
            </a>
          </div>
        </section>
        <section id="admin-bac-exam" className="mx-auto max-w-7xl scroll-mt-24 px-6 pb-6">
          <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-emerald-950">Bac Exam — corectare automata</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Builder pentru subiecte interactive: grile, pseudocod, C++, teste automate, punctaje configurabile, preview live.
            </p>
            <a
              href="/admin/bac-exam"
              className="mt-3 inline-flex rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
            >
              Deschide Builder Bac Exam
            </a>
          </div>
        </section>
        <section id="admin-fisiere-claude" className="mx-auto max-w-7xl scroll-mt-24 px-6 pb-6">
          <div className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-violet-950">Fisiere Claude</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Incarca poze, PDF-uri si fisiere cu cod ca referinta. Copiezi calea si mi-o dai in chat cand imi ceri
              sa fac ceva.
            </p>
            <a
              href="/admin/fisiere-claude"
              className="mt-3 inline-flex rounded-lg border border-violet-200 px-3 py-2 text-sm font-medium text-violet-800 hover:bg-violet-50"
            >
              Deschide Fisiere Claude
            </a>
          </div>
        </section>
        <section id="admin-cursuri" className="mx-auto max-w-7xl scroll-mt-24 px-6 pb-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900">Admin Cursuri</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Incarca arhive ZIP cu resursele cursurilor pentru elevii care au acces la cel putin o parte.
            </p>
            <a
              href="/admin/cursuri"
              className="mt-3 inline-flex rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              Deschide Admin Cursuri
            </a>
          </div>
        </section>
        <section id="admin-grile" className="mx-auto max-w-7xl scroll-mt-24 px-6 pb-12">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900">Admin Grile</h2>
            <p className="mt-2 text-sm text-zinc-600">Zona AI pentru generare indicii/explicatii este disponibila separat.</p>
            <a
              href="/admin/grile-ai"
              className="mt-3 inline-flex rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              Deschide AI Grile
            </a>
          </div>
        </section>
      </main>
    </RequireAuth>
  );
}
