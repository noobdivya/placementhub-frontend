"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { BarChart, CompanyLogo, ErrorState, Notice, PageHeader, ProgressBar, Section, Spinner, StatCard } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import type { Overview } from "@/lib/data";
import { useFetch } from "@/lib/hooks";

export default function Reports() {
  const overview = useFetch<Overview>("/admin/reports/overview");
  const [error, setError] = useState<string | null>(null);

  if (overview.error) return <ErrorState message={overview.error} onRetry={overview.reload} />;
  if (!overview.data) return <Spinner />;

  const { stats: p, ctcBands, topRecruiters, branchStats } = overview.data;
  const maxHires = Math.max(1, ...topRecruiters.map((r) => r.hires));

  return (
    <>
      <PageHeader
        title="Reports & analytics"
        subtitle="Live from the placement database"
        action={
          <button className="btn-outline" onClick={() => api.download("/admin/reports/placements.csv", "placements.csv").catch((e) => setError(errorMessage(e)))}>
            <Icon name="download" className="size-4" /> Download placements (CSV)
          </button>
        }
      />

      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Placement rate" value={`${p.totalStudents ? Math.round((p.placed / p.totalStudents) * 100) : 0}%`} icon="graduation" tone="emerald" />
        <StatCard label="Total offers" value={p.offers} hint="Some students hold multiple offers" icon="file" />
        <StatCard label="Unplaced students" value={p.totalStudents - p.placed} icon="users" tone="rose" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title="CTC distribution (students)">
          <BarChart data={ctcBands} />
        </Section>

        <Section title="Top recruiters by hires">
          {topRecruiters.length === 0 ? (
            <p className="text-sm text-slate-500">No hires recorded yet.</p>
          ) : (
            <ul className="space-y-4">
              {topRecruiters.map((r) => (
                <li key={r.name} className="flex items-center gap-3">
                  <CompanyLogo name={r.name} color={r.color} size="size-8" />
                  <div className="flex-1">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{r.name}</span>
                      <span className="text-slate-500 dark:text-slate-400">{r.hires} hires</span>
                    </div>
                    <ProgressBar value={(r.hires / maxHires) * 100} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Branch-wise summary" className="lg:col-span-2" flush>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="th">Branch</th>
                  <th className="th">Eligible</th>
                  <th className="th">Placed</th>
                  <th className="th">Unplaced</th>
                  <th className="th min-w-40">Placement %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {branchStats.map((b) => {
                  const v = b.total ? Math.round((b.placed / b.total) * 100) : 0;
                  return (
                    <tr key={b.branch}>
                      <td className="td font-medium">{b.branch}</td>
                      <td className="td">{b.total}</td>
                      <td className="td">{b.placed}</td>
                      <td className="td">{b.total - b.placed}</td>
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <ProgressBar value={v} tone={v >= 75 ? "emerald" : v >= 45 ? "indigo" : "amber"} />
                          </div>
                          <span className="w-10 text-right text-sm">{v}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </>
  );
}
