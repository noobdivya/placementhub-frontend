"use client";

import { useState } from "react";
import Modal from "./Modal";
import { Badge, ErrorState, Notice, Spinner, type Tone } from "./ui";
import { api, errorMessage } from "@/lib/api";
import { formatRoundWhen, type Candidate, type RoundProgress, type RoundStatus } from "@/lib/data";
import { useFetch } from "@/lib/hooks";

const roundTone: Record<RoundStatus, Tone> = { Upcoming: "slate", Scheduled: "sky", Cleared: "emerald", Rejected: "rose" };
const NEXT: Partial<Record<RoundStatus, RoundStatus>> = { Upcoming: "Scheduled", Scheduled: "Cleared" };

/** Lets a recruiter advance one candidate through the job's selection rounds —
 * the company-side counterpart to CandidateBoard's stage kanban, following the
 * same call-a-mutation-then-optimistically-patch-list pattern. */
export default function RoundStatusModal({ candidate, onClose }: { candidate: Candidate; onClose: () => void }) {
  const rounds = useFetch<{ items: RoundProgress[] }>(`/company/applications/${candidate.id}/rounds`);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setStatus = async (roundId: string, status: RoundStatus) => {
    setBusy(roundId);
    setError(null);
    try {
      const updated = await api.patch<RoundProgress>(`/company/applications/${candidate.id}/rounds/${roundId}`, { status });
      rounds.setData((p) => (p ? { items: p.items.map((r) => (r.id === roundId ? updated : r)) } : p));
    } catch (e) {
      setError(errorMessage(e));
      rounds.reload(); // someone else may have moved it since we loaded
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal title={`Selection rounds — ${candidate.name}`} onClose={onClose}>
      {rounds.error ? (
        <ErrorState message={rounds.error} onRetry={rounds.reload} />
      ) : rounds.loading && !rounds.data ? (
        <Spinner />
      ) : !rounds.data || rounds.data.items.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">This job has no selection rounds defined.</p>
      ) : (
        <div className="space-y-3">
          {error && <Notice tone="error">{error}</Notice>}
          {rounds.data.items.map((r) => {
            const next = NEXT[r.status];
            const canReject = r.status === "Upcoming" || r.status === "Scheduled";
            const working = busy === r.id;
            return (
              <div key={r.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatRoundWhen(r.scheduledAt)} · {r.mode}
                      {r.location ? ` · ${r.location}` : ""}
                    </p>
                  </div>
                  <Badge tone={roundTone[r.status]}>{r.status}</Badge>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {next && (
                    <button className="btn-primary flex-1 !px-2 !py-1.5 text-xs" disabled={working} onClick={() => setStatus(r.id, next)}>
                      Mark {next}
                    </button>
                  )}
                  {canReject && (
                    <button className="btn-outline !px-2.5 !py-1.5 text-xs text-rose-600 dark:text-rose-400" disabled={working} onClick={() => setStatus(r.id, "Rejected")}>
                      Reject
                    </button>
                  )}
                  {(r.status === "Cleared" || r.status === "Rejected") && (
                    <button className="btn-outline !px-2.5 !py-1.5 text-xs" disabled={working} onClick={() => setStatus(r.id, "Scheduled")}>
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
