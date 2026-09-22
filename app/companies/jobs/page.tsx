"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Badge, ErrorState, jobStatusTone, Notice, PageHeader, Spinner, TableWrap } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { formatDate, payLabel, type Job } from "@/lib/data";
import { useFetch } from "@/lib/hooks";

export default function CompanyJobs() {
  const jobs = useFetch<{ items: Job[] }>("/company/jobs");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  if (jobs.loading && !jobs.data) return <Spinner />;
  if (jobs.error) return <ErrorState message={jobs.error} onRetry={jobs.reload} />;
  const items = jobs.data?.items ?? [];

  const act = async (j: Job, label: string, call: () => Promise<unknown>) => {
    setBusy(j.id);
    setError(null);
    setFlash(null);
    try {
      await call();
      setFlash(label);
      jobs.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Job postings"
        subtitle="Manage the roles you're hiring for on campus."
        action={
          <Link href="/companies/post" className="btn-primary">
            <Icon name="plus" className="size-4" /> New posting
          </Link>
        }
      />
      {(error || flash) && <div className="mb-4">{error ? <Notice tone="error">{error}</Notice> : <Notice tone="success">{flash}</Notice>}</div>}
      <div className="card">
        {items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="font-medium">No postings yet</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create your first job posting to start receiving applications.</p>
          </div>
        ) : (
          <TableWrap>
            <table className="w-full">
              <thead className="border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="th">Role</th>
                  <th className="th">Type</th>
                  <th className="th">CTC</th>
                  <th className="th">Openings</th>
                  <th className="th">Applicants</th>
                  <th className="th">Deadline</th>
                  <th className="th">Status</th>
                  <th className="th" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="td">
                      <p className="font-medium">{j.role}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{j.location}</p>
                    </td>
                    <td className="td">{j.type}</td>
                    <td className="td">{payLabel(j)}</td>
                    <td className="td">{j.openings}</td>
                    <td className="td font-medium">{j.applicants}</td>
                    <td className="td whitespace-nowrap">{formatDate(j.deadline)}</td>
                    <td className="td">
                      <Badge tone={jobStatusTone[j.status]}>{j.status}</Badge>
                      {j.status === "Rejected" && j.rejectReason && <p className="mt-1 max-w-48 text-xs text-rose-600 dark:text-rose-400">{j.rejectReason}</p>}
                    </td>
                    <td className="td">
                      <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-sm font-medium">
                        {(j.status === "Draft" || j.status === "Rejected") && (
                          <button className="text-indigo-600 disabled:opacity-50 dark:text-indigo-300" disabled={busy === j.id} onClick={() => act(j, `“${j.role}” sent for approval.`, () => api.post(`/company/jobs/${j.id}/submit`))}>
                            Submit
                          </button>
                        )}
                        {j.status !== "Closed" && j.status !== "Pending" && (
                          <Link href={`/companies/post?edit=${j.id}`} className="text-indigo-600 dark:text-indigo-300">
                            Edit
                          </Link>
                        )}
                        {j.status === "Open" && (
                          <button className="text-slate-600 disabled:opacity-50 dark:text-slate-300" disabled={busy === j.id} onClick={() => act(j, `“${j.role}” closed.`, () => api.post(`/company/jobs/${j.id}/close`))}>
                            Close
                          </button>
                        )}
                        {j.status === "Draft" && (
                          <button
                            className="text-rose-600 disabled:opacity-50 dark:text-rose-400"
                            disabled={busy === j.id}
                            onClick={() => window.confirm(`Delete the draft “${j.role}”?`) && act(j, "Draft deleted.", () => api.del(`/company/jobs/${j.id}`))}
                          >
                            Delete
                          </button>
                        )}
                        {j.status !== "Draft" && (
                          <Link href={`/companies/candidates?job=${j.id}`} className="text-indigo-600 dark:text-indigo-300">
                            Candidates
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </div>
    </>
  );
}
