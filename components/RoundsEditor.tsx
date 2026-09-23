"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { ErrorState, Notice, Spinner } from "./ui";
import { api, ApiError, errorMessage } from "@/lib/api";
import type { RoundMode, SelectionRound } from "@/lib/data";

interface RoundRow {
  key: string;
  id?: string;
  name: string;
  mode: RoundMode;
  date: string; // YYYY-MM-DD, local
  time: string; // HH:MM, local
  durationMinutes: string;
  location: string;
  instructions: string;
  locked?: boolean;
}

let keySeq = 0;
const newKey = () => `new-${++keySeq}`;

function splitISO(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

/** Combines local date + time inputs into an ISO instant, or null if either is empty
 * — many rounds aren't dated until earlier ones finish. */
function combineISO(date: string, time: string): string | null {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function fromRound(r: SelectionRound): RoundRow {
  const { date, time } = splitISO(r.scheduledAt);
  return { key: r.id, id: r.id, name: r.name, mode: r.mode, date, time, durationMinutes: String(r.durationMinutes), location: r.location, instructions: r.instructions, locked: r.locked };
}

const blankRound = (): RoundRow => ({ key: newKey(), name: "", mode: "Offline", date: "", time: "", durationMinutes: "60", location: "", instructions: "" });

/** The company's editor for a job's ordered selection rounds — add, remove,
 * reorder and edit, all saved together. A round already in progress for some
 * candidate stays locked (name + position), but its schedule can still change. */
export default function RoundsEditor({ jobId, disabled }: { jobId: string; disabled?: boolean }) {
  const [rounds, setRounds] = useState<RoundRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get<{ items: SelectionRound[] }>(`/company/jobs/${jobId}/rounds`)
      .then((res) => setRounds(res.items.map(fromRound)))
      .catch((e) => setLoadError(errorMessage(e)));
  }, [jobId]);

  if (loadError) return <ErrorState message={loadError} />;
  if (!rounds) return <Spinner label="Loading selection process…" />;

  const update = (key: string, patch: Partial<RoundRow>) => setRounds((rs) => rs!.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const move = (i: number, dir: -1 | 1) =>
    setRounds((rs) => {
      const copy = [...rs!];
      const j = i + dir;
      if (j < 0 || j >= copy.length) return copy;
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  const remove = (key: string) => setRounds((rs) => rs!.filter((r) => r.key !== key));
  const add = () => setRounds((rs) => [...rs!, blankRound()]);

  const errFor = (i: number, field: string) => fields[`rounds[${i}].${field}`];

  const save = async () => {
    setBusy(true);
    setError(null);
    setFields({});
    setSaved(false);
    try {
      const res = await api.put<{ items: SelectionRound[] }>(`/company/jobs/${jobId}/rounds`, {
        items: rounds.map((r) => ({
          id: r.id,
          name: r.name,
          mode: r.mode,
          scheduledAt: combineISO(r.date, r.time),
          durationMinutes: Number(r.durationMinutes) || 60,
          location: r.location,
          instructions: r.instructions,
        })),
      });
      setRounds(res.items.map(fromRound));
      setSaved(true);
    } catch (e) {
      if (e instanceof ApiError && e.fields) setFields(e.fields);
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Selection process</h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">Required before you can submit for approval</span>
      </div>
      {rounds.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No rounds yet — add at least one, e.g. Aptitude Test, Coding Round, Technical Interview, HR Interview.
        </p>
      )}
      <div className="space-y-4">
        {rounds.map((r, i) => (
          <div key={r.key} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-start justify-between gap-2">
              <span className="mt-2 text-xs font-semibold text-slate-400">Round {i + 1}</span>
              <div className="flex items-center gap-1">
                <button type="button" className="btn-ghost !p-1.5" disabled={i === 0} onClick={() => move(i, -1)} title="Move up">
                  <Icon name="arrow" className="size-4 -rotate-90" />
                </button>
                <button type="button" className="btn-ghost !p-1.5" disabled={i === rounds.length - 1} onClick={() => move(i, 1)} title="Move down">
                  <Icon name="arrow" className="size-4 rotate-90" />
                </button>
                <button type="button" className="btn-ghost !p-1.5" disabled={r.locked} onClick={() => remove(r.key)} title="Remove round">
                  <Icon name="x" className="size-4" />
                </button>
              </div>
            </div>
            {r.locked && (
              <Notice tone="success">A candidate is already in progress on this round — its name and position are locked, but you can still reschedule it.</Notice>
            )}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Round name</label>
                <input className="input" placeholder="e.g. Aptitude Test" value={r.name} onChange={(e) => update(r.key, { name: e.target.value })} disabled={r.locked} required />
                {errFor(i, "name") && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errFor(i, "name")}</p>}
              </div>
              <div>
                <label className="label">Mode</label>
                <select className="input" value={r.mode} onChange={(e) => update(r.key, { mode: e.target.value as RoundMode })}>
                  <option>Online</option>
                  <option>Offline</option>
                </select>
                {errFor(i, "mode") && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errFor(i, "mode")}</p>}
              </div>
              <div>
                <label className="label">Date (optional — set once scheduled)</label>
                <input className="input" type="date" value={r.date} onChange={(e) => update(r.key, { date: e.target.value })} />
              </div>
              <div>
                <label className="label">Time</label>
                <input className="input" type="time" value={r.time} onChange={(e) => update(r.key, { time: e.target.value })} />
              </div>
              <div>
                <label className="label">Duration (minutes)</label>
                <input className="input" type="number" min="5" max="1440" value={r.durationMinutes} onChange={(e) => update(r.key, { durationMinutes: e.target.value })} />
                {errFor(i, "durationMinutes") && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errFor(i, "durationMinutes")}</p>}
              </div>
              <div>
                <label className="label">{r.mode === "Online" ? "Meeting link" : "Venue"}</label>
                <input
                  className="input"
                  placeholder={r.mode === "Online" ? "https://meet.example.com/..." : "Block A, Room 12"}
                  value={r.location}
                  onChange={(e) => update(r.key, { location: e.target.value })}
                />
                {errFor(i, "location") && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errFor(i, "location")}</p>}
              </div>
            </div>
            <div className="mt-3">
              <label className="label">Instructions for candidates (optional)</label>
              <textarea
                className="input min-h-16"
                placeholder="What should candidates bring or prepare?"
                value={r.instructions}
                onChange={(e) => update(r.key, { instructions: e.target.value })}
              />
              {errFor(i, "instructions") && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errFor(i, "instructions")}</p>}
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="btn-outline w-full" onClick={add}>
        <Icon name="plus" className="size-4" /> Add round
      </button>
      {error && <Notice tone="error">{error}</Notice>}
      {saved && !error && <Notice tone="success">Selection process saved.</Notice>}
      <button type="button" className="btn-primary w-full" disabled={disabled || busy} onClick={save}>
        {busy ? "Saving…" : "Save selection process"}
      </button>
    </div>
  );
}
