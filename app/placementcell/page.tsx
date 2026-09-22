"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { BarChart, Badge, CompanyLogo, ErrorState, PageHeader, ProgressBar, Section, Spinner, StatCard } from "@/components/ui";
import { formatDate, shortDate, type CompanyRecord, type Drive, type Overview } from "@/lib/data";
import { useFetch } from "@/lib/hooks";

export default function PlacementDashboard() {
  const overview = useFetch<Overview>("/admin/reports/overview");
  const drives = useFetch<{ items: Drive[] }>("/admin/drives");
  const pending = useFetch<{ items: CompanyRecord[] }>("/admin/companies", { status: "Pending" });

  if (overview.error) return <ErrorState message={overview.error} onRetry={overview.reload} />;
  if (!overview.data) return <Spinner />;

  const { stats: p, monthlyOffers, branchStats, recentOffers } = overview.data;
  const pct = p.totalStudents ? Math.round((p.placed / p.totalStudents) * 100) : 0;
  const upcoming = (drives.data?.items ?? []).filter((d) => d.status !== "Completed").sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const pendingCount = pending.data?.items.length;

  return (
    <>
      <PageHeader
        title="Placement overview"
        subtitle="Season progress"
        action={
          <Link href="/placementcell/reports" className="btn-outline">
            <Icon name="chart" className="size-4" /> Full reports
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students placed" value={`${p.placed} / ${p.totalStudents}`} hint={`${pct}% placement rate`} icon="graduation" tone="emerald" />
        <StatCard label="Companies visited" value={p.companiesVisited} hint={pendingCount ? `${pendingCount} pending approval` : undefined} icon="building" />
        <StatCard label="Average CTC" value={`${p.avgCtc} LPA`} icon="chart" tone="sky" />
        <StatCard label="Highest CTC" value={`${p.highestCtc} LPA`} icon="star" tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Section title="Offers per month" className="lg:col-span-2">
          <BarChart data={monthlyOffers} />
        </Section>

        <Section title="Branch-wise placement">
          {branchStats.length === 0 ? (
            <p className="text-sm text-slate-500">No students yet.</p>
          ) : (
            <ul className="space-y-4">
              {branchStats.map((b) => {
                const v = b.total ? Math.round((b.placed / b.total) * 100) : 0;
                return (
                  <li key={b.branch}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="font-medium">{b.branch}</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {b.placed}/{b.total} · {v}%
                      </span>
                    </div>
                    <ProgressBar value={v} tone={v >= 75 ? "emerald" : v >= 45 ? "indigo" : "amber"} />
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section
          title="Upcoming drives"
          className="lg:col-span-2"
          action={
            <Link href="/placementcell/drives" className="text-sm font-medium text-indigo-600 dark:text-indigo-300">
              All drives
            </Link>
          }
          flush
        >
          {upcoming.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">No upcoming drives.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {upcoming.map((d) => (
                <li key={d.id} className="flex items-center gap-4 px-5 py-3.5">
                  <CompanyLogo name={d.company} color={d.color} size="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {d.company} — {d.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {shortDate(d.date)} · {d.time}
                      {d.venue && ` · ${d.venue}`}
                    </p>
                  </div>
                  <span className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
                    {d.registered}/{d.eligible} registered
                  </span>
                  <Badge tone={d.status === "Ongoing" ? "emerald" : "indigo"}>{d.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Recent offers" flush>
          {recentOffers.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">No offers yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentOffers.slice(0, 5).map((o, i) => (
                <li key={i} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{o.student}</p>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{o.ctc} LPA</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {o.role} · {o.company} · {formatDate(o.date)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </>
  );
}
