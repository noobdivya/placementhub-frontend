"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import Modal from "@/components/Modal";
import ReasonDialog from "@/components/ReasonDialog";
import { CompanyLogo, ErrorState, Notice, PageHeader, Spinner, StageBadge } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, STAGES, type Application, type Stage } from "@/lib/data";
import { useFetch } from "@/lib/hooks";

const steps: Stage[] = ["Applied", "Shortlisted", "Interview", "Offered"];
const LIVE = ["Applied", "Shortlisted", "Interview"];

function Stepper({ stage }: { stage: Application["stage"] }) {
  const dead = stage === "Rejected" || stage === "Withdrawn";
  const current = dead ? -1 : steps.indexOf(stage as Stage);
  return (
    <ol className="flex items-center" aria-label={`Progress: ${stage}`}>
      {steps.map((s, i) => {
        const reached = i <= current;
        return (
          <li key={s} className="flex flex-1 items-center last:flex-none">
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                reached
                  ? "bg-indigo-600 text-white"
                  : dead
                    ? "bg-rose-100 text-rose-500 dark:bg-rose-500/20"
                    : "bg-slate-100 text-slate-400 dark:bg-slate-800"
              }`}
              title={s}
            >
              {reached ? <Icon name="check" className="size-3.5" /> : dead && i === 0 ? <Icon name="x" className="size-3.5" /> : i + 1}
            </span>
            {i < steps.length - 1 && <span className={`mx-1 h-0.5 flex-1 rounded ${i < current ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

export default function Applications() {
  const { reloadMe } = useAuth();
  const apps = useFetch<{ items: Application[] }>("/me/applications");
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmAccept, setConfirmAccept] = useState<Application | null>(null);
  const [declining, setDeclining] = useState<Application | null>(null);

  if (apps.loading && !apps.data) return <Spinner />;
  if (apps.error) return <ErrorState message={apps.error} onRetry={apps.reload} />;

  const applications = apps.data?.items ?? [];
  const counts = STAGES.map((s) => ({ s, n: applications.filter((a) => a.stage === s).length }));
  const withdrawn = applications.filter((a) => a.stage === "Withdrawn").length;

  const run = async (id: string, action: () => Promise<string | void>) => {
    setBusy(id);
    setError(null);
    setFlash(null);
    try {
      const msg = await action();
      if (msg) setFlash(msg);
      apps.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const withdraw = (a: Application) => run(a.id, async () => void (await api.post(`/me/applications/${a.id}/withdraw`)));

  const accept = (a: Application) =>
    run(a.id, async () => {
      const r = await api.post<{ applicationsWithdrawn: number; offersDeclined: number; driveRegistrationsCancelled: number }>(`/me/offers/${a.offer!.id}/accept`);
      await reloadMe();
      return `Offer accepted — you're placed at ${a.company}. ${r.applicationsWithdrawn} other application(s) withdrawn, ${r.offersDeclined} other offer(s) declined.`;
    });

  return (
    <>
      <PageHeader title="My applications" subtitle="Track every application from submission to offer." />

      <div className="mb-6 flex flex-wrap gap-2">
        {counts.map(({ s, n }) => (
          <div key={s} className="card flex items-center gap-2 px-3.5 py-2 text-sm">
            <StageBadge stage={s} />
            <span className="font-semibold">{n}</span>
          </div>
        ))}
        {withdrawn > 0 && (
          <div className="card flex items-center gap-2 px-3.5 py-2 text-sm">
            <StageBadge stage="Withdrawn" />
            <span className="font-semibold">{withdrawn}</span>
          </div>
        )}
      </div>

      {(error || flash) && <div className="mb-4">{error ? <Notice tone="error">{error}</Notice> : <Notice tone="success">{flash}</Notice>}</div>}

      {applications.length === 0 ? (
        <div className="card px-6 py-14 text-center">
          <p className="font-medium">No applications yet</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Head to the job board to apply for your first role.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((a) => {
            const pending = a.offer?.status === "Pending" ? a.offer : null;
            return (
              <article key={a.id} className="card p-5">
                <div className="flex flex-wrap items-center gap-4">
                  <CompanyLogo name={a.company} color={a.color} />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold">{a.role}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {a.company} · Applied on {formatDate(a.appliedOn)}
                    </p>
                  </div>
                  <StageBadge stage={a.stage} />
                </div>
                <div className="mt-5 grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <Stepper stage={a.stage} />
                  {(a.note || pending) && (
                    <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                      {pending ? `Offer: ${pending.ctc} LPA · valid until ${formatDate(pending.validUntil)}` : a.note}
                      {pending && a.note ? ` · ${a.note}` : ""}
                    </p>
                  )}
                </div>
                <div className="mt-2 hidden grid-cols-4 text-xs text-slate-500 sm:grid sm:w-1/2 sm:pr-2 dark:text-slate-400">
                  {steps.map((s) => (
                    <span key={s} className="last:text-right">
                      {s}
                    </span>
                  ))}
                </div>
                {a.offer?.status === "Accepted" && <p className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">You accepted this offer ({a.offer.ctc} LPA).</p>}
                {(pending || LIVE.includes(a.stage)) && (
                  <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                    {pending ? (
                      <>
                        <button className="btn-outline text-rose-600 dark:text-rose-400" onClick={() => setDeclining(a)} disabled={busy === a.id}>
                          Decline offer
                        </button>
                        <button className="btn-primary" onClick={() => setConfirmAccept(a)} disabled={busy === a.id}>
                          Accept offer
                        </button>
                      </>
                    ) : (
                      <button className="btn-outline" onClick={() => withdraw(a)} disabled={busy === a.id}>
                        Withdraw application
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {confirmAccept && (
        <Modal title={`Accept the offer from ${confirmAccept.company}?`} onClose={() => setConfirmAccept(null)}>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Accepting makes you <strong>placed</strong>. Your other applications will be withdrawn, other pending offers declined, and upcoming drive registrations cancelled. You won&apos;t be able to apply to
            further jobs or drives.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button className="btn-outline" onClick={() => setConfirmAccept(null)}>
              Not yet
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                const a = confirmAccept;
                setConfirmAccept(null);
                void accept(a);
              }}
            >
              Accept offer
            </button>
          </div>
        </Modal>
      )}

      {declining && (
        <ReasonDialog
          title={`Decline the offer from ${declining.company}`}
          hint="The application will be marked Withdrawn."
          confirmLabel="Decline offer"
          onConfirm={async (reason) => {
            await api.post(`/me/offers/${declining.offer!.id}/decline`, { reason });
            apps.reload();
          }}
          onClose={() => setDeclining(null)}
        />
      )}
    </>
  );
}
