"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { Badge, CompanyLogo, EmptyState, ErrorState, Notice, Spinner } from "./ui";
import Modal from "./Modal";
import { api, errorMessage } from "@/lib/api";
import { formatDate, payLabel, type Application, type Page, type StudentJob } from "@/lib/data";
import { useDebounced, useFetch } from "@/lib/hooks";

type Sort = "deadline" | "ctc";
const PAGE_SIZE = 12;

/** The button (or status chip) that replaces "Apply" when applying isn't possible. */
function blockedLabel(j: StudentJob) {
  switch (j.blockReason?.code) {
    case "already_placed":
      return "Placed";
    case "job_closed":
    case "deadline_passed":
      return "Closed";
    default:
      return "Not eligible";
  }
}

export default function JobsBoard() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"All" | "Full-time" | "Internship">("All");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("deadline");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<StudentJob | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const q = useDebounced(query.trim());
  const jobs = useFetch<Page<StudentJob>>("/jobs", { q, type: type === "All" ? undefined : type, eligible: eligibleOnly || undefined, sort, page, limit: PAGE_SIZE });

  // /students/jobs?job=<id> (used by notification links) opens that job's details.
  const jobParam = useSearchParams().get("job");
  useEffect(() => {
    if (!jobParam) return;
    api
      .get<StudentJob>(`/jobs/${jobParam}`)
      .then(setSelected)
      .catch(() => {});
  }, [jobParam]);

  const patch = (id: string, changes: Partial<StudentJob>) => {
    jobs.setData((p) => (p ? { ...p, items: p.items.map((j) => (j.id === id ? { ...j, ...changes } : j)) } : p));
    setSelected((s) => (s && s.id === id ? { ...s, ...changes } : s));
  };

  const apply = async (j: StudentJob) => {
    setApplying(j.id);
    setError(null);
    setFlash(null);
    try {
      const a = await api.post<Application>(`/jobs/${j.id}/apply`);
      patch(j.id, { applied: true, applicationId: a.id, canApply: false, applicants: j.applicants + 1, blockReason: { code: "already_applied", message: "You have already applied to this job." } });
      setFlash(`Applied to ${j.role} at ${j.company}.`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setApplying(null);
    }
  };

  const list = jobs.data?.items ?? [];
  const total = jobs.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const actionFor = (j: StudentJob, detail = false) => {
    if (j.applied)
      return (
        <button className="btn-outline !py-1.5 text-emerald-600 dark:text-emerald-400" disabled>
          <Icon name="check" className="size-4" /> Applied
        </button>
      );
    if (j.canApply)
      return (
        <button className="btn-primary !py-1.5" onClick={() => apply(j)} disabled={applying === j.id}>
          {applying === j.id ? "Applying…" : detail ? "Apply now" : "Apply"}
        </button>
      );
    return (
      <button className="btn-outline !py-1.5" disabled title={j.blockReason?.message}>
        {blockedLabel(j)}
      </button>
    );
  };

  return (
    <>
      <div className="card mb-5 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-52 flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input !pl-9"
            placeholder="Search role, company, skill or city"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            aria-label="Search jobs"
          />
        </div>
        <select className="input !w-auto" value={type} onChange={(e) => {
            setType(e.target.value as typeof type);
            setPage(1);
          }} aria-label="Job type">
          <option>All</option>
          <option>Full-time</option>
          <option>Internship</option>
        </select>
        <select className="input !w-auto" value={sort} onChange={(e) => {
            setSort(e.target.value as Sort);
            setPage(1);
          }} aria-label="Sort by">
          <option value="deadline">Closing soonest</option>
          <option value="ctc">Highest CTC</option>
        </select>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-indigo-600" checked={eligibleOnly} onChange={(e) => {
              setEligibleOnly(e.target.checked);
              setPage(1);
            }} />
          Eligible for me
        </label>
      </div>

      {(error || flash) && (
        <div className="mb-4">
          {error && (
            <Notice tone="error">
              {error}
              {/resume/i.test(error) && (
                <>
                  {" "}
                  <Link href="/students/profile" className="font-medium underline">
                    Upload it on your profile
                  </Link>
                  .
                </>
              )}
            </Notice>
          )}
          {flash && <Notice tone="success">{flash}</Notice>}
        </div>
      )}

      {jobs.error ? (
        <div className="card">
          <ErrorState message={jobs.error} onRetry={jobs.reload} />
        </div>
      ) : jobs.loading && !jobs.data ? (
        <div className="card">
          <Spinner />
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            {total} {total === 1 ? "opening" : "openings"}
          </p>

          {list.length === 0 ? (
            <div className="card">
              <EmptyState title="No jobs match your filters" hint="Try clearing the search or the eligibility filter." />
            </div>
          ) : (
            <div className={`grid gap-4 md:grid-cols-2 ${jobs.loading ? "opacity-60" : ""}`}>
              {list.map((j) => (
                <article key={j.id} className="card flex flex-col p-5">
                  <div className="flex items-start gap-3">
                    <CompanyLogo name={j.company} color={j.color} />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{j.role}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{j.company}</p>
                    </div>
                    <Badge tone={j.type === "Internship" ? "sky" : "indigo"}>{j.type}</Badge>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{j.description}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {j.skills.map((s) => (
                      <Badge key={s}>{s}</Badge>
                    ))}
                  </div>

                  <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-slate-500 dark:text-slate-400">{j.type === "Internship" ? "Stipend" : "CTC"}</dt>
                      <dd className="font-medium">{payLabel(j)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500 dark:text-slate-400">Location</dt>
                      <dd className="font-medium">{j.location}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500 dark:text-slate-400">Min CGPA</dt>
                      <dd className="font-medium">{j.minCgpa}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Icon name="clock" className="size-3.5" /> Apply by {formatDate(j.deadline)}
                    </p>
                    <div className="flex items-center gap-2">
                      <button className="btn-ghost !px-2.5 !py-1.5" onClick={() => setSelected(j)}>
                        Details
                      </button>
                      {actionFor(j)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Pagination">
              <button className="btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Page {page} of {pages}
              </span>
              <button className="btn-outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </nav>
          )}
        </>
      )}

      {selected && (
        <Modal title={selected.role} onClose={() => setSelected(null)}>
          <div className="-mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <CompanyLogo name={selected.company} color={selected.color} size="size-6 !rounded-md !text-xs" />
            {selected.company} · {selected.location} · {payLabel(selected)}
          </div>
          <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">{selected.description}</p>
          <h4 className="mb-2 mt-5 text-sm font-semibold">Eligibility</h4>
          <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
            <li>Minimum CGPA: {selected.minCgpa}</li>
            <li>Branches: {selected.branches.join(", ")}</li>
            <li>Active backlogs: {selected.allowBacklogs ? "allowed" : "not allowed"}</li>
            <li>Openings: {selected.openings}</li>
            <li>Application deadline: {formatDate(selected.deadline)}</li>
          </ul>
          {selected.skills.length > 0 && (
            <>
              <h4 className="mb-2 mt-5 text-sm font-semibold">Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {selected.skills.map((s) => (
                  <Badge key={s} tone="indigo">
                    {s}
                  </Badge>
                ))}
              </div>
            </>
          )}
          {!selected.canApply && !selected.applied && selected.blockReason && <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{selected.blockReason.message}</p>}
          {error && (
            <div className="mt-4">
              <Notice tone="error">{error}</Notice>
            </div>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <button className="btn-outline" onClick={() => setSelected(null)}>
              Close
            </button>
            {actionFor(selected, true)}
          </div>
        </Modal>
      )}
    </>
  );
}
