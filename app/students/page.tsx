"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Badge, CompanyLogo, ErrorState, Notice, PageHeader, ProgressBar, Section, Spinner, StageBadge, StatCard } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, payLabel, shortDate, type Application, type StudentDrive, type StudentJob, type StudentProfile } from "@/lib/data";
import { useFetch } from "@/lib/hooks";

function checklist(p: StudentProfile) {
  return [
    { label: "Basic details", done: Boolean(p.phone && p.about) },
    { label: "Academic scores", done: p.tenth !== null && p.twelfth !== null },
    { label: "Skills added", done: p.skills.length > 0 },
    { label: "Profile links", done: Boolean(p.links.github || p.links.linkedin) },
    { label: "Resume uploaded", done: p.resume !== null },
  ];
}

function DriveRow({ d, onChange }: { d: StudentDrive; onChange: (d: StudentDrive) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dt = new Date(d.date + "T00:00:00");

  const toggle = async () => {
    setBusy(true);
    setError(null);
    try {
      if (d.isRegistered) {
        await api.del(`/drives/${d.id}/register`);
        onChange({ ...d, isRegistered: false, canRegister: true, registered: Math.max(0, d.registered - 1) });
      } else {
        onChange(await api.post<StudentDrive>(`/drives/${d.id}/register`));
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="px-5 py-3.5">
      <div className="flex items-center gap-3">
        <div className="grid w-12 shrink-0 place-items-center rounded-lg bg-slate-100 py-1.5 text-center dark:bg-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-500">{dt.toLocaleString("en", { month: "short" })}</span>
          <span className="text-lg font-semibold leading-none">{dt.getDate()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{d.company}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {d.title} · {d.time}
          </p>
          <Badge tone={d.mode === "Virtual" ? "sky" : "slate"}>{d.mode}</Badge>
        </div>
        {d.isRegistered ? (
          <button className="btn-outline !px-2.5 !py-1 text-xs" onClick={toggle} disabled={busy}>
            Registered ✓
          </button>
        ) : (
          <button className="btn-primary !px-2.5 !py-1 text-xs" onClick={toggle} disabled={busy || !d.canRegister} title={d.blockReason?.message}>
            Register
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      {!d.isRegistered && !d.canRegister && d.blockReason && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{d.blockReason.message}</p>}
    </li>
  );
}

export default function StudentDashboard() {
  const { me } = useAuth();
  const apps = useFetch<{ items: Application[] }>("/me/applications");
  const jobs = useFetch<{ items: StudentJob[] }>("/jobs", { eligible: true, sort: "deadline", limit: 50 });
  const drives = useFetch<{ items: StudentDrive[] }>("/drives");
  const profile = me?.student;

  if (apps.loading && !apps.data) return <Spinner />;
  if (apps.error) return <ErrorState message={apps.error} onRetry={apps.reload} />;

  const applications = apps.data?.items ?? [];
  const count = (s: string) => applications.filter((a) => a.stage === s).length;
  const companies = new Set(applications.map((a) => a.company)).size;
  const pendingOffers = applications.filter((a) => a.offer?.status === "Pending").length;
  const recommended = (jobs.data?.items ?? []).filter((j) => j.canApply).slice(0, 3);
  const upcoming = (drives.data?.items ?? []).slice(0, 3);
  const items = profile ? checklist(profile) : [];
  const strength = items.length ? Math.round((items.filter((c) => c.done).length / items.length) * 100) : 0;
  const placed = profile?.placement.status === "Placed" ? profile.placement : null;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${(profile?.name ?? "").split(" ")[0]} 👋`}
        subtitle="Here's what's happening with your placement journey."
        action={
          !placed && (
            <Link href="/students/jobs" className="btn-primary">
              Browse jobs <Icon name="arrow" className="size-4" />
            </Link>
          )
        }
      />

      {placed && (
        <div className="mb-6">
          <Notice tone="success">
            You&apos;re placed{placed.company ? ` at ${placed.company}` : ""}
            {placed.role ? ` as ${placed.role}` : ""}
            {placed.ctc ? ` (${placed.ctc} LPA)` : ""}. Congratulations! Applications and drive registrations are now closed for you.
          </Notice>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Applications" value={applications.length} hint={companies ? `Across ${companies} ${companies === 1 ? "company" : "companies"}` : undefined} icon="file" />
        <StatCard label="Shortlisted" value={count("Shortlisted")} icon="check" tone="sky" />
        <StatCard label="Interviews" value={count("Interview")} icon="calendar" tone="amber" />
        <StatCard label="Offers" value={count("Offered")} hint={pendingOffers ? `${pendingOffers} awaiting response` : undefined} icon="star" tone="emerald" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section
            title="Recommended for you"
            action={
              <Link href="/students/jobs" className="text-sm font-medium text-indigo-600 dark:text-indigo-300">
                View all
              </Link>
            }
            flush
          >
            {jobs.loading && !jobs.data ? (
              <Spinner />
            ) : recommended.length === 0 ? (
              <p className="p-5 text-sm text-slate-500 dark:text-slate-400">{placed ? "You have accepted an offer, so there is nothing more to apply for." : "No new openings match your profile right now."}</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {recommended.map((j) => (
                  <li key={j.id} className="flex items-center gap-4 px-5 py-4">
                    <CompanyLogo name={j.company} color={j.color} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{j.role}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {j.company} · {j.location} · {j.type === "Internship" ? "Internship" : `${j.ctc} LPA`}
                      </p>
                    </div>
                    <div className="hidden text-right text-xs text-slate-500 sm:block dark:text-slate-400">
                      Closes
                      <br />
                      <span className="font-medium text-slate-700 dark:text-slate-300">{shortDate(j.deadline)}</span>
                    </div>
                    <Link href={`/students/jobs?job=${j.id}`} className="btn-outline !py-1.5" title={payLabel(j)}>
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            title="Recent applications"
            action={
              <Link href="/students/applications" className="text-sm font-medium text-indigo-600 dark:text-indigo-300">
                View all
              </Link>
            }
            flush
          >
            {applications.length === 0 ? (
              <p className="p-5 text-sm text-slate-500 dark:text-slate-400">You haven&apos;t applied to anything yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {applications.slice(0, 4).map((a) => (
                  <li key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                    <CompanyLogo name={a.company} color={a.color} size="size-9" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.role}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {a.company} · Applied {formatDate(a.appliedOn)}
                      </p>
                    </div>
                    <StageBadge stage={a.stage} />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Profile strength">
            <div className="mb-1 flex items-end justify-between">
              <span className="text-3xl font-semibold">{strength}%</span>
              <Link href="/students/profile" className="text-sm font-medium text-indigo-600 dark:text-indigo-300">
                Complete profile
              </Link>
            </div>
            <ProgressBar value={strength} tone="emerald" />
            <ul className="mt-4 space-y-2 text-sm">
              {items.map((c) => (
                <li key={c.label} className="flex items-center gap-2.5">
                  <span
                    className={`grid size-5 place-items-center rounded-full ${
                      c.done ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                    }`}
                  >
                    {c.done && <Icon name="check" className="size-3.5" />}
                  </span>
                  <span className={c.done ? "" : "text-slate-500 dark:text-slate-400"}>{c.label}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Upcoming drives" flush>
            {drives.loading && !drives.data ? (
              <Spinner />
            ) : upcoming.length === 0 ? (
              <p className="p-5 text-sm text-slate-500 dark:text-slate-400">No drives scheduled.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcoming.map((d) => (
                  <DriveRow key={d.id} d={d} onChange={(nd) => drives.setData((p) => (p ? { items: p.items.map((x) => (x.id === nd.id ? nd : x)) } : p))} />
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
