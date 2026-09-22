"use client";

import { useState } from "react";
import Modal from "./Modal";
import { Notice } from "./ui";
import { errorMessage } from "@/lib/api";

/** Asks for a reason (e.g. when rejecting) and runs `onConfirm` with it. */
export default function ReasonDialog({
  title,
  hint,
  confirmLabel,
  required = false,
  onConfirm,
  onClose,
}: {
  title: string;
  hint?: string;
  confirmLabel: string;
  required?: boolean;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Modal title={title} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await onConfirm(reason.trim());
            onClose();
          } catch (err) {
            setError(errorMessage(err));
            setBusy(false);
          }
        }}
      >
        {hint && <p className="text-sm text-slate-500 dark:text-slate-400">{hint}</p>}
        <div>
          <label className="label" htmlFor="reason">
            Reason{required ? "" : " (optional)"}
          </label>
          <textarea id="reason" className="input min-h-24" value={reason} onChange={(e) => setReason(e.target.value)} required={required} maxLength={500} autoFocus />
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
