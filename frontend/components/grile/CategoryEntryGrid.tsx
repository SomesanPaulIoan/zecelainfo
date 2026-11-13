"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

type Entry = {
  id: string;
  name: string;
  total_questions: number;
  exam_mode_enabled?: boolean;
  source_tag?: string | null;
};

type Props = {
  selectedView: "sources" | "chapters";
  activeCategorySlug: string;
  entries: Entry[];
  /** Daca e setat, chip-urile de filtru surse apar in ordinea data (apoi alte etichete necunoscute, alfabetic). */
  sourceTagTabOrder?: string[];
};

type ProgressResponse = {
  data: {
    view: "sources" | "chapters";
    progress: Array<{
      item_id: string;
      solved_count: number;
    }>;
  };
};

type MyGrileHomeworkResponse = {
  data: {
    assignment: {
      id: string;
      group_id?: string;
      group_name?: string;
      start_date: string;
      end_date: string;
      item_count: number;
    } | null;
  };
};

export function CategoryEntryGrid({ selectedView, activeCategorySlug, entries, sourceTagTabOrder }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "professor";
  const [solvedMap, setSolvedMap] = useState<Record<string, number>>({});
  const [addingTemaForId, setAddingTemaForId] = useState<string | null>(null);
  const [temaMessage, setTemaMessage] = useState<string | null>(null);

  const homeworkKey = user ? (isAdmin ? "/api/meditations/admin/grile-homework/current" : "/api/meditations/my-grile-homework") : null;
  const { data: homeworkRes, mutate: mutateHomework } = useSWR<MyGrileHomeworkResponse>(homeworkKey, apiFetch);
  const grileHomework = homeworkRes?.data?.assignment ?? null;

  useEffect(() => {
    if (!user || !activeCategorySlug) {
      setSolvedMap({});
      return;
    }
    void apiFetch<ProgressResponse>(`/api/grile/categories/${activeCategorySlug}/progress?view=${selectedView}`)
      .then((response) => {
        const map: Record<string, number> = {};
        for (const item of response.data.progress) {
          map[item.item_id] = item.solved_count;
        }
        setSolvedMap(map);
      })
      .catch(() => setSolvedMap({}));
  }, [user, activeCategorySlug, selectedView]);

  useEffect(() => {
    setTemaMessage(null);
  }, [activeCategorySlug, selectedView]);

  const addToCurrentTema = async (entryId: string) => {
    if (!grileHomework) return;
    setAddingTemaForId(entryId);
    setTemaMessage(null);
    const body =
      selectedView === "sources"
        ? { scope: "source" as const, source_id: entryId }
        : { scope: "chapter" as const, chapter_id: entryId };
    try {
      const endpoint = isAdmin ? "/api/meditations/admin/grile-homework/current/items" : "/api/meditations/my-grile-homework/items";
      const res = await apiFetch<{ data: { added: number } }>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setTemaMessage(`Am adaugat ${res.data?.added ?? 0} grile noi la tema curenta (cele duplicate au fost ignorate).`);
      await mutateHomework();
    } catch (err) {
      setTemaMessage(err instanceof Error ? err.message : "Nu am putut adauga la tema.");
    } finally {
      setAddingTemaForId(null);
    }
  };

  const cards = useMemo(
    () =>
      entries.map((entry) => {
        const solved = solvedMap[entry.id] ?? 0;
        const total = Math.max(entry.total_questions ?? 0, 0);
        const progress = total > 0 ? Math.round((solved / total) * 100) : 0;
        const href = selectedView === "sources" ? `/grile/source/${entry.id}` : `/grile/chapter/${entry.id}`;
        return {
          ...entry,
          solved,
          total,
          progress,
          href,
        };
      }),
    [entries, selectedView, solvedMap],
  );

  const sourceTags = useMemo(() => {
    if (selectedView !== "sources") return [];
    const tags = Array.from(new Set(entries.map((entry) => entry.source_tag).filter((tag): tag is string => Boolean(tag))));
    if (sourceTagTabOrder?.length) {
      const indexOf = new Map(sourceTagTabOrder.map((label, index) => [label, index]));
      return tags.sort((a, b) => {
        const ia = indexOf.has(a) ? (indexOf.get(a) as number) : 1000;
        const ib = indexOf.has(b) ? (indexOf.get(b) as number) : 1000;
        if (ia !== ib) return ia - ib;
        return a.localeCompare(b, "ro");
      });
    }
    return tags.sort((a, b) => a.localeCompare(b, "ro"));
  }, [entries, selectedView, sourceTagTabOrder]);
  const [selectedTag, setSelectedTag] = useState<string>("all");

  useEffect(() => {
    setSelectedTag("all");
  }, [activeCategorySlug, selectedView]);

  const filteredCards = useMemo(() => {
    if (selectedView !== "sources" || selectedTag === "all") return cards;
    return cards.filter((entry) => entry.source_tag === selectedTag);
  }, [cards, selectedTag, selectedView]);

  return (
    <div className="mt-4 space-y-3">
      {grileHomework && isAdmin ? (
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-sky-50 to-white px-4 py-3 text-sm text-indigo-950 shadow-sm">
          <p className="font-extrabold uppercase tracking-wide text-indigo-900">Tema curenta la grile</p>
          <p className="mt-1 text-xs font-medium text-indigo-900/90">
            {grileHomework.group_name ? `Grupa: ${grileHomework.group_name} · ` : ""}
            Perioada tema: {grileHomework.start_date} – {grileHomework.end_date} · {grileHomework.item_count} grile in lista temei.
            Poti adauga toate grilele dintr-o sursa sau capitol cu butonul de pe card.
          </p>
        </div>
      ) : null}
      {temaMessage ? (
        <p className="rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm">{temaMessage}</p>
      ) : null}
      {selectedView === "sources" && sourceTags.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-sky-200 bg-white p-2 shadow-sm">
          <div className="flex min-w-max items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedTag("all")}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wide transition ${
                selectedTag === "all"
                  ? "border-amber-400 bg-gradient-to-r from-amber-300 to-yellow-300 text-slate-900 shadow-sm"
                  : "border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100"
              }`}
            >
              Toate
            </button>
            {sourceTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wide transition ${
                  selectedTag === tag
                    ? "border-amber-400 bg-gradient-to-r from-amber-300 to-yellow-300 text-slate-900 shadow-sm"
                    : "border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {filteredCards.map((entry) => (
          <div
            key={entry.id}
            className="group relative overflow-hidden rounded-[1.6rem] border border-sky-200 bg-gradient-to-b from-white via-sky-50/70 to-blue-50 p-5 shadow-[0_14px_38px_-26px_rgba(3,105,161,0.55)] transition duration-300 hover:-translate-y-0.5 hover:border-yellow-300 hover:shadow-[0_22px_60px_-28px_rgba(245,158,11,0.45)]"
          >
            <div className="pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full bg-amber-300/25 blur-2xl transition group-hover:bg-amber-300/35" />
            <div className="pointer-events-none absolute -left-14 bottom-0 h-28 w-28 rounded-full bg-sky-300/20 blur-2xl" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-sky-700">
                  {selectedView === "sources" ? "Sursa" : "Capitol"}
                </p>
                {selectedView === "sources" && entry.source_tag ? (
                  <span className="mt-1 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-800">
                    {entry.source_tag}
                  </span>
                ) : null}
                <Link href={entry.href} className="mt-1 block min-w-0 cursor-pointer">
                  <p className="text-lg font-black leading-snug text-sky-950 break-words">{entry.name}</p>
                </Link>
              </div>
              <span className="inline-flex shrink-0 rounded-full border border-sky-300 bg-white px-3 py-1 text-xs font-bold text-sky-900">
                {entry.total} intrebari
              </span>
            </div>
            <Link href={entry.href} className="mt-4 block cursor-pointer rounded-2xl border border-sky-100 bg-white/85 p-3">
              <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700">
                <span>
                  {entry.solved} / {entry.total} rezolvate
                </span>
                <span className="rounded-full bg-sky-100 px-2.5 py-1 font-extrabold text-sky-800">{entry.progress}%</span>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-sky-100">
                <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-sky-400" style={{ width: `${entry.progress}%` }} />
              </div>
            </Link>
            <div className="mt-3 flex items-center gap-2">
              <Link
                href={entry.href}
                className="inline-flex flex-1 items-center justify-center rounded-xl border-2 border-sky-300 bg-white px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-sky-900 transition hover:border-sky-400 hover:bg-sky-50"
              >
                Intra acum
              </Link>
              {selectedView === "sources" && entry.exam_mode_enabled ? (
                <Link
                  href={`/grile/source/${entry.id}/exam`}
                  className="inline-flex items-center justify-center rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-slate-900 transition hover:brightness-95"
                >
                  Examen
                </Link>
              ) : null}
            </div>
            {grileHomework && isAdmin ? (
              <div className="mt-3 border-t border-sky-100/80 pt-3">
                <button
                  type="button"
                  onClick={() => void addToCurrentTema(entry.id)}
                  disabled={addingTemaForId === entry.id}
                  className="w-full rounded-xl border-2 border-indigo-300 bg-gradient-to-r from-indigo-100 to-sky-100 px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-indigo-900 transition hover:from-indigo-200 hover:to-sky-200 disabled:opacity-60"
                >
                  {addingTemaForId === entry.id ? "Se adauga..." : "Adaugare in tema"}
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
