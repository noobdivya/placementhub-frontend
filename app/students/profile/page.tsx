"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { Avatar, Badge, ErrorState, Notice, PageHeader, Section, Spinner } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fileSize, formatDate, type StudentProfile } from "@/lib/data";
import { useFetch } from "@/lib/hooks";

interface Form {
  phone: string;
  github: string;
  linkedin: string;
  about: string;
  tenth: string;
  twelfth: string;
}

const toForm = (p: StudentProfile): Form => ({
  phone: p.phone,
  github: p.links.github,
  linkedin: p.links.linkedin,
  about: p.about,
  tenth: p.tenth?.toString() ?? "",
  twelfth: p.twelfth?.toString() ?? "",
});

function Field({ label, value, onChange, type = "text", readOnly = false, hint }: { label: string; value: string | number; onChange?: (v: string) => void; type?: string; readOnly?: boolean; hint?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className="input read-only:bg-slate-50 read-only:text-slate-500 dark:read-only:bg-slate-800/60"
        type={type}
        value={value}
        readOnly={readOnly}
        step={type === "number" ? "0.01" : undefined}
        onChange={(e) => onChange?.(e.target.value)}
      />
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

export default function Profile() {
  const { reloadMe } = useAuth();
  const profile = useFetch<StudentProfile>("/me/profile");
  const [draft, setDraft] = useState<Form | null>(null);
  const [skill, setSkill] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);
  const [busy, setBusy] = useState<"save" | "resume" | "skill" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const p = profile.data;
  const form = draft ?? (p ? toForm(p) : null); // edits live in `draft` until saved

  if (profile.error) return <ErrorState message={profile.error} onRetry={profile.reload} />;
  if (!p || !form) return <Spinner />;

  const set = (k: keyof Form) => (v: string) => setDraft({ ...form, [k]: v });
  const replace = (next: StudentProfile) => {
    profile.setData(() => next);
    void reloadMe();
  };
  const num = (s: string) => (s.trim() === "" ? undefined : Number(s));

  const guard = async (kind: NonNullable<typeof busy>, fn: () => Promise<void>) => {
    setBusy(kind);
    setError(null);
    setFlash(null);
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const save = () =>
    guard("save", async () => {
      const next = await api.put<StudentProfile>("/me/profile", {
        phone: form.phone,
        about: form.about,
        links: { github: form.github, linkedin: form.linkedin },
        tenth: num(form.tenth),
        twelfth: num(form.twelfth),
      });
      replace(next);
      setDraft(null);
      setFlash("Profile saved.");
    });

  const upload = (file: File) =>
    guard("resume", async () => {
      const fd = new FormData();
      fd.append("file", file);
      const meta = await api.upload<NonNullable<StudentProfile["resume"]>>("/me/resume", fd);
      replace({ ...p, resume: meta });
      setFlash("Resume uploaded.");
    });

  const addSkill = () => {
    const name = skill.trim();
    if (!name) return;
    void guard("skill", async () => {
      const r = await api.post<{ skills: string[] }>("/me/skills", { skill: name });
      replace({ ...p, skills: r.skills });
      setSkill("");
      setAddingSkill(false);
    });
  };

  const removeSkill = (name: string) =>
    guard("skill", async () => {
      const r = await api.del<{ skills: string[] }>("/me/skills", { name });
      replace({ ...p, skills: r.skills });
    });

  return (
    <>
      <PageHeader
        title="Profile & resume"
        subtitle="Companies see this information when you apply."
        action={
          <button className="btn-primary" onClick={save} disabled={busy === "save"}>
            {busy === "save" ? "Saving…" : "Save changes"}
          </button>
        }
      />

      {(error || flash) && <div className="mb-4">{error ? <Notice tone="error">{error}</Notice> : <Notice tone="success">{flash}</Notice>}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="card flex flex-col items-center p-6 text-center">
            <Avatar name={p.name} className="size-20 text-2xl" />
            <h2 className="mt-3 text-lg font-semibold">{p.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              B.Tech {p.branch} · {p.year}
            </p>
            {p.placement.status !== "Unplaced" && (
              <div className="mt-2">
                <Badge tone={p.placement.status === "Placed" ? "emerald" : "amber"}>{p.placement.status}</Badge>
              </div>
            )}
            <div className="mt-4 grid w-full grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 pt-4 dark:divide-slate-800 dark:border-slate-800">
              <div>
                <p className="text-lg font-semibold">{p.cgpa}</p>
                <p className="text-xs text-slate-500">CGPA</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{p.backlogs}</p>
                <p className="text-xs text-slate-500">Backlogs</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{p.roll}</p>
                <p className="text-xs text-slate-500">Roll no.</p>
              </div>
            </div>
          </div>

          <Section title="Resume">
            {p.resume ? (
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <span className="grid size-10 place-items-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/15">
                  <Icon name="file" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.resume.filename}</p>
                  <p className="text-xs text-slate-500">
                    Uploaded {formatDate(p.resume.uploadedAt)} · {fileSize(p.resume.sizeBytes)}
                  </p>
                </div>
                <button className="btn-ghost !px-2" aria-label="Download resume" onClick={() => api.download("/me/resume", p.resume!.filename).catch((e) => setError(errorMessage(e)))}>
                  <Icon name="download" className="size-[18px]" />
                </button>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">You haven&apos;t uploaded a resume. You need one to apply for jobs.</p>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void upload(f);
              }}
            />
            <button className="btn-outline mt-3 w-full" onClick={() => fileInput.current?.click()} disabled={busy === "resume"}>
              <Icon name="upload" className="size-4" /> {busy === "resume" ? "Uploading…" : p.resume ? "Upload new resume" : "Upload resume"}
            </button>
            <p className="mt-2 text-xs text-slate-500">PDF only, up to 5 MB.</p>
          </Section>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Section title="Personal details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={p.name} readOnly />
              <Field label="Roll number" value={p.roll} readOnly />
              <Field label="College email" value={p.email} type="email" readOnly />
              <Field label="Phone" value={form.phone} onChange={set("phone")} type="tel" />
              <Field label="GitHub" value={form.github} onChange={set("github")} />
              <Field label="LinkedIn" value={form.linkedin} onChange={set("linkedin")} />
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Name, roll number and email are managed by the placement cell.</p>
            <div className="mt-4">
              <label className="label">About</label>
              <textarea className="input min-h-24" value={form.about} onChange={(e) => set("about")(e.target.value)} maxLength={2000} />
            </div>
          </Section>

          <Section title="Academics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Branch" value={p.branch} readOnly />
              <Field label="Current CGPA" value={p.cgpa} type="number" readOnly hint="Verified by the placement cell." />
              <Field label="10th percentage" value={form.tenth} onChange={set("tenth")} type="number" />
              <Field label="12th percentage" value={form.twelfth} onChange={set("twelfth")} type="number" />
            </div>
          </Section>

          <Section
            title="Skills"
            action={
              !addingSkill && (
                <button className="btn-ghost !py-1 text-indigo-600" onClick={() => setAddingSkill(true)}>
                  + Add skill
                </button>
              )
            }
          >
            {addingSkill && (
              <form
                className="mb-4 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  addSkill();
                }}
              >
                <input className="input" placeholder="e.g. React" value={skill} onChange={(e) => setSkill(e.target.value)} maxLength={40} autoFocus aria-label="New skill" />
                <button className="btn-primary" disabled={busy === "skill"}>
                  Add
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => {
                    setAddingSkill(false);
                    setSkill("");
                  }}
                >
                  Cancel
                </button>
              </form>
            )}
            {p.skills.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No skills yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {p.skills.map((k) => (
                  <span key={k} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-0.5 pl-2.5 pr-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                    {k}
                    <button className="grid size-4 place-items-center rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-500/30" aria-label={`Remove ${k}`} onClick={() => removeSkill(k)} disabled={busy === "skill"}>
                      <Icon name="x" className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
