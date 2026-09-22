"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import Modal from "@/components/Modal";
import { Badge, CompanyLogo, ErrorState, Notice, PageHeader, ProgressBar, Spinner, type Tone } from "@/components/ui";
import { api, ApiError, errorMessage } from "@/lib/api";
import { BRANCHES, type CompanyRecord, type Drive, type Job } from "@/lib/data";
import { useFetch } from "@/lib/hooks";

const statusTone: Record<Drive["status"], Tone> = { Upcoming: "indigo", Ongoing: "emerald", Completed: "slate" };

interface Form {
  companyId: string;
  jobId: string;
  title: string;
  date: string;
  time: string;
  durationMinutes: string;
  mode: Drive["mode"];
  venue: string;
  minCgpa: string;
  branches: string[];
  allowBacklogs: boolean;
}

const blank: Form = { companyId: "", jobId: "", title: "", date: "", time: "10:00", durationMinutes: "180", mode: "On-campus", venue: "", minCgpa: "0", branches: [...BRANCHES], allowBacklogs: true };

function ScheduleDrive({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const companies = useFetch<{ items: CompanyRecord[] }>("/admin/companies", { status: "Approved" });
  const openJobs = useFetch<{ items: Job[] }>("/admin/jobs", { status: "Open" });
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const err = (k: string) => fields[k] && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{fields[k]}</p>;
  const jobs = (openJobs.data?.items ?? []).filter((j) => j.companyId === f.companyId);

  return (
    <Modal title="Schedule a drive" onClose={onClose} wide>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          setFields({});
          try {
            await api.post("/admin/drives", {
              companyId: f.companyId,
              jobId: f.jobId || null,
              title: f.title,
              date: f.date,
              time: f.time,
              durationMinutes: Number(f.durationMinutes),
              mode: f.mode,
              venue: f.venue,
              // A linked job supplies the criteria; otherwise use what was entered.
              ...(f.jobId ? {} : { minCgpa: Number(f.minCgpa), branches: f.branches, allowBacklogs: f.allowBacklogs }),
            });
            onCreated();
          } catch (e2) {
            if (e2 instanceof ApiError && e2.fields) setFields(e2.fields);
            setError(errorMessage(e2));
            setBusy(false);
          }
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="d-company">Company</label>
            <select id="d-company" className="input" value={f.companyId} onChange={(e) => setF((x) => ({ ...x, companyId: e.target.value, jobId: "" }))} required>
              <option value="">Select a company…</option>
              {(companies.data?.items ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {err("companyId")}
          </div>
          <div>
            <label className="label" htmlFor="d-job">Linked job (optional)</label>
            <select id="d-job" className="input" value={f.jobId} onChange={(e) => set("jobId", e.target.value)} disabled={!f.companyId}>
              <option value="">None — set criteria below</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.role}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="d-title">Title</label>
            <input id="d-title" className="input" placeholder="e.g. SWE technical interviews" value={f.title} onChange={(e) => set("title", e.target.value)} required />
            {err("title")}
          </div>
          <div>
            <label className="label" htmlFor="d-date">Date</label>
            <input id="d-date" className="input" type="date" value={f.date} onChange={(e) => set("date", e.target.value)} required />
            {err("date")}
          </div>
          <div>
            <label className="label" htmlFor="d-time">Start time</label>
            <input id="d-time" className="input" type="time" value={f.time} onChange={(e) => set("time", e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="d-mode">Mode</label>
            <select id="d-mode" className="input" value={f.mode} onChange={(e) => set("mode", e.target.value as Drive["mode"])}>
              <option>On-campus</option>
              <option>Virtual</option>
              <option>Off-campus</option>
            </select>
            {err("mode")}
          </div>
          <div>
            <label className="label" htmlFor="d-dur">Duration (minutes)</label>
            <input id="d-dur" className="input" type="number" min="15" max="1440" step="15" value={f.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)} required />
            {err("durationMinutes")}
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="d-venue">Venue / link</label>
            <input id="d-venue" className="input" placeholder="Seminar Hall B, or a meeting link" value={f.venue} onChange={(e) => set("venue", e.target.value)} />
            {err("venue")}
          </div>
        </div>

        {!f.jobId && (
          <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <legend className="px-1 text-sm font-medium">Who can register</legend>
            <div className="flex flex-wrap items-center gap-4">
              <label className="text-sm">
                Min CGPA{" "}
                <input className="input !inline-block !w-20" type="number" min="0" max="10" step="0.1" value={f.minCgpa} onChange={(e) => set("minCgpa", e.target.value)} />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-indigo-600" checked={f.allowBacklogs} onChange={(e) => set("allowBacklogs", e.target.checked)} /> Allow active backlogs
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {BRANCHES.map((b) => {
                const on = f.branches.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set("branches", on ? f.branches.filter((x) => x !== b) : [...f.branches, b])}
                    className={`rounded-full border px-3 py-1 text-sm ${on ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"}`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy}>
            {busy ? "Scheduling…" : "Schedule & notify students"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function DrivesPage() {
  const drives = useFetch<{ items: Drive[] }>("/admin/drives");
  const [scheduling, setScheduling] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  if (drives.error) return <ErrorState message={drives.error} onRetry={drives.reload} />;
  if (!drives.data) return <Spinner />;

  const sorted = [...drives.data.items].sort((a, b) => a.date.localeCompare(b.date));
  const groups = (["Ongoing", "Upcoming", "Completed"] as const).map((s) => ({ s, items: sorted.filter((d) => d.status === s) }));

  const cancel = async (d: Drive) => {
    if (!window.confirm(`Cancel “${d.title}” (${d.company})? Registered students will be told.`)) return;
    setBusy(d.id);
    setError(null);
    setFlash(null);
    try {
      await api.del(`/admin/drives/${d.id}`);
      setFlash(`“${d.title}” cancelled.`);
      drives.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Campus drives"
        subtitle="Schedule and monitor recruitment drives."
        action={
          <button className="btn-primary" onClick={() => setScheduling(true)}>
            <Icon name="plus" className="size-4" /> Schedule drive
          </button>
        }
      />

      {(error || flash) && <div className="mb-4">{error ? <Notice tone="error">{error}</Notice> : <Notice tone="success">{flash}</Notice>}</div>}

      {sorted.length === 0 && (
        <div className="card px-6 py-14 text-center">
          <p className="font-medium">No drives yet</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Schedule the first one — eligible students are notified automatically.</p>
        </div>
      )}

      <div className="space-y-8">
        {groups
          .filter((g) => g.items.length)
          .map(({ s, items }) => (
            <section key={s}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {s} <span className="ml-1 font-normal">({items.length})</span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {items.map((d) => {
                  const dt = new Date(d.date + "T00:00:00");
                  return (
                    <article key={d.id} className="card flex gap-4 p-5">
                      <div className="grid h-16 w-14 shrink-0 place-items-center rounded-xl bg-slate-100 text-center dark:bg-slate-800">
                        <div>
                          <p className="text-[11px] font-semibold uppercase text-slate-500">{dt.toLocaleString("en", { month: "short" })}</p>
                          <p className="text-xl font-semibold leading-none">{dt.getDate()}</p>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <CompanyLogo name={d.company} color={d.color} size="size-6 !rounded-md !text-xs" />
                            <p className="truncate font-medium">{d.company}</p>
                          </div>
                          <Badge tone={statusTone[d.status]}>{d.status}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{d.title}</p>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Icon name="clock" className="size-3.5" /> {d.time}
                          </span>
                          {d.venue && (
                            <span className="flex items-center gap-1">
                              <Icon name="pin" className="size-3.5" /> {d.venue}
                            </span>
                          )}
                          <Badge tone={d.mode === "Virtual" ? "sky" : "slate"}>{d.mode}</Badge>
                        </p>
                        <div className="mt-3">
                          <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>Registered</span>
                            <span>
                              {d.registered} / {d.eligible}
                            </span>
                          </div>
                          <ProgressBar value={d.eligible ? (d.registered / d.eligible) * 100 : 0} />
                        </div>
                        {d.status === "Upcoming" && (
                          <div className="mt-3 text-right">
                            <button className="text-sm font-medium text-rose-600 disabled:opacity-50 dark:text-rose-400" disabled={busy === d.id} onClick={() => cancel(d)}>
                              Cancel drive
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
      </div>

      {scheduling && (
        <ScheduleDrive
          onClose={() => setScheduling(false)}
          onCreated={() => {
            setScheduling(false);
            setFlash("Drive scheduled. Eligible students have been notified.");
            drives.reload();
          }}
        />
      )}
    </>
  );
}
