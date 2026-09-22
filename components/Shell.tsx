"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { Avatar } from "./ui";
import ThemeToggle from "./ThemeToggle";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

export default function Shell({
  portal,
  nav,
  user,
  onSignOut,
  bell,
  children,
}: {
  portal: string;
  nav: NavItem[];
  user: { name: string; role: string };
  onSignOut: () => void;
  bell?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = nav[0].href;

  const isActive = (href: string) => (href === root ? pathname === href : pathname.startsWith(href));

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex items-center gap-2.5 px-5 py-5" onClick={() => setOpen(false)}>
        <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white">
          <Icon name="graduation" />
        </span>
        <span>
          <span className="block text-base font-semibold leading-tight">Placement Hub</span>
          <span className="block text-xs text-slate-500 dark:text-slate-400">{portal}</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Main">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive(item.href)
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Icon name={item.icon} className="size-[18px]" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-900">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl dark:bg-slate-900">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-900/85">
          <button className="btn-ghost -ml-2 !px-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <div className="relative hidden max-w-md flex-1 sm:block">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input className="input !pl-9" placeholder="Search…" aria-label="Search" />
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {bell}
            <div className="flex items-center gap-2.5 pl-1">
              <Avatar name={user.name} />
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.role}</p>
              </div>
            </div>
            <button className="btn-ghost !px-2" aria-label="Sign out" title="Sign out" onClick={onSignOut}>
              <Icon name="logout" className="size-[18px]" />
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
