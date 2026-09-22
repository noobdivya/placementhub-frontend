import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./icons";
import ThemeToggle from "./ThemeToggle";

export default function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white">
            <Icon name="graduation" />
          </span>
          <span className="text-lg font-semibold">Placement Hub</span>
        </Link>
        <div className="card p-6 sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</p>}
      </div>
    </div>
  );
}
