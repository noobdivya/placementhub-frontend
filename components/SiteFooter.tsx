import Link from "next/link";
import { Icon } from "./icons";
import type { SiteConfig } from "@/lib/data";

export default function SiteFooter({ siteConfig }: { siteConfig: SiteConfig }) {
  return (
    <footer className="bg-slate-900 text-slate-300 dark:border-t dark:border-slate-800">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5 text-white">
            <span className="grid size-10 place-items-center rounded-xl bg-indigo-600">
              <Icon name="graduation" />
            </span>
            <span className="leading-tight">
              <span className="block font-semibold">{siteConfig.name}</span>
              <span className="block text-xs text-slate-400">{siteConfig.college}</span>
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-slate-400">The interface between our students and the corporate world.</p>
          <div className="mt-5 flex gap-2">
            {siteConfig.socials.map((s) => (
              <a key={s.label} href={s.href} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800" aria-label={s.label}>
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Quick links</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              ["Student portal", "/students"],
              ["Recruiter portal", "/companies"],
              ["Placement cell", "/placementcell"],
              ["Notices", "/#notices"],
            ].map(([l, h]) => (
              <li key={l}>
                <Link href={h} className="hover:text-white">
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Contact</h3>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li className="flex gap-2">
              <Icon name="pin" className="mt-0.5 size-4 shrink-0" /> {siteConfig.address}
            </li>
            <li>
              <a href={`mailto:${siteConfig.email}`} className="hover:text-white">
                {siteConfig.email}
              </a>
            </li>
            {siteConfig.phones.map((p) => (
              <li key={p}>{p}</li>
            ))}
            <li className="text-slate-400">{siteConfig.hours}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">
        © 2026 {siteConfig.college} Placement Cell. All rights reserved.
      </div>
    </footer>
  );
}
