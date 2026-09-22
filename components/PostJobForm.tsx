"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { ErrorState, Notice, Spinner } from "./ui";
import { api, ApiError, errorMessage } from "@/lib/api";
import { BRANCHES, type Job, type JobType } from "@/lib/data";

interface Form {
  role: string;
  type: JobType;
  location: string;
  ctc: string;
  openings: string;
  deadline: string;
  skills: string;
  description: string;
  minCgpa: string;
  branches: string[];
  allowBacklogs: boolean;
}

const blank: Form = {
  role: "",
  type: "Full-time",
  location: "",
  ctc: "",
  openings: "",
  deadline: "",
  skills: "",
  description: "",
  minCgpa: "7.0",
  branches: ["CSE", "IT"],
  allowBacklogs: false,
};

const fromJob = (j: Job): Form => ({
  role: j.role,
  type: j.type,
  location: j.location,
  ctc: String(j.ctc),
  openings: String(j.openings),
  deadline: j.deadline,
  skills: j.skills.join(", "),
  description: j.description,
  minCgpa: String(j.minCgpa),
  branches: j.branches,
  allowBacklogs: j.allowBacklogs,
});

/** Creates a job, or edits the one named by `editId`. Remount (via `key`) when `editId` changes. */
export default function PostJobForm({ editId }: { editId?: string }) {
  const [form, setForm] = useState<Form>(blank);
  const [loading, setLoading] = useState(Boolean(editId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [result, setResult] = useState<"submitted" | "saved" | null>(null);

  useEffect(() => {
    if (!editId) return;
    api
      .get<Job>(`/company/jobs/${editId}`)
      .then((j) => {
        setJob(j);
        setForm(fromJob(j));
      })
      .catch((e) => setLoadError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [editId]);

  // A live job's eligibility criteria are frozen; only deadline, openings, skills and description can change.
  const locked = job?.status === "Open";

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (b: string) => set("branches", form.branches.includes(b) ? form.branches.filter((x) => x !== b) : [...form.branches, b]);
  const err = (k: string) => fields[k] && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{fields[k]}</p>;

  const body = () => ({
    role: form.role,
    type: form.type,
    location: form.location,
    ctc: Number(form.ctc),
    minCgpa: Number(form.minCgpa),
    branches: form.branches,
    skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
    deadline: form.deadline,
    openings: Number(form.openings),
    description: form.description,
    allowBacklogs: form.allowBacklogs,
  });

  const save = async (submit: boolean) => {
    setBusy(true);
    setError(null);
    setFields({});
    try {
      if (job) {
        await api.put(`/company/jobs/${job.id}`, body());
        if (submit) await api.post(`/company/jobs/${job.id}/submit`);
      } else {
        await api.post("/company/jobs", { ...body(), submit });
      }
      setResult(submit ? "submitted" : "saved");
    } catch (e) {
      if (e instanceof ApiError && e.fields) setFields(e.fields);
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;
  if (loadError) return <ErrorState message={loadError} />;

  if (result) {
    return (
      <div className="card mx-auto max-w-lg p-10 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
          <Icon name="check" className="size-7" />
        </span>
        <h2 className="mt-4 text-xl font-semibold">{result === "submitted" ? "Submitted for approval" : job?.status === "Open" ? "Changes saved" : "Draft saved"}</h2>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          {result === "submitted"
            ? "The placement cell will review your posting. It goes live to eligible students once approved."
            : job?.status === "Open"
              ? "Your posting has been updated."
              : "Only you can see this draft. Submit it for approval from your postings when it's ready."}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {!job && (
            <button
              className="btn-outline"
              onClick={() => {
                setResult(null);
                setForm(blank);
              }}
            >
              Post another
            </button>
          )}
          <Link href="/companies/jobs" className="btn-primary">
            View postings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      className="grid gap-6 lg:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        void save(job?.status !== "Open");
      }}
    >
      <div className="card space-y-4 p-5 lg:col-span-2">
        <h2 className="font-semibold">Role details</h2>
        {locked && <Notice tone="success">This job is live, so its title, type, pay and eligibility are locked. You can still change the deadline, openings, skills and description.</Notice>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="role">Job title</label>
            <input id="role" className="input" placeholder="e.g. Software Engineer" value={form.role} onChange={(e) => set("role", e.target.value)} disabled={locked} required />
            {err("role")}
          </div>
          <div>
            <label className="label" htmlFor="type">Type</label>
            <select id="type" className="input" value={form.type} onChange={(e) => set("type", e.target.value as JobType)} disabled={locked}>
              <option>Full-time</option>
              <option>Internship</option>
            </select>
            {err("type")}
          </div>
          <div>
            <label className="label" htmlFor="location">Location</label>
            <input id="location" className="input" placeholder="Bengaluru / Remote" value={form.location} onChange={(e) => set("location", e.target.value)} disabled={locked} required />
            {err("location")}
          </div>
          <div>
            <label className="label" htmlFor="ctc">CTC (LPA) / annualised stipend</label>
            <input id="ctc" className="input" type="number" min="0" step="0.1" placeholder="12" value={form.ctc} onChange={(e) => set("ctc", e.target.value)} disabled={locked} required />
            {err("ctc")}
          </div>
          <div>
            <label className="label" htmlFor="openings">Openings</label>
            <input id="openings" className="input" type="number" min="1" placeholder="5" value={form.openings} onChange={(e) => set("openings", e.target.value)} required />
            {err("openings")}
          </div>
          <div>
            <label className="label" htmlFor="deadline">Application deadline</label>
            <input id="deadline" className="input" type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} required />
            {err("deadline")}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="skills">Required skills</label>
          <input id="skills" className="input" placeholder="Comma separated — React, Node.js, SQL" value={form.skills} onChange={(e) => set("skills", e.target.value)} />
          {err("skills")}
        </div>
        <div>
          <label className="label" htmlFor="desc">Description</label>
          <textarea id="desc" className="input min-h-32" placeholder="What will the candidate work on?" value={form.description} onChange={(e) => set("description", e.target.value)} required />
          {err("description")}
        </div>
      </div>

      <div className="space-y-6">
        <div className="card space-y-4 p-5">
          <h2 className="font-semibold">Eligibility</h2>
          <div>
            <label className="label" htmlFor="cgpa">Minimum CGPA</label>
            <input id="cgpa" className="input" type="number" min="0" max="10" step="0.1" value={form.minCgpa} onChange={(e) => set("minCgpa", e.target.value)} disabled={locked} />
            {err("minCgpa")}
          </div>
          <fieldset disabled={locked}>
            <legend className="label">Eligible branches</legend>
            <div className="flex flex-wrap gap-2">
              {BRANCHES.map((b) => {
                const on = form.branches.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(b)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors disabled:opacity-60 ${
                      on
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
            {err("branches")}
          </fieldset>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-indigo-600" checked={form.allowBacklogs} onChange={(e) => set("allowBacklogs", e.target.checked)} disabled={locked} /> Allow students with active backlogs
          </label>
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex gap-2">
          {locked ? (
            <button type="submit" className="btn-primary flex-1" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </button>
          ) : (
            <>
              <button type="button" className="btn-outline flex-1" disabled={busy} onClick={() => save(false)}>
                Save draft
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={busy}>
                {busy ? "Working…" : "Submit for approval"}
              </button>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
