"use client";

import { useEffect, type ReactNode } from "react";
import { Icon } from "./icons";

export default function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className={`card relative max-h-[90vh] w-full overflow-y-auto rounded-b-none p-6 sm:rounded-b-xl ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"}`}>
        <button className="btn-ghost absolute right-3 top-3 !px-2" onClick={onClose} aria-label="Close">
          <Icon name="x" />
        </button>
        <h3 className="pr-8 text-lg font-semibold">{title}</h3>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
