"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "./icons";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/lib/auth";
import { ROLE_HOME, type SiteConfig } from "@/lib/data";

interface Item {
  label: string;
  href: string;
}
type Entry = { label: string; href: string } | { label: string; items: Item[] };

const entries: Entry[] = [
  { label: "Home", href: "/" },
  {
    label: "About Us",
    items: [
      { label: "About the cell", href: "/#about" },
      { label: "Messages from the desk", href: "/#messages" },
      { label: "Placement statistics", href: "/#stats" },
    ],
  },
  {
    label: "Opportunities",
    items: [
      { label: "Placements & internships", href: "/students/jobs" },
      { label: "Our recruiters", href: "/#recruiters" },
    ],
  },
  {
    label: "Student Resources",
    items: [
      { label: "Notices", href: "/#notices" },
      { label: "My applications", href: "/students/applications" },
      { label: "Profile & resume", href: "/students/profile" },
    ],
  },
  { label: "Testimonials", href: "/#testimonials" },
  {
    label: "Support",
    items: [
      { label: "Student portal", href: "/students" },
      { label: "Recruiter portal", href: "/companies" },
    ],
  },
];

const signedOut: Item[] = [
  { label: "Sign in", href: "/login" },
  { label: "Register your company", href: "/register" },
];

const linkCls = "rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800";

function Dropdown({ label, items, align = "left" }: { label: string; items: Item[]; align?: "left" | "right" }) {
  return (
    <div className="group relative">
      <button className={`${linkCls} flex items-center gap-1`} aria-haspopup="menu">
        {label}
        <svg viewBox="0 0 20 20" className="size-4 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" fill="currentColor" aria-hidden="true">
          <path d="M5.5 7.5 10 12l4.5-4.5-1-1L10 10 6.5 6.5z" />
        </svg>
      </button>
      <div
        className={`invisible absolute top-full z-40 min-w-56 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 ${
          align === "right" ? "right-0" : "left-0"
        }`}
      >
        <ul className="card p-1.5 shadow-lg" role="menu">
          {items.map((i) => (
            <li key={i.label} role="none">
              <Link role="menuitem" href={i.href} className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-indigo-500/15">
                {i.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function SiteNav({ siteConfig }: { siteConfig: Pick<SiteConfig, "name" | "college"> }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const profile: Item[] = user ? [{ label: "My portal", href: ROLE_HOME[user.role] }] : signedOut;
  const signOut = async () => {
    setOpen(false);
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white">
            <Icon name="graduation" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-semibold">{siteConfig.name}</span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">{siteConfig.college}</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {entries.map((e) =>
            "items" in e ? (
              <Dropdown key={e.label} label={e.label} items={e.items} />
            ) : (
              <Link key={e.label} href={e.href} className={linkCls}>
                {e.label}
              </Link>
            ),
          )}
          <ThemeToggle className="ml-1" />
          <div className="ml-1">
            <div className="group relative">
              <button className="btn-primary" aria-haspopup="menu">
                <Icon name="user" className="size-4" /> {user ? user.name.split(" ")[0] : "Sign in"}
              </button>
              <div className="invisible absolute right-0 top-full z-40 min-w-52 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <ul className="card p-1.5 shadow-lg" role="menu">
                  {profile.map((i) => (
                    <li key={i.label} role="none">
                      <Link role="menuitem" href={i.href} className="block rounded-md px-3 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-500/15">
                        {i.label}
                      </Link>
                    </li>
                  ))}
                  {user && (
                    <li role="none">
                      <button role="menuitem" onClick={signOut} className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-500/15">
                        Sign out
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <button className="btn-ghost !px-2" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Toggle menu">
            <Icon name={open ? "x" : "menu"} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-200 px-4 py-3 lg:hidden dark:border-slate-800" aria-label="Mobile">
          {[...entries, { label: "Profile", items: profile } as Entry].map((e) =>
            "items" in e ? (
              <details key={e.label} className="group">
                <summary className={`${linkCls} flex cursor-pointer list-none items-center justify-between`}>
                  {e.label}
                  <svg viewBox="0 0 20 20" className="size-4 transition-transform group-open:rotate-180" fill="currentColor" aria-hidden="true">
                    <path d="M5.5 7.5 10 12l4.5-4.5-1-1L10 10 6.5 6.5z" />
                  </svg>
                </summary>
                <ul className="mb-1 ml-3 border-l border-slate-200 pl-2 dark:border-slate-800">
                  {e.items.map((i) => (
                    <li key={i.label}>
                      <Link href={i.href} className={`${linkCls} block`} onClick={() => setOpen(false)}>
                        {i.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ) : (
              <Link key={e.label} href={e.href} className={`${linkCls} block`} onClick={() => setOpen(false)}>
                {e.label}
              </Link>
            ),
          )}
          {user && (
            <button className={`${linkCls} block w-full text-left`} onClick={signOut}>
              Sign out
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
