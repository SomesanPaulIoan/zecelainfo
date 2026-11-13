import { apiFetch } from "@/lib/api";

export type JourneyState = "new" | "trial" | "trial_expired" | "grile" | "complete" | "expired";

export type Journey = {
  state: JourneyState;
  exam: string | null;
  access_until: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  trial_progress: null | { grile_attempted: number; grile_correct: number; exam_simulations: number };
};

let cache: { at: number; userId: string; promise: Promise<Journey | null> } | null = null;

/** Starea comerciala a userului (nou / trial / trial expirat / grile / complet), cu cache scurt in memorie. */
export function fetchJourney(userId: string, opts: { fresh?: boolean } = {}): Promise<Journey | null> {
  if (!opts.fresh && cache && cache.userId === userId && Date.now() - cache.at < 60_000) return cache.promise;
  const promise = apiFetch<{ data: Journey }>("/api/marketing/me/journey")
    .then((response) => response.data)
    .catch(() => null);
  cache = { at: Date.now(), userId, promise };
  return promise;
}

export function hoursLeft(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso) - Date.now();
  return ms > 0 ? Math.ceil(ms / 3_600_000) : 0;
}
