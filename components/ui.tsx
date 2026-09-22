import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { initials, type ApplicationStage, type JobStatus } from "@/lib/data";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Section({
  title,
  action,
  children,
  className = "",
  flush = false,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section className={`card ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "indigo",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: IconName;
  tone?: "indigo" | "emerald" | "amber" | "rose" | "sky";
}) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
    sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
  };
  return (
    <div className="card flex items-start gap-4 p-5">
      <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon name={icon} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold tracking-tight">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}

const badgeTones = {
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  sky: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
};
export type Tone = keyof typeof badgeTones;

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeTones[tone]}`}>
      {children}
    </span>
  );
}

export const stageTone: Record<ApplicationStage, Tone> = {
  Applied: "slate",
  Shortlisted: "sky",
  Interview: "amber",
  Offered: "emerald",
  Rejected: "rose",
  Withdrawn: "slate",
};

export const jobStatusTone: Record<JobStatus, Tone> = { Open: "emerald", Pending: "sky", Draft: "amber", Rejected: "rose", Closed: "slate" };

export function StageBadge({ stage }: { stage: ApplicationStage }) {
  return <Badge tone={stageTone[stage]}>{stage}</Badge>;
}

export function CompanyLogo({ name, color, size = "size-11" }: { name: string; color: string; size?: string }) {
  return (
    <div
      className={`grid ${size} shrink-0 place-items-center rounded-xl text-sm font-bold text-white`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {name[0]}
    </div>
  );
}

export function Avatar({ name, className = "size-9" }: { name: string; className?: string }) {
  return (
    <div className={`grid ${className} shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300`}>
      {initials(name)}
    </div>
  );
}

export function ProgressBar({ value, tone = "indigo" }: { value: number; tone?: "indigo" | "emerald" | "amber" | "rose" }) {
  const fill = { indigo: "bg-indigo-500", emerald: "bg-emerald-500", amber: "bg-amber-500", rose: "bg-rose-500" }[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

/** Simple vertical bar chart — pure CSS, no chart dependency. */
export function BarChart({ data, unit = "" }: { data: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex h-52 items-end gap-3 sm:gap-5" role="img" aria-label="Bar chart">
      {data.map((d) => (
        <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {d.value}
            {unit}
          </span>
          <div className="w-full max-w-14 rounded-t-md bg-indigo-500/90 transition-all hover:bg-indigo-500" style={{ height: `${(d.value / max) * 78}%` }} />
          <span className="text-xs text-slate-500 dark:text-slate-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 px-6 py-14 text-sm text-slate-500 dark:text-slate-400" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="px-6 py-12 text-center" role="alert">
      <p className="font-medium text-rose-600 dark:text-rose-400">Couldn&apos;t load this</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message}</p>
      {onRetry && (
        <button className="btn-outline mt-4" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

/** Inline banner for the result of an action (error or success). */
export function Notice({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  const cls =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
      : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300";
  return (
    <p className={`rounded-lg border px-3 py-2 text-sm ${cls}`} role={tone === "error" ? "alert" : "status"}>
      {children}
    </p>
  );
}
