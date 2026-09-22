import Link from "next/link";
import HeroCarousel from "@/components/HeroCarousel";
import { Icon, type IconName } from "@/components/icons";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import { Avatar, Badge, type Tone } from "@/components/ui";
import { publicGet } from "@/lib/api";
import { defaultSite, formatDate, type NoticeItem, type SiteConfig } from "@/lib/data";

const tagTone: Record<string, Tone> = { Result: "emerald", Drive: "indigo", Alert: "rose", Event: "amber" };

const quickLinks: { href: string; label: string; hint: string; icon: IconName }[] = [
  { href: "/students", label: "Students", hint: "Apply & track", icon: "graduation" },
  { href: "/companies", label: "Recruiters", hint: "Post & shortlist", icon: "building" },
  { href: "/placementcell", label: "Placement cell", hint: "Manage the season", icon: "shield" },
];

const statTiles = (placementStats: SiteConfig["stats"]): { label: string; value: string | number; icon: IconName; card: string; iconCls: string }[] => [
  {
    label: "Students placed", value: placementStats.placed, icon: "graduation",
    card: "bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20",
    iconCls: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  {
    label: "Companies visited", value: placementStats.companiesVisited, icon: "building",
    card: "bg-sky-50 border-sky-100 dark:bg-sky-500/10 dark:border-sky-500/20",
    iconCls: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300",
  },
  {
    label: "Average CTC", value: `${placementStats.avgCtc} LPA`, icon: "chart",
    card: "bg-violet-50 border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20",
    iconCls: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
  },
  {
    label: "Highest CTC", value: `${placementStats.highestCtc} LPA`, icon: "star",
    card: "bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20",
    iconCls: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
  },
];

function SectionHeading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-8 text-center">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">{eyebrow}</p>}
      <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
    </div>
  );
}

// The home page shows whatever the API has, falling back to the defaults in lib/data.ts so it
// still renders (and stays fast) if the backend is down. Refreshed at most once a minute.
const REVALIDATE = { next: { revalidate: 60 } };

/** Overlay the API's document on the defaults, ignoring empty or wrongly-typed fields. */
function mergeSite(remote: Partial<SiteConfig> | null): SiteConfig {
  const out: Record<string, unknown> = { ...defaultSite };
  for (const [k, v] of Object.entries(remote ?? {})) {
    const d = (defaultSite as unknown as Record<string, unknown>)[k];
    if (d === undefined || v === null || typeof v !== typeof d || Array.isArray(v) !== Array.isArray(d)) continue;
    if (Array.isArray(v)) {
      if (v.length) out[k] = v;
    } else if (typeof v === "object") out[k] = { ...(d as object), ...v };
    else if (v !== "") out[k] = v;
  }
  return out as unknown as SiteConfig;
}

export default async function Home() {
  const [remote, noticeRes, recruiterRes] = await Promise.all([
    publicGet<Partial<SiteConfig>>("/site-config", REVALIDATE).catch(() => null),
    publicGet<{ items: NoticeItem[] }>("/notices", REVALIDATE).catch(() => null),
    publicGet<{ items: { name: string; color: string }[] }>("/recruiters", REVALIDATE).catch(() => null),
  ]);
  const siteConfig = mergeSite(remote);
  const { deskMessages, testimonials } = siteConfig;
  const notices = noticeRes?.items ?? [];
  const recruiters = recruiterRes?.items.map((r) => r.name) ?? [];
  const stats = statTiles(siteConfig.stats);

  return (
    <div className="min-h-screen">
      <SiteNav siteConfig={siteConfig} />
      <HeroCarousel heroSlides={siteConfig.heroSlides} />

      {/* Portal shortcuts */}
      <section className="mx-auto -mt-6 grid max-w-5xl gap-3 px-4 sm:grid-cols-3 sm:px-6" aria-label="Portals">
        {quickLinks.map((q) => (
          <Link key={q.href} href={q.href} className="card relative z-10 flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
            <span className="grid size-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
              <Icon name={q.icon} />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold">{q.label}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{q.hint}</span>
            </span>
            <Icon name="arrow" className="size-4 text-slate-400" />
          </Link>
        ))}
      </section>

      {/* Notices + About */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-5">
        <div id="notices" className="card lg:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Icon name="bell" className="size-5 text-indigo-600" /> Notices
            </h2>
            <span className="text-xs text-slate-500">Latest first</span>
          </div>
          {notices.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-500">No notices right now.</p>}
          <ul className="max-h-[26rem] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
            {notices.map((n) => (
              <li key={n.id}>
                <a href="#" className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <time dateTime={n.date} className="w-14 shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {formatDate(n.date).replace(/ \d{4}$/, "")}
                    <br />
                    <span className="font-normal">{n.date.slice(0, 4)}</span>
                  </time>
                  <span className="flex-1 text-sm">{n.title}</span>
                  <Badge tone={tagTone[n.tag]}>{n.tag}</Badge>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div id="about" className="flex flex-col justify-center lg:col-span-2 lg:pl-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">About the cell</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Bridging campus and the corporate world</h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            The Placement Cell of {siteConfig.college} serves as an interface between the students and the corporate world. We organise campus drives, workshops, mock interviews and
            industry interactions so every student is ready for the opportunities ahead.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            {["Campus drives & pool placements", "Internship & pre-placement offers", "Resume, aptitude and interview training"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Icon name="check" className="size-4 text-emerald-500" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Desk messages */}
      <section id="messages" className="bg-white py-16 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow="From the desk" title="Words from our leadership" />
          <div className="grid gap-6 md:grid-cols-3">
            {deskMessages.map((m) => (
              <figure key={m.role} className="card flex flex-col p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">{m.role}</p>
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">“{m.text}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <Avatar name={m.name} className="size-11" />
                  <span className="text-sm">
                    <span className="block font-semibold">{m.name}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{m.title}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="bg-gradient-to-b from-slate-50 to-slate-100 py-16 dark:from-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow="By the numbers" title="Placement at a glance" />
          <dl className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className={`rounded-xl border p-5 text-center sm:p-6 ${s.card}`}>
                <span className={`mx-auto grid size-12 place-items-center rounded-full ${s.iconCls}`}>
                  <Icon name={s.icon} className="size-6" />
                </span>
                <dd className="mt-3 text-3xl font-semibold tracking-tight">{s.value}</dd>
                <dt className="mt-1 text-sm text-slate-600 dark:text-slate-400">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Recruiters */}
      {recruiters.length > 0 && (
      <section id="recruiters" className="py-16">
        <SectionHeading eyebrow="Our recruiters" title="Companies that hire from our campus" />
        <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <ul className="animate-marquee flex w-max gap-4 px-2 hover:[animation-play-state:paused]">
            {[...recruiters, ...recruiters].map((r, idx) => (
              <li
                key={idx}
                aria-hidden={idx >= recruiters.length}
                className="card flex h-20 w-48 items-center justify-center px-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-300"
              >
                {r}
              </li>
            ))}
          </ul>
        </div>
      </section>
      )}

      {/* Testimonials */}
      <section id="testimonials" className="bg-white py-16 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow="Testimonials" title="What our students say" />
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="card p-6">
                <div className="flex gap-0.5 text-amber-400" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon key={i} name="star" className="size-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">“{t.quote}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <Avatar name={t.name} />
                  <span className="text-sm">
                    <span className="block font-semibold">{t.name}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {t.batch} · {t.company}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter siteConfig={siteConfig} />
    </div>
  );
}
