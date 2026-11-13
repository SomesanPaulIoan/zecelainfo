"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

type LeadRow = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  grade: string;
  message: string | null;
  status: string;
  created_at: string;
};

type LeadsResponse = {
  data: LeadRow[];
};

type MeditationGroupMember = {
  user_id: string;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  last_session_date?: string | null;
};

type MeditationGroup = {
  id: string;
  name: string;
  weekday: number;
  start_time: string;
  end_time: string;
  created_at: string;
  members_count: number;
  members?: MeditationGroupMember[];
};

type GroupsWithMembersResponse = {
  data: MeditationGroup[];
};

const WEEKDAY_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: "Luni" },
  { value: 2, label: "Marti" },
  { value: 3, label: "Miercuri" },
  { value: 4, label: "Joi" },
  { value: 5, label: "Vineri" },
  { value: 6, label: "Sambata" },
  { value: 7, label: "Duminica" },
];

function weekdayLabel(weekday: number) {
  return WEEKDAY_OPTIONS.find((item) => item.value === weekday)?.label ?? `Ziua ${weekday}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ro-RO");
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function defaultHomeworkEndDateIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

type AdminHomeworkAssignmentRow = {
  id: string;
  kind: string;
  start_date: string;
  end_date: string;
  item_count: number;
};

type AdminHomeworkCurrentResponse = {
  data: {
    current: AdminHomeworkAssignmentRow | null;
    items: Array<
      AdminHomeworkAssignmentRow & {
        is_current: boolean;
      }
    >;
  };
};

function MeditationGroupHomeworkListSection({ groupId }: { groupId: string }) {
  const homeworkKey = `/api/meditations/admin/groups/${groupId}/homework`;
  const { data, isLoading } = useSWR<AdminHomeworkCurrentResponse>(homeworkKey, apiFetch);
  const items = (data?.data?.items ?? []).filter((row) => row.kind === "grile");

  return (
    <div className="space-y-3 rounded-xl border border-violet-200/80 bg-violet-50/40 p-4">
      <h3 className="text-sm font-bold text-violet-950">Teme grile</h3>
      <p className="text-sm text-slate-600">
        Toate temele de grile ale grupei, de la cea mai recenta dupa data de inceput. Tema marcata ca „curenta” este cea
        activa pentru elevi.
      </p>
      {isLoading ? <p className="text-sm text-zinc-600">Se incarca...</p> : null}
      {!isLoading && items.length === 0 ? (
        <p className="text-sm text-zinc-500">Nu exista inca nicio tema inregistrata.</p>
      ) : null}
      {!isLoading && items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-violet-200/60 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-violet-50/90 text-violet-900">
              <tr>
                <th className="px-3 py-2 font-semibold">Data inceput</th>
                <th className="px-3 py-2 font-semibold">Data final</th>
                <th className="px-3 py-2 font-semibold">Tip</th>
                <th className="px-3 py-2 font-semibold">Grile in lista</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Actiuni</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-t border-violet-100 text-slate-800">
                  <td className="px-3 py-2 whitespace-nowrap">{formatLastPresenceDate(row.start_date)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatLastPresenceDate(row.end_date)}</td>
                  <td className="px-3 py-2">{row.kind === "grile" ? "Grile" : "Probleme"}</td>
                  <td className="px-3 py-2 tabular-nums">{row.item_count}</td>
                  <td className="px-3 py-2">
                    {row.is_current && row.kind === "grile" ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
                        Tema curenta
                      </span>
                    ) : row.is_current ? (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-900">Curenta</span>
                    ) : (
                      <span className="text-xs text-slate-500">Istoric</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {row.kind === "grile" && row.item_count > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        <Link
                          href={`/admin/meditatii/teme/${row.id}/tema?groupId=${encodeURIComponent(groupId)}`}
                          className="inline-flex rounded-lg border border-sky-300 bg-sky-100 px-3 py-1.5 text-xs font-bold text-sky-900 transition hover:bg-sky-200"
                        >
                          Vezi tema
                        </Link>
                        <Link
                          href={`/admin/meditatii/teme/${row.id}/statistici?groupId=${encodeURIComponent(groupId)}`}
                          className="inline-flex rounded-lg border border-violet-300 bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-900 transition hover:bg-violet-200"
                        >
                          Statistici elevi
                        </Link>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

type ProblemsHomeworkStatsResponse = {
  data: {
    assignment: AdminHomeworkAssignmentRow & { group_id: string; group_name: string };
    problems: Array<{ id: string; slug: string; title: string }>;
    students: Array<{
      user_id: string;
      email: string;
      username: string;
      first_name: string | null;
      last_name: string | null;
      full_name: string | null;
    }>;
    scores: Record<string, Record<string, number[]>>;
  };
};

function studentLabel(s: { full_name: string | null; first_name: string | null; last_name: string | null; username: string; email: string }) {
  if (s.full_name?.trim()) return s.full_name.trim();
  const combined = [s.first_name, s.last_name].filter(Boolean).join(" ").trim();
  return combined || s.username || s.email;
}

/** Matricea probleme x elevi pentru o tema, incarcata doar cand acordeonul e deschis. */
function ProblemsHomeworkMatrix({ assignmentId }: { assignmentId: string }) {
  const { data, isLoading, error, mutate } = useSWR<ProblemsHomeworkStatsResponse>(
    `/api/meditations/admin/homework/${assignmentId}/problems-stats`,
    apiFetch,
  );
  const [removingProblemId, setRemovingProblemId] = useState<string | null>(null);

  if (isLoading) return <p className="px-4 py-3 text-sm text-zinc-600">Se incarca...</p>;
  if (error) {
    return (
      <p className="px-4 py-3 text-sm text-rose-700">{error instanceof Error ? error.message : "Nu am putut incarca tema."}</p>
    );
  }
  const { problems, students, scores } = data?.data ?? {
    problems: [] as ProblemsHomeworkStatsResponse["data"]["problems"],
    students: [] as ProblemsHomeworkStatsResponse["data"]["students"],
    scores: {} as ProblemsHomeworkStatsResponse["data"]["scores"],
  };
  if (students.length === 0) return <p className="px-4 py-3 text-sm text-zinc-500">Niciun elev in aceasta grupa.</p>;

  const removeProblem = async (problemId: string) => {
    if (!window.confirm("Sigur scoti aceasta problema din tema?")) return;
    setRemovingProblemId(problemId);
    try {
      await apiFetch(`/api/meditations/admin/homework/${assignmentId}/problems-items/${problemId}`, { method: "DELETE" });
      await mutate();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Nu am putut scoate problema din tema.");
    } finally {
      setRemovingProblemId(null);
    }
  };

  const totals = new Map<string, number>();
  for (const byUser of Object.values(scores)) {
    for (const [userId, list] of Object.entries(byUser)) {
      totals.set(userId, (totals.get(userId) ?? 0) + list.reduce((sum, v) => sum + v, 0));
    }
  }

  if (problems.length === 0) return <p className="px-4 py-3 text-sm text-zinc-500">Aceasta tema nu contine probleme.</p>;

  return (
    <div className="overflow-x-auto border-t border-violet-100 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-violet-50/90 text-violet-900">
          <tr>
            <th className="sticky left-0 bg-violet-50/90 px-3 py-2 font-semibold">Problema</th>
            {students.map((s) => (
              <th key={s.user_id} className="whitespace-nowrap px-3 py-2 font-semibold">
                <div className="flex flex-col gap-0.5">
                  <span>{studentLabel(s)}</span>
                  <Link
                    href={`/admin/meditatii/teme/${assignmentId}/probleme/elevi/${s.user_id}`}
                    target="_blank"
                    className="text-[10px] font-semibold uppercase tracking-wide text-violet-600 hover:underline"
                  >
                    Detalii elev
                  </Link>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {problems.map((p) => (
            <tr key={p.id} className="border-t border-violet-100 text-slate-800">
              <td className="sticky left-0 bg-white px-3 py-2 font-medium">
                <div className="flex items-center gap-2">
                  <Link href={`/problems/${p.slug}`} className="hover:underline" target="_blank">
                    {p.title}
                  </Link>
                  <button
                    type="button"
                    onClick={() => void removeProblem(p.id)}
                    disabled={removingProblemId === p.id}
                    title="Scoate problema din tema"
                    className="shrink-0 rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                  >
                    {removingProblemId === p.id ? "..." : "×"}
                  </button>
                </div>
              </td>
              {students.map((s) => {
                const attempts = scores[p.id]?.[s.user_id] ?? [];
                return (
                  <td key={s.user_id} className="whitespace-nowrap px-3 py-2 tabular-nums">
                    {attempts.length === 0 ? <span className="text-zinc-400">—</span> : attempts.join(", ")}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="border-t-2 border-violet-200 bg-violet-50/60 font-bold text-violet-950">
            <td className="sticky left-0 bg-violet-50/60 px-3 py-2">Total</td>
            {students.map((s) => (
              <td key={s.user_id} className="whitespace-nowrap px-3 py-2 tabular-nums">
                {totals.get(s.user_id) ?? 0}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ProblemsHomeworkAccordionItem({ row }: { row: AdminHomeworkAssignmentRow & { is_current: boolean } }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="group border-b border-violet-100 last:border-b-0" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 transition hover:bg-violet-50/70 [&::-webkit-details-marker]:hidden">
        <span className="text-sm font-semibold text-slate-800">
          {formatLastPresenceDate(row.start_date)} – {formatLastPresenceDate(row.end_date)}
        </span>
        <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>{row.item_count} probleme</span>
          {row.is_current ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-900">Tema curenta</span>
          ) : (
            <span className="text-slate-400">Istoric</span>
          )}
        </span>
      </summary>
      {open ? <ProblemsHomeworkMatrix assignmentId={row.id} /> : null}
    </details>
  );
}

function MeditationGroupProblemsHomeworkAccordionSection({ groupId }: { groupId: string }) {
  const homeworkKey = `/api/meditations/admin/groups/${groupId}/homework`;
  const { data, isLoading } = useSWR<AdminHomeworkCurrentResponse>(homeworkKey, apiFetch);
  const items = (data?.data?.items ?? []).filter((row) => row.kind === "problems");

  return (
    <div className="space-y-3 rounded-xl border border-violet-200/80 bg-violet-50/40 p-4">
      <h3 className="text-sm font-bold text-violet-950">Teme probleme</h3>
      <p className="text-sm text-slate-600">
        Toate temele de probleme ale grupei, de la cea mai recenta. Deschide o tema pentru a vedea, pentru fiecare problema
        si fiecare elev, toate incercarile (punctajele) de dupa data la care a fost pusa tema. Ultimul rand e punctajul
        total al elevului la tema.
      </p>
      {isLoading ? <p className="text-sm text-zinc-600">Se incarca...</p> : null}
      {!isLoading && items.length === 0 ? (
        <p className="text-sm text-zinc-500">Nu exista inca nicio tema de probleme inregistrata.</p>
      ) : null}
      {!isLoading && items.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-violet-200/60 bg-white">
          {items.map((row) => (
            <ProblemsHomeworkAccordionItem key={row.id} row={row} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MeditationGroupHomeworkSection({ groupId }: { groupId: string }) {
  const [kind, setKind] = useState<"grile" | "problems">("grile");
  const homeworkKey = `/api/meditations/admin/groups/${groupId}/homework?kind=${kind}`;
  const { data, mutate, isLoading } = useSWR<AdminHomeworkCurrentResponse>(homeworkKey, apiFetch);
  const current = data?.data?.current ?? null;
  const [startDate, setStartDate] = useState(() => todayIsoDate());
  const [endDate, setEndDate] = useState(() => defaultHomeworkEndDateIso());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const kindLabel = kind === "grile" ? "Grile" : "Probleme";
  const itemsLabel = kind === "grile" ? "grile" : "probleme";

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch<{ data: { id: string; created: boolean } }>(`/api/meditations/admin/groups/${groupId}/homework`, {
        method: "POST",
        body: JSON.stringify({
          kind,
          start_date: startDate,
          end_date: endDate,
        }),
      });
      setMessage(`Tema a fost salvata si este acum „tema curenta” pentru grupa (tip ${kindLabel}).`);
      setStartDate(todayIsoDate());
      setEndDate(defaultHomeworkEndDateIso());
      await mutate();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Nu am putut salva tema.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
      <h3 className="text-sm font-bold text-amber-950">Adaugare tema</h3>
      {isLoading ? <p className="text-sm text-zinc-600">Se incarca...</p> : null}
      {current ? (
        <div className="rounded-lg border border-amber-200 bg-white/80 px-3 py-2 text-sm text-slate-700">
          <p className="font-semibold text-amber-950">Tema curenta (activa acum)</p>
          <p className="mt-1">
            Perioada: {formatLastPresenceDate(current.start_date)} – {formatLastPresenceDate(current.end_date)} · Tip:{" "}
            {kindLabel} · {current.item_count} {itemsLabel} in lista
          </p>
          <p className="mt-2 text-xs text-slate-600">
            Salvarea de mai jos creeaza o tema noua (tip {kindLabel}) care devine curenta; tema anterioara ramane in
            istoric (cu itemii deja adaugati la ea).
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-600">Nu exista inca o tema curenta de tip {kindLabel}. Completeaza formularul si salveaza.</p>
      )}

      <div className="grid max-w-lg gap-4">
        <label className="block text-sm">
          <span className="font-semibold text-slate-800">Tip tema</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value === "problems" ? "problems" : "grile")}
            className="mt-1 w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="grile">Grile</option>
            <option value="problems">Probleme</option>
          </select>
          <span className="mt-1 block text-xs text-slate-500">
            {kind === "grile"
              ? "Dupa salvare, adauga grile din pagina Grile cu butonul „Adaugare in tema”."
              : "Dupa salvare, adauga probleme din pagina Probleme cu butonul „Adauga in tema”."}
          </span>
        </label>
        <label className="block text-sm">
          <span className="font-semibold text-slate-800">Data de inceput</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="block text-sm">
          <span className="font-semibold text-slate-800">Data de final</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
      </div>

      {message ? <p className="text-sm text-zinc-800">{message}</p> : null}

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving}
        className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-100 disabled:opacity-60"
      >
        {saving ? "Se salveaza..." : "Salveaza tema (devine tema curenta)"}
      </button>
    </div>
  );
}

/** Ziua saptamanii ca in backend: 1=Luni ... 7=Duminica (aliniat la getDay() din JS). */
function meditationWeekdayFromDate(d: Date = new Date()): number {
  const js = d.getDay();
  return js === 0 ? 7 : js;
}

function memberDisplayName(member: MeditationGroupMember) {
  const full = member.full_name?.trim();
  if (full) return full;
  const first = member.first_name?.trim();
  const last = member.last_name?.trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  return member.username || member.email;
}

/** Afiseaza YYYY-MM-DD din API fara decalaj de fus orar. */
function formatLastPresenceDate(value: string | null | undefined): string {
  if (!value?.trim()) return "—";
  const parts = value.trim().split("-").map(Number);
  const [y, m, d] = parts;
  if (!y || !m || !d) return value.trim();
  return new Date(y, m - 1, d).toLocaleDateString("ro-RO");
}

type GroupSubTab = "statistici" | "elevi" | "adaugare_tema" | "teme" | "mod_examen";

const GROUP_SUB_TABS: Array<{ id: GroupSubTab; label: string }> = [
  { id: "statistici", label: "Statistici" },
  { id: "elevi", label: "Elevi" },
  { id: "adaugare_tema", label: "Adaugare tema" },
  { id: "teme", label: "Teme" },
  { id: "mod_examen", label: "Mod examen" },
];

type GroupInsightsGrileRow = {
  user_id: string;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  grile_correct_7d: number;
  grile_correct_30d: number;
  grile_correct_all: number;
};

type GroupInsightsProblemsRow = {
  user_id: string;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  problems_solved_7d: number;
  problems_solved_30d: number;
  problems_solved_all: number;
};

type GroupExamAttemptRow = {
  id: string;
  source_id: string;
  source_name: string;
  score_total: number | null;
  question_count: number;
  status: string;
  started_at: string;
  finished_at: string | null;
};

type GroupInsightsExamUser = {
  user_id: string;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  attempts: GroupExamAttemptRow[];
};

type GroupInsightsResponse = {
  data: {
    grile_leaderboard: GroupInsightsGrileRow[];
    problems_leaderboard: GroupInsightsProblemsRow[];
    exam_attempts: GroupInsightsExamUser[];
  };
};

function asMemberForDisplay(row: {
  user_id: string;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
}): MeditationGroupMember {
  return {
    user_id: row.user_id,
    email: row.email,
    username: row.username,
    first_name: row.first_name,
    last_name: row.last_name,
    full_name: row.full_name,
  };
}

function formatInsightDateTime(iso: string | null | undefined): string {
  if (!iso?.trim()) return "—";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso.trim();
  return new Date(t).toLocaleString("ro-RO");
}

function MeditationGroupAdministerPanel({
  group,
  onBack,
  onMembersChanged,
}: {
  group: MeditationGroup;
  onBack: () => void;
  onMembersChanged: () => Promise<void> | void;
}) {
  const [subTab, setSubTab] = useState<GroupSubTab>("statistici");
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [eleviMessage, setEleviMessage] = useState<string | null>(null);

  const insightsKey = `/api/meditations/admin/groups/${group.id}/insights`;
  const { data: insightsRes, error: insightsError, isLoading: insightsLoading, mutate: mutateInsights } =
    useSWR<GroupInsightsResponse>(insightsKey, apiFetch);

  const leaderboard = insightsRes?.data?.grile_leaderboard ?? [];
  const problemsLeaderboard = insightsRes?.data?.problems_leaderboard ?? [];
  const examByUser = insightsRes?.data?.exam_attempts ?? [];
  const members = group.members ?? [];

  const removeUserFromGroup = async (userId: string) => {
    const confirmed = window.confirm(
      "Scoti elevul din aceasta grupa? Poate fi repartizat din nou din Admin Users.",
    );
    if (!confirmed) return;
    setEleviMessage(null);
    setRemovingUserId(userId);
    try {
      await apiFetch<{ data: { removed: boolean } }>(
        `/api/meditations/admin/users/${userId}/groups/${group.id}`,
        { method: "DELETE" },
      );
      await onMembersChanged();
      await mutateInsights();
      setEleviMessage("Elevul a fost scos din grupa.");
    } catch (err) {
      setEleviMessage(err instanceof Error ? err.message : "Nu am putut scoate elevul din grupa.");
    } finally {
      setRemovingUserId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm font-semibold text-sky-950 shadow-sm transition hover:bg-sky-50"
          >
            Inapoi la grupe
          </button>
          <h2 className="mt-3 text-xl font-bold text-sky-950">{group.name}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {weekdayLabel(group.weekday)}, {group.start_time} – {group.end_time} · {group.members_count}{" "}
            {group.members_count === 1 ? "elev" : "elevi"}
          </p>
        </div>
      </div>

      <nav
        className="flex flex-row flex-wrap gap-2 border-b border-zinc-200 pb-3"
        aria-label="Sectiuni grupa meditatii"
        role="tablist"
      >
        {GROUP_SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={subTab === tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`rounded-lg border px-3 py-2 text-center text-sm font-semibold transition ${
              subTab === tab.id
                ? "border-yellow-600 bg-yellow-400 text-slate-900"
                : "border-sky-200 bg-white text-sky-950 hover:border-yellow-400 hover:bg-yellow-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {subTab === "statistici" ? (
        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="text-base font-bold text-sky-950">Grile</h3>
            <p className="text-sm text-slate-600">
              Clasament dupa numarul de raspunsuri grile <strong>corecte</strong> (toate incercarile din istoric). Coloanele 7 / 30
              zile folosesc data incercarii.
            </p>
            {insightsLoading ? <p className="text-sm text-zinc-600">Se incarca statisticile...</p> : null}
            {insightsError ? (
              <p className="text-sm text-rose-700">
                {insightsError instanceof Error ? insightsError.message : "Nu am putut incarca statisticile."}
              </p>
            ) : null}
            {!insightsLoading && !insightsError ? (
              <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-zinc-50 text-zinc-600">
                    <tr>
                      <th className="px-3 py-2 font-semibold">#</th>
                      <th className="px-3 py-2 font-semibold">Elev</th>
                      <th className="px-3 py-2 font-semibold">Email</th>
                      <th className="px-3 py-2 font-semibold">Toate timpurile</th>
                      <th className="px-3 py-2 font-semibold">Ultimele 7 zile</th>
                      <th className="px-3 py-2 font-semibold">Ultimele 30 zile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((row, index) => (
                      <tr key={row.user_id} className="border-t border-zinc-200 text-zinc-800">
                        <td className="px-3 py-2 font-semibold text-zinc-500">{index + 1}</td>
                        <td className="px-3 py-2 font-medium">{memberDisplayName(asMemberForDisplay(row))}</td>
                        <td className="px-3 py-2">{row.email}</td>
                        <td className="px-3 py-2 tabular-nums">{row.grile_correct_all}</td>
                        <td className="px-3 py-2 tabular-nums">{row.grile_correct_7d}</td>
                        <td className="px-3 py-2 tabular-nums">{row.grile_correct_30d}</td>
                      </tr>
                    ))}
                    {leaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-zinc-500">
                          Nu exista elevi in grupa — nu se pot afisa statistici.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-sky-950">Probleme (sectiunea probleme)</h3>
            <p className="text-sm text-slate-600">
              Clasament dupa <strong>probleme distincte</strong> rezolvate: cel putin o trimitere cu status „accepted” in
              tabela de submisii. Pe 7 / 30 zile numara problema daca exista o acceptare in acel interval (nu neaparat prima
              rezolvare).
            </p>
            {!insightsLoading && !insightsError ? (
              <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-zinc-50 text-zinc-600">
                    <tr>
                      <th className="px-3 py-2 font-semibold">#</th>
                      <th className="px-3 py-2 font-semibold">Elev</th>
                      <th className="px-3 py-2 font-semibold">Email</th>
                      <th className="px-3 py-2 font-semibold">Toate timpurile</th>
                      <th className="px-3 py-2 font-semibold">Ultimele 7 zile</th>
                      <th className="px-3 py-2 font-semibold">Ultimele 30 zile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problemsLeaderboard.map((row, index) => (
                      <tr key={row.user_id} className="border-t border-zinc-200 text-zinc-800">
                        <td className="px-3 py-2 font-semibold text-zinc-500">{index + 1}</td>
                        <td className="px-3 py-2 font-medium">{memberDisplayName(asMemberForDisplay(row))}</td>
                        <td className="px-3 py-2">{row.email}</td>
                        <td className="px-3 py-2 tabular-nums">{row.problems_solved_all}</td>
                        <td className="px-3 py-2 tabular-nums">{row.problems_solved_7d}</td>
                        <td className="px-3 py-2 tabular-nums">{row.problems_solved_30d}</td>
                      </tr>
                    ))}
                    {problemsLeaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-zinc-500">
                          Nu exista elevi in grupa.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {subTab === "elevi" ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Lista membrilor grupei. Stergerea scoate elevul din grupa (nu sterge contul).</p>
          {eleviMessage ? <p className="text-sm text-emerald-800">{eleviMessage}</p> : null}
          {members.length === 0 ? (
            <p className="text-sm text-zinc-500">Niciun elev in aceasta grupa.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-50 text-zinc-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Elev</th>
                    <th className="px-3 py-2 font-semibold">Email</th>
                    <th className="px-3 py-2 font-semibold">Actiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.user_id} className="border-t border-zinc-200 text-zinc-800">
                      <td className="px-3 py-2 font-medium">{memberDisplayName(m)}</td>
                      <td className="px-3 py-2">{m.email}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => void removeUserFromGroup(m.user_id)}
                          disabled={removingUserId === m.user_id}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 transition hover:bg-rose-100 disabled:opacity-60"
                        >
                          {removingUserId === m.user_id ? "Se scoate..." : "Sterge din grupa"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {subTab === "adaugare_tema" ? <MeditationGroupHomeworkSection groupId={group.id} /> : null}

      {subTab === "teme" ? (
        <div className="space-y-4">
          <MeditationGroupHomeworkListSection groupId={group.id} />
          <MeditationGroupProblemsHomeworkAccordionSection groupId={group.id} />
        </div>
      ) : null}

      {subTab === "mod_examen" ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Istoric mod examen (grile) per elev — sursa: incercarile din baza de date. Afisam toate sesiunile cunoscute pentru
            membrii grupei.
          </p>
          {insightsLoading ? <p className="text-sm text-zinc-600">Se incarca...</p> : null}
          {insightsError ? (
            <p className="text-sm text-rose-700">
              {insightsError instanceof Error ? insightsError.message : "Nu am putut incarca datele."}
            </p>
          ) : null}
          {!insightsLoading && !insightsError ? (
            <div className="space-y-5">
              {examByUser.map((u) => (
                <div key={u.user_id} className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
                  <p className="font-semibold text-zinc-900">{memberDisplayName(asMemberForDisplay(u))}</p>
                  <p className="text-xs text-zinc-500">{u.email}</p>
                  {u.attempts.length === 0 ? (
                    <p className="mt-2 text-sm text-zinc-500">Nicio sesiune mod examen inregistrata.</p>
                  ) : (
                    <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-zinc-50 text-zinc-600">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Inceput</th>
                            <th className="px-3 py-2 font-semibold">Status</th>
                            <th className="px-3 py-2 font-semibold">Sursa</th>
                            <th className="px-3 py-2 font-semibold">Intrebari</th>
                            <th className="px-3 py-2 font-semibold">Scor</th>
                            <th className="px-3 py-2 font-semibold">Finalizat</th>
                          </tr>
                        </thead>
                        <tbody>
                          {u.attempts.map((a) => (
                            <tr key={a.id} className="border-t border-zinc-200 text-zinc-800">
                              <td className="px-3 py-2 whitespace-nowrap">{formatInsightDateTime(a.started_at)}</td>
                              <td className="px-3 py-2 capitalize">{a.status.replace(/_/g, " ")}</td>
                              <td className="px-3 py-2">{a.source_name}</td>
                              <td className="px-3 py-2 tabular-nums">{a.question_count}</td>
                              <td className="px-3 py-2 tabular-nums">
                                {a.score_total != null ? Number(a.score_total).toFixed(1) : "—"}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">{formatInsightDateTime(a.finished_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
              {examByUser.length === 0 ? (
                <p className="text-sm text-zinc-500">Nu exista elevi in grupa.</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type UnpaidSessionsStatRow = {
  user_id: string;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  unpaid_sessions_count: number;
  unpaid_total_lei: number;
};

type UnpaidSessionsStatsResponse = {
  data: UnpaidSessionsStatRow[];
};

type AdminMeditatiiTab = "inscrieri" | "grupe" | "prezente" | "statistici" | "clasament";

const ADMIN_MEDITATII_TABS: Array<{ id: AdminMeditatiiTab; label: string }> = [
  { id: "prezente", label: "Prezente" },
  { id: "inscrieri", label: "Inscrieri" },
  { id: "grupe", label: "Grupe" },
  { id: "statistici", label: "Statistici" },
  { id: "clasament", label: "Clasament test initial" },
];

type PlacementTestResultRow = {
  user_id: string;
  full_name: string | null;
  email: string;
  preparation_for: string | null;
  status: "in_progress" | "finished" | null;
  correct_count: number | null;
  grade: string | null;
  started_at: string | null;
  finished_at: string | null;
};

type PlacementTestResultsResponse = {
  data: PlacementTestResultRow[];
};

/** Continut pentru Dashboard sau pagina dedicata: inscrieri, grupe, prezente. */
export function AdminMeditatiiAdministrarePanel() {
  const { data, isLoading, error, mutate: mutateLeads } = useSWR<LeadsResponse>("/api/meditations/leads", apiFetch);
  const { data: groupsData, mutate: mutateGroups } = useSWR<GroupsWithMembersResponse>(
    "/api/meditations/admin/groups-with-members",
    apiFetch,
  );
  const rows = data?.data ?? [];
  const groups = groupsData?.data ?? [];
  const [groupName, setGroupName] = useState("");
  const [groupWeekday, setGroupWeekday] = useState(1);
  const [groupStart, setGroupStart] = useState("16:00");
  const [groupEnd, setGroupEnd] = useState("18:00");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupMessage, setGroupMessage] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupWeekday, setEditGroupWeekday] = useState(1);
  const [editGroupStart, setEditGroupStart] = useState("16:00");
  const [editGroupEnd, setEditGroupEnd] = useState("18:00");
  const [savingGroupId, setSavingGroupId] = useState<string | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);
  const [leadsMessage, setLeadsMessage] = useState<string | null>(null);
  const [presenceSessionDate, setPresenceSessionDate] = useState(todayIsoDate);
  const [addingPresenceUserId, setAddingPresenceUserId] = useState<string | null>(null);
  const [presenceMessage, setPresenceMessage] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<AdminMeditatiiTab>("prezente");
  const [administeredGroupId, setAdministeredGroupId] = useState<string | null>(null);
  const {
    data: unpaidStatsData,
    isLoading: unpaidStatsLoading,
    error: unpaidStatsError,
    mutate: mutateUnpaidStats,
  } = useSWR<UnpaidSessionsStatsResponse>(
    adminTab === "statistici" ? "/api/meditations/admin/unpaid-sessions-stats" : null,
    apiFetch,
  );
  const {
    data: placementTestResultsData,
    isLoading: placementTestResultsLoading,
    error: placementTestResultsError,
  } = useSWR<PlacementTestResultsResponse>(
    adminTab === "clasament" ? "/api/placement-test/admin/results" : null,
    apiFetch,
  );
  const placementTestResultsRows = placementTestResultsData?.data ?? [];
  const [markingPaidUserId, setMarkingPaidUserId] = useState<string | null>(null);
  const [markPaidMessage, setMarkPaidMessage] = useState<string | null>(null);
  const [sendingReminderUserId, setSendingReminderUserId] = useState<string | null>(null);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const unpaidStatsRows = unpaidStatsData?.data ?? [];
  const unpaidStatsTotals = useMemo(() => {
    return unpaidStatsRows.reduce(
      (acc, row) => ({
        sessions: acc.sessions + row.unpaid_sessions_count,
        lei: acc.lei + row.unpaid_total_lei,
      }),
      { sessions: 0, lei: 0 },
    );
  }, [unpaidStatsRows]);

  useEffect(() => {
    if (adminTab !== "grupe") {
      setAdministeredGroupId(null);
    }
  }, [adminTab]);

  const administeredGroup = useMemo(
    () => (administeredGroupId ? groups.find((g) => g.id === administeredGroupId) ?? null : null),
    [groups, administeredGroupId],
  );

  const groupsSortedForPrezente = useMemo(() => {
    const todayW = meditationWeekdayFromDate();
    return [...groups].sort((a, b) => {
      const aToday = a.weekday === todayW ? 0 : 1;
      const bToday = b.weekday === todayW ? 0 : 1;
      if (aToday !== bToday) return aToday - bToday;
      if (a.weekday !== b.weekday) return a.weekday - b.weekday;
      return a.start_time.localeCompare(b.start_time);
    });
  }, [groups]);

  const handleCreateGroup = async () => {
    setCreatingGroup(true);
    setGroupMessage(null);
    try {
      await apiFetch<{ data: { id: string; created: boolean } }>("/api/meditations/admin/groups", {
        method: "POST",
        body: JSON.stringify({
          name: groupName,
          weekday: groupWeekday,
          start_time: groupStart,
          end_time: groupEnd,
        }),
      });
      setGroupName("");
      setGroupMessage("Grupa a fost creata.");
      await mutateGroups();
    } catch (createError) {
      setGroupMessage(createError instanceof Error ? createError.message : "Nu am putut crea grupa.");
    } finally {
      setCreatingGroup(false);
    }
  };

  const startEditingGroup = (group: MeditationGroup) => {
    setEditingGroupId(group.id);
    setEditGroupName(group.name);
    setEditGroupWeekday(group.weekday);
    setEditGroupStart(group.start_time);
    setEditGroupEnd(group.end_time);
    setGroupMessage(null);
  };

  const saveEditedGroup = async () => {
    if (!editingGroupId) return;
    setSavingGroupId(editingGroupId);
    setGroupMessage(null);
    try {
      await apiFetch<{ data: { id: string; updated: boolean } }>(`/api/meditations/admin/groups/${editingGroupId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editGroupName,
          weekday: editGroupWeekday,
          start_time: editGroupStart,
          end_time: editGroupEnd,
        }),
      });
      setGroupMessage("Grupa a fost actualizata.");
      setEditingGroupId(null);
      await mutateGroups();
    } catch (editError) {
      setGroupMessage(editError instanceof Error ? editError.message : "Nu am putut actualiza grupa.");
    } finally {
      setSavingGroupId(null);
    }
  };

  const deleteGroup = async (groupId: string) => {
    const confirmed = window.confirm("Sigur vrei sa stergi grupa? Toti elevii asignati vor fi scosi din grupa.");
    if (!confirmed) return;
    setDeletingGroupId(groupId);
    setGroupMessage(null);
    try {
      await apiFetch<{ data: { deleted: boolean } }>(`/api/meditations/admin/groups/${groupId}`, {
        method: "DELETE",
      });
      setGroupMessage("Grupa a fost stearsa.");
      if (editingGroupId === groupId) setEditingGroupId(null);
      if (administeredGroupId === groupId) setAdministeredGroupId(null);
      await mutateGroups();
    } catch (deleteError) {
      setGroupMessage(deleteError instanceof Error ? deleteError.message : "Nu am putut sterge grupa.");
    } finally {
      setDeletingGroupId(null);
    }
  };

  const deleteLead = async (leadId: string, fullName: string) => {
    const confirmed = window.confirm(`Sigur vrei sa stergi inscrierea lui ${fullName}?`);
    if (!confirmed) return;
    setDeletingLeadId(leadId);
    setLeadsMessage(null);
    try {
      await apiFetch<{ data: { deleted: boolean } }>(`/api/meditations/leads/${leadId}`, {
        method: "DELETE",
      });
      await mutateLeads();
    } catch (deleteError) {
      setLeadsMessage(deleteError instanceof Error ? deleteError.message : "Nu am putut sterge inscrierea.");
    } finally {
      setDeletingLeadId(null);
    }
  };

  const markOldestSessionPaid = async (userId: string, studentName: string) => {
    if (
      !window.confirm(
        `Marchezi cea mai veche sedinta neplatita a elevului ${studentName} ca platita?`,
      )
    ) {
      return;
    }
    setMarkingPaidUserId(userId);
    setMarkPaidMessage(null);
    try {
      const response = await apiFetch<{
        data: { session_date: string; amount_lei: number; group_name: string };
      }>(`/api/meditations/admin/users/${userId}/sessions/mark-oldest-paid`, {
        method: "POST",
      });
      const { session_date, amount_lei, group_name } = response.data;
      setMarkPaidMessage(
        `Sedinta din ${session_date} (${group_name}, ${amount_lei.toFixed(0)} lei) a fost marcata ca platita.`,
      );
      await mutateUnpaidStats();
    } catch (markPaidError) {
      setMarkPaidMessage(
        markPaidError instanceof Error ? markPaidError.message : "Nu am putut marca sedinta ca platita.",
      );
    } finally {
      setMarkingPaidUserId(null);
    }
  };

  const sendPaymentReminder = async (userId: string, studentName: string, studentEmail: string) => {
    if (
      !window.confirm(
        `Trimiți un email de memento plăți către ${studentName} (${studentEmail})?`,
      )
    ) {
      return;
    }
    setSendingReminderUserId(userId);
    setReminderMessage(null);
    try {
      await apiFetch<{ data: { sent: boolean; to: string } }>(
        `/api/meditations/admin/users/${userId}/send-payment-reminder`,
        { method: "POST" },
      );
      setReminderMessage(`Email trimis cu succes către ${studentEmail}.`);
    } catch (reminderError) {
      setReminderMessage(
        reminderError instanceof Error ? reminderError.message : "Nu am putut trimite emailul de memento.",
      );
    } finally {
      setSendingReminderUserId(null);
    }
  };

  const addPresenceForUser = async (userId: string, groupId: string) => {
    setAddingPresenceUserId(userId);
    setPresenceMessage(null);
    try {
      await apiFetch<{ data: { id: string; created: boolean } }>(`/api/meditations/admin/users/${userId}/sessions`, {
        method: "POST",
        body: JSON.stringify({
          session_date: presenceSessionDate,
          amount_lei: 150,
          group_id: groupId,
        }),
      });
      setPresenceMessage("Sedinta a fost inregistrata. Elevul o vede la Meditatii si o poate plati.");
      await mutateGroups();
    } catch (presenceError) {
      setPresenceMessage(presenceError instanceof Error ? presenceError.message : "Nu am putut inregistra prezenta.");
    } finally {
      setAddingPresenceUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Administrare meditații</h1>
          <p className="mt-1 text-sm text-zinc-600">
            An școlar <span className="font-semibold text-zinc-800">2026 – 2027</span>: înscrieri din formular, grupe cu
            program și înregistrare prezențe pentru ședințe (150 lei / ședință la elev).
          </p>
        </div>
        <nav
          className="flex flex-row flex-wrap gap-2 border-b border-zinc-200 pb-3"
          aria-label="Sectiuni administrare meditatii"
          role="tablist"
        >
          {ADMIN_MEDITATII_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={adminTab === tab.id}
              onClick={() => setAdminTab(tab.id)}
              className={`rounded-lg border px-4 py-2 text-center text-sm font-semibold transition ${
                adminTab === tab.id
                  ? "border-yellow-600 bg-yellow-400 text-slate-900"
                  : "border-sky-200 bg-white text-sky-950 hover:border-yellow-400 hover:bg-yellow-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {adminTab === "inscrieri" ? (
        <div className="space-y-4">
          {isLoading ? <p className="text-sm text-zinc-600">Se incarca inscrierile...</p> : null}
          {error ? (
            <p className="text-sm text-rose-700">{error instanceof Error ? error.message : "Nu am putut incarca inscrierile."}</p>
          ) : null}
          {leadsMessage ? <p className="text-sm text-rose-700">{leadsMessage}</p> : null}
          {!isLoading && !error ? (
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-50 text-zinc-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Data</th>
                    <th className="px-3 py-2 font-semibold">Nume complet</th>
                    <th className="px-3 py-2 font-semibold">Email</th>
                    <th className="px-3 py-2 font-semibold">Telefon</th>
                    <th className="px-3 py-2 font-semibold">Pregatire</th>
                    <th className="px-3 py-2 font-semibold">Observatii</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold">Actiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-zinc-200 text-zinc-800">
                      <td className="px-3 py-2 whitespace-nowrap">{formatDate(row.created_at)}</td>
                      <td className="px-3 py-2 font-semibold">{row.full_name}</td>
                      <td className="px-3 py-2">{row.email}</td>
                      <td className="px-3 py-2">{row.phone}</td>
                      <td className="px-3 py-2">{row.grade}</td>
                      <td className="px-3 py-2">{row.message?.trim() ? row.message : "-"}</td>
                      <td className="px-3 py-2 capitalize">{row.status}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => void deleteLead(row.id, row.full_name)}
                          disabled={deletingLeadId === row.id}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:opacity-60"
                        >
                          {deletingLeadId === row.id ? "Se sterge..." : "Sterge"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-4 text-zinc-500">
                        Nu exista inscrieri momentan.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}

      {adminTab === "grupe" ? (
        <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
          {administeredGroupId && administeredGroup ? (
            <MeditationGroupAdministerPanel
              group={administeredGroup}
              onBack={() => {
                setAdministeredGroupId(null);
                setEditingGroupId(null);
              }}
              onMembersChanged={async (): Promise<void> => {
                await mutateGroups();
              }}
            />
          ) : (
            <>
              <h2 className="text-xl font-bold text-sky-950">Grupe meditatii</h2>

              {administeredGroupId && !administeredGroup ? (
                <div className="mt-6 space-y-4">
                  <p className="text-sm text-rose-700">
                    Grupa nu a fost gasita (s-a sters sau lista nu s-a reincarat). Revino la lista de grupe.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAdministeredGroupId(null)}
                    className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm font-semibold text-sky-950 hover:bg-sky-50"
                  >
                    Inapoi la grupe
                  </button>
                </div>
              ) : (
                <>
                  <p className="mt-1 text-sm text-slate-600">
                    Creeaza grupe cu zi si interval orar, apoi atribuie elevii din Admin Users.
                  </p>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                <input
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder="Nume grupa (ex: Grupa 10A)"
                  className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-300/40 focus:ring md:col-span-2"
                />
                <select
                  value={groupWeekday}
                  onChange={(event) => setGroupWeekday(Number(event.target.value))}
                  className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  {WEEKDAY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={groupStart}
                    onChange={(event) => setGroupStart(event.target.value)}
                    className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                  <span className="text-sm text-zinc-500">-</span>
                  <input
                    type="time"
                    value={groupEnd}
                    onChange={(event) => setGroupEnd(event.target.value)}
                    className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => void handleCreateGroup()}
                  disabled={creatingGroup || groupName.trim().length < 2}
                  className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-100 disabled:opacity-60"
                >
                  {creatingGroup ? "Se creeaza..." : "Creeaza grupa"}
                </button>
                {groupMessage ? <p className="mt-2 text-sm text-zinc-700">{groupMessage}</p> : null}
              </div>

              <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-zinc-50 text-zinc-600">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Nume</th>
                      <th className="px-3 py-2 font-semibold">Program</th>
                      <th className="px-3 py-2 font-semibold">Elevi</th>
                      <th className="px-3 py-2 font-semibold">Actiuni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => (
                      <tr key={group.id} className="border-t border-zinc-200 text-zinc-800">
                        <td className="px-3 py-2 font-semibold">
                          {editingGroupId === group.id ? (
                            <input
                              value={editGroupName}
                              onChange={(event) => setEditGroupName(event.target.value)}
                              className="w-full rounded-lg border border-sky-200 bg-white px-2 py-1 text-sm text-slate-900"
                            />
                          ) : (
                            group.name
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {editingGroupId === group.id ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                value={editGroupWeekday}
                                onChange={(event) => setEditGroupWeekday(Number(event.target.value))}
                                className="rounded-lg border border-sky-200 bg-white px-2 py-1 text-sm text-slate-900"
                              >
                                {WEEKDAY_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="time"
                                value={editGroupStart}
                                onChange={(event) => setEditGroupStart(event.target.value)}
                                className="rounded-lg border border-sky-200 bg-white px-2 py-1 text-sm text-slate-900"
                              />
                              <span className="text-zinc-500">-</span>
                              <input
                                type="time"
                                value={editGroupEnd}
                                onChange={(event) => setEditGroupEnd(event.target.value)}
                                className="rounded-lg border border-sky-200 bg-white px-2 py-1 text-sm text-slate-900"
                              />
                            </div>
                          ) : (
                            `${weekdayLabel(group.weekday)} • ${group.start_time} - ${group.end_time}`
                          )}
                        </td>
                        <td className="px-3 py-2">{group.members_count}</td>
                        <td className="px-3 py-2">
                          {editingGroupId === group.id ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void saveEditedGroup()}
                                disabled={savingGroupId === group.id || editGroupName.trim().length < 2}
                                className="rounded-lg border border-amber-200/90 bg-amber-50/95 px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:border-amber-300 hover:bg-amber-100 disabled:opacity-60"
                              >
                                {savingGroupId === group.id ? "Se salveaza..." : "Salveaza"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingGroupId(null)}
                                className="rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-sky-50"
                              >
                                Renunta
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setAdministeredGroupId(group.id);
                                  setEditingGroupId(null);
                                  setGroupMessage(null);
                                }}
                                className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-900 transition hover:border-indigo-300 hover:bg-indigo-100"
                              >
                                Administreaza
                              </button>
                              <button
                                type="button"
                                onClick={() => startEditingGroup(group)}
                                className="rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-sky-50"
                              >
                                Editeaza
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteGroup(group.id)}
                                disabled={deletingGroupId === group.id}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                              >
                                {deletingGroupId === group.id ? "Se sterge..." : "Sterge grupa"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {groups.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-zinc-500">
                          Nu exista grupe create momentan.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
                </>
              )
            }
            </>
          )}
        </section>
      ) : null}

      {adminTab === "statistici" ? (
        <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-sky-950">Statistici plati</h2>
          <p className="mt-1 text-sm text-slate-600">
            Elevi cu sedinte inregistrate la meditatii care nu au fost platite inca. Numarul include toate sedintele
            neplatite, indiferent de grupa.
          </p>
          {unpaidStatsLoading ? <p className="mt-4 text-sm text-zinc-600">Se incarca statisticile...</p> : null}
          {unpaidStatsError ? (
            <p className="mt-4 text-sm text-rose-700">
              {unpaidStatsError instanceof Error ? unpaidStatsError.message : "Nu am putut incarca statisticile."}
            </p>
          ) : null}
          {markPaidMessage ? <p className="mt-4 text-sm text-zinc-700">{markPaidMessage}</p> : null}
          {reminderMessage ? <p className="mt-4 text-sm text-zinc-700">{reminderMessage}</p> : null}
          {!unpaidStatsLoading && !unpaidStatsError ? (
            <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-50 text-zinc-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Elev</th>
                    <th className="px-3 py-2 font-semibold">Email</th>
                    <th className="px-3 py-2 font-semibold">Sedinte restante</th>
                    <th className="px-3 py-2 font-semibold">Total de incasat</th>
                    <th className="px-3 py-2 font-semibold">Actiune</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidStatsRows.map((row) => {
                    const studentName = memberDisplayName({
                      user_id: row.user_id,
                      email: row.email,
                      username: row.username,
                      first_name: row.first_name,
                      last_name: row.last_name,
                      full_name: row.full_name,
                    });
                    return (
                      <tr key={row.user_id} className="border-t border-zinc-200 text-zinc-800">
                        <td className="px-3 py-2 font-medium">{studentName}</td>
                        <td className="px-3 py-2">{row.email}</td>
                        <td className="px-3 py-2 tabular-nums font-semibold text-amber-900">{row.unpaid_sessions_count}</td>
                        <td className="px-3 py-2 tabular-nums">{row.unpaid_total_lei.toFixed(0)} lei</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void sendPaymentReminder(row.user_id, studentName, row.email)}
                              disabled={sendingReminderUserId === row.user_id}
                              className="whitespace-nowrap rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-900 transition hover:border-sky-300 hover:bg-sky-100 disabled:opacity-60"
                            >
                              {sendingReminderUserId === row.user_id ? "Se trimite..." : "Trimite mail"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void markOldestSessionPaid(row.user_id, studentName)}
                              disabled={markingPaidUserId === row.user_id}
                              className="whitespace-nowrap rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-60"
                            >
                              {markingPaidUserId === row.user_id ? "Se salveaza..." : "Marcheaza sedinta platita"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {unpaidStatsRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-zinc-500">
                        Niciun elev cu sedinte restante de plata.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
                {unpaidStatsRows.length > 0 ? (
                  <tfoot className="border-t-2 border-zinc-300 bg-amber-50/80 font-semibold text-zinc-900">
                    <tr>
                      <td className="px-3 py-2.5" colSpan={2}>
                        Total ({unpaidStatsRows.length} {unpaidStatsRows.length === 1 ? "elev" : "elevi"})
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-amber-950">{unpaidStatsTotals.sessions}</td>
                      <td className="px-3 py-2.5 tabular-nums">{unpaidStatsTotals.lei.toFixed(0)} lei</td>
                      <td className="px-3 py-2.5" />
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          ) : null}
        </section>
      ) : null}

      {adminTab === "clasament" ? (
        <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-sky-950">Clasament test initial</h2>
          <p className="mt-1 text-sm text-slate-600">
            Nota testului initial pentru fiecare elev inscris la meditatii, sortata descrescator. Foloseste-o
            ca sa formezi grupele.
          </p>
          {placementTestResultsLoading ? <p className="mt-4 text-sm text-zinc-600">Se incarca clasamentul...</p> : null}
          {placementTestResultsError ? (
            <p className="mt-4 text-sm text-rose-700">
              {placementTestResultsError instanceof Error ? placementTestResultsError.message : "Nu am putut incarca clasamentul."}
            </p>
          ) : null}
          {!placementTestResultsLoading && !placementTestResultsError ? (
            <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-50 text-zinc-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Elev</th>
                    <th className="px-3 py-2 font-semibold">Email</th>
                    <th className="px-3 py-2 font-semibold">Pregatire</th>
                    <th className="px-3 py-2 font-semibold">Nota</th>
                    <th className="px-3 py-2 font-semibold">Corecte</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold">Finalizat la</th>
                  </tr>
                </thead>
                <tbody>
                  {placementTestResultsRows.map((row) => (
                    <tr key={row.user_id} className="border-t border-zinc-200 text-zinc-800">
                      <td className="px-3 py-2 font-medium">{row.full_name || row.email}</td>
                      <td className="px-3 py-2">{row.email}</td>
                      <td className="px-3 py-2">{row.preparation_for || "-"}</td>
                      <td className="px-3 py-2 tabular-nums font-semibold text-amber-900">
                        {row.grade !== null ? Number(row.grade).toFixed(2) : "-"}
                      </td>
                      <td className="px-3 py-2 tabular-nums">{row.correct_count !== null ? `${row.correct_count}/20` : "-"}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            row.status === "finished"
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                              : row.status === "in_progress"
                                ? "border border-amber-200 bg-amber-50 text-amber-700"
                                : "border border-zinc-200 bg-zinc-50 text-zinc-600"
                          }`}
                        >
                          {row.status === "finished" ? "Finalizat" : row.status === "in_progress" ? "In desfasurare" : "Nesustinut"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {row.finished_at ? new Date(row.finished_at).toLocaleString("ro-RO") : "-"}
                      </td>
                    </tr>
                  ))}
                  {placementTestResultsRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-4 text-zinc-500">
                        Niciun elev inscris la meditatii momentan.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}

      {adminTab === "prezente" ? (
        <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-sky-950">Prezente</h2>
          <p className="mt-1 text-sm text-slate-600">
            Alege data sedintei, apoi pentru fiecare elev apasa „Adauga prezenta”. Sedinta apare la elev in zona Meditatii (150 lei) si o poate plati acolo.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <span className="font-medium">Data sedintei</span>
              <input
                type="date"
                value={presenceSessionDate}
                onChange={(event) => setPresenceSessionDate(event.target.value)}
                className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
          </div>
          {presenceMessage ? <p className="mt-2 text-sm text-zinc-700">{presenceMessage}</p> : null}

          <div className="mt-4 space-y-5">
            {groupsSortedForPrezente.map((group) => {
              const members = group.members ?? [];
              return (
                <div key={group.id} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-zinc-900">{group.name}</p>
                    <p className="text-sm text-zinc-600">
                      {weekdayLabel(group.weekday)} • {group.start_time}–{group.end_time} · {group.members_count}{" "}
                      {group.members_count === 1 ? "elev" : "elevi"}
                    </p>
                  </div>
                  {members.length === 0 ? (
                    <p className="mt-2 text-sm text-zinc-500">Niciun elev in aceasta grupa.</p>
                  ) : (
                    <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-zinc-50 text-zinc-600">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Elev</th>
                            <th className="px-3 py-2 font-semibold">Email</th>
                            <th className="px-3 py-2 font-semibold whitespace-nowrap">Ultima prezenta</th>
                            <th className="px-3 py-2 font-semibold">Actiune</th>
                          </tr>
                        </thead>
                        <tbody>
                          {members.map((member) => (
                            <tr key={member.user_id} className="border-t border-zinc-200 text-zinc-800">
                              <td className="px-3 py-2 font-medium">{memberDisplayName(member)}</td>
                              <td className="px-3 py-2">{member.email}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-zinc-700">
                                {formatLastPresenceDate(member.last_session_date)}
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => void addPresenceForUser(member.user_id, group.id)}
                                  disabled={addingPresenceUserId === member.user_id}
                                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-60"
                                >
                                  {addingPresenceUserId === member.user_id ? "Se salveaza..." : "Adauga prezenta"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
            {groupsSortedForPrezente.length === 0 ? <p className="text-sm text-zinc-500">Nu exista grupe pentru a afisa elevi.</p> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function AdminMeditatiiLeadsPage() {
  return (
    <RequireAuth>
      <main className="min-h-screen bg-zinc-50">
        <section className="mx-auto max-w-[1600px] px-4 py-8">
          <AdminMeditatiiAdministrarePanel />
        </section>
      </main>
    </RequireAuth>
  );
}
