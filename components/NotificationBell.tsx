"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import { api } from "@/lib/api";
import type { Notification } from "@/lib/data";

function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 60 * 24) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}

/** The student's in-app inbox: unread badge plus a dropdown of recent notifications. */
export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[] | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(() => {
    api
      .get<{ count: number }>("/me/notifications/unread-count")
      .then((r) => setCount(r.count))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshCount();
    const t = setInterval(refreshCount, 60_000);
    return () => clearInterval(t);
  }, [refreshCount]);

  useEffect(() => {
    if (!open) return;
    api
      .get<{ items: Notification[] }>("/me/notifications", { limit: 10 })
      .then((r) => setItems(r.items))
      .catch(() => setItems([]));
    const away = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  const read = (n: Notification) => {
    setOpen(false);
    if (n.read) return;
    setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? null);
    setCount((c) => Math.max(0, c - 1));
    api.post(`/me/notifications/${n.id}/read`).catch(refreshCount);
  };

  const readAll = async () => {
    setItems((prev) => prev?.map((x) => ({ ...x, read: true })) ?? null);
    setCount(0);
    await api.post("/me/notifications/read-all").catch(refreshCount);
  };

  return (
    <div className="relative" ref={box}>
      <button className="btn-ghost relative !px-2" aria-label={count ? `Notifications, ${count} unread` : "Notifications"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="bell" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-4 text-white">{count > 99 ? "99+" : count}</span>
        )}
      </button>
      {open && (
        <div className="card absolute right-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h2 className="text-sm font-semibold">Notifications</h2>
            {count > 0 && (
              <button className="text-xs font-medium text-indigo-600 dark:text-indigo-300" onClick={readAll}>
                Mark all read
              </button>
            )}
          </div>
          {items === null ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">Loading…</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">You&apos;re all caught up.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
              {items.map((n) => {
                const body = (
                  <>
                    <span className="flex items-start gap-2">
                      {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-indigo-500" aria-label="Unread" />}
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{n.title}</span>
                        {n.body && <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{n.body}</span>}
                        <span className="mt-1 block text-[11px] text-slate-400">{ago(n.createdAt)}</span>
                      </span>
                    </span>
                  </>
                );
                const cls = "block px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40";
                return (
                  <li key={n.id}>
                    {n.link.startsWith("/") ? (
                      <Link href={n.link} className={cls} onClick={() => read(n)}>
                        {body}
                      </Link>
                    ) : (
                      <button className={`${cls} w-full`} onClick={() => read(n)}>
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
