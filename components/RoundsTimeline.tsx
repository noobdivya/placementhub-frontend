import { Icon } from "./icons";
import { formatRoundWhen, type RoundProgress } from "@/lib/data";

/** A per-job, data-driven round-by-round progress timeline — the same visual
 * language as the fixed 4-stage Stepper on this page, generalised to however
 * many rounds this company defined. */
export default function RoundsTimeline({ rounds }: { rounds: RoundProgress[] }) {
  const current = rounds.find((r) => r.current);
  return (
    <div>
      <ol className="flex items-start overflow-x-auto pb-1" aria-label="Selection rounds">
        {rounds.map((r, i) => {
          const done = r.status === "Cleared";
          const rejected = r.status === "Rejected";
          return (
            <li key={r.id} className="flex shrink-0 items-start">
              <div className="flex w-20 flex-col items-center gap-1 px-1 text-center">
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                    done
                      ? "bg-indigo-600 text-white"
                      : rejected
                        ? "bg-rose-100 text-rose-500 dark:bg-rose-500/20"
                        : r.current
                          ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20"
                          : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                  }`}
                  title={`${r.name}: ${r.status}`}
                >
                  {done ? <Icon name="check" className="size-3.5" /> : rejected ? <Icon name="x" className="size-3.5" /> : i + 1}
                </span>
                <span className="truncate text-[10px] leading-tight text-slate-500 dark:text-slate-400">{r.name}</span>
              </div>
              {i < rounds.length - 1 && <span className={`mt-2.5 h-0.5 w-6 shrink-0 rounded ${done ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"}`} />}
            </li>
          );
        })}
      </ol>
      {current && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium">{current.name}</span> · {formatRoundWhen(current.scheduledAt)} · {current.mode}
          {current.location ? ` · ${current.location}` : ""}
          {current.instructions && <span className="block text-xs text-slate-500 dark:text-slate-400">{current.instructions}</span>}
        </p>
      )}
    </div>
  );
}
