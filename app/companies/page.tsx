"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { Avatar, Badge, ErrorState, jobStatusTone, Notice, PageHeader, ProgressBar, Section, Spinner, StageBadge, StatCard } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { STAGES, type Candidate, type Job, type JobStatus } from "@/lib/data";
import { useFetch } from "@/lib/hooks";

const STATUSES: JobStatus[] = ["Open", "Pending", "Draft", "Rejected", "Closed"];

export default function CompanyDashboard() {
  const { me } = useAuth();
  const jobs = useFetch<{ items: Job[] }>("/company/jobs");
  const cands = useFetch<{ items: Candidate[] }>("/company/candidates");
  const company = me?.company;

  if ((jobs.loading && !jobs.data) || (cands.loading && !cands.data)) return <Spinner />;
  if (jobs.error || cands.error) return <ErrorState message={(jobs.error ?? cands.error)!} onRetry={() => { jobs.reload(); cands.reload(); }} />;

  const postings = jobs.data?.items ?? [];
  const candidates = cands.data?.items ?? [];
  const totalApplicants = postings.reduce((n, j) => n + j.applicants, 0);
  const funnel = STAGES.filter((s) => s !== "Rejected").map((s) => ({ s, n: candidates.filter((c) => c.stage === s).length }));
  const funnelMax = Math.max(1, ...funnel.map((f) => f.n));
  const byStatus = STATUSES.map((s) => ({ s, n: postings.filter((j) => j.status === s).length })).filter((x) => x.n > 0);

  return (
    <>
      <PageHeader
        title={`Hello, ${company?.name ?? "there"}`}
        subtitle="Your campus hiring at a glance."
        action={
          <Link href="/companies/post" className="btn-primary">
            <Icon name="plus" className="size-4" /> Post a job
          </Link>
        }
      />

      {company && company.status !== "Approved" && (
        <div className="mb-6">
          <Notice tone="error">
            {company.status === "Pending"
              ? "Your company is awaiting approval by the placement cell. You can save drafts, but jobs can be submitted for review only after approval."
              : `Your company was rejected by the placement cell${company.statusReason ? `: ${company.statusReason}` : "."} Contact them to be reconsidered.`}
          </Notice>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active postings" value={postings.filter((j) => j.status === "Open").length} hint={`${postings.length} total`} icon="briefcase" />
        <StatCard label="Total applicants" value={totalApplicants} icon="users" tone="sky" />
        <StatCard label="Shortlisted" value={candidates.filter((c) => c.stage === "Shortlisted").length} icon="check" tone="amber" />
        <StatCard label="Offers made" value={candidates.filter((c) => c.stage === "Offered").length} icon="star" tone="emerald" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Section title="Hiring funnel" className="lg:col-span-2">
          <div className="space-y-4">
            {funnel.map(({ s, n }) => (
              <div key={s}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <StageBadge stage={s} />
                  <span className="font-medium">{n}</span>
                </div>
                <ProgressBar value={(n / funnelMax) * 100} />
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Postings by status"
          action={
            <Link href="/companies/jobs" className="text-sm font-medium text-indigo-600 dark:text-indigo-300">
              Manage
            </Link>
          }
        >
          {byStatus.length === 0 ? (
            <p className="text-sm text-slate-500">You haven&apos;t posted anything yet.</p>
          ) : (
            <ul className="space-y-3">
              {byStatus.map(({ s, n }) => (
                <li key={s} className="flex items-center justify-between">
                  <Badge tone={jobStatusTone[s]}>{s}</Badge>
                  <span className="font-medium">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title="Latest applicants"
          className="lg:col-span-3"
          action={
            <Link href="/companies/candidates" className="text-sm font-medium text-indigo-600 dark:text-indigo-300">
              Open pipeline
            </Link>
          }
          flush
        >
          {candidates.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">No applicants yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="th">Candidate</th>
                    <th className="th">Role</th>
                    <th className="th">Branch</th>
                    <th className="th">CGPA</th>
                    <th className="th">Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[...candidates]
                    .sort((a, b) => b.appliedOn.localeCompare(a.appliedOn))
                    .slice(0, 5)
                    .map((c) => (
                      <tr key={c.id}>
                        <td className="td">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={c.name} className="size-8" />
                            <span className="font-medium">{c.name}</span>
                          </div>
                        </td>
                        <td className="td">{c.role}</td>
                        <td className="td">{c.branch}</td>
                        <td className="td">{c.cgpa}</td>
                        <td className="td">
                          <StageBadge stage={c.stage} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </>
  );
}
