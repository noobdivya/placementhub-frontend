"use client";

import { useState } from "react";
import ReasonDialog from "@/components/ReasonDialog";
import { Badge, CompanyLogo, EmptyState, ErrorState, jobStatusTone, Notice, PageHeader, Spinner } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { formatDate, payLabel, type Job } from "@/lib/data";
import { useFetch } from "@/lib/hooks";

const TABS = ["Pending", "Open", "Closed", "Rejected", "All"] as const;
type Tab = (typeof TABS)[number];

export default function JobApprovals() {
  const [tab, setTab] = useState<Tab>("Pending");
  const jobs = useFetch<{ items: Job[] }>("/admin/jobs", { status: tab });
  const [rejecting, setRejecting] = useState<Job | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const run = async (j: Job, fn: () => Promise<string | void>) => {
    setBusy(j.id);
    setError(null);
    setFlash(null);
    try {
      const msg = await fn();
      if (msg) setFlash(msg);
      jobs.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const items = jobs.data?.items ?? [];

  return (
    <>
      <PageHeader title="Job approvals" subtitle="Review postings from approved companies. Approving makes a job live and notifies exactly the students who are eligible." />

      <div className="card">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 p-2 dark:border-slate-800" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium ${
                tab === t ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {(error || flash) && <div className="border-b border-slate-100 p-4 dark:border-slate-800">{error ? <Notice tone="error">{error}</Notice> : <Notice tone="success">{flash}</Notice>}</div>}

        {jobs.error ? (
          <ErrorState message={jobs.error} onRetry={jobs.reload} />
        ) : jobs.loading && !jobs.data ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState title={tab === "Pending" ? "Nothing waiting for review" : "No jobs here"} hint={tab === "Pending" ? "New submissions from companies will appear here." : undefined} />
        ) : (
          <ul className={`divide-y divide-slate-100 dark:divide-slate-800 ${jobs.loading ? "opacity-60" : ""}`}>
            {items.map((j) => (
              <li key={j.id} className="p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <CompanyLogo name={j.company} color={j.color} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{j.role}</h2>
                      <Badge tone={jobStatusTone[j.status]}>{j.status}</Badge>
                      <Badge tone={j.type === "Internship" ? "sky" : "indigo"}>{j.type}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {j.company} · {j.location} · {payLabel(j)} · {j.openings} opening{j.openings === 1 ? "" : "s"} · closes {formatDate(j.deadline)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{j.description}</p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Eligibility: CGPA ≥ {j.minCgpa} · {j.branches.join(", ")} · backlogs {j.allowBacklogs ? "allowed" : "not allowed"}
                      {j.skills.length > 0 && <> · Skills: {j.skills.join(", ")}</>}
                    </p>
                    {j.status === "Rejected" && j.rejectReason && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">Rejected: {j.rejectReason}</p>}
                    {j.status === "Open" && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{j.applicants} applicant(s) so far</p>}
                  </div>
                  <div className="flex gap-2">
                    {j.status === "Pending" && (
                      <>
                        <button className="btn-outline text-rose-600 dark:text-rose-400" disabled={busy === j.id} onClick={() => setRejecting(j)}>
                          Reject
                        </button>
                        <button
                          className="btn-primary"
                          disabled={busy === j.id}
                          onClick={() =>
                            run(j, async () => {
                              const r = await api.post<{ studentsNotified: number }>(`/admin/jobs/${j.id}/approve`);
                              return `“${j.role}” is live. ${r.studentsNotified} eligible student(s) notified.`;
                            })
                          }
                        >
                          Approve
                        </button>
                      </>
                    )}
                    {j.status === "Open" && (
                      <button className="btn-outline" disabled={busy === j.id} onClick={() => window.confirm(`Close “${j.role}” at ${j.company}? Students can no longer apply.`) && run(j, async () => void (await api.post(`/admin/jobs/${j.id}/close`)))}>
                        Close job
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {rejecting && (
        <ReasonDialog
          title={`Reject “${rejecting.role}”`}
          hint="The company sees this reason and can edit and resubmit."
          confirmLabel="Reject job"
          required
          onConfirm={async (reason) => {
            await api.post(`/admin/jobs/${rejecting.id}/reject`, { reason });
            setFlash(`“${rejecting.role}” sent back to ${rejecting.company}.`);
            jobs.reload();
          }}
          onClose={() => setRejecting(null)}
        />
      )}
    </>
  );
}
