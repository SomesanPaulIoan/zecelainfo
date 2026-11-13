import type { ProblemItem } from "@/lib/problem-taxonomy";

/**
 * Bază API:
 * - Browser: dacă `NEXT_PUBLIC_API_URL` e goală → same-origin (`/api/...` prin nginx pe același host).
 * - Server (RSC/SSR în Docker): `INTERNAL_API_URL` (ex. `http://backend:4000`) ca să nu depindă de domeniul public.
 */
function resolveApiBaseUrl(): string {
  const rawPublic = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();

  if (typeof window !== "undefined") {
    if (!rawPublic) {
      return "";
    }
    if (window.location.protocol === "https:" && rawPublic.startsWith("http://localhost")) {
      return "";
    }
    return rawPublic;
  }

  const internal = (process.env.INTERNAL_API_URL ?? "").trim();
  if (internal) {
    return internal;
  }
  if (rawPublic) {
    return rawPublic;
  }
  return "http://127.0.0.1:4000";
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("zecelainfo_token");
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }
  }

  const base = resolveApiBaseUrl();
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

type ProblemsListResponse = {
  data: { problems: ProblemItem[]; total: number; page: number; limit: number };
};

/**
 * Aduna toate problemele publicate, paginand peste limita per-request a API-ului `/api/problems`
 * (implicit 500, capata la 1000) — paginile de catalog au nevoie de arborele complet, nu doar
 * de prima pagina, altfel capitole/subcategorii intregi dispar din acordeon fara niciun mesaj de eroare.
 */
export async function fetchAllProblems(baseParams: URLSearchParams): Promise<{ problems: ProblemItem[]; total: number }> {
  const pageSize = 1000;
  const problems: ProblemItem[] = [];
  let total = 0;
  let page = 1;

  while (true) {
    const params = new URLSearchParams(baseParams);
    params.set("limit", String(pageSize));
    params.set("page", String(page));
    const response = await apiFetch<ProblemsListResponse>(`/api/problems?${params.toString()}`);
    problems.push(...response.data.problems);
    total = response.data.total;
    if (response.data.problems.length < pageSize || problems.length >= total) break;
    page += 1;
  }

  return { problems, total };
}

/**
 * GET (PDF etc.) with Bearer token and open in a new tab.
 * Foloseste un link programatic catre un blob URL (nu `window.open` dupa `await`), ca sa nu pierdem
 * contextul de deschidere si sa nu apara fals „pop-up blocat” cand tab-ul s-a deschis de fapt.
 */
export async function openAuthenticatedDocumentInNewTab(path: string): Promise<void> {
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("zecelainfo_token");
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }
  }

  const base = resolveApiBaseUrl();
  const response = await fetch(`${base}${path}`, {
    method: "GET",
    headers,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status}: ${text}`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = objectUrl;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 300_000);
}

/** Descarca un fisier autentificat (ex. arhiva ZIP curs) cu nume sugerat. */
export async function downloadAuthenticatedFile(path: string, fallbackFileName: string): Promise<void> {
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("zecelainfo_token");
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }
  }

  const base = resolveApiBaseUrl();
  const response = await fetch(`${base}${path}`, {
    method: "GET",
    headers,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status}: ${text}`);
  }

  const disposition = response.headers.get("content-disposition") ?? "";
  const match = /filename="([^"]+)"/i.exec(disposition);
  const fileName = match?.[1]?.trim() || fallbackFileName;

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export type PlaygroundLanguage = "cpp" | "c" | "pascal" | "python";

export type PlaygroundFile = { name: string; content: string };

export type PlaygroundIoConfig = {
  input_source: "stdin" | "file";
  input_filename: string | null;
  output_target: "stdout" | "file";
  output_filename: string | null;
};

export type PlaygroundRunRequest = PlaygroundIoConfig & {
  language: PlaygroundLanguage;
  code: string;
  stdin?: string;
  files?: PlaygroundFile[];
};

export type PlaygroundRunResult = {
  verdict: "AC" | "CE" | "TLE" | "RE" | "XX";
  stdout: string;
  stderr: string;
  timeMs: number;
  memoryKb: number;
  files: PlaygroundFile[];
};

export async function runPlayground(input: PlaygroundRunRequest): Promise<PlaygroundRunResult> {
  const response = await apiFetch<{ data: PlaygroundRunResult }>("/api/playground/run", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export type PlaygroundProject = PlaygroundIoConfig & {
  id: string;
  name: string;
  files: PlaygroundFile[];
  stdin: string;
  created_at: string;
  updated_at: string;
};

export type PlaygroundProjectInput = PlaygroundIoConfig & {
  name: string;
  files: PlaygroundFile[];
  stdin: string;
};

export async function listPlaygroundProjects(): Promise<PlaygroundProject[]> {
  const response = await apiFetch<{ data: PlaygroundProject[] }>("/api/playground/projects");
  return response.data;
}

export async function getPlaygroundProject(id: string): Promise<PlaygroundProject> {
  const response = await apiFetch<{ data: PlaygroundProject }>(`/api/playground/projects/${id}`);
  return response.data;
}

export async function createPlaygroundProject(input: PlaygroundProjectInput): Promise<PlaygroundProject> {
  const response = await apiFetch<{ data: PlaygroundProject }>("/api/playground/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function updatePlaygroundProject(id: string, input: PlaygroundProjectInput): Promise<PlaygroundProject> {
  const response = await apiFetch<{ data: PlaygroundProject }>(`/api/playground/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function deletePlaygroundProject(id: string): Promise<void> {
  await apiFetch<{ data: { deleted: boolean } }>(`/api/playground/projects/${id}`, {
    method: "DELETE",
  });
}
