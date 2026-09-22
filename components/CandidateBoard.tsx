"use client";

import { useState } from "react";
import { Icon } from "./icons";
import { Avatar, Badge, ErrorState, Notice, ProgressBar, Spinner, stageTone } from "./ui";
import { api, errorMessage } from "@/lib/api";
import { formatDate, STAGES, type Candidate, type Job, type Stage } from "@/lib/data";
import { useFetch } from "@/lib/hooks";

const NEXT: Partial<Record<Stage, Stage>> = { Applied: "Shortlisted", Shortlisted: "Interview", Interview: "Offered" };

export default function CandidateBoard({ initialJobId }: { initialJobId?: string }) {
  const [jobId, setJobId] = useState(initialJobId ?? "all");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const jobs = useFetch<{ items: Job[] }>("/company/jobs");
  const cands = useFetch<{ items: Candidate[] }>("/company/candidates", { jobId: jobId === "all" ? undefined : jobId });

  const move = async (c: Candidate, stage: Stage) => {
    setBusy(c.id);
    setError(null);
    setFlash(null);
    try {
      const updated = await api.patch<Candidate>(`/company/applications/${c.id}/stage`, { stage });
      cands.setData((p) => (p ? { items: p.items.map((x) => (x.id === c.id ? { ...x, ...updated } : x)) } : p));
      if (stage === "Offered") setFlash(`Offer created for ${c.name}. They've been notified.`);
    } catch (e) {
      setError(errorMessage(e));
      cands.reload(); // the candidate may have changed under us (e.g. withdrew)
    } finally {
      setBusy(null);
    }
  };

  const shown = cands.data?.items ?? [];
  // Only jobs that can have applicants belong in the filter.
  const filterJobs = (jobs.data?.items ?? []).filter((j) => j.status !== "Draft");

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <select className="input !w-auto min-w-56" value={jobId} onChange={(e) => setJobId(e.target.value)} aria-label="Filter by job">
          <option value="all">All job postings</option>
          {filterJobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.role}
            </option>
          ))}
        </select>
        <p className="text-sm text-slate-500 dark:text-slate-400">{shown.length} candidates</p>
      </div>

      {(error || flash) && <div className="mb-4">{error ? <Notice tone="error">{error}</Notice> : <Notice tone="success">{flash}</Notice>}</div>}

      {cands.error ? (
        <ErrorState message={cands.error} onRetry={cands.reload} />
      ) : cands.loading && !cands.data ? (
        <Spinner />
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
          <div className="grid min-w-[62rem] grid-cols-5 gap-4">
            {STAGES.map((stage) => {
              const col = shown.filter((c) => c.stage === stage);
              return (
                <section key={stage} className="rounded-xl bg-slate-100/70 p-3 dark:bg-slate-900/60" aria-label={stage}>
                  <header className="mb-3 flex items-center justify-between px-1">
                    <Badge tone={stageTone[stage]}>{stage}</Badge>
                    <span className="text-xs font-medium text-slate-500">{col.length}</span>
                  </header>
                  <div className="space-y-3">
                    {col.map((c) => {
                      const next = NEXT[c.stage as Stage];
                      const working = busy === c.id;
                      return (
                        <article key={c.id} className="card p-3.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={c.name} className="size-8" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{c.name}</p>
                              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                {c.branch} · {c.role}
                              </p>
                            </div>
                            {c.hasResume && (
                              <button
                                className="btn-ghost !px-1.5 !py-1"
                                title="Download resume"
                                aria-label={`Download ${c.name}'s resume`}
                                onClick={() => api.download(`/company/applications/${c.id}/resume`, `${c.name} - resume.pdf`).catch((e) => setError(errorMessage(e)))}
                              >
                                <Icon name="download" className="size-4" />
                              </button>
                            )}
                          </div>
                          <div className="mt-3">
                            <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span>CGPA</span>
                              <span className="font-medium text-slate-700 dark:text-slate-200">{c.cgpa}</span>
                            </div>
                            <ProgressBar value={c.cgpa * 10} tone={c.cgpa >= 8.5 ? "emerald" : c.cgpa >= 7.5 ? "indigo" : "amber"} />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1">
                            {c.skills.slice(0, 3).map((s) => (
                              <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {s}
                              </span>
                            ))}
                          </div>
                          <p className="mt-2.5 text-[11px] text-slate-400">Applied {formatDate(c.appliedOn)}</p>
                          {c.offer && (
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              Offer {c.offer.status.toLowerCase()} · {c.offer.ctc} LPA
                            </p>
                          )}
                          {(next || (c.stage !== "Rejected" && c.stage !== "Offered")) && (
                            <div className="mt-3 flex gap-2">
                              {next && (
                                <button className="btn-primary flex-1 !px-2 !py-1.5 text-xs" onClick={() => move(c, next)} disabled={working}>
                                  Move to {next}
                                </button>
                              )}
                              {c.stage !== "Rejected" && c.stage !== "Offered" && (
                                <button className="btn-outline !px-2.5 !py-1.5 text-xs text-rose-600 dark:text-rose-400" onClick={() => move(c, "Rejected")} disabled={working}>
                                  Reject
                                </button>
                              )}
                            </div>
                          )}
                          {c.stage === "Rejected" && (
                            <button className="btn-outline mt-3 w-full !py-1.5 text-xs" onClick={() => move(c, "Applied")} disabled={working}>
                              Reconsider
                            </button>
                          )}
                        </article>
                      );
                    })}
                    {col.length === 0 && <p className="px-1 py-6 text-center text-xs text-slate-400">No candidates</p>}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
